'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

type SubjectType = 'candidate_info' | 'voting_record' | 'funding'

const SUBJECTS: { value: SubjectType; label: string }[] = [
  { value: 'candidate_info', label: 'Candidate information' },
  { value: 'voting_record', label: 'Voting record' },
  { value: 'funding', label: 'Funding data' },
]

export default function ReportPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [subjectType, setSubjectType] = useState<SubjectType>('candidate_info')
  const [description, setDescription] = useState('')
  const [submitted, setSubmitted] = useState(false)

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

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitted(true)
  }

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
          Report Inaccuracy
        </p>
        <h1 className="text-3xl font-bold text-white leading-tight [font-family:var(--font-syne)]">
          Flag incorrect data
        </h1>
      </header>

      {loading && (
        <div className="flex flex-col gap-4 animate-pulse">
          <div className="h-32 bg-[#1F2937] rounded-2xl" />
          <div className="h-28 bg-[#1F2937] rounded-2xl" />
          <div className="h-12 bg-[#1F2937] rounded-xl" />
        </div>
      )}

      {!loading && submitted && (
        <div className="bg-[#1F2937] rounded-2xl p-5 border border-[#374151]">
          <p className="text-[#F59E0B] text-sm font-semibold mb-2 [font-family:var(--font-syne)]">
            Beta — report submission not yet enabled
          </p>
          <p className="text-[#9CA3AF] text-sm leading-6 [font-family:var(--font-instrument-sans)]">
            Thank you for flagging this. Report submission is not active in this build — your
            input was not recorded. This feature will be enabled before beta invitations go out.
          </p>
          <button
            onClick={() => {
              setSubmitted(false)
              setDescription('')
            }}
            className="mt-4 w-full bg-[#374151] text-[#D1D5DB] font-semibold py-3 rounded-xl text-sm active:scale-[0.98] transition-transform [font-family:var(--font-syne)]"
          >
            Submit another report
          </button>
          <Link
            href="/ballot"
            className="block mt-3 w-full text-center bg-[#00C9A7] text-[#0D1117] font-bold py-3 rounded-xl text-sm active:scale-[0.98] transition-transform [font-family:var(--font-syne)]"
          >
            Back to ballot
          </Link>
        </div>
      )}

      {!loading && !submitted && (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <section className="bg-[#1F2937] rounded-2xl p-4 border border-[#374151]">
            <h2 className="text-[#9CA3AF] text-xs font-semibold uppercase tracking-wider mb-3 [font-family:var(--font-syne)]">
              What are you reporting?
            </h2>
            <div className="flex flex-col gap-2">
              {SUBJECTS.map(({ value, label }) => (
                <label
                  key={value}
                  className={`flex items-center gap-3 bg-[#0D1117] rounded-xl px-4 py-3 cursor-pointer border transition-colors ${
                    subjectType === value ? 'border-[#00C9A7]' : 'border-transparent'
                  }`}
                >
                  <input
                    type="radio"
                    name="subjectType"
                    value={value}
                    checked={subjectType === value}
                    onChange={() => setSubjectType(value)}
                    className="accent-[#00C9A7]"
                  />
                  <span className="text-[#D1D5DB] text-sm [font-family:var(--font-instrument-sans)]">
                    {label}
                  </span>
                </label>
              ))}
            </div>
          </section>

          <section className="bg-[#1F2937] rounded-2xl p-4 border border-[#374151]">
            <h2 className="text-[#9CA3AF] text-xs font-semibold uppercase tracking-wider mb-3 [font-family:var(--font-syne)]">
              Describe the inaccuracy
            </h2>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is incorrect, and what should it say?"
              rows={4}
              className="w-full bg-[#0D1117] text-[#D1D5DB] text-sm rounded-xl px-4 py-3 border border-[#374151] focus:outline-none focus:border-[#00C9A7] placeholder-[#6B7280] resize-none [font-family:var(--font-instrument-sans)]"
            />
          </section>

          <button
            type="submit"
            disabled={description.trim().length < 10}
            className="w-full bg-[#00C9A7] text-[#0D1117] font-bold py-3 rounded-xl text-sm active:scale-[0.98] transition-transform disabled:opacity-40 disabled:pointer-events-none [font-family:var(--font-syne)]"
          >
            Submit report
          </button>

          <div className="bg-[#374151]/30 border border-[#374151] rounded-2xl p-4">
            <p className="text-[#6B7280] text-xs leading-5 [font-family:var(--font-instrument-sans)]">
              This is a beta build. Report submission is not yet active — no data will be
              recorded. This feature will be enabled before beta invitations go out.
            </p>
          </div>
        </form>
      )}
    </div>
  )
}
