"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useEventOperations } from "@/lib/linera"
import { getApplicationId } from "@/lib/config"
import { EventCategory } from "@/lib/linera/types"
import { useWallet } from "@/lib/wallet-context"

interface EventFormProps {
  onSubmit: (data: any) => void
  onSuccess?: () => void
}

export default function EventForm({ onSubmit, onSuccess }: EventFormProps) {
  const applicationId = getApplicationId()
  const { createEvent, loading: creating, error: createError } = useEventOperations(applicationId)
  const { account, isConnected } = useWallet()
  
  const [formData, setFormData] = useState({
    eventName: "",
    description: "",
    eventDate: "",
    location: "",
    category: "Meetup" as EventCategory,
    badgeMetadataUri: "",
    maxSupply: 100,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.eventName.trim()) return

    setIsSubmitting(true)
    setSuccessMessage("")

    try {
      // Convert date string to timestamp (microseconds)
      const eventDate = formData.eventDate 
        ? new Date(formData.eventDate).getTime() * 1000 
        : Date.now() * 1000

      console.log("Attempting to create event...", formData)
      
      const result = await createEvent({
        eventName: formData.eventName,
        description: formData.description,
        eventDate,
        location: formData.location,
        category: formData.category,
        badgeMetadataUri: formData.badgeMetadataUri || "ipfs://default",
        maxSupply: formData.maxSupply,
      })

      console.log("Event creation result:", result)

      if (result.success) {
        setSuccessMessage(`Event created successfully! TX: ${result.txHash?.slice(0, 10)}...`)
        // Also call the legacy onSubmit callback
        onSubmit(formData)
        // Reset form
        setFormData({
          eventName: "",
          description: "",
          eventDate: "",
          location: "",
          category: "Meetup" as EventCategory,
          badgeMetadataUri: "",
          maxSupply: 100,
        })
        onSuccess?.()
      }
    } catch (error: any) {
      console.error("Failed to create event:", error)
      // Error will be shown via createError state from hook
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="border-2 border-primary/20">
      <CardHeader>
        <CardTitle>Create New Event</CardTitle>
        <CardDescription>Deploy a new microchain for your event</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Event Name *</label>
            <Input
              placeholder="e.g., Linera Hackathon 2025"
              value={formData.eventName}
              onChange={(e) => setFormData({ ...formData, eventName: e.target.value })}
              className="bg-input"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <Textarea
              placeholder="Describe your event..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="bg-input min-h-[80px]"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Event Date</label>
              <Input
                type="datetime-local"
                value={formData.eventDate}
                onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                className="bg-input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Location</label>
              <Input
                placeholder="e.g., San Francisco, CA"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="bg-input"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Category</label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value as EventCategory })}
              >
                <SelectTrigger className="bg-input">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Conference">Conference</SelectItem>
                  <SelectItem value="Hackathon">Hackathon</SelectItem>
                  <SelectItem value="Meetup">Meetup</SelectItem>
                  <SelectItem value="Workshop">Workshop</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Max Badges</label>
              <Input
                type="number"
                min="1"
                placeholder="100"
                value={formData.maxSupply}
                onChange={(e) => setFormData({ ...formData, maxSupply: parseInt(e.target.value) || 100 })}
                className="bg-input"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Badge Image URI (optional)</label>
            <Input
              placeholder="ipfs://QmXxxx or https://..."
              value={formData.badgeMetadataUri}
              onChange={(e) => setFormData({ ...formData, badgeMetadataUri: e.target.value })}
              className="bg-input"
            />
            <p className="text-xs text-muted-foreground mt-1">Leave empty for default badge image</p>
          </div>

          {!isConnected && (
            <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <p className="text-sm text-yellow-700">⚠️ Wallet not connected. Please connect your Linera wallet first.</p>
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
              <p className="text-sm text-green-700">{successMessage}</p>
            </div>
          )}

          {createError && (
            <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg">
              <p className="text-sm text-destructive font-semibold">Error: {createError}</p>
              {!isConnected && (
                <p className="text-xs text-destructive/80 mt-1">Make sure your Linera wallet is connected.</p>
              )}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button 
              type="submit" 
              disabled={isSubmitting || creating || !formData.eventName.trim() || !isConnected}
              className="flex-1 bg-gradient-to-r from-primary to-accent hover:opacity-90"
            >
              {isSubmitting || creating ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                  Creating Event on Blockchain...
                </span>
              ) : "Deploy Microchain & Create Event"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
