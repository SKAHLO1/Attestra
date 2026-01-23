"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import QRCodeGenerator from "./qr-code-generator"
import { useEventOperations } from "@/lib/services"
import { getApplicationId } from "@/lib/config"

interface Event {
  id: string
  name: string
  eventId: string
  badgesMinted: number
  attendees: number
  status: string
  createdAt: Date
}

interface EventListProps {
  events: Event[]
  onEventUpdated?: () => void
}

export default function EventList({ events, onEventUpdated }: EventListProps) {
  const applicationId = getApplicationId()
  const { setEventActive, loading: operationLoading } = useEventOperations()
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [showDetails, setShowDetails] = useState(false)
  const [showAttendees, setShowAttendees] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  const handleDeactivateEvent = async (event: Event) => {
    setActionLoading(true)
    try {
      console.log('[EventList] Deactivating event...')
      await setEventActive(event.id, false)
      console.log('[EventList] Event deactivated successfully')
      onEventUpdated?.()
    } catch (error: any) {
      console.error('[EventList] Error deactivating event:', error)
      alert('Error deactivating event: ' + error.message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleActivateEvent = async (event: Event) => {
    setActionLoading(true)
    try {
      console.log('[EventList] Activating event...')
      await setEventActive(event.id, true)
      console.log('[EventList] Event activated successfully')
      onEventUpdated?.()
    } catch (error: any) {
      console.error('[EventList] Error activating event:', error)
      alert('Error activating event: ' + error.message)
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-foreground">Current Event</h3>

      {events.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="pt-8 text-center text-muted-foreground">
            No event configured yet. Click "Create Event" above to set up your event.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {events.map((event) => (
            <Card key={event.id} className="hover:border-primary/50 transition-colors">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{event.name}</CardTitle>
                    <p className="text-xs text-muted-foreground font-mono mt-1">{event.eventId}</p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                    {event.status}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Badges Minted</p>
                    <p className="text-2xl font-bold text-primary">{event.badgesMinted}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Attendees</p>
                    <p className="text-2xl font-bold text-accent">{event.attendees}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Created</p>
                    <p className="text-sm font-medium">{event.createdAt.toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Dialog open={showAttendees && selectedEvent?.id === event.id} onOpenChange={(open) => {
                    setShowAttendees(open)
                    if (open) setSelectedEvent(event)
                  }}>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1 bg-transparent"
                        onClick={() => {
                          setSelectedEvent(event)
                          setShowAttendees(true)
                        }}
                      >
                        Manage Attendees
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Manage Attendees - {event.name}</DialogTitle>
                        <DialogDescription>View and manage event attendees</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="p-4 bg-muted rounded-lg">
                          <p className="text-sm font-medium mb-2">Total Attendees: {event.attendees}</p>
                          <p className="text-sm text-muted-foreground">Badges Claimed: {event.badgesMinted}</p>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          <p>💡 Attendee management features coming soon:</p>
                          <ul className="list-disc list-inside mt-2 space-y-1 ml-2">
                            <li>View list of all badge holders</li>
                            <li>Export attendee data</li>
                            <li>Send notifications to attendees</li>
                            <li>Revoke/transfer badges</li>
                          </ul>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                  
                  <Dialog open={showDetails && selectedEvent?.id === event.id} onOpenChange={(open) => {
                    setShowDetails(open)
                    if (open) setSelectedEvent(event)
                  }}>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1 bg-transparent"
                        onClick={() => {
                          setSelectedEvent(event)
                          setShowDetails(true)
                        }}
                      >
                        View Details
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Event Details - {event.name}</DialogTitle>
                        <DialogDescription>Full event information</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-3">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Event Name</p>
                            <p className="text-base font-semibold">{event.name}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Event ID</p>
                            <p className="text-xs font-mono bg-muted p-2 rounded break-all">{event.eventId}</p>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">Status</p>
                              <p className="text-base">
                                <span className="px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                                  {event.status}
                                </span>
                              </p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">Created</p>
                              <p className="text-base">{event.createdAt.toLocaleDateString()}</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">Badges Minted</p>
                              <p className="text-2xl font-bold text-primary">{event.badgesMinted}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">Total Attendees</p>
                              <p className="text-2xl font-bold text-accent">{event.attendees}</p>
                            </div>
                          </div>
                        </div>
                        <div className="pt-4 border-t">
                          <p className="text-sm text-muted-foreground mb-2">🔗 Quick Actions</p>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" className="flex-1" onClick={() => {
                              navigator.clipboard.writeText(event.eventId)
                            }}>
                              Copy Event ID
                            </Button>
                            <Button size="sm" variant="outline" className="flex-1" onClick={() => {
                              setShowDetails(false)
                              setShowAttendees(true)
                            }}>
                              Manage Attendees
                            </Button>
                          </div>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                  
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button size="sm" className="flex-1 bg-primary hover:bg-primary/90">
                        Generate QR Codes
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Generate QR Codes</DialogTitle>
                        <DialogDescription>Create QR codes for attendee claim codes</DialogDescription>
                      </DialogHeader>
                      <QRCodeGenerator eventId={event.id} eventName={event.name} issuer="Event Organizer" />
                    </DialogContent>
                  </Dialog>
                </div>
                
                <div className="mt-3 pt-3 border-t flex gap-2">
                  {event.status === 'active' ? (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          variant="destructive" 
                          size="sm" 
                          className="flex-1"
                          disabled={actionLoading || operationLoading}
                        >
                          {actionLoading ? 'Processing...' : 'Deactivate Event'}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Deactivate Event?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will prevent new attendees from claiming badges for this event.
                            You can reactivate it later. No data will be lost.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeactivateEvent(event)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Deactivate
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  ) : (
                    <Button 
                      variant="default" 
                      size="sm" 
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      onClick={() => handleActivateEvent(event)}
                      disabled={actionLoading || operationLoading}
                    >
                      {actionLoading ? 'Processing...' : 'Activate Event'}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
