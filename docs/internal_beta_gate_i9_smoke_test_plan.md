# Internal Beta — Gate I9: Smoke Test Plan

## 1. Date and timestamp

Date: 07-09-2026
Timestamp: 03:42 pm EDT

This document is planning only. It does not implement changes, run Supabase writes, deploy anything, or touch the County Commission write guard.

## 2. Current repo baseline

- Branch: `master`, working tree clean, up to date with `origin/master`.
- Latest pushed commit: `789e047` ("Document data completeness verification").
- `npm run build` passed with 25 routes at that baseline.
- Civic DNA, match scores, candidate reviews, measure reviews, Corrections/Terms/Privacy/Data Sources/Report pages, candidate and measure Report Inaccuracy links, and data-completeness hiding are all implemented and documented (Gates I1-I8A). The UI polish pass (Gate I6) is complete.
- `ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE = false`, County Commission District 1-5 remains dry-run only — unchanged, not touched by this document.
- No deployment has been approved. No Supabase production writes are approved.

## 3. Internal Beta goal

Per `docs/beta_launch_readiness_plan.md`: prove the core app flow with 1-3 trusted testers before any real PSL user sees the app. This gate exists to produce the actual checklist that will be run, once execution is separately approved, to confirm the app is genuinely ready for those testers — not to run it yet.

## 4. What is ready for smoke testing

Everything built across Gates I1-I8A, per this document's confirmed baseline:

- Onboarding (welcome → signup → ZIP → districts → DNA teaser → quiz → calculating).
- Home, Ballot, Candidate profile, Measure profile, Vote, Profile.
- Candidate and measure review submission and display.
- Corrections, Terms, Privacy, Data Sources pages.
- Candidate Report Inaccuracy link (`/report`) and measure Report Inaccuracy link (mailto).
- Data-completeness hiding (candidates/measures missing required fields are filtered from lists and direct URLs).
- The County Commission District page, reachable from Profile Settings, in its dry-run-only state.

## 5. Known accepted Internal Beta limitations

Carried forward from prior gates, restated here so a tester or reviewer running this checklist doesn't mistake a documented limitation for a new bug:

- Reviews show "You" or "Community member" only — no real display names, by design (Gate I4A/I5A, RLS is self-only on `profiles`).
- Reviews have no edit, delete, or flagging UI, and duplicate prevention is app-level only (a fast double-submit or two-tab race could theoretically produce two reviews from one user) — accepted for Internal Beta scale (Gate I4A/I5A).
- Match score rings are locked for candidates with no `candidate_positions` data — this is the documented, intentional data-availability limit (`CLAUDE.md`), not a bug.
- No real PSL ballot measures are confirmed yet, so the measure-related checklist items may have nothing to test against until one exists.
- Voting records remain intentionally empty for the 4 real District 1 candidates (all non-incumbents, no verified vote history yet).
- A one-candidate race after data-completeness filtering is a known, documented, unresolved limitation (Gate I8A) — not something this smoke test is expected to catch or fix.
- The County Commission District page always returns a dry-run response and never saves anything, regardless of what is selected or submitted.

## 6. Smoke test account assumptions

- The test account(s) used must be from the approved trusted-tester pool, not a production PSL user account.
- At least one test account should already have a completed Civic DNA quiz (to test match-score display, Ballot rings, and Profile's Civic DNA section without re-taking the quiz each run) — a second, fresh account without a completed quiz is useful for testing the "take the quiz" nudge states, but is not required for every run of this checklist.
- The invite code used must be the current valid `INVITE_CODE` value (hardcoded env var, per `docs/beta_launch_readiness_plan.md` Section 5) — this document does not restate that value.
- No production user account, and no real PSL resident's account, should ever be used to run this checklist.

## 7. Pre-test setup checklist

Before running the click-by-click checklist:

- [ ] Confirm `git status` is clean and the branch matches the latest pushed commit intended for this test run.
- [ ] Run `npm run build` and confirm it passes with no errors.
- [ ] Start the local dev server (`npm run dev` or equivalent) and confirm it starts without error.
- [ ] Confirm `.env.local` has the required Supabase and invite-code variables set for the environment being tested (local/dev, not production, unless a production smoke test has been separately approved).
- [ ] Confirm the test account(s) from Section 6 exist and are reachable.
- [ ] Have a note-taking method ready (this checklist, plus space for freeform notes) to record anything unexpected, even if it doesn't obviously map to a listed step.

## 8. Click-by-click smoke test checklist

Each step should be run in order, on a real device or a mobile-width browser window, since the app is mobile-first.

1. **Open app locally.** Load the app's local URL. Confirm the page loads without a blank screen or console error.
2. **Sign in or confirm signed-in state.** If not signed in, go through `/onboarding` → `/onboarding/signup`, enter the invite code and credentials, and confirm either a session is created or the "check your inbox" confirmation-pending state appears correctly. If already signed in from a prior run, confirm the session is still valid by loading `/profile`.
3. **Onboarding/DNA path.** For a fresh account: complete ZIP entry (`/onboarding/zip`) with a valid PSL ZIP, confirm districts are found (`/onboarding/districts`), proceed through the DNA teaser (`/onboarding/dna-teaser`) and quiz (`/onboarding/quiz`), and confirm the calculating screen (`/onboarding/calculating`) completes and redirects into the app.
4. **Home page.** Confirm `/` loads: hero, election countdown, "Top matches" (with the new match-score clarifying line), "Your districts," My Current Officials, Civic feed, and the beta disclaimer all render without a blank white gap.
5. **Ballot page.** Confirm `/ballot` loads: filter chips work, candidates are grouped by district, the match-score clarifying caption is visible, and (if any real measure exists) the Measures section renders.
6. **Candidate profile.** Tap into a candidate from the ballot. Confirm the profile loads: tab bar (Overview/Voting/Funding/Details/Reviews), match score ring (locked or scored), bio if present, voting record section, funding section, and the beta disclaimer.
7. **Submit candidate review.** Scroll to or tap the Reviews tab. Confirm the Community Reviews explainer line and Corrections Policy link are visible. Select a star rating, optionally add a body, and submit. Confirm the review appears immediately and the form is replaced by the "already reviewed" message on a second visit to the same candidate.
8. **Measure profile.** If a real measure exists, tap into it from the ballot. Confirm the profile loads: type tag, plain-English summary, full text link, Civic DNA Impact scores (or "No scoring data yet."), and the beta disclaimer.
9. **Submit measure review.** Scroll to the Community Reviews section on the measure page. Confirm the same explainer/Corrections link pattern as candidates. Select a rating, optionally add a body, and submit. Confirm the same immediate-display and "already reviewed" behavior as Step 7.
10. **Profile page.** Confirm `/profile` loads: identity card, Settings (including "Set County Commission District" with its "Preview only — saving is disabled..." helper text), Account details, Civic DNA section (scores or quiz nudge), My Current Officials, and the read-only beta disclaimer. Confirm sign-out is visible and functional.
11. **Vote page.** Confirm `/vote` loads: upcoming elections (if any exist for the account's districts) and Official Resources links (St. Lucie County Elections, Florida Voter Registration), both opening in a new tab.
12. **Data Sources page.** Confirm `/data-sources` loads with its methodology sections.
13. **Corrections page.** Confirm `/corrections` loads with the six required sections (reporting, what to include, how corrections are reviewed, community reviews vs. corrections, match scores are not endorsements, contact) and the `inaccuracy@civicmarket.app` mailto link.
14. **Terms page.** Confirm `/terms` loads with the beta-draft notice and all documented sections.
15. **Privacy page.** Confirm `/privacy` loads with the beta-draft notice and all documented sections.
16. **Report Inaccuracy links.** From a candidate profile, confirm "Report an Inaccuracy" navigates to `/report` and the UI-shell submit flow works. From a measure profile, confirm "Report an Inaccuracy" opens a mailto link with the measure's title pre-filled in the subject.
17. **County Commission page preview-only state.** From Profile Settings, tap "Set County Commission District." Confirm the "Preview only — saving is currently disabled" line is visible in the header, the official lookup tool link opens in a new tab, the five district options and attestation checkbox are selectable, the submit button stays disabled until both are set, and submitting shows the exact message "Write path disabled pending explicit approval. No user_districts row was created or modified." Confirm no district was actually saved (no visible change to My Current Officials afterward).

## 9. Expected pass/fail results

| Step | Expected result |
|---|---|
| 1. Open app | PASS — loads without blank screen |
| 2. Sign in | PASS — session established or confirmation-pending state shown |
| 3. Onboarding/DNA | PASS — completes and redirects |
| 4. Home | PASS — all sections render, no blank gaps |
| 5. Ballot | PASS — filter chips and grouped races work |
| 6. Candidate profile | PASS — all tabs render |
| 7. Submit candidate review | PASS — appears immediately, duplicate blocked |
| 8. Measure profile | PASS if a real measure exists — otherwise this step has nothing to test against (Section 5) |
| 9. Submit measure review | Same conditional as Step 8 |
| 10. Profile | PASS — all sections render including updated County Commission helper text |
| 11. Vote | PASS — official links open correctly |
| 12. Data Sources | PASS |
| 13. Corrections | PASS |
| 14. Terms | PASS |
| 15. Privacy | PASS |
| 16. Report Inaccuracy links | PASS — both candidate (in-app) and measure (mailto) variants work |
| 17. County Commission preview | PASS — dry-run message shown, nothing saved |

Any result other than PASS (or the documented conditional for Steps 8-9) should be treated as a stop condition per Section 14, not silently noted and continued past.

## 10. Data-completeness spot-checks

Beyond the main checklist, specifically re-confirming Gate I8/I8A behavior:

- [ ] Confirm all 4 real PSL District 1 candidates appear on `/ballot` and Home's "Top matches," unchanged from before data-completeness hiding was added.
- [ ] If a test/incomplete candidate exists in the environment being tested, confirm it does **not** appear on `/ballot` and that direct navigation to its profile URL shows "Candidate not found."
- [ ] Confirm a candidate with no `candidate_positions` still shows a locked match-score ring, not a hidden card.

## 11. Review feature spot-checks

Beyond Steps 7 and 9 of the main checklist:

- [ ] Using a second test account, confirm the first account's review is visible and labeled "Community member" (not the first account's real name or "You").
- [ ] Confirm the submit button on both the candidate and measure review forms stays disabled until a star rating is selected.
- [ ] Confirm no address, email, or other PII beyond the "You"/"Community member" label appears on any review.

## 12. County Commission preview-only checks

Beyond Step 17 of the main checklist:

- [ ] Confirm `ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE` is `false` in the deployed/running code being tested (spot-check the source, not just the UI behavior).
- [ ] Confirm submitting the County Commission form does not change anything visible on `/profile`'s My Current Officials section.
- [ ] Confirm no error occurs if the form is submitted multiple times in a row (each submission should independently return the same dry-run message).

## 13. No-write/no-deploy boundaries

The following apply to this document and to the execution of the checklist it describes, until separately and explicitly approved:

- This document is planning only — producing it did not run any of the checklist steps above.
- Running this checklist against a real environment requires its own separate go-ahead; this document does not itself authorize execution.
- No step in this checklist requires or should trigger a production Supabase write — every write-capable action in the app (candidate/measure reviews, County Commission submission) either writes only to the tester's own scoped rows (reviews) or is a dry-run no-op (County Commission).
- Do not enable `ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE` at any point during this checklist.
- Do not modify `user_districts` at any point during this checklist.
- Do not change schema, seeds, migrations, `districts`, `officials_for_user`, `src/lib/officials.ts`, `CurrentOfficialsSection`, or the At-Large row at any point during this checklist.
- Do not deploy as part of running this checklist — it is intended to run against a local or already-approved test environment.

## 14. Stop conditions

Running the checklist should stop and be escalated, rather than continued past, if any of the following occurs:

- Any step produces a blank white screen instead of the expected content or a friendly empty/error state.
- Any step causes a console error that wasn't already a documented, accepted limitation (Section 5).
- The County Commission form's submit response does not contain the exact expected dry-run message, or `My Current Officials` changes after submitting it.
- A review submission appears to succeed but is not visible after a page reload, or a duplicate review is created for the same user/candidate or user/measure pair.
- A candidate or measure that should be hidden by data-completeness filtering (Section 10) is visible, or a candidate/measure that should be visible is missing.
- Any sign that a Supabase write occurred outside the expected scope (a review row, or anything else) — this should be verified via the same read-only verification patterns already established in the County Commission gate sequence (Gates 13-17A), not assumed.
- Any unexpected network request to a non-Supabase, non-official-government-link destination.

## 15. Recommended next gate

- **Execution approval:** this plan is ready to run, but running it requires a separate, explicit go-ahead per Section 13 — this document does not authorize execution on its own.
- Once run, the results should be documented in a follow-up gate (e.g., "Gate I9A: Smoke test execution results"), mirroring the Gate I4A/I5A/I8A pattern already established in this project — recording what passed, what didn't, and whether any stop condition (Section 14) was triggered.
- The County Commission safe test (Gate 17B) remains a fully separate, parallel track, still blocked strictly on the user providing the Gate 15 final approval statement — unaffected by anything in this document.
- If the smoke test passes cleanly, the natural following step is the actual Internal Beta invite to the 1-3 trusted testers (Gate I2 from `docs/beta_launch_readiness_plan.md`'s work plan), rather than another documentation gate.
