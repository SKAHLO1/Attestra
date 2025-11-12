/**
 * TypeScript type definitions for Linera Event Badge application
 */

export type ChainId = string;
export type Owner = string;
export type ApplicationId = string;

export enum EventCategory {
  Conference = "Conference",
  Hackathon = "Hackathon",
  Meetup = "Meetup",
  Workshop = "Workshop",
}

export interface EventInfo {
  eventName: string;
  organizer: string;
  description: string;
  eventDate: number;
  location: string;
  category: EventCategory;
  badgeMetadataUri: string;
  maxSupply: number;
  mintedCount: number;
  isActive: boolean;
}

export interface BadgeInfo {
  tokenId: number;
  owner: string;
  eventName: string;
  claimedAt: number;
  imageUri: string;
  category: EventCategory;
}

export interface ClaimResult {
  success: boolean;
  tokenId?: number;
  message: string;
  txHash?: string;
}

export interface CreateEventParams {
  eventName: string;
  description: string;
  eventDate: number;
  location: string;
  category: EventCategory;
  badgeMetadataUri: string;
  maxSupply: number;
}

export interface LineraWalletInfo {
  address: Owner;
  chainId: ChainId;
  balance?: string;
}

export interface TransactionResponse {
  success: boolean;
  txHash?: string;
  error?: string;
}

// GraphQL Query Types
export interface EventInfoQuery {
  eventInfo: EventInfo;
}

export interface BadgeByOwnerQuery {
  badgeByOwner?: BadgeInfo;
}

export interface AllBadgesQuery {
  allBadges: BadgeInfo[];
}

export interface IsClaimCodeValidQuery {
  isClaimCodeValid: boolean;
}
