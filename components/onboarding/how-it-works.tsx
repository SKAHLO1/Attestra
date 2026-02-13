"use client"

import { Card, CardContent } from "@/components/ui/card"

export default function HowItWorks() {
    const steps = [
        {
            number: "01",
            title: "Organizer Creates Event",
            description: "Deploy event to Aleo blockchain using create_event transition",
            detail: "On-chain transaction establishes event registry with privacy-preserving mappings",
            color: "from-primary/20 to-primary/5",
            borderColor: "border-primary/30",
        },
        {
            number: "02",
            title: "Generate Claim Codes",
            description: "Create unique claim codes stored securely in Firebase",
            detail: "Codes are single-use and linked to the event ID for verification",
            color: "from-accent/20 to-accent/5",
            borderColor: "border-accent/30",
        },
        {
            number: "03",
            title: "Attendees Claim Badges",
            description: "Scan QR code or enter claim code to initiate on-chain minting",
            detail: "ZK proof generated and badge minted via claim_badge transition",
            color: "from-secondary/20 to-secondary/5",
            borderColor: "border-secondary/30",
        },
        {
            number: "04",
            title: "Private Badge Records",
            description: "Badge record encrypted and owned exclusively by attendee",
            detail: "Only you can prove attendance. Verifiable but fully private.",
            color: "from-green-500/20 to-green-500/5",
            borderColor: "border-green-500/30",
        },
    ]

    return (
        <section className="py-16 px-4 bg-muted/30">
            <div className="max-w-6xl mx-auto">
                <div className="text-center mb-12">
                    <h2 className="text-4xl md:text-5xl font-bold gradient-text-hero mb-4">
                        How Veleo Works
                    </h2>
                    <p className="text-lg text-gray-900 dark:text-gray-100 max-w-2xl mx-auto">
                        Privacy-preserving attendance verification powered by Aleo's zero-knowledge proofs
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                    {steps.map((step, index) => (
                        <Card
                            key={index}
                            className={`glass-card border-2 ${step.borderColor} bg-gradient-to-br ${step.color} hover:scale-105 transition-all duration-300 group relative overflow-hidden`}
                        >
                            <div className="absolute top-0 right-0 text-8xl font-bold opacity-5 group-hover:opacity-10 transition-opacity">
                                {step.number}
                            </div>
                            <CardContent className="pt-6 relative z-10">
                                <div className="inline-block px-3 py-1 rounded-full bg-background/50 text-sm font-bold mb-4">
                                    Step {step.number}
                                </div>
                                <h3 className="text-lg font-bold mb-2">{step.title}</h3>
                                <p className="text-sm text-gray-900 dark:text-gray-100 mb-3">
                                    {step.description}
                                </p>
                                <p className="text-xs text-gray-800 dark:text-gray-200 italic">
                                    {step.detail}
                                </p>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Technical Flow Visualization */}
                <div className="glass p-8 rounded-2xl border-2 border-primary/20">
                    <h3 className="text-2xl font-bold mb-6 text-center gradient-text-primary">
                        Technical Architecture
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="text-center">
                            <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-primary/10 flex items-center justify-center border-2 border-primary/30">
                                <svg className="w-10 h-10 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                                </svg>
                            </div>
                            <h4 className="font-bold mb-2">Aleo Blockchain</h4>
                            <p className="text-sm text-gray-900 dark:text-gray-100">
                                Smart contract execution, ZK proof verification, private record storage
                            </p>
                        </div>

                        <div className="text-center">
                            <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-accent/10 flex items-center justify-center border-2 border-accent/30">
                                <svg className="w-10 h-10 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                                </svg>
                            </div>
                            <h4 className="font-bold mb-2">Firebase Backend</h4>
                            <p className="text-sm text-gray-900 dark:text-gray-100">
                                Event metadata, claim codes, user authentication, off-chain data
                            </p>
                        </div>

                        <div className="text-center">
                            <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-secondary/10 flex items-center justify-center border-2 border-secondary/30">
                                <svg className="w-10 h-10 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                            </div>
                            <h4 className="font-bold mb-2">Zero-Knowledge Proofs</h4>
                            <p className="text-sm text-gray-900 dark:text-gray-100">
                                Every transaction generates ZK-SNARKs proving validity without revealing private data
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}
