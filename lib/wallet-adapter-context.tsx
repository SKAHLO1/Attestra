"use client"

import React, { FC } from "react"
import { FlowWalletProvider } from "@/lib/flow/hooks"

interface FlowProviderProps {
  children: React.ReactNode
}

export const AleoWalletProvider: FC<FlowProviderProps> = ({ children }) => {
  return (
    <FlowWalletProvider>
      {children}
    </FlowWalletProvider>
  )
}
