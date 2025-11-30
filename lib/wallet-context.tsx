"use client"

import type React from "react"
import { createContext, useContext, useState, useCallback, useEffect } from "react"
import { getLineraClient, type LineraClient } from "./linera"
import { CheckoWalletAdapter } from "./linera/checko-adapter"
import type { LineraWalletInfo } from "./linera/types"

export type WalletType = "linera-extension" | "linera-faucet"

export interface WalletAccount {
  address: string
  type: WalletType
  balance?: string
  chainId?: string | number
}

interface WalletContextType {
  account: WalletAccount | null
  isConnecting: boolean
  isConnected: boolean
  connect: (type: WalletType) => Promise<void>
  disconnect: () => void
  switchChain: (chainId: number) => Promise<void>
  lineraClient?: LineraClient | null
  hasExtension: boolean // Whether CheCko extension is detected
}

const WalletContext = createContext<WalletContextType | undefined>(undefined)

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [account, setAccount] = useState<WalletAccount | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [lineraClient, setLineraClient] = useState<LineraClient | null>(null)
  const [checkoAdapter] = useState(() => new CheckoWalletAdapter())
  const [hasExtension, setHasExtension] = useState(false)

  const connect = useCallback(async (type: WalletType) => {
    setIsConnecting(true)
    try {
      if (type === "linera-extension") {
        // Use CheCko browser extension
        if (!CheckoWalletAdapter.isInstalled()) {
          throw new Error('CheCko wallet extension is not installed. Please install it from https://github.com/respeer-ai/linera-wallet')
        }
        
        const walletInfo: LineraWalletInfo = await checkoAdapter.connect()
        
        setAccount({
          address: walletInfo.address,
          type: "linera-extension",
          balance: walletInfo.balance,
          chainId: walletInfo.chainId,
        })
      } else if (type === "linera-faucet") {
        // Use faucet-based wallet - lazy load client
        // Lazy load Linera client (only loads in browser, avoids SSR)
        let client = lineraClient;
        if (!client) {
          console.log('[WalletContext] Loading Linera SDK...')
          client = await getLineraClient();
          setLineraClient(client);
        }
        
        const walletInfo: LineraWalletInfo = await client.connect()
        
        setAccount({
          address: walletInfo.address,
          type: "linera-faucet",
          balance: walletInfo.balance,
          chainId: walletInfo.chainId,
        })
      } else {
        throw new Error(`Wallet type "${type}" is not supported. Please use linera-extension or linera-faucet.`)
      }
    } catch (error) {
      console.error("Failed to connect wallet:", error)
      throw error
    } finally {
      setIsConnecting(false)
    }
  }, [lineraClient, checkoAdapter])

  const disconnect = useCallback(() => {
    if (account?.type === "linera-extension") {
      checkoAdapter.disconnect()
    } else if (account?.type === "linera-faucet" && lineraClient) {
      lineraClient.disconnect()
    }
    setAccount(null)
  }, [lineraClient, checkoAdapter, account])

  const switchChain = useCallback(
    async (chainId: number) => {
      if (!account) return

      try {
        await new Promise((resolve) => setTimeout(resolve, 1000))
        setAccount((prev) => (prev ? { ...prev, chainId } : null))
      } catch (error) {
        console.error("Failed to switch chain:", error)
      }
    },
    [account],
  )

  // Detect CheCko extension on mount (with retry for async loading)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      let attempts = 0;
      const maxAttempts = 3;
      
      const checkExtension = () => {
        attempts++;
        const extensionInstalled = CheckoWalletAdapter.isInstalled()
        setHasExtension(extensionInstalled)
        console.log(`[WalletContext] CheCko extension check (attempt ${attempts}):`, extensionInstalled)
        
        // Retry if not found and haven't exceeded max attempts
        if (!extensionInstalled && attempts < maxAttempts) {
          console.log('[WalletContext] Extension not found, retrying in 500ms...')
          setTimeout(checkExtension, 500);
        } else if (extensionInstalled) {
          console.log('[WalletContext] ✅ CheCko extension detected!')
        } else {
          console.log('[WalletContext] CheCko extension not found after', maxAttempts, 'attempts')
        }
      };
      
      // Start checking
      checkExtension();
    }
  }, [])

  return (
    <WalletContext.Provider
      value={{
        account,
        isConnecting,
        isConnected: !!account,
        connect,
        disconnect,
        switchChain,
        lineraClient,
        hasExtension,
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
