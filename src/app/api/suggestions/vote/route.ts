import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuthenticatedUser } from '@/lib/api-auth';
import { sanitizeUuid } from '@/lib/sanitize';
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

// POST /api/suggestions/vote - Toggle vote on a suggestion
export async function POST(request: NextRequest) {
  // Security check - block scanners and attack attempts
  const securityError = securityCheck(request);
  if (securityError) return securityError;

  // SECURITY: Get authenticated user from session, NOT from request body
  const user = await getAuthenticatedUser(request);

  if (!user) {
    logSecurityEvent('UNAUTHORIZED_VOTE_ATTEMPT', {
      ip: request.headers.get('x-forwarded-for') || 'unknown',
    });
    return NextResponse.json(
      { error: 'Unauthorized - please sign in to vote' },
      { status: 401, headers: SECURITY_HEADERS }
    );
  }

  // Rate limiting for votes (prevents vote manipulation attacks)
  const rateLimitKey = createRateLimitKey(request, 'suggestions:vote', user.id);
  const rateLimitResult = checkRateLimit(rateLimitKey, RATE_LIMITS.write);

  if (!rateLimitResult.success) {
    return rateLimitExceededResponse(rateLimitResult);
  }

  const supabase = getSupabase();

  try {
    const body = await request.json();

    // SECURITY: Sanitize and validate suggestionId
    const suggestionId = sanitizeUuid(body.suggestionId);

    if (!suggestionId) {
      return NextResponse.json(
        { error: 'Invalid suggestion ID' },
        { status: 400, headers: getRateLimitHeaders(rateLimitResult) }
      );
    }

    // Verify the suggestion exists
    const { data: suggestion, error: fetchError } = await supabase
      .from('book_suggestions')
      .select('id')
      .eq('id', suggestionId)
      .single();

    if (fetchError || !suggestion) {
      return NextResponse.json(
        { error: 'Suggestion not found' },
        { status: 404, headers: getRateLimitHeaders(rateLimitResult) }
      );
    }

    // Check if user already voted (using session userId)
    const { data: existingVote } = await supabase
      .from('suggestion_votes')
      .select('id')
      .eq('suggestion_id', suggestionId)
      .eq('user_id', user.id) // From session, NOT request body
      .single();

    if (existingVote) {
      // Remove vote (toggle off)
      const { error } = await supabase
        .from('suggestion_votes')
        .delete()
        .eq('id', existingVote.id);

      if (error) {
        return NextResponse.json(
          { error: error.message },
          { status: 500, headers: getRateLimitHeaders(rateLimitResult) }
        );
      }

      return NextResponse.json(
        { voted: false, message: 'Vote removed' },
        { headers: getRateLimitHeaders(rateLimitResult) }
      );
    } else {
      // Add vote using session userId
      const { error } = await supabase
        .from('suggestion_votes')
        .insert({
          suggestion_id: suggestionId,
          user_id: user.id, // From session, NOT request body
        });

      if (error) {
        return NextResponse.json(
          { error: error.message },
          { status: 500, headers: getRateLimitHeaders(rateLimitResult) }
        );
      }

      return NextResponse.json(
        { voted: true, message: 'Vote added' },
        { headers: getRateLimitHeaders(rateLimitResult) }
      );
    }
  } catch (err) {
    console.error('Error in POST /api/suggestions/vote:', err);
    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400, headers: getRateLimitHeaders(rateLimitResult) }
    );
  }
}
