import { getSupabaseClient } from './supabase';
import type { User, Session } from '@supabase/supabase-js';

export interface BookClubUser {
  id: string;
  discordId: string;
  displayName: string;
  email: string;
  emailVerified: boolean;
  avatarUrl?: string;
  createdAt: string;
  readingGoal?: number;
  passwordSet?: boolean;
}

// Sign in with Discord OAuth
export async function signInWithDiscord(): Promise<{ error: Error | null }> {
  const client = getSupabaseClient();
  if (!client) return { error: new Error('Supabase not configured') };

  const { error } = await client.auth.signInWithOAuth({
    provider: 'discord',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
      scopes: 'identify email',
    },
  });

  return { error: error ? new Error(error.message) : null };
}

// Sign out
export async function signOut(): Promise<{ error: Error | null }> {
  const client = getSupabaseClient();
  if (!client) return { error: new Error('Supabase not configured') };

  const { error } = await client.auth.signOut();
  return { error: error ? new Error(error.message) : null };
}

// Get current session
export async function getSession(): Promise<Session | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  const { data: { session } } = await client.auth.getSession();
  return session;
}

// Get current Supabase auth user
export async function getAuthUser(): Promise<User | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  const { data: { user } } = await client.auth.getUser();
  return user;
}

// Get or create BookClub user profile from database
export async function getBookClubUser(authUserId: string): Promise<BookClubUser | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  const { data, error } = await client
    .from('users')
    .select('*')
    .eq('id', authUserId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching user:', error);
    return null;
  }

  if (!data) return null;

  return {
    id: data.id,
    discordId: data.discord_id,
    displayName: data.display_name,
    email: data.email,
    emailVerified: data.email_verified || false,
    avatarUrl: data.avatar_url,
    createdAt: data.joined_at,
    readingGoal: data.reading_goal || undefined,
    passwordSet: data.password_set || false,
  };
}

// Create a new BookClub user profile
export async function createBookClubUser(params: {
  id: string;
  discordId: string;
  displayName: string;
  email: string;
  avatarUrl?: string;
}): Promise<BookClubUser | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  const { data, error } = await client
    .from('users')
    .insert({
      id: params.id,
      discord_id: params.discordId,
      display_name: params.displayName,
      email: params.email,
      avatar_url: params.avatarUrl,
      email_verified: false,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating user:', error);
    return null;
  }

  return {
    id: data.id,
    discordId: data.discord_id,
    displayName: data.display_name,
    email: data.email,
    emailVerified: data.email_verified || false,
    avatarUrl: data.avatar_url,
    createdAt: data.joined_at,
  };
}

// Update user profile
export async function updateBookClubUser(
  userId: string,
  updates: Partial<{ displayName: string; email: string; avatarUrl: string; emailVerified: boolean; readingGoal: number }>
): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  const dbUpdates: Record<string, unknown> = {};
  if (updates.displayName !== undefined) dbUpdates.display_name = updates.displayName;
  if (updates.email !== undefined) dbUpdates.email = updates.email;
  if (updates.avatarUrl !== undefined) dbUpdates.avatar_url = updates.avatarUrl;
  if (updates.emailVerified !== undefined) dbUpdates.email_verified = updates.emailVerified;
  if (updates.readingGoal !== undefined) dbUpdates.reading_goal = updates.readingGoal;

  const { error } = await client
    .from('users')
    .update(dbUpdates)
    .eq('id', userId);

  if (error) {
    console.error('Error updating user:', error);
    return false;
  }

  return true;
}

// Check if display name is available
export async function isDisplayNameAvailable(displayName: string, excludeUserId?: string): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  let query = client
    .from('users')
    .select('id')
    .ilike('display_name', displayName);

  if (excludeUserId) {
    query = query.neq('id', excludeUserId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error checking display name:', error);
    return false;
  }

  return !data || data.length === 0;
}

// Subscribe to auth state changes
export function onAuthStateChange(callback: (session: Session | null) => void): () => void {
  const client = getSupabaseClient();
  if (!client) return () => {};

  const { data: { subscription } } = client.auth.onAuthStateChange((_event, session) => {
    callback(session);
  });

  return () => {
    subscription.unsubscribe();
  };
}

// Sign in with email and password
export async function signInWithEmail(email: string, password: string): Promise<{ error: Error | null }> {
  const client = getSupabaseClient();
  if (!client) return { error: new Error('Supabase not configured') };

  const { error } = await client.auth.signInWithPassword({
    email,
    password,
  });

  return { error: error ? new Error(error.message) : null };
}

// Set password for existing user (used after Discord OAuth signup)
export async function setUserPassword(password: string): Promise<{ error: Error | null }> {
  const client = getSupabaseClient();
  if (!client) return { error: new Error('Supabase not configured') };

  const { error } = await client.auth.updateUser({
    password,
  });

  if (!error) {
    // Mark password as set in our users table
    const user = await getAuthUser();
    if (user) {
      await client
        .from('users')
        .update({ password_set: true })
        .eq('id', user.id);
    }
  }

  return { error: error ? new Error(error.message) : null };
}

// Request password reset email
export async function resetPassword(email: string): Promise<{ error: Error | null }> {
  const client = getSupabaseClient();
  if (!client) return { error: new Error('Supabase not configured') };

  const { error } = await client.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/callback`,
  });

  return { error: error ? new Error(error.message) : null };
}
