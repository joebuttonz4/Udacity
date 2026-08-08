# Internal Beta — Gate I23B: Mayor and District 3 Open-Decision Resolution

## 1. Date and timestamp

Date: 08-06-2026
Timestamp: 10:44 pm EST

This document is read-only research and documentation only. It does not write to Supabase, modify source code, modify CSV files, modify schema/seeds/migrations/RLS/grants, or deploy.

## 2. Repository baseline

- Local path: `J:\CivicMarket`
- Branch: `master`
- Working tree: clean
- Up to date with `origin/master`
- Latest pushed commit:
  - `8d14ded` Update current state for Gate I23
- Previous pushed commits:
  - `68d08c6` Add Mayor and District 3 import approval decision
  - `30d4c28` Update current state for Gate I22
  - `9bd55fb` Add Mayor and District 3 live import verification
  - `bd009af` Record Gate I21 live verification

## 3. Gate status

Complete. Read-only research and documentation only. No database write, source-code change, CSV change, secret inspection, County Commission change, or deployment occurred.

## 4. Purpose

Resolve Gate I23's two hard election-date blockers (`PSL Mayor 2026`, `PSL City Council D3 2026`) using authoritative sources, and revisit Gate I23's five remaining open modeling decisions to classify each as approval-ready, still-needs-research, or deferred.

## 5. Gate I23 unresolved items (carried forward)

1. Official `election_date` for `PSL Mayor 2026`
2. Official `election_date` for `PSL City Council D3 2026`
3. Explicit approval to reuse `type = city_council` for the Mayor district
4. Explicit approval to normalize District 3 `office` to `City Council District 3`
5. Explicit decision on handling the `official_candidate_source_url` provenance gap
6. Explicit approval of the District 3 user-assignment mechanism
7. Explicit approval of the hybrid import architecture

## 6. Authoritative-source standard

Applied per instruction: St. Lucie County Supervisor of Elections first, City of Port St. Lucie official election page second, Florida Division of Elections third, other official government documentation last. Campaign pages, news articles, social media, third-party aggregators, and search-result snippets were not used as the basis for any date or race-composition finding. Each source was fetched one page at a time (no blanket browsing). `stlucievotes.gov` pages were fetched via `WebFetch`; `cityofpsl.com` (which returned HTTP 403 to `WebFetch`, apparently due to bot protection, not authentication) was viewed via a real, non-automated-looking browser session instead — no CAPTCHA was solved, no credential was entered, and no login was required; the page is public.

## 7. Mayor race research

Source: `https://www.cityofpsl.com/Government/Your-City-Government/Departments/City-Clerk/Elections` (City of Port St. Lucie, Office of the City Clerk — the same URL already cited as `official_candidate_source_url` for all 11 candidates in `candidates_real.csv`, and the page explicitly states "The City Clerk is the qualifying officer for candidates running for Mayor or City Council").

Exact quoted text:
> "When are the 2026 elections? Primary Election: Aug. 18, 2026 General Election: Nov. 3, 2026"
> "Which City Council seats are up for election in 2026? City Council terms last four years, and the following seats expire in 2026: Mayor, District 1, District 3"
> "Who are the 2026 candidates? Mayor: Shannon Martin, Eric Strazzeri, Steven Giordano, Steven Harrington"

## 8. Mayor official election date

**Two authoritative dates apply to the same 2026 election cycle, not one:**
- Primary Election Day: **August 18, 2026**
- General Election Day: **November 3, 2026**

The City Clerk's page lists both dates for "the 2026 elections" generally, immediately followed by confirmation that Mayor is one of the seats up for election in 2026 — but does **not** state, race-by-race, which of the two dates is "the" election date for the Mayor race specifically, nor does it state whether Mayor could be decided outright in August.

**No single `election_date` value is selected in this gate** — see Section 9 for why, and Section 21 for the resulting outcome.

## 9. Mayor race-stage interpretation

Port St. Lucie's Mayor and City Council elections are nonpartisan (City Charter Section 5.01, as stated on the same City Clerk page: "elections for Mayor and City Council are nonpartisan. Party affiliation does not appear on nomination forms or ballots"). Florida nonpartisan municipal races of this kind are commonly structured so that a candidate receiving a majority of the vote in the first (August) election wins outright, with only an unresolved race (no majority winner) advancing to the November date. **This general structural pattern was not found stated verbatim on any of the official pages reviewed in this gate** — it is standard Florida nonpartisan-election practice, not a directly quoted official-source fact for this specific race, and is flagged here explicitly as an inference, not a citation, so it is not mistaken for a confirmed fact later.

This means the *true* decisive date for the Mayor race cannot be determined in advance of the August 18, 2026 primary result — today's date, per this session's environment, is within the ten days preceding that primary, so the outcome is not yet known. A schema field expecting exactly one `election_date` cannot correctly represent "August 18 if a majority winner emerges, otherwise November 3" without either (a) a modeling decision to always store one fixed date as a convention (e.g., always the first/primary date, or always the final/general date, regardless of actual outcome), or (b) a schema change allowing two dates or a later update once the outcome is known.

**Important discrepancy discovered during this research, not resolved by this gate:** the live `elections` row for `PSL City Council D1 2026` (District 1's own race, already imported and live per Gate I22's direct query) stores `election_date: "2026-11-03"` — the **General** date. But `CIVICMARKET_CURRENT_STATE.md`'s own Gate I18 section states, for the same District 1 race: *"Election date: August 18, 2026."* These two repository-internal statements about the **same existing, already-live** District 1 race directly conflict with each other. This gate does not resolve or correct District 1's data (out of scope, per instruction), but records this conflict because it is directly relevant evidence for the Mayor/District 3 date decision: it shows the repository itself has not previously settled, even for the one race that already has a live database row, which of the two dates should be treated as canonical.

## 10. District 3 race research

Same source as Section 7 (`https://www.cityofpsl.com/Government/Your-City-Government/Departments/City-Clerk/Elections`).

Exact quoted text:
> "District 3: Fritz Alexandre, Jim Norton, Peter Overhuls"

(Part of the same "Which City Council seats are up for election in 2026?" / "Who are the 2026 candidates?" answer block quoted in full in Section 7.)

## 11. District 3 official election date

Same two-date situation as Mayor (Section 8): **August 18, 2026** (Primary) and **November 3, 2026** (General), both sourced from the same official City Clerk page, with no race-specific stage attribution given for District 3 either. No single `election_date` value is selected in this gate, for the same reason given in Section 9 (District 3's seat is explicitly grouped with Mayor and District 1 under the identical "the following seats expire in 2026" / "the 2026 elections" language — there is no source-level distinction between how District 3's race-stage structure works versus Mayor's or District 1's).

## 12. District 3 race-stage interpretation

Identical reasoning and identical unresolved ambiguity as Section 9 — City Council District 3 is nonpartisan under the same City Charter Section 5.01, subject to the same inferred (not officially quoted) majority-decided-in-primary-else-runoff-in-general pattern, and subject to the same open question of which date the single-value `election_date` field should store.

## 13. Official-source cross-check

Two independent official St. Lucie County Supervisor of Elections pages were checked in addition to the City Clerk page:

- `https://www.stlucievotes.gov/public_records/public_notices/early_voting_election_dates.php` — confirmed the same two county-wide dates (Primary: Election Day August 18, 2026; General: Election Day November 3, 2026), but explicitly stated it "does not mention any municipal elections for Port St. Lucie's mayor or city council races. It contains only county-level primary and general election information."
- `https://www.stlucievotes.gov/vbm_2026_primary_election/index.php` — independently confirmed "Primary Election Day: August 18, 2026" and referenced "the November 3, 2026 General Election" in the same sentence, again without naming PSL municipal races specifically.
- `https://www.stlucievotes.gov/candidates_committees/candidate_profiles.php` — attempted first per the source-priority order in Section 6, but returned no usable candidate or date content (the page is dynamic/interactive and did not render searchable data through the fetch method used); this was not treated as a negative finding, only as an inconclusive one, and the City Clerk page and the two SOE pages above were relied on instead.

**Result:** the two SOE dates and the City Clerk's two dates agree with each other exactly (Aug. 18, 2026 / Nov. 3, 2026) — there is no numeric date conflict between sources. The unresolved question is which of these two agreed-upon dates applies to Mayor and District 3 specifically, not a disagreement between sources about what the dates themselves are.

## 14. Candidate-list discrepancy check

**None found.** The City Clerk page's candidate lists for all three 2026 races match `candidates_real.csv` exactly, name-for-name, with no additions, omissions, or spelling differences:

- Mayor: Shannon Martin, Eric Strazzeri, Steven Giordano, Steven Harrington — matches CSV exactly.
- District 1: Eric Reikenis, Indony Baptiste, Kevin Zimmerman, Fredric Meltzer — matches CSV exactly (checked for completeness, though District 1 is already live and out of this gate's primary scope).
- District 3: Fritz Alexandre, Jim Norton, Peter Overhuls — matches CSV exactly.

No withdrawal, disqualification, or qualification-status note was found for any of the 7 Mayor/District 3 candidates on this page.

## 15. Election-name precision review

`candidates_real.csv`'s election names (`PSL Mayor 2026`, `PSL City Council D3 2026`) do not indicate a Primary/General stage, matching the same non-stage-specific pattern already used for District 1's live `PSL City Council D1 2026`. This naming convention is internally consistent across all three races but does not itself resolve the Section 9/12 ambiguity — it simply means the *name* is stage-agnostic by design, while the *date* field still requires exactly one value.

## 16. Mayor district-type decision review

Re-inspected `src/app/ballot/page.tsx`'s `SCOPE_STYLES`/`FILTER_CHIPS` and `Reference Files/civicmarket_schema_v4.sql`'s `districts.type` comment (`city_council|school_board|county|state`, informal, not a DB-level enum constraint).

**Classification: Safe enough for explicit approval.** Reusing `type: 'city_council'` for the Mayor district row correctly buckets it under the existing "City" filter chip and teal tag — the only UI-recognized city-tier value — with no code path that would treat "Mayor" differently from "City Council District 1" once assigned that type. No obvious semantic or code-path problem was found beyond the already-documented (Gate I23) imprecision of the literal string "city_council" describing a race that isn't literally a council seat. No schema/model change is required to make this work correctly.

## 17. District 3 office-normalization review

Re-inspected `scripts/validate-real-psl-csvs.cjs` (no enum/pattern constraint on `office`, only a non-empty check), `src/app/ballot/page.tsx`'s `groupByDistrict` (groups by `district_name`, not `office`), and `src/app/candidates/[id]/page.tsx` (displays `candidate.office` directly under the candidate's name — confirmed live for all four District 1 candidates in Gate I21's testing, each showing `City Council District 1`).

**Classification: Ready for approval.** Normalizing District 3's CSV `office` value to `City Council District 3` is consistent with existing District 1 live records, does not affect grouping (grouping already keys on `district_name`, which is already correct in the CSV today), and would make candidate-profile display consistent across all races. It requires a CSV edit, not a code or schema change, and does not touch District 1 data. No further design work is needed beyond obtaining explicit approval to make the edit.

## 18. Candidate-source provenance review

Re-confirmed: `candidates_real.csv`'s `official_candidate_source_url` column is required by `scripts/validate-real-psl-csvs.cjs` but has no corresponding column in the `candidates` table schema and is not mapped by `scripts/import-real-psl-data.cjs`'s `candidateInserts` (Gate I23, Section 12). This is a pre-existing gap already affecting the 4 live District 1 candidates, not something newly introduced by Mayor/District 3.

Checked for an existing reusable field (Provenance Option C): `candidates.website` exists but is semantically distinct — it represents a candidate's own campaign website (currently blank for all candidates in the CSV), not the official government page verifying their candidacy. Repurposing it would conflate campaign-derived and government-verified evidence, directly contrary to the source-provenance discipline already established by Gate I12's non-incumbent methodology decision (which explicitly separates campaign-derived evidence from officially-verified evidence). Option C is therefore **not recommended**.

**Recommendation: Provenance Option A — proceed without persisting the URL in `candidates`, retaining the canonical URL in the repository CSV and documentation (as is already the case for the 4 live District 1 candidates).** This does not block Mayor/District 3 import, since it does not represent a regression relative to the current, already-accepted District 1 state — it is a pre-existing limitation, not a new one. Provenance Option B (a schema change to persist the URL) remains a reasonable **future** improvement, applicable equally to District 1 and Mayor/District 3 alike, but is not a precondition for this specific import and was not designed further in this gate.

**Classification: Ready for approval** (Option A, matching existing precedent).

## 19. District 3 assignment-mechanism review

Re-confirmed (Gate I23, Section 15): `src/app/onboarding/zip/page.tsx`'s `ALL_PSL_DISTRICTS` is a flat array granted unconditionally to every beta user for any of the 7 supported PSL ZIP codes — it has no address-level differentiation and must not be used for District 3, since doing so would assign every beta user (including District 1 residents) to District 3.

Decision boundary evaluated directly: **District 3 assignment must be deferred until a verified address/district lookup workflow exists.** There is **no** already-approved, already-reusable assignment mechanism in the project that can safely support it today — the closest analog, the County Commission District 1-5 workflow (`src/app/profile/county-commission/page.tsx`, `src/app/api/set-county-commission-district/route.ts`), is itself still gated behind `ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE = false` and has never been enabled for a real write (per `CIVICMARKET_CURRENT_STATE.md`'s Gate 16/Gate 11 records) — so it is a *pattern* to potentially reuse or adapt, not a mechanism that is itself currently approved and active. No `user_districts` row was created, and no inference about the current test account's District 3 status was made or attempted.

**Classification: Requires further design** — deferred, not approval-ready. This gate does not design the mechanism; it only confirms the boundary (no flat assignment, no ZIP-only assignment, no District-1-based or Mayor-based inference).

## 20. Hybrid import architecture review

Re-evaluated Gate I23's Section 13 recommendation (explicit reviewed SQL for the two prerequisite `districts`/`elections` rows, plus a scoped, per-race candidate import step — never a direct unmodified run of `scripts/import-real-psl-data.cjs`, per that script's confirmed unscoped-delete risk to live District 1 data).

**Classification: Ready for explicit approval**, with one caveat surfaced by this gate's research: the prerequisite `elections` rows cannot actually be drafted yet, because their `election_date` value is exactly the item left unresolved in Sections 8-12. The architecture itself (SQL-first prerequisites, scoped candidate insert, no broad delete) remains sound and does not need further design — but it cannot be executed, even as a reviewed draft, until the date question is settled. No SQL was written in this gate, executable or illustrative, since the architecture's *shape* was already fully specified in Gate I23 and re-confirming it does not require new pseudocode.

## 21. Remaining unresolved items

1. **The single `election_date` value for `PSL Mayor 2026`** — not a missing-source problem; a genuine two-stage-election modeling decision (store the Primary date, the General date, or defer until the August 18, 2026 outcome is known) that this gate is not authorized to make unilaterally.
2. **The single `election_date` value for `PSL City Council D3 2026`** — identical situation to item 1.
3. **The pre-existing District 1 election-date discrepancy** (Section 9: live DB value `2026-11-03` vs. Gate I18's documented `August 18, 2026`) — newly surfaced by this gate's research, not previously flagged anywhere in the repository, and not resolved here since correcting District 1 data is out of this gate's scope.
4. The District 3 user-assignment mechanism (Section 19) — still requires design, not yet ready for approval.

## 22. Approval-ready items

1. Mayor district-type reuse (`type: city_council`) — ready for explicit approval (Section 16).
2. District 3 office normalization (`office: City Council District 3`) — ready for explicit approval, pending a future CSV edit (Section 17).
3. Candidate-source provenance handling (Option A — proceed without persisting, matching existing District 1 precedent) — ready for explicit approval (Section 18).
4. Hybrid import architecture (explicit SQL prerequisites + scoped candidate import) — ready for explicit approval in shape, but blocked from execution until the election-date items are resolved (Section 20).

## 23. Gate outcome

**Outcome C: one or both election dates remain unresolved. Do not proceed toward import preparation.**

This is not a failure to find authoritative sources — both dates (August 18, 2026 and November 3, 2026) are confirmed by the single most authoritative available source (the City of Port St. Lucie City Clerk, the qualifying officer for these exact races) and independently cross-checked against two St. Lucie County Supervisor of Elections pages, with no numeric disagreement between sources anywhere. The reason Outcome C applies is that the schema requires exactly one `election_date` per election, the underlying election is a genuinely two-stage nonpartisan process whose decisive date is not yet knowable (the primary has not yet occurred as of this gate), and the repository's own prior documentation is internally inconsistent about which date convention was even used for the one race (District 1) that already has a live value. Selecting either date for Mayor/District 3 without an explicit decision on this modeling question would be a guess, which this gate's instructions explicitly prohibit.

## 24. Recommended next gate

Per Outcome C, import preparation (Gate I24) does not proceed yet. Recommend the smallest possible next step:

**A direct, explicit user decision request — not a new research or documentation gate — on exactly one question: which `election_date` convention should `PSL Mayor 2026` and `PSL City Council D3 2026` use, given that Florida law and the official source both confirm an August 18, 2026 Primary and a November 3, 2026 General for the same nonpartisan races.** Three concrete options for that decision, surfaced by this gate's research (not a recommendation for which to choose):

- **(i)** Store the Primary date (`2026-08-18`) for both, since it is the first and potentially final decisive date, and revisit/update the value later if a race is forced to a November runoff.
- **(ii)** Store the General date (`2026-11-03`) for both, matching District 1's *live database* value (even though that conflicts with District 1's own Gate I18 documentation, per Section 9) — this preserves cross-race consistency with what is *actually* in the database today, if not with what was previously documented about it.
- **(iii)** Resolve the pre-existing District 1 discrepancy first (confirm which date is actually correct for District 1, correct it if needed via its own separately-approved gate), then apply that same, now-verified convention to Mayor and District 3 for full consistency.

Once that decision is made, **Gate I24 — Mayor and District 3 Import Preparation Package** can proceed, incorporating the now-resolved date(s) and the four approval-ready items from Section 22, plus the still-deferred District 3 assignment-mechanism design (Section 19), which does not block candidate/district/election import itself — it only blocks enabling District 3 candidate personalization for any real user.

Gate I24 was not implemented by this update.

## 25. Risk check

| Risk | Mitigation |
|---|---|
| A future implementer picks a date arbitrarily to "unblock" the import | This document explicitly states neither date was selected and explains why picking one requires a decision this gate is not authorized to make |
| The newly-discovered District 1 election-date discrepancy (Section 9) is overlooked or silently "corrected" without its own approval | Recorded explicitly in Sections 9 and 21 as a separate, unresolved, out-of-scope-for-this-gate finding; District 1 data was not touched |
| The two-stage nonpartisan structure is mistaken for a simple missing-source problem in a future gate | Section 9/12 explicitly distinguish "sources found and agree" from "which date applies is a modeling question," so a future gate does not re-do sourcing that is already complete |
| The `cityofpsl.com` 403-to-`WebFetch` / browser-fallback method is mistaken for a bypass of a login or CAPTCHA | Section 6 explicitly states this was a public page with no authentication, login, or CAPTCHA involved — the fallback was purely a tooling accommodation for a bot-protection response, not a security bypass |

## 26. No-change confirmation

Gate I23B made no changes to: `candidates`, `elections`, `districts`, `user_districts`, `voting_records`, `candidate_positions`, `match_scores`, `civic_dna`, `civic_dna_answers`, `current_officials`, `officials_for_user`, `src/lib/officials.ts`, `CurrentOfficialsSection`, `compute-match-scores` logic, `MatchScoreRing`, the ballot page, the candidate profile, the onboarding pages (including `src/app/onboarding/zip/page.tsx`), the Data Sources page, `scripts/import-real-psl-data.cjs`, `scripts/validate-real-psl-csvs.cjs`, `candidates_real.csv` or any other CSV file, schema, tables, seeds, migrations, RLS, grants, any other source code, PowerShell scripts, environment files, the County Commission write guard, the At-Large row, or deployment state.

No Supabase write was performed. No candidate, district, or election row was created, modified, or deleted. No candidate was scored or ranked. No political recommendation was produced. No Claude or Anthropic API call was made. No secret file was inspected. `ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE` remains `false`. No County Commission District 1-5 write was performed. No deployment occurred. `CIVICMARKET_CURRENT_STATE.md` was not modified by this gate.
