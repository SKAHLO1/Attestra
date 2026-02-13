"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
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
import { ShieldAlert, Users, Calendar, Link, QrCode, Trash2, CheckCircle2, XCircle, MoreVertical } from "lucide-react"

interface Event {
  id: string
  name: string
  eventId: string
  badgesMinted: number
  attendees: number
  status: string
  createdAt: Date
  gated?: boolean
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

  const handleToggleStatus = async (event: Event) => {
    setActionLoading(true)
    try {
      await setEventActive(event.id, event.status !== 'active')
      onEventUpdated?.()
    } catch (error: any) {
      console.error('[EventList] Error toggling status:', error)
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      {events.map((event) => (
        <Card key={event.id} className="border-none shadow-xl rounded-[2rem] overflow-hidden bg-white hover:shadow-2xl transition-all duration-500 group relative">
          <div className={`absolute top-0 left-0 w-2 h-full ${event.status === 'active' ? 'bg-green-500' : 'bg-gray-300'}`} />

          <CardContent className="p-8">
            <div className="flex items-start justify-between mb-8">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-xl font-black text-gray-900 leading-tight">{event.name}</h4>
                  {event.gated && (
                    <div className="px-2 py-0.5 bg-blue-50 border border-blue-100 rounded-md flex items-center gap-1">
                      <ShieldAlert className="w-3 h-3 text-blue-500" />
                      <span className="text-[9px] font-black text-blue-600 uppercase">ZK-Gated</span>
                    </div>
                  )}
                </div>
                <p className="text-[10px] font-mono text-gray-400 truncate max-w-[200px]">{event.eventId}</p>
              </div>

              <div className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${event.status === 'active'
                ? 'bg-green-50 text-green-700 border-green-100'
                : 'bg-gray-50 text-gray-500 border-gray-100'
                }`}>
                {event.status}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="p-4 bg-gray-50 rounded-2xl">
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Badges</p>
                <p className="text-xl font-black text-gray-900">{event.badgesMinted}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-2xl">
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Attendees</p>
                <p className="text-xl font-black text-gray-900">{event.attendees}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-2xl">
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Created</p>
                <p className="text-[13px] font-bold text-gray-900 mt-1">{event.createdAt.toLocaleDateString()}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Dialog open={showAttendees && selectedEvent?.id === event.id} onOpenChange={(open) => {
                setShowAttendees(open)
                if (open) setSelectedEvent(event)
              }}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="h-10 rounded-xl px-4 font-bold text-xs border-gray-100 bg-gray-50 hover:bg-gray-100">
                    <Users className="w-4 h-4 mr-2" /> Attendees
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-xl rounded-[2.5rem] p-10">
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-black uppercase text-gray-900">Attendee Insights</DialogTitle>
                    <DialogDescription className="font-medium text-gray-500">Live participation data for {event.name}</DialogDescription>
                  </DialogHeader>
                  <div className="py-8 text-center text-gray-400 font-bold uppercase text-sm border-y border-gray-100 my-4">
                    Detailed user list coming soon
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog>
                <DialogTrigger asChild>
                  <Button size="sm" className="h-10 rounded-xl px-4 font-bold text-xs bg-gray-900 hover:bg-black text-white">
                    <QrCode className="w-4 h-4 mr-2" /> QR Console
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-2xl rounded-[2.5rem] p-10 overflow-y-auto max-h-[90vh]">
                  <QRCodeGenerator eventId={event.id} eventName={event.name} issuer="Veleo Organizer" />
                </DialogContent>
              </Dialog>

              <div className="flex-1" />

              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-xl hover:bg-gray-100"
                onClick={() => handleToggleStatus(event)}
                disabled={actionLoading}
              >
                {event.status === 'active' ? <XCircle className="w-5 h-5 text-red-400" /> : <CheckCircle2 className="w-5 h-5 text-green-400" />}
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
