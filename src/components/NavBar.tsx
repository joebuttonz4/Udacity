'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

function IconHome() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 12L12 4l9 8" />
      <path d="M5 10v9a1 1 0 001 1h4v-5h4v5h4a1 1 0 001-1v-9" />
    </svg>
  );
}

function IconBallot() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <path d="M8 7h8M8 11h8M8 15h5" />
    </svg>
  );
}

function IconVote() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function IconProfile() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

const TABS = [
  { href: '/', label: 'Home', Icon: IconHome },
  { href: '/ballot', label: 'Ballot', Icon: IconBallot },
  { href: '/vote', label: 'Vote', Icon: IconVote },
  { href: '/profile', label: 'Profile', Icon: IconProfile },
] as const;

export default function NavBar() {
  const pathname = usePathname();

  if (pathname.startsWith('/onboarding') || pathname.startsWith('/admin')) {
    return null;
  }

  return (
    <nav className="fixed bottom-5 left-4 right-4 h-[62px] bg-white/90 backdrop-blur-xl border border-[#E8EDF2]/70 rounded-[28px] flex items-stretch justify-around z-50 shadow-[0_8px_32px_rgba(0,0,0,0.10)]">
      {TABS.map(({ href, label, Icon }) => {
        const isActive =
          href === '/' ? pathname === '/' : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={`relative flex flex-col items-center justify-center gap-0.5 flex-1 outline-none transition-colors [font-family:var(--font-syne)] ${
              isActive ? 'text-[#00C9A7]' : 'text-[#94A3B8]'
            }`}
          >
            {/* Active pip at top edge */}
            <span
              className={`absolute top-0 h-0.5 w-7 rounded-full transition-opacity ${
                isActive ? 'bg-[#00C9A7] opacity-100' : 'opacity-0'
              }`}
            />
            <Icon />
            <span className="text-[10px] font-semibold mt-0.5">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
