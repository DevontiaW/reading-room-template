'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { signInWithEmail, resetPassword } from '@/lib/auth';

interface LoginScreenProps {
  onSignIn: () => Promise<void>;
}

export function LoginScreen({ onSignIn }: LoginScreenProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showEmailLogin, setShowEmailLogin] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);

  const handleSignIn = async () => {
    setIsLoading(true);
    try {
      await onSignIn();
    } catch (error) {
      console.error('Sign in failed:', error);
      setIsLoading(false);
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const { error } = await signInWithEmail(email, password);

    if (error) {
      setError(error.message);
      setIsLoading(false);
      return;
    }

    // Success - page will redirect via auth state change
  };

  const handleResetPassword = async () => {
    if (!email) {
      setError('Enter your email first');
      return;
    }

    setIsLoading(true);
    const { error } = await resetPassword(email);
    setIsLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    setResetSent(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-900 via-stone-900 to-stone-950 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full"
      >
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary to-amber-800 flex items-center justify-center shadow-lg shadow-primary/20">
            <span className="text-4xl">📚</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">C&W Book Club</h1>
          <p className="text-gray-400">
            Track reads, share thoughts, pick adventures together.
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-stone-800/50 backdrop-blur rounded-2xl p-6 sm:p-8 border border-stone-700/50">
          {!showEmailLogin ? (
            <>
              <div className="text-center mb-6">
                <h2 className="text-xl font-semibold text-white mb-2">Join the Club</h2>
                <p className="text-sm text-gray-400">
                  Sign in with Discord to get started
                </p>
              </div>

              <button
                onClick={handleSignIn}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-[#5865F2] hover:bg-[#4752C4] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition-colors min-h-[56px]"
              >
                {isLoading ? (
                  <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  <>
                    {/* Discord Icon */}
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                    </svg>
                    Continue with Discord
                  </>
                )}
              </button>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-stone-700"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-stone-800/50 text-gray-500">or</span>
                </div>
              </div>

              <button
                onClick={() => setShowEmailLogin(true)}
                className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-stone-700 hover:bg-stone-600 text-white rounded-xl font-semibold transition-colors min-h-[56px]"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Sign in with Email
              </button>

              <p className="text-xs text-gray-500 text-center mt-4">
                By signing in, you agree to be an awesome book club member.
              </p>
            </>
          ) : (
            <>
              <div className="text-center mb-6">
                <h2 className="text-xl font-semibold text-white mb-2">Sign in with Email</h2>
                <p className="text-sm text-gray-400">
                  Use your email and password
                </p>
              </div>

              {resetSent ? (
                <div className="text-center p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                  <p className="text-emerald-400">Password reset email sent! Check your inbox.</p>
                  <button
                    onClick={() => { setResetSent(false); setShowEmailLogin(false); }}
                    className="mt-3 text-gray-400 hover:text-white text-sm"
                  >
                    Back to login
                  </button>
                </div>
              ) : (
                <form onSubmit={handleEmailSignIn} className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="w-full bg-stone-700/50 border border-stone-600/50 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-primary min-h-[48px]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Password</label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Your password"
                      className="w-full bg-stone-700/50 border border-stone-600/50 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-primary min-h-[48px]"
                      required
                    />
                  </div>

                  {error && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                      <p className="text-sm text-red-400">{error}</p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-4 bg-primary hover:bg-primary-dark disabled:opacity-50 text-white rounded-xl font-semibold transition-colors min-h-[56px]"
                  >
                    {isLoading ? (
                      <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full mx-auto" />
                    ) : (
                      'Sign In'
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleResetPassword}
                    className="w-full text-gray-400 hover:text-white text-sm py-2"
                  >
                    Forgot password?
                  </button>
                </form>
              )}

              <button
                onClick={() => { setShowEmailLogin(false); setError(null); }}
                className="w-full mt-4 text-gray-500 hover:text-gray-300 text-sm"
              >
                ← Back to Discord login
              </button>
            </>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-600 mt-6">
          A private club for Cameron & Will · Est. 2026
        </p>
      </motion.div>
    </div>
  );
}
