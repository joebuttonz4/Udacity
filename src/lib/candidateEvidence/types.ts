// ============================================================================
// Provider-neutral contract for candidate-evidence extraction.
//
// This module defines ONLY the shape of a request/response to a text-
// generation provider. It has no knowledge of CivicMarket's evidence schema
// (dimensions, scores, source URLs, etc.) and no knowledge of Supabase or any
// UI. Prompt construction and output validation stay in the calling route —
// see src/app/api/admin/extract-shannon-martin-evidence/route.ts.
// ============================================================================

export type EvidenceProviderName = 'anthropic' | 'gemini'

export interface EvidenceExtractionRequest {
  systemPrompt: string
  userPrompt: string
  /** Hard output-token ceiling. Providers must fail closed, never silently truncate-and-succeed. */
  maxOutputTokens: number
}

export interface EvidenceProviderDiagnostics {
  provider: EvidenceProviderName
  model: string
  /** Provider-reported stop/finish reason, normalized to a string. Never null on success unless the provider truly omits it. */
  finishReason: string | null
  /** True when the provider's own signal indicates the response was cut off (e.g. hit the output-token ceiling). */
  possiblyTruncated: boolean
  inputTokens?: number
  outputTokens?: number
}

export interface EvidenceProviderResult {
  /** Raw, unparsed text output from the model. The caller is responsible for JSON parsing/validation. */
  rawText: string
  diagnostics: EvidenceProviderDiagnostics
}

/** Provider is not configured (e.g. missing API key env var). Distinct from a request failure so callers can return a clear 500 rather than a 502. */
export class EvidenceProviderConfigError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'EvidenceProviderConfigError'
  }
}

/** The provider was called but the call itself failed (network error, non-2xx response, timeout). Never thrown for a successful call that merely returned unexpected content — that is the caller's JSON/schema validation concern. */
export class EvidenceProviderRequestError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly detail?: string
  ) {
    super(message)
    this.name = 'EvidenceProviderRequestError'
  }
}

export interface EvidenceProvider {
  readonly name: EvidenceProviderName
  readonly model: string
  extract(request: EvidenceExtractionRequest): Promise<EvidenceProviderResult>
}
