# Internal Beta — Gate I1: Prep Review

Date: July 9, 2026

## Purpose

Answer, from direct inspection of the current codebase, exactly what exists and what doesn't, so Internal Beta prep work (Section 6/14 of `docs/beta_launch_readiness_plan.md`) can be scoped accurately rather than assumed. This is a review and planning document. It does not change app behavior, run Supabase writes, deploy anything, or touch the County Commission write guard.

## Current baseline

- Latest pushed commit at the start of this review: `27d7bdb` ("Add beta launch readiness plan").
- Branch `master`, working tree clean, up to date with `origin/master`.
- `ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE = false` confirmed by direct inspection of `src/app/api/set-county-commission-district/route.ts` at the time of this review — unchanged.
- No Supabase writes, no deployment, no schema/seed/migration/`districts`/`officials_for_user`/`officials.ts`/`CurrentOfficialsSection`/At-Large changes were made as part of this review.

## 1. What app screens currently exist

Confirmed by enumerating every `page.tsx` under `src/app`:

- `/` (Home)
- `/onboarding` (welcome)
- `/onboarding/signup`
- `/onboarding/zip`
- `/onboarding/districts`
- `/onboarding/dna-teaser`
- `/onboarding/quiz`
- `/onboarding/calculating`
- `/ballot`
- `/candidates/[id]`
- `/measures/[id]`
- `/vote`
- `/profile`
- `/profile/county-commission`
- `/report`
- `/data-sources`
- `/privacy`
- `/terms`
- `/admin/entry`
- `/admin/records`

Plus API routes: `/api/validate-invite`, `/api/compute-match-scores`, `/api/set-county-commission-district`.

## 2. Which screens appear beta-relevant

Every screen above is beta-relevant except the two admin screens, which are internal-only tooling (candidate voting-record entry and review/removal), not something a beta tester or PSL user is meant to reach. All onboarding steps, `/ballot`, `/candidates/[id]`, `/measures/[id]`, `/vote`, `/profile`, `/report`, `/data-sources`, `/privacy`, and `/terms` are directly in the path a real tester or PSL user will walk. `/profile/county-commission` is beta-relevant but currently gated behind the disabled write path (Section 12).

## 3. Whether Civic DNA appears implemented, partially implemented, or missing

**Implemented.** `src/lib/dna.ts` defines the seven locked dimension keys, the Q8-Q14 reversal-at-compute-time logic (`REVERSED_QUESTIONS`), `saveQuizAnswer` (raw answer stored as-is, per-question upsert), and `computeAndSaveDna` (averages the two answers per dimension, rounds to 2 decimals, writes one `civic_dna` row, and marks `profiles.dna_quiz_status = 'completed'`). This matches `CLAUDE.md`'s locked Civic DNA rules exactly (dimension scores computed from raw stored answers, reversal only at compute time). `CIVICMARKET_CURRENT_STATE.md` records this as complete and tested. No gaps found in this file.

## 4. Whether match score display appears implemented, partially implemented, or missing

**Implemented.** `src/lib/candidates.ts`'s `getCandidatesForDistricts` reads `match_scores` for the given user/candidate set and attaches `match_score` to each candidate. `src/app/ballot/page.tsx` renders `<MatchScoreRing score={candidate.match_score} size="sm" />` per candidate. `src/app/candidates/[id]/page.tsx` independently queries `match_scores` for the single candidate and renders a large ring with a plain-language label (`matchLabel`). Automatic generation after quiz completion is handled server-side by `src/app/api/compute-match-scores/route.ts`. Coverage is expected to be partial/locked for candidates without `candidate_positions` data yet (documented, intentional data-availability limit, not a bug) — this matches the beta plan's "important but can be limited during Internal Beta" framing.

**No corresponding match-score display was found for ballot measures** — `src/app/measures/[id]/page.tsx` shows "Civic DNA Impact" (the measure's own dimension scores), not a personal user match score, and there is no `measure_match_scores`-style table or query anywhere in `src/lib/measures.ts`. This is consistent with the existing scope (measures show impact dimensions, not a personalized match ring) and is not treated as a gap here, since it was never part of the locked beta scope for measures.

## 5. Whether candidate review submission exists

**Missing.** No review-related state, form, or Supabase call exists in `src/app/candidates/[id]/page.tsx` or `src/lib/candidates.ts`. A repo-wide search for `reviews` under `src/` returns zero matches. The only user-facing action available for a candidate is "Report an Inaccuracy" (a link to `/report`), which is a different feature (data-correction reporting, not a rating/review).

## 6. Whether legislation/measure review submission exists

**Missing**, for the same reason as Item 5 — no review code exists anywhere in `src/`, and `src/app/measures/[id]/page.tsx` has no review or rating section, and (unlike the candidate page) does not even have a "Report an Inaccuracy" link.

## 7. Whether review display exists

**Missing.** There is no code anywhere in `src/` that reads from a `reviews` table. A `reviews` table does exist in the reference schema (`Reference Files/civicmarket_schema_v4.sql`, confirmed present with `candidate_id`, `measure_id`, `rating`, `body`, and moderation columns, RLS-enabled), and the May 17 2026 security grant patch separately confirmed the deployed table's grants are "SELECT and INSERT only (no UPDATE)" — meaning the table exists at the database level and is reachable by an authenticated client, but nothing in the app has ever been built to use it. This matches and reconfirms the "new blocker" already identified in `docs/beta_launch_readiness_plan.md` Section 11.

## 8. Whether Report Inaccuracy exists

**Exists.** `src/app/report/page.tsx` exists and, per `CIVICMARKET_CURRENT_STATE.md`, is database-backed (`inaccuracy_reports` table, RLS with authenticated INSERT / admin-only SELECT, no UPDATE/DELETE), with a "Report received" success state. Linked from `/candidates/[id]` ("Report an Inaccuracy") and from Profile Settings ("Report an Issue"). Not linked from `/measures/[id]` (see Item 6).

## 9. Whether Data Sources exists

**Exists.** `src/app/data-sources/page.tsx` exists — a static, auth-gated methodology page, confirmed complete in `CIVICMARKET_CURRENT_STATE.md`. Linked from Profile Settings.

## 10. Whether Corrections page exists

**Missing.** No `corrections` route exists anywhere under `src/app` (confirmed by the full route enumeration in Item 1). Only `/privacy` and `/terms` exist as legal/policy static pages. This matches the gap already flagged in `docs/beta_launch_readiness_plan.md` Section 7 — a new small static page is needed before Controlled PSL Beta.

## 11. Whether Terms and Privacy pages exist

**Both exist.** `src/app/privacy/page.tsx` and `src/app/terms/page.tsx` are both present, confirmed complete in `CIVICMARKET_CURRENT_STATE.md` (beta-draft notice on each, consent notice added to signup, commit `94cae59`).

## 12. Whether County Commission District 1-5 is still guarded

**Yes, confirmed guarded.** Direct inspection of `src/app/api/set-county-commission-district/route.ts` at the time of this review shows `const ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE = false` on line 9, with the dry-run early-return block (lines 131-145) preceding the unreachable `.delete()`/`.insert()` calls (lines 153-174), exactly as verified in Gates 8, 16, and 17A. No `.update()` or `.upsert()` call exists in the file. Nothing in this review changed this file. Gate 16's result (NOT READY, blocked on user-provided test-account details) remains the current state.

## 13. What must be built first for Internal Beta

Nothing new needs to be *built* for Internal Beta strictly speaking — every hard requirement in `docs/beta_launch_readiness_plan.md` Section 6 (Civic DNA, match scores, onboarding, core screens, invite code gate) is already implemented and confirmed working per `CIVICMARKET_CURRENT_STATE.md`. What remains before Internal Beta is:

- A UI polish pass on the core flows a trusted tester will actually touch (onboarding, ballot, candidate profile, profile) — this is a design/QA task, not a missing feature.
- Writing (not building) the reviews feature plan, since Section 6 only requires this be planned for Internal Beta.
- Optionally, deciding whether to add a "Report an Inaccuracy" link to `/measures/[id]` for consistency with `/candidates/[id]` — small, non-blocking, worth a decision before Internal Beta since it's a one-line addition if wanted.

## 14. What must be built before Controlled PSL Beta

Confirmed still outstanding by this review, matching `docs/beta_launch_readiness_plan.md` Section 7:

- **Reviews feature** — submission UI and read display for both candidates and measures, backed by the existing `reviews` table (confirmed to exist at the DB level but entirely unused by the app today).
- **Corrections page** — confirmed no route exists yet; needs to be built matching the `/privacy`/`/terms` static-page pattern.
- **Candidate/race data-completeness hiding** — the existing `getCandidatesForDistricts`/`getCandidateProfile` queries filter only on `archived_at IS NULL`; there is no stricter "hide until all required fields are present" check today. This needs to be added before real PSL users are shown the ballot.
- **County Commission District 1-5 safe test (Gate 17B/18)** — still blocked strictly on the user providing the Gate 15 final approval statement; confirmed unchanged by this review (Item 12).
- **Measure `/report` parity** (minor, optional) — if reviews and corrections are being built for measures anyway, this is a natural time to also add the missing "Report an Inaccuracy" link to `/measures/[id]`.

## 15. Recommended next gate

Two independent tracks, consistent with `docs/beta_launch_readiness_plan.md` Section 19:

1. **Gate I2 (Internal Beta launch prep):** proceed directly to the UI polish pass and reviews-feature planning document, since this review found no missing hard requirement blocking Internal Beta itself. No Supabase write or write-guard change is needed for this track.
2. **Gate CC-17B (County Commission safe test):** remains independently blocked on the user providing the completed Gate 15 final approval statement (test account user ID, email, district label, expected district ID, and the three explicit write-guard/no-deploy approvals). This review did not change that status.

## No-change confirmation

- No app code was edited or created.
- `ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE` was not changed — confirmed still `false`.
- No Supabase writes were performed.
- No `user_districts` rows were created or modified.
- No schema, seed, migration, `districts`, or `officials_for_user` change was made.
- `src/lib/officials.ts` and `src/components/CurrentOfficialsSection.tsx` were not changed.
- The At-Large row was not renamed, deleted, replaced, or repurposed.
- No deployment occurred.
