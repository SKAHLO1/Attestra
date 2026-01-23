"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import EventForm from "./event-form"
import EventList from "./event-list"
import { useEventInfo } from "@/lib/services"
import { getApplicationId } from "@/lib/config"
import { useAuth } from "@/lib/firebase/auth-context"
import { LogOut, User } from "lucide-react"

interface OrganizerDashboardProps {
  wallet: string | null
}

export default function OrganizerDashboard({ wallet }: OrganizerDashboardProps) {
  const applicationId = getApplicationId()
  const { events: firebaseEvents, loading, error, refetch } = useEventInfo(applicationId)
  const { user, userProfile, logout } = useAuth()
  
  const [showForm, setShowForm] = useState(false)

  const handleLogout = async () => {
    await logout()
  }

  // Map Firebase events to component format
  const events = firebaseEvents.map(event => ({
    id: event.id,
    name: event.name,
    eventId: event.id.slice(0, 20) + "...",
    badgesMinted: 0, // TODO: Count from badges collection
    attendees: 0, // TODO: Count from badges collection
    status: event.isActive ? "active" : "inactive",
    createdAt: event.createdAt,
  }))

  const handleCreateEvent = (eventData: any) => {
    // Event creation is handled by the EventForm component
    setShowForm(false)
    // Refetch to get updated event data
    setTimeout(() => {
      console.log('[Dashboard] Refetching event info after creation...')
      refetch()
    }, 1500)
  }

  if (!wallet) {
    return (
      <Card className="border-2 border-dashed">
        <CardContent className="pt-8 text-center">
          <p className="text-muted-foreground mb-4">Please connect your wallet to create events</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4">
        {/* User Info Bar */}
        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-foreground">{userProfile?.displayName || user?.email}</p>
              <p className="text-xs text-muted-foreground">Event Organizer</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={handleLogout} className="gap-2">
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        </div>

        {/* Dashboard Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Event Dashboard
            </h2>
            <p className="text-muted-foreground mt-1">Manage your events and issue attendance badges</p>
            {events.length > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                📍 Managing: <span className="font-mono font-semibold">{events.length} event{events.length !== 1 ? 's' : ''}</span>
              </p>
            )}
          </div>
          <Button 
            onClick={() => setShowForm(!showForm)} 
            className="bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity shadow-lg shadow-primary/20"
          >
            {showForm ? "Cancel" : "+ Create Event"}
          </Button>
        </div>
      </div>

      {showForm && (
        <div className="animate-in slide-in-from-top duration-300">
          <EventForm 
            onSubmit={handleCreateEvent} 
            onSuccess={() => {
              setShowForm(false)
              setTimeout(() => refetch(), 2000)
            }} 
          />
        </div>
      )}

      {loading && (
        <Card>
          <CardContent className="pt-8 text-center">
            <div className="flex flex-col items-center gap-3">
              <svg className="animate-spin h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
              </svg>
              <p className="text-muted-foreground">Loading event data from blockchain...</p>
            </div>
          </CardContent>
        </Card>
      )}

      {error && !loading && (
        <Card className="border-yellow-500/50">
          <CardContent className="pt-6">
            <p className="text-yellow-700 mb-2 font-medium">⚠️ No events created yet</p>
            <p className="text-sm text-muted-foreground">Click "Create Event" above to set up your first event.</p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent hover:shadow-lg hover:shadow-primary/10 transition-all duration-300">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Total Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              {events.length}
            </div>
          </CardContent>
        </Card>

        <Card className="border-accent/20 bg-gradient-to-br from-accent/5 to-transparent hover:shadow-lg hover:shadow-accent/10 transition-all duration-300">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <svg className="w-4 h-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              Total Badges Minted
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-accent">
              {events.reduce((sum, e) => sum + e.badgesMinted, 0)}
            </div>
          </CardContent>
        </Card>

        <Card className="border-secondary/20 bg-gradient-to-br from-secondary/5 to-transparent hover:shadow-lg hover:shadow-secondary/10 transition-all duration-300">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <svg className="w-4 h-4 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              Total Attendees
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-secondary">
              {events.reduce((sum, e) => sum + e.attendees, 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      <EventList events={events} onEventUpdated={refetch} />
    </div>
  )
}
