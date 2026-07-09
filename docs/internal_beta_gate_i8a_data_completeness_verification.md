# Internal Beta — Gate I8A: Data-Completeness Hiding Verification

## 1. Date and timestamp

Date: 07-09-2026
Timestamp: 03:39 pm EDT

This document is documentation and verification only. It does not change app behavior, run Supabase writes, deploy anything, or touch the County Commission write guard.

## 2. Current repo baseline

- Branch: `master`, working tree clean, up to date with `origin/master`.
- Latest pushed commit: `e7a11ee` ("Hide incomplete beta data").
- `npm run build` passed with 25 routes at that baseline.
- `ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE = false`, County Commission District 1-5 remains dry-run only — unchanged, not touched by this document.

## 3. What Gate I8 implemented

Confirmed by inspection of the three files Gate I8 touched:

- **`src/lib/candidates.ts`** — a module-private `hasRequiredCandidateFields` function, applied as a `.filter()` inside `getCandidatesForDistricts` (before the `match_scores` lookup, so hidden candidates never trigger an unnecessary score query) and as a null-return guard inside `getCandidateProfile` (an incomplete candidate causes the function to return `null`, the same value it already returns for a genuinely missing row).
- **`src/lib/measures.ts`** — a module-private `isSafeUrl` helper (mirroring the same-named helper already duplicated across the page files) and `hasRequiredMeasureFields`, applied the same way inside `getMeasuresForDistricts` (`.filter()`) and `getMeasureProfile` (null-return guard).
- **`src/app/ballot/page.tsx`** — a documentation comment added above `groupByDistrict` explaining (a) why an empty race group cannot occur given the already-filtered input, and (b) the one-candidate-race limitation (Section 9). No behavioral change was made to `groupByDistrict` itself, `filteredGroups`, or any empty-state branch — all of those already handled zero-candidate/zero-measure results correctly before Gate I8, and continue to inherit correct behavior automatically now that the lib-level results they consume are pre-filtered.

## 4. Candidate completeness rules

Implemented exactly as specified in `docs/internal_beta_gate_i7_data_completeness_hiding_plan.md` Section 5, confirmed by reading `hasRequiredCandidateFields`:

```ts
function hasRequiredCandidateFields(c: {
  name: string
  office: string
  district_name: string
  election_name: string
  election_date: string
}): boolean {
  return Boolean(
    c.name?.trim() &&
      c.office?.trim() &&
      c.district_name?.trim() &&
      c.election_name?.trim() &&
      c.election_date?.trim()
  )
}
```

A candidate must have a non-empty `name`, a non-empty `office`, a resolved `district_name` (empty only if the `districts` join fails), and a resolved `election_name`/`election_date` (empty only if the `elections` join fails). All five checks use `.trim()` so whitespace-only values are correctly treated as missing, not present.

## 5. Measure completeness rules

Implemented exactly as specified in `docs/internal_beta_gate_i7_data_completeness_hiding_plan.md` Section 6, confirmed by reading `hasRequiredMeasureFields`:

```ts
function hasRequiredMeasureFields(m: {
  title: string
  plain_english_summary: string | null
  election_name: string
  election_date: string
  full_text_url: string | null
}): boolean {
  return Boolean(
    m.title?.trim() &&
      m.plain_english_summary?.trim() &&
      m.election_name?.trim() &&
      m.election_date?.trim() &&
      isSafeUrl(m.full_text_url)
  )
}
```

A measure must have a non-empty `title`, a non-empty `plain_english_summary`, a resolved `election_name`/`election_date`, and a `full_text_url` that passes the same `https://`/`http://` prefix check already used everywhere else in the app for source-link safety. Measures are held to a stricter bar than candidates on this last point — a candidate's `website` is never required, but a measure's `full_text_url` is, matching the higher evidentiary bar `CLAUDE.md` already sets for ballot measures.

## 6. What Gate I8 intentionally did not require

Confirmed absent from both completeness functions, per the explicit Gate I8 scope:

- **Candidates:** `bio`, `photo_url`, `website`, `candidate_funding` rows, `voting_records` rows, and `candidate_positions` rows are not checked. A candidate passing the four required checks (Section 4) is shown regardless of whether any of these optional fields exist — the existing conditional rendering (`{candidate.bio && (...)}`, `{isSafeUrl(funding.source_url) && (...)}`, "No voting records yet.") continues to handle their absence exactly as before Gate I8.
- **Measures:** `measure_dimensions` rows are not checked. A measure passing the four required checks (Section 5) is shown regardless of whether dimension scoring exists — the existing "No scoring data yet." fallback in `src/app/measures/[id]/page.tsx` is unmodified and continues to trigger correctly.
- **Match score itself** is not a completeness input for either entity type — a complete candidate with no `match_scores` row is still shown, with `MatchScoreRing` correctly rendering its locked state (Section 8).

## 7. Direct URL behavior

Confirmed by inspection: `getCandidateProfile(id)` and `getMeasureProfile(id)` — the two functions backing `src/app/candidates/[id]/page.tsx` and `src/app/measures/[id]/page.tsx` respectively — now return `null` for an incomplete row in addition to their pre-existing `null` return for a genuinely nonexistent or archived row. Both page components already treat a `null` profile result as "not found" (`if (!profileData) { setError('Candidate not found.') ... }` and the equivalent for measures), so an incomplete record reached by direct URL — e.g., a bookmarked or shared link — now renders the same friendly not-found error state and "Back to Ballot" button as a truly missing candidate or measure, rather than a partially broken profile page. No change was needed in either page component to achieve this, since the existing null-handling already covered it once the lib functions started returning `null` for incomplete rows too.

## 8. Locked match ring non-regression requirement

Confirmed by inspection of `src/components/ui/MatchScoreRing.tsx` (not modified by Gate I8) and both completeness functions (Sections 4-5): neither `hasRequiredCandidateFields` nor `hasRequiredMeasureFields` reads or checks `match_score`, `candidate_positions`, or `measure_dimensions` in any way. A complete candidate or measure with no scoring data continues to reach the page with `match_score: null` / `dimensions: null`, and `MatchScoreRing` continues to render its existing locked-padlock state for that value exactly as it did before Gate I8. This requirement is satisfied by omission — the completeness functions simply never touch the fields that drive locked-ring rendering, so there was no code path capable of regressing it.

## 9. One-candidate race limitation

As documented directly in the code comment Gate I8 added above `groupByDistrict` in `src/app/ballot/page.tsx`: after completeness filtering, a district could show exactly one visible candidate. The current data model cannot distinguish between two cases that look identical from the app's perspective:

1. The race is genuinely uncontested (one real candidate, no others exist for that seat).
2. The race originally had multiple candidates, but one or more were filtered out by `hasRequiredCandidateFields` for missing required fields, leaving only one visible.

Gate I8 deliberately did not attempt to resolve this distinction in code — per the explicit Gate I8 instruction, the requirement was to **document** the limitation, not implement additional logic to hide reduced-count races (which `docs/internal_beta_gate_i7_data_completeness_hiding_plan.md` Section 7 had speculatively proposed as a possible default, but which Gate I8's narrower, explicit instructions superseded in favor of the lighter-touch documentation-only approach). This remains an open item requiring manual verification against real PSL ballot data before Controlled PSL Beta (Section 11).

## 10. Internal Beta acceptance criteria

For data-completeness hiding specifically, Internal Beta is considered acceptable if:

- The 4 real PSL District 1 candidates (Reikenis, Baptiste, Zimmerman, Meltzer, per `CIVICMARKET_CURRENT_STATE.md`) continue to appear on `/ballot`, Home's "Top matches," and their own `/candidates/[id]` profiles exactly as before Gate I8 — none of them should be hidden by the new filter, since they already have names, offices, districts, and election ties from the July 2 2026 real-data import.
- No console errors appear when loading `/ballot` or any candidate/measure profile.
- Existing empty-state messages ("No candidates found," "No races in this category") continue to render correctly, not a blank page, if a trusted tester's districts happen to have zero complete candidates/measures.
- A trusted tester manually creating a deliberately incomplete test candidate (e.g., via `/admin/entry` with a missing required field, if such a gap can be produced) does not see it appear on the ballot — this is a beta-scale spot-check, not an exhaustive audit.

## 11. Controlled PSL Beta acceptance criteria

Beyond the Internal Beta bar, before Controlled PSL Beta:

- Every candidate and measure actually shown to real PSL users must be manually spot-checked against the Section 4/5 rules using real production data, not just the 4 currently-imported District 1 candidates, since additional real candidates and the first real ballot measures are still expected to be added before that stage (`CIVICMARKET_CURRENT_STATE.md`'s "Immediate priorities" still lists voting records with official sources as the one remaining hard blocker).
- The Section 9 one-candidate-race limitation must be explicitly resolved or explicitly accepted with sign-off — either by confirming (against the real St. Lucie County ballot) that every one-candidate race the app shows is genuinely uncontested, or by implementing the stricter "hide reduced-count races" behavior `docs/internal_beta_gate_i7_data_completeness_hiding_plan.md` Section 7 described as a fallback, if manual confirmation proves impractical at scale.
- Direct-URL behavior (Section 7) must be spot-checked with at least one real, deliberately incomplete or archived record to confirm the not-found state renders correctly in production, not just in local testing.

## 12. Manual verification checklist

To be run manually before/at each beta stage:

- [ ] `/ballot` shows all 4 real PSL District 1 candidates, unchanged from before Gate I8.
- [ ] Home's "Top matches" preview shows the same candidates as `/ballot` (both read from the same, now-filtered, `getCandidatesForDistricts`).
- [ ] Navigate directly to each of the 4 real candidates' `/candidates/[id]` URLs — all four load normally, not a not-found state.
- [ ] Using `/admin/entry` or direct Supabase access (test data only, not production), create a candidate row missing `office`; confirm it does not appear on `/ballot` and that navigating directly to its `/candidates/[id]` URL shows the "Candidate not found" state.
- [ ] Confirm a complete candidate with zero `candidate_positions` rows still shows a locked (padlock) match-score ring, not a hidden card or a crash.
- [ ] If any real ballot measure exists, confirm it appears on `/ballot` only if it has a `plain_english_summary` and a safe `full_text_url`; if either is missing, confirm it does not appear and that direct navigation to its `/measures/[id]` URL shows "Measure not found."
- [ ] Confirm a complete measure with no `measure_dimensions` row still shows "No scoring data yet." under Civic DNA Impact, not a hidden card or a crash.
- [ ] Confirm no console errors appear on `/ballot`, `/`, `/candidates/[id]`, or `/measures/[id]` during any of the above.
- [ ] Visually confirm the code comment documenting the one-candidate-race limitation is present above `groupByDistrict` in `src/app/ballot/page.tsx`.

## 13. Expected pass/fail results

Based on the implementation described in Section 3 and reviewed in this gate:

| Test | Expected result |
|---|---|
| 4 real District 1 candidates unaffected | PASS — all four have name, office, district, and election tie already |
| Home "Top matches" inherits filter automatically | PASS — reads from the same filtered `getCandidatesForDistricts` call |
| Direct navigation to a complete candidate | PASS — unaffected, loads normally |
| Direct navigation to an incomplete candidate | PASS — returns `null` from `getCandidateProfile`, renders existing "not found" state |
| Incomplete candidate hidden from `/ballot` | PASS — filtered out by `.filter(hasRequiredCandidateFields)` before returning |
| Locked ring preserved for complete candidate with no positions | PASS — completeness functions never read `candidate_positions`/`match_score` |
| Incomplete measure hidden and direct-URL not-found | PASS — same pattern as candidates, applied to `hasRequiredMeasureFields` |
| Locked-scoring fallback preserved for complete measure with no dimensions | PASS — completeness function never reads `measure_dimensions` |
| Empty race sections never render | PASS — structurally guaranteed by `groupByDistrict`'s construction, unchanged by Gate I8 |
| One-candidate race after filtering is genuinely uncontested vs. artifact of filtering | **Known limitation, not resolved** (Section 9) — documented in code, requires manual real-data verification before Controlled PSL Beta |

## 14. No-write/no-deploy boundaries

The following apply to this document and were not violated in producing it:

- No app code was edited or created as part of this gate — this document is verification/documentation of the already-committed Gate I8 implementation, not a new change.
- No Supabase writes were performed.
- No deployment occurred.
- `ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE` was not changed — confirmed still `false`.
- `user_districts` was not modified.
- No schema, seed, migration, `districts`, `officials_for_user`, `src/lib/officials.ts`, `CurrentOfficialsSection`, or At-Large row change was made.

## 15. Recommended next gate

- **Manual spot-check gate:** run the Section 12 checklist against a real (or realistic test) Supabase environment, since this verification document was produced by static code review only, not a live run — no database read tool was available for this gate, consistent with the pattern already established in prior verification gates (e.g., Gate I4A, Gate I5A) for this project.
- **County Commission safe test (Gate 17B):** remains a fully separate, parallel track, still blocked strictly on the user providing the Gate 15 final approval statement — unaffected by anything in this document or Gate I8.
- **Section 11's one-candidate-race resolution** should be scheduled as its own small gate once real PSL ballot composition for the relevant races is confirmed, rather than left open indefinitely.

## 16. Deferred improvements after beta

Explicitly out of scope for beta, listed here so they are not silently forgotten:

- Resolving the one-candidate-race ambiguity with an actual data-level signal (e.g., a way to mark a race as confirmed-uncontested, or comparing filtered vs. unfiltered candidate counts per race) rather than relying on manual verification each time new data is added.
- Extending completeness rules to other entity types not covered by Gate I8 (e.g., `current_officials`, if a future gate decides they need the same treatment — not currently required, since Current Officials already has its own verified-source-only seeding process per `CIVICMARKET_CURRENT_STATE.md`).
- Any schema-level completeness enforcement (e.g., `NOT NULL` constraints or a future `is_published` column) — this gate and Gate I7 both explicitly committed to computed, read-time filtering only; a schema-level alternative remains a possible future direction but requires its own separately approved gate.
- Automated testing (unit tests for `hasRequiredCandidateFields`/`hasRequiredMeasureFields`) — Section 12's checklist is manual; formal automated test coverage was not part of Gate I8's scope and remains a reasonable future addition.

None of these are required before Internal Beta per the acceptance criteria in Section 10, and none are implied to be approved by their presence in this list — each would need its own future gate.
