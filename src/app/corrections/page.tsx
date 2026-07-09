import Link from 'next/link'

export default function CorrectionsPage() {
  return (
    <div className="min-h-screen bg-[#0D1117] px-6 pt-12 pb-28">
      <Link
        href="/data-sources"
        className="flex items-center gap-1 text-[#9CA3AF] text-sm mb-6 hover:text-[#00C9A7] transition-colors [font-family:var(--font-instrument-sans)]"
      >
        ← Back
      </Link>

      <header className="mb-6">
        <p className="text-[#00C9A7] text-sm font-medium mb-2 [font-family:var(--font-syne)]">
          Legal
        </p>
        <h1 className="text-3xl font-bold text-white leading-tight [font-family:var(--font-syne)]">
          Corrections Policy
        </h1>
        <p className="text-[#6B7280] text-sm mt-2 [font-family:var(--font-instrument-sans)]">
          Last updated: July 9, 2026
        </p>
      </header>

      {/* Beta draft notice */}
      <div className="bg-amber-900/30 border border-amber-700/50 rounded-2xl p-4 mb-6">
        <p className="text-amber-400 text-xs font-semibold mb-1 [font-family:var(--font-syne)]">
          BETA DRAFT
        </p>
        <p className="text-amber-300/80 text-xs leading-5 [font-family:var(--font-instrument-sans)]">
          This policy governs the closed beta of CivicMarket. It is a draft, not legal advice, and
          will be updated before any public launch. By participating in the beta you acknowledge
          this document may change.
        </p>
      </div>

      <div className="flex flex-col gap-4">

        <section className="bg-[#1F2937] rounded-2xl p-4 border border-[#374151]">
          <h2 className="text-white text-sm font-semibold mb-2 [font-family:var(--font-syne)]">
            Reporting incorrect civic data
          </h2>
          <p className="text-[#9CA3AF] text-sm leading-6 [font-family:var(--font-instrument-sans)]">
            CivicMarket relies on publicly available candidate, voting record, funding, and ballot
            measure data. If you believe any of this information is incorrect, out of date, or
            missing, you can report it to us at any time using the &quot;Report an Inaccuracy&quot;
            link on a candidate or ballot measure page, or by emailing us directly.
          </p>
        </section>

        <section className="bg-[#1F2937] rounded-2xl p-4 border border-[#374151]">
          <h2 className="text-white text-sm font-semibold mb-2 [font-family:var(--font-syne)]">
            What to include in a report
          </h2>
          <p className="text-[#9CA3AF] text-sm leading-6 [font-family:var(--font-instrument-sans)]">
            To help us review a correction quickly, please include: the specific record you are
            reporting (a candidate, voting record, funding figure, or ballot measure), the
            correction you believe should be made, and a source we can use to verify it — such as
            an official government record, a news article, or a campaign filing.
          </p>
        </section>

        <section className="bg-[#1F2937] rounded-2xl p-4 border border-[#374151]">
          <h2 className="text-white text-sm font-semibold mb-2 [font-family:var(--font-syne)]">
            How we review corrections
          </h2>
          <p className="text-[#9CA3AF] text-sm leading-6 [font-family:var(--font-instrument-sans)]">
            Every correction report is reviewed against official sources before any change is
            made. We do not update candidate, voting record, funding, or ballot measure data based
            on an unverified claim alone. If a reported correction is confirmed, we update the
            record and, where applicable, the source link shown in the app.
          </p>
        </section>

        <section className="bg-[#1F2937] rounded-2xl p-4 border border-[#374151]">
          <h2 className="text-white text-sm font-semibold mb-2 [font-family:var(--font-syne)]">
            Community reviews are opinions, not corrections
          </h2>
          <p className="text-[#9CA3AF] text-sm leading-6 [font-family:var(--font-instrument-sans)]">
            Where CivicMarket shows community reviews or ratings from other users, those reflect
            personal opinions, not verified facts. Community reviews are not fact-checked in the
            same way as candidate, voting record, funding, or ballot measure data, and disagreeing
            with a review is not the same as reporting an inaccuracy.
          </p>
        </section>

        <section className="bg-[#1F2937] rounded-2xl p-4 border border-[#374151]">
          <h2 className="text-white text-sm font-semibold mb-2 [font-family:var(--font-syne)]">
            Match scores are not endorsements
          </h2>
          <p className="text-[#9CA3AF] text-sm leading-6 [font-family:var(--font-instrument-sans)]">
            Candidate match scores are algorithmic estimates based on your Civic DNA quiz answers
            and publicly available candidate positions and voting records. They are not
            endorsements, recommendations, or predictions, and they are not eligible for a
            correction report — if you believe the underlying data behind a match score is
            incorrect, report the specific candidate record instead.
          </p>
        </section>

        <section className="bg-[#1F2937] rounded-2xl p-4 border border-[#374151]">
          <h2 className="text-white text-sm font-semibold mb-2 [font-family:var(--font-syne)]">
            Contact
          </h2>
          <p className="text-[#9CA3AF] text-sm leading-6 [font-family:var(--font-instrument-sans)]">
            To report a correction directly, email{' '}
            <a
              href="mailto:inaccuracy@civicmarket.app"
              className="text-[#00C9A7] hover:text-[#00A688] transition-colors"
            >
              inaccuracy@civicmarket.app
            </a>
            .
          </p>
        </section>

        <div className="bg-[#374151]/30 border border-[#374151] rounded-2xl p-4">
          <p className="text-[#6B7280] text-xs leading-5 [font-family:var(--font-instrument-sans)]">
            This is a beta draft. CivicMarket is not a law firm and this document is not legal
            advice. It describes how we handle correction reports in plain language for beta
            participants.
          </p>
        </div>

      </div>
    </div>
  )
}
