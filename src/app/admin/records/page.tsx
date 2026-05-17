'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

type VotingRecordRow = {
  id: string
  issue_title: string
  bill_number: string | null
  vote_date: string
  vote_cast: string
  dimension: string
  source_url: string
  created_at: string
  community_score_count: number
  community_score_final: number | null
  candidates: { name: string; office: string } | null
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

function isSafeUrl(url: string): boolean {
  return url.startsWith('https://') || url.startsWith('http://')
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '-'
  // Date-only strings (YYYY-MM-DD) are parsed manually to avoid UTC midnight shift
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr)
  if (dateOnly) {
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
    return `${months[+dateOnly[2] - 1]} ${+dateOnly[3]}, ${dateOnly[1]}`
  }
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function voteCastClasses(cast: string): string {
  if (cast === 'for') return 'text-[#00C9A7] bg-[#00C9A7]/10 border border-[#00C9A7]/30'
  if (cast === 'against') return 'text-[#FF6B6B] bg-[#FF6B6B]/10 border border-[#FF6B6B]/30'
  return 'text-[#9CA3AF] bg-[#9CA3AF]/10 border border-[#9CA3AF]/30'
}

export default function AdminRecordsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [records, setRecords] = useState<VotingRecordRow[]>([])
  const [error, setError] = useState<string | null>(null)
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

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

      const { data, error: fetchError } = await supabase
        .from('voting_records')
        .select(`
          id,
          issue_title,
          bill_number,
          vote_date,
          vote_cast,
          dimension,
          source_url,
          created_at,
          community_score_count,
          community_score_final,
          candidates ( name, office )
        `)
        .order('created_at', { ascending: false })

      if (fetchError) {
        setError('Failed to load voting records.')
        setLoading(false)
        return
      }

      setRecords((data ?? []) as unknown as VotingRecordRow[])
      setLoading(false)
    }

    checkAdminAndLoad()
  }, [router])

  async function handleDelete(id: string) {
    setDeleting(true)
    setDeleteError(null)
    try {
      const { error: deleteErr } = await supabase
        .from('voting_records')
        .delete()
        .eq('id', id)
      if (deleteErr) throw deleteErr
      setRecords((prev) => prev.filter((r) => r.id !== id))
      setPendingDeleteId(null)
    } catch (err: unknown) {
      setDeleteError(err instanceof Error ? err.message : 'Delete failed. Try again.')
    } finally {
      setDeleting(false)
    }
  }

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
          Voting records
        </h1>
      </header>

      <div className="bg-[#F59E0B]/10 border border-[#F59E0B]/30 rounded-2xl p-4 mb-6">
        <p className="text-[#F59E0B] text-xs leading-5 [font-family:var(--font-instrument-sans)]">
          Admin only. Deletions are permanent and cannot be undone.
        </p>
      </div>

      {loading && (
        <div className="flex flex-col gap-4 animate-pulse">
          <div className="h-32 bg-[#1F2937] rounded-2xl" />
          <div className="h-32 bg-[#1F2937] rounded-2xl" />
          <div className="h-32 bg-[#1F2937] rounded-2xl" />
        </div>
      )}

      {!loading && error && (
        <div className="bg-[#FF6B6B]/10 border border-[#FF6B6B]/30 rounded-2xl p-4">
          <p className="text-[#FF6B6B] text-sm [font-family:var(--font-instrument-sans)]">
            {error}
          </p>
        </div>
      )}

      {!loading && !error && records.length === 0 && (
        <div className="bg-[#1F2937] border border-[#374151] rounded-2xl p-6 text-center">
          <p className="text-[#9CA3AF] text-sm [font-family:var(--font-instrument-sans)]">
            No voting records found.
          </p>
        </div>
      )}

      {!loading && !error && records.length > 0 && (
        <div className="flex flex-col gap-4">
          <p className="text-[#9CA3AF] text-xs [font-family:var(--font-instrument-sans)]">
            {records.length} record{records.length !== 1 ? 's' : ''} - newest first
          </p>

          {records.map((record) => {
            const isScored =
              record.community_score_count > 0 || record.community_score_final !== null
            const isPending = pendingDeleteId === record.id

            return (
              <article
                key={record.id}
                className="bg-[#1F2937] border border-[#374151] rounded-2xl p-4 flex flex-col gap-3"
              >
                <div>
                  <p className="text-white font-semibold text-sm leading-tight [font-family:var(--font-syne)]">
                    {record.candidates?.name ?? '-'}
                  </p>
                  <p className="text-[#9CA3AF] text-xs mt-0.5 [font-family:var(--font-instrument-sans)]">
                    {record.candidates?.office ?? '-'}
                  </p>
                </div>

                <p className="text-[#D1D5DB] text-sm [font-family:var(--font-instrument-sans)]">
                  {record.issue_title}
                </p>

                {record.bill_number && (
                  <p className="text-[#6B7280] text-xs [font-family:var(--font-instrument-sans)]">
                    {record.bill_number}
                  </p>
                )}

                <div className="flex flex-wrap gap-2 items-center">
                  <span
                    className={`text-xs font-semibold px-2.5 py-1 rounded-full [font-family:var(--font-syne)] ${voteCastClasses(record.vote_cast)}`}
                  >
                    {record.vote_cast.charAt(0).toUpperCase() + record.vote_cast.slice(1)}
                  </span>
                  <span className="text-[#9CA3AF] text-xs [font-family:var(--font-instrument-sans)]">
                    {DIMENSION_LABELS[record.dimension] ?? record.dimension}
                  </span>
                  <span className="text-[#6B7280] text-xs [font-family:var(--font-instrument-sans)]">
                    {formatDate(record.vote_date)}
                  </span>
                </div>

                {isSafeUrl(record.source_url) ? (
                  <a
                    href={record.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#00C9A7] text-xs underline underline-offset-2 break-all [font-family:var(--font-instrument-sans)]"
                  >
                    {record.source_url}
                  </a>
                ) : (
                  <p className="text-[#FF6B6B] text-xs [font-family:var(--font-instrument-sans)]">
                    Invalid source URL
                  </p>
                )}

                <p className="text-[#6B7280] text-xs [font-family:var(--font-instrument-sans)]">
                  Added {formatDate(record.created_at)}
                </p>

                {isScored ? (
                  <p className="text-[#9CA3AF] text-xs italic [font-family:var(--font-instrument-sans)]">
                    Scored records require manual review before removal.
                  </p>
                ) : isPending ? (
                  <div className="bg-[#FF6B6B]/10 border border-[#FF6B6B]/30 rounded-xl p-3 flex flex-col gap-3">
                    <div>
                      <p className="text-[#FF6B6B] text-xs font-semibold [font-family:var(--font-syne)]">
                        Permanently delete?
                      </p>
                      <p className="text-[#D1D5DB] text-xs mt-1 [font-family:var(--font-instrument-sans)]">
                        {record.issue_title} - {record.candidates?.name ?? '-'}
                      </p>
                      <p className="text-[#FF6B6B] text-xs mt-2 [font-family:var(--font-instrument-sans)]">
                        This permanently deletes the voting record. This cannot be undone.
                      </p>
                    </div>
                    {deleteError && (
                      <p className="text-[#FF6B6B] text-xs [font-family:var(--font-instrument-sans)]">
                        {deleteError}
                      </p>
                    )}
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setPendingDeleteId(null)
                          setDeleteError(null)
                        }}
                        disabled={deleting}
                        className="flex-1 bg-[#374151] text-[#D1D5DB] text-xs font-semibold py-2 rounded-lg disabled:opacity-40 disabled:pointer-events-none [font-family:var(--font-syne)]"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleDelete(record.id)}
                        disabled={deleting}
                        className="flex-1 bg-[#FF6B6B] text-white text-xs font-semibold py-2 rounded-lg disabled:opacity-40 disabled:pointer-events-none [font-family:var(--font-syne)]"
                      >
                        {deleting ? 'Deleting...' : 'Confirm delete'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setPendingDeleteId(record.id)
                      setDeleteError(null)
                    }}
                    disabled={deleting}
                    className="self-start text-xs text-[#FF6B6B] border border-[#FF6B6B]/40 px-3 py-1.5 rounded-lg hover:bg-[#FF6B6B]/10 transition-colors disabled:opacity-40 disabled:pointer-events-none [font-family:var(--font-syne)]"
                  >
                    Remove
                  </button>
                )}
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}

