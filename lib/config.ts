/**
 * Application configuration for Attestra on Flow Blockchain
 * Reads from environment variables
 */

export const config = {
  flow: {
    // Flow Blockchain Configuration
    contractAddress: process.env.NEXT_PUBLIC_FLOW_CONTRACT_ADDRESS || '0xAttestra',
    network: process.env.NEXT_PUBLIC_FLOW_NETWORK || 'testnet',
    accessNode: process.env.NEXT_PUBLIC_FLOW_ACCESS_NODE || 'https://rest-testnet.onflow.org',
    walletDiscovery: process.env.NEXT_PUBLIC_FLOW_WALLET_DISCOVERY || 'https://fcl-discovery.onflow.org/testnet/authn',
  },
  filecoin: {
    synapsePrivateKey: process.env.SYNAPSE_PRIVATE_KEY || '',
    synapseRpcUrl: process.env.SYNAPSE_RPC_URL || 'https://api.node.glif.io/rpc/v1',
  },
  ai: {
    verificationEndpoint: process.env.NEXT_PUBLIC_AI_VERIFICATION_ENDPOINT || '/api/verify',
  },
} as const;

export function getContractAddress(): string {
  if (!config.flow.contractAddress || config.flow.contractAddress === '0xAttestra') {
    console.warn('⚠️ NEXT_PUBLIC_FLOW_CONTRACT_ADDRESS not set. Please configure it in .env.local');
  }
  return config.flow.contractAddress;
}

export function isConfigured(): boolean {
  return !!config.flow.contractAddress && config.flow.contractAddress !== '0xAttestra';
}

export function getNetwork(): string {
  return config.flow.network;
}

export function getApplicationId(): string {
  return getContractAddress();
}
