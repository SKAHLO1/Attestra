import * as fcl from '@onflow/fcl';
import { ec as EC } from 'elliptic';
import { SHA3 } from 'sha3';
import type { FlowWalletInfo, FlowTransaction } from './types';

fcl.config({
  'accessNode.api': process.env.NEXT_PUBLIC_FLOW_ACCESS_NODE || 'https://rest-testnet.onflow.org',
  'discovery.wallet': process.env.NEXT_PUBLIC_FLOW_WALLET_DISCOVERY || 'https://fcl-discovery.onflow.org/testnet/authn',
  'app.detail.title': 'Attestra',
  'app.detail.icon': '/attestra-logo.png',
  'flow.network': process.env.NEXT_PUBLIC_FLOW_NETWORK || 'testnet',
  'walletconnect.projectId': process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '9bd9c657d851d3d9f9eae9641c35f804',
});

// ─── Server-side oracle signer ─────────────────────────────────────────────
// Used by /api/verify to sign the SubmitAIVerification transaction
// with the dedicated oracle account without a browser wallet.

function hashMsgHex(msgHex: string): Buffer {
  const sha = new SHA3(256);
  sha.update(Buffer.from(msgHex, 'hex'));
  return sha.digest();
}

function signWithKey(privateKeyHex: string, msgHex: string): string {
  const ec = new EC('p256');
  const key = ec.keyFromPrivate(Buffer.from(privateKeyHex, 'hex'));
  const sig = key.sign(hashMsgHex(msgHex));
  const n = 32;
  const r = sig.r.toArrayLike(Buffer, 'be', n);
  const s = sig.s.toArrayLike(Buffer, 'be', n);
  return Buffer.concat([r, s]).toString('hex');
}

function getOracleAuthorizer(): (account: any) => Promise<any> {
  const address = process.env.FLOW_ORACLE_ADDRESS;
  const privateKey = process.env.FLOW_ORACLE_PRIVATE_KEY;
  if (!address || !privateKey) {
    throw new Error(
      '[FlowClient] FLOW_ORACLE_ADDRESS and FLOW_ORACLE_PRIVATE_KEY must be set in .env.local'
    );
  }
  return async (account: any): Promise<any> => ({
    ...account,
    tempId: `${address}-0`,
    addr: fcl.withPrefix(address),
    keyId: 0,
    signingFunction: async (signable: any) => ({
      addr: fcl.withPrefix(address),
      keyId: 0,
      signature: signWithKey(privateKey, signable.message),
    }),
  });
}

export class FlowClient {
  private programId: string;

  constructor(programId: string = process.env.NEXT_PUBLIC_FLOW_CONTRACT_ADDRESS || '0xAttestra') {
    this.programId = programId;
  }

  async getCurrentUser(): Promise<FlowWalletInfo | null> {
    try {
      const user = await fcl.currentUser.snapshot();
      if (user.loggedIn && user.addr) {
        return { addr: user.addr, loggedIn: true };
      }
      return null;
    } catch (error) {
      console.error('[FlowClient] Failed to get current user:', error);
      return null;
    }
  }

  async authenticate(): Promise<FlowWalletInfo> {
    try {
      const user = await fcl.authenticate();
      return { addr: user.addr!, loggedIn: true };
    } catch (error: any) {
      console.error('[FlowClient] Authentication error:', error);
      throw new Error(error.message || 'Failed to authenticate with Flow wallet');
    }
  }

  async unauthenticate(): Promise<void> {
    await fcl.unauthenticate();
  }

  async verifyWalletOwnership(): Promise<{ address: string; verified: boolean }> {
    try {
      const user = await fcl.currentUser.snapshot();
      if (!user.loggedIn || !user.addr) {
        throw new Error('Wallet not connected. Please connect your Flow wallet first.');
      }

      // Create a unique challenge message with timestamp to prevent replay attacks
      const nonce = `Attestra wallet ownership verification\nAddress: ${user.addr}\nTimestamp: ${Date.now()}\nNetwork: testnet`;
      const msgHex = Buffer.from(nonce).toString('hex');

      // Request wallet to sign the challenge — this triggers the wallet signing popup
      const compositeSignatures = await fcl.currentUser.signUserMessage(msgHex);

      if (!compositeSignatures || compositeSignatures.length === 0) {
        throw new Error('Wallet signature was rejected or cancelled.');
      }

      // Verify the signature on-chain via FCL AppUtils (non-deprecated API)
      const isValid = await fcl.AppUtils.verifyUserSignatures(msgHex, compositeSignatures as any);

      if (!isValid) {
        throw new Error('Wallet signature verification failed. Could not confirm wallet ownership.');
      }

      console.log(`[FlowClient] Wallet ownership verified for ${user.addr}`);
      return { address: user.addr, verified: true };
    } catch (error: any) {
      console.error('[FlowClient] Wallet ownership verification error:', error);
      throw new Error(error.message || 'Failed to verify wallet ownership');
    }
  }

  async getFlowBalance(address: string): Promise<number> {
    try {
      const balance = await fcl.query({
        cadence: `
          import FungibleToken from 0x9a0766d93b6608b7
          import FlowToken from 0x7e60df042a9c0868

          access(all) fun main(address: Address): UFix64 {
            let account = getAccount(address)
            let vaultRef = account
              .capabilities
              .get<&{FungibleToken.Balance}>(/public/flowTokenBalance)
              .borrow()
            return vaultRef?.balance ?? 0.0
          }
        `,
        args: (arg: any, t: any) => [arg(address, t.Address)],
      });
      return parseFloat(balance as string);
    } catch (error: any) {
      console.error('[FlowClient] Failed to fetch FLOW balance:', error);
      return 0;
    }
  }

  async createEvent(eventId: string, maxAttendees: number, ipfsCid: string): Promise<FlowTransaction> {
    try {
      const contractAddress = process.env.NEXT_PUBLIC_FLOW_CONTRACT_ADDRESS || '0xAttestra';

      // Ensure wallet session is active — triggers popup if not yet connected
      await fcl.authenticate();

      const transactionId = await fcl.mutate({
        cadence: `
          import AttendanceBadge from ${contractAddress}
          import FungibleToken from 0x9a0766d93b6608b7
          import FlowToken from 0x7e60df042a9c0868

          transaction(eventId: String, maxAttendees: UInt64, filecoinCid: String, feeReceiver: Address) {
            let paymentVault: @{FungibleToken.Vault}

            prepare(signer: auth(Storage) &Account) {
              let fee: UFix64 = 100.0
              let vaultRef = signer.storage.borrow<auth(FungibleToken.Withdraw) &FlowToken.Vault>(
                from: /storage/flowTokenVault
              ) ?? panic("Could not borrow FlowToken vault. Ensure you have at least 100 FLOW.")
              self.paymentVault <- vaultRef.withdraw(amount: fee)
              AttendanceBadge.createEvent(eventId: eventId, maxAttendees: maxAttendees, filecoinCid: filecoinCid, organizer: signer.address)
            }

            execute {
              let receiverRef = getAccount(feeReceiver)
                .capabilities.get<&{FungibleToken.Receiver}>(/public/flowTokenReceiver)
                .borrow() ?? panic("Could not borrow FlowToken receiver from contract account.")
              receiverRef.deposit(from: <-self.paymentVault)
            }
          }
        `,
        args: (arg: any, t: any) => [
          arg(eventId, t.String),
          arg(String(maxAttendees), t.UInt64),
          arg(ipfsCid, t.String),
          arg(contractAddress, t.Address),
        ],
        proposer: fcl.authz as any,
        payer: fcl.authz as any,
        authorizations: [fcl.authz] as any,
        limit: 999,
      });

      const sealed = await fcl.tx(transactionId).onceSealed();
      if (sealed.errorMessage) {
        throw new Error(`Transaction failed on-chain: ${sealed.errorMessage}`);
      }

      return { transactionId, status: 'sealed' };
    } catch (error: any) {
      console.error('[FlowClient] Create event error:', error);
      throw new Error(error.message || 'Failed to create event on Flow');
    }
  }

  async mintBadge(
    eventId: string,
    recipient: string,
    ipfsCid: string,
    aiVerificationCid?: string
  ): Promise<FlowTransaction> {
    try {
      const contractAddress = process.env.NEXT_PUBLIC_FLOW_CONTRACT_ADDRESS || '0xAttestra';
      const transactionId = await fcl.mutate({
        cadence: `
          import AttendanceBadge from ${contractAddress}
          transaction(eventId: String, recipient: Address, filecoinCid: String, aiVerificationCid: String) {
            prepare(signer: auth(Storage) &Account) {
              AttendanceBadge.mintBadge(
                eventId: eventId,
                recipient: recipient,
                filecoinCid: filecoinCid,
                aiVerificationCid: aiVerificationCid
              )
            }
          }
        `,
        args: (arg: any, t: any) => [
          arg(eventId, t.String),
          arg(recipient, t.Address),
          arg(ipfsCid, t.String),
          arg(aiVerificationCid || '', t.String),
        ],
        proposer: fcl.authz as any,
        payer: fcl.authz as any,
        authorizations: [fcl.authz] as any,
        limit: 999,
      });

      return { transactionId, status: 'pending' };
    } catch (error: any) {
      console.error('[FlowClient] Mint badge error:', error);
      throw new Error(error.message || 'Failed to mint badge on Flow');
    }
  }

  async payQRCodeFee(count: number): Promise<FlowTransaction> {
    try {
      const contractAddress = process.env.NEXT_PUBLIC_FLOW_CONTRACT_ADDRESS || '0xAttestra';
      const totalFee = (3.0 * count).toFixed(1);
      const transactionId = await fcl.mutate({
        cadence: `
          import FungibleToken from 0x9a0766d93b6608b7
          import FlowToken from 0x7e60df042a9c0868

          transaction(amount: UFix64, contractAddress: Address) {
            let paymentVault: @{FungibleToken.Vault}

            prepare(signer: auth(Storage) &Account) {
              let vaultRef = signer.storage.borrow<auth(FungibleToken.Withdraw) &FlowToken.Vault>(
                from: /storage/flowTokenVault
              ) ?? panic("Could not borrow FlowToken vault. Ensure you have enough FLOW.")
              self.paymentVault <- vaultRef.withdraw(amount: amount)
            }

            execute {
              let receiverRef = getAccount(contractAddress)
                .capabilities.get<&{FungibleToken.Receiver}>(/public/flowTokenReceiver)
                .borrow() ?? panic("Could not borrow FlowToken receiver from contract account.")
              receiverRef.deposit(from: <-self.paymentVault)
            }
          }
        `,
        args: (arg: any, t: any) => [
          arg(totalFee, t.UFix64),
          arg(contractAddress, t.Address),
        ],
        proposer: fcl.authz as any,
        payer: fcl.authz as any,
        authorizations: [fcl.authz] as any,
        limit: 999,
      });

      const sealed = await fcl.tx(transactionId).onceSealed();
      if (sealed.errorMessage) {
        throw new Error(`Transaction failed on-chain: ${sealed.errorMessage}`);
      }

      return { transactionId, status: 'sealed' };
    } catch (error: any) {
      console.error('[FlowClient] Pay QR code fee error:', error);
      throw new Error(error.message || 'Failed to pay QR code fee');
    }
  }

  async claimBadge(
    eventId: string,
    claimCode: string,
    ipfsCid: string
  ): Promise<FlowTransaction> {
    try {
      const contractAddress = process.env.NEXT_PUBLIC_FLOW_CONTRACT_ADDRESS || '0xAttestra';

      // Ensure wallet session is active — wallet will show 3 FLOW fee confirmation
      await fcl.authenticate();

      const transactionId = await fcl.mutate({
        cadence: `
          import AttendanceBadge from ${contractAddress}
          import FungibleToken from 0x9a0766d93b6608b7
          import FlowToken from 0x7e60df042a9c0868

          transaction(eventId: String, claimCode: String, filecoinCid: String, feeReceiver: Address) {
            let paymentVault: @{FungibleToken.Vault}

            prepare(signer: auth(Storage, Capabilities) &Account) {
              let fee: UFix64 = 3.0
              let vaultRef = signer.storage.borrow<auth(FungibleToken.Withdraw) &FlowToken.Vault>(
                from: /storage/flowTokenVault
              ) ?? panic("Could not borrow FlowToken vault. Ensure you have at least 3 FLOW.")
              self.paymentVault <- vaultRef.withdraw(amount: fee)

              if signer.storage.borrow<&AttendanceBadge.Collection>(from: AttendanceBadge.CollectionStoragePath) == nil {
                let collection <- AttendanceBadge.createEmptyCollection()
                signer.storage.save(<-collection, to: AttendanceBadge.CollectionStoragePath)
                let cap = signer.capabilities.storage.issue<&AttendanceBadge.Collection>(AttendanceBadge.CollectionStoragePath)
                signer.capabilities.publish(cap, at: AttendanceBadge.CollectionPublicPath)
              }

              AttendanceBadge.claimBadge(
                eventId: eventId,
                claimCode: claimCode,
                filecoinCid: filecoinCid,
                claimer: signer.address
              )
            }

            execute {
              let receiverRef = getAccount(feeReceiver)
                .capabilities.get<&{FungibleToken.Receiver}>(/public/flowTokenReceiver)
                .borrow() ?? panic("Could not borrow FlowToken receiver from contract account.")
              receiverRef.deposit(from: <-self.paymentVault)
            }
          }
        `,
        args: (arg: any, t: any) => [
          arg(eventId, t.String),
          arg(claimCode, t.String),
          arg(ipfsCid, t.String),
          arg(contractAddress, t.Address),
        ],
        proposer: fcl.authz as any,
        payer: fcl.authz as any,
        authorizations: [fcl.authz] as any,
        limit: 999,
      });

      const sealed = await fcl.tx(transactionId).onceSealed();
      if (sealed.errorMessage) {
        throw new Error(`Transaction failed on-chain: ${sealed.errorMessage}`);
      }

      return { transactionId, status: 'sealed' };
    } catch (error: any) {
      console.error('[FlowClient] Claim badge error:', error);
      throw new Error(error.message || 'Failed to claim badge on Flow');
    }
  }

  async submitAIVerification(
    eventId: string,
    proofHash: string,
    filecoinCid: string
  ): Promise<FlowTransaction> {
    try {
      const contractAddress = process.env.NEXT_PUBLIC_FLOW_CONTRACT_ADDRESS || '0xAttestra';
      // Use the server-side oracle authorizer — no browser wallet needed
      const oracleAuthz = getOracleAuthorizer();
      const transactionId = await fcl.mutate({
        cadence: `
          import AttendanceBadge from ${contractAddress}
          transaction(eventId: String, proofHash: String, filecoinCid: String) {
            prepare(signer: auth(Storage) &Account) {
              AttendanceBadge.submitAIVerification(
                eventId: eventId,
                proofHash: proofHash,
                filecoinCid: filecoinCid,
                oracle: signer.address
              )
            }
          }
        `,
        args: (arg: any, t: any) => [
          arg(eventId, t.String),
          arg(proofHash, t.String),
          arg(filecoinCid, t.String),
        ],
        proposer: oracleAuthz as any,
        payer: oracleAuthz as any,
        authorizations: [oracleAuthz] as any,
        limit: 999,
      });

      return { transactionId, status: 'pending' };
    } catch (error: any) {
      console.error('[FlowClient] AI verification submission error:', error);
      throw new Error(error.message || 'Failed to submit AI verification on Flow');
    }
  }

  async getTransactionStatus(transactionId: string): Promise<FlowTransaction> {
    try {
      const result = await fcl.tx(transactionId).onceSealed();
      return {
        transactionId,
        status: result.errorMessage ? 'failed' : 'sealed',
        errorMessage: result.errorMessage,
      };
    } catch (error: any) {
      return { transactionId, status: 'failed', errorMessage: error.message };
    }
  }
}

let flowClientInstance: FlowClient | null = null;

export function getFlowClient(programId?: string): FlowClient {
  if (!flowClientInstance) {
    flowClientInstance = new FlowClient(programId);
  }
  return flowClientInstance;
}
