# County Commission District Assignment Lookup — Gate 15: Test-Write Execution Approval

Date: 07-08-2026
Timestamp: 07:25 pm EST

## Purpose

Package the exact approval fields, scope boundaries, SQL templates, and step-by-step handling sequence that must all be explicitly confirmed by the user before any future gate is permitted to execute a single scoped test-account write for St. Lucie County Commission District 1-5 assignment.

This Gate 15 package is documentation and approval packaging only. It does not itself grant approval, execute a write, or change any code, guard, or data.

## Current baseline

- Latest pushed commit: `0b24329` ("Prepare County Commission Gate 14 test write package").
- `ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE = false` in `src/app/api/set-county-commission-district/route.ts` — unchanged.
- Gate 14 (test-account write preparation) is complete: it filled in reusable SQL templates and the district ID reference table, leaving all test-account-specific fields marked PENDING USER APPROVAL.
- Nothing about app behavior, schema, seeds, migrations, `districts`, `user_districts`, `officials_for_user`, `src/lib/officials.ts`, `src/components/CurrentOfficialsSection.tsx`, or the At-Large row has changed since Gate 14.

## Gate 15 status

Approval package only. No write is executed by this document.

- Do not edit app behavior.
- Do not enable `ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE`.
- Do not run Supabase writes.
- Do not create, update, delete, or modify `user_districts` rows.
- Do not change schema, seeds, migrations, `districts`, `officials_for_user`, `src/lib/officials.ts`, `CurrentOfficialsSection`, or the At-Large row.
- Do not deploy.

## Required user-provided approval fields

Every field below must be explicitly provided or confirmed by the user before any future write-execution gate may proceed. None are satisfied by this document's existence.

- Test account user ID: **PENDING USER APPROVAL**
- Test account email: **PENDING USER APPROVAL**
- Selected District 1-5 label: **PENDING USER APPROVAL**
- Expected district ID: **PENDING USER APPROVAL**
- Explicit approval to temporarily enable the write guard: **PENDING USER APPROVAL**
- Explicit approval to restore the write guard to `false` immediately after the test: **PENDING USER APPROVAL**
- Explicit approval not to deploy during the test: **PENDING USER APPROVAL**

## District ID reference

- District 1: `11111111-0000-0000-0000-000000000031`
- District 2: `11111111-0000-0000-0000-000000000032`
- District 3: `11111111-0000-0000-0000-000000000033`
- District 4: `11111111-0000-0000-0000-000000000034`
- District 5: `11111111-0000-0000-0000-000000000035`
- At-Large row, preserved outside the delete scope at all times: `11111111-0000-0000-0000-000000000003`

## Exact pre-write checklist

Before any future write execution, every item below must be individually true and confirmed:

- [ ] All seven "Required user-provided approval fields" above are filled in by the user (not guessed, not carried over from a prior session's unrelated test data).
- [ ] `git status` is clean on the branch that will perform the test.
- [ ] The current pushed baseline matches what the user was told (no unexpected commits ahead or behind).
- [ ] The "Pre-test verification SQL" below has been run and its result recorded, so the test account's exact starting `user_districts` state is known.
- [ ] The "District ID verification SQL" below has been run and confirms the five District 1-5 rows and the At-Large row all exist as expected.
- [ ] The rollback SQL (below) has been reviewed and is ready to run immediately if needed.
- [ ] No deployment is scheduled or in progress.

## Exact allowed write scope

If and only if every item in "Required user-provided approval fields" and "Exact pre-write checklist" is satisfied, the allowed write is limited to exactly:

- **One** test account only — the approved user ID, and no other.
- **One** selected County Commission District 1-5 only — the approved label/ID, and no other.
- A delete limited strictly to existing County Commission District 1-5 `user_districts` rows for that one user — never a broader delete of that user's other district rows, and never touching the At-Large ID.
- A single insert of exactly one `user_districts` row for the approved, verified selected District 1-5 ID.
- Preservation of the At-Large row for that user at all times — it is never included in the delete scope and never rewritten.

## Exact forbidden scope

The following remain forbidden under every circumstance in this gate and any future write-execution gate, regardless of any approval given:

- No production rollout of any kind.
- No write against any account other than the one explicitly approved test account.
- No ZIP-only assignment of a District 1-5 row, for any account.
- No At-Large-based assignment of a District 1-5 row (At-Large membership alone must never be used as evidence for a District 1-5 write).
- No restoration of the all-five-County-Commission display (the disabled B2/At-Large expansion).
- No schema, seed, migration, `districts`, `officials_for_user`, `src/lib/officials.ts`, or `CurrentOfficialsSection` changes.

## Pre-test verification SQL

Carried forward unchanged from Gate 14, still with placeholders. Run only after a specific test account user ID is approved and substituted for `PENDING_TEST_USER_ID`.

```sql
SELECT ud.user_id, ud.district_id, d.name AS district_name, d.type AS district_type, d.city, d.state
FROM user_districts ud
JOIN districts d ON d.id = ud.district_id
WHERE ud.user_id = 'PENDING_TEST_USER_ID'
ORDER BY d.name;
```

Expected pre-test result: **PENDING USER APPROVAL**

## District ID verification SQL

Carried forward unchanged from Gate 14, still with placeholders.

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

## Rollback SQL

Carried forward unchanged from Gate 14, still with placeholders. Must be finalized only after the exact pre-test `user_districts` state (from "Pre-test verification SQL" above) is known.

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

## Post-test verification SQL

Carried forward unchanged from Gate 14, still with placeholders. Run only after a future, separately approved test write.

```sql
SELECT ud.user_id, ud.district_id, d.name AS district_name, d.type AS district_type, d.city, d.state
FROM user_districts ud
JOIN districts d ON d.id = ud.district_id
WHERE ud.user_id = 'PENDING_TEST_USER_ID'
ORDER BY d.name;
```

Expected post-test result: **PENDING USER APPROVAL**

## Write guard handling sequence

If and only if every required approval field and pre-write checklist item above is satisfied, a future write-execution gate would follow this exact sequence, in this exact order:

1. Confirm clean `git status` before making any change.
2. Temporarily set `ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE = true` in `src/app/api/set-county-commission-district/route.ts`.
3. Run `npm run build` to confirm the change compiles cleanly before any request is made.
4. Perform exactly one scoped test request through the approved test account only, using the approved district selection and attestation.
5. Verify the result using the "Post-test verification SQL" above, and confirm it matches the approved expected post-test state.
6. Immediately restore `ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE = false`.
7. Run `npm run build` again to confirm the restored disabled state compiles cleanly.
8. Verify final `git status` is clean (or contains only the intended, reviewed guard-restoration diff) before concluding the gate.

No step may be skipped or reordered. Step 6 must occur immediately after step 5, regardless of whether the test succeeded or failed — see "Failure handling" below.

## Failure handling

If any part of the sequence above fails:

- If the write itself fails (network/Supabase error) after step 4, do not retry automatically — proceed directly to step 5's verification (to confirm no partial state was left), then step 6 (restore the guard) regardless of outcome.
- If verification in step 5 does not match the approved expected post-test state, run the rollback SQL above before proceeding to step 6.
- `ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE` must be restored to `false` (step 6) even if the test failed, even if rollback was needed, and even if verification is inconclusive — the guard is never left enabled while any uncertainty remains.
- Any failure, rollback, or unexpected result must be documented in a future gate before any retry is attempted; a retry is not automatic or assumed.
- The At-Large row must be re-verified unchanged as part of failure handling, using the "District ID verification SQL" above.

## Risk check

- **Scope:** This document is an approval-packaging step for a possible future single test-account write. It contains no executable approval and performs no action itself.
- **Expected result:** No runtime behavior change, no Supabase write, no `user_districts` row created or modified, no schema/seed/migration/`districts`/`officials_for_user` change, no deployment.
- **No-change list:** `ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE` remains `false`; `src/app/api/set-county-commission-district/route.ts` write guard unchanged; `src/lib/officials.ts` unchanged; `src/components/CurrentOfficialsSection.tsx` unchanged; At-Large row (`11111111-0000-0000-0000-000000000003`) not renamed, deleted, replaced, or repurposed; the disabled all-five-County-Commission-via-At-Large expansion was not restored.
- **Test limits:** No live write test was performed as part of Gate 15. All SQL templates above are unexecuted and are provided for future use only, contingent on explicit approval of every "Required user-provided approval fields" item.
- **Rollback path:** The rollback SQL above, combined with step 6 of the write guard handling sequence, is the complete rollback path for any future approved test — no additional rollback mechanism is required or proposed.

## Hard stops

The following must never happen at any point in a future write-execution gate, with no exception path:

- Performing any write before all seven "Required user-provided approval fields" are explicitly approved by the user.
- Enabling `ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE` without that same explicit approval already recorded.
- Leaving `ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE` set to `true` after the approved test concludes, for any reason.
- Scoping a delete beyond the five District 1-5 IDs, or touching the At-Large ID in any delete or insert.
- Deploying any part of this feature as part of a test write.
- Substituting a guessed, assumed, or previously-used test account for the explicitly approved one.
- Restoring or re-enabling the all-five-County-Commission-via-At-Large display.

## Final approval statement template

For the user to fill in and provide verbatim before any future write-execution gate may proceed:

```
I approve a single scoped test-account write for County Commission District assignment with the following exact values:

Test account user ID: ____________________
Test account email: ____________________
Selected District 1-5 label: ____________________
Expected district ID: ____________________

I approve temporarily enabling ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE for this single test only.
I approve restoring ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE to false immediately after the test.
I approve that no deployment will occur during this test.

Date approved: ____________________
```

No future write-execution gate may proceed until this statement is provided with all fields completed by the user.
