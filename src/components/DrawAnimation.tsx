'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Book } from '@/lib/types';
import { BookCard } from './BookCard';

interface DrawAnimationProps {
  books: Book[];
  selectedBook: Book | null;
  isForced: boolean;
  isDrawing: boolean;
  onDrawComplete: () => void;
}

export function DrawAnimation({
  books,
  selectedBook,
  isForced,
  isDrawing,
  onDrawComplete,
}: DrawAnimationProps) {
  const [phase, setPhase] = useState<'idle' | 'shuffling' | 'revealing'>('idle');
  const [shuffleIndex, setShuffleIndex] = useState(0);

  const startAnimation = useCallback(() => {
    if (!selectedBook) return;

    if (isForced) {
      // Lock snap animation for forced picks
      setPhase('revealing');
      setTimeout(() => {
        onDrawComplete();
      }, 600);
    } else {
      // Shuffle animation for random picks
      setPhase('shuffling');
      let count = 0;
      const shuffleInterval = setInterval(() => {
        setShuffleIndex(Math.floor(Math.random() * books.length));
        count++;
        if (count >= 12) {
          clearInterval(shuffleInterval);
          setPhase('revealing');
          setTimeout(() => {
            onDrawComplete();
          }, 600);
        }
      }, 100);
    }
  }, [selectedBook, isForced, books.length, onDrawComplete]);

  useEffect(() => {
    if (isDrawing && selectedBook) {
      startAnimation();
    } else if (!isDrawing) {
      setPhase('idle');
    }
  }, [isDrawing, selectedBook, startAnimation]);

  if (!selectedBook) return null;

  return (
    <AnimatePresence mode="wait">
      {phase === 'shuffling' && (
        <motion.div
          key="shuffling"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="relative"
        >
          {/* Shuffling cards */}
          <div className="relative h-48 flex items-center justify-center overflow-hidden">
            {[-2, -1, 0, 1, 2].map((offset) => {
              const idx = (shuffleIndex + offset + books.length) % books.length;
              const book = books[idx];
              return (
                <motion.div
                  key={`shuffle-${offset}`}
                  animate={{
                    x: offset * 60,
                    scale: offset === 0 ? 1 : 0.8,
                    opacity: offset === 0 ? 1 : 0.4,
                    rotateY: offset * 10,
                  }}
                  transition={{ duration: 0.1 }}
                  className="absolute bg-white/10 backdrop-blur-lg rounded-xl p-4 w-48"
                >
                  <p className="text-white font-medium truncate">{book.title}</p>
                  <p className="text-gray-400 text-sm truncate">{book.author}</p>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}

      {phase === 'revealing' && (
        <motion.div
          key="revealing"
          initial={isForced ? { scale: 1.1, boxShadow: '0 0 60px rgba(102, 126, 234, 0.8)' } : { rotateY: -90, scale: 0.9 }}
          animate={{ scale: 1, rotateY: 0, boxShadow: '0 0 0 rgba(102, 126, 234, 0)' }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="max-w-md mx-auto"
        >
          <BookCard book={selectedBook} state={null} isRevealed={true} size="lg" />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
