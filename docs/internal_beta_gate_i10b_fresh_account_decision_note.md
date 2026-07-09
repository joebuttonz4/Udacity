# Internal Beta — Gate I10B: Fresh Account Decision Note

## 1. Current baseline

- Branch: `master`, working tree clean, up to date with `origin/master`.
- Latest pushed commit at the start of this note: `ce36cca` ("Add onboarding Civic DNA readiness plan").
- Gate I10A (onboarding/Civic DNA read-only planning) is complete: it produced `docs/internal_beta_gate_i10a_onboarding_civic_dna_readiness_plan.md`, which laid out two account options for a future Gate I10B live test — Option A (fresh account) and Option B (reuse `civicmarket.test.04@example.com`) — without deciding between them.
- `ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE = false`, unchanged. No deployment has been approved. No County Commission write execution is approved.
- No app code, schema, seed, migration, `districts`, `officials_for_user`, `officials.ts`, `CurrentOfficialsSection`, or At-Large change has occurred as part of this note.

## 2. Decision: use a fresh account for Gate I10B

Between the two options Gate I10A Section 8 presented, **Option A — a fresh test account — is the selected approach** for the eventual Gate I10B live onboarding/Civic DNA test.

This is a decision record only. It does not create the account, and it does not authorize Gate I10B to execute.

## 3. Why fresh account is preferred

Per the reasoning already laid out in Gate I10A, now confirmed as the chosen path:

- A fresh account exercises the **entire** onboarding chain end to end — signup, invite-code validation, ZIP entry, districts confirmation, the Civic DNA quiz, and match-score computation — from a true zero state. Option B (reuse) would have skipped signup and invite-code validation entirely, since the account already exists.
- A fresh account avoids the stale-row side effect Gate I10A Section 5 identified: `computeAndSaveDna` in `src/lib/dna.ts` `.insert()`s a new `civic_dna` row rather than upserting, so retaking the quiz on an already-onboarded account leaves a superseded row behind. Starting from zero sidesteps this entirely.
- A fresh account avoids mixing test data with either existing test account's history — `civicmarket.test.01@example.com` already carries a Gate I9B candidate review and manually-inserted `match_scores` from an unrelated May 2026 test, and `civicmarket.test.04@example.com` already carries its own May 25 2026 automatic-match-score-generation test history. A fresh account gives Gate I10B a clean, unambiguous signal that isn't layered on top of prior test artifacts.

## 4. What details are still needed before execution

Gate I10B cannot execute yet. Before it can, the following still need to be provided or confirmed:

- The exact email and password to use for the new fresh test account (a suggested pattern — e.g., `civicmarket.test.05@example.com` with a password matching the existing test-account convention — was proposed but not yet confirmed).
- Explicit confirmation that creating this one new account is approved, since account creation is itself a write action and every prior gate in this sequence has required its own separate go-ahead before performing a write, not merely before deploying or touching County Commission.
- Confirmation of the exact write scope for the live run, matching Gate I10A Section 9 (signup through match-score computation only — no County Commission action, no review submission, no writes beyond the standard onboarding chain).
- Whether email confirmation (the "check your inbox" pending state `signup/page.tsx` can produce) needs to be handled out-of-band, or whether the environment's email-confirmation setting allows immediate sign-in — this was flagged as an open dependency in Gate I10A Section 14 and remains unresolved.

## 5. Gate I10B is not approved for execution yet

This note records the Option A decision only. The following remain explicitly **not** performed and **not** authorized by this document:

- No account has been created.
- No signup, quiz, profile, follows, `match_scores`, `civic_dna`, `civic_dna_answers`, review, County Commission, or `user_districts` action has been performed.
- No live write test has been executed.

Gate I10B execution requires its own separate, explicit go-ahead — consistent with how Gate I9's plan required its own approval before Gates I9A and I9B ran, and how Gate I10A itself stated that "Gate I10B itself requires its own separate, explicit approval before any of Section 14's steps are executed."

## 6. No-write/no-deploy boundaries

The following apply to this note and were not violated in producing it:

- No app code was edited or created.
- No Supabase writes were performed — no account created, no row inserted, updated, or deleted in any table.
- No deployment occurred.
- `ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE` was not changed — confirmed still `false`.
- `user_districts` was not modified.
- No schema, seed, migration, `districts`, `officials_for_user`, `src/lib/officials.ts`, `CurrentOfficialsSection`, or At-Large row change was made.
- No signup, quiz, profile, follows, `match_scores`, `civic_dna`, `civic_dna_answers`, review, or County Commission action was performed.
