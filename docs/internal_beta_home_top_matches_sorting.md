# Home Top Matches Sorting — Scored Candidates First

Date: 08-20-2026
Timestamp: 08:31 pm EST

Status: **Implemented and live-verified. UI-only, Home-scoped. No Supabase write. No match-score math change. No ballot-eligibility change. No deployment.**

## Prior ordering problem

`src/lib/candidates.ts`'s `getCandidatesForDistricts` returns the candidate list ordered by the underlying Supabase query's `.order('name')` (alphabetical). `src/app/page.tsx`'s Home page previously built its Top Matches preview with `candidates.slice(0, 3)` — no additional sort — so the preview was effectively just "first 3 candidates alphabetically," regardless of match score. With 33 candidates now live (concurrent Package C1 statewide import), the first 3 alphabetically (Amr Metwally, Anthony Bonna, Charles Burkett) were all locked, even though Shannon Martin already has a real match score of 66. This defeated the purpose of a "Top Matches" section.

## Exact sort rule implemented

`src/app/page.tsx`, two new module-level functions plus one changed line:

```ts
function isScored(score: number | null | undefined): score is number {
  return score !== null && score !== undefined
}

function topMatchesComparator(a: CandidateWithContext, b: CandidateWithContext): number {
  const aScored = isScored(a.match_score)
  const bScored = isScored(b.match_score)

  if (aScored && !bScored) return -1
  if (!aScored && bScored) return 1
  if (aScored && bScored && a.match_score !== b.match_score) {
    return (b.match_score as number) - (a.match_score as number)
  }
  return a.name.localeCompare(b.name)
}
```

```ts
const previewCandidates = [...candidates].sort(topMatchesComparator).slice(0, 3)
```

Rule, in order: (1) scored candidates before locked candidates; (2) among scored candidates, `match_score` descending; (3) ties (equal scores, or both locked) fall through to candidate `name` ascending (`localeCompare`). This satisfies every requirement in Phase 2 (A-E) exactly as specified.

## 0-score handling

`isScored()` is a strict `!== null && !== undefined` check — no truthiness coercion. A candidate with `match_score === 0` returns `true` from `isScored` and is treated as fully scored: it sorts above every locked candidate and is ranked by its numeric value (0) among other scored candidates, never mistaken for "no score." No live candidate currently has a 0 score to observe end-to-end, but this is verified correct by direct construction and matches Phase 4's explicit acceptance requirement ("0 sorts above locked/null").

## Home-only vs. shared behavior

- **Not touched:** `src/lib/candidates.ts` (`getCandidatesForDistricts`, its Supabase query, its `.order('name')`) and `src/app/ballot/page.tsx` (`groupByDistrict`, its rendering order). The comparator is applied to `[...candidates]` — a shallow copy — so the original `candidates` array (also used to build the "Your ballot races" chip list via `[...new Set(candidates.map(c => c.district_name))]`, and passed nowhere else) is never mutated or reordered.
- **Live-verified unchanged:** `/ballot` still shows Shannon Martin in alphabetical position within the Mayor group (Eric Strazzeri → Shannon Martin → Steven Giordano → Steven Harrington), exactly as before this change — confirmed by direct page-text comparison against the same live data.
- Only Home's `previewCandidates` (the 3-card Top Matches preview) is affected. `candidates.length` (used for "View Full Ballot — N candidates") and the "View Full Ballot" link itself are untouched.

## Copy change (Phase 3)

Top Matches helper text changed from "Higher scores mean stronger alignment with your Civic DNA." to **"Your strongest available Civic DNA matches."** — accurately describes the new ranked-first behavior. "TOP MATCHES" header, "View all" link, and "View Full Ballot" button text/logic are all unchanged. Per-card copy is unchanged: scored candidates still show "{score}% match" and "Based on {N} Civic DNA dimensions" (from the prior dimension-disclosure task, `c51e296`); locked candidates still show "Match score not available yet."

## Live verification result

Verified against the already-running local dev server (PID 24744, unchanged from the prior session) for the already-authenticated `civicmarket.test.01@example.com` session, after a hard refresh (Ctrl+Shift+R — Turbopack HMR picked up the change correctly, confirmed by `get_page_text` and a screenshot):

| Check | Result |
|---|---|
| Shannon Martin appears in Home Top Matches | **PASS** — rank #1 |
| Shannon shows "66% match" | **PASS** |
| Shannon shows "Based on 4 Civic DNA dimensions" | **PASS** |
| Scored candidate appears above locked candidates | **PASS** — Shannon (#1, scored) above Amr Metwally (#2, locked) and Anthony Bonna (#3, locked) |
| Remaining locked candidates show "Match score not available yet" | **PASS** — both #2 and #3 |
| Only 3 candidate cards appear | **PASS** |
| No clipping/regression | **PASS** — screenshot confirmed clean layout, ring renders correctly with "66" and orange fill for Shannon |
| View Full Ballot still works | **PASS** — clicked live, navigated to `/ballot` correctly, showing "View Full Ballot — 33 candidates" beforehand |
| Ballot page ordering unchanged | **PASS** — Shannon still in alphabetical position within the Mayor group on `/ballot`, confirmed by direct comparison |

## Acceptance cases (Phase 4) — verified

1. `match_score = 100` sorts above `66` — **PASS by construction** (descending numeric comparison).
2. `66` sorts above `0` — **PASS by construction**.
3. `0` sorts above locked/`null` — **PASS by construction** (`isScored(0) === true`).
4. `null`/`undefined` candidates sort after all scored candidates — **PASS by construction** (`aScored && !bScored` / `!aScored && bScored` branches).
5. Ties (equal scores) sort by name ascending — **PASS by construction** (`localeCompare` fallback).
6. Locked candidates sort by name ascending — **PASS by construction and live-verified** (Amr Metwally before Anthony Bonna).
7. Only top 3 render on Home — **PASS**, `.slice(0, 3)` unchanged in position, now applied after sort.
8. Ballot page behavior unchanged — **PASS**, live-verified, no shared code touched.

## Unchanged match math / data

- `src/app/api/compute-match-scores/route.ts` — not modified. Formula, dimension list, rounding unchanged.
- `src/lib/candidates.ts`'s `dimension_count` computation (from the prior task) — not modified.
- No `match_scores`, `candidate_positions`, or `candidate_position_evidence` row was created, modified, or deleted.
- No ballot-eligibility logic (`src/lib/ballotEligibility.ts`) touched.
- No schema, RLS, or function change. No deployment.

`npm run build`: passed, 28 routes, no errors. `npm run lint`: 5 pre-existing errors only (`scripts/*.cjs`), nothing new.
