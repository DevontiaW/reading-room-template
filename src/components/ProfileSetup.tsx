'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import type { User } from '@supabase/supabase-js';
import { createBookClubUser, isDisplayNameAvailable } from '@/lib/auth';
import { notifyMemberJoined } from '@/lib/notifications';

interface ProfileSetupProps {
  authUser: User;
  onComplete: () => void;
  onSignOut: () => void;
}

export function ProfileSetup({ authUser, onComplete, onSignOut }: ProfileSetupProps) {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState(authUser.email || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get Discord info from auth user metadata
  const discordUsername = authUser.user_metadata?.full_name || authUser.user_metadata?.name || '';
  const discordAvatar = authUser.user_metadata?.avatar_url || '';
  const discordId = authUser.user_metadata?.provider_id || authUser.id;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedName = displayName.trim();
    const trimmedEmail = email.trim();

    // Validation
    if (!trimmedName) {
      setError('Please enter a display name');
      return;
    }

    if (trimmedName.length < 2) {
      setError('Display name must be at least 2 characters');
      return;
    }

    if (trimmedName.length > 30) {
      setError('Display name must be 30 characters or less');
      return;
    }

    if (!trimmedEmail) {
      setError('Email is required');
      return;
    }

    if (!trimmedEmail.includes('@')) {
      setError('Please enter a valid email');
      return;
    }

    setIsLoading(true);

    // Check if name is available
    const nameAvailable = await isDisplayNameAvailable(trimmedName);
    if (!nameAvailable) {
      setError('That name is already taken. Try another!');
      setIsLoading(false);
      return;
    }

    // Create the user profile
    const user = await createBookClubUser({
      id: authUser.id,
      discordId: discordId,
      displayName: trimmedName,
      email: trimmedEmail,
      avatarUrl: discordAvatar,
    });

    if (!user) {
      setError('Failed to create profile. Please try again.');
      setIsLoading(false);
      return;
    }

    // Notify Discord of new member
    notifyMemberJoined({
      displayName: trimmedName,
      avatarUrl: discordAvatar,
    });

    onComplete();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-900 via-stone-900 to-stone-950 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full"
      >
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Welcome to the Club!</h1>
          <p className="text-gray-400">Let's set up your profile</p>
        </div>

        {/* Profile Card */}
        <div className="bg-stone-800/50 backdrop-blur rounded-2xl p-6 sm:p-8 border border-stone-700/50">
          {/* Discord Info */}
          <div className="flex items-center gap-4 mb-6 p-4 bg-stone-700/30 rounded-xl">
            {discordAvatar ? (
              <img
                src={discordAvatar}
                alt="Discord avatar"
                className="w-14 h-14 rounded-full ring-2 ring-primary/50"
              />
            ) : (
              <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="text-2xl">👤</span>
              </div>
            )}
            <div>
              <p className="text-white font-medium">{discordUsername || 'Discord User'}</p>
              <p className="text-xs text-gray-400 flex items-center gap-1">
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.04.001-.088-.041-.104a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>
                </svg>
                Connected via Discord
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Display Name */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                What should we call you?
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your display name"
                className="w-full bg-stone-700/50 border border-stone-600/50 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-primary min-h-[48px]"
                autoFocus
                maxLength={30}
              />
              <p className="text-xs text-gray-500 mt-1">
                This is how you'll appear in the book club
              </p>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Your email <span className="text-primary">*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full bg-stone-700/50 border border-stone-600/50 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-primary min-h-[48px]"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                For notifications and account recovery
              </p>
            </div>

            {/* Error */}
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-primary hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition-colors min-h-[56px] flex items-center justify-center"
            >
              {isLoading ? (
                <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                'Join the Club'
              )}
            </button>
          </form>

          {/* Sign out option */}
          <button
            onClick={onSignOut}
            className="w-full mt-4 py-2 text-gray-500 hover:text-gray-300 text-sm transition-colors"
          >
            Use a different Discord account
          </button>
        </div>
      </motion.div>
    </div>
  );
}
