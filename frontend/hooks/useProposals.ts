// ============================================================================
// SybilShield Frontend - useProposals Hook
// ============================================================================

import { useState, useCallback } from 'react';
import { useAleo } from './useAleo';
import type { Proposal, VoteResponse } from '@/types';

// ============================================================================
// useProposals Hook - On-chain integration
// ============================================================================

export function useProposals() {
  const { 
    createProposal: aleoCreateProposal, 
    vote: aleoVote, 
    endVoting: aleoEndVoting,
    getBadgeRecords,
    loading: aleoLoading 
  } = useAleo();

  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all proposals from on-chain state
  const fetchProposals = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch proposals from on-chain mapping
      // The contract stores proposals in the `proposals` mapping
      const response = await fetch(
        `https://api.explorer.provable.com/v1/testnet/program/sybilshield_aio_v2.aleo/mapping/proposals`
      );
      
      // 404 means no proposals exist yet - this is expected for a new contract
      if (response.status === 404) {
        console.log('[useProposals] No proposals exist on-chain yet');
        setProposals([]);
        return;
      }
      
      if (!response.ok) {
        console.warn('[useProposals] API returned:', response.status);
        setProposals([]);
        return;
      }
      
      const data = await response.json();
      
      // Parse on-chain proposal data
      const parsedProposals: Proposal[] = [];
      
      if (Array.isArray(data)) {
        for (const entry of data) {
          try {
            // Parse proposal data from on-chain format
            const proposalId = parseInt(entry.key || '0');
            const value = entry.value || {};
            
            parsedProposals.push({
              id: proposalId,
              title: `Proposal #${proposalId}`, // Title is hashed on-chain
              description: 'On-chain proposal - view details in explorer',
              proposer: value.proposer || '',
              createdAt: parseInt(value.created_at || '0'),
              endsAt: parseInt(value.ends_at || '0'),
              votesYes: parseInt(value.votes_yes || '0'),
              votesNo: parseInt(value.votes_no || '0'),
              status: value.is_active ? 'active' : 
                     (parseInt(value.votes_yes || '0') > parseInt(value.votes_no || '0') ? 'passed' : 'rejected'),
            });
          } catch (e) {
            console.warn('Failed to parse proposal:', e);
          }
        }
      }
      
      setProposals(parsedProposals);
    } catch (err) {
      // Network errors are expected if the mapping is empty
      console.log('[useProposals] Could not fetch proposals (this is normal if none exist):', err);
      setProposals([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Create a new proposal on-chain
  const createProposal = useCallback(async (
    title: string, 
    description: string, 
    durationDays: number,
    badgeNonce?: string
  ) => {
    setLoading(true);
    setError(null);
    
    try {
      // Use passed badge nonce or try to get from wallet records
      let nonce = badgeNonce;
      
      if (!nonce) {
        // Try to get from wallet records as fallback
        try {
          const badges = await getBadgeRecords();
          if (badges.length > 0) {
            nonce = badges[0].nonce;
          }
        } catch (e) {
          console.log('[useProposals] Could not get badge from wallet:', e);
        }
      }
      
      if (!nonce) {
        throw new Error('No valid badge found. Please claim a badge first.');
      }
      
      const durationBlocks = durationDays * 24 * 60 * 60; // 1 block per second approx
      
      // Call the on-chain createProposal function
      const result = await aleoCreateProposal(
        title,
        description,
        durationBlocks,
        nonce
      );
      
      if (result.transactionId) {
        // Refresh proposals after a delay
        setTimeout(() => fetchProposals(), 10000);
        return result;
      }
      
      throw new Error('Failed to create proposal');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create proposal';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, [aleoCreateProposal, getBadgeRecords, fetchProposals]);

  // Vote on a proposal on-chain
  const vote = useCallback(async (
    proposalId: number, 
    voteChoice: boolean,
    badgeNonce?: string,
    badgeExpiresAt?: number
  ): Promise<VoteResponse> => {
    setLoading(true);
    setError(null);
    
    try {
      // Use passed badge info or try to get from records
      let nonce = badgeNonce;
      let expiresAt = badgeExpiresAt;
      
      if (!nonce || !expiresAt) {
        // Try to get user's badge from wallet records
        try {
          const badges = await getBadgeRecords();
          if (badges.length > 0) {
            nonce = badges[0].nonce;
            expiresAt = badges[0].expiresAt;
          }
        } catch (e) {
          console.log('[useProposals] Could not get badge records:', e);
        }
      }
      
      if (!nonce || !expiresAt) {
        throw new Error('No valid badge found. Please claim a badge first.');
      }
      
      // Call the on-chain vote function
      const result = await aleoVote(
        proposalId,
        nonce,
        expiresAt,
        voteChoice
      );
      
      if (result.transactionId) {
        // Update local state optimistically
        setProposals(prev => prev.map(p => {
          if (p.id === proposalId) {
            return {
              ...p,
              votesYes: voteChoice ? p.votesYes + 1 : p.votesYes,
              votesNo: !voteChoice ? p.votesNo + 1 : p.votesNo,
              hasVoted: true,
              userVote: voteChoice,
            };
          }
          return p;
        }));
        
        return {
          success: true,
          voteRecorded: true,
          message: 'Vote submitted to blockchain',
          transactionId: result.transactionId,
        };
      }
      
      throw new Error('Failed to submit vote');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to vote';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, [aleoVote, getBadgeRecords]);

  // End voting for a proposal
  const endVoting = useCallback(async (proposalId: number) => {
    setLoading(true);
    try {
      const result = await aleoEndVoting(proposalId);
      if (result.transactionId) {
        setTimeout(() => fetchProposals(), 10000);
      }
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to end voting';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, [aleoEndVoting, fetchProposals]);

  // Get a single proposal
  const getProposal = useCallback((proposalId: number) => {
    return proposals.find(p => p.id === proposalId);
  }, [proposals]);

  return {
    proposals,
    loading: loading || aleoLoading,
    error,
    fetchProposals,
    createProposal,
    vote,
    endVoting,
    getProposal,
  };
}

export default useProposals;
