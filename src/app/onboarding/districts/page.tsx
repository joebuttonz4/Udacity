'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import {
  getCandidatesForDistricts,
  autoFollowCandidates,
  getUserDistrictIds,
  type CandidateWithContext,
} from '@/lib/candidates'

// Scope → color mapping
const SCOPE_STYLES: Record<string, { tag: string; dot: string; label: string }> = {
  city_council: {
    tag: 'bg-[#E6FAF6] text-[#00A688]',
    dot: 'bg-[#00C9A7]',
    label: 'City',
  },
  school_board: {
    tag: 'bg-[#EFF6FF] text-[#1D4ED8]',
    dot: 'bg-[#3B82F6]',
    label: 'County',
  },
  county: {
    tag: 'bg-[#EFF6FF] text-[#1D4ED8]',
    dot: 'bg-[#3B82F6]',
    label: 'County',
  },
  state: {
    tag: 'bg-[#EEF2FF] text-[#4338CA]',
    dot: 'bg-[#4338CA]',
    label: 'State',
  },
}

function getScopeStyle(scope: string) {
  return SCOPE_STYLES[scope] ?? SCOPE_STYLES['state']
}

// Group candidates by district_name
function groupByDistrict(
  candidates: CandidateWithContext[]
): Record<string, CandidateWithContext[]> {
  return candidates.reduce<Record<string, CandidateWithContext[]>>((acc, c) => {
    const key = c.district_name
    if (!acc[key]) acc[key] = []
    acc[key].push(c)
    return acc
  }, {})
}

// Scope sort order
const SCOPE_ORDER: Record<string, number> = {
  city_council: 0,
  school_board: 1,
  county: 2,
  state: 3,
}

export default function DistrictsPage() {
  const router = useRouter()
  const [candidates, setCandidates] = useState<CandidateWithContext[]>([])
  const [loading, setLoading] = useState(true)
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) { router.push('/onboarding'); return }

        const districtIds = await getUserDistrictIds(session.user.id)
        if (!districtIds.length) { setError('No districts found. Please go back and re-enter your ZIP.'); setLoading(false); return }

        const data = await getCandidatesForDistricts(districtIds)
        setCandidates(data)
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Something went wrong loading your ballot.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [router])

  async function handleConfirm() {
    setConfirming(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')

      await autoFollowCandidates(session.user.id, candidates.map((c) => c.id))
      router.push('/onboarding/dna-teaser')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
      setConfirming(false)
    }
  }

  // Sort district groups by scope order
  const grouped = groupByDistrict(candidates)
  const sortedGroups = Object.entries(grouped).sort(([, a], [, b]) => {
    return (SCOPE_ORDER[a[0].district_scope] ?? 99) - (SCOPE_ORDER[b[0].district_scope] ?? 99)
  })

  return (
    <div className="min-h-screen bg-[#0D1117] flex flex-col">
      {/* Header */}
      <div className="px-6 pt-12 pb-6">
        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-8">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`h-1 rounded-full transition-all ${
                i === 2
                  ? 'w-6 bg-[#00C9A7]'
                  : i < 2
                  ? 'w-4 bg-[#374151]'
                  : 'w-4 bg-[#1F2937]'
              }`}
            />
          ))}
        </div>

        <p className="text-[#00C9A7] text-sm font-medium mb-2" style={{ fontFamily: 'var(--font-syne)' }}>
          Your 2026 Ballot
        </p>
        <h1
          className="text-2xl font-bold text-white leading-tight mb-2"
          style={{ fontFamily: 'var(--font-syne)' }}
        >
          Here&apos;s who you&apos;ll be voting on
        </h1>
        <p className="text-[#6B7280] text-sm" style={{ fontFamily: 'var(--font-instrument-sans)' }}>
          We found {candidates.length} candidates across {sortedGroups.length} races in your area.
          You&apos;re automatically following all of them.
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 px-6 pb-32 overflow-y-auto">
        {loading && (
          <div className="flex flex-col gap-4 mt-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-[#1F2937] rounded-2xl p-4 animate-pulse">
                <div className="h-3 w-24 bg-[#374151] rounded mb-4" />
                <div className="h-4 w-40 bg-[#374151] rounded mb-3" />
                <div className="h-14 bg-[#374151] rounded-xl mb-2" />
                <div className="h-14 bg-[#374151] rounded-xl" />
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="bg-[#FF6B6B]/10 border border-[#FF6B6B]/30 rounded-2xl p-4 mt-2">
            <p className="text-[#FF6B6B] text-sm" style={{ fontFamily: 'var(--font-instrument-sans)' }}>
              {error}
            </p>
          </div>
        )}

        {!loading && !error && (
          <div className="flex flex-col gap-4">
            {sortedGroups.map(([districtName, raceCandidates]) => {
              const scope = raceCandidates[0].district_scope
              const style = getScopeStyle(scope)

              return (
                <div key={districtName} className="bg-[#1F2937] rounded-2xl p-4 border border-[#374151]">
                  {/* Race header */}
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

                  {/* Candidates */}
                  <div className="flex flex-col gap-2">
                    {raceCandidates.map((c) => (
                      <div
                        key={c.id}
                        className="flex items-center justify-between bg-[#0D1117] rounded-xl px-4 py-3"
                      >
                        <div className="flex items-center gap-3">
                          {/* Avatar placeholder */}
                          <div className="w-8 h-8 rounded-full bg-[#374151] flex items-center justify-center flex-shrink-0">
                            <span
                              className="text-xs font-bold text-[#9CA3AF]"
                              style={{ fontFamily: 'var(--font-syne)' }}
                            >
                              {c.name.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <p
                              className="text-white text-sm font-semibold leading-tight"
                              style={{ fontFamily: 'var(--font-syne)' }}
                            >
                              {c.name}
                            </p>
                            <p
                              className="text-[#6B7280] text-xs mt-0.5"
                              style={{ fontFamily: 'var(--font-instrument-sans)' }}
                            >
                              {c.office}
                            </p>
                          </div>
                        </div>

                        {c.is_incumbent && (
                          <span
                            className="text-xs font-semibold text-[#F59E0B] bg-[#F59E0B]/10 px-2 py-0.5 rounded-full flex-shrink-0"
                            style={{ fontFamily: 'var(--font-syne)' }}
                          >
                            Incumbent
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Fixed bottom CTA */}
      {!loading && !error && (
        <div className="fixed bottom-0 left-0 right-0 px-6 pb-10 pt-4 bg-gradient-to-t from-[#0D1117] via-[#0D1117]/95 to-transparent">
          <button
            onClick={handleConfirm}
            disabled={confirming}
            className="w-full bg-[#00C9A7] text-[#0D1117] font-bold py-4 rounded-2xl text-base disabled:opacity-60 active:scale-[0.98] transition-transform"
            style={{ fontFamily: 'var(--font-syne)' }}
          >
            {confirming ? 'Setting up your feed...' : 'These Are My Races →'}
          </button>
          <p
            className="text-center text-[#6B7280] text-xs mt-3"
            style={{ fontFamily: 'var(--font-instrument-sans)' }}
          >
            You&apos;ll automatically follow updates on all of these candidates
          </p>
        </div>
      )}
    </div>
  )
}