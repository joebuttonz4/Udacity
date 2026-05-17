# CivicMarket Current State

Last updated: May 17, 2026

## Authoritative order

When files conflict, follow this order:

1. CIVICMARKET_CURRENT_STATE.md
2. Reference Files/CIVICMARKET_PATCH_MAY12.md
3. Reference Files/CIVICMARKET_WEEK3_HANDOFF_v3.md
4. Reference Files/CIVICMARKET_PROJECT_KNOWLEDGE.md
5. Older build guides and older handoffs are historical/reference only

## Current strategy

We are building with dummy data first.

Real PSL research data replaces dummy data before beta invitations.

No beta user may see fake candidate, voting record, funding, or ballot data.

## Locked beta scope

Build for beta:
- Invite-code gated signup
- Email/password auth first
- ZIP/district onboarding
- District confirmation
- Civic DNA quiz
- Ballot
- Home
- Candidate profile
- Measure profile
- Vote screen with safe official links
- Profile screen
- Report Inaccuracy
- Data Sources
- Minimal admin voting-record entry
- Minimal admin review removal
- Claude draft scoring, reviewed/validated before beta
- Manual civic feed rows

Do not build before beta:
- Twilio
- Firecrawl
- Gemini automation
- Agents 1, 2, or 3
- Full 5-tab admin
- Public launch
- Federal races
- Campaign portal
- Expo mobile app
- Full PWA service worker
- Voter roll matching

## Completed as of current checkpoint

Confirmed complete:
- Git initialized
- Initial checkpoint commit created
- Supabase connected
- Dummy PSL data seeded
- layout.tsx customized
- NavBar created
- onboarding layout created
- onboarding welcome screen created
- signup screen created
- ZIP entry screen created
- onboarding/districts route exists
- onboarding/dna-teaser route exists
- onboarding/quiz route exists
- onboarding/calculating route exists
- src/lib/dna.ts exists
- /ballot route — complete, manually tested May 15 2026
- /candidates/[id] route — read-only candidate profile, complete, manually tested May 15 2026
- / (Home) route — read-only Home screen, complete, commit 48b81f3, docs commit e2d3afb, May 15 2026
- /measures/[id] route — read-only Measure Profile, complete, commit c84c331, May 15 2026
- /ballot → /measures/[id] integration — measure cards link to Measure Profile, complete, commit 183b070, May 15 2026
- /vote route — read-only Vote screen, official links only, isSafeUrl guard, read-only Supabase selects, no Edge Functions, lint passed, build passed, complete, commit bebed21, May 15 2026
- /profile route — read-only Profile screen, auth-gated, reads profiles and civic_dna (latest row), shows 7 dimension scores or quiz nudge, no writes, lint passed, build passed, complete, commit bfe11ac, May 16 2026
- /report route — UI-only Report Inaccuracy shell, auth-gated, local component state only, no Supabase writes, no SQL, no tables, no RLS policies, beta message shown on submit, lint passed, build passed, complete, commit 6c63b51, May 16 2026
- /data-sources route — static Data Sources page, auth-gated, no Supabase reads beyond auth, five static methodology sections, no writes, no tables, lint passed, build passed, complete, commit b81e8ef, May 16 2026
- /admin/entry route — minimal admin voting-record entry form, admin-gated (profiles.is_admin = true, non-admin redirects to /), loads active candidates (archived_at IS NULL) ordered by name, form fields: candidate, issue title, issue description, bill number (optional), vote date, vote cast (for/against/abstain), dimension (all seven locked keys), source URL (required, isSafeUrl validated), inserts one row into voting_records on submit, RLS INSERT policy "Admins can insert voting records" added and verified in Supabase SQL Editor, existing "Voting records are publicly readable" SELECT policy unchanged, browser-tested with joebuttonz4@gmail.com, test row id 5a0e22b2-ed14-430d-995d-a333bb5d2838 (issue_title: TEST ONLY - Admin voting record entry, candidate: Angela Torres) remains in database, lint passed, build passed, complete, commit e24fe14, May 17 2026

## Immediate priorities

1. Minimal admin review/removal page
2. Patch remaining Supabase security risks
3. Replace dummy data with real PSL data before beta invitations

## Deferred — requires separate approval

- Database-backed report submission for /report — needs new inaccuracy_reports table, INSERT policy, and SQL/RLS risk check approved before building

## Civic DNA source of truth

Use:
Reference Files/CIVICMARKET_PATCH_MAY12.md

Locked dimension keys:
- growth_development
- taxation_spending
- education
- environment
- public_safety
- housing
- transparency

Q8-Q14 are reversed at compute time only.

Raw answers are stored as-is.

## Hard beta blockers

No beta invitations until:
- Real PSL data replaces dummy data (with real AI-scored voting records validated before use)
- Voting records have official source URLs
- Funding rows have source URLs
- Legal pages exist
- Invite code gate works
- Report Inaccuracy database-backed submission exists (currently deferred — UI shell only)
- Data Sources exists ✓
- Admin can enter voting records ✓ (commit e24fe14)
- Admin review/removal page exists
- Security patch applied
- Email confirmation re-enabled