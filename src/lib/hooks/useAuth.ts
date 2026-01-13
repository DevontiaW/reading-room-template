'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import {
  getSession,
  getAuthUser,
  getBookClubUser,
  onAuthStateChange,
  signInWithDiscord,
  signOut as authSignOut,
  type BookClubUser,
} from '../auth';

export type AuthStatus = 'loading' | 'unauthenticated' | 'needs_profile' | 'authenticated';

interface UseAuthReturn {
  status: AuthStatus;
  session: Session | null;
  authUser: User | null;
  user: BookClubUser | null;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [session, setSession] = useState<Session | null>(null);
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [user, setUser] = useState<BookClubUser | null>(null);

  // Load user profile from database
  const loadUserProfile = useCallback(async (authUserId: string) => {
    const profile = await getBookClubUser(authUserId);
    setUser(profile);

    if (profile && profile.emailVerified) {
      setStatus('authenticated');
    } else if (profile && !profile.emailVerified) {
      // Has profile but email not verified - still allow in for now
      setStatus('authenticated');
    } else {
      // No profile yet - needs to complete setup
      setStatus('needs_profile');
    }
  }, []);

  // Initialize auth state
  useEffect(() => {
    let mounted = true;

    async function init() {
      const currentSession = await getSession();
      const currentUser = await getAuthUser();

      if (!mounted) return;

      setSession(currentSession);
      setAuthUser(currentUser);

      if (currentUser) {
        await loadUserProfile(currentUser.id);
      } else {
        setStatus('unauthenticated');
      }
    }

    init();

    // Subscribe to auth changes
    const unsubscribe = onAuthStateChange(async (newSession) => {
      if (!mounted) return;

      setSession(newSession);

      if (newSession?.user) {
        setAuthUser(newSession.user);
        await loadUserProfile(newSession.user.id);
      } else {
        setAuthUser(null);
        setUser(null);
        setStatus('unauthenticated');
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [loadUserProfile]);

  const signIn = useCallback(async () => {
    const { error } = await signInWithDiscord();
    if (error) {
      console.error('Sign in error:', error);
    }
  }, []);

  const signOut = useCallback(async () => {
    await authSignOut();
    setSession(null);
    setAuthUser(null);
    setUser(null);
    setStatus('unauthenticated');
  }, []);

  const refreshUser = useCallback(async () => {
    if (authUser) {
      await loadUserProfile(authUser.id);
    }
  }, [authUser, loadUserProfile]);

  return {
    status,
    session,
    authUser,
    user,
    signIn,
    signOut,
    refreshUser,
  };
}
