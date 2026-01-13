import { Book, AppState, PickResult, AppModeInfo, SeriesState } from './types';

/**
 * Initialize series state from books.
 * Every series starts as 'unstarted' with nextOrder=1
 */
export function initializeSeriesState(books: Book[]): Record<string, SeriesState> {
  const seriesState: Record<string, SeriesState> = {};

  for (const book of books) {
    if (book.series && !seriesState[book.series.name]) {
      seriesState[book.series.name] = {
        status: 'unstarted',
        nextOrder: 1,
      };
    }
  }

  return seriesState;
}

/**
 * Get the current app mode based on state.
 */
export function getAppMode(state: AppState): AppModeInfo {
  // Priority 1: Decision required (after completing a pilot)
  if (state.pendingDecision) {
    return {
      mode: 'decision_required',
      seriesName: state.pendingDecision,
    };
  }

  // Priority 2: Check for active series
  for (const [seriesName, seriesInfo] of Object.entries(state.seriesState)) {
    if (seriesInfo.status === 'active') {
      return {
        mode: 'series_lock',
        seriesName,
        nextOrder: seriesInfo.nextOrder,
      };
    }
  }

  // Default: Random draw available
  return { mode: 'random_draw' };
}

/**
 * Get the next book to read based on current state.
 * Implements all the picking rules.
 */
export function pickNextBook(books: Book[], state: AppState): PickResult {
  const completedSet = new Set(state.completedBookIds);

  // Rule 1: If any series is ACTIVE, return next book in that series (forced)
  for (const [seriesName, seriesInfo] of Object.entries(state.seriesState)) {
    if (seriesInfo.status === 'active') {
      const nextBook = books.find(
        b => b.series?.name === seriesName &&
             b.series.order === seriesInfo.nextOrder &&
             !completedSet.has(b.id)
      );

      if (nextBook) {
        return {
          book: nextBook,
          forced: true,
          reason: `Continuing "${seriesName}" series (Book ${seriesInfo.nextOrder})`,
          eligibleCount: 1,
        };
      }

      // Series is active but no next book found - shouldn't happen in normal flow
      // This means we completed the series
    }
  }

  // Rule 2: Build eligible pool for random selection
  const eligible: Book[] = [];

  for (const book of books) {
    // Skip completed books
    if (completedSet.has(book.id)) continue;

    // Standalone books are always eligible
    if (!book.series) {
      eligible.push(book);
      continue;
    }

    // Series books: check status
    const seriesInfo = state.seriesState[book.series.name];

    // Skip paused or dropped series
    if (seriesInfo?.status === 'paused' || seriesInfo?.status === 'dropped') {
      continue;
    }

    // Only Book 1 of unstarted series is eligible
    if (book.series.order === 1 && (!seriesInfo || seriesInfo.status === 'unstarted')) {
      eligible.push(book);
    }

    // Book 2+ is never eligible in random pool (must come through active series)
  }

  if (eligible.length === 0) {
    return {
      book: null,
      forced: false,
      reason: 'No eligible books remaining!',
      eligibleCount: 0,
    };
  }

  // Random pick from eligible pool
  const pick = eligible[Math.floor(Math.random() * eligible.length)];

  const reason = pick.series
    ? `Randomly selected Book 1 of "${pick.series.name}" from ${eligible.length} options`
    : `Randomly selected from ${eligible.length} eligible books`;

  return {
    book: pick,
    forced: false,
    reason,
    eligibleCount: eligible.length,
  };
}

/**
 * Mark a book as completed and update series state.
 * Returns the updated state (new object, does not mutate).
 */
export function completeBook(
  books: Book[],
  state: AppState,
  bookId: string
): AppState {
  const book = books.find(b => b.id === bookId);
  if (!book) return state;

  const newState: AppState = {
    ...state,
    completedBookIds: [...state.completedBookIds, bookId],
    currentPickId: null,
    updatedAt: new Date().toISOString(),
  };

  // If this is Book 1 of a series (pilot), trigger decision
  if (book.series && book.series.order === 1) {
    const seriesInfo = state.seriesState[book.series.name];
    if (!seriesInfo || seriesInfo.status === 'unstarted') {
      newState.pendingDecision = book.series.name;
    }
  }

  // If series is active and we completed the current book, advance nextOrder
  if (book.series) {
    const seriesInfo = state.seriesState[book.series.name];
    if (seriesInfo?.status === 'active' && seriesInfo.nextOrder === book.series.order) {
      newState.seriesState = {
        ...state.seriesState,
        [book.series.name]: {
          ...seriesInfo,
          nextOrder: seriesInfo.nextOrder + 1,
        },
      };

      // Check if series is now complete
      if (seriesInfo.nextOrder + 1 > book.series.total) {
        newState.seriesState[book.series.name] = {
          status: 'unstarted', // Reset to allow re-read in future
          nextOrder: 1,
        };
      }
    }
  }

  return newState;
}

/**
 * Make a decision on a series after completing the pilot.
 */
export function decideSeries(
  state: AppState,
  seriesName: string,
  decision: 'continue' | 'pause' | 'drop'
): AppState {
  const newState: AppState = {
    ...state,
    pendingDecision: null,
    updatedAt: new Date().toISOString(),
    seriesState: { ...state.seriesState },
  };

  switch (decision) {
    case 'continue':
      newState.seriesState[seriesName] = {
        status: 'active',
        nextOrder: 2, // Pilot was Book 1, so next is 2
      };
      break;
    case 'pause':
      newState.seriesState[seriesName] = {
        status: 'paused',
        nextOrder: 2,
      };
      break;
    case 'drop':
      newState.seriesState[seriesName] = {
        status: 'dropped',
        nextOrder: 2,
      };
      break;
  }

  return newState;
}

/**
 * Resume a paused series.
 */
export function resumeSeries(state: AppState, seriesName: string): AppState {
  const seriesInfo = state.seriesState[seriesName];
  if (!seriesInfo || seriesInfo.status !== 'paused') return state;

  return {
    ...state,
    updatedAt: new Date().toISOString(),
    seriesState: {
      ...state.seriesState,
      [seriesName]: {
        ...seriesInfo,
        status: 'active',
      },
    },
  };
}

/**
 * Pause an active series.
 */
export function pauseSeries(state: AppState, seriesName: string): AppState {
  const seriesInfo = state.seriesState[seriesName];
  if (!seriesInfo || seriesInfo.status !== 'active') return state;

  return {
    ...state,
    updatedAt: new Date().toISOString(),
    seriesState: {
      ...state.seriesState,
      [seriesName]: {
        ...seriesInfo,
        status: 'paused',
      },
    },
  };
}

/**
 * Get eligibility status for a book.
 */
export function getBookEligibility(
  book: Book,
  state: AppState
): { eligible: boolean; reason: string } {
  const completedSet = new Set(state.completedBookIds);

  if (completedSet.has(book.id)) {
    return { eligible: false, reason: 'Already completed' };
  }

  if (!book.series) {
    return { eligible: true, reason: 'Standalone - eligible' };
  }

  const seriesInfo = state.seriesState[book.series.name];

  if (seriesInfo?.status === 'dropped') {
    return { eligible: false, reason: `Series "${book.series.name}" was dropped` };
  }

  if (seriesInfo?.status === 'paused') {
    return { eligible: false, reason: `Series "${book.series.name}" is paused` };
  }

  if (seriesInfo?.status === 'active') {
    if (book.series.order === seriesInfo.nextOrder) {
      return { eligible: true, reason: `Next in active series "${book.series.name}"` };
    }
    return { eligible: false, reason: `Not next in series (need Book ${seriesInfo.nextOrder})` };
  }

  // Unstarted series
  if (book.series.order === 1) {
    return { eligible: true, reason: 'Book 1 - eligible for random selection' };
  }

  return { eligible: false, reason: `Book ${book.series.order} - must complete earlier books first` };
}

/**
 * Get series progress information.
 */
export function getSeriesProgress(
  books: Book[],
  state: AppState,
  seriesName: string
): { completed: number; total: number; status: string } {
  const seriesBooks = books.filter(b => b.series?.name === seriesName);
  const completedSet = new Set(state.completedBookIds);
  const completed = seriesBooks.filter(b => completedSet.has(b.id)).length;
  const total = seriesBooks.length;
  const status = state.seriesState[seriesName]?.status || 'unstarted';

  return { completed, total, status };
}

/**
 * Create initial app state.
 */
export function createInitialState(books: Book[]): AppState {
  return {
    id: 'global',
    completedBookIds: [],
    seriesState: initializeSeriesState(books),
    currentPickId: null,
    pendingDecision: null,
    updatedAt: new Date().toISOString(),
  };
}
