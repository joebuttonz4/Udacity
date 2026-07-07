# County Commission District 1-5 Assignment Lookup — Gate 3: Storage Decision

Date: July 7, 2026

## Current baseline

Repo HEAD at the start of this task: commit `e04e4de` ("Document County Commission district assignment lookup Gate 2").

This document continues directly from `docs/county_commission_district_assignment_lookup_gate_2.md`. As of this baseline, nothing about app behavior, schema, seeds, migrations, `districts`, `user_districts`, `officials_for_user`, or the St. Lucie County Commission At-Large row has changed since Gate 2. Gate 2 confirmed a working, address-only, official lookup tool (the county's ArcGIS "Who's My Commissioner" / "Zone Lookup" tool) and left the Storage Option A vs. Option B comparison open for this Gate 3.

## Purpose

Decide, and document, which storage model CivicMarket will use — once a future, separately approved implementation gate exists — for persisting a user's verified St. Lucie County Commission District (1-5) assignment, so that `My Current Officials` can eventually show that user exactly one County Commissioner instead of zero (the current state) or all five (the disabled B2 state).

This is a Gate 3 documentation task. It records the storage decision and the guardrails any future implementation gate must follow. It does not authorize, draft, or schedule implementation itself.

**Product rule this work exists to satisfy:** CivicMarket is personal-action-first. My Current Officials should show only officials tied to the user's own voting or representation district.

## Hard stops

This document does not do any of the following, and no future work should treat it as having done so:

- Does not implement app behavior.
- Does not write to Supabase.
- Does not create `user_districts` rows.
- Does not change schema.
- Does not change seed files.
- Does not change SQL migrations.
- Does not change `districts`.
- Does not change `officials_for_user`.
- Does not rename, delete, replace, or repurpose the St. Lucie County Commission At-Large row (id `11111111-0000-0000-0000-000000000003`).
- Does not guess a user's County Commission District 1-5. No specific user is assigned a district anywhere in this document.

## Gate 3 decision

**Storage Option A is selected.**

After a verified official address lookup, CivicMarket will store the user's specific St. Lucie County Commission District 1-5 assignment as a `user_districts` row — in addition to, not instead of, the user's existing St. Lucie County Commission At-Large row.

This decision is documented only. No `user_districts` row will be created, no schema will change, and no implementation will begin as part of this Gate 3 task. A future, separately approved Gate 4 is required before any code or SQL is written.

## Why Option A was selected

- **Reuses the existing personalization model without new special-case code.** `officials_for_user` already joins `user_districts.district_id = current_officials.district_id`. A District 1-5 `user_districts` row would surface the correct single commissioner through the existing view, with no widening logic added to `src/lib/officials.ts` — unlike the disabled B2 approach, which required two hardcoded id lists (`COUNTY_COMMISSION_DISTRICT_1_5_IDS` and a name lookup) to keep in sync in application code.
- **Avoids repeating GIS lookup work on every page load.** A stored assignment is computed once, at the moment it is verified, rather than re-derived from an external, county-operated ArcGIS tool on every read. Gate 2 confirmed that tool is a client-rendered map app with no documented public REST API, so a runtime-derivation approach (Option B) would either need its own caching/staleness layer or would call out to third-party infrastructure on a request path CivicMarket does not control.
- **Creates an auditable district assignment trail.** A `user_districts` row records, in the same table and shape as every other district assignment in the app (ZIP-derived districts, At-Large), when and to what a user's County Commission district was set. This is consistent with how the rest of onboarding already treats `user_districts` as the single source of truth for "which districts does this user belong to."
- **Consistent with existing precedent.** This is the same storage shape already used for every other district relationship in the app (city, school board, state, At-Large). Extending it to District 1-5 keeps one consistent mental model instead of introducing a second, address-derived personalization path alongside it.

## Why Option B was deferred

Storage Option B (deriving the district at runtime from a stored address, without writing to `user_districts`) was not chosen, for reasons already flagged as open risks in Gate 1 and Gate 2:

- It still requires storing an address somewhere (e.g., a new `profiles` column) — this is itself a schema change, just moved to a different table, not avoided.
- It either re-runs district resolution against the county's ArcGIS tool on every read (slow, and dependent on third-party infrastructure being available at request time) or requires its own separate cache/staleness strategy — effectively re-solving what `user_districts` already solves, without inheriting `officials_for_user`'s existing join for free.
- It concentrates special-case logic in `src/lib/officials.ts`, which is the same tradeoff already tried once with the now-disabled B2 approach and already identified there as a real cost.

Option B is not ruled out permanently. It remains available for reconsideration if a future need arises (for example, if address storage itself becomes undesirable for privacy reasons). This Gate 3 document selects Option A as the current path forward, not as an irreversible architectural commitment.

## Required lookup source

Any future implementation must use the source verified in Gate 2:

- **Tool:** "Who's My Commissioner" / "Zone Lookup," operated by St. Lucie County.
- **URL:** `https://slc.maps.arcgis.com/apps/instant/lookup/index.html?appid=9afb7523a1854366bed2d7c50ed7428b`
- Confirmed in Gate 2 to be the same tool reached from the official `stlucieco.gov` "Who's My Commissioner" page.
- No other source (including the Supervisor of Elections voter lookup) may be used. See "Hard stops" and "Required validation before write" below.

## Required user input

- **Minimum required input:** a full residential street address (street number + street name; city/state/ZIP may be inferred as Port St. Lucie, FL, consistent with current beta scope).
- **Not required and must not be collected for this purpose:** legal name, date of birth, voter registration number, or any other identity/voter-roll field.
- **Insufficient input:** a ZIP code alone. Gate 2 demonstrated a concrete failure mode — ZIP `34987` returned a single confident district answer despite its boundary visibly spanning two districts near the seam. A future implementation must require a full street address and must not accept ZIP-only input as sufficient for a District 1-5 write.

## Required validation before write

Before any future implementation writes a District 1-5 `user_districts` row for a real user, all of the following must hold:

- The address was resolved through the Gate 2 verified tool (or an approved official equivalent re-verified with the same rigor), not through any other source.
- The resolution used the tool's own address-locator match (Gate 2's "SLC Address Locator" result), not a ZIP-only or generic geocoding fallback match.
- The resolved result maps to exactly one of the five existing District 1-5 `districts` ids (`...031` through `...035`).
- The user explicitly provided the address themselves (e.g., via an onboarding or profile step) — no address may be inferred, guessed, or backfilled from any other data source.
- The write does not remove, replace, or modify the user's existing At-Large `user_districts` row.

## Exact write boundary for future Gate 4

This is a boundary for what a future Gate 4 may propose — it is not authorization to build it now. If and when a future, separately approved Gate 4 implements this:

- The only new write is an **insert** of one `user_districts` row per user, with `district_id` set to the resolved District 1-5 id (one of `...031` through `...035`) and the user's existing `user_id`.
- No existing `user_districts` row (including the At-Large row) may be updated or deleted as part of this write.
- No `districts`, `current_officials`, or `officials_for_user` changes are in scope for this write.
- No schema change is anticipated for this write itself — it uses the existing `user_districts` table shape. Any address-storage need (if the UI wants to remember what address was entered) is a separate, additional schema decision not authorized by this document.
- The write must go through the same RLS-guarded, authenticated-user path as other `user_districts` inserts (e.g., the existing ZIP-onboarding delete-then-insert pattern in `/onboarding/zip`), not a service-role bypass.

## Current Officials behavior goal

Once a future implementation completes:

- A user with a verified District 1-5 `user_districts` row should see exactly one County Commissioner in My Current Officials — the one matching their resolved district — through the existing, unmodified `officials_for_user` view join.
- A user without a verified District 1-5 `user_districts` row (including a user who only holds the At-Large row) must continue to see zero County Commissioners, exactly as today.
- At no point should a user see more than one County Commissioner. The prior B2 behavior (all five shown to any At-Large holder) must not be reintroduced.

## Hard stops

(Repeated here for emphasis, matching the guardrails supplied for this task.)

- District 1-5 may only be stored after a verified address-level lookup through the official county ArcGIS Zone Lookup source (or an approved official equivalent) — never from a ZIP-only result.
- The Supervisor of Elections voter lookup must not be used pre-beta, because it requires voter-roll matching, which `CLAUDE.md` places on the pre-beta do-not-build list.
- A District 1-5 `user_districts` row must not be created from At-Large membership alone. At-Large membership is not evidence of which District 1-5 seat a user belongs to.
- The At-Large row must remain unchanged and may continue serving countywide election/onboarding context.
- Future app behavior must avoid showing all five commissioners in My Current Officials to any user.
- Future app behavior should show only the one commissioner tied to a user's verified District 1-5 row.

## Risks

1. **New PII risk (carried over from Gate 1/2, unchanged).** A street address is more sensitive than a ZIP code. Even though Option A does not require a new address-storage column (the resolved district id is what gets written, not the raw address), the onboarding/profile UI step that collects the address will handle that address in transit, and should not log or persist it anywhere beyond what is explicitly designed and approved in a future gate.
2. **Redistricting/staleness risk (carried over, unchanged).** A stored `user_districts` row does not know it has gone stale if the user moves or if county district boundaries are redrawn. A future implementation gate must include a staleness/re-verification plan; this document does not design one.
3. **Onboarding scope-creep risk (carried over, unchanged).** `CLAUDE.md`'s current priority is auditing and stabilizing existing Week 3 onboarding work before building more screens. Any future address-collection UI work is a distinct, separately scoped and approved unit of work, not bundled into this or any other in-flight task.
4. **Tool dependency risk (carried over from Gate 2, unchanged).** The verified lookup tool is hosted on county-operated ArcGIS infrastructure outside CivicMarket's control. Its URL, availability, and behavior could change without notice; a future implementation gate should decide how to handle that (e.g., manual link-out vs. a to-be-investigated programmatic query) before building.
5. **Coexistence-with-At-Large ambiguity, now resolved by this document.** Gate 1 flagged as an open question what happens to the At-Large row alongside a new District-specific row for the same user. This Gate 3 document resolves that: both rows coexist. The At-Large row is never removed or altered by a District 1-5 write.

## Validation checklist

- [x] A verified, address-only official lookup source exists (Gate 2).
- [x] Storage Option A vs. Option B has been explicitly decided (this document: Option A selected).
- [ ] A future Gate 4 has drafted the specific onboarding/profile UI change needed to collect an address, with its own scoping and approval.
- [ ] A future Gate 4 has drafted the exact `user_districts` insert logic and RLS-compatible write path.
- [ ] A redistricting/staleness handling plan has been designed and approved.
- [ ] A PII/privacy review of the address-collection step has been completed and approved.
- [ ] No District 1-5 `user_districts` row exists yet for any real user (must remain true until a future Gate 4+ executes an approved write).

## Deferred work

The following remain explicitly out of scope for this Gate 3 document and remain unstarted:

- Any onboarding or profile UI change to collect a user's address.
- Any SQL draft or Supabase write of a District 1-5 `user_districts` row.
- Any change to `src/lib/officials.ts`, `officials_for_user`, `districts`, or `current_officials`.
- A redistricting/staleness handling design.
- A PII/privacy/RLS review of the address-collection step.
- A decision on whether a future implementation performs a manual link-out to the county tool versus a programmatic/server-side lookup against it (Gate 2, Risk 2).

## Recommended Gate 4 implementation plan

Recommended, for a future, separately approved Gate 4 to draft (not to execute as part of this document):

1. Scope a minimal address-collection step (onboarding addition or profile-settings addition — to be decided at Gate 4, consistent with the `CLAUDE.md` onboarding-stabilization priority) that collects a street address and nothing else (no name, DOB, or voter ID fields).
2. Scope how the address is resolved to a district: either a manual step where the user is linked to the Gate 2 verified tool and self-reports/confirms the returned district, or a to-be-investigated programmatic lookup against the tool's underlying ArcGIS layer (requires its own separate technical/terms-of-use investigation, per Gate 2 Risk 2).
3. Draft the exact `user_districts` insert (one row, `district_id` = resolved District 1-5 id, existing authenticated-user RLS path, no deletion or modification of the existing At-Large row).
4. Draft a staleness/re-verification approach (e.g., prompting re-confirmation if the user's address is later edited, or a manual "update my district" profile action).
5. Route the full Gate 4 draft through the same approval pattern used for the County Commission Current Officials B2 sequence (Gates A-H) and the Path 1 personalization fix: explicit source/UX draft, explicit SQL/code draft, explicit approval, then execution, then verification — each as its own gate.

## No-change confirmation

This document is documentation-only. Confirmed no-changes as part of this Gate 3 task:

- No app code was edited.
- No Supabase write was performed.
- No `user_districts` row was created.
- No schema was changed.
- No seed file was changed.
- No SQL migration was changed.
- No `districts` row was changed.
- No `officials_for_user` view was changed.
- The St. Lucie County Commission At-Large row (id `11111111-0000-0000-0000-000000000003`) was not renamed, deleted, replaced, or repurposed.
- No specific user was assigned, or guessed to belong to, any County Commission District 1-5.
- Storage Option A was selected as a documented future model only; no implementation of it has begun.
