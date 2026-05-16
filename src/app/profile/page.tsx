'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

const DIMENSIONS = [
  'growth_development',
  'taxation_spending',
  'education',
  'environment',
  'public_safety',
  'housing',
  'transparency',
] as const

type DimensionKey = (typeof DIMENSIONS)[number]

const DIMENSION_LABELS: Record<DimensionKey, string> = {
  growth_development: 'Growth & Development',
  taxation_spending: 'Taxes & Services',
  education: 'Education',
  environment: 'Environment',
  public_safety: 'Public Safety',
  housing: 'Housing',
  transparency: 'Transparency',
}

type ProfileRow = {
  display_name: string | null
  zip_code: string | null
  dna_quiz_status: string | null
}

type DnaRow = { [K in DimensionKey]: number | null }

function formatScore(v: number | null | undefined): string {
  if (v === null || v === undefined) return '—'
  return v > 0 ? `+${v}` : String(v)
}

function scoreColor(v: number | null | undefined): string {
  if (v === null || v === undefined) return 'text-[#6B7280]'
  if (v > 0) return 'text-[#00C9A7]'
  if (v < 0) return 'text-[#FF6B6B]'
  return 'text-[#9CA3AF]'
}

export default function ProfilePage() {
  const router = useRouter()
  const [email, setEmail] = useState<string | null>(null)
  const [profile, setProfile] = useState<ProfileRow | null>(null)
  const [dna, setDna] = useState<DnaRow | null>(null)
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

        setEmail(session.user.email ?? null)

        const [profileResult, dnaResult] = await Promise.all([
          supabase
            .from('profiles')
            .select('display_name, zip_code, dna_quiz_status')
            .eq('id', session.user.id)
            .maybeSingle(),
          supabase
            .from('civic_dna')
            .select(
              'growth_development, taxation_spending, education, environment, public_safety, housing, transparency'
            )
            .eq('user_id', session.user.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle(),
        ])

        if (profileResult.error) throw profileResult.error
        if (dnaResult.error) throw dnaResult.error

        setProfile(profileResult.data)
        setDna(dnaResult.data as DnaRow | null)
      } catch (err: unknown) {
        setError(
          err instanceof Error ? err.message : 'Something went wrong loading your profile.'
        )
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [router])

  return (
    <div className="min-h-screen bg-[#0D1117] px-6 pt-12 pb-28">
      <header className="mb-6">
        <p className="text-[#00C9A7] text-sm font-medium mb-2 [font-family:var(--font-syne)]">
          Profile
        </p>
        <h1 className="text-3xl font-bold text-white leading-tight mb-3 [font-family:var(--font-syne)]">
          Your account
        </h1>
      </header>

      {loading && (
        <div className="flex flex-col gap-4 animate-pulse">
          <div className="h-24 bg-[#1F2937] rounded-2xl" />
          <div className="h-48 bg-[#1F2937] rounded-2xl" />
        </div>
      )}

      {error && (
        <div className="bg-[#FF6B6B]/10 border border-[#FF6B6B]/30 rounded-2xl p-4">
          <p className="text-[#FF6B6B] text-sm [font-family:var(--font-instrument-sans)]">
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
        <div className="flex flex-col gap-5">

          {/* Account details */}
          <section className="bg-[#1F2937] rounded-2xl p-4 border border-[#374151]">
            <h2 className="text-[#9CA3AF] text-xs font-semibold uppercase tracking-wider mb-3 [font-family:var(--font-syne)]">
              Account
            </h2>
            <div className="flex flex-col gap-2">
              {email && (
                <div className="bg-[#0D1117] rounded-xl px-4 py-3">
                  <p className="text-[#6B7280] text-xs mb-0.5 [font-family:var(--font-instrument-sans)]">
                    Email
                  </p>
                  <p className="text-white text-sm font-medium [font-family:var(--font-instrument-sans)]">
                    {email}
                  </p>
                </div>
              )}
              {profile?.display_name && (
                <div className="bg-[#0D1117] rounded-xl px-4 py-3">
                  <p className="text-[#6B7280] text-xs mb-0.5 [font-family:var(--font-instrument-sans)]">
                    Display name
                  </p>
                  <p className="text-white text-sm font-medium [font-family:var(--font-instrument-sans)]">
                    {profile.display_name}
                  </p>
                </div>
              )}
              {profile?.zip_code && (
                <div className="bg-[#0D1117] rounded-xl px-4 py-3">
                  <p className="text-[#6B7280] text-xs mb-0.5 [font-family:var(--font-instrument-sans)]">
                    ZIP code
                  </p>
                  <p className="text-white text-sm font-medium [font-family:var(--font-instrument-sans)]">
                    {profile.zip_code}
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* Civic DNA */}
          {profile?.dna_quiz_status === 'completed' && dna ? (
            <section className="bg-[#1F2937] rounded-2xl p-4 border border-[#374151]">
              <h2 className="text-[#9CA3AF] text-xs font-semibold uppercase tracking-wider mb-3 [font-family:var(--font-syne)]">
                Civic DNA
              </h2>
              <div className="flex flex-col gap-2">
                {DIMENSIONS.map((dim) => (
                  <div
                    key={dim}
                    className="bg-[#0D1117] rounded-xl px-4 py-3 flex items-center justify-between"
                  >
                    <p className="text-[#D1D5DB] text-sm [font-family:var(--font-instrument-sans)]">
                      {DIMENSION_LABELS[dim]}
                    </p>
                    <span
                      className={`text-sm font-bold [font-family:var(--font-syne)] ${scoreColor(dna[dim])}`}
                    >
                      {formatScore(dna[dim])}
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-[#6B7280] text-xs leading-5 mt-3 [font-family:var(--font-instrument-sans)]">
                Scores range from −2.0 to +2.0. Positive means you lean toward more government
                action on that dimension; negative means less.
              </p>
            </section>
          ) : (
            <section className="bg-[#1F2937] rounded-2xl p-4 border border-[#374151]">
              <h2 className="text-[#9CA3AF] text-xs font-semibold uppercase tracking-wider mb-3 [font-family:var(--font-syne)]">
                Civic DNA
              </h2>
              <p className="text-[#9CA3AF] text-sm leading-6 mb-4 [font-family:var(--font-instrument-sans)]">
                You haven&#39;t taken the Civic DNA quiz yet. Your results will appear here once
                you complete it.
              </p>
              <Link
                href="/onboarding/dna-teaser"
                className="block w-full text-center bg-[#00C9A7] text-[#0D1117] font-bold py-3 rounded-xl text-sm active:scale-[0.98] transition-transform [font-family:var(--font-syne)]"
              >
                Take the quiz
              </Link>
            </section>
          )}

          {/* Beta disclaimer */}
          <div className="bg-[#374151]/30 border border-[#374151] rounded-2xl p-4">
            <p className="text-[#6B7280] text-xs leading-5 [font-family:var(--font-instrument-sans)]">
              This is a read-only beta profile screen using placeholder PSL data. No data is
              written here. Account details and Civic DNA results reflect your onboarding choices.
            </p>
          </div>

        </div>
      )}
    </div>
  )
}
