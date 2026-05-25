# CivicMarket ChatGPT Handoff - May 25, 2026 - Onboarding Fixes

## Session purpose

This session continued CivicMarket after the May 25 civic feed planning session.

The focus became onboarding stability after discovering that newly created users could leave before entering a ZIP code, return later, log in, and incorrectly land on Home or Ballot without completing district setup.

Several onboarding ZIP issues were found, fixed, tested, documented, and committed.

## Files reviewed at session start

The session started by reading:

1. CIVICMARKET_CHATGPT_HANDOFF_MAY25_CIVIC_FEED.md
2. CIVICMARKET_CURRENT_STATE.md
3. docs/ACTIVE_SPRINT.md

## Major fixes completed

### 1. Incomplete logged-in user routing fixed

Problem:
A user could create an account, leave before ZIP entry, come back later, log in, and land on Home. Home showed "No races found" and Ballot showed "No districts found yet."

Fix:
Home and Ballot now check whether the logged-in user has at least one user_districts row.

Behavior:
- If logged in and no user_districts row exists: redirect to /onboarding/zip
- If logged in and user_districts exists but no candidates/races exist: stay in app and show normal empty state

Files changed:
- src/app/page.tsx
- src/app/ballot/page.tsx

Commit:
- 2d87085 Fix onboarding gate: redirect to /onboarding/zip when no user_districts row

### 2. Unsupported ZIP messaging improved

Problem:
Entering an unsupported ZIP showed a harsh error. Also, after entering an unsupported ZIP, replacing it with 34953 kept the stale error and blocked continuation.

Fix:
Unsupported ZIPs now show a friendly CivicMarket beta availability notice. Error and beta notice state clear whenever the ZIP input changes.

Current message:
Title:
CivicMarket is not available in your area yet

Body:
We are currently testing CivicMarket in Port St. Lucie, Florida. We are starting small so we can keep local election and civic data accurate. Please check back later as CivicMarket expands to more communities.

Helper text:
Try a Port St. Lucie beta ZIP

Supported ZIPs remain unchanged:
- 34952
- 34953
- 34983
- 34984
- 34986
- 34987
- 34988

File changed:
- src/app/onboarding/zip/page.tsx

Commit:
- c8195d5 Fix ZIP screen: clear stale error on input change, friendly beta notice for unsupported ZIPs

### 3. ZIP submit RLS issue fixed

Problem:
Supported ZIP 34953 showed "Something went wrong. Please try again." for some users after a previous onboarding attempt.

Root cause:
user_districts had SELECT, INSERT, and DELETE RLS policies, but no UPDATE policy. Supabase upsert with onConflict can trigger ON CONFLICT DO UPDATE, which failed RLS.

Fix:
Replaced upsert with RLS-safe delete-then-insert:
1. Delete existing user_districts rows scoped to the current user
2. Insert fresh district rows

Reason this is safe:
The DELETE is scoped to user_id = current user. No schema change or RLS policy change was needed.

File changed:
- src/app/onboarding/zip/page.tsx

Commit:
- 1b1719e Fix ZIP submit: replace upsert with delete-then-insert to satisfy RLS

### 4. ZIP Enter key support added

Problem:
After typing a ZIP, pressing Enter did nothing. User had to click Continue.

Fix:
ZIP input now supports both:
- pressing Enter
- clicking Continue

File changed:
- src/app/onboarding/zip/page.tsx

Commit:
- 9e5a5ea Add Enter-key submit to ZIP input via form wrapper

### 5. Enter-submit regression fixed

Problem:
After adding Enter submit, pressing Enter with unsupported ZIP 58072 briefly showed the beta notice, then jumped to the next onboarding screen.

Fix:
Back button was explicitly set to type="button", and submit handling was isolated through a named handleSubmit. Unsupported ZIPs now stay on /onboarding/zip and do not navigate.

File changed:
- src/app/onboarding/zip/page.tsx

Commit:
- 1d0df4f Fix Enter-submit regression: type="button" on Back, named handleSubmit

### 6. Documentation updated

Files updated:
- CIVICMARKET_CURRENT_STATE.md
- docs/ACTIVE_SPRINT.md
- docs/CHANGELOG.md

Documented:
- onboarding gate fix
- unsupported ZIP beta notice
- stale ZIP error clearing
- Enter submit behavior
- unsupported ZIP Enter regression fix
- user_districts delete-then-insert RLS-safe fix
- lint and build passed

Commit:
- newest docs commit after 1d0df4f: Document May 25 onboarding gate and ZIP screen fixes

## Validation completed

Repo was clean before and after fixes.

Confirmed by user:
- incomplete user redirect worked
- unsupported ZIP notice worked
- supported ZIP retry worked
- ZIP submit worked after RLS-safe delete-then-insert fix
- Enter submit worked after regression fix

Claude Code reported:
- npm run lint passed
- npm run build passed
- build passed for 18/18 pages

## Current repo status at last checkpoint

User ran:

git status
git log --oneline -6

Before documentation commit, latest commits were:

1d0df4f Fix Enter-submit regression: type="button" on Back, named handleSubmit
9e5a5ea Add Enter-key submit to ZIP input via form wrapper
1b1719e Fix ZIP submit: replace upsert with delete-then-insert to satisfy RLS
c8195d5 Fix ZIP screen: clear stale error on input change, friendly beta notice for unsupported ZIPs
2d87085 Fix onboarding gate: redirect to /onboarding/zip when no user_districts row
88d7666 Add May 25 civic feed handoff

Then documentation was updated and committed.

Next session should run:

git status
git log --oneline -8

Expected:
- working tree clean
- newest commit is documentation update for May 25 onboarding fixes

## Important safety notes

No database schema changes were made.

No RLS policies were changed.

No Supabase grants were changed.

No users were deleted or modified manually.

No civic feed automation was built.

No Edge Functions were added.

No candidate, ballot, voting record, or funding data was changed.

## Product behavior decisions made

Onboarding completion is based on user_districts, not on whether candidates or ballot measures exist.

Correct behavior:
- no user_districts row: user has not completed district onboarding, redirect to /onboarding/zip
- has user_districts row but no candidates: stay in app and show empty state
- has user_districts row but no measures: stay in app and show empty state
- civic feed can still show citywide, ZIP-level, or district-level content even when no candidates or measures exist

Unsupported ZIP behavior:
The app should not pretend all cities are coming soon. It should honestly say CivicMarket is currently testing in Port St. Lucie and users can check back later as it expands.

## Remaining hard beta blockers

From the updated docs, remaining blockers include:

- Replace dummy data with real validated PSL candidate data
- Replace dummy voting records with real records and official source URLs
- Replace dummy funding rows with real funding data and source URLs
- Legal pages
- Invite code gate
- Report Inaccuracy database-backed submission
- Email confirmation re-enabled
- /measures/[id] smoke test once measure data exists

## Recommended next safest step

Do not start civic feed automation yet.

Do not change schema or RLS yet.

Next safest project step:
Begin preparing for real PSL data replacement.

Recommended first action:
Review the current dummy data and create a careful replacement plan for:
- candidates
- voting_records
- candidate_funding
- ballot_measures if available

Before inserting or replacing real data:
- confirm official source URLs
- confirm no beta user will see fake data
- use a limited, reversible import approach
- document test rows versus real rows
- avoid deleting anything without exact approval

## Suggested next chat opening prompt

I'm continuing CivicMarket. Please read CIVICMARKET_CHATGPT_HANDOFF_MAY25_ONBOARDING_FIXES.md first, then CIVICMARKET_CURRENT_STATE.md, then docs/ACTIVE_SPRINT.md. After that, give me the next safest step. Do not start civic feed automation or schema/RLS changes unless I explicitly approve them.
