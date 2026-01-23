"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { useAllEventBadges } from "@/lib/services"
import { getApplicationId } from "@/lib/config"
import type { EventCategory } from "@/lib/services/types"

interface BadgeData {
  id: string
  eventName: string
  issuer: string
  claimedAt: Date
  image: string
  verified: boolean
  category: "conference" | "hackathon" | "meetup" | "workshop"
  txHash: string
  contractAddress: string
  tokenId: string
  description: string
}

interface BadgePortfolioProps {
  wallet: string | null
}

export default function BadgePortfolio({ wallet }: BadgePortfolioProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedBadge, setSelectedBadge] = useState<BadgeData | null>(null)
  
  const applicationId = getApplicationId()
  const { badges: userBadges, loading, error } = useAllEventBadges(applicationId)

  // Convert Firebase badges to BadgeData format
  const badges: BadgeData[] = useMemo(() => {
    if (!userBadges) return []
    
    return userBadges.map((badge) => {
      const categoryLowercase = badge.category.toLowerCase() as "conference" | "hackathon" | "meetup" | "workshop"
      
      return {
        id: badge.tokenId,
        eventName: badge.eventName,
        issuer: badge.owner.slice(0, 10) + '...',
        claimedAt: badge.claimedAt || new Date(),
        image: getCategoryEmoji(badge.category),
        verified: true,
        category: categoryLowercase,
        txHash: badge.aleoTxId || `Token ID: ${badge.tokenId}`,
        contractAddress: applicationId,
        tokenId: badge.tokenId,
        description: `Proof of attendance badge for ${badge.eventName}`,
      }
    })
  }, [userBadges, applicationId])

  const getCategoryEmoji = (category: string) => {
    const categoryMap: Record<string, string> = {
      conference: '🌐',
      Conference: '🌐',
      hackathon: '🏆',
      Hackathon: '🏆',
      meetup: '🎓',
      Meetup: '🎓',
      workshop: '🔒',
      Workshop: '🔒',
    }
    return categoryMap[category] || '🎫'
  }

  const filteredBadges = badges.filter((badge) => {
    const matchesCategory = selectedCategory === "all" || badge.category === selectedCategory
    const matchesSearch =
      badge.eventName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      badge.issuer.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const categoryStats = {
    all: badges.length,
    conference: badges.filter((b) => b.category === "conference").length,
    hackathon: badges.filter((b) => b.category === "hackathon").length,
    meetup: badges.filter((b) => b.category === "meetup").length,
    workshop: badges.filter((b) => b.category === "workshop").length,
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "conference":
        return "bg-blue-500/10 text-blue-700 border-blue-200"
      case "hackathon":
        return "bg-purple-500/10 text-purple-700 border-purple-200"
      case "meetup":
        return "bg-green-500/10 text-green-700 border-green-200"
      case "workshop":
        return "bg-orange-500/10 text-orange-700 border-orange-200"
      default:
        return "bg-gray-500/10 text-gray-700 border-gray-200"
    }
  }

  if (!wallet) {
    return (
      <Card className="border-2 border-dashed">
        <CardContent className="pt-8 text-center">
          <p className="text-muted-foreground mb-4">Please connect your wallet to view your badge portfolio</p>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-8 text-center">
          <div className="flex flex-col items-center gap-3">
            <svg className="animate-spin h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
            </svg>
            <p className="text-muted-foreground">Loading badges from blockchain...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="border-destructive/50">
        <CardContent className="pt-8 text-center">
          <p className="text-destructive mb-2">Failed to load badges</p>
          <p className="text-sm text-muted-foreground">{error}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="text-center md:text-left">
        <h2 className="text-4xl font-bold bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
          Your Badge Portfolio
        </h2>
        <p className="text-muted-foreground mt-2">All your verified attendance badges on Aleo blockchain</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4">
        <Card className="border-primary/20 bg-gradient-to-br from-primary/10 to-transparent hover:shadow-lg hover:shadow-primary/10 transition-all duration-300">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">Total Badges</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">{categoryStats.all}</div>
          </CardContent>
        </Card>

        <Card className="border-blue-500/20 bg-gradient-to-br from-blue-500/10 to-transparent hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">Conferences</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl md:text-3xl font-bold text-blue-600">{categoryStats.conference}</div>
          </CardContent>
        </Card>

        <Card className="border-purple-500/20 bg-gradient-to-br from-purple-500/10 to-transparent hover:shadow-lg hover:shadow-purple-500/10 transition-all duration-300">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">Hackathons</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl md:text-3xl font-bold text-purple-600">{categoryStats.hackathon}</div>
          </CardContent>
        </Card>

        <Card className="border-green-500/20 bg-gradient-to-br from-green-500/10 to-transparent hover:shadow-lg hover:shadow-green-500/10 transition-all duration-300">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">Meetups</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl md:text-3xl font-bold text-green-600">{categoryStats.meetup}</div>
          </CardContent>
        </Card>

        <Card className="border-orange-500/20 bg-gradient-to-br from-orange-500/10 to-transparent hover:shadow-lg hover:shadow-orange-500/10 transition-all duration-300">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">Workshops</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl md:text-3xl font-bold text-orange-600">{categoryStats.workshop}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Search & Filter
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Input
              placeholder="Search by event name or issuer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-input pl-10"
            />
            <svg className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </CardContent>
      </Card>

      <div>
        <Tabs defaultValue="all" onValueChange={setSelectedCategory} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="all">All ({categoryStats.all})</TabsTrigger>
            <TabsTrigger value="conference">Conferences ({categoryStats.conference})</TabsTrigger>
            <TabsTrigger value="hackathon">Hackathons ({categoryStats.hackathon})</TabsTrigger>
            <TabsTrigger value="meetup">Meetups ({categoryStats.meetup})</TabsTrigger>
            <TabsTrigger value="workshop">Workshops ({categoryStats.workshop})</TabsTrigger>
          </TabsList>

          <TabsContent value={selectedCategory} className="mt-6">
            {filteredBadges.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="pt-8 text-center text-muted-foreground">
                  <div className="text-4xl mb-3">🔍</div>
                  <p>No badges found matching your search.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredBadges.map((badge, index) => (
                  <Dialog key={badge.id}>
                    <DialogTrigger asChild>
                      <Card 
                        className="group hover:border-primary/50 transition-all duration-300 cursor-pointer overflow-hidden hover:shadow-xl hover:shadow-primary/20 hover:scale-105 animate-in fade-in slide-in-from-bottom-5 duration-500"
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        <CardContent className="pt-6 relative">
                          <div className="text-center">
                            <div className="text-6xl mb-4 transform group-hover:scale-110 transition-transform duration-300">{badge.image}</div>
                            <h4 className="font-semibold text-foreground mb-1 line-clamp-2">{badge.eventName}</h4>
                            <p className="text-xs text-muted-foreground mb-3">{badge.issuer}</p>
                            <div className="flex items-center justify-center gap-2 mb-4 flex-wrap">
                              <Badge className={`text-xs font-medium ${getCategoryColor(badge.category)}`}>{badge.category}</Badge>
                              {badge.verified && (
                                <Badge className="text-xs font-medium bg-green-500/10 text-green-700 border-green-200 flex items-center gap-1">
                                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                  Verified
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Claimed {badge.claimedAt.toLocaleDateString()}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mb-4">
                          <span className="text-5xl">{badge.image}</span>
                        </div>
                        <DialogTitle className="text-center text-xl">{badge.eventName}</DialogTitle>
                        <DialogDescription className="text-center">{badge.issuer}</DialogDescription>
                      </DialogHeader>

                      <div className="space-y-4">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground mb-1">Description</p>
                          <p className="text-sm text-foreground">{badge.description}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-1">Category</p>
                            <Badge className={`text-xs ${getCategoryColor(badge.category)}`}>{badge.category}</Badge>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-1">Status</p>
                            <Badge className="text-xs bg-green-500/10 text-green-700 border-green-200">Verified</Badge>
                          </div>
                        </div>

                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-1">Claimed Date</p>
                          <p className="text-sm font-mono">{badge.claimedAt.toLocaleString()}</p>
                        </div>

                        <div className="space-y-2">
                          <p className="text-xs font-medium text-muted-foreground">On-Chain Details</p>
                          <div className="bg-muted p-3 rounded-lg space-y-2">
                            <div>
                              <p className="text-xs text-muted-foreground">Transaction Hash</p>
                              <p className="text-xs font-mono break-all text-foreground">{badge.txHash}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Contract Address</p>
                              <p className="text-xs font-mono break-all text-foreground">{badge.contractAddress}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Token ID</p>
                              <p className="text-xs font-mono text-foreground">{badge.tokenId}</p>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2 pt-4">
                          <Button variant="outline" className="flex-1 bg-transparent hover:bg-primary/10">
                            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                            Explorer
                          </Button>
                          <Button className="flex-1 bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity">
                            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                            </svg>
                            Share
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/10 via-accent/5 to-transparent shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Portfolio Actions
          </CardTitle>
          <CardDescription>Export or share your badge portfolio</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Button variant="outline" className="bg-transparent hover:bg-primary/10">
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              Export as PDF
            </Button>
            <Button variant="outline" className="bg-transparent hover:bg-primary/10">
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export Data
            </Button>
            <Button className="bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity shadow-lg shadow-primary/20">
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              Share Profile
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
