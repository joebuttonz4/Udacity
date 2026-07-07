# County Commission Current Officials — Gate E Code Draft

Date: July 7, 2026

Status: **DRAFT ONLY. NOT APPROVED FOR IMPLEMENTATION.**

## 1. Scope

Documentation-only code-change plan for Gate E of docs/county_commission_current_officials_b2_implementation_plan.md. This document drafts the exact `getOfficialsForUser` change that would implement the approved B2 behavior, for Mike's review only. **`src/lib/officials.ts` has not been edited.** No other app code, schema, seed, migration, or Supabase data has been changed by this document.

This is Gate E of the proposed gate sequence (Gate A — source re-verification, Gate B — SQL draft, Gate C — explicit approval, Gate D — execution, **Gate E — this code draft**, Gate F — explicit code approval, Gate G — implement and verify, Gate H — UI verification).

## 2. Current confirmed state after Gate D

Per docs/county_commission_current_officials_gate_d_execution_result.md (complete and passed, July 7, 2026):

- 5 `current_officials` rows now exist in Supabase for St. Lucie County Commission District 1-5: James Clasby (District 1), Larry Leet — Vice Chair (District 2), Erin Lowry (District 3), Jamie Fowler — Chair (District 4), Cathy Townsend (District 5). All 5 have `jurisdiction_level = county`, `is_on_next_ballot = false`, and the shared `source_url` https://www.stlucieco.gov/departments-and-services/board-of-county-commissioners.
- The 5 District 1-5 `districts` rows (`...031` through `...035`) and the At-Large row (`11111111-0000-0000-0000-000000000003`, St. Lucie County Commission At-Large) are unchanged.
- No `user_districts` row exists for any of the five District 1-5 ids — confirmed 0 rows both before and after Gate D.
- The three already-seeded officials (Stephanie Morgan/city, Debbie Hawley/school_board, Toby Overdorf/state) are unchanged.
- The `officials_for_user` view is unchanged.
- **No County Commission District 1-5 official is visible to any user yet.** `officials_for_user` joins `user_districts.district_id = current_officials.district_id` on exact equality (Reference Files/civicmarket_schema_addendum_officials_reviews.sql:132); since no `user_districts` row points at a District 1-5 id, the view returns nothing for those 5 rows for any user, including users who hold the At-Large row. This is the gap Gate E's draft addresses.

## 3. B2 behavior goal

Users who have the St. Lucie County Commission At-Large district row (`11111111-0000-0000-0000-000000000003`) in `user_districts` should also see the five approved County Commission District 1-5 `current_officials` rows in Current Officials, without:

- changing the `officials_for_user` database view;
- adding District 1-5 rows to `user_districts`;
- modifying `districts`;
- modifying `current_officials` data;
- modifying schema, seeds, or migrations;
- renaming, deleting, replacing, or repurposing the At-Large row.

## 4. Existing getOfficialsForUser behavior summary

Current implementation, `src/lib/officials.ts:21-32`:

```ts
export async function getOfficialsForUser(userId: string): Promise<CurrentOfficial[]> {
  const { data, error } = await supabase
    .from('officials_for_user')
    .select(
      'id, name, office, district_id, district_name, jurisdiction_level, photo_url, website, term_start, term_end, next_election_date, source_url, source_label, candidate_id, is_on_next_ballot'
    )
    .eq('user_id', userId)
    .order('name')

  if (error) throw error
  return (data ?? []) as unknown as CurrentOfficial[]
}
```

- Single query against the `officials_for_user` view, filtered by `user_id`, ordered by `name`.
- Returns every official for every district the user holds, city/county/school_board/state alike, via the view's own join.
- `CurrentOfficialsSection.tsx` renders whatever this function returns, one card per row, already differentiating by `office` + `district_name` and a `jurisdiction_level` badge — no component change is anticipated (confirmed in the B2 plan, Section 3).

**Important finding for this draft:** the At-Large row itself has no `current_officials` row seeded for it (only city/school_board/state officials and now the five County Commission District 1-5 officials exist). This means the *primary* query's result set cannot be used to detect At-Large membership by inspecting returned `district_id` values — a user could hold the At-Large row and still receive zero county-level rows from the primary query alone. Detection must instead query the user's own `user_districts` rows directly for the At-Large id, not infer it from `officials_for_user` output. This refines the B2 plan's original phrasing ("detect that the result set (or the user's user_districts) includes the At-Large id") down to the reliable option: `user_districts`.

## 5. Proposed code change

Add a second, narrow step inside `getOfficialsForUser`, after the existing query:

1. Keep the existing `officials_for_user` query and its result exactly as-is (the "primary" result).
2. Query `user_districts` directly for this `user_id`, filtered to the At-Large district id, to determine membership. This is a read-only check, not a `user_districts` change.
3. If the user does not hold the At-Large row, return the primary result unchanged — byte-for-byte the current behavior, for every user who is not At-Large.
4. If the user does hold the At-Large row, issue a second read directly against `current_officials` (not the view, since the view cannot return District 1-5 rows for any user under B2) filtered to the five approved District 1-5 `district_id` values, embedding the district name via the `current_officials.district_id → districts.id` foreign key so `district_name` can still be populated on the merged rows.
5. De-duplicate by `id` before merging, in case a future row ever causes overlap between the primary result and the county fetch (defensive; not expected to trigger today, since no District 1-5 official is currently reachable via the view).
6. Re-sort the merged array by `name` to preserve the existing function's stable `name`-ordering contract, rather than appending the county rows unsorted at the end.

## 6. Exact file expected to change later

- `src/lib/officials.ts` — `getOfficialsForUser` only. This remains the only file expected to change under B2, consistent with docs/county_commission_current_officials_b2_implementation_plan.md Section 3.
- No other file (`CurrentOfficialsSection.tsx`, `onboarding/zip/page.tsx`, `candidates.ts`, `officials_for_user` view, `ballot_for_user`) is touched by this draft.

## 7. Pseudocode / diff-style draft

**Not yet applied. For review only.**

```diff
+const AT_LARGE_DISTRICT_ID = '11111111-0000-0000-0000-000000000003'
+const COUNTY_COMMISSION_DISTRICT_1_5_IDS = [
+  '11111111-0000-0000-0000-000000000031',
+  '11111111-0000-0000-0000-000000000032',
+  '11111111-0000-0000-0000-000000000033',
+  '11111111-0000-0000-0000-000000000034',
+  '11111111-0000-0000-0000-000000000035',
+]
+
 export async function getOfficialsForUser(userId: string): Promise<CurrentOfficial[]> {
   const { data, error } = await supabase
     .from('officials_for_user')
     .select(
       'id, name, office, district_id, district_name, jurisdiction_level, photo_url, website, term_start, term_end, next_election_date, source_url, source_label, candidate_id, is_on_next_ballot'
     )
     .eq('user_id', userId)
     .order('name')

   if (error) throw error
-  return (data ?? []) as unknown as CurrentOfficial[]
+  const primary = (data ?? []) as unknown as CurrentOfficial[]
+
+  // Read-only membership check — does not modify user_districts.
+  const { data: atLargeMembership, error: atLargeError } = await supabase
+    .from('user_districts')
+    .select('district_id')
+    .eq('user_id', userId)
+    .eq('district_id', AT_LARGE_DISTRICT_ID)
+
+  if (atLargeError) throw atLargeError
+  if (!atLargeMembership || atLargeMembership.length === 0) {
+    return primary
+  }
+
+  // officials_for_user cannot return District 1-5 rows for any user today
+  // (no user_districts row points at them under B2), so query
+  // current_officials directly and embed the district name.
+  const { data: countyRows, error: countyError } = await supabase
+    .from('current_officials')
+    .select(
+      'id, name, office, district_id, jurisdiction_level, photo_url, website, term_start, term_end, next_election_date, source_url, source_label, candidate_id, is_on_next_ballot, districts(name)'
+    )
+    .in('district_id', COUNTY_COMMISSION_DISTRICT_1_5_IDS)
+
+  if (countyError) throw countyError
+
+  const existingIds = new Set(primary.map((official) => official.id))
+  const county = (countyRows ?? [])
+    .filter((row) => !existingIds.has(row.id))
+    .map((row) => ({
+      ...row,
+      district_name: row.districts?.name ?? null,
+    })) as unknown as CurrentOfficial[]
+
+  return [...primary, ...county].sort((a, b) => a.name.localeCompare(b.name))
 }
```

Notes on this draft:

- The `districts(name)` embed relies on the existing FK `current_officials.district_id → districts(id)` (Reference Files/civicmarket_schema_addendum_officials_reviews.sql:15) — this is a read-only PostgREST embedded select, not a schema change.
- `.sort((a, b) => a.name.localeCompare(b.name))` re-establishes the same `name` ordering the primary query already produces via `.order('name')`, so the merged list stays consistently ordered whether or not the county rows were appended.
- The `existingIds` de-duplication guards against a hypothetical future state where a District 1-5 `current_officials` row becomes reachable through the view itself (e.g. if a future gate ever added a `user_districts` row for one of those ids) and would otherwise appear twice for the same user.

## 8. Data assumptions

- The At-Large district id is fixed at `11111111-0000-0000-0000-000000000003` and is not expected to change (per every prior gate's no-change protection on this row).
- The five District 1-5 district ids (`...031`-`...035`) are fixed, per Gate 6/7 of docs/county_commission_district_1_5_future_implementation_plan.md, and match the five `current_officials` rows inserted at Gate D.
- Exactly 5 `current_officials` rows exist for District 1-5 as of Gate D (confirmed in docs/county_commission_current_officials_gate_d_execution_result.md, post-insert verification 1).
- No `user_districts` row currently references any District 1-5 id (confirmed 0 rows at Gate D) — the membership check in this draft therefore currently affects only users whose `user_districts` includes the At-Large id, which today is every onboarded PSL user (`ALL_PSL_DISTRICTS` in `src/app/onboarding/zip/page.tsx` assigns At-Large to all users, per the Gate 3 B2 decision).
- This draft assumes the Supabase JS client's PostgREST embed syntax (`districts(name)`) resolves correctly against the existing FK; this has not been runtime-tested since the code has not been implemented (see Section 10).

## 9. No-change protections

This document makes no changes. Specifically, as of this document:

- `src/lib/officials.ts` is unchanged — no edit was applied.
- No other app code was edited.
- No schema was edited.
- No seed file was edited.
- No migration file was edited.
- No Supabase write was performed.
- `current_officials` data was not modified.
- `districts` was not modified.
- `user_districts` was not modified — the draft's membership check is read-only (`SELECT`), not a write.
- The `officials_for_user` view was not changed.
- The St. Lucie County Commission At-Large row (id `11111111-0000-0000-0000-000000000003`) was not renamed, deleted, replaced, or repurposed.
- Repo working tree before this document was added: clean, on `master`, up to date with `origin/master`, latest commit `3a675cc`.

## 10. Test plan

To be executed only after Gate F approval and Gate G implementation (not part of this document):

- **Regression:** a test user holding city/school_board/state districts but not At-Large still sees exactly their existing officials, unchanged, with the same ordering as before this change.
- **New behavior:** a test user whose `user_districts` includes the At-Large id sees exactly the 5 District 1-5 officials in addition to any other jurisdiction officials they already had — 5 new cards, no fewer, no more.
- **Negative check:** a test user with no county row at all (hypothetically, if one existed) sees zero county officials — the membership check correctly returns `[]`/`length === 0` and short-circuits to the primary result.
- **Duplicate check:** confirm no official ever appears twice in the merged list for any test user, exercising the `existingIds` de-duplication path (even though no live data triggers it today).
- **Ordering check:** confirm the merged list is sorted by `name` identically to how `.order('name')` alone would sort the primary-only result for a non-At-Large user, and that County Commission cards interleave alphabetically with other officials rather than always appearing last.
- **Isolation check:** `/onboarding/zip`, `ALL_PSL_DISTRICTS`, `user_districts` row count for the test user, `ballot_for_user` output, and the `officials_for_user` view's own output (queried directly, independent of this function) are diffed before/after — expect zero change in all five.
- **Error-path check:** confirm the new `user_districts` read and the new `current_officials` read each propagate their own Supabase error via `throw error`, consistent with the function's existing error-handling pattern, rather than swallowing failures silently.
- **Rollback check:** reverting this function to its current form (Section 4) fully restores prior behavior, since both new reads are additive and read-only.

## 11. Risk check

Scope: Documentation-only code drafting for a future `getOfficialsForUser` change. No app code executed or changed by this document.

No-change risk: County Commission District 1-5 officials remain invisible to all users, same as before this document. No regression to existing behavior.

Change risk (if this draft is later approved and implemented):

- Two additional Supabase reads per call (`user_districts` membership check, then conditionally `current_officials`) instead of one — a minor latency increase for At-Large-holding users only; non-At-Large users incur only the one extra read-only membership check.
- The `districts(name)` PostgREST embed syntax has not been runtime-verified in this codebase before; if the embed key or relationship name differs from assumption, it could return `null` district names or a query error — this must be verified in Gate G, not assumed correct from this draft alone.
- If this logic is implemented incorrectly, it risks showing County Commission officials to a user who does not hold the At-Large row, or omitting them for a user who does — the test plan (Section 10) exists specifically to catch both directions.
- A bug introduced while adding the second/third read could regress the three already-seeded officials or any future city/school_board/state official, even though `officials_for_user` itself is never touched, since the function's return path changes.
- District 1-5 ids are now hardcoded a third time in this codebase (already in the Gate 2 district design worksheet and the Gate B SQL draft) — the three lists (`districts` proposal, `current_officials` SQL, and this function) must be kept in sync manually if any id ever changes.

## 12. Explicit approval requirement before implementation

**This code change is DRAFT ONLY and NOT APPROVED FOR IMPLEMENTATION.**

Before `src/lib/officials.ts` is edited, Mike must explicitly approve, per Gate F of docs/county_commission_current_officials_b2_implementation_plan.md, stating:

- approval of the detection method (querying `user_districts` directly for the At-Large id, rather than inferring from the primary result — see Section 4's finding);
- approval of querying `current_officials` directly (bypassing the view) for the District 1-5 rows, with the `districts(name)` embed for `district_name`;
- approval of the de-duplication and re-sort behavior (Section 5, steps 5-6);
- approval of this exact diff (Section 7), or requested changes to it.

No app code has been edited. No Supabase data has been modified. No schema, seed, or migration file has been touched by this documentation update.

## 13. Hard stops

- Do not edit `src/lib/officials.ts` or any other app code as part of this document.
- Do not run tests beyond read-only inspection.
- Do not write to Supabase.
- Do not create or modify SQL.
- Do not change `user_districts`.
- Do not change `officials_for_user`.
- Do not change `districts`.
- Do not change `current_officials` data.
- Do not change schema, seeds, or migrations.
- Do not rename, delete, replace, or repurpose the St. Lucie County Commission At-Large row.
- Do not proceed to Gate F approval or Gate G implementation without a separate, explicit future instruction.
