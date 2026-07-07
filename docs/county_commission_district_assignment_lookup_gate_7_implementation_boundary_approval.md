# County Commission District 1-5 Assignment Lookup — Gate 7: Implementation Boundary Approval Checklist

Date: July 7, 2026

## Current baseline

Repo HEAD at the start of this task: commit `59189e0` ("Document County Commission district assignment Gate 6 draft").

This document continues directly from `docs/county_commission_district_assignment_lookup_gate_6_draft_implementation.md`. As of this baseline, nothing about app behavior, schema, seeds, migrations, `districts`, `user_districts`, `officials_for_user`, or the St. Lucie County Commission At-Large row has changed since Gate 6. No file under `src/` has been created or edited by this feature at any prior gate.

## Purpose

Gate 5 produced a general approval checklist for the feature as a whole. Gate 6 then inspected the actual codebase and proposed a specific, file-level draft (exact new files, an exact route model, an exact UI shape). Gate 7 exists to get explicit, itemized approval on **that specific draft's implementation boundaries** — the concrete file paths, UI shape, write model, and scope decisions Gate 6 proposed — separately from the general checklist Gate 5 already covers. Approving Gate 5's general items does not itself approve Gate 6's specific choices; this document is where those specific choices are checked off, one at a time.

This is an approval-checklist document. It does not implement anything.

## Gate 7 scope

This document is boundary-approval documentation only:

- Records itemized approval/non-approval of the exact implementation boundaries Gate 6 proposed.
- Does not implement app behavior.
- Does not create or edit `src/app/profile/county-commission/page.tsx`.
- Does not create or edit `src/app/api/set-county-commission-district/route.ts`.
- Does not write to Supabase.
- Does not create production `user_districts` rows.
- Does not change schema, seeds, migrations, `districts`, or `officials_for_user`.
- Does not rename, delete, replace, or repurpose the At-Large row.
- Does not deploy anything.
- Does not run mutations against live data.

## Prior gate summary

- **Gate 1** identified candidate official lookup sources, ruled out the Supervisor of Elections voter lookup (voter-roll matching, deferred pre-beta per `CLAUDE.md`), and recommended the county's ArcGIS "Zone Lookup" / "Who's My Commissioner" tool.
- **Gate 2** manually verified that tool (`https://slc.maps.arcgis.com/apps/instant/lookup/index.html?appid=9afb7523a1854366bed2d7c50ed7428b`), confirmed it is address-only, confirmed it correctly resolves four test addresses to districts matching the seeded `current_officials` names, and demonstrated ZIP-only input is unsafe.
- **Gate 3** selected **Storage Option A**: store a verified District 1-5 assignment as a `user_districts` row, coexisting with the user's existing At-Large row.
- **Gate 4** produced a precise implementation plan covering lookup flow, input requirements, label mapping, district-id verification, write behavior, duplicate prevention, At-Large preservation, display rule, failure handling, logging, RLS, testing, and rollout.
- **Gate 5** created the general, itemized approval checklist (14 items) that must be approved before any implementation begins, plus an approved implementation boundary allowing a future Gate 6 to draft a plan or code (not production writes) if separately approved.
- **Gate 6** inspected the actual codebase (`src/lib/officials.ts`, `src/app/onboarding/zip/page.tsx`, `src/app/onboarding/districts/page.tsx`, `src/lib/candidates.ts`, `src/lib/supabase.ts`, `src/lib/supabase-server.ts`, `src/app/api/compute-match-scores/route.ts`, `src/app/profile/page.tsx`, `src/components/CurrentOfficialsSection.tsx`) and proposed a concrete, file-level draft. It did not implement anything.

This Gate 7 document assumes all six prior gates as given and does not revisit their content except to summarize Gate 6's specific proposal for approval purposes.

## Gate 6 proposed implementation summary

Gate 6's draft, restated here for approval purposes only (see `docs/county_commission_district_assignment_lookup_gate_6_draft_implementation.md` for full detail):

- **New page**: `src/app/profile/county-commission/page.tsx` — an opt-in page reached from a new row in `src/app/profile/page.tsx`'s existing Settings card, not a forced onboarding step. It explains the tool, links out to the Gate 2 verified URL in a new tab, and presents a **closed five-option selection** ("District 1" through "District 5") for the user to self-report the single label the county tool showed them — a refinement over Gate 4's original free-text-parsing design.
- **New API route**: `src/app/api/set-county-commission-district/route.ts` — `POST` only, modeled directly on the existing `src/app/api/compute-match-scores/route.ts` pattern: `Authorization: Bearer <token>` required, `createServiceClient()` + `supabase.auth.getUser(token)` to resolve the authenticated user server-side, enum validation of the submitted selection, live resolution of the corresponding `districts.id` at write time (not hardcoded), a delete-then-insert against `user_districts` scoped only to the five County Commission District 1-5 ids, and fail-closed error handling with no write on any failure path.
- **No change proposed** to `src/lib/officials.ts`, `src/components/CurrentOfficialsSection.tsx`, `src/app/onboarding/zip/page.tsx`, or `src/lib/candidates.ts` — the existing `officials_for_user` view and `getOfficialsForUser` already support the display path once a District 1-5 `user_districts` row exists.
- Gate 6 explicitly flagged three specific choices as needing separate approval beyond Gate 5's general checklist: (1) the exact file/route locations and shape, (2) the closed-set-selection UI refinement versus Gate 4's original free-text parsing, and (3) the service-role write authorization model (write performed via `createServiceClient()` gated by a per-request validated user token, rather than the plain anon-client RLS-guarded path `/onboarding/zip` uses).

## Boundary approval checklist

Each item below must be explicitly approved, item by item, before the corresponding piece of Gate 6's proposal may be implemented. An unchecked item blocks implementation of the behavior it covers.

- [ ] **Create opt-in profile settings page approved** — a new, opt-in page reached from Profile → Settings (not a forced onboarding step) is approved as the entry point for this feature.
- [ ] **Page path approved: `src/app/profile/county-commission/page.tsx`** — this exact file path is approved as the new page's location.
- [ ] **Link-out to official county lookup tool approved** — linking out to the Gate 2 verified URL (`https://slc.maps.arcgis.com/apps/instant/lookup/index.html?appid=9afb7523a1854366bed2d7c50ed7428b`) in a new tab, rather than embedding or scraping it, is approved.
- [ ] **Closed five-option District 1-5 selection UI approved** — presenting the user a fixed enum (`District 1` through `District 5`) to self-report the tool's result, instead of Gate 4's original free-text-parsing design, is approved. (If not approved, Gate 4's free-text parsing design must be used instead, with its own accept/reject rules separately specified and approved.)
- [ ] **User self-attestation after official lookup approved** — it is approved that CivicMarket relies on the user to visit the official tool and truthfully relay the single district it shows them, rather than CivicMarket independently verifying the address-to-district resolution itself.
- [ ] **New API route approved** — creating a new, dedicated API route for this feature (rather than extending an existing route) is approved.
- [ ] **API route path approved: `src/app/api/set-county-commission-district/route.ts`** — this exact file path is approved as the new route's location.
- [ ] **Server-side auth required** — it is approved that the route must require a valid `Authorization: Bearer <token>` and resolve the acting user server-side via `supabase.auth.getUser(token)`, never trusting a client-supplied user id.
- [ ] **Service-role write model approved or deferred** — it is approved (or explicitly deferred pending further review) that the `user_districts` write is performed via `createServiceClient()` gated by a per-request validated user token — mirroring the existing `compute-match-scores` route — rather than the plain anon-client RLS-guarded path `/onboarding/zip` uses.
- [ ] **Live `districts` ID verification approved** — it is approved that the route must resolve the selected district's id by querying the live `districts` table at write time, never a hardcoded id literal.
- [ ] **Delete-then-insert duplicate prevention approved** — it is approved that the route must delete any existing County Commission District 1-5 row for that user before inserting the newly resolved one, guaranteeing at most one such row per user.
- [ ] **Write scope limited to County Commission District 1-5 IDs only approved** — it is approved that the delete step's `district_id in (...)` clause must be scoped only to the five County Commission District 1-5 ids, and must never perform a blanket delete of all of a user's `user_districts` rows.
- [ ] **At-Large preservation approved** — it is approved that the At-Large row (id `11111111-0000-0000-0000-000000000003`) must never be touched, deleted, renamed, replaced, or repurposed by any code path in this feature, and must never alone be treated as evidence for a District 1-5 write.
- [ ] **Current Officials no-code-change path approved** — it is approved that `src/lib/officials.ts`, `getOfficialsForUser`, `src/components/CurrentOfficialsSection.tsx`, and the `officials_for_user` view remain unmodified, relying entirely on the existing exact `district_id` join to surface the one verified commissioner.
- [ ] **Failure handling approved** — it is approved that no `user_districts` row is written on any invalid selection, failed district-id resolution, or write error, and that a failed attempt must never clear a previously successful District 1-5 assignment.
- [ ] **Test plan approved** — the required implementation and manual tests described below are approved as the required minimum before any write path is exercised, even against a test account.
- [ ] **Rollback plan approved** — the rollback plan described below is approved as the required reversal path if the feature needs to be pulled after enabling.

## Items still not approved

Regardless of how many boundary checklist items above are checked, the following remain explicitly **not approved** by this document:

- **No implementation is approved by this document alone.** Checking a boundary item above records agreement with that specific design choice; it does not authorize writing or committing the corresponding code. Actual implementation requires a further, separate go-ahead referencing this document.
- **No production Supabase write is approved by this document alone.**
- **No `user_districts` row creation is approved by this document alone** — not for a production user, and not for a test account, until the "Required manual tests" section below is separately authorized to run.
- **No deployment is approved by this document alone.**

## Security and authorization review

- The proposed route reuses the exact authentication shape already in production for `src/app/api/compute-match-scores/route.ts` (Bearer token, `supabase.auth.getUser(token)` against the service client) — this is a known, already-shipped pattern in this codebase, not a novel one, which lowers (but does not eliminate) review risk.
- Because the write uses `createServiceClient()` rather than the anon RLS-guarded client, **RLS is not the enforcement mechanism for this write** — the route's own token validation and user-id resolution is. This must be explicitly weighed against Gate 5's "Security/RLS review required" item: if a future reviewer determines the anon-client RLS-guarded path (matching `/onboarding/zip`'s pattern exactly) is preferred over the service-role model, that is a valid reason to leave "Service-role write model" unchecked above and request a revised Gate 6 draft.
- No new RLS policy is proposed or assumed required. If the anon-client path is chosen instead of the service-role model, the existing `user_districts` INSERT/DELETE RLS policies (already used by `/onboarding/zip`) would need to be re-confirmed as sufficient for a narrower, scoped delete — this re-confirmation is listed under "Required implementation tests" below, not assumed here.
- The route must validate the submitted selection against the closed five-value enum server-side (not merely client-side), since a client-side-only check can be bypassed by any direct API call.
- The county lookup tool itself is a public, unauthenticated third-party page; no CivicMarket credential or secret is transmitted to it, and no change to CSP or cross-origin configuration is needed under the link-out (not embed) design.
- No new admin or service-role capability is granted to any client-facing role by this proposal — the service-role client is already server-only (`src/lib/supabase-server.ts` is explicitly commented "never import this from a 'use client' file") and this feature does not change that boundary.

## PII/logging review

- The user's raw street address is entered only on the county's own external tool page and is never transmitted to, received by, or stored in any CivicMarket system under this design — the new page only collects a closed-enum district selection, not an address.
- The only user-linked data the new route writes is a `district_id` (a non-sensitive foreign key), associated with the authenticated user's existing `user_id`, in the existing `user_districts` table — no new column, no new address field, no new free-text field is proposed.
- Per Gate 4's carried-forward recommendation, any server-side logging of a lookup attempt should record only a timestamp, the authenticated user id, and an outcome (success/failure/failure-reason) — never the address, since the address is never received by CivicMarket in this design, and never more than the resolved district label needed to debug a specific failure.
- No durable audit table is proposed as part of this boundary approval; server-side application logs are treated as sufficient for a first implementation, consistent with Gate 4. A durable audit table remains available as future, separately approved work if logs prove insufficient.

## Required implementation tests

Before any code implementing this boundary is written, and before that code is exercised against any write path (including a test account), the following must be established and pass:

1. **Enum-validation unit test** — `'District 1'` through `'District 5'` accepted; any other value (including `'District 6'`, `'At-Large'`, empty, malformed, or an id string) rejected with no write attempted.
2. **District-id-resolution test** — each of the five valid enum values resolves to the correct, currently-seeded `districts.id` (`...031` through `...035`); a simulated zero-match or multi-match result causes a fail-closed response with no write.
3. **Auth-rejection test** — a request with a missing or invalid Bearer token is rejected `401` with no read or write performed, matching the existing `compute-match-scores` shape.
4. **RLS/authorization-model confirmation test** — whichever write model is ultimately approved (service-role or anon-client RLS-guarded), a test confirms a user cannot cause a write scoped to any `user_id` other than their own authenticated identity.

## Required manual tests

The following require a **separate, explicit authorization** beyond this document, since they involve a live write against a test account:

1. **Full-flow integration test** — a test account selects "District 3," and the test confirms exactly one new `user_districts` row is created (`district_id` resolving to District 3's live id), and `getOfficialsForUser` for that test user subsequently returns the correct commissioner alongside previously existing officials.
2. **Duplicate-prevention test** — the same test account re-runs the flow selecting "District 5"; the test confirms exactly one County Commission row remains afterward (District 5's id), not two.
3. **At-Large-preservation test** — before and after both writes above, the test account's At-Large `user_districts` row is confirmed byte-for-byte unchanged.
4. **Non-regression test** — a separate test account that never uses this feature continues to show the exact same `My Current Officials` result as before this feature existed (zero County Commissioners).

All manual tests must use test accounts only — never a production user account — and must be explicitly authorized to run before any of them are executed.

## Required rollback plan

If the feature is implemented and later needs to be reversed:

- The new page's entry point (the Profile Settings row) must be removable or hideable without a schema change, so it can be pulled immediately if the lookup tool changes, the parsing/selection proves unreliable, or a security concern is found.
- Disabling the entry point stops new writes but must not delete or alter any `user_districts` rows already written by prior successful uses of the feature — those rows remain valid unless a separate, explicit decision is made to clear them.
- If a specific batch of writes is later found to be incorrect, the rollback is a scoped, reviewed deletion limited to the affected District 1-5 `user_districts` rows only — never the At-Large row, never rows outside the five District 1-5 ids.
- No rollback step may touch `districts`, `officials_for_user`, or the At-Large row.
- The new API route and new page files may be deleted or reverted via normal git history if the feature is abandoned entirely; this does not by itself require any Supabase-side cleanup beyond the scoped deletion described above.

## Recommended Gate 8 next step

If and when every item in the "Boundary approval checklist" section above is explicitly approved, the recommended next step is a Gate 8 document that:

1. Restates which boundary items were approved (verbatim, with approver and date), and records the resolution of "Service-role write model approved or deferred" specifically, since that item may require additional security review before being checked.
2. Produces the actual code for `src/app/profile/county-commission/page.tsx` and `src/app/api/set-county-commission-district/route.ts` as a reviewable diff, not yet merged, deployed, or run against any write path.
3. Separately requests authorization to run the "Required manual tests" above against a test account, with that authorization tracked distinctly from code-review approval.
4. Does not request or assume authorization for any production write, which remains a further, separate approval beyond Gate 8.

## No-change confirmation

This document is boundary-approval-checklist documentation only. Confirmed no-changes as part of this Gate 7 task:

- No app code was edited or created.
- `src/app/profile/county-commission/page.tsx` was not created or edited.
- `src/app/api/set-county-commission-district/route.ts` was not created or edited.
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
- This document is a checklist for a future, separately approved Gate 8+ to work against; nothing in it has been implemented, and no checklist item is approved by the existence of this document — approval must be recorded explicitly and separately.
