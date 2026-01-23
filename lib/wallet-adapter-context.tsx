"use client"

import React, { FC, useMemo } from "react"
import { WalletProvider } from "@demox-labs/aleo-wallet-adapter-react"
import { WalletModalProvider } from "@demox-labs/aleo-wallet-adapter-reactui"
import { LeoWalletAdapter } from "@demox-labs/aleo-wallet-adapter-leo"
import {
  DecryptPermission,
  WalletAdapterNetwork,
} from "@demox-labs/aleo-wallet-adapter-base"

interface AleoWalletProviderProps {
  children: React.ReactNode
}

export const AleoWalletProvider: FC<AleoWalletProviderProps> = ({ children }) => {
  const wallets = useMemo(
    () => [
      new LeoWalletAdapter({
        appName: "Veleo - Aleo Attendance Badges",
      }),
    ],
    []
  )

  return (
    <WalletProvider
      wallets={wallets}
      decryptPermission={DecryptPermission.UponRequest}
      network={WalletAdapterNetwork.TestnetBeta}
      autoConnect={false}
    >
      <WalletModalProvider>{children}</WalletModalProvider>
    </WalletProvider>
  )
}
