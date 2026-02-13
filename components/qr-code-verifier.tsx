"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { decodeQRData, isClaimCodeValid, type QRCodeData } from "@/lib/qr-utils"

interface QRCodeVerifierProps {
  onVerify?: (data: QRCodeData) => void
}

export default function QRCodeVerifier({ onVerify }: QRCodeVerifierProps) {
  const [verificationResult, setVerificationResult] = useState<{
    status: "valid" | "invalid" | "expired" | null
    data?: QRCodeData
    message: string
  }>({
    status: null,
    message: "",
  })

  const handleVerifyQRCode = async (qrData: string) => {
    // Simulate QR code verification
    await new Promise((resolve) => setTimeout(resolve, 800))

    const decoded = decodeQRData(qrData)

    if (!decoded) {
      setVerificationResult({
        status: "invalid",
        message: "Invalid QR code format",
      })
      return
    }

    if (!isClaimCodeValid(decoded.claimCode)) {
      setVerificationResult({
        status: "invalid",
        message: "Invalid claim code format",
      })
      return
    }

    if (new Date() > decoded.expiresAt) {
      setVerificationResult({
        status: "expired",
        message: "This claim code has expired",
        data: decoded,
      })
      return
    }

    setVerificationResult({
      status: "valid",
      message: "QR code verified successfully",
      data: decoded,
    })

    if (onVerify && decoded) {
      onVerify(decoded)
    }
  }

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case "valid":
        return "bg-green-500/10 text-green-700 border-green-200"
      case "invalid":
        return "bg-red-500/10 text-red-700 border-red-200"
      case "expired":
        return "bg-yellow-500/10 text-yellow-700 border-yellow-200"
      default:
        return "bg-gray-500/10 text-gray-700 border-gray-200"
    }
  }

  return (
    <Card className="border border-gray-200 bg-white">
      <CardHeader>
        <CardTitle>QR Code Verification</CardTitle>
        <CardDescription>Verify QR codes and claim codes for authenticity</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium">Scan or Paste QR Data</label>
          <textarea
            placeholder="Paste QR code data or claim code here..."
            className="w-full p-3 border rounded-lg bg-input text-sm font-mono"
            rows={4}
            onPaste={(e) => {
              const text = e.clipboardData.getData("text")
              handleVerifyQRCode(text)
            }}
          />
        </div>

        <Button onClick={() => handleVerifyQRCode("")} className="w-full bg-gray-700 hover:bg-gray-800 text-white">
          Verify QR Code
        </Button>

        {verificationResult.status && (
          <Alert className={`border-2 ${getStatusColor(verificationResult.status)}`}>
            <AlertDescription className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge className={`text-xs ${getStatusColor(verificationResult.status)}`}>
                  {verificationResult.status.toUpperCase()}
                </Badge>
                <span className="text-sm font-medium">{verificationResult.message}</span>
              </div>

              {verificationResult.data && (
                <div className="space-y-2 text-xs">
                  <div>
                    <p className="text-muted-foreground">Event</p>
                    <p className="font-medium">{verificationResult.data.eventName}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Claim Code</p>
                    <p className="font-mono">{verificationResult.data.claimCode}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Expires</p>
                    <p>{verificationResult.data.expiresAt.toLocaleDateString()}</p>
                  </div>
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}
