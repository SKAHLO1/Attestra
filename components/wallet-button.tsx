"use client"

import { WalletMultiButton } from "@demox-labs/aleo-wallet-adapter-reactui"

export default function WalletButton() {
  return (
    <WalletMultiButton className="!bg-primary hover:!bg-primary/90 !text-primary-foreground !font-medium !rounded-md !px-4 !py-2 !transition-colors" />
  )
}
