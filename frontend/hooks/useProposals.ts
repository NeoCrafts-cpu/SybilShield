// ============================================================================
// SybilShield Frontend - useProposals Hook
// ============================================================================

import { useState, useCallback } from 'react';
import { useAleo } from './useAleo';
import { blockchain } from '@/services/blockchain';
import type { Proposal, VoteResponse } from '@/types';

// ============================================================================
// useProposals Hook - On-chain integration
// ============================================================================

export function useProposals() {
  const { 
    createProposal: aleoCreateProposal, 
    vote: aleoVote, 
    endVoting: aleoEndVoting,
    loading: aleoLoading 
  } = useAleo();

  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all proposals from on-chain state via blockchain service
  const fetchProposals = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Get proposal count from prop_cnt mapping
      const count = await blockchain.getProposalCount();
      console.log('[useProposals] Proposal count from chain:', count);
      
      if (count === 0) {
        setProposals([]);
        return;
      }
      
      // Fetch each proposal by ID (1-indexed in contract)
      const parsedProposals: Proposal[] = [];
      
      for (let i = 1; i <= count; i++) {
        try {
          const onChainProposal = await blockchain.getProposal(i);
          if (!onChainProposal) continue;
          
          const isActive = await blockchain.isProposalActive(i);
          
          // Determine status
          let status: Proposal['status'];
          if (onChainProposal.executed && onChainProposal.passed) {
            status = 'executed';
          } else if (onChainProposal.executed && !onChainProposal.passed) {
            status = 'cancelled';
          } else if (!isActive && onChainProposal.votesYes > onChainProposal.votesNo) {
            status = 'passed';
          } else if (!isActive) {
            status = 'rejected';
          } else {
            status = 'active';
          }
          
          parsedProposals.push({
            id: onChainProposal.id,
            title: `Proposal #${i}`,
            description: `On-chain governance proposal with ${onChainProposal.votesYes + onChainProposal.votesNo} total votes`,
            proposer: onChainProposal.proposer,
            createdAt: onChainProposal.createdAt,
            endsAt: onChainProposal.endsAt,
            votesYes: onChainProposal.votesYes,
            votesNo: onChainProposal.votesNo,
            status,
          });
        } catch (e) {
          console.warn(`[useProposals] Failed to parse proposal ${i}:`, e);
        }
      }
      
      setProposals(parsedProposals);
    } catch (err) {
      console.log('[useProposals] Could not fetch proposals:', err);
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
      if (!badgeNonce) {
        throw new Error('No valid badge found. Please claim a badge first.');
      }
      
      // Convert days to seconds (blocks ≈ 1/sec on Aleo)
      // Contract requires: duration >= 100 and duration <= 2592000
      const durationBlocks = Math.max(100, Math.min(durationDays * 86400, 2592000));
      
      // Call the on-chain createProposal function via Leo Wallet
      const result = await aleoCreateProposal(
        title,
        description,
        durationBlocks,
        badgeNonce
      );
      
      if (result.transactionId) {
        // Refresh proposals after a delay to allow on-chain confirmation
        setTimeout(() => fetchProposals(), 15000);
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
  }, [aleoCreateProposal, fetchProposals]);

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
      if (!badgeNonce || !badgeExpiresAt) {
        throw new Error('No valid badge found. Please claim a badge first.');
      }
      
      // Call the on-chain vote function via Leo Wallet
      const result = await aleoVote(
        proposalId,
        badgeNonce,
        badgeExpiresAt,
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
  }, [aleoVote]);

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
