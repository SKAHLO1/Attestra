export interface FlowWalletInfo {
  addr: string;
  cid?: string;
  loggedIn: boolean;
}

export interface FlowTransaction {
  transactionId: string;
  status: 'pending' | 'sealed' | 'executed' | 'expired' | 'failed';
  errorMessage?: string;
}

export interface FlowScript {
  result: any;
}

export interface BadgeData {
  owner: string;
  eventId: string;
  eventName: string;
  badgeId: string;
  timestamp: number;
  category: string;
  ipfsCid?: string;
  flowTxId?: string;
  aiVerified?: boolean;
  aiVerificationCid?: string;
}

export interface EventData {
  owner: string;
  eventId: string;
  totalBadges: number;
  isActive: boolean;
  ipfsCid?: string;
}

export interface AIVerificationResult {
  verified: boolean;
  confidence: number;
  proofHash: string;
  ipfsCid: string;
  timestamp: number;
}
