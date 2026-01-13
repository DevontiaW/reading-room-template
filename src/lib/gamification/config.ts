import { Level, BadgeDefinition, PointAction } from './types';

// ============================================
// POINT VALUES
// ============================================

export const POINT_VALUES: Record<PointAction, number> = {
  book_complete: 100,
  series_book_complete: 150,    // Book in a series (bonus)
  series_complete: 500,         // Finished entire series (one-time bonus)
  remark_left: 10,
  rating_left: 5,
  daily_checkin: 5,
  streak_7_day: 50,
  streak_14_day: 100,
  streak_30_day: 200,
  thoughtful_remark: 25,        // 200+ word remark
  vote_cast: 5,
  manual_adjustment: 0,         // Admin override
};

// ============================================
// LEVELS
// ============================================

export const LEVELS: Level[] = [
  {
    level: 1,
    title: 'Curious Reader',
    pointsRequired: 0,
    description: 'Just getting started',
    perks: ['Access to book club'],
  },
  {
    level: 2,
    title: 'Page Turner',
    pointsRequired: 250,
    description: 'Building momentum',
    perks: ['Can nominate books'],
  },
  {
    level: 3,
    title: 'Chapter Chaser',
    pointsRequired: 500,
    description: 'Committed to the journey',
    perks: ['Vote weight +1'],
  },
  {
    level: 4,
    title: 'Story Seeker',
    pointsRequired: 1000,
    description: 'A true reader emerges',
    perks: ['Custom badge color'],
  },
  {
    level: 5,
    title: 'Tome Guardian',
    pointsRequired: 2000,
    description: 'Keeper of knowledge',
    perks: ['Can create discussions'],
  },
  {
    level: 6,
    title: 'Library Keeper',
    pointsRequired: 3500,
    description: 'Master of the stacks',
    perks: ['Moderator abilities'],
  },
  {
    level: 7,
    title: 'Loremaster',
    pointsRequired: 5000,
    description: 'Legendary status achieved',
    perks: ['Hall of Fame'],
  },
];

// ============================================
// BADGES
// ============================================

export const BADGES: BadgeDefinition[] = [
  // Reading badges
  {
    badgeId: 'first_blood',
    emoji: '🩸',
    name: 'First Blood',
    description: 'Complete your first book',
    criteria: { type: 'books_completed', count: 1 },
    category: 'reading',
    sortOrder: 1,
  },
  {
    badgeId: 'bookworm',
    emoji: '📚',
    name: 'Bookworm',
    description: 'Complete 5 books',
    criteria: { type: 'books_completed', count: 5 },
    category: 'reading',
    sortOrder: 2,
  },
  {
    badgeId: 'bibliophile',
    emoji: '📖',
    name: 'Bibliophile',
    description: 'Complete 10 books',
    criteria: { type: 'books_completed', count: 10 },
    category: 'reading',
    sortOrder: 3,
  },
  {
    badgeId: 'series_slayer',
    emoji: '⚔️',
    name: 'Series Slayer',
    description: 'Finish an entire series',
    criteria: { type: 'series_completed', count: 1 },
    category: 'reading',
    sortOrder: 4,
  },
  {
    badgeId: 'series_master',
    emoji: '🏰',
    name: 'Series Master',
    description: 'Finish 3 complete series',
    criteria: { type: 'series_completed', count: 3 },
    category: 'reading',
    sortOrder: 5,
  },
  // Social badges
  {
    badgeId: 'critic',
    emoji: '🎭',
    name: 'Critic',
    description: 'Leave 10 remarks',
    criteria: { type: 'remarks_left', count: 10 },
    category: 'social',
    sortOrder: 10,
  },
  {
    badgeId: 'thoughtful',
    emoji: '💭',
    name: 'Thoughtful',
    description: 'Leave a remark over 200 words',
    criteria: { type: 'long_remark', minWords: 200 },
    category: 'social',
    sortOrder: 11,
  },
  {
    badgeId: 'conversationalist',
    emoji: '💬',
    name: 'Conversationalist',
    description: 'Leave 25 remarks',
    criteria: { type: 'remarks_left', count: 25 },
    category: 'social',
    sortOrder: 12,
  },
  {
    badgeId: 'decider',
    emoji: '⚖️',
    name: 'Decider',
    description: 'Cast 5 series votes',
    criteria: { type: 'votes_cast', count: 5 },
    category: 'social',
    sortOrder: 13,
  },
  // Streak badges
  {
    badgeId: 'streak_starter',
    emoji: '🔥',
    name: 'Streak Starter',
    description: '7-day activity streak',
    criteria: { type: 'streak', days: 7 },
    category: 'streak',
    sortOrder: 20,
  },
  {
    badgeId: 'blazing',
    emoji: '🌟',
    name: 'Blazing',
    description: '14-day activity streak',
    criteria: { type: 'streak', days: 14 },
    category: 'streak',
    sortOrder: 21,
  },
  {
    badgeId: 'unstoppable',
    emoji: '💥',
    name: 'Unstoppable',
    description: '30-day activity streak',
    criteria: { type: 'streak', days: 30 },
    category: 'streak',
    sortOrder: 22,
  },
  // Special badges
  {
    badgeId: 'speed_demon',
    emoji: '⚡',
    name: 'Speed Demon',
    description: 'Finish a book in under 7 days',
    criteria: { type: 'fast_read', maxDays: 7 },
    category: 'special',
    sortOrder: 30,
  },
  {
    badgeId: 'ride_or_die',
    emoji: '💀',
    name: 'Ride or Die',
    description: '6 months in the club',
    criteria: { type: 'membership_days', days: 180 },
    category: 'special',
    sortOrder: 31,
  },
  {
    badgeId: 'founder',
    emoji: '👑',
    name: 'Founder',
    description: 'Original book club member',
    criteria: { type: 'manual', reason: 'founding member' },
    category: 'special',
    sortOrder: 40,
  },
];

// ============================================
// STREAK MILESTONES
// ============================================

export const STREAK_MILESTONES = [7, 14, 30, 60, 100];

// ============================================
// VOTING CONFIG
// ============================================

export const VOTE_CONFIG = {
  defaultDurationHours: 48,
  reminderHoursBefore: [24, 6, 1],
  tieBreaker: 'pause' as const,  // What happens on tie
};

// ============================================
// HELPER FUNCTIONS
// ============================================

export function getLevelForPoints(points: number): Level {
  // Find highest level user qualifies for
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (points >= LEVELS[i].pointsRequired) {
      return LEVELS[i];
    }
  }
  return LEVELS[0];
}

export function getNextLevel(currentLevel: number): Level | null {
  const nextIndex = LEVELS.findIndex(l => l.level === currentLevel + 1);
  return nextIndex >= 0 ? LEVELS[nextIndex] : null;
}

export function getPointsToNextLevel(points: number): number {
  const currentLevel = getLevelForPoints(points);
  const nextLevel = getNextLevel(currentLevel.level);
  if (!nextLevel) return 0;
  return nextLevel.pointsRequired - points;
}

export function getLevelProgress(points: number): number {
  const currentLevel = getLevelForPoints(points);
  const nextLevel = getNextLevel(currentLevel.level);
  if (!nextLevel) return 100; // Max level

  const pointsIntoLevel = points - currentLevel.pointsRequired;
  const pointsNeededForLevel = nextLevel.pointsRequired - currentLevel.pointsRequired;
  return Math.round((pointsIntoLevel / pointsNeededForLevel) * 100);
}

export function getNextStreakMilestone(currentStreak: number): number {
  for (const milestone of STREAK_MILESTONES) {
    if (currentStreak < milestone) {
      return milestone;
    }
  }
  return STREAK_MILESTONES[STREAK_MILESTONES.length - 1] + 30; // Beyond max, next is +30
}

export function getStreakProgress(currentStreak: number): number {
  const nextMilestone = getNextStreakMilestone(currentStreak);
  const prevMilestone = STREAK_MILESTONES.filter(m => m < nextMilestone).pop() || 0;
  const progress = currentStreak - prevMilestone;
  const needed = nextMilestone - prevMilestone;
  return Math.round((progress / needed) * 100);
}

export function getBadgeById(badgeId: string): BadgeDefinition | undefined {
  return BADGES.find(b => b.badgeId === badgeId);
}

export function getBadgesByCategory(category: string): BadgeDefinition[] {
  return BADGES.filter(b => b.category === category).sort((a, b) => a.sortOrder - b.sortOrder);
}
