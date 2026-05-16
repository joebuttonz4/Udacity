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
- / (Home) — read-only Home screen, built May 15 2026, commit 48b81f3

## Home screen acceptance criteria — COMPLETE

- [x] Loads after onboarding completes (redirect from /ballot or direct nav)
- [x] Shows user's district(s) and upcoming races
- [x] Shows civic feed rows (static dummy data)
- [x] Links to /ballot and /candidates/[id]
- [x] Mobile-first layout, Tailwind only, no inline styles
- [x] npm run build passes

## Do not do in this sprint

- Do not build Measure Profile yet
- Do not build Vote screen yet
- Do not build Report Inaccuracy yet
- Do not build Data Sources yet
- Do not build admin tools yet
- Do not build Edge Functions yet
- Do not replace dummy data with real PSL data yet
