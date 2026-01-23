import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/lib/firebase/auth-context';

export interface Badge {
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
  category: string;
  owner: string;
  tokenId: string;
}

export function useUserBadges() {
  const { user } = useAuth();
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBadges = async () => {
    if (!user) {
      setBadges([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const badgesRef = collection(db, 'badges');
      const q = query(badgesRef, where('attendeeId', '==', user.uid), where('claimed', '==', true));
      const querySnapshot = await getDocs(q);
      
      const badgesList = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          eventId: data.eventId || '',
          eventName: data.eventName || '',
          attendeeId: data.attendeeId || '',
          attendeeName: data.attendeeName || '',
          attendeeEmail: data.attendeeEmail || '',
          claimCode: data.claimCode || '',
          claimed: data.claimed || false,
          claimedAt: data.claimedAt?.toDate(),
          aleoTxId: data.aleoTxId,
          aleoRecordId: data.aleoRecordId,
          issuedAt: data.issuedAt?.toDate() || new Date(),
          category: data.category || 'Conference',
          owner: data.owner || user.uid,
          tokenId: data.tokenId || doc.id,
        } as Badge;
      });
      
      setBadges(badgesList);
      setError(null);
    } catch (err) {
      console.error('Error fetching badges:', err);
      setError('Failed to load badges');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBadges();
  }, [user]);

  return { badges, loading, error, refetch: fetchBadges };
}

export function useAllEventBadges(applicationId?: string) {
  return useUserBadges();
}
