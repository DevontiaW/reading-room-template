import { NextRequest, NextResponse } from 'next/server';
import {
  notifyBookPicked,
  notifyBookCompleted,
  notifySeriesCompleted,
  notifyMemberJoined,
  notifyReadingGoalSet,
  notifyLevelUp,
  notifyBadgeEarned,
  notifyNewRemark,
  sendAnnouncement,
} from '@/lib/discord';

// GET /api/discord?test=true - Test the webhook connection
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const isTest = searchParams.get('test') === 'true';

  // Check all possible env var names
  const discordWebhookUrl = process.env.DISCORD_WEBHOOK_URL;
  const nextPublicWebhookUrl = process.env.NEXT_PUBLIC_DISCORD_WEBHOOK_URL;
  const webhookUrl = discordWebhookUrl || nextPublicWebhookUrl;
  const isConfigured = !!webhookUrl;

  // Debug info - show which env vars are set
  const debugInfo = {
    DISCORD_WEBHOOK_URL: discordWebhookUrl ? `SET (${discordWebhookUrl.substring(0, 50)}...)` : 'NOT SET',
    NEXT_PUBLIC_DISCORD_WEBHOOK_URL: nextPublicWebhookUrl ? `SET (${nextPublicWebhookUrl.substring(0, 50)}...)` : 'NOT SET',
    usingUrl: webhookUrl ? 'Yes' : 'No',
    nodeEnv: process.env.NODE_ENV,
  };

  if (!isTest) {
    return NextResponse.json({
      status: 'Discord webhook API ready',
      configured: isConfigured,
      debug: debugInfo,
    });
  }

  if (!isConfigured) {
    return NextResponse.json(
      {
        success: false,
        message: 'Webhook URL not configured. Add DISCORD_WEBHOOK_URL to Vercel environment variables.',
        hint: 'Make sure the variable name is exactly: DISCORD_WEBHOOK_URL (without NEXT_PUBLIC_ prefix for server-side use)',
        debug: debugInfo,
      },
      { status: 500 }
    );
  }

  // Send a test message directly using fetch to see raw response
  try {
    const testPayload = {
      username: 'C&W Book Club',
      avatar_url: 'https://bookclub2k26.vercel.app/icon.png',
      content: '📢 **Announcement**',
      embeds: [{
        title: '🧪 Webhook Test Successful!',
        description: 'Your Discord webhook is connected and working. Book picks, completions, and other events will now appear here.',
        color: 0xB45309,
        timestamp: new Date().toISOString(),
      }],
    };

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testPayload),
    });

    const responseText = await response.text();

    if (response.ok) {
      return NextResponse.json({
        success: true,
        message: 'Test message sent to Discord!',
        httpStatus: response.status,
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          message: 'Discord rejected the webhook request.',
          httpStatus: response.status,
          discordResponse: responseText,
          debug: debugInfo,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to send webhook request.',
        error: error instanceof Error ? error.message : 'Unknown error',
        debug: debugInfo,
      },
      { status: 500 }
    );
  }
}

// POST /api/discord - Send Discord notification
export async function POST(request: NextRequest) {
  // Check webhook configuration first
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL || process.env.NEXT_PUBLIC_DISCORD_WEBHOOK_URL;
  if (!webhookUrl) {
    console.error('Discord webhook URL not configured');
    return NextResponse.json(
      { error: 'Webhook not configured', hint: 'Add DISCORD_WEBHOOK_URL to environment variables' },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const { type, ...params } = body;

    console.log(`[Discord] Received ${type} notification request:`, JSON.stringify(params).substring(0, 200));

    let success = false;

    switch (type) {
      case 'book_picked':
        success = await notifyBookPicked(params);
        break;

      case 'book_completed':
        success = await notifyBookCompleted(params);
        break;

      case 'series_completed':
        success = await notifySeriesCompleted(params);
        break;

      case 'member_joined':
        success = await notifyMemberJoined(params);
        break;

      case 'reading_goal_set':
        success = await notifyReadingGoalSet(params);
        break;

      case 'level_up':
        success = await notifyLevelUp(params);
        break;

      case 'badge_earned':
        success = await notifyBadgeEarned(params);
        break;

      case 'new_remark':
        success = await notifyNewRemark(params);
        break;

      case 'announcement':
        success = await sendAnnouncement(params);
        break;

      default:
        return NextResponse.json(
          { error: `Unknown notification type: ${type}` },
          { status: 400 }
        );
    }

    if (success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { error: 'Failed to send notification' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Discord API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
