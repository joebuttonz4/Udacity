# Changelog

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
