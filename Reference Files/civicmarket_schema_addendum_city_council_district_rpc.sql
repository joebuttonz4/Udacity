-- ============================================================
-- CIVICMARKET SCHEMA ADDENDUM — ATOMIC CITY COUNCIL DISTRICT REPLACEMENT RPC
-- Run in Supabase SQL Editor. Adds exactly one function and its grants.
-- Approved: Gate I30B (design) / Gate I30C (implementation), see
-- docs/internal_beta_gate_i30b_city_council_prewrite_blocker_resolution.md and
-- docs/internal_beta_gate_i30c_city_council_prewrite_blocker_implementation.md.
--
-- Scope: this function may only ever affect a caller's own user_districts rows
-- where district_id is one of the two approved fixed City Council district ids.
-- It never touches Mayor, School Board, County Commission, FL House/Senate, or
-- any other user's rows.
--
-- NOT executed automatically by any Claude Code session. Requires manual
-- execution in the Supabase SQL Editor by the project owner.
-- ============================================================

-- Deliberately NOT "CREATE OR REPLACE": if a function with this exact name and
-- signature already exists for any unrelated reason, this statement will fail
-- with an explicit "already exists" error instead of silently overwriting it.
CREATE FUNCTION public.set_psl_city_council_district(p_district_id uuid)
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
  DELETE FROM user_districts
  WHERE user_id = v_user_id
    AND district_id IN (
      '11111111-0000-0000-0000-000000000001',
      '11111111-0000-0000-0000-000000000007'
    );

  -- 5. Insert exactly one row for the selected district.
  INSERT INTO user_districts (user_id, district_id, scope)
  VALUES (v_user_id, p_district_id, 'city');

  -- 6. Return a minimal safe result. The whole function body above executes
  --    as one implicit transaction — any RAISE EXCEPTION aborts every effect,
  --    so the delete-then-insert pair is atomic by Postgres function semantics.
  RETURN QUERY SELECT p_district_id;
END;
$$;

-- Explicitly close off execution before granting only what is needed.
REVOKE ALL ON FUNCTION public.set_psl_city_council_district(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.set_psl_city_council_district(uuid) FROM anon;

-- Only logged-in users may call this function. No anonymous execution.
GRANT EXECUTE ON FUNCTION public.set_psl_city_council_district(uuid) TO authenticated;

-- ============================================================
-- Verification queries to run after the above (read-only, safe)
-- ============================================================

-- Confirm the function exists with the expected security/search_path settings:
-- SELECT proname, prosecdef, proconfig
-- FROM pg_proc
-- WHERE proname = 'set_psl_city_council_district';
-- Expect: prosecdef = false (SECURITY INVOKER, not DEFINER),
--         proconfig contains 'search_path=public,pg_temp'.

-- Confirm grants:
-- SELECT grantee, privilege_type
-- FROM information_schema.routine_privileges
-- WHERE routine_name = 'set_psl_city_council_district';
-- Expect: exactly one row, grantee = authenticated, privilege_type = EXECUTE.
-- Expect: no row for anon or PUBLIC.
