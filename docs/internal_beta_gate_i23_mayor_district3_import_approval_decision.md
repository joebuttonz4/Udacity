# Internal Beta — Gate I23: Mayor and City Council District 3 Import Approval Decision

## 1. Date and timestamp

Date: 08-06-2026
Timestamp: 10:30 pm EST

This document is documentation, inspection, and approval planning only. It does not write to Supabase, modify candidate/district/election/CSV data, change source code, or deploy.

## 2. Repository baseline

- Local path: `J:\CivicMarket`
- Branch: `master`
- Working tree: clean
- Up to date with `origin/master`
- Latest pushed commit:
  - `30d4c28` Update current state for Gate I22
- Previous pushed commits:
  - `9bd55fb` Add Mayor and District 3 live import verification
  - `bd009af` Record Gate I21 live verification
  - `8d2347a` Add voting record unavailable state
  - `112d656` Update current state for Gate I20

## 3. Gate status

Complete. Documentation, inspection, and approval planning only. No database write, source-code change, CSV change, secret inspection, County Commission change, or deployment occurred.

## 4. Purpose

Gate I22 confirmed all 7 Mayor/District 3 candidate rows, plus their prerequisite `districts` and `elections` rows, are missing live. This gate decides the exact safe import model — beta-stage necessity, district/election modeling, candidate-row specification, the office-field inconsistency, import architecture, write boundaries, user-assignment rules, validation, and rollback — and produces an explicit approval checklist, without performing any write.

## 5. Files and schema inspected

- `CIVICMARKET_CURRENT_STATE.md` (Locked beta scope, Hard beta blockers, "Current Officials — Mayor district gap" section, Gate I19-I22 sections)
- `docs/internal_beta_gate_i22_mayor_district3_live_import_verification.md`
- `docs/beta_launch_readiness_plan.md` (Sections 5-7, data-completeness requirements)
- `data/real-psl-replacement/candidates_real.csv`
- `scripts/import-real-psl-data.cjs`
- `scripts/validate-real-psl-csvs.cjs`
- `Reference Files/civicmarket_schema_v4.sql` (`districts`, `elections`, `candidates`, `user_districts` table definitions)
- `docs/county_commission_district_1_5_future_implementation_plan.md` (precedent for a prior new-district-row insert — city/state field convention, fixed-UUID convention)
- `src/app/onboarding/zip/page.tsx` (live onboarding district-assignment mechanism)
- `src/app/ballot/page.tsx` (scope/type-to-UI-tag mapping, district grouping logic)
- `src/lib/candidates.ts` (`getCandidatesForDistricts`, `getCandidateProfile`, completeness filtering)

No `.env`, `.env.local`, `.env.*`, or secret-named file was inspected.

## 6. First decision: beta-stage requirement

**Selected: Option A — Before the next broader beta stage.**

Evidence:
- `CIVICMARKET_CURRENT_STATE.md`'s "Current Officials — Mayor district gap" section already states "Mayor is a confirmed planned/known office for the PSL beta context" — Mayor is affirmatively in scope, not deferred indefinitely, ruling out Option C.
- `docs/beta_launch_readiness_plan.md` Section 6 ("Must-have before Internal Beta") and Section 7 ("Must-have before Controlled PSL Beta") both require that incomplete candidate/race data be **hidden**, not that every possible PSL race exist. The current app already satisfies this correctly — Mayor/District 3 simply do not render anywhere, which is the *safe* state that requirement describes, not a violation of it. Nothing in either section requires all 11 CSV candidates before Internal Beta continues, ruling out Option B.
- Gate I17 already closed the locked-ring Internal Beta workstream, and Gate I21 already closed the voting-record hard blocker, both based on the currently-tested District 1-only experience — this gate does not reopen or invalidate that closure. The current District 1-only Internal Beta remains valid exactly as documented.
- Mayor is a citywide race; District 3 is a district-scoped race analogous to District 1. Both are reasonably expected before a **broader** beta stage (e.g., Controlled PSL Beta, or any invitation to a District-3 resident or a citywide-scope reviewer) but are not required to unblock the currently-scoped Internal Beta.

## 7. Mayor district-model decision

1. **Does the existing `districts` schema support a citywide Mayor district?** Yes, structurally — `districts` has no constraint limiting it to sub-city geography; a single row can represent a citywide office the same way `St. Lucie County Commission At-Large` already represents a county-wide office within the same table.
2. **Is there already a reusable citywide Port St. Lucie district row that should be used?** No. No existing district row represents "all of Port St. Lucie" as a single citywide unit. `CIVICMARKET_CURRENT_STATE.md`'s "Current Officials — Mayor district gap" section already independently confirms this: "There is currently no districts row for Port St. Lucie Mayor."
3. **Would creating a dedicated district row named `Mayor` be consistent with current schema and naming?** Yes — it directly mirrors the existing convention where `districts.name` matches the CSV's `district_name` value exactly (e.g., `City Council District 1` ↔ CSV `district_name = City Council District 1`), and the CSV's Mayor rows already use `district_name = Mayor`.
4. **Should every Port St. Lucie user receive the Mayor district automatically?** This is the recommended model — but *how* that happens matters (see finding below). It should not be "automatic" via new personalization code; it should be automatic only in the sense that Mayor joins the same flat, beta-simplified assignment path every other current PSL district already uses (see Section 13's finding on `ALL_PSL_DISTRICTS`).
5. **Should Mayor instead be derived at query time from city membership?** Not recommended for the current beta. There is no "city membership" concept independent of `user_districts` today — every current PSL district (including County Commission At-Large, a county-wide, not city-wide, office) is granted via the same flat onboarding insert, not derived. Introducing a new derivation mechanism just for Mayor would be inconsistent with how every other current district is modeled and would be a larger, riskier change than reusing the existing pattern.
6. **Would adding a Mayor `user_districts` row duplicate existing citywide representation?** No — there is no existing citywide `user_districts` row to duplicate (Answer 2).
7. **How would Mayor appear in ballot queries and candidate queries?** Through the exact same mechanism City Council District 1 already uses: `getCandidatesForDistricts(districtIds, userId)` (`src/lib/candidates.ts`) filters `candidates` by `district_id IN (...)` where `districtIds` comes from the user's `user_districts` rows. Once a user holds a Mayor `user_districts` row and Mayor candidates exist with `district_id` pointing at the new Mayor district row, they appear automatically — no new query code is needed.

**Recommended model:** create one new `districts` row — `name: 'Mayor'`, `type: 'city_council'` (reusing the existing type value, not inventing a new one — see rationale below), `city: 'Port St. Lucie'`, `state: 'FL'`, using the next available fixed UUID in the established `11111111-0000-0000-0000-0000000000XX` convention.

**Alternatives considered:**
- A new `type` value such as `'mayor'` or `'city'` — rejected for this gate's recommendation. The ballot page's `SCOPE_STYLES` and `FILTER_CHIPS` (`src/app/ballot/page.tsx`) only recognize `city_council`, `school_board`, `county`, and `state` explicitly; any other value silently falls into the `state`-styled tag and the `Other` filter chip (`getScopeStyle` fallback, `activeFilter === 'other'` catch-all). A Mayor race tagged "Other" next to State House/Senate races would be confusing and would require its own source-code change to `SCOPE_STYLES`/`FILTER_CHIPS` to fix — out of scope for a documentation gate and unnecessary, since reusing `city_council` correctly buckets Mayor under the existing "City" filter/teal tag, which matches user expectation for a city office. This is a deliberate, low-risk reuse of an imperfectly-named-but-functionally-correct existing value, not a schema change — flagged here for explicit awareness, not hidden.
- Deriving Mayor at query time without a `user_districts` row — rejected (Answer 5).
- No dedicated row could be avoided entirely by pointing Mayor at Amyor-of-convenience — no reused row exists (Answer 2), so this alternative is not available.

ZIP-only assignment was not used or recommended for Mayor — the recommended model reuses the exact same non-ZIP-derived, flat onboarding-insert mechanism already in place for every other current PSL district.

## 8. District 3 district-model decision

Compared directly against the existing District 1 row (via the live query in Gate I22 and the County Commission District 1-5 precedent in `docs/county_commission_district_1_5_future_implementation_plan.md`, which used the identical pattern for a different multi-district race):

| Field | District 1 (existing) | District 3 (recommended) |
|---|---|---|
| `name` | `City Council District 1` | `City Council District 3` |
| `type` | `city_council` | `city_council` |
| `city` | `Port St. Lucie` | `Port St. Lucie` |
| `state` | `FL` | `FL` |
| jurisdiction level | city | city (identical) |
| parent jurisdiction | none (schema has no parent-jurisdiction field) | none |
| slug/normalized name | none (schema has no such field) | none |
| election relationship | via `elections.district_id` FK to the District 1 row | via `elections.district_id` FK to the new District 3 row |
| `user_districts` relationship | granted via a dedicated, verified assignment path — not the flat `ALL_PSL_DISTRICTS` onboarding insert (District 1 **is** in that flat list today, which is itself a known beta simplification — see Section 13) | must **not** join the flat `ALL_PSL_DISTRICTS` list; requires a genuinely scoped, verified assignment mechanism (Section 14) |

**Determination: yes, District 3 should be an exact analog of the District 1 row with only the district number changed** — `name`, `type`, `city`, and `state` all follow the identical pattern, using the next available fixed UUID in the same convention.

The `districts` schema (`Reference Files/civicmarket_schema_v4.sql` lines 12-18) has no jurisdiction-level, parent-jurisdiction, or slug fields at all — so "exact analog" is a complete comparison, not a partial one; there is nothing left to decide beyond `name`/`type`/`city`/`state`, all four of which are already answered in the table above.

## 9. Election-model decision

`elections` schema: `id`, `name`, `election_date`, `district_id` (FK to `districts`, `ON DELETE CASCADE`). No election-type field, no separate active/current-status field, no external source identifier field exist in the current schema.

### Mayor election

| Field | Value |
|---|---|
| Expected `name` | `PSL Mayor 2026` (from CSV `election_name`) |
| `district_id` | the new Mayor district row's id |
| `election_date` | not present in `candidates_real.csv` — must be sourced from an official election-date source before insert (District 1's election date, `2026-11-03`, is a live database value not present in the CSV either; it was set at the time of the original District 1 insert from an external source, not from this CSV) |
| Election type | no such field exists in schema — not applicable |
| Jurisdiction | implied via `district_id` FK only |
| Active/current status | no such field exists in schema — not applicable |
| External source identifier | no such field exists in schema — not applicable |
| Required FK relationship | `district_id` must reference the Mayor district row created per Section 7, and must be created *after* that row exists |

### City Council District 3 election

| Field | Value |
|---|---|
| Expected `name` | `PSL City Council D3 2026` (from CSV `election_name`) |
| `district_id` | the new District 3 district row's id |
| `election_date` | not present in `candidates_real.csv` — must be confirmed from an official source before insert; if the District 3 race shares the same November 2026 municipal election date as District 1 and Mayor, that must be explicitly confirmed, not assumed by analogy |
| All other fields | same "not applicable — no such field in schema" answers as Mayor above |

**Both elections require an explicit, source-confirmed `election_date` before any write** — this is not present anywhere in the current repository and must not be assumed from the District 1 precedent without verification, even though all three PSL municipal races plausibly share the same November 2026 election date.

## 10. Candidate-row decision

Per instruction, no missing value (ID, since none exist yet; `election_date`) is invented here — only documented as expected-and-required-before-write. IDs are database-generated (`gen_random_uuid()` default) and therefore correctly have no expected value until insert time.

### Mayor (4 candidates)

| name | office | district_name | election_name | is_incumbent | source URL field | archived_at |
|---|---|---|---|---|---|---|
| Shannon Martin | Mayor | Mayor | PSL Mayor 2026 | **true** | `official_candidate_source_url` = cityofpsl.com City Clerk Elections page (general, not item-specific — see Section 11 finding) | expected `null` on insert |
| Eric Strazzeri | Mayor | Mayor | PSL Mayor 2026 | false | same URL | expected `null` on insert |
| Steven Giordano | Mayor | Mayor | PSL Mayor 2026 | false | same URL | expected `null` on insert |
| Steven Harrington | Mayor | Mayor | PSL Mayor 2026 | false | same URL | expected `null` on insert |

`bio`, `website`, `photo_url` are blank for all four in the CSV (expected `null` on insert, matching the existing District 1 rows' pattern — District 1 candidates also currently have no bio/website/photo populated).

### City Council District 3 (3 candidates)

| name | office (CSV, unresolved — see Section 11) | district_name | election_name | is_incumbent | source URL field | archived_at |
|---|---|---|---|---|---|---|
| Fritz Alexandre | City Council | City Council District 3 | PSL City Council D3 2026 | false | same general Elections-page URL | expected `null` on insert |
| Jim Norton | City Council | City Council District 3 | PSL City Council D3 2026 | false | same general Elections-page URL | expected `null` on insert |
| Peter Overhuls | City Council | City Council District 3 | PSL City Council D3 2026 | false | same general Elections-page URL | expected `null` on insert |

`bio`, `website`, `photo_url` blank for all three, same as above.

**No `id` value is invented for any of the 7 rows** — all will be database-generated at insert time, consistent with how the 4 live District 1 candidate IDs were generated.

## 11. Resolve District 3 office-field inconsistency

**Recommended: Option 1 — normalize District 3 rows to `office = 'City Council District 3'`.**

Rationale, per instruction to recommend the smallest safe option:
- `scripts/validate-real-psl-csvs.cjs` (inspected in full) places **no constraint whatsoever** on the `office` field's value — it is only checked for non-emptiness (`requiredFields` includes `office`, but no enum/pattern check exists, unlike `vote_cast` and `dimension` in the voting-records validator). Changing the CSV value from `City Council` to `City Council District 3` would not trip any existing validation rule.
- Candidate display and grouping (`src/app/ballot/page.tsx`'s `groupByDistrict`, `src/app/candidates/[id]/page.tsx`'s header) group and label races by `district_name`, not `office` — so the office-field choice does not affect *grouping* correctness either way. But `CandidateProfile.office` (`src/lib/candidates.ts`) is displayed directly under the candidate's name on their profile page (confirmed live for all four District 1 candidates in Gate I21's testing, where each showed `City Council District 1` directly under their name). If District 3 candidates instead showed only `City Council` there, with no district number, it would visibly and confusingly differ from every other candidate's profile in the same app for no functional reason.
- This does **not** touch live District 1 data — District 1's `office` value is already `City Council District 1` and is not being changed by this recommendation.
- Cost: requires a CSV edit (`data/real-psl-replacement/candidates_real.csv`, District 3 rows only) before any future import, which is a small, explicit, separately-approvable change — not made during this gate.

Option 2 (keep `City Council`) was not selected: it would create the exact inconsistent, "may create confusing UI" risk the instructions flagged, for no offsetting benefit once Option 1's validation-safety is confirmed.

Option 3 (normalize District 1 too) was correctly not selected, per instruction — it would require touching already-live District 1 data, which is explicitly out of bounds for this decision.

**This gate did not modify the CSV.** The recommendation above is for a future, separately-approved write-preparation gate to execute alongside (not instead of) the district/election/candidate inserts.

## 12. Import-script inspection — `scripts/import-real-psl-data.cjs`

1. **Current district assumptions:** hardcoded single constant `DISTRICT_NAME = 'City Council District 1'` (line 99) — the script looks up exactly one district by this literal name and applies its `id` to every row in `candidateInserts`, regardless of what the CSV's own `district_name` column says for that row.
2. **Current election assumptions:** hardcoded single constant `ELECTION_NAME = 'PSL City Council D1 2026'` (line 100) — same single-lookup, single-apply-to-all-rows pattern as district.
3. **Hardcoded District 1 names or IDs:** Yes — both constants above are hardcoded names (not IDs; IDs are resolved live via a `.eq('name', ...)` lookup), meaning the script currently has no way to know about `Mayor` or `City Council District 3` at all.
4. **Can it import multiple races safely today?** **No.** `candidateInserts` (lines 146-156) maps over *all* rows in `candidateRows` (i.e., all 11 rows currently in the CSV) but assigns every single one of them the *same* `district.id` and `election.id` resolved from the two hardcoded constants above. If this script were run unmodified against the current 11-row CSV, it would attempt to insert all 11 candidates — including the 4 Mayor and 3 District 3 candidates — **all mis-linked to the City Council District 1 district and election**. This is a real, confirmed bug relative to the current CSV contents (the script was written when the CSV had only 4 rows; the CSV has since grown to 11 without the script being updated).
5. **Does it assume one election for all candidates?** Yes — confirmed by Finding 2/4.
6. **Does it delete or replace existing candidates?** Yes — in live mode (`--live`), it first fetches *every* currently-active (`archived_at IS NULL`) candidate system-wide (not scoped to District 1 specifically — the `existing` query at lines 130-134 has no district or election filter at all) and **deletes all of them**, then inserts the full `candidateInserts` set.
7. **Would running it unchanged affect the 4 live District 1 candidates?** **Yes, severely.** Because the existing-candidate fetch is system-wide and unfiltered, running the script unmodified today would delete all 4 currently-live District 1 candidates (along with everything that cascades from them — see Finding 8) and then reinsert 11 new rows, all mis-linked to District 1's district/election as described in Finding 4. This would not "add" Mayor/District 3 — it would corrupt the entire candidate table.
8. **Does it touch `voting_records`, `candidate_funding`, `candidate_positions`, or `match_scores`?** Not directly via explicit `DELETE`/`INSERT` statements against those tables — but the script's own comment (line 185) and the `candidates.district_id`/`election_id` foreign keys (both `ON DELETE CASCADE`, `Reference Files/civicmarket_schema_v4.sql` lines 144-145) confirm that deleting a candidate row cascades to delete its `voting_records`, `candidate_positions`, `match_scores`, `follows`, and `reviews` rows automatically. `candidate_funding` is inserted directly by the script (lines 273-275) after the delete-and-reinsert candidate step.
9. **Does it perform cascading cleanup?** Yes — via the database's `ON DELETE CASCADE` foreign keys, triggered by the script's own `DELETE FROM candidates` step, not by explicit script logic for the other tables.
10. **Is it safe to reuse for Mayor/District 3 without modification?** **No.** Findings 4, 6, and 7 together confirm running it unmodified against the current CSV would be actively destructive to the live District 1 data, not merely insufficient. It must not be run as-is.

**Additional finding, not explicitly requested but directly relevant to candidate-row correctness (Section 10):** the CSV's `official_candidate_source_url` column — a *required* field per `scripts/validate-real-psl-csvs.cjs`'s `requiredFields` list — is **not mapped anywhere in `candidateInserts`** (lines 146-156) and **has no corresponding column in the `candidates` table schema at all** (`Reference Files/civicmarket_schema_v4.sql` lines 140-153). This means the source URL required and validated at the CSV level is silently dropped and never reaches the database for any candidate, including the 4 already-live District 1 candidates. This is a pre-existing gap unrelated to Mayor/District 3 specifically, but it would apply identically to any future Mayor/District 3 import using the current script's mapping pattern, and is flagged here for awareness — resolving it is not required to unblock this gate's decision, but a future write-preparation gate should decide whether to address it.

## 13. Required import architecture decision

**Recommended: Approach C (hybrid) — explicit, reviewed SQL for the prerequisite `districts`/`elections` rows, plus a scoped, newly-written candidate/funding import step that is *not* the existing script run unmodified.**

Precise definition:
1. **Prerequisite rows via explicit SQL**, following the exact reviewed-draft → explicit-approval → manual-Supabase-SQL-Editor-execution → post-insert-verification pattern already used successfully for the County Commission District 1-5 `districts` insert (`docs/county_commission_district_1_5_future_implementation_plan.md`). This is the most auditable path for two new `districts` rows and two new `elections` rows, and matches this repository's own established precedent for exactly this class of change.
2. **Candidate/funding rows via a scoped, modified import step** — *not* Approach A (extending the existing script in place) as a direct run, because Finding 6/7 in Section 12 confirms the existing script's unscoped `DELETE` step is unconditionally destructive to District 1 data regardless of any district/election-resolution fix. Any future script (whether a modified copy of the existing one, per Approach A's spirit, or a genuinely new file, per Approach B) must, at minimum:
   - Resolve `district_id`/`election_id` **per CSV row** (using the CSV's own `district_name`/`election_name` columns, which already exist and are simply unused today) instead of one hardcoded pair applied to every row.
   - Scope any "existing candidates" fetch/compare to the **specific district(s) being imported** (Mayor, District 3), never a system-wide, unfiltered fetch.
   - Perform a scoped **INSERT-only** operation for the 7 new rows — no `DELETE` of anything outside the Mayor/District 3 scope, and ideally no `DELETE` at all for a first import into a currently-empty scope (an initial insert has nothing to delete, unlike District 1's original import which replaced dummy data).
3. This hybrid explicitly does **not** decide whether the future candidate-import step is a modification of `scripts/import-real-psl-data.cjs` or a new file — that file-level choice is deferred to the write-preparation gate (Section 21), since it does not change the safety properties above either way.

Approach A as a *direct, unmodified* reuse of the existing script is explicitly **not recommended**, per Section 12's findings.

## 14. Required data-write boundaries (for a future write gate)

A future write gate must be limited to exactly:
- One new Mayor `districts` row (if approved)
- One new City Council District 3 `districts` row
- One new Mayor `elections` row
- One new City Council District 3 `elections` row
- Exactly 4 Mayor `candidates` rows
- Exactly 3 City Council District 3 `candidates` rows

Must preserve, unmodified:
- All 4 existing City Council District 1 `candidates` rows
- The existing City Council District 1 `districts` and `elections` rows
- All existing `user_districts` rows
- All existing `current_officials` rows
- All County Commission data (districts, current_officials, and the disabled write guard)
- The St. Lucie County Commission At-Large row
- All `voting_records`, `candidate_positions`, `match_scores`, `civic_dna` rows

No delete-all behavior. No broad replacement. No cascade that could reach District 1 candidates, elections, or districts (achieved structurally by never issuing a `DELETE` against the District 1 district/election/candidate rows or anything that foreign-keys to them).

## 15. User assignment decision

### Mayor

**Critical finding from `src/app/onboarding/zip/page.tsx`:** every current onboarding user, for any of the 7 supported PSL ZIP codes, receives the **exact same fixed set** of 5 districts via a hardcoded `ALL_PSL_DISTRICTS` array (lines 10-16) — City Council District 1, School Board District 1, St. Lucie County Commission At-Large, FL House District 85, FL Senate District 27 — inserted unconditionally, with no address-level differentiation at all. This is an explicitly-documented beta simplification (source comment: "Hardcoded PSL ZIP → districts mapping (beta approach — no Edge Function needed)").

Given this, **Mayor should join this same flat array** once its district row exists. This is the smallest, most consistent change: every beta user already receives School Board District 1 and County Commission At-Large regardless of their literal address specificity within Port St. Lucie, and Mayor is genuinely citywide (unlike those two, which are technically sub-city/county divisions being granted flatly as a beta simplification) — so adding Mayor to this list is *more* correct than the existing entries, not less. It does **not** require a Mayor-specific `user_districts` row-derivation mechanism, a citywide-membership concept, or any new personalization logic — it is a one-line addition to an already-existing array.

**This gate does not implement that change.** It is documented here as the recommended mechanism for a future, separately-approved code-change gate (Section 21/22).

### District 3

Required and confirmed by this gate:
- No District 3 candidate visibility for any user unless that user is genuinely assigned to District 3.
- No guessing District 3 from ZIP — the current `PSL_ZIPS` list (`src/app/onboarding/zip/page.tsx` line 8) is city-wide, not district-specific, and was never designed to distinguish District 1 from District 3 residents; using it for District 3 assignment would be exactly the unsafe ZIP-only pattern already explicitly rejected for County Commission District 1-5 (Gate 2's documented boundary-seam finding).
- No assignment based on District 1 membership, and no assignment based on Mayor membership.
- No `user_districts` write was performed during this gate.

**Structural conclusion:** District 3 must **not** be added to the flat `ALL_PSL_DISTRICTS` array — doing so would incorrectly grant every single beta user (including District 1 residents) a District 3 assignment, directly violating the requirement above. District 3 is a genuinely address-varying sub-city district, not a flatly-assignable citywide or beta-simplified county/state district. This makes District 3 architecturally identical in kind to the County Commission District 1-5 problem already fully designed (through Gate 17A) in this repository: a real-address-dependent, sub-city-or-sub-county district that requires a verified lookup tool, explicit user attestation, and a scoped `user_districts` write — not a flat onboarding insert. **Recommendation: District 3 assignment should reuse the same design pattern already built for County Commission District 1-5** (`src/app/profile/county-commission/page.tsx`, `src/app/api/set-county-commission-district/route.ts`, currently gated behind `ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE = false`), adapted for City Council District 1 vs. 3, rather than any ZIP-based shortcut. This gate does not design or implement that mechanism — it only identifies the correct precedent to follow in a future gate.

## 16. Validation requirements for a future import

### Pre-write checks
- `git status` clean before any SQL or script execution.
- Live confirmation that the Mayor and City Council District 3 `districts` rows do not already exist (re-run Gate I22's exact query immediately before write, not relying on this gate's now-slightly-stale snapshot).
- Live confirmation that the corresponding `elections` rows do not already exist.
- Candidate IDs: not applicable pre-write (database-generated), but post-insert IDs must be checked for accidental collision with any existing ID (structurally guaranteed by `gen_random_uuid()`, but worth a post-insert distinctness check).
- Candidate names checked for duplicates against the live table (none currently exist for any of the 7, per Gate I22).
- Source URLs checked against `isOfficialUrl` (already validated at the CSV level; Section 12's finding that the URL is not actually stored should be resolved or explicitly accepted before write).
- `office` values approved explicitly (Section 11's Option 1 recommendation, or an alternative, but not silently defaulted).
- No archived duplicate rows exist for any of the 7 candidates (confirmed in Gate I22).
- District 1 baseline captured immediately before write (exact row-for-row snapshot of the 4 live District 1 candidates plus their district/election rows), to enable an immediate diff-based confirmation that nothing about them changed.

### Post-write checks
- Exactly 11 total live candidate rows (4 District 1 + 4 Mayor + 3 District 3).
- The 4 District 1 rows byte-for-byte unchanged from the pre-write baseline (same IDs, same field values).
- 4 Mayor rows present, correctly linked to the new Mayor district/election.
- 3 District 3 rows present, correctly linked to the new District 3 district/election.
- Exact district/election linkages verified (no candidate mis-linked to the wrong race).
- No duplicates introduced.
- No archived rows introduced unexpectedly.
- Zero `candidate_positions` rows created as a side effect.
- Zero `match_scores` rows created as a side effect.
- Zero `voting_records` rows created as a side effect.
- Current District 1 beta-user ballot behavior unchanged, unless Mayor was intentionally added to `ALL_PSL_DISTRICTS` as part of the same approved change — in which case the *addition* of a Mayor race to that user's ballot is the expected, approved change, and everything else about their District 1 experience must remain identical.

## 17. Rollback requirements

- Rollback scope limited strictly to rows introduced by this specific future import: the 7 new candidate rows, the 2 new district rows, and the 2 new election rows — identified by their specific new IDs captured at insert time, never by a broad `WHERE office = ...` or `WHERE district_name = ...` style match that could accidentally catch unrelated rows.
- Rollback order (respecting FK dependency direction, innermost first): `candidates` (7 rows, by exact ID) → `elections` (2 rows, by exact ID) → `districts` (2 rows, by exact ID). Candidates must be removed before their `election_id`/`district_id` targets, even though the FK is `ON DELETE CASCADE` in the district→election→candidate direction — an explicit ordered rollback should not rely on cascade behavter for its own safety, since a cascade from a district delete would also require deleting the election, and relying on that implicit chain is less auditable than an explicit ordered delete.
- Rollback SQL must reference only the exact new IDs captured at insert time (e.g., `DELETE FROM candidates WHERE id IN (<7 explicit new IDs>)`), never a name-based or range-based match, so it cannot reach District 1 or any unrelated row under any circumstance.
- If Mayor was added to `ALL_PSL_DISTRICTS` as part of the same approved change, rollback must also include reverting that one source-code line — otherwise onboarding would continue trying to assign users to a Mayor district that rollback just deleted.

## 18. Required approval checklist

No item below is approved by the existence of this document.

1. Mayor inclusion before broader beta — **recommended**, not yet approved (Section 6).
2. District 3 inclusion before District 3 beta users — **recommended**, not yet approved (Section 6).
3. Mayor district model (`name: Mayor`, `type: city_council`, `city: Port St. Lucie`, `state: FL`) — **recommended**, not yet approved (Section 7).
4. District 3 district model (exact District 1 analog) — **recommended**, not yet approved (Section 8).
5. Mayor election model (`name: PSL Mayor 2026`, date TBD/source-required) — **recommended**, not yet approved (Section 9).
6. District 3 election model (`name: PSL City Council D3 2026`, date TBD/source-required) — **recommended**, not yet approved (Section 9).
7. District 3 canonical office value (`City Council District 3`, requires a CSV edit) — **recommended**, not yet approved (Section 11).
8. Import architecture (hybrid: explicit SQL for prerequisites + scoped new/modified candidate-import step) — **recommended**, not yet approved (Section 13).
9. Candidate IDs — not applicable pre-write; will be database-generated, not manually assigned.
10. District IDs — next available fixed UUIDs in the `11111111-0000-0000-0000-000000000XXX` convention — exact values **not yet chosen**, deferred to the write-preparation gate.
11. Election IDs — database-generated at insert time; not applicable pre-write.
12. Source URLs — the general (non-item-specific) City Clerk Elections page URL for all 7 candidates, consistent with the 4 live District 1 candidates' existing URL — **and** the pre-existing gap that this field is not actually stored in the `candidates` schema (Section 12) — both **not yet approved**.
13. User assignment behavior — Mayor via flat `ALL_PSL_DISTRICTS` addition; District 3 via a County-Commission-style verified/gated mechanism — **recommended**, not yet approved (Section 15).
14. No-delete boundary — required, structurally defined (Section 14) — **not yet approved as an executable plan**.
15. District 1 preservation — required, structurally defined (Section 14/16) — **not yet approved as an executable plan**.
16. Validation plan (Section 16) — **drafted**, not yet approved.
17. Rollback plan (Section 17) — **drafted**, not yet approved.
18. No-deploy boundary — confirmed as a standing constraint; no deployment is contemplated by any future gate in this sequence without its own separate approval.
19. **Explicit database-write approval is still required after this gate** — Gate I23 approves nothing by itself.

## 19. Required outcome

**Outcome B: One or more modeling decisions remain unresolved and must be decided before write preparation.**

Specifically unresolved (require explicit user decisions, not just this gate's recommendations, before Gate I24 can begin):
- Confirmation of Section 6's beta-stage decision (Option A) as the user's actual intent, not just this gate's best reading of existing documentation.
- Explicit approval of the Mayor `type: city_council` reuse (Section 7) versus introducing a new type value and the corresponding UI change that would require.
- Explicit approval of Section 11's Option 1 (District 3 office-field normalization), since it requires a CSV edit not yet made.
- Sourcing and confirming the actual `election_date` for both new elections (Section 9) — this gate could not determine this value from any repository source and it is not optional for a valid `elections` row (`election_date` is `NOT NULL` in the schema).
- A decision on the `official_candidate_source_url` schema gap (Section 12) — accept it as a pre-existing, out-of-scope limitation, or resolve it as part of this import.
- Explicit approval of the District 3 user-assignment mechanism recommendation (Section 15) — reusing the County Commission District 1-5 pattern is a larger design commitment than the Mayor recommendation and deserves its own explicit sign-off before a write-preparation gate assumes it.

Outcome A (fully ready for write preparation) was not selected because the `election_date` gap alone is a hard blocker to writing any valid `elections` row, independent of every other open item.

No write was performed under any outcome.

## 20. Safety confirmation

`ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE` remains `false` — not read, referenced, or touched by this gate.

## 21. Recommended next step

Per Outcome B: recommend the **smallest decision gate needed to resolve only the unresolved items** listed in Section 19, not a full Gate I24 write-preparation package yet. Suggested framing for that gate:

**Gate I23B — Mayor/District 3 Open-Decision Resolution** (documentation and source-confirmation only, no write):
- Obtain and record an official, source-confirmed `election_date` for both `PSL Mayor 2026` and `PSL City Council D3 2026`.
- Obtain explicit user approval (or a revised decision) for each of the six unresolved items in Section 19.
- Then, and only then, proceed to **Gate I24 — Mayor and District 3 Import Preparation Package**, which should define exact IDs, exact prerequisite rows, exact candidate rows, a scoped SQL/script diff, pre-write query, post-write verification, rollback, and an explicit final approval statement — matching the same rigor already established for the County Commission District 1-5 Gate 4-5 sequence.

Neither Gate I23B nor Gate I24 is implemented by this update.

## 22. No-change confirmation

Gate I23 made no changes to: `candidates`, `elections`, `districts`, `user_districts`, `voting_records`, `candidate_positions`, `match_scores`, `civic_dna`, `civic_dna_answers`, `current_officials`, `officials_for_user`, `src/lib/officials.ts`, `CurrentOfficialsSection`, `compute-match-scores` logic, `MatchScoreRing`, the ballot page, the candidate profile, the onboarding calculating page, `src/app/onboarding/zip/page.tsx`, the Data Sources page, schema, tables, seeds, migrations, `candidates_real.csv` or any other CSV file, `scripts/import-real-psl-data.cjs`, `scripts/validate-real-psl-csvs.cjs`, RLS, grants, any other source code, PowerShell scripts, environment files, the County Commission write guard, the At-Large row, or deployment state.

No Supabase write (INSERT/UPDATE/DELETE) was performed. No candidate, district, or election row was created, modified, or deleted. No candidate was scored or ranked. No political recommendation was produced. No Claude or Anthropic API call was made. No secret file was inspected. `ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE` remains `false`. No County Commission District 1-5 write was performed. No deployment occurred.
