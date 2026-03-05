"use client"

import React, { useState, useEffect, createContext, useContext } from 'react';
import * as fcl from '@onflow/fcl';
import { getFlowClient } from './client';

interface FlowUser {
  addr: string | null;
  loggedIn: boolean;
}

interface FlowWalletContextType {
  user: FlowUser;
  address: string | null;
  connected: boolean;
  verified: boolean;
  verifying: boolean;
  verifyError: string | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
}

const FlowWalletContext = createContext<FlowWalletContextType>({
  user: { addr: null, loggedIn: false },
  address: null,
  connected: false,
  verified: false,
  verifying: false,
  verifyError: null,
  connect: async () => {},
  disconnect: async () => {},
});

export function FlowWalletProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FlowUser>({ addr: null, loggedIn: false });
  const [verified, setVerified] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  useEffect(() => {
    const unsub = fcl.currentUser.subscribe((u: any) => {
      setUser({ addr: u.addr ?? null, loggedIn: !!u.loggedIn });
      // Reset verification when user logs out
      if (!u.loggedIn) {
        setVerified(false);
        setVerifyError(null);
      }
    });
    return () => unsub();
  }, []);

  const connect = async () => {
    setVerifyError(null);

    // Step 1: Authenticate (wallet selection popup)
    await fcl.authenticate();

    // Step 2: Immediately request ownership signature to prove key control
    setVerifying(true);
    try {
      const flowClient = getFlowClient();
      await flowClient.verifyWalletOwnership();
      setVerified(true);
      setVerifyError(null);
    } catch (err: any) {
      setVerified(false);
      setVerifyError(err.message || 'Wallet ownership verification failed.');
      // Disconnect if ownership cannot be proven
      await fcl.unauthenticate();
      throw err;
    } finally {
      setVerifying(false);
    }
  };

  const disconnect = async () => {
    await fcl.unauthenticate();
    setVerified(false);
    setVerifyError(null);
  };

  return (
    <FlowWalletContext.Provider
      value={{
        user,
        address: user.addr,
        connected: user.loggedIn,
        verified,
        verifying,
        verifyError,
        connect,
        disconnect,
      }}
    >
      {children}
    </FlowWalletContext.Provider>
  );
}

export function useFlowWallet() {
  return useContext(FlowWalletContext);
}
