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
}> = [
  {
    type: "linera-extension",
    name: "CheCko Wallet",
    icon: "🔗",
    description: "Connect using CheCko browser extension (recommended)",
    badge: "Recommended",
    requiresExtension: true,
  },
  {
    type: "linera-faucet",
    name: "Testnet Faucet",
    icon: "🚰",
    description: "Auto-connect with testnet wallet (demo mode)",
    badge: "Demo",
  },
]

export default function WalletConnector() {
  const { account, isConnecting, isConnected, connect, disconnect, hasExtension } = useWallet()
  const [showDialog, setShowDialog] = useState(false)

  const handleWalletSelect = async (type: WalletType) => {
    await connect(type)
    setShowDialog(false)
  }

  if (isConnected && account) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="gap-2 bg-transparent">
            <span className="text-sm font-mono">
              {account.address.slice(0, 6)}...{account.address.slice(-4)}
            </span>
            <span className="text-xs px-2 py-1 rounded bg-primary/10 text-primary">{account.type}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Connected Wallet</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <div className="px-2 py-2 text-sm">
            <p className="text-muted-foreground">Address</p>
            <p className="font-mono text-xs break-all">{account.address}</p>
          </div>
          {account.balance && (
            <div className="px-2 py-2 text-sm border-t">
              <p className="text-muted-foreground">Balance</p>
              <p className="font-semibold">{account.balance} ETH</p>
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
            <DialogDescription>Choose a wallet to connect to LineraProof</DialogDescription>
          </DialogHeader>

          <div className="grid gap-3">
            {WALLET_OPTIONS.map((wallet) => {
              const isDisabled = wallet.requiresExtension && !hasExtension;
              
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
                          ⚠️ Extension not installed. <a 
                            href="https://github.com/respeer-ai/linera-wallet" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="underline hover:text-destructive/80"
                          >
                            Get CheCko
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
              💡 <strong>Tip:</strong> {hasExtension 
                ? 'CheCko extension detected! Use it for persistent wallet across sessions.' 
                : 'Install CheCko for a better experience, or use Demo mode for quick testing.'}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
