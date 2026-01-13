'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface ReadingProgress {
  currentChapter: number;
  totalChapters: number;
  lastUpdated: string;
}

interface MemberProgress {
  userId: string;
  userName: string;
  userAvatar?: string;
  currentChapter: number;
  totalChapters: number;
  updatedAt: string;
}

const LOCAL_STORAGE_KEY = 'bookclub_reading_progress';

// Default chapter counts for books (can be updated per book)
const BOOK_CHAPTERS: Record<string, number> = {
  'standalone_we_dont_talk_about_carol': 24,
  // Add more books as needed
};

// Local storage helpers for unauthenticated users
function getLocalProgress(): Record<string, ReadingProgress> {
  if (typeof window === 'undefined') return {};
  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

function saveLocalProgress(progress: Record<string, ReadingProgress>) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(progress));
}

export function useReadingProgress(bookId: string, userId?: string, userName?: string) {
  const [progress, setProgress] = useState<ReadingProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const totalChapters = BOOK_CHAPTERS[bookId] || 20;

  // Load progress on mount
  useEffect(() => {
    async function loadProgress() {
      setIsLoading(true);

      if (userId) {
        // Authenticated: load from Supabase
        try {
          const res = await fetch(`/api/progress?bookId=${bookId}`);
          const json = await res.json();

          if (json.data) {
            const myProgress = json.data.find((p: MemberProgress) => p.userId === userId);
            if (myProgress) {
              setProgress({
                currentChapter: myProgress.currentChapter,
                totalChapters: myProgress.totalChapters,
                lastUpdated: myProgress.updatedAt,
              });
            } else {
              // No progress yet, initialize
              setProgress({
                currentChapter: 1,
                totalChapters,
                lastUpdated: new Date().toISOString(),
              });
            }
          }
        } catch (err) {
          console.error('Failed to load progress from server:', err);
          // Fall back to localStorage
          const local = getLocalProgress()[bookId];
          setProgress(local || {
            currentChapter: 1,
            totalChapters,
            lastUpdated: new Date().toISOString(),
          });
        }
      } else {
        // Unauthenticated: use localStorage
        const local = getLocalProgress()[bookId];
        setProgress(local || {
          currentChapter: 1,
          totalChapters,
          lastUpdated: new Date().toISOString(),
        });
      }

      setIsLoading(false);
    }

    loadProgress();
  }, [bookId, userId, totalChapters]);

  // Save progress to server (debounced)
  // NOTE: Server gets userId from session, not request body (security fix)
  const saveToServer = useCallback(async (chapter: number) => {
    if (!userId) return;

    setIsSaving(true);
    try {
      await fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin', // Ensure cookies are sent for auth
        body: JSON.stringify({
          // userId removed - server gets it from session
          bookId,
          currentChapter: chapter,
          totalChapters,
        }),
      });
    } catch (err) {
      console.error('Failed to save progress to server:', err);
    }
    setIsSaving(false);
  }, [userId, bookId, totalChapters]);

  const updateChapter = useCallback((chapter: number) => {
    const validChapter = Math.max(1, Math.min(chapter, totalChapters));
    const newProgress: ReadingProgress = {
      currentChapter: validChapter,
      totalChapters,
      lastUpdated: new Date().toISOString(),
    };

    setProgress(newProgress);

    // Save to localStorage (always, as backup)
    const allProgress = getLocalProgress();
    allProgress[bookId] = newProgress;
    saveLocalProgress(allProgress);

    // Debounce server save to avoid too many requests
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      saveToServer(validChapter);
    }, 500);
  }, [bookId, totalChapters, saveToServer]);

  const incrementChapter = useCallback(() => {
    if (progress && progress.currentChapter < totalChapters) {
      updateChapter(progress.currentChapter + 1);
    }
  }, [progress, totalChapters, updateChapter]);

  const decrementChapter = useCallback(() => {
    if (progress && progress.currentChapter > 1) {
      updateChapter(progress.currentChapter - 1);
    }
  }, [progress, updateChapter]);

  const percentComplete = progress
    ? Math.round((progress.currentChapter / progress.totalChapters) * 100)
    : 0;

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  return {
    progress,
    isLoading,
    isSaving,
    updateChapter,
    incrementChapter,
    decrementChapter,
    percentComplete,
    totalChapters,
  };
}

// Hook to get all members' progress for a book
export function useClubProgress(bookId: string) {
  const [members, setMembers] = useState<MemberProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadClubProgress() {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/progress?bookId=${bookId}`);
        const json = await res.json();
        if (json.data) {
          setMembers(json.data);
        }
      } catch (err) {
        console.error('Failed to load club progress:', err);
      }
      setIsLoading(false);
    }

    loadClubProgress();
  }, [bookId]);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(`/api/progress?bookId=${bookId}`);
      const json = await res.json();
      if (json.data) {
        setMembers(json.data);
      }
    } catch (err) {
      console.error('Failed to refresh club progress:', err);
    }
  }, [bookId]);

  return { members, isLoading, refresh };
}

// Helper for backwards compatibility
export function getAllReadingProgress(): Record<string, ReadingProgress> {
  return getLocalProgress();
}
