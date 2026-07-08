# County Commission District Assignment Lookup - Gate 13 Explicit Test-Account Write Approval Package

Date: 07-08-2026
Timestamp: 07:06 pm EST

## Purpose

Prepare the explicit approval package required before any future single test-account write for St. Lucie County Commission District 1-5 assignment.

This Gate 13 package is documentation and verification planning only.

## Current Safety State

ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE = false

The route remains dry-run only.

## Status

- Gate 13 does not approve writes.
- Gate 13 does not enable writes.
- Gate 13 does not deploy anything.
- Gate 13 does not create, modify, or delete any Supabase data.

## Required Explicit Approval Before Any Future Test Write

Before any test-account write may occur, the user must explicitly approve all of the following:

- Exact test account user ID
- Exact test account email
- Exact County Commission District label to test
- Expected district ID
- Exact pre-test user_districts state for that user
- Exact post-test expected user_districts state
- Rollback SQL
- Verification SQL
- Temporary decision to enable ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE
- Immediate decision to restore ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE = false after the test
- No-deploy boundary during the test

## Proposed Test Account Fields

Test account user ID: PENDING USER APPROVAL

Test account email: PENDING USER APPROVAL

Selected County Commission District label: PENDING USER APPROVAL

Expected district ID: PENDING USER APPROVAL

## District ID Reference

- District 1: 11111111-0000-0000-0000-000000000031
- District 2: 11111111-0000-0000-0000-000000000032
- District 3: 11111111-0000-0000-0000-000000000033
- District 4: 11111111-0000-0000-0000-000000000034
- District 5: 11111111-0000-0000-0000-000000000035
- At-Large row to preserve: 11111111-0000-0000-0000-000000000003

## Pre-Test Verification SQL

Run only after a specific test account user ID is approved.

SQL to run later:
SELECT ud.user_id, ud.district_id, d.name AS district_name, d.type AS district_type, d.city, d.state FROM user_districts ud JOIN districts d ON d.id = ud.district_id WHERE ud.user_id = 'PENDING_TEST_USER_ID' ORDER BY d.name;

Expected pre-test result: PENDING USER APPROVAL

## District ID Verification SQL

SQL to run later:
SELECT id, name, type, city, state FROM districts WHERE id IN ('11111111-0000-0000-0000-000000000031','11111111-0000-0000-0000-000000000032','11111111-0000-0000-0000-000000000033','11111111-0000-0000-0000-000000000034','11111111-0000-0000-0000-000000000035','11111111-0000-0000-0000-000000000003') ORDER BY name;

Expected district verification result:
- Five District 1-5 rows exist.
- At-Large row exists.
- At-Large row remains unchanged.

## Proposed Future Test Write Scope

The future test write, if separately approved, must be limited to one test account only.

The delete scope must be limited to District 1-5 IDs only.

The insert must use only the approved selected District 1-5 ID.

These SQL examples are not approved to run by this document.

## Rollback Requirement

Rollback SQL must be finalized after the exact pre-test state is known.

At-Large must not be deleted, renamed, replaced, or repurposed.

## Post-Test Verification SQL

Run only after a future separately approved test write.

SQL to run later:
SELECT ud.user_id, ud.district_id, d.name AS district_name, d.type AS district_type, d.city, d.state FROM user_districts ud JOIN districts d ON d.id = ud.district_id WHERE ud.user_id = 'PENDING_TEST_USER_ID' ORDER BY d.name;

Expected post-test result: PENDING USER APPROVAL

## Current Officials Verification After Future Test Write

After a future approved test write, Current Officials should show only the commissioner tied to the verified District 1-5 row.

The all-five County Commission At-Large expansion must not be restored.

## No-Deploy Boundary

No deployment is approved as part of Gate 13.

A future test write, if approved, must remain local/test-account scoped unless the user separately approves deployment.

## No-Change Confirmations

- No Supabase writes.
- No production user_districts rows created or modified.
- No schema changes.
- No seed changes.
- No migration changes.
- No districts changes.
- No officials_for_user changes.
- No deployment.
- No API write guard change.
- No src/lib/officials.ts changes.
- No CurrentOfficialsSection changes.
- No At-Large row rename, delete, replace, or repurpose.
- All-five County Commission At-Large expansion was not restored.

## Risk Check

Scope: Documentation package for future single test-account write approval only.

Result: No runtime behavior changes.

No-change: Write guard remains false. Supabase remains unchanged. App code remains unchanged.

Test: Documentation review only. No live write test performed.

## Next Step

User should review and explicitly provide or approve the exact test-account details before any future Gate 14 test-write preparation.
