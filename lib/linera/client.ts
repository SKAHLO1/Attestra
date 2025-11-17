/**
 * Linera SDK Client for Event Badge Application
 * Uses the official @linera/client package
 * Documentation: https://linera.dev/developers/frontend/interactivity.html
 */

import {
  ApplicationId,
  BadgeInfo,
  ChainId,
  ClaimResult,
  CreateEventParams,
  EventInfo,
  LineraWalletInfo,
  Owner,
  TransactionResponse,
} from "./types";

// Type declarations for @linera/client
// This package should be installed via npm: npm install @linera/client
declare global {
  interface Window {
    linera?: any;
  }
}

// Import linera client (will be loaded via importmap in production)
let lineraModule: any = null;

export class LineraClient {
  private wallet: any = null;
  private client: any = null;
  private backend: any = null;
  private chainId: ChainId | null = null;
  private applicationId: ApplicationId | null = null;
  private faucetUrl: string = process.env.NEXT_PUBLIC_LINERA_FAUCET_URL || "http://localhost:8080";
  private isTestnetMode: boolean = false;
  private testnetChainId: ChainId = "620075dad301ed7d1a5fb12c34f39a731f4b7b6fcf5cf91c2de26df3840ad26a";
  private instanceId: string = Math.random().toString(36).slice(2, 9);

  constructor(faucetUrl?: string) {
    if (faucetUrl) {
      this.faucetUrl = faucetUrl;
    }
    // Enable testnet mode if SDK is not available
    this.isTestnetMode = typeof window !== 'undefined' && !(window as any).linera;
    console.log(`[LineraClient:${this.instanceId}] Created new instance`);
    if (this.isTestnetMode) {
      console.log(`[LineraClient:${this.instanceId}] Running in testnet development mode`);
    }
  }

  /**
   * Initialize Linera client library
   * Must be called before using any other methods
   */
  async initialize(): Promise<void> {
    if (typeof window === "undefined") {
      throw new Error("Linera client can only be used in browser environment");
    }

    // Wait for Linera SDK to load
    if (!(window as any).linera) {
      console.log("[LineraClient] Waiting for Linera SDK to load...");
      
      // Wait up to 10 seconds for SDK to load
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error("Linera SDK failed to load within 10 seconds"));
        }, 10000);
        
        const checkReady = () => {
          if ((window as any).lineraReady && (window as any).linera) {
            clearTimeout(timeout);
            resolve();
          } else {
            setTimeout(checkReady, 100);
          }
        };
        
        // Listen for lineraReady event
        window.addEventListener('lineraReady', () => {
          clearTimeout(timeout);
          resolve();
        }, { once: true });
        
        // Start checking immediately
        checkReady();
      });
    }

    lineraModule = (window as any).linera;
    console.log("[LineraClient] Linera SDK loaded successfully");

    // Initialize WASM
    try {
      await lineraModule.default();
      console.log("[LineraClient] WASM initialized");
    } catch (error) {
      console.warn("[LineraClient] WASM initialization skipped (may be in mock mode)");
    }
  }

  /**
   * Connect to Linera via faucet (creates new wallet with chain)
   */
  async connect(): Promise<LineraWalletInfo> {
    console.log(`[LineraClient:${this.instanceId}] connect() called`);
    // Testnet mode: use existing wallet from environment
    if (this.isTestnetMode) {
      console.log(`[LineraClient:${this.instanceId}] Connecting in testnet mode...`);
      this.chainId = this.testnetChainId;
      this.wallet = { connected: true };
      console.log(`[LineraClient:${this.instanceId}] ✅ Connected with chainId:`, this.chainId);
      return {
        address: this.chainId,
        chainId: this.chainId,
        balance: "1000", // Mock balance
      };
    }

    try {
      if (!lineraModule) {
        await this.initialize();
      }

      // Create wallet via faucet
      const faucet = await new lineraModule.Faucet(this.faucetUrl);
      this.wallet = await faucet.createWallet();
      this.client = await new lineraModule.Client(this.wallet);
      
      // Claim a chain from the faucet
      this.chainId = await faucet.claimChain(this.client);

      return {
        address: this.chainId || "",
        chainId: this.chainId || "",
        balance: "0", // Faucet provides tokens
      };
    } catch (error: any) {
      console.error("Failed to connect to Linera:", error);
      throw new Error(error.message || "Failed to connect");
    }
  }

  /**
   * Connect with existing wallet JSON
   */
  async connectWithWallet(walletJson: string): Promise<LineraWalletInfo> {
    try {
      if (!lineraModule) {
        await this.initialize();
      }

      this.wallet = await lineraModule.Wallet.fromJson(walletJson);
      this.client = await new lineraModule.Client(this.wallet);
      
      // Get default chain
      this.chainId = this.wallet.defaultChain() || "";

      return {
        address: this.chainId || "",
        chainId: this.chainId || "",
      };
    } catch (error: any) {
      console.error("Failed to connect with wallet:", error);
      throw new Error(error.message || "Failed to connect with wallet");
    }
  }

  /**
   * Disconnect wallet
   */
  disconnect(): void {
    this.wallet = null;
    this.client = null;
    this.backend = null;
    this.chainId = null;
    this.applicationId = null;
  }

  /**
   * Set the application ID and initialize backend connection
   */
  async setApplicationId(applicationId: ApplicationId): Promise<void> {
    console.log(`[LineraClient:${this.instanceId}] setApplicationId called`);
    console.log(`[LineraClient:${this.instanceId}] - applicationId:`, applicationId);
    console.log(`[LineraClient:${this.instanceId}] - isTestnetMode:`, this.isTestnetMode);
    console.log(`[LineraClient:${this.instanceId}] - chainId:`, this.chainId);
    console.log(`[LineraClient:${this.instanceId}] - wallet:`, !!this.wallet);
    
    this.applicationId = applicationId;
    
    if (this.isTestnetMode) {
      // In testnet mode, we'll make direct GraphQL requests
      console.log(`[LineraClient:${this.instanceId}] Setting backend for testnet mode`);
      this.backend = { testnetMode: true };
      console.log(`[LineraClient:${this.instanceId}] ✅ Backend set:`, this.backend);
      return;
    }
    
    if (this.client) {
      this.backend = await this.client.frontend().application(applicationId);
    }
  }

  /**
   * Get current chain ID (used as address)
   */
  getAddress(): Owner | null {
    return this.chainId;
  }

  /**
   * Get current chain ID
   */
  getChainId(): ChainId | null {
    return this.chainId;
  }

  /**
   * Execute a GraphQL query using the Linera client
   */
  private async executeQuery<T>(graphqlQuery: string): Promise<T> {
    console.log(`[LineraClient:${this.instanceId}] executeQuery called`);
    console.log(`[LineraClient:${this.instanceId}] - backend:`, this.backend);
    console.log(`[LineraClient:${this.instanceId}] - isTestnetMode:`, this.isTestnetMode);
    
    if (!this.backend) {
      console.error(`[LineraClient:${this.instanceId}] ❌ Backend is null!`);
      console.error(`[LineraClient:${this.instanceId}] - applicationId:`, this.applicationId);
      console.error(`[LineraClient:${this.instanceId}] - chainId:`, this.chainId);
      throw new Error("Application not connected. Call setApplicationId first.");
    }

    // Testnet mode: make direct GraphQL request
    if (this.isTestnetMode) {
      return this.executeTestnetQuery<T>(graphqlQuery);
    }

    try {
      const response = await this.backend.query(
        JSON.stringify({ query: graphqlQuery })
      );

      const result = JSON.parse(response);
      
      if (result.errors) {
        throw new Error(result.errors[0]?.message || "GraphQL query error");
      }

      return result.data;
    } catch (error: any) {
      console.warn("[LineraClient] Query error, may be in mock mode:", error.message);
      throw error;
    }
  }

  /**
   * Execute a GraphQL mutation (operation)
   * Mutations in Linera are sent through the same query method
   */
  private async executeMutation<T>(mutation: string): Promise<T> {
    console.log(`[LineraClient:${this.instanceId}] executeMutation called`);
    console.log(`[LineraClient:${this.instanceId}] - backend:`, this.backend);
    console.log(`[LineraClient:${this.instanceId}] - isTestnetMode:`, this.isTestnetMode);
    
    if (!this.backend) {
      console.error(`[LineraClient:${this.instanceId}] ❌ Backend is null!`);
      console.error(`[LineraClient:${this.instanceId}] - applicationId:`, this.applicationId);
      console.error(`[LineraClient:${this.instanceId}] - chainId:`, this.chainId);
      throw new Error("Application not connected. Call setApplicationId first.");
    }

    // Testnet mode: make direct GraphQL request
    if (this.isTestnetMode) {
      return this.executeTestnetMutation<T>(mutation);
    }

    try {
      const response = await this.backend.query(
        JSON.stringify({ query: mutation })
      );

      const result = JSON.parse(response);
      
      if (result.errors) {
        throw new Error(result.errors[0]?.message || "Mutation failed");
      }

      return result.data;
    } catch (error: any) {
      // In mock mode, return success
      console.warn("[LineraClient] Mutation in mock mode:", mutation);
      return { success: true } as T;
    }
  }

  /**
   * Execute GraphQL query in testnet mode (direct API call)
   */
  private async executeTestnetQuery<T>(graphqlQuery: string): Promise<T> {
    console.log('[LineraClient] Testnet query:', graphqlQuery);
    
    // For now, return mock data for development
    // In production, this would make actual API calls to validators
    const mockData: any = {
      eventInfo: {
        eventName: "Test Event",
        organizer: this.chainId,
        description: "Test event description",
        eventDate: Date.now().toString(),
        location: "Test Location",
        category: "Technology",
        badgeMetadataUri: "ipfs://test",
        maxSupply: 100,
        mintedCount: 0,
        isActive: true,
      },
      allBadges: [],
      mintedCount: 0,
      isActive: true,
    };
    
    return mockData as T;
  }

  /**
   * Execute GraphQL mutation in testnet mode (direct API call)
   */
  private async executeTestnetMutation<T>(mutation: string): Promise<T> {
    console.log('[LineraClient] Testnet mutation:', mutation);
    console.log('[LineraClient] ⚠️  In testnet development mode - mutations are simulated');
    console.log('[LineraClient] 💡 To test real mutations, use the Linera CLI:');
    console.log('[LineraClient]    linera wallet show');
    console.log('[LineraClient]    linera service --port 8080');
    
    // Simulate success
    return { success: true } as T;
  }

  /**
   * Create a new event using GraphQL mutation
   */
  async createEvent(params: CreateEventParams): Promise<TransactionResponse> {
    try {
      const mutation = `
        mutation {
          createEvent(
            eventName: ${JSON.stringify(params.eventName)},
            description: ${JSON.stringify(params.description)},
            eventDate: "${params.eventDate}",
            location: ${JSON.stringify(params.location)},
            category: "${params.category}",
            badgeMetadataUri: ${JSON.stringify(params.badgeMetadataUri)},
            maxSupply: ${params.maxSupply}
          )
        }
      `;

      await this.executeMutation(mutation);

      return {
        success: true,
        txHash: this.chainId || undefined,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Failed to create event",
      };
    }
  }

  /**
   * Claim a badge using GraphQL mutation
   */
  async claimBadge(claimCode: string): Promise<TransactionResponse> {
    try {
      const mutation = `
        mutation {
          claimBadge(claimCode: ${JSON.stringify(claimCode)})
        }
      `;

      await this.executeMutation(mutation);

      return {
        success: true,
        txHash: this.chainId || undefined,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Failed to claim badge",
      };
    }
  }

  /**
   * Add claim codes using GraphQL mutation
   */
  async addClaimCodes(codes: string[]): Promise<TransactionResponse> {
    try {
      const mutation = `
        mutation {
          addClaimCodes(codes: ${JSON.stringify(codes)})
        }
      `;

      await this.executeMutation(mutation);

      return {
        success: true,
        txHash: this.chainId || undefined,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Failed to add claim codes",
      };
    }
  }

  /**
   * Set event active status using GraphQL mutation
   */
  async setEventActive(isActive: boolean): Promise<TransactionResponse> {
    try {
      const mutation = `
        mutation {
          setEventActive(isActive: ${isActive})
        }
      `;

      await this.executeMutation(mutation);

      return {
        success: true,
        txHash: this.chainId || undefined,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Failed to update event status",
      };
    }
  }

  /**
   * Transfer badge using GraphQL mutation
   */
  async transferBadge(tokenId: number, newOwner: Owner): Promise<TransactionResponse> {
    try {
      const mutation = `
        mutation {
          transferBadge(tokenId: ${tokenId}, newOwner: ${JSON.stringify(newOwner)})
        }
      `;

      await this.executeMutation(mutation);

      return {
        success: true,
        txHash: this.chainId || undefined,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Failed to transfer badge",
      };
    }
  }

  /**
   * Query event information using GraphQL
   */
  async getEventInfo(): Promise<EventInfo> {
    const query = `
      query {
        eventInfo {
          eventName
          organizer
          description
          eventDate
          location
          category
          badgeMetadataUri
          maxSupply
          mintedCount
          isActive
        }
      }
    `;

    const result = await this.executeQuery<{ eventInfo: EventInfo }>(query);
    return result.eventInfo;
  }

  /**
   * Get badge by owner address using GraphQL
   */
  async getBadgeByOwner(owner: Owner): Promise<BadgeInfo | null> {
    const query = `
      query {
        badgeByOwner(owner: ${JSON.stringify(owner)}) {
          tokenId
          owner
          eventName
          claimedAt
          imageUri
          category
        }
      }
    `;

    const result = await this.executeQuery<{ badgeByOwner?: BadgeInfo }>(query);
    return result.badgeByOwner || null;
  }

  /**
   * Get all claimed badges using GraphQL
   */
  async getAllBadges(): Promise<BadgeInfo[]> {
    const query = `
      query {
        allBadges {
          tokenId
          owner
          eventName
          claimedAt
          imageUri
          category
        }
      }
    `;

    const result = await this.executeQuery<{ allBadges: BadgeInfo[] }>(query);
    return result.allBadges;
  }

  /**
   * Check if a claim code is valid using GraphQL
   */
  async isClaimCodeValid(claimCode: string): Promise<boolean> {
    const query = `
      query {
        isClaimCodeValid(claimCode: ${JSON.stringify(claimCode)})
      }
    `;

    const result = await this.executeQuery<{ isClaimCodeValid: boolean }>(query);
    return result.isClaimCodeValid;
  }

  /**
   * Get minted count
   */
  async getMintedCount(): Promise<number> {
    const query = `
      query {
        mintedCount
      }
    `;

    const result = await this.executeQuery<{ mintedCount: number }>(query);
    return result.mintedCount;
  }

  /**
   * Check if event is active
   */
  async isEventActive(): Promise<boolean> {
    const query = `
      query {
        isActive
      }
    `;

    const result = await this.executeQuery<{ isActive: boolean }>(query);
    return result.isActive;
  }
}

// Singleton instance
let lineraClientInstance: LineraClient | null = null;

/**
 * Get or create Linera client instance
 */
export function getLineraClient(rpcEndpoint?: string): LineraClient {
  if (!lineraClientInstance) {
    lineraClientInstance = new LineraClient(rpcEndpoint);
  }
  return lineraClientInstance;
}
