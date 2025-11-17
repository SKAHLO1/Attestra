/**
 * React hooks for Linera integration
 */

import { useCallback, useEffect, useState } from "react";
import { getLineraClient, LineraClient } from "./client";
import { useWallet } from "../wallet-context";
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
  // Get wallet context and shared client instance
  const { isConnected, lineraClient } = useWallet();
  
  // CRITICAL: Use the client from wallet context, not a new instance
  if (!lineraClient) {
    throw new Error('Linera client not available from wallet context');
  }
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAppIdSet, setIsAppIdSet] = useState(false);
  
  console.log('[useEventOperations] Using client from wallet context:', !!lineraClient);

  useEffect(() => {
    const setupAppId = async () => {
      if (applicationId && isConnected && lineraClient) {
        console.log('[useEventOperations] Setting application ID:', applicationId);
        try {
          await lineraClient.setApplicationId(applicationId);
          setIsAppIdSet(true);
          console.log('[useEventOperations] ✅ Application ID set successfully');
        } catch (err: any) {
          console.error('[useEventOperations] Failed to set application ID:', err);
          setError('Failed to initialize application');
        }
      }
    };
    setupAppId();
  }, [lineraClient, applicationId, isConnected]);

  const createEvent = useCallback(
    async (params: CreateEventParams): Promise<TransactionResponse> => {
      console.log('[useEventOperations] createEvent called');
      console.log('[useEventOperations] isConnected:', isConnected);
      console.log('[useEventOperations] isAppIdSet:', isAppIdSet);
      
      if (!isConnected) {
        throw new Error("Wallet not connected");
      }
      
      if (!isAppIdSet) {
        console.warn('[useEventOperations] Application ID not set yet, waiting...');
        // Give it a moment for the app ID to be set
        await new Promise(resolve => setTimeout(resolve, 1000));
        if (!isAppIdSet) {
          throw new Error("Application not ready. Please try again.");
        }
      }

      setLoading(true);
      setError(null);

      try {
        console.log('[useEventOperations] Creating event with params:', params);
        const result = await lineraClient.createEvent(params);
        console.log('[useEventOperations] Event creation result:', result);
        if (!result.success) {
          throw new Error(result.error || "Failed to create event");
        }
        return result;
      } catch (err: any) {
        const errorMessage = err.message || "Failed to create event";
        console.error('[useEventOperations] Error:', errorMessage);
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [lineraClient, isConnected, isAppIdSet]
  );

  const claimBadge = useCallback(
    async (claimCode: string): Promise<TransactionResponse> => {
      if (!isConnected) {
        throw new Error("Wallet not connected");
      }

      setLoading(true);
      setError(null);

      try {
        const result = await lineraClient.claimBadge(claimCode);
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
    [lineraClient, isConnected]
  );

  const addClaimCodes = useCallback(
    async (codes: string[]): Promise<TransactionResponse> => {
      if (!isConnected) {
        throw new Error("Wallet not connected");
      }

      setLoading(true);
      setError(null);

      try {
        const result = await lineraClient.addClaimCodes(codes);
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
    [lineraClient, isConnected]
  );

  const setEventActive = useCallback(
    async (isActive: boolean): Promise<TransactionResponse> => {
      if (!isConnected) {
        throw new Error("Wallet not connected");
      }

      setLoading(true);
      setError(null);

      try {
        const result = await lineraClient.setEventActive(isActive);
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
    [lineraClient, isConnected]
  );

  const validateClaimCode = useCallback(
    async (claimCode: string): Promise<boolean> => {
      if (!isConnected) {
        throw new Error("Wallet not connected");
      }

      try {
        return await lineraClient.isClaimCodeValid(claimCode);
      } catch (err: any) {
        console.error("Failed to validate claim code:", err);
        return false;
      }
    },
    [lineraClient, isConnected]
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
