'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { BookGrid } from '@/components/BookGrid';
import { useAppState } from '@/lib/hooks/useAppState';
import { Book } from '@/lib/types';
import { getBookCover, getPlaceholderCover } from '@/lib/covers';
import booksData from '../../../data/books.json';

const books: Book[] = booksData as Book[];

type FilterStatus = 'all' | 'remaining' | 'completed';
type FilterType = 'all' | 'standalone' | 'series';
type ViewMode = 'covers' | 'list';

export default function BooksPage() {
  const { state, completeBook, isLoading } = useAppState(books);
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [typeFilter, setTypeFilter] = useState<FilterType>('all');
  const [genreFilter, setGenreFilter] = useState<string>('all');
  const [seriesFilter, setSeriesFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('covers');
  const [showFilters, setShowFilters] = useState(false);

  // Get unique genres and series
  const allGenres = useMemo(() => {
    const genres = new Set<string>();
    books.forEach(b => b.genres.forEach(g => genres.add(g)));
    return Array.from(genres).sort();
  }, []);

  const allSeries = useMemo(() => {
    const series = new Set<string>();
    books.forEach(b => {
      if (b.series) series.add(b.series.name);
    });
    return Array.from(series).sort();
  }, []);

  // Filter books
  const filteredBooks = useMemo(() => {
    return books.filter(book => {
      // Status filter
      const isCompleted = state?.completedBookIds.includes(book.id);
      if (statusFilter === 'remaining' && isCompleted) return false;
      if (statusFilter === 'completed' && !isCompleted) return false;

      // Type filter
      if (typeFilter === 'standalone' && book.series) return false;
      if (typeFilter === 'series' && !book.series) return false;

      // Genre filter
      if (genreFilter !== 'all' && !book.genres.includes(genreFilter)) return false;

      // Series filter
      if (seriesFilter !== 'all') {
        if (!book.series || book.series.name !== seriesFilter) return false;
      }

      return true;
    });
  }, [state, statusFilter, typeFilter, genreFilter, seriesFilter]);

  // Stats
  const completedCount = state?.completedBookIds.length || 0;
  const hasActiveFilters = statusFilter !== 'all' || typeFilter !== 'all' || genreFilter !== 'all' || seriesFilter !== 'all';

  const clearFilters = () => {
    setStatusFilter('all');
    setTypeFilter('all');
    setGenreFilter('all');
    setSeriesFilter('all');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-walnut text-cream">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-walnut text-cream">
      <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <Link href="/" className="text-primary hover:text-primary/80 text-sm mb-2 inline-flex items-center gap-1 min-h-[44px]">
              ← Home
            </Link>
            <h1 className="text-2xl sm:text-4xl font-bold text-white">📖 Library</h1>
            <p className="text-cream/60 text-sm sm:text-base mt-1">
              {completedCount}/{books.length} read
            </p>
          </div>

          {/* View Toggle + Filter Button (mobile) */}
          <div className="flex items-center gap-2">
            {/* Mobile filter toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`sm:hidden px-4 py-2 rounded-xl text-sm font-medium transition-colors min-h-[44px] ${
                showFilters || hasActiveFilters ? 'bg-primary text-white' : 'bg-bronze/30 text-cream/60'
              }`}
            >
              Filters {hasActiveFilters && `(${[statusFilter, typeFilter, genreFilter, seriesFilter].filter(f => f !== 'all').length})`}
            </button>

            {/* View Toggle */}
            <div className="flex bg-bronze/30 rounded-xl p-1">
              <button
                onClick={() => setViewMode('covers')}
                className={`px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-colors min-h-[40px] ${
                  viewMode === 'covers' ? 'bg-primary text-white' : 'text-cream/60 hover:text-white'
                }`}
              >
                Grid
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-colors min-h-[40px] ${
                  viewMode === 'list' ? 'bg-primary text-white' : 'text-cream/60 hover:text-white'
                }`}
              >
                List
              </button>
            </div>
          </div>
        </div>

        {/* Filters - collapsible on mobile */}
        <div className={`bg-charcoal/50 backdrop-blur rounded-2xl border border-bronze/20 mb-6 sm:mb-8 overflow-hidden transition-all ${
          showFilters ? 'max-h-[500px] p-4' : 'sm:max-h-[500px] sm:p-4 max-h-0 sm:max-h-none p-0 sm:p-4'
        }`}>
          <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-4">
            {/* Status filter */}
            <div>
              <label className="block text-xs sm:text-sm text-cream/60 mb-1.5 sm:mb-2">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as FilterStatus)}
                className="w-full bg-bronze/30 border border-bronze/20 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-primary min-h-[44px]"
              >
                <option value="all">All</option>
                <option value="remaining">To Read</option>
                <option value="completed">Done</option>
              </select>
            </div>

            {/* Type filter */}
            <div>
              <label className="block text-xs sm:text-sm text-cream/60 mb-1.5 sm:mb-2">Type</label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as FilterType)}
                className="w-full bg-bronze/30 border border-bronze/20 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-primary min-h-[44px]"
              >
                <option value="all">All</option>
                <option value="standalone">Single</option>
                <option value="series">Series</option>
              </select>
            </div>

            {/* Genre filter */}
            <div>
              <label className="block text-xs sm:text-sm text-cream/60 mb-1.5 sm:mb-2">Genre</label>
              <select
                value={genreFilter}
                onChange={(e) => setGenreFilter(e.target.value)}
                className="w-full bg-bronze/30 border border-bronze/20 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-primary min-h-[44px]"
              >
                <option value="all">All</option>
                {allGenres.map(genre => (
                  <option key={genre} value={genre}>{genre}</option>
                ))}
              </select>
            </div>

            {/* Series filter */}
            <div>
              <label className="block text-xs sm:text-sm text-cream/60 mb-1.5 sm:mb-2">Series</label>
              <select
                value={seriesFilter}
                onChange={(e) => setSeriesFilter(e.target.value)}
                className="w-full bg-bronze/30 border border-bronze/20 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-primary min-h-[44px]"
              >
                <option value="all">All</option>
                {allSeries.map(series => (
                  <option key={series} value={series}>{series}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-3 sm:mt-4 flex items-center justify-between">
            <span className="text-xs sm:text-sm text-cream/60">
              {filteredBooks.length} of {books.length}
            </span>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-xs sm:text-sm text-primary hover:text-primary/80 min-h-[44px] px-2"
              >
                Clear all
              </button>
            )}
          </div>
        </div>

        {/* Results count on mobile when filters hidden */}
        {!showFilters && (
          <div className="sm:hidden flex items-center justify-between mb-4">
            <span className="text-sm text-cream/60">
              {filteredBooks.length} books
            </span>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-sm text-primary"
              >
                Clear filters
              </button>
            )}
          </div>
        )}

        {/* Book Display */}
        {filteredBooks.length > 0 ? (
          viewMode === 'covers' ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 sm:gap-4">
              {filteredBooks.map((book) => (
                <BookCoverCard
                  key={book.id}
                  book={book}
                  isCompleted={state?.completedBookIds.includes(book.id)}
                  isCurrent={state?.currentPickId === book.id}
                />
              ))}
            </div>
          ) : (
            <BookGrid books={filteredBooks} state={state} onComplete={completeBook} />
          )
        ) : (
          <div className="text-center py-12 sm:py-16">
            <p className="text-3xl sm:text-4xl mb-4">📚</p>
            <p className="text-lg sm:text-xl text-cream/60">No books found</p>
            <button
              onClick={clearFilters}
              className="mt-4 text-primary hover:text-primary/80 min-h-[44px]"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Cover-focused book card
function BookCoverCard({
  book,
  isCompleted,
  isCurrent,
}: {
  book: Book;
  isCompleted?: boolean;
  isCurrent?: boolean;
}) {
  const [coverError, setCoverError] = useState(false);

  return (
    <Link href={`/book/${book.id}`} className="group active:scale-95 transition-transform">
      <div
        className={`relative aspect-[2/3] rounded-lg sm:rounded-xl overflow-hidden bg-charcoal shadow-lg
          transition-all duration-300 group-hover:scale-105 group-hover:shadow-xl
          ${isCurrent ? 'ring-2 ring-primary shadow-lamp/30' : ''}
          ${isCompleted ? 'ring-2 ring-emerald-500' : ''}
          ${!isCompleted && !isCurrent ? 'group-hover:shadow-lamp/20' : ''}`}
      >
        <img
          src={coverError ? getPlaceholderCover() : getBookCover(book, 'M')}
          alt={book.title}
          className="w-full h-full object-cover"
          onError={() => setCoverError(true)}
        />

        {/* Status badges */}
        {isCurrent && (
          <div className="absolute top-1 left-1 sm:top-2 sm:left-2 bg-primary text-white text-[8px] sm:text-xs font-bold px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full">
            NOW
          </div>
        )}
        {isCompleted && (
          <div className="absolute top-1 right-1 sm:top-2 sm:right-2 bg-emerald-500 text-white text-[10px] sm:text-xs font-bold px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full">
            ✓
          </div>
        )}

        {/* Series badge */}
        {book.series && (
          <div className="absolute bottom-1 left-1 sm:bottom-2 sm:left-2 bg-brass/90 text-white text-[8px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full">
            {book.series.order}/{book.series.total}
          </div>
        )}

        {/* Hover overlay - always show title on mobile */}
        <div className="absolute inset-0 bg-gradient-to-t from-walnut/90 via-walnut/40 to-transparent sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
          <div className="absolute bottom-0 left-0 right-0 p-2 sm:p-3">
            <p className="text-white text-[10px] sm:text-sm font-semibold line-clamp-2">{book.title}</p>
            <p className="text-cream/80 text-[8px] sm:text-xs mt-0.5 hidden sm:block">{book.author}</p>
          </div>
        </div>
      </div>
    </Link>
  );
}
