'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/lib/hooks/useAuth';
import { updateBookClubUser } from '@/lib/auth';
import { notifyReadingGoalSet } from '@/lib/notifications';

export function ReadingGoalBanner() {
  const { status, user, refreshUser } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  const [goal, setGoal] = useState('12');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Don't show if not authenticated or if user already has a goal
  if (status !== 'authenticated' || !user || user.readingGoal) {
    return null;
  }

  const handleSetGoal = async () => {
    const goalNum = parseInt(goal, 10);

    if (isNaN(goalNum) || goalNum < 1) {
      setError('Please enter a valid number');
      return;
    }

    if (goalNum > 100) {
      setError("That's ambitious! Max is 100 books");
      return;
    }

    setIsSaving(true);
    setError(null);

    const success = await updateBookClubUser(user.id, { readingGoal: goalNum });

    if (!success) {
      setError('Failed to save. Please try again.');
      setIsSaving(false);
      return;
    }

    // Notify Discord
    notifyReadingGoalSet({
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      goal: goalNum,
    });

    await refreshUser();
    setIsSaving(false);
  };

  const presetGoals = [6, 12, 24, 52];

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-primary/20 via-amber-600/20 to-primary/20 border-b border-primary/30"
    >
      <div className="max-w-6xl mx-auto px-4 py-3">
        <AnimatePresence mode="wait">
          {!isExpanded ? (
            <motion.div
              key="collapsed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">🎯</span>
                <div>
                  <p className="text-white font-medium text-sm sm:text-base">
                    Set your 2026 reading goal!
                  </p>
                  <p className="text-gray-400 text-xs sm:text-sm hidden sm:block">
                    How many books do you want to read this year?
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsExpanded(true)}
                className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg font-medium text-sm transition-colors min-h-[44px] whitespace-nowrap"
              >
                Set Goal
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="expanded"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🎯</span>
                  <p className="text-white font-medium text-sm sm:text-base">
                    How many books will you read in 2026?
                  </p>
                </div>
                <button
                  onClick={() => setIsExpanded(false)}
                  className="text-gray-400 hover:text-white p-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Preset buttons */}
              <div className="flex flex-wrap gap-2">
                {presetGoals.map((preset) => (
                  <button
                    key={preset}
                    onClick={() => setGoal(preset.toString())}
                    className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors min-h-[44px] ${
                      goal === preset.toString()
                        ? 'bg-primary text-white'
                        : 'bg-white/10 text-gray-300 hover:bg-white/20'
                    }`}
                  >
                    {preset} books
                    <span className="text-xs text-gray-400 ml-1">
                      ({preset === 6 ? 'casual' : preset === 12 ? '1/mo' : preset === 24 ? '2/mo' : '1/wk'})
                    </span>
                  </button>
                ))}
              </div>

              {/* Custom input */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 flex-1">
                  <span className="text-gray-400 text-sm">Or custom:</span>
                  <input
                    type="number"
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                    min="1"
                    max="100"
                    className="w-20 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-center font-medium focus:outline-none focus:border-primary min-h-[44px]"
                  />
                  <span className="text-gray-400 text-sm">books</span>
                </div>
                <button
                  onClick={handleSetGoal}
                  disabled={isSaving}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg font-medium text-sm transition-colors min-h-[44px]"
                >
                  {isSaving ? 'Saving...' : 'Save Goal'}
                </button>
              </div>

              {error && (
                <p className="text-red-400 text-sm">{error}</p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
