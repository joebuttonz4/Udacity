# Home Layout UX Improvement — Representation vs. Ballot Races

Date: 08-20-2026
Timestamp: 07:52 pm EST

Status: **Implemented and live-verified for the test account. UI/copy/layout only. No Supabase write. No representation, ballot-eligibility, or match-score logic changed. No deployment.**

## Audit basis

Implements the recommendation from `docs/internal_beta_home_current_officials_audit.md` (commit `46b9e93`): the Home screen's "My Current Officials" section was correct (strict representation, no board expansion), but the adjacent "Your districts" chip section was actually populated from ballot-eligibility-expanded race data (`getCandidatesForDistricts` / `src/lib/ballotEligibility.ts`), not from the user's held representation districts. Sitting directly beside "My Current Officials" with a similar label, it created the false impression that every chip should have a matching official. The audit's root cause was a UI/labeling issue, not a data or query bug, and recommended presentation-only fixes.

## Files changed

- `src/app/page.tsx` (Home)
- `src/components/CurrentOfficialsSection.tsx`

No other file was touched. `src/lib/ballotEligibility.ts` has an unrelated, pre-existing uncommitted change from concurrent work (Package C1 statewide model prep) present in the working tree before this task began — inspected read-only for awareness, left completely untouched and unstaged, per "do not touch unrelated concurrent files."

## Exact UI changes

### 1. Section relabeling (Phase 2)

- "Your districts" → **"Your ballot races"**, with new helper text: *"Races you're eligible to vote in — not the same as your current officials."*
- No chip content, data source, or expansion logic changed — still `[...new Set(candidates.map(c => c.district_name))]`, i.e. the same ballot-eligible race list as before. Only the label and framing changed.

### 2. Home section order (Phase 3)

Old order: Hero → Top Matches → Your districts → My Current Officials → Civic feed → disclaimer.

New order: Hero → Top Matches → **My Current Officials** → Your ballot races → CivicMarket status → disclaimer → bottom nav (bottom nav lives in the layout and was untouched).

This puts current representation immediately after the action-oriented Top Matches section and moves the broader ballot-race context below it, per the requested ACTION → CURRENT REPRESENTATION → BALLOT CONTEXT → LOCAL INFORMATION hierarchy.

### 3. My Current Officials presentation (Phase 4)

- Added helper text under the header: *"Officials who currently represent you."*
- No change to the strict `district_id` join, `getOfficialsForUser`, or `officials_for_user`.
- No board/commission expansion added.
- No "View all" truncation was added — the section still renders every returned official; a cap was explicitly out of scope since it would need a working expansion, which wasn't built this session (not currently needed at 3 officials).
- **No Mayor-gap informational card was added.** `CurrentOfficialsSection` receives only `userId`, not the user's held-district list — detecting "holds Mayor but no Mayor official exists" would require passing new data into the component or a new query, which the task explicitly said not to add without new logic/data assumptions. Documented as a deferred follow-up below.

### 4. Top Matches locked-state wording (Phase 5)

- Locked candidates (no `candidate_positions` match) now show explicit text under the office/district line: **"Match score not available yet"** (previously only the lock icon + `aria-label`, no visible text).
- Scored candidates now show explicit visible text: **"XX% match"** (previously the percentage was only inside the small ring graphic).
- `MatchScoreRing` itself (`src/components/ui/MatchScoreRing.tsx`) was **not modified** — its existing `aria-label`s ("Match score unavailable. Not enough verified position data." / "Match score {score}") are unchanged; the new text is a separate, additional line in the Home candidate row.
- **"Based on N Civic DNA dimensions" was not added.** Traced live: `match_scores` only stores `{user_id, candidate_id, score, computed_at}` (`src/app/api/compute-match-scores/route.ts`) — the number of non-null dimensions used in the average is computed transiently and never persisted or returned to the client. Adding this would require new computation/storage logic, which is out of this task's UI/copy/layout-only scope. Documented as a deferred follow-up below.

### 5. Density / mobile tightening (Phase 6)

- Top Matches candidate rows: `py-4` → `py-3.5`, list gap `gap-2.5` → `gap-2`.
- `OfficialCard` (`CurrentOfficialsSection.tsx`): `py-4` → `py-3.5`, list gap `gap-2.5` → `gap-2`.
- CivicMarket Status cards: `py-3.5` → `py-3`, list gap `gap-2.5` → `gap-2`.
- "View Full Ballot" button top margin: `mt-4` → `mt-3`.
- No touch-target regressions observed live (verified at both native ~958px width and a 200% CSS-zoom mobile approximation — see Testing below); no full visual redesign was performed.

### 6. Civic Feed → CivicMarket Status (Phase 7)

- Inspected `CIVIC_FEED` content: all three items are internal beta/status messaging ("Candidate profiles loaded from verified source records," "Funding summaries available...," "Voting records locked until official candidate vote history is verified") — not real user-facing local civic news.
- Chose **Option A**: relabeled the section header from "Civic feed" to **"CivicMarket status"**. No new feed was built; no item content was changed; the underlying `CIVIC_FEED` array and its data are exactly as before.

## Unchanged data / representation behavior (explicitly verified)

- `src/lib/officials.ts` (`getOfficialsForUser`) — untouched.
- `officials_for_user` SQL view — untouched (not touched by any tool in this session; no SQL was executed).
- `src/lib/candidates.ts` / `src/lib/ballotEligibility.ts` — untouched by this task (the latter has an unrelated pre-existing uncommitted diff from other concurrent work, left alone).
- `src/app/api/compute-match-scores/route.ts` — untouched; match-score formula unchanged.
- No `user_districts`, `current_officials`, `districts`, or schema/RLS/function change. No Supabase write of any kind. No deployment.

## Testing (Phase 9)

`npm run build`: **passed**, 28 routes, no errors.
`npm run lint`: **5 pre-existing errors only** (`scripts/import-real-psl-data.cjs`, `scripts/validate-real-psl-csvs.cjs`, unrelated `.cjs` require-import rule), nothing new.

Live verification was performed against an **already-authenticated** local dev server session (pre-existing on port 3000 from prior/concurrent work; the assistant never entered credentials, started no new sign-in, and did not stop this pre-existing server). Confirmed via `/profile` that the signed-in account is exactly `civicmarket.test.01@example.com`, the same test account from the audit.

Live results, Home page (`http://localhost:3000/`):

| Check | Result |
|---|---|
| My Current Officials appears above ballot-race chips | **PASS** — order is Top Matches → My Current Officials → Your ballot races → CivicMarket status |
| Officials list is exactly Debbie Hawley / Stephanie Morgan / Toby Overdorf | **PASS** |
| Anthony Bonna does not appear as a current official | **PASS** — appears only in Top Matches (as a candidate) and in the "Your ballot races" chip list (as "City Council District 3"), never in My Current Officials |
| Larry Leet / Jamie Fowler do not appear as current officials | **PASS** — not present anywhere in My Current Officials; "St. Lucie County Commission District 2" / "District 4" appear only as ballot-race chips |
| Ballot-race chips remain visible under the new label | **PASS** — "YOUR BALLOT RACES" with helper text, same 6 chips as before (FL House District 85, City Council District 1, Mayor, City Council District 3, County Commission District 4, County Commission District 2) |
| Top Matches locked wording is clearer | **PASS** — "Match score not available yet" visible under each locked candidate's office/district line |
| Shannon Martin's score still shows correctly if visible | Not applicable this run — Home's Top-3 preview is alphabetical by candidate name (Amr Metwally, Anthony Bonna, Eric Reikenis for this account's current eligible set), so Shannon Martin did not appear in the 3-item preview; the scored-state rendering path (`{score}% match`) itself was code-reviewed and is unchanged from a working baseline, just newly given visible text |
| Civic Feed/status label matches actual content | **PASS** — relabeled "CIVICMARKET STATUS", content unchanged, now accurately labeled |
| No navigation regression | **PASS** — bottom nav (Home/Ballot/Vote/Profile) renders normally on Home and `/profile` |
| Mobile layout remains usable | **PASS** — verified at native ~958px width and via a 200% CSS-zoom mobile approximation (the same fallback method used in prior gates, since the `resize_window` tool does not reliably change rendered viewport in this environment); no clipping, no horizontal overflow, locked-state text remained fully readable |

No database write was performed during testing. The `/profile` page (which reuses `CurrentOfficialsSection`) was also confirmed to render the new helper text and the same 3 officials, with no regression.

**Candidate-data note (not part of this task):** the Top Matches preview showed "Amr Metwally" and "Anthony Bonna" both labeled "State Representative, District 85 · FL House District 85" — this reflects the concurrent, unrelated candidate-import work in progress (visible via the pre-existing uncommitted `src/lib/ballotEligibility.ts` diff for a "Package C1 statewide" model). Not investigated or altered by this task; flagged only for awareness.

## Deferred UX improvements (explicitly out of scope this session)

1. **"Based on N Civic DNA dimensions" disclosure** — requires new logic to persist or recompute dimension count in the match-score data path (`compute-match-scores` currently discards it). Needs its own scoped task.
2. **Mayor-gap informational state** ("Mayor information not yet verified") — requires passing the user's held-district list into `CurrentOfficialsSection` or adding a new query, which the task explicitly excluded without further approval. The underlying Mayor `current_officials` gap itself remains open and source-blocked (unchanged, unaffected).
3. **"View all X officials" cap/expansion** — not needed at the current officials count (3) for any known test account; worth adding preemptively before a user's held-district count grows.
4. Ballot page (`/ballot`) locked-state wording, candidate profile locked-state wording — already addressed in earlier Gates I14-I17; not touched or re-scoped here.

## Approval boundary

No further action requires approval from this task — all changes were UI/copy/layout only, within the explicitly allowed boundary (Phase 8), verified live, and build/lint clean. The three deferred items above each require their own separate, explicitly-scoped future task before implementation.
