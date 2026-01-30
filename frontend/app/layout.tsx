// ============================================================================
// SybilShield Frontend - Root Layout
// ============================================================================

import type { Metadata, Viewport } from 'next';
import '../styles/globals.css';
import { Providers } from './providers';
import Navigation from './components/Navigation';
import Footer from './components/Footer';

// ============================================================================
// Fonts (using CSS variables for system fonts - works offline)
// ============================================================================

// Note: We use system fonts for reliable builds. Add Google Fonts via CSS
// when internet connectivity is available during production deployment.

// ============================================================================
// Metadata
// ============================================================================

export const metadata: Metadata = {
  metadataBase: new URL('https://sybilshield.xyz'),
  title: {
    default: 'SybilShield - One Person, One Vote. Privately.',
    template: '%s | SybilShield',
  },
  description: 'Privacy-focused, zero-knowledge proof-based system for fair DAO governance on Aleo. Each verified unique human gets exactly one vote while maintaining complete privacy.',
  keywords: [
    'Aleo',
    'Zero-Knowledge Proofs',
    'DAO Governance',
    'Sybil Resistance',
    'Privacy',
    'Blockchain',
    'Web3',
    'Proof of Humanity',
    'Worldcoin',
  ],
  authors: [{ name: 'SybilShield Team' }],
  creator: 'SybilShield',
  publisher: 'SybilShield',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://sybilshield.xyz',
    siteName: 'SybilShield',
    title: 'SybilShield - One Person, One Vote. Privately.',
    description: 'Privacy-focused, zero-knowledge proof-based system for fair DAO governance on Aleo.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'SybilShield',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SybilShield - One Person, One Vote. Privately.',
    description: 'Privacy-focused, zero-knowledge proof-based system for fair DAO governance on Aleo.',
    images: ['/og-image.png'],
    creator: '@SybilShield',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    shortcut: '/favicon.svg',
    apple: '/icon-192.png',
  },
  manifest: '/site.webmanifest',
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#0f172a' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

// ============================================================================
// Layout Component
// ============================================================================

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html 
      lang="en" 
      className="dark"
      suppressHydrationWarning
    >
      <body className="min-h-screen bg-dark-950 text-dark-50 antialiased">
        <Providers>
          {/* Background gradient */}
          <div className="fixed inset-0 -z-10">
            <div className="absolute inset-0 bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950" />
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-accent-500/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl" />
          </div>

          {/* Main content */}
          <div className="relative flex flex-col min-h-screen">
            <Navigation />
            <main className="flex-1">
              {children}
            </main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}
