/**
 * Simple in-memory rate limiting for API routes
 *
 * SECURITY: Prevents abuse by limiting requests per IP/user.
 * Note: This is per-instance, so it resets on deploy. For production scale,
 * use Redis or Vercel's Edge Config.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// In-memory store (per serverless instance)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt < now) {
      rateLimitStore.delete(key);
    }
  }
}, 60000); // Clean every minute

export interface RateLimitConfig {
  /** Maximum requests allowed in the window */
  limit: number;
  /** Time window in milliseconds */
  windowMs: number;
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
}

/**
 * Check and update rate limit for a key (usually IP or userId)
 */
export function checkRateLimit(
  key: string,
  config: RateLimitConfig = { limit: 30, windowMs: 60000 }
): RateLimitResult {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  // If no entry or window expired, create new entry
  if (!entry || entry.resetAt < now) {
    const newEntry: RateLimitEntry = {
      count: 1,
      resetAt: now + config.windowMs,
    };
    rateLimitStore.set(key, newEntry);

    return {
      success: true,
      limit: config.limit,
      remaining: config.limit - 1,
      resetAt: newEntry.resetAt,
    };
  }

  // Increment count
  entry.count++;
  rateLimitStore.set(key, entry);

  // Check if over limit
  if (entry.count > config.limit) {
    return {
      success: false,
      limit: config.limit,
      remaining: 0,
      resetAt: entry.resetAt,
    };
  }

  return {
    success: true,
    limit: config.limit,
    remaining: config.limit - entry.count,
    resetAt: entry.resetAt,
  };
}

/**
 * Get the client IP from a request
 */
export function getClientIp(request: Request): string {
  // Check various headers that might contain the real IP
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    // x-forwarded-for can contain multiple IPs, take the first one
    return forwardedFor.split(',')[0].trim();
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  // Vercel-specific header
  const vercelIp = request.headers.get('x-vercel-forwarded-for');
  if (vercelIp) {
    return vercelIp.split(',')[0].trim();
  }

  // Fallback
  return 'unknown';
}

/**
 * Create a rate limit key combining IP and optional user ID
 * This prevents both anonymous abuse and authenticated user abuse
 */
export function createRateLimitKey(
  request: Request,
  endpoint: string,
  userId?: string
): string {
  const ip = getClientIp(request);
  const userPart = userId ? `:user:${userId}` : '';
  return `${endpoint}:${ip}${userPart}`;
}

/**
 * Apply rate limiting and return appropriate response headers
 */
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': result.resetAt.toString(),
  };
}

/**
 * Create a rate limit exceeded response
 */
export function rateLimitExceededResponse(result: RateLimitResult): Response {
  return new Response(
    JSON.stringify({
      error: 'Too many requests. Please try again later.',
      retryAfter: Math.ceil((result.resetAt - Date.now()) / 1000),
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        ...getRateLimitHeaders(result),
        'Retry-After': Math.ceil((result.resetAt - Date.now()) / 1000).toString(),
      },
    }
  );
}

// Preset configurations for different endpoints
export const RATE_LIMITS = {
  // Standard API calls
  standard: { limit: 30, windowMs: 60000 }, // 30 per minute

  // More restrictive for write operations
  write: { limit: 10, windowMs: 60000 }, // 10 per minute

  // Very restrictive for expensive operations
  expensive: { limit: 5, windowMs: 60000 }, // 5 per minute

  // Relaxed for read operations
  read: { limit: 60, windowMs: 60000 }, // 60 per minute
} as const;
