"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import OrganizerDashboard from "@/components/organizer-dashboard"
import AttendeePortal from "@/components/attendee-portal"
import BadgePortfolio from "@/components/badge-portfolio"
import Header from "@/components/header"
import UseCaseShowcase from "@/components/onboarding/use-case-showcase"
import HowItWorks from "@/components/onboarding/how-it-works"
import { useWallet } from "@provablehq/aleo-wallet-adaptor-react"
import { useAuth } from "@/lib/firebase/auth-context"
import { LoginDialog } from "@/components/auth/login-dialog"
import { Button } from "@/components/ui/button"
import { Sparkles } from "lucide-react"
import LeoPriceWidget from "@/components/leo-price-widget"

export default function Home() {
  const [userRole, setUserRole] = useState<"organizer" | "attendee" | null>(null)
  const [showLoginDialog, setShowLoginDialog] = useState(false)
  const [selectedRole, setSelectedRole] = useState<"organizer" | "attendee">("attendee")
  const { address } = useWallet()
  const { user, userProfile, logout } = useAuth()

  useEffect(() => {
    if (userProfile) {
      setUserRole(userProfile.role)
      setShowLoginDialog(false)
    } else {
      setUserRole(null)
    }
  }, [userProfile])

  const handleRoleSelection = (role: "organizer" | "attendee") => {
    if (!user) {
      setSelectedRole(role)
      setShowLoginDialog(true)
    } else {
      setUserRole(role)
    }
  }

  const handleLogout = async () => {
    try {
      console.log('[Page] Logging out...')
      setUserRole(null)
      setShowLoginDialog(false)
      await logout()
      console.log('[Page] Logout complete')
    } catch (error) {
      console.error('[Page] Logout error:', error)
    }
  }

  return (
    <div className="min-h-screen bg-white overflow-x-hidden relative">

      <Header />

      <main className="relative z-10">
        {!userRole ? (
          <>
            {/* Enhanced Hero Section */}
            <section className="container mx-auto px-4 py-16 md:py-24 max-w-7xl relative overflow-visible">
              {/* Decorative Background Image - Large Consolidated View */}
              <div className="absolute top-[45%] left-1/2 -translate-x-1/2 w-full max-w-6xl h-[55%] opacity-50 -z-10 pointer-events-none animate-in fade-in zoom-in duration-1000">
                <Image
                  src="/redd-francisco-5U_28ojjgms-unsplash.jpg"
                  alt=""
                  fill
                  className="object-cover rounded-[3rem] md:rounded-[5rem]"
                  priority
                />
              </div>
              <div className="flex flex-col items-center justify-center gap-12 w-full">
                <div className="text-center space-y-8 max-w-4xl w-full px-4">
                  {/* Headline & Brand Area */}
                  <div className="relative w-full mb-12">
                    {/* Market Data Widget - Far Left Positioned */}
                    <div className="hidden lg:block absolute left-0 top-1/2 -translate-y-1/2 z-20 animate-in fade-in slide-in-from-left-8 duration-1000">
                      <LeoPriceWidget />
                    </div>

                    {/* Community Image - Far Right Positioned */}
                    <div className="hidden lg:block absolute right-0 top-1/2 -translate-y-1/2 z-20 animate-in fade-in slide-in-from-right-8 duration-1000">
                      <div className="w-72 h-52 relative rounded-[2.5rem] overflow-hidden border-4 border-white shadow-[0_25px_60px_rgba(0,0,0,0.15)] transform rotate-3 hover:rotate-0 transition-transform duration-500">
                        <Image
                          src="/alexandre-pellaes-6vAjp0pscX0-unsplash.jpg"
                          alt="Veleo Community"
                          fill
                          className="object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                        <div className="absolute bottom-4 left-4 right-4">
                          <p className="text-white text-[10px] font-black uppercase tracking-widest opacity-90">Veleo Ecosystem</p>
                          <p className="text-white text-xs font-bold leading-tight">Empowering Private Attendance</p>
                        </div>
                      </div>
                    </div>

                    {/* Central Logo Display */}
                    <div className="flex justify-center animate-in fade-in duration-1000">
                      <div className="relative">
                        <div className="relative bg-white p-8 rounded-3xl border border-gray-200 shadow-2xl scale-110">
                          <Image
                            src="/veleo-logo.jpg"
                            alt="Veleo"
                            width={300}
                            height={64}
                            className="object-contain"
                            priority
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Badge */}
                  <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white border-2 border-primary/30 mb-4 animate-in fade-in slide-in-from-bottom-3 duration-700 shadow-sm">
                    <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                    <span className="text-sm font-semibold text-gray-900">Powered by Aleo Zero-Knowledge Proofs</span>
                  </div>

                  {/* Main Headline */}
                  <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold mb-6 text-gray-900 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100 leading-tight">
                    Privacy-First Proof of Attendance
                  </h1>

                  {/* Subheadline */}
                  <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom-5 duration-700 delay-200">
                    Issue and claim <span className="font-semibold text-gray-900">verifiable attendance badges</span> with zero-knowledge proofs.
                    Not all attendance should be public — Veleo keeps your credentials private while maintaining full verifiability.
                  </p>

                  {/* Feature Pills */}
                  <div className="flex flex-wrap items-center justify-center gap-4 pt-4 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-300">
                    {[
                      { label: "Privacy-First", icon: "✓" },
                      { label: "Zero-Knowledge", icon: "✓" },
                      { label: "Fully Verifiable", icon: "✓" },
                    ].map((feature, idx) => (
                      <div
                        key={idx}
                        className="group flex items-center gap-2 text-sm px-5 py-2.5 rounded-full bg-white border-2 border-gray-200 hover:border-primary/50 transition-all duration-300 hover:scale-110 cursor-default shadow-sm"
                      >
                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors duration-300">
                          <span className="text-primary font-bold">{feature.icon}</span>
                        </div>
                        <span className="font-semibold text-gray-900 group-hover:text-primary transition-colors duration-300">
                          {feature.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Role Selection Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-5xl px-4 animate-in fade-in slide-in-from-bottom-7 duration-700 delay-500">
                  <button
                    onClick={() => handleRoleSelection("organizer")}
                    className="group relative p-12 rounded-3xl border-2 border-gray-200 bg-white hover:border-gray-400 hover:shadow-2xl transition-all duration-500 hover:scale-[1.05] hover:-translate-y-3 overflow-hidden"
                  >
                    {/* Subtle gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                    <div className="relative z-10">
                      <div className="text-7xl mb-6 group-hover:scale-125 group-hover:rotate-12 transition-all duration-500 inline-block">📋</div>
                      <h2 className="text-3xl font-bold mb-4 text-gray-900 transition-colors duration-300">Event Organizer</h2>
                      <p className="text-base text-gray-600 leading-relaxed group-hover:text-gray-700 transition-colors duration-300">
                        Create events, manage attendees, and issue verifiable attendance badges on-chain with privacy guarantees
                      </p>

                      {/* Animated arrow */}
                      <div className="mt-6 flex items-center gap-2 text-gray-700 opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:translate-x-2">
                        <span className="text-sm font-bold">Get Started</span>
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => handleRoleSelection("attendee")}
                    className="group relative p-12 rounded-3xl border-2 border-gray-200 bg-white hover:border-gray-400 hover:shadow-2xl transition-all duration-500 hover:scale-[1.05] hover:-translate-y-3 overflow-hidden"
                  >
                    {/* Subtle gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-primary/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                    <div className="relative z-10">
                      <div className="text-7xl mb-6 group-hover:scale-125 group-hover:rotate-12 transition-all duration-500 inline-block">🎟️</div>
                      <h2 className="text-3xl font-bold mb-4 text-gray-900 transition-colors duration-300">Attendee</h2>
                      <p className="text-base text-gray-600 leading-relaxed group-hover:text-gray-700 transition-colors duration-300">
                        Scan QR codes, claim your attendance badges, and build your verifiable portfolio with complete privacy
                      </p>

                      {/* Animated arrow */}
                      <div className="mt-6 flex items-center gap-2 text-gray-700 opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:translate-x-2">
                        <span className="text-sm font-bold">Get Started</span>
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            </section>

            {/* Educational Sections */}
            <UseCaseShowcase />
            <HowItWorks />
          </>
        ) : (
          <div className="container mx-auto px-4 py-8 max-w-7xl">
            {userRole === "organizer" && (
              <div className="w-full">
                <OrganizerDashboard wallet={address || null} />
              </div>
            )}

            {userRole === "attendee" && (
              <Tabs defaultValue="attendee" className="w-full">
                <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8">
                  <TabsTrigger value="attendee">
                    Claim Badges
                  </TabsTrigger>
                  <TabsTrigger value="portfolio">My Portfolio</TabsTrigger>
                </TabsList>

                <TabsContent value="attendee">
                  <AttendeePortal wallet={address || null} />
                </TabsContent>

                <TabsContent value="portfolio">
                  <BadgePortfolio wallet={address || null} />
                </TabsContent>
              </Tabs>
            )}
          </div>
        )}
      </main>

      <LoginDialog
        open={showLoginDialog}
        onOpenChange={setShowLoginDialog}
        role={selectedRole}
      />
    </div>
  )
}
