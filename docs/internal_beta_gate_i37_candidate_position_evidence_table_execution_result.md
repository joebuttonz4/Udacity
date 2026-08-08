# Gate I37 — candidate_position_evidence Table Creation and Verification

Date: 08-08-2026
Timestamp: 03:46 pm EST

Status: **Complete. Table created, RLS enabled, single admin-only SELECT policy and three indexes verified live. Zero evidence rows exist. No candidate scoring occurred.**

Note on numbering: this work was originally tracked in-conversation as "Gate I35." At documentation time, `CIVICMARKET_CURRENT_STATE.md` was found to already contain an unrelated Gate I35 and Gate I36 (Onboarding City Council Default-Assignment design and implementation), completed in a different session. This work is recorded as **Gate I37** instead, to avoid a duplicate gate number in the authoritative state document. No content from Gate I35/I36 was altered.

## Purpose

Create the minimum schema needed to preserve source-backed, candidate-controlled evidence used to derive `candidate_positions` dimension scores for beta, without touching `candidate_positions` or `match_scores` directly. This table is internal provenance/working data — it does not itself drive match scores; a separate, future, explicitly-approved gate will read approved evidence rows and write scoped updates to `candidate_positions`.

This gate is the execution of a design that was drafted and revised across four prior documentation-only gates in this session: initial inspection of the existing schema/match-score/RLS landscape, the first DDL/RLS/index draft, a revision incorporating required constraint tightening and the `methodology_version` requirement, and an execution-approval package that was itself revised once more to wrap `CREATE TABLE`, `ENABLE ROW LEVEL SECURITY`, `CREATE POLICY`, and `CREATE INDEX` inside a single atomic transaction before execution.

## Approved scope

- One new table: `public.candidate_position_evidence`.
- RLS enabled, one admin-only SELECT policy, zero write policies (service-role-only writes).
- Three indexes plus the primary key index.
- No `candidate_positions` change. No `match_scores` change. No evidence rows inserted. No application source code change.
- `official_social` retained as a valid `source_type` schema value only — actual ingestion remains explicitly deferred pending a separate, not-yet-designed candidate-source allowlist gate.
- Shannon Martin (`candidate_id d44ff05a-14af-45c2-9f2f-6d530a8a051e`) explicitly excluded from this gate — no evidence created, no scoring performed, no campaign content fetched.

## Atomic execution approach

Per the final revised execution-approval package, `CREATE TABLE`, `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`, `CREATE POLICY`, and all three `CREATE INDEX` statements were wrapped in a single explicit transaction (`BEGIN; ... COMMIT;`) and executed as one unit in the Supabase SQL Editor. This closes the gap present in an earlier draft of the package, where running these as separate statements could have left the table briefly existing without RLS enabled. Because a failure at any point inside the transaction would have rolled back the entire block — including the `CREATE TABLE` itself — there was no possible intermediate state where the table existed without RLS, without its policy, or without its indexes.

Pre-execution checks and post-execution verification were both run as separate, read-only executions outside the transaction, exactly as designed.

## Pre-execution checks

Run before the transaction, read-only:

- `candidate_position_evidence` did not already exist.
- None of the 10 planned CHECK constraint names, the 3 planned index names, or the planned policy name conflicted with anything existing.
- `candidates` table existed (FK target for `candidate_id`).
- `profiles` table existed (FK target for `reviewed_by`, and source of `is_admin` for the RLS policy).
- `profiles.is_admin` column existed as `boolean`.

All pre-execution checks passed.

## Execution result

The atomic transaction executed successfully and committed. `public.candidate_position_evidence` now exists live in Supabase with 18 columns, 10 CHECK constraints, 2 foreign keys, RLS enabled, one SELECT policy, and 4 indexes, as designed.

## Post-execution verification results

- Table exists: confirmed.
- 18 expected columns present: confirmed.
- `methodology_version` is `NOT NULL`: confirmed. No column default exists for it — every future insert must explicitly provide a methodology version.
- 10 CHECK constraints present: confirmed — `dimension_valid`, `score_valid`, `source_type_valid`, `confidence_valid`, `extraction_status_valid`, `source_url_not_blank`, `rationale_required_for_score`, `social_requires_account`, `review_fields_consistent`, `methodology_version_not_blank`.
- `candidate_id` foreign key references `candidates(id) ON DELETE CASCADE`: confirmed.
- `reviewed_by` foreign key references `profiles(id) ON DELETE SET NULL`: confirmed.
- RLS enabled (`relrowsecurity = true`): confirmed.
- `relforcerowsecurity = false`: confirmed and accepted — this is expected and correct under the approved service-role management model, since `FORCE ROW LEVEL SECURITY` only matters for table owners, and this table's owner (the service role used for future writes) is intended to bypass RLS by design; forcing RLS would break the very write path this table was designed around.
- Exactly one policy exists: `"Admins can read candidate position evidence"`, command = SELECT: confirmed.
- Zero INSERT/UPDATE/DELETE policies: confirmed — writes remain service-role-only.
- 4 indexes exist: `candidate_position_evidence_pkey`, `candidate_position_evidence_candidate_id_idx`, `candidate_position_evidence_candidate_dimension_idx`, `candidate_position_evidence_pending_review_idx`: confirmed.
- Table row count = 0: confirmed.

## Methodology version

Approved initial methodology version for the beta campaign-derived evidence methodology:

```
campaign_evidence_v1_2026-08
```

This value is **not** a database default — `methodology_version` has no `DEFAULT` clause. Every future evidence insert must explicitly provide it, so provenance stays intentional rather than inherited silently. A future methodology revision (e.g. adding multi-source aggregation rules) would use a new version string (e.g. `campaign_evidence_v2_...`) rather than mutating existing rows' recorded version.

## Security / RLS state

- `candidate_position_evidence` is not publicly readable and not readable by ordinary authenticated users — only rows visible to a session where `profiles.is_admin = true` for `auth.uid()`, via the single SELECT policy.
- No INSERT, UPDATE, or DELETE policy exists at all. Combined with RLS being enabled, this means anon and authenticated sessions — including admin sessions — cannot write to this table under any circumstance through the public API. Only a service-role client (bypassing RLS entirely, per the existing `src/lib/supabase-server.ts` pattern already used by `compute-match-scores`) can write.
- This mirrors the established admin-read/service-role-write pattern already used by `agent_staging`, `agent_runs`, and `monitored_sources`.
- No existing RLS policy on any other table was created, modified, or removed.

## No-change confirmation

- No evidence rows were inserted.
- No Shannon Martin evidence was created.
- No Shannon Martin scoring was performed.
- No campaign content was fetched during this gate.
- No Anthropic/Claude API calls were made.
- No `candidate_positions` row was created or modified.
- No `match_scores` row was created or modified.
- No `official_social` ingestion occurred.
- No social-media allowlist was created.
- No application source code was changed.
- No deployment occurred.
- `ENABLE_CITY_COUNCIL_DISTRICT_WRITE` remains `false`, unchanged.
- `ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE` remains `false`, unchanged.
- No other existing table, function, RLS policy, or grant was touched.
- No content from the pre-existing Gate I35 or Gate I36 (Onboarding City Council Default-Assignment) was altered by this gate.

## Deferred work

- `official_social` ingestion — deferred pending a separate, explicitly approved candidate-source allowlist mechanism. `official_social` remains a valid `source_type` schema value only; recording a `source_account_url` proves a URL was captured, not that the account is allowlisted.
- Shannon Martin (`d44ff05a-14af-45c2-9f2f-6d530a8a051e`) campaign-website evidence pilot — remains the next candidate-scoring task. No evidence exists for her yet.
- The future scoped write step that reads approved `candidate_position_evidence` rows and commits values into a candidate's `candidate_positions` row — not designed for execution in this gate, remains its own separately-approved future gate.
- Any admin UI to browse or review this table — not built.

## Risk check

- **Scope:** one new table created via a single atomic transaction; RLS and its one policy and all indexes committed together with the table.
- **Expected result:** matches actual result — table exists, empty, RLS-enabled, admin-read-only, service-role-write-only, all constraints and indexes present.
- **What remains unchanged:** every other table, function, RLS policy, grant, `candidate_positions` row, `match_scores` row, application source code, and both district-assignment write guards.
- **Security implications:** none negative — this table is more restrictively locked down than most of the schema (admin-SELECT-only, zero write policies), consistent with its role as internal provenance/working data.
- **Test plan:** executed as designed — read-only pre-checks before the transaction, read-only post-execution verification after, both passed in full.
- **Rollback:** `DROP TABLE IF EXISTS candidate_position_evidence;` remains available and fully self-contained — nothing else in the schema references this table.

## Next recommended gate

Gate I38 — Shannon Martin campaign-website source verification (read-only, documentation-only): confirm whether a genuine, candidate-controlled campaign website exists for Shannon Martin before any extraction is attempted, mirroring the source-verification standard already applied to the four City Council District 1 candidates in Gates I13/I18. No evidence should be drafted or inserted until that verification passes.
