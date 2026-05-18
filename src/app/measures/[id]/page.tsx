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
  bond: { tag: 'bg-[#DBEAFE] text-[#1D4ED8]', label: 'Bond' },
  ordinance: { tag: 'bg-[#CCFBF1] text-[#0F766E]', label: 'Ordinance' },
  zoning: { tag: 'bg-[#FEF3C7] text-[#D97706]', label: 'Zoning' },
  referendum: { tag: 'bg-[#E0E7FF] text-[#4338CA]', label: 'Referendum' },
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
  return TYPE_STYLES[type] ?? { tag: 'bg-[#F3F4F6] text-[#6B7280]', label: type }
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
  if (score === null || score === undefined) return 'text-[#9CA3AF]'
  if (score > 0) return 'text-[#0F766E]'
  if (score < 0) return 'text-[#DC2626]'
  return 'text-[#6B7280]'
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
    <div className="min-h-screen flex flex-col">
      {/* Dark hero header */}
      <div className="bg-[#0D1117] px-6 pt-10 pb-8">
        <Link
          href="/ballot"
          className="flex items-center gap-1.5 text-[#6B7280] text-sm mb-6 hover:text-[#00C9A7] transition-colors [font-family:var(--font-instrument-sans)]"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          Ballot
        </Link>

        {loading && (
          <div className="animate-pulse">
            <div className="h-4 w-20 bg-[#1F2937] rounded-full mb-3" />
            <div className="h-6 w-64 bg-[#1F2937] rounded mb-2" />
            <div className="h-3 w-40 bg-[#1F2937] rounded" />
          </div>
        )}

        {!loading && !error && measure && (
          <>
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full [font-family:var(--font-syne)] ${getTypeStyle(measure.type).tag}`}>
              {getTypeStyle(measure.type).label}
            </span>
            <h1 className="text-white text-xl font-bold leading-tight mt-3 mb-2 [font-family:var(--font-syne)]">
              {measure.title}
            </h1>
            {(measure.district_name || measure.election_date) && (
              <p className="text-[#6B7280] text-xs [font-family:var(--font-instrument-sans)]">
                {measure.district_name}
                {measure.district_name && measure.election_date ? ' · ' : ''}
                {measure.election_date ? formatDate(measure.election_date) : ''}
              </p>
            )}
          </>
        )}
      </div>

      {/* Light content area */}
      <div className="flex-1 bg-[#F6F8FA] px-4 pt-5 pb-28 flex flex-col gap-4">
        {error && (
          <div className="bg-[#FEF2F2] border border-[#FECACA] rounded-[20px] p-4">
            <p className="text-[#DC2626] text-sm [font-family:var(--font-instrument-sans)]">
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

        {loading && (
          <div className="flex flex-col gap-4 animate-pulse">
            <div className="h-28 bg-white rounded-[20px] shadow-sm" />
            <div className="h-48 bg-white rounded-[20px] shadow-sm" />
          </div>
        )}

        {!loading && !error && measure && (
          <>
            {/* Plain English Summary */}
            {measure.plain_english_summary && (
              <section className="bg-white rounded-[20px] shadow-sm p-4">
                <h2 className="text-[#6B7280] text-[11px] font-semibold uppercase tracking-widest mb-2 [font-family:var(--font-syne)]">
                  What it means
                </h2>
                <p className="text-[#374151] text-sm leading-6 [font-family:var(--font-instrument-sans)]">
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
                className="block w-full text-center bg-[#0D1117] text-[#00C9A7] font-semibold py-3.5 rounded-[20px] text-sm active:scale-[0.98] transition-transform [font-family:var(--font-syne)]"
              >
                Read Full Text ↗
              </a>
            )}

            {/* Dimension Scores */}
            <section className="bg-white rounded-[20px] shadow-sm p-4">
              <h2 className="text-[#6B7280] text-[11px] font-semibold uppercase tracking-widest mb-3 [font-family:var(--font-syne)]">
                Civic DNA Impact
              </h2>
              {dimensions ? (
                <>
                  {dimensions.impact_summary && (
                    <p className="text-[#374151] text-sm leading-6 mb-3 [font-family:var(--font-instrument-sans)]">
                      {dimensions.impact_summary}
                    </p>
                  )}
                  <div className="flex flex-col divide-y divide-[#F3F4F6]">
                    {DIMENSIONS.map((key) => {
                      const score = dimensions[key as DimensionKey]
                      return (
                        <div key={key} className="flex items-center justify-between py-2.5">
                          <span className="text-[#6B7280] text-sm [font-family:var(--font-instrument-sans)]">
                            {DIMENSION_LABELS[key]}
                          </span>
                          <span className={`text-sm font-semibold [font-family:var(--font-syne)] ${scoreColor(score)}`}>
                            {formatScore(score)}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                  {dimensions.scored_by && (
                    <p className="text-[#9CA3AF] text-xs mt-3 [font-family:var(--font-instrument-sans)]">
                      Scored by:{' '}
                      {dimensions.scored_by === 'ai_draft'
                        ? 'AI draft — not yet validated'
                        : dimensions.scored_by}
                    </p>
                  )}
                </>
              ) : (
                <p className="text-[#9CA3AF] text-sm [font-family:var(--font-instrument-sans)]">
                  No scoring data yet.
                </p>
              )}
            </section>

            {/* Beta disclaimer */}
            <div className="bg-[#FFFBEB] border border-[#FDE68A] rounded-[20px] p-4">
              <p className="text-[#92400E] text-xs leading-5 [font-family:var(--font-instrument-sans)]">
                Read-only beta using placeholder PSL data. Ballot measure and scoring data must
                be replaced and validated before beta users.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
