'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseClient } from '@/lib/supabase';

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const handleCallback = async () => {
      const client = getSupabaseClient();
      if (!client) {
        router.push('/?error=no_client');
        return;
      }

      // The hash fragment contains the tokens from Discord OAuth
      // Supabase client automatically handles this
      const { error } = await client.auth.getSession();

      if (error) {
        console.error('Auth callback error:', error);
        router.push('/?error=auth_failed');
        return;
      }

      // Redirect to home - the auth hook will handle the rest
      router.push('/');
    };

    handleCallback();
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-900 via-stone-900 to-stone-950 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-gray-400">Signing you in...</p>
      </div>
    </div>
  );
}
