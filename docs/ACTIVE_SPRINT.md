# Active Sprint

## Sprint: Ballot → Measure Profile integration

## Goal

Wire `/ballot` so that measure cards link to `/measures/[id]`, giving users a full read-only Measure Profile from the ballot screen.

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

## Acceptance criteria

- [ ] Measure cards on `/ballot` are wrapped in `<Link href="/measures/[id]">` (same pattern as candidate cards)
- [ ] `/measures/[id]` loads correctly when navigated to from `/ballot`
- [ ] No new Supabase writes, policy changes, or schema changes
- [ ] Mobile-first layout, Tailwind only, no inline styles
- [ ] npm run lint passes (0 errors)
- [ ] npm run build passes

## Do not do in this sprint

- Do not build Vote screen yet
- Do not build Profile screen yet
- Do not build Report Inaccuracy yet
- Do not build Data Sources yet
- Do not build admin tools yet
- Do not build Edge Functions yet
- Do not replace dummy data with real PSL data yet
