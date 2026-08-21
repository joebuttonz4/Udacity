import { describe, expect, it } from 'vitest'
import {
  APPROVED_SOURCES,
  CANDIDATE_ID,
  crossCheckConflicts,
  EvidenceDraft,
  FetchedSource,
  looksLikelyTruncated,
  METHODOLOGY_VERSION,
  normalizeModelJson,
  SOURCE_TYPE,
  validateEvidenceRow,
} from '@/app/api/admin/extract-shannon-martin-evidence/route'

// ============================================================================
// Provider-independent tests for the extraction route's output-contract
// validation (Task 8 of the Gemini migration). These exercise the exact
// same schema/validation code the route runs against BOTH providers'
// output — no real Anthropic or Gemini credentials are used or required,
// and no network call is made. See src/lib/candidateEvidence/__tests__/
// providers.test.ts for provider-dispatch/error-handling tests.
// ============================================================================

const APPROVED_URL = APPROVED_SOURCES[0]
const OTHER_APPROVED_URL = APPROVED_SOURCES[1]

function fetchedSourcesFixture(): Map<string, FetchedSource> {
  return new Map([
    [
      APPROVED_URL,
      { url: APPROVED_URL, ok: true, text: 'We will cut red tape and reduce fees for small businesses.', rawLength: 200 },
    ],
    [
      OTHER_APPROVED_URL,
      { url: OTHER_APPROVED_URL, ok: true, text: 'Published March 2026. We support strong parks funding.', rawLength: 200 },
    ],
  ])
}

function validRow(overrides: Partial<Record<string, unknown>> = {}): Record<string, unknown> {
  return {
    dimension: 'taxation_spending',
    score: 2,
    rationale: 'Explicit commitment to reduce fees.',
    source_type: SOURCE_TYPE,
    source_url: APPROVED_URL,
    source_published_at: null,
    confidence: 'high',
    conflict_flag: false,
    conflict_notes: null,
    ...overrides,
  }
}

describe('validateEvidenceRow — valid structured output', () => {
  it('accepts a well-formed row and canonicalizes candidate/methodology/status fields', () => {
    const result = validateEvidenceRow(validRow(), fetchedSourcesFixture())
    expect(result.valid).toBe(true)
    if (!result.valid) return
    expect(result.row).toEqual<EvidenceDraft>({
      candidate_id: CANDIDATE_ID,
      dimension: 'taxation_spending',
      score: 2,
      rationale: 'Explicit commitment to reduce fees.',
      source_type: SOURCE_TYPE,
      source_url: APPROVED_URL,
      source_published_at: null,
      confidence: 'high',
      conflict_flag: false,
      conflict_notes: null,
      methodology_version: METHODOLOGY_VERSION,
      extraction_status: 'draft',
    })
  })

  it('accepts a null-score row with an explanatory rationale', () => {
    const result = validateEvidenceRow(validRow({ score: null, rationale: 'Only biographical, not a policy statement.' }), fetchedSourcesFixture())
    expect(result.valid).toBe(true)
  })
})

describe('validateEvidenceRow — missing required fields', () => {
  it('rejects a row missing rationale for a non-null score', () => {
    const result = validateEvidenceRow(validRow({ rationale: '' }), fetchedSourcesFixture())
    expect(result.valid).toBe(false)
    if (result.valid) return
    expect(result.reason).toMatch(/rationale/i)
  })

  it('rejects a row with no source_url', () => {
    const result = validateEvidenceRow(validRow({ source_url: undefined }), fetchedSourcesFixture())
    expect(result.valid).toBe(false)
    if (result.valid) return
    expect(result.reason).toMatch(/source_url/i)
  })
})

describe('validateEvidenceRow — malformed JSON (as a non-object row)', () => {
  it('rejects a raw string instead of an object', () => {
    const result = validateEvidenceRow('not an object', fetchedSourcesFixture())
    expect(result.valid).toBe(false)
  })

  it('rejects null', () => {
    const result = validateEvidenceRow(null, fetchedSourcesFixture())
    expect(result.valid).toBe(false)
  })
})

describe('validateEvidenceRow — unsupported dimension', () => {
  it('rejects a dimension outside the in-scope set (e.g. education)', () => {
    const result = validateEvidenceRow(validRow({ dimension: 'education' }), fetchedSourcesFixture())
    expect(result.valid).toBe(false)
    if (result.valid) return
    expect(result.reason).toMatch(/dimension/i)
  })

  it('rejects an entirely unknown dimension string', () => {
    const result = validateEvidenceRow(validRow({ dimension: 'not_a_real_dimension' }), fetchedSourcesFixture())
    expect(result.valid).toBe(false)
  })
})

describe('validateEvidenceRow — no quote/evidence claim (empty rationale with a score)', () => {
  it('rejects a scored row whose rationale is only whitespace', () => {
    const result = validateEvidenceRow(validRow({ rationale: '   ' }), fetchedSourcesFixture())
    expect(result.valid).toBe(false)
  })
})

describe('validateEvidenceRow — source_url not in the approved closed set', () => {
  it('rejects a plausible-looking but non-approved URL', () => {
    const result = validateEvidenceRow(validRow({ source_url: 'https://martinforpslmayor.com/press-release/' }), fetchedSourcesFixture())
    expect(result.valid).toBe(false)
    if (result.valid) return
    expect(result.reason).toMatch(/approved/i)
  })
})

describe('validateEvidenceRow — unverifiable source_published_at', () => {
  it('rejects a date not literally present in the fetched source text', () => {
    const result = validateEvidenceRow(validRow({ source_published_at: 'January 1, 2026' }), fetchedSourcesFixture())
    expect(result.valid).toBe(false)
    if (result.valid) return
    expect(result.reason).toMatch(/unverifiable|fabricated/i)
  })

  it('accepts a date literally present in the fetched source text', () => {
    const result = validateEvidenceRow(
      validRow({ source_url: OTHER_APPROVED_URL, source_published_at: 'March 2026' }),
      fetchedSourcesFixture()
    )
    expect(result.valid).toBe(true)
  })
})

describe('validateEvidenceRow — conflict_flag/conflict_notes consistency', () => {
  it('rejects conflict_flag true with empty conflict_notes', () => {
    const result = validateEvidenceRow(validRow({ conflict_flag: true, conflict_notes: '' }), fetchedSourcesFixture())
    expect(result.valid).toBe(false)
  })

  it('rejects conflict_flag false with non-empty conflict_notes', () => {
    const result = validateEvidenceRow(validRow({ conflict_flag: false, conflict_notes: 'stray note' }), fetchedSourcesFixture())
    expect(result.valid).toBe(false)
  })

  it('canonicalizes a valid row to conflict_flag: false regardless of the model-claimed value (crossCheckConflicts is sole authority)', () => {
    const result = validateEvidenceRow(validRow({ conflict_flag: true, conflict_notes: 'model self-flagged' }), fetchedSourcesFixture())
    // The model's own conflict claim is a raw-shape consistency check only — an
    // internally-consistent claim IS accepted at validation time, but the
    // stored row is always canonicalized back to false/null; only
    // crossCheckConflicts() may set it, over the surviving validated set.
    expect(result.valid).toBe(true)
    if (!result.valid) return
    expect(result.row.conflict_flag).toBe(false)
    expect(result.row.conflict_notes).toBeNull()
  })
})

describe('validateEvidenceRow — growth_development parcel-specific negative-score guardrail', () => {
  it('rejects a negative growth_development score supported only by parcel-specific preservation language', () => {
    const result = validateEvidenceRow(
      validRow({
        dimension: 'growth_development',
        score: -1,
        rationale: 'Committed to preserving the Rosser Lakes parcel as green space so it would not become a development site.',
      }),
      fetchedSourcesFixture()
    )
    expect(result.valid).toBe(false)
    if (result.valid) return
    expect(result.reason).toMatch(/restrictive development policy/i)
  })

  it('accepts a negative growth_development score supported by a broad restrictive-policy signal', () => {
    const result = validateEvidenceRow(
      validRow({
        dimension: 'growth_development',
        score: -1,
        rationale: 'Supports a citywide development moratorium until infrastructure catches up.',
      }),
      fetchedSourcesFixture()
    )
    expect(result.valid).toBe(true)
  })
})

describe('crossCheckConflicts — duplicate/conflicting evidence within a dimension', () => {
  function draft(overrides: Partial<EvidenceDraft>): EvidenceDraft {
    return {
      candidate_id: CANDIDATE_ID,
      dimension: 'taxation_spending',
      score: 2,
      rationale: 'x',
      source_type: SOURCE_TYPE,
      source_url: APPROVED_URL,
      source_published_at: null,
      confidence: 'high',
      conflict_flag: false,
      conflict_notes: null,
      methodology_version: METHODOLOGY_VERSION,
      extraction_status: 'draft',
      ...overrides,
    }
  }

  it('flags two same-dimension rows with opposite-sign scores as conflicting', () => {
    const rows = [draft({ score: 2 }), draft({ score: -1, source_url: OTHER_APPROVED_URL })]
    crossCheckConflicts(rows)
    expect(rows[0].conflict_flag).toBe(true)
    expect(rows[1].conflict_flag).toBe(true)
    expect(rows[0].conflict_notes).toMatch(/opposite-sign/i)
  })

  it('does not flag duplicate same-sign corroborating rows as conflicting', () => {
    const rows = [draft({ score: 2 }), draft({ score: 1, source_url: OTHER_APPROVED_URL })]
    crossCheckConflicts(rows)
    expect(rows[0].conflict_flag).toBe(false)
    expect(rows[1].conflict_flag).toBe(false)
  })

  it('does not flag rows in different dimensions against each other', () => {
    const rows = [draft({ score: 2, dimension: 'taxation_spending' }), draft({ score: -2, dimension: 'environment', source_url: OTHER_APPROVED_URL })]
    crossCheckConflicts(rows)
    expect(rows[0].conflict_flag).toBe(false)
    expect(rows[1].conflict_flag).toBe(false)
  })

  it('handles an empty evidence array without error', () => {
    expect(crossCheckConflicts([])).toEqual([])
  })
})

describe('normalizeModelJson', () => {
  it('passes raw JSON through unchanged', () => {
    expect(normalizeModelJson('{"a":1}')).toBe('{"a":1}')
  })

  it('strips a single well-formed ```json fence pair', () => {
    expect(normalizeModelJson('```json\n{"a":1}\n```')).toBe('{"a":1}')
  })

  it('strips a single unlabeled fence pair', () => {
    expect(normalizeModelJson('```\n{"a":1}\n```')).toBe('{"a":1}')
  })

  it('leaves text with more than one fence pair unchanged (refuses to guess)', () => {
    const input = '```json\n{"a":1}\n```\nextra\n```\n{"b":2}\n```'
    expect(normalizeModelJson(input)).toBe(input)
  })
})

describe('looksLikelyTruncated', () => {
  it('flags unbalanced braces as likely truncated', () => {
    expect(looksLikelyTruncated('{"a": [1, 2,')).toBe(true)
  })

  it('does not flag a balanced, closed (but otherwise malformed) payload', () => {
    expect(looksLikelyTruncated('{"a": 1,}')).toBe(false)
  })

  it('does not flag empty text', () => {
    expect(looksLikelyTruncated('')).toBe(false)
  })
})
