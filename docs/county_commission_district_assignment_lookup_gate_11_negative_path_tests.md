# County Commission District Assignment Lookup - Gate 11 Negative-Path/Auth-Rejection Tests

## Purpose

Verify the County Commission District 1-5 assignment API rejects unsafe requests and remains dry-run only while writes are disabled.

## Scope

This gate is limited to negative-path and dry-run validation for:

- `src/app/api/set-county-commission-district/route.ts`

## Required safety condition

`ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE` must remain `false`.

## Tests performed

- Unauthenticated POST is rejected.
- Missing Bearer token is rejected.
- Invalid token is rejected.
- Invalid `districtLabel` is rejected.
- `attestedOfficialLookup: false` is rejected.
- Valid token, valid district, and `attestedOfficialLookup: true` returns dry-run only.
- No Supabase mutations execute.
- No `user_districts` rows are created or modified.
- At-Large row remains unchanged.
- Current Officials behavior remains unchanged.

## Hard stops observed

- `ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE` was not enabled.
- No production Supabase writes were intentionally run.
- No `user_districts` rows were intentionally created or modified.
- No schema, seed, migration, districts, or `officials_for_user` changes were made.
- The At-Large row was not renamed, deleted, replaced, or repurposed.
- All-five County Commission At-Large expansion was not restored.
- No deployment was performed.

## Initial validation

- `npm run build` passed before Gate 11 tests.
- Route is available as dynamic API route: `/api/set-county-commission-district`.
- Write guard confirmed false before testing.

## Test results

PASS.

### Test 1 - Unauthenticated POST

Result: PASS.

Observed response:

- `401 Unauthorized`

### Test 2 - Body present but missing Bearer token

Result: PASS.

Observed response:

- `401 Unauthorized`

### Test 3 - Invalid Bearer token

Result: PASS.

Observed response:

- `401 Unauthorized`

### Test 4 - Invalid districtLabel with valid token

Result: PASS.

Request used:

- `districtLabel: District 6`
- `attestedOfficialLookup: true`

Observed response:

- `400 Bad Request`

### Test 5 - attestedOfficialLookup false with valid token

Result: PASS.

Request used:

- `districtLabel: District 1`
- `attestedOfficialLookup: false`

Observed response:

- `400 Bad Request`

### Test 6 - Valid token, valid district, attestation true

Result: PASS.

Request used:

- `districtLabel: District 1`
- `attestedOfficialLookup: true`

Observed response:

- `dryRun: true`
- Message exactly matched:
  `Write path disabled pending explicit approval. No user_districts row was created or modified.`
- Resolved district:
  - `11111111-0000-0000-0000-000000000031`
  - `St. Lucie County Commission District 1`
- Returned delete scope was limited to County Commission District 1-5 IDs:
  - `11111111-0000-0000-0000-000000000031`
  - `11111111-0000-0000-0000-000000000032`
  - `11111111-0000-0000-0000-000000000033`
  - `11111111-0000-0000-0000-000000000034`
  - `11111111-0000-0000-0000-000000000035`
- Returned preservation note confirmed At-Large was not in delete scope:
  - `11111111-0000-0000-0000-000000000003`

### Temporary auth issue during Test 6

An initial Test 6 attempt returned `401 Unauthorized` due to an expired or stale local access token. After refreshing local auth and using a fresh token, the valid request returned the expected dry-run response.

## No-change confirmation

Confirmed by route behavior and returned dry-run response:

- `ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE` remained `false`.
- Valid request returned before the mutation block.
- No `delete()` call should have executed.
- No `insert()` call should have executed.
- No `update()` or `upsert()` exists in the route path inspected for this gate.
- No production Supabase write was intentionally run.
- No schema, seed, migration, districts, `officials_for_user`, `src/lib/officials.ts`, or `CurrentOfficialsSection` changes were made.
- At-Large row remained out of scope.

## Final Gate 11 status

PASS.

Gate 11 negative-path/auth-rejection testing is complete with writes still disabled.

## Recommended next state

- Hold with `ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE = false`.
- Do not enable writes without a separate explicit approval gate and rollback plan.
