import { supabase } from '../supabase';
import {
  User,
  UserStats,
  LeaderboardEntry,
  PointAction,
  ReadingProgress,
  UserBadge,
  Vote,
  VoteResponse,
  ProgressBars,
} from './types';
import {
  POINT_VALUES,
  getLevelForPoints,
  getNextLevel,
  getPointsToNextLevel,
  getLevelProgress,
  getNextStreakMilestone,
  getStreakProgress,
  BADGES,
} from './config';

// ============================================
// USER MANAGEMENT
// ============================================

export async function getOrCreateUser(displayName: string, discordId?: string): Promise<User | null> {
  try {
    // Try to find existing user
    let query = supabase.from('users').select('*');

    if (discordId) {
      query = query.eq('discord_id', discordId);
    } else {
      query = query.eq('display_name', displayName);
    }

    const { data: existing, error: findError } = await query.maybeSingle();

    if (existing && !findError) {
      return mapDbUser(existing);
    }

    // Create new user
    const { data: newUser, error } = await supabase
      .from('users')
      .insert({
        display_name: displayName,
        discord_id: discordId,
      })
      .select('*')
      .single();

    if (error) {
      console.error('Error creating user:', error);
      return null;
    }

    return mapDbUser(newUser);
  } catch (err) {
    console.error('Error in getOrCreateUser:', err);
    return null;
  }
}

export async function getUserById(userId: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (error || !data) return null;
  return mapDbUser(data);
}

export async function updateUserActivity(userId: string): Promise<void> {
  const now = new Date();
  const { data: user } = await supabase
    .from('users')
    .select('last_active_at, current_streak, longest_streak')
    .eq('id', userId)
    .single();

  if (!user) return;

  const lastActive = new Date(user.last_active_at);
  const hoursSinceActive = (now.getTime() - lastActive.getTime()) / (1000 * 60 * 60);

  let newStreak = user.current_streak;

  // If more than 48 hours, streak resets
  if (hoursSinceActive > 48) {
    newStreak = 1;
  }
  // If between 20-48 hours (new day), increment streak
  else if (hoursSinceActive >= 20) {
    newStreak = user.current_streak + 1;

    // Check for streak badges
    await checkStreakBadges(userId, newStreak);

    // Award streak points
    if (newStreak === 7) await awardPoints(userId, 'streak_7_day');
    if (newStreak === 14) await awardPoints(userId, 'streak_14_day');
    if (newStreak === 30) await awardPoints(userId, 'streak_30_day');
  }

  await supabase
    .from('users')
    .update({
      last_active_at: now.toISOString(),
      current_streak: newStreak,
      longest_streak: Math.max(newStreak, user.longest_streak),
    })
    .eq('id', userId);
}

// ============================================
// POINTS
// ============================================

export async function awardPoints(
  userId: string,
  action: PointAction,
  bookId?: string,
  description?: string
): Promise<number> {
  const points = POINT_VALUES[action];

  if (points === 0) return 0;

  // Insert point transaction
  await supabase.from('points').insert({
    user_id: userId,
    action,
    points,
    book_id: bookId,
    description: description || getDefaultDescription(action),
  });

  // Update user's total points and level
  const { data: user } = await supabase
    .from('users')
    .select('total_points')
    .eq('id', userId)
    .single();

  const newTotal = (user?.total_points || 0) + points;
  const newLevel = getLevelForPoints(newTotal);

  await supabase
    .from('users')
    .update({
      total_points: newTotal,
      current_level: newLevel.level,
    })
    .eq('id', userId);

  return points;
}

export async function getPointHistory(userId: string, limit = 50): Promise<any[]> {
  const { data } = await supabase
    .from('points')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  return data || [];
}

// ============================================
// BADGES
// ============================================

export async function checkAndAwardBadges(userId: string): Promise<UserBadge[]> {
  const newBadges: UserBadge[] = [];
  const stats = await getUserStats(userId);

  if (!stats) return newBadges;

  // Get already earned badges
  const { data: earnedBadges } = await supabase
    .from('user_badges')
    .select('badge_id')
    .eq('user_id', userId);

  const earnedIds = new Set(earnedBadges?.map(b => b.badge_id) || []);

  for (const badge of BADGES) {
    if (earnedIds.has(badge.badgeId)) continue;

    const earned = checkBadgeCriteria(badge, stats);
    if (earned) {
      const { data: newBadge } = await supabase
        .from('user_badges')
        .insert({
          user_id: userId,
          badge_id: badge.badgeId,
        })
        .select('*')
        .single();

      if (newBadge) {
        newBadges.push({ ...newBadge, badge });
      }
    }
  }

  return newBadges;
}

function checkBadgeCriteria(badge: any, stats: UserStats): boolean {
  const { criteria } = badge;

  switch (criteria.type) {
    case 'books_completed':
      return stats.booksCompleted >= criteria.count;
    case 'remarks_left':
      return stats.remarksLeft >= criteria.count;
    case 'votes_cast':
      return stats.votesCast >= criteria.count;
    case 'streak':
      return stats.currentStreak >= criteria.days || stats.longestStreak >= criteria.days;
    // Other criteria checked elsewhere (series_completed, long_remark, etc.)
    default:
      return false;
  }
}

async function checkStreakBadges(userId: string, streak: number): Promise<void> {
  const streakBadges = [
    { days: 7, badgeId: 'streak_starter' },
    { days: 14, badgeId: 'blazing' },
    { days: 30, badgeId: 'unstoppable' },
  ];

  for (const { days, badgeId } of streakBadges) {
    if (streak >= days) {
      // Check if already earned
      const { data } = await supabase
        .from('user_badges')
        .select('id')
        .eq('user_id', userId)
        .eq('badge_id', badgeId)
        .single();

      if (!data) {
        await supabase.from('user_badges').insert({
          user_id: userId,
          badge_id: badgeId,
        });
      }
    }
  }
}

export async function getUserBadges(userId: string): Promise<UserBadge[]> {
  const { data } = await supabase
    .from('user_badges')
    .select(`
      *,
      badge:badge_definitions(*)
    `)
    .eq('user_id', userId)
    .order('unlocked_at', { ascending: false });

  return data || [];
}

// ============================================
// READING PROGRESS
// ============================================

export async function updateReadingProgress(
  userId: string,
  bookId: string,
  progress: Partial<ReadingProgress>
): Promise<ReadingProgress | null> {
  const now = new Date().toISOString();

  // Check if progress exists
  const { data: existing } = await supabase
    .from('reading_progress')
    .select('*')
    .eq('user_id', userId)
    .eq('book_id', bookId)
    .single();

  if (existing) {
    const { data, error } = await supabase
      .from('reading_progress')
      .update({
        ...progress,
        updated_at: now,
      })
      .eq('id', existing.id)
      .select('*')
      .single();

    if (error) return null;
    return mapDbProgress(data);
  }

  // Create new progress
  const { data, error } = await supabase
    .from('reading_progress')
    .insert({
      user_id: userId,
      book_id: bookId,
      status: 'reading',
      started_at: now,
      ...progress,
    })
    .select('*')
    .single();

  if (error) return null;
  return mapDbProgress(data);
}

export async function completeBook(userId: string, bookId: string, isSeriesBook: boolean): Promise<void> {
  const now = new Date().toISOString();

  await supabase
    .from('reading_progress')
    .upsert({
      user_id: userId,
      book_id: bookId,
      status: 'completed',
      percent_complete: 100,
      completed_at: now,
    });

  // Award points
  const action: PointAction = isSeriesBook ? 'series_book_complete' : 'book_complete';
  await awardPoints(userId, action, bookId);

  // Update activity
  await updateUserActivity(userId);

  // Check for badges
  await checkAndAwardBadges(userId);
}

export async function getUserProgress(userId: string): Promise<ReadingProgress[]> {
  const { data } = await supabase
    .from('reading_progress')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  return (data || []).map(mapDbProgress);
}

// ============================================
// LEADERBOARD & STATS
// ============================================

export async function getLeaderboard(): Promise<LeaderboardEntry[]> {
  const { data } = await supabase
    .from('leaderboard')
    .select('*')
    .limit(50);

  return (data || []).map(row => ({
    id: row.id,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
    totalPoints: row.total_points,
    currentLevel: row.current_level,
    levelTitle: row.level_title,
    currentStreak: row.current_streak,
    longestStreak: row.longest_streak,
    badgeCount: row.badge_count,
    booksCompleted: row.books_completed,
    joinedAt: row.joined_at,
  }));
}

export async function getUserStats(userId: string): Promise<UserStats | null> {
  const { data } = await supabase
    .from('user_stats')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (!data) return null;

  return {
    userId: data.user_id,
    displayName: data.display_name,
    totalPoints: data.total_points,
    currentLevel: data.current_level,
    levelTitle: data.level_title,
    currentLevelPoints: data.current_level_points,
    nextLevelPoints: data.next_level_points,
    pointsToNextLevel: data.points_to_next_level,
    currentStreak: data.current_streak,
    longestStreak: data.longest_streak,
    booksCompleted: data.books_completed,
    remarksLeft: data.remarks_left,
    badgesEarned: data.badges_earned,
    votesCast: data.votes_cast,
  };
}

export async function getProgressBars(userId: string, currentBookId?: string): Promise<ProgressBars> {
  const stats = await getUserStats(userId);

  let bookProgress = undefined;
  if (currentBookId) {
    const { data } = await supabase
      .from('reading_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('book_id', currentBookId)
      .single();

    if (data) {
      bookProgress = {
        title: currentBookId, // You'd want to look up the actual title
        currentChapter: data.current_chapter,
        totalChapters: data.total_chapters || 0,
        percentComplete: data.percent_complete,
      };
    }
  }

  const currentStreak = stats?.currentStreak || 0;
  const nextMilestone = getNextStreakMilestone(currentStreak);

  return {
    book: bookProgress,
    level: {
      currentLevel: stats?.currentLevel || 1,
      levelTitle: stats?.levelTitle || 'Curious Reader',
      currentPoints: stats?.totalPoints || 0,
      nextLevelPoints: stats?.nextLevelPoints || 250,
      progressPercent: getLevelProgress(stats?.totalPoints || 0),
    },
    streak: {
      currentStreak,
      nextMilestone,
      progressPercent: getStreakProgress(currentStreak),
      nextBadge: currentStreak < 7 ? '🔥 Streak Starter' :
                 currentStreak < 14 ? '🌟 Blazing' :
                 currentStreak < 30 ? '💥 Unstoppable' : undefined,
    },
  };
}

// ============================================
// VOTING
// ============================================

export async function createVote(
  voteType: string,
  subject: string,
  question: string,
  durationHours = 48,
  createdBy?: string
): Promise<Vote | null> {
  // Get all current users as eligible voters
  const { data: users } = await supabase.from('users').select('id');
  const eligibleUserIds = users?.map(u => u.id) || [];

  const now = new Date();
  const closesAt = new Date(now.getTime() + durationHours * 60 * 60 * 1000);

  const { data, error } = await supabase
    .from('votes')
    .insert({
      vote_type: voteType,
      subject,
      question,
      eligible_user_ids: eligibleUserIds,
      closes_at: closesAt.toISOString(),
      created_by: createdBy,
    })
    .select('*')
    .single();

  if (error) {
    console.error('Error creating vote:', error);
    return null;
  }

  return mapDbVote(data);
}

export async function castVote(voteId: string, userId: string, choice: string): Promise<boolean> {
  // Check if vote is open and user is eligible
  const { data: vote } = await supabase
    .from('votes')
    .select('*')
    .eq('id', voteId)
    .single();

  if (!vote || vote.status !== 'open') return false;
  if (!vote.eligible_user_ids.includes(userId)) return false;

  const { error } = await supabase
    .from('vote_responses')
    .upsert({
      vote_id: voteId,
      user_id: userId,
      choice,
    });

  if (error) return false;

  // Award points for voting
  await awardPoints(userId, 'vote_cast');

  // Check and award badges
  await checkAndAwardBadges(userId);

  return true;
}

export async function closeVote(voteId: string): Promise<Vote | null> {
  // Get all responses
  const { data: responses } = await supabase
    .from('vote_responses')
    .select('choice')
    .eq('vote_id', voteId);

  // Count votes
  const counts: Record<string, number> = {};
  for (const r of responses || []) {
    counts[r.choice] = (counts[r.choice] || 0) + 1;
  }

  // Determine winner
  let maxVotes = 0;
  let winners: string[] = [];
  for (const [choice, count] of Object.entries(counts)) {
    if (count > maxVotes) {
      maxVotes = count;
      winners = [choice];
    } else if (count === maxVotes) {
      winners.push(choice);
    }
  }

  // Handle tie
  const result = winners.length === 1 ? winners[0] : 'pause'; // Default tie-breaker

  const { data, error } = await supabase
    .from('votes')
    .update({
      status: 'closed',
      result,
      result_counts: counts,
    })
    .eq('id', voteId)
    .select('*')
    .single();

  if (error) return null;
  return mapDbVote(data);
}

export async function getActiveVotes(): Promise<Vote[]> {
  const { data } = await supabase
    .from('votes')
    .select('*')
    .eq('status', 'open')
    .order('closes_at', { ascending: true });

  return (data || []).map(mapDbVote);
}

export async function getVoteResponses(voteId: string): Promise<VoteResponse[]> {
  const { data } = await supabase
    .from('vote_responses')
    .select('*')
    .eq('vote_id', voteId);

  return (data || []).map(r => ({
    id: r.id,
    voteId: r.vote_id,
    userId: r.user_id,
    choice: r.choice,
    votedAt: r.voted_at,
  }));
}

// ============================================
// HELPERS
// ============================================

function mapDbUser(row: any): User {
  return {
    id: row.id,
    displayName: row.display_name,
    discordId: row.discord_id,
    email: row.email,
    avatarUrl: row.avatar_url,
    currentLevel: row.current_level,
    totalPoints: row.total_points,
    currentStreak: row.current_streak,
    longestStreak: row.longest_streak,
    lastActiveAt: row.last_active_at,
    joinedAt: row.joined_at,
  };
}

function mapDbProgress(row: any): ReadingProgress {
  return {
    id: row.id,
    userId: row.user_id,
    bookId: row.book_id,
    status: row.status,
    currentChapter: row.current_chapter,
    totalChapters: row.total_chapters,
    percentComplete: row.percent_complete,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    updatedAt: row.updated_at,
  };
}

function mapDbVote(row: any): Vote {
  return {
    id: row.id,
    voteType: row.vote_type,
    subject: row.subject,
    question: row.question,
    options: row.options,
    eligibleUserIds: row.eligible_user_ids,
    openedAt: row.opened_at,
    closesAt: row.closes_at,
    closedEarlyAt: row.closed_early_at,
    status: row.status,
    result: row.result,
    resultCounts: row.result_counts,
    discordMessageId: row.discord_message_id,
    createdBy: row.created_by,
  };
}

function getDefaultDescription(action: PointAction): string {
  const descriptions: Record<PointAction, string> = {
    book_complete: 'Completed a book',
    series_book_complete: 'Completed a series book',
    series_complete: 'Completed an entire series',
    remark_left: 'Left a remark',
    rating_left: 'Left a rating',
    daily_checkin: 'Daily check-in',
    streak_7_day: '7-day streak bonus',
    streak_14_day: '14-day streak bonus',
    streak_30_day: '30-day streak bonus',
    thoughtful_remark: 'Thoughtful remark (200+ words)',
    vote_cast: 'Cast a vote',
    manual_adjustment: 'Manual adjustment',
  };
  return descriptions[action];
}
