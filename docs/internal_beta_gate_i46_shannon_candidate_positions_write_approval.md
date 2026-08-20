# Gate I46 — Shannon Martin `candidate_positions` Write Approval Package

Date: 08-20-2026
Timestamp: 04:23 pm EST

Status: **DOCUMENTATION ONLY. Creating this document is NOT approval and does NOT execute anything. NO WRITE WAS EXECUTED IN GATE I46.**

## Product decision (already given)

The user explicitly approved the temporary pilot asymmetry: Shannon Martin may become the only candidate with a `candidate_positions` row and therefore the only unlocked match ring, for this controlled end-to-end pilot. **This approval covers designing this write package only — it is not approval to execute the Supabase write.**

---

## Phase 1 — Pre-write verification (LIVE VERIFIED, read-only)

- **Shannon Martin candidate row exists:** `id d44ff05a-14af-45c2-9f2f-6d530a8a051e`, `name "Shannon Martin"`, `office "Mayor"`.
- **Shannon's `candidate_positions` row:** **does not exist** (`null`).
- **System-wide `candidate_positions` row count:** **0** — unchanged from Gate I45.
- **`candidate_position_evidence` for Shannon** — exactly the same 5 rows as Gate I44's execution result, unchanged:

| id | dimension | score | extraction_status | source_url |
|---|---|---|---|---|
| `d138ba1e-e65f-4560-bdb5-2ca959d60c61` | growth_development | 1 | human_reviewed | `.../about-shannon-martin/` |
| `e36ce940-5285-4daa-839e-72b420e6c821` | taxation_spending | 2 | human_reviewed | `.../about-shannon-martin/` |
| `33474fe8-68ef-4f9b-b786-da0a2936c6f2` | taxation_spending | 2 | human_reviewed | `.../biography/` |
| `836fc7ab-c14d-45b8-957f-e03010ee6957` | environment | 2 | human_reviewed | `.../biography/` |
| `a2dac241-8156-453a-8066-5c82d9304ed5` | public_safety | 2 | human_reviewed | `.../biography/` |

- **No surviving negative-growth conflict row** — confirmed absent.
- **Distinct `methodology_version` values present for Shannon:** exactly one — `campaign_evidence_v1_2026-08`. No newer methodology version exists; Gate I45's aggregation is not stale.

---

## Phase 2 — `candidate_positions` schema verification

| Fact | Classification |
|---|---|
| `id` uuid PK, default `gen_random_uuid()`, only NOT NULL column | **LIVE VERIFIED** (PostgREST OpenAPI description, fetched this gate) |
| `candidate_id` uuid, FK → `candidates.id`, nullable at column level | **LIVE VERIFIED** |
| Seven dimension columns (`growth_development`, `taxation_spending`, `education`, `environment`, `public_safety`, `housing`, `transparency`) all `numeric`, all nullable | **LIVE VERIFIED** |
| `vote_count`/`community_score_count` int default 0, `has_dna_score` bool default false, `data_completeness` text default `'pulse_only'`, `voting_weight`/`sentiment_weight` numeric defaults 0.70/0.30, `updated_at` timestamptz default `now()` | **LIVE VERIFIED** |
| `UNIQUE(candidate_id)` | **SCHEMA-SOURCE / PREVIOUSLY VERIFIED** (`Reference Files/civicmarket_schema_v4.sql`) — PostgREST's OpenAPI description does not expose unique/check constraints, only column-level facts |
| No `-2..2` `CHECK` constraint on this table | **SCHEMA-SOURCE / PREVIOUSLY VERIFIED** — absence confirmed by reading the full `CREATE TABLE` statement; no such constraint appears anywhere in it |
| No `created_at` column exists (only `updated_at`) | **LIVE VERIFIED** |
| RLS: `ENABLE ROW LEVEL SECURITY`, one public `SELECT`-only policy (`"Positions are publicly readable"`) | **SCHEMA-SOURCE / PREVIOUSLY VERIFIED** — no INSERT policy exists for `anon`/`authenticated`; a future write must use the service-role client (same pattern already used for the evidence write in Gate I44), which bypasses RLS by design |

Nothing here contradicts or requires changing the Gate I45 design.

---

## Phase 3 — Exact future row

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

All other columns (`id`, `vote_count`, `community_score_count`, `has_dna_score`, `data_completeness`, `voting_weight`, `sentiment_weight`, `updated_at`) use their verified table defaults — no value is guessed for any of them. As noted in Gate I45, `data_completeness`'s legacy enum (`full`/`partial`/`pulse_only`) has no value describing campaign-evidence-derived data, but zero current application code reads this column, so leaving it at its default `'pulse_only'` has no functional consequence.

---

## Phase 4 — Insert vs. update decision

**Pre-write verification (Phase 1) confirmed no existing Shannon `candidate_positions` row.** Per the stated safest-behavior rule, this package uses **`INSERT` only** — not `UPSERT`. If a future re-verification immediately before execution finds a row now exists, execution must stop and be marked `BLOCKED_PENDING_REVIEW` rather than silently overwriting it.

---

## Phase 5 — Draft atomic write SQL (UNEXECUTED)

```sql
-- DRAFT ONLY — NOT EXECUTED IN GATE I46.
BEGIN;

-- Defensive precondition check (re-run immediately before INSERT at actual
-- future execution time):
-- SELECT id FROM public.candidate_positions
--   WHERE candidate_id = 'd44ff05a-14af-45c2-9f2f-6d530a8a051e';
-- Expected: 0 rows. If any row is returned, ABORT — do not proceed to INSERT.

INSERT INTO public.candidate_positions (
  candidate_id,
  growth_development,
  taxation_spending,
  education,
  environment,
  public_safety,
  housing,
  transparency
)
VALUES (
  'd44ff05a-14af-45c2-9f2f-6d530a8a051e',
  1,
  2,
  NULL,
  2,
  2,
  NULL,
  NULL
)
RETURNING *;

COMMIT;
```

---

## Phase 6 — Draft post-write verification SQL (READ-ONLY, UNEXECUTED)

```sql
-- DRAFT ONLY — NOT EXECUTED. Run immediately after a future approved insert.

-- 1. Exactly one Shannon candidate_positions row, correct values:
SELECT id, candidate_id, growth_development, taxation_spending, education,
       environment, public_safety, housing, transparency, updated_at
FROM public.candidate_positions
WHERE candidate_id = 'd44ff05a-14af-45c2-9f2f-6d530a8a051e';
-- Expected: exactly 1 row; growth_development=1, taxation_spending=2,
-- environment=2, public_safety=2, education IS NULL, housing IS NULL,
-- transparency IS NULL.

-- 2. candidate_position_evidence unchanged (same 5 ids/values as Phase 1):
SELECT id, dimension, score, extraction_status, methodology_version
FROM public.candidate_position_evidence
WHERE candidate_id = 'd44ff05a-14af-45c2-9f2f-6d530a8a051e'
ORDER BY dimension;
-- Expected: identical to the Phase 1 table above — same 5 ids, same values.

-- 3. No other candidate_positions rows exist/changed:
SELECT count(*) FROM public.candidate_positions
WHERE candidate_id <> 'd44ff05a-14af-45c2-9f2f-6d530a8a051e';
-- Expected: 0 (system-wide count was 0 before; only Shannon's row should exist after).

-- 4. match_scores unchanged immediately after this write:
SELECT count(*) FROM public.match_scores
WHERE candidate_id = 'd44ff05a-14af-45c2-9f2f-6d530a8a051e';
-- Expected: 0 immediately after this write — a candidate_positions write alone
-- does not generate match_scores rows; see Phase 8.
```

---

## Phase 7 — Draft rollback SQL (UNEXECUTED)

```sql
-- DRAFT ONLY — NOT EXECUTED.
BEGIN;

DELETE FROM public.candidate_positions
WHERE candidate_id = 'd44ff05a-14af-45c2-9f2f-6d530a8a051e'
RETURNING *;

COMMIT;
```

**This rollback may only be used if all of the following hold:** (a) the future execution's own INSERT created the row, (b) post-write verification (Phase 6) fails, and (c) the verified pre-write state (re-checked immediately before execution) was confirmed to be "no Shannon row." Because condition (c) makes this a safe `DELETE` — there is no pre-existing row to lose — this simple `candidate_id`-scoped delete is safe *only* under that precondition, unlike the `candidate_position_evidence` rollback (Gate I42), which required exact-ID scoping because multiple legitimate rows per dimension can coexist there. `candidate_positions` has `UNIQUE(candidate_id)`, so at most one row can ever exist for Shannon — a `candidate_id`-scoped delete cannot affect any other row by construction.

---

## Phase 8 — Match-score consequence

After a `candidate_positions` write **only**:
- Shannon becomes *eligible* for `compute-match-scores` (her row would no longer cause her to be skipped).
- **Existing `match_scores` rows do not automatically change.** `compute-match-scores` is invoked per-user, on-demand (quiz completion/retake), not by any database trigger tied to `candidate_positions` — confirmed by Gate I45's full inspection of the route; nothing in that route or elsewhere runs automatically on a `candidate_positions` write.
- **This gate does not recompute `match_scores` and does not invoke `compute-match-scores` or any other write-capable match-score routine.** That remains a separate, later, explicitly-approved action.

**Exact separate next action needed after `candidate_positions` verification, to actually populate a test user's match score for Shannon:** a specific test user account (one holding the Mayor district and having already completed the Civic DNA quiz) would need `POST /api/compute-match-scores` invoked for them again (e.g., via a quiz retake, matching the pattern already used in Gates prior to this pilot) — that call, and the user selected for it, requires its own separate future approval and is explicitly out of scope here.

---

## No-change boundaries

- `candidate_position_evidence`: not modified.
- `match_scores`: not modified.
- Schema, RLS, grants, functions: not modified.
- No other candidate's `candidate_positions` row: not created or modified (none exist to begin with).
- No deployment.

## Risk check

- Pre-write state confirmed empty for Shannon and system-wide — no duplicate/overwrite risk if execution re-verifies immediately before writing.
- `UNIQUE(candidate_id)` structurally prevents a second Shannon row from ever existing, and makes the rollback safe by construction under its stated precondition.
- The single-candidate pilot asymmetry (Shannon the only unlocked candidate) is the explicitly accepted product decision, not an oversight.
- `data_completeness` legacy-column mismatch: no functional consequence (Gate I45), left at default.

## Exact future approval statement

> I explicitly approve Gate I46 to insert only the documented Shannon Martin candidate_positions row with growth_development=1, taxation_spending=2, environment=2, public_safety=2, and education/housing/transparency=NULL, followed immediately by the documented read-only verification. I approve the documented Shannon-only rollback only if verification fails and the verified pre-write state was no existing Shannon candidate_positions row. Do not modify candidate_position_evidence, match_scores, schema, RLS, functions, or any other candidate_positions row.

**Creating this document does not constitute that approval.**

## No-change confirmation

Supabase writes = 0. `candidate_positions` changes = 0. `match_scores` changes = 0. Anthropic/Gemini calls = 0. No deployment. No secrets printed. Two temporary read-only scripts were created, inspected for zero mutation calls, run once each, and deleted; `git status` confirmed neither remains in the working tree.
