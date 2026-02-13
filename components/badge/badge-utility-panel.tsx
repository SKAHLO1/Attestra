"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Share2, Download, CheckCircle, Trophy, ExternalLink } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface BadgeUtilityPanelProps {
    badgeId: string
    eventName: string
    eventDate: string
}

export default function BadgeUtilityPanel({ badgeId, eventName, eventDate }: BadgeUtilityPanelProps) {
    const [copied, setCopied] = useState(false)

    const handleShare = () => {
        const shareUrl = `${window.location.origin}/verify/${badgeId}`
        navigator.clipboard.writeText(shareUrl)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const handleExport = () => {
        // TODO: Implement PDF export
        console.log('Export badge as PDF:', badgeId)
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Share Badge */}
            <Card className="glass-card border-2 border-primary/20 hover:border-primary/40 transition-all duration-300 group">
                <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                            <Share2 className="w-5 h-5 text-primary" />
                        </div>
                        <CardTitle className="text-lg">Share Badge</CardTitle>
                    </div>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                        Generate a shareable verification link with QR code
                    </p>
                    <Button
                        onClick={handleShare}
                        className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90"
                    >
                        {copied ? (
                            <>
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Link Copied!
                            </>
                        ) : (
                            <>
                                <Share2 className="w-4 h-4 mr-2" />
                                Copy Share Link
                            </>
                        )}
                    </Button>
                </CardContent>
            </Card>

            {/* Export Portfolio */}
            <Card className="glass-card border-2 border-accent/20 hover:border-accent/40 transition-all duration-300 group">
                <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-accent/10 group-hover:bg-accent/20 transition-colors">
                            <Download className="w-5 h-5 text-accent" />
                        </div>
                        <CardTitle className="text-lg">Export Badge</CardTitle>
                    </div>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                        Download badge as PDF for your records
                    </p>
                    <Button
                        onClick={handleExport}
                        variant="outline"
                        className="w-full border-accent/50 hover:bg-accent/10"
                    >
                        <Download className="w-4 h-4 mr-2" />
                        Download PDF
                    </Button>
                </CardContent>
            </Card>

            {/* Verify Proof */}
            <Card className="glass-card border-2 border-secondary/20 hover:border-secondary/40 transition-all duration-300 group">
                <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-secondary/10 group-hover:bg-secondary/20 transition-colors">
                            <CheckCircle className="w-5 h-5 text-secondary" />
                        </div>
                        <CardTitle className="text-lg">Verify Proof</CardTitle>
                    </div>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                        View ZK proof verification on Aleo explorer
                    </p>
                    <Button
                        variant="outline"
                        className="w-full border-secondary/50 hover:bg-secondary/10"
                        asChild
                    >
                        <a href={`https://testnet.explorer.provable.com/transaction/${badgeId}`} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="w-4 h-4 mr-2" />
                            View on Explorer
                        </a>
                    </Button>
                </CardContent>
            </Card>

            {/* Reputation Preview */}
            <Card className="glass-card border-2 border-purple-500/20 hover:border-purple-500/40 transition-all duration-300 group relative overflow-hidden">
                <div className="absolute top-2 right-2">
                    <Badge variant="outline" className="glass-card border-purple-500/50 text-purple-500 text-xs">
                        Coming Soon
                    </Badge>
                </div>
                <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-purple-500/10 group-hover:bg-purple-500/20 transition-colors">
                            <Trophy className="w-5 h-5 text-purple-500" />
                        </div>
                        <CardTitle className="text-lg">Reputation Score</CardTitle>
                    </div>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                        Build privacy-preserving reputation from badges
                    </p>
                    <div className="space-y-2 opacity-60">
                        <div className="flex justify-between items-center text-sm">
                            <span>Total Events:</span>
                            <span className="font-bold text-purple-500">5</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span>Reputation Score:</span>
                            <span className="font-bold text-purple-500">250 pts</span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
