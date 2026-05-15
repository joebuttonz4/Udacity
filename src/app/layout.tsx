import type { Metadata } from "next";
import Link from "next/link";
import { Syne, Instrument_Sans } from "next/font/google";
import "./globals.css";

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const instrumentSans = Instrument_Sans({
  variable: "--font-instrument-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "CivicMarket",
  description: "Your local elections, personalized.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${syne.variable} ${instrumentSans.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-[#F6F8FA] text-[#0D1117] flex flex-col">
        <main className="flex-1 flex flex-col pb-16">
          {children}
        </main>
        <nav className="fixed bottom-0 left-0 right-0 h-16 bg-[#0D1117] border-t border-[#1F2937] flex items-center justify-around z-50">
          <Link href="/" className="flex flex-col items-center gap-1 text-[#6B7280] hover:text-[#00C9A7] transition-colors">
            <span className="text-xl">🏠</span>
            <span className="text-[10px] font-medium" style={{fontFamily: 'var(--font-syne)'}}>Home</span>
          </Link>
          <a href="/ballot" className="flex flex-col items-center gap-1 text-[#6B7280] hover:text-[#00C9A7] transition-colors">
            <span className="text-xl">🗳️</span>
            <span className="text-[10px] font-medium" style={{fontFamily: 'var(--font-syne)'}}>Ballot</span>
          </a>
          <a href="/vote" className="flex flex-col items-center gap-1 text-[#6B7280] hover:text-[#00C9A7] transition-colors">
            <span className="text-xl">📍</span>
            <span className="text-[10px] font-medium" style={{fontFamily: 'var(--font-syne)'}}>Vote</span>
          </a>
          <a href="/profile" className="flex flex-col items-center gap-1 text-[#6B7280] hover:text-[#00C9A7] transition-colors">
            <span className="text-xl">👤</span>
            <span className="text-[10px] font-medium" style={{fontFamily: 'var(--font-syne)'}}>Profile</span>
          </a>
        </nav>
      </body>
    </html>
  );
}