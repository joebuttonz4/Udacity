import Link from 'next/link'

export default function PrivacyPage() {
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
          Privacy Policy
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
          This policy governs the closed beta of CivicMarket. It is a draft, not legal advice, and
          will be updated before any public launch. By participating in the beta you acknowledge
          this document may change.
        </p>
      </div>

      <div className="flex flex-col gap-4">

        <section className="bg-[#1F2937] rounded-2xl p-4 border border-[#374151]">
          <h2 className="text-white text-sm font-semibold mb-2 [font-family:var(--font-syne)]">
            Who we are
          </h2>
          <p className="text-[#9CA3AF] text-sm leading-6 [font-family:var(--font-instrument-sans)]">
            CivicMarket is a non-partisan civic information app focused on local elections in
            Port St. Lucie, Florida. We are currently operating a closed, invite-only beta.
            CivicMarket is not affiliated with any candidate, political party, or government
            entity.
          </p>
        </section>

        <section className="bg-[#1F2937] rounded-2xl p-4 border border-[#374151]">
          <h2 className="text-white text-sm font-semibold mb-2 [font-family:var(--font-syne)]">
            What we collect
          </h2>
          <p className="text-[#9CA3AF] text-sm leading-6 [font-family:var(--font-instrument-sans)]">
            When you create an account we collect your email address and a hashed password
            (managed by Supabase Auth — we never see your password in plain text). During
            onboarding we collect your ZIP code and the districts it maps to. If you complete the
            Civic DNA quiz, we store your raw quiz answers and the dimension scores computed from
            them. We also store candidate match scores generated from your quiz results.
          </p>
        </section>

        <section className="bg-[#1F2937] rounded-2xl p-4 border border-[#374151]">
          <h2 className="text-white text-sm font-semibold mb-2 [font-family:var(--font-syne)]">
            How we use your data
          </h2>
          <p className="text-[#9CA3AF] text-sm leading-6 [font-family:var(--font-instrument-sans)]">
            Your ZIP and district are used to show you the races and ballot measures relevant to
            your address. Your quiz answers and dimension scores are used solely to compute your
            Civic DNA profile and candidate match percentages within the app. We do not use your
            data for advertising, political targeting, or any purpose outside of personalizing
            your CivicMarket experience.
          </p>
        </section>

        <section className="bg-[#1F2937] rounded-2xl p-4 border border-[#374151]">
          <h2 className="text-white text-sm font-semibold mb-2 [font-family:var(--font-syne)]">
            What we do not do
          </h2>
          <p className="text-[#9CA3AF] text-sm leading-6 [font-family:var(--font-instrument-sans)]">
            We do not sell, rent, or share your personal information with third parties for
            commercial purposes. We do not share your quiz answers or match scores with
            candidates, campaigns, or political organizations. We do not build advertising
            profiles. We do not use your data to infer your party affiliation or voting intent
            for any external purpose.
          </p>
        </section>

        <section className="bg-[#1F2937] rounded-2xl p-4 border border-[#374151]">
          <h2 className="text-white text-sm font-semibold mb-2 [font-family:var(--font-syne)]">
            Data storage
          </h2>
          <p className="text-[#9CA3AF] text-sm leading-6 [font-family:var(--font-instrument-sans)]">
            Your data is stored in Supabase, a managed database platform hosted in the United
            States. Supabase stores data in encrypted form at rest and in transit. During the
            closed beta, access to the database is restricted to the CivicMarket development
            team. We do not currently offer data residency outside the US.
          </p>
        </section>

        <section className="bg-[#1F2937] rounded-2xl p-4 border border-[#374151]">
          <h2 className="text-white text-sm font-semibold mb-2 [font-family:var(--font-syne)]">
            Your rights
          </h2>
          <p className="text-[#9CA3AF] text-sm leading-6 [font-family:var(--font-instrument-sans)]">
            You may request deletion of your account and associated data at any time by
            contacting us at the email below. During the beta we will fulfill deletion requests
            manually within 14 days. We do not currently offer in-app account deletion.
          </p>
        </section>

        <section className="bg-[#1F2937] rounded-2xl p-4 border border-[#374151]">
          <h2 className="text-white text-sm font-semibold mb-2 [font-family:var(--font-syne)]">
            Contact
          </h2>
          <p className="text-[#9CA3AF] text-sm leading-6 [font-family:var(--font-instrument-sans)]">
            Questions about this policy or your data? Contact information will be provided when
            the beta launches. In the meantime, reach out through your beta invite channel.
          </p>
        </section>

        <section className="bg-[#1F2937] rounded-2xl p-4 border border-[#374151]">
          <h2 className="text-white text-sm font-semibold mb-2 [font-family:var(--font-syne)]">
            Changes to this policy
          </h2>
          <p className="text-[#9CA3AF] text-sm leading-6 [font-family:var(--font-instrument-sans)]">
            We may update this policy before or after the public launch of CivicMarket. Beta
            participants will be notified of material changes by email. Continued use of the app
            after a policy update constitutes acceptance of the revised terms.
          </p>
        </section>

        <div className="bg-[#374151]/30 border border-[#374151] rounded-2xl p-4">
          <p className="text-[#6B7280] text-xs leading-5 [font-family:var(--font-instrument-sans)]">
            This is a beta draft. CivicMarket is not a law firm and this document is not legal
            advice. It describes our current data practices in plain language for beta
            participants.
          </p>
        </div>

      </div>
    </div>
  )
}
