"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useWallet, type WalletType } from "@/lib/wallet-context"

const WALLET_OPTIONS: Array<{
  type: WalletType;
  name: string;
  icon: string;
  description: string;
  badge?: string;
  requiresExtension?: boolean;
  downloadUrl?: string;
}> = [
    {
      type: "Leo Wallet",
      name: "Leo Wallet",
      icon: "🦁",
      description: "Connect using Leo Wallet browser extension for Aleo testnet",
      badge: "Recommended",
      requiresExtension: true,
      downloadUrl: "https://leo.app/",
    },
  ]

export default function WalletConnector() {
  const { account, isConnecting, isConnected, connect, disconnect, hasWallet } = useWallet()
  const [showDialog, setShowDialog] = useState(false)

  const handleWalletSelect = async (type: WalletType) => {
    try {
      await connect(type)
      setShowDialog(false)
    } catch (error: any) {
      console.error('Failed to connect wallet:', error)
      alert(error.message || 'Failed to connect wallet')
    }
  }

  if (isConnected && account) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="gap-2 bg-transparent">
            <span className="text-sm font-mono">
              {account.address.slice(0, 6)}...{account.address.slice(-4)}
            </span>
            <span className="text-xs px-2 py-1 rounded bg-primary/10 text-primary">Leo</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Connected Wallet</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <div className="px-2 py-2 text-sm">
            <p className="text-muted-foreground">Address</p>
            <p className="font-mono text-xs break-all">{account.address}</p>
          </div>
          {account.network && (
            <div className="px-2 py-2 text-sm border-t">
              <p className="text-muted-foreground">Network</p>
              <p className="font-semibold capitalize">{account.network}</p>
            </div>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={disconnect} className="text-destructive focus:text-destructive">
            Disconnect
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  return (
    <>
      <Button onClick={() => setShowDialog(true)} disabled={isConnecting} className="bg-primary hover:bg-primary/90">
        {isConnecting ? "Connecting..." : "Connect Wallet"}
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Connect Wallet</DialogTitle>
            <DialogDescription>Connect your Leo Wallet to interact with Aleo testnet</DialogDescription>
          </DialogHeader>

          <div className="grid gap-3">
            {WALLET_OPTIONS.map((wallet) => {
              const isDisabled = wallet.requiresExtension && !hasWallet;

              return (
                <button
                  key={wallet.type}
                  onClick={() => handleWalletSelect(wallet.type)}
                  disabled={isConnecting || isDisabled}
                  className="p-4 rounded-lg border-2 border-border hover:border-primary hover:bg-primary/5 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed relative"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{wallet.icon}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-foreground">{wallet.name}</h3>
                        {wallet.badge && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/20 text-primary font-medium">
                            {wallet.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{wallet.description}</p>
                      {isDisabled && (
                        <p className="text-xs text-destructive mt-2 font-medium">
                          ⚠️ Leo Wallet not detected. <a
                            href={wallet.downloadUrl || "https://leo.app/"}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline hover:text-destructive/80"
                          >
                            Install Leo Wallet
                          </a>
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-4 p-3 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground">
              💡 <strong>Tip:</strong> {hasWallet
                ? 'Leo Wallet detected! Connect to interact with your Aleo badges on testnet.'
                : 'Install Leo Wallet browser extension to connect to Aleo testnet and manage your badges.'}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
