# RALPH LOOP: LakeB2B Social Post Generator

> **What is this?** This file is the master prompt for running a Ralph Loop - an iterative AI development methodology where this prompt is fed repeatedly to Claude Code, allowing the agent to see its previous work and progressively refine until all completion criteria are met.

## CURRENT OBJECTIVE
Complete the LakeB2B Social Post Generator with all features working end-to-end.

---

## CONTEXT FILES TO READ
1. **`task.md`** - Current progress checklist (READ FIRST, located in `.gemini/antigravity/brain/[conversation-id]/task.md` or project root)
2. **`.claude/CLAUDE.md`** - Agent protocols and brand guidelines
3. **`lakeb2b-social-post-prd.md`** - Product requirements

---

## COMPLETION CRITERIA (STOP WHEN ALL TRUE)

| # | Criterion | Status |
|---|-----------|--------|
| 1 | User can log in and maintain daily streaks | ⬜ |
| 2 | Image generation works for ALL styles (isometric, infographic, cartoon, minimalist, meme) | ⬜ |
| 3 | Logo appears on ALL generated images (chooseable position, default bottom-right) | ⬜ |
| 4 | Mini-game launches during generation, Gubey reacts to gameplay | ⬜ |
| 5 | Leaderboard shows rankings with LinkedIn traction | ⬜ |
| 6 | User can format and schedule posts to LinkedIn | ⬜ |
| 7 | Community social space shows shared posts | ⬜ |
| 8 | All Playwright tests pass (`npm test`) | ⬜ |
| 9 | No console errors on production build (`npm run build`) | ⬜ |

---

## ITERATION PROTOCOL

```
1. If dev server not running: `npm run dev`
2. Check current app state in browser at http://localhost:3000
3. Read task.md to find FIRST uncompleted item marked [ ]
4. Mark that item as in-progress [/]
5. Implement the fix/feature
6. Verify it works (manual + automated tests)
7. Mark item complete [x] in task.md
8. Update task summary
9. Check if ALL completion criteria are met → STOP and report
10. Otherwise → Continue to next iteration
```

---

## BRAND GUIDELINES (MUST FOLLOW)

| Asset | Value |
|-------|-------|
| **Primary Purple** | `#6D08BE` |
| **Primary Orange** | `#FFB703` |
| **Primary Magenta** | `#DD1286` |
| **Font Family** | Montserrat |
| **Mascot Name** | **Gubey** (NOT Gooby) |
| **Logo Position** | Default: bottom-right, User-chooseable |

---

## KEY FILES

### Core Components
- `/src/components/PostGenerator.tsx` - Main generation UI
- `/src/components/MiniGame.tsx` - Mini-games (3 games: match, quickclick, collector)
- `/src/components/Gubey/` - Mascot components (GubeyProvider, GubeyAvatar, GubeyButton, GubeyPanel)
- `/src/components/Leaderboard.tsx` - Rankings UI
- `/src/components/TrendingTopics.tsx` - Topic selection
- `/src/components/UserDashboard.tsx` - User profile and stats

### APIs
- `/src/pages/api/generate-image.ts` - Image generation with multi-model fallback
- `/src/pages/api/linkedin/` - LinkedIn OAuth and posting
- `/src/pages/api/auth/` - Authentication endpoints
- `/src/pages/api/user/` - User data endpoints

### Assets
- `/App mascot/` - Gubey animations and images
- `/LakeB2B Logo/` - Brand assets and logo files
- `/public/meme-templates/` - Meme template PNGs

### Tests
- `/tests/e2e-flows.spec.ts` - End-to-end tests
- `/tests/frontend-audit.spec.ts` - UI audit tests
- `/tests/meme-style.spec.ts` - Meme generation tests

---

## GIT WORKFLOW

```bash
# Before starting new feature
git checkout -b feature/[feature-name]

# After each working implementation
git add -A
git commit -m "feat: [description]"

# Never commit broken code
# Merge only after tests pass
```

---

## DEBUGGING CHECKLIST

If stuck on an issue:
1. [ ] Check browser console for errors
2. [ ] Check terminal for API errors
3. [ ] Verify environment variables in `.env.local`
4. [ ] Run `npm run build` to catch type errors
5. [ ] Run `npx playwright test` to check test status
6. [ ] Check if Gemini API key is valid

---

## CURRENT STATE

**Last Updated**: _To be filled by agent_

**Current Phase**: Phase 1 - Core Generation + Branding + Gubey

**In Progress**: _Check task.md_

**Blockers**: None identified

---

## QUICK COMMANDS

```bash
# Development
npm run dev              # Start dev server
npm run build            # Production build
npm run lint             # Check linting
npm test                 # Run Playwright tests

# Testing specific
npx playwright test --ui # Visual test runner
npx playwright test tests/e2e-flows.spec.ts  # Run specific test

# Debug
node scripts/test-gemini-api.js  # Test Gemini connection
```

---

## SUCCESS SIGNAL

When all completion criteria are met, output:

```
🎉 RALPH LOOP COMPLETE 🎉

All completion criteria satisfied:
✅ Authentication with streaks
✅ All image styles working
✅ Logo on all images
✅ Mini-games with Gubey
✅ Leaderboard with traction
✅ LinkedIn scheduling
✅ Community social space
✅ All tests passing
✅ Clean production build

The LakeB2B Social Post Generator is fully functional!
```
