# LakeB2B Social Post Generator - Ralph Loop Task Checklist

## 🎯 Completion Criteria
A fully functional social post generator with:
- [x] Authentication with login capability
- [ ] Streak maintenance system
- [ ] Community leaderboard with LinkedIn traction tracking
- [ ] Social space for sharing posts created by the generator
- [ ] Multi-style image generation (fix B&W/meme issues)
- [ ] Mini games while image generates (Gubey reactive)
- [ ] Post formatting after image generation
- [ ] Trending topics → auto post + image generation flow
- [ ] LinkedIn scheduling/posting via OAuth
- [ ] Thesys C1 v2 UI upgrade

---

## Phase 1: Core Generation + Branding + Gubey Integration
**Goal**: Fix existing bugs and solidify core functionality

### 1.1 Image Generation Fixes
- [ ] Fix B&W image generation style issues
- [ ] Fix meme template generation (not rendering correctly)
- [ ] Implement chooseable logo position (bottom-right default + user choice)
- [ ] Ensure LakeB2B logo always appears on generated images
- [ ] Validate brand color scheme enforcement (Purple #6D08BE, Orange #FFB703, Magenta #DD1286)

### 1.2 Gubey Mascot Integration
- [ ] Make Gubey react during image generation (thinking animation)
- [ ] Gubey celebration on successful generation
- [ ] Gubey error/sad state on generation failure
- [ ] Integrate Gubey with mini-games (react to scores, reward players)
- [ ] Ensure Gubey animations load correctly (GIFs from `/App mascot/`)

### 1.3 Post Formatting Flow
- [ ] After image generation, present post editor
- [ ] Rich text editor for LinkedIn post body
- [ ] Subject line/headline editor
- [ ] Preview panel showing image + post text together
- [ ] Copy to clipboard functionality

---

## Phase 2: Games + Gamification
**Goal**: Complete mini-games and streak/points system

### 2.1 Mini-Games Enhancement
- [ ] Verify existing 3 games work (Brand Matcher, Quick Click, Lead Collector)
- [ ] Gubey reactions during gameplay (cheering, sad on miss)
- [ ] Score persistence to user profile
- [ ] Game triggers automatically when image generation starts

### 2.2 Streak System
- [ ] Daily streak tracking for post generation
- [ ] Display streak count on user dashboard
- [ ] Streak bonus points multiplier
- [ ] Streak reset notification (Gubey sad)
- [ ] Streak milestone rewards/badges

### 2.3 Points & Leveling
- [ ] Points awarded for: post generation, mini-games, LinkedIn sharing
- [ ] Level progression system
- [ ] Level-up notifications with Gubey celebration
- [ ] Points history view

---

## Phase 3: Leaderboard + Social Features
**Goal**: Community features and LinkedIn integration

### 3.1 Enhanced Leaderboard
- [ ] All-time and weekly rankings (exists - verify working)
- [ ] LinkedIn traction tracking (likes, comments, shares)
- [ ] Posts created counter
- [ ] Profile photos from LinkedIn OAuth

### 3.2 Social Space
- [ ] Feed of posts created by community members
- [ ] Like/react to community posts
- [ ] Filter by style, trending, most liked
- [ ] Share post to own LinkedIn from feed
- [ ] Creator attribution on shared posts

### 3.3 LinkedIn OAuth Integration
- [ ] Verify Supabase LinkedIn OAuth setup
- [ ] Store LinkedIn access tokens securely
- [ ] Pull user profile photo from LinkedIn
- [ ] Test LinkedIn connection flow

---

## Phase 4: LinkedIn Scheduling + Testing + Polish
**Goal**: Complete LinkedIn posting and comprehensive testing

### 4.1 LinkedIn Posting/Scheduling
- [ ] Direct post to LinkedIn functionality
- [ ] Schedule post for future time
- [ ] Queue management (like Buffer)
- [ ] Post performance tracking (after posting)
- [ ] Re-post functionality

### 4.2 Thesys C1 v2 UI Upgrade
- [ ] Research Thesys C1 v2 API capabilities
- [ ] Plan UI component replacement strategy
- [ ] Implement C1 agent-powered UI flows
- [ ] Test generative UI interactions

### 4.3 Comprehensive Testing
- [ ] Run existing Playwright tests
- [ ] Fix any failing tests
- [ ] Add tests for new features (streaks, leaderboard, LinkedIn)
- [ ] End-to-end flow test: login → trending topic → generate → format → schedule
- [ ] Cross-browser verification

### 4.4 Final Polish
- [ ] Performance optimization
- [ ] Error handling audit
- [ ] Loading states and skeleton UIs
- [ ] Mobile responsiveness check
- [ ] Accessibility audit (WCAG AA)

---

## Current Status
- **Last Updated**: 2026-01-21
- **Current Phase**: Pre-Planning (Ralph Loop Setup)
- **Next Action**: Create Ralph loop master prompt and implementation plan

## Notes
- Gubey mascot files located in `/App mascot/` with multiple animation states
- LakeB2B branding in `/LakeB2B Logo/` including Brand Book PDF
- Existing tests in `/tests/` - includes e2e-flows, frontend-audit, meme-style specs
- LinkedIn OAuth partially implemented in `/src/pages/api/auth/linkedin/`
