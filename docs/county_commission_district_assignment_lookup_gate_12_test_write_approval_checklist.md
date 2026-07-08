# County Commission District Assignment Lookup - Gate 12 Test-Account Write Approval Checklist

## Purpose

Define the required approvals, scope, rollback plan, and validation steps before enabling any County Commission District 1-5 user_districts write.

## Status

Draft checklist only.

No write is approved by this document.

## Current safety state

ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE = false

## Proposed future test scope

A future write test, if explicitly approved, must be limited to one known test account only.

## Required approvals before any write

Before changing ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE, explicitly approve all of the following:

- Exact test account user ID.
- Exact test account email.
- Exact County Commission District label to test.
- Expected district ID.
- Exact pre-test user_districts state for that user.
- Exact post-test expected user_districts state.
- Rollback SQL.
- Verification SQL.
- Decision to temporarily enable the write guard.
- Decision to restore the write guard to false immediately after the test.
- Decision not to deploy during the test.

## Hard stops

Do not enable ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE without explicit approval.
Do not run production Supabase writes without explicit approval.
Do not create or modify user_districts rows without explicit approval.
Do not test against a non-test account.
Do not use ZIP-only assignment.
Do not use At-Large membership to assign District 1-5.
Do not change schema, seeds, migrations, districts, or officials_for_user.
Do not rename, delete, replace, or repurpose the At-Large row.
Do not restore all-five County Commission At-Large expansion.
Do not deploy.

## Required pre-test verification SQL

Pre-test user_districts check:

    select *
    from user_districts
    where user_id = 'TEST_USER_ID'
    order by created_at;

District ID check:

    select id, name
    from districts
    where name in (
      'St. Lucie County Commission District 1',
      'St. Lucie County Commission District 2',
      'St. Lucie County Commission District 3',
      'St. Lucie County Commission District 4',
      'St. Lucie County Commission District 5',
      'St. Lucie County Commission At-Large'
    )
    order by name;

## Required rollback SQL

Rollback must be written using the approved test user ID and approved district IDs before any write is attempted.

Rollback must remove only the test user's County Commission District 1-5 row created during the test.

Rollback must not remove the At-Large row.

## Required post-test verification

After any future approved write test:

- Confirm the test user has only the intended District 1-5 row.
- Confirm the At-Large row is unchanged.
- Confirm no other user was modified.
- Confirm Current Officials shows only the one district commissioner for the verified District 1-5 row.
- Confirm all-five At-Large expansion did not return.
- Restore ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE = false.
- Run npm run build.
- Document results before commit.

## Final Gate 12 status

Pending approval.

This checklist does not approve writes.

