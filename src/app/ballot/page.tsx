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
import CoastalHero from '@/components/CoastalHero'

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

const FILTER_CHIPS = [
  { key: 'all', label: 'All' },
  { key: 'city', label: 'City' },
  { key: 'school', label: 'School' },
  { key: 'county', label: 'County' },
  { key: 'other', label: 'Other' },
] as const

type FilterKey = (typeof FILTER_CHIPS)[number]['key']

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
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all')

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
          router.push('/onboarding/zip')
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

  const filteredGroups =
    activeFilter === 'all'
      ? sortedGroups
      : sortedGroups.filter(([, raceCandidates]) => {
          const scope = raceCandidates[0].district_scope
          if (activeFilter === 'city') return scope === 'city_council'
          if (activeFilter === 'school') return scope === 'school_board'
          if (activeFilter === 'county') return scope === 'county'
          return !['city_council', 'school_board', 'county'].includes(scope)
        })

  return (
    <div className="min-h-screen flex flex-col">
      <CoastalHero
        eyebrow="Your Ballot"
        title="Local races"
        subtitle="Tap any candidate to see their voting record, funding, and your match score."
        after={
          <div className="flex gap-2 overflow-x-auto mt-5 -mx-6 px-6 pb-1">
            {FILTER_CHIPS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setActiveFilter(key)}
                className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold [font-family:var(--font-syne)] transition-colors ${
                  activeFilter === key
                    ? 'bg-[#00C9A7] text-[#0D1117]'
                    : 'bg-white/10 text-white/70 border border-white/20'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        }
      />

      {/* Light content area */}
      <div className="flex-1 bg-[#F6F8FA] px-4 pt-5 pb-28 flex flex-col gap-4">
        {loading && (
          <div className="flex flex-col gap-4">
            {[1, 2, 3].map((item) => (
              <div key={item} className="bg-white rounded-[24px] shadow-sm p-4 animate-pulse">
                <div className="h-3 w-24 bg-[#E5E7EB] rounded mb-4" />
                <div className="h-14 bg-[#F3F4F6] rounded-xl mb-2" />
                <div className="h-14 bg-[#F3F4F6] rounded-xl" />
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="bg-[#FEF2F2] border border-[#FECACA] rounded-[24px] p-4">
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
          <div className="bg-white rounded-[24px] shadow-sm p-5">
            <h2 className="text-[#0D1117] text-lg font-bold mb-2 [font-family:var(--font-syne)]">
              No candidates found
            </h2>
            <p className="text-[#6B7280] text-sm leading-6 [font-family:var(--font-instrument-sans)]">
              No candidates found for your districts yet.
            </p>
          </div>
        )}

        {!loading && !error && candidates.length > 0 && (
          <>
            {filteredGroups.length === 0 && (
              <div className="bg-white rounded-[24px] shadow-sm p-5">
                <p className="text-[#94A3B8] text-sm [font-family:var(--font-instrument-sans)]">
                  No races in this category.
                </p>
              </div>
            )}

            {filteredGroups.map(([districtName, raceCandidates]) => {
              const style = getScopeStyle(raceCandidates[0].district_scope)

              return (
                <section
                  key={districtName}
                  className="bg-white rounded-[24px] shadow-[0_2px_16px_rgba(0,0,0,0.06)] p-4"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full [font-family:var(--font-syne)] ${style.tag}`}>
                      {style.label}
                    </span>
                    <span className="text-[#6B7280] text-xs [font-family:var(--font-instrument-sans)]">
                      {districtName}
                    </span>
                  </div>

                  <div className="flex flex-col gap-2.5">
                    {raceCandidates.map((candidate) => (
                      <Link
                        key={candidate.id}
                        href={`/candidates/${candidate.id}`}
                        className="bg-[#F8FAFC] border border-[#EEF2F7] rounded-2xl px-4 py-4 flex items-center gap-3 active:scale-[0.98] transition-transform"
                      >
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0D2218] to-[#0D1117] border border-[#00C9A7]/20 flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-bold text-[#00C9A7] [font-family:var(--font-syne)]">
                            {candidate.name.charAt(0)}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h2 className="text-[#0D1117] text-[15px] font-semibold leading-tight [font-family:var(--font-syne)]">
                              {candidate.name}
                            </h2>
                            {candidate.is_incumbent && (
                              <span className="text-[10px] font-semibold text-[#D97706] bg-[#FEF3C7] px-2 py-0.5 rounded-full [font-family:var(--font-syne)]">
                                Incumbent
                              </span>
                            )}
                          </div>
                          <p className="text-[#94A3B8] text-xs mt-0.5 truncate [font-family:var(--font-instrument-sans)]">
                            {candidate.office}
                          </p>
                        </div>
                        <MatchScoreRing score={candidate.match_score} size="sm" />
                      </Link>
                    ))}
                  </div>
                </section>
              )
            })}

            {measures.length > 0 && (
              <section className="bg-white rounded-[24px] shadow-[0_2px_16px_rgba(0,0,0,0.06)] p-4">
                <h2 className="text-[#6B7280] text-[11px] font-semibold uppercase tracking-widest mb-3 [font-family:var(--font-syne)]">
                  Measures
                </h2>
                <div className="flex flex-col gap-2.5">
                  {measures.map((measure) => (
                    <Link
                      key={measure.id}
                      href={`/measures/${measure.id}`}
                      className="bg-[#F8FAFC] border border-[#EEF2F7] rounded-2xl px-4 py-3.5 block active:scale-[0.98] transition-transform"
                    >
                      <p className="text-[#0D1117] text-sm font-semibold leading-tight [font-family:var(--font-syne)]">
                        {measure.title}
                      </p>
                      {measure.district_name && (
                        <p className="text-[#94A3B8] text-xs mt-1 [font-family:var(--font-instrument-sans)]">
                          {measure.district_name}
                        </p>
                      )}
                    </Link>
                  ))}
                </div>
              </section>
            )}

            <div className="bg-[#FFFBEB] border border-[#FDE68A] rounded-[24px] p-4">
              <p className="text-[#92400E] text-xs leading-5 [font-family:var(--font-instrument-sans)]">
                Port St. Lucie pilot data is source-reviewed. Voting records, ballot details, and match scores stay locked unless official records support them.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

