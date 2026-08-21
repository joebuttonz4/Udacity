# Gemini Candidate-Evidence Migration

Date: 08-20-2026

Status: **Gemini implementation complete, offline-tested, not live-tested. Default provider remains Anthropic. No live Gemini API call has been made. No Supabase write. No deployment.**

This is a required pre-beta item: replace the current Anthropic/Claude candidate-evidence extraction path with Gemini before Controlled Beta, without redoing candidate research, scoring architecture, or any stored `candidate_position_evidence` data.

## 1. Previous Anthropic architecture

The only place Anthropic was ever called from is `src/app/api/admin/extract-shannon-martin-evidence/route.ts` — a single, admin-gated, no-UI, draft-only extraction route built across Gates I38–I44. There was no `@anthropic-ai/sdk` dependency; the prior implementation called `https://api.anthropic.com/v1/messages` directly via `fetch`, with `model: 'claude-sonnet-5'`, `thinking: { type: 'disabled' }` (to keep the full `max_tokens` budget available to the JSON answer — Gate I44), and a 60s timeout.

Flow: `POST` (Bearer-token auth, `profiles.is_admin` check) → fetch the closed set of `APPROVED_SOURCES` (Shannon Martin's 3 verified campaign pages) → build a system/user prompt from `DIMENSION_DEFINITIONS`/`IN_SCOPE_DIMENSIONS` → **if `ENABLE_CAMPAIGN_EVIDENCE_EXTRACTION` is `false`, return a dry-run response with the assembled prompt and stop** → call Anthropic → concatenate all `text`-type content blocks (Gate I42 fix) → `JSON.parse` after stripping a single well-formed code fence (Gate I41 fix) → validate every row against `validateEvidenceRow` → `crossCheckConflicts` → return validated/rejected rows for human review. `ENABLE_CAMPAIGN_EVIDENCE_EXTRACTION` remains `false`; no row from this route has ever been auto-inserted — insertion is a separate, later, human-reviewed, explicitly-approved step (Gates I40–I44).

Token limits: `max_tokens: 6000`. Config: `temperature` not set (deterministic behavior instead enforced by disabling thinking + tight prompt constraints). Retry/error handling: none — a failed call returns a 5xx/502 to the admin caller; there is no automatic retry anywhere in this route. Source text inputs: HTML fetched live from the 3 approved URLs, converted to plain text by a small dependency-free `htmlToText()`. Environment variable referenced: `ANTHROPIC_API_KEY` (name only; value never inspected by any of this work). No admin UI invokes this route — it has always been called directly (curl / a temporary script), per Gates I40–I44's own audit trail. `candidate_position_evidence` integration: none in this route — it only returns a draft JSON payload; a separate, later, explicitly-approved gate (Gate I44) performed the one-time insert of Shannon Martin's reviewed rows.

## 2. Output contract that must not change

This is the exact shape validated by `validateEvidenceRow` in the route (now exported for testing) and is unchanged by this migration:

```json
{
  "candidate_id": "d44ff05a-14af-45c2-9f2f-6d530a8a051e",
  "methodology_version": "campaign_evidence_v1_2026-08",
  "evidence": [
    {
      "dimension": "growth_development | taxation_spending | environment | public_safety | transparency",
      "score": -2 | -1 | 0 | 1 | 2 | null,
      "rationale": "string, required when score is non-null",
      "source_type": "campaign_website",
      "source_url": "must be exactly one of the 3 approved URLs",
      "source_published_at": "string or null; rejected if not literally present in the fetched page text",
      "confidence": "low" | "medium" | "high",
      "conflict_flag": "boolean (model's claim is checked for internal consistency, then canonicalized to false — see below)",
      "conflict_notes": "string or null, required exactly when conflict_flag is true"
    }
  ]
}
```

`conflict_flag`/`conflict_notes` on every row that survives validation are always overwritten to `false`/`null` before `crossCheckConflicts()` runs; only that function is the sole authority for final conflict state, computed deterministically over the surviving validated set. `education` and `housing` are excluded from the request entirely (Gate I39 design), not requested-then-nulled. Neither this schema nor the dimension-definition guardrails were touched by this migration — provider replacement is behavior parity first.

## 3. Gemini SDK/model verification

**SDK:** `@google/genai` (current official Node.js SDK — the older `@google/generative-ai` package was not considered). Installed at `^2.18.0`.

**Important finding — do not trust doc-scraping alone:** web documentation fetched during this task inconsistently described a `ai.interactions.create()` method as "the" current API. The **installed package's own TypeScript definitions** (`node_modules/@google/genai/dist/node/node.d.ts`) show that surface does exist (`GoogleGenAI.interactions` → `GeminiNextGenInteractions`), but its own type name marks it a next-gen/experimental surface, not the stable path. The long-established, fully-typed, structured-output-documented method — confirmed directly against the installed types, not just docs — is `ai.models.generateContent({ model, contents, config })`, returning a response with a `.text` getter, `.candidates[0].finishReason`, and `.usageMetadata.{promptTokenCount,candidatesTokenCount}`. **This migration uses `ai.models.generateContent`, not `ai.interactions.create`.**

**Structured output:** `config.responseMimeType: 'application/json'` plus optionally `config.responseSchema` (OpenAPI-subset) or `config.responseJsonSchema` (fuller JSON Schema, added in SDK v1.9+ as the strategy is to migrate off the more limited `responseSchema`). This migration currently relies on `responseMimeType: 'application/json'` plus prompt-level JSON-shape instructions and the same `JSON.parse`/normalization/validation pipeline already used for Anthropic — it does not (yet) pass a `responseSchema`/`responseJsonSchema`, matching the Anthropic path's own approach (which also has no server-enforced schema, only prompt instructions + post-hoc validation). Adding `responseSchema` is a safe, additive future hardening step, not required for parity.

**Model comparison** (per Google's pricing/model-list documentation, cross-checked across multiple fetches during this task — some of which returned mutually inconsistent model-name details, which is itself a reason to prefer the safer, most-consistently-confirmed option):

| Model | Status | Input $/M | Output $/M | Notes |
|---|---|---|---|---|
| `gemini-2.5-flash-lite` | GA | $0.10 | $0.40 | Cheapest. Google positions Flash-Lite as tuned for high-throughput document parsing/subagent tasks — a lighter-weight duty than this extraction task's guardrail-heavy reasoning. |
| `gemini-2.5-flash` | GA | $0.30 | $2.50 | **Chosen default.** Most consistently confirmed GA/stable across every source checked. General-purpose reasoning tier. |
| `gemini-3.5-flash-lite` | GA (per some fetches) | $0.30 | $2.50 | Newer, but Flash-Lite tier — same "document parsing" positioning concern as 2.5 Flash-Lite. |
| `gemini-3.7-flash` | GA (per some fetches) | $0.75→$1.50 | $3.75→$7.50 | Newest, described as tuned for "agentic workflows/reliable multi-step execution" — plausibly the best match for this task's reasoning demands, but named inconsistently across fetches in this same research pass (see the `interactions.create` finding above), so not chosen as the default without a live confirmation step. |
| Any Pro model | GA | materially higher | materially higher | Not materially justified — this is a text-classification/extraction task on a single small campaign website, not a task needing Pro-tier capability. |

**Recommendation:** `gemini-2.5-flash` as the default (`DEFAULT_GEMINI_EVIDENCE_MODEL` in `src/lib/candidateEvidence/providers/gemini.ts`), because this workload is genuinely low-volume (a single-candidate pilot; the cost difference between every model above is a fraction of a cent per run) and instruction/guardrail-heavy (closer to "agentic reasoning" than "high-throughput document parsing"), and because it was the single most consistently confirmed GA/stable model name across every documentation source checked — a meaningful signal given this same research pass also surfaced an apparently-incorrect API-shape description from the same doc site. `gemini-3.7-flash` is flagged as a plausible future upgrade once its exact model ID and GA status are reconfirmed live (Task 9 test, or a dedicated model-availability check) — not chosen as the default now to avoid hardcoding an unverified name into a pre-beta migration.

**Context/output limits:** ~1,048,576 input tokens, up to 65,536 output tokens on the confirmed models above — both far exceed this workload's actual few-thousand-token campaign-page inputs and the existing 6000-token output cap.

**Rate limits:** not verified in this task (would require a live-key check); the workload's call volume (a single candidate, ad hoc admin-triggered runs) is far below any documented per-minute/per-day free- or paid-tier limit for these models, so this is not expected to be a practical constraint, but was not empirically confirmed.

**Zod/JSON Schema:** `responseSchema`/`responseJsonSchema` can safely accept a JSON Schema-shaped object (see SDK note above); a Zod schema would need to be converted to plain JSON Schema first (e.g. via `zod-to-json-schema`) — no such dependency was added, since schema enforcement is not yet wired in (see above).

## 4. Provider abstraction

New directory: `src/lib/candidateEvidence/`.

- **`types.ts`** — `EvidenceProvider` interface (`name`, `model`, `extract(request): Promise<EvidenceProviderResult>`), `EvidenceExtractionRequest`/`EvidenceProviderResult`/`EvidenceProviderDiagnostics` shared types, and two typed errors: `EvidenceProviderConfigError` (misconfiguration, e.g. missing API key) and `EvidenceProviderRequestError` (the call itself failed — network/timeout/non-2xx).
- **`providers/anthropic.ts`** — the exact same Anthropic `fetch` call, relocated behind this interface. No behavior change.
- **`providers/gemini.ts`** — the new Gemini adapter, `@google/genai`-based.
- **`provider.ts`** — `resolveEvidenceProviderName()` reads `CANDIDATE_EVIDENCE_PROVIDER` (defaults to `"anthropic"`); `getEvidenceProvider(name?)` returns the corresponding adapter, applying `GEMINI_EVIDENCE_MODEL` when the Gemini path is selected.

Neither adapter has any knowledge of Supabase, the admin UI, or the CivicMarket evidence schema — they only accept `{ systemPrompt, userPrompt, maxOutputTokens }` and return `{ rawText, diagnostics }`. All prompt construction, JSON parsing, schema validation (`validateEvidenceRow`), and conflict cross-checking (`crossCheckConflicts`) remain exactly where they were, in the route file, unchanged, and now run identically regardless of which provider produced `rawText`.

## 5–6. Gemini implementation and model configuration

Server-side only. `GEMINI_API_KEY` is read via `process.env.GEMINI_API_KEY` inside `providers/gemini.ts` — never `NEXT_PUBLIC_*`, never referenced by any client component (verified: no `NEXT_PUBLIC` string appears anywhere under `src/lib/candidateEvidence/`, and no client bundle output references `GEMINI_API_KEY` — see §14). Structured JSON requested via `responseMimeType: 'application/json'`. Extraction settings: `temperature: 0`, `thinkingConfig: { thinkingBudget: 0 }` (mirrors the Anthropic adapter's `thinking: { type: 'disabled' }` — both exist to keep the full output-token budget available to the actual answer and to keep extraction low-variance). On any SDK exception, the adapter throws `EvidenceProviderRequestError` — it never returns a partially-successful result; the caller's existing empty-text/malformed-JSON/mismatch checks then apply identically to Gemini's output as they already did to Anthropic's. Source text and URLs are untouched — Gemini receives exactly the same `systemPrompt`/`userPrompt` string that Anthropic would have received; no per-provider prompt variant exists.

Model/provider selection is centralized in `src/lib/candidateEvidence/provider.ts`:
- `GEMINI_EVIDENCE_MODEL` (env var name only) — overrides `DEFAULT_GEMINI_EVIDENCE_MODEL = 'gemini-2.5-flash'`.
- `CANDIDATE_EVIDENCE_PROVIDER=gemini|anthropic` — defaults to `anthropic`. **The default is intentionally not switched to Gemini yet** — see §7's migration sequence.

## 7. Parity plan (Anthropic retained)

`@anthropic-ai/sdk` was never a dependency and remains not a dependency — no package was added or removed for Anthropic. The Anthropic adapter is fully retained and is still the default provider. Sequence:

1. ✅ Gemini implementation (this task).
2. ⬜ Same-input comparison — run both providers against Shannon Martin's already-verified sources and compare output (blocked on live Gemini credentials — see §9).
3. ⬜ Parity review — a human compares both outputs against the existing Gate I40/I41 accepted evidence set.
4. ⬜ Switch default provider to Gemini (`CANDIDATE_EVIDENCE_PROVIDER=gemini` in the deploy environment, or a documented default flip in `provider.ts` after review).
5. ⬜ Retain Anthropic as a fallback/comparison path temporarily.
6. ⬜ Remove Anthropic only after beta confidence is established.

No automated test in this repository calls either paid API — see §8.

## 8. Offline/mock testing

New: `vitest` (devDependency), `vitest.config.mts`, `npm run test` = `vitest run`. No prior test framework existed in this repository.

- `src/lib/candidateEvidence/__tests__/evidenceValidation.test.ts` (28 tests) — exercises `validateEvidenceRow`, `crossCheckConflicts`, `normalizeModelJson`, `looksLikelyTruncated` (all now exported from the route file for testability, with zero behavior change) against: valid structured output, a null-score row with rationale, missing rationale, missing `source_url`, non-object/`null` raw rows (malformed-JSON-shaped input), unsupported/unknown dimension, whitespace-only rationale (no quote/evidence claim), a non-approved `source_url`, an unverifiable `source_published_at` (anti-fabrication check) vs. one literally present in the source text, `conflict_flag`/`conflict_notes` internal-consistency rejection and canonicalization, the `growth_development` parcel-specific negative-score guardrail, and `crossCheckConflicts`'s duplicate/opposite-sign/same-dimension-only/empty-array behavior.
- `src/lib/candidateEvidence/__tests__/providers.test.ts` (18 tests) — mocks `global.fetch` (Anthropic) and the `@google/genai` module (Gemini) to exercise: missing API key → `EvidenceProviderConfigError` (both providers), valid response → correct `rawText`/diagnostics, multi-block text concatenation (Anthropic), truncation detection via `finishReason`/`stop_reason` (both), non-2xx/exception → `EvidenceProviderRequestError` (both, covering the "provider exception"/"timeout" requirement), empty-content response → empty `rawText` without throwing (both), and `provider.ts`'s resolution logic (default, explicit selection, case-insensitivity, invalid-name rejection, `GEMINI_EVIDENCE_MODEL` override, default-model fallback).

All 46 tests pass. **Zero real API keys are read, zero network calls are made, zero paid API usage occurs** in this suite — confirmed by inspection (every external call is behind `vi.stubGlobal('fetch', ...)` or `vi.mock('@google/genai', ...)`) and by the fact the suite runs green with `ANTHROPIC_API_KEY`/`GEMINI_API_KEY` unset.

## 9. Live Gemini test plan (not executed — approval boundary)

**This live call was not made.** It requires `GEMINI_API_KEY`, which this task did not access, inspect, or populate, per the explicit stop condition below.

**Prepared plan**, mirroring the already-approved Shannon Martin pilot (Gates I38–I44):

- **Exact input:** the same 3 approved URLs (`martinforpslmayor.com/`, `/about-shannon-martin/`, `/biography/`), fetched live at test time (unchanged fetch logic), producing the same `systemPrompt`/`userPrompt` the route already assembles today — set `CANDIDATE_EVIDENCE_PROVIDER=gemini` (and optionally `GEMINI_EVIDENCE_MODEL`) in the test environment only, with `ENABLE_CAMPAIGN_EVIDENCE_EXTRACTION` still `false` for a dry-run text-only check, and only a separately-approved temporary flip to `true` for the actual live call, exactly mirroring how the Anthropic live call was approved in Gate I44.
- **Expected output shape:** exactly the §2 contract — a JSON object with `candidate_id`, `methodology_version`, and an `evidence` array, each row passing `validateEvidenceRow` unchanged.
- **Comparison criteria:** factual extraction (does each row's rationale match text literally present in the cited page), source fidelity (is `source_url` exactly one of the 3 approved URLs, cited correctly), dimension classification (same dimension assignment as the Gate I41 final accepted set, or a defensible difference), quote/rationale fidelity (no embellishment), hallucination rate (zero fabricated URLs/dates/quotes — enforced by the same validation layer for both providers), schema validity (JSON parses, passes `validateEvidenceRow` without a validation-layer rejection), and cost/latency where measurable (informational only — not a pass/fail gate given the low volume here).
- **Acceptance thresholds:** every Gemini-produced row that would be accepted must independently satisfy the exact same server-side `validateEvidenceRow` rules Anthropic's output has always been subject to (this is enforced automatically, not just reviewed); a human reviewer should additionally confirm the *content* of Gemini's rows is defensible against the same `HUMAN_REVIEW_CHECKLIST` already used for Anthropic's output, before treating Gemini output as equivalent quality.
- **This live call, and any resulting comparison, requires separate, explicit approval** — both for accessing `GEMINI_API_KEY` and for the paid API usage itself, per this task's stop conditions.

## 10. Database safety

Not touched by this migration. The extraction route still performs zero Supabase writes of any kind, at any point, regardless of provider — `ENABLE_CAMPAIGN_EVIDENCE_EXTRACTION` remains `false`. Existing Shannon Martin `candidate_position_evidence` rows (from Gate I44) were not read, modified, or referenced by any code in this migration.

## 11. Admin/UI trace

No admin UI exists for this route (confirmed: no reference to `extract-shannon-martin-evidence` anywhere under `src/` outside the route file itself, before or after this task) — it has only ever been invoked directly. The route itself was updated to call the provider-neutral `getEvidenceProvider()` instead of an inline Anthropic `fetch`; its dry-run and live JSON responses now include a `provider` field alongside `model` (previously hardcoded to `"claude-sonnet-5"`). No public candidate-scoring behavior was touched. Neither `GEMINI_API_KEY` nor `CANDIDATE_EVIDENCE_PROVIDER`/`GEMINI_EVIDENCE_MODEL` values are ever sent to a client — they are read only inside this server-only route handler and the provider adapters it calls.

## 12. Dependencies

Added: `@google/genai` (`^2.18.0`, `dependencies`), `vitest` (`^4.1.11`, `devDependencies`, plus a `test` script and `vitest.config.mts`). `package.json`/`package-lock.json` updated accordingly. No deprecated Gemini SDK was installed. `@anthropic-ai/sdk` was not present before this task and remains not installed — the Anthropic path uses a raw `fetch` call, unchanged.

`npm install` reported pre-existing `npm audit` findings (6 vulnerabilities, mostly transitive) unrelated to this task's added packages; not remediated here, as `npm audit fix --force` can silently change unrelated dependency versions and was out of this task's scope.

## 13. This document

You are reading it.

## 14. Build/lint/test verification

- `npm run build` — passed, 28 routes, no errors.
- `npm run lint` — 5 errors, all pre-existing (`scripts/import-real-psl-data.cjs`, `scripts/validate-real-psl-csvs.cjs`, `@typescript-eslint/no-require-imports`), nothing new from this migration.
- `npm run test` (new) — 46/46 passed, no paid API calls.
- Secret scan: `grep -rIn "GEMINI_API_KEY|ANTHROPIC_API_KEY"` over `.next/static` (the built client bundle) returned no matches. `grep -rn "GEMINI_API_KEY" src/**/*.tsx` returned no matches. No `NEXT_PUBLIC_` prefix appears anywhere under `src/lib/candidateEvidence/`. Neither key's actual value was ever read, entered, or logged by this task — only the two env var *names* (`GEMINI_API_KEY`, already-existing `ANTHROPIC_API_KEY`) are referenced in source.

## Cutover criteria (for a future gate, not this one)

Before flipping `CANDIDATE_EVIDENCE_PROVIDER` default to `"gemini"` in any real environment:
1. A live Gemini call has been made and reviewed under a separate, explicit approval (§9).
2. The parity review (§7 step 3) found Gemini's output quality acceptable against the same `HUMAN_REVIEW_CHECKLIST` standard already applied to Anthropic.
3. `npm run build`/`lint`/`test` all still pass.
4. No change was needed to the §2 output contract, or any such change was itself separately reviewed and approved.

## Rollback / fallback plan

Because the default provider remains `"anthropic"` throughout this task, no rollback is needed right now — nothing changed for any real caller. Once/if the default is later switched to `"gemini"`, rollback is a single environment-variable change (`CANDIDATE_EVIDENCE_PROVIDER=anthropic`, or unset it) with no code deploy required, since both adapters remain present and fully implemented. Full removal of the Anthropic path is explicitly deferred (§7 step 6) until after beta confidence in Gemini is established — not part of this task.

## Remaining pre-beta steps

1. Obtain/confirm `GEMINI_API_KEY` availability in a safe environment (not performed by this task).
2. Run the §9 live test plan under separate explicit approval (dry-run first, then a scoped live call).
3. Perform the parity review against the existing Gate I41 accepted Shannon Martin evidence set.
4. Decide and separately approve the default-provider cutover.
5. Everything else on the broader beta-launch punch list (`docs/internal_beta_launch_priority_review.md`) is unaffected by and independent of this migration.
