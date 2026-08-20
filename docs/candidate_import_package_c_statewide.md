# Candidate Import Package C — Statewide Ballot Model and Candidate Package

Status: **DESIGN / DRAFT ONLY. NOT AUTHORIZED FOR EXECUTION.** No database write performed. No app source file modified. Candidate roster (§4/§5/§6) is now DOE/DOS-verified for all 39 qualified candidates (updated 08-20-2026, second pass) — architecture approval (§2-3) remains the sole outstanding blocker; see §9.

Date: 08-20-2026 (updated same day — official roster verification pass)

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

## 4. Official statewide candidate roster — verified against Florida DOE/DOS (08-20-2026 update)

**Update, this pass:** fetched directly against the Florida Division of Elections' official Candidate Tracking System (`https://dos.elections.myflorida.com/candidates/`), not AP/NPR/Wikipedia/news/aggregators. Wikipedia was consulted once, briefly, only to identify the correct office-code URL pattern to try next — never as evidence for any name, party, or status below; every fact stated below traces to a `dos.elections.myflorida.com` fetch, cited per office. The previous AP/NPR-sourced 13-candidate estimate is **fully superseded** by this section.

**Exact URLs fetched:**
- Governor: `https://dos.elections.myflorida.com/candidates/CanList.asp?elecid=20261103-GEN&OfficeCode=GOV` (fetched twice independently, both returned 28 rows — consistent)
- Attorney General, Chief Financial Officer, Commissioner of Agriculture: `https://dos.elections.myflorida.com/candidates/CanList.asp?elecid=20261103-GEN` (unfiltered listing page, sectioned by office; AG/CFO/AgComm sections extracted directly)

**What this data is, and is not:** this is the Division of Elections' **qualification/candidate-tracking** roster — every candidate below shows status "Qualified" as of this fetch. It is not a certified, or even unofficial, **results** roster — no vote count, precinct-reporting, or canvassing-board page was fetched in this pass. Per the explicit instruction, qualification facts and result facts are kept strictly separate: qualification-only facts (who qualified, party, running mate, whether a primary contest exists at all) are verified now; who *won* a contested primary is **not** stated anywhere below. The previous pass's AP/NPR-sourced win/loss calls (Donalds, Jolly, Ingoglia, Taddeo, Simpson, Atkins as "winners") are not repeated or relied upon here — they were unofficial and are superseded, not merely re-labeled.

**A primary-contest structure fact, not a vote-count fact, determines certification-independence:** in Florida, NPA (no party affiliation) and minor-party (e.g. LPF) qualifiers do not face a primary at all — they qualify straight to the general. Write-in (WRI) qualifiers likewise never face a primary. A party line with exactly one qualified candidate had no contest to decide. All of that is knowable from the qualification roster alone, with zero dependency on any vote count or certification — the same logic already used for Larry Leet/Rolin Dorsainvil/Nicholas Burgos in the already-executed Package A. Only a party line with **more than one** qualified candidate has an actual contested-primary result still pending.

### Governor / Lieutenant Governor — 28 qualified candidates

| Name (Last, First) | Party | Lt. Governor running mate | Account | Primary contest? | Classification |
|---|---|---|---|---|---|
| Abrams, Dean | NPA | — | 90433 | No (NPA, no primary) | Certification-independent — advances to Nov. |
| Anderson, Kathy | WRI | — | 90612 | No (write-in) | Certification-independent — qualified write-in for Nov. |
| Burkett, Charles | NPA | — | 90630 | No (NPA, no primary) | Certification-independent — advances to Nov. |
| Castillo-Bach, Evelyn | DEM | — | 89619 | Yes — DEM (6 qualifiers) | Certification-dependent |
| Collins, Jay | REP | — | 89690 | Yes — REP (11 qualifiers) | Certification-dependent |
| Datto, Jeffrey | NPA | — | 89630 | No (NPA, no primary) | Certification-independent — advances to Nov. |
| DeJesus, David | WRI | — | 92544 | No (write-in) | Certification-independent — qualified write-in for Nov. |
| Dembinsky, Richard | WRI | — | 89280 | No (write-in) | Certification-independent — qualified write-in for Nov. |
| Dimanche, Moliere | NPA | — | 88529 | No (NPA, no primary) | Certification-independent — advances to Nov. |
| Donalds, Byron | REP | *(not linked in this system as of this fetch)* | 89042 | Yes — REP (11 qualifiers) | Certification-dependent |
| Fernandez, Thomas | DEM | — | 89629 | Yes — DEM (6 qualifiers) | Certification-dependent |
| Fishback, James | REP | Lozano, Sean A. | 89600 | Yes — REP (11 qualifiers) | Certification-dependent |
| Foster, Dayna | DEM | — | 89353 | Yes — DEM (6 qualifiers) | Certification-dependent |
| Holcomb, Jim | REP | — | 89140 | Yes — REP (11 qualifiers) | Certification-dependent |
| Jewett, Scott | LPF | — | 84076 | No (sole LPF qualifier) | Certification-independent — advances to Nov. |
| Jolly, David | Graham, Gwen | 89243 | Yes — DEM (6 qualifiers) | Certification-dependent |
| Joseph, Dotie | DEM | — | 92056 | Yes — DEM (6 qualifiers) | Certification-dependent |
| McCaffrey, Arthur | REP | — | 90679 | Yes — REP (11 qualifiers) | Certification-dependent |
| Meade, Desmond | NPA | — | 90992 | No (NPA, no primary) | Certification-independent — advances to Nov. |
| Morris, Erik | WRI | — | 89939 | No (write-in) | Certification-independent — qualified write-in for Nov. |
| Nokovich, Daniel | REP | — | 90250 | Yes — REP (11 qualifiers) | Certification-dependent |
| Norman, Stephann | DEM | — | 89987 | Yes — DEM (6 qualifiers) | Certification-dependent |
| Renner, Paul | REP | — | 89414 | Yes — REP (11 qualifiers) | Certification-dependent |
| Rodriguez, Rachel | REP | — | 89711 | Yes — REP (11 qualifiers) | Certification-dependent |
| Russo, Frank | NPA | — | 89571 | No (NPA, no primary) | Certification-independent — advances to Nov. |
| Shaw, James | REP | — | 89867 | Yes — REP (11 qualifiers) | Certification-dependent |
| Succe, Caneste | REP | — | 89052 | Yes — REP (11 qualifiers) | Certification-dependent |
| Williams, Bobby | REP | — | 89032 | Yes — REP (11 qualifiers) | Certification-dependent |

Party breakdown (verified count): 11 REP, 6 DEM, 6 NPA, 4 WRI, 1 LPF = 28. Only two candidates have an officially linked Lt. Governor running mate in this system as of this fetch — Fishback/Lozano and Jolly/Graham. Donalds' running mate is **not shown as linked** in the official system at this time; this is stated as observed, not filled in from any outside source. Per Task 2's instruction, no separate standalone Lieutenant Governor race/district is created — a running mate is recorded as an attribute of the Governor candidate, matching the existing CivicMarket one-`candidates`-row-per-ticket model.

**Governor: 11 certification-independent (6 NPA + 4 WRI + 1 LPF), 17 certification-dependent (11 REP + 6 DEM).**

### Attorney General — 2 qualified candidates

| Name (Last, First) | Party | Account | Primary contest? | Classification |
|---|---|---|---|---|
| Rodriguez, Jose Javier | DEM | 89231 | No (sole DEM qualifier) | Certification-independent — advances to Nov. |
| Uthmeier, James | REP | 89041 | No (sole REP qualifier) | Certification-independent — advances to Nov. |

**AG: 2 certification-independent, 0 certification-dependent.** Neither party line had more than one qualifier — no primary contest occurred for this office at all.

### Chief Financial Officer — 4 qualified candidates

| Name (Last, First) | Party | Account | Primary contest? | Classification |
|---|---|---|---|---|
| Collige, Frank William | REP | 88803 | Yes — REP (2 qualifiers) | Certification-dependent |
| Ford, Earle | DEM | 90995 | Yes — DEM (2 qualifiers) | Certification-dependent |
| Ingoglia, Blaise | REP | 89394 | Yes — REP (2 qualifiers) | Certification-dependent |
| Taddeo, Annette | DEM | 91310 | Yes — DEM (2 qualifiers) | Certification-dependent |

**CFO: 0 certification-independent, 4 certification-dependent.** Both party lines were contested.

### Commissioner of Agriculture — 5 qualified candidates

| Name (Last, First) | Party | Account | Primary contest? | Classification |
|---|---|---|---|---|
| Gibson, Kyle "KC" | WRI | 83588 | No (write-in) | Certification-independent — qualified write-in for Nov. |
| Mendoza Atkins, Joey | DEM | 92013 | Yes — DEM (2 qualifiers) | Certification-dependent |
| Prichard, Donald A. "Don" | DEM | 90847 | Yes — DEM (2 qualifiers) | Certification-dependent |
| Simpson, Wilton | REP | 90560 | Yes — REP (2 qualifiers) | Certification-dependent |
| Taylor, Matt | REP | 89531 | Yes — REP (2 qualifiers) | Certification-dependent |

**Ag Commissioner: 1 certification-independent (Gibson, WRI), 4 certification-dependent.**

### Incumbency

`is_incumbent` is **not** shown as a field on the `CanList.asp` pages fetched — no candidate above is marked incumbent by this data. Confirming incumbency (e.g. a sitting statewide officeholder appointed mid-term) would require a further, separately-cited official source (such as each candidate's individual `CanDetail.asp` page) not fetched in this pass. All 39 candidates are recorded with `is_incumbent = false` pending that separate confirmation — treat this as "not yet confirmed," not as an assertion that none of them are incumbents.

### What is still explicitly NOT determined by this pass

- **Who won any contested primary** (Governor REP/DEM, CFO REP/DEM, Ag Commissioner REP/DEM — 25 candidates total across 6 party lines). This requires a genuine official results source (not fetched in this pass) plus, per the explicit instruction, should not be converted to a permanent classification before certification regardless.
- **Incumbency status** for any candidate (see above).
- Any candidate's photo, website, or biographical detail (out of scope for this pass; not part of Task 1-5).

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

### Candidate rows — 39 total, exact official names, collision-checked live (read-only, this session — all 39 IDs confirmed unused)

`archived_at`/`bio` are left `NULL` for every candidate below, including the 25 in contested primary races — per Task 6's explicit instruction, no unofficial result is converted into a permanent classification. The "Primary contest?" column from §4 is carried here as the authoritative certification-independent/dependent split; it is a qualification-structure fact (verified), not a result guess.

**Certification-independent (14 — safe once the architecture in §2-3 is separately approved; no vote-count or certification needed for these):**

| Name | Fixed ID | Office | Party |
|---|---|---|---|
| Abrams, Dean | `44444444-0000-0000-0000-000000000014` | Governor / Lieutenant Governor | NPA |
| Anderson, Kathy | `44444444-0000-0000-0000-000000000015` | Governor / Lieutenant Governor | WRI |
| Burkett, Charles | `44444444-0000-0000-0000-000000000016` | Governor / Lieutenant Governor | NPA |
| Datto, Jeffrey | `44444444-0000-0000-0000-000000000019` | Governor / Lieutenant Governor | NPA |
| DeJesus, David | `44444444-0000-0000-0000-00000000001a` | Governor / Lieutenant Governor | WRI |
| Dembinsky, Richard | `44444444-0000-0000-0000-00000000001b` | Governor / Lieutenant Governor | WRI |
| Dimanche, Moliere | `44444444-0000-0000-0000-00000000001c` | Governor / Lieutenant Governor | NPA |
| Jewett, Scott | `44444444-0000-0000-0000-000000000022` | Governor / Lieutenant Governor | LPF |
| Meade, Desmond | `44444444-0000-0000-0000-000000000026` | Governor / Lieutenant Governor | NPA |
| Morris, Erik | `44444444-0000-0000-0000-000000000027` | Governor / Lieutenant Governor | WRI |
| Russo, Frank | `44444444-0000-0000-0000-00000000002c` | Governor / Lieutenant Governor | NPA |
| Rodriguez, Jose Javier | `44444444-0000-0000-0000-000000000030` | Attorney General | DEM |
| Uthmeier, James | `44444444-0000-0000-0000-000000000031` | Attorney General | REP |
| Gibson, Kyle "KC" | `44444444-0000-0000-0000-000000000036` | Commissioner of Agriculture | WRI |

**Certification-dependent (25 — additionally blocked on an official results source, not fetched in this pass, plus certification itself):**

| Name | Fixed ID | Office | Party |
|---|---|---|---|
| Castillo-Bach, Evelyn | `44444444-0000-0000-0000-000000000017` | Governor / Lieutenant Governor | DEM |
| Collins, Jay | `44444444-0000-0000-0000-000000000018` | Governor / Lieutenant Governor | REP |
| Donalds, Byron | `44444444-0000-0000-0000-00000000001d` | Governor / Lieutenant Governor | REP |
| Fernandez, Thomas | `44444444-0000-0000-0000-00000000001e` | Governor / Lieutenant Governor | DEM |
| Fishback, James (running mate: Lozano, Sean A.) | `44444444-0000-0000-0000-00000000001f` | Governor / Lieutenant Governor | REP |
| Foster, Dayna | `44444444-0000-0000-0000-000000000020` | Governor / Lieutenant Governor | DEM |
| Holcomb, Jim | `44444444-0000-0000-0000-000000000021` | Governor / Lieutenant Governor | REP |
| Jolly, David (running mate: Graham, Gwen) | `44444444-0000-0000-0000-000000000023` | Governor / Lieutenant Governor | DEM |
| Joseph, Dotie | `44444444-0000-0000-0000-000000000024` | Governor / Lieutenant Governor | DEM |
| McCaffrey, Arthur | `44444444-0000-0000-0000-000000000025` | Governor / Lieutenant Governor | REP |
| Nokovich, Daniel | `44444444-0000-0000-0000-000000000028` | Governor / Lieutenant Governor | REP |
| Norman, Stephann | `44444444-0000-0000-0000-000000000029` | Governor / Lieutenant Governor | DEM |
| Renner, Paul | `44444444-0000-0000-0000-00000000002a` | Governor / Lieutenant Governor | REP |
| Rodriguez, Rachel | `44444444-0000-0000-0000-00000000002b` | Governor / Lieutenant Governor | REP |
| Shaw, James | `44444444-0000-0000-0000-00000000002d` | Governor / Lieutenant Governor | REP |
| Succe, Caneste | `44444444-0000-0000-0000-00000000002e` | Governor / Lieutenant Governor | REP |
| Williams, Bobby | `44444444-0000-0000-0000-00000000002f` | Governor / Lieutenant Governor | REP |
| Collige, Frank William | `44444444-0000-0000-0000-000000000032` | Chief Financial Officer | REP |
| Ford, Earle | `44444444-0000-0000-0000-000000000033` | Chief Financial Officer | DEM |
| Ingoglia, Blaise | `44444444-0000-0000-0000-000000000034` | Chief Financial Officer | REP |
| Taddeo, Annette | `44444444-0000-0000-0000-000000000035` | Chief Financial Officer | DEM |
| Mendoza Atkins, Joey | `44444444-0000-0000-0000-000000000037` | Commissioner of Agriculture | DEM |
| Prichard, Donald A. "Don" | `44444444-0000-0000-0000-000000000038` | Commissioner of Agriculture | DEM |
| Simpson, Wilton | `44444444-0000-0000-0000-000000000039` | Commissioner of Agriculture | REP |
| Taylor, Matt | `44444444-0000-0000-0000-00000000003a` | Commissioner of Agriculture | REP |

All 39 rows share their office's `district_id`/`election_id` from the tables above (`...00c`/`...001c` Governor, `...00d`/`...001d` AG, `...00e`/`...001e` CFO, `...00f`/`...001f` Ag Commissioner), `appeared_on_ballot = true`, `archived_at = NULL`, `is_incumbent = false` (unconfirmed, see §4), `bio = NULL`. `is_incumbent` and any won/lost distinction are deliberately not encoded in these rows — see §4's "not yet determined" list.

---

## 6. Package C SQL draft — **NOT AUTHORIZED FOR EXECUTION**

This SQL is a structural draft only. The candidate names are now DOE/DOS-verified (§4), but execution is still blocked on (1) explicit approval of the Option A architecture in §2-3, and (2) for the 25 certification-dependent candidates, official primary certification plus a genuine official results source (not yet fetched — see §4's "not yet determined" list).

```sql
-- ============================================================
-- PACKAGE C — STATEWIDE BALLOT MODEL
-- NOT AUTHORIZED FOR EXECUTION
-- Blocked on: (1) explicit approval of the Option A design in §2-3.
-- Candidate names below are DOE/DOS-verified (§4) as of 08-20-2026.
-- The 25 certification-dependent candidates additionally require
-- official primary certification before any is_incumbent/won/lost
-- refinement -- none is encoded in this draft.
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
-- SECTION 3: Candidate rows — 39 total, DOE/DOS-verified names
-- (§4/§5). is_incumbent left false (unconfirmed, §4). No won/lost
-- distinction encoded anywhere -- archived_at/bio NULL for all 39,
-- including the 25 certification-dependent rows, per Task 6.
-- ------------------------------------------------------------
-- NOTE: the live `candidates` table has no `party` column (schema
-- inspected in §1 — only id/name/office/district_id/election_id/
-- photo_url/bio/website/is_incumbent/appeared_on_ballot/archived_at/
-- created_at exist). Party is therefore NOT included as a column
-- here, matching the same gap already documented for source_url in
-- Package B's provenance decision. Party is recorded in this
-- document's §4/§5 tables for reference, not in the SQL payload.
INSERT INTO candidates (id, name, office, is_incumbent, district_id, election_id, appeared_on_ballot) VALUES
  -- Governor / Lieutenant Governor (28) — district_id '...00c', election_id '...001c'
  ('44444444-0000-0000-0000-000000000014', 'Dean Abrams', 'Governor / Lieutenant Governor', false, '11111111-0000-0000-0000-00000000000c', '22222222-0000-0000-0000-00000000001c', true),
  ('44444444-0000-0000-0000-000000000015', 'Kathy Anderson', 'Governor / Lieutenant Governor', false, '11111111-0000-0000-0000-00000000000c', '22222222-0000-0000-0000-00000000001c', true),
  ('44444444-0000-0000-0000-000000000016', 'Charles Burkett', 'Governor / Lieutenant Governor', false, '11111111-0000-0000-0000-00000000000c', '22222222-0000-0000-0000-00000000001c', true),
  ('44444444-0000-0000-0000-000000000017', 'Evelyn Castillo-Bach', 'Governor / Lieutenant Governor', false, '11111111-0000-0000-0000-00000000000c', '22222222-0000-0000-0000-00000000001c', true),
  ('44444444-0000-0000-0000-000000000018', 'Jay Collins', 'Governor / Lieutenant Governor', false, '11111111-0000-0000-0000-00000000000c', '22222222-0000-0000-0000-00000000001c', true),
  ('44444444-0000-0000-0000-000000000019', 'Jeffrey Datto', 'Governor / Lieutenant Governor', false, '11111111-0000-0000-0000-00000000000c', '22222222-0000-0000-0000-00000000001c', true),
  ('44444444-0000-0000-0000-00000000001a', 'David DeJesus', 'Governor / Lieutenant Governor', false, '11111111-0000-0000-0000-00000000000c', '22222222-0000-0000-0000-00000000001c', true),
  ('44444444-0000-0000-0000-00000000001b', 'Richard Dembinsky', 'Governor / Lieutenant Governor', false, '11111111-0000-0000-0000-00000000000c', '22222222-0000-0000-0000-00000000001c', true),
  ('44444444-0000-0000-0000-00000000001c', 'Moliere Dimanche', 'Governor / Lieutenant Governor', false, '11111111-0000-0000-0000-00000000000c', '22222222-0000-0000-0000-00000000001c', true),
  ('44444444-0000-0000-0000-00000000001d', 'Byron Donalds', 'Governor / Lieutenant Governor', false, '11111111-0000-0000-0000-00000000000c', '22222222-0000-0000-0000-00000000001c', true),
  ('44444444-0000-0000-0000-00000000001e', 'Thomas Fernandez', 'Governor / Lieutenant Governor', false, '11111111-0000-0000-0000-00000000000c', '22222222-0000-0000-0000-00000000001c', true),
  ('44444444-0000-0000-0000-00000000001f', 'James Fishback', 'Governor / Lieutenant Governor', false, '11111111-0000-0000-0000-00000000000c', '22222222-0000-0000-0000-00000000001c', true), -- running mate: Sean A. Lozano (Lt. Gov) -- not a separate row per Task 2
  ('44444444-0000-0000-0000-000000000020', 'Dayna Foster', 'Governor / Lieutenant Governor', false, '11111111-0000-0000-0000-00000000000c', '22222222-0000-0000-0000-00000000001c', true),
  ('44444444-0000-0000-0000-000000000021', 'Jim Holcomb', 'Governor / Lieutenant Governor', false, '11111111-0000-0000-0000-00000000000c', '22222222-0000-0000-0000-00000000001c', true),
  ('44444444-0000-0000-0000-000000000022', 'Scott Jewett', 'Governor / Lieutenant Governor', false, '11111111-0000-0000-0000-00000000000c', '22222222-0000-0000-0000-00000000001c', true),
  ('44444444-0000-0000-0000-000000000023', 'David Jolly', 'Governor / Lieutenant Governor', false, '11111111-0000-0000-0000-00000000000c', '22222222-0000-0000-0000-00000000001c', true), -- running mate: Gwen Graham (Lt. Gov) -- not a separate row per Task 2
  ('44444444-0000-0000-0000-000000000024', 'Dotie Joseph', 'Governor / Lieutenant Governor', false, '11111111-0000-0000-0000-00000000000c', '22222222-0000-0000-0000-00000000001c', true),
  ('44444444-0000-0000-0000-000000000025', 'Arthur McCaffrey', 'Governor / Lieutenant Governor', false, '11111111-0000-0000-0000-00000000000c', '22222222-0000-0000-0000-00000000001c', true),
  ('44444444-0000-0000-0000-000000000026', 'Desmond Meade', 'Governor / Lieutenant Governor', false, '11111111-0000-0000-0000-00000000000c', '22222222-0000-0000-0000-00000000001c', true),
  ('44444444-0000-0000-0000-000000000027', 'Erik Morris', 'Governor / Lieutenant Governor', false, '11111111-0000-0000-0000-00000000000c', '22222222-0000-0000-0000-00000000001c', true),
  ('44444444-0000-0000-0000-000000000028', 'Daniel Nokovich', 'Governor / Lieutenant Governor', false, '11111111-0000-0000-0000-00000000000c', '22222222-0000-0000-0000-00000000001c', true),
  ('44444444-0000-0000-0000-000000000029', 'Stephann Norman', 'Governor / Lieutenant Governor', false, '11111111-0000-0000-0000-00000000000c', '22222222-0000-0000-0000-00000000001c', true),
  ('44444444-0000-0000-0000-00000000002a', 'Paul Renner', 'Governor / Lieutenant Governor', false, '11111111-0000-0000-0000-00000000000c', '22222222-0000-0000-0000-00000000001c', true),
  ('44444444-0000-0000-0000-00000000002b', 'Rachel Rodriguez', 'Governor / Lieutenant Governor', false, '11111111-0000-0000-0000-00000000000c', '22222222-0000-0000-0000-00000000001c', true),
  ('44444444-0000-0000-0000-00000000002c', 'Frank Russo', 'Governor / Lieutenant Governor', false, '11111111-0000-0000-0000-00000000000c', '22222222-0000-0000-0000-00000000001c', true),
  ('44444444-0000-0000-0000-00000000002d', 'James Shaw', 'Governor / Lieutenant Governor', false, '11111111-0000-0000-0000-00000000000c', '22222222-0000-0000-0000-00000000001c', true),
  ('44444444-0000-0000-0000-00000000002e', 'Caneste Succe', 'Governor / Lieutenant Governor', false, '11111111-0000-0000-0000-00000000000c', '22222222-0000-0000-0000-00000000001c', true),
  ('44444444-0000-0000-0000-00000000002f', 'Bobby Williams', 'Governor / Lieutenant Governor', false, '11111111-0000-0000-0000-00000000000c', '22222222-0000-0000-0000-00000000001c', true),
  -- Attorney General (2) — district_id '...00d', election_id '...001d'
  ('44444444-0000-0000-0000-000000000030', 'Jose Javier Rodriguez', 'Attorney General', false, '11111111-0000-0000-0000-00000000000d', '22222222-0000-0000-0000-00000000001d', true),
  ('44444444-0000-0000-0000-000000000031', 'James Uthmeier', 'Attorney General', false, '11111111-0000-0000-0000-00000000000d', '22222222-0000-0000-0000-00000000001d', true),
  -- Chief Financial Officer (4) — district_id '...00e', election_id '...001e'
  ('44444444-0000-0000-0000-000000000032', 'Frank William Collige', 'Chief Financial Officer', false, '11111111-0000-0000-0000-00000000000e', '22222222-0000-0000-0000-00000000001e', true),
  ('44444444-0000-0000-0000-000000000033', 'Earle Ford', 'Chief Financial Officer', false, '11111111-0000-0000-0000-00000000000e', '22222222-0000-0000-0000-00000000001e', true),
  ('44444444-0000-0000-0000-000000000034', 'Blaise Ingoglia', 'Chief Financial Officer', false, '11111111-0000-0000-0000-00000000000e', '22222222-0000-0000-0000-00000000001e', true),
  ('44444444-0000-0000-0000-000000000035', 'Annette Taddeo', 'Chief Financial Officer', false, '11111111-0000-0000-0000-00000000000e', '22222222-0000-0000-0000-00000000001e', true),
  -- Commissioner of Agriculture (5) — district_id '...00f', election_id '...001f'
  ('44444444-0000-0000-0000-000000000036', 'Kyle "KC" Gibson', 'Commissioner of Agriculture', false, '11111111-0000-0000-0000-00000000000f', '22222222-0000-0000-0000-00000000001f', true),
  ('44444444-0000-0000-0000-000000000037', 'Joey Mendoza Atkins', 'Commissioner of Agriculture', false, '11111111-0000-0000-0000-00000000000f', '22222222-0000-0000-0000-00000000001f', true),
  ('44444444-0000-0000-0000-000000000038', 'Donald A. "Don" Prichard', 'Commissioner of Agriculture', false, '11111111-0000-0000-0000-00000000000f', '22222222-0000-0000-0000-00000000001f', true),
  ('44444444-0000-0000-0000-000000000039', 'Wilton Simpson', 'Commissioner of Agriculture', false, '11111111-0000-0000-0000-00000000000f', '22222222-0000-0000-0000-00000000001f', true),
  ('44444444-0000-0000-0000-00000000003a', 'Matt Taylor', 'Commissioner of Agriculture', false, '11111111-0000-0000-0000-00000000000f', '22222222-0000-0000-0000-00000000001f', true)
ON CONFLICT (id) DO NOTHING;

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

SELECT count(*) FROM candidates WHERE id IN (
  '44444444-0000-0000-0000-000000000014','44444444-0000-0000-0000-000000000015','44444444-0000-0000-0000-000000000016',
  '44444444-0000-0000-0000-000000000017','44444444-0000-0000-0000-000000000018','44444444-0000-0000-0000-000000000019',
  '44444444-0000-0000-0000-00000000001a','44444444-0000-0000-0000-00000000001b','44444444-0000-0000-0000-00000000001c',
  '44444444-0000-0000-0000-00000000001d','44444444-0000-0000-0000-00000000001e','44444444-0000-0000-0000-00000000001f',
  '44444444-0000-0000-0000-000000000020','44444444-0000-0000-0000-000000000021','44444444-0000-0000-0000-000000000022',
  '44444444-0000-0000-0000-000000000023','44444444-0000-0000-0000-000000000024','44444444-0000-0000-0000-000000000025',
  '44444444-0000-0000-0000-000000000026','44444444-0000-0000-0000-000000000027','44444444-0000-0000-0000-000000000028',
  '44444444-0000-0000-0000-000000000029','44444444-0000-0000-0000-00000000002a','44444444-0000-0000-0000-00000000002b',
  '44444444-0000-0000-0000-00000000002c','44444444-0000-0000-0000-00000000002d','44444444-0000-0000-0000-00000000002e',
  '44444444-0000-0000-0000-00000000002f','44444444-0000-0000-0000-000000000030','44444444-0000-0000-0000-000000000031',
  '44444444-0000-0000-0000-000000000032','44444444-0000-0000-0000-000000000033','44444444-0000-0000-0000-000000000034',
  '44444444-0000-0000-0000-000000000035','44444444-0000-0000-0000-000000000036','44444444-0000-0000-0000-000000000037',
  '44444444-0000-0000-0000-000000000038','44444444-0000-0000-0000-000000000039','44444444-0000-0000-0000-00000000003a'
); -- expect 39

SELECT count(*) FROM candidates WHERE id LIKE '44444444-0000-0000-0000-00000000%' AND (archived_at IS NOT NULL OR appeared_on_ballot IS NOT TRUE);
-- expect 0 -- no Package C row should ever be archived or hidden by this SQL alone

SELECT count(*) FROM current_officials; -- expect identical to pre-write baseline (no row touches this table)
SELECT count(*) FROM user_districts;    -- expect identical to pre-write baseline (Section 3 alone never writes here)
```

**Rollback SQL (exact literal IDs, child-to-parent order):**
```sql
BEGIN;
DELETE FROM candidates WHERE id IN (
  '44444444-0000-0000-0000-000000000014','44444444-0000-0000-0000-000000000015','44444444-0000-0000-0000-000000000016',
  '44444444-0000-0000-0000-000000000017','44444444-0000-0000-0000-000000000018','44444444-0000-0000-0000-000000000019',
  '44444444-0000-0000-0000-00000000001a','44444444-0000-0000-0000-00000000001b','44444444-0000-0000-0000-00000000001c',
  '44444444-0000-0000-0000-00000000001d','44444444-0000-0000-0000-00000000001e','44444444-0000-0000-0000-00000000001f',
  '44444444-0000-0000-0000-000000000020','44444444-0000-0000-0000-000000000021','44444444-0000-0000-0000-000000000022',
  '44444444-0000-0000-0000-000000000023','44444444-0000-0000-0000-000000000024','44444444-0000-0000-0000-000000000025',
  '44444444-0000-0000-0000-000000000026','44444444-0000-0000-0000-000000000027','44444444-0000-0000-0000-000000000028',
  '44444444-0000-0000-0000-000000000029','44444444-0000-0000-0000-00000000002a','44444444-0000-0000-0000-00000000002b',
  '44444444-0000-0000-0000-00000000002c','44444444-0000-0000-0000-00000000002d','44444444-0000-0000-0000-00000000002e',
  '44444444-0000-0000-0000-00000000002f','44444444-0000-0000-0000-000000000030','44444444-0000-0000-0000-000000000031',
  '44444444-0000-0000-0000-000000000032','44444444-0000-0000-0000-000000000033','44444444-0000-0000-0000-000000000034',
  '44444444-0000-0000-0000-000000000035','44444444-0000-0000-0000-000000000036','44444444-0000-0000-0000-000000000037',
  '44444444-0000-0000-0000-000000000038','44444444-0000-0000-0000-000000000039','44444444-0000-0000-0000-00000000003a'
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

---

## 7. Product behavior test plan (reasoned through the code path — not live-tested, since no Package C row exists yet)

| # | Scenario | Expected result | Reasoning |
|---|---|---|---|
| 1 | Fresh Florida/PSL user completes onboarding after Option A ships and Package C is executed | Sees all 4 statewide races, including all 39 DOE/DOS-verified candidates (14 certification-independent now show normally; the 25 certification-dependent candidates also show, since none is archived by this package — see §6) | Holds the new "Florida Statewide" anchor via `ZIP_MANAGED_DISTRICTS`; `resolveBallotDistrictIds` resolves `mode: 'statewide'` → expands to all 5 `type: 'statewide'` districts (4 office districts + the anchor itself, which has no candidates and contributes nothing) |
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

- **25 of 39 candidates remain certification-dependent** (§4) — no won/lost distinction is encoded anywhere in §5/§6; do not infer one. A separate official results source (not fetched in this pass) plus actual certification are both required before that distinction can be added.
- **`is_incumbent` unconfirmed for all 39 candidates** — `CanList.asp` does not surface this field; left `false` throughout, not asserted as fact. A candidate-detail (`CanDetail.asp`) pass or another explicitly-cited official source would be needed to confirm.
- **Byron Donalds' running mate is not linked in the official system as of this fetch** — stated as observed, not filled in or guessed.
- **This fetch is a point-in-time snapshot (08-20-2026)** — Florida's qualification system updates regularly; a withdrawal, disqualification, or late addition after this date would not be reflected. Re-verify immediately before any execution, not on this document's word alone, mirroring the same caution already documented for Package A/B.
- **`city: 'Statewide'` sentinel value is a product decision, not a fact** — an alternative like `city: NULL` was not used because `districts.city` is `NOT NULL`; a different sentinel string could be chosen instead, but must be chosen deliberately and consistently, not guessed per-office.
- **The onboarding code change, if ever applied prematurely** (before the district rows exist live), would break every user's onboarding with a foreign-key violation — flagged explicitly in §3/§6 as a hard sequencing requirement, not just a style preference.
- **Statewide officeholders and `current_officials`** were explicitly kept out of scope; if a future gate wants to add them, that requires its own separate source-verification and approval sequence, mirroring every other `current_officials` addition in this project.

## 9. Approval boundary

One approval remains outstanding before any part of Package C may execute: **explicit approval of the Option A architecture** (§2-3) — the statewide ballot model itself. The candidate-roster sourcing gap that previously stood alongside it is now resolved for qualification facts (§4, DOE/DOS-verified, 39/39 candidates). A second, narrower gap remains for the 25 certification-dependent candidates specifically: an official results source (not fetched in this pass) plus actual primary certification, before any won/lost distinction may be added — this does not block the certification-independent 14, nor does it block district/election row creation, once the architecture itself is approved.

**This document does not constitute architecture approval. That has not occurred.**

## 10. No-change confirmation

No database write was performed. No `districts`, `elections`, `candidates`, `user_districts`, or `current_officials` row was created, modified, or deleted. No schema, RLS, grant, policy, function, migration, or seed was changed. No application source file (`src/lib/ballotEligibility.ts`, `src/app/onboarding/zip/page.tsx`, or any other) was modified — both drafted snippets in §3 remain unapplied. `ENABLE_CITY_COUNCIL_DISTRICT_WRITE` and `ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE` are unrelated to this workstream and were not inspected or changed. No deployment occurred. `CIVICMARKET_CURRENT_STATE.md` and `docs/work/current_task_state.md` were not edited. Package B (`docs/candidate_import_package_b_post_certification.md`, commit `103e507`) was not modified. All ID-collision and name-collision checks referenced above used only read-only `GET` requests against the public PostgREST API with the anon key already compiled into the client bundle. This pass's roster research used only `dos.elections.myflorida.com` fetches as evidence, plus one Wikipedia lookup used solely to locate the correct official URL pattern, never as a source for any name/party/status stated in §4/§5/§6.
