"use client"

import { Shield, Users, Lock, TrendingUp } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const useCases = [
    {
        icon: Shield,
        title: "Privacy-First Events",
        description: "Political rallies, medical conferences, and sensitive meetups where public attendance tracking could compromise privacy.",
        traditional: "Your attendance is visible to anyone with blockchain explorer access",
        veleo: "Zero-knowledge proofs keep your attendance private while maintaining verifiability",
        color: "from-green-500/20 to-green-600/5 border-green-500/30",
        iconColor: "text-green-500",
    },
    {
        icon: Users,
        title: "Corporate & Enterprise",
        description: "Company events, training sessions, and team gatherings where employee privacy matters.",
        traditional: "Public NFT minting reveals company structure and employee movements",
        veleo: "Private badge records protect organizational data while proving attendance",
        color: "from-blue-500/20 to-blue-600/5 border-blue-500/30",
        iconColor: "text-blue-500",
    },
    {
        icon: TrendingUp,
        title: "Hackathons & Competitions",
        description: "Verifiable participation in competitive events without exposing strategies or team affiliations publicly.",
        traditional: "Competitors can track your event attendance and infer your focus areas",
        veleo: "Prove participation privately, reveal only when it benefits you",
        color: "from-purple-500/20 to-purple-600/5 border-purple-500/30",
        iconColor: "text-purple-500",
    },
    {
        icon: Lock,
        title: "Exclusive Communities",
        description: "Token-gated communities and memberships with privacy guarantees for high-value participants.",
        traditional: "Public NFT ownership links your wallet to specific communities",
        veleo: "Access exclusive content while maintaining pseudonymity",
        color: "from-orange-500/20 to-orange-600/5 border-orange-500/30",
        iconColor: "text-orange-500",
    },
]

export default function UseCaseShowcase() {
    return (
        <section className="py-16 px-4">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-12">
                    <h2 className="text-4xl md:text-5xl font-bold gradient-text-hero mb-4">
                        Why Privacy Matters
                    </h2>
                    <p className="text-xl font-semibold text-gray-900 dark:text-gray-400 max-w-2xl mx-auto">
                        Not all attendance should be public. Here's where Veleo's privacy-first approach makes a real difference.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {useCases.map((useCase, index) => (
                        <Card
                            key={index}
                            className={`glass-card border-2 bg-gradient-to-br ${useCase.color} hover:scale-[1.02] transition-all duration-300 card-hover-3d group`}
                        >
                            <CardHeader>
                                <div className="flex items-start gap-4">
                                    <div className={`p-3 rounded-xl bg-background/50 ${useCase.iconColor} group-hover:scale-110 transition-transform duration-300`}>
                                        <useCase.icon className="w-6 h-6" />
                                    </div>
                                    <div className="flex-1">
                                        <CardTitle className="text-xl mb-2">{useCase.title}</CardTitle>
                                        <p className="text-sm text-gray-900 dark:text-black-200">{useCase.description}</p>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                                        <p className="text-sm font-medium text-destructive mb-1">❌ Traditional NFTs</p>
                                        <p className="text-xs text-gray-900 dark:text-gray-black-200">{useCase.traditional}</p>
                                    </div>
                                    <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                                        <p className="text-sm font-medium text-green-600 dark:text-green-400 mb-1">✅ Veleo</p>
                                        <p className="text-xs text-gray-900 dark:text-black-200">{useCase.veleo}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <div className="mt-12 p-6 glass rounded-2xl border-2 border-primary/20">
                    <div className="flex flex-col md:flex-row items-center gap-6">
                        <div className="flex-shrink-0 w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                            <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </div>
                        <div className="flex-1 text-center md:text-left">
                            <h3 className="text-xl font-bold mb-2">The Key Difference: On-Demand Minting</h3>
                            <p className="text-gray-900 dark:text-gray-100">
                                Traditional NFTs require pre-minting (organizers pay gas for every potential attendee).
                                Veleo badges are minted <span className="font-semibold text-primary">only when claimed</span> —
                                drastically reducing costs and enabling unlimited scalability.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}
