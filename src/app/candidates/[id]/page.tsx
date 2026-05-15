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
  for: { pill: 'bg-[#00C9A7]/10 text-[#00C9A7] border border-[#00C9A7]/20', label: 'For' },
  against: { pill: 'bg-[#FF6B6B]/10 text-[#FF6B6B] border border-[#FF6B6B]/20', label: 'Against' },
  abstain: { pill: 'bg-[#9CA3AF]/10 text-[#9CA3AF] border border-[#9CA3AF]/20', label: 'Abstain' },
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
  if (amount === null || amount === undefined) return '-'
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
    <div className="min-h-screen bg-[#0D1117] px-6 pt-12 pb-28">
      <Link
        href="/ballot"
        className="flex items-center gap-1 text-[#9CA3AF] text-sm mb-6 hover:text-[#00C9A7] transition-colors"
        style={{ fontFamily: 'var(--font-instrument-sans)' }}
      >
        &lt;- Ballot
      </Link>

      {loading && (
        <div className="flex flex-col gap-4 animate-pulse">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-14 h-14 rounded-full bg-[#374151]" />
            <div className="flex-1">
              <div className="h-5 w-40 bg-[#374151] rounded mb-2" />
              <div className="h-3 w-28 bg-[#374151] rounded mb-2" />
              <div className="h-3 w-36 bg-[#374151] rounded" />
            </div>
          </div>
          <div className="h-24 bg-[#1F2937] rounded-2xl" />
          <div className="h-40 bg-[#1F2937] rounded-2xl" />
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
            onClick={() => router.push('/ballot')}
            className="mt-4 w-full bg-[#00C9A7] text-[#0D1117] font-bold py-3 rounded-xl text-sm active:scale-[0.98] transition-transform"
            style={{ fontFamily: 'var(--font-syne)' }}
          >
            Back to Ballot
          </button>
        </div>
      )}

      {!loading && !error && candidate && (
        <div className="flex flex-col gap-5">
          {/* Candidate header */}
          <header>
            <div className="flex items-start gap-4 mb-3">
              <div className="w-14 h-14 rounded-full bg-[#1F2937] border border-[#374151] flex items-center justify-center flex-shrink-0">
                <span
                  className="text-xl font-bold text-[#9CA3AF]"
                  style={{ fontFamily: 'var(--font-syne)' }}
                >
                  {candidate.name.charAt(0)}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h1
                    className="text-white text-xl font-bold leading-tight"
                    style={{ fontFamily: 'var(--font-syne)' }}
                  >
                    {candidate.name}
                  </h1>
                  {candidate.is_incumbent && (
                    <span
                      className="text-xs font-semibold text-[#F59E0B] bg-[#F59E0B]/10 px-2 py-0.5 rounded-full flex-shrink-0"
                      style={{ fontFamily: 'var(--font-syne)' }}
                    >
                      Incumbent
                    </span>
                  )}
                </div>
                <p
                  className="text-[#00C9A7] text-sm font-medium"
                  style={{ fontFamily: 'var(--font-syne)' }}
                >
                  {candidate.office}
                </p>
                {(candidate.district_name || candidate.election_date) && (
                  <p
                    className="text-[#6B7280] text-xs mt-1"
                    style={{ fontFamily: 'var(--font-instrument-sans)' }}
                  >
                    {candidate.district_name}
                    {candidate.district_name && candidate.election_date ? ' - ' : ''}
                    {candidate.election_date ? formatDate(candidate.election_date) : ''}
                  </p>
                )}
              </div>
            </div>
          </header>

          {/* Bio */}
          {candidate.bio && (
            <section className="bg-[#1F2937] rounded-2xl p-4 border border-[#374151]">
              <p
                className="text-[#D1D5DB] text-sm leading-6"
                style={{ fontFamily: 'var(--font-instrument-sans)' }}
              >
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
              className="block w-full text-center bg-[#1F2937] border border-[#374151] text-[#00C9A7] font-semibold py-3 rounded-2xl text-sm active:scale-[0.98] transition-transform"
              style={{ fontFamily: 'var(--font-syne)' }}
            >
              Campaign Website
            </a>
          )}

          {/* Funding */}
          <section>
            <h2
              className="text-[#9CA3AF] text-xs font-semibold uppercase tracking-wider mb-2"
              style={{ fontFamily: 'var(--font-syne)' }}
            >
              Funding
            </h2>
            {funding ? (
              <div className="bg-[#1F2937] rounded-2xl p-4 border border-[#374151] flex flex-col gap-3">
                <div className="flex justify-between items-center">
                  <span
                    className="text-[#9CA3AF] text-xs"
                    style={{ fontFamily: 'var(--font-instrument-sans)' }}
                  >
                    Total raised
                  </span>
                  <span
                    className="text-white text-sm font-semibold"
                    style={{ fontFamily: 'var(--font-syne)' }}
                  >
                    {formatCurrency(funding.total_raised)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span
                    className="text-[#9CA3AF] text-xs"
                    style={{ fontFamily: 'var(--font-instrument-sans)' }}
                  >
                    From neighbors
                  </span>
                  <span
                    className="text-white text-sm font-semibold"
                    style={{ fontFamily: 'var(--font-syne)' }}
                  >
                    {formatCurrency(funding.neighbor_donations)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span
                    className="text-[#9CA3AF] text-xs"
                    style={{ fontFamily: 'var(--font-instrument-sans)' }}
                  >
                    Institutional %
                  </span>
                  <span
                    className="text-white text-sm font-semibold"
                    style={{ fontFamily: 'var(--font-syne)' }}
                  >
                    {funding.institutional_pct !== null && funding.institutional_pct !== undefined
                      ? `${funding.institutional_pct}%`
                      : '-'}
                  </span>
                </div>
                {isSafeUrl(funding.source_url) && (
                  <a
                    href={funding.source_url!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#00C9A7] text-xs mt-1"
                    style={{ fontFamily: 'var(--font-instrument-sans)' }}
                  >
                    Source
                  </a>
                )}
              </div>
            ) : (
              <div className="bg-[#1F2937] rounded-2xl p-4 border border-[#374151]">
                <p
                  className="text-[#6B7280] text-sm"
                  style={{ fontFamily: 'var(--font-instrument-sans)' }}
                >
                  No funding data yet.
                </p>
              </div>
            )}
          </section>

          {/* Voting records */}
          <section>
            <h2
              className="text-[#9CA3AF] text-xs font-semibold uppercase tracking-wider mb-2"
              style={{ fontFamily: 'var(--font-syne)' }}
            >
              Voting Record
            </h2>
            {votingRecords.length > 0 ? (
              <div className="flex flex-col gap-2">
                {votingRecords.map((record) => {
                  const voteStyle = VOTE_STYLES[record.vote_cast] ?? VOTE_STYLES.abstain
                  return (
                    <div
                      key={record.id}
                      className="bg-[#1F2937] rounded-2xl p-4 border border-[#374151]"
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <h3
                          className="text-white text-sm font-semibold leading-snug flex-1"
                          style={{ fontFamily: 'var(--font-syne)' }}
                        >
                          {record.issue_title}
                        </h3>
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${voteStyle.pill}`}
                          style={{ fontFamily: 'var(--font-syne)' }}
                        >
                          {voteStyle.label}
                        </span>
                      </div>
                      {record.issue_description && (
                        <p
                          className="text-[#9CA3AF] text-xs leading-5 mb-2 line-clamp-2"
                          style={{ fontFamily: 'var(--font-instrument-sans)' }}
                        >
                          {record.issue_description}
                        </p>
                      )}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className="text-[#6B7280] text-xs"
                            style={{ fontFamily: 'var(--font-instrument-sans)' }}
                          >
                            {formatDate(record.vote_date)}
                          </span>
                          {record.dimension && (
                            <span
                              className="text-xs bg-[#374151] text-[#9CA3AF] px-2 py-0.5 rounded-full"
                              style={{ fontFamily: 'var(--font-instrument-sans)' }}
                            >
                              {DIMENSION_LABELS[record.dimension] ?? record.dimension}
                            </span>
                          )}
                        </div>
                        {isSafeUrl(record.source_url) && (
                          <a
                            href={record.source_url!}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#00C9A7] text-xs"
                            style={{ fontFamily: 'var(--font-instrument-sans)' }}
                          >
                            Source
                          </a>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="bg-[#1F2937] rounded-2xl p-4 border border-[#374151]">
                <p
                  className="text-[#6B7280] text-sm"
                  style={{ fontFamily: 'var(--font-instrument-sans)' }}
                >
                  No voting records yet.
                </p>
              </div>
            )}
          </section>

          {/* Read-only disclaimer */}
          <div className="bg-[#374151]/30 border border-[#374151] rounded-2xl p-4">
            <p
              className="text-[#6B7280] text-xs leading-5"
              style={{ fontFamily: 'var(--font-instrument-sans)' }}
            >
              This is a read-only beta profile using placeholder PSL data. Candidate, funding,
              voting record, and ballot data must be replaced and validated before beta users.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
