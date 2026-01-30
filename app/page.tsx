"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import OrganizerDashboard from "@/components/organizer-dashboard"
import AttendeePortal from "@/components/attendee-portal"
import BadgePortfolio from "@/components/badge-portfolio"
import Header from "@/components/header"
import { useWallet } from "@demox-labs/aleo-wallet-adapter-react"
import { useAuth } from "@/lib/firebase/auth-context"
import { LoginDialog } from "@/components/auth/login-dialog"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"

export default function Home() {
  const [userRole, setUserRole] = useState<"organizer" | "attendee" | null>(null)
  const [showLoginDialog, setShowLoginDialog] = useState(false)
  const [selectedRole, setSelectedRole] = useState<"organizer" | "attendee">("attendee")
  const { publicKey } = useWallet()
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
    <div className="min-h-screen bg-background overflow-x-hidden relative">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-secondary/10 rounded-full blur-3xl animate-pulse delay-500" />
      </div>

      <Header />

      <main className="container mx-auto px-4 py-8 max-w-7xl relative z-10">
        {!userRole ? (
          <div className="flex flex-col items-center justify-center min-h-[70vh] gap-12 py-12 w-full">
            {/* Hero Section */}
            <div className="text-center space-y-6 max-w-3xl w-full px-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4 animate-in fade-in slide-in-from-bottom-3 duration-700 backdrop-blur-sm">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span className="text-sm font-medium text-primary">Powered by Aleo Zero-Knowledge Proofs</span>
              </div>
              
              <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100 [text-shadow:_0_0_30px_rgb(var(--primary)_/_20%)]">
                Welcome to Veleo
              </h1>
              
              <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom-5 duration-700 delay-200">
                Issue and claim privacy-preserving attendance badges with zero-knowledge proofs. 
                Built on Aleo for verifiable, private event credentials.
              </p>

              <div className="flex flex-wrap items-center justify-center gap-6 pt-6 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-300">
                <div className="group flex items-center gap-2 text-sm text-muted-foreground px-4 py-2 rounded-full border border-green-500/20 bg-green-500/5 hover:bg-green-500/10 hover:border-green-500/40 transition-all duration-300 hover:scale-110 cursor-default">
                  <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center group-hover:bg-green-500/30 transition-colors duration-300 animate-pulse">
                    <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="font-medium group-hover:text-green-500 transition-colors duration-300">Privacy-First</span>
                </div>
                <div className="group flex items-center gap-2 text-sm text-muted-foreground px-4 py-2 rounded-full border border-blue-500/20 bg-blue-500/5 hover:bg-blue-500/10 hover:border-blue-500/40 transition-all duration-300 hover:scale-110 cursor-default">
                  <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center group-hover:bg-blue-500/30 transition-colors duration-300 animate-pulse delay-150">
                    <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="font-medium group-hover:text-blue-500 transition-colors duration-300">Zero-Knowledge</span>
                </div>
                <div className="group flex items-center gap-2 text-sm text-muted-foreground px-4 py-2 rounded-full border border-purple-500/20 bg-purple-500/5 hover:bg-purple-500/10 hover:border-purple-500/40 transition-all duration-300 hover:scale-110 cursor-default">
                  <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center group-hover:bg-purple-500/30 transition-colors duration-300 animate-pulse delay-300">
                    <svg className="w-4 h-4 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="font-medium group-hover:text-purple-500 transition-colors duration-300">Fully Verifiable</span>
                </div>
              </div>
            </div>

            {/* Role Selection Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl px-4 animate-in fade-in slide-in-from-bottom-7 duration-700 delay-500">
              <button
                onClick={() => handleRoleSelection("organizer")}
                className="group relative p-10 rounded-3xl border-2 border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/20 transition-all duration-500 hover:scale-[1.08] hover:-translate-y-2 backdrop-blur-sm overflow-hidden"
              >
                {/* Animated gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-accent/20 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                {/* Animated border glow */}
                <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-pulse">
                  <div className="absolute inset-0 rounded-3xl border-2 border-primary/50 blur-sm" />
                </div>
                
                <div className="relative">
                  <div className="text-6xl mb-6 group-hover:scale-125 group-hover:rotate-12 transition-all duration-500 inline-block">📋</div>
                  <h2 className="text-3xl font-bold mb-4 text-foreground group-hover:text-primary transition-colors duration-300">Event Organizer</h2>
                  <p className="text-base text-muted-foreground leading-relaxed group-hover:text-foreground/80 transition-colors duration-300">
                    Create events, manage attendees, and issue verifiable attendance badges on-chain
                  </p>
                  
                  {/* Animated arrow */}
                  <div className="mt-6 flex items-center gap-2 text-primary opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:translate-x-2">
                    <span className="text-sm font-semibold">Get Started</span>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </div>
                </div>
              </button>

              <button
                onClick={() => handleRoleSelection("attendee")}
                className="group relative p-10 rounded-3xl border-2 border-accent/30 bg-gradient-to-br from-accent/10 via-accent/5 to-transparent hover:border-accent/50 hover:shadow-2xl hover:shadow-accent/20 transition-all duration-500 hover:scale-[1.08] hover:-translate-y-2 backdrop-blur-sm overflow-hidden"
              >
                {/* Animated gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-accent/20 via-transparent to-secondary/20 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                {/* Animated border glow */}
                <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-pulse">
                  <div className="absolute inset-0 rounded-3xl border-2 border-accent/50 blur-sm" />
                </div>
                
                <div className="relative">
                  <div className="text-6xl mb-6 group-hover:scale-125 group-hover:rotate-12 transition-all duration-500 inline-block">🎟️</div>
                  <h2 className="text-3xl font-bold mb-4 text-foreground group-hover:text-accent transition-colors duration-300">Attendee</h2>
                  <p className="text-base text-muted-foreground leading-relaxed group-hover:text-foreground/80 transition-colors duration-300">
                    Scan QR codes, claim your attendance badges, and build your verifiable portfolio
                  </p>
                  
                  {/* Animated arrow */}
                  <div className="mt-6 flex items-center gap-2 text-accent opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:translate-x-2">
                    <span className="text-sm font-semibold">Get Started</span>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </div>
                </div>
              </button>
            </div>

            {user && (
              <div className="flex items-center gap-4 mt-6">
                <p className="text-sm text-muted-foreground">
                  Logged in as <span className="font-semibold">{userProfile?.displayName || user.email}</span>
                </p>
                <Button variant="outline" size="sm" onClick={handleLogout}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div>
            {userRole === "organizer" && (
              <div className="w-full">
                <OrganizerDashboard wallet={publicKey || null} />
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
                  <AttendeePortal wallet={publicKey || null} />
                </TabsContent>

                <TabsContent value="portfolio">
                  <BadgePortfolio wallet={publicKey || null} />
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
