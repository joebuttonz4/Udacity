import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { EvidenceProviderConfigError, EvidenceProviderRequestError } from '../types'
import { createAnthropicEvidenceProvider } from '../providers/anthropic'
import { createGeminiEvidenceProvider, DEFAULT_GEMINI_EVIDENCE_MODEL } from '../providers/gemini'
import { getEvidenceProvider, resolveEvidenceProviderName } from '../provider'

// ============================================================================
// Provider-independent tests (Task 8). Every test in this file mocks the
// network boundary — `global.fetch` for Anthropic, the `@google/genai`
// module for Gemini. No real API key is read and no paid API call is ever
// made by this suite.
// ============================================================================

const generateContentMock = vi.fn()

vi.mock('@google/genai', () => ({
  GoogleGenAI: vi.fn().mockImplementation(function MockGoogleGenAI(this: { models: { generateContent: typeof generateContentMock } }) {
    this.models = { generateContent: generateContentMock }
  }),
}))

const ORIGINAL_ENV = { ...process.env }

beforeEach(() => {
  process.env = { ...ORIGINAL_ENV }
  generateContentMock.mockReset()
})

afterEach(() => {
  process.env = { ...ORIGINAL_ENV }
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('Anthropic provider', () => {
  it('throws EvidenceProviderConfigError when ANTHROPIC_API_KEY is unset', async () => {
    delete process.env.ANTHROPIC_API_KEY
    const provider = createAnthropicEvidenceProvider()
    await expect(provider.extract({ systemPrompt: 's', userPrompt: 'u', maxOutputTokens: 100 })).rejects.toBeInstanceOf(
      EvidenceProviderConfigError
    )
  })

  it('returns rawText and diagnostics on a valid structured response', async () => {
    process.env.ANTHROPIC_API_KEY = 'test-key-not-real'
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          content: [{ type: 'text', text: '{"a":1}' }],
          stop_reason: 'end_turn',
          usage: { input_tokens: 10, output_tokens: 5 },
        }),
      })
    )
    const result = await createAnthropicEvidenceProvider().extract({ systemPrompt: 's', userPrompt: 'u', maxOutputTokens: 100 })
    expect(result.rawText).toBe('{"a":1}')
    expect(result.diagnostics.provider).toBe('anthropic')
    expect(result.diagnostics.possiblyTruncated).toBe(false)
  })

  it('concatenates multiple text content blocks in order (Gate I42 parity)', async () => {
    process.env.ANTHROPIC_API_KEY = 'test-key-not-real'
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          content: [
            { type: 'text', text: '{"a":' },
            { type: 'other' },
            { type: 'text', text: '1}' },
          ],
          stop_reason: 'end_turn',
        }),
      })
    )
    const result = await createAnthropicEvidenceProvider().extract({ systemPrompt: 's', userPrompt: 'u', maxOutputTokens: 100 })
    expect(result.rawText).toBe('{"a":1}')
  })

  it('flags possiblyTruncated when stop_reason is max_tokens', async () => {
    process.env.ANTHROPIC_API_KEY = 'test-key-not-real'
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ content: [{ type: 'text', text: '{"a":' }], stop_reason: 'max_tokens' }),
      })
    )
    const result = await createAnthropicEvidenceProvider().extract({ systemPrompt: 's', userPrompt: 'u', maxOutputTokens: 100 })
    expect(result.diagnostics.possiblyTruncated).toBe(true)
  })

  it('throws EvidenceProviderRequestError on a non-2xx response', async () => {
    process.env.ANTHROPIC_API_KEY = 'test-key-not-real'
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 529, text: async () => 'overloaded' }))
    await expect(
      createAnthropicEvidenceProvider().extract({ systemPrompt: 's', userPrompt: 'u', maxOutputTokens: 100 })
    ).rejects.toMatchObject({ status: 529 })
  })

  it('throws EvidenceProviderRequestError on a network/timeout exception', async () => {
    process.env.ANTHROPIC_API_KEY = 'test-key-not-real'
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('The operation was aborted due to timeout')))
    await expect(
      createAnthropicEvidenceProvider().extract({ systemPrompt: 's', userPrompt: 'u', maxOutputTokens: 100 })
    ).rejects.toBeInstanceOf(EvidenceProviderRequestError)
  })

  it('returns empty rawText (not a throw) when the response has no content blocks', async () => {
    process.env.ANTHROPIC_API_KEY = 'test-key-not-real'
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ content: [], stop_reason: 'end_turn' }) }))
    const result = await createAnthropicEvidenceProvider().extract({ systemPrompt: 's', userPrompt: 'u', maxOutputTokens: 100 })
    expect(result.rawText).toBe('')
  })
})

describe('Gemini provider', () => {
  it('throws EvidenceProviderConfigError when GEMINI_API_KEY is unset', async () => {
    delete process.env.GEMINI_API_KEY
    const provider = createGeminiEvidenceProvider()
    await expect(provider.extract({ systemPrompt: 's', userPrompt: 'u', maxOutputTokens: 100 })).rejects.toBeInstanceOf(
      EvidenceProviderConfigError
    )
  })

  it('returns rawText and diagnostics on a valid structured response', async () => {
    process.env.GEMINI_API_KEY = 'test-key-not-real'
    generateContentMock.mockResolvedValue({
      text: '{"a":1}',
      candidates: [{ finishReason: 'STOP' }],
      usageMetadata: { promptTokenCount: 12, candidatesTokenCount: 6 },
    })
    const result = await createGeminiEvidenceProvider('gemini-2.5-flash').extract({
      systemPrompt: 's',
      userPrompt: 'u',
      maxOutputTokens: 100,
    })
    expect(result.rawText).toBe('{"a":1}')
    expect(result.diagnostics.provider).toBe('gemini')
    expect(result.diagnostics.model).toBe('gemini-2.5-flash')
    expect(result.diagnostics.possiblyTruncated).toBe(false)
    expect(generateContentMock).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'gemini-2.5-flash',
        contents: 'u',
        config: expect.objectContaining({
          systemInstruction: 's',
          responseMimeType: 'application/json',
          thinkingConfig: { thinkingBudget: 0 },
        }),
      })
    )
  })

  it('flags possiblyTruncated when finishReason is MAX_TOKENS', async () => {
    process.env.GEMINI_API_KEY = 'test-key-not-real'
    generateContentMock.mockResolvedValue({ text: '{"a":', candidates: [{ finishReason: 'MAX_TOKENS' }] })
    const result = await createGeminiEvidenceProvider().extract({ systemPrompt: 's', userPrompt: 'u', maxOutputTokens: 100 })
    expect(result.diagnostics.possiblyTruncated).toBe(true)
  })

  it('throws EvidenceProviderRequestError when the SDK call rejects', async () => {
    process.env.GEMINI_API_KEY = 'test-key-not-real'
    generateContentMock.mockRejectedValue(new Error('deadline exceeded'))
    await expect(
      createGeminiEvidenceProvider().extract({ systemPrompt: 's', userPrompt: 'u', maxOutputTokens: 100 })
    ).rejects.toBeInstanceOf(EvidenceProviderRequestError)
  })

  it('returns empty rawText (not a throw) when the SDK response has no text', async () => {
    process.env.GEMINI_API_KEY = 'test-key-not-real'
    generateContentMock.mockResolvedValue({ text: undefined, candidates: [{ finishReason: 'SAFETY' }] })
    const result = await createGeminiEvidenceProvider().extract({ systemPrompt: 's', userPrompt: 'u', maxOutputTokens: 100 })
    expect(result.rawText).toBe('')
    expect(result.diagnostics.finishReason).toBe('SAFETY')
  })
})

describe('provider resolution (src/lib/candidateEvidence/provider.ts)', () => {
  it('defaults to anthropic when CANDIDATE_EVIDENCE_PROVIDER is unset', () => {
    delete process.env.CANDIDATE_EVIDENCE_PROVIDER
    expect(resolveEvidenceProviderName()).toBe('anthropic')
    expect(getEvidenceProvider().name).toBe('anthropic')
  })

  it('selects gemini when CANDIDATE_EVIDENCE_PROVIDER=gemini', () => {
    process.env.CANDIDATE_EVIDENCE_PROVIDER = 'gemini'
    expect(resolveEvidenceProviderName()).toBe('gemini')
    expect(getEvidenceProvider().name).toBe('gemini')
  })

  it('is case-insensitive', () => {
    process.env.CANDIDATE_EVIDENCE_PROVIDER = 'GEMINI'
    expect(resolveEvidenceProviderName()).toBe('gemini')
  })

  it('throws EvidenceProviderConfigError on an unknown provider name', () => {
    process.env.CANDIDATE_EVIDENCE_PROVIDER = 'openai'
    expect(() => resolveEvidenceProviderName()).toThrow(EvidenceProviderConfigError)
  })

  it('respects GEMINI_EVIDENCE_MODEL to override the default model', () => {
    process.env.CANDIDATE_EVIDENCE_PROVIDER = 'gemini'
    process.env.GEMINI_EVIDENCE_MODEL = 'gemini-3.5-flash-lite'
    expect(getEvidenceProvider().model).toBe('gemini-3.5-flash-lite')
  })

  it('uses the documented default Gemini model when GEMINI_EVIDENCE_MODEL is unset', () => {
    process.env.CANDIDATE_EVIDENCE_PROVIDER = 'gemini'
    delete process.env.GEMINI_EVIDENCE_MODEL
    expect(getEvidenceProvider().model).toBe(DEFAULT_GEMINI_EVIDENCE_MODEL)
  })
})
