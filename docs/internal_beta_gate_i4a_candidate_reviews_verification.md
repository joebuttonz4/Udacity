# Internal Beta — Gate I4A: Candidate Reviews Verification and Limitation Note

## 1. Date and timestamp

Date: 07-09-2026
Timestamp: 10:21 am EDT

This document is documentation and verification only. It does not change app behavior, run Supabase writes, deploy anything, or touch the County Commission write guard.

## 2. Current repo baseline

- Branch: `master`, working tree clean, up to date with `origin/master`.
- Latest pushed commit: `301172f` ("Add candidate review submission").
- `npm run build` passed with 25 routes at that baseline.
- `ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE = false`, County Commission District 1-5 remains dry-run only — unchanged, not touched by this document.

## 3. What Gate I4 implemented

Confirmed by inspection of `src/app/candidates/[id]/page.tsx`:

- A new "Reviews" tab (`section-reviews`), added to the existing tab bar (`Overview`, `Voting`, `Funding`, `Details`, `Reviews`), consistent with the page's existing scroll-anchor tab pattern.
- A `Review` type (`id`, `user_id`, `rating`, `body`, `created_at`) local to the page file.
- An independent `useEffect` that loads active reviews for the candidate via `supabase.from('reviews').select(...).eq('candidate_id', candidateId).order('created_at', { ascending: false })`, decoupled from the main profile-loading effect so a reviews failure cannot block the rest of the candidate profile from rendering.
- A 1-5 star rating input (required, via a `StarIcon`/button row) and an optional `body` textarea.
- Submission via a direct `supabase.from('reviews').insert({ user_id, candidate_id, rating, body })` call, re-checking the session immediately before the insert — matching the existing anon-client, RLS-guarded write pattern already used elsewhere in the app (e.g. `/onboarding/zip`).
- Client-side duplicate prevention: before rendering the submission form, the page checks whether the current user's id already appears among the loaded reviews for this candidate; if so, the form is replaced with a friendly "You've already reviewed this candidate" message.
- Read display of all loaded reviews: star rating, optional body, "You" or "Community member" as the author label, and a formatted `created_at` date.
- Distinct loading, error, empty, and success states for the reviews section, separate from the page's main loading/error state.

## 4. What Gate I4 intentionally did not implement

Per the Gate I4 task boundaries, confirmed still absent by inspection:

- **No edit capability.** No UI or code path allows a user to change a submitted review.
- **No delete capability.** No UI or code path allows a user to remove a submitted review.
- **No flagging.** No "report this review" control exists.
- **No moderation UI.** No admin-facing review management screen exists; moderation, if ever needed, remains manual/SQL-level only (setting `moderation_status` directly in Supabase), consistent with `CLAUDE.md`'s locked minimal-admin scope.
- **No measure reviews.** `src/app/measures/[id]/page.tsx` was not touched by Gate I4 and still has no review submission or display code.
- **No "helpful" voting.** The `helpful_count` column exists in the schema but no UI increments it.

## 5. Reviews RLS/display-name limitation

Confirmed by inspection of `Reference Files/civicmarket_schema_v4.sql`: `profiles` has exactly three RLS policies — `SELECT`, `UPDATE`, and `INSERT` — all scoped to `auth.uid() = id`. There is no broader "profiles are publicly readable" policy anywhere in the reference schema or any other SQL file in `Reference Files`.

This means a query joining `reviews` to `profiles.display_name` would return the display name only for the requesting user's own row — any other user's `profiles` row is invisible to that query under RLS, which would produce inconsistent or null names for every review except the viewer's own.

**Resolution implemented:** the reviews UI does not join to `profiles` at all. Instead, it labels a review "You" when `review.user_id === userId` (the signed-in viewer), and "Community member" for every other review, regardless of who actually wrote it. This is a deliberate design choice to avoid building something that RLS would silently break, not an oversight. It is documented here as a known, permanent limitation for beta — showing real display names to other users would require a new, separately approved RLS policy or a public-safe view, which is out of scope for this gate.

## 6. Duplicate-review limitation

The `reviews` table's `UNIQUE(user_id, candidate_id, measure_id)` constraint does **not** reliably prevent a user from submitting more than one review for the same candidate. In standard SQL (and Postgres specifically), `NULL` is never considered equal to another `NULL` for uniqueness purposes. Since a candidate review always has `measure_id = NULL`, two rows with the same `(user_id, candidate_id)` but both `measure_id = NULL` are treated as distinct by the database and the constraint does not block the second insert.

**Resolution implemented:** duplicate prevention is enforced entirely at the application layer — the page checks the already-loaded reviews list for a row matching the current `userId` before showing the submission form (Section 3). This is a real, load-bearing behavior, not a redundant nicety: it is the only mechanism preventing duplicate candidate reviews today. It has two known gaps, documented here rather than silently accepted:

- **Race condition:** if a user opens the page in two tabs, or double-submits quickly enough that the first insert hasn't yet updated local state, both requests could succeed at the database level, producing two rows for the same user/candidate. The database will not reject the second one.
- **Stale client state:** if the reviews list fails to load (`reviewsError`) or is stale for any other reason, the duplicate check has nothing to check against and the form will show even if a review already exists.

Neither gap causes data corruption or a security issue — at worst, a user could end up with two reviews displayed for the same candidate. This is an acceptable, documented limitation for Internal Beta scale (1-3 trusted testers), not something that needs to block Gate I4A.

## 7. Internal Beta acceptance criteria

For candidate reviews specifically, Internal Beta is considered acceptable if:

- A signed-in trusted tester can submit exactly one review (rating required, body optional) for a candidate and see it appear in the list without a page reload.
- A second visit to the same candidate by the same tester shows the friendly "already reviewed" message instead of the form, under normal single-tab usage.
- Other testers' reviews are visible and correctly labeled "Community member" (their real name is never exposed, by design — Section 5).
- A reviews-load failure does not prevent the rest of the candidate profile (bio, voting record, funding, match score) from rendering.
- No console errors appear when loading a candidate with zero reviews, one review, or multiple reviews.

This is a beta-scale acceptance bar, not a production-hardening bar — the known race-condition and RLS-driven display-name limitations (Sections 5-6) are accepted as-is for Internal Beta.

## 8. Candidate review manual test checklist

To be run manually against a real or test account before/at Internal Beta:

- [ ] Navigate to a candidate profile as a signed-in user; open the Reviews tab.
- [ ] Confirm the loading skeleton appears briefly, then either the empty state or existing reviews render.
- [ ] Submit a review with a 1-star rating and no body text; confirm it appears in the list immediately with an empty body area.
- [ ] Reload the page; confirm the same review persists and the form is replaced with the "already reviewed" message.
- [ ] Attempt to submit again by inspecting whether the form is reachable at all (it should not be, per the duplicate-prevention check) — this confirms the client-side gate works under normal single-tab use.
- [ ] Using a second test account, submit a review with a 5-star rating and a body of at least one sentence for the same candidate; confirm both accounts' reviews are visible to each other, with the first account's own review labeled "You" only when viewed by that account, and "Community member" when viewed by the second account.
- [ ] Confirm the submit button stays disabled until a star rating is selected.
- [ ] Confirm a network failure during load (e.g. via browser dev tools offline mode) produces the reviews-specific error message, not a blank page or a page-level crash.
- [ ] Confirm the rest of the candidate profile (Overview, Voting, Funding, Details tabs) still renders correctly regardless of review state.
- [ ] Confirm no address, email, or other PII beyond the "You"/"Community member" label is ever shown for any review.

## 9. Expected pass/fail results

Based on the implementation described in Section 3 and reviewed in this gate:

| Test | Expected result |
|---|---|
| Submit first review | PASS — inserts and displays immediately |
| Reload shows persisted review + hides form | PASS — form replaced by "already reviewed" message |
| Second account can review same candidate | PASS — no cross-user restriction exists |
| Cross-user display name never exposed | PASS by design — "Community member" label only |
| Submit button disabled without a rating | PASS — `disabled={!ratingInput || submittingReview}` |
| Reviews load failure doesn't break rest of page | PASS — independent `useEffect` and error state |
| Rapid double-submit / two-tab duplicate | **Known limitation, not prevented** (Section 6) — acceptable for Internal Beta scale |
| Stale reviews list masks an existing review | **Known limitation, not prevented** (Section 6) — acceptable for Internal Beta scale |

## 10. No-write/no-deploy boundaries

The following apply to this document and were not violated in producing it:

- No app code was edited or created as part of this gate — this document is verification/documentation of the already-committed Gate I4 implementation, not a new change.
- No Supabase writes were performed.
- No deployment occurred.
- `ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE` was not changed — confirmed still `false`.
- `user_districts` was not modified.
- No schema, seed, migration, `districts`, `officials_for_user`, `src/lib/officials.ts`, `CurrentOfficialsSection`, or At-Large row change was made.

## 11. Recommendation for Gate I5 measure reviews

If measure reviews are implemented next, they should reuse the exact same pattern verified here, with the same limitations documented up front rather than discovered later:

- Same `Review`-shaped read/write pattern, keyed to `measure_id` instead of `candidate_id`.
- Same "You"/"Community member" display-name workaround (Section 5) — do not attempt a `profiles` join for measure reviews either, since the same RLS restriction applies identically.
- Same client-side duplicate-prevention approach (Section 6), with the same accepted race-condition/stale-state limitations — do not rely on the `UNIQUE` constraint to block duplicates, since the same NULL-inequality behavior applies (a measure review has `candidate_id = NULL`, which is symmetric to the candidate case).
- Add the missing "Report an Inaccuracy" parity check — `/measures/[id]` already gained a mailto-based report link in Gate I3, so Gate I5 does not need to add that separately, only the review feature itself.
- Should be its own gate (not bundled into further candidate-review work), consistent with `CLAUDE.md`'s "one route, one feature, one fix per session" preferred task size.

## 12. Deferred improvements after beta

Explicitly out of scope for beta, listed here so they are not silently forgotten:

- A real display-name solution for reviews — either a new, narrowly-scoped public-read RLS policy on a safe subset of `profiles` (e.g., `display_name` only) or a dedicated public-safe view, requiring its own security review and explicit approval before implementation.
- A server-side or database-level safeguard against duplicate reviews (e.g., a partial unique index treating `measure_id IS NULL` as equivalent for candidate reviews, or a service-role API route that checks-then-inserts atomically), to close the race-condition gap in Section 6.
- Review editing (would require an UPDATE grant on `reviews`, not currently deployed) and deletion.
- Review flagging and admin moderation UI.
- "Helpful" vote counting (`helpful_count`).
- Verification-tier-weighted review display (`verification_tier_at_submission`, `review_weight` already exist in the schema but are unused).

None of these are required before Internal Beta per the acceptance criteria in Section 7, and none are implied to be approved by their presence in this list — each would need its own future gate.
