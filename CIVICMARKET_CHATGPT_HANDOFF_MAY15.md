# CivicMarket ChatGPT Handoff

Last updated: May 15, 2026

## Start here

Project path:

J:\CivicMarket

At the start of the next ChatGPT session, run:

cd J:\CivicMarket
git status

Expected status:

On branch master
nothing to commit, working tree clean

## Latest commits

9d2e6b5 Add ChatGPT handoff
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
- ChatGPT handoff committed in 9d2e6b5.

## Claude inspection after 9d2e6b5

Prompt used:

/civic-step inspect the current candidate profile, ballot, and candidate helper code. Recommend the next safest small step for beta readiness. Do not edit files.

Result:

- Working tree was clean.
- No files were edited.
- Tests were not run because this was read-only inspection.

Files inspected by Claude:

- src/app/ballot/page.tsx
- src/app/candidates/[id]/page.tsx
- src/lib/candidates.ts
- docs/ACTIVE_SPRINT.md
- CIVICMARKET_CURRENT_STATE.md
- Supabase client/docs context

Claude findings:

- Ballot page is structurally sound.
- Candidate profile page is structurally sound.
- Candidate helper code uses read-only selects for ballot/profile/funding/voting records.
- autoFollowCandidates is a write function in src/lib/candidates.ts, but it is not called by ballot or candidate profile.
- docs/ACTIVE_SPRINT.md is stale and still warns not to build Ballot or Candidate Profile, even though both are done.
- CIVICMARKET_CURRENT_STATE.md is stale and still lists Ballot and Candidate Profile as immediate priorities.
- getCandidateVotingRecords does not filter archived_at, unlike candidate queries.
- photo_url is fetched but not rendered.
- school_board scope tag displays as County, which may be a display choice to revisit before real data.

Claude recommended next safest step:

Update docs/ACTIVE_SPRINT.md and CIVICMARKET_CURRENT_STATE.md to mark ballot and candidate profile complete, then move the sprint focus to the Home screen.

Reason:

- Stale docs are now the biggest risk for future AI sessions.
- ACTIVE_SPRINT.md currently contradicts completed work.
- Updating docs is safer than touching auth, Supabase policy, invite codes, or signup flow.
- After docs are correct, Home screen is the next natural beta-readiness milestone.

Suggested next Claude prompt:

/civic-step update docs/ACTIVE_SPRINT.md and CIVICMARKET_CURRENT_STATE.md to reflect that /ballot and /candidates/[id] are complete and manually tested. Move the next sprint focus to the Home screen. Do not change code, Supabase policies, auth, or database behavior. After editing, show the diff and ask before committing.

## Important files

src/app/ballot/page.tsx
src/app/candidates/[id]/page.tsx
src/app/layout.tsx
src/lib/candidates.ts
src/lib/dna.ts
src/lib/supabase.ts
.claude/commands/civic-step.md
docs/CHANGELOG.md
docs/ACTIVE_SPRINT.md
CIVICMARKET_CURRENT_STATE.md
CIVICMARKET_CHATGPT_HANDOFF_MAY15.md

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

## Known limits to track

- getCandidateVotingRecords is missing archived_at filtering.
- photo_url is fetched but not rendered.
- Data Sources section does not exist yet.
- Report Inaccuracy does not exist yet.
- Home screen has not been built yet.
- Invite code gate has not been built yet.
- Legal pages do not exist yet.

## Working style

Continue one step at a time.

Use explicit PowerShell commands.

Stop after each checkpoint.

Ask for output before continuing.

Do not delete anything without exact approval.

Do not make Supabase/RLS/auth/security changes without read-only audit, scope, expected result, no-change check, exact proposal, user approval, verification queries, and documentation.
