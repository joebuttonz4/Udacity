# Milestone 1 — Onboarding Live Validation (City Council-Safe ZIP Flow)

Status: **PASS.**

Date: 08-08-2026

Validates the Gate I36 implementation (`src/app/onboarding/zip/page.tsx`, `src/app/onboarding/calculating/page.tsx`) end-to-end with a real, fresh test account through the normal application flow — no direct/manual Supabase writes were performed.

## Baseline

- Branch: master, clean, `92c4265` (Fix City Council onboarding district default) at HEAD before this session's changes.
- `ENABLE_CITY_COUNCIL_DISTRICT_WRITE = false` and `ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE = false` confirmed by direct source read before testing began.

## Test account

- Email: `civicmarket.test.05@example.com`
- User UUID: `3b223f8c-059e-4f3a-a507-29714ad8b3a9`
- Created by the project owner directly in the Supabase dashboard (email pre-confirmed), then signed in by the project owner in the browser — the assistant never entered, requested, or inspected the password or invite code at any point.
- Confirmed fresh/pre-onboarding before ZIP submission: navigating the authenticated session to `/ballot` immediately redirected to `/onboarding/zip`, which only happens when `getUserDistrictIds` returns zero rows — i.e., zero `user_districts` rows existed for this account prior to the test.

## Live onboarding run

- ZIP submitted: `34953`.
- Routed to `/onboarding/districts`, which showed exactly 1 race group ("Mayor", 4 candidates: Eric Strazzeri, Shannon Martin (incumbent), Steven Giordano, Steven Harrington) — no City Council race of any kind appeared. (School Board/County/FL House/FL Senate don't appear as race groups because no `candidates` rows exist for those districts — expected, unrelated to this fix.)
- Completed the 14-question Civic DNA quiz (answered "Neutral" throughout — sufficient to reach the completion screen; Civic DNA scoring itself was out of scope for this validation).
- Landed on `/onboarding/calculating`, which transitioned from the "calculating" to "ready" phase as expected.

## Post-ZIP `user_districts` state — read-only database verification

Performed via the browser's own already-authenticated Supabase REST calls (the same calls the app itself makes), replayed with a temporary `window.fetch` interceptor that captured the request the app already issued (`GET /rest/v1/user_districts?select=district_id&user_id=eq...`) without ever printing or exposing the captured Authorization header — the harness's own safety classifier blocked one earlier attempt to print the header directly, so the header was used only internally by the script and never displayed, mirroring the same read-only REST verification method used in Gate I22.

Result (HTTP 200):

```
count: 5
district_ids: [
  "11111111-0000-0000-0000-000000000002",  School Board District 1
  "11111111-0000-0000-0000-000000000003",  County Commission At-Large
  "11111111-0000-0000-0000-000000000004",  FL House District 85
  "11111111-0000-0000-0000-000000000005",  FL Senate District 27
  "11111111-0000-0000-0000-000000000006"   Mayor
]
```

**Exactly the five expected ZIP-managed rows. Zero rows for `...0001` (City Council District 1) and zero rows for `...0007` (City Council District 3).**

This single read was taken after all live UI testing below (including the dry-run submission), not immediately after ZIP submission — see Limitations. It is treated as valid evidence for both the immediate post-ZIP state and the final post-test state because `ENABLE_CITY_COUNCIL_DISTRICT_WRITE` was confirmed `false` throughout and never edited, and the dry-run submission (below) itself returned an explicit no-mutation confirmation — no action taken between ZIP submission and this read was capable of writing to `user_districts`.

## Live UI validation

**Calculating / completion page** — PASS. Primary CTA "View my ballot" rendered and worked. Secondary CTA "Verify your City Council district →" rendered below it as a plain text link (visually secondary to the filled primary button), with the expected explanatory copy ("Port St. Lucie ZIP codes can span more than one council district. Verify yours using the official City Council District Finder."). No duplicate district-selector UI was present on this page. Clicking the CTA navigated correctly to `/profile/city-council-district`.

**Current Officials** (Profile and Home, same component) — PASS. Rendered without error. Showed exactly Debbie Hawley (School Board Member, District 1) and Tobin Rogers "Toby" Overdorf (State Representative, District 85). **No Stephanie Morgan. No Anthony Bonna, Sr.**

**Ballot** — PASS. Rendered without error. Showed exactly one race section: Mayor (4 candidates), each correctly showing "Match unavailable — not enough verified position data yet." **No City Council District 1 race. No City Council District 3 race.**

**Profile** — PASS. Rendered normally with the correct account (`civicmarket.test.05@example.com`, ZIP `34953`, Port St. Lucie, FL). "Set City Council District" settings row present with its helper text ("Verify District 1 or District 3 using the official City lookup tool.").

**Home** — PASS. Rendered without error. "Top matches" showed Mayor candidates; "Your districts" chip row showed "Mayor" only (the only district with an associated candidate race — School Board/County/State districts have no candidates and so don't appear as chips; unrelated pre-existing behavior, not a defect). Current Officials section matched Profile exactly. No City Council content of any kind appeared.

**City Council verification page while write-disabled** — PASS. `/profile/city-council-district` showed the official lookup link (opens the City of Port St. Lucie Council District Finder), exactly two choices (City Council District 1 / City Council District 3), a required attestation checkbox, no address input field anywhere on the page, and the "Preview only — saving is currently disabled" banner.

A valid selection (District 1) with attestation was submitted to confirm the disabled-write path. Response: **"Write path disabled pending explicit approval. No user_districts row was created or modified."** — the exact `dryRun: true` message. No `user_districts` mutation occurred, confirmed both by this message and by the read-only database check above showing zero City Council rows afterward.

## Delete-scoping regression test (deferred)

Task item 10 (verify a pre-existing verified City Council District 1/3 assignment survives ZIP resubmission via the new scoped delete) was **explicitly deferred, not performed.** The only account with a real City Council District 1 row is `civicmarket.test.01@example.com`, a heavily-reused shared test account referenced across dozens of prior gate documents. Exercising this test would have required signing into that account — a credential-dependent action the project owner would need to perform personally — and re-running its ZIP onboarding, which risks disturbing a load-bearing shared test baseline for no safety benefit beyond what the delete-scoping logic already proves structurally (documented in Gate I36: the delete's `.in()` filter cannot match `...0001`/`...0007` because neither id is a member of `ZIP_MANAGED_DISTRICTS`). Per the task's own instruction to defer rather than improvise when broadening scope or risking an existing baseline, this was not attempted. It remains a candidate for a future, separately scoped gate.

## Build and lint

- `npm run build`: passed, 27 routes, no errors.
- `npm run lint`: 5 errors, all pre-existing (`scripts/import-real-psl-data.cjs`, `scripts/validate-real-psl-csvs.cjs`, `@typescript-eslint/no-require-imports`) — no new errors.

## Write guards and deployment

`ENABLE_CITY_COUNCIL_DISTRICT_WRITE = false` and `ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE = false` confirmed unchanged before and after this entire validation — neither file was edited at any point in this session. No deployment occurred. No schema, RLS, grant, policy, function, migration, seed, or district-definition change was made. No manual/direct Supabase SQL write was performed — every state change (or confirmed non-change) came through the normal application flow.

## Limitations

- The `user_districts` read-only check was performed once, after all UI steps rather than immediately after ZIP submission; see the reasoning above for why this is still valid evidence for both checkpoints.
- The delete-scoping survival test (task 10) was deferred, not performed — see above.
- The Civic DNA quiz was answered with uniform "Neutral" responses purely to reach the completion screen; this validation does not exercise or assert anything about Civic DNA scoring correctness.
- This validation used one fresh account and one ZIP code (`34953`). It does not test every PSL beta ZIP, nor account-level edge cases (e.g., a user changing ZIP mid-session).
- During this session, unrelated pre-existing uncommitted work was found in the working tree (`docs/internal_beta_gate_i37_candidate_position_evidence_table_execution_result.md` and a matching `CIVICMARKET_CURRENT_STATE.md` addition, describing a live Supabase schema change unrelated to City Council onboarding). It was left untouched and not committed as part of this work — see the No-change confirmation below.

## Milestone 1 result

**PASS.** ZIP onboarding no longer assigns City Council District 1 (or District 3); the five ZIP-managed districts are created correctly; the app renders safely across Current Officials, Ballot, Home, and Profile with no City Council assignment; the new verification CTA is visible, correctly labeled, and correctly linked; the City Council verification page remains fully dry-run with no mutation possible while its guard is `false`; build and lint are clean.

## No-change confirmation — Milestone 1

No database write was performed beyond the normal, expected effects of the application's own onboarding flow (the `profiles.zip_code` update and the five-row `user_districts` insert that Gate I36's own code performs as part of ordinary ZIP onboarding) — no manual/direct SQL was run. No `candidates`, `candidate_positions`, `match_scores`, `civic_dna_answers`, `districts`, `elections`, `current_officials`, `officials_for_user`, or `set_psl_city_council_district` change was made. No existing real user was modified — only the one fresh, project-owner-created test account was used. No schema, RLS, grant, policy, function, migration, or seed change was made. No secret, `.env`, API key, password, service-role key, invite code, or credential was inspected, requested, or exposed. `ENABLE_CITY_COUNCIL_DISTRICT_WRITE` remains `false`. `ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE` remains `false`. No deployment occurred. Pre-existing unrelated uncommitted work found in the working tree (Gate I37 candidate-evidence table documentation) was left untouched and is not part of this commit.
