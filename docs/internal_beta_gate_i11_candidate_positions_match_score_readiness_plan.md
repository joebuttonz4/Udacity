# Internal Beta — Gate I11: Candidate Positions and Match-Score Data Readiness Plan

## 1. Date and timestamp

Date: 08-05-2026
Timestamp: 10:07 pm EST

This document is documentation and planning only. It does not write to `voting_records`, `candidate_positions`, `match_scores`, or any other table. It does not call the Anthropic API. It does not change source code, schema, seeds, migrations, CSVs, RLS, grants, or environment variables. It does not deploy.

## 2. Current repository baseline

- Local path: `J:\CivicMarket`
- Branch: `master`
- Working tree verified clean and up to date with `origin/master` before this gate began.
- Latest pushed commit: `275c66d` ("Document Gate I10B final result: onboarding and Civic DNA verified live")

Recent commits:

- `275c66d` Document Gate I10B final result: onboarding and Civic DNA verified live
- `802e524` Document Gate I10B onboarding Civic DNA retry
- `3111fc7` Document Gate I10B execution stopped at signup
- `20e01e1` Document Gate I10B fresh account decision
- `ce36cca` Add onboarding Civic DNA readiness plan

## 3. Gate status

Complete. Documentation-only. No database write, API call, secret change, County Commission change, or deployment occurred.

## 4. Gate purpose

Gate I10B proved the onboarding and Civic DNA write path works live, end-to-end, and independently confirmed via read-only queries that the reason match rings stay locked is a pure data-availability gap: zero `candidate_positions` rows exist for any candidate in the entire database. This gate defines, precisely and safely, how `candidate_positions` and — downstream of it — `match_scores` may eventually become populated for the internal beta, without fabricating, guessing, or manually assigning any candidate's positions. It produces a readiness plan only. No candidate-position or match-score data is created by this gate.

## 5. Scope

In scope:
- Read and summarize the exact current match-score computation behavior.
- Read and summarize the exact current `candidate_positions` table design and the `recompute_candidate_positions` function.
- Map the full relationship chain from official source record through to the rendered match ring.
- Identify the current admin-entry pipeline gap (no scoring, no recompute call).
- Evaluate four candidate-position creation options (A-D) and recommend one as beta-safe.
- Define required verification steps before any future voting-record write, Claude scoring call, `recompute_candidate_positions` invocation, or match-score test.
- Define a staged six-test testing plan for a future, separately approved gate.
- Restate all County Commission and no-write/no-deploy hard stops.

Out of scope:
- Any actual write to `voting_records`, `candidate_positions`, `match_scores`, or any other table.
- Any Claude API call, including any scoring test call.
- Any source code, schema, seed, CSV, RLS, grant, or environment-variable change.
- Any decision about non-incumbent candidate-position methodology beyond flagging it as deferred (that decision belongs to a future Gate I12, defined in Section 32).

## 6. What Gate I10B proved

Confirmed via independent read-only database query, `civicmarket.test`-equivalent account `joebuttonzii@gmail.com` (`auth.users` id `73264ade-24fd-467f-b4c8-4481cef3e535`):

- Signup, email confirmation, ZIP/district write, districts auto-follow, all 14 Civic DNA quiz answers, and the `civic_dna` insert all worked correctly and matched the UI exactly, field for field.
- `match_scores` returned **0 rows** for this account after quiz completion.
- `candidate_positions` returned **0 rows system-wide** — not just for this user's four district candidates, but for every candidate in the database.
- The onboarding, quiz, and match-score code was not found to be defective. The empty result is fully explained by the absence of `candidate_positions` data, which `src/app/api/compute-match-scores/route.ts` explicitly and correctly skips.

Gate I10B's own recommendation (Section 11) was that the next step is a data-entry gap, not a code-behavior gap, and that populating verified `candidate_positions` is the correct next action — to be preceded by its own readiness plan. This gate (I11) is that readiness plan.

## 7. Why match rings remain locked

Match rings are driven by `match_scores` rows. `match_scores` rows are only created for a candidate when that candidate has a `candidate_positions` row with at least one non-null dimension (Section 8). `candidate_positions` rows are only created or updated by `recompute_candidate_positions(p_candidate_id)`, which derives every dimension value from `voting_records` rows for that candidate that have a non-null `ai_draft_score` or `community_score_final` (Section 11). `voting_records_real.csv` is intentionally header-only, and the live `voting_records` table has no rows tied to the four real PSL District 1 candidates (all four are confirmed non-incumbents with no official Council vote history). With no `voting_records` input, `recompute_candidate_positions` has never run with real data, so `candidate_positions` has zero rows, so `match_scores` has zero rows, so every ring stays locked. This is a straight, unbroken causal chain from a real, documented data gap — not an app bug, not a regression, and not something a code change can fix.

## 8. Exact current match-score computation behavior

Read directly from `src/app/api/compute-match-scores/route.ts`:

1. Authenticates the caller via a Bearer token against `createServiceClient()` (`src/lib/supabase-server.ts`), rejecting with `401` if missing or invalid.
2. Loads the caller's latest `civic_dna` row (`order by created_at desc limit 1`); returns `400` if none exists.
3. Loads the caller's `user_districts` rows; returns `400` if none exist.
4. Loads active (`archived_at IS NULL`) candidates in those districts.
5. Loads `candidate_positions` rows for exactly those candidate ids, keyed into a map by `candidate_id`.
6. For each candidate: if no `candidate_positions` row exists, `skipped++` and continue (no score row created).
7. For each of the seven locked dimensions (`growth_development`, `taxation_spending`, `education`, `environment`, `public_safety`, `housing`, `transparency`): if the candidate's value for that dimension is `null`, skip that dimension only; otherwise compute `100 - (|user_value - candidate_value| / 4.0) * 100`.
8. If a candidate ends up with zero populated-dimension alignments (i.e. its `candidate_positions` row exists but every dimension is null), `skipped++` and continue — no score row created.
9. Otherwise average the populated-dimension alignments, round, and clamp to an integer 0-100.
10. Deletes only the current user's existing `match_scores` rows for the exact candidate ids being recomputed (narrow delete — other users' rows and other candidates' rows are untouched).
11. Inserts fresh `match_scores` rows for every candidate that produced a score.

Net effect: a candidate with no `candidate_positions` row, or a `candidate_positions` row with every dimension null, never produces a `match_scores` row and its ring stays locked. This is the current, correct, unmodified behavior — Gate I11 makes no code observation that changes this.

## 9. Required data before match_scores can be created

For at least one candidate to unlock a ring for at least one user:

1. That candidate needs a `candidate_positions` row with at least one non-null dimension.
2. That row can only be produced by `recompute_candidate_positions(candidate_id)`, which requires at least one `voting_records` row for that candidate with a non-null `ai_draft_score` or `community_score_final`.
3. That `voting_records` row must itself satisfy every rule in `CLAUDE.md` and `data/real-psl-replacement/README.md`: an official, item-specific government source verifying candidate, item, date, description, and vote cast, plus a locked-dimension classification and `source_url`.
4. The user attempting to see the unlocked ring must have a `civic_dna` row (already true for onboarded test accounts per Gate I10B) and must be in the same district as the candidate.

## 10. Current data gap

- `voting_records_real.csv` is intentionally header-only (confirmed by direct read, `data/real-psl-replacement/README.md`).
- The live `voting_records` table has no rows for any of the four real PSL District 1 candidates (Eric Reikenis, Indony Baptiste, Kevin Zimmerman, Fredric Meltzer) — all four are non-incumbents with no verified Council vote history (`CIVICMARKET_CURRENT_STATE.md`, confirmed again by Gate I10B's live read-only query).
- `candidate_positions` has zero rows system-wide (confirmed live by Gate I10B, Section 9 of that document).
- No real PSL ballot measures are currently confirmed in the database, so measure-side match scoring is not addressed by this gate.

This is the same data-availability limitation `CLAUDE.md` and `CIVICMARKET_CURRENT_STATE.md` already document as a hard beta blocker, not a new finding.

## 11. Existing candidate_positions table design

From `Reference Files/civicmarket_schema_v4.sql` (lines 236-257):

- One row per candidate, enforced by `UNIQUE(candidate_id)`.
- Seven dimension columns (`growth_development` through `transparency`), each `numeric(4,2)`, nullable.
- `vote_count int DEFAULT 0`
- `community_score_count int DEFAULT 0`
- `has_dna_score boolean DEFAULT false`
- `data_completeness text DEFAULT 'pulse_only'` — one of `full | partial | pulse_only`
- `voting_weight numeric(3,2) DEFAULT 0.70`, `sentiment_weight numeric(3,2) DEFAULT 0.30` (defined but not currently consumed by the match-score route, which reads dimension values directly)
- `updated_at timestamptz DEFAULT now()`
- RLS enabled; one policy, `"Positions are publicly readable"`, `SELECT` only — no `INSERT`/`UPDATE`/`DELETE` grant to `anon` or `authenticated` exists in this table definition, consistent with it being populated only by the `SECURITY DEFINER` function, not by client writes.

## 12. Existing recompute_candidate_positions function behavior

From `Reference Files/civicmarket_schema_v4.sql` (lines 573-631):

1. Takes `p_candidate_id uuid`.
2. Counts all `voting_records` rows for that candidate into `v_vote_count` (this count includes rows with no score — see Section 24 risk note).
3. For each of the seven dimensions, computes `AVG(COALESCE(community_score_final, ai_draft_score))` across only that candidate's `voting_records` rows matching that dimension, restricted to rows where `ai_draft_score IS NOT NULL OR community_score_final IS NOT NULL`. Community score takes priority over the AI draft score when both exist.
4. Upserts one `candidate_positions` row (`ON CONFLICT (candidate_id) DO UPDATE`) with the seven computed dimension averages, `vote_count`, `has_dna_score = (vote_count > 0)`, `data_completeness` (`full` at 5+ votes, `partial` at 1-4, `pulse_only` at 0), and `updated_at = now()`.
5. Runs as `SECURITY DEFINER` — it executes with the privileges of its owner, not the caller, so any future invocation path (admin UI, script, or trigger) must be tightly controlled; anything able to call this function can rewrite any candidate's public-facing position data regardless of the caller's own RLS grants.
6. A second function, `check_community_score_threshold()` (schema lines 634-674), automatically calls `recompute_candidate_positions` as a trigger side effect once enough qualifying community scores accumulate on a `voting_records` row — this is an existing, separate automatic invocation path that this gate does not propose changing or exercising.

## 13. Relationship chain

```
Official source record (government agenda, minutes, ordinance, vote record)
        |
        v
voting_records row (candidate, item, date, description, vote_cast, dimension, source_url — all required)
        |
        v
Claude scoring (server-side only) -> ai_draft_score, ai_draft_rationale, ai_draft_generated_at, ai_draft_model
        |  (human review before controlled use)
        v
community_score_final (optional; overrides ai_draft_score once the community threshold trigger fires; takes
        |               priority in recompute_candidate_positions's COALESCE)
        v
recompute_candidate_positions(candidate_id) — SECURITY DEFINER, averages COALESCE(community_score_final, ai_draft_score)
        |                                      per dimension across that candidate's voting_records
        v
candidate_positions row (one per candidate; dimension values -2.0..+2.0; has_dna_score; data_completeness)
        |
        v
civic_dna row (already populated per-user by the existing, working onboarding/quiz flow — Gate I10B)
        |
        v
POST /api/compute-match-scores — per district-scoped candidate with a candidate_positions row, averages
        |                          100 - (|user_dim - candidate_dim| / 4.0) * 100 over populated dimensions only
        v
match_scores row (user_id, candidate_id, score 0-100, computed_at)
        |
        v
MatchScoreRing display (src/app/ballot/page.tsx, src/lib/candidates.ts, src/app/page.tsx) — ring renders
        unlocked with the stored score only when a match_scores row exists for that user/candidate pair;
        candidates without one remain visibly present but locked (per CLAUDE.md's locked-ring behavior)
```

Every link in this chain already exists in shipped code and schema. The only missing input is the first one: an official, source-verified `voting_records` row.

## 14. Current admin-entry pipeline gap

Read directly from `src/app/admin/entry/page.tsx`:

- The form inserts exactly one row into `voting_records` with `candidate_id`, `issue_title`, `issue_description`, `bill_number` (optional), `vote_date`, `vote_cast`, `dimension`, and `source_url`.
- It does **not** call any Claude scoring endpoint.
- It does **not** populate `ai_draft_score`, `ai_draft_rationale`, `ai_draft_generated_at`, or `ai_draft_model` — these remain `null` on every row this form creates.
- It does **not** call `recompute_candidate_positions()` after insert.
- Therefore, even if an admin used this form today with a fully verified official record, the resulting `voting_records` row would have `ai_draft_score IS NULL AND community_score_final IS NULL`, which `recompute_candidate_positions`'s own `WHERE` clause explicitly excludes from its averages (Section 12, step 3) — so a `candidate_positions` row still would not gain a populated dimension from it, and no manual SQL step exists yet in the shipped app to close that gap.

This confirms three separate future implementation needs, not yet built and not built by this gate: (1) a scoring step (Claude-backed, server-side, human-reviewed) that populates `ai_draft_score` and related fields on a `voting_records` row after insert, (2) an explicit, controlled call to `recompute_candidate_positions()` after a score is accepted, and (3) an explicit, controlled call to `POST /api/compute-match-scores` (or a re-run of the existing route) for affected users. None of these three exist as automated code today; each would need its own separately approved implementation gate.

## 15. Safe candidate-position creation options

### Option A: Verified voting-record-derived positions (recommended default)

Insert only voting records supported by official, item-specific government records (candidate, item, date, description, vote cast, dimension, source URL all verified). Use Claude to generate an AI draft score from the verified factual record, server-side only. Human-review the score and rationale before any controlled use. Save the validated score to `voting_records`. Run `recompute_candidate_positions` for only the affected candidate. Verify the resulting `candidate_positions` row. Recompute match scores only for an approved test account. This is the only option consistent with the existing schema design (`recompute_candidate_positions` was purpose-built to average scored voting records) and with `CLAUDE.md`'s non-negotiable rule that `source_url` is required for every voting record.

### Option B: Direct manual candidate_positions values

Directly entering ideology or position values into `candidate_positions` without any underlying verified `voting_records`. **Rejected as the default for internal beta.** This bypasses the entire provenance chain in Section 13, has no source_url attached to the resulting dimension value, has no audit trail linking a number to a fact, and directly conflicts with `CLAUDE.md`'s prohibition on manufacturing, guessing, or manually assigning candidate values. Would require a separate, explicitly approved methodology, source standard, approval gate, and audit trail before ever being considered — none of which exist today.

### Option C: Campaign-statement-derived candidate positions

Deriving positions from candidate questionnaires, campaign websites, public statements, or interviews. Useful specifically for the current situation (all four real candidates are non-incumbents with zero Council voting history), but this is a genuinely separate methodology from voting-record-derived positions — it introduces subjective interpretation, requires its own source rules, provenance labeling, neutral-scoring standard, candidate dispute-handling process, and confidence/completeness labeling distinct from `full | partial | pulse_only`. Deferred pending a future, separately scoped methodology gate (Gate I12, Section 32) — not implemented, decided, or recommended as ready by this gate.

### Option D: Keep rings locked

Preserve the current locked-ring behavior for any candidate without source-backed position evidence. Safer than fabricating data. This is already the shipped, correct fallback behavior (Section 8) and requires no new work — it is the state every candidate is in today, and it is explicitly endorsed as correct in the interim by both this document and the existing `CIVICMARKET_CURRENT_STATE.md` "Data availability limits" section.

## 16. Options rejected or deferred

- **Option B is rejected** as a default path for internal beta. It would require its own future explicit approval gate with a defined methodology, source standard, and audit trail before reconsideration.
- **Option C is deferred**, not rejected outright — it may be the eventual practical answer for covering non-incumbent candidates, but it needs its own methodology gate (Gate I12) before any implementation or data entry.

## 17. Recommended Internal Beta-safe option

1. Keep match rings locked for any candidate without approved position evidence (Option D remains the correct default state for every candidate today).
2. Use verified voting-record-derived positions (Option A) whenever official item-specific records exist for a candidate.
3. Do not manufacture voting histories for the four current non-incumbent District 1 candidates — there is nothing to enter for them under Option A today, and that is expected, not a defect.
4. Do not create direct manual `candidate_positions` values (Option B) under any circumstance during internal beta.
5. Require a separate, future methodology gate (Gate I12) before using campaign statements or questionnaires (Option C) for non-incumbent candidate positions.
6. Validate Claude scoring against approved real records before any controlled beta use — see Section 19.
7. Use one limited test account and one candidate first, once a real Option A record exists for any candidate (incumbent or otherwise, present or future).
8. Stop immediately if the computed `candidate_positions` values do not match the approved, human-reviewed scored voting record.

## 18. Required source verification (before any future voting_records insert)

- Exact candidate identity.
- Exact government body.
- Exact agenda item, ordinance, resolution, bill, or motion.
- Exact meeting or vote date.
- Exact vote cast.
- Official item-specific source URL.
- Issue title.
- Neutral plain-English issue description.
- One exact locked Civic DNA dimension (`growth_development`, `taxation_spending`, `education`, `environment`, `public_safety`, `housing`, `transparency`).
- Confirmation that the record belongs to the candidate.
- Confirmation that the source is publicly accessible.
- Confirmation that no value was inferred from party affiliation or campaign rhetoric.

A generic candidate page, generic meeting index, search-results page, campaign page, or unsourced summary is not sufficient by itself, matching `data/real-psl-replacement/README.md`'s existing source-ready checklist.

## 19. Required verification before Claude scoring

Any future Claude-scoring implementation must:

- Operate server-side only.
- Use the Anthropic key only from a protected server-side secret, never `NEXT_PUBLIC_*`, never exposed in browser code, never logged.
- Return only a score in `-2, -1, 0, 1, or 2`.
- Return a neutral rationale.
- Validate the response as well-formed JSON before use.
- Reject out-of-range scores rather than clamping or guessing.
- Record the model name and generation timestamp (`ai_draft_model`, `ai_draft_generated_at`).
- Preserve the official `source_url` on the same row.
- Receive human review before any controlled beta use of the resulting score.
- Call `recompute_candidate_positions` only after the voting-record score has been human-accepted, never automatically on generation.
- Fail closed if scoring fails (no partial or guessed fallback score).
- Avoid automatically creating `candidate_positions` from incomplete or unreviewed input.

No real API key or secret value is included anywhere in this document.

## 20. Required verification before recompute_candidate_positions

- Confirm the target `voting_records` row has a human-reviewed, accepted `ai_draft_score` (or a `community_score_final` set through the existing threshold trigger) before invoking the function.
- Confirm the function is invoked for exactly one `p_candidate_id` — the candidate whose record was just accepted — not run in bulk across all candidates as a blanket operation.
- Confirm, given the function is `SECURITY DEFINER`, that invocation happens only through a controlled, audited path (e.g., a future admin-only server route or a manually run, reviewed SQL statement) — never exposed to a general authenticated-user code path.
- After running, read back the exact `candidate_positions` row for that candidate and confirm every field (dimension values, `vote_count`, `has_dna_score`, `data_completeness`, `updated_at`) matches expectations before proceeding.
- Confirm no other candidate's `candidate_positions` row changed.

## 21. Required verification before match-score testing

- Confirm the target candidate now has a `candidate_positions` row with at least one non-null dimension (read-only query).
- Confirm the test account has a `civic_dna` row and is in the same district as the candidate (both already true for existing test accounts per Gate I10B).
- Confirm `POST /api/compute-match-scores` is invoked only for the one approved test account, not run against every user.
- Confirm the resulting `match_scores` row exists for exactly the expected candidate, with an integer score 0-100.
- Confirm no unrelated candidate, measure, or user's `match_scores` rows changed.

## 22. What must not be faked, guessed, inferred, or manually assigned

- No candidate's dimension value in `candidate_positions`.
- No `voting_records` row without a verified official, item-specific source.
- No `ai_draft_score` without an actual Claude API call against a verified record.
- No `community_score_final` without going through the existing, unmodified `check_community_score_threshold()` trigger path.
- No voting history for a non-incumbent candidate who has none.
- No inference of a dimension value from party affiliation, campaign rhetoric, endorsements, or general political reputation.

## 23. Candidate coverage limitations for non-incumbents

All four current real PSL District 1 candidates (Eric Reikenis, Indony Baptiste, Kevin Zimmerman, Fredric Meltzer) are confirmed non-incumbents with no official Council vote history. Under Option A (the recommended path), none of the four currently has any eligible source material — this is expected and correct, not a gap in this plan. Their rings will remain locked under Option A alone until either (a) one of them takes office and begins accumulating a real voting record, or (b) a future, separately approved Gate I12 methodology extends coverage via Option C with its own safeguards. This gate does not attempt to solve non-incumbent coverage — it only defines the safe path for whichever candidates do have verifiable records, present or future.

## 24. Partial-dimension behavior and its risks

- `candidate_positions` dimensions are nullable per-column; `recompute_candidate_positions` only populates a dimension if at least one scored `voting_records` row exists for that exact dimension.
- `POST /api/compute-match-scores` correctly skips null dimensions per-candidate (Section 8, step 7) and averages only populated ones, so a candidate with, say, only a `taxation_spending` vote on record will still produce a match score, based on that one dimension alone.
- **Risk:** a single-dimension match score can look precise (an integer 0-100) while actually resting on one vote. `data_completeness` (`pulse_only` at 0 votes, `partial` at 1-4, `full` at 5+) is the existing signal for this, but Section 8's route does not currently surface `data_completeness` into the score display itself — it is only exposed elsewhere (e.g., `ballot_for_user` view, Section 13's schema read). Any future UI work surfacing early low-vote-count scores should consider showing `data_completeness` alongside the ring so users can judge confidence, but that is a UI decision outside this gate's documentation-only scope.
- **Risk:** `recompute_candidate_positions`'s `v_vote_count` (schema line 586-587) counts every `voting_records` row for the candidate, including unscored ones (no `WHERE` filter on that particular query) — so `data_completeness` and `vote_count` can reflect more rows than actually contributed to the averaged dimension values. This is existing, shipped function behavior; this gate does not change it, only documents it as a fact to be aware of when interpreting a candidate's completeness tier during future review.

## 25. Data-completeness behavior and its limitations

- `pulse_only` (0 votes), `partial` (1-4 votes), `full` (5+ votes) — a fixed, hardcoded threshold in `recompute_candidate_positions`, not currently configurable.
- These tiers describe row count, not verification quality or dimension coverage — a candidate could have 5 scored votes all on the same dimension and still read as `full`, while having zero data on the other six dimensions. This is a real limitation of the current schema, not something this gate proposes changing.

## 26. Security and authorization considerations

- `recompute_candidate_positions` is `SECURITY DEFINER` — any future invocation path must restrict who can call it. The existing invocation path (`check_community_score_threshold` trigger) already runs with elevated privileges automatically once enough qualifying community scores accumulate; that path is unmodified and out of scope here.
- Any future admin-triggered invocation (not built yet) must be gated the same way `src/app/admin/entry/page.tsx` and `src/app/admin/records/page.tsx` are — `profiles.is_admin = true` checked server-side, non-admin redirected.
- Any future Claude-scoring server route must follow the same Bearer-token/service-role pattern already used in `src/app/api/compute-match-scores/route.ts` and `src/app/api/set-county-commission-district/route.ts`, and must never expose the Anthropic key to the browser.
- `candidate_positions` has no client-writable RLS grant today (`SELECT` only) — this is a positive existing safeguard and must not be loosened to allow direct client `INSERT`/`UPDATE` from the browser.

## 27. Testing plan after valid candidate_positions exist

### Test 1: Documentation and source verification
- One candidate, one verified official voting record, no write yet.
- Confirm every required factual field and source from Section 18.

### Test 2: Claude score validation
- Score the record.
- Verify score range (-2..2), dimension direction, vote-cast interpretation, and a neutral rationale.
- Compare against a human-reviewed expected result.
- Do not continue on disagreement.

### Test 3: Controlled voting-record write
- Requires separate explicit write approval.
- Insert only the approved record.
- Verify the exact database row.
- Confirm no unrelated records changed.

### Test 4: Candidate-position recompute
- Requires separate explicit approval.
- Run `recompute_candidate_positions` for only the affected candidate.
- Verify the exact `candidate_positions` row: dimension values, `vote_count`, `has_dna_score`, `data_completeness`, `updated_at`.
- Confirm no other `candidate_positions` row changed.

### Test 5: Match-score computation
- Use one approved test account.
- Verify existing Civic DNA values.
- Recompute match scores.
- Confirm one expected `match_scores` row for the candidate, an integer 0-100.
- Confirm candidates without position data remain locked.
- Confirm no measure rows or unrelated users changed.

### Test 6: Live UI verification
- Verify the candidate's ring unlocks only after valid data exists.
- Verify the score matches the database.
- Verify candidates without positions remain locked.
- Verify no candidate is hidden merely because the ring is locked.

## 28. Rollback and correction considerations

- Because `candidate_positions` is keyed `UNIQUE(candidate_id)` and upserted, correcting a wrong dimension value means re-running `recompute_candidate_positions` after correcting the underlying `voting_records` row(s) — not a direct `candidate_positions` edit.
- If a `voting_records` row is found to be wrong after insert, the existing admin removal path (`src/app/admin/records/page.tsx`, two-step delete, scored-record guard) already blocks deletion of any record with `community_score_count > 0` or a non-null `community_score_final` — a future correction workflow must account for this guard rather than bypass it.
- Any future rollback of a `match_scores` row is already handled by the existing narrow delete-then-insert in `POST /api/compute-match-scores` (Section 8, step 10) — no new rollback mechanism is needed for that table.
- No rollback SQL is drafted by this gate, since no write occurs in this gate.

## 29. No-write and no-deploy boundaries

- No `voting_records` row was inserted.
- No `candidate_positions` row was created or modified.
- No `match_scores` row was created or modified.
- No Claude/Anthropic API call was made.
- No Supabase write of any kind occurred.
- No `recompute_candidate_positions` invocation occurred.
- No deployment occurred.

## 30. Risks and mitigations

| Risk | Mitigation |
|---|---|
| A future implementer skips source verification under time pressure | Section 18's checklist is a hard gate, mirrored from the already-shipped `data/real-psl-replacement/README.md` source-ready checklist |
| Claude scoring drifts outside -2..2 or produces malformed JSON | Section 19 requires validation and closed failure, not clamping or guessing |
| `recompute_candidate_positions` run in bulk instead of scoped to one candidate | Section 20 requires single-candidate invocation and a post-run read-back check |
| Partial-dimension scores read as falsely precise | Section 24 documents the risk; future UI work should consider surfacing `data_completeness` |
| `SECURITY DEFINER` function invoked from an uncontrolled path | Section 26 restricts any future invocation to admin-gated, server-side, audited paths only |
| Non-incumbent candidates never get real data under Option A | Explicitly acknowledged in Section 23; Option C deferred to a future Gate I12, not solved here |

## 31. Deferred enhancements

- Automated Claude-scoring pipeline wired into `src/app/admin/entry/page.tsx` (not built; Section 14).
- Admin-triggered `recompute_candidate_positions` call after score acceptance (not built; Section 14).
- Surfacing `data_completeness` next to match-score rings in the UI (Section 24).
- Non-incumbent candidate-position methodology (Option C) — deferred to Gate I12.
- Any change to the fixed `full/partial/pulse_only` vote-count thresholds (Section 25).

## 32. Recommended next gate

Recommend a separate, documentation-only **Gate I12: Non-incumbent candidate position methodology decision.**

Gate I12 should compare:
1. Keep rings locked for non-incumbents.
2. Use only verified candidate questionnaires.
3. Use campaign websites and direct policy statements.
4. Use structured candidate-submitted position data.
5. Use a mixed source-backed methodology.

Gate I12 must define source standards, provenance, labeling, neutral scoring, human review, candidate dispute handling, confidence/completeness indicators, and whether campaign-derived positions may be mixed with voting-record-derived positions. Gate I12 is not implemented, decided, or started by this document.

## 33. Risk check

**Scope:** One new documentation file only.

**Expected result:** A source-backed readiness plan that defines how `candidate_positions` and `match_scores` may safely become available.

**No-change boundary:**
- No `candidate_positions` rows.
- No `match_scores` rows.
- No `voting_records` rows.
- No Supabase writes.
- No Claude API calls.
- No source code changes.
- No schema changes.
- No seeds.
- No migrations.
- No CSV changes.
- No RLS or grant changes.
- No `user_districts` changes.
- No County Commission changes.
- No At-Large changes.
- No write-guard changes.
- No deployment.

**Test:** Build should pass. Git status should show only the new Gate I11 documentation file before commit.

## 34. County Commission hard stops

All existing County Commission safeguards remain unchanged and were not touched by this gate:

- `ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE` remains `false`.
- The write guard was not enabled.
- No County Commission writes were run.
- No County Commission District 1-5 `user_districts` rows were created or modified.
- No County Commission District 1-5 assignment was made from ZIP alone.
- At-Large membership was not used to infer District 1-5.
- The At-Large row was not renamed, deleted, replaced, or repurposed.
- The all-five County Commission At-Large expansion was not restored.
- No deployment occurred.

## 35. No-change confirmation

This gate made no changes to: `voting_records`, `candidate_positions`, `match_scores`, `civic_dna`, `civic_dna_answers`, `user_districts`, `candidates`, `districts`, `current_officials`, `officials_for_user`, `src/lib/officials.ts`, `CurrentOfficialsSection`, schema, seeds, migrations, CSV files, RLS, grants, API keys, environment variables, the County Commission write guard, the At-Large row, or deployment state. Exactly one new file was created: `docs/internal_beta_gate_i11_candidate_positions_match_score_readiness_plan.md`.
