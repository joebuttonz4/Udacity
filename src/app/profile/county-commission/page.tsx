'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

const LOOKUP_TOOL_URL =
  'https://slc.maps.arcgis.com/apps/instant/lookup/index.html?appid=9afb7523a1854366bed2d7c50ed7428b'

const DISTRICT_OPTIONS = [
  'District 1',
  'District 2',
  'District 3',
  'District 4',
  'District 5',
] as const

type DistrictOption = (typeof DISTRICT_OPTIONS)[number]

type SubmitState = 'idle' | 'loading' | 'success' | 'error'

export default function CountyCommissionDistrictPage() {
  const router = useRouter()
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [selectedDistrict, setSelectedDistrict] = useState<DistrictOption | ''>('')
  const [attested, setAttested] = useState(false)
  const [state, setState] = useState<SubmitState>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [resultMessage, setResultMessage] = useState<string | null>(null)

  useEffect(() => {
    async function checkAuth() {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) {
        router.push('/onboarding')
        return
      }
      setCheckingAuth(false)
    }
    checkAuth()
  }, [router])

  const canSubmit = selectedDistrict !== '' && attested && state !== 'loading'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return

    setState('loading')
    setErrorMessage(null)
    setResultMessage(null)

    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      router.push('/onboarding')
      return
    }

    try {
      const res = await fetch('/api/set-county-commission-district', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          districtLabel: selectedDistrict,
          attestedOfficialLookup: attested,
        }),
      })

      const result = await res.json()

      if (!res.ok) {
        setErrorMessage(
          typeof result?.error === 'string' ? result.error : 'Something went wrong. Please try again.'
        )
        setState('error')
        return
      }

      setResultMessage(
        result?.dryRun
          ? (result?.message as string) ?? 'Beta preview — this district was not saved yet.'
          : 'Your County Commission district was saved.'
      )
      setState('success')
    } catch {
      setErrorMessage('Something went wrong. Please try again.')
      setState('error')
    }
  }

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-[#F6F8FA] flex flex-col">
        <div className="bg-gradient-to-br from-[#081F1A] via-[#0D1117] to-[#060C14] px-6 pt-12 pb-8">
          <div className="h-4 w-24 bg-white/10 rounded animate-pulse mb-6" />
          <div className="h-7 w-3/4 bg-white/10 rounded animate-pulse" />
        </div>
        <div className="flex-1 px-6 py-6 max-w-md w-full mx-auto">
          <div className="h-40 bg-white rounded-[20px] shadow-sm animate-pulse" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F6F8FA] flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#081F1A] via-[#0D1117] to-[#060C14] px-6 pt-12 pb-8">
        <Link
          href="/profile"
          className="inline-block text-[#94A3B8] text-sm mb-6 [font-family:var(--font-instrument-sans)]"
        >
          ← Back to Profile
        </Link>
        <h1 className="text-white text-2xl font-bold leading-tight [font-family:var(--font-syne)]">
          Verify your County Commission district
        </h1>
        <p className="text-[#94A3B8] text-sm mt-2 leading-relaxed [font-family:var(--font-instrument-sans)]">
          St. Lucie County has five County Commission districts. A ZIP code alone is not
          reliable for finding the right one — district boundaries can cross ZIP code lines.
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 px-6 py-6 flex flex-col gap-5 max-w-md w-full mx-auto">
        {/* Step 1: official lookup */}
        <section className="bg-white rounded-[20px] shadow-sm p-5">
          <p className="text-[#6B7280] text-[11px] font-semibold uppercase tracking-widest mb-2 [font-family:var(--font-syne)]">
            Step 1
          </p>
          <p className="text-[#0D1117] text-sm leading-relaxed mb-4 [font-family:var(--font-instrument-sans)]">
            Look up your address on the official St. Lucie County lookup tool. Enter your
            address there — CivicMarket does not collect or store your address on this page.
          </p>
          <a
            href={LOOKUP_TOOL_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full text-center bg-[#00C9A7]/10 text-[#00A688] font-semibold py-3 rounded-xl text-sm [font-family:var(--font-syne)]"
          >
            Open official county lookup tool ↗
          </a>
        </section>

        {/* Step 2: selection form */}
        <form onSubmit={handleSubmit}>
          <section className="bg-white rounded-[20px] shadow-sm p-5 flex flex-col gap-4">
            <div>
              <p className="text-[#6B7280] text-[11px] font-semibold uppercase tracking-widest mb-2 [font-family:var(--font-syne)]">
                Step 2
              </p>
              <p className="text-[#0D1117] text-sm leading-relaxed [font-family:var(--font-instrument-sans)]">
                Select the district the official tool showed you.
              </p>
            </div>

            <div
              className="flex flex-col gap-2"
              role="radiogroup"
              aria-label="County Commission district"
            >
              {DISTRICT_OPTIONS.map((option) => (
                <label
                  key={option}
                  className={`flex items-center gap-3 rounded-xl border px-4 py-3 cursor-pointer transition-colors ${
                    selectedDistrict === option
                      ? 'border-[#00C9A7] bg-[#00C9A7]/5'
                      : 'border-[#EEF2F7] bg-[#F8FAFC]'
                  }`}
                >
                  <input
                    type="radio"
                    name="districtLabel"
                    value={option}
                    checked={selectedDistrict === option}
                    onChange={() => setSelectedDistrict(option)}
                    className="w-4 h-4 accent-[#00C9A7]"
                  />
                  <span className="text-[#0D1117] text-sm font-medium [font-family:var(--font-instrument-sans)]">
                    {option}
                  </span>
                </label>
              ))}
            </div>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={attested}
                onChange={(e) => setAttested(e.target.checked)}
                className="w-4 h-4 mt-0.5 accent-[#00C9A7]"
              />
              <span className="text-[#374151] text-sm leading-relaxed [font-family:var(--font-instrument-sans)]">
                I verified this district using the official St. Lucie County lookup tool.
              </span>
            </label>

            {state === 'error' && errorMessage && (
              <div className="bg-[#FEF2F2] border border-[#FECACA] rounded-xl p-3">
                <p className="text-[#DC2626] text-sm [font-family:var(--font-instrument-sans)]">
                  {errorMessage}
                </p>
              </div>
            )}

            {state === 'success' && resultMessage && (
              <div className="bg-[#F0FDF9] border border-[#99F6E4] rounded-xl p-3">
                <p className="text-[#0D9488] text-sm font-medium [font-family:var(--font-instrument-sans)]">
                  {resultMessage}
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={!canSubmit}
              className="w-full bg-[#00C9A7] disabled:opacity-40 text-[#0D1117] font-bold py-3.5 rounded-xl text-sm active:scale-[0.98] transition-transform [font-family:var(--font-syne)]"
            >
              {state === 'loading' ? 'Verifying…' : 'Save my district'}
            </button>
          </section>
        </form>

        {/* Beta disclaimer */}
        <div className="bg-[#FFFBEB] border border-[#FDE68A] rounded-[20px] p-4">
          <p className="text-[#92400E] text-xs leading-5 [font-family:var(--font-instrument-sans)]">
            Beta preview. This page does not save your district yet — the write path is
            under review before going live.
          </p>
        </div>
      </div>
    </div>
  )
}
