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

  const claimBadge = async (claimCode: string, walletPublicKey?: string, requestExecution?: any) => {
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
      
      // Get event details for badge metadata
      const eventDoc = await getDocs(query(collection(db, 'events'), where('__name__', '==', claimCodeData.eventId)));
      const eventData = eventDoc.docs[0]?.data();
      
      let aleoTxId = null;
      
      // Mint badge on Aleo blockchain if wallet is connected
      if (walletPublicKey && requestExecution) {
        try {
          console.log('[ClaimBadge] Minting badge on Aleo blockchain...');
          
          // Generate unique badge ID from claim code
          const badgeIdHash = `${claimCode}${Date.now()}`.split('').reduce((a, b) => {
            a = ((a << 5) - a) + b.charCodeAt(0);
            return a & a;
          }, 0);
          
          const eventIdHash = claimCodeData.eventId.split('').reduce((a: number, b: string) => {
            a = ((a << 5) - a) + b.charCodeAt(0);
            return a & a;
          }, 0);
          
          // Call claim_badge transition on Aleo
          const aleoTransaction = {
            address: walletPublicKey,
            chainId: "testnet",
            program: process.env.NEXT_PUBLIC_ALEO_PROGRAM_ID || "velero_attender.aleo",
            functionName: "claim_badge",
            inputs: [
              `${Math.abs(eventIdHash)}field`, // event_id
              `${Math.abs(badgeIdHash)}field`, // badge_id
              `${Date.now()}u64` // timestamp
            ],
            fee: 100000, // 0.1 credits
            wait: true,
          };
          
          console.log('[ClaimBadge] Aleo transaction:', aleoTransaction);
          const txResult = await requestExecution(aleoTransaction);
          aleoTxId = txResult?.transactionId || txResult;
          console.log('[ClaimBadge] Badge minted on Aleo! TX:', aleoTxId);
        } catch (aleoError: any) {
          console.error('[ClaimBadge] Aleo minting failed:', aleoError);
          // Continue with Firebase record even if blockchain mint fails
          // User can retry minting later
        }
      }
      
      // Create badge record in Firebase
      const badgesRef = collection(db, 'badges');
      const badgeDoc = await addDoc(badgesRef, {
        userId: user.uid,
        eventId: claimCodeData.eventId,
        eventName: eventData?.name || 'Unknown Event',
        claimCode: claimCode,
        claimedAt: serverTimestamp(),
        aleoTxId: aleoTxId,
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
      setError('Failed to claim badge');
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

  const addClaimCodes = async (eventId: string, codes: string[]) => {
    try {
      setLoading(true);
      const claimCodesRef = collection(db, 'claimCodes');
      
      const promises = codes.map(code => 
        addDoc(claimCodesRef, {
          eventId,
          code,
          used: false,
          createdAt: serverTimestamp(),
        })
      );
      
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
      
      const eventsList = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          startDate: data.startDate?.toDate(),
          endDate: data.endDate?.toDate(),
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
        } as Event;
      });
      
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
