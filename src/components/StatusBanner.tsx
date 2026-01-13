'use client';

import { AppModeInfo } from '@/lib/types';

interface StatusBannerProps {
  mode: AppModeInfo | null;
}

export function StatusBanner({ mode }: StatusBannerProps) {
  if (!mode) return null;

  const bannerStyles = {
    series_lock: 'bg-gradient-to-r from-purple-600 to-indigo-600',
    random_draw: 'bg-gradient-to-r from-emerald-600 to-teal-600',
    decision_required: 'bg-gradient-to-r from-amber-500 to-orange-500',
  };

  const icons = {
    series_lock: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
    random_draw: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    ),
    decision_required: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
  };

  const messages = {
    series_lock: `Series Lock Active: ${mode.seriesName} (Book ${mode.nextOrder})`,
    random_draw: 'Random Draw Available',
    decision_required: `Decision Required: ${mode.seriesName}`,
  };

  return (
    <div className={`${bannerStyles[mode.mode]} px-4 py-3 rounded-xl flex items-center gap-3 text-white shadow-lg`}>
      <span className="p-2 bg-white/20 rounded-lg">
        {icons[mode.mode]}
      </span>
      <span className="font-medium">{messages[mode.mode]}</span>
    </div>
  );
}
