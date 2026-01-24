-- Migration: Like Functions
-- Created: 2026-01-22
-- Description: Add database functions for incrementing/decrementing post likes

-- Function to increment likes count
CREATE OR REPLACE FUNCTION increment_likes(post_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE posts
  SET likes_count = COALESCE(likes_count, 0) + 1
  WHERE id = post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to decrement likes count
CREATE OR REPLACE FUNCTION decrement_likes(post_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE posts
  SET likes_count = GREATEST(0, COALESCE(likes_count, 0) - 1)
  WHERE id = post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment views count
CREATE OR REPLACE FUNCTION increment_views(post_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE posts
  SET views_count = COALESCE(views_count, 0) + 1
  WHERE id = post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION increment_likes(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION decrement_likes(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_views(UUID) TO authenticated;

-- Add indexes for better performance on post queries
CREATE INDEX IF NOT EXISTS idx_posts_is_public ON posts(is_public);
CREATE INDEX IF NOT EXISTS idx_posts_likes_count ON posts(likes_count DESC);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_post_likes_user_post ON post_likes(user_id, post_id);
