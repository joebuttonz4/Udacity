# Active Sprint

## Sprint: Build Profile screen

## Goal

Build the read-only Profile screen so authenticated users can view their Civic DNA results and account details.

## Previously completed

- /onboarding — welcome screen
- /onboarding/signup — email/password signup
- /onboarding/zip — ZIP entry, writes user_districts
- /onboarding/districts — district confirmation
- /onboarding/dna-teaser — take now or skip
- /onboarding/quiz — May 12 questions, raw answers stored as-is
- /onboarding/calculating — computes civic_dna, redirects to /ballot
- /ballot — ballot screen, manually tested May 15 2026
- /candidates/[id] — read-only candidate profile, manually tested May 15 2026
- / (Home) — read-only Home screen, built May 15 2026, commit 48b81f3
- /measures/[id] — read-only Measure Profile, built May 15 2026, commit c84c331
- /ballot → /measures/[id] integration — measure cards link to Measure Profile, built May 15 2026, commit 183b070
- /vote — read-only Vote screen, official links only, built May 15 2026, commit bebed21

## Acceptance criteria

- [ ] Profile screen exists at `/profile`
- [ ] Auth-gated (redirects to `/onboarding` if no session)
- [ ] Displays user's Civic DNA dimension scores
- [ ] Read-only, no Supabase writes beyond what auth already handles
- [ ] No new Supabase policy changes or schema changes
- [ ] Mobile-first layout, Tailwind only, no inline styles
- [ ] npm run lint passes (0 errors)
- [ ] npm run build passes

## Do not do in this sprint

- Do not build Report Inaccuracy yet
- Do not build Data Sources yet
- Do not build admin tools yet
- Do not build Edge Functions yet
- Do not replace dummy data with real PSL data yet
