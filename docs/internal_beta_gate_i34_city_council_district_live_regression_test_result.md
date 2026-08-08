# Gate I34 — City Council District 1 → District 3 → District 1 Live Regression Test: Result

Status: **PASS. The corrected RPC completed a real, atomic District 1 → District 3 assignment and a real, atomic District 3 → District 1 rollback for the approved test account. Both write guards confirmed restored to `false`. No unintended side effects found.**

Date: 08-08-2026

Full RPC fix record: `docs/internal_beta_gate_i32_city_council_rpc_ambiguity_fix_preparation.md` (design), `docs/internal_beta_gate_i33_city_council_rpc_fix_execution_result.md` (execution/verification).

## Approval this gate executed under

The user explicitly approved, in full:

- Test account: `civicmarket.test.01@example.com` (user UUID `ec59ea92-470f-447f-8873-ab2dbde52aca`), verified real district City Council District 1.
- Temporarily setting `ENABLE_CITY_COUNCIL_DISTRICT_WRITE = true`.
- One controlled District 1 → District 3 assignment via the approved API/RPC path.
- After verifying District 3 behavior, one controlled District 3 → District 1 assignment via the same path to restore the correct real district.
- Immediate restoration of `ENABLE_CITY_COUNCIL_DISTRICT_WRITE = false` after rollback.
- `ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE` remaining `false` throughout.
- No deployment; no schema, RLS, grant, policy, migration, seed, district, or unrelated user-data changes.

## Pre-test baseline (confirmed)

- Clean git working tree at commit `8e1de30` (Document City Council RPC ambiguity fix verification).
- `ENABLE_CITY_COUNCIL_DISTRICT_WRITE = false`, `ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE = false` — both confirmed by direct file read before any edit.
- A single, healthy pre-existing `npm run dev` process tree was already running on port 3000 (verified via `Get-CimInstance Win32_Process` — one clean `npm → next dev → next server → postcss worker` chain, no stray duplicates); reused rather than restarted.
- `/profile` for the test account, loaded via the already-authenticated browser session (assistant never entered credentials), confirmed the exact expected starting state: Debbie Hawley (School Board District 1), Stephanie Morgan (City Council District 1), Tobin Rogers "Toby" Overdorf (FL House District 85); no Mayor; no fourth official.

## What was done

1. Edited `src/app/api/set-city-council-district/route.ts` locally (never committed) to set `ENABLE_CITY_COUNCIL_DISTRICT_WRITE = true`, with an inline comment marking it Gate I34 temporary.
2. Confirmed `ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE` in the sibling route remained `false`, unedited, throughout.
3. Using the already-authenticated browser session, navigated to `/profile/city-council-district`, selected "City Council District 3", checked the attestation checkbox, and submitted.
4. Confirmed the real (non-dry-run) success path: the page displayed exactly `"Your City Council district was saved."` — the code path taken only when the API response has `dryRun: false` (`src/app/profile/city-council-district/page.tsx` lines 82-86), distinct from the dry-run fallback message.
5. Reloaded `/profile`: confirmed **Anthony Bonna, Sr. — City Council Member, District 3** now appears in My Current Officials, in place of Stephanie Morgan.
6. Loaded `/ballot`: confirmed the City section now shows **Fritz Alexandre, Jim Norton, Peter Overhuls** (City Council District 3), and no longer shows the four District 1 candidates.
7. Returned to `/profile/city-council-district`, selected "City Council District 1", checked the attestation checkbox, and submitted.
8. Confirmed the same real success path again: `"Your City Council district was saved."`
9. Reloaded `/profile`: confirmed **Stephanie Morgan — City Council Member, District 1** reappeared, Anthony Bonna no longer present.
10. Loaded `/ballot`: confirmed the four District 1 candidates (Eric Reikenis, Fredric Meltzer, Indony Baptiste, Kevin Zimmerman) reappeared, and the three District 3 candidates no longer appeared.
11. Ran `git diff src/app/api/set-city-council-district/route.ts` to inspect the pending guard-flip edit, then `git checkout -- src/app/api/set-city-council-district/route.ts` to revert it exactly to the committed `HEAD` version.
12. Confirmed via `git diff --stat` (empty) and `git status --short` (no output) that the working tree was fully clean, and via direct `grep` that line 10 reads `const ENABLE_CITY_COUNCIL_DISTRICT_WRITE = false` again.
13. Confirmed via direct `grep` that `ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE` in the sibling route still reads `false`.
14. Closed the browser tab used for testing.
15. Ran `npm run build` and `npm run lint`.

## Temporary District 3 state — verified against every expected item

| Expected | Result |
|---|---|
| City Council District 3 assignment took effect | **PASS** — confirmed via the "Your City Council district was saved" real-success message and via My Current Officials/ballot content below |
| Anthony Bonna, Sr. appears as Current Official | **PASS** — "Anthony Bonna, Sr. — City Council Member, District 3" shown live on `/profile` |
| District 3 ballot content appears | **PASS** — Fritz Alexandre, Jim Norton, Peter Overhuls shown live on `/ballot`, City Council District 1 candidates absent |
| School Board unchanged | **PASS** — Debbie Hawley (School Board District 1) still shown, unchanged |
| County Commission At-Large unchanged | **PASS (by omission, consistent with baseline)** — At-Large was never surfaced as a named Current Official row even in the pre-test baseline (no seeded `current_officials` row at that level is displayed this way); no new or missing County-related row appeared as a result of this test |
| FL House unchanged | **PASS** — Tobin Rogers "Toby" Overdorf (FL House District 85) still shown, unchanged |
| FL Senate unchanged | **PASS (by omission, consistent with baseline)** — FL Senate District 27 was not surfaced as a named Current Official row even in the pre-test baseline, for the same reason as County Commission At-Large; unaffected either way |
| Mayor remains absent | **PASS** — no Mayor row appeared before, during, or after the test, consistent with Gate I27 (Mayor was never assigned to this pre-existing test account) |

## Final rollback state — verified against every expected item

| Expected | Result |
|---|---|
| City Council District 1 | **PASS** — confirmed via the second "Your City Council district was saved" real-success message |
| Stephanie Morgan appears as Current Official | **PASS** — reappeared live on `/profile`, exactly as before the test |
| No District 3 assignment remains | **PASS** — Anthony Bonna no longer appears on `/profile`; District 3 candidates no longer appear on `/ballot`; District 1 candidates reappeared |
| School Board unchanged | **PASS** — Debbie Hawley unchanged throughout |
| County Commission At-Large unchanged | **PASS** — unaffected, consistent with baseline (see note above) |
| FL House unchanged | **PASS** — Tobin Rogers "Toby" Overdorf unchanged throughout |
| FL Senate unchanged | **PASS** — unaffected, consistent with baseline (see note above) |
| Mayor remains absent | **PASS** — unchanged throughout |
| `ENABLE_CITY_COUNCIL_DISTRICT_WRITE = false` | **PASS** — confirmed restored via `git diff`/`git status` (clean) and direct file read |
| `ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE = false` | **PASS** — confirmed unchanged via direct file read |

## What this confirms about the Gate I32/I33 fix

The atomic delete-then-insert inside `set_psl_city_council_district` now completes successfully for a real authenticated call in both directions (D1→D3 and D3→D1), with no `42702` error and no partial-write state observed at any point. This is the first successful real invocation of the function since it was created in Gate I30C — Gate I31's two attempts both failed before any row was touched, and Gate I33 only verified metadata/grants, not an authenticated call. Gate I34 is the first live proof that the corrected function fulfills its original design intent end-to-end.

## Cleanup performed and verified

- `src/app/api/set-city-council-district/route.ts` reverted via `git checkout --` to exactly match committed `HEAD`; `git diff --stat` and `git status --short` both confirmed a fully clean working tree.
- `ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE` confirmed unchanged (`false`) throughout — never touched.
- The browser tab used for testing was closed.
- No dev-server process cleanup was required — the single pre-existing healthy process tree was reused throughout and left running exactly as found.
- `npm run build` passed (27 routes, no errors).
- `npm run lint` reported only the same 5 known pre-existing `@typescript-eslint/no-require-imports` errors in `scripts/import-real-psl-data.cjs` and `scripts/validate-real-psl-csvs.cjs` — nothing new.

## Final state (all confirmed)

`civicmarket.test.01@example.com` is on City Council District 1 (Stephanie Morgan), matching its verified real district — unchanged from before the test began. School Board District 1, County Commission At-Large, FL House District 85, FL Senate District 27 all unaffected. Mayor remains absent for this account. No District 3 assignment exists for this account. No other user was touched. `ENABLE_CITY_COUNCIL_DISTRICT_WRITE = false`. `ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE = false`. No deployment occurred. No schema, RLS, grants, policies, migrations, seeds, or district-definition changes were made. No secret or credential was exposed; the assistant never entered credentials.

## Recommended next gate

None required to unblock further City Council district work — the write path is now proven correct in both directions under controlled conditions. Any future gate to actually enable this feature for real users (beyond this one scoped test) would require its own separate, explicit approval, following the same discipline used throughout this project (parallel to how the County Commission write path remains fully designed but deliberately still disabled).

## No-change confirmation — Gate I34

Gate I34 made no lasting changes to: `candidates`, `voting_records`, `candidate_positions`, `match_scores`, `civic_dna`, `civic_dna_answers`, `districts`, `elections`, `officials_for_user`, `src/lib/officials.ts`, `CurrentOfficialsSection`, `set_psl_city_council_district` (called twice, not edited), schema, tables, seeds, migrations, CSV files, RLS, grants, `src/app/api/set-city-council-district/route.ts` (reverted to match `HEAD`), `src/app/api/set-county-commission-district/route.ts`, PowerShell scripts, API keys, environment variables, the County Commission write guard, the At-Large row, or deployment state. `current_officials` and `user_districts` for `civicmarket.test.01@example.com` returned to their exact pre-test values by the end of the gate (two real, approved, scoped writes — one out, one back — leaving no net change). No other user's data was touched. No secret file was inspected. No credentials were entered. `ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE` remains `false`. `ENABLE_CITY_COUNCIL_DISTRICT_WRITE` was temporarily `true` during this test and is confirmed restored to `false`. No deployment occurred.
