# Internal Beta — Gate I30: City Council District Assignment Live UI and Negative-Path Verification

## 1. Date and timestamp

Date: 08-08-2026
Timestamp: 07:33 am EST

This document is verification only. No new assignment behavior was implemented. Production City Council/County Commission writes remain disabled throughout. No `user_districts` mutation occurred.

## 2. Repository baseline

- Path: `J:\CivicMarket`
- Branch: `master`
- Working tree: clean
- Up to date with `origin/master`
- Latest pushed commit: `e4f7724` Add City Council district assignment flow

## 3. Write-guard states (statically confirmed)

- `ENABLE_CITY_COUNCIL_DISTRICT_WRITE = false` — confirmed by direct inspection of `src/app/api/set-city-council-district/route.ts`, line 9.
- `ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE = false` — confirmed by direct inspection of `src/app/api/set-county-commission-district/route.ts`, line 9.
- The City Council route accepts only `City Council District 1` and `City Council District 3` (`VALID_DISTRICT_LABELS`).
- Approved fixed IDs confirmed: District 1 `11111111-0000-0000-0000-000000000001`, District 3 `11111111-0000-0000-0000-000000000007`.
- The future delete scope is built by resolving `.in('name', ['City Council District 1', 'City Council District 3'])` live — confirmed this resolves to exactly those two IDs against the live `districts` table (re-verified read-only this gate).
- Mayor (`...000006`) and County Commission At-Large (`...000003`) do not match either City Council district name and are structurally outside the delete scope — confirmed by both code inspection and a fresh live read of all four rows.

No code was changed to reach these confirmations — the Gate I29 implementation already matched Gate I28's design exactly.

## 4. Read-only pre-test database baseline

- District 1 (`...000001`, `City Council District 1`, `city_council`), District 3 (`...000007`, `City Council District 3`, `city_council`), Mayor (`...000006`, `Mayor`, `city_council`), and County Commission At-Large (`...000003`, `St. Lucie County Commission At-Large`, `county`) all confirmed live and correctly named.
- Candidate total confirmed unchanged at 11 (4 District 1 + 4 Mayor + 3 District 3).
- **Limitation, recorded honestly:** `user_districts` is RLS-restricted to `auth.uid() = user_id`; an anonymous read-only query cannot return an authenticated test account's actual row set. This gate relies instead on: the disabled write guard, direct inspection confirming the delete/insert code is unreachable, the dry-run response content, and a live before/after comparison of the same account's rendered Current Officials section (Section 6), which indirectly but conclusively proves no assignment changed.

## 5. API negative-path verification

| Test | Method | Result |
|---|---|---|
| A. Unauthenticated POST (no `Authorization` header) | Live `curl` against local dev server | `401 {"error":"Unauthorized"}` ✓ |
| B. Malformed `Authorization` header (not `Bearer`-prefixed) | Live `curl` | `401 {"error":"Unauthorized"}` ✓ — **same code path as A** (`!authHeader?.startsWith('Bearer ')`), documented honestly rather than presented as materially distinct behavior |
| C. Invalid/garbage Bearer token | Live `curl` with `Authorization: Bearer not-a-real-token-xyz` | `401 {"error":"Unauthorized"}` ✓ |
| D. Invalid `districtLabel` (e.g. `City Council District 2`) | **BLOCKED for live testing** — requires a valid authenticated session token, which was not created (no credentials entered, per standing rule) | Verified instead by direct code-trace: `isValidDistrictLabel` rejects any value not exactly `City Council District 1` or `City Council District 3`, returning `400` before any database call |
| E. `attestedOfficialLookup: false` | **BLOCKED for live testing**, same reason as D | Code-trace: checked immediately after the label check, returns `400` before any database call |
| F. Missing attestation field | **BLOCKED for live testing**, same reason as D | Code-trace: `attestedOfficialLookup !== true` covers `undefined`/missing identically to `false` — same `400` branch |
| G. Valid District 1 + attestation | **Live-tested via the authenticated UI** (an already-authenticated beta test session, `civicmarket.test.01@example.com`, was available — the assistant did not sign in or handle credentials) | `dryRun: true`; UI displayed the exact expected message "Write path disabled pending explicit approval. No user_districts row was created or modified."; HTTP 200 |
| H. Valid District 3 + attestation | Live-tested the same way, network request confirmed `POST /api/set-city-council-district` → `200` | Same exact dry-run message displayed; district resolved live to `...000007` per Section 3's confirmed name-to-ID mapping |

Note on G/H: the raw JSON response body's `selectedDistrictId` field was not extracted via script (an earlier attempt in a prior gate to intercept `fetch` calls was blocked by the harness's safety classifier as a credential-interception pattern, and that approach was not retried here). Instead, the exact resolved ID for each case is established by triangulating three independent facts: (1) the live `districts` table confirms `City Council District 1` = `...000001` and `City Council District 3` = `...000007` exactly, (2) the route's code unconditionally sets `selectedDistrictId: resolvedDistrict.id`, and (3) both live submissions returned HTTP 200 with the exact expected dry-run message. This is direct-evidence-plus-code-trace, not a live extraction of the raw response body.

## 6. Live UI verification

**Profile Settings:** "Set City Council District" row visible, helper text reads "Verify District 1 or District 3 using the official City lookup tool." — confirmed live. The existing "Set County Commission District" row is unchanged.

**Assignment page (`/profile/city-council-district`):**
- Loads successfully.
- States plainly: "Port St. Lucie City Council District 1 and District 3 cannot safely be told apart by ZIP code alone — district boundaries can cross ZIP code lines."
- Official lookup link visible, labeled "Find my City Council district ↗", `href` confirmed to be exactly `https://pslgis.maps.arcgis.com/apps/webappviewer/index.html?id=397887d028a04aaa91e901feca2e6da1` — the exact Gate I28 authoritative source.
- No street-address input field exists anywhere on the page (confirmed by direct page-text extraction).
- States plainly: "CivicMarket does not collect or store your address on this page."
- Exactly two district choices rendered: `City Council District 1`, `City Council District 3`. No District 2, no free-text field.
- Attestation checkbox visible ("I verified this district using the official lookup.").
- Submit button (`Save my district`) confirmed disabled until both a district is selected and the attestation checkbox is checked (visually and via `canSubmit` code inspection).
- Dry-run success state: clear, plain-language message shown in a neutral (non-error) styled box — understandable, not alarming.
- Error-state styling exists (red-bordered box) but was not triggered live in this gate (no negative authenticated case was run against the UI, consistent with Section 5's D/E/F scope).

## 7. Live UI dry-run behavior

- **District 1:** selected, attested, submitted → dry-run message displayed exactly as expected, no navigation away, no "saved" language anywhere.
- **District 3:** selected (switching from the prior selection), attestation remained checked, submitted → dry-run message displayed exactly as expected, `POST /api/set-city-council-district` confirmed via network inspection to return `200`.
- Neither submission was interpreted or treated as a production assignment. The write guard was not enabled at any point.

## 8. Mobile and keyboard result

- **Keyboard:** Real Tab key presses traced a logical focus order — back-to-profile link → official lookup link → district radio group (landing on the already-checked option, standard native radio-group behavior) → attestation checkbox → (submit button next in sequence). A visible focus outline was confirmed via screenshot on the checkbox.
- **Mobile viewport (390px):** **BLOCKED (tooling)** — `resize_window` did not change the actual rendered viewport in this environment (`window.innerWidth` remained `1920` after the call), the same pre-existing limitation already documented in Gates I17, I21, and I27. Not fabricated as a pass. **Supplementary check performed:** a CSS `zoom: 200%` approximation (same method used in those prior gates) showed a clean, non-overlapping, fully readable single-column layout with no horizontal scroll — consistent with, though not a substitute for, a true narrow-viewport test.

## 9. No-production-mutation verification

- The write guard remained `false` for the entire gate; never modified, never temporarily enabled.
- Direct code inspection confirms the `DELETE`/`INSERT` statements are lexically unreachable below the guard's early return.
- Both live dry-run submissions returned the disabled-write message, not a saved confirmation.
- **Strongest direct evidence:** the same authenticated test account's Profile page was reloaded *after* both dry-run submissions (including the District 3 one). "My Current Officials" still showed **Stephanie Morgan, City Council Member, District 1** — identical to the pre-test state. If the District 3 dry-run submission had actually mutated `user_districts`, this account would no longer hold the District 1 assignment and Stephanie Morgan would no longer appear (per the already-confirmed-generic `officials_for_user` query logic). This is direct, live, positive proof that no mutation occurred, not merely an absence-of-error inference.
- Mayor, County Commission At-Large, and County Commission District 1-5 assignments were not targeted by any code path exercised in this gate.

## 10. Current Officials blocker (reconfirmed)

**Reconfirmed unresolved, via a fresh direct read-only query this gate:** `current_officials` contains exactly 8 rows (Stephanie Morgan/District 1, Debbie Hawley/School Board D1, Toby Overdorf/FL House 85, and the five County Commission District 1-5 officials). **No row references City Council District 3 (`...000007`) or any name matching "Bonna."** A user who eventually switches from District 1 to District 3 would still lose Stephanie Morgan from Current Officials with no replacement. **Gate I31 remains blocked on this data gap.** No `current_officials` row was created, modified, or guessed in this gate.

## 11. Atomicity finding (reconfirmed)

Direct inspection of `src/app/api/set-city-council-district/route.ts` (lines 159-178, unreachable while the guard is false) confirms the delete-then-insert pair remains **two independent Supabase calls, not wrapped in a transaction or RPC** — unchanged from Gate I29's own finding. A delete success followed by an insert failure would leave the user with **neither** District 1 nor District 3 assigned. No RPC or schema change was made or is recommended to be made in this gate. **This remains a Gate I31 blocker unless explicitly accepted or resolved.**

## 12. District 1 onboarding default-accuracy risk (reconfirmed)

Direct inspection of `src/app/onboarding/zip/page.tsx` (unchanged by this gate) confirms `ALL_PSL_DISTRICTS` still unconditionally assigns City Council District 1 to every onboarded Port St. Lucie user, regardless of actual address. ZIP cannot safely distinguish District 1 from District 3 (Gate I28's finding, unchanged). The new `/profile/city-council-district` flow provides a **future, user-initiated correction mechanism** once writes are enabled — it does not eliminate the initial misassignment, and does nothing at all for a user who never visits the settings page.

**Recommendation:** this risk should be explicitly resolved — either by removing City Council District 1 from the onboarding default in favor of a mandatory verified step, or by an explicit, documented decision to accept the risk for a bounded period — **before any Controlled PSL Beta invitation goes out to a real, geographically diverse population.** It is not a blocker for continuing Internal Beta with the current small, trusted test-account population, and this gate does not implement a fix, per its verification-only scope.

## 13. Build and lint

- `npm run build`: **passed** — 27 routes, no errors (unchanged route count from Gate I29, since no new pages/routes were added in this verification-only gate).
- `npm run lint`: **5 pre-existing errors only** (`scripts/import-real-psl-data.cjs`, `scripts/validate-real-psl-csvs.cjs`), identical to every prior run. No new errors, since no source file was modified in this gate.

## 14. No deployment

No deployment occurred at any point in this gate.

## 15. Outcome

**Gate I30: PASS.** The live UI works as designed, all live-testable negative paths (A-C) behaved exactly as expected, the two live-testable positive dry-run paths (G, H) behaved exactly as expected with direct evidence of zero mutation, the write guard remained false throughout, and no defect in the Gate I29 implementation was found.

**Gate I31: BLOCKED.** Exact blockers, unchanged from Gate I28/I29 and reconfirmed live this gate:
1. City Council District 3 `current_officials` row absent (Section 10).
2. Non-atomic delete-then-insert replacement remains (Section 11).
3. Explicit test-account identity not yet approved for a scoped live write.
4. Explicit live write approval not yet given.

Separately and additionally flagged, not a Gate I31 blocker but a required pre-broad-beta decision: the District 1 onboarding default-accuracy risk (Section 12).

## 16. No-change confirmation

Gate I30 made no changes to: `candidates`, `elections`, `districts`, `user_districts`, `voting_records`, `candidate_positions`, `match_scores`, `civic_dna`, `civic_dna_answers`, `current_officials`, `officials_for_user`, `src/lib/officials.ts`, `CurrentOfficialsSection`, `src/app/onboarding/zip/page.tsx`, `src/app/profile/city-council-district/page.tsx`, `src/app/api/set-city-council-district/route.ts`, `src/app/profile/county-commission/page.tsx`, `src/app/api/set-county-commission-district/route.ts`, `src/lib/supabase-server.ts`, schema, RLS, grants, seeds, migrations, CSV files, PowerShell scripts, environment files, the At-Large row, or deployment state.

No database write occurred. No `user_districts` row was created, modified, or deleted. No secret, API key, token, password, connection string, or environment value was inspected or exposed. `ENABLE_CITY_COUNCIL_DISTRICT_WRITE` remains `false`. `ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE` remains `false`. The District 1 election-date discrepancy remains unresolved. No deployment occurred. The local dev server started for this gate's live verification was stopped after testing concluded, and no stray Node processes remained.
