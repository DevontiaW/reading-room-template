'use client';

import { useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { motion, useScroll, useTransform } from 'framer-motion';
import { StatusBanner } from '@/components/StatusBanner';
import { DrawButton } from '@/components/DrawButton';
import { DrawAnimation } from '@/components/DrawAnimation';
import { DecisionModal } from '@/components/DecisionModal';
import { ConfettiEffect } from '@/components/ConfettiEffect';
import { BookCard } from '@/components/BookCard';
import { SeriesProgress } from '@/components/SeriesProgress';
import { Spotlight } from '@/components/Spotlight';
import { ReadingGoalBanner } from '@/components/ReadingGoalBanner';
import { LoginScreen } from '@/components/LoginScreen';
import { ProfileSetup } from '@/components/ProfileSetup';
import { BookSuggestion } from '@/components/BookSuggestion';
import { BookPreviewCard, BookRow } from '@/components/BookPreviewCard';
import { ScrollReveal, StaggerContainer, StaggerItem } from '@/components/ScrollReveal';
import { BookshelfStats } from '@/components/BookshelfStats';
import { useAppState } from '@/lib/hooks/useAppState';
import { useAuth } from '@/lib/hooks/useAuth';
import { useReadingProgress, useClubProgress } from '@/lib/hooks/useReadingProgress';
import { useRemarks } from '@/lib/hooks/useRemarks';
import { Book, PickResult } from '@/lib/types';
import { getBookCover, getPlaceholderCover } from '@/lib/covers';
import { notifyBookPicked, notifyBookCompleted } from '@/lib/notifications';
import booksData from '../../data/books.json';

const books: Book[] = booksData as Book[];

export default function HomePage() {
  const { status, authUser, user, signIn, signOut, refreshUser } = useAuth();
  const {
    state,
    isLoading,
    isOnline,
    mode,
    pick,
    completeBook,
    decideSeries,
    pauseSeries,
    resumeSeries,
  } = useAppState(books);

  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPick, setCurrentPick] = useState<PickResult | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [coverError, setCoverError] = useState(false);

  // Scroll animations
  const { scrollY } = useScroll();
  const heroOpacity = useTransform(scrollY, [0, 300], [1, 0]);
  const heroScale = useTransform(scrollY, [0, 300], [1, 0.95]);

  // Organize books
  const seriesBooks = useMemo(() => books.filter(b => b.series), []);
  const standaloneBooks = useMemo(() => books.filter(b => !b.series), []);
  const seriesNames = useMemo(() => [...new Set(seriesBooks.map(b => b.series!.name))], [seriesBooks]);

  // Get books by series
  const getSeriesBooks = (seriesName: string) =>
    books.filter(b => b.series?.name === seriesName).sort((a, b) => (a.series?.order || 0) - (b.series?.order || 0));

  // Themed book groups
  const atticaLockeBooks = useMemo(() =>
    books.filter(b => b.author === 'Attica Locke').sort((a, b) =>
      (a.series?.name || '').localeCompare(b.series?.name || '') || (a.series?.order || 0) - (b.series?.order || 0)
    ), []);

  const epicFantasy = useMemo(() =>
    books.filter(b => b.genres.includes('Fantasy')), []);

  const fbiFiles = useMemo(() =>
    books.filter(b => b.series?.name === 'Quantico Files'), []);

  const mindBenders = useMemo(() =>
    standaloneBooks.filter(b =>
      b.genres.includes('Speculative fiction') || b.genres.includes('Dystopian') || b.genres.includes('Mystery')
    ), [standaloneBooks]);

  const crimeNoir = useMemo(() =>
    books.filter(b =>
      b.genres.includes('Crime') && !b.genres.includes('Fantasy') && b.author !== 'Attica Locke'
    ), []);

  const handleDraw = useCallback(() => {
    const result = pick();
    if (!result || !result.book) return;
    setCurrentPick(result);
    setIsDrawing(true);
    setShowResult(false);
    setShowConfetti(false);
  }, [pick]);

  const handleDrawComplete = useCallback(() => {
    setIsDrawing(false);
    setShowResult(true);
    if (currentPick && !currentPick.forced) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
    }
    if (currentPick?.book && user) {
      notifyBookPicked({
        bookTitle: currentPick.book.title,
        bookAuthor: currentPick.book.author,
        coverUrl: getBookCover(currentPick.book, 'M'),
        pickedBy: user.displayName,
        isSeriesBook: !!currentPick.book.series,
        seriesName: currentPick.book.series?.name,
        seriesPosition: currentPick.book.series ? `Book ${currentPick.book.series.order}` : undefined,
        reason: currentPick.reason,
      });
    }
  }, [currentPick, user]);

  const handleComplete = useCallback(async () => {
    if (!currentPick?.book) return;
    await completeBook(currentPick.book.id);
    if (user) {
      notifyBookCompleted({
        bookTitle: currentPick.book.title,
        bookAuthor: currentPick.book.author,
        coverUrl: getBookCover(currentPick.book, 'M'),
        completedBy: user.displayName,
        userAvatar: user.avatarUrl,
        totalBooksRead: (state?.completedBookIds.length || 0) + 1,
      });
    }
    setCurrentPick(null);
    setShowResult(false);
  }, [currentPick, completeBook, user, state]);

  const handleDecision = useCallback(
    async (decision: 'continue' | 'pause' | 'drop') => {
      if (!mode?.seriesName) return;
      await decideSeries(mode.seriesName, decision);
    },
    [mode, decideSeries]
  );

  // Stats
  const completedCount = state?.completedBookIds.length || 0;
  const remainingCount = books.length - completedCount;
  const activeSeriesCount = Object.values(state?.seriesState || {}).filter(s => s.status === 'active').length;
  const progressPercent = Math.round((completedCount / books.length) * 100);

  // Current book
  const currentBook = state?.currentPickId ? books.find(b => b.id === state.currentPickId) : null;

  // Reading progress
  const { progress: readingProgress, percentComplete } = useReadingProgress(state?.currentPickId || '', user?.id, user?.displayName);
  const { members: clubProgress } = useClubProgress(state?.currentPickId || '');
  const { remarks } = useRemarks(state?.currentPickId || '');

  // Auth states
  if (status === 'unauthenticated') return <LoginScreen onSignIn={signIn} />;
  if (status === 'needs_profile' && authUser) {
    return <ProfileSetup authUser={authUser} onComplete={refreshUser} onSignOut={signOut} />;
  }
  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-4 border-brass border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <ReadingGoalBanner />
      <ConfettiEffect trigger={showConfetti} />
      <DecisionModal isOpen={mode?.mode === 'decision_required'} seriesName={mode?.seriesName || ''} onDecide={handleDecision} />

      {/* Scroll indicator at top */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="fixed top-20 left-1/2 -translate-x-1/2 z-30 pointer-events-none"
      >
        <motion.div
          animate={{ y: [0, 8, 0], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="flex flex-col items-center text-cream/50"
        >
          <span className="text-xs mb-1 tracking-wider">scroll to explore</span>
          <div className="w-5 h-8 border border-brass/40 rounded-full flex justify-center pt-1.5">
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-1 h-2 bg-brass/60 rounded-full"
            />
          </div>
        </motion.div>
      </motion.div>

      {/* ============================================
          HERO SECTION - Current Read with Parallax
          ============================================ */}
      {currentBook && !showResult && (
        <motion.section
          style={{ opacity: heroOpacity, scale: heroScale }}
          className="relative min-h-[70vh] flex items-center overflow-hidden"
        >
          {/* Animated background */}
          <div className="absolute inset-0">
            <motion.div
              initial={{ scale: 1.1 }}
              animate={{ scale: 1 }}
              transition={{ duration: 20, repeat: Infinity, repeatType: 'reverse' }}
              className="absolute inset-0 bg-cover bg-center opacity-30 blur-2xl"
              style={{ backgroundImage: `url(${getBookCover(currentBook, 'L')})` }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-walnut/50 via-walnut/80 to-walnut" />
            <div className="absolute inset-0 bg-gradient-to-r from-walnut via-transparent to-walnut" />
          </div>

          {/* Floating orbs */}
          <motion.div
            animate={{ y: [-20, 20, -20], x: [-10, 10, -10] }}
            transition={{ duration: 8, repeat: Infinity }}
            className="absolute top-20 right-[20%] w-64 h-64 rounded-full bg-brass/20 blur-3xl"
          />
          <motion.div
            animate={{ y: [20, -20, 20], x: [10, -10, 10] }}
            transition={{ duration: 10, repeat: Infinity }}
            className="absolute bottom-20 left-[10%] w-48 h-48 rounded-full bg-burgundy/20 blur-3xl"
          />

          <div className="relative max-w-6xl mx-auto px-4 py-16 sm:py-24">
            <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-16">
              {/* Book Cover with glow */}
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
                className="flex-shrink-0"
              >
                <div className="relative">
                  <div className="absolute -inset-4 bg-brass/30 rounded-2xl blur-2xl" />
                  <div className="relative w-48 sm:w-56 lg:w-64 aspect-[2/3] rounded-2xl overflow-hidden shadow-2xl ring-2 ring-brass/50">
                    <img
                      src={coverError ? getPlaceholderCover() : getBookCover(currentBook, 'L')}
                      alt={currentBook.title}
                      className="w-full h-full object-cover"
                      onError={() => setCoverError(true)}
                    />
                  </div>
                </div>
              </motion.div>

              {/* Book Info */}
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="flex-1 text-center lg:text-left"
              >
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-brass font-semibold mb-2 tracking-wider text-sm uppercase text-glow-gold"
                >
                  Currently Reading
                </motion.p>
                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="text-4xl sm:text-5xl lg:text-6xl font-bold text-cream mb-3"
                >
                  {currentBook.title}
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="text-xl text-cream/60 mb-4"
                >
                  by {currentBook.author}
                </motion.p>

                {currentBook.series && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.7 }}
                    className="text-electric-light mb-4"
                  >
                    {currentBook.series.name} · Book {currentBook.series.order} of {currentBook.series.total}
                  </motion.p>
                )}

                {currentBook.description && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="text-cream/70 text-lg mb-6 max-w-xl leading-relaxed line-clamp-3"
                  >
                    {currentBook.description}
                  </motion.p>
                )}

                {/* Progress bar */}
                {readingProgress && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.9 }}
                    className="mb-6 max-w-md"
                  >
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-cream/60">Chapter {readingProgress.currentChapter} of {readingProgress.totalChapters}</span>
                      <span className="text-brass font-semibold">{percentComplete}%</span>
                    </div>
                    <div className="h-2 bg-bronze/50 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percentComplete}%` }}
                        transition={{ duration: 1, delay: 1 }}
                        className="h-full bg-gradient-to-r from-brass to-lamp rounded-full"
                      />
                    </div>
                  </motion.div>
                )}

                {/* Action buttons */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1 }}
                  className="flex flex-wrap gap-3 justify-center lg:justify-start"
                >
                  <Link
                    href={`/book/${currentBook.id}`}
                    className="btn-pop inline-flex items-center gap-2"
                  >
                    <span>📖</span> View Details
                  </Link>
                  <Link
                    href={`/book/${currentBook.id}#discussion`}
                    className="px-6 py-3 bg-bronze/50 hover:bg-bronze text-cream rounded-xl font-semibold transition-all hover:scale-105"
                  >
                    <span>💬</span> Discussion ({remarks.length})
                  </Link>
                </motion.div>
              </motion.div>
            </div>
          </div>

        </motion.section>
      )}

      {/* ============================================
          SPOTLIGHT SECTION - First thing after hero
          ============================================ */}
      <section className="relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 pt-16">
          <ScrollReveal variant="fadeUp">
            <h2 className="text-3xl sm:text-4xl font-bold text-center text-cream mb-2">
              In the Spotlight
            </h2>
            <p className="text-center text-cream/50 mb-8">What we're watching and listening to this week</p>
          </ScrollReveal>
        </div>
        <Spotlight />
      </section>

      {/* ============================================
          STATS SECTION - Bookshelf visualization (Tufte-inspired)
          ============================================ */}
      <section className="py-12 sm:py-16">
        <div className="max-w-4xl mx-auto px-4">
          <ScrollReveal variant="fadeUp">
            <h2 className="text-2xl sm:text-3xl font-bold text-center text-cream mb-2">
              Our Shelf
            </h2>
            <p className="text-center text-cream/55 text-sm mb-8">Every spine tells a story</p>
          </ScrollReveal>
          <BookshelfStats
            totalBooks={books.length}
            completedBooks={completedCount}
            seriesCount={seriesNames.length}
            activeSeriesCount={activeSeriesCount}
            currentBookTitle={currentBook?.title}
            currentBookCover={currentBook ? getBookCover(currentBook, 'M') : undefined}
          />
        </div>
      </section>

      {/* ============================================
          DRAW SECTION - Pick Next Book
          ============================================ */}
      {(!currentBook || showResult) && (
        <section className="py-16 sm:py-24">
          <div className="max-w-4xl mx-auto px-4">
            <ScrollReveal variant="scale">
              <div className="glass-card-vibrant rounded-3xl p-8 sm:p-12 text-center">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                  className="text-6xl mb-6"
                >
                  🎲
                </motion.div>
                <h2 className="text-3xl sm:text-4xl font-bold text-cream mb-4">
                  Ready for Your Next Adventure?
                </h2>
                <p className="text-cream/60 mb-8 max-w-md mx-auto">
                  {remainingCount === 0
                    ? "You've conquered the entire library! Amazing!"
                    : `${remainingCount} books waiting to be discovered`}
                </p>

                {!showResult && !isDrawing && (
                  <DrawButton mode={mode} onClick={handleDraw} isLoading={isDrawing} disabled={remainingCount === 0} />
                )}

                {(isDrawing || showResult) && currentPick?.book && (
                  <div className="space-y-6">
                    <DrawAnimation
                      books={books}
                      selectedBook={currentPick.book}
                      isForced={currentPick.forced}
                      isDrawing={isDrawing}
                      onDrawComplete={handleDrawComplete}
                    />
                    {showResult && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-4"
                      >
                        <p className="text-cream/60 italic">{currentPick.reason}</p>
                        <div className="max-w-md mx-auto">
                          <BookCard book={currentPick.book} state={state} onComplete={handleComplete} size="lg" />
                        </div>
                        <button
                          onClick={() => { setCurrentPick(null); setShowResult(false); }}
                          className="text-cream/60 hover:text-cream transition-colors"
                        >
                          Draw Again
                        </button>
                      </motion.div>
                    )}
                  </div>
                )}
              </div>
            </ScrollReveal>
          </div>
        </section>
      )}

      {/* ============================================
          NETFLIX-STYLE BOOK ROWS - Themed Categories
          ============================================ */}
      <section className="py-16 sm:py-24 bg-charcoal/30">
        <div className="max-w-7xl mx-auto px-4">
          <ScrollReveal variant="fadeUp">
            <h2 className="text-3xl sm:text-4xl font-bold text-center text-cream mb-2">
              The Library
            </h2>
            <p className="text-center text-cream/60 mb-12">Curated collections for every mood</p>
          </ScrollReveal>

          {/* Southern Noir - Attica Locke */}
          {atticaLockeBooks.length > 0 && (
            <ScrollReveal variant="slideLeft">
              <BookRow
                title="Southern Noir"
                books={atticaLockeBooks}
                completedIds={state?.completedBookIds || []}
                currentId={state?.currentPickId ?? undefined}
                icon="🎷"
              />
              <p className="text-cream/55 text-sm -mt-4 mb-8 ml-8">Deep Texas roots with Attica Locke</p>
            </ScrollReveal>
          )}

          {/* Epic Fantasy */}
          {epicFantasy.length > 0 && (
            <ScrollReveal variant="slideLeft" delay={0.1}>
              <BookRow
                title="Epic Fantasy"
                books={epicFantasy}
                completedIds={state?.completedBookIds || []}
                currentId={state?.currentPickId ?? undefined}
                icon="⚔️"
              />
              <p className="text-cream/55 text-sm -mt-4 mb-8 ml-8">World-shaking sagas and broken earths</p>
            </ScrollReveal>
          )}

          {/* FBI Files */}
          {fbiFiles.length > 0 && (
            <ScrollReveal variant="slideLeft" delay={0.2}>
              <BookRow
                title="FBI Files"
                books={fbiFiles}
                completedIds={state?.completedBookIds || []}
                currentId={state?.currentPickId ?? undefined}
                icon="🔍"
              />
              <p className="text-cream/55 text-sm -mt-4 mb-8 ml-8">Behavioral analysts hunting serial killers</p>
            </ScrollReveal>
          )}

          {/* Mind-Benders */}
          {mindBenders.length > 0 && (
            <ScrollReveal variant="slideLeft" delay={0.3}>
              <BookRow
                title="Mind-Benders"
                books={mindBenders}
                completedIds={state?.completedBookIds || []}
                currentId={state?.currentPickId ?? undefined}
                icon="🌀"
              />
              <p className="text-cream/55 text-sm -mt-4 mb-8 ml-8">Reality isn't what it seems</p>
            </ScrollReveal>
          )}

          {/* Crime & Intrigue */}
          {crimeNoir.length > 0 && (
            <ScrollReveal variant="slideLeft" delay={0.4}>
              <BookRow
                title="Crime & Intrigue"
                books={crimeNoir}
                completedIds={state?.completedBookIds || []}
                currentId={state?.currentPickId ?? undefined}
                icon="🕵️"
              />
              <p className="text-cream/55 text-sm -mt-4 mb-8 ml-8">From Swedish noir to American courtrooms</p>
            </ScrollReveal>
          )}
        </div>
      </section>

      {/* ============================================
          SERIES PROGRESS SECTION
          ============================================ */}
      {seriesNames.length > 0 && (
        <section className="py-16 sm:py-24">
          <div className="max-w-6xl mx-auto px-4">
            <ScrollReveal variant="fadeUp">
              <h2 className="text-3xl sm:text-4xl font-bold text-center text-cream mb-4">
                The Journey
              </h2>
              <p className="text-center text-cream/60 mb-12">Track your progress through each saga</p>
            </ScrollReveal>

            <StaggerContainer className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {seriesNames.map((name) => (
                <StaggerItem key={name}>
                  <SeriesProgress
                    books={books}
                    state={state}
                    seriesName={name}
                    onResume={() => resumeSeries(name)}
                    onPause={() => pauseSeries(name)}
                  />
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
        </section>
      )}

      {/* ============================================
          BOOK SUGGESTIONS
          ============================================ */}
      <section className="py-16 sm:py-24 bg-charcoal/30">
        <div className="max-w-6xl mx-auto px-4">
          <ScrollReveal variant="fadeUp">
            <BookSuggestion />
          </ScrollReveal>
        </div>
      </section>

      {/* ============================================
          FOOTER
          ============================================ */}
      <footer className="py-12 border-t border-bronze/20">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            className="text-cream/55 text-sm"
          >
            C&W Book Club · Est. 2026 · {books.length} books and counting
          </motion.p>
        </div>
      </footer>
    </div>
  );
}
