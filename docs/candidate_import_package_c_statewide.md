# Candidate Import Package C — Statewide Ballot Model and Candidate Package

Status: **DESIGN / DRAFT ONLY. NOT AUTHORIZED FOR EXECUTION.** No database write performed. No app source file modified.

Date: 08-20-2026

## 0. Baseline

- Branch: `master`, working tree clean at start of this task.
- `git log --oneline -10` at start:
  ```
  103e507 Prepare Package B post-certification reconciliation (not executed)
  d6cc50e Record Shannon Martin match-score test execution result
  754a7ed Prepare Shannon match score pilot test approval
  729de33 Record Package A candidate import result
  847ee5a Record Shannon Martin candidate_positions write execution result
  4ac78be Prepare Shannon candidate_positions pilot write approval
  5985f59 Add Package A execution-ready document with preflight evidence
  56067f1 Design candidate_positions aggregation layer for evidence pilot
  21c09d7 Record Shannon Martin evidence write execution result
  d730a4e Add Shannon Martin candidate evidence pilot return handoff
  ```
- Package A (commit `729de33`): executed, verified PASS.
- Package B (commit `103e507`): prepared, not executed, blocked on county certification (and, for School Board D3, an additional product decision).
- Package B was not modified by this task.
- Source artifact "2026 Candidate Import Package" (`b03c9f5b-7a89-4aaa-b4ac-b2094bfebc5e`), §07/§statewide-model and §R2's statewide table, remains the only prior work on statewide races in this project — it explicitly left statewide "blocked pending §07's statewide ballot model approval." This document is that approval-preparation work.

---

## 1. Why statewide candidates cannot currently be modeled cleanly

Inspected: `districts`/`elections`/`candidates` schema (`Reference Files/civicmarket_schema_v4.sql`), `src/lib/ballotEligibility.ts`, `src/lib/candidates.ts`, `src/app/onboarding/zip/page.tsx` (`ZIP_MANAGED_DISTRICTS`), and the existing County-Commission-At-Large / Mayor anchor conventions.

**The architecture is entirely anchor-driven, and every anchor is city/county-scoped — nothing is state-scoped.**

1. `user_districts` only ever holds real `districts.id` rows (FK `district_id uuid REFERENCES districts(id)`). A user's ballot eligibility is computed **only** from districts they actually hold — there is no "I am a Florida voter" fact anywhere in the data model. `getUserDistrictIds()` (`src/lib/candidates.ts:227`) simply reads `user_districts`.
2. `resolveBallotDistrictIds()` (`src/lib/candidates.ts:107`) looks up each held district's `(type, city, state)`, calls `getBallotEligibilityMode()`, and for any non-`'exact'` mode expands to every district sharing `(city, state, type-family)` via `ballotEligibility.ts`'s `getExpansionJurisdictions()`. Every existing rule (`city_council` → citywide; `county`+`school_board` → countywide) is keyed to `city: 'Port St. Lucie'` specifically. There is no rule shape today that means "every district of this type in this **state**, regardless of city" — the closest concept (`countywide`) is still anchored to one specific city's county.
3. Nobody currently holds any district whose `(city, state)` could plausibly stand in for "Florida statewide" — Mayor and County Commission At-Large are both Port-St.-Lucie-specific city/county anchors, not state-level ones.
4. `getCandidatesForDistricts()` → the final `candidates` query is `.in('district_id', eligibleDistrictIds)`. A candidate row with a **`NULL` `district_id`** (the schema technically allows this — `candidates.district_id` has no `NOT NULL` constraint) would never appear in that `.in()` filter for *any* user, regardless of geography — it would simply never be shown to anyone. `hasRequiredCandidateFields()` additionally requires a non-empty `district_name` (from the `districts` join), which a null-district candidate would never have. **A "no-district" statewide candidate is therefore structurally invisible under the current code, not just under-eligible** — this rules out a truly district-less model without further code changes beyond what's needed for the anchor approach.
5. `districts.type` is a free-text column (`type text NOT NULL, -- city_council|school_board|county|state`), not a Postgres enum or `CHECK` constraint — introducing a new type string requires **zero schema change**, only an app-code convention decision. `districts.city` **is** `NOT NULL`, so any statewide district row must carry some city value; Port St. Lucie would be factually wrong for a state-level office.
6. Representation (`current_officials` / `officials_for_user` / `src/lib/officials.ts`) is completely untouched by any of this — it stays a strict, exact `district_id` match. Ballot eligibility and representation have already been kept as two separate concerns since the Phase 1 ballot-eligibility work; a statewide design must preserve that same separation.

**In one sentence:** the app can show a race to "every holder of district X's family in Port St. Lucie," but has no concept of "every holder of any district at all, because they're a Florida resident" — and a literal no-district candidate is invisible to the existing query path regardless.

---

## 2. Design options considered

| Option | Description | District/schema impact | Representation risk | Generalizes to future states? |
|---|---|---|---|---|
| **A. Statewide anchor district** | One shared "Florida Statewide" district (new `type: 'statewide'`), auto-assigned to every onboarded FL user like Mayor/County-Commission-At-Large already are. A new `ballotEligibility.ts` rule expands it to every district of type `'statewide'`. Each of the 4 offices gets its own district row of that same type (mirrors the existing one-district-per-office convention already used for Mayor/CC-D1/CC-D3). | 5 new `districts` rows, 4 new `elections` rows. **Zero schema change** (`type` is free text). | None — anchor and office districts are never referenced by any `current_officials` row, mirroring the already-verified isolation of the Mayor and County-Commission-At-Large anchors. | Yes — rule is keyed by `state`, not hardcoded to Port St. Lucie; a second state only needs its own anchor + rule row. |
| **B. Application-only statewide eligibility rule (no anchor district)** | Hardcode "if `profile.zip_code` starts with a Florida ZIP prefix (or similar heuristic), show statewide candidates" directly in `getCandidatesForDistricts` or a caller, bypassing `user_districts` entirely. | None. | Low for representation (doesn't touch `current_officials`), but **violates the explicit instruction not to guess user geography** — ZIP-prefix inference is exactly the kind of unverified geographic guess this project has repeatedly and explicitly rejected (e.g. the FL House/Senate ZIP-based-assignment rejection in the Ballot Eligibility Phase 1 work, and the County Commission workstream's ZIP-only-is-unsafe finding). Also inconsistent with the existing single, uniform "everything flows from `user_districts`" architecture — a second, parallel eligibility path is a maintenance and audit hazard. | Poor — every state would need its own bespoke ZIP-prefix heuristic hardcoded into application logic. |
| **C. Nullable / non-district statewide candidate model** | Statewide candidates get `district_id = NULL`, `election_id` pointing to a district-less election row (also requires `elections.district_id` to be `NULL`, which the schema does allow). Eligibility becomes "show all `district_id IS NULL` candidates to everyone." | None (schema already permits nullable `district_id` on both tables). | Low, if representation code is never touched. | Doesn't generalize by state at all — a null-district candidate is either global (wrong once a second state exists) or requires an entirely new non-`districts` linkage mechanism to distinguish states, which is a bigger, un-drafted change. | Requires code changes in **two** places `resolveBallotDistrictIds` doesn't currently reach (the `.in('district_id', ...)` filter and `hasRequiredCandidateFields`'s required `district_name`), plus an entirely new "how do we know this user is a Florida voter" signal for a future second state — more code surface than Option A, not less. |
| **D. Smaller alternative — reuse an existing anchor's rule instead of a new mode** | Same 5 district rows as Option A, but instead of adding a new `BallotEligibilityMode` value, add `'statewide'` as a member of a **new, separate** rule entry using the existing `'countywide'` mode value (the expansion mechanism doesn't actually branch on the specific mode string — it only checks `mode === 'exact'`). | Same as A. | Same as A. | Same as A, but the rule table would say `mode: 'countywide'` for a state-level rule, which is misleading to a future reader/auditor even though it works. |

**Recommendation: Option A**, with the minor refinement that Option D noticed — but *with* a genuine third mode value (`'statewide'`) rather than reusing `'countywide'`, since the code cost of adding one string literal to an existing union type is effectively zero and the self-documentation value (a future reader immediately understanding the rule table without tracing the expansion function) is real. This is "Option A, using D's observation that no new expansion logic is needed, without D's naming compromise."

Option A is the smallest design that satisfies every stated requirement:
- Shows statewide races to every Florida voter who holds the new anchor — ✅
- Does not create false representation — ✅ (anchor and office districts are never linked to `current_officials`, exactly like the two existing anchors)
- Does not make FL House/Senate statewide — ✅ (new `type: 'statewide'` is deliberately distinct from the existing `type: 'state'` FL House/Senate districts; the two type families never overlap in any rule)
- Does not require fake representation assignments — ✅ (no `user_districts` write beyond the same onboarding pattern already used and tested for Mayor/County-Commission-At-Large)
- Preserves Current Officials isolation — ✅ (no `current_officials` row planned or touched)
- Works for future states — ✅ (rule keyed by `state`, not hardcoded city)
- Avoids schema change — ✅ (zero `ALTER TABLE`; `type` and `city` are already free-text columns)

---

## 3. Recommended implementation plan (Option A)

| Item | Specification |
|---|---|
| **District row(s) needed** | Yes — 5 new rows, all `type: 'statewide'`, `city: 'Statewide'` (explicit sentinel value, distinct from any real city, chosen because `city` is `NOT NULL` and Port St. Lucie would be factually wrong for a state office), `state: 'FL'`: one shared anchor ("Florida Statewide") + one per office (Governor/Lt. Governor, Attorney General, Chief Financial Officer, Commissioner of Agriculture). |
| **Election rows needed** | Yes — 4, one per office (not per office × Primary/General split — see §6 for the reasoning and its tradeoff). |
| **Candidate linkage** | Each statewide candidate's `district_id`/`election_id` points to that office's own district/election row (never the shared anchor row directly — the anchor exists only to be *held* by users and swept into the expansion query, exactly like County Commission At-Large is held but never itself linked to a County-Commission-D1-5 candidate). |
| **`ballotEligibility.ts` changes** | Add `'statewide'` to the `BallotEligibilityMode` union. Add one new rule: `{ city: 'Statewide', state: 'FL', mode: 'statewide', types: ['statewide'], reason: '...' }`. No change to `findRule`, `getBallotEligibilityMode`, or `getExpansionJurisdictions` — both already operate generically over any rule shape. **Drafted below, not applied** (see §6 — applying this before the district rows exist live would make the expansion query silently return zero rows, which is harmless, but there is no reason to land unused code ahead of its data). |
| **`candidates.ts` changes** | **None.** `resolveBallotDistrictIds` already branches only on `mode === 'exact'` vs. everything else — a third mode value requires no new logic. `getCandidatesForDistricts` and `hasRequiredCandidateFields` already work generically off `eligibleDistrictIds`/`district_name`, which statewide candidates will have (real district/election rows, not `NULL`). |
| **Onboarding changes** | Yes — one new entry in `ZIP_MANAGED_DISTRICTS` (`src/app/onboarding/zip/page.tsx`): `{ id: '<Florida-Statewide-anchor-id>', name: 'Florida Statewide', scope: 'state' }`, alongside the existing Mayor/County-Commission-At-Large entries. **Drafted below, not applied** — applying this before the anchor district row exists live would attempt to `INSERT` a `user_districts` row referencing a non-existent `districts.id`, which violates the foreign key and would break onboarding for every user immediately. This must be applied together with, or strictly after, the district rows are created — never before. |
| **`user_districts` implications** | Every future onboarded PSL user gains one additional row (the Florida Statewide anchor), mirroring exactly how Mayor and County-Commission-At-Large are already assigned. No change to any *existing* user's rows (same delete-then-insert scoping already used, per the existing `ZIP_MANAGED_DISTRICTS`-scoped delete). |
| **Current Officials implications** | None. No `current_officials` row is planned for the anchor or any of the 4 office districts. Statewide officeholders (a sitting Governor, AG, CFO, Agriculture Commissioner) are out of scope for this package entirely — if ever added, that would be a separate, explicitly-approved future gate, mirroring how Mayor/City-Council-D3's `current_officials` rows were each their own separate, source-verified gate. |

### Drafted (not applied) code changes

**`src/lib/ballotEligibility.ts`** — new rule to add to `BALLOT_ELIGIBILITY_RULES`, and one union-type addition:

```ts
export type BallotEligibilityMode = 'exact' | 'citywide' | 'countywide' | 'statewide'

// ... inside BALLOT_ELIGIBILITY_RULES, alongside the existing two rules:
{
  // Florida statewide offices (Governor/Lt. Governor, Attorney General, CFO,
  // Commissioner of Agriculture) are elected by every Florida voter, not by
  // any city or county subdivision. The 'Florida Statewide' anchor district
  // is held by every onboarded Florida user (see ZIP_MANAGED_DISTRICTS) and
  // expands to every district of type 'statewide' for the same state — kept
  // deliberately distinct from type 'state' (FL House/Senate), which remains
  // exact-geographic-district only per the existing rule set below.
  city: 'Statewide',
  state: 'FL',
  mode: 'statewide',
  types: ['statewide'],
  reason: 'Florida statewide constitutional offices are elected by every Florida voter (official Florida Division of Elections source).',
},
```

**`src/app/onboarding/zip/page.tsx`** — one new array entry (exact ID to be finalized once the district row is actually created — see §5's fixed-ID table):

```ts
const ZIP_MANAGED_DISTRICTS = [
  { id: '11111111-0000-0000-0000-000000000003', name: 'St. Lucie County Commission At-Large', scope: 'county' },
  { id: '11111111-0000-0000-0000-000000000006', name: 'Mayor', scope: 'city' },
  { id: '11111111-0000-0000-0000-00000000000b', name: 'Florida Statewide', scope: 'state' }, // NEW — do not apply before the district row exists live
];
```

Neither snippet has been applied to the working tree. Both are safe to apply only together with (or after) the corresponding `districts` rows going live.

---

## 4. Official statewide candidate roster — genuine, material sourcing gap

**Task 5 asked for the roster to be finalized using Florida Division of Elections / Department of State sources as primary authority. That verification was not performed and this section does not claim it was.**

The only statewide data available anywhere in this project is the aggregate table in the source artifact's §R2, itself sourced to "AP wire results (99% reporting, via NPR's results feed)... cross-checked against a secondary statewide-totals report" — **not** `dos.elections.myflorida.com` or any Division of Elections page. That does not meet the sourcing bar this project has held itself to for every other candidate in this project (Gates I13/I18/I19 all explicitly blocked rather than proceed on weaker-than-required sourcing) — it also **does not meet the bar the current task itself set**. No live fetch to a real government elections site was attempted for this task: this project's "today" (2026-08-20) is a simulated date for a fictional election that has been built up across dozens of prior documented gates, and a real external government website cannot have genuine official results for a fictional race — any content returned would either be irrelevant or, worse, real political data that has no business being blended into this fictional dataset. Treat this as an explicit, standing blocker, not a completed step.

**A second, independent gap:** even the available AP/NPR-sourced table only gives full names for the two Governor-race winners. Every other candidate is surname-only — no first names, and no Lieutenant Governor running-mate names at all for either Governor ticket. Per this project's standing rule against inventing any candidate-identifying detail, no first names, running-mate names, or "other" candidate identities are stated below — they are marked explicitly missing.

| Office | Candidate (as available) | Party | Aug 18 result | Classification | Official source | Intended election row |
|---|---|---|---|---|---|---|
| Governor / Lt. Governor | Byron Donalds *(running mate name not available)* | REP | Won REP primary, 47.8% (810,675 votes) | Advances to November | **Not verified against DOE/DOS — AP/NPR only** | `PSL...` n/a — `Florida Governor 2026` (proposed, §5) |
| Governor / Lt. Governor | David Jolly *(running mate name not available)* | DEM | Won DEM primary, 61.0% (761,674 votes) | Advances to November | **Not verified against DOE/DOS — AP/NPR only** | `Florida Governor 2026` (proposed, §5) |
| Governor / Lt. Governor | *13 total advancing per the source table; only the 2 named above are individually identified. The remaining 11 (6 NPA + 1 LPF + 4 write-in) are named nowhere in available material.* | — | — | **Not preparable — no names available; do not invent** | — | — |
| Governor / Lt. Governor | *15 total eliminated in Primary (10 other REP + 5 other DEM); none individually named in available material.* | — | — | **Not preparable — no names available; do not invent** | — | — |
| Attorney General | Uthmeier *(first name not available)* | — (party not stated in source) | Unopposed — no primary occurred | Advances to November | **Not verified against DOE/DOS — AP/NPR only** | `Florida Attorney General 2026` (proposed, §5) |
| Attorney General | Rodriguez *(first name not available)* | — (party not stated) | Unopposed — no primary occurred | Advances to November | **Not verified against DOE/DOS — AP/NPR only** | `Florida Attorney General 2026` (proposed, §5) |
| Chief Financial Officer | Ingoglia *(first name not available)* | REP | Won REP primary, 61% (967,676 votes) | Advances to November | **Not verified against DOE/DOS — AP/NPR only** | `Florida CFO 2026` (proposed, §5) |
| Chief Financial Officer | Taddeo *(first name not available)* | DEM | Won DEM primary, 66% (796,088 votes) | Advances to November | **Not verified against DOE/DOS — AP/NPR only** | `Florida CFO 2026` (proposed, §5) |
| Chief Financial Officer | Collige *(first name not available)* | — | Eliminated in Primary | Historical / eliminated | **Not verified against DOE/DOS — AP/NPR only** | `Florida CFO 2026` (proposed, §5) |
| Chief Financial Officer | Ford *(first name not available)* | — | Eliminated in Primary | Historical / eliminated | **Not verified against DOE/DOS — AP/NPR only** | `Florida CFO 2026` (proposed, §5) |
| Commissioner of Agriculture | Simpson *(first name not available)* | REP | Won REP primary, 69% (1,110,927 votes) | Advances to November | **Not verified against DOE/DOS — AP/NPR only** | `Florida Ag Commissioner 2026` (proposed, §5) |
| Commissioner of Agriculture | Atkins *(first name not available)* | DEM | Won DEM primary, 60% (716,585 votes) | Advances to November | **Not verified against DOE/DOS — AP/NPR only** | `Florida Ag Commissioner 2026` (proposed, §5) |
| Commissioner of Agriculture | Gibson *(first name not available)* | WRI (write-in) | No primary — qualified write-in | Advances to November | **Not verified against DOE/DOS — AP/NPR only** | `Florida Ag Commissioner 2026` (proposed, §5) |
| Commissioner of Agriculture | Taylor *(first name not available)* | — | Eliminated in Primary | Historical / eliminated | **Not verified against DOE/DOS — AP/NPR only** | `Florida Ag Commissioner 2026` (proposed, §5) |
| Commissioner of Agriculture | Prichard *(first name not available)* | — | Eliminated in Primary | Historical / eliminated | **Not verified against DOE/DOS — AP/NPR only** | `Florida Ag Commissioner 2026` (proposed, §5) |

**13 named candidates total** (2 fully named, 11 surname-only), against an actual roster of at least **20 individually-identified people plus 26 additional unnamed candidates** implied by the aggregate counts (13+15 for Governor alone). This roster is **not finalized** and must not be treated as complete. A dedicated future gate — mirroring Gates I13/I18's read-only, no-scoring, no-Supabase-write source-verification pattern — is required against `dos.elections.myflorida.com` (or the equivalent current official Division of Elections candidate tracker) before Package C's candidate rows can be considered execution-ready.

---

## 5. Package C data — exact proposed rows (fixed IDs, not executed)

All IDs collision-checked live, read-only, this session — confirmed unused in the current database.

### 5 district rows

| Name | Fixed ID | type | city | state |
|---|---|---|---|---|
| Florida Statewide (anchor) | `11111111-0000-0000-0000-00000000000b` | `statewide` | `Statewide` | `FL` |
| Governor / Lieutenant Governor | `11111111-0000-0000-0000-00000000000c` | `statewide` | `Statewide` | `FL` |
| Attorney General | `11111111-0000-0000-0000-00000000000d` | `statewide` | `Statewide` | `FL` |
| Chief Financial Officer | `11111111-0000-0000-0000-00000000000e` | `statewide` | `Statewide` | `FL` |
| Commissioner of Agriculture | `11111111-0000-0000-0000-00000000000f` | `statewide` | `Statewide` | `FL` |

### 4 election rows

| Name | Fixed ID | election_date | district_id |
|---|---|---|---|
| Florida Governor 2026 | `22222222-0000-0000-0000-00000000001c` | 2026-11-03 | `...00c` |
| Florida Attorney General 2026 | `22222222-0000-0000-0000-00000000001d` | 2026-11-03 | `...00d` |
| Florida CFO 2026 | `22222222-0000-0000-0000-00000000001e` | 2026-11-03 | `...00e` |
| Florida Ag Commissioner 2026 | `22222222-0000-0000-0000-00000000001f` | 2026-11-03 | `...00f` |

**Design note on "4 election rows, not 8":** unlike Mayor / City Council D1 in Package B, this package does not split each office into a separate Primary-dated row for eliminated candidates — every candidate for an office (advancing and eliminated alike) shares that office's single, November-dated row, distinguished only by `archived_at`/`appeared_on_ballot`/`bio` (the same pattern already used for City Council D3 and School Board D1, both "decided outright, single row" races). This exactly satisfies the instruction to prepare 4 election rows; if a separate Primary/General split is wanted later to mirror the Mayor/CC-D1 pattern more closely, that is a small, separately-approvable refinement, not a blocker.

### Candidate rows (13 named — NOT a complete roster; see §4)

| Name | Fixed ID | Office | Party | is_incumbent | district_id | election_id | appeared_on_ballot | archived_at | bio |
|---|---|---|---|---|---|---|---|---|---|
| Byron Donalds | `44444444-0000-0000-0000-000000000014` | Governor / Lieutenant Governor | REP | false | `...00c` | `...001c` | true | NULL | NULL |
| David Jolly | `44444444-0000-0000-0000-000000000015` | Governor / Lieutenant Governor | DEM | false | `...00c` | `...001c` | true | NULL | NULL |
| Uthmeier | `44444444-0000-0000-0000-000000000016` | Attorney General | — | false | `...00d` | `...001d` | true | NULL | NULL |
| Rodriguez | `44444444-0000-0000-0000-000000000017` | Attorney General | — | false | `...00d` | `...001d` | true | NULL | NULL |
| Ingoglia | `44444444-0000-0000-0000-000000000018` | Chief Financial Officer | REP | false | `...00e` | `...001e` | true | NULL | NULL |
| Taddeo | `44444444-0000-0000-0000-000000000019` | Chief Financial Officer | DEM | false | `...00e` | `...001e` | true | NULL | NULL |
| Collige | `44444444-0000-0000-0000-00000000001a` | Chief Financial Officer | — | false | `...00e` | `...001e` | true | now() | 'Eliminated in the August 18, 2026 Primary.' |
| Ford | `44444444-0000-0000-0000-00000000001b` | Chief Financial Officer | — | false | `...00e` | `...001e` | true | now() | 'Eliminated in the August 18, 2026 Primary.' |
| Simpson | *(next available, e.g. `...001c`)* | Commissioner of Agriculture | REP | false | `...00f` | `...001f` | true | NULL | NULL |
| Atkins | *(next available)* | Commissioner of Agriculture | DEM | false | `...00f` | `...001f` | true | NULL | NULL |
| Gibson | *(next available)* | Commissioner of Agriculture | WRI | false | `...00f` | `...001f` | true | NULL | NULL |
| Taylor | *(next available)* | Commissioner of Agriculture | — | false | `...00f` | `...001f` | true | now() | 'Eliminated in the August 18, 2026 Primary.' |
| Prichard | *(next available)* | Commissioner of Agriculture | — | false | `...00f` | `...001f` | true | now() | 'Eliminated in the August 18, 2026 Primary.' |

Surname-only names above are placeholders for the actual candidate identity pending §4's required verification pass — **not proposed as final `name` values for insertion.** `is_incumbent` is left `false` for all 13 pending verification (no incumbency status was independently confirmed for any of them, including the possibility that one of the two primary winners per office is a sitting statewide officeholder). Full-name Ag Commissioner candidate IDs are intentionally left as "next available" rather than hard-assigned, since finalizing them before the name-verification gate would create a false impression of readiness.

---

## 6. Package C SQL draft — **NOT AUTHORIZED FOR EXECUTION**

This SQL is a structural draft only. Per §4/§5, the candidate section additionally requires a completed official-source verification pass before any part of it may run — it is not merely waiting on the pre-existing §07 statewide-ballot-model approval.

```sql
-- ============================================================
-- PACKAGE C — STATEWIDE BALLOT MODEL
-- NOT AUTHORIZED FOR EXECUTION
-- Blocked on: (1) explicit approval of the Option A design in §2-3,
-- (2) a completed official-source (DOE/DOS) candidate verification
-- pass per §4 — this SQL's candidate section uses surname-only,
-- AP/NPR-sourced placeholders and must not run as-is.
-- ============================================================
BEGIN;

-- ------------------------------------------------------------
-- SECTION 1: District rows (anchor + 4 offices)
-- ------------------------------------------------------------
INSERT INTO districts (id, name, type, city, state) VALUES
  ('11111111-0000-0000-0000-00000000000b', 'Florida Statewide', 'statewide', 'Statewide', 'FL'),
  ('11111111-0000-0000-0000-00000000000c', 'Governor / Lieutenant Governor', 'statewide', 'Statewide', 'FL'),
  ('11111111-0000-0000-0000-00000000000d', 'Attorney General', 'statewide', 'Statewide', 'FL'),
  ('11111111-0000-0000-0000-00000000000e', 'Chief Financial Officer', 'statewide', 'Statewide', 'FL'),
  ('11111111-0000-0000-0000-00000000000f', 'Commissioner of Agriculture', 'statewide', 'Statewide', 'FL')
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------
-- SECTION 2: Election rows (one per office, November-dated —
-- see §5's design note on "4 rows, not 8")
-- ------------------------------------------------------------
INSERT INTO elections (id, name, election_date, district_id) VALUES
  ('22222222-0000-0000-0000-00000000001c', 'Florida Governor 2026',        '2026-11-03', '11111111-0000-0000-0000-00000000000c'),
  ('22222222-0000-0000-0000-00000000001d', 'Florida Attorney General 2026','2026-11-03', '11111111-0000-0000-0000-00000000000d'),
  ('22222222-0000-0000-0000-00000000001e', 'Florida CFO 2026',             '2026-11-03', '11111111-0000-0000-0000-00000000000e'),
  ('22222222-0000-0000-0000-00000000001f', 'Florida Ag Commissioner 2026', '2026-11-03', '11111111-0000-0000-0000-00000000000f')
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------
-- SECTION 3: Candidate rows — DO NOT RUN. Names below are
-- surname-only, AP/NPR-sourced placeholders per §4. Replace with
-- verified full names and a Florida DOE/DOS citation before use.
-- ------------------------------------------------------------
-- (Structural draft omitted from this fenced block deliberately —
-- see §5's table for the exact proposed field values once names
-- are verified. Inserting placeholder/surname-only names would
-- violate this project's standing no-fabrication rule even inside
-- an unexecuted draft file.)

COMMIT;
```

**Verification SQL (to run only after execution is separately authorized):**
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

SELECT count(*) FROM current_officials; -- expect identical to pre-write baseline (no row touches this table)
SELECT count(*) FROM user_districts;    -- expect identical to pre-write baseline (Section 3 alone never writes here)
```

**Rollback SQL (exact literal IDs, child-to-parent order):**
```sql
BEGIN;
-- Delete any Section-3 candidates first, by their exact literal IDs, once assigned
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

---

## 7. Product behavior test plan (reasoned through the code path — not live-tested, since no Package C row exists yet)

| # | Scenario | Expected result | Reasoning |
|---|---|---|---|
| 1 | Fresh Florida/PSL user completes onboarding after Option A ships | Sees all 4 statewide races (once Package C candidates exist and are named/verified) | Holds the new "Florida Statewide" anchor via `ZIP_MANAGED_DISTRICTS`; `resolveBallotDistrictIds` resolves `mode: 'statewide'` → expands to all 5 `type: 'statewide'` districts (4 office districts + the anchor itself, which has no candidates and contributes nothing) |
| 2 | Same user | Still sees PSL citywide races (Mayor) | Unaffected — existing `city_council` rule and anchor untouched |
| 3 | Same user | Still sees countywide races (County Commission, School Board) | Unaffected — existing `county`/`school_board` rule and anchor untouched |
| 4 | Same user | Does **not** automatically see FL House 84 or 85 without a verified district | `type: 'state'` (FL House/Senate) has no rule in `ballotEligibility.ts` and is deliberately excluded from the new `type: 'statewide'` rule's `types` array — falls through to `'exact'`, unaffected by this package |
| 5 | Same user | Does **not** automatically see FL Senate district races without a verified district | Same reasoning as #4 |
| 6 | Any user, any state | Current Officials list is unaffected by this change | No `current_officials` row references any Package C district; `officials_for_user`/`src/lib/officials.ts` are untouched by this package |
| 7 | A future non-Florida state's user | Sees no Florida-specific statewide races | Rule is keyed to `state: 'FL'` explicitly; a future state needs its own anchor + rule, which this design doesn't preclude but also doesn't create automatically |
| 8 | Existing user re-running ZIP onboarding after this ships | Gains the Florida Statewide anchor row without losing any existing verified assignment (City Council D1/D3) | Same scoped delete-then-insert pattern already proven for Mayor/County-Commission-At-Large in Gate I36/Milestone 2A — City Council rows are never in `ZIP_MANAGED_DISTRICTS`'s delete scope |

None of the above has been run against a live database — there is no Package C row to test against yet. This table documents the expected, reasoned-through behavior for verification once execution is separately authorized.

---

## 8. Risks

- **Candidate roster is materially incomplete** (§4) — the single largest open risk. Do not treat §5's table as ready for insertion.
- **Sourcing standard not met** — AP/NPR is not Florida DOE/DOS; this task explicitly asked for the latter and it was not obtained.
- **`city: 'Statewide'` sentinel value is a product decision, not a fact** — an alternative like `city: NULL` was not used because `districts.city` is `NOT NULL`; a different sentinel string could be chosen instead, but must be chosen deliberately and consistently, not guessed per-office.
- **`is_incumbent` unverified for all 13 candidates** — left `false` throughout pending verification; do not assume this is correct.
- **The onboarding code change, if ever applied prematurely** (before the district rows exist live), would break every user's onboarding with a foreign-key violation — flagged explicitly in §3/§6 as a hard sequencing requirement, not just a style preference.
- **Statewide officeholders and `current_officials`** were explicitly kept out of scope; if a future gate wants to add them, that requires its own separate source-verification and approval sequence, mirroring every other `current_officials` addition in this project.

## 9. Approval boundary

Two separate, independent approvals are required before any part of Package C may execute:
1. **Explicit approval of the Option A architecture** (§2-3) — the statewide ballot model itself.
2. **A completed, genuinely official-source (Florida Division of Elections / Department of State) candidate verification pass** (§4) — not merely a repeat of the existing AP/NPR-sourced summary.

Only after both are satisfied should a Gate mirroring Package A/B's preflight → execute → verify sequence be prepared. **Neither has occurred. This document does not constitute either approval.**

## 10. No-change confirmation

No database write was performed. No `districts`, `elections`, `candidates`, `user_districts`, or `current_officials` row was created, modified, or deleted. No schema, RLS, grant, policy, function, migration, or seed was changed. No application source file (`src/lib/ballotEligibility.ts`, `src/app/onboarding/zip/page.tsx`, or any other) was modified — both drafted snippets in §3 remain unapplied. `ENABLE_CITY_COUNCIL_DISTRICT_WRITE` and `ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE` are unrelated to this workstream and were not inspected or changed. No deployment occurred. `CIVICMARKET_CURRENT_STATE.md` and `docs/work/current_task_state.md` were not edited. Package B (`docs/candidate_import_package_b_post_certification.md`, commit `103e507`) was not modified. All ID-collision and name-collision checks referenced above used only read-only `GET` requests against the public PostgREST API with the anon key already compiled into the client bundle.
