# CivicMarket Current State

Last updated: May 25, 2026

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
- /admin/records route — read-only admin voting-record review list, admin-gated (profiles.is_admin = true, non-admin redirects to /), fetches voting_records joined to candidates ordered by created_at descending, displays candidate name/office, issue title, bill number, vote cast, dimension, vote date, source URL, created_at, no delete button, no delete logic, no DELETE RLS policy, beta warning banner shown, lint passed, build passed, complete, commit 93342f3, May 17 2026
- /admin/records removal controls — two-step voting-record deletion (Remove → inline confirmation → Confirm delete), deletes by exact voting_records.id, scored-record guard (community_score_count > 0 or community_score_final not null disables Remove), DELETE RLS policy "Admins can delete voting records" added and verified, TEST ONLY row id 5a0e22b2-ed14-430d-995d-a333bb5d2838 deleted and confirmed gone in Supabase (linked vote_community_scores was 0), database is now clean of test data, lint passed, build passed, complete, commit 31adca9, May 17 2026
- Supabase security grant patch — manual SQL in SQL Editor, no code commit: (1) REVOKE TRUNCATE, TRIGGER, REFERENCES on all public tables from anon and authenticated; verified no remaining grants of those types. (2) DO block revoked INSERT/UPDATE/DELETE from anon and authenticated only where matching_policy_count = 0; verified no remaining unguarded grants. Post-patch: RLS enabled on all public tables confirmed, profiles.is_admin not browser-writable, match_scores SELECT-only, reviews SELECT and INSERT only (no UPDATE). No data deleted. No RLS policies changed. No schema changes. Complete, May 17 2026.
- Post-grant-patch smoke test — run May 17 2026 after commit `51ca84d`. No code changes. No database changes. Routes confirmed working: /, /admin/entry (insert confirmed), /admin/records (list and two-step delete confirmed, TEST ONLY row deleted, no real rows deleted), /ballot (loaded, candidate cards and links worked, bottom nav appeared), /profile (loaded, normal profile/DNA state), /data-sources, /report (UI-only submit confirmed, no database write), /vote, /candidates/[id] (one profile, voting records and source links visible). No permission errors on any route. Known issues found: (1) ballot match rings not showing, (2) profile sign out not visible, (3) candidate profile Report Inaccuracy link/button missing. /measures/[id] not tested — no measure exists in current dummy data. Complete, May 17 2026.
- /candidates/[id] Report Inaccuracy link — added "Report an Inaccuracy" Link at the bottom of the loaded candidate profile, after the read-only disclaimer, linking to /report. No database changes. No RLS changes. No /report behavior changes. lint passed, build passed, complete, May 17 2026.
- Ballot match rings (display/read path only) — fixed, commit 153a356, May 17 2026. The ring UI correctly reads and renders existing match_scores rows. Verified May 25 2026 via manual SQL insert for civicmarket.test.01@example.com: five rings unlocked (Maria Santos 65, Linda Marsh 75, Patricia Nguyen 71, Angela Torres 79, James Whitfield 38). David Okafor, Carlos Reyes, and Robert Chambers remained locked — they have no scored voting records or candidate_positions rows. Gap identified: no code creates match_scores rows automatically after quiz completion — see hard beta blockers.
- Profile sign out button — fixed, commit 66d2518, May 17 2026.
- All three post-grant-patch smoke test UI issues resolved.
- UI design alignment pass — complete, lint passed, build passed, May 17 2026 session 3. Changes: NavBar converted to active-state-aware client component imported from layout (removed duplicate hardcoded nav), MatchScoreRing sizes updated to spec (sm=48px, md=72px, lg=96px), all main screens (/, /ballot, /candidates/[id], /measures/[id], /vote, /profile, /onboarding) converted from all-dark to split dark-hero-header + #F6F8FA light body with white shadow cards, all inline style= violations removed (converted to [font-family:var(--font-syne)] Tailwind classes), globals.css cleaned to @import "tailwindcss" only, scope tags updated to spec colors (city=teal, county=blue, state=indigo), back-button arrows improved on profile/measure pages, warning banners updated to amber tone.
- Coastal UI design system — approved brand PNG assets (home-hero-coastal.png, candidate-hero-palms.png, dna-hero-coastal-light.png) placed in public/brand/; CoastalHero updated to use PNG backgrounds for dark variant (warm=true → home-hero-coastal.png, warm=false → candidate-hero-palms.png); SVG illustration superseded; DNA teaser hero updated to light coastal style using dna-hero-coastal-light.png with left-to-right white gradient overlay (from-white/92 via-white/78 to-white/20) protecting left-aligned dark text; candidate avatar enlarged (w-20 h-20); docs/design/README.md created; commit 415e732, lint passed, build passed, May 17 2026 session 4.
- Home countdown hydration fix — useState<Countdown | null>(null) with named inner tick() function in useEffect eliminates SSR/client Date.now() mismatch; countdown renders -- before client mount, then live values; lint passed, build passed, May 17 2026 session 4.
- Countdown and DNA teaser accessibility fixes — countdown boxes changed to bg-black/[0.22], labels to text-white/70 text-[11px] font-medium for readability over image background; DNA teaser subtitle changed to text-slate-700 with left-to-right overlay for consistent protection; lint passed, build passed, May 17 2026 session 4.
- Civic Feed rename — visible UI text updated from "Civic Pulse" to "Civic Feed" everywhere it appears in rendered UI; no database tables, file names, or backend naming changed; May 17 2026 session 4.
- Onboarding gate fix — incomplete logged-in users (valid auth session but no user_districts row) now redirect to /onboarding/zip from / (Home) and /ballot instead of showing an empty or broken screen; commit 2d87085, May 25 2026.
- /onboarding/zip unsupported ZIP notice — replaced harsh red error text with a friendly beta availability card: title "CivicMarket is not available in your area yet", body explaining the PSL beta and future expansion, teal helper text "Try a Port St. Lucie beta ZIP"; not an error state — no red styling; commit c8195d5, May 25 2026.
- /onboarding/zip stale error clearing — error message and beta notice both clear on every keystroke via handleZipChange; a previous unsupported or invalid ZIP no longer blocks a subsequent valid attempt; commit c8195d5, May 25 2026.
- /onboarding/zip user_districts write — replaced upsert with delete-then-insert; upsert ON CONFLICT DO UPDATE required an UPDATE RLS policy that user_districts intentionally does not have, causing silent RLS failure on re-attempts; DELETE and INSERT policies both exist and are used; commit 1b1719e, May 25 2026.
- /onboarding/zip Enter-key submit — outer div converted to a form with a named handleSubmit(e: React.FormEvent); e.preventDefault() called first; Continue button is type="submit"; pressing Enter in the ZIP field triggers identical handleSubmit logic as clicking Continue; commits 9e5a5ea and 1d0df4f, May 25 2026.
- /onboarding/zip Enter-submit regression fix — Back button missing type="button" defaulted to type="submit" inside the form; pressing Enter caused browser to fire router.back() before the form onSubmit could run, making unsupported ZIP notice flash then navigate away; fixed by adding type="button" to Back button; commit 1d0df4f, May 25 2026.
- Automatic match score generation after Civic DNA completion — complete, commits 4c4479d and f4e5786, May 25 2026. POST /api/compute-match-scores validates user session via service-role client, fetches latest civic_dna and candidate_positions, computes alignment scores (average of non-null dimensions, 0–100 integer, using computed_at), deletes only candidate match_scores rows being recomputed (measure rows untouched), inserts fresh rows. sessionStorage lock key scoped to user ID prevents React Strict Mode double-mount from firing two concurrent API calls. New files: src/lib/supabase-server.ts (server-only service-role client), src/app/api/compute-match-scores/route.ts (POST handler). Acceptance test passed May 25 2026: civicmarket.test.04@example.com retook Civic DNA quiz, /onboarding/calculating generated 5 match_scores rows automatically (Maria Santos 70, Patricia Nguyen 63, Angela Torres 42, James Whitfield 38, Linda Marsh 38), single computed_at = 2026-05-25 23:12:00.986+00, no manual SQL. No schema changes. No RLS changes. No grant or policy changes. No measure score computation. lint passed, build passed (19 routes).

## Immediate priorities

1. Replace dummy data with real validated PSL candidate, voting record, and funding data before beta invitations


## Civic feed strategic direction

The civic feed is now a core product pillar, not a secondary election-season feature.

New direction:
- CivicMarket should become a year-round civic awareness platform
- The feed should help residents understand local government activity before it affects them
- The feed should support personalized civic intelligence based on district, neighborhood, followed topics, Civic DNA, and user engagement
- The beta version should use semi-automated civic feed planning with human review before publishing

Beta-safe definition:
AI-powered personalized local government awareness.

Beta feed approach:
- Government sources may be ingested from agendas, public notices, city announcements, and meeting materials
- AI may summarize, classify, and simplify source material
- Admin review is required before feed items are published
- Public posting, unrestricted comments, autonomous publishing, and advanced multi-city crawling remain deferred

Source of truth:
- docs/design/CIVIC_FEED_STRATEGY.md

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
- Legal pages exist ✓ — /privacy and /terms, both public static pages, beta-draft notice on each, no contact email until domain exists, consent notice added to /onboarding/signup, commit 94cae59, July 2 2026
- Invite code gate works ✓ — server-side POST /api/validate-invite checks INVITE_CODE env var (never NEXT_PUBLIC_), case-insensitive, fails closed if env var missing; invite code field added above email on /onboarding/signup; login path untouched; commit 7dfb181, July 2 2026. Requires INVITE_CODE=<code> in .env.local to activate.
- Report Inaccuracy database-backed submission exists (currently deferred — UI shell only)
- Data Sources exists ✓
- Admin can enter voting records ✓ (commit e24fe14)
- Admin review/removal page exists ✓ (commits 93342f3 + 31adca9) — review list and deletion controls complete, DELETE RLS policy verified, test row deleted
- Security patch applied ✓ — grant patch May 17 2026 (REVOKE TRUNCATE/TRIGGER/REFERENCES; revoked unguarded INSERT/UPDATE/DELETE; verified match_scores SELECT-only, reviews no UPDATE, profiles.is_admin not browser-writable)
- Ballot match rings not showing ✓ — display/read path fixed, commit 153a356 (rings render correctly when match_scores rows exist)
- Profile sign out not visible ✓ — fixed, commit 66d2518
- Candidate profile Report Inaccuracy link/button missing ✓ — fixed, link added to /report
- Automatic match score generation after Civic DNA completion ✓ — complete, commits 4c4479d and f4e5786. Acceptance test passed May 25 2026: civicmarket.test.04@example.com (user_id 479780fe-e447-4c6e-9462-338841bbaa4b) retook Civic DNA quiz, 5 match_scores rows generated automatically (Maria Santos 70, Patricia Nguyen 63, Angela Torres 42, James Whitfield 38, Linda Marsh 38), single computed_at = 2026-05-25 23:12:00.986+00, /ballot rings unlocked without manual SQL. No schema changes. No RLS changes. No grant or policy changes.
- /measures/[id] smoke test pending — no measure data exists yet; must test once real measure data is in place
- Email confirmation re-enabled

