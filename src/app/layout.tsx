import type { Metadata } from "next";
import { Syne, Instrument_Sans } from "next/font/google";
import NavBar from "@/components/NavBar";
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
        <main className="flex-1 flex flex-col">
          {children}
        </main>
        <NavBar />
      </body>
    </html>
  );
}
