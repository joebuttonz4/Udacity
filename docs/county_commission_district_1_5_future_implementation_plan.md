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

## Gate 3 behavior decision recommendation

Status:
B2 selected as the approved Gate 3 behavior model recommendation. Documentation only — implementation is not authorized by this decision.

Scope of this recommendation:
Evaluates the safest behavior model for showing County Commission District 1-5 officials in Current Officials while preserving the St. Lucie County Commission At-Large row unchanged for onboarding, ballot grouping, and county election context. Focuses on Option B first, per explicit request.

### Decision

**B2 is the selected Gate 3 behavior model.** Later, Current Officials display behavior should be adjusted only in `src/lib/officials.ts` (`getOfficialsForUser`) so that users holding the St. Lucie County Commission At-Large row can also see approved County Commission District 1-5 current officials. The global `officials_for_user` database view is not changed under B2, and no rows are added to `user_districts` under B2.

Why B2 is preferred over B1:

- B2 confines the special-case logic to one function (`getOfficialsForUser`), while B1 would rewrite the one `officials_for_user` view that every jurisdiction (city, school_board, state) currently depends on.
- B2 cannot regress the view's existing behavior for the three already-seeded officials (Stephanie Morgan/city, Debbie Hawley/school_board, Toby Overdorf/state) — those reads never change. B1's OR-condition rewrite could not make the same guarantee without careful re-verification of every jurisdiction, not just county.
- B2 matches the existing precedent already in this codebase of keeping fixed district lists in app code (`ALL_PSL_DISTRICTS` in `src/app/onboarding/zip/page.tsx`) rather than in SQL, so the pattern is consistent with how the team already manages this kind of fixed mapping.
- B2 is more easily reversible: removing the widening logic from one TypeScript function fully restores prior behavior, with no view or migration to roll back.

B2 preserves the At-Large row's existing role unchanged: onboarding continues to assign every PSL user to the same At-Large row via `ALL_PSL_DISTRICTS`, `user_districts` continues to hold only the current 5 fixed rows per user, and ballot grouping and county election context via `ballot_for_user` continue to key off the At-Large row exactly as they do today. B2 avoids changing the global `officials_for_user` view — that view's join condition (`co.district_id = ud.district_id` in Reference Files/civicmarket_schema_addendum_officials_reviews.sql:132) stays as-is. B2 avoids adding District 1-5 rows to `user_districts` — no new district assignment is written for any user under this model.

### 1. Current blocker summary

`officials_for_user` (Reference Files/civicmarket_schema_addendum_officials_reviews.sql) joins `user_districts.district_id = current_officials.district_id` on exact equality only. There is no grouping, parent, or "represents" concept on `districts` linking the At-Large row to future District 1-5 rows. Onboarding (`src/app/onboarding/zip/page.tsx`) hardcodes a fixed 5-row `ALL_PSL_DISTRICTS` list that assigns every PSL user the same At-Large row (id `11111111-0000-0000-0000-000000000003`) and never touches District 1-5. Result: even after District 1-5 rows and their `current_officials` rows are seeded, no user would see them, because no user's `user_districts` rows would ever exact-match a District 1-5 `district_id`.

### 2. Option B expected behavior

Do not add District 1-5 rows to `user_districts` (onboarding, `ALL_PSL_DISTRICTS`, and existing user assignments stay exactly as they are today). Instead, widen the read path so that a user holding the At-Large county row also sees the five District 1-5 `current_officials` rows. Two sub-approaches were evaluated; **B2 is selected** (see Decision above):

- **B1 — view-level widening (not selected).** Rewrite `officials_for_user` so the join is `co.district_id = ud.district_id OR (ud.district_id = '<At-Large id>' AND co.district_id IN (<District 1-5 ids>))`. Narrowest data-layer change, but it is a `CREATE OR REPLACE VIEW` touching the one view every jurisdiction (city, school_board, state) currently depends on — any error in the OR condition risks a regression across all three already-seeded officials (Stephanie Morgan, Debbie Hawley, Toby Overdorf), not just county.
- **B2 — app-level widening (selected).** Leave the view untouched. In `src/lib/officials.ts` (`getOfficialsForUser`), after the normal query, detect that the result set (or the user's `user_districts`) includes the At-Large id and issue a second read for `current_officials` rows with `district_id IN (<District 1-5 ids>)`, merging results before returning. Confines the special case to one function, matches the existing precedent of hardcoded district lists living in app code (`ALL_PSL_DISTRICTS`), and cannot regress the view's behavior for other jurisdiction levels. Tradeoff: District 1-5 ids get hardcoded in a second place (already hardcoded once in the Gate 2 worksheet's proposed UUIDs), so the two lists must be kept in sync manually.

### 3. Files, views, or functions that would likely need review later

- `src/lib/officials.ts` — `getOfficialsForUser`; this is the only function expected to change under B2
- `Reference Files/civicmarket_schema_addendum_officials_reviews.sql` — `officials_for_user` view; reviewed and confirmed it stays unchanged under B2, kept here as reference only
- `src/components/CurrentOfficialsSection.tsx` — rendering/sort order only; `jurisdiction_level`/`district_name` fields already exist and already render, so no code change is expected here, but visual review is warranted once 5 extra county cards can appear (see Risks)
- `src/app/onboarding/zip/page.tsx` (`ALL_PSL_DISTRICTS`) — confirm it is NOT modified; B2 does not touch onboarding
- `src/lib/candidates.ts` (`getUserDistrictIds`, `getCandidatesForDistricts`) — confirm NOT affected; B2 does not touch `user_districts`
- `ballot_for_user` view in `Reference Files/civicmarket_schema_v4.sql` — confirm NOT affected; no candidates/elections rows would reference District 1-5 ids under this plan
- `docs/current_officials_sql_plan.md` and `docs/current_officials_verified_source_checklist.md` — reuse the same gated SQL-drafting pattern already used for the 3 seeded officials when District 1-5 rows eventually reach Gate 4

### 4. Risks

1. B2 hardcodes District 1-5 ids a second time (alongside the Gate 2 worksheet's proposed UUIDs); the two lists can drift if one is edited without the other.
2. Five county commissioner cards surfacing for every At-Large-holding user is a UI density change — Gate 3's own stop condition warns against "confusing duplicate county assignments." `district_name` already differentiates cards, but this should be visually re-verified once real rows exist, not assumed safe from code reading alone.
3. `is_on_next_ballot` accuracy per District 1-5 seat is a separate data-correctness question, independent of the widening mechanism, and still requires an official source per the project's non-negotiable `source_url` rule.
4. B2 is necessarily sequenced after Gate 2's district UUIDs and Gate 4/5/6 SQL approval for both the district rows and their `current_officials` rows — there is nothing to query until those exist.

### 5. Test plan (for whenever Gate 4-7 execution eventually happens)

- Regression: existing seeded officials (Stephanie Morgan/city, Debbie Hawley/school_board, Toby Overdorf/state) still appear correctly for their test users after the `getOfficialsForUser` change — no city/school_board/state regression, and no change at all to `officials_for_user`.
- New behavior: a user whose only county `user_districts` row is At-Large sees exactly the 5 District 1-5 officials (once seeded) in Current Officials.
- Isolation: `/onboarding/zip` behavior, `ALL_PSL_DISTRICTS`, `user_districts` row count for a test user, and `ballot_for_user` output are diffed before/after — expect zero change in all four.
- Duplicate/confusion check: manually verify the 5 commissioner cards render distinctly (name + "District N" via `district_name`) and do not read as unexplained duplicates of the At-Large assignment.
- Negative check: a user with no county row at all still sees zero county officials.
- Rollback check: reverting the `getOfficialsForUser` change cleanly restores pre-District-1-5 behavior with no data loss, since `current_officials` rows are additive-only and the view was never touched.

### 6. Explicit hard stops before implementation

- Do not implement the B2 `getOfficialsForUser` change until Gate 2's exact district UUIDs and a Gate 4 SQL draft are explicitly approved.
- Do not change the global `officials_for_user` view — B2 explicitly avoids this.
- Do not assign District 1-5 rows to `user_districts` — B2 explicitly avoids this, and doing so would silently become a different option and reopen the ballot/candidate-filtering risk this option is designed to avoid.
- Do not touch `ballot_for_user`, `src/lib/candidates.ts`, or `src/app/onboarding/zip/page.tsx` as part of this work.
- Do not seed District 1-5 `current_officials` rows before Gate 4/5/6 approval.
- Do not rename, delete, or replace the At-Large row.
- No schema, app code, seed, SQL migration, Supabase data, `current_officials` inserts, `user_districts` changes, or At-Large changes are authorized by this documentation update — this is a decision record only.

Gate 3 behavior decision recommendation result:
B2 selected and documented. Implementation remains blocked until Gate 4 SQL draft and explicit Gate 5 approval.

## Gate 4 district row SQL draft

Status:
DRAFT ONLY. NOT APPROVED FOR EXECUTION.

Purpose:
Draft the SQL that would insert the five St. Lucie County Commission District 1-5 rows into `districts` only, for review before any Gate 5 approval. This draft covers `districts` insertion only — it intentionally does not include `current_officials` inserts, `user_districts` inserts, or any At-Large row change, per the Gate 3 B2 decision and the hard stops below.

Scope of this draft:

- `districts` table insert for the five rows proposed in the Gate 2 design worksheet.
- Preflight check for existing ids or names.
- Post-insert verification.

Explicitly out of scope for this draft (deferred to a later Gate 4 draft, after B2's `getOfficialsForUser` design is finalized):

- `current_officials` inserts for James Clasby, Larry Leet, Erin Lowry, Jamie Fowler, Cathy Townsend.
- Any `user_districts` change.
- Any At-Large row change.

### Preflight check (run first, read-only)

```sql
-- Gate 4 preflight — DRAFT ONLY, NOT APPROVED FOR EXECUTION
-- Confirms none of the five proposed ids or names already exist in districts.
-- Expect 0 rows back. If any row is returned, STOP and do not run the insert below.

SELECT id, name, type, city, state
FROM districts
WHERE id IN (
  '11111111-0000-0000-0000-000000000031',
  '11111111-0000-0000-0000-000000000032',
  '11111111-0000-0000-0000-000000000033',
  '11111111-0000-0000-0000-000000000034',
  '11111111-0000-0000-0000-000000000035'
)
OR name IN (
  'St. Lucie County Commission District 1',
  'St. Lucie County Commission District 2',
  'St. Lucie County Commission District 3',
  'St. Lucie County Commission District 4',
  'St. Lucie County Commission District 5'
);
```

### Districts insert (districts only — no current_officials, no user_districts, no At-Large change)

```sql
-- Gate 4 districts insert — DRAFT ONLY, NOT APPROVED FOR EXECUTION
-- Requires explicit Gate 5 approval before this is run in Supabase.
-- Inserts the five County Commission District 1-5 rows into districts only.
-- Does not touch current_officials, user_districts, or the At-Large row
-- (11111111-0000-0000-0000-000000000003, unchanged and not referenced here).

INSERT INTO districts (id, name, type, city, state) VALUES
  ('11111111-0000-0000-0000-000000000031', 'St. Lucie County Commission District 1', 'county', 'Port St. Lucie', 'FL'),
  ('11111111-0000-0000-0000-000000000032', 'St. Lucie County Commission District 2', 'county', 'Port St. Lucie', 'FL'),
  ('11111111-0000-0000-0000-000000000033', 'St. Lucie County Commission District 3', 'county', 'Port St. Lucie', 'FL'),
  ('11111111-0000-0000-0000-000000000034', 'St. Lucie County Commission District 4', 'county', 'Port St. Lucie', 'FL'),
  ('11111111-0000-0000-0000-000000000035', 'St. Lucie County Commission District 5', 'county', 'Port St. Lucie', 'FL');
```

### Post-insert verification (run only after the insert above is separately approved and executed)

```sql
-- Gate 4 post-insert verification — DRAFT ONLY, NOT APPROVED FOR EXECUTION
-- Expect exactly 5 rows, matching the ids/names/type/city/state above.

SELECT id, name, type, city, state
FROM districts
WHERE id IN (
  '11111111-0000-0000-0000-000000000031',
  '11111111-0000-0000-0000-000000000032',
  '11111111-0000-0000-0000-000000000033',
  '11111111-0000-0000-0000-000000000034',
  '11111111-0000-0000-0000-000000000035'
)
ORDER BY name;

-- Also confirm the At-Large row is unchanged (expect exactly 1 row, unaltered).
SELECT id, name, type, city, state
FROM districts
WHERE id = '11111111-0000-0000-0000-000000000003';
```

### Rollback note

If a rollback is ever needed after this draft is approved and run, the only reversible action documented here is deleting the five rows above by exact id:

```sql
-- Rollback (only if Gate 5-approved insert above was run and needs reversal) — DRAFT ONLY
DELETE FROM districts
WHERE id IN (
  '11111111-0000-0000-0000-000000000031',
  '11111111-0000-0000-0000-000000000032',
  '11111111-0000-0000-0000-000000000033',
  '11111111-0000-0000-0000-000000000034',
  '11111111-0000-0000-0000-000000000035'
);
```
This rollback is safe only as long as no `current_officials`, `user_districts`, or other row has been created referencing these five ids. If any such row exists by the time a rollback is considered, that dependency must be resolved first.

### Gate 4 district row SQL draft — status and approval requirement

**This SQL is DRAFT ONLY and NOT APPROVED FOR EXECUTION.**

Explicit Gate 5 approval from Mike is required — stating the approved district row names, approved district IDs, and approved SQL draft — before any statement in this section is run in Supabase. No SQL in this section has been executed. No Supabase data has been modified by this documentation update.

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

## Gate 5 approval checklist

Status:
Pending explicit approval. Not approved by this documentation update.

Purpose:
Record the checklist that must be satisfied, item by item, before the Gate 4 districts-only SQL draft (see "Gate 4 district row SQL draft" above) may be run in Supabase. This checklist covers approval only — no item on it authorizes running SQL by itself.

Checklist:

1. Gate 4 SQL draft reviewed — the preflight SELECT, the `districts` INSERT, the post-insert verification, and the rollback note in "Gate 4 district row SQL draft" have been read and reviewed as drafted.
2. Preflight SELECT must be run first in Supabase SQL Editor — the Gate 4 preflight check (matching on the five ids or the five names) must be executed before the INSERT is considered.
3. Preflight must return zero conflicts for the five IDs and names — if the preflight returns any row, execution stops and does not proceed to the INSERT.
4. SQL execution is limited to `districts` INSERT only — no other statement from this plan (current_officials, user_districts, or any At-Large statement) is approved for execution alongside it.
5. No `current_officials` inserts approved — District 1-5 current officials (James Clasby, Larry Leet, Erin Lowry, Jamie Fowler, Cathy Townsend) remain unseeded; this checklist does not approve them.
6. No `user_districts` changes approved — no user is assigned to any District 1-5 row by this checklist, consistent with the Gate 3 B2 decision.
7. No At-Large rename, delete, replace, or repurpose approved — the St. Lucie County Commission At-Large row (`11111111-0000-0000-0000-000000000003`) is untouched by this checklist.
8. No schema/app/seed/migration changes approved — this checklist covers a one-time `districts` data INSERT only, not a schema or code change.
9. Post-insert verification must return exactly five District 1-5 rows — the Gate 4 post-insert verification SELECT must confirm exactly 5 matching rows before Gate 5 can be considered satisfied.
10. At-Large row must remain unchanged — the Gate 4 post-insert verification's At-Large check must return the same single row, unaltered.
11. Gate 6 Supabase execution requires Mike's explicit approval after this checklist is reviewed — satisfying items 1-10 documents readiness only; it does not itself constitute approval to run SQL.

Gate 5 approval checklist result:
Pending explicit approval. Not approved by this documentation update.

### Gate 5: Manual approval

Implementation requires explicit approval from Mike before any SQL is run.

Approval must state:

- approved district row names
- approved district IDs
- approved current official names
- approved source URLs
- approved SQL draft

## Gate 6 execution result

Status:
Complete and passed.

Date:
2026-07-07.

Scope:
Supabase data insert into the `districts` table only, per Mike's explicit Gate 5 approval and the Gate 4 districts-only SQL draft above.

Result:

- Preflight SELECT returned 0 conflicts for the five County Commission District 1-5 ids and names.
- INSERT added exactly 5 rows to `districts`: St. Lucie County Commission District 1 through District 5 (ids `...031` through `...035`, type `county`, city `Port St. Lucie`, state `FL`).
- Post-insert verification returned exactly the 5 approved rows.
- St. Lucie County Commission At-Large row (id `11111111-0000-0000-0000-000000000003`) confirmed unchanged before and after — name, type, city, and state all identical.
- No `current_officials` inserts were made. No County Commission District 1-5 current officials exist as a result of this Gate 6 action.
- No `user_districts` changes were made.
- No schema changes, app code changes, seed file changes, or SQL migration changes were made.
- No At-Large rename, delete, replace, or repurpose occurred.
- Repo working tree remained clean after Supabase execution — this was a Supabase-only data change.

What exists now:
Five County Commission District 1-5 rows exist in `districts` in Supabase. Nothing references them yet — no `current_officials` rows, no `user_districts` rows, and no app code reads them. They are inert until the approved B2 work (`getOfficialsForUser` widening) and District 1-5 `current_officials` rows are completed in a later, separately approved step.

Current Officials status:
Current Officials display for County Commission District 1-5 remains blocked. It stays blocked until (a) the approved B2 app behavior work in `src/lib/officials.ts` is implemented, and (b) District 1-5 `current_officials` rows are drafted, approved, and inserted through their own future gate sequence. This is a data/behavior availability gap, not an app bug.

Gate 7 status:
Pending UI/app verification. Not started by this update.

### Gate 6: Supabase execution

Only after explicit approval:

- run pre-check queries
- run approved SQL
- run post-check queries
- verify exact row counts
- verify no At-Large row was changed
- verify no existing current_officials rows were altered

## Gate 7 verification plan

Status:
Limited (data-layer) verification complete and passed, 2026-07-07 — see "Gate 7 limited verification result" below. Full UI verification remains not applicable yet.

Purpose:
Define what can be verified right now, after the Gate 6 `districts`-only insert, and separate it clearly from the UI verification that only becomes possible once the approved B2 `getOfficialsForUser` work and District 1-5 `current_officials` rows exist (a later, separately approved step).

Why this is "limited verification pending" and not a full Gate 7 pass:
There is no Current Officials UI to check yet for County Commission District 1-5. `officials_for_user` still joins on exact `district_id` equality, no `current_officials` rows exist for District 1-5, and no `user_districts` row points at a District 1-5 id. Under the approved Gate 3 B2 model this is expected, not a bug — Home and Profile should look exactly as they did before Gate 6, with zero County Commission District 1-5 cards, for every user.

### What can be verified now (data-layer only)

1. Supabase `districts` table contains exactly the five District 1-5 rows.
2. The At-Large row still exists and remains unchanged (id, name, type, city, state identical to before Gate 6).
3. No County Commission `current_officials` rows exist as a result of Gate 6.
4. No `user_districts` rows were added for any of the five District 1-5 ids.
5. Current Officials UI (Home and Profile) should not be expected to show any County Commission District 1-5 officials yet, for any user — this is the correct, expected state, not something to fix.

### Verification SQL (read-only — for reference; not executed by this documentation update)

```sql
-- 1. Confirm five District 1-5 rows exist. Expect exactly 5 rows.
SELECT id, name, type, city, state
FROM districts
WHERE id IN (
  '11111111-0000-0000-0000-000000000031',
  '11111111-0000-0000-0000-000000000032',
  '11111111-0000-0000-0000-000000000033',
  '11111111-0000-0000-0000-000000000034',
  '11111111-0000-0000-0000-000000000035'
)
ORDER BY name;
```

```sql
-- 2. Confirm At-Large row exists and is unchanged. Expect exactly 1 row:
-- St. Lucie County Commission At-Large | county | Port St. Lucie | FL
SELECT id, name, type, city, state
FROM districts
WHERE id = '11111111-0000-0000-0000-000000000003';
```

```sql
-- 3. Confirm no current_officials rows exist for the five District 1-5 ids.
-- Expect 0 rows, unless a future gate has explicitly approved and seeded them.
SELECT id, name, office, district_id
FROM current_officials
WHERE district_id IN (
  '11111111-0000-0000-0000-000000000031',
  '11111111-0000-0000-0000-000000000032',
  '11111111-0000-0000-0000-000000000033',
  '11111111-0000-0000-0000-000000000034',
  '11111111-0000-0000-0000-000000000035'
);
```

```sql
-- 4. Confirm no user_districts rows exist for the five District 1-5 ids.
-- Expect 0 rows. Any row here would indicate an unapproved deviation from Gate 3 B2.
SELECT user_id, district_id, scope
FROM user_districts
WHERE district_id IN (
  '11111111-0000-0000-0000-000000000031',
  '11111111-0000-0000-0000-000000000032',
  '11111111-0000-0000-0000-000000000033',
  '11111111-0000-0000-0000-000000000034',
  '11111111-0000-0000-0000-000000000035'
);
```

### What cannot be verified yet (deferred to a later, separately approved Gate 7 pass)

- Home page Current Officials section showing District 1-5 officials — not applicable; no `current_officials` rows exist for them yet.
- Profile page Current Officials section showing District 1-5 officials — not applicable, same reason.
- At-Large not showing as an individual commissioner — not testable in isolation yet, since no District 1-5 officials exist to compare against.
- District 1-5 officials displaying clearly and without duplicate/confusing entries — depends on the B2 `getOfficialsForUser` widening being implemented first, which is not yet approved or built.

Gate 7 verification plan result:
Limited verification pending. Items 1-4 above (data-layer checks) can be run now, read-only, against Supabase. Full UI verification remains blocked until the B2 app behavior work and District 1-5 `current_officials` rows are implemented and approved through their own future gate sequence.

### Gate 7 limited verification result

Status:
Complete and passed.

Date:
2026-07-07.

Scope:
Read-only Supabase verification only — the four data-layer checks defined above. Only SELECT queries were run. No Supabase writes were performed.

Results:

1. District 1-5 rows exist — PASS, 5 rows found (all five ids, correct name/type/city/state).
2. At-Large unchanged — PASS, 1 row found for id `11111111-0000-0000-0000-000000000003` with name St. Lucie County Commission At-Large.
3. No `current_officials` rows for District 1-5 — PASS, 0 rows found.
4. No `user_districts` rows for District 1-5 — PASS, 0 rows found.
5. No unexpected rows appeared in any check.

No app code, schema, seed file, SQL migration, `current_officials`, `user_districts`, or At-Large changes were made by this verification. Repo working tree remained clean throughout.

Current Officials UI status:
UI verification (Home page, Profile page, District 1-5 officials displaying clearly, no duplicate/confusing entries) remains not applicable — it stays deferred until the approved B2 `getOfficialsForUser` widening is implemented and District 1-5 `current_officials` rows are seeded, both through their own future, separately approved gate sequence. County Commission District 1-5 officials remain blocked from Current Officials display for now.

Gate 7 limited verification result:
Complete and passed for the data-layer scope defined above. Full Gate 7 UI verification remains pending and blocked on future B2/`current_officials` work.

### Gate 7: UI verification

Status:
Pending. Not started — there is no UI to verify yet, since no `current_officials` rows or `getOfficialsForUser` changes exist for County Commission District 1-5.

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
