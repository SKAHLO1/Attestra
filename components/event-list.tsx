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
import QRCodeGenerator from "./qr-code-generator"

interface Event {
  id: string
  name: string
  microchainId: string
  badgesMinted: number
  attendees: number
  status: string
  createdAt: Date
}

interface EventListProps {
  events: Event[]
}

export default function EventList({ events }: EventListProps) {
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-foreground">Your Events</h3>

      {events.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="pt-8 text-center text-muted-foreground">
            No events created yet. Create your first event to get started.
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
                    <p className="text-xs text-muted-foreground font-mono mt-1">{event.microchainId}</p>
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
                  <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                    Manage Attendees
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                    View Details
                  </Button>
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
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
