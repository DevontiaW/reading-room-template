'use client';

import { motion } from 'framer-motion';
import { AppModeInfo } from '@/lib/types';

interface DrawButtonProps {
  mode: AppModeInfo | null;
  onClick: () => void;
  isLoading?: boolean;
  disabled?: boolean;
}

export function DrawButton({ mode, onClick, isLoading, disabled }: DrawButtonProps) {
  const isDecisionRequired = mode?.mode === 'decision_required';
  const isSeriesLock = mode?.mode === 'series_lock';

  const buttonText = isDecisionRequired
    ? 'Decision Required'
    : isSeriesLock
    ? 'Reveal Next Book'
    : 'Draw Next Book';

  const buttonStyle = isDecisionRequired
    ? 'from-gray-600 to-gray-700 cursor-not-allowed opacity-50'
    : isSeriesLock
    ? 'from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500'
    : 'from-primary to-accent hover:from-primary-dark hover:to-purple-700';

  return (
    <motion.button
      onClick={onClick}
      disabled={disabled || isLoading || isDecisionRequired}
      whileHover={!disabled && !isDecisionRequired ? { scale: 1.02 } : {}}
      whileTap={!disabled && !isDecisionRequired ? { scale: 0.98 } : {}}
      className={`
        w-full py-5 px-8 rounded-2xl font-bold text-xl text-white
        bg-gradient-to-r ${buttonStyle}
        shadow-lg shadow-primary/25
        transition-all duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        flex items-center justify-center gap-3
      `}
    >
      {isLoading ? (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
          className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full"
        />
      ) : (
        <>
          {!isDecisionRequired && (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isSeriesLock ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              )}
            </svg>
          )}
          {buttonText}
        </>
      )}
    </motion.button>
  );
}
