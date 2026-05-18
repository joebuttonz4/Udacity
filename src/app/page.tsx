'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import {
  getCandidatesForDistricts,
  getUserDistrictIds,
  type CandidateWithContext,
} from '@/lib/candidates'
import MatchScoreRing from '@/components/ui/MatchScoreRing'
import CoastalHero from '@/components/CoastalHero'

const DUMMY_FEED = [
  { id: 1, title: 'Election Day — Port St. Lucie', meta: 'Nov 3, 2026 · All districts' },
  { id: 2, title: 'Candidate filing deadline approaching', meta: 'Oct 15, 2026 · City of Port St. Lucie' },
  { id: 3, title: 'PSL City Council meeting rescheduled', meta: 'Oct 28, 2026 · City Council' },
]

const ELECTION_DATE = new Date('2026-11-03T00:00:00')

type Countdown = { days: number; hours: number; min: number; sec: number }

function computeCountdown(): Countdown {
  const diff = Math.max(0, ELECTION_DATE.getTime() - Date.now())
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    min: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
    sec: Math.floor((diff % (1000 * 60)) / 1000),
  }
}


export default function HomePage() {
  const router = useRouter()
  const [candidates, setCandidates] = useState<CandidateWithContext[]>([])
  const [districts, setDistricts] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [countdown, setCountdown] = useState<Countdown | null>(null)

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

        const allCandidates = await getCandidatesForDistricts(districtIds, session.user.id)
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

  useEffect(() => {
    function tick() { setCountdown(computeCountdown()) }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  const previewCandidates = candidates.slice(0, 3)

  return (
    <div className="min-h-screen flex flex-col">
      <CoastalHero
        warm
        eyebrow="Port St. Lucie, FL"
        title="Your local elections"
        subtitle="Personalized match scores for every candidate on your ballot."
        after={
          /* Frosted glass election countdown card */
          <div className="mt-5 bg-white/[0.07] backdrop-blur-sm border border-white/[0.16] rounded-[22px] px-5 py-4 shadow-[0_4px_24px_rgba(0,0,0,0.3)]">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[#00C9A7] text-[10px] font-semibold uppercase tracking-widest [font-family:var(--font-syne)]">
                Election Day · Nov 3, 2026
              </p>
              <p className="text-white/55 text-[10px] [font-family:var(--font-instrument-sans)]">
                Port St. Lucie, FL
              </p>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {(['days', 'hrs', 'min', 'sec'] as const).map((label, i) => {
                const val = countdown
                  ? [countdown.days, countdown.hours, countdown.min, countdown.sec][i]
                  : null
                return (
                  <div key={label} className="bg-black/[0.22] rounded-[12px] py-2.5 text-center">
                    <p className="text-white text-[22px] font-bold tabular-nums leading-none [font-family:var(--font-syne)]">
                      {val !== null ? String(val).padStart(2, '0') : '--'}
                    </p>
                    <p className="text-white/70 text-[11px] font-medium mt-1 [font-family:var(--font-instrument-sans)]">
                      {label}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        }
      />

      {/* Light content area — first card overlaps hero with negative margin */}
      <div className="flex-1 bg-[#F6F8FA] px-4 pb-28 flex flex-col gap-4">
        {loading && (
          <div className="flex flex-col gap-4 -mt-5">
            {[1, 2].map((i) => (
              <div key={i} className="bg-white rounded-[24px] shadow-md p-4 animate-pulse">
                <div className="h-3 w-24 bg-[#E5E7EB] rounded mb-4" />
                <div className="h-4 w-44 bg-[#E5E7EB] rounded mb-3" />
                <div className="h-12 bg-[#F3F4F6] rounded-xl" />
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="bg-[#FEF2F2] border border-[#FECACA] rounded-[24px] p-4 -mt-5">
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
            {/* Top matches — overlaps hero edge */}
            <section className="bg-white rounded-[24px] shadow-[0_4px_24px_rgba(0,0,0,0.09)] p-4 -mt-6 relative z-10">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[#6B7280] text-[11px] font-semibold uppercase tracking-widest [font-family:var(--font-syne)]">
                  Top matches
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
                <div className="flex flex-col gap-2.5">
                  {previewCandidates.map((candidate, idx) => (
                    <Link
                      key={candidate.id}
                      href={`/candidates/${candidate.id}`}
                      className="bg-[#F8FAFC] border border-[#EEF2F7] rounded-2xl px-4 py-4 flex items-center gap-3 active:scale-[0.98] transition-transform"
                    >
                      <span className="text-[#CBD5E1] text-xs font-bold w-4 text-center flex-shrink-0 [font-family:var(--font-syne)]">
                        {idx + 1}
                      </span>
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0D2218] to-[#0D1117] border border-[#00C9A7]/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-bold text-[#00C9A7] [font-family:var(--font-syne)]">
                          {candidate.name.charAt(0)}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[#0D1117] text-[15px] font-semibold leading-tight truncate [font-family:var(--font-syne)]">
                          {candidate.name}
                        </p>
                        <p className="text-[#94A3B8] text-xs mt-0.5 truncate [font-family:var(--font-instrument-sans)]">
                          {candidate.office} &middot; {candidate.district_name}
                        </p>
                      </div>
                      <MatchScoreRing score={candidate.match_score} size="sm" />
                    </Link>
                  ))}
                </div>
              )}

              {candidates.length > 0 && (
                <Link
                  href="/ballot"
                  className="mt-4 block w-full text-center bg-[#00C9A7] text-[#0D1117] font-bold py-3.5 rounded-2xl text-sm active:scale-[0.98] transition-transform [font-family:var(--font-syne)]"
                >
                  View Full Ballot{candidates.length > 3 ? ` — ${candidates.length} candidates` : ''}
                </Link>
              )}
            </section>

            {/* Your districts */}
            {districts.length > 0 && (
              <section className="bg-white rounded-[24px] shadow-sm p-4">
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

            {/* Civic feed */}
            <section className="bg-white rounded-[24px] shadow-sm p-4">
              <h2 className="text-[#6B7280] text-[11px] font-semibold uppercase tracking-widest mb-3 [font-family:var(--font-syne)]">
                Civic feed
              </h2>
              <div className="flex flex-col gap-2.5">
                {DUMMY_FEED.map((item) => (
                  <div
                    key={item.id}
                    className="bg-[#F8FAFC] border border-[#EEF2F7] rounded-2xl px-4 py-3.5"
                  >
                    <p className="text-[#0D1117] text-sm font-semibold leading-snug [font-family:var(--font-syne)]">
                      {item.title}
                    </p>
                    <p className="text-[#94A3B8] text-xs mt-1 [font-family:var(--font-instrument-sans)]">
                      {item.meta}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <div className="bg-[#FFFBEB] border border-[#FDE68A] rounded-[24px] p-4">
              <p className="text-[#92400E] text-xs leading-5 [font-family:var(--font-instrument-sans)]">
                Beta — placeholder PSL data only. Real candidate, funding, and ballot data coming before launch.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
