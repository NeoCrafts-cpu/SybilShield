'use client';

// ============================================================================
// SybilShield Frontend - Landing Page
// ============================================================================

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ShieldCheckIcon,
  EyeSlashIcon,
  UserGroupIcon,
  CheckBadgeIcon,
  ArrowRightIcon,
  LockClosedIcon,
  FingerPrintIcon,
  ScaleIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';

// ============================================================================
// Animation Variants
// ============================================================================

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.5 },
  },
};

const stagger = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

// ============================================================================
// Features Data
// ============================================================================

const features = [
  {
    icon: EyeSlashIcon,
    title: 'Complete Privacy',
    description: 'Your identity verification happens off-chain. On-chain, only a zero-knowledge proof exists.',
  },
  {
    icon: UserGroupIcon,
    title: 'Sybil Resistant',
    description: 'Each verified human gets exactly one badge. No multiple accounts, no vote manipulation.',
  },
  {
    icon: CheckBadgeIcon,
    title: 'Portable Identity',
    description: 'Your SybilShield badge works across any DAO that integrates with our protocol.',
  },
  {
    icon: ScaleIcon,
    title: 'Fair Governance',
    description: 'True democratic voting where every verified person has equal voting power.',
  },
];

const howItWorks = [
  {
    step: 1,
    title: 'Verify Your Humanity',
    description: 'Connect with Proof of Humanity or Worldcoin to prove you are a unique human.',
    icon: FingerPrintIcon,
  },
  {
    step: 2,
    title: 'Receive Your Badge',
    description: 'Get a privacy-preserving SybilShield badge minted on Aleo using zero-knowledge proofs.',
    icon: CheckBadgeIcon,
  },
  {
    step: 3,
    title: 'Vote Privately',
    description: 'Participate in DAO governance with one vote per person, completely anonymously.',
    icon: ShieldCheckIcon,
  },
];

const stats = [
  { value: '100%', label: 'Privacy Preserved' },
  { value: '1:1', label: 'Person to Vote' },
  { value: 'ZK', label: 'Proof Based' },
  { value: '∞', label: 'DAOs Supported' },
];

// ============================================================================
// Landing Page Component
// ============================================================================

export default function LandingPage() {
  return (
    <div className="relative overflow-hidden">
      {/* ================================================================== */}
      {/* Hero Section */}
      {/* ================================================================== */}
      <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center"
            initial="initial"
            animate="animate"
            variants={stagger}
          >
            {/* Badge */}
            <motion.div variants={fadeInUp} className="mb-6">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent-500/10 border border-accent-500/20 text-accent-400 text-sm font-medium">
                <SparklesIcon className="h-4 w-4" />
                Built for Aleo Privacy Buildathon Wave 1
              </span>
            </motion.div>

            {/* Title */}
            <motion.h1
              variants={fadeInUp}
              className="text-4xl sm:text-5xl lg:text-7xl font-bold tracking-tight mb-6"
            >
              <span className="text-dark-50">One Person, One Vote.</span>
              <br />
              <span className="text-gradient">Privately.</span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              variants={fadeInUp}
              className="text-lg sm:text-xl text-dark-400 max-w-2xl mx-auto mb-10"
            >
              SybilShield enables fair DAO governance with zero-knowledge proof-based 
              identity verification. Each verified unique human gets exactly one vote, 
              while maintaining complete privacy.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              variants={fadeInUp}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Link href="/badge" className="btn-glow inline-flex items-center justify-center gap-2">
                Get Your Badge
                <ArrowRightIcon className="h-4 w-4" />
              </Link>
              <Link href="#how-it-works" className="btn-secondary inline-flex items-center justify-center gap-2">
                Learn More
              </Link>
            </motion.div>

            {/* Hero Visual */}
            <motion.div
              variants={fadeInUp}
              className="mt-16 lg:mt-24 relative"
            >
              <div className="relative mx-auto max-w-4xl">
                {/* Glow effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-accent-500/20 via-primary-500/20 to-accent-500/20 blur-3xl" />
                
                {/* Main card */}
                <div className="relative glass-card p-8 lg:p-12">
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                    {stats.map((stat, index) => (
                      <motion.div
                        key={stat.label}
                        className="text-center"
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.5 + index * 0.1 }}
                      >
                        <div className="text-3xl lg:text-4xl font-bold text-gradient mb-2">
                          {stat.value}
                        </div>
                        <div className="text-sm text-dark-400">{stat.label}</div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Background decoration */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-accent-500/5 to-transparent pointer-events-none" />
      </section>

      {/* ================================================================== */}
      {/* Problem Section */}
      {/* ================================================================== */}
      <section className="py-20 lg:py-32 border-t border-dark-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <span className="text-accent-500 font-semibold text-sm uppercase tracking-wider">
                The Problem
              </span>
              <h2 className="text-3xl lg:text-4xl font-bold mt-4 mb-6">
                DAO Governance is Broken
              </h2>
              <div className="space-y-4 text-dark-400">
                <p>
                  Current DAO voting systems are vulnerable to Sybil attacks where 
                  malicious actors create multiple accounts to gain disproportionate 
                  voting power.
                </p>
                <p>
                  Token-weighted voting leads to plutocracy where the wealthy 
                  control governance outcomes, leaving regular participants powerless.
                </p>
                <p>
                  Existing identity solutions sacrifice privacy, requiring users to 
                  link their real-world identity to their on-chain activity.
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="relative"
            >
              <div className="glass-card p-8">
                <div className="space-y-6">
                  {[
                    { icon: '🤖', text: 'Sybil attacks manipulate vote outcomes' },
                    { icon: '💰', text: 'Whales dominate governance decisions' },
                    { icon: '👁️', text: 'Privacy is sacrificed for verification' },
                    { icon: '🔗', text: 'Identity tied to on-chain activity' },
                  ].map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-4 p-4 bg-dark-800/50 rounded-lg border border-dark-700/50"
                    >
                      <span className="text-2xl">{item.icon}</span>
                      <span className="text-dark-300">{item.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* Solution Section */}
      {/* ================================================================== */}
      <section className="py-20 lg:py-32 border-t border-dark-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className="text-accent-500 font-semibold text-sm uppercase tracking-wider">
              The Solution
            </span>
            <h2 className="text-3xl lg:text-4xl font-bold mt-4 mb-6">
              Privacy-First Sybil Resistance
            </h2>
            <p className="text-dark-400 max-w-2xl mx-auto">
              SybilShield combines zero-knowledge proofs with human verification 
              to enable truly fair and private DAO governance.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                className="glass-card p-6 hover-lift"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="w-12 h-12 rounded-xl bg-accent-500/10 flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-accent-500" />
                </div>
                <h3 className="text-lg font-semibold text-dark-100 mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-dark-400">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* How It Works Section */}
      {/* ================================================================== */}
      <section id="how-it-works" className="py-20 lg:py-32 border-t border-dark-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className="text-accent-500 font-semibold text-sm uppercase tracking-wider">
              How It Works
            </span>
            <h2 className="text-3xl lg:text-4xl font-bold mt-4 mb-6">
              Three Simple Steps
            </h2>
            <p className="text-dark-400 max-w-2xl mx-auto">
              Get verified, receive your badge, and start voting - all while 
              maintaining complete privacy.
            </p>
          </motion.div>

          <div className="relative">
            {/* Connection line */}
            <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-accent-500/50 via-primary-500/50 to-accent-500/50 -translate-y-1/2" />

            <div className="grid lg:grid-cols-3 gap-8 relative">
              {howItWorks.map((step, index) => (
                <motion.div
                  key={step.step}
                  className="relative"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.2 }}
                >
                  <div className="glass-card p-8 text-center relative z-10">
                    {/* Step number */}
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-accent-500 to-primary-500 flex items-center justify-center mx-auto mb-6 shadow-glow">
                      <step.icon className="h-8 w-8 text-white" />
                    </div>
                    
                    <div className="text-accent-500 font-semibold text-sm mb-2">
                      Step {step.step}
                    </div>
                    
                    <h3 className="text-xl font-semibold text-dark-100 mb-3">
                      {step.title}
                    </h3>
                    
                    <p className="text-dark-400 text-sm">
                      {step.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* CTA Section */}
      {/* ================================================================== */}
      <section className="py-20 lg:py-32 border-t border-dark-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="glass-card p-8 lg:p-12 text-center relative overflow-hidden"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            {/* Background glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-accent-500/10 via-transparent to-primary-500/10" />
            
            <div className="relative z-10">
              <div className="w-16 h-16 rounded-full bg-accent-500/10 flex items-center justify-center mx-auto mb-6">
                <LockClosedIcon className="h-8 w-8 text-accent-500" />
              </div>
              
              <h2 className="text-3xl lg:text-4xl font-bold mb-4">
                Ready to Vote <span className="text-gradient">Privately</span>?
              </h2>
              
              <p className="text-dark-400 max-w-lg mx-auto mb-8">
                Join the movement for fair, private, and Sybil-resistant DAO governance. 
                Get your SybilShield badge today.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/badge" className="btn-glow inline-flex items-center justify-center gap-2">
                  Get Started
                  <ArrowRightIcon className="h-4 w-4" />
                </Link>
                <Link 
                  href="https://github.com/sybilshield" 
                  target="_blank"
                  className="btn-secondary inline-flex items-center justify-center gap-2"
                >
                  View on GitHub
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
