'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/hooks/useAuth';
import { useAppState } from '@/lib/hooks/useAppState';
import { updateBookClubUser, isDisplayNameAvailable } from '@/lib/auth';
import { getBookCover, getPlaceholderCover } from '@/lib/covers';
import { Book } from '@/lib/types';
import { BADGES, LEVELS, getLevelForPoints, getLevelProgress, getPointsToNextLevel } from '@/lib/gamification/config';
import { ScrollReveal, StaggerContainer, StaggerItem } from '@/components/ScrollReveal';
import booksData from '../../../data/books.json';

const books: Book[] = booksData as Book[];

// Badge rarity colors mapping
const rarityColors: Record<string, { bg: string; text: string; border: string }> = {
  reading: { bg: 'bg-brass/20', text: 'text-brass', border: 'border-brass/30' },
  social: { bg: 'bg-library-green/20', text: 'text-library-green-light', border: 'border-library-green/30' },
  streak: { bg: 'bg-lamp/20', text: 'text-lamp', border: 'border-lamp/30' },
  special: { bg: 'bg-burgundy/20', text: 'text-burgundy-light', border: 'border-burgundy/30' },
};

export default function ProfilePage() {
  const { status, user, signOut, refreshUser } = useAuth();
  const { state } = useAppState(books);

  const [isEditing, setIsEditing] = useState(false);
  const [newDisplayName, setNewDisplayName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Get completed books
  const completedBooks = books.filter(b =>
    state?.completedBookIds.includes(b.id)
  );

  // Get remaining books (to read)
  const toReadBooks = books.filter(b =>
    !state?.completedBookIds.includes(b.id)
  );

  // Current book
  const currentBook = state?.currentPickId
    ? books.find(b => b.id === state.currentPickId)
    : null;

  // Stats
  const totalBooks = books.length;
  const completedCount = completedBooks.length;
  const progressPercent = totalBooks > 0 ? Math.round((completedCount / totalBooks) * 100) : 0;

  // Gamification stats (placeholder until hooked to real data)
  const totalPoints = completedCount * 100; // Simplified calculation
  const currentLevel = getLevelForPoints(totalPoints);
  const levelProgress = getLevelProgress(totalPoints);
  const pointsToNext = getPointsToNextLevel(totalPoints);

  // Simulated earned badges based on progress
  const earnedBadgeIds = new Set<string>();
  if (completedCount >= 1) earnedBadgeIds.add('first_blood');
  if (completedCount >= 5) earnedBadgeIds.add('bookworm');
  if (completedCount >= 10) earnedBadgeIds.add('bibliophile');
  // Add founder badge for all C&W members
  earnedBadgeIds.add('founder');

  const earnedBadges = BADGES.filter(b => earnedBadgeIds.has(b.badgeId));
  const lockedBadges = BADGES.filter(b => !earnedBadgeIds.has(b.badgeId));

  // Reading history (last 4 completed books)
  const readingHistory = completedBooks.slice(-4).reverse();

  const handleEditStart = () => {
    setNewDisplayName(user?.displayName || '');
    setIsEditing(true);
    setError(null);
    setSuccess(false);
  };

  const handleEditCancel = () => {
    setIsEditing(false);
    setNewDisplayName('');
    setError(null);
  };

  const handleSave = async () => {
    if (!user) return;

    const trimmed = newDisplayName.trim();

    if (!trimmed) {
      setError('Display name cannot be empty');
      return;
    }

    if (trimmed.length < 2) {
      setError('Display name must be at least 2 characters');
      return;
    }

    if (trimmed.length > 30) {
      setError('Display name must be 30 characters or less');
      return;
    }

    if (trimmed === user.displayName) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    setError(null);

    // Check availability
    const available = await isDisplayNameAvailable(trimmed, user.id);
    if (!available) {
      setError('That name is already taken');
      setIsSaving(false);
      return;
    }

    // Update
    const updated = await updateBookClubUser(user.id, { displayName: trimmed });

    if (!updated) {
      setError('Failed to update. Please try again.');
      setIsSaving(false);
      return;
    }

    await refreshUser();
    setIsEditing(false);
    setSuccess(true);
    setIsSaving(false);
    setTimeout(() => setSuccess(false), 3000);
  };

  // Loading state
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-walnut flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-brass border-t-transparent rounded-full" />
      </div>
    );
  }

  // Not authenticated
  if (status === 'unauthenticated' || !user) {
    return (
      <div className="min-h-screen bg-walnut flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-cream mb-4">Sign in to view your profile</h1>
          <Link
            href="/"
            className="px-6 py-3 bg-brass hover:bg-brass-light text-walnut rounded-xl font-semibold transition-colors"
          >
            Go to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-walnut text-cream">
      {/* Header */}
      <header className="border-b border-bronze/30 sticky top-0 bg-walnut/90 backdrop-blur-md z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-brass flex items-center gap-2">
            <span className="text-2xl">📚</span> C&W Book Club
          </Link>
          <nav className="flex gap-6">
            <Link href="/" className="text-cream/60 hover:text-brass transition-colors">Home</Link>
            <Link href="/books" className="text-cream/60 hover:text-brass transition-colors">Library</Link>
            <Link href="/profile" className="text-cream">Profile</Link>
          </nav>
        </div>
      </header>

      <div className="container mx-auto px-6 py-12">
        {/* Profile Header */}
        <ScrollReveal variant="fadeUp">
          <div className="bg-charcoal rounded-2xl p-8 mb-8 border border-bronze/20 warm-glow">
            <div className="flex flex-col md:flex-row items-center gap-6">
              {/* Avatar */}
              <div className="relative">
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.displayName}
                    className="w-24 h-24 md:w-32 md:h-32 rounded-full ring-4 ring-brass/30"
                  />
                ) : (
                  <div className="w-24 h-24 md:w-32 md:h-32 bg-gradient-to-br from-brass to-leather rounded-full flex items-center justify-center text-4xl font-bold text-walnut shadow-lg ring-4 ring-brass/30">
                    {user.displayName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="absolute -bottom-1 -right-1 text-2xl">👑</div>
              </div>

              {/* Info */}
              <div className="text-center md:text-left flex-1">
                {isEditing ? (
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={newDisplayName}
                      onChange={(e) => setNewDisplayName(e.target.value)}
                      className="w-full sm:w-auto bg-bronze/30 border border-bronze/50 rounded-xl px-4 py-3 text-cream text-xl font-bold focus:outline-none focus:border-brass min-h-[48px]"
                      maxLength={30}
                      autoFocus
                    />
                    {error && <p className="text-burgundy-light text-sm">{error}</p>}
                    <div className="flex gap-2 justify-center sm:justify-start">
                      <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="px-4 py-2 bg-brass hover:bg-brass-light disabled:opacity-50 text-walnut rounded-lg font-medium transition-colors min-h-[44px]"
                      >
                        {isSaving ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        onClick={handleEditCancel}
                        className="px-4 py-2 bg-bronze hover:bg-bronze-light text-cream rounded-lg font-medium transition-colors min-h-[44px]"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-3 justify-center md:justify-start">
                      <h1 className="text-2xl sm:text-3xl font-bold text-cream">
                        {user.displayName}
                      </h1>
                      <button
                        onClick={handleEditStart}
                        className="p-2 text-cream/40 hover:text-brass transition-colors"
                        title="Edit name"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                      {success && (
                        <span className="text-library-green-light text-sm">Saved!</span>
                      )}
                    </div>
                    <p className="text-cream/50 mb-4">Founding Member · Joined {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>

                    {/* Level Progress */}
                    <div className="max-w-md">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-brass font-medium">Level {currentLevel.level} - {currentLevel.title}</span>
                        <span className="text-cream/50">{totalPoints} XP</span>
                      </div>
                      <div className="w-full bg-bronze/30 rounded-full h-3">
                        <div
                          className="bg-gradient-to-r from-brass to-lamp h-3 rounded-full transition-all"
                          style={{ width: `${levelProgress}%` }}
                        />
                      </div>
                      {pointsToNext > 0 && (
                        <p className="text-xs text-cream/40 mt-1">{pointsToNext} XP to next level</p>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-8 text-center">
                <div>
                  <div className="text-3xl font-bold text-brass">{completedCount}</div>
                  <div className="text-sm text-cream/50">Books</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-lamp">🔥 1</div>
                  <div className="text-sm text-cream/50">Streak</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-library-green-light">{earnedBadges.length}</div>
                  <div className="text-sm text-cream/50">Badges</div>
                </div>
              </div>
            </div>

            {/* Sign out button */}
            <div className="mt-6 pt-6 border-t border-bronze/20 text-center md:text-right">
              <button
                onClick={signOut}
                className="px-4 py-2 text-cream/40 hover:text-burgundy-light transition-colors text-sm"
              >
                Sign Out
              </button>
            </div>
          </div>
        </ScrollReveal>

        <div className="grid lg:grid-cols-[1fr_350px] gap-8">
          <div className="space-y-8">
            {/* Currently Reading */}
            {currentBook && (
              <ScrollReveal variant="slideLeft">
                <section>
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-cream">
                    <span>📖</span> Currently Reading
                  </h2>
                  <Link href={`/book/${currentBook.id}`}>
                    <div className="bg-charcoal/50 rounded-xl p-6 border border-bronze/20 hover:border-brass/40 transition-all group">
                      <div className="flex gap-4">
                        <div className="w-20 h-28 rounded-lg overflow-hidden shadow-lg">
                          <img
                            src={getBookCover(currentBook, 'M')}
                            alt={currentBook.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            onError={(e) => { e.currentTarget.src = getPlaceholderCover(); }}
                          />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-lg text-cream group-hover:text-brass transition-colors">{currentBook.title}</h3>
                          <p className="text-cream/50 text-sm mb-3">{currentBook.author}</p>
                          <div className="w-full bg-bronze/30 rounded-full h-2 mb-1">
                            <div className="bg-brass h-2 rounded-full" style={{ width: '25%' }} />
                          </div>
                          <p className="text-xs text-cream/50">In progress</p>
                        </div>
                      </div>
                    </div>
                  </Link>
                </section>
              </ScrollReveal>
            )}

            {/* Badges Earned */}
            <ScrollReveal variant="slideLeft" delay={0.1}>
              <section>
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-cream">
                  <span>🏆</span> Badges Earned
                </h2>
                {earnedBadges.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {earnedBadges.map((badge) => {
                      const colors = rarityColors[badge.category] || rarityColors.reading;
                      return (
                        <div
                          key={badge.badgeId}
                          className={`bg-charcoal/50 rounded-xl p-4 border ${colors.border} hover:border-brass/40 transition-all text-center group cursor-pointer`}
                        >
                          <div className="text-4xl mb-2 group-hover:scale-110 transition-transform">
                            {badge.emoji}
                          </div>
                          <p className="font-medium text-sm text-cream">{badge.name}</p>
                          <p className="text-xs text-cream/40 mt-1">{badge.description}</p>
                          <p
                            className={`text-xs mt-2 px-2 py-0.5 rounded-full inline-block capitalize ${colors.bg} ${colors.text}`}
                          >
                            {badge.category}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="bg-charcoal/30 rounded-xl p-8 text-center border border-bronze/10">
                    <div className="text-4xl mb-2">🎯</div>
                    <p className="text-cream/60">Keep reading to earn your first badge!</p>
                  </div>
                )}
              </section>
            </ScrollReveal>

            {/* Badges to Unlock */}
            <ScrollReveal variant="slideLeft" delay={0.2}>
              <section>
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-cream">
                  <span>🔒</span> Badges to Unlock
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {lockedBadges.slice(0, 8).map((badge) => (
                    <div
                      key={badge.badgeId}
                      className="bg-charcoal/30 rounded-xl p-4 border border-bronze/10 text-center opacity-60"
                    >
                      <div className="text-4xl mb-2 grayscale">{badge.emoji}</div>
                      <p className="font-medium text-sm text-cream/60">{badge.name}</p>
                      <p className="text-xs text-cream/30 mt-1">{badge.description}</p>
                    </div>
                  ))}
                </div>
                {lockedBadges.length > 8 && (
                  <p className="text-center text-cream/40 text-sm mt-4">
                    +{lockedBadges.length - 8} more badges to discover
                  </p>
                )}
              </section>
            </ScrollReveal>

            {/* Reading History */}
            <ScrollReveal variant="slideLeft" delay={0.3}>
              <section>
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-cream">
                  <span>📚</span> Reading History
                </h2>
                {readingHistory.length > 0 ? (
                  <div className="space-y-3">
                    {readingHistory.map((book) => (
                      <Link key={book.id} href={`/book/${book.id}`}>
                        <div className="bg-charcoal/50 rounded-lg p-4 border border-bronze/20 hover:border-brass/40 transition-all flex items-center gap-4 group">
                          <div className="w-12 h-16 rounded overflow-hidden shadow">
                            <img
                              src={getBookCover(book, 'S')}
                              alt={book.title}
                              className="w-full h-full object-cover"
                              onError={(e) => { e.currentTarget.src = getPlaceholderCover(); }}
                            />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-medium text-cream group-hover:text-brass transition-colors">{book.title}</h3>
                            <p className="text-sm text-cream/50">{book.author}</p>
                          </div>
                          <div className="text-right">
                            <div className="text-library-green-light text-lg">✓</div>
                            <p className="text-xs text-cream/40">Completed</p>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="bg-charcoal/30 rounded-xl p-8 text-center border border-bronze/10">
                    <div className="text-4xl mb-2">📖</div>
                    <p className="text-cream/60">No books completed yet. Start reading!</p>
                  </div>
                )}
              </section>
            </ScrollReveal>

            {/* To Read */}
            {toReadBooks.length > 0 && (
              <ScrollReveal variant="slideLeft" delay={0.4}>
                <section>
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-cream">
                    <span>📋</span> To Read ({toReadBooks.length})
                  </h2>
                  <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 sm:gap-3">
                    {toReadBooks.slice(0, 16).map((book) => (
                      <BookThumbnail key={book.id} book={book} />
                    ))}
                    {toReadBooks.length > 16 && (
                      <Link
                        href="/books"
                        className="aspect-[2/3] rounded-lg bg-bronze/30 flex items-center justify-center text-cream/40 hover:text-cream hover:bg-bronze/50 transition-colors"
                      >
                        <span className="text-sm">+{toReadBooks.length - 16}</span>
                      </Link>
                    )}
                  </div>
                </section>
              </ScrollReveal>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <ScrollReveal variant="slideRight">
              <section className="bg-charcoal/50 rounded-xl p-6 border border-bronze/20">
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-cream">
                  <span>📊</span> Reading Stats
                </h2>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-cream/60">Books Read</span>
                    <span className="font-bold text-cream">{completedCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-cream/60">To Read</span>
                    <span className="font-bold text-cream">{toReadBooks.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-cream/60">Progress</span>
                    <span className="font-bold text-brass">{progressPercent}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-cream/60">Total Points</span>
                    <span className="font-bold text-lamp">{totalPoints} XP</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-cream/60">Current Level</span>
                    <span className="font-bold text-library-green-light">{currentLevel.level}</span>
                  </div>
                </div>
              </section>
            </ScrollReveal>

            <ScrollReveal variant="slideRight" delay={0.1}>
              <section className="bg-charcoal/50 rounded-xl p-6 border border-bronze/20">
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-cream">
                  <span>🎯</span> Level Perks
                </h2>
                <div className="space-y-3">
                  {currentLevel.perks.map((perk, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <span className="text-brass">✓</span>
                      <span className="text-cream/80">{perk}</span>
                    </div>
                  ))}
                  {LEVELS.filter(l => l.level > currentLevel.level).slice(0, 2).map(level => (
                    <div key={level.level} className="flex items-center gap-2 text-sm opacity-50">
                      <span className="text-cream/30">🔒</span>
                      <span className="text-cream/40">Level {level.level}: {level.perks[0]}</span>
                    </div>
                  ))}
                </div>
              </section>
            </ScrollReveal>

            <ScrollReveal variant="slideRight" delay={0.2}>
              <section className="bg-gradient-to-br from-brass/20 to-lamp/10 rounded-xl p-6 border border-brass/20">
                <h2 className="text-lg font-bold mb-2 text-cream">Next Milestone</h2>
                <p className="text-cream/60 text-sm mb-4">
                  {completedCount < 5
                    ? `Read ${5 - completedCount} more book${5 - completedCount > 1 ? 's' : ''} to unlock Bookworm badge!`
                    : completedCount < 10
                    ? `Read ${10 - completedCount} more books to unlock Bibliophile badge!`
                    : 'Keep exploring new challenges!'}
                </p>
                <div className="w-full bg-bronze/30 rounded-full h-2">
                  <div
                    className="bg-brass h-2 rounded-full transition-all"
                    style={{
                      width: `${Math.min(100, (completedCount / (completedCount < 5 ? 5 : 10)) * 100)}%`
                    }}
                  />
                </div>
              </section>
            </ScrollReveal>
          </div>
        </div>
      </div>
    </main>
  );
}

// Book thumbnail component
function BookThumbnail({ book }: { book: Book }) {
  const [error, setError] = useState(false);

  return (
    <Link href={`/book/${book.id}`} className="group">
      <div className="aspect-[2/3] rounded-lg overflow-hidden bg-bronze/30 shadow-md group-hover:scale-105 group-hover:shadow-lg transition-all">
        <img
          src={error ? getPlaceholderCover() : getBookCover(book, 'S')}
          alt={book.title}
          className="w-full h-full object-cover"
          onError={() => setError(true)}
        />
      </div>
    </Link>
  );
}
