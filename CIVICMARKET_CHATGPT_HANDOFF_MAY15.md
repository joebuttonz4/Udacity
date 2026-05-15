# CivicMarket ChatGPT Handoff

Last updated: May 15, 2026

## Start here

Project path:

J:\CivicMarket

At the start of the next session, run:

cd J:\CivicMarket
git status

Expected status:

On branch master
nothing to commit, working tree clean

## Latest commits

1621084 Document candidate profile manual test
382e838 Add read-only candidate profile
7b025d2 Ignore Claude local settings
1869b91 Fix all ESLint errors across 7 source files
b64fb5c Add CivicMarket Claude step command
58ac8c4 Add read-only ballot page
e43ad11 Document Supabase security patch

## Current app state

Routes working:

/
/ballot
/candidates/[id]
/onboarding
/onboarding/calculating
/onboarding/districts
/onboarding/dna-teaser
/onboarding/quiz
/onboarding/signup
/onboarding/zip

Recent completed work:

- Supabase beta security patch completed and verified.
- Read-only /ballot route built and tested.
- Claude Code /civic-step command added.
- ESLint cleanup completed.
- Read-only /candidates/[id] route built.
- Ballot candidate cards now link to candidate profiles.
- Candidate profile source URLs are guarded with isSafeUrl.
- No database writes.
- No Supabase policy changes.
- No public launch features.
- Manual browser test passed after commit 382e838.
- Manual test documentation committed in 1621084.

## Important files

src/app/ballot/page.tsx
src/app/candidates/[id]/page.tsx
src/app/layout.tsx
src/lib/candidates.ts
src/lib/dna.ts
src/lib/supabase.ts
.claude/commands/civic-step.md
docs/CHANGELOG.md

## Active beta blockers

Do not invite beta users until all are complete:

- Real PSL candidate data replaces dummy data.
- Voting records have official source URLs.
- Funding rows have official source URLs.
- Legal pages exist.
- Invite code gate works.
- Report Inaccuracy exists on profiles.
- Data Sources exists on profiles.
- Admin can enter voting records.
- Email confirmation re-enabled.
- Real data and AI scores are validated.

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

## Recommended next step

Use Claude Code to inspect and recommend the next small beta-readiness step without editing:

/civic-step inspect the current candidate profile, ballot, and candidate helper code. Recommend the next safest small step for beta readiness. Do not edit files.

Likely next build step after review:

Add a read-only Data Sources section to candidate profiles using existing source_url fields only. Do not add database writes, do not change Supabase policies, do not add public launch features, and do not create new tables. Run npm run lint and npm run build, update docs/CHANGELOG.md, and ask before committing.

## Working style

Continue one step at a time. Use explicit PowerShell commands. Stop after each checkpoint. Ask for output before continuing. Do not delete anything without exact approval.
