// ============================================================================
// SybilShield Frontend - useBadge Hook
// ============================================================================

import { useState, useCallback, useEffect } from 'react';
import { useAleo } from './useAleo';
import type { SybilBadge } from '@/types';

// Storage key for badge persistence
const BADGE_STORAGE_KEY = 'sybilshield_badge';

// Helper to get badge from localStorage
function getStoredBadge(): SybilBadge | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem(BADGE_STORAGE_KEY);
    if (stored) {
      const badge = JSON.parse(stored) as SybilBadge;
      // Check if badge is still valid (not expired)
      if (badge.expiresAt > Math.floor(Date.now() / 1000)) {
        return badge;
      }
      // Remove expired badge
      localStorage.removeItem(BADGE_STORAGE_KEY);
    }
  } catch (e) {
    console.error('[useBadge] Error reading from localStorage:', e);
  }
  return null;
}

// Helper to store badge in localStorage
function storeBadge(badge: SybilBadge | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (badge) {
      localStorage.setItem(BADGE_STORAGE_KEY, JSON.stringify(badge));
    } else {
      localStorage.removeItem(BADGE_STORAGE_KEY);
    }
  } catch (e) {
    console.error('[useBadge] Error writing to localStorage:', e);
  }
}

// ============================================================================
// useBadge Hook - On-chain integration with localStorage persistence
// ============================================================================

export function useBadge() {
  const { getBadgeRecords, connected } = useAleo();
  const [badge, setBadgeState] = useState<SybilBadge | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  // Load badge from localStorage on mount
  useEffect(() => {
    const storedBadge = getStoredBadge();
    if (storedBadge) {
      console.log('[useBadge] Loaded badge from localStorage:', storedBadge);
      setBadgeState(storedBadge);
    }
    setInitialized(true);
  }, []);

  // Custom setBadge that also persists to localStorage
  const setBadge = useCallback((newBadge: SybilBadge | null) => {
    setBadgeState(newBadge);
    storeBadge(newBadge);
  }, []);

  // Fetch badge from on-chain records via wallet
  const fetchBadge = useCallback(async (address: string) => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('[useBadge] Fetching on-chain badge records for:', address);
      
      // First check localStorage for a stored badge for this address
      const storedBadge = getStoredBadge();
      if (storedBadge && storedBadge.owner === address) {
        console.log('[useBadge] Found stored badge for this address:', storedBadge);
        setBadgeState(storedBadge);
      }
      
      if (!connected) {
        console.log('[useBadge] Wallet not connected, using stored badge if available');
        // Don't clear badge if we have a stored one
        return;
      }
      
      // Try to get badge records from the wallet
      try {
        const records = await getBadgeRecords();
        console.log('[useBadge] Badge records from wallet:', records);
        
        if (records && records.length > 0) {
          const badgeRecord = records[0];
          const badgeData: SybilBadge = {
            id: `badge_${address.slice(0, 8)}`,
            owner: badgeRecord.owner || address,
            issuer: badgeRecord.issuer || 'sybilshield_aio_v2.aleo',
            createdAt: badgeRecord.createdAt || Math.floor(Date.now() / 1000),
            expiresAt: badgeRecord.expiresAt || Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60,
            proofHash: badgeRecord.proofHash || '',
            nonce: badgeRecord.nonce || '',
            status: badgeRecord.expiresAt > Math.floor(Date.now() / 1000) ? 'active' : 'expired',
          };
          console.log('[useBadge] Setting badge from on-chain record:', badgeData);
          setBadge(badgeData);
        }
        // Don't clear badge if wallet returns empty - keep localStorage version
      } catch (walletErr) {
        console.log('[useBadge] Could not fetch from wallet, keeping stored badge:', walletErr);
      }
    } catch (err) {
      console.error('[useBadge] Fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch badge');
    } finally {
      setLoading(false);
    }
  }, [connected, getBadgeRecords, setBadge]);

  // Set badge directly (for local state after claiming)
  const setBadgeDirectly = useCallback((badgeData: SybilBadge | null) => {
    setBadge(badgeData);
  }, [setBadge]);

  // Clear badge (for logout)
  const clearBadge = useCallback(() => {
    setBadge(null);
  }, [setBadge]);

  return {
    badge,
    loading: loading || !initialized,
    error,
    fetchBadge,
    setBadgeDirectly,
    clearBadge,
  };
}

export default useBadge;
