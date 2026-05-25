# Active Sprint

## Sprint: App Smoke Tests + Real PSL Data Preparation

## Goal

Verify the app is stable after the security grant patch, then replace all dummy PSL data with real, validated candidate, voting record, and funding data before beta invitations go out.

## Previously completed

- /onboarding — welcome screen
- /onboarding/signup — email/password signup
- /onboarding/zip — ZIP entry, writes user_districts
- /onboarding/districts — district confirmation
- /onboarding/dna-teaser — take now or skip
- /onboarding/quiz — May 12 questions, raw answers stored as-is
- /onboarding/calculating — computes civic_dna, redirects to /ballot
- /ballot — ballot screen, manually tested May 15 2026
- /candidates/[id] — read-only candidate profile, manually tested May 15 2026
- / (Home) — read-only Home screen, built May 15 2026, commit 48b81f3
- /measures/[id] — read-only Measure Profile, built May 15 2026, commit c84c331
- /ballot → /measures/[id] integration — measure cards link to Measure Profile, built May 15 2026, commit 183b070
- /vote — read-only Vote screen, official links only, built May 15 2026, commit bebed21
- /profile — read-only Profile screen, Civic DNA results + account details, built May 16 2026, commit bfe11ac
- /report — UI-only Report Inaccuracy shell, auth-gated, local state only, no Supabase writes, beta message shown on submit, built May 16 2026, commit 6c63b51
- /data-sources — static Data Sources page, auth-gated, no Supabase reads beyond auth, static methodology content, built May 16 2026, commit b81e8ef
- /admin/entry — minimal admin voting-record entry form, admin-gated, inserts into voting_records, browser-tested, RLS policy verified, built May 17 2026, commit e24fe14
- /admin/records — read-only admin voting-record review list, admin-gated, no delete, no delete RLS, built May 17 2026, commit 93342f3
- /admin/records (removal) — voting-record removal controls added, two-step confirmation, scored-record guard, DELETE RLS policy verified, TEST ONLY row deleted and confirmed gone, built May 17 2026, commit 31adca9
- Supabase security grant patch — REVOKE TRUNCATE/TRIGGER/REFERENCES from anon/authenticated on all public tables; revoked INSERT/UPDATE/DELETE where no matching RLS policy existed; verified match_scores SELECT-only, reviews SELECT+INSERT only, profiles.is_admin not browser-writable, RLS enabled on all tables, applied May 17 2026 (manual SQL, no code commit)
- Post-grant-patch smoke test — run May 17 2026 after commit `51ca84d`; admin insert/list/delete confirmed working; /, /ballot, /candidates/[id], /vote, /profile, /report, /data-sources all loaded; no permission errors; three known issues found (see below); /measures/[id] not tested (no measure data); no code changes
- Coastal UI design system — approved PNG brand assets integrated (home-hero-coastal.png, candidate-hero-palms.png, dna-hero-coastal-light.png); CoastalHero updated; DNA teaser light coastal style; home countdown 4-box live UI; hydration mismatch fix; countdown and DNA teaser accessibility/contrast fixes; Civic Feed rename; docs/design/README.md created; commit 415e732, lint passed, build passed, May 17 2026 session 4
- Onboarding gate fix — incomplete logged-in users (auth session but no user_districts row) redirect to /onboarding/zip from / and /ballot; commit 2d87085, May 25 2026
- /onboarding/zip ZIP screen fixes — friendly beta availability notice for unsupported ZIPs; stale error/notice clears on every keystroke; user_districts write switched from upsert to delete-then-insert (no UPDATE policy on user_districts); Enter key submits via form onSubmit; Back button type="button" prevents Enter from triggering router.back(); commits c8195d5, 1b1719e, 9e5a5ea, 1d0df4f; lint passed, build passed; May 25 2026
- Automatic match score generation after Civic DNA completion — /onboarding/calculating calls POST /api/compute-match-scores; sessionStorage lock scoped to user ID prevents React Strict Mode duplicate calls; acceptance test passed May 25 2026 with civicmarket.test.04@example.com: 5 match_scores rows generated automatically (Maria Santos 70, Patricia Nguyen 63, Angela Torres 42, James Whitfield 38, Linda Marsh 38), single computed_at = 2026-05-25 23:12:00.986+00, no manual SQL; commits 4c4479d and f4e5786; lint passed, build passed (19 routes); May 25 2026


## Match score generation (complete)

**Root cause identified May 25 2026.**

The quiz flow computes and stores civic_dna correctly. /onboarding/calculating redirects to /ballot after writing the civic_dna row. No code in the onboarding flow creates match_scores rows. The Supabase security grant patch (May 17 2026) confirmed match_scores is SELECT-only from the browser — no INSERT or UPDATE policy exists for authenticated users.

Verified behavior (manual SQL insert for civicmarket.test.01@example.com, May 25 2026):
- Five rings unlocked when rows were inserted manually: Maria Santos 65, Linda Marsh 75, Patricia Nguyen 71, Angela Torres 79, James Whitfield 38.
- David Okafor, Carlos Reyes, and Robert Chambers remained locked — no scored voting records or candidate_positions rows exist for those candidates.
- The /ballot display/read path works correctly. The gap is write-side only.

Implementation approach for match score generation:
- Build a trusted server-side compute path (Next.js API route or Server Action).
- No schema changes.
- No RLS changes — do not add a broad browser INSERT policy for match_scores.
- Only write scores for the authenticated user making the request.
- Use computed_at, not created_at, as the timestamp field.
- Average only non-null candidate_positions dimensions to handle partial dummy data.
- Trigger automatically when /onboarding/calculating completes.

Acceptance test result — passed May 25 2026:
- civicmarket.test.04@example.com (user_id 479780fe-e447-4c6e-9462-338841bbaa4b) retook Civic DNA.
- /onboarding/calculating generated 5 match_scores rows automatically. No manual SQL.
- Rows: Maria Santos 70, Patricia Nguyen 63, Angela Torres 42, James Whitfield 38, Linda Marsh 38.
- All 5 rows had the same computed_at = 2026-05-25 23:12:00.986+00 (no duplicates).
- /ballot rings unlocked. Carlos Reyes, David Okafor, Robert Chambers remained locked (no candidate_positions — expected).

## Civic feed planning update

The civic feed is now a core product pillar for year-round engagement and civic intelligence.

Current sprint planning additions:
- Define the beta-safe civic intelligence scope
- Review docs/design/CIVIC_FEED_STRATEGY.md as the source of truth
- Plan semi-automated government-source ingestion without implementing it yet
- Plan an admin review workflow before any AI-generated feed item is published
- Identify feed card UX needs for local impact, source links, meeting dates, and follow actions
- Keep public posting, unrestricted comments, autonomous publishing, and advanced multi-city crawling deferred

Important boundary:
This sprint may document and plan civic feed intelligence, but should not build Edge Functions, scraping automation, or autonomous publishing until a separate implementation step is approved.

## Acceptance criteria

- [x] Smoke test: onboarding flow (signup through calculating) still works — ZIP gate, submit, Enter key, and district write all fixed and verified, May 25 2026
- [x] Smoke test: /ballot, /candidates/[id], /vote load correctly — loaded May 17 2026; /measures/[id] not tested (no measure data exists)
- [x] Smoke test: /admin/entry can still insert a voting record — confirmed May 17 2026
- [x] Smoke test: /admin/records lists records and Remove/Confirm delete works — confirmed May 17 2026
- [x] Smoke test: /profile, /report, /data-sources load correctly — confirmed May 17 2026
- [x] Fix: ballot match rings not showing — display/read path fixed, commit 153a356, May 17 2026 (rings render when match_scores rows exist)
- [x] Fix: profile sign out not visible — fixed, commit 66d2518, May 17 2026
- [x] Fix: candidate profile Report Inaccuracy link/button missing — fixed, link to /report added, May 17 2026
- [x] Fix: automatic match score generation after Civic DNA completion — complete, commits 4c4479d and f4e5786; acceptance test passed May 25 2026 with civicmarket.test.04@example.com; 5 rows, single computed_at, no manual SQL
- [ ] Real PSL candidate data replaces dummy data
- [ ] Real voting records with official source URLs replace dummy records
- [ ] Real funding data with source URLs replaces dummy funding rows
- [ ] All real data validated by admin before beta invitations

## Do not do in this sprint

- Do not build database-backed report submission yet — deferred pending SQL/RLS risk check approval
- Do not build full admin dashboard yet
- Do not build Edge Functions yet
- Do not send beta invitations until all real data is in place and validated


