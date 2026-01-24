# Ralph Loop Implementation Plan - LakeB2B Social Post Generator

## Executive Summary

This document outlines the implementation plan for completing the LakeB2B Social Post Generator based on the comprehensive codebase audit conducted on 2026-01-21.

**Total Phases**: 4
**Estimated Work Items**: 45 discrete tasks
**Key Dependencies**: Supabase, LinkedIn API, Gemini API

---

## Phase 1: Core Generation + Branding + Gubey Integration

### 1.1 Image Generation Fixes

#### 1.1.1 B&W Image Generation Fix
**Status**: ⚠️ Partially Working
**Issue**: Missing `LakeB2B Logo BW.png` causes fallback to white background version
**Files**:
- `src/utils/server/imageProcessor.ts` (lines 62-65)
- `public/logos/` (missing file)

**Tasks**:
- [ ] Create B&W version of LakeB2B logo from existing assets
- [ ] Save as `public/logos/LakeB2B Logo BW.png`
- [ ] Test newyork-cartoon style with proper B&W logo
- [ ] Add post-processing filter to enforce pure B&W (threshold grayscale values)

#### 1.1.2 Meme Template Generation Fix
**Status**: ⚠️ Text overflow issues
**Issue**: Long text can overflow meme text areas, no dynamic font sizing
**Files**:
- `src/utils/server/imageProcessor.ts` (meme text overlay section)
- `src/types/styles.ts` (meme format definitions)

**Tasks**:
- [ ] Implement dynamic font sizing based on text length
- [ ] Add word wrapping for long text
- [ ] Test all 4 meme formats with various text lengths
- [ ] Add text truncation with "..." for extreme cases

#### 1.1.3 Chooseable Logo Position
**Status**: ✅ Already Implemented
**Files**:
- `src/components/LogoControls.tsx` - Position selector exists
- `src/utils/server/imageProcessor.ts` - addLogoOverlay supports positions

**Verification Tasks**:
- [ ] Verify all 3 positions work (bottom-left, bottom-right, top-right)
- [ ] Test rotation with each position
- [ ] Ensure meme templates respect logo position

#### 1.1.4 LakeB2B Logo Always Appears
**Status**: ✅ Working
**Verification**: Logo overlay is applied in all generation paths

#### 1.1.5 Brand Color Enforcement
**Status**: ✅ Working via prompts
**Enhancement Tasks**:
- [ ] Add color validation in generated images (optional)
- [ ] Document brand colors in style selector tooltips

---

### 1.2 Gubey Mascot Integration

**Status**: ✅ FULLY IMPLEMENTED

#### Current Implementation (Verified)
- ✅ 8 animation states including THINKING, CELEBRATING, ERROR
- ✅ Reacts during image generation (THINKING animation)
- ✅ Celebrates on successful generation (CELEBRATING + particles)
- ✅ Shows ERROR state on generation failure
- ✅ Comprehensive Playwright tests

#### 1.2.1 Gubey Game Integration
**Status**: ⚠️ Not Connected
**Task**: Connect Gubey reactions to mini-game events

**Files to Modify**:
- `src/components/MiniGame.tsx`
- `src/hooks/useGubeyState.ts`

**Tasks**:
- [ ] Add Gubey CELEBRATING when player wins mini-game
- [ ] Add Gubey encouragement (custom state?) on close score
- [ ] Dispatch Gubey state changes from MiniGame component

---

### 1.3 Post Formatting Flow

**Status**: ❌ NOT IMPLEMENTED
**Priority**: HIGH

#### 1.3.1 Create Post Editor Component
**New File**: `src/components/PostEditor.tsx`

**Features**:
- Rich text editor for LinkedIn post body (no formatting needed for LinkedIn)
- Character counter (max 3000 chars for LinkedIn)
- Headline/subject line field
- Image preview alongside text
- Copy to clipboard button
- "Post to LinkedIn" integration

**Tasks**:
- [ ] Create PostEditor.tsx component with Chakra UI
- [ ] Add character counter with warning at 2800+ chars
- [ ] Integrate image preview panel
- [ ] Add copy-to-clipboard functionality
- [ ] Add LinkedIn post button (uses existing LinkedInPostModal)
- [ ] Create smooth transition from ImagePreview to PostEditor

#### 1.3.2 Integrate Post Editor into Flow
**Files to Modify**:
- `src/components/ImagePreview.tsx`
- `src/pages/index.tsx`

**Tasks**:
- [ ] Add "Format Post" button after image generation
- [ ] Show PostEditor as modal or inline panel
- [ ] Preserve generated image data for posting

---

## Phase 2: Games + Gamification

### 2.1 Mini-Games Enhancement

**Status**: ✅ 3 Games Working (Brand Matcher, Quick Click, Lead Collector)

#### 2.1.1 Game Verification
**Tasks**:
- [ ] Run full test suite for MiniGame component
- [ ] Verify scoring works for all 3 game types
- [ ] Test edge cases (rapid clicking, early exit)

#### 2.1.2 Gubey Game Reactions
**Tasks**:
- [ ] Import Gubey dispatch into MiniGame
- [ ] Trigger CELEBRATING on game win
- [ ] Add subtle Gubey reaction on good clicks (pulse?)

#### 2.1.3 Score Persistence
**Status**: ⚠️ Points persist but no game history
**Tasks**:
- [ ] Create `game_sessions` table in Supabase
- [ ] Track individual game scores with timestamps
- [ ] Add personal best tracking per game type

---

### 2.2 Streak System

**Status**: ⚠️ In-Memory Only (resets on server restart)

#### 2.2.1 Database Migration
**New File**: `supabase/migrations/YYYYMMDD_user_streaks.sql`

```sql
-- Add streak columns to user_profiles
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_activity_date DATE,
  streak_bonus_claimed_at TIMESTAMPTZ;
```

**Tasks**:
- [ ] Create Supabase migration for streak columns
- [ ] Update `src/lib/supabase/types.ts` with new fields
- [ ] Modify `/api/user/stats.ts` to use database instead of in-memory

#### 2.2.2 Streak Display Component
**New File**: `src/components/StreakDisplay.tsx`

**Features**:
- Current streak count with fire emoji
- Longest streak record
- Progress to next milestone
- Gubey celebration at milestones (7, 30, 100 days)

**Tasks**:
- [ ] Create StreakDisplay component
- [ ] Add to UserDashboard
- [ ] Implement streak bonus multiplier (1.5x at 7+ days)
- [ ] Add streak loss notification with sad Gubey

#### 2.2.3 Streak Logic Enhancement
**File**: `src/pages/api/user/stats.ts`

**Tasks**:
- [ ] Move streak logic to Supabase
- [ ] Calculate streak based on generation activity (not just login)
- [ ] Implement timezone-aware date comparison
- [ ] Add streak milestone achievements

---

### 2.3 Points & Leveling

**Status**: ✅ Working but needs database persistence

#### 2.3.1 Persistent Points Storage
**Tasks**:
- [ ] Ensure all points operations write to Supabase
- [ ] Add transaction support for points operations
- [ ] Create points history table for audit trail

#### 2.3.2 Level-Up Celebrations
**Tasks**:
- [ ] Trigger Gubey CELEBRATING on level up
- [ ] Show level-up modal with new perks
- [ ] Add level badges to leaderboard

#### 2.3.3 Points History View
**New File**: `src/components/PointsHistory.tsx`

**Tasks**:
- [ ] Create points history table in Supabase
- [ ] Build PointsHistory component showing recent transactions
- [ ] Add to UserDashboard

---

## Phase 3: Leaderboard + Social Features

### 3.1 Enhanced Leaderboard

**Status**: ⚠️ Mock Data Only

#### 3.1.1 Real Database Queries
**File**: `src/pages/api/user/leaderboard.ts`

**Tasks**:
- [ ] Replace mock data with Supabase queries
- [ ] Query user_profiles ordered by total_points
- [ ] Implement weekly points reset mechanism
- [ ] Add pagination for large user bases

#### 3.1.2 LinkedIn Traction Tracking
**Status**: ❌ NOT IMPLEMENTED

**New Table**: `linkedin_post_metrics`

```sql
CREATE TABLE linkedin_post_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  post_id TEXT NOT NULL,
  post_url TEXT,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  shares_count INTEGER DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  fetched_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Tasks**:
- [ ] Create linkedin_post_metrics table
- [ ] Research LinkedIn Analytics API requirements
- [ ] Implement metric fetching (manual or scheduled)
- [ ] Display traction stats on leaderboard

#### 3.1.3 Profile Photos from LinkedIn
**Status**: ✅ Already fetched and stored
**File**: `linkedin_connections.profile_image_url`

**Tasks**:
- [ ] Display LinkedIn profile photos on leaderboard
- [ ] Add fallback avatar for users without LinkedIn
- [ ] Cache profile images locally (optional)

---

### 3.2 Social Space

**Status**: ❌ NOT IMPLEMENTED
**Priority**: MEDIUM

#### 3.2.1 Database Schema
**New File**: `supabase/migrations/YYYYMMDD_social_feed.sql`

```sql
-- Social feed tables
CREATE TABLE community_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  image_url TEXT NOT NULL,
  post_text TEXT,
  style TEXT,
  headline TEXT,
  is_public BOOLEAN DEFAULT true,
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE community_post_likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES community_posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);
```

#### 3.2.2 Social Feed Component
**New File**: `src/components/SocialFeed.tsx`

**Features**:
- Grid/list view of community posts
- Like/react buttons
- Filter by style, trending, most liked
- Creator attribution with profile link
- "Share to LinkedIn" from feed

**Tasks**:
- [ ] Create community_posts and community_post_likes tables
- [ ] Build SocialFeed component
- [ ] Implement infinite scroll pagination
- [ ] Add like functionality with optimistic updates
- [ ] Create "Share to Community" option after generation

#### 3.2.3 Social Feed Page
**New File**: `src/pages/community.tsx`

**Tasks**:
- [ ] Create dedicated community page
- [ ] Add navigation link in header
- [ ] Implement SEO meta tags

---

### 3.3 LinkedIn OAuth Verification

**Status**: ✅ Working

**Verification Tasks**:
- [ ] Test complete OAuth flow
- [ ] Verify token storage and encryption
- [ ] Test token expiry handling
- [ ] Verify profile photo retrieval

---

## Phase 4: LinkedIn Scheduling + Testing + Polish

### 4.1 LinkedIn Posting/Scheduling

**Status**: ⚠️ Posting works, no scheduling

#### 4.1.1 Scheduled Posts Table
**New File**: `supabase/migrations/YYYYMMDD_scheduled_posts.sql`

```sql
CREATE TABLE scheduled_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  image_data TEXT NOT NULL,
  post_text TEXT NOT NULL,
  headline TEXT,
  scheduled_for TIMESTAMPTZ NOT NULL,
  visibility TEXT DEFAULT 'PUBLIC',
  status TEXT DEFAULT 'pending', -- pending, posted, failed, cancelled
  linkedin_post_id TEXT,
  posted_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 4.1.2 Scheduling UI
**New File**: `src/components/SchedulePostModal.tsx`

**Features**:
- Date/time picker for scheduled time
- Timezone selector
- Queue view showing pending posts
- Cancel/reschedule options

**Tasks**:
- [ ] Create SchedulePostModal component
- [ ] Add date picker (use react-datepicker or similar)
- [ ] Implement timezone handling
- [ ] Create `/api/linkedin/schedule` endpoint
- [ ] Build queue management UI

#### 4.1.3 Background Job for Posting
**Options**:
1. **Vercel Cron Jobs** - Check every minute for due posts
2. **Supabase Edge Functions** - Scheduled function
3. **External service** - Queue like Inngest, Trigger.dev

**Tasks**:
- [ ] Choose scheduling approach
- [ ] Implement posting background job
- [ ] Add retry logic for failed posts
- [ ] Send notification on post success/failure

#### 4.1.4 Post Performance Tracking
**Tasks**:
- [ ] Store posted post references
- [ ] Link to LinkedIn post URL
- [ ] (Future) Fetch engagement metrics

---

### 4.2 Thesys C1 v2 UI Upgrade

**Status**: ❌ NOT STARTED
**Priority**: LOW (enhancement)

**Research Tasks**:
- [ ] Research Thesys C1 v2 API capabilities
- [ ] Identify UI components suitable for generative UI
- [ ] Plan phased rollout

---

### 4.3 Comprehensive Testing

#### 4.3.1 Existing Tests
**Status**: 198 tests, comprehensive

**Tasks**:
- [ ] Run full test suite: `npm test`
- [ ] Fix any failing tests
- [ ] Review test coverage report

#### 4.3.2 New Feature Tests
**Files to Create**:
- `tests/streak-system.spec.ts`
- `tests/leaderboard.spec.ts`
- `tests/linkedin-flow.spec.ts`
- `tests/social-feed.spec.ts`
- `tests/post-scheduling.spec.ts`

**Tasks**:
- [ ] Add tests for streak system
- [ ] Add tests for real leaderboard queries
- [ ] Add E2E test for LinkedIn posting flow
- [ ] Add tests for social feed interactions
- [ ] Add tests for post scheduling

#### 4.3.3 E2E Flow Test
**Test**: Complete user journey

```typescript
// Test flow: login → trending → generate → format → schedule
test('Complete post creation flow', async ({ page }) => {
  // 1. Login
  // 2. Click trending topic
  // 3. Generate image
  // 4. Format post
  // 5. Schedule for later
  // 6. Verify in queue
});
```

---

### 4.4 Final Polish

#### 4.4.1 Performance Optimization
**Tasks**:
- [ ] Audit bundle size
- [ ] Implement image lazy loading
- [ ] Add API response caching
- [ ] Optimize Supabase queries

#### 4.4.2 Error Handling Audit
**Tasks**:
- [ ] Review all API error responses
- [ ] Ensure user-friendly error messages
- [ ] Add error boundary components
- [ ] Implement graceful degradation

#### 4.4.3 Loading States
**Tasks**:
- [ ] Add skeleton loaders for all async content
- [ ] Implement optimistic updates where appropriate
- [ ] Add progress indicators for long operations

#### 4.4.4 Mobile Responsiveness
**Tasks**:
- [ ] Test all pages on mobile viewports
- [ ] Fix any layout issues
- [ ] Ensure touch targets are adequate (44px minimum)

#### 4.4.5 Accessibility Audit
**Tasks**:
- [ ] Run axe-core audit
- [ ] Fix any WCAG AA violations
- [ ] Test with screen reader
- [ ] Ensure keyboard navigation works

---

## Implementation Priority Matrix

| Priority | Task | Phase | Effort |
|----------|------|-------|--------|
| P0 | B&W Logo Fix | 1.1.1 | Low |
| P0 | Meme Text Fix | 1.1.2 | Medium |
| P0 | Post Editor | 1.3 | Medium |
| P1 | Streak Database | 2.2.1 | Low |
| P1 | Real Leaderboard | 3.1.1 | Medium |
| P1 | LinkedIn Scheduling | 4.1 | High |
| P2 | Social Feed | 3.2 | High |
| P2 | Gubey Game Integration | 1.2.1 | Low |
| P3 | LinkedIn Traction | 3.1.2 | High |
| P3 | Thesys C1 v2 | 4.2 | High |

---

## Quick Wins (Can be done immediately)

1. **Create B&W Logo** - Convert existing logo to pure B&W
2. **Connect Gubey to Games** - Add dispatch calls in MiniGame
3. **Fix Meme Text** - Add font size scaling logic
4. **Run Test Suite** - Verify current state
5. **Streak Migration** - Add columns to user_profiles

---

## Environment Variables Required

```bash
# Existing (verify configured)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
LINKEDIN_CLIENT_ID=
LINKEDIN_CLIENT_SECRET=
LINKEDIN_REDIRECT_URI=
LINKEDIN_TOKEN_ENCRYPTION_KEY=
JWT_SECRET=
LAKEB2B_SHARED_PASSWORD=

# New (for scheduling)
VERCEL_CRON_SECRET= (if using Vercel cron)
```

---

## Success Criteria

### Phase 1 Complete When:
- [ ] All 5 image styles generate correctly
- [ ] B&W style uses proper B&W logo
- [ ] Meme text doesn't overflow
- [ ] Post Editor allows formatting and copying
- [ ] Gubey reacts to all generation states

### Phase 2 Complete When:
- [ ] Streaks persist across sessions
- [ ] Points saved to database
- [ ] Level-ups trigger celebrations
- [ ] Game scores tracked historically

### Phase 3 Complete When:
- [ ] Leaderboard shows real data
- [ ] Social feed displays community posts
- [ ] Users can like and share posts
- [ ] LinkedIn profile photos appear

### Phase 4 Complete When:
- [ ] Posts can be scheduled
- [ ] Background job publishes on time
- [ ] All tests pass
- [ ] Mobile experience polished
- [ ] Accessibility audit passed

---

*Document created: 2026-01-21*
*Last updated: 2026-01-21*
