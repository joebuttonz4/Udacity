# Gate I40 — Shannon Martin Evidence Human Review

Status: Human source-grounded review complete. **2 of 5 surviving rows require revision before any future insert; 3 of 5 are clean approvals.** Documentation only. No Anthropic call. No Supabase write. No `candidate_position_evidence` insert. No `candidate_positions`/`match_scores` change. No deployment.

## Scope

Human review of the five surviving evidence rows from the latest successful live extraction (deterministic conflict-canonicalization verification run), plus the one row rejected by deterministic validation. Candidate: Shannon Martin (`candidate_id` `d44ff05a-14af-45c2-9f2f-6d530a8a051e`). Methodology: `campaign_evidence_v1_2026-08`.

## Method

Both cited campaign pages were read live and in full via direct DOM text extraction (`https://martinforpslmayor.com/about-shannon-martin/`, 4,513 characters, and `https://martinforpslmayor.com/biography/`, 6,324 characters) — not summarized, not sampled. Every factual claim in every rationale below was checked against the literal page text. No inference beyond the cited source was made. No comparison to another candidate. No ranking. No match-score calculation.

---

## Row 1 — growth_development +1

**Source:** `https://martinforpslmayor.com/about-shannon-martin/`
**Rationale as extracted:** "Candidate championed attracting major employers to the Southern Grove Jobs Corridor and prioritized reducing red tape and making targeted investments to support economic growth, reflecting a permissive, pro-growth economic development approach."
**Confidence:** medium

**A. Source verification — FAILS PARTIALLY.** The cited page (`about-shannon-martin/`) was confirmed, in full, to contain: *"By focusing on infrastructure, reducing red tape, and making targeted investments that improve quality of life, Mayor Martin is ensuring that Port St. Lucie remains a place where people want to live, work, and invest"* and *"She has worked to attract quality employers, support small businesses, and revitalize key areas of the city... Her pro-business, pro-taxpayer approach has helped strengthen Port St. Lucie's economy without raising taxes."* This supports "reducing red tape," "targeted investments," and "attracting employers" generically. **However, the phrase "Southern Grove Jobs Corridor" does not appear anywhere on this page** (confirmed via full-text search of all 4,513 characters). It appears instead on `https://martinforpslmayor.com/biography/`: *"Mayor Martin has been directly involved with the development of the Southern Grove Jobs Corridor, attracting major employers like FedEx, Amazon, Accel and Cheney Brothers in record time—compressing a 20-year forecast into six years."* The model merged content from two different pages into one rationale but attributed it to only one `source_url`.

**B. Dimension mapping:** Correct — this is a permissive/pro-growth development-policy claim under the revised Gate I39 definition (streamlined-approvals/incentive-adjacent framing: reducing red tape, targeted investment, attracting employers).

**C. Score proportionality:** +1 is proportionate for general directional language without a single named concrete mechanism (the genuinely-cited-page content is fairly general; the stronger, more concrete Southern Grove/FedEx/Amazon evidence belongs to the other page and is not part of this row's valid citation).

**D. Confidence:** `medium` is appropriate given the citation defect found in A — arguably it should not be higher than medium until the source attribution is corrected.

**E. `source_published_at`:** Correctly `null`. No visible publication date exists anywhere on the page (only a site-wide "Copyright © 2026" footer, which is not a per-statement publication date and must not be used as one).

**F. `conflict_flag`:** Correctly `false` — no surviving opposite-sign growth_development row exists after the Rosser Lakes row was rejected by deterministic validation.

**G. Decision: REVISE BEFORE INSERT.**

**Exact revision:**
- **Score:** unchanged, `+1`
- **Confidence:** unchanged, `medium`
- **Revised rationale:** "Campaign page states the candidate 'worked to attract quality employers, support small businesses, and revitalize key areas of the city' and that 'focusing on infrastructure, reducing red tape, and making targeted investments' supports economic growth, reflecting a permissive, pro-growth economic development approach. (Note: this page does not name the Southern Grove Jobs Corridor specifically — that claim is independently and separately supported by `https://martinforpslmayor.com/biography/`, confirmed live, but is not part of this row's citation.)"
- **source_url:** unchanged, `https://martinforpslmayor.com/about-shannon-martin/`

No new row was created for the Southern Grove/biography-page content — per standing instruction, this gate does not fabricate or re-route evidence; that stronger, independently-sourced claim is flagged here only as an observation for a possible future, separately-approved extraction pass.

---

## Row 2 — taxation_spending +2

**Source:** `https://martinforpslmayor.com/about-shannon-martin/`
**Rationale as extracted:** "Candidate reduced city debt and lowered the millage rate for ten consecutive years through disciplined budgeting, and helped strengthen the city's economy without raising taxes, keeping the municipal tax rate among the lowest of Florida's 20 largest cities."
**Confidence:** high

**A. Source verification — PASSES.** Confirmed verbatim/near-verbatim on the cited page: *"She's helped hold the line on taxes, keeping Port St. Lucie's municipal tax rate among the lowest of Florida's 20 largest cities"* and *"Through disciplined budgeting and a focus on efficiency, the city reduced its debt and lowered the millage rate for ten consecutive years."*

**B. Dimension mapping:** Correct — explicit lower-tax/millage-reduction/debt-reduction/fiscal-discipline evidence, the clearest possible fit for the revised `taxation_spending` definition.

**C. Score proportionality:** +2 is correct — this is exactly the "specific recurring-metric trend claim" (ten consecutive years, a ranked comparison) the Gate I39 definitions review specified as the +2 threshold.

**D. Confidence:** `high` is appropriate — the claim is specific, verifiable, and directly quoted.

**E. `source_published_at`:** Correctly `null` — no visible date on the page.

**F. `conflict_flag`:** Correctly `false` — no opposing taxation_spending evidence exists in this set (both rows are same-sign).

**G. Decision: APPROVE FOR FUTURE INSERT.**

---

## Row 3 — taxation_spending +2

**Source:** `https://martinforpslmayor.com/biography/`
**Rationale as extracted:** "Ten consecutive years of millage reductions and significantly reduced city debt, strengthening the city's financial footing and improving bond ratings, reflecting explicit fiscal discipline and debt reduction."
**Confidence:** high

**A. Source verification — PASSES.** Confirmed verbatim/near-verbatim on the cited page: *"she led efforts that resulted in 10 consecutive years of millage reductions and significantly reduced city debt thereby strengthening the city's financial footing which has increased the city's bond ratings."*

**B. Dimension mapping:** Correct, same basis as Row 2.

**C. Score proportionality:** +2 correct — same threshold basis as Row 2, independently sourced from a different page.

**D. Confidence:** `high` appropriate.

**E. `source_published_at`:** Correctly `null`.

**F. `conflict_flag`:** Correctly `false`.

**G. Decision: APPROVE FOR FUTURE INSERT.**

---

## Row 4 — environment +1

**Source:** `https://martinforpslmayor.com/biography/`
**Rationale as extracted:** "Candidate advocated for acquiring land for future green spaces through the Naturally PSL program, acquired over 280 acres for the Green Spaces and Places Land Bank, championed acquisition of the 105-acre Rosser Lakes Preserve, and supports water quality projects and a septic-to-sewer conversion program to protect the environment."
**Confidence:** high

**A. Source verification — PASSES.** Confirmed verbatim/near-verbatim on the cited page: *"she continues to advocate for acquiring land for future green spaces and places through our city's Naturally PSL program. In the last year alone, the city acquired more than 280 acres of land to add to the city's Naturally PSL Green Spaces and Places Land Bank... She championed the acquisition of the 105 acre Rosser Lakes Preserve so that it would not turn into more residential development. Water quality projects and our septic to sewer conversion program are also key components to protecting our environment."*

**B. Dimension mapping:** Correct under the revised, broadened `environment` definition (protection/conservation/public investment, not limited to "regulation").

**C. Score proportionality — DOES NOT MATCH THE DOCUMENTED THRESHOLD.** The Gate I39 dimension-definitions review already examined this exact evidence pattern (same named program, same acreage figure, same water-quality/septic-to-sewer commitment) and explicitly documented: *"this row's evidence is unusually concrete and multi-part: a named ongoing program (Naturally PSL), a specific acreage figure (280+ acres), and named infrastructure investment (water-quality projects, septic-to-sewer conversion) — multiple concrete, named, funded commitments, which meets the +2 threshold rather than the +1 'general supportive stance' tier."* Applying that already-documented, already-approved threshold consistently to this materially identical evidence, +1 under-scores it.

**D. Confidence:** `high` is appropriate and unchanged.

**E. `source_published_at`:** Correctly `null`.

**F. `conflict_flag`:** Correctly `false` — no opposing environment evidence exists in this set.

**G. Decision: REVISE BEFORE INSERT.**

**Exact revision:**
- **Score:** `+1` → **`+2`**
- **Confidence:** unchanged, `high`
- **Rationale:** unchanged (already accurate and fully source-supported as extracted)
- **source_url:** unchanged, `https://martinforpslmayor.com/biography/`

---

## Row 5 — public_safety +2

**Source:** `https://martinforpslmayor.com/biography/`
**Rationale as extracted:** "Advocated for the addition of Districts 5 and 6 police districts now operational, was instrumental in creating a Police Training Facility currently under construction, and championed the creation of the city's Real Time Operations Center integrating technology and real-time data for law enforcement and emergency response."
**Confidence:** high

**A. Source verification — PASSES.** Confirmed near-verbatim on the cited page: *"advocated for the addition of Districts 5 and 6 police districts which are now operational. She was instrumental in the creation of our Police Training Facility which is currently under construction... She has also championed the creation of the City's Real Time Operations Center... By integrating technology and real-time data, the center will enable Public Works and law enforcement to quickly detect and respond..."*

**B. Dimension mapping:** Correct — concrete, named, multi-item resource/infrastructure investment, exactly the top tier of the revised `public_safety` definition. Notably, this row correctly excludes the page's separate, adjacent "Florida's Safest Large City for 13 consecutive years" / "unwavering support... firm stance on law and order" language — the generic-rhetoric exclusion guardrail held.

**C. Score proportionality:** +2 correct — multiple concrete, named resource/infrastructure investments (new police districts, a training facility, a technology center), the clearest possible fit for the +2 threshold.

**D. Confidence:** `high` appropriate.

**E. `source_published_at`:** Correctly `null`.

**F. `conflict_flag`:** Correctly `false`.

**G. Decision: APPROVE FOR FUTURE INSERT.**

---

## Rejected row — REJECTED BY DETERMINISTIC VALIDATION

**Dimension:** growth_development · **Score:** -1 · **Source:** `https://martinforpslmayor.com/biography/`
**Model's original rationale:** "Candidate championed the acquisition of the 105-acre Rosser Lakes Preserve specifically so it would not turn into more residential development, an explicit restrictive/preservation action limiting development on that land."
**Exact validation reason:** "Negative growth_development score lacks evidence of a general restrictive development policy; parcel-specific preservation/conservation alone is insufficient."

This row never reached `validatedEvidence` — it was removed deterministically before human review by the parcel-specific negative-growth guardrail added specifically for this exact evidence pattern. It is recorded here only for completeness/audit trail, not as a human-review decision. Its content is independently and correctly captured in Row 4 above under `environment`.

---

## Summary decisions

| Row | Dimension | Score | Decision | Revision |
|---|---|---|---|---|
| 1 | growth_development | +1 | **REVISE** | Rationale corrected to remove the unsupported Southern Grove Jobs Corridor claim (not present on the cited page); score/confidence/source_url unchanged |
| 2 | taxation_spending | +2 | **APPROVE** | none |
| 3 | taxation_spending | +2 | **APPROVE** | none |
| 4 | environment | +1 | **REVISE** | Score corrected to +2 per the already-documented Gate I39 threshold for this exact evidence pattern; rationale/confidence/source_url unchanged |
| 5 | public_safety | +2 | **APPROVE** | none |
| — | growth_development | -1 | **REJECTED BY DETERMINISTIC VALIDATION** | n/a — recorded for audit trail only |

**Are all five ready for persistence as originally extracted?** **No.** Three (rows 2, 3, 5) are clean, source-verified, threshold-correct approvals. Two (rows 1, 4) require the exact stated corrections above before any future insert.

## Unresolved issues

1. **Row 1's source-attribution defect** is a new class of finding not previously documented anywhere in this pilot: the model can merge genuinely-sourced content from two different approved pages into a single rationale while citing only one `source_url`. No validation-layer check currently catches this (the existing `source_url` check only confirms the URL is on the approved list, not that every factual claim in the rationale actually appears on that specific page). Whether to build a deterministic check for this (e.g., substring-presence checks between rationale and cited page text) is a decision for a future, separately-approved gate — not implemented here.
2. **Row 4's threshold-application question**: this human review re-applied Gate I39's own documented +2 threshold to materially identical evidence, which is a consistency application, not new judgment — but it means the extraction prompt's own guardrail text does not yet reliably produce this same +2 outcome on its own (the model scored it +1 twice now, across two separate runs, for equivalent evidence). A future gate could consider whether the prompt's environment threshold description needs sharper wording, or whether this remains a human-review-only correction step indefinitely.
3. No mechanism yet exists to apply either revision (row 1 or row 4) — this gate reviews and documents the corrected values only; building the actual insert/persistence step (which would apply these exact revisions) remains explicitly out of scope and not started.

## No-change confirmation

No Anthropic/Claude API call was made. No Supabase write was performed. No `candidate_position_evidence` row was created. No `candidate_positions` or `match_scores` row was created or modified. No candidates were compared or ranked. No user match score was calculated. `ENABLE_CAMPAIGN_EVIDENCE_EXTRACTION` remains `false`, untouched. No application source code was changed. No deployment occurred. No commit or push was performed by this gate.
