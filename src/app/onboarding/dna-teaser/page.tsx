'use client'

import { useRouter } from 'next/navigation'

export default function DnaTeaserPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-[#0D1117] flex flex-col">
      {/* Header */}
      <div className="px-6 pt-12 pb-6">
        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-8">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`h-1 rounded-full transition-all ${
                i === 3
                  ? 'w-6 bg-[#00C9A7]'
                  : 'w-4 bg-[#374151]'
              }`}
            />
          ))}
        </div>

        <p className="text-[#00C9A7] text-sm font-medium mb-2" style={{ fontFamily: 'var(--font-syne)' }}>
          One More Thing
        </p>
        <h1
          className="text-2xl font-bold text-white leading-tight mb-2"
          style={{ fontFamily: 'var(--font-syne)' }}
        >
          See how well each candidate matches your values
        </h1>
        <p className="text-[#6B7280] text-sm" style={{ fontFamily: 'var(--font-instrument-sans)' }}>
          14 questions. About 3 minutes. Unlocks a personal match score for every candidate on your ballot.
        </p>
      </div>

      {/* Visual — locked match rings preview */}
      <div className="px-6 mb-6">
        <div className="bg-[#1F2937] rounded-2xl p-5 border border-[#374151]">
          {/* Mock candidate rows with locked rings */}
          <p
            className="text-[#9CA3AF] text-xs font-semibold uppercase tracking-widest mb-4"
            style={{ fontFamily: 'var(--font-syne)' }}
          >
            City Council District 1
          </p>

          {[
            { name: 'Maria Santos', office: 'City Council District 1', incumbent: true },
            { name: 'David Okafor', office: 'City Council District 1', incumbent: false },
          ].map((c) => (
            <div
              key={c.name}
              className="flex items-center justify-between bg-[#0D1117] rounded-xl px-4 py-3 mb-2 last:mb-0"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#374151] flex items-center justify-center flex-shrink-0">
                  <span
                    className="text-xs font-bold text-[#9CA3AF]"
                    style={{ fontFamily: 'var(--font-syne)' }}
                  >
                    {c.name.charAt(0)}
                  </span>
                </div>
                <div>
                  <p
                    className="text-white text-sm font-semibold leading-tight"
                    style={{ fontFamily: 'var(--font-syne)' }}
                  >
                    {c.name}
                  </p>
                  <p
                    className="text-[#6B7280] text-xs mt-0.5"
                    style={{ fontFamily: 'var(--font-instrument-sans)' }}
                  >
                    {c.office}
                  </p>
                </div>
              </div>

              {/* Locked match ring */}
              <div className="flex flex-col items-center flex-shrink-0">
                <div className="relative w-10 h-10">
                  <svg viewBox="0 0 40 40" className="w-10 h-10 -rotate-90">
                    <circle
                      cx="20" cy="20" r="16"
                      fill="none"
                      stroke="#374151"
                      strokeWidth="3"
                      strokeDasharray="4 3"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-sm">🔒</span>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Blurred hint rows */}
          <div className="mt-3 flex flex-col gap-2 opacity-30 blur-[2px] pointer-events-none select-none">
            {['School Board District 1', 'FL House District 85'].map((label) => (
              <div key={label} className="flex items-center justify-between bg-[#0D1117] rounded-xl px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#374151]" />
                  <div>
                    <div className="h-3 w-24 bg-[#374151] rounded mb-1.5" />
                    <div className="h-2 w-16 bg-[#374151] rounded" />
                  </div>
                </div>
                <div className="w-10 h-10 rounded-full border-2 border-dashed border-[#374151]" />
              </div>
            ))}
          </div>

          {/* Unlock hint */}
          <div className="mt-4 pt-4 border-t border-[#374151] flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#00C9A7] flex-shrink-0" />
            <p
              className="text-[#9CA3AF] text-xs"
              style={{ fontFamily: 'var(--font-instrument-sans)' }}
            >
              Match scores unlock after your Civic DNA quiz
            </p>
          </div>
        </div>
      </div>

      {/* What the quiz covers */}
      <div className="px-6 mb-6">
        <div className="flex flex-col gap-2">
          {[
            { emoji: '🏗️', label: 'Growth & Development' },
            { emoji: '💰', label: 'Taxes & Services' },
            { emoji: '🌿', label: 'Environment' },
            { emoji: '🏫', label: 'Education' },
            { emoji: '🏠', label: 'Housing' },
            { emoji: '🔦', label: 'Public Safety' },
            { emoji: '📋', label: 'Transparency' },
          ].map((dim) => (
            <div key={dim.label} className="flex items-center gap-3">
              <span className="text-base">{dim.emoji}</span>
              <span
                className="text-[#9CA3AF] text-sm"
                style={{ fontFamily: 'var(--font-instrument-sans)' }}
              >
                {dim.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* CTAs */}
      <div className="px-6 pb-12 mt-auto">
        <button
          onClick={() => router.push('/onboarding/quiz')}
          className="w-full bg-[#00C9A7] text-[#0D1117] font-bold py-4 rounded-2xl text-base active:scale-[0.98] transition-transform mb-3"
          style={{ fontFamily: 'var(--font-syne)' }}
        >
          Find My Matches →
        </button>
        <button
          onClick={() => router.push('/')}
          className="w-full text-[#6B7280] text-sm py-2"
          style={{ fontFamily: 'var(--font-instrument-sans)' }}
        >
          I&apos;ll do this later
        </button>
      </div>
    </div>
  )
}