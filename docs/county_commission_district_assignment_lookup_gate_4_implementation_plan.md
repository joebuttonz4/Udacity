# County Commission District 1-5 Assignment Lookup — Gate 4: Implementation Plan

Date: July 7, 2026

## Current baseline

Repo HEAD at the start of this task: commit `01c8ca1` ("Document County Commission district assignment storage decision").

This document continues directly from `docs/county_commission_district_assignment_lookup_gate_3_storage_decision.md`. As of this baseline, nothing about app behavior, schema, seeds, migrations, `districts`, `user_districts`, `officials_for_user`, or the St. Lucie County Commission At-Large row has changed since Gate 3.

## Purpose

Produce a precise, reviewable implementation plan for storing a user's verified St. Lucie County Commission District (1-5) assignment and using it in `My Current Officials`, so that a future Gate 5 has a concrete, specific plan to approve or reject — rather than the general storage-model decision Gate 3 recorded.

This is a Gate 4 planning document. It describes what a future implementation would do, in enough detail to be approved or rejected line by line. It does not perform that implementation.

## Prior gate decisions

- **Gate 1** identified three candidate official lookup sources, ruled out the Supervisor of Elections voter lookup (voter-roll matching, deferred pre-beta per `CLAUDE.md`), and recommended the county's ArcGIS "Zone Lookup" / "Who's My Commissioner" tool for manual verification.
- **Gate 2** manually verified that tool (`https://slc.maps.arcgis.com/apps/instant/lookup/index.html?appid=9afb7523a1854366bed2d7c50ed7428b`), confirmed it is address-only (no identity fields), confirmed it correctly resolves four test addresses to districts matching the seeded `current_officials` rows, and demonstrated that ZIP-only input is unsafe (a ZIP can span a district boundary seam without warning).
- **Gate 3** selected **Storage Option A**: after a verified address-level lookup, store the user's District 1-5 assignment as a `user_districts` row, coexisting with (not replacing) the user's existing At-Large row. Option B (runtime derivation without a `user_districts` write) was deferred, not ruled out.

This Gate 4 document assumes all three prior decisions as given and does not revisit them.

## Gate 4 scope

This document is implementation **planning** only:

- Describes the future lookup flow, write behavior, duplicate handling, failure handling, display rule, and test/rollout plan in specific, approvable detail.
- Does not write any code.
- Does not write to Supabase.
- Does not create `user_districts` rows.
- Does not change schema, seeds, migrations, `districts`, or `officials_for_user`.
- Does not rename, delete, replace, or repurpose the At-Large row.

## Non-goals

The following are explicitly not addressed by this plan and are not implied to be in scope for the eventual implementation unless separately approved:

- Building a server-side/programmatic query against the county's ArcGIS feature layer (Gate 2, Risk 2, remains an open, separate technical/terms-of-use investigation).
- Collecting or storing a user's raw street address as a persistent field (this plan's write is the resolved district id only, not the address itself — see "Future `user_districts` write behavior").
- Any onboarding-flow redesign beyond the single new step described here.
- Handling redistricting at the boundary-data level (i.e., updating `districts` rows if the county redraws lines) — that is a separate, future data-maintenance task, not an app-behavior task.
- Any change to how At-Large is used for ballot grouping or onboarding today.

## Future implementation overview

At a high level, a future implementation (subject to Gate 5 approval) would:

1. Offer a user an explicit, opt-in step (profile-settings action, not a forced onboarding gate) to verify their County Commission district by address.
2. Direct the user to the Gate 2 verified county lookup tool, or embed/link to it, and capture the single district label it returns for the address the user confirms is theirs.
3. Validate that the returned label cleanly matches exactly one of "District 1" through "District 5."
4. Resolve that label to the corresponding existing `districts` row id (verified against the live table at write time, not hardcoded from memory).
5. Write exactly one `user_districts` row for that user and that district id, replacing any prior District 1-5 assignment for that user (but never touching the At-Large row).
6. Rely on the existing, unmodified `officials_for_user` view to surface the one matching commissioner going forward.

## Required official lookup source

- **Tool:** the St. Lucie County ArcGIS "Who's My Commissioner" / "Zone Lookup" tool verified in Gate 2.
- **URL:** `https://slc.maps.arcgis.com/apps/instant/lookup/index.html?appid=9afb7523a1854366bed2d7c50ed7428b`
- A separately approved official equivalent may be substituted only if it undergoes the same rigor of verification Gate 2 applied (address-only input confirmed, no identity/voter-roll fields, results cross-checked against seeded `current_officials` names). No such equivalent is proposed or assumed by this document.
- The Supervisor of Elections voter lookup tool must never be used for this purpose, per the Gate 1 finding and `CLAUDE.md`'s pre-beta restriction on voter roll matching.

## Required user input

- **Required:** a full street address (street number + street name; city/state/ZIP may default to Port St. Lucie, FL given current beta scope, but the user must be able to override city/ZIP for the small number of St. Lucie County addresses outside PSL city limits, consistent with Gate 2's Fort Pierce test).
- **Not required and must not be collected for this purpose:** legal name, date of birth, voter registration number, CAPTCHA-gated identity fields, or any other identity/voter-roll input.
- **Explicitly insufficient:** a ZIP code alone. The implementation must not offer a ZIP-only path as satisfying the District 1-5 lookup requirement, per the concrete boundary-seam failure Gate 2 demonstrated for ZIP `34987`.

## District label mapping

The lookup tool returns a plain-text label of the form `"District N — The Commissioner for District N is <name>."` (per Gate 2's observed results). The implementation must:

- Accept a returned label **only** if it cleanly parses to exactly one of: `District 1`, `District 2`, `District 3`, `District 4`, `District 5`.
- Treat any other output — no match, multiple matches, an unrecognized format, an "At-Large" or countywide label, or any label the parser cannot confidently normalize to one of the five — as a failed lookup (see "Failure handling" below), not as a best-guess assignment.
- Never infer a district from partial information (e.g., "probably District 3 because it's near the coast"). The mapping step is exact-match only.
- Not attempt to parse or trust the commissioner's name as the source of truth for the district number — the numeric district label is the field that must match, since names can go stale between elections while the plan should remain valid.

## Required district IDs

- The five existing seeded rows: St. Lucie County Commission District 1 through District 5 (`districts` ids `11111111-0000-0000-0000-000000000031` through `...035`), inserted per the Gate 6 execution referenced in `docs/county_commission_district_1_5_future_implementation_plan.md`.
- The future implementation must **verify these ids by querying the `districts` table at write time** (e.g., `select id from districts where name = 'St. Lucie County Commission District 3'` or equivalent), not hardcode the five ids as literals copied from this document. This avoids silently writing a stale or wrong id if `districts` is ever corrected or re-seeded.
- If the query for a resolved district label returns zero or more than one matching `districts` row, treat it as a failed lookup (see "Failure handling") — do not write.

## Future `user_districts` write behavior

- After a label is cleanly mapped to exactly one verified `districts` id (see above), the implementation inserts or upserts exactly **one** `user_districts` row: `{ user_id: <current authenticated user>, district_id: <resolved District 1-5 id> }`.
- The write stores only the resolved `district_id` — it does not persist the raw street address the user typed anywhere in `user_districts` or elsewhere, unless a future, separately approved plan explicitly adds that (see "Non-goals").
- The write must go through the same authenticated-user, RLS-guarded path already used for other `user_districts` writes (e.g., the existing `/onboarding/zip` delete-then-insert pattern), not a service-role bypass.
- The write is additive with respect to the user's other district rows: it must not touch the At-Large row or any city/school-board/state row the user already has.

## Duplicate prevention

- Before inserting, the implementation must delete any existing `user_districts` row for that user whose `district_id` is one of the five County Commission District 1-5 ids, then insert the newly resolved one — mirroring the existing delete-then-insert pattern used in `/onboarding/zip` (chosen there specifically because `user_districts` intentionally has no UPDATE RLS policy, so `upsert`/`ON CONFLICT DO UPDATE` silently fails).
- This guarantees a user has at most one County Commission District 1-5 `user_districts` row at any time, even after multiple re-verifications (e.g., the user moves and re-runs the lookup).
- The delete step must be scoped narrowly (only rows matching the five District 1-5 ids for that user), so it never deletes the user's At-Large row, which has a different `district_id`.
- If the delete-then-insert sequence fails partway (delete succeeds, insert fails), the implementation must treat this as a failed write and prompt the user to retry rather than leaving them with zero County Commission rows silently — this should be handled inside a single request/transaction boundary where the underlying Supabase client supports it, or with an explicit re-check-and-retry step if it does not.

## At-Large preservation rule

- The St. Lucie County Commission At-Large row (id `11111111-0000-0000-0000-000000000003`) must never be deleted, renamed, replaced, or repurposed by this feature, at any step.
- At-Large membership must never be used, alone, as sufficient evidence to create or infer a District 1-5 `user_districts` row. Only a freshly verified address-level lookup may create that row.
- At-Large may continue to exist alongside a user's new District 1-5 row indefinitely, and continues to serve its existing countywide election/onboarding purposes unchanged.

## Current Officials display rule

- `officials_for_user` and `getOfficialsForUser` are not modified by this plan. The existing `officials_for_user` view already joins `user_districts.district_id = current_officials.district_id`, so once a user has a verified District 1-5 `user_districts` row, exactly one County Commissioner will appear in their results automatically, with no widening or special-case logic added to `src/lib/officials.ts` (unlike the disabled B2 approach).
- A user without a verified District 1-5 `user_districts` row (including one who only holds the At-Large row) must continue to see zero County Commissioners, exactly as today.
- At no point in this design can a user see more than one County Commissioner, because duplicate prevention (above) guarantees at most one District 1-5 row per user.

## Failure handling

If any of the following occurs, the implementation must **not** write a `user_districts` row, and must show the user a message indicating manual verification is needed (e.g., "We couldn't confirm your County Commission district automatically — you can look it up directly at [verified tool link]"):

- The lookup tool returns no result for the entered address.
- The lookup tool returns a result that is not a clean, single "District N" match (ambiguous, multiple matches, unrecognized format, or a non-County-Commission result).
- The resolved label does not have a corresponding single matching row in `districts` at write time.
- The write itself fails (network/Supabase error) after a successful lookup.
- The user only provides a ZIP code and no street address — this must be blocked at the input step, before any lookup attempt, not surfaced as a lookup failure after the fact.

In all failure cases, any existing District 1-5 `user_districts` row the user already had must be left untouched — a failed re-verification attempt must never clear a previously successful one.

## Audit/logging recommendation

- Record, at minimum, a timestamp and outcome (success/failure/failure-reason) for each lookup attempt, associated with the authenticated user, in server-side application logs (not a new user-facing database table, unless a future gate decides a durable audit table is needed).
- Do not log the raw street address the user entered in a way that persists longer than needed to debug a specific failure — this is PII, and Gate 3 already flagged street addresses as more sensitive than ZIP codes.
- On successful write, the `user_districts` row itself (with its default `created_at`-style timestamp if the table has one, to be confirmed at Gate 5) serves as the durable record of when and to what a user's district was set — a separate audit table is not proposed as required for a first implementation, only as a possible future enhancement.

## Security/RLS considerations

- The write path must use the existing authenticated-user Supabase client (matching the `/onboarding/zip` pattern), not a service-role client, so RLS continues to enforce that a user can only write their own `user_districts` rows.
- No new RLS policy is anticipated to be required, since this reuses the existing `user_districts` INSERT/DELETE policies already in place for onboarding. If a future Gate 5 code draft finds an existing policy insufficient (e.g., scoped too narrowly to ZIP-onboarding-specific logic), that gap must be raised explicitly at Gate 5, not silently worked around.
- The lookup step itself (calling out to the county's ArcGIS tool) involves no CivicMarket-held credentials and no server secret exposure risk, since it is a public, unauthenticated county tool.
- If a future implementation ever embeds the tool in an iframe or calls it client-side, standard content-security-policy and cross-origin considerations for embedding third-party county infrastructure must be reviewed at Gate 5 — not assumed safe here.

## Testing plan

- **Unit-level:** label-parsing logic tested against known good inputs (`"District 1"` through `"District 5"` in the exact observed format) and known bad inputs (empty, multiple districts, unrelated text, an At-Large-style label) to confirm only clean single-district matches pass.
- **Integration-level:** a test user account exercises the full flow against a known public test address (e.g., reusing one of Gate 2's four verified addresses) and confirms exactly one new `user_districts` row is created with the correct `district_id`, and that `My Current Officials` then shows exactly the expected commissioner alongside previously existing officials.
- **Duplicate-prevention test:** the same test user re-runs the flow with a second known address resolving to a different district, and the test confirms the first District 1-5 row is replaced (not duplicated) — exactly one County Commission row remains, pointing at the new district.
- **At-Large-preservation test:** before and after both runs above, confirm the test user's At-Large `user_districts` row is unchanged (same row, same `district_id`, not deleted or recreated).
- **Failure-path test:** simulate a ZIP-only input, an ambiguous/ unrecognized tool response, and a write failure, and confirm no `user_districts` row is created or altered in any of the three cases, and the user-facing manual-verification message appears.
- **Non-regression test:** confirm a user who never runs this flow continues to see the exact same `My Current Officials` result as before this feature existed (zero County Commissioners, unchanged existing officials).
- All tests above should use test accounts and public/government test addresses only, consistent with the precedent set in Gate 2 (no private user addresses used for verification).

## Rollout plan

- Ship behind a state where the profile-settings entry point is easy to hide or remove without a schema change (e.g., a simple conditional in the UI), so it can be pulled quickly if the lookup tool or parsing proves unreliable in production.
- Roll out to internal/admin test accounts first (the same pattern used for prior admin-gated features like `/admin/entry`), confirm the four success/failure paths above manually against real production data, then enable for beta users generally.
- No migration or backfill is needed for existing users — the feature is purely additive and opt-in; users who never use it are unaffected.
- Coordinate rollout timing with `CLAUDE.md`'s current priority of stabilizing onboarding before building more screens — since this is a profile-settings addition rather than an onboarding-flow change, it does not directly conflict with that priority, but Gate 5 should still confirm this sequencing is acceptable before implementation begins.

## Risks

1. **Label-format drift risk.** If the county's ArcGIS tool ever changes its returned label wording (e.g., from `"District 3 — The Commissioner..."` to a different format), the label parser could start silently failing (safe, since failure handling blocks the write) or, worse, silently mis-parsing (unsafe). The parser should be conservative (exact-format match, reject anything unexpected) rather than permissive, and should be covered by the unit tests above so a wording change is caught immediately rather than discovered via silent failures in production.
2. **Third-party tool availability risk (carried over from Gate 2).** The lookup tool is outside CivicMarket's control. An outage blocks new verifications but, per the failure-handling design, cannot corrupt or delete existing verified assignments.
3. **PII handling risk (carried over from Gate 3).** The address is used in transit for the lookup and must not be persisted beyond what "Audit/logging recommendation" allows. This needs explicit sign-off at Gate 5 on exactly what, if anything, is logged.
4. **Redistricting risk (carried over from Gate 1-3, unchanged).** This plan does not include a mechanism to detect that a previously correct assignment has gone stale due to redistricting. A user who verified once and never moves has no prompt to re-verify even if boundaries change. This is called out as deferred work below, not solved here.
5. **Scope-creep-into-onboarding risk.** Placing this as a profile-settings action (not a forced onboarding step) is this plan's mitigation, but Gate 5 should explicitly confirm that placement rather than assume it, since `CLAUDE.md` currently prioritizes onboarding stabilization over expansion.

## Deferred work

The following remain out of scope for this Gate 4 document and remain unstarted:

- Any actual UI, API route, or database code.
- A decision on whether the lookup is a manual link-out (user reads the result off the county tool and confirms it in CivicMarket) or an embedded/automated capture of the tool's output — this plan describes the data contract (one clean "District N" label in, one `user_districts` row out) without prescribing the UI mechanism; Gate 5 should decide this specifically.
- Investigation of a programmatic/server-side query against the county's underlying ArcGIS feature layer (Gate 2, Risk 2).
- A redistricting/staleness re-verification prompt design.
- A durable audit-table design, if the logging recommendation above is judged insufficient at Gate 5.
- Confirmation of `user_districts` table columns available for audit purposes (e.g., whether a `created_at` column already exists) — to be confirmed against the live schema at Gate 5, not assumed here.

## Exact Gate 5 approval checklist

Before any implementation begins, Gate 5 must obtain explicit, itemized approval for each of the following:

- [ ] **Source URL approved** — the exact lookup tool URL (`https://slc.maps.arcgis.com/apps/instant/lookup/index.html?appid=9afb7523a1854366bed2d7c50ed7428b`) or an equivalent verified with the same rigor as Gate 2.
- [ ] **Lookup input approved** — address-level input required; ZIP-only explicitly rejected as insufficient.
- [ ] **District label mapping approved** — exact-match-only parsing to "District 1" through "District 5"; no inference on ambiguous labels.
- [ ] **`user_districts` write behavior approved** — one insert per verified user, storing only the resolved `district_id` (no raw address persisted), through the existing authenticated RLS-guarded write path.
- [ ] **Duplicate handling approved** — delete-then-insert scoped only to the five County Commission District 1-5 ids, guaranteeing at most one such row per user.
- [ ] **At-Large preservation approved** — At-Large row never deleted, renamed, replaced, or repurposed; never used alone as evidence for a District 1-5 write.
- [ ] **Current Officials display rule approved** — `officials_for_user` and `getOfficialsForUser` remain unmodified; exactly one commissioner shown per verified user; zero shown for unverified users.
- [ ] **Test plan approved** — unit, integration, duplicate-prevention, At-Large-preservation, failure-path, and non-regression tests as described above, using only test accounts and public/government test addresses.
- [ ] **UI placement approved** — confirmed as an opt-in profile-settings action, not a forced onboarding step, and confirmed compatible with `CLAUDE.md`'s onboarding-stabilization priority.
- [ ] **Logging/PII handling approved** — explicit sign-off on what, if anything, is logged about a lookup attempt, and confirmation that raw addresses are not persisted beyond the described scope.

## No-change confirmation

This document is planning-only. Confirmed no-changes as part of this Gate 4 task:

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
- This document is a plan for a future, separately approved Gate 5+ to approve or reject; nothing in it has been implemented.
