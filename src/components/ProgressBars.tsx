'use client';

import { motion } from 'framer-motion';
import { ProgressBars as ProgressBarsType } from '@/lib/gamification/types';

interface ProgressBarsProps {
  data: ProgressBarsType;
  compact?: boolean;
}

export function ProgressBars({ data, compact = false }: ProgressBarsProps) {
  if (compact) {
    return <CompactProgressBars data={data} />;
  }

  return (
    <div className="space-y-4">
      {/* Current Book Progress */}
      {data.book && (
        <ProgressCard
          icon="📖"
          title="CURRENT READ"
          subtitle={data.book.title}
          current={data.book.currentChapter}
          max={data.book.totalChapters}
          percent={data.book.percentComplete}
          label={`Ch ${data.book.currentChapter}/${data.book.totalChapters}`}
          color="blue"
        />
      )}

      {/* Level Progress */}
      <ProgressCard
        icon="⭐"
        title="YOUR JOURNEY"
        subtitle={`Level ${data.level.currentLevel}: ${data.level.levelTitle}`}
        current={data.level.currentPoints}
        max={data.level.nextLevelPoints}
        percent={data.level.progressPercent}
        label={`${data.level.currentPoints}/${data.level.nextLevelPoints} pts`}
        color="purple"
      />

      {/* Streak Progress */}
      <ProgressCard
        icon="🔥"
        title="STREAK"
        subtitle={`${data.streak.currentStreak} days${data.streak.nextBadge ? ` · Next: ${data.streak.nextBadge}` : ''}`}
        current={data.streak.currentStreak}
        max={data.streak.nextMilestone}
        percent={data.streak.progressPercent}
        label={`${data.streak.currentStreak}/${data.streak.nextMilestone}`}
        color="orange"
      />
    </div>
  );
}

interface ProgressCardProps {
  icon: string;
  title: string;
  subtitle: string;
  current: number;
  max: number;
  percent: number;
  label: string;
  color: 'blue' | 'purple' | 'orange' | 'green';
}

function ProgressCard({ icon, title, subtitle, percent, label, color }: ProgressCardProps) {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    purple: 'from-purple-500 to-purple-600',
    orange: 'from-orange-500 to-amber-500',
    green: 'from-emerald-500 to-emerald-600',
  };

  const bgColorClasses = {
    blue: 'bg-blue-500/20',
    purple: 'bg-purple-500/20',
    orange: 'bg-orange-500/20',
    green: 'bg-emerald-500/20',
  };

  return (
    <div className="bg-white/5 rounded-xl p-4 border border-white/10">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xl">{icon}</span>
        <span className="text-xs font-bold text-gray-400 tracking-wider">{title}</span>
      </div>
      <p className="text-white font-medium mb-3 truncate">{subtitle}</p>
      <div className="relative h-3 bg-white/10 rounded-full overflow-hidden">
        <motion.div
          className={`absolute inset-y-0 left-0 bg-gradient-to-r ${colorClasses[color]} rounded-full`}
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(percent, 100)}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
      <p className="text-xs text-gray-400 mt-2 text-right">{label}</p>
    </div>
  );
}

function CompactProgressBars({ data }: { data: ProgressBarsType }) {
  return (
    <div className="flex gap-4 items-center">
      {/* Level */}
      <CompactBar
        icon="⭐"
        value={data.level.currentLevel}
        label={data.level.levelTitle}
        percent={data.level.progressPercent}
        color="purple"
      />

      {/* Streak */}
      <CompactBar
        icon="🔥"
        value={data.streak.currentStreak}
        label="day streak"
        percent={data.streak.progressPercent}
        color="orange"
      />

      {/* Points */}
      <div className="text-center">
        <p className="text-2xl font-bold text-white">{data.level.currentPoints}</p>
        <p className="text-xs text-gray-400">points</p>
      </div>
    </div>
  );
}

interface CompactBarProps {
  icon: string;
  value: number;
  label: string;
  percent: number;
  color: 'blue' | 'purple' | 'orange' | 'green';
}

function CompactBar({ icon, value, label, percent, color }: CompactBarProps) {
  const colorClasses = {
    blue: 'bg-blue-500',
    purple: 'bg-purple-500',
    orange: 'bg-orange-500',
    green: 'bg-emerald-500',
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-lg">{icon}</span>
      <div>
        <div className="flex items-baseline gap-1">
          <span className="text-xl font-bold text-white">{value}</span>
          <span className="text-xs text-gray-400">{label}</span>
        </div>
        <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            className={`h-full ${colorClasses[color]} rounded-full`}
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(percent, 100)}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>
    </div>
  );
}

// Badge display component
interface BadgeDisplayProps {
  emoji: string;
  name: string;
  description?: string;
  unlocked?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function BadgeDisplay({ emoji, name, description, unlocked = true, size = 'md' }: BadgeDisplayProps) {
  const sizeClasses = {
    sm: 'w-10 h-10 text-lg',
    md: 'w-14 h-14 text-2xl',
    lg: 'w-20 h-20 text-4xl',
  };

  return (
    <div className={`flex flex-col items-center gap-1 ${!unlocked ? 'opacity-40 grayscale' : ''}`}>
      <div
        className={`${sizeClasses[size]} rounded-full bg-white/10 flex items-center justify-center
          ${unlocked ? 'ring-2 ring-amber-400/50' : ''}`}
      >
        {emoji}
      </div>
      <p className="text-xs font-medium text-white text-center">{name}</p>
      {description && (
        <p className="text-xs text-gray-400 text-center max-w-[100px]">{description}</p>
      )}
    </div>
  );
}

// Leaderboard component
interface LeaderboardProps {
  entries: Array<{
    displayName: string;
    totalPoints: number;
    currentLevel: number;
    levelTitle: string;
    badgeCount: number;
    currentStreak: number;
  }>;
}

export function Leaderboard({ entries }: LeaderboardProps) {
  const medals = ['🥇', '🥈', '🥉'];

  return (
    <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
      <div className="p-4 border-b border-white/10">
        <h3 className="text-lg font-bold text-white">🏆 Leaderboard</h3>
      </div>
      <div className="divide-y divide-white/5">
        {entries.map((entry, index) => (
          <div
            key={entry.displayName}
            className={`flex items-center gap-4 p-4 ${index === 0 ? 'bg-amber-500/10' : ''}`}
          >
            <span className="text-2xl w-8 text-center">
              {medals[index] || `${index + 1}`}
            </span>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-white truncate">{entry.displayName}</p>
              <p className="text-xs text-gray-400">
                Lvl {entry.currentLevel} {entry.levelTitle} · 🔥 {entry.currentStreak}
              </p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-primary">{entry.totalPoints}</p>
              <p className="text-xs text-gray-400">{entry.badgeCount} badges</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
