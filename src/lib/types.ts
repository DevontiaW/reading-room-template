export interface Series {
  name: string;
  order: number;
  total: number;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  genres: string[];
  series: Series | null;
  description?: string;
  coverUrl?: string;
}

export type SeriesStatus = 'unstarted' | 'active' | 'paused' | 'dropped';

export interface SeriesState {
  status: SeriesStatus;
  nextOrder: number;
}

export interface AppState {
  id: string;
  completedBookIds: string[];
  seriesState: Record<string, SeriesState>;
  currentPickId: string | null;
  pendingDecision: string | null; // series name awaiting decision after pilot
  updatedAt: string;
}

export interface Remark {
  id: string;
  bookId: string;
  userName: string;
  rating: number | null;
  note: string;
  createdAt: string;
}

export interface PickResult {
  book: Book | null;
  forced: boolean;
  reason: string;
  eligibleCount: number;
}

export type AppMode = 'series_lock' | 'random_draw' | 'decision_required';

export interface AppModeInfo {
  mode: AppMode;
  seriesName?: string;
  nextOrder?: number;
}
