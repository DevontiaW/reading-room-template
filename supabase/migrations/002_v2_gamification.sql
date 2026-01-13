-- C&W Book Club V2 Schema: Gamification + Voting + Progress
-- Run this in Supabase SQL Editor after 001_initial_schema.sql
-- Safe to re-run: uses IF NOT EXISTS and ON CONFLICT

-- ============================================
-- 1. USERS (Real identity, replaces localStorage names)
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name TEXT NOT NULL,
  discord_id TEXT UNIQUE,                    -- For DM notifications
  email TEXT UNIQUE,                         -- For magic link auth (optional)
  avatar_url TEXT,                           -- Profile picture
  current_level INT DEFAULT 1,               -- Cached level (1-7)
  total_points INT DEFAULT 0,                -- Cached point total
  current_streak INT DEFAULT 0,              -- Current consecutive days
  longest_streak INT DEFAULT 0,              -- Personal best
  last_active_at TIMESTAMPTZ DEFAULT NOW(),  -- For streak + nudge calculation
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION touch_users_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_touch_users ON users;
CREATE TRIGGER trg_touch_users
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION touch_users_updated_at();

-- ============================================
-- 2. LEVELS CONFIG (Reference table)
-- ============================================
CREATE TABLE IF NOT EXISTS levels (
  level INT PRIMARY KEY,
  title TEXT NOT NULL,
  points_required INT NOT NULL,
  description TEXT,
  perks JSONB DEFAULT '[]'::jsonb
);

-- Seed level data
INSERT INTO levels (level, title, points_required, description, perks) VALUES
  (1, 'Curious Reader', 0, 'Just getting started', '["Access to book club"]'::jsonb),
  (2, 'Page Turner', 250, 'Building momentum', '["Can nominate books"]'::jsonb),
  (3, 'Chapter Chaser', 500, 'Committed to the journey', '["Vote weight +1"]'::jsonb),
  (4, 'Story Seeker', 1000, 'A true reader emerges', '["Custom badge color"]'::jsonb),
  (5, 'Tome Guardian', 2000, 'Keeper of knowledge', '["Can create discussions"]'::jsonb),
  (6, 'Library Keeper', 3500, 'Master of the stacks', '["Moderator abilities"]'::jsonb),
  (7, 'Loremaster', 5000, 'Legendary status achieved', '["Hall of Fame"]'::jsonb)
ON CONFLICT (level) DO UPDATE SET
  title = EXCLUDED.title,
  points_required = EXCLUDED.points_required,
  description = EXCLUDED.description,
  perks = EXCLUDED.perks;

-- ============================================
-- 3. POINTS LEDGER (Every point transaction)
-- ============================================
CREATE TABLE IF NOT EXISTS points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,              -- 'book_complete', 'remark', 'streak_bonus', etc.
  points INT NOT NULL,               -- Can be negative for penalties
  book_id TEXT,                      -- Reference if book-related
  description TEXT,                  -- Human-readable reason
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_points_user ON points(user_id);
CREATE INDEX IF NOT EXISTS idx_points_created ON points(created_at DESC);

-- Point action types (for reference)
COMMENT ON TABLE points IS 'Point values:
  book_complete = +100
  series_book_complete = +150
  series_complete = +500
  remark_left = +10
  rating_left = +5
  daily_checkin = +5
  streak_7_day = +50
  streak_30_day = +200
  thoughtful_remark = +25 (200+ words)
';

-- ============================================
-- 4. ACHIEVEMENTS / BADGES
-- ============================================
CREATE TABLE IF NOT EXISTS badge_definitions (
  badge_id TEXT PRIMARY KEY,
  emoji TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  criteria JSONB NOT NULL,           -- Machine-readable unlock conditions
  category TEXT DEFAULT 'general',   -- 'reading', 'social', 'streak', 'special'
  sort_order INT DEFAULT 0
);

-- Seed badges
INSERT INTO badge_definitions (badge_id, emoji, name, description, criteria, category, sort_order) VALUES
  ('first_blood', '🩸', 'First Blood', 'Complete your first book', '{"type": "books_completed", "count": 1}'::jsonb, 'reading', 1),
  ('bookworm', '📚', 'Bookworm', 'Complete 5 books', '{"type": "books_completed", "count": 5}'::jsonb, 'reading', 2),
  ('bibliophile', '📖', 'Bibliophile', 'Complete 10 books', '{"type": "books_completed", "count": 10}'::jsonb, 'reading', 3),
  ('series_slayer', '⚔️', 'Series Slayer', 'Finish an entire series', '{"type": "series_completed", "count": 1}'::jsonb, 'reading', 4),
  ('series_master', '🏰', 'Series Master', 'Finish 3 complete series', '{"type": "series_completed", "count": 3}'::jsonb, 'reading', 5),
  ('critic', '🎭', 'Critic', 'Leave 10 remarks', '{"type": "remarks_left", "count": 10}'::jsonb, 'social', 10),
  ('thoughtful', '💭', 'Thoughtful', 'Leave a remark over 200 words', '{"type": "long_remark", "min_words": 200}'::jsonb, 'social', 11),
  ('conversationalist', '💬', 'Conversationalist', 'Leave 25 remarks', '{"type": "remarks_left", "count": 25}'::jsonb, 'social', 12),
  ('streak_starter', '🔥', 'Streak Starter', '7-day activity streak', '{"type": "streak", "days": 7}'::jsonb, 'streak', 20),
  ('blazing', '🌟', 'Blazing', '14-day activity streak', '{"type": "streak", "days": 14}'::jsonb, 'streak', 21),
  ('unstoppable', '💥', 'Unstoppable', '30-day activity streak', '{"type": "streak", "days": 30}'::jsonb, 'streak', 22),
  ('speed_demon', '⚡', 'Speed Demon', 'Finish a book in under 7 days', '{"type": "fast_read", "max_days": 7}'::jsonb, 'special', 30),
  ('decider', '⚖️', 'Decider', 'Cast 5 series votes', '{"type": "votes_cast", "count": 5}'::jsonb, 'social', 13),
  ('ride_or_die', '💀', 'Ride or Die', '6 months in the club', '{"type": "membership_days", "days": 180}'::jsonb, 'special', 31),
  ('founder', '👑', 'Founder', 'Original book club member', '{"type": "manual", "reason": "founding member"}'::jsonb, 'special', 40)
ON CONFLICT (badge_id) DO UPDATE SET
  emoji = EXCLUDED.emoji,
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  criteria = EXCLUDED.criteria,
  category = EXCLUDED.category,
  sort_order = EXCLUDED.sort_order;

-- User's unlocked badges
CREATE TABLE IF NOT EXISTS user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  badge_id TEXT NOT NULL REFERENCES badge_definitions(badge_id),
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  notified BOOLEAN DEFAULT FALSE,    -- Have we told Discord yet?
  UNIQUE(user_id, badge_id)
);

CREATE INDEX IF NOT EXISTS idx_user_badges_user ON user_badges(user_id);

-- ============================================
-- 5. READING PROGRESS (Per user per book)
-- ============================================
CREATE TABLE IF NOT EXISTS reading_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  book_id TEXT NOT NULL,
  status TEXT DEFAULT 'not_started', -- 'not_started', 'reading', 'completed', 'dnf'
  current_chapter INT DEFAULT 0,
  total_chapters INT,
  percent_complete INT DEFAULT 0,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, book_id)
);

CREATE INDEX IF NOT EXISTS idx_progress_user ON reading_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_progress_book ON reading_progress(book_id);
CREATE INDEX IF NOT EXISTS idx_progress_status ON reading_progress(status);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION touch_progress_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_touch_progress ON reading_progress;
CREATE TRIGGER trg_touch_progress
BEFORE UPDATE ON reading_progress
FOR EACH ROW EXECUTE FUNCTION touch_progress_updated_at();

-- ============================================
-- 6. VOTING SYSTEM
-- ============================================

-- Vote sessions (e.g., "Should we continue Quantico Files?")
CREATE TABLE IF NOT EXISTS votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vote_type TEXT NOT NULL,                   -- 'series_decision', 'book_nomination', 'custom'
  subject TEXT NOT NULL,                     -- Series name or book ID
  question TEXT NOT NULL,                    -- "Should we continue reading Quantico Files?"
  options JSONB NOT NULL DEFAULT '["continue", "pause", "drop"]'::jsonb,
  eligible_user_ids JSONB NOT NULL,          -- Snapshot of who can vote at open time
  opened_at TIMESTAMPTZ DEFAULT NOW(),
  closes_at TIMESTAMPTZ NOT NULL,            -- When voting ends
  closed_early_at TIMESTAMPTZ,               -- If manually closed
  status TEXT DEFAULT 'open',                -- 'open', 'closed', 'cancelled'
  result TEXT,                               -- Winning option
  result_counts JSONB,                       -- {"continue": 2, "pause": 1}
  discord_message_id TEXT,                   -- For updating the Discord message
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_votes_status ON votes(status);
CREATE INDEX IF NOT EXISTS idx_votes_closes ON votes(closes_at);

-- Individual vote responses
CREATE TABLE IF NOT EXISTS vote_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vote_id UUID NOT NULL REFERENCES votes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  choice TEXT NOT NULL,
  voted_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(vote_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_vote_responses_vote ON vote_responses(vote_id);

-- ============================================
-- 7. NOTIFICATION LOG (Track what we've sent)
-- ============================================
CREATE TABLE IF NOT EXISTS notification_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  notification_type TEXT NOT NULL,   -- 'nudge', 'badge_unlock', 'vote_reminder', 'digest'
  channel TEXT,                      -- 'discord_dm', 'discord_channel', 'email'
  target TEXT,                       -- Discord channel ID or user ID
  message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  success BOOLEAN DEFAULT TRUE,
  error_message TEXT
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notification_log(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notification_log(notification_type);
CREATE INDEX IF NOT EXISTS idx_notifications_sent ON notification_log(sent_at DESC);

-- ============================================
-- 8. ENHANCED REMARKS (Add user_id link)
-- ============================================
ALTER TABLE remarks ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id);
ALTER TABLE remarks ADD COLUMN IF NOT EXISTS word_count INT DEFAULT 0;

-- ============================================
-- 9. ROW LEVEL SECURITY
-- ============================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE points ENABLE ROW LEVEL SECURITY;
ALTER TABLE badge_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE reading_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE vote_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_log ENABLE ROW LEVEL SECURITY;

-- Read policies (anyone with anon key can read)
DROP POLICY IF EXISTS "read_users" ON users;
CREATE POLICY "read_users" ON users FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "read_levels" ON levels;
CREATE POLICY "read_levels" ON levels FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "read_points" ON points;
CREATE POLICY "read_points" ON points FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "read_badge_definitions" ON badge_definitions;
CREATE POLICY "read_badge_definitions" ON badge_definitions FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "read_user_badges" ON user_badges;
CREATE POLICY "read_user_badges" ON user_badges FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "read_progress" ON reading_progress;
CREATE POLICY "read_progress" ON reading_progress FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "read_votes" ON votes;
CREATE POLICY "read_votes" ON votes FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "read_vote_responses" ON vote_responses;
CREATE POLICY "read_vote_responses" ON vote_responses FOR SELECT TO anon USING (true);

-- Write policies (API routes handle passcode validation)
DROP POLICY IF EXISTS "insert_users" ON users;
CREATE POLICY "insert_users" ON users FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "update_users" ON users;
CREATE POLICY "update_users" ON users FOR UPDATE TO anon USING (true);

DROP POLICY IF EXISTS "insert_points" ON points;
CREATE POLICY "insert_points" ON points FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "insert_user_badges" ON user_badges;
CREATE POLICY "insert_user_badges" ON user_badges FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "update_user_badges" ON user_badges;
CREATE POLICY "update_user_badges" ON user_badges FOR UPDATE TO anon USING (true);

DROP POLICY IF EXISTS "insert_progress" ON reading_progress;
CREATE POLICY "insert_progress" ON reading_progress FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "update_progress" ON reading_progress;
CREATE POLICY "update_progress" ON reading_progress FOR UPDATE TO anon USING (true);

DROP POLICY IF EXISTS "insert_votes" ON votes;
CREATE POLICY "insert_votes" ON votes FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "update_votes" ON votes;
CREATE POLICY "update_votes" ON votes FOR UPDATE TO anon USING (true);

DROP POLICY IF EXISTS "insert_vote_responses" ON vote_responses;
CREATE POLICY "insert_vote_responses" ON vote_responses FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "insert_notifications" ON notification_log;
CREATE POLICY "insert_notifications" ON notification_log FOR INSERT TO anon WITH CHECK (true);

-- ============================================
-- 10. HELPER VIEWS
-- ============================================

-- Leaderboard view
CREATE OR REPLACE VIEW leaderboard AS
SELECT
  u.id,
  u.display_name,
  u.avatar_url,
  u.total_points,
  u.current_level,
  l.title as level_title,
  u.current_streak,
  u.longest_streak,
  (SELECT COUNT(*) FROM user_badges ub WHERE ub.user_id = u.id) as badge_count,
  (SELECT COUNT(*) FROM reading_progress rp WHERE rp.user_id = u.id AND rp.status = 'completed') as books_completed,
  u.joined_at
FROM users u
LEFT JOIN levels l ON l.level = u.current_level
ORDER BY u.total_points DESC, u.joined_at ASC;

-- User stats view
CREATE OR REPLACE VIEW user_stats AS
SELECT
  u.id as user_id,
  u.display_name,
  u.total_points,
  u.current_level,
  l.title as level_title,
  l.points_required as current_level_points,
  COALESCE(next_l.points_required, 999999) as next_level_points,
  COALESCE(next_l.points_required, 999999) - u.total_points as points_to_next_level,
  u.current_streak,
  u.longest_streak,
  (SELECT COUNT(*) FROM reading_progress rp WHERE rp.user_id = u.id AND rp.status = 'completed') as books_completed,
  (SELECT COUNT(*) FROM remarks r WHERE r.user_id = u.id) as remarks_left,
  (SELECT COUNT(*) FROM user_badges ub WHERE ub.user_id = u.id) as badges_earned,
  (SELECT COUNT(*) FROM vote_responses vr WHERE vr.user_id = u.id) as votes_cast
FROM users u
LEFT JOIN levels l ON l.level = u.current_level
LEFT JOIN levels next_l ON next_l.level = u.current_level + 1;

-- ============================================
-- DONE! Run this in Supabase SQL Editor.
-- ============================================
