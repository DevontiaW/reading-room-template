import { Book } from './types';

// Custom local covers for books that don't have Open Library images
const CUSTOM_COVERS: Record<string, string> = {
  'standalone_we_dont_talk_about_carol': '/covers/we-dont-talk-about-carol.webp',
};

// ISBN overrides for books where title lookup returns wrong cover (e.g., same title, different author)
const ISBN_OVERRIDES: Record<string, string> = {
  'standalone_the_widow': '9780385548984', // John Grisham 2025, not Fiona Barton 2016
};

/**
 * Get book cover URL using Open Library API (free, no key needed)
 * Falls back to a placeholder if not found
 */
export function getBookCover(book: Book, size: 'S' | 'M' | 'L' = 'M'): string {
  // Check for custom local cover first
  if (CUSTOM_COVERS[book.id]) {
    return CUSTOM_COVERS[book.id];
  }

  // Check for ISBN override (more accurate for common titles)
  if (ISBN_OVERRIDES[book.id]) {
    return `https://covers.openlibrary.org/b/isbn/${ISBN_OVERRIDES[book.id]}-${size}.jpg`;
  }

  // Open Library covers by title - works for most books
  const encodedTitle = encodeURIComponent(book.title);
  return `https://covers.openlibrary.org/b/title/${encodedTitle}-${size}.jpg`;
}

/**
 * Get placeholder for when cover fails to load
 */
export function getPlaceholderCover(): string {
  return '/placeholder-book.svg';
}

/**
 * Check if an image URL is valid (use in onError handler)
 */
export function handleCoverError(
  event: React.SyntheticEvent<HTMLImageElement>,
  fallback?: string
): void {
  const img = event.currentTarget;
  img.src = fallback || getPlaceholderCover();
  img.onerror = null; // Prevent infinite loop
}
