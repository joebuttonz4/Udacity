# County Commission District Assignment Lookup — Gate 17A: Non-Write Code Review

Date: 07-08-2026

## Purpose

Perform a non-write, read-only code review of the two files implementing the draft County Commission District 1-5 assignment flow, to confirm the safety properties established in Gates 8-16 still hold as written in the current codebase, and to surface any hardening recommendations before a future write-execution gate proceeds.

This is a code review. It does not implement, enable, or execute anything.

## Files reviewed

- `src/app/profile/county-commission/page.tsx`
- `src/app/api/set-county-commission-district/route.ts`

## Gate 17A scope

- Review only. No files were edited.
- `ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE` was not changed — confirmed still `false`.
- No Supabase writes were run.
- No `user_districts` rows were created, updated, or deleted.
- No deployment occurred.

## Findings by checklist item

### Auth and Bearer-token handling — PASS

`route.ts:30-45`. The route requires an `Authorization: Bearer <token>` header, rejects with `401` if missing or malformed, extracts the token, and resolves the acting user server-side via `createServiceClient()` + `supabase.auth.getUser(token)`. The user id used for every subsequent operation (`userId = user.id`) comes only from this server-side token resolution — the client never supplies a `user_id` directly. This matches the existing `compute-match-scores` route pattern exactly.

### Write guard behavior while false — PASS

`route.ts:9, 131-145, 153-174`. `ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE = false`. The `if (!ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE)` block returns the dry-run JSON response before any mutation call. The `.delete()` (line 155) and `.insert()` (line 168) calls are lexically positioned after that early return and are structurally unreachable while the constant is `false`. No `.update()` or `.upsert()` call exists anywhere in the file. This reconfirms the same static result recorded in Gate 8 and Gate 16.

### districtLabel validation — PASS

`route.ts:13-25, 59-67`. `districtLabel` is checked against a closed, typed five-value enum (`'District 1'`...`'District 5'`) via `isValidDistrictLabel`, which requires an exact string match against the literal array. Any other value — wrong case, extra whitespace, a district number outside 1-5, a non-string type — is rejected with `400` before any Supabase call is made.

### attestedOfficialLookup validation — PASS

`route.ts:69-74`. Checked with `attestedOfficialLookup !== true` (strict boolean equality), not a truthy check. A string `"true"`, `1`, or any non-boolean-`true` value is correctly rejected with `400`.

### Live districts table verification — PASS, with one hardening recommendation

`route.ts:79-96`. The selected district is resolved by an exact `.eq('name', 'St. Lucie County Commission ' + districtLabel)` query against the live `districts` table, never a hardcoded id. Zero or multiple matches are treated as a failed lookup (`422`), consistent with Gate 4's fail-closed requirement.

**Recommendation (non-blocking, not safety-critical):** `route.ts:102-112` resolves all five County Commission District 1-5 ids for the delete scope via `.in('name', allLabelNames)`, but the code does not assert `deleteScopeIds.length === 5` before proceeding. If a district name ever drifted (typo, rename, partial delete) such that fewer than five rows matched, the delete scope would silently narrow rather than fail — meaning a stale District 1-5 row for a *different* district could survive a future insert, producing a duplicate County Commission assignment once writes are enabled. This has no effect today since the write path is disabled, but should be addressed (e.g., an explicit `if (deleteScopeIds.length !== 5) return 500` check) before any future gate enables writes.

### Delete scope limited to District 1-5 only — PASS (see recommendation above)

`route.ts:100-129, 153-157`. `deleteScopeIds` is derived only from the five County Commission District label names and is the only filter used in the (currently unreachable) delete call. No other district id, and no blanket per-user delete, is ever constructed.

### At-Large row excluded from delete scope — PASS (structural, not an explicit runtime check)

`route.ts:11, 116-129`. The At-Large row's name (`St. Lucie County Commission At-Large`) does not exactly match any of the five `St. Lucie County Commission District N` strings used in the `.in('name', ...)` query, so it is structurally impossible for `deleteScopeIds` to include the At-Large id. `AT_LARGE_DISTRICT_ID` is defined and included in the dry-run `writePlan.preserves` block for documentation/observability purposes, but it is not itself used as an active exclusion filter anywhere in the code — exclusion is guaranteed by the query shape, not by a defensive check against this constant. This is safe as currently written. **Note for future maintainers:** if district resolution is ever refactored away from exact-name matching (e.g., to a broader `LIKE` or prefix match), an explicit filter excluding `AT_LARGE_DISTRICT_ID` should be added at that time rather than relying on name-string coincidence.

### No ZIP-only assignment — PASS

Neither file contains any ZIP code field, parameter, or state variable. `page.tsx` only references "ZIP" in the static warning copy ("A ZIP code alone is not reliable..."), never as user input. `route.ts` accepts only `districtLabel` and `attestedOfficialLookup` in its request body — there is no code path by which a ZIP value could reach or influence a district assignment.

### No address collection or logging — PASS

Grep confirms `page.tsx` mentions "address" only in static explanatory text ("does not collect or store your address on this page") — there is no address input field, state variable, or form control anywhere in the page. Grep further confirms `route.ts` contains **zero** `console.log`/`console.error`/logging calls of any kind — no address, no request body, no lookup outcome is logged anywhere. This satisfies "no address collection" unambiguously, though it also means the Gate 4-recommended minimal audit logging (timestamp + outcome, no address) has not yet been implemented. That is a pre-existing, previously-deferred gap (see Gate 4's "Audit/logging recommendation" and Gate 6/7's deferred-work notes), not a new issue, and not safety-critical.

### Failure handling — PASS

Every failure path in `route.ts` returns before any mutation and never partially applies a change:
- Malformed JSON body → `400`, no Supabase call made.
- Invalid `districtLabel` → `400`.
- `attestedOfficialLookup !== true` → `400`.
- District lookup query error → `500`.
- Zero or multiple district matches → `422`, explicitly fail-closed.
- Delete-scope resolution query error → `500`.
- (Unreachable while guard is `false`) delete error → `500`, no insert attempted.
- (Unreachable while guard is `false`) insert error → `500`.

No response path silently proceeds past a failure to attempt a partial write.

### Dry-run response contents — PASS, with one minor observation

`route.ts:138-144`. The dry-run response includes `dryRun: true`, the exact message string previously verified in Gate 10/11 ("Write path disabled pending explicit approval. No user_districts row was created or modified."), `resolvedDistrict` (`id`, `name`), and the full `writePlan` (delete scope, insert row shape, At-Large preservation note).

**Observation (non-blocking, informational only):** the raw JSON response exposes internal implementation details — table name (`user_districts`), column shape, and the `scope: 'county'` value — to any authenticated caller of this endpoint. This is not a meaningful data-exposure risk (it is the caller's own `user_id` and already-public app schema, not another user's data or a secret), and `page.tsx` does not render this object to the UI (only the `message` string is shown). It is flagged only as a polish item worth trimming before the feature goes live, not as a security or safety issue.

### Current Officials compatibility after a future valid District 1-5 row — PASS (unchanged, confirmed by inspection)

Neither `src/lib/officials.ts` nor `src/components/CurrentOfficialsSection.tsx` was modified by this feature at any gate, and this review confirms neither file was touched. The (currently unreachable) insert row shape — `{ user_id, district_id: resolvedDistrict.id, scope: 'county' }` — matches exactly what the existing, unmodified `officials_for_user` view's `district_id` join expects. No code change is needed in either file for a future valid District 1-5 row to surface correctly in My Current Officials once writes are enabled.

## Summary

All twelve requested checklist items pass. Two non-blocking hardening recommendations were identified for consideration before any future gate enables writes:

1. Add an explicit `deleteScopeIds.length === 5` (or equivalent) assertion before allowing the write path to proceed, so a future district-name drift fails closed instead of silently narrowing the duplicate-prevention delete scope.
2. Consider trimming the dry-run response's internal schema detail (table/column names) before the feature goes live, purely as response-hygiene polish — not a security requirement.

Neither recommendation is safety-critical. No file was edited as part of this review, consistent with the instruction to edit only if a safety-critical issue were found.

## No-change confirmation

- No app code was edited.
- `ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE` was not changed — remains `false`.
- No Supabase write was performed.
- No `user_districts` row was created, updated, or deleted.
- No schema, seed, migration, `districts`, or `officials_for_user` change was made.
- `src/lib/officials.ts` and `src/components/CurrentOfficialsSection.tsx` were not changed.
- The At-Large row (`11111111-0000-0000-0000-000000000003`) was not renamed, deleted, replaced, or repurposed.
- No deployment occurred.

## Recommended next step

Hold at dry-run only. If the two hardening recommendations above are worth addressing, they should go through their own gate (proposing the exact diff for review) rather than being applied silently as part of this review. Otherwise, the project remains exactly where Gate 16 left it: waiting on the user-provided final approval statement before any write-execution gate can proceed.
