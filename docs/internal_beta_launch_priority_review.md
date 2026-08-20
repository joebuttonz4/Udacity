# CivicMarket — Beta Launch Priority Review

Date: 08-20-2026
Timestamp: 06:02 pm EST

Status: **Read-only project inspection + documentation review + prioritization.** No Supabase write. No schema/RLS/function change. No `candidate_positions`/`match_scores` change. No deployment. No Anthropic/Gemini call. No implementation work started.

## Sources used

Primary: `docs/controlled_psl_beta_readiness.md` (Milestone 2B, 08-18-2026 — the current beta-readiness source of truth), `CIVICMARKET_CURRENT_STATE.md` (through the Shannon pilot completion and the concurrent ballot-eligibility/candidate-import work), `docs/internal_beta_shannon_candidate_evidence_return_handoff.md`, `docs/candidate_import_package_a_execution_ready.md` (+ Package B/C), `docs/ballot_eligibility_representation_phase_1.md` section referenced from current-state. `docs/beta_launch_readiness_plan.md` (July 9, 2026) is superseded by Milestone 2B and was not used as authoritative. Historical per-gate documents were not individually re-read except where a current blocker required it.

---

## Current beta readiness summary

CivicMarket is not yet deployed anywhere; "beta" so far means local/dev-verified behavior only. Two independent workstreams have been running in parallel and are both current as of today: (1) this session's Shannon Martin campaign-evidence pilot, now complete end-to-end, and (2) a concurrent session's ballot-eligibility/candidate-import work, which fixed a real citywide/countywide voting-scope bug and imported 10 more real candidates (11 → 21 total). Milestone 2B's readiness checklist remains the authoritative pre-deploy list; one of its five items (corrections-mailbox deliverability) is already resolved and should be treated as closed, not open.

---

## Phase 2 — Area-by-area status

| Area | Status | Basis |
|---|---|---|
| A. Authentication / onboarding | **PASS** (app-level) | Proven end-to-end locally (Milestone 1, fresh account). Deploy-time piece (Supabase Auth URL config) is separately tracked under P — not an app defect. |
| B. District assignment | **PARTIAL** | City Council D1/D3 verified-lookup flow built and proven live in both directions (Gate I34); write guard intentionally `false`. County Commission flow built, disabled. School Board / FL House / FL Senate have no verified-lookup flow yet — deferred by design (missing data preferred over guessed data). |
| C. Ballot eligibility / representation logic | **PASS** | `Ballot Eligibility Phase 1` + its School Board anchor correction, both live-verified today: citywide (City Council/Mayor), countywide (County Commission, School Board) expansion now correct; FL House/Senate correctly stay exact/absent rather than guessed. |
| D. Current Officials personalization | **PASS** | Established and stable across many prior gates (B2 fix, City Council D1/D3 personalization) — not re-verified this session, no reason to suspect regression. |
| E. Candidate data completeness | **PARTIAL** | 21 real candidates now live (Package A executed today, verified PASS: +3 districts, +10 elections, +10 candidates). Package B (Mayor/D1/D3/County-D4/School-D1/D5 post-certification reconciliation) is designed but explicitly **not authorized for execution** until county certification (no later than Aug 26, 2026). Package C (statewide) is draft-only. |
| F. Candidate evidence / `candidate_positions` / match scoring | **PARTIAL** | Pipeline fully built, proven, and verified end-to-end for exactly **one** candidate (Shannon Martin: 5 evidence rows, 1 `candidate_positions` row, verified match score 66). The other 20 candidates have zero evidence and zero `candidate_positions` — fully, honestly locked per the established "no score over an unsupported score" policy (Gate I12–I18), not a bug. |
| G. Ballot / election data | **PARTIAL** | Election rows exist for all current real races. District 1's `election_date` cannot represent PSL's majority/runoff structure in a single column (Milestone 2B Item 1) — a display-precision issue, not a safety/correctness blocker; does not affect candidate visibility or scoring. |
| H. Measures / legislation | **DEFERRED (data)** | Zero real ballot measures exist in the database (standing, intentional CLAUDE.md data limit). UI/read path works correctly with none present. |
| I. Civic DNA quiz / profile | **PASS** | Established and stable; not re-verified this session, no known open issue. |
| J. Reviews / community features | **PASS (not re-verified this session)** | Prior dedicated verification gates exist (Gate I4a, I5a); relying on that documented history rather than re-reading, per instruction to avoid unnecessary historical re-reads. |
| K. Corrections / reporting flow | **PARTIAL** | Candidate-profile report flow is DB-backed and works. Measure-profile and static Corrections-page flows use a temporary monitored mailbox (`joebuttonzii@gmail.com`, fixed 08-18-2026, replacing a nonexistent placeholder domain) — resolved for beta, but the two-mechanism inconsistency (DB-backed vs. mailto) remains a known, accepted, non-blocking gap. |
| L. Admin / records tooling | **PASS** | Established (admin entry + two-step-delete records review), not re-verified this session, no known open issue. |
| M. Funding data | **PASS** | Imported with SOE source URLs, long-standing completed item. |
| N. Mobile usability / core UI readiness | **PARTIAL** | Public pages tested live at ~500px width, no overflow/clipping. **Four auth-gated screens were never live-tested at true mobile width**: onboarding-complete/calculating, Ballot, Profile, `/profile/city-council-district` (Milestone 2B Item 4 — genuine, disclosed coverage gap, not a fabricated pass). |
| O. Build / lint / test health | **PASS** | `npm run build` has passed consistently through every gate this session (28 routes). `npm run lint` has only the same 5 known pre-existing, non-blocking `scripts/*.cjs` errors throughout. |
| P. Deployment / readiness | **BLOCKED** | No deploy target/domain exists yet. Supabase Auth **Site URL**/**Additional Redirect URLs** cannot be set until one does — this blocks real invite-code and email-confirmation verification, which are inherently deploy-time checks. |
| Q. Gemini migration | **BLOCKED (not started)** | See dedicated section below. |

---

## Candidate coverage (Phase 3)

- **Total candidates in the system:** **21** (11 baseline + 10 from today's executed Package A: County Commission D2/D4, FL House D84/D85-adjacent races, City Council D3 completions).
- **Candidates currently represented in the app (visible on ballot/profile):** all 21 — visibility does not require evidence or `candidate_positions` (established, deliberate design — locked candidates are never hidden).
- **Candidates with `candidate_position_evidence`:** **1** (Shannon Martin, 5 `human_reviewed` rows).
- **Candidates with `candidate_positions`:** **1** (Shannon Martin).
- **Candidates capable of producing a `match_scores` row today:** **1** (Shannon Martin) — confirmed structurally: `compute-match-scores` skips any candidate without a `candidate_positions` row, with no minimum-dimension threshold and no error.
- **Candidates still fully locked:** **20**.

**Is Shannon-only unlock acceptable for internal beta but not controlled external beta?** Yes, with a distinction: it is **fully acceptable and currently in effect** for internal beta (trusted admin/test accounts only, no real invites sent) — the app already handles this honestly (locked-ring copy, no fabricated scores, no crashes). For a **controlled external beta** (real invited residents), 1-of-21 candidates scored is not a safety defect — the locked-ring design is explicitly built for exactly this situation — but it is a **product-thinness concern**: most invitees would see an entirely locked ballot. This argues for broadening coverage before or during the first external wave, not as a hard blocker to it.

**Classification: scaling the evidence pipeline to remaining candidates is SAFE TO CONTINUE DURING INTERNAL BETA, not CRITICAL BEFORE BETA** — because (a) the locked-ring UI is proven safe with partial coverage, and (b) internal beta is already effectively running today with exactly this state. It becomes a **P1 product-completeness priority** once a real external invite wave is being planned, not a P0 correctness blocker.

---

## Gemini migration review (Phase 4)

Full route: `src/app/api/admin/extract-shannon-martin-evidence/route.ts` (soon to be candidate-generic, not Shannon-specific, once scaled).

- **Exact provider-specific code:** isolated to one block — the `fetch('https://api.anthropic.com/v1/messages', {...})` call (headers `x-api-key`/`anthropic-version`, body `model`/`max_tokens`/`thinking`/`system`/`messages`) and the immediately-following response-shape parsing (`anthropicJson.content[]`, `stop_reason`, block `.type === 'text'`, the `responseDiagnostics` fields sourced from that shape). This is roughly 60 lines.
- **What remains provider-agnostic (no change needed):** source fetching (`fetchSourceText`/`htmlToText`), the entire prompt text (`buildSystemPrompt`/`buildUserPrompt` — these are plain strings, not API-shaped), `normalizeModelJson` (operates on the extracted text string regardless of origin), the growth_development parcel-specific guardrail, `validateEvidenceRow`, `crossCheckConflicts`, and the whole `candidate_position_evidence` JSON schema/validation layer. None of this reads or depends on the Anthropic response envelope.
- **Expected Gemini replacement scope:** swap the one fetch block for a Gemini `generateContent` call (different endpoint, different auth header, `contents`/`parts` request shape instead of `messages`, `generationConfig` instead of `max_tokens`, Gemini's own thinking/reasoning config instead of `thinking: {type: 'disabled'}`), and rewrite the response-parsing block for Gemini's shape (`candidates[].content.parts[].text`, `finishReason` instead of `stop_reason`, `usageMetadata`). The `responseDiagnostics` field names can likely stay the same conceptually (stop reason, block count/types, text lengths) with provider-specific values mapped in.
- **Can extraction schema/validation remain unchanged?** **Yes** — confirmed by the isolation above. The JSON contract sent to and expected back from the model (`candidate_id`, `methodology_version`, `evidence[]` with the locked dimension/score/confidence/conflict fields) is prompt-defined, not provider-defined.
- **Do model-output parsing rules need adaptation?** Only the markdown-fence-stripping assumption (`normalizeModelJson`) should be re-validated against Gemini's actual output style — Gemini may or may not fence JSON differently than Anthropic did pre-Gate-I41; this needs a real regression call to confirm, not a code change made blind.
- **Is one Shannon regression test sufficient before switching production extraction provider?** **Yes, as a minimum bar** — because the existing deterministic validation/guardrail layer already independently re-checks any model's output (fence normalization, dimension/score/confidence shape, the negative-growth parcel guardrail, conflict canonicalization) regardless of which provider produced it, and a known-good baseline (today's verified Shannon result) already exists to compare against. One clean regression pass confirms the integration works; it does not by itself prove prompt-quality parity across many candidates — that would emerge naturally as coverage scales in Milestone 3 below.

**Classification: PRE-BETA HARD BLOCKER**, per the standing directive that Gemini migration is required before beta launch. Scope is genuinely small (one isolated ~60-line block plus one regression call) — **complexity: SMALL**.

---

## Prioritized blocker list (Phase 5)

### P0 — must fix before any controlled beta user

| Issue | Why it matters | Current evidence/state | Next action | DB write approval? | Complexity |
|---|---|---|---|---|---|
| No deploy target / domain | Nothing else in this list (Auth URL config, real invite-code test, real email-confirmation test) can be verified without one | Confirmed absent (Milestone 2B Item 5/6) | Choose/provision hosting + domain | No | MEDIUM (external/infra, not code) |
| Supabase Auth URL configuration | Email-confirmation links won't return users to the app correctly without it | Site URL/Redirect URLs unset; no code defect, dashboard-only | Set Site URL + Additional Redirect URLs once domain exists; confirm email-confirmation toggle still ON | No (Supabase dashboard, not app DB) | SMALL |
| Invite-code + email-confirmation behavior against the real deployed environment | Inherently a deploy-time check; can't be substituted by local dev | Code proven locally (May 2026); never tested against a real deploy | One real signup attempt post-deploy with the production `INVITE_CODE` | No | SMALL (verification only) |

### P1 — must fix before broader beta launch

| Issue | Why it matters | Current evidence/state | Next action | DB write approval? | Complexity |
|---|---|---|---|---|---|
| Gemini migration for candidate-evidence extraction | Standing requirement before beta launch; also determines whether further candidate extraction work should wait | Not started; scope fully mapped (see above) | Implement the isolated fetch/parse swap, run one Shannon regression call | No (code change; the regression call itself is a model call, not a DB write) | SMALL |
| Mobile smoke test, 4 auth-gated screens | Real, disclosed coverage gap on exactly the screens a real invitee will actually use first | Public pages pass at ~500px; onboarding-complete, Ballot, Profile, City Council verification page never tested at true width | One manual real-device/DevTools-responsive-mode pass, signed in | No | SMALL |
| Candidate-evidence coverage (20 of 21 candidates locked) | Product thinness for a real external invite wave, not a safety defect | Pipeline proven 1-for-1 on Shannon; fully repeatable | Repeat the Gate I38→I47 pattern per additional candidate with available first-party sources | **Yes, per-candidate** (same gated pattern as Shannon) | MEDIUM–LARGE (scales with candidate count) |

### P2 — acceptable during beta / can follow shortly after

| Issue | Why it matters | Current evidence/state | Next action | DB write approval? | Complexity |
|---|---|---|---|---|---|
| City Council write guard remains `false` | Beta invitees get no City Council district/ballot content/Current Official unless enabled; confirmed to render safely either way | Milestone 2B: technically ready to enable, product decision deferred to user | User decision: enable for first wave or hold | No (a code-constant flip + deploy, not a DB write) | SMALL |
| Package B (post-certification candidate reconciliation) | Time-gated by real-world election certification, not a code/design gap | Fully designed, explicitly not authorized to execute yet | Wait for certification (≤ Aug 26, 2026), then execute under its own approval gate | Yes, when its own gate is approved | SMALL (design already done) |
| District 1 election-date single-column limitation | Display precision only; does not affect candidate visibility, voting-record, or locked-ring behavior | Root-caused (PSL majority/runoff), no fix applied | Decide data-model approach (separate primary/general columns, or wait for outcome) once convenient | Yes, once decided | SMALL |
| Candidate-profile vs. measure-profile "Report an Inaccuracy" inconsistency | Cosmetic/process inconsistency, not a defect | One DB-backed, one mailto (temporarily fixed) | Decide whether to unify on the DB-backed flow | Maybe (if unified) | SMALL |

### P3 — post-beta

- Resolving the District 1 election-date schema limitation properly once the real 2026 outcome is certified.
- Enabling `ENABLE_CITY_COUNCIL_DISTRICT_WRITE` for real (non-test) users, if not already decided at P2.
- District 3 user-assignment/Current-Officials expansion beyond what's already proven-but-disabled.
- Package C (statewide candidates/races) — draft only, no near-term product need identified.
- `src/app/privacy/page.tsx`'s dangling "contact us at the email below" reference with no actual email present (found, not yet fixed, out of scope of every task that has touched this area so far).

---

## Recommended work sequence (Phase 6)

1. **Deploy-readiness closeout** — goal: get a real domain + Supabase Auth URL config + one real signup verification done. Files/areas: infra/dashboard only, no app code. DB write: no. Stop boundary: choosing/paying for hosting is the user's own action; Claude's role is verification only. Completion: a real signup + confirmation email round-trip succeeds against the deployed domain.
2. **Gemini migration** — goal: swap the isolated Anthropic-specific block for Gemini, prompt/schema/validation untouched, one Shannon regression call. Files: `src/app/api/admin/extract-shannon-martin-evidence/route.ts` only. DB write: no (regression call produces draft output only, same zero-write pattern already established). Stop boundary: the one explicitly-approved Gemini API call. Completion: regression call structurally matches the Anthropic-era result shape and passes the same validation/guardrail layer.
3. **Mobile smoke test on the 4 remaining screens** — goal: close Milestone 2B Item 4's disclosed gap. Files: none (verification only). DB write: no. Stop boundary: none needed, read-only. Completion: all four screens confirmed no-overflow/no-clipping at true ~390px width, signed in.
4. **Scale candidate-evidence pipeline (batch 1)** — goal: repeat the proven Gate I38→I47 pattern for the next tranche of real candidates with available first-party sources (likely the remaining City Council D1/D3 and Mayor candidates first, since their districts are already fully modeled). Files: same extraction route (now Gemini-based) + new per-candidate gate docs, following the established source-verification → extraction → human-review → aggregation → write pattern. DB write: **yes, per candidate, each its own explicit approval** (mirrors Shannon exactly). Stop boundary: each candidate's own write-approval statement, same as Gate I43/I46. Completion: additional candidates have verified `candidate_positions` rows and produce correct match scores.
5. **First controlled external invite wave** — goal: actually invite real residents. Prerequisite: milestones 1–3 complete at minimum; milestone 4 in progress or complete is strongly recommended for product value but not a hard gate. Files: none (operational action). DB write: no (inviting is not a DB write in this app's model — it's sending real invite codes to real people). Stop boundary: **explicit user decision to send real invites** — the single highest-stakes, most irreversible action in this whole sequence. Completion: first real user successfully onboards.
6. **Package B execution** (post-certification, ≤ Aug 26, 2026) — goal: reconcile Mayor/D1/D3/County-D4/School-D1/D5 per the already-designed package. Files: SQL only, already drafted. DB write: yes, its own gate. Stop boundary: certification date + explicit approval. Completion: verified per Package A's own pattern.
7. **Post-beta cleanup batch** — goal: address the P3 list once real beta feedback exists to prioritize against. Not scheduled yet.

### Direct answers

1. **Should we scale candidate evidence to all remaining beta candidates next?** Not "all at once" — start a first batch (Milestone 4) once Gemini migration (Milestone 2) is done, so new extraction work isn't done twice on two different providers. It is not required before internal beta (already running) but should happen before or alongside the first external invite wave.
2. **Should Gemini migration happen before or after scaling candidate evidence?** **Before.** Extracting more candidates on Anthropic now and re-doing them on Gemini later duplicates real work and real cost for no benefit; the migration itself is small (SMALL complexity) and low-risk given the existing validation layer.
3. **What is the single most important blocker right now?** **No deploy target exists yet** — it blocks the entire P0 list (Auth URL config, real invite-code test, real email-confirmation test) and is the actual critical path to any real controlled beta user, ahead of even the Gemini migration.
4. **What can safely be deferred until after internal beta starts?** Everything in P2/P3: the City Council write-guard decision, Package B (time-gated anyway), the election-date data-model fix, the report-inaccuracy unification, and all P3 items. Internal beta itself needs none of these — it is already running today in its current form.

---

## Exact next milestone

**Milestone 1 — Deploy-readiness closeout** (choose/provision a real deploy target and domain, then complete the Supabase Auth URL configuration and one real signup/confirmation verification against it). This is the single highest-priority next action: every other P0 item is downstream of it, and internal beta can continue unaffected in parallel while it happens.

## No-change confirmation

No Supabase write. No schema/RLS/function change. No `candidate_positions`/`match_scores` change. No deployment. No Anthropic/Gemini call. No implementation work started. This is a documentation/prioritization review only.
