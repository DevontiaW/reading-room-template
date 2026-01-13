/**
 * Input sanitization utilities
 *
 * SECURITY: Sanitize user-provided data before storing to prevent XSS attacks.
 * This is especially important for data from external APIs (like Open Library).
 */

/**
 * Sanitize a string to prevent XSS attacks
 * Removes/escapes potentially dangerous HTML characters
 */
export function sanitizeString(input: string | undefined | null): string {
  if (!input) return '';

  return input
    // Remove any script tags and their content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Remove event handlers
    .replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '')
    // Escape HTML entities
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    // Limit length to prevent DoS
    .slice(0, 1000);
}

/**
 * Sanitize a URL to ensure it's safe
 * Only allows http/https URLs
 */
export function sanitizeUrl(url: string | undefined | null): string | null {
  if (!url) return null;

  try {
    const parsed = new URL(url);
    // Only allow http and https protocols
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null;
    }
    // Return the sanitized URL
    return parsed.href;
  } catch {
    return null;
  }
}

/**
 * Sanitize an array of strings (like genres)
 */
export function sanitizeStringArray(arr: string[] | undefined | null): string[] {
  if (!arr || !Array.isArray(arr)) return [];

  return arr
    .filter((item): item is string => typeof item === 'string')
    .map(sanitizeString)
    .filter(item => item.length > 0)
    .slice(0, 10); // Limit array size
}

/**
 * Sanitize book data from Open Library or user input
 */
export function sanitizeBookData(data: {
  title?: string;
  author?: string;
  coverUrl?: string;
  genres?: string[];
}): {
  title: string;
  author: string;
  coverUrl: string | null;
  genres: string[];
} {
  return {
    title: sanitizeString(data.title) || 'Untitled',
    author: sanitizeString(data.author) || 'Unknown Author',
    coverUrl: sanitizeUrl(data.coverUrl),
    genres: sanitizeStringArray(data.genres),
  };
}

/**
 * Validate and sanitize a UUID
 */
export function sanitizeUuid(id: string | undefined | null): string | null {
  if (!id) return null;

  // UUID v4 format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  if (uuidRegex.test(id)) {
    return id.toLowerCase();
  }

  return null;
}

/**
 * Sanitize a number within bounds
 */
export function sanitizeNumber(
  value: number | string | undefined | null,
  min: number,
  max: number,
  defaultValue: number
): number {
  if (value === undefined || value === null) return defaultValue;

  const num = typeof value === 'string' ? parseInt(value, 10) : value;

  if (isNaN(num)) return defaultValue;

  return Math.max(min, Math.min(max, num));
}
