# Gate I46 — Shannon Martin `candidate_positions` Write: Executed and Verified

Date: 08-20-2026

Status: **EXECUTED. VERIFICATION PASSED. Rollback was not required and was not used.**

## Authorization

The user gave explicit approval, verbatim, matching the exact statement documented in `docs/internal_beta_gate_i46_shannon_candidate_positions_write_approval.md`:

> "I explicitly approve Gate I46 to insert only the documented Shannon Martin candidate_positions row with growth_development=1, taxation_spending=2, environment=2, public_safety=2, and education/housing/transparency=NULL, followed immediately by the documented read-only verification. I approve the documented Shannon-only rollback only if verification fails and the verified pre-write state was no existing Shannon candidate_positions row. Do not modify candidate_position_evidence, match_scores, schema, RLS, functions, or any other candidate_positions row."

## Execution method

A temporary, one-time Node script was created, inspected to confirm exactly one `.insert(` call and zero `.update(`/`.upsert(`/`.delete(` calls, and run exactly once via the service-role client. It performed, in order: (1) the defensive pre-write check, (2) the single `INSERT` of the one documented row, and (3) the four read-only verification queries from Gate I46 Phase 6. Deleted immediately after; `git status` confirmed no trace remained.

## Pre-write check

`preWriteExistingCount: 0` — reconfirmed immediately before the insert. No `BLOCKED_PENDING_REVIEW` condition was triggered.

## Insert result

New row `id 89803a61-9224-4dea-a10e-82956a0f45ef`:

| Column | Value |
|---|---|
| `candidate_id` | `d44ff05a-14af-45c2-9f2f-6d530a8a051e` |
| `growth_development` | `1` |
| `taxation_spending` | `2` |
| `education` | `NULL` |
| `environment` | `2` |
| `public_safety` | `2` |
| `housing` | `NULL` |
| `transparency` | `NULL` |
| `vote_count` / `community_score_count` | `0` / `0` (table default) |
| `has_dna_score` | `false` (table default) |
| `data_completeness` | `'pulse_only'` (table default — legacy field, unused by any app code) |
| `voting_weight` / `sentiment_weight` | `0.70` / `0.30` (table defaults) |
| `updated_at` | `2026-08-20T20:29:07.757518+00:00` |

## Post-write verification — PASSED, all four checks

1. **Exactly one Shannon `candidate_positions` row**, values exactly matching the approved design. ✓
2. **`candidate_position_evidence` unchanged** — same 5 row IDs (`836fc7ab-...`, `d138ba1e-...`, `a2dac241-...`, `e36ce940-...`, `33474fe8-...`), same dimensions/scores/`extraction_status`/`methodology_version` as before the write. ✓
3. **Zero other `candidate_positions` rows** — Shannon remains the only candidate with a row, exactly as the approved product decision anticipated. ✓
4. **Zero `match_scores` rows for Shannon**, confirmed immediately after — the write did not (and was not expected to) populate match scores. ✓

**No rollback was needed and none was executed.**

## No-change confirmation

- `candidate_position_evidence`: not modified.
- `match_scores`: not modified.
- No other candidate's `candidate_positions` row: none existed, none created.
- Schema, RLS, grants, functions: not modified.
- No deployment. No Anthropic or Gemini API call. No secrets printed. Temporary script deleted, confirmed absent from `git status`.

## Result / current state

Shannon Martin now has a `candidate_positions` row with 4 of 7 dimensions populated (`growth_development=1`, `taxation_spending=2`, `environment=2`, `public_safety=2`) and 3 left `NULL` (`education`, `housing`, `transparency`), derived deterministically and auditably from her 5 human-reviewed `candidate_position_evidence` rows per the Gate I45 aggregation rule. She is the only candidate in the system with any `candidate_positions` row — the explicitly approved, temporary pilot asymmetry.

**Her match ring is not yet visibly unlocked for any real user.** Per Gate I46 Phase 8, a `candidate_positions` write alone does not generate `match_scores` rows — that requires a separate, later, explicitly-approved `compute-match-scores` invocation for a specific test user (e.g., a quiz retake), which was not performed here and remains a distinct future approval boundary.
