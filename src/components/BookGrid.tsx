'use client';

import { Book, AppState } from '@/lib/types';
import { BookCard } from './BookCard';

interface BookGridProps {
  books: Book[];
  state: AppState | null;
  onComplete?: (bookId: string) => void;
}

export function BookGrid({ books, state, onComplete }: BookGridProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {books.map((book) => (
        <BookCard
          key={book.id}
          book={book}
          state={state}
          onComplete={onComplete}
          size="md"
        />
      ))}
    </div>
  );
}
