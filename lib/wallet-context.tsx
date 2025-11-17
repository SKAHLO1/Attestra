"use client"

import type React from "react"
import { createContext, useContext, useState, useCallback, useEffect } from "react"
import { getLineraClient } from "./linera"
import type { LineraWalletInfo } from "./linera/types"

export type WalletType = "metamask" | "walletconnect" | "coinbase" | "linera"

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
}

const WalletContext = createContext<WalletContextType | undefined>(undefined)

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [account, setAccount] = useState<WalletAccount | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [lineraClient] = useState(() => getLineraClient())
  const [autoConnectAttempted, setAutoConnectAttempted] = useState(false)

  const connect = useCallback(async (type: WalletType, isAutoConnect = false) => {
    setIsConnecting(true)
    try {
      if (type === "linera") {
        // Use real Linera wallet integration
        if (isAutoConnect) {
          console.log('[WalletContext] Auto-connecting to testnet wallet...')
        }
        const walletInfo: LineraWalletInfo = await lineraClient.connect()
        
        setAccount({
          address: walletInfo.address,
          type: "linera",
          balance: walletInfo.balance,
          chainId: walletInfo.chainId,
        })
        
        if (isAutoConnect) {
          console.log('[WalletContext] ✅ Auto-connected to testnet wallet')
          console.log('[WalletContext] Chain ID:', walletInfo.chainId)
        }
      } else {
        // Fallback to mock for other wallet types (for demo purposes)
        await new Promise((resolve) => setTimeout(resolve, 1500))

        const mockAddress = "0x" + Math.random().toString(16).slice(2, 10).toUpperCase()
        const mockBalance = (Math.random() * 10).toFixed(2)

        setAccount({
          address: mockAddress,
          type,
          balance: mockBalance,
          chainId: 1,
        })
      }
    } catch (error) {
      console.error("Failed to connect wallet:", error)
      throw error
    } finally {
      setIsConnecting(false)
    }
  }, [lineraClient])

  const disconnect = useCallback(() => {
    if (account?.type === "linera") {
      lineraClient.disconnect()
    }
    setAccount(null)
  }, [lineraClient, account])

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

  // Auto-connect in testnet development mode
  useEffect(() => {
    if (!autoConnectAttempted && !account && typeof window !== 'undefined') {
      console.log('[WalletContext] Checking for auto-connect...')
      // Always auto-connect to Linera in development (testnet or mock mode)
      console.log('[WalletContext] Auto-connecting to Linera wallet...')
      setAutoConnectAttempted(true)
      connect('linera', true).catch(err => {
        console.error('[WalletContext] Auto-connect failed:', err)
      })
    }
  }, [autoConnectAttempted, account, connect])

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
