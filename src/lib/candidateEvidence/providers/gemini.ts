import { GoogleGenAI, ThinkingLevel } from '@google/genai'
import {
  EvidenceExtractionRequest,
  EvidenceProvider,
  EvidenceProviderConfigError,
  EvidenceProviderRequestError,
  EvidenceProviderResult,
} from '../types'

// ============================================================================
// Gemini adapter — pre-beta migration off Anthropic for candidate-evidence
// extraction. See docs/gemini_candidate_evidence_migration.md for the full
// model/SDK research trail.
//
// SDK: @google/genai (the current official Node.js SDK; the older
// @google/generative-ai package is not used). API shape verified 08-20-2026
// directly against the installed package's own TypeScript definitions
// (node_modules/@google/genai/dist/node/node.d.ts, v2.18.0) — NOT solely
// from scraped web documentation, which inconsistently described a newer
// `ai.interactions.create()` surface. That surface does exist on this SDK
// version (`GoogleGenAI.interactions` -> `GeminiNextGenInteractions`), but
// its own type name marks it a next-gen/experimental surface; `ai.models.
// generateContent` is the long-established, fully-typed, structured-output-
// documented stable method and is what this adapter uses.
//
// No prompt, schema, or validation logic lives here; this function only
// sends text and returns text. The caller (the extraction route) parses and
// validates the JSON identically regardless of which provider produced it.
// ============================================================================

// Default only — override via GEMINI_EVIDENCE_MODEL (see provider.ts).
// gemini-2.5-flash was chosen over the cheaper gemini-2.5-flash-lite because
// this workload is low-volume (a single-candidate pilot; cost is a fraction
// of a cent per run either way) and instruction-heavy (many guardrails
// against hallucination/misclassification — the Flash-Lite tier is
// documented by Google as tuned for high-throughput document parsing, a
// lighter-weight task than this one). gemini-2.5-flash was the original
// documentation-based default choice, but a live parity test (08-20-2026)
// found the live API rejects it for this key with a 404: "This model
// models/gemini-2.5-flash is no longer available to new users. Please
// update your code to use models/gemini-3.6-flash." — a case where the live
// API's own ground truth overrode multiple doc-scraping fetches that had
// described gemini-2.5-flash as GA/stable. gemini-3.6-flash is now the
// default, per that same live error message's own recommendation, confirmed
// working live. See docs/gemini_candidate_evidence_migration.md for the
// full live-test record.
export const DEFAULT_GEMINI_EVIDENCE_MODEL = 'gemini-3.6-flash'

export function createGeminiEvidenceProvider(model: string = DEFAULT_GEMINI_EVIDENCE_MODEL): EvidenceProvider {
  return {
    name: 'gemini',
    model,
    async extract(request: EvidenceExtractionRequest): Promise<EvidenceProviderResult> {
      const apiKey = process.env.GEMINI_API_KEY
      if (!apiKey) {
        throw new EvidenceProviderConfigError('GEMINI_API_KEY is not configured.')
      }

      const ai = new GoogleGenAI({ apiKey })

      let response: Awaited<ReturnType<typeof ai.models.generateContent>>
      try {
        response = await ai.models.generateContent({
          model,
          contents: request.userPrompt,
          config: {
            systemInstruction: request.systemPrompt,
            // Deterministic/low-variance extraction, matching the Anthropic
            // path's intent (that path disables "thinking" for the same
            // reason: predictable, budget-bounded output for a structured
            // extraction task, not a creative one).
            temperature: 0,
            maxOutputTokens: request.maxOutputTokens,
            responseMimeType: 'application/json',
            // thinkingLevel: 'MINIMAL' keeps Gemini's reasoning-token usage
            // to a minimum for this call, mirroring `thinking: { type:
            // "disabled" }` on the Anthropic adapter — both exist to keep
            // the maxOutputTokens budget available to the actual JSON
            // answer. NOTE: `thinkingConfig: { thinkingBudget: 0 }` was
            // tried first and is rejected outright by gemini-3.6-flash with
            // a 400 INVALID_ARGUMENT (confirmed live, 08-20-2026) — unlike
            // the Anthropic model, this model family does not accept a
            // fully-disabled thinking budget. `thinkingLevel: 'MINIMAL'` is
            // the confirmed-working equivalent for this model.
            thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL },
          },
        })
      } catch (err) {
        throw new EvidenceProviderRequestError(
          'Gemini request failed',
          undefined,
          err instanceof Error ? err.message : String(err)
        )
      }

      const rawText = response.text ?? ''
      const finishReason = response.candidates?.[0]?.finishReason ?? null

      return {
        rawText,
        diagnostics: {
          provider: 'gemini',
          model,
          finishReason: finishReason ?? null,
          possiblyTruncated: finishReason === 'MAX_TOKENS',
          inputTokens: response.usageMetadata?.promptTokenCount,
          outputTokens: response.usageMetadata?.candidatesTokenCount,
        },
      }
    },
  }
}
