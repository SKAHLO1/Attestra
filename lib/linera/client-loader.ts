/**
 * Client-side lazy loader for Linera SDK
 * Uses SDK loaded via import map from /public/linera-sdk
 */

import type { LineraClient } from "./client";

let clientInstance: LineraClient | null = null;
let clientPromise: Promise<LineraClient> | null = null;

/**
 * Wait for SDK to load from import map
 */
async function waitForSDK(): Promise<void> {
  if (typeof window === "undefined") {
    throw new Error("Linera client can only be initialized in browser environment");
  }

  // Check if already loaded
  if ((window as any).lineraReady && window.linera) {
    return;
  }

  console.log("[ClientLoader] Waiting for Linera SDK to load from import map...");

  // Wait for lineraReady event
  return new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error("Linera SDK failed to load within 30 seconds"));
    }, 30000);

    const checkReady = () => {
      if ((window as any).lineraReady && window.linera) {
        clearTimeout(timeout);
        resolve();
      }
    };

    // Listen for event
    window.addEventListener('lineraReady', () => {
      clearTimeout(timeout);
      resolve();
    }, { once: true });

    // Check immediately in case already loaded
    checkReady();
  });
}

/**
 * Initialize Linera client using SDK from import map
 * Only runs in browser environment
 */
export async function getLineraClient(faucetUrl?: string): Promise<LineraClient> {
  // Return existing instance if available
  if (clientInstance) {
    return clientInstance;
  }

  // Return in-progress initialization
  if (clientPromise) {
    return clientPromise;
  }

  // Check if we're in browser
  if (typeof window === "undefined") {
    throw new Error("Linera client can only be initialized in browser environment");
  }

  // Start async initialization
  clientPromise = (async () => {
    try {
      // Wait for SDK to load from import map
      await waitForSDK();
      
      console.log("[ClientLoader] SDK ready, creating client instance...");
      
      // Dynamic import to get our wrapper
      const { LineraClient } = await import("./client");
      
      // Create instance
      const client = new LineraClient(faucetUrl);
      
      // SDK is already initialized via import map, but call initialize anyway
      // (it will check if already initialized)
      await client.initialize();
      
      clientInstance = client;
      console.log("[ClientLoader] ✅ Client ready");
      return client;
    } catch (error) {
      console.error("[ClientLoader] Failed to load Linera client:", error);
      clientPromise = null; // Reset promise to allow retry
      throw error;
    }
  })();

  return clientPromise;
}

/**
 * Get client instance without initialization
 * Returns null if not initialized
 */
export function getLineraClientSync(): LineraClient | null {
  return clientInstance;
}

/**
 * Reset client instance (useful for testing or reconnection)
 */
export function resetLineraClient(): void {
  clientInstance = null;
  clientPromise = null;
}
