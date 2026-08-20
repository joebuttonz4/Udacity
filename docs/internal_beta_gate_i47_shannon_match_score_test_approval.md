# Gate I47 — Shannon Martin Match-Score Test-User Recomputation Approval

Date: 08-20-2026
Timestamp: 04:36 pm EST

Status: **DOCUMENTATION ONLY. Creating this document is NOT approval and does NOT invoke anything. NO match-score computation was invoked in Gate I47.**

---

## Phase 1 — Selected test user

**`civicmarket.test.01@example.com`, UUID `ec59ea92-470f-447f-8873-ab2dbde52aca`.** Selected because it is the project's established, repeatedly-reused, already-approved test account (used across Gates I31, I34, and the Milestone 2A ZIP resubmission test) — not a newly invented account. No ambiguity; no other candidate account needed to be considered.

- Live-confirmed via `auth.admin.listUsers()`: id matches, email matches.
- Has a `civic_dna` row: **yes**.
- Has ballot/candidate eligibility including Shannon Martin: **yes** — `user_districts` includes the Mayor district (`11111111-0000-0000-0000-000000000006`), which is Shannon's `district_id`.

---

## Phase 2 — Test user read-only state

- **`civic_dna`** (most recent row, `created_at 2026-07-02T20:52:44.68Z`):

  | growth_development | taxation_spending | education | environment | public_safety | housing | transparency |
  |---|---|---|---|---|---|---|
  | 1 | 1.5 | 0 | 1 | -2 | -0.5 | 1.5 |

- **`user_districts`:** 6 rows — City Council District 1, School Board District 1, County Commission At-Large, FL House District 85, FL Senate District 27, **Mayor** (confirms Shannon eligibility).
- **Shannon Martin candidate row:** confirmed `district_id` = Mayor district, `archived_at IS NULL` (active, not archived).
- **Current `match_scores` rows for this user:** **0** (empty — clean slate, no prior scores of any kind).
- **Shannon Martin `match_scores` row exists already:** **no**.

---

## Phase 3 — `compute-match-scores` inspection

Fully read (`src/app/api/compute-match-scores/route.ts`):

- **Endpoint:** `POST /api/compute-match-scores`.
- **Auth:** Bearer token required; resolves the calling user via `supabase.auth.getUser(token)`. Only computes scores for the authenticated caller — cannot be pointed at an arbitrary `user_id` by request body.
- **Writes `match_scores`:** yes — this is its sole write target. No other table is mutated anywhere in the route.
- **Scope:** recomputes for **every eligible candidate** in the user's district scope in one call, not a single named candidate — but only candidates that already have a `candidate_positions` row actually produce a score; every other candidate is `skipped` (counted, not written).
- **Delete-then-insert:** yes — `DELETE FROM match_scores WHERE user_id = <caller> AND candidate_id IN (<eligible candidate ids>)`, immediately followed by a bulk `INSERT` of the newly computed rows. This delete is narrowly scoped to only the caller's own rows among their own eligible-candidate set — it cannot touch another user's data.
- **Candidates without `candidate_positions`:** `if (!pos) { skipped++; continue }` — skipped entirely, no row written, no error.
- **Shannon's 4 non-null dimensions:** each non-null dimension contributes `100 - (|userVal - candidateVal| / 4.0) * 100` to an `alignments` array; the 3 null dimensions (`education`, `housing`, `transparency`) are skipped via `if (candidateVal === null) continue` — never treated as 0.
- **Formula:** `score = Math.min(100, Math.max(0, Math.round(average(alignments))))`.
- **Missing dimensions:** confirmed skipped, not defaulted.
- **Other tables mutated:** none.

**Safe to run for this one test user:** yes — the route is inherently scoped to the authenticated caller only; no cross-user mutation is possible through it.

---

## Phase 4 — Expected Shannon score (calculated read-only, reproducing the exact app formula)

| Dimension | Shannon value | User DNA value | Distance | Alignment |
|---|---|---|---|---|
| `growth_development` | 1 | 1 | 0 | 100 |
| `taxation_spending` | 2 | 1.5 | 0.5 | 87.5 |
| `environment` | 2 | 1 | 1 | 75 |
| `public_safety` | 2 | -2 | 4 | 0 |
| `education` | NULL | 0 | — | *excluded* |
| `housing` | NULL | -0.5 | — | *excluded* |
| `transparency` | NULL | 1.5 | — | *excluded* |

`average = (100 + 87.5 + 75 + 0) / 4 = 65.625` → `Math.round(65.625) = 66`.

**Expected Shannon Martin match score for this test user: `66`.**

Verified by running this exact JS formula (not a re-derivation) against the live-read values above — not assumed.

---

## Phase 5 — Blast radius

Live-checked: this test user's district scope currently yields **12 eligible candidates** (this count grew since earlier gates due to unrelated concurrent candidate-import work — observed, not caused by this gate). Of those 12, **exactly one — Shannon Martin — has a `candidate_positions` row.** The other 11 (`Eric Reikenis`, `Indony Baptiste`, `Kevin Zimmerman`, `Eric Strazzeri`, `Steven Giordano`, `Anthony Bonna`, `Wayne Richter`, `Amr Metwally`, `Hunter Stone`, `Rick Meltzer`, `Steven Harrington`) all have `hasCandidatePositions: false` — confirmed live — so every one of them would be `skipped`, not written.

- **Does it create only Shannon's score?** Yes, in practice — the route attempts all 12, but only Shannon has data to score.
- **Does it create scores for every eligible candidate with positions?** Yes, and Shannon is the only one with positions.
- **Exact resulting `match_scores` rows:** exactly **one** — `(user_id: ec59ea92-..., candidate_id: d44ff05a-..., score: 66)`.
- **Does the route delete existing scores first?** Yes, scoped to this user's own eligible-candidate set — confirmed this user currently has **0** existing `match_scores` rows, so the delete affects 0 rows.
- **Could existing test-user scores be affected?** No pre-existing rows exist to be affected.
- **Is rollback straightforward?** Yes — see Phase 8.

**Blast radius confirmed narrow and exactly as expected: one new row, zero deletions, zero effect on any other candidate or user.**

---

## Phase 6 — Pre-write verification (design, to run immediately before any future invocation)

```sql
-- All read-only.
SELECT id, email FROM auth.users WHERE id = 'ec59ea92-470f-447f-8873-ab2dbde52aca'; -- identity unchanged
SELECT growth_development, taxation_spending, education, environment, public_safety, housing, transparency
  FROM public.civic_dna WHERE user_id = 'ec59ea92-470f-447f-8873-ab2dbde52aca'
  ORDER BY created_at DESC LIMIT 1; -- Civic DNA unchanged from Phase 2 table
SELECT * FROM public.candidate_positions WHERE candidate_id = 'd44ff05a-14af-45c2-9f2f-6d530a8a051e'; -- Shannon's row unchanged from Gate I46
SELECT 1 FROM public.user_districts
  WHERE user_id = 'ec59ea92-470f-447f-8873-ab2dbde52aca'
    AND district_id = '11111111-0000-0000-0000-000000000006'; -- Shannon still eligible
SELECT count(*) FROM public.match_scores WHERE user_id = 'ec59ea92-470f-447f-8873-ab2dbde52aca'; -- expect 0
SELECT count(*) FROM public.match_scores
  WHERE user_id = 'ec59ea92-470f-447f-8873-ab2dbde52aca'
    AND candidate_id = 'd44ff05a-14af-45c2-9f2f-6d530a8a051e'; -- expect 0
SELECT count(*) FROM public.candidate_positions; -- expect 1 (only Shannon) — abort/re-plan if this has changed
```

---

## Execution method (for a future, separately-approved invocation)

`POST /api/compute-match-scores` with the test user's own valid Bearer token (obtained the same way every prior live gate obtained it — via the already-authenticated admin/test browser session, never entered/typed by the assistant). This is the existing application route, not a new script — no new mutation code is being written for this action.

---

## Phase 7 — Post-write verification (design)

```sql
-- All read-only.
SELECT * FROM public.match_scores
  WHERE user_id = 'ec59ea92-470f-447f-8873-ab2dbde52aca'
    AND candidate_id = 'd44ff05a-14af-45c2-9f2f-6d530a8a051e';
-- Expected: exactly 1 row, score = 66.

SELECT count(*) FROM public.match_scores WHERE user_id = 'ec59ea92-470f-447f-8873-ab2dbde52aca';
-- Expected: exactly 1 (no other candidate produced a score, per Phase 5).

SELECT * FROM public.candidate_positions WHERE candidate_id = 'd44ff05a-14af-45c2-9f2f-6d530a8a051e';
-- Expected: unchanged from Gate I46.

SELECT id, dimension, score, extraction_status FROM public.candidate_position_evidence
  WHERE candidate_id = 'd44ff05a-14af-45c2-9f2f-6d530a8a051e' ORDER BY dimension;
-- Expected: unchanged, same 5 rows.

SELECT growth_development, taxation_spending, education, environment, public_safety, housing, transparency
  FROM public.civic_dna WHERE user_id = 'ec59ea92-470f-447f-8873-ab2dbde52aca'
  ORDER BY created_at DESC LIMIT 1;
-- Expected: unchanged from Phase 2/6.

SELECT count(*) FROM public.match_scores WHERE user_id <> 'ec59ea92-470f-447f-8873-ab2dbde52aca';
-- Expected: 0 — confirms no other user's data was touched.
```

**Exact expected score to verify against: `66`.**

---

## Phase 8 — Rollback (design, NOT executed)

`match_scores` rows are keyed by the `(user_id, candidate_id)` pair (per the route's own delete logic — `.eq('user_id', userId).in('candidate_id', candidateIds)`; no separate primary-key inspection was needed since the application's own write path already demonstrates this is the safe, sufficient key).

Since the verified pre-write state has **zero** existing rows for this user, and the future invocation is expected to create **exactly one** (Shannon's), the narrowest safe rollback is:

```sql
-- DRAFT ONLY — NOT EXECUTED.
DELETE FROM public.match_scores
WHERE user_id = 'ec59ea92-470f-447f-8873-ab2dbde52aca'
  AND candidate_id = 'd44ff05a-14af-45c2-9f2f-6d530a8a051e'
RETURNING *;
```

This is safe by construction: the pre-write check (Phase 6) confirms zero rows for this user before execution, so a rollback scoped to this exact `(user_id, candidate_id)` pair cannot remove any row that predates this specific test invocation. **Only use this rollback if post-write verification (Phase 7) fails.**

---

## No-change boundaries

- `candidate_positions`: not modified by this action (read-only consumed).
- `candidate_position_evidence`: not modified.
- `civic_dna`: not modified (read-only consumed).
- Schema, RLS, grants, functions: not modified.
- No other user's `match_scores`: not touched — the route's delete/insert is scoped to the calling user's own token identity only.
- No deployment.

## Exact future approval statement

> I explicitly approve Gate I47 to invoke the documented compute-match-scores path for test user ec59ea92-470f-447f-8873-ab2dbde52aca only, with the documented pre-write verification and immediate post-write verification. I approve the documented rollback only if verification fails. Do not modify candidate_positions, candidate_position_evidence, civic_dna, schema, RLS, functions, or any other user's data.

**Creating this document does not constitute that approval.**

## No-change confirmation

`compute-match-scores` was **not invoked** in Gate I47. No `match_scores` write occurred. No `candidate_positions`/`candidate_position_evidence`/`civic_dna` change occurred. No Anthropic/Gemini call. No deployment. No secrets printed. Three temporary read-only diagnostic scripts were created, inspected for zero mutation calls, run once each, and deleted; `git status` confirmed none remain in the working tree.
