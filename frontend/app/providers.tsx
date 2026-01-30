'use client';

// ============================================================================
// SybilShield Frontend - Providers
// Uses custom WalletContext (same approach as AURA Protocol)
// ============================================================================

import { ReactNode } from 'react';
import { WalletProvider } from './contexts/WalletContext';
import { Toaster } from 'react-hot-toast';

// ============================================================================
// Props
// ============================================================================

interface ProvidersProps {
  children: ReactNode;
}

// ============================================================================
// Providers Component
// ============================================================================

export function Providers({ children }: ProvidersProps) {
  return (
    <WalletProvider>
      {children}
      
      {/* Toast notifications */}
      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 5000,
          style: {
            background: '#1e293b',
            color: '#f8fafc',
            border: '1px solid #334155',
            borderRadius: '12px',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#f8fafc',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#f8fafc',
            },
          },
        }}
      />
    </WalletProvider>
  );
}

export default Providers;
