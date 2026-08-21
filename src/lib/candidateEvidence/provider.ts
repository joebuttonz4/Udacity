import { EvidenceProvider, EvidenceProviderConfigError, EvidenceProviderName } from './types'
import { createAnthropicEvidenceProvider, ANTHROPIC_EVIDENCE_MODEL } from './providers/anthropic'
import { createGeminiEvidenceProvider, DEFAULT_GEMINI_EVIDENCE_MODEL } from './providers/gemini'

// ============================================================================
// Server-only provider/model selection for candidate-evidence extraction.
// Centralizing this here means no model name or provider choice is scattered
// through route files. Never imported by client components — this file only
// reads process.env server-side inside an API route handler.
//
// CANDIDATE_EVIDENCE_PROVIDER=gemini|anthropic — defaults to "anthropic".
// The default intentionally does NOT change to Gemini yet: per the migration
// sequence in docs/gemini_candidate_evidence_migration.md, the default only
// flips after a parity review comparing same-input output from both
// providers. Until then, set the env var explicitly to opt into testing the
// Gemini path.
//
// GEMINI_EVIDENCE_MODEL — overrides DEFAULT_GEMINI_EVIDENCE_MODEL.
// ANTHROPIC_EVIDENCE_MODEL is not currently made configurable via env var
// (it never was before this migration); only the Gemini model is
// env-configurable, since that is the one actively being evaluated.
// ============================================================================

export function resolveEvidenceProviderName(): EvidenceProviderName {
  const raw = process.env.CANDIDATE_EVIDENCE_PROVIDER?.trim().toLowerCase()
  if (raw === 'gemini') return 'gemini'
  if (raw === 'anthropic' || raw === undefined || raw === '') return 'anthropic'
  throw new EvidenceProviderConfigError(
    `Unknown CANDIDATE_EVIDENCE_PROVIDER "${raw}". Expected "anthropic" or "gemini".`
  )
}

export function getEvidenceProvider(name: EvidenceProviderName = resolveEvidenceProviderName()): EvidenceProvider {
  if (name === 'gemini') {
    const model = process.env.GEMINI_EVIDENCE_MODEL?.trim() || DEFAULT_GEMINI_EVIDENCE_MODEL
    return createGeminiEvidenceProvider(model)
  }
  return createAnthropicEvidenceProvider(ANTHROPIC_EVIDENCE_MODEL)
}
