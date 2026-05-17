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

const DUMMY_FEED = [
  { id: 1, title: 'Election Day — Port St. Lucie', meta: 'Nov 3, 2026 · All districts' },
  { id: 2, title: 'Candidate filing deadline approaching', meta: 'Oct 15, 2026 · City of Port St. Lucie' },
  { id: 3, title: 'PSL City Council meeting rescheduled', meta: 'Oct 28, 2026 · City Council' },
]

export default function HomePage() {
  const router = useRouter()
  const [candidates, setCandidates] = useState<CandidateWithContext[]>([])
  const [districts, setDistricts] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadHome() {
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
          setLoading(false)
          return
        }

        const allCandidates = await getCandidatesForDistricts(districtIds)
        const uniqueDistricts = [
          ...new Set(allCandidates.map((c) => c.district_name).filter(Boolean)),
        ]
        setCandidates(allCandidates)
        setDistricts(uniqueDistricts)
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : 'Something went wrong loading your home screen.'
        setError(message)
      } finally {
        setLoading(false)
      }
    }

    loadHome()
  }, [router])

  const previewCandidates = candidates.slice(0, 3)

  return (
    <div className="min-h-screen flex flex-col">
      {/* Dark hero header */}
      <div className="bg-[#0D1117] px-6 pt-12 pb-8">
        <p className="text-[#00C9A7] text-xs font-semibold uppercase tracking-widest mb-3 [font-family:var(--font-syne)]">
          CivicMarket
        </p>
        <h1 className="text-3xl font-bold text-white leading-tight mb-2 [font-family:var(--font-syne)]">
          Your local elections
        </h1>
        <p className="text-[#6B7280] text-sm leading-6 [font-family:var(--font-instrument-sans)]">
          Port St. Lucie beta — placeholder data only.
        </p>
      </div>

      {/* Light content area */}
      <div className="flex-1 bg-[#F6F8FA] px-4 pt-5 pb-24 flex flex-col gap-4">
        {loading && (
          <div className="flex flex-col gap-4">
            {[1, 2].map((i) => (
              <div key={i} className="bg-white rounded-[20px] shadow-sm p-4 animate-pulse">
                <div className="h-3 w-24 bg-[#E5E7EB] rounded mb-4" />
                <div className="h-4 w-44 bg-[#E5E7EB] rounded mb-3" />
                <div className="h-12 bg-[#F3F4F6] rounded-xl" />
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

        {!loading && !error && (
          <>
            {districts.length > 0 && (
              <section className="bg-white rounded-[20px] shadow-sm p-4">
                <h2 className="text-[#6B7280] text-[11px] font-semibold uppercase tracking-widest mb-3 [font-family:var(--font-syne)]">
                  Your districts
                </h2>
                <div className="flex flex-wrap gap-2">
                  {districts.map((name) => (
                    <span
                      key={name}
                      className="bg-[#F0FDF9] border border-[#99F6E4] text-[#0D9488] text-xs px-3 py-1.5 rounded-full [font-family:var(--font-instrument-sans)]"
                    >
                      {name}
                    </span>
                  ))}
                </div>
              </section>
            )}

            <section className="bg-white rounded-[20px] shadow-sm p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-[#6B7280] text-[11px] font-semibold uppercase tracking-widest [font-family:var(--font-syne)]">
                  Upcoming races
                </h2>
                <Link
                  href="/ballot"
                  className="text-[#00C9A7] text-xs font-semibold [font-family:var(--font-syne)]"
                >
                  View all
                </Link>
              </div>

              {previewCandidates.length === 0 ? (
                <div className="bg-[#F6F8FA] rounded-xl p-4">
                  <p className="text-[#9CA3AF] text-sm [font-family:var(--font-instrument-sans)]">
                    No races found. Complete onboarding to set your districts.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {previewCandidates.map((candidate) => (
                    <Link
                      key={candidate.id}
                      href={`/candidates/${candidate.id}`}
                      className="bg-[#F6F8FA] rounded-xl px-4 py-3 flex items-center gap-3 active:scale-[0.98] transition-transform"
                    >
                      <div className="w-9 h-9 rounded-full bg-[#E5E7EB] flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-bold text-[#6B7280] [font-family:var(--font-syne)]">
                          {candidate.name.charAt(0)}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[#0D1117] text-sm font-semibold leading-tight truncate [font-family:var(--font-syne)]">
                          {candidate.name}
                        </p>
                        <p className="text-[#6B7280] text-xs mt-0.5 truncate [font-family:var(--font-instrument-sans)]">
                          {candidate.office} &middot; {candidate.district_name}
                        </p>
                      </div>
                      <span className="text-[#D1D5DB] text-lg">&rsaquo;</span>
                    </Link>
                  ))}
                </div>
              )}

              {candidates.length > 3 && (
                <Link
                  href="/ballot"
                  className="mt-3 block w-full text-center bg-[#F0FDF9] border border-[#99F6E4] text-[#00C9A7] font-semibold py-3 rounded-xl text-sm active:scale-[0.98] transition-transform [font-family:var(--font-syne)]"
                >
                  View Full Ballot ({candidates.length} candidates)
                </Link>
              )}
            </section>

            <section className="bg-white rounded-[20px] shadow-sm p-4">
              <h2 className="text-[#6B7280] text-[11px] font-semibold uppercase tracking-widest mb-3 [font-family:var(--font-syne)]">
                Civic feed
              </h2>
              <div className="flex flex-col gap-2">
                {DUMMY_FEED.map((item) => (
                  <div
                    key={item.id}
                    className="bg-[#F6F8FA] rounded-xl px-4 py-3"
                  >
                    <p className="text-[#0D1117] text-sm font-semibold leading-snug [font-family:var(--font-syne)]">
                      {item.title}
                    </p>
                    <p className="text-[#6B7280] text-xs mt-1 [font-family:var(--font-instrument-sans)]">
                      {item.meta}
                    </p>
                  </div>
                ))}
              </div>
            </section>

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
