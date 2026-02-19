"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { generateClaimCode, generateQRCodeURL, encodeQRData, type QRCodeData } from "@/lib/qr-utils"
import { useEventOperations } from "@/lib/services"
import { getApplicationId } from "@/lib/config"
import { useWallet } from "@provablehq/aleo-wallet-adaptor-react"
import { collection, query, where, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase/config"
import { Download } from "lucide-react"

interface QRCodeGeneratorProps {
  eventId: string
  eventName: string
  issuer: string
}

const BADGE_CREATION_FEE = 0.1 // 0.1 LEO per badge

export default function QRCodeGenerator({ eventId, eventName, issuer }: QRCodeGeneratorProps) {
  const applicationId = getApplicationId()
  const { addClaimCodes, loading: operationLoading } = useEventOperations()
  const { wallet: walletAdapter, address } = useWallet()
  const [generatedCodes, setGeneratedCodes] = useState<Array<{ code: string; qrUrl: string }>>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const handleGenerateQRCodes = async (count = 10) => {
    const adapter = walletAdapter?.adapter as any
    
    if (!address) {
      setError("Please connect your wallet to generate badges")
      return
    }

    if (!adapter?.executeTransaction) {
      setError(`Wallet not ready. Please reconnect your wallet.`)
      return
    }

    setIsGenerating(true)
    setError(null)
    setSuccessMessage(null)

    try {
      const totalFee = BADGE_CREATION_FEE * count
      console.log(`[QRCodeGenerator] Processing payment of ${totalFee} LEO for ${count} badges...`)

      // Charge organizer upfront for badge generation
      try {
        const feeInMicrocredits = Math.floor(totalFee * 1000000) // Convert LEO to microcredits
        const treasuryAddress = address

        // Both Leo and Shield wallets use TransactionOptions format via executeTransaction
        const feeTransaction = {
          program: "credits.aleo",
          function: "transfer_public",
          inputs: [
            treasuryAddress,
            `${feeInMicrocredits}u64`
          ],
          fee: 100000,
          privateFee: false,
        };

        console.log(`[QRCodeGenerator] Charging organizer ${totalFee} LEO for ${count} badge codes...`)
        const txResult = await adapter.executeTransaction(feeTransaction)
        console.log('[QRCodeGenerator] Fee payment successful:', txResult)

        // Wait for transaction to process
        await new Promise(resolve => setTimeout(resolve, 2000))
      } catch (txError: any) {
        console.error('[QRCodeGenerator] Payment failed:', txError)
        throw new Error(`Payment failed: ${txError.message || 'Transaction rejected'}. Please try again.`)
      }

      console.log(`[QRCodeGenerator] Payment confirmed. Generating ${count} claim codes...`)

      // Generate claim codes and QR codes with LEO prefix
      const newCodes = Array.from({ length: count }, (_, i) => {
        const claimCode = generateClaimCode(eventId, i + generatedCodes.length)
        const qrData: QRCodeData = {
          claimCode,
          eventId,
          eventName,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          issuer,
        }
        const encoded = encodeQRData(qrData)
        const qrUrl = generateQRCodeURL(encoded)

        return {
          code: claimCode,
          qrUrl,
        }
      })

      // Register claim codes in Firebase
      console.log('[QRCodeGenerator] Registering claim codes in Firebase...')
      const claimCodesOnly = newCodes.map(c => c.code)
      await addClaimCodes(eventId, claimCodesOnly)

      setGeneratedCodes([...generatedCodes, ...newCodes])
      setSuccessMessage(`Successfully generated ${count} claim codes! Paid ${totalFee} LEO upfront. Badges will be minted on Aleo blockchain when attendees claim them (free for attendees).`)
    } catch (err: any) {
      setError(err.message || 'Failed to generate and register claim codes')
      console.error('[QRCodeGenerator] Error:', err)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDownloadQRCode = (qrUrl: string, claimCode: string) => {
    const link = document.createElement("a")
    link.href = qrUrl
    link.download = `qr-code-${claimCode}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code)
  }

  const handleDownloadAllCodes = async () => {
    try {
      setIsGenerating(true)
      setError(null)

      // Fetch all claim codes for this event from Firebase
      const claimCodesRef = collection(db, 'claimCodes')
      const q = query(claimCodesRef, where('eventId', '==', eventId))
      const querySnapshot = await getDocs(q)

      if (querySnapshot.empty) {
        setError('No claim codes found for this event')
        return
      }

      // Generate CSV content with claim codes and QR URLs
      const csvRows = ['Claim Code,QR Code URL,Event Name,Status']
      
      querySnapshot.docs.forEach((doc) => {
        const data = doc.data()
        const claimCode = data.code
        const used = data.used || false
        const qrData: QRCodeData = {
          claimCode,
          eventId,
          eventName,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          issuer,
        }
        const encoded = encodeQRData(qrData)
        const qrUrl = generateQRCodeURL(encoded)
        
        csvRows.push(`${claimCode},${qrUrl},${eventName},${used ? 'Used' : 'Available'}`)
      })

      // Create and download CSV file
      const csvContent = csvRows.join('\n')
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      
      link.setAttribute('href', url)
      link.setAttribute('download', `${eventName.replace(/\s+/g, '-')}-claim-codes.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      setSuccessMessage(`Successfully downloaded ${querySnapshot.size} claim codes!`)
    } catch (err: any) {
      setError(err.message || 'Failed to download claim codes')
      console.error('[QRCodeGenerator] Download error:', err)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Card className="border border-gray-200 bg-white">
      <CardHeader>
        <CardTitle>QR Code Management</CardTitle>
        <CardDescription>Generate and manage QR codes for attendee claim codes</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => handleGenerateQRCodes(10)}
            disabled={isGenerating || operationLoading}
            className="bg-gray-700 hover:bg-gray-800 text-white"
          >
            {isGenerating || operationLoading ? "Generating & Registering..." : "Generate 10 QR Codes"}
          </Button>
          <Button
            onClick={() => handleGenerateQRCodes(50)}
            disabled={isGenerating || operationLoading}
            variant="outline"
            className="bg-transparent"
          >
            Generate 50
          </Button>
          <Button
            onClick={handleDownloadAllCodes}
            disabled={isGenerating || operationLoading}
            variant="outline"
            className="bg-green-50 hover:bg-green-100 text-green-700 border-green-200 ml-auto"
          >
            <Download className="w-4 h-4 mr-2" />
            Download All Codes
          </Button>
        </div>

        {successMessage && (
          <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
            <p className="text-sm text-green-700">{successMessage}</p>
          </div>
        )}

        {error && (
          <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        <div className="text-xs text-muted-foreground space-y-1">
          <p>💡 Claim codes are stored in Firebase - badges mint on Aleo when attendees claim</p>
          <p>💰 Fee: {BADGE_CREATION_FEE} LEO per badge code (paid by organizer upfront)</p>
          <p>🎁 Badge claiming is FREE for attendees - you already paid!</p>
          <p>🏷️ All codes start with "LEO" prefix for easy identification</p>
        </div>

        {generatedCodes.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-foreground">Generated Codes ({generatedCodes.length})</h4>
              <Badge variant="outline">{generatedCodes.length} codes</Badge>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-96 overflow-y-auto">
              {generatedCodes.map((item, index) => (
                <Dialog key={index}>
                  <DialogTrigger asChild>
                    <div className="p-3 border border-gray-200 rounded-lg hover:border-gray-400 cursor-pointer transition-colors bg-white">
                      <div className="aspect-square bg-muted rounded mb-2 flex items-center justify-center">
                        <img
                          src={item.qrUrl || "/placeholder.svg"}
                          alt={`QR Code ${item.code}`}
                          className="w-full h-full object-cover rounded"
                        />
                      </div>
                      <p className="text-xs font-mono text-center truncate text-muted-foreground">{item.code}</p>
                    </div>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>QR Code Details</DialogTitle>
                      <DialogDescription>Claim Code: {item.code}</DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                      <div className="flex justify-center p-4 bg-muted rounded-lg">
                        <img
                          src={item.qrUrl || "/placeholder.svg"}
                          alt={`QR Code ${item.code}`}
                          className="w-64 h-64"
                        />
                      </div>

                      <div className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">Claim Code</p>
                        <div className="flex gap-2">
                          <code className="flex-1 p-2 bg-muted rounded text-xs font-mono break-all">{item.code}</code>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCopyCode(item.code)}
                            className="bg-transparent"
                          >
                            Copy
                          </Button>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-4">
                        <Button
                          variant="outline"
                          className="flex-1 bg-transparent"
                          onClick={() => handleDownloadQRCode(item.qrUrl, item.code)}
                        >
                          Download
                        </Button>
                        <Button className="flex-1 bg-gray-700 hover:bg-gray-800 text-white">Print</Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
