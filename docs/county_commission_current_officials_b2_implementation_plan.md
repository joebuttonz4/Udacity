# County Commission Current Officials — B2 Implementation Plan

Date: July 7, 2026

## Scope

Documentation-only planning for implementing the approved B2 behavior model so that County Commission District 1-5 current officials can eventually appear in Current Officials for users who hold the St. Lucie County Commission At-Large row.

No schema changes, app code changes, seed changes, SQL migration changes, Supabase data changes, `current_officials` inserts, `user_districts` changes, or `officials_for_user` changes are made or approved by this document. This document is a plan for future, separately approved implementation gates.

Reference:
- docs/county_commission_district_1_5_future_implementation_plan.md (Gates 1-7, district row creation and B2 selection)

## 1. Current confirmed state

- Five St. Lucie County Commission District 1-5 rows exist in Supabase `districts`, inserted July 7, 2026 (Gate 6 of the prior plan), verified unchanged in Gate 7 limited (data-layer) verification the same day:
  - id `11111111-0000-0000-0000-000000000031` — St. Lucie County Commission District 1
  - id `11111111-0000-0000-0000-000000000032` — St. Lucie County Commission District 2
  - id `11111111-0000-0000-0000-000000000033` — St. Lucie County Commission District 3
  - id `11111111-0000-0000-0000-000000000034` — St. Lucie County Commission District 4
  - id `11111111-0000-0000-0000-000000000035` — St. Lucie County Commission District 5
  - all `type = county`, `city = Port St. Lucie`, `state = FL`
- St. Lucie County Commission At-Large row (id `11111111-0000-0000-0000-000000000003`) exists, is unchanged, and continues to serve onboarding, ballot grouping, and county election context.
- No `current_officials` rows exist for District 1-5 (confirmed 0 rows, Gate 7 limited verification).
- No `user_districts` rows exist for District 1-5 (confirmed 0 rows, Gate 7 limited verification, consistent with the approved B2 model — District 1-5 is intentionally never assigned to `user_districts`).
- `officials_for_user` (Reference Files/civicmarket_schema_addendum_officials_reviews.sql:112-133) joins `user_districts ud` to `current_officials co` on `co.district_id = ud.district_id`, then to `districts d`. This view is unchanged and, under B2, is never changed.
- `src/lib/officials.ts` `getOfficialsForUser` (lines 21-32) currently does a single `select` from `officials_for_user` filtered by `user_id`, ordered by `name`. This is the only function B2 plans to change.
- `src/components/CurrentOfficialsSection.tsx` renders whatever `getOfficialsForUser` returns, one `OfficialCard` per row, already differentiating cards by `office` + `district_name` (line 39) and by `jurisdiction_level` badge (line 43). No component change is anticipated.
- Three officials are already seeded and live: Stephanie Morgan (city), Debbie Hawley (school_board), Toby Overdorf (state). These read paths must not regress.
- Gate 1 source re-verification (2026-07-07) confirmed proposed District 1-5 officials: James Clasby (District 1), Larry Leet (District 2), Erin Lowry (District 3), Jamie Fowler (District 4), Cathy Townsend (District 5) — proposed only, not yet seeded.

## 2. B2 behavior goal

Later, and only after its own separate approval:

- Add a second, narrow read inside `getOfficialsForUser` that, when the requesting user's `officials_for_user` result (or their `user_districts` rows) includes the At-Large district id, also fetches `current_officials` rows where `district_id` is one of the five District 1-5 ids, and merges them into the returned list.
- Do not change the `officials_for_user` view.
- Do not add District 1-5 rows to `user_districts`.
- Do not change onboarding (`src/app/onboarding/zip/page.tsx`, `ALL_PSL_DISTRICTS`).
- Do not change `ballot_for_user`, `src/lib/candidates.ts`, or any ballot/candidate filtering.
- Do not seed `current_officials` rows for District 1-5 as part of this document.
- Do not implement any of the above app code yet — this document is planning only.

## 3. Files likely affected later

| File | Expected change under B2 | Status |
|---|---|---|
| `src/lib/officials.ts` (`getOfficialsForUser`) | Add a second, merged read for District 1-5 `current_officials` when the user holds the At-Large row | Only file expected to change |
| `Reference Files/civicmarket_schema_addendum_officials_reviews.sql` (`officials_for_user` view) | None — confirmed to stay unchanged under B2 | No change |
| `src/components/CurrentOfficialsSection.tsx` | None expected — already renders `district_name` and `jurisdiction_level` per card | Visual re-verification only, once real rows exist |
| `src/app/onboarding/zip/page.tsx` (`ALL_PSL_DISTRICTS`) | None — must remain untouched | No change |
| `src/lib/candidates.ts` (`getUserDistrictIds`, `getCandidatesForDistricts`) | None — must remain unaffected | No change |
| `ballot_for_user` view (`Reference Files/civicmarket_schema_v4.sql`) | None — must remain unaffected | No change |
| Future SQL draft doc (not yet created) | Would hold the `current_officials` INSERT for James Clasby, Larry Leet, Erin Lowry, Jamie Fowler, Cathy Townsend, following the same gated pattern as docs/current_officials_sql_plan.md | Not started |

## 4. Data dependencies

Before any B2 app code can be implemented and produce visible output, all of the following must independently exist or be re-confirmed:

- The five District 1-5 `districts` rows (exist now — Gate 6, confirmed in Section 1 above).
- The At-Large `districts` row unchanged (exists now — confirmed in Section 1 above).
- Fresh Gate 1-style source re-verification for the five proposed officials (James Clasby, Larry Leet, Erin Lowry, Jamie Fowler, Cathy Townsend) at the time implementation is actually scheduled — the July 7, 2026 verification in the prior plan should not be treated as still current if implementation happens materially later.
- `current_officials` rows for District 1-5, each with a verified official `source_url`, inserted through their own future Gate 4/5/6 SQL sequence (not part of this document).
- At least one test user whose only county `user_districts` row is the At-Large id, to exercise the merged read without affecting any other jurisdiction.

## 5. Proposed implementation gates

These gates are proposed only. None are approved for execution by this document.

- **Gate A — Source re-verification.** Re-confirm the five District 1-5 official names and source URLs are still current, using the same worksheet pattern as Gate 1 in docs/county_commission_district_1_5_future_implementation_plan.md. Stop if any name or source has changed.
- **Gate B — `current_officials` SQL draft.** Draft (do not run) the INSERT for the five District 1-5 `current_officials` rows, referencing the five `district_id`s already in `districts`, each with `source_url`, `jurisdiction_level = county`, `is_on_next_ballot` set per verified source, and `candidate_id = NULL` unless a verified match exists. Include a preflight duplicate check and a post-insert verification query, following the same shape as Gate 4 in the prior plan.
- **Gate C — Explicit approval for the `current_officials` insert.** Mike must explicitly approve the Gate B SQL draft, stating approved names, approved source URLs, and approved `is_on_next_ballot` values, before any SQL is run.
- **Gate D — Execute the `current_officials` insert.** Run the Gate B SQL only after Gate C approval. Verify exactly 5 rows inserted, all five `district_id`s correct, no other table touched.
- **Gate E — `getOfficialsForUser` code draft.** Draft (do not implement) the exact TypeScript change to `src/lib/officials.ts`: detect the At-Large id in the primary query's result or in the user's `user_districts`, issue a second `current_officials` query filtered to the five District 1-5 ids, merge and re-sort before returning.
- **Gate F — Explicit approval for the code change.** Mike must explicitly approve the Gate E code draft before it is implemented.
- **Gate G — Implement and verify.** Implement the approved Gate E change only, run lint/typecheck/build, and manually verify via the test plan in Section 7 below.
- **Gate H — UI verification.** Confirm Home and Profile Current Officials sections show the five District 1-5 cards correctly for an At-Large-holding test user, with no regression to city/school_board/state officials, and update CIVICMARKET_CURRENT_STATE.md.

## 6. Risk check

Scope: Planning for a future `getOfficialsForUser` widening and District 1-5 `current_officials` seeding only.

No-change risk: County Commission District 1-5 officials remain blocked from Current Officials display indefinitely; users continue to see only city/school_board/state officials plus no county-district detail.

Change risk (when eventually implemented):

- Five extra county commissioner cards appearing for every At-Large-holding user is a UI density change; must be visually re-verified, not assumed safe from code reading alone.
- District 1-5 ids would be hardcoded a second time (already hardcoded once in the prior plan's Gate 2 worksheet) inside `getOfficialsForUser`; the two lists could drift if one is edited without the other.
- Any mistake in the merged-read logic risks showing county officials to a user who does not hold the At-Large row, or omitting them for a user who does.
- `is_on_next_ballot` accuracy per District 1-5 seat is a separate, independent data-correctness question requiring its own official source per the project's non-negotiable `source_url` rule.
- A bug introduced into `getOfficialsForUser` while adding the merged read could regress the three already-seeded officials (Stephanie Morgan, Debbie Hawley, Toby Overdorf) even though the view itself is untouched, since the function's return path changes.

## 7. Test plan (for whenever Gates A-H are eventually approved and executed)

- Regression: Stephanie Morgan (city), Debbie Hawley (school_board), and Toby Overdorf (state) still appear correctly for their existing test users after the `getOfficialsForUser` change, with no change to `officials_for_user` itself.
- New behavior: a test user whose only county `user_districts` row is the At-Large id sees exactly the 5 District 1-5 officials (once seeded) in Current Officials, in addition to any other jurisdiction officials they already had.
- Isolation: `/onboarding/zip` behavior, `ALL_PSL_DISTRICTS`, `user_districts` row count for the test user, and `ballot_for_user` output are diffed before/after the code change — expect zero change in all four.
- Duplicate/confusion check: manually verify the 5 commissioner cards render distinctly (name + "District N" via `district_name`) and do not read as unexplained duplicates of the At-Large assignment card.
- Negative check: a user with no county `user_districts` row at all still sees zero county officials.
- Negative check: a user with a county `user_districts` row that is not the At-Large id (should not currently exist, but confirm defensively) does not receive District 1-5 officials.
- Rollback check: reverting the `getOfficialsForUser` change cleanly restores pre-widening behavior with no data loss, since the `current_officials` rows are additive-only and the view was never touched.

## 8. Hard stops

Stop before, and do not perform any of the following as part of this document or without their own separate explicit approval:

- Changing the `officials_for_user` database view.
- Adding District 1-5 rows to `user_districts`.
- Changing onboarding (`src/app/onboarding/zip/page.tsx`, `ALL_PSL_DISTRICTS`).
- Changing `ballot_for_user` or `src/lib/candidates.ts`.
- Inserting District 1-5 `current_officials` rows without Gate A re-verification and Gate C explicit approval.
- Implementing the `getOfficialsForUser` change without Gate E draft and Gate F explicit approval.
- Renaming, deleting, replacing, or repurposing the St. Lucie County Commission At-Large row.
- Assigning individual commissioners to the At-Large row.
- Any schema, seed, or SQL migration file change.

## 9. Explicit no-change protections

This document makes no changes and authorizes none. Specifically, as of this document:

- `src/lib/officials.ts` is unchanged.
- `src/components/CurrentOfficialsSection.tsx` is unchanged.
- `src/app/onboarding/zip/page.tsx` is unchanged.
- `src/lib/candidates.ts` is unchanged.
- The `officials_for_user` view is unchanged.
- No `current_officials` rows exist for District 1-5.
- No `user_districts` rows exist for District 1-5.
- The St. Lucie County Commission At-Large row (id `11111111-0000-0000-0000-000000000003`) is unchanged — not renamed, deleted, replaced, or repurposed.
- No schema, seed file, SQL migration file, or Supabase data was modified by creating this document.
- Repo working tree state before this document was added: clean, on `master`, up to date with `origin/master`.
