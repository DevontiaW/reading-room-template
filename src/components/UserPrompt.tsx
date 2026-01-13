'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface UserPromptProps {
  isOpen: boolean;
  onSetName: (name: string) => void;
}

export function UserPrompt({ isOpen, onSetName }: UserPromptProps) {
  const [name, setName] = useState('');

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="bg-slate-900 rounded-3xl p-8 max-w-md w-full border border-white/10 shadow-2xl"
          >
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Welcome to Book Club!</h2>
              <p className="text-gray-400">
                Enter your display name to track your picks and leave remarks.
              </p>
            </div>

            <div className="space-y-4">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name (e.g., Cam, Will)"
                className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-primary text-center text-lg"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && name.trim()) {
                    onSetName(name.trim());
                  }
                }}
              />

              <button
                onClick={() => name.trim() && onSetName(name.trim())}
                disabled={!name.trim()}
                className="w-full py-4 bg-gradient-to-r from-primary to-accent hover:from-primary-dark hover:to-purple-700 text-white rounded-xl font-semibold disabled:opacity-50 transition-all"
              >
                Let&apos;s Go!
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
