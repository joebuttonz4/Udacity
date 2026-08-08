# Internal Beta — Gate I28: District 3 User-Assignment Mechanism Design

## 1. Date and timestamp

Date: 08-08-2026
Timestamp: 07:04 am EST

This document is design and read-only verification only. It does not implement the District 3 assignment mechanism, create or modify any production `user_districts` row, perform any Supabase write, or deploy.

## 2. Repository baseline

- Path: `J:\CivicMarket`
- Branch: `master`
- Working tree: clean
- Up to date with `origin/master`
- Latest pushed commit: `65a17c5` Add Mayor citywide onboarding assignment

## 3. Purpose

Determine the safest practical way to assign a Port St. Lucie user to City Council District 3 without guessing from ZIP, and produce a complete, reviewable design — architecture comparison, recommended mechanism, exact future write boundaries, privacy/failure rules, and a minimum future gate sequence — without implementing anything.

## 4. Current District 3 live data (read-only re-confirmation)

- District: `id: 11111111-0000-0000-0000-000000000007, name: City Council District 3, type: city_council, city: Port St. Lucie, state: FL` — confirmed live.
- Election: `id: 22222222-0000-0000-0000-000000000007, name: PSL City Council D3 2026, election_date: 2026-08-18, district_id: ...000007` — confirmed live.
- Candidates: Fritz Alexandre, Jim Norton, Peter Overhuls — all confirmed live, linked to the above district/election.
- No District 3 `user_districts` assignment mechanism is currently active anywhere in the codebase.
- District 3 is confirmed **not present** in `ALL_PSL_DISTRICTS` (`src/app/onboarding/zip/page.tsx`).
- Gate I27 added only Mayor (`...000006`) as the new citywide onboarding entry — re-confirmed by direct inspection of the current file content.

## 5. Current user-assignment architecture (as inspected)

### A. Citywide onboarding (`src/app/onboarding/zip/page.tsx`)

A hardcoded, client-side `ALL_PSL_DISTRICTS` array (now 6 entries after Gate I27: City Council District 1, School Board District 1, County Commission At-Large, FL House 85, FL Senate 27, Mayor), resolved by fixed deterministic ID with no live database lookup. On a supported ZIP, the flow deletes all of a user's `user_districts` rows and re-inserts one row per array entry.

**Why this is not acceptable for District 3:** every entry in this array is granted unconditionally to every onboarded user regardless of their specific address. This is an accepted simplification for genuinely citywide-or-flatly-approximated assignments (Mayor, County Commission At-Large, School Board D1, FL House/Senate), but City Council District 3 varies by the resident's specific address within the city — adding it here would incorrectly assign every single onboarded user (including actual District 1, 2, and 4 residents) to District 3.

### B. County Commission verified-lookup pattern (`src/app/profile/county-commission/page.tsx` + `src/app/api/set-county-commission-district/route.ts`)

Current draft pattern, fully built but disabled behind `ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE = false`:

1. Authenticated profile/settings page, reached via a `SettingsRow` link from `/profile`.
2. States plainly that ZIP alone is not reliable.
3. Links out to an official external government lookup tool (opens in a new tab); the page itself never collects or stores an address.
4. Closed radio-button set of the 5 valid district labels.
5. A required attestation checkbox ("I verified this district using the official ... lookup tool").
6. `POST` to an authenticated API route with a Bearer token (the user's own Supabase session token, not a service-role key).
7. Server (`createServiceClient()`, service-role key only ever used server-side) validates the Bearer token via `auth.getUser(token)`, validates `districtLabel` against the closed set, validates `attestedOfficialLookup === true`, then **resolves the district live by exact name match** against the `districts` table (never a hardcoded ID) and fails closed (422) on zero or ambiguous matches.
8. Resolves the full scope of sibling district IDs live (all 5 County Commission districts) so a delete step can never reach an unrelated district (e.g., At-Large).
9. Guarded by a single boolean (`ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE`) — while `false`, an early return makes the delete/insert code below it unreachable and returns a `dryRun: true` response describing the exact plan instead.

**What is conceptually reusable for District 3 (not copied blindly):**
- The overall shape: profile page → external official lookup link (no address collection) → closed-set selection → attestation → authenticated API route → server-side live district resolution → scoped delete-then-insert → write-guard boolean.
- The fail-closed pattern on ambiguous/zero district matches.
- The "resolve the full sibling scope live before any delete" technique, which structurally prevents the delete from ever reaching an unrelated row.
- The dry-run response shape while disabled.

**What must differ for District 3, not be copied as-is:**
- The set has only 2 options (District 1, District 3), not 5.
- The delete scope must be exactly `{...000001, ...000007}` — City Council District 1 and 3 only — never the County Commission district IDs, never Mayor, School Board, FL House/Senate.
- The district-name resolution pattern differs: County Commission districts share a common name prefix (`St. Lucie County Commission {label}`); City Council districts do not share an equivalently simple prefix pattern with the existing `City Council District 1` naming (this is a minor, non-blocking adaptation, not a redesign).
- A new, distinct write-guard boolean is needed (not reusing `ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE`, which must remain scoped only to County Commission).

## 6. Official District 3 lookup source (verified this gate)

**Selected source: City of Port St. Lucie "Council District Finder"** — `https://pslgis.maps.arcgis.com/apps/webappviewer/index.html?id=397887d028a04aaa91e901feca2e6da1`, linked from the City's own official GIS page (`https://www.cityofpsl.com/Government/Your-City-Government/Departments/Information-Technology/Geographic-Information-Systems-GIS`, under "General Applications" → "Council District Finder: This application is designed to allow users to identify in which council district they live.").

| Field | Finding |
|---|---|
| Owning government entity | City of Port St. Lucie, Information Technology / GIS Department (hosted on the city's own ArcGIS Online organization, `pslgis.maps.arcgis.com`) |
| Accepts street address | Yes — has a "Find address or place" search box; also supports click-to-identify directly on the map |
| Returns City Council District directly | **Yes, confirmed live in this gate** — clicking a location returns an explicit popup with a `DISTRICT` field (e.g., `DISTRICT: 1`, `DISTRICT: 3`), not just a councilmember name |
| Current for 2026 | The four district shapes and councilmember names match this repository's own already-seeded/known data exactly (Stephanie Morgan = District 1, matching the live `current_officials` row seeded in an earlier gate) — strong corroborating evidence it reflects the current term |
| Deep-linkable | Yes — stable `webappviewer` URL with a fixed `id` parameter |
| Machine-readable API | **Not confirmed as documented/public in this gate.** This is an interactive Esri Web AppBuilder application, not a published REST endpoint; a Feature Service almost certainly underlies it (as with any ArcGIS Online web app), but its exact endpoint, licensing, and whether third-party programmatic access is intended was not investigated further — consistent with the same caution the County Commission Gate 2 research already applied to its own analogous tool ("not a documented REST endpoint... would need its own separate technical investigation"). No scraping or undocumented-endpoint use was attempted. |
| Terms/access restrictions | Not separately reviewed in this gate; the tool is presented as a public resident-facing city service, consistent with normal government GIS-portal use, but no explicit terms-of-service check was performed |

**Direct verification performed this gate (live, using only public/neutral government-building test points, no private address):**
- Clicked within the pink zone → `COUNCIL DISTRICT: 1, DISTRICT: 1, COUNCIL PERSON: Stephanie Morgan, CNCL ID: CD1`.
- Clicked within the green zone → `DISTRICT: 2, COUNCIL PERSON: David Pickett, CNCL ID: CD2`.
- Clicked within the cyan/southwest zone → `DISTRICT: 3, COUNCIL PERSON: Anthony Bonna, CNCL ID: CD3`.
- Clicked within the yellow zone → `DISTRICT: 4, COUNCIL PERSON: Jolien Caraballo, CNCL ID: CD4`.

This confirms the tool reliably distinguishes all four City Council districts with an explicit, unambiguous numeric field — not just a name or a general area label.

**Address-search testing note (honest limitation):** two attempted address/place-name searches ("121 SW Port St Lucie Blvd, Port St Lucie, FL 34984" and "Port St. Lucie City Hall") both returned "No results" from the tool's built-in geocoder search box during this session. This is recorded as an inconclusive/unsuccessful test of that specific input path, not a failure of the tool overall — the click-to-identify path worked perfectly and repeatedly, and the search box is a standard Esri locator widget that a real user typing a properly formatted street address would very likely be able to use successfully; this was not independently re-verified with a corrected address format in this gate. A future implementation/verification gate should perform a cleaner address-search test before relying on user-facing wording that assumes the search box works smoothly.

**No street address was collected, entered on CivicMarket's own systems, logged, or stored anywhere as part of this research.** The two test address strings above were typed directly into the third-party government tool in a browser tab, not sent to or logged by CivicMarket.

## 7. Evaluated approaches

### Option A — User verifies in official lookup and self-selects (RECOMMENDED)

| Factor | Assessment |
|---|---|
| Accuracy | High — the user reads an explicit, unambiguous `DISTRICT` value directly from the confirmed official tool (Section 6) |
| Privacy | Excellent — CivicMarket never collects, transmits, or stores a street address |
| Implementation complexity | Low — closely mirrors the already-built (though disabled) County Commission pattern |
| Third-party API dependence | None — only a client-side link-out; no server-to-server call to any external service |
| Auditability | Attestation checkbox + server-side resolution against the live `districts` table, exactly like the County Commission pattern |
| User friction | Moderate — requires leaving the app and returning, but this is the same, already-accepted friction level as the County Commission flow |
| Failure handling | Fail-closed (no live district match → no write), same as County Commission |
| Risk of incorrect self-selection | Nonzero (a user could misread the tool or attest falsely) — but no worse than the already-approved-in-principle County Commission pattern, which accepts this exact same risk class |

### Option B — CivicMarket directly calls an official address/GIS API

No official, documented, public REST API was confirmed for City Council district lookup during this gate's research (Section 6). Building a server-side call against the undocumented feature service behind the interactive map viewer would require its own separate technical and terms-of-use investigation (authentication requirements, rate limits, CORS/server-side query shape, licensing, PII handling for a full address, logging policy, reliability/maintenance burden) before it could be responsibly recommended. **Not recommended in this gate** — this is exactly the "scraping an unsupported interactive map" pattern the instructions direct against, and Option A already achieves the same accuracy outcome without needing it.

### Option C — Store user street address and derive district internally

Disfavored, per instruction, unless strongly justified — and no such justification was found. This would require: collecting and retaining a street address (new PII the app doesn't otherwise need), a geocoding step (new third-party dependency or self-hosted service), ongoing government-boundary-data maintenance (redistricting risk, identical to the risk already flagged for the County Commission tool), and its own RLS/security review before any implementation. Since Option A achieves full accuracy without storing an address at all, Option C offers no accuracy advantage to offset its added privacy and maintenance cost. **Not recommended.**

### Option D — ZIP-only assignment

**Rejected.** No official evidence was found, in this gate or any prior gate in this repository (including the County Commission Gate 2 boundary-seam finding), that ZIP deterministically identifies a Port St. Lucie City Council district. The very existence of a dedicated, address/point-based "Council District Finder" tool — rather than a ZIP lookup table — is itself further evidence that the city does not consider ZIP sufficient for this purpose.

## 8. Recommended architecture

**Recommended: Option A — official lookup + user attestation**, using a dedicated profile/settings flow adapted from the County Commission pattern's shape, specifically for PSL City Council District assignment.

**Proposed page (not created in this gate):** `src/app/profile/city-council-district/page.tsx`

**Proposed API route (not created in this gate):** `src/app/api/set-city-council-district/route.ts`

**Recommended user flow:**
1. Authenticated user opens "Set City Council District" from Profile → Settings.
2. CivicMarket states plainly that ZIP alone cannot safely determine District 1 vs. District 3.
3. CivicMarket does not collect or store a street address anywhere on this page.
4. A link opens the official City of Port St. Lucie "Council District Finder" tool (Section 6) in a new tab.
5. User returns and selects exactly one of: **City Council District 1** / **City Council District 3** (a closed, two-option set — not all four city districts, since Districts 2 and 4 currently have no CivicMarket candidate/election data at all; see Section 9's honest scope note).
6. User must check an attestation: "I verified this district using the official lookup tool."
7. Server validates the closed-set input and the attestation boolean.
8. Server resolves the selected district live against the current `districts` table (never a hardcoded ID assumption at the validation step, even though the expected resolved IDs are known and checked — see Section 10).
9. Server deletes only the user's existing City Council District 1/3 `user_districts` rows (scoped to exactly those two IDs).
10. Server inserts the newly selected district row.
11. All unrelated `user_districts` rows (Mayor, School Board, County Commission At-Large, FL House, FL Senate, and, if ever added, County Commission District 1-5) remain untouched.

This is a design only. No page or route is created by this gate.

## 9. Critical District 1 default-assignment finding

**This is a real, currently-live data-accuracy issue, not merely a theoretical risk.**

The `Council District Finder` tool (Section 6) confirms Port St. Lucie has **four** City Council districts, covering materially different, non-trivial portions of the city — not a simple 1-vs-3 split. Under the current onboarding architecture (Section 5A), **every** onboarded Port St. Lucie user, regardless of their actual address, is unconditionally assigned City Council District 1. This means any user who is not actually a District 1 resident is currently shown:
- District 1's candidates (Eric Reikenis, Fredric Meltzer, Indony Baptiste, Kevin Zimmerman) on their ballot, instead of their own district's race (District 3's candidates, for a District 3 resident) or no city-council race at all (for a District 2 or 4 resident, since neither has any CivicMarket candidate data — District 2 and 4 seats are not up in the 2026 cycle per the City Clerk's own FAQ).
- Stephanie Morgan (District 1) as their "current official," instead of their own district's councilmember (David Pickett/District 2, Anthony Bonna/District 3, or Jolien Caraballo/District 4 — none of whom are currently seeded in `current_officials` at all).

**This has not yet caused real user-facing harm**, because Internal Beta to date has used a small number of trusted test accounts, not a geographically diverse real population — but it is a live, unaddressed misrepresentation risk that would immediately become material the moment beta expands to real Port St. Lucie residents (the explicitly planned "Controlled PSL Beta" stage in `docs/beta_launch_readiness_plan.md`).

**Recommendation: the long-term product model should NOT remain "onboarding defaults every PSL user to District 1, and only self-motivated users manually correct it via a buried settings page."** That model silently misrepresents the majority of non-District-1 residents by default, and does nothing at all for District 2/4 residents even after a District 1↔3 correction mechanism exists. The correct target state is that **City Council District 1 should eventually be removed from the flat `ALL_PSL_DISTRICTS` onboarding default**, and every Port St. Lucie user should instead go through a verified City Council district step (ideally covering all four districts, once District 2 and 4 have CivicMarket candidate/election data, or at minimum prominently required for District 1 vs. 3 given today's data). This is a materially larger onboarding-flow change — changing what every new user experiences by default, not just adding a correction path — and is correctly **out of scope for Gate I28/I29 to implement**; it requires its own future, separately-scoped and separately-approved gate.

**Interim acknowledgment:** until that larger change is designed and approved, the current default-to-District-1 behavior should be explicitly understood and documented as a known, accepted, temporary Internal Beta accuracy limitation — not a hidden defect — and it must be resolved (or the risk explicitly accepted with eyes open) before any Controlled PSL Beta invitation goes out to real, geographically diverse residents. The Gate I28/I29 District 1↔3 correction mechanism is a necessary and valuable improvement on its own, but it is **not** a full fix for this default-assignment problem and must not be mistaken for one.

## 10. Exact future write behavior (design only, not executed)

Approved PSL City Council IDs for the future route's scope:
- District 1: `11111111-0000-0000-0000-000000000001`
- District 3: `11111111-0000-0000-0000-000000000007`

**Proposed safe mutation sequence:**
1. Authenticate the user via Bearer token (`createServiceClient()` + `auth.getUser(token)`, same pattern as the County Commission route).
2. Validate `attestedOfficialLookup === true`.
3. Validate the selected label against the closed set (`City Council District 1` / `City Council District 3` only).
4. Resolve the selected district live against `districts` by exact name match, failing closed (422) on zero or ambiguous matches — never trusting a hardcoded ID at this validation step, even though the two only-possible resolved values are already known (`...000001` / `...000007`); this mirrors the County Commission route's own discipline of never hardcoding IDs into the write path itself.
5. Additionally verify the resolved ID is one of the two approved fixed IDs above, as a second, redundant safety check before any delete is planned.
6. Resolve both City Council District 1 and District 3 IDs live (not just the selected one) to build the delete scope, so a future name-drift in `districts` cannot silently widen or narrow what gets deleted.
7. Delete `user_districts` rows for this user where `district_id IN (...000001, ...000007)` — scoped to exactly these two IDs, nothing else.
8. Insert exactly one row: the newly selected City Council district.
9. Preserve, untouched: Mayor, School Board District 1, County Commission At-Large, FL House 85, FL Senate 27, and (if ever populated) County Commission District 1-5 assignments.

**Duplicate handling:** the delete-then-insert pattern (identical in shape to both the existing onboarding flow and the County Commission draft route) prevents duplicate City Council district rows for a user across repeated submissions — a second submission would delete the prior selection before inserting the new one.

**Rollback:** if a submission fails between the delete and insert steps, the safest recovery is for the route to return a clear error to the user and let them resubmit (re-running the same idempotent delete-then-insert sequence), rather than attempting an automatic server-side rollback of a partially-completed operation. This mirrors how the County Commission route already handles a post-delete insert failure (returns a 500, does not attempt to restore the deleted rows) — see Section 11 for the atomicity concern this shares.

## 11. Privacy and failure-handling rules

- CivicMarket does not collect a street address anywhere in this flow.
- No address is ever sent to a CivicMarket API endpoint.
- No address is logged.
- No address is stored in Supabase.
- Only the verified district assignment (a `user_districts` row) is stored — the same minimal-data pattern already used for County Commission.
- Service-role credentials are never exposed client-side (server-only `createServiceClient()`, same as County Commission).
- Access tokens are never logged.
- Auth failures return a generic 401 (no internal detail leaked).
- An invalid district label returns 400.
- A missing/false attestation returns 400.
- An unknown or ambiguous district-name match causes no mutation (fail closed, 422) — matches the County Commission route's existing discipline exactly.
- Partial failure must not leave a user with **both** District 1 and District 3 simultaneously assigned — the delete-before-insert ordering (Section 10) structurally prevents this specific failure mode, since the insert can only add the new row after the old one(s) are already gone.

**Atomicity recommendation:** the existing REST-based delete-then-insert pattern (used by both current onboarding and the County Commission draft route) **cannot guarantee true atomicity** — a failure between the delete and the insert would leave the user with **zero** City Council district assigned, not a duplicate. This is a real, if narrow, gap already present (unexercised) in the accepted County Commission pattern, not something newly introduced by this design. **Recommendation for Gate I29:** either (a) wrap the delete-and-insert in a single Postgres function/RPC call for true transactional atomicity, or (b) at minimum, have the route detect a post-delete insert failure and return a clearly actionable error state (e.g., "Your previous district was cleared but the new one could not be saved — please try again") rather than a generic 500, so the user is never left in an unexplained no-district state. No schema or RPC is created in this gate — this is a recommendation for the implementation gate to decide and build.

## 12. Ballot and Current Officials impact (traced, not modified)

- **`getCandidatesForDistricts`/`getUserDistrictIds` (`src/lib/candidates.ts`) already use `user_districts` fully generically** — they simply filter `candidates` by whatever `district_id`s a user's `user_districts` rows contain, with no District-1-specific logic anywhere. Confirmed by direct inspection.
- **Replacing a user's City Council District 1 assignment with District 3 is therefore sufficient, by itself, for the ballot to update correctly**: District 3 candidates (Fritz Alexandre, Jim Norton, Peter Overhuls) would appear, District 1 candidates would disappear, and all other assignments (Mayor, School Board, County Commission At-Large, FL House/Senate) would remain visible exactly as before — no ballot-page code change is required for this to work.
- **`getOfficialsForUser` (`src/lib/officials.ts`) reads generically from the `officials_for_user` database view**, joined on `user_id`/`district_id` with no District-1-specific code (the earlier B2 County-Commission-specific widening logic was already removed in a prior gate, per `CIVICMARKET_CURRENT_STATE.md`'s "Path 1 personalization fix"). No District-1-specific assumption was found in this file.
- **However:** switching a user from District 1 to District 3 would cause them to **lose** Stephanie Morgan (District 1's currently seeded `current_officials` row) from their Current Officials list **without gaining a replacement**, because **no District 3 councilmember (`Anthony Bonna`) `current_officials` row currently exists**. This is a data-completeness gap, exactly parallel to the already-documented Mayor-district gap pattern in this repository, not a code defect — and it is correctly out of scope for Gate I28/I29 to fix. A future, separately-approved gate would need to research and seed an Anthony Bonna `current_officials` row, following the same verified-source methodology already used for Stephanie Morgan, Debbie Hawley, and Toby Overdorf.

## 13. Recommended future gate sequence

**Gate I29 — District 3 Assignment Implementation**
- Create the profile/settings page and authenticated API route per Section 8's design.
- Keep the write disabled behind an explicit new guard boolean (not reusing `ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE`).
- Build/static verification only. No production write.

**Gate I30 — Live UI and Negative-Path Verification**
- Auth rejection, invalid district label, false attestation, dry-run response content, live UI review (mirroring the County Commission Gate 10/11 pattern already proven in this repository). No production assignment yet.

**Gate I31 — Scoped Test-Account Write**
- Only after explicit approval: one named test account, a known verified district, documented pre-state, exact mutation, documented post-state, rollback plan, guard restored immediately after.

This three-gate sequence is already the minimum proven-safe shape used for County Commission District 1-5 and is not recommended to be compressed further — each gate answers a materially different question (does the code work statically; does it behave correctly against negative/edge inputs live; does one real write actually succeed end-to-end) and collapsing any of them would remove a real verification step this repository's own history shows is worth having.

## 14. Gate outcome

**Gate I28 PASS — recommended District 3 assignment architecture is ready for explicit implementation approval.**

The official lookup source is confirmed and verified live (Section 6), the recommended architecture is fully specified (Sections 8, 10), privacy and failure rules are defined (Section 11), and the ballot/Current-Officials impact is traced with no code changes required for the ballot itself (Section 12). The one open, non-blocking finding is the default-District-1-assignment risk (Section 9), which is explicitly flagged as its own, separate, future-gate-scoped decision — it does not block Gate I29 from implementing the District 1↔3 correction mechanism itself.

## 15. No-change confirmation

Gate I28 made no changes to: `candidates`, `elections`, `districts`, `user_districts`, `voting_records`, `candidate_positions`, `match_scores`, `civic_dna`, `civic_dna_answers`, `current_officials`, `officials_for_user`, `src/lib/officials.ts`, `CurrentOfficialsSection`, `src/app/onboarding/zip/page.tsx`, `src/app/profile/county-commission/page.tsx`, `src/app/api/set-county-commission-district/route.ts`, `src/lib/supabase-server.ts`, `src/lib/candidates.ts`, the ballot page, the candidate profile, schema, RLS, grants, seeds, migrations, CSV files, any other source code, PowerShell scripts, environment files, the County Commission write guard, the At-Large row, or deployment state.

No database write occurred. No `user_districts` row was created, modified, or deleted. No secret, API key, token, password, connection string, or environment value was inspected or exposed. `ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE` remains `false`. The District 1 election-date discrepancy remains unresolved. No deployment occurred.
