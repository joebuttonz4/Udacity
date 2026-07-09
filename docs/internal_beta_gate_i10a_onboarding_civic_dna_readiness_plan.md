# Internal Beta — Gate I10A: Onboarding and Civic DNA Read-Only Planning

## 1. Date and timestamp

Date: 07-09-2026
Timestamp: 04:22 pm EDT

This document is documentation and source inspection only. It does not execute the live onboarding/Civic DNA test, create accounts, complete Civic DNA, write to any table, deploy anything, or touch the County Commission write guard.

## 2. Current repo baseline

- Branch: `master`, working tree clean, up to date with `origin/master`.
- Latest pushed commit: `62f23e3` ("Document limited write internal beta smoke test").
- Gate I9B (live limited-write smoke test) passed: candidate review submission passed, measure review submission was correctly skipped (no active ballot measures exist), County Commission dry-run submit passed with the exact documented message (confirmed live), and `user_districts` no-write verification passed (confirmed live, byte-for-byte).
- The onboarding and Civic DNA live write path remains unverified against live data — this is the one gap Gate I9B's own recommendation (Section 15) flagged as needing its own separately scoped gate.
- `ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE = false`, unchanged. No deployment has been approved. No County Commission write execution is approved.

## 3. Gate purpose

Produce the concrete, itemized plan a future Gate I10B would execute to verify the onboarding and Civic DNA write path live, with a precisely bounded write scope — so that when Gate I10B is separately approved, it has an exact script to follow rather than open-ended discretion. This document reads and inspects the relevant source files; it does not run anything against live data.

## 4. What onboarding/Civic DNA routes exist

The full onboarding chain, in the order a user walks through it:

| Route | File | Purpose |
|---|---|---|
| `/onboarding` | `src/app/onboarding/page.tsx` | Welcome/value-prop screen |
| `/onboarding/signup` | `src/app/onboarding/signup/page.tsx` | Invite code + email/password signup, or existing-account login |
| `/onboarding/zip` | `src/app/onboarding/zip/page.tsx` | ZIP entry, resolves to the fixed 5-row PSL district set |
| `/onboarding/districts` | `src/app/onboarding/districts/page.tsx` | Shows the resulting ballot, auto-follows all candidates |
| `/onboarding/dna-teaser` | `src/app/onboarding/dna-teaser/page.tsx` | Explains the Civic DNA quiz, no data interaction |
| `/onboarding/quiz` | `src/app/onboarding/quiz/page.tsx` | 14-question quiz, saves each answer, computes DNA on the last question |
| `/onboarding/calculating` | `src/app/onboarding/calculating/page.tsx` | Triggers match-score computation, then redirects to `/ballot` |

Supporting, non-page code:

- `src/lib/dna.ts` — `saveQuizAnswer` and `computeAndSaveDna`, called directly from the quiz page via the anon-client (not a server route).
- `src/app/api/compute-match-scores/route.ts` — the one server-side API route in this chain, called from the calculating page.
- `src/app/api/validate-invite/route.ts` — called from the signup page; read-only against the `INVITE_CODE` env var, performs no database write.

## 5. What writes the flow appears to perform

Confirmed by reading each file listed in Section 4:

1. **Signup** (`signup/page.tsx`): `supabase.auth.signUp({ email, password })` creates an `auth.users` row. Per the schema's `handle_new_user()` trigger (confirmed in `Reference Files/civicmarket_schema_v4.sql`), this automatically creates a corresponding `profiles` row — the app itself issues no separate `profiles` insert for this step.
2. **ZIP entry** (`zip/page.tsx`): updates `profiles.zip_code` for the signed-in user, then deletes any existing `user_districts` rows for that user and inserts the fixed 5-row PSL district set (city, school board, county At-Large, state house, state senate).
3. **Districts confirmation** (`districts/page.tsx`): calls `autoFollowCandidates`, which `upsert`s one `follows` row per candidate the user's districts surfaced, with `ignoreDuplicates: true` (so re-running this step is idempotent — no duplicate rows).
4. **Quiz** (`quiz/page.tsx` via `src/lib/dna.ts`): for each of the 14 questions, `saveQuizAnswer` performs an `upsert` into `civic_dna_answers` keyed on `(user_id, question_number)` — also idempotent, re-answering a question overwrites the same row. On the 14th (last) answer, `computeAndSaveDna` reads all 14 answers, computes the 7 dimension scores (applying the Q8-Q14 reversal), and **inserts** (not upserts) one new row into `civic_dna`, then updates `profiles.dna_quiz_status` and `profiles.dna_quiz_completed_at`.
5. **Calculating** (`calculating/page.tsx` via `POST /api/compute-match-scores`): the server route reads the user's latest `civic_dna` row and their district-scoped candidates' `candidate_positions`, computes a score per candidate, deletes any existing `match_scores` rows for exactly those candidate ids for that user, then inserts fresh ones. This delete-then-insert is scoped narrowly (only the candidates being recomputed), matching the pattern already used elsewhere in this project.

**Important technical detail for Gate I10B's planning:** because `computeAndSaveDna` uses `.insert()` rather than `.upsert()` on `civic_dna`, retaking the quiz on an account that has already completed it once will create a **second** `civic_dna` row, not overwrite the first. Every read path in the app (`src/app/profile/page.tsx`, the Home page indirectly via candidates, etc.) already queries `civic_dna` with `.order('created_at', { ascending: false }).limit(1)`, so the app's behavior remains correct (the newest row always wins) — but a stale, superseded `civic_dna` row is left behind in the table. This is a real, pre-existing characteristic of the shipped code, not something Gate I10A is proposing to change; it is documented here because it directly affects Section 8's test-account recommendation and Section 16's cleanup expectations.

## 6. What data tables are affected

Across the full chain: `auth.users`, `profiles`, `user_districts`, `follows`, `civic_dna_answers`, `civic_dna`, `match_scores`. No other table is written by this flow, per the files inspected.

## 7. What should be tested live in Gate I10B

To close the gap Gate I9B identified, a future Gate I10B should verify, against live data:

- A fresh or already-onboarded test account can complete signup (or is already signed in) without error.
- ZIP entry correctly resolves to the 5-row PSL district set and is idempotent if re-run.
- The districts/ballot confirmation screen correctly shows candidates and auto-follows them without error.
- All 14 quiz questions can be answered in sequence, each answer persists (`civic_dna_answers`), and the final answer triggers `civic_dna` computation without error.
- The calculating screen correctly triggers match-score computation and lands on `/ballot` with rings unlocked for candidates that have `candidate_positions` data.
- The computed dimension scores are plausible given the answers given (a basic sanity check, not a full mathematical audit — Q8-Q14 reversal logic itself is already covered by `src/lib/dna.ts`'s existing, unmodified implementation and was not the subject of this gap).

## 8. Test account assumptions

Two options, to be decided at Gate I10B approval time, not by this document:

- **Option A — fresh account (recommended for cleanest signal):** create one new test account specifically for this walkthrough, following the same "existing approved trusted-tester pool, never a production account" rule established in Gate I9's plan. This avoids the stale-`civic_dna`-row side effect described in Section 5 entirely, and exercises every step of the chain from a true zero state, including signup and invite-code validation, which Gate I9B did not touch.
- **Option B — reuse an existing already-onboarded test account:** faster to set up, but retaking the quiz will leave a stale `civic_dna` row (Section 5) and will not exercise the signup/invite-code step at all, since the account already exists. If this option is chosen, `civicmarket.test.04@example.com` is the more suitable of the two known test accounts, since `CIVICMARKET_CURRENT_STATE.md` already documents it as the account previously used to verify the automatic match-score generation flow (May 25 2026) — reusing it continues an existing, already-understood test history rather than introducing a new stale-data pattern on `civicmarket.test.01@example.com` (which Gate I9B just added a review to, and which has manually-inserted `match_scores` rows from an unrelated May 25 2026 test, per `CIVICMARKET_CURRENT_STATE.md`'s ballot-match-rings entry — mixing manual and quiz-generated match scores on that account would make results harder to interpret cleanly).
- Whichever account is used, it must not be a production or real PSL user account, consistent with every prior gate's test-account rule.

## 9. Exact allowed write scope for Gate I10B

If and when Gate I10B is separately approved, its write scope should be limited to exactly the writes described in Section 5, performed exactly once each, in the normal onboarding order, for exactly one test account:

- One `auth.users`/`profiles` row (only if Option A/fresh account is used).
- One `profiles.zip_code` update and one `user_districts` delete-then-insert of the standard 5-row set (or a confirmation that it already matches, if re-running on an already-onboarded account).
- One `follows` upsert batch (idempotent regardless of prior state).
- 14 `civic_dna_answers` upserts and exactly one `civic_dna` insert.
- One `profiles.dna_quiz_status`/`dna_quiz_completed_at` update.
- One `match_scores` delete-then-insert cycle, scoped only to the test account's own currently-visible candidates (this is already how the route behaves — Gate I10B does not need to add any new scoping).
- No County Commission write of any kind.
- No review submission (Gate I9B already covered reviews; re-testing them is out of scope for I10B).

## 10. What must not be touched

Restated from this gate's own restrictions, and carried forward as binding for the future Gate I10B as well, unless separately re-approved at that time:

- Do not enable `ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE`.
- Do not submit or approve a County Commission write execution.
- Do not modify `user_districts` outside the normal ZIP-entry write path described in Section 5.
- Do not run production Supabase SQL writes (raw SQL against tables outside the app's own normal request shapes).
- Do not deploy.
- Do not change schema, seeds, migrations, `districts`, `officials_for_user`, `src/lib/officials.ts`, `CurrentOfficialsSection`, or the At-Large row.
- Do not submit a review (candidate or measure) as part of this flow — Gate I9B already covered that surface.
- Do not create more than one test account, and do not touch any production or real PSL user account.

## 11. Expected success behavior

- Each step in Section 4's chain completes without a console error or a blank/broken screen.
- `civic_dna_answers` ends up with exactly 14 rows for the test user (one per question), each with the raw, non-reversed answer value stored as-is, matching `CLAUDE.md`'s locked rule.
- `civic_dna` gains exactly one new row (or, if Option B/reuse is chosen, one additional row beyond whatever existed before — see Section 5's stale-row note) with 7 dimension scores in the range -2.0 to 2.0.
- `match_scores` ends up with one row per district-scoped candidate that has `candidate_positions` data, each an integer 0-100, and zero rows for candidates without `candidate_positions` data (those remain absent, not zero — matching the existing locked-ring behavior).
- `/ballot` shows unlocked match-score rings for the candidates with computed scores and locked rings for the rest, with no crash.
- `/profile`'s Civic DNA section shows the 7 dimension scores instead of the "take the quiz" nudge.

## 12. Expected failure/stop conditions

Consistent with the stop-condition pattern already established in `docs/internal_beta_gate_i9_smoke_test_plan.md` Section 14:

- Any step in the chain produces a blank white screen or an unhandled console error.
- `civic_dna_answers` ends up with fewer or more than 14 rows for the test user after completing the quiz.
- The final quiz answer does not trigger a `civic_dna` insert, or the insert contains fewer than 7 dimension fields.
- `/onboarding/calculating` does not redirect to `/ballot` within a reasonable time, or redirects without any `match_scores` rows having been attempted.
- Any `match_scores` row is created for a candidate the test account's districts do not actually include.
- Any write occurs against a table not listed in Section 6.
- Any sign that `user_districts` was modified outside the single ZIP-entry write path (e.g., an unexpected extra row, or a County Commission District 1-5 row appearing without a separately approved write).

## 13. Pre-test checklist

For a future Gate I10B, before executing anything:

- [ ] Confirm `git status` is clean and matches the intended baseline commit.
- [ ] Confirm `npm run build` passes.
- [ ] Decide Option A (fresh account) vs. Option B (reuse `civicmarket.test.04@example.com`) per Section 8, and get that decision confirmed before starting.
- [ ] If Option A: confirm the current `INVITE_CODE` value is available to use.
- [ ] Confirm `ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE = false` in source, exactly as Gate I9B did, even though this test does not touch that route — consistency of practice, not because this flow depends on it.
- [ ] Have the Section 15 verification queries ready to run immediately after each major step, not only at the end, so a failure is caught close to its source.

## 14. Click-by-click Gate I10B test plan

1. **Open app locally**, confirm it loads.
2. **Sign up (Option A) or confirm existing session (Option B).** If signing up, enter the current invite code, a test email, and a password; if the "check your inbox" state appears, this may require email confirmation to be handled out-of-band (a known dependency not resolved by this document) or an account with confirmation already satisfied.
3. **ZIP entry.** Enter a valid PSL ZIP. Confirm redirect to `/onboarding/districts`.
4. **Districts confirmation.** Confirm candidates appear, tap "These Are My Races." Confirm redirect to `/onboarding/dna-teaser`.
5. **DNA teaser.** Confirm the explainer screen renders, tap "Find My Matches."
6. **Quiz.** Answer all 14 questions in sequence, one tap per question. Confirm the progress bar advances and the final answer triggers a transition to `/onboarding/calculating`.
7. **Calculating.** Confirm the animated screen appears for roughly 2.5 seconds, then redirects to `/ballot`.
8. **Ballot.** Confirm match-score rings appear unlocked for candidates with `candidate_positions` data and locked for the rest.
9. **Profile.** Confirm the Civic DNA section shows 7 dimension scores instead of the quiz nudge.

## 15. Verification queries or read checks, if available

Mirroring the same read-only-query approach Gate I9B used (the anon key plus the test user's own access token, respecting RLS exactly as the app does):

- `select count(*) from civic_dna_answers where user_id = :test_user_id` — expect exactly 14 after the quiz.
- `select * from civic_dna where user_id = :test_user_id order by created_at desc limit 1` — expect one row with 7 non-null dimension fields, each between -2.0 and 2.0.
- `select district_id, scope from user_districts where user_id = :test_user_id` — expect the standard 5-row set, unchanged in count from before the test if Option B, or newly created if Option A.
- `select candidate_id, score from match_scores where user_id = :test_user_id` — expect one row per candidate with `candidate_positions` data in the test account's districts, each `score` an integer 0-100.
- `select dna_quiz_status, dna_quiz_completed_at from profiles where id = :test_user_id` — expect `'completed'` and a non-null timestamp.

## 16. Cleanup expectations

- If Option A (fresh account) is used, the new test account and its rows across all six affected tables are expected to remain in place afterward as ordinary test data, consistent with how Gate I9B left its test review in place rather than attempting to delete it.
- If Option B (reuse) is used, the stale extra `civic_dna` row described in Section 5 is an expected, harmless byproduct — the app already reads only the latest row, so no cleanup is functionally required, but it should be noted in the Gate I10B results document so a future reviewer isn't confused by seeing two rows for one user.
- No `user_districts`, `match_scores`, `civic_dna`, or `civic_dna_answers` row can be deleted through the app's own normal RLS-scoped access in most cases (several of these tables, per the reference schema, grant INSERT/UPDATE but not DELETE to authenticated users) — any cleanup beyond what's described above would require a separately approved service-role/admin SQL action, which remains out of scope unless explicitly requested later.

## 17. Recommendation for Gate I10B

- This document is planning only. Gate I10B itself requires its own separate, explicit approval before any of Section 14's steps are executed, exactly as Gate I9 required before Gate I9A/I9B ran.
- Recommend deciding Option A vs. Option B (Section 8) as part of that approval, since it changes both the setup steps and the expected side effects.
- Once Gate I10B runs and is documented (mirroring the Gate I9A/I9B results-document pattern), the onboarding/Civic DNA gap flagged by Gate I9B will be closed, and — combined with Gates I9A and I9B — every non-County-Commission smoke-test item from `docs/internal_beta_gate_i9_smoke_test_plan.md` will have live verification, not just source review.
- The County Commission safe test (Gate 17B) remains a fully separate, parallel track, still blocked strictly on the user providing the Gate 15 final approval statement — unaffected by anything in this document.
