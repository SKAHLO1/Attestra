"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useEventOperations, useEventInfo } from "@/lib/services"
import { EventCategory } from "@/lib/services/types"
import { useFlowWallet } from "@/lib/flow/hooks"
import { getFlowClient } from "@/lib/flow/client"
import * as fcl from "@onflow/fcl"
import { deleteDoc, doc } from "firebase/firestore"
import { db } from "@/lib/firebase/config"
import { ShieldCheck, UserCheck } from "lucide-react"

interface EventFormProps {
  onSubmit: (data: any) => void
  onSuccess?: () => void
}

const EVENT_CREATION_FEE = 100 // 100 FLOW fixed fee

export default function EventForm({ onSubmit, onSuccess }: EventFormProps) {
  const { createEvent, loading: creating, error: createError } = useEventOperations()
  const { events: allEvents } = useEventInfo()
  const { address, verified } = useFlowWallet()

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    startDate: "",
    endDate: "",
    location: "",
    category: "Conference" as EventCategory,
    imageUrl: "",
    maxAttendees: 100,
    prerequisiteEventId: "none",
    minReputationLevel: 0,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  const [errorMessage, setErrorMessage] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) return

    if (!address) {
      alert("Please connect your Flow wallet to create an event")
      return
    }

    if (!verified) {
      alert("Wallet ownership not verified. Please disconnect and reconnect your wallet to verify ownership before creating an event.")
      return
    }

    setIsSubmitting(true)
    setSuccessMessage("")
    setErrorMessage("")

    try {
      // Step 1: Build the Firebase event payload
      const startDate = formData.startDate ? new Date(formData.startDate) : new Date();
      const endDate = formData.endDate ? new Date(formData.endDate) : new Date(Date.now() + 2 * 60 * 60 * 1000); // +2h default
      if (isNaN(startDate.getTime())) throw new Error('Invalid start date — please select a valid date.');
      if (isNaN(endDate.getTime())) throw new Error('Invalid end date — please select a valid date.');
      if (endDate < startDate) throw new Error('End date must be after start date.');

      const eventData: any = {
        name: formData.name,
        description: formData.description,
        startDate,
        endDate,
        location: formData.location,
        category: formData.category,
        imageUrl: formData.imageUrl,
        maxAttendees: formData.maxAttendees,
        isActive: true,
        minReputationLevel: formData.minReputationLevel,
      };
      if (formData.prerequisiteEventId !== "none") {
        eventData.prerequisiteEventId = formData.prerequisiteEventId;
      }

      // Step 2: Create Firebase doc first — its ID becomes the canonical eventId
      // used on BOTH Firebase and the Flow chain so claimBadge can always find the event.
      const eventId = await createEvent(eventData);
      console.log(`[EventForm] Firebase event created with ID: ${eventId}`);

      // Step 3: Flow on-chain registration (mandatory — 100 FLOW fee)
      try {
        // Pin metadata server-side so SYNAPSE_PRIVATE_KEY stays off the client
        const pinRes = await fetch('/api/pin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'event',
            data: {
              eventId,
              name: formData.name,
              description: formData.description,
              location: formData.location,
              startDate: formData.startDate || new Date().toISOString(),
              endDate: formData.endDate || new Date().toISOString(),
              category: formData.category,
              organizerId: address,
              maxAttendees: formData.maxAttendees,
              imageUrl: formData.imageUrl,
              createdAt: new Date().toISOString(),
            },
          }),
        });
        if (!pinRes.ok) throw new Error(await pinRes.text());
        const ipfsResult = await pinRes.json();
        if (ipfsResult.pending) {
          console.warn('[EventForm] Filecoin unavailable — proceeding without CID');
        } else {
          console.log('[EventForm] Event metadata pinned to Filecoin, CID:', ipfsResult.cid);
        }

        // Ensure FCL wallet is authenticated so the popup fires
        const currentUser = await fcl.currentUser.snapshot();
        if (!currentUser.loggedIn) {
          await fcl.authenticate();
        }

        const flowClient = getFlowClient();

        // Pre-flight: verify organizer has at least 100 FLOW before sending tx
        const balance = await flowClient.getFlowBalance(address!);
        if (balance < EVENT_CREATION_FEE) {
          throw new Error(
            `Insufficient FLOW balance. You have ${balance.toFixed(2)} FLOW but need ${EVENT_CREATION_FEE} FLOW to create an event.`
          );
        }

        // Pass the Firebase doc ID as the Flow eventId — single source of truth
        const txResult = await flowClient.createEvent(eventId, formData.maxAttendees, ipfsResult.cid ?? '');
        console.log('[EventForm] Event registered on Flow chain! TX:', txResult.transactionId);

        // Write flowTxId back to the Firebase doc so chain ↔ DB are permanently linked
        const { updateDoc, doc: firestoreDoc } = await import('firebase/firestore');
        await updateDoc(firestoreDoc(db, 'events', eventId), { flowTxId: txResult.transactionId });
      } catch (txError: any) {
        // Flow tx failed — roll back the Firebase doc so no orphan record exists
        console.error('[EventForm] Flow tx failed, rolling back Firebase doc:', eventId);
        await deleteDoc(doc(db, 'events', eventId));
        throw txError;
      }

      setSuccessMessage(`Event created successfully! Fee: ${EVENT_CREATION_FEE} FLOW`)
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
        prerequisiteEventId: "none",
        minReputationLevel: 0,
      })
      onSuccess?.()
    } catch (error: any) {
      console.error("Failed to create event:", error)
      setErrorMessage(error.message || 'Failed to create event. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="border border-gray-200 bg-white shadow-xl rounded-3xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
      <CardHeader className="bg-gray-50 border-b border-gray-100 pb-8">
        <CardTitle className="text-2xl font-bold text-gray-900">Create New Event</CardTitle>
        <CardDescription className="text-gray-500">Deploy an event on Flow blockchain with Filecoin media storage and AI verification</CardDescription>
      </CardHeader>
      <CardContent className="pt-8 px-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <h4 className="text-sm font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
              <span className="w-8 h-px bg-gray-200" /> General Information
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-700 uppercase ml-1">Event Name *</label>
                <Input
                  placeholder="e.g., Flow Hackathon 2025"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="bg-gray-50 border-gray-200 focus:border-gray-900 rounded-xl h-11"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-700 uppercase ml-1">Category</label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value as EventCategory })}
                >
                  <SelectTrigger className="bg-gray-50 border-gray-200 focus:border-gray-900 rounded-xl h-11">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="Conference">Conference</SelectItem>
                    <SelectItem value="Hackathon">Hackathon</SelectItem>
                    <SelectItem value="Meetup">Meetup</SelectItem>
                    <SelectItem value="Workshop">Workshop</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-700 uppercase ml-1">Description</label>
              <Textarea
                placeholder="Describe your event and what attendees will learn..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="bg-gray-50 border-gray-200 focus:border-gray-900 rounded-xl min-h-[100px] resize-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-700 uppercase ml-1">Location</label>
                <Input
                  placeholder="e.g., San Francisco, CA"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="bg-gray-50 border-gray-200 focus:border-gray-900 rounded-xl h-11"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-700 uppercase ml-1">Max Attendees</label>
                <Input
                  type="number"
                  min="1"
                  placeholder="100"
                  value={formData.maxAttendees}
                  onChange={(e) => setFormData({ ...formData, maxAttendees: parseInt(e.target.value) || 100 })}
                  className="bg-gray-50 border-gray-200 focus:border-gray-900 rounded-xl h-11"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-700 uppercase ml-1">Start Date</label>
                <Input
                  type="datetime-local"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="bg-gray-50 border-gray-200 focus:border-gray-900 rounded-xl h-11"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-700 uppercase ml-1">End Date</label>
                <Input
                  type="datetime-local"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="bg-gray-50 border-gray-200 focus:border-gray-900 rounded-xl h-11"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-gray-100">
            <h4 className="text-sm font-black text-blue-500 uppercase tracking-widest flex items-center gap-2">
              <span className="w-8 h-px bg-blue-100" /> ZK-Eligibility Criteria
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-700 uppercase ml-1 flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
                  Prerequisite Badge
                </label>
                <Select
                  value={formData.prerequisiteEventId}
                  onValueChange={(value) => setFormData({ ...formData, prerequisiteEventId: value })}
                >
                  <SelectTrigger className="bg-blue-50/30 border-blue-100 focus:border-blue-500 rounded-xl h-11">
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="none">None (Open to all)</SelectItem>
                    {allEvents.map((event) => (
                      <SelectItem key={event.id} value={event.id}>{event.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[10px] text-gray-400 italic ml-1">Users must own this event's badge to claim</p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-700 uppercase ml-1 flex items-center gap-2">
                  <UserCheck className="w-3.5 h-3.5 text-blue-500" />
                  Min. Reputation Level
                </label>
                <Select
                  value={formData.minReputationLevel.toString()}
                  onValueChange={(value) => setFormData({ ...formData, minReputationLevel: parseInt(value) })}
                >
                  <SelectTrigger className="bg-blue-50/30 border-blue-100 focus:border-blue-500 rounded-xl h-11">
                    <SelectValue placeholder="Level 0" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="0">Level 0 (Beginner)</SelectItem>
                    <SelectItem value="1">Level 1 (Initiate - 1+ Badge)</SelectItem>
                    <SelectItem value="3">Level 2 (Voyager - 3+ Badges)</SelectItem>
                    <SelectItem value="5">Level 3 (Visionary - 5+ Badges)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-[10px] text-gray-400 italic ml-1">Minimum total badges required to enter</p>
              </div>
            </div>
          </div>

          <div className="pt-6">
            {successMessage && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-2xl mb-6 flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                  <ShieldCheck className="w-3.5 h-3.5 text-white" />
                </div>
                <p className="text-sm text-green-700 font-bold">{successMessage}</p>
              </div>
            )}

            {(errorMessage || createError) && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-2xl mb-6 flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-xs font-black">!</span>
                </div>
                <p className="text-sm text-red-700 font-bold">{errorMessage || createError}</p>
              </div>
            )}

            <Button
              type="submit"
              disabled={isSubmitting || creating || !formData.name.trim()}
              className="w-full h-14 bg-gray-900 hover:bg-black text-white rounded-2xl font-black uppercase tracking-widest shadow-2xl shadow-gray-200 transition-all duration-300 hover:scale-[1.02] active:scale-95"
            >
              {isSubmitting || creating ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Deploying on Flow...
                </span>
              ) : "Create Gated Event"}
            </Button>
            <p className="text-center text-[10px] text-gray-400 font-bold uppercase tracking-tight mt-4">
              Estimated Deployment Fee: <span className="text-gray-900">{EVENT_CREATION_FEE} FLOW</span>
            </p>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
