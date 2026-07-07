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
Completed by web source review on 2026-07-07.

Purpose:
Record fresh official-source verification before any County Commission District 1 through District 5 implementation work.

Required source checks:

| District / page | Expected official name or purpose | Official source URL | Resolves? | Name still matches? | Verified by | Verified date | Notes |
|---|---|---|---|---|---|---|---|
| District 1 official page | James Clasby | https://www.stlucieco.gov/departments-and-services/board-of-county-commissioners/district-1-james-clasby | Yes | Yes | ChatGPT web source review | 2026-07-07 | Official page shows District 1: James Clasby. |
| District 2 official page | Larry Leet | https://www.stlucieco.gov/departments-and-services/board-of-county-commissioners/district-2-larry-leet | Yes | Yes | ChatGPT web source review | 2026-07-07 | Official page shows District 2: Larry Leet, Vice Chair. |
| District 3 official page | Erin Lowry | https://www.stlucieco.gov/departments-and-services/board-of-county-commissioners/district-3-erin-lowry | Yes | Yes | ChatGPT web source review | 2026-07-07 | Official page shows District 3: Erin Lowry. |
| District 4 official page | Jamie Fowler | https://www.stlucieco.gov/departments-and-services/board-of-county-commissioners/district-4-jamie-fowler-chair | Yes | Yes | ChatGPT web source review | 2026-07-07 | Official page shows District 4: Jamie Fowler, Chair. |
| District 5 official page | Cathy Townsend | https://www.stlucieco.gov/departments-and-services/board-of-county-commissioners/district-5-cathy-townsend | Yes | Yes | ChatGPT web source review | 2026-07-07 | Official page shows District 5: Cathy Townsend. |
| BOCC overview page | Lists Board of County Commissioners by District 1 through District 5 | https://www.stlucieco.gov/government/county-commissioners/st-lucie-county-board-of-county-commissioners-bocc | Yes | Yes | ChatGPT web source review | 2026-07-07 | Official county pages show District 1 through District 5 commissioner links. |

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
Passed by web source review on 2026-07-07. This does not authorize implementation.

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


## Gate 2 district row design worksheet

Status:
Proposed only. Not approved for implementation.

Purpose:
Record the proposed district row design for future County Commission District 1 through District 5 rows before any SQL is drafted.

Repo pattern reviewed:

- Existing district table pattern uses `districts.name`, `districts.type`, `districts.city`, and `districts.state`.
- Existing app-facing county row is `St. Lucie County Commission At-Large`.
- Existing app-facing county row uses `type = county`.
- Existing app-facing county row uses `city = Port St. Lucie` and `state = FL`.
- Existing app-facing district rows use fixed UUIDs.
- The At-Large row remains retained and unchanged.

Proposed future district rows:

| Proposed name | Proposed type | Proposed city | Proposed state | Proposed fixed UUID | Status |
|---|---|---|---|---|---|
| St. Lucie County Commission District 1 | county | Port St. Lucie | FL | 11111111-0000-0000-0000-000000000031 | Proposed only |
| St. Lucie County Commission District 2 | county | Port St. Lucie | FL | 11111111-0000-0000-0000-000000000032 | Proposed only |
| St. Lucie County Commission District 3 | county | Port St. Lucie | FL | 11111111-0000-0000-0000-000000000033 | Proposed only |
| St. Lucie County Commission District 4 | county | Port St. Lucie | FL | 11111111-0000-0000-0000-000000000034 | Proposed only |
| St. Lucie County Commission District 5 | county | Port St. Lucie | FL | 11111111-0000-0000-0000-000000000035 | Proposed only |

Proposed storage path:
One-time Supabase SQL only, after Gate 3 app behavior review and explicit approval.

Do not modify:

- seed docs
- SQL migration files
- schema files
- app code
- existing At-Large row

Gate 2 open decision:
Mike must explicitly approve the proposed names, type, city/state values, fixed UUIDs, and one-time Supabase SQL path before Gate 4 SQL is drafted.

Gate 2 result:
Pending explicit approval.

No implementation authorization:
This worksheet does not approve SQL, schema changes, app code changes, seed changes, migration changes, Supabase data changes, current_officials inserts, or At-Large rename/delete.

### Gate 2: Confirm district row design

Before adding rows, explicitly approve:

- exact district names
- district type/scope value
- city/state values
- whether IDs are fixed UUIDs or generated UUIDs
- whether rows belong in seed docs, migration SQL, or one-time Supabase SQL

Stop before writing SQL if any naming or type decision is unresolved.


## Gate 3 app behavior review worksheet

Status:
Reviewed. Blocked pending app/data behavior decision.

Purpose:
Record how future County Commission District 1 through District 5 rows would interact with onboarding, user district assignment, ballot filtering, and Current Officials display.

Files and database behavior reviewed:

- `src/app/onboarding/zip/page.tsx`
- `src/lib/candidates.ts`
- `src/lib/officials.ts`
- `src/components/CurrentOfficialsSection.tsx`
- `officials_for_user` view definition in the schema addendum
- `ballot_for_user` behavior in the schema

Findings:

1. Onboarding district assignment:
   - `src/app/onboarding/zip/page.tsx` hardcodes `ALL_PSL_DISTRICTS`.
   - Current PSL users are assigned to the existing `St. Lucie County Commission At-Large` row.
   - Proposed County Commission District 1 through District 5 rows are not currently assigned by onboarding.

2. Current Officials source:
   - `src/lib/officials.ts` reads from `officials_for_user`.
   - `CurrentOfficialsSection` renders whatever `officials_for_user` returns.
   - The UI does not appear to assume only one county official.
   - The UI would likely display five county commissioner cards if the view returned them.
   - Current ordering is by official name, not jurisdiction or district number.

3. `officials_for_user` dependency:
   - The view joins `user_districts` to `current_officials` using exact `district_id`.
   - A current official appears for a user only when the user has the same `district_id` in `user_districts`.

4. Ballot and candidate filtering:
   - Candidate filtering reads the user's `user_districts` rows.
   - `ballot_for_user` also depends on `user_districts`.
   - Adding District 1 through District 5 rows to `user_districts` could affect ballot/candidate/measure visibility if future rows share `type = county`.

Gate 3 blocker:

Adding County Commission District 1 through District 5 rows and inserting `current_officials` rows would not be sufficient by itself. Users would not see those officials unless one of these future behavior decisions is approved:

- add District 1 through District 5 rows to `user_districts` for relevant users;
- change onboarding to assign those rows;
- change `officials_for_user` or Current Officials logic to include county commissioner districts without adding them to ballot-facing user district assignment;
- create another approved mapping approach that keeps countywide ballot context separate from district-specific Current Officials display.

Gate 3 result:
Blocked pending explicit app/data behavior decision.

No implementation authorization:
This worksheet does not approve SQL, schema changes, app code changes, seed changes, migration changes, Supabase data changes, current_officials inserts, user_districts changes, ballot behavior changes, or At-Large rename/delete.

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
