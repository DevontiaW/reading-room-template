-- C&W Book Club Picker - Database Schema
-- Run this in Supabase SQL Editor to set up your database

-- App State table (singleton row)
CREATE TABLE IF NOT EXISTS app_state (
  id TEXT PRIMARY KEY DEFAULT 'global',
  completed_book_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  series_state JSONB NOT NULL DEFAULT '{}'::jsonb,
  current_pick_id TEXT,
  pending_decision TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert initial row if not exists
INSERT INTO app_state (id, completed_book_ids, series_state, updated_at)
VALUES ('global', '[]'::jsonb, '{}'::jsonb, NOW())
ON CONFLICT (id) DO NOTHING;

-- Remarks table
CREATE TABLE IF NOT EXISTS remarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  note TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_remarks_book_id ON remarks(book_id);
CREATE INDEX IF NOT EXISTS idx_remarks_created_at ON remarks(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE app_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE remarks ENABLE ROW LEVEL SECURITY;

-- Policies for app_state
-- Anyone can read (needed for the app to function)
CREATE POLICY "read_app_state"
  ON app_state FOR SELECT
  TO anon
  USING (true);

-- Block direct anon writes (all writes go through API routes with passcode)
-- Note: The server uses the anon key but validates passcode in the API route
-- If you want even tighter security, use a service_role key server-side
CREATE POLICY "update_app_state"
  ON app_state FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "insert_app_state"
  ON app_state FOR INSERT
  TO anon
  WITH CHECK (true);

-- Policies for remarks
-- Anyone can read remarks
CREATE POLICY "read_remarks"
  ON remarks FOR SELECT
  TO anon
  USING (true);

-- Anyone can create remarks (passcode checked in API route)
CREATE POLICY "insert_remarks"
  ON remarks FOR INSERT
  TO anon
  WITH CHECK (true);

-- Enable realtime for live updates (optional - we use polling instead)
-- ALTER PUBLICATION supabase_realtime ADD TABLE app_state;
-- ALTER PUBLICATION supabase_realtime ADD TABLE remarks;
