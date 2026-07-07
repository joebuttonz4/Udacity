# County Commission District 1-5 Assignment Lookup — Gate 6: Draft Implementation Plan and Code Review

Date: July 7, 2026

## Current baseline

Repo HEAD at the start of this task: commit `e33872f` ("Add County Commission district assignment Gate 5 checklist").

This document continues directly from `docs/county_commission_district_assignment_lookup_gate_5_approval_checklist.md`. As of this baseline, nothing about app behavior, schema, seeds, migrations, `districts`, `user_districts`, `officials_for_user`, or the St. Lucie County Commission At-Large row has changed since Gate 5. No Gate 5 checklist item has been separately approved as of this baseline — this Gate 6 document does not itself approve any of them.

## Purpose

Turn the Gate 4 plan and Gate 5 checklist into a concrete, file-level draft: identify the exact files and functions a future implementation would touch, and describe precisely how each piece of the flow would work in terms of this codebase's actual current structure. This is a design/code-review document. It proposes changes; it does not make them.

## Gate 6 scope

This document may inspect existing code and propose draft changes, but must not apply any behavior change unless the user explicitly asks for it after reviewing this document. Specifically, this task:

- Does not write to Supabase production.
- Does not create production `user_districts` rows.
- Does not change schema, seeds, migrations, `districts`, or `officials_for_user`.
- Does not rename, delete, replace, or repurpose the At-Large row.
- Does not deploy anything.
- Does not run any mutation against live data.
- Does not edit any file under `src/`.

## Code inspected for this draft

- [src/lib/officials.ts](../src/lib/officials.ts) — `getOfficialsForUser`, reads only from the `officials_for_user` view, keyed by `user_id`.
- [src/app/onboarding/zip/page.tsx](../src/app/onboarding/zip/page.tsx) — the existing `user_districts` write pattern: client-side `supabase` calls, delete-then-insert (not upsert, since `user_districts` has no UPDATE RLS policy), hardcoded `ALL_PSL_DISTRICTS` id/name/scope table, auth via `supabase.auth.getUser()`.
- [src/app/onboarding/districts/page.tsx](../src/app/onboarding/districts/page.tsx) — reads district assignments back out via `getUserDistrictIds` (in `src/lib/candidates.ts`) to build the ballot; a read-side consumer of `user_districts`, not a write path, but shows the established pattern for reading a user's districts.
- [src/lib/candidates.ts](../src/lib/candidates.ts) — `getUserDistrictIds(userId)`, a simple `select district_id from user_districts where user_id = ...` — the existing precedent for a small, single-purpose district-lookup helper function.
- [src/lib/supabase.ts](../src/lib/supabase.ts) — the browser/anon Supabase client, used by all client components including `/onboarding/zip`.
- [src/lib/supabase-server.ts](../src/lib/supabase-server.ts) — `createServiceClient()`, a server-only service-role client, explicitly commented "never import this from a 'use client' file."
- [src/app/api/compute-match-scores/route.ts](../src/app/api/compute-match-scores/route.ts) — the existing precedent for a POST API route that: validates a Bearer token via `supabase.auth.getUser(token)` against the service client, performs reads and a scoped delete-then-insert write, and returns a JSON result. This is the closest existing template for a server-side district-lookup-and-write route, since it already does an authenticated, scoped delete-then-insert against a table keyed by `user_id`.
- [src/app/profile/page.tsx](../src/app/profile/page.tsx) — the `SettingsRow` pattern (`My Districts`, `Data Sources`, `Report an Issue`, disabled `Notifications`/`About CivicMarket`) inside the "Settings" card — the natural existing UI slot for a new opt-in "Verify your County Commission district" action, consistent with Gate 4's "profile-settings action, not a forced onboarding gate" requirement.
- [src/components/CurrentOfficialsSection.tsx](../src/components/CurrentOfficialsSection.tsx) — the read-only consumer of `getOfficialsForUser`; confirms the display path requires no changes, since it already renders whatever `officials_for_user` returns for the authenticated user.
- Prior gate docs: `docs/county_commission_district_assignment_lookup_gate_1.md` through `gate_5_approval_checklist.md`, and `docs/county_commission_current_officials_gate_a_source_reverification.md` through `gate_h_ui_verification.md` (the disabled B2 sequence, useful as a reference for the five District 1-5 `current_officials` rows and district ids already seeded).

## Where address-level lookup should happen

The lookup itself (calling out to the county's ArcGIS tool) should **not** be proxied or embedded server-side. The county tool is a public, unauthenticated, third-party web page; the cleanest and lowest-risk approach is a **manual link-out with user-confirmed self-report**, matching Gate 4's "Deferred work" item that left the UI mechanism open:

1. A new settings row in `src/app/profile/page.tsx`'s Settings card (e.g., `SettingsRow` labeled "Verify your County Commission district"), linking to a new route — draft name `src/app/profile/county-commission/page.tsx` — rather than a forced onboarding step, per Gate 5's approved "UI placement" item (pending explicit approval).
2. That new page would: explain what the tool does, link out to the Gate 2-verified URL (`https://slc.maps.arcgis.com/apps/instant/lookup/index.html?appid=9afb7523a1854366bed2d7c50ed7428b`) in a new tab, and present a constrained input for the user to report back the single "District N" label the tool showed them (e.g., a `<select>` of exactly "District 1" through "District 5", not a free-text field) — this sidesteps building any label-parsing code against uncontrolled free text, since the county tool's own page is the source of truth and the user is merely relaying a value from a fixed, small set.
3. This avoids scraping, embedding, or querying the county's ArcGIS feature layer programmatically (Gate 4 Risk 2 / "Deferred work" — a server-side ArcGIS query is explicitly not part of this draft).

This means "address-level lookup" happens entirely on the county's own site, outside CivicMarket's control or storage — CivicMarket never receives, transmits, or stores the address itself, only the resulting district selection the user confirms.

## Whether the existing lookup flow can be extended

The existing `/onboarding/zip` flow **should not** be extended for this purpose. Reasons, grounded in the code read above:

- `/onboarding/zip` writes the fixed five-row `ALL_PSL_DISTRICTS` table (city, school board, county at-large, state house, state senate) unconditionally for every PSL ZIP. It has no per-user branching logic today, and Gate 4 already ruled out ZIP-only input as insufficient for District 1-5.
- Gate 4 requires this to be an **opt-in profile-settings action**, not a forced onboarding gate — mixing it into `/onboarding/zip` would violate that already-planned placement and would also conflict with `CLAUDE.md`'s current priority of stabilizing onboarding before building more screens.
- The two flows have different trust models: `/onboarding/zip` trusts a hardcoded ZIP→district table; this feature trusts a user-confirmed single-label selection sourced from an external verified tool. Conflating them would make both harder to reason about and test independently.

Instead, this draft proposes a **new, separate, additive flow** (new page + new API route) that reuses the same *primitives* `/onboarding/zip` already established (delete-then-insert against `user_districts`, `supabase.auth.getUser()` for identity) without touching `/onboarding/zip` itself.

## How returned District 1-5 labels should be parsed

Per the UI design above, there is no free-text parsing to do at all in a first implementation: the user selects from a fixed `<select>`/radio set of exactly five options ("District 1" through "District 5"), so the "label mapping" step collapses to a closed enum check, not a string parser. This is a deliberate simplification versus Gate 4's original free-text-parsing design, and should be called out explicitly for Gate 6 approval as a proposed refinement:

- **Proposed refinement:** since the user is manually relaying a result from a page they are looking at, constrain the input to a closed set (`'District 1' | 'District 2' | 'District 3' | 'District 4' | 'District 5'`) client-side, and reject (400) anything else server-side, rather than attempting to parse an arbitrary string copied from the tool.
- If a future iteration instead wants to capture the tool's raw text output (e.g., via copy-paste) for a closer fidelity to Gate 4's original design, the same exact-match validation described in Gate 4 ("accept only if it cleanly parses to exactly one of 'District 1' through 'District 5'; treat anything else as a failed lookup") still applies and would live in the new API route below, not in `src/lib/officials.ts` or any existing file.

## How district IDs should be verified from the `districts` table before write

A new server-side helper — draft location `src/lib/officials.ts` (adding a function) or a new small file `src/lib/county-commission-district.ts` — would, given a validated "District N" enum value, query:

```
select id from districts
where name = 'St. Lucie County Commission District ' || N
```

at write time, inside the new API route (see below), using the **service-role client** (`createServiceClient()` from `src/lib/supabase-server.ts`), not a hardcoded id copied from this document or from Gate 4. If the query returns zero or more than one row, the route must fail closed (no write), matching Gate 4's "Required district IDs" section. This mirrors the existing `officials.ts` style of a small, single-purpose Supabase query function.

## How `user_districts` should be updated later

A new API route — draft location `src/app/api/set-county-commission-district/route.ts` — modeled directly on `src/app/api/compute-match-scores/route.ts`'s existing shape:

1. `POST` only, `Authorization: Bearer <token>` header required, matching the compute-match-scores pattern exactly.
2. `createServiceClient()` + `supabase.auth.getUser(token)` to resolve the authenticated user server-side (never trust a client-supplied `user_id`).
3. Validate the request body's district selection against the closed five-value enum (see above); reject anything else with `400`.
4. Resolve the enum value to a live `districts.id` via the query above; reject with `400`/`422` if not exactly one match.
5. Perform the delete-then-insert against `user_districts`, scoped narrowly (see next section), using the **same service-role client** already authenticated as acting on behalf of the confirmed `userId` — consistent with how `compute-match-scores` already performs a scoped, service-role write gated by a verified user token, which is the existing precedent in this codebase for a service-role write that is nonetheless authorized per-request by a validated user token (this satisfies Gate 4's "authenticated, RLS-guarded path" intent even though it is service-role rather than anon-client, because authorization is enforced in the route itself, exactly as `compute-match-scores` already does for `match_scores`).
6. Return a small JSON result (e.g., `{ district_id, district_name }`) on success, or an error status/message on failure — no `user_districts` row is written on any failure path.

This is a **new file**; no existing route is modified.

## How duplicate District 1-5 rows should be prevented

Inside the same new route, before inserting:

```
delete from user_districts
where user_id = :userId
and district_id in (:the five County Commission District 1-5 ids)
```

fetched live from `districts` (same pattern as id verification above, or cached from the same query), then insert exactly one new row `{ user_id, district_id: resolvedId, scope: 'county' }`. This exactly mirrors `/onboarding/zip`'s existing delete-then-insert precedent, but scoped only to the five District 1-5 ids — never a blanket delete of all the user's `user_districts` rows (which `/onboarding/zip` does today for its own five-row set, but which must not be reused here since it would also delete At-Large, city, school board, and state rows).

## How At-Large should be preserved

The scoped delete above is the entire preservation mechanism: because the delete clause is `district_id in (<District 1-5 ids only>)`, the At-Large row (`district_id = 11111111-0000-0000-0000-000000000003`) is structurally excluded from every delete this feature performs, in every code path, success or failure. No code in this draft ever references the At-Large id except to explicitly exclude it. The new route must never accept an At-Large id as a valid target for this endpoint's insert.

## How My Current Officials should surface only the one verified commissioner

No change to `src/lib/officials.ts` or `src/components/CurrentOfficialsSection.tsx` is proposed. `getOfficialsForUser` already does `select ... from officials_for_user where user_id = :userId`, and the `officials_for_user` view already joins on exact `district_id` equality against `user_districts`. Once the new route above has written one District 1-5 `user_districts` row for a user, the existing unmodified view and unmodified `getOfficialsForUser` call will automatically surface exactly the one matching `current_officials` row (e.g., Erin Lowry for District 3) the next time `CurrentOfficialsSection` loads — no widening, no special-case logic, exactly as Gate 4 specified and exactly what made the now-disabled B2 approach's special-casing in `officials.ts` unnecessary here.

## What tests are required before any write is allowed

Carried forward from Gate 4/5 and made concrete against the drafted files:

1. **Enum-validation unit test** (new route): `'District 1'`...`'District 5'` accepted; anything else (`'District 6'`, `'At-Large'`, empty, malformed) rejected with no write attempted.
2. **District-id-resolution test**: given each of the five valid enum values, the route resolves to the correct, currently-seeded `districts.id` (`...031` through `...035`); a simulated zero-match or multi-match result causes a fail-closed response with no write.
3. **Integration test** (test account only): full request against the new route with a valid District 3 selection results in exactly one new `user_districts` row (`district_id = ...033`), and `getOfficialsForUser` for that test user subsequently returns Erin Lowry alongside previously existing officials.
4. **Duplicate-prevention test**: same test account, second request selecting District 5 — exactly one County Commission row remains afterward (`...035`, Cathy Townsend), not two.
5. **At-Large-preservation test**: before and after both requests above, the test account's At-Large `user_districts` row is confirmed byte-for-byte unchanged (same row, same `district_id`).
6. **Auth-rejection test**: request with a missing/invalid Bearer token is rejected `401` with no read or write performed, matching `compute-match-scores`'s existing auth-check shape.
7. **Non-regression test**: a test account that never calls the new route continues to see the exact same `My Current Officials` result as before this feature existed (zero County Commissioners).

All tests must run against test accounts and the already-seeded District 1-5 `districts`/`current_officials` rows only — no production user accounts, no new production writes as part of testing.

## Proposed file-by-file change list

| File | Change | Status |
|---|---|---|
| `src/app/profile/page.tsx` | Add one new `SettingsRow` linking to a new "Verify your County Commission district" page | Not implemented — proposed only |
| `src/app/profile/county-commission/page.tsx` (new) | New client page: explain the tool, link out to the Gate 2 URL, closed-set selection UI, calls the new API route, shows success/failure state | Not implemented — proposed only |
| `src/app/api/set-county-commission-district/route.ts` (new) | New POST route: Bearer-token auth, enum validation, live `districts` id resolution, scoped delete-then-insert against `user_districts`, fail-closed error handling | Not implemented — proposed only |
| `src/lib/officials.ts` | **No change proposed** — `getOfficialsForUser` and the `officials_for_user` view already support the display path once a District 1-5 `user_districts` row exists | No change |
| `src/components/CurrentOfficialsSection.tsx` | **No change proposed** — already renders whatever `getOfficialsForUser` returns | No change |
| `src/app/onboarding/zip/page.tsx` | **No change proposed** — this feature is deliberately kept separate from onboarding, per Gate 4 | No change |
| `src/lib/candidates.ts` (`getUserDistrictIds`) | **No change proposed** — unaffected; continues to return whatever rows exist in `user_districts`, including a future District 1-5 row alongside At-Large | No change |
| `districts` table (Supabase data) | **No change proposed** — the five County Commission District 1-5 rows already exist from the prior Gate 6 (county_commission_district_1_5_future_implementation_plan.md) execution | No change |
| `officials_for_user` view (Supabase) | **No change proposed** | No change |

## Proposed test matrix

| Test | Layer | Data touched | Approval needed before running |
|---|---|---|---|
| Enum validation (valid + invalid inputs) | Unit | None | Code-drafting approval only |
| District-id resolution (5 valid + 1 simulated bad match) | Unit/integration (reads `districts`) | `districts` (read-only) | Code-drafting approval only |
| Full-flow integration (District 3 selection → `user_districts` row → officials display) | Integration | `user_districts` (test account write) | Explicit write-testing approval, separate from code-drafting approval |
| Duplicate prevention (District 3 → District 5) | Integration | `user_districts` (test account write) | Explicit write-testing approval |
| At-Large preservation (before/after both writes above) | Integration | `user_districts` (read-only assertion) | Covered by the same write-testing approval as above |
| Auth rejection (missing/invalid token) | Integration | None (request rejected before any read) | Code-drafting approval only |
| Non-regression (untouched test account) | Integration | None (read-only) | Code-drafting approval only |

No row in this matrix has been executed as part of Gate 6. Any test that involves a `user_districts` write requires its own explicit approval, separate from and in addition to approving this draft, per Gate 5's "Approved implementation boundary."

## Not implemented in Gate 6

- No file listed in "Proposed file-by-file change list" has been created or edited.
- No API route exists yet at `src/app/api/set-county-commission-district/route.ts`.
- No page exists yet at `src/app/profile/county-commission/page.tsx`.
- No change was made to `src/app/profile/page.tsx`, `src/lib/officials.ts`, `src/components/CurrentOfficialsSection.tsx`, `src/app/onboarding/zip/page.tsx`, or `src/lib/candidates.ts`.
- No Supabase production write occurred.
- No `user_districts` row was created, for any user, test or production.
- No schema, seed, migration, `districts`, or `officials_for_user` change occurred.
- No deployment occurred.
- No mutation of any kind ran against live data.
- Nothing in this document has been tested, run, or executed — it is a design and code-location proposal only.

## Required approval before implementation

Before any file listed above is created or edited, the following must be explicitly approved, in addition to (not instead of) every item already listed in Gate 5's "Approval checklist":

1. **This draft's file locations and route shape** — specifically, the choice of a new `src/app/profile/county-commission/page.tsx` page and a new `src/app/api/set-county-commission-district/route.ts` route, modeled on the existing `compute-match-scores` route pattern, as the implementation vehicle.
2. **The closed-set-selection UI refinement** — this draft's proposal to have the user select from a fixed five-option enum rather than free-text-parsing the county tool's raw label output, as a deviation from Gate 4's literal free-text-parsing description. If this refinement is not approved, Gate 4's original free-text label-parsing design must be used instead, and that parser's exact accept/reject rules must be separately specified and approved.
3. **Service-role write authorization model** — this draft's proposal to perform the `user_districts` write via `createServiceClient()` gated by a per-request validated user token (mirroring `compute-match-scores`), rather than the plain anon-client RLS-guarded path `/onboarding/zip` uses. Gate 5's "Security/RLS review required" item must be resolved with this specific choice in view, since it is service-role rather than anon-client, even though authorization is still enforced per-request.
4. **Any actual code being written** — this document contains no code; a future Gate 7 (or later) would need to produce and separately have approved an actual diff before it is committed.
5. **Any test execution that performs a `user_districts` write**, even against a test account — per the test matrix above, this requires its own explicit approval distinct from approving the draft itself.
6. **Any production Supabase write of any kind** — remains prohibited absent a separate, explicit, later approval, exactly as Gate 5 already established.

## No-change confirmation

This document is a draft implementation plan and code-location review only. Confirmed no-changes as part of this Gate 6 task:

- No app code was edited or created — `src/` was inspected (read-only) but not modified.
- No Supabase write was performed.
- No `user_districts` row was created.
- No schema was changed.
- No seed file was changed.
- No SQL migration was changed.
- No `districts` row was changed.
- No `officials_for_user` view was changed.
- The St. Lucie County Commission At-Large row (id `11111111-0000-0000-0000-000000000003`) was not renamed, deleted, replaced, or repurposed.
- No deployment occurred.
- No mutation of any kind ran against live data.
- No specific user was assigned, or guessed to belong to, any County Commission District 1-5.
- This document is a draft for a future, separately approved implementation step; nothing in it has been implemented, and no Gate 5 checklist item is approved by the existence of this document.
