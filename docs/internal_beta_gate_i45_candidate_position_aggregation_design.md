# Gate I45 — Candidate-Position Aggregation Design

Date: 08-20-2026
Timestamp: 04:18 pm EST

Status: **Design + read-only verification complete.** No Supabase write. No `candidate_positions`/`match_scores` change. No Anthropic/Gemini call. No deployment.

---

## Part 1 — Current `candidate_positions` model (read-only inspection)

**Important correction to the task's framing:** `candidate_positions` is **not** one row per candidate+dimension. It is a **wide table — one row per candidate**, with all seven dimensions as individual columns on that single row.

Exact schema (`Reference Files/civicmarket_schema_v4.sql`):

```sql
CREATE TABLE IF NOT EXISTS candidate_positions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid REFERENCES candidates(id) ON DELETE CASCADE,
  growth_development numeric(4,2),
  taxation_spending numeric(4,2),
  education numeric(4,2),
  environment numeric(4,2),
  public_safety numeric(4,2),
  housing numeric(4,2),
  transparency numeric(4,2),
  vote_count int DEFAULT 0,
  community_score_count int DEFAULT 0,
  has_dna_score boolean DEFAULT false,
  data_completeness text DEFAULT 'pulse_only', -- full|partial|pulse_only
  voting_weight numeric(3,2) DEFAULT 0.70,
  sentiment_weight numeric(3,2) DEFAULT 0.30,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(candidate_id)
);
```

- **Columns:** as above — 15 total, `UNIQUE(candidate_id)` enforces exactly one row per candidate.
- **One row per candidate+dimension?** No — one row per candidate; each dimension is its own nullable `numeric(4,2)` column on that row.
- **Score range:** column type allows any `numeric(4,2)` value; no `CHECK` constraint enforcing -2..2 exists on this table (unlike `candidate_position_evidence`, which does enforce -2..2 at the database level). The aggregation logic itself is the only thing that will keep values in range — see Part 3.
- **Confidence/source/provenance on this table:** **none.** No column here stores confidence, source URL, evidence ID, reviewer, or methodology version. This table is a pure numeric summary; the only place provenance lives is `candidate_position_evidence`.
- **`data_completeness`, `voting_weight`, `sentiment_weight`, `vote_count`, `community_score_count`, `has_dna_score`:** legacy columns from the original voting-record/community-sentiment scoring design (see the still-present `recompute_candidate_positions()` PL/pgSQL function, which derives these purely from `voting_records` — a completely separate, older pathway from the campaign-evidence pilot). **Grepped `src/` and confirmed none of these columns are read anywhere in current application code** — `compute-match-scores/route.ts` only selects the seven dimension columns plus `candidate_id`. These legacy columns are dead weight for this pilot's purposes, not a blocker.
- **Existing rows for any candidate:** **zero.** A live read-only query confirmed `candidate_positions` has 0 rows system-wide, for every candidate, not just Shannon. Every candidate ring in the entire app is currently locked.
- **Shannon's own row:** confirmed absent. Her `candidates` row: `office: Mayor`, `is_incumbent: true`, 0 `voting_records`.

**How `match_scores` consumes `candidate_positions`** (`src/app/api/compute-match-scores/route.ts`, fully read):

```ts
const { data: positionRows } = await supabase
  .from('candidate_positions')
  .select('candidate_id, growth_development, taxation_spending, education, environment, public_safety, housing, transparency')
  .in('candidate_id', candidateIds)
...
for (const { id: candidateId } of candidates) {
  const pos = positionMap.get(candidateId)
  if (!pos) { skipped++; continue }          // no row at all → candidate skipped entirely (locked)

  const alignments: number[] = []
  for (const dim of DIMENSIONS) {             // DIMENSIONS = all 7 keys, from src/lib/dna.ts
    const candidateVal = pos[dim]
    if (candidateVal === null) continue        // null column → dimension SKIPPED, never treated as 0
    const userVal = dna[dim]
    const distance = Math.abs(userVal - candidateVal)
    alignments.push(100 - (distance / 4.0) * 100)
  }

  if (alignments.length === 0) { skipped++; continue }   // row exists but every dimension null → still skipped

  const avg = alignments.reduce((sum, v) => sum + v, 0) / alignments.length  // averages ONLY over non-null dims
  const score = Math.min(100, Math.max(0, Math.round(avg)))
  scoreRows.push(...)
}
```

- **Missing dimensions:** confirmed **skipped**, never defaulted to 0 — this is the single most load-bearing fact for this whole design.
- **No minimum-dimension threshold** exists anywhere in this code — a candidate with exactly one non-null dimension still produces a match score.

---

## Part 2 — Aggregation principles

1. **Eligible `extraction_status` values:** `human_reviewed` only, for this pilot. `draft` is excluded (unreviewed model output — the entire point of the human-review step is that nothing unreviewed reaches `candidate_positions`). An `approved` value was speculated in the task prompt but was never confirmed to exist in the actual `extraction_status` `CHECK` constraint by any source available in Gate I42 — do not assume it exists; if it does exist as a distinct post-`human_reviewed` state in the future, it should be added to the eligible set explicitly, not assumed now. Rejected rows (`REJECTED BY DETERMINISTIC VALIDATION`, e.g. the Rosser Lakes `-1` row) never even reach `candidate_position_evidence` — they're filtered out before insertion by the extraction route itself, so there is no `rejected` `extraction_status` state to exclude here.

2. **Multiple same-sign rows:** cap at the strongest (highest-magnitude) score present; never sum. `+2, +2 → +2` (not `+4`, which would also violate the -2..2 range every downstream consumer assumes even though this table has no `CHECK` enforcing it).

3. **Mixed-strength same-sign rows (`+1` and `+2`):** **recommend "strongest evidence wins"** (take the row with the larger absolute value), not a weighted average or median. Reasoning: each evidence row's score was independently assigned against the same documented Gate I39 threshold rubric (a `+1` means "general directional stance," a `+2` means "concrete, specific, named commitment"). If *any* piece of evidence meets the `+2` bar, that fact is real and independently verified — averaging it down with a weaker `+1` on the same side would discard verified information, not average away noise. This also **matches the project's own actual precedent**: Gate I40/I41's human review of the Row 4 `environment` evidence didn't average a `+1` and `+2` reading of the *same* evidence — it corrected the score to the stronger, better-justified `+2` outright. A median or weighted-average rule would be less transparent and harder to audit than "take the max magnitude, cite which row justified it."

4. **Opposite-sign reviewed evidence:** **do not average, do not pick a side automatically.** Recommend: **block the automatic write entirely for that dimension** — mark it `BLOCKED_PENDING_HUMAN_ADJUDICATION` in documentation/logs, and do not create or update that dimension's column value. This mirrors the exact "do not average, flag for review" rule already established and enforced at the evidence layer (`crossCheckConflicts()` in the extraction route) — extending the same philosophy one layer up is consistent, not novel. No opposite-sign case currently exists in the live Shannon data (her one surviving `growth_development` row is `+1`; the `-1` row was already rejected before it could ever reach `candidate_position_evidence`), so this rule is currently untested against a real conflict, but it must exist before any dimension with genuine conflicting evidence is ever aggregated.

5. **Null/insufficient-evidence rows:** confirmed by the extraction pipeline design (Gate I39 §) that a `null`-scored row means "insufficient evidence to assign a direction," not "neutral." Such rows must **never** count toward the numeric aggregate and must never, by themselves, justify writing a `0` into `candidate_positions`.

6. **Missing dimensions (no eligible evidence at all):** given the corrected one-row-per-candidate schema, "no row" isn't the right framing for a dimension — the right framing is **that specific column stays `NULL` on the candidate's one row.** Recommend explicitly: leave the column `NULL`, never write `0` as a stand-in for "no evidence yet." This is exactly what `compute-match-scores` already correctly treats as "skip this dimension," so the unknown/neutral distinction is preserved by construction, not by convention alone.

7. **Confidence:** **does not alter the numeric score.** It remains supporting review metadata only (already stored per-row in `candidate_position_evidence`, never copied into `candidate_positions`, which has no confidence column at all). A `medium`-confidence `+1` and a `high`-confidence `+1` aggregate identically.

8. **Duplicate corroborating evidence (e.g. two `taxation_spending +2` rows from different pages):** does **not** increase the numeric score above the strongest supported value — corroboration from an independent second source is meaningful (worth noting in documentation/audit trail) but is not itself grounds for a higher score than the evidence threshold rubric already assigned. Two `+2` rows aggregate to `+2`, not `+2.x` or `+3`.

9. **Duplicate/near-duplicate evidence (same underlying claim repeated across pages):** the current Shannon data does not actually contain this case — the two `taxation_spending +2` rows cite genuinely distinct source pages with overlapping-but-not-identical rationale text (Gate I40 confirmed both independently verbatim against their respective pages). Recommend for the general rule: if two rows share the same `dimension` + `score` + a substantially identical `rationale` string, treat them as one data point for aggregation purposes (do not let literal duplication masquerade as independent corroboration) — but this is a documentation-level convention for future human reviewers to apply, not a new deterministic string-similarity algorithm; building automatic near-duplicate detection is out of scope for this design gate.

10. **Different `methodology_version` values:** **never mix automatically.** Aggregate only within one `methodology_version` at a time; if a future methodology version supersedes `campaign_evidence_v1_2026-08`, that is a separate, explicitly-approved migration decision, not something the aggregation function silently bridges.

---

## Part 3 — Recommended baseline rule: assessed as SAFE

The task's proposed baseline (A–H) was evaluated against Parts 1–2 and against the live schema. **It is safe and compatible with the existing app, with one clarification:**

- **A–C, E–H as proposed:** all consistent with Parts 1–2 above; no changes needed.
- **D (opposite-sign → block):** consistent with Part 2 item 4; recommend adopting exactly as proposed.
- **Clarification on "candidate_positions row":** since the schema is one-row-per-candidate, "do not create a `candidate_positions` row" (item B) really means, in implementation terms, one of two things depending on whether the candidate already has *any* row: (i) if no row exists yet, and *zero* dimensions have eligible evidence, do not create the row at all; (ii) if a row will be created because *at least one* dimension has eligible evidence, every *other* dimension with zero eligible evidence must be written as `NULL` on that same row, not omitted or defaulted to `0`. Shannon is case (ii): her row will be created (4 dimensions have evidence) with the other 3 columns explicitly `NULL`.

**No changes to the proposed baseline are required.** It is adopted as the final rule for this gate.

---

## Part 4 — Rule applied to Shannon Martin (no write performed)

| Dimension | Eligible evidence (human_reviewed, non-null) | Source scores | Aggregate decision | Auto-write allowed? | Rationale |
|---|---|---|---|---|---|
| `growth_development` | 1 row | `+1` | **`+1`** | Yes | Single eligible row, no conflict — pass-through |
| `taxation_spending` | 2 rows | `+2`, `+2` | **`+2`** | Yes | Same sign, same magnitude — trivially `+2`, not `+4` |
| `environment` | 1 row | `+2` | **`+2`** | Yes | Single eligible row, no conflict — pass-through |
| `public_safety` | 1 row | `+2` | **`+2`** | Yes | Single eligible row, no conflict — pass-through |
| `education` | 0 rows | — | **no value (column stays NULL)** | N/A — nothing to write | No eligible evidence exists |
| `housing` | 0 rows | — | **no value (column stays NULL)** | N/A | No eligible evidence exists |
| `transparency` | 0 rows | — | **no value (column stays NULL)** | N/A | No eligible evidence exists |

**Confirmed: matches the task's expected likely result exactly** (`growth_development +1`, `taxation_spending +2`, `environment +2`, `public_safety +2`, and no value for the other three), derived here from the actual current live evidence rows and the actual rule, not merely assumed.

---

## Part 5 — Match-score consequences (critical section)

Answers, from direct code inspection (Part 1):

1. **If Shannon has only 4 of 7 dimensions populated, what happens?** `compute-match-scores` processes her normally — her row exists (`pos` truthy) and `alignments.length` will be 4 (> 0), so a `match_scores` row is generated using only those 4 dimensions.
2. **Does the algorithm require all 7?** No — no such check exists anywhere in the route.
3. **Is there a minimum threshold?** No explicit minimum-dimension-count threshold. The only implicit floor is `alignments.length === 0` → skip, i.e. effectively "at least 1 non-null dimension."
4. **Does partial coverage distort the percentage?** Not a bug — the average is an honest mean over exactly the dimensions with real candidate data. But this **is a genuine fairness/interpretability risk**, not a coding defect: a candidate with 1 strongly-aligned dimension and a candidate with 7 moderately-aligned dimensions could both show high percentages that aren't apples-to-apples comparable, and — more importantly for beta — **Shannon would become the only candidate in the entire system with any match score at all**, system-wide, the moment this write happens. This directly intersects the project's own established Gate I12–I18 philosophy ("locked rings are safer than unsupported or inconsistently sourced scores... CivicMarket prefers no score over an unsupported score"). This is flagged as the **single most important open risk** below — not a code defect, a product/communication decision.
5. **Does it normalize only over dimensions with candidate evidence?** Yes, confirmed directly in the averaging line.
6. **Could missing dimensions incorrectly act like neutral 0?** No — confirmed `continue`d out of the loop entirely, never included in the average as a `0`.
7. **Would creating these 4 rows unlock the match ring?** Yes, technically — but only for a user who (a) has completed the Civic DNA quiz and (b) has (or later gets) `compute-match-scores` re-invoked for them (quiz retake, or any future recompute trigger) — it is not retroactive for a user's already-existing `match_scores` rows.
8. **Is any additional code change required before writing `candidate_positions`?** **No.** The existing `compute-match-scores` route and the existing locked-ring UI logic (Gates I14–I17, unchanged) already correctly handle a partial-dimension row exactly as this design requires — no code defect blocks this write. **What is recommended before writing is a product decision, not a code fix** — see "Unresolved risks" below.

---

## Part 6 — Provenance / audit link recommendation

`candidate_positions` has no column capable of referencing `candidate_position_evidence` row IDs (confirmed in Part 1 — no such column exists, and adding one is a schema change, out of scope for this design gate).

**Recommended lowest-risk beta approach: documentation-only, backed by deterministic regeneration.** Concretely: a future write-execution gate document (like Gate I44's execution record) states, in plain text, exactly which `candidate_position_evidence` row IDs (already known — see Gate I44) justify each written `candidate_positions` dimension value, using this gate's exact deterministic rule. Because the rule is fully deterministic and the evidence rows are immutable historical records, the `candidate_positions` values can always be **regenerated and cross-checked** from `candidate_position_evidence` + this document at any future time — that regeneration capability *is* the audit trail, without needing a live foreign key. A dedicated linkage table or new source-metadata columns on `candidate_positions` would be the more robust long-term answer once this pattern scales past a single pilot candidate, but is unnecessary schema risk for a one-candidate beta pilot right now.

---

## Part 7 — Future write design (NOT EXECUTED)

**Pre-write verification (at actual future execution time):**
1. Re-query `candidate_position_evidence` for `candidate_id = 'd44ff05a-14af-45c2-9f2f-6d530a8a051e'` AND `methodology_version = 'campaign_evidence_v1_2026-08'` AND `extraction_status = 'human_reviewed'` — confirm the same 5 rows (same IDs as Gate I44) with unchanged scores. Abort if anything has changed.
2. Re-query `candidate_positions` for this `candidate_id` — confirm still 0 rows (no existing row to conflict with). If a row now exists, switch to an explicit update-review path rather than a blind insert.

**Exact intended write (upsert, not insert-only, since `candidate_id` is `UNIQUE`):**
```sql
INSERT INTO candidate_positions (
  candidate_id, growth_development, taxation_spending, education,
  environment, public_safety, housing, transparency, updated_at
) VALUES (
  'd44ff05a-14af-45c2-9f2f-6d530a8a051e', 1, 2, NULL, 2, 2, NULL, NULL, now()
)
ON CONFLICT (candidate_id) DO UPDATE SET
  growth_development = EXCLUDED.growth_development,
  taxation_spending  = EXCLUDED.taxation_spending,
  education          = EXCLUDED.education,
  environment        = EXCLUDED.environment,
  public_safety      = EXCLUDED.public_safety,
  housing            = EXCLUDED.housing,
  transparency       = EXCLUDED.transparency,
  updated_at         = now()
RETURNING id, candidate_id, growth_development, taxation_spending, education, environment, public_safety, housing, transparency, updated_at;
```
Legacy columns (`vote_count`, `community_score_count`, `has_dna_score`, `data_completeness`, `voting_weight`, `sentiment_weight`) are deliberately **left untouched at their table defaults** — they are unused by any current application code (Part 1) and none accurately describe "campaign-evidence-derived" provenance; inventing a value for `data_completeness` (whose enum is `full|partial|pulse_only`, none of which mean "campaign-evidence, human-reviewed, partial-dimension") would be misleading rather than helpful, and since nothing reads it, leaving it at its default causes no functional harm. **This is flagged as an unresolved naming/semantics question, not a blocker** — a future gate could either accept the harmless mismatch or introduce a proper provenance field.

**Duplicate/upsert behavior:** `ON CONFLICT (candidate_id) DO UPDATE` is a single atomic statement — no separate delete-then-insert race window.

**Post-write verification (read-only):** re-select the row by `candidate_id`, confirm the six populated/null values above and `updated_at` changed.

**Rollback:** since this is an upsert against a table confirmed empty for Shannon beforehand, rollback is a straight `DELETE FROM candidate_positions WHERE candidate_id = 'd44ff05a-14af-45c2-9f2f-6d530a8a051e'` — safe precisely because the pre-write check confirms no prior row exists to lose.

**Expected match-score impact:** no `match_scores` rows change automatically at write time (the write only touches `candidate_positions`) — a `match_scores` row only appears for a given user after that user's own `compute-match-scores` call runs again.

**No-change boundaries:** no other candidate's `candidate_positions` touched; `match_scores` untouched by this write itself; no schema/RLS/grant/migration change; no deployment.

**This gate does not generate a Gate I46 write-approval package.** Per the instruction not to generate execution approval while any design issue remains unresolved, the fairness/communication question below is left open for an explicit human decision first.

---

## Unresolved risks (must be explicitly decided before any write-approval gate)

1. **System-wide single-candidate asymmetry.** Writing this row makes Shannon Martin the only candidate anywhere in CivicMarket with a non-locked match ring, while every other real candidate (the four City Council District 1 non-incumbents, and any others) remains fully locked per the already-adopted Gate I12–I18 policy. This is not a bug — it's the correct, honest consequence of Shannon being the only candidate with any verified, human-reviewed campaign evidence so far — but it is a **product/communication decision**, not a technical one, and should be made explicitly (e.g., via updated Data Sources copy explaining why exactly one candidate has a partial score) before writing, not discovered after the fact.
2. **`data_completeness` / legacy-column semantics mismatch**, described in Part 7 — low functional risk (nothing reads it) but worth an explicit decision.
3. **Opposite-sign aggregation rule is designed but untested** against any real conflicting-evidence case (none exists yet in the live data).

None of these are code defects and none block the *design* documented here — they block moving directly to an executable write-approval package without an explicit human decision on item 1 in particular.

---

## Status: READY FOR CANDIDATE_POSITIONS WRITE-DESIGN, WITH ONE OPEN PRODUCT DECISION

The aggregation algorithm itself is fully designed, deterministic, auditable, and confirmed safe against the actual `compute-match-scores` code (no code change required). Shannon Martin's derived result is fully computed and matches expectations. **The only thing separating this from a Gate I46 write-approval package is an explicit decision on the single-candidate-asymmetry question in "Unresolved risks" item 1** — a product call for the user to make, not a technical blocker.

## No-change confirmation

Supabase writes = 0. `candidate_positions` changes = 0. `match_scores` changes = 0. Anthropic calls = 0. Gemini calls = 0. Deployment = none. Two temporary read-only diagnostic scripts (schema/data inspection) were created, inspected for zero mutation calls, run once each, and deleted immediately after use; `git status` confirmed neither remains in the working tree. No secrets printed.
