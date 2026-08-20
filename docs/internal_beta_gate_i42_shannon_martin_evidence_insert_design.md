# Gate I42 — Shannon Martin Reviewer-Metadata Resolution and Insert Design

Date: 08-20-2026
Timestamp: 01:07 pm EST

Status: **Read-only verification + documentation complete. NO DATABASE WRITE EXECUTED IN GATE I42.** No Anthropic call. No Gemini call. No Supabase INSERT/UPDATE/UPSERT/DELETE. No `candidate_position_evidence` row created. No `candidate_positions`/`match_scores` change. No deployment.

## Reference

Uses the exact final five-row evidence set from `docs/internal_beta_gate_i41_shannon_martin_final_evidence_set.md`, read directly from that file (not reconstructed from memory) immediately before writing this document.

## Method

Two temporary, read-only-only Node scripts were created, inspected for zero `.insert(`/`.update(`/`.upsert(`/`.delete(`/mutating-`.rpc(` calls, run exactly once each using the project's existing `createServiceClient()` pattern (`src/lib/supabase-server.ts`) and env vars already present in `.env.local`, then deleted immediately after use. Neither the Supabase URL nor the service-role key value was ever printed. `git status` confirmed after each deletion that no trace of either script remained in the working tree.

---

## Part 1 — Reviewer identity (Phase 1)

**Live query 1 — admin profile uniqueness check:** `SELECT id, is_admin FROM public.profiles WHERE is_admin = true` (via `.from('profiles').select('id, is_admin').eq('is_admin', true)`) returned **exactly one row**: `id = f1fde6f9-07c3-4c76-ae81-ebb2f461a5c3`. No ambiguity — a single admin profile exists.

**Live query 2 — known-admin correlation:** `supabase.auth.admin.listUsers()` (read-only; lists users, creates/modifies nothing) was searched for the email `joebuttonz4@gmail.com` (the account used as the authenticated admin/reviewer throughout this entire candidate-evidence pilot, in every prior live-extraction gate). Matched user id: `f1fde6f9-07c3-4c76-ae81-ebb2f461a5c3` — **identical to the sole admin profile id above.**

**Live query 3 — direct profile confirmation:** `SELECT id, is_admin FROM public.profiles WHERE id = 'f1fde6f9-07c3-4c76-ae81-ebb2f461a5c3'` returned `{ id: 'f1fde6f9-07c3-4c76-ae81-ebb2f461a5c3', is_admin: true }`.

**Resolved reviewer profile UUID:** **`f1fde6f9-07c3-4c76-ae81-ebb2f461a5c3`**
**is_admin:** **`true`**
**Ambiguity:** none — three independent live checks converge on the same single UUID.

No password, token, cookie, URL, or key value was printed anywhere in this process.

---

## Part 2 — Duplicate check (Phase 2)

**Live query:** `SELECT id, dimension, score, source_url, rationale, methodology_version, extraction_status, reviewed_by, reviewed_at FROM public.candidate_position_evidence WHERE candidate_id = 'd44ff05a-14af-45c2-9f2f-6d530a8a051e'`

**Result:**
- **Total existing rows for Shannon Martin:** **0**
- **Rows with `methodology_version = 'campaign_evidence_v1_2026-08'`:** **0**
- **Exact matches against any of the proposed final five rows:** **0** (trivially — the table has zero rows for this candidate)
- **Duplicate risk of a future blind insert:** **none.** The pre-write state is confirmed empty for this candidate. A future execution gate must still perform its own immediate pre-write verification query (Phase 7 requirement) rather than relying solely on this now-slightly-earlier read, since state could theoretically change between this gate and a future write gate.

---

## Part 3 — Schema / constraint verification (Phase 3)

| Property | Classification | Detail |
|---|---|---|
| Table exists, 18 columns | LIVE VERIFIED | PostgREST OpenAPI description (`GET {SUPABASE_URL}/rest/v1/`) returned a `candidate_position_evidence` definition with exactly 18 properties: `id, candidate_id, dimension, score, rationale, source_type, source_url, source_published_at, source_account_url, confidence, extraction_status, reviewed_by, reviewed_at, conflict_flag, conflict_notes, methodology_version, created_at, updated_at` |
| `id` uuid, default `gen_random_uuid()`, PK | LIVE VERIFIED | Confirmed directly in the OpenAPI column description |
| `candidate_id` uuid, FK → `candidates.id` | LIVE VERIFIED | Confirmed directly (`<fk table='candidates' column='id'/>`) |
| `reviewed_by` uuid, FK → `profiles.id` | LIVE VERIFIED | Confirmed directly (`<fk table='profiles' column='id'/>`) |
| `reviewed_at` type `timestamp with time zone` | LIVE VERIFIED | Confirmed directly in the OpenAPI column description |
| `extraction_status` type `text`, column default `'draft'` | LIVE VERIFIED | Confirmed directly |
| `score` type `smallint` | LIVE VERIFIED | Confirmed directly |
| `conflict_flag` type `boolean`, column default `false` | LIVE VERIFIED | Confirmed directly |
| NOT NULL columns: `id, candidate_id, dimension, source_type, source_url, extraction_status, conflict_flag, methodology_version` | LIVE VERIFIED | Confirmed directly via the OpenAPI `required` array — `score`, `rationale`, `source_published_at`, `source_account_url`, `confidence`, `reviewed_by`, `reviewed_at`, `conflict_notes` are nullable at the column level |
| `extraction_status` **exact allowed enum values** | **PREVIOUSLY VERIFIED / SCHEMA-SOURCE VERIFIED — INCOMPLETE** | PostgREST's OpenAPI description does not expose `CHECK` constraint expressions, so the live path used here cannot enumerate them. Gate I37 previously confirmed a "valid extraction_status" `CHECK` exists and that `draft` and `human_reviewed` are among the valid values (referenced by the table's own partial index name, `_pending_review_idx ... extraction_status IN ('draft','human_reviewed')`). Whether additional values (e.g. `approved`, `rejected`) also exist is **not confirmed by any source available in this gate** — not asserted here |
| `reviewed_by`/`reviewed_at` pairing `CHECK` — existence | PREVIOUSLY VERIFIED / SCHEMA-SOURCE VERIFIED | Gate I37 documented that a constraint named for "reviewed_by/reviewed_at consistency" exists. Its exact logical expression (most likely "both null or both non-null," per the task's stated known expectation) was not independently re-read via any read-only method available in this gate — PostgREST does not expose `pg_get_constraintdef` output, and no raw-SQL execution capability exists without creating a new RPC function, which would itself be a schema mutation and is out of scope/prohibited |
| **Whether `extraction_status = 'human_reviewed'` itself requires non-null `reviewed_by`/`reviewed_at`** | **UNCONFIRMED — NOT CLAIMED** | No source available to this gate (live or previously documented) states that the `CHECK` constraint cross-references `extraction_status` with `reviewed_by`/`reviewed_at`. Gate I37's own description lists "valid extraction_status" and "reviewed_by/reviewed_at consistency" as two **separate** named constraints, with no documented cross-reference between them. **This gate does not claim `human_reviewed` forces reviewer metadata** — it simply designs the future write to supply real, non-placeholder values for both fields regardless, which satisfies either a strict cross-referencing constraint (if one exists) or a same-fields-only consistency constraint (if that's all it is) |
| `dimension` `CHECK` | PREVIOUSLY VERIFIED / SCHEMA-SOURCE VERIFIED | Gate I37: "valid dimension" constraint confirmed to exist; exact enumerated value list not independently re-read this gate |
| `score` `CHECK` (-2..2 or null) | PREVIOUSLY VERIFIED / SCHEMA-SOURCE VERIFIED | Gate I37: "valid score -2..2/null" constraint confirmed to exist |
| `source_type` `CHECK` | PREVIOUSLY VERIFIED / SCHEMA-SOURCE VERIFIED | Gate I37: "valid source_type" constraint confirmed to exist |
| `confidence` `CHECK` | PREVIOUSLY VERIFIED / SCHEMA-SOURCE VERIFIED | Gate I37: "valid confidence" constraint confirmed to exist |
| `source_url` non-blank `CHECK` | PREVIOUSLY VERIFIED / SCHEMA-SOURCE VERIFIED | Gate I37 |
| Rationale required when `score` non-null `CHECK` | PREVIOUSLY VERIFIED / SCHEMA-SOURCE VERIFIED | Gate I37 |
| `official_social` requires non-blank `source_account_url` `CHECK` | PREVIOUSLY VERIFIED / SCHEMA-SOURCE VERIFIED | Gate I37 — not relevant to this package (`source_type = campaign_website` throughout) |
| `methodology_version` non-blank `CHECK` and NOT NULL, no column default | LIVE VERIFIED (NOT NULL, no default) + PREVIOUSLY VERIFIED (non-blank CHECK) | NOT NULL and absence of a default confirmed live via the OpenAPI `required` list and the property definition (no `default` key present); the additional non-blank-string `CHECK` itself was Gate I37 only |
| RLS enabled | PREVIOUSLY VERIFIED / SCHEMA-SOURCE VERIFIED | Gate I37: RLS enabled, exactly one SELECT-only admin policy, zero INSERT/UPDATE/DELETE policies (service-role-only writes) — not independently re-read this gate (RLS flags and policy lists are not exposed by the OpenAPI description) |
| Indexes | PREVIOUSLY VERIFIED / SCHEMA-SOURCE VERIFIED | Gate I37: 4 indexes (`_pkey`, `_candidate_id_idx`, `_candidate_dimension_idx`, `_pending_review_idx`) — not independently re-read this gate |

**Summary:** column existence, types, defaults, NOT NULL set, and both foreign-key targets were freshly **LIVE VERIFIED** this gate via PostgREST's OpenAPI description. Every `CHECK`-constraint-level fact (enumerated values, the exact `reviewed_by`/`reviewed_at` pairing logic, and any possible `extraction_status`-to-reviewer cross-reference) remains at **PREVIOUSLY VERIFIED / SCHEMA-SOURCE VERIFIED** status only, since no read-only method available in this gate can retrieve `CHECK` expression text. **No overstated claim of live verification is made for any `CHECK` constraint's exact logic.**

---

## Part 4 — Final five-row package (verbatim from Gate I41)

All five rows share: `candidate_id = 'd44ff05a-14af-45c2-9f2f-6d530a8a051e'`, `source_type = 'campaign_website'`, `source_published_at = NULL`, `source_account_url = NULL`, `conflict_flag = false`, `conflict_notes = NULL`, `methodology_version = 'campaign_evidence_v1_2026-08'`, and — for this design only, not yet executed — intended `extraction_status = 'human_reviewed'`, `reviewed_by = 'f1fde6f9-07c3-4c76-ae81-ebb2f461a5c3'`, `reviewed_at = now()` (evaluated at actual future execution time, never frozen to this document's 01:07 pm EST authoring timestamp).

| # | dimension | score | confidence | source_url |
|---|---|---|---|---|
| 1 | `growth_development` | `1` | `medium` | `https://martinforpslmayor.com/about-shannon-martin/` |
| 2 | `taxation_spending` | `2` | `high` | `https://martinforpslmayor.com/about-shannon-martin/` |
| 3 | `taxation_spending` | `2` | `high` | `https://martinforpslmayor.com/biography/` |
| 4 | `environment` | `2` | `high` | `https://martinforpslmayor.com/biography/` |
| 5 | `public_safety` | `2` | `high` | `https://martinforpslmayor.com/biography/` |

Rationales (verbatim, read directly from Gate I41):

1. "Campaign page states the candidate has 'worked to attract quality employers, support small businesses, and revitalize key areas of the city' and that 'focusing on infrastructure, reducing red tape, and making targeted investments' supports economic growth, reflecting a permissive, pro-growth economic development approach."
2. "Candidate reduced city debt and lowered the millage rate for ten consecutive years through disciplined budgeting, and helped strengthen the city's economy without raising taxes, keeping the municipal tax rate among the lowest of Florida's 20 largest cities."
3. "Ten consecutive years of millage reductions and significantly reduced city debt, strengthening the city's financial footing and improving bond ratings, reflecting explicit fiscal discipline and debt reduction."
4. "Candidate advocated for acquiring land for future green spaces through the Naturally PSL program, acquired over 280 acres for the Green Spaces and Places Land Bank, championed acquisition of the 105-acre Rosser Lakes Preserve, and supports water quality projects and a septic-to-sewer conversion program to protect the environment."
5. "Advocated for the addition of Districts 5 and 6 police districts now operational, was instrumental in creating a Police Training Facility currently under construction, and championed the creation of the city's Real Time Operations Center integrating technology and real-time data for law enforcement and emergency response."

**Explicitly excluded from this package** (per standing instruction, unchanged): the rejected Rosser Lakes `growth_development -1` row (REJECTED BY DETERMINISTIC VALIDATION), any `transparency` row, any `education` row, any `housing` row.

---

## Part 5 — Draft insert transaction (UNEXECUTED)

```sql
-- ============================================================
-- DRAFT ONLY — NOT EXECUTED IN GATE I42. Requires a separate,
-- explicit write-approval gate (Gate I43) before any execution.
-- ============================================================
BEGIN;

-- Defensive pre-write check (recommended immediately before the INSERT,
-- inside the same transaction, at actual future execution time):
-- SELECT count(*) FROM public.candidate_position_evidence
--   WHERE candidate_id = 'd44ff05a-14af-45c2-9f2f-6d530a8a051e'
--     AND methodology_version = 'campaign_evidence_v1_2026-08';
-- Expected result at time of Gate I42 authoring: 0. A future execution
-- gate must re-run this and abort if the count is no longer 0.

INSERT INTO public.candidate_position_evidence (
  candidate_id,
  dimension,
  score,
  rationale,
  source_type,
  source_url,
  source_published_at,
  source_account_url,
  confidence,
  extraction_status,
  reviewed_by,
  reviewed_at,
  conflict_flag,
  conflict_notes,
  methodology_version
)
VALUES
  (
    'd44ff05a-14af-45c2-9f2f-6d530a8a051e',
    'growth_development',
    1,
    'Campaign page states the candidate has ''worked to attract quality employers, support small businesses, and revitalize key areas of the city'' and that ''focusing on infrastructure, reducing red tape, and making targeted investments'' supports economic growth, reflecting a permissive, pro-growth economic development approach.',
    'campaign_website',
    'https://martinforpslmayor.com/about-shannon-martin/',
    NULL,
    NULL,
    'medium',
    'human_reviewed',
    'f1fde6f9-07c3-4c76-ae81-ebb2f461a5c3',
    now(),
    false,
    NULL,
    'campaign_evidence_v1_2026-08'
  ),
  (
    'd44ff05a-14af-45c2-9f2f-6d530a8a051e',
    'taxation_spending',
    2,
    'Candidate reduced city debt and lowered the millage rate for ten consecutive years through disciplined budgeting, and helped strengthen the city''s economy without raising taxes, keeping the municipal tax rate among the lowest of Florida''s 20 largest cities.',
    'campaign_website',
    'https://martinforpslmayor.com/about-shannon-martin/',
    NULL,
    NULL,
    'high',
    'human_reviewed',
    'f1fde6f9-07c3-4c76-ae81-ebb2f461a5c3',
    now(),
    false,
    NULL,
    'campaign_evidence_v1_2026-08'
  ),
  (
    'd44ff05a-14af-45c2-9f2f-6d530a8a051e',
    'taxation_spending',
    2,
    'Ten consecutive years of millage reductions and significantly reduced city debt, strengthening the city''s financial footing and improving bond ratings, reflecting explicit fiscal discipline and debt reduction.',
    'campaign_website',
    'https://martinforpslmayor.com/biography/',
    NULL,
    NULL,
    'high',
    'human_reviewed',
    'f1fde6f9-07c3-4c76-ae81-ebb2f461a5c3',
    now(),
    false,
    NULL,
    'campaign_evidence_v1_2026-08'
  ),
  (
    'd44ff05a-14af-45c2-9f2f-6d530a8a051e',
    'environment',
    2,
    'Candidate advocated for acquiring land for future green spaces through the Naturally PSL program, acquired over 280 acres for the Green Spaces and Places Land Bank, championed acquisition of the 105-acre Rosser Lakes Preserve, and supports water quality projects and a septic-to-sewer conversion program to protect the environment.',
    'campaign_website',
    'https://martinforpslmayor.com/biography/',
    NULL,
    NULL,
    'high',
    'human_reviewed',
    'f1fde6f9-07c3-4c76-ae81-ebb2f461a5c3',
    now(),
    false,
    NULL,
    'campaign_evidence_v1_2026-08'
  ),
  (
    'd44ff05a-14af-45c2-9f2f-6d530a8a051e',
    'public_safety',
    2,
    'Advocated for the addition of Districts 5 and 6 police districts now operational, was instrumental in creating a Police Training Facility currently under construction, and championed the creation of the city''s Real Time Operations Center integrating technology and real-time data for law enforcement and emergency response.',
    'campaign_website',
    'https://martinforpslmayor.com/biography/',
    NULL,
    NULL,
    'high',
    'human_reviewed',
    'f1fde6f9-07c3-4c76-ae81-ebb2f461a5c3',
    now(),
    false,
    NULL,
    'campaign_evidence_v1_2026-08'
  )
RETURNING
  id,
  dimension,
  score,
  source_url,
  methodology_version,
  reviewed_by,
  reviewed_at;

COMMIT;
```

**The five UUIDs returned by this `RETURNING` clause must be captured immediately at actual future execution time** — they are the only safe basis for the exact-ID rollback in Part 6. `id` uses the column's own `gen_random_uuid()` default; no ID is invented here. No other table is referenced or mutated by this statement.

---

## Part 6 — Draft post-write verification SQL (READ-ONLY, UNEXECUTED)

```sql
-- DRAFT ONLY — NOT EXECUTED. Read-only. Run immediately after a future
-- approved execution, using the five actual RETURNING ids from Part 5.
SELECT
  id,
  dimension,
  score,
  source_url,
  source_published_at,
  source_account_url,
  confidence,
  extraction_status,
  reviewed_by,
  reviewed_at,
  conflict_flag,
  conflict_notes,
  methodology_version,
  source_type
FROM public.candidate_position_evidence
WHERE candidate_id = 'd44ff05a-14af-45c2-9f2f-6d530a8a051e'
  AND methodology_version = 'campaign_evidence_v1_2026-08'
ORDER BY dimension, score;

-- Expected result: exactly 5 rows —
--   growth_development = 1
--   taxation_spending  = 2   (x2)
--   environment        = 2
--   public_safety      = 2
-- For every row: extraction_status = 'human_reviewed',
--   reviewed_by = 'f1fde6f9-07c3-4c76-ae81-ebb2f461a5c3',
--   reviewed_at IS NOT NULL, source_type = 'campaign_website',
--   source_published_at IS NULL, source_account_url IS NULL,
--   conflict_flag = false, conflict_notes IS NULL.
-- Expected absent: no growth_development row with score = -1 (the
--   rejected Rosser Lakes row), no transparency row, no education row,
--   no housing row.
```

---

## Part 7 — Draft exact-ID rollback SQL (UNEXECUTED)

```sql
-- DRAFT ONLY — NOT EXECUTED. Only run if a future approved insert's own
-- verification step (Part 6) fails. IDs below are FUTURE PLACEHOLDERS —
-- they do not exist yet and must be replaced with the five real ids
-- returned by the future INSERT ... RETURNING before this can run.
BEGIN;

DELETE FROM public.candidate_position_evidence
WHERE id IN (
  '<RETURNED-ID-1>',
  '<RETURNED-ID-2>',
  '<RETURNED-ID-3>',
  '<RETURNED-ID-4>',
  '<RETURNED-ID-5>'
)
AND candidate_id = 'd44ff05a-14af-45c2-9f2f-6d530a8a051e'
AND methodology_version = 'campaign_evidence_v1_2026-08'
RETURNING id, dimension, score, source_url;

COMMIT;
```

This rollback is scoped to exact primary-key IDs (plus `candidate_id`/`methodology_version` as defensive, non-primary conditions) — **never** a bare `candidate_id`, `methodology_version`, or `dimension` filter alone, since multiple legitimate evidence rows per dimension are allowed by design and a broader delete could remove rows that were never part of this specific insert.

---

## Hard stops / risk check

- Zero existing Shannon Martin rows (Part 2) — no duplicate-handling logic beyond the standard defensive pre-write recheck is required.
- The `reviewed_by`/`reviewed_at`/`extraction_status` cross-constraint relationship remains partially unconfirmed (Part 3) — mitigated by design, since this package always supplies real values for both fields together regardless of which exact constraint logic is in force.
- **NO DATABASE WRITE WAS EXECUTED IN GATE I42.** Every SQL block above is a draft for a future, separately-approved execution gate only.

## No-change confirmation

Supabase writes = 0. `candidate_position_evidence` inserts = 0. `candidate_positions` changes = 0. `match_scores` changes = 0. Anthropic calls = 0. Gemini calls = 0. `ENABLE_CAMPAIGN_EVIDENCE_EXTRACTION` remains `false`, untouched. No deployment. No secrets printed or committed. Both temporary read-only scripts were deleted after one run each; `git status` confirmed neither remains in the working tree.
