"use client"

import { useFlowWallet } from "@/lib/flow/hooks"
import { Button } from "@/components/ui/button"
import { Wallet } from "lucide-react"

export default function WalletButton() {
  const { address, connected, connect, disconnect } = useFlowWallet()

  if (connected && address) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={disconnect}
        className="font-medium rounded-md px-4 py-2 transition-colors border-green-200 bg-green-50 text-green-700 hover:bg-red-50 hover:text-red-700 hover:border-red-200"
      >
        <Wallet className="w-4 h-4 mr-2" />
        {address.slice(0, 6)}...{address.slice(-4)}
      </Button>
    )
  }

  return (
    <Button
      size="sm"
      onClick={connect}
      className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-md px-4 py-2 transition-colors"
    >
      <Wallet className="w-4 h-4 mr-2" />
      Connect Flow Wallet
    </Button>
  )
}
