# City Council District Write Enablement Readiness Review

Date: 08-21-2026
Timestamp: 03:48 pm EST

Status: **Read-only inspection + documentation only. `ENABLE_CITY_COUNCIL_DISTRICT_WRITE` was NOT changed. No Supabase write. No deployment. No schema/RLS/function change.**

## Phase 1 — Write path location

- **Endpoint:** `POST /api/set-city-council-district` — `src/app/api/set-city-council-district/route.ts` (167 lines, unchanged since commit `8927098`, confirmed via `git log`).
- **Flag location:** line 10 of the same file — `const ENABLE_CITY_COUNCIL_DISTRICT_WRITE = false` (a hardcoded source constant, not an environment variable).
- **Client page:** `src/app/profile/city-council-district/page.tsx` — the only caller of this route.
- **Request method/auth:** `POST`, `Authorization: Bearer <access_token>` required.
- **Request body schema:** `{ districtLabel: 'City Council District 1' | 'City Council District 3', attestedOfficialLookup: true }`.
- **District input validation:** `isValidDistrictLabel()` restricts `districtLabel` to a closed 2-value literal union; the resolved district is then re-checked against a hardcoded `APPROVED_DISTRICT_IDS` array before any write plan is built.
- **Attestation requirement:** `attestedOfficialLookup !== true` → HTTP 400, no further processing.
- **RPC called:** `set_psl_city_council_district(p_district_id uuid)`, defined in `Reference Files/civicmarket_schema_addendum_city_council_district_rpc.sql`.
- **Target table:** `user_districts`.
- **Mutation behavior:** delete-then-insert, scoped to the calling user and to City Council District 1/3 ids only — see Phase 3.

## Phase 2 — Authorization / input safety

| # | Check | Result |
|---|---|---|
| 1 | Unauthenticated request rejected | **PASS** — no `Authorization` header → HTTP 401 immediately |
| 2 | Missing/invalid Bearer token rejected | **PASS** — `supabase.auth.getUser(token)` failure → HTTP 401; live-reconfirmed this session via an anonymous RPC call, which returned `42501 permission denied for function set_psl_city_council_district` — grants are still correctly restricted |
| 3 | Only authenticated user can alter their own assignment | **PASS** — `userId` comes only from `supabase.auth.getUser(token)`; the RPC independently re-derives `v_user_id := auth.uid()` server-side and accepts no user-id parameter at all — cross-user writes are structurally impossible, not just policy-restricted |
| 4 | `districtLabel` restricted to supported set | **PASS** — closed 2-value literal type, checked before any DB call |
| 5 | Arbitrary district UUID cannot be injected | **PASS** — the route only ever resolves a district by name lookup against the live `districts` table, then checks the result against a hardcoded id allow-list; the RPC independently re-validates the id against the same hardcoded 2-value set *inside* the function body (defense in depth — two independent checks, not one) |
| 6 | Attestation/explicit confirmation required | **PASS** — `attestedOfficialLookup !== true` fails closed at HTTP 400 |
| 7 | Malformed requests fail closed | **PASS** — invalid JSON body → 400; zero or ambiguous district match → 422 ("Could not resolve exactly one matching district. No write performed."); resolved id not in the approved set → 422 |
| 8 | Server-side identity from auth, not client-supplied | **PASS** — confirmed at both layers (route and RPC) |

**No FAIL or NEEDS FIX in Phase 2.**

## Phase 3 — Write scope

Traced against the live RPC source (`Reference Files/civicmarket_schema_addendum_city_council_district_rpc.sql`, unchanged since commit `8927098`):

```sql
DELETE FROM user_districts
WHERE user_id = v_user_id
  AND district_id IN ('...0001', '...0007');  -- City Council District 1/3 only

INSERT INTO user_districts (user_id, district_id, scope)
VALUES (v_user_id, p_district_id, 'city');
```

- **Inserts/replaces only the City Council row:** yes — the `DELETE` predicate is a hardcoded 2-id list (`City Council District 1`, `City Council District 3` only), not `ZIP_MANAGED_DISTRICTS` or any broader set.
- **Mayor / School Board / FL House / FL Senate / County Commission / Florida Statewide:** all structurally **preserved** — none of their district ids appear anywhere in the DELETE predicate, and the function accepts no other district id as a valid `p_district_id` value (Phase 2 check 5).
- **Unrelated districts:** preserved — same reasoning.
- **Duplicate prevention:** the delete-then-insert pair guarantees at most one City Council row survives any single call, regardless of prior state or repeated calls with the same district.
- **Cross-user writes:** structurally impossible (Phase 2 check 3).
- **`ZIP_MANAGED_DISTRICTS` is not used by this route or RPC at all** — confirmed by direct source read of `src/app/onboarding/zip/page.tsx` (current contents: County Commission At-Large, Mayor, Florida Statewide only — 3 entries, no City Council ids present) and by the RPC's own hardcoded, independent delete scope. The two mechanisms (ZIP onboarding vs. City Council verified-assignment) are fully decoupled, exactly as designed.

## Phase 4 — RPC/database function review

Inspected `Reference Files/civicmarket_schema_addendum_city_council_district_rpc.sql` plus one live, read-only re-verification this session (an anonymous-key RPC call, expected and confirmed to fail with a permission error — no mutation occurred or was possible).

| Check | Result |
|---|---|
| Function name | `public.set_psl_city_council_district(p_district_id uuid)` |
| `SECURITY INVOKER` (not `DEFINER`) | **PASS** — explicit `SECURITY INVOKER` in the function definition; live-verified in Gate I33 (`prosecdef = false`) and structurally unchanged since (no commit has touched this SQL file) |
| `search_path` hardening | **PASS** — `SET search_path = public, pg_temp` |
| Execute permissions | **PASS** — `REVOKE ALL ... FROM PUBLIC`, `REVOKE ALL ... FROM anon`, `GRANT EXECUTE ... TO authenticated` only. Live-reconfirmed this session: an anonymous call is rejected with `42501 permission denied`, matching Gate I33's finding exactly |
| `auth.uid()` handling | **PASS** — `v_user_id := auth.uid()`; `IF v_user_id IS NULL THEN RAISE EXCEPTION 'Unauthorized'` |
| District whitelist / lookup behavior | **PASS** — two independent checks inside the function body: (1) the hardcoded 2-id `IN` list, (2) a defense-in-depth `EXISTS` re-check against the live `districts` table scoped to the same 2 ids |
| Duplicate prevention | **PASS** — delete-then-insert |
| Transaction atomicity | **PASS** — the entire function body is one implicit Postgres transaction; any `RAISE EXCEPTION` aborts every effect, so the delete-then-insert pair cannot partially apply |

**One caveat, disclosed transparently:** this session could not directly re-fetch the live function's exact body text (no SQL Editor/psql access is available in this environment, a standing, already-documented constraint throughout this project). The tracked SQL file (`Reference Files/civicmarket_schema_addendum_city_council_district_rpc.sql`) is a historical snapshot and does **not** reflect the Gate I33 ambiguous-column fix (`CREATE OR REPLACE FUNCTION` was executed live in Supabase, not re-committed to this file). Confidence that the fix is still live rests on two independent, fresh, read-only signals gathered this session rather than trusting the file or prior docs alone: (1) the anonymous-permission-denied check above still behaves exactly as Gate I33 documented, and (2) the Gate I34 test account (`ec59ea92-...`) still holds **exactly one** City Council row (District 1, no duplicate, no drift) more than a day after that gate's real write — consistent with the fixed function having worked correctly and nothing having silently reverted or corrupted state since. This is strong indirect evidence, not a direct re-read of the function body — flagged explicitly rather than asserted as certain.

## Phase 5 — Prior test evidence applicability

| Prior result | Still applies to current HEAD? |
|---|---|
| Gate I34 real D1 → D3 → D1 write, atomic, verified | **Yes, with the caveat above.** Route/RPC source files unchanged since `8927098`; the test account's post-test state (exactly one CC D1 row) is unchanged today. |
| Unauthenticated rejection | **Yes** — re-verified live this session at the RPC-grant layer. |
| Invalid token rejection | **Yes** — route logic unchanged; same `supabase.auth.getUser(token)` check. |
| Invalid `districtLabel` rejection | **Yes** — same closed-set validation, unchanged source. |
| `attestedOfficialLookup=false` rejection | **Yes** — same explicit check, unchanged source. |
| Dry-run behavior with flag `false` | **Yes** — the guard block (lines 117-133) is unchanged and still the only reachable path with the flag off. |
| Rollback/recovery path | **Yes**, in principle — no code exists to make it not apply; not re-exercised live in this task (out of scope, read-only review only). |

**No stale evidence was found.** All prior gate results remain valid at current HEAD.

## Phase 6 — Fresh production account impact (read-only)

Confirmed live, this session, for the fresh production account (`faa39dd7-...`):

- **Has no City Council representation row today** — confirmed: its 3 `user_districts` rows are County Commission At-Large, Mayor, and Florida Statewide only.
- **ZIP 34953 requires explicit council-district verification** — confirmed structurally: `ZIP_MANAGED_DISTRICTS` never includes City Council District 1 or 3, for any ZIP, and no other code path assigns them automatically.
- **If the user verified District 1:** exactly one new `user_districts` row would be created — `district_id = 11111111-0000-0000-0000-000000000001` (City Council District 1), `scope = 'city'` — and "My Current Officials" would then additionally resolve **Stephanie Morgan** (confirmed live: a `current_officials` row already exists for this district).
- **If the user verified District 3:** exactly one new row — `district_id = 11111111-0000-0000-0000-000000000007`, `scope = 'city'` — resolving **Anthony Bonna, Sr.** (confirmed live: a `current_officials` row already exists for this district too).
- **What would remain untouched:** County Commission At-Large, Mayor (now Shannon Martin, per commit `2cae26d`), and Florida Statewide — none of their ids appear in the RPC's delete scope.

No write was made. No district assignment was guessed — District 1 vs. District 3 remains entirely the user's own verified choice via the official lookup tool.

## Phase 7 — Failure / recovery behavior

- **Repeated request, same district:** delete-then-insert of the identical row — ends in the same single-row state. Safe, idempotent.
- **Later change from D1 to D3 (or vice versa):** exactly the scenario Gate I34 already proved end-to-end, live, twice, on a real account, both directions.
- **Exactly one City Council row remains after any successful call:** guaranteed by construction (delete both approved ids, then insert exactly one).
- **Partial failure risk:** none — the entire function body is one implicit Postgres transaction; any exception aborts every effect, so a failed call cannot leave a user with zero or multiple rows relative to their pre-call state.
- **Retry safety:** safe — both the idempotent (same-district) and atomic (different-district) cases are covered.
- **Admin rollback/recovery options:** no dedicated admin UI exists for this, but the same read-only-verified, exact-scope service-role script pattern already used throughout this project (and for the Mayor seed's own rollback plan) would apply identically if ever needed — not built into the product UI, and not required to be for this review.

**Operational risk classification: LOW.**

## Phase 8 — Client UX review

Inspected `src/app/profile/city-council-district/page.tsx` in full (unchanged since commit `8927098`).

| Check | Result |
|---|---|
| Users clearly told ZIP may span council districts | **PASS** — explicit header copy: "Port St. Lucie City Council District 1 and District 3 cannot safely be told apart by ZIP code alone — district boundaries can cross ZIP code lines." |
| Users must explicitly identify their official/district | **PASS** — a required link-out to the official City "Council District Finder" tool, then a required radio selection |
| UI does not guess the district | **PASS** — no default selection, no ZIP-based inference anywhere in this component |
| Success state is clear | **PASS** — a distinct green success panel; message text already correctly branches on the API's own live `dryRun` flag (`result?.dryRun ? previewMessage : 'Your City Council district was saved.'`) — **no code change needed here** if the flag is ever flipped |
| Failure state is clear | **PASS** — a distinct red error panel with the server's own error message |
| Changing district later is supported/recoverable | **PASS** — resubmitting the form with a different selection is exactly the Gate-I34-proven D1↔D3 path |
| No hidden automatic write occurs without user action | **PASS** — write only happens on explicit form submission, gated by both a required radio selection and a required attestation checkbox |

**One blocking issue found, not cosmetic:** two pieces of **static, hardcoded UI copy** in this same file directly contradict what would actually happen if the write guard were ever enabled:

- Line 126-128: `"Preview only — saving is currently disabled"` (a persistent banner, shown regardless of API response).
- Lines 233-239: a full disclaimer block — *"Beta preview. Saving is intentionally disabled and will stay disabled unless the CivicMarket team explicitly approves and turns it on. Submitting the form above only shows you a preview of what would happen — nothing is saved."*

Neither string is conditional on the API's live `dryRun` response — both are unconditionally rendered today. If `ENABLE_CITY_COUNCIL_DISTRICT_WRITE` were flipped to `true` without also correcting this copy, a real user's district **would** be saved while the page simultaneously and falsely tells them "nothing is saved" and "saving is intentionally disabled." This is a genuine user-facing correctness defect, not a preference — and directly conflicts with this project's own consistently-documented transparency standard (never showing a user something that isn't true).

**Classification: NEEDS POLISH** (not READY, not NOT READY — the underlying flow, once the guard is on, works correctly and safely; only this static copy is wrong).

## Phase 9 — Enablement decision

## **Recommendation: B — READY ONLY AFTER SPECIFIC CODE FIXES**

The authorization model, input validation, database mutation scope, RPC atomicity, and prior test evidence are all **PASS** with no security or data-integrity concerns identified. The single blocking fix required before enabling the flag is copy-only, in one already-reviewed file:

**Blocking fix (only one):**
- File: `src/app/profile/city-council-district/page.tsx`
- Remove or make conditional the two static "preview only / saving is disabled" text blocks (lines ~126-128 and ~233-239) so they do not contradict a real, successful save once the write guard is enabled. This can be as simple as gating both on a `ENABLE_CITY_COUNCIL_DISTRICT_WRITE`-equivalent client-visible flag, or removing them entirely once the feature is live (the success/error states already correctly reflect the real API response and need no change).

No other fix is required. This is not proposed for implementation in this task (read-only review only, per task scope) — it is the one item that must be addressed, in the same enablement change, before or atomically with flipping the guard.

## Approval boundary

Per this task's explicit instructions, `ENABLE_CITY_COUNCIL_DISTRICT_WRITE` was **not** changed, no Supabase write occurred, and no deployment occurred. Because the recommendation is **B, not A**, no minimal enablement package (flag-flip-only) is proposed for execution — flipping the flag alone, today, would ship the user-facing copy defect described above. Any future enablement requires, at minimum: (1) the one blocking copy fix above, (2) a fresh explicit approval for the `false → true` change itself, (3) a fresh explicit approval for deployment (or confirmation that a data/flag-only change of this kind still requires no redeploy — unlike the flag itself, which **is** compiled into the deployed bundle and *does* require a rebuild/redeploy, unlike the Mayor `current_officials` row which was pure data), and (4) a separately-approved, single controlled test-account write plan mirroring Gate I31/I34's own precedent, before any real beta user's write is enabled.
