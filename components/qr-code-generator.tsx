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
import { useWallet } from "@demox-labs/aleo-wallet-adapter-react"

interface QRCodeGeneratorProps {
  eventId: string
  eventName: string
  issuer: string
}

const BADGE_CREATION_FEE = 0.001 // 0.001 LEO per badge

export default function QRCodeGenerator({ eventId, eventName, issuer }: QRCodeGeneratorProps) {
  const applicationId = getApplicationId()
  const { addClaimCodes, loading: operationLoading } = useEventOperations()
  const { publicKey, requestExecution } = useWallet()
  const [generatedCodes, setGeneratedCodes] = useState<Array<{ code: string; qrUrl: string }>>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const handleGenerateQRCodes = async (count = 10) => {
    if (!publicKey) {
      setError("Please connect your wallet to generate badges")
      return
    }

    setIsGenerating(true)
    setError(null)
    setSuccessMessage(null)

    try {
      const totalFee = BADGE_CREATION_FEE * count
      console.log(`[QRCodeGenerator] Processing payment of ${totalFee} LEO for ${count} badges...`)
      
      // Process fee payment via Aleo wallet
      if (requestExecution) {
        try {
          const feeInMicrocredits = Math.floor(totalFee * 1_000_000) // Convert LEO to microcredits
          
          const aleoTransaction = {
            address: publicKey,
            chainId: "testnetbeta",
            program: "credits.aleo",
            functionName: "transfer_public",
            inputs: [
              "aleo1nfvg0z6l36736agtdqjznxcrmw5sj505uxkqnqx3wlyl86hk4qxquds9yf", // Your wallet address
              `${feeInMicrocredits}u64`
            ],
            fee: 50000, // 0.05 credits for transaction fee
            feePrivate: false,
            transitions: []
          } as any
          
          console.log('[QRCodeGenerator] Requesting execution from wallet...', aleoTransaction)
          const txId = await requestExecution(aleoTransaction)
          console.log('[QRCodeGenerator] Transaction submitted:', txId)
          
          // Wait for transaction to be broadcast
          await new Promise(resolve => setTimeout(resolve, 2000))
        } catch (txError: any) {
          console.error('[QRCodeGenerator] Transaction failed:', txError)
          throw new Error(`Payment failed: ${txError.message}`)
        }
      }

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
      setSuccessMessage(`Successfully generated ${count} badges! Fee: ${totalFee} LEO. All badges start with "LEO" prefix.`)
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
    <Card className="border-2 border-primary/20">
      <CardHeader>
        <CardTitle>QR Code Management</CardTitle>
        <CardDescription>Generate and manage QR codes for attendee claim codes</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button
            onClick={() => handleGenerateQRCodes(10)}
            disabled={isGenerating || operationLoading}
            className="bg-primary hover:bg-primary/90"
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
          <p>💡 Generated codes are automatically registered on the blockchain for attendees to claim</p>
          <p>💰 Fee: {BADGE_CREATION_FEE} LEO per badge (paid from connected wallet)</p>
          <p>🏷️ All badges start with "LEO" prefix for easy identification</p>
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
                    <div className="p-3 border rounded-lg hover:border-primary/50 cursor-pointer transition-colors">
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
                        <Button className="flex-1 bg-primary hover:bg-primary/90">Print</Button>
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
