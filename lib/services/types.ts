export type EventCategory = 'Conference' | 'Hackathon' | 'Meetup' | 'Workshop';

export interface EventData {
  id: string;
  name: string;
  description: string;
  location: string;
  startDate: Date;
  endDate: Date;
  category: EventCategory;
  organizerId: string;
  organizerName: string;
  imageUrl?: string;
  maxAttendees?: number;
  isActive: boolean;
  prerequisiteEventId?: string;
  minReputationLevel?: number;
}

export interface BadgeData {
  id: string;
  eventId: string;
  eventName: string;
  attendeeId: string;
  attendeeName: string;
  attendeeEmail: string;
  claimCode: string;
  claimed: boolean;
  claimedAt?: Date;
  aleoTxId?: string;
  aleoRecordId?: string;
  issuedAt: Date;
  category: EventCategory;
  owner: string;
  tokenId: string;
}
