'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import {
  getMeasureProfile,
  getMeasureDimensions,
  type MeasureProfile,
  type MeasureDimensions,
} from '@/lib/measures'

const TYPE_STYLES: Record<string, { tag: string; label: string }> = {
  bond: { tag: 'bg-[#EFF6FF] text-[#1D4ED8]', label: 'Bond' },
  ordinance: { tag: 'bg-[#E6FAF6] text-[#00A688]', label: 'Ordinance' },
  zoning: { tag: 'bg-[#FFF7ED] text-[#C2410C]', label: 'Zoning' },
  referendum: { tag: 'bg-[#EEF2FF] text-[#4338CA]', label: 'Referendum' },
}

const DIMENSION_LABELS: Record<string, string> = {
  growth_development: 'Growth & Development',
  taxation_spending: 'Taxes & Services',
  education: 'Education',
  environment: 'Environment',
  public_safety: 'Public Safety',
  housing: 'Housing',
  transparency: 'Transparency',
}

const DIMENSIONS = [
  'growth_development',
  'taxation_spending',
  'education',
  'environment',
  'public_safety',
  'housing',
  'transparency',
] as const

type DimensionKey = (typeof DIMENSIONS)[number]

function getTypeStyle(type: string) {
  return TYPE_STYLES[type] ?? { tag: 'bg-[#374151] text-[#9CA3AF]', label: type }
}

function isSafeUrl(url: string | null | undefined): boolean {
  if (!url) return false
  return url.startsWith('https://') || url.startsWith('http://')
}

function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatScore(score: number | null | undefined): string {
  if (score === null || score === undefined) return '—'
  return score > 0 ? `+${score}` : String(score)
}

function scoreColor(score: number | null | undefined): string {
  if (score === null || score === undefined) return 'text-[#6B7280]'
  if (score > 0) return 'text-[#00C9A7]'
  if (score < 0) return 'text-[#FF6B6B]'
  return 'text-[#9CA3AF]'
}

export default function MeasureProfilePage() {
  const router = useRouter()
  const params = useParams()
  const measureId = params.id as string

  const [measure, setMeasure] = useState<MeasureProfile | null>(null)
  const [dimensions, setDimensions] = useState<MeasureDimensions | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadMeasure() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!session) {
          router.push('/onboarding')
          return
        }

        const [profileData, dimensionsData] = await Promise.all([
          getMeasureProfile(measureId),
          getMeasureDimensions(measureId),
        ])

        if (!profileData) {
          setError('Measure not found.')
          setLoading(false)
          return
        }

        setMeasure(profileData)
        setDimensions(dimensionsData)
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : 'Something went wrong loading this measure.'
        setError(message)
      } finally {
        setLoading(false)
      }
    }

    if (measureId) {
      loadMeasure()
    }
  }, [measureId, router])

  return (
    <div className="min-h-screen bg-[#0D1117] px-6 pt-12 pb-28">
      <Link
        href="/ballot"
        className="flex items-center gap-1 text-[#9CA3AF] text-sm mb-6 hover:text-[#00C9A7] transition-colors [font-family:var(--font-instrument-sans)]"
      >
        &lt;- Ballot
      </Link>

      {loading && (
        <div className="flex flex-col gap-4 animate-pulse">
          <div className="h-4 w-20 bg-[#374151] rounded-full mb-1" />
          <div className="h-6 w-64 bg-[#374151] rounded mb-1" />
          <div className="h-3 w-40 bg-[#374151] rounded mb-4" />
          <div className="h-28 bg-[#1F2937] rounded-2xl" />
          <div className="h-48 bg-[#1F2937] rounded-2xl" />
        </div>
      )}

      {error && (
        <div className="bg-[#FF6B6B]/10 border border-[#FF6B6B]/30 rounded-2xl p-4">
          <p className="text-[#FF6B6B] text-sm [font-family:var(--font-instrument-sans)]">
            {error}
          </p>
          <button
            onClick={() => router.push('/ballot')}
            className="mt-4 w-full bg-[#00C9A7] text-[#0D1117] font-bold py-3 rounded-xl text-sm active:scale-[0.98] transition-transform [font-family:var(--font-syne)]"
          >
            Back to Ballot
          </button>
        </div>
      )}

      {!loading && !error && measure && (
        <div className="flex flex-col gap-5">
          {/* Header */}
          <header>
            <div className="mb-2">
              <span
                className={`text-xs font-semibold px-2 py-0.5 rounded-full [font-family:var(--font-syne)] ${getTypeStyle(measure.type).tag}`}
              >
                {getTypeStyle(measure.type).label}
              </span>
            </div>
            <h1 className="text-white text-xl font-bold leading-tight mb-2 [font-family:var(--font-syne)]">
              {measure.title}
            </h1>
            {(measure.district_name || measure.election_date) && (
              <p className="text-[#6B7280] text-xs [font-family:var(--font-instrument-sans)]">
                {measure.district_name}
                {measure.district_name && measure.election_date ? ' — ' : ''}
                {measure.election_date ? formatDate(measure.election_date) : ''}
              </p>
            )}
          </header>

          {/* Plain English Summary */}
          {measure.plain_english_summary && (
            <section className="bg-[#1F2937] rounded-2xl p-4 border border-[#374151]">
              <h2 className="text-[#9CA3AF] text-xs font-semibold uppercase tracking-wider mb-2 [font-family:var(--font-syne)]">
                What it means
              </h2>
              <p className="text-[#D1D5DB] text-sm leading-6 [font-family:var(--font-instrument-sans)]">
                {measure.plain_english_summary}
              </p>
            </section>
          )}

          {/* Full Text Link */}
          {isSafeUrl(measure.full_text_url) && (
            <a
              href={measure.full_text_url!}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full text-center bg-[#1F2937] border border-[#374151] text-[#00C9A7] font-semibold py-3 rounded-2xl text-sm active:scale-[0.98] transition-transform [font-family:var(--font-syne)]"
            >
              Read Full Text
            </a>
          )}

          {/* Dimension Scores */}
          <section>
            <h2 className="text-[#9CA3AF] text-xs font-semibold uppercase tracking-wider mb-2 [font-family:var(--font-syne)]">
              Civic DNA Impact
            </h2>
            {dimensions ? (
              <div className="bg-[#1F2937] rounded-2xl border border-[#374151] overflow-hidden">
                {dimensions.impact_summary && (
                  <div className="px-4 pt-4 pb-3 border-b border-[#374151]">
                    <p className="text-[#D1D5DB] text-sm leading-6 [font-family:var(--font-instrument-sans)]">
                      {dimensions.impact_summary}
                    </p>
                  </div>
                )}
                <div className="divide-y divide-[#374151]">
                  {DIMENSIONS.map((key) => {
                    const score = dimensions[key as DimensionKey]
                    return (
                      <div key={key} className="flex items-center justify-between px-4 py-3">
                        <span className="text-[#9CA3AF] text-xs [font-family:var(--font-instrument-sans)]">
                          {DIMENSION_LABELS[key]}
                        </span>
                        <span
                          className={`text-sm font-semibold [font-family:var(--font-syne)] ${scoreColor(score)}`}
                        >
                          {formatScore(score)}
                        </span>
                      </div>
                    )
                  })}
                </div>
                {dimensions.scored_by && (
                  <div className="px-4 py-2 border-t border-[#374151]">
                    <p className="text-[#6B7280] text-xs [font-family:var(--font-instrument-sans)]">
                      Scored by:{' '}
                      {dimensions.scored_by === 'ai_draft'
                        ? 'AI draft — not yet validated'
                        : dimensions.scored_by}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-[#1F2937] rounded-2xl p-4 border border-[#374151]">
                <p className="text-[#6B7280] text-sm [font-family:var(--font-instrument-sans)]">
                  No scoring data yet.
                </p>
              </div>
            )}
          </section>

          {/* Read-only disclaimer */}
          <div className="bg-[#374151]/30 border border-[#374151] rounded-2xl p-4">
            <p className="text-[#6B7280] text-xs leading-5 [font-family:var(--font-instrument-sans)]">
              This is a read-only beta measure profile using placeholder PSL data. Ballot
              measure and scoring data must be replaced and validated before beta users.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
