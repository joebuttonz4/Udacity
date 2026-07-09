# Internal Beta — Gate I5A: Measure Reviews Verification and Limitation Note

## 1. Date and timestamp

Date: 07-09-2026
Timestamp: 10:31 am EDT

This document is documentation and verification only. It does not change app behavior, run Supabase writes, deploy anything, or touch the County Commission write guard.

## 2. Current repo baseline

- Branch: `master`, working tree clean, up to date with `origin/master`.
- Latest pushed commit: `27adfd6` ("Add measure review submission").
- `npm run build` passed with 25 routes at that baseline.
- `ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE = false`, County Commission District 1-5 remains dry-run only — unchanged, not touched by this document.

## 3. What Gate I5 implemented

Confirmed by inspection of `src/app/measures/[id]/page.tsx`:

- A `Review` type (`id`, `user_id`, `rating`, `body`, `created_at`) local to the page file, duplicated from — not shared with — the candidate page's identical type, consistent with this page's existing convention of keeping its own local copies of small helpers (`isSafeUrl`, `formatDate`, the dimension constants) rather than importing from `src/app/candidates/[id]/page.tsx`.
- Local `formatReviewDate`, `StarIcon`, and `StarRow` helper functions, likewise duplicated rather than shared.
- A new "Community Reviews" section (no tab bar exists on this page, unlike the candidate page, so the section is inline) placed between the beta disclaimer and the "Report an Inaccuracy" mailto link.
- An independent `useEffect` that loads active reviews for the measure via `supabase.from('reviews').select(...).eq('measure_id', measureId).order('created_at', { ascending: false })`, decoupled from the main measure-loading effect so a reviews failure cannot block the rest of the measure profile from rendering.
- A 1-5 star rating input (required) and an optional `body` textarea, matching the candidate page's UX exactly.
- Submission via a direct `supabase.from('reviews').insert({ user_id, measure_id: measureId, candidate_id: null, rating, body })` call, re-checking the session immediately before the insert — matching the existing anon-client, RLS-guarded write pattern. `candidate_id` is explicitly set to `null` in the insert payload, per the Gate I5 requirement, rather than left implicit.
- Client-side duplicate prevention: before rendering the submission form, the page checks whether the current user's id already appears among the loaded reviews for this measure; if so, the form is replaced with a friendly "You've already reviewed this measure" message.
- Read display of all loaded reviews: star rating, optional body, "You" or "Community member" as the author label, and a formatted `created_at` date.
- Distinct loading, error, empty, and success states for the reviews section, separate from the page's main loading/error state.

## 4. What Gate I5 intentionally did not implement

Per the Gate I5 task boundaries, confirmed still absent by inspection:

- **No edit capability.** No UI or code path allows a user to change a submitted measure review.
- **No delete capability.** No UI or code path allows a user to remove a submitted measure review.
- **No flagging.** No "report this review" control exists.
- **No moderation UI.** No admin-facing review management screen exists; moderation, if ever needed, remains manual/SQL-level only, consistent with `CLAUDE.md`'s locked minimal-admin scope.
- **No changes to candidate reviews.** `src/app/candidates/[id]/page.tsx` was not touched by Gate I5, beyond being read for pattern reference.
- **No "helpful" voting.** The `helpful_count` column exists in the schema but no UI increments it, for measures any more than for candidates.

## 5. Reviews RLS/display-name limitation

Unchanged from the candidate reviews finding in Gate I4A, and re-confirmed here as applying identically to measure reviews: `profiles` has exactly three RLS policies (`SELECT`, `UPDATE`, `INSERT`), all scoped to `auth.uid() = id`. No broader "profiles are publicly readable" policy exists anywhere in the reference schema. A join from `reviews` to `profiles.display_name` would therefore return the display name only for the requesting user's own row, producing inconsistent or null names for every other user's review.

**Resolution implemented (same as candidate reviews):** the measure reviews UI does not join to `profiles`. A review is labeled "You" when `review.user_id === userId`, and "Community member" for every other review. This is the same deliberate, documented design choice made in Gate I4A, applied consistently rather than re-derived — showing real display names to other users would require a new, separately approved RLS policy or a public-safe view, out of scope for this gate.

## 6. Duplicate-review limitation

Unchanged from the candidate reviews finding, and symmetric for measures: the `reviews` table's `UNIQUE(user_id, candidate_id, measure_id)` constraint does not reliably prevent a user from submitting more than one review for the same measure. A measure review always has `candidate_id = NULL`, and in standard SQL (Postgres included), `NULL` is never considered equal to another `NULL` for uniqueness purposes — so two rows with the same `(user_id, measure_id)` but both `candidate_id = NULL` are treated as distinct by the database, and the constraint does not block the second insert.

**Resolution implemented (same as candidate reviews):** duplicate prevention is enforced entirely at the application layer — the page checks the already-loaded reviews list for a row matching the current `userId` before showing the submission form (Section 3). The same two gaps documented in Gate I4A apply here without modification:

- **Race condition:** two tabs or a fast double-submit could both succeed at the database level, producing two rows for the same user/measure. The database will not reject the second one.
- **Stale client state:** if the reviews list fails to load (`reviewsError`) or is stale, the duplicate check has nothing to check against and the form will show even if a review already exists.

As with candidate reviews, neither gap causes data corruption or a security issue, and both are accepted as a documented limitation for Internal Beta scale (1-3 trusted testers).

## 7. Internal Beta acceptance criteria

For measure reviews specifically, Internal Beta is considered acceptable if:

- A signed-in trusted tester can submit exactly one review (rating required, body optional) for a measure and see it appear in the list without a page reload.
- A second visit to the same measure by the same tester shows the friendly "already reviewed" message instead of the form, under normal single-tab usage.
- Other testers' reviews are visible and correctly labeled "Community member" (their real name is never exposed, by design — Section 5).
- A reviews-load failure does not prevent the rest of the measure profile (plain-English summary, full text link, Civic DNA Impact scores) from rendering.
- No console errors appear when loading a measure with zero reviews, one review, or multiple reviews.
- The existing "Report an Inaccuracy" mailto link (added in Gate I3) remains present and unaffected by the new Reviews section.

This is a beta-scale acceptance bar, not a production-hardening bar — the known race-condition and RLS-driven display-name limitations (Sections 5-6) are accepted as-is for Internal Beta, exactly as they were for candidate reviews.

## 8. Measure review manual test checklist

To be run manually against a real or test account before/at Internal Beta:

- [ ] Navigate to a measure profile as a signed-in user; scroll to the Community Reviews section.
- [ ] Confirm the loading skeleton appears briefly, then either the empty state or existing reviews render.
- [ ] Submit a review with a 1-star rating and no body text; confirm it appears in the list immediately with an empty body area.
- [ ] Reload the page; confirm the same review persists and the form is replaced with the "already reviewed" message.
- [ ] Confirm the form is not reachable again under normal single-tab use after a successful submission (duplicate-prevention check).
- [ ] Using a second test account, submit a review with a 5-star rating and a body of at least one sentence for the same measure; confirm both accounts' reviews are visible to each other, with the first account's own review labeled "You" only when viewed by that account, and "Community member" when viewed by the second account.
- [ ] Confirm the submit button stays disabled until a star rating is selected.
- [ ] Confirm a network failure during load (e.g. via browser dev tools offline mode) produces the reviews-specific error message, not a blank page or a page-level crash.
- [ ] Confirm the rest of the measure profile (summary, full text link, Civic DNA Impact) still renders correctly regardless of review state.
- [ ] Confirm the "Report an Inaccuracy" link below the Reviews section still works and pre-fills the correct measure title.
- [ ] Confirm no address, email, or other PII beyond the "You"/"Community member" label is ever shown for any review.
- [ ] Confirm a review submitted on a candidate page does not appear on a measure page and vice versa (correct `measure_id`/`candidate_id` scoping).

## 9. Expected pass/fail results

Based on the implementation described in Section 3 and reviewed in this gate:

| Test | Expected result |
|---|---|
| Submit first review | PASS — inserts and displays immediately |
| Reload shows persisted review + hides form | PASS — form replaced by "already reviewed" message |
| Second account can review same measure | PASS — no cross-user restriction exists |
| Cross-user display name never exposed | PASS by design — "Community member" label only |
| Submit button disabled without a rating | PASS — `disabled={!ratingInput || submittingReview}` |
| Reviews load failure doesn't break rest of page | PASS — independent `useEffect` and error state |
| Report an Inaccuracy link unaffected | PASS — section inserted above it, no structural change to that block |
| Reviews correctly scoped to measure_id, not candidate_id | PASS — insert explicitly sets `candidate_id: null` |
| Rapid double-submit / two-tab duplicate | **Known limitation, not prevented** (Section 6) — acceptable for Internal Beta scale |
| Stale reviews list masks an existing review | **Known limitation, not prevented** (Section 6) — acceptable for Internal Beta scale |

## 10. No-write/no-deploy boundaries

The following apply to this document and were not violated in producing it:

- No app code was edited or created as part of this gate — this document is verification/documentation of the already-committed Gate I5 implementation, not a new change.
- No Supabase writes were performed.
- No deployment occurred.
- `ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE` was not changed — confirmed still `false`.
- `user_districts` was not modified.
- No schema, seed, migration, `districts`, `officials_for_user`, `src/lib/officials.ts`, `CurrentOfficialsSection`, or At-Large row change was made.

## 11. Recommended next gate

With both candidate and measure reviews now implemented and documented, reviews are functionally complete for Internal Beta per `docs/beta_launch_readiness_plan.md`. Recommended next steps, independent of each other:

- **Gate I6 (UI polish pass):** proceed to Section 10 of `docs/internal_beta_gate_i2_reviews_ui_polish_plan.md` — a design/QA pass across onboarding, ballot, candidate profile, measure profile, and profile, now that both review surfaces exist and can be included in that review.
- **Gate I7 (data-completeness hiding):** proceed to Section 13 of the same plan, now that reviews no longer block it as a prerequisite.
- **County Commission safe test (Gate 17B):** remains a fully separate, parallel track, still blocked strictly on the user providing the Gate 15 final approval statement — unaffected by anything in this document or Gate I5.

## 12. Deferred improvements after beta

Explicitly out of scope for beta, listed here so they are not silently forgotten (identical to the candidate-review deferred list in Gate I4A, since both features share the same underlying table and constraints):

- A real display-name solution for reviews — either a new, narrowly-scoped public-read RLS policy on a safe subset of `profiles` (e.g., `display_name` only) or a dedicated public-safe view, requiring its own security review and explicit approval before implementation. This single future fix would resolve the limitation for both candidate and measure reviews at once.
- A server-side or database-level safeguard against duplicate reviews (e.g., partial unique indexes treating `measure_id IS NULL` and `candidate_id IS NULL` as equivalent within their respective review types, or a service-role API route that checks-then-inserts atomically), to close the race-condition gap in Section 6 for both review types.
- Review editing (would require an UPDATE grant on `reviews`, not currently deployed) and deletion.
- Review flagging and admin moderation UI.
- "Helpful" vote counting (`helpful_count`).
- Verification-tier-weighted review display (`verification_tier_at_submission`, `review_weight` already exist in the schema but are unused).

None of these are required before Internal Beta per the acceptance criteria in Section 7, and none are implied to be approved by their presence in this list — each would need its own future gate.
