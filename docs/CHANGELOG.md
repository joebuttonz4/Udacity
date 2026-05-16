# Changelog

## 2026-05-15 (measure profile)

- Built read-only Measure Profile screen at `/measures/[id]` (commit `c84c331`).
- Files changed:
  - `src/lib/measures.ts` — added `Measure`, `MeasureVote` types and `getMeasure`, `getMeasureVotes` helper functions (read-only Supabase selects, no writes).
  - `src/app/measures/[id]/page.tsx` — new client component. Auth-gated (redirects to `/onboarding` if no session). Loads measure detail and associated voting records. Shows: measure title/office/district header, summary, full text link (official source URL only), voting record list with for/against/abstain pills and candidate names, read-only disclaimer. Tailwind arbitrary classes for fonts, no inline style attributes.
- Tests run: `npm run lint` (0 errors), `npm run build` (clean).
- No database writes. No Supabase policy changes. No new tables created.
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
