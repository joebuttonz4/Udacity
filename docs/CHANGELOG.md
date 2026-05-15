# Changelog

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