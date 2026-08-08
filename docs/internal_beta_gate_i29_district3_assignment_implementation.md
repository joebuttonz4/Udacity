# Internal Beta — Gate I29: District 3 Assignment Implementation, Write Disabled

## 1. Date and timestamp

Date: 08-08-2026
Timestamp: 07:23 am EST

## 2. Gate I28 architecture approval

Gate I28 (`docs/internal_beta_gate_i28_district3_user_assignment_mechanism_design.md`) recommended Option A — official lookup + user attestation, adapted from the existing (disabled) County Commission pattern — and reached outcome "PASS — recommended District 3 assignment architecture is ready for explicit implementation approval." This gate implements that design with the production write path kept disabled.

## 3. Implementation

### UI page

`src/app/profile/city-council-district/page.tsx` — new file, closely modeled on `src/app/profile/county-commission/page.tsx`'s proven shape.

### API route

`src/app/api/set-city-council-district/route.ts` — new file, closely modeled on `src/app/api/set-county-commission-district/route.ts`'s proven shape.

### Profile Settings link

`src/app/profile/page.tsx` — one `SettingsRow` added, linking to `/profile/city-council-district`, placed before the existing "Set County Commission District" row (which is unchanged).

### Official lookup source

City of Port St. Lucie "Council District Finder" — `https://pslgis.maps.arcgis.com/apps/webappviewer/index.html?id=397887d028a04aaa91e901feca2e6da1`, the exact source verified live in Gate I28.

### No-address-storage design

The page never collects a street address; it only links out to the official tool in a new tab and asks the user which district that tool showed them.

### Closed selection

Exactly two radio options: `City Council District 1` and `City Council District 3` — no free-text input anywhere in the flow.

### Attestation requirement

A required checkbox ("I verified this district using the official lookup.") gates the submit button (`canSubmit = selectedDistrict !== '' && attested && state !== 'loading'`); the form cannot be submitted without it checked.

### Approved district IDs

- City Council District 1: `11111111-0000-0000-0000-000000000001`
- City Council District 3: `11111111-0000-0000-0000-000000000007`

Used only as a **redundant safety check** after live resolution (`APPROVED_DISTRICT_IDS.includes(resolvedDistrict.id)`), never to skip the live database lookup.

### Authentication model

Bearer-token authentication: the client sends the user's own Supabase session `access_token`; the server validates it via `createServiceClient()` + `supabase.auth.getUser(token)` — identical pattern to `set-county-commission-district`. The service-role key used by `createServiceClient()` is never exposed to the client; only the environment variable *name* is referenced in `src/lib/supabase-server.ts`, unchanged by this gate.

### Live district ID verification

The server never trusts the client-supplied label directly as an ID. It resolves the district by exact `name` match against the live `districts` table, fails closed (422) on zero or ambiguous matches, then additionally verifies the resolved ID is one of the two `APPROVED_DISTRICT_IDS` before proceeding — a defense-in-depth check beyond what `set-county-commission-district` does, since that route's approved scope was five names sharing a prefix rather than two independent full names.

### Write guard

```ts
const ENABLE_CITY_COUNCIL_DISTRICT_WRITE = false
```

Remains `false`. This is a **new, independent guard**, not a reuse of `ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE` (which is untouched by this gate and remains scoped only to County Commission). While false, the early return makes every `DELETE`/`INSERT` statement in the file unreachable.

### Dry-run response behavior

```json
{
  "dryRun": true,
  "message": "Write path disabled pending explicit approval. No user_districts row was created or modified.",
  "selectedDistrictLabel": "City Council District 1",
  "selectedDistrictId": "11111111-0000-0000-0000-000000000001",
  "resolvedDistrict": { "id": "...", "name": "..." },
  "writePlan": { "...": "..." }
}
```

## 4. Exact proposed `user_districts` mutation scope (unreachable while guard is false)

1. Resolve both `City Council District 1` and `City Council District 3` ids live (`.in('name', ['City Council District 1', 'City Council District 3'])`) — never hardcoded — to build the delete scope.
2. `DELETE FROM user_districts WHERE user_id = <authenticated user> AND district_id IN (<the two resolved ids>)`.
3. `INSERT INTO user_districts (user_id, district_id, scope: 'city')` — exactly one row, the selected district.

### Unrelated assignment preservation

Because the delete scope is built by resolving **only** the two City Council district names, the following are structurally excluded and cannot be affected by any code path in this file:
- Mayor (`11111111-0000-0000-0000-000000000006`, name `Mayor`) — does not match either City Council district name.
- School Board District 1, County Commission At-Large, FL House 85, FL Senate 27 — none match either City Council district name.
- County Commission District 1-5 — untouched; this file does not reference `ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE`, `src/app/api/set-county-commission-district/route.ts`, or any County Commission district name at all.

## 5. Atomicity finding

The delete-then-insert pair in this route is **not wrapped in a single transaction or RPC** — identical in shape to the existing `set-county-commission-district` route and to the onboarding flow's own delete-then-insert pattern. **True atomicity cannot be guaranteed with the current implementation.** A failure between the delete and insert calls would leave the user with **no** City Council district assigned (not a duplicate — the delete-before-insert ordering already prevents that specific failure mode). Per instruction, no schema function/RPC was added in this gate. **This is documented as a required decision before Gate I31**, not a defect to silently accept: a future gate should decide whether to (a) wrap the replacement in a single Postgres function for true atomicity, or (b) explicitly design the route's error response for a post-delete insert failure so the user is never left in an unexplained no-district state. The write guard remains `false` in the meantime — the dry-run flow itself does not depend on this decision, since no delete or insert executes while the guard is false.

## 6. District 1 onboarding default risk (unresolved, not addressed here)

`ALL_PSL_DISTRICTS` in `src/app/onboarding/zip/page.tsx` was **not modified** in this gate. City Council District 1 remains in that flat, unconditional citywide onboarding list. As Gate I28 found and this gate reconfirms by not touching it: every onboarded Port St. Lucie user is still assigned District 1 by default regardless of their actual address, even though ZIP cannot distinguish District 1 from District 3 (or 2 or 4). The new `/profile/city-council-district` flow implemented in this gate provides a **future, user-initiated correction mechanism** once writes are enabled — it does not change the default onboarding behavior, and does not, by itself, resolve the underlying accuracy risk for users who never visit the new settings page. This remains a known, documented, unresolved risk, unchanged from Gate I28's finding.

## 7. Pre-Gate-I31 blocker: District 3 Current Officials data gap

Confirmed unchanged from Gate I28: a user whose City Council district assignment is changed from District 1 to District 3 would lose Stephanie Morgan from their Current Officials list, with **no replacement**, because no District 3 councilmember `current_officials` row exists. Anthony Bonna was identified in Gate I28 as the current District 3 councilmember (confirmed again live in that gate's research), but **no `current_officials` row was created, modified, or guessed in this gate** — his source details and term data have not been independently verified through this repository's established verified-source methodology (the same process already used for Stephanie Morgan, Debbie Hawley, and Toby Overdorf).

**Before any live District 3 test-account assignment is authorized (Gate I31), the correct City Council District 3 `current_officials` row must be independently verified and seeded through a separately approved, scoped data task.** This is not performed by Gate I29.

## 8. Static and negative-path verification

Two paths were live-tested against a local dev server (safe — no authenticated session was created or used, so the write-guarded code path was never reachable regardless):

| Test | Method | Result |
|---|---|---|
| Unauthenticated request (no `Authorization` header) | Live `curl` against `http://localhost:3000/api/set-city-council-district` | `401 {"error":"Unauthorized"}` ✓ |
| Invalid/malformed Bearer token | Live `curl` with `Authorization: Bearer not-a-real-token-xyz` | `401 {"error":"Unauthorized"}` ✓ |

The remaining paths require an authenticated session, which was not created (no credentials were entered; per standing rules, the assistant never signs in) — verified instead by precise code-trace against the actual route source and the live `districts` table state already confirmed earlier in this gate sequence:

| Test | Code-trace result |
|---|---|
| Invalid `districtLabel` | `isValidDistrictLabel` rejects anything not exactly `City Council District 1` or `City Council District 3`, returning `400` before any database call |
| `attestedOfficialLookup: false` | Checked immediately after the label check, returns `400` before any database call |
| Valid District 1 + attestation | Resolves live to `id: 11111111-0000-0000-0000-000000000001`; passes the `APPROVED_DISTRICT_IDS` check; guard is `false` → returns `dryRun: true`, `selectedDistrictId: ...000001`, zero mutation (delete/insert code is unreachable below the early return) |
| Valid District 3 + attestation | Resolves live to `id: 11111111-0000-0000-0000-000000000007`; same outcome, `selectedDistrictId: ...000007` |
| Delete scope | `.in('name', ['City Council District 1', 'City Council District 3'])` resolves to exactly `{...000001, ...000007}` against the live `districts` table (both confirmed present with those exact names in Gate I28's research, re-confirmed unchanged by this gate) |
| Mayor outside delete scope | `Mayor` (`...000006`) does not match either City Council district name — structurally excluded |
| County Commission At-Large outside delete scope | `St. Lucie County Commission At-Large` (`...000003`) does not match either City Council district name — structurally excluded |
| No mutation while guard is false | Every `DELETE`/`INSERT` statement in the file is lexically below the `if (!ENABLE_CITY_COUNCIL_DISTRICT_WRITE)` early return, confirmed by direct inspection of the file — no code path can reach them |

## 9. Build and lint

- `npm run build`: **passed** — 27 routes generated (25 previous + 2 new: `/profile/city-council-district`, `/api/set-city-council-district`), no errors.
- `npm run lint`: **5 pre-existing errors only** (`scripts/import-real-psl-data.cjs`, `scripts/validate-real-psl-csvs.cjs`), identical to every prior lint run. No new errors in either new file or the modified profile page.

## 10. No database write / no deployment

No Supabase write of any kind was performed by this gate. No `user_districts` row was created, modified, or deleted. No `districts`, `elections`, `candidates`, or `current_officials` row was touched. No deployment occurred.

## 11. Gate outcome

**Gate I29 PASS — District 1/3 verified-assignment flow implemented with production writes disabled.**

**Gate I31 live assignment remains BLOCKED until:**
1. Gate I30 UI/negative-path review passes.
2. The District 3 Current Officials data gap (Section 7) is resolved.
3. Atomic replacement safety (Section 5) is accepted or resolved.
4. Explicit scoped test-account write approval is given.

## 12. No-change confirmation

Gate I29 made no changes to: `candidates`, `elections`, `districts`, `user_districts`, `voting_records`, `candidate_positions`, `match_scores`, `civic_dna`, `civic_dna_answers`, `current_officials`, `officials_for_user`, `src/lib/officials.ts`, `CurrentOfficialsSection`, `src/app/onboarding/zip/page.tsx`, `src/app/profile/county-commission/page.tsx`, `src/app/api/set-county-commission-district/route.ts`, `src/lib/supabase-server.ts`, schema, RLS, grants, seeds, migrations, CSV files, PowerShell scripts, environment files, the County Commission write guard, the At-Large row, or deployment state.

No secret, API key, token, password, connection string, or environment value was inspected or exposed. `ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE` remains `false`. The District 1 election-date discrepancy remains unresolved. No deployment occurred.
