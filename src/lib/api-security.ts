/**
 * API Security Hardening
 *
 * Defense-in-depth measures to protect APIs from abuse,
 * even when endpoints are discovered.
 *
 * "Security through obscurity is no security at all,
 *  but security through authentication, rate limiting,
 *  and input validation is EOD-grade protection." - The Sapper Way
 */

import { NextRequest, NextResponse } from 'next/server';

/**
 * Security headers to add to all API responses
 * These tell browsers and bots to behave
 */
export const SECURITY_HEADERS = {
  // Prevent caching of authenticated responses
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  'Pragma': 'no-cache',
  'Expires': '0',

  // Prevent MIME type sniffing
  'X-Content-Type-Options': 'nosniff',

  // Prevent embedding in iframes (clickjacking protection)
  'X-Frame-Options': 'DENY',

  // Enable browser XSS filter
  'X-XSS-Protection': '1; mode=block',

  // Don't send referrer to other origins
  'Referrer-Policy': 'strict-origin-when-cross-origin',
};

/**
 * Validate that request is from a legitimate source
 * Not foolproof, but raises the bar for casual attackers
 */
export function validateRequestOrigin(request: NextRequest): boolean {
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');

  // Allow requests with no origin (same-origin requests, curl for testing)
  if (!origin && !referer) {
    return true;
  }

  // Get allowed origins from env or default to production domain
  const allowedOrigins = [
    process.env.NEXT_PUBLIC_APP_URL,
    'http://localhost:3000',
    'http://localhost:3001',
  ].filter(Boolean);

  // Check origin header
  if (origin && allowedOrigins.some(allowed => origin.startsWith(allowed!))) {
    return true;
  }

  // Check referer header
  if (referer && allowedOrigins.some(allowed => referer.startsWith(allowed!))) {
    return true;
  }

  return false;
}

/**
 * Check for common attack patterns in request
 */
export function detectSuspiciousRequest(request: NextRequest): {
  suspicious: boolean;
  reason?: string;
} {
  const userAgent = request.headers.get('user-agent') || '';
  const url = request.url;

  // Block common vulnerability scanners
  const scannerPatterns = [
    /sqlmap/i,
    /nikto/i,
    /nessus/i,
    /nmap/i,
    /masscan/i,
    /nuclei/i,
    /burp/i,
    /zap/i,
    /acunetix/i,
  ];

  for (const pattern of scannerPatterns) {
    if (pattern.test(userAgent)) {
      return { suspicious: true, reason: 'Scanner detected' };
    }
  }

  // Check for SQL injection attempts in URL
  const sqlPatterns = [
    /(\%27)|(\')|(\-\-)|(\%23)|(#)/i,
    /((\%3D)|(=))[^\n]*((\%27)|(\')|(\-\-)|(\%3B)|(;))/i,
    /\w*((\%27)|(\'))((\%6F)|o|(\%4F))((\%72)|r|(\%52))/i,
    /((\%27)|(\'))union/i,
  ];

  for (const pattern of sqlPatterns) {
    if (pattern.test(url)) {
      return { suspicious: true, reason: 'SQL injection attempt' };
    }
  }

  // Check for XSS attempts in URL
  const xssPatterns = [
    /((\%3C)|<)((\%2F)|\/)*[a-z0-9\%]+((\%3E)|>)/i,
    /((\%3C)|<)((\%69)|i|(\%49))((\%6D)|m|(\%4D))((\%67)|g|(\%47))[^\n]+((\%3E)|>)/i,
    /javascript:/i,
    /vbscript:/i,
    /onload=/i,
    /onerror=/i,
  ];

  for (const pattern of xssPatterns) {
    if (pattern.test(url)) {
      return { suspicious: true, reason: 'XSS attempt' };
    }
  }

  return { suspicious: false };
}

/**
 * Create a secure API response with all security headers
 */
export function secureResponse(
  data: unknown,
  options: { status?: number; headers?: Record<string, string> } = {}
): NextResponse {
  return NextResponse.json(data, {
    status: options.status || 200,
    headers: {
      ...SECURITY_HEADERS,
      ...options.headers,
    },
  });
}

/**
 * Create an error response that doesn't leak sensitive info
 */
export function secureErrorResponse(
  message: string,
  status: number = 400
): NextResponse {
  // Generic error messages for sensitive statuses
  const safeMessages: Record<number, string> = {
    401: 'Authentication required',
    403: 'Access denied',
    404: 'Not found',
    500: 'Internal server error',
  };

  return NextResponse.json(
    { error: safeMessages[status] || message },
    {
      status,
      headers: SECURITY_HEADERS,
    }
  );
}

/**
 * Middleware-style security check for API routes
 * Returns an error response if the request fails security checks
 */
export function securityCheck(request: NextRequest): NextResponse | null {
  // Check origin for non-GET requests
  if (request.method !== 'GET') {
    if (!validateRequestOrigin(request)) {
      console.warn('API request from unauthorized origin:', {
        origin: request.headers.get('origin'),
        referer: request.headers.get('referer'),
        url: request.url,
      });
      // Don't block, just log - origin can be spoofed anyway
    }
  }

  // Check for attack patterns
  const { suspicious, reason } = detectSuspiciousRequest(request);
  if (suspicious) {
    console.error('Suspicious request blocked:', {
      reason,
      url: request.url,
      userAgent: request.headers.get('user-agent'),
      ip: request.headers.get('x-forwarded-for') || 'unknown',
    });
    // Return generic 404 to not reveal we detected the attack
    return secureErrorResponse('Not found', 404);
  }

  return null; // Request passed security checks
}

/**
 * Log security event for audit trail
 */
export function logSecurityEvent(
  event: string,
  details: Record<string, unknown>
): void {
  console.log(JSON.stringify({
    type: 'SECURITY_EVENT',
    event,
    timestamp: new Date().toISOString(),
    ...details,
  }));
}
