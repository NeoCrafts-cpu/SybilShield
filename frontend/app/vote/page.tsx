'use client';

// ============================================================================
// SybilShield Frontend - Vote Page
// ============================================================================

import { useState, useEffect } from 'react';
import { useWallet } from '../contexts/WalletContext';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  HandRaisedIcon,
  PlusIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  ExclamationTriangleIcon,
  CheckBadgeIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import ProposalCard from '../components/ProposalCard';
import CreateProposalModal from '../components/CreateProposalModal';
import { useBadge } from '@/hooks/useBadge';
import { useProposals } from '@/hooks/useProposals';
import type { ProposalStatus } from '@/types';

// ============================================================================
// Filter Options
// ============================================================================

const filterOptions: { value: ProposalStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All Proposals' },
  { value: 'active', label: 'Active' },
  { value: 'passed', label: 'Passed' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'executed', label: 'Executed' },
];

// ============================================================================
// Vote Page Component
// ============================================================================

export default function VotePage() {
  const { connected, publicKey } = useWallet();
  const { badge, loading: badgeLoading, fetchBadge } = useBadge();
  const { 
    proposals, 
    loading: proposalsLoading, 
    fetchProposals,
    vote,
    createProposal,
  } = useProposals();

  const [filter, setFilter] = useState<ProposalStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [votingProposalId, setVotingProposalId] = useState<number | null>(null);

  // Check badge status on mount
  useEffect(() => {
    if (connected && publicKey) {
      fetchBadge(publicKey);
      fetchProposals();
    }
  }, [connected, publicKey, fetchBadge, fetchProposals]);

  // Fetch proposals on mount
  useEffect(() => {
    fetchProposals();
  }, [fetchProposals]);

  // Filter proposals
  const filteredProposals = proposals.filter((proposal) => {
    const matchesFilter = filter === 'all' || proposal.status === filter;
    const matchesSearch = proposal.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      proposal.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // Handle vote
  const handleVote = async (proposalId: number, voteChoice: boolean) => {
    if (!badge || badge.status !== 'active') {
      toast.error('You need an active badge to vote');
      return;
    }

    setVotingProposalId(proposalId);
    try {
      await vote(proposalId, voteChoice, badge.nonce, badge.expiresAt);
      toast.success(`Vote ${voteChoice ? 'Yes' : 'No'} submitted to blockchain!`);
      await fetchProposals();
    } catch (error) {
      toast.error('Failed to submit vote. Please try again.');
      console.error('Vote error:', error);
    } finally {
      setVotingProposalId(null);
    }
  };

  // Handle create proposal
  const handleCreateProposal = async (title: string, description: string, duration: number) => {
    if (!badge || badge.status !== 'active') {
      toast.error('You need an active badge to create proposals');
      return;
    }

    try {
      // Pass the badge nonce from localStorage-backed badge
      await createProposal(title, description, duration, badge.nonce);
      toast.success('Proposal submitted to blockchain!');
      setIsCreateModalOpen(false);
      await fetchProposals();
    } catch (error) {
      toast.error('Failed to create proposal. Please try again.');
      console.error('Create proposal error:', error);
    }
  };

  // Check if user has valid badge
  const hasValidBadge = badge?.status === 'active';

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold mb-2">
              DAO <span className="text-gradient">Governance</span>
            </h1>
            <p className="text-dark-400">
              Vote on proposals with your SybilShield badge. One person, one vote.
            </p>
          </div>

          <div className="flex items-center gap-4">
            {/* Badge status */}
            {connected && (
              <div className={`flex items-center gap-2 px-4 py-2 rounded-xl ${
                hasValidBadge 
                  ? 'bg-green-500/10 border border-green-500/20' 
                  : 'bg-yellow-500/10 border border-yellow-500/20'
              }`}>
                {hasValidBadge ? (
                  <>
                    <CheckBadgeIcon className="h-5 w-5 text-green-400" />
                    <span className="text-green-400 text-sm font-medium">Badge Active</span>
                  </>
                ) : (
                  <>
                    <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />
                    <span className="text-yellow-400 text-sm font-medium">No Badge</span>
                  </>
                )}
              </div>
            )}

            {/* Create proposal button */}
            <button
              onClick={() => setIsCreateModalOpen(true)}
              disabled={!hasValidBadge}
              className="btn-glow inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <PlusIcon className="h-5 w-5" />
              New Proposal
            </button>
          </div>
        </motion.div>

        {/* No badge warning */}
        {connected && !hasValidBadge && !badgeLoading && (
          <motion.div
            className="mb-8 p-6 glass-card border-l-4 border-yellow-500"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex items-start gap-4">
              <ExclamationTriangleIcon className="h-6 w-6 text-yellow-500 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-dark-100 mb-1">
                  Badge Required for Voting
                </h3>
                <p className="text-dark-400 text-sm mb-4">
                  You need an active SybilShield badge to vote on proposals. 
                  Get verified and claim your badge to participate in governance.
                </p>
                <Link
                  href="/badge"
                  className="btn-secondary inline-flex items-center gap-2 text-sm"
                >
                  Get Your Badge
                </Link>
              </div>
            </div>
          </motion.div>
        )}

        {/* Filters */}
        <motion.div
          className="flex flex-col sm:flex-row gap-4 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {/* Search */}
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-dark-400" />
            <input
              type="text"
              placeholder="Search proposals..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field pl-12"
            />
          </div>

          {/* Filter dropdown */}
          <div className="relative">
            <FunnelIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-dark-400" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as ProposalStatus | 'all')}
              className="input-field pl-12 pr-10 appearance-none cursor-pointer"
            >
              {filterOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Refresh button */}
          <button
            onClick={() => fetchProposals()}
            disabled={proposalsLoading}
            className="btn-secondary p-3"
          >
            <ArrowPathIcon className={`h-5 w-5 ${proposalsLoading ? 'animate-spin' : ''}`} />
          </button>
        </motion.div>

        {/* Proposals list */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {proposalsLoading ? (
            // Loading skeleton
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="glass-card p-6 animate-pulse">
                  <div className="h-6 bg-dark-700 rounded w-1/3 mb-4" />
                  <div className="h-4 bg-dark-700 rounded w-2/3 mb-2" />
                  <div className="h-4 bg-dark-700 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : filteredProposals.length === 0 ? (
            // Empty state
            <div className="glass-card p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-dark-800 flex items-center justify-center mx-auto mb-6">
                <HandRaisedIcon className="h-8 w-8 text-dark-500" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No Proposals Found</h3>
              <p className="text-dark-400 mb-6">
                {searchQuery || filter !== 'all'
                  ? 'Try adjusting your search or filters.'
                  : 'Be the first to create a proposal for the community.'}
              </p>
              {hasValidBadge && (
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="btn-glow inline-flex items-center gap-2"
                >
                  <PlusIcon className="h-5 w-5" />
                  Create Proposal
                </button>
              )}
            </div>
          ) : (
            // Proposals grid
            <div className="space-y-4">
              <AnimatePresence>
                {filteredProposals.map((proposal, index) => (
                  <motion.div
                    key={proposal.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <ProposalCard
                      proposal={proposal}
                      onVote={handleVote}
                      canVote={hasValidBadge}
                      isVoting={votingProposalId === proposal.id}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </motion.div>

        {/* Stats */}
        <motion.div
          className="mt-12 grid sm:grid-cols-4 gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          {[
            { label: 'Total Proposals', value: proposals.length },
            { label: 'Active', value: proposals.filter(p => p.status === 'active').length },
            { label: 'Passed', value: proposals.filter(p => p.status === 'passed').length },
            { label: 'Executed', value: proposals.filter(p => p.status === 'executed').length },
          ].map((stat) => (
            <div key={stat.label} className="glass-card p-4 text-center">
              <div className="text-2xl font-bold text-gradient">{stat.value}</div>
              <div className="text-sm text-dark-400">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Create Proposal Modal */}
      <CreateProposalModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateProposal}
      />
    </div>
  );
}
