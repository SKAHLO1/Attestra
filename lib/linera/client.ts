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
  private faucetUrl: string = "https://faucet.testnet-conway.linera.net";

  constructor(faucetUrl?: string) {
    if (faucetUrl) {
      this.faucetUrl = faucetUrl;
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

    // Load linera module from window (loaded via importmap)
    if ((window as any).linera) {
      lineraModule = (window as any).linera;
    } else {
      throw new Error("@linera/client not loaded. Add importmap to HTML head.");
    }

    // Initialize WASM
    await lineraModule.default();
  }

  /**
   * Connect to Linera via faucet (creates new wallet with chain)
   */
  async connect(): Promise<LineraWalletInfo> {
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
    this.applicationId = applicationId;
    
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
    if (!this.backend) {
      throw new Error("Application not connected. Call setApplicationId first.");
    }

    const response = await this.backend.query(
      JSON.stringify({ query: graphqlQuery })
    );

    const result = JSON.parse(response);
    
    if (result.errors) {
      throw new Error(result.errors[0]?.message || "GraphQL query error");
    }

    return result.data;
  }

  /**
   * Execute a GraphQL mutation (operation)
   * Mutations in Linera are sent through the same query method
   */
  private async executeMutation<T>(mutation: string): Promise<T> {
    if (!this.backend) {
      throw new Error("Application not connected. Call setApplicationId first.");
    }

    const response = await this.backend.query(
      JSON.stringify({ query: mutation })
    );

    const result = JSON.parse(response);
    
    if (result.errors) {
      throw new Error(result.errors[0]?.message || "Mutation failed");
    }

    return result.data;
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
