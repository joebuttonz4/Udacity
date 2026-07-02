import Link from 'next/link'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#0D1117] px-6 pt-12 pb-28">
      <Link
        href="/onboarding/signup"
        className="flex items-center gap-1 text-[#9CA3AF] text-sm mb-6 hover:text-[#00C9A7] transition-colors [font-family:var(--font-instrument-sans)]"
      >
        ← Back
      </Link>

      <header className="mb-6">
        <p className="text-[#00C9A7] text-sm font-medium mb-2 [font-family:var(--font-syne)]">
          Legal
        </p>
        <h1 className="text-3xl font-bold text-white leading-tight [font-family:var(--font-syne)]">
          Terms of Service
        </h1>
        <p className="text-[#6B7280] text-sm mt-2 [font-family:var(--font-instrument-sans)]">
          Last updated: July 2, 2026
        </p>
      </header>

      {/* Beta draft notice */}
      <div className="bg-amber-900/30 border border-amber-700/50 rounded-2xl p-4 mb-6">
        <p className="text-amber-400 text-xs font-semibold mb-1 [font-family:var(--font-syne)]">
          BETA DRAFT
        </p>
        <p className="text-amber-300/80 text-xs leading-5 [font-family:var(--font-instrument-sans)]">
          These terms govern the closed beta of CivicMarket. They are a draft, not legal advice,
          and will be updated before any public launch. By participating in the beta you
          acknowledge these terms may change.
        </p>
      </div>

      <div className="flex flex-col gap-4">

        <section className="bg-[#1F2937] rounded-2xl p-4 border border-[#374151]">
          <h2 className="text-white text-sm font-semibold mb-2 [font-family:var(--font-syne)]">
            What CivicMarket is
          </h2>
          <p className="text-[#9CA3AF] text-sm leading-6 [font-family:var(--font-instrument-sans)]">
            CivicMarket is a non-partisan civic information tool. It aggregates publicly available
            candidate information, voting records, and campaign finance data to help residents
            understand local elections in Port St. Lucie, Florida. CivicMarket does not endorse,
            rank, or recommend any candidate. It is not affiliated with any political party,
            campaign, or government entity.
          </p>
        </section>

        <section className="bg-[#1F2937] rounded-2xl p-4 border border-[#374151]">
          <h2 className="text-white text-sm font-semibold mb-2 [font-family:var(--font-syne)]">
            Closed beta
          </h2>
          <p className="text-[#9CA3AF] text-sm leading-6 [font-family:var(--font-instrument-sans)]">
            CivicMarket is currently invite-only. Access requires an invitation code. The beta
            is limited to residents of Port St. Lucie and the surrounding area. We may expand
            or restrict access at any time. The beta may be paused or discontinued without
            notice.
          </p>
        </section>

        <section className="bg-[#1F2937] rounded-2xl p-4 border border-[#374151]">
          <h2 className="text-white text-sm font-semibold mb-2 [font-family:var(--font-syne)]">
            Eligibility
          </h2>
          <p className="text-[#9CA3AF] text-sm leading-6 [font-family:var(--font-instrument-sans)]">
            You must be at least 18 years old to create a CivicMarket account. By creating an
            account you represent that you meet this requirement. CivicMarket is intended for
            use by eligible voters and civically engaged residents in the supported area.
          </p>
        </section>

        <section className="bg-[#1F2937] rounded-2xl p-4 border border-[#374151]">
          <h2 className="text-white text-sm font-semibold mb-2 [font-family:var(--font-syne)]">
            Informational use only
          </h2>
          <p className="text-[#9CA3AF] text-sm leading-6 [font-family:var(--font-instrument-sans)]">
            All content on CivicMarket — including candidate profiles, voting records, funding
            data, Civic DNA scores, and match percentages — is provided for informational
            purposes only. This information may contain errors or omissions. Always verify
            candidate and ballot information with official sources before making voting decisions.
            CivicMarket is not a substitute for your own research.
          </p>
        </section>

        <section className="bg-[#1F2937] rounded-2xl p-4 border border-[#374151]">
          <h2 className="text-white text-sm font-semibold mb-2 [font-family:var(--font-syne)]">
            Your account
          </h2>
          <p className="text-[#9CA3AF] text-sm leading-6 [font-family:var(--font-instrument-sans)]">
            You are responsible for maintaining the confidentiality of your account credentials.
            You may not share your invite code or account with others. You may not create
            multiple accounts. You agree to provide accurate information during signup and
            onboarding.
          </p>
        </section>

        <section className="bg-[#1F2937] rounded-2xl p-4 border border-[#374151]">
          <h2 className="text-white text-sm font-semibold mb-2 [font-family:var(--font-syne)]">
            Prohibited use
          </h2>
          <p className="text-[#9CA3AF] text-sm leading-6 [font-family:var(--font-instrument-sans)]">
            You may not use CivicMarket to mislead others about candidate positions, fabricate
            or spread inaccurate civic data, scrape or harvest data for redistribution, or
            attempt to interfere with the app or its infrastructure. Misuse may result in
            removal from the beta.
          </p>
        </section>

        <section className="bg-[#1F2937] rounded-2xl p-4 border border-[#374151]">
          <h2 className="text-white text-sm font-semibold mb-2 [font-family:var(--font-syne)]">
            No warranty
          </h2>
          <p className="text-[#9CA3AF] text-sm leading-6 [font-family:var(--font-instrument-sans)]">
            CivicMarket is provided &quot;as is&quot; during the beta period. We make no warranty
            that the information displayed is complete, accurate, or up to date. Election data,
            voting records, and funding figures are sourced from public records and may not
            reflect the most current filings. We are not liable for decisions made based on
            information in the app.
          </p>
        </section>

        <section className="bg-[#1F2937] rounded-2xl p-4 border border-[#374151]">
          <h2 className="text-white text-sm font-semibold mb-2 [font-family:var(--font-syne)]">
            Changes to these terms
          </h2>
          <p className="text-[#9CA3AF] text-sm leading-6 [font-family:var(--font-instrument-sans)]">
            We may update these terms at any time before or after public launch. Beta
            participants will be notified of material changes by email. Continued use of the app
            after an update constitutes acceptance of the revised terms.
          </p>
        </section>

        <section className="bg-[#1F2937] rounded-2xl p-4 border border-[#374151]">
          <h2 className="text-white text-sm font-semibold mb-2 [font-family:var(--font-syne)]">
            Contact
          </h2>
          <p className="text-[#9CA3AF] text-sm leading-6 [font-family:var(--font-instrument-sans)]">
            Questions about these terms? Contact information will be provided when the beta
            launches. In the meantime, reach out through your beta invite channel.
          </p>
        </section>

        <div className="bg-[#374151]/30 border border-[#374151] rounded-2xl p-4">
          <p className="text-[#6B7280] text-xs leading-5 [font-family:var(--font-instrument-sans)]">
            This is a beta draft. CivicMarket is not a law firm and this document is not legal
            advice. These terms describe acceptable use and our commitments to beta participants
            in plain language.
          </p>
        </div>

      </div>
    </div>
  )
}
