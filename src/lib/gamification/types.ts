// ============================================
// GAMIFICATION TYPES
// ============================================

// User with gamification data
export interface User {
  id: string;
  displayName: string;
  discordId?: string;
  email?: string;
  avatarUrl?: string;
  currentLevel: number;
  totalPoints: number;
  currentStreak: number;
  longestStreak: number;
  lastActiveAt: string;
  joinedAt: string;
}

// Level definition
export interface Level {
  level: number;
  title: string;
  pointsRequired: number;
  description: string;
  perks: string[];
}

// Point transaction
export interface PointTransaction {
  id: string;
  userId: string;
  action: PointAction;
  points: number;
  bookId?: string;
  description?: string;
  createdAt: string;
}

// Point action types
export type PointAction =
  | 'book_complete'
  | 'series_book_complete'
  | 'series_complete'
  | 'remark_left'
  | 'rating_left'
  | 'daily_checkin'
  | 'streak_7_day'
  | 'streak_14_day'
  | 'streak_30_day'
  | 'thoughtful_remark'
  | 'vote_cast'
  | 'manual_adjustment';

// Badge definition
export interface BadgeDefinition {
  badgeId: string;
  emoji: string;
  name: string;
  description: string;
  criteria: BadgeCriteria;
  category: BadgeCategory;
  sortOrder: number;
}

export type BadgeCategory = 'reading' | 'social' | 'streak' | 'special';

export interface BadgeCriteria {
  type: string;
  count?: number;
  days?: number;
  minWords?: number;
  maxDays?: number;
  reason?: string;
}

// User's earned badge
export interface UserBadge {
  id: string;
  userId: string;
  badgeId: string;
  unlockedAt: string;
  notified: boolean;
  // Joined with badge_definitions
  badge?: BadgeDefinition;
}

// Reading progress
export interface ReadingProgress {
  id: string;
  userId: string;
  bookId: string;
  status: ReadingStatus;
  currentChapter: number;
  totalChapters?: number;
  percentComplete: number;
  startedAt?: string;
  completedAt?: string;
  updatedAt: string;
}

export type ReadingStatus = 'not_started' | 'reading' | 'completed' | 'dnf';

// Vote session
export interface Vote {
  id: string;
  voteType: VoteType;
  subject: string;
  question: string;
  options: string[];
  eligibleUserIds: string[];
  openedAt: string;
  closesAt: string;
  closedEarlyAt?: string;
  status: VoteStatus;
  result?: string;
  resultCounts?: Record<string, number>;
  discordMessageId?: string;
  createdBy?: string;
}

export type VoteType = 'series_decision' | 'book_nomination' | 'custom';
export type VoteStatus = 'open' | 'closed' | 'cancelled';

// Individual vote response
export interface VoteResponse {
  id: string;
  voteId: string;
  userId: string;
  choice: string;
  votedAt: string;
}

// Leaderboard entry
export interface LeaderboardEntry {
  id: string;
  displayName: string;
  avatarUrl?: string;
  totalPoints: number;
  currentLevel: number;
  levelTitle: string;
  currentStreak: number;
  longestStreak: number;
  badgeCount: number;
  booksCompleted: number;
  joinedAt: string;
}

// User stats (for profile/dashboard)
export interface UserStats {
  userId: string;
  displayName: string;
  totalPoints: number;
  currentLevel: number;
  levelTitle: string;
  currentLevelPoints: number;
  nextLevelPoints: number;
  pointsToNextLevel: number;
  currentStreak: number;
  longestStreak: number;
  booksCompleted: number;
  remarksLeft: number;
  badgesEarned: number;
  votesCast: number;
}

// Progress bar data
export interface ProgressBars {
  book?: {
    title: string;
    currentChapter: number;
    totalChapters: number;
    percentComplete: number;
  };
  level: {
    currentLevel: number;
    levelTitle: string;
    currentPoints: number;
    nextLevelPoints: number;
    progressPercent: number;
  };
  streak: {
    currentStreak: number;
    nextMilestone: number;
    progressPercent: number;
    nextBadge?: string;
  };
}
