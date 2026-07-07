# Current Officials — SQL Plan (Potentially Seedable Rows Only)

## 1. Purpose

This document plans the shape of future `current_officials` seed SQL for the three rows currently classified as **Seedable now** in `docs/current_officials_verified_source_checklist.md` Section 7 (Seedability Review):

1. Port St. Lucie City Council District 1
2. St. Lucie School Board District 1
3. Florida House District 85

It exists to make the next SQL-writing step faster and safer by pre-organizing verified values, required checks, and open decisions in one place.

## 2. This is not executable SQL approval

- Nothing in this document authorizes running SQL against Supabase.
- Nothing in this document authorizes schema changes, seeding, code changes, or UI changes.
- The SQL shown in Section 7 is a **draft shape only** — it has not been reviewed against Gate 5 (`Seed SQL reviewed before run`) and must not be run as-is.
- Actually running any insert requires a separate, explicit approval step outside this document.

## 3. Source checklist summary (per row)

### 3.1 Port St. Lucie City Council District 1
- Source: `docs/current_officials_verified_source_checklist.md` Section 3.2
- Name: Stephanie Morgan
- Official source: https://www.cityofpsl.com/Government/Your-City-Government/Mayor-City-Council/District-1-Stephanie-Morgan
- `district_id` documented as `11111111-0000-0000-0000-000000000001`, matching `districts.name = 'City Council District 1'`
- No `candidates` row exists for Stephanie Morgan (checklist notes all 4 known District 1 candidates are logged `is_incumbent = false` and are distinct names)
- `term_start`, `term_end` not verified to an exact date; `next_election_date` known only as a City-wide primary/general pair, not confirmed specific to this seat's incumbent
- `is_on_next_ballot`: Unknown — city elections page identifies District 1 as a 2026 expiring term but does not list Stephanie Morgan as a 2026 candidate

### 3.2 St. Lucie School Board District 1
- Source: `docs/current_officials_verified_source_checklist.md` Section 3.3
- Name: Debbie Hawley
- Official source: https://www.stlucie.k12.fl.us/our-district/meet-the-board/ (shows District #1)
- `district_id` documented as `11111111-0000-0000-0000-000000000002`, matching `districts.name = 'School Board District 1'`
- No `candidates` row exists for Debbie Hawley
- `term_start`, `term_end`, `next_election_date` — none verified in this batch
- `is_on_next_ballot`: Unknown — no official election source verified

### 3.3 Florida House District 85
- Source: `docs/current_officials_verified_source_checklist.md` Section 3.5
- Name: Tobin Rogers "Toby" Overdorf
- Official source: https://housedocs.myfloridahouse.gov/Sections/Representatives/custom/biography.aspx?MemberId=4728
- `district_id` documented as `11111111-0000-0000-0000-000000000004`, matching `districts.name = 'FL House District 85'`
- No `candidates` row exists for a state house candidate
- `term_start`, `term_end` — official biography says elected 2018 and reelected subsequently, but no exact date confirmed; leave blank
- `next_election_date` — not confirmed in this batch
- `is_on_next_ballot`: Unknown — no official election source verified

## 4. Proposed insert values

| Field | City Council District 1 | School Board District 1 | Florida House District 85 |
|---|---|---|---|
| `name` | Stephanie Morgan | Debbie Hawley | Tobin Rogers "Toby" Overdorf |
| `office` | City Council Member, District 1 | School Board Member, District 1 | State Representative, District 85 |
| `district_id` | `11111111-0000-0000-0000-000000000001` | `11111111-0000-0000-0000-000000000002` | `11111111-0000-0000-0000-000000000004` |
| `jurisdiction_level` | city | school_board | state |
| `photo_url` | NULL | NULL | NULL |
| `website` | NULL | NULL | NULL |
| `bio` | NULL | NULL | NULL |
| `term_start` | NULL | NULL | NULL |
| `term_end` | NULL | NULL | NULL |
| `next_election_date` | NULL | NULL | NULL |
| `source_url` | https://www.cityofpsl.com/Government/Your-City-Government/Mayor-City-Council/District-1-Stephanie-Morgan | https://www.stlucie.k12.fl.us/our-district/meet-the-board/ | https://housedocs.myfloridahouse.gov/Sections/Representatives/custom/biography.aspx?MemberId=4728 |
| `source_label` | City of Port St. Lucie District 1 Council profile | St. Lucie Public Schools Meet the Board | Florida House of Representatives member profile |
| `candidate_id` | NULL | NULL | NULL |
| `is_on_next_ballot` | false — see Section 6 decision | false — see Section 6 decision | false — see Section 6 decision |

## 5. Fields that must stay null or blank

- `photo_url`, `website`, `bio` — not collected for any of these 3 rows; not required to seed.
- `term_start`, `term_end`, `next_election_date` — no exact official date verified for any of the 3 rows; must not be invented or estimated from term length.
- `candidate_id` — must stay `NULL` for all 3 rows; no verified matching `candidates` row exists for any of the three officials per the checklist.

## 6. Decision: `is_on_next_ballot` boolean storage

Per `Reference Files/civicmarket_schema_addendum_officials_reviews.sql` line 26, the column is defined as:

```
is_on_next_ballot boolean DEFAULT false
```

The schema stores a boolean, not a tri-state "Unknown." Decision (documented here, not run):

- `is_on_next_ballot = true` only when an official election source verifies the current official is on the next ballot.
- `is_on_next_ballot = false` when ballot status is unverified or unknown — a boolean cannot represent "Unknown," so unverified status is recorded as `false`, not left open.
- The uncertainty itself (i.e., that ballot status has not been confirmed by an official election source) is preserved in this document's notes/source fields, not guessed into the boolean.

Applied to the three rows in this plan:

1. **Stephanie Morgan, City Council District 1** — `is_on_next_ballot: false`. Reason: District 1 is a 2026 expiring term, but Stephanie Morgan was not verified as listed on the 2026 candidate list in the current checklist batch (`docs/current_officials_verified_source_checklist.md` Section 3.2).
2. **Debbie Hawley, School Board District 1** — `is_on_next_ballot: false`. Reason: no official election source verified next-ballot status in the current checklist batch (Section 3.3).
3. **Tobin Rogers "Toby" Overdorf, Florida House District 85** — `is_on_next_ballot: false`. Reason: no official election source verified next-ballot status in the current checklist batch (Section 3.5).

No row in this plan is marked `true`. This decision does not authorize seeding — it only resolves how the draft SQL in Section 8 should treat `is_on_next_ballot` for these three rows when a future Gate 5 review occurs.

## 7. Pre-run verification queries (run before any future SQL)

```sql
-- DRAFT ONLY - DO NOT RUN

-- 0. Confirm the current_officials table has actually been deployed.
-- CIVICMARKET_CURRENT_STATE.md notes the schema addendum migration
-- (civicmarket_schema_addendum_officials_reviews.sql) was authored
-- July 4 2026 but "Tables not yet in production — deploy pending"
-- as of the last recorded checkpoint. This must be reconfirmed before
-- any insert is attempted.
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name = 'current_officials';
-- Expect: 1 row. If 0 rows, the migration has not been run yet — stop.

-- 1. Confirm the 3 target districts rows exist with the expected ids.
SELECT id, name
FROM districts
WHERE id IN (
  '11111111-0000-0000-0000-000000000001',
  '11111111-0000-0000-0000-000000000002',
  '11111111-0000-0000-0000-000000000004'
)
ORDER BY name;
-- Expect: 3 rows, names 'City Council District 1', 'School Board District 1', 'FL House District 85'.

-- 2. Confirm no current_officials row already exists for these districts
-- (avoid accidental duplicates on a future insert).
SELECT id, name, district_id
FROM current_officials
WHERE district_id IN (
  '11111111-0000-0000-0000-000000000001',
  '11111111-0000-0000-0000-000000000002',
  '11111111-0000-0000-0000-000000000004'
);
-- Expect: 0 rows before first seed.

-- 3. Confirm no existing candidates row matches these names
-- (candidate_id must stay NULL if this returns 0 rows).
SELECT id, name
FROM candidates
WHERE name IN ('Stephanie Morgan', 'Debbie Hawley', 'Tobin Rogers "Toby" Overdorf');
-- Expect: 0 rows, consistent with checklist notes.

-- 4. Confirm the admin INSERT policy exists on current_officials.
SELECT policyname, cmd
FROM pg_policies
WHERE tablename = 'current_officials'
ORDER BY policyname;
-- Expect: 4 policies (SELECT/INSERT/UPDATE/DELETE), per the schema addendum file.
```

## 8. Draft SQL shape

```sql
-- DRAFT ONLY - DO NOT RUN
-- This is a shape for future Gate 5 review, not an approved statement.
-- is_on_next_ballot = false per the Section 6 decision: no official
-- election source has verified next-ballot status for any of these 3 rows.

INSERT INTO current_officials (
  name,
  office,
  district_id,
  jurisdiction_level,
  source_url,
  source_label,
  candidate_id,
  is_on_next_ballot
) VALUES
(
  'Stephanie Morgan',
  'City Council Member, District 1',
  '11111111-0000-0000-0000-000000000001',
  'city',
  'https://www.cityofpsl.com/Government/Your-City-Government/Mayor-City-Council/District-1-Stephanie-Morgan',
  'City of Port St. Lucie District 1 Council profile',
  NULL,
  false
),
(
  'Debbie Hawley',
  'School Board Member, District 1',
  '11111111-0000-0000-0000-000000000002',
  'school_board',
  'https://www.stlucie.k12.fl.us/our-district/meet-the-board/',
  'St. Lucie Public Schools Meet the Board',
  NULL,
  false
),
(
  'Tobin Rogers "Toby" Overdorf',
  'State Representative, District 85',
  '11111111-0000-0000-0000-000000000004',
  'state',
  'https://housedocs.myfloridahouse.gov/Sections/Representatives/custom/biography.aspx?MemberId=4728',
  'Florida House of Representatives member profile',
  NULL,
  false
);
```

## 9. Post-run verification queries (for a future run)

```sql
-- DRAFT ONLY - DO NOT RUN

-- 1. Confirm exactly 3 new rows exist with the expected district_id values.
SELECT id, name, office, district_id, jurisdiction_level, source_url, candidate_id, is_on_next_ballot
FROM current_officials
WHERE district_id IN (
  '11111111-0000-0000-0000-000000000001',
  '11111111-0000-0000-0000-000000000002',
  '11111111-0000-0000-0000-000000000004'
)
ORDER BY district_id;
-- Expect: 3 rows matching Section 4 values exactly.

-- 2. Confirm no unintended NULL in a NOT NULL column (name/office/jurisdiction_level/source_url).
SELECT id, name, office, jurisdiction_level, source_url
FROM current_officials
WHERE district_id IN (
  '11111111-0000-0000-0000-000000000001',
  '11111111-0000-0000-0000-000000000002',
  '11111111-0000-0000-0000-000000000004'
)
AND (name IS NULL OR office IS NULL OR jurisdiction_level IS NULL OR source_url IS NULL);
-- Expect: 0 rows.

-- 3. Confirm officials_for_user surfaces each new row for a test user assigned
-- to the matching district (run once a test user_districts row exists for each district).
SELECT user_id, name, office, district_name
FROM officials_for_user
WHERE district_id IN (
  '11111111-0000-0000-0000-000000000001',
  '11111111-0000-0000-0000-000000000002',
  '11111111-0000-0000-0000-000000000004'
);
-- Expect: 1 row per test user per matching district.
```

## 10. Rollback consideration

If a future seed run needs to be reversed, the safest rollback targets the 3 specific rows by their known `source_url` values (not a broad delete), since `source_url` is unique per row in this batch and avoids touching any other `current_officials` data (e.g., a future Mayor row).

```sql
-- DRAFT ONLY - DO NOT RUN
-- Rollback shape for the 3 rows in this plan, scoped by source_url to avoid
-- deleting any other current_officials row. Not approved to run.

DELETE FROM current_officials
WHERE source_url IN (
  'https://www.cityofpsl.com/Government/Your-City-Government/Mayor-City-Council/District-1-Stephanie-Morgan',
  'https://www.stlucie.k12.fl.us/our-district/meet-the-board/',
  'https://housedocs.myfloridahouse.gov/Sections/Representatives/custom/biography.aspx?MemberId=4728'
);
```

## 11. Blocked rows excluded from this plan

The following rows remain blocked per the checklist Seedability Review and are intentionally **not** included anywhere in this plan (no insert values, no draft SQL):

- **Port St. Lucie Mayor** — blocked: `district_id` missing, no Mayor `districts` row exists yet (Section 4 prerequisite unresolved).
- **St. Lucie County Commission At-Large** — blocked: district model gap (official county source models District 1–5 commissioners, app row is one countywide At-Large office).
- **Florida Senate District 27** — blocked: geography mapping gap (official Senate page district area does not mention St. Lucie or Martin County).

## 12. Risk check

- **Schema deployment status is unconfirmed.** `CIVICMARKET_CURRENT_STATE.md` records the `current_officials` table migration as authored (commit `f1b1e31`, July 4 2026) but explicitly notes "Tables not yet in production — deploy pending." Any future SQL step must reconfirm deployment (Section 7, query 0) before attempting an insert.
- **`Verified by` column is blank for all 3 rows** in the source checklist. The checklist's own Gate 2 ("Official names and offices verified") has no recorded sign-off name/date yet, even though source URLs and values are present. This is a process gap worth closing before Gate 5.
- **`is_on_next_ballot` boolean-vs-Unknown mismatch is resolved** (Section 6) — unverified ballot status is recorded as `false` for all 3 rows; no row is marked `true` without official election source verification.
- **No dates were invented.** `term_start`, `term_end`, and `next_election_date` are blank for all 3 rows, consistent with the checklist and the global "do not guess" rules.
- **No blocked-row data appears anywhere in this plan** — Mayor, County Commission At-Large, and Florida Senate District 27 are excluded from Sections 3, 4, 7, 8, 9, and 10.
- **This plan is documentation only.** No `.sql` file was created; no SQL was run; no schema, code, UI, or Supabase change was made.

## Supabase deployment verification checklist

Read-only checks only. Run these manually in the Supabase SQL Editor (dashboard, not service role key, not any project script) to confirm whether the `current_officials` / `officials_for_user` migration (`Reference Files/civicmarket_schema_addendum_officials_reviews.sql`, authored commit `f1b1e31`, July 4 2026) has actually been deployed. `CIVICMARKET_CURRENT_STATE.md` currently records this migration as authored but **"Tables not yet in production — deploy pending"** — these queries exist to reconfirm that status, not to change it.

None of these statements insert, update, delete, upsert, alter, create, drop, or truncate anything.

1. Confirm table exists:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name = 'current_officials';
```

2. Confirm expected columns:

```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'current_officials'
ORDER BY ordinal_position;
```

3. Confirm RLS enabled:

```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename = 'current_officials';
```

4. Confirm RLS policies:

```sql
SELECT policyname, cmd, permissive, roles
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'current_officials'
ORDER BY policyname;
```

5. Confirm `officials_for_user` view exists:

```sql
SELECT table_name
FROM information_schema.views
WHERE table_schema = 'public'
  AND table_name = 'officials_for_user';
```

6. Confirm view definition:

```sql
SELECT viewname, definition
FROM pg_views
WHERE schemaname = 'public'
  AND viewname = 'officials_for_user';
```

7. Confirm current row count only:

```sql
SELECT COUNT(*) AS current_officials_count
FROM public.current_officials;
```

### Expected results

- `current_officials` table exists (check 1 returns 1 row).
- Columns match the schema addendum (check 2): `id`, `name`, `office`, `district_id`, `jurisdiction_level`, `photo_url`, `website`, `bio`, `term_start`, `term_end`, `next_election_date`, `source_url`, `source_label`, `candidate_id`, `is_on_next_ballot`, `created_at`, `updated_at`.
- RLS is enabled (check 3 returns `rowsecurity = true`).
- Policies exist (check 4): a public SELECT policy ("Current officials are publicly readable") plus admin-only INSERT/UPDATE/DELETE policies (4 policies total).
- `officials_for_user` view exists (check 5 returns 1 row).
- View definition (check 6) joins `user_districts` → `current_officials` → `districts` on `district_id`, matching the schema addendum.
- Current row count (check 7) **may legitimately be 0** — no rows have been seeded yet, and 0 is an acceptable, expected result, not a failure.

If check 1 returns 0 rows, the migration has not been deployed yet — stop and do not proceed to any seeding step until it is run in Supabase SQL Editor.

## Manual Supabase verification result

- **Date:** 2026-07-06
- **Method:** manual read-only query in Supabase SQL Editor
- **Result:** schema/view deployment confirmed
  - `current_officials` table exists: PASS
  - `current_officials` column count: PASS, 17
  - `current_officials` RLS enabled: PASS
  - `current_officials` policy count: PASS, 4
  - `officials_for_user` view exists: PASS
- **Row count:** 0 `current_officials` rows before seed
- **Note:** no write SQL was run

## Final seed SQL draft for review

This section assembles a single, self-contained review package for the three rows classified **Seedable now** in `docs/current_officials_verified_source_checklist.md` Section 7: **Stephanie Morgan** (Port St. Lucie City Council District 1), **Debbie Hawley** (St. Lucie School Board District 1), and **Tobin Rogers "Toby" Overdorf** (Florida House District 85). It restates Sections 7–9 in one place so it can be reviewed and copied as one unit.

**Rows excluded from this draft** (per Section 11 — not seedable, not included anywhere below):
- Shannon Martin / Port St. Lucie Mayor — blocked: no Mayor `districts` row exists yet, so `district_id` and a user-assignment model are unresolved.
- St. Lucie County Commission At-Large — blocked: official county source models District 1–5 commissioners, not one countywide At-Large office (district model gap).
- Ben Albritton / Florida Senate District 27 — blocked: official Senate district-27 page does not list St. Lucie or Martin County (geography mapping gap).

**This is a draft only.** It has not passed Gate 5 (`Seed SQL reviewed before run`). **This SQL must be manually reviewed and Gate 5 sign-off recorded before it is copied into Supabase SQL Editor and run.** No statement in this section has been executed.

Gate 2 source sign-off is now closed for these three draft seed rows (`docs/current_officials_verified_source_checklist.md`, Mike - manual source review - 2026-07-06); Gate 5 review remains open.

### Pre-run SELECT checks (run immediately before the INSERT, in the same Supabase SQL Editor session)

```sql
-- DRAFT ONLY - DO NOT RUN

-- 1. Reconfirm current_officials is deployed (see "Manual Supabase verification result" above — last confirmed 2026-07-06).
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name = 'current_officials';
-- Expect: 1 row. If 0 rows, stop — do not proceed to the INSERT below.

-- 2. Confirm the 3 target districts rows exist with the expected ids.
SELECT id, name
FROM districts
WHERE id IN (
  '11111111-0000-0000-0000-000000000001',
  '11111111-0000-0000-0000-000000000002',
  '11111111-0000-0000-0000-000000000004'
)
ORDER BY name;
-- Expect: 3 rows, names 'City Council District 1', 'School Board District 1', 'FL House District 85'.

-- 3. Confirm no current_officials row already exists for these districts
-- (avoid accidental duplicates — this is why INSERT is used below, not upsert:
-- there is no existing row to merge into, and no natural unique key on
-- current_officials other than id, so ON CONFLICT has nothing safe to target).
SELECT id, name, district_id
FROM current_officials
WHERE district_id IN (
  '11111111-0000-0000-0000-000000000001',
  '11111111-0000-0000-0000-000000000002',
  '11111111-0000-0000-0000-000000000004'
);
-- Expect: 0 rows before first seed. If any row is returned, stop — do not insert a duplicate.

-- 4. Confirm no existing candidates row matches these names
-- (candidate_id must stay NULL if this returns 0 rows).
SELECT id, name
FROM candidates
WHERE name IN ('Stephanie Morgan', 'Debbie Hawley', 'Tobin Rogers "Toby" Overdorf');
-- Expect: 0 rows, consistent with checklist notes.

-- 5. Confirm the admin INSERT policy exists on current_officials.
SELECT policyname, cmd
FROM pg_policies
WHERE tablename = 'current_officials'
ORDER BY policyname;
-- Expect: 4 policies (SELECT/INSERT/UPDATE/DELETE), per the schema addendum file.
```

### Final draft INSERT

Columns included are limited to those confirmed in `Reference Files/civicmarket_schema_addendum_officials_reviews.sql` (excluding `id`, `created_at`, `updated_at`, which all have column defaults and are omitted here). Plain `INSERT` is used, not `upsert` — per check 3 above, no matching row exists yet for any of the 3 target districts, and `current_officials` has no natural unique key besides `id` for an `ON CONFLICT` target, so there is nothing safe to upsert against.

```sql
-- DRAFT ONLY - DO NOT RUN
-- Final draft for Gate 5 review. Not approved to run until the checklist's
-- "Verified by" sign-off is recorded for these 3 rows (see Section 12, Risk check).
-- is_on_next_ballot = false for all 3 rows per the Section 6 decision: no
-- official election source has verified next-ballot status for any of them.
-- term_start, term_end, next_election_date, candidate_id, photo_url, website,
-- and bio are NULL for all 3 rows — none of these were verified in the checklist.

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
  'Stephanie Morgan',
  'City Council Member, District 1',
  '11111111-0000-0000-0000-000000000001',
  'city',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  'https://www.cityofpsl.com/Government/Your-City-Government/Mayor-City-Council/District-1-Stephanie-Morgan',
  'City of Port St. Lucie District 1 Council profile',
  NULL,
  false
),
(
  'Debbie Hawley',
  'School Board Member, District 1',
  '11111111-0000-0000-0000-000000000002',
  'school_board',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  'https://www.stlucie.k12.fl.us/our-district/meet-the-board/',
  'St. Lucie Public Schools Meet the Board',
  NULL,
  false
),
(
  'Tobin Rogers "Toby" Overdorf',
  'State Representative, District 85',
  '11111111-0000-0000-0000-000000000004',
  'state',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  'https://housedocs.myfloridahouse.gov/Sections/Representatives/custom/biography.aspx?MemberId=4728',
  'Florida House of Representatives member profile',
  NULL,
  false
);
```

### Post-run SELECT checks (run immediately after the INSERT, in the same session)

```sql
-- DRAFT ONLY - DO NOT RUN

-- 1. Confirm exactly 3 new rows exist with the expected district_id values.
SELECT id, name, office, district_id, jurisdiction_level, source_url, candidate_id, is_on_next_ballot
FROM current_officials
WHERE district_id IN (
  '11111111-0000-0000-0000-000000000001',
  '11111111-0000-0000-0000-000000000002',
  '11111111-0000-0000-0000-000000000004'
)
ORDER BY district_id;
-- Expect: exactly 3 rows, values matching the INSERT above.

-- 2. Confirm no unintended NULL in a NOT NULL column (name/office/jurisdiction_level/source_url).
SELECT id, name, office, jurisdiction_level, source_url
FROM current_officials
WHERE district_id IN (
  '11111111-0000-0000-0000-000000000001',
  '11111111-0000-0000-0000-000000000002',
  '11111111-0000-0000-0000-000000000004'
)
AND (name IS NULL OR office IS NULL OR jurisdiction_level IS NULL OR source_url IS NULL);
-- Expect: 0 rows.

-- 3. Confirm is_on_next_ballot is false for all 3 new rows (no row was accidentally marked true).
SELECT id, name, is_on_next_ballot
FROM current_officials
WHERE district_id IN (
  '11111111-0000-0000-0000-000000000001',
  '11111111-0000-0000-0000-000000000002',
  '11111111-0000-0000-0000-000000000004'
)
AND is_on_next_ballot IS DISTINCT FROM false;
-- Expect: 0 rows.

-- 4. Confirm officials_for_user surfaces each new row for a test user assigned
-- to the matching district (run once a test user_districts row exists for each district).
SELECT user_id, name, office, district_name
FROM officials_for_user
WHERE district_id IN (
  '11111111-0000-0000-0000-000000000001',
  '11111111-0000-0000-0000-000000000002',
  '11111111-0000-0000-0000-000000000004'
);
-- Expect: 1 row per test user per matching district.
```

### Reminder

This entire section is a draft for manual review only. No SQL in this section has been run. Copying any statement above into Supabase SQL Editor requires a separate, explicit approval step and a recorded Gate 5 sign-off — not just the existence of this document.
