"use client"

import React, { createContext, useContext, useState, useCallback, useRef, useEffect, type ReactNode } from 'react'
import { createWalletClient, custom, formatUnits, type WalletClient } from 'viem'
import { calibration } from '@filoz/synapse-sdk'

const CALIBRATION_CHAIN_ID = `0x${calibration.id.toString(16)}` // 0x4cb2f

interface EVMWalletState {
  address: string | null
  walletClient: WalletClient | null
  connecting: boolean
  error: string | null
  connect: () => Promise<void>
  disconnect: () => void
}

const EVMWalletContext = createContext<EVMWalletState>({
  address: null,
  walletClient: null,
  connecting: false,
  error: null,
  connect: async () => {},
  disconnect: () => {},
})

export function EVMWalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null)
  const [walletClient, setWalletClient] = useState<WalletClient | null>(null)
  const [connecting, setConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Prevent re-entrant connect calls
  const connectingRef = useRef(false)

  // Clean up accountsChanged listener on unmount
  const accountsChangedHandler = useRef<((accounts: string[]) => void) | null>(null)

  useEffect(() => {
    return () => {
      const ethereum = typeof window !== 'undefined' ? (window as any).ethereum : null
      if (ethereum && accountsChangedHandler.current) {
        ethereum.removeListener('accountsChanged', accountsChangedHandler.current)
      }
    }
  }, [])

  const connect = useCallback(async () => {
    // Guard against re-entrant calls
    if (connectingRef.current) return
    setError(null)

    if (typeof window === 'undefined' || !(window as any).ethereum) {
      setError('No EVM wallet detected. Please install MetaMask.')
      return
    }

    connectingRef.current = true
    setConnecting(true)

    try {
      const ethereum = (window as any).ethereum

      // Step 1: Request accounts — triggers MetaMask unlock popup if needed
      let accounts: string[]
      try {
        accounts = await ethereum.request({ method: 'eth_requestAccounts' })
      } catch (accountErr: any) {
        if (accountErr.code === 4001) throw new Error('Connection rejected. Please approve in MetaMask.')
        // MetaMask already has a pending request — tell user to check their MetaMask popup
        if (accountErr.code === -32002) throw new Error('MetaMask has a pending request. Open MetaMask and approve or reject it first.')
        throw accountErr
      }

      if (!accounts || accounts.length === 0) throw new Error('No accounts returned from MetaMask.')

      // Step 2: Switch to Filecoin Calibration — separate try/catch so account
      // rejection above is not confused with chain switch rejection
      try {
        await ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: CALIBRATION_CHAIN_ID }],
        })
      } catch (switchErr: any) {
        if (switchErr.code === 4001) {
          // User rejected the chain switch — still proceed with the account,
          // just warn. Deposit will fail if wrong chain but connect succeeds.
          console.warn('[EVMWallet] User rejected chain switch to Filecoin Calibration.')
        } else if (switchErr.code === 4902) {
          // Chain not in MetaMask yet — add it, then switch
          try {
            await ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: CALIBRATION_CHAIN_ID,
                chainName: 'Filecoin Calibration Testnet',
                nativeCurrency: { name: 'tFIL', symbol: 'tFIL', decimals: 18 },
                rpcUrls: ['https://api.calibration.node.glif.io/rpc/v1'],
                blockExplorerUrls: ['https://calibration.filfox.info/en'],
              }],
            })
          } catch (addErr: any) {
            if (addErr.code === 4001) {
              console.warn('[EVMWallet] User rejected adding Filecoin Calibration chain.')
            } else {
              throw addErr
            }
          }
        } else {
          // Unrecognised switch error — log but don't block connection
          console.warn('[EVMWallet] Chain switch error (non-fatal):', switchErr.message)
        }
      }

      // Step 3: Build viem wallet client
      const client = createWalletClient({
        account: accounts[0] as `0x${string}`,
        chain: calibration,
        transport: custom(ethereum),
      })

      setAddress(accounts[0])
      setWalletClient(client as any)

      // Step 4: Register accountsChanged listener (remove old one first)
      if (accountsChangedHandler.current) {
        ethereum.removeListener('accountsChanged', accountsChangedHandler.current)
      }
      const handler = (newAccounts: string[]) => {
        if (!newAccounts || newAccounts.length === 0) {
          setAddress(null)
          setWalletClient(null)
        } else {
          setAddress(newAccounts[0])
          const updatedClient = createWalletClient({
            account: newAccounts[0] as `0x${string}`,
            chain: calibration,
            transport: custom(ethereum),
          })
          setWalletClient(updatedClient as any)
        }
      }
      accountsChangedHandler.current = handler
      ethereum.on('accountsChanged', handler)
    } catch (err: any) {
      setError(err.message || 'Failed to connect EVM wallet')
    } finally {
      connectingRef.current = false
      setConnecting(false)
    }
  }, [])

  const disconnect = useCallback(() => {
    const ethereum = typeof window !== 'undefined' ? (window as any).ethereum : null
    if (ethereum && accountsChangedHandler.current) {
      ethereum.removeListener('accountsChanged', accountsChangedHandler.current)
      accountsChangedHandler.current = null
    }
    setAddress(null)
    setWalletClient(null)
    setError(null)
  }, [])

  return (
    <EVMWalletContext.Provider value={{ address, walletClient, connecting, error, connect, disconnect }}>
      {children}
    </EVMWalletContext.Provider>
  )
}

export function useEVMWallet() {
  return useContext(EVMWalletContext)
}

export { formatUnits }
