import {
  EvidenceExtractionRequest,
  EvidenceProvider,
  EvidenceProviderConfigError,
  EvidenceProviderRequestError,
  EvidenceProviderResult,
} from '../types'

// ============================================================================
// Anthropic adapter — relocated, behavior-preserving extraction of the raw
// `fetch('https://api.anthropic.com/v1/messages', ...)` call that previously
// lived inline in the extraction route. No prompt, schema, or validation
// logic lives here; this function only sends text and returns text.
//
// Retained during the Gemini migration as the parity-comparison and fallback
// path (see docs/gemini_candidate_evidence_migration.md). Not removed.
// ============================================================================

export const ANTHROPIC_EVIDENCE_MODEL = 'claude-sonnet-5'

export function createAnthropicEvidenceProvider(model: string = ANTHROPIC_EVIDENCE_MODEL): EvidenceProvider {
  return {
    name: 'anthropic',
    model,
    async extract(request: EvidenceExtractionRequest): Promise<EvidenceProviderResult> {
      const apiKey = process.env.ANTHROPIC_API_KEY
      if (!apiKey) {
        throw new EvidenceProviderConfigError('ANTHROPIC_API_KEY is not configured.')
      }

      let res: Response
      try {
        res = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            model,
            max_tokens: request.maxOutputTokens,
            // Disabled, not omitted — claude-sonnet-5 runs adaptive extended
            // thinking by default when this is left unset, which previously
            // consumed part of the max_tokens budget (Gate I44). `disabled`
            // is a GA value for this model, no beta header required.
            thinking: { type: 'disabled' },
            system: request.systemPrompt,
            messages: [{ role: 'user', content: request.userPrompt }],
          }),
          signal: AbortSignal.timeout(60000),
        })
      } catch (err) {
        throw new EvidenceProviderRequestError(
          'Anthropic request failed',
          undefined,
          err instanceof Error ? err.message : String(err)
        )
      }

      if (!res.ok) {
        const detail = await res.text()
        throw new EvidenceProviderRequestError(`Anthropic API error ${res.status}`, res.status, detail)
      }

      const json = (await res.json()) as {
        content?: { type: string; text?: string }[]
        stop_reason?: string | null
        usage?: { input_tokens?: number; output_tokens?: number }
      }

      // Every text-type content block is concatenated in order (Gate I42 fix
      // — a prior implementation used only the first text block and silently
      // discarded the rest).
      const contentBlocks = json.content ?? []
      const textBlocks = contentBlocks.filter((block) => block.type === 'text').map((block) => block.text ?? '')
      const rawText = textBlocks.join('')

      return {
        rawText,
        diagnostics: {
          provider: 'anthropic',
          model,
          finishReason: json.stop_reason ?? null,
          possiblyTruncated: json.stop_reason === 'max_tokens',
          inputTokens: json.usage?.input_tokens,
          outputTokens: json.usage?.output_tokens,
        },
      }
    },
  }
}
