import { describe, it, expect, beforeEach } from 'vitest';
import {
  initializeSeriesState,
  getAppMode,
  pickNextBook,
  completeBook,
  decideSeries,
  getBookEligibility,
  createInitialState,
} from './picker';
import { Book, AppState } from './types';

const testBooks: Book[] = [
  { id: 'standalone_1', title: 'Standalone One', author: 'Author A', genres: ['Fiction'], series: null },
  { id: 'standalone_2', title: 'Standalone Two', author: 'Author B', genres: ['Mystery'], series: null },
  { id: 'series_a_1', title: 'Series A Book 1', author: 'Author C', genres: ['Fantasy'], series: { name: 'Series A', order: 1, total: 3 } },
  { id: 'series_a_2', title: 'Series A Book 2', author: 'Author C', genres: ['Fantasy'], series: { name: 'Series A', order: 2, total: 3 } },
  { id: 'series_a_3', title: 'Series A Book 3', author: 'Author C', genres: ['Fantasy'], series: { name: 'Series A', order: 3, total: 3 } },
  { id: 'series_b_1', title: 'Series B Book 1', author: 'Author D', genres: ['Thriller'], series: { name: 'Series B', order: 1, total: 2 } },
  { id: 'series_b_2', title: 'Series B Book 2', author: 'Author D', genres: ['Thriller'], series: { name: 'Series B', order: 2, total: 2 } },
];

describe('initializeSeriesState', () => {
  it('should create unstarted state for each series', () => {
    const state = initializeSeriesState(testBooks);

    expect(state['Series A']).toEqual({ status: 'unstarted', nextOrder: 1 });
    expect(state['Series B']).toEqual({ status: 'unstarted', nextOrder: 1 });
    expect(Object.keys(state)).toHaveLength(2);
  });
});

describe('getAppMode', () => {
  let state: AppState;

  beforeEach(() => {
    state = createInitialState(testBooks);
  });

  it('should return random_draw when no series active and no pending decision', () => {
    const mode = getAppMode(state);
    expect(mode.mode).toBe('random_draw');
  });

  it('should return decision_required when pendingDecision is set', () => {
    state.pendingDecision = 'Series A';
    const mode = getAppMode(state);

    expect(mode.mode).toBe('decision_required');
    expect(mode.seriesName).toBe('Series A');
  });

  it('should return series_lock when a series is active', () => {
    state.seriesState['Series A'] = { status: 'active', nextOrder: 2 };
    const mode = getAppMode(state);

    expect(mode.mode).toBe('series_lock');
    expect(mode.seriesName).toBe('Series A');
    expect(mode.nextOrder).toBe(2);
  });

  it('should prioritize decision_required over series_lock', () => {
    state.pendingDecision = 'Series A';
    state.seriesState['Series B'] = { status: 'active', nextOrder: 2 };
    const mode = getAppMode(state);

    expect(mode.mode).toBe('decision_required');
  });
});

describe('pickNextBook', () => {
  let state: AppState;

  beforeEach(() => {
    state = createInitialState(testBooks);
  });

  it('should only include standalones and Book 1s in eligible pool', () => {
    // Run many picks to verify only eligible books are selected
    const selectedIds = new Set<string>();
    for (let i = 0; i < 100; i++) {
      const result = pickNextBook(testBooks, state);
      if (result.book) selectedIds.add(result.book.id);
    }

    // Should include standalones and book 1s
    expect(selectedIds.has('standalone_1') || selectedIds.size > 0).toBe(true);

    // Should NOT include book 2+ of any series
    expect(selectedIds.has('series_a_2')).toBe(false);
    expect(selectedIds.has('series_a_3')).toBe(false);
    expect(selectedIds.has('series_b_2')).toBe(false);
  });

  it('should return forced pick from active series', () => {
    state.seriesState['Series A'] = { status: 'active', nextOrder: 2 };

    const result = pickNextBook(testBooks, state);

    expect(result.forced).toBe(true);
    expect(result.book?.id).toBe('series_a_2');
    expect(result.reason).toContain('Continuing');
  });

  it('should exclude paused series from random pool', () => {
    state.seriesState['Series A'] = { status: 'paused', nextOrder: 2 };

    for (let i = 0; i < 50; i++) {
      const result = pickNextBook(testBooks, state);
      expect(result.book?.series?.name).not.toBe('Series A');
    }
  });

  it('should exclude dropped series from random pool', () => {
    state.seriesState['Series A'] = { status: 'dropped', nextOrder: 2 };

    for (let i = 0; i < 50; i++) {
      const result = pickNextBook(testBooks, state);
      expect(result.book?.series?.name).not.toBe('Series A');
    }
  });

  it('should return null when no eligible books', () => {
    // Complete all standalones
    state.completedBookIds = ['standalone_1', 'standalone_2'];
    // Drop all series
    state.seriesState['Series A'] = { status: 'dropped', nextOrder: 1 };
    state.seriesState['Series B'] = { status: 'dropped', nextOrder: 1 };

    const result = pickNextBook(testBooks, state);

    expect(result.book).toBeNull();
    expect(result.eligibleCount).toBe(0);
  });
});

describe('completeBook', () => {
  let state: AppState;

  beforeEach(() => {
    state = createInitialState(testBooks);
  });

  it('should add book to completed list', () => {
    const newState = completeBook(testBooks, state, 'standalone_1');

    expect(newState.completedBookIds).toContain('standalone_1');
  });

  it('should trigger pendingDecision after completing Book 1 of series', () => {
    const newState = completeBook(testBooks, state, 'series_a_1');

    expect(newState.pendingDecision).toBe('Series A');
  });

  it('should NOT trigger pendingDecision for standalones', () => {
    const newState = completeBook(testBooks, state, 'standalone_1');

    expect(newState.pendingDecision).toBeNull();
  });

  it('should advance nextOrder when completing active series book', () => {
    state.seriesState['Series A'] = { status: 'active', nextOrder: 2 };

    const newState = completeBook(testBooks, state, 'series_a_2');

    expect(newState.seriesState['Series A'].nextOrder).toBe(3);
  });
});

describe('decideSeries', () => {
  let state: AppState;

  beforeEach(() => {
    state = createInitialState(testBooks);
    state.pendingDecision = 'Series A';
  });

  it('should set series to active on continue', () => {
    const newState = decideSeries(state, 'Series A', 'continue');

    expect(newState.seriesState['Series A'].status).toBe('active');
    expect(newState.seriesState['Series A'].nextOrder).toBe(2);
    expect(newState.pendingDecision).toBeNull();
  });

  it('should set series to paused on pause', () => {
    const newState = decideSeries(state, 'Series A', 'pause');

    expect(newState.seriesState['Series A'].status).toBe('paused');
    expect(newState.pendingDecision).toBeNull();
  });

  it('should set series to dropped on drop', () => {
    const newState = decideSeries(state, 'Series A', 'drop');

    expect(newState.seriesState['Series A'].status).toBe('dropped');
    expect(newState.pendingDecision).toBeNull();
  });
});

describe('getBookEligibility', () => {
  let state: AppState;

  beforeEach(() => {
    state = createInitialState(testBooks);
  });

  it('should mark completed books as ineligible', () => {
    state.completedBookIds = ['standalone_1'];

    const result = getBookEligibility(testBooks[0], state);

    expect(result.eligible).toBe(false);
    expect(result.reason).toBe('Already completed');
  });

  it('should mark standalones as eligible', () => {
    const result = getBookEligibility(testBooks[0], state);

    expect(result.eligible).toBe(true);
  });

  it('should mark Book 1 of unstarted series as eligible', () => {
    const book1 = testBooks.find(b => b.id === 'series_a_1')!;
    const result = getBookEligibility(book1, state);

    expect(result.eligible).toBe(true);
  });

  it('should mark Book 2+ of unstarted series as ineligible', () => {
    const book2 = testBooks.find(b => b.id === 'series_a_2')!;
    const result = getBookEligibility(book2, state);

    expect(result.eligible).toBe(false);
    expect(result.reason).toContain('must complete earlier books');
  });

  it('should mark dropped series as ineligible', () => {
    state.seriesState['Series A'] = { status: 'dropped', nextOrder: 1 };
    const book1 = testBooks.find(b => b.id === 'series_a_1')!;

    const result = getBookEligibility(book1, state);

    expect(result.eligible).toBe(false);
    expect(result.reason).toContain('dropped');
  });
});
