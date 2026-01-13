-- =============================================
-- C&W Book Club - Supabase Schema
-- Run these in your Supabase SQL Editor
-- =============================================

-- 1. Book Suggestions Table (for the new suggest feature)
CREATE TABLE IF NOT EXISTS book_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  cover_url TEXT,
  genres TEXT[],
  suggested_by UUID REFERENCES auth.users(id),
  suggested_by_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Suggestion Votes Table
CREATE TABLE IF NOT EXISTS suggestion_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  suggestion_id UUID REFERENCES book_suggestions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(suggestion_id, user_id)
);

-- 3. Reading Progress Table (track everyone's chapter progress)
CREATE TABLE IF NOT EXISTS reading_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  book_id TEXT NOT NULL,
  current_chapter INTEGER DEFAULT 1,
  total_chapters INTEGER DEFAULT 20,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, book_id)
);

-- 4. Add reading_goal to users if not exists
ALTER TABLE users ADD COLUMN IF NOT EXISTS reading_goal INTEGER;

-- 5. Enable Row Level Security
ALTER TABLE book_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE suggestion_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE reading_progress ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies - Allow authenticated users to read all, write their own

-- Book suggestions: anyone can read, authenticated can insert
CREATE POLICY "Anyone can view suggestions" ON book_suggestions
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can suggest" ON book_suggestions
  FOR INSERT WITH CHECK (auth.uid() = suggested_by);

CREATE POLICY "Users can delete own suggestions" ON book_suggestions
  FOR DELETE USING (auth.uid() = suggested_by);

-- Votes: anyone can read, authenticated can vote
CREATE POLICY "Anyone can view votes" ON suggestion_votes
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can vote" ON suggestion_votes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove own votes" ON suggestion_votes
  FOR DELETE USING (auth.uid() = user_id);

-- Reading progress: anyone can read (to see club progress), users update their own
CREATE POLICY "Anyone can view progress" ON reading_progress
  FOR SELECT USING (true);

CREATE POLICY "Users can update own progress" ON reading_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can modify own progress" ON reading_progress
  FOR UPDATE USING (auth.uid() = user_id);

-- =============================================
-- Indexes for performance
-- =============================================
CREATE INDEX IF NOT EXISTS idx_suggestions_created ON book_suggestions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_votes_suggestion ON suggestion_votes(suggestion_id);
CREATE INDEX IF NOT EXISTS idx_progress_user ON reading_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_progress_book ON reading_progress(book_id);

-- =============================================
-- Views for easy querying
-- =============================================

-- View: Suggestions with vote counts
CREATE OR REPLACE VIEW suggestions_with_votes AS
SELECT
  s.*,
  COUNT(v.id) as vote_count,
  ARRAY_AGG(v.user_id) FILTER (WHERE v.user_id IS NOT NULL) as voter_ids
FROM book_suggestions s
LEFT JOIN suggestion_votes v ON s.id = v.suggestion_id
GROUP BY s.id
ORDER BY vote_count DESC, s.created_at DESC;
