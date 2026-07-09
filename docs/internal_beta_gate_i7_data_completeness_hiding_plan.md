# Internal Beta — Gate I7: Data-Completeness Hiding Plan

## 1. Date and timestamp

Date: 07-09-2026
Timestamp: 03:18 pm EDT

This document is planning only. It does not change app behavior, run Supabase writes, deploy anything, or touch the County Commission write guard.

## 2. Current repo baseline

- Branch: `master`, working tree clean, up to date with `origin/master`.
- Latest pushed commit: `a0b4dd8` ("Polish internal beta UI").
- `npm run build` passed with 25 routes at that baseline.
- Civic DNA, match scores, candidate reviews, and measure reviews are all implemented. Corrections, Terms, Privacy, Data Sources, and Report pages all exist. Candidate and measure Report Inaccuracy links exist.
- `ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE = false`, County Commission District 1-5 remains dry-run only — unchanged, not touched by this document.

## 3. Gate purpose

Define, in enough detail to implement later without further design decisions, exactly what "complete" means for a candidate, a measure, and a ballot race, so a future gate can add an application-layer filter that hides incomplete records from real users — without touching schema, without adding an `is_published` column, and without implementing anything yet. This continues directly from `docs/internal_beta_gate_i2_reviews_ui_polish_plan.md` Section 13, which first flagged this as needed and recommended the application-layer approach this document now specifies in full.

## 4. Why data-completeness hiding matters for beta

Per the user's decision recorded in `docs/beta_launch_readiness_plan.md` Section 5: "incomplete candidate/race data must be hidden until complete — no partial or broken-looking races shown to real users." Today, `getCandidatesForDistricts`, `getCandidateProfile`, `getMeasuresForDistricts`, and `getMeasureProfile` (all in `src/lib/candidates.ts` and `src/lib/measures.ts`) filter only on `archived_at IS NULL` and the relevant district/id match — there is no check for whether a row actually has enough real content to be shown to a real PSL user. A candidate row with just a name and no office, bio, or election tie could render as a broken-looking card today. This is acceptable for Internal Beta (trusted testers understand the app is in progress) but not for Controlled PSL Beta, where every visible record must look complete and trustworthy to a real resident.

## 5. Candidate completeness rules

A candidate is **complete** — eligible to appear on Controlled PSL Beta surfaces — only if all of the following hold, based on the fields already returned by `getCandidateProfile`/`getCandidatesForDistricts` (`src/lib/candidates.ts`):

- `name` is a non-empty string.
- `office` is a non-empty string.
- `district_id` resolves to a real district (already guaranteed today by the existing inner join to `districts`, which returns `null` district fields if the join fails — a candidate with a `null` `district_name` should be treated as incomplete).
- The candidate is tied to a real election shown to the user — `election_name` and `election_date` are both non-empty (already sourced from the `elections` join; a candidate with no election tie should not appear on a ballot the user is told reflects "your races").

Additional, more granular rules layered on top of the four required fields above, since not every optional field needs to be present for a candidate to be shown, but each affects *what* is shown:

- **Source-backed profile data** (`bio`, `photo_url`, `website`) is optional — a candidate may still be shown with these fields `null`, exactly as the existing UI already handles it (`{candidate.bio && (...)}` conditional rendering in `src/app/candidates/[id]/page.tsx`). Missing profile polish is not a completeness failure by itself, since `CLAUDE.md`'s data-availability-limit precedent already treats missing voting records as expected, not broken.
- **Voting record or `candidate_positions` data**, if present, is what enables match scoring for that candidate (per the existing `compute-match-scores` route). A candidate with zero `candidate_positions` rows is not "incomplete" in the sense of being hidden — this is the documented, intentional "locked match ring" state already covered by `CLAUDE.md`'s "Data availability limits" section and the existing `MatchScoreRing` locked state. **Do not hide a candidate solely for having no match-score data** — that would contradict the already-established, correct behavior of showing a locked ring instead.
- **Funding data** (`candidate_funding` row) must only be displayed when `source_url` is present and safe (`isSafeUrl`) — this is already enforced today (`{isSafeUrl(funding.source_url) && (...)}` in the candidate page) and requires no new completeness logic, only confirmation that this existing behavior is preserved by any future filter.

**Summary rule:** a candidate is hidden from Controlled PSL Beta surfaces if it fails any of the four required checks (name, office, valid district, valid election tie). A candidate that passes those four checks but lacks optional data (bio, photo, positions, funding) is shown, with the existing conditional-rendering and locked-ring behavior handling the gaps — exactly as today, unchanged.

## 6. Measure/legislation completeness rules

A measure is **complete** — eligible to appear on Controlled PSL Beta surfaces — only if all of the following hold, based on fields returned by `getMeasureProfile`/`getMeasuresForDistricts` (`src/lib/measures.ts`):

- `title` is a non-empty string.
- `plain_english_summary` is a non-empty string. Unlike a candidate's optional `bio`, a measure with no plain-English summary is not meaningfully usable by a resident deciding how to vote — `CLAUDE.md`'s "No real PSL ballot measures are currently confirmed in the database" note already implies measures are held to a higher completeness bar than candidates before going live.
- The measure is tied to a real election shown to the user — `election_name` and `election_date` are both non-empty, same reasoning as candidates (Section 5).
- **Source** — `full_text_url` is present and passes the existing `isSafeUrl` check. Per `CLAUDE.md`'s locked rule ("source_url is required for every voting record") and the general project posture that every factual claim needs an official source, a measure without a verifiable full-text source should not be shown as a real ballot item.

Additional, more granular rule:

- **Measure dimensions/score inputs** (`measure_dimensions` row, read via `getMeasureDimensions`) are optional for completeness — a measure may still be shown with `dimensions === null`, exactly as the existing UI already handles it ("No scoring data yet." in `src/app/measures/[id]/page.tsx`). This mirrors the candidate rule: missing scoring data is a documented, expected data-availability limit, not a reason to hide the measure entirely.

**Summary rule:** a measure is hidden from Controlled PSL Beta surfaces if it fails any of the four required checks (title, summary, valid election tie, sourced full-text link). A measure that passes those checks but lacks dimension scoring is shown with the existing "No scoring data yet." fallback, unchanged.

## 7. Ballot/race completeness rules

Beyond individual candidate/measure completeness, the ballot's *grouping and rendering* (`src/app/ballot/page.tsx`'s `groupByDistrict`) needs its own rules so filtering individual records never produces a broken-looking page:

- **Do not show a race with only one visible candidate unless that reflects the real ballot and is source-backed.** If completeness filtering removes some candidates from a multi-candidate race, leaving exactly one, that one-candidate race must only render if it is confirmed to be the actual, real composition of that race (e.g., an uncontested race is a normal, real outcome) — not an artifact of hiding incomplete data. This requires the completeness check to be applied *before* grouping, and requires whoever implements this to distinguish "genuinely uncontested" from "we hid the other candidates" at implementation time — this document flags the distinction as required but does not resolve it, since resolving it needs either a data convention (e.g., a way to mark a race as confirmed-uncontested) or a conservative default (hide the whole race group if any candidate in it was filtered for incompleteness, rather than show a misleadingly sparse one-candidate race). **Recommended default, pending implementation-time confirmation:** if completeness filtering would reduce a race's candidate count, hide the entire race group for Controlled PSL Beta rather than show a partial race, since showing a race with a suspiciously small candidate count is arguably worse than not showing it yet.
- **Avoid showing empty race sections.** After filtering, `groupByDistrict` must never produce a district group with zero candidates — such a group must be dropped entirely from `sortedGroups`/`filteredGroups`, not rendered as an empty section header with no cards beneath it.
- **Avoid breaking navigation if filtering removes all items.** If completeness filtering removes every candidate and every measure for a user's districts, the ballot page must not silently render a blank content area — it must fall through to the existing "No candidates found" empty state (`src/app/ballot/page.tsx`'s existing `candidates.length === 0` branch), reworded if necessary to reflect that data is still being verified rather than implying the user has no districts at all.
- **Show friendly empty states instead of blank pages.** This is already the established pattern on every page audited across Gates I1-I6 (loading skeleton → error state → content, with an explicit empty-state message when content is legitimately empty) — a future implementation of completeness filtering must preserve this pattern, not introduce a new blank-page risk. This is the same "avoid any blank white states" goal already enforced in Gate I6's UI polish pass.

## 8. Civic DNA/match score handling when data is incomplete

No change to Civic DNA or match-score computation logic is implied by this plan. Specifically:

- A candidate passing the Section 5 completeness bar but lacking `candidate_positions` data continues to show a **locked** match ring (`MatchScoreRing` with `score === null`), exactly as today — this is not a completeness failure, it is the existing, correct, documented "data availability limit" behavior.
- Civic DNA itself (`src/lib/dna.ts`) is entirely user-specific (the user's own quiz answers) and has no dependency on candidate/measure completeness — nothing about this plan touches Civic DNA computation.
- If a future implementation of this plan hides a candidate entirely (Section 5's required-field failures), any `match_scores` row for that candidate becomes orphaned from the user's visible ballot — this is acceptable and requires no cleanup, since `match_scores` rows are not deleted by this plan and the existing `compute-match-scores` route already scopes its own recomputation to currently-visible candidates only.

## 9. County Commission District 1-5 handling

This plan does not change, and is not blocked by, the County Commission District 1-5 gate sequence:

- `ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE` remains `false` and is not touched by this document.
- If and when a future, separately approved gate enables County Commission District 1-5 assignment and a user is assigned a district, any County Commission candidates surfaced for that user would be subject to the exact same Section 5 completeness rules as any other candidate — no special-case completeness logic is needed for County Commission candidates specifically.
- This plan does not create, modify, or read `user_districts` rows, and does not require the County Commission write path to be enabled to be written or later implemented.

## 10. Pages affected

A future implementation of this plan would touch, at minimum:

- `src/lib/candidates.ts` — `getCandidatesForDistricts` and `getCandidateProfile` would need an additional completeness filter/check applied to their query results (application-layer, not a new query condition against a non-existent column).
- `src/lib/measures.ts` — `getMeasuresForDistricts` and `getMeasureProfile` would need the equivalent measure-completeness filter/check.
- `src/app/ballot/page.tsx` — `groupByDistrict` and the surrounding empty-state logic would need to apply the Section 7 race-level rules after individual-record filtering.
- `src/app/page.tsx` (Home) — the "Top matches" preview list (`previewCandidates`) reads from the same `getCandidatesForDistricts` call, so it inherits the filter automatically once that function is updated; no separate Home-specific logic is anticipated, but this should be re-confirmed at implementation time.
- `src/app/candidates/[id]/page.tsx` and `src/app/measures/[id]/page.tsx` — direct navigation to an individual candidate/measure profile (e.g., via a bookmarked link) should also respect completeness rules once implemented, so an incomplete record isn't reachable by direct URL even if it's hidden from list views. This requires `getCandidateProfile`/`getMeasureProfile` themselves to apply the same check, not just the list-returning functions.

No other file is expected to need a change for this feature, based on the current codebase inspected across Gates I1-I6.

## 11. Suggested implementation order

1. Add the Section 5 candidate-completeness check as a pure function (e.g., `isCandidateComplete(candidate)`) alongside the existing types in `src/lib/candidates.ts`, and apply it inside `getCandidatesForDistricts` and `getCandidateProfile`.
2. Add the equivalent Section 6 measure-completeness function in `src/lib/measures.ts`, applied inside `getMeasuresForDistricts` and `getMeasureProfile`.
3. Update `src/app/ballot/page.tsx`'s grouping/filtering to apply the Section 7 race-level rules on top of the now-filtered candidate list, including the "hide the whole race if filtering reduced its candidate count" default from Section 7, and confirm the existing empty-state branches still trigger correctly when filtering removes everything.
4. Manually verify `src/app/page.tsx`'s "Top matches" preview inherits the filter correctly with no additional code change, per Section 10.
5. Manually verify direct navigation to a deliberately incomplete test candidate/measure now correctly shows the existing "not found"-style error state (`getCandidateProfile`/`getMeasureProfile` already return `null` for a missing row today — an incomplete row should be treated the same way once filtered) rather than a partially-broken profile page.
6. This is a **beta-scale, environment-agnostic** filter — the same code runs in Internal Beta and Controlled PSL Beta. Since real PSL data imported so far (the 4 District 1 candidates, per `CIVICMARKET_CURRENT_STATE.md`) already has names, offices, districts, and elections, this filter is not expected to hide any of today's real candidates — it is a safety net for future data entry, not a fix for a currently-broken record.

Each numbered step above is independent enough to be reviewed and approved on its own if the user prefers to split implementation into smaller gates, consistent with `CLAUDE.md`'s "one route, one feature, one fix per session" preference.

## 12. No-write/no-deploy boundaries

The following apply to this document and were not violated in producing it, and apply to any future implementation gate until separately approved:

- This is a plan only. No filtering was implemented.
- No `is_published` column, or any other schema change, is proposed — Section 5/6's rules are computed entirely from existing fields at read time.
- No Supabase writes were performed.
- No deployment occurred.
- `ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE` was not changed — confirmed still `false`.
- `user_districts` was not modified.
- No schema, seed, migration, `districts`, `officials_for_user`, `src/lib/officials.ts`, `CurrentOfficialsSection`, or At-Large row change was made.

## 13. Testing plan

For the future implementation gate this plan leads to (not performed now):

- **Candidate completeness unit tests:** a candidate missing `name`, `office`, a valid district join, or a valid election join is correctly excluded; a candidate with all four required fields but missing `bio`/`photo_url`/`website`/positions/funding is correctly included.
- **Measure completeness unit tests:** a measure missing `title`, `plain_english_summary`, a valid election join, or a sourced `full_text_url` is correctly excluded; a measure with all four but missing dimension scores is correctly included.
- **Ballot grouping test:** a district group that loses candidates to filtering either disappears entirely (if the "hide whole race" default from Section 7 is implemented) or is confirmed intentionally uncontested — whichever behavior is actually implemented must have an explicit test proving it, not just spot-checked manually.
- **Empty-state test:** a user whose entire district's candidates/measures are filtered out sees the existing "No candidates found" message, not a blank page.
- **Direct-navigation test:** navigating directly to a filtered-out candidate/measure `id` shows the existing not-found error state, not a partially rendered profile.
- **Non-regression test:** the 4 real PSL District 1 candidates (and their current funding/voting-record state) continue to display exactly as they do today after the filter is added — this filter should not visibly change anything for currently-real data.
- **Match-score non-interference test:** a complete candidate with no `candidate_positions` still shows a locked ring, not a hidden card — confirming Section 8's "no change to match-score handling" holds in practice.

## 14. Fast smoke test checklist

Short, launch-critical-only, to run once a future implementation lands and before any beta invite goes out — extends the checklist already established in `docs/beta_launch_readiness_plan.md` Section 17 and `docs/internal_beta_gate_i2_reviews_ui_polish_plan.md` Section 17:

- [ ] `npm run build` passes.
- [ ] `/ballot` still shows the 4 real PSL District 1 candidates exactly as before.
- [ ] A deliberately incomplete test candidate (missing office) does not appear on `/ballot` or on Home's "Top matches."
- [ ] Direct navigation to that incomplete test candidate's `/candidates/[id]` URL shows a not-found-style state, not a broken profile.
- [ ] A district with zero complete candidates does not render an empty section header on `/ballot`.
- [ ] A user whose districts have zero complete candidates/measures sees the existing "No candidates found" empty state, not a blank page.
- [ ] No console errors on any of the above.

## 15. Risks and mitigations

- **Risk: the "hide whole race if any candidate is filtered" default (Section 7) could hide a legitimately uncontested race that simply looks the same as a filtered one.** Mitigation: this is explicitly flagged in Section 7 as a default *pending implementation-time confirmation*, not a final decision — the implementer should re-examine real PSL data at that time and decide whether a data-level signal (e.g., checking the total candidate count for that race directly from `candidates`, ignoring completeness, versus the filtered count) is needed to distinguish the two cases before shipping.
- **Risk: over-aggressive filtering could hide real candidates due to a data-entry gap (e.g., a missing election tie) rather than genuine incompleteness.** Mitigation: the non-regression test in Section 13 explicitly checks that today's 4 real candidates are unaffected before this ships; if any real candidate would be hidden by these rules, that is a signal to fix the underlying data via the admin entry flow, not to loosen the completeness rules.
- **Risk: applying the filter only to list views (`getCandidatesForDistricts`) but not profile views (`getCandidateProfile`) would leave incomplete records reachable by direct URL.** Mitigation: Section 10 explicitly calls out both functions per entity type as in-scope, and Section 13's direct-navigation test exists specifically to catch this gap.
- **Risk: scope creep into building an `is_published` admin toggle instead of a computed filter, contradicting this gate's explicit boundary.** Mitigation: Section 12 restates the "no schema change" boundary explicitly; if computed filtering later proves insufficient at larger data volume, that is its own future, separately approved gate (as already noted as a possible future direction in `docs/internal_beta_gate_i2_reviews_ui_polish_plan.md` Section 13).

## 16. Recommended next gate

If this plan is accepted, the recommended next gate is a focused implementation gate covering Section 11's steps 1-3 (the `src/lib/candidates.ts`, `src/lib/measures.ts`, and `src/app/ballot/page.tsx` changes), followed by a separate verification gate mirroring the Gate I4A/I5A pattern already established for reviews — documenting what was implemented, what limitations remain, and a manual test checklist — before this is considered ready for Controlled PSL Beta.

This track is independent of, and does not block or get blocked by, the County Commission safe test (Gate 17B), which remains separately gated on the user providing the Gate 15 final approval statement.
