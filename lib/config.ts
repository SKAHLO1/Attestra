/**
 * Application configuration - Official Linera Template Pattern
 * Based on: https://github.com/linera-io/linera-protocol/tree/main/examples
 * Reads from environment variables
 */

export const config = {
  linera: {
    // Testnet Configuration
    faucetUrl: process.env.NEXT_PUBLIC_LINERA_FAUCET_URL || 'https://faucet.testnet-conway.linera.net',
    applicationId: process.env.NEXT_PUBLIC_LINERA_APPLICATION_ID || '',
    network: process.env.NEXT_PUBLIC_LINERA_NETWORK || 'testnet-conway',
    
    // Local Node Service (for development)
    nodePort: process.env.NEXT_PUBLIC_LINERA_NODE_PORT || '8080',
    chainId: process.env.NEXT_PUBLIC_LINERA_CHAIN_ID || '',
  },
  ipfs: {
    gateway: process.env.NEXT_PUBLIC_IPFS_GATEWAY || 'https://gateway.pinata.cloud/ipfs/',
  },
} as const;

export function getApplicationId(): string {
  if (!config.linera.applicationId) {
    console.warn('⚠️ NEXT_PUBLIC_LINERA_APPLICATION_ID not set. Please configure it in .env.local');
  }
  return config.linera.applicationId;
}

export function isConfigured(): boolean {
  return !!config.linera.applicationId;
}
