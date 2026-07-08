# CivicMarket Current State

Last updated: July 7, 2026 (County Commission district assignment lookup Gate 10)

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
