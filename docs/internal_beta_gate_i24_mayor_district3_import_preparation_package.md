# Internal Beta — Gate I24: Mayor and District 3 Import Preparation Package

## 1. Date and timestamp

Date: 08-08-2026
Timestamp: 06:15 am EST

This document is preparation and documentation only. It does not write to Supabase, insert/update/delete any row, modify source code, modify CSV files, modify schema/seeds/migrations/RLS/grants, or deploy. No SQL in this document has been executed.

## 2. Repository baseline

- Local path: `J:\CivicMarket`
- Branch: `master`
- Working tree: clean
- Up to date with `origin/master`
- Latest pushed commit:
  - `625d2f5` Update current state for Gate I23B
- Previous pushed commits:
  - `e28253d` Record Mayor and District 3 election date decision
  - `330f5dc` Resolve Mayor and District 3 open import decisions
  - `8d14ded` Update current state for Gate I23
  - `68d08c6` Add Mayor and District 3 import approval decision

## 3. Gate status

Complete. Preparation and documentation only. No database write, source-code change, CSV change, secret inspection, County Commission change, or deployment occurred.

## 4. Explicit approvals this package incorporates

The user explicitly approved the following six Gate I23B modeling decisions, for preparation and documentation purposes only (not authorizing any write):

1. Mayor district type: reuse `type = city_council`.
2. District 3 office normalization: future value `City Council District 3` (replacing `City Council`); District 1 office values not touched.
3. Candidate-source provenance: Option A — no new `candidates` column; `official_candidate_source_url` stays in the CSV/documentation only.
4. Hybrid import architecture: explicit reviewed SQL for prerequisite district/election rows, scoped race-specific candidate import, no broad delete/reinsert, District 1 fully preserved.
5. Mayor election date: `PSL Mayor 2026` → `election_date = 2026-08-18`.
6. District 3 election date: `PSL City Council D3 2026` → `election_date = 2026-08-18`.

Deferred and unresolved, unaffected by this package: the District 3 user-assignment mechanism, and the separate pre-existing District 1 election-date discrepancy (live `2026-11-03` vs. Gate I18's documented `August 18, 2026`). District 1 is not altered or normalized anywhere in this package.

## 5. Fresh read-only baseline (captured this gate, read-only, public key, no writes)

Using the same safe read-only method established and approved in Gate I22 (Supabase's public "publishable" key, read from the compiled client bundle — not `.env.local`, not a secret).

### 5a. Live candidates (all 4, unfiltered)

| id | name | office | is_incumbent | archived_at | district_id | election_id |
|---|---|---|---|---|---|---|
| `a3d23ac8-07de-4db4-8268-a7fc3dea5b0b` | Eric Reikenis | City Council District 1 | false | null | `11111111-...-000001` | `22222222-...-000001` |
| `6a7f3cca-2bfa-423b-a2e6-82ca0cfc291f` | Fredric Meltzer | City Council District 1 | false | null | `11111111-...-000001` | `22222222-...-000001` |
| `5a437915-542e-4266-99af-ad6f158b46bf` | Indony Baptiste | City Council District 1 | false | null | `11111111-...-000001` | `22222222-...-000001` |
| `51815a20-a9f2-4b04-ac23-d63b71011f08` | Kevin Zimmerman | City Council District 1 | false | null | `11111111-...-000001` | `22222222-...-000001` |

This is the exact **District 1 preservation baseline** — every one of these 7 fields for all 4 rows must be byte-for-byte identical after any future write.

### 5b. District 1 district row (unchanged, for baseline)

`id: 11111111-0000-0000-0000-000000000001, name: City Council District 1, type: city_council, city: Port St. Lucie, state: FL`

### 5c. District 1 election row (unchanged, for baseline)

`id: 22222222-0000-0000-0000-000000000001, name: PSL City Council D1 2026, election_date: 2026-11-03, district_id: 11111111-0000-0000-0000-000000000001`

**Note (context, not a decision reopened here):** a live spot-check of the other four existing "flat-assignment" elections (School Board D1, County Commission At-Large, FL House 85, FL Senate 27 — ids `22222222-...-000002` through `...000005`) shows all four also use `election_date: 2026-11-03`. This is additional context for the still-open, separately-deferred District 1 discrepancy (Section 4) — it is not re-litigated or acted on here.

### 5d. Mayor/District 3 absence re-confirmed (fresh, this gate)

- `districts` query for `name IN ('Mayor', 'City Council District 3')` → `[]` (still absent).
- `elections` query for `name IN ('PSL Mayor 2026', 'PSL City Council D3 2026')` → `[]` (still absent).

### 5e. Next available fixed ID slots confirmed free (fresh, this gate)

- `districts` ids `11111111-0000-0000-0000-000000000006` through `...000010` → all `[]` (free). Existing used low-range district ids: `...000001`-`...000005` (flat-assignment set) and `...000031`-`...000035` (County Commission District 1-5).
- `elections` ids `22222222-0000-0000-0000-000000000002` through `...000005` → already used (School Board D1, County Commission, FL House 85, FL Senate 27 respectively). `elections` ids `...000006` through `...000008` → all `[]` (free).

## 6. Exact IDs to be used

Following the existing fixed-UUID convention already established for `districts` (and, newly confirmed in this gate, also already used for `elections` — District 1's election is `22222222-...-000001`, not a random UUID as earlier gates assumed before this fresh query):

| Row | Proposed fixed ID |
|---|---|
| Mayor `districts` row | `11111111-0000-0000-0000-000000000006` |
| City Council District 3 `districts` row | `11111111-0000-0000-0000-000000000007` |
| `PSL Mayor 2026` `elections` row | `22222222-0000-0000-0000-000000000006` |
| `PSL City Council D3 2026` `elections` row | `22222222-0000-0000-0000-000000000007` |

**Candidate IDs are not pre-assigned.** Consistent with the existing District 1 precedent (Section 5a — none of the 4 live candidate IDs follow the fixed-UUID convention; they are standard `gen_random_uuid()` output), the 7 new candidate rows will receive database-generated IDs at actual insert time. No candidate ID is invented in this document.

## 7. Exact district rows (draft — not executed)

| name | type | city | state | id |
|---|---|---|---|---|
| Mayor | city_council | Port St. Lucie | FL | `11111111-0000-0000-0000-000000000006` |
| City Council District 3 | city_council | Port St. Lucie | FL | `11111111-0000-0000-0000-000000000007` |

## 8. Exact election rows (draft — not executed)

| name | election_date | district_id | id |
|---|---|---|---|
| PSL Mayor 2026 | 2026-08-18 | `11111111-0000-0000-0000-000000000006` | `22222222-0000-0000-0000-000000000006` |
| PSL City Council D3 2026 | 2026-08-18 | `11111111-0000-0000-0000-000000000007` | `22222222-0000-0000-0000-000000000007` |

## 9. Exact candidate rows (draft — not executed)

Office values use the approved normalization (District 3 → `City Council District 3`, not the CSV's current `City Council`). `bio`, `website`, `photo_url` are blank/`null` for all 7, matching the CSV and matching the existing District 1 candidates' current state. Per approved Provenance Option A, `official_candidate_source_url` is **not** inserted into any column — it is documented here only:

Source for all 7 (identical to all 4 existing District 1 candidates' source): `https://www.cityofpsl.com/Government/Your-City-Government/Departments/City-Clerk/Elections`

| name | office | district_id | election_id | is_incumbent | appeared_on_ballot |
|---|---|---|---|---|---|
| Shannon Martin | Mayor | `...000006` | `...000006` | **true** | true |
| Eric Strazzeri | Mayor | `...000006` | `...000006` | false | true |
| Steven Giordano | Mayor | `...000006` | `...000006` | false | true |
| Steven Harrington | Mayor | `...000006` | `...000006` | false | true |
| Fritz Alexandre | City Council District 3 | `...000007` | `...000007` | false | true |
| Jim Norton | City Council District 3 | `...000007` | `...000007` | false | true |
| Peter Overhuls | City Council District 3 | `...000007` | `...000007` | false | true |

## 10. Draft SQL — illustrative planning only, NOT approved for execution

```sql
-- ============================================================
-- DRAFT ONLY — NOT EXECUTED BY GATE I24 — REQUIRES SEPARATE
-- EXPLICIT WRITE-EXECUTION APPROVAL BEFORE ANY STATEMENT RUNS.
-- ============================================================

-- Step 1: prerequisite districts (2 rows)
INSERT INTO districts (id, name, type, city, state) VALUES
  ('11111111-0000-0000-0000-000000000006', 'Mayor', 'city_council', 'Port St. Lucie', 'FL'),
  ('11111111-0000-0000-0000-000000000007', 'City Council District 3', 'city_council', 'Port St. Lucie', 'FL');

-- Step 2: prerequisite elections (2 rows) — depends on Step 1
INSERT INTO elections (id, name, election_date, district_id) VALUES
  ('22222222-0000-0000-0000-000000000006', 'PSL Mayor 2026', '2026-08-18', '11111111-0000-0000-0000-000000000006'),
  ('22222222-0000-0000-0000-000000000007', 'PSL City Council D3 2026', '2026-08-18', '11111111-0000-0000-0000-000000000007');

-- Step 3: scoped candidate insert (7 rows) — depends on Steps 1-2. No DELETE anywhere in this package.
INSERT INTO candidates (name, office, district_id, election_id, is_incumbent, appeared_on_ballot, bio, website, photo_url) VALUES
  ('Shannon Martin',    'Mayor', '11111111-0000-0000-0000-000000000006', '22222222-0000-0000-0000-000000000006', true,  true, NULL, NULL, NULL),
  ('Eric Strazzeri',    'Mayor', '11111111-0000-0000-0000-000000000006', '22222222-0000-0000-0000-000000000006', false, true, NULL, NULL, NULL),
  ('Steven Giordano',   'Mayor', '11111111-0000-0000-0000-000000000006', '22222222-0000-0000-0000-000000000006', false, true, NULL, NULL, NULL),
  ('Steven Harrington', 'Mayor', '11111111-0000-0000-0000-000000000006', '22222222-0000-0000-0000-000000000006', false, true, NULL, NULL, NULL),
  ('Fritz Alexandre',   'City Council District 3', '11111111-0000-0000-0000-000000000007', '22222222-0000-0000-0000-000000000007', false, true, NULL, NULL, NULL),
  ('Jim Norton',        'City Council District 3', '11111111-0000-0000-0000-000000000007', '22222222-0000-0000-0000-000000000007', false, true, NULL, NULL, NULL),
  ('Peter Overhuls',    'City Council District 3', '11111111-0000-0000-0000-000000000007', '22222222-0000-0000-0000-000000000007', false, true, NULL, NULL, NULL);
```

Notes on this draft:
- No `DELETE` statement appears anywhere. No existing row (District 1 or otherwise) is touched.
- `candidates.id` is intentionally omitted from the column list so the `gen_random_uuid()` default generates it, matching District 1's precedent.
- This draft supersedes `scripts/import-real-psl-data.cjs` for this specific import — that script remains unmodified and unused, per Gate I23's finding that it is unsafe to run unchanged (single hardcoded district/election, unscoped candidate delete).
- Not executed. Not approved for execution by this gate.

## 11. Candidate-source provenance handling (per approved Option A)

- No column is added to `candidates`.
- The source URL (Section 9) is recorded in this document and should also be added to `data/real-psl-replacement/sources_inventory.csv` / `real_data_review_log.md`-style documentation at write time, matching the existing pattern already used for District 1, Mayor, and District 3 in those files (the `sources_inventory.csv` already has `accepted` rows dated 2026-07-04 for "Port St. Lucie Mayor" and "Port St. Lucie City Council District 3" candidate-source categories — no new CSV/documentation-inventory edit is required by this package beyond what already exists there).
- This does not block the Step 3 candidate insert (Section 10) — Provenance Option A means the source lives in the repository, not the database, exactly as it already does for District 1.

## 12. District 3 office-normalization handling

The draft SQL in Section 10 already uses the approved normalized value `City Council District 3` directly in the `INSERT` statement — it does not depend on `candidates_real.csv` being edited first, since the SQL statement's literal values are independent of the CSV.

**A future CSV edit remains a separate, not-yet-authorized action** (per the explicit "They do NOT authorize: ... CSV edits yet" boundary in the approval). Recommendation for the eventual write-execution gate: edit `data/real-psl-replacement/candidates_real.csv`'s three District 3 rows' `office` column from `City Council` to `City Council District 3` at or immediately before the actual write, so the CSV (the repository's source of truth) matches the database going forward and any future re-import stays consistent — but this remains explicitly deferred, not performed here.

## 13. Pre-write verification (to run immediately before any future execution, not run now)

1. `git status` clean.
2. Re-run Section 5d's exact queries — reconfirm Mayor/District 3 `districts` and `elections` rows are still absent (do not assume this gate's snapshot is still current at execution time).
3. Re-run Section 5e's exact ID-availability queries — reconfirm ids `...000006`/`...000007` (districts and elections) are still free.
4. Re-capture Section 5a-5c's exact District 1 baseline immediately before execution, to diff against post-write.
5. Confirm no candidate named Shannon Martin, Eric Strazzeri, Steven Giordano, Steven Harrington, Fritz Alexandre, Jim Norton, or Peter Overhuls already exists live (duplicate-name check).
6. Confirm the District 3 CSV office-value edit decision (Section 12) has been explicitly made one way or the other before executing Step 3, so the executed `office` values are a deliberate choice, not an oversight.
7. Confirm `ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE` is still `false` (unrelated system, standing safety check).

## 14. Post-write verification (to run immediately after any future execution, not run now)

1. Exactly 11 total live candidate rows (4 District 1 + 4 Mayor + 3 District 3).
2. Section 5a's 4 District 1 rows byte-for-byte unchanged (same 7 compared fields, same values).
3. Section 5b/5c's District 1 district/election rows byte-for-byte unchanged.
4. Exactly 2 new `districts` rows matching Section 7 exactly (including the exact ids used).
5. Exactly 2 new `elections` rows matching Section 8 exactly, each `election_date = 2026-08-18`.
6. Exactly 7 new `candidates` rows matching Section 9's names/offices/linkages exactly, each with a database-generated id, `archived_at: null`.
7. No duplicate candidate names or ids anywhere in the table.
8. No unexpected archived rows.
9. Zero new `candidate_positions` rows (side-effect check).
10. Zero new `match_scores` rows (side-effect check).
11. Zero new `voting_records` rows (side-effect check).
12. Zero new `user_districts` rows (this package does not touch personalization/assignment at all).
13. Current District-1-only beta-user ballot/profile behavior confirmed unchanged for the existing approved test account (Mayor/District 3 should not newly appear for that account, since no `user_districts` change occurs in this package).

## 15. Rollback plan (defined now, executed only if a future write fails verification)

Ordered, respecting FK dependency direction (children before parents), using only the exact IDs from Sections 6-9 — never a name-based or range-based match:

```sql
-- ROLLBACK — only if post-write verification (Section 14) fails.
-- Uses only the exact IDs from this package. Touches nothing else.

DELETE FROM candidates WHERE id IN (<the exact 7 new candidate ids captured immediately after Step 3 of the insert>);

DELETE FROM elections WHERE id IN (
  '22222222-0000-0000-0000-000000000006',
  '22222222-0000-0000-0000-000000000007'
);

DELETE FROM districts WHERE id IN (
  '11111111-0000-0000-0000-000000000006',
  '11111111-0000-0000-0000-000000000007'
);
```

- Rollback must never reference District 1's ids (`...000001` for district/election, or any of the 4 existing candidate ids from Section 5a), `user_districts`, `current_officials`, County Commission data, or the At-Large row.
- If a partial failure occurs mid-sequence (e.g., Step 3 fails after Steps 1-2 succeed), roll back only the steps that actually committed, in the same children-before-parents order.
- This rollback plan does not, by itself, authorize rollback execution — a failed post-write verification triggers a report-and-stop, with rollback execution itself requiring the same kind of explicit approval as the original write, per this repository's established safety pattern (matching the County Commission write-guard precedent).

## 16. District 1 preservation checks (summary — see Sections 5, 13, 14 for the full mechanics)

- Baseline captured in this gate (Section 5a-5c).
- Re-captured immediately before any future write (Section 13, item 4).
- Diffed immediately after any future write (Section 14, item 2-3).
- No `DELETE` statement in the draft SQL (Section 10) references District 1's ids, name, or any FK path that could reach it.
- No cascade risk: District 1's `districts`/`elections`/`candidates` rows are never targeted by any statement in this package.

## 17. Explicit final write-approval statement (template — not yet completed or signed)

Before any statement in Section 10 is executed, the following must be explicitly confirmed by the user, matching the discipline already established for the County Commission write-guard sequence in this repository:

- [ ] I have reviewed the exact draft SQL in Section 10 as written, with no changes needed, OR I am providing specific changes before execution.
- [ ] I confirm the exact IDs in Section 6 (districts `...000006`/`...000007`, elections `...000006`/`...000007`) are approved for use.
- [ ] I confirm the pre-write verification checklist (Section 13) will be run and must pass before execution.
- [ ] I confirm the post-write verification checklist (Section 14) will be run immediately after execution.
- [ ] I confirm the rollback plan (Section 15) is understood and I accept it as the recovery path if verification fails.
- [ ] I confirm this execution will be a manual, direct Supabase SQL Editor action (no automated script run), matching every prior precedent in this repository for this class of change.
- [ ] I confirm District 1 must remain completely untouched, and I understand this package does not resolve the separate District 1 election-date discrepancy (Section 4) — that remains open and separate.
- [ ] I confirm the District 3 CSV office-value edit decision (Section 12) — yes, edit the CSV at/before this write; or no, defer the CSV edit to a later date — before Step 3 executes.
- [ ] I confirm no deployment is being requested as part of this execution.
- [ ] I explicitly authorize execution of the Section 10 SQL now.

**No box above is checked by this document.** This template exists so that a future explicit approval can be given precisely and completely, matching this gate's own structure — it is not itself an approval.

## 18. Items intentionally out of scope for Gate I24

- **District 3 user-assignment mechanism** (Section 4) — remains deferred. This package's candidate/district/election rows can exist safely with zero user exposure, since no `user_districts` row is created or modified anywhere in this package, and `getCandidatesForDistricts` only returns candidates for districts a user actually holds (Section 14, item 12-13).
- **The separate District 1 election-date discrepancy** (Section 4) — remains open, untouched, and unresolved by this package.
- **Funding data for the 7 new candidates** — `funding_real.csv` currently has only the 4 District 1 rows; no Mayor/District 3 funding rows exist and none are prepared here. This is not a blocker: the app's existing `getCandidateFunding` already handles a missing funding row gracefully (renders "No funding data yet." — the same safe pattern already live and tested for other cases), so candidate profiles for the 7 new candidates would render correctly with no funding section populated until a separately-approved funding-data gate addresses it.
- **`ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE`** — untouched, remains `false`, unrelated to this package.

## 19. No-change confirmation

Gate I24 made no changes to: `candidates`, `elections`, `districts`, `user_districts`, `voting_records`, `candidate_positions`, `match_scores`, `civic_dna`, `civic_dna_answers`, `current_officials`, `officials_for_user`, `src/lib/officials.ts`, `CurrentOfficialsSection`, `compute-match-scores` logic, `MatchScoreRing`, the ballot page, the candidate profile, the onboarding pages, the Data Sources page, `scripts/import-real-psl-data.cjs`, `scripts/validate-real-psl-csvs.cjs`, `candidates_real.csv` or any other CSV file, `funding_real.csv`, `sources_inventory.csv`, `real_data_review_log.md`, schema, tables, seeds, migrations, RLS, grants, any other source code, PowerShell scripts, environment files, the County Commission write guard, the At-Large row, or deployment state.

No Supabase write (INSERT/UPDATE/DELETE) was performed — all queries in this gate were read-only `GET` requests using the public, non-secret Supabase key, the same method already used and approved in Gate I22. No candidate, district, or election row was created, modified, or deleted. No candidate was scored or ranked. No political recommendation was produced. No Claude or Anthropic API call was made. No secret file was inspected. `ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE` remains `false`. No County Commission District 1-5 write was performed. No deployment occurred. `CIVICMARKET_CURRENT_STATE.md` was not modified by this gate.
