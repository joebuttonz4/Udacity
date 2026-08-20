# Shannon Martin Candidate-Evidence Pilot — Return Handoff

Date: 08-20-2026
Timestamp: 04:54 pm EST

## 1. Final status

**FIRST FULL CAMPAIGN-EVIDENCE PILOT END-TO-END RUN PASSED.**

The pilot has completed its entire intended path for one candidate and one test user: campaign source verification → extraction → parser/thinking/token hardening → human review → deterministic validation → final `candidate_position_evidence` rows → deterministic aggregation → `candidate_positions` → `compute-match-scores` → verified test-user match score. Every step is documented and auditable; nothing was left partially done.

## 2. Final commits

| Commit | Description |
|---|---|
| `21c09d7` | Shannon Martin evidence write execution (5 `candidate_position_evidence` rows) |
| `56067f1` | `candidate_positions` aggregation design |
| `4ac78be` | `candidate_positions` write approval package |
| `847ee5a` | `candidate_positions` write execution |
| `754a7ed` | Match-score test approval package |
| `d6cc50e` | Match-score execution result (latest pilot commit) |

## 3. Database state

- Shannon Martin (`candidate_id d44ff05a-14af-45c2-9f2f-6d530a8a051e`) has **5** `human_reviewed` `candidate_position_evidence` rows.
- Shannon has **1** `candidate_positions` row: `growth_development=1, taxation_spending=2, education=NULL, environment=2, public_safety=2, housing=NULL, transparency=NULL`.
- Test user `civicmarket.test.01@example.com` (`ec59ea92-470f-447f-8873-ab2dbde52aca`) has **1** `match_scores` row for Shannon: **score = 66**.
- **No other candidate currently has a `candidate_positions` row** — Shannon remains the only candidate system-wide with one, per the explicitly approved pilot-scope decision.
- **No other user's `match_scores` changed** during Gate I47 — confirmed via post-write verification.

## 4. Candidate-position aggregation rule (summary)

Full design: `docs/internal_beta_gate_i45_candidate_position_aggregation_design.md`. In brief: only `human_reviewed` evidence is eligible; same-sign rows aggregate to the strongest (highest-magnitude) score present, never summed; opposite-sign rows block automatic aggregation entirely (requires human adjudication, never averaged); missing-evidence dimensions stay `NULL`, never defaulted to 0; confidence never alters the numeric score; corroborating duplicates never inflate the score; different `methodology_version` values never auto-mix. This rule is what produced Shannon's 4 populated / 3 null dimensions from her 5 evidence rows.

## 5. Match-score verification

- `compute-match-scores` result: `{ inserted: 1, skipped: 11, total_candidates: 12 }`
- Expected score (hand-calculated from live data before execution): **66**
- Actual score (from the executed route): **66**
- **Verification: PASS** — exact match, plus `candidate_positions`, `candidate_position_evidence`, and the test user's `civic_dna` all confirmed unchanged post-execution.

## 6. Safety state

- No rollback was required at any step.
- No schema changes.
- No RLS changes.
- No function changes.
- No deployment.
- The extraction write guard (`ENABLE_CAMPAIGN_EVIDENCE_EXTRACTION`) remains **disabled** (`false`).
- **No further Supabase write is authorized merely by the existence of this handoff document.** Every prior write in this pilot required its own separate, explicit, verbatim user approval statement — that pattern continues for any future write.

## 7. Remaining beta work (not resolved by this pilot)

- The **Gemini migration remains REQUIRED before beta launch** — untouched by this pilot, still outstanding.
- The Shannon-only `candidate_positions`/match-score unlock is a **controlled pilot asymmetry**, explicitly accepted for this pilot only — not a general policy.
- **Every other candidate remains locked** until their own evidence and `candidate_positions` rows are created through this same gated process.
- Broader candidate-evidence automation or scaling to more candidates is **separate future work**, not started.

## 8. Next recommended action

Review the controlled beta launch plan/current beta blockers and decide whether to scale the candidate-evidence pipeline to the remaining beta candidates or address another higher-priority beta blocker first.

## 9. Fresh-session resume instruction

Read CLAUDE.md and docs/internal_beta_shannon_candidate_evidence_return_handoff.md. Continue from Next Action. Do not reconstruct prior conversation history.
