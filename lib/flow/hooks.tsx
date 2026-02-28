"use client"

import React, { useState, useEffect, createContext, useContext } from 'react';
import * as fcl from '@onflow/fcl';

interface FlowUser {
  addr: string | null;
  loggedIn: boolean;
}

interface FlowWalletContextType {
  user: FlowUser;
  address: string | null;
  connected: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
}

const FlowWalletContext = createContext<FlowWalletContextType>({
  user: { addr: null, loggedIn: false },
  address: null,
  connected: false,
  connect: async () => {},
  disconnect: async () => {},
});

export function FlowWalletProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FlowUser>({ addr: null, loggedIn: false });

  useEffect(() => {
    fcl.currentUser().subscribe((u: any) => {
      setUser({ addr: u.addr ?? null, loggedIn: !!u.loggedIn });
    });
  }, []);

  const connect = async () => {
    await fcl.authenticate();
  };

  const disconnect = async () => {
    await fcl.unauthenticate();
  };

  return (
    <FlowWalletContext.Provider
      value={{
        user,
        address: user.addr,
        connected: user.loggedIn,
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
