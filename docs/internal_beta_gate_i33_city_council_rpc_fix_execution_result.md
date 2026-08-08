# Gate I33 — City Council RPC Ambiguity Fix: Execution Result

Status: **Manually executed and live-verified successfully. Fix is live. No `user_districts` mutation occurred. Both write guards remain `false`.**

Date: 08-08-2026

Full design/preparation record: `docs/internal_beta_gate_i32_city_council_rpc_ambiguity_fix_preparation.md`.

## Approval this gate executed under

The user explicitly approved, in full:

- Replacing `public.set_psl_city_council_district(uuid)` via `CREATE OR REPLACE FUNCTION`.
- The only approved logic change: the `DELETE` predicate changed from the unqualified `district_id` reference to `user_districts.district_id`.
- Manual execution of the corrected `CREATE OR REPLACE FUNCTION` statement in the Supabase SQL Editor, followed by read-only verification queries.
- Explicitly not approved: any other schema, function, grant, RLS, policy, table, district, user-data, or application-code change; the District 1 → District 3 live assignment test; enabling either write guard; deployment.

## What was done

The project owner manually executed the exact `CREATE OR REPLACE FUNCTION` statement prepared in Gate I32 (§5 of that document) in the Supabase SQL Editor, then ran the three read-only verification queries prepared in Gate I32 (§6). This session did not execute any SQL — Supabase execution requires the Supabase SQL Editor, which this session has no direct access to, consistent with every prior live write in this project (e.g. Gate I26, Gate I30C).

## The approved change

```
OLD:  DELETE FROM user_districts WHERE user_id = v_user_id AND district_id IN (...)
NEW:  DELETE FROM user_districts WHERE user_id = v_user_id AND user_districts.district_id IN (...)
```

This resolves the PostgreSQL `42702` "column reference district_id is ambiguous" error discovered live in Gate I31, caused by the `RETURNS TABLE (district_id uuid)` clause implicitly declaring a PL/pgSQL variable of the same name as the `user_districts.district_id` column referenced in the `DELETE` statement's `WHERE` clause. No other line of the function was changed.

## Manual execution result (as reported by the project owner)

- `CREATE OR REPLACE FUNCTION`: **Success. No rows returned.**

## Live verification results (as reported by the project owner)

**Function metadata:**

| Field | Value |
|---|---|
| `proname` | `set_psl_city_council_district` |
| `prosecdef` | `false` (confirms `SECURITY INVOKER`, not `SECURITY DEFINER`) |
| `identity_arguments` | `p_district_id uuid` |
| `result_type` | `TABLE(district_id uuid)` |
| `proconfig` | `["search_path=public, pg_temp"]` |

**Privilege verification:**

| Check | Value |
|---|---|
| `anon_can_execute` | `false` |
| `authenticated_can_execute` | `true` |

## Interpretation

- `SECURITY INVOKER` preserved (`prosecdef = false`).
- Function signature unchanged (`p_district_id uuid`, matching the pre-fix signature exactly).
- Return type unchanged (`TABLE(district_id uuid)`, matching the pre-fix return type exactly — confirming the fix was scoped to the function body only, not the signature).
- `search_path` unchanged (`public, pg_temp`).
- `anon` still cannot execute — confirmed `false`.
- `authenticated` can execute — confirmed `true`.
- `CREATE OR REPLACE FUNCTION` preserved the required privileges automatically, exactly as predicted in Gate I32 §7–§8 (grants are not altered by a replace when the signature is unchanged). The optional idempotent `REVOKE`/`GRANT` fallback prepared in Gate I32 §5 was not needed and was not run.
- The corrected function now matches, field for field, the "Complete proposed `CREATE OR REPLACE FUNCTION` statement" in Gate I32 §5.
- No API route change is required. `src/app/api/set-city-council-district/route.ts` calls the RPC opaquely (`userScopedSupabase.rpc('set_psl_city_council_district', { p_district_id: ... })`) and never destructures the result by column name, so it is unaffected by anything in this fix. Confirmed unchanged by this gate's own repository diff check (see below).

## Repository diff verification

`git status --short` before this gate's documentation changes showed exactly one untracked file: the Gate I32 draft document. No source file (`src/app/api/set-city-council-district/route.ts`, any other route, any component, `Reference Files/civicmarket_schema_addendum_city_council_district_rpc.sql`) was modified by this session. `git diff --stat` against tracked files was empty. Only documentation files were touched by this gate.

## What did not happen (explicitly, per instruction)

- The District 1 → District 3 live assignment test was **not** performed.
- Neither write guard was enabled.
- No additional Supabase write was performed beyond the one approved `CREATE OR REPLACE FUNCTION` statement and the read-only verification queries.
- No deployment occurred.
- No RLS, grants (beyond what `CREATE OR REPLACE FUNCTION` itself preserved automatically), policies, schema, seeds, districts, or user data were modified.
- No secret, `.env`, API key, password, credential, or service-role key was inspected or exposed.

## Current safety state (confirmed)

- `ENABLE_CITY_COUNCIL_DISTRICT_WRITE = false` (unchanged; `route.ts` was never edited this gate).
- `ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE = false` (unchanged; untouched).
- No `user_districts` row was created, updated, or deleted during this gate.
- `civicmarket.test.01@example.com` remains on City Council District 1 (Stephanie Morgan) — unaffected, since no assignment call was made.

## Remaining unresolved / deferred

- The Gate I32 §9 regression test plan — including the live District 1 → District 3 → District 1 round-trip test — has not been executed. It remains blocked pending a separate, explicit, scoped test-account write approval, following the same pattern used for Gate I31.
- The pre-existing District 1 election-date discrepancy (live `2026-11-03` vs. Gate I18's documented `August 18, 2026`) remains open and unresolved — unrelated to and unaffected by this gate.
- The District 1 onboarding-default accuracy risk (every onboarded user defaults to City Council District 1 regardless of actual address) remains open and unresolved — unrelated to and unaffected by this gate.

## Recommended next gate

Gate I34 — City Council District 1 → District 3 → District 1 Live Regression Test, only after a fresh, explicit, scoped test-account write approval (test account identity, temporary guard enablement, immediate guard restoration, rollback confirmation) is given, following the Gate I31 approval pattern exactly.

## No-change confirmation — Gate I33

Beyond the one explicitly approved live SQL execution (`CREATE OR REPLACE FUNCTION public.set_psl_city_council_district`) and this gate's documentation files, Gate I33 made no changes to: `candidates`, `voting_records`, `candidate_positions`, `match_scores`, `civic_dna`, `civic_dna_answers`, `user_districts`, `districts`, `elections`, `current_officials`, `officials_for_user`, `src/lib/officials.ts`, `CurrentOfficialsSection`, `src/app/api/set-city-council-district/route.ts`, `src/app/api/set-county-commission-district/route.ts`, schema, RLS, seeds, migrations, CSV files, PowerShell scripts, API keys, environment variables, the At-Large row, or deployment state. No database write occurred beyond the one approved function replacement. No secret file was inspected. `ENABLE_CITY_COUNCIL_DISTRICT_WRITE` remains `false`. `ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE` remains `false`. No deployment occurred.
