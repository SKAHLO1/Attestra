// Utility functions for QR code generation and verification

export interface QRCodeData {
  claimCode: string
  eventId: string
  eventName: string
  expiresAt: Date
  issuer: string
}

export function generateClaimCode(eventId: string, index: number): string {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 8).toUpperCase()
  return `LEO-${eventId.slice(0, 4).toUpperCase()}-${timestamp}-${random}`
}

export function encodeQRData(data: QRCodeData): string {
  return JSON.stringify({
    code: data.claimCode,
    event: data.eventId,
    name: data.eventName,
    expires: data.expiresAt.toISOString(),
    issuer: data.issuer,
  })
}

export function decodeQRData(encoded: string): QRCodeData | null {
  try {
    const data = JSON.parse(encoded)
    return {
      claimCode: data.code,
      eventId: data.event,
      eventName: data.name,
      expiresAt: new Date(data.expires),
      issuer: data.issuer,
    }
  } catch {
    return null
  }
}

export function isClaimCodeValid(claimCode: string): boolean {
  // Validate claim code format: LEO-XXXX-XXXXXXXXX-XXXXXX
  const pattern = /^LEO-[A-Z0-9]+-[A-Z0-9]+-[A-Z0-9]+$/
  return pattern.test(claimCode)
}

export function generateQRCodeURL(data: string, size = 300): string {
  // Using qr-server.com API for QR code generation
  const encoded = encodeURIComponent(data)
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encoded}`
}
