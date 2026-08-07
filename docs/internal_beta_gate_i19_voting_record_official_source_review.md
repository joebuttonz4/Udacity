# Internal Beta — Gate I19: Voting-Record Official Source Review and Beta-Blocker Decision

## 1. Date and timestamp

Date: 08-06-2026
Timestamp: 12:43 am EST

This document is read-only research, repository inspection, and planning only. It does not create, modify, insert, update, delete, or archive any `voting_records`, `candidate_positions`, `match_scores`, `candidates`, `civic_dna`, or `user_districts` row. It does not write to Supabase. It does not change source code, PowerShell scripts, schema, RLS, grants, seeds, migrations, or CSV files. It does not call the Anthropic API. It does not deploy.

## 2. Repository baseline

- Local path: `J:\CivicMarket`
- Branch: `master`
- Working tree clean, up to date with `origin/master`
- Latest pushed commit: `5b7b204` Update current state for Gate I18
- Previous pushed commits:
  - `24f7f1f` Add non-incumbent source availability recheck
  - `bada51f` Record Gate I17 live UI verification
  - `640a180` Update current state for Gate I16
  - `8d75978` Implement locked-ring communication states

## 3. Gate status

Complete. Read-only research, repository inspection, and planning only. No voting-record data, database write, source-code change, secret inspection, County Commission change, or deployment occurred.

## 4. Purpose

Determine exactly what remains blocked concerning "voting records with official source URLs" — the one remaining item under `CIVICMARKET_CURRENT_STATE.md`'s Immediate Priorities — and produce a precise inventory, evidence review, beta-safety classification, final outcome, and beta-blocker decision framework, without making any product-scope decision automatically.

## 5. Scope and exclusions

In scope: repository CSV/schema/code inspection; review of already-documented source-review decisions; a fresh, equal-standard evidence review of the same voting-item search space already identified in repository documentation; a beta-safety classification per row (of which there are currently zero); an outcome determination; a beta-blocker decision framework with options and risks.

Out of scope: inventing new voting records to fill gaps; any database write; any source-code change; any product-scope decision (this gate presents options, it does not choose one); reopening the locked-ring or non-incumbent-methodology workstreams (Gates I11-I18), which remain closed and unaffected.

## 6. Files and code paths inspected

- `CIVICMARKET_CURRENT_STATE.md` (Immediate Priorities, Hard Beta Blockers, Data Availability Limits sections)
- `Reference Files/CIVICMARKET_PATCH_MAY12.md` (Civic DNA dimension definitions and reversal logic — confirmed as the current source of truth, unrelated to voting-record content but read per instruction)
- `data/real-psl-replacement/voting_records_real.csv`
- `data/real-psl-replacement/candidates_real.csv`
- `data/real-psl-replacement/funding_real.csv`
- `data/real-psl-replacement/README.md`
- `data/real-psl-replacement/real_data_review_log.md`
- `data/real-psl-replacement/sources_inventory.csv`
- `scripts/validate-real-psl-csvs.cjs` (re-run live, read-only, in this gate)
- `scripts/import-real-psl-data.cjs` (inspected, not run)
- `Reference Files/civicmarket_schema_v4.sql` (`voting_records`, `candidate_positions`, `candidates` table definitions, `recompute_candidate_positions` function — already reviewed in detail by Gate I11 and re-confirmed here)
- `src/lib/candidates.ts` (`getCandidateVotingRecords`, `VotingRecord` type)
- `src/app/candidates/[id]/page.tsx` (Voting tab rendering, already directly observed live in Gate I17 showing "No voting records yet.")
- `src/app/admin/entry/page.tsx` (voting-record insert form)
- `src/app/admin/records/page.tsx` (voting-record review/removal list, per `CIVICMARKET_CURRENT_STATE.md`'s existing documentation)

No `.env`, `.env.local`, `.env.*`, or secret-named file was inspected. Searches were targeted to the specific named files above, not broad recursive sweeps.

## 7. Existing voting-record data inventory

**Zero rows exist in `voting_records_real.csv`.** The file was re-read directly in this gate: header row only (`candidate_name,office,issue_title,issue_description,bill_number,vote_date,vote_cast,dimension,source_url,ai_draft_score,ai_draft_rationale,ai_draft_model`), zero data rows. `scripts/validate-real-psl-csvs.cjs` was re-run live in this gate and confirmed: `voting_records: Rows: 0, Errors: 0, Warnings: 1 (header-only file, no real data rows yet)`. There is no per-record inventory to build because no record — real, placeholder, or otherwise — currently exists in the repository's voting-record source of truth.

## 8. Schema and field requirements

From `Reference Files/civicmarket_schema_v4.sql` (already documented in detail by Gate I11, Section 11-12, re-confirmed unchanged here): `voting_records` requires `candidate_id`, `issue_title`, `issue_description`, `vote_date`, `source_url` (all `NOT NULL`), `vote_cast` (`for|against|abstain`), `dimension` (one of the seven locked keys), with optional `bill_number`, `ai_draft_score`/`ai_draft_rationale`/`ai_draft_generated_at`/`ai_draft_model`, and community-scoring fields. `candidate_positions` is populated only by `recompute_candidate_positions(candidate_id)`, which averages `COALESCE(community_score_final, ai_draft_score)` per dimension across a candidate's `voting_records` rows with a non-null score. With zero `voting_records` rows, `recompute_candidate_positions` has no input for any of the four real candidates, and `candidate_positions` remains empty for them — exactly as independently confirmed live by Gate I10B's read-only database query and unchanged since.

## 9. Official-source evidence standard

Applied in this gate, matching the instruction and consistent with `data/real-psl-replacement/README.md`'s existing source-ready checklist: a voting record is beta-safe only when an official or authoritative source establishes the legislative body, exact meeting/item, exact date, exact official, exact vote (for/against/abstain/absent/recused), a publicly-accessible source URL a beta user can open, and the source is item-specific — not a bulk meeting calendar, agenda without a final vote, minutes without an individual roll call, news article, campaign page, social post, third-party database, or search-result snippet.

## 10. Repository CSV findings

- `voting_records_real.csv`: 0 rows, header-only, confirmed via direct read and via live validation-script run in this gate.
- `candidates_real.csv`: 11 rows — 4 City Council District 1 (Reikenis, Baptiste, Zimmerman, Meltzer, all `is_incumbent=false`), 4 Mayor (Shannon Martin `is_incumbent=true`, Eric Strazzeri, Steven Giordano, Steven Harrington, all `is_incumbent=false`), 3 City Council District 3 (Fritz Alexandre, Jim Norton, Peter Overhuls, all `is_incumbent=false`). This is a material fact for Section 20 below: Shannon Martin (Mayor) is the only `is_incumbent=true` row anywhere in the current candidate CSV, meaning she is the only candidate in the entire repository who could structurally have an official voting/governing record at all under CivicMarket's own logic (Gate I12's "non-incumbent" analysis applies to every other row).
- `funding_real.csv`: 4 rows — matches only the original four District 1 candidates; no Mayor or District 3 funding rows exist yet.
- `real_data_review_log.md` contains an already-formal, already-approved decision entry dated **2026-06-28, "PSL District 1 Voting Records No-Data Decision"**: `voting_records_real.csv` is deliberately left header-only because all four District 1 candidates are non-incumbents with no verified Council vote history, and the log explicitly states CivicMarket "should not create voting-record rows unless an official item-specific source confirms the candidate, item, date, description, and vote cast." This is not a new finding — it is a pre-existing, dated, reasoned decision this gate is re-confirming, not discovering.
- `sources_inventory.csv` lists four already-accepted-with-limits official voting-record source categories for Port St. Lucie City Council: the City's Agendas and Meetings page, PSL Legistar, PSL-TV20 Granicus meeting archive, and the City Clerk's Public Records Requests page — all accepted "with limits," explicitly requiring item-specific support for any actual row, and explicitly not accepted for candidate issue-position claims or unsupported summaries.

## 11. Database findings or read-only limitation

**BLOCKED for a fresh live query in this gate** — no approved read-only Supabase connection, MCP tool, or credential-free query workflow was available in this session, and per instruction this gate did not attempt to inspect or expose any credential, token, or connection string to obtain one.

Relying instead on strong, already-documented repository evidence: Gate I10B (07-09-2026) independently confirmed via a live, read-only, service-role query that `candidate_positions` returned **0 rows system-wide** — not just for the four District 1 candidates, but for every candidate in the database — and that `voting_records` had no rows tied to any of the four. Gate I11 re-confirmed this same finding. Separately, `scripts/import-real-psl-data.cjs` (inspected, not run, in this gate) explicitly prints `SKIP: voting_records (header-only, no real data yet)` and `SKIP: candidate_positions (depends on voting records)` whenever it runs, and its candidate-replacement logic relies on `ON DELETE CASCADE` from `candidates` to clear `voting_records`/`candidate_positions`/`match_scores` on any candidate replacement — meaning the live database's voting-record state for these candidates is structurally tied to, and should match, the CSV's zero-row state. This is treated as strong corroborating evidence, not as a live-verified fact for this specific gate — a future gate with read-only DB access should re-confirm directly before any decision that depends on the exact live count.

## 12. Per-record source review

Not applicable. There are zero existing voting-record rows — in the CSV or, per Section 11's evidence, in the live database — to review. Per this gate's explicit instruction, no new voting records were invented or searched for to fill this gap; the "public-source research" step below instead re-validates whether the already-documented no-data decision (Section 10) still holds, rather than fabricating a search for rows that do not exist.

## 13. Candidate and official identity checks

Not applicable to voting records specifically (no rows exist to check). For completeness: the four District 1 candidate names in `candidates_real.csv` match the names used throughout every prior gate (I10B through I18) exactly. Gate I18's unresolved Fredric Meltzer / Rick Meltzer identity question (campaign-source name vs. repository name) remains open but is a campaign-source identity question, not a voting-record question — it does not affect this gate's finding, since no voting record exists for Meltzer under either name.

## 14. Source URL quality checks

Not applicable — no `source_url` values exist in `voting_records_real.csv` to evaluate.

## 15. Individual-vote verification

Not applicable — no vote values exist to verify.

## 16. Placeholder and synthetic-data checks

None found. `scripts/validate-real-psl-csvs.cjs`'s placeholder-pattern check (matching `test`, `dummy`, `fake`, `sample`, `example`, `placeholder`, `tbd`, `john doe`, `jane doe`, `mock`, `todo`, `lorem`) was re-run live in this gate against all three CSVs and reported zero errors and only the expected header-only warning for `voting_records`. No placeholder or synthetic voting-record row exists anywhere in the repository.

## 17. Duplicate and mismatch checks

Not applicable — with zero rows, no duplicate, date mismatch, item mismatch, wrong-jurisdiction, wrong-election, or funding-as-voting-source issue can exist. This section exists to confirm that absence was checked for, not assumed.

## 18. Beta-safe rows

None. Zero rows exist to classify as beta-safe.

## 19. Beta-blocked rows

None, because none exist to be blocked — but the *absence itself* of any row is the operative blocking condition for the "voting records" feature area as a whole (Section 21-22).

## 20. Rows that may require future removal or archive approval

None. No placeholder, synthetic, duplicate, or materially false row exists to flag for future removal. (Not applicable — recorded per required section structure.)

## 21. Outcome

**Outcome A: No existing voting-record row is ready for beta display.**

This is trivially and unambiguously true, since zero voting-record rows currently exist anywhere in the repository's source of truth for real PSL data, and strong corroborating evidence indicates the live database matches. This is not a partial-completion state (Outcome B) or a ready-for-import state (Outcome C) — there is nothing to complete or import. The operative question this gate must therefore answer is not "which rows pass or fail," but "how should CivicMarket's UI and beta-launch decision handle a data category that is currently, deliberately, and validly empty."

## 22. Beta-blocker decision

- **Whether voting records remain a hard beta blocker:** Yes, per `CIVICMARKET_CURRENT_STATE.md`'s own "Hard beta blockers" section, which still lists "Voting records with official source URLs" as the sole remaining open item (all other listed blockers are marked complete with a checkmark). This gate does not change that status — it confirms the underlying reason is still valid and unchanged (all four current District 1 candidates remain non-incumbents with no verified Council vote history).
- **Whether the blocker applies to all voting records or only specific rows:** It applies to the entire feature area for the current candidate set, because there are no rows at all — not a mix of good and bad rows. It does not apply to Shannon Martin (Mayor, the sole incumbent in `candidates_real.csv`), who is not currently in beta scope in the same way (Section 10: Mayor/District 3 candidate rows exist in the CSV but their live-import status is unconfirmed by this gate — see the open question flagged there). No voting-record research was performed for Mayor/District 3 in this gate, since Section 5 explicitly scopes this gate to the same voting-item search space already identified in repository documentation, which to date covers City Council District 1 only.
- **Whether beta could launch with the voting-record section hidden or explicitly unavailable:** Technically yes — nothing in the current candidate-profile code structurally requires voting-record rows to exist; the Voting tab already renders a plain "No voting records yet." state today (directly observed live in Gate I17), which is functionally already an "unavailable" state, not a broken one.
- **Whether hiding that section would conflict with existing approved beta scope:** `CIVICMARKET_CURRENT_STATE.md`'s "Locked beta scope" section lists "Candidate profile" as an approved beta screen without specifying that a populated Voting tab is mandatory; it also explicitly lists "Minimal admin voting-record entry" and "Claude draft scoring, reviewed/validated before beta" as approved beta scope items, meaning the entry/scoring *mechanism* is approved for beta, not that voting-record *content* is required to exist before beta launch. This gate does not find an explicit scope conflict, but flags this as a product-scope question, not a code question, for the user to confirm (Section 23).
- **Whether candidate match scores remain locked regardless of this review:** Yes. This is unaffected by anything in this gate — match rings for the four current District 1 candidates are locked because `candidate_positions` is empty (Section 8), which is itself downstream of the same zero-voting-record state this gate re-confirms. Gates I11-I18 already exhaustively covered this; this gate changes nothing about it.
- **Whether any safe subset could be displayed without creating inconsistent candidate treatment:** No safe subset currently exists to display, since there are zero rows for any of the four current District 1 candidates. If Shannon Martin (Mayor, incumbent) were fully onboarded into beta scope with her own verified voting record in a future gate, displaying her record while the four District 1 candidates remain empty would not be "inconsistent" in the unsafe sense Gate I12/I14 warned about (that concern was about treating candidates *within the same race* unevenly) — but this gate does not investigate or authorize that scenario; it is out of scope here and would need its own future gate.

## 23. Safe product options

### Option 1: Keep voting records hidden
Do not display voting records until every shown row is officially verified. Lowest misinformation risk. Candidate match rings remain locked unless separate approved evidence exists. **Risk:** may read as an incomplete feature to Internal Beta testers if not clearly explained; **dependency:** none — this is close to the current default state already, since the Voting tab already shows only "No voting records yet." with zero populated rows.

### Option 2: Show only verified rows
Display only rows that pass the full official-source standard (Section 9). Requires clear rules preventing uneven or misleading candidate comparisons — directly relevant to Gate I12's fairness requirement (Section 30 of that document) and Gate I14's identical-treatment requirement. Must not imply that candidates without records have no voting history (a non-incumbent's empty voting tab must not read as "this candidate has never voted on anything," since it structurally cannot yet exist for them). **Risk:** currently has zero rows to show, so this option is not actionable today without new verified data; **dependency:** a future, separately approved item-specific source-verification gate, per this gate's evidence standard.

### Option 3: Show an unavailable-state explanation
Keep the section visible but explain that verified voting-record data is not yet available. No placeholder rows. No zero counts that imply no voting history. **Risk:** low, if worded carefully (the same locked-ring communication discipline from Gate I14-I16 — plain, neutral, non-blaming language — would need to be extended to this section); **dependency:** would benefit from, but does not strictly require, a small wording pass similar to Gate I14-I16's locked-ring communication work, scoped separately if pursued. This is closest to the Voting tab's actual current behavior ("No voting records yet."), which already avoids implying a zero or negative record.

### Option 4: Delay beta launch
Use only if voting records are mandatory for the approved beta experience and cannot safely be hidden or shown as unavailable. **Risk:** highest cost, and this gate found no evidence in `CIVICMARKET_CURRENT_STATE.md`'s locked beta scope that voting-record *content* (as opposed to the entry/scoring mechanism) is mandatory for launch; **dependency:** would require the user to explicitly state voting records are launch-mandatory, which has not been stated anywhere in the repository's documentation reviewed for this gate.

This gate does not select among these four options. That is a product-scope decision reserved for the user.

## 24. Risks and mitigations

| Risk | Mitigation |
|---|---|
| A future implementer treats the empty Voting tab as a bug and "fixes" it by fabricating data | This gate, and every prior gate back to `data/real-psl-replacement/README.md` and the 2026-06-28 review-log entry, explicitly documents this as an intentional, sourced decision, not a defect |
| Mayor/District 3 candidate rows in `candidates_real.csv` (Section 10) are assumed already live-imported without confirmation | Flagged explicitly in Section 10 and Section 22 as an open question this gate does not resolve; a future gate should confirm live-import status before making any Mayor/District-3-specific decision |
| A future scoring pass uses a non-item-specific bulk source (a meeting calendar, an agenda without a final vote) to satisfy the "let's just get something in" pressure | Section 9's evidence standard and Section 6's inspected `sources_inventory.csv` entries already explicitly reject exactly these source types |
| The four accepted-with-limits voting-record source categories (Legistar, Granicus, City agendas, public-records requests) are treated as sufficient on their own without an item-specific page | `real_data_review_log.md`'s own 2026-06-28 entry already states these sources require "item-specific official source support" for any actual row — this gate re-confirms, not loosens, that requirement |

## 25. Recommended next gate

Per Outcome A: **Gate I20 should be a beta-scope decision for hiding or marking voting records unavailable** — i.e., choosing among the four options in Section 23 (or an equivalent), not another source-research gate. This gate does not automatically create Gate I20 and does not implement any of the four options. The recommended framing for Gate I20, if the user proceeds: a short, documentation-first decision gate that (a) has the user select one of Section 23's options (or a variant), (b) if Option 2 or 3 is chosen, defines the exact wording needed (following the same discipline already established in Gates I14-I16), and (c) explicitly does not touch `voting_records`, `candidate_positions`, or `match_scores` data, since none of the four options in Section 23 require a data change — only, at most, a presentation change.

## 26. No-change confirmation

This gate made no changes to: `candidates`, `voting_records`, `candidate_positions`, `match_scores`, `civic_dna`, `civic_dna_answers`, `user_districts`, `districts`, `current_officials`, `officials_for_user`, `src/lib/officials.ts`, `CurrentOfficialsSection`, `compute-match-scores` logic, `MatchScoreRing`, the ballot page, the candidate profile, the onboarding calculating page, the Data Sources page, the admin entry page, the admin records page, schema, tables, seeds, migrations, CSV files, RLS, grants, source code, PowerShell scripts, API keys, environment variables, the County Commission write guard, the At-Large row, or deployment state.

No candidate was scored. No candidate was ranked. No political recommendation was produced. No Supabase write was performed. No Claude or Anthropic API call was made. No secret file was inspected. `ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE` remains `false`. No deployment occurred. Exactly one new file was created: `docs/internal_beta_gate_i19_voting_record_official_source_review.md`. `CIVICMARKET_CURRENT_STATE.md` was not modified by this gate.
