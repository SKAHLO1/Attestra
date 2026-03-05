import { useState, useEffect } from 'react';
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/lib/firebase/auth-context';

export interface Event {
  id: string;
  name: string;
  description: string;
  location: string;
  startDate: Date;
  endDate: Date;
  organizerId: string;
  organizerName: string;
  imageUrl?: string;
  maxAttendees?: number;
  isActive: boolean;
  category?: string;
  prerequisiteEventId?: string;
  minReputationLevel?: number;
  badgesMinted?: number;
  attendees?: number;
  createdAt: Date;
  updatedAt: Date;
}

export function useEventOperations() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createEvent = async (eventData: Omit<Event, 'id' | 'createdAt' | 'updatedAt' | 'organizerId' | 'organizerName'>) => {
    if (!user) throw new Error('User not authenticated');

    try {
      setLoading(true);
      setError(null);

      const eventsRef = collection(db, 'events');
      const docRef = await addDoc(eventsRef, {
        ...eventData,
        organizerId: user.uid,
        organizerName: user.displayName || user.email,
        startDate: Timestamp.fromDate(eventData.startDate),
        endDate: Timestamp.fromDate(eventData.endDate),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      return docRef.id;
    } catch (err) {
      console.error('Error creating event:', err);
      setError('Failed to create event');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateEvent = async (eventId: string, updates: Partial<Event>) => {
    if (!user) throw new Error('User not authenticated');

    try {
      setLoading(true);
      setError(null);

      const eventRef = doc(db, 'events', eventId);
      const updateData: any = {
        ...updates,
        updatedAt: serverTimestamp(),
      };

      if (updates.startDate) {
        updateData.startDate = Timestamp.fromDate(updates.startDate);
      }
      if (updates.endDate) {
        updateData.endDate = Timestamp.fromDate(updates.endDate);
      }

      await updateDoc(eventRef, updateData);
    } catch (err) {
      console.error('Error updating event:', err);
      setError('Failed to update event');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteEvent = async (eventId: string) => {
    if (!user) throw new Error('User not authenticated');

    try {
      setLoading(true);
      setError(null);

      const eventRef = doc(db, 'events', eventId);
      await deleteDoc(eventRef);
    } catch (err) {
      console.error('Error deleting event:', err);
      setError('Failed to delete event');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const claimBadge = async (claimCode: string, walletPublicKey?: string, requestExecution?: any, userBadges: any[] = []) => {
    if (!user) throw new Error('User not authenticated');

    try {
      setLoading(true);
      setError(null);

      // Verify claim code exists and is unused
      const claimCodesRef = collection(db, 'claimCodes');
      const q = query(claimCodesRef, where('code', '==', claimCode), where('used', '==', false));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        throw new Error('Invalid or already used claim code');
      }

      const claimCodeDoc = querySnapshot.docs[0];
      const claimCodeData = claimCodeDoc.data();

      // Get event details for badge metadata and eligibility checks
      const eventDoc = await getDocs(query(collection(db, 'events'), where('__name__', '==', claimCodeData.eventId)));
      const eventData = eventDoc.docs[0]?.data();

      if (!eventData) throw new Error('Event data not found');

      // --- ZK-ELIGIBILITY CHECKS ---

      // 1. Check Prerequisite Event
      if (eventData.prerequisiteEventId) {
        const hasPrerequisite = userBadges.some(badge => badge.eventId === eventData.prerequisiteEventId);
        if (!hasPrerequisite) {
          throw new Error(`Prerequisite Required: You must own a badge from "${eventData.prerequisiteEventId}" to claim this.`);
        }
      }

      // 2. Check Reputation Level
      if (eventData.minReputationLevel && eventData.minReputationLevel > 0) {
        const totalBadges = userBadges.length;
        if (totalBadges < eventData.minReputationLevel) {
          throw new Error(`Reputation Too Low: This event requires minimum reputation level ${eventData.minReputationLevel} (${eventData.minReputationLevel}+ total badges).`);
        }
      }

      // --- END ELIGIBILITY CHECKS ---

      let aleoTxId = null;

      // Flow transaction is mandatory — badge claim always requires 3 FLOW fee
      try {
        console.log('[ClaimBadge] Initiating Flow badge claim...');

        // Pin badge metadata server-side so LIGHTHOUSE_API_KEY stays off the client
        const pinRes = await fetch('/api/pin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'badge',
            data: {
              eventId: claimCodeData.eventId,
              eventName: eventData?.name || 'Unknown Event',
              attendeeId: user.uid,
              claimCode: claimCode,
              claimedAt: new Date().toISOString(),
              category: eventData?.category || 'Conference',
            },
          }),
        });
        if (!pinRes.ok) throw new Error(await pinRes.text());
        const ipfsResult = await pinRes.json();
        console.log('[ClaimBadge] Badge metadata pinned to Filecoin, CID:', ipfsResult.cid);

        const { getFlowClient } = await import('@/lib/flow/client');
        const flowClient = getFlowClient();
        const fcl = await import('@onflow/fcl');

        // Ensure wallet is authenticated before any tx — triggers wallet popup if needed
        await fcl.authenticate();

        // Pre-flight: verify attendee has at least 3 FLOW before sending tx
        const currentUser = await fcl.currentUser.snapshot();
        const walletAddress = currentUser.addr;
        if (!walletAddress) throw new Error('Flow wallet not connected. Please connect your wallet to claim a badge.');

        const balance = await flowClient.getFlowBalance(walletAddress);
        if (balance < 3) {
          throw new Error(
            `Insufficient FLOW balance. You have ${balance.toFixed(2)} FLOW but need at least 3 FLOW to redeem this badge.`
          );
        }

        // Submit on-chain tx — wallet will show confirmation popup with 3 FLOW fee
        const flowTx = await flowClient.claimBadge(
          claimCodeData.eventId,
          claimCode,
          ipfsResult.cid
        );
        aleoTxId = flowTx.transactionId;
        console.log('[ClaimBadge] Badge claimed on Flow! TX:', aleoTxId);
      } catch (flowError: any) {
        // All Flow errors are fatal — Firebase write must NOT proceed if token deduction failed
        throw flowError;
      }

      // Create badge record in Firebase
      const badgesRef = collection(db, 'badges');
      const badgeDoc = await addDoc(badgesRef, {
        userId: user.uid,
        eventId: claimCodeData.eventId,
        eventName: eventData?.name || 'Unknown Event',
        attendeeId: user.uid, // Unified field name
        claimCode: claimCode,
        claimed: true,
        claimedAt: serverTimestamp(),
        flowTxId: aleoTxId,
        issuedAt: serverTimestamp(),
      });

      // Mark claim code as used
      await updateDoc(doc(db, 'claimCodes', claimCodeDoc.id), {
        used: true,
        usedBy: user.uid,
        usedAt: serverTimestamp(),
      });

      return badgeDoc.id;
    } catch (err) {
      console.error('Error claiming badge:', err);
      setError(err instanceof Error ? err.message : 'Failed to claim badge');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const validateClaimCode = async (claimCode: string) => {
    try {
      const badgesRef = collection(db, 'badges');
      const q = query(badgesRef, where('claimCode', '==', claimCode), where('claimed', '==', false));
      const querySnapshot = await getDocs(q);
      return !querySnapshot.empty;
    } catch (err) {
      console.error('Error validating claim code:', err);
      return false;
    }
  };

  const setEventActive = async (eventId: string, isActive: boolean) => {
    return updateEvent(eventId, { isActive });
  };

  const addClaimCodes = async (eventId: string, codes: string[], filecoinCids?: (string | undefined)[]) => {
    try {
      setLoading(true);
      const claimCodesRef = collection(db, 'claimCodes');

      const promises = codes.map((code, i) => {
        const doc: Record<string, any> = {
          eventId,
          code,
          used: false,
          createdAt: serverTimestamp(),
        };
        const cid = filecoinCids?.[i];
        if (cid) {
          doc.filecoinCid = cid;
          doc.filecoinUrl = `https://gateway.lighthouse.storage/ipfs/${cid}`;
        }
        return addDoc(claimCodesRef, doc);
      });

      await Promise.all(promises);
    } catch (err) {
      console.error('Error adding claim codes:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    createEvent,
    updateEvent,
    deleteEvent,
    claimBadge,
    validateClaimCode,
    setEventActive,
    addClaimCodes,
    loading,
    error,
  };
}

export function useEventInfo(applicationId?: string) {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = async () => {
    if (!user) {
      setEvents([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const eventsRef = collection(db, 'events');
      const q = query(eventsRef, where('organizerId', '==', user.uid));
      const querySnapshot = await getDocs(q);

      const eventsList = await Promise.all(querySnapshot.docs.map(async (docSnapshot) => {
        const data = docSnapshot.data();

        // Fetch live counts for this event
        const badgesRef = collection(db, 'badges');
        const badgeQuery = query(badgesRef, where('eventId', '==', docSnapshot.id));
        const badgeSnapshot = await getDocs(badgeQuery);

        return {
          id: docSnapshot.id,
          ...data,
          badgesMinted: badgeSnapshot.size,
          attendees: badgeSnapshot.size, // For now, 1 badge = 1 attendee
          startDate: data.startDate?.toDate(),
          endDate: data.endDate?.toDate(),
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
        } as Event;
      }));

      setEvents(eventsList);
      setError(null);
    } catch (err) {
      console.error('Error fetching events:', err);
      setError('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [user]);

  return { events, eventInfo: events, loading, error, refetch: fetchEvents };
}
