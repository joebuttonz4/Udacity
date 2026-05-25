# Changelog

## 2026-05-25 (civic feed strategic planning)

- Added docs/design/CIVIC_FEED_STRATEGY.md as the source-of-truth strategy document for the civic feed.
- Repositioned the civic feed from a secondary election-season feature to a core year-round civic awareness pillar.
- Documented beta-safe civic intelligence direction: AI-powered personalized local government awareness.
- Documented semi-automated feed planning with government-source ingestion, AI-assisted summaries, and required admin review before publishing.
- Kept public posting, unrestricted comments, autonomous publishing, Edge Functions, scraping automation, and advanced multi-city crawling deferred until separately approved.
- Updated CIVICMARKET_CURRENT_STATE.md and docs/ACTIVE_SPRINT.md to reflect the planning direction.
- No code changes. No Supabase schema changes. No RLS or policy changes. No data changes.

## 2026-05-17 (coastal UI design system — session 4)

- Applied full coastal Florida mobile consumer UI design system. No data changes. No Supabase schema, RLS, or policy changes. No new routes.
- Brand PNG assets added to `public/brand/`:
  - `home-hero-coastal.png` — warm sunrise/palm scene used on Home hero.
  - `candidate-hero-palms.png` — dark moody teal/palm scene used on candidate profile and compact dark headers.
  - `dna-hero-coastal-light.png` — light pastel beach scene used on Civic DNA teaser.
- `src/components/CoastalHero.tsx` updated — dark variant now uses PNG background images via `<img>` (decorative, `aria-hidden`). `warm=true` renders `home-hero-coastal.png`; `warm=false` renders `candidate-hero-palms.png`. Dark gradient overlay for text readability. Teal atmospheric accent + horizon shimmer preserved. SVG illustration (`public/brand/florida-coast-hero.svg`) superseded but kept in repo.
- `src/app/onboarding/dna-teaser/page.tsx` updated — hero section uses `dna-hero-coastal-light.png` with a left-to-right white gradient overlay (`from-white/92 via-white/78 to-white/20`) that protects left-aligned dark text while keeping image visible on the right. Title `text-slate-950`, subtitle `text-slate-700`.
- `src/app/page.tsx` updated — countdown hydration mismatch eliminated: changed from `useState(computeCountdown)` lazy initializer (which called `Date.now()` on the server) to `useState<Countdown | null>(null)` with a named inner `tick()` function inside `useEffect`, preventing any server/client time divergence. Countdown renders `--` before client mount, then live 4-box seconds-tick values. Countdown boxes changed to `bg-black/[0.22]`, labels to `text-white/70 text-[11px] font-medium` for readability over image. Candidate rows given rank badges (1/2/3). "Civic Pulse" section heading renamed to "Civic Feed."
- `src/app/candidates/[id]/page.tsx` — candidate avatar enlarged: `w-16 h-16` → `w-20 h-20`, initials `text-2xl` → `text-3xl`. `pb-28` bottom padding. Content always scrollable (no scroll-locked tab system).
- `src/app/ballot/page.tsx` — `pb-28` bottom padding confirmed.
- `src/app/vote/page.tsx` — `pb-28` bottom padding confirmed.
- `src/app/profile/page.tsx` — `pb-28` bottom padding confirmed.
- `src/app/measures/[id]/page.tsx` — `pb-28` bottom padding confirmed.
- `docs/design/README.md` — new file documenting approved coastal design direction, brand assets, design tokens, and preservation requirements.
- Tests run: `npm run lint` (0 errors), `npm run build` (clean). Commit `415e732` (plus subsequent accessibility patch commits).

## 2026-05-17 (post-grant-patch smoke test)

- Smoke testing run after commit `51ca84d` (Supabase security grant patch). No code changes. No database changes. No RLS policy changes. No schema changes.
- Routes tested and results:
  - `/` — loaded successfully.
  - `/admin/entry` — loaded successfully. Inserted TEST ONLY row: issue_title `TEST ONLY - Grant patch smoke test`, candidate Angela Torres, bill number `TEST-GRANT-SMOKE`, vote cast abstain, dimension transparency, source URL `https://www.cityofpsl.com/`. No permission error on insert.
  - `/admin/records` — loaded successfully. TEST ONLY row appeared as expected. Remove → Confirm delete path executed; row disappeared from list. No real rows deleted. No permission error on list or delete.
  - `/ballot` — loaded; candidate cards appeared; card links worked; bottom nav appeared; no permission/data error. Known issue: match rings did not show.
  - `/profile` — loaded; showed normal profile/DNA state; no permission/data error. Known issue: sign out not visible.
  - `/data-sources` — loaded successfully.
  - `/report` — loaded successfully; UI-only submit showed beta/no-recorded message; no database-backed report created.
  - `/vote` — loaded successfully.
  - `/candidates/[id]` (one profile) — loaded successfully with voting records and source links. Known issue: Report Inaccuracy link/button missing.
  - `/measures/[id]` — not tested; no measure exists in current dummy data.
- Security grant patch confirmed: no permission errors on any tested route.
- Fixes needed before beta:
  1. Ballot match rings not showing.
  2. Profile sign out not visible.
  3. Candidate profile Report Inaccuracy link/button missing.
  4. `/measures/[id]` needs measure data before it can be tested.
- Next priority: fix the three known issues, then replace dummy PSL data with real validated PSL data.

## 2026-05-17 (Supabase security grant patch)

- Applied Supabase security grant patch manually in SQL Editor. No code changes. No RLS policy changes. No schema changes. No data deleted.
- Change 1 — Revoked overly-broad privilege types from `anon` and `authenticated` roles across all public tables:
  ```sql
  REVOKE TRUNCATE, TRIGGER, REFERENCES
  ON ALL TABLES IN SCHEMA public
  FROM anon, authenticated;
  ```
  Verification: inspection query returned no remaining TRUNCATE, TRIGGER, or REFERENCES grants to `anon` or `authenticated` on any public table.
- Change 2 — Revoked INSERT/UPDATE/DELETE grants from `anon` and `authenticated` only on tables where no matching RLS policy existed (DO block, `matching_policy_count = 0` condition):
  Verification: inspection query returned no rows — no remaining `anon` or `authenticated` INSERT/UPDATE/DELETE grants exist without a corresponding RLS policy.
- Post-patch verification:
  - RLS remains enabled on all public tables — confirmed.
  - `profiles.is_admin` confirmed not browser-writable.
  - `match_scores` has SELECT policy only — no INSERT or UPDATE policy.
  - `reviews` has SELECT and INSERT only — no UPDATE policy.
- Next priority: run full app smoke tests to confirm onboarding, ballot, candidate profile, and admin flows still work, then replace dummy data with real PSL data before beta.

## 2026-05-17 (admin voting-record removal)

- Added voting-record removal controls to `/admin/records` (commit `31adca9`).
- Files changed:
  - `src/app/admin/records/page.tsx` — added `pendingDeleteId`, `deleting`, and `deleteError` state. Added `handleDelete(id)`: calls `supabase.from('voting_records').delete().eq('id', id)` by exact UUID; on success removes the row from local state and clears `pendingDeleteId`; on failure sets `deleteError` inline and keeps the row visible; `deleting` is always cleared in `finally`. Added Remove button to each card (first click opens confirmation only — no Supabase call). Inline confirmation panel shows `issue_title`, candidate name, and warning: "This permanently deletes the voting record. This cannot be undone." Cancel resets `pendingDeleteId` and `deleteError`. Both buttons disabled while `deleting`. Added scored-record guard: if `community_score_count > 0` or `community_score_final` is not null, Remove is replaced by "Scored records require manual review before removal." `community_score_count` and `community_score_final` added to SELECT. Banner updated: "Admin only. Deletions are permanent and cannot be undone." No bulk delete. No automatic delete. Deletes by exact `id` only.
- Supabase RLS changes (verified in SQL Editor):
  - Added: `"Admins can delete voting records"` on `voting_records` for DELETE — restricts to `profiles.is_admin = true`.
  - Unchanged: `"Admins can insert voting records"` for INSERT.
  - Unchanged: `"Voting records are publicly readable"` for SELECT.
- Deletion is hard delete — `voting_records` has no soft-delete field. `vote_community_scores` rows cascade-deleted automatically (0 rows for the test row).
- Browser-tested with admin account joebuttonz4@gmail.com:
  - Remove → Cancel path tested: row remained visible, no deletion occurred.
  - Remove → Confirm delete path tested: TEST ONLY row deleted.
  - Test row id `5a0e22b2-ed14-430d-995d-a333bb5d2838` (issue_title: `TEST ONLY - Admin voting record entry`, candidate: Angela Torres) confirmed gone — `SELECT` by that id returned no rows. Linked `vote_community_scores` count was 0.
- Tests run: `npm run lint` (0 errors), `npm run build` (clean, 18 routes).
- No schema changes. No seed data changes.
- Next priority: patch remaining Supabase security risks, then replace dummy data with real PSL data before beta.

## 2026-05-17 (admin voting-record review page)

- Built read-only admin voting-record review page at `/admin/records` (commit `93342f3`).
- Files changed:
  - `src/app/admin/records/page.tsx` — new client component. Auth-gated: checks `getSession` then queries `profiles.is_admin`; non-admin users (including unauthenticated) redirect to `/`. Fetches all `voting_records` joined to `candidates (name, office)`, ordered by `created_at` descending (newest first). Displays per record: candidate name and office, issue title, bill number (conditional — omitted when null), vote cast pill (teal/For, red/Against, gray/Abstain), dimension label (human-readable), vote date (UTC-safe local parse for date-only strings), source URL as a clickable link guarded by `isSafeUrl`, and "Added [date]" from `created_at`. Record count shown above list. Loading skeleton, error card, and empty state included. Always-visible beta banner: "Review only. Removal controls are intentionally not enabled yet." No delete button, no delete logic, no DELETE RLS policy. No public-facing UI changes. Tailwind only, zero `style=` attributes.
- No Supabase RLS changes. No schema changes. No seed data changes. No existing files changed.
- Tests run: `npm run lint` (0 errors), `npm run build` (clean, 18 routes including `/admin/records`).
- Deferred: voting-record removal controls — blocked until explicit SQL/RLS approval (same gate as report submission).

## 2026-05-17 (admin voting-record entry)

- Built minimal admin voting-record entry page at `/admin/entry` (commit `e24fe14`).
- Files changed:
  - `src/app/admin/entry/page.tsx` — new client component. Auth-gated: checks `getSession` then queries `profiles.is_admin`; non-admin users (including unauthenticated) redirect to `/`. Loads active candidates (`archived_at IS NULL`) ordered by name. Form fields: candidate (select), issue title, issue description, bill/resolution number (optional), vote date, vote cast (for/against/abstain), Civic DNA dimension (all seven locked keys), source URL. `source_url` is required and validated with `isSafeUrl` (must start with `https://` or `http://`). On submit, inserts one row into `voting_records`. Success state shows saved title and "Add another record" button. No public-facing UI changes. Tailwind only, zero `style=` attributes.
- Supabase RLS changes (verified in SQL Editor):
  - Added: `"Admins can insert voting records"` on `voting_records` for INSERT — restricts insert to `profiles.is_admin = true`.
  - Unchanged: `"Voting records are publicly readable"` SELECT policy — remains in place.
- Browser-tested with admin account joebuttonz4@gmail.com. Test row verified in Supabase:
  - id: `5a0e22b2-ed14-430d-995d-a333bb5d2838`, issue_title: `TEST ONLY - Admin voting record entry`, candidate: Angela Torres.
  - Test row remains in the database — not deleted.
- Tests run: `npm run lint` (0 errors), `npm run build` (clean, 17 routes including `/admin/entry`).
- No schema changes. No seed data changes. No existing files changed beyond new page file.
- Next priority: minimal admin review/removal page.

## 2026-05-16 (data sources page)

- Built static Data Sources page at `/data-sources` (commit `b81e8ef`).
- Files changed:
  - `src/app/data-sources/page.tsx` — new client component. Auth-gated (redirects to `/onboarding` if no session). Auth check only — no Supabase reads beyond `getSession`, no data table queries, no writes, no tables, no RLS policies. Five static methodology sections: Candidate information, Voting records, Funding data, Ballot measures, Civic DNA scoring. Beta disclaimer card. Tailwind only, zero `style=` attributes.
- Tests run: `npm run lint` (0 errors), `npm run build` (clean, 16 routes).
- No Supabase policy changes. No schema changes. No seed data changes. No existing files changed.
- Deferred: database-backed report submission for /report pending separate SQL/RLS risk check approval.

## 2026-05-16 (report inaccuracy shell)

- Built UI-only Report Inaccuracy shell at `/report` (commit `6c63b51`).
- Files changed:
  - `src/app/report/page.tsx` — new client component. Auth-gated (redirects to `/onboarding` if no session). Collects subject type (candidate info / voting record / funding) and description in local component state only. Submit button disabled until description is 10+ characters. On submit, shows a clear beta notice: "Beta — report submission not yet enabled" with explicit statement that no data was recorded. No Supabase writes, no SQL, no tables, no RLS policies. Tailwind only, zero `style=` attributes.
- Tests run: `npm run lint` (0 errors), `npm run build` (clean, 15 routes).
- No Supabase policy changes. No schema changes. No seed data changes. No existing files changed.
- Deferred: database-backed report submission pending separate SQL/RLS risk check approval.

## 2026-05-16 (profile screen)

- Built read-only Profile screen at `/profile` (commit `bfe11ac`).
- Files changed:
  - `src/app/profile/page.tsx` — new client component. Auth-gated (redirects to `/onboarding` if no session). Reads `profiles` (display_name, zip_code, dna_quiz_status) and `civic_dna` (all 7 locked dimension scores) in parallel via `Promise.all`. `civic_dna` query uses `.order('created_at', { ascending: false }).limit(1).maybeSingle()` to return the most recent row safely in case of duplicates. Shows Account section (email, display name, ZIP) and Civic DNA section. If `dna_quiz_status` is not `'completed'` or no `civic_dna` row exists, shows a nudge linking to `/onboarding/dna-teaser`. If quiz complete, renders all 7 dimension scores with teal/red/gray coloring. No Supabase writes. Tailwind only, zero `style=` attributes.
- Tests run: `npm run lint` (0 errors), `npm run build` (clean, 14 routes).
- No Supabase policy changes. No schema changes. No seed data changes. No existing files changed.
- Deferred: report inaccuracy, data sources, match score display on profile.

## 2026-05-15 (vote screen)

- Built read-only Vote screen at `/vote` (commit `bebed21`).
- Files changed:
  - `src/app/vote/page.tsx` — new client component. Auth-gated (redirects to `/onboarding` if no session). Reads upcoming elections via read-only Supabase select on the `elections` table (no writes, no Edge Functions, no external API lookups). Displays official government links only; all URLs pass through `isSafeUrl` (https/http only) before rendering as `<a>` tags. Back link to `/ballot`. Tailwind only, zero `style=` attributes.
- Tests run: `npm run lint` (0 errors), `npm run build` (clean).
- No Supabase policy changes. No schema changes. No seed data changes.
- Deferred: profile screen, report inaccuracy, data sources.

## 2026-05-15 (ballot → measure profile integration)

- Wired `/ballot` to load and link to `/measures/[id]` (commit `183b070`).
- Files changed:
  - `src/lib/measures.ts` — added `getMeasuresForDistricts(districtIds: string[])`. Queries `ballot_measures` with `districts` and `elections` join, filters `archived_at IS NULL`, ordered by title. Reuses existing `MeasureRow` internal type and `MeasureProfile` export. Read-only select only.
  - `src/app/ballot/page.tsx` — added import of `getMeasuresForDistricts` and `MeasureProfile`. Added `measures` state. Replaced single `getCandidatesForDistricts` call with `Promise.all([getCandidatesForDistricts, getMeasuresForDistricts])` so both load in parallel. Added "Measures" section below candidate races: renders only when `measures.length > 0`, each card is a `<Link href="/measures/[id]">` showing title and district name. Tailwind arbitrary classes only, no new `style=` attributes.
- Tests run: `npm run lint` (0 errors), `npm run build` (clean, 12 routes).
- No Supabase policy changes. No schema changes. No seed data changes.
- Known limits: if dummy data has no `ballot_measures` rows linked to user's districts, the Measures section does not render (expected).
- Deferred: vote screen, profile screen, report inaccuracy.

## 2026-05-15 (measure profile)

- Built read-only Measure Profile screen at `/measures/[id]` (commit `c84c331`).
- Files changed:
  - `src/lib/measures.ts` — new file. `MeasureProfile` type (id, title, type, plain_english_summary, full_text_url, district_name, district_scope, election_name, election_date). `MeasureDimensions` type (all seven locked dimension keys + scored_by + impact_summary). `getMeasureProfile` queries `ballot_measures` with `districts` and `elections` join, filters `archived_at IS NULL`, returns `maybeSingle`. `getMeasureDimensions` queries `measure_dimensions` by `measure_id`, returns `maybeSingle`. Read-only selects only.
  - `src/app/measures/[id]/page.tsx` — new client component. Auth-gated (redirects to `/onboarding` if no session). Loads `getMeasureProfile` and `getMeasureDimensions` in parallel. Shows: type badge (bond/ordinance/zoning/referendum with color coding), title, district + election date context, "What it means" plain English summary, "Read Full Text" link guarded by `isSafeUrl` (https/http only), Civic DNA Impact section with all seven dimension scores formatted as +/- with teal/red coloring, `scored_by` label ("AI draft — not yet validated" for ai_draft), read-only disclaimer. Back link to `/ballot`. Tailwind only, zero `style=` attributes.
- Tests run: `npm run lint` (0 errors), `npm run build` (clean).
- No existing files changed. No Supabase policy changes. No seed data changes.
- Known limits: `/ballot` does not yet link to `/measures/[id]` — that integration is the next sprint item.
- Deferred: ballot → measure profile links, vote screen, profile screen.

## 2026-05-15 (home screen)

- Built Home screen at `/` (commit `48b81f3`).
- Files changed:
  - `src/app/page.tsx` — replaced Next.js boilerplate with CivicMarket Home screen. Client component, auth-gated (redirects to `/onboarding` if no session). Loads user districts and up to 3 upcoming race candidates via existing `getUserDistrictIds` and `getCandidatesForDistricts` helpers. Static dummy civic feed rows (3 hardcoded entries, no Supabase query). District name pills derived from candidate list. "View all" and "View Full Ballot" links to `/ballot`. Candidate cards link to `/candidates/[id]`. Read-only disclaimer. Tailwind arbitrary classes for fonts (`[font-family:var(--font-syne)]`), no inline style attributes.
- Tests run: `npm run lint` (0 errors), `npm run build` (clean, 12 routes).
- No database writes. No Supabase policy changes. No new tables queried.
- Known limits: civic feed is static dummy text; no match scores or alignment bars (deferred); `/vote` and `/profile` nav links are still dead routes (separate sprint items).
- Deferred: civic feed Supabase query (pending table/RLS confirmation), match score display, profile screen, vote screen.

## 2026-05-15 (candidate profile)

- Built read-only candidate profile screen at `/candidates/[id]`.
- Files changed:
  - `src/lib/candidates.ts` - Added `CandidateProfile`, `CandidateFunding`, `VotingRecord` types and `getCandidateProfile`, `getCandidateFunding`, `getCandidateVotingRecords` helper functions (read-only Supabase selects, no writes).
  - `src/app/candidates/[id]/page.tsx` - New client component. Auth-gated (redirects to /onboarding if no session). Loads candidate, funding, and voting records in parallel. Shows: name/office/district header, incumbent badge, bio, website button, funding breakdown, voting record list with for/against/abstain pills and dimension tags, read-only disclaimer.
  - `src/app/ballot/page.tsx` - Added `import Link from 'next/link'`; replaced candidate `<article>` cards with `<Link href="/candidates/[id]">` so tapping a card navigates to the profile.
- Tests run: `npm run lint` (0 errors), `npm run build` (clean, 13 routes including new `/candidates/[id]` dynamic route).
- Manual browser test after commit `382e838`: `/ballot` loaded, tapping a candidate card opened `/candidates/[id]`, candidate profile rendered, and no obvious browser/UI issues were seen.
- No database writes. No Supabase policy changes. No public-launch features.
- Known limits: `photo_url` field is fetched but not displayed (no images in dummy data); dimension/position scores not shown (requires `candidate_positions` rows which dummy data may not have).
- Deferred: match score display, civic DNA alignment bar, measure profile screen.

## 2026-05-15 (lint cleanup)

- Fixed all 12 ESLint errors. No behavior changes.
- Changed `<a href="/">` to `<Link>` in layout.tsx and NavBar.tsx (added `import Link from 'next/link'`).
- Replaced `catch (err: any)` with `catch (err: unknown)` + `instanceof Error` narrowing in districts/page.tsx and quiz/page.tsx.
- Escaped bare apostrophes with `&apos;` in districts/page.tsx (lines 135, 139, 256), dna-teaser/page.tsx (line 172), and zip/page.tsx (line 90).
- Added `CandidateRow` type in candidates.ts to replace `row: any`; used double cast (`as unknown as CandidateRow[]`) to match Supabase's join inference.
- Tests run: `npm run lint` (0 errors), `npm run build` (clean, 12 static pages).
- Known limits: Supabase does not emit typed schema, so the double cast is the correct pattern until `supabase gen types` is wired up.
- Deferred: none.

## 2026-05-15

- Applied Supabase beta security patch for profiles, reviews, and match_scores.
- Removed broad anon/authenticated table grants from profiles, reviews, and match_scores.
- Limited profile browser updates to onboarding-related fields only.
- Removed browser insert access to profiles; profile creation remains handled by the signup trigger.
- Removed browser insert/update policies for match_scores.
- Removed browser update policy for reviews.
- Kept active reviews publicly readable and limited review inserts to basic user-submitted fields.
- Verified policies and grants in Supabase SQL Editor.
- Tested onboarding after patch: signup, ZIP update, districts, DNA teaser, quiz, and calculating screen worked.
- Confirmed redirect to /ballot currently shows 404 because /ballot has not been built yet.


## 2026-05-14

- Initialized Git and created first project checkpoint.
- Added CIVICMARKET_CURRENT_STATE.md as the current source of truth.
- Backed up old CLAUDE.md to Reference Files/Archive.
- Replaced active CLAUDE.md with shorter project instructions.
- Confirmed `npm run build` passes after source-of-truth and Claude memory cleanup.
- Fixed Civic DNA Q13 wording to match the May 12 patch.
- Fixed Civic DNA reversal logic so Q8-Q14 are all reversed at compute time.
- Confirmed `npm run build` passes after the Civic DNA fix.
- Manually tested onboarding flow from welcome through calculating screen.
- Confirmed signup, ZIP, districts, DNA teaser, quiz, and calculating routes work locally.



