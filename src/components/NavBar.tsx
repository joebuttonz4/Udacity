'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function NavBar() {
  const pathname = usePathname();

  console.log('NavBar pathname:', pathname);

  if (pathname.startsWith('/onboarding')) {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-[#0D1117] border-t border-[#1F2937] flex items-center justify-around z-50">
      <Link href="/" className="flex flex-col items-center gap-1 text-[#6B7280] hover:text-[#00C9A7] transition-colors">
        <span className="text-xl">🏠</span>
        <span className="text-[10px] font-medium" style={{ fontFamily: 'var(--font-syne)' }}>Home</span>
      </Link>
      <a href="/ballot" className="flex flex-col items-center gap-1 text-[#6B7280] hover:text-[#00C9A7] transition-colors">
        <span className="text-xl">🗳️</span>
        <span className="text-[10px] font-medium" style={{ fontFamily: 'var(--font-syne)' }}>Ballot</span>
      </a>
      <a href="/vote" className="flex flex-col items-center gap-1 text-[#6B7280] hover:text-[#00C9A7] transition-colors">
        <span className="text-xl">📍</span>
        <span className="text-[10px] font-medium" style={{ fontFamily: 'var(--font-syne)' }}>Vote</span>
      </a>
      <a href="/profile" className="flex flex-col items-center gap-1 text-[#6B7280] hover:text-[#00C9A7] transition-colors">
        <span className="text-xl">👤</span>
        <span className="text-[10px] font-medium" style={{ fontFamily: 'var(--font-syne)' }}>Profile</span>
      </a>
    </nav>
  );
}