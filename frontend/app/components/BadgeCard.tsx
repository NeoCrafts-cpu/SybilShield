'use client';

// ============================================================================
// SybilShield Frontend - Badge Card Component
// ============================================================================

import { motion } from 'framer-motion';
import {
  CheckBadgeIcon,
  ClockIcon,
  ShieldExclamationIcon,
  ArrowPathIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import type { SybilBadge } from '@/types';

// ============================================================================
// Props
// ============================================================================

interface BadgeCardProps {
  badge: SybilBadge | null;
  loading?: boolean;
  onRenew?: () => void;
}

// ============================================================================
// Badge Card Component
// ============================================================================

export default function BadgeCard({ badge, loading, onRenew }: BadgeCardProps) {
  // Format date
  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Calculate days until expiry
  const getDaysUntilExpiry = (expiresAt: number) => {
    const now = Math.floor(Date.now() / 1000);
    const diff = expiresAt - now;
    return Math.max(0, Math.floor(diff / (60 * 60 * 24)));
  };

  // Loading state
  if (loading) {
    return (
      <div className="glass-card p-8 animate-pulse">
        <div className="flex items-center gap-6">
          <div className="w-24 h-24 bg-dark-700 rounded-2xl" />
          <div className="flex-1">
            <div className="h-6 bg-dark-700 rounded w-1/3 mb-4" />
            <div className="h-4 bg-dark-700 rounded w-1/2 mb-2" />
            <div className="h-4 bg-dark-700 rounded w-1/4" />
          </div>
        </div>
      </div>
    );
  }

  // No badge state
  if (!badge) {
    return (
      <div className="glass-card p-8">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="w-24 h-24 rounded-2xl bg-dark-800 flex items-center justify-center">
            <ShieldExclamationIcon className="h-12 w-12 text-dark-500" />
          </div>
          <div className="text-center sm:text-left">
            <h3 className="text-xl font-semibold text-dark-300 mb-2">
              No Badge Found
            </h3>
            <p className="text-dark-400 text-sm">
              Complete the verification process to receive your SybilShield badge.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Badge status colors
  const statusColors = {
    active: 'bg-green-500/10 border-green-500/30 text-green-400',
    expired: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400',
    revoked: 'bg-red-500/10 border-red-500/30 text-red-400',
    none: 'bg-dark-700 border-dark-600 text-dark-400',
  };

  const statusIcons = {
    active: CheckBadgeIcon,
    expired: ClockIcon,
    revoked: ShieldExclamationIcon,
    none: ShieldExclamationIcon,
  };

  const StatusIcon = statusIcons[badge.status];
  const daysUntilExpiry = badge.status === 'active' ? getDaysUntilExpiry(badge.expiresAt) : 0;

  return (
    <motion.div
      className="glass-card p-8 relative overflow-hidden"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Background decoration */}
      {badge.status === 'active' && (
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-accent-500/10 to-transparent rounded-full blur-3xl" />
      )}

      <div className="relative flex flex-col lg:flex-row lg:items-center gap-6">
        {/* Badge visual */}
        <div className="relative">
          <motion.div
            className={`w-32 h-32 rounded-2xl flex items-center justify-center ${
              badge.status === 'active'
                ? 'bg-gradient-to-br from-accent-500/20 to-primary-500/20 border border-accent-500/30'
                : 'bg-dark-800 border border-dark-700'
            }`}
            animate={badge.status === 'active' ? { 
              boxShadow: ['0 0 20px rgba(0, 212, 255, 0.3)', '0 0 40px rgba(0, 212, 255, 0.5)', '0 0 20px rgba(0, 212, 255, 0.3)']
            } : {}}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <CheckBadgeIcon className={`h-16 w-16 ${
              badge.status === 'active' ? 'text-accent-500' : 'text-dark-500'
            }`} />
          </motion.div>
          
          {/* Status badge */}
          <div className={`absolute -bottom-2 -right-2 px-3 py-1 rounded-full text-xs font-medium border ${statusColors[badge.status]}`}>
            <StatusIcon className="h-3 w-3 inline mr-1" />
            {badge.status.charAt(0).toUpperCase() + badge.status.slice(1)}
          </div>
        </div>

        {/* Badge info */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-2xl font-bold text-gradient">SybilShield Badge</h3>
            {badge.status === 'active' && (
              <SparklesIcon className="h-5 w-5 text-accent-500" />
            )}
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-dark-400">
              <span>Owner:</span>
              <code className="px-2 py-0.5 bg-dark-800 rounded text-dark-300">
                {badge.owner.slice(0, 10)}...{badge.owner.slice(-6)}
              </code>
            </div>
            
            <div className="flex items-center gap-2 text-dark-400">
              <span>Issued:</span>
              <span className="text-dark-300">{formatDate(badge.createdAt)}</span>
            </div>
            
            <div className="flex items-center gap-2 text-dark-400">
              <span>Expires:</span>
              <span className={badge.status === 'active' ? 'text-dark-300' : 'text-yellow-400'}>
                {formatDate(badge.expiresAt)}
                {badge.status === 'active' && ` (${daysUntilExpiry} days)`}
              </span>
            </div>
          </div>

          {/* Expiry warning */}
          {badge.status === 'active' && daysUntilExpiry <= 30 && (
            <div className="mt-4 p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
              <div className="flex items-center gap-2 text-yellow-400 text-sm">
                <ClockIcon className="h-4 w-4" />
                <span>Your badge expires in {daysUntilExpiry} days</span>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          {badge.status === 'expired' && onRenew && (
            <button
              onClick={onRenew}
              className="btn-glow inline-flex items-center justify-center gap-2"
            >
              <ArrowPathIcon className="h-5 w-5" />
              Renew Badge
            </button>
          )}
          
          {badge.status === 'active' && daysUntilExpiry <= 30 && onRenew && (
            <button
              onClick={onRenew}
              className="btn-secondary inline-flex items-center justify-center gap-2"
            >
              <ArrowPathIcon className="h-5 w-5" />
              Renew Early
            </button>
          )}
        </div>
      </div>

      {/* Badge ID (proof hash) */}
      <div className="mt-6 pt-6 border-t border-dark-700">
        <div className="flex items-center justify-between text-sm">
          <span className="text-dark-500">Proof Hash</span>
          <code className="text-dark-400 font-mono text-xs">
            {badge.proofHash.slice(0, 20)}...{badge.proofHash.slice(-10)}
          </code>
        </div>
      </div>
    </motion.div>
  );
}
