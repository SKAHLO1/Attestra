/**
 * CheCko Wallet Extension Adapter
 * Adapts the CheCko browser extension API to work with our LineraClient interface
 * 
 * CheCko Extension: https://github.com/respeer-ai/linera-wallet
 */

import { LineraWalletInfo, Owner, ChainId } from "./types";

// CheCko extension types
interface CheckoProvider {
  requestAccounts: () => Promise<string[]>;
  getChainId: () => Promise<string>;
  request: (args: { method: string; params?: any[] }) => Promise<any>;
  on?: (event: string, handler: (...args: any[]) => void) => void;
  removeListener?: (event: string, handler: (...args: any[]) => void) => void;
}

declare global {
  interface Window {
    linera?: CheckoProvider;
    lineraExtension?: CheckoProvider;
  }
}

export class CheckoWalletAdapter {
  private provider: CheckoProvider | null = null;
  private accounts: string[] = [];
  private chainId: ChainId | null = null;

  /**
   * Check if CheCko extension is installed
   */
  static isInstalled(): boolean {
    if (typeof window === 'undefined') return false;
    
    // Check for CheCko extension provider
    return !!(window.linera?.requestAccounts || window.lineraExtension?.requestAccounts);
  }

  /**
   * Get the CheCko provider instance
   */
  private getProvider(): CheckoProvider {
    if (typeof window === 'undefined') {
      throw new Error('CheCko extension only available in browser');
    }

    // Try both possible injection points
    const provider = window.linera || window.lineraExtension;
    
    if (!provider || !provider.requestAccounts) {
      throw new Error('CheCko extension not found. Please install the CheCko wallet extension.');
    }

    return provider;
  }

  /**
   * Connect to CheCko wallet extension
   */
  async connect(): Promise<LineraWalletInfo> {
    try {
      this.provider = this.getProvider();
      
      console.log('[CheckoAdapter] Requesting accounts from extension...');
      
      // Request account access (similar to MetaMask's eth_requestAccounts)
      this.accounts = await this.provider.requestAccounts();
      
      if (!this.accounts || this.accounts.length === 0) {
        throw new Error('No accounts found in CheCko wallet');
      }

      // Get chain ID
      try {
        this.chainId = await this.provider.getChainId();
      } catch (error) {
        console.warn('[CheckoAdapter] Could not get chain ID:', error);
        // Use first account as chain ID fallback
        this.chainId = this.accounts[0];
      }

      console.log('[CheckoAdapter] ✅ Connected to CheCko wallet');
      console.log('[CheckoAdapter] Accounts:', this.accounts);
      console.log('[CheckoAdapter] Chain ID:', this.chainId);

      // Set up event listeners for account/chain changes
      this.setupEventListeners();

      return {
        address: this.accounts[0],
        chainId: this.chainId || this.accounts[0],
        balance: undefined, // Balance will be fetched separately
      };
    } catch (error: any) {
      console.error('[CheckoAdapter] Connection failed:', error);
      throw new Error(`Failed to connect to CheCko wallet: ${error.message}`);
    }
  }

  /**
   * Set up event listeners for wallet changes
   */
  private setupEventListeners(): void {
    if (!this.provider?.on) return;

    // Listen for account changes
    this.provider.on('accountsChanged', (accounts: string[]) => {
      console.log('[CheckoAdapter] Accounts changed:', accounts);
      this.accounts = accounts;
      
      // Trigger reconnection or update
      if (accounts.length === 0) {
        this.disconnect();
      }
    });

    // Listen for chain changes
    this.provider.on('chainChanged', (chainId: string) => {
      console.log('[CheckoAdapter] Chain changed:', chainId);
      this.chainId = chainId;
      // In a real app, you'd want to reload or update the UI
      window.location.reload();
    });
  }

  /**
   * Disconnect from wallet
   */
  disconnect(): void {
    this.provider = null;
    this.accounts = [];
    this.chainId = null;
  }

  /**
   * Get current account address
   */
  getAddress(): Owner | null {
    return this.accounts[0] || null;
  }

  /**
   * Get current chain ID
   */
  getChainId(): ChainId | null {
    return this.chainId;
  }

  /**
   * Execute a GraphQL query through the extension
   * This adapts our GraphQL queries to work with CheCko's RPC methods
   */
  async executeQuery<T>(query: string, applicationId: string): Promise<T> {
    if (!this.provider) {
      throw new Error('Not connected to CheCko wallet');
    }

    try {
      // CheCko may provide a direct GraphQL method
      const result = await this.provider.request({
        method: 'linera_graphql',
        params: [applicationId, query]
      });

      return result as T;
    } catch (error: any) {
      // Fallback: try to parse as standard JSON-RPC
      console.warn('[CheckoAdapter] GraphQL query failed, trying RPC fallback:', error);
      throw error;
    }
  }

  /**
   * Execute a mutation (operation) through the extension
   */
  async executeMutation<T>(mutation: string, applicationId: string): Promise<T> {
    if (!this.provider) {
      throw new Error('Not connected to CheCko wallet');
    }

    try {
      // CheCko will handle signing and submitting the operation
      const result = await this.provider.request({
        method: 'linera_mutate',
        params: [applicationId, mutation]
      });

      return result as T;
    } catch (error: any) {
      console.error('[CheckoAdapter] Mutation failed:', error);
      throw new Error(`Mutation failed: ${error.message}`);
    }
  }

  /**
   * Sign a message with the wallet
   */
  async signMessage(message: string): Promise<string> {
    if (!this.provider) {
      throw new Error('Not connected to CheCko wallet');
    }

    try {
      const signature = await this.provider.request({
        method: 'linera_sign',
        params: [this.accounts[0], message]
      });

      return signature;
    } catch (error: any) {
      throw new Error(`Failed to sign message: ${error.message}`);
    }
  }
}
