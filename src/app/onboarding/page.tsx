'use client';

import { useRouter } from 'next/navigation';

function IconMatch() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <path d="M8 12l3 3 5-5" />
    </svg>
  );
}

function IconFunding() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
    </svg>
  );
}

function IconLocal() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

export default function WelcomePage() {
  const router = useRouter();

  return (
    <div className="flex-1 flex flex-col items-center justify-between px-6 py-12">

      {/* Logo */}
      <div className="flex flex-col items-center pt-8">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#00C9A7] to-[#00A688] flex items-center justify-center mb-4 shadow-lg shadow-[#00C9A7]/20">
          <svg width="36" height="36" viewBox="0 0 36 36" fill="none" aria-hidden="true">
            <rect x="5" y="14" width="4" height="14" rx="1" fill="white" opacity="0.85" />
            <rect x="16" y="10" width="4" height="18" rx="1" fill="white" />
            <rect x="27" y="14" width="4" height="14" rx="1" fill="white" opacity="0.85" />
            <rect x="3" y="28" width="30" height="2.5" rx="1.25" fill="white" />
            <rect x="3" y="9.5" width="30" height="2.5" rx="1.25" fill="white" opacity="0.9" />
            <path d="M18 8 C16 5 12 3.5 10 5 C12.5 3 16.5 5.5 18 8Z" fill="white" opacity="0.65" />
            <path d="M18 8 C18.5 5 20.5 2.5 22.5 4 C20 2.5 18 5 18 8Z" fill="white" opacity="0.65" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight [font-family:var(--font-syne)]">
          CivicMarket
        </h1>
        <p className="text-[#64748B] text-sm mt-1 [font-family:var(--font-instrument-sans)]">
          Port St. Lucie beta
        </p>
      </div>

      {/* Value props */}
      <div className="flex flex-col gap-6 w-full max-w-sm">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-[#00C9A7]/15 flex items-center justify-center shrink-0 text-[#00C9A7]">
            <IconMatch />
          </div>
          <div>
            <p className="text-white font-semibold text-sm [font-family:var(--font-syne)]">
              Matched to your values
            </p>
            <p className="text-[#64748B] text-sm mt-0.5 [font-family:var(--font-instrument-sans)]">
              See how every candidate aligns with what matters to you.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-[#00C9A7]/15 flex items-center justify-center shrink-0 text-[#00C9A7]">
            <IconFunding />
          </div>
          <div>
            <p className="text-white font-semibold text-sm [font-family:var(--font-syne)]">
              Follow the money
            </p>
            <p className="text-[#64748B] text-sm mt-0.5 [font-family:var(--font-instrument-sans)]">
              See exactly who funds every campaign — neighbors or PACs.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-[#00C9A7]/15 flex items-center justify-center shrink-0 text-[#00C9A7]">
            <IconLocal />
          </div>
          <div>
            <p className="text-white font-semibold text-sm [font-family:var(--font-syne)]">
              Only your races
            </p>
            <p className="text-[#64748B] text-sm mt-0.5 [font-family:var(--font-instrument-sans)]">
              No noise. Only candidates and measures you can actually vote on.
            </p>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="flex flex-col items-center gap-4 w-full max-w-sm">
        <button
          onClick={() => router.push('/onboarding/signup')}
          className="w-full h-14 bg-[#00C9A7] hover:bg-[#00A688] text-[#0D1117] font-bold rounded-2xl transition-colors active:scale-[0.98] [font-family:var(--font-syne)]"
        >
          Get started
        </button>
        <p className="text-[#475569] text-xs text-center [font-family:var(--font-instrument-sans)]">
          Free forever. No ads. No party affiliation.
        </p>
      </div>

    </div>
  );
}
