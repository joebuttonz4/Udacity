'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type Phase = 'calculating' | 'ready'

export default function CalculatingPage() {
  const router = useRouter()
  const [phase, setPhase] = useState<Phase>('calculating')

  useEffect(() => {
    let cancelled = false

    async function computeMatchScores() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) return
      const lockKey = `match-scores-computing-${session.user.id}`
      if (sessionStorage.getItem(lockKey)) return
      sessionStorage.setItem(lockKey, '1')
      try {
        await fetch('/api/compute-match-scores', {
          method: 'POST',
          headers: { Authorization: `Bearer ${session.access_token}` },
        })
      } finally {
        sessionStorage.removeItem(lockKey)
      }
    }

    Promise.all([
      computeMatchScores().catch(() => {}),
      new Promise<void>((resolve) => setTimeout(resolve, 2500)),
    ]).then(() => {
      if (!cancelled) setPhase('ready')
    })

    return () => {
      cancelled = true
    }
  }, [])

  if (phase === 'ready') {
    return (
      <div className="min-h-screen bg-[#0D1117] flex flex-col items-center justify-center px-6">
        <div className="w-16 h-16 mb-8 rounded-full bg-[#00C9A7]/10 flex items-center justify-center">
          <span className="text-3xl" aria-hidden="true">✅</span>
        </div>

        <h2
          className="text-2xl font-bold text-white text-center mb-3"
          style={{ fontFamily: 'var(--font-syne)' }}
        >
          Your Civic DNA is ready
        </h2>
        <p
          className="text-[#6B7280] text-sm text-center max-w-xs mb-8"
          style={{ fontFamily: 'var(--font-instrument-sans)' }}
        >
          We saved your Civic DNA. Match scores will appear only for candidates with enough verified position data. Some candidate rings may stay locked during the Internal Beta.
        </p>

        <button
          onClick={() => router.push('/ballot')}
          className="bg-[#00C9A7] text-[#0D1117] font-bold py-3 px-8 rounded-xl text-sm active:scale-[0.98] transition-transform [font-family:var(--font-syne)]"
        >
          View my ballot
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0D1117] flex flex-col items-center justify-center px-6">
      {/* Animated rings */}
      <div className="relative w-24 h-24 mb-8">
        <svg viewBox="0 0 96 96" className="w-24 h-24 animate-spin" style={{ animationDuration: '2s' }}>
          <circle
            cx="48" cy="48" r="40"
            fill="none"
            stroke="#1F2937"
            strokeWidth="4"
          />
          <circle
            cx="48" cy="48" r="40"
            fill="none"
            stroke="#00C9A7"
            strokeWidth="4"
            strokeDasharray="180 72"
            strokeLinecap="round"
            className="-rotate-90 origin-center"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl" aria-hidden="true">🗳️</span>
        </div>
      </div>

      <h2
        className="text-2xl font-bold text-white text-center mb-3"
        style={{ fontFamily: 'var(--font-syne)' }}
      >
        Calculating your matches
      </h2>
      <p
        className="text-[#6B7280] text-sm text-center max-w-xs"
        style={{ fontFamily: 'var(--font-instrument-sans)' }}
      >
        Comparing your values against every candidate on your ballot...
      </p>

      {/* Pulsing dots */}
      <div className="flex gap-2 mt-8">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-2 h-2 rounded-full bg-[#00C9A7] animate-pulse"
            style={{ animationDelay: `${i * 0.2}s` }}
          />
        ))}
      </div>
    </div>
  )
}
