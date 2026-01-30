'use client';

// ============================================================================
// SybilShield Frontend - Wallet Button Component
// Uses custom WalletContext (same approach as AURA Protocol)
// ============================================================================

import { useState } from 'react';
import { useWallet } from '../contexts/WalletContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  WalletIcon, 
  ArrowRightOnRectangleIcon,
  ClipboardDocumentIcon,
  CheckIcon,
  ArrowTopRightOnSquareIcon
} from '@heroicons/react/24/outline';

// ============================================================================
// Wallet Button Component
// ============================================================================

export default function WalletButton() {
  const { 
    connected, 
    publicKey, 
    connecting, 
    walletAvailable,
    connect, 
    disconnect 
  } = useWallet();

  const [showMenu, setShowMenu] = useState(false);
  const [copied, setCopied] = useState(false);

  // Format address for display
  const formatAddress = (address: string | null) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Copy address to clipboard
  const handleCopy = () => {
    if (publicKey) {
      navigator.clipboard.writeText(publicKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Handle connect
  const handleConnect = async () => {
    try {
      await connect();
    } catch (error) {
      console.error('Connect failed:', error);
    }
  };

  // Handle disconnect
  const handleDisconnect = async () => {
    try {
      await disconnect();
      setShowMenu(false);
    } catch (error) {
      console.error('Disconnect failed:', error);
    }
  };

  // Explorer URL
  const getExplorerUrl = () => {
    const network = process.env.NEXT_PUBLIC_ALEO_NETWORK || 'testnet';
    const baseUrl = network === 'mainnet'
      ? 'https://explorer.provable.com'
      : 'https://testnet.explorer.provable.com';
    return `${baseUrl}/address/${publicKey}`;
  };

  if (connected && publicKey) {
    return (
      <div className="relative">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowMenu(!showMenu)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-accent-500/20 to-primary-500/20 border border-accent-500/30 hover:border-accent-500/50 transition-all"
        >
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-white font-medium text-sm">{formatAddress(publicKey)}</span>
          <svg 
            className={`w-4 h-4 text-gray-400 transition-transform ${showMenu ? 'rotate-180' : ''}`}
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </motion.button>

        <AnimatePresence>
          {showMenu && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 mt-2 w-64 rounded-xl bg-dark-900/95 backdrop-blur-xl border border-accent-500/20 shadow-xl z-50"
            >
              {/* Address section */}
              <div className="p-4 border-b border-accent-500/10">
                <p className="text-xs text-gray-400 mb-1">Connected Wallet</p>
                <div className="flex items-center justify-between">
                  <span className="text-white font-mono text-sm">{formatAddress(publicKey)}</span>
                  <button
                    onClick={handleCopy}
                    className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                  >
                    {copied ? (
                      <CheckIcon className="w-4 h-4 text-green-400" />
                    ) : (
                      <ClipboardDocumentIcon className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="p-2">
                <a
                  href={getExplorerUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-white/5 transition-colors text-gray-300 hover:text-white"
                >
                  <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                  <span className="text-sm">View on Explorer</span>
                </a>

                <button
                  onClick={handleDisconnect}
                  className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-red-500/10 transition-colors text-red-400"
                >
                  <ArrowRightOnRectangleIcon className="w-4 h-4" />
                  <span className="text-sm">Disconnect</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Click outside to close */}
        {showMenu && (
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowMenu(false)}
          />
        )}
      </div>
    );
  }

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={handleConnect}
      disabled={connecting}
      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-accent-500 to-primary-500 text-white font-medium hover:opacity-90 transition-all disabled:opacity-50"
    >
      {connecting ? (
        <>
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
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
          <span>Connecting...</span>
        </>
      ) : (
        <>
          <WalletIcon className="h-4 w-4" />
          <span>{walletAvailable ? 'Connect Wallet' : 'Install Leo Wallet'}</span>
        </>
      )}
    </motion.button>
  );
}
