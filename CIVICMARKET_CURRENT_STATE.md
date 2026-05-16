# CivicMarket Current State

Last updated: May 15, 2026

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

## Immediate priorities

1. Build safe Vote screen (official links only)
3. Build Profile screen
4. Build Report Inaccuracy
5. Build Data Sources
6. Minimal admin voting-record entry
7. Minimal admin review removal
8. Patch remaining Supabase security risks
9. Replace dummy data with real PSL data before beta invitations

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
- Real PSL data replaces dummy data
- Voting records have official source URLs
- Funding rows have source URLs
- Legal pages exist
- Invite code gate works
- Report Inaccuracy exists
- Data Sources exists
- Admin can enter voting records
- Security patch applied
- Email confirmation re-enabled