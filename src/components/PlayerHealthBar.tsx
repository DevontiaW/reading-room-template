'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { getUserStats } from '@/lib/gamification/service';
import { getLevelProgress } from '@/lib/gamification/config';
import type { UserStats } from '@/lib/gamification/types';

export function PlayerHealthBar() {
  const { status, user } = useAuth();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      if (user?.id) {
        const userStats = await getUserStats(user.id);
        setStats(userStats);
      }
      setIsLoading(false);
    }

    if (status === 'authenticated' && user) {
      loadStats();
    } else {
      setIsLoading(false);
    }
  }, [status, user]);

  // Don't render if not authenticated or loading
  if (status !== 'authenticated' || !user || isLoading) {
    return null;
  }

  // Use stats if available, otherwise show defaults
  const totalPoints = stats?.totalPoints ?? 0;
  const currentLevel = stats?.currentLevel ?? 1;
  const levelTitle = stats?.levelTitle ?? 'Curious Reader';
  const progressPercent = getLevelProgress(totalPoints);
  const nextLevelPoints = stats?.nextLevelPoints ?? 250;

  // Health bar color based on progress (green -> yellow -> red as it depletes... but reversed since we're filling up)
  const getBarColor = (percent: number) => {
    if (percent >= 75) return 'from-emerald-500 to-emerald-400';
    if (percent >= 50) return 'from-lime-500 to-lime-400';
    if (percent >= 25) return 'from-amber-500 to-amber-400';
    return 'from-primary to-amber-500';
  };

  return (
    <div className="hidden sm:flex items-center gap-3">
      {/* Health Bar Container - Fighting game style */}
      <div className="relative">
        {/* Level badge */}
        <div className="absolute -left-2 -top-1 z-10 bg-stone-900 border-2 border-primary rounded-full w-7 h-7 flex items-center justify-center shadow-lg">
          <span className="text-xs font-bold text-primary">{currentLevel}</span>
        </div>

        {/* Main bar container */}
        <div className="relative ml-4">
          {/* Points display above bar */}
          <div className="flex items-center justify-between mb-0.5 px-1">
            <span className="text-[10px] text-gray-400 font-medium">{levelTitle}</span>
            <span className="text-[10px] text-primary font-bold">{totalPoints} XP</span>
          </div>

          {/* Health bar frame - fighting game style with beveled edges */}
          <div className="relative w-32 h-4 bg-stone-950 rounded-sm border border-stone-600 overflow-hidden shadow-inner">
            {/* Background pattern (like classic arcade) */}
            <div className="absolute inset-0 opacity-20">
              <div className="w-full h-full" style={{
                backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 4px, rgba(0,0,0,0.3) 4px, rgba(0,0,0,0.3) 5px)'
              }} />
            </div>

            {/* Health bar fill */}
            <div
              className={`absolute inset-y-0 left-0 bg-gradient-to-r ${getBarColor(progressPercent)} transition-all duration-500 ease-out`}
              style={{ width: `${progressPercent}%` }}
            >
              {/* Shine effect */}
              <div className="absolute inset-0 bg-gradient-to-b from-white/30 via-transparent to-black/20" />
            </div>

            {/* Segment lines (arcade style) */}
            <div className="absolute inset-0 flex">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="flex-1 border-r border-stone-800/50 last:border-r-0" />
              ))}
            </div>

            {/* Top highlight */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-b from-white/10 to-transparent" />
          </div>

          {/* Next level indicator */}
          <div className="flex justify-end mt-0.5 px-1">
            <span className="text-[9px] text-gray-500">
              {nextLevelPoints - totalPoints > 0 ? `${nextLevelPoints - totalPoints} to next` : 'MAX'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Compact version for mobile (shows in dropdown or elsewhere)
export function PlayerHealthBarCompact() {
  const { status, user } = useAuth();
  const [stats, setStats] = useState<UserStats | null>(null);

  useEffect(() => {
    async function loadStats() {
      if (user?.id) {
        const userStats = await getUserStats(user.id);
        setStats(userStats);
      }
    }

    if (status === 'authenticated' && user) {
      loadStats();
    }
  }, [status, user]);

  if (status !== 'authenticated' || !user) {
    return null;
  }

  const totalPoints = stats?.totalPoints ?? 0;
  const currentLevel = stats?.currentLevel ?? 1;
  const levelTitle = stats?.levelTitle ?? 'Curious Reader';
  const progressPercent = getLevelProgress(totalPoints);

  return (
    <div className="px-4 py-3 border-b border-stone-700 bg-stone-800/50">
      <div className="flex items-center gap-3">
        {/* Level */}
        <div className="bg-primary/20 border border-primary/50 rounded-full w-8 h-8 flex items-center justify-center">
          <span className="text-sm font-bold text-primary">{currentLevel}</span>
        </div>

        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-300 font-medium">{levelTitle}</span>
            <span className="text-xs text-primary font-bold">{totalPoints} XP</span>
          </div>

          {/* Progress bar */}
          <div className="h-2 bg-stone-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-amber-500 transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
