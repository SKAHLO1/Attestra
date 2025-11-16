/**
 * React hooks for Linera integration
 */

import { useCallback, useEffect, useState } from "react";
import { getLineraClient, LineraClient } from "./client";
import type {
  BadgeInfo,
  CreateEventParams,
  EventInfo,
  LineraWalletInfo,
  TransactionResponse,
} from "./types";

// Import the wallet context to get shared client instance
let sharedWalletContext: any = null;
if (typeof window !== "undefined") {
  try {
    // Dynamically import to avoid circular dependencies
    import("../wallet-context").then((module) => {
      sharedWalletContext = module;
    });
  } catch (e) {
    console.warn("Could not load wallet context");
  }
}

/**
 * Hook to manage Linera wallet connection
 */
export function useLineraWallet() {
  const [client] = useState<LineraClient>(() => getLineraClient());
  const [walletInfo, setWalletInfo] = useState<LineraWalletInfo | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connect = useCallback(async () => {
    setIsConnecting(true);
    setError(null);
    
    try {
      const info = await client.connect();
      setWalletInfo(info);
      return info;
    } catch (err: any) {
      const errorMessage = err.message || "Failed to connect wallet";
      setError(errorMessage);
      throw err;
    } finally {
      setIsConnecting(false);
    }
  }, [client]);

  const disconnect = useCallback(() => {
    client.disconnect();
    setWalletInfo(null);
    setError(null);
  }, [client]);

  return {
    client,
    walletInfo,
    isConnected: !!walletInfo,
    isConnecting,
    error,
    connect,
    disconnect,
  };
}

/**
 * Hook to fetch event information
 */
export function useEventInfo(applicationId?: string) {
  const [client] = useState<LineraClient>(() => getLineraClient());
  const [eventInfo, setEventInfo] = useState<EventInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [isConnected, setIsConnected] = useState(false);
  
  useEffect(() => {
    const checkConnection = () => {
      const chainId = client.getChainId();
      setIsConnected(!!chainId);
    };
    
    checkConnection();
    const interval = setInterval(checkConnection, 1000);
    
    return () => clearInterval(interval);
  }, [client]);

  const fetchEventInfo = useCallback(async () => {
    if (!isConnected || !applicationId) return;

    setLoading(true);
    setError(null);

    try {
      await client.setApplicationId(applicationId);
      const info = await client.getEventInfo();
      setEventInfo(info);
    } catch (err: any) {
      setError(err.message || "Failed to fetch event info");
    } finally {
      setLoading(false);
    }
  }, [client, isConnected, applicationId]);

  useEffect(() => {
    fetchEventInfo();
  }, [fetchEventInfo]);

  return {
    eventInfo,
    loading,
    error,
    refetch: fetchEventInfo,
  };
}

/**
 * Hook to fetch user's badges
 */
export function useUserBadges(applicationId?: string) {
  const [client] = useState<LineraClient>(() => getLineraClient());
  const [badges, setBadges] = useState<BadgeInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  
  useEffect(() => {
    const checkConnection = () => {
      const chainId = client.getChainId();
      const address = client.getAddress();
      setIsConnected(!!chainId);
      setWalletAddress(address);
    };
    
    checkConnection();
    const interval = setInterval(checkConnection, 1000);
    
    return () => clearInterval(interval);
  }, [client]);

  const fetchBadges = useCallback(async () => {
    if (!isConnected || !walletAddress || !applicationId) return;

    setLoading(true);
    setError(null);

    try {
      await client.setApplicationId(applicationId);
      const badge = await client.getBadgeByOwner(walletAddress);
      setBadges(badge ? [badge] : []);
    } catch (err: any) {
      setError(err.message || "Failed to fetch badges");
    } finally {
      setLoading(false);
    }
  }, [client, isConnected, walletAddress, applicationId]);

  useEffect(() => {
    fetchBadges();
  }, [fetchBadges]);

  return {
    badges,
    loading,
    error,
    refetch: fetchBadges,
  };
}

/**
 * Hook to fetch all badges for an event
 */
export function useAllEventBadges(applicationId?: string) {
  const [client] = useState<LineraClient>(() => getLineraClient());
  const [badges, setBadges] = useState<BadgeInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [isConnected, setIsConnected] = useState(false);
  
  useEffect(() => {
    const checkConnection = () => {
      const chainId = client.getChainId();
      setIsConnected(!!chainId);
    };
    
    checkConnection();
    const interval = setInterval(checkConnection, 1000);
    
    return () => clearInterval(interval);
  }, [client]);

  const fetchAllBadges = useCallback(async () => {
    if (!isConnected || !applicationId) return;

    setLoading(true);
    setError(null);

    try {
      await client.setApplicationId(applicationId);
      const allBadges = await client.getAllBadges();
      setBadges(allBadges);
    } catch (err: any) {
      setError(err.message || "Failed to fetch badges");
    } finally {
      setLoading(false);
    }
  }, [client, isConnected, applicationId]);

  useEffect(() => {
    fetchAllBadges();
  }, [fetchAllBadges]);

  return {
    badges,
    loading,
    error,
    refetch: fetchAllBadges,
  };
}

/**
 * Hook for event operations
 */
export function useEventOperations(applicationId?: string) {
  // Get the shared client instance from singleton
  const [client] = useState<LineraClient>(() => getLineraClient());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Check if wallet is connected by checking if client has a chain ID
  const [isConnected, setIsConnected] = useState(false);
  
  useEffect(() => {
    // Check connection status from the client and poll for changes
    const checkConnection = () => {
      const chainId = client.getChainId();
      setIsConnected(!!chainId);
    };
    
    checkConnection();
    
    // Poll every 1 second to detect wallet connection changes
    const interval = setInterval(checkConnection, 1000);
    
    return () => clearInterval(interval);
  }, [client]);

  useEffect(() => {
    if (applicationId && isConnected) {
      client.setApplicationId(applicationId);
    }
  }, [client, applicationId, isConnected]);

  const createEvent = useCallback(
    async (params: CreateEventParams): Promise<TransactionResponse> => {
      if (!isConnected) {
        throw new Error("Wallet not connected");
      }

      setLoading(true);
      setError(null);

      try {
        const result = await client.createEvent(params);
        if (!result.success) {
          throw new Error(result.error || "Failed to create event");
        }
        return result;
      } catch (err: any) {
        const errorMessage = err.message || "Failed to create event";
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [client, isConnected]
  );

  const claimBadge = useCallback(
    async (claimCode: string): Promise<TransactionResponse> => {
      if (!isConnected) {
        throw new Error("Wallet not connected");
      }

      setLoading(true);
      setError(null);

      try {
        const result = await client.claimBadge(claimCode);
        if (!result.success) {
          throw new Error(result.error || "Failed to claim badge");
        }
        return result;
      } catch (err: any) {
        const errorMessage = err.message || "Failed to claim badge";
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [client, isConnected]
  );

  const addClaimCodes = useCallback(
    async (codes: string[]): Promise<TransactionResponse> => {
      if (!isConnected) {
        throw new Error("Wallet not connected");
      }

      setLoading(true);
      setError(null);

      try {
        const result = await client.addClaimCodes(codes);
        if (!result.success) {
          throw new Error(result.error || "Failed to add claim codes");
        }
        return result;
      } catch (err: any) {
        const errorMessage = err.message || "Failed to add claim codes";
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [client, isConnected]
  );

  const setEventActive = useCallback(
    async (isActive: boolean): Promise<TransactionResponse> => {
      if (!isConnected) {
        throw new Error("Wallet not connected");
      }

      setLoading(true);
      setError(null);

      try {
        const result = await client.setEventActive(isActive);
        if (!result.success) {
          throw new Error(result.error || "Failed to update event status");
        }
        return result;
      } catch (err: any) {
        const errorMessage = err.message || "Failed to update event status";
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [client, isConnected]
  );

  const validateClaimCode = useCallback(
    async (claimCode: string): Promise<boolean> => {
      if (!isConnected) {
        throw new Error("Wallet not connected");
      }

      try {
        return await client.isClaimCodeValid(claimCode);
      } catch (err: any) {
        console.error("Failed to validate claim code:", err);
        return false;
      }
    },
    [client, isConnected]
  );

  return {
    createEvent,
    claimBadge,
    addClaimCodes,
    setEventActive,
    validateClaimCode,
    loading,
    error,
  };
}
