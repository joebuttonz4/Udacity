# CivicMarket Claude Instructions

## Read first

Always read these files before planning or editing:

1. @CIVICMARKET_CURRENT_STATE.md
2. @Reference Files/CIVICMARKET_PATCH_MAY12.md

Only read older docs when explicitly needed.

If older docs conflict with CIVICMARKET_CURRENT_STATE.md, follow CIVICMARKET_CURRENT_STATE.md.

## Current project

CivicMarket is a non-partisan, mobile-first local election app for the Port St. Lucie beta.

Current strategy:
- Build with dummy data first
- Replace dummy data with real PSL data before beta users
- Keep beta invite-only
- Do not build public-launch features yet

## Current active priority

Audit and stabilize the existing Week 3 onboarding work before building more screens.

Current routes already exist:
- /onboarding
- /onboarding/signup
- /onboarding/zip
- /onboarding/districts
- /onboarding/dna-teaser
- /onboarding/quiz
- /onboarding/calculating

## Do not build before beta

Do not build:
- Twilio
- Firecrawl
- Gemini automation
- Agents 1, 2, or 3
- Full 5-tab admin
- Campaign portal
- Expo app
- Federal races
- Voter roll matching
- Public launch features

## Non-negotiable coding rules

- TypeScript only
- Tailwind only
- No inline styles in app components
- Use Supabase client from src/lib/supabase.ts
- Never expose service role keys in browser code
- Never put server secrets in NEXT_PUBLIC variables
- All dimension keys must match the seven locked snake_case keys
- Q8-Q14 quiz answers are reversed at compute time only
- Raw quiz answers are stored as-is
- Match scores are integers 0-100
- Dimension scores are -2.0 to 2.0
- source_url is required for every voting record

## Required workflow

Before editing:
1. Run git status.
2. Read the files you will edit.
3. Summarize the planned changes.
4. Do not overwrite uncommitted user changes.

After editing:
1. Run npm run lint.
2. Run npm run typecheck if available.
3. Run npm run build before major commits.
4. Update CIVICMARKET_CURRENT_STATE.md if project state changed.
5. Commit with a descriptive message.

## Preferred task size

One route, one feature, or one fix per session.

Do not combine onboarding, ballot, profile, admin, and scoring work in one session.