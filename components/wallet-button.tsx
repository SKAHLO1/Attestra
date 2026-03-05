"use client"

import { useFlowWallet } from "@/lib/flow/hooks"
import { Button } from "@/components/ui/button"
import { Wallet, ShieldCheck, ShieldAlert, Loader2 } from "lucide-react"

export default function WalletButton() {
  const { address, connected, verified, verifying, verifyError, connect, disconnect } = useFlowWallet()

  if (verifying) {
    return (
      <Button variant="outline" size="sm" disabled className="font-medium rounded-md px-4 py-2 border-yellow-200 bg-yellow-50 text-yellow-700">
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        Verifying ownership...
      </Button>
    )
  }

  if (connected && address) {
    return (
      <div className="flex items-center gap-2">
        {verifyError && (
          <span className="text-xs text-red-500 flex items-center gap-1">
            <ShieldAlert className="w-3 h-3" /> Unverified
          </span>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={disconnect}
          className={`font-medium rounded-md px-4 py-2 transition-colors ${
            verified
              ? "border-green-200 bg-green-50 text-green-700 hover:bg-red-50 hover:text-red-700 hover:border-red-200"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {verified
            ? <ShieldCheck className="w-4 h-4 mr-2" />
            : <ShieldAlert className="w-4 h-4 mr-2" />
          }
          {address.slice(0, 6)}...{address.slice(-4)}
        </Button>
      </div>
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
