-- ============================================================================
-- Gubey Interactions Table Migration
--
-- Creates the gubey_interactions table for tracking mascot interactions.
-- Run this migration in your Supabase SQL editor.
-- ============================================================================

-- Create the table
CREATE TABLE IF NOT EXISTS gubey_interactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  interaction_type TEXT NOT NULL,
  context_pathname TEXT,
  state_from TEXT,
  state_to TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add comments for documentation
COMMENT ON TABLE gubey_interactions IS 'Tracks Gubey mascot interactions for analytics';
COMMENT ON COLUMN gubey_interactions.session_id IS 'Browser session identifier';
COMMENT ON COLUMN gubey_interactions.interaction_type IS 'Type of interaction (state_transition, action_*, etc.)';
COMMENT ON COLUMN gubey_interactions.context_pathname IS 'Page pathname where interaction occurred';
COMMENT ON COLUMN gubey_interactions.state_from IS 'Previous mascot state';
COMMENT ON COLUMN gubey_interactions.state_to IS 'New mascot state';
COMMENT ON COLUMN gubey_interactions.metadata IS 'Additional interaction data';

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_gubey_interactions_user_id
  ON gubey_interactions(user_id);

CREATE INDEX IF NOT EXISTS idx_gubey_interactions_session
  ON gubey_interactions(session_id);

CREATE INDEX IF NOT EXISTS idx_gubey_interactions_type
  ON gubey_interactions(interaction_type);

CREATE INDEX IF NOT EXISTS idx_gubey_interactions_created
  ON gubey_interactions(created_at DESC);

-- Create composite index for common queries
CREATE INDEX IF NOT EXISTS idx_gubey_interactions_user_type
  ON gubey_interactions(user_id, interaction_type);

-- Enable Row Level Security
ALTER TABLE gubey_interactions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own interactions
CREATE POLICY "Users can read own interactions"
  ON gubey_interactions FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own interactions (or anonymous)
CREATE POLICY "Users can insert own interactions"
  ON gubey_interactions FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Policy: Service role has full access (for analytics)
CREATE POLICY "Service role full access"
  ON gubey_interactions FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================================================
-- Analytics Views (Optional - uncomment if needed)
-- ============================================================================

-- -- Daily interaction summary
-- CREATE OR REPLACE VIEW gubey_daily_summary AS
-- SELECT
--   DATE(created_at) as date,
--   interaction_type,
--   COUNT(*) as count,
--   COUNT(DISTINCT session_id) as unique_sessions,
--   COUNT(DISTINCT user_id) as unique_users
-- FROM gubey_interactions
-- GROUP BY DATE(created_at), interaction_type
-- ORDER BY date DESC, count DESC;

-- -- State transition frequency
-- CREATE OR REPLACE VIEW gubey_state_transitions AS
-- SELECT
--   state_from,
--   state_to,
--   COUNT(*) as count
-- FROM gubey_interactions
-- WHERE interaction_type = 'state_transition'
--   AND state_from IS NOT NULL
--   AND state_to IS NOT NULL
-- GROUP BY state_from, state_to
-- ORDER BY count DESC;

-- ============================================================================
-- Cleanup Function (Optional - for maintenance)
-- ============================================================================

-- Function to clean up old interactions (older than 90 days)
CREATE OR REPLACE FUNCTION cleanup_old_gubey_interactions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM gubey_interactions
  WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$;

-- ============================================================================
-- Verification
-- ============================================================================

-- Run this to verify the table was created correctly:
-- SELECT
--   column_name,
--   data_type,
--   is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'gubey_interactions'
-- ORDER BY ordinal_position;
