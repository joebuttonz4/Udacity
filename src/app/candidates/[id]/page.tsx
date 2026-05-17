'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import {
  getCandidateProfile,
  getCandidateFunding,
  getCandidateVotingRecords,
  type CandidateProfile,
  type CandidateFunding,
  type VotingRecord,
} from '@/lib/candidates'

const VOTE_STYLES: Record<string, { pill: string; label: string }> = {
  for: { pill: 'bg-[#CCFBF1] text-[#0F766E]', label: 'For' },
  against: { pill: 'bg-[#FEE2E2] text-[#DC2626]', label: 'Against' },
  abstain: { pill: 'bg-[#F3F4F6] text-[#6B7280]', label: 'Abstain' },
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

function formatCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return '—'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function isSafeUrl(url: string | null | undefined): boolean {
  if (!url) return false
  return url.startsWith('https://') || url.startsWith('http://')
}

export default function CandidateProfilePage() {
  const router = useRouter()
  const params = useParams()
  const candidateId = params.id as string

  const [candidate, setCandidate] = useState<CandidateProfile | null>(null)
  const [funding, setFunding] = useState<CandidateFunding | null>(null)
  const [votingRecords, setVotingRecords] = useState<VotingRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadProfile() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!session) {
          router.push('/onboarding')
          return
        }

        const [profileData, fundingData, records] = await Promise.all([
          getCandidateProfile(candidateId),
          getCandidateFunding(candidateId),
          getCandidateVotingRecords(candidateId),
        ])

        if (!profileData) {
          setError('Candidate not found.')
          setLoading(false)
          return
        }

        setCandidate(profileData)
        setFunding(fundingData)
        setVotingRecords(records)
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : 'Something went wrong loading this profile.'
        setError(message)
      } finally {
        setLoading(false)
      }
    }

    if (candidateId) {
      loadProfile()
    }
  }, [candidateId, router])

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
          <div className="flex items-center gap-4 animate-pulse">
            <div className="w-14 h-14 rounded-full bg-[#1F2937]" />
            <div className="flex-1">
              <div className="h-5 w-40 bg-[#1F2937] rounded mb-2" />
              <div className="h-3 w-28 bg-[#1F2937] rounded" />
            </div>
          </div>
        )}

        {!loading && !error && candidate && (
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-full bg-[#1F2937] border border-[#374151] flex items-center justify-center flex-shrink-0">
              <span className="text-xl font-bold text-[#9CA3AF] [font-family:var(--font-syne)]">
                {candidate.name.charAt(0)}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h1 className="text-white text-xl font-bold leading-tight [font-family:var(--font-syne)]">
                  {candidate.name}
                </h1>
                {candidate.is_incumbent && (
                  <span className="text-[10px] font-semibold text-[#D97706] bg-[#D97706]/20 px-2 py-0.5 rounded-full [font-family:var(--font-syne)]">
                    Incumbent
                  </span>
                )}
              </div>
              <p className="text-[#00C9A7] text-sm font-medium [font-family:var(--font-syne)]">
                {candidate.office}
              </p>
              {(candidate.district_name || candidate.election_date) && (
                <p className="text-[#6B7280] text-xs mt-1 [font-family:var(--font-instrument-sans)]">
                  {candidate.district_name}
                  {candidate.district_name && candidate.election_date ? ' · ' : ''}
                  {candidate.election_date ? formatDate(candidate.election_date) : ''}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Light content area */}
      <div className="flex-1 bg-[#F6F8FA] px-4 pt-5 pb-24 flex flex-col gap-4">
        {error && (
          <div className="bg-[#FEF2F2] border border-[#FECACA] rounded-[20px] p-4">
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
            <div className="h-24 bg-white rounded-[20px] shadow-sm" />
            <div className="h-40 bg-white rounded-[20px] shadow-sm" />
          </div>
        )}

        {!loading && !error && candidate && (
          <>
            {/* Bio */}
            {candidate.bio && (
              <section className="bg-white rounded-[20px] shadow-sm p-4">
                <p className="text-[#374151] text-sm leading-6 [font-family:var(--font-instrument-sans)]">
                  {candidate.bio}
                </p>
              </section>
            )}

            {/* Website */}
            {isSafeUrl(candidate.website) && (
              <a
                href={candidate.website!}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full text-center bg-[#0D1117] text-[#00C9A7] font-semibold py-3.5 rounded-[20px] text-sm active:scale-[0.98] transition-transform [font-family:var(--font-syne)]"
              >
                Campaign Website ↗
              </a>
            )}

            {/* Funding */}
            <section className="bg-white rounded-[20px] shadow-sm p-4">
              <h2 className="text-[#6B7280] text-[11px] font-semibold uppercase tracking-widest mb-3 [font-family:var(--font-syne)]">
                Funding
              </h2>
              {funding ? (
                <div className="flex flex-col gap-0 divide-y divide-[#F3F4F6]">
                  <div className="flex justify-between items-center py-2.5">
                    <span className="text-[#6B7280] text-sm [font-family:var(--font-instrument-sans)]">
                      Total raised
                    </span>
                    <span className="text-[#0D1117] text-sm font-semibold [font-family:var(--font-syne)]">
                      {formatCurrency(funding.total_raised)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2.5">
                    <span className="text-[#6B7280] text-sm [font-family:var(--font-instrument-sans)]">
                      From neighbors
                    </span>
                    <span className="text-[#0D1117] text-sm font-semibold [font-family:var(--font-syne)]">
                      {formatCurrency(funding.neighbor_donations)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2.5">
                    <span className="text-[#6B7280] text-sm [font-family:var(--font-instrument-sans)]">
                      Institutional %
                    </span>
                    <span className="text-[#0D1117] text-sm font-semibold [font-family:var(--font-syne)]">
                      {funding.institutional_pct !== null && funding.institutional_pct !== undefined
                        ? `${funding.institutional_pct}%`
                        : '—'}
                    </span>
                  </div>
                  {isSafeUrl(funding.source_url) && (
                    <div className="pt-3">
                      <a
                        href={funding.source_url!}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#00C9A7] text-xs font-medium [font-family:var(--font-instrument-sans)]"
                      >
                        View source ↗
                      </a>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-[#9CA3AF] text-sm [font-family:var(--font-instrument-sans)]">
                  No funding data yet.
                </p>
              )}
            </section>

            {/* Voting records */}
            <section className="bg-white rounded-[20px] shadow-sm p-4">
              <h2 className="text-[#6B7280] text-[11px] font-semibold uppercase tracking-widest mb-3 [font-family:var(--font-syne)]">
                Voting Record
              </h2>
              {votingRecords.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {votingRecords.map((record) => {
                    const voteStyle = VOTE_STYLES[record.vote_cast] ?? VOTE_STYLES.abstain
                    return (
                      <div
                        key={record.id}
                        className="bg-[#F6F8FA] rounded-xl p-4"
                      >
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <h3 className="text-[#0D1117] text-sm font-semibold leading-snug flex-1 [font-family:var(--font-syne)]">
                            {record.issue_title}
                          </h3>
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 [font-family:var(--font-syne)] ${voteStyle.pill}`}>
                            {voteStyle.label}
                          </span>
                        </div>
                        {record.issue_description && (
                          <p className="text-[#6B7280] text-xs leading-5 mb-2 line-clamp-2 [font-family:var(--font-instrument-sans)]">
                            {record.issue_description}
                          </p>
                        )}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[#9CA3AF] text-xs [font-family:var(--font-instrument-sans)]">
                              {formatDate(record.vote_date)}
                            </span>
                            {record.dimension && (
                              <span className="text-[10px] bg-[#E5E7EB] text-[#6B7280] px-2 py-0.5 rounded-full [font-family:var(--font-instrument-sans)]">
                                {DIMENSION_LABELS[record.dimension] ?? record.dimension}
                              </span>
                            )}
                          </div>
                          {isSafeUrl(record.source_url) && (
                            <a
                              href={record.source_url!}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#00C9A7] text-xs font-medium [font-family:var(--font-instrument-sans)]"
                            >
                              Source ↗
                            </a>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-[#9CA3AF] text-sm [font-family:var(--font-instrument-sans)]">
                  No voting records yet.
                </p>
              )}
            </section>

            {/* Beta disclaimer */}
            <div className="bg-[#FFFBEB] border border-[#FDE68A] rounded-[20px] p-4">
              <p className="text-[#92400E] text-xs leading-5 [font-family:var(--font-instrument-sans)]">
                Read-only beta using placeholder PSL data. Candidate, funding, and voting record
                data must be replaced and validated before beta users.
              </p>
            </div>

            {/* Report Inaccuracy */}
            <Link
              href="/report"
              className="block w-full text-center bg-white border border-[#E5E7EB] text-[#6B7280] font-semibold py-3.5 rounded-[20px] text-sm active:scale-[0.98] transition-transform shadow-sm [font-family:var(--font-syne)]"
            >
              Report an Inaccuracy
            </Link>
          </>
        )}
      </div>
    </div>
  )
}
