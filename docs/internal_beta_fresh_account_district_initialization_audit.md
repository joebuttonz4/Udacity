# Fresh Production Account District/Representation Initialization Audit

Date: 08-20-2026
Timestamp: 09:36 pm EST

Status: **Read-only diagnosis complete. No Supabase write. No `user_districts`/schema/RLS/function change. No deployment. Fresh production account left untouched as a reproducible test case.**

## Method

Two temporary, read-only-only Node scripts (`createServiceClient()` service-role pattern, zero mutation calls — verified `.select()` only before running, deleted immediately after one run each) queried `profiles`, `user_districts`, `civic_dna`, `match_scores`, `officials_for_user`, and `current_officials`. `git status --short` confirmed a clean tree after cleanup. No email or other PII is reproduced in this document — only user UUIDs, district ids/names, timestamps, and scores.

## Phase 1 — Fresh account identification and state

Identified by querying `profiles` for `zip_code = '34953'`, most recent `created_at` first, excluding the known old test account. The freshest matching profile — created **2026-08-21T01:30:59 UTC**, `dna_quiz_status: completed` — is the fresh production account (referred to below as **Fresh**, UUID not repeated further than necessary for traceability: `faa39dd7-...`).

**Fresh `user_districts` — exactly 3 rows, all `created_at = 2026-08-21T01:32:45` (single batch, one onboarding submission):**

| district_id | Name | Type |
|---|---|---|
| `...0003` | St. Lucie County Commission At-Large | county |
| `...0006` | Mayor | city_council |
| `...000b` | Florida Statewide | statewide |

All three rows share one `created_at` timestamp — consistent with a single ZIP-onboarding delete-then-insert batch, not a sequence of separate manual/RPC writes.

**Fresh `civic_dna`:** 1 row, `created_at = 2026-08-21T01:34:18`, all 7 dimensions populated (quiz completed normally).

**Fresh `match_scores`:** 1 row — Shannon Martin (`d44ff05a-...`), score **56**, `computed_at = 2026-08-21T01:34:19` — consistent with the automatic post-quiz `compute-match-scores` call.

**Fresh `officials_for_user`:** **0 rows** — confirmed by direct query against the live view, not inferred.

## Phase 2 — Comparison to the known 34953 test account (`ec59ea92-...`)

| District | Old test account | Fresh account | Shared? |
|---|---|---|---|
| City Council District 1 (`...0001`) | **Present** (created 2026-08-08) | Absent | Old only |
| School Board District 1 (`...0002`) | **Present** (created 2026-08-16) | Absent | Old only |
| County Commission At-Large (`...0003`) | Present (created 2026-08-16) | **Present** (created 2026-08-21) | Shared |
| FL House District 85 (`...0004`) | **Present** (created 2026-08-16) | **Absent** | Old only |
| FL Senate District 27 (`...0005`) | **Present** (created 2026-08-16) | Absent | Old only |
| Mayor (`...0006`) | Present (created 2026-08-16) | **Present** (created 2026-08-21) | Shared |
| Florida Statewide (`...000b`) | Present (created 2026-08-21T00:21, a backfill) | **Present** (created 2026-08-21T01:32, normal onboarding) | Shared, different provenance |

Old account: 7 rows total. Fresh account: 3 rows total. The old account is not a smaller/degraded version of the fresh account's state — it is a **larger, historically-accumulated** state that the fresh account, created after a later fix, correctly does not replicate.

## Phase 3 — Provenance of the old account's rows

Established entirely from `user_districts.created_at` timestamps cross-referenced against `CIVICMARKET_CURRENT_STATE.md`'s own gate history — no guessing:

- **City Council District 1** (`created_at = 2026-08-08T18:58:12`): matches **Gate I34 — "City Council District 1 → District 3 → District 1 Live Regression Test"** (dated 08-08-2026), which performed two explicitly-approved, temporary-write-guard-enabled real writes on this exact account (D1→D3, then D3→D1) and left it back on District 1. **Classification C — RPC assignment milestone** (an explicitly-approved one-time test write), **not normal onboarding**.
- **School Board District 1, County Commission At-Large, FL House District 85, FL Senate District 27, Mayor** (all `created_at = 2026-08-16T15:51:21`, one batch): matches **Milestone 2A — "ZIP Resubmission Preservation Test"** (dated 08-16-2026), which resubmitted ZIP 34953 for this exact account through the normal onboarding UI. At that time, `ZIP_MANAGED_DISTRICTS` still contained all 5 of these districts — the Aug 20 fix (below) had not yet happened. **Classification A — normal ZIP onboarding**, but onboarding *as it existed on Aug 16*, which is materially different from onboarding today.
- **Florida Statewide** on the old account (`created_at = 2026-08-21T00:21:51`): matches the **Package C1 §6b existing-user backfill** (commit `b243632`), a one-time, separately-approved scoped SQL backfill for already-onboarded users. **Classification C — backfill milestone, not onboarding** (for this account specifically — see below).

## Phase 4 — Current onboarding code trace

`src/app/onboarding/zip/page.tsx`, `ZIP_MANAGED_DISTRICTS` (current `master`, confirmed unmodified since the Aug 20 fix):

```
[ St. Lucie County Commission At-Large (county), Mayor (city_council), Florida Statewide (statewide) ]
```

This is the **exact and complete set** a brand-new ZIP-34953 signup receives today — confirmed by exact match against the fresh account's 3 rows. The code's own inline comment documents *why* School Board District 1, FL House District 85, and FL Senate District 27 were deliberately removed (Ballot Eligibility Phase 1, 08-20-2026, already recorded in `CIVICMARKET_CURRENT_STATE.md`):

1. **School Board District 1** — was being assigned as a fake, unverified representation row to every PSL user. Countywide School Board ballot eligibility is still achieved via the County Commission At-Large anchor (`ballotEligibility.ts`'s `county`+`school_board` family) — no representation row is needed for that.
2. **FL House District 85** — Port St. Lucie is split across FL House Districts 84 and 85; auto-assigning 85 to everyone is factually wrong for District-84 residents. No verified-lookup flow exists, so **no automatic assignment is made at all** — this is an intentional "missing data over incorrect data" decision, not an oversight.
3. **FL Senate District 27** — confirmed incorrect for St. Lucie County entirely (real coverage is District 29/31). Same reasoning: no automatic assignment.
4. City Council District 1/3 were already excluded earlier (Gate I36) — ZIP alone cannot distinguish them; a separate, currently write-disabled verified-assignment flow exists at `/profile/city-council-district`.

**Answers to Phase 4's specific questions:**

1. **Which district rows does ZIP onboarding automatically create today?** Exactly 3: County Commission At-Large, Mayor, Florida Statewide.
2. **Which district rows intentionally require later verification?** City Council District 1/3 (via `/profile/city-council-district`, currently `ENABLE_CITY_COUNCIL_DISTRICT_WRITE = false` — dry-run only, no real write path exists for any user right now) and County Commission District 1–5 specifically (via the separate, still-disabled `/profile/county-commission` flow, `ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE = false`).
3. **Which district rows are expected but currently never created?** School Board District 1 (or any other School Board district), FL House District 85 (or 84), and FL Senate District 27 (or 29/31) — none of these has any automatic or currently-enabled verified-assignment path. This is intentional, not a gap that was overlooked (see Phase 5).
4. **Does ballot eligibility use `user_districts`, a separate race-expansion path, or both?** Both. `getCandidatesForDistricts` → `resolveBallotDistrictIds` (`src/lib/candidates.ts`) starts from the user's exact `user_districts` rows, then — for districts whose `(city, state, type)` matches a `ballotEligibility.ts` rule (citywide/countywide/statewide) — expands to *every other district sharing that rule's type family*, entirely independent of representation. `officials_for_user` (Phase 5/6) never sees this expansion; it only ever does a strict `district_id` equality join against `current_officials`.
5. **Why can ballot races appear even when Current Officials is empty?** By design — this is the entire point of the Aug 20 Ballot Eligibility Phase 1 separation. The Mayor anchor expands to Mayor + City Council District 1 + City Council District 3 for **voting** purposes; the County Commission At-Large anchor expands to County Commission Districts 1–5 for voting; the Florida Statewide anchor expands to Governor/Lt. Governor, Attorney General, CFO, Commissioner of Agriculture for voting. None of this touches `current_officials` or `officials_for_user` at all.
6. **Why is FL House District 85 absent for this fresh account?** Because it was deliberately removed from `ZIP_MANAGED_DISTRICTS` on 08-20-2026 (the day before this account's signup) as a data-correctness fix, and because `ballotEligibility.ts` has no rule for `type = 'state'` (FL House/Senate stay exact-district-only, never expanded) — so it is correctly absent from *both* representation and ballot races. It is not a bug; it is the fix working exactly as designed.

## Phase 5 — Data source verification (ZIP 34953)

| Dimension | Status |
|---|---|
| FL House District 85 (or the correct district for 34953) | **MISSING** — no verified ZIP→FL-House-district mapping exists in code or data; the actual correct district for any given 34953 resident (84 vs. 85) has never been established here. Deliberately not guessed. |
| FL Senate District 27 (or the correct district) | **MISSING** — same; the correct district (29 vs. 31) has never been established. Already flagged as factually wrong for St. Lucie County if defaulted to 27. |
| School Board District 1 (or the correct School Board seat) | **INTENTIONAL exclusion from auto-assignment** — the mapping *exists* (School Board District 1 is a real district row), but assigning it to every user without address verification was judged unsafe and deliberately stopped (Gate I36-equivalent reasoning, documented 08-20-2026). |
| Mayor | Mapping exists and is used (auto-assigned). District row is correct; only the *current_officials* row for this office is missing (separate, older, still-open gap — no official government source URL supplied yet). |
| City Council / County Commission verified-district behavior | Mapping exists (`/profile/city-council-district`, `/profile/county-commission`), but both write paths remain explicitly disabled (`ENABLE_CITY_COUNCIL_DISTRICT_WRITE` / `ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE` both `false`) pending a separate approval — **INTENTIONAL**, not this task's concern to change. |

No district assignment was invented, guessed, or inferred anywhere in this phase.

## Phase 6 — Root cause classification

- **Empty My Current Officials (Problem 1): Classification A — expected behavior**, not a bug, and not something the old test account disproves — the old account's officials only ever came from City Council District 1 (a one-time, explicitly-approved *test* write, Gate I34) plus School Board District 1 and FL House District 85 (auto-assigned under an *earlier, since-superseded* onboarding rule, before 08-20-2026). Directly confirmed live: zero `current_officials` rows exist for any of the fresh account's 3 held districts (Mayor, County Commission At-Large, Florida Statewide) — none of the three is designed to ever have a directly-tied officeholder record (Mayor is source-blocked; the other two are pure ballot-eligibility anchors by design, per the Path 1 personalization fix). **A brand-new real signup today will always see an empty My Current Officials section**, with the current write-guard/data state, until either (a) the Mayor `current_officials` row is sourced and seeded, or (b) City Council/County Commission/School Board/FL House/FL Senate verified-assignment is enabled for real users.
- **Missing FL House District 85 (Problem 2): Classification A — expected behavior**, an intentional, already-documented, already-committed removal from `ZIP_MANAGED_DISTRICTS` (08-20-2026), correctly working as designed. Not a regression, not a deployment/version issue — this fresh account was created the day *after* that fix, on the correct, current `master`.
- **FL Senate District 27 / School Board representation state:** same — **Classification A**, not present for the fresh account by the same deliberate 08-20-2026 removal, correctly working as designed.

No item in this audit was classified B (old account manually seeded/verified — partially true for City Council D1, but that alone doesn't explain the officials gap), C (onboarding implementation gap), D (data mapping gap in the sense of a fixable bug), E (ballot eligibility bug), F (officials lookup bug), or G (deployment/version issue). The onboarding code, `officials_for_user` view, and ballot-eligibility expansion are all doing exactly what their own committed source and documentation say they should do.

## Recommended fix (not implemented — see approval boundary)

This is **not a code bug** to patch. The actual gap is a **product/UX consequence** of two independently-correct, previously-approved data-integrity decisions (Path 1 personalization fix; Ballot Eligibility Phase 1) stacking together: they collectively guarantee that, right now, essentially every real fresh signup will see a permanently empty "My Current Officials" section, because the only auto-assigned districts (Mayor, County Commission At-Large, Florida Statewide) are the three districts structurally guaranteed to never show an officeholder.

Three independent, separately-approvable remediation paths exist, none implemented here:

1. **Smallest, safest, no-write fix:** none required at the code level for correctness — the existing empty-state copy in `CurrentOfficialsSection.tsx` ("Current officials will appear here after verified official source data is added.") already accurately describes this situation and was designed for exactly this case. If desired, a *documentation-only* copy tweak could make it even clearer this is expected for most PSL residents right now, not a personal account error — this alone requires no database write, no schema change, and is safely deferrable to its own tiny follow-up task.
2. **Data-completion path:** source and seed the Mayor `current_officials` row (the long-open, source-blocked gap) — the single highest-leverage fix, since Mayor is the one auto-assigned district that *should* have a real officeholder. Requires new Supabase write(s), separately approved, following this project's existing verified-source-then-write-approval pattern (as used for the four seeded City Council/School Board/FL House officials earlier this project).
3. **Verified-assignment enablement path:** enable `ENABLE_CITY_COUNCIL_DISTRICT_WRITE` (already built and live-tested end-to-end in Gate I34, currently disabled) for real users — would let real users self-verify City Council District 1/3, which do have seeded officials (Stephanie Morgan, Anthony Bonna, Sr.). Requires a separate, explicit write-guard-enablement approval; out of this task's scope to enable.

**This task recommends option 1 as the only change safe to consider without further approval, and recommends the user decide between options 2 and 3 (or both) as the actual substantive fix**, each requiring its own explicit approval gate before any write occurs.

## Approval boundary

No database write, schema change, RLS change, function change, write-guard flip, or deployment was performed or is proposed for immediate execution by this task. The fresh production account (`faa39dd7-...`) was left completely untouched and remains available as a reproducible, real-world test case for whichever remediation path is chosen next. Any future fix requires its own explicit, separate approval — this document is diagnosis and recommendation only.
