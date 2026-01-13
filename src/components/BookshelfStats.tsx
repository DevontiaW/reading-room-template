'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { getBookCover } from '@/lib/covers';

interface BookshelfStatsProps {
  totalBooks: number;
  completedBooks: number;
  seriesCount: number;
  activeSeriesCount: number;
  currentBookTitle?: string;
  currentBookCover?: string;
}

// Book spine with realistic look
function BookSpine({
  index,
  delay = 0,
  colorScheme = 'read',
  height = 'tall',
}: {
  index: number;
  delay?: number;
  colorScheme?: 'read' | 'unread';
  height?: 'short' | 'medium' | 'tall';
}) {
  const heights = {
    short: 'h-16 sm:h-20',
    medium: 'h-20 sm:h-24',
    tall: 'h-24 sm:h-28',
  };

  const readColors = [
    'from-amber-500 to-amber-700',
    'from-rose-600 to-rose-800',
    'from-emerald-500 to-emerald-700',
    'from-indigo-500 to-indigo-700',
    'from-orange-500 to-orange-700',
    'from-cyan-500 to-cyan-700',
    'from-purple-500 to-purple-700',
    'from-teal-500 to-teal-700',
  ];

  const unreadColors = [
    'from-stone-600 to-stone-700',
    'from-stone-500 to-stone-600',
    'from-zinc-600 to-zinc-700',
  ];

  const colors = colorScheme === 'read' ? readColors : unreadColors;
  const color = colors[index % colors.length];
  const h = heights[height];
  const heightVariants = ['short', 'medium', 'tall'] as const;
  const actualHeight = heights[heightVariants[index % 3]];

  return (
    <motion.div
      initial={{ scaleY: 0, opacity: 0 }}
      whileInView={{ scaleY: 1, opacity: 1 }}
      transition={{ delay: delay + index * 0.03, duration: 0.4, ease: 'easeOut' }}
      viewport={{ once: true }}
      className={`${actualHeight} w-4 sm:w-5 md:w-6 rounded-sm origin-bottom bg-gradient-to-b ${color} relative shadow-md`}
    >
      {/* Spine highlight */}
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-white/10 rounded-l-sm" />
      {/* Title lines */}
      <div className="absolute top-3 left-1 right-1 space-y-1">
        <div className="h-0.5 bg-white/30 rounded" />
        <div className="h-0.5 bg-white/20 rounded w-3/4" />
      </div>
      {/* Bottom detail */}
      <div className="absolute bottom-2 left-1 right-1">
        <div className="h-0.5 bg-white/20 rounded w-1/2 mx-auto" />
      </div>
    </motion.div>
  );
}

// Potted plant for shelf decoration
function ShelfPlant() {
  return (
    <svg viewBox="0 0 40 60" className="w-8 sm:w-10 h-12 sm:h-16">
      <path d="M12 40 L15 55 L25 55 L28 40 Z" fill="#8B4513" />
      <ellipse cx="20" cy="40" rx="10" ry="3" fill="#A0522D" />
      <ellipse cx="20" cy="42" rx="8" ry="2" fill="#3d2817" />
      <path d="M20 42 Q18 30 12 22" stroke="#228B22" strokeWidth="2" fill="none" />
      <path d="M20 42 Q22 28 28 20" stroke="#228B22" strokeWidth="2" fill="none" />
      <ellipse cx="10" cy="20" rx="6" ry="3" fill="#32CD32" transform="rotate(-30 10 20)" />
      <ellipse cx="30" cy="18" rx="6" ry="3" fill="#228B22" transform="rotate(30 30 18)" />
      <ellipse cx="20" cy="15" rx="4" ry="8" fill="#2E8B2E" />
    </svg>
  );
}

// Bookend decoration
function Bookend({ side }: { side: 'left' | 'right' }) {
  return (
    <div className={`w-3 sm:w-4 h-16 sm:h-20 bg-gradient-to-b from-amber-800 to-amber-900 rounded-sm shadow-md ${side === 'right' ? 'transform scale-x-[-1]' : ''}`}>
      <div className="absolute bottom-0 w-full h-2 bg-amber-950 rounded-b-sm" />
    </div>
  );
}

// Currently reading book on display stand
function CurrentBookDisplay({ title, coverUrl }: { title?: string; coverUrl?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.5 }}
      viewport={{ once: true }}
      className="flex flex-col items-center"
    >
      {/* Book stand */}
      <div className="relative">
        {/* Stand base */}
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-20 sm:w-24 h-3 bg-gradient-to-b from-amber-700 to-amber-900 rounded-sm shadow-lg" />
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-16 sm:w-20 h-2 bg-amber-800 rounded-t-sm" />

        {/* Book cover - displayed prominently */}
        <motion.div
          initial={{ rotateY: -30 }}
          whileInView={{ rotateY: -5 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          viewport={{ once: true }}
          className="relative w-16 sm:w-20 md:w-24 aspect-[2/3] rounded-sm shadow-2xl overflow-hidden border-2 border-brass/30"
          style={{ transformStyle: 'preserve-3d', perspective: '500px' }}
        >
          {coverUrl ? (
            <img src={coverUrl} alt={title || 'Current book'} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-brass to-amber-600 flex items-center justify-center">
              <div className="text-walnut/60 text-xs text-center px-1 font-medium">
                {title || 'Reading...'}
              </div>
            </div>
          )}
          {/* Book spine edge */}
          <div className="absolute left-0 top-0 bottom-0 w-2 bg-gradient-to-r from-black/30 to-transparent" />
        </motion.div>
      </div>

      {/* Label */}
      <p className="mt-4 text-brass text-xs sm:text-sm font-medium text-center max-w-[140px] line-clamp-2">
        {title || 'Currently Reading'}
      </p>
    </motion.div>
  );
}

// Small lamp for shelf
function ShelfLamp() {
  return (
    <svg viewBox="0 0 30 50" className="w-6 sm:w-8 h-10 sm:h-12">
      <ellipse cx="15" cy="46" rx="8" ry="3" fill="#2a2420" />
      <rect x="13" y="30" width="4" height="16" fill="#3d3429" />
      <path d="M5 28 Q15 20 25 28 L22 30 L8 30 Z" fill="#2a2420" />
      <ellipse cx="15" cy="28" rx="8" ry="4" fill="#1a1612" />
      <circle cx="15" cy="27" r="3" fill="#FFC300" opacity="0.9" />
      <circle cx="15" cy="27" r="5" fill="#FFC300" opacity="0.3" />
    </svg>
  );
}

// Main bookshelf component
export function BookshelfStats({
  totalBooks,
  completedBooks,
  seriesCount,
  activeSeriesCount,
  currentBookTitle,
  currentBookCover,
}: BookshelfStatsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: '-50px' });

  const unreadCount = totalBooks - completedBooks;

  return (
    <div ref={containerRef} className="py-8">
      {/* The Grand Bookshelf */}
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="relative bg-gradient-to-b from-amber-950/40 to-stone-950/60 rounded-xl p-4 sm:p-6 md:p-8 border border-amber-900/40 shadow-2xl"
        >
          {/* Bookcase top trim */}
          <div className="absolute -top-2 left-4 right-4 h-3 bg-gradient-to-b from-amber-800 to-amber-900 rounded-t-lg" />

          {/* ========== TOP SHELF: Currently Reading ========== */}
          <div className="mb-6 sm:mb-8">
            <p className="text-amber-600/60 text-xs uppercase tracking-widest mb-4 pl-2">Now Reading</p>
            <div className="flex items-end justify-center gap-4 sm:gap-8 px-4 pb-3 min-h-[120px] sm:min-h-[140px]">
              {/* Decorative lamp */}
              <div className="hidden sm:block">
                <ShelfLamp />
              </div>

              {/* THE FEATURED BOOK */}
              <CurrentBookDisplay title={currentBookTitle} coverUrl={currentBookCover} />

              {/* Decorative plant */}
              <div className="hidden sm:block">
                <ShelfPlant />
              </div>
            </div>
            {/* Shelf board */}
            <div className="h-4 bg-gradient-to-b from-amber-700 to-amber-900 rounded shadow-lg relative">
              <div className="absolute inset-0 opacity-30" style={{
                backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 20px, rgba(0,0,0,0.1) 20px, rgba(0,0,0,0.1) 22px)'
              }} />
            </div>
          </div>

          {/* ========== MIDDLE SHELF: Completed Books ========== */}
          <div className="mb-6 sm:mb-8">
            <p className="text-emerald-600/60 text-xs uppercase tracking-widest mb-4 pl-2">
              Completed <span className="text-emerald-500">({completedBooks})</span>
            </p>
            <div className="flex items-end justify-center gap-1 sm:gap-1.5 px-4 pb-2 min-h-[100px] sm:min-h-[120px] flex-wrap">
              {completedBooks > 0 ? (
                <>
                  <Bookend side="left" />
                  {Array.from({ length: Math.min(completedBooks, 12) }).map((_, i) => (
                    <BookSpine key={`read-${i}`} index={i} delay={0.2} colorScheme="read" />
                  ))}
                  {completedBooks > 12 && (
                    <span className="text-cream/55 text-xs ml-2">+{completedBooks - 12}</span>
                  )}
                  <Bookend side="right" />
                </>
              ) : (
                <p className="text-cream/50 text-sm italic">Your completed books will appear here</p>
              )}
            </div>
            {/* Shelf board */}
            <div className="h-4 bg-gradient-to-b from-amber-700 to-amber-900 rounded shadow-lg relative">
              <div className="absolute inset-0 opacity-30" style={{
                backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 20px, rgba(0,0,0,0.1) 20px, rgba(0,0,0,0.1) 22px)'
              }} />
            </div>
          </div>

          {/* ========== BOTTOM SHELF: Ready to Read ========== */}
          <div>
            <p className="text-stone-500/60 text-xs uppercase tracking-widest mb-4 pl-2">
              Ready to Read <span className="text-stone-400">({unreadCount})</span>
            </p>
            <div className="flex items-end justify-center gap-1 sm:gap-1.5 px-4 pb-2 min-h-[100px] sm:min-h-[120px] flex-wrap">
              <Bookend side="left" />
              {Array.from({ length: Math.min(unreadCount, 12) }).map((_, i) => (
                <BookSpine key={`unread-${i}`} index={i} delay={0.4} colorScheme="unread" />
              ))}
              {unreadCount > 12 && (
                <span className="text-cream/55 text-xs ml-2">+{unreadCount - 12}</span>
              )}
              <Bookend side="right" />
              {/* Small plant at end */}
              <div className="ml-2 hidden sm:block">
                <ShelfPlant />
              </div>
            </div>
            {/* Shelf board */}
            <div className="h-4 bg-gradient-to-b from-amber-700 to-amber-900 rounded shadow-lg relative">
              <div className="absolute inset-0 opacity-30" style={{
                backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 20px, rgba(0,0,0,0.1) 20px, rgba(0,0,0,0.1) 22px)'
              }} />
            </div>
          </div>

          {/* Bookcase side panels */}
          <div className="absolute top-0 bottom-0 -left-1 w-3 bg-gradient-to-r from-amber-900 to-amber-800 rounded-l-lg" />
          <div className="absolute top-0 bottom-0 -right-1 w-3 bg-gradient-to-l from-amber-900 to-amber-800 rounded-r-lg" />
        </motion.div>

        {/* Progress summary below */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.8 }}
          className="mt-8 text-center"
        >
          <p className="text-cream/55 text-sm">
            <span className="text-brass font-semibold">{Math.round((completedBooks / totalBooks) * 100)}%</span> through our collection
            {activeSeriesCount > 0 && (
              <span className="text-cream/50"> · {activeSeriesCount} series in progress</span>
            )}
          </p>
        </motion.div>
      </div>
    </div>
  );
}
