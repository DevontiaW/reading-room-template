/**
 * Server-side authentication utilities for API routes
 *
 * SECURITY: These functions verify the user's session server-side,
 * preventing userId spoofing attacks where clients send arbitrary userIds.
 */

import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export interface AuthenticatedUser {
  id: string;
  email?: string;
  displayName?: string;
  avatarUrl?: string;
}

/**
 * Get the authenticated user from the request cookies.
 * Returns null if not authenticated.
 *
 * IMPORTANT: Always use this instead of trusting userId from request body!
 */
export async function getAuthenticatedUser(request: NextRequest): Promise<AuthenticatedUser | null> {
  try {
    // Get the access token from cookies
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('sb-access-token')?.value
      || cookieStore.get(`sb-${new URL(supabaseUrl).hostname.split('.')[0]}-auth-token`)?.value;

    // Also check for the auth token in the standard Supabase cookie format
    const allCookies = cookieStore.getAll();
    let authCookie = allCookies.find(c => c.name.includes('auth-token'));

    if (!authCookie && !accessToken) {
      // Try to get from Authorization header as fallback
      const authHeader = request.headers.get('Authorization');
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.slice(7);
        return await verifyToken(token);
      }
      return null;
    }

    // Parse the auth cookie if it's JSON (Supabase stores it as JSON)
    let token = accessToken;
    if (authCookie?.value) {
      try {
        const parsed = JSON.parse(authCookie.value);
        token = parsed.access_token || parsed[0]?.access_token;
      } catch {
        token = authCookie.value;
      }
    }

    if (!token) return null;

    return await verifyToken(token);
  } catch (error) {
    console.error('Auth verification error:', error);
    return null;
  }
}

/**
 * Verify a JWT token and return the user
 */
async function verifyToken(token: string): Promise<AuthenticatedUser | null> {
  const supabase = createClient(supabaseUrl, supabaseKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });

  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    return null;
  }

  // Get additional user info from our users table
  const { data: profile } = await supabase
    .from('users')
    .select('display_name, avatar_url')
    .eq('id', user.id)
    .single();

  return {
    id: user.id,
    email: user.email,
    displayName: profile?.display_name,
    avatarUrl: profile?.avatar_url,
  };
}

/**
 * Create a Supabase client with the user's session
 * This ensures RLS policies work correctly
 */
export function createAuthenticatedClient(token?: string) {
  if (token) {
    return createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });
  }
  return createClient(supabaseUrl, supabaseKey);
}

/**
 * Helper to require authentication and return error response if not authenticated
 */
export async function requireAuth(request: NextRequest): Promise<
  { user: AuthenticatedUser; error: null } |
  { user: null; error: Response }
> {
  const user = await getAuthenticatedUser(request);

  if (!user) {
    return {
      user: null,
      error: new Response(
        JSON.stringify({ error: 'Unauthorized - please sign in' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      ),
    };
  }

  return { user, error: null };
}
