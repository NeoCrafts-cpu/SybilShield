'use client';

// ============================================================================
// SybilShield Frontend - Step Indicator Component
// ============================================================================

import { motion } from 'framer-motion';
import { CheckIcon } from '@heroicons/react/24/solid';

// ============================================================================
// Props
// ============================================================================

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  steps: string[];
}

// ============================================================================
// Step Indicator Component
// ============================================================================

export default function StepIndicator({ currentStep, totalSteps, steps }: StepIndicatorProps) {
  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="relative flex items-center justify-between">
        {/* Progress line background */}
        <div className="absolute top-5 left-0 right-0 h-0.5 bg-dark-700" />
        
        {/* Progress line filled */}
        <motion.div
          className="absolute top-5 left-0 h-0.5 bg-gradient-to-r from-accent-500 to-primary-500"
          initial={{ width: '0%' }}
          animate={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
        />

        {/* Steps */}
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isComplete = stepNumber < currentStep;
          const isActive = stepNumber === currentStep;

          return (
            <div key={step} className="relative flex flex-col items-center z-10">
              {/* Step circle */}
              <motion.div
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                  isComplete
                    ? 'bg-green-500 text-white'
                    : isActive
                    ? 'bg-gradient-to-br from-accent-500 to-primary-500 text-white shadow-glow'
                    : 'bg-dark-800 text-dark-500 border border-dark-600'
                }`}
                initial={false}
                animate={{
                  scale: isActive ? 1.1 : 1,
                }}
                transition={{ duration: 0.2 }}
              >
                {isComplete ? (
                  <CheckIcon className="h-5 w-5" />
                ) : (
                  <span className="text-sm font-bold">{stepNumber}</span>
                )}
              </motion.div>

              {/* Step label */}
              <motion.span
                className={`mt-3 text-sm font-medium ${
                  isComplete || isActive ? 'text-dark-100' : 'text-dark-500'
                }`}
                initial={false}
                animate={{
                  opacity: isActive ? 1 : 0.7,
                }}
              >
                {step}
              </motion.span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
