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
import { ShieldAlert, Users, Calendar, Link, QrCode, Trash2, CheckCircle2, XCircle, MoreVertical, BrainCircuit, Upload, Loader2, ShieldCheck, AlertTriangle } from "lucide-react"

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

interface AIVerifyState {
  status: 'idle' | 'analyzing' | 'done' | 'error'
  message?: string
  confidence?: number
  detected?: boolean
  crowdSize?: number
  proofHash?: string
  filecoinCid?: string
  flowTxId?: string
}

export default function EventList({ events, onEventUpdated }: EventListProps) {
  const applicationId = getApplicationId()
  const { setEventActive, loading: operationLoading } = useEventOperations()
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [showDetails, setShowDetails] = useState(false)
  const [showAttendees, setShowAttendees] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [aiVerifyOpen, setAiVerifyOpen] = useState<string | null>(null)
  const [aiState, setAiState] = useState<AIVerifyState>({ status: 'idle' })
  const [imageUrls, setImageUrls] = useState<string>('')

  const handleAIVerify = async (event: Event) => {
    const urls = imageUrls.split('\n').map(u => u.trim()).filter(Boolean)
    if (urls.length === 0) {
      setAiState({ status: 'error', message: 'Please enter at least one image URL.' })
      return
    }
    setAiState({ status: 'analyzing' })
    try {
      const res = await fetch('/api/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId: event.id, imageUrls: urls }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Verification failed')
      }
      const result = await res.json()
      setAiState({
        status: 'done',
        confidence: result.confidence,
        detected: result.verified,
        crowdSize: result.crowdSize,
        proofHash: result.proofHash,
        filecoinCid: result.ipfsCid,
        flowTxId: result.flowTxId,
      })
    } catch (err: any) {
      setAiState({ status: 'error', message: err.message })
    }
  }

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
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-black uppercase text-gray-900">QR Console</DialogTitle>
                    <DialogDescription className="font-medium text-gray-500">Generate and manage claim codes for {event.name}</DialogDescription>
                  </DialogHeader>
                  <QRCodeGenerator eventId={event.id} eventName={event.name} issuer="Attestra Organizer" />
                </DialogContent>
              </Dialog>

              {/* AI Verification Dialog */}
              <Dialog
                open={aiVerifyOpen === event.id}
                onOpenChange={(open) => {
                  setAiVerifyOpen(open ? event.id : null)
                  if (!open) { setAiState({ status: 'idle' }); setImageUrls('') }
                }}
              >
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline" className="h-10 rounded-xl px-4 font-bold text-xs border-purple-100 bg-purple-50 hover:bg-purple-100 text-purple-700">
                    <BrainCircuit className="w-4 h-4 mr-2" /> AI Verify
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg rounded-[2.5rem] p-10 overflow-y-auto max-h-[90vh]">
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-black uppercase text-gray-900">AI Attendance Verification</DialogTitle>
                    <DialogDescription className="font-medium text-gray-500">
                      Gemini Flash 2.0 analyzes your event photos. The result is hashed and committed on-chain via the oracle.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="mt-6 space-y-5">
                    {/* Image URL input */}
                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">
                        Event Photo URLs <span className="text-gray-300">(one per line)</span>
                      </label>
                      <textarea
                        className="w-full min-h-[100px] p-3 rounded-xl border border-gray-200 text-sm font-mono resize-y focus:outline-none focus:ring-2 focus:ring-purple-200"
                        placeholder={"https://example.com/event-photo1.jpg\nhttps://example.com/event-photo2.jpg"}
                        value={imageUrls}
                        onChange={e => setImageUrls(e.target.value)}
                        disabled={aiState.status === 'analyzing'}
                      />
                      <p className="text-[10px] text-gray-400 mt-1">Use publicly accessible URLs. Filecoin gateway URLs work too.</p>
                    </div>

                    {/* Run button */}
                    {aiState.status !== 'done' && (
                      <Button
                        className="w-full h-12 rounded-xl font-black uppercase tracking-widest bg-purple-600 hover:bg-purple-700 text-white"
                        onClick={() => handleAIVerify(event)}
                        disabled={aiState.status === 'analyzing' || !imageUrls.trim()}
                      >
                        {aiState.status === 'analyzing' ? (
                          <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Analyzing with Gemini...</>
                        ) : (
                          <><BrainCircuit className="w-4 h-4 mr-2" /> Run Verification</>
                        )}
                      </Button>
                    )}

                    {/* Error state */}
                    {aiState.status === 'error' && (
                      <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-100 rounded-2xl">
                        <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                        <p className="text-sm font-medium text-red-700">{aiState.message}</p>
                      </div>
                    )}

                    {/* Success result */}
                    {aiState.status === 'done' && (
                      <div className="space-y-4">
                        {/* Verdict banner */}
                        <div className={`flex items-center gap-3 p-4 rounded-2xl border ${aiState.detected ? 'bg-green-50 border-green-100' : 'bg-orange-50 border-orange-100'}`}>
                          {aiState.detected
                            ? <ShieldCheck className="w-6 h-6 text-green-600 flex-shrink-0" />
                            : <AlertTriangle className="w-6 h-6 text-orange-500 flex-shrink-0" />
                          }
                          <div>
                            <p className={`text-sm font-black uppercase ${aiState.detected ? 'text-green-700' : 'text-orange-700'}`}>
                              {aiState.detected ? 'Attendance Verified' : 'Attendance Not Confirmed'}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              Confidence: <span className="font-bold">{((aiState.confidence ?? 0) * 100).toFixed(1)}%</span>
                              {aiState.crowdSize ? ` · ~${aiState.crowdSize} people detected` : ''}
                            </p>
                          </div>
                        </div>

                        {/* On-chain proof details */}
                        <div className="space-y-2">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">On-Chain Proof</p>
                          <div className="p-3 bg-gray-50 rounded-xl space-y-2">
                            <div>
                              <span className="text-[9px] font-black text-gray-400 uppercase">Proof Hash</span>
                              <p className="text-[11px] font-mono text-gray-700 break-all mt-0.5">{aiState.proofHash}</p>
                            </div>
                            {aiState.flowTxId && (
                              <div>
                                <span className="text-[9px] font-black text-gray-400 uppercase">Flow TX</span>
                                <a
                                  href={`https://testnet.flowscan.org/transaction/${aiState.flowTxId}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="block text-[11px] font-mono text-purple-600 hover:underline break-all mt-0.5"
                                >
                                  {aiState.flowTxId}
                                </a>
                              </div>
                            )}
                            {aiState.filecoinCid && (
                              <div>
                                <span className="text-[9px] font-black text-gray-400 uppercase">Filecoin Artifact</span>
                                <a
                                  href={`https://gateway.lighthouse.storage/ipfs/${aiState.filecoinCid}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="block text-[11px] font-mono text-purple-600 hover:underline break-all mt-0.5"
                                >
                                  {aiState.filecoinCid}
                                </a>
                              </div>
                            )}
                          </div>
                        </div>

                        <Button
                          variant="outline"
                          className="w-full h-10 rounded-xl font-bold text-xs"
                          onClick={() => { setAiState({ status: 'idle' }); setImageUrls('') }}
                        >
                          Verify Again
                        </Button>
                      </div>
                    )}
                  </div>
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
