'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Book, AppState } from '@/lib/types';
import { getBookEligibility, getSeriesProgress } from '@/lib/picker';
import { getBookCover, getPlaceholderCover } from '@/lib/covers';

interface BookCardProps {
  book: Book;
  state: AppState | null;
  isRevealed?: boolean;
  onComplete?: (bookId: string) => void;
  size?: 'sm' | 'md' | 'lg';
}

export function BookCard({ book, state, isRevealed = false, onComplete, size = 'md' }: BookCardProps) {
  const [coverError, setCoverError] = useState(false);
  const eligibility = state ? getBookEligibility(book, state) : { eligible: true, reason: '' };
  const isCompleted = state?.completedBookIds.includes(book.id);
  const seriesProgress = book.series && state
    ? getSeriesProgress([], state, book.series.name)
    : null;

  const sizeStyles = {
    sm: 'p-3',
    md: 'p-5',
    lg: 'p-6',
  };

  const titleStyles = {
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-xl',
  };

  const coverSizes = {
    sm: 'w-16 h-24',
    md: 'w-20 h-30',
    lg: 'w-24 h-36',
  };

  return (
    <motion.div
      initial={isRevealed ? { rotateY: -90, scale: 0.9, opacity: 0 } : false}
      animate={{ rotateY: 0, scale: 1, opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className={`
        relative bg-white/5 backdrop-blur-lg rounded-2xl ${sizeStyles[size]}
        border border-white/10 overflow-hidden
        ${isCompleted ? 'opacity-60' : ''}
        ${!eligibility.eligible && !isCompleted ? 'opacity-40' : ''}
        hover:bg-white/10 transition-all duration-200
      `}
    >
      {/* Completed badge */}
      {isCompleted && (
        <div className="absolute top-3 right-3 bg-emerald-500 text-white text-xs font-bold px-2 py-1 rounded-full z-20">
          DONE
        </div>
      )}

      {/* Ineligible overlay */}
      {!eligibility.eligible && !isCompleted && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm z-10">
          <span className="text-xs text-gray-400 px-3 py-1 bg-black/50 rounded-full">
            {eligibility.reason}
          </span>
        </div>
      )}

      <Link href={`/book/${book.id}`} className="block">
        <div className="flex gap-4">
          {/* Book Cover */}
          <div className={`${coverSizes[size]} flex-shrink-0 rounded-lg overflow-hidden bg-gray-800`}>
            <img
              src={coverError ? getPlaceholderCover() : getBookCover(book, 'M')}
              alt={`Cover of ${book.title}`}
              className="w-full h-full object-cover"
              onError={() => setCoverError(true)}
            />
          </div>

          {/* Book Info */}
          <div className="flex-1 min-w-0">
            <h3 className={`${titleStyles[size]} font-bold text-white mb-1 pr-8`}>
              {book.title}
            </h3>
            <p className="text-gray-400 text-sm mb-2">by {book.author}</p>

            {/* Genres */}
            <div className="flex flex-wrap gap-1 mb-2">
              {book.genres.slice(0, 3).map((genre) => (
                <span
                  key={genre}
                  className="text-xs px-2 py-0.5 bg-primary/20 text-primary rounded-full"
                >
                  {genre}
                </span>
              ))}
            </div>

            {/* Series info */}
            {book.series && (
              <div className="flex items-center gap-2 text-sm flex-wrap">
                <span className="text-indigo-400">
                  {book.series.name}
                </span>
                <span className="text-gray-500">
                  Book {book.series.order} of {book.series.total}
                </span>
                {seriesProgress && seriesProgress.status !== 'unstarted' && (
                  <span className={`
                    text-xs px-2 py-0.5 rounded-full
                    ${seriesProgress.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' : ''}
                    ${seriesProgress.status === 'paused' ? 'bg-amber-500/20 text-amber-400' : ''}
                    ${seriesProgress.status === 'dropped' ? 'bg-red-500/20 text-red-400' : ''}
                  `}>
                    {seriesProgress.status.toUpperCase()}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </Link>

      {/* Complete button */}
      {onComplete && !isCompleted && eligibility.eligible && (
        <button
          onClick={(e) => {
            e.preventDefault();
            onComplete(book.id);
          }}
          className="mt-4 w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium transition-colors"
        >
          Mark Complete
        </button>
      )}
    </motion.div>
  );
}
