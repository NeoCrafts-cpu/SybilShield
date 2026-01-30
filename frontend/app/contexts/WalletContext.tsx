'use client';

// ============================================================================
// SybilShield Frontend - Custom Wallet Context
// Direct interface with Leo Wallet extension (same approach as AURA Protocol)
// ============================================================================

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { api } from '@/services/api';

// ============================================================================
// Constants
// ============================================================================

const PROGRAM_ID = process.env.NEXT_PUBLIC_PROGRAM_ID || 'sybilshield_aio_v2.aleo';

// Decrypt permission options for Leo Wallet
const DecryptPermission = {
  NoDecrypt: 'NO_DECRYPT',
  UponRequest: 'UPON_REQUEST',
  AutoDecrypt: 'AUTO_DECRYPT',
  OnChainHistory: 'OnChainHistory',
} as const;

// Network options
const WalletAdapterNetwork = {
  Mainnet: 'mainnet',
  Testnet: 'testnet',
  TestnetBeta: 'testnetbeta',
} as const;

// ============================================================================
// Types
// ============================================================================

interface LeoWallet {
  publicKey?: string;
  address?: string;
  connect: (decryptPermission?: string, network?: string, programs?: string[]) => Promise<unknown>;
  disconnect: () => Promise<void>;
  requestTransaction: (transaction: unknown) => Promise<unknown>;
  requestRecords: (programId: string) => Promise<unknown>;
  requestRecordPlaintexts?: (programId: string) => Promise<unknown>;
  signMessage?: (message: Uint8Array) => Promise<unknown>;
  getSelectedAccount?: () => Promise<unknown>;
  on?: (event: string, handler: (event: unknown) => void) => void;
  off?: (event: string, handler: (event: unknown) => void) => void;
}

interface WalletContextType {
  wallet: LeoWallet | null;
  publicKey: string | null;
  connected: boolean;
  connecting: boolean;
  walletAvailable: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  reconnect: () => Promise<void>;
  requestTransaction: (transaction: unknown) => Promise<string | null>;
  requestRecords: (programId?: string) => Promise<unknown>;
  signMessage?: (message: Uint8Array) => Promise<unknown>;
}

// ============================================================================
// Context
// ============================================================================

const WalletContext = createContext<WalletContextType | null>(null);

// ============================================================================
// Provider Component
// ============================================================================

interface WalletProviderProps {
  children: ReactNode;
}

export function WalletProvider({ children }: WalletProviderProps) {
  const [wallet, setWallet] = useState<LeoWallet | null>(null);
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [walletAvailable, setWalletAvailable] = useState(false);

  // Get the wallet object from window
  const getWallet = useCallback((): LeoWallet | null => {
    if (typeof window !== 'undefined') {
      // Leo Wallet injects itself as window.leoWallet
      const w = (window as unknown as { leoWallet?: LeoWallet; leo?: LeoWallet });
      return w.leoWallet || w.leo || null;
    }
    return null;
  }, []);

  // Check if wallet extension is available
  useEffect(() => {
    const checkWallet = () => {
      const leoWallet = getWallet();
      setWalletAvailable(!!leoWallet);

      // If wallet is connected, update state
      if (leoWallet && leoWallet.publicKey) {
        setWallet(leoWallet);
        setPublicKey(leoWallet.publicKey);
        setConnected(true);
        // Set wallet address on API client for authenticated requests
        api.setWalletAddress(leoWallet.publicKey);
        console.log('[Wallet] Already connected:', leoWallet.publicKey);
      }
    };

    // Handle account changes
    const handleAccountChange = (event: unknown) => {
      console.log('[Wallet] Account changed:', event);
      const leoWallet = getWallet();
      if (leoWallet && leoWallet.publicKey) {
        setPublicKey(leoWallet.publicKey);
        api.setWalletAddress(leoWallet.publicKey);
      }
    };

    // Handle disconnect
    const handleDisconnect = () => {
      console.log('[Wallet] Disconnected');
      setWallet(null);
      setPublicKey(null);
      setConnected(false);
      api.setWalletAddress(null);
    };

    // Check immediately
    checkWallet();

    // Check again after a delay (extension might load slowly)
    const timer = setTimeout(checkWallet, 1000);

    // Listen for wallet events
    const leoWallet = getWallet();
    if (leoWallet) {
      leoWallet.on?.('accountChange', handleAccountChange);
      leoWallet.on?.('disconnect', handleDisconnect);
    }

    // Also check when window loads
    if (typeof window !== 'undefined') {
      window.addEventListener('load', checkWallet);
    }

    return () => {
      clearTimeout(timer);
      if (leoWallet) {
        leoWallet.off?.('accountChange', handleAccountChange);
        leoWallet.off?.('disconnect', handleDisconnect);
      }
      if (typeof window !== 'undefined') {
        window.removeEventListener('load', checkWallet);
      }
    };
  }, [getWallet]);

  // Connect to wallet
  const connect = useCallback(async () => {
    const leoWallet = getWallet();

    if (!leoWallet) {
      // Open Leo Wallet download page
      window.open('https://www.leo.app/', '_blank');
      return;
    }

    try {
      setConnecting(true);
      console.log('[Wallet] Requesting connection...');
      console.log('[Wallet] Available methods:', Object.keys(leoWallet));

      // Leo Wallet expects specific parameters for connect
      // DecryptPermission: "NO_DECRYPT" | "DECRYPT" | "AUTO_DECRYPT" | "UponRequest" | "OnChainHistory"
      // Network: "testnet" | "mainnet"
      const decryptPermission = DecryptPermission.OnChainHistory;
      const network = WalletAdapterNetwork.TestnetBeta;
      const programs = [PROGRAM_ID];

      let result: unknown;
      try {
        // Try connect with parameters
        result = await leoWallet.connect(decryptPermission, network, programs);
        console.log('[Wallet] Connect result:', result);
      } catch (e1) {
        console.log('[Wallet] Connect with params failed, trying without:', (e1 as Error).message);
        try {
          // Try without parameters
          result = await leoWallet.connect();
          console.log('[Wallet] Connect (no params) result:', result);
        } catch (e2) {
          console.log('[Wallet] Connect without params failed:', (e2 as Error).message);
        }
      }

      // After connect, check for the address in various places
      await new Promise(resolve => setTimeout(resolve, 200));

      let address: string | null = null;

      // Check different possible locations for the address
      if (result && typeof result === 'string') {
        address = result;
      } else if (result && typeof result === 'object' && 'address' in result) {
        address = (result as { address: string }).address;
      } else if (result && typeof result === 'object' && 'publicKey' in result) {
        address = (result as { publicKey: string }).publicKey;
      } else if (leoWallet.publicKey) {
        address = leoWallet.publicKey;
      } else if (leoWallet.address) {
        address = leoWallet.address;
      }

      // Try getSelectedAccount if available
      if (!address && leoWallet.getSelectedAccount) {
        try {
          const account = await leoWallet.getSelectedAccount();
          console.log('[Wallet] getSelectedAccount:', account);
          if (account && typeof account === 'string') {
            address = account;
          } else if (account && typeof account === 'object' && 'address' in account) {
            address = (account as { address: string }).address;
          }
        } catch (e) {
          console.log('[Wallet] getSelectedAccount failed:', (e as Error).message);
        }
      }

      if (address) {
        setWallet(leoWallet);
        setPublicKey(address);
        setConnected(true);
        // Set wallet address on API client for authenticated requests
        api.setWalletAddress(address);
        console.log('[Wallet] Connected successfully:', address);
      } else {
        console.warn('[Wallet] Connected but no address found. Wallet state:', {
          publicKey: leoWallet.publicKey,
          address: leoWallet.address,
          result
        });
      }
    } catch (error) {
      console.error('[Wallet] Connection failed:', error);
    } finally {
      setConnecting(false);
    }
  }, [getWallet]);

  // Disconnect from wallet
  const disconnect = useCallback(async () => {
    const leoWallet = getWallet();

    if (leoWallet) {
      try {
        await leoWallet.disconnect();
      } catch (error) {
        console.error('[Wallet] Disconnect error:', error);
      }
    }

    setWallet(null);
    setPublicKey(null);
    setConnected(false);
    // Clear wallet address from API client
    api.setWalletAddress(null);
  }, [getWallet]);

  // Reconnect with proper permissions
  const reconnect = useCallback(async () => {
    console.log('[Wallet] Reconnecting with proper permissions...');
    await disconnect();
    await new Promise(resolve => setTimeout(resolve, 500));
    await connect();
  }, [disconnect, connect]);

  // Request transaction
  const requestTransaction = useCallback(async (transaction: unknown): Promise<string | null> => {
    const leoWallet = getWallet();

    if (!leoWallet || !connected) {
      throw new Error('Wallet not connected');
    }

    try {
      const result = await leoWallet.requestTransaction(transaction);
      console.log('[Wallet] Full transaction result:', result);
      console.log('[Wallet] Result type:', typeof result);

      // Extract transaction ID from various possible formats
      let txId: string | null = null;

      if (typeof result === 'string') {
        txId = result;
      } else if (result && typeof result === 'object') {
        const r = result as Record<string, unknown>;
        if (r.transactionId) txId = r.transactionId as string;
        else if (r.id) txId = r.id as string;
        else if (r.txId) txId = r.txId as string;
        else if (r.transaction_id) txId = r.transaction_id as string;
      }

      console.log('[Wallet] Extracted transaction ID:', txId);

      // Validate it looks like an Aleo transaction ID
      if (txId && typeof txId === 'string' && txId.startsWith('at1')) {
        return txId;
      }

      return txId;
    } catch (error) {
      console.error('[Wallet] Transaction failed:', error);
      throw error;
    }
  }, [getWallet, connected]);

  // Request records
  const requestRecords = useCallback(async (programId: string = PROGRAM_ID): Promise<unknown> => {
    const leoWallet = getWallet();

    if (!leoWallet || !connected) {
      throw new Error('Wallet not connected');
    }

    try {
      const result = await leoWallet.requestRecords(programId);
      return result;
    } catch (error) {
      console.error('[Wallet] Get records failed:', error);
      throw error;
    }
  }, [getWallet, connected]);

  // Sign message
  const signMessage = useCallback(async (message: Uint8Array): Promise<unknown> => {
    const leoWallet = getWallet();

    if (!leoWallet || !connected) {
      throw new Error('Wallet not connected');
    }

    if (!leoWallet.signMessage) {
      throw new Error('Wallet does not support signing messages');
    }

    try {
      const result = await leoWallet.signMessage(message);
      return result;
    } catch (error) {
      console.error('[Wallet] Sign message failed:', error);
      throw error;
    }
  }, [getWallet, connected]);

  const value: WalletContextType = {
    wallet,
    publicKey,
    connected,
    connecting,
    walletAvailable,
    connect,
    disconnect,
    reconnect,
    requestTransaction,
    requestRecords,
    signMessage,
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
}

// ============================================================================
// Hook
// ============================================================================

export function useWallet(): WalletContextType {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}

export default WalletProvider;
