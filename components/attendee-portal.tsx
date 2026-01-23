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
import { useAuth } from "@/lib/firebase/auth-context"
import { LogOut, User } from "lucide-react"

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
  const { claimBadge, validateClaimCode, loading, error } = useEventOperations()
  const { badges: userBadges, refetch } = useUserBadges()
  
  const [claimCode, setClaimCode] = useState("")
  const [claimedBadges, setClaimedBadges] = useState<ClaimedBadge[]>([])
  const [showQRScanner, setShowQRScanner] = useState(false)
  const [selectedBadge, setSelectedBadge] = useState<ClaimedBadge | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [claimStatus, setClaimStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleLogout = async () => {
    await logout()
  }

  // Convert Firebase badges to ClaimedBadge format
  useEffect(() => {
    if (userBadges) {
      const converted: ClaimedBadge[] = userBadges.map((badge) => ({
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

  const handleQRScan = () => {
    // Open QR scanner modal
    // Recommend using @zxing/browser or react-qr-scanner for production
    // Example implementation:
    // import { BrowserQRCodeReader } from '@zxing/browser'
    // const codeReader = new BrowserQRCodeReader()
    // codeReader.decodeFromVideoDevice(undefined, 'video', (result, error) => {
    //   if (result) {
    //     const scannedData = result.getText()
    //     const decoded = decodeQRData(scannedData)
    //     if (decoded) setClaimCode(decoded.claimCode)
    //   }
    // })
    setShowQRScanner(true)
  }

  const handleClaimBadge = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!claimCode.trim()) return

    setClaimStatus(null)

    try {
      const badgeId = await claimBadge(claimCode)
      
      setClaimStatus({ 
        type: 'success', 
        message: `Badge claimed successfully!` 
      })
      setClaimCode("")
      // Refresh badge list
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
      case "confirmed":
        return "bg-green-500/10 text-green-700 border-green-200"
      case "pending":
        return "bg-yellow-500/10 text-yellow-700 border-yellow-200"
      case "failed":
        return "bg-red-500/10 text-red-700 border-red-200"
      default:
        return "bg-gray-500/10 text-gray-700 border-gray-200"
    }
  }

  if (!wallet) {
    return (
      <Card className="border-2 border-dashed">
        <CardContent className="pt-8 text-center">
          <p className="text-muted-foreground mb-4">Please connect your wallet to claim badges</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* User Info Bar */}
      <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
            <User className="w-5 h-5 text-accent" />
          </div>
          <div>
            <p className="font-semibold text-foreground">{userProfile?.displayName || user?.email}</p>
            <p className="text-xs text-muted-foreground">Attendee</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={handleLogout} className="gap-2">
          <LogOut className="w-4 h-4" />
          Logout
        </Button>
      </div>

      <div>
        <h2 className="text-3xl font-bold bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">
          Claim Your Badge
        </h2>
        <p className="text-muted-foreground mt-1">Enter the claim code from your event organizer or scan a QR code</p>
      </div>

      <Tabs defaultValue="manual" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="manual">Manual Entry</TabsTrigger>
          <TabsTrigger value="qr">QR Code</TabsTrigger>
        </TabsList>

        <TabsContent value="manual" className="space-y-4">
          <Card className="border-2 border-accent/20 bg-gradient-to-br from-accent/5 to-transparent shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                Badge Claim Form
              </CardTitle>
              <CardDescription>Enter the claim code provided by the event organizer</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleClaimBadge} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Claim Code</label>
                  <Input
                    placeholder="Enter claim code (e.g., ALEO-2025-ABC123)"
                    value={claimCode}
                    onChange={(e) => setClaimCode(e.target.value.toUpperCase())}
                    className="bg-input font-mono"
                  />
                </div>

                {claimStatus && (
                  <div className={`p-3 rounded-lg border ${
                    claimStatus.type === 'success' 
                      ? 'bg-green-500/10 border-green-500/30' 
                      : 'bg-destructive/10 border-destructive/30'
                  }`}>
                    <p className={`text-sm ${
                      claimStatus.type === 'success' ? 'text-green-700' : 'text-destructive'
                    }`}>{claimStatus.message}</p>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={loading || !claimCode.trim()}
                  className="w-full bg-gradient-to-r from-accent to-primary hover:opacity-90 transition-opacity shadow-lg shadow-accent/20"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                      </svg>
                      Claiming Badge on Blockchain...
                    </span>
                  ) : "Claim Badge"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="qr" className="space-y-4">
          <Card className="border-2 border-accent/20 bg-gradient-to-br from-accent/5 to-transparent shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
                Scan QR Code
              </CardTitle>
              <CardDescription>Use your device camera to scan the QR code from the event</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-accent/30 rounded-lg bg-accent/5">
                  <div className="text-4xl mb-3">📱</div>
                  <p className="text-sm text-muted-foreground text-center mb-4">
                    Click the button below to scan a QR code
                  </p>
                  <Button onClick={handleQRScan} disabled={loading} className="bg-gradient-to-r from-accent to-primary hover:opacity-90 transition-opacity shadow-lg shadow-accent/20">
                    {loading ? "Processing..." : "Scan QR Code"}
                  </Button>
                  <p className="text-xs text-muted-foreground text-center mt-2">
                    💡 To enable camera scanning, install @zxing/browser package
                  </p>
                </div>

                {claimCode && (
                  <div className="p-4 bg-green-500/10 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-700 font-medium">QR Code Scanned Successfully</p>
                    <p className="text-xs text-green-600 mt-1 font-mono">{claimCode}</p>
                  </div>
                )}

                {claimCode && (
                  <>
                    {claimStatus && (
                      <div className={`p-3 rounded-lg border ${
                        claimStatus.type === 'success' 
                          ? 'bg-green-500/10 border-green-500/30' 
                          : 'bg-destructive/10 border-destructive/30'
                      }`}>
                        <p className={`text-sm ${
                          claimStatus.type === 'success' ? 'text-green-700' : 'text-destructive'
                        }`}>{claimStatus.message}</p>
                      </div>
                    )}
                    <Button
                      onClick={(e) => { e.preventDefault(); handleClaimBadge(e as any); }}
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-accent to-primary hover:opacity-90 transition-opacity shadow-lg shadow-accent/20"
                    >
                      {loading ? "Claiming Badge..." : "Claim Badge"}
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Claim History</h3>
          <Badge variant="outline" className="bg-primary/10 border-primary/30">{claimedBadges.length} badges</Badge>
        </div>

        {claimedBadges.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="pt-8 text-center text-muted-foreground">
              <div className="text-4xl mb-3">🎫</div>
              <p>No badges claimed yet. Enter a claim code to get started.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {claimedBadges.map((badge) => (
              <Card key={badge.id} className="hover:border-accent/50 transition-all duration-300 hover:shadow-lg hover:shadow-accent/10 animate-in fade-in slide-in-from-bottom-5 duration-500">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold text-foreground">{badge.eventName}</h4>
                        <Badge className={`text-xs ${getStatusColor(badge.status)}`}>
                          {badge.status.charAt(0).toUpperCase() + badge.status.slice(1)}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">
                        Claimed: {badge.claimedAt.toLocaleDateString()} at {badge.claimedAt.toLocaleTimeString()}
                      </p>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground font-mono">Code: {badge.claimCode}</p>
                        <p className="text-xs text-muted-foreground font-mono">TX: {badge.txHash}</p>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button variant="outline" size="sm" className="text-xs bg-transparent">
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs text-destructive hover:text-destructive bg-transparent"
                        onClick={() => handleDeleteBadge(badge)}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-accent/20 bg-gradient-to-br from-accent/5 to-transparent hover:shadow-lg hover:shadow-accent/10 transition-all duration-300">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <svg className="w-4 h-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              Total Claimed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-accent">{claimedBadges.length}</div>
          </CardContent>
        </Card>

        <Card className="border-green-500/20 bg-gradient-to-br from-green-500/5 to-transparent hover:shadow-lg hover:shadow-green-500/10 transition-all duration-300">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Verified
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-green-600">
              {claimedBadges.filter((b) => b.status === "confirmed").length}
            </div>
          </CardContent>
        </Card>

        <Card className="border-yellow-500/20 bg-gradient-to-br from-yellow-500/5 to-transparent hover:shadow-lg hover:shadow-yellow-500/10 transition-all duration-300">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <svg className="w-4 h-4 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-yellow-600">
              {claimedBadges.filter((b) => b.status === "pending").length}
            </div>
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Badge</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove "{selectedBadge?.eventName}" from your claim history? This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">
              Remove
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
