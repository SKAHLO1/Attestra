import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { AleoWalletProvider } from "@/lib/wallet-adapter-context"
import { AuthProvider } from "@/lib/firebase/auth-context"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"

import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Veleo - Privacy-Preserving Attendance Verification",
  description: "Issue and claim verifiable attendance badges on the Aleo blockchain with zero-knowledge proofs. Privacy-first event verification.",
  keywords: ["blockchain", "aleo", "attendance", "badges", "web3", "zero-knowledge", "privacy", "proof of attendance"],
  authors: [{ name: "Veleo" }],
  openGraph: {
    title: "Veleo - Privacy-Preserving Attendance Verification",
    description: "Issue and claim verifiable attendance badges on the Aleo blockchain with zero-knowledge proofs.",
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
            <AleoWalletProvider>
              {children}
              <Toaster />
            </AleoWalletProvider>
          </AuthProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
