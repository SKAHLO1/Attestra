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
    await logout()
    setUserRole(null)
  }

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Header />

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {!userRole ? (
          <div className="flex flex-col items-center justify-center min-h-[70vh] gap-12 py-12 w-full">
            {/* Hero Section */}
            <div className="text-center space-y-6 max-w-3xl w-full px-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4 animate-in fade-in slide-in-from-bottom-3 duration-700">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span className="text-sm font-medium text-primary">Powered by Aleo Zero-Knowledge Proofs</span>
              </div>
              
              <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
                Welcome to Veleo
              </h1>
              
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom-5 duration-700 delay-200">
                Issue and claim privacy-preserving attendance badges with zero-knowledge proofs. 
                Built on Aleo for verifiable, private event credentials.
              </p>

              <div className="flex flex-wrap items-center justify-center gap-6 pt-4 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-300">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center">
                    <svg className="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span>Privacy-First</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <svg className="w-3 h-3 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span>Zero-Knowledge</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="w-5 h-5 rounded-full bg-purple-500/20 flex items-center justify-center">
                    <svg className="w-3 h-3 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span>Fully Verifiable</span>
                </div>
              </div>
            </div>

            {/* Role Selection Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl px-4 animate-in fade-in slide-in-from-bottom-7 duration-700 delay-500">
              <button
                onClick={() => handleRoleSelection("organizer")}
                className="group relative p-8 rounded-2xl border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent hover:border-primary/40 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 hover:scale-105"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative">
                  <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">📋</div>
                  <h2 className="text-2xl font-bold mb-3 text-foreground">Event Organizer</h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Create events, manage attendees, and issue verifiable attendance badges on-chain
                  </p>
                </div>
              </button>

              <button
                onClick={() => handleRoleSelection("attendee")}
                className="group relative p-8 rounded-2xl border-2 border-accent/20 bg-gradient-to-br from-accent/5 to-transparent hover:border-accent/40 hover:shadow-xl hover:shadow-accent/10 transition-all duration-300 hover:scale-105"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-accent/10 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative">
                  <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">🎟️</div>
                  <h2 className="text-2xl font-bold mb-3 text-foreground">Attendee</h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Scan QR codes, claim your attendance badges, and build your verifiable portfolio
                  </p>
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
