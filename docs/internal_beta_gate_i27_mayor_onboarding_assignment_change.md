# Internal Beta — Gate I27: Mayor Onboarding Assignment Change

## 1. Date and timestamp

Date: 08-08-2026
Timestamp: 06:59 am EST

## 2. Purpose

Enable Mayor as a citywide Port St. Lucie onboarding assignment, so a legitimately onboarded Port St. Lucie voter is associated with the Mayor district and the Mayor race can participate in their personalized ballot/current civic experience — while keeping City Council District 3 district-specific and deferred, per Gate I23B/I24's already-approved distinction.

## 3. Baseline

- Gate I26 complete: the scoped Mayor and City Council District 3 write is live and fully verified.
- Mayor district live: `11111111-0000-0000-0000-000000000006` (`name: Mayor, type: city_council, city: Port St. Lucie, state: FL`) — re-confirmed live, read-only, immediately before this gate's change.
- Mayor election live: `22222222-0000-0000-0000-000000000006` (`PSL Mayor 2026`, `election_date: 2026-08-18`).
- Four Mayor candidates live (Shannon Martin, Eric Strazzeri, Steven Giordano, Steven Harrington).
- District 3 data (district, election, 3 candidates) live but user-assignment remains deferred.
- Starting repository state: branch `master`, working tree clean, up to date with `origin/master`, latest commit `6ed837d`.

## 4. Existing onboarding architecture (as discovered)

`src/app/onboarding/zip/page.tsx` is the sole onboarding district-assignment mechanism. Key findings:

- **No live database lookup is used to resolve districts.** `ALL_PSL_DISTRICTS` is a hardcoded, client-side array of `{ id, name, scope }` objects. Each `id` is the district's known, fixed, deterministic UUID (the same `11111111-0000-0000-0000-000000000XXX` convention used throughout this repository) — not resolved by name, type, city, or state at runtime.
- **No API route is involved.** The component calls `supabase` (the browser client) directly.
- **Write behavior:** on a supported ZIP (`PSL_ZIPS`, unchanged by this gate), the flow (1) updates `profiles.zip_code`, (2) `DELETE`s all existing `user_districts` rows for the user, then (3) `INSERT`s one row per `ALL_PSL_DISTRICTS` entry as `{ user_id, district_id: d.id, scope: d.scope }`. The code comment explains the delete-then-insert pattern exists because `user_districts` has no `UPDATE` RLS policy, so `upsert` would fail on conflict.
- **No test or validation helper** touches onboarding district assignment anywhere in `src/` (confirmed by search — only unrelated `node_modules` test files matched a `*.test.ts(x)` search).

### Pre-change citywide list (exact)

```
{ id: '11111111-0000-0000-0000-000000000001', name: 'City Council District 1', scope: 'city' },
{ id: '11111111-0000-0000-0000-000000000002', name: 'School Board District 1', scope: 'county' },
{ id: '11111111-0000-0000-0000-000000000003', name: 'St. Lucie County Commission At-Large', scope: 'county' },
{ id: '11111111-0000-0000-0000-000000000004', name: 'FL House District 85', scope: 'state' },
{ id: '11111111-0000-0000-0000-000000000005', name: 'FL Senate District 27', scope: 'state' },
```

This confirms the architecture reviewed in Gate I23B/I24 exactly: adding Mayor to this array is sufficient by itself to cause future onboarding users to receive the Mayor district through the existing, unmodified write path — no schema change, no new API route, no new write mechanism needed.

## 5. Implementation

**File changed:** `src/app/onboarding/zip/page.tsx` (one line added to `ALL_PSL_DISTRICTS`, nothing else touched).

**Exact change:**
```diff
   { id: '11111111-0000-0000-0000-000000000005', name: 'FL Senate District 27', scope: 'state' },
+  { id: '11111111-0000-0000-0000-000000000006', name: 'Mayor', scope: 'city' },
 ];
```

**Why Mayor is citywide while District 3 is not:** Mayor is a genuinely citywide Port St. Lucie office — every onboarded PSL voter is a Mayor-race voter, matching the flat, unconditional nature of `ALL_PSL_DISTRICTS` itself (every entry in that array is already granted to every supported-ZIP user regardless of their specific address, including County Commission At-Large and School Board District 1, which are themselves beta-simplified flat assignments). City Council District 3, by contrast, varies by the voter's specific sub-city address — exactly the class of problem the County Commission District 1-5 verified-lookup pattern exists for, and adding it to this flat array would incorrectly assign every single onboarded user (including District 1 residents) to District 3, which Gate I23B explicitly identified and rejected.

## 6. Static verification

- **Mayor resolves to `11111111-0000-0000-0000-000000000006`** — confirmed directly in the added array literal; this exact ID was re-verified live against the `districts` table (Section 3) immediately before this change.
- **Existing Port St. Lucie onboarding now includes Mayor** — confirmed by code trace: `districtRows` (the array passed to `user_districts.insert`) is built via `ALL_PSL_DISTRICTS.map(...)`, so any future onboarding submission for a supported ZIP will include a Mayor row alongside the existing five.
- **District 3 is not included** — confirmed by inspection: `ALL_PSL_DISTRICTS` now has exactly 6 entries, none named `City Council District 3` or using its id (`...000007`).
- **Existing District 1 logic is unchanged** — the `City Council District 1` entry (id `...000001`, scope `city`) is byte-for-byte identical to before this change; `PSL_ZIPS`, `handleZipChange`, and `handleSubmit`'s control flow are untouched.
- **County Commission behavior is unchanged** — the `St. Lucie County Commission At-Large` entry (id `...000003`) is untouched; no County Commission District 1-5 id (`...000031`-`...000035`) was added to this array. `src/app/api/set-county-commission-district/route.ts` was not touched, and `ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE` remains `false` (confirmed unchanged — this gate did not read, reference, or modify that file at all).
- **No production database write occurred.** This is a client-side source-code change only; the actual `user_districts` `INSERT` this code performs only executes when a real user submits the onboarding ZIP form in a running app, which did not happen during this gate. No dev server was started, no onboarding flow was exercised, and no Supabase write of any kind was performed.
- **No schema or data change occurred** — no `districts`, `elections`, `candidates`, or `user_districts` row was created, modified, or deleted.

## 7. Duplicate-handling finding

The existing write path already safely prevents duplicates on repeated onboarding: it unconditionally `DELETE`s all of a user's `user_districts` rows before inserting the current `ALL_PSL_DISTRICTS` set. Adding a sixth entry does not change this behavior or introduce any new duplicate risk — a user who re-runs onboarding will simply have their prior rows (now including Mayor, if they previously onboarded after this change) replaced with a fresh, identical set. No redesign of this flow was needed or performed for this change.

## 8. Build and lint

- `npm run build`: **passed** — 25 routes generated, no errors.
- `npm run lint`: **5 pre-existing errors only** (`@typescript-eslint/no-require-imports` in `scripts/import-real-psl-data.cjs` and `scripts/validate-real-psl-csvs.cjs`), identical to every prior lint run in this repository's history. No new errors were introduced by this change. No unrelated script was modified to "clean" these pre-existing errors.

## 9. Deferred items (unchanged, kept deferred)

- **District 3 user-assignment mechanism** — remains fully deferred. Not implemented, not designed further, not added to any flat list.
- **The pre-existing District 1 election-date discrepancy** (live `2026-11-03` vs. Gate I18's documented `August 18, 2026`) — remains open and untouched.
- **A live onboarding test that would write a real `user_districts` row** — not performed in this gate, and not authorized by this gate; would require separate approval.
- **Deployment** — did not occur.

## 10. Gate outcome

**Gate I27 PASS — Mayor citywide onboarding assignment implemented and statically verified.**

**Live production `user_districts` mutation was not performed.**
