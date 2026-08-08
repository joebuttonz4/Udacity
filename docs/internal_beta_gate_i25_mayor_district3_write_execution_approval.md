# Internal Beta — Gate I25: Mayor and District 3 Write Execution Approval

## 1. Date and timestamp

Date: 08-08-2026
Timestamp: 06:11 am EST

This document is the final approval package before any database write. It does not execute SQL, write to Supabase, modify CSV files, modify source code, or deploy.

## 2. Repository baseline

- Local path: `J:\CivicMarket`
- Branch: `master`
- Working tree: clean
- Up to date with `origin/master`
- Latest pushed commit: `3489e30` Update current state for Gate I24
- Previous pushed commits: `6c0cd2e` Add Mayor and District 3 import preparation package, `625d2f5` Update current state for Gate I23B, `e28253d` Record Mayor and District 3 election date decision, `330f5dc` Resolve Mayor and District 3 open import decisions

## 3. Purpose

Prepare an exact, auditable approval package for one scoped future Mayor/District 3 database write — building directly on Gate I24's preparation package, adding the explicit pre-write checks, allowed write sequence, forbidden-action list, expected post-write state, rollback package, and an unchecked final approval statement. No SQL is executed by this gate.

## 4. Scoped future write — exact contents

### District rows

1. **Mayor**
   - id = `11111111-0000-0000-0000-000000000006`
   - name = `Mayor`
   - type = `city_council`
   - city = `Port St. Lucie`
   - state = `FL`

2. **City Council District 3**
   - id = `11111111-0000-0000-0000-000000000007`
   - name = `City Council District 3`
   - type = `city_council`
   - city = `Port St. Lucie`
   - state = `FL`

### Election rows

1. **PSL Mayor 2026**
   - id = `22222222-0000-0000-0000-000000000006`
   - district_id = `11111111-0000-0000-0000-000000000006` (Mayor district above)
   - election_date = `2026-08-18`

2. **PSL City Council D3 2026**
   - id = `22222222-0000-0000-0000-000000000007`
   - district_id = `11111111-0000-0000-0000-000000000007` (District 3 above)
   - election_date = `2026-08-18`

### Candidate rows — exactly seven

**Mayor** (district_id `...000006`, election_id `...000006`):
| name | office | is_incumbent | appeared_on_ballot | bio | website | photo_url |
|---|---|---|---|---|---|---|
| Shannon Martin | Mayor | **true** | true | null | null | null |
| Eric Strazzeri | Mayor | false | true | null | null | null |
| Steven Giordano | Mayor | false | true | null | null | null |
| Steven Harrington | Mayor | false | true | null | null | null |

**City Council District 3** (district_id `...000007`, election_id `...000007`) — using the approved normalized office value, not the CSV's current `City Council`:
| name | office | is_incumbent | appeared_on_ballot | bio | website | photo_url |
|---|---|---|---|---|---|---|
| Fritz Alexandre | City Council District 3 | false | true | null | null | null |
| Jim Norton | City Council District 3 | false | true | null | null | null |
| Peter Overhuls | City Council District 3 | false | true | null | null | null |

All remaining material fields (`bio`, `website`, `photo_url`) match `candidates_real.csv`'s current blank values for all seven rows, identical to the existing 4 live District 1 candidates' current state. Candidate `id` values are not pre-assigned — they will be database-generated at insert time, matching the District 1 precedent. **The CSV is not edited by Gate I25** — the `office = City Council District 3` value above is used directly in the future INSERT statement, per Gate I24 Section 12's already-documented approach.

## 5. Required pre-write checks (to run immediately before any future write, not run now)

| # | Check | Command / query |
|---|---|---|
| 1 | Git working tree clean | `git status --short` → no output |
| 2 | Correct branch | `git branch --show-current` → `master` |
| 3 | Exact four District 1 candidates still live | `GET /rest/v1/candidates?select=id,name,office,is_incumbent,archived_at,district_id,election_id&order=name.asc` → exactly the 4 rows from Gate I24 Section 5a, byte-for-byte |
| 4 | District 1 district/election unchanged | `GET /rest/v1/districts?select=*&id=eq.11111111-0000-0000-0000-000000000001` and `GET /rest/v1/elections?select=*&id=eq.22222222-0000-0000-0000-000000000001` → match Gate I24 Section 5b/5c exactly |
| 5 | Mayor district ID unused | `GET /rest/v1/districts?select=id&id=eq.11111111-0000-0000-0000-000000000006` → `[]` |
| 6 | District 3 district ID unused | `GET /rest/v1/districts?select=id&id=eq.11111111-0000-0000-0000-000000000007` → `[]` |
| 7 | Mayor election ID unused | `GET /rest/v1/elections?select=id&id=eq.22222222-0000-0000-0000-000000000006` → `[]` |
| 8 | District 3 election ID unused | `GET /rest/v1/elections?select=id&id=eq.22222222-0000-0000-0000-000000000007` → `[]` |
| 9 | All seven candidate names absent live | `GET /rest/v1/candidates?select=id,name&name=in.(Shannon Martin,Eric Strazzeri,Steven Giordano,Steven Harrington,Fritz Alexandre,Jim Norton,Peter Overhuls)` → `[]` |
| 10 | No conflicting active/archived candidate duplicates | Same query as #9 run without an `archived_at` filter, confirming `[]` covers both active and archived rows |
| 11 | Candidate ID-generation behavior understood | Confirmed in Gate I24 Section 5a/6: candidate IDs are `gen_random_uuid()`-generated, not deterministic; district/election IDs are deterministic and fixed per Section 4 above |
| 12 | Expected election dates confirmed | Both new `elections` rows use `election_date = 2026-08-18`, per the Gate I23B-approved Primary Election date convention; this is re-stated, not re-derived, at write time |
| 13 | Expected candidate fields confirmed | Table in Section 4 above matches `candidates_real.csv`'s current values for all fields except the approved District 3 office normalization |

All 13 checks must pass before any statement in Section 6 executes. Any failure stops execution and triggers a report, not a workaround.

## 6. Exact allowed write sequence

The only allowed order:

1. Insert Mayor district.
2. Insert District 3 district.
3. Verify both (re-query by exact ID, confirm fields match Section 4).
4. Insert Mayor election.
5. Insert District 3 election.
6. Verify both (re-query by exact ID, confirm fields match Section 4, confirm `district_id` FK is correct).
7. Insert exactly four Mayor candidates.
8. Insert exactly three District 3 candidates.
9. Run full post-write verification (Section 8).

No broad delete appears anywhere in this sequence. `scripts/import-real-psl-data.cjs` is not run. No `user_districts` row is created at any step.

## 7. Explicit forbidden actions (during future execution)

Do **NOT**, at any point during execution of Section 6:
- Delete District 1 candidates.
- Update District 1 candidates.
- Modify the District 1 district row.
- Modify the District 1 election row.
- "Fix" the District 1 election-date discrepancy (Section 11).
- Create any District 3 `user_districts` row.
- Assign District 3 from ZIP.
- Add District 3 to `ALL_PSL_DISTRICTS`.
- Create `candidate_positions` rows.
- Create `match_scores` rows.
- Create `voting_records` rows.
- Alter County Commission data.
- Alter the At-Large row.
- Deploy.

## 8. Post-write expected state (to verify immediately after any future write, not run now)

- `candidates` total = 11.
- District 1 count = 4 (unchanged, byte-for-byte, per Section 5 check #3).
- Mayor count = 4.
- District 3 count = 3.
- All seven new candidate names present: Shannon Martin, Eric Strazzeri, Steven Giordano, Steven Harrington, Fritz Alexandre, Jim Norton, Peter Overhuls.
- All District 1 rows unchanged (candidates, district, election).
- Both new `districts` rows present, matching Section 4 exactly.
- Both new `elections` rows present, matching Section 4 exactly.
- `election_date = 2026-08-18` on both new election rows.
- No duplicate active candidates.
- No unexpected archived rows.
- `candidate_positions` side effects = 0.
- `match_scores` side effects = 0.
- `voting_records` side effects = 0.
- No `user_districts` writes.
- No County Commission writes.

## 9. Rollback package

Scoped strictly to rows newly created by this specific execution, using exact IDs wherever possible:

```sql
-- ROLLBACK — only if post-write verification (Section 8) fails.
-- Not executed by Gate I25. Uses only the exact IDs below (districts/elections)
-- and the exact 7 candidate IDs captured immediately after Step 7-8 of Section 6.
-- Touches nothing else — no District 1 ID appears anywhere in this rollback.

-- Order: candidates first, then elections, then districts.

DELETE FROM candidates WHERE id IN (<the exact 7 new candidate ids captured at insert time>);

DELETE FROM elections WHERE id IN (
  '22222222-0000-0000-0000-000000000006',
  '22222222-0000-0000-0000-000000000007'
);

DELETE FROM districts WHERE id IN (
  '11111111-0000-0000-0000-000000000006',
  '11111111-0000-0000-0000-000000000007'
);
```

- Rollback order: (1) seven new candidate rows, (2) two new election rows, (3) two new district rows.
- Rollback must use exact inserted IDs whenever possible — candidate IDs must be captured immediately after Section 6, Steps 7-8, since they are database-generated and unknown in advance.
- No District 1 ID appears in this rollback under any circumstance.
- No broad `DELETE` condition (by name, by date, by office, or by any range) is used anywhere in this rollback.
- Rollback is not executed by Gate I25 — it is defined now so it is ready if a future execution's post-write verification (Section 8) fails.

## 10. Final approval statement (unchecked — user must approve in a later message)

> I explicitly approve the scoped Mayor and City Council District 3 database write described in Gate I25.
>
> I approve creation of:
> - Mayor district ID `11111111-0000-0000-0000-000000000006`
> - City Council District 3 district ID `11111111-0000-0000-0000-000000000007`
> - PSL Mayor 2026 election ID `22222222-0000-0000-0000-000000000006` with election_date `2026-08-18`
> - PSL City Council D3 2026 election ID `22222222-0000-0000-0000-000000000007` with election_date `2026-08-18`
> - exactly four Mayor candidate rows
> - exactly three City Council District 3 candidate rows
>
> I approve District 3 office normalization to: City Council District 3.
>
> I approve Provenance Option A.
>
> I approve the scoped hybrid SQL/import architecture.
>
> I understand that:
> - no District 3 user assignment is included
> - District 1 data must remain unchanged
> - the District 1 election-date discrepancy remains out of scope
> - no candidate_positions, match_scores, or voting_records rows will be created
> - no deployment is included
> - rollback is scoped only to rows introduced by this execution

**This statement is not marked approved by this document.** The user must explicitly approve the write in a later message before any statement in Section 6 executes.

## 11. Remaining unresolved / out-of-scope items (unchanged, carried forward)

1. District 3 user-assignment mechanism — still requires design, not part of this write.
2. The pre-existing District 1 election-date discrepancy (live `2026-11-03` vs. Gate I18's documented `August 18, 2026`) — remains open, untouched, not corrected by this write.

## 12. Gate I25 outcome

**READY FOR EXPLICIT WRITE APPROVAL.**

**DATABASE WRITE NOT APPROVED YET.**

## 13. Gate I25 safety confirmation

- No SQL executed.
- No database write.
- No CSV edit.
- No source-code change.
- No `user_districts` write.
- No District 1 modification.
- No County Commission change.
- No deployment.
- No secret inspection.

`ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE` remains `false`.
