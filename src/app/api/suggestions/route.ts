import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuthenticatedUser } from '@/lib/api-auth';
import { sanitizeBookData, sanitizeUuid } from '@/lib/sanitize';
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

// GET /api/suggestions - Get all suggestions with vote counts
export async function GET(request: NextRequest) {
  // Security check - block scanners and attack attempts
  const securityError = securityCheck(request);
  if (securityError) return securityError;

  // Rate limiting for reads
  const rateLimitKey = createRateLimitKey(request, 'suggestions:get');
  const rateLimitResult = checkRateLimit(rateLimitKey, RATE_LIMITS.read);

  if (!rateLimitResult.success) {
    return rateLimitExceededResponse(rateLimitResult);
  }

  const supabase = getSupabase();

  const { data: suggestions, error } = await supabase
    .from('book_suggestions')
    .select(`
      *,
      suggestion_votes (user_id)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching suggestions:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500, headers: getRateLimitHeaders(rateLimitResult) }
    );
  }

  // Transform to include vote count and voter IDs
  const transformed = suggestions?.map(s => ({
    id: s.id,
    title: s.title,
    author: s.author,
    coverUrl: s.cover_url,
    genres: s.genres,
    suggestedBy: s.suggested_by_name,
    suggestedById: s.suggested_by,
    suggestedAt: s.created_at,
    votes: s.suggestion_votes?.map((v: { user_id: string }) => v.user_id) || [],
  }));

  return NextResponse.json(
    { data: transformed },
    { headers: getRateLimitHeaders(rateLimitResult) }
  );
}

// POST /api/suggestions - Add a new suggestion
export async function POST(request: NextRequest) {
  // Security check - block scanners and attack attempts
  const securityError = securityCheck(request);
  if (securityError) return securityError;

  // SECURITY: Get authenticated user from session, NOT from request body
  const user = await getAuthenticatedUser(request);

  if (!user) {
    logSecurityEvent('UNAUTHORIZED_SUGGESTION_ATTEMPT', {
      ip: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent'),
    });
    return NextResponse.json(
      { error: 'Unauthorized - please sign in' },
      { status: 401, headers: SECURITY_HEADERS }
    );
  }

  // Rate limiting for writes (more restrictive)
  const rateLimitKey = createRateLimitKey(request, 'suggestions:post', user.id);
  const rateLimitResult = checkRateLimit(rateLimitKey, RATE_LIMITS.write);

  if (!rateLimitResult.success) {
    return rateLimitExceededResponse(rateLimitResult);
  }

  const supabase = getSupabase();

  try {
    const body = await request.json();

    // SECURITY: Sanitize all input data
    const sanitized = sanitizeBookData({
      title: body.title,
      author: body.author,
      coverUrl: body.coverUrl,
      genres: body.genres,
    });

    if (!sanitized.title || sanitized.title === 'Untitled') {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400, headers: getRateLimitHeaders(rateLimitResult) }
      );
    }

    // Check if already suggested (case-insensitive)
    const { data: existing } = await supabase
      .from('book_suggestions')
      .select('id')
      .ilike('title', sanitized.title)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'This book has already been suggested' },
        { status: 409, headers: getRateLimitHeaders(rateLimitResult) }
      );
    }

    // Insert suggestion using AUTHENTICATED user's ID
    const { data: suggestion, error: insertError } = await supabase
      .from('book_suggestions')
      .insert({
        title: sanitized.title,
        author: sanitized.author,
        cover_url: sanitized.coverUrl,
        genres: sanitized.genres,
        suggested_by: user.id, // From session, NOT request body
        suggested_by_name: user.displayName || 'Anonymous',
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting suggestion:', insertError);
      return NextResponse.json(
        { error: insertError.message },
        { status: 500, headers: getRateLimitHeaders(rateLimitResult) }
      );
    }

    // Auto-vote for own suggestion
    await supabase
      .from('suggestion_votes')
      .insert({
        suggestion_id: suggestion.id,
        user_id: user.id, // From session
      });

    return NextResponse.json(
      { data: suggestion },
      { headers: getRateLimitHeaders(rateLimitResult) }
    );
  } catch (err) {
    console.error('Error in POST /api/suggestions:', err);
    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400, headers: getRateLimitHeaders(rateLimitResult) }
    );
  }
}

// DELETE /api/suggestions?id=xxx - Remove a suggestion
export async function DELETE(request: NextRequest) {
  // Security check - block scanners and attack attempts
  const securityError = securityCheck(request);
  if (securityError) return securityError;

  // SECURITY: Get authenticated user from session
  const user = await getAuthenticatedUser(request);

  if (!user) {
    logSecurityEvent('UNAUTHORIZED_DELETE_ATTEMPT', {
      ip: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent'),
    });
    return NextResponse.json(
      { error: 'Unauthorized - please sign in' },
      { status: 401, headers: SECURITY_HEADERS }
    );
  }

  // Rate limiting
  const rateLimitKey = createRateLimitKey(request, 'suggestions:delete', user.id);
  const rateLimitResult = checkRateLimit(rateLimitKey, RATE_LIMITS.write);

  if (!rateLimitResult.success) {
    return rateLimitExceededResponse(rateLimitResult);
  }

  const supabase = getSupabase();
  const { searchParams } = new URL(request.url);
  const id = sanitizeUuid(searchParams.get('id'));

  if (!id) {
    return NextResponse.json(
      { error: 'Invalid suggestion ID' },
      { status: 400, headers: getRateLimitHeaders(rateLimitResult) }
    );
  }

  // Verify ownership using session user ID
  const { data: suggestion } = await supabase
    .from('book_suggestions')
    .select('suggested_by')
    .eq('id', id)
    .single();

  if (!suggestion) {
    return NextResponse.json(
      { error: 'Suggestion not found' },
      { status: 404, headers: getRateLimitHeaders(rateLimitResult) }
    );
  }

  // SECURITY: Compare against session user ID, not request param
  if (suggestion.suggested_by !== user.id) {
    return NextResponse.json(
      { error: 'Not authorized - you can only delete your own suggestions' },
      { status: 403, headers: getRateLimitHeaders(rateLimitResult) }
    );
  }

  const { error } = await supabase
    .from('book_suggestions')
    .delete()
    .eq('id', id);

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500, headers: getRateLimitHeaders(rateLimitResult) }
    );
  }

  return NextResponse.json(
    { success: true },
    { headers: getRateLimitHeaders(rateLimitResult) }
  );
}
