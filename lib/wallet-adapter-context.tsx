"use client"

import React, { FC, useMemo } from "react"
import { AleoWalletProvider as ProvableAleoWalletProvider } from "@provablehq/aleo-wallet-adaptor-react"
import { WalletModalProvider } from "@provablehq/aleo-wallet-adaptor-react-ui"
import { LeoWalletAdapter } from "@provablehq/aleo-wallet-adaptor-leo"
import { ShieldWalletAdapter } from "@provablehq/aleo-wallet-adaptor-shield"
import { PuzzleWalletAdapter } from "@provablehq/aleo-wallet-adaptor-puzzle"
import { FoxWalletAdapter } from "@provablehq/aleo-wallet-adaptor-fox"
import { Network } from "@provablehq/aleo-types"
import { DecryptPermission } from "@provablehq/aleo-wallet-adaptor-core"

// Import wallet adapter CSS
import "@provablehq/aleo-wallet-adaptor-react-ui/dist/styles.css"

interface AleoWalletProviderProps {
  children: React.ReactNode
}

export const AleoWalletProvider: FC<AleoWalletProviderProps> = ({ children }) => {
  const wallets = useMemo(
    () => [
      new LeoWalletAdapter({
        appName: "Veleo",
      }),
      new ShieldWalletAdapter(),
      new PuzzleWalletAdapter(),
      new FoxWalletAdapter(),
    ],
    []
  )

  return (
    <ProvableAleoWalletProvider
      wallets={wallets}
      autoConnect={true}
      network={Network.TESTNET}
      decryptPermission={DecryptPermission.UponRequest}
      programs={["credits.aleo", "velero_attender.aleo"]}
      onError={(error) => console.error("Wallet Adapter Error:", error?.message || error)}
    >
      <WalletModalProvider>{children}</WalletModalProvider>
    </ProvableAleoWalletProvider>
  )
}
