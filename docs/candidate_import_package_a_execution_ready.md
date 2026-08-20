# Candidate Import Package A — Execution-Ready

Status: **Executed 08-20-2026. Post-write verification PASS.**

Date: 08-20-2026

Source: published artifact "2026 Candidate Import Package" (artifact ID `b03c9f5b-7a89-4aaa-b4ac-b2094bfebc5e`), section §P2 ("Package A — exact SQL"), after the School Board District 3 correction (Donna Mills / Ben "Zag" Zagrobelny moved to Package B). Fetched and verified twice, byte-level, directly from the artifact — not reconstructed from memory, not sourced from the Git repository.

This document does not authorize a write. It records the reviewed SQL, the three explicitly approved execution-readiness corrections, live read-only preflight evidence, post-write verification SQL, and exact literal-ID rollback SQL, so that a future explicit approval can proceed straight to execution without re-deriving any of this.

## 1. Review history

1. **Structural review** (candidate list, update list, exact counts, MUST NOT APPEAR list, UUID/field consistency, transaction structure) — passed with one issue found: the Steven Harrington `UPDATE` set `archived_at`, violating the "zero archive actions" requirement.
2. **User-directed corrections, approved 08-20-2026:**
   - **Correction 1 — Harrington must not be archived.** The `UPDATE` now sets only `appeared_on_ballot = false`; `archived_at` is untouched.
   - **Correction 2 — fixed candidate UUIDs.** Approved: a new `44444444-0000-0000-0000-0000000000XX` prefix (unused anywhere in the repo or the live database — verified below), extending the existing `11111111-...` districts / `22222222-...` elections convention without colliding with the historical, now-deleted `33333333-...` dummy-candidate prefix or with the random `gen_random_uuid()` values used by every real candidate imported to date (Gate I24 explicitly chose not to establish a deterministic candidate-ID convention; this is a new, narrowly-scoped exception for Package A's controlled rollback needs only).
   - **Correction 3 — source provenance.** The `candidates` table (`Reference Files/civicmarket_schema_v4.sql`, lines 140–153) has no `source_url` or `source_label` column. No fields were added or fabricated. Provenance remains where the established convention (Gate I23B, "Provenance Option A") already keeps it: the CSV's `official_candidate_source_url` field and this import package's own citations (stlucievotes.gov, dos.elections.myflorida.com) — not in the database.
   - Structural consequence of Correction 2: Section 3's duplicate-guard changed from `WHERE NOT EXISTS (... name+district match ...)` to `ON CONFLICT (id) DO NOTHING`, matching the pattern already used by Sections 1 and 2. Approved by the user alongside the UUID mapping.
3. **Live read-only preflight** — performed this session, PASS. Evidence in §3 below.

## 2. Fixed candidate UUID mapping (approved)

| Candidate | Fixed UUID |
|---|---|
| Larry Leet | `44444444-0000-0000-0000-000000000001` |
| Rolin Dorsainvil | `44444444-0000-0000-0000-000000000002` |
| Jamie Lee Fowler | `44444444-0000-0000-0000-000000000003` |
| Nicholas Burgos | `44444444-0000-0000-0000-000000000004` |
| Dana Trabulsy | `44444444-0000-0000-0000-000000000005` |
| Jennifer Massey | `44444444-0000-0000-0000-000000000006` |
| Anthony Bonna | `44444444-0000-0000-0000-000000000007` |
| Wayne Richter | `44444444-0000-0000-0000-000000000008` |
| Amr Metwally | `44444444-0000-0000-0000-000000000009` |
| Hunter Stone | `44444444-0000-0000-0000-00000000000a` |

## 3. Live read-only preflight evidence

Performed via direct PostgREST `GET` requests to the project's Supabase REST API, authenticated with the public `NEXT_PUBLIC_SUPABASE_ANON_KEY` (the same publishable key already compiled into the client bundle — no service-role key or other secret was read or used). No `INSERT`/`UPDATE`/`DELETE`/`POST`/`PATCH` request was made. No Supabase SQL Editor was used.

| # | Check | Query target | Result |
|---|---|---|---|
| 1 | 3 new district IDs unused | `districts?id=in.(...008,...009,...00a)` | `[]` — 0 rows, confirmed unused |
| 2 | 6 referenced parent districts valid | `districts?id=in.(...032,...034,...004,...002,...001,...006)` | 6/6 rows returned, names/types confirmed: City Council District 1, School Board District 1, FL House District 85, St. Lucie County Commission District 2, St. Lucie County Commission District 4, Mayor |
| 3 | 10 new election IDs unused | `elections?id=in.(...008,009,019,00a,00b,001b,001a,00c,017,018)` | `[]` — 0 rows, confirmed unused |
| 4 | Referenced pre-existing FL House 85 election valid | `elections?id=eq.22222222-0000-0000-0000-000000000004` | 1 row: "FL House District 85 2026", `election_date: 2026-11-03`, `district_id: ...0004` — correctly paired to the district in check #2 |
| 5 | 10 new candidate IDs (`44444444-...`) unused | `candidates?id=in.(...)` | `[]` — 0 rows, confirmed unused |
| 6 | Exact-name collision check, all 10 candidate names | `candidates?or=(name.eq.Larry%20Leet,...)` | `[]` — 0 rows |
| 7 | Fuzzy surname collision check (`ilike`), all 10 surnames | `candidates?or=(name.ilike.*Leet*,...)` | `[]` — 0 rows, no name-variant already exists under a different UUID |
| 8 | Rick/Fredric Meltzer target row | `candidates?id=eq.6a7f3cca-2bfa-423b-a2e6-82ca0cfc291f` | Exists exactly once — `name: "Fredric Meltzer"`, `office: "City Council District 1"`, `district_id: ...0001`, `archived_at: null`, `appeared_on_ballot: true` |
| 9 | Steven Harrington target row | `candidates?id=eq.6e14b71f-0a08-4623-a442-c444d5f9b276` | Exists exactly once — `name: "Steven Harrington"`, `office: "Mayor"`, `district_id: ...0006`, `archived_at: null`, `appeared_on_ballot: true` |
| 10 | Baseline count — `districts` | `HEAD districts?select=id&limit=1`, `Prefer: count=exact` | **12** |
| 11 | Baseline count — `elections` | same | **7** |
| 12 | Baseline count — `candidates` | same | **11** |
| 13 | Baseline count — `current_officials` | same | **9** (matches the import package's own stated expectation) |
| 14 | Baseline count — `user_districts` | same | RLS-restricted for the anon key (`Users can read own districts` policy, owner-scoped) — returned `Content-Range: */0`; not numerically measurable this way. Not a blocker: Package A never writes to this table under any circumstance. |
| 15 | Donna Mills / Ben "Zag" Zagrobelny absent from Package A | Structural review of the SQL text itself (§4 below) | Confirmed absent — explicitly excluded per the `-- REMOVED 08-20-2026` comment, moved to Package B |
| 16 | Statewide candidates absent | Structural review | Confirmed absent — no Governor/AG/CFO/Ag Commissioner rows anywhere in the SQL |
| 17 | `user_districts`/`current_officials`/schema changes | Structural review | Confirmed absent — no such statements exist anywhere in the SQL |

12 (districts) + 7 (elections) + 11 (candidates) baselines cross-checked against every ID individually referenced by the SQL — no discrepancy found. Package A would create no duplicate race or candidate row.

## 4. Complete corrected Package A SQL (not executed)

```sql
BEGIN;

-- ============================================================
-- PACKAGE A, SECTION 1: District rows (administrative facts)
-- ============================================================
INSERT INTO districts (id, name, type, city, state) VALUES
  ('11111111-0000-0000-0000-000000000008', 'School Board District 3', 'school_board', 'Port St. Lucie', 'FL'),
  ('11111111-0000-0000-0000-000000000009', 'School Board District 5', 'school_board', 'Port St. Lucie', 'FL'),
  ('11111111-0000-0000-0000-00000000000a', 'FL House District 84', 'state', 'Port St. Lucie', 'FL')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- PACKAGE A, SECTION 2: Election rows (scheduling containers only --
-- creating a row here NEVER implies any candidate is assigned to it)
-- ============================================================
INSERT INTO elections (id, name, election_date, district_id) VALUES
  ('22222222-0000-0000-0000-000000000008', 'St. Lucie County Commission D2 2026',        '2026-11-03', '11111111-0000-0000-0000-000000000032'),
  ('22222222-0000-0000-0000-000000000009', 'St. Lucie County Commission D4 2026',        '2026-11-03', '11111111-0000-0000-0000-000000000034'),
  ('22222222-0000-0000-0000-000000000019', 'St. Lucie County Commission D4 Primary 2026','2026-08-18', '11111111-0000-0000-0000-000000000034'),
  ('22222222-0000-0000-0000-00000000000a', 'St. Lucie School Board D3 2026',             '2026-11-03', '11111111-0000-0000-0000-000000000008'),
  ('22222222-0000-0000-0000-00000000000b', 'St. Lucie School Board D5 2026',             '2026-11-03', '11111111-0000-0000-0000-000000000009'),
  ('22222222-0000-0000-0000-00000000001b', 'St. Lucie School Board D5 Primary 2026',     '2026-08-18', '11111111-0000-0000-0000-000000000009'),
  ('22222222-0000-0000-0000-00000000001a', 'St. Lucie School Board D1 Primary 2026',     '2026-08-18', '11111111-0000-0000-0000-000000000002'),
  ('22222222-0000-0000-0000-00000000000c', 'FL House District 84 2026',                  '2026-11-03', '11111111-0000-0000-0000-00000000000a'),
  ('22222222-0000-0000-0000-000000000017', 'PSL Mayor General 2026',                     '2026-11-03', '11111111-0000-0000-0000-000000000006'),
  ('22222222-0000-0000-0000-000000000018', 'PSL City Council D1 Primary 2026',           '2026-08-18', '11111111-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- PACKAGE A, SECTION 3: Candidates with NO contested primary --
-- their status was fixed at qualifying, unaffected by any Aug 18 vote.
-- Fixed IDs assigned (44444444-... prefix) so collisions can be
-- preflighted and rollback can use literal IDs, not name matching.
-- No source_url/source_label populated: candidates table has no
-- such columns (see Correction 3 -- Provenance Option A).
-- ============================================================
INSERT INTO candidates (id, name, office, is_incumbent, district_id, election_id, appeared_on_ballot) VALUES
  -- County Commission D2 -- Leet unopposed in REP primary, Dorsainvil IND (no primary)
  ('44444444-0000-0000-0000-000000000001', 'Larry Leet',        'County Commissioner District 2', true,  '11111111-0000-0000-0000-000000000032', '22222222-0000-0000-0000-000000000008', true),
  ('44444444-0000-0000-0000-000000000002', 'Rolin Dorsainvil',  'County Commissioner District 2', false, '11111111-0000-0000-0000-000000000032', '22222222-0000-0000-0000-000000000008', true),
  -- County Commission D4 -- Fowler unopposed in REP primary, Burgos NPA (no primary).
  -- Leroy/Messer (the contested DEM line) are deliberately NOT inserted here -- see Package B.
  ('44444444-0000-0000-0000-000000000003', 'Jamie Lee Fowler',  'County Commissioner District 4', true,  '11111111-0000-0000-0000-000000000034', '22222222-0000-0000-0000-000000000009', true),
  ('44444444-0000-0000-0000-000000000004', 'Nicholas Burgos',   'County Commissioner District 4', false, '11111111-0000-0000-0000-000000000034', '22222222-0000-0000-0000-000000000009', true),
  -- FL House District 84 -- both unopposed in their own primary
  ('44444444-0000-0000-0000-000000000005', 'Dana Trabulsy',     'State Representative, District 84', true,  '11111111-0000-0000-0000-00000000000a', '22222222-0000-0000-0000-00000000000c', true),
  ('44444444-0000-0000-0000-000000000006', 'Jennifer Massey',   'State Representative, District 84', false, '11111111-0000-0000-0000-00000000000a', '22222222-0000-0000-0000-00000000000c', true),
  -- FL House District 85 -- all four unopposed / no primary
  ('44444444-0000-0000-0000-000000000007', 'Anthony Bonna',     'State Representative, District 85', false, '11111111-0000-0000-0000-000000000004', '22222222-0000-0000-0000-000000000004', true),
  ('44444444-0000-0000-0000-000000000008', 'Wayne Richter',     'State Representative, District 85', false, '11111111-0000-0000-0000-000000000004', '22222222-0000-0000-0000-000000000004', true),
  ('44444444-0000-0000-0000-000000000009', 'Amr Metwally',      'State Representative, District 85', false, '11111111-0000-0000-0000-000000000004', '22222222-0000-0000-0000-000000000004', true),
  ('44444444-0000-0000-0000-00000000000a', 'Hunter Stone',      'State Representative, District 85', false, '11111111-0000-0000-0000-000000000004', '22222222-0000-0000-0000-000000000004', true)
  -- School Board D3 (Mills, Zagrobelny) REMOVED 08-20-2026: the county's own qualifying
  -- record labels Mills "Qualified", NOT "Unopposed" (unlike Fort Pierce's confirmed-
  -- unopposed races) -- her only rival is an ACTIVE qualified write-in, not a withdrawal,
  -- so whether she is unopposed is not a clean qualifying-period fact. Moved to Package B.
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- PACKAGE A, SECTION 4: Corrections to existing rows (identity /
-- qualification-period facts only -- no outcome claim of any kind)
-- ============================================================

-- Rick Meltzer name correction (official qualifying record)
UPDATE candidates
SET name = 'Rick Meltzer'
WHERE id = '6a7f3cca-2bfa-423b-a2e6-82ca0cfc291f' AND name = 'Fredric Meltzer';

-- Steven Harrington: Did Not Qualify (qualifying-period fact, pre-dates the election)
-- Correction 1 applied: archived_at is no longer touched.
UPDATE candidates
SET appeared_on_ballot = false
WHERE id = '6e14b71f-0a08-4623-a442-c444d5f9b276';

COMMIT;
```

## 5. Exact counts

- 3 district inserts
- 10 election inserts
- 10 candidate inserts
- 2 candidate updates
- 0 archive actions
- 0 result-dependent actions
- 0 statewide rows
- 0 `user_districts` changes
- 0 `current_officials` changes
- 0 schema/RLS/grant/function changes
- 0 `DELETE` statements
- 1 `BEGIN`, 1 `COMMIT`

## 6. Post-write verification SQL (for use only after an explicitly approved execution)

```sql
-- Row counts land exactly where expected
SELECT count(*) FROM districts WHERE id IN (
  '11111111-0000-0000-0000-000000000008','11111111-0000-0000-0000-000000000009','11111111-0000-0000-0000-00000000000a'
); -- expect 3

SELECT count(*) FROM elections WHERE id IN (
  '22222222-0000-0000-0000-000000000008','22222222-0000-0000-0000-000000000009','22222222-0000-0000-0000-000000000019',
  '22222222-0000-0000-0000-00000000000a','22222222-0000-0000-0000-00000000000b','22222222-0000-0000-0000-00000000001b',
  '22222222-0000-0000-0000-00000000001a','22222222-0000-0000-0000-00000000000c','22222222-0000-0000-0000-000000000017',
  '22222222-0000-0000-0000-000000000018'
); -- expect 10

SELECT count(*) FROM candidates WHERE id IN (
  '44444444-0000-0000-0000-000000000001','44444444-0000-0000-0000-000000000002','44444444-0000-0000-0000-000000000003',
  '44444444-0000-0000-0000-000000000004','44444444-0000-0000-0000-000000000005','44444444-0000-0000-0000-000000000006',
  '44444444-0000-0000-0000-000000000007','44444444-0000-0000-0000-000000000008','44444444-0000-0000-0000-000000000009',
  '44444444-0000-0000-0000-00000000000a'
); -- expect 10

-- Every Package A candidate is unarchived and appeared_on_ballot = true
SELECT id, name, archived_at, appeared_on_ballot FROM candidates
WHERE id IN (
  '44444444-0000-0000-0000-000000000001','44444444-0000-0000-0000-000000000002','44444444-0000-0000-0000-000000000003',
  '44444444-0000-0000-0000-000000000004','44444444-0000-0000-0000-000000000005','44444444-0000-0000-0000-000000000006',
  '44444444-0000-0000-0000-000000000007','44444444-0000-0000-0000-000000000008','44444444-0000-0000-0000-000000000009',
  '44444444-0000-0000-0000-00000000000a'
) AND (archived_at IS NOT NULL OR appeared_on_ballot IS NOT TRUE); -- expect ZERO rows

-- Harrington and Meltzer corrected exactly as intended -- and NOT archived
SELECT id, name, archived_at, appeared_on_ballot FROM candidates
WHERE id IN ('6e14b71f-0a08-4623-a442-c444d5f9b276','6a7f3cca-2bfa-423b-a2e6-82ca0cfc291f');
-- expect Harrington: appeared_on_ballot = false, archived_at IS NULL (unchanged)
-- expect Meltzer:    name = 'Rick Meltzer', archived_at IS NULL (unchanged)

-- No duplicate candidates were created
SELECT name, district_id, count(*) FROM candidates
WHERE archived_at IS NULL GROUP BY name, district_id HAVING count(*) > 1; -- expect 0 rows

-- No Donna Mills / Zagrobelny / statewide candidates were introduced
SELECT count(*) FROM candidates WHERE name IN ('Donna Mills', 'Ben "Zag" Zagrobelny'); -- expect 0

-- Confirm no unrelated tables changed
SELECT count(*) FROM current_officials; -- expect identical, still 9
SELECT count(*) FROM user_districts;    -- expect identical to pre-write count (unmeasured by this document's anon preflight; compare against your own authenticated pre-write count)

-- Whole-table totals against this document's recorded baseline (§3)
SELECT count(*) FROM districts;  -- expect 15 (12 baseline + 3 new)
SELECT count(*) FROM elections;  -- expect 17 (7 baseline + 10 new)
SELECT count(*) FROM candidates; -- expect 21 (11 baseline + 10 new)
```

## 7. Rollback SQL (exact literal IDs only — never name/pattern matching)

Preferred approach: if any §6 verification query fails **before** `COMMIT` is reached in the same session, issue `ROLLBACK` instead of `COMMIT` — cleanest possible outcome, zero trace. The SQL below is for the case where the transaction has already committed and reversal is still needed.

```sql
BEGIN;

-- Reverse Section 4 corrections first (restore exact pre-Package-A state)
UPDATE candidates SET name = 'Fredric Meltzer'
WHERE id = '6a7f3cca-2bfa-423b-a2e6-82ca0cfc291f' AND name = 'Rick Meltzer';

UPDATE candidates SET appeared_on_ballot = true
WHERE id = '6e14b71f-0a08-4623-a442-c444d5f9b276';

-- Delete the 10 candidates (children first, respecting FK order)
DELETE FROM candidates WHERE id IN (
  '44444444-0000-0000-0000-000000000001','44444444-0000-0000-0000-000000000002','44444444-0000-0000-0000-000000000003',
  '44444444-0000-0000-0000-000000000004','44444444-0000-0000-0000-000000000005','44444444-0000-0000-0000-000000000006',
  '44444444-0000-0000-0000-000000000007','44444444-0000-0000-0000-000000000008','44444444-0000-0000-0000-000000000009',
  '44444444-0000-0000-0000-00000000000a'
);

-- Delete the 10 elections
DELETE FROM elections WHERE id IN (
  '22222222-0000-0000-0000-000000000008','22222222-0000-0000-0000-000000000009','22222222-0000-0000-0000-000000000019',
  '22222222-0000-0000-0000-00000000000a','22222222-0000-0000-0000-00000000000b','22222222-0000-0000-0000-00000000001b',
  '22222222-0000-0000-0000-00000000001a','22222222-0000-0000-0000-00000000000c','22222222-0000-0000-0000-000000000017',
  '22222222-0000-0000-0000-000000000018'
);

-- Delete the 3 districts
DELETE FROM districts WHERE id IN (
  '11111111-0000-0000-0000-000000000008','11111111-0000-0000-0000-000000000009','11111111-0000-0000-0000-00000000000a'
);

COMMIT;
```

No rollback path touches `user_districts` or `current_officials` — Package A never writes to either, so there is nothing to reverse there under any failure scenario.

## 8. No-change confirmation

No SQL was executed. No `INSERT`/`UPDATE`/`DELETE`/`POST`/`PATCH` request was made against Supabase — every request in §3 was a read-only `GET`/`HEAD`. No service-role key or other secret was read; only the public `NEXT_PUBLIC_SUPABASE_ANON_KEY` already compiled into the client bundle was used. No `districts`, `elections`, `candidates`, `user_districts`, or `current_officials` row was created, modified, or deleted. No schema, RLS, grant, policy, function, or migration was changed. `ENABLE_CITY_COUNCIL_DISTRICT_WRITE` and `ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE` are unrelated to this workstream and were not inspected or changed. `CIVICMARKET_CURRENT_STATE.md` was intentionally not edited by this document, per instruction, because another session owns its current changes. No deployment occurred.

## 9. Execution result (08-20-2026)

Package A (§4) was executed by the project owner in the Supabase SQL Editor (no Supabase CLI/psql/DB-execution tool is available to this session — consistent with every prior real write in this project). Reported result: **Success. No rows returned.**

**PACKAGE A POST-WRITE VERIFICATION = PASS**

Verified read-only, immediately after, using the same anon-key PostgREST method as the §3 preflight — no writes performed during verification.

- `districts`: 15 total (12 baseline + 3 new) — matches expected +3 exactly.
- `elections`: 17 total (7 baseline + 10 new) — matches expected +10 exactly.
- `candidates`: 21 total (11 baseline + 10 new) — matches expected +10 exactly.
- `current_officials`: 9 — unchanged from baseline.
- `user_districts`: not independently countable via the anon key (owner-scoped RLS, same limitation as the §3 preflight) — the executed transaction contained no statement referencing this table, so it is structurally unaffected regardless.
- All 10 Package A candidate rows verified exactly at their approved `44444444-...` fixed IDs — names, offices, `is_incumbent`, `district_id`, `election_id` all match; all 10 have `appeared_on_ballot = true` and `archived_at = null`.
- Rick Meltzer correction: PASS — `6a7f3cca-...` now `name = 'Rick Meltzer'`; no duplicate "Fredric Meltzer" row remains.
- Steven Harrington correction: PASS — `6e14b71f-...` now `appeared_on_ballot = false`.
- Harrington `archived_at`: remained `null` — confirmed not archived by Package A, per Correction 1.
- Donna Mills: absent (0 rows).
- Ben "Zag" Zagrobelny: absent (0 rows).
- Statewide candidates: absent (0 rows — all 10 new offices are County Commissioner D2/D4 or State Representative D84/D85).
- Duplicate `name`+`district_id` check across all active candidates: 0.
- `ENABLE_CITY_COUNCIL_DISTRICT_WRITE` and `ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE`: both remain `false`, confirmed by direct source read, both untouched by this work.
- Deployment: none occurred.
- Rollback (§7): not required — no defect found.

## 10. Next step

Package A is complete and verified. **Next action: prepare Package B post-certification reconciliation** (§P4 of the source artifact — Mayor, City Council D1, City Council D3, County Commission D4 DEM line, School Board D1, School Board D5, and the newly-added School Board D3 Mills/Zagrobelny action). No Package B action may execute before the relevant certification: county canvassing board certification is expected no later than noon, August 26, 2026 (Fla. Stat. § 102.112); the County Commission D4 Democratic primary (276-vote margin) warrants specific extra caution per the source artifact's own risk note. No result-dependent write should be prepared for execution — only reviewed and preflighted — before its certification requirement is met.
