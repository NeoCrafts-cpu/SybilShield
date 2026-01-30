'use client';

// ============================================================================
// SybilShield Frontend - Create Proposal Modal Component
// ============================================================================

import { useState, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import {
  XMarkIcon,
  DocumentPlusIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';
import type { ProposalFormData } from '@/types';

// ============================================================================
// Props
// ============================================================================

interface CreateProposalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (title: string, description: string, duration: number) => Promise<void>;
}

// ============================================================================
// Duration Options
// ============================================================================

const durationOptions = [
  { value: 3, label: '3 days' },
  { value: 7, label: '7 days' },
  { value: 14, label: '14 days' },
  { value: 30, label: '30 days' },
];

// ============================================================================
// Create Proposal Modal Component
// ============================================================================

export default function CreateProposalModal({
  isOpen,
  onClose,
  onSubmit,
}: CreateProposalModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<ProposalFormData>({
    defaultValues: {
      duration: 7,
    },
  });

  const description = watch('description', '');
  const charCount = description.length;
  const maxChars = 1000;

  // Handle form submission
  const handleFormSubmit = async (data: ProposalFormData) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data.title, data.description, data.duration);
      reset();
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle close
  const handleClose = () => {
    if (!isSubmitting) {
      reset();
      onClose();
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
        {/* Backdrop */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" />
        </Transition.Child>

        {/* Modal container */}
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-lg glass-card p-6 relative">
                {/* Close button */}
                <button
                  onClick={handleClose}
                  className="absolute top-4 right-4 p-2 rounded-lg text-dark-400 hover:text-dark-200 hover:bg-dark-700 transition-colors"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>

                {/* Header */}
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-accent-500/10 flex items-center justify-center">
                    <DocumentPlusIcon className="h-6 w-6 text-accent-500" />
                  </div>
                  <div>
                    <Dialog.Title className="text-xl font-bold text-dark-100">
                      Create Proposal
                    </Dialog.Title>
                    <p className="text-sm text-dark-400">
                      Submit a new proposal for the community
                    </p>
                  </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit(handleFormSubmit)}>
                  {/* Title */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-dark-200 mb-2">
                      Title <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Enter a clear, descriptive title"
                      className={`input-field ${errors.title ? 'border-red-500' : ''}`}
                      {...register('title', {
                        required: 'Title is required',
                        minLength: {
                          value: 10,
                          message: 'Title must be at least 10 characters',
                        },
                        maxLength: {
                          value: 100,
                          message: 'Title must be less than 100 characters',
                        },
                      })}
                    />
                    {errors.title && (
                      <p className="mt-2 text-sm text-red-400 flex items-center gap-1">
                        <ExclamationCircleIcon className="h-4 w-4" />
                        {errors.title.message}
                      </p>
                    )}
                  </div>

                  {/* Description */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-dark-200 mb-2">
                      Description <span className="text-red-400">*</span>
                    </label>
                    <textarea
                      rows={5}
                      placeholder="Describe your proposal in detail. What problem does it solve? How will it be implemented?"
                      className={`input-field resize-none ${errors.description ? 'border-red-500' : ''}`}
                      {...register('description', {
                        required: 'Description is required',
                        minLength: {
                          value: 50,
                          message: 'Description must be at least 50 characters',
                        },
                        maxLength: {
                          value: maxChars,
                          message: `Description must be less than ${maxChars} characters`,
                        },
                      })}
                    />
                    <div className="flex justify-between mt-2">
                      {errors.description ? (
                        <p className="text-sm text-red-400 flex items-center gap-1">
                          <ExclamationCircleIcon className="h-4 w-4" />
                          {errors.description.message}
                        </p>
                      ) : (
                        <span />
                      )}
                      <span className={`text-sm ${charCount > maxChars ? 'text-red-400' : 'text-dark-500'}`}>
                        {charCount}/{maxChars}
                      </span>
                    </div>
                  </div>

                  {/* Duration */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-dark-200 mb-2">
                      Voting Duration
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {durationOptions.map((option) => (
                        <label
                          key={option.value}
                          className="relative flex items-center justify-center"
                        >
                          <input
                            type="radio"
                            value={option.value}
                            className="peer sr-only"
                            {...register('duration')}
                          />
                          <span className="w-full py-2 px-3 rounded-lg text-sm text-center cursor-pointer bg-dark-800 border border-dark-600 text-dark-300 peer-checked:bg-accent-500/10 peer-checked:border-accent-500/50 peer-checked:text-accent-400 hover:bg-dark-700 transition-colors">
                            {option.label}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={handleClose}
                      disabled={isSubmitting}
                      className="btn-secondary flex-1"
                    >
                      Cancel
                    </button>
                    <motion.button
                      type="submit"
                      disabled={isSubmitting}
                      className="btn-glow flex-1 inline-flex items-center justify-center gap-2"
                      whileTap={{ scale: 0.98 }}
                    >
                      {isSubmitting ? (
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
                          Creating...
                        </>
                      ) : (
                        'Create Proposal'
                      )}
                    </motion.button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
