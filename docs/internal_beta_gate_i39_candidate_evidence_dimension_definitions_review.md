# Gate I39 — Candidate-Evidence Dimension Definitions Review

Status: Documentation-only review and re-evaluation. No Anthropic call. No Supabase write. No `candidate_position_evidence` insert. No `candidate_positions` or `match_scores` change. No deployment. No commit/push performed by this gate itself.

## Numbering note

`CIVICMARKET_CURRENT_STATE.md`'s own text reserved **"Gate I39 — Controlled Shannon Martin campaign-evidence extraction pilot"** as the next gate after Gate I38 (Shannon Martin source verification), but that section was never written — the live extraction pilot instead ran informally within a single working session (locally referred to in that session as "Gate I40" through "Gate I45": a JSON-fence-parsing fix, a multi-text-block/response-diagnostics hardening pass, a truncation root-cause diagnosis, a `max_tokens`/extended-thinking fix, and finally one successful live extraction call that returned 8 validated Shannon Martin evidence rows with 0 rejections). None of those steps were persisted to `CIVICMARKET_CURRENT_STATE.md`. This document claims the **I39** slot the state file already reserved, and is the first of that sequence to be persisted. It covers only the definitions-review step; the prior live-extraction sub-steps are referenced here as inputs/context, not re-documented in full.

## Scope of this gate

Review and propose revised evidence-scoring polarity definitions for all seven locked Civic DNA dimension keys, as used specifically by the `campaign_evidence_v1_2026-08` candidate-evidence extraction methodology (`src/app/api/admin/extract-shannon-martin-evidence/route.ts`). Then re-evaluate the 8 already-captured Gate-I45-labeled Shannon Martin evidence rows against the proposed definitions, without any new model call.

**This does not modify the seven locked dimension keys, and does not modify `Reference Files/CIVICMARKET_PATCH_MAY12.md`.** That file is the Civic DNA *quiz* source of truth (CLAUDE.md: "All dimension keys must match the seven locked snake_case keys") and is out of scope. What's under review here is the separate *evidence-scoring polarity description* used only by the candidate-evidence extraction pilot's prompt/validation — a downstream, additive methodology concern, not the quiz itself. The seven keys (`growth_development`, `taxation_spending`, `education`, `environment`, `public_safety`, `housing`, `transparency`) remain unchanged.

## Human review outcome that triggered this gate

From the 8 validated Gate-I45 Shannon Martin rows:

**Approved as currently scored:** `taxation_spending +2` (about page), `taxation_spending +2` (biography), `public_safety +2` (biography).

**Not approved as currently scored:** `growth_development +1`, `growth_development -1`, `environment +1`, `public_safety +1`, `transparency +1`.

All five rejected rows contain real, legitimate campaign evidence — the rejection is a definitions problem, not an evidence-quality problem.

---

## Per-dimension review

### 1. `growth_development`

**A. Current definition** — `+`: More new development approved. `-`: Less new development approved.

**B. Problem analysis** — Not clear enough for first-party campaign evidence. A binary "amount of development approved" framing invites false inference: a candidate can hold a coherent "smart/managed growth" position — courting business investment while also protecting specific parcels as green space — without holding contradictory positions on a single permissiveness axis. Common campaign statements ("smart, responsible growth," "not unchecked development") don't map cleanly to a numeric direction; they're frequently boilerplate that every candidate uses. Land-conservation actions (buying a specific parcel to keep it undeveloped) are conceptually **environmental** conservation acts, not **growth-policy** statements, and the current definition doesn't distinguish the two.

**C. Proposed revised definition** — `+`: Evidence of a more permissive/pro-growth development policy stance (streamlined approvals, incentives for development/business attraction, opposition to growth restrictions or moratoriums). `-`: Evidence of a more restrictive/growth-management policy stance (explicit growth caps, moratoriums, downzoning, opposition to specific development *as a matter of growth policy*). **Single-parcel conservation/preservation actions are explicitly excluded from this dimension** — see Exclusions.

**D. Evidence thresholds** — `+2`/`-2`: an explicit, concrete growth-policy commitment (a named ordinance, a stated cap/moratorium, a specific streamlining/incentive program). `+1`/`-1`: a clear directional stance without a concrete mechanism, but more specific than generic "balanced growth" language (e.g., a specific project the candidate championed *as a development-approval matter*). `0`: explicitly mixed/both-directions evidence held simultaneously as policy. `null`: generic "smart/responsible/balanced growth" rhetoric with no concrete commitment either direction, or growth-adjacent evidence that is actually about something else (conservation, infrastructure, environment).

**E. Exclusions** — Single-parcel or single-site land conservation/preservation actions (these belong to `environment`, not this dimension, unless the candidate explicitly frames them as a general anti-development/growth-cap *policy*, not a site-specific conservation act). Generic "smart growth," "responsible growth," "balanced growth" slogans with no concrete mechanism. Business-attraction/job-creation claims that don't address development *approval* policy. Party/endorsement/biography.

**Special review point resolution** — The axis should measure permissive vs. restrictive *development-approval policy*, not raw "amount of development." A single preserved parcel must **not** be treated as automatically anti-development — it is excluded from this dimension entirely unless framed as general growth-restriction policy.

---

### 2. `taxation_spending`

**A. Current definition** — `+`: Lower taxes, less spending. `-`: Higher taxes, more spending.

**B. Problem analysis (coherence flag)** — This is a genuine internal-coherence risk. "Lower taxes" and "more spending" are not mutually exclusive in real campaign rhetoric (e.g., "we cut the millage rate ten years running *and* funded new infrastructure" is a completely ordinary fiscally-conservative message, not a contradiction) — yet a single combined axis pulls the same dimension in opposite directions for those two claims if both are naively scored. In this evidence set, no contradiction actually surfaced (both approved rows are pure tax/millage-rate/debt evidence, no spending-increase claims), but the risk is real for future evidence.

**C. Proposed revised definition** — Track **net fiscal-discipline posture**, not raw dollar amounts of any single program. `+`: Evidence of tax-rate reduction, millage-rate reduction, debt reduction, or fiscally conservative budget trend; explicit opposition to tax/fee increases. `-`: Evidence of tax-rate increases, new taxes/fees, or explicit support for raising taxes/fees to fund services; expanding recurring budget commitments funded by higher revenue extraction.

**D. Evidence thresholds** — `+2`/`-2`: a specific recurring-metric trend claim (e.g., "ten consecutive years of millage reduction," "reduced overall debt," or the mirrored negative). `+1`/`-1`: a general but still tax/fee/rate-specific claim without a multi-year trend figure. `0`: a single piece of evidence contains both a rate-cut claim *and* an explicit new-recurring-spending claim without addressing the net effect — **do not average; hold at 0 and flag `conflict_flag: true` for human review** rather than force a direction. `null`: no tax/rate/debt-specific evidence.

**E. Exclusions** — One-off capital project announcements or ribbon-cuttings with no stated funding source or tax-rate implication (e.g., "we built a new facility" alone). General "invest in our community" language with no rate/debt reference. Endorsements from taxpayer-advocacy or public-employee groups.

**Coherence recommendation** — Keep as **one combined dimension** for now; the seven dimension keys are locked (CLAUDE.md), and splitting into `taxation` + `spending` would be a schema-level change requiring its own separately-approved gate (and would also touch the locked Civic DNA quiz model). The tightened net-fiscal-posture definition plus the explicit "don't average, escalate to human review" rule for same-row tax-cut-plus-spending-increase evidence is the mitigation until/unless that larger change is separately approved.

---

### 3. `education`

**A. Current definition** — `+`: More public school funding. `-`: Less public school funding.

**B. Problem analysis** — The direction itself is reasonably clear and binary (a funding-level axis reads well against both campaign statements and a future actual budget vote). The risk is under-specification of what counts as evidence: generic "I support our schools" statements are near-universal and carry no funding commitment. No Gate I39/I45 evidence exists for this dimension for Shannon Martin — consistent with the prior finding (Gate I13/I18) that none of the four City Council District 1 candidates had confirmed education coverage either. A PSL Mayor/City Council candidate also does not control the School Board's budget (School Board District 1 is a separately elected body — see `current_officials`), which is a scoring-confidence consideration, not a direction-definition problem.

**C. Proposed revised definition** — `+`: Explicit support for increasing public school funding/budget, a new school-funding measure, or explicit opposition to school-funding cuts. `-`: Explicit support for reducing public school funding or redirecting public funds away from public schools (e.g., toward vouchers) as a *funding* position, not general school-choice philosophy alone.

**D. Evidence thresholds** — `+2`/`-2`: a specific funding figure, measure, or program the candidate directly controls or specifically committed city resources/partnership to. `+1`/`-1`: a clear directional funding position without a specific figure/mechanism. `0`: mixed. `null`: generic "I value education" statements with no funding position; any statement about an office (School Board budget) the candidate does not control, without a specific city-level funding/partnership mechanism named.

**E. Exclusions** — Photo ops at schools, generic "our children are our future" rhetoric, teacher/union endorsements alone, candidate's own educational background/biography.

**Confidence note (new, unapproved)** — For a City Council/Mayor candidate discussing School Board-controlled funding, cap confidence at `medium` unless a specific city-level funding mechanism (e.g., a city grant program to schools) is named. This is a new rule and is flagged in Unresolved Decisions below.

---

### 4. `environment`

**A. Current definition** — `+`: Stronger environmental regulation. `-`: Weaker environmental regulation.

**B. Problem analysis** — Too narrow. Local candidates almost never campaign on "environmental *regulation*" in the state/federal sense; the concrete evidence that actually exists in campaign materials is about conservation *actions* and infrastructure *investment* (land acquisition, green-space programs, water-quality/septic-to-sewer projects) — none of which is "regulation." Under the narrow current definition, real, concrete, well-sourced conservation evidence (Shannon Martin's row 5) reads as off-target, which is exactly why it was rejected.

**C. Proposed revised definition** — `+`: Evidence of stronger environmental protection, conservation, or public investment (land/green-space acquisition and preservation, water-quality or conservation infrastructure investment, stronger environmental standards, opposition to rollbacks). `-`: Evidence of weaker environmental protection/investment (reduced conservation funding, rule rollbacks, deprioritizing conservation land in favor of development, opposition to conservation spending).

**D. Evidence thresholds** — `+2`/`-2`: a concrete, specific, funded/ongoing program or acreage/infrastructure figure (e.g., "280+ acres acquired for a green-space land bank," a named water-quality/septic-to-sewer program). `+1`/`-1`: a general supportive/opposed stance or a single smaller specific action without an ongoing programmatic commitment. `0`: mixed. `null`: no environment-specific evidence.

**E. Exclusions** — Single-parcel conservation actions used *only* to infer a `growth_development` score (cross-reference — the reverse direction of dimension 1's exclusion). Generic "I care about the environment" statements without a specific action/program/figure. State/federal environmental positions not tied to a local action.

**Special review point resolution** — Broadened as specified: protection/conservation/public investment, not only "regulation."

---

### 5. `public_safety`

**A. Current definition** — `+`: More public safety budget. `-`: Less public safety budget.

**B. Problem analysis** — "Budget" alone is too narrow a word but roughly the right *concept*; the real gap is that it doesn't distinguish concrete resource/program/infrastructure evidence from generic "I support law enforcement" branding, which is near-universal, non-falsifiable campaign rhetoric that every local candidate uses regardless of actual policy substance. An outcome claim like "safest city for 13 years" is also not itself a policy commitment — it's a result, not a position — and must not be used as a scoring proxy.

**C. Proposed revised definition** — `+`: Concrete evidence of increased public-safety resources — staffing, facilities, technology, new districts/coverage areas, or an explicit budget increase. `-`: Concrete evidence of reduced resources — budget cuts, staffing cuts, department consolidation/reduction, or explicit reallocation away from public safety.

**D. Evidence thresholds** — `+2`/`-2`: multiple concrete, named resource/infrastructure investments, or an explicit budget-increase/decrease figure. `+1`/`-1`: a single concrete but smaller resource commitment. `0`: mixed. `null`: generic "supports law enforcement"/"law and order"/safest-city-ranking rhetoric with no named resource, staffing, facility, or budget commitment.

**E. Exclusions** — Generic "standing with law enforcement," "safest city" ranking claims, "law and order" slogans, police-union endorsements — none of these alone. Crime-rate/outcome statistics presented without a specific resource/policy action attached.

**Special review point resolution** — Broadened to resources/enforcement investment generally, not literally "budget" alone, but with an explicit, sharp line excluding generic supportive rhetoric from concrete resource evidence.

---

### 6. `housing`

**A. Current definition** — `+`: More government housing intervention. `-`: Less government housing intervention.

**B. Problem analysis** — The binary government-intervention framing is already reasonably clear and should hold up for both campaign statements and a future actual zoning/subsidy vote. No Gate I39/I45 evidence exists for Shannon Martin (matching the prior finding of no confirmed housing coverage for the four City Council District 1 candidates either) — the definition is essentially untested against real evidence so far.

**C. Proposed revised definition** — `+`: Explicit support for government action to increase housing supply/affordability (subsidies, inclusionary zoning, density allowances for housing, direct building programs, affordable-housing funding). `-`: Explicit support for reducing government housing intervention (opposing subsidies/mandates, favoring market-driven housing policy, restricting multi-family/affordable development).

**D. Evidence thresholds** — `+2`/`-2`: a specific named program, ordinance, or funding commitment. `+1`/`-1`: a clear directional stance without a specific mechanism. `0`: mixed. `null`: generic "housing affordability matters" statements with no policy mechanism.

**E. Exclusions** — Candidate's own housing/real-estate background or property ownership. Growth-development evidence used as a stand-in for a housing position (the two are related but distinct — a growth-permissiveness stance is not automatically a housing-intervention stance).

---

### 7. `transparency`

**A. Current definition** — `+`: More disclosure required. `-`: Less disclosure required.

**B. Problem analysis** — Too narrow/legalistic in wording (reads like open-records/sunshine-law policy specifically) but the real gap is the opposite failure mode from the others: campaign materials mostly produce *engagement* evidence (newsletters, town halls, "coffee with the mayor" events), which is not the same thing as a substantive disclosure/access *policy* commitment, and the current definition doesn't explicitly exclude the weaker category. That's exactly what produced the rejected row 8.

**C. Proposed revised definition** — Two evidence tiers. **Tier A (scoreable):** open-records/public-access policy, proactive publication of budgets/contracts/meeting materials, livestreaming/recording of government meetings, ethics/lobbying disclosure requirements, whistleblower protections. **Tier B (excluded — see below):** generic constituent engagement/outreach (newsletters, town halls, social media presence, "coffee with"-style events). `+`: concrete Tier-A evidence of expanding openness/disclosure/access, or opposing a reduction to it. `-`: concrete Tier-A evidence of restricting access/disclosure or increasing closed-door process.

**D. Evidence thresholds** — `+2`/`-2`: a specific named disclosure/access policy or reform. `+1`/`-1`: a clear directional Tier-A stance without a named policy. `0`: mixed. `null`: Tier-B engagement/outreach evidence only, with no Tier-A policy commitment attached.

**E. Exclusions** — Generic constituent outreach/engagement (newsletters, forums, social media, "open communication" language) used *alone*, with no specific disclosure/access/records policy attached. General "I believe in transparency" sloganeering.

**Special review point resolution** — Broadened to include openness/disclosure/public access/government transparency generally, **but** generic constituent engagement alone is explicitly excluded from ever producing a non-null score, exactly as instructed.

---

## Re-evaluation of the 8 Gate-I45 Shannon Martin rows (no new model call)

| # | Dimension | Original score | Decision | Revised score | Reason | `conflict_flag` |
|---|---|---|---|---|---|---|
| 1 | growth_development | +1 | **NULL** | — | "Shaping smart, responsible growth" / "not about unchecked development" is generic, boilerplate growth-policy framing with no concrete permissiveness commitment (no named ordinance, incentive, or streamlining action). Fails the revised concrete-commitment threshold for any non-null score. | **false** (no longer a scoreable claim to conflict with) |
| 2 | growth_development | -1 | **NULL** (under this dimension) | — | This evidence (acquiring the 105-acre Rosser Lakes Preserve to prevent development) is a single-parcel land-conservation action, not a growth-policy statement. Per the revised Exclusions for `growth_development`, single-parcel conservation actions are excluded from this dimension entirely — this is a dimension-mapping issue, not a scoring-magnitude issue. *(This same quote independently supports `environment` under the revised definition — see note below; no new row is created here, since this gate makes no model call and does not fabricate new rows.)* | **false** |
| 3 | taxation_spending | +2 | **KEEP** | +2 | Concrete, specific, recurring-metric evidence (ten consecutive years of millage reduction; municipal tax rate among the lowest of the state's 20 largest cities). Meets the +2 concrete-fiscal-trend threshold under both the current and revised definitions. No spending-increase claim present in this row, so no internal-axis contradiction arises. | false (unchanged) |
| 4 | taxation_spending | +2 | **KEEP** | +2 | Same fiscal-trend evidence (ten consecutive years of millage reduction, reduced city debt) from the biography page. Meets the +2 threshold; no contradiction. | false (unchanged) |
| 5 | environment | +1 | **REVISE** | **+2** | Under the broadened environment definition (protection/conservation/investment, not only "regulation"), this row combines a named ongoing program (Naturally PSL), a specific acreage figure (280+ acres for a green-space land bank), and named infrastructure investment (water-quality projects, septic-to-sewer conversion) — multiple concrete, named, funded commitments, which meets the +2 threshold rather than the +1 "general supportive stance" tier it was scored at under the narrower "regulation-only" framing. | false (unchanged) |
| 6 | public_safety | +1 | **NULL** | — | "Standing with Law Enforcement," "Safest Large City... 13 consecutive years," "unwavering support... firm stance on law and order" is generic, non-falsifiable public-safety branding rhetoric with no named budget, staffing, facility, or program commitment. The "safest city" ranking is an outcome claim, not a policy commitment, and is explicitly excluded from being used as a scoring proxy under the revised rubric. | false (unchanged) |
| 7 | public_safety | +2 | **KEEP** | +2 | Concrete, specific, multi-item resource/infrastructure investment evidence (new Districts 5 & 6 police districts, the Police Training Facility, the Real Time Operations Center). Clearly meets the top threshold under both the original and the revised (broadened resource-investment) definition — the strongest, least ambiguous evidence row in the full set. | false (unchanged) |
| 8 | transparency | +1 | **NULL** | — | "Actively engages residents... e-newsletters... community forums... open communication" describes constituent-outreach/communication style (Tier B, explicitly excluded), not a concrete open-records, public-meeting-access, or disclosure-policy commitment (Tier A, the only scoreable tier under the revised, narrowed-to-substance definition). | false (unchanged) |

**No duplicate rows were silently averaged.** Rows 1–2 and rows 3–4 are two independent per-source rows on the same dimension each; each retained its own independent decision rather than being merged into a single averaged value.

---

## Direct answers to the report's specific questions

**Does the growth_development conflict still appear genuine?** **No.** Under the revised definitions, the apparent conflict dissolves entirely: row 1 was too vague/boilerplate to safely score in either direction, and row 2 was concrete evidence for a *different* dimension (`environment`) that had been mapped onto `growth_development` by the extraction pass. This was not a case of the candidate genuinely holding two contradictory growth-policy positions — it was one under-specified claim plus one mis-mapped claim. Post-revision, there is no growth_development evidence for this candidate from these three source pages at all (both rows null); `conflict_flag` should be `false` for both.

**Should `taxation_spending` remain one combined dimension?** **Yes, for now.** The seven dimension keys are locked project-wide (CLAUDE.md), so splitting into separate `taxation`/`spending` keys would be a schema-level change out of scope for this gate and would also touch the locked Civic DNA quiz model — it would need its own, separately-approved gate. The tightened net-fiscal-posture definition, combined with an explicit "don't average — hold at 0 and flag `conflict_flag: true` for human review" rule for any single piece of evidence that contains both a tax-cut claim and an explicit new-recurring-spending claim, is the interim mitigation. No contradiction actually arose in the Gate I45 evidence set (both approved rows are pure tax/millage-rate evidence), so this mitigation was not exercised here, but remains untested against a real conflicting-evidence case.

---

## Unresolved dimension-design decisions (require separate explicit approval before use in any real scoring)

1. **`taxation_spending` combined-axis risk** — mitigated by the tightened definition and a conflict-escalation rule, not structurally resolved. A future schema-level split into two dimensions remains a possible, larger, separately-approved change.
2. **Cross-dimension evidence mapping** (the Rosser Lakes Preserve quote correctly supporting `environment` but having been extracted under `growth_development`) — no correction mechanism exists yet. A future re-extraction pass would need either a prompt update instructing the model to route conservation-only evidence to `environment`, or a post-hoc human/reviewer step that can move a quote to a different dimension. Not designed or implemented here.
3. **"Outcome claims are not policy claims" rule** (e.g., a "safest city" ranking cannot be used as `public_safety` evidence) — this is a new interpretive rule introduced in this gate, not previously codified anywhere in the project. It needs its own explicit approval before being applied to any real scoring, the same as the rest of this package.
4. **`education`/`housing` definitions remain untested** — no real evidence exists yet for either dimension from any candidate reviewed so far (matches the Gate I13/I18 finding for the four City Council District 1 candidates, now also true for Shannon Martin across the three checked pages). The revised definitions above are a best-effort design, not a validated one.
5. **`education` confidence-capping rule** (cap at `medium` for a City-level candidate discussing School-Board-controlled funding without a named city-level mechanism) — a new rule, not previously approved.

None of the above are approved by the existence of this document. This gate proposes; it does not adopt.

## No-change confirmation

No Anthropic/Claude API call was made. No Supabase write was performed. No `candidate_position_evidence` row was created. No `candidate_positions` row was created or modified. No `match_scores` row was created or modified. `ENABLE_CAMPAIGN_EVIDENCE_EXTRACTION` remains `false` (untouched by this gate). `Reference Files/CIVICMARKET_PATCH_MAY12.md` and the seven locked dimension keys were not modified. No application source code was changed. No deployment occurred. No commit or push was performed by this gate.
