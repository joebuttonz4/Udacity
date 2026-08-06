# Internal Beta — Gate I18: Non-Incumbent Source Availability Re-Check and Closure Decision

## 1. Date and timestamp

Date: 08-06-2026
Timestamp: 12:35 am EST

This document is a read-only, public-source re-verification gate. It does not score, rank, or produce any political recommendation about any candidate. It does not create or modify `candidates`, `candidate_positions`, `match_scores`, `voting_records`, or any Civic DNA data. It does not change source code, PowerShell scripts, schema, RLS, grants, seeds, migrations, or CSV files. It does not call the Anthropic API. It does not write to Supabase. It does not reopen the locked-ring implementation workstream (Gates I14-I17), which remains closed.

## 2. Repository baseline

- Local path: `J:\CivicMarket`
- Branch: `master`
- Working tree clean, up to date with `origin/master`
- Latest pushed commit: `bada51f` Record Gate I17 live UI verification
- Previous pushed commits:
  - `640a180` Update current state for Gate I16
  - `8d75978` Implement locked-ring communication states
  - `4bd5840` Update current state for Gate I15
  - `db86380` Add locked-ring implementation plan

## 3. Gate status

Complete. Read-only public-source re-check. No candidate scoring, database write, API call, secret inspection, County Commission change, or deployment occurred.

## 4. Purpose

Gate I13 (`docs/internal_beta_gate_i13_non_incumbent_source_availability_inventory.md`) found no consistent first-party source type across the four real PSL City Council District 1 candidates as of 08-05-2026. This gate performs one consistent, read-only re-check of public source availability for the same four candidates to determine whether anything material has changed, and records a single closure decision (Outcome A, B, or C) for this source-research thread. This gate does not authorize candidate scoring or `candidate_positions` creation under any outcome.

## 5. Scope and exclusions

In scope: public web research only, applied with identical depth and standard to all four candidates; comparison against Gate I13's findings; one final outcome determination; a recommended closure decision and next actual beta blocker.

Out of scope: any write to any table; any methodology approval; any UI or code change; reopening the locked-ring communication/implementation workstream; contacting any candidate or campaign; submitting any form; downloading any executable file; entering any credential.

## 6. Equal-research method

The same search pattern was applied to all four candidates: one direct name-plus-office-plus-year search, followed by targeted follow-up searches only where the first search did not resolve a specific open question already flagged by Gate I13 (the Meltzer identity discrepancy, Baptiste's missing first-party source). No candidate received a deeper or shallower search than another for the same category of question. Where a follow-up was performed for one candidate (e.g., Meltzer's identity), an equivalent follow-up was performed for the other candidate with an open question from Gate I13 (Baptiste's source availability), consistent with the "do not search more deeply for one candidate solely because fewer sources are available" instruction — the additional Baptiste search was performed *because* Gate I13 left it explicitly open, not because Baptiste had fewer results.

## 7. Source acceptance standard

Accepted as first-party evidence, when verifiable: official campaign website, a clearly candidate-controlled social account, a candidate-authored questionnaire response, a candidate interview or debate response, a candidate-issued press release, or an official campaign filing (for identity/candidacy confirmation only, not position evidence). Not accepted as position evidence: search-result snippets alone, third-party summaries, news paraphrases without a direct quote, endorsements, donor records, party, biography, occupation, demographics, campaign branding, silence, missing sources, or AI-generated summaries. A social-media page was not assumed to be candidate-controlled merely because its title matches the candidate's name — see Section 9-10 for how this was handled.

## 8. Gate I13 baseline

Read directly from `docs/internal_beta_gate_i13_non_incumbent_source_availability_inventory.md`:

- Reikenis and Zimmerman: confirmed official campaign websites, dimension coverage on `growth_development`, `taxation_spending`, `environment`, `public_safety`; `housing` and `transparency` ambiguous.
- Meltzer: confirmed official campaign website; dimension coverage on `growth_development`, `taxation_spending`, `environment`; `public_safety` not found on the page reviewed; `housing` and `transparency` ambiguous/partial. Unresolved name discrepancy: repository/CSV lists "Fredric Meltzer"; the campaign site and official campaign-finance filing use "Rick Meltzer."
- Baptiste: no first-party 2026 source of any kind found; zero dimension coverage.
- Result: Outcome A (no consistent first-party source type across all four).

## 9. Eric Reikenis re-check

- Official campaign website (`vote4eric.org`) still active, unchanged as a confirmed first-party source.
- **New since Gate I13:** a Facebook page titled "Eric Reikenis for Port St Lucie City Council District 1" was found in search results. Direct inspection of the page's About/admin information was not possible through available tooling (the fetch returned only the page title, no About section, no post history, no verification of who administers it). Per this gate's own standard ("do not assume a website or social profile belongs to the candidate solely because the name matches"), this page is recorded as **found but not confirmed first-party** — it is not treated as verified evidence, only as a lead for a future gate with better verification tooling or direct manual browser review.
- **New since Gate I13:** an "About Eric Reikenis" subpage (`vote4eric.org/about-eric/`) was found and reviewed. It is primarily biographical (background, community involvement, coaching — none of which count as position evidence under this gate's standard) but contains one materially new, direct statement: "city government should be transparent, efficient, and accountable to the people it serves." This is a clearer, more direct transparency statement than anything found in Gate I13's review of the site's "Key Issues" page alone.
- No new questionnaire, interview, debate response, or press release was found.
- **Verification result:** Confirmed (unchanged from Gate I13), with one new subpage adding a direct transparency statement.

## 10. Indony Baptiste re-check

- No first-party campaign website was found for the 2026 cycle, matching Gate I13.
- No candidate-controlled social account was found in this search pass.
- No candidate questionnaire, interview, or debate response was found.
- The same government-adjacent campaign-finance filings (St. Lucie County VoterFocus) confirming active candidacy were the only sources located, exactly as in Gate I13 — these confirm candidacy, not policy positions.
- The same third-party aggregator pages that appeared to associate an "Indony Pierre Jean Baptiste" with a 2026 Florida gubernatorial candidacy alongside the City Council filing surfaced again in this search pass. This gate did not attempt to resolve this potential name/office conflation, consistent with the instruction not to treat third-party aggregator information as verified identity or policy evidence. It remains an unresolved, flagged-only observation, unchanged from Gate I13.
- **Verification result:** Not found (unchanged from Gate I13). No material change.

## 11. Kevin Zimmerman re-check

- Official campaign website (`zimmermanforcityofpsl.com`) still active, unchanged as a confirmed first-party source. The previously-noted second domain (`kevinzimmermancitycouncilportstlucie.com`) was not re-tested in this gate; its status is unchanged/unknown since Gate I13 and it was not used as a source either time.
- **New since Gate I13:** a Facebook page (`facebook.com/zimmermanforpsl`) was found. As with Reikenis's page, direct inspection of its About/admin information was not possible through available tooling — the fetch returned only the page title. Recorded as **found but not confirmed first-party**, same treatment as Reikenis's Facebook page, for consistency (Section 6).
- An attempted `/about` subpage on the campaign site returned HTTP 404 — no additional first-party subpage content was found beyond what Gate I13 already reviewed on the home page.
- No new questionnaire, interview, debate response, or press release was found.
- **Verification result:** Confirmed (unchanged from Gate I13). No material dimension-coverage change.

## 12. Fredric Meltzer / Rick Meltzer identity re-check

- Repository/CSV name: **Fredric Meltzer** (`data/real-psl-replacement/candidates_real.csv`).
- Campaign-source name: **Rick Meltzer** (`vote4rickmeltzer.com`; St. Lucie County VoterFocus campaign-finance filing, candidate id `ca=760`).
- The official St. Lucie County campaign-finance filing page was re-fetched directly in this gate and confirmed to show only "Rick Meltzer" throughout — no legal first name field, no "Fredric" anywhere on that page.
- A direct search for "Fredric Meltzer" against the St. Lucie County Supervisor of Elections' own domain (`stlucievotes.gov`) returned no matching result. The Supervisor of Elections' official "Candidate Profiles" landing page was fetched directly; it did not display individual candidate names on that page itself (appears to require an interactive search/filter not reachable through this gate's fetch tooling), so it could neither confirm nor rule out a connection between the two names.
- One new third-party page was found (`bluevoterguide.org`, an endorsement-tracking site) listing "Rick Meltzer" — explicitly excluded as evidence under this gate's standard (endorsements are not identity or position evidence) and not used to resolve anything.
- **Whether an official election or campaign-finance source connects the names:** No. None was found in this gate, matching Gate I13.
- **Whether the evidence is sufficient to treat them as the same candidate:** No. Insufficient evidence exists to conclude this either way.
- **Exact authoritative source supporting any conclusion:** None found. This gate does not assume, and does not change, the CSV's "Fredric Meltzer" record.
- **Result: Unresolved, unchanged from Gate I13.**

## 13. Civic DNA dimension availability matrix

Availability only (`Confirmed substantive coverage` / `Potential or ambiguous coverage` / `No confirmed coverage`) — no scores recorded, no ideological direction inferred:

| Dimension | Reikenis | Baptiste | Zimmerman | Meltzer |
|---|---|---|---|---|
| growth_development | Confirmed substantive coverage | No confirmed coverage | Confirmed substantive coverage | Confirmed substantive coverage |
| taxation_spending | Confirmed substantive coverage | No confirmed coverage | Confirmed substantive coverage | Confirmed substantive coverage |
| education | No confirmed coverage | No confirmed coverage | No confirmed coverage | No confirmed coverage |
| environment | Confirmed substantive coverage | No confirmed coverage | Confirmed substantive coverage | Confirmed substantive coverage |
| public_safety | Confirmed substantive coverage | No confirmed coverage | Confirmed substantive coverage | No confirmed coverage |
| housing | Potential or ambiguous coverage | No confirmed coverage | No confirmed coverage | Potential or ambiguous coverage |
| transparency | **Confirmed substantive coverage (changed from ambiguous)** | No confirmed coverage | Potential or ambiguous coverage | Potential or ambiguous coverage |

Only one cell changed since Gate I13: Reikenis's `transparency` moved from "Ambiguous" to "Confirmed substantive coverage" based on the new "About Eric Reikenis" subpage's direct statement (Section 9). No other cell changed. No dimension was inferred from unrelated text; no issue mention was interpreted as an ideological direction.

## 14. New sources found

- Eric Reikenis: a Facebook page (found but not confirmed first-party — see Section 9); an "About Eric Reikenis" subpage with one new direct transparency statement (confirmed first-party, since it is part of the candidate's own campaign website).
- Kevin Zimmerman: a Facebook page (found but not confirmed first-party — see Section 11).
- Fredric/Rick Meltzer: one third-party endorsement-tracking page (excluded as evidence).
- Indony Baptiste: none.

## 15. Sources no longer available

None. Every source Gate I13 confirmed (the three campaign websites, the government-adjacent campaign-finance filings for all four candidates) remained reachable and unchanged in this re-check.

## 16. Identity findings

- Fredric Meltzer / Rick Meltzer: still unresolved; no authoritative source found in this gate connecting the two names (Section 12).
- Indony Baptiste / potential multi-candidacy conflation with a Florida gubernatorial candidate of a similar name: still unresolved, still not investigated or treated as verified (Section 10), unchanged from Gate I13.

## 17. Consistent source-type result

Still **no** consistent first-party source type across all four candidates. Three candidates (Reikenis, Zimmerman, Meltzer) have confirmed official campaign websites; Baptiste has none. The two newly-found Facebook pages (Reikenis, Zimmerman) are not confirmed first-party and, even if they were, would not close the gap — Baptiste still has no discoverable social presence in this search pass, and Meltzer's Facebook status was not checked in this pass (not needed, since the core website-based inconsistency involving Baptiste alone is already sufficient to keep the result at "not consistent"). This gate did not need to resolve the Facebook-verification question to reach a result, since Baptiste's total absence of any first-party source is decisive on its own.

## 18. Outcome

**Outcome A: No consistent first-party source type exists across all four candidates.**

This is unchanged from Gate I13. The one material addition (Reikenis's new, clearer transparency statement) strengthens dimension coverage for a single candidate on a single dimension; it does not create consistency across all four candidates, and Baptiste's complete absence of any first-party 2026 source remains the deciding factor.

## 19. Candidate fairness review

The result continues to reflect an asymmetric, uncontrolled web presence rather than anything CivicMarket did or did not do evenly — exactly the fairness risk Gate I12 (Section 30) and Gate I13 (Section 21) already identified. This gate applied identical search depth and identical acceptance standards to all four candidates (Section 6) and did not compensate for Baptiste's continued absence of sources by lowering the bar or using a weaker source category for her alone. No candidate-specific criticism is recorded anywhere in this document beyond factual, symmetric source-availability findings already present in Gate I13.

## 20. Internal Beta impact

No change to any live behavior. All four candidate match rings remain locked, exactly as verified live in Gate I17. Candidate cards remain fully visible. No `candidate_positions` row was created or considered for creation. The locked-ring communication implementation (Gates I14-I17) is unaffected by this gate and remains closed.

## 21. Recommended closure decision

Consistent with this gate's own closure rule for an Outcome A result:

- Keep all four rings locked.
- Do not create another immediate source-research gate.
- Recommend closing source re-check activity until after the August 18, 2026 election, or until a material new source is proactively provided (e.g., by the user, or by a candidate/campaign directly).
- Return focus to the remaining Internal Beta launch blockers (Section 22).

## 22. Recommended next project priority

Per `CIVICMARKET_CURRENT_STATE.md`'s "Immediate priorities" section, the one remaining item explicitly still open is: **"Voting records with official source URLs — the only remaining item; intentionally blocked until an official item-specific source verifies candidate, item, date, description, and vote cast."** This is stated as the sole remaining hard beta blocker not yet marked complete, and is unaffected by this gate's Outcome A finding (it concerns incumbents/officials with an actual government voting history, not the four current non-incumbent District 1 candidates, who structurally cannot have one). This gate does not implement or begin that item — it is identified only as the next actual project priority for the user to decide whether and how to pursue.

## 23. Risk check

**Scope:** One new documentation file only, plus public read-only source research.

**Expected result:** A neutral, equally-applied re-check confirming Gate I13's Outcome A result still holds, with one incremental dimension-coverage update (Reikenis, `transparency`) recorded and no other material change.

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
- No credentials entered
- No forms submitted
- No candidate or campaign contacted
- No executable file downloaded

**Test:** Build should pass. Git status should show only this new Gate I18 documentation file before commit.

## County Commission hard stops

`ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE` remains `false`. The write guard was not enabled. No County Commission writes were run. No County Commission District 1-5 `user_districts` rows were created or modified. The At-Large row was not altered. No deployment occurred.

## Secret protection

No `.env`, `.env.local`, `.env.*`, or secret-named file was inspected, displayed, or searched during this gate. No API key, service-role key, Supabase password, or Anthropic credential was inspected or displayed. All repository file reads targeted single, explicitly named, non-secret documentation files.

## 24. No-change confirmation

This gate made no changes to: `candidates`, `voting_records`, `candidate_positions`, `match_scores`, `civic_dna`, `civic_dna_answers`, `user_districts`, `districts`, `current_officials`, `officials_for_user`, `src/lib/officials.ts`, `CurrentOfficialsSection`, `MatchScoreRing`, the ballot page, the candidate profile, the onboarding calculating page, the Data Sources page, schema, tables, seeds, migrations, CSV files, RLS, grants, source code, PowerShell scripts, API keys, environment variables, the County Commission write guard, the At-Large row, or deployment state.

No candidate was scored. No candidate was ranked. No political recommendation was produced. No Supabase write was performed. No Claude or Anthropic API call was made. No secret file was inspected. No credentials were entered. No form was submitted. No candidate or campaign was contacted. No executable file was downloaded. `ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE` remains `false`. No deployment occurred. Exactly one new file was created: `docs/internal_beta_gate_i18_non_incumbent_source_availability_recheck.md`. `CIVICMARKET_CURRENT_STATE.md` was not modified by this gate.
