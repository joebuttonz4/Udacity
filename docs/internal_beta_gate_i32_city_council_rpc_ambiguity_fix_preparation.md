# Gate I32 — City Council RPC Ambiguous-Column Fix (Design + Preparation Only)

Status: **Design and SQL preparation complete. The proposed fix below was manually executed and verified live in Gate I33 — see `docs/internal_beta_gate_i33_city_council_rpc_fix_execution_result.md` for the execution result.**

Date: 08-08-2026

This document is the design/preparation record. It proposed the exact one-line fix (§3, §5) that Gate I33 later applied via `CREATE OR REPLACE FUNCTION` and verified live. Nothing in this document itself was executed — see Gate I33 for the live execution and verification results.

## Baseline

- Branch: master
- Working tree: clean at time of writing
- Latest pushed commit: `5b1f438` Record Gate I31: City Council test write attempted, RPC bug found, no write occurred

## 1–2. Root cause: every ambiguous reference

The deployed function (`Reference Files/civicmarket_schema_addendum_city_council_district_rpc.sql`, live since Gate I30C) declares:

```sql
RETURNS TABLE (district_id uuid)
```

In PL/pgSQL, a `RETURNS TABLE` clause implicitly creates a variable for each output column, scoped to the entire function body — here, a variable named `district_id`. Every unqualified SQL identifier `district_id` inside the function body is then ambiguous between that variable and any table column of the same name.

Line-by-line audit of the deployed body for every occurrence of `district_id`:

| Line (deployed file) | Reference | Ambiguous? |
|---|---|---|
| `RETURNS TABLE (district_id uuid)` | declares the variable | n/a (the cause) |
| `p_district_id` (parameter, used throughout) | distinct name, not `district_id` | No |
| `IF p_district_id NOT IN (...)` | uses `p_district_id` | No |
| `SELECT 1 FROM districts WHERE id = p_district_id AND id IN (...)` | uses `id`, not `district_id` | No |
| `DELETE FROM user_districts WHERE user_id = v_user_id AND district_id IN (...)` | unqualified `district_id` in a `WHERE` expression | **Yes — this is the exact statement that failed with 42702 in Gate I31** |
| `INSERT INTO user_districts (user_id, district_id, scope) VALUES (...)` | `district_id` appears only in the INSERT target-column list | No — target-column lists are resolved against the destination table's columns, not PL/pgSQL variables; this is not an expression context, so no ambiguity exists here regardless of the output variable |
| `RETURN QUERY SELECT p_district_id;` | uses `p_district_id`, implicitly bound to the sole output column | No |

**Conclusion: there is exactly one ambiguous reference in the whole function** — the unqualified `district_id` inside the `DELETE ... WHERE` clause. This matches Gate I31's captured Postgres error (`42702`, "column reference district_id is ambiguous") pointing at the `DELETE` statement, which is why the delete never planned and no row was ever touched.

## 3. Fix options compared

**Option A — qualify the table-column reference.**
Change the one ambiguous line to `AND user_districts.district_id IN (...)`. One-line diff. Does not touch the function signature, return type, or output column name. Does not touch grants (see §8). Removes all doubt about `CREATE OR REPLACE FUNCTION` semantics around renaming `RETURNS TABLE` output columns (see §7), because nothing about the return clause changes at all.

**Option B — rename the RETURNS TABLE output column** (e.g. `out_district_id`). Also a small diff (one line in the `RETURNS TABLE` clause), and would also fix the bug, since the colliding variable name would no longer exist. Not chosen because it changes the function's return-type column name — part of the already-approved contract — for no added safety benefit over Option A, and introduces a (resolvable but unnecessary) question about whether `CREATE OR REPLACE FUNCTION` permits renaming a `RETURNS TABLE` output column without a `DROP`.

**Option C — any simpler safe alternative?** None found. The function is otherwise minimal and correct; no other structural change is needed. `RAISE EXCEPTION` control flow, `SECURITY INVOKER`, `auth.uid()` sourcing, and the closed-set validation are all unaffected by this bug and require no change.

### Recommendation

**Option A.** Qualify `user_districts.district_id` in the `DELETE` statement's `WHERE` clause. This is the smallest possible change, touches nothing about the approved signature, return type, security model, or grants, and directly matches the task's stated preference to make the smallest change that preserves the already-approved function contract.

## 4. Confirmation — all existing security/behavior properties preserved by Option A

Every property below is **unchanged** by the one-line fix, verified by inspection of the corrected function body in §5:

- `SECURITY INVOKER` — unchanged (clause untouched).
- `auth.uid()` supplies caller identity — unchanged (`v_user_id uuid := auth.uid();` untouched).
- No arbitrary user ID parameter — unchanged; the function still takes only `p_district_id`.
- Accepts only `11111111-0000-0000-0000-000000000001` and `11111111-0000-0000-0000-000000000007` — unchanged; both the parameter validation `IF` and the redundant `districts` existence check are untouched.
- Atomically replaces only City Council District 1/3 — unchanged; the fix only *qualifies* the existing `DELETE ... district_id IN (...)` scope, it does not widen or narrow it. The `DELETE` and `INSERT` remain inside the same single implicit function-body transaction (unchanged).
- Mayor (`...000006`) remains outside mutation scope — unchanged; still never referenced anywhere in the function.
- School Board remains outside mutation scope — unchanged; never referenced.
- County Commission At-Large remains outside mutation scope — unchanged; never referenced.
- FL House remains outside mutation scope — unchanged; never referenced.
- FL Senate remains outside mutation scope — unchanged; never referenced.
- `anon` cannot execute — unchanged; grants are untouched by this fix (see §8).
- `authenticated` can execute — unchanged; grants are untouched by this fix (see §8).
- `search_path` remains `public, pg_temp` — unchanged (`SET search_path = public, pg_temp` clause untouched).

## 5. Complete proposed `CREATE OR REPLACE FUNCTION` statement (NOT EXECUTED)

```sql
-- ============================================================
-- GATE I32 — FIX: qualify the ambiguous `district_id` reference inside the
-- DELETE statement, which collided with the RETURNS TABLE output column of
-- the same name (Postgres error 42702, discovered live in Gate I31).
--
-- This is a CREATE OR REPLACE (not a fresh CREATE) because the function
-- already exists live, exactly as approved in Gate I30C. The signature
-- (argument list and RETURNS TABLE column name/type) is UNCHANGED, so this
-- replace is safe: ownership, OID, and existing grants are preserved by
-- Postgres semantics for CREATE OR REPLACE FUNCTION when the signature does
-- not change (see Gate I32 doc, section 8, for the explicit verification
-- step to confirm this live rather than assume it).
--
-- NOT executed automatically by any Claude Code session. Requires manual
-- execution in the Supabase SQL Editor by the project owner.
-- ============================================================

CREATE OR REPLACE FUNCTION public.set_psl_city_council_district(p_district_id uuid)
RETURNS TABLE (district_id uuid)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id uuid := auth.uid();
BEGIN
  -- 1. Validate caller. auth.uid() is NULL for an unauthenticated/anon call.
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized' USING ERRCODE = '28000';
  END IF;

  -- 2. Validate the selected district id against the closed, hardcoded set of
  --    the two approved City Council district ids. Nothing else is accepted.
  IF p_district_id NOT IN (
    '11111111-0000-0000-0000-000000000001', -- City Council District 1
    '11111111-0000-0000-0000-000000000007'  -- City Council District 3
  ) THEN
    RAISE EXCEPTION 'Invalid City Council district id' USING ERRCODE = '22023';
  END IF;

  -- 3. Defense in depth: re-verify the target row actually exists live and is
  --    one of the two approved ids (redundant with step 2, catches any future
  --    drift between this hardcoded list and the districts table).
  IF NOT EXISTS (
    SELECT 1 FROM districts
    WHERE id = p_district_id
      AND id IN (
        '11111111-0000-0000-0000-000000000001',
        '11111111-0000-0000-0000-000000000007'
      )
  ) THEN
    RAISE EXCEPTION 'District not found' USING ERRCODE = '22023';
  END IF;

  -- 4. Delete only this caller's existing City Council District 1/3 rows.
  --    Scoped to exactly these two ids — never Mayor, School Board, County
  --    Commission, FL House/Senate, or any other assignment.
  --
  --    GATE I32 FIX: `district_id` qualified as `user_districts.district_id`.
  --    The prior unqualified reference collided with the RETURNS TABLE output
  --    column of the same name, causing Postgres error 42702 (Gate I31) and
  --    preventing this statement from ever planning or executing.
  DELETE FROM user_districts
  WHERE user_id = v_user_id
    AND user_districts.district_id IN (
      '11111111-0000-0000-0000-000000000001',
      '11111111-0000-0000-0000-000000000007'
    );

  -- 5. Insert exactly one row for the selected district. (INSERT target-column
  --    lists are resolved against the destination table, not PL/pgSQL
  --    variables, so this line was never ambiguous and needs no change.)
  INSERT INTO user_districts (user_id, district_id, scope)
  VALUES (v_user_id, p_district_id, 'city');

  -- 6. Return a minimal safe result. The whole function body above executes
  --    as one implicit transaction — any RAISE EXCEPTION aborts every effect,
  --    so the delete-then-insert pair is atomic by Postgres function semantics.
  RETURN QUERY SELECT p_district_id;
END;
$$;

-- ============================================================
-- Optional, idempotent defense-in-depth (safe to run; no-op if grants are
-- already exactly as expected — see section 8 for why this should not be
-- strictly necessary, and the verification queries below to confirm either
-- way before relying on it).
-- ============================================================
-- REVOKE ALL ON FUNCTION public.set_psl_city_council_district(uuid) FROM PUBLIC;
-- REVOKE ALL ON FUNCTION public.set_psl_city_council_district(uuid) FROM anon;
-- GRANT EXECUTE ON FUNCTION public.set_psl_city_council_district(uuid) TO authenticated;
```

## 6. Read-only post-change verification SQL (for manual execution AFTER the fix is applied)

```sql
-- 1. Function identity, security mode, and search_path, plus the full definition
--    for a visual diff against the SQL above.
SELECT
  p.proname,
  pg_get_function_identity_arguments(p.oid) AS arg_signature,
  pg_get_function_result(p.oid)             AS return_type,
  p.prosecdef                                AS is_security_definer, -- expect false (SECURITY INVOKER)
  p.proconfig                                AS config_settings,      -- expect {search_path=public,pg_temp}
  pg_get_functiondef(p.oid)                  AS full_definition
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname = 'set_psl_city_council_district';

-- 2. Grants via information_schema (should show exactly one row: authenticated / EXECUTE).
SELECT grantee, privilege_type
FROM information_schema.routine_privileges
WHERE routine_name = 'set_psl_city_council_district';

-- 3. Direct privilege probes — belt-and-suspenders, independent of
--    information_schema visibility/role-membership quirks.
SELECT
  has_function_privilege('anon',          'public.set_psl_city_council_district(uuid)', 'EXECUTE') AS anon_can_execute,          -- expect false
  has_function_privilege('authenticated', 'public.set_psl_city_council_district(uuid)', 'EXECUTE') AS authenticated_can_execute; -- expect true
```

Expected results after the fix: `is_security_definer = false`; `config_settings` contains `search_path=public,pg_temp`; `arg_signature = p_district_id uuid`; `return_type` unchanged (`TABLE(district_id uuid)`); exactly one grant row (`authenticated`, `EXECUTE`); `anon_can_execute = false`; `authenticated_can_execute = true`.

## 7. `CREATE OR REPLACE FUNCTION` vs. `DROP FUNCTION` — determination

**`CREATE OR REPLACE FUNCTION` is sufficient. `DROP FUNCTION` is not required and should be avoided.**

Reasoning: PostgreSQL allows `CREATE OR REPLACE FUNCTION` to replace an existing function's body in place, preserving the function's OID, ownership, and ACL (grants), **provided the argument list and return type are unchanged**. Option A changes only the function body (one qualified identifier inside a `DELETE` statement) — the argument list (`p_district_id uuid`), the `RETURNS TABLE (district_id uuid)` clause, and every other declared property are byte-for-byte identical to what is already live. This is exactly the case `CREATE OR REPLACE FUNCTION` is designed for. `DROP FUNCTION` followed by `CREATE FUNCTION` would be unnecessary risk (it would require re-granting privileges from scratch and briefly leaves the function entirely absent) for no benefit here, since nothing about the signature is changing.

This determination is also why Option A was preferred over Option B in §3: Option B (renaming the output column) sits closer to a genuine edge case in Postgres's replace-function rules for `RETURNS TABLE` functions, and while it is very likely still safe, there is no reason to go near that edge case when Option A avoids the question entirely.

## 8. Do grants survive the replace?

**Expected: yes, automatically.** PostgreSQL's documented behavior for `CREATE OR REPLACE FUNCTION` is that the function's ownership and permissions (ACL/grants) are *not* altered by a replace — only the properties explicitly specified in the new `CREATE OR REPLACE` command are updated, and grants are not one of the properties a `CREATE OR REPLACE FUNCTION` statement can express. Since Option A does not change the signature, this is the straightforward, well-documented case, not an edge case.

**Not treated as fully certain without live confirmation**, per the task's instruction. Two safeguards are provided:

1. The verification SQL in §6, query 2 and query 3, run immediately after the fix — confirms live whether `authenticated` retained `EXECUTE` and `anon`/`PUBLIC` did not gain it.
2. An optional, fully idempotent re-run of the original `REVOKE ALL ... / GRANT EXECUTE ... TO authenticated` block (commented out at the bottom of §5) — safe to run either way, a no-op if grants are already correct, and a correcting action if they are not.

Recommended execution order: run the `CREATE OR REPLACE FUNCTION` statement, then immediately run the §6 verification queries. Only run the optional `REVOKE`/`GRANT` block if query 2 or 3 shows anything other than the expected single `authenticated`/`EXECUTE` grant.

## 9. Regression test plan (after the function is manually corrected)

To be executed only after the SQL in §5 has been manually run in Supabase and §6's verification has passed, and only under the same kind of explicit, scoped test-account approval used in Gate I31 (test account `civicmarket.test.01@example.com`, guard temporarily `true`, immediate restoration to `false` after):

1. **Unauthenticated rejection** — call the route (or RPC directly) with no `Authorization` header. Expect `401`.
2. **Invalid token rejection** — call with a malformed/garbage Bearer token. Expect `401`.
3. **Invalid district rejection** — call with a `districtLabel` outside the closed set (route-level `400`) and, if testing the RPC directly, a `p_district_id` outside the two approved UUIDs (expect `RAISE EXCEPTION 'Invalid City Council district id'`, ERRCODE `22023`).
4. **False/missing attestation rejection** — call the route with `attestedOfficialLookup: false` or omitted. Expect `400`.
5. **Authenticated District 1 → District 3 live test** — temporarily set `ENABLE_CITY_COUNCIL_DISTRICT_WRITE = true`, submit District 3 for the approved test account. Expect `200`, `dryRun: false`, a real `rpcResult` row.
6. **Verify Anthony Bonna** — reload `/profile` for the test account; My Current Officials should now show Anthony Bonna, Sr. (City Council District 3) in place of Stephanie Morgan.
7. **Verify only City Council assignment changed** — School Board District 1, County Commission At-Large, FL House District 85, FL Senate District 27 must all remain exactly as before (unchanged) on the same profile reload.
8. **Immediate District 3 → District 1 rollback** — submit District 1 for the same account through the same route/RPC.
9. **Verify Stephanie Morgan** — reload `/profile`; Stephanie Morgan (City Council District 1) must reappear, Anthony Bonna must no longer appear.
10. **Verify unrelated assignments unchanged** — re-confirm School Board, County Commission At-Large, FL House, FL Senate are still exactly as before, after the rollback too.
11. **Restore write guard false** — set `ENABLE_CITY_COUNCIL_DISTRICT_WRITE` back to `false` in `route.ts`, confirm via `git diff`/`git status` that the working tree is clean (mirroring Gate I31's cleanup discipline exactly).
12. **Build** — `npm run build` passes, same route count as baseline, no errors.
13. **Lint baseline comparison** — `npm run lint` shows only the same 5 known pre-existing `scripts/*.cjs` errors, nothing new.

## Risks (as assessed at design time)

- **Low risk overall.** The fix is a single qualified identifier inside an already-reviewed, already-approved function; it does not change validation logic, security mode, scope, or grants.
- **Grant-preservation assumption was documented, not yet live-verified** at the time this section was written — mitigated by the mandatory §6 verification step and the optional idempotent re-grant in §5. **Resolved in Gate I33**: live verification confirmed grants were preserved exactly as expected (`anon_can_execute = false`, `authenticated_can_execute = true`).
- **`CREATE OR REPLACE` requires the signature to match exactly** — this was the risk to watch for during execution. **Resolved in Gate I33**: live `pg_get_function_identity_arguments`/`pg_get_function_result` output confirmed the signature and return type were unchanged.
- **This is still an authenticated-write-path change** — regardless of how small, it must go through the same explicit, scoped test-account approval discipline as every other write in this project (Gate I31's pattern) before any live test-account write is attempted. **This remains true and unresolved** — the §9 regression test plan, including the live District 1 → District 3 assignment test, has not been executed and remains blocked pending separate explicit approval.

## No-change confirmation — Gate I32 (this design document)

At the time this document was authored, no Supabase SQL had been executed and the live function had not been modified — this section describes that original design-only state. **The fix proposed here was subsequently executed and verified live under Gate I33; see that document for the execution record.** This document itself was not committed to git in its original design-only form; it was updated and committed together with the Gate I33 result as part of that gate's documentation commit.

## Next step

Gate I33 (execution) is complete — see `docs/internal_beta_gate_i33_city_council_rpc_fix_execution_result.md`. The next step is a future, separately approved gate to execute the §9 regression test plan (the live District 1 → District 3 → District 1 test), under the same disciplined, scoped test-account approval pattern established in Gate I31. That test has not yet been approved or performed.
