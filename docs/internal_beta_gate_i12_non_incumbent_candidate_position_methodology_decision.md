# Internal Beta — Gate I12: Non-Incumbent Candidate-Position Methodology Decision

## 1. Date and timestamp

Date: 08-05-2026
Timestamp: 11:23 pm EST

This document is documentation and planning only. It does not write to `candidates`, `voting_records`, `candidate_positions`, `match_scores`, `civic_dna`, `civic_dna_answers`, `user_districts`, `districts`, `current_officials`, or any other table. It does not call the Anthropic API. It does not change source code, PowerShell scripts, schema, seeds, migrations, CSVs, RLS, grants, or environment variables. It does not deploy.

## 2. Current repository baseline

- Local path: `J:\CivicMarket`
- Branch: `master`
- Working tree clean, up to date with `origin/master`
- Latest pushed commit: `cdff013` Update current state for Gate I11 and session automation
- Previous pushed commits:
  - `1422b5e` Add session start automation plan
  - `cb49846` Add Gate I11 candidate positions and match-score readiness plan

## 3. Gate status

Complete. Documentation-only. No database write, API call, secret change, County Commission change, or deployment occurred.

## 4. Gate purpose

Gate I11 confirmed that `candidate_positions` has zero rows system-wide, that this is a pure data-availability gap (not a code defect), and that the recommended default (Option A, verified voting-record-derived positions) currently has no eligible input for any of the four real PSL District 1 candidates because all four are non-incumbents with no official Council vote history. Gate I11 explicitly deferred the question of whether and how non-incumbent candidates could ever get a source-backed `candidate_positions` row through a non-voting-record path, and named that deferred question Gate I12. This document is that decision. It defines whether CivicMarket may create candidate-position data for non-incumbent candidates who lack official voting records, and if so, under what methodology — without implementing, scoring, or writing any of it.

## 5. Scope

In scope:
- Compare campaign-statement-derived and voting-record-derived methodologies without implementing any of them.
- Define source standards, provenance requirements, prohibited inference, dimension-mapping rules, and Claude's limited assistive role for any future campaign-derived methodology.
- Evaluate six methodology options (A-F) against fairness, auditability, consistency, and CivicMarket's non-partisan model.
- Recommend one Internal Beta decision.
- Define a staged, non-write testing plan for a future, separately approved gate.
- Restate all County Commission and no-write/no-deploy hard stops.

Out of scope:
- Any actual write to `candidates`, `voting_records`, `candidate_positions`, `match_scores`, or any other table.
- Any Claude API call.
- Any source code, PowerShell, schema, seed, CSV, RLS, grant, or environment-variable change.
- Designing or creating a new provenance/evidence table (Section 20 evaluates the need only).
- Any specific candidate's specific position value.

## 6. Problem statement

CivicMarket's match-ring feature depends entirely on `candidate_positions` rows, which today can only be produced by `recompute_candidate_positions(candidate_id)` averaging scored `voting_records`. The four real PSL District 1 candidates (Eric Reikenis, Indony Baptiste, Kevin Zimmerman, Fredric Meltzer) are confirmed non-incumbents with no official Council vote history, so under the current schema and the current Gate I11-recommended default, none of them can ever receive a `candidate_positions` row through voting-record derivation alone — not now, and not later, unless one of them eventually takes office. Internal Beta needs a clear, documented, non-partisan-consistent decision on whether match rings simply stay locked for candidates in this situation, or whether a separate, source-backed, campaign-derived methodology may be defined and later separately approved to cover them.

## 7. Confirmed current data limitation

- `candidate_positions` has zero rows system-wide (Gate I10B, Section 9; re-confirmed by Gate I11, Section 6).
- `voting_records_real.csv` is intentionally header-only (`data/real-psl-replacement/README.md`).
- All four real PSL District 1 candidates are non-incumbents with no verified Council vote history (`CIVICMARKET_CURRENT_STATE.md`; Gate I11, Section 23).
- No real PSL ballot measures currently exist, so this gate addresses candidate coverage only, not measure coverage.

## 8. Why voting-record-derived positions do not currently solve non-incumbent coverage

`recompute_candidate_positions` (`Reference Files/civicmarket_schema_v4.sql`, lines 573-631) derives every `candidate_positions` dimension value exclusively from that candidate's own `voting_records` rows with a non-null `ai_draft_score` or `community_score_final`. A candidate who has never held elected office structurally cannot have an official government voting record. Under Option A alone (Gate I11's recommended default), such a candidate has no eligible input, ever — this is not a timing gap that resolves itself with more data entry, it is a structural mismatch between the schema's only current input source and the real category of candidate CivicMarket is currently covering (first-time, non-incumbent local candidates). Gate I11 explicitly acknowledged this (Section 23) and deferred the question to this gate rather than proposing a code or schema fix.

## 9. Existing locked-ring fallback

`POST /api/compute-match-scores` (`src/app/api/compute-match-scores/route.ts`, lines 97-115, read directly for this gate) skips any candidate with no `candidate_positions` row, or with a row where every dimension is null, and produces no `match_scores` row for that candidate — the ring renders locked, and the candidate remains fully visible everywhere else (ballot, candidate profile, funding, report-inaccuracy link). This is the current, shipped, correct behavior for every candidate today, confirmed unchanged by Gate I11 and unchanged by this gate. It requires no new code, no new schema, and no new data to remain in effect. It is evaluated below as Option A.

## 10. Source categories evaluated

Six methodology options were evaluated: keeping rings locked (no new source category); verified candidate questionnaires; official campaign websites and direct policy statements; structured candidate-submitted CivicMarket responses; public interviews, debates, and recorded forums; and a mixed source-backed methodology combining approved first-party categories. Each is evaluated below on the same axes: source availability, provenance strength, subjectivity risk, administrative burden, fairness across all four candidates, and consistency with CivicMarket's existing non-partisan, source-linked, auditable model.

## 11. Methodology Option A: Keep rings locked

No `candidate_positions` row is created for any non-incumbent candidate lacking voting-record evidence. The candidate remains fully visible on the ballot, in candidate profiles, and in funding data; only the `MatchScoreRing` stays locked. This is the current, shipped behavior (Section 9) and requires zero new work, zero new source standards, and zero new risk surface.

**Assessment:** Safest possible default. Introduces no provenance, fairness, or consistency risk, because it introduces no new data at all. Its only cost is that Internal Beta users see locked rings for all four current District 1 candidates for as long as this option remains the sole methodology in effect. Evaluated as the safest default, consistent with `CLAUDE.md`'s explicit statement that "Locked match rings are expected while candidate_positions and verified voting records are unavailable... This is a data availability limit, not an app bug."

## 12. Methodology Option B: Verified candidate questionnaires

A questionnaire — either a publicly accessible third-party civic questionnaire (e.g., League of Women Voters, a local newspaper's candidate survey) or a CivicMarket-authored questionnaire directly submitted by the candidate — would be used as position evidence. Required provenance per response: exact question text, exact answer text, response date, candidate identity confirmation, and either a source URL (for a public questionnaire) or a retained submission record (for a direct submission).

Translating a questionnaire answer into one or more of the seven locked dimension values would require an approved rubric mapping specific question types to specific dimensions — a questionnaire's finance question might map cleanly to `taxation_spending`, but many questionnaire questions do not map cleanly to exactly one locked dimension and some may not map to any. That rubric does not exist today and would need its own approval before any use (Section 18, Section 21). Unanswered questions must not be scored (Section 21's silence rule); ambiguous responses (e.g., "it depends," a partial answer, a non-committal answer) must remain unscored for that dimension rather than interpreted.

**Assessment:** Reasonably strong provenance if the questionnaire is a known, fixed, publicly verifiable instrument (all candidates answered the identical questions at the identical time), but availability is uneven — not every candidate necessarily completes every third-party questionnaire, and a CivicMarket-authored version does not exist yet and would itself require Option D's administrative build-out to create. Feasible only as a future pilot, not immediately available today for all four candidates without first confirming a consistent instrument exists for each.

## 13. Methodology Option C: Campaign websites and direct policy statements

Only direct, first-party statements published by the candidate's own campaign (a policy page, an issues page, a direct quote attributed to the candidate) would be used — never endorsements, party affiliation, donor profile, biography, or general campaign branding, all of which are explicitly prohibited as position evidence regardless of methodology (Section 17). Required provenance: exact page URL, the quoted or neutrally summarized statement, the access date, and candidate-identity confirmation (the statement must be attributable to the candidate directly, not a surrogate or staff member without attribution).

Statements that are vague ("I support smart growth"), purely promotional ("I'll fight for you"), outdated, or later removed from the site present real risk: a vague statement does not support a confident dimension score and must remain unscored rather than loosely interpreted; an outdated or removed statement requires the access-date and archival-evidence requirements in Section 19 so a position can be defended even after the source page changes; a statement removed after being used as evidence requires the correction/staleness handling in Section 26.

**Assessment:** Highest availability among first-party public sources (most candidates maintain some form of campaign website), but also the highest subjectivity risk of the source-backed options, because campaign website language is written to persuade, not to answer a structured question — meaningful, scoreable statements may be rare on any single page, and consistent availability across all four candidates is not guaranteed without individually reviewing each site.

## 14. Methodology Option D: Structured candidate-submitted CivicMarket responses

CivicMarket would author one identical, fixed set of questions — ideally mapped one-to-one or few-to-one against the seven locked dimensions — and send them to every candidate in a race. Responses would be stored with a timestamp and provenance record (submission channel, submission date, candidate-identity verification). Non-response by a candidate must not be scored as neutral (`0`) or as opposed — Section 21's silence rule applies here specifically: a candidate who does not respond simply has that dimension remain `NULL`, identical to how an unscored `voting_records` dimension remains `NULL` today. Candidate-submitted responses must be visibly labeled in the UI as candidate-submitted, distinct from voting-record-derived or third-party-sourced positions (Section 28).

Administrative and security requirements: a channel to reach all four candidates (or their campaigns) consistently and fairly; a verification step to confirm a response actually came from the candidate or an authorized campaign representative, not an impersonator; a fixed submission deadline applied identically to all candidates so no candidate is disadvantaged by CivicMarket's own outreach timing; and a defined, published process so a losing or excluded candidate cannot later claim selective treatment.

**Assessment:** Strongest available fairness and consistency profile among the campaign-derived options, because CivicMarket controls the exact question set and can apply it identically to every candidate in a race — this directly addresses the fairness requirement in Section 30. Highest administrative burden and requires new outreach/verification workflow, none of which exists today.

## 15. Methodology Option E: Interviews, debates, and public forums

Only official recordings, published transcripts, or reputable full-context recordings (e.g., a recorded candidate forum hosted by a civic organization) would be used — never third-party-edited clips or paraphrased summaries. Required provenance: exact timestamp or transcript location, recording/transcript source, and date. Isolated clips and third-party written summaries of what a candidate "said" are explicitly excluded, because they strip the original context and introduce an intermediary's editorial judgment between the candidate's actual words and the evidence CivicMarket would score.

Transcription accuracy and ambiguous verbal answers present real risk: spoken answers are less precise than written ones, cross-talk or interruption can obscure a full answer, and a verbal answer that sounds committal in the moment may not hold up as a clear, quotable, scoreable statement once transcribed. Any use of this category would require the same neutral-summary and confidence-labeling discipline as Option C, applied with extra caution given the added transcription-accuracy risk.

**Assessment:** Availability is the weakest and least predictable of the five source-backed options — not every candidate necessarily participates in a recorded forum, and forum topics are not guaranteed to touch all seven locked dimensions. Best treated, if ever approved, as a supplementary source within a mixed methodology (Option F) rather than a standalone primary source.

## 16. Methodology Option F: Mixed source-backed methodology

Combining two or more of Options B, C, D, and E for the same candidate or across candidates in the same race raises questions this gate must resolve before any mixed approach could be approved:

- **Conflict resolution:** if a campaign website statement and a questionnaire answer point to different positions on the same dimension, no automatic resolution rule exists today (unlike `recompute_candidate_positions`'s existing `COALESCE(community_score_final, ai_draft_score)` priority for voting records) — a future methodology would need to define one explicitly, or refuse to combine conflicting statements into a single dimension value.
- **Weighting:** no basis exists today to weight a questionnaire answer against a campaign-website statement; inventing a weighting scheme without a defined rationale risks appearing arbitrary and undermining the non-partisan, auditable model.
- **Minimum evidence:** whether one single first-party statement is sufficient to populate a dimension, or whether corroboration from a second independent source should be required, is undecided.
- **Partial dimension creation:** consistent with Section 21, one source may populate one dimension without populating all seven — this applies identically whether the source is a voting record or a campaign statement.
- **Silent mixing is prohibited:** any candidate-position value derived from more than one source type must visibly disclose which source types contributed to it; Section 28 requires this to remain UI-visible, not just recorded in the database.

**Assessment:** Not evaluated as ready for adoption in Internal Beta. A mixed methodology multiplies the undecided-rule surface (conflict resolution, weighting, minimum evidence) beyond what a single-source-type pilot would require, and each undecided rule is itself a fairness and auditability risk. If any campaign-derived methodology is approved at all, Section 34 recommends starting with exactly one source type applied identically to all four candidates, not a mixed methodology, precisely to avoid the open questions in this section.

## 17. Rejected sources and prohibited inference

The following are explicitly prohibited as standalone candidate-position evidence, under any methodology, present or future:

- Party registration or party endorsement
- Donor or PAC identity
- Candidate biography
- Occupation
- Religion
- Race or ethnicity
- Neighborhood or home address
- Social-media likes or follows
- Third-party ideological ratings
- News headlines without full source context
- Opponent claims
- Anonymous posts
- AI-generated summaries without retained source evidence
- General campaign slogans
- Silence or non-response
- Assumptions based on incumbency or office sought

No dimension value may be inferred from any of the above, regardless of which methodology option is eventually approved. This list applies in addition to, not instead of, each option's own source-specific exclusions (e.g., Option C's exclusion of endorsements and biography from campaign websites specifically).

## 18. Required source standards

For any approved campaign-derived position evidence, the following must be recorded before the evidence may be used:

- Exact candidate identity
- Exact source type (questionnaire, campaign website, candidate-submitted response, interview/forum)
- Direct first-party statement or verified candidate response
- Source URL or retained submission record
- Publication or submission date
- Access date
- Full relevant context (not an isolated fragment)
- Exact Civic DNA dimension the statement supports
- Neutral summary
- Original text preserved where legally and operationally appropriate
- Reviewer identity or review record
- Scoring rationale
- Confidence level
- Methodology version
- Correction history
- No inference from party affiliation, endorsements, donor identity, demographic information, religion, occupation, or personal associations

This list mirrors, and extends for the campaign-derived case, the voting-record source standard already established in Gate I11 Section 18 and `data/real-psl-replacement/README.md`'s source-ready checklist — the same discipline that governs `voting_records` today must govern any future campaign-derived evidence.

## 19. Provenance and audit-trail requirements

Every campaign-derived position value must be traceable, at any future point, back to: the exact statement, the exact source, the exact date it was accessed, who reviewed it, and what methodology version was in effect when it was scored. This is the same standard `voting_records`/`candidate_positions` already meets today through `source_url`, `ai_draft_generated_at`, `ai_draft_model`, and the community-score trigger chain (Gate I11, Section 13) — a campaign-derived methodology must not fall below that bar merely because the underlying source is less structured than a government record. Section 20 evaluates whether the current schema can hold this provenance or whether a new table is needed.

## 20. Dimension mapping requirements

Use only the seven locked dimensions: `growth_development`, `taxation_spending`, `education`, `environment`, `public_safety`, `housing`, `transparency`. A single approved statement may support one dimension without supporting all seven, exactly as a single scored voting record does today. Any future rubric mapping a source type (e.g., a questionnaire's specific question wording) to a specific dimension must itself be documented and versioned before use, so a later reviewer can see which rubric version produced a given mapping.

## 21. Neutral scoring requirements

Use only values from −2.0 through +2.0, matching the existing `candidate_positions` column range. The following rules apply to any future campaign-derived scoring, without exception:

- A source may support one dimension without supporting all seven; unsupported dimensions must remain `NULL`, never defaulted to `0`.
- Silence or non-response must never be scored as `0` — `0` on the existing dimension scale is a meaningful neutral position, not an absence-of-data marker, and conflating the two would misrepresent a candidate who simply did not answer as a candidate who deliberately holds a centrist position.
- Ambiguous statements must remain unscored rather than force-fit into a value.
- Multiple statements addressing the same dimension require an approved aggregation rule before combining them (Section 16's conflict-resolution and weighting gap applies here directly) — until such a rule is approved, only a single, clearest statement per dimension should be used.
- Every candidate-position value derived this way must retain its methodology and source provenance (Section 18-19), not just the final numeric value.

## 22. Claude-scoring role and limits

Claude may assist only after a specific methodology option is separately approved. When approved, Claude may: extract a candidate's explicit policy direction from a verified, retained source; map the statement to exactly one locked dimension per extraction; suggest a draft score within −2.0 to +2.0; and produce a neutral rationale explaining the mapping.

Claude must not: infer ideology beyond what the source explicitly states; fill unanswered dimensions; score based on party, donors, endorsements, demographics, or rhetorical tone; invent context not present in the retained source; replace human review; write directly to production data without a separate, approved workflow; or use any source that has not been retained and independently verified by a human reviewer first. This mirrors, without loosening, the Claude-role limits Gate I11 Section 19 already defined for voting-record scoring — the campaign-derived case does not get a lighter-touch AI role merely because the source is less structured.

Any Claude output under this future methodology must be treated as a draft, exactly like an `ai_draft_score` on a voting record today, until a human reviewer accepts it.

## 23. Human-review requirements

No campaign-derived score may be used for any candidate-facing or match-score-facing purpose without an identified human reviewer accepting it first — mirroring Gate I11 Section 19's requirement that Claude-generated `ai_draft_score` values receive human review before controlled use. The reviewer's identity or a review record must be retained as part of the evidence's provenance (Section 18).

## 24. Confidence and completeness indicators

The existing `data_completeness` tiers (`full` / `partial` / `pulse_only`, driven by `vote_count`, per Gate I11 Section 25) are specific to voting-record-derived data and do not directly describe campaign-derived evidence strength. Any future campaign-derived methodology needs its own confidence indicator — for example, distinguishing a single, brief campaign-website sentence from a fully answered, verified structured questionnaire response — so that a low-confidence, single-statement dimension value is not displayed with the same implied certainty as a five-vote, `full`-tier voting-record-derived dimension. Designing that indicator (schema field, UI treatment, and exact tiering rule) is not decided by this gate and is named as a candidate for a future implementation gate (Section 36).

## 25. Candidate-dispute and correction process

A candidate must be able to dispute a campaign-derived position attributed to them. At minimum, any future implementation needs: a visible way for a candidate (or verified campaign representative) to flag a specific dimension value as incorrect; a documented review path distinct from the general Report Inaccuracy flow (`/report`), since a candidate dispute concerns the candidate's own attributed position rather than a general factual error a resident might report; a correction record that preserves what the prior value was, why it changed, and when; and, if the dispute is upheld, a path to null out or revise only the disputed dimension without discarding the rest of that candidate's evidence. None of this exists today. This gate does not design the mechanism — it only establishes that no methodology may be approved for use without one.

## 26. Source-change and stale-data handling

A campaign website statement can change or disappear after it has been used as evidence. Any future methodology must require: the access-date already specified in Section 18; a periodic (not automatic/unsupervised) re-check of standing campaign-derived evidence, especially close to an election date; and a defined behavior when a source is found to have changed or been removed — at minimum, flagging the affected dimension for re-review rather than silently continuing to display a score whose original source no longer exists or no longer says what it said when scored. This gate does not define the re-check cadence or ownership; it only establishes that stale-source drift is a real risk that must be assigned an owner and a process before any campaign-derived methodology goes live.

## 27. Mixing campaign-derived and voting-record-derived positions

For a candidate who is currently a non-incumbent but later takes office and begins accumulating a real voting record (or a sitting official who also has campaign statements on file for a prior or current race), the same `candidate_positions` row would need to represent both source types for different dimensions, or even the same dimension over time. This gate requires: any dimension value must disclose whether it is voting-record-derived or campaign-derived at the point of display (Section 28); a voting-record-derived value, once it exists for a dimension, should be treated as stronger evidence than a campaign-derived value for that same dimension (a government vote is a verified action; a campaign statement is a stated intention) — a future methodology decision would need to define this precedence explicitly, rather than averaging a verified vote together with a stated intention as if they carried equal evidentiary weight; and this precedence rule, once defined, must be applied consistently, not case-by-case. This gate recommends transparency over artificial completeness: it is better to show two separately labeled values, or to let a stronger source supersede a weaker one with disclosure, than to silently blend them into one undifferentiated number.

## 28. Labeling requirements in the UI

If any campaign-derived methodology is ever approved and implemented, the UI must, at minimum: visibly distinguish a campaign-derived dimension value from a voting-record-derived one (e.g., a distinct badge or label, not just a database field invisible to the user); continue to show a fully locked ring, exactly as today, for any candidate with no evidence at all under any methodology; and never imply a level of certainty the underlying evidence does not support (e.g., a single campaign-website sentence should not visually present with the same confidence as a five-vote `full`-tier record). This is a requirement on any future implementation, not something this gate builds.

## 29. Coverage implications

Under Option A alone (current state), all four real District 1 candidates remain locked indefinitely, since none can ever produce a voting record before an election in which they are non-incumbents. Under any approved campaign-derived option (B through F), coverage becomes possible but is bounded by real-world source availability — Test 1 (Section 32) is required specifically to determine, before any commitment, whether the same source type is actually available for all four candidates today. Approving a methodology in the abstract does not guarantee any candidate will actually meet its bar.

## 30. Fairness and consistency risks

The central fairness risk is asymmetric coverage: if a campaign-derived methodology can be satisfied for two of the four candidates but not the other two (e.g., two candidates maintain detailed policy pages and two do not), those two candidates would show at least partially unlocked rings while their opponents remain fully locked — a direct, visible difference in data completeness driven by campaign resourcing or communication choices rather than by CivicMarket's own even-handed treatment. This risk is highest for Option C (campaign websites, uneven by nature) and lowest for Option D (CivicMarket controls outreach and applies it identically), which is why Section 34 favors Option D, if any campaign-derived option is piloted at all, over Option C or E as a starting point.

## 31. Security and authorization considerations

Any future campaign-derived evidence-collection or scoring workflow must follow the same patterns already established elsewhere in this project: server-side-only Claude API calls, never exposing the Anthropic key to the browser (`compute-match-scores` and `set-county-commission-district` routes as the existing pattern); admin-gated write paths (`profiles.is_admin = true`, checked server-side, mirroring `src/app/admin/entry/page.tsx`); no client-writable RLS grant on `candidate_positions` (currently `SELECT`-only, per Gate I11 Section 26 — this must not be loosened); and, if a future candidate-facing submission channel (Option D) is built, its own authentication/verification design to confirm a submission genuinely came from the candidate or an authorized campaign representative, which does not exist today and is not designed by this gate.

## 32. Testing plan

### Test 1: Source availability inventory
- Review all four candidates.
- Record, for each, whether the same single approved source type (whichever option is piloted) is actually available.
- No scoring. No writes.

### Test 2: Rubric validation
- Use sample statements outside production data.
- At least two human reviewers independently map dimension and score for the same sample statements.
- Compare results.
- Stop and revise the rubric if reviewers materially disagree.

### Test 3: One-candidate dry run
- One candidate, one source, one dimension.
- Produce a draft score only.
- No database write.
- Verify provenance and rationale are complete per Section 18.

### Test 4: Cross-candidate consistency test
- Apply the identical rubric to all four candidates.
- Confirm identical standards were applied to each.
- Confirm non-response did not create a score for any candidate.
- Confirm unsupported dimensions remain `NULL` for every candidate.

### Test 5: Candidate review and correction test
- Simulate a candidate dispute against a draft value.
- Verify the source, rationale, reviewer record, correction path, and resulting UI label all function as designed.

### Test 6: Controlled data-write test
- Requires its own, separate, explicit approval — not granted by this gate.
- Test account or staging context only.
- Verify no direct production write occurs without an approved schema (if a new provenance table is needed, per Section 20) and a defined rollback plan.

### Test 7: UI labeling test
- Confirm campaign-derived positions are visibly labeled differently from voting-record-derived positions.
- Confirm dimensions with no evidence under any methodology remain visibly locked/unavailable.
- Confirm no display implies more certainty than the underlying evidence supports.

## 33. Rollback and correction plan

Because this gate makes no write of any kind, there is no data-level rollback required for this gate itself. For any future implementation: correcting a wrong campaign-derived dimension value should follow the same pattern already established for voting-record-derived values (Gate I11 Section 28) — correct the underlying evidence record, then re-derive the `candidate_positions` value, rather than editing the `candidate_positions` row directly, preserving the same audit-trail discipline. If a new provenance/evidence table is ever created (Section 20), its own rollback plan (how to revert a bad evidence row without silently changing a live, displayed score) must be defined as part of that future schema-approval gate — not assumed to be automatic.

## 34. Recommended Internal Beta decision

**Recommendation: Option 1 — keep all four current non-incumbent candidate match rings locked during Internal Beta.**

This gate does not recommend approving Option 2 (a narrowly defined pilot methodology) at this time. Reasoning, weighed against the required factors:

- **Fairness across all four candidates:** unconfirmed. Test 1 (source-availability inventory) has not been run; without it, there is no evidence that any single source type is currently, consistently available for all four candidates. Approving a pilot before that inventory exists risks exactly the asymmetric-coverage problem described in Section 30.
- **Source availability:** unconfirmed for the same reason.
- **Consistency:** cannot be guaranteed yet — no rubric (Section 12), aggregation rule (Section 16), or precedence rule (Section 27) has been defined or validated (Test 2 has not been run).
- **Auditability:** the current schema (Section 20) has no dedicated field for source type, methodology version, or reviewer record on `candidate_positions` itself — a provenance gap that a pilot should not proceed past without a resolution.
- **Candidate corrections:** no dispute/correction mechanism exists today (Section 25); this must exist before any candidate-facing campaign-derived value is shown, not be retrofitted after.
- **UI labeling:** no distinct visual treatment for campaign-derived vs. voting-record-derived values exists today (Section 28); showing an unlabeled campaign-derived score would be a regression from CivicMarket's current, honest "locked ring means no evidence yet" signal.
- **Schema limitations:** Section 20's provenance gap is unresolved.
- **Limited time before beta:** building the missing pieces above (rubric, dispute process, UI labeling, provenance approach) for even the narrowest pilot is nontrivial new work, not a documentation-only next step.
- **Risk of presenting campaign claims as equivalent to governing history:** this is the highest-weight factor. A verified government vote and a campaign-website sentence are not equivalent evidence, and Internal Beta — a small, invite-only, trust-building phase — is the wrong place to risk that equivalence appearing to users, even unintentionally, before every safeguard in this document (rubric, provenance, labeling, dispute process) is actually built and tested.

Consistent with this gate's own instruction, this recommendation defaults to locked rings: the same structured, source-backed methodology is not yet offered consistently to all four candidates, has not been separately approved, and has not had its supporting mechanisms (rubric, labeling, dispute process, provenance) built. If a future gate wants to pursue Option 2, Section 32's Test 1 (source availability inventory) is the correct, safe, documentation/read-only first step — not a direct jump to scoring or writing.

## 35. Deferred enhancements

- Any specific campaign-derived methodology implementation (Option B, C, D, E, or F) — not approved by this gate.
- A dedicated confidence/completeness indicator for campaign-derived evidence, distinct from `data_completeness` (Section 24).
- A candidate-dispute and correction workflow (Section 25).
- A new source/provenance evidence table, if a future methodology requires one beyond what `candidate_positions` itself can hold (Section 20).
- Precedence rules for mixing voting-record-derived and campaign-derived values on the same candidate (Section 27).
- UI labeling design for multiple evidence-source types (Section 28).

## 36. Recommended next gate

Recommend a separate, documentation-only **Gate I13: Non-incumbent source availability inventory.**

Gate I13 should perform Section 32's Test 1 only: for each of the four real PSL District 1 candidates, record (read-only, no scoring, no writes) whether a single, consistent, first-party source type — most likely Option C (campaign website) as the lowest-administrative-burden starting point, or Option D (structured CivicMarket questionnaire) if a fairness-first approach is preferred — is actually available today. Gate I13 should not select a final methodology, define a rubric, or write any data; it should only establish whether Option 2 in this gate's Section 34 recommendation is even factually reachable before any further methodology work is considered. Gate I13 is not implemented, decided, or started by this document.

## 37. Risk check

**Scope:** One new documentation file only.

**Expected result:** A clear Internal Beta decision — locked rings remain the default for all four non-incumbent District 1 candidates — together with a full comparative methodology framework preserved for future use if a source-availability inventory ever supports a pilot.

**No-change boundary:**
- No `candidate_positions` writes
- No `match_scores` writes
- No `voting_records` writes
- No Supabase writes
- No Claude API calls
- No application code changes
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

**Test:** Build should pass. Git status should show only this new Gate I12 documentation file before commit.

## 38. County Commission hard stops

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

## 39. No-change confirmation

This gate made no changes to: `candidates`, `voting_records`, `candidate_positions`, `match_scores`, `civic_dna`, `civic_dna_answers`, `user_districts`, `districts`, `current_officials`, `officials_for_user`, `src/lib/officials.ts`, `CurrentOfficialsSection`, schema, seeds, migrations, CSV files, RLS, grants, PowerShell scripts, API keys, environment variables, the County Commission write guard, the At-Large row, or deployment state. Exactly one new file was created: `docs/internal_beta_gate_i12_non_incumbent_candidate_position_methodology_decision.md`. `CIVICMARKET_CURRENT_STATE.md` was not modified by this gate.
