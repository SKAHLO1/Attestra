/**
 * Application configuration for Veleo on Aleo
 * Reads from environment variables
 */

export const config = {
  aleo: {
    // Aleo Testnet Configuration
    programId: process.env.NEXT_PUBLIC_ALEO_PROGRAM_ID || 'attendance_badge.aleo',
    network: process.env.NEXT_PUBLIC_ALEO_NETWORK || 'testnet',
    apiEndpoint: process.env.NEXT_PUBLIC_ALEO_API_ENDPOINT || 'https://api.explorer.aleo.org/v1',
  },
  ipfs: {
    gateway: process.env.NEXT_PUBLIC_IPFS_GATEWAY || 'https://gateway.pinata.cloud/ipfs/',
  },
} as const;

export function getProgramId(): string {
  if (!config.aleo.programId) {
    console.warn('⚠️ NEXT_PUBLIC_ALEO_PROGRAM_ID not set. Please configure it in .env.local');
  }
  return config.aleo.programId;
}

export function isConfigured(): boolean {
  return !!config.aleo.programId;
}

export function getNetwork(): string {
  return config.aleo.network;
}

export function getApplicationId(): string {
  return getProgramId();
}
