"use client"

import { Moon, Sun, LogOut } from "lucide-react"
import { useTheme } from "next-themes"
import WalletButton from "./wallet-button"
import { Button } from "@/components/ui/button"
import { useWallet } from "@demox-labs/aleo-wallet-adapter-react"

export default function Header() {
  const { theme, setTheme } = useTheme()
  const { connected, disconnect } = useWallet()

  return (
    <header className="sticky top-0 z-50 border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent">
            <span className="text-2xl">🪪</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Veleo
            </h1>
            <p className="text-xs text-muted-foreground hidden sm:block">Verifiable On-Chain Attendance</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs text-muted-foreground">Aleo Testnet</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="rounded-full"
          >
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>
          <WalletButton />
          {connected && (
            <Button
              variant="outline"
              size="icon"
              onClick={disconnect}
              className="rounded-full"
              title="Disconnect Wallet"
            >
              <LogOut className="h-5 w-5" />
              <span className="sr-only">Disconnect Wallet</span>
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}
