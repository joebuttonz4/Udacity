# Candidate Import Package B — Post-Certification Reconciliation

Status: **NOT AUTHORIZED FOR EXECUTION**

Date: 08-20-2026

Source: published artifact "2026 Candidate Import Package" (artifact ID `b03c9f5b-7a89-4aaa-b4ac-b2094bfebc5e`), sections §P4 (Package B deferred-action table), §P5 (certification timing), §R2 (race-by-race unofficial results), §R6 (revised SQL draft, superseded for execution ordering by the P1–P8 split but still the source of the exact per-candidate SQL used below). Re-fetched and extracted directly from the saved artifact HTML this session — not reconstructed from memory, not sourced from the Git repository.

This document is preparation only: read-only research, drafting, live read-only preflight, and documentation. **No write has been executed.** Every race below is blocked on official certification (or, for School Board District 3, on certification *plus* an explicit product-level classification decision — see that race's section). Package A (commit `729de33`) already created every district and election row Package B needs — **Package B requires zero new `districts` or `elections` rows**, only candidate inserts and candidate updates.

## How this document is organized

Each of the 7 races below is fully self-contained: current unofficial result, every candidate, the exact expected post-certification action, the exact certified evidence required before that action may run, the exact SQL (not executed), preflight evidence already gathered read-only this session, post-write verification SQL, and rollback SQL. Races are intentionally kept in separate transactions so one race's certification timeline never blocks another's.

**Fixed candidate UUIDs** for the 9 brand-new Package B candidates continue the `44444444-0000-0000-0000-0000000000XX` convention established and approved for Package A (`...0001`–`...000a`), starting at `...000b`. Collision-checked live (read-only) this session — all 9 confirmed unused, alongside a name-collision check on all 9 candidate names (also 0 rows). The 8 existing candidates being reclassified (Martin, Giordano, Strazzeri, Zimmerman, Reikenis, Norton, Alexandre, Overhuls) were also confirmed live this session — all 8 exist exactly once, at the UUIDs used below, in the exact pre-Package-B state the source artifact assumed (unarchived, `appeared_on_ballot: true`, on their original pre-split election rows).

## Baseline (confirmed live, read-only, this session — post-Package-A)

| Table | Count |
|---|---|
| `districts` | 15 |
| `elections` | 17 |
| `candidates` | 21 |
| `current_officials` | 9 |

---

## Race 1 — PSL Mayor

**Current unofficial result** (St. Lucie County SOE Election Night Reporting, 62/62 precincts, "Completely Reported"; no majority — top two advance):

| Candidate | Result | Classification |
|---|---|---|
| Shannon M. Martin | 47.71% (18,726) | Advances to November |
| Steven Giordano | 35.22% (13,821) | Advances to November |
| Eric Strazzeri | 17.07% (6,700) | Eliminated in Primary |

**Post-certification action:** re-point Martin and Giordano's `election_id` to the already-existing `PSL Mayor General 2026` row (`...017`, created by Package A) — they stay in Group A (unarchived, upcoming). Archive Strazzeri with a historical `bio` note; his `election_id` is unchanged (stays on the original, Primary-dated Mayor row `...0006`) — preserved as a historical record, not deleted.

**Exact certified evidence required:** St. Lucie County Canvassing Board's certified Mayor Primary return confirming Martin and Giordano as the top two (or a certified majority winner, if certification changes the outcome — in which case this SQL must be re-derived, not run as-is).

**Preflight (confirmed live, read-only, this session):** `d44ff05a-...` (Martin) and `3a52546d-...` (Giordano) both exist, `district_id/election_id = ...0006`, `archived_at: null`, `appeared_on_ballot: true`. `5b03e0af-...` (Strazzeri) exists, same current state.

```sql
-- Proposed SQL — NOT EXECUTED
BEGIN;

UPDATE candidates SET election_id = '22222222-0000-0000-0000-000000000017'
WHERE id IN ('d44ff05a-14af-45c2-9f2f-6d530a8a051e','3a52546d-6cdf-42c6-abd2-4fface88e858'); -- Martin, Giordano

UPDATE candidates SET archived_at = now(),
  bio = 'Eliminated in the August 18, 2026 Primary (17.07%).'
WHERE id = '5b03e0af-ad49-4299-83cf-19c73d0da89f'; -- Strazzeri

COMMIT;
```

**Post-write verification:**
```sql
SELECT id, name, election_id, archived_at, appeared_on_ballot FROM candidates
WHERE id IN ('d44ff05a-14af-45c2-9f2f-6d530a8a051e','3a52546d-6cdf-42c6-abd2-4fface88e858','5b03e0af-ad49-4299-83cf-19c73d0da89f');
-- expect Martin, Giordano: election_id = '...017', archived_at IS NULL, appeared_on_ballot = true
-- expect Strazzeri: election_id unchanged ('...0006'), archived_at IS NOT NULL, bio set
```

**Rollback (exact literal IDs):**
```sql
BEGIN;
UPDATE candidates SET election_id = '22222222-0000-0000-0000-000000000006'
WHERE id IN ('d44ff05a-14af-45c2-9f2f-6d530a8a051e','3a52546d-6cdf-42c6-abd2-4fface88e858');
UPDATE candidates SET archived_at = NULL, bio = NULL
WHERE id = '5b03e0af-ad49-4299-83cf-19c73d0da89f';
COMMIT;
```

---

## Race 2 — PSL City Council District 1

**Current unofficial result** (no majority — top two advance):

| Candidate | Result | Classification |
|---|---|---|
| Rick Meltzer | 42.02% (15,629) | Advances to November |
| Indony P. Jean Baptiste | 22.13% (8,232) | Advances to November |
| Kevin Zimmerman | 20.82% (7,744) | Eliminated in Primary |
| Eric Reikenis | 15.03% (5,591) | Eliminated in Primary |

**Post-certification action:** archive Zimmerman and Reikenis with a historical `bio` note, re-point their `election_id` to the already-existing `PSL City Council D1 Primary 2026` row (`...018`, created by Package A). **Meltzer and Baptiste require no action** — already correctly positioned on the existing November-dated row (`...0001`); Meltzer's name correction was already completed in Package A.

**Exact certified evidence required:** certified City Council D1 Primary return confirming Meltzer and Baptiste as the top two.

**Preflight (confirmed live, read-only, this session):** `51815a20-...` (Zimmerman) and `a3d23ac8-...` (Reikenis) both exist, `election_id = ...0001`, `archived_at: null`, `appeared_on_ballot: true`.

```sql
-- Proposed SQL — NOT EXECUTED
BEGIN;

UPDATE candidates SET archived_at = now(), election_id = '22222222-0000-0000-0000-000000000018',
  bio = 'Eliminated in the August 18, 2026 Primary.'
WHERE id IN ('51815a20-a9f2-4b04-ac23-d63b71011f08','a3d23ac8-07de-4db4-8268-a7fc3dea5b0b'); -- Zimmerman, Reikenis
-- Meltzer, Baptiste: no action required

COMMIT;
```

**Post-write verification:**
```sql
SELECT id, name, election_id, archived_at FROM candidates
WHERE id IN ('51815a20-a9f2-4b04-ac23-d63b71011f08','a3d23ac8-07de-4db4-8268-a7fc3dea5b0b');
-- expect both: election_id = '...018', archived_at IS NOT NULL, bio set
```

**Rollback:**
```sql
BEGIN;
UPDATE candidates SET archived_at = NULL, election_id = '22222222-0000-0000-0000-000000000001', bio = NULL
WHERE id IN ('51815a20-a9f2-4b04-ac23-d63b71011f08','a3d23ac8-07de-4db4-8268-a7fc3dea5b0b');
COMMIT;
```

---

## Race 3 — PSL City Council District 3

**Current unofficial result** (majority — decided in the Primary, no November race for this seat):

| Candidate | Result | Classification |
|---|---|---|
| Jim Norton | 52.26% (19,365) | Won outright in Primary |
| Fritz Masson-Alexandre | 24.89% (9,224) | Eliminated in Primary |
| Peter D. Overhuls | 22.85% (8,467) | Eliminated in Primary |

**Post-certification action:** archive all three with historical `bio` notes. All three stay on the existing, already-Primary-dated District 3 election row (`...0007`) — no `election_id` change, since the whole race concluded there.

**Exact certified evidence required:** certified City Council D3 return confirming Norton's majority (>50%).

**Preflight (confirmed live, read-only, this session):** `17d76e2c-...` (Norton), `a8f27169-...` (Alexandre), `3dda97a1-...` (Overhuls) all exist, `election_id = ...0007`, `archived_at: null`, `appeared_on_ballot: true`.

```sql
-- Proposed SQL — NOT EXECUTED
BEGIN;

UPDATE candidates SET archived_at = now(),
  bio = 'Won the City Council District 3 seat outright in the August 18, 2026 Primary (52.26%). No November race for this seat.'
WHERE id = '17d76e2c-744e-41d0-8144-2b92533dffa5'; -- Norton

UPDATE candidates SET archived_at = now(),
  bio = 'Eliminated in the August 18, 2026 Primary.'
WHERE id IN ('a8f27169-47ee-4c09-af47-fc0ff925beb1','3dda97a1-b331-4642-9009-35a762685ee6'); -- Alexandre, Overhuls

COMMIT;
```

**Post-write verification:**
```sql
SELECT id, name, election_id, archived_at, bio FROM candidates
WHERE id IN ('17d76e2c-744e-41d0-8144-2b92533dffa5','a8f27169-47ee-4c09-af47-fc0ff925beb1','3dda97a1-b331-4642-9009-35a762685ee6');
-- expect all 3: election_id unchanged ('...0007'), archived_at IS NOT NULL, bio set
```

**Rollback:**
```sql
BEGIN;
UPDATE candidates SET archived_at = NULL, bio = NULL
WHERE id IN ('17d76e2c-744e-41d0-8144-2b92533dffa5','a8f27169-47ee-4c09-af47-fc0ff925beb1','3dda97a1-b331-4642-9009-35a762685ee6');
COMMIT;
```

---

## Race 4 — St. Lucie County Commission District 4, Democratic line

**Current unofficial result** — **flagged for extra scrutiny**: 276 votes separated the two candidates (50.66% / 49.34%), well within the range a certification-stage recount or correction could realistically affect:

| Candidate | Result | Classification |
|---|---|---|
| Jean Eddy Leroy (DEM) | 50.66% (10,587) — won DEM primary | Advances to November |
| Roger N. Messer (DEM) | 49.34% (10,311) | Eliminated in Primary |

(Fowler (REP) and Burgos (NPA) for this same district were already inserted, unaffected, by Package A — no action needed for them here.)

**Post-certification action:** insert both as new candidates (fixed IDs, unused — confirmed live). Leroy unarchived onto the already-existing general election row (`...0009`); Messer archived with a historical `bio` note onto the already-existing Primary-dated row (`...0019`).

**Exact certified evidence required:** certified County Commission D4 Democratic Primary return. Per the source artifact's own risk note, **wait explicitly for the August 26, 2026 county canvassing certification** — not merely "the numbers look final" — given the 276-vote margin.

**Preflight (confirmed live, read-only, this session):** candidate IDs `...000b`/`...000c` unused; names "Jean Eddy Leroy" / "Roger Messer" have 0 exact-match rows in the live database.

```sql
-- Proposed SQL — NOT EXECUTED
BEGIN;

INSERT INTO candidates (id, name, office, is_incumbent, district_id, election_id, appeared_on_ballot, archived_at, bio) VALUES
  ('44444444-0000-0000-0000-00000000000b', 'Jean Eddy Leroy', 'County Commissioner District 4', false,
   '11111111-0000-0000-0000-000000000034', '22222222-0000-0000-0000-000000000009', true, NULL, NULL),
  ('44444444-0000-0000-0000-00000000000c', 'Roger Messer', 'County Commissioner District 4', false,
   '11111111-0000-0000-0000-000000000034', '22222222-0000-0000-0000-000000000019', true, now(),
   'Eliminated in the August 18, 2026 Democratic Primary (49.34%).')
ON CONFLICT (id) DO NOTHING;

COMMIT;
```

**Post-write verification:**
```sql
SELECT id, name, election_id, archived_at FROM candidates
WHERE id IN ('44444444-0000-0000-0000-00000000000b','44444444-0000-0000-0000-00000000000c');
-- expect 2 rows; Leroy: archived_at IS NULL; Messer: archived_at IS NOT NULL
```

**Rollback:**
```sql
BEGIN;
DELETE FROM candidates WHERE id IN ('44444444-0000-0000-0000-00000000000b','44444444-0000-0000-0000-00000000000c');
COMMIT;
```

---

## Race 5 — St. Lucie School Board District 1

**Current unofficial result** (majority — decided in the Primary, no November race for this seat):

| Candidate | Result | Classification |
|---|---|---|
| Debbie Johnson Hawley | 55.00% (29,438) | Won outright in Primary |
| Brian K. Capp | 45.00% (24,082) | Eliminated in Primary |

**Post-certification action:** insert both as new candidates (fixed IDs, unused — confirmed live), both archived onto the already-existing Primary-dated row (`...001a`) — Hawley with a "won outright" `bio` note, Capp with an "eliminated" note.

**Exact certified evidence required:** certified School Board D1 return confirming Hawley's majority (>50%).

**Note:** the county's raw vote-total table lists the full name "Debbie Johnson Hawley"; this repository's already-seeded `current_officials` row for this office uses "Debbie Hawley." The SQL below uses "Debbie Hawley" for consistency with that existing convention — flagging this as a minor naming-form item for your confirmation, not a blocker.

**Preflight (confirmed live, read-only, this session):** candidate IDs `...000d`/`...000e` unused; name "Debbie Hawley" — not separately re-checked under the exact "Debbie Johnson Hawley" form; "Brian K. Capp" has 0 exact-match rows.

```sql
-- Proposed SQL — NOT EXECUTED
BEGIN;

INSERT INTO candidates (id, name, office, is_incumbent, district_id, election_id, appeared_on_ballot, archived_at, bio) VALUES
  ('44444444-0000-0000-0000-00000000000d', 'Debbie Hawley', 'School Board Member, District 1', true,
   '11111111-0000-0000-0000-000000000002', '22222222-0000-0000-0000-00000000001a', true, now(),
   'Won the District 1 seat outright in the August 18, 2026 Primary (55.00%). No November race for this seat.'),
  ('44444444-0000-0000-0000-00000000000e', 'Brian K. Capp', 'School Board Member, District 1', false,
   '11111111-0000-0000-0000-000000000002', '22222222-0000-0000-0000-00000000001a', true, now(),
   'Eliminated in the August 18, 2026 Primary (45.00%).')
ON CONFLICT (id) DO NOTHING;

COMMIT;
```

**Post-write verification:**
```sql
SELECT id, name, election_id, archived_at FROM candidates
WHERE id IN ('44444444-0000-0000-0000-00000000000d','44444444-0000-0000-0000-00000000000e');
-- expect 2 rows, both archived_at IS NOT NULL
```

**Rollback:**
```sql
BEGIN;
DELETE FROM candidates WHERE id IN ('44444444-0000-0000-0000-00000000000d','44444444-0000-0000-0000-00000000000e');
COMMIT;
```

---

## Race 6 — St. Lucie School Board District 3 (genuine edge case — requires explicit product decision, not certification evidence alone)

**Current unofficial result:** no results/tabulation section exists anywhere on the county's official results page for this race — consistent with Florida's write-in rule (a write-in candidate's name does not print on the ballot). Donna Mills was the sole *printed* candidate; there was nothing to tabulate.

| Candidate | Result | Classification |
|---|---|---|
| Donna Mills | No tabulated result — sole printed candidate | Won outright / unopposed on the printed ballot |
| Ben "Zag" Zagrobelny | Qualified write-in only (name does not print) | Remains a qualified write-in for November |

**Post-certification action (as recommended by the source artifact, not yet product-confirmed):** insert both as new candidates onto the already-existing November-dated D3 row (`...00a`). Recommended treatment: Mills archived with an "effectively elected / unopposed" note; Zagrobelny **left unarchived** — a genuine ongoing write-in candidate, not a defeated one, since he could still legally receive hand-written votes in November.

**Exact evidence required — two separate things, both needed:**
1. Certified School Board D3 return, **or** a direct, positive confirmation from the county's official sample ballot / canvassing record that Mills was deemed elected without opposition. A qualifying-record label alone ("Qualified" vs. "Unopposed") was already found insufficient during Package A's own review — do not attempt to resolve this again from the mere absence of a results line.
2. **A separate, explicit product-level decision** on whether "won outright / unopposed" is the correct classification for Mills, and whether Zagrobelny should remain unarchived through November. The source artifact itself flags this as unresolved and explicitly recommends against silently resolving it either way.

**Preflight (confirmed live, read-only, this session):** candidate IDs `...000f`/`...0010` unused; name "Donna Mills" — 0 exact-match rows.

```sql
-- Proposed SQL — NOT EXECUTED — do not run until BOTH the certified-evidence
-- requirement AND the separate product-classification decision above are satisfied
BEGIN;

INSERT INTO candidates (id, name, office, is_incumbent, district_id, election_id, appeared_on_ballot, archived_at, bio) VALUES
  ('44444444-0000-0000-0000-00000000000f', 'Donna Mills', 'School Board Member, District 3', true,
   '11111111-0000-0000-0000-000000000008', '22222222-0000-0000-0000-00000000000a', true, now(),
   'Sole printed candidate on the August 18, 2026 Primary ballot; no tabulated results section. Recommended treatment: effectively elected / unopposed on the printed ballot -- pending explicit product-level confirmation.'),
  ('44444444-0000-0000-0000-000000000010', 'Ben "Zag" Zagrobelny', 'School Board Member, District 3', false,
   '11111111-0000-0000-0000-000000000008', '22222222-0000-0000-0000-00000000000a', true, NULL, NULL)
ON CONFLICT (id) DO NOTHING;

COMMIT;
```

**Post-write verification:**
```sql
SELECT id, name, election_id, archived_at FROM candidates
WHERE id IN ('44444444-0000-0000-0000-00000000000f','44444444-0000-0000-0000-000000000010');
-- expect Mills: archived_at IS NOT NULL; Zagrobelny: archived_at IS NULL
```

**Rollback:**
```sql
BEGIN;
DELETE FROM candidates WHERE id IN ('44444444-0000-0000-0000-00000000000f','44444444-0000-0000-0000-000000000010');
COMMIT;
```

---

## Race 7 — St. Lucie School Board District 5

**Current unofficial result** (no majority — top two advance):

| Candidate | Result | Classification |
|---|---|---|
| Lisa Kessler | 37.54% (20,009) | Advances to November |
| Troy Ingersoll | 37.24% (19,847) | Advances to November |
| Charles V. Cerami | 25.22% (13,439) | Eliminated in Primary |

**Post-certification action:** insert Kessler and Ingersoll unarchived onto the already-existing general election row (`...00b`); insert Cerami archived with a historical `bio` note onto the already-existing Primary-dated row (`...001b`).

**Exact certified evidence required:** certified School Board D5 return confirming Kessler and Ingersoll as the top two.

**Preflight (confirmed live, read-only, this session):** candidate IDs `...0011`/`...0012`/`...0013` unused; names "Lisa Kessler" / "Troy Ingersoll" / "Charles V. Cerami" have 0 exact-match rows.

```sql
-- Proposed SQL — NOT EXECUTED
BEGIN;

INSERT INTO candidates (id, name, office, is_incumbent, district_id, election_id, appeared_on_ballot, archived_at, bio) VALUES
  ('44444444-0000-0000-0000-000000000011', 'Lisa Kessler', 'School Board Member, District 5', false,
   '11111111-0000-0000-0000-000000000009', '22222222-0000-0000-0000-00000000000b', true, NULL, NULL),
  ('44444444-0000-0000-0000-000000000012', 'Troy Ingersoll', 'School Board Member, District 5', true,
   '11111111-0000-0000-0000-000000000009', '22222222-0000-0000-0000-00000000000b', true, NULL, NULL),
  ('44444444-0000-0000-0000-000000000013', 'Charles V. Cerami', 'School Board Member, District 5', false,
   '11111111-0000-0000-0000-000000000009', '22222222-0000-0000-0000-00000000001b', true, now(),
   'Eliminated in the August 18, 2026 Primary (25.22%).')
ON CONFLICT (id) DO NOTHING;

COMMIT;
```

**Post-write verification:**
```sql
SELECT id, name, election_id, archived_at FROM candidates
WHERE id IN ('44444444-0000-0000-0000-000000000011','44444444-0000-0000-0000-000000000012','44444444-0000-0000-0000-000000000013');
-- expect Kessler, Ingersoll: archived_at IS NULL; Cerami: archived_at IS NOT NULL
```

**Rollback:**
```sql
BEGIN;
DELETE FROM candidates WHERE id IN ('44444444-0000-0000-0000-000000000011','44444444-0000-0000-0000-000000000012','44444444-0000-0000-0000-000000000013');
COMMIT;
```

---

## Excluded from Package B (unchanged, confirmed)

- **Statewide races** (Governor/Lt. Governor, Attorney General, CFO, Commissioner of Agriculture) — fully excluded per instruction. Blocked separately on the still-unapproved statewide ballot-model decision (source artifact's original §07), not solely on certification.
- **County Commission District 2** — no action needed; Leet and Dorsainvil were both certification-independent and already fully handled by Package A.
- **FL House District 84 / 85** — no action needed; all six candidates were unopposed pre-Primary and already fully handled by Package A.

## Consolidated no-action-required list

Rick Meltzer and Indony P. Jean Baptiste (City Council D1) require no SQL of any kind — already correctly positioned by Package A.

## Explicit execution checklist (per race, before running any SQL above)

1. Confirm official certification has occurred for that specific race (§ certification timing: county canvassing board, expected no later than noon, August 26, 2026, for every race in this document — all are municipal/county/school, not state/federal).
2. Re-verify the certified result against the official St. Lucie County Canvassing Board record directly — not this document's unofficial vote counts, which are dated 08-20-2026 and pre-certification.
3. For Race 6 (School Board D3) only: obtain the separate explicit product-level classification decision described in that race's section, in addition to certified/positive-confirmation evidence.
4. Re-run this document's preflight-style checks (ID and name collision, existing-row current-state confirmation) immediately before execution — do not rely on this session's read-only results after time has passed.
5. Execute only that one race's SQL block, in its own transaction.
6. Run that race's post-write verification immediately.
7. If verification fails before `COMMIT`, issue `ROLLBACK` instead.
8. If already committed and a defect is found, stop and report — do not run rollback SQL without separate explicit approval, mirroring the Package A execution protocol.
9. Confirm `user_districts` and `current_officials` counts are unchanged (no race above touches either table).
10. Confirm both `ENABLE_CITY_COUNCIL_DISTRICT_WRITE` and `ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE` remain `false` (unrelated to this workstream, unaffected either way).
11. No deployment at any point in this checklist.

## No-change confirmation

No SQL was executed by this document. No `districts`, `elections`, `candidates`, `user_districts`, or `current_officials` row was created, modified, or deleted. No schema, RLS, grant, policy, function, migration, or seed was changed. `ENABLE_CITY_COUNCIL_DISTRICT_WRITE` and `ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE` remain `false`, untouched. No deployment occurred. All preflight checks referenced above used only read-only `GET` requests against the public PostgREST API with the anon key already compiled into the client bundle.

## Next step / approval boundary

**Official certified-result verification for each race**, once available (expected no later than noon, August 26, 2026 for the county canvassing board), followed by explicit per-race authorization to execute. Race 6 (School Board D3) additionally requires a separate explicit product-classification decision before it may proceed, independent of certification timing.
