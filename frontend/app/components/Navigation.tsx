'use client';

// ============================================================================
// SybilShield Frontend - Navigation Component
// ============================================================================

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bars3Icon, 
  XMarkIcon,
  HomeIcon,
  CheckBadgeIcon,
  HandRaisedIcon,
} from '@heroicons/react/24/outline';
import WalletButton from './WalletButton';

// ============================================================================
// Navigation Links
// ============================================================================

const navLinks = [
  { href: '/', label: 'Home', icon: HomeIcon },
  { href: '/badge', label: 'Get Badge', icon: CheckBadgeIcon },
  { href: '/vote', label: 'Vote', icon: HandRaisedIcon },
];

// ============================================================================
// Navigation Component
// ============================================================================

export default function Navigation() {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-dark-900/80 backdrop-blur-xl border-b border-dark-700/50'
          : 'bg-transparent'
      }`}
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="relative">
              <Image 
                src="/logo.png" 
                alt="SybilShield" 
                width={40} 
                height={40}
                className="transition-transform group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-accent-500/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <span className="text-xl font-bold text-gradient">SybilShield</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              const Icon = link.icon;
              
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'text-accent-400'
                      : 'text-dark-300 hover:text-dark-100'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {link.label}
                  
                  {isActive && (
                    <motion.div
                      layoutId="nav-indicator"
                      className="absolute inset-0 bg-accent-500/10 rounded-lg border border-accent-500/20"
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </Link>
              );
            })}
          </div>

          {/* Right side - Wallet & Mobile Menu */}
          <div className="flex items-center gap-4">
            {/* Privacy indicator */}
            <div className="hidden lg:flex privacy-badge">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span>ZK-Protected</span>
            </div>

            {/* Wallet button */}
            <WalletButton />

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-dark-300 hover:text-dark-100 hover:bg-dark-800"
            >
              {isMobileMenuOpen ? (
                <XMarkIcon className="h-6 w-6" />
              ) : (
                <Bars3Icon className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden bg-dark-900/95 backdrop-blur-xl border-b border-dark-700/50"
          >
            <div className="px-4 py-4 space-y-2">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                const Icon = link.icon;
                
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium transition-colors ${
                      isActive
                        ? 'bg-accent-500/10 text-accent-400 border border-accent-500/20'
                        : 'text-dark-300 hover:text-dark-100 hover:bg-dark-800'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    {link.label}
                  </Link>
                );
              })}
              
              {/* Privacy indicator mobile */}
              <div className="privacy-badge justify-center mt-4">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span>ZK-Protected</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
