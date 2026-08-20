'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getOfficialsForUser, type CurrentOfficial } from '@/lib/officials'

const JURISDICTION_LABELS: Record<string, string> = {
  city: 'City',
  county: 'County',
  school_board: 'School Board',
  state: 'State',
  federal: 'Federal',
}

function isSafeUrl(url: string | null | undefined): boolean {
  if (!url) return false
  return url.startsWith('https://') || url.startsWith('http://')
}

function formatDate(dateStr: string | null): string | null {
  if (!dateStr) return null
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function OfficialCard({ official }: { official: CurrentOfficial }) {
  const card = (
    <div className="bg-[#F8FAFC] border border-[#EEF2F7] rounded-2xl px-4 py-3.5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[#0D1117] text-[15px] font-semibold leading-tight truncate [font-family:var(--font-syne)]">
            {official.name}
          </p>
          <p className="text-[#94A3B8] text-xs mt-0.5 truncate [font-family:var(--font-instrument-sans)]">
            {official.office}
            {official.district_name ? ` - ${official.district_name}` : ''}
          </p>
        </div>
        <span className="flex-shrink-0 bg-[#F0FDF9] border border-[#99F6E4] text-[#0D9488] text-[10px] font-semibold px-2.5 py-1 rounded-full uppercase tracking-wide [font-family:var(--font-syne)]">
          {JURISDICTION_LABELS[official.jurisdiction_level] ?? official.jurisdiction_level}
        </span>
      </div>

      <div className="flex flex-wrap gap-2 mt-3">
        <span
          className={`text-[11px] font-semibold px-2.5 py-1 rounded-full [font-family:var(--font-syne)] ${
            official.is_on_next_ballot
              ? 'bg-[#00C9A7]/10 text-[#0D9488]'
              : 'bg-[#F1F5F9] text-[#94A3B8]'
          }`}
        >
          {official.is_on_next_ballot ? 'On your next ballot' : 'Not on your next ballot'}
        </span>
        <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-[#F1F5F9] text-[#64748B] [font-family:var(--font-syne)]">
          Current official
        </span>
      </div>

      {(official.term_end || official.next_election_date) && (
        <div className="flex flex-col gap-1 mt-3">
          {official.term_end && (
            <p className="text-[#6B7280] text-xs [font-family:var(--font-instrument-sans)]">
              Term ends {formatDate(official.term_end)}
            </p>
          )}
          {official.next_election_date && (
            <p className="text-[#6B7280] text-xs [font-family:var(--font-instrument-sans)]">
              Next election {formatDate(official.next_election_date)}
            </p>
          )}
        </div>
      )}

      <div className="flex items-center gap-4 mt-3">
        {isSafeUrl(official.source_url) && (
          <a
            href={official.source_url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-[#00C9A7] text-xs font-semibold [font-family:var(--font-syne)]"
          >
            Source: official government record
          </a>
        )}
        {!official.candidate_id && isSafeUrl(official.website) && (
          <a
            href={official.website as string}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-[#0D9488] text-xs font-semibold [font-family:var(--font-syne)]"
          >
            Official website
          </a>
        )}
      </div>
    </div>
  )

  if (official.candidate_id) {
    return (
      <Link
        href={`/candidates/${official.candidate_id}`}
        className="block active:scale-[0.98] transition-transform"
      >
        {card}
      </Link>
    )
  }

  return card
}

export default function CurrentOfficialsSection({ userId }: { userId: string }) {
  const [officials, setOfficials] = useState<CurrentOfficial[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    async function load() {
      try {
        const data = await getOfficialsForUser(userId)
        if (active) setOfficials(data)
      } catch (err: unknown) {
        if (active) {
          setError(
            err instanceof Error ? err.message : 'Could not load your current officials.'
          )
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    load()
    return () => {
      active = false
    }
  }, [userId])

  return (
    <section className="bg-white rounded-[24px] shadow-sm p-4">
      <h2 className="text-[#6B7280] text-[11px] font-semibold uppercase tracking-widest mb-1 [font-family:var(--font-syne)]">
        My Current Officials
      </h2>
      <p className="text-[#94A3B8] text-xs mb-3 [font-family:var(--font-instrument-sans)]">
        Officials who currently represent you.
      </p>

      {loading && (
        <div className="flex flex-col gap-2 animate-pulse">
          {[1, 2].map((i) => (
            <div key={i} className="h-24 bg-[#F8FAFC] rounded-2xl" />
          ))}
        </div>
      )}

      {!loading && error && (
        <div className="bg-[#F8FAFC] rounded-xl p-4">
          <p className="text-[#9CA3AF] text-sm [font-family:var(--font-instrument-sans)]">
            {error}
          </p>
        </div>
      )}

      {!loading && !error && officials.length === 0 && (
        <div className="bg-[#F8FAFC] rounded-xl p-4">
          <p className="text-[#9CA3AF] text-sm [font-family:var(--font-instrument-sans)]">
            Current officials will appear here after verified official source data is added.
          </p>
        </div>
      )}

      {!loading && !error && officials.length > 0 && (
        <div className="flex flex-col gap-2">
          {officials.map((official) => (
            <OfficialCard key={official.id} official={official} />
          ))}
        </div>
      )}
    </section>
  )
}

