'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Book } from '@/lib/types';
import { getBookCover, getPlaceholderCover } from '@/lib/covers';

interface BookPreviewCardProps {
  book: Book;
  isCompleted?: boolean;
  isCurrent?: boolean;
  index?: number;
}

export function BookPreviewCard({ book, isCompleted, isCurrent, index = 0 }: BookPreviewCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [coverError, setCoverError] = useState(false);

  return (
    <div
      className="relative group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Book Cover */}
      <Link href={`/book/${book.id}`}>
        <motion.div
          className={`relative aspect-[2/3] rounded-xl overflow-hidden bg-charcoal shadow-lg cursor-pointer
            ${isCurrent ? 'ring-2 ring-brass shadow-brass/30' : ''}
            ${isCompleted ? 'ring-2 ring-library-green' : ''}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05, duration: 0.4 }}
          whileHover={{ scale: 1.05, y: -5 }}
        >
          <img
            src={coverError ? getPlaceholderCover() : getBookCover(book, 'M')}
            alt={book.title}
            className="w-full h-full object-cover"
            onError={() => setCoverError(true)}
          />

          {/* Status badges */}
          {isCurrent && (
            <div className="absolute top-2 left-2 bg-brass text-walnut text-[10px] font-bold px-2 py-1 rounded-full">
              NOW
            </div>
          )}
          {isCompleted && (
            <div className="absolute top-2 right-2 bg-library-green text-white text-[10px] font-bold px-2 py-1 rounded-full">
              ✓
            </div>
          )}

          {/* Series badge */}
          {book.series && (
            <div className="absolute bottom-2 left-2 bg-walnut/90 text-brass text-[10px] px-2 py-1 rounded-full backdrop-blur-sm">
              {book.series.order}/{book.series.total}
            </div>
          )}
        </motion.div>
      </Link>

      {/* Info Bubble - appears on hover */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, y: 5, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute left-1/2 -translate-x-1/2 bottom-full mb-3 z-50 pointer-events-none"
          >
            <div className="bg-walnut border border-brass/30 rounded-lg p-2 shadow-xl shadow-black/40 min-w-[140px] max-w-[180px]">
              {/* Arrow pointing down */}
              <div className="absolute left-1/2 -translate-x-1/2 -bottom-1.5 w-3 h-3 bg-walnut border-r border-b border-brass/30 rotate-45" />

              {/* Content */}
              <h4 className="font-semibold text-cream text-xs leading-tight mb-0.5 line-clamp-2">
                {book.title}
              </h4>
              <p className="text-cream/50 text-[10px]">{book.author}</p>

              {/* Series info */}
              {book.series && (
                <p className="text-electric-light text-[9px] mt-1">
                  {book.series.name} #{book.series.order}
                </p>
              )}

              {/* Genres */}
              {book.genres.length > 0 && (
                <div className="flex flex-wrap gap-0.5 mt-1.5 pt-1.5 border-t border-bronze/20">
                  {book.genres.slice(0, 2).map((genre) => (
                    <span
                      key={genre}
                      className="text-[8px] px-1 py-0.5 bg-bronze/30 text-cream/50 rounded"
                    >
                      {genre}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Horizontal scroll row - spaced out for better hover experience
interface BookRowProps {
  title: string;
  books: Book[];
  completedIds?: string[];
  currentId?: string;
  icon?: string;
}

export function BookRow({ title, books, completedIds = [], currentId, icon = '📚' }: BookRowProps) {
  if (books.length === 0) {
    return (
      <div className="mb-12">
        <h2 className="text-xl sm:text-2xl font-bold text-cream mb-4 flex items-center gap-2">
          <span>{icon}</span> {title}
        </h2>
        <div className="py-8 text-center">
          <p className="text-cream/55 italic">No books in this collection yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-12">
      <h2 className="text-xl sm:text-2xl font-bold text-cream mb-4 flex items-center gap-2">
        <span>{icon}</span> {title}
      </h2>
      {/* Outer wrapper allows vertical overflow for tooltips */}
      <div className="relative -mx-2 px-2" style={{ overflow: 'visible' }}>
        {/* Scroll container - uses clip for x-axis only via style */}
        <div
          className="flex gap-6 sm:gap-8 pb-4 pt-48 -mt-44 px-2 scrollbar-hide scroll-smooth"
          style={{ overflowX: 'auto', overflowY: 'visible' }}
        >
          {books.map((book, i) => (
            <div key={book.id} className="flex-shrink-0 w-32 sm:w-40">
              <BookPreviewCard
                book={book}
                isCompleted={completedIds.includes(book.id)}
                isCurrent={currentId === book.id}
                index={i}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
