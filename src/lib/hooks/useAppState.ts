'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { AppState, Book, SeriesState } from '../types';
import {
  createInitialState,
  pickNextBook,
  completeBook as completeBookLogic,
  decideSeries as decideSeriesLogic,
  pauseSeries as pauseSeriesLogic,
  resumeSeries as resumeSeriesLogic,
  getAppMode,
  initializeSeriesState,
} from '../picker';
import { getRoomPasscode } from '../room';

const LOCAL_KEY = 'bookclub_state';

function loadLocalState(): AppState | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem(LOCAL_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

function saveLocalState(state: AppState) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LOCAL_KEY, JSON.stringify(state));
}

// Convert DB row (snake_case) to app state (camelCase)
function dbToAppState(row: {
  id: string;
  completed_book_ids: string[];
  series_state: Record<string, SeriesState>;
  current_pick_id: string | null;
  pending_decision?: string | null;
  updated_at: string;
}): AppState {
  return {
    id: row.id,
    completedBookIds: row.completed_book_ids || [],
    seriesState: row.series_state || {},
    currentPickId: row.current_pick_id,
    pendingDecision: row.pending_decision || null,
    updatedAt: row.updated_at,
  };
}

// Convert app state to DB format
function appStateToDb(state: AppState) {
  return {
    completed_book_ids: state.completedBookIds,
    series_state: state.seriesState,
    current_pick_id: state.currentPickId,
    pending_decision: state.pendingDecision,
  };
}

export function useAppState(books: Book[]) {
  const [state, setState] = useState<AppState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch state from API
  const fetchState = useCallback(async (): Promise<AppState | null> => {
    try {
      const res = await fetch('/api/state');
      const json = await res.json();

      if (json.error) {
        console.warn('API error:', json.error);
        return null;
      }

      if (json.data) {
        return dbToAppState(json.data);
      }
    } catch (err) {
      console.warn('Fetch error:', err);
    }
    return null;
  }, []);

  // Save state to API
  const saveState = useCallback(async (newState: AppState): Promise<boolean> => {
    const passcode = getRoomPasscode();

    try {
      const res = await fetch('/api/state', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(passcode ? { 'x-room-passcode': passcode } : {}),
        },
        body: JSON.stringify(appStateToDb(newState)),
      });

      const json = await res.json();

      if (json.error) {
        console.warn('Save error:', json.error);
        setError(json.error);
        return false;
      }

      return true;
    } catch (err) {
      console.warn('Save fetch error:', err);
      return false;
    }
  }, []);

  // Initialize state
  useEffect(() => {
    async function init() {
      setIsLoading(true);

      // Try to fetch from API first
      const remoteState = await fetchState();

      if (remoteState) {
        setIsOnline(true);

        // Merge series state with any new series from books
        const bookSeriesState = initializeSeriesState(books);
        const mergedSeriesState = { ...bookSeriesState, ...remoteState.seriesState };

        const merged = {
          ...remoteState,
          seriesState: mergedSeriesState,
        };

        setState(merged);
        saveLocalState(merged);

        // Start polling for updates (every 10 seconds)
        pollRef.current = setInterval(async () => {
          const updated = await fetchState();
          if (updated) {
            setState(updated);
            saveLocalState(updated);
          }
        }, 10000);
      } else {
        // Offline mode - use localStorage
        setIsOnline(false);
        const localState = loadLocalState();

        if (localState) {
          setState(localState);
        } else {
          const initial = createInitialState(books);
          setState(initial);
          saveLocalState(initial);
        }
      }

      setIsLoading(false);
    }

    init();

    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
      }
    };
  }, [books, fetchState]);

  // Persist state helper
  const persistState = useCallback(
    async (newState: AppState) => {
      setState(newState);
      saveLocalState(newState);

      if (isOnline) {
        const success = await saveState(newState);
        if (!success) {
          // Could retry or show error
        }
      }
    },
    [isOnline, saveState]
  );

  // Actions
  const pick = useCallback(() => {
    if (!state) return null;
    return pickNextBook(books, state);
  }, [books, state]);

  const completeBook = useCallback(
    async (bookId: string) => {
      if (!state) return;
      const newState = completeBookLogic(books, state, bookId);
      await persistState(newState);
    },
    [books, state, persistState]
  );

  const decideSeries = useCallback(
    async (seriesName: string, decision: 'continue' | 'pause' | 'drop') => {
      if (!state) return;
      const newState = decideSeriesLogic(state, seriesName, decision);
      await persistState(newState);
    },
    [state, persistState]
  );

  const pauseSeries = useCallback(
    async (seriesName: string) => {
      if (!state) return;
      const newState = pauseSeriesLogic(state, seriesName);
      await persistState(newState);
    },
    [state, persistState]
  );

  const resumeSeries = useCallback(
    async (seriesName: string) => {
      if (!state) return;
      const newState = resumeSeriesLogic(state, seriesName);
      await persistState(newState);
    },
    [state, persistState]
  );

  const setCurrentPick = useCallback(
    async (bookId: string | null) => {
      if (!state) return;
      const newState = {
        ...state,
        currentPickId: bookId,
        updatedAt: new Date().toISOString(),
      };
      await persistState(newState);
    },
    [state, persistState]
  );

  const resetState = useCallback(async () => {
    const initial = createInitialState(books);
    await persistState(initial);
  }, [books, persistState]);

  const refreshState = useCallback(async () => {
    const updated = await fetchState();
    if (updated) {
      setState(updated);
      saveLocalState(updated);
    }
  }, [fetchState]);

  return {
    state,
    isLoading,
    isOnline,
    error,
    mode: state ? getAppMode(state) : null,
    pick,
    completeBook,
    decideSeries,
    pauseSeries,
    resumeSeries,
    setCurrentPick,
    resetState,
    refreshState,
  };
}
