'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { RemarkPanel } from '@/components/RemarkPanel';
import { RemarkForm } from '@/components/RemarkForm';
import { useAppState } from '@/lib/hooks/useAppState';
import { useRemarks } from '@/lib/hooks/useRemarks';
import { useUser } from '@/lib/hooks/useUser';
import { useAuth } from '@/lib/hooks/useAuth';
import { useReadingProgress } from '@/lib/hooks/useReadingProgress';
import { Book } from '@/lib/types';
import { getBookCover, getPlaceholderCover } from '@/lib/covers';
import { notifyBookPicked } from '@/lib/notifications';
import booksData from '../../../../data/books.json';

const books: Book[] = booksData as Book[];

export default function BookPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const book = books.find(b => b.id === id);
  const [coverError, setCoverError] = useState(false);

  const { user } = useAuth();
  const { userName, setUserName } = useUser();
  const { state, completeBook, setCurrentPick, isLoading: stateLoading } = useAppState(books);
  const { remarks, addRemark, isLoading: remarksLoading, isOnline } = useRemarks(id);
  const { progress, updateChapter, incrementChapter, decrementChapter, percentComplete, totalChapters, isSaving } = useReadingProgress(id, user?.id, user?.displayName);

  if (!book) {
    return (
      <div className="min-h-screen bg-walnut text-cream">
        <div className="max-w-4xl mx-auto px-4 py-12 text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Book Not Found</h1>
          <Link href="/books" className="text-primary hover:underline">
            Back to Books
          </Link>
        </div>
      </div>
    );
  }

  const isCompleted = state?.completedBookIds.includes(book.id);
  const isCurrent = state?.currentPickId === book.id;
  const seriesBooks = book.series
    ? books.filter(b => b.series?.name === book.series?.name).sort((a, b) => (a.series?.order || 0) - (b.series?.order || 0))
    : [];

  const handleAddRemark = async (note: string, rating?: number) => {
    if (!userName) return;
    await addRemark(userName, note, rating);
  };

  return (
    <div className="min-h-screen bg-walnut text-cream">
      {/* Hero Section with blurred background */}
      <div className="relative overflow-hidden">
        {/* Background blur effect */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-20 blur-3xl scale-110"
          style={{
            backgroundImage: `url(${getBookCover(book, 'L')})`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-walnut/80 to-walnut" />

        <div className="relative max-w-6xl mx-auto px-4 py-6 sm:py-8">
          {/* Breadcrumb */}
          <Link href="/" className="text-cream/60 hover:text-white transition-colors inline-flex items-center gap-2 mb-4 sm:mb-6 min-h-[44px]">
            <span>←</span> <span className="text-sm">Home</span>
          </Link>

          <div className="flex flex-col sm:flex-row gap-5 sm:gap-8">
            {/* Book Cover - centered on mobile */}
            <div className="flex-shrink-0 flex justify-center sm:justify-start">
              <div className={`w-32 sm:w-48 md:w-56 aspect-[2/3] rounded-xl overflow-hidden shadow-2xl
                ${isCurrent ? 'ring-4 ring-primary shadow-lamp/30' : 'ring-2 ring-white/10'}
                ${isCompleted ? 'ring-4 ring-emerald-500' : ''}`}
              >
                <img
                  src={coverError ? getPlaceholderCover() : getBookCover(book, 'L')}
                  alt={`Cover of ${book.title}`}
                  className="w-full h-full object-cover"
                  onError={() => setCoverError(true)}
                />
              </div>
            </div>

            {/* Book Info */}
            <div className="flex-1 text-center sm:text-left">
              {/* Status badges */}
              <div className="flex gap-2 justify-center sm:justify-start mb-2">
                {isCurrent && (
                  <span className="px-2.5 py-1 bg-primary text-white text-xs font-semibold rounded-full">
                    Now Reading
                  </span>
                )}
                {isCompleted && (
                  <span className="px-2.5 py-1 bg-emerald-500 text-white text-xs font-semibold rounded-full">
                    Completed
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold text-white mb-2 sm:mb-3">{book.title}</h1>
              <p className="text-base sm:text-xl text-cream/60 mb-3 sm:mb-4">by {book.author}</p>

              {/* Series info */}
              {book.series && (
                <p className="text-brass-light mb-3 sm:mb-4 text-sm sm:text-lg">
                  {book.series.name} · Book {book.series.order} of {book.series.total}
                </p>
              )}

              {/* Genres - scrollable on mobile */}
              <div className="flex flex-wrap gap-1.5 sm:gap-2 justify-center sm:justify-start mb-4 sm:mb-6">
                {book.genres.map(genre => (
                  <span
                    key={genre}
                    className="px-2.5 sm:px-3 py-1 bg-bronze/30 text-cream/80 rounded-full text-xs sm:text-sm"
                  >
                    {genre}
                  </span>
                ))}
              </div>

              {/* Actions - full width on mobile */}
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                {!isCurrent && !isCompleted && (
                  <button
                    onClick={async () => {
                      await setCurrentPick(book.id);
                      // Notify Discord that someone started reading
                      if (user) {
                        notifyBookPicked({
                          bookTitle: book.title,
                          bookAuthor: book.author,
                          coverUrl: getBookCover(book, 'M'),
                          pickedBy: user.displayName,
                          isSeriesBook: !!book.series,
                          seriesName: book.series?.name,
                          seriesPosition: book.series ? `Book ${book.series.order}` : undefined,
                          reason: 'Started reading',
                        });
                      }
                    }}
                    disabled={stateLoading}
                    className="px-5 sm:px-6 py-3 bg-brass hover:bg-brass-light text-white rounded-xl font-semibold transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-2 min-h-[48px]"
                  >
                    <span>📖</span> Start Reading
                  </button>
                )}
                {isCurrent && !isCompleted && (
                  <button
                    onClick={() => completeBook(book.id)}
                    disabled={stateLoading}
                    className="px-5 sm:px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-semibold transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-2 min-h-[48px]"
                  >
                    <span>✓</span> Mark Complete
                  </button>
                )}
                {isCompleted && (
                  <div className="px-5 sm:px-6 py-3 bg-emerald-600/20 text-emerald-400 rounded-xl font-semibold inline-flex items-center justify-center gap-2 min-h-[48px] border border-emerald-600/30">
                    <span>✓</span> Completed
                  </div>
                )}
                <a
                  href="#discussion"
                  className="px-5 sm:px-6 py-3 bg-primary hover:bg-primary/80 text-white rounded-xl font-semibold transition-colors inline-flex items-center justify-center gap-2 min-h-[48px]"
                >
                  <span>💬</span> Discussion
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8">
        <div className="grid gap-6 sm:gap-8 lg:grid-cols-3">
          {/* Main Column */}
          <div className="lg:col-span-2 space-y-5 sm:space-y-6">
            {/* Reading Progress Tracker */}
            {isCurrent && progress && (
              <div className="bg-gradient-to-r from-primary/10 to-amber-600/10 backdrop-blur rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-primary/20">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                    <span>📖</span> Your Reading Progress
                  </h2>
                  <span className="text-xs text-primary bg-primary/10 px-2 py-1 rounded-full flex items-center gap-1">
                    {isSaving && <span className="animate-spin">↻</span>}
                    {percentComplete}% complete
                  </span>
                </div>

                {/* Progress bar */}
                <div className="mb-4">
                  <div className="h-3 bg-bronze/30 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary to-amber-500 transition-all duration-500"
                      style={{ width: `${percentComplete}%` }}
                    />
                  </div>
                </div>

                {/* Chapter selector */}
                <div className="flex items-center justify-center gap-4">
                  <button
                    onClick={decrementChapter}
                    disabled={progress.currentChapter <= 1}
                    className="w-12 h-12 rounded-full bg-bronze/30 hover:bg-bronze/50 disabled:opacity-30 disabled:cursor-not-allowed text-white font-bold text-xl transition-colors flex items-center justify-center"
                  >
                    −
                  </button>

                  <div className="text-center min-w-[140px]">
                    <div className="text-3xl font-bold text-white mb-1">
                      Chapter {progress.currentChapter}
                    </div>
                    <div className="text-sm text-cream/60">
                      of {totalChapters} chapters
                    </div>
                  </div>

                  <button
                    onClick={incrementChapter}
                    disabled={progress.currentChapter >= totalChapters}
                    className="w-12 h-12 rounded-full bg-bronze/30 hover:bg-bronze/50 disabled:opacity-30 disabled:cursor-not-allowed text-white font-bold text-xl transition-colors flex items-center justify-center"
                  >
                    +
                  </button>
                </div>

                {/* Quick jump */}
                <div className="mt-4 flex items-center justify-center gap-2">
                  <span className="text-xs text-cream/40">Jump to:</span>
                  <input
                    type="number"
                    min="1"
                    max={totalChapters}
                    value={progress.currentChapter}
                    onChange={(e) => updateChapter(parseInt(e.target.value) || 1)}
                    className="w-16 bg-bronze/30 border border-bronze/30 rounded-lg px-2 py-1 text-white text-center text-sm focus:outline-none focus:border-primary"
                  />
                </div>
              </div>
            )}

            {/* Series Progress (if applicable) */}
            {book.series && (
              <div className="bg-charcoal/50 backdrop-blur rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-bronze/20">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base sm:text-lg font-bold text-white">Series Progress</h2>
                  <span className="text-xs text-cream/40 bg-charcoal/50 px-2 py-1 rounded-full">
                    {seriesBooks.length} of {book.series.total} in collection
                  </span>
                </div>

                {/* Visual progress - showing books in collection */}
                <div className="space-y-3">
                  {/* Progress bar based on completed books in OUR collection */}
                  <div>
                    <div className="flex items-center justify-between text-xs text-cream/60 mb-1">
                      <span>Your Progress</span>
                      <span>{seriesBooks.filter(b => state?.completedBookIds.includes(b.id)).length} / {seriesBooks.length} read</span>
                    </div>
                    <div className="h-2 bg-bronze/30 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-500"
                        style={{
                          width: `${(seriesBooks.filter(b => state?.completedBookIds.includes(b.id)).length / seriesBooks.length) * 100}%`
                        }}
                      />
                    </div>
                  </div>

                  {/* Individual book status */}
                  <div className="flex gap-2 flex-wrap">
                    {seriesBooks.map((sb) => {
                      const isRead = state?.completedBookIds.includes(sb.id);
                      const isReading = state?.currentPickId === sb.id;
                      return (
                        <Link
                          key={sb.id}
                          href={`/book/${sb.id}`}
                          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs transition-all ${
                            isRead
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : isReading
                                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                : sb.id === book.id
                                  ? 'bg-primary/20 text-primary border border-primary/30'
                                  : 'bg-charcoal/50 text-cream/60 hover:bg-bronze/30'
                          }`}
                        >
                          <span className="font-bold">#{sb.series?.order}</span>
                          {isRead && <span>✓</span>}
                          {isReading && <span className="animate-pulse">📖</span>}
                        </Link>
                      );
                    })}
                  </div>

                  {/* Note if collection is incomplete */}
                  {seriesBooks.length < book.series.total && (
                    <p className="text-xs text-cream/40 italic">
                      Note: Only {seriesBooks.length} of {book.series.total} books from this series are in our club collection.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Discussion Section */}
            <div id="discussion" className="bg-charcoal/50 backdrop-blur rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-bronze/20">
              {/* Header with stats */}
              <div className="flex items-start justify-between mb-5 sm:mb-6">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-2xl">💬</span>
                    <h2 className="text-xl sm:text-2xl font-bold text-white">Discussion</h2>
                  </div>
                  <p className="text-cream/60 text-xs sm:text-sm">
                    Share your thoughts, quotes, or reactions
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {!isOnline && (
                    <span className="text-[10px] sm:text-xs text-amber-400 px-2 sm:px-3 py-1 bg-amber-400/10 rounded-full">
                      Offline
                    </span>
                  )}
                  <span className="text-xs text-cream/40 bg-charcoal/50 px-3 py-1.5 rounded-full">
                    {remarks.length} {remarks.length === 1 ? 'remark' : 'remarks'}
                  </span>
                </div>
              </div>

              {/* Empty state or remarks */}
              {remarks.length === 0 && !remarksLoading && (
                <div className="text-center py-8 mb-6 bg-charcoal/50 rounded-xl border border-dashed border-bronze/20">
                  <span className="text-4xl mb-3 block">📝</span>
                  <h3 className="text-white font-medium mb-1">Start the conversation</h3>
                  <p className="text-cream/40 text-sm max-w-sm mx-auto">
                    Be the first to share your thoughts about "{book.title}"
                  </p>
                </div>
              )}

              {/* Remark Form */}
              <div className="bg-charcoal/50 rounded-xl p-4 border border-bronze/20 mb-6">
                <RemarkForm
                  userName={userName}
                  onSetUserName={setUserName}
                  onSubmit={handleAddRemark}
                />
              </div>

              {/* Discussion Thread */}
              {remarks.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="h-px flex-1 bg-bronze/30" />
                    <span className="text-xs text-cream/40 uppercase tracking-wide">Thread</span>
                    <div className="h-px flex-1 bg-bronze/30" />
                  </div>
                  <RemarkPanel remarks={remarks} isLoading={remarksLoading} />
                </div>
              )}
            </div>
          </div>

          {/* Sidebar - horizontal scroll on mobile for series nav */}
          <div className="space-y-5 sm:space-y-6">
            {/* Get This Book */}
            <div className="bg-charcoal/50 backdrop-blur rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-bronze/20">
              <h3 className="font-semibold text-white mb-3 sm:mb-4 text-sm sm:text-base">Get This Book</h3>
              <div className="space-y-2">
                <a
                  href={`https://www.amazon.com/s?k=${encodeURIComponent(book.title + ' ' + book.author)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 bg-amber-600/20 hover:bg-amber-600/30 border border-amber-600/30 rounded-xl transition-colors min-h-[48px]"
                >
                  <span className="text-xl">📦</span>
                  <div>
                    <p className="text-white font-medium text-sm">Amazon</p>
                    <p className="text-cream/60 text-xs">Print & Kindle</p>
                  </div>
                </a>
                <a
                  href={`https://www.audible.com/search?keywords=${encodeURIComponent(book.title + ' ' + book.author)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 bg-orange-600/20 hover:bg-orange-600/30 border border-orange-600/30 rounded-xl transition-colors min-h-[48px]"
                >
                  <span className="text-xl">🎧</span>
                  <div>
                    <p className="text-white font-medium text-sm">Audible</p>
                    <p className="text-cream/60 text-xs">Audiobook</p>
                  </div>
                </a>
                <a
                  href={`https://www.libbyapp.com/search/query-${encodeURIComponent(book.title)}/page-1`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-600/30 rounded-xl transition-colors min-h-[48px]"
                >
                  <span className="text-xl">📚</span>
                  <div>
                    <p className="text-white font-medium text-sm">Libby</p>
                    <p className="text-cream/60 text-xs">Free from library</p>
                  </div>
                </a>
              </div>
            </div>

            {/* Book Details Card */}
            <div className="bg-charcoal/50 backdrop-blur rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-bronze/20">
              <h3 className="font-semibold text-white mb-3 sm:mb-4 text-sm sm:text-base flex items-center gap-2">
                <span className="text-lg">📖</span> About This Book
              </h3>

              {/* Reading Status with progress indicator */}
              <div className="mb-4 p-3 rounded-xl bg-gradient-to-r from-white/5 to-transparent">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${
                    isCompleted ? 'bg-emerald-400' : isCurrent ? 'bg-amber-400 animate-pulse' : 'bg-gray-600'
                  }`} />
                  <div>
                    <p className={`font-medium text-sm ${
                      isCompleted ? 'text-emerald-400' : isCurrent ? 'text-amber-400' : 'text-cream/60'
                    }`}>
                      {isCompleted ? 'Finished Reading' : isCurrent ? 'Currently Reading' : 'Not Started Yet'}
                    </p>
                    <p className="text-xs text-cream/40">
                      {isCompleted ? 'Great job!' : isCurrent ? 'Keep it up!' : 'Ready when you are'}
                    </p>
                  </div>
                </div>
              </div>

              <dl className="space-y-3 text-xs sm:text-sm">
                {/* Author */}
                <div className="flex items-start gap-3">
                  <span className="text-cream/40 text-lg">✍️</span>
                  <div>
                    <dt className="text-cream/40 text-xs uppercase tracking-wide">Author</dt>
                    <dd className="text-white font-medium">{book.author}</dd>
                  </div>
                </div>

                {/* Genre tags */}
                <div className="flex items-start gap-3">
                  <span className="text-cream/40 text-lg">🏷️</span>
                  <div>
                    <dt className="text-cream/40 text-xs uppercase tracking-wide mb-1">Genres</dt>
                    <dd className="flex flex-wrap gap-1">
                      {book.genres.map(genre => (
                        <span key={genre} className="px-2 py-0.5 bg-primary/20 text-primary rounded text-xs">
                          {genre}
                        </span>
                      ))}
                    </dd>
                  </div>
                </div>

                {/* Series info */}
                {book.series && (
                  <div className="flex items-start gap-3">
                    <span className="text-cream/40 text-lg">📚</span>
                    <div>
                      <dt className="text-cream/40 text-xs uppercase tracking-wide">Series</dt>
                      <dd className="text-white font-medium">{book.series.name}</dd>
                      <dd className="text-brass-light text-xs mt-0.5">Book {book.series.order} of {book.series.total}</dd>
                    </div>
                  </div>
                )}

                {/* Type */}
                <div className="flex items-start gap-3">
                  <span className="text-cream/40 text-lg">{book.series ? '📖' : '📕'}</span>
                  <div>
                    <dt className="text-cream/40 text-xs uppercase tracking-wide">Type</dt>
                    <dd className="text-white font-medium">{book.series ? 'Part of Series' : 'Standalone Novel'}</dd>
                  </div>
                </div>

                {/* Discussion count */}
                <div className="flex items-start gap-3">
                  <span className="text-cream/40 text-lg">💬</span>
                  <div>
                    <dt className="text-cream/40 text-xs uppercase tracking-wide">Discussion</dt>
                    <dd className="text-white font-medium">
                      {remarks.length === 0 ? 'No remarks yet' : `${remarks.length} remark${remarks.length === 1 ? '' : 's'}`}
                    </dd>
                  </div>
                </div>
              </dl>
            </div>

            {/* Other books in series */}
            {seriesBooks.length > 1 && (
              <div className="bg-charcoal/50 backdrop-blur rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-bronze/20">
                <h3 className="font-semibold text-white mb-3 sm:mb-4 text-sm sm:text-base">
                  {book.series?.name}
                </h3>
                <div className="space-y-1.5 sm:space-y-2">
                  {seriesBooks.map(sb => (
                    <Link
                      key={sb.id}
                      href={`/book/${sb.id}`}
                      className={`block p-2.5 sm:p-3 rounded-lg sm:rounded-xl transition-all min-h-[44px] flex items-center ${
                        sb.id === book.id
                          ? 'bg-primary/20 text-white ring-1 ring-primary/50'
                          : 'bg-charcoal/50 text-cream/60 hover:bg-bronze/30 hover:text-white active:scale-98'
                      }`}
                    >
                      <div className="flex items-center gap-2 sm:gap-3 w-full">
                        <span className={`text-[10px] sm:text-xs font-bold px-1.5 sm:px-2 py-0.5 rounded ${
                          sb.id === book.id ? 'bg-primary text-white' : 'bg-bronze/30 text-cream/60'
                        }`}>
                          {sb.series?.order}
                        </span>
                        <span className="truncate flex-1 text-xs sm:text-sm">{sb.title}</span>
                        {state?.completedBookIds.includes(sb.id) && (
                          <span className="text-emerald-400 text-xs sm:text-sm">✓</span>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Browse Library CTA */}
            <div className="bg-gradient-to-br from-primary/20 to-amber-800/10 rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-primary/20">
              <h3 className="font-semibold text-white mb-2 text-sm sm:text-base">Explore More</h3>
              <p className="text-cream/60 text-xs sm:text-sm mb-3 sm:mb-4">
                {books.length} books in the collection
              </p>
              <Link
                href="/books"
                className="block text-center px-4 py-2.5 bg-bronze/30 hover:bg-bronze/50 text-white rounded-lg font-medium transition-colors min-h-[44px] flex items-center justify-center text-sm"
              >
                View Library →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
