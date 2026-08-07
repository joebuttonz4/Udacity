# Internal Beta — Gate I20: Voting-Record Beta-Scope Decision

## 1. Date and timestamp

Date: 08-06-2026
Timestamp: 09:04 pm EST

This document is product-scope decision documentation only. It does not modify `voting_records`, `candidate_positions`, `match_scores`, `candidates`, `civic_dna`, or `user_districts`. It does not write to Supabase. It does not change source code, PowerShell scripts, schema, RLS, grants, seeds, migrations, or CSV files. It does not call the Anthropic API. It does not deploy.

## 2. Repository baseline

- Local path: `J:\CivicMarket`
- Branch: `master`
- Working tree: clean
- Up to date with `origin/master`
- Latest pushed commit:
  - `625f204` Update current state for Gate I19
- Previous pushed commits:
  - `50c2a37` Add voting record official source review
  - `5b7b204` Update current state for Gate I18
  - `24f7f1f` Add non-incumbent source availability recheck
  - `bada51f` Record Gate I17 live UI verification

## 3. Gate status

Complete. Product-scope decision documentation only. No voting-record data change, database write, source-code change, secret inspection, County Commission change, or deployment occurred.

## 4. Purpose

Make the explicit Internal Beta product-scope decision for voting records now that Gate I19 confirmed: `voting_records_real.csv` has zero rows; no current voting-record row is beta-safe; there are no bad rows to repair; the blocker is the absence of verified voting-record data; candidate match rings remain locked independently. Decide whether this absence must delay Internal Beta, or whether the app can launch safely with a transparent unavailable state.

## 5. Gate I19 findings carried forward

- Zero rows exist in `voting_records_real.csv` (header-only, re-confirmed by live `scripts/validate-real-psl-csvs.cjs` run: 0 rows, 0 errors, 1 expected header-only warning).
- `candidate_positions` is empty for all four current District 1 candidates because `recompute_candidate_positions` has no `voting_records` input.
- All four current City Council District 1 candidates (Reikenis, Baptiste, Zimmerman, Meltzer) are non-incumbents with no verified Council vote history — this is a pre-existing, dated, approved decision (`real_data_review_log.md`, 2026-06-28), not a new finding.
- No placeholder, synthetic, duplicate, or mismatched voting-record row exists — because none exist at all.
- Outcome A from Gate I19: no existing voting-record row is ready for beta display. This is an empty feature area, not a remediation problem.
- Gate I19 explicitly did not select among its four options — that decision is this gate's purpose.
- Gate I19 flagged as a corroborating (not live-reconfirmed) fact that Gate I10B's live database query already found `candidate_positions` at 0 rows system-wide and `voting_records` unlinked to any of the four candidates — consistent with, not contradicting, the CSV state.

## 6. Current voting-record UI behavior (directly inspected)

**Where voting records appear in the app:**

1. **`src/app/candidates/[id]/page.tsx`, lines 435-493 — "Voting Record" section, Voting tab.** This is the only place per-candidate voting-record rows are rendered anywhere in the app.
2. **`src/app/candidates/[id]/page.tsx`, lines 536-542 — a static "Details / disclaimer" section**, unconditionally rendered (not gated on data presence), that already contains the sentence: *"CivicMarket beta — candidate and funding data sourced from official public records. Voting records are not yet available for these candidates."* This is an existing, always-visible partial unavailable-state statement, but it lives inside a general disclaimer block, not inside the Voting Record section itself, and it is candidate-set-specific wording ("for these candidates") rather than a general, reusable unavailable-state pattern.
3. **`src/app/data-sources/page.tsx`, lines 67-77 — a "Voting records" methodology section.** This describes voting-record sourcing in the present tense ("Every voting record includes a link to the official source document") without stating that the feature currently has zero populated records. This is a wording gap relative to the same page's "Civic DNA scoring" section (lines 103-119), which Gate I16 already updated to explicitly acknowledge that some candidates may have a fully locked ring — the "Voting records" section was not similarly updated by Gate I16 and still reads as if the feature is already populated.
4. **`src/app/ballot/page.tsx`** — does not render voting-record rows or counts on candidate cards at all. It only contains a generic subtitle ("Tap any candidate to see their voting record, funding, and your match score.") and an existing disclaimer line (line 305: "Voting records, ballot details, and match scores stay locked unless official records support them."). No zero count, no per-candidate voting indicator, no placeholder appears on the ballot.
5. **Profile page, Civic DNA screens** — do not reference voting records at all (confirmed by absence of any match for `voting_records`/`VotingRecord` in those files during this inspection).

**Exact current empty-state behavior (Voting Record section, lines 440-492):**

```
{votingRecords.length > 0 ? (
  ...renders rows...
) : (
  <p className="text-[#9CA3AF] text-sm [font-family:var(--font-instrument-sans)]">
    No voting records yet.
  </p>
)}
```

- The section **renders**, it does not disappear silently.
- It shows the literal text **"No voting records yet."** — not a numeric "0," not "0 votes," not any count.
- No placeholder or demo rows are shown; `votingRecords` is either populated with real Supabase rows or empty — there is no synthetic fallback data path in `getCandidateVotingRecords` (`src/lib/candidates.ts`, lines 231-240).
- There is no dedicated `EmptyState` component anywhere in `src/` (confirmed by search) — every empty state in this app, including this one, is implemented as inline conditional JSX local to its own section, matching the same pattern used for "No funding data yet." (line 532) immediately below it.
- This state is **not currently labeled as an error.** There is no error icon, no retry button, no red/amber error styling on the Voting Record section itself.

**Answering the required determinations directly:**

1. Voting records appear only on the candidate profile's Voting tab (and are referenced, but not rendered as data, in the Data Sources methodology page and a ballot disclaimer line).
2. A section does render when zero rows exist — it is not conditionally hidden.
3. It does not disappear silently.
4. It does **not** show "0" anywhere, and does not imply the candidate has no voting history — "No voting records yet." is closer to a neutral pending-data phrase than a "zero" claim, though "yet" carries a mild implication that records are expected imminently, which is not strictly accurate for non-incumbents who structurally have no Council votes to record.
5. No placeholder or demo content is shown.
6. The current UI already has a rudimentary unavailable/empty state ("No voting records yet."), plus a separate always-visible disclaimer sentence lower on the same page — but neither uses the specific "verified source data not yet available" framing this gate's Option 3 language requirements call for, and neither is styled distinctly from a generic empty list.
7. Visibility by page: **ballot cards** — no per-candidate voting content, only a general disclaimer line; **candidate profiles** — yes, dedicated section plus disclaimer sentence; **profile** — not present; **Civic DNA** — not present; **Data Sources** — a static methodology paragraph, present-tense wording not yet updated for the zero-row state; **no other user-facing page** references voting records.
8. Current behavior assessment: **not misleading, but incomplete and inconsistent.** The candidate-profile Voting tab is already close to safe (no zero, no placeholder, renders visibly). The Data Sources methodology paragraph is the weakest link — it reads as though voting records are already a working, populated feature, which is not true today and could set an inaccurate expectation for an Internal Beta tester who then finds every candidate's Voting tab empty.

## 7. Files and components inspected

- `src/app/candidates/[id]/page.tsx` (Voting Record section, Details/disclaimer section, full component)
- `src/lib/candidates.ts` (`getCandidateVotingRecords`, `VotingRecord` type)
- `src/app/ballot/page.tsx` (candidate card rendering, disclaimer text)
- `src/app/data-sources/page.tsx` (full page, all six sections)
- `src/components/ui/MatchScoreRing.tsx` (locked-state `aria-label` pattern, referenced for consistency)
- `docs/beta_launch_readiness_plan.md` (Sections 6, 7, 10 — beta-stage requirements and blocker status table)
- `docs/internal_beta_gate_i19_voting_record_official_source_review.md` (full document, Sections 21-25)
- `CIVICMARKET_CURRENT_STATE.md` (Hard beta blockers, Locked beta scope, Data availability limits sections)
- `Reference Files/CIVICMARKET_PATCH_MAY12.md` (Civic DNA dimension source of truth — read per instruction, not directly relevant to voting-record UI)
- Confirmed by search: no `EmptyState` or equivalent shared component exists anywhere in `src/`.
- Confirmed by search: no other file in `src/` references `VotingRecord` or `voting_records` besides `src/app/candidates/[id]/page.tsx`, `src/lib/candidates.ts`, `src/app/admin/entry/page.tsx`, and `src/app/admin/records/page.tsx` (admin pages, out of scope — beta users do not see admin routes).

No `.env`, `.env.local`, `.env.*`, or secret-named file was inspected.

## 8. Option 1 evaluation — Keep voting records hidden

- **Transparency risk:** Moderate. Hiding the section entirely removes even the current mild acknowledgment ("No voting records yet.") that the feature exists and is intentionally empty, which could read as the feature never having been planned at all.
- **User confusion risk:** Low-moderate. A tester who expects a Voting tab (implied by the ballot subtitle "Tap any candidate to see their voting record...") and does not find one may wonder if it is missing or broken.
- **Implementation effort:** Low — would require conditionally not rendering the section, and updating the ballot subtitle/disclaimer wording to stop promising voting-record content.
- **Whether silence is acceptable during beta:** Acceptable in principle, but weaker than Option 3 given CivicMarket's already-established "transparent incompleteness" philosophy from the locked-ring work (Gates I14-I16).
- **Conflict with approved build-guide requirements:** None found — `docs/beta_launch_readiness_plan.md` Section 6 ("Must-have before Internal Beta") does not list populated voting-record content as required; Section 7 ("Must-have before Controlled PSL Beta") also does not list it, only listing "Voting records with official source URLs" in Section 10's status table as "Intentionally not done ... not an app bug," not as a blocking checklist item.

## 9. Option 2 evaluation — Show only verified rows

- **Uneven candidate-treatment risk:** Not currently actionable — there are zero verified rows for any of the four candidates, so this option cannot itself resolve today's empty state. It is a data-display rule for the future, not a present UX decision.
- **Risk that absence reads as "no voting history":** This is exactly the risk Option 3's wording is designed to prevent; Option 2 alone, without an unavailable-state explanation, would leave the current ambiguous "No voting records yet." text in place indefinitely.
- **Future scalability:** Sound — once verified rows exist for some candidates and not others (e.g., if Mayor incumbent data were separately reviewed and approved in a future gate), this becomes the operative display rule: show exactly what is verified, per candidate, with a source link on every row.
- **Conclusion:** Option 2 is confirmed as the correct **long-term data rule**, consistent with the gate's framing, but is not sufficient by itself as today's zero-row UX decision.

## 10. Option 3 evaluation — Show an unavailable-state explanation

- **Transparency:** High. Directly tells the user why the section is empty, without inventing data.
- **User trust:** High. Mirrors the exact successful pattern already used for locked match rings (Gates I14-I16: "Why is this locked?" / neutral, non-blaming, no zero implication) and already partially present in the disclaimer sentence at lines 536-542 — this option formalizes and relocates that message into the section itself, rather than replacing working behavior with something novel.
- **Mobile impact:** Low risk. A short two-line message replacing "No voting records yet." fits the same layout footprint already proven at 390px by the existing "No voting records yet." and "No funding data yet." states.
- **Accessibility:** Low risk. Plain visible text, no icon-only communication, consistent with the `MatchScoreRing` locked-state `aria-label` precedent (`"Match score unavailable. Not enough verified position data."`) already implemented and live-verified in Gate I16/I17.
- **Implementation effort:** Low — a wording change to the existing conditional block in `src/app/candidates/[id]/page.tsx` (lines 488-491), plus an optional Data Sources wording refresh (Section 6, finding 3 above) to stop implying the feature is already fully populated.
- **Consistency with the locked-ring philosophy:** High — this is functionally the same "transparent incompleteness over unsupported completeness" position CivicMarket already adopted for match scores.
- **Whether this safely removes the beta blocker:** Yes, provided the wording avoids implying zero voting history and clearly attributes the gap to data availability, not candidate behavior — consistent with the "Candidate fairness rules" and "Language requirements" specified for this gate.

## 11. Option 4 evaluation — Delay beta launch

- **Whether voting records are truly required for the core beta purpose:** No evidence found that they are. `docs/beta_launch_readiness_plan.md` Section 4 states the beta goal as Civic DNA, districting, and candidate/ballot browsing with match scoring — voting records are one input into candidate context, not the beta's core mechanic (Civic DNA and match scores are, per Section 5 of that plan, explicitly marked "core and non-negotiable").
- **Whether beta users can still evaluate the rest of the experience without them:** Yes — onboarding, Civic DNA, ballot, candidate profile (bio, funding, reviews), Vote screen, and Profile all function today independent of voting-record content, and already do so live (Gate I17's live UI verification exercised these paths with zero `match_scores` and zero voting records present, without any blocking failure).
- **Whether delaying provides enough product value to justify the schedule impact:** No — delaying blocks an otherwise-ready beta on a data-acquisition dependency (official item-specific sources for non-incumbents) that this repository's own approved decision (`real_data_review_log.md`, 2026-06-28) says should not be rushed or manufactured.
- **Whether the build guide or current-state documentation explicitly requires voting records for beta launch:** No. `docs/beta_launch_readiness_plan.md` Section 10 lists "Voting records with official source URLs" as a table row with status "Intentionally not done ... remains blocked on an official item-specific source, not an app bug" — presented as an accepted, correctly-blocked state, not as an open launch-blocking checklist item, and it is absent from both Section 6 ("Must-have before Internal Beta") and Section 7 ("Must-have before Controlled PSL Beta")'s explicit requirement lists.

## 12. Decision criteria applied

1. **Misinformation risk:** Option 3 lowest among options that keep the feature visible; Option 1 comparably low but less transparent; Option 4 not applicable (no display at all).
2. **User transparency:** Option 3 highest.
3. **Candidate fairness:** Option 3 requires (and this document specifies) identical wording for every candidate — satisfied.
4. **Product usefulness:** Option 3 preserves the feature's presence and educates the user on methodology; Option 1 reduces perceived completeness.
5. **Internal Beta purpose:** Testing the core experience (Civic DNA, districting, ballot, candidate browsing) — not blocked by voting-record absence under any option except Option 4.
6. **Accessibility:** Option 3 requires only a plain-text change, consistent with existing accessible patterns.
7. **Mobile clarity:** Option 3 fits the existing proven layout footprint.
8. **Implementation complexity:** Option 3 is low — smaller than a full hide-and-rewire (Option 1) since the section, conditional structure, and disclaimer sentence already exist and only need wording/placement changes.
9. **Reversibility:** Option 3 is fully reversible — once verified rows exist, the conditional simply renders populated rows instead (Option 2 becomes active automatically via the existing `votingRecords.length > 0` branch).
10. **Consistency with personal-action-first principle:** Option 3 does not invent or infer data; it tells the user honestly what CivicMarket does and does not yet have for them.
11. **Consistency with the locked-ring decision:** Option 3 directly mirrors Gates I14-I16's approved "transparent incompleteness" pattern.
12. **Whether missing data can be represented honestly without implying absence of civic history:** Yes, under Option 3's specified language requirements (Section 16 below), which explicitly prohibit "No voting history," "0 votes," and similar phrasing.
13. **Whether voting records are essential to the beta's primary learning goals:** No — per `docs/beta_launch_readiness_plan.md` Section 5, Civic DNA and onboarding/districting are the non-negotiable core; voting records are supporting candidate context.

## 13. Selected beta behavior

**Option 3: Show an unavailable-state explanation** is selected as the current Internal Beta behavior, with **Option 2 confirmed as the long-term data-display rule** once verified rows exist for any candidate.

No repository evidence was found that populated voting-record content is mandatory for beta launch — `docs/beta_launch_readiness_plan.md` treats it as an accepted, correctly-blocked data gap, not an open requirement, in both its Internal Beta and Controlled PSL Beta must-have lists. Option 4 is therefore not selected.

## 14. Selected copy

### Section heading

Preserve the existing section heading: **"Voting Record"** (`src/app/candidates/[id]/page.tsx`, line 438). No change needed.

### Primary unavailable message

**Verified voting record data is not available yet.**

### Secondary explanation

**CivicMarket only shows voting records when an official source confirms the exact item, date, and individual vote. We do not fill missing records with estimates or assumptions.**

### Optional methodology link

**How CivicMarket verifies voting records** — linking to `/data-sources`, following the exact pattern already used by the "Why is this locked?" match-score explanation (`src/app/candidates/[id]/page.tsx`) with its "How match scores work →" link.

### Recommended placement

Replace the current plain "No voting records yet." text (lines 488-491) with the primary and secondary messages above, inside the same `section id="section-voting"` container. The existing always-visible disclaimer sentence at lines 536-542 ("Voting records are not yet available for these candidates.") would become redundant with this more specific in-section copy and should be reviewed for removal or consolidation at implementation time — this document recommends against carrying duplicate unavailable-state messages on the same page, but leaves the exact resolution (remove vs. shorten vs. keep as a general beta disclaimer covering multiple data types) to the implementation gate.

### Data Sources wording

The existing "Voting records" section on `/data-sources` (lines 67-77) should be updated at implementation time to match the acknowledgment pattern already used in the same page's "Civic DNA scoring" section (lines 103-119) — i.e., state the sourcing methodology as today, but also state plainly that some or all candidates may currently show no voting records because no verified source-backed item exists yet, consistent with the disclaimer already at line 125. This avoids the page reading as though the feature is fully populated when it is not.

## 15. Unavailable versus error — required distinction

### Unavailable data (this gate's scope)
- Trigger: `votingRecords.length === 0` after a successful query.
- No verified voting-record rows exist.
- Neutral styling (matches existing `text-[#9CA3AF]` muted-gray treatment already used).
- No retry button.
- Methodology explanation shown (Section 14 copy).
- No error icon required.

### Actual application error
- Trigger: the `getCandidateVotingRecords` call throws (network failure, Supabase query error).
- Currently, per `src/app/candidates/[id]/page.tsx` lines 141-196, any thrown error from the `Promise.all` bundle (which includes `getCandidateVotingRecords`) is caught by the outer `try/catch` and surfaces as the page-level `error` state, not as a per-section state — meaning a voting-records query failure today would currently present as a whole-profile error, not a scoped "Voting Record" section error. This gate does not evaluate this as a defect (it is out of scope — the match-score-specific error-vs-locked distinction was already handled per-section in Gate I16 for `matchScoreError`, but voting records were not previously scoped for the same per-section error handling). A future implementation gate should decide whether voting-record query failures warrant the same scoped, section-local error handling `matchScoreError` already received, or whether the existing whole-page error behavior is acceptable to keep as-is.
- Error styling allowed if scoped in a future gate.
- Retry may be offered if scoped in a future gate.
- Must not use the unavailable-data wording above.

### Verified data exists
- `votingRecords.length > 0` — existing behavior (lines 440-487) already satisfies this: shows only rows returned by Supabase, each with a source link when `isSafeUrl(record.source_url)` is true, no mixing with placeholder content. No change needed to this branch.

## 16. Candidate fairness requirements

- The same unavailable-state wording (Section 14) must apply to every candidate with zero verified voting-record rows — no candidate-specific variation.
- No candidate receives a zero count anywhere in this section.
- No candidate is labeled inactive because of an empty Voting tab.
- No candidate is penalized in match scoring because voting-record data is absent — unaffected and unchanged by this gate (match-score locking already handled independently, Gates I11-I18).
- No candidate is hidden because voting-record data is absent — unaffected and unchanged (candidate visibility rules already locked, Gate I12).
- If future partial coverage exists (some candidates have verified rows, others do not), the unavailable-state wording for candidates without rows must not read as "this candidate has never voted" — it must remain data-availability framed, not history-framed, exactly as specified in Section 14's secondary explanation.

## 17. Accessibility requirements

- Visible text, not icon-only — satisfied by the plain-text copy in Section 14 (no icon dependency).
- Do not rely on color alone — satisfied; the muted-gray treatment is supplementary, not the sole signal (text content itself carries the meaning).
- Do not announce unavailable data as an error — satisfied by Section 15's explicit separation; no `role="alert"` or error-styled container should be used for this state.
- Link text must be descriptive — "How CivicMarket verifies voting records" is a descriptive, non-generic link label (not "click here" or "learn more").
- Keyboard accessible — the methodology link must be a real focusable `<a>`/`<Link>` element, consistent with the existing "How match scores work →" link pattern.
- Touch accessible — must meet the same tap-target sizing already used by the existing "Source ↗" links in the same section.
- Logical focus order — the unavailable message and its link must sit in natural DOM order within the existing section, matching current tab order.
- Verify at 200% zoom — required at implementation/verification time (Section 24).
- Verify at 390px width — required at implementation/verification time (Section 24).
- Avoid long warning banners — the two-sentence message (Section 14) is deliberately short, matching the length of the existing "Why is this locked?" body text already verified live in Gate I17.

## 18. Mobile requirements

- The two-sentence message must fit cleanly on a candidate profile at 390px width without introducing horizontal scroll — expected to hold, since it is shorter than the existing live-verified "Why is this locked?" body text at the same width.
- No clipped text.
- Candidate name and office must remain visually dominant above the Voting Record section — unaffected, since this section sits below the existing header/photo/name block and is not being restructured.
- The unavailable-state message must not visually overpower the rest of the candidate profile — achieved by keeping the existing neutral, non-bordered, non-banner styling already used for "No voting records yet." rather than adopting the amber-bordered treatment used for the page's separate beta disclaimer.
- The Data Sources link, if placed inline, must remain easily tappable at mobile width, consistent with the existing "Source ↗" and "How match scores work →" link sizing already in use on the same page.

## 19. Internal Beta scope impact

- No requirement in `CIVICMARKET_CURRENT_STATE.md`'s "Locked beta scope" list, and no requirement in `docs/beta_launch_readiness_plan.md` Sections 6 or 7, makes populated voting-record content mandatory for either Internal Beta or Controlled PSL Beta.
- "Candidate profile" is an approved beta screen in both documents; nothing requires its Voting tab to contain data.
- "Minimal admin voting-record entry" and "Claude draft scoring, reviewed/validated before beta" are approved beta scope items describing the entry/scoring *mechanism*, not a requirement that voting-record *content* exist before launch — this matches Gate I19's Section 22 finding exactly and is re-confirmed here.
- Adopting Option 3 does not expand, shrink, or otherwise alter the approved beta scope — it only changes wording inside an already-approved, already-visible screen.

## 20. Voting-record blocker decision

- **Voting records are no longer a hard beta-launch blocker**, provided the Option 3 unavailable-state wording (Section 14) is implemented in `src/app/candidates/[id]/page.tsx` and, ideally, `src/app/data-sources/page.tsx`, and verified live before beta invitations go out.
- Verified voting-record data acquisition (official item-specific sources for the four current non-incumbent candidates, or for any future incumbent candidate) remains a **post-decision, ongoing data-completion task** — unaffected by this gate, and still governed by the same evidence standard Gate I19 Section 9 documented (item-specific official source confirming candidate, item, date, description, and vote cast).
- The beta must not show fake, placeholder, unsupported, or zero-implying voting-record content at any point — this constraint is unconditional and carries forward from every prior gate in this sequence.

## 21. Incidental 11-candidate issue assessment (not resolved here)

- `candidates_real.csv` contains 11 rows: 4 City Council District 1 (all non-incumbent, already in beta scope), 4 Mayor (Shannon Martin `is_incumbent=true`, plus three non-incumbents), 3 City Council District 3 (all non-incumbent).
- The live database's import status for the Mayor and District 3 rows remains unverified — Gate I19 flagged this and did not resolve it; this gate does not resolve it either.
- `funding_real.csv` has only 4 rows (matching the original District 1 set), which is a separate signal — if Mayor/District 3 rows were fully imported and in beta scope, a funding-data gap would likely also need addressing, but this gate does not verify that relationship directly.
- **Classification:** this is best treated as a **pre-beta verification item**, not a new hard blocker and not a pure post-beta expansion item — because if those races are already live and visible to any current or future beta user (even accidentally, via direct URL navigation or a future ballot-listing change), the app's existing `hasRequiredCandidateFields` completeness gate (`src/lib/candidates.ts`, lines 80-94) would need to be the thing actually controlling their visibility, not an assumption that they are simply absent. This is a verification question ("are these live, and if so, are they complete enough to render"), not a build question — consistent with the "pre-beta verification item" framing over "separate beta blocker."
- No new gate is automatically opened for this. Per instruction, this is recorded as an assessment only.

## 22. Outcome

**Outcome B: Voting records can be removed as a hard beta blocker after a small unavailable-state implementation and live verification.**

This is chosen over Outcome C because direct code inspection (Section 6) found the current UI is **not yet fully safe** — the Data Sources methodology page still describes voting records in present-tense, fully-populated terms, and the candidate-profile section's current wording ("No voting records yet.") does not meet this gate's specific language requirements (Section 16, e.g., it does not explain *why* records are absent or affirmatively rule out a "zero history" reading). A small, scoped code change is therefore required before this can be closed by documentation alone — Outcome C is explicitly not available without that evidence, per this gate's own instruction not to select it without direct code/UI proof, and the direct proof gathered here shows a gap, not full safety.

## 23. Required implementation

A future implementation gate (Section 25) should:

- Replace the "No voting records yet." text in `src/app/candidates/[id]/page.tsx` (lines 488-491) with the Section 14 primary + secondary copy and methodology link.
- Resolve the redundancy between the new in-section copy and the existing disclaimer sentence at lines 536-542 (remove, shorten, or consolidate — implementer's judgment, documented at the time).
- Update the "Voting records" section on `src/app/data-sources/page.tsx` (lines 67-77) to acknowledge current non-availability, consistent with the same page's existing "Civic DNA scoring" section wording pattern.
- Decide (and document the decision) whether voting-record query failures should receive the same scoped, section-local error handling `matchScoreError` already has, or remain part of the existing whole-page error state (Section 15).
- Make no changes to `src/lib/candidates.ts`, `voting_records`, `candidate_positions`, `match_scores`, or any other data path — this is a presentation-only change.

## 24. Required verification

- `npm run build` passes with no new errors.
- `npm run lint` shows only the pre-existing known `scripts/*.cjs` require-import errors, nothing new.
- Live UI verification: unavailable-state message and methodology link render correctly on at least one real candidate profile.
- Identical wording confirmed across all four current candidates.
- No zero count, no placeholder row, no "no voting history" phrasing appears anywhere.
- 390px mobile width check: no clipping, no horizontal scroll.
- 200% zoom check: message remains readable, no overlap.
- Keyboard navigation: methodology link reachable and focusable in logical order.
- Screen-reader/accessible-name check on the methodology link and section text.
- Confirm the Data Sources page's updated "Voting records" section renders correctly and does not contradict the candidate-profile wording.
- Confirm this change does not alter locked-ring behavior, match-score behavior, or any other section on the candidate profile (regression check).

## 25. Recommended next step

Per Outcome B:

**Gate I21 — Voting-Record Unavailable-State Implementation and Verification.**

It should:
- Make the smallest approved UI change (Section 23).
- Update Data Sources wording only if needed (Section 23).
- Run `npm run build`.
- Run `npm run lint`.
- Perform the mobile and accessibility checks listed in Section 24.
- Perform live UI verification.
- Update `CIVICMARKET_CURRENT_STATE.md` with the result.
- Avoid additional planning-only gates — this decision (Gate I20) is complete; Gate I21 should implement, not re-decide.

Gate I21 is not implemented by this update.

## 26. Risks and mitigations

| Risk | Mitigation |
|---|---|
| A future implementer removes the disclaimer sentence at lines 536-542 without checking whether it covers other data types beyond voting records (it also mentions "candidate and funding data") | This document flags the exact line range and instructs the implementer to review, not blindly delete, the full sentence |
| The Data Sources "Voting records" section update accidentally implies a specific timeline for when real records will appear | Section 14/23 copy is deliberately timeline-free ("not available yet," not "coming soon" — "coming soon" is explicitly on this gate's prohibited-phrase list) |
| A future implementer treats the empty Voting tab as a bug and fabricates data to "complete" it | This gate, Gate I19, and the 2026-06-28 review-log entry all explicitly and consistently document this as an intentional, sourced decision |
| The incidental 11-candidate finding (Section 21) is mistaken for a resolved item because it appears in this otherwise-complete gate | Section 21 explicitly states no new gate is opened and the item remains unresolved; `CIVICMARKET_CURRENT_STATE.md`'s existing open-question framing for Mayor/District 3 should not be closed by this document |
| Implementer scopes voting-record error handling changes beyond the presentation-only boundary this gate sets | Section 23 explicitly limits the required implementation to presentation, and requires the error-handling decision (if made) to be documented separately at implementation time, not assumed here |

## 27. No-change confirmation

Gate I20 made no changes to: `candidates`, `voting_records`, `candidate_positions`, `match_scores`, `civic_dna`, `civic_dna_answers`, `user_districts`, `districts`, `current_officials`, `officials_for_user`, `src/lib/officials.ts`, `CurrentOfficialsSection`, `compute-match-scores` logic, Civic DNA scoring, `MatchScoreRing`, the ballot page, the candidate profile, the onboarding calculating page, the Data Sources page, the admin entry page, the admin records page, schema, tables, seeds, migrations, CSV files, RLS, grants, source code, PowerShell scripts, API keys, environment variables, the County Commission write guard, the At-Large row, deployment configuration, or deployment state.

No database write was performed. No candidate was scored. No candidate was ranked. No political recommendation was produced. No Supabase write was performed. No Claude or Anthropic API call was made. No secret file was inspected. `ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE` remains `false`. No County Commission District 1-5 write was performed. No deployment occurred. Exactly one new file was created: `docs/internal_beta_gate_i20_voting_record_beta_scope_decision.md`. `CIVICMARKET_CURRENT_STATE.md` was not modified by this gate.
