# County Commission District 1-5 Assignment Lookup — Gate 5: Approval Checklist

Date: July 7, 2026

## Current baseline

Repo HEAD at the start of this task: commit `dc75b1c` ("Document County Commission district assignment Gate 4 plan").

This document continues directly from `docs/county_commission_district_assignment_lookup_gate_4_implementation_plan.md`. As of this baseline, nothing about app behavior, schema, seeds, migrations, `districts`, `user_districts`, `officials_for_user`, or the St. Lucie County Commission At-Large row has changed since Gate 4.

## Purpose

Produce the explicit, itemized approval checklist that must be reviewed and approved in full before any future implementation of the County Commission District 1-5 assignment lookup begins. This document does not implement anything itself — it is the gate that a future Gate 6 must pass through.

## Gate 5 scope

This document is approval-checklist documentation only:

- Records the itemized checklist items that require explicit approval before implementation.
- Does not write any code.
- Does not write to Supabase.
- Does not create `user_districts` rows.
- Does not change schema, seeds, migrations, `districts`, or `officials_for_user`.
- Does not rename, delete, replace, or repurpose the At-Large row.

## Prior gate summary

- **Gate 1** identified candidate official lookup sources, ruled out the Supervisor of Elections voter lookup (voter-roll matching, deferred pre-beta per `CLAUDE.md`), and recommended the county's ArcGIS "Zone Lookup" / "Who's My Commissioner" tool for manual verification.
- **Gate 2** manually verified that tool (`https://slc.maps.arcgis.com/apps/instant/lookup/index.html?appid=9afb7523a1854366bed2d7c50ed7428b`), confirmed it is address-only (no identity fields), confirmed it correctly resolves four test addresses to districts matching the seeded `current_officials` names, and demonstrated that ZIP-only input is unsafe (a ZIP can span a district boundary seam without warning).
- **Gate 3** selected **Storage Option A**: after a verified address-level lookup, store the user's District 1-5 assignment as a `user_districts` row, coexisting with (not replacing) the user's existing At-Large row. Option B (runtime derivation without a `user_districts` write) was deferred, not ruled out permanently.
- **Gate 4** produced a precise, line-by-line implementation plan covering the lookup flow, required input, district label mapping, required district IDs, `user_districts` write behavior, duplicate prevention, At-Large preservation, Current Officials display rule, failure handling, audit/logging, security/RLS considerations, testing plan, rollout plan, risks, and deferred work.

This Gate 5 document assumes all four prior decisions as given and does not revisit them. It exists solely to turn Gate 4's plan into a formal, checkable approval record.

## Approval checklist

Each item below must be explicitly approved, item by item, before any future implementation begins. An unchecked item blocks implementation of the behavior it covers.

- [ ] **Source URL approved** — the exact lookup tool URL (`https://slc.maps.arcgis.com/apps/instant/lookup/index.html?appid=9afb7523a1854366bed2d7c50ed7428b`) verified in Gate 2, or a future equivalent verified with the same rigor, is approved as the required lookup source.
- [ ] **Address-level input requirement approved** — a full street address (street number + street name, with city/ZIP overridable for non-PSL St. Lucie County addresses) is approved as the required user input for a valid lookup.
- [ ] **ZIP-only assignment prohibited** — it is approved that a ZIP code alone must never be sufficient to create or infer a District 1-5 `user_districts` row, per the Gate 2 boundary-seam finding for ZIP `34987`.
- [ ] **District label mapping approved** — exact-match-only parsing of the tool's returned label to exactly one of `District 1` through `District 5` is approved; no inference, partial match, or best-guess assignment is permitted.
- [ ] **Existing District 1-5 IDs must be verified before write** — it is approved that the implementation must query the live `districts` table at write time to resolve the correct district id for a matched label, rather than hardcoding the five ids as literals.
- [ ] **`user_districts` write behavior approved** — a single insert per verified user, storing only the resolved `district_id` (never the raw address), through the existing authenticated-user, RLS-guarded write path (not a service-role bypass), is approved.
- [ ] **Duplicate handling approved** — a delete-then-insert sequence scoped only to the five County Commission District 1-5 ids, guaranteeing at most one such `user_districts` row per user, is approved.
- [ ] **At-Large preservation approved** — it is approved that the At-Large row (id `11111111-0000-0000-0000-000000000003`) must never be deleted, renamed, replaced, or repurposed by this feature, and must never alone be used as evidence for a District 1-5 write.
- [ ] **Current Officials display rule approved** — it is approved that `officials_for_user` and `getOfficialsForUser` remain unmodified, so that a verified user sees exactly one County Commissioner and an unverified user continues to see zero, with no broad all-five-commissioner display reintroduced.
- [ ] **Failure handling approved** — it is approved that no `user_districts` row is written on any failed, ambiguous, or unrecognized lookup outcome, and that a failed re-verification attempt must never clear a previously successful one.
- [ ] **PII/logging limitation approved** — it is approved that raw street addresses are not persisted beyond what is needed to debug a specific failure, and that any logged data is limited to timestamp and outcome (success/failure/failure-reason) associated with the authenticated user.
- [ ] **Security/RLS review required** — it is approved that the write path must reuse existing `user_districts` INSERT/DELETE RLS policies, and that any gap found insufficient during implementation must be raised explicitly for separate approval rather than worked around silently.
- [ ] **Test plan approved** — the unit, integration, duplicate-prevention, At-Large-preservation, failure-path, and non-regression tests described in Gate 4, using only test accounts and public/government test addresses, are approved as the required minimum test coverage.
- [ ] **Rollout plan approved** — internal/admin test accounts first, then general beta users, with no migration or backfill required and an easily reversible UI entry point, is approved as the required rollout sequencing.

## Approved implementation boundary

If and only if every item in the checklist above is explicitly approved, a future Gate 6 may:

- Create a limited implementation plan refining Gate 4's design into concrete file-level and function-level detail, or
- Draft code (not yet merged or run against production) implementing the approved behavior,

but only if separately approved at that time. Gate 6 must not write any production `user_districts` rows, and must not be treated as authorization to deploy or run the feature against real users, without an explicit, later, separate approval beyond this checklist.

## Items not approved

The following remain explicitly not approved by this document, regardless of any checklist item above being checked:

- No production Supabase writes.
- No live user district assignment changes.
- No schema changes.
- No deleting existing districts.
- No changing the At-Large row.
- No broad all-five-commissioner display.
- No SOE voter lookup.
- No ZIP-only assignment.

## Required validation before future implementation

Before Gate 6 implementation work begins, the following must be separately confirmed, not assumed from this document:

- The Gate 2 lookup tool is still live, still address-only, and still returns the same label format observed in Gate 2.
- The five `districts` rows for County Commission District 1-5 still exist with the same ids and names recorded in Gate 4.
- The `user_districts` table's existing INSERT/DELETE RLS policies are re-read directly from Supabase (not assumed from memory) to confirm they still cover this write pattern.
- Whether `user_districts` has a `created_at`-style column usable for the audit recommendation in Gate 4 is confirmed against the live schema.

## Required test cases for future implementation

Carried forward from Gate 4, restated here as the binding minimum for Gate 6 and beyond:

1. Label-parsing unit tests: known-good inputs (`District 1` through `District 5` in the exact observed format) accepted; known-bad inputs (empty, multiple districts, unrelated text, an At-Large-style label) rejected.
2. Integration test: a test user completes the full flow against a known public test address (reusing a Gate 2 verified address) and receives exactly one new `user_districts` row with the correct `district_id`; `My Current Officials` then shows exactly the expected commissioner alongside previously existing officials.
3. Duplicate-prevention test: the same test user re-runs the flow with a second address resolving to a different district; the first District 1-5 row is replaced, not duplicated — exactly one County Commission row remains.
4. At-Large-preservation test: before and after both runs above, the test user's At-Large row is confirmed unchanged (same row, same `district_id`).
5. Failure-path test: a ZIP-only input, an ambiguous/unrecognized tool response, and a simulated write failure each result in no `user_districts` row created or altered, and the manual-verification fallback message appears.
6. Non-regression test: a user who never runs this flow sees the exact same `My Current Officials` result as before this feature existed.

All test cases must use test accounts and public/government test addresses only — no private user addresses.

## Rollback plan for future implementation

If the feature is enabled and later needs to be reversed:

- The UI entry point (a profile-settings action) must be removable or hideable without a schema change, so it can be pulled immediately if the lookup tool or parsing proves unreliable in production.
- Disabling the entry point stops new writes but must not delete or alter any `user_districts` rows already written by prior successful verifications — those rows remain valid unless a separate, explicit decision is made to clear them.
- If a specific batch of writes is later found to be incorrect (e.g., due to a label-format drift bug), the rollback is a scoped, reviewed deletion of only the affected District 1-5 `user_districts` rows (never the At-Large row, never rows outside the five District 1-5 ids), following the same care and review standard used for the original write.
- No rollback step may touch `districts`, `officials_for_user`, or the At-Large row.

## Hard stops

The following must never happen at any point in a future implementation, with no exception path:

- Using the Supervisor of Elections voter lookup tool or any other voter-roll-matching source for this feature.
- Assigning a District 1-5 `user_districts` row from ZIP code alone.
- Assigning a District 1-5 `user_districts` row without a fresh, successful, address-level lookup for that specific user.
- Deleting, renaming, replacing, or repurposing the At-Large row.
- Reintroducing a broad display rule that shows a user all five County Commissioners based on At-Large membership alone.
- Persisting a user's raw street address in `user_districts` or any other durable table as part of this feature.
- Performing a production Supabase write under this feature without the explicit, separate approval described in "Approved implementation boundary."

## Deferred work

The following remain deferred, unstarted, and out of scope for Gate 5 and any Gate 6 that stays within the "Approved implementation boundary" above:

- Any actual UI, API route, or database code beyond a Gate-6-approved draft.
- The specific decision on manual link-out vs. embedded/automated capture of the tool's output (Gate 4 left this open for Gate 5+; it remains open here and should be decided explicitly at Gate 6).
- Investigation of a programmatic/server-side query against the county's underlying ArcGIS feature layer.
- A redistricting/staleness re-verification prompt design.
- A durable audit-table design, if the Gate 4 logging recommendation is judged insufficient.
- Any production Supabase write, including a first pilot write for a single test account, which requires its own separate explicit approval beyond this checklist.

## Recommended Gate 6 next step

If and when every item in the "Approval checklist" section above receives explicit approval, the recommended next step is a Gate 6 document that:

1. Restates which checklist items were approved (verbatim, with approver and date).
2. Produces a concrete, file-level implementation plan or code draft (not yet run against production) implementing only the approved behavior.
3. Explicitly re-confirms it is not authorized to perform any production Supabase write, pending a further separate approval for that specific action.

## No-change confirmation

This document is approval-checklist documentation only. Confirmed no-changes as part of this Gate 5 task:

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
- This document is a checklist for a future, separately approved Gate 6+ to work against; nothing in it has been implemented, and no checklist item is approved by the mere existence of this document — approval must be recorded explicitly and separately.
