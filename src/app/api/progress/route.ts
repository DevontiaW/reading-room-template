import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuthenticatedUser } from '@/lib/api-auth';
import { sanitizeString, sanitizeNumber } from '@/lib/sanitize';
import {
  checkRateLimit,
  createRateLimitKey,
  getRateLimitHeaders,
  rateLimitExceededResponse,
  RATE_LIMITS,
} from '@/lib/rate-limit';
import {
  securityCheck,
  SECURITY_HEADERS,
  logSecurityEvent,
} from '@/lib/api-security';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

function getSupabase() {
  return createClient(supabaseUrl, supabaseKey);
}

// GET /api/progress?bookId=xxx - Get all members' progress for a book
export async function GET(request: NextRequest) {
  // Security check - block scanners and attack attempts
  const securityError = securityCheck(request);
  if (securityError) return securityError;

  // Rate limiting for reads
  const rateLimitKey = createRateLimitKey(request, 'progress:get');
  const rateLimitResult = checkRateLimit(rateLimitKey, RATE_LIMITS.read);

  if (!rateLimitResult.success) {
    return rateLimitExceededResponse(rateLimitResult);
  }

  const supabase = getSupabase();
  const { searchParams } = new URL(request.url);
  const bookId = sanitizeString(searchParams.get('bookId'));

  if (!bookId) {
    return NextResponse.json(
      { error: 'Missing bookId' },
      { status: 400, headers: getRateLimitHeaders(rateLimitResult) }
    );
  }

  // Get progress with user info
  const { data: progress, error } = await supabase
    .from('reading_progress')
    .select(`
      *,
      users:user_id (display_name, avatar_url)
    `)
    .eq('book_id', bookId);

  if (error) {
    console.error('Error fetching progress:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500, headers: getRateLimitHeaders(rateLimitResult) }
    );
  }

  // Transform the data
  const transformed = progress?.map(p => ({
    id: p.id,
    userId: p.user_id,
    bookId: p.book_id,
    currentChapter: p.current_chapter,
    totalChapters: p.total_chapters,
    updatedAt: p.updated_at,
    userName: p.users?.display_name || 'Unknown',
    userAvatar: p.users?.avatar_url,
  }));

  return NextResponse.json(
    { data: transformed },
    { headers: getRateLimitHeaders(rateLimitResult) }
  );
}

// POST /api/progress - Update reading progress
export async function POST(request: NextRequest) {
  // Security check - block scanners and attack attempts
  const securityError = securityCheck(request);
  if (securityError) return securityError;

  // SECURITY: Get authenticated user from session, NOT from request body
  const user = await getAuthenticatedUser(request);

  if (!user) {
    logSecurityEvent('UNAUTHORIZED_PROGRESS_UPDATE', {
      ip: request.headers.get('x-forwarded-for') || 'unknown',
    });
    return NextResponse.json(
      { error: 'Unauthorized - please sign in to track progress' },
      { status: 401, headers: SECURITY_HEADERS }
    );
  }

  // Rate limiting for writes
  const rateLimitKey = createRateLimitKey(request, 'progress:post', user.id);
  const rateLimitResult = checkRateLimit(rateLimitKey, RATE_LIMITS.standard);

  if (!rateLimitResult.success) {
    return rateLimitExceededResponse(rateLimitResult);
  }

  const supabase = getSupabase();

  try {
    const body = await request.json();

    // SECURITY: Sanitize inputs
    const bookId = sanitizeString(body.bookId);
    const currentChapter = sanitizeNumber(body.currentChapter, 1, 999, 1);
    const totalChapters = sanitizeNumber(body.totalChapters, 1, 999, 20);

    if (!bookId) {
      return NextResponse.json(
        { error: 'Missing bookId' },
        { status: 400, headers: getRateLimitHeaders(rateLimitResult) }
      );
    }

    // Upsert progress using AUTHENTICATED user's ID
    const { data, error } = await supabase
      .from('reading_progress')
      .upsert(
        {
          user_id: user.id, // From session, NOT request body
          book_id: bookId,
          current_chapter: currentChapter,
          total_chapters: totalChapters,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id,book_id',
        }
      )
      .select()
      .single();

    if (error) {
      console.error('Error updating progress:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500, headers: getRateLimitHeaders(rateLimitResult) }
      );
    }

    return NextResponse.json(
      { data },
      { headers: getRateLimitHeaders(rateLimitResult) }
    );
  } catch (err) {
    console.error('Error in POST /api/progress:', err);
    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400, headers: getRateLimitHeaders(rateLimitResult) }
    );
  }
}
