// Client-side notification helper
// Sends notifications to Discord via API route

type NotificationType =
  | 'book_picked'
  | 'book_completed'
  | 'series_completed'
  | 'member_joined'
  | 'reading_goal_set'
  | 'level_up'
  | 'badge_earned'
  | 'new_remark'
  | 'announcement';

async function sendNotification(type: NotificationType, params: Record<string, unknown>): Promise<boolean> {
  try {
    const response = await fetch('/api/discord', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, ...params }),
    });

    return response.ok;
  } catch (error) {
    console.error('Failed to send notification:', error);
    return false;
  }
}

// ============================================
// NOTIFICATION FUNCTIONS
// ============================================

export async function notifyBookPicked(params: {
  bookTitle: string;
  bookAuthor: string;
  coverUrl?: string;
  pickedBy: string;
  isSeriesBook?: boolean;
  seriesName?: string;
  seriesPosition?: string;
  reason?: string;
}) {
  return sendNotification('book_picked', params);
}

export async function notifyBookCompleted(params: {
  bookTitle: string;
  bookAuthor: string;
  coverUrl?: string;
  completedBy: string;
  userAvatar?: string;
  totalBooksRead?: number;
}) {
  return sendNotification('book_completed', params);
}

export async function notifySeriesCompleted(params: {
  seriesName: string;
  totalBooks: number;
  completedBy: string;
  userAvatar?: string;
}) {
  return sendNotification('series_completed', params);
}

export async function notifyMemberJoined(params: {
  displayName: string;
  avatarUrl?: string;
  memberCount?: number;
}) {
  return sendNotification('member_joined', params);
}

export async function notifyReadingGoalSet(params: {
  displayName: string;
  avatarUrl?: string;
  goal: number;
}) {
  return sendNotification('reading_goal_set', params);
}

export async function notifyLevelUp(params: {
  displayName: string;
  avatarUrl?: string;
  newLevel: number;
  levelTitle: string;
  totalPoints: number;
}) {
  return sendNotification('level_up', params);
}

export async function notifyBadgeEarned(params: {
  displayName: string;
  avatarUrl?: string;
  badgeName: string;
  badgeEmoji: string;
  badgeDescription: string;
}) {
  return sendNotification('badge_earned', params);
}

export async function notifyNewRemark(params: {
  displayName: string;
  avatarUrl?: string;
  bookTitle: string;
  bookId: string;
  remarkPreview: string;
  rating?: number;
}) {
  return sendNotification('new_remark', params);
}

export async function sendAnnouncement(params: {
  title: string;
  message: string;
  imageUrl?: string;
}) {
  return sendNotification('announcement', params);
}
