# County Commission Current Officials — Gate B SQL Draft

Date: July 7, 2026

Status: **DRAFT ONLY. NOT APPROVED FOR EXECUTION.**

## 1. Scope

Documentation-only SQL draft for future review. This document drafts the `current_officials` INSERT for St. Lucie County Commission District 1-5, for Mike's review only. No SQL in this document has been run. No Supabase write has been performed by creating this document.

This is Gate B of docs/county_commission_current_officials_b2_implementation_plan.md's proposed gate sequence (Gate A — source re-verification, **Gate B — this SQL draft**, Gate C — explicit approval, Gate D — execution).

## 2. Gate A source basis

This draft relies entirely on the passed Gate A verification in docs/county_commission_current_officials_gate_a_source_reverification.md:

- **Status:** Gate A passed by manual browser verification, July 7, 2026.
- **Verified by:** project owner (Mike), via direct manual browser access (not this session's blocked fetch tool).
- **Official source page:** https://www.stlucieco.gov/departments-and-services/board-of-county-commissioners
- **Confirmed names and titles:** James Clasby (District 1), Larry Leet — Vice Chair (District 2), Erin Lowry (District 3), Jamie Fowler — Chair (District 4), Cathy Townsend (District 5).

Gate A did **not** verify term start/end dates or next-election dates for any of the five seats — only the name/district/title mapping and the source page itself were confirmed. This draft treats term dates and `is_on_next_ballot` as unverified accordingly (see Section 5).

## 3. No-change protections

This document makes no changes. Specifically, as of this document:

- No app code was edited.
- No schema was edited.
- No seed file was edited.
- No migration file was edited.
- No Supabase write was performed.
- No `current_officials` row was inserted.
- No `user_districts` row was changed.
- The `officials_for_user` view was not changed.
- The St. Lucie County Commission At-Large row (id `11111111-0000-0000-0000-000000000003`) was not renamed, deleted, replaced, or repurposed.
- Repo working tree before this document was added: clean, on `master`, up to date with `origin/master`, latest commit `8736c9d`.

## 4. Current known district IDs

Confirmed to exist in Supabase `districts` (Gate 6/7 of docs/county_commission_district_1_5_future_implementation_plan.md):

| District | district_id | type | city | state |
|---|---|---|---|---|
| District 1 | `11111111-0000-0000-0000-000000000031` | county | Port St. Lucie | FL |
| District 2 | `11111111-0000-0000-0000-000000000032` | county | Port St. Lucie | FL |
| District 3 | `11111111-0000-0000-0000-000000000033` | county | Port St. Lucie | FL |
| District 4 | `11111111-0000-0000-0000-000000000034` | county | Port St. Lucie | FL |
| District 5 | `11111111-0000-0000-0000-000000000035` | county | Port St. Lucie | FL |

At-Large row, unchanged and not referenced by this draft's INSERT:

- id `11111111-0000-0000-0000-000000000003` — St. Lucie County Commission At-Large

## 5. Proposed current_officials rows

### Schema check — required fields

`current_officials` (Reference Files/civicmarket_schema_addendum_officials_reviews.sql:11-29) has these columns:

| Column | Constraint | This draft's value |
|---|---|---|
| `id` | PK, default `gen_random_uuid()` | auto-generated, not supplied |
| `name` | `NOT NULL` | official name (Section 4 mapping) |
| `office` | `NOT NULL` | `County Commissioner District N` (per this request) |
| `district_id` | FK → `districts(id)`, nullable | one of the five ids in Section 4 |
| `jurisdiction_level` | `NOT NULL` | `county` — see reasoning below |
| `photo_url` | nullable | NULL — not sourced |
| `website` | nullable | NULL — not sourced |
| `bio` | nullable | NULL — not sourced |
| `term_start` | nullable | NULL — not verified by Gate A |
| `term_end` | nullable | NULL — not verified by Gate A |
| `next_election_date` | nullable | NULL — not verified by Gate A |
| `source_url` | `NOT NULL` | `https://www.stlucieco.gov/departments-and-services/board-of-county-commissioners` |
| `source_label` | nullable | `St. Lucie County Board of County Commissioners official page` (descriptive of the source_url only, not a separate factual claim) |
| `candidate_id` | nullable, FK → `candidates(id)` | NULL — no verified candidate match |
| `is_on_next_ballot` | `boolean DEFAULT false` | `false` — see reasoning below |
| `created_at` / `updated_at` | default `now()` | auto-generated, not supplied |

**There is no `status` or `active`/`current` column in this table.** Every row in `current_officials` is implicitly current by virtue of existing in the table; there is no separate status flag to set. This is consistent with the three already-seeded officials (Stephanie Morgan, Debbie Hawley, Toby Overdorf), none of which have a status field either — see docs/current_officials_sql_plan.md.

**`jurisdiction_level = 'county'` reasoning:** This is a required (`NOT NULL`) field with no value specified in this request. It is not guessed — it follows the existing, unbroken repo convention where `jurisdiction_level` mirrors the office's government level: Stephanie Morgan (city council) → `city`, Debbie Hawley (school board) → `school_board`, Toby Overdorf (state representative) → `state` (docs/current_officials_sql_plan.md:54-57). County Commission District 1-5 rows already exist in `districts` with `type = county` (Section 4), matching the At-Large row's own `type = county`. `county` is the only value consistent with this pattern. **This value is proposed for Mike's explicit review and approval at Gate C, not silently assumed.**

**`is_on_next_ballot = false` reasoning:** Gate A verified names and titles only, not term dates or election calendars. Per the project's non-negotiable rule that ballot-related data requires an official item-specific source, and following the identical precedent set for the three already-seeded officials (docs/current_officials_sql_plan.md:67, "false — see Section 6 decision: no official election source has verified next-ballot status"), this draft defaults `is_on_next_ballot` to `false` for all five rows rather than guess. **If any District 1-5 seat is actually up for election on the next PSL ballot, that must be independently verified from an official election source before this value is changed — not assumed from this draft.**

### Proposed rows

| District | name | office | district_id | jurisdiction_level | source_url | source_label | candidate_id | is_on_next_ballot |
|---|---|---|---|---|---|---|---|---|
| 1 | James Clasby | County Commissioner District 1 | `...031` | county | stlucieco.gov BOCC page | St. Lucie County Board of County Commissioners official page | NULL | false |
| 2 | Larry Leet | County Commissioner District 2 | `...032` | county | stlucieco.gov BOCC page | St. Lucie County Board of County Commissioners official page | NULL | false |
| 3 | Erin Lowry | County Commissioner District 3 | `...033` | county | stlucieco.gov BOCC page | St. Lucie County Board of County Commissioners official page | NULL | false |
| 4 | Jamie Fowler | County Commissioner District 4 | `...034` | county | stlucieco.gov BOCC page | St. Lucie County Board of County Commissioners official page | NULL | false |
| 5 | Cathy Townsend | County Commissioner District 5 | `...035` | county | stlucieco.gov BOCC page | St. Lucie County Board of County Commissioners official page | NULL | false |

Note: Gate A verified Vice Chair (District 2) and Chair (District 4) as additional titles on the official page. Per this request's specified office wording (`County Commissioner District N` for all five, uniformly), the Vice Chair/Chair distinction is not included in the `office` value. This is a wording choice, not a source conflict — flag to Mike at Gate C if the Vice Chair/Chair distinction should instead be reflected in `office` (e.g. `County Commissioner District 2, Vice Chair`).

## 6. Preflight SELECT queries (read-only — review only, not executed)

```sql
-- Gate B preflight 1 — confirm the five District 1-5 rows exist in districts.
-- Expect exactly 5 rows.
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
-- Gate B preflight 2 — confirm the At-Large row remains unchanged.
-- Expect exactly 1 row: St. Lucie County Commission At-Large | county | Port St. Lucie | FL.
SELECT id, name, type, city, state
FROM districts
WHERE id = '11111111-0000-0000-0000-000000000003';
```

```sql
-- Gate B preflight 3 — confirm no current_officials rows already exist for District 1-5.
-- Expect 0 rows. If any row is returned, STOP and do not run the INSERT below.
SELECT id, name, office, district_id, jurisdiction_level, source_url, is_on_next_ballot
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
-- Gate B preflight 4 — confirm no user_districts rows exist for District 1-5.
-- Expect 0 rows, consistent with the Gate 3 B2 decision (District 1-5 is never
-- assigned to user_districts under B2).
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

```sql
-- Gate B preflight 5 — confirm current_officials columns match this draft's INSERT.
-- Expect: id, name, office, district_id, jurisdiction_level, photo_url, website,
-- bio, term_start, term_end, next_election_date, source_url, source_label,
-- candidate_id, is_on_next_ballot, created_at, updated_at.
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'current_officials'
ORDER BY ordinal_position;
```

## 7. Draft INSERT SQL

**DO NOT RUN WITHOUT MIKE'S EXPLICIT APPROVAL.**

```sql
-- Gate B current_officials INSERT — DRAFT ONLY, NOT APPROVED FOR EXECUTION
-- DO NOT RUN WITHOUT MIKE'S EXPLICIT APPROVAL.
--
-- Inserts 5 St. Lucie County Commission District 1-5 current_officials rows.
-- Source basis: Gate A manual browser verification, July 7, 2026, of
-- https://www.stlucieco.gov/departments-and-services/board-of-county-commissioners
--
-- jurisdiction_level = 'county' follows existing repo convention (see Section 5).
-- is_on_next_ballot = false for all 5 rows — no official election-date source
-- has verified next-ballot status for any District 1-5 seat (see Section 5).
-- term_start, term_end, next_election_date, photo_url, website, bio, and
-- candidate_id are NULL for all 5 rows — none of these were verified by Gate A.
--
-- Does not touch districts, user_districts, officials_for_user, or the
-- At-Large row (11111111-0000-0000-0000-000000000003, unchanged and not
-- referenced here).

INSERT INTO current_officials (
  name,
  office,
  district_id,
  jurisdiction_level,
  photo_url,
  website,
  bio,
  term_start,
  term_end,
  next_election_date,
  source_url,
  source_label,
  candidate_id,
  is_on_next_ballot
) VALUES
  (
    'James Clasby',
    'County Commissioner District 1',
    '11111111-0000-0000-0000-000000000031',
    'county',
    NULL, NULL, NULL, NULL, NULL, NULL,
    'https://www.stlucieco.gov/departments-and-services/board-of-county-commissioners',
    'St. Lucie County Board of County Commissioners official page',
    NULL,
    false
  ),
  (
    'Larry Leet',
    'County Commissioner District 2',
    '11111111-0000-0000-0000-000000000032',
    'county',
    NULL, NULL, NULL, NULL, NULL, NULL,
    'https://www.stlucieco.gov/departments-and-services/board-of-county-commissioners',
    'St. Lucie County Board of County Commissioners official page',
    NULL,
    false
  ),
  (
    'Erin Lowry',
    'County Commissioner District 3',
    '11111111-0000-0000-0000-000000000033',
    'county',
    NULL, NULL, NULL, NULL, NULL, NULL,
    'https://www.stlucieco.gov/departments-and-services/board-of-county-commissioners',
    'St. Lucie County Board of County Commissioners official page',
    NULL,
    false
  ),
  (
    'Jamie Fowler',
    'County Commissioner District 4',
    '11111111-0000-0000-0000-000000000034',
    'county',
    NULL, NULL, NULL, NULL, NULL, NULL,
    'https://www.stlucieco.gov/departments-and-services/board-of-county-commissioners',
    'St. Lucie County Board of County Commissioners official page',
    NULL,
    false
  ),
  (
    'Cathy Townsend',
    'County Commissioner District 5',
    '11111111-0000-0000-0000-000000000035',
    'county',
    NULL, NULL, NULL, NULL, NULL, NULL,
    'https://www.stlucieco.gov/departments-and-services/board-of-county-commissioners',
    'St. Lucie County Board of County Commissioners official page',
    NULL,
    false
  );
```

## 8. Post-insert verification SELECT queries (draft only — for use after Gate D execution, if ever approved)

```sql
-- Gate B post-insert verification 1 — confirm exactly 5 new rows exist for
-- the District 1-5 ids.
SELECT id, name, office, district_id, jurisdiction_level, source_url, is_on_next_ballot
FROM current_officials
WHERE district_id IN (
  '11111111-0000-0000-0000-000000000031',
  '11111111-0000-0000-0000-000000000032',
  '11111111-0000-0000-0000-000000000033',
  '11111111-0000-0000-0000-000000000034',
  '11111111-0000-0000-0000-000000000035'
)
ORDER BY district_id;
-- Expect: exactly 5 rows, values matching the Section 5 table exactly
-- (name, office, district_id, jurisdiction_level = county, source_url,
-- is_on_next_ballot = false).
```

```sql
-- Gate B post-insert verification 2 — confirm no unintended NULL in a
-- NOT NULL column (name/office/jurisdiction_level/source_url).
SELECT id, name, office, jurisdiction_level, source_url
FROM current_officials
WHERE district_id IN (
  '11111111-0000-0000-0000-000000000031',
  '11111111-0000-0000-0000-000000000032',
  '11111111-0000-0000-0000-000000000033',
  '11111111-0000-0000-0000-000000000034',
  '11111111-0000-0000-0000-000000000035'
)
AND (name IS NULL OR office IS NULL OR jurisdiction_level IS NULL OR source_url IS NULL);
-- Expect: 0 rows.
```

```sql
-- Gate B post-insert verification 3 — confirm is_on_next_ballot is false for
-- all 5 new rows (no row was accidentally marked true).
SELECT id, name, is_on_next_ballot
FROM current_officials
WHERE district_id IN (
  '11111111-0000-0000-0000-000000000031',
  '11111111-0000-0000-0000-000000000032',
  '11111111-0000-0000-0000-000000000033',
  '11111111-0000-0000-0000-000000000034',
  '11111111-0000-0000-0000-000000000035'
)
AND is_on_next_ballot = true;
-- Expect: 0 rows.
```

```sql
-- Gate B post-insert verification 4 — confirm the At-Large row remains
-- unchanged.
SELECT id, name, type, city, state
FROM districts
WHERE id = '11111111-0000-0000-0000-000000000003';
-- Expect: exactly 1 row, identical to Section 4 (St. Lucie County Commission
-- At-Large | county | Port St. Lucie | FL), unaltered.
```

```sql
-- Gate B post-insert verification 5 — confirm user_districts remains
-- unchanged for District 1-5 (no row was added, consistent with B2).
SELECT user_id, district_id, scope
FROM user_districts
WHERE district_id IN (
  '11111111-0000-0000-0000-000000000031',
  '11111111-0000-0000-0000-000000000032',
  '11111111-0000-0000-0000-000000000033',
  '11111111-0000-0000-0000-000000000034',
  '11111111-0000-0000-0000-000000000035'
);
-- Expect: 0 rows.
```

```sql
-- Gate B post-insert verification 6 — confirm the three already-seeded
-- officials (Stephanie Morgan, Debbie Hawley, Toby Overdorf) are unaffected.
SELECT id, name, office, district_id, jurisdiction_level, is_on_next_ballot
FROM current_officials
WHERE district_id IN (
  '11111111-0000-0000-0000-000000000001',
  '11111111-0000-0000-0000-000000000002',
  '11111111-0000-0000-0000-000000000004'
)
ORDER BY district_id;
-- Expect: exactly 3 rows, unchanged from their original seeding
-- (docs/current_officials_sql_plan.md).
```

## 9. Rollback notes (for review only)

If a rollback is ever needed after this draft is Gate C-approved and Gate D-executed, the only reversible action documented here is deleting the five rows above by exact `district_id`:

```sql
-- Rollback (only if Gate D-approved INSERT above was run and needs reversal) — DRAFT ONLY
DELETE FROM current_officials
WHERE district_id IN (
  '11111111-0000-0000-0000-000000000031',
  '11111111-0000-0000-0000-000000000032',
  '11111111-0000-0000-0000-000000000033',
  '11111111-0000-0000-0000-000000000034',
  '11111111-0000-0000-0000-000000000035'
);
```

This rollback is additive-only in reverse: it removes only the five rows this draft would insert. It does not touch `districts`, `user_districts`, `officials_for_user`, the three already-seeded officials, or the At-Large row. Safe to run as a rollback as long as no other row (e.g. a future `candidate_id` link) has come to depend on these five rows by the time a rollback is considered.

## 10. Risk check

Scope: Documentation-only SQL drafting for a future `current_officials` INSERT. No SQL executed, no Supabase data changed by this document.

No-change risk: County Commission District 1-5 officials remain absent from `current_officials` and from Current Officials display, same as before this document.

Change risk (if this draft is later approved and executed):

- `jurisdiction_level = 'county'` and `is_on_next_ballot = false` are this draft's proposed values, reasoned from existing repo convention and the project's non-negotiable sourcing rule respectively — not independently confirmed by an official source the way name/office/district were. Mike should explicitly confirm or correct both at Gate C.
- The Vice Chair (District 2) / Chair (District 4) titles Gate A confirmed are not reflected in the `office` value under this request's specified uniform wording. If that distinction matters for display, it should be corrected before Gate C approval, not after Gate D execution.
- Seeding these five rows alone does not make them visible to any user yet — Current Officials display for District 1-5 still requires the separate, not-yet-drafted `getOfficialsForUser` code change (Gate E/F/G in docs/county_commission_current_officials_b2_implementation_plan.md). This draft's execution and the B2 code change are independent future approvals.
- As with the three already-seeded officials, no unique constraint exists on `current_officials.district_id`, so the preflight duplicate check (Section 6, query 3) is the only protection against accidentally double-inserting rows for the same district; it must be run and must return 0 rows before any INSERT is considered.

## 11. Testing / review plan

Before Gate D execution (if ever approved):

- Run Section 6 preflight queries 1-5 in order; stop if preflight 1 does not return exactly 5 rows, if preflight 2's At-Large row is missing or altered, if preflight 3 returns any row, or if preflight 5's column list does not match this draft's INSERT column list exactly.
- Run the Section 7 INSERT only after all five preflight checks pass and Gate C approval is recorded.
- Run Section 8 post-insert verification queries 1-6; confirm exactly 5 new rows (query 1), no NOT NULL violations (query 2), no unintended `is_on_next_ballot = true` (query 3), the At-Large row unchanged (query 4), zero `user_districts` rows for District 1-5 (query 5), and the three already-seeded officials unchanged (query 6).
- Record the actual query results in a future "Gate D execution result" entry, following the same pattern as the Gate 6 execution result in docs/county_commission_district_1_5_future_implementation_plan.md.
- Do not attempt any UI verification as part of Gate D — Current Officials display for District 1-5 remains blocked until the separate B2 `getOfficialsForUser` code change (Gate E-H) is implemented and approved.

## 12. Explicit approval requirement before execution

**This SQL is DRAFT ONLY and NOT APPROVED FOR EXECUTION.**

Before any statement in Section 7 is run in Supabase, Mike must explicitly approve, per Gate C of docs/county_commission_current_officials_b2_implementation_plan.md, stating:

- approved official names, district assignments, and office wording (including whether Vice Chair/Chair should be reflected in `office`);
- approved `source_url` and `source_label`;
- approved `jurisdiction_level` value (`county`, as proposed in Section 5);
- approved `is_on_next_ballot` value (`false`, as proposed in Section 5) for all five rows, or a corrected value backed by an official election-date source;
- approval of this exact SQL draft (Section 7), or requested changes to it.

No SQL in this document has been executed. No Supabase data has been modified by this documentation update.

## 13. Hard stops

- Do not run any SQL in this document.
- Do not write to Supabase.
- Do not implement app code.
- Do not change schema.
- Do not change seed files.
- Do not change migrations.
- Do not change `user_districts`.
- Do not change `officials_for_user`.
- Do not rename, delete, replace, or repurpose the St. Lucie County Commission At-Large row.
- Do not proceed to Gate D execution without Gate C's explicit approval (Section 12).
- Do not draft or implement the B2 `getOfficialsForUser` code change (Gate E/F/G) as part of this document — that remains a separate, future, unstarted step.
