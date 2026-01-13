'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getRoomPasscode, setRoomPasscode } from '@/lib/room';

interface PasscodePromptProps {
  onAuthenticated: () => void;
}

export function PasscodePrompt({ onAuthenticated }: PasscodePromptProps) {
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  // Check if passcode is already stored and valid
  useEffect(() => {
    async function checkExisting() {
      const stored = getRoomPasscode();
      if (stored) {
        // Test with a simple state fetch
        try {
          const res = await fetch('/api/state', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-room-passcode': stored,
            },
            body: JSON.stringify({}), // Empty update just to test
          });

          // If we get 401, passcode is wrong
          // If we get other error or success, passcode is valid (or not required)
          if (res.status !== 401) {
            onAuthenticated();
            return;
          }
        } catch {
          // Network error - proceed offline
          onAuthenticated();
          return;
        }
      }

      // Also check if passcode is even required
      try {
        const res = await fetch('/api/state');
        if (res.ok) {
          // API works, try a POST without passcode
          const postRes = await fetch('/api/state', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({}),
          });

          // If POST works without passcode, no passcode required
          if (postRes.status !== 401) {
            onAuthenticated();
            return;
          }
        }
      } catch {
        // Offline mode
        onAuthenticated();
        return;
      }

      setIsChecking(false);
    }

    checkExisting();
  }, [onAuthenticated]);

  const handleSubmit = async () => {
    if (!passcode.trim()) {
      setError('Please enter a passcode');
      return;
    }

    setError(null);

    // Test the passcode
    try {
      const res = await fetch('/api/state', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-room-passcode': passcode.trim(),
        },
        body: JSON.stringify({}),
      });

      if (res.status === 401) {
        setError('Invalid passcode');
        return;
      }

      // Success - save and proceed
      setRoomPasscode(passcode.trim());
      onAuthenticated();
    } catch {
      setError('Could not verify passcode');
    }
  };

  if (isChecking) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900"
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          className="bg-slate-800 rounded-3xl p-8 max-w-md w-full border border-white/10 shadow-2xl"
        >
          <div className="text-center mb-6">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">C&W Book Club</h2>
            <p className="text-gray-400">Enter the room passcode to continue</p>
          </div>

          <div className="space-y-4">
            <input
              type="password"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              placeholder="Room passcode"
              className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-primary text-center text-lg"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSubmit();
                }
              }}
            />

            {error && (
              <p className="text-red-400 text-sm text-center">{error}</p>
            )}

            <button
              onClick={handleSubmit}
              className="w-full py-4 bg-gradient-to-r from-primary to-accent hover:from-primary-dark hover:to-purple-700 text-white rounded-xl font-semibold transition-all"
            >
              Enter
            </button>

            <p className="text-xs text-gray-500 text-center">
              Ask your book club friend for the passcode
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
