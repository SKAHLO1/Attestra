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

interface QRCodeGeneratorProps {
  eventId: string
  eventName: string
  issuer: string
}

const BADGE_CREATION_FEE = 0.001 // 0.001 LEO per badge

export default function QRCodeGenerator({ eventId, eventName, issuer }: QRCodeGeneratorProps) {
  const applicationId = getApplicationId()
  const { addClaimCodes, loading: operationLoading } = useEventOperations()
  const { address } = useWallet()
  const [generatedCodes, setGeneratedCodes] = useState<Array<{ code: string; qrUrl: string }>>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const handleGenerateQRCodes = async (count = 10) => {
    if (!address) {
      setError("Please connect your wallet to generate badges")
      return
    }

    setIsGenerating(true)
    setError(null)
    setSuccessMessage(null)

    try {
      const totalFee = BADGE_CREATION_FEE * count
      console.log(`[QRCodeGenerator] Processing payment of ${totalFee} LEO for ${count} badges...`)

      // Note: Badges are NOT pre-minted here to save gas fees
      // Instead, badges are minted on-chain when attendees CLAIM them
      // This is more efficient and only charges for badges actually used
      console.log(`[QRCodeGenerator] Generated ${count} claim codes`)
      console.log(`[QRCodeGenerator] Badges will be minted on-chain when attendees claim them`)
      console.log(`[QRCodeGenerator] Estimated total cost if all claimed: ${totalFee} LEO`)

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
      setSuccessMessage(`Successfully generated ${count} claim codes! Badges will be minted on Aleo blockchain when attendees claim them (${BADGE_CREATION_FEE} LEO per claim).`)
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

  return (
    <Card className="border border-gray-200 bg-white">
      <CardHeader>
        <CardTitle>QR Code Management</CardTitle>
        <CardDescription>Generate and manage QR codes for attendee claim codes</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
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
          <p>💰 Fee: {BADGE_CREATION_FEE} LEO per badge (paid by attendee when claiming)</p>
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
