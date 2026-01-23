"use client"

import type React from "react"
import { createContext, useContext, useState, useCallback, useEffect } from "react"
import { getAleoClient, type AleoClient } from "./aleo"
import type { AleoWalletInfo } from "./aleo/types"

export type WalletType = "aleo-wallet" | "Leo Wallet"

export interface WalletAccount {
  address: string
  type: WalletType
  balance?: string
  network?: string
}

interface WalletContextType {
  account: WalletAccount | null
  isConnecting: boolean
  isConnected: boolean
  connect: (type: WalletType) => Promise<void>
  disconnect: () => void
  aleoClient?: AleoClient | null
  hasWallet: boolean
}

const WalletContext = createContext<WalletContextType | undefined>(undefined)

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [account, setAccount] = useState<WalletAccount | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [aleoClient, setAleoClient] = useState<AleoClient | null>(null)
  const [hasWallet, setHasWallet] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  const connect = useCallback(async (type: WalletType) => {
    setIsConnecting(true)
    try {
      if (type === "aleo-wallet" || type === "Leo Wallet") {
        let client = aleoClient;
        if (!client) {
          console.log('[WalletContext] Loading Aleo client...')
          client = getAleoClient();
          setAleoClient(client);
        }

        const walletInfo: AleoWalletInfo = await client.connect()

        setAccount({
          address: walletInfo.address,
          type: type, // Use the passed type
          balance: walletInfo.balance,
          network: walletInfo.network,
        })
      } else {
        throw new Error(`Wallet type "${type}" is not supported. Please use Leo Wallet.`)
      }
    } catch (error) {
      console.error("Failed to connect wallet:", error)
      throw error
    } finally {
      setIsConnecting(false)
    }
  }, [aleoClient])

  const disconnect = useCallback(() => {
    if (aleoClient) {
      aleoClient.disconnect()
    }
    setAccount(null)
  }, [aleoClient])

  // Detect Aleo wallet on mount (client-side only)
  useEffect(() => {
    setIsMounted(true)

    const checkWallet = () => {
      try {
        const walletDetected = !!(window as any).leoWallet;
        setHasWallet(walletDetected)
        console.log('[WalletContext] Aleo wallet detected:', walletDetected)
      } catch (error) {
        console.error('Error checking wallet:', error)
        setHasWallet(false)
      }
    };

    // Check immediately
    checkWallet();

    // Check again after a delay in case wallet loads asynchronously
    const timer = setTimeout(checkWallet, 1000);

    return () => clearTimeout(timer);
  }, [])

  return (
    <WalletContext.Provider
      value={{
        account,
        isConnecting,
        isConnected: !!account,
        connect,
        disconnect,
        aleoClient,
        hasWallet,
      }}
    >
      {children}
    </WalletContext.Provider>
  )
}

export function useWallet() {
  const context = useContext(WalletContext)
  if (context === undefined) {
    throw new Error("useWallet must be used within a WalletProvider")
  }
  return context
}
