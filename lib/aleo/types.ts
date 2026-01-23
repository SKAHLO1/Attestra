export interface AleoWalletInfo {
  address: string;
  balance?: string;
  network?: string;
}

export interface AleoTransaction {
  id: string;
  program: string;
  function: string;
  inputs: string[];
  status: 'pending' | 'confirmed' | 'failed';
}

export interface BadgeData {
  owner: string;
  eventId: string;
  eventName: string;
  badgeId: string;
  timestamp: number;
  category: number;
}

export interface EventData {
  owner: string;
  eventId: string;
  totalBadges: number;
  isActive: boolean;
}
