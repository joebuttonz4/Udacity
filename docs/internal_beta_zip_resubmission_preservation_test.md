# Milestone 2A — ZIP Resubmission Preservation Test

Date: 08-16-2026

Status: **PASS.** Live-tested via the normal application ZIP onboarding path only. No manual/direct Supabase write. No City Council write API/RPC used. Both write guards remained `false` throughout.

## Purpose

Prove live that re-running ZIP onboarding does **not** delete or replace a previously verified City Council District 1 assignment for an existing account. This validates the Gate I36 delete-scoping fix (`ZIP_MANAGED_DISTRICTS` in `src/app/onboarding/zip/page.tsx`, which excludes City Council District 1 (`...0001`) and District 3 (`...0007`) from the scoped `user_districts` delete-then-insert).

This is exactly the item Milestone 1 explicitly deferred: *"Task item 10 (verifying a pre-existing verified City Council row survives ZIP resubmission) was explicitly deferred rather than improvised, since it would have required signing into the heavily-reused shared account `civicmarket.test.01@example.com`..."* Milestone 2A performs that deferred check.

## Test account

- Email: `civicmarket.test.01@example.com`
- User UUID: `ec59ea92-470f-447f-8873-ab2dbde52aca`
- Verified real district: City Council District 1 (`11111111-0000-0000-0000-000000000001`, official Stephanie Morgan)
- Signed in by the project owner directly in the browser. The assistant never entered, requested, or inspected the account password — pausing for that specific step was the only credential-dependent pause in this test, consistent with the standing prohibition on entering passwords into any field.

## Repository baseline (verified before testing)

- `git status`: clean working tree.
- `git log --oneline -5` (HEAD): `162002e Validate City Council-safe onboarding flow`, `2e38b20 Document candidate position evidence table Gate I37`, `92c4265 Fix City Council onboarding district default`, `d9a3e4c Record City Council district live regression test`, `8e1de30 Document City Council RPC ambiguity fix verification`. Up to date with `origin/master`.
- `ENABLE_CITY_COUNCIL_DISTRICT_WRITE = false` (`src/app/api/set-city-council-district/route.ts`).
- `ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE = false` (`src/app/api/set-county-commission-district/route.ts`).

## Pre-test verification (read-only)

Queried live via the browser's own already-authenticated Supabase REST call (captured `Authorization`/`apikey` request headers replayed internally through `fetch`, never printed or exposed in any output) — a read-only `GET` against `user_districts`, scoped by RLS to the signed-in user's own rows only.

**Exact pre-test `user_districts` rows (5 rows):**

| district_id | name | scope |
|---|---|---|
| `11111111-0000-0000-0000-000000000001` | City Council District 1 | city |
| `11111111-0000-0000-0000-000000000002` | School Board District 1 | county |
| `11111111-0000-0000-0000-000000000003` | St. Lucie County Commission At-Large | county |
| `11111111-0000-0000-0000-000000000004` | FL House District 85 | state |
| `11111111-0000-0000-0000-000000000005` | FL Senate District 27 | state |

No Mayor row (`...0006`) existed pre-test — recorded as observed, not assumed, consistent with this being an older account that predates Mayor being added to `ZIP_MANAGED_DISTRICTS` (Gate I27).

**Current Officials (Profile page) pre-test:** Debbie Hawley (School Board District 1), **Stephanie Morgan (City Council District 1)**, Tobin Rogers "Toby" Overdorf (FL House District 85). Stephanie Morgan's presence confirmed before the test, as required.

**Ballot pre-test:** City Council District 1 only — Eric Reikenis, Fredric Meltzer, Indony Baptiste, Kevin Zimmerman, all showing "Match unavailable — not enough verified position data yet."

## Test procedure

1. Local dev server started fresh (nothing was previously running on port 3000) and confirmed ready.
2. Signed in as `civicmarket.test.01@example.com` in the browser (project owner entered credentials; assistant did not).
3. Navigated the normal onboarding ZIP path directly (`/onboarding/zip`), entered ZIP `34953`, clicked Continue. ZIP was used only as the normal form input — never used to infer or select City Council District 1 vs. District 3.
4. Proceeded through the resulting `/onboarding/districts` confirmation screen ("These Are My Races →") — this screen displayed City Council District 1 and Mayor race candidates as ZIP-area context; it is a display step, not itself the write.
5. On `/onboarding/dna-teaser`, selected **"I'll do this later"** rather than retaking the Civic DNA quiz — retaking the quiz was out of scope for this test and risked an unrelated change to this account's Civic DNA scores.
6. Landed on Home (`/`), confirming onboarding completed.

## Post-resubmission verification (read-only)

Same read-only REST pattern, re-captured after the resubmission (the intermediate full-page navigations reset the in-page header capture, so it was re-armed via a client-side navigation before re-querying).

**Exact post-resubmission `user_districts` rows (6 rows):**

| district_id | name | scope |
|---|---|---|
| `11111111-0000-0000-0000-000000000001` | City Council District 1 | city |
| `11111111-0000-0000-0000-000000000002` | School Board District 1 | county |
| `11111111-0000-0000-0000-000000000003` | St. Lucie County Commission At-Large | county |
| `11111111-0000-0000-0000-000000000004` | FL House District 85 | state |
| `11111111-0000-0000-0000-000000000005` | FL Senate District 27 | state |
| `11111111-0000-0000-0000-000000000006` | Mayor | city |

**District 1 preservation: CONFIRMED.** `11111111-0000-0000-0000-000000000001` (City Council District 1) is present in both the pre-test and post-test row sets, unmodified.

**District 3 absence: CONFIRMED.** `11111111-0000-0000-0000-000000000007` (City Council District 3) does not appear anywhere in the pre-test or post-test row sets.

**Mayor row added:** `11111111-0000-0000-0000-000000000006` is a new row not present pre-test. This is the expected, correct effect of Gate I27 (Mayor is part of `ZIP_MANAGED_DISTRICTS`, so a ZIP resubmission refreshes it for an account that predates that change) — not a defect, and not evidence against the delete-scoping fix, since Mayor is one of the five districts the ZIP-managed delete is intentionally scoped to touch.

The four ZIP-managed rows that existed both before and after (`...0002`, `...0003`, `...0004`, `...0005`) are consistent with having been deleted and reinserted by the scoped delete-then-insert — their presence and values are unchanged, which is the expected outcome of a correct refresh, not proof of the underlying delete/insert mechanics by itself. The critical proof point is negative: `...0001` and `...0007` were structurally never candidates for that delete, and the row that would prove a violation (`...0001` disappearing, or `...0007` appearing) did not occur.

## Current Officials after ZIP resubmission

Confirmed via the Profile page: Debbie Hawley (School Board District 1), **Stephanie Morgan (City Council District 1) — still present**, Tobin Rogers "Toby" Overdorf (FL House District 85). **Anthony Bonna, Sr. — absent**, as expected (no District 3 assignment exists for this account). Civic DNA scores unchanged from pre-test (Growth & Development +1, Taxes & Services +1.5, Education 0, Environment +1, Public Safety −2, Housing −0.5, Transparency +1.5), consistent with the DNA quiz never being retaken.

## Ballot after ZIP resubmission

Confirmed via the Ballot page: City Council District 1 — Eric Reikenis, Fredric Meltzer, Indony Baptiste, Kevin Zimmerman, **all still present**, unchanged. City Council District 3 candidates — **absent**, as expected. A new Mayor race section appeared (Eric Strazzeri, Steven Giordano, Steven Harrington, Shannon Martin marked Incumbent) — expected and correct, consistent with the newly added Mayor `user_districts` row; not a City Council-related change.

## Confirmation: no City Council write API/RPC was used

Browser network requests were tracked continuously from before the ZIP resubmission through the post-test Ballot check. **Zero requests to `set-city-council-district` occurred** at any point in this test. `/profile/city-council-district` was never navigated to, and its "Set City Council District" link was never clicked. This test therefore proves preservation happened through the scoped ZIP delete-then-insert logic itself (Gate I36), not through any re-save via the (still-disabled) verification API/RPC.

## Build and lint

- `npm run build`: **passed** — 27 routes, no errors.
- `npm run lint`: reported only the same 5 known pre-existing `@typescript-eslint/no-require-imports` errors in `scripts/import-real-psl-data.cjs` and `scripts/validate-real-psl-csvs.cjs` — nothing new.
- `git status --short` after testing: clean — no transient source or debug changes were left in the working tree.

## Guard re-check

- `ENABLE_CITY_COUNCIL_DISTRICT_WRITE = false` — confirmed unchanged after the test.
- `ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE = false` — confirmed unchanged after the test.

## Result

**PASS.** City Council District 1 survived a real ZIP resubmission for the shared, real-district-verified test account, City Council District 3 never appeared, Current Officials and Ballot both reflected the correct district set before and after, no City Council write API/RPC was used, build and lint both passed, and both write guards remained `false` throughout. This closes the Milestone 1-deferred item 10.

## Limitations

- Only one shared test account (`civicmarket.test.01@example.com`) was used, consistent with the project's established minimal-blast-radius pattern for this account; a second account with a *different* pre-existing verified City Council assignment (e.g. District 3) was not tested, since no such verified account currently exists (District 3 write remains behind the same disabled guard).
- The Civic DNA quiz was intentionally not retaken; this test does not exercise any interaction between DNA retake and district preservation.
- No 390px/mobile viewport or accessibility check was performed — out of scope for this specific preservation test.
- This test does not itself prove the scoped delete-then-insert's behavior for `...0007` (City Council District 3) surviving a resubmission, since this account has no District 3 row to begin with — only District 1 preservation and District 3 non-appearance were verified.

## No-change confirmation

No schema, RLS, grants, policies, functions, migrations, seeds, or district-definition change was made. No manual/direct Supabase SQL write was performed — every effect (and the one confirmed non-effect, City Council District 3 absence) came through the normal application flow. No other user was modified. No secret, `.env`, API key, password, service-role key, or credential was inspected, requested, or exposed. `ENABLE_CITY_COUNCIL_DISTRICT_WRITE` remains `false`. `ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE` remains `false`. No deployment occurred.
