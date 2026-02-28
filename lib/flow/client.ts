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
      const user = await fcl.currentUser().snapshot();
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

  async createEvent(eventId: string, maxAttendees: number, ipfsCid: string): Promise<FlowTransaction> {
    try {
      const contractAddress = process.env.NEXT_PUBLIC_FLOW_CONTRACT_ADDRESS || '0xAttestra';
      const transactionId = await fcl.mutate({
        cadence: `
          import AttendanceBadge from ${contractAddress}
          transaction(eventId: String, maxAttendees: UInt64, filecoinCid: String) {
            prepare(signer: auth(Storage) &Account) {
              AttendanceBadge.createEvent(eventId: eventId, maxAttendees: maxAttendees, filecoinCid: filecoinCid, organizer: signer.address)
            }
          }
        `,
        args: (arg: any, t: any) => [
          arg(eventId, t.String),
          arg(String(maxAttendees), t.UInt64),
          arg(ipfsCid, t.String),
        ],
        proposer: fcl.authz as any,
        payer: fcl.authz as any,
        authorizations: [fcl.authz] as any,
        limit: 999,
      });

      return { transactionId, status: 'pending' };
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

  async claimBadge(
    eventId: string,
    claimCode: string,
    ipfsCid: string
  ): Promise<FlowTransaction> {
    try {
      const contractAddress = process.env.NEXT_PUBLIC_FLOW_CONTRACT_ADDRESS || '0xAttestra';
      const transactionId = await fcl.mutate({
        cadence: `
          import AttendanceBadge from ${contractAddress}
          transaction(eventId: String, claimCode: String, filecoinCid: String) {
            prepare(signer: auth(Storage, Capabilities) &Account) {
              AttendanceBadge.claimBadge(
                eventId: eventId,
                claimCode: claimCode,
                filecoinCid: filecoinCid,
                claimer: signer.address
              )
            }
          }
        `,
        args: (arg: any, t: any) => [
          arg(eventId, t.String),
          arg(claimCode, t.String),
          arg(ipfsCid, t.String),
        ],
        proposer: fcl.authz as any,
        payer: fcl.authz as any,
        authorizations: [fcl.authz] as any,
        limit: 999,
      });

      return { transactionId, status: 'pending' };
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
