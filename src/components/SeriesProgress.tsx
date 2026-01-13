'use client';

import { Book, AppState } from '@/lib/types';
import { getSeriesProgress } from '@/lib/picker';

interface SeriesProgressProps {
  books: Book[];
  state: AppState | null;
  seriesName: string;
  onResume?: () => void;
  onPause?: () => void;
}

export function SeriesProgress({ books, state, seriesName, onResume, onPause }: SeriesProgressProps) {
  if (!state) return null;

  const progress = getSeriesProgress(books, state, seriesName);
  const percentage = (progress.completed / progress.total) * 100;

  const statusColors = {
    unstarted: 'text-gray-400',
    active: 'text-emerald-400',
    paused: 'text-amber-400',
    dropped: 'text-red-400',
  };

  return (
    <div className="bg-white/5 rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-medium text-white">{seriesName}</h4>
        <span className={`text-sm ${statusColors[progress.status as keyof typeof statusColors]}`}>
          {progress.status.toUpperCase()}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-white/10 rounded-full overflow-hidden mb-2">
        <div
          className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-400">
          {progress.completed} / {progress.total} books
        </span>

        {/* Action buttons */}
        {progress.status === 'paused' && onResume && (
          <button
            onClick={onResume}
            className="text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            Resume
          </button>
        )}
        {progress.status === 'active' && onPause && (
          <button
            onClick={onPause}
            className="text-amber-400 hover:text-amber-300 transition-colors"
          >
            Pause
          </button>
        )}
      </div>
    </div>
  );
}
