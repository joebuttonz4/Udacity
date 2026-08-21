import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { EvidenceProviderConfigError, EvidenceProviderRequestError } from '../types'
import { createAnthropicEvidenceProvider } from '../providers/anthropic'
import { createGeminiEvidenceProvider, DEFAULT_GEMINI_EVIDENCE_MODEL } from '../providers/gemini'
import { getEvidenceProvider, resolveEvidenceProviderName } from '../provider'

const currentFilePath = fileURLToPath(import.meta.url)
const currentDirPath = dirname(currentFilePath)

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
  ThinkingLevel: { MINIMAL: 'MINIMAL', LOW: 'LOW', MEDIUM: 'MEDIUM', HIGH: 'HIGH' },
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
          thinkingConfig: { thinkingLevel: 'MINIMAL' },
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

describe('provider resolution (src/lib/candidateEvidence/provider.ts) — post-cutover (08-20-2026)', () => {
  it('defaults to gemini when CANDIDATE_EVIDENCE_PROVIDER is unset', () => {
    delete process.env.CANDIDATE_EVIDENCE_PROVIDER
    expect(resolveEvidenceProviderName()).toBe('gemini')
    expect(getEvidenceProvider().name).toBe('gemini')
  })

  it('resolves to gemini when CANDIDATE_EVIDENCE_PROVIDER=gemini is set explicitly', () => {
    process.env.CANDIDATE_EVIDENCE_PROVIDER = 'gemini'
    expect(resolveEvidenceProviderName()).toBe('gemini')
    expect(getEvidenceProvider().name).toBe('gemini')
  })

  it('resolves to anthropic only via an explicit CANDIDATE_EVIDENCE_PROVIDER=anthropic override', () => {
    process.env.CANDIDATE_EVIDENCE_PROVIDER = 'anthropic'
    expect(resolveEvidenceProviderName()).toBe('anthropic')
    expect(getEvidenceProvider().name).toBe('anthropic')
  })

  it('is case-insensitive for the anthropic override', () => {
    process.env.CANDIDATE_EVIDENCE_PROVIDER = 'ANTHROPIC'
    expect(resolveEvidenceProviderName()).toBe('anthropic')
  })

  it('is case-insensitive for an explicit gemini value', () => {
    process.env.CANDIDATE_EVIDENCE_PROVIDER = 'GEMINI'
    expect(resolveEvidenceProviderName()).toBe('gemini')
  })

  it('fails safely (throws EvidenceProviderConfigError, does not silently fall back) on an unknown provider name', () => {
    process.env.CANDIDATE_EVIDENCE_PROVIDER = 'openai'
    expect(() => resolveEvidenceProviderName()).toThrow(EvidenceProviderConfigError)
  })

  it('the default Gemini model is gemini-3.6-flash', () => {
    expect(DEFAULT_GEMINI_EVIDENCE_MODEL).toBe('gemini-3.6-flash')
  })

  it('respects GEMINI_EVIDENCE_MODEL to override the default model', () => {
    process.env.CANDIDATE_EVIDENCE_PROVIDER = 'gemini'
    process.env.GEMINI_EVIDENCE_MODEL = 'gemini-3.5-flash-lite'
    expect(getEvidenceProvider().model).toBe('gemini-3.5-flash-lite')
  })

  it('uses the documented default Gemini model (gemini-3.6-flash) when GEMINI_EVIDENCE_MODEL is unset', () => {
    process.env.CANDIDATE_EVIDENCE_PROVIDER = 'gemini'
    delete process.env.GEMINI_EVIDENCE_MODEL
    expect(getEvidenceProvider().model).toBe(DEFAULT_GEMINI_EVIDENCE_MODEL)
    expect(getEvidenceProvider().model).toBe('gemini-3.6-flash')
  })

  it('the default (unset-provider) path also uses gemini-3.6-flash', () => {
    delete process.env.CANDIDATE_EVIDENCE_PROVIDER
    delete process.env.GEMINI_EVIDENCE_MODEL
    expect(getEvidenceProvider().model).toBe('gemini-3.6-flash')
  })
})

describe('no database write occurs during extraction (structural guarantee)', () => {
  it('neither provider adapter file references Supabase or a database client', () => {
    // Architectural invariant, not just runtime behavior: provider adapters
    // only ever send/receive text (see src/lib/candidateEvidence/types.ts —
    // "no database knowledge inside provider adapter"). This guards against
    // a future edit accidentally wiring a provider straight to Supabase.
    const files = [
      resolve(currentDirPath, '../providers/anthropic.ts'),
      resolve(currentDirPath, '../providers/gemini.ts'),
      resolve(currentDirPath, '../provider.ts'),
    ]
    const forbiddenServiceClientCall = 'createService' + 'Client'
    for (const file of files) {
      const source = readFileSync(file, 'utf-8')
      expect(source).not.toMatch(/supabase/i)
      expect(source.includes(forbiddenServiceClientCall)).toBe(false)
    }
  })

  it('the offline test suite itself never imports or calls a Supabase client', () => {
    // This suite exercises extraction end-to-end (validation + both
    // providers) using only mocks/fixtures — no service-role client, no
    // supabase-js import anywhere in this file. The forbidden substrings
    // are built at runtime (not written literally) so this assertion
    // doesn't trivially match its own source text.
    const source = readFileSync(currentFilePath, 'utf-8')
    const forbiddenPackageImport = '@supa' + 'base/supabase-js'
    const forbiddenServiceClientCall = 'createService' + 'Client'
    expect(source.includes(forbiddenPackageImport)).toBe(false)
    expect(source.includes(forbiddenServiceClientCall)).toBe(false)
  })
})
