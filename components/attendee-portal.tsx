"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useEventOperations, useUserBadges } from "@/lib/services"
import { getApplicationId } from "@/lib/config"
import { useWallet } from "@provablehq/aleo-wallet-adaptor-react"
import { useAuth } from "@/lib/firebase/auth-context"
import { LogOut, User, ShieldCheck, Trophy, Target, Star, Wallet, QrCode, History, ChevronRight } from "lucide-react"

interface ClaimedBadge {
  id: string
  eventName: string
  claimedAt: Date
  txHash: string
  claimCode: string
  status: "pending" | "confirmed" | "failed"
}

interface AttendeePortalProps {
  wallet: string | null
}

export default function AttendeePortal({ wallet }: AttendeePortalProps) {
  const applicationId = getApplicationId()
  const { user, userProfile, logout } = useAuth()
  const { wallet: walletAdapter, address } = useWallet()
  const requestTransaction = (walletAdapter?.adapter as any)?.requestTransaction
  const { claimBadge, loading, error } = useEventOperations()
  const { badges: userBadges, refetch } = useUserBadges()

  const [claimCode, setClaimCode] = useState("")
  const [claimedBadges, setClaimedBadges] = useState<ClaimedBadge[]>([])
  const [showQRScanner, setShowQRScanner] = useState(false)
  const [selectedBadge, setSelectedBadge] = useState<ClaimedBadge | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [claimStatus, setClaimStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Convert Firebase badges to ClaimedBadge format
  useEffect(() => {
    if (userBadges) {
      const converted: ClaimedBadge[] = userBadges.map((badge: any) => ({
        id: badge.tokenId,
        eventName: badge.eventName,
        claimedAt: badge.claimedAt || new Date(),
        txHash: badge.aleoTxId || `Token #${badge.tokenId}`,
        claimCode: badge.claimCode,
        status: "confirmed" as const,
      }))
      setClaimedBadges(converted)
    }
  }, [userBadges])

  // Reputation Logic
  const badgeCount = claimedBadges.length
  const getReputation = () => {
    if (badgeCount >= 6) return { level: 3, label: "Visionary", icon: <Star className="w-5 h-5 text-yellow-500" />, color: "text-yellow-600", bg: "bg-yellow-50" }
    if (badgeCount >= 3) return { level: 2, label: "Voyager", icon: <Target className="w-5 h-5 text-blue-500" />, color: "text-blue-600", bg: "bg-blue-50" }
    if (badgeCount >= 1) return { level: 1, label: "Initiate", icon: <Trophy className="w-5 h-5 text-green-500" />, color: "text-green-600", bg: "bg-green-50" }
    return { level: 0, label: "Beginner", icon: <User className="w-5 h-5 text-gray-400" />, color: "text-gray-600", bg: "bg-gray-50" }
  }
  const reputation = getReputation()

  const handleClaimBadge = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!claimCode.trim()) return

    setClaimStatus(null)

    try {
      // Pass existing badges for client-side eligibility logic
      const badgeId = await claimBadge(claimCode, address || undefined, requestTransaction, userBadges)

      setClaimStatus({
        type: 'success',
        message: `ZK-Badge Claimed! Minted on Aleo Testnet.`
      })
      setClaimCode("")
      setTimeout(() => refetch(), 2000)
    } catch (error: any) {
      setClaimStatus({
        type: 'error',
        message: error.message || 'Failed to claim badge'
      })
    }
  }

  const handleDeleteBadge = (badge: ClaimedBadge) => {
    setSelectedBadge(badge)
    setShowDeleteDialog(true)
  }

  const confirmDelete = () => {
    if (selectedBadge) {
      setClaimedBadges(claimedBadges.filter((b) => b.id !== selectedBadge.id))
      setShowDeleteDialog(false)
      setSelectedBadge(null)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed": return "bg-green-500/10 text-green-700 border-green-200"
      case "pending": return "bg-yellow-500/10 text-yellow-700 border-yellow-200"
      case "failed": return "bg-red-500/10 text-red-700 border-red-200"
      default: return "bg-gray-500/10 text-gray-700 border-gray-200"
    }
  }

  if (!wallet) {
    return (
      <Card className="border-2 border-dashed border-gray-200 rounded-3xl p-12 text-center bg-gray-50 animate-in fade-in zoom-in-95 duration-500">
        <div className="w-16 h-16 rounded-2xl bg-white shadow-sm border border-gray-100 flex items-center justify-center mx-auto mb-6">
          <Wallet className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Connect Your Wallet</h3>
        <p className="text-gray-500 mb-8 max-w-xs mx-auto">Please connect your Aleo wallet to access your private attendance records and claim new ZK-badges.</p>
      </Card>
    )
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-20">
      {/* Reputation Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-none bg-gray-900 text-white shadow-2xl rounded-3xl overflow-hidden relative group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-[100px] -mr-32 -mt-32 rounded-full" />
          <CardContent className="p-8 relative z-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-5">
                <div className={`w-20 h-20 rounded-3xl ${reputation.bg} border-4 border-white/10 flex items-center justify-center shadow-inner transform group-hover:scale-110 transition-transform duration-500`}>
                  {reputation.icon}
                </div>
                <div>
                  <p className="text-blue-400 text-[10px] font-black uppercase tracking-[0.2em] mb-1">On-Chain Reputation</p>
                  <h3 className="text-3xl font-black">{reputation.label}</h3>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex gap-1">
                      {[1, 2, 3].map(i => (
                        <div key={i} className={`w-6 h-1.5 rounded-full ${i <= reputation.level ? 'bg-blue-500' : 'bg-white/10'}`} />
                      ))}
                    </div>
                    <span className="text-xs font-bold text-gray-400">Level {reputation.level}</span>
                  </div>
                </div>
              </div>
              <div className="h-full border-l border-white/10 pl-6 hidden md:block">
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Private Badges</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black">{badgeCount}</span>
                  <span className="text-sm font-bold text-gray-500">Verified</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-100 bg-white shadow-xl rounded-3xl p-8 flex flex-col justify-center border-b-4 border-b-blue-500">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-50 rounded-xl">
              <ShieldCheck className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-sm font-black text-gray-900 uppercase">ZK-Protection</p>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed font-medium">
            Your attendance record is encrypted on Aleo. Organizers only see
            <span className="text-blue-600 font-bold px-1">ZK-Proofs</span>
            of your eligibility, never your full history.
          </p>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-8 bg-gray-900 rounded-full" />
            <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Claim Badge</h2>
          </div>

          <Tabs defaultValue="manual" className="w-full">
            <TabsList className="grid w-full max-w-sm grid-cols-2 bg-gray-100/50 p-1 rounded-2xl h-12">
              <TabsTrigger value="manual" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm font-bold text-xs uppercase">Manual Entry</TabsTrigger>
              <TabsTrigger value="qr" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm font-bold text-xs uppercase">Scan QR</TabsTrigger>
            </TabsList>

            <TabsContent value="manual" className="mt-6">
              <Card className="border-gray-200 bg-white shadow-2xl rounded-[2.5rem] overflow-hidden">
                <CardContent className="p-8">
                  <form onSubmit={handleClaimBadge} className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Event Claim Code</label>
                      <div className="relative">
                        <Input
                          placeholder="ALEO-2025-XXXX"
                          value={claimCode}
                          onChange={(e) => setClaimCode(e.target.value.toUpperCase())}
                          className="bg-gray-50 border-gray-200 focus:border-gray-900 rounded-2xl h-14 font-mono text-lg transition-all tracking-wider"
                        />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2">
                          <Target className="w-5 h-5 text-gray-300" />
                        </div>
                      </div>
                    </div>

                    {claimStatus && (
                      <div className={`p-4 rounded-2xl flex items-center gap-3 border animate-in slide-in-from-top-2 duration-300 ${claimStatus.type === 'success'
                        ? 'bg-green-50 border-green-100'
                        : 'bg-red-50 border-red-100'
                        }`}>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${claimStatus.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
                          {claimStatus.type === 'success' ? <ShieldCheck className="w-3.5 h-3.5 text-white" /> : <ShieldCheck className="w-3.5 h-3.5 text-white transform rotate-180" />}
                        </div>
                        <p className={`text-sm font-bold ${claimStatus.type === 'success' ? 'text-green-700' : 'text-red-700'}`}>{claimStatus.message}</p>
                      </div>
                    )}

                    <Button
                      type="submit"
                      disabled={loading || !claimCode.trim()}
                      className="w-full h-14 bg-gray-900 hover:bg-black text-white rounded-2xl font-black uppercase tracking-widest transition-all duration-300 hover:scale-[1.02] shadow-2xl shadow-gray-200"
                    >
                      {loading ? (
                        <span className="flex items-center gap-2">
                          <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Validating ZK-Proof...
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          Claim Gated Badge <ChevronRight className="w-4 h-4" />
                        </span>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="qr" className="mt-6">
              <Card className="border-gray-200 bg-white shadow-2xl rounded-[2.5rem] p-10 text-center">
                <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center mx-auto mb-6 border-2 border-dashed border-gray-200">
                  <QrCode className="w-10 h-10 text-gray-300" />
                </div>
                <h4 className="font-black text-gray-900 uppercase mb-2">Camera Scanner</h4>
                <p className="text-xs text-gray-500 mb-6">Scan the unique ZK-QR code provided at the event entrance.</p>
                <Button variant="outline" className="rounded-xl border-gray-200 font-bold uppercase text-xs h-11 px-8">Enable Camera</Button>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-8 bg-gray-900 rounded-full" />
              <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Badge History</h2>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-full font-black text-[10px] text-gray-500 uppercase tracking-widest">
              <History className="w-3 h-3" /> {claimedBadges.length} Total
            </div>
          </div>

          {claimedBadges.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-gray-50/50 rounded-[2.5rem] border-2 border-dashed border-gray-100">
              <p className="text-gray-400 font-bold text-sm uppercase">No private badges issued yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {claimedBadges.map((badge) => (
                <Card key={badge.id} className="border-none shadow-lg rounded-3xl overflow-hidden hover:scale-[1.01] transition-all duration-300 group">
                  <CardContent className="p-0">
                    <div className="flex">
                      <div className="w-2 bg-gray-900 group-hover:bg-blue-500 transition-colors" />
                      <div className="flex-1 p-6">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="text-lg font-black text-gray-900 leading-tight mb-1">{badge.eventName}</h4>
                            <div className="flex items-center gap-3">
                              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{badge.claimedAt.toLocaleDateString()}</span>
                              <div className="w-1 h-1 rounded-full bg-gray-200" />
                              <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${getStatusColor(badge.status)}`}>
                                Confirmed
                              </span>
                            </div>
                          </div>
                          <Button variant="ghost" size="icon" className="rounded-xl hover:bg-gray-100">
                            <ChevronRight className="w-5 h-5 text-gray-400" />
                          </Button>
                        </div>
                        <div className="mt-4 pt-4 border-t border-gray-50 flex items-center gap-4">
                          <div className="flex-1 min-w-0">
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Aleo TX Hash</p>
                            <p className="text-[10px] font-mono text-gray-500 truncate bg-gray-50 p-1.5 rounded-lg">{badge.txHash}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="rounded-[2.5rem] border-none shadow-2xl p-10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-black text-gray-900">Remove Badge?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-500 font-medium">
              This will remove the local reference to your badge. The record will remain encrypted on the Aleo blockchain but you won't see it in your dashboard.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-4 justify-end mt-8">
            <AlertDialogCancel className="rounded-2xl border-gray-200 font-bold h-12 px-6">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-500 hover:bg-red-600 text-white rounded-2xl font-bold h-12 px-6 border-none">
              Remove Metadata
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
