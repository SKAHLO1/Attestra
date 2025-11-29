"use client"

import type React from "react"
import { createContext, useContext, useState, useCallback, useEffect } from "react"
import { getLineraClient } from "./linera"
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
  lineraClient?: ReturnType<typeof getLineraClient>
  hasExtension: boolean // Whether CheCko extension is detected
}

const WalletContext = createContext<WalletContextType | undefined>(undefined)

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [account, setAccount] = useState<WalletAccount | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [lineraClient] = useState(() => getLineraClient())
  const [checkoAdapter] = useState(() => new CheckoWalletAdapter())
  const [hasExtension, setHasExtension] = useState(false)
  const [autoConnectAttempted, setAutoConnectAttempted] = useState(false)

  const connect = useCallback(async (type: WalletType, isAutoConnect = false) => {
    setIsConnecting(true)
    try {
      if (type === "linera-extension") {
        // Use CheCko browser extension
        if (isAutoConnect) {
          console.log('[WalletContext] Auto-connecting to CheCko extension...')
        }
        
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
        
        if (isAutoConnect) {
          console.log('[WalletContext] ✅ Connected to CheCko extension')
          console.log('[WalletContext] Chain ID:', walletInfo.chainId)
        }
      } else if (type === "linera-faucet") {
        // Use faucet-based wallet (original method)
        if (isAutoConnect) {
          console.log('[WalletContext] Auto-connecting to testnet faucet...')
        }
        const walletInfo: LineraWalletInfo = await lineraClient.connect()
        
        setAccount({
          address: walletInfo.address,
          type: "linera-faucet",
          balance: walletInfo.balance,
          chainId: walletInfo.chainId,
        })
        
        if (isAutoConnect) {
          console.log('[WalletContext] ✅ Auto-connected to testnet faucet')
          console.log('[WalletContext] Chain ID:', walletInfo.chainId)
        }
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
    } else if (account?.type === "linera-faucet") {
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

  // Detect CheCko extension on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const extensionInstalled = CheckoWalletAdapter.isInstalled()
      setHasExtension(extensionInstalled)
      console.log('[WalletContext] CheCko extension detected:', extensionInstalled)
    }
  }, [])

  // Auto-connect in testnet development mode
  useEffect(() => {
    if (!autoConnectAttempted && !account && typeof window !== 'undefined') {
      console.log('[WalletContext] Checking for auto-connect...')
      setAutoConnectAttempted(true)
      
      // Prefer extension if available, otherwise use faucet
      const walletType: WalletType = hasExtension ? 'linera-extension' : 'linera-faucet'
      console.log(`[WalletContext] Auto-connecting to ${walletType}...`)
      
      connect(walletType, true).catch(err => {
        console.error('[WalletContext] Auto-connect failed:', err)
        
        // If extension fails and it was our first choice, fallback to faucet
        if (walletType === 'linera-extension') {
          console.log('[WalletContext] Falling back to faucet method...')
          connect('linera-faucet', true).catch(fallbackErr => {
            console.error('[WalletContext] Fallback connect failed:', fallbackErr)
          })
        }
      })
    }
  }, [autoConnectAttempted, account, hasExtension, connect])

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
