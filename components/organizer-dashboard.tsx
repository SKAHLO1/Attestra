"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import EventForm from "./event-form"
import EventList from "./event-list"
import { useEventInfo } from "@/lib/services"
import { getApplicationId } from "@/lib/config"
import { useAuth } from "@/lib/firebase/auth-context"
import { LogOut, User, Plus, Calendar, ShieldCheck, Users, BarChart3, ChevronRight, Activity } from "lucide-react"

interface OrganizerDashboardProps {
  wallet: string | null
}

export default function OrganizerDashboard({ wallet }: OrganizerDashboardProps) {
  const applicationId = getApplicationId()
  const { events: firebaseEvents, loading, error, refetch } = useEventInfo(applicationId)
  const { user, userProfile, logout } = useAuth()

  const [showForm, setShowForm] = useState(false)

  // Map Firebase events to component format
  const events = firebaseEvents.map(event => ({
    id: event.id,
    name: event.name,
    eventId: event.id,
    badgesMinted: event.badgesMinted || 0,
    attendees: event.attendees || 0,
    status: event.isActive ? "active" : "inactive",
    createdAt: event.createdAt,
    gated: !!(event.prerequisiteEventId || (event.minReputationLevel && event.minReputationLevel > 0))
  }))

  const handleCreateEvent = (eventData: any) => {
    setShowForm(false)
    setTimeout(() => refetch(), 1500)
  }

  if (!wallet) {
    return (
      <Card className="border-2 border-dashed border-gray-200 rounded-3xl p-12 text-center bg-gray-50 animate-in fade-in zoom-in-95 duration-500">
        <div className="w-16 h-16 rounded-2xl bg-white shadow-sm border border-gray-100 flex items-center justify-center mx-auto mb-6">
          <User className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Organizer Authentication Required</h3>
        <p className="text-gray-500 mb-8 max-w-xs mx-auto">Please connect your organizer wallet to manage events and issue ZK-badges.</p>
      </Card>
    )
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 bg-gray-900 text-white text-[10px] font-black uppercase tracking-widest rounded-full">Organizer Portal</span>
            {events.length > 0 && <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pr-2 border-r border-gray-200">{events.length} Events Active</span>}
          </div>
          <h2 className="text-4xl font-black text-gray-900 tracking-tight uppercase">Event Dashboard</h2>
          <p className="text-gray-500 mt-2 font-medium">Coordinate private attendance and ZK-badge issuance.</p>
        </div>

        <Button
          onClick={() => setShowForm(!showForm)}
          className={`h-14 px-8 rounded-2xl font-black uppercase tracking-widest transition-all duration-300 shadow-2xl ${showForm ? 'bg-gray-100 text-gray-900 hover:bg-gray-200 shadow-none' : 'bg-gray-900 text-white hover:bg-black shadow-gray-200 hover:scale-[1.02]'}`}
        >
          {showForm ? "Close Form" : <span className="flex items-center gap-2"><Plus className="w-5 h-5" /> Create Gated Event</span>}
        </Button>
      </div>

      {showForm && (
        <div className="animate-in slide-in-from-top-6 duration-500">
          <EventForm
            onSubmit={handleCreateEvent}
            onSuccess={() => {
              setShowForm(false)
              setTimeout(() => refetch(), 2000)
            }}
          />
        </div>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: "Total Events", value: events.length, icon: <Calendar className="w-5 h-5 text-blue-500" /> },
          { label: "Badges Issued", value: events.reduce((sum, e) => sum + e.badgesMinted, 0), icon: <ShieldCheck className="w-5 h-5 text-green-500" /> },
          { label: "Verified Attendees", value: events.reduce((sum, e) => sum + e.attendees, 0), icon: <Users className="w-5 h-5 text-purple-500" /> },
          { label: "Eco Consistency", value: "94%", icon: <Activity className="w-5 h-5 text-orange-500" /> },
        ].map((stat, i) => (
          <Card key={i} className="border-gray-100 bg-white shadow-xl shadow-gray-100/50 rounded-3xl p-6 border-b-4 border-b-gray-50 hover:border-b-blue-500 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2.5 bg-gray-50 rounded-xl">{stat.icon}</div>
              <BarChart3 className="w-4 h-4 text-gray-200" />
            </div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{stat.label}</p>
            <h4 className="text-2xl font-black text-gray-900">{stat.value}</h4>
          </Card>
        ))}
      </div>

      {loading && (
        <div className="py-20 flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-gray-900 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Synchronizing Aleo Slate...</p>
        </div>
      )}

      {!loading && events.length === 0 && (
        <div className="py-20 bg-gray-50 rounded-[3rem] border-2 border-dashed border-gray-200 text-center">
          <h4 className="text-xl font-black text-gray-400 uppercase">System Ready</h4>
          <p className="text-gray-400 mt-2">Deploy your first private event to begin issuance.</p>
        </div>
      )}

      {!loading && events.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-8 bg-gray-900 rounded-full" />
            <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Active Issuance</h3>
          </div>
          <EventList events={events as any} onEventUpdated={refetch} />
        </div>
      )}
    </div>
  )
}
