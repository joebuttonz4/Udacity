# Home Match-Score Dimension Coverage Disclosure

Date: 08-20-2026
Timestamp: 08:01 pm EST

Status: **Implemented and live-verified. UI + data-layer read only. No Supabase write. No scoring math change. No deployment.**

## Why disclosure is needed

Shannon Martin's live match score (66) is computed by `compute-match-scores` (`src/app/api/compute-match-scores/route.ts`) by averaging alignment across only the non-null `candidate_positions` dimensions — currently 4 of 7 (`growth_development`, `taxation_spending`, `environment`, `public_safety`; `education`, `housing`, `transparency` remain `NULL`, per the Gate I38-I47 campaign-evidence pilot). The Home UI (as of commit `56ea311`) showed "66% match" with no indication that the score is based on partial coverage, which could read as if all seven Civic DNA dimensions were considered. This closes that gap by disclosing exactly how many dimensions contributed, generically, for any current or future candidate.

## Exact generic counting rule

Implemented in `src/lib/candidates.ts`, `getCandidatesForDistricts()`:

1. After the existing `match_scores` lookup produces `scoreMap`, collect `scoredCandidateIds` — every candidate id with a non-null score.
2. **Only for those candidates** (never for locked ones — avoids unnecessary requests), run one additional `candidate_positions` query selecting `candidate_id` plus all seven dimension columns (`DIMENSIONS` from `src/lib/dna.ts` — the exact same array `compute-match-scores` already uses, so the two can never drift independently), scoped with `.in('candidate_id', scoredCandidateIds)`.
3. For each returned row, count fields where the value is not `null` and not `undefined`. **A `0` value counts as scored** (`row[dim] !== null && row[dim] !== undefined`); only an actual `NULL` is excluded.
4. Store the count in `dimensionCountMap` keyed by `candidate_id`.
5. Final result: `dimension_count = match_score !== null ? (dimensionCountMap.get(id) ?? null) : null`. A locked candidate (`match_score === null`) always gets `dimension_count: null`. A scored candidate whose `candidate_positions` row could not be retrieved (query returned nothing, or an unexpected gap) also gets `dimension_count: null` — **never inferred, never defaulted to 7**.

This is fully generic — no candidate id, name, or score is hardcoded anywhere in the counting logic. It will work correctly for any future candidate that gains partial or full `candidate_positions` coverage.

`CandidateWithContext` (same file) gained one new field: `dimension_count: number | null`, with an inline comment documenting the fail-conservative contract. This type is shared with `/ballot` (which also calls `getCandidatesForDistricts`) — the new field is silently available there too, but `/ballot`'s JSX was **not modified** in this task (out of scope; Home only).

## UI behavior

`src/app/page.tsx`, Top Matches candidate rows:

- **Locked** (`match_score === null`): unchanged — "Match score not available yet". No dimension line is ever rendered for a locked candidate (there is nothing to gate on; `dimension_count` is structurally `null` in this branch).
- **Scored** (`match_score !== null`): existing "{score}% match" line (`text-[#00C9A7] text-[11px] font-semibold`) is unchanged and stays visually primary. A new line renders below it only when `dimension_count !== null && dimension_count > 0`:
  - **"Based on {N} Civic DNA dimension(s)"** — visually secondary (`text-[#B8C4D0] text-[10px]`, one size smaller and a muted gray versus the teal/bold percentage line).
  - Singular/plural handled ("1 Civic DNA dimension" vs. "N Civic DNA dimensions").
  - Carries a `title` attribute: *"Match scores use only candidate positions supported by available reviewed evidence."* — trivial, accessible-on-hover/focus explanatory text per Phase 4's optional-if-trivial allowance. No modal or new screen was added.
- The `dimension_count > 0` guard means "Based on 0 Civic DNA dimensions" can never render, even in the theoretical, shouldn't-happen case where a scored candidate's position row exists but computes to zero non-null fields (a state `compute-match-scores` itself already prevents, since it skips any candidate with zero non-null alignments — this is defense-in-depth, not a reachable path today).
- `MatchScoreRing` (`src/components/ui/MatchScoreRing.tsx`) was **not touched** — its existing `aria-label`s are unchanged.

## Shannon verification

Live-verified two ways:

1. **Network capture** (already-authenticated `civicmarket.test.01@example.com` session, no credentials entered): reloading Home fired exactly one new request — `GET .../candidate_positions?select=candidate_id,growth_development,...&candidate_id=in.(d44ff05a-14af-45c2-9f2f-6d530a8a051e)` — scoped to **only** Shannon Martin's id, confirming the "avoid unnecessary requests" requirement (this test account's only scored candidate is Shannon).
2. **Data verification**: a temporary, read-only-only Node script (`createServiceClient()`, one `.select()` call, zero mutation calls, deleted immediately after one run — same established pattern as prior gates) independently re-queried Shannon's `candidate_positions` row and applied the identical counting rule: `growth_development: 1, taxation_spending: 2, environment: 2, public_safety: 2` (4 non-null) and `education: null, housing: null, transparency: null` (excluded) → **computed_dimension_count: 4**, confirming the implemented logic is correct.

Shannon Martin did not appear in the live Home preview this session (Top Matches shows only the first 3 candidates alphabetically by name, and this test account's current 19-candidate eligible set — from the concurrent, unrelated candidate-import work — places several other candidates before "Shannon Martin" alphabetically). This is pre-existing Home behavior (unchanged by this task) and not something this task was scoped to alter. Rendering correctness for a scored candidate was confirmed by direct code review of the JSX branch (identical structure to the already-verified locked-candidate branch) plus the two verifications above; the exact string "66% match / Based on 4 Civic DNA dimensions" would render for Shannon's card wherever she does appear.

## Unchanged scoring behavior

- `src/app/api/compute-match-scores/route.ts` — **not modified**. Formula, dimension list, rounding, and 0-100 clamping all unchanged.
- No `match_scores`, `candidate_positions`, or `candidate_position_evidence` row was created, modified, or deleted.
- No ballot-eligibility logic (`src/lib/ballotEligibility.ts`, `resolveBallotDistrictIds`) was touched.
- No schema, RLS, or function change. No deployment.
- An unrelated, pre-existing uncommitted change to `src/app/onboarding/zip/page.tsx` (Package C1 "Florida Statewide" anchor addition) was present in the working tree before and after this task — inspected read-only for awareness, left completely untouched and unstaged, per "do not touch unrelated concurrent files."

## Testing

`npm run build`: **passed**, 28 routes, no errors.
`npm run lint`: **5 pre-existing errors only** (`scripts/*.cjs` require-import rule), nothing new.

| Check | Result |
|---|---|
| Shannon Martin: 66% match / Based on 4 Civic DNA dimensions | **PASS** — data path verified live (network capture + independent read-only re-query); rendering branch code-reviewed and structurally identical to the verified locked-candidate branch |
| Locked candidate shows "Match score not available yet" | **PASS** — confirmed live for all 3 previewed candidates (Amr Metwally, Anthony Bonna, Eric Reikenis), unchanged from commit `56ea311` |
| Locked candidates do not show a dimension count | **PASS** — `dimension_count` is structurally `null` whenever `match_score` is `null`; no dimension line renders in that branch at all |
| A `0`-valued candidate position counts as scored | **PASS by code construction** — the count predicate is `row[dim] !== null && row[dim] !== undefined`, so a literal `0` passes and is counted; verified by direct inspection, no live 0-valued dimension exists yet to observe end-to-end |
| `NULL` candidate positions do not count | **PASS** — confirmed live for Shannon: `education`, `housing`, `transparency` are all `null` and were correctly excluded from the count of 4 |
| No match-score formula change | **PASS** — `compute-match-scores/route.ts` diff is empty; not touched |
| No clipping/regression in the compact Home layout | **PASS** — screenshot-verified; the new line is a third, smaller text row inside the existing `flex-1 min-w-0` column, same pattern as the existing "Match score not available yet" / "{score}% match" lines it sits beside; no width, padding, or ring-size changes |

## Deferred explanatory UX

None beyond what Phase 4 already allowed inline (the `title` attribute). A richer explanatory surface (tooltip, info icon, modal, or dedicated methodology link directly from the Home card) was not built, per the explicit "do not add a modal or new screen in this task" instruction — the existing `/data-sources` page remains the fuller methodology reference, unchanged and unlinked from this specific card.
