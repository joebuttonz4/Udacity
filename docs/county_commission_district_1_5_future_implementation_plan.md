# County Commission District 1-5 Future Implementation Plan

Date: July 6, 2026

## Scope

Documentation-only planning for a future Option C implementation.

No schema changes, app code changes, seed changes, SQL migration changes, Supabase data changes, current_officials inserts, district renames, or district deletes are approved by this document.

## Background

The County Commission district model review recommends Option C:

1. Retain the existing St. Lucie County Commission At-Large row for countywide onboarding, ballot grouping, and county election context.
2. Add separate St. Lucie County Commission District 1 through District 5 rows later for Current Officials mapping only after explicit approval.

Reference:
- docs/county_commission_district_model_review.md

## Existing app-facing row to retain

Do not rename, delete, or replace this row:

- id: 11111111-0000-0000-0000-000000000003
- name: St. Lucie County Commission At-Large
- scope/type: county
- current purpose: onboarding district assignment, ballot grouping, county election context

## Proposed future district rows

Do not create these yet. Names are proposed for future approval only:

- St. Lucie County Commission District 1
- St. Lucie County Commission District 2
- St. Lucie County Commission District 3
- St. Lucie County Commission District 4
- St. Lucie County Commission District 5

## Proposed future Current Officials mapping

Do not seed these yet. Mapping must be verified again before SQL is drafted:

- District 1: James Clasby
- District 2: Larry Leet
- District 3: Erin Lowry
- District 4: Jamie Fowler
- District 5: Cathy Townsend


## Gate 1 re-verification worksheet

Status:
Not completed.

Purpose:
Record fresh official-source verification before any County Commission District 1 through District 5 implementation work.

Required source checks:

| District / page | Expected official name or purpose | Official source URL | Resolves? | Name still matches? | Verified by | Verified date | Notes |
|---|---|---|---|---|---|---|---|
| District 1 official page | James Clasby | https://www.stlucieco.gov/departments-and-services/board-of-county-commissioners/district-1-james-clasby | Pending | Pending | | | |
| District 2 official page | Larry Leet | https://www.stlucieco.gov/departments-and-services/board-of-county-commissioners/district-2-larry-leet | Pending | Pending | | | |
| District 3 official page | Erin Lowry | https://www.stlucieco.gov/departments-and-services/board-of-county-commissioners/district-3-erin-lowry | Pending | Pending | | | |
| District 4 official page | Jamie Fowler | https://www.stlucieco.gov/departments-and-services/board-of-county-commissioners/district-4-jamie-fowler-chair | Pending | Pending | | | |
| District 5 official page | Cathy Townsend | https://www.stlucieco.gov/departments-and-services/board-of-county-commissioners/district-5-cathy-townsend | Pending | Pending | | | |
| BOCC overview page | Lists Board of County Commissioners by District 1 through District 5 | https://www.stlucieco.gov/government/county-commissioners/st-lucie-county-board-of-county-commissioners-bocc | Pending | Pending | | | |

Gate 1 pass criteria:

- All six official source URLs resolve.
- District 1 through District 5 pages still show the expected commissioner names.
- BOCC overview page still supports the District 1 through District 5 model.
- No source redirects unexpectedly.
- No source conflicts with the proposed Current Officials mapping.

Gate 1 fail / stop criteria:

- Any page is missing.
- Any page redirects unexpectedly.
- Any commissioner name differs from the proposed mapping.
- BOCC overview no longer supports the District 1 through District 5 model.
- Any source cannot be verified from an official St. Lucie County government page.

Gate 1 result:
Pending.

No implementation authorization:
This worksheet does not approve SQL, schema changes, app code changes, seed changes, migration changes, Supabase data changes, current_officials inserts, or At-Large rename/delete.

## Required approval gates before implementation

### Gate 1: Confirm official source references

Verify all five official St. Lucie County commissioner pages still resolve and still show the same commissioner names.

Required source checks:

- District 1 official page
- District 2 official page
- District 3 official page
- District 4 official page
- District 5 official page
- BOCC overview page

Stop if any source is missing, redirected unexpectedly, or inconsistent.

### Gate 2: Confirm district row design

Before adding rows, explicitly approve:

- exact district names
- district type/scope value
- city/state values
- whether IDs are fixed UUIDs or generated UUIDs
- whether rows belong in seed docs, migration SQL, or one-time Supabase SQL

Stop before writing SQL if any naming or type decision is unresolved.

### Gate 3: Confirm app behavior

Before adding rows, inspect whether adding District 1 through District 5 rows will affect:

- onboarding district display
- user_districts assignment
- ballot grouping
- officials_for_user output
- Current Officials section display
- county scope filters
- any hardcoded district list

Stop if adding five county district rows would make users see confusing duplicate county assignments.

### Gate 4: Draft SQL only

After Gates 1 through 3 pass, draft SQL for review only.

The SQL draft should include:

- district row insert/upsert plan
- current_officials row insert plan
- duplicate checks
- source_url checks
- rollback notes
- verification queries

Do not run SQL during draft review.

### Gate 5: Manual approval

Implementation requires explicit approval from Mike before any SQL is run.

Approval must state:

- approved district row names
- approved district IDs
- approved current official names
- approved source URLs
- approved SQL draft

### Gate 6: Supabase execution

Only after explicit approval:

- run pre-check queries
- run approved SQL
- run post-check queries
- verify exact row counts
- verify no At-Large row was changed
- verify no existing current_officials rows were altered

### Gate 7: UI verification

After data changes only:

- verify Home page Current Officials section
- verify Profile page Current Officials section
- verify At-Large does not show as an individual commissioner
- verify District 1 through District 5 officials display clearly
- verify no duplicate or confusing County Commission entries appear

## Hard stops

Stop before:

- schema changes
- app code changes
- seed changes
- SQL migration changes
- Supabase data changes
- current_officials inserts
- deleting At-Large
- renaming At-Large
- replacing At-Large
- assigning individual commissioners to the At-Large row

## Risk Check

Scope:
Future County Commission District 1-5 implementation planning only.

Result if implemented later:
CivicMarket can retain countywide election context while mapping Current Officials to official county commissioner districts.

No-change risk:
County Commission current officials remain blocked.

Change risk:
Adding five county district rows could affect onboarding, user assignment, county filters, ballot grouping, or Current Officials display if not isolated and verified.

Test status:
No runtime testing. Documentation-only planning.
