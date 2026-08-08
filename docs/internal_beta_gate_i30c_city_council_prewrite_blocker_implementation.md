# Internal Beta — Gate I30C: City Council Pre-Write Blocker Implementation

## 1. Date and timestamp

Date: 08-08-2026
Timestamp: 08:02 am EST

## 2. Explicit user approval received

The user explicitly approved, in full detail, both Gate I30B blocker resolutions: (A) the exact `current_officials` row for Anthony Bonna, Sr., including both named judgment calls (name suffix, office phrasing); and (B) the atomic City Council district replacement RPC design (SECURITY INVOKER, `auth.uid()`-derived, closed district set, no service-role requirement in the client, atomic). This approval authorizes schema/RPC creation and this specific data row only — it does **not** authorize enabling live City Council writes or a District 1↔3 test-account assignment (Gate I31).

## 3. Important capability finding — read this before the rest of this document

**Neither of the two approved writes could be executed by this session, and this is not a defect — it is the same structural limitation already documented and worked around throughout every prior write-gate in this project (Gate I26's Mayor/District 3 rows most directly).**

- **The `current_officials` INSERT** requires `EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)` per its RLS policy (confirmed by direct inspection of `Reference Files/civicmarket_schema_addendum_officials_reviews.sql`, line 37-41). This session only has the public anon key (no `auth.uid()` context at all), so this INSERT is structurally impossible here, independent of any approval — and would remain impossible for any authenticated non-admin session too.
- **The RPC's `CREATE FUNCTION`** is schema-level DDL. PostgREST (what the anon key talks to) has no DDL capability under any circumstance. DDL requires the Supabase SQL Editor or a privileged direct connection — neither available to this session, and the service-role key (which could reach the SQL Editor's equivalent via other tooling) was correctly never sought or inspected, per the standing prohibition on reading `.env.local`.

**What this gate actually did, fully and completely:** prepared exact, ready-to-run SQL for both approved writes; made the one part of this work that *is* a plain source-code change (the API route refactor); ran all read-only pre-write verification; and ran the full available build/lint/negative-path/live-dry-run-regression verification. **What remains: you must run the two SQL blocks below yourself in the Supabase SQL Editor.** Once you confirm they've run successfully, tell me and I will immediately re-verify everything live, exactly as happened for the Mayor/District 3 rows in Gate I26.

---

## PART A — District 3 Current Official

### Authoritative source (reconfirmed, unchanged from Gate I30B)

**Anthony Bonna, Sr., District 3 Councilman**, verified via two independent official City of Port St. Lucie pages, most specifically his dedicated bio page: `https://www.cityofpsl.com/Government/Your-City-Government/Mayor-City-Council/District-3-Anthony-Bonna`.

### Fresh pre-write verification (read-only, this gate)

- District 3 (`11111111-0000-0000-0000-000000000007`) confirmed live: `City Council District 3`, `city_council`, `Port St. Lucie`, `FL`.
- Zero existing `current_officials` rows for `district_id = ...000007`.
- Zero existing `current_officials` rows matching `name ILIKE '%Bonna%'`.
- Stephanie Morgan's row confirmed unchanged, byte-for-byte identical to Gate I30B's captured snapshot.
- `current_officials` total count confirmed at 8 (unchanged baseline).

No conflict found. Nothing stopped this gate at this checkpoint.

### Exact approved SQL — NOT EXECUTED by this session

```sql
-- APPROVED per user message, 08-08-2026. NOT EXECUTED BY THIS SESSION.
-- Run manually in the Supabase SQL Editor.
INSERT INTO current_officials
  (name, office, district_id, jurisdiction_level, photo_url, website, bio,
   term_start, term_end, next_election_date, source_url, source_label,
   candidate_id, is_on_next_ballot)
VALUES
  ('Anthony Bonna, Sr.', 'City Council Member, District 3',
   '11111111-0000-0000-0000-000000000007', 'city', NULL, NULL, NULL,
   NULL, NULL, NULL,
   'https://www.cityofpsl.com/Government/Your-City-Government/Mayor-City-Council/District-3-Anthony-Bonna',
   'City of Port St. Lucie District 3 Council profile',
   NULL, false);
```

### Post-write verification (run after you execute the SQL above)

- Exactly one new row, matching the values above field-for-field.
- Stephanie Morgan's row unchanged.
- `current_officials` total count = 9.
- No other row touched.

### Rollback (only if verification fails)

```sql
DELETE FROM current_officials WHERE id = '<the exact id returned by the insert above>';
```

**No `current_officials` write occurred in this gate.** Stephanie Morgan and every other existing row are untouched.

---

## PART B — Atomic City Council Replacement RPC

### File created (checked into the repository, following the established `Reference Files/civicmarket_schema_addendum_*.sql` convention)

`Reference Files/civicmarket_schema_addendum_city_council_district_rpc.sql`

### RPC name and signature

`public.set_psl_city_council_district(p_district_id uuid) RETURNS TABLE (district_id uuid)`

### Security model (exactly as approved)

- **`SECURITY INVOKER`** (explicit, not the default-unspecified behavior) — confirmed as achievable and used; the approved `SECURITY INVOKER` design was not abandoned for `SECURITY DEFINER` at any point, so this STOP condition was never triggered.
- **Caller derived from `auth.uid()`** inside the function body — no user-ID parameter accepted anywhere in the signature.
- If `auth.uid()` is `NULL` (unauthenticated), the function `RAISE EXCEPTION`s immediately with SQLSTATE `28000` before touching any table.
- **Closed district validation:** `p_district_id` must be exactly `...000001` or `...000007`, checked via a hardcoded `NOT IN (...)` guard, then re-verified against the live `districts` table as defense in depth. Any other value raises SQLSTATE `22023` before any mutation.
- **Atomic by Postgres function semantics:** the delete and insert both execute inside the function's own implicit transaction — any `RAISE EXCEPTION` anywhere in the body rolls back every effect. No explicit `BEGIN`/`COMMIT` needed or used.
- **`SET search_path = public, pg_temp`** — explicit, prevents search-path-hijacking.
- **Grants:** `REVOKE ALL ... FROM PUBLIC`, `REVOKE ALL ... FROM anon`, then `GRANT EXECUTE ... TO authenticated` only. No anonymous execution is possible.
- **Deliberately `CREATE FUNCTION`, not `CREATE OR REPLACE FUNCTION`** — if a function of this exact name/signature already exists for any unrelated reason, the Supabase SQL Editor will show an explicit "already exists" error instead of silently overwriting an unknown function. (This session has no read-only way to check `pg_proc`/`information_schema.routines` in advance — the OpenAPI introspection endpoint that would reveal this requires the secret/service-role key, which was correctly not sought. This is disclosed honestly, not silently assumed safe.)
- **RLS interaction:** confirmed to require no RLS changes at all. The existing `user_districts` policies ("Users can insert own districts" `WITH CHECK (auth.uid() = user_id)`, "Users can delete own districts" `USING (auth.uid() = user_id)`) already permit exactly the delete/insert the function performs, since the function always operates with `user_id = v_user_id = auth.uid()`. Under `SECURITY INVOKER`, these policies are the actual enforcement boundary.
- **No service-role requirement in the client**, confirmed and implemented — see Part C.

### Exact approved SQL — NOT EXECUTED by this session

The full function definition, `REVOKE`/`GRANT` statements, and two commented-out post-creation verification queries are in `Reference Files/civicmarket_schema_addendum_city_council_district_rpc.sql` (created this gate, not executed).

---

## PART C — API route migrated to call the RPC

**File modified:** `src/app/api/set-city-council-district/route.ts`

- `ENABLE_CITY_COUNCIL_DISTRICT_WRITE = false` **unchanged, still present, still the guard for the entire mutation path.**
- All existing validation preserved exactly: Bearer auth (401 on missing/malformed/invalid), `attestedOfficialLookup === true` required (400 otherwise), closed label set (400 otherwise), live district-name resolution (422 on zero/ambiguous match), and the redundant `APPROVED_DISTRICT_IDS` check (422 on mismatch) — none of this logic was touched.
- **The old non-atomic delete-then-insert implementation was fully removed**, not merely made unreachable — there is no dead code path a future guard-flip could accidentally exercise. The now-unnecessary live "resolve both City Council district ids for the delete scope" query was also removed, since that scoping now lives inside the RPC itself, hardcoded to the same two approved ids.
- **New mutation path** (still entirely below the `if (!ENABLE_CITY_COUNCIL_DISTRICT_WRITE)` early return, still unreachable while the guard is `false`): calls `set_psl_city_council_district` via `userScopedSupabase.rpc(...)`.
- **Important, deliberate architectural detail:** the RPC call uses a **newly created, request-scoped client authenticated as the calling user** — `createClient(NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, { global: { headers: { Authorization: `Bearer ${token}` } } })` — **not** the existing `createServiceClient()` (service-role) instance used for the earlier auth/validation steps. This is required: if the RPC were called through the service-role client, `auth.uid()` inside the `SECURITY INVOKER` function would not resolve to the actual end user (the service-role connection carries no end-user JWT context), which would break the function's core security property. Both the anon key and the Supabase URL are read from the same `process.env.NEXT_PUBLIC_*` variables already used throughout the app (`src/lib/supabase.ts`) — no new secret, no hardcoded key literal.
- Route diff limited to exactly this scope — no unrelated line changed.

---

## PART D — Verification performed this gate

### Build and lint

- `npm run build`: **passed** — 27 routes, unchanged route count (no new page/route was added, only an existing route's implementation changed), no errors.
- `npm run lint`: **5 pre-existing errors only** (`scripts/import-real-psl-data.cjs`, `scripts/validate-real-psl-csvs.cjs`). No new errors — confirms no unused-variable issue was introduced by removing the old delete-scope block.

### Negative-path regression (live, safe, guard still false)

| Test | Result |
|---|---|
| Unauthenticated POST | `401 {"error":"Unauthorized"}` — unchanged from Gate I29/I30 |
| Invalid Bearer token | `401 {"error":"Unauthorized"}` — unchanged |
| Valid District 1 + attestation, via the already-authenticated live UI | `200`, exact dry-run message "Write path disabled pending explicit approval. No user_districts row was created or modified." — confirmed via both rendered page text and a direct network-request status check |

The full authenticated dry-run round-trip (UI → route → district resolution → dry-run response) was re-exercised live after the route refactor specifically to catch any regression from removing the old delete-scope code — none was found.

### Scope verification (code-trace against the RPC's hardcoded values)

- The RPC's `NOT IN` check and the route's `APPROVED_DISTRICT_IDS` constant both permit only `...000001` and `...000007` — nothing else.
- Mayor (`...000006`), School Board District 1 (`...000002`), County Commission At-Large (`...000003`), FL House 85 (`...000004`), FL Senate 27 (`...000005`), and every County Commission District 1-5 id (`...000031`-`...000035`) do not appear anywhere in either the RPC or the route — structurally excluded, not just validated at runtime.
- Because the RPC does not exist live in Supabase yet (Part B, not executed), a full live negative-path test of the RPC itself (anonymous-execution rejection, invalid-district rejection at the database level, Mayor/County-Commission-id rejection at the database level) is **not possible in this gate** and is correctly deferred to after you run Part B's SQL — see Section 6 below.

### Current Officials generic-query confirmation (unchanged, re-traced)

`getOfficialsForUser` (`src/lib/officials.ts`) reads the `officials_for_user` view generically by `user_id`/`district_id` join, with no District-1-or-3-specific code. Once (a) the Anthony Bonna row exists and (b) a user's `user_districts` actually includes District 3, that user would see him with **zero source-code change required** — the same conclusion already reached in Gate I28/I30, re-confirmed by inspection, not re-tested live (no `user_districts` mutation occurred, and none should for this verification).

---

## PART E — What is NOT done, stated plainly

1. **The Anthony Bonna `current_officials` row does not yet exist live.** Part A's SQL must be run manually.
2. **The `set_psl_city_council_district` RPC does not yet exist live.** Part B's SQL must be run manually.
3. Until both of the above are run, the route's guarded RPC-calling code path, while now correctly written, **would fail** if the guard were ever flipped true today (the RPC doesn't exist) — this is a safe failure mode (a `500` error, no mutation), not a silent incorrect behavior, but it means "implementation complete" is not the same as "blockers resolved live."

## Manual Supabase execution completed

Date: 08-08-2026
Timestamp: 08:32 am EST

The user manually executed both approved SQL blocks in the correct Supabase project (`kkxwlmvhjvtvnzpzmpka`). **An earlier attempt at this (checked immediately after being reported) showed neither change had actually persisted** — a full unfiltered `current_officials` read still showed 8 rows with no Bonna row, and a safe anonymous RPC call returned `404 PGRST202 "Could not find the function... in the schema cache"`. This was reported and the run was repeated. The second execution was independently re-verified live and both changes are now confirmed present.

### Anthony Bonna row — verified live

```json
{"id":"fed1801c-0b6a-4743-8de2-4f69b91920ec","name":"Anthony Bonna, Sr.","office":"City Council Member, District 3","district_id":"11111111-0000-0000-0000-000000000007","jurisdiction_level":"city","photo_url":null,"website":null,"bio":null,"term_start":null,"term_end":null,"next_election_date":null,"source_url":"https://www.cityofpsl.com/Government/Your-City-Government/Mayor-City-Council/District-3-Anthony-Bonna","source_label":"City of Port St. Lucie District 3 Council profile","candidate_id":null,"is_on_next_ballot":false}
```

Matches the approved draft field-for-field, exactly. Exactly one row targets `district_id = ...000007`. `current_officials` total count confirmed **9** (was 8, +1 exactly). Stephanie Morgan's row confirmed unchanged, byte-for-byte identical to every prior snapshot.

### RPC — verified live

A direct, safe (non-mutating) anonymous call to `set_psl_city_council_district` now returns:
```
401 {"code":"42501","message":"permission denied for function set_psl_city_council_district"}
```
for every tested `p_district_id` value (a valid District 1 id, the Mayor id, the County Commission At-Large id, and an arbitrary garbage UUID) — confirming the function now exists live, and that PostgreSQL's own grant system (not just the function's internal logic) rejects `anon`/`PUBLIC` execution before the function body ever runs. This is stronger evidence than a code-trace of the internal `auth.uid() IS NULL` check, since it confirms the `REVOKE ALL ... FROM PUBLIC` / `REVOKE ALL ... FROM anon` statements are correctly in effect at the database level.

`SECURITY INVOKER`, the `auth.uid()`-derived caller model, and the `search_path = public, pg_temp` setting were not independently re-queried against `pg_proc` in this verification pass (that catalog is not reachable via the public anon key — introspection requires the secret/service-role key, correctly not sought). These are confirmed by: (1) the deployed SQL being the exact, unmodified content of `Reference Files/civicmarket_schema_addendum_city_council_district_rpc.sql`, already committed and reviewable in this repository, and (2) the user's own direct manual check in the Supabase SQL Editor, reported as `SECURITY INVOKER` / `search_path = public, pg_temp` / `anon_can_execute = false` / `authenticated_can_execute = true`. The `anon_can_execute = false` portion of that report was independently re-confirmed live in this pass (the `42501` result above); the `authenticated_can_execute = true` portion was not independently re-tested with a real authenticated call in this pass (would require a valid user session token, which was not created).

### Current Officials blocker — RESOLVED

`getOfficialsForUser` (`src/lib/officials.ts`) reads `officials_for_user` generically by `user_id`/`district_id` join with no District-specific code. With Anthony Bonna's row now live at `district_id = ...000007`, any future user whose `user_districts` includes that id will now correctly resolve him — no source-code change required, confirmed by the same unchanged, already-verified generic query path. A District 1 user continues to correctly resolve Stephanie Morgan, confirmed unchanged. **This blocker is resolved.**

### Atomicity blocker — RESOLVED

The prior route-level two-call (`.delete()` then `.insert()`) implementation was fully removed in this gate's earlier commit (`8927098`) and confirmed still absent in this verification pass. Future City Council replacement is delegated entirely to one Postgres function call (`set_psl_city_council_district`), whose body executes as a single implicit transaction — a `RAISE EXCEPTION` anywhere inside it (invalid caller, invalid district, district-existence check failure) rolls back every effect, so a partial delete-only state cannot commit. **This blocker is resolved**, pending the same caveat already noted above: the RPC's internal delete/insert behavior for a *valid, authenticated* call has not yet been exercised live (correctly deferred to Gate I31, which is the first point at which a real authenticated mutation is authorized).

## Gate I30C outcome

**Gate I30C PASS — District 3 Current Officials row and atomic City Council replacement RPC are live and verified; production City Council assignment writes remain disabled.**

- Anthony Bonna, Sr.'s `current_officials` row is live, verified field-for-field, count 9, Stephanie Morgan unchanged.
- The `set_psl_city_council_district` RPC is live, verified to exist, and its anonymous-rejection behavior is independently confirmed live at the database permission level.
- `ENABLE_CITY_COUNCIL_DISTRICT_WRITE` remains `false`. `ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE` remains `false` — neither was touched or enabled at any point.
- No production `user_districts` mutation occurred — the only calls made against the RPC in this entire gate sequence were anonymous calls that were rejected by PostgreSQL's own grant system before the function body could execute, and the API route's guard was never enabled, so no application code path ever reached the RPC either.

**Gate I31 remains blocked only on:**
1. Exact test-account identity.
2. Verified target district for that account.
3. Captured pre-test `user_districts` state.
4. Explicit approval to temporarily enable the City Council write guard.
5. Explicit approval to execute one scoped, test-account live assignment.
6. A rollback plan.
7. Immediate restoration of the write guard to `false` after the test.
8. An explicit no-deploy boundary for the test.

**Kept separate and still unresolved, unchanged by this gate:**
- The District 1 onboarding-default accuracy risk — acceptable only for the current Internal Beta boundary; must be corrected before Controlled PSL Beta with a real, diverse population.
- The District 1 election-date discrepancy (live `2026-11-03` vs. Gate I18's documented `August 18, 2026`).

## No-change confirmation

Beyond the one route file and one new reference SQL file (both committed in `8927098`, unchanged in this verification pass) and the explicitly-approved Supabase-side data/schema changes recorded above, Gate I30C made no changes to: `candidates`, `elections`, `districts`, `voting_records`, `candidate_positions`, `match_scores`, `civic_dna`, `civic_dna_answers`, `officials_for_user`, `src/lib/officials.ts`, `CurrentOfficialsSection`, `src/app/onboarding/zip/page.tsx`, `src/app/profile/city-council-district/page.tsx`, `src/app/profile/county-commission/page.tsx`, `src/app/api/set-county-commission-district/route.ts`, `src/lib/supabase-server.ts`, RLS, grants beyond the exact approved RPC grants, seeds, migrations, CSV files, PowerShell scripts, environment files, the At-Large row, or deployment state. **No `user_districts` row was created, modified, or deleted.**

No secret, API key, token, password, connection string, or environment value was inspected or exposed. `ENABLE_CITY_COUNCIL_DISTRICT_WRITE` remains `false`. `ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE` remains `false`. The District 1 election-date discrepancy remains unresolved. No deployment occurred.
