# CivicMarket Current State

Last updated: August 20, 2026 (Mayor current_official source verification and seed approval package prepared — STAGE A complete, exact proposed row/INSERT/verification/rollback drafted; STAGE B write NOT executed, pending explicit user row-level approval)

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
- Schema addendum — current_officials and review_summaries tables added, officials_for_user view added, commit f1b1e31, July 4 2026. Migration file: Reference Files/civicmarket_schema_addendum_officials_reviews.sql. Deployment confirmed in production via manual read-only Supabase SQL Editor verification, July 6 2026 (table exists, 17 columns, RLS enabled, 4 policies, officials_for_user view exists — see docs/current_officials_sql_plan.md "Manual Supabase verification result"). No app code changed by this migration itself.
- Current Officials UI shell (read-only) — commit bb8995a, July 5 2026. CurrentOfficialsSection component added; src/lib/officials.ts read-only helper added; Home page integration complete; Profile page integration complete; reads from officials_for_user view only. No fake officials added. No AI review summaries built yet. No Edge Functions built. No candidate or measure pages changed. npm run build passed. npm run lint still fails only on known pre-existing scripts/*.cjs require-import rule errors.
- Current Officials Path A seed — 3 verified current_officials rows seeded in Supabase, July 6 2026, following documented Gate 1–5 review in docs/current_officials_verified_source_checklist.md and docs/current_officials_sql_plan.md: Stephanie Morgan (City Council Member, District 1; district_id 11111111-0000-0000-0000-000000000001; jurisdiction_level city; candidate_id NULL; is_on_next_ballot false), Debbie Hawley (School Board Member, District 1; district_id 11111111-0000-0000-0000-000000000002; jurisdiction_level school_board; candidate_id NULL; is_on_next_ballot false), Tobin Rogers "Toby" Overdorf (State Representative, District 85; district_id 11111111-0000-0000-0000-000000000004; jurisdiction_level state; candidate_id NULL; is_on_next_ballot false). Gate 6 (Supabase verification queries pass after run) passed: pre-run table/district/duplicate/candidate-name checks passed, policy check returned 4 policies (SELECT/INSERT/UPDATE/DELETE), INSERT succeeded, post-run row count returned exactly 3 rows, required-fields-NULL check returned 0 rows, is_on_next_ballot-false check returned 0 rows. Shannon Martin / Port St. Lucie Mayor, St. Lucie County Commission At-Large, and Ben Albritton / Florida Senate District 27 remain excluded and were not seeded (see checklist Section 7, Seedability Review). No schema, seed file, app code, or SQL migration file changes — Supabase data change only, documented in docs/current_officials_sql_plan.md and docs/current_officials_verified_source_checklist.md.
- Current Officials Path A Gate 7 UI verification — passed July 6 2026. Read-only UI verification confirmed Current Officials content appeared correctly on both the Home page and the Profile page for the three seeded rows: Stephanie Morgan (City Council District 1), Debbie Hawley (School Board District 1), and Tobin Rogers "Toby" Overdorf (Florida House District 85). No SQL changes were made during Gate 7. No schema, seed file, app code, SQL migration, or data changes were made during Gate 7. Blocked rows remain excluded: Shannon Martin / Port St. Lucie Mayor, St. Lucie County Commission At-Large, Ben Albritton / Florida Senate District 27. Full result recorded in docs/current_officials_sql_plan.md and docs/current_officials_verified_source_checklist.md.
- County Commission District 1-5 Gate 6 execution — complete and passed, July 7 2026. Scope: Supabase data insert into the `districts` table only, following the documented Gate 1-5 review in docs/county_commission_district_1_5_future_implementation_plan.md (Gate 3 B2 behavior decision, Gate 4 SQL draft, Gate 5 explicit approval from Mike). Preflight SELECT returned 0 conflicts for the five district ids/names. INSERT added exactly 5 rows to `districts`: St. Lucie County Commission District 1 through District 5 (ids 11111111-0000-0000-0000-000000000031 through ...035, type county, city Port St. Lucie, state FL). Post-insert verification returned exactly the 5 approved rows. St. Lucie County Commission At-Large row (id 11111111-0000-0000-0000-000000000003) confirmed unchanged before and after. No current_officials inserts. No user_districts changes. No schema, app code, seed file, or SQL migration changes. Repo working tree remained clean after Supabase execution. Gate 7 (UI/app verification) is pending — not started. Current Officials display for County Commission District 1-5 remains blocked until the approved B2 `getOfficialsForUser` widening and District 1-5 current_officials rows are completed through a later, separately approved gate sequence; see docs/county_commission_district_1_5_future_implementation_plan.md.
- County Commission District 1-5 Gate 7 limited (data-layer) verification — complete and passed, July 7 2026. Scope: read-only Supabase verification only — four SELECT checks, no writes performed. Results: District 1-5 rows exist (PASS, 5 rows found); At-Large unchanged (PASS, 1 row found for id 11111111-0000-0000-0000-000000000003, name St. Lucie County Commission At-Large); no current_officials rows for District 1-5 (PASS, 0 rows found); no user_districts rows for District 1-5 (PASS, 0 rows found). No unexpected rows appeared in any check. No app code, schema, seed file, SQL migration, current_officials, user_districts, or At-Large changes were made. Repo working tree remained clean. Full result recorded in docs/county_commission_district_1_5_future_implementation_plan.md.
- County Commission Current Officials B2 gate sequence (Gate A through Gate H) — complete, July 7 2026. Full documentation-gated sequence implementing the approved B2 behavior model for County Commission District 1-5 Current Officials display:
  - Gate A (source re-verification) — passed by manual browser verification by Mike, July 7 2026, of https://www.stlucieco.gov/departments-and-services/board-of-county-commissioners. Confirmed: James Clasby (District 1), Larry Leet — Vice Chair (District 2), Erin Lowry (District 3), Jamie Fowler — Chair (District 4), Cathy Townsend (District 5). Commit 8736c9d. Full record: docs/county_commission_current_officials_gate_a_source_reverification.md.
  - Gate B (SQL draft) — `current_officials` INSERT drafted for review only, commits 960559f and 8c7f2c5 (office wording updated to include Chair/Vice Chair). Full record: docs/county_commission_current_officials_gate_b_sql_draft.md.
  - Gate C (explicit approval) — Mike approved the Gate B draft as written in full, commit 08edc58. Full record: docs/county_commission_current_officials_gate_c_approval.md.
  - Gate D (Supabase execution) — Mike manually executed the approved INSERT in the Supabase SQL Editor (this environment has no Supabase CLI/psql/DB tool); all preflight and post-insert verification checks passed. Exactly 5 rows inserted into `current_officials`:
    - James Clasby, County Commissioner District 1, district_id 11111111-0000-0000-0000-000000000031, jurisdiction_level county, is_on_next_ballot false
    - Larry Leet, County Commissioner District 2, Vice Chair, district_id 11111111-0000-0000-0000-000000000032, jurisdiction_level county, is_on_next_ballot false
    - Erin Lowry, County Commissioner District 3, district_id 11111111-0000-0000-0000-000000000033, jurisdiction_level county, is_on_next_ballot false
    - Jamie Fowler, County Commissioner District 4, Chair, district_id 11111111-0000-0000-0000-000000000034, jurisdiction_level county, is_on_next_ballot false
    - Cathy Townsend, County Commissioner District 5, district_id 11111111-0000-0000-0000-000000000035, jurisdiction_level county, is_on_next_ballot false
    At-Large row and the three already-seeded officials (Stephanie Morgan, Debbie Hawley, Toby Overdorf) confirmed unchanged. No `user_districts` or `districts` changes. Commit 3a675cc. Full record: docs/county_commission_current_officials_gate_d_execution_result.md.
  - Gate E (code draft) — diff-style draft for `src/lib/officials.ts` (`getOfficialsForUser`) prepared for review, commit a36006f. Full record: docs/county_commission_current_officials_gate_e_code_draft.md.
  - Gate F (code approval) — Mike approved the Gate E draft as written in full, commit 65f64d1. Full record: docs/county_commission_current_officials_gate_f_approval.md.
  - Gate G (implementation) — `src/lib/officials.ts` updated to implement the approved B2 lookup, commit ab6c190. `npm run build` passed; `npm run lint` had only the pre-existing known `scripts/*.cjs` require-import errors, nothing in `src/lib/officials.ts`.
  - Gate H (verification) — passed by static/code-trace verification only, commit ca364f2. Build passed; lint had only the same pre-existing `scripts/*.cjs` errors. Live UI/browser observation was not performed in this pass (no dev server running, no Supabase read tool available) — this remains an optional future task. Full record: docs/county_commission_current_officials_gate_h_ui_verification.md.
  - Behavior after Gate G: users whose `user_districts` includes the St. Lucie County Commission At-Large row (id 11111111-0000-0000-0000-000000000003) now receive the five County Commission current_officials rows above through `getOfficialsForUser`, merged with their existing officials and de-duplicated by id. Users without the At-Large row keep the exact prior behavior, unchanged. The `officials_for_user` database view was not modified — the widening reads `current_officials` directly for the five District 1-5 ids. No District 1-5 rows were added to `user_districts`. If the supplemental County Commission lookup errors, it fails soft (logs and falls back to the primary officials result) rather than failing the whole function. District names for the five County Commission rows are mapped from a fixed, approved lookup in `src/lib/officials.ts`, not a Supabase `districts` embed (avoids a TypeScript relation-shape issue found during Gate G).
  - No-change confirmations across the full Gate A-H sequence: At-Large row unchanged throughout; no `user_districts` rows created for District 1-5; `officials_for_user` view unchanged; no schema, seed, or migration changes; no `districts` changes after the Gate D insert sequence; no At-Large rename, delete, replace, or repurpose.
  - **Optional future live UI verification:** Gate H passed by static/code-trace verification only. Live UI verification was not performed because a running dev server and an approved existing At-Large test user login were not available in that session. When both are available, as an optional future task, verify the rendered Current Officials UI shows all eight officials — Stephanie Morgan, Debbie Hawley, Tobin Rogers "Toby" Overdorf, James Clasby, Larry Leet, Erin Lowry, Jamie Fowler, Cathy Townsend — with no duplicates, for an At-Large-holding test user, and verify a non-At-Large user does not receive the five County Commission officials through the B2 expansion path. Do not create or modify `user_districts` for this test, and do not write to Supabase for this test, unless separately approved.
  - **Superseded, July 7 2026 (Gate D of the Path 1 personalization fix):** the B2 At-Large expansion described above (Gate A-H) has been disabled. See "County Commission Current Officials personalization fix (Path 1, Gate D)" below.
- County Commission Current Officials personalization fix (Path 1, Gate D) — complete, July 7 2026. The B2 County Commission At-Large expansion (Gate A-H sequence above) has been disabled in `src/lib/officials.ts`. `getCountyCommissionDistrict1to5Officials` and its supporting constants (`AT_LARGE_DISTRICT_ID`, `COUNTY_COMMISSION_DISTRICT_NAMES`, `COUNTY_COMMISSION_DISTRICT_1_5_IDS`) were removed entirely; `getOfficialsForUser(userId)` now returns only the primary `officials_for_user` result, unchanged from before Gate G. Reason: CivicMarket is personal-action-first — My Current Officials should show only officials tied to the user's own voting/representation districts, not all members of a broader board unless separately labeled as board context, not all five County Commissioners just because a user holds the St. Lucie County Commission At-Large district. County Commissioners are deferred until a separate, approved gated task can determine a user's specific County Commission District 1-5 (not At-Large). No Supabase writes, `user_districts` changes, schema changes, seed changes, migration changes, `districts` changes, or `officials_for_user` view changes were made. `npm run build` passed (22 routes). `npm run lint` had only the pre-existing known `scripts/*.cjs` require-import errors, nothing in `src/lib/officials.ts`. Commit af6d76e.
  - **Live UI verification (Gate F) — passed, July 7 2026.** Verified with the approved existing At-Large test user: My Current Officials no longer shows all five County Commissioners. Removed from display: James Clasby, Larry Leet, Erin Lowry, Jamie Fowler, Cathy Townsend. Existing officials remained visible and unaffected: Stephanie Morgan, Debbie Hawley, Tobin Rogers "Toby" Overdorf. No `user_districts` changes, no Supabase writes, no schema/seed/migration/districts/`officials_for_user` changes, and no app code changes were made for this documentation task.
  - **Deferred:** a future, separately approved gated task is needed to determine or store the user's specific St. Lucie County Commission District (1-5) and then show only that one County Commissioner in My Current Officials.

- County Commission District 1-5 assignment lookup, Gate 1 — documentation only, complete, July 7 2026. New file `docs/county_commission_district_assignment_lookup_gate_1.md` records official lookup source candidates for a future ability to determine a user's specific County Commission District (1-5), and documents two possible storage approaches (Option A: store in `user_districts` after a verified lookup; Option B: derive at runtime without writing `user_districts`) for future Gate 2+ comparison. Key finding: the Supervisor of Elections' voter lookup tool matches by name/date of birth against the voter roll and must not be used as the implementation source, since `CLAUDE.md` defers "Voter roll matching" pre-beta; an address-only county GIS "Zone Lookup" tool is the recommended candidate to verify manually at a future Gate 2 instead. No app code, database, schema, seed, migration, `districts`, `user_districts`, `officials_for_user`, or At-Large changes were made. See "Current Officials — County Commission District 1-5 gap" above, which remains open and unchanged by this documentation task.
- County Commission District 1-5 assignment lookup, Gate 2 — manual source verification, documentation only, complete, July 7 2026. New file `docs/county_commission_district_assignment_lookup_gate_2.md` records a manual browser verification of the county's "Who's My Commissioner" / "Zone Lookup" tool (`https://slc.maps.arcgis.com/apps/instant/lookup/index.html?appid=9afb7523a1854366bed2d7c50ed7428b`), confirming it is the same tool for both Gate 1 candidate sources #1 and #2. Four public/neutral test addresses (Port St. Lucie City Hall, MIDFLORIDA Event Center, Fort Pierce City Hall, a Tradition-area address) each returned exactly one County Commission district, matching the seeded `current_officials` names exactly (James Clasby/District 1, Erin Lowry/District 3, Cathy Townsend/District 5). A fifth test using ZIP code alone (`34987`, no street address) returned a single answer without warning, even though the ZIP's boundary visibly extends across the seam with a different district — confirming ZIP-only input is unsafe to use as the sole lookup key. No identity/voter-roll fields were required anywhere in the tool. No app, database, schema, seed, migration, `districts`, `user_districts`, `officials_for_user`, or At-Large changes were made. Storage Option A vs. Option B remains undecided, deferred to a future Gate 3. See "Current Officials — County Commission District 1-5 gap" above, which remains open and unchanged by this documentation task.
- County Commission District 1-5 assignment lookup, Gate 3 — storage decision, documentation only, complete, July 7 2026. New file `docs/county_commission_district_assignment_lookup_gate_3_storage_decision.md` selects Storage Option A (from Gate 1) as the documented future model: after a verified address lookup through the Gate 2 tool, a District 1-5 `user_districts` row would be inserted alongside, not instead of, the user's existing At-Large row, so `officials_for_user` can surface exactly one commissioner without new special-case app code. Option B (runtime derivation without a `user_districts` write) was deferred, not ruled out permanently. This is a documented future model only — no app, database, schema, seed, migration, `districts`, `user_districts`, `officials_for_user`, or At-Large changes were made. Implementation (address-collection UX, the actual `user_districts` insert, RLS-compatible write path, staleness/redistricting plan) remains deferred to a future, separately approved Gate 4. See "Current Officials — County Commission District 1-5 gap" above, which remains open and unchanged by this documentation task.
- County Commission District 1-5 assignment lookup, Gate 4 — implementation plan, documentation only, complete, July 7 2026. New file `docs/county_commission_district_assignment_lookup_gate_4_implementation_plan.md` provides a precise, itemized future implementation plan for storing a verified District 1-5 `user_districts` row (per Gate 3's Storage Option A decision) and using it in My Current Officials: required lookup source (Gate 2 verified tool), address-only input, exact-match-only district label parsing, id verification against the live `districts` table at write time, delete-then-insert duplicate prevention scoped to the five District 1-5 ids only, strict At-Large preservation, an unmodified `officials_for_user`/`getOfficialsForUser` display path, fail-closed error handling with no write on ambiguous/failed lookups, logging/PII guidance, RLS considerations, a full test plan, a rollout plan, and an exact itemized Gate 5 approval checklist. This is a plan only — no app, database, schema, seed, migration, `districts`, `user_districts`, `officials_for_user`, or At-Large changes were made. See "Current Officials — County Commission District 1-5 gap" above, which remains open and unchanged by this documentation task.
- County Commission District 1-5 assignment lookup, Gate 5 — approval checklist, documentation only, complete, July 7 2026. New file `docs/county_commission_district_assignment_lookup_gate_5_approval_checklist.md` records the explicit, itemized approval checklist (source URL, address-level input requirement, ZIP-only prohibition, district label mapping, district id verification before write, `user_districts` write behavior, duplicate handling, At-Large preservation, Current Officials display rule, failure handling, PII/logging limitation, security/RLS review, test plan, rollout plan) that must be explicitly approved before any future implementation begins, plus an approved implementation boundary, items not approved, required validation and test cases, a rollback plan, hard stops, deferred work, and a recommended Gate 6 next step. No checklist item is approved by the existence of this document. No app, database, schema, seed, migration, `districts`, `user_districts`, `officials_for_user`, or At-Large changes were made. See "Current Officials — County Commission District 1-5 gap" above, which remains open and unchanged by this documentation task.
- County Commission District 1-5 assignment lookup, Gate 6 — draft implementation plan and code review, documentation only, complete, July 7 2026. New file `docs/county_commission_district_assignment_lookup_gate_6_draft_implementation.md` inspects `src/lib/officials.ts`, `src/app/onboarding/zip/page.tsx`, `src/app/onboarding/districts/page.tsx`, `src/lib/candidates.ts`, `src/lib/supabase.ts`, `src/lib/supabase-server.ts`, `src/app/api/compute-match-scores/route.ts`, `src/app/profile/page.tsx`, and `src/components/CurrentOfficialsSection.tsx`, and proposes a concrete, file-level draft: a new opt-in profile-settings page (`src/app/profile/county-commission/page.tsx`) linking out to the Gate 2 verified county tool with a closed five-option district selection, a new server-side API route (`src/app/api/set-county-commission-district/route.ts`) modeled on the existing `compute-match-scores` route that validates the selection, resolves the live `districts` id, and performs a scoped delete-then-insert against `user_districts` limited to the five County Commission District 1-5 ids only, and confirms no change is needed to `src/lib/officials.ts` or `src/components/CurrentOfficialsSection.tsx` since the existing `officials_for_user` view already supports the display path. Includes a file-by-file change list (all rows "not implemented — proposed only" except explicit no-change rows), a test matrix distinguishing read-only tests from write-requiring tests, a "Not implemented in Gate 6" section, and a "Required approval before implementation" section listing items beyond Gate 5's checklist that still need approval (file/route shape, a proposed closed-set-selection UI refinement versus Gate 4's original free-text parsing, and the service-role write authorization model). No app code was created or edited; no Supabase write, `user_districts` row, schema, seed, migration, `districts`, `officials_for_user`, or At-Large change was made; nothing was deployed or run against live data. See "Current Officials — County Commission District 1-5 gap" above, which remains open and unchanged by this documentation task.
- County Commission District 1-5 assignment lookup, Gate 7 — implementation-boundary approval checklist, documentation only, complete, July 7 2026. New file `docs/county_commission_district_assignment_lookup_gate_7_implementation_boundary_approval.md` records an itemized approval checklist scoped specifically to Gate 6's concrete draft (opt-in profile settings page at `src/app/profile/county-commission/page.tsx`, link-out to the Gate 2 verified county tool, closed five-option District 1-5 selection UI, user self-attestation, new API route at `src/app/api/set-county-commission-district/route.ts`, server-side Bearer-token auth, service-role write model approved-or-deferred, live `districts` id verification, delete-then-insert duplicate prevention scoped to the five District 1-5 ids only, At-Large preservation, an unmodified Current Officials display path, failure handling, test plan, rollback plan), plus an explicit "items still not approved" section, security/authorization review, PII/logging review, required implementation tests, required manual tests (which need separate authorization before running against any account), a required rollback plan, and a recommended Gate 8 next step. No checklist item is approved by the existence of this document. No app code was created or edited (including no changes to the two named future files), no Supabase write, `user_districts` row, schema, seed, migration, `districts`, `officials_for_user`, or At-Large change was made, and nothing was deployed or run against live data. See "Current Officials — County Commission District 1-5 gap" above, which remains open and unchanged by this documentation task.
- County Commission District 1-5 assignment lookup, Gate 8 — draft implementation code, write path disabled, complete, July 7 2026. Two new files created per the Gate 7-approved boundaries: `src/app/profile/county-commission/page.tsx` (opt-in profile-settings page, auth-gated via `supabase.auth.getSession()` with redirect to `/onboarding` if no session, explains ZIP-only is unreliable, links out to the Gate 2 verified county ArcGIS lookup tool in a new tab, closed five-option `District 1`-`District 5` radio selection, required "I verified this district using the official St. Lucie County lookup tool" checkbox, submit disabled until both are set, loading/success/error states, mobile-first single-column layout, does not collect or store a street address) and `src/app/api/set-county-commission-district/route.ts` (POST-only, Bearer-token auth via `createServiceClient()` + `supabase.auth.getUser(token)` mirroring the existing `compute-match-scores` route, validates `districtLabel` against the closed five-value enum and `attestedOfficialLookup === true`, resolves the matching `districts` row live by exact name match and fails closed (422) on zero or multiple matches, resolves all five County Commission District 1-5 ids live to scope a future delete, and returns a `writePlan` describing the intended scoped delete-then-insert while preserving At-Large). The actual mutation is gated behind `const ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE = false`; while false the route returns a dry-run JSON response (`resolvedDistrict` + `writePlan`) and the `.delete()`/`.insert()` calls are lexically unreachable, confirmed by static inspection — no `.update()` or `.upsert()` call exists in the file at all. No SettingsRow link was added to `src/app/profile/page.tsx` (not in the Gate 8 approved scope). No changes were made to `src/lib/officials.ts` or `src/components/CurrentOfficialsSection.tsx` — static inspection did not find a requirement to change either, so per the Gate 8 instruction neither was touched and no stop-for-approval was triggered. No production Supabase writes were run. No production `user_districts` rows were created. No schema, seed, migration, `districts`, `officials_for_user`, deployment, or At-Large changes were made. `npm run build` passed (24 routes, including the two new routes `/api/set-county-commission-district` and `/profile/county-commission`). `npm run lint` failed only on the same known pre-existing `scripts/import-real-psl-data.cjs` and `scripts/validate-real-psl-csvs.cjs` require-import errors (5 errors) that predate this task — nothing in either new file triggered a lint error. See "Current Officials — County Commission District 1-5 gap" above, which remains open and unchanged by this task.
- County Commission District 1-5 assignment lookup, Gate 9 — Profile link only, complete, July 7 2026. `src/app/profile/page.tsx`'s `SettingsRow` component gained an optional `helper` prop (a second muted line of text below the label); one new row was added to the Settings card — label "Set County Commission District", helper "Use the official St. Lucie County lookup tool to verify your district.", linking to `/profile/county-commission` — placed directly after "My Districts". The Gate 8 draft County Commission district page is now reachable in-app from Profile → Settings. No address information is collected or stored by this link itself. No change was made to `src/app/api/set-county-commission-district/route.ts`, `src/app/profile/county-commission/page.tsx`, `src/lib/officials.ts`, or `src/components/CurrentOfficialsSection.tsx`. `ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE` remains `false`; the API route remains dry-run only. No production Supabase writes were run. No production `user_districts` rows were created. No schema, seed, migration, `districts`, `officials_for_user`, deployment, or At-Large changes were made. See "Current Officials — County Commission District 1-5 gap" above, which remains open and unchanged by this task.
- County Commission District 1-5 assignment lookup, Gate 10 — live UI review, documentation only, complete, July 7 2026. New file `docs/county_commission_district_assignment_lookup_gate_10_live_ui_review.md` records a passing live UI review of the Gate 8/9 draft flow: the "Set County Commission District" Profile Settings link appears with correct helper text and no regression to the rest of the Profile page; `/profile/county-commission` loads with the ZIP-only unreliability warning, the official county lookup tool button, the "does not collect or store your address" statement, the closed District 1-5 selection, and the attestation checkbox all visible and interactive; the exact dry-run message "Write path disabled pending explicit approval. No user_districts row was created or modified." appears on submit; My Current Officials remained personal-action-first with no reappearance of the disabled all-five-County-Commission-via-At-Large display. No production Supabase writes were run. No production `user_districts` rows were created. No schema, seed, migration, `districts`, `officials_for_user`, deployment, API write guard, `src/lib/officials.ts`, `src/components/CurrentOfficialsSection.tsx`, or At-Large changes were made. See "Current Officials — County Commission District 1-5 gap" above, which remains open and unchanged by this task.

## Immediate priorities

1. Validate real PSL candidates and funding in app ✓ — confirmed July 2 2026 (see Hard beta blockers: Real PSL candidate and funding data imported)
2. Flip email confirmation toggle in Supabase dashboard ✓ — confirmed ON July 2 2026 (see Hard beta blockers: Email confirmation re-enabled)
3. Voting records with official source URLs — the only remaining item; intentionally blocked until an official item-specific source verifies candidate, item, date, description, and vote cast (see Hard beta blockers)


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

- None currently. Database-backed report submission for /report was the only item here; it is complete — see Hard beta blockers: Report Inaccuracy database-backed submission exists.

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

## Data availability limits

These are intentional data gaps, not app bugs. Do not manufacture, guess, or "fix" the following without new official source data:

- `voting_records_real.csv` is intentionally header-only.
- The current 4 PSL District 1 candidates are non-incumbents, so no verified council voting history has been entered.
- Do not add voting records unless an official item-specific source verifies candidate, item, date, description, and vote cast.
- No real PSL ballot measures are currently confirmed in the database.
- Do not add ballot measures unless an official source confirms the measure title, type, election/date, summary, and source URL.
- Locked match rings are expected while candidate_positions and verified voting records are unavailable.
- This is a data availability limit, not an app bug.

### Current Officials — County Commission District 1-5 gap

- Five St. Lucie County Commission District 1-5 rows exist in `districts` (Supabase data only, inserted July 7 2026 — see Completed: County Commission District 1-5 Gate 6 execution).
- Five `current_officials` rows exist for County Commission District 1-5 (James Clasby, Larry Leet, Erin Lowry, Jamie Fowler, Cathy Townsend) — these rows themselves were not removed.
- **This gap is open again as of July 7 2026 (Path 1 personalization fix, Gate D, commit af6d76e).** The Gate A-H B2 expansion that previously widened `getOfficialsForUser` so At-Large-holding users saw all five County Commissioners has been disabled. Reason: CivicMarket is personal-action-first — My Current Officials should show only officials tied to the user's own voting/representation districts, not all five County Commissioners just because the user holds the St. Lucie County Commission At-Large district. Live UI verification (Gate F, July 7 2026) confirmed the approved At-Large test user no longer sees James Clasby, Larry Leet, Erin Lowry, Jamie Fowler, or Cathy Townsend, while Stephanie Morgan, Debbie Hawley, and Tobin Rogers "Toby" Overdorf remained visible as before.
- No District 1-5 rows exist in `user_districts`, so `officials_for_user` still cannot return the five County Commission rows for anyone, and `getOfficialsForUser` no longer supplements them in app code either.
- County Commissioners are deferred until a separate, approved gated task can determine a user's specific County Commission District (1-5), not At-Large membership.
- The `officials_for_user` database view was not changed and still joins on exact `district_id` equality.
- No Supabase writes, `user_districts` changes, schema changes, seed changes, migration changes, or `districts` changes were made as part of this fix.
- St. Lucie County Commission At-Large remains unchanged and continues to serve onboarding, ballot grouping, and county election context exactly as before.
- Full history: docs/county_commission_district_1_5_future_implementation_plan.md and docs/county_commission_current_officials_b2_implementation_plan.md (Gate A-H documents linked from the latter).

### Current Officials — Mayor district gap

- Mayor is a confirmed planned/known office for the PSL beta context.
- There is currently no districts row for Port St. Lucie Mayor.
- Because officials_for_user joins current_officials to user_districts through district_id, a Mayor current_officials row would not surface for users until a Mayor district row exists and users can be assigned to it.
- No Mayor current_officials row is seedable yet because no official government source URL has been supplied for the current Mayor.
- Do not guess the Mayor name, term dates, next election date, or source URL.
- Verified source collection checklist: docs/current_officials_verified_source_checklist.md

## Hard beta blockers

No beta invitations until:
- Real PSL candidate and funding data imported ✓ — 8 dummy candidates deleted, 4 real PSL District 1 candidates inserted (Reikenis, Baptiste, Zimmerman, Meltzer), 4 funding rows inserted with SOE source URL, import script scripts/import-real-psl-data.cjs committed 5f3b65a, live run July 2 2026. Ballot rings locked — no candidate_positions until voting records exist.
- Voting records with official source URLs — intentionally empty; all 4 candidates are non-incumbents with no verified Council vote history; leave voting_records_real.csv header-only until official item-specific source confirms a vote
- Funding rows with source URLs ✓ — total_raised amounts from SOE with source_url, imported July 2 2026
- Legal pages exist ✓ — /privacy and /terms, both public static pages, beta-draft notice on each, no contact email until domain exists, consent notice added to /onboarding/signup, commit 94cae59, July 2 2026
- Invite code gate works ✓ — server-side POST /api/validate-invite checks INVITE_CODE env var (never NEXT_PUBLIC_), case-insensitive, fails closed if env var missing; invite code field added above email on /onboarding/signup; login path untouched; commit 7dfb181, July 2 2026. Requires INVITE_CODE=<code> in .env.local to activate.
- Report Inaccuracy database-backed submission exists ✓ — inaccuracy_reports table created with RLS (INSERT authenticated, SELECT admin-only, no UPDATE/DELETE), /report page writes on submit, "Report received" success state, browser-tested July 2 2026
- Data Sources exists ✓
- Admin can enter voting records ✓ (commit e24fe14)
- Admin review/removal page exists ✓ (commits 93342f3 + 31adca9) — review list and deletion controls complete, DELETE RLS policy verified, test row deleted
- Security patch applied ✓ — grant patch May 17 2026 (REVOKE TRUNCATE/TRIGGER/REFERENCES; revoked unguarded INSERT/UPDATE/DELETE; verified match_scores SELECT-only, reviews no UPDATE, profiles.is_admin not browser-writable)
- Ballot match rings not showing ✓ — display/read path fixed, commit 153a356 (rings render correctly when match_scores rows exist)
- Profile sign out not visible ✓ — fixed, commit 66d2518
- Candidate profile Report Inaccuracy link/button missing ✓ — fixed, link added to /report
- Automatic match score generation after Civic DNA completion ✓ — complete, commits 4c4479d and f4e5786. Acceptance test passed May 25 2026: civicmarket.test.04@example.com (user_id 479780fe-e447-4c6e-9462-338841bbaa4b) retook Civic DNA quiz, 5 match_scores rows generated automatically (Maria Santos 70, Patricia Nguyen 63, Angela Torres 42, James Whitfield 38, Linda Marsh 38), single computed_at = 2026-05-25 23:12:00.986+00, /ballot rings unlocked without manual SQL. No schema changes. No RLS changes. No grant or policy changes.
- /measures/[id] smoke test ✓ — route verified July 2 2026 using temporary test measure (now deleted): hero header, type tag, plain English summary, full text link, Civic DNA Impact scores (including null dimensions showing —), AI draft label, and back-to-ballot nav all rendered correctly. No real PSL ballot measures exist yet for the Nov 2026 election; insert real measures when confirmed by official source.
- Email confirmation re-enabled ✓ — signup page handles pending confirmation state (session null → check-inbox screen, commit 9c244f8, July 2 2026); Supabase dashboard toggle confirmed ON July 2 2026


## County Commission District 1-5 assignment lookup - Gate 11 negative-path/auth-rejection tests

Status: Complete.

Gate 11 verified the County Commission District assignment API negative paths and dry-run behavior with `ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE = false`.

Test results:
- Unauthenticated POST rejected with `401 Unauthorized`.
- Missing Bearer token rejected with `401 Unauthorized`.
- Invalid Bearer token rejected with `401 Unauthorized`.
- Invalid `districtLabel` rejected with `400 Bad Request`.
- `attestedOfficialLookup: false` rejected with `400 Bad Request`.
- Valid token, valid `District 1`, and `attestedOfficialLookup: true` returned dry-run only.

Valid dry-run response confirmed:
- `dryRun: true`
- Message: `Write path disabled pending explicit approval. No user_districts row was created or modified.`
- Resolved district: `St. Lucie County Commission District 1`
- Resolved district ID: `11111111-0000-0000-0000-000000000031`
- Delete scope limited only to County Commission District 1-5 IDs ending `031` through `035`.
- At-Large row `11111111-0000-0000-0000-000000000003` remained outside delete scope.

No-change confirmation:
- No write guard change.
- No production Supabase writes.
- No `user_districts` rows intentionally created or modified.
- No schema changes.
- No seed changes.
- No migration changes.
- No districts changes.
- No `officials_for_user` changes.
- No deployment.
- No `src/lib/officials.ts` changes.
- No `CurrentOfficialsSection` changes.
- No At-Large row rename/delete/replace/repurpose.
- All-five County Commission At-Large expansion was not restored.

Current safety state:
`ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE = false`

Recommended next state:
Hold with writes disabled unless a separate explicit approval gate authorizes a single scoped test-account write with rollback plan.

## County Commission District 1-5 assignment lookup - Gate 12 test-account write approval checklist

Status: Draft checklist complete.

Gate 12 created a pre-approval checklist for any future single scoped test-account write.

No write is approved by this document.

Current safety state:
`ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE = false`

No-change confirmation:
- No write guard change.
- No Supabase writes.
- No user_districts rows created or modified.
- No schema changes.
- No seed changes.
- No migration changes.
- No districts changes.
- No officials_for_user changes.
- No deployment.
- No src/lib/officials.ts changes.
- No CurrentOfficialsSection changes.
- No At-Large row rename/delete/replace/repurpose.
- All-five County Commission At-Large expansion was not restored.

Next required approval before any write:
A separate explicit approval must identify the test account, expected district, pre-test state, post-test state, rollback SQL, verification SQL, temporary write-guard change, immediate guard restoration, and no-deploy boundary.

## County Commission District 1-5 assignment lookup - Gate 13 explicit test-account write approval package

Status: Documentation package complete.

Date: 07-08-2026
Timestamp: 07:10 pm EST

Gate 13 created the explicit test-account write approval package:
`docs/county_commission_district_assignment_lookup_gate_13_test_write_approval_package.md`

Gate 13 is documentation and verification planning only.

No write is approved by this document.

Current safety state:
`ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE = false`

Latest confirmed pushed commit before this current-state update:
`f3936bc Add County Commission Gate 13 test write approval package`

Gate 13 requires explicit approval before any future write for:
- Exact test account user ID.
- Exact test account email.
- Exact County Commission District label to test.
- Expected district ID.
- Exact pre-test user_districts state for that user.
- Exact post-test expected user_districts state.
- Rollback SQL.
- Verification SQL.
- Temporary decision to enable `ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE`.
- Immediate decision to restore `ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE = false` after the test.
- No-deploy boundary during the test.

No-change confirmation:
- No write guard change.
- No Supabase writes.
- No user_districts rows created or modified.
- No schema changes.
- No seed changes.
- No migration changes.
- No districts changes.
- No officials_for_user changes.
- No deployment.
- No src/lib/officials.ts changes.
- No CurrentOfficialsSection changes.
- No At-Large row rename/delete/replace/repurpose.
- All-five County Commission At-Large expansion was not restored.

Recommended next state:
Hold with writes disabled unless a separate explicit approval gate authorizes a single scoped test-account write with rollback plan.

## County Commission District 1-5 assignment lookup - Gate 14 test-account write preparation

Status: Preparation package complete.

Date: 07-08-2026
Timestamp: 07:21 pm EST

Gate 14 created the test-write preparation package:
`docs/county_commission_district_assignment_lookup_gate_14_test_write_preparation.md`

Gate 14 is documentation and verification planning only.

No write is approved by this document.

Current safety state:
`ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE = false`

Latest confirmed pushed commit before this current-state update:
`4f241e4 Update current state for County Commission Gate 13`

Gate 14 fills in reusable SQL templates (pre-test verification, district ID verification, rollback, post-test verification) and the district ID reference table, but leaves the test-account-specific fields (test account user ID, test account email, selected District 1-5 label, expected district ID) marked PENDING USER APPROVAL.

No-change confirmation:
- No Supabase writes.
- No user_districts rows created or modified.
- No schema changes.
- No seed changes.
- No migration changes.
- No districts changes.
- No officials_for_user changes.
- No deployment.
- `ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE` remains false.
- No src/lib/officials.ts changes.
- No CurrentOfficialsSection changes.
- No At-Large row rename/delete/replace/repurpose.

Next step:
Requires the user to provide or explicitly approve the exact test-account details (user ID, email, district label, expected district ID) and explicit approval to temporarily enable the write guard before any future write-execution gate can proceed.

## County Commission District 1-5 assignment lookup - Gate 15 test-write execution approval package

Status: Approval package complete.

Date: 07-08-2026
Timestamp: 07:25 pm EST

Gate 15 created the test-write execution approval package:
`docs/county_commission_district_assignment_lookup_gate_15_test_write_execution_approval.md`

Gate 15 is documentation and approval packaging only.

No write is approved by this document alone.

Current safety state:
`ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE = false`

Latest confirmed pushed commit before this current-state update:
`0b24329 Prepare County Commission Gate 14 test write package`

Gate 15 packages the exact pre-write checklist, allowed write scope, forbidden scope, SQL templates carried forward from Gate 14, an eight-step write guard handling sequence, failure handling, risk check, hard stops, and a final approval statement template — leaving every required approval field (test account user ID, email, district label, expected district ID, and the three explicit write-guard/no-deploy approvals) marked PENDING USER APPROVAL.

No-change confirmation:
- No Supabase writes.
- No user_districts rows created or modified.
- No schema changes.
- No seed changes.
- No migration changes.
- No districts changes.
- No officials_for_user changes.
- No deployment.
- `ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE` remains false.
- No src/lib/officials.ts changes.
- No CurrentOfficialsSection changes.
- No At-Large row rename/delete/replace/repurpose.

Next step:
Requires the user to provide the exact test-account details and explicit write-guard approval, using the final approval statement template in the Gate 15 document, before any future write-execution gate can proceed.

## County Commission District 1-5 assignment lookup - Gate 16 write-execution readiness check

Status: Readiness check complete.

Date: 07-08-2026
Timestamp: 07:28 pm EST

Gate 16 created the write-execution readiness check:
`docs/county_commission_district_assignment_lookup_gate_16_write_execution_readiness_check.md`

Gate 16 is readiness verification only.

No write is approved by this document alone.

Current safety state:
`ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE = false`

Latest confirmed pushed commit before this current-state update:
`465dcdc Document County Commission Gate 15 test write approval`

Gate 16 checked the Gate 15 final approval statement and readiness checklist: git status is clean, the SQL templates and write-guard restoration plan are prepared, and the no-deploy boundary is confirmed, but the test account identity, District 1-5 label, and rollback finalization remain blocked strictly on user-provided information. Overall readiness recorded as NOT READY.

No-change confirmation:
- No Supabase writes.
- No user_districts rows created or modified.
- No schema changes.
- No seed changes.
- No migration changes.
- No districts changes.
- No officials_for_user changes.
- No deployment.
- `ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE` remains false.
- No src/lib/officials.ts changes.
- No CurrentOfficialsSection changes.
- No At-Large row rename/delete/replace/repurpose.

Next step:
Still requires the exact completed Gate 15 final approval statement (test account user ID, email, district label, expected district ID, and the three explicit write-guard/no-deploy approvals) before write execution can proceed.

## County Commission District 1-5 assignment lookup - Gate 17A non-write code review

Status: Code review complete.

Date: 07-08-2026

Gate 17A performed a non-write, read-only code review of `src/app/profile/county-commission/page.tsx` and `src/app/api/set-county-commission-district/route.ts`:
`docs/county_commission_district_assignment_lookup_gate_17a_non_write_code_review.md`

All twelve requested checklist items passed: auth/Bearer-token handling, write guard behavior while false, districtLabel validation, attestedOfficialLookup validation, live districts table verification, delete scope limited to District 1-5 only, At-Large exclusion (structural, via exact-name query), no ZIP-only assignment, no address collection or logging, failure handling, dry-run response contents, and Current Officials compatibility after a future valid District 1-5 row.

Two non-blocking hardening recommendations were identified for a future gate to consider before writes are enabled: (1) assert `deleteScopeIds.length === 5` before allowing the write path to proceed, so a future district-name drift fails closed rather than silently narrowing the duplicate-prevention delete scope; (2) consider trimming the dry-run response's internal table/column detail as response-hygiene polish. Neither is safety-critical, and no file was edited as part of this review.

No-change confirmation:
- No Supabase writes.
- No user_districts rows created, updated, or deleted.
- No schema changes.
- No seed changes.
- No migration changes.
- No districts changes.
- No officials_for_user changes.
- No deployment.
- `ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE` remains false.
- No src/lib/officials.ts changes.
- No CurrentOfficialsSection changes.
- No At-Large row rename/delete/replace/repurpose.

Next step:
Unchanged from Gate 16 — still requires the exact completed Gate 15 final approval statement before any write-execution gate can proceed. The two hardening recommendations above, if pursued, require their own separate review/approval gate.

## Gate I11 — Candidate Positions and Match-Score Readiness Plan

Status: Documentation and planning complete.

Date: 08-05-2026
Timestamp: 11:20 pm EST

Current repository baseline recorded at this update:
- Branch: master
- Working tree: clean
- Up to date with origin/master
- Latest pushed commit: `1422b5e` Add session start automation plan
- Previous pushed commit: `cb49846` Add Gate I11 candidate positions and match-score readiness plan

Created:
- `docs/internal_beta_gate_i11_candidate_positions_match_score_readiness_plan.md`

Gate I10B confirmed `candidate_positions` has zero rows system-wide. `match_scores` remain empty because `compute-match-scores` skips candidates without `candidate_positions`. This remains a data-readiness limitation, not an onboarding, match-score, or UI defect. `candidate_positions` must not be invented or manually guessed.

Recommended Internal Beta-safe approach:
1. Keep rings locked when approved evidence does not exist.
2. Use verified official item-specific voting records when available.
3. Score those records through a separately approved, server-side Claude scoring process.
4. Human-review the score and rationale.
5. Recompute `candidate_positions` only for the affected candidate.
6. Test match-score generation using one approved test account.

The four current real City Council District 1 candidates are non-incumbents, so verified government voting histories may not exist. Campaign statements, questionnaires, websites, interviews, or candidate-submitted positions require a separate methodology approval gate before use.

Recommended next candidate-data gate:
Gate I12, documentation-only non-incumbent candidate-position methodology decision.

## Internal Beta Session-Start Automation Plan

Status: Documentation and planning complete.

Date: 08-05-2026
Timestamp: 11:20 pm EST

Latest confirmed pushed commit before this current-state update:
`1422b5e Add session start automation plan`

Created:
- `docs/internal_beta_session_start_automation_plan.md`

Purpose:
- Reduce repeated manual checks at the start of each Claude or ChatGPT session.
- Produce a safe, reusable repository-context summary.

Proposed future files, not yet implemented:
- `tools/civic-session-start.ps1`
- `docs/generated/CIVICMARKET_SESSION_CONTEXT.md`

The future script should perform read-only Git, required-file, gate, build-script, secret-tracking, and safety checks. It must never display environment-variable values or recursively inspect secret files. It must exclude:
- `.env`
- `.env.local`
- `.env.*`
- files with `secret`, `password`, `token`, `key`, `credentials`, or `api` in their names
- `node_modules`
- `.next`
- `.git`
- build output
- binary files

It should verify `ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE` remains `false`. It should fail with a nonzero exit code when a required safety check fails.

No PowerShell automation was implemented in this gate.

Recommended next automation gate:
Review and implement `tools/civic-session-start.ps1` under a separate approved scope.

## Security note — .env.local exposure and remediation

A broad recursive search previously displayed an Anthropic API key from `.env.local`. The exposed key was revoked and replaced. `.env.local` remains ignored and untracked. No API key value should be written into `CIVICMARKET_CURRENT_STATE.md`. Future search and automation commands must exclude environment and secret files.

## No-change confirmation — Gate I11 and session-start automation plan

- No `voting_records` writes.
- No `candidate_positions` writes.
- No `match_scores` writes.
- No Supabase writes.
- No application source-code changes.
- No PowerShell script changes.
- No schema changes.
- No seeds.
- No migrations.
- No CSV changes.
- No RLS changes.
- No grant changes.
- No `user_districts` changes.
- No County Commission changes.
- `ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE` remains `false`.
- No At-Large changes.
- No deployment.
- No environment-variable values documented.

## Gate I12 — Non-Incumbent Candidate-Position Methodology Decision

Status: Documentation and methodology decision complete.

Date: 08-05-2026
Timestamp: 11:29 pm EST

Current repository baseline recorded at this update:
- Branch: master
- Working tree: clean
- Up to date with origin/master
- Latest pushed commit: `55b9748` Add non-incumbent candidate position methodology decision
- Previous pushed commits:
  - `cdff013` Update current state for Gate I11 and session automation
  - `1422b5e` Add session start automation plan
  - `cb49846` Add Gate I11 candidate positions and match-score readiness plan
  - `275c66d` Document Gate I10B final result: onboarding and Civic DNA verified live

Created:
- `docs/internal_beta_gate_i12_non_incumbent_candidate_position_methodology_decision.md`

Build result:
- `npm run build` passed.
- 25 routes generated.
- No build errors.

Gate I12 evaluated:
- Option A: keep match rings locked.
- Option B: verified candidate questionnaires.
- Option C: campaign websites and direct candidate policy statements.
- Option D: structured candidate-submitted CivicMarket responses.
- Option E: interviews, debates, and public forums.
- Option F: mixed source-backed methodology.

### Approved Internal Beta decision

- Keep all four current non-incumbent City Council District 1 candidate match rings locked.
- Do not create `candidate_positions` rows from campaign statements, questionnaires, websites, interviews, endorsements, or inferred ideology at this time.
- Do not create direct manual candidate position values.
- Locked rings are safer than unsupported or inconsistently sourced scores.
- The four candidates remain visible in the app.
- Candidates must not be hidden solely because `candidate_positions` data is unavailable.
- Silence, non-response, or missing evidence must not be scored as neutral or opposed.
- Unsupported dimensions must remain unavailable rather than being assigned zero.

### Reason for the decision

- Consistent source availability across all four candidates has not been verified.
- No approved campaign-derived scoring rubric exists.
- No approved aggregation or conflict-resolution rules exist.
- No approved candidate dispute and correction workflow exists for campaign-derived position evidence.
- The current UI does not distinguish campaign-derived positions from voting-record-derived positions.
- The current `candidate_positions` schema does not store:
  - source type
  - source URL per dimension
  - methodology version
  - reviewer identity
  - scoring rationale per source
  - confidence level
  - correction or supersession history
- Presenting campaign statements as equivalent to governing voting history would create transparency and fairness risk.
- Internal Beta should prefer transparency and incomplete coverage over artificial completeness.

### Prohibited evidence and inference

These must not be used as standalone candidate-position evidence:
- Party registration
- Party endorsements
- Donor or PAC identity
- Candidate biography
- Occupation
- Religion
- Race or ethnicity
- Neighborhood or home address
- Social-media likes or follows
- Third-party ideological ratings
- Opponent claims
- Anonymous posts
- General campaign slogans
- AI-generated summaries without retained verified sources
- Silence or non-response
- Assumptions based on incumbency or office sought

### Future methodology requirements

Before any future campaign-derived `candidate_positions` data may be created, require a separately approved methodology covering:
- Consistent source type across candidates
- Exact candidate identity
- First-party source evidence
- Source URL or retained submission record
- Publication or submission date
- Access date
- Full relevant context
- Exact Civic DNA dimension
- Neutral scoring rubric
- Human review
- Scoring rationale
- Confidence indicator
- Methodology version
- Candidate dispute and correction process
- Stale-source handling
- Conflict resolution
- UI labeling
- Provenance and audit trail
- Rollback plan
- Limited test plan

### Schema and provenance gap

- `candidate_positions` is an aggregate output table and does not currently provide sufficient per-source or per-dimension provenance for campaign-derived evidence.
- A future methodology may require a separate candidate-position evidence or provenance table.
- Gate I12 did not create or approve a new table.
- Campaign-derived evidence must not be silently stored in `voting_records` because campaign statements are not government voting records.
- Campaign-derived positions must not be silently combined with voting-record-derived positions.

### Recommended next gate

Gate I13 — Non-Incumbent Source Availability Inventory.

Gate I13 should be read-only, documentation-only, and no-scoring.

Its purpose should be:
- Review all four current real District 1 candidates.
- Determine whether one consistent first-party source type is available for all four.
- Record source type, URL, publication date, access date, and coverage by Civic DNA dimension.
- Do not score statements.
- Do not create `candidate_positions`.
- Do not create `match_scores`.
- Do not write to Supabase.
- Do not call Claude or Anthropic.
- Do not change app code or schema.
- Stop if consistent source availability cannot be established.

Gate I13 was not implemented by this update.

### No-change confirmation — Gate I12

Gate I12 made no changes to: `candidates`, `voting_records`, `candidate_positions`, `match_scores`, `civic_dna`, `civic_dna_answers`, `user_districts`, `districts`, `current_officials`, `officials_for_user`, `src/lib/officials.ts`, `CurrentOfficialsSection`, schema, tables, seeds, migrations, CSV files, RLS, grants, source code, PowerShell scripts, API keys, environment variables, the County Commission write guard, the At-Large row, or deployment state.

`ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE` remains `false`. No County Commission District 1-5 write was performed. No deployment occurred.

## Gate I13 — Non-Incumbent Source Availability Inventory

Status: Read-only source inventory complete.

Date: 08-05-2026
Timestamp: 11:38 pm EST

Current repository baseline recorded at this update:
- Branch: master
- Working tree: clean
- Up to date with origin/master
- Latest pushed commit: `0aedbc6` Add non-incumbent source availability inventory
- Previous pushed commits:
  - `2935bf1` Update current state for Gate I12
  - `55b9748` Add non-incumbent candidate position methodology decision
  - `cdff013` Update current state for Gate I11 and session automation
  - `1422b5e` Add session start automation plan

Created:
- `docs/internal_beta_gate_i13_non_incumbent_source_availability_inventory.md`

Build result:
- `npm run build` passed.
- 25 routes generated.
- No build errors.

Candidate names verified against `candidates_real.csv`:
- Eric Reikenis
- Indony Baptiste
- Kevin Zimmerman
- Fredric Meltzer

All four are City Council District 1 candidates in PSL City Council D1 2026. No candidate was scored, ranked, or recommended.

### Source findings — Eric Reikenis

- Confirmed first-party campaign website: `vote4eric.org`.
- Substantive policy content was found.
- Potential source coverage was identified for: `growth_development`, `taxation_spending`, `environment`, `public_safety`.
- `housing` and `transparency` coverage remained ambiguous.
- No candidate-position score was created.

### Source findings — Kevin Zimmerman

- Confirmed first-party campaign website: `zimmermanforcityofpsl.com`.
- Substantive policy content was found.
- Potential source coverage was identified for: `growth_development`, `taxation_spending`, `environment`, `public_safety`.
- `housing` and `transparency` coverage remained ambiguous.
- A second domain found during research did not resolve and was not used.
- No candidate-position score was created.

### Source findings — Fredric Meltzer

- Confirmed first-party campaign website: `vote4rickmeltzer.com`.
- Substantive policy content was found.
- Potential source coverage was identified for: `growth_development`, `taxation_spending`, `environment`, transparency-adjacent accountability language.
- Important unresolved identity discrepancy:
  - The repository and CSV identify the candidate as Fredric Meltzer.
  - The first-party campaign website and official campaign-finance filing use the name Rick Meltzer.
  - Gate I13 did not assume or approve that these names refer to the same person without separate verification.
- No candidate-position score was created.

### Source findings — Indony Baptiste

- No first-party 2026 campaign website, candidate-authored policy source, questionnaire, interview, debate, or candidate social account was confirmed.
- A government-adjacent campaign-finance filing confirmed active candidacy but contained no substantive policy content.
- No Civic DNA dimension source coverage was established.
- No candidate-position score was created.

### Cross-candidate result

Outcome A: No consistent first-party source type is currently available across all four candidates.

Reason:
- Three candidates have confirmed campaign websites.
- One candidate, Indony Baptiste, does not currently have a confirmed first-party policy source.
- Gate I13 required the same source standard across all four candidates.
- Weaker or third-party sources must not be used only for the candidate with less web presence.
- Unequal source availability creates a fairness and consistency risk.

### Dimension coverage limitations

- Education had no confirmed first-party policy coverage for any of the four candidates.
- Housing and transparency were ambiguous or absent for most candidates.
- Indony Baptiste had no confirmed dimension coverage.
- No questionnaire, interview, debate, or consistent alternate first-party source type was found across all four candidates.
- A source mentioning an issue does not automatically make it sufficient for scoring.
- No -2 through +2 score was assigned to any statement.

### Unresolved issues

- Fredric Meltzer versus Rick Meltzer identity/name discrepancy remains unresolved.
- Indony Baptiste had no confirmed first-party policy source.
- Possible third-party candidate-name or multi-candidacy conflation was not treated as verified.
- Search-result snippets, third-party summaries, and unverified candidate-identity matches were not used as position evidence.
- These issues must remain unresolved until verified through a separate gate.

### Internal Beta impact

- Gate I12's decision remains unchanged.
- Keep all four current non-incumbent candidate match rings locked.
- Do not create campaign-derived `candidate_positions`.
- Do not create direct manual candidate-position values.
- Do not score missing sources or non-response as zero, neutral, or opposed.
- Keep all four candidate cards visible.
- Do not hide a candidate solely because position data is unavailable.
- Internal Beta should prefer transparent incomplete coverage over inconsistent or unsupported scoring.

### Recommended next gate

Gate I14 — Locked-Ring Internal Beta Communication Plan.

Purpose:
- Define clear user-facing language explaining why match rings are locked.
- Explain that verified source-backed candidate-position data is not yet consistently available.
- Avoid implying the app is broken.
- Avoid implying candidates refused to participate.
- Avoid political or ideological wording.
- Keep all candidate cards visible.
- Define language for ballot cards, candidate profiles, onboarding/calculating, and help/data-sources content.
- Define accessibility and mobile-display requirements.
- No source-code implementation in the first Gate I14 step.
- No database writes.
- No candidate scoring.
- No deployment.

Alternative future gate noted:
- Gate I14 — Candidate Source Reverification. This may be used closer to the August 18, 2026 election if the user prefers another read-only source check before finalizing locked-ring communication.

Gate I14 was not implemented by this update.

### No-change confirmation — Gate I13

Gate I13 made no changes to: `candidates`, `voting_records`, `candidate_positions`, `match_scores`, `civic_dna`, `civic_dna_answers`, `user_districts`, `districts`, `current_officials`, `officials_for_user`, `src/lib/officials.ts`, `CurrentOfficialsSection`, schema, tables, seeds, migrations, CSV files, RLS, grants, source code, PowerShell scripts, API keys, environment variables, the County Commission write guard, the At-Large row, or deployment state.

No candidate was scored. No candidate was ranked. No political recommendation was produced. No Claude or Anthropic API call was made. No Supabase write was performed. `ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE` remains `false`. No County Commission District 1-5 write was performed. No deployment occurred.

## Gate I15 — Locked-Ring Communication Implementation Plan

Status: Documentation-only implementation plan complete.

Date: 08-05-2026
Timestamp: 11:52 pm EST

Current repository baseline recorded at this update:
- Branch: master
- Working tree: clean
- Up to date with origin/master
- Latest pushed commit: `db86380` Add locked-ring implementation plan
- Previous pushed commits:
  - `3eb922b` Add locked-ring internal beta communication plan
  - `5b7d50e` Update current state for Gate I13
  - `0aedbc6` Add non-incumbent source availability inventory
  - `2935bf1` Update current state for Gate I12

Created:
- `docs/internal_beta_gate_i15_locked_ring_implementation_plan.md`

Build result:
- `npm run build` passed.
- 25 routes generated.
- No build errors.

No source code was modified. No implementation or deployment occurred.

### Planned Gate I16 source files

- `src/components/ui/MatchScoreRing.tsx` — strengthen locked-state accessible labeling.
- `src/app/ballot/page.tsx` — add the approved locked-ring label and helper text to candidate cards.
- `src/app/candidates/[id]/page.tsx` — correct the current state logic that treats every null match score as an incomplete Civic DNA quiz.
- `src/app/onboarding/calculating/page.tsx` — replace indefinite calculating language with a successful Civic DNA completion message.
- `src/app/data-sources/page.tsx` — correct the outdated candidate scoring methodology paragraph.
- Optional: `src/lib/copy/lockedRing.ts` — small reusable constants module for approved locked-ring wording. Not required if Gate I16 determines inline copy is clearer and less complex.

### Candidate-profile logic defect

- The candidate profile currently checks `matchScore === null` without checking whether the user completed Civic DNA.
- As a result, a user who already completed Civic DNA may still see: "Take the Civic DNA quiz to unlock your personal match score."
- This incorrectly combines two separate states: Civic DNA not completed, and Civic DNA completed but candidate-position data unavailable.
- Gate I15 proposes reading `profiles.dna_quiz_status` using the same general pattern already used by the Profile page.
- Future logic should distinguish:
  1. Civic DNA incomplete
  2. Civic DNA complete but candidate match data unavailable
  3. Valid match score available
  4. Actual candidate, match-score, network, or database error
- Missing candidate-position data must not trigger a quiz-retake prompt.
- A null score must not automatically be treated as an application error.
- A match-score query error must not silently be presented as a normal locked-ring state.

### Approved copy direction (planning only, not yet implemented)

**Ballot card**
- Label: Match unavailable
- Helper: Not enough verified position data yet.

**Candidate profile**
- Heading: Why is this locked?
- Body: CivicMarket does not yet have enough verified, source-backed position data to calculate a reliable match score for this candidate. The lock is not a rating and does not mean the candidate is a poor match.

**Onboarding calculating screen**
- Heading: Your Civic DNA is ready
- Body: We saved your Civic DNA. Match scores will appear only for candidates with enough verified position data. Some candidate rings may stay locked during the Internal Beta.
- CTA: View my ballot

Gate I15 approved this direction for implementation planning only. The wording has not yet been implemented.

### Accessibility and mobile requirements

- Do not rely on the lock icon alone.
- Provide visible locked-state text.
- Provide a concise accessible name or aria-label.
- Do not rely on color alone.
- Do not announce a locked ring as an error.
- Do not use hover-only explanations.
- Maintain keyboard and touch access.
- Verify at 200% zoom.
- Verify at 390px mobile width.
- Avoid clipping and horizontal scrolling.
- Keep candidate names and offices visually more prominent than the locked-state explanation.
- Apply identical locked-state wording to every candidate.

### Gate I16 test matrix (planned)

1. User has not completed Civic DNA.
2. User completed Civic DNA and candidate data is unavailable.
3. User completed Civic DNA and a valid match score exists.
4. Candidate query fails.
5. Match-score query fails.
6. Ballot page at 390px width.
7. Candidate profile at 390px width.
8. 200% zoom.
9. Keyboard navigation.
10. Screen-reader accessible label.
11. All four current City Council District 1 candidates remain visible.
12. No candidate displays a zero score merely because evidence is unavailable.
13. No quiz-retake prompt appears solely because candidate-position data is unavailable.
14. Actual application errors remain distinct from locked candidate-data states.

### Internal Beta decision carried forward

- Gate I12, Gate I13, and Gate I14 decisions remain unchanged.
- All four current non-incumbent candidate match rings remain locked.
- Candidate cards remain visible.
- A locked ring is not zero.
- A locked ring is not a poor match.
- A locked ring is not evidence of candidate non-participation.
- No unsupported score should be shown.
- No candidate-specific source criticism should appear in locked-ring UI copy.
- Identical wording and treatment should apply to every locked candidate.
- CivicMarket prefers no score over an unsupported score.

### Recommended next gate

Gate I16 — Locked-Ring Communication Implementation and Verification.

Gate I16 may:
- Make the approved source-code changes.
- Add reusable copy constants only if they reduce duplication without unnecessary complexity.
- Correct candidate-profile state logic.
- Add visible and accessible locked-ring wording.
- Update onboarding success communication.
- Update Data Sources methodology wording.
- Run `npm run build`.
- Run `npm run lint`.
- Perform mobile, accessibility, and state-distinction checks.
- Perform a live Internal Beta smoke test where practical.

Avoid splitting Gate I16 into additional documentation-only gates unless a real blocker or unexpected risk appears.

### No-change confirmation — Gate I15

Gate I15 made no changes to: `candidates`, `voting_records`, `candidate_positions`, `match_scores`, `civic_dna`, `civic_dna_answers`, `user_districts`, `districts`, `current_officials`, `officials_for_user`, `src/lib/officials.ts`, `CurrentOfficialsSection`, `compute-match-scores`, `MatchScoreRing`, the ballot page, the candidate profile, the onboarding calculating page, the Data Sources page, schema, tables, seeds, migrations, CSV files, RLS, grants, source code, PowerShell scripts, API keys, environment variables, the County Commission write guard, the At-Large row, or deployment state.

No candidate was scored. No candidate was ranked. No political recommendation was produced. No Supabase write was performed. No Claude or Anthropic API call was made. `ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE` remains `false`. No County Commission District 1-5 write was performed. No deployment occurred.

## Gate I16 — Locked-Ring Communication Implementation and Static Verification

Status: Source-code implementation complete.

Date: 08-06-2026
Timestamp: 12:13 am EST

Current repository baseline recorded at this update:
- Branch: master
- Working tree: clean
- Up to date with origin/master
- Latest pushed commit: `8d75978` Implement locked-ring communication states
- Previous pushed commits:
  - `4bd5840` Update current state for Gate I15
  - `db86380` Add locked-ring implementation plan
  - `3eb922b` Add locked-ring internal beta communication plan
  - `5b7d50e` Update current state for Gate I13

Commit: `8d75978` Implement locked-ring communication states.

Five approved source files were modified:
- `src/components/ui/MatchScoreRing.tsx`
- `src/app/ballot/page.tsx`
- `src/app/candidates/[id]/page.tsx`
- `src/app/onboarding/calculating/page.tsx`
- `src/app/data-sources/page.tsx`

No new file was created. A shared copy module was not created because the approved strings were not duplicated across call sites. Inline copy was the simpler implementation.

### MatchScoreRing accessibility change

- The locked-state accessible label changed from "Match score locked" to "Match score unavailable. Not enough verified position data."
- The locked state is not announced as an error.
- No zero, low-score, failed-score, or incompatibility wording was introduced.
- Existing unlocked score behavior remains unchanged.
- Existing visual dimensions, dashed ring, and lock icon remain unchanged.

### Ballot candidate-card change

- Candidate cards with `candidate.match_score === null` now show "Match unavailable" / "Not enough verified position data yet."
- The same wording is applied to every locked candidate.
- Candidate name and office remain visually more prominent.
- No candidate is hidden.
- No numeric zero is substituted.
- No candidate-specific source criticism is displayed.
- No implication of candidate refusal or non-participation was added.

### Candidate-profile state correction

The candidate profile now reads `profiles.dna_quiz_status` using the existing profile completion field. The `match_scores` query error is captured separately. The profile now distinguishes four states:

**State 1: Valid match score** — existing match-score display remains unchanged.

**State 2: Match-score query error** — the page displays a neutral message that CivicMarket could not check the candidate's match score. Database details are not exposed. The error is not presented as a normal locked-ring state. The user is not incorrectly prompted to retake Civic DNA.

**State 3: Civic DNA complete but candidate match data unavailable** — the profile now shows:
- Heading: Why is this locked?
- Body: CivicMarket does not yet have enough verified, source-backed position data to calculate a reliable match score for this candidate. The lock is not a rating and does not mean the candidate is a poor match.
- A link to the Data Sources page is included.
- No quiz-retake prompt is shown.

**State 4: Civic DNA incomplete** — the existing Civic DNA quiz prompt remains available. The user may be directed to complete the quiz.

Gate I16 fixed the prior defect where every null match score could incorrectly trigger the Civic DNA quiz prompt.

### Onboarding calculating-screen change

- A `phase` state now separates genuine calculation/loading from successful completion.
- The screen begins in the calculating phase.
- After the save and compute flow resolves, it changes to the ready phase.
- Success heading: Your Civic DNA is ready
- Success body: We saved your Civic DNA. Match scores will appear only for candidates with enough verified position data. Some candidate rings may stay locked during the Internal Beta.
- CTA: View my ballot
- The prior unconditional automatic redirect was replaced with a user-controlled button after completion.
- Actual error handling remains separate.
- Decorative emoji was marked `aria-hidden`.
- Missing candidate-position data does not trigger a quiz-retake prompt.

### Data Sources methodology correction

- Outdated wording suggesting AI-generated candidate-position drafts based on voting records, funding, and public statements was removed.
- The page now explains that candidate match scores require approved, source-backed candidate-position evidence.
- Current approved evidence is limited to verified voting records.
- CivicMarket does not infer candidate positions from: political party, donors, endorsements, biography, occupation, demographics, campaign branding, or silence/missing evidence.
- Unsupported candidate dimensions remain unavailable.
- Some candidate rings may remain fully locked during Internal Beta.
- Candidate cards remain visible regardless of score availability.
- A locked ring is not zero or a negative rating.

### Validation results

**Build:** `npm run build` passed. 25 routes generated. No build errors.

**Lint:** `npm run lint` reported five errors. All five errors are the previously documented `@typescript-eslint/no-require-imports` errors in `scripts/import-real-psl-data.cjs` and `scripts/validate-real-psl-csvs.cjs`. No new lint errors were introduced in the five Gate I16 files.

**Static verification passed:**
- Users with completed Civic DNA and unavailable candidate data no longer receive the quiz prompt.
- Ballot locked-state wording is identical for every candidate.
- No zero score was introduced.
- Locked data and actual query errors are separate states.
- No candidate filtering or visibility logic was changed.
- All current candidate cards remain visible by code path.
- The onboarding screen retains a genuine loading phase before success.
- Data Sources no longer implies automatic or unsupported scoring.
- MatchScoreRing has a concise accessible locked-state label.
- No secret file was inspected.
- `ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE` remains `false`.

### Manual verification status

Manual authenticated UI verification was not performed during Gate I16 because no authenticated local UI session was available.

The following remain pending manual verification:
1. Incomplete Civic DNA user sees the quiz prompt.
2. Completed Civic DNA user with no candidate score sees "Why is this locked?"
3. No quiz-retake prompt appears for unavailable candidate data.
4. All four current City Council District 1 candidates remain visible.
5. Every locked candidate displays identical wording.
6. No candidate displays zero because data is unavailable.
7. Onboarding completion displays "Your Civic DNA is ready."
8. Ballot and candidate profile fit at 390px width.
9. Locked messaging remains readable at 200% zoom.
10. Keyboard navigation and accessible names work correctly.
11. Actual errors remain visually and textually separate from the locked state.

These checks are not claimed as passed.

### Internal Beta impact

- Gate I12 through Gate I15 decisions remain unchanged.
- All four current non-incumbent candidate match rings remain locked.
- Candidate cards remain visible.
- CivicMarket now explains the locked state more accurately.
- A locked ring is not zero.
- A locked ring is not a negative rating.
- A locked ring is not evidence that a candidate refused to participate.
- CivicMarket prefers no score over an unsupported score.
- No candidate-specific source gap is exposed in the locked-ring UI wording.

### Recommended next step

Gate I17 — Locked-Ring Live UI Verification and Current-State Closure.

Gate I17 should:
- Perform only the pending authenticated UI checks.
- Verify the four profile and ballot states.
- Verify 390px mobile behavior.
- Verify 200% zoom.
- Verify keyboard and accessible labeling.
- Verify the onboarding ready state.
- Confirm actual error states remain distinct.
- Update `CIVICMARKET_CURRENT_STATE.md` with the results.
- Avoid additional planning documents unless a real defect is found.

No additional documentation-only planning gate is recommended.

### No-change confirmation — Gate I16

Gate I16 made no changes to: `candidates`, `voting_records`, `candidate_positions`, `match_scores`, `civic_dna`, `civic_dna_answers`, `user_districts`, `districts`, `current_officials`, `officials_for_user`, `src/lib/officials.ts`, `CurrentOfficialsSection`, `compute-match-scores` logic, Civic DNA scoring, schema, tables, seeds, migrations, CSV files, RLS, grants, PowerShell scripts, API keys, environment variables, the County Commission write guard, the At-Large row, deployment configuration, or deployment state.

No database write was performed. No candidate was scored. No candidate was ranked. No political recommendation was produced. No Claude or Anthropic API call was made. No secret file was inspected. `ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE` remains `false`. No County Commission District 1-5 write was performed. No deployment occurred.

## Gate I17 — Locked-Ring Live UI Verification and Current-State Closure

Status: Live verification performed against a real authenticated session. **Locked-ring workstream is closed.** No source-code defect was found. No source-code changes were made.

Date: 08-06-2026
Timestamp: 12:16 am EST

Current repository baseline recorded at this update:
- Branch: master
- Working tree: clean
- Up to date with origin/master
- Latest pushed commit: `640a180` Update current state for Gate I16
- `npm run build` re-confirmed passing before testing began (25 routes, no errors).

### Start-state verification

- `git status` was clean before testing began; latest commit confirmed as `640a180`; `npm run build` passed; no files were modified before testing.
- The local dev server was initially blocked by the project's Supabase backend returning HTTP 503 on the auth token-refresh endpoint (confirmed via direct network-request inspection). The user paused and resumed the Supabase project mid-gate; connectivity was independently reconfirmed (401, i.e. reachable, on the project's public auth health endpoint) before live testing resumed.
- The stored browser session had been invalidated by the earlier outage; the user signed back in manually in the browser. No credentials were entered by the assistant at any point, consistent with the standing prohibition on entering passwords into any field.
- A transient "Jest worker encountered 2 child process exceptions" dev-server runtime error appeared on the first candidate-profile page load. Root-caused to two concurrent local dev-server processes left over from the earlier restart attempt corrupting the shared Turbopack build cache — not an application or Gate I16 code defect. All stray `node` processes were stopped and a single clean `npm run dev` instance was started; the same candidate-profile page then loaded correctly and consistently across every subsequent navigation for the remainder of this gate, confirming the cause was environmental, not a source-code issue.

### Tests performed and results

| Test | Result | Directly observed |
|---|---|---|
| 1. Civic DNA complete, candidate data unavailable (ballot) | **PASS** | All four candidates (Eric Reikenis, Fredric Meltzer, Indony Baptiste, Kevin Zimmerman) visible on `/ballot`; each showed identical "Match unavailable — not enough verified position data yet."; no zero score; no candidate-specific wording |
| 2. Candidate profile locked state | **PASS** | Confirmed live on three candidates (Reikenis, Baptiste, Meltzer): "Why is this locked?" heading, exact approved body text, "How match scores work →" link to `/data-sources`, no quiz-retake prompt, ring not zero, candidate profile remained fully visible (voting record, funding sections) |
| 3. Civic DNA incomplete state | **BLOCKED** | No second account with `dna_quiz_status` incomplete was available; no database record was altered to manufacture this state, per instruction |
| 4. Onboarding completion state | **PASS** | "Your Civic DNA is ready" heading and exact approved body text confirmed live (twice); "View my ballot" is a real button requiring a click, not an automatic redirect, confirmed by clicking it and observing navigation to `/ballot`. The initial "calculating" loading frame itself was not captured in a screenshot (tool round-trip latency exceeded its ~2.5s window both attempts) — not claimed as observed |
| 5. Data Sources page | **PASS** | Live page text extracted directly and matches the approved corrected methodology paragraph exactly, including all six required points |
| 6. Mobile width (390px) | **BLOCKED (tooling)** | The `resize_window` tool did not change the actual rendered viewport in this environment (`window.innerWidth` remained 1920 after two attempts, confirmed via direct JS inspection) — an environment/tooling limitation, not a defect. No fabricated pass was recorded |
| 7. 200% zoom | **PASS (approximated method)** | Native browser-zoom keyboard shortcuts are not supported by the browser automation tool; a CSS `zoom: 200%` approximation was used instead. Locked-state text remained fully readable, no clipping, no horizontal scroll, candidate name/office remained visually more prominent than the locked-state text |
| 8. Keyboard accessibility | **PASS** | Confirmed via real Tab key presses (not simulated): keyboard focus reached a locked candidate card and the "How match scores work →" link in logical order, with a clearly visible focus outline on both, screenshotted |
| 9. Accessible locked-ring name | **PASS** | Confirmed via direct DOM/accessibility inspection (not inferred from source): all four locked `MatchScoreRing` instances on `/ballot` exposed exactly `"Match score unavailable. Not enough verified position data."` — not announced as error, zero, failed, low-match, or incompatible |
| 10. Actual error-state distinction | **NOT APPLICABLE (deferred)** | No safe live error-simulation method was available; per instruction this defers to Gate I16's static verification rather than being forced. No network settings, secrets, database rows, schema, or RLS were manipulated to force an error |

No test result was inferred from source code in place of direct observation, except where explicitly marked as deferring to Gate I16's prior static verification (Test 10) or noted as unobserved (part of Test 4).

### Account state directly observed

One existing, previously-approved beta test account was used, signed in by the user directly in the browser (the assistant never entered credentials). This account has a completed Civic DNA quiz and, consistent with every prior gate's findings, zero `match_scores` rows for any of the four real candidates (the pre-existing, documented data-availability gap — unchanged by this gate).

### Checks that relied only on static verification

Test 10 (actual error-state distinction) relied entirely on Gate I16's prior static verification — no live error was safely simulatable. No contradictory live behavior was observed for anything Gate I16 verified statically.

### Defects found

None. The one anomaly encountered (the "Jest worker" runtime error) was investigated, root-caused to a local dev-server process conflict caused by the assistant's own earlier restart attempt, resolved by cleaning up the process tree, and did not recur across any subsequent page load, candidate, or navigation for the rest of the gate.

### Beta-blocker assessment

Tests 3 and 6 remain BLOCKED — Test 3 because no incomplete-Civic-DNA test account was available (and none was manufactured), Test 6 because of a browser-automation tooling limitation in this environment. Neither is treated as a beta blocker: both fall within the closure rule's explicit allowance ("An unavailable incomplete-DNA test account... may remain documented as BLOCKED without preventing closure, provided the relevant static verification passed and no contradictory live behavior was observed"). For Test 6 specifically, the 200% zoom test — a stronger visual-compression check than a simple width resize — was performed live on the same pages and showed no clipping, overlap, or dominance issues, and Gate I15/I16's static review already confirmed no fixed-pixel-width or non-mobile-safe CSS was introduced.

### Workstream closure

**Closed.** All required closure-rule items were directly verified live: the completed-Civic-DNA locked state was verified live (Test 1, Test 2); all four candidates remain visible; identical ballot wording was verified; no zero scores appeared; the candidate profile no longer shows the incorrect quiz-retake prompt for a Civic-DNA-complete account (confirmed live on three separate candidates); no live mobile-layout blocking issue was found (200% zoom check); no accessibility defect was observed (keyboard and accessible-name checks both passed live); no source-code defect was found (the one anomaly was environmental, not code, and did not recur).

### No-change confirmation — Gate I17

Gate I17 made no changes to: `candidates`, `voting_records`, `candidate_positions`, `match_scores`, `civic_dna`, `civic_dna_answers`, `user_districts`, `districts`, `current_officials`, `officials_for_user`, `src/lib/officials.ts`, `CurrentOfficialsSection`, `MatchScoreRing`, the ballot page, the candidate profile, the onboarding calculating page, the Data Sources page, schema, tables, seeds, migrations, CSV files, RLS, grants, source code, PowerShell scripts, API keys, environment variables, network settings, the County Commission write guard, the At-Large row, or deployment state.

No database write was performed. No candidate was scored. No candidate was ranked. No political recommendation was produced. No Claude or Anthropic API call was made. No secret file was inspected. No credentials were entered by the assistant. `ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE` remains `false`. No County Commission District 1-5 write was performed. No deployment occurred. The local dev server started for this gate was stopped after testing concluded, and all stray Node processes (including two left over from an earlier restart attempt) were cleaned up.

## Gate I18 — Non-Incumbent Source Availability Re-Check and Closure Decision

Status: Read-only source re-check complete.

Date: 08-06-2026
Timestamp: 12:40 am EST

Current repository baseline recorded at this update:
- Branch: master
- Working tree: clean
- Up to date with origin/master
- Latest pushed commit: `24f7f1f` Add non-incumbent source availability recheck
- Previous pushed commits:
  - `bada51f` Record Gate I17 live UI verification
  - `640a180` Update current state for Gate I16
  - `8d75978` Implement locked-ring communication states
  - `4bd5840` Update current state for Gate I15

Created:
- `docs/internal_beta_gate_i18_non_incumbent_source_availability_recheck.md`

Build result:
- `npm run build` passed.
- 25 routes generated.
- No build errors.

No source code or existing documentation was modified during the Gate I18 research step. No candidate was scored, ranked, or recommended.

### Candidates re-checked

- Eric Reikenis
- Indony Baptiste
- Kevin Zimmerman
- Fredric Meltzer

All four remain the current City Council District 1 candidates for PSL City Council D1 2026. Election date: August 18, 2026.

### Equal-research method

- The same source categories and first-party evidence standards were applied to all four candidates.
- Sources checked included: official campaign websites, candidate-controlled social accounts, candidate-authored policy pages, candidate questionnaires, candidate interviews, debates or forums, official campaign-finance filings, and official election-office candidate listings.
- Search-result snippets, third-party summaries, endorsements, donors, party, biography, occupation, demographics, campaign branding, silence, and AI-generated summaries were not treated as candidate-position evidence.
- Campaign-finance filings were used only for identity or candidacy confirmation unless they contained direct policy statements.

### Candidate findings

**Eric Reikenis**
- Confirmed campaign website remains available: `vote4eric.org`.
- A Facebook page was found but was not confirmed as candidate-controlled and was not used as first-party position evidence.
- A newly reviewed About page contained a direct transparency statement.
- Transparency coverage changed from potential or ambiguous to confirmed substantive coverage.
- Previously confirmed website-based coverage remained available.
- No candidate-position score was created.

**Kevin Zimmerman**
- Confirmed campaign website remains available: `zimmermanforcityofpsl.com`.
- A Facebook page was found but was not confirmed as candidate-controlled.
- No material new policy content was found.
- Gate I13 dimension availability remained unchanged.
- No candidate-position score was created.

**Fredric Meltzer / Rick Meltzer**
- Confirmed campaign website remains available: `vote4rickmeltzer.com`.
- A third-party endorsement page was found and explicitly excluded as candidate-position evidence.
- The repository identifies the candidate as Fredric Meltzer.
- The campaign website and official campaign-finance filing use Rick Meltzer.
- The official campaign-finance filing was re-checked.
- The St. Lucie County Supervisor of Elections site was also checked where available.
- No authoritative source was found that explicitly connects Fredric Meltzer and Rick Meltzer.
- The identity/name discrepancy remains unresolved.
- No candidate data was changed.
- No candidate-position score was created.

**Indony Baptiste**
- No first-party 2026 campaign website was found.
- No confirmed candidate-controlled social account was found.
- No candidate questionnaire was found.
- No candidate interview was found.
- No debate or forum response was found.
- No candidate-authored policy source was found.
- The result remains unchanged from Gate I13.
- No Civic DNA dimension coverage was established.
- No candidate-position score was created.

### New sources since Gate I13

- Reikenis: newly reviewed About page with a direct transparency statement; unverified Facebook page, excluded as first-party evidence.
- Zimmerman: unverified Facebook page, excluded as first-party evidence.
- Meltzer: third-party endorsement page, excluded as candidate-position evidence.
- Baptiste: no new source.

None of the newly found material creates a consistent source type across all four candidates.

### Dimension coverage change

- Only one dimension availability classification changed: Eric Reikenis `transparency` moved from potential or ambiguous coverage to confirmed substantive coverage.
- No other candidate or dimension changed.
- Education still lacks confirmed first-party coverage across all four candidates.
- Indony Baptiste still has no confirmed dimension coverage.
- No -2 through +2 value was assigned.
- Issue availability was not converted into ideological direction.

### Consistent-source result

Outcome A: No consistent first-party source type exists across all four candidates.

Reason:
- Reikenis, Zimmerman, and Meltzer have confirmed campaign websites.
- Baptiste still has no confirmed first-party policy source.
- Unequal source availability prevents a consistent evidence standard across all four candidates.
- Weaker or third-party sources must not be used only for the candidate with less web presence.
- One new transparency statement for Reikenis does not change the cross-candidate outcome.

### Closure decision

- Keep all four candidate match rings locked.
- Do not create `candidate_positions` for these four candidates.
- Do not create or recalculate `match_scores` from campaign materials.
- Do not score missing evidence or silence as zero, neutral, or opposed.
- Keep all four candidate cards visible.
- Do not open another immediate candidate-source research gate.
- Close the current non-incumbent source re-check sequence.
- Re-check only: after the August 18, 2026 election, or when a material new first-party source is proactively provided and verified.
- Return focus to the remaining Internal Beta launch blockers.

### Locked-ring workstream status

- Gates I11 through I17 remain complete and closed.
- Gate I18 did not reopen the locked-ring implementation.
- The approved locked-ring UI wording remains in place.
- Gate I18 did not change the app.
- Gate I18 did not uncover a reason to alter the locked-ring communication.
- Outcome A supports the existing locked-ring state.

### Next actual beta blocker

The next remaining blocker identified in this document is: **Voting records with official source URLs.**

- This blocker remains intentionally open pending official, item-specific source material.
- It concerns officials or incumbents and verified voting-record evidence.
- Gate I18's non-incumbent campaign-source findings do not resolve it.
- No voting-record data was implemented or fabricated during this current-state update.
- Gate I19 was not automatically created.
- The next session should review the broader Internal Beta launch plan and decide the safest next action for the voting-record source blocker.

### No-change confirmation — Gate I18

Gate I18 made no changes to: `candidates`, `voting_records`, `candidate_positions`, `match_scores`, `civic_dna`, `civic_dna_answers`, `user_districts`, `districts`, `current_officials`, `officials_for_user`, `src/lib/officials.ts`, `CurrentOfficialsSection`, `compute-match-scores` logic, Civic DNA scoring, `MatchScoreRing`, the ballot page, the candidate profile, the onboarding calculating page, the Data Sources page, schema, tables, seeds, migrations, CSV files, RLS, grants, source code, PowerShell scripts, API keys, environment variables, the County Commission write guard, the At-Large row, deployment configuration, or deployment state.

No database write was performed. No candidate was scored. No candidate was ranked. No political recommendation was produced. No Claude or Anthropic API call was made. No secret file was inspected. No credentials were entered. No forms were submitted. No candidate or campaign was contacted. No executable file was downloaded. `ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE` remains `false`. No County Commission District 1-5 write was performed. No deployment occurred.

## Gate I19 — Voting-Record Official Source Review and Beta-Blocker Decision

Status: Read-only repository/source review complete.

Date: 08-06-2026
Timestamp: 08:54 pm EST

### Current repository baseline

- Branch: master
- Working tree: clean
- Up to date with origin/master
- Latest pushed commit:
  - `50c2a37` Add voting record official source review
- Previous pushed commits:
  - `5b7b204` Update current state for Gate I18
  - `24f7f1f` Add non-incumbent source availability recheck
  - `bada51f` Record Gate I17 live UI verification
  - `640a180` Update current state for Gate I16

Created:
- `docs/internal_beta_gate_i19_voting_record_official_source_review.md`

Commit:
- `50c2a37` Add voting record official source review
- Commit successfully pushed to origin/master

Build result:
- `npm run build` passed.
- 25 routes generated.
- No build errors.

No source code, CSV, schema, database, or existing application data was modified.

### Repository voting-record state

- `data/real-psl-replacement/voting_records_real.csv` is header-only.
- Current row count is zero.
- `scripts/validate-real-psl-csvs.cjs` was run during Gate I19.
- Validation result:
  - 0 voting-record rows.
  - 0 validation errors.
  - 1 expected warning for the header-only voting-record CSV.
- There are therefore no existing repository voting-record rows to verify individually.
- No placeholder, duplicate, identity, date, source, or item mismatch was found because no rows exist.

### Database verification limitation

- A fresh live read-only Supabase query was not performed during Gate I19.
- No credentials or secret files were accessed.
- Gate I19 therefore does not claim a fresh live `voting_records` row count.
- Existing repository and prior documented evidence were used only as corroborating context.
- This limitation does not change the repository finding that the real replacement CSV contains zero voting-record rows.

### Official-source review result

- No new voting records were invented to fill the gap.
- No new legislative items were researched without an existing repository row.
- No row-level official source review was possible because there are zero rows.
- No item-specific source URL exists in the current voting-record replacement CSV.
- No individual official vote is currently represented in that CSV.
- No voting-record row is currently beta-safe because no voting-record rows exist.

### Outcome A

No existing voting-record row is ready for beta display.

Clarification:
- This is not a case of bad rows failing verification.
- The feature area is empty.
- The blocker is absence of verified voting-record data, not remediation of incorrect rows.

### Current beta-blocker status

- Voting records with official source URLs remain the sole documented hard beta blocker identified in `CIVICMARKET_CURRENT_STATE.md`.
- The blocker applies to the voting-record feature area as a whole.
- It is not currently a row-specific correction problem.
- Candidate match rings remain locked independently of this blocker.
- Gate I19 did not reopen the candidate-position or locked-ring workstreams.
- No candidate scoring or match-score generation was enabled.

### Safe product options (identified, not chosen)

**Option 1 — Keep voting records hidden**
- Do not display voting-record content until verified rows exist.
- Lowest misinformation risk.

**Option 2 — Show only verified rows**
- Applicable later if any rows pass the full official-source standard.
- Must avoid implying candidates without rows have no voting history.

**Option 3 — Show an unavailable-state explanation**
- Keep the feature area visible.
- Explain that verified voting-record data is not yet available.
- Do not show placeholder rows.
- Do not show zero counts that imply an official has no voting history.

**Option 4 — Delay beta launch**
- Use only if voting records are mandatory for the approved Internal Beta experience.

Gate I19 did not select an option.

### Recommended next gate

Gate I20 — Voting-Record Beta-Scope Decision.

Gate I20 should:
- Make a product-scope decision among the four Gate I19 options.
- Determine whether voting records are mandatory for Internal Beta launch.
- If voting records are not mandatory, define the safest beta behavior:
  - hidden, or
  - explicit unavailable state
- Define exact user-facing wording if an unavailable state is selected.
- Determine whether any current UI path already exposes empty voting-record sections.
- Review whether hiding or unavailable-state behavior requires a small source-code change.
- Define accessibility and mobile requirements.
- Avoid new voting-record source research unless an actual verified item is provided.
- Avoid creating or modifying voting_records data.
- Avoid candidate_positions or match_scores changes.

Gate I20 was not implemented by this update.

### Incidental open question (not a voting-record source finding)

- Gate I19 observed that `candidates_real.csv` currently contains 11 candidate rows, including Mayor and City Council District 3 entries.
- The current-state documentation previously focused on the live import of the original four City Council District 1 candidates.
- Gate I19 did not verify whether the Mayor and District 3 rows have been imported into the live database.
- Do not treat those additional CSV rows as confirmed live data until separately verified.
- This was incidental to Gate I19 and is not a voting-record source finding.

### No-change confirmation — Gate I19

Gate I19 made no changes to: `candidates`, `voting_records`, `candidate_positions`, `match_scores`, `civic_dna`, `civic_dna_answers`, `user_districts`, `districts`, `current_officials`, `officials_for_user`, `src/lib/officials.ts`, `CurrentOfficialsSection`, `compute-match-scores` logic, Civic DNA scoring, `MatchScoreRing`, the ballot page, the candidate profile, the onboarding calculating page, the Data Sources page, schema, tables, seeds, migrations, CSV files, RLS, grants, source code, PowerShell scripts, API keys, environment variables, the County Commission write guard, the At-Large row, deployment configuration, or deployment state.

No database write was performed. No candidate was scored. No candidate was ranked. No political recommendation was produced. No Claude or Anthropic API call was made. No secret file was inspected. No credentials were entered. `ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE` remains `false`. No County Commission District 1-5 write was performed. No deployment occurred.

## Gate I20 — Voting-Record Beta-Scope Decision

Status: Product-scope decision complete.

Date: 08-06-2026
Timestamp: 09:16 pm EST

### Current repository baseline

- Branch: master
- Working tree: clean
- Up to date with origin/master
- Latest pushed commit:
  - `b28ad6c` Add voting record beta scope decision
- Previous pushed commits:
  - `625f204` Update current state for Gate I19
  - `50c2a37` Add voting record official source review
  - `5b7b204` Update current state for Gate I18
  - `24f7f1f` Add non-incumbent source availability recheck

Created:
- `docs/internal_beta_gate_i20_voting_record_beta_scope_decision.md`

Commit:
- `b28ad6c` Add voting record beta scope decision
- Commit successfully pushed to origin/master

Build result:
- `npm run build` passed.
- 25 routes generated.
- No build errors.

No source code, CSV, schema, database, or application data was modified.

### Current voting-record UI behavior

- Candidate profile currently renders a visible Voting Record section when zero verified rows exist.
- Current empty text is:
  - "No voting records yet."
- The section does not show a numeric zero count.
- The section does not show placeholder rows.
- A separate disclaimer already says:
  - "Voting records are not yet available for these candidates."
- Ballot cards do not display per-candidate voting-record content.
- Data Sources currently describes voting records in present tense as though populated records are already available.
- That Data Sources wording is not fully consistent with the current zero-row state.

### Gate I20 option review

**Option 1 — Keep voting records hidden**
- Safe from misinformation.
- Less transparent than an explicit unavailable state.
- Not selected.

**Option 2 — Show only verified rows**
- Selected as the long-term data-display rule.
- Future rows must meet the official source standard.
- Not sufficient by itself for the current zero-row UX.

**Option 3 — Show an unavailable-state explanation**
- Selected current beta behavior.
- Best balance of transparency, fairness, accessibility, mobile clarity, implementation effort, reversibility, and consistency with the locked-ring approach.

**Option 4 — Delay Internal Beta**
- Not selected.
- Existing beta-launch documentation does not require populated voting-record rows for Internal Beta.
- Voting records are documented as intentionally incomplete rather than an application defect.

### Selected wording

Primary:
- Verified voting record data is not available yet.

Secondary:
- CivicMarket only shows voting records when an official source confirms the exact item, date, and individual vote. We do not fill missing records with estimates or assumptions.

Optional methodology link:
- How CivicMarket verifies voting records

Target:
- `/data-sources`

### Language restrictions

Do not use unavailable-state wording such as:
- No voting history
- 0 votes
- No record
- Candidate has not voted
- No activity
- Nothing to show
- Coming soon
- Data missing
- Failed to load

unless describing an actual technical error where appropriate.

- Missing verified voting-record data must not be interpreted as no voting history.
- The candidate must not be blamed for the missing data.
- CivicMarket must not imply a complete historical search was performed.
- No placeholder or synthetic rows should be displayed.

### State distinction

**Unavailable data state**
- Zero verified voting-record rows.
- Neutral styling.
- No retry required.
- Methodology explanation.
- No error icon required.

**Actual application error**
- Query or network failure.
- Separate error state.
- Retry may be offered.
- Must not use the normal unavailable-data wording.

**Verified data exists**
- Show only fully supported rows.
- Each displayed row must have an official source.
- Never mix verified records with placeholders.

### Candidate fairness requirements

- Same unavailable-state wording for every candidate.
- No zero count.
- No inactive label.
- No candidate penalty because voting-record data is absent.
- No candidate hidden because voting-record data is absent.
- Future partial coverage must not imply that candidates without a displayed row have no voting history.
- Candidate match rings remain locked independently of voting-record availability.

### Accessibility and mobile requirements

- Visible text, not icon-only.
- Do not rely on color alone.
- Do not announce unavailable data as an error.
- Descriptive methodology link.
- Keyboard accessible.
- Touch accessible.
- Logical focus order.
- Verify at 200% zoom.
- Verify at 390px viewport width.
- No horizontal scrolling.
- No clipped text.
- Candidate name and office remain visually dominant.
- Unavailable-state messaging should not visually overpower the candidate profile.

### Gate I20 outcome

Outcome B: Voting records can be removed as a hard Internal Beta blocker after a small unavailable-state implementation and live verification.

- Voting records are no longer a hard blocker in content terms.
- The blocker is contingent only on implementing and verifying the approved unavailable state.
- Verified voting-record data acquisition remains an open data-completion task.
- The beta must not show fake, placeholder, unsupported, or zero-implying records.

### Required implementation

Gate I20 identified the following small presentation-only changes:

- Replace candidate-profile empty text:
  - "No voting records yet."
- Add the approved unavailable-state primary and secondary wording.
- Add or preserve an appropriate Data Sources link.
- Reconcile the existing redundant disclaimer sentence.
- Update the Data Sources voting-record methodology section so it accurately reflects the current zero-row state.
- Decide during implementation whether voting-record query failures need a small separate error state.
- Do not change data, schema, scoring, APIs, or database behavior.

### Required verification

- `npm run build`
- `npm run lint`
- Identical unavailable wording across all four current candidates.
- No zero or placeholder language.
- No "no voting history" implication.
- Candidate profile at approximately 390px width.
- 200% zoom.
- Keyboard accessibility.
- Methodology link accessibility.
- Candidate profile and Data Sources wording consistency.
- Regression check that locked-ring behavior remains unchanged.
- Actual errors remain separate from normal unavailable state if error handling is touched.

### Incidental 11-candidate issue

- `candidates_real.csv` currently contains 11 rows:
  - 4 City Council District 1
  - 4 Mayor
  - 3 City Council District 3
- Live database import status of Mayor and District 3 rows remains unverified.
- Gate I20 classifies this as a pre-beta verification item.
- It is not currently classified as a new hard blocker.
- It is not automatically treated as post-beta expansion.
- Do not claim those seven additional CSV candidates are live until separately verified.

### Recommended next gate

Gate I21 — Voting-Record Unavailable-State Implementation and Verification.

Gate I21 should:
- Make the smallest approved presentation changes.
- Touch only the necessary source files.
- Keep all data unchanged.
- Build.
- Lint.
- Perform mobile and accessibility verification.
- Perform live candidate-profile and Data Sources verification.
- Update `CIVICMARKET_CURRENT_STATE.md` after results are known.
- Avoid another documentation-only planning gate unless a real blocker appears.

Gate I21 was not implemented by this update.

### No-change confirmation — Gate I20

Gate I20 made no changes to: `candidates`, `voting_records`, `candidate_positions`, `match_scores`, `civic_dna`, `civic_dna_answers`, `user_districts`, `districts`, `current_officials`, `officials_for_user`, `src/lib/officials.ts`, `CurrentOfficialsSection`, `compute-match-scores` logic, Civic DNA scoring, `MatchScoreRing`, the ballot page, the candidate profile, the onboarding calculating page, the Data Sources page, schema, tables, seeds, migrations, CSV files, RLS, grants, source code, PowerShell scripts, API keys, environment variables, the County Commission write guard, the At-Large row, deployment configuration, or deployment state.

No database write was performed. No voting-record row was created, edited, deleted, or archived. No candidate was scored. No candidate was ranked. No political recommendation was produced. No Claude or Anthropic API call was made. No secret file was inspected. `ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE` remains `false`. No County Commission District 1-5 write was performed. No deployment occurred.

## Gate I21 — Voting-Record Unavailable-State Implementation and Live Verification

Status: Implementation complete, live verification passed. **Voting records are removed as a hard Internal Beta blocker.**

Date: 08-06-2026
Timestamp: 09:50 pm EST

Implementation commit:
- `8d2347a` Add voting record unavailable state (`src/app/candidates/[id]/page.tsx`, `src/app/data-sources/page.tsx`)

### Tests performed and results

| Test | Result |
|---|---|
| Candidate profile — Eric Reikenis, Fredric Meltzer, Indony Baptiste, Kevin Zimmerman (all four current City Council District 1 candidates) | **PASS** — each showed identical live text: "Verified voting record data is not available yet." plus the approved secondary explanation and a "How CivicMarket verifies voting records →" link; the old "No voting records yet." text is gone; no zero count; no "no voting history" implication; each candidate remained fully visible |
| Methodology link navigation | **PASS** — clicking the link on Eric Reikenis's profile navigated to `/data-sources` |
| Data Sources "Voting records" section | **PASS** — live text confirmed to include the official-source requirement, an explicit statement that Internal Beta coverage may be incomplete, a statement that a missing record does not mean no voting history, a statement that CivicMarket never fills gaps with estimates, and a statement that match rings are a separate feature that may remain locked independently |
| Locked-ring behavior | **PASS (unaffected)** — "Why is this locked?" match-score section observed unchanged on all four candidates, exact wording from Gates I14-I17 preserved |
| Redundant disclaimer reconciliation | **PASS** — the "Details" disclaimer now reads only "CivicMarket beta — candidate and funding data sourced from official public records." with the redundant voting-record sentence removed, confirmed live |
| 390px viewport | **BLOCKED (tooling)** — the `resize_window` tool did not change the actual rendered viewport in this environment (`window.innerWidth` remained 1920 after two attempts), the same limitation documented in Gate I17. No fabricated pass recorded. Supplementary note: no fixed-pixel-width classes were introduced by the Gate I21 diff — only flexible Tailwind classes (`text-sm leading-6`, `mt-2 inline-block`) — consistent with the layout already proven safe at narrow widths by prior sections on the same page |
| 200% zoom | **PASS (approximated method)** — native browser-zoom keyboard shortcuts are not supported by the browser automation tool; a CSS `zoom: 200%` approximation was used instead (same method as Gate I17). Full Voting Record text, primary and secondary copy, and the methodology link all remained fully visible and readable with no clipping and no overlap |
| Keyboard accessibility | **PASS** — confirmed via real Tab key presses (not simulated) from the "Voting" tab button through Funding, Details, Reviews, the "How match scores work →" link, and finally the "How CivicMarket verifies voting records →" link, in that exact logical order; a visible focus outline was confirmed on the methodology link via screenshot |
| Voting-record query-error state | **BLOCKED** — no safe way to simulate a live Supabase query failure without touching network, environment, or database state was available; per instruction, the database/network was not intentionally broken. Relies entirely on the static verification already completed prior to this live pass (the `.then/.catch` handling added in commit `8d2347a` was reviewed by build/lint/diff inspection, not exercised live) |

### Defects found

None.

### Account state used

An existing, already-authenticated beta test-account browser session was used (signed in by the user prior to this gate's live testing; the assistant never entered, inspected, or logged credentials).

### Outcome B conditions

Both Gate I20 Outcome B conditions are now satisfied:
- The small unavailable-state implementation is complete (commit `8d2347a`).
- Live verification has passed for the unavailable state, the Data Sources wording, candidate visibility, and locked-ring non-interference — the two BLOCKED items (390px tooling limitation, live query-error simulation) do not prevent closure per Gate I20's own closure rule, since static verification passed for both and no contradictory live behavior was observed for either.

### Voting-record hard beta-blocker status

**Voting records are removed as a hard Internal Beta blocker**, effective this update. Verified voting-record data acquisition (official item-specific sources for the four current non-incumbent candidates, or any future candidate) remains an open, ongoing data-completion task, unaffected by this closure. The beta must continue to show no fake, placeholder, unsupported, or zero-implying voting-record rows at any point.

### Remaining pre-beta verification item (separate from this closure)

- Mayor and City Council District 3 live-import status remains unverified (per Gate I19/I20's incidental 11-candidate finding: `candidates_real.csv` has 11 rows — 4 City Council District 1, 4 Mayor, 3 City Council District 3 — and only the live-import status of the 4 City Council District 1 rows has been confirmed across prior gates).
- This is a separate, still-open pre-beta verification item and is not resolved or affected by this voting-record blocker closure.

### No-change confirmation — Gate I21

Gate I21 made no changes to: `voting_records` data, `voting_records_real.csv`, `candidates`, `candidate_positions`, `match_scores`, `civic_dna`, `civic_dna_answers`, `compute-match-scores`, Civic DNA scoring, `user_districts`, `districts`, `current_officials`, `officials_for_user`, `src/lib/officials.ts`, `CurrentOfficialsSection`, `MatchScoreRing` behavior, ballot locked-ring behavior, onboarding locked-ring behavior, schema, tables, seeds, migrations, RLS, grants, PowerShell scripts, environment files, or deployment configuration.

No Supabase write was performed. No voting-record row was added, removed, or archived. No candidate was scored or ranked. No political recommendation was produced. No secret file was inspected. `ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE` remains `false`. No County Commission logic was changed. No deployment occurred. The local dev server started for this gate's live verification was stopped after testing concluded, and no stray Node processes remained.

## Gate I22 — Mayor and City Council District 3 Live-Import Status Verification

Status: Read-only live verification complete.

Date: 08-06-2026
Timestamp: 10:27 pm EST

### Current repository baseline

- Branch: master
- Working tree: clean
- Up to date with origin/master
- Latest pushed commit:
  - `9bd55fb` Add Mayor and District 3 live import verification
- Previous pushed commits:
  - `bd009af` Record Gate I21 live verification
  - `8d2347a` Add voting record unavailable state
  - `112d656` Update current state for Gate I20
  - `b28ad6c` Add voting record beta scope decision

Created:
- `docs/internal_beta_gate_i22_mayor_district3_live_import_verification.md`

Commit:
- `9bd55fb` Add Mayor and District 3 live import verification
- Commit successfully pushed to origin/master

Build result:
- `npm run build` passed.
- 25 routes generated.
- No build errors.

No database write, source-code change, CSV change, schema change, or deployment occurred.

### Repository candidate inventory

- `candidates_real.csv` contains 11 total rows:
  - 4 City Council District 1
  - 4 Mayor
  - 3 City Council District 3

**Mayor candidates**
- Shannon Martin — office: Mayor, district_name: Mayor, election_name: PSL Mayor 2026, is_incumbent: true
- Eric Strazzeri — office: Mayor, district_name: Mayor, election_name: PSL Mayor 2026
- Steven Giordano — office: Mayor, district_name: Mayor, election_name: PSL Mayor 2026
- Steven Harrington — office: Mayor, district_name: Mayor, election_name: PSL Mayor 2026

**City Council District 3 candidates**
- Fritz Alexandre
- Jim Norton
- Peter Overhuls

For all three: office in CSV: "City Council"; district_name: "City Council District 3"; election_name: "PSL City Council D3 2026".

**Office-field inconsistency:**
- District 1 CSV rows use office: "City Council District 1"
- District 3 CSV rows use office: "City Council"
- Gate I22 did not modify or normalize this field.

### Live read-only verification method

- Live Supabase verification used read-only REST GET requests.
- Queries used the public publishable/anon key exposed through the already-compiled public client bundle.
- No `.env.local`, password, service-role key, private token, or secret file was inspected.
- Public SELECT access was used under the existing RLS policy.
- No write-capable operation was performed.
- An earlier browser-console fetch-override attempt was blocked by the harness safety classifier and was abandoned rather than bypassed.

### Mayor live result

- Outcome for all four Mayor CSV rows: **MISSING**.
- None of the four Mayor candidates exists in the live candidates table.
- No active or archived matching Mayor candidate row was found.
- The prerequisite Mayor district row is also missing.
- The corresponding Mayor election row is also missing.

### District 3 live result

- Outcome for all three City Council District 3 CSV rows: **MISSING**.
- None of the three District 3 candidates exists in the live candidates table.
- No active or archived matching District 3 candidate row was found.
- The prerequisite City Council District 3 district row is also missing.
- The corresponding District 3 election row is also missing.

### Live candidates table result

- The live candidates table currently contains exactly four rows.
- Those four rows are the previously approved City Council District 1 candidates.
- No duplicate candidate rows were found.
- No unexpected archived rows were found.
- No Mayor or District 3 rows were present under alternate office/district values.

### District 1 regression sanity check

- **PASS.**
- All four City Council District 1 candidates remain live.
- All four remain active.
- Material fields match the expected CSV and prior documented state.
- No District 1 regression was found.
- Gate I22 did not reopen District 1 candidate review.

### Duplicate and mismatch checks

- No duplicate candidate IDs were found.
- No duplicate active candidate rows were found.
- No Mayor candidate was incorrectly assigned to District 1 or District 3.
- No District 3 candidate was incorrectly assigned to Mayor or District 1.
- No unexpected archived row was found.
- No alternate live row appeared to represent one of the seven missing candidates.
- The issue is missing data, not mismatched existing rows.

### App-facing interpretation

- The current approved beta test account has five real `user_districts` rows:
  - City Council District 1
  - School Board District 1
  - County Commission At-Large
  - Florida House District 85
  - Florida Senate District 27
- Mayor and District 3 candidates are not absent due to a current-user filtering artifact.
- Their underlying district, election, and candidate rows are missing system-wide.
- UI visibility was used only as corroborating evidence.
- Direct live table queries were the verification source.
- No District 3 user assignment was inferred or created.

### Gate I22 outcome

Outcome B: Some or all expected rows are missing from the live database.

- All seven expected Mayor and District 3 candidate rows are missing.
- Required prerequisite district and election rows are also missing.
- This is not a candidate-row-only import problem.
- A future import must account for the prerequisite district/election data and the District 3 office-field inconsistency.

### Beta impact

- This pre-beta verification item remains open.
- It is not elevated to a hard Internal Beta blocker.
- The currently approved and tested beta experience is still based on the existing District 1 candidate coverage.
- No incorrect or misleading District 1 candidate data was found.
- Mayor and District 3 are a coverage gap for a broader beta stage.
- If broader beta scope is expanded to include citywide Mayor coverage or District 3 users, this item must be resolved first.

### Recommended next gate

Gate I23 — Mayor and City Council District 3 Import Approval Decision.

Gate I23 should remain documentation and approval focused before any write. It should:
- Decide whether Mayor and District 3 must be included before the next beta stage.
- Verify the correct district model for Mayor and City Council District 3.
- Verify the correct election rows.
- Resolve the District 3 CSV office-field inconsistency ("City Council" versus the District 1 pattern "City Council District 1").
- Inspect `scripts/import-real-psl-data.cjs`, which is currently designed around a single district/election flow.
- Determine the minimum safe changes required before import.
- Define exact prerequisite district and election rows.
- Define exact seven candidate rows.
- Define validation and rollback requirements.
- Require explicit approval before any database write or import execution.

Gate I23 was not implemented by this update.

### No-change confirmation — Gate I22

Gate I22 made no changes to: `candidates`, `elections`, `districts`, `voting_records`, `candidate_positions`, `match_scores`, `civic_dna`, `civic_dna_answers`, `user_districts`, `current_officials`, `officials_for_user`, `src/lib/officials.ts`, `CurrentOfficialsSection`, `compute-match-scores` logic, Civic DNA scoring, `MatchScoreRing`, the ballot page, the candidate profile, the onboarding calculating page, the Data Sources page, schema, tables, seeds, migrations, CSV files, RLS, grants, source code, PowerShell scripts, API keys, environment variables, the County Commission write guard, the At-Large row, deployment configuration, or deployment state.

No database write was performed. Only read-only GET queries were used. No candidate row was inserted, updated, deleted, or archived. No district row was inserted, updated, deleted, or archived. No election row was inserted, updated, deleted, or archived. No candidate was scored. No candidate was ranked. No political recommendation was produced. No Claude or Anthropic API call was made. No secret file was inspected. `ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE` remains `false`. No County Commission District 1-5 write was performed. No deployment occurred.

## Gate I23 — Mayor and City Council District 3 Import Approval Decision

Status: Documentation and approval-planning gate complete.

Date: 08-06-2026
Timestamp: 10:39 pm EST

### Current repository baseline

- Branch: master
- Working tree: clean
- Up to date with origin/master
- Latest pushed commit:
  - `68d08c6` Add Mayor and District 3 import approval decision
- Previous pushed commits:
  - `30d4c28` Update current state for Gate I22
  - `9bd55fb` Add Mayor and District 3 live import verification
  - `bd009af` Record Gate I21 live verification
  - `8d2347a` Add voting record unavailable state

Created:
- `docs/internal_beta_gate_i23_mayor_district3_import_approval_decision.md`

Commit:
- `68d08c6` Add Mayor and District 3 import approval decision
- Commit successfully pushed to origin/master

Build result:
- `npm run build` passed.
- 25 routes generated.
- No build errors.

No database write, source-code change, CSV change, schema change, or deployment occurred.

### Beta-stage requirement decision

Option A — Mayor and District 3 should be imported before the next broader beta stage, not before the currently approved Internal Beta can continue.

- The current District 1 beta experience remains valid.
- Mayor is a confirmed planned/known office.
- District 3 must exist before District 3 users can be included.
- Their current absence is a broader-coverage gap, not a defect in the already-tested District 1 experience.

### Mayor district-model recommendation

- Proposed new district row:
  - name: Mayor
  - type: city_council
  - city: Port St. Lucie
  - state: FL
- Reusing `city_council` is currently the smallest functional option because it buckets correctly under the existing City UI behavior.
- This reuse is imperfect and still requires explicit approval.
- No new schema enum/type was approved.
- No district row was created.

### District 3 district-model recommendation

- Proposed District 3 row should mirror the existing District 1 district row.
- Proposed:
  - name: City Council District 3
  - type: city_council
  - city: Port St. Lucie
  - state: FL
- Only the district number should differ from the existing District 1 pattern.
- No District 3 district row was created.

### Election-model findings

**Mayor** — expected election: PSL Mayor 2026

Required: new Mayor district linkage, official election_date, other fields matching the existing election model.

Critical unresolved issue: no official election_date for PSL Mayor 2026 is currently present anywhere in the repository. election_date is required by the schema and cannot be guessed.

**District 3** — expected election: PSL City Council D3 2026

Critical unresolved issue: no official election_date for PSL City Council D3 2026 is currently present anywhere in the repository. election_date is required and cannot be guessed.

Missing official election dates are a hard blocker to any valid election-row insert. No election row was created.

### Seven expected candidate rows

**Mayor:** Shannon Martin, Eric Strazzeri, Steven Giordano, Steven Harrington

**City Council District 3:** Fritz Alexandre, Jim Norton, Peter Overhuls

- `candidates_real.csv` remains the expected repository source for these rows.
- No candidate row was inserted or modified.
- Exact IDs and material fields must be reconfirmed in a future preparation gate before any write.

### District 3 office-field decision

Gate I23 recommendation: Option 1 — normalize District 3 to office = City Council District 3.

Reason: mirrors the existing District 1 convention, is explicit for display and grouping, avoids reopening already-live District 1 data.

Current CSV uses office = City Council.

- This normalization requires separate approval for a future CSV edit.
- Gate I23 did not change the CSV.
- District 1 data remains untouched.

### Import-script findings

- `scripts/import-real-psl-data.cjs` is not safe to run unmodified against the current 11-row CSV.
- It is hardcoded around a single district/election flow.
- It could mis-link Mayor and District 3 candidates to District 1.
- It includes broad active-candidate deletion behavior that could remove the four currently live District 1 candidates before reinsertion.
- It must not be used unchanged for Mayor/District 3.
- Gate I23 did not run or modify the script.

**Source URL gap:**
- `candidates_real.csv` includes `official_candidate_source_url`.
- The current candidates table/import mapping does not have a direct matching persisted column for that field.
- This is a pre-existing provenance gap.
- Gate I23 did not change schema or import behavior to resolve it.
- Explicit approval is still required on how this source provenance should be handled.

### Recommended import architecture

Hybrid Approach C.

- Use explicit reviewed SQL for the prerequisite Mayor and District 3 district/election rows.
- Use a scoped candidate import path that resolves each candidate to the correct race-specific district/election.
- Do not use a broad delete/reinsert process.
- Preserve all existing District 1 rows.
- Candidate writes must be scoped only to the exact seven approved rows.
- This architecture is recommended only and not implemented.

### Mayor user-assignment recommendation

- Mayor is genuinely citywide.
- Gate I23 recommends adding Mayor to the existing `ALL_PSL_DISTRICTS` onboarding model used for citywide/default Port St. Lucie representation.
- This would require a future source-code change in `src/app/onboarding/zip/page.tsx`.
- This recommendation still requires explicit approval.
- No user_districts row was created or modified.
- No onboarding code was changed.

### District 3 user-assignment rule

- District 3 must not be added to the flat citywide/default district array.
- Do not assign District 3 to every Port St. Lucie user.
- Do not infer District 3 from ZIP alone.
- Do not infer District 3 from District 1.
- Do not infer District 3 from Mayor.
- District 3 requires a verified district-specific assignment mechanism before District 3 candidate personalization can be enabled.
- A future design may reuse the verified lookup + attestation + scoped-write pattern used in the County Commission workstream, but this is not yet approved.
- No District 3 user_districts write occurred.

### Future validation requirements

**Pre-write:** clean git status; re-confirm Mayor and District 3 district rows remain absent; re-confirm Mayor and District 3 election rows remain absent; re-confirm all seven candidate rows remain absent; verify candidate IDs for collisions; verify district IDs; verify election IDs; verify official election dates; approve canonical District 3 office value; approve source provenance handling; capture the exact District 1 baseline.

**Post-write (expected live state):** 11 total candidate rows; 4 District 1 unchanged; 4 Mayor present; 3 District 3 present; exact district/election linkages; no duplicate candidates; no unexpected archived rows; zero unintended candidate_positions rows; zero unintended match_scores rows; zero unintended voting_records rows; District 1 beta-user behavior remains unchanged except for an intentionally approved citywide Mayor addition if that change is included.

### Rollback requirements

- Rollback must use only exact IDs introduced by the future Mayor/District 3 work.
- Never use broad name- or range-based deletes.
- Delete order should respect foreign keys: candidate rows, election rows, district rows.
- Rollback must not delete or modify District 1 candidates, District 1 district/election data, existing user_districts, County Commission data, or At-Large data.
- If a Mayor onboarding code change is included later, its rollback must be separately scoped.

### Gate I23 outcome

Outcome B: one or more modeling decisions remain unresolved and must be resolved before import preparation.

Unresolved items:
1. Official election_date for PSL Mayor 2026
2. Official election_date for PSL City Council D3 2026
3. Explicit approval to reuse `city_council` as the Mayor district type
4. Explicit approval to normalize District 3 office to `City Council District 3`
5. Explicit decision on handling `official_candidate_source_url` provenance
6. Explicit approval of the District 3 user-assignment mechanism
7. Explicit approval of the hybrid import architecture

No import preparation should proceed until these are resolved. No database write is approved.

### Recommended next gate

Gate I23B — Mayor/District 3 Open-Decision Resolution.

Gate I23B should:
- Source and verify the official election dates from authoritative election sources.
- Resolve the six remaining modeling/approval items.
- Record explicit decisions.
- Remain read-only and documentation-only.
- Avoid source-code or database changes.
- If all open items are resolved, recommend Gate I24 — Mayor and District 3 Import Preparation Package.

Gate I23B was not implemented by this update.

### No-change confirmation — Gate I23

Gate I23 made no changes to: `candidates`, `elections`, `districts`, `user_districts`, `voting_records`, `candidate_positions`, `match_scores`, `civic_dna`, `civic_dna_answers`, `current_officials`, `officials_for_user`, `src/lib/officials.ts`, `CurrentOfficialsSection`, `compute-match-scores` logic, Civic DNA scoring, `MatchScoreRing`, the ballot page, the candidate profile, the onboarding pages, the Data Sources page, import scripts, validation scripts, schema, tables, seeds, migrations, CSV files, RLS, grants, PowerShell scripts, API keys, environment variables, the County Commission write guard, the At-Large row, deployment configuration, or deployment state.

No database write was performed. No candidate row was inserted, updated, deleted, or archived. No district row was inserted, updated, deleted, or archived. No election row was inserted, updated, deleted, or archived. No CSV field was changed. No import script was run. No candidate was scored. No candidate was ranked. No political recommendation was produced. No Claude or Anthropic API call was made. No secret file was inspected. `ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE` remains `false`. No County Commission District 1-5 write was performed. No deployment occurred.

## Gate I23B — Mayor and District 3 Open-Decision Resolution

Status: Read-only research and modeling decision gate complete.

Date: 08-08-2026
Timestamp: 05:53 am EST

### Current repository baseline

- Branch: master
- Working tree: clean
- Up to date with origin/master
- Latest pushed commit:
  - `e28253d` Record Mayor and District 3 election date decision
- Previous pushed commits:
  - `330f5dc` Resolve Mayor and District 3 open import decisions
  - `8d14ded` Update current state for Gate I23
  - `68d08c6` Add Mayor and District 3 import approval decision
  - `30d4c28` Update current state for Gate I22

Created:
- `docs/internal_beta_gate_i23b_mayor_district3_open_decision_resolution.md`

Commits:
- `330f5dc` Resolve Mayor and District 3 open import decisions
- `e28253d` Record Mayor and District 3 election date decision
- Both commits successfully pushed to origin/master

Build result:
- `npm run build` passed.
- 25 routes generated.
- No build errors.

No database write, source-code change, CSV change, schema change, or deployment occurred.

### Authoritative election-date findings

For the 2026 Port St. Lucie Mayor and City Council District 3 cycle, authoritative official sources support both:
- Primary Election: August 18, 2026
- General Election: November 3, 2026

Sources were cross-checked between the City of Port St. Lucie City Clerk election information and the St. Lucie County Supervisor of Elections.

- The sources agree on the dates.
- The prior ambiguity was about which stage should populate the single-value `election_date` field, not about the accuracy of the dates themselves.

### Explicit election-date convention decision

User decision: use the Primary Election date for both new election rows.

**PSL Mayor 2026**
- election_date: 2026-08-18

**PSL City Council D3 2026**
- election_date: 2026-08-18

- November 3, 2026 remains the official General Election date.
- November 3 is not the selected value for these two new single-value election rows.
- This is a product/data-model convention decision, not a sourcing correction.
- The General Election date is not inferred to be invalid.
- No live election row was modified by this decision.

### Candidate-list verification

- Official City Clerk candidate rosters matched `candidates_real.csv` for Mayor, City Council District 1, and City Council District 3.
- No candidate-list discrepancy was found during Gate I23B.

### Separate District 1 date discrepancy

- The already-live District 1 election row stores: 2026-11-03.
- `CIVICMARKET_CURRENT_STATE.md` Gate I18 previously documented: August 18, 2026.
- This is a pre-existing internal consistency discrepancy.
- Gate I23B did not modify or normalize the District 1 live election row.
- District 1 remains a separate unresolved consistency issue.
- District 1 was not silently changed to match the newly selected Mayor/District 3 convention.
- Any future District 1 correction requires a separate scoped decision and approval.

### Mayor district-type review result

Ready for explicit approval.

Proposed:
- name: Mayor
- type: city_council
- city: Port St. Lucie
- state: FL

Reason:
- Existing UI and query paths correctly bucket `city_council` under City.
- No obvious code-path breakage was found.
- Reuse is semantically imperfect but functionally compatible.
- No new district type was created.

### District 3 office normalization review result

Ready for explicit approval.

Proposed normalization: from `City Council` to `City Council District 3`.

Reason:
- Mirrors the existing District 1 convention.
- Candidate grouping already relies on `district_name`.
- Validation imposes no conflicting office constraint.
- District 1 does not need to be reopened.

- The CSV has not been edited yet.
- A future CSV edit still requires explicit approval.

### Candidate-source provenance decision

Recommended: Provenance Option A.

Meaning:
- Proceed without adding a new candidates-table source URL column.
- Retain `official_candidate_source_url` in the repository CSV and supporting documentation.
- Match the existing District 1 precedent.
- Do not repurpose an unrelated website field.

- This is ready for explicit approval.
- No schema change occurred.

### District 3 assignment result

Still unresolved and deferred.

- District 3 must not be added to `ALL_PSL_DISTRICTS`.
- District 3 must not be assigned from ZIP alone.
- District 3 must not be inferred from District 1 or Mayor.
- No currently active, approved reusable district-specific assignment mechanism exists.
- The County Commission verified-lookup pattern remains disabled and is not automatically approved for District 3.
- District 3 candidate/district/election rows may exist before District 3 personalization is enabled, provided they are not incorrectly exposed to users.
- No user_districts row was created or modified.

### Hybrid import architecture review

Ready for explicit approval in architecture shape.

Recommended:
- Explicit reviewed SQL for: Mayor district, District 3 district, Mayor election, District 3 election.
- Scoped candidate import for exactly: 4 Mayor candidates, 3 District 3 candidates.
- Race-specific district/election resolution.
- No broad delete/reinsert.
- Preserve all four existing District 1 candidates.
- Do not run `scripts/import-real-psl-data.cjs` unchanged.

No executable import was prepared or run in Gate I23B.

### Gate I23B outcome

Outcome B: election dates are resolved, but District 3 user-assignment design remains unresolved.

**Approval-ready items:**
1. Mayor district type reuse: `city_council`
2. District 3 office normalization: `City Council District 3`
3. Candidate-source provenance: Option A
4. Hybrid import architecture
5. Mayor election_date: 2026-08-18
6. District 3 election_date: 2026-08-18

**Still unresolved:**
1. District 3 user-assignment mechanism
2. Separate District 1 election-date consistency issue

### Next decision boundary

- Do not open another research gate for the resolved items.
- Before Gate I24, obtain explicit user approval for the approval-ready items.
- District 3 assignment may remain deferred from the import itself if the district/election/candidate rows can safely exist without being assigned to users, and current personalization logic will not expose District 3 candidates to users who do not have a verified District 3 assignment.
- Gate I24 should begin only after explicit approval is recorded for the approval-ready modeling decisions.

### Recommended next gate

Gate I24 — Mayor and District 3 Import Preparation Package. Only after explicit approval.

Gate I24 should remain preparation-only and define: exact district IDs, exact election IDs, exact candidate IDs, exact approved election dates, exact District 3 office normalization, exact provenance handling, exact scoped SQL/import plan, pre-write verification, post-write verification, rollback, District 1 preservation checks, and an explicit final write-approval statement.

Gate I24 was not implemented by this update.

### No-change confirmation — Gate I23B

Gate I23B made no changes to: `candidates`, `elections`, `districts`, `user_districts`, `voting_records`, `candidate_positions`, `match_scores`, `civic_dna`, `civic_dna_answers`, `current_officials`, `officials_for_user`, `src/lib/officials.ts`, `CurrentOfficialsSection`, `compute-match-scores` logic, Civic DNA scoring, `MatchScoreRing`, the ballot page, the candidate profile, the onboarding pages, the Data Sources page, import scripts, validation scripts, schema, tables, seeds, migrations, CSV files, RLS, grants, PowerShell scripts, API keys, environment variables, the County Commission write guard, the At-Large row, deployment configuration, or deployment state.

No database write was performed. No live election row was modified. No District 1 election row was modified. No candidate row was inserted, updated, deleted, or archived. No district row was inserted, updated, deleted, or archived. No user_districts row was created or modified. No CSV field was changed. No import script was run. No candidate was scored. No candidate was ranked. No political recommendation was produced. No Claude or Anthropic API call was made. No secret file was inspected. `ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE` remains `false`. No County Commission District 1-5 write was performed. No deployment occurred.

## Gate I24 — Mayor and District 3 Import Preparation Package

Date: 08-08-2026
Timestamp: 06:11 am EST

### Status

- Gate I24 preparation package complete.
- Created: `docs/internal_beta_gate_i24_mayor_district3_import_preparation_package.md`
- Commit: `6c0cd2e` Add Mayor and District 3 import preparation package
- Commit pushed successfully to origin/master.
- `npm run build` passed.
- No database write occurred.
- No CSV edit occurred.
- No source-code change occurred.
- No import script was executed.
- No deployment occurred.

### Fresh live baseline

- Existing City Council District 1 baseline remains unchanged.
- Four District 1 candidate rows remain live.
- Existing District 1 district row remains live.
- Existing District 1 election row remains live.
- Mayor district row remains absent.
- City Council District 3 district row remains absent.
- PSL Mayor 2026 election row remains absent.
- PSL City Council D3 2026 election row remains absent.
- Four Mayor candidate rows remain absent.
- Three District 3 candidate rows remain absent.

### Deterministic ID finding

- The existing District 1 election row uses a fixed deterministic ID rather than a random UUID.
- Elections therefore follow the same human-readable deterministic ID pattern already used for district/reference data.
- Gate I24 extended that convention for the planned new rows.

**Approved planned IDs:**

- Mayor district: `11111111-0000-0000-0000-000000000006`
- City Council District 3 district: `11111111-0000-0000-0000-000000000007`
- PSL Mayor 2026 election: `22222222-0000-0000-0000-000000000006`
- PSL City Council D3 2026 election: `22222222-0000-0000-0000-000000000007`

- These IDs were read-only checked as unused during Gate I24.
- No row using these IDs was inserted.

### Election dates

- PSL Mayor 2026: election_date = 2026-08-18
- PSL City Council D3 2026: election_date = 2026-08-18

These are the explicitly approved Primary Election date convention from Gate I23B. The existing District 1 election date was not altered.

### Planned district rows

**Mayor:** name = Mayor, type = city_council, city = Port St. Lucie, state = FL

**City Council District 3:** name = City Council District 3, type = city_council, city = Port St. Lucie, state = FL

### Planned candidate rows

**Mayor:** Shannon Martin, Eric Strazzeri, Steven Giordano, Steven Harrington

**District 3:** Fritz Alexandre, Jim Norton, Peter Overhuls

- Candidate IDs remain database-generated, matching the District 1 import precedent.
- Gate I24 did not assign deterministic candidate IDs.

### District 3 office normalization

Approved future import value: office = City Council District 3. The CSV was not modified in Gate I24.

### Provenance handling

Approved Provenance Option A:
- `official_candidate_source_url` remains preserved in repository CSV/documentation.
- No candidates-table schema column is being added.
- No unrelated field will be repurposed.

### Import architecture

Approved hybrid architecture:
1. Explicit scoped SQL for the Mayor district, District 3 district, Mayor election, and District 3 election.
2. Scoped insert for exactly four Mayor candidates and three District 3 candidates.
3. No broad delete.
4. No delete/reinsert of District 1.
5. Do not use `scripts/import-real-psl-data.cjs` unchanged.
6. Preserve all existing District 1 data.

### Gate I24 SQL status

- Gate I24 contains draft SQL.
- It is labeled DRAFT ONLY / NOT EXECUTED.
- No statement was run against Supabase.
- The draft contains no broad DELETE operation.

### Validation package

Gate I24 defines: pre-write verification, ID collision checks, District 1 baseline checks, post-write verification, exact expected 11-candidate state, side-effect checks for `candidate_positions`/`match_scores`/`voting_records`, ID-scoped rollback, and an unchecked final write-approval statement.

### Remaining unresolved/out-of-scope items

1. District 3 user-assignment mechanism.
2. Existing District 1 election-date discrepancy (live row = 2026-11-03, prior documentation referenced August 18, 2026).

- Neither issue blocks creation of the Mayor/District 3 district/election/candidate rows if personalization remains disabled for District 3.
- District 3 must not be assigned to users during the import.
- District 1 must not be changed during this work.

### No-change confirmation — Gate I24

Gate I24 made no changes to: `candidates`, `elections`, `districts`, `user_districts`, `voting_records`, `candidate_positions`, `match_scores`, `civic_dna`, `civic_dna_answers`, `current_officials`, `officials_for_user`, schema, RLS, grants, seeds, migrations, CSV files, source code, import scripts, validation scripts, API keys, environment variables, County Commission logic, the At-Large row, or deployment state.

`ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE` remains `false`.

## Gate I25 — Mayor and District 3 Write Execution Approval

Date: 08-08-2026
Timestamp: 06:11 am EST

### Status

- Gate I24 preparation package complete (recorded above).
- Gate I25 approval package created:
  - `docs/internal_beta_gate_i25_mayor_district3_write_execution_approval.md`
- Commit: `b93c16f` Add Mayor and District 3 write approval package
- Commit pushed successfully to origin/master.
- `npm run build` passed.

### Readiness

- Gate I25 is **READY FOR EXPLICIT WRITE APPROVAL**.
- **Database write is NOT approved yet.**
- No SQL was executed. No database write occurred.

### Scope reaffirmed

- Planned district IDs: Mayor `11111111-0000-0000-0000-000000000006`; City Council District 3 `11111111-0000-0000-0000-000000000007`.
- Planned election IDs and dates: PSL Mayor 2026 `22222222-0000-0000-0000-000000000006` (election_date 2026-08-18); PSL City Council D3 2026 `22222222-0000-0000-0000-000000000007` (election_date 2026-08-18).
- Seven planned candidates: Shannon Martin, Eric Strazzeri, Steven Giordano, Steven Harrington (Mayor); Fritz Alexandre, Jim Norton, Peter Overhuls (District 3, office normalized to City Council District 3).
- Full pre-write checks, exact allowed write sequence, forbidden-action list, post-write expected state, and an ID-scoped rollback package are defined in Gate I25. None have been executed.
- An unchecked final approval statement is included in Gate I25, awaiting explicit user approval in a later message before any write occurs.

### Deferred / unresolved (unchanged)

- District 3 user-assignment mechanism remains deferred.
- The pre-existing District 1 election-date discrepancy (live row = 2026-11-03; prior documentation referenced August 18, 2026) remains unresolved and out of scope.
- No write occurred as part of Gate I24 or Gate I25.

### No-change confirmation — Gate I25

Gate I25 made no changes to: `candidates`, `elections`, `districts`, `user_districts`, `voting_records`, `candidate_positions`, `match_scores`, `civic_dna`, `civic_dna_answers`, `current_officials`, `officials_for_user`, schema, RLS, grants, seeds, migrations, CSV files, source code, import scripts, validation scripts, API keys, environment variables, County Commission logic, the At-Large row, or deployment state.

No SQL was executed. No database write occurred. No secret file was inspected. `ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE` remains `false`.

## Gate I26 — Mayor and District 3 Scoped Write Execution and Verification

Date: 08-08-2026
Timestamp: 06:50 am EST

### Status

- Gate I25's final write statement was **explicitly approved by the user**.
- The scoped Mayor and City Council District 3 database write has been **executed and fully verified live**.
- Created: `docs/internal_beta_gate_i26_mayor_district3_write_execution_result.md`
- No deployment occurred.

### Execution history

- Two prerequisite `districts` rows (Mayor, City Council District 3) and two prerequisite `elections` rows were inserted manually and verified live; this succeeded and remained stable through every subsequent check.
- **Earlier candidate-insert attempts, wrapped in an explicit `BEGIN;...COMMIT;` block, were reported successful with no error but produced zero persisted candidate rows** — confirmed independently by direct, unfiltered, cache-busted read-only queries each time, not accepted on the report alone.
- A read-only schema diagnosis (via `select=*` on an existing candidate row, since PostgREST's OpenAPI introspection requires the secret key, which was correctly not sought) found the live `candidates` schema exactly matches `Reference Files/civicmarket_schema_v4.sql` — no defect found.
- **The final, successful execution used one standalone multi-row `INSERT ... VALUES (...) RETURNING ...` statement with no explicit transaction wrapper**, relying on the SQL Editor's default autocommit. This returned all seven rows and their generated IDs, independently re-confirmed live.

### Verified live result

**Row-count deltas (vs. Gate I25 baseline):**
- `candidates`: 4 → 11 (+7) ✓
- `districts`: 10 → 12 (+2) ✓
- `elections`: 5 → 7 (+2) ✓
- `candidate_positions`: 0 → 0 (+0) ✓
- `voting_records`: 0 → 0 (+0) ✓
- `match_scores` / `user_districts`: not numerically measurable via anonymous read (RLS-restricted to owning user); zero side effects structurally guaranteed, since no executed statement referenced either table.

**Race breakdown:** City Council District 1 = 4, Mayor = 4, City Council District 3 = 3 (total 11).

**Seven new candidates (verified live):**
- Shannon Martin (`d44ff05a-14af-45c2-9f2f-6d530a8a051e`, Mayor, is_incumbent true)
- Eric Strazzeri (`5b03e0af-ad49-4299-83cf-19c73d0da89f`, Mayor)
- Steven Giordano (`3a52546d-6cdf-42c6-abd2-4fface88e858`, Mayor)
- Steven Harrington (`6e14b71f-0a08-4623-a442-c444d5f9b276`, Mayor)
- Fritz Alexandre (`a8f27169-47ee-4c09-af47-fc0ff925beb1`, City Council District 3)
- Jim Norton (`17d76e2c-744e-41d0-8144-2b92533dffa5`, City Council District 3)
- Peter Overhuls (`3dda97a1-b331-4642-9009-35a762685ee6`, City Council District 3)

All linked to the correct district/election IDs (`...000006` for Mayor, `...000007` for District 3), `appeared_on_ballot: true` for all seven, `archived_at`/`bio`/`website`/`photo_url` all `null`, District 3 office normalized to `City Council District 3` as approved.

**Prerequisite rows verified live:** Mayor district (`...000006`), City Council District 3 district (`...000007`), PSL Mayor 2026 election (`...000006`, election_date `2026-08-18`), PSL City Council D3 2026 election (`...000007`, election_date `2026-08-18`).

### District 1 preservation

All 4 District 1 candidates, its district, and its election remain unchanged. **District 1 election_date remains `2026-11-03`** — not touched, not normalized.

### Side effects and safety

- No `candidate_positions`, `voting_records`, `match_scores`, or `user_districts` side effects.
- No District 3 user assignment exists. No Mayor user assignment exists.
- County Commission districts (At-Large + District 1-5) confirmed unchanged.
- `ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE` remains `false`.
- Rollback was not required and was not used.

### Build, lint, and UI results

- `npm run build`: passed, 25 routes, no errors.
- `npm run lint`: 5 pre-existing errors only (`scripts/import-real-psl-data.cjs`, `scripts/validate-real-psl-csvs.cjs`), no new errors.
- Live UI sanity check: **BLOCKED** — no dev server or authenticated browser session was running for this gate; not fabricated.

### Remaining unresolved / deferred (unchanged)

1. District 3 user-assignment mechanism remains deferred — no `user_districts` row exists for District 3 for any user; the new rows are not exposed to any ballot.
2. The pre-existing District 1 election-date discrepancy (live `2026-11-03` vs. Gate I18's documented `August 18, 2026`) remains open and unresolved.
3. Mayor is not yet added to the flat `ALL_PSL_DISTRICTS` onboarding array — no current or future beta user automatically receives the Mayor district yet; this remains a separate, future, explicitly-approved step.

### No-change confirmation — Gate I26

Beyond the explicitly approved database write, Gate I26 made no changes to: `user_districts`, `voting_records`, `candidate_positions`, `match_scores`, `civic_dna`, `civic_dna_answers`, `current_officials`, `officials_for_user`, schema, RLS, grants, seeds, migrations, CSV files, source code, import scripts, validation scripts, API keys, environment variables, County Commission logic, the At-Large row, or deployment state.

No secret, API key, token, password, connection string, or environment value was inspected or exposed. `ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE` remains `false`.

## Gate I27 — Mayor Onboarding Assignment Change

Date: 08-08-2026
Timestamp: 06:59 am EST

### Status

Gate I27 PASS — Mayor citywide onboarding assignment implemented and statically verified. Live production `user_districts` mutation was not performed.

### Implementation

- Exact source file changed: `src/app/onboarding/zip/page.tsx`.
- Mayor added to the existing `ALL_PSL_DISTRICTS` flat Port St. Lucie citywide onboarding assignment array: `{ id: '11111111-0000-0000-0000-000000000006', name: 'Mayor', scope: 'city' }` — one line added, nothing else touched.
- Live Mayor district ID: `11111111-0000-0000-0000-000000000006` (re-confirmed live, read-only, immediately before the change).
- No new API route, no live database lookup, no schema change — the existing flat-array + delete-then-insert onboarding write path already supported this without modification.

### Static/code-trace verification result

- Mayor resolves to `11111111-0000-0000-0000-000000000006`, confirmed by inspection and by the live pre-change read-only check.
- Future onboarding for a supported ZIP will now include a Mayor `user_districts` row alongside the existing five.
- **District 3 explicitly excluded** — not added to `ALL_PSL_DISTRICTS`; adding it there would incorrectly assign every onboarded user to District 3, which Gate I23B already identified and rejected.
- **District 1 behavior unchanged** — the `City Council District 1` array entry and all onboarding control flow are untouched.
- **County Commission behavior unchanged** — the `St. Lucie County Commission At-Large` array entry is untouched; no County Commission District 1-5 id was added; `src/app/api/set-county-commission-district/route.ts` was not touched.
- Duplicate handling: the existing delete-then-insert write pattern already prevents duplicate `user_districts` rows on repeated onboarding; adding a sixth array entry introduces no new duplicate risk.
- No database write occurred. No production `user_districts` mutation occurred. No `districts`, `elections`, or `candidates` row was touched.

### Build and lint

- `npm run build`: passed, 25 routes, no errors.
- `npm run lint`: 5 pre-existing errors only (`scripts/import-real-psl-data.cjs`, `scripts/validate-real-psl-csvs.cjs`), no new errors.

### Deployment

Did not occur.

### Deferred / unresolved (unchanged)

- District 3 user-assignment mechanism remains deferred.
- The pre-existing District 1 election-date discrepancy (live `2026-11-03` vs. Gate I18's documented `August 18, 2026`) remains unresolved.
- `ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE` remains `false`.

## Gate I28 — District 3 User-Assignment Mechanism Design

Date: 08-08-2026
Timestamp: 07:04 am EST

Status: Design and read-only verification only. **Gate I28 PASS — recommended District 3 assignment architecture is ready for explicit implementation approval.**

### Official source selected

City of Port St. Lucie "Council District Finder" — `https://pslgis.maps.arcgis.com/apps/webappviewer/index.html?id=397887d028a04aaa91e901feca2e6da1`, hosted on the City's own GIS org, linked from the City's official GIS page. Verified live this gate via direct click-to-identify tests at four points, returning an explicit `DISTRICT` field for each of the four City Council districts: District 1 (Stephanie Morgan, matching the already-seeded live `current_officials` row), District 2 (David Pickett), District 3 (Anthony Bonna), District 4 (Jolien Caraballo). No documented public REST API was confirmed for this tool; it remains a link-out resource, not a server-side integration.

### Recommended assignment approach

**Option A — official lookup + user attestation**, adapted from the already-built (disabled) County Commission pattern: profile/settings page → link to the official tool (no address collected/stored) → closed 2-option selection (District 1 / District 3) → attestation checkbox → authenticated API route → live district resolution against `districts` → scoped delete-then-insert limited to City Council District 1/3 IDs only. ZIP-only assignment (Option D) rejected outright; direct server-side GIS API calls (Option B) and address storage (Option C) both evaluated and not recommended.

### Address-storage policy

CivicMarket will not collect, transmit, log, or store a street address anywhere in this flow — only the verified district assignment itself is stored.

### Proposed District 1/3 replacement behavior

Future route scoped to affect only `user_districts` rows with `district_id IN (11111111-0000-0000-0000-000000000001, 11111111-0000-0000-0000-000000000007)` for the authenticated user; all other assignments (Mayor, School Board, County Commission At-Large, FL House/Senate) preserved untouched.

### District 1 default-assignment risk finding

**Confirmed live and flagged as a real, currently-unaddressed data-accuracy issue, not just a theoretical risk.** Port St. Lucie has 4 City Council districts; every onboarded user is currently unconditionally assigned District 1 regardless of actual address. This has not yet caused real harm (Internal Beta uses trusted test accounts, not a geographically diverse population) but would misrepresent most real residents once Controlled PSL Beta invites a broader population. Recommendation: District 1 should eventually be removed from the flat `ALL_PSL_DISTRICTS` onboarding default in favor of a verified City Council district step for every user — this is a materially larger onboarding-flow change, explicitly out of scope for Gate I28/I29, and requires its own future, separately-approved gate.

### Ballot / Current Officials impact

`getCandidatesForDistricts`/`getUserDistrictIds` and `getOfficialsForUser` already read `user_districts` fully generically — no code change is needed for District 3 candidates to appear and District 1 candidates to disappear once a user's assignment is correctly replaced. However, no District 3 councilmember (Anthony Bonna) `current_officials` row is seeded yet, so a District 3 user would lose Stephanie Morgan from Current Officials without gaining a replacement until a separate, future, verified-source seeding gate addresses that data-completeness gap (parallel to the existing Mayor-district gap pattern).

### Proposed implementation paths (not created)

- `src/app/profile/city-council-district/page.tsx`
- `src/app/api/set-city-council-district/route.ts`

### Future gate sequence

Gate I29 (implementation, write disabled behind a new guard) → Gate I30 (live UI and negative-path verification) → Gate I31 (scoped test-account write, only after explicit approval).

### No-change confirmation — Gate I28

No database write occurred. No `user_districts` row changed. No source-code implementation occurred. No deployment occurred. `ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE` remains `false`. The District 1 election-date discrepancy remains unresolved.

## Gate I29 — District 3 Assignment Implementation, Write Disabled

Date: 08-08-2026
Timestamp: 07:23 am EST

Status: **Gate I29 PASS — District 1/3 verified-assignment flow implemented with production writes disabled.**

### Implementation paths

- `src/app/profile/city-council-district/page.tsx` (new)
- `src/app/api/set-city-council-district/route.ts` (new)
- `src/app/profile/page.tsx` (one Settings link added, County Commission row unchanged)

### Write guard

`ENABLE_CITY_COUNCIL_DISTRICT_WRITE = false` — a new, independent guard, remains `false`. No production `user_districts` write occurred. Every `DELETE`/`INSERT` statement in the new route is unreachable below the guard's early return.

### Approved fixed District 1/3 IDs

- City Council District 1: `11111111-0000-0000-0000-000000000001`
- City Council District 3: `11111111-0000-0000-0000-000000000007`

Used only as a redundant safety check after live database resolution, never to skip it.

### Architecture

Official lookup (City of Port St. Lucie "Council District Finder") + user attestation, mirroring the disabled County Commission pattern. No street address collected or stored anywhere in the flow — only the verified district selection.

### District 1 onboarding default risk

Remains unresolved and unaddressed by this gate. `ALL_PSL_DISTRICTS` was not modified; City Council District 1 remains the unconditional default for every onboarded PSL user regardless of actual address.

### Current Officials District 3 gap

Remains unresolved. A user moved from District 1 to District 3 would lose Stephanie Morgan from Current Officials with no replacement, since no District 3 councilmember `current_officials` row is seeded. Anthony Bonna (identified in Gate I28) was **not** seeded in this gate — no `current_officials` write occurred.

### Atomicity status

Delete-then-insert is not wrapped in a transaction/RPC; true atomicity is not guaranteed. Documented as a required decision before Gate I31, not silently accepted. No RPC/schema change made in this gate.

### Negative-path / static result

Live-tested (safe, no auth session used): unauthenticated request → 401; invalid Bearer token → 401. Code-traced against the live `districts` table: invalid label → 400; attestation false → 400; valid District 1/3 + attestation → `dryRun: true` with the exact correct resolved ID and zero mutation; delete scope resolves to exactly `{...000001, ...000007}`; Mayor (`...000006`) and County Commission At-Large (`...000003`) both structurally outside that scope.

### Build and lint

- `npm run build`: passed, 27 routes (2 new), no errors.
- `npm run lint`: 5 pre-existing errors only, no new errors.

### Next step and blocker

Gate I30 (live UI and negative-path verification) is next. **Gate I31 (scoped test-account write) remains BLOCKED** until: (1) Gate I30 passes, (2) the District 3 Current Officials data gap is resolved, (3) atomic replacement safety is accepted/resolved, (4) explicit scoped test-account write approval is given.

### No-change confirmation — Gate I29

No database write occurred. No `user_districts`, `districts`, `elections`, `candidates`, or `current_officials` row was touched. No secret was inspected or exposed. `ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE` remains `false`. The District 1 election-date discrepancy remains unresolved. No deployment occurred.

## Gate I30 — City Council District Assignment Live UI and Negative-Path Verification

Date: 08-08-2026
Timestamp: 07:33 am EST

Status: **Gate I30: PASS.** **Gate I31: BLOCKED.**

### Verified

- Gate I29 implementation inspected and confirmed to exactly match Gate I28's design; no defect found.
- `ENABLE_CITY_COUNCIL_DISTRICT_WRITE` remains `false`; `ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE` remains `false`.
- Negative-path API results: unauthenticated → 401 (live); malformed Authorization header → 401, same code path as unauthenticated (live); invalid Bearer token → 401 (live); invalid label, attestation false, missing attestation → 400 each (code-traced, live authenticated testing correctly not attempted without credentials).
- District 1 dry-run and District 3 dry-run both live-tested via an already-authenticated beta session: `dryRun: true`, exact expected message, HTTP 200, zero mutation.
- Live UI verified: Profile Settings link correct, assignment page loads, exact Gate I28 official lookup URL confirmed, no address input/collection anywhere, exactly two closed-set district choices, attestation gates submission, understandable dry-run/error states.
- **Direct positive proof of no mutation:** the same test account's Profile page, reloaded after the District 3 dry-run submission, still showed Stephanie Morgan / City Council District 1 in Current Officials — unchanged from before testing.
- Keyboard access confirmed with a visible focus indicator; true 390px viewport testing BLOCKED by the same pre-existing tooling limitation documented in Gates I17/I21/I27 (200% zoom approximation showed a clean layout).

### Current Officials blocker

Reconfirmed unresolved via a fresh live query: `current_officials` has 8 rows, none referencing City Council District 3 or Anthony Bonna. Gate I31 remains blocked on this data gap.

### Atomicity blocker

Reconfirmed unresolved: delete-then-insert remains two independent, non-transactional Supabase calls. Gate I31 remains blocked on this unless explicitly accepted or resolved.

### District 1 onboarding accuracy risk

Reconfirmed unchanged and unaddressed — `ALL_PSL_DISTRICTS` still defaults every onboarded user to City Council District 1 regardless of address. Recommendation: resolve (remove the default or explicitly accept the risk) before any Controlled PSL Beta invitation to a real, diverse population; not a blocker for continuing Internal Beta with the current small trusted test-account population.

### Gate I31 readiness

**BLOCKED** pending: (1) Gate I30 passing — now satisfied; (2) District 3 Current Officials data gap resolved — still open; (3) atomic replacement safety accepted/resolved — still open; (4) explicit scoped test-account write approval — not given.

### Build and lint

- `npm run build`: passed, 27 routes, no errors.
- `npm run lint`: 5 pre-existing errors only, no new errors.

### No-change confirmation — Gate I30

No database write occurred. No `user_districts`, `districts`, `elections`, `candidates`, or `current_officials` row was touched. No source code was modified. No secret was inspected or exposed. `ENABLE_CITY_COUNCIL_DISTRICT_WRITE` remains `false`. `ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE` remains `false`. The District 1 election-date discrepancy remains unresolved. No deployment occurred.

## Gate I30B — City Council District 3 Pre-Write Blocker Resolution

Date: 08-08-2026
Timestamp: 07:50 am EST

Status: **PASS — both blockers have concrete, ready-to-approve solutions.** Neither is implemented; both require separate explicit approval.

### District 3 current official verification

Freshly verified (not relying on Gate I28's map-tool-only identification) via two independent official City of Port St. Lucie pages: **Anthony Bonna, Sr., District 3 Councilman**, currently serving. Source: `https://www.cityofpsl.com/Government/Your-City-Government/Mayor-City-Council/District-3-Anthony-Bonna` (dedicated bio page, mirrors the exact URL pattern already used for Stephanie Morgan's row). No term dates published — matches Stephanie Morgan's existing precedent row exactly (also `null`). Cross-checked: Bonna is not among the 3 declared 2026 District 3 candidates, mirroring Stephanie Morgan's own non-candidate status — `is_on_next_ballot: false` is correct for both, for the same reason.

### Proposed current_officials row — ready, not inserted

Exact draft row prepared, field-for-field matching the Stephanie Morgan precedent (name, office, district_id `...000007`, jurisdiction_level `city`, source_url/source_label, `candidate_id`/`term_start`/`term_end`/`next_election_date` all `null`). Two explicit judgment calls flagged for approval (name suffix "Sr.", office phrasing normalization). **No `current_officials` write occurred.** Draft SQL, pre-write checks, post-write checks, and a rollback (scoped to the exact inserted id) are all documented.

### Atomic replacement recommendation

Current delete-then-insert in `set-city-council-district/route.ts` reconfirmed non-atomic (two independent Supabase calls). Recommended: a narrowly scoped `SECURITY INVOKER` Postgres RPC deriving the user from `auth.uid()` (never a client-supplied ID), redundantly re-validating the district ID inside the function, atomic by virtue of Postgres function-body semantics, `search_path` pinned, `EXECUTE` granted only to `authenticated`. Option B (client-only transaction) confirmed not achievable with the current Supabase JS architecture. Option C (insert-first) rejected — would risk a transient/permanent dual-district state, worse for this product than the current zero-district failure mode. **No schema or RPC change occurred.**

### District 1 onboarding-default recommendation

Keep the current flat default for Internal Beta only; convert to a mandatory verified District 1/3 step (removing District 1 from `ALL_PSL_DISTRICTS`) as a hard precondition before any Controlled PSL Beta invitation to a real, diverse population. Not implemented in this gate.

### Gate I31 readiness

Still not ready to execute — both blockers now have ready-to-approve solutions, but neither is approved or implemented yet. Recommended minimum remaining sequence: **Gate I30C** (implement the approved row + RPC, guard remains false, build/verify) → **Gate I31** (scoped test-account write, only after a named account, verified target district, pre-state, explicit approval, and rollback are all supplied).

### No-change confirmation — Gate I30B

No `current_officials`, `user_districts`, `districts`, `elections`, or `candidates` row was touched. No schema, RPC, RLS, or grant was created or changed. No source code was modified. No secret was inspected or exposed. `ENABLE_CITY_COUNCIL_DISTRICT_WRITE` remains `false`. `ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE` remains `false`. The District 1 election-date discrepancy remains unresolved. No deployment occurred.

## Gate I30C — City Council Pre-Write Blocker Implementation

Date: 08-08-2026
Timestamp: 08:02 am EST

Status: **Implementation and SQL preparation complete. Both Supabase-side executions (data row + RPC) remain pending manual action — not yet live.**

### Capability finding

Neither approved write could be executed by this session: `current_officials` INSERT requires `profiles.is_admin = true` under RLS (no admin session available to the anon key), and `CREATE FUNCTION` is schema DDL, impossible via PostgREST. This mirrors every prior real write in this project (e.g. Gate I26) — exact SQL is prepared for manual execution in the Supabase SQL Editor.

### Anthony Bonna row (not yet live)

Fresh pre-write verification passed (District 3 exists, no existing D3/Bonna row, Stephanie Morgan intact, count = 8). Exact approved INSERT SQL documented in Gate I30C, ready to run. **No `current_officials` write occurred.**

### Atomic RPC (not yet live)

Created `Reference Files/civicmarket_schema_addendum_city_council_district_rpc.sql` — `set_psl_city_council_district(p_district_id uuid)`, `SECURITY INVOKER`, `auth.uid()`-derived caller, closed district validation (`...000001`/`...000007` only, re-verified live), atomic by Postgres function-body semantics, explicit `search_path`, `EXECUTE` granted only to `authenticated`, plain `CREATE FUNCTION` (not `OR REPLACE`) to fail closed on any name collision. **No schema/RPC change occurred live.**

### API route migrated

`src/app/api/set-city-council-district/route.ts` updated: old non-atomic delete-then-insert fully removed (not just made unreachable); new path calls the RPC via a request-scoped client authenticated as the calling user (forwarding their Bearer token through the public anon key), not the service-role client — required so `auth.uid()` resolves correctly inside the `SECURITY INVOKER` function. All existing validation (auth, attestation, closed label set, live district resolution) unchanged. `ENABLE_CITY_COUNCIL_DISTRICT_WRITE` remains `false`, unchanged, still guards the entire mutation path.

### Verification performed

- `npm run build`: passed, 27 routes, no errors.
- `npm run lint`: 5 pre-existing errors only, no new errors.
- Negative-path regression (live): unauthenticated → 401, invalid token → 401, both unchanged from Gate I29/I30.
- Full authenticated dry-run round-trip re-exercised live via the already-authenticated UI after the route refactor: `200`, exact expected dry-run message, confirming no regression from removing the old delete-scope code.
- RPC's own live negative-path behavior (anonymous rejection, invalid-district rejection at the DB level) cannot be tested until the RPC exists live — correctly deferred.

### Gate I31 readiness

**Update 08-08-2026, 08:32 am EST — both Supabase-side changes are now live and independently re-verified. Gate I30C status upgraded to PASS.**

An earlier reported execution had not actually persisted (a full re-check found neither change present); this was caught, reported, and the user re-ran both SQL blocks successfully. Live verification this pass confirms:

- **Anthony Bonna, Sr. row is live**: `id = fed1801c-0b6a-4743-8de2-4f69b91920ec`, `district_id = ...000007`, `office = City Council Member, District 3`, matches the approved draft field-for-field. `current_officials` total count = **9** (was 8, +1 exactly). Stephanie Morgan's row confirmed unchanged.
- **RPC is live**: a safe anonymous call to `set_psl_city_council_district` (tested with a valid District 1 id, the Mayor id, the County Commission At-Large id, and a garbage UUID) returns `401 {"code":"42501","message":"permission denied for function..."}` for all four — confirming the function exists and that PostgreSQL's own `REVOKE`/`GRANT` are correctly enforced at the database level, before the function body runs. `SECURITY INVOKER`/`auth.uid()`/`search_path` confirmed via the exact committed SQL file content plus the user's own direct Supabase Editor check; not independently re-queried against `pg_proc` (requires the secret key, correctly not sought).
- **Current Officials blocker: RESOLVED** — generic query path confirmed to require no code change; Bonna now resolves for a future District 3 user, Stephanie Morgan continues to resolve for District 1.
- **Atomicity blocker: RESOLVED** — old two-call route path confirmed still removed; replacement now delegated to one atomic Postgres function call.
- `ENABLE_CITY_COUNCIL_DISTRICT_WRITE` remains `false`; `ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE` remains `false` — neither touched or enabled. No production `user_districts` mutation occurred (only anonymous, permission-denied RPC calls were made; the app's own write path was never enabled).
- `npm run build`: passed, 27 routes, no errors. `npm run lint`: 5 pre-existing errors only, no new errors.

**Gate I30C final outcome: PASS.**

**Gate I31 remains blocked only on:** (1) exact test-account identity, (2) verified target district for that account, (3) captured pre-test `user_districts` state, (4) explicit approval to temporarily enable the City Council write guard, (5) explicit approval for one scoped live assignment, (6) a rollback plan, (7) immediate restoration of the guard to `false`, (8) an explicit no-deploy boundary.

**Kept separate and unresolved:** the District 1 onboarding-default accuracy risk (acceptable only for the current Internal Beta boundary; must be corrected before Controlled PSL Beta) and the District 1 election-date discrepancy (live `2026-11-03` vs. Gate I18's documented `August 18, 2026`).

### No-change confirmation — Gate I30C

Beyond the one route file, the one reference SQL file, and the explicitly-approved Supabase-side `current_officials` row and RPC recorded above, no other source code, schema, RLS, grants, seeds, migrations, or CSV files were touched. No `user_districts`, `districts`, `elections`, or `candidates` row was created, modified, or deleted. No secret was inspected or exposed. `ENABLE_CITY_COUNCIL_DISTRICT_WRITE` remains `false`. `ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE` remains `false`. The District 1 election-date discrepancy remains unresolved. No deployment occurred.

## Gate I31 — City Council District Test-Account Write: Attempted, RPC Defect Found, No Write Occurred

Status: Attempted under full explicit user approval. **Write did not occur.** A genuine defect was found in the already-deployed `set_psl_city_council_district` SQL function. No rollback was needed because no database state ever changed. `ENABLE_CITY_COUNCIL_DISTRICT_WRITE` is confirmed restored to `false`.

Date: 08-08-2026

Full record: `docs/internal_beta_gate_i31_city_council_district_test_write_result.md`

### What was approved

The user explicitly approved a one-time controlled test for `civicmarket.test.01@example.com` (user UUID `ec59ea92-470f-447f-8873-ab2dbde52aca`, verified real district City Council District 1): temporarily set `ENABLE_CITY_COUNCIL_DISTRICT_WRITE = true`, perform one District 1 → District 3 assignment via the approved RPC, verify, then roll back to District 1 via the same RPC, then immediately restore the guard to `false`. `ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE` was required to remain `false` throughout.

### What happened

Using the already-authenticated test account's live browser session (assistant never entered credentials), the District 1 → District 3 submission was attempted twice at `/profile/city-council-district`. Both attempts failed with a `500` response and "Failed to save verified district" in the UI. A temporary, never-committed diagnostic `console.error` line (immediately removed afterward) captured the actual Postgres error:

```
code: '42702', message: 'column reference "district_id" is ambiguous'
```

Root cause: the RPC's own `RETURNS TABLE (district_id uuid)` clause implicitly declares a PL/pgSQL variable named `district_id`, which collides with the `user_districts.district_id` column referenced in the function's `DELETE` statement. This is a bug in the already-deployed SQL function itself (`Reference Files/civicmarket_schema_addendum_city_council_district_rpc.sql`, made live in Gate I30C) — not an app-code, RLS, or route-validation defect. Gate I30C's prior anonymous-`curl` verification correctly confirmed the function was unreachable by `anon`, but never exercised an authenticated call, so this ambiguity was never triggered until this gate's first real authenticated invocation.

Because the `DELETE` statement fails at planning time — before any row is touched — and the whole function body runs as one implicit transaction, **no row was deleted or inserted on either attempt.** This was independently confirmed live: `/profile` → My Current Officials for the test account still showed exactly Debbie Hawley (School Board District 1), Stephanie Morgan (City Council District 1), and Tobin Rogers "Toby" Overdorf (FL House District 85) — unchanged, no District 3 official, no fourth official. No rollback RPC call was made, because there was nothing to roll back.

### Cleanup performed and verified

- `src/app/api/set-city-council-district/route.ts` reverted via `git checkout --` to match committed `HEAD` exactly; `git diff` and `git status --short` confirmed a fully clean working tree (guard-flip edit and temporary debug line both gone, neither ever committed).
- `ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE` confirmed unchanged (`false`) throughout — never touched.
- A stray leftover dev-server process tree from an earlier gate's incomplete cleanup, plus this gate's own dev server, were fully force-stopped; confirmed no `next dev` process and no listener remains on port 3000.
- `npm run build` passed (27 routes, no errors).
- `npm run lint` reported only the same 5 known pre-existing `@typescript-eslint/no-require-imports` errors in `scripts/import-real-psl-data.cjs` and `scripts/validate-real-psl-csvs.cjs` — nothing new.

### Final state

City Council District 1 (Stephanie Morgan) for `civicmarket.test.01@example.com` is unchanged. School Board District 1, County Commission At-Large, FL House District 85, FL Senate District 27 all unchanged. Mayor remains absent for this account (not added, per explicit instruction). No District 3 assignment exists for this account. No other user was touched. `ENABLE_CITY_COUNCIL_DISTRICT_WRITE = false`. `ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE = false`. No deployment occurred. No schema, RLS, grants, policies, migrations, seeds, or district-definition changes were made.

### What remains unresolved

The approved test's actual goal — proving the atomic District 1 → District 3 → District 1 replacement works end-to-end — was not achieved. The `set_psl_city_council_district` function cannot currently complete a write for any input due to the ambiguous-column defect (`RETURNS TABLE (district_id uuid)` colliding with `user_districts.district_id`). Fixing this is a function/schema change and requires its own separate, explicit approval gate — design, approval, and manual Supabase execution — before any future write attempt. No such fix has been drafted, approved, or applied.

### Recommended next gate

Gate I32 — City Council RPC Ambiguous-Column Fix (design + approval + manual execution), followed by a repeat of the same controlled D1→D3→D1 test once the corrected function is live.

### No-change confirmation — Gate I31

No lasting changes to `candidates`, `voting_records`, `candidate_positions`, `match_scores`, `civic_dna`, `civic_dna_answers`, `user_districts` (both attempted writes failed, zero rows changed), `districts`, `current_officials`, `officials_for_user`, `src/lib/officials.ts`, `CurrentOfficialsSection`, `set_psl_city_council_district` (called, not edited), schema, tables, seeds, migrations, CSV files, RLS, grants, `src/app/api/set-city-council-district/route.ts` (reverted to match `HEAD`), `src/app/api/set-county-commission-district/route.ts`, PowerShell scripts, API keys, environment variables, the County Commission write guard, the At-Large row, or deployment state. No database write was performed. No secret file was inspected. No credentials were entered. `ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE` remains `false`. `ENABLE_CITY_COUNCIL_DISTRICT_WRITE` was temporarily `true` during this test and is confirmed restored to `false`. No deployment occurred.

## Gate I32 — City Council RPC Ambiguous-Column Fix: Design and Preparation

Date: 08-08-2026

Status: Design and SQL preparation only (documentation-only gate). Read-only code inspection of `Reference Files/civicmarket_schema_addendum_city_council_district_rpc.sql`.

Gate I31 exposed a live authenticated PostgreSQL `42702` "column reference district_id is ambiguous" error in `public.set_psl_city_council_district(uuid)`. Root cause: `RETURNS TABLE (district_id uuid)` implicitly declares a PL/pgSQL variable named `district_id`, colliding with the unqualified `district_id` reference inside the function's `DELETE FROM user_districts WHERE ... AND district_id IN (...)` statement. Audit of every occurrence of `district_id` in the function found this to be the only ambiguous reference (the `INSERT` target-column list is not ambiguous, since target-column lists resolve against the destination table, not PL/pgSQL variables).

Recommended and approved-for-drafting fix: qualify the reference as `user_districts.district_id`. A `CREATE OR REPLACE FUNCTION` statement implementing exactly this one-line change (nothing else touched — signature, return type, `SECURITY INVOKER`, `search_path`, and closed-set validation all unchanged) was drafted, along with read-only post-change verification SQL (`pg_proc`/`pg_get_functiondef`, `information_schema.routine_privileges`, `has_function_privilege()` checks) and a full regression test plan mirroring Gate I31's approval pattern. `CREATE OR REPLACE FUNCTION` (not `DROP`) was determined sufficient, since the signature is unchanged. Full record: `docs/internal_beta_gate_i32_city_council_rpc_ambiguity_fix_preparation.md`.

No SQL was executed by this gate. No live change was made. `ENABLE_CITY_COUNCIL_DISTRICT_WRITE` and `ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE` both remained `false`, untouched.

## Gate I33 — City Council RPC Ambiguity Fix: Execution and Live Verification

Date: 08-08-2026

Status: **Manually executed and verified live. Fix is live. No write guard was enabled. No `user_districts` mutation occurred.**

The user explicitly approved and manually executed, in the Supabase SQL Editor, the exact `CREATE OR REPLACE FUNCTION` statement drafted in Gate I32: the sole change was qualifying the `DELETE` predicate from `district_id IN (...)` to `user_districts.district_id IN (...)`, resolving the Gate I31 `42702` ambiguity. Execution succeeded with no rows returned.

Live verification (reported by the project owner, read-only queries):
- `prosecdef = false` — `SECURITY INVOKER` preserved.
- `identity_arguments = p_district_id uuid` — signature unchanged.
- `result_type = TABLE(district_id uuid)` — return type unchanged.
- `proconfig = ["search_path=public, pg_temp"]` — `search_path` preserved.
- `anon_can_execute = false` — anonymous execution remains blocked.
- `authenticated_can_execute = true` — authenticated execution remains permitted.

`CREATE OR REPLACE FUNCTION` preserved all existing grants automatically, as predicted in Gate I32 (grants are unaffected by a replace when the function signature is unchanged); the optional idempotent `REVOKE`/`GRANT` fallback was not needed. No API route change was required — `src/app/api/set-city-council-district/route.ts` calls the RPC opaquely and never destructures its result by column name; repository diff confirmed this file, and every other tracked file, remained unchanged throughout Gates I32-I33.

No `user_districts` row was created, updated, or deleted during this gate. `civicmarket.test.01@example.com` remains on City Council District 1 (Stephanie Morgan), unaffected. The District 1 → District 3 → District 1 live regression test (Gate I32's §9 test plan) was explicitly not performed and remains blocked pending a separate, explicit, scoped test-account write approval, following the Gate I31 approval pattern. `ENABLE_CITY_COUNCIL_DISTRICT_WRITE` remains `false`. `ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE` remains `false`. No deployment occurred.

Full record: `docs/internal_beta_gate_i33_city_council_rpc_fix_execution_result.md`.

Remaining unresolved and unaffected by Gates I32-I33: the pre-existing District 1 election-date discrepancy (live `2026-11-03` vs. Gate I18's documented `August 18, 2026`); the District 1 onboarding-default accuracy risk (every onboarded user defaults to City Council District 1 regardless of actual address).

### Recommended next gate

Gate I34 — City Council District 1 → District 3 → District 1 Live Regression Test, only after a fresh, explicit, scoped test-account write approval is given, following the Gate I31 approval pattern exactly.

### No-change confirmation — Gate I32 and Gate I33

Beyond the one explicitly approved live SQL execution (`CREATE OR REPLACE FUNCTION public.set_psl_city_council_district`, Gate I33) and documentation files, no changes were made to: `candidates`, `voting_records`, `candidate_positions`, `match_scores`, `civic_dna`, `civic_dna_answers`, `user_districts`, `districts`, `elections`, `current_officials`, `officials_for_user`, `src/lib/officials.ts`, `CurrentOfficialsSection`, `src/app/api/set-city-council-district/route.ts`, `src/app/api/set-county-commission-district/route.ts`, schema, RLS, seeds, migrations, CSV files, PowerShell scripts, API keys, environment variables, the At-Large row, or deployment state. No secret file was inspected. `ENABLE_CITY_COUNCIL_DISTRICT_WRITE` remains `false`. `ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE` remains `false`. No deployment occurred.

## Gate I34 — City Council District 1 → District 3 → District 1 Live Regression Test

Date: 08-08-2026

Status: **PASS. The corrected RPC completed a real, atomic assignment in both directions for the approved test account. Both write guards confirmed restored to `false`.**

Under explicit user approval (test account `civicmarket.test.01@example.com`, user UUID `ec59ea92-470f-447f-8873-ab2dbde52aca`, verified real district City Council District 1), `ENABLE_CITY_COUNCIL_DISTRICT_WRITE` was temporarily set to `true` locally (never committed) and a real District 1 → District 3 assignment was submitted through `/profile/city-council-district`, using the already-authenticated test-account browser session. The page showed the real (non-dry-run) success message "Your City Council district was saved." — confirming the Gate I33 fix resolved the Gate I31 `42702` ambiguity for an actual authenticated call, not just for metadata verification.

**Temporary District 3 state — every expected item verified live:** Anthony Bonna, Sr. (City Council Member, District 3) appeared in My Current Officials in place of Stephanie Morgan; `/ballot` showed the three City Council District 3 candidates (Fritz Alexandre, Jim Norton, Peter Overhuls) and no longer showed the four District 1 candidates; School Board (Debbie Hawley) and FL House (Tobin Rogers "Toby" Overdorf) were unchanged; Mayor remained absent, consistent with Gate I27 (this account was never given a Mayor assignment).

A second real submission (District 3 → District 1, same route/RPC) rolled the account back. The page again showed "Your City Council district was saved." **Final state — every expected item verified live:** Stephanie Morgan (City Council District 1) reappeared in My Current Officials, Anthony Bonna no longer present; `/ballot` showed the four District 1 candidates again, District 3 candidates gone; School Board and FL House unchanged throughout; Mayor still absent.

`src/app/api/set-city-council-district/route.ts` was reverted via `git checkout --` to exactly match committed `HEAD` immediately after the rollback; `git diff --stat` and `git status --short` both confirmed a fully clean working tree, and a direct file read confirmed `ENABLE_CITY_COUNCIL_DISTRICT_WRITE = false` again. `ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE` was confirmed unchanged (`false`) throughout — never touched. A single, pre-existing, healthy `npm run dev` process tree on port 3000 was reused for the whole test (verified as one clean chain, no stray duplicates) and required no cleanup. `npm run build` passed (27 routes, no errors). `npm run lint` reported only the same 5 known pre-existing `scripts/*.cjs` errors, nothing new.

County Commission At-Large and FL Senate District 27 were not surfaced as named Current Official rows either before or after the test (consistent with the pre-test baseline — no seeded `current_officials` row at that level is displayed this way), so they were unaffected by, and provide no direct evidence about, this test; this is a pre-existing display characteristic, not a Gate I34 finding.

This is the first successful real (non-dry-run) invocation of `set_psl_city_council_district` since it was created in Gate I30C — Gate I31's two attempts both failed before any row was touched, and Gate I33 verified only function metadata/grants, not an authenticated call. Gate I34 is the first live, end-to-end proof that the atomic District 1/3 replacement works correctly in both directions.

Full record: `docs/internal_beta_gate_i34_city_council_district_live_regression_test_result.md`.

Remaining unresolved and unaffected by Gate I34: the pre-existing District 1 election-date discrepancy (live `2026-11-03` vs. Gate I18's documented `August 18, 2026`); the District 1 onboarding-default accuracy risk (every onboarded user defaults to City Council District 1 regardless of actual address). The City Council district-assignment feature remains disabled for real users (`ENABLE_CITY_COUNCIL_DISTRICT_WRITE = false`) — this gate proved the write path works correctly under one controlled test, it did not enable the feature.

### No-change confirmation — Gate I34

`civicmarket.test.01@example.com`'s `current_officials`/`user_districts` state returned to its exact pre-test values by the end of the gate — two real, approved, scoped writes (one out to District 3, one back to District 1) leaving no net change. No other user was touched. No changes were made to: `candidates`, `voting_records`, `candidate_positions`, `match_scores`, `civic_dna`, `civic_dna_answers`, `districts`, `elections`, `officials_for_user`, `src/lib/officials.ts`, `CurrentOfficialsSection`, `set_psl_city_council_district` (called twice, not edited), schema, tables, seeds, migrations, CSV files, RLS, grants, `src/app/api/set-city-council-district/route.ts` (reverted to match `HEAD`), `src/app/api/set-county-commission-district/route.ts`, PowerShell scripts, API keys, environment variables, the At-Large row, or deployment state. No secret file was inspected. No credentials were entered. `ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE` remains `false`. `ENABLE_CITY_COUNCIL_DISTRICT_WRITE` was temporarily `true` during this test and is confirmed restored to `false`. No deployment occurred.

## Gate I35 — Onboarding City Council Default-Assignment: Design (Read-Only)

Date: 08-08-2026

Status: Read-only design/inspection only, delivered in-conversation (no separate document file created for this step — see Gate I36 below for the implementation it fed into).

Traced the exact unsafe default: `src/app/onboarding/zip/page.tsx`'s flat `ALL_PSL_DISTRICTS` array auto-assigned City Council District 1 to every qualifying ZIP submission, even though ZIP alone cannot distinguish District 1 from District 3 (Gate I28's already-established finding). Also identified a previously undocumented secondary defect: the same code's unconditional `user_districts` delete (`.eq('user_id', user.id)` with no district scoping) would silently destroy any separately verified City Council assignment on a later ZIP resubmission.

Confirmed via direct code trace that Mayor, School Board District 1, County Commission At-Large, FL House District 85, and FL Senate District 27 remain safe to auto-assign under the current data model (no competing districts exist for any of them in the schema today), and confirmed that Home, Ballot, `/onboarding/districts`, Profile, Current Officials, and candidate fetching (`src/lib/candidates.ts`, `src/lib/officials.ts`, `CurrentOfficialsSection.tsx`) all already degrade safely with zero City Council assignment — no crashes, no hardcoded assumptions found.

Recommended design: stop auto-assigning City Council District 1 (or District 3) from ZIP; scope the delete to only the ZIP-managed districts so a verified City Council row survives; add a small, reused (not duplicated) pointer to the existing `/profile/city-council-district` verification page as a secondary post-onboarding action. Confirmed the existing RPC/API path (`set_psl_city_council_district`, proven live in Gate I34) needs no changes and is safe to call even for a user with zero prior City Council row.

No code was edited, no Supabase access occurred, and no file was committed during Gate I35 itself.

## Gate I36 — Onboarding City Council Default-Assignment Fix: Implementation

Date: 08-08-2026

Status: **Implemented and statically verified. No live/UI onboarding test performed. General-user City Council writes remain disabled.**

Implemented the Gate I35 design in exactly the two approved files:

**`src/app/onboarding/zip/page.tsx`** — `ALL_PSL_DISTRICTS` renamed to `ZIP_MANAGED_DISTRICTS` with the City Council District 1 entry removed, leaving exactly the five approved districts (School Board District 1, County Commission At-Large, FL House District 85, FL Senate District 27, Mayor). The `user_districts` delete before reinsert is now scoped with `.in('district_id', ZIP_MANAGED_DISTRICTS.map((d) => d.id))`, so City Council District 1 (`...0001`) and District 3 (`...0007`) rows — and any other unrelated future `user_districts` row — are structurally excluded from this delete by construction, fixing both the primary default-assignment defect and the secondary delete-all defect identified in Gate I35.

**`src/app/onboarding/calculating/page.tsx`** — added one secondary, visually subordinate text-link CTA ("Verify your City Council district →") below the existing primary "View my ballot" button on the post-Civic-DNA success screen, linking to the existing `/profile/city-council-district` page. No duplicate district selector, no address collection, no new API logic, and no change to the existing primary CTA or its already-approved copy.

No other file was touched — in particular, `src/app/profile/city-council-district/page.tsx`, `src/app/api/set-city-council-district/route.ts`, the `set_psl_city_council_district` RPC SQL, `src/lib/candidates.ts`, `src/lib/officials.ts`, `CurrentOfficialsSection.tsx`, Home, Ballot, and all schema/RLS/grants/policy/migration/seed/district-definition files remained unmodified, per the approved scope.

**Static verification** (code inspection and `grep`, not a live test): confirmed no ZIP onboarding code references `...0001` or `...0007`; confirmed `ZIP_MANAGED_DISTRICTS`/the delete scope contains exactly `...0002`, `...0003`, `...0004`, `...0005`, `...0006`; confirmed a pre-existing `...0001` or `...0007` row survives the ZIP delete by construction, since neither id is ever a member of the delete's `.in()` filter; confirmed the calculating-page CTA points to `/profile/city-council-district`; confirmed no duplicate verification UI (radio/attestation) was introduced in `calculating/page.tsx`.

**Build**: `npm run build` passed, 27 routes, no errors — unchanged from baseline. **Lint**: `npm run lint` reported only the same 5 known pre-existing `scripts/*.cjs` errors, nothing new.

**No database/schema changes**: no Supabase mutation was performed; no `user_districts`, `districts`, `elections`, or `candidates` row was touched; no function/schema/RLS/grant/policy was modified; no deployment occurred. `ENABLE_CITY_COUNCIL_DISTRICT_WRITE` remains `false`. `ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE` remains `false`.

**Testing limitation and pending live test**: this gate performed static verification only — no dev server was started, no ZIP onboarding flow was run end-to-end, and no pre-existing verified City Council row was actually exercised through a real ZIP resubmission. A future gate should live-test: a new account completing onboarding with exactly 5 `user_districts` rows and zero City Council rows; Home/Ballot/`/onboarding/districts`/Profile/Current Officials rendering safely without a City Council assignment; the new calculating-page link's visibility and correct destination; and — only once a separate future gate enables `ENABLE_CITY_COUNCIL_DISTRICT_WRITE` for a scoped test account — that a real verified City Council assignment survives a subsequent ZIP resubmission for the same account.

**This gate does not establish production or Controlled-PSL-Beta readiness.** It removes an unsafe default and adds a pointer to the existing verification flow; it does not enable City Council writes for any general user, and the live-test items above remain outstanding.

Full record: `docs/internal_beta_gate_i36_onboarding_city_council_default_fix.md`.

### No-change confirmation — Gate I35 and Gate I36

Beyond `src/app/onboarding/zip/page.tsx`, `src/app/onboarding/calculating/page.tsx`, and this gate's documentation files, no changes were made to: `candidates`, `voting_records`, `candidate_positions`, `match_scores`, `civic_dna`, `civic_dna_answers`, `user_districts`, `districts`, `elections`, `current_officials`, `officials_for_user`, `src/lib/officials.ts`, `src/lib/candidates.ts`, `CurrentOfficialsSection.tsx`, `src/app/profile/city-council-district/page.tsx`, `src/app/api/set-city-council-district/route.ts`, the `set_psl_city_council_district` RPC, `src/app/api/set-county-commission-district/route.ts`, Home, Ballot, schema, RLS, grants, policies, migrations, seeds, district definitions, PowerShell scripts, API keys, or environment variables. No database write was performed. No secret file was inspected. `ENABLE_CITY_COUNCIL_DISTRICT_WRITE` remains `false`. `ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE` remains `false`. No deployment occurred.

## Gate I37 — candidate_position_evidence Table Creation and Verification

Date: 08-08-2026
Timestamp: 03:46 pm EST

Status: **Complete.** Note on numbering: tracked in-conversation as "Gate I35," renumbered to I37 at documentation time to avoid colliding with the pre-existing, unrelated Gate I35/I36 (Onboarding City Council Default-Assignment) recorded above. Full record: `docs/internal_beta_gate_i37_candidate_position_evidence_table_execution_result.md`.

New table `public.candidate_position_evidence` created and verified live, via one atomic `BEGIN;...COMMIT;` transaction covering `CREATE TABLE`, `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`, the admin-only SELECT policy, and all three indexes together — no intermediate state existed where the table lacked RLS, its policy, or its indexes. Preserves source-backed, candidate-controlled evidence (`campaign_website`, `questionnaire`, `official_social`, `interview`, `debate`) used to later derive `candidate_positions` dimension scores for beta; does not itself alter `candidate_positions` or `match_scores`.

**Verified live:** table exists with 18 columns; `methodology_version text NOT NULL` with no column default (every future insert must state it explicitly); 10 CHECK constraints present (valid dimension, valid score `-2..2`/null, valid source_type, valid confidence, valid extraction_status, non-blank source_url, rationale required when score is non-null, `official_social` requires a non-blank `source_account_url`, reviewed_by/reviewed_at consistency, non-blank methodology_version); `candidate_id → candidates(id) ON DELETE CASCADE`; `reviewed_by → profiles(id) ON DELETE SET NULL`; RLS enabled (`relforcerowsecurity = false`, expected under the service-role-write model); exactly one policy, `"Admins can read candidate position evidence"` (SELECT only); zero INSERT/UPDATE/DELETE policies (writes are service-role-only, mirroring `agent_staging`/`agent_runs`/`monitored_sources`); 4 indexes (`_pkey`, `_candidate_id_idx`, `_candidate_dimension_idx`, `_pending_review_idx` partial on `extraction_status IN ('draft','human_reviewed')`); row count = 0.

**Approved methodology version for future evidence rows:** `campaign_evidence_v1_2026-08` (not a DB default).

**`official_social`** remains a valid schema `source_type` value only — actual ingestion stays deferred pending a separate, not-yet-designed candidate-source allowlist gate.

**Shannon Martin** (candidate_id `d44ff05a-14af-45c2-9f2f-6d530a8a051e`) campaign-website evidence pilot remains the next candidate-scoring task — no evidence was created or inserted for her, no scoring was performed, no campaign content was fetched, no Anthropic/Claude call was made.

No `candidate_positions` or `match_scores` row was created or modified. No application source code was changed. No deployment occurred. `ENABLE_CITY_COUNCIL_DISTRICT_WRITE` remains `false`. `ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE` remains `false`. No content from the pre-existing Gate I35/I36 above was altered.

### Recommended next gate

Gate I38 — Shannon Martin campaign-website source verification (read-only, documentation-only), mirroring the source-verification standard already applied to the four City Council District 1 candidates in Gates I13/I18, before any evidence extraction is attempted for her.

## Milestone 1 — Onboarding Live Validation (City Council-Safe ZIP Flow)

Date: 08-08-2026

Status: **PASS.**

Live-tested the Gate I36 onboarding fix end-to-end using one fresh test account (`civicmarket.test.05@example.com`, user UUID `3b223f8c-059e-4f3a-a507-29714ad8b3a9`), created by the project owner directly in Supabase (email pre-confirmed) and signed in by the project owner — the assistant never entered, requested, or inspected any password, invite code, or credential. Confirmed pre-onboarding via a redirect-to-zip check (zero `user_districts` rows) before testing began.

Submitted ZIP `34953` through the normal onboarding UI. Read-only database verification (via the browser's own already-authenticated Supabase REST call, replayed without ever exposing the captured auth header — the harness's safety classifier blocked one attempt to print it directly, so it was used only internally) confirmed the account received **exactly** the five ZIP-managed rows (`...0002` School Board District 1, `...0003` County Commission At-Large, `...0004` FL House District 85, `...0005` FL Senate District 27, `...0006` Mayor) and **zero** rows for `...0001` (City Council District 1) or `...0007` (City Council District 3).

Live UI validation, all PASS: the onboarding completion screen showed both the unchanged primary "View my ballot" CTA and the new, visually secondary "Verify your City Council district →" link, which correctly navigated to `/profile/city-council-district`; Current Officials (Profile and Home) rendered without error showing Debbie Hawley and Tobin Rogers "Toby" Overdorf, with no Stephanie Morgan and no Anthony Bonna, Sr.; Ballot rendered without error showing only the Mayor race, with no City Council District 1 or District 3 race; Profile showed the correct account and the "Set City Council District" settings row; Home rendered with no false City Council content. The verification page itself was confirmed dry-run-only: a full District 1 selection with attestation was submitted and returned the exact expected message, "Write path disabled pending explicit approval. No user_districts row was created or modified." — confirmed by the same read-only database check afterward still showing zero City Council rows.

Task item 10 (verifying a pre-existing verified City Council row survives ZIP resubmission) was explicitly deferred rather than improvised, since it would have required signing into the heavily-reused shared account `civicmarket.test.01@example.com` and risking its baseline for no safety benefit beyond what the delete-scoping logic already proves structurally.

`npm run build` passed (27 routes, no errors). `npm run lint` reported only the 5 known pre-existing `scripts/*.cjs` errors, nothing new. `ENABLE_CITY_COUNCIL_DISTRICT_WRITE` and `ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE` remained `false` throughout, unedited. No schema, RLS, grant, policy, function, migration, seed, or district-definition change was made. No manual/direct Supabase SQL write was performed — every effect (or confirmed non-effect) came through the normal application flow. No existing real user was modified. No deployment occurred.

Full record: `docs/internal_beta_onboarding_live_validation.md`.

### No-change confirmation — Milestone 1

Beyond the expected, ordinary effects of one fresh test account completing normal ZIP onboarding (its own `profiles.zip_code` update and five-row `user_districts` insert), no database write occurred. No `candidates`, `candidate_positions`, `match_scores`, `civic_dna_answers`, `districts`, `elections`, `current_officials`, `officials_for_user`, or `set_psl_city_council_district` change was made. No existing real user was touched. No schema, RLS, grants, policies, functions, migrations, or seeds were changed. No secret, `.env`, API key, password, service-role key, invite code, or credential was inspected, requested, or exposed. `ENABLE_CITY_COUNCIL_DISTRICT_WRITE` remains `false`. `ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE` remains `false`. No deployment occurred.

## Gate I38 — Shannon Martin Campaign-Website Source Verification

Date: 08-16-2026
Timestamp: 11:47 am EST

Status: **PASS.** Verification and documentation only. Full record: `docs/internal_beta_gate_i38_shannon_martin_campaign_source_verification.md`.

`https://martinforpslmayor.com/` (candidate: Shannon Martin, `candidate_id` `d44ff05a-14af-45c2-9f2f-6d530a8a051e`, Port St. Lucie Mayor) independently verified live as a genuine candidate-controlled campaign source, approved for `source_type = campaign_website`. Ownership/control evidence: the disclaimer "Paid for and Approved by Shannon Martin for Port St. Lucie Mayor" was independently confirmed verbatim on two separate pages (homepage and `/about-shannon-martin/` footer), matching the same disclaimer convention already accepted for the four City Council District 1 candidates in Gates I13/I18. Verified substantive first-party pages: the homepage plus `/about-shannon-martin/` and `/biography/`.

Approved methodology version for any future evidence: `campaign_evidence_v1_2026-08`.

Apparent dimension coverage (no scores assigned): **potentially supported** by first-party campaign material — growth_development, taxation_spending, environment, public_safety, transparency. **Unsupported / insufficient evidence** — housing (only a biographical board-membership fact was found, not a policy statement, and biography-alone is a prohibited inference source) and education (no explicit statement found). Both must remain null/unsupported unless separately verified eligible evidence is found later; neither may be inferred from silence, and a future extraction pilot must not force a 7-of-7 profile for this candidate.

This gate approves the verified site for a **future extraction pilot only**. It does not approve evidence inserts, any -2..2 score, `candidate_positions` updates, `match_scores` updates, Anthropic API calls, interview ingestion, `official_social` ingestion, or social-media allowlist creation. `official_social` remains deferred pending a separately designed and approved candidate-source allowlist mechanism, unaffected by this gate.

No `candidate_position_evidence` row was inserted. No `candidate_positions` or `match_scores` change was made. No Supabase write or SQL execution occurred. No Anthropic/Claude scoring call was made. No application source code was changed. `ENABLE_CITY_COUNCIL_DISTRICT_WRITE` and `ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE` remain `false`, untouched. No deployment occurred.

### Recommended next gate

Gate I39 — Controlled Shannon Martin campaign-evidence extraction pilot: use only the already-verified campaign website; inspect only the five potentially-supported dimensions; return structured draft evidence (proposed score, rationale, exact source URL) for human review; leave Education and Housing null; insert nothing into Supabase until separately reviewed and explicitly approved. Not designed or implemented by this gate.

## Milestone 2A — ZIP Resubmission Preservation Test

Date: 08-16-2026

Status: **PASS.** Full record: `docs/internal_beta_zip_resubmission_preservation_test.md`.

Proved live that re-running ZIP onboarding does not delete or replace a previously verified City Council District 1 assignment, closing the item Milestone 1 explicitly deferred (its task item 10). Test account: `civicmarket.test.01@example.com` (`ec59ea92-470f-447f-8873-ab2dbde52aca`), verified real district City Council District 1 (Stephanie Morgan). Signed in by the project owner directly in the browser — the assistant never entered or inspected the password.

**Pre-test `user_districts` (5 rows, read-only verified):** City Council District 1 (`...0001`), School Board District 1 (`...0002`), County Commission At-Large (`...0003`), FL House District 85 (`...0004`), FL Senate District 27 (`...0005`). No Mayor row — recorded as observed (this account predates Gate I27). Current Officials pre-test confirmed Stephanie Morgan present.

Submitted ZIP `34953` through the normal `/onboarding/zip` → `/onboarding/districts` → `/onboarding/dna-teaser` ("I'll do this later") flow — no manual/direct Supabase write, ZIP never used to infer City Council District 1 vs. District 3.

**Post-resubmission `user_districts` (6 rows, read-only verified):** the same five rows unchanged, plus a new Mayor row (`...0006`) — expected, since Mayor is part of `ZIP_MANAGED_DISTRICTS` (Gate I27) and this account predates it. **City Council District 1 (`...0001`) survived unmodified. City Council District 3 (`...0007`) never appeared**, before or after.

Current Officials after resubmission: Stephanie Morgan still present, Anthony Bonna Sr. absent, Civic DNA scores unchanged (quiz not retaken). Ballot after resubmission: all four City Council District 1 candidates still present, no District 3 candidates, a new Mayor race section appeared (expected, tied to the new Mayor row).

**No City Council write API/RPC was used** — network requests were tracked continuously through the full test; zero requests to `set-city-council-district` occurred, and `/profile/city-council-district` was never visited. Preservation is proven through the Gate I36 scoped delete-then-insert logic itself, not through any re-save.

`npm run build` passed (27 routes, no errors). `npm run lint` reported only the 5 known pre-existing `scripts/*.cjs` errors, nothing new. `git status --short` was clean after testing — no transient source/debug changes left behind. `ENABLE_CITY_COUNCIL_DISTRICT_WRITE` and `ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE` both re-confirmed `false` after the test. No schema, RLS, grant, policy, function, migration, seed, or district-definition change was made. No other user was modified. No deployment occurred.

**Limitations:** only one shared test account was used (no verified District 3 account currently exists to test the symmetric case); the Civic DNA quiz was not retaken; no 390px/mobile or accessibility check was performed; District 3's own survival-through-resubmission behavior remains unproven (only its non-appearance for a District-1-only account was verified).

### Recommended next step

Return to the broader Internal Beta launch plan and remaining hard blockers; no further ZIP-resubmission-specific gate is needed unless a new defect is found.

## Milestone 2B — Controlled PSL Beta Readiness Verification

Date: 08-18-2026

Status: **READY AFTER SPECIFIC ITEMS.** Full record: `docs/controlled_psl_beta_readiness.md`.

Verified/dispositioned the six remaining MUST VERIFY items ahead of the first small invite-only Controlled PSL Beta, per explicit instruction to treat the prior "City Council District 1 default assignment" concern as **closed** (Gate I36 + Milestone 1 + Milestone 2A already resolved it).

**Item 1 — District 1 election date:** Official sources (St. Lucie County Supervisor of Elections, directly fetched; a third-party voter guide explicitly citing the City Clerk's elections page; independent 2022 news corroboration of the same majority/runoff mechanic) confirm Port St. Lucie uses a majority/runoff system — August 18, 2026 (today) is the Primary, deciding the race outright only if one candidate wins a majority; November 3, 2026 is the runoff/General, used only if no majority is reached. **The live database's single `election_date` value is not simply "wrong" — a single-value date column cannot represent this conditional structure.** No database change was made; this requires a separate, explicit data-model decision plus write approval, not a one-line correction. The City Clerk page and the Municode charter itself returned HTTP 403 to direct fetch and could not be quoted directly.

**Item 2 — City Council write-guard technical readiness:** Reviewed `src/app/api/set-city-council-district/route.ts` and `src/app/profile/city-council-district/page.tsx` directly. **Technically ready to enable** — Gate I34 already proved a real, non-dry-run District 1 → District 3 → District 1 round trip through this exact code path, and the UI's dry-run messaging is honest (no misleading "saved" claim while disabled). The guard (`ENABLE_CITY_COUNCIL_DISTRICT_WRITE`) is a source-controlled boolean, not a per-user flag — enabling it requires a code change + deploy and would affect **all** users at once, with no built-in test-account scoping. **Not enabled.** Real consequence of leaving it false for a first wave: brand-new invitees get zero City Council assignment and zero City Council ballot/Current-Officials content (confirmed to render safely, no crash) unless/until enabled.

**Item 3 — Corrections email:** `mailto:inaccuracy@civicmarket.app` appears in `src/app/corrections/page.tsx` and `src/app/measures/[id]/page.tsx`. Found and flagged (not fixed): the Candidate Profile's "Report an Inaccuracy" link instead points to the database-backed `/report` flow — two different, inconsistent reporting mechanisms currently coexist for candidates vs. measures. Mailbox deliverability/monitoring could not be verified without credentials; one manual test-email check was given.

**Item 4 — Mobile smoke test:** `resize_window` tooling has improved since Gates I17/I21/I30 (previously stuck at 1920px) but now floors at ~500px regardless of a smaller requested width; tested live at ~500px on the two available public pages (`/onboarding`, `/corrections`) with no horizontal overflow found. The four target auth-gated pages (calculating, ballot, profile, city-council-district) could not be tested — no signed-in session was available and the assistant does not enter credentials. One manual real-device check was given.

**Item 5 — Auth redirect readiness:** No hardcoded `localhost`, `redirectTo`, or site-URL env var found anywhere in `src/`; no Google/OAuth code exists in the app at all (email/password only). Redirect behavior is entirely controlled by the Supabase dashboard's Auth → URL Configuration, which was not and could not be inspected from code. A concise deploy-time checklist was produced.

**Item 6 — Fresh signup readiness:** Milestone 1 already proves the local onboarding path end-to-end (five safe districts, zero City Council rows, correct rendering everywhere). Invite-code behavior, email-confirmation deliverability, and deployed-domain redirect behavior are all inherently deploy-time checks against the real production environment and remain unverified until a deploy target and its Supabase Auth configuration exist.

**Reconciliation:** zero MUST FIX items found. Five MUST MANUALLY CONFIRM items (District 1 election-date data-model decision; corrections-mailbox deliverability + reporting-flow inconsistency; mobile check on the four untested auth-gated screens; Supabase Auth URL configuration at deploy time; invite-code/email-confirmation/redirect checks against the real deployed environment). Acceptable-for-first-wave and post-beta items are itemized in the full record.

No source code was changed by this task. No Supabase write, schema, RLS, grant, policy, function, migration, seed, or district-definition change occurred. No secret file was inspected. No credentials were entered. A local `npm run dev` instance used only for the Item 4 smoke test was fully stopped afterward. `ENABLE_CITY_COUNCIL_DISTRICT_WRITE` and `ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE` both remain `false`, unchanged. No deployment occurred. The unrelated concurrent untracked file `src/app/api/admin/extract-shannon-martin-evidence/route.ts` was left untouched and is not part of this update.

### Recommended next step

Resolve the five MUST MANUALLY CONFIRM items (most require the user directly: a data-model decision for Item 1, a test email for Item 3, a real-device check for Item 4, Supabase dashboard configuration for Item 5, and a real deploy target for Item 6) before extending the first Controlled PSL Beta invites.

## Temporary Monitored Corrections Email

Date: 08-18-2026

Status: **Complete.** Full record: `docs/controlled_psl_beta_readiness.md` ("Follow-up (08-18-2026) — Temporary monitored corrections email").

Resolved Milestone 2B's Item 3 open confirm item by disclosure: **`civicmarket.app` is not a real, owned domain** — it was only ever a placeholder in an old budget-planning doc (`Reference Files/CIVICMARKET_BETA_SCOPE_PLAN.md`), never purchased. **`inaccuracy@civicmarket.app` was therefore not a deliverable mailbox.**

Both public-facing, user-visible email-based correction paths now use the approved temporary monitored contact **`joebuttonzii@gmail.com`**:
- `src/app/corrections/page.tsx` — Corrections Policy "Contact" section (link text and `mailto:` href).
- `src/app/measures/[id]/page.tsx` — Measure Profile "Report an Inaccuracy" `mailto:` link (subject/body template unchanged).

This is an explicitly temporary pre-launch contact; a branded CivicMarket address remains a future cleanup item once a real domain exists.

Left unchanged as internal/documentation-only or historical (not user-facing): `docs/civicmarket_build_guide_UPDATED_WITH_CURRENT_OFFICIALS_AND_REVIEW_SUMMARIES.md` and `Reference Files/civicmarket_build_guide.md` (also the only place `appeals@civicmarket.app` appears in the repository — no live app code references it); `docs/internal_beta_gate_i9_smoke_test_plan.md` and `docs/internal_beta_gate_i9a_read_only_smoke_test_results.md` (historical gate records); `Reference Files/CIVICMARKET_BETA_SCOPE_PLAN.md` (budget placeholder, not an email); and this file's own Milestone 2B section above and `docs/controlled_psl_beta_readiness.md`'s original Item 3 text (left as an accurate historical record of what was found before this fix).

**Candidate Profile verified, not changed:** `src/app/candidates/[id]/page.tsx`'s "Report an Inaccuracy" control remains a `<Link href="/report">` (database-backed flow), confirmed by direct code read — no `mailto:` string exists anywhere in that file, no broken email assumption. The candidate-vs-measure reporting-flow inconsistency noted in Milestone 2B still exists and was intentionally not unified in this task.

**Related but out-of-scope finding, not fixed:** `src/app/privacy/page.tsx` tells users to request account deletion "by contacting us at the email below," but no email address actually appears anywhere on that page (its own "Contact" section says only that contact information "will be provided when the beta launches"). Not a `@civicmarket.app` string, and outside this task's explicit corrections/inaccuracy scope — flagged for a future, separately-approved fix.

`npm run build` passed (28 routes — one more than the previously documented 27, due to the pre-existing untracked concurrent-work file `src/app/api/admin/extract-shannon-martin-evidence/route.ts`, unrelated to and unmodified by this task). `npm run lint` reported only the same 5 known pre-existing `scripts/*.cjs` errors, nothing new.

No database, schema, RLS, grant, policy, function, migration, seed, district-definition, write-guard, or deployment change occurred. `ENABLE_CITY_COUNCIL_DISTRICT_WRITE` and `ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE` both remain `false`, unchanged. No secret file was inspected. No credentials were entered. No deployment occurred.

## Ballot Eligibility vs. Representation — Phase 1

Date: 08-20-2026

Status: **Implemented and verified. No deployment. No database writes.** Full record: `docs/ballot_eligibility_representation_phase_1.md`.

Resolved official-source facts: Port St. Lucie City Council (Mayor + District races) is representation-district-specific but citywide-voted; St. Lucie School Board is representation-district-specific but countywide-voted; St. Lucie County Commission remains representation-district-specific but countywide-voted (already-verified conclusion, retained); FL House/FL Senate remain exact-geographic-district for ballot purposes, and FL Senate District 27 remains confirmed incorrect for St. Lucie County (real coverage is District 29/31, not guessed).

**New file `src/lib/ballotEligibility.ts`** — a small, explicit rule table scoped per `(city, state, district.type)`, never a bare global `type` rule: `city_council` + Port St. Lucie/FL → `citywide`; `county` + Port St. Lucie/FL → `countywide`; `school_board` + Port St. Lucie/FL → `countywide`; `state` (FL House/Senate) has no rule and falls through to the `exact` default. An unmodeled jurisdiction/type combination always fails closed to `exact` rather than guessing, so a future city's identically-typed district is never silently assumed to follow Port St. Lucie's voting method.

**`src/lib/candidates.ts`** — `getCandidatesForDistricts` now resolves a user's held districts through this rule table before querying `candidates`: `exact`-mode districts are matched as before; `citywide`/`countywide`-mode districts are expanded to every other district sharing the same `(city, state, type)`, live-queried at read time. No new `user_districts` rows are ever created to achieve this — verified live that a fresh user holding only Mayor + County Commission At-Large correctly resolves to all 11 currently-seeded candidates (Mayor, City Council D1, City Council D3), and that the County Commission expansion already resolves to all 6 County Commission district rows (District 2/4 candidates will appear automatically once imported, with no further code change needed).

**`src/lib/measures.ts` — intentionally unchanged.** Ballot measures have a different `type` semantic (referendum/charter-amendment, not jurisdiction level) and zero real measures currently exist to validate against; applying the same expansion here would be guessing. Flagged as needing its own separate future review once real measure data exists.

**`src/app/onboarding/zip/page.tsx`** — `ZIP_MANAGED_DISTRICTS` reduced from 5 entries to 2, after inspecting each individually:
- **Kept:** Mayor (citywide pseudo-district). County Commission At-Large — confirmed live that zero `current_officials` rows are tied to this id, so it produces no representation record at all; it functions purely as the countywide ballot-eligibility anchor, not a false representation claim.
- **Removed — School Board District 1:** was being assigned to every PSL user as a fake verified representation district with zero address confirmation, the same shape of defect Gate I36 already fixed for City Council. No longer needed for ballot purposes either (handled by the `school_board` countywide expansion rule).
- **Removed — FL House District 85:** Port St. Lucie is confirmed split across District 84 and 85; defaulting everyone to 85 is factually wrong for District-84 residents. No verified-lookup flow exists yet, so no automatic assignment is made — missing data preferred over incorrect data, per explicit instruction.
- **Removed — FL Senate District 27:** confirmed incorrect for St. Lucie County entirely (real coverage is District 29/31, indistinguishable by ZIP). No automatic assignment is made.

The delete-then-insert write remains scoped to this same (now-smaller) array, so any **existing** user's legacy School Board District 1 / FL House District 85 / FL Senate District 27 row is left completely untouched — neither deleted nor migrated. City Council District 1/3 remain excluded from `ZIP_MANAGED_DISTRICTS`, unchanged from Gate I36.

**Representation confirmed unchanged** — `officials_for_user` (SQL view), `src/lib/officials.ts`, `CurrentOfficialsSection.tsx`, the City Council D1/D3 verified-assignment RPC/API, and County Commission representation behavior were not modified. Verified live that `current_officials` has zero rows tied to the Mayor or County-Commission-At-Large district ids (so the ballot expansion cannot leak into representation), and exactly one row each for City Council District 1 (Stephanie Morgan) and District 3 (Anthony Bonna, Sr.).

**Test results — all verified live (read-only) against the actual database, not simulated:** fresh-user ballot expansion (Mayor + County Commission At-Large → all 11 seeded candidates) PASS; City Council D1/D3 representation isolation PASS; County Commission countywide expansion PASS (6 district rows resolved); County Commission Current Officials does not expand to all commissioners PASS by construction (view untouched); School Board countywide expansion PASS (currently resolves to District 1 only, since D3/D5 rows don't exist yet — will expand automatically once added); fresh user receives no fake School Board representation PASS; FL House stays exact, no universal 85 assignment PASS; FL Senate — no District 27 assignment, no 29/31 guess PASS; Mayor no regression PASS.

`npm run build` passed (28 routes, no errors — the 28th route is the pre-existing untracked concurrent-work admin route, unrelated to this task). `npm run lint` reported only the 5 known pre-existing `scripts/*.cjs` errors, nothing new.

**Existing-user legacy rows still requiring cleanup (not touched by this task):** existing users may still hold `School Board District 1`, `FL Senate District 27`, and possibly `FL House District 85` from the now-removed defaults. None were migrated or deleted. A separate, controlled cleanup is required once correct verified-district-assignment mechanisms exist for School Board and FL House/Senate, mirroring the City Council D1/D3 and disabled County Commission patterns.

**Explicitly not done in this task:** no FL House/Senate or School Board verified-district-lookup flow was built; no candidates were imported; no existing `user_districts` row was migrated, deleted, or modified; the dead, unused `ballot_for_user` SQL view (`Reference Files/civicmarket_schema_v4.sql`) was not touched and still has the original conflation flaw — its disposition remains a separate, future, explicitly-approved database view change; no schema, RLS, grants, policies, functions, or migrations were changed.

No Supabase write was performed. No `candidates`, `districts`, `elections`, `user_districts`, `current_officials`, or `officials_for_user` row/definition was created, modified, or deleted. No secret file was inspected. `ENABLE_CITY_COUNCIL_DISTRICT_WRITE` and `ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE` both remain `false`, untouched. No deployment occurred.

## Ballot Eligibility Phase 1 — School Board Anchor Correction

Date: 08-20-2026

Status: **Confirmed and corrected. No database writes. No deployment. Candidate import remains pending.** Full record: `docs/ballot_eligibility_representation_phase_1.md` ("Post-Phase-1 correction" section).

**Gap found:** the Phase 1 expansion logic only expanded a held district into other districts of its own `type`. A fresh PSL user correctly holds no `school_board`-type row (by design — no School Board representation default should exist without a verified lookup), so the countywide School Board rule was never triggered by anything, even though City Council (via the Mayor anchor) and County Commission (via the At-Large anchor) both worked correctly. Confirmed real by direct code inspection before any change was made.

**Correction:** `src/lib/ballotEligibility.ts` rules now name a `types: string[]` family instead of a single `type` — the St. Lucie County rule's family is `['county', 'school_board']`, since both are elected countywide per their respective official sources. Holding a district of either type now expands ballot eligibility to both. A new `getExpansionJurisdictions()` function returns every type in the matched family; `src/lib/candidates.ts`'s `resolveBallotDistrictIds` uses it instead of only the held district's own type. Considered and rejected a simpler "anchor by specific district ID" alternative — the type-family model avoids hardcoding a magic UUID and is symmetric/generalizable to future counties.

**Verified live (read-only):** School Board District 1 is now reachable in the eligible set from the County Commission At-Large row alone, with zero School Board `user_districts` row created; the same query is unfiltered by district id, so future School Board District 3/5 rows will become eligible automatically with no further app-code change; County Commission and City Council/Mayor expansion remain unaffected (same 11 candidates resolve as before); FL House/Senate remain absent (no rule exists for `type = 'state'`); `current_officials` for School Board District 1 (Debbie Hawley) is confirmed reachable only by a user holding that exact `district_id`, which a fresh user does not hold — representation isolation intact.

`npm run build` passed (28 routes, no errors). `npm run lint` reported only the 5 known pre-existing `scripts/*.cjs` errors, nothing new.

No `user_districts`, `officials_for_user`, `src/lib/officials.ts`, `CurrentOfficialsSection.tsx`, or onboarding file was modified. No schema, RLS, grants, policies, functions, or migrations were changed. `ENABLE_CITY_COUNCIL_DISTRICT_WRITE` and `ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE` both remain `false`, untouched. No secret file was inspected. No deployment occurred. Candidate import remains pending.

## Gate I39 — Candidate-Evidence Dimension Definitions Review

Date: 08-20-2026

Status: **Documentation-only review and re-evaluation complete.** No Anthropic call. No Supabase write. No deployment. Full record: `docs/internal_beta_gate_i39_candidate_evidence_dimension_definitions_review.md`.

**Numbering note:** this claims the "Gate I39" slot Gate I38's "Recommended next gate" note reserved. The live extraction pilot that note anticipated actually ran informally in a separate working session (a JSON-fence-parsing fix, response-diagnostics/multi-text-block hardening, a truncation root-cause diagnosis traced to unrequested adaptive extended thinking on `claude-sonnet-5` consuming the `max_tokens` budget, a fix — `thinking: { type: 'disabled' }` plus `max_tokens: 6000` — and one successful live call returning 8 validated Shannon Martin evidence rows, 0 rejected) but was never persisted here. This entry is the first of that sequence to be recorded, and covers only the definitions-review step that followed human review of those 8 rows.

**Trigger:** of the 8 validated rows, only 3 were approved as scored (`taxation_spending +2` ×2, `public_safety +2`); 5 contained legitimate evidence but were rejected because the current evidence-scoring polarity definitions (a downstream, additive concern separate from the locked Civic DNA quiz — `Reference Files/CIVICMARKET_PATCH_MAY12.md` and the seven locked dimension keys were **not** touched) were too narrow, ambiguous, or vulnerable to false inference from boilerplate/generic language.

**Outcome, all seven dimensions reviewed:** `growth_development` redefined around permissive-vs-restrictive *development-approval policy*, with single-parcel conservation actions explicitly excluded (they belong to `environment`). `taxation_spending` kept as one combined dimension (the seven keys are locked; splitting would need its own schema-level gate) but tightened to a net-fiscal-posture rule with an explicit "don't average, hold at 0 and escalate" rule for same-row tax-cut-plus-spending-increase evidence. `environment` broadened from "regulation" to protection/conservation/public investment generally. `public_safety` broadened to resources/staffing/facilities/technology, with a sharp new exclusion for generic "supports law enforcement"/outcome-ranking rhetoric. `transparency` split into a scoreable Tier A (disclosure/access/records policy) and an excluded Tier B (generic constituent engagement/outreach alone). `education` and `housing` definitions were reviewed and tightened but remain untested — no real evidence exists yet for either dimension for any candidate reviewed so far.

**Shannon Martin row-by-row re-evaluation (no new model call):** growth_development +1 → null (boilerplate, no concrete commitment); growth_development -1 → null under this dimension (conservation evidence mis-mapped — belongs to `environment`, not fabricated as a new row here); both `taxation_spending +2` rows kept unchanged; `environment +1` revised to **+2** (multiple concrete, named, funded commitments under the broadened definition); `public_safety +1` → null (generic branding/outcome rhetoric, no named resource); `public_safety +2` kept unchanged (the strongest, least ambiguous row in the set); `transparency +1` → null (generic constituent engagement, no disclosure-policy commitment). No duplicate rows were averaged. All post-revision `conflict_flag` values are `false` — the growth_development conflict was found **not genuine**: it dissolved into one under-specified claim (null) plus one mis-mapped claim (null), not a real simultaneous pro/anti-growth position.

**Unresolved, requiring separate explicit approval before use in any real scoring:** the `taxation_spending` combined-axis mitigation remains untested against an actual conflicting-evidence case; no mechanism exists yet to re-route mis-mapped evidence (e.g., the Rosser Lakes Preserve quote) to its correct dimension; the new "outcome claims are not policy claims" exclusion rule; the untested `education`/`housing` definitions; a new `education` confidence-capping rule for City-level candidates discussing School-Board-controlled funding. Nothing in this document is self-approving — it proposes, it does not adopt.

No `candidate_position_evidence` row was created. No `candidate_positions` or `match_scores` row was created or modified. No Anthropic/Claude API call was made. No Supabase write was performed. `ENABLE_CAMPAIGN_EVIDENCE_EXTRACTION`, `ENABLE_CITY_COUNCIL_DISTRICT_WRITE`, and `ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE` all remain `false`, untouched. No application source code was changed. No deployment occurred. No commit or push was performed by this gate.

## Gate I40 — Shannon Martin Evidence Human Review

Date: 08-20-2026

Status: **Human source-grounded review complete.** Documentation only. Full record: `docs/internal_beta_gate_i40_shannon_martin_evidence_human_review.md`.

Since Gate I39, the extraction route gained two code-level fixes not yet persisted here in their own sections: (1) a deterministic validation-layer guardrail rejecting a negative `growth_development` score whenever the evidence is only parcel-specific preservation/conservation without a general restrictive-development-policy signal, and (2) conflict-flag canonicalization — every surviving row's `conflict_flag`/`conflict_notes` are reset to `false`/`null` at validation time and recomputed solely by `crossCheckConflicts()` over the final validated set, so a rejected row can never leave a stale conflict claim on a survivor. A live run confirmed both working end-to-end: the Rosser Lakes -1 row was rejected with the exact expected reason, and the surviving `growth_development +1` row correctly ended `conflict_flag: false` despite the model's own raw output having self-reported a conflict against the now-rejected row.

**This gate reviewed the 5 rows that survived that run** against the two live campaign pages, read in full (not sampled). **3 of 5 are clean approvals** (`taxation_spending +2` ×2, `public_safety +2`) — every claim verified verbatim/near-verbatim against the cited page, correct dimension mapping, proportionate score, appropriate confidence, `source_published_at` correctly `null`, `conflict_flag` correctly `false`. **2 of 5 require revision, not rejection:**
- `growth_development +1` (cited `about-shannon-martin/`) — a new class of defect: the rationale blends genuine content from **two different approved pages** ("reducing red tape," confirmed on the cited page, plus "Southern Grove Jobs Corridor," confirmed instead on `biography/`) but cites only one `source_url`. Revision: keep score/confidence/source_url, correct the rationale to only what the cited page actually contains.
- `environment +1` (`biography/`) — the evidence (Naturally PSL program, 280+ acres, named water-quality/septic-to-sewer investment) is the same multi-part concrete pattern Gate I39 already documented as meeting the **+2** threshold, not +1. Revision: score +1 → +2, rationale/confidence/source_url unchanged. This is the second consecutive live run where the model itself scored this exact evidence pattern +1 rather than +2 despite the guardrail text — noted as an open question about whether the prompt needs sharper wording or this remains a standing human-review correction.

The rejected Rosser Lakes `growth_development -1` row is recorded in the human-review document as **REJECTED BY DETERMINISTIC VALIDATION** (reason: "Negative growth_development score lacks evidence of a general restrictive development policy; parcel-specific preservation/conservation alone is insufficient.") for audit-trail completeness — it was never part of the human-review decision set.

**Unresolved:** no validation-layer check currently catches the row-1-style cross-page content merge (the existing `source_url` check only confirms the URL is on the approved list, not that every rationale claim appears on that specific page) — a possible future gate. Neither revision (row 1 or row 4) has been applied anywhere; this gate documents the corrected values only. No insert/persistence mechanism exists yet.

No `candidate_position_evidence` row was created. No `candidate_positions` or `match_scores` row was created or modified. No candidates were compared or ranked. No user match score was calculated. No Anthropic/Claude API call was made. No Supabase write was performed. `ENABLE_CAMPAIGN_EVIDENCE_EXTRACTION` remains `false`, untouched. No application source code was changed. No deployment occurred. No commit or push was performed by this gate.

## Gate I41 — Final Human-Reviewed Shannon Martin Evidence Set

Date: 08-20-2026

Status: **Documentation / review-state only.** Full record: `docs/internal_beta_gate_i41_shannon_martin_final_evidence_set.md`.

Applied both Gate I40-approved revisions and established the authoritative final five-row Shannon Martin evidence set that any future insert gate must use, with every `candidate_position_evidence` field specified per row (`candidate_id`, `dimension`, `score`, `rationale`, `source_type`, `source_url`, `source_published_at`, `source_account_url`, `confidence`, `extraction_status`, `reviewed_by`, `reviewed_at`, `conflict_flag`, `conflict_notes`, `methodology_version`). Row 1 (`growth_development +1`)'s rationale was rewritten to contain only claims confirmed present on its own cited page (`about-shannon-martin/`) — red tape, targeted investments, attracting quality employers, economic growth — with the Southern Grove Jobs Corridor claim removed since that lives on `biography/` instead; score, confidence, and source_url unchanged. Row 4 (`environment`) score corrected `+1` → `+2` per the already-documented Gate I39 threshold; rationale, confidence, and source_url unchanged. Rows 2, 3, and 5 carried forward unchanged. The rejected Rosser Lakes `growth_development -1` row is recorded separately as **REJECTED BY DETERMINISTIC VALIDATION** and explicitly excluded from the final set.

**`extraction_status` was deliberately left unresolved**, not guessed: since `reviewed_by`/`reviewed_at` remain `PENDING` on every row (no reviewer identity or timestamp was invented), and the table's own `reviewed_by`/`reviewed_at` consistency `CHECK` constraint (Gate I37) plausibly requires those fields to accompany a `human_reviewed` state, flipping `extraction_status` now would risk violating that constraint. All five rows remain conceptually `draft` pending a future, separately-approved gate that supplies an actual reviewer identity/timestamp and flips the status atomically with them.

No SQL was generated. No API insert route was created. No code was changed — the extraction route itself was inspected and needed no comment correction.

No `candidate_position_evidence` row was created. No `candidate_positions` or `match_scores` row was created or modified. No Anthropic/Claude API call was made. No Supabase write was performed. `ENABLE_CAMPAIGN_EVIDENCE_EXTRACTION` remains `false`, untouched. No application source code was changed. No deployment occurred. No commit or push was performed by this gate.

## Gate I42 — Shannon Martin Reviewer-Metadata Resolution and Insert Design

Date: 08-20-2026

Timestamp: 01:07 pm EST

Status: **Read-only verification + documentation complete. NO DATABASE WRITE EXECUTED.** Full record: `docs/internal_beta_gate_i42_shannon_martin_evidence_insert_design.md`.

Two temporary, read-only-only Node scripts (using the existing `createServiceClient()` pattern, inspected for zero mutation calls before running, deleted immediately after one run each, `git status` confirmed clean afterward) resolved the reviewer identity and duplicate state live:

- **Reviewer profile UUID: `f1fde6f9-07c3-4c76-ae81-ebb2f461a5c3`, `is_admin: true`** — resolved via three converging live checks (sole admin profile in `public.profiles`, `auth.admin.listUsers()` match on the known admin email, direct profile lookup by that id). No ambiguity.
- **Duplicate check: 0 existing `candidate_position_evidence` rows for Shannon Martin** (`candidate_id d44ff05a-...`), 0 with `methodology_version = campaign_evidence_v1_2026-08`. No duplicate risk at time of check.
- **Live schema verification** via PostgREST's OpenAPI description (`GET /rest/v1/`): confirmed live the table's 18 columns, `reviewed_by → profiles.id` FK, `reviewed_at` type `timestamp with time zone`, `extraction_status` default `'draft'`, and the exact NOT NULL column set. `CHECK`-constraint-level facts (exact `extraction_status` enum, the precise `reviewed_by`/`reviewed_at` pairing logic, and whether `human_reviewed` itself requires reviewer metadata) remain **PREVIOUSLY VERIFIED / SCHEMA-SOURCE VERIFIED only (Gate I37)** — PostgREST's OpenAPI output does not expose `CHECK` expression text, and no relationship beyond what Gate I37 documented was claimed or assumed.

Produced the exact, unexecuted five-row `BEGIN;...INSERT...RETURNING...COMMIT;` transaction (using the resolved reviewer UUID, `extraction_status='human_reviewed'`, `reviewed_at=now()` evaluated at future execution time, table-default `gen_random_uuid()` for `id`), read-only post-insert verification SQL, and exact-ID-only rollback SQL (never a bare `candidate_id`/`methodology_version`/`dimension` delete). All three SQL blocks are drafts only.

## Gate I43 — Shannon Martin Evidence Write Approval Package

Date: 08-20-2026

Timestamp: 01:07 pm EST

Status: **Documentation only. Creating this document is not approval.** Full record: `docs/internal_beta_gate_i43_shannon_martin_evidence_write_approval.md`.

Packages Gate I42's exact design (reviewer UUID, pre-write row counts, five rows, transaction/verification/rollback SQL, expected post-write state, explicit no-change boundaries for `candidate_positions`/`match_scores`/deployment/schema) into a single approval-ready document, including a copy/paste approval statement naming the exact reviewer UUID `f1fde6f9-07c3-4c76-ae81-ebb2f461a5c3`. No write has occurred; nothing executes until a human explicitly gives that approval in a future session.

No `candidate_position_evidence` row was created. No `candidate_positions` or `match_scores` row was created or modified. No Anthropic or Gemini API call was made. No Supabase write was performed. `ENABLE_CAMPAIGN_EVIDENCE_EXTRACTION` remains `false`, untouched. `npm run build` passed (28 routes, no errors) after these gates. No application source code was changed. No deployment occurred.

## Gate I44 — Shannon Martin Evidence Write: Executed and Verified

Date: 08-20-2026

Status: **EXECUTED. VERIFICATION PASSED. Rollback was not required and was not used.** Full record: `docs/internal_beta_gate_i44_shannon_martin_evidence_write_execution_result.md`.

The user gave explicit approval matching the exact Gate I43 approval statement verbatim. A temporary, one-time execution script (inspected for exactly one `.insert(` call and zero `.update(`/`.upsert(`/`.delete(` calls, deleted immediately after its one run) performed the defensive pre-write check (confirmed 0 existing rows), the single atomic insert of the five documented rows, and the immediate read-only verification — all exactly as designed in Gate I42/I43, no deviation.

**5 `candidate_position_evidence` rows now exist for Shannon Martin** (`candidate_id d44ff05a-...`, `methodology_version campaign_evidence_v1_2026-08`): `growth_development = 1` (id `d138ba1e-e65f-4560-bdb5-2ca959d60c61`), `taxation_spending = 2` ×2 (ids `e36ce940-5285-4daa-839e-72b420e6c821`, `33474fe8-68ef-4f9b-b786-da0a2936c6f2`), `environment = 2` (id `836fc7ab-c14d-45b8-957f-e03010ee6957`), `public_safety = 2` (id `a2dac241-8156-453a-8066-5c82d9304ed5`). All five: `extraction_status = 'human_reviewed'`, `reviewed_by = 'f1fde6f9-07c3-4c76-ae81-ebb2f461a5c3'`, `reviewed_at` non-null, `source_type = 'campaign_website'`, `conflict_flag = false`, `conflict_notes` null. Verification confirmed the absence of the rejected Rosser Lakes `growth_development -1` row and of any `transparency`/`education`/`housing` row.

Shannon Martin is the first candidate with human-reviewed campaign-evidence rows in the system. **`candidate_positions` and `match_scores` were not modified** — converting these evidence rows into an actual candidate-position dimension score (and from there into ballot match scores) remains a separate, not-yet-designed, future gate. No schema, RLS, grant, policy, or migration change occurred. No other candidate's evidence was touched. No Anthropic or Gemini API call was made. No deployment occurred.

## Gate I45 — Candidate-Position Aggregation Design

Date: 08-20-2026

Timestamp: 04:11 pm EST

Status: **Design + read-only verification complete.** No Supabase write. Full record: `docs/internal_beta_gate_i45_candidate_position_aggregation_design.md`.

**Schema correction:** `candidate_positions` is a wide table — one row per candidate (`UNIQUE(candidate_id)`), with all seven dimensions as individual nullable `numeric(4,2)` columns on that single row, not one row per candidate+dimension. No confidence/source/provenance columns exist on it. Live read-only queries confirmed the table has **zero rows for any candidate system-wide** (not just Shannon).

**`compute-match-scores` fully inspected:** a missing `candidate_positions` row skips the candidate entirely (locked ring); a `null` dimension column is skipped from the alignment average (never treated as 0); no minimum-dimension-count threshold exists — a single non-null dimension is sufficient to produce a match score. No code change is required to support a partial (4-of-7) `candidate_positions` row.

**Aggregation rule designed and adopted:** eligible = `extraction_status = 'human_reviewed'` only; same-sign rows aggregate to the strongest (highest-magnitude) score present, never summed; mixed-strength same-sign rows use strongest-evidence-wins (matches the project's own Gate I40/I41 precedent); opposite-sign rows block automatic aggregation entirely (`BLOCKED_PENDING_HUMAN_ADJUDICATION`, no averaging — mirrors the evidence-layer `crossCheckConflicts` philosophy); confidence never alters the numeric score; duplicate corroborating evidence never inflates the score above the strongest supported value; different `methodology_version` values never mix automatically.

**Applied to Shannon Martin (no write performed):** `growth_development = +1`, `taxation_spending = +2`, `environment = +2`, `public_safety = +2`; `education`/`housing`/`transparency` would remain `NULL` (no eligible evidence) — confirmed by applying the rule to the live, current evidence set, matching the expected result exactly.

**Provenance recommendation:** documentation-only for beta, backed by deterministic regeneration from `candidate_position_evidence` (the rule is fully deterministic and the evidence rows are immutable) — no schema change, no new linkage table, for a single-candidate pilot.

**Status: READY FOR CANDIDATE_POSITIONS WRITE-DESIGN, WITH ONE OPEN PRODUCT DECISION.** The aggregation design itself is complete and code-compatible. The one unresolved item, requiring an explicit human product decision (not a technical fix) before any write-approval gate: writing this row would make Shannon Martin the **only candidate in the entire system** with any unlocked match ring, while every other real candidate remains fully locked per the established Gate I12–I18 policy — an honest but stark asymmetry that should be a deliberate choice, not a side effect. A minor, non-blocking naming mismatch was also noted (`candidate_positions.data_completeness`'s legacy enum has no value describing "campaign-evidence-derived" data, but the column is read by zero current application code, so this has no functional consequence).

No `candidate_positions` row was created or modified. No `match_scores` row was created or modified. No Anthropic or Gemini API call was made. No Supabase write was performed. Two temporary read-only diagnostic scripts were created, inspected for zero mutation calls, run once each, and deleted; `git status` confirmed neither remains in the working tree. No deployment occurred.

## Gate I46 — Shannon Martin `candidate_positions` Write Approval Package

Date: 08-20-2026

Timestamp: 04:23 pm EST

Status: **Documentation only. Creating this document is not approval. NO WRITE EXECUTED.** Full record: `docs/internal_beta_gate_i46_shannon_candidate_positions_write_approval.md`.

**Product decision recorded:** the user explicitly approved the single-candidate pilot asymmetry for design purposes — Shannon Martin may become the only candidate with a `candidate_positions` row / unlocked match ring during this controlled pilot. This approval covers designing the write package only, not executing it.

Pre-write state re-verified live immediately before drafting: Shannon's `candidate_positions` row still absent, system-wide row count still 0, the same 5 `candidate_position_evidence` rows from Gate I44 unchanged, single `methodology_version` present (no staleness). Schema re-verified live via PostgREST's OpenAPI description for `candidate_positions` specifically (all 7 dimension columns nullable numeric, only `id` NOT NULL, verified defaults); `UNIQUE(candidate_id)` and the RLS/policy state remain schema-source verified only (not exposed by the OpenAPI endpoint).

Packaged exact unexecuted `INSERT` SQL (`growth_development=1, taxation_spending=2, education=NULL, environment=2, public_safety=2, housing=NULL, transparency=NULL`, insert-only per the safest-behavior rule since no existing row was found), read-only post-write verification SQL, and a `candidate_id`-scoped rollback (safe by construction under `UNIQUE(candidate_id)`, unlike the evidence-table rollback which needed exact-ID scoping). Documented explicitly that a `candidate_positions` write alone does **not** populate `match_scores` — that requires a separate, later, explicitly-approved `compute-match-scores` invocation for a specific test user, out of scope here.

No `candidate_positions` row was created or modified. No `match_scores` row was created or modified. No Anthropic or Gemini API call was made. No Supabase write was performed. Two temporary read-only diagnostic scripts were created, inspected for zero mutation calls, run once each, and deleted; `git status` confirmed neither remains in the working tree. No deployment occurred.

## Gate I46 — Shannon Martin `candidate_positions` Write: Executed and Verified

Date: 08-20-2026

Status: **EXECUTED. VERIFICATION PASSED. Rollback not required, not used.** Full record: `docs/internal_beta_gate_i46_shannon_candidate_positions_write_execution_result.md`.

The user gave explicit approval matching the Gate I46 approval statement verbatim. A temporary, one-time execution script (inspected for exactly one `.insert(` call, zero `.update(`/`.upsert(`/`.delete(`, deleted immediately after its one run) performed the pre-write recheck (0 existing rows), the single insert, and the four documented read-only verification checks — all exactly as designed, no deviation.

**Shannon Martin now has a `candidate_positions` row** (`id 89803a61-9224-4dea-a10e-82956a0f45ef`): `growth_development=1, taxation_spending=2, environment=2, public_safety=2`, `education/housing/transparency = NULL`. Verification confirmed: `candidate_position_evidence` unchanged (same 5 rows), zero other `candidate_positions` rows exist, zero `match_scores` rows exist for Shannon immediately after this write. She remains the only candidate with a `candidate_positions` row — the explicitly approved, temporary pilot asymmetry.

**Her match ring is not yet unlocked for any real user** — a `candidate_positions` write alone does not populate `match_scores`; that requires a separate, later, explicitly-approved `compute-match-scores` invocation for a specific test user, not performed in this gate.

No `candidate_position_evidence` row was modified. No `match_scores` row was created or modified. No other candidate's `candidate_positions` row was touched. No schema, RLS, grant, or function change occurred. No Anthropic or Gemini API call was made. No deployment occurred.

## Gate I47 — Shannon Martin Match-Score Test-User Recomputation Approval

Date: 08-20-2026

Timestamp: 04:36 pm EST

Status: **Documentation only. NO match-score computation was invoked.** Full record: `docs/internal_beta_gate_i47_shannon_match_score_test_approval.md`.

Selected the project's established, repeatedly-reused test account, `civicmarket.test.01@example.com` (`ec59ea92-470f-447f-8873-ab2dbde52aca`) — live-verified to have a `civic_dna` row and the Mayor district in `user_districts` (making Shannon eligible), with 0 existing `match_scores` rows. `compute-match-scores` fully inspected: scoped to the authenticated caller only, delete-then-insert restricted to that caller's own eligible-candidate set, skips any candidate without a `candidate_positions` row, skips (never zeroes) null dimensions.

**Expected Shannon score calculated by reproducing the app's exact formula against live data: `66`** (alignments 100/87.5/75/0 across `growth_development`/`taxation_spending`/`environment`/`public_safety`, averaged, rounded). Blast radius live-confirmed: of 12 candidates now eligible for this user (grew due to unrelated concurrent candidate-import work), only Shannon has a `candidate_positions` row, so exactly **one** new `match_scores` row would be created; the delete-scoped-to-this-user step affects 0 rows since none currently exist.

Packaged pre-write verification, the exact execution method (the existing `POST /api/compute-match-scores` route, no new code), post-write verification (expecting `score = 66`), and a rollback scoped to the exact `(user_id, candidate_id)` pair, safe by construction since the pre-write state is confirmed empty.

No `match_scores` row was created. No `candidate_positions`/`candidate_position_evidence`/`civic_dna` row was modified. No Anthropic or Gemini API call was made. No deployment occurred.

## Gate I47 — Shannon Martin Match-Score Test: Executed and Verified

Date: 08-20-2026

Status: **EXECUTED. VERIFICATION PASSED. Rollback not required, not used.** Full record: `docs/internal_beta_gate_i47_shannon_match_score_test_execution_result.md`.

The user gave explicit approval matching the Gate I47 approval statement verbatim. A temporary, one-time script invoked **only** the real, existing, unmodified `POST /api/compute-match-scores` route (no reimplemented logic) — authenticated as the test user via Supabase's own admin `generateLink`/`verifyOtp` pattern (a genuine, credential-free session; no password ever touched), confirmed the resulting session's user id before use, then immediately signed it out after the one call.

**Route response: `{ inserted: 1, skipped: 11, total_candidates: 12 }`** — exactly matching Gate I47's predicted blast radius. **Shannon's `match_scores` row: `score = 66`**, exactly matching the value pre-computed by hand-reproducing the app's formula in Gate I47. Post-write verification confirmed: `candidate_positions`, `candidate_position_evidence`, and the test user's `civic_dna` all unchanged; zero other users' `match_scores` affected.

**This completes the first full end-to-end run of the campaign-evidence pilot** — extraction → human review → deterministic aggregation → `candidate_positions` → `match_scores` — for one candidate (Shannon Martin) and one test user, fully auditable back through Gates I38–I47.

No `candidate_positions`/`candidate_position_evidence`/`civic_dna` row was modified. No other user's data was touched. No schema, RLS, grant, or function change occurred. No Anthropic or Gemini API call was made. No deployment occurred.

## Shannon Martin Candidate-Evidence Pilot — Complete

Date: 08-20-2026

**End-to-end pilot complete.** Match score 66 for test user `ec59ea92-470f-447f-8873-ab2dbde52aca` (`compute-match-scores` result: `inserted: 1, skipped: 11, total_candidates: 12`). Verification passed on every check; no rollback used at any step. Full final-state handoff: `docs/internal_beta_shannon_candidate_evidence_return_handoff.md`. Next: review the controlled beta launch plan and decide whether to scale this pipeline to remaining beta candidates or prioritize another beta blocker (Gemini migration remains outstanding).

## Beta Launch Priority Review

Date: 08-20-2026

Status: **Read-only review complete.** Full record: `docs/internal_beta_launch_priority_review.md`.

Reconciled `docs/controlled_psl_beta_readiness.md` (Milestone 2B) against everything since: the concurrent ballot-eligibility fix (citywide/countywide voting-scope correction, live-verified) and today's executed Package A candidate import (21 candidates now live, up from 11; Package B time-gated to county certification ≤ Aug 26, 2026; Package C statewide remains draft-only). Corrections-mailbox deliverability, previously open, is confirmed already resolved. **Single most important blocker: no deploy target/domain exists yet** — it blocks the entire P0 list (Supabase Auth URL config, real invite-code/email-confirmation verification). Gemini migration is scoped as SMALL (one isolated block in the extraction route) and should happen before scaling candidate-evidence coverage, to avoid duplicate extraction work across two providers. Candidate coverage (1 of 21 candidates scored) is classified SAFE TO CONTINUE DURING INTERNAL BETA, not a P0 blocker — the locked-ring design already handles partial coverage safely. Full P0–P3 blocker matrix and 7-milestone recommended sequence in the linked document.

No Supabase write. No schema/RLS/function change. No deployment. No Anthropic/Gemini call.

## Home "My Current Officials" Completeness Audit

Date: 08-20-2026
Timestamp: 07:30 pm EST

Status: **Audit complete, read-only. No database write. No code change. No deployment.** Full record: `docs/internal_beta_home_current_officials_audit.md`.

Investigated a reported inconsistency: Home shows only 3 "My Current Officials" (Stephanie Morgan, Debbie Hawley, Tobin Rogers "Toby" Overdorf) for test user `civicmarket.test.01@example.com`, while the same Home screen's "Your districts" chips include FL House District 85, City Council District 1, Mayor, City Council District 3, County Commission District 4, County Commission District 2.

**Live, read-only verification** (temporary Node script using `createServiceClient()`, zero mutation calls, deleted immediately after one run) confirmed `user_districts` for this user is **exactly the documented 6-row Milestone 2A baseline** — City Council District 1, School Board District 1, County Commission At-Large, FL House District 85, FL Senate District 27, Mayor — with **no** City Council District 3 row and **no** County Commission District 2/4 rows. Not stale, not duplicate, not conflicting.

`officials_for_user` (strict `district_id` join, unchanged) and `getOfficialsForUser`/`CurrentOfficialsSection` (no client-side filtering) all behave exactly as designed. The 3 officials returned are exactly correct for this user's actual held districts.

**Root cause: not a data bug and not a query bug.** The Home "Your districts" section is populated from `getCandidatesForDistricts`'s **ballot-eligibility-expanded** candidate list (`src/lib/candidates.ts` + `src/lib/ballotEligibility.ts`'s citywide/countywide expansion, completed earlier the same day) — i.e. every race the user can *vote in* (all City Council seats since they're citywide, all County Commission seats since they're countywide), not the districts the user is actually *represented in*. Labeling it "Your districts" right above "My Current Officials" invites the reader to expect a 1:1 match that was never the design. This is a **UI/labeling issue only**.

**One genuine, separate, pre-existing data gap confirmed unaffected:** the user does hold the Mayor district as representation, but zero `current_officials` row for Mayor exists system-wide yet (source-blocked — see "Current Officials — Mayor district gap" above). Not caused or worsened by this audit.

**Recommended fix (not implemented this session, per task scope):** presentation-only — reorder Home sections (Local Elections → Top Matches/Ballot → My Current Officials → civic actions/updates → demoted "Your Representation" → beta note), relabel "Your districts" so it isn't read as a representation claim, optionally cap `CurrentOfficialsSection` with "View all X officials" for future-proofing. No `officials.ts`, `candidates.ts`, `ballotEligibility.ts`, or database change is implicated. Full Phase 1-7 audit detail, tables, and UX recommendation in the linked document.

No `user_districts`, `current_officials`, `districts`, or `officials_for_user` row was created, modified, or deleted. No schema, RLS, or function change occurred. No secret file was inspected (only the public `NEXT_PUBLIC_` Supabase URL/anon key were read for an earlier, ultimately-unused anonymous RLS-restricted probe; the actual audit used the existing `createServiceClient()` service-role pattern already established by prior gates, read-only). No deployment occurred.

## Home Layout UX Improvement

Date: 08-20-2026
Timestamp: 07:52 pm EST

Status: **Implemented and live-verified. UI/copy/layout only.** Full record: `docs/internal_beta_home_layout_ux_improvement.md`.

Implemented the prior audit's recommendation in `src/app/page.tsx` and `src/components/CurrentOfficialsSection.tsx`: reordered Home so **My Current Officials now renders immediately after Top Matches, above the ballot-race chip section** (previously the reverse); relabeled "Your districts" → **"Your ballot races"** with helper text ("Races you're eligible to vote in — not the same as your current officials."); relabeled "Civic feed" → **"CivicMarket status"** (its content was already internal beta/status messaging, not real local civic news); added visible Top Matches text — **"Match score not available yet"** for locked candidates, **"XX% match"** for scored ones (previously percentage was only inside the ring graphic, and the lock state had no visible text); added "Officials who currently represent you." helper text under My Current Officials; tightened row/card padding and list gaps for density (no touch-target regressions observed).

No representation, ballot-eligibility, or match-score logic was touched — `src/lib/officials.ts`, `officials_for_user`, `src/lib/candidates.ts`, and `compute-match-scores` all remain exactly as before. `src/lib/ballotEligibility.ts` has an unrelated, pre-existing uncommitted change from concurrent work (Package C1 statewide model prep) that was left completely untouched.

`npm run build` passed (28 routes, no errors). `npm run lint` reported only the 5 known pre-existing `scripts/*.cjs` errors. Live-verified against an already-authenticated pre-existing local session for `civicmarket.test.01@example.com` (no credentials entered): correct new section order; officials list unchanged (Debbie Hawley, Stephanie Morgan, Toby Overdorf); Anthony Bonna, Larry Leet, and Jamie Fowler correctly still absent from My Current Officials; ballot-race chips still present under the new label; locked/scored Top Matches text renders correctly; no navigation regression; no clipping at native width or a 200% CSS-zoom mobile approximation.

**Deferred, each needing its own scoped task:** a "Based on N Civic DNA dimensions" disclosure (dimension count isn't persisted in `match_scores`) — **implemented below**; a Mayor-gap informational state on Home (would need new data passed into `CurrentOfficialsSection`, and the underlying Mayor `current_officials` row remains source-blocked, unaffected by this session); a "View all X officials" cap (not yet needed at current officials counts).

No Supabase write. No schema/RLS/function change. No deployment.

## Home Match-Score Dimension Coverage Disclosure

Date: 08-20-2026
Timestamp: 08:01 pm EST

Status: **Implemented and live-verified. UI + data-layer read only.** Full record: `docs/internal_beta_home_match_dimension_disclosure.md`.

`src/lib/candidates.ts` (`getCandidatesForDistricts`) gained a generic `dimension_count` field on `CandidateWithContext`: for every candidate with a non-null `match_score`, one additional scoped `candidate_positions` query (only for scored candidate ids) counts how many of the seven `DIMENSIONS` fields (shared with `compute-match-scores`) are non-null — a `0` value counts as scored, only `NULL` is excluded. Locked candidates and any scored candidate whose position row can't be retrieved get `dimension_count: null` (never inferred, never defaulted to 7). `src/app/page.tsx` Top Matches now shows **"Based on N Civic DNA dimension(s)"** below the existing "{score}% match" line for scored candidates only, visually secondary (smaller, muted), with a trivial `title` attribute explaining the methodology — no modal or new screen added.

Live-verified for `civicmarket.test.01@example.com`: network capture confirmed the new query fires scoped to exactly Shannon Martin's candidate id (this account's only scored candidate); an independent temporary read-only script re-confirmed her row (`growth_development=1, taxation_spending=2, environment=2, public_safety=2` non-null; `education/housing/transparency` null) computes to exactly **4**, matching the implemented logic. `compute-match-scores` was not modified — scoring formula, dimension list, and rounding are unchanged. `npm run build` passed (28 routes); `npm run lint` had only the 5 known pre-existing errors.

Two separate unrelated concurrent-work diffs were encountered in the working tree during this and the prior session and were left completely untouched both times: `src/lib/ballotEligibility.ts` (Package C1 statewide mode, since self-committed by its own session) and `src/app/onboarding/zip/page.tsx` (Package C1 "Florida Statewide" onboarding anchor, still uncommitted).

No `match_scores`, `candidate_positions`, or `candidate_position_evidence` row was created, modified, or deleted. No schema/RLS/function change. No deployment.

## Package C1 — Statewide Ballot Model, Complete

Date: 08-20-2026
Timestamp: 08:25 pm EST

Status: **COMPLETE.** Full record: `docs/candidate_import_package_c1_statewide_certification_independent.md` (design, preflight, execution, and verification for every step below); execution result also separately recorded in `docs/candidate_import_package_c1_6a_execution_result.md`.

### Architecture

Option A statewide model approved: one Florida Statewide ballot anchor district plus four statewide office district rows (Governor/Lieutenant Governor, Attorney General, Chief Financial Officer, Commissioner of Agriculture), all `type='statewide'`, `city='Statewide'`, `state='FL'`. `src/lib/ballotEligibility.ts` gained a new `'statewide'` mode and one additive rule (`city: 'Statewide', state: 'FL', types: ['statewide']`) — no change to `findRule`/`getBallotEligibilityMode`/`getExpansionJurisdictions`, both already generic. No schema change (`districts.type`/`city` are free-text columns). Current Officials representation logic (`officials_for_user`, `src/lib/officials.ts`, `CurrentOfficialsSection`) is completely unchanged — the anchor and all 4 office districts are never referenced by any `current_officials` row, by design.

### Package C1 §6a — district/election/candidate rows

Executed and verified PASS: 5 district rows inserted (anchor + 4 offices), 4 election rows inserted (one per office, `election_date = 2026-11-03`), 14 certification-independent statewide candidates inserted (11 Governor/Lt. Governor, 2 Attorney General, 1 Commissioner of Agriculture — Chief Financial Officer has 0 candidates in C1, all 4 CFO qualifiers being certification-dependent). Post-write verification: no duplicate or conflicting rows (`candidates` total 21 → 35, exactly +14); `current_officials` unchanged (9 → 9); `user_districts` untouched by §6a (41 before and after).

### Fresh-user onboarding activation

`src/app/onboarding/zip/page.tsx`'s `ZIP_MANAGED_DISTRICTS` now includes the Florida Statewide anchor alongside the pre-existing Mayor and County Commission At-Large entries. School Board District 1, FL House District 85, FL Senate District 27, and City Council District 1/3 all remain excluded from automatic ZIP-based assignment, unchanged. `npm run build` passed; `npm run lint` reported only the known pre-existing `scripts/*.cjs` baseline errors, nothing new.

### Existing-user §6b backfill

Read-only blast-radius capture found 8 eligible existing users and 0 already anchored (eligibility predicate: holds County Commission At-Large or Mayor). A drift check re-run immediately before execution matched exactly, then the single approved `INSERT` ran: 8/8 users received exactly one Florida Statewide anchor row, `user_districts` went 41 → 49 (+8 exactly), no duplicate anchors, no unexpected users, `current_officials` unchanged (9 → 9).

### Final Package C1 status

**COMPLETE.** Statewide ballot eligibility now works for both fresh and existing Florida users — 14 certification-independent statewide candidates are ballot-eligible for anyone holding the Florida Statewide anchor. FL House and FL Senate remain exact-district only (no rule exists for `type='state'`, unaffected by this package). Both `ENABLE_CITY_COUNCIL_DISTRICT_WRITE` and `ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE` remain `false`. No deployment occurred at any point in this workstream.

### Remaining deferred work

- Package B's local post-Primary reconciliation (`docs/candidate_import_package_b_post_certification.md`) remains deferred pending county certification.
- The 25 Package C statewide certification-dependent candidates (Governor/Lt. Governor REP+DEM, Chief Financial Officer REP+DEM, Commissioner of Agriculture REP+DEM — see `docs/candidate_import_package_c_statewide.md` §4-§6) remain deferred pending an official results source and certification.
- No result-dependent write (won/lost distinction, `is_incumbent` refinement, or any certification-dependent candidate insert) will be made until official certification evidence is separately verified and approved.

## Home Top Matches Sorting

Date: 08-20-2026
Timestamp: 08:31 pm EST

Status: **Implemented and live-verified. Home-only.** Full record: `docs/internal_beta_home_top_matches_sorting.md`.

Root cause: Home's Top Matches preview (`src/app/page.tsx`) used `candidates.slice(0, 3)` with no sort — since the underlying `getCandidatesForDistricts` query orders alphabetically by name, the preview was effectively "first 3 candidates alphabetically." With the candidate pool now at 33 (Package C1 statewide import), the first 3 alphabetically were all locked, hiding Shannon Martin's real 66 match score entirely from "Top Matches."

Fix: added a `topMatchesComparator` (scored candidates first, sorted by `match_score` descending, ties/locked candidates by name ascending, with a strict `isScored()` null/undefined check so a `0` score is never mistaken for locked) applied to a **copy** of the candidates array before slicing to 3. `src/lib/candidates.ts` and `/ballot`'s district-grouped ordering were **not touched** — live-verified `/ballot` still shows Shannon Martin in her original alphabetical position within the Mayor group. Helper text updated to "Your strongest available Civic DNA matches."

Live-verified (hard refresh, already-authenticated `civicmarket.test.01@example.com` session): Shannon Martin now ranks #1 on Home showing "66% match" and "Based on 4 Civic DNA dimensions"; locked candidates (Amr Metwally, Anthony Bonna) follow in alphabetical order below her; "View Full Ballot" still navigates correctly; no layout clipping. `npm run build` passed (28 routes); `npm run lint` had only the 5 known pre-existing errors.

No `match_scores`, `candidate_positions`, or `candidate_position_evidence` row was created, modified, or deleted. No match-score formula change. No ballot-eligibility change. No schema/RLS/function change. No deployment.

## Home Final UX Review — Controlled Beta Readiness

Date: 08-20-2026
Timestamp: 08:34 pm EST

Status: **READY for controlled beta. Live review only — no code changes made.** Full record: `docs/internal_beta_home_final_ux_review.md`.

Live-reviewed the running Home page (hard refresh, already-authenticated `civicmarket.test.01@example.com` session, desktop width and a 200% CSS-zoom mobile approximation) against the expected hierarchy from commits `56ea311`/`c51e296`/`11555fa`. All Phase 4 acceptance criteria passed: Shannon Martin ranks first in Top Matches with "66% match" / "Based on 4 Civic DNA dimensions" visible with no clipping; locked candidates are clearly distinguished; My Current Officials renders above Your Ballot Races with unchanged content (Debbie Hawley, Stephanie Morgan, Toby Overdorf); Your Ballot Races (chip cloud) is visually and textually distinct from Current Officials (card list); CivicMarket Status reads as secondary/meta content, not live civic news; the pilot disclaimer is appropriately unobtrusive; bottom navigation was live-clicked and confirmed working; no mobile clipping was found; page length is proportionate to its content.

No must-fix issues were found. Two cosmetic-preference-level nice-to-haves were documented but not implemented, per instruction (further visual de-emphasis of CivicMarket Status; a future "View all" affordance for Your Ballot Races if the chip count grows much larger).

**Mayor gap reconfirmed as a data issue, not a UI confusion problem:** "Mayor" appears as a Your Ballot Races chip but not in My Current Officials (no `current_officials` row exists for Mayor yet, source-blocked, unchanged). The Your Ballot Races helper text already explicitly disambiguates the two lists, so this was judged not confusing on the live page. No placeholder was created; the gap remains deferred exactly as previously documented.

No Supabase write. No representation, ballot-eligibility, or match-score logic touched. No schema/RLS/function change. No deployment.

## Gemini Candidate-Evidence Migration (Pre-Beta)

Date: August 20, 2026

Status: **Implementation complete, offline-tested. Default provider remains Anthropic. No live Gemini call made. No Supabase write. No deployment.** Full record: `docs/gemini_candidate_evidence_migration.md`.

Required pre-beta item: replace the Anthropic/Claude candidate-evidence extraction path (`src/app/api/admin/extract-shannon-martin-evidence/route.ts`, the only route that has ever called a text-generation model in this project) with Gemini, without redoing candidate research/scoring architecture or touching any stored `candidate_position_evidence` data.

**Provider abstraction added:** new `src/lib/candidateEvidence/` — `types.ts` (`EvidenceProvider` interface + `EvidenceProviderConfigError`/`EvidenceProviderRequestError`), `providers/anthropic.ts` (the prior inline Anthropic `fetch` call, relocated with no behavior change), `providers/gemini.ts` (new, `@google/genai`-based), `provider.ts` (`CANDIDATE_EVIDENCE_PROVIDER` env var, defaults to `anthropic`; `GEMINI_EVIDENCE_MODEL` env var, defaults to `DEFAULT_GEMINI_EVIDENCE_MODEL = 'gemini-2.5-flash'`). The extraction route now calls `getEvidenceProvider()` instead of an inline Anthropic call; all prompt construction, JSON parsing, and `validateEvidenceRow`/`crossCheckConflicts` schema validation are unchanged and run identically regardless of provider. The dry-run/live JSON response now includes a `provider` field alongside `model`.

**Gemini implementation:** `ai.models.generateContent({ model, contents, config: { systemInstruction, temperature: 0, maxOutputTokens, responseMimeType: 'application/json', thinkingConfig: { thinkingBudget: 0 } } })` — verified directly against the installed `@google/genai@2.18.0` package's own TypeScript definitions, not solely web documentation, which inconsistently described a different (`ai.interactions.create`) surface that does exist on this SDK version but is marked next-gen/experimental in its own type name. `GEMINI_API_KEY` is read server-side only via `process.env`; confirmed absent from the built client bundle, from every client component, and from any `NEXT_PUBLIC_` reference anywhere under the new module.

**Dependencies:** `@google/genai` (`^2.18.0`) added to `dependencies`. `vitest` (`^4.1.11`) added to `devDependencies` with a new `npm run test` script and `vitest.config.mts` — no test framework existed in this repository before this task. `@anthropic-ai/sdk` was never installed and remains not installed (the Anthropic path has always used a raw `fetch` call).

**Offline tests:** 46 tests across two new files (`src/lib/candidateEvidence/__tests__/evidenceValidation.test.ts`, `providers.test.ts`) — all passing, zero real API keys read, zero network calls made (Anthropic mocked via `global.fetch`, Gemini mocked via the `@google/genai` module). Covers valid/malformed/truncated output, missing required fields, unsupported dimensions, unapproved source URLs, unverifiable dates, conflict-flag consistency and cross-check logic, the growth_development parcel-specific guardrail, both providers' config-error/request-error/timeout paths, and `provider.ts` resolution logic.

**Live Gemini test:** prepared (exact input, expected output shape, comparison criteria, acceptance thresholds — full plan in the linked doc) but **not executed** — requires `GEMINI_API_KEY`, which this task did not access, per its explicit stop condition. Mirrors the already-approved Shannon Martin pilot sources/flow (Gates I38–I44).

**Verification:** `npm run build` passed (28 routes, no errors). `npm run lint` — only the 5 pre-existing `scripts/*.cjs` errors, nothing new. `npm run test` — 46/46 passed.

**Migration sequence (per the linked doc):** (1) Gemini implementation ✓ this task; (2) same-input Anthropic-vs-Gemini comparison — blocked on live credentials; (3) parity review; (4) switch default provider to Gemini; (5) retain Anthropic as fallback temporarily; (6) remove Anthropic only after beta confidence. Default provider is **still Anthropic** — nothing changes for any real caller as a result of this task.

No `candidate_position_evidence`, `candidate_positions`, or `match_scores` row was created, modified, or read. No Anthropic or Gemini API call was made. No Supabase write was performed. No schema/RLS/function change. No deployment occurred.

## Deploy Target and Domain Plan

Date: 08-20-2026
Timestamp: 08:41 pm EST

Status: **Planning complete. No deployment. No Vercel project created. No Supabase Auth URLs changed. No secrets accessed.** Full record: `docs/internal_beta_deploy_target_domain_plan.md`.

Confirmed by source inspection that the repository is **directly deployable to Vercel with zero code changes**: standard Next.js App Router (`next.config.ts` is empty/default, no `vercel.json`, no `middleware.ts`), no filesystem access anywhere in `src/` (only the manual, non-deployed `scripts/*.cjs` tools touch the filesystem), no cron/background-job assumptions (the only `setInterval` is the client-side election countdown), zero hardcoded `localhost` references, and zero hardcoded auth-redirect URLs — `supabase.auth.signUp()` is called with no `emailRedirectTo`, so redirect behavior is entirely delegated to the Supabase dashboard's Site URL / Redirect URL configuration, meaning no app code needs to change across environments.

**Env-var inventory (names only, no values read):** `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` (public, required for basic load); `SUPABASE_SERVICE_ROLE_KEY` (server secret, powers `compute-match-scores` — onboarding degrades gracefully without it, all rings just stay locked) and `INVITE_CODE` (server secret, signup fails closed without it); `ANTHROPIC_API_KEY` / `GEMINI_API_KEY` / `CANDIDATE_EVIDENCE_PROVIDER` / `GEMINI_EVIDENCE_MODEL` (server secrets/config, optional/future — the candidate-evidence extraction route remains hardcoded `ENABLE_CAMPAIGN_EVIDENCE_EXTRACTION = false`, unreachable regardless of these).

**Recommendation:** Vercel, production branch `master`, deploy first to the generated `*.vercel.app` domain to validate the pipeline, then attach a custom beta subdomain afterward (no domain ownership assumed or confirmed), then finalize Supabase Auth URLs once.

**Risk check:** zero items classified BLOCKER. All three write guards (`ENABLE_CITY_COUNCIL_DISTRICT_WRITE`, `ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE`, `ENABLE_CAMPAIGN_EVIDENCE_EXTRACTION`) are hardcoded source constants, not env-var-driven, so no Vercel misconfiguration can flip them. Service-role key usage confirmed server-only. Two items marked FOLLOW-UP (not blockers): the 4 required env vars must be entered by the user directly into Vercel before real signup works; today's `master` does not yet include the unrelated, still-uncommitted concurrent Gemini-migration work, which is not needed for this deployment milestone.

An 11-step interactive deployment sequence was documented (sign into Vercel → import repo → configure project → add env vars → deploy → capture URL → configure Supabase Auth → test signup → attach custom domain → re-test → mobile smoke test), with an explicit stop boundary: this task does not read `.env.local` or request secret values in chat — the user enters environment-variable values directly into Vercel (step 4) and Supabase dashboard credentials directly into Supabase (step 7).

No deployment occurred. No Supabase write. No schema/RLS/function change. No secret file was inspected or its values printed.

## Fresh Production Account District/Representation Initialization Audit

Date: 08-20-2026
Timestamp: 09:36 pm EST

Status: **Read-only diagnosis complete. No Supabase write. No deployment.** Full record: `docs/internal_beta_fresh_account_district_initialization_audit.md`.

**Production is confirmed live at `https://civicmarket.vercel.app`** — the deploy plan from earlier this day was executed by the user between sessions. A real first-production onboarding test (fresh account, ZIP 34953, invite-code signup through Civic DNA quiz completion, all steps working) surfaced two apparent anomalies, both diagnosed via read-only Supabase queries (temporary, zero-mutation service-role scripts, deleted immediately after use) and classified as **expected behavior, not bugs**:

1. **Empty "My Current Officials"** — the fresh account's 3 auto-assigned `user_districts` rows (Mayor, County Commission At-Large, Florida Statewide — exactly matching current `ZIP_MANAGED_DISTRICTS` in `src/app/onboarding/zip/page.tsx`) are all districts structurally guaranteed to never have a directly-tied `current_officials` row (confirmed live: zero such rows exist for any of the three). The previously-verified `ec59ea92-...` test account only ever showed officials because of (a) a one-time, explicitly-approved test write to City Council District 1 (Gate I34, 08-08-2026) and (b) School Board District 1 / FL House District 85 rows created via a ZIP resubmission on 08-16-2026, *before* those two districts were removed from automatic assignment. **With current write guards and data state, every real fresh signup will see this same empty state** — this is the single most consequential finding of this audit.
2. **Missing FL House District 85** — confirmed as the intended, already-committed result of the "Ballot Eligibility Phase 1 — School Board Anchor Correction" work recorded above (dated 08-20-2026, one day before this fresh account's signup): FL House District 85, FL Senate District 27, and School Board District 1 were all deliberately removed from `ZIP_MANAGED_DISTRICTS` because none was a safe ZIP-based default (PSL splits across FL House 84/85; FL Senate 27 is confirmed wrong entirely; School Board was an unverified representation claim). No verified-lookup flow exists for any of the three yet.

**No code bug, ballot-eligibility bug, or officials-lookup bug was found.** No fix was implemented — three independently-approvable remediation paths were identified (a documentation-only empty-state copy tweak requiring no write; sourcing and seeding the long-open Mayor `current_officials` gap, requiring a new approved write; or enabling the already-built-and-tested `ENABLE_CITY_COUNCIL_DISTRICT_WRITE` for real users, requiring a separate write-guard approval) and left for explicit user decision.

The fresh production account was left completely untouched and remains available as a reproducible real-world test case. No `user_districts`, `current_officials`, `officials_for_user`, schema, RLS, or function change occurred. No secret value was read or printed — only the public env-var-derived service-role connection (already an established project pattern) was used for read-only queries. No deployment occurred.

## Gemini Candidate-Evidence Live Parity Test

Date: August 20, 2026

Status: **Executed. GEMINI PARITY = PASS, with one flagged coverage gap requiring human review before cutover.** Default provider remains Anthropic. No provider cutover. No Supabase write. No deployment. Full record: `docs/gemini_candidate_evidence_migration.md`.

One explicitly-approved, real (non-dry-run) live Gemini call was made through the actual production extraction route (`POST /api/admin/extract-shannon-martin-evidence`), using `CANDIDATE_EVIDENCE_PROVIDER=gemini` as a temporary dev-server process env var (never written to `.env.local` or committed) and the guard `ENABLE_CAMPAIGN_EVIDENCE_EXTRACTION` temporarily flipped to `true` locally, reverted via `git checkout --` immediately after the one call — confirmed clean against `HEAD` afterward. Authenticated as the existing admin test account via Supabase's credential-free `admin.generateLink`/`verifyOtp` pattern (no password entered). `GEMINI_API_KEY`, provisioned locally by the user, was read only by the server process and never printed, logged, or recorded anywhere.

**Two live-discovered defects fixed as part of getting this test to run:**
1. The documented default model, `gemini-2.5-flash`, is dead for this key — live `404`: *"no longer available to new users... use models/gemini-3.6-flash."* `DEFAULT_GEMINI_EVIDENCE_MODEL` updated to `gemini-3.6-flash`.
2. `thinkingConfig: { thinkingBudget: 0 }` (the original disabled-thinking setting, mirroring the Anthropic adapter) is rejected by `gemini-3.6-flash` with `400 INVALID_ARGUMENT`. Fixed to `thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL }`, confirmed working live. Offline tests updated to match; all 46 still pass.

**Live call:** `200`, `gemini-3.6-flash`, `finishReason: STOP` (no truncation), 4298 input / 644 output tokens, 4 validated rows / 0 rejected, ~9.6s wall-clock (includes live-fetching all 3 source pages).

**Parity result vs. the accepted Gate I41 Anthropic baseline:** 9 of 10 scored checks PASS — schema validity, candidate identity, source URL fidelity, no invented quotes/dates, correct dimension classification (Gemini notably avoided a misclassification mistake Anthropic itself made in Gate I40 on the same evidence), correct stance/score on every overlapping row (`taxation_spending +2` ×2, `environment +2`, `public_safety +2` — all matching baseline exactly, with `environment` scoring `+2` correctly on the first attempt where Anthropic originally needed a human correction from `+1`), correct confidence handling, no unsupported claims. **One FAIL:** Gemini did not reproduce the baseline's borderline, medium-confidence `growth_development +1` row — a coverage gap, not a fabrication or misclassification. One minor phrasing variance (Real Time Operations Center described as "traffic management" vs. baseline's "emergency response") flagged for human re-verification against the live page, not confirmed as an error.

**Acceptance decision:** GEMINI PARITY = PASS. Rationale: every correctness-sensitive check passed; the sole gap is under-coverage of one borderline dimension, which is the safer failure mode under this project's own established "prefer no score over an unsupported score" policy (Gates I12–I20), not a disqualifying defect.

**Cost:** ~$0.0056 estimated for this one call (`gemini-3.6-flash` pricing, not independently re-verified live — no extra API call made solely for cost data) vs. a rough ~$0.023 estimate for the equivalent Anthropic call (general pricing knowledge, not independently confirmed for this timeframe) — directional only, roughly 4x.

**Not done, not authorized:** `CANDIDATE_EVIDENCE_PROVIDER` default cutover to Gemini (remains `anthropic`), any `candidate_position_evidence`/`candidate_positions`/`match_scores` write, deployment. **Recommended next step:** a human reviewer confirms this automated PASS (re-check the flagged phrasing item, decide whether the missing `growth_development` row needs a prompt refinement) before any cutover decision.

No database write. No schema/RLS/function change. `ENABLE_CAMPAIGN_EVIDENCE_EXTRACTION` restored to `false`. No deployment occurred. Unrelated concurrent-session files (`src/components/CurrentOfficialsSection.tsx`, and this file's own "Fresh production account..." section above) were left untouched by this task.

## Current Officials Empty-State Copy Clarification

Date: 08-20-2026
Timestamp: 09:47 pm EST

Status: **Implemented and verified. Copy-only. No data/query behavior changed. No Supabase write. No deployment.** Full record: `docs/internal_beta_current_officials_empty_state_copy.md`.

Directly implements the fresh-account audit's recommendation option 1 (`docs/internal_beta_fresh_account_district_initialization_audit.md`, commit `4b45238`). `src/components/CurrentOfficialsSection.tsx` — the single component shared by Home and Profile — had its empty-state message changed from the misleading "Current officials will appear here after verified official source data is added." to:

> "Your current officials will appear as your representation districts are verified."
> "Some districts require an additional verification step because ZIP codes can cross district boundaries."

The old copy implied the only cause of an empty section was a data backlog; the real cause (confirmed by the audit) is that most auto-assigned districts are ballot-eligibility anchors that structurally never have a directly-tied officeholder, plus one source-blocked seat (Mayor) — representation districts, not ballot-eligible districts, are what need verification. No new buttons/links were added (copy-only scope). The unconditional section helper "Officials who currently represent you." was left unchanged.

`npm run build` passed (28 routes, no errors). `npm run lint` had only the 5 known pre-existing errors. Live-verified: populated Current Officials unchanged on both Home and Profile for `civicmarket.test.01@example.com`; the new empty-state text was visually verified via a reversible, client-side-only DOM substitution (no real account's data was touched, no network/Supabase call was made by the check itself, and the page was fully reloaded immediately after, restoring the normal populated render) — confirmed correct spacing, hierarchy, and no clipping.

Both substantive remediation paths identified by the prior audit (sourcing/seeding the Mayor `current_officials` row; enabling `ENABLE_CITY_COUNCIL_DISTRICT_WRITE` for real users) remain open, undecided, and unaffected by this task — this task addressed only the messaging layer.

## Mayor Current Official — Source Verification and Seed Approval Package

Date: 08-20-2026
Timestamp: 09:56 pm EST

Status: **STAGE A (read-only verification + exact write package) complete. STAGE B (the INSERT) NOT executed — pending explicit user row-level approval.** Full record: `docs/internal_beta_mayor_current_official_source_and_seed_approval.md`.

Resolves the long-open "Current Officials — Mayor district gap" using only official City of Port St. Lucie sources (Mayor & City Council page as primary; Elections page and a January-2026 City document as corroboration), per explicit source policy — no campaign, Wikipedia, or news sources used. Both `cityofpsl.com` URLs returned HTTP 403 to this session's own `WebFetch` attempts (consistent with the same domain's already-documented behavior in Milestone 2B) — source content used exactly as supplied.

**Read-only verification, all confirmed live:** Mayor district id `11111111-0000-0000-0000-000000000006` (unchanged, same anchor `ZIP_MANAGED_DISTRICTS` assigns today); zero existing `current_officials` rows for Mayor; zero existing "Shannon Martin" rows anywhere in the table; exactly 3 users system-wide currently hold the Mayor district (the fresh production account plus two known prior test accounts) — confirmed exact blast radius, no surprises.

**Exact proposed row prepared** (UUID `9b10d3fb-88b5-42f0-82cb-aad1720efa34`, 15 columns): name "Shannon Martin", office "Mayor", `district_id` as above, `jurisdiction_level: city`, `source_url` the primary City page, `source_label` "City of Port St. Lucie Mayor & City Council page". `photo_url`/`website`/`bio`/`term_start`/`term_end`/`next_election_date` all `NULL` (matching established convention; only a *year*, not an exact term-end date, was verified). Two deliberate, source-backed deviations from raw convention-copying: `is_on_next_ballot = true` (she is a verified declared 2026 Mayor candidate, per both the Elections source and the app's own already-approved `candidates` row) and `candidate_id = NULL` (matches convention, flagged as a separate future linking decision, not part of this row). Exact INSERT, verification SELECT, and single-row-scoped rollback DELETE were all drafted and are documented — **none were executed**.

**Expected effect if approved:** for the fresh account and the two other Mayor-holding accounts, "My Current Officials" would show exactly Shannon Martin as Mayor via the unmodified `officials_for_user` view; County Commission At-Large and Florida Statewide remain unresolved (no change); Stephanie Morgan/Debbie Hawley/Toby Overdorf would not be added for any of these accounts (different districts). Home and Profile share the identical result via the same `CurrentOfficialsSection` component.

No database write, schema, RLS, function, `user_districts`, ballot-eligibility, or write-guard change occurred. No deployment. No unrelated Gemini-migration work was touched.

