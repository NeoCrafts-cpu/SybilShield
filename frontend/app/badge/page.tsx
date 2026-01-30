'use client';

// ============================================================================
// SybilShield Frontend - Badge Page
// ============================================================================

import { useState, useEffect } from 'react';
import { useWallet } from '../contexts/WalletContext';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  CheckBadgeIcon,
  FingerPrintIcon,
  ShieldCheckIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import BadgeCard from '../components/BadgeCard';
import StepIndicator from '../components/StepIndicator';
import VerificationForm from '../components/VerificationForm';
import { useBadge } from '@/hooks/useBadge';
import { useAleo } from '@/hooks/useAleo';

// ============================================================================
// Steps Configuration
// ============================================================================

const steps = [
  { id: 1, title: 'Connect Wallet', icon: ShieldCheckIcon },
  { id: 2, title: 'Verify Identity', icon: FingerPrintIcon },
  { id: 3, title: 'Claim Badge', icon: CheckBadgeIcon },
];

// ============================================================================
// Badge Page Component
// ============================================================================

export default function BadgePage() {
  const { connected, publicKey } = useWallet();
  const { badge, loading: badgeLoading, fetchBadge, setBadgeDirectly } = useBadge();
  const { issueBadge, getBadgeRecords } = useAleo();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [localVerification, setLocalVerification] = useState<{
    verification_id: string;
    status: string;
    proof_hash?: string;
  } | null>(null);

  // Determine current step based on wallet and badge status
  useEffect(() => {
    if (!connected) {
      setCurrentStep(1);
    } else if (badge?.status === 'active') {
      setCurrentStep(3);
    } else if (localVerification?.status === 'verified') {
      setCurrentStep(3);
    } else {
      setCurrentStep(2);
    }
  }, [connected, badge, localVerification]);

  // Fetch badge status when wallet connects
  useEffect(() => {
    if (connected && publicKey) {
      fetchBadge(publicKey);
    }
  }, [connected, publicKey, fetchBadge]);

  // Handle verification completion
  const handleVerificationComplete = async (verificationId: string) => {
    toast.success('Identity verified successfully!');
    setLocalVerification({
      verification_id: verificationId,
      status: 'verified',
      proof_hash: verificationId, // The proof hash from liveness verification
    });
    setCurrentStep(3);
  };

  // Handle badge claim - on-chain via Leo Wallet
  const handleClaimBadge = async () => {
    if (!localVerification || !publicKey) return;
    
    setIsProcessing(true);
    try {
      console.log('Claiming badge on-chain with verification:', localVerification);
      
      toast.loading('Submitting transaction to Aleo blockchain...', { id: 'badge-tx' });
      
      // Convert proof hash to field format for the contract
      // Remove any dashes from UUID-style hashes and take first 16 hex chars
      const rawHash = (localVerification.proof_hash || localVerification.verification_id)
        .replace(/-/g, '')  // Remove dashes from UUID format
        .replace(/[^a-f0-9]/gi, '');  // Keep only hex characters
      
      const hexHash = rawHash.slice(0, 16).padEnd(16, '0');  // Ensure at least 16 chars
      const proofHashBigInt = BigInt('0x' + hexHash);
      const proofHashField = `${proofHashBigInt}field`;
      
      // Generate a nonce field value based on proof hash (simulating contract behavior)
      // In real on-chain tx, the contract computes: BHP256::hash_to_field(recipient_hash + proof_hash)
      // For simulation, we create a deterministic nonce from the proof hash
      const nonceHex = rawHash.slice(16, 32).padEnd(16, '0') || rawHash.slice(0, 16);
      const nonceBigInt = BigInt('0x' + nonceHex);
      const nonceField = `${nonceBigInt}field`;
      
      console.log('Proof hash field:', proofHashField);
      console.log('Nonce field:', nonceField);
      
      const result = await issueBadge(publicKey, proofHashField);
      
      if (result.transactionId) {
        // Check if it's a real Aleo TX (starts with 'at1') or simulated (UUID)
        const isRealTx = result.transactionId.startsWith('at1');
        
        if (isRealTx) {
          toast.success(`Badge transaction submitted! TX: ${result.transactionId.slice(0, 10)}...`, { id: 'badge-tx' });
          toast.loading('Waiting for on-chain confirmation...', { id: 'badge-confirm' });
        } else {
          // Simulated transaction - set badge optimistically
          toast.success('Badge claimed successfully!', { id: 'badge-tx' });
          console.log('[Badge] Simulated transaction ID:', result.transactionId);
        }
        
        // Get current block height for expiration calculation
        let expiresAtBlock: number;
        try {
          const heightRes = await fetch('https://api.explorer.provable.com/v1/testnet/latest/height');
          const height = await heightRes.json();
          expiresAtBlock = (typeof height === 'number' ? height : 100000) + 31536000; // 1 year in blocks
        } catch {
          expiresAtBlock = Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60;
        }
        
        // Set badge optimistically for immediate UI feedback
        // Use proper field format for nonce so it works with contract calls
        setBadgeDirectly({
          id: `badge_${publicKey.slice(0, 8)}`,
          owner: publicKey,
          issuer: 'sybilshield_aio_v2.aleo',
          createdAt: Math.floor(Date.now() / 1000),
          expiresAt: expiresAtBlock,
          proofHash: proofHashField,
          nonce: nonceField, // Use the proper field-formatted nonce
          status: 'active',
        });
        
        console.log('[Badge] Stored badge with nonce:', nonceField);
        
        // Also try to check for real badge records
        setTimeout(async () => {
          try {
            const records = await getBadgeRecords();
            if (records.length > 0) {
              toast.success('Badge confirmed on-chain!', { id: 'badge-confirm' });
              await fetchBadge(publicKey);
            } else {
              toast.dismiss('badge-confirm');
            }
          } catch (e) {
            toast.dismiss('badge-confirm');
          }
        }, 10000);
      }
      
      setLocalVerification(null);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Failed to claim badge: ${errorMessage}`, { id: 'badge-tx' });
      console.error('Claim error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl lg:text-4xl font-bold mb-4">
            Get Your <span className="text-gradient">SybilShield</span> Badge
          </h1>
          <p className="text-dark-400 max-w-xl mx-auto">
            Verify your unique human identity and receive a privacy-preserving 
            badge that enables you to participate in fair DAO governance.
          </p>
        </motion.div>

        {/* Step Indicator */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <StepIndicator
            currentStep={currentStep}
            steps={steps.map((s) => s.title)}
            totalSteps={steps.length}
          />
        </motion.div>

        {/* Main Content */}
        <motion.div
          className="mt-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <AnimatePresence mode="wait">
            {/* Step 1: Connect Wallet */}
            {currentStep === 1 && (
              <motion.div
                key="step-1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="glass-card p-8 text-center"
              >
                <div className="w-16 h-16 rounded-full bg-accent-500/10 flex items-center justify-center mx-auto mb-6">
                  <ShieldCheckIcon className="h-8 w-8 text-accent-500" />
                </div>
                
                <h2 className="text-2xl font-bold mb-4">Connect Your Wallet</h2>
                <p className="text-dark-400 mb-8 max-w-md mx-auto">
                  Connect your Leo Wallet to get started. Your wallet address 
                  will be used to mint your SybilShield badge.
                </p>

                {/* Wallet button is in the navbar */}
                <div className="bg-dark-800/50 rounded-xl p-6 max-w-sm mx-auto">
                  <p className="text-sm text-dark-400">
                    Click the <span className="text-accent-400">"Connect Wallet"</span> button 
                    in the navigation bar to connect your Leo Wallet.
                  </p>
                </div>

                {/* Privacy note */}
                <div className="mt-8 p-4 bg-green-500/10 rounded-xl border border-green-500/20 max-w-md mx-auto">
                  <div className="flex items-center gap-2 text-green-400 text-sm">
                    <CheckCircleIcon className="h-5 w-5" />
                    <span>Your wallet address is never linked to your identity</span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 2: Verify Identity */}
            {currentStep === 2 && (
              <motion.div
                key="step-2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <VerificationForm
                  onComplete={handleVerificationComplete}
                  onError={(error) => toast.error(error)}
                />
              </motion.div>
            )}

            {/* Step 3: Claim Badge */}
            {currentStep === 3 && (
              <motion.div
                key="step-3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                {/* Badge display */}
                <BadgeCard 
                  badge={badge} 
                  loading={badgeLoading}
                  onRenew={() => {
                    // Handle renewal
                    toast.success('Renewal initiated!');
                  }}
                />

                {/* Claim button if verified but no badge yet */}
                {localVerification?.status === 'verified' && !badge && (
                  <div className="glass-card p-8 text-center">
                    <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-6">
                      <CheckCircleIcon className="h-8 w-8 text-green-500" />
                    </div>
                    
                    <h2 className="text-2xl font-bold mb-4">Identity Verified!</h2>
                    <p className="text-dark-400 mb-8">
                      Your identity has been verified. Click below to claim your 
                      SybilShield badge.
                    </p>

                    {/* On-chain info */}
                    <div className="flex items-center justify-center gap-2 mb-6 p-4 bg-primary-500/10 border border-primary-500/20 rounded-lg">
                      <svg className="h-5 w-5 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      <span className="text-sm text-primary-400">
                        Badge will be minted on-chain via your Leo Wallet
                      </span>
                    </div>

                    <button
                      onClick={handleClaimBadge}
                      disabled={isProcessing}
                      className="btn-glow inline-flex items-center gap-2"
                    >
                      {isProcessing ? (
                        <>
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
                          Minting Badge...
                        </>
                      ) : (
                        <>
                          Claim Your Badge
                          <ArrowRightIcon className="h-5 w-5" />
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* Badge active - show success */}
                {badge?.status === 'active' && (
                  <div className="glass-card p-8 text-center">
                    <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-6">
                      <CheckBadgeIcon className="h-8 w-8 text-green-500" />
                    </div>
                    
                    <h2 className="text-2xl font-bold mb-4">You're All Set!</h2>
                    <p className="text-dark-400 mb-8">
                      Your SybilShield badge is active. You can now participate in 
                      private DAO governance voting.
                    </p>

                    <Link
                      href="/vote"
                      className="btn-glow inline-flex items-center gap-2"
                    >
                      Go to Voting
                      <ArrowRightIcon className="h-5 w-5" />
                    </Link>
                  </div>
                )}

                {/* Badge expired - show renewal */}
                {badge?.status === 'expired' && (
                  <div className="glass-card p-8 text-center">
                    <div className="w-16 h-16 rounded-full bg-yellow-500/10 flex items-center justify-center mx-auto mb-6">
                      <ExclamationTriangleIcon className="h-8 w-8 text-yellow-500" />
                    </div>
                    
                    <h2 className="text-2xl font-bold mb-4">Badge Expired</h2>
                    <p className="text-dark-400 mb-8">
                      Your SybilShield badge has expired. Please renew it to 
                      continue participating in DAO governance.
                    </p>

                    <button
                      onClick={() => setCurrentStep(2)}
                      className="btn-glow inline-flex items-center gap-2"
                    >
                      Renew Badge
                      <ArrowRightIcon className="h-5 w-5" />
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Navigation buttons */}
        {currentStep > 1 && currentStep < 3 && (
          <motion.div
            className="mt-8 flex justify-between"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <button
              onClick={() => setCurrentStep(currentStep - 1)}
              className="btn-secondary inline-flex items-center gap-2"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              Back
            </button>
          </motion.div>
        )}

        {/* Info sections */}
        <motion.div
          className="mt-16 grid sm:grid-cols-3 gap-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="glass-card p-6 text-center">
            <div className="w-10 h-10 rounded-full bg-accent-500/10 flex items-center justify-center mx-auto mb-4">
              <ShieldCheckIcon className="h-5 w-5 text-accent-500" />
            </div>
            <h3 className="font-semibold mb-2">Privacy First</h3>
            <p className="text-sm text-dark-400">
              Your identity verification is never stored on-chain
            </p>
          </div>
          
          <div className="glass-card p-6 text-center">
            <div className="w-10 h-10 rounded-full bg-accent-500/10 flex items-center justify-center mx-auto mb-4">
              <FingerPrintIcon className="h-5 w-5 text-accent-500" />
            </div>
            <h3 className="font-semibold mb-2">Zero-Knowledge</h3>
            <p className="text-sm text-dark-400">
              Prove your uniqueness without revealing your identity
            </p>
          </div>
          
          <div className="glass-card p-6 text-center">
            <div className="w-10 h-10 rounded-full bg-accent-500/10 flex items-center justify-center mx-auto mb-4">
              <ClockIcon className="h-5 w-5 text-accent-500" />
            </div>
            <h3 className="font-semibold mb-2">Valid for 1 Year</h3>
            <p className="text-sm text-dark-400">
              Badges are valid for one year and can be renewed
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
