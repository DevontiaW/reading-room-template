// Discord Webhook Integration
// Sends rich embeds for various book club events

// Try both env var names (NEXT_PUBLIC_ for client access, DISCORD_WEBHOOK_URL for server-only)
const WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL || process.env.NEXT_PUBLIC_DISCORD_WEBHOOK_URL || '';

// Color palette for embeds (Discord uses decimal colors)
const COLORS = {
  primary: 0xB45309,    // Amber/terracotta
  success: 0x10B981,    // Emerald
  info: 0x3B82F6,       // Blue
  warning: 0xF59E0B,    // Amber
  purple: 0x8B5CF6,     // Purple for badges
  pink: 0xEC4899,       // Pink for celebrations
};

interface DiscordEmbed {
  title?: string;
  description?: string;
  color?: number;
  thumbnail?: { url: string };
  image?: { url: string };
  fields?: Array<{ name: string; value: string; inline?: boolean }>;
  footer?: { text: string; icon_url?: string };
  timestamp?: string;
  author?: { name: string; icon_url?: string; url?: string };
}

interface DiscordMessage {
  content?: string;
  embeds?: DiscordEmbed[];
  username?: string;
  avatar_url?: string;
}

async function sendWebhook(message: DiscordMessage): Promise<boolean> {
  // Re-check env at runtime (in case it was set after module load)
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL || process.env.NEXT_PUBLIC_DISCORD_WEBHOOK_URL || WEBHOOK_URL;

  if (!webhookUrl) {
    console.warn('[Discord] Webhook URL not configured - checked DISCORD_WEBHOOK_URL and NEXT_PUBLIC_DISCORD_WEBHOOK_URL');
    return false;
  }

  const payload = {
    ...message,
    username: message.username || 'C&W Book Club',
    avatar_url: message.avatar_url || 'https://bookclub2k26.vercel.app/icon.png',
  };

  console.log('[Discord] Sending webhook to:', webhookUrl.substring(0, 50) + '...');

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Discord] Webhook failed:', response.status, errorText);
      return false;
    }

    console.log('[Discord] Webhook sent successfully');
    return true;
  } catch (error) {
    console.error('[Discord] Webhook error:', error);
    return false;
  }
}

// ============================================
// EVENT NOTIFICATIONS
// ============================================

// Book picked from random draw
export async function notifyBookPicked(params: {
  bookTitle: string;
  bookAuthor: string;
  coverUrl?: string;
  pickedBy: string;
  isSeriesBook?: boolean;
  seriesName?: string;
  seriesPosition?: string;
  reason?: string;
}): Promise<boolean> {
  const fields: DiscordEmbed['fields'] = [
    { name: '👤 Picked By', value: params.pickedBy, inline: true },
  ];

  if (params.isSeriesBook && params.seriesName) {
    fields.push({
      name: '📚 Series',
      value: `${params.seriesName} ${params.seriesPosition || ''}`.trim(),
      inline: true
    });
  }

  if (params.reason) {
    fields.push({ name: '🎲 Selection', value: params.reason, inline: false });
  }

  return sendWebhook({
    content: '📖 **New Book Selected!**',
    embeds: [{
      title: params.bookTitle,
      description: `by ${params.bookAuthor}`,
      color: COLORS.primary,
      thumbnail: params.coverUrl ? { url: params.coverUrl } : undefined,
      fields,
      footer: { text: 'C&W Book Club' },
      timestamp: new Date().toISOString(),
    }],
  });
}

// Book completed
export async function notifyBookCompleted(params: {
  bookTitle: string;
  bookAuthor: string;
  coverUrl?: string;
  completedBy: string;
  userAvatar?: string;
  totalBooksRead?: number;
}): Promise<boolean> {
  const fields: DiscordEmbed['fields'] = [];

  if (params.totalBooksRead) {
    fields.push({
      name: '📊 Total Books Read',
      value: `${params.totalBooksRead} books`,
      inline: true
    });
  }

  return sendWebhook({
    content: `🎉 **${params.completedBy}** finished a book!`,
    embeds: [{
      title: `✅ ${params.bookTitle}`,
      description: `by ${params.bookAuthor}`,
      color: COLORS.success,
      thumbnail: params.coverUrl ? { url: params.coverUrl } : undefined,
      fields: fields.length > 0 ? fields : undefined,
      author: {
        name: params.completedBy,
        icon_url: params.userAvatar,
      },
      timestamp: new Date().toISOString(),
    }],
  });
}

// Series completed
export async function notifySeriesCompleted(params: {
  seriesName: string;
  totalBooks: number;
  completedBy: string;
  userAvatar?: string;
}): Promise<boolean> {
  return sendWebhook({
    content: `🏆 **${params.completedBy}** completed an entire series!`,
    embeds: [{
      title: `📚 ${params.seriesName}`,
      description: `All ${params.totalBooks} books completed!`,
      color: COLORS.pink,
      author: {
        name: params.completedBy,
        icon_url: params.userAvatar,
      },
      footer: { text: 'Series Slayer! 🎖️' },
      timestamp: new Date().toISOString(),
    }],
  });
}

// New member joined
export async function notifyMemberJoined(params: {
  displayName: string;
  avatarUrl?: string;
  memberCount?: number;
}): Promise<boolean> {
  return sendWebhook({
    content: '👋 **New member joined the club!**',
    embeds: [{
      title: `Welcome, ${params.displayName}!`,
      description: 'A new reader has joined the book club.',
      color: COLORS.info,
      thumbnail: params.avatarUrl ? { url: params.avatarUrl } : undefined,
      fields: params.memberCount ? [
        { name: '👥 Total Members', value: `${params.memberCount}`, inline: true }
      ] : undefined,
      timestamp: new Date().toISOString(),
    }],
  });
}

// Reading goal set
export async function notifyReadingGoalSet(params: {
  displayName: string;
  avatarUrl?: string;
  goal: number;
}): Promise<boolean> {
  const goalText = params.goal === 1 ? '1 book' : `${params.goal} books`;

  return sendWebhook({
    embeds: [{
      title: `🎯 Reading Goal Set`,
      description: `**${params.displayName}** aims to read **${goalText}** in 2026!`,
      color: COLORS.warning,
      thumbnail: params.avatarUrl ? { url: params.avatarUrl } : undefined,
      timestamp: new Date().toISOString(),
    }],
  });
}

// Level up
export async function notifyLevelUp(params: {
  displayName: string;
  avatarUrl?: string;
  newLevel: number;
  levelTitle: string;
  totalPoints: number;
}): Promise<boolean> {
  return sendWebhook({
    content: `⬆️ **${params.displayName}** leveled up!`,
    embeds: [{
      title: `Level ${params.newLevel}: ${params.levelTitle}`,
      description: `Total XP: ${params.totalPoints.toLocaleString()}`,
      color: COLORS.purple,
      thumbnail: params.avatarUrl ? { url: params.avatarUrl } : undefined,
      timestamp: new Date().toISOString(),
    }],
  });
}

// Badge earned
export async function notifyBadgeEarned(params: {
  displayName: string;
  avatarUrl?: string;
  badgeName: string;
  badgeEmoji: string;
  badgeDescription: string;
}): Promise<boolean> {
  return sendWebhook({
    embeds: [{
      title: `${params.badgeEmoji} Badge Unlocked!`,
      description: `**${params.displayName}** earned the **${params.badgeName}** badge!\n\n_${params.badgeDescription}_`,
      color: COLORS.purple,
      thumbnail: params.avatarUrl ? { url: params.avatarUrl } : undefined,
      timestamp: new Date().toISOString(),
    }],
  });
}

// New discussion comment
export async function notifyNewRemark(params: {
  displayName: string;
  avatarUrl?: string;
  bookTitle: string;
  bookId: string;
  remarkPreview: string;
  rating?: number;
}): Promise<boolean> {
  const stars = params.rating ? '⭐'.repeat(params.rating) : undefined;

  return sendWebhook({
    embeds: [{
      author: {
        name: params.displayName,
        icon_url: params.avatarUrl,
      },
      title: `💬 New comment on "${params.bookTitle}"`,
      description: params.remarkPreview.length > 200
        ? params.remarkPreview.substring(0, 200) + '...'
        : params.remarkPreview,
      color: COLORS.info,
      fields: stars ? [{ name: 'Rating', value: stars, inline: true }] : undefined,
      footer: {
        text: 'View full discussion on the website'
      },
      timestamp: new Date().toISOString(),
    }],
  });
}

// Weekly summary (could be triggered by a cron job)
export async function notifyWeeklySummary(params: {
  booksCompleted: number;
  remarksAdded: number;
  activeMemberCount: number;
  currentBook?: { title: string; author: string };
  topReader?: { name: string; booksRead: number };
}): Promise<boolean> {
  const fields: DiscordEmbed['fields'] = [
    { name: '📚 Books Completed', value: `${params.booksCompleted}`, inline: true },
    { name: '💬 Discussions', value: `${params.remarksAdded}`, inline: true },
    { name: '👥 Active Members', value: `${params.activeMemberCount}`, inline: true },
  ];

  if (params.currentBook) {
    fields.push({
      name: '📖 Currently Reading',
      value: `${params.currentBook.title} by ${params.currentBook.author}`,
      inline: false
    });
  }

  if (params.topReader) {
    fields.push({
      name: '🏆 Top Reader',
      value: `${params.topReader.name} (${params.topReader.booksRead} books)`,
      inline: false
    });
  }

  return sendWebhook({
    content: '📊 **Weekly Book Club Summary**',
    embeds: [{
      title: 'This Week in the Club',
      color: COLORS.primary,
      fields,
      footer: { text: 'Keep reading! 📚' },
      timestamp: new Date().toISOString(),
    }],
  });
}

// Custom announcement
export async function sendAnnouncement(params: {
  title: string;
  message: string;
  color?: number;
  imageUrl?: string;
}): Promise<boolean> {
  return sendWebhook({
    content: '📢 **Announcement**',
    embeds: [{
      title: params.title,
      description: params.message,
      color: params.color || COLORS.primary,
      image: params.imageUrl ? { url: params.imageUrl } : undefined,
      timestamp: new Date().toISOString(),
    }],
  });
}
