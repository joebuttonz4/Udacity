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

type Review = {
  id: string
  user_id: string
  rating: number
  body: string | null
  created_at: string
}

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

function formatReviewDate(dateStr: string): string {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function StarIcon({ filled, size = 20 }: { filled: boolean; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? '#F59E0B' : 'none'}
      stroke={filled ? '#F59E0B' : '#C4C9D4'}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 2.5l2.9 6.6 7.1.7-5.4 4.8 1.6 7-6.2-3.7-6.2 3.7 1.6-7-5.4-4.8 7.1-.7z" />
    </svg>
  )
}

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <StarIcon key={n} filled={n <= rating} size={16} />
      ))}
    </div>
  )
}

export default function MeasureProfilePage() {
  const router = useRouter()
  const params = useParams()
  const measureId = params.id as string

  const [measure, setMeasure] = useState<MeasureProfile | null>(null)
  const [dimensions, setDimensions] = useState<MeasureDimensions | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [userId, setUserId] = useState<string | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [reviewsLoading, setReviewsLoading] = useState(true)
  const [reviewsError, setReviewsError] = useState<string | null>(null)
  const [ratingInput, setRatingInput] = useState(0)
  const [reviewBody, setReviewBody] = useState('')
  const [submittingReview, setSubmittingReview] = useState(false)
  const [reviewSubmitError, setReviewSubmitError] = useState<string | null>(null)

  const myReview = userId ? reviews.find((r) => r.user_id === userId) ?? null : null

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

  // Reviews load independently of the main measure fetch above, so a reviews
  // failure never blocks the rest of the measure profile from rendering.
  useEffect(() => {
    async function loadReviews() {
      setReviewsLoading(true)
      setReviewsError(null)
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()
        if (session) setUserId(session.user.id)

        const { data, error: reviewsErr } = await supabase
          .from('reviews')
          .select('id, user_id, rating, body, created_at')
          .eq('measure_id', measureId)
          .order('created_at', { ascending: false })

        if (reviewsErr) throw reviewsErr
        setReviews((data ?? []) as Review[])
      } catch (err: unknown) {
        setReviewsError(
          err instanceof Error ? err.message : 'Could not load reviews.'
        )
      } finally {
        setReviewsLoading(false)
      }
    }

    if (measureId) {
      loadReviews()
    }
  }, [measureId])

  async function handleSubmitReview(e: React.FormEvent) {
    e.preventDefault()
    if (!ratingInput || submittingReview) return

    setSubmittingReview(true)
    setReviewSubmitError(null)

    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      router.push('/onboarding')
      return
    }

    const { data, error: insertError } = await supabase
      .from('reviews')
      .insert({
        user_id: session.user.id,
        measure_id: measureId,
        candidate_id: null,
        rating: ratingInput,
        body: reviewBody.trim() || null,
      })
      .select('id, user_id, rating, body, created_at')
      .single()

    if (insertError) {
      setReviewSubmitError('Something went wrong submitting your review. Please try again.')
      setSubmittingReview(false)
      return
    }

    setReviews((prev) => [data as Review, ...prev])
    setRatingInput(0)
    setReviewBody('')
    setSubmittingReview(false)
  }

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
          <div className="bg-[#FEF2F2] border border-[#FECACA] rounded-[24px] p-4">
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
            <div className="h-28 bg-white rounded-[24px] shadow-sm" />
            <div className="h-48 bg-white rounded-[24px] shadow-sm" />
          </div>
        )}

        {!loading && !error && measure && (
          <>
            {/* Plain English Summary */}
            {measure.plain_english_summary && (
              <section className="bg-white rounded-[24px] shadow-sm p-4">
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
                className="block w-full text-center bg-[#0D1117] text-[#00C9A7] font-semibold py-3.5 rounded-[24px] text-sm active:scale-[0.98] transition-transform [font-family:var(--font-syne)]"
              >
                Read Full Text ↗
              </a>
            )}

            {/* Dimension Scores */}
            <section className="bg-white rounded-[24px] shadow-sm p-4">
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
            <div className="bg-[#FFFBEB] border border-[#FDE68A] rounded-[24px] p-4">
              <p className="text-[#92400E] text-xs leading-5 [font-family:var(--font-instrument-sans)]">
                CivicMarket beta — ballot measure data sourced from official public records.
                AI-drafted dimension scores are reviewed before publication.
              </p>
            </div>

            {/* Community Reviews */}
            <section className="bg-white rounded-[24px] shadow-sm p-4">
              <h2 className="text-[#6B7280] text-[11px] font-semibold uppercase tracking-widest mb-1 [font-family:var(--font-syne)]">
                Community Reviews
              </h2>
              <p className="text-[#9CA3AF] text-xs mb-3 [font-family:var(--font-instrument-sans)]">
                Personal opinions from other CivicMarket users — not verified facts. See{' '}
                <Link href="/corrections" className="text-[#00C9A7] font-medium">
                  Corrections Policy
                </Link>{' '}
                for how factual errors are handled.
              </p>

              {reviewsLoading && (
                <div className="flex flex-col gap-2.5 animate-pulse">
                  <div className="h-20 bg-[#F8FAFC] rounded-2xl" />
                  <div className="h-20 bg-[#F8FAFC] rounded-2xl" />
                </div>
              )}

              {!reviewsLoading && reviewsError && (
                <p className="text-[#9CA3AF] text-sm [font-family:var(--font-instrument-sans)]">
                  Could not load reviews right now. Please try again later.
                </p>
              )}

              {!reviewsLoading && !reviewsError && reviews.length === 0 && (
                <p className="text-[#9CA3AF] text-sm mb-4 [font-family:var(--font-instrument-sans)]">
                  No reviews yet. Be the first to share your thoughts.
                </p>
              )}

              {!reviewsLoading && !reviewsError && reviews.length > 0 && (
                <div className="flex flex-col gap-2.5 mb-4">
                  {reviews.map((r) => (
                    <div
                      key={r.id}
                      className="bg-[#F8FAFC] border border-[#EEF2F7] rounded-2xl p-4"
                    >
                      <div className="flex items-center justify-between gap-3 mb-1.5">
                        <StarRow rating={r.rating} />
                        <span className="text-[#9CA3AF] text-xs flex-shrink-0 [font-family:var(--font-instrument-sans)]">
                          {r.user_id === userId ? 'You' : 'Community member'}
                        </span>
                      </div>
                      {r.body && (
                        <p className="text-[#374151] text-sm leading-6 [font-family:var(--font-instrument-sans)]">
                          {r.body}
                        </p>
                      )}
                      <p className="text-[#9CA3AF] text-[11px] mt-2 [font-family:var(--font-instrument-sans)]">
                        {formatReviewDate(r.created_at)}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {!reviewsLoading && !reviewsError && (
                myReview ? (
                  <div className="bg-[#F0FDF9] border border-[#99F6E4] rounded-xl p-3">
                    <p className="text-[#0D9488] text-sm font-medium [font-family:var(--font-instrument-sans)]">
                      You&apos;ve already reviewed this measure. Thanks for sharing your thoughts!
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmitReview} className="flex flex-col gap-3">
                    <div>
                      <p className="text-[#6B7280] text-xs font-semibold uppercase tracking-widest mb-2 [font-family:var(--font-syne)]">
                        Your rating
                      </p>
                      <div className="flex gap-2" role="radiogroup" aria-label="Star rating">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <button
                            key={n}
                            type="button"
                            onClick={() => setRatingInput(n)}
                            aria-label={`${n} star${n > 1 ? 's' : ''}`}
                            aria-pressed={n <= ratingInput}
                            className="p-1"
                          >
                            <StarIcon filled={n <= ratingInput} size={24} />
                          </button>
                        ))}
                      </div>
                    </div>

                    <textarea
                      value={reviewBody}
                      onChange={(e) => setReviewBody(e.target.value)}
                      placeholder="Share your thoughts (optional)"
                      rows={3}
                      className="w-full bg-[#F8FAFC] border border-[#EEF2F7] rounded-xl px-3 py-2.5 text-[#0D1117] text-sm placeholder-[#9CA3AF] focus:outline-none focus:border-[#00C9A7] transition-colors resize-none [font-family:var(--font-instrument-sans)]"
                    />

                    {reviewSubmitError && (
                      <p className="text-[#DC2626] text-sm [font-family:var(--font-instrument-sans)]">
                        {reviewSubmitError}
                      </p>
                    )}

                    <button
                      type="submit"
                      disabled={!ratingInput || submittingReview}
                      className="w-full bg-[#00C9A7] disabled:opacity-40 text-[#0D1117] font-bold py-3 rounded-xl text-sm active:scale-[0.98] transition-transform [font-family:var(--font-syne)]"
                    >
                      {submittingReview ? 'Submitting…' : 'Submit Review'}
                    </button>
                  </form>
                )
              )}
            </section>

            {/* Report an Inaccuracy */}
            <a
              href={`mailto:joebuttonzii@gmail.com?subject=${encodeURIComponent(
                `Possible inaccuracy: ${measure.title}`
              )}&body=${encodeURIComponent(
                `I'm reporting a possible inaccuracy for the ballot measure "${measure.title}".\n\nDetails:\n`
              )}`}
              className="block w-full text-center bg-white border border-[#E5E7EB] text-[#6B7280] font-semibold py-3.5 rounded-[24px] text-sm active:scale-[0.98] transition-transform shadow-sm [font-family:var(--font-syne)]"
            >
              Report an Inaccuracy
            </a>
          </>
        )}
      </div>
    </div>
  )
}
