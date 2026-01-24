"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useEventOperations } from "@/lib/services"
import { EventCategory } from "@/lib/services/types"
import { useWallet } from "@demox-labs/aleo-wallet-adapter-react"

interface EventFormProps {
  onSubmit: (data: any) => void
  onSuccess?: () => void
}

const EVENT_CREATION_FEE = 0.1 // 0.1 LEO

export default function EventForm({ onSubmit, onSuccess }: EventFormProps) {
  const { createEvent, loading: creating, error: createError } = useEventOperations()
  const { publicKey, requestExecution } = useWallet()
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    startDate: "",
    endDate: "",
    location: "",
    category: "Conference" as EventCategory,
    imageUrl: "",
    maxAttendees: 100,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) return

    if (!publicKey) {
      alert("Please connect your wallet to create an event")
      return
    }

    setIsSubmitting(true)
    setSuccessMessage("")

    try {
      // Call Aleo smart contract to create event (includes 0.1 LEO fee)
      console.log(`[EventForm] Creating event on Aleo blockchain...`)
      
      if (requestExecution) {
        try {
          // Generate event ID from event name and timestamp
          const eventIdHash = `${Date.now()}${formData.name}`.split('').reduce((acc, char) => {
            return ((acc << 5) - acc) + char.charCodeAt(0);
          }, 0);
          
          // Call attendance_badge.aleo create_event function
          const aleoTransaction = {
            address: publicKey,
            chainId: "testnetbeta",
            program: "attendance_badge.aleo",
            functionName: "create_event",
            inputs: [
              `${Math.abs(eventIdHash)}field`, // event_id as field
              `${formData.maxAttendees}u64` // max_attendees
            ],
            fee: 100000, // 0.1 credits for transaction fee
            feePrivate: false,
            transitions: []
          } as any
          
          console.log('[EventForm] Calling smart contract create_event...', aleoTransaction)
          const txId = await requestExecution(aleoTransaction)
          console.log('[EventForm] Event created on-chain! Transaction ID:', txId)
          
          // Wait for transaction to be confirmed
          await new Promise(resolve => setTimeout(resolve, 3000))
        } catch (txError: any) {
          console.error('[EventForm] Smart contract call failed:', txError)
          throw new Error(`Blockchain transaction failed: ${txError.message}`)
        }
      }
      
      // Also store in Firebase for UI/metadata
      const eventId = await createEvent({
        name: formData.name,
        description: formData.description,
        startDate: new Date(formData.startDate || Date.now()),
        endDate: new Date(formData.endDate || Date.now()),
        location: formData.location,
        category: formData.category,
        imageUrl: formData.imageUrl,
        maxAttendees: formData.maxAttendees,
        isActive: true,
      })

      setSuccessMessage(`Event created successfully! Fee: ${EVENT_CREATION_FEE} LEO`)
      onSubmit(formData)
      setFormData({
        name: "",
        description: "",
        startDate: "",
        endDate: "",
        location: "",
        category: "Conference" as EventCategory,
        imageUrl: "",
        maxAttendees: 100,
      })
      onSuccess?.()
    } catch (error: any) {
      console.error("Failed to create event:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="border-2 border-primary/20">
      <CardHeader>
        <CardTitle>Create New Event</CardTitle>
        <CardDescription>Create a new event and issue attendance badges</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Event Name *</label>
            <Input
              placeholder="e.g., Aleo Hackathon 2025"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
              <label className="block text-sm font-medium mb-2">Start Date</label>
              <Input
                type="datetime-local"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="bg-input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">End Date</label>
              <Input
                type="datetime-local"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="bg-input"
              />
            </div>
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
              <label className="block text-sm font-medium mb-2">Max Attendees</label>
              <Input
                type="number"
                min="1"
                placeholder="100"
                value={formData.maxAttendees}
                onChange={(e) => setFormData({ ...formData, maxAttendees: parseInt(e.target.value) || 100 })}
                className="bg-input"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Event Image URL (optional)</label>
            <Input
              placeholder="https://example.com/image.jpg"
              value={formData.imageUrl}
              onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
              className="bg-input"
            />
            <p className="text-xs text-muted-foreground mt-1">Leave empty for default image</p>
          </div>

          {successMessage && (
            <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
              <p className="text-sm text-green-700">{successMessage}</p>
            </div>
          )}

          {createError && (
            <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg">
              <p className="text-sm text-destructive font-semibold">Error: {createError}</p>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button 
              type="submit" 
              disabled={isSubmitting || creating || !formData.name.trim()}
              className="flex-1 bg-gradient-to-r from-primary to-accent hover:opacity-90"
            >
              {isSubmitting || creating ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                  Creating Event...
                </span>
              ) : "Create Event"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
