# Gate I38 — Shannon Martin Campaign-Website Source Verification

Status: **PASS.** Source verification and documentation only. No evidence was created, no scoring occurred, no database write was performed.

Date: 08-16-2026
Timestamp: 11:47 am EST

## Purpose

Determine, through independent live verification (not reliance on any prompt-stated claim alone), whether `https://martinforpslmayor.com/` is a genuine candidate-controlled campaign source eligible for the approved `source_type` value `campaign_website` in the `candidate_position_evidence` table created in Gate I37. This gate performs verification and observation only — it does not create evidence rows, assign scores, or modify `candidate_positions`/`match_scores`.

## Candidate identity

- Name: Shannon Martin
- `candidate_id`: `d44ff05a-14af-45c2-9f2f-6d530a8a051e`
- Office: Port St. Lucie Mayor (incumbent)

## Verification result

**PASS.** The site resolved successfully, identifies Shannon Martin by name as a candidate for Port St. Lucie Mayor, carries an independently confirmed campaign-ownership disclaimer, and contains substantive first-party policy-adjacent material.

## Verified campaign URL(s)

Homepage (primary verified source):
- `https://martinforpslmayor.com/`

Substantive first-party subpages (also verified, contain policy-adjacent material beyond logistics/events):
- `https://martinforpslmayor.com/about-shannon-martin/`
- `https://martinforpslmayor.com/biography/`

Other pages exist on the site (`/endorsements/`, `/events/` and its sub-event pages, `/volunteer/`, `/contact/`, `/donate`, `/privacy-policy-2/`) but are not proposed as evidence sources — endorsements in particular remain a prohibited inference source regardless of first-party hosting (see Prohibited Inferences below). No dedicated "Issues" or "Platform" page exists on this site; policy-adjacent content is distributed across the homepage and the two subpages above.

## Candidate-control / ownership evidence

The standard Florida campaign-disclaimer phrase was independently found, verbatim, on **two separate pages**:

- Homepage: "Paid for and Approved by Shannon Martin for Port St. Lucie Mayor."
- `/about-shannon-martin/` footer: "Copyright © 2026 Paid for and Approved by Shannon Martin for Port St. Lucie Mayor."

This matches the same disclaimer convention already accepted as ownership evidence for the four City Council District 1 candidate sites in Gates I13/I18. Appearing consistently on multiple pages, rather than as a single isolated fragment, supports genuine campaign control. The site is also a professionally built, dedicated campaign site (custom branding, navigation, event listings, volunteer recruitment, donation integration) rather than a generic or placeholder page.

## Apparent dimension coverage (no scores assigned)

Observed, not scored. No -2..2 value was assigned to anything below, and none should be inferred from this document alone.

**Potentially supported by first-party campaign material:**

| Dimension | Basis observed |
|---|---|
| growth_development | "smart, responsible growth," Crosstown Parkway extension/bridge, "economic growth isn't about unchecked development—it's about creating opportunity" |
| taxation_spending | "hold the line on taxes," "lowered the millage rate for ten consecutive years," "disciplined, responsible budgeting," "reduced its overall debt" |
| environment | Rosser Lakes Preserve (105-acre) acquisition to prevent residential development; Naturally PSL land-acquisition program, "over 280 acres acquired in the past year" |
| public_safety | "Florida's Safest Large City for 13 consecutive years," "firm stance on law and order," support for law enforcement |
| transparency | "Mornings with Mayor Martin," monthly e-newsletters, community forums, explicit "commitment to transparency, public involvement... and open communication" |

**Unsupported / insufficient first-party campaign evidence:**

| Dimension | Finding |
|---|---|
| housing | The only reference found is biographical/affiliational ("Former board member of the PSL Affordable Housing Committee") — a role/affiliation fact, not a policy statement. Biography-alone is an explicitly prohibited inference source (see below), so this does not count as coverage. |
| education | No explicit statement found on any of the three pages checked. |

**Explicitly documented:**
- Housing must remain unsupported/null unless later eligible first-party evidence (an explicit policy statement, not a biographical affiliation) is found and separately verified.
- Education must remain unsupported/null unless later eligible first-party evidence is found and separately verified.
- Neither position may be inferred from silence — the absence of statements on these two dimensions is not itself evidence of a position.
- A future extraction pilot must not force a 7-of-7 candidate position profile for Shannon Martin. A 5-of-7 profile (or fewer, pending review) is the correct and expected outcome given current evidence.

## Prohibited inferences

Any future extraction or scoring gate must not infer a candidate position from:
- Party affiliation
- Endorsements
- Donors
- Biography alone
- Silence
- Associations
- Third-party descriptions

This rule is why the Housing "board member" reference above is explicitly excluded from the supported-dimension list despite appearing on a first-party page — it is biographical/affiliational, not a stated policy position.

## Methodology version

Approved methodology version for any future evidence rows derived from this source: `campaign_evidence_v1_2026-08`. Not a database default — every future insert must state it explicitly, per Gate I37's schema design (`methodology_version text NOT NULL`, no column default).

## Source boundary — what this gate approves and does not approve

This gate approves Shannon Martin's verified campaign website (`https://martinforpslmayor.com/` and the two verified subpages above) as an eligible `campaign_website` source for a **future extraction pilot only**.

It does **not** approve:
- Evidence inserts into `candidate_position_evidence`
- Any -2 to +2 score
- `candidate_positions` updates
- `match_scores` updates
- Anthropic API calls
- Interview ingestion
- `official_social` ingestion
- Social-media allowlist creation

`official_social` remains a valid schema `source_type` value only — actual ingestion stays deferred pending a separate, not-yet-designed and not-yet-approved candidate-source allowlist mechanism.

## No-change boundaries

No file was created or edited except this document and the corresponding `CIVICMARKET_CURRENT_STATE.md` entry. No `candidate_position_evidence` row was inserted. No `candidate_positions` row was created or modified. No `match_scores` row was created or modified. No Supabase write of any kind was performed. No SQL was executed. No Anthropic/Claude scoring call was made — the page-content extraction used to read and quote the site was a read-only summarization utility, not a scoring or classification step. No application source code was changed. No schema, RLS, grants, policies, migrations, or seeds were changed. `ENABLE_CITY_COUNCIL_DISTRICT_WRITE` and `ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE` were not touched and remain `false`, unrelated to this gate. No deployment occurred. No commit or push was performed as part of this gate.

## Risk Check

- **Scope:** Read-only live verification of one candidate's campaign website (homepage plus two subpages). No scoring, no evidence rows, no database writes.
- **Result:** PASS — genuine, disclaimer-confirmed, candidate-controlled site with substantive first-party content on 5 of 7 dimensions; 2 of 7 (Housing, Education) explicitly remain unsupported.
- **No-change boundaries:** held in full — see above.
- **Source reliability limitations:** page content was extracted via a summarization utility that converts fetched HTML into a natural-language report rather than returning raw HTML; quoted text was independently cross-checked across separate fetch calls per page to reduce (not eliminate) transcription risk. A future extraction gate should re-verify exact wording directly against the live page before recording any `candidate_position_evidence` row, since site content is mutable and may change between this verification and a future extraction pass.
- **Next test:** none required to close Gate I38 itself. The next gate should design the extraction/review methodology (what counts as a sufficiently explicit statement, how partial-coverage candidates like this one are handled, the human-review workflow) before any row is written.

## Recommended next gate

**Gate I39 — Controlled Shannon Martin campaign-evidence extraction pilot.**

Gate I39 should:
- Use only the already-verified campaign website (`https://martinforpslmayor.com/` and the two verified subpages above) as its source.
- Inspect only the five potentially-supported dimensions (growth_development, taxation_spending, environment, public_safety, transparency).
- Return structured **draft** evidence (proposed score, rationale, exact source URL per dimension) for human review — not a final, inserted record.
- Leave Education and Housing null/unsupported; do not force coverage for either.
- Preserve the exact source URL and a written rationale for each proposed score, so a human reviewer can verify against the live page.
- Not insert anything into Supabase until the draft output is separately reviewed and explicitly approved in its own gate.

Gate I39 was not designed or implemented by this document — it is recorded here only as the recommended next step.
