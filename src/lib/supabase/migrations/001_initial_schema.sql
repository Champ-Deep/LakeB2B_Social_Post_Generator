-- LakeB2B Social Post Creator - Initial Schema Migration
-- Version: 001
-- Date: 2024-01-15
-- Description: Sets up core tables for user profiles, posts, and community features

-- ============================================================
-- PHASE 0: Core Foundation Tables
-- ============================================================

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  total_points INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  generation_count INTEGER DEFAULT 0,
  achievements TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Generated posts (for history and community gallery)
CREATE TABLE IF NOT EXISTS public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  prompt TEXT NOT NULL,
  headline TEXT,
  style VARCHAR(50) NOT NULL,
  meme_format VARCHAR(50),
  size VARCHAR(20),
  logo_position VARCHAR(20),
  logo_size INTEGER,
  logo_opacity INTEGER,
  logo_rotation INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_public BOOLEAN DEFAULT false, -- Private by default
  likes_count INTEGER DEFAULT 0,
  views_count INTEGER DEFAULT 0
);

-- ============================================================
-- PHASE 2: Community Features Tables
-- ============================================================

-- Post likes table
CREATE TABLE IF NOT EXISTS public.post_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- Post views tracking
CREATE TABLE IF NOT EXISTS public.post_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  viewed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- ============================================================
-- PHASE 1: LinkedIn Integration Tables
-- ============================================================

-- LinkedIn connections
CREATE TABLE IF NOT EXISTS public.linkedin_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  linkedin_id VARCHAR(255) NOT NULL UNIQUE,
  access_token TEXT NOT NULL, -- Should be encrypted in production
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ NOT NULL,
  profile_name VARCHAR(255),
  profile_url TEXT,
  profile_image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Scheduled posts
CREATE TABLE IF NOT EXISTS public.scheduled_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id UUID REFERENCES public.posts(id), -- Link to generated post
  linkedin_connection_id UUID REFERENCES public.linkedin_connections(id),
  post_text TEXT NOT NULL,
  scheduled_for TIMESTAMPTZ NOT NULL,
  status VARCHAR(20) DEFAULT 'pending', -- pending, published, failed
  linkedin_post_id VARCHAR(255),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  published_at TIMESTAMPTZ
);

-- ============================================================
-- INDEXES for Performance
-- ============================================================

-- Posts indexes
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON public.posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_public ON public.posts(is_public, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_likes ON public.posts(likes_count DESC);
CREATE INDEX IF NOT EXISTS idx_posts_style ON public.posts(style);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON public.posts(created_at DESC);

-- Post likes indexes
CREATE INDEX IF NOT EXISTS idx_post_likes_post_id ON public.post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_user_id ON public.post_likes(user_id);

-- Post views indexes
CREATE INDEX IF NOT EXISTS idx_post_views_post_id ON public.post_views(post_id);

-- LinkedIn connections indexes
CREATE INDEX IF NOT EXISTS idx_linkedin_connections_user_id ON public.linkedin_connections(user_id);

-- Scheduled posts indexes
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_user_id ON public.scheduled_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_status ON public.scheduled_posts(status, scheduled_for);

-- ============================================================
-- ROW LEVEL SECURITY (RLS) Policies
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.linkedin_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_posts ENABLE ROW LEVEL SECURITY;

-- User Profiles Policies
CREATE POLICY "Users can view own profile"
  ON public.user_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.user_profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.user_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Posts Policies
CREATE POLICY "Users can view own posts"
  ON public.posts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own posts"
  ON public.posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own posts"
  ON public.posts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own posts"
  ON public.posts FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Public posts are viewable by all"
  ON public.posts FOR SELECT
  USING (is_public = true);

-- Post Likes Policies
CREATE POLICY "Users can view all likes"
  ON public.post_likes FOR SELECT
  USING (true);

CREATE POLICY "Users can like posts"
  ON public.post_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike posts"
  ON public.post_likes FOR DELETE
  USING (auth.uid() = user_id);

-- Post Views Policies
CREATE POLICY "Users can view all views"
  ON public.post_views FOR SELECT
  USING (true);

CREATE POLICY "Users can record views"
  ON public.post_views FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- LinkedIn Connections Policies
CREATE POLICY "Users manage own LinkedIn connections"
  ON public.linkedin_connections FOR ALL
  USING (auth.uid() = user_id);

-- Scheduled Posts Policies
CREATE POLICY "Users manage own scheduled posts"
  ON public.scheduled_posts FOR ALL
  USING (auth.uid() = user_id);

-- ============================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for user_profiles updated_at
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for linkedin_connections updated_at
CREATE TRIGGER update_linkedin_connections_updated_at
  BEFORE UPDATE ON public.linkedin_connections
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to increment generation count
CREATE OR REPLACE FUNCTION public.increment_generation_count(p_user_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.user_profiles
  SET generation_count = generation_count + 1,
      total_points = total_points + 10 -- Award 10 points per generation
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update likes count on posts
CREATE OR REPLACE FUNCTION public.update_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.posts
    SET likes_count = likes_count + 1
    WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.posts
    SET likes_count = likes_count - 1
    WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updating likes count
CREATE TRIGGER update_likes_count
  AFTER INSERT OR DELETE ON public.post_likes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_post_likes_count();

-- Function to update views count on posts
CREATE OR REPLACE FUNCTION public.update_post_views_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.posts
  SET views_count = views_count + 1
  WHERE id = NEW.post_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updating views count
CREATE TRIGGER update_views_count
  AFTER INSERT ON public.post_views
  FOR EACH ROW
  EXECUTE FUNCTION public.update_post_views_count();

-- Function to create user profile after signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- COMMENTS for Documentation
-- ============================================================

COMMENT ON TABLE public.user_profiles IS 'Extended user profile data beyond Supabase auth';
COMMENT ON TABLE public.posts IS 'Generated social media posts with images';
COMMENT ON TABLE public.post_likes IS 'User likes on posts for community engagement';
COMMENT ON TABLE public.post_views IS 'View tracking for posts analytics';
COMMENT ON TABLE public.linkedin_connections IS 'OAuth connections to LinkedIn for posting';
COMMENT ON TABLE public.scheduled_posts IS 'Posts scheduled for future LinkedIn publishing';

COMMENT ON COLUMN public.posts.is_public IS 'If true, post is visible in community gallery';
COMMENT ON COLUMN public.posts.style IS 'Visual style: isometric, infographic, newyork-cartoon, minimalist-linkedin, meme';
COMMENT ON COLUMN public.scheduled_posts.status IS 'pending = waiting, published = posted successfully, failed = error occurred';
