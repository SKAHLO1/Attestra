"use client"

import type React from "react"
import { createContext, useContext, useState, useCallback } from "react"

export type WalletType = "metamask" | "walletconnect" | "coinbase" | "linera"

export interface WalletAccount {
  address: string
  type: WalletType
  balance?: string
  chainId?: number
}

interface WalletContextType {
  account: WalletAccount | null
  isConnecting: boolean
  isConnected: boolean
  connect: (type: WalletType) => Promise<void>
  disconnect: () => void
  switchChain: (chainId: number) => Promise<void>
}

const WalletContext = createContext<WalletContextType | undefined>(undefined)

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [account, setAccount] = useState<WalletAccount | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)

  const connect = useCallback(async (type: WalletType) => {
    setIsConnecting(true)
    try {
      // Simulate wallet connection with different types
      await new Promise((resolve) => setTimeout(resolve, 1500))

      const mockAddress = "0x" + Math.random().toString(16).slice(2, 10).toUpperCase()
      const mockBalance = (Math.random() * 10).toFixed(2)

      setAccount({
        address: mockAddress,
        type,
        balance: mockBalance,
        chainId: 1,
      })
    } catch (error) {
      console.error("Failed to connect wallet:", error)
    } finally {
      setIsConnecting(false)
    }
  }, [])

  const disconnect = useCallback(() => {
    setAccount(null)
  }, [])

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

  return (
    <WalletContext.Provider
      value={{
        account,
        isConnecting,
        isConnected: !!account,
        connect,
        disconnect,
        switchChain,
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
