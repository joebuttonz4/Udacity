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

const SCOPE_STYLES: Record<string, { tag: string; label: string }> = {
  city_council: {
    tag: 'bg-[#E6FAF6] text-[#00A688]',
    label: 'City',
  },
  school_board: {
    tag: 'bg-[#EFF6FF] text-[#1D4ED8]',
    label: 'County',
  },
  county: {
    tag: 'bg-[#EFF6FF] text-[#1D4ED8]',
    label: 'County',
  },
  state: {
    tag: 'bg-[#EEF2FF] text-[#4338CA]',
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

        const ballotCandidates = await getCandidatesForDistricts(districtIds)
        setCandidates(ballotCandidates)
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
    <div className="min-h-screen bg-[#0D1117] px-6 pt-12 pb-28">
      <header className="mb-6">
        <p
          className="text-[#00C9A7] text-sm font-medium mb-2"
          style={{ fontFamily: 'var(--font-syne)' }}
        >
          Your Ballot
        </p>
        <h1
          className="text-3xl font-bold text-white leading-tight mb-3"
          style={{ fontFamily: 'var(--font-syne)' }}
        >
          Local races in your area
        </h1>
        <p
          className="text-[#9CA3AF] text-sm leading-6"
          style={{ fontFamily: 'var(--font-instrument-sans)' }}
        >
          This is a read-only beta ballot using placeholder PSL data. Candidate, funding,
          voting record, and ballot data must be replaced and validated before beta users.
        </p>
      </header>

      {loading && (
        <div className="flex flex-col gap-4">
          {[1, 2, 3].map((item) => (
            <div key={item} className="bg-[#1F2937] rounded-2xl p-4 animate-pulse">
              <div className="h-3 w-24 bg-[#374151] rounded mb-4" />
              <div className="h-4 w-44 bg-[#374151] rounded mb-3" />
              <div className="h-14 bg-[#374151] rounded-xl mb-2" />
              <div className="h-14 bg-[#374151] rounded-xl" />
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="bg-[#FF6B6B]/10 border border-[#FF6B6B]/30 rounded-2xl p-4">
          <p
            className="text-[#FF6B6B] text-sm"
            style={{ fontFamily: 'var(--font-instrument-sans)' }}
          >
            {error}
          </p>
          <button
            onClick={() => router.push('/onboarding')}
            className="mt-4 w-full bg-[#00C9A7] text-[#0D1117] font-bold py-3 rounded-xl text-sm active:scale-[0.98] transition-transform"
            style={{ fontFamily: 'var(--font-syne)' }}
          >
            Go to onboarding
          </button>
        </div>
      )}

      {!loading && !error && candidates.length === 0 && (
        <div className="bg-[#1F2937] border border-[#374151] rounded-2xl p-5">
          <h2
            className="text-white text-lg font-bold mb-2"
            style={{ fontFamily: 'var(--font-syne)' }}
          >
            No candidates found
          </h2>
          <p
            className="text-[#9CA3AF] text-sm leading-6"
            style={{ fontFamily: 'var(--font-instrument-sans)' }}
          >
            Complete onboarding again or check the dummy district and candidate data.
          </p>
        </div>
      )}

      {!loading && !error && candidates.length > 0 && (
        <div className="flex flex-col gap-4">
          {sortedGroups.map(([districtName, raceCandidates]) => {
            const style = getScopeStyle(raceCandidates[0].district_scope)

            return (
              <section
                key={districtName}
                className="bg-[#1F2937] rounded-2xl p-4 border border-[#374151]"
              >
                <div className="flex items-center gap-2 mb-3">
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-full ${style.tag}`}
                    style={{ fontFamily: 'var(--font-syne)' }}
                  >
                    {style.label}
                  </span>
                  <span
                    className="text-[#9CA3AF] text-xs"
                    style={{ fontFamily: 'var(--font-instrument-sans)' }}
                  >
                    {districtName}
                  </span>
                </div>

                <div className="flex flex-col gap-2">
                  {raceCandidates.map((candidate) => (
                    <Link
                      key={candidate.id}
                      href={`/candidates/${candidate.id}`}
                      className="bg-[#0D1117] rounded-xl px-4 py-3 block active:scale-[0.98] transition-transform"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-[#374151] flex items-center justify-center flex-shrink-0">
                            <span
                              className="text-sm font-bold text-[#9CA3AF]"
                              style={{ fontFamily: 'var(--font-syne)' }}
                            >
                              {candidate.name.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <h2
                              className="text-white text-sm font-semibold leading-tight"
                              style={{ fontFamily: 'var(--font-syne)' }}
                            >
                              {candidate.name}
                            </h2>
                            <p
                              className="text-[#6B7280] text-xs mt-1"
                              style={{ fontFamily: 'var(--font-instrument-sans)' }}
                            >
                              {candidate.office}
                            </p>
                          </div>
                        </div>

                        {candidate.is_incumbent && (
                          <span
                            className="text-xs font-semibold text-[#F59E0B] bg-[#F59E0B]/10 px-2 py-0.5 rounded-full flex-shrink-0"
                            style={{ fontFamily: 'var(--font-syne)' }}
                          >
                            Incumbent
                          </span>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )
          })}
        </div>
      )}
    </div>
  )
}