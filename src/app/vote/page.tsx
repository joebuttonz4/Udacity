'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { getUserDistrictIds } from '@/lib/candidates'
import CoastalHero from '@/components/CoastalHero'

type UpcomingElection = {
  id: string
  name: string
  election_date: string
}

function isSafeUrl(url: string | null | undefined): boolean {
  if (!url) return false
  return url.startsWith('https://') || url.startsWith('http://')
}

function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

const OFFICIAL_LINKS = [
  {
    label: 'St. Lucie County Elections',
    description: 'Polling places, early voting, and vote-by-mail info',
    url: 'https://www.slcelections.com',
  },
  {
    label: 'Florida Voter Registration',
    description: 'Check your registration — Florida Division of Elections',
    url: 'https://dos.myflorida.com/elections/',
  },
]

export default function VotePage() {
  const router = useRouter()
  const [elections, setElections] = useState<UpcomingElection[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadVote() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!session) {
          router.push('/onboarding')
          return
        }

        const districtIds = await getUserDistrictIds(session.user.id)

        if (districtIds.length > 0) {
          const { data, error: elErr } = await supabase
            .from('elections')
            .select('id, name, election_date')
            .in('district_id', districtIds)
            .gte('election_date', new Date().toISOString().split('T')[0])
            .order('election_date')

          if (elErr) throw elErr
          setElections((data ?? []) as UpcomingElection[])
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Something went wrong loading vote info.')
      } finally {
        setLoading(false)
      }
    }

    loadVote()
  }, [router])

  return (
    <div className="min-h-screen flex flex-col">
      <CoastalHero
        eyebrow="Vote"
        title="How to vote"
        subtitle="Official resources for Port St. Lucie. Links open official government websites — we never collect your voting data."
      />

      {/* Light content area */}
      <div className="flex-1 bg-[#F6F8FA] px-4 pt-5 pb-28 flex flex-col gap-4">
        {loading && (
          <div className="flex flex-col gap-4 animate-pulse">
            <div className="h-20 bg-white rounded-[24px] shadow-sm" />
            <div className="h-40 bg-white rounded-[24px] shadow-sm" />
          </div>
        )}

        {error && (
          <div className="bg-[#FEF2F2] border border-[#FECACA] rounded-[24px] p-4">
            <p className="text-[#DC2626] text-sm [font-family:var(--font-instrument-sans)]">
              {error}
            </p>
          </div>
        )}

        {!loading && !error && (
          <>
            {elections.length > 0 && (
              <section className="bg-white rounded-[24px] shadow-sm p-4">
                <h2 className="text-[#6B7280] text-[11px] font-semibold uppercase tracking-widest mb-3 [font-family:var(--font-syne)]">
                  Your upcoming elections
                </h2>
                <div className="flex flex-col gap-2">
                  {elections.map((el) => (
                    <div key={el.id} className="bg-[#F6F8FA] rounded-xl px-4 py-3">
                      <p className="text-[#0D1117] text-sm font-semibold [font-family:var(--font-syne)]">
                        {el.name}
                      </p>
                      <p className="text-[#00C9A7] text-xs mt-1 [font-family:var(--font-instrument-sans)]">
                        {formatDate(el.election_date)}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section className="bg-white rounded-[24px] shadow-sm p-4">
              <h2 className="text-[#6B7280] text-[11px] font-semibold uppercase tracking-widest mb-3 [font-family:var(--font-syne)]">
                Official resources
              </h2>
              <div className="flex flex-col gap-2">
                {OFFICIAL_LINKS.filter((l) => isSafeUrl(l.url)).map((link) => (
                  <a
                    key={link.label}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-[#F6F8FA] rounded-xl px-4 py-3 flex items-center justify-between gap-3 active:scale-[0.98] transition-transform"
                  >
                    <div>
                      <p className="text-[#0D1117] text-sm font-semibold [font-family:var(--font-syne)]">
                        {link.label}
                      </p>
                      <p className="text-[#6B7280] text-xs mt-1 [font-family:var(--font-instrument-sans)]">
                        {link.description}
                      </p>
                    </div>
                    <span className="text-[#00C9A7] text-lg flex-shrink-0">↗</span>
                  </a>
                ))}
              </div>
            </section>

            <div className="bg-[#FFFBEB] border border-[#FDE68A] rounded-[24px] p-4">
              <p className="text-[#92400E] text-xs leading-5 [font-family:var(--font-instrument-sans)]">
                Read-only beta. Links open official government websites in a new tab.
                CivicMarket does not collect or transmit your voting data. Polling place details
                will be confirmed with real PSL data before beta invitations.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
