'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const TABS = [
  { href: '/', label: 'Home', icon: '🏠' },
  { href: '/ballot', label: 'Ballot', icon: '🗳️' },
  { href: '/vote', label: 'Vote', icon: '📍' },
  { href: '/profile', label: 'Profile', icon: '👤' },
] as const;

export default function NavBar() {
  const pathname = usePathname();

  if (pathname.startsWith('/onboarding') || pathname.startsWith('/admin')) {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-[#0D1117] border-t border-[#1F2937] flex items-center justify-around z-50">
      {TABS.map((tab) => {
        const isActive =
          tab.href === '/' ? pathname === '/' : pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex flex-col items-center gap-1 transition-colors [font-family:var(--font-syne)] ${
              isActive
                ? 'text-[#00C9A7]'
                : 'text-[#6B7280] hover:text-[#00C9A7]'
            }`}
          >
            <span className="text-xl">{tab.icon}</span>
            <span className="text-[10px] font-medium">{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
