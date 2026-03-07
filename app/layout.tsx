import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { AleoWalletProvider } from "@/lib/wallet-adapter-context"
import { AuthProvider } from "@/lib/firebase/auth-context"
import { EVMWalletProvider } from "@/lib/evm-wallet-context"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"

import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Attestra - AI-Verified Proof of Attendance on Flow",
  description: "Issue and claim verifiable attendance badges on the Flow blockchain with AI-powered verification and Filecoin storage. The future of event credentials.",
  keywords: ["blockchain", "flow", "attendance", "badges", "web3", "filecoin", "ipfs", "proof of attendance", "AI verification", "cadence"],
  authors: [{ name: "Attestra" }],
  openGraph: {
    title: "Attestra - AI-Verified Proof of Attendance on Flow",
    description: "Issue and claim verifiable attendance badges on the Flow blockchain with AI-powered verification and Filecoin/IPFS storage.",
    type: "website",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`font-sans antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <AuthProvider>
            <EVMWalletProvider>
              <AleoWalletProvider>
                {children}
                <Toaster />
              </AleoWalletProvider>
            </EVMWalletProvider>
          </AuthProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
