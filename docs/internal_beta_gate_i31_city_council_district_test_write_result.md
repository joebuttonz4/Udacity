# Gate I31 — City Council District Test-Account Write: Result

Status: **Attempted under explicit approval. Write did not occur. A defect was found in the deployed `set_psl_city_council_district` SQL function. No rollback was needed because no state ever changed.**

Date: 08-08-2026

## Approval this gate executed under

The user explicitly approved, in full, a controlled City Council district assignment test for:

- Test account: `civicmarket.test.01@example.com`
- User UUID: `ec59ea92-470f-447f-8873-ab2dbde52aca`
- Verified real district: City Council District 1
- Temporarily setting `ENABLE_CITY_COUNCIL_DISTRICT_WRITE = true`
- One controlled District 1 → District 3 assignment, followed immediately by verification and rollback to District 1 through the approved RPC
- Immediate restoration of `ENABLE_CITY_COUNCIL_DISTRICT_WRITE = false` after rollback
- `ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE` remaining `false` throughout

## What was done

1. Confirmed a clean starting git state (matching commit `384f825`).
2. Edited `src/app/api/set-city-council-district/route.ts` locally (never committed) to set `ENABLE_CITY_COUNCIL_DISTRICT_WRITE = true`.
3. Confirmed `ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE` in the sibling route remained `false` throughout, unedited.
4. Cleaned up a stray leftover dev-server process tree from an earlier gate and started one clean `npm run dev` instance on port 3000.
5. Using the already-authenticated browser session for `civicmarket.test.01@example.com` (the assistant never entered credentials), navigated to `/profile/city-council-district`, selected "City Council District 3", checked the attestation checkbox, and submitted.
6. The submission failed: the UI showed "Failed to save verified district" and the network request returned `500`.
7. Retried once (identical result, `500` both times) to rule out a one-off fluke, and to capture a diagnostic log.
8. Added a single temporary `console.error` line logging `rpcError` in the same file, retried the submission once more to capture the real Postgres error, then removed that debug line immediately afterward (never committed at any point).

## The defect found

The RPC's own SQL, exactly as approved and already live in Supabase (`Reference Files/civicmarket_schema_addendum_city_council_district_rpc.sql`, Gate I30C), returned:

```
code: '42702'
message: 'column reference "district_id" is ambiguous'
details: 'It could refer to either a PL/pgSQL variable or a table column.'
```

Root cause: `RETURNS TABLE (district_id uuid)` implicitly declares a PL/pgSQL variable named `district_id` scoped to the entire function body. The `DELETE FROM user_districts WHERE user_id = v_user_id AND district_id IN (...)` statement inside the function references `district_id`, which Postgres cannot resolve between that output variable and `user_districts.district_id`, so the statement itself never executes — it fails to plan.

This is a bug in the deployed SQL function's own naming, not in `route.ts`, not in RLS, not in the app's request handling, and not a result of anything this gate changed. Gate I30C's prior verification (an anonymous `curl` call returning `42501 permission denied`) correctly confirmed the function was **unreachable by anon**, but never exercised an authenticated call — so this ambiguity was never triggered until this gate's first real authenticated invocation.

## Why no rollback was needed

Because the `DELETE` statement fails at the planning stage (before any row is touched), and the whole function body executes as one implicit transaction where any error aborts every effect, **no row was ever deleted or inserted** — not partially, not fully. This was true on both of the two failed attempts.

This was independently confirmed by live UI observation, not inferred from the error alone: after both failed attempts, `/profile` → My Current Officials for `civicmarket.test.01@example.com` still showed exactly the same three officials as before the test — Debbie Hawley (School Board District 1), **Stephanie Morgan (City Council District 1)**, and Tobin Rogers "Toby" Overdorf (FL House District 85) — with no Anthony Bonna, Sr. / District 3 official appearing, and no fourth official appearing.

No second (rollback) RPC call was made, because there was nothing to roll back.

## Cleanup performed

- `src/app/api/set-city-council-district/route.ts` was reverted via `git checkout --` to exactly match the committed `HEAD` version. `git diff` and `git status --short` both confirmed a clean working tree — the guard-flip edit and the temporary debug `console.error` line are both gone; neither was ever committed.
- `ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE` was confirmed unchanged (`false`) throughout — it was never touched.
- The dev server and its full process tree (including a stray leftover tree from an earlier gate's incomplete cleanup) were force-stopped; confirmed no `next dev`/`npm run dev` process remains and no listener remains on port 3000.
- `npm run build` passed (27 routes, no errors).
- `npm run lint` reported only the same 5 known pre-existing `@typescript-eslint/no-require-imports` errors in `scripts/import-real-psl-data.cjs` and `scripts/validate-real-psl-csvs.cjs` — nothing new.

## Final state (all confirmed)

- `civicmarket.test.01@example.com` remains on City Council District 1 (Stephanie Morgan), unchanged.
- School Board District 1, County Commission At-Large, FL House District 85, FL Senate District 27 — all unchanged (not touched by this gate at all).
- Mayor remains absent for this account (not added, per explicit instruction).
- No District 3 assignment exists for this account.
- No other user was touched.
- `ENABLE_CITY_COUNCIL_DISTRICT_WRITE = false` (confirmed via clean `git diff`).
- `ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE = false` (unchanged).
- No deployment occurred.
- No schema, RLS, grants, policies, migrations, seeds, or district-definition changes were made.
- No secret or credential was exposed; the assistant never entered credentials.

## What this gate did NOT accomplish

The approved test's actual goal — proving the atomic District 1 → District 3 → District 1 replacement works end-to-end — **was not achieved**, because the underlying RPC cannot currently complete a write at all for any input due to the ambiguous-column defect. This is not a partial success; it is a blocked test that surfaced a real, previously-undetected bug in already-deployed SQL.

## Required before any future write attempt

The `set_psl_city_council_district` function must be corrected — at minimum, the `RETURNS TABLE (district_id uuid)` output column needs a name that does not collide with `user_districts.district_id` (e.g. `RETURNS TABLE (out_district_id uuid)`, or qualifying every table reference to `district_id` with the table name/alias, e.g. `user_districts.district_id`). This is a **function/schema change** and, per standing project rules, requires its own separate, explicit approval gate before being drafted, approved, and manually executed in the Supabase SQL Editor — the same discipline used for every prior County Commission and City Council gate in this sequence. No such fix has been drafted, approved, or applied by this document.

Recommended next gate: **Gate I32 — City Council RPC Ambiguous-Column Fix (design + approval + manual execution)**, followed by a repeat of this same controlled D1→D3→D1 test once the corrected function is live.

## No-change confirmation — Gate I31

Gate I31 made no lasting changes to: `candidates`, `voting_records`, `candidate_positions`, `match_scores`, `civic_dna`, `civic_dna_answers`, `user_districts` (the two attempted writes both failed and left zero rows changed), `districts`, `current_officials`, `officials_for_user`, `src/lib/officials.ts`, `CurrentOfficialsSection`, `set_psl_city_council_district` (the function itself was not edited — only called), schema, tables, seeds, migrations, CSV files, RLS, grants, `src/app/api/set-city-council-district/route.ts` (reverted to match `HEAD` exactly), `src/app/api/set-county-commission-district/route.ts`, PowerShell scripts, API keys, environment variables, the County Commission write guard, the At-Large row, or deployment state.

No database write was performed (both attempts errored before any row changed). No candidate was scored. No political recommendation was produced. No Claude or Anthropic API call was made. No secret file was inspected. No credentials were entered. `ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE` remains `false`. `ENABLE_CITY_COUNCIL_DISTRICT_WRITE` was temporarily `true` during this test and is confirmed restored to `false`. No County Commission District 1-5 write was performed. No deployment occurred.
