'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export default function DataSourcesPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function checkAuth() {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) {
        router.push('/onboarding')
        return
      }
      setLoading(false)
    }
    checkAuth()
  }, [router])

  return (
    <div className="min-h-screen bg-[#0D1117] px-6 pt-12 pb-28">
      <Link
        href="/ballot"
        className="flex items-center gap-1 text-[#9CA3AF] text-sm mb-6 hover:text-[#00C9A7] transition-colors [font-family:var(--font-instrument-sans)]"
      >
        &lt;- Ballot
      </Link>

      <header className="mb-6">
        <p className="text-[#00C9A7] text-sm font-medium mb-2 [font-family:var(--font-syne)]">
          Data Sources
        </p>
        <h1 className="text-3xl font-bold text-white leading-tight [font-family:var(--font-syne)]">
          Where the data comes from
        </h1>
      </header>

      {loading && (
        <div className="flex flex-col gap-4 animate-pulse">
          <div className="h-28 bg-[#1F2937] rounded-2xl" />
          <div className="h-28 bg-[#1F2937] rounded-2xl" />
          <div className="h-28 bg-[#1F2937] rounded-2xl" />
        </div>
      )}

      {!loading && (
        <div className="flex flex-col gap-4">

          {/* Candidate information */}
          <section className="bg-[#1F2937] rounded-2xl p-4 border border-[#374151]">
            <h2 className="text-white text-sm font-semibold mb-2 [font-family:var(--font-syne)]">
              Candidate information
            </h2>
            <p className="text-[#9CA3AF] text-sm leading-6 [font-family:var(--font-instrument-sans)]">
              Candidate bios, office, incumbency status, and campaign websites are sourced from
              official election filings, candidate websites, and Port St. Lucie city and county
              government records.
            </p>
          </section>

          {/* Voting records */}
          <section className="bg-[#1F2937] rounded-2xl p-4 border border-[#374151]">
            <h2 className="text-white text-sm font-semibold mb-2 [font-family:var(--font-syne)]">
              Voting records
            </h2>
            <p className="text-[#9CA3AF] text-sm leading-6 [font-family:var(--font-instrument-sans)]">
              Voting records are drawn from official city council and county commission meeting
              minutes, published vote tallies, and public government records. Every voting record
              includes a link to the official source document.
            </p>
          </section>

          {/* Funding data */}
          <section className="bg-[#1F2937] rounded-2xl p-4 border border-[#374151]">
            <h2 className="text-white text-sm font-semibold mb-2 [font-family:var(--font-syne)]">
              Funding data
            </h2>
            <p className="text-[#9CA3AF] text-sm leading-6 [font-family:var(--font-instrument-sans)]">
              Campaign funding figures come from Florida Division of Elections campaign finance
              filings. Totals include contributions reported through the most recent filing
              period and are linked per candidate.
            </p>
          </section>

          {/* Ballot measures */}
          <section className="bg-[#1F2937] rounded-2xl p-4 border border-[#374151]">
            <h2 className="text-white text-sm font-semibold mb-2 [font-family:var(--font-syne)]">
              Ballot measures
            </h2>
            <p className="text-[#9CA3AF] text-sm leading-6 [font-family:var(--font-instrument-sans)]">
              Ballot measure titles, summaries, and full text are sourced from official city and
              county ordinance filings and election board publications. Full-text links point
              directly to the official government document.
            </p>
          </section>

          {/* Civic DNA scoring */}
          <section className="bg-[#1F2937] rounded-2xl p-4 border border-[#374151]">
            <h2 className="text-white text-sm font-semibold mb-2 [font-family:var(--font-syne)]">
              Civic DNA scoring
            </h2>
            <p className="text-[#9CA3AF] text-sm leading-6 [font-family:var(--font-instrument-sans)]">
              Dimension scores for candidates and ballot measures are AI-generated drafts based
              on voting records, funding patterns, and public statements. All AI draft scores are
              reviewed and validated by the CivicMarket team before being shown to beta users.
            </p>
          </section>

          {/* Beta disclaimer */}
          <div className="bg-[#374151]/30 border border-[#374151] rounded-2xl p-4">
            <p className="text-[#6B7280] text-xs leading-5 [font-family:var(--font-instrument-sans)]">
              This pilot build shows source-reviewed Port St. Lucie data where available. Candidate, funding, voting record, ballot, and match details stay hidden or locked unless supported by reviewed official sources.
            </p>
          </div>

        </div>
      )}
    </div>
  )
}

