# Internal Beta — Gate I14: Locked-Ring Internal Beta Communication Plan

## 1. Date and timestamp

Date: 08-05-2026
Timestamp: 11:41 pm EST

This document is documentation and planning only. It does not implement any wording in source code. It does not write to `candidates`, `voting_records`, `candidate_positions`, `match_scores`, `civic_dna`, `civic_dna_answers`, or any other table. It does not call the Anthropic API. It does not change source code, PowerShell scripts, schema, seeds, migrations, CSVs, RLS, grants, or environment variables. It does not deploy.

## 2. Current repository baseline

- Local path: `J:\CivicMarket`
- Branch: `master`
- Working tree clean, up to date with `origin/master`
- Latest pushed commit: `5b7d50e` Update current state for Gate I13
- Previous pushed commits:
  - `0aedbc6` Add non-incumbent source availability inventory
  - `2935bf1` Update current state for Gate I12
  - `55b9748` Add non-incumbent candidate position methodology decision
  - `cdff013` Update current state for Gate I11 and session automation

## 3. Gate status

Complete. Documentation and planning only. No source-code change, database write, API call, secret change, County Commission change, or deployment occurred.

## 4. Gate purpose

Define clear, neutral, accessible user-facing communication for locked candidate match rings during Internal Beta. The communication must explain why a ring is locked, that verified source-backed candidate-position data is not yet consistently available, that the candidate remains visible, that the app is not broken, and that CivicMarket will not guess, infer, or fabricate candidate positions. This gate defines wording and placement only — it does not implement any of it in source code.

## 5. Scope

In scope:
- Defining communication principles, approved terms, and prohibited terms for locked-ring messaging.
- Recommended copy for every user-facing surface where a locked ring or absent match score appears.
- A placement matrix, accessibility requirements, mobile requirements, and a must-have/enhancement priority split.
- A testing plan and implementation boundaries for a future, separately approved implementation gate.

Out of scope:
- Any actual edit to `src/components/ui/MatchScoreRing.tsx`, `src/app/ballot/page.tsx`, `src/app/candidates/[id]/page.tsx`, `src/app/onboarding/calculating/page.tsx`, `src/app/data-sources/page.tsx`, or any other file.
- Any change to `candidate_positions`, `match_scores`, `voting_records`, `compute-match-scores` logic, Civic DNA scoring, schema, RLS, or County Commission logic.
- Any candidate scoring, ranking, or recommendation.

## 6. Gate I13 decision carried forward

Gate I13 (`docs/internal_beta_gate_i13_non_incumbent_source_availability_inventory.md`) concluded, unchanged by this gate:

- No consistent first-party source type is available across all four current non-incumbent City Council District 1 candidates.
- Three candidates have confirmed campaign websites; Indony Baptiste does not currently have a confirmed first-party policy source.
- Fredric Meltzer versus Rick Meltzer remains an unresolved identity/name discrepancy.
- Education had no confirmed first-party policy coverage for any candidate; housing and transparency coverage was incomplete or ambiguous.
- No candidate was scored, ranked, or recommended.
- Gate I12's decision remains unchanged: all four candidate match rings remain locked, candidate cards remain visible, missing evidence must not be scored as zero, neutral, or opposed.
- Locked rings are a transparent data-availability state, not an app defect.
- No deployment is approved. County Commission District 1-5 remains dry-run only. `ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE` remains `false`.

## 7. Communication principles

Every future implementation of this plan must satisfy all of the following:

- Plain language; sixth-grade reading level where practical.
- Neutral and non-partisan tone.
- No implication that the candidate caused the lock.
- No implication that the candidate refused to participate, unless that fact is separately verified (it is not verified for any of the four current candidates today — see Section 22).
- No implication that the app failed.
- No implication that a locked ring means a poor match.
- No implication that no data means neutral (a locked ring must never be visually or textually confused with a `0` score).
- No political labels, no ideological inference, no ranking language, no pressure language.
- No hidden candidate cards — every candidate stays visible regardless of ring state.
- No unsupported certainty.
- Explain that CivicMarket prefers no score over an unsupported score.
- Explain that scores unlock only when a consistent, source-backed methodology is available and approved — without promising a date.

## 8. Terms to use

Recommended, consistent vocabulary for a future implementation:

- "Match score unavailable"
- "Not enough verified position data"
- "Waiting for verified source data"
- "Match score not calculated"
- "Source-backed position data is not yet available"
- "Candidate remains visible"
- "No score is shown until the evidence standard is met"

These terms were selected because each one states a factual, neutral condition (data does not yet exist) rather than a judgment about the candidate or an implied timeline. They are consistent with the existing partial-coverage language already on `src/app/ballot/page.tsx` line 168-169 ("A ring stays locked until you finish the quiz and matching data is available"), which this plan treats as a correct starting direction to build on, not something to contradict.

## 9. Terms to avoid

Explicitly prohibited in any future locked-ring-adjacent copy:

- "No match"
- "Zero match"
- "Candidate has no positions"
- "Candidate refused to answer"
- "Candidate did not cooperate"
- "Unknown candidate"
- "Incomplete candidate"
- "Bad data"
- "Failed score"
- "Error calculating match"
- "Not compatible"
- "Unverified candidate"
- "Low-information candidate"
- "Ideology unavailable"
- "We do not know what this candidate believes"
- "Coming soon" (unless there is an approved timeline, which does not exist today)
- "AI could not score this candidate"

## 10. Locked-ring meaning

A locked ring must be documented, and future copy must communicate, as meaning:

- CivicMarket does not currently have enough approved, source-backed candidate-position data to calculate a reliable match score.
- The candidate is still active and visible.
- The lock is not a negative rating.
- The lock is not a zero score.
- The lock is not evidence of candidate non-participation.
- The lock is not an error.
- CivicMarket is intentionally avoiding unsupported assumptions, consistent with `CLAUDE.md`'s standing rule that this is "a data availability limit, not an app bug."

## 11. Ballot-card communication

**Current state (read directly from `src/components/ui/MatchScoreRing.tsx`):** when `score === null`, the component already renders a distinct locked visual (dashed track, lock icon) with `aria-label="Match score locked"` — this is a reasonable existing foundation, not a blank or broken-looking state. `src/app/ballot/page.tsx` (line 168-169) already carries a short explanatory line above the candidate list: "Match score rings show how closely a candidate aligns with your Civic DNA. A ring stays locked until you finish the quiz and matching data is available." No per-card locked-ring label or helper text currently exists next to each individual `MatchScoreRing` instance on the ballot card itself (line 264).

**Recommended direction (not implemented by this gate):**
- Label: "Match unavailable"
- Helper: "Not enough verified position data yet."
- Accessible explanation (expands the existing `aria-label`): "CivicMarket has not calculated a match score for this candidate because approved source-backed position data is not yet available."
- Optional tooltip or expandable explanation, not a required modal.

The ballot-card text must fit a mobile card and must not make the card visually dominant — the candidate's name and office must remain the most prominent element (Section 20).

## 12. Candidate-profile communication

**Current state (read directly from `src/app/candidates/[id]/page.tsx`, lines 372-395):** the "Your Match Score" section already renders `MatchScoreRing` at `lg` size. When `matchScore !== null`, it shows `matchLabel(matchScore)`. When `matchScore === null`, it **always** shows "Take the Civic DNA quiz to unlock your personal match score." with a "Take quiz →" link to `/onboarding/dna-teaser` — **regardless of whether the current user has already completed the Civic DNA quiz.** This is a real, existing conflation between two different states this gate is specifically required to distinguish (Section 18, Section 24): a user who has not taken the quiz yet, and a user who has completed the quiz but whose candidate has no `candidate_positions` evidence. Today, both states show the identical "take the quiz" prompt, which would incorrectly tell an already-onboarded Internal Beta user to retake a quiz they already completed. This gate documents the gap; it does not fix it (Section 31, deferred to Gate I15).

**Recommended direction (not implemented by this gate), for the candidate-position-unavailable case specifically (user has already completed Civic DNA):**
- Heading: "Why is this locked?"
- Body: "CivicMarket does not yet have enough verified, source-backed position data to calculate a reliable match score for this candidate. The lock is not a rating and does not mean the candidate is a poor match."
- Include a link to the Data Sources page (`/data-sources`) for the fuller methodology explanation.

The existing "Take the Civic DNA quiz..." prompt should be recommended for the Civic-DNA-missing case only (Section 24), not shown to a user who has already completed the quiz.

## 13. Onboarding calculating-screen communication

**Current state (read directly from `src/app/onboarding/calculating/page.tsx`):** the screen calls `POST /api/compute-match-scores`, waits at least 2.5 seconds, then always routes to `/ballot` regardless of the API result (success, partial `skipped` count, or a caught/swallowed error — `.catch(() => {})`). Its only visible text is "Calculating your matches" / "Comparing your values against every candidate on your ballot..." — there is no post-calculation success or explanation screen; the user is routed straight to the ballot, where they will see locked rings for all four current candidates with no immediate explanation of why.

**Recommended direction (not implemented by this gate):**
- Heading: "Your Civic DNA is ready"
- Body: "We saved your Civic DNA. Match scores will appear only for candidates with enough verified position data. Some candidate rings may stay locked during the Internal Beta."
- CTA: "View my ballot"
- Avoid indefinite loading language — the current "Calculating your matches" framing risks implying an in-progress computation that could still complete later; the recommended replacement instead confirms the save succeeded and sets locked-ring expectations before the user reaches the ballot.

## 14. Civic DNA completion communication

A future implementation must make clear, wherever Civic DNA completion is confirmed (the calculating screen and, per Section 15, the Profile page):

- The user's Civic DNA was successfully saved.
- Locked candidate rings are unrelated to whether the quiz succeeded.
- The user should not be asked to retake the quiz merely because candidate data is unavailable — this directly addresses the Section 12 gap, where the current candidate-profile code would otherwise prompt a already-completed user to "take quiz" again.

## 15. Profile-page communication

**Current state (read directly from `src/app/profile/page.tsx`, lines 311-346):** when `dna_quiz_status === 'completed'` and DNA data exists, the Profile page already shows the user's seven dimension scores directly — it does not currently show any candidate-match or locked-ring messaging at all, only DNA dimension values. When the quiz is not completed, it shows "You haven't taken the Civic DNA quiz yet. Take it to unlock match scores..." This existing quiz-incomplete message is correctly scoped to the true Civic-DNA-missing state (Section 24) and is not confused with candidate-position availability, unlike the candidate-profile page. This gate recommends no change to the Profile page's existing DNA-complete display, and recommends that the existing quiz-incomplete prompt be treated as the canonical wording pattern for the "Civic DNA missing" state elsewhere (Section 24), rather than introducing a new competing phrasing.

## 16. Data Sources page communication

**Current state (read directly from `src/app/data-sources/page.tsx`, lines 103-113):** a "Civic DNA scoring" section already exists, but its current wording ("Dimension scores for candidates and ballot measures are AI-generated drafts based on voting records, funding patterns, and public statements. All AI draft scores are reviewed and validated by the CivicMarket team before being shown to beta users.") predates Gates I11-I13 and does not reflect the current, more precise state of the methodology: (a) "public statements" is not an approved source category today — Gate I12 explicitly deferred and did not approve campaign-statement-derived scoring; (b) "funding patterns" are not documented anywhere in Gate I11's confirmed `recompute_candidate_positions` behavior as a scoring input; (c) the page does not currently disclose that unsupported dimensions remain unavailable rather than defaulted, or that some candidates may have fully locked rings during Internal Beta. This is flagged as an existing accuracy gap for a future implementation gate to correct — not corrected by this documentation-only gate.

**Recommended direction (not implemented by this gate):**
- Candidate match scores depend on approved, source-backed candidate-position evidence.
- CivicMarket does not infer positions from party, donors, endorsements, biography, occupation, demographics, or campaign branding.
- Unsupported dimensions remain unavailable.
- During Internal Beta, some candidates may have locked rings.
- Candidate cards remain visible regardless of match-score availability.

The existing "Beta disclaimer" section (lines 116-120) already states a closely related principle ("Candidate, funding, voting record, ballot, and match details stay hidden or locked unless supported by reviewed official sources.") — a future implementation should extend or align with this existing disclaimer rather than duplicate it.

## 17. Help or FAQ communication

No dedicated Help or FAQ page currently exists in the routes read for this gate. Recommended question set for a future implementation, phrased but not built:

- Why is a candidate's match score locked?
- Does locked mean zero?
- Is the candidate missing from CivicMarket?
- Did the candidate refuse to participate?
- Did my Civic DNA quiz fail?
- When will the score unlock?
- How does CivicMarket decide when a score is available?
- Can a candidate correct source information?

No specific unlock date may be promised in any answer.

## 18. Empty-state and error-state distinction

Four distinct states must be defined and kept visually and textually separate in any future implementation:

### Data unavailable state
- Locked ring.
- Neutral styling (the existing `MatchScoreRing` locked variant — dashed track, lock icon — already achieves this).
- No retry button required.
- Explanation of the evidence limitation.
- Candidate remains visible.

### Actual application error
- Failed network request or failed database query.
- User may retry.
- Error styling allowed.
- Error logging may apply.
- Must not be presented as the same state as a locked ring.

### Civic DNA missing state
- User has not completed the quiz.
- Separate call to action to take or complete the quiz (the Profile page's existing "Take it to unlock match scores" wording, Section 15, is the correct pattern to reuse).
- Must not reuse candidate-data-unavailable wording.

### Candidate position unavailable state
- User completed Civic DNA.
- Candidate evidence is unavailable.
- Ring remains locked.
- No quiz-retake prompt (this is precisely the state the current candidate-profile code, Section 12, incorrectly conflates with the Civic-DNA-missing state today).

## 19. Accessibility requirements

- Do not rely on the lock icon alone.
- Provide visible text.
- Provide an `aria-label` or accessible name (the existing `MatchScoreRing` component already sets `aria-label="Match score locked"` for the null-score case — a future implementation should extend, not replace, this).
- Do not rely on color alone.
- Maintain readable contrast.
- Avoid hover-only explanations.
- Ensure the explanation is available by keyboard and touch.
- Keep focus order logical.
- Avoid ambiguous icon-only buttons.
- Use concise language for screen readers.
- Do not announce locked rings as errors.
- Verify at 200% zoom.
- Verify at 390px mobile width.

## 20. Mobile requirements

- Short text on ballot cards.
- No modal required for the basic explanation.
- Expandable detail or a link may be used for the fuller explanation.
- Avoid text clipping.
- Avoid horizontal scrolling.
- Keep the candidate name and office more prominent than the locked-ring explanation.
- Ensure bottom navigation is not obscured.
- Ensure the message fits at 390px width.
- Avoid stacking several warning banners (the existing ballot page already carries one explanatory line, Section 11, plus a bottom pilot-data disclaimer, `src/app/ballot/page.tsx` line 300 — a future implementation must be careful not to add a third overlapping banner).

## 21. Tone and reading-level requirements

**Use:** calm, direct, transparent, neutral, factual, reassuring without overpromising.

**Avoid:** defensive language, technical database terms in primary UI copy (e.g., `candidate_positions`, `match_scores`, `recompute_candidate_positions` must never appear in user-facing text), internal gate terminology (e.g., "Gate I12," "Option A" must never appear in user-facing text), AI-centric language in primary UI copy, legalistic language, candidate blame, political language, and promises that data will be available soon.

Sixth-grade reading level applies to primary UI copy (ballot card, candidate-profile explanation, calculating screen, FAQ answers). More detailed methodology language (e.g., the Data Sources page's fuller disclosure) may use a higher reading level where practical, consistent with its role as the deeper-detail surface rather than the primary at-a-glance surface.

## 22. Candidate fairness requirements

All four candidates with locked rings must receive identical wording and treatment. A future implementation must not:

- Show different locked-ring wording based on candidate.
- Mention which candidate has more or fewer sources on ballot cards.
- Display source-count comparisons.
- Label one candidate as more complete.
- Use web presence as a proxy for reliability.
- Imply that a candidate with a website is more transparent than one without one.
- Expose the unresolved Fredric Meltzer versus Rick Meltzer identity discrepancy (Gate I13, Section 14 and 19) in user-facing locked-ring text.
- Expose Indony Baptiste's missing first-party source (Gate I13, Section 12) as candidate-specific criticism.

Candidate-specific source details recorded in Gate I13 may remain in internal documentation only, until separately verified and approved for public display. Since all four candidates' rings are locked identically today (Gate I11/I12/I13's confirmed zero-`candidate_positions` state), this fairness requirement is currently satisfied automatically by the shared locked state — but it must be preserved as a hard requirement for any future state where some candidates might have position data before others.

## 23. Non-partisan language requirements

No user-facing locked-ring copy may reference party, ideology, endorsements, donors, or any of the prohibited-inference categories already established in Gate I12 (Section 17) — the communication is about data availability only, never about a candidate's political character or positioning. This applies even indirectly (e.g., no phrasing that implies a locked candidate is "harder to categorize" or "less predictable," which would smuggle in an ideological framing under the guise of a data-availability explanation).

## 24. Candidate non-response handling

Because no methodology has been approved to solicit or measure candidate "response" at all (Gate I12 deferred Options B-F), no future copy may claim or imply a candidate "did not respond" or "refused to participate" — no such fact has been established for any of the four candidates, and Gate I13 confirmed that Baptiste's missing source is a research finding about publicly available material, not a confirmed non-response by the candidate. This directly reinforces the Section 9 prohibited term "Candidate refused to answer" / "Candidate did not cooperate."

## 25. Data-source and methodology disclosure

The Data Sources page (Section 16) remains the single designated surface for the fuller methodology explanation. Primary UI surfaces (ballot card, candidate profile) should link to it rather than duplicating its full detail, consistent with the existing pattern where the ballot and candidate-profile pages already carry short disclaimers and the Data Sources page carries the longer explanation (Section 16's existing five-section structure).

## 26. User expectations during Internal Beta

Internal Beta users should be told, in aggregate (most naturally on the Data Sources page or a future FAQ), that: locked rings are expected and normal for the current candidate set; CivicMarket is not withholding a score that exists; no specific unlock date can be promised; and providing feedback about this experience is welcome but will not change how or when a score becomes available (score availability depends only on verified source data, not on user feedback volume).

## 27. Recommended copy set

Consolidated from Sections 11-17, for convenience — this is a recommendation only and is not implemented by this gate:

| Surface | Copy |
|---|---|
| Ballot card label | "Match unavailable" |
| Ballot card helper | "Not enough verified position data yet." |
| Ballot card accessible explanation | "CivicMarket has not calculated a match score for this candidate because approved source-backed position data is not yet available." |
| Candidate profile heading | "Why is this locked?" |
| Candidate profile body | "CivicMarket does not yet have enough verified, source-backed position data to calculate a reliable match score for this candidate. The lock is not a rating and does not mean the candidate is a poor match." |
| Calculating screen heading | "Your Civic DNA is ready" |
| Calculating screen body | "We saved your Civic DNA. Match scores will appear only for candidates with enough verified position data. Some candidate rings may stay locked during the Internal Beta." |
| Calculating screen CTA | "View my ballot" |

## 28. Alternate copy options

Provided so a future implementation gate has a choice rather than a single locked phrasing:

| Surface | Alternate 1 | Alternate 2 |
|---|---|---|
| Ballot card label | "Score unavailable" | "Not yet scored" |
| Ballot card helper | "Verified position data isn't available yet." | "Waiting on verified source data." |
| Candidate profile heading | "No match score yet" | "About this candidate's match score" |
| Candidate profile body | "We only show a match score when we have enough verified, source-backed evidence. This candidate doesn't have that yet — this isn't a rating." | "CivicMarket requires verified, source-backed evidence before showing a match score. This candidate's ring is locked because that evidence isn't available yet, not because of anything about the candidate." |
| Calculating screen heading | "Your answers are saved" | "Civic DNA complete" |
| Calculating screen body | "Match scores only appear once we have enough verified data about a candidate. Some rings may stay locked for now." | "We've saved your Civic DNA. Some candidates may not have a match score yet — that depends on available verified data, not your answers." |

## 29. Placement matrix

| Surface | Primary message | Secondary message | Max length | Interaction | Link included | Accessibility requirement | Before beta or deferred |
|---|---|---|---|---|---|---|---|
| Ballot candidate card | "Match unavailable" | "Not enough verified position data yet." | ~8 words / ~40 characters | Static text + existing locked ring icon | No (icon/ring only) | `aria-label` on ring; helper text as visible text, not tooltip-only | Must-have before beta |
| Candidate profile header | "Why is this locked?" | Full explanation (Section 12) | ~2 sentences | Static text, always visible when locked | Optional link to Data Sources | Visible text, not color-only | Must-have before beta |
| Candidate profile methodology section | N/A (covered by header text above) | N/A | N/A | N/A | Link to `/data-sources` | Keyboard-reachable link | Must-have before beta |
| Onboarding calculating screen | "Your Civic DNA is ready" | "Match scores will appear only for candidates with enough verified position data..." | ~2 sentences | Static text, then auto-route to `/ballot` | No | Text must not rely on animation alone | Must-have before beta |
| Civic DNA completion state | Same as calculating screen | N/A | N/A | N/A | N/A | N/A | Must-have before beta |
| Profile Civic DNA area | No change recommended (Section 15) | N/A | N/A | N/A | N/A | N/A | N/A — already correct |
| Data Sources page | Existing "Civic DNA scoring" section, corrected per Section 16 | Existing "Beta disclaimer" section, extended | ~3-4 sentences | Static section | N/A (is the link target) | Standard section, no special requirement beyond existing page | Must-have before beta |
| Help or FAQ | Question/answer set (Section 17) | N/A | N/A | Expandable/accordion | N/A | Keyboard-expandable, not hover-only | Enhancement |
| Corrections / Report Inaccuracy page | No locked-ring-specific content recommended | N/A | N/A | N/A | N/A | N/A | Not applicable — this page addresses factual errors, not data-availability state |

## 30. Testing plan

### Test 1: Content review
- Review every proposed phrase (Sections 8, 11-17, 27-28) for neutrality.
- Confirm no candidate blame.
- Confirm no implication of zero or poor match.
- Confirm no unsupported timeline.

### Test 2: Reading-level review
- Check sixth-grade reading level where practical for primary UI copy.
- Replace technical terms in primary UI copy.
- Preserve detailed methodology language only on the Data Sources page.

### Test 3: Candidate fairness review
- Apply identical copy to all four candidates.
- Confirm no candidate-specific source gap (Section 22) appears in ballot-card messaging.

### Test 4: State distinction review
Test each of the following and confirm each has distinct wording and styling:
- User has not taken Civic DNA.
- User completed Civic DNA but candidate position data is unavailable.
- Candidate has valid match-score data.
- Database query fails.
- Network request fails.

### Test 5: Mobile UI review
- 390px width.
- No clipping.
- No horizontal scroll.
- Candidate card remains readable.
- Locked explanation does not overpower primary content.

### Test 6: Accessibility review
- Keyboard navigation.
- Screen-reader label.
- Visible text.
- Color-independent meaning.
- 200% zoom.
- Touch target review.

### Test 7: Live Internal Beta smoke test (after future implementation)
- Complete Civic DNA.
- Confirm calculating screen reports success.
- Confirm all current candidate cards remain visible.
- Confirm locked rings show the approved explanation.
- Confirm no candidate displays zero.
- Confirm no retry or quiz-retake prompt appears solely due to missing candidate-position data (this directly re-tests the Section 12 gap).
- Confirm actual errors still show the separate error state.

## 31. Implementation boundaries

A future, separately approved implementation gate may review changes to:
- `src/components/ui/MatchScoreRing.tsx`
- `src/app/ballot/page.tsx`
- `src/app/candidates/[id]/page.tsx`
- `src/app/onboarding/calculating/page.tsx`
- `src/app/data-sources/page.tsx`
- Possibly a new Help or FAQ component/page

No implementation is approved by Gate I14.

This gate does not propose changes to: `candidate_positions`, `match_scores`, `voting_records`, `compute-match-scores` logic, Civic DNA scoring, schema, RLS, or County Commission logic.

## 32. Risks and mitigations

| Risk | Mitigation |
|---|---|
| A future implementer reuses the existing "Take the Civic DNA quiz to unlock..." prompt for an already-onboarded user (the Section 12 gap) | Section 18 and Section 24 explicitly require the candidate-position-unavailable state to never reuse Civic-DNA-missing wording; Test 4 and Test 7 (Section 30) specifically re-test this |
| Locked-ring copy drifts into implying one candidate is more transparent than another | Section 22's fairness requirements are explicit and testable (Test 3) |
| Data Sources page's outdated "public statements/funding patterns" wording (Section 16) is left uncorrected indefinitely | Flagged explicitly as an accuracy gap for the next implementation gate, not silently carried forward as if still accurate |
| A future implementer promises an unlock date under UX pressure | Section 9 and Section 17 explicitly prohibit "Coming soon" without an approved timeline, and Section 26 states no date may be promised |
| Locked-ring explanation text overwhelms the mobile ballot card | Section 20's mobile requirements cap message length and require the candidate name/office to remain more prominent |

## 33. Rollback plan

Because this gate makes no code or data change, there is nothing to roll back for this gate itself. For a future implementation: since all recommended copy in this plan is presentational (static text, `aria-label` values, and one Data Sources section correction) with no schema, database, or state change involved, rollback of a future implementation is a standard code revert of the specific component/page files listed in Section 31 — no data migration or cleanup is required in any case.

## 34. Recommended next gate

Recommend a separate, documentation-only **Gate I15: Locked-Ring Communication Implementation Plan.**

Gate I15 should:
- Inspect the exact current components listed in Section 31 at the file/line level.
- Identify exact file-level wording changes, including the specific fix for the Section 12 candidate-profile state-conflation gap.
- Define reusable copy constants or component props if appropriate.
- Define no-change boundaries (matching Section 31's restated boundaries).
- Include a mobile and accessibility test matrix building on Section 30.
- Remain documentation-only before any source-code change.

Do not implement Gate I15 now.

## 35. Risk check

**Scope:** One new documentation file only.

**Expected result:** A neutral, accessible, mobile-safe communication plan for explaining locked candidate match rings during Internal Beta, including one specific, confirmed existing UI gap (Section 12) for a future implementation gate to fix.

**No-change boundary:**
- No candidate scoring
- No candidate ranking
- No candidate recommendations
- No `candidate_positions` writes
- No `match_scores` writes
- No `voting_records` writes
- No Supabase writes
- No Claude or Anthropic API calls
- No source-code changes
- No PowerShell changes
- No schema changes
- No new tables
- No seeds
- No migrations
- No CSV changes
- No RLS changes
- No grant changes
- No environment changes
- No `user_districts` changes
- No County Commission changes
- `ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE` remains `false`
- No At-Large changes
- No deployment

**Test:** Build should pass. Git status should show only this new Gate I14 documentation file before commit.

## County Commission hard stops

All existing County Commission safeguards remain unchanged and were not touched by this gate:

- `ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE` remains `false`.
- The write guard was not enabled.
- No County Commission writes were run.
- No County Commission District 1-5 `user_districts` rows were created or modified.
- No ZIP-only District 1-5 assignment was made.
- At-Large membership was not used to infer District 1-5.
- The At-Large row was not renamed, deleted, replaced, or repurposed.
- The all-five County Commission At-Large expansion was not restored.
- No deployment occurred.

## Secret protection

No `.env`, `.env.local`, `.env.*`, or secret-named file (containing `secret`, `password`, `token`, `key`, `credentials`, or `api` in its filename) was inspected, displayed, or searched during this gate. No API key, service-role key, Supabase password, or Anthropic credential was inspected or displayed. No broad recursive search that could include secret files was run — all repository file reads in this gate targeted single, explicitly named, non-secret files (`CLAUDE.md`, `CIVICMARKET_CURRENT_STATE.md`, the named gate documents, and the six named component/page files listed in the gate instructions).

## 36. No-change confirmation

This gate made no changes to: `candidates`, `voting_records`, `candidate_positions`, `match_scores`, `civic_dna`, `civic_dna_answers`, `user_districts`, `districts`, `current_officials`, `officials_for_user`, `src/lib/officials.ts`, `CurrentOfficialsSection`, `compute-match-scores`, `MatchScoreRing`, the ballot page, the candidate profile page, the onboarding calculating page, the Data Sources page, schema, tables, seeds, migrations, CSV files, RLS, grants, source code, PowerShell scripts, API keys, environment variables, the County Commission write guard, the At-Large row, or deployment state.

No candidate was scored. No candidate was ranked. No political recommendation was produced. No Supabase write was performed. No Claude or Anthropic API call was made. `ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE` remains `false`. No County Commission District 1-5 write was performed. No deployment occurred. Exactly one new file was created: `docs/internal_beta_gate_i14_locked_ring_communication_plan.md`. `CIVICMARKET_CURRENT_STATE.md` was not modified by this gate.
