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
  if (v === null || v === undefined) return 'text-[#9CA3AF]'
  if (v > 0) return 'text-[#0F766E]'
  if (v < 0) return 'text-[#DC2626]'
  return 'text-[#6B7280]'
}

export default function ProfilePage() {
  const router = useRouter()
  const [email, setEmail] = useState<string | null>(null)
  const [profile, setProfile] = useState<ProfileRow | null>(null)
  const [dna, setDna] = useState<DnaRow | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [signOutError, setSignOutError] = useState<string | null>(null)

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

  async function handleSignOut() {
    setSignOutError(null)
    const { error: signOutErr } = await supabase.auth.signOut()
    if (signOutErr) {
      setSignOutError('Could not sign out. Please try again.')
      return
    }
    router.push('/onboarding')
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Dark hero header */}
      <div className="bg-[#0D1117] px-6 pt-12 pb-8">
        <p className="text-[#00C9A7] text-xs font-semibold uppercase tracking-widest mb-3 [font-family:var(--font-syne)]">
          Profile
        </p>
        <h1 className="text-3xl font-bold text-white leading-tight mb-2 [font-family:var(--font-syne)]">
          Your account
        </h1>
        {!loading && email && (
          <p className="text-[#6B7280] text-sm [font-family:var(--font-instrument-sans)]">
            {email}
          </p>
        )}
      </div>

      {/* Light content area */}
      <div className="flex-1 bg-[#F6F8FA] px-4 pt-5 pb-24 flex flex-col gap-4">
        {loading && (
          <div className="flex flex-col gap-4 animate-pulse">
            <div className="h-24 bg-white rounded-[20px] shadow-sm" />
            <div className="h-48 bg-white rounded-[20px] shadow-sm" />
          </div>
        )}

        {error && (
          <div className="bg-[#FEF2F2] border border-[#FECACA] rounded-[20px] p-4">
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
            {/* Account details */}
            <section className="bg-white rounded-[20px] shadow-sm p-4">
              <h2 className="text-[#6B7280] text-[11px] font-semibold uppercase tracking-widest mb-3 [font-family:var(--font-syne)]">
                Account
              </h2>
              <div className="flex flex-col divide-y divide-[#F3F4F6]">
                {email && (
                  <div className="py-2.5">
                    <p className="text-[#9CA3AF] text-[11px] mb-0.5 [font-family:var(--font-instrument-sans)]">
                      Email
                    </p>
                    <p className="text-[#0D1117] text-sm font-medium [font-family:var(--font-instrument-sans)]">
                      {email}
                    </p>
                  </div>
                )}
                {profile?.display_name && (
                  <div className="py-2.5">
                    <p className="text-[#9CA3AF] text-[11px] mb-0.5 [font-family:var(--font-instrument-sans)]">
                      Display name
                    </p>
                    <p className="text-[#0D1117] text-sm font-medium [font-family:var(--font-instrument-sans)]">
                      {profile.display_name}
                    </p>
                  </div>
                )}
                {profile?.zip_code && (
                  <div className="py-2.5">
                    <p className="text-[#9CA3AF] text-[11px] mb-0.5 [font-family:var(--font-instrument-sans)]">
                      ZIP code
                    </p>
                    <p className="text-[#0D1117] text-sm font-medium [font-family:var(--font-instrument-sans)]">
                      {profile.zip_code}
                    </p>
                  </div>
                )}
              </div>
            </section>

            {/* Civic DNA */}
            {profile?.dna_quiz_status === 'completed' && dna ? (
              <section className="bg-white rounded-[20px] shadow-sm p-4">
                <h2 className="text-[#6B7280] text-[11px] font-semibold uppercase tracking-widest mb-3 [font-family:var(--font-syne)]">
                  Civic DNA
                </h2>
                <div className="flex flex-col divide-y divide-[#F3F4F6]">
                  {DIMENSIONS.map((dim) => (
                    <div key={dim} className="flex items-center justify-between py-2.5">
                      <p className="text-[#374151] text-sm [font-family:var(--font-instrument-sans)]">
                        {DIMENSION_LABELS[dim]}
                      </p>
                      <span className={`text-sm font-bold [font-family:var(--font-syne)] ${scoreColor(dna[dim])}`}>
                        {formatScore(dna[dim])}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="text-[#9CA3AF] text-xs leading-5 mt-3 [font-family:var(--font-instrument-sans)]">
                  Scores range from −2.0 to +2.0. Positive means more government action on that
                  dimension; negative means less.
                </p>
              </section>
            ) : (
              <section className="bg-white rounded-[20px] shadow-sm p-4">
                <h2 className="text-[#6B7280] text-[11px] font-semibold uppercase tracking-widest mb-3 [font-family:var(--font-syne)]">
                  Civic DNA
                </h2>
                <p className="text-[#6B7280] text-sm leading-6 mb-4 [font-family:var(--font-instrument-sans)]">
                  You haven&#39;t taken the Civic DNA quiz yet. Take it to unlock match scores
                  on your ballot.
                </p>
                <Link
                  href="/onboarding/dna-teaser"
                  className="block w-full text-center bg-[#00C9A7] text-[#0D1117] font-bold py-3.5 rounded-xl text-sm active:scale-[0.98] transition-transform [font-family:var(--font-syne)]"
                >
                  Take the quiz
                </Link>
              </section>
            )}

            {/* Beta disclaimer */}
            <div className="bg-[#FFFBEB] border border-[#FDE68A] rounded-[20px] p-4">
              <p className="text-[#92400E] text-xs leading-5 [font-family:var(--font-instrument-sans)]">
                Read-only beta profile. Account details and Civic DNA results reflect your
                onboarding choices. No data is written here.
              </p>
            </div>

            {/* Sign out */}
            <div className="flex flex-col gap-2">
              {signOutError && (
                <p className="text-[#DC2626] text-xs text-center [font-family:var(--font-instrument-sans)]">
                  {signOutError}
                </p>
              )}
              <button
                onClick={handleSignOut}
                className="w-full bg-white border border-[#E5E7EB] text-[#6B7280] font-semibold py-3.5 rounded-[20px] text-sm active:scale-[0.98] transition-transform shadow-sm [font-family:var(--font-syne)]"
              >
                Sign out
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
