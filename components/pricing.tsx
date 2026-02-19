"use client"

import { Check, Zap, Building2, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

const tiers = [
  {
    name: "Free",
    icon: Sparkles,
    price: "$0",
    period: "forever",
    description: "Perfect for trying out Veleo or running a single event.",
    badge: null,
    cta: "Get Started Free",
    ctaVariant: "outline" as const,
    highlight: false,
    features: [
      "1 event",
      "10 badge codes per event",
      "Basic analytics dashboard",
      "QR code generation",
      "Firebase badge storage",
      "Aleo testnet transactions",
      "Community support",
    ],
    missing: [
      "Advanced analytics",
      "Priority support",
      "Custom integrations",
    ],
  },
  {
    name: "Pro",
    icon: Zap,
    price: "$29",
    period: "per month",
    description: "For active organizers running multiple events at scale.",
    badge: "Most Popular",
    cta: "Start Pro",
    ctaVariant: "default" as const,
    highlight: true,
    features: [
      "Unlimited events",
      "1,000 badge codes per month",
      "Advanced analytics & insights",
      "QR code generation & bulk export",
      "Firebase badge storage",
      "Aleo testnet transactions",
      "Priority email support",
      "Gated events (prerequisite badges)",
      "Reputation scoring",
    ],
    missing: [
      "Custom integrations",
      "Dedicated support",
    ],
  },
  {
    name: "Enterprise",
    icon: Building2,
    price: "Custom",
    period: "contact us",
    description: "For large organisations needing full control and dedicated support.",
    badge: null,
    cta: "Contact Sales",
    ctaVariant: "outline" as const,
    highlight: false,
    features: [
      "Unlimited events",
      "Unlimited badge codes",
      "Advanced analytics & custom reports",
      "QR code generation & bulk export",
      "Firebase badge storage",
      "Aleo mainnet & testnet support",
      "Dedicated account manager",
      "Custom smart contract integrations",
      "SLA guarantee",
      "SSO / SAML authentication",
      "On-premise deployment option",
    ],
    missing: [],
  },
]

interface PricingProps {
  onGetStarted?: (tier: string) => void
}

export default function Pricing({ onGetStarted }: PricingProps) {
  return (
    <section className="w-full py-20 bg-white" id="pricing">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 border border-gray-200 mb-6">
            <Zap className="w-4 h-4 text-gray-700" />
            <span className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Pricing</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Simple, transparent pricing
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Start free and scale as you grow. Every plan includes Aleo zero-knowledge proof transactions and Firebase-backed badge storage.
          </p>
        </div>

        {/* Tier Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {tiers.map((tier) => {
            const Icon = tier.icon
            return (
              <div
                key={tier.name}
                className={`relative flex flex-col rounded-3xl border-2 p-8 transition-all duration-300 ${
                  tier.highlight
                    ? "border-gray-900 bg-gray-900 text-white shadow-2xl scale-[1.03]"
                    : "border-gray-200 bg-white text-gray-900 hover:border-gray-400 hover:shadow-xl"
                }`}
              >
                {/* Popular badge */}
                {tier.badge && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <Badge className="bg-white text-gray-900 border border-gray-200 shadow-md px-4 py-1 text-xs font-bold uppercase tracking-wider">
                      {tier.badge}
                    </Badge>
                  </div>
                )}

                {/* Icon + Name */}
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                    tier.highlight ? "bg-white/10" : "bg-gray-100"
                  }`}>
                    <Icon className={`w-5 h-5 ${tier.highlight ? "text-white" : "text-gray-700"}`} />
                  </div>
                  <span className={`text-lg font-bold ${tier.highlight ? "text-white" : "text-gray-900"}`}>
                    {tier.name}
                  </span>
                </div>

                {/* Price */}
                <div className="mb-4">
                  <span className={`text-5xl font-black ${tier.highlight ? "text-white" : "text-gray-900"}`}>
                    {tier.price}
                  </span>
                  {tier.period && (
                    <span className={`ml-2 text-sm font-medium ${tier.highlight ? "text-gray-300" : "text-gray-500"}`}>
                      / {tier.period}
                    </span>
                  )}
                </div>

                {/* Description */}
                <p className={`text-sm mb-8 leading-relaxed ${tier.highlight ? "text-gray-300" : "text-gray-600"}`}>
                  {tier.description}
                </p>

                {/* CTA */}
                <Button
                  variant={tier.highlight ? "secondary" : tier.ctaVariant}
                  className={`w-full mb-8 h-12 rounded-2xl font-bold text-sm ${
                    tier.highlight
                      ? "bg-white text-gray-900 hover:bg-gray-100"
                      : tier.ctaVariant === "default"
                      ? ""
                      : "border-gray-300 hover:bg-gray-50"
                  }`}
                  onClick={() => onGetStarted?.(tier.name)}
                >
                  {tier.cta}
                </Button>

                {/* Divider */}
                <div className={`border-t mb-6 ${tier.highlight ? "border-white/10" : "border-gray-100"}`} />

                {/* Features */}
                <ul className="space-y-3 flex-1">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <div className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                        tier.highlight ? "bg-white/15" : "bg-gray-100"
                      }`}>
                        <Check className={`w-3 h-3 ${tier.highlight ? "text-white" : "text-gray-700"}`} />
                      </div>
                      <span className={`text-sm ${tier.highlight ? "text-gray-200" : "text-gray-700"}`}>
                        {feature}
                      </span>
                    </li>
                  ))}
                  {tier.missing.map((feature) => (
                    <li key={feature} className="flex items-start gap-3 opacity-35">
                      <div className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                        tier.highlight ? "bg-white/10" : "bg-gray-50"
                      }`}>
                        <span className={`text-xs font-bold ${tier.highlight ? "text-white" : "text-gray-400"}`}>—</span>
                      </div>
                      <span className={`text-sm line-through ${tier.highlight ? "text-gray-400" : "text-gray-400"}`}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>

        {/* Footer note */}
        <p className="text-center text-sm text-gray-500 mt-10">
          All plans include Aleo ZK-proof transactions on testnet. Badge creation fees (0.1 LEO/code) apply on-chain regardless of plan.
        </p>
      </div>
    </section>
  )
}
