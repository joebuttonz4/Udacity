# Candidate Import Package C1 — Statewide Ballot Model, Certification-Independent Subset

Status: **Architecture approved. §6a executed and verified PASS (`docs/candidate_import_package_c1_6a_execution_result.md`). Fresh-user onboarding activation applied and verified (§12). §6b existing-user backfill EXECUTED and VERIFICATION PASSED (§15) — all 8 eligible existing users now hold the Florida Statewide anchor.** Both existing write guards (`ENABLE_CITY_COUNCIL_DISTRICT_WRITE`, `ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE`) remain `false`, untouched — this workstream introduces no new guard because it introduces no new write-capable API route.

Date: 08-20-2026

## 0. Relationship to Package C

`docs/candidate_import_package_c_statewide.md` ("Package C") is the source of the Option A architecture design (§2-3), the DOE/DOS-verified 39-candidate roster (§4), and the full 39-candidate draft SQL (§6). That document explicitly states in §9: "One approval remains outstanding before any part of Package C may execute: explicit approval of the Option A architecture." **That approval was given as this session's task instructions**, which specify exactly Option A: one Florida Statewide ballot anchor, 4 statewide office district rows, explicit Florida statewide ballot eligibility, no schema change, FL House/Senate remain exact district, Current Officials remain untouched — matching Package C §2-3 verbatim.

Package C1 is **not** a redesign. It is the certification-independent subset of Package C, narrowed per this session's explicit instruction to the 14 candidates that need no election-results source and no certification (§4/§5 of Package C already classified these 14 as "qualified, no primary contest, advances to November" purely from qualification-roster structure — see Package C §4 for the sourcing). The 25 certification-dependent candidates, and their own execution, remain exactly as deferred in Package C §9 — untouched by this document.

Package C's own no-change confirmation (§10) and its "not modified" statement about `CIVICMARKET_CURRENT_STATE.md` / `docs/work/current_task_state.md` are unaffected — this is a new, separate document.

## 1. Baseline (this session)

- Branch: `master`, working tree clean at start.
- `git log --oneline -10` at start:
  ```
  b1cd134 Finalize official statewide candidate roster
  1f0f552 Review controlled beta launch priorities
  beba693 Prepare statewide candidate import package
  74ea0e6 Finalize Shannon candidate evidence pilot handoff
  103e507 Prepare Package B post-certification reconciliation (not executed)
  ```
- No uncommitted changes, no untracked files, no concurrent-owned files present.

## 2. Critical requirement — statewide eligibility for BOTH fresh and existing Florida users, without false representation

Package C §3 already designed the fresh-user path (a `ZIP_MANAGED_DISTRICTS` entry for the Florida Statewide anchor, applied through onboarding) but left **existing users** unaddressed — an existing PSL user who already completed onboarding will not automatically re-run the ZIP step, so a fresh-user-only fix would silently exclude every already-onboarded beta user from statewide races indefinitely.

Two mechanisms are required, sequenced differently, and both preserve the same representation-isolation guarantee already proven for the Mayor and County Commission At-Large anchors (the anchor and the 4 office districts are never referenced by any `current_officials` row):

| User population | Mechanism | Sequencing | False-representation risk |
|---|---|---|---|
| **Fresh** (onboards after Package C1's district rows go live) | Add the Florida Statewide anchor to `ZIP_MANAGED_DISTRICTS` (`src/app/onboarding/zip/page.tsx`), exactly as Package C §3 drafted. | Must be applied **together with, or strictly after**, the district rows exist live — applying it first would `INSERT` a `user_districts` row with a foreign key to a nonexistent `districts.id`, breaking onboarding for every user (same sequencing rule Package C §3/§8 already documented; same pattern already followed for Mayor in Gate I26 → I27). **Drafted in §5 below, not applied to the source file this session.** | None — `user_districts` insert only ever references the real anchor row; anchor is never linked to `current_officials`. |
| **Existing** (already onboarded, will not necessarily resubmit ZIP) | A one-time, additive-only SQL backfill: every user who already holds the County Commission At-Large row or the Mayor row (i.e., every already-onboarded PSL user, since both are already `ZIP_MANAGED_DISTRICTS` entries) receives the Florida Statewide anchor row too. | Must run **after** the district rows exist live (the anchor row must exist for the FK to succeed) — naturally the same execution batch as the C1 district/election/candidate SQL, or immediately after it. **Drafted in §6 below, not executed.** | None — this statement only ever `INSERT`s the anchor `district_id`; it never touches, deletes, or infers any other `user_districts` row, and never writes to `current_officials`. `ON CONFLICT (user_id, district_id) DO NOTHING` (the table's existing `UNIQUE(user_id, district_id)` constraint, confirmed in `Reference Files/civicmarket_schema_v4.sql:95`) makes it safe to re-run. |

This is the same "verified anchor, never inferred, never linked to representation" pattern already used for County Commission At-Large and Mayor — extended with a one-time backfill because, unlike Mayor (added in Gate I27 while the beta population was still small enough that a resubmission-based rollout was accepted), the Florida Statewide anchor needs to reach the *entire* existing PSL population immediately, not only future onboardings.

## 3. Package C1 scope — exact subset

| Item | Package C (full) | Package C1 (this document) |
|---|---|---|
| District rows | 5 (anchor + 4 offices) | **Same 5** — all 4 statewide offices need a district row regardless of how many of their candidates are certification-independent yet (Chief Financial Officer has zero certification-independent candidates, but its district/election row is still needed for the architecture itself and for the later certification-dependent CFO candidates to attach to). |
| Election rows | 4 (one per office) | **Same 4**, same reasoning. |
| Candidate rows | 39 (14 certification-independent + 25 certification-dependent) | **14 only** — the certification-independent subset. The 25 certification-dependent candidates are explicitly **not** part of this document's SQL and remain exactly as deferred in Package C §9. |
| Existing-user backfill | Not designed | **New in this document** (§2, §6) — resolves this session's critical requirement. |
| `ballotEligibility.ts` code change | Drafted, not applied | **Applied this session** (§4) — confirmed safe/inert by design (see §4). |
| Onboarding `zip/page.tsx` code change | Drafted, not applied | **Still drafted, not applied** (§5) — sequencing risk unchanged from Package C. |

## 4. `ballotEligibility.ts` — applied this session

Unlike the onboarding change, this change is genuinely inert until data exists: `findRule()` only matches a rule when a user actually holds a district whose `(city, state, type)` matches the rule, and no `city: 'Statewide'` district row exists yet anywhere in the live database (confirmed live, §7). Applying it early carries none of the onboarding change's foreign-key risk, and doing so now completes the code-side half of the architecture approved this session.

Change applied to `src/lib/ballotEligibility.ts`:
- `BallotEligibilityMode` union gained `'statewide'`.
- `JurisdictionRule.mode` union gained `'statewide'`.
- One new rule added to `BALLOT_ELIGIBILITY_RULES`: `{ city: 'Statewide', state: 'FL', mode: 'statewide', types: ['statewide'], reason: '...' }`.

No change to `findRule`, `getBallotEligibilityMode`, or `getExpansionJurisdictions` — all three already operate generically over any rule shape, exactly as Package C §3 predicted. No change to `src/lib/candidates.ts` — `resolveBallotDistrictIds` already branches only on `mode === 'exact'` vs. everything else.

`npm run build` passed (28 routes, no errors — unchanged from baseline). `npm run lint` reported only the same 5 known pre-existing `scripts/*.cjs` errors, nothing new.

## 5. Onboarding `zip/page.tsx` — drafted, not applied (sequencing)

Unchanged from Package C §3's draft, reproduced here for completeness. **Not applied to the source file this session** — applying it before the Florida Statewide anchor district row exists live would attempt to `INSERT` a `user_districts` row referencing a nonexistent `districts.id`, violating the foreign key and breaking onboarding for every user immediately if ever deployed in that order (no deployment target exists yet per `CIVICMARKET_CURRENT_STATE.md`'s Milestone 2B, but the code should not be landed ahead of its data regardless, per the same discipline already applied throughout this project).

```ts
const ZIP_MANAGED_DISTRICTS = [
  { id: '11111111-0000-0000-0000-000000000003', name: 'St. Lucie County Commission At-Large', scope: 'county' },
  { id: '11111111-0000-0000-0000-000000000006', name: 'Mayor', scope: 'city' },
  { id: '11111111-0000-0000-0000-00000000000b', name: 'Florida Statewide', scope: 'state' }, // NEW — apply only together with, or after, the district row going live
];
```

This must be applied in the same future gate as, or immediately after, §6's district-row SQL executes — never before.

## 6. Draft SQL — **NOT AUTHORIZED FOR EXECUTION**

### 6a. District, election, and 14 certification-independent candidate rows

```sql
-- ============================================================
-- PACKAGE C1 — STATEWIDE BALLOT MODEL, CERTIFICATION-INDEPENDENT SUBSET
-- NOT AUTHORIZED FOR EXECUTION
-- Architecture (Option A) approved this session, matching
-- docs/candidate_import_package_c_statewide.md §2-3 verbatim.
-- 14 candidates only -- the 25 certification-dependent candidates
-- remain deferred exactly as in Package C §9.
-- ============================================================
BEGIN;

-- SECTION 1: District rows (anchor + 4 offices) -- same 5 as Package C §6
INSERT INTO districts (id, name, type, city, state) VALUES
  ('11111111-0000-0000-0000-00000000000b', 'Florida Statewide', 'statewide', 'Statewide', 'FL'),
  ('11111111-0000-0000-0000-00000000000c', 'Governor / Lieutenant Governor', 'statewide', 'Statewide', 'FL'),
  ('11111111-0000-0000-0000-00000000000d', 'Attorney General', 'statewide', 'Statewide', 'FL'),
  ('11111111-0000-0000-0000-00000000000e', 'Chief Financial Officer', 'statewide', 'Statewide', 'FL'),
  ('11111111-0000-0000-0000-00000000000f', 'Commissioner of Agriculture', 'statewide', 'Statewide', 'FL')
ON CONFLICT (id) DO NOTHING;

-- SECTION 2: Election rows (one per office) -- same 4 as Package C §6
INSERT INTO elections (id, name, election_date, district_id) VALUES
  ('22222222-0000-0000-0000-00000000001c', 'Florida Governor 2026',        '2026-11-03', '11111111-0000-0000-0000-00000000000c'),
  ('22222222-0000-0000-0000-00000000001d', 'Florida Attorney General 2026','2026-11-03', '11111111-0000-0000-0000-00000000000d'),
  ('22222222-0000-0000-0000-00000000001e', 'Florida CFO 2026',             '2026-11-03', '11111111-0000-0000-0000-00000000000e'),
  ('22222222-0000-0000-0000-00000000001f', 'Florida Ag Commissioner 2026', '2026-11-03', '11111111-0000-0000-0000-00000000000f')
ON CONFLICT (id) DO NOTHING;

-- SECTION 3: 14 certification-independent candidate rows only.
-- No `party` column exists on `candidates` (same gap already documented
-- in Package C/B) -- party is recorded here in comments for reference only.
INSERT INTO candidates (id, name, office, is_incumbent, district_id, election_id, appeared_on_ballot) VALUES
  -- Governor / Lieutenant Governor (11) -- district_id '...00c', election_id '...001c'
  ('44444444-0000-0000-0000-000000000014', 'Dean Abrams', 'Governor / Lieutenant Governor', false, '11111111-0000-0000-0000-00000000000c', '22222222-0000-0000-0000-00000000001c', true), -- NPA
  ('44444444-0000-0000-0000-000000000015', 'Kathy Anderson', 'Governor / Lieutenant Governor', false, '11111111-0000-0000-0000-00000000000c', '22222222-0000-0000-0000-00000000001c', true), -- WRI
  ('44444444-0000-0000-0000-000000000016', 'Charles Burkett', 'Governor / Lieutenant Governor', false, '11111111-0000-0000-0000-00000000000c', '22222222-0000-0000-0000-00000000001c', true), -- NPA
  ('44444444-0000-0000-0000-000000000019', 'Jeffrey Datto', 'Governor / Lieutenant Governor', false, '11111111-0000-0000-0000-00000000000c', '22222222-0000-0000-0000-00000000001c', true), -- NPA
  ('44444444-0000-0000-0000-00000000001a', 'David DeJesus', 'Governor / Lieutenant Governor', false, '11111111-0000-0000-0000-00000000000c', '22222222-0000-0000-0000-00000000001c', true), -- WRI
  ('44444444-0000-0000-0000-00000000001b', 'Richard Dembinsky', 'Governor / Lieutenant Governor', false, '11111111-0000-0000-0000-00000000000c', '22222222-0000-0000-0000-00000000001c', true), -- WRI
  ('44444444-0000-0000-0000-00000000001c', 'Moliere Dimanche', 'Governor / Lieutenant Governor', false, '11111111-0000-0000-0000-00000000000c', '22222222-0000-0000-0000-00000000001c', true), -- NPA
  ('44444444-0000-0000-0000-000000000022', 'Scott Jewett', 'Governor / Lieutenant Governor', false, '11111111-0000-0000-0000-00000000000c', '22222222-0000-0000-0000-00000000001c', true), -- LPF
  ('44444444-0000-0000-0000-000000000026', 'Desmond Meade', 'Governor / Lieutenant Governor', false, '11111111-0000-0000-0000-00000000000c', '22222222-0000-0000-0000-00000000001c', true), -- NPA
  ('44444444-0000-0000-0000-000000000027', 'Erik Morris', 'Governor / Lieutenant Governor', false, '11111111-0000-0000-0000-00000000000c', '22222222-0000-0000-0000-00000000001c', true), -- WRI
  ('44444444-0000-0000-0000-00000000002c', 'Frank Russo', 'Governor / Lieutenant Governor', false, '11111111-0000-0000-0000-00000000000c', '22222222-0000-0000-0000-00000000001c', true), -- NPA
  -- Attorney General (2) -- district_id '...00d', election_id '...001d'
  ('44444444-0000-0000-0000-000000000030', 'Jose Javier Rodriguez', 'Attorney General', false, '11111111-0000-0000-0000-00000000000d', '22222222-0000-0000-0000-00000000001d', true), -- DEM, sole qualifier
  ('44444444-0000-0000-0000-000000000031', 'James Uthmeier', 'Attorney General', false, '11111111-0000-0000-0000-00000000000d', '22222222-0000-0000-0000-00000000001d', true), -- REP, sole qualifier
  -- Commissioner of Agriculture (1) -- district_id '...00f', election_id '...001f'
  ('44444444-0000-0000-0000-000000000036', 'Kyle "KC" Gibson', 'Commissioner of Agriculture', false, '11111111-0000-0000-0000-00000000000f', '22222222-0000-0000-0000-00000000001f', true) -- WRI
ON CONFLICT (id) DO NOTHING;

COMMIT;
```

**Note:** Chief Financial Officer has zero certification-independent candidates (all 4 CFO qualifiers are certification-dependent, per Package C §4) — its district/election row is created here regardless, per §3's reasoning, but will show zero candidates until Package C's remaining execution.

### 6b. Existing-user Florida Statewide anchor backfill

```sql
-- ============================================================
-- PACKAGE C1 -- EXISTING-USER FLORIDA STATEWIDE ANCHOR BACKFILL
-- NOT AUTHORIZED FOR EXECUTION
-- Must run only after 6a's district rows exist live (FK requirement).
-- Additive only -- never deletes, updates, or infers any other
-- user_districts row. Never touches current_officials.
-- ============================================================

-- STEP 1 (run first, capture the output before running STEP 2 --
-- this exact list is the rollback scope, not a broad predicate):
SELECT DISTINCT ud.user_id
FROM user_districts ud
WHERE ud.district_id IN (
  '11111111-0000-0000-0000-000000000003', -- St. Lucie County Commission At-Large
  '11111111-0000-0000-0000-000000000006'  -- Mayor
)
AND ud.user_id NOT IN (
  SELECT user_id FROM user_districts WHERE district_id = '11111111-0000-0000-0000-00000000000b'
)
ORDER BY ud.user_id;
-- Save this list. It is the exact set of users this backfill will affect.

-- STEP 2:
BEGIN;
INSERT INTO user_districts (user_id, district_id, scope)
SELECT DISTINCT ud.user_id, '11111111-0000-0000-0000-00000000000b', 'state'
FROM user_districts ud
WHERE ud.district_id IN (
  '11111111-0000-0000-0000-000000000003',
  '11111111-0000-0000-0000-000000000006'
)
ON CONFLICT (user_id, district_id) DO NOTHING;
COMMIT;
```

**Verification SQL (run after 6b executes):**
```sql
-- Row count matches STEP 1's captured list size
SELECT count(*) FROM user_districts WHERE district_id = '11111111-0000-0000-0000-00000000000b';

-- No user received a duplicate anchor row (structurally guaranteed by
-- UNIQUE(user_id, district_id), checked anyway)
SELECT user_id, count(*) FROM user_districts
WHERE district_id = '11111111-0000-0000-0000-00000000000b'
GROUP BY user_id HAVING count(*) > 1; -- expect 0 rows

-- current_officials unchanged
SELECT count(*) FROM current_officials; -- expect unchanged from immediate pre-write baseline

-- No City Council District 1/3 row was touched (structural -- this
-- statement contains no DELETE/UPDATE, INSERT-only)
```

**Rollback SQL (exact-ID scoped, using STEP 1's captured list — never a bare predicate delete):**
```sql
BEGIN;
DELETE FROM user_districts
WHERE district_id = '11111111-0000-0000-0000-00000000000b'
  AND user_id IN ( /* paste STEP 1's captured user_id list here */ );
COMMIT;
```

### 6c. Verification and rollback for 6a (districts/elections/14 candidates)

```sql
SELECT count(*) FROM districts WHERE id IN (
  '11111111-0000-0000-0000-00000000000b','11111111-0000-0000-0000-00000000000c',
  '11111111-0000-0000-0000-00000000000d','11111111-0000-0000-0000-00000000000e',
  '11111111-0000-0000-0000-00000000000f'
); -- expect 5

SELECT count(*) FROM elections WHERE id IN (
  '22222222-0000-0000-0000-00000000001c','22222222-0000-0000-0000-00000000001d',
  '22222222-0000-0000-0000-00000000001e','22222222-0000-0000-0000-00000000001f'
); -- expect 4

SELECT count(*) FROM candidates WHERE id IN (
  '44444444-0000-0000-0000-000000000014','44444444-0000-0000-0000-000000000015',
  '44444444-0000-0000-0000-000000000016','44444444-0000-0000-0000-000000000019',
  '44444444-0000-0000-0000-00000000001a','44444444-0000-0000-0000-00000000001b',
  '44444444-0000-0000-0000-00000000001c','44444444-0000-0000-0000-000000000022',
  '44444444-0000-0000-0000-000000000026','44444444-0000-0000-0000-000000000027',
  '44444444-0000-0000-0000-00000000002c','44444444-0000-0000-0000-000000000030',
  '44444444-0000-0000-0000-000000000031','44444444-0000-0000-0000-000000000036'
); -- expect 14

SELECT count(*) FROM candidates
WHERE id LIKE '44444444-0000-0000-0000-00000000%'
  AND (archived_at IS NOT NULL OR appeared_on_ballot IS NOT TRUE); -- expect 0

SELECT count(*) FROM current_officials; -- expect unchanged from pre-write baseline (9, confirmed live §7)
```

```sql
-- Rollback for 6a (child-to-parent order; exact literal IDs only)
BEGIN;
DELETE FROM candidates WHERE id IN (
  '44444444-0000-0000-0000-000000000014','44444444-0000-0000-0000-000000000015',
  '44444444-0000-0000-0000-000000000016','44444444-0000-0000-0000-000000000019',
  '44444444-0000-0000-0000-00000000001a','44444444-0000-0000-0000-00000000001b',
  '44444444-0000-0000-0000-00000000001c','44444444-0000-0000-0000-000000000022',
  '44444444-0000-0000-0000-000000000026','44444444-0000-0000-0000-000000000027',
  '44444444-0000-0000-0000-00000000002c','44444444-0000-0000-0000-000000000030',
  '44444444-0000-0000-0000-000000000031','44444444-0000-0000-0000-000000000036'
);
DELETE FROM elections WHERE id IN (
  '22222222-0000-0000-0000-00000000001c','22222222-0000-0000-0000-00000000001d',
  '22222222-0000-0000-0000-00000000001e','22222222-0000-0000-0000-00000000001f'
);
DELETE FROM districts WHERE id IN (
  '11111111-0000-0000-0000-00000000000b','11111111-0000-0000-0000-00000000000c',
  '11111111-0000-0000-0000-00000000000d','11111111-0000-0000-0000-00000000000e',
  '11111111-0000-0000-0000-00000000000f'
);
COMMIT;
```

**Execution order requirement:** 6a must execute before 6b (6b's FK target, the Florida Statewide anchor, must exist first). Rollback order is the reverse: 6b's rollback before 6a's rollback (6a's district-row delete would otherwise leave 6b's inserted `user_districts` rows pointing at a deleted district — though `district_id REFERENCES districts(id) ON DELETE CASCADE` per the schema means an out-of-order rollback would cascade-delete them anyway rather than error; the explicit order is still the correct, intentional one).

## 7. Read-only preflight — performed live this session

All checks used the public `sb_publishable_...` key already compiled into this session's own fresh `npm run build` client bundle (`.next/static`), not `.env.local` — no secret file was read. GET requests only.

| Check | Result |
|---|---|
| 5 district IDs (`...00b`-`...00f`) collision | `[]` — none exist |
| 4 election IDs (`...001c`-`...001f`) collision | `[]` — none exist |
| 14 candidate IDs collision | `[]` — none exist |
| 14 candidate names collision (any existing candidate sharing these exact names) | `[]` — none exist |
| Existing `city = 'Statewide'` district rows | `[]` — none exist (confirms `ballotEligibility.ts`'s new rule is currently inert, per §4) |
| Total `candidates` row count | 21 (matches `CIVICMARKET_CURRENT_STATE.md`'s documented Package A baseline) |
| Total `elections` row count | 17 |
| Total `districts` row count | 15 |
| Total `current_officials` row count | 9 (matches documented baseline — unaffected by anything in this document) |
| `user_districts` via anon key | RLS-restricted, `0` rows visible (expected — not evidence of an empty table, only that anon cannot read other users' rows; the backfill's blast radius (§6b STEP 1) can only be captured by the project owner in the SQL Editor) |

These IDs were also collision-checked in the Package C prep session on the same date; this is an independent, fresh re-check performed this session, not a reuse of that earlier result.

## 8. Product behavior — unchanged from Package C §7

Package C §7's reasoned-through test plan (fresh user sees all 4 statewide races; PSL citywide/countywide races unaffected; FL House/Senate remain exact and unaffected; Current Officials unaffected; a future non-FL state sees nothing; existing verified City Council assignments survive) applies unchanged to the C1 subset — narrower candidate count only, same code paths, same isolation guarantees. Not re-tested live in this document, since no C1 row exists live yet (same reasoning as Package C §7).

One addition specific to C1: an **existing** user (not just a fresh one) will see the 3 offices with certification-independent candidates (Governor/Lt. Governor with 11, Attorney General with 2, Commissioner of Agriculture with 1) once both 6a and 6b execute — Chief Financial Officer will show as a race with zero candidates until Package C's remaining 25-candidate execution, which `hasRequiredCandidateFields`/`getCandidatesForDistricts` already handle safely (an office with a district/election row but no candidate rows simply contributes no cards, not an error).

## 9. Risks (carried forward from Package C §8, plus one new item)

- All risks in Package C §8 apply unchanged to the 14-candidate subset (point-in-time roster snapshot, `is_incumbent` unconfirmed, `city: 'Statewide'` sentinel is a product decision not a fact, onboarding code sequencing risk).
- **New for C1:** the existing-user backfill (§6b) is a broader-blast-radius write than any single-candidate or single-office write executed so far in this project (Package A/B were scoped to specific offices; this backfill targets essentially the entire existing PSL user base in one statement). It is additive-only and uses the table's own `UNIQUE` constraint for idempotency, but its blast radius should be captured (§6b STEP 1) and reviewed by the project owner before execution, not assumed from this document alone.

## 10. Approval boundary

**Architecture approval: received this session** (§0) — Option A is no longer an open item.

Two separate executions remain, each requiring its own explicit approval, following this project's established pattern (design → approval → execution, never combined):

1. **§6a** — 5 district rows, 4 election rows, 14 candidate rows. (The remaining 25 certification-dependent candidates stay blocked on an official results source + certification, per Package C §9, and are not part of this approval.)
2. **§6b** — the existing-user backfill, which must run after §6a and should be reviewed with its own captured blast-radius list (§6b STEP 1) in hand before approval.

The onboarding code change (§5) should be applied together with, or immediately after, §6a's execution — not before, and not as a silent side effect of either approval above; it needs its own explicit go-ahead at that time, mirroring Gate I26 → I27's sequencing.

**This document does not constitute approval to execute §6a or §6b. That has not occurred.**

## 12. Fresh-user onboarding activation — applied, 08-20-2026

Status: **Applied and verified live. Existing-user backfill (§6b) remains not executed.**

Following §6a's execution (`docs/candidate_import_package_c1_6a_execution_result.md`, PASS — 5 districts, 4 elections, 14 candidates live), the §5 onboarding change was approved and applied to `src/app/onboarding/zip/page.tsx`: `ZIP_MANAGED_DISTRICTS` gained a third entry, `{ id: '11111111-0000-0000-0000-00000000000b', name: 'Florida Statewide', scope: 'state' }`, alongside the unchanged County Commission At-Large and Mayor entries. The delete-then-insert write already scoped to this array now also covers the anchor, with no other logic change.

**Verified before relying on the anchor:** live read confirmed the Florida Statewide district row exists (`id ...000b, type statewide, city Statewide, state FL`) and that exactly 5 `type='statewide'` rows exist total — matching §6a's execution result exactly.

**Verified by code trace + live read (no live browser onboarding run performed):**
- **Statewide ballot resolution:** a fresh user holding only the anchor would have `getBallotEligibilityMode` resolve `'statewide'` (rule added in §4, committed `b7282b1`) and `getExpansionJurisdictions` expand to all 5 live `type='statewide'` districts; `getCandidatesForDistricts`'s `.in('district_id', eligibleDistrictIds)` would then match the 4 office districts, live-confirmed to hold exactly 14 candidates (11 Governor/Lt. Governor, 2 Attorney General, 1 Commissioner of Agriculture — Chief Financial Officer holds 0, as designed).
- **PSL citywide/countywide unaffected:** the existing `city_council` and `county`/`school_board` rules in `ballotEligibility.ts` were not modified by this or the prior commit — only a new, additive rule was appended.
- **FL House/Senate remain excluded:** `ZIP_MANAGED_DISTRICTS` still contains no `type: 'state'` entry; no rule exists for it in `ballotEligibility.ts`, so it still falls through to `'exact'`.
- **City Council D1/D3 remain excluded:** not present in `ZIP_MANAGED_DISTRICTS`, unchanged from Gate I36.
- **School Board District 1 / FL House 85 / FL Senate 27 remain excluded:** not present in `ZIP_MANAGED_DISTRICTS`, unchanged from the Ballot Eligibility Phase 1 work.
- **Current Officials unaffected:** live read confirmed zero `current_officials` rows reference any of the 5 new district IDs (anchor or any of the 4 offices); `current_officials` total count unchanged (9 before and after §6a, reconfirmed here).
- **Existing users unaffected:** this change only alters what a *future* onboarding submission writes; it performs no `user_districts` mutation itself, and the existing-user backfill (§6b) remains separately gated and not executed.

`npm run build` passed (same route count as baseline, no errors). `npm run lint` reported only the same 5 known pre-existing `scripts/*.cjs` errors, nothing new.

No live end-to-end browser onboarding test was performed this session (no test account/session was provisioned for this turn) — the verification above is code-trace plus live read-only database confirmation, consistent with this project's standard practice when a live UI test isn't set up in-session. A future gate may still want a live onboarding smoke test with a fresh account, mirroring Milestone 1's pattern, before Controlled PSL Beta.

## 13. No-change confirmation (updated through §12)

`src/lib/ballotEligibility.ts` (§4, commit `b7282b1`) and `src/app/onboarding/zip/page.tsx` (§12) are the only application source-code changes made across this document's sessions — both confirmed live/inert as documented in §4/§7 and §12 respectively. No other file under `src/` was modified. §6a's database write (5 districts, 4 elections, 14 candidates) was explicitly approved and executed separately — see `docs/candidate_import_package_c1_6a_execution_result.md`; no other database write was performed by this document's own work. No `user_districts` or `current_officials` row was created, modified, or deleted (§12 confirms this live). No schema, RLS, grant, policy, function, migration, or seed was changed. §6b (the existing-user backfill) remains **not executed**. `ENABLE_CITY_COUNCIL_DISTRICT_WRITE` and `ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE` are unrelated to this workstream and were not inspected or changed. No deployment occurred. Package B (`docs/candidate_import_package_b_post_certification.md`) and Package C (`docs/candidate_import_package_c_statewide.md`) were not modified. No unrelated concurrent-session file (e.g. `src/lib/candidates.ts`, other in-progress `src/app/page.tsx` edits) was touched. All ID-collision, count, and code-trace checks used only read-only `GET` requests against the public PostgREST API with a `sb_publishable_...` key extracted from a freshly-built `.next/static` client bundle — `.env.local` and every other file matching the project's secret-file exclusion list were never opened or read directly.

## 14. §6b blast-radius capture — read-only, 08-20-2026

Status: **Read-only capture complete. §6b remains NOT AUTHORIZED FOR EXECUTION.**

### 14.1 Eligibility rule (exact predicate already proposed by §6b, unchanged)

A user is eligible for the Florida Statewide anchor backfill if and only if they currently hold **at least one** of these two existing rows in `user_districts`:

- `11111111-0000-0000-0000-000000000003` — St. Lucie County Commission At-Large
- `11111111-0000-0000-0000-000000000006` — Mayor

This is the exact predicate documented in §6b's draft SQL (`WHERE ud.district_id IN ('...0003', '...0006')`), not a new or broadened rule. It was deliberately kept conservative — both rows are themselves `ZIP_MANAGED_DISTRICTS` anchors that already required a genuine PSL onboarding to obtain, and neither is a legacy/known-unreliable row (unlike School Board District 1, FL House 85, or FL Senate 27, which are ZIP-derived legacy rows no longer written by fresh onboarding — see `src/app/onboarding/zip/page.tsx`'s own comments). Holding either is not itself Florida-specific proof by name, but both are Port St. Lucie/FL-specific by construction (no non-Florida jurisdiction can hold these IDs), which is what makes this an explicit, already-approved-shape inference rather than an arbitrary single-district guess.

### 14.2 Blast radius (captured via read-only `.select()` queries only, service-role client — zero mutation calls in the capture script, script deleted immediately after this one run)

| Metric | Count |
|---|---|
| Total distinct existing users in `user_districts` | **8** |
| Already holding the Florida Statewide anchor | **0** |
| Eligible for backfill | **8** |
| Not eligible | **0** |
| Total `user_districts` rows (cross-check) | **41** — matches the documented pre-/post-§6a baseline exactly (unchanged, confirming no drift since §6a) |

**All 8 existing users are eligible** — every one already holds County Commission At-Large; 2 of the 8 additionally hold Mayor. There is no user who holds only a legacy row (School Board D1 / FL House 85 / FL Senate 27) without also holding one of the two qualifying anchors — `legacyOnlyNotEligibleUsers` returned empty.

### 14.3 Exact eligible user IDs and qualifying rows

| # | `user_id` | Known account (from already-documented, non-secret repo history only — `auth.users`/email was never queried) | Existing `user_districts` rows | Qualifying row(s) |
|---|---|---|---|---|
| 1 | `90f290e6-3e3b-484c-8ddc-d451826281e6` | not previously documented in this repo | City Council D1, School Board D1, County Commission At-Large, FL House 85, FL Senate 27 (5) | County Commission At-Large |
| 2 | `14055592-df01-4aec-933d-4c44476f7bab` | not previously documented in this repo | City Council D1, School Board D1, County Commission At-Large, FL House 85, FL Senate 27 (5) | County Commission At-Large |
| 3 | `4955f9dd-f20a-4b99-878a-fc7e89e38acb` | not previously documented in this repo | City Council D1, School Board D1, County Commission At-Large, FL House 85, FL Senate 27 (5) | County Commission At-Large |
| 4 | `479780fe-e447-4c6e-9462-338841bbaa4b` | `civicmarket.test.04@example.com` (documented, `CIVICMARKET_CURRENT_STATE.md`) | City Council D1, School Board D1, County Commission At-Large, FL House 85, FL Senate 27 (5) | County Commission At-Large |
| 5 | `f1fde6f9-07c3-4c76-ae81-ebb2f461a5c3` | project admin/reviewer profile (documented, `CIVICMARKET_CURRENT_STATE.md` Gate I42 — `is_admin: true`) | City Council D1, School Board D1, County Commission At-Large, FL House 85, FL Senate 27 (5) | County Commission At-Large |
| 6 | `73264ade-24fd-467f-b4c8-4481cef3e535` | not previously documented in this repo | City Council D1, School Board D1, County Commission At-Large, FL House 85, FL Senate 27 (5) | County Commission At-Large |
| 7 | `ec59ea92-470f-447f-8873-ab2dbde52aca` | `civicmarket.test.01@example.com` (documented) | City Council D1, School Board D1, County Commission At-Large, FL House 85, FL Senate 27, Mayor (6) | County Commission At-Large + Mayor |
| 8 | `3b223f8c-059e-4f3a-a507-29714ad8b3a9` | `civicmarket.test.05@example.com` (documented) | School Board D1, County Commission At-Large, FL House 85, FL Senate 27, Mayor (5) | County Commission At-Large + Mayor |

No email address was queried or included anywhere in this capture — the three labeled accounts above are labeled solely from already-public, already-committed project documentation (`CIVICMARKET_CURRENT_STATE.md`), matched by `user_id` only.

Every row above is internally consistent with this project's own prior documented history for these exact accounts (Milestone 1's 5-row test.05 result, Milestone 2A's 6-row test.01 result including Mayor, and the Gate I25-era 5-row test.04 result) — a strong independent cross-check that this capture reflects real, undrifted state.

### 14.4 Ambiguous / legacy / duplicate cases

- **Ambiguous cases:** none. Every eligible user's qualification is unambiguous (via County Commission At-Large alone, or via both County Commission At-Large and Mayor together — never a borderline or inferred case).
- **Duplicate anchor rows:** none — `alreadyAnchoredCount = 0`, so there is nothing to deduplicate, and the `UNIQUE(user_id, district_id)` constraint structurally prevents any future duplicate regardless.
- **Legacy-only users (would be excluded if they existed):** none found. If a future population included a user holding only School Board D1 / FL House 85 / FL Senate 27 without County Commission At-Large or Mayor, this predicate would correctly exclude them — none of the current 8 users are in that shape.
- **Test / known accounts:** 3 of 8 are already-documented test accounts (`civicmarket.test.01`, `.04`, `.05`); 1 of 8 is the project's documented admin/reviewer profile; the remaining 4 are not previously documented anywhere in this repo's history and were not further identified (no `auth.users`/email lookup was performed).

### 14.5 Safety checks

| Check | Result |
|---|---|
| No eligible user already has the anchor | **PASS** — `alreadyAnchoredCount = 0`; eligible and already-anchored sets are disjoint by construction |
| Backfill would insert at most one anchor row per user | **PASS** — a plain `SELECT DISTINCT user_id`, plus the table's own `UNIQUE(user_id, district_id)` constraint and `ON CONFLICT DO NOTHING`, structurally guarantee this |
| No existing row would be deleted or replaced | **PASS** — §6b's draft SQL (§6.2, unchanged) contains only one `INSERT`, no `DELETE`/`UPDATE`/`UPSERT` |
| City Council representation rows untouched | **PASS** — City Council D1 rows (user #1-6) are not referenced anywhere in the backfill predicate or insert target |
| County Commission rows untouched | **PASS** — County Commission At-Large rows are read-only (used as a `WHERE` filter), never written or modified |
| School Board / FL House / FL Senate legacy rows untouched | **PASS** — none referenced in the insert target; all 8 users' legacy rows are structurally unaffected |
| Current Officials behavior unchanged | **PASS** — re-confirmed live this session-family (§7/§12): zero `current_officials` rows reference the anchor or any of the 4 statewide office district IDs |
| Ballot eligibility expands only to statewide races | **PASS** — the anchor's only effect, via the already-committed `ballotEligibility.ts` rule (§4), is expanding to the 5 `type='statewide'` districts; no other rule references this anchor |

### 14.6 Draft SQL — **NOT AUTHORIZED FOR EXECUTION**

Unchanged in substance from §6.2 — reproduced here with the captured user ID list substituted in as the literal, exact-ID rollback scope (replacing the placeholder comment), since the blast radius is now known precisely.

```sql
-- ============================================================
-- PACKAGE C1 §6b -- EXISTING-USER FLORIDA STATEWIDE ANCHOR BACKFILL
-- NOT AUTHORIZED FOR EXECUTION
-- Blast radius captured read-only, 08-20-2026: 8 eligible users,
-- 0 already anchored, 0 not eligible. See §14.3 for the full list.
-- INSERT only. No UPDATE. No DELETE. Idempotent via
-- UNIQUE(user_id, district_id) + ON CONFLICT DO NOTHING.
-- ============================================================
BEGIN;
INSERT INTO user_districts (user_id, district_id, scope)
SELECT DISTINCT ud.user_id, '11111111-0000-0000-0000-00000000000b', 'state'
FROM user_districts ud
WHERE ud.district_id IN (
  '11111111-0000-0000-0000-000000000003', -- St. Lucie County Commission At-Large
  '11111111-0000-0000-0000-000000000006'  -- Mayor
)
ON CONFLICT (user_id, district_id) DO NOTHING;
COMMIT;
```

**Read-only post-write verification SQL:**
```sql
-- Expect exactly 8 (the captured eligible count)
SELECT count(*) FROM user_districts WHERE district_id = '11111111-0000-0000-0000-00000000000b';

-- Expect all 8 captured IDs present, none missing
SELECT user_id FROM user_districts
WHERE district_id = '11111111-0000-0000-0000-00000000000b'
ORDER BY user_id;
-- Compare against the exact 8 IDs in §14.3.

-- Expect 0 rows -- no user received a duplicate anchor
SELECT user_id, count(*) FROM user_districts
WHERE district_id = '11111111-0000-0000-0000-00000000000b'
GROUP BY user_id HAVING count(*) > 1;

-- Expect unchanged from the immediate pre-write baseline (9, per §12/§7)
SELECT count(*) FROM current_officials;

-- Expect 41 + 8 = 49 (pre-write baseline 41, plus exactly 8 new anchor rows)
SELECT count(*) FROM user_districts;
```

**Rollback SQL — exact-ID scoped to the 8 captured user IDs, never a bare predicate delete:**
```sql
BEGIN;
DELETE FROM user_districts
WHERE district_id = '11111111-0000-0000-0000-00000000000b'
  AND user_id IN (
    '90f290e6-3e3b-484c-8ddc-d451826281e6',
    '14055592-df01-4aec-933d-4c44476f7bab',
    '4955f9dd-f20a-4b99-878a-fc7e89e38acb',
    '479780fe-e447-4c6e-9462-338841bbaa4b',
    'f1fde6f9-07c3-4c76-ae81-ebb2f461a5c3',
    '73264ade-24fd-467f-b4c8-4481cef3e535',
    'ec59ea92-470f-447f-8873-ab2dbde52aca',
    '3b223f8c-059e-4f3a-a507-29714ad8b3a9'
  );
COMMIT;
```

### 14.7 Risks

- **Blast radius is 100% of the current existing-user population** (8/8) — larger, proportionally, than any single-office write executed so far in this project. The predicate itself is unchanged and conservative (§14.1); this is simply a reflection of how small and uniformly-onboarded the current Internal Beta population is, not a sign the predicate is too broad. Worth the project owner's explicit awareness before approving, not a defect.
- **This snapshot can drift.** If new users onboard, or the concurrent Home/representation session's work changes `user_districts` before §6b executes, this exact 8-user list should be recaptured immediately before execution rather than reused from memory — mirroring the same discipline already used for every prior backfill/write in this project (e.g. Gate I25's "capture immediately before execution" pattern).
- **One eligible account is the project's own admin/reviewer profile** (`f1fde6f9-...`) — receiving a ballot-eligibility-only anchor row has no special implication for that account beyond what any other eligible user gets, but it is called out here for transparency since that identity is otherwise significant elsewhere in this project (Gate I42-I47).

### 14.8 Approval boundary

**This document (§14) does not authorize execution.** Two things must still happen, matching this project's standing design → approval → execution discipline:
1. Immediately before execution, recapture the blast radius (a fresh run of the same read-only method) to confirm the 8-user list has not drifted, per §14.7.
2. A separate, explicit approval to execute §6b's `INSERT` (§14.6) — this document only prepares that approval, it does not grant it.

No `user_districts`, `districts`, `elections`, `candidates`, `current_officials`, schema, RLS, grant, policy, or function was modified by this capture. Both write guards remain `false`. No deployment occurred. The temporary read-only capture script was deleted immediately after its one run; `git status` was confirmed clean afterward. No unrelated concurrent-session file was touched.

## 15. §6b execution result — EXECUTED, VERIFICATION PASSED

Status: **EXECUTED. VERIFICATION PASSED.** Date: 08-20-2026.

### 15.1 Immediate pre-execution drift check (matched exactly — proceeded)

| Check | Expected (§14) | Actual (re-checked immediately before writing) | Match |
|---|---|---|---|
| Total distinct existing users | 8 | 8 | ✅ |
| Already anchored | 0 | 0 | ✅ |
| Eligible for backfill | 8 | 8 | ✅ |
| Eligible user-ID set | §14.3's 8 IDs | identical set | ✅ |
| Florida Statewide anchor district exists | yes | yes | ✅ |
| `current_officials` rows referencing the anchor or any of the 4 office districts | 0 | 0 | ✅ |
| Pre-write `user_districts` total | 41 | 41 | ✅ |

No drift found. Execution proceeded exactly as approved.

### 15.2 Execution method

A temporary, one-time Node script (service-role client, key loaded internally from `.env.local`, never printed) first re-ran the exact read-only drift check above, then — only because every check matched — performed **one single `.insert()` call** on `user_districts` (8 rows, one per eligible user, `district_id` = the Florida Statewide anchor, `scope: 'state'`), then ran the read-only post-write verification below in the same run. No `.update()`, `.delete()`, or `.upsert()` call exists anywhere in the script. The script was deleted immediately after this one run; `git status` confirmed a clean working tree afterward.

### 15.3 Result — all verified live in the same run

- **Users inserted: 8/8** — exactly the §14.3 list, no more, no fewer.
- **`user_districts` total: 41 → 49** (exactly +8).
- **No duplicate anchors:** each of the 8 users holds exactly one Florida Statewide row.
- **No unexpected/ninth user received it:** the post-write anchor-holder set is exactly the 8 expected IDs, nothing else.
- **All prior rows remain intact:** the +8 delta accounts for the entire total-row increase; no existing row was deleted, updated, or replaced (the script never called anything but `.insert()`).
- **`current_officials` unchanged:** 9 → 9; 0 rows reference the anchor or any of the 4 statewide office districts, both before and after.
- **Statewide ballot eligibility now works for these 8 users** (code trace, unchanged logic since §12): each now holds the anchor, so `getBallotEligibilityMode` resolves `'statewide'` and `getExpansionJurisdictions` expands to the 5 live `type='statewide'` districts, making the 14 certification-independent candidates (§6a) ballot-eligible for all 8.
- **FL House/Senate remain exact-district only:** `ballotEligibility.ts` was not touched by this execution (no rule exists for `type='state'`); unaffected.
- **City Council / County Commission / School Board / House / Senate assignments untouched:** confirmed structurally (insert-only script) and by the exact +8 row-count delta.
- **Write guards confirmed `false`:** `ENABLE_CITY_COUNCIL_DISTRICT_WRITE` (`src/app/api/set-city-council-district/route.ts:10`) and `ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE` (`src/app/api/set-county-commission-district/route.ts:9`), neither touched this turn.
- **No deployment occurred.**

### 15.4 Not done (per explicit approval scope)

- No certification-dependent candidate was inserted.
- No schema/RLS/grant/function was changed.
- No unrelated concurrent-session file was touched.
- No rollback was run (verification passed; nothing to roll back).

### 15.5 No-change confirmation

Beyond the one explicitly approved `user_districts` insert (8 rows, §15.2-15.3), no other table, schema, RLS, grant, policy, or function was modified. Both write guards remain `false`. No deployment occurred. This document is the only file changed and committed for this task.
