import type { AleoWalletInfo, AleoTransaction, BadgeData, EventData } from './types';

export class AleoClient {
  private walletAddress: string | null = null;
  private programId: string;
  private network: string;

  constructor(programId: string = 'velero_attender.aleo', network: string = 'testnet') {
    this.programId = programId;
    this.network = network;
  }

  async connect(): Promise<AleoWalletInfo> {
    try {
      // Check if Leo Wallet is available
      if (typeof window !== 'undefined' && (window as any).leoWallet) {
        const wallet = (window as any).leoWallet;
        
        console.log('[AleoClient] Leo Wallet detected, attempting connection...');
        
        // Leo Wallet connect() doesn't take parameters in the browser extension API
        // It just opens a connection dialog for the user to approve
        console.log('[AleoClient] Calling wallet.connect()...');
        
        // Connect to Leo Wallet - no parameters needed for browser extension
        await wallet.connect();
        
        console.log('[AleoClient] Connection successful, checking publicKey...');
        
        // After connection, the wallet should have publicKey available
        if (wallet.publicKey) {
          this.walletAddress = wallet.publicKey;
          
          console.log('[AleoClient] Successfully connected to address:', wallet.publicKey);
          
          return {
            address: wallet.publicKey,
            network: this.network,
          };
        }
        
        throw new Error('Connection succeeded but no public key available. Please try again.');
      }
      
      throw new Error('Leo Wallet not detected. Please install Leo Wallet extension from https://leo.app/');
    } catch (error: any) {
      console.error('[AleoClient] Connection error:', error);
      console.error('[AleoClient] Error details:', {
        message: error.message,
        stack: error.stack,
        error: error
      });
      
      // Provide more helpful error messages
      if (error.message && error.message.includes('User rejected')) {
        throw new Error('Connection rejected by user. Please approve the connection in Leo Wallet.');
      }
      
      if (error.message && error.message.includes('locked')) {
        throw new Error('Leo Wallet is locked. Please unlock your wallet and try again.');
      }
      
      throw new Error(error.message || 'Failed to connect to Leo Wallet. Please try again.');
    }
  }

  disconnect(): void {
    this.walletAddress = null;
  }

  getAddress(): string | null {
    return this.walletAddress;
  }

  async createEvent(eventId: string, initialSupply: number): Promise<AleoTransaction> {
    if (!this.walletAddress) {
      throw new Error('Wallet not connected');
    }

    try {
      // This would interact with the Aleo wallet to execute the transaction
      // For now, returning a mock transaction structure
      const txId = `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      return {
        id: txId,
        program: this.programId,
        function: 'create_event',
        inputs: [eventId, initialSupply.toString()],
        status: 'pending',
      };
    } catch (error) {
      console.error('Failed to create event:', error);
      throw error;
    }
  }

  async mintBadge(
    eventId: string,
    recipient: string,
    eventName: string,
    badgeId: string,
    category: number
  ): Promise<AleoTransaction> {
    if (!this.walletAddress) {
      throw new Error('Wallet not connected');
    }

    try {
      const txId = `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      return {
        id: txId,
        program: this.programId,
        function: 'mint_badge',
        inputs: [eventId, recipient, eventName, badgeId, category.toString()],
        status: 'pending',
      };
    } catch (error) {
      console.error('Failed to mint badge:', error);
      throw error;
    }
  }

  async transferBadge(badgeId: string, recipient: string): Promise<AleoTransaction> {
    if (!this.walletAddress) {
      throw new Error('Wallet not connected');
    }

    try {
      const txId = `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      return {
        id: txId,
        program: this.programId,
        function: 'transfer_badge',
        inputs: [badgeId, recipient],
        status: 'pending',
      };
    } catch (error) {
      console.error('Failed to transfer badge:', error);
      throw error;
    }
  }

  async verifyBadge(badgeId: string, expectedOwner: string): Promise<boolean> {
    try {
      // This would query the Aleo network to verify badge ownership
      // For now, returning a mock verification
      return true;
    } catch (error) {
      console.error('Failed to verify badge:', error);
      return false;
    }
  }

  async getTransactionStatus(txId: string): Promise<'pending' | 'confirmed' | 'failed'> {
    try {
      // Query transaction status from Aleo network
      // Mock implementation for now
      return 'confirmed';
    } catch (error) {
      console.error('Failed to get transaction status:', error);
      return 'failed';
    }
  }
}

export const getAleoClient = (programId?: string, network?: string): AleoClient => {
  return new AleoClient(programId, network);
};
