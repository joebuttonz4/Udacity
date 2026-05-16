# Active Sprint

## Sprint: Build Data Sources

## Goal

Build the Data Sources screen so beta users can see where candidate, voting record, and funding data comes from.

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
- /profile — read-only Profile screen, Civic DNA results + account details, built May 16 2026, commit bfe11ac
- /report — UI-only Report Inaccuracy shell, auth-gated, local state only, no Supabase writes, beta message shown on submit, built May 16 2026, commit 6c63b51

## Acceptance criteria

- [ ] Data Sources route exists (e.g. `/data-sources`)
- [ ] Auth-gated (redirects to `/onboarding` if no session)
- [ ] Lists data sources used for candidates, voting records, and funding
- [ ] Read-only, no Supabase writes
- [ ] Mobile-first layout, Tailwind only, no inline styles
- [ ] npm run lint passes (0 errors)
- [ ] npm run build passes

## Do not do in this sprint

- Do not build database-backed report submission yet — deferred pending SQL/RLS risk check approval
- Do not build admin tools yet
- Do not build Edge Functions yet
- Do not replace dummy data with real PSL data yet
