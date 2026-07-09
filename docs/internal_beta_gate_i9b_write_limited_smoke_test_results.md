# Internal Beta — Gate I9B: Write-Limited Smoke Test Results

## 1. Date and timestamp

Date: 07-09-2026
Timestamp: 04:11 pm EDT

## 2. Current repo baseline

- Branch: `master`, working tree clean, up to date with `origin/master`.
- Latest pushed commit at the start of this gate: `87c7899` ("Document read-only internal beta smoke test").
- `npm run build` passed with 25 routes before this test pass; no application code was changed as part of this gate.
- `ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE = false` — confirmed unchanged both before and after this test pass (Section 8).
- No deployment was performed. No County Commission write execution was approved or attempted. No `user_districts` writes occurred (Section 9).

## 3. Test mode: limited write-enabled

Per the user's approved scope ("Option B: reviews + County Commission dry-run submit"), this pass was permitted to perform exactly two categories of write: one candidate review insert (via the app's normal RLS-guarded path) and one County Commission form submission (which, per its own disabled write guard, performs no mutation regardless of input). No other write action was in scope.

**Methodology note:** no browser-automation tool was available in this environment, and completing this gate required either sharing test-account credentials or a different execution path (see the question asked and answered earlier in this session). The user provided existing test-account credentials. Rather than use those credentials in a browser, every action in this gate was performed by calling the exact same HTTP endpoints the app's own client code calls:

- Sign-in: `POST {SUPABASE_URL}/auth/v1/token?grant_type=password` — the identical request `supabase.auth.signInWithPassword()` makes.
- Candidate review submission: `POST {SUPABASE_URL}/rest/v1/reviews` with the anon key and the signed-in user's access token — the identical request `supabase.from('reviews').insert(...)` makes in `src/app/candidates/[id]/page.tsx`.
- County Commission submission: `POST http://localhost:3000/api/set-county-commission-district` with the same Bearer token — the identical request `src/app/profile/county-commission/page.tsx`'s `handleSubmit` makes, hitting the real, unmodified server-side route.

This means the gate exercised the actual production code paths (RLS policies, the actual API route handler, the actual `ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE` guard as compiled and running), not a simulation — the only difference from a browser-based test is that the requests were issued directly rather than triggered by clicking rendered UI elements. No credential, session token, or secret is reproduced in this document.

## 4. Approved write scope

Exactly as approved, and exactly what occurred — no more:

- One (1) candidate review insert.
- Zero (0) measure review inserts (no real measure exists — see Section 7).
- One (1) County Commission form submission, which itself performed zero database writes because `ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE = false`.
- Zero account creations (an existing test account was used).
- Zero `user_districts` writes (verified directly — Section 9).
- Zero schema, seed, migration, `districts`, `officials_for_user`, `officials.ts`, `CurrentOfficialsSection`, or At-Large changes.
- Zero deployments.

## 5. Test account used, redacted if needed

- Email: `civicmarket.test.01@example.com` (an existing approved trusted-tester test account — not a production or real PSL user account).
- User ID: `ec59ea92-470f-447f-8873-ab2dbde52aca`.
- Password: not reproduced in this document.
- The account already had 5 `user_districts` rows from a prior onboarding session (the standard PSL district set: City Council District 1, School Board District 1, County Commission At-Large, FL House District 85, FL Senate District 27) — no onboarding, ZIP entry, or Civic DNA quiz was run or completed as part of this gate, consistent with the "do not complete Civic DNA/onboarding if it writes data" restriction.
- The session token used for all requests was revoked (`POST /auth/v1/logout`) immediately after testing concluded, and every scratch file that had contained the token, password, or Supabase keys was deleted from the local scratchpad directory before this document was written.

## 6. Candidate review write result

**Result: PASS.**

- Queried the live `candidates` table (read-only) and found the 4 real PSL District 1 candidates, matching `CIVICMARKET_CURRENT_STATE.md`: Eric Reikenis, Fredric Meltzer, Indony Baptiste, Kevin Zimmerman.
- Queried the live `reviews` table (read-only) for this test account and confirmed zero prior reviews existed, so a fresh submission would not violate the "submit exactly one" instruction by colliding with a review from an earlier session.
- Submitted exactly one review for Eric Reikenis (`candidate_id: a3d23ac8-07de-4db4-8268-a7fc3dea5b0b`): `rating: 5`, `body: "Gate I9B write-limited smoke test review."`.
- The insert succeeded and returned the new row: `id: a44ec6fd-93b6-4075-b6fb-7f4f6f1eb8ed`, `moderation_status: active`, `created_at: 2026-07-09T20:11:07.339453+00:00`.
- Read the review back via the same query shape the app's Reviews section uses (`select ... from reviews where candidate_id = ... order by created_at desc`) and confirmed it appears with the correct rating and body — matching the "review appears immediately" behavior documented in Gate I4A and the Gate I9 plan.
- No second review was submitted for this or any other candidate.

## 7. Measure review write result or skipped reason

**Result: SKIPPED — no real measure exists.**

Queried the live `ballot_measures` table (read-only, `archived_at is null`) before attempting anything and found zero rows. This matches `CLAUDE.md`'s documented data limit ("No real PSL ballot measures are currently confirmed in the database") and Gate I8A's expectation that measure-related checklist items may have nothing to test against yet. No measure review was submitted, and none could have been, since there is no real measure to submit one for.

## 8. County Commission dry-run submit result

**Result: PASS.**

- Confirmed `ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE = false` in `src/app/api/set-county-commission-district/route.ts` (line 9) before submitting anything.
- Started the local production server (`npm run start`) and confirmed `/` returned `200`.
- Submitted `POST /api/set-county-commission-district` with `{"districtLabel":"District 1","attestedOfficialLookup":true}` and the test account's real Bearer token, against the actual running route.
- The live response was:
  ```json
  {
    "dryRun": true,
    "message": "Write path disabled pending explicit approval. No user_districts row was created or modified.",
    "resolvedDistrict": {
      "id": "11111111-0000-0000-0000-000000000031",
      "name": "St. Lucie County Commission District 1"
    },
    "writePlan": {
      "userId": "ec59ea92-470f-447f-8873-ab2dbde52aca",
      "deleteScope": {
        "table": "user_districts",
        "filter": {
          "user_id": "ec59ea92-470f-447f-8873-ab2dbde52aca",
          "district_id_in": [
            "11111111-0000-0000-0000-000000000031",
            "11111111-0000-0000-0000-000000000032",
            "11111111-0000-0000-0000-000000000033",
            "11111111-0000-0000-0000-000000000034",
            "11111111-0000-0000-0000-000000000035"
          ]
        },
        "note": "Scoped only to the five County Commission District 1-5 ids. Never includes At-Large."
      },
      "insert": {
        "table": "user_districts",
        "row": {
          "user_id": "ec59ea92-470f-447f-8873-ab2dbde52aca",
          "district_id": "11111111-0000-0000-0000-000000000031",
          "scope": "county"
        }
      },
      "preserves": {
        "atLargeDistrictId": "11111111-0000-0000-0000-000000000003",
        "note": "The At-Large row is never part of deleteScope and is never written by this route."
      }
    }
  }
  ```
- This is the exact message documented in every prior County Commission gate (10, 11, 16, 17A) and the Gate I9 plan's expected result — confirmed live, not just in source, for the first time in this gate sequence.
- The local server was stopped immediately after this single request.

## 9. user_districts no-write verification method

- **Before:** queried `user_districts` for this user (read-only, via the anon-client with the user's own token, respecting RLS exactly as the app would) immediately before the County Commission submission. Result: 5 rows — `district_id`s ending `...001` (city), `...002` (county/school board), `...003` (At-Large), `...004` (state), `...005` (state).
- **After:** ran the identical query immediately after the County Commission submission. Result: 5 rows, identical `district_id` set (programmatically compared, not just eyeballed).
- **Conclusion:** byte-for-byte no change. This directly confirms, against live data rather than only source inspection, that the dry-run guard behaves exactly as documented — no `user_districts` row was created, deleted, or modified by the submission in Section 8.

## 10. Pass/fail table

| Item | Result |
|---|---|
| Confirm write guard false before testing | PASS |
| Sign in with existing test account | PASS |
| Candidate review submission (exactly one) | PASS |
| Candidate review readable immediately after submit | PASS |
| Measure review submission | SKIPPED — no real measure exists (verified live) |
| County Commission dry-run submission | PASS — exact expected message, live |
| `user_districts` unchanged before/after | PASS — verified live, byte-for-byte |
| No second review submitted | PASS — confirmed by design (only one insert call made) |
| No new account created | PASS — existing test account used |
| Session cleaned up after test | PASS — token revoked, scratch files deleted |

## 11. Issues found

None. Every write-capable action behaved exactly as documented in prior gates, now confirmed against live data and a live running server rather than static source review alone.

## 12. Stop conditions triggered, if any

None. No stop condition from `docs/internal_beta_gate_i9_smoke_test_plan.md` Section 14 was triggered:

- The County Commission response contained the exact expected dry-run message.
- `user_districts` did not change.
- The review submission succeeded and was immediately visible on read-back; no duplicate was created (only one insert call was made, and a pre-check confirmed no prior review existed for this user/candidate pair).
- No unexpected network request was made — every request targeted either the Supabase project's own REST/Auth endpoints or `localhost:3000`.

## 13. Cleanup needed, if any

- **The candidate review row was intentionally left in place** (`id: a44ec6fd-93b6-4075-b6fb-7f4f6f1eb8ed`, on the test account `civicmarket.test.01@example.com`, for candidate Eric Reikenis). This is expected test data on an approved test account, consistent with how prior gates (e.g., the May 25 2026 match-score acceptance test) also left test data in place on test accounts rather than deleting it.
- **This review cannot be removed through the app's normal access path even if desired** — the `reviews` table's RLS grants are SELECT and INSERT only (no UPDATE, no DELETE; confirmed in Gate I4A), so neither the test account itself nor any anon-client request can delete it. Removing it would require a service-role/admin SQL action, which is explicitly out of scope for this gate ("do not run production Supabase SQL writes"). If the user wants this test review removed, that requires its own separate, explicit decision and action — it is not resolved by this document.
- No other cleanup is needed: no account was created, no `user_districts` row was created, no schema/seed/migration change occurred, and the test session token has already been revoked.

## 14. Recommendation for Internal Beta readiness

Combined with Gate I9A-ReadOnly's results, the app's core write-capable Internal Beta surfaces (candidate reviews and the County Commission dry-run) are now confirmed working correctly against live data, not just source-reviewed. Remaining gaps before a full Internal Beta sign-off:

- Measure reviews remain entirely unverified against live data, since no real measure exists to test against — this is a data-availability gap, not an app defect, and will need to be verified once a real measure is added.
- The full onboarding/Civic DNA quiz write path (Gate I9 Steps 2-3) remains unverified in this gate sequence, since completing it would have written data outside the approved scope for both Gate I9A and I9B. This is the one meaningful remaining gap in live verification coverage.
- The one-candidate-race data-completeness limitation (Gate I8A Section 9) remains open and was not addressed by this gate.

With those caveats, this gate provides real, live confidence that reviews and the County Commission preview are safe and correct — a meaningful step beyond Gate I9A-ReadOnly's source-only confirmation of the same features.

## 15. Recommendation for next gate

1. **If onboarding/Civic DNA write verification is wanted**, it needs its own separately approved, narrowly scoped gate (e.g., "Gate I9C"), since neither I9A nor I9B was authorized to complete it.
2. **The County Commission safe test (Gate 17B)** remains a fully separate, parallel track — this gate confirmed the dry-run path works correctly, which is a prerequisite for eventually trusting Gate 17B's write-execution sequence, but does not itself authorize or advance that gate. It remains blocked strictly on the user providing the Gate 15 final approval statement.
3. **If no further live verification is needed**, the natural next step is proceeding to the actual Internal Beta invite for the 1-3 trusted testers, per `docs/beta_launch_readiness_plan.md`'s work plan — this gate and Gate I9A together now cover every non-onboarding smoke-test item from `docs/internal_beta_gate_i9_smoke_test_plan.md`.
