# Internal Beta — Gate I9A-ReadOnly: Smoke Test Execution Results

## 1. Date and timestamp

Date: 07-09-2026
Timestamp: 03:55 pm EDT

## 2. Current repo baseline

- Branch: `master`, working tree clean, up to date with `origin/master`.
- Latest pushed commit: `d979d30` ("Add internal beta smoke test plan").
- `npm run build` passed with 25 routes before and after this test pass — no code was changed by this gate.
- `ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE = false`, County Commission District 1-5 remains dry-run only — unchanged, not touched by this document.
- No deployment was performed. No Supabase production writes occurred.

## 3. Test mode: read-only

Per user approval ("run read-only smoke test before write-enabled review submission smoke test"), this pass covered only the non-write portions of `docs/internal_beta_gate_i9_smoke_test_plan.md`. Candidate review submission, measure review submission, account creation, profile modification, Civic DNA completion, and any other Supabase-write action were explicitly excluded and not attempted. A follow-up write-enabled pass (Gate I9B) is required to cover those steps — see Section 15.

## 4. What was tested

Two methods, both non-write:

1. **Local production server + read-only HTTP GET requests (`curl`).** Ran `npm run build` then `npm run start`, and issued GET requests to every route in scope. GET is inherently read-only — no form was submitted, no button was clicked, no cookie or session was established beyond what an anonymous page load creates. The server was stopped immediately after these checks completed (Section 4 confirms the process was killed, not left running).
2. **Source-code verification (`grep`/file inspection).** For behavior that requires an authenticated session to observe live (the dashboard-style pages, the review UI, the County Commission form), the underlying source was inspected directly to confirm the exact expected strings, routes, and guard values are present and unchanged from what prior gates (I3-I8A) documented.

## 5. What was skipped because it would write data

Per the read-only scope, the following Gate I9 checklist items were **not** run:

- Step 2 (sign in / account creation) — not attempted; no account was created or signed into.
- Step 3 (onboarding/DNA path) — not attempted; ZIP entry, district confirmation, and quiz submission all write to Supabase (`profiles`, `user_districts`, `civic_dna_answers`, `civic_dna`).
- Step 7 (submit candidate review) — not attempted; explicitly excluded per this gate's instructions.
- Step 9 (submit measure review) — not attempted; explicitly excluded per this gate's instructions.
- Step 17's actual form submission (County Commission) — not attempted live; verified by source inspection only (Section 9), since even though the route is dry-run-only and provably safe, this gate's instructions listed "do not click any action that writes to Supabase" as a blanket rule and the safest reading is to not submit the form at all in this pass, relying on source verification instead.
- Section 11's "second test account" cross-visibility check — not attempted; requires two accounts and at least one submitted review.
- Section 10's "confirm all 4 real PSL candidates appear" — attempted as a read-only route check, not a full authenticated walkthrough, since no test account credentials were available or usable in this pass (Section 6 below).

## 6. Route/page checklist

All routes returned a real page response, not a server error, from a locally running production build:

| Route | HTTP status |
|---|---|
| `/` | 200 |
| `/onboarding` | 200 |
| `/ballot` | 200 |
| `/profile` | 200 |
| `/profile/county-commission` | 200 |
| `/vote` | 200 |
| `/report` | 200 |
| `/terms` | 200 |
| `/privacy` | 200 |
| `/corrections` | 200 |
| `/data-sources` | 200 |

**Important caveat:** `/ballot`, `/profile`, `/profile/county-commission`, and `/vote` are client components that check the Supabase session in a `useEffect` and redirect to `/onboarding` if no session exists. A plain `curl` GET receives the initial server-rendered HTML shell (200, no server error) but does not execute that client-side redirect or render the authenticated content — it only confirms there is no server-side crash on first load. This is why no account was signed into for this pass: verifying the actual authenticated experience for these routes requires either a real test account (Section 6 of the Gate I9 plan) or a headless-browser session, neither of which this read-only pass was scoped or credentialed to use. Direct navigation to `/candidates/[id]` and `/measures/[id]` was not checked via curl since both require a real id.

## 7. Candidate review read-only verification

Confirmed present in `src/app/candidates/[id]/page.tsx` by source inspection (no submission attempted):

- "Community Reviews" heading and explainer line linking to "Corrections Policy" (`/corrections`) — present.
- The "already reviewed" friendly message text ("You've already reviewed this candidate. Thanks for sharing your thoughts!") — present in the code path that renders when a user's own review is found.
- The existing "Report an Inaccuracy" link to `/report` — present, unchanged from before the Reviews feature was added.

No review was submitted. No `reviews` table row was created or read live.

## 8. Measure review read-only verification

Confirmed present in `src/app/measures/[id]/page.tsx` by source inspection (no submission attempted):

- "Community Reviews" heading and explainer line linking to "Corrections Policy" — present, matching the candidate page pattern.
- The "already reviewed" friendly message text ("You've already reviewed this measure. Thanks for sharing your thoughts!") — present.
- The "Report an Inaccuracy" mailto link (`mailto:inaccuracy@civicmarket.app?subject=...`) — present, with the measure title interpolated into the subject via `encodeURIComponent`.

No review was submitted. No `reviews` table row was created or read live.

## 9. County Commission preview-only verification

Confirmed by source inspection only — the form was not submitted live in this pass:

- `src/app/api/set-county-commission-district/route.ts` line 9: `const ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE = false` — confirmed unchanged.
- Line 141: the dry-run response message is exactly `'Write path disabled pending explicit approval. No user_districts row was created or modified.'` — confirmed present, matching the string documented in every prior County Commission gate (10, 11, 16, 17A) and the Gate I9 plan's expected result.
- `src/app/profile/county-commission/page.tsx` line 132: the header line "Preview only — saving is currently disabled" — confirmed present (added in Gate I6).
- The five district options (`District 1` through `District 5`), the `attested` checkbox state, and `canSubmit = selectedDistrict !== '' && attested && state !== 'loading'` (submit disabled until both are set) — all confirmed present in the component source.
- `src/app/profile/page.tsx` line 258: the Settings row helper text "Preview only — saving is disabled until the team explicitly enables it." — confirmed present (added in Gate I6).

Since the form was not submitted, the live response was not observed directly in this pass — this section confirms the guard and messaging are correct in source, which is a stronger and more direct check than clicking through, since it rules out the possibility of a UI showing one thing while a different code path executes.

## 10. Data-completeness read-only verification

- Confirmed `hasRequiredCandidateFields` exists in `src/lib/candidates.ts` and `hasRequiredMeasureFields` exists in `src/lib/measures.ts` (both located via `grep`), matching Gate I8A's documented implementation.
- `/ballot` returned `200` from the local server (Section 6), confirming no server-side crash from the completeness-filtering logic added in Gate I8.
- A full authenticated check of which candidates actually render on `/ballot` was not performed in this pass, since that requires a signed-in session (Section 6's caveat). This remains an item for Gate I9B or a dedicated follow-up, not resolved here.

## 11. Links and legal pages verification

All four static, unauthenticated pages were fetched directly and their expected content confirmed present in the server-rendered HTML (not just assumed from source):

| Page | Expected content | Found |
|---|---|---|
| `/corrections` | "Corrections Policy" heading | Yes |
| `/corrections` | `inaccuracy@civicmarket.app` contact link | Yes |
| `/terms` | "Terms of Service" heading | Yes |
| `/privacy` | "Privacy Policy" heading | Yes |
| `/data-sources` | "Data Sources" heading | Yes |

This is a stronger verification than the route-status check in Section 6, since it confirms actual page content rendered server-side, not just a non-error HTTP status.

## 12. Pass/fail table

| Gate I9 step | Read-only result |
|---|---|
| 1. Open app locally | PASS — server started, root route returned 200 |
| 2. Sign in | SKIPPED — write action |
| 3. Onboarding/DNA path | SKIPPED — write action |
| 4. Home | PARTIAL PASS — route returns 200; full authenticated render not observed |
| 5. Ballot | PARTIAL PASS — route returns 200; full authenticated render not observed |
| 6. Candidate profile | NOT RUN — requires a real candidate id and, practically, a session |
| 7. Submit candidate review | SKIPPED — write action |
| 8. Measure profile | NOT RUN — same as Step 6 |
| 9. Submit measure review | SKIPPED — write action |
| 10. Profile | PARTIAL PASS — route returns 200; content verified by source inspection (Section 9) |
| 11. Vote | PARTIAL PASS — route returns 200; full authenticated render not observed |
| 12. Data Sources | PASS — content verified in rendered HTML |
| 13. Corrections | PASS — content verified in rendered HTML |
| 14. Terms | PASS — content verified in rendered HTML |
| 15. Privacy | PASS — content verified in rendered HTML |
| 16. Report Inaccuracy links | PASS (source-verified) — both link targets confirmed present and correctly formed |
| 17. County Commission preview-only state | PASS (source-verified) — guard, message, and UI states all confirmed correct in source; live submission not attempted |

"PARTIAL PASS" means: no server error was found, and no evidence of a problem was found, but the specific behavior described in the Gate I9 step (e.g., "Top matches" rendering candidate cards) could not be directly observed without an authenticated session, so it is not being reported as a full PASS.

## 13. Issues found

None. No blank white screens, no non-200 responses, no missing expected content, and no source-level mismatch between documented behavior (from Gates I3-I8A) and the current code were found in this pass.

## 14. Stop conditions triggered, if any

None of the Gate I9 Section 14 stop conditions were triggered:

- No blank white screen was observed on any tested route.
- No unexpected non-200 status was returned.
- The County Commission dry-run message matches exactly, per source inspection.
- No review submission was attempted, so duplicate-review and post-reload-visibility checks are not applicable to this pass.
- No data-completeness violation was found in the routes checked (full authenticated confirmation deferred to Gate I9B).
- No evidence of any Supabase write occurring — this pass made zero write-capable requests (all requests were plain GETs against a locally running server, and the server process was stopped immediately after use).
- No unexpected outbound network request was made; all requests were to `localhost:3000`.

## 15. Recommendation for Gate I9B write-enabled review smoke test

This read-only pass found no issues and gives reasonable confidence that the static, public-facing, and source-level aspects of the app are in the state prior gates documented. It does **not** substitute for an authenticated walkthrough — Steps 2, 3, 6, 7, 8, 9, and the full content of Steps 4/5/10/11 in the Gate I9 plan still require a real signed-in test account to verify directly, since a client-side session redirect cannot be observed via `curl`.

Recommended next steps, in order:

1. **Gate I9B (write-enabled review smoke test):** using an approved trusted-tester test account (not a production account), run the remaining Gate I9 steps that require authentication and/or a write — sign-in, onboarding/DNA (if the account is fresh), candidate profile, candidate review submission, measure profile (if a real measure exists), measure review submission, and a live County Commission form submission to directly observe the dry-run response rather than relying on source inspection alone. This requires its own explicit go-ahead, consistent with `docs/internal_beta_gate_i9_smoke_test_plan.md` Section 13's "running this checklist requires its own separate go-ahead."
2. The County Commission safe test (Gate 17B) remains a fully separate, parallel track, still blocked strictly on the user providing the Gate 15 final approval statement — unaffected by this document.
3. If Gate I9B also passes cleanly, the natural next step is the actual Internal Beta invite to the 1-3 trusted testers, per `docs/beta_launch_readiness_plan.md`'s work plan.
