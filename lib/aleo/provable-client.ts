/**
 * Aleo Provable SDK Client
 * Direct interaction with Aleo blockchain using Provable SDK
 */

import { 
  Account, 
  AleoNetworkClient, 
  NetworkRecordProvider, 
  ProgramManager 
} from '@provablehq/sdk/testnet.js';

// Initialize thread pool for better performance (call once at app start)
let threadPoolInitialized = false;

export async function initializeProvableSDK() {
  if (threadPoolInitialized) return;
  
  try {
    const { initThreadPool } = await import('@provablehq/sdk/testnet.js');
    await initThreadPool();
    threadPoolInitialized = true;
    console.log('[ProvableSDK] Thread pool initialized');
  } catch (error) {
    console.warn('[ProvableSDK] Failed to initialize thread pool:', error);
  }
}

export interface ProvableTransactionResult {
  transactionId: string;
  status: 'pending' | 'confirmed' | 'failed';
  error?: string;
}

export class ProvableAleoClient {
  private networkClient: AleoNetworkClient;
  private programManager: ProgramManager | null = null;
  private account: Account | null = null;
  
  constructor() {
    // Connect to Aleo testnet
    this.networkClient = new AleoNetworkClient('https://api.explorer.provable.com/v1');
  }

  /**
   * Set the user's account for signing transactions
   */
  async setAccount(privateKey: string) {
    try {
      this.account = new Account({ privateKey });
      
      const recordProvider = new NetworkRecordProvider(this.account, this.networkClient);
      this.programManager = new ProgramManager(
        'https://api.explorer.provable.com/v1',
        undefined,
        recordProvider
      );
      
      this.programManager.setAccount(this.account);
      
      console.log('[ProvableSDK] Account set:', this.account.address().to_string());
      return this.account.address().to_string();
    } catch (error) {
      console.error('[ProvableSDK] Failed to set account:', error);
      throw new Error('Failed to initialize account');
    }
  }

  /**
   * Execute a transition on an Aleo program
   */
  async executeTransaction(
    programId: string,
    functionName: string,
    inputs: string[],
    fee: number = 1000000 // 1.0 credits default
  ): Promise<ProvableTransactionResult> {
    if (!this.programManager || !this.account) {
      throw new Error('Account not initialized. Call setAccount() first.');
    }

    try {
      console.log('[ProvableSDK] Executing transaction:', {
        program: programId,
        function: functionName,
        inputs,
        fee
      });

      // Execute the program function
      const txId = await this.programManager.execute({
        programName: programId,
        functionName: functionName,
        fee: fee,
        privateFee: false,
        inputs: inputs
      });

      console.log('[ProvableSDK] Transaction submitted:', txId);

      return {
        transactionId: txId,
        status: 'pending'
      };
    } catch (error: any) {
      console.error('[ProvableSDK] Transaction failed:', error);
      return {
        transactionId: '',
        status: 'failed',
        error: error.message || 'Transaction execution failed'
      };
    }
  }

  /**
   * Create an event on the blockchain
   */
  async createEvent(eventId: string, maxAttendees: number): Promise<ProvableTransactionResult> {
    const programId = process.env.NEXT_PUBLIC_ALEO_PROGRAM_ID || 'velero_attender.aleo';
    
    // Convert to field and u64 format
    const eventIdHash = Math.abs(
      `${Date.now()}${eventId}`.split('').reduce((acc, char) => {
        return ((acc << 5) - acc) + char.charCodeAt(0);
      }, 0)
    );

    return this.executeTransaction(
      programId,
      'create_event',
      [`${eventIdHash}field`, `${maxAttendees}u64`],
      1000000 // 1.0 credits
    );
  }

  /**
   * Claim a badge on the blockchain
   */
  async claimBadge(
    eventId: string,
    claimCode: string
  ): Promise<ProvableTransactionResult> {
    const programId = process.env.NEXT_PUBLIC_ALEO_PROGRAM_ID || 'velero_attender.aleo';
    
    // Generate hashes for event and badge
    const eventIdHash = Math.abs(
      eventId.split('').reduce((acc: number, char: string) => {
        return ((acc << 5) - acc) + char.charCodeAt(0);
      }, 0)
    );

    const badgeIdHash = Math.abs(
      `${claimCode}${Date.now()}`.split('').reduce((acc, char) => {
        return ((acc << 5) - acc) + char.charCodeAt(0);
      }, 0)
    );

    return this.executeTransaction(
      programId,
      'claim_badge',
      [
        `${eventIdHash}field`,
        `${badgeIdHash}field`,
        `${Date.now()}u64`
      ],
      1000000 // 1.0 credits
    );
  }

  /**
   * Get transaction status
   */
  async getTransactionStatus(txId: string): Promise<string> {
    try {
      const response = await fetch(
        `https://api.explorer.provable.com/v1/testnet/transaction/${txId}`
      );
      
      if (response.ok) {
        const data = await response.json();
        return data.status || 'pending';
      }
      
      return 'pending';
    } catch (error) {
      console.error('[ProvableSDK] Failed to get transaction status:', error);
      return 'unknown';
    }
  }
}

// Singleton instance
let provableClient: ProvableAleoClient | null = null;

export function getProvableClient(): ProvableAleoClient {
  if (!provableClient) {
    provableClient = new ProvableAleoClient();
  }
  return provableClient;
}
