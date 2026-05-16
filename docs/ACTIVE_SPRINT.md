# Active Sprint

## Sprint: Build Home screen

## Goal

Build the post-onboarding Home screen — the first screen users see after completing the Civic DNA quiz.

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

## Home screen acceptance criteria

- Loads after onboarding completes (redirect from /ballot or direct nav)
- Shows user's district(s) and upcoming races
- Shows civic feed rows (manual entries, dummy data allowed for beta build)
- Links to /ballot, /candidates/[id], and /profile
- Mobile-first layout, Tailwind only, no inline styles
- npm run build passes

## Do not do in this sprint

- Do not build Measure Profile yet
- Do not build Vote screen yet
- Do not build Report Inaccuracy yet
- Do not build Data Sources yet
- Do not build admin tools yet
- Do not build Edge Functions yet
- Do not replace dummy data with real PSL data yet
