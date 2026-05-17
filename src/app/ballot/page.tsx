'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import {
  getCandidatesForDistricts,
  getUserDistrictIds,
  type CandidateWithContext,
} from '@/lib/candidates'
import { getMeasuresForDistricts, type MeasureProfile } from '@/lib/measures'
import MatchScoreRing from '@/components/ui/MatchScoreRing'

const SCOPE_STYLES: Record<string, { tag: string; label: string }> = {
  city_council: {
    tag: 'bg-[#CCFBF1] text-[#0F766E]',
    label: 'City',
  },
  school_board: {
    tag: 'bg-[#DBEAFE] text-[#1D4ED8]',
    label: 'County',
  },
  county: {
    tag: 'bg-[#DBEAFE] text-[#1D4ED8]',
    label: 'County',
  },
  state: {
    tag: 'bg-[#E0E7FF] text-[#4338CA]',
    label: 'State',
  },
}

const SCOPE_ORDER: Record<string, number> = {
  city_council: 0,
  school_board: 1,
  county: 2,
  state: 3,
}

function getScopeStyle(scope: string) {
  return SCOPE_STYLES[scope] ?? SCOPE_STYLES.state
}

function groupByDistrict(
  candidates: CandidateWithContext[]
): Record<string, CandidateWithContext[]> {
  return candidates.reduce<Record<string, CandidateWithContext[]>>((acc, candidate) => {
    const key = candidate.district_name || 'Your ballot'
    if (!acc[key]) acc[key] = []
    acc[key].push(candidate)
    return acc
  }, {})
}

export default function BallotPage() {
  const router = useRouter()
  const [candidates, setCandidates] = useState<CandidateWithContext[]>([])
  const [measures, setMeasures] = useState<MeasureProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadBallot() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!session) {
          router.push('/onboarding')
          return
        }

        const districtIds = await getUserDistrictIds(session.user.id)

        if (!districtIds.length) {
          setError('No districts found yet. Please complete onboarding first.')
          setLoading(false)
          return
        }

        const [ballotCandidates, ballotMeasures] = await Promise.all([
          getCandidatesForDistricts(districtIds, session.user.id),
          getMeasuresForDistricts(districtIds),
        ])
        setCandidates(ballotCandidates)
        setMeasures(ballotMeasures)
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : 'Something went wrong loading your ballot.'
        setError(message)
      } finally {
        setLoading(false)
      }
    }

    loadBallot()
  }, [router])

  const grouped = groupByDistrict(candidates)
  const sortedGroups = Object.entries(grouped).sort(([, a], [, b]) => {
    return (SCOPE_ORDER[a[0].district_scope] ?? 99) - (SCOPE_ORDER[b[0].district_scope] ?? 99)
  })

  return (
    <div className="min-h-screen flex flex-col">
      {/* Dark hero header */}
      <div className="bg-[#0D1117] px-6 pt-12 pb-8">
        <p className="text-[#00C9A7] text-xs font-semibold uppercase tracking-widest mb-3 [font-family:var(--font-syne)]">
          Your Ballot
        </p>
        <h1 className="text-3xl font-bold text-white leading-tight mb-2 [font-family:var(--font-syne)]">
          Local races in your area
        </h1>
        <p className="text-[#6B7280] text-sm leading-6 [font-family:var(--font-instrument-sans)]">
          Tap any candidate to see their voting record, funding, and your match score.
        </p>
      </div>

      {/* Light content area */}
      <div className="flex-1 bg-[#F6F8FA] px-4 pt-5 pb-24 flex flex-col gap-4">
        {loading && (
          <div className="flex flex-col gap-4">
            {[1, 2, 3].map((item) => (
              <div key={item} className="bg-white rounded-[20px] shadow-sm p-4 animate-pulse">
                <div className="h-3 w-24 bg-[#E5E7EB] rounded mb-4" />
                <div className="h-14 bg-[#F3F4F6] rounded-xl mb-2" />
                <div className="h-14 bg-[#F3F4F6] rounded-xl" />
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="bg-[#FEF2F2] border border-[#FECACA] rounded-[20px] p-4">
            <p className="text-[#DC2626] text-sm [font-family:var(--font-instrument-sans)]">
              {error}
            </p>
            <button
              onClick={() => router.push('/onboarding')}
              className="mt-4 w-full bg-[#00C9A7] text-[#0D1117] font-bold py-3 rounded-xl text-sm active:scale-[0.98] transition-transform [font-family:var(--font-syne)]"
            >
              Go to onboarding
            </button>
          </div>
        )}

        {!loading && !error && candidates.length === 0 && (
          <div className="bg-white rounded-[20px] shadow-sm p-5">
            <h2 className="text-[#0D1117] text-lg font-bold mb-2 [font-family:var(--font-syne)]">
              No candidates found
            </h2>
            <p className="text-[#6B7280] text-sm leading-6 [font-family:var(--font-instrument-sans)]">
              Complete onboarding to see your local races.
            </p>
          </div>
        )}

        {!loading && !error && candidates.length > 0 && (
          <>
            {sortedGroups.map(([districtName, raceCandidates]) => {
              const style = getScopeStyle(raceCandidates[0].district_scope)

              return (
                <section
                  key={districtName}
                  className="bg-white rounded-[20px] shadow-sm p-4"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full [font-family:var(--font-syne)] ${style.tag}`}>
                      {style.label}
                    </span>
                    <span className="text-[#6B7280] text-xs [font-family:var(--font-instrument-sans)]">
                      {districtName}
                    </span>
                  </div>

                  <div className="flex flex-col gap-2">
                    {raceCandidates.map((candidate) => (
                      <Link
                        key={candidate.id}
                        href={`/candidates/${candidate.id}`}
                        className="bg-[#F6F8FA] rounded-xl px-4 py-3 block active:scale-[0.98] transition-transform"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="w-9 h-9 rounded-full bg-[#E5E7EB] flex items-center justify-center flex-shrink-0">
                              <span className="text-sm font-bold text-[#6B7280] [font-family:var(--font-syne)]">
                                {candidate.name.charAt(0)}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h2 className="text-[#0D1117] text-sm font-semibold leading-tight [font-family:var(--font-syne)]">
                                  {candidate.name}
                                </h2>
                                {candidate.is_incumbent && (
                                  <span className="text-[10px] font-semibold text-[#D97706] bg-[#FEF3C7] px-2 py-0.5 rounded-full [font-family:var(--font-syne)]">
                                    Incumbent
                                  </span>
                                )}
                              </div>
                              <p className="text-[#6B7280] text-xs mt-0.5 truncate [font-family:var(--font-instrument-sans)]">
                                {candidate.office}
                              </p>
                            </div>
                          </div>

                          <MatchScoreRing score={candidate.match_score} size="sm" />
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              )
            })}

            {measures.length > 0 && (
              <section className="bg-white rounded-[20px] shadow-sm p-4">
                <h2 className="text-[#6B7280] text-[11px] font-semibold uppercase tracking-widest mb-3 [font-family:var(--font-syne)]">
                  Measures
                </h2>
                <div className="flex flex-col gap-2">
                  {measures.map((measure) => (
                    <Link
                      key={measure.id}
                      href={`/measures/${measure.id}`}
                      className="bg-[#F6F8FA] rounded-xl px-4 py-3 block active:scale-[0.98] transition-transform"
                    >
                      <p className="text-[#0D1117] text-sm font-semibold leading-tight [font-family:var(--font-syne)]">
                        {measure.title}
                      </p>
                      {measure.district_name && (
                        <p className="text-[#6B7280] text-xs mt-1 [font-family:var(--font-instrument-sans)]">
                          {measure.district_name}
                        </p>
                      )}
                    </Link>
                  ))}
                </div>
              </section>
            )}

            <div className="bg-[#FFFBEB] border border-[#FDE68A] rounded-[20px] p-4">
              <p className="text-[#92400E] text-xs leading-5 [font-family:var(--font-instrument-sans)]">
                Read-only beta using placeholder PSL data. Candidate, funding, voting record,
                and ballot data must be replaced before beta users.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
