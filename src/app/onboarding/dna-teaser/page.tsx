'use client'

import { useRouter } from 'next/navigation'

const BENEFITS = [
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
    label: 'Quick & Easy',
    desc: '14 questions, about 3 minutes',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0110 0v4" />
      </svg>
    ),
    label: 'Private',
    desc: 'Your answers are never shared',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
      </svg>
    ),
    label: 'Personalized',
    desc: 'Unlocks match scores for every candidate',
  },
]

const DIMENSIONS = [
  { emoji: '🏗️', label: 'Growth & Development' },
  { emoji: '💰', label: 'Taxes & Services' },
  { emoji: '🌿', label: 'Environment' },
  { emoji: '🏫', label: 'Education' },
  { emoji: '🏠', label: 'Housing' },
  { emoji: '🔦', label: 'Public Safety' },
  { emoji: '📋', label: 'Transparency' },
]

export default function DnaTeaserPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen flex flex-col bg-[#F0FDF9]">

      {/* Light coastal hero header */}
      <div className="relative bg-[#EAF9F5] overflow-hidden">
        {/* Brand PNG — light daytime coastal scene */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/brand/dna-hero-coastal-light.png"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none select-none"
        />

        {/* Left-to-right overlay: near-white behind the text on the left, fades to transparent on the right so the coastal image remains visible */}
        <div className="absolute inset-0 bg-gradient-to-r from-white/92 via-white/78 to-white/20 pointer-events-none" />

        {/* Content */}
        <div className="relative z-10 px-6 pt-14 pb-10">
          <p className="text-[#0D9488] text-xs font-semibold uppercase tracking-widest mb-2 [font-family:var(--font-syne)]">
            Your Civic DNA
          </p>
          <h1 className="text-slate-950 text-[28px] font-bold leading-tight mb-2 [font-family:var(--font-syne)]">
            See how well you match every candidate
          </h1>
          <p className="text-slate-700 text-sm leading-6 [font-family:var(--font-instrument-sans)]">
            Answer 14 quick questions. Unlock a personal match score for every race on your ballot.
          </p>
        </div>
      </div>

      {/* Light content area */}
      <div className="flex-1 px-4 pt-4 pb-10 flex flex-col gap-4">

        {/* Benefit chips */}
        <div className="flex flex-col gap-3">
          {BENEFITS.map(({ icon, label, desc }) => (
            <div
              key={label}
              className="bg-white rounded-[20px] shadow-sm px-4 py-4 flex items-center gap-4"
            >
              <div className="w-10 h-10 rounded-full bg-[#CCFBF1] flex items-center justify-center flex-shrink-0 text-[#0D9488]">
                {icon}
              </div>
              <div>
                <p className="text-[#0D1117] text-sm font-semibold [font-family:var(--font-syne)]">
                  {label}
                </p>
                <p className="text-[#6B7280] text-xs mt-0.5 [font-family:var(--font-instrument-sans)]">
                  {desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* What the quiz covers */}
        <div className="bg-white rounded-[20px] shadow-sm p-4">
          <p className="text-[#6B7280] text-[11px] font-semibold uppercase tracking-widest mb-3 [font-family:var(--font-syne)]">
            7 local issues covered
          </p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
            {DIMENSIONS.map((dim) => (
              <div key={dim.label} className="flex items-center gap-2">
                <span className="text-base leading-none">{dim.emoji}</span>
                <span className="text-[#374151] text-xs [font-family:var(--font-instrument-sans)]">
                  {dim.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 py-1">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`h-1 rounded-full transition-all ${
                i === 3 ? 'w-6 bg-[#00C9A7]' : 'w-4 bg-[#D1FAF0]'
              }`}
            />
          ))}
        </div>

        {/* CTAs */}
        <button
          onClick={() => router.push('/onboarding/quiz')}
          className="w-full bg-[#00C9A7] text-[#0D1117] font-bold py-4 rounded-2xl text-base active:scale-[0.98] transition-transform [font-family:var(--font-syne)]"
        >
          Find My Matches →
        </button>
        <button
          onClick={() => router.push('/')}
          className="w-full text-[#6B7280] text-sm py-2 [font-family:var(--font-instrument-sans)]"
        >
          I&apos;ll do this later
        </button>
      </div>
    </div>
  )
}
