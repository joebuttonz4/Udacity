import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'

// ============================================================================
// Gate I40 — Shannon Martin draft-only campaign evidence extraction.
//
// verified URL -> fetch -> extract text -> Claude draft JSON -> validate ->
// return draft for human review. NO Supabase write of any kind occurs in
// this file — not even behind a flag. The evidence-insert step is a
// separate, not-yet-built, separately-approved future gate.
//
// While ENABLE_CAMPAIGN_EVIDENCE_EXTRACTION is false, this route fetches the
// approved source pages and assembles the exact prompt that would be sent,
// but never calls the Anthropic API. This mirrors the
// ENABLE_CITY_COUNCIL_DISTRICT_WRITE / ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE
// disabled-by-default pattern used elsewhere in this project — flip only
// with explicit, separate approval, and only temporarily.
// ============================================================================
const ENABLE_CAMPAIGN_EVIDENCE_EXTRACTION = false

const CANDIDATE_ID = 'd44ff05a-14af-45c2-9f2f-6d530a8a051e' // Shannon Martin
const METHODOLOGY_VERSION = 'campaign_evidence_v1_2026-08'
const SOURCE_TYPE = 'campaign_website'
const ANTHROPIC_MODEL = 'claude-sonnet-5'

// Closed set, per Gate I38's verified sources. Never derived from user input.
const APPROVED_SOURCES = [
  'https://martinforpslmayor.com/',
  'https://martinforpslmayor.com/about-shannon-martin/',
  'https://martinforpslmayor.com/biography/',
] as const

// Only these five dimensions are ever requested from the model. Education and
// Housing are intentionally excluded from the request itself (Gate I39 design)
// rather than requested-then-nulled, so the model is never invited to
// rationalize a position for a dimension with no first-party evidence.
const IN_SCOPE_DIMENSIONS = [
  'growth_development',
  'taxation_spending',
  'environment',
  'public_safety',
  'transparency',
] as const
type InScopeDimension = (typeof IN_SCOPE_DIMENSIONS)[number]

const VALID_CONFIDENCE = ['low', 'medium', 'high'] as const

// All seven locked dimension keys, per CLAUDE.md ("All dimension keys must
// match the seven locked snake_case keys") and
// Reference Files/CIVICMARKET_PATCH_MAY12.md. Listed here only so the
// evidence-scoring definitions below can document all seven for reference —
// this does NOT change which dimensions are requested from the model; see
// IN_SCOPE_DIMENSIONS above.
const ALL_DIMENSION_KEYS = [
  'growth_development',
  'taxation_spending',
  'education',
  'environment',
  'public_safety',
  'housing',
  'transparency',
] as const
type DimensionKey = (typeof ALL_DIMENSION_KEYS)[number]

// Evidence-scoring dimension definitions — revised per Gate I39
// (docs/internal_beta_gate_i39_candidate_evidence_dimension_definitions_review.md)
// after human review of the Gate I45-labeled Shannon Martin pilot found 5 of 8
// validated rows contained legitimate evidence that the original narrower
// polarity wording could not safely score. This is the evidence-scoring
// polarity used only by this extraction pilot's prompt/validation — a
// downstream, additive concern separate from the locked Civic DNA quiz
// definitions in Reference Files/CIVICMARKET_PATCH_MAY12.md, which are
// unchanged. The seven locked dimension keys themselves are unchanged.
const DIMENSION_DEFINITIONS: Record<DimensionKey, { plus: string; minus: string; guardrails: string[] }> = {
  growth_development: {
    plus: 'Explicit permissive/pro-growth development policy (e.g. streamlined approvals, development incentives, opposing growth moratoriums)',
    minus: 'Explicit restrictive/growth-management development policy (e.g. growth caps, moratoriums, downzoning)',
    guardrails: [
      'Score positive only for explicit permissive/pro-growth policy such as streamlined approvals, development incentives, opposing moratoriums, or comparable policy.',
      'Score negative only for explicit restrictive/growth-management policy such as caps, moratoriums, downzoning, or comparable policy.',
      'Do not use preservation of one parcel as proof of a general anti-development stance.',
    ],
  },
  taxation_spending: {
    plus: 'Explicit lower-tax / millage-reduction / debt-reduction / fiscal-discipline posture',
    minus: 'Explicit higher-tax / fee-increase / recurring-spending-expansion posture funded by higher revenue',
    guardrails: [
      'Positive reflects explicit lower-tax / millage-reduction / debt-reduction / fiscal-discipline posture.',
      'Negative reflects explicit higher-tax / fee-increase / recurring-spending-expansion posture funded by higher revenue.',
      'If the same evidence contains materially conflicting tax and spending signals, do not average. Flag for review (conflict_flag: true, with conflict_notes explaining the conflict) and use score: 0 only if this exact rubric conflict applies.',
    ],
  },
  education: {
    plus: 'Explicit public-school funding/budget increase position',
    minus: 'Explicit public-school funding/budget decrease position',
    guardrails: [
      'Score only explicit public-school funding/budget positions.',
      'Do not infer from general support for education.',
      'For city-level candidates without a named city-level mechanism, confidence must not exceed medium.',
    ],
  },
  environment: {
    plus: 'Explicit environmental protection, conservation, preservation, water-quality action, or public environmental investment',
    minus: 'Explicit reduction of environmental protections or investments',
    guardrails: [
      'Positive may include explicit environmental protection, conservation, preservation, water-quality action, or public environmental investment.',
      'Negative may include explicit reduction of those protections/investments.',
      'Do not require the evidence to be framed specifically as regulation.',
    ],
  },
  public_safety: {
    plus: 'Concrete public-safety resources, staffing, facilities, technology, or budget increase',
    minus: 'Concrete public-safety resource, staffing, facility, technology, or budget cuts/reductions',
    guardrails: [
      'Score only concrete resources, staffing, facilities, technology, budget, or explicit cuts/reductions.',
      'Generic statements like "supports police", "law and order", endorsements, or safety rankings alone are insufficient.',
    ],
  },
  housing: {
    plus: 'Explicit government action increasing housing supply or affordability',
    minus: 'Explicit government action reducing housing-supply/affordability intervention',
    guardrails: [
      'Score explicit government action affecting housing supply or affordability.',
      'Do not use generic growth/development evidence as a substitute for housing policy.',
    ],
  },
  transparency: {
    plus: 'Explicit disclosure, records access, government openness, or public-access policy expansion',
    minus: 'Explicit disclosure, records access, or public-access policy restriction',
    guardrails: [
      'Score explicit disclosure, records access, government openness, public-access, or transparency-policy changes.',
      'Generic constituent outreach, newsletters, forums, events, or accessibility alone are insufficient.',
    ],
  },
}

type EvidenceDraft = {
  candidate_id: string
  dimension: string
  score: number | null
  rationale: string | null
  source_type: string
  source_url: string
  source_published_at: string | null
  confidence: string
  conflict_flag: boolean
  conflict_notes: string | null
  methodology_version: string
  extraction_status: 'draft'
}

type FetchedSource = {
  url: string
  ok: boolean
  text: string
  rawLength: number
  error?: string
}

// ----------------------------------------------------------------------------
// Minimal, dependency-free HTML -> visible-text extraction. No cheerio/jsdom
// dependency was added — this is intentionally small and imperfect. It is
// sufficient for a draft the human reviewer will check against the live page
// anyway; it is not a substitute for that review.
// ----------------------------------------------------------------------------
function htmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li|h[1-6]|section|article)>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&lsquo;|&rsquo;/gi, "'")
    .replace(/&ldquo;|&rdquo;/gi, '"')
    .replace(/&mdash;/gi, '—')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/[ \t]+/g, ' ')
    .split('\n')
    .map((line) => line.trim())
    .filter((line, i, arr) => line.length > 0 || (i > 0 && arr[i - 1].length > 0))
    .join('\n')
    .trim()
}

async function fetchSourceText(url: string): Promise<FetchedSource> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'CivicMarketVerification/1.0 (+internal beta, read-only)' },
      signal: AbortSignal.timeout(15000),
    })
    if (!res.ok) {
      return { url, ok: false, text: '', rawLength: 0, error: `HTTP ${res.status}` }
    }
    const html = await res.text()
    const text = htmlToText(html)
    return { url, ok: true, text, rawLength: html.length }
  } catch (err) {
    return {
      url,
      ok: false,
      text: '',
      rawLength: 0,
      error: err instanceof Error ? err.message : 'Unknown fetch error',
    }
  }
}

// ----------------------------------------------------------------------------
// Prompt assembly — Gate I39 design (sections A and B), definitions revised
// per Gate I39's dimension-definitions review
// (docs/internal_beta_gate_i39_candidate_evidence_dimension_definitions_review.md).
// ----------------------------------------------------------------------------
function buildSystemPrompt(): string {
  const inScopeDefinitionLines = IN_SCOPE_DIMENSIONS.map((d) => {
    const def = DIMENSION_DEFINITIONS[d]
    const guardrailLines = def.guardrails.map((g) => `  - ${g}`).join('\n')
    return `- ${d}\n  + = ${def.plus}\n  - = ${def.minus}\n${guardrailLines}`
  }).join('\n\n')

  const outOfScopeDefinitionLines = ALL_DIMENSION_KEYS.filter((d) => !IN_SCOPE_DIMENSIONS.includes(d as InScopeDimension))
    .map((d) => {
      const def = DIMENSION_DEFINITIONS[d]
      const guardrailLines = def.guardrails.map((g) => `  - ${g}`).join('\n')
      return `- ${d}\n  + = ${def.plus}\n  - = ${def.minus}\n${guardrailLines}`
    })
    .join('\n\n')

  return `You are extracting ONLY explicitly stated campaign policy positions from first-party campaign website text, for the CivicMarket project. You will be given text from one or more pages of a candidate's own campaign website, each labeled with its exact URL.

For each of these dimensions only — ${IN_SCOPE_DIMENSIONS.join(', ')} — determine whether the text contains an explicit, direct statement of the candidate's position, and score only what is explicitly stated, using these exact definitions and guardrails:

${inScopeDefinitionLines}

General rule — outcome claims are not automatically policy claims. A result or ranking is not by itself evidence of a policy position. For example: saying crime is low does not establish a public-safety resource position; saying growth is strong does not establish a pro-development policy; saying residents are engaged does not establish a transparency/disclosure policy. Score only the underlying concrete policy/resource evidence, never the outcome claim alone.

General rule — do not force evidence into the wrong dimension. If a source statement clearly supports one of the other approved dimensions above better than the dimension you are currently considering it for, do not score it under the wrong dimension. Return score: null (or omit the row) for that dimension instead. Do not re-route the statement to the other dimension yourself and do not fabricate an additional row — only score a dimension from evidence that was given to you for that exact dimension in this pass.

You must NEVER infer a position from: party affiliation, endorsements, donors, biography or occupation alone, silence or absence of a statement, associations, or third-party descriptions of the candidate. If the only material touching a dimension is biographical (e.g. "former board member of X committee") rather than a stated position, return score: null for that dimension with a rationale explaining why, or omit it — do not force a score from biography.

Never fabricate a source URL, a publication date, or a quote. Only cite text literally present in the provided input. If a source has no visible publish date, source_published_at must be null — never guess or estimate a date.

If two provided pages state conflicting positions on the same dimension, set conflict_flag to true on both resulting rows and explain the conflict in conflict_notes. Do not average or silently pick a winner between conflicting statements — this applies to every dimension above, including the explicit taxation_spending conflicting-signal rule.

For reference only — "education" and "housing" are two of CivicMarket's seven locked candidate-evaluation dimensions, defined here so you understand why they are excluded below, but they are NOT requested in this pass and must never appear in your response:

${outOfScopeDefinitionLines}

Return RAW JSON only. Do not use markdown formatting. Do not wrap the response in \`\`\`json fences, \`\`\` fences, or any other code fence. Do not include any prose, explanation, or commentary before or after the JSON object. Do not include any internal or system XML tags in your response. The response must start with { and end with } and contain nothing else.

Return a JSON object matching this exact shape:
{
  "candidate_id": string,
  "methodology_version": string,
  "evidence": [
    {
      "dimension": one of [${IN_SCOPE_DIMENSIONS.map((d) => `"${d}"`).join(', ')}],
      "score": -2 | -1 | 0 | 1 | 2 | null,
      "rationale": string,
      "source_type": "campaign_website",
      "source_url": string (must be exactly one of the URLs provided below),
      "source_published_at": string | null,
      "confidence": "low" | "medium" | "high",
      "conflict_flag": boolean,
      "conflict_notes": string | null
    }
  ]
}

conflict_notes is required (a non-empty string) whenever conflict_flag is true, and must be null when conflict_flag is false.

Return zero, one, or more evidence objects per dimension — omit a dimension entirely if no page contains an explicit statement about it. Do not include "education" or "housing" under any circumstance.`
}

function buildUserPrompt(sources: FetchedSource[]): string {
  const blocks = sources
    .filter((s) => s.ok)
    .map((s) => `--- SOURCE: ${s.url} ---\n${s.text}`)
    .join('\n\n')

  return `Candidate: Shannon Martin (candidate_id: ${CANDIDATE_ID})
Methodology version: ${METHODOLOGY_VERSION}

Below is first-party campaign website text, one block per page, each labeled with its exact source URL. Analyze only this text.

${blocks}

Return the JSON object as specified in the system prompt.`
}

// ----------------------------------------------------------------------------
// Response-format normalization — Gate I41 fix for the Gate I40 markdown-fence
// parsing defect. Deliberately narrow: this only strips a single, complete
// leading/trailing code fence that wraps the ENTIRE response (optionally
// tagged ```json). It never scans for or extracts JSON from surrounding
// prose, and it refuses to touch a response containing anything other than
// exactly one fence pair (e.g. multiple fences). In every case where the
// fence shape isn't exactly this one recognized pattern, the text is
// returned unchanged so JSON.parse rejects it exactly as it did before this
// fix — this function never widens what is accepted, only what is stripped.
// ----------------------------------------------------------------------------
function normalizeModelJson(text: string): string {
  const trimmed = text.trim()
  const fenceCount = (trimmed.match(/```/g) ?? []).length
  if (fenceCount === 2) {
    const fenceMatch = trimmed.match(/^```(?:json)?\r?\n([\s\S]*?)\r?\n```$/)
    if (fenceMatch) {
      return fenceMatch[1].trim()
    }
  }
  return trimmed
}

// ----------------------------------------------------------------------------
// Diagnostic-only heuristic — Gate I42. Distinguishes "likely truncated"
// (unbalanced/unclosed JSON, as happens when a response is cut off
// mid-object) from "malformed" (balanced and closed, but still invalid JSON,
// e.g. a stray comma) for error reporting only. This never extracts,
// repairs, or reflows JSON — it only classifies an already-failed
// JSON.parse() for a clearer error message.
// ----------------------------------------------------------------------------
function looksLikelyTruncated(text: string): boolean {
  const trimmed = text.trim()
  if (trimmed.length === 0) return false
  const openBraces = (trimmed.match(/\{/g) ?? []).length
  const closeBraces = (trimmed.match(/\}/g) ?? []).length
  const openBrackets = (trimmed.match(/\[/g) ?? []).length
  const closeBrackets = (trimmed.match(/\]/g) ?? []).length
  const endsCleanly = /[}\]]$/.test(trimmed)
  return openBraces !== closeBraces || openBrackets !== closeBrackets || !endsCleanly
}

// ----------------------------------------------------------------------------
// Deterministic growth_development negative-score guardrail. Added because a
// live run demonstrated the prompt-only guardrail is insufficient: the model
// scored growth_development -1 from parcel-specific conservation evidence
// (Rosser Lakes Preserve) while its own conflict_notes explicitly
// acknowledged the exact prompt rule against doing so, and scored it anyway.
//
// This rule only ever REJECTS a row — it never coerces the score to 0/null,
// and it never creates or re-routes a row to another dimension (the
// `environment` row for the same underlying source stands entirely on its
// own, validated independently). It applies only to
// dimension === 'growth_development' AND score < 0; positive
// growth_development scores are never touched by this function. This is
// deliberately NOT a generic cross-dimension-overlap rule — one source
// statement may legitimately support both `environment` and, on its own
// separate non-parcel-specific merits, `growth_development`.
// ----------------------------------------------------------------------------
const PARCEL_CONSERVATION_SIGNALS = [
  'preserve',
  'preservation',
  'conservation',
  'green space',
  'land acquisition',
  'acquisition of',
  'acquired land',
  'parcel',
  'would not become',
  'would not turn into',
  'so it would not',
  'named site',
  'specific site',
  'specific property',
]

const BROAD_RESTRICTIVE_POLICY_SIGNALS = [
  'moratorium',
  'downzon', // matches downzone/downzoning
  'development cap',
  'growth cap',
  'reduce permitted density',
  'reducing permitted density',
  'reducing density',
  'density reduction',
  'growth boundary',
  'broad restriction',
  'broader restriction',
  'general restriction',
  'stricter development approval',
  'more restrictive development approval',
  'restrict new development',
  'restriction on new development',
  'citywide restriction',
]

function isUnsupportedParcelSpecificNegativeGrowthEvidence(rationale: string): boolean {
  const normalized = rationale.toLowerCase()
  const hasParcelSignal = PARCEL_CONSERVATION_SIGNALS.some((signal) => normalized.includes(signal))
  const hasBroadPolicySignal = BROAD_RESTRICTIVE_POLICY_SIGNALS.some((signal) => normalized.includes(signal))
  return hasParcelSignal && !hasBroadPolicySignal
}

// ----------------------------------------------------------------------------
// Validation — Gate I39 §7 / Gate I40 §6. Server-side, independent of the
// model's own claims. Any row failing any rule is rejected, not coerced.
// ----------------------------------------------------------------------------
function validateEvidenceRow(
  raw: unknown,
  fetchedByUrl: Map<string, FetchedSource>
): { valid: true; row: EvidenceDraft } | { valid: false; reason: string; raw: unknown } {
  if (typeof raw !== 'object' || raw === null) {
    return { valid: false, reason: 'Row is not an object.', raw }
  }
  const r = raw as Record<string, unknown>

  if (typeof r.dimension !== 'string' || !IN_SCOPE_DIMENSIONS.includes(r.dimension as InScopeDimension)) {
    return { valid: false, reason: `Unknown or out-of-scope dimension: ${JSON.stringify(r.dimension)}.`, raw }
  }

  const score = r.score
  if (score !== null && !(typeof score === 'number' && Number.isInteger(score) && score >= -2 && score <= 2)) {
    return { valid: false, reason: `score outside -2..2/null: ${JSON.stringify(score)}.`, raw }
  }

  const rationale = typeof r.rationale === 'string' ? r.rationale.trim() : ''
  if (score !== null && rationale.length === 0) {
    return { valid: false, reason: 'Missing rationale for a non-null score.', raw }
  }

  if (
    r.dimension === 'growth_development' &&
    typeof score === 'number' &&
    score < 0 &&
    isUnsupportedParcelSpecificNegativeGrowthEvidence(rationale)
  ) {
    return {
      valid: false,
      reason:
        'Negative growth_development score lacks evidence of a general restrictive development policy; parcel-specific preservation/conservation alone is insufficient.',
      raw,
    }
  }

  if (r.source_type !== SOURCE_TYPE) {
    return { valid: false, reason: `source_type must be "${SOURCE_TYPE}", got ${JSON.stringify(r.source_type)}.`, raw }
  }

  if (typeof r.source_url !== 'string' || !APPROVED_SOURCES.includes(r.source_url as (typeof APPROVED_SOURCES)[number])) {
    return { valid: false, reason: `source_url is not one of the approved Shannon Martin sources: ${JSON.stringify(r.source_url)}.`, raw }
  }
  const source = fetchedByUrl.get(r.source_url)

  let sourcePublishedAt: string | null = null
  if (r.source_published_at !== null && r.source_published_at !== undefined) {
    if (typeof r.source_published_at !== 'string') {
      return { valid: false, reason: 'source_published_at must be a string or null.', raw }
    }
    // Defensive anti-fabrication check: this pilot's known sources display no
    // visible publish date, so any non-null date must literally appear in the
    // fetched page text, or it is rejected as unverifiable/possibly fabricated.
    const dateNeedle = r.source_published_at.trim()
    if (!source || !dateNeedle || !source.text.includes(dateNeedle)) {
      return {
        valid: false,
        reason: `source_published_at "${dateNeedle}" could not be verified against the fetched source text — rejected as unverifiable/possibly fabricated.`,
        raw,
      }
    }
    sourcePublishedAt = dateNeedle
  }

  if (typeof r.confidence !== 'string' || !VALID_CONFIDENCE.includes(r.confidence as (typeof VALID_CONFIDENCE)[number])) {
    return { valid: false, reason: `Invalid confidence: ${JSON.stringify(r.confidence)}.`, raw }
  }

  // This is a raw-shape consistency check on the MODEL's own claim only
  // (catches an internally-inconsistent row, e.g. conflict_flag: true with
  // no explanation) — it does not make the model's conflict_flag/conflict_notes
  // authoritative. See the canonicalization note below: both fields are
  // always overwritten to false/null on the assembled row regardless of what
  // the model reported, because a sibling row this claim refers to may be
  // rejected by a later validation rule (e.g. the growth_development
  // parcel-specific guardrail above), which would otherwise leave a stale
  // conflict reference pointing at evidence that no longer exists in
  // validatedEvidence. Final conflict state is computed once, deterministically,
  // by crossCheckConflicts() over only the surviving validated rows — see POST().
  const conflictFlag = r.conflict_flag === true
  const conflictNotes = typeof r.conflict_notes === 'string' ? r.conflict_notes.trim() : ''
  if (conflictFlag && conflictNotes.length === 0) {
    return { valid: false, reason: 'conflict_flag is true but conflict_notes is empty.', raw }
  }
  if (!conflictFlag && conflictNotes.length > 0) {
    return { valid: false, reason: 'conflict_flag is false but conflict_notes is non-empty.', raw }
  }

  return {
    valid: true,
    row: {
      candidate_id: CANDIDATE_ID,
      dimension: r.dimension as string,
      score: score as number | null,
      rationale: rationale.length > 0 ? rationale : null,
      source_type: SOURCE_TYPE,
      source_url: r.source_url,
      source_published_at: sourcePublishedAt,
      confidence: r.confidence as string,
      // Canonicalized, not the model's claim — see comment above.
      // crossCheckConflicts() is the sole authority for final conflict state.
      conflict_flag: false,
      conflict_notes: null,
      methodology_version: METHODOLOGY_VERSION,
      extraction_status: 'draft',
    },
  }
}

// Defense in depth: even if the model didn't self-flag a conflict, catch any
// two validated rows for the same dimension with opposite-sign non-null
// scores and mark both as needing review, rather than silently keeping both.
function crossCheckConflicts(rows: EvidenceDraft[]): EvidenceDraft[] {
  const byDimension = new Map<string, EvidenceDraft[]>()
  for (const row of rows) {
    const list = byDimension.get(row.dimension) ?? []
    list.push(row)
    byDimension.set(row.dimension, list)
  }

  for (const dimRows of byDimension.values()) {
    const scored = dimRows.filter((r) => r.score !== null)
    for (let i = 0; i < scored.length; i++) {
      for (let j = i + 1; j < scored.length; j++) {
        const a = scored[i]
        const b = scored[j]
        const aSign = Math.sign(a.score as number)
        const bSign = Math.sign(b.score as number)
        if (aSign !== 0 && bSign !== 0 && aSign !== bSign) {
          a.conflict_flag = true
          b.conflict_flag = true
          const note = `Validation-layer conflict check: opposite-sign scores for "${a.dimension}" from ${a.source_url} (${a.score}) and ${b.source_url} (${b.score}).`
          a.conflict_notes = a.conflict_notes ? `${a.conflict_notes} | ${note}` : note
          b.conflict_notes = b.conflict_notes ? `${b.conflict_notes} | ${note}` : note
        }
      }
    }
  }

  return rows
}

const HUMAN_REVIEW_CHECKLIST = [
  'Does the cited source_url genuinely contain the quoted/paraphrased statement, verified against the LIVE page (not just this draft)?',
  'Is the dimension mapping defensible (not misfiled — e.g. a tax statement under transparency)?',
  'Is the score consistent with the CivicMarket dimension polarity definition, not just "sounds positive/negative"?',
  'Is the rationale faithful to the source — no embellishment, no reading-between-the-lines?',
  'Is the stated confidence level reasonable given how explicit the statement actually is?',
  'Is the conflict flag correct — no missed real conflict, no false-positive on compatible statements?',
  'Does the row show any sign of a prohibited inference (party, endorsement, donor, biography-alone, silence, association, third-party description)? If so, reject regardless of plausibility.',
]

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const token = authHeader.slice(7)

  const supabase = createServiceClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser(token)
  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .maybeSingle()

  if (profileError || !profile?.is_admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Fetch the closed set of approved sources. Individual failures are
  // tolerated and reported; they do not abort the whole request.
  const sources = await Promise.all(APPROVED_SOURCES.map((url) => fetchSourceText(url)))
  const fetchedByUrl = new Map(sources.map((s) => [s.url, s]))
  const okSources = sources.filter((s) => s.ok)

  if (okSources.length === 0) {
    return NextResponse.json(
      { error: 'Failed to fetch any approved source.', sources },
      { status: 502 }
    )
  }

  const systemPrompt = buildSystemPrompt()
  const userPrompt = buildUserPrompt(sources)

  if (!ENABLE_CAMPAIGN_EVIDENCE_EXTRACTION) {
    // --- Gate I40 dry-run boundary ---------------------------------------
    // No Anthropic call occurs while this flag is false. Nothing below this
    // block may run. Do not remove or bypass this guard without a separate,
    // explicit approval authorizing the live Anthropic call.
    // -----------------------------------------------------------------------
    return NextResponse.json({
      dryRun: true,
      message: 'Anthropic call disabled pending explicit approval. No model call was made.',
      candidateId: CANDIDATE_ID,
      methodologyVersion: METHODOLOGY_VERSION,
      inScopeDimensions: IN_SCOPE_DIMENSIONS,
      sourcesFetched: sources.map((s) => ({
        url: s.url,
        ok: s.ok,
        error: s.error ?? null,
        extractedTextLength: s.text.length,
        extractedTextPreview: s.text.slice(0, 400),
      })),
      model: ANTHROPIC_MODEL,
      systemPrompt,
      userPrompt,
    })
  }

  // ---------------------------------------------------------------------------
  // BLOCKED PENDING APPROVAL: unreachable while ENABLE_CAMPAIGN_EVIDENCE_EXTRACTION
  // is false, per the guard above.
  // ---------------------------------------------------------------------------
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY is not configured.' }, { status: 500 })
  }

  let anthropicRes: Response
  try {
    anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: ANTHROPIC_MODEL,
        max_tokens: 6000,
        // Gate I44 fix — claude-sonnet-5 runs adaptive (on-by-default)
        // extended thinking when `thinking` is omitted, which is what
        // produced the unrequested "thinking" content block Gate I43
        // observed consuming part of the max_tokens budget. `{ type:
        // "disabled" }` is an accepted value for this model (unlike some
        // newer models where disabling thinking 400s) and is GA — no
        // anthropic-beta header required.
        thinking: { type: 'disabled' },
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      }),
      signal: AbortSignal.timeout(60000),
    })
  } catch (err) {
    return NextResponse.json(
      { error: 'Anthropic request failed', detail: err instanceof Error ? err.message : String(err) },
      { status: 502 }
    )
  }

  if (!anthropicRes.ok) {
    const detail = await anthropicRes.text()
    return NextResponse.json({ error: `Anthropic API error ${anthropicRes.status}`, detail }, { status: 502 })
  }

  const anthropicJson = (await anthropicRes.json()) as {
    content?: { type: string; text?: string }[]
    stop_reason?: string | null
    stop_sequence?: string | null
  }

  // Gate I42 fix — the prior implementation used
  // content?.find((c) => c.type === 'text')?.text, which silently discarded
  // every text block after the first. Anthropic responses can contain more
  // than one text-type content block; only non-text block types are
  // excluded here, and text blocks are never reordered — only concatenated
  // in the order Anthropic returned them.
  const contentBlocks = anthropicJson.content ?? []
  const textBlocks = contentBlocks.filter((block) => block.type === 'text').map((block) => block.text ?? '')
  const combinedText = textBlocks.join('')

  // Safe response diagnostics only. Never includes API keys, bearer tokens,
  // auth cookies, or any other secret — every field here is derived solely
  // from Anthropic's own response shape/metadata and block character counts.
  const responseDiagnostics = {
    stopReason: anthropicJson.stop_reason ?? null,
    stopSequence: anthropicJson.stop_sequence ?? null,
    contentBlockCount: contentBlocks.length,
    contentBlockTypes: contentBlocks.map((block) => block.type),
    textBlockLengths: textBlocks.map((text) => text.length),
    combinedTextLength: combinedText.length,
  }

  if (textBlocks.length === 0) {
    return NextResponse.json(
      { error: 'Anthropic response contained no text content blocks.', responseDiagnostics },
      { status: 502 }
    )
  }

  let parsed: { candidate_id?: string; methodology_version?: string; evidence?: unknown[] }
  try {
    parsed = JSON.parse(normalizeModelJson(combinedText))
  } catch {
    const likelyTruncated = looksLikelyTruncated(combinedText)
    return NextResponse.json(
      {
        error: likelyTruncated
          ? 'Model response appears truncated (incomplete JSON).'
          : 'Model did not return valid JSON (malformed).',
        rawModelText: combinedText,
        responseDiagnostics,
      },
      { status: 502 }
    )
  }

  if (parsed.candidate_id !== CANDIDATE_ID) {
    return NextResponse.json(
      {
        error: `Top-level candidate_id mismatch or missing (got ${JSON.stringify(parsed.candidate_id)}).`,
        rawModelText: combinedText,
        responseDiagnostics,
      },
      { status: 502 }
    )
  }
  if (parsed.methodology_version !== METHODOLOGY_VERSION) {
    return NextResponse.json(
      {
        error: `Top-level methodology_version mismatch (got ${JSON.stringify(parsed.methodology_version)}).`,
        rawModelText: combinedText,
        responseDiagnostics,
      },
      { status: 502 }
    )
  }

  const evidenceArray = Array.isArray(parsed.evidence) ? parsed.evidence : []
  const validated: EvidenceDraft[] = []
  const rejected: { reason: string; raw: unknown }[] = []

  for (const item of evidenceArray) {
    const result = validateEvidenceRow(item, fetchedByUrl)
    if (result.valid) {
      validated.push(result.row)
    } else {
      rejected.push({ reason: result.reason, raw: result.raw })
    }
  }

  crossCheckConflicts(validated)

  return NextResponse.json({
    dryRun: false,
    candidateId: CANDIDATE_ID,
    methodologyVersion: METHODOLOGY_VERSION,
    model: ANTHROPIC_MODEL,
    responseDiagnostics,
    sourcesFetched: sources.map((s) => ({ url: s.url, ok: s.ok, error: s.error ?? null })),
    validatedEvidence: validated,
    rejectedEvidence: rejected,
    humanReviewChecklist: HUMAN_REVIEW_CHECKLIST,
    reviewSummary: `${validated.length} validated draft row(s), ${rejected.length} rejected by server-side validation. extraction_status is "draft" for every validated row — none are approved, and nothing has been written to Supabase. Every row requires manual human review against the live source pages before any future, separately-approved insert.`,
  })
}
