"use client"

import { WalletMultiButton } from "@provablehq/aleo-wallet-adaptor-react-ui"

export default function WalletConnector() {
  return (
    <WalletMultiButton className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-md px-4 py-2 transition-colors" />
  )
}
