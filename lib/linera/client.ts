/**
 * Linera SDK Client for Event Badge Application
 * Uses the official @linera/client package
 * Documentation: https://linera.dev/developers/frontend/interactivity.html
 */

import {
  initialize,
  Client,
  Wallet,
  Faucet,
  Application,
  PrivateKeySigner,
  type Signer,
} from "@linera/client";

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

// Track WASM initialization
let wasmInitialized = false;

export class LineraClient {
  private wallet: Wallet | null = null;
  private client: Client | null = null;
  private signer: Signer | null = null;
  private application: Application | null = null;
  private chainId: ChainId | null = null;
  private applicationId: ApplicationId | null = null;
  private faucetUrl: string = process.env.NEXT_PUBLIC_LINERA_FAUCET_URL || "https://faucet.conway.linera.io";
  private instanceId: string = Math.random().toString(36).slice(2, 9);

  constructor(faucetUrl?: string) {
    if (faucetUrl) {
      this.faucetUrl = faucetUrl;
    }
    console.log(`[LineraClient:${this.instanceId}] Created new instance`);
    console.log(`[LineraClient:${this.instanceId}] Faucet URL:`, this.faucetUrl);
  }

  /**
   * Initialize Linera WASM module
   * Must be called before using any other methods
   */
  async initialize(): Promise<void> {
    if (typeof window === "undefined") {
      throw new Error("Linera client can only be used in browser environment");
    }

    if (wasmInitialized) {
      console.log("[LineraClient] WASM already initialized");
      return;
    }

    try {
      console.log("[LineraClient] Initializing WASM module...");
      await initialize();
      wasmInitialized = true;
      console.log("[LineraClient] ✅ WASM initialized successfully");
    } catch (error) {
      console.error("[LineraClient] ❌ Failed to initialize WASM:", error);
      throw new Error("Failed to initialize Linera WASM module");
    }
  }

  /**
   * Connect to Linera via faucet (creates new wallet with chain)
   */
  async connect(): Promise<LineraWalletInfo> {
    console.log(`[LineraClient:${this.instanceId}] connect() called`);

    try {
      if (!wasmInitialized) {
        await this.initialize();
      }

      console.log(`[LineraClient:${this.instanceId}] Creating wallet from faucet...`);
      const faucet = new Faucet(this.faucetUrl);
      this.wallet = await faucet.createWallet();
      
      console.log(`[LineraClient:${this.instanceId}] Wallet created, creating signer...`);
      // Create a random private key signer for development
      this.signer = PrivateKeySigner.createRandom();
      const owner = this.signer.address();
      
      console.log(`[LineraClient:${this.instanceId}] Claiming chain from faucet...`);
      // Claim a chain from the faucet
      this.chainId = await faucet.claimChain(this.wallet, owner);
      
      console.log(`[LineraClient:${this.instanceId}] Creating client...`);
      // Create client (skip_process_inbox = false for normal operation)
      this.client = new Client(this.wallet, this.signer, false);
      
      console.log(`[LineraClient:${this.instanceId}] ✅ Connected with chainId:`, this.chainId);
      
      // Get balance
      const balance = await this.client.balance();

      return {
        address: owner,
        chainId: this.chainId || "",
        balance: balance || "0",
      };
    } catch (error: any) {
      console.error("[LineraClient] Failed to connect:", error);
      throw new Error(error.message || "Failed to connect to Linera");
    }
  }

  /**
   * Connect with existing private key
   */
  async connectWithPrivateKey(privateKey: string): Promise<LineraWalletInfo> {
    try {
      if (!wasmInitialized) {
        await this.initialize();
      }

      console.log(`[LineraClient:${this.instanceId}] Connecting with private key...`);
      
      // Create signer from private key
      this.signer = new PrivateKeySigner(privateKey);
      const owner = this.signer.address();
      
      // Create wallet from faucet
      const faucet = new Faucet(this.faucetUrl);
      this.wallet = await faucet.createWallet();
      
      // Create client
      this.client = new Client(this.wallet, this.signer, false);
      
      // Get identity to determine chain ID
      const identity = await this.client.identity();
      this.chainId = identity.chainId || null;
      
      const balance = await this.client.balance();

      return {
        address: owner,
        chainId: this.chainId || "",
        balance: balance || "0",
      };
    } catch (error: any) {
      console.error("[LineraClient] Failed to connect with private key:", error);
      throw new Error(error.message || "Failed to connect with private key");
    }
  }

  /**
   * Disconnect wallet
   */
  disconnect(): void {
    this.wallet = null;
    this.client = null;
    this.signer = null;
    this.application = null;
    this.chainId = null;
    this.applicationId = null;
    console.log(`[LineraClient:${this.instanceId}] Disconnected`);
  }

  /**
   * Set the application ID and initialize application connection
   */
  async setApplicationId(applicationId: ApplicationId): Promise<void> {
    console.log(`[LineraClient:${this.instanceId}] setApplicationId called`);
    console.log(`[LineraClient:${this.instanceId}] - applicationId:`, applicationId);
    
    if (!this.client) {
      throw new Error("Client not connected. Call connect() first.");
    }
    
    this.applicationId = applicationId;
    
    try {
      console.log(`[LineraClient:${this.instanceId}] Getting application...`);
      this.application = await this.client.application(applicationId);
      console.log(`[LineraClient:${this.instanceId}] ✅ Application connected`);
    } catch (error: any) {
      console.error(`[LineraClient:${this.instanceId}] Failed to connect to application:`, error);
      throw new Error(`Failed to connect to application: ${error.message}`);
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
   * Execute a GraphQL query using the Linera Application API
   */
  private async executeQuery<T>(graphqlQuery: string): Promise<T> {
    console.log(`[LineraClient:${this.instanceId}] executeQuery called`);
    
    if (!this.application) {
      console.error(`[LineraClient:${this.instanceId}] ❌ Application is null!`);
      throw new Error("Application not connected. Call setApplicationId first.");
    }

    try {
      // Application.query() expects a GraphQL query string
      const response = await this.application.query(graphqlQuery);
      const result = JSON.parse(response);
      
      if (result.errors) {
        throw new Error(result.errors[0]?.message || "GraphQL query error");
      }

      return result.data;
    } catch (error: any) {
      console.error("[LineraClient] Query error:", error);
      throw error;
    }
  }

  /**
   * Execute a GraphQL mutation (operation)
   * Mutations in Linera are sent through the same query method
   */
  private async executeMutation<T>(mutation: string): Promise<T> {
    console.log(`[LineraClient:${this.instanceId}] executeMutation called`);
    
    if (!this.application) {
      console.error(`[LineraClient:${this.instanceId}] ❌ Application is null!`);
      throw new Error("Application not connected. Call setApplicationId first.");
    }

    try {
      // Application.query() handles both queries and mutations
      const response = await this.application.query(mutation);
      const result = JSON.parse(response);
      
      if (result.errors) {
        throw new Error(result.errors[0]?.message || "Mutation failed");
      }

      return result.data;
    } catch (error: any) {
      console.error("[LineraClient] Mutation error:", error);
      throw error;
    }
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
