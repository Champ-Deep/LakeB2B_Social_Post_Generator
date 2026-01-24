-- Migration: Add streak tracking and points history to user_profiles
-- Created: 2026-01-21
-- Purpose: Support gamification features - streaks, weekly points, and points history

-- Add streak columns to user_profiles
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS current_streak INTEGER DEFAULT 0;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS longest_streak INTEGER DEFAULT 0;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS last_activity_date DATE;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS weekly_points INTEGER DEFAULT 0;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS weekly_generation_count INTEGER DEFAULT 0;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS week_start_date DATE;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS streak_bonus_multiplier DECIMAL(3,2) DEFAULT 1.0;

-- Create points_history table for tracking all point transactions
CREATE TABLE IF NOT EXISTS points_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  points_change INTEGER NOT NULL,
  reason TEXT NOT NULL,
  balance_after INTEGER NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create game_sessions table for tracking mini-game activity
CREATE TABLE IF NOT EXISTS game_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  game_type TEXT NOT NULL,
  score INTEGER NOT NULL,
  time_remaining INTEGER,
  was_generation_complete BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_points_history_user_id ON points_history(user_id);
CREATE INDEX IF NOT EXISTS idx_points_history_created_at ON points_history(created_at);
CREATE INDEX IF NOT EXISTS idx_game_sessions_user_id ON game_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_game_sessions_game_type ON game_sessions(game_type);
CREATE INDEX IF NOT EXISTS idx_user_profiles_current_streak ON user_profiles(current_streak DESC);
CREATE INDEX IF NOT EXISTS idx_user_profiles_weekly_points ON user_profiles(weekly_points DESC);

-- Row Level Security policies

-- Points history: Users can only see their own points history
ALTER TABLE points_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own points history"
  ON points_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert points history"
  ON points_history FOR INSERT
  WITH CHECK (true);

-- Game sessions: Users can only see their own game sessions
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own game sessions"
  ON game_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert game sessions"
  ON game_sessions FOR INSERT
  WITH CHECK (true);

-- Function to update streak on activity
CREATE OR REPLACE FUNCTION update_user_streak(p_user_id UUID)
RETURNS void AS $$
DECLARE
  v_last_date DATE;
  v_current_date DATE := CURRENT_DATE;
  v_current_streak INTEGER;
  v_longest_streak INTEGER;
BEGIN
  -- Get user's last activity and current streak
  SELECT last_activity_date, current_streak, longest_streak
  INTO v_last_date, v_current_streak, v_longest_streak
  FROM user_profiles
  WHERE id = p_user_id;

  -- Handle streak logic
  IF v_last_date IS NULL THEN
    -- First activity
    v_current_streak := 1;
  ELSIF v_last_date = v_current_date - INTERVAL '1 day' THEN
    -- Consecutive day - increment streak
    v_current_streak := COALESCE(v_current_streak, 0) + 1;
  ELSIF v_last_date < v_current_date - INTERVAL '1 day' THEN
    -- Missed a day - reset streak
    v_current_streak := 1;
  END IF;
  -- Same day activity doesn't change streak

  -- Update longest streak if needed
  IF v_current_streak > COALESCE(v_longest_streak, 0) THEN
    v_longest_streak := v_current_streak;
  END IF;

  -- Calculate streak bonus (1.5x at 7+ days, 2x at 30+ days)
  DECLARE
    v_multiplier DECIMAL(3,2) := 1.0;
  BEGIN
    IF v_current_streak >= 30 THEN
      v_multiplier := 2.0;
    ELSIF v_current_streak >= 7 THEN
      v_multiplier := 1.5;
    END IF;

    -- Update the user profile
    UPDATE user_profiles
    SET
      current_streak = v_current_streak,
      longest_streak = v_longest_streak,
      last_activity_date = v_current_date,
      streak_bonus_multiplier = v_multiplier,
      updated_at = NOW()
    WHERE id = p_user_id;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reset weekly stats (call via cron or manually)
CREATE OR REPLACE FUNCTION reset_weekly_stats()
RETURNS void AS $$
BEGIN
  UPDATE user_profiles
  SET
    weekly_points = 0,
    weekly_generation_count = 0,
    week_start_date = DATE_TRUNC('week', CURRENT_DATE)::DATE,
    updated_at = NOW()
  WHERE week_start_date IS NULL OR week_start_date < DATE_TRUNC('week', CURRENT_DATE)::DATE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments for documentation
COMMENT ON COLUMN user_profiles.current_streak IS 'Current consecutive days of activity';
COMMENT ON COLUMN user_profiles.longest_streak IS 'Longest streak ever achieved';
COMMENT ON COLUMN user_profiles.last_activity_date IS 'Last date user performed a point-earning activity';
COMMENT ON COLUMN user_profiles.weekly_points IS 'Points earned this week (resets weekly)';
COMMENT ON COLUMN user_profiles.weekly_generation_count IS 'Posts generated this week (resets weekly)';
COMMENT ON COLUMN user_profiles.week_start_date IS 'Start date of current tracking week';
COMMENT ON COLUMN user_profiles.streak_bonus_multiplier IS 'Point multiplier based on streak (1.0-2.0)';

COMMENT ON TABLE points_history IS 'Audit log of all point transactions';
COMMENT ON TABLE game_sessions IS 'Records of mini-game play sessions';
