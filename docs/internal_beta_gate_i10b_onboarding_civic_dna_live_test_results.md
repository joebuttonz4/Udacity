# Internal Beta — Gate I10B: Onboarding/Civic DNA Live Test Results

## 1. Date and timestamp

Date: 07-09-2026
Timestamp: 05:10 pm EDT (final update)

## 2. Current repo baseline

- Branch: `master`, working tree clean, up to date with `origin/master`.
- Latest pushed commit at the start of this gate: `3111fc7` ("Document Gate I10B execution stopped at signup").
- No application code was changed as part of this gate.
- `ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE = false`, unchanged. No deployment occurred. No County Commission action, review submission, manual SQL write, or schema change was attempted at any point in this gate.

## 3. How this gate completed

This gate ran in two parts:

1. **Scripted portion (this session).** Invite code validation and signup were performed by calling the same HTTP endpoints the app's own client code calls (documented in Sections 5-7 below). Signup succeeded but required email confirmation, which this environment cannot complete (no inbox access) — execution correctly stopped there, per explicit instruction, and was documented in the prior version of this file.
2. **User-completed portion (in the user's own browser).** After confirming the email and clearing a stale local session, the user manually completed ZIP/district entry and the full 14-question Civic DNA quiz through the actual running app, then reported the observed results directly (Profile screen's Civic DNA scores, Ballot's match-ring state). This section of the document records those user-reported observations and independently verifies them against the database via read-only queries (Section 9) — it does not re-execute or second-guess what the user directly observed in the running app.

## 4. Approval and scope

Explicitly approved by the user across both parts of this gate:

- Email: `joebuttonzii@gmail.com`. Password: `CivicMarketTest123!`. Invite code: `psl2026`.
- Approved write scope: signup → normal onboarding ZIP/district write → Civic DNA quiz → calculating/match-score path.
- Normal onboarding `user_districts` writes (the standard 5-row PSL set via ZIP entry) were explicitly allowed; County Commission District 1-5 write execution was explicitly not allowed and was not tested.
- Excluded from scope throughout: review submissions, manual SQL writes, deployment, schema changes.

## 5. Methodology (scripted portion)

No browser automation was available, so the scripted portion's actions were performed by calling the exact same HTTP endpoints the app's own client code calls, using a locally running production server (`npm run start`) for the server-side routes involved (`/api/validate-invite`), and Supabase's own REST/Auth endpoints directly for signup and every read-only verification query in this document (all via the service-role key, used strictly for reads, never a write, in every query in Section 9).

## 6. Scripted portion: what was executed

1. Local server started; `/` returned `200`.
2. `POST /api/validate-invite` with `"psl2026"` returned `{"valid":true}`.
3. `POST {SUPABASE_URL}/auth/v1/signup` with `email: "joebuttonzii@gmail.com"`, `password: "CivicMarketTest123!"` — identical to what `supabase.auth.signUp()` issues from `src/app/onboarding/signup/page.tsx`.

## 7. Scripted portion: signup result

Signup succeeded at the Supabase Auth level: `auth.users` id `73264ade-24fd-467f-b4c8-4481cef3e535`, `confirmed_at: null`, `confirmation_sent_at: 2026-07-09T20:45:30Z`, no session returned — the same `pendingConfirmation` state `src/app/onboarding/signup/page.tsx` shows as "Check your inbox." Execution stopped there, exactly as instructed, and the local server was stopped and scratch files cleaned up before this gate's second part began.

## 8. User-completed portion: reported observations

Reported directly by the user, from the running local app in their own browser:

- Email confirmation completed successfully after the local app was running and a stale local session was cleared.
- Profile screen shows Civic DNA scores: Growth & Development −0.5, Taxes & Services +1.5, Education +0.5, Environment −1, Public Safety −0.5, Housing +0.5, Transparency −0.5.
- Ballot candidate list loads correctly.
- Ballot shows locked match rings for all four City Council District 1 candidates.
- No reviews were submitted. County Commission write execution was not tested. No deployment or schema change occurred.

## 9. Independent read-only verification

Every value below was queried directly from the database via the service-role key (read-only — no `insert`/`update`/`delete`/`upsert` call was made in this section) for `auth.users` id `73264ade-24fd-467f-b4c8-4481cef3e535`, after the user reported the above:

| Table | Result |
|---|---|
| `profiles` | `zip_code: "34952"`, `dna_quiz_status: "completed"`, `dna_quiz_completed_at: 2026-07-09T21:04:41.548Z` |
| `user_districts` | 5 rows — the standard PSL set (city, county×2 including At-Large, state×2), matching every other onboarded account's shape |
| `follows` | 4 rows — matches the 4 real City Council District 1 candidates |
| `civic_dna_answers` | 14 rows — full quiz answered |
| `civic_dna` | exactly 1 row: `growth_development: -0.5, taxation_spending: 1.5, education: 0.5, environment: -1, public_safety: -0.5, housing: 0.5, transparency: -0.5` — **matches the user's reported Profile screen values exactly, field for field** |
| `match_scores` | **0 rows** for this user |
| `candidates` (all, not just this user's) | 4 rows: Eric Reikenis, Indony Baptiste, Kevin Zimmerman, Fredric Meltzer |
| `candidate_positions` (all, not just this user's district) | **0 rows, system-wide** — no candidate, for any user, currently has any `candidate_positions` data |

**Explanation for the empty `match_scores` result:** `src/app/api/compute-match-scores/route.ts` looks up each district-scoped candidate's `candidate_positions` row and explicitly skips (`skipped++; continue`) any candidate with none, inserting a `match_scores` row only for candidates that have position data. Since `candidate_positions` currently has **zero rows for any candidate in the entire database** — not just this user's four — the route would produce exactly zero `match_scores` rows for this account even if it ran successfully and exactly as designed. This is not a new defect introduced by or discovered in this gate; it is the same "Ballot rings locked — no candidate_positions until voting records exist" condition already documented in `CIVICMARKET_CURRENT_STATE.md`'s Hard Beta Blockers section, which is itself a data-availability gap (no verified candidate positions/voting records exist yet for the 4 real, non-incumbent District 1 candidates), not an app or onboarding-flow bug. Whether `/api/compute-match-scores` was actually invoked by the calculating screen could not be independently confirmed from read-only queries alone (no server-side invocation log was available in this session) — but it does not change the outcome either way, since the result is identical (zero rows) whether the route ran and correctly skipped every candidate, or never ran at all.

## 10. Pass/fail result

| Step | Result |
|---|---|
| Signup | **PASS** |
| Email confirmation | **PASS**, after the local app was running and a stale local session was cleared |
| ZIP/district write | **PASS** — verified independently: 5 `user_districts` rows, 4 `follows` rows, `profiles.zip_code = "34952"` |
| Civic DNA save/display | **PASS** — verified independently: 14 `civic_dna_answers` rows, 1 `civic_dna` row matching the displayed Profile scores exactly |
| Match calculation/display | **PARTIAL PASS** — match rings remained locked after quiz completion; independently confirmed this is consistent with, and fully explained by, the pre-existing, documented absence of any `candidate_positions` data system-wide, not a new code defect |

## 11. Issue for the next gate

**Locked match rings after Civic DNA completion, for the record, going into a future gate:**

- **Root cause (confirmed via read-only query, Section 9):** zero `candidate_positions` rows exist for any candidate in the database. This is a pre-existing, already-documented data-availability gap (`CIVICMARKET_CURRENT_STATE.md` Hard Beta Blockers: "Ballot rings locked — no candidate_positions until voting records exist"), not something newly discovered or caused by this gate.
- **Not a code defect in this gate's scope:** the onboarding chain, Civic DNA computation, and (as best determined without an invocation log) the match-score route all appear to have behaved correctly given the data that exists. This gate found no evidence of a bug in `src/lib/dna.ts`, the quiz page, the calculating page, or `src/app/api/compute-match-scores/route.ts`.
- **Recommended next-gate action:** this is a data-entry gap, not an app-behavior gap — the next step is populating verified `candidate_positions` for the 4 real District 1 candidates (through the existing minimal-admin entry flow, once official source data supports specific position values), not a code change to the onboarding or match-score path. A future gate could also add a direct, log-based or response-based confirmation that `/api/compute-match-scores` was actually invoked and returned successfully (e.g., checking its JSON response body live, as Gate I9B did for the County Commission route), to close the one open uncertainty noted in Section 9 about whether the route ran at all.

## 12. Cleanup performed

- Every scratch file created during both the scripted portion and this verification pass — including every file that had contained the Supabase service-role key — was deleted from the local scratchpad directory.
- The local server was stopped after the scripted portion concluded and was not required for the read-only verification queries in Section 9 (those used Supabase's REST API directly, not the local Next.js server).
- The `joebuttonzii@gmail.com` test account and all rows created for it (`profiles`, `user_districts`, `follows`, `civic_dna_answers`, `civic_dna`) were left in place as legitimate test data, consistent with how prior gates (I9B) also left their test artifacts in place rather than attempting to delete them.

## 13. Overall Gate I10B outcome

The onboarding/Civic DNA live write path gap identified by Gate I9B is now closed: signup, ZIP/district entry, and the full Civic DNA quiz are all confirmed working end-to-end against live data, independently verified at the database level, not just observed in the UI. The one open item — locked match rings — was investigated down to its exact, confirmed root cause and shown to be the same pre-existing data-availability limitation already known and documented elsewhere in this project, not a new defect requiring code changes.
