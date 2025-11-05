# LakeB2B Social Post Generator: Comprehensive Product Requirements Document

## Introduction & Executive Summary
- **Purpose**: Automate creation of high-engagement, brand-consistent social posts (images) for LakeB2B using Claude Code and generative UI workflows.
- **Scope**: Web app using Next.js, ShadCN, Chakra UI, Gemini Nano Banana for image generation, Thesys C1 API for UI agent integration.
- **Audience**: LakeB2B marketing/content teams; Claude-powered automations.

## Problem Statement
- Creating branded social images is slow, manual, prone to inconsistency (logo, color, headline).
- AI generators can’t reliably insert actual brand assets or enforce style/placement without extensive post-processing.

## Solution/Feature Overview
- AI-powered post generator uses prompt engineering and dynamic logo insertion, automates branding, outputs ready-to-post visuals (isometric/cartoon/data viz styles).
- Thesys C1 Generative UI for agent flows; Gemini’s Nano Banana for image generation; brand assets uploaded/inserted automatically.

## Atomic User Stories
- As a marketer, I want to input a post message and select a style so the app generates a brand-compliant image with LakeB2B logo.
- As a content manager, I want batch image generation from a CSV, so I can launch entire campaigns in minutes.
- As a designer, I want to override logo placement and headline so every post fits brand templates.

## Functional Requirements
- Prompt-based image generation (Gemini, Nano Banana, via API key).
- Logo insertion (SVG, PNG support, must replace all AI-placeholder logos).
- Branded color overlays (gradient engine, palette enforcement from brand book).
- Batch mode: input/upload multiple posts, get multiple images.
- Headline/text overlay (Montserrat font, positioning controls).
- Export: LinkedIn, Instagram, dashboard sizes, ZIP batch.
- Live preview & re-generate.
- Only authenticated LakeB2B users (role/permission system).

## Technical Requirements
- **Frontend**: Next.js, Chakra UI, ShadCN (theme support, modals, live preview UI).
- **Backend**: Node.js server, API orchestration, Claude Code integration, S3/GCS/R2 image storage.
- **Integrations**:
  - Thesys C1 API: Configure in environment variables
  - Gemini API Key: Configure in environment variables
- **Constraints**:
  - MUST use OAuth 2.0 authentication.
  - MUST support 10,000+ concurrent users.
  - NO external cloud storage for generated images (LakeB2B compliance).
  - Actual logo from `/loginlogo/` endpoint always used—never fake/AI logos.
- **Fallback Logic**:
  - If API fails, retry up to 3x, then show error + dev log.
  - If logo overlay fails, prompt manual upload.

## Acceptance Criteria (Checklist)
- [ ] Every post generated includes the actual LakeB2B logo (not AI-drawn fake).
- [ ] Image matches one of approved isometric, clean, cartoon styles (see references).
- [ ] Palette conforms strictly to brand gradients (Orange, Red, Purple).
- [ ] Headline in Montserrat, with correct padding/contrast.
- [ ] Preview panel updates live with prompt regeneration.
- [ ] All outputs downloadable in social sizes (LinkedIn, Instagram, Feed).
- [ ] Batch mode processes 20+ posts per run.
- [ ] Failsafe error handling on all API calls.
- [ ] UI is accessible (WCAG AA), touch-friendly, themeable.

## Non-Functional Requirements
- Image generation < 30 sec; logo insertion < 5 sec.
- 99.9% uptime; retry logic for all APIs.
- Storage encrypted; asset access only for logged users.
- Usage analytics for post actions.
- Performance benchmarks for each request.

## UX/UI Design Requirements
- Screenshots/style refs: Isometric business illustrations, New Yorker cartoon posts, dashboard thumbnails (attach/upload references).
- Layout: Notion/Figma-style pane (prompt entry left, live preview main); modals, batch upload.
- Use ShadCN UI, Chakra UI components (buttons, modals, tabs).
- Gradients/logo per brand book.
- Batch generator: drag-drop CSV, progress bar, output ZIP link.
- Minimal dashboards, live preview panels.

## Development Roadmap & Milestones
- MVP (2 wks): Single input; image gen; logo upload/overlay; live preview.
- Enhanced (2 wks): Batch; auto logo; prompt manager.
- Final (2 wks): Style references; error handling; RBAC; analytics.
- Beta/test: Feedback loop with LakeB2B design + Claude agentic review.

## Risks & Assumptions
- AI prompts may fail logo enforcement (MUST always overlay after gen).
- API costs grow fast if usage spikes.
- Style drift unless prompt refs updated.
- Asset uploads/storage must meet privacy/compliance.

## Best Practices for Claude Code
- Modular atomic sections (MCP/indexable).
- Strict checklists for acceptance criteria.
- Hard constraints flagged “MUST.”
- Attach prompts, images for reference.
- Never blend requirements: one feature/story per section.

## Sample Integration Workflow
1. User inputs content + style
2. Claude Code parses PRD, builds UI via Thesys C1 API
3. Gemini generates image per branded prompt
4. Logo overlay tool replaces placeholder with SVG/PNG from `/loginlogo/`
5. Live preview; user tweaks headline, position
6. Outputs downloadable in all needed sizes (batch ZIP)
7. Each stage logs performance, success/error
8. Auth required; RBAC for batch/brand functions

## Claude-Ready Checklist
- Atomic/labeled requirements, all sections
- Checkboxes/clear verbs for acceptance
- Constraints flagged “MUST”
- UX/UI screenshots referenced/uploaded
- API keys/endpoints/models listed
- MCP/Claude fetchable by section

## References
- Style screenshots (attached)
- Brand book/colors (LakeB2B provided)
- API docs: [Gemini](https://ai.google.dev/gemini-api/docs), [Thesys C1](https://docs.thesys.dev/guides/what-is-thesys-c1)
- Claude agent best practices, ChatPRD MCP workflow guidance

---

This PRD is fully agentic, Claude/MCP ready, highly atomic, and reference-indexable for robust implementation and ongoing compliance.