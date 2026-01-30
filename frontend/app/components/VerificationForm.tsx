'use client';

// ============================================================================
// SybilShield Frontend - Verification Form Component
// ============================================================================

import { useState } from 'react';
import { useWallet } from '../contexts/WalletContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import {
  FingerPrintIcon,
  GlobeAltIcon,
  ArrowRightIcon,
  ExclamationCircleIcon,
  InformationCircleIcon,
  UserGroupIcon,
  VideoCameraIcon,
} from '@heroicons/react/24/outline';
import { useVerification } from '@/hooks/useVerification';
import LivenessVerification from './LivenessVerification';
import type { VerificationFormData, VerificationProvider } from '@/types';

// ============================================================================
// Props
// ============================================================================

interface VerificationFormProps {
  onComplete: (verificationId: string) => void;
  onError: (error: string) => void;
}

// ============================================================================
// Provider Options
// ============================================================================

const providers = [
  {
    id: 'liveness' as VerificationProvider,
    name: 'Liveness Check',
    description: 'Verify with your camera - no app needed!',
    icon: VideoCameraIcon,
    color: 'from-green-500 to-emerald-500',
    recommended: true,
  },
  {
    id: 'proof_of_humanity' as VerificationProvider,
    name: 'Proof of Humanity',
    description: 'Verify using your PoH registration',
    icon: FingerPrintIcon,
    color: 'from-purple-500 to-pink-500',
  },
  {
    id: 'worldcoin' as VerificationProvider,
    name: 'Worldcoin',
    description: 'Verify using World ID',
    icon: GlobeAltIcon,
    color: 'from-blue-500 to-cyan-500',
  },
  {
    id: 'brightid' as VerificationProvider,
    name: 'BrightID',
    description: 'Verify via social graph connections',
    icon: UserGroupIcon,
    color: 'from-orange-500 to-yellow-500',
  },
];

// ============================================================================
// Verification Form Component
// ============================================================================

export default function VerificationForm({ onComplete, onError }: VerificationFormProps) {
  const { publicKey } = useWallet();
  const { verifyIdentity, loading } = useVerification();
  
  const [selectedProvider, setSelectedProvider] = useState<VerificationProvider | null>(null);
  const [step, setStep] = useState<'select' | 'verify' | 'liveness'>('select');

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<VerificationFormData>();

  // Handle provider selection
  const handleSelectProvider = (provider: VerificationProvider) => {
    setSelectedProvider(provider);
    if (provider === 'liveness') {
      setStep('liveness');
    } else {
      setStep('verify');
    }
  };

  // Handle form submission
  const onSubmit = async (data: VerificationFormData) => {
    if (!selectedProvider || !publicKey) return;

    try {
      const result = await verifyIdentity({
        provider: selectedProvider,
        profileUrl: data.pohProfileUrl,
        token: data.worldcoinToken,
        brightIdContext: data.brightIdContext,
        address: publicKey,
      });

      if (result.status === 'verified') {
        onComplete(result.verification_id);
      } else {
        onError('Verification pending. Please try again.');
      }
    } catch (error) {
      onError('Verification failed. Please try again.');
    }
  };

  // Handle liveness verification complete
  const handleLivenessComplete = async (proofHash: string) => {
    if (!publicKey) return;
    
    try {
      const result = await verifyIdentity({
        provider: 'liveness',
        livenessProof: proofHash,
        address: publicKey,
      });

      if (result.status === 'verified') {
        onComplete(result.verification_id);
      } else {
        onError('Verification pending. Please try again.');
      }
    } catch (error) {
      onError('Verification failed. Please try again.');
    }
  };

  // Handle back
  const handleBack = () => {
    setStep('select');
    setSelectedProvider(null);
    reset();
  };

  // Render liveness verification
  if (step === 'liveness') {
    return (
      <LivenessVerification
        onComplete={handleLivenessComplete}
        onError={onError}
        onBack={handleBack}
      />
    );
  }

  return (
    <div className="glass-card p-8">
      <AnimatePresence mode="wait">
        {/* Step 1: Select Provider */}
        {step === 'select' && (
          <motion.div
            key="select"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-full bg-accent-500/10 flex items-center justify-center mx-auto mb-6">
                <FingerPrintIcon className="h-8 w-8 text-accent-500" />
              </div>
              <h2 className="text-2xl font-bold mb-4">Verify Your Identity</h2>
              <p className="text-dark-400 max-w-md mx-auto">
                Choose a verification provider to prove you are a unique human. 
                Your identity will never be linked to your wallet address.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
              {providers.map((provider) => (
                <motion.button
                  key={provider.id}
                  onClick={() => handleSelectProvider(provider.id)}
                  className={`p-6 rounded-xl bg-dark-800 border text-left hover:border-accent-500/50 transition-all group relative ${
                    'recommended' in provider && provider.recommended 
                      ? 'border-green-500/50 ring-1 ring-green-500/20' 
                      : 'border-dark-700'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {'recommended' in provider && provider.recommended && (
                    <div className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-green-500 text-white text-xs font-semibold rounded-full">
                      Recommended
                    </div>
                  )}
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${provider.color} p-0.5 mb-4`}>
                    <div className="w-full h-full bg-dark-800 rounded-[10px] flex items-center justify-center">
                      <provider.icon className="h-6 w-6 text-dark-100" />
                    </div>
                  </div>
                  <h3 className="font-semibold text-dark-100 mb-1 group-hover:text-accent-400 transition-colors">
                    {provider.name}
                  </h3>
                  <p className="text-sm text-dark-400">{provider.description}</p>
                </motion.button>
              ))}
            </div>

            {/* Privacy notice */}
            <div className="mt-8 p-4 bg-dark-800/50 rounded-xl max-w-3xl mx-auto">
              <div className="flex items-start gap-3">
                <InformationCircleIcon className="h-5 w-5 text-accent-500 shrink-0 mt-0.5" />
                <p className="text-sm text-dark-400">
                  <span className="text-dark-200 font-medium">Privacy Note:</span> Your verification 
                  happens off-chain. Only a zero-knowledge proof of your humanity is stored on Aleo.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 2: Verify */}
        {step === 'verify' && selectedProvider && (
          <motion.div
            key="verify"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-full bg-accent-500/10 flex items-center justify-center mx-auto mb-6">
                {selectedProvider === 'proof_of_humanity' ? (
                  <FingerPrintIcon className="h-8 w-8 text-accent-500" />
                ) : selectedProvider === 'worldcoin' ? (
                  <GlobeAltIcon className="h-8 w-8 text-accent-500" />
                ) : (
                  <UserGroupIcon className="h-8 w-8 text-accent-500" />
                )}
              </div>
              <h2 className="text-2xl font-bold mb-4">
                {selectedProvider === 'proof_of_humanity' 
                  ? 'Proof of Humanity Verification'
                  : selectedProvider === 'worldcoin'
                  ? 'Worldcoin Verification'
                  : 'BrightID Verification'}
              </h2>
              <p className="text-dark-400 max-w-md mx-auto">
                {selectedProvider === 'proof_of_humanity'
                  ? 'Enter your Proof of Humanity profile URL to verify your identity.'
                  : selectedProvider === 'worldcoin'
                  ? 'Enter your Worldcoin verification token to verify your identity.'
                  : 'Link your BrightID to verify your unique identity through social connections.'}
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="max-w-md mx-auto">
              {selectedProvider === 'proof_of_humanity' && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-dark-200 mb-2">
                    Proof of Humanity Profile URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://app.proofofhumanity.id/profile/0x..."
                    className={`input-field ${errors.pohProfileUrl ? 'border-red-500' : ''}`}
                    {...register('pohProfileUrl', {
                      required: 'Profile URL is required',
                      pattern: {
                        value: /^https:\/\/app\.proofofhumanity\.id\/profile\/0x[a-fA-F0-9]{40}$/,
                        message: 'Invalid Proof of Humanity profile URL',
                      },
                    })}
                  />
                  {errors.pohProfileUrl && (
                    <p className="mt-2 text-sm text-red-400 flex items-center gap-1">
                      <ExclamationCircleIcon className="h-4 w-4" />
                      {errors.pohProfileUrl.message}
                    </p>
                  )}
                  <p className="mt-2 text-xs text-dark-500">
                    Your PoH profile must be registered and not challenged.
                  </p>
                </div>
              )}

              {selectedProvider === 'worldcoin' && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-dark-200 mb-2">
                    Worldcoin Verification Token
                  </label>
                  <input
                    type="text"
                    placeholder="Enter your World ID verification token"
                    className={`input-field ${errors.worldcoinToken ? 'border-red-500' : ''}`}
                    {...register('worldcoinToken', {
                      required: 'Verification token is required',
                      minLength: {
                        value: 10,
                        message: 'Token must be at least 10 characters',
                      },
                    })}
                  />
                  {errors.worldcoinToken && (
                    <p className="mt-2 text-sm text-red-400 flex items-center gap-1">
                      <ExclamationCircleIcon className="h-4 w-4" />
                      {errors.worldcoinToken.message}
                    </p>
                  )}
                  <p className="mt-2 text-xs text-dark-500">
                    Get your token from the Worldcoin app or web portal.
                  </p>
                </div>
              )}

              {selectedProvider === 'brightid' && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-dark-200 mb-2">
                    BrightID Context ID
                  </label>
                  <input
                    type="text"
                    placeholder="Enter your BrightID context identifier"
                    className={`input-field ${errors.brightIdContext ? 'border-red-500' : ''}`}
                    {...register('brightIdContext', {
                      required: 'BrightID context is required',
                      minLength: {
                        value: 5,
                        message: 'Context ID must be at least 5 characters',
                      },
                    })}
                  />
                  {errors.brightIdContext && (
                    <p className="mt-2 text-sm text-red-400 flex items-center gap-1">
                      <ExclamationCircleIcon className="h-4 w-4" />
                      {errors.brightIdContext.message}
                    </p>
                  )}
                  <div className="mt-3 p-3 bg-dark-800 rounded-lg">
                    <p className="text-xs text-dark-400 mb-2">
                      <span className="text-dark-200 font-medium">How to get verified with BrightID:</span>
                    </p>
                    <ol className="text-xs text-dark-400 space-y-1 list-decimal list-inside">
                      <li>Download the BrightID app from <a href="https://brightid.org" target="_blank" rel="noopener noreferrer" className="text-accent-400 hover:underline">brightid.org</a></li>
                      <li>Connect with people you know to build your social graph</li>
                      <li>Attend a verification party or get verified by existing users</li>
                      <li>Link your BrightID to SybilShield using the app</li>
                    </ol>
                  </div>
                </div>
              )}

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={handleBack}
                  className="btn-secondary flex-1"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-glow flex-1 inline-flex items-center justify-center gap-2"
                >
                  {loading ? (
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
                      Verifying...
                    </>
                  ) : (
                    <>
                      Verify Identity
                      <ArrowRightIcon className="h-5 w-5" />
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* On-chain verification notice */}
            <div className="mt-8 p-4 bg-primary-500/10 rounded-xl max-w-md mx-auto border border-primary-500/20">
              <div className="flex items-start gap-3">
                <InformationCircleIcon className="h-5 w-5 text-primary-400 shrink-0 mt-0.5" />
                <p className="text-sm text-primary-300">
                  <span className="font-medium">Privacy-First:</span> Your identity is verified 
                  using zero-knowledge proofs. No personal data is stored on-chain.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
