'use client';

// ============================================================================
// SybilShield Frontend - Proposal Card Component
// ============================================================================

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  HandThumbUpIcon,
  HandThumbDownIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  PlayIcon,
  UserIcon,
} from '@heroicons/react/24/outline';
import type { Proposal } from '@/types';

// ============================================================================
// Props
// ============================================================================

interface ProposalCardProps {
  proposal: Proposal;
  onVote?: (proposalId: number, voteChoice: boolean) => void;
  canVote?: boolean;
  isVoting?: boolean;
}

// ============================================================================
// Proposal Card Component
// ============================================================================

export default function ProposalCard({
  proposal,
  onVote,
  canVote = false,
  isVoting = false,
}: ProposalCardProps) {
  const [showDetails, setShowDetails] = useState(false);

  // Calculate progress
  const totalVotes = proposal.votesYes + proposal.votesNo;
  const yesPercentage = totalVotes > 0 ? (proposal.votesYes / totalVotes) * 100 : 50;
  const noPercentage = totalVotes > 0 ? (proposal.votesNo / totalVotes) * 100 : 50;

  // Format time remaining
  const getTimeRemaining = () => {
    const now = Math.floor(Date.now() / 1000);
    const remaining = proposal.endsAt - now;
    
    if (remaining <= 0) return 'Ended';
    
    const days = Math.floor(remaining / (60 * 60 * 24));
    const hours = Math.floor((remaining % (60 * 60 * 24)) / (60 * 60));
    
    if (days > 0) return `${days}d ${hours}h remaining`;
    return `${hours}h remaining`;
  };

  // Status colors and icons
  const statusConfig = {
    active: { 
      color: 'bg-blue-500/10 text-blue-400 border-blue-500/20', 
      icon: ClockIcon,
      label: 'Active'
    },
    passed: { 
      color: 'bg-green-500/10 text-green-400 border-green-500/20', 
      icon: CheckCircleIcon,
      label: 'Passed'
    },
    rejected: { 
      color: 'bg-red-500/10 text-red-400 border-red-500/20', 
      icon: XCircleIcon,
      label: 'Rejected'
    },
    executed: { 
      color: 'bg-purple-500/10 text-purple-400 border-purple-500/20', 
      icon: PlayIcon,
      label: 'Executed'
    },
    cancelled: { 
      color: 'bg-gray-500/10 text-gray-400 border-gray-500/20', 
      icon: XCircleIcon,
      label: 'Cancelled'
    },
  };

  const status = statusConfig[proposal.status];
  const StatusIcon = status.icon;

  return (
    <motion.div
      className="glass-card p-6 hover:border-dark-600 transition-colors"
      layout
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-sm text-dark-500">#{proposal.id}</span>
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${status.color}`}>
              <StatusIcon className="h-3 w-3" />
              {status.label}
            </span>
            {proposal.hasVoted && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-accent-500/10 text-accent-400 border border-accent-500/20">
                {proposal.userVote ? (
                  <>
                    <HandThumbUpIcon className="h-3 w-3" />
                    Voted Yes
                  </>
                ) : (
                  <>
                    <HandThumbDownIcon className="h-3 w-3" />
                    Voted No
                  </>
                )}
              </span>
            )}
          </div>
          <h3 className="text-lg font-semibold text-dark-100 mb-2">
            {proposal.title}
          </h3>
        </div>

        {/* Time remaining */}
        {proposal.status === 'active' && (
          <div className="text-right">
            <div className="flex items-center gap-1 text-sm text-dark-400">
              <ClockIcon className="h-4 w-4" />
              {getTimeRemaining()}
            </div>
          </div>
        )}
      </div>

      {/* Description */}
      <p className={`text-dark-400 text-sm mb-4 ${!showDetails ? 'line-clamp-2' : ''}`}>
        {proposal.description}
      </p>
      
      {proposal.description.length > 150 && (
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-sm text-accent-400 hover:text-accent-300 mb-4"
        >
          {showDetails ? 'Show less' : 'Show more'}
        </button>
      )}

      {/* Voting progress */}
      <div className="mb-4">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-green-400">Yes: {proposal.votesYes}</span>
          <span className="text-red-400">No: {proposal.votesNo}</span>
        </div>
        <div className="h-2 bg-dark-700 rounded-full overflow-hidden flex">
          <motion.div
            className="h-full bg-green-500"
            initial={{ width: 0 }}
            animate={{ width: `${yesPercentage}%` }}
            transition={{ duration: 0.5, delay: 0.1 }}
          />
          <motion.div
            className="h-full bg-red-500"
            initial={{ width: 0 }}
            animate={{ width: `${noPercentage}%` }}
            transition={{ duration: 0.5, delay: 0.1 }}
          />
        </div>
        <div className="flex justify-between text-xs text-dark-500 mt-1">
          <span>{yesPercentage.toFixed(1)}%</span>
          <span>{totalVotes} total votes</span>
          <span>{noPercentage.toFixed(1)}%</span>
        </div>
      </div>

      {/* Proposer info */}
      <div className="flex items-center gap-2 text-sm text-dark-500 mb-4">
        <UserIcon className="h-4 w-4" />
        <span>Proposed by</span>
        <code className="px-2 py-0.5 bg-dark-800 rounded text-dark-400 text-xs">
          {proposal.proposer.slice(0, 8)}...{proposal.proposer.slice(-6)}
        </code>
      </div>

      {/* Vote buttons */}
      {proposal.status === 'active' && canVote && !proposal.hasVoted && onVote && (
        <div className="flex gap-3">
          <motion.button
            onClick={() => onVote(proposal.id, true)}
            disabled={isVoting}
            className="flex-1 py-3 px-4 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 hover:bg-green-500/20 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {isVoting ? (
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
            ) : (
              <>
                <HandThumbUpIcon className="h-5 w-5" />
                Vote Yes
              </>
            )}
          </motion.button>
          
          <motion.button
            onClick={() => onVote(proposal.id, false)}
            disabled={isVoting}
            className="flex-1 py-3 px-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {isVoting ? (
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
            ) : (
              <>
                <HandThumbDownIcon className="h-5 w-5" />
                Vote No
              </>
            )}
          </motion.button>
        </div>
      )}

      {/* Already voted message */}
      {proposal.hasVoted && (
        <div className="p-3 bg-dark-800/50 rounded-lg text-center text-sm text-dark-400">
          You have already voted on this proposal
        </div>
      )}
    </motion.div>
  );
}
