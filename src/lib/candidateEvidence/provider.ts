import { EvidenceProvider, EvidenceProviderConfigError, EvidenceProviderName } from './types'
import { createAnthropicEvidenceProvider, ANTHROPIC_EVIDENCE_MODEL } from './providers/anthropic'
import { createGeminiEvidenceProvider, DEFAULT_GEMINI_EVIDENCE_MODEL } from './providers/gemini'

// ============================================================================
// Server-only provider/model selection for candidate-evidence extraction.
// Centralizing this here means no model name or provider choice is scattered
// through route files. Never imported by client components — this file only
// reads process.env server-side inside an API route handler.
//
// CANDIDATE_EVIDENCE_PROVIDER=gemini|anthropic — defaults to "gemini".
//
// Cutover (08-20-2026): after a human parity review of one live Gemini vs.
// Anthropic extraction (docs/gemini_candidate_evidence_migration.md —
// GEMINI PARITY = PASS, one flagged coverage gap explicitly accepted as
// "ACCEPT GAP FOR BETA"), Gemini became the default provider. Anthropic
// remains fully implemented and selectable via an explicit
// CANDIDATE_EVIDENCE_PROVIDER=anthropic override for admin/troubleshooting
// use — it is not removed and not silently auto-invoked as a fallback after
// a Gemini failure (see docs/gemini_candidate_evidence_migration.md
// "Fallback policy" for why: no hidden double-provider spend, and a Gemini
// failure should surface clearly rather than be masked by a second paid
// call to a different provider).
//
// GEMINI_EVIDENCE_MODEL — overrides DEFAULT_GEMINI_EVIDENCE_MODEL.
// ANTHROPIC_EVIDENCE_MODEL is not currently made configurable via env var
// (it never was before this migration).
// ============================================================================

export function resolveEvidenceProviderName(): EvidenceProviderName {
  const raw = process.env.CANDIDATE_EVIDENCE_PROVIDER?.trim().toLowerCase()
  if (raw === 'anthropic') return 'anthropic'
  if (raw === 'gemini' || raw === undefined || raw === '') return 'gemini'
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
