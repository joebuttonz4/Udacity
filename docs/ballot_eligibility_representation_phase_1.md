# Ballot Eligibility vs. Representation — Phase 1

Date: 08-20-2026

Status: **Implemented and verified. No deployment. No database writes.**

**Update 08-20-2026 (later same day): School Board anchor gap found and corrected — see "Post-Phase-1 correction" section near the end of this document.** The original implementation below is left as written for the historical record; the correction section documents exactly what changed and why.

## Official-source facts this implementation is based on

1. **Port St. Lucie City Council** (official City of Port St. Lucie source): council members must reside in the district they represent, but residents throughout Port St. Lucie vote for every City Council seat, regardless of district. 2026 seats on the ballot: Mayor, District 1, District 3.
   - REPRESENTATION = district-specific
   - BALLOT ELIGIBILITY = citywide
2. **St. Lucie School Board** (official St. Lucie County Supervisor of Elections source): candidates run for a designated district seat, but all registered St. Lucie County voters are eligible to elect School Board members. Districts 1, 3, and 5 have terms expiring in 2026.
   - REPRESENTATION = district-specific
   - BALLOT ELIGIBILITY = countywide
3. **St. Lucie County Commission** (already-verified project conclusion, retained): commissioners represent a residency district but are elected countywide.
   - REPRESENTATION = district-specific
   - BALLOT ELIGIBILITY = countywide
4. **FL House / FL Senate**: ballot eligibility is exact geographic district. Existing FL Senate District 27 modeling is known incorrect for St. Lucie County; St. Lucie overlaps Districts 29 and 31, and no automated method exists to determine which one a given user is in.

## The distinction

CivicMarket has two separate civic questions that must never be answered by the same lookup:

1. **Representation** — "who is my current official?" This stays a strict `user_districts.district_id = current_officials.district_id` equality join (`officials_for_user` SQL view, unchanged). Not modified by this task.
2. **Ballot eligibility** — "which races can I vote in?" For citywide/countywide-voted offices, a resident votes on every seat of that office type, not only the one matching their own held district row. This was previously a bare exact-match, which meant real candidates (once imported) would silently never appear for anyone whose held district id didn't literally equal the candidate's own district id — e.g. County Commission District 2/4 candidates would never have matched any user, since every user only ever holds the generic "At-Large" row.

## Exact implementation

### New file: `src/lib/ballotEligibility.ts`

A small, explicit rule table — never a bare `district.type` global rule — scoped per `(city, state, type)`:

| type | city | state | mode | source |
|---|---|---|---|---|
| `city_council` | Port St. Lucie | FL | `citywide` | Official City of Port St. Lucie source |
| `county` | Port St. Lucie | FL | `countywide` | Official St. Lucie County source |
| `school_board` | Port St. Lucie | FL | `countywide` | Official St. Lucie County Supervisor of Elections source |
| *(no rule for `type = 'state'`)* | — | — | `exact` (default) | FL House/Senate are exact-geographic-district only |

`getBallotEligibilityMode(district)` returns `'exact'` for any unmodeled `(city, state, type)` combination, or when `city`/`state` is null — failing closed rather than guessing. This means a future city's identically-typed district is never silently assumed to follow Port St. Lucie's voting method; a new jurisdiction requires its own explicit rule row with its own source.

### `src/lib/candidates.ts`

`getCandidatesForDistricts` now calls a new internal `resolveBallotDistrictIds(districtIds)` before querying `candidates`:

1. Fetches the held districts' `type`/`city`/`state`.
2. For each held district, looks up its eligibility mode. `exact` districts are kept as-is. `citywide`/`countywide` districts are expanded: every other district sharing that same `(city, state, type)` is queried and added to the eligible set — regardless of whether the user holds a `user_districts` row for it.
3. The final expanded id list is what actually filters `candidates.district_id`.

No new `user_districts` rows are created anywhere — the expansion happens entirely inside the read query, per the explicit "do not make users hold fake representation rows" requirement.

### `src/lib/measures.ts` — intentionally unchanged

Ballot measures have their own `type` field (referendum/charter-amendment/etc., not an office jurisdiction level) and zero real measures currently exist in the database to validate eligibility semantics against. Applying the same expansion abstraction here would be guessing, which the task explicitly disallowed. **Ballot-measure eligibility needs its own separate review** once real measure data and jurisdiction rules exist.

### `src/app/onboarding/zip/page.tsx`

`ZIP_MANAGED_DISTRICTS` reduced from five entries to two, after inspecting each individually:

| Row | Kept? | Reason |
|---|---|---|
| Mayor | Yes | Citywide office/pseudo-district; correct as an automatic ZIP assignment. |
| County Commission At-Large | Yes | Confirmed via live read: **zero** `current_officials` rows are tied to this district id — holding it produces no representation record at all (`officials_for_user` never matches it). It functions purely as the countywide ballot-eligibility anchor described in the brief, not a false representation claim. |
| School Board District 1 | **Removed** | Was being assigned to every PSL user as if it were their verified representation district, with zero address confirmation — the same shape of defect Gate I36 already fixed for City Council. Ballot eligibility no longer needs it (handled by the `school_board` countywide expansion rule above, which will pick up D1/D3/D5 automatically once those district rows exist). |
| FL House District 85 | **Removed** | Port St. Lucie is confirmed split across FL House District 84 and 85. Defaulting everyone to 85 is factually wrong for District-84 residents. No verified-lookup flow exists yet, so per instruction, no automatic assignment is made — missing data is preferred over incorrect data. |
| FL Senate District 27 | **Removed** | Confirmed incorrect for St. Lucie County entirely; real coverage is District 29/31, and ZIP alone cannot distinguish them. No verified-lookup flow exists yet, so no automatic assignment is made. |

The delete-then-insert write is scoped to this same array, so any **existing** user's legacy School Board District 1 / FL House District 85 / FL Senate District 27 row is left untouched by this change — it is neither deleted nor migrated. Fresh users simply stop receiving these assignments going forward.

## Final `ZIP_MANAGED_DISTRICTS` contents

```
Mayor                              11111111-0000-0000-0000-000000000006
St. Lucie County Commission At-Large  11111111-0000-0000-0000-000000000003
```

City Council District 1/3 remain excluded, as before (Gate I36) — confirmed unchanged.

## Representation — confirmed unchanged

Not modified: `officials_for_user` (SQL view), `src/lib/officials.ts`, `CurrentOfficialsSection.tsx`, the City Council D1/D3 verified-assignment RPC/API (`src/app/api/set-city-council-district/route.ts`, `src/app/profile/city-council-district/page.tsx`), and County Commission representation behavior. Verified live (read-only) that `current_officials` has zero rows tied to the Mayor or County-Commission-At-Large district ids, and exactly one row each for City Council District 1 (Stephanie Morgan) and District 3 (Anthony Bonna, Sr.) — confirming the ballot-eligibility expansion cannot leak into representation display.

## Test results (verified live, read-only, against the actual database — not simulated)

| Test | Result |
|---|---|
| Fresh PSL user (holds only Mayor + County Commission At-Large) — ballot | **PASS** — expansion query confirmed to resolve to Mayor + City Council D1 + City Council D3 + all 6 County Commission district ids; a live candidates query against that exact id set returned all 11 currently-seeded candidates (4 Mayor, 4 CC D1, 3 CC D3) and none excluded. |
| City Council D1/D3 representation via `current_officials` | **PASS** — live query confirms exactly one row for each (Stephanie Morgan / D1, Anthony Bonna Sr. / D3), zero rows for Mayor or At-Large ids — representation cannot be affected by the ballot expansion. |
| County Commission countywide ballot expansion | **PASS** — live query confirms the `county` jurisdiction expansion returns all 6 County Commission district rows (At-Large + District 1–5) from holding only the At-Large row; District 2/4 candidates will appear automatically once imported, with no further code change. |
| County Commission Current Officials does not expand to all commissioners | **PASS by construction** — `officials_for_user` was not modified; it still performs a strict `district_id` equality join, which is architecturally incapable of returning more than one official per held district row. |
| School Board countywide expansion | **PASS** — live query confirms the `school_board` jurisdiction expansion currently returns only District 1 (the only School Board district row that exists yet); District 3/5 will appear automatically once those district rows and their candidates are added, with no further code change. |
| Fresh user receives no fake School Board representation | **PASS** — School Board District 1 removed from `ZIP_MANAGED_DISTRICTS`; a fresh user holds no School Board row at all, and therefore has no School Board Current Official, real or fake. |
| FL House stays exact-district, no universal 85 assignment | **PASS** — live query confirms `type = 'state'` districts have no rule in `ballotEligibility.ts` and fall through to `'exact'`; FL House 85 removed from `ZIP_MANAGED_DISTRICTS`, so no fresh user is auto-assigned it. |
| FL Senate — no District 27 assignment, no 29/31 guess | **PASS** — FL Senate District 27 removed from `ZIP_MANAGED_DISTRICTS`; no code anywhere infers District 29 vs. 31 from ZIP or any other heuristic. |
| Mayor — no regression | **PASS** — Mayor's own `city_council`-type expansion rule is what makes the City Council citywide behavior work at all; verified live that Mayor candidates remain in the eligible set exactly as before. |

`npm run build`: passed, 28 routes, no errors (28th route is the pre-existing untracked concurrent-work admin route, unrelated to this task). `npm run lint`: only the 5 known pre-existing `scripts/*.cjs` errors, nothing new.

## Existing-user legacy rows still requiring cleanup

Existing users may still hold, unaffected by this change:
- `School Board District 1` — assigned to essentially every prior PSL user by the now-removed default.
- `FL Senate District 27` — assigned to essentially every prior PSL user by the now-removed default.
- Possibly `FL House District 85` — assigned to prior PSL users by the now-removed default; correct for users actually in District 85, incorrect for users actually in District 84 (indistinguishable without a verified lookup).

None of these were touched, deleted, or migrated by this task, per explicit instruction. A separate, controlled cleanup is required once correct verified-district-assignment mechanisms exist for School Board and FL House/Senate (mirroring the City Council D1/D3 and disabled County Commission patterns) — not before.

## Remaining work, explicitly not done in this task

- No FL House or FL Senate verified-district-lookup flow was built.
- No School Board verified-district-lookup flow was built.
- No candidates were imported (County Commission D2/D4, School Board, FL House D84/85, FL Senate D29/D31 all remain as previously inventoried, not yet inserted).
- No existing `user_districts` row was migrated, deleted, or modified.
- The dead, unused `ballot_for_user` SQL view (`Reference Files/civicmarket_schema_v4.sql`) was not touched — it still has the original conflation flaw and now permanently disagrees with the corrected application logic. Its disposition (fix, drop, or document-as-dead) remains a separate, future, explicitly-approved database view change.
- No schema, RLS, grants, policies, functions, or migrations were changed.

## No-change confirmation

No Supabase write was performed. No `candidates`, `districts`, `elections`, `user_districts`, `current_officials`, or `officials_for_user` row/definition was created, modified, or deleted. No schema, RLS, grants, policies, functions, or migrations were changed. No secret file was inspected. `ENABLE_CITY_COUNCIL_DISTRICT_WRITE` and `ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE` both remain `false`, untouched. No deployment occurred. The unrelated untracked concurrent-work file `src/app/api/admin/extract-shannon-martin-evidence/route.ts` was left untouched.

---

## Post-Phase-1 correction — School Board anchor gap (08-20-2026)

Status: **Confirmed and corrected. No database writes. No deployment. Candidate import remains pending.**

### The gap

The original Phase 1 implementation expanded a held district only into *other districts of its own `type`*. A fresh PSL user correctly holds only `Mayor` (`type = city_council`) and `County Commission At-Large` (`type = county`) — there was never a held `school_board`-type row, by design, since no School Board representation default should exist without a verified lookup. Because the expansion logic only ever looked at the held district's own type, the `school_board` countywide rule was never triggered for anyone: County Commission expansion worked (the user holds a `county`-type anchor), City Council expansion worked (the user holds a `city_council`-type anchor via Mayor), but School Board had no anchor of its own type to expand from. Future School Board D1/D3/D5 candidates would have remained invisible to every fresh user despite being genuinely countywide-eligible races. Confirmed real by direct code inspection of `src/lib/ballotEligibility.ts` and `src/lib/candidates.ts` before any change was made.

### Design options considered

- **Anchor-by-district-ID (rejected):** hardcode "holding district `...0003` also unlocks `school_board`." Works, but ties the rule to a specific magic UUID, is one-directional (a future School Board representation row wouldn't reciprocally unlock County Commission), and doesn't generalize cleanly to "future counties can use different election rules."
- **Type-family rule (implemented):** redefine each jurisdiction rule as covering a *set* of `district.type` values that together form one ballot-eligibility family for a `(city, state)`. Holding a district of *any* type in the family expands eligibility to *all* types in the family. Symmetric, no hardcoded IDs, stays scoped exactly as strictly as the original per-`(city, state)` design already required.

### Exact correction

`src/lib/ballotEligibility.ts` — each `JurisdictionRule` now carries a `types: string[]` array instead of a single `type` field. The St. Lucie County rule's family is `['county', 'school_board']` — both offices are elected countywide per their respective official sources, so they now share one rule. A new exported `getExpansionJurisdictions(district)` returns every `(city, state, type)` in the matched rule's family (not just the held district's own type).

`src/lib/candidates.ts` — `resolveBallotDistrictIds` now calls `getExpansionJurisdictions(d)` for every held district in citywide/countywide mode, and queues an expansion query for every jurisdiction it returns, instead of only the held district's own `(city, state, type)`.

Neither change touches `user_districts`, `officials_for_user`, `src/lib/officials.ts`, or `CurrentOfficialsSection.tsx`. No School Board `user_districts` row is created anywhere by this fix — the expansion happens entirely inside the read-time ballot query.

### Test results (verified live, read-only, against the actual database)

| Test | Result |
|---|---|
| School Board District 1 reachable from the County Commission At-Large anchor alone | **PASS** — live query of `districts` filtered on `type=school_board, city=Port St. Lucie, state=FL` (the exact query the corrected code now issues) returns District 1; a fresh user holding zero `school_board`-type rows now has it in their eligible set. |
| Future School Board D3/D5 rows become eligible with no app-code change | **PASS by code trace** — the expansion query is a live, unfiltered-by-id `districts` lookup on `(type, city, state)`; any future District 3/5 row inserted with the same `type/city/state` is automatically included the next time this query runs, with zero code changes required. |
| County Commission expansion unaffected | **PASS** — live query confirms the same 6 County Commission district rows (At-Large + District 1–5) still resolve, unchanged. |
| City Council / Mayor expansion unaffected | **PASS** — live query confirms Mayor + City Council D1 + City Council D3 still resolve from holding Mayor alone, unchanged; the full fresh-user candidate query against the combined eligible set still returns exactly the same 11 currently-seeded candidates as before this fix (no School Board candidates exist yet to add to the count). |
| FL House / FL Senate remain absent without an exact assignment | **PASS** — `type = 'state'` still has no rule in `BALLOT_ELIGIBILITY_RULES`; unchanged from Phase 1. |
| No School Board representation row created | **PASS** — confirmed no `user_districts` write of any kind occurs anywhere in this fix; `src/app/onboarding/zip/page.tsx` was not touched. |
| Current Officials isolation | **PASS** — `officials_for_user`, `src/lib/officials.ts`, and `CurrentOfficialsSection.tsx` were not modified. Live-verified that `current_officials` has a School Board District 1 row (Debbie Hawley) tied to that exact district id — confirming the representation *data* exists and is reachable *only* by a user who actually holds that exact `district_id`, which a fresh PSL user does not and will not as a result of this ballot-eligibility fix. |

`npm run build`: passed, 28 routes, no errors. `npm run lint`: only the same 5 known pre-existing `scripts/*.cjs` errors, nothing new.

### Fresh-user ballot eligibility set, final

Holding only `Mayor` + `County Commission At-Large`:
- **Citywide:** Mayor, City Council District 1, City Council District 3.
- **Countywide:** every County Commission district race on the ballot, every School Board district race on the ballot (currently only District 1 exists; District 2–5 will appear automatically once added).
- **Not included:** FL House 84/85, FL Senate 29/31 — both remain absent until a verified district assignment exists; no ZIP or heuristic guess is made for either.

### No-change confirmation — this correction

No Supabase write was performed. No `candidates`, `districts`, `elections`, `user_districts`, `current_officials`, or `officials_for_user` row/definition was created, modified, or deleted. No schema, RLS, grants, policies, functions, or migrations were changed. No onboarding file was modified — `src/app/onboarding/zip/page.tsx` is unchanged from Phase 1. No secret file was inspected. `ENABLE_CITY_COUNCIL_DISTRICT_WRITE` and `ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE` both remain `false`, untouched. No deployment occurred. Candidate import remains pending. The unrelated untracked concurrent-work file `src/app/api/admin/extract-shannon-martin-evidence/route.ts` was left untouched.
