import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { WalletProvider } from "@/lib/wallet-context"
import { ThemeProvider } from "@/components/theme-provider"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Provera - Verifiable On-Chain Attendance",
  description: "Issue and claim verifiable attendance badges on the Linera blockchain. Powered by microchains for instant, secure event verification.",
  keywords: ["blockchain", "linera", "attendance", "badges", "web3", "NFT", "proof of attendance"],
  authors: [{ name: "Provera" }],
  openGraph: {
    title: "Provera - Verifiable On-Chain Attendance",
    description: "Issue and claim verifiable attendance badges on the Linera blockchain.",
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
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <WalletProvider>{children}</WalletProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
