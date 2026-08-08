# Gate I36 — Onboarding City Council Default-Assignment Fix

Status: **Implemented and statically verified. No live/UI onboarding test performed. General-user City Council writes remain disabled.**

Date: 08-08-2026

Design record this gate implements: the read-only "Gate I35" design/inspection findings delivered in-conversation in the prior turn (report-only; no separate document file was created for that step). This gate is the first Gate I35/I36 artifact committed to the repository.

## Prior unsafe default

`src/app/onboarding/zip/page.tsx`'s `ALL_PSL_DISTRICTS` array included City Council District 1 (`11111111-0000-0000-0000-000000000001`) alongside five genuinely citywide/county/state districts. Every qualifying Port St. Lucie ZIP submission silently assigned City Council District 1 to the user regardless of their actual address — Port St. Lucie has four City Council districts, and ZIP code alone cannot reliably distinguish District 1 from District 3 (the same fact already established for the `/profile/city-council-district` verification flow, Gate I28).

## Delete-all secondary defect (identified during design, not previously documented)

The same code's `user_districts` delete before reinsert was unconditional — `.delete().eq('user_id', user.id)` — removing **every** row for that user, not just the ones about to be reinserted. Combined with the unsafe default above, this meant that if a user had already verified a real City Council District 1 or District 3 assignment through `/profile/city-council-district` (once that write path is eventually enabled for general users) and later revisited `/onboarding/zip` — e.g. to update their ZIP — that verified City Council row would have been silently destroyed and replaced with the flat default list. This had not been exercised or documented before this gate.

## Implemented fix

### `src/app/onboarding/zip/page.tsx`

1. **Renamed and reduced `ALL_PSL_DISTRICTS` to `ZIP_MANAGED_DISTRICTS`**, removing the City Council District 1 entry entirely. It now contains exactly the five districts ZIP onboarding is approved to manage:
   - School Board District 1 (`...0002`)
   - St. Lucie County Commission At-Large (`...0003`)
   - FL House District 85 (`...0004`)
   - FL Senate District 27 (`...0005`)
   - Mayor (`...0006`)

   City Council District 3 (`...0007`) was never in this list and remains excluded, per the Gate I35 design (never auto-assign either City Council district from ZIP).

2. **Scoped the delete.** The `user_districts` delete before reinsert now includes `.in('district_id', ZIP_MANAGED_DISTRICTS.map((d) => d.id))`, restricting it to exactly the five ids above. City Council District 1/3 rows — and any other future unrelated `user_districts` row — are structurally excluded from this delete by construction, since they are never members of `ZIP_MANAGED_DISTRICTS`.

3. **Insert unchanged in shape**, now sourced from `ZIP_MANAGED_DISTRICTS` instead of the old `ALL_PSL_DISTRICTS` — same five-row insert pattern, just missing the removed sixth (City Council District 1) row.

No other logic in this file was touched: the ZIP validation, beta-notice handling, `profiles.zip_code` update, and navigation to `/onboarding/districts` are all unchanged.

### `src/app/onboarding/calculating/page.tsx`

Added one secondary, visually subordinate action to the existing "ready" (post-Civic-DNA) success screen: a text link — "Verify your City Council district →" — to `/profile/city-council-district`, with a short explanatory line ("Port St. Lucie ZIP codes can span more than one council district. Verify yours using the official City Council District Finder."). This:
- reuses the existing, already-proven verification page and API/RPC path unmodified — no duplicate district selector, no address collection, no new API logic;
- sits below the existing primary "View my ballot" button, styled as a plain text link with muted helper copy (not a filled button), so it reads as secondary;
- does not alter the existing primary CTA, its behavior, or the already-approved "Your Civic DNA is ready" copy;
- does not claim saving works for general users — the destination page (`/profile/city-council-district`) already discloses "Preview only — saving is currently disabled" on its own, unmodified.

## Files changed

- `src/app/onboarding/zip/page.tsx`
- `src/app/onboarding/calculating/page.tsx`

No other file was modified. In particular, per the approved scope, these were **not** touched: `src/app/profile/city-council-district/page.tsx`, `src/app/api/set-city-council-district/route.ts`, the `set_psl_city_council_district` RPC SQL, `src/lib/candidates.ts`, `src/lib/officials.ts`, `CurrentOfficialsSection.tsx`, Home (`src/app/page.tsx`), Ballot (`src/app/ballot/page.tsx`), or any schema/RLS/grants/policy/migration/seed/district-definition file.

## No database/schema changes

No Supabase mutation was performed. No live `user_districts`, `districts`, `elections`, or `candidates` row was created, updated, or deleted. No function, schema, RLS, grant, or policy was modified. No deployment occurred.

## Write guards

Confirmed unchanged before and after implementation:
- `ENABLE_CITY_COUNCIL_DISTRICT_WRITE = false`
- `ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE = false`

Neither guard was enabled at any point during this gate.

## Static verification

Performed by direct code inspection and `grep` against the modified files (not a live test):

- No ZIP onboarding code references or assigns `...0001` (City Council District 1) — confirmed absent from `src/app/onboarding/zip/page.tsx` entirely.
- No ZIP onboarding code references or assigns `...0007` (City Council District 3) — confirmed absent; it was never present.
- `ZIP_MANAGED_DISTRICTS`, and therefore the delete's `.in('district_id', ...)` scope, contains exactly: `...0002`, `...0003`, `...0004`, `...0005`, `...0006` — confirmed by direct read of the array.
- A pre-existing `...0001` row survives the ZIP delete **by construction**: the delete only matches rows whose `district_id` is in the five-id list above, and `...0001` is not a member of that list, so Postgres/PostgREST's `.in()` filter cannot match it regardless of what else exists for that user.
- A pre-existing `...0007` row survives the ZIP delete **by construction**, for the identical reason.
- The verification CTA in `src/app/onboarding/calculating/page.tsx` points to `/profile/city-council-district` — confirmed by direct read of the `href`.
- No duplicate City Council verification UI was introduced — `grep` for radio/attestation/district-option patterns in `calculating/page.tsx` returned no matches; the page only adds a `Link` and two lines of static text.

## Build and lint

- `npm run build`: passed, **27 routes**, no errors — matches the pre-existing baseline exactly (no route added, removed, or changed in type).
- `npm run lint`: 5 errors, all pre-existing (`scripts/import-real-psl-data.cjs`, `scripts/validate-real-psl-csvs.cjs`, `@typescript-eslint/no-require-imports`) — no new errors from either changed file.

## Testing limitations

This gate performed **static verification only** — code inspection, `grep`, `npm run build`, and `npm run lint`. No live browser test was performed: no dev server was started, no ZIP onboarding flow was actually run end-to-end, no `user_districts` rows were inspected live, and no pre-existing verified City Council row was actually exercised through a real ZIP resubmission. The "survives by construction" claims above are structural/logical proofs from reading the exact filter applied, not empirical observations of a live database state.

## Live onboarding test still pending

A future gate should perform a live verification, at minimum:
1. A brand-new test account completes ZIP onboarding and ends up with exactly 5 `user_districts` rows (Mayor, School Board, County At-Large, FL House, FL Senate) and zero City Council rows.
2. Home, Ballot, `/onboarding/districts`, Profile, and Current Officials all render safely with no City Council assignment (expected per the Gate I35 design trace, not yet re-confirmed live against this specific code change).
3. The new "Verify your City Council district" link on the calculating screen is visible, styled as secondary, and navigates correctly.
4. **Once a future, separately approved gate enables `ENABLE_CITY_COUNCIL_DISTRICT_WRITE`** for a scoped test account: verify a real City Council assignment made via `/profile/city-council-district` survives a subsequent ZIP resubmission for the same account (the actual regression this gate's delete-scoping fix targets). This specific test cannot be run today because general/test-account City Council writes remain disabled.

## General-user City Council writes remain disabled

This gate only removes an unsafe default and adds a pointer to the existing (already-built, already-proven-in-Gate-I34) verification flow. It does **not** enable City Council district writes for any user. `ENABLE_CITY_COUNCIL_DISTRICT_WRITE` remains `false`; enabling it for general use remains a separate, future, explicitly-approved gate, per the same discipline used throughout this project. Do not treat this gate as production or Controlled-PSL-Beta readiness — it has not been live-validated.

## No-change confirmation — Gate I36

Beyond the two approved source files, Gate I36 made no changes to: `candidates`, `voting_records`, `candidate_positions`, `match_scores`, `civic_dna`, `civic_dna_answers`, `user_districts`, `districts`, `elections`, `current_officials`, `officials_for_user`, `src/lib/officials.ts`, `src/lib/candidates.ts`, `CurrentOfficialsSection.tsx`, `src/app/profile/city-council-district/page.tsx`, `src/app/api/set-city-council-district/route.ts`, the `set_psl_city_council_district` RPC, `src/app/api/set-county-commission-district/route.ts`, Home, Ballot, schema, RLS, grants, policies, migrations, seeds, district definitions, PowerShell scripts, API keys, or environment variables. No database write was performed. No secret file was inspected. `ENABLE_CITY_COUNCIL_DISTRICT_WRITE` remains `false`. `ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE` remains `false`. No deployment occurred.
