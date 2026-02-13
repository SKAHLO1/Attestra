"use client"

import Image from "next/image"
import { useState, useEffect } from "react"
import HamburgerMenu from "./hamburger-menu"
import { Sparkles } from "lucide-react"

export default function Header() {
  const [showWelcome, setShowWelcome] = useState(false)

  useEffect(() => {
    // Show welcome message after a short delay
    const timer = setTimeout(() => setShowWelcome(true), 1500)
    return () => clearTimeout(timer)
  }, [])

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm overflow-hidden">
      {/* Animated Announcement Bar */}
      <div className={`bg-gray-900 transition-all duration-700 ease-in-out ${showWelcome ? 'h-8 opacity-100' : 'h-0 opacity-0'}`}>
        <div className="container mx-auto h-full flex items-center justify-center">
          <div className="flex items-center gap-2 animate-in fade-in slide-in-from-top-4 duration-1000">
            <Sparkles className="w-3 h-3 text-blue-400" />
            <p className="text-[10px] md:text-xs font-bold text-white tracking-wider uppercase">
              Welcome to <span className="text-blue-400">Veleo</span>! Scroll down to see how to get started
            </p>
            <Sparkles className="w-3 h-3 text-blue-400" />
          </div>
        </div>
      </div>

      <div className="border-b border-gray-200">
        <div className="container mx-auto px-4 py-0.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image
              src="/veleo-logo.jpg"
              alt="Veleo"
              width={85}
              height={20}
              className="hover:scale-105 transition-transform duration-300 cursor-pointer object-contain"
              priority
            />
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-1.5 px-2 py-0.5 text-[10px] rounded-full bg-green-50 border border-green-200">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <span className="font-medium text-green-700">Aleo Testnet</span>
            </div>
            <HamburgerMenu />
          </div>
        </div>
      </div>
    </header>
  )
}
