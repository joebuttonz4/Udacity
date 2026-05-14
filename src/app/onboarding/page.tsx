'use client';

import { useRouter } from 'next/navigation';

export default function WelcomePage() {
  const router = useRouter();

  return (
    <div className="flex-1 flex flex-col items-center justify-between px-6 py-12 min-h-screen">
      
      {/* Logo */}
      <div className="flex flex-col items-center pt-8">
        <div className="w-16 h-16 rounded-2xl bg-[#00C9A7] flex items-center justify-center mb-4">
          <span className="text-3xl">🏛️</span>
        </div>
        <h1 
          className="text-2xl font-bold text-white tracking-tight"
          style={{ fontFamily: 'var(--font-syne)' }}
        >
          CivicMarket
        </h1>
      </div>

      {/* Value props */}
      <div className="flex flex-col gap-6 w-full max-w-sm">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-[#00C9A7]/10 flex items-center justify-center shrink-0">
            <span className="text-lg">🎯</span>
          </div>
          <div>
            <p className="text-white font-semibold text-sm" style={{ fontFamily: 'var(--font-syne)' }}>
              Matched to your values
            </p>
            <p className="text-[#6B7280] text-sm mt-0.5">
              See how every candidate aligns with what matters to you.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-[#00C9A7]/10 flex items-center justify-center shrink-0">
            <span className="text-lg">💰</span>
          </div>
          <div>
            <p className="text-white font-semibold text-sm" style={{ fontFamily: 'var(--font-syne)' }}>
              Follow the money
            </p>
            <p className="text-[#6B7280] text-sm mt-0.5">
              See exactly who funds every campaign — neighbors or PACs.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-[#00C9A7]/10 flex items-center justify-center shrink-0">
            <span className="text-lg">📍</span>
          </div>
          <div>
            <p className="text-white font-semibold text-sm" style={{ fontFamily: 'var(--font-syne)' }}>
              Only your races
            </p>
            <p className="text-[#6B7280] text-sm mt-0.5">
              No noise. Only candidates and measures you can actually vote on.
            </p>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="flex flex-col items-center gap-4 w-full max-w-sm">
        <button
          onClick={() => router.push('/onboarding/signup')}
          className="w-full h-14 bg-[#00C9A7] hover:bg-[#00A688] text-[#0D1117] font-bold rounded-2xl transition-colors"
          style={{ fontFamily: 'var(--font-syne)' }}
        >
          Get started
        </button>
        <p className="text-[#6B7280] text-xs text-center">
          Free forever. No ads. No party affiliation.
        </p>
      </div>

    </div>
  );
}