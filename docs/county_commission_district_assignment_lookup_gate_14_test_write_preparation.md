# County Commission District Assignment Lookup — Gate 14: Test-Account Write Preparation

Date: 07-08-2026
Timestamp: 07:21 pm EST

## Purpose

Prepare the exact SQL templates, reference data, and decision checklist that will be needed if a future gate is separately, explicitly approved to perform a single scoped test-account write for St. Lucie County Commission District 1-5 assignment.

This Gate 14 package is documentation and verification planning only. It fills in the templates carried forward from Gate 13 with reusable SQL and reference values, but leaves every test-account-specific field marked PENDING USER APPROVAL. It does not approve, schedule, or perform any write.

## Current baseline

- Latest pushed commit: `4f241e4` ("Update current state for County Commission Gate 13").
- `ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE = false` in `src/app/api/set-county-commission-district/route.ts` — unchanged.
- Gate 13 (explicit test-account write approval package) is complete: it established the list of fields that must be explicitly approved before any test write, and left all of them as PENDING USER APPROVAL.
- Nothing about app behavior, schema, seeds, migrations, `districts`, `user_districts`, `officials_for_user`, `src/lib/officials.ts`, `src/components/CurrentOfficialsSection.tsx`, or the At-Large row has changed since Gate 13.

## Gate 14 status

Preparation only. No write is approved by this document.

- Do not edit app behavior.
- Do not enable `ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE`.
- Do not run Supabase writes.
- Do not create, update, delete, or modify `user_districts` rows.
- Do not change schema, seeds, migrations, `districts`, `officials_for_user`, `src/lib/officials.ts`, `CurrentOfficialsSection`, or the At-Large row.
- Do not deploy.

## Required test-account fields

The following remain unresolved and must each be explicitly approved by the user before any future write proceeds:

- Test account user ID: **PENDING USER APPROVAL**
- Test account email: **PENDING USER APPROVAL**
- Selected District 1-5 label: **PENDING USER APPROVAL**
- Expected district ID: **PENDING USER APPROVAL**

No placeholder, guessed, or previously-used test account value from any prior gate or session is substituted here. All four fields must come from the user directly.

## District ID reference

- District 1: `11111111-0000-0000-0000-000000000031`
- District 2: `11111111-0000-0000-0000-000000000032`
- District 3: `11111111-0000-0000-0000-000000000033`
- District 4: `11111111-0000-0000-0000-000000000034`
- District 5: `11111111-0000-0000-0000-000000000035`
- At-Large row, preserved outside the delete scope at all times: `11111111-0000-0000-0000-000000000003`

## Pre-test verification SQL template

Run only after a specific test account user ID is approved and substituted for `PENDING_TEST_USER_ID` below.

```sql
SELECT ud.user_id, ud.district_id, d.name AS district_name, d.type AS district_type, d.city, d.state
FROM user_districts ud
JOIN districts d ON d.id = ud.district_id
WHERE ud.user_id = 'PENDING_TEST_USER_ID'
ORDER BY d.name;
```

Expected pre-test result: **PENDING USER APPROVAL** (must record the test account's full existing `user_districts` rows — including confirming the At-Large row is present as expected — before any write is considered).

## District ID verification SQL template

```sql
SELECT id, name, type, city, state
FROM districts
WHERE id IN (
  '11111111-0000-0000-0000-000000000031',
  '11111111-0000-0000-0000-000000000032',
  '11111111-0000-0000-0000-000000000033',
  '11111111-0000-0000-0000-000000000034',
  '11111111-0000-0000-0000-000000000035',
  '11111111-0000-0000-0000-000000000003'
)
ORDER BY name;
```

Expected result:
- Five District 1-5 rows exist, matching the reference IDs above.
- The At-Large row exists and remains unchanged.
- No other row is affected by this read-only query.

## Proposed single test write scope

If a future gate separately and explicitly approves a test write, it must be scoped to exactly:

- **One** test account (the approved user ID only).
- A delete limited strictly to `user_districts` rows for that user whose `district_id` is one of the five District 1-5 IDs listed above — never a broader delete, and never touching the At-Large ID.
- A single insert of exactly one `user_districts` row: `{ user_id: <approved test user ID>, district_id: <approved expected district ID>, scope: 'county' }`.
- No other user, row, or table touched.

These SQL statements are not approved to run by this document and are not included here in executable form — they will be finalized only once the exact test-account fields above are approved, per the Gate 13 requirement that the write path in `src/app/api/set-county-commission-district/route.ts` (with its live `districts` resolution and scoped delete-then-insert) is the only approved code path for performing this write, rather than an ad hoc manual SQL statement.

## Rollback SQL template

Rollback SQL must be finalized only after the exact pre-test `user_districts` state (from "Pre-test verification SQL template" above) is known, so the rollback can restore the precise prior state rather than assume it.

General template (to be completed with real values once approved):

```sql
-- Remove the test-inserted District 1-5 row
DELETE FROM user_districts
WHERE user_id = 'PENDING_TEST_USER_ID'
  AND district_id = 'PENDING_EXPECTED_DISTRICT_ID';

-- If the pre-test state included a different District 1-5 row for this user,
-- restore it here (fill in only if applicable, from the pre-test verification result):
-- INSERT INTO user_districts (user_id, district_id, scope)
-- VALUES ('PENDING_TEST_USER_ID', 'PENDING_PRIOR_DISTRICT_1_5_ID', 'county');
```

The rollback must never touch the At-Large row (`11111111-0000-0000-0000-000000000003`) under any circumstance.

## Post-test verification SQL template

Run only after a future, separately approved test write.

```sql
SELECT ud.user_id, ud.district_id, d.name AS district_name, d.type AS district_type, d.city, d.state
FROM user_districts ud
JOIN districts d ON d.id = ud.district_id
WHERE ud.user_id = 'PENDING_TEST_USER_ID'
ORDER BY d.name;
```

Expected post-test result: **PENDING USER APPROVAL** (must show exactly the approved expected district ID's row added, the At-Large row unchanged, and no other row altered).

## Current Officials expected result after successful future write

After a future, separately approved test write completes successfully:

- `My Current Officials` for the test account should show exactly the one commissioner tied to the newly written District 1-5 row, in addition to any officials the account already had.
- No other County Commissioner should appear — the all-five-County-Commission-via-At-Large expansion (disabled per the Path 1 personalization fix) must not be restored or re-triggered by this test.
- No change to `src/lib/officials.ts`, `CurrentOfficialsSection.tsx`, or `officials_for_user` is required or permitted to achieve this — the existing exact `district_id` join is expected to surface the result automatically.

## No-deploy boundary

No deployment is approved as part of Gate 14. A future test write, if separately approved, must remain scoped to the test account's data only and must not be accompanied by any deployment, environment promotion, or production rollout unless separately and explicitly approved.

## Write guard handling plan

If a future gate separately and explicitly approves a test write:

1. `ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE` may be temporarily set to `true` **only** after that explicit approval is recorded, and only for the duration of the approved test.
2. Immediately after the test write (successful or not) is executed and verified, `ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE` must be restored to `false` before any other action is taken.
3. The temporary `true` state must never be committed or deployed — it is a local/session-scoped toggle for the duration of the approved test only, consistent with the "No-deploy boundary" above.
4. This plan is not itself an approval to make that change — it only describes how the toggle would be handled if and when approval is separately given.

## Failure handling

If any part of a future approved test write fails:

- No partial state may be left in place — if the delete succeeds but the insert fails (or vice versa), the rollback SQL template above must be used to restore the exact pre-test state before proceeding further.
- `ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE` must still be restored to `false` immediately, regardless of whether the test succeeded or failed.
- Any failure must be documented in a future gate before a retry is attempted — a retry is not automatic or assumed.
- The At-Large row must be re-verified unchanged as part of failure handling, using the same query as "District ID verification SQL template" above.

## Risk check

- **Scope:** This document is a documentation and SQL-template preparation package for a possible future single test-account write. It contains no executable approval and performs no action itself.
- **Expected result:** No runtime behavior change, no Supabase write, no `user_districts` row created or modified, no schema/seed/migration/`districts`/`officials_for_user` change, no deployment.
- **No-change list:** `ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE` remains `false`; `src/app/api/set-county-commission-district/route.ts` write guard unchanged; `src/lib/officials.ts` unchanged; `src/components/CurrentOfficialsSection.tsx` unchanged; At-Large row (`11111111-0000-0000-0000-000000000003`) not renamed, deleted, replaced, or repurposed; the disabled all-five-County-Commission-via-At-Large expansion was not restored.
- **Test limits:** No live write test was performed as part of Gate 14. All SQL templates above are unexecuted and are provided for future use only, contingent on explicit approval of the "Required test-account fields" section.

## Hard stops

The following must never happen at any point in a future test write, with no exception path:

- Performing any write before all four "Required test-account fields" are explicitly approved by the user.
- Enabling `ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE` without that same explicit approval already recorded.
- Leaving `ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE` set to `true` after the approved test concludes.
- Scoping a delete beyond the five District 1-5 IDs, or touching the At-Large ID in any delete or insert.
- Deploying any part of this feature as part of a test write.
- Substituting a guessed, assumed, or previously-used test account for the explicitly approved one.

## Next decision needed from user

The user must provide or explicitly approve all of the following before Gate 15 (or any future write-execution gate) can proceed:

1. The exact test account user ID.
2. The exact test account email.
3. The exact District 1-5 label to test (e.g., "District 3").
4. Confirmation of the expected district ID corresponding to that label (from the "District ID reference" table above).
5. Explicit approval to temporarily enable `ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE`, with immediate restoration to `false` afterward, as described in "Write guard handling plan."

Until all five are provided, this feature remains held at dry-run only, exactly as it has been since Gate 8.
