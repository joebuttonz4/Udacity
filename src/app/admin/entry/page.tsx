'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

type Candidate = { id: string; name: string; office: string }
type VoteCast = 'for' | 'against' | 'abstain'
type Dimension =
  | 'growth_development'
  | 'taxation_spending'
  | 'education'
  | 'environment'
  | 'public_safety'
  | 'housing'
  | 'transparency'

const DIMENSIONS: { value: Dimension; label: string }[] = [
  { value: 'growth_development', label: 'Growth & Development' },
  { value: 'taxation_spending', label: 'Taxes & Services' },
  { value: 'education', label: 'Education' },
  { value: 'environment', label: 'Environment' },
  { value: 'public_safety', label: 'Public Safety' },
  { value: 'housing', label: 'Housing' },
  { value: 'transparency', label: 'Transparency' },
]

const VOTE_CAST_OPTIONS: { value: VoteCast; label: string }[] = [
  { value: 'for', label: 'For' },
  { value: 'against', label: 'Against' },
  { value: 'abstain', label: 'Abstain' },
]

function isSafeUrl(url: string): boolean {
  return url.startsWith('https://') || url.startsWith('http://')
}

export default function AdminEntryPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [candidates, setCandidates] = useState<Candidate[]>([])

  const [candidateId, setCandidateId] = useState('')
  const [issueTitle, setIssueTitle] = useState('')
  const [issueDescription, setIssueDescription] = useState('')
  const [billNumber, setBillNumber] = useState('')
  const [voteDate, setVoteDate] = useState('')
  const [voteCast, setVoteCast] = useState<VoteCast>('for')
  const [dimension, setDimension] = useState<Dimension>('growth_development')
  const [sourceUrl, setSourceUrl] = useState('')

  const [submitting, setSubmitting] = useState(false)
  const [savedTitle, setSavedTitle] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function checkAdminAndLoad() {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        router.push('/')
        return
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', session.user.id)
        .single()

      if (profileError || !profile?.is_admin) {
        router.push('/')
        return
      }

      const { data: candidateData, error: candidateError } = await supabase
        .from('candidates')
        .select('id, name, office')
        .is('archived_at', null)
        .order('name')

      if (candidateError) {
        setError('Failed to load candidates.')
        setLoading(false)
        return
      }

      const loaded = (candidateData ?? []) as unknown as Candidate[]
      setCandidates(loaded)
      if (loaded.length > 0) setCandidateId(loaded[0].id)
      setLoading(false)
    }

    checkAdminAndLoad()
  }, [router])

  function resetForm() {
    setIssueTitle('')
    setIssueDescription('')
    setBillNumber('')
    setVoteDate('')
    setVoteCast('for')
    setDimension('growth_development')
    setSourceUrl('')
    setSavedTitle(null)
    setError(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!isSafeUrl(sourceUrl)) {
      setError('Source URL must start with https:// or http://')
      return
    }

    setSubmitting(true)
    try {
      const { error: insertError } = await supabase.from('voting_records').insert({
        candidate_id: candidateId,
        issue_title: issueTitle,
        issue_description: issueDescription,
        bill_number: billNumber.trim() || null,
        vote_date: voteDate,
        vote_cast: voteCast,
        dimension,
        source_url: sourceUrl,
      })

      if (insertError) throw insertError

      setSavedTitle(issueTitle)
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : 'Insert failed. Check all fields and try again.'
      )
    } finally {
      setSubmitting(false)
    }
  }

  const canSubmit =
    !!candidateId &&
    issueTitle.trim().length > 0 &&
    issueDescription.trim().length > 0 &&
    !!voteDate &&
    sourceUrl.trim().length > 0 &&
    !submitting

  return (
    <div className="min-h-screen bg-[#0D1117] px-6 pt-12 pb-28">
      <Link
        href="/"
        className="flex items-center gap-1 text-[#9CA3AF] text-sm mb-6 hover:text-[#00C9A7] transition-colors [font-family:var(--font-instrument-sans)]"
      >
        &lt;- Home
      </Link>

      <header className="mb-6">
        <p className="text-[#F59E0B] text-sm font-medium mb-2 [font-family:var(--font-syne)]">
          Admin
        </p>
        <h1 className="text-3xl font-bold text-white leading-tight [font-family:var(--font-syne)]">
          Add voting record
        </h1>
      </header>

      {loading && (
        <div className="flex flex-col gap-4 animate-pulse">
          <div className="h-14 bg-[#1F2937] rounded-2xl" />
          <div className="h-14 bg-[#1F2937] rounded-2xl" />
          <div className="h-24 bg-[#1F2937] rounded-2xl" />
          <div className="h-14 bg-[#1F2937] rounded-2xl" />
          <div className="h-14 bg-[#1F2937] rounded-2xl" />
        </div>
      )}

      {!loading && savedTitle && (
        <div className="flex flex-col gap-4">
          <div className="bg-[#00C9A7]/10 border border-[#00C9A7]/30 rounded-2xl p-5">
            <p className="text-[#00C9A7] text-sm font-semibold mb-1 [font-family:var(--font-syne)]">
              Record saved
            </p>
            <p className="text-[#9CA3AF] text-sm [font-family:var(--font-instrument-sans)]">
              {savedTitle}
            </p>
          </div>
          <button
            onClick={resetForm}
            className="w-full bg-[#00C9A7] text-[#0D1117] font-bold py-3 rounded-xl text-sm active:scale-[0.98] transition-transform [font-family:var(--font-syne)]"
          >
            Add another record
          </button>
        </div>
      )}

      {!loading && !savedTitle && (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Candidate */}
          <section className="bg-[#1F2937] rounded-2xl p-4 border border-[#374151]">
            <label className="block text-[#9CA3AF] text-xs font-semibold uppercase tracking-wider mb-2 [font-family:var(--font-syne)]">
              Candidate
            </label>
            <select
              value={candidateId}
              onChange={(e) => setCandidateId(e.target.value)}
              required
              className="w-full bg-[#0D1117] text-[#D1D5DB] text-sm rounded-xl px-4 py-3 border border-[#374151] focus:outline-none focus:border-[#00C9A7] [font-family:var(--font-instrument-sans)]"
            >
              {candidates.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} — {c.office}
                </option>
              ))}
            </select>
          </section>

          {/* Issue title */}
          <section className="bg-[#1F2937] rounded-2xl p-4 border border-[#374151]">
            <label className="block text-[#9CA3AF] text-xs font-semibold uppercase tracking-wider mb-2 [font-family:var(--font-syne)]">
              Issue title
            </label>
            <input
              type="text"
              value={issueTitle}
              onChange={(e) => setIssueTitle(e.target.value)}
              placeholder="e.g. Westport Development Rezoning Vote"
              required
              className="w-full bg-[#0D1117] text-[#D1D5DB] text-sm rounded-xl px-4 py-3 border border-[#374151] focus:outline-none focus:border-[#00C9A7] placeholder-[#6B7280] [font-family:var(--font-instrument-sans)]"
            />
          </section>

          {/* Issue description */}
          <section className="bg-[#1F2937] rounded-2xl p-4 border border-[#374151]">
            <label className="block text-[#9CA3AF] text-xs font-semibold uppercase tracking-wider mb-2 [font-family:var(--font-syne)]">
              Issue description
            </label>
            <textarea
              value={issueDescription}
              onChange={(e) => setIssueDescription(e.target.value)}
              placeholder="Brief plain-English description of the issue voted on"
              rows={3}
              required
              className="w-full bg-[#0D1117] text-[#D1D5DB] text-sm rounded-xl px-4 py-3 border border-[#374151] focus:outline-none focus:border-[#00C9A7] placeholder-[#6B7280] resize-none [font-family:var(--font-instrument-sans)]"
            />
          </section>

          {/* Bill number (optional) */}
          <section className="bg-[#1F2937] rounded-2xl p-4 border border-[#374151]">
            <label className="block text-[#9CA3AF] text-xs font-semibold uppercase tracking-wider mb-2 [font-family:var(--font-syne)]">
              Bill / resolution number{' '}
              <span className="normal-case font-normal text-[#6B7280]">(optional)</span>
            </label>
            <input
              type="text"
              value={billNumber}
              onChange={(e) => setBillNumber(e.target.value)}
              placeholder="e.g. Ordinance 26-14"
              className="w-full bg-[#0D1117] text-[#D1D5DB] text-sm rounded-xl px-4 py-3 border border-[#374151] focus:outline-none focus:border-[#00C9A7] placeholder-[#6B7280] [font-family:var(--font-instrument-sans)]"
            />
          </section>

          {/* Vote date */}
          <section className="bg-[#1F2937] rounded-2xl p-4 border border-[#374151]">
            <label className="block text-[#9CA3AF] text-xs font-semibold uppercase tracking-wider mb-2 [font-family:var(--font-syne)]">
              Vote date
            </label>
            <input
              type="date"
              value={voteDate}
              onChange={(e) => setVoteDate(e.target.value)}
              required
              className="w-full bg-[#0D1117] text-[#D1D5DB] text-sm rounded-xl px-4 py-3 border border-[#374151] focus:outline-none focus:border-[#00C9A7] [font-family:var(--font-instrument-sans)]"
            />
          </section>

          {/* Vote cast */}
          <section className="bg-[#1F2937] rounded-2xl p-4 border border-[#374151]">
            <label className="block text-[#9CA3AF] text-xs font-semibold uppercase tracking-wider mb-2 [font-family:var(--font-syne)]">
              Vote cast
            </label>
            <select
              value={voteCast}
              onChange={(e) => setVoteCast(e.target.value as VoteCast)}
              required
              className="w-full bg-[#0D1117] text-[#D1D5DB] text-sm rounded-xl px-4 py-3 border border-[#374151] focus:outline-none focus:border-[#00C9A7] [font-family:var(--font-instrument-sans)]"
            >
              {VOTE_CAST_OPTIONS.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </section>

          {/* Dimension */}
          <section className="bg-[#1F2937] rounded-2xl p-4 border border-[#374151]">
            <label className="block text-[#9CA3AF] text-xs font-semibold uppercase tracking-wider mb-2 [font-family:var(--font-syne)]">
              Civic DNA dimension
            </label>
            <select
              value={dimension}
              onChange={(e) => setDimension(e.target.value as Dimension)}
              required
              className="w-full bg-[#0D1117] text-[#D1D5DB] text-sm rounded-xl px-4 py-3 border border-[#374151] focus:outline-none focus:border-[#00C9A7] [font-family:var(--font-instrument-sans)]"
            >
              {DIMENSIONS.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </section>

          {/* Source URL */}
          <section className="bg-[#1F2937] rounded-2xl p-4 border border-[#374151]">
            <label className="block text-[#9CA3AF] text-xs font-semibold uppercase tracking-wider mb-2 [font-family:var(--font-syne)]">
              Source URL
            </label>
            <input
              type="url"
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
              placeholder="https://www.cityofpsl.gov/..."
              required
              className="w-full bg-[#0D1117] text-[#D1D5DB] text-sm rounded-xl px-4 py-3 border border-[#374151] focus:outline-none focus:border-[#00C9A7] placeholder-[#6B7280] [font-family:var(--font-instrument-sans)]"
            />
            <p className="text-[#6B7280] text-xs mt-2 [font-family:var(--font-instrument-sans)]">
              Must be an official government source. Required.
            </p>
          </section>

          {error && (
            <div className="bg-[#FF6B6B]/10 border border-[#FF6B6B]/30 rounded-2xl p-4">
              <p className="text-[#FF6B6B] text-sm [font-family:var(--font-instrument-sans)]">
                {error}
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full bg-[#00C9A7] text-[#0D1117] font-bold py-3 rounded-xl text-sm active:scale-[0.98] transition-transform disabled:opacity-40 disabled:pointer-events-none [font-family:var(--font-syne)]"
          >
            {submitting ? 'Saving…' : 'Save voting record'}
          </button>

          <div className="bg-[#F59E0B]/10 border border-[#F59E0B]/30 rounded-2xl p-4">
            <p className="text-[#F59E0B] text-xs leading-5 [font-family:var(--font-instrument-sans)]">
              Admin only. Enter voting records only when the candidate, item, date, description, vote cast, and source URL are verified from official records.
            </p>
          </div>
        </form>
      )}
    </div>
  )
}

