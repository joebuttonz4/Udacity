# Active Sprint

## Sprint: Minimal Admin Voting-Record Entry

## Goal

Build the minimal admin interface so an admin can enter a voting record (candidate, issue, vote cast, source URL, dimension) that writes to the `voting_records` table. Required before beta — no beta user should see placeholder voting records.

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
- /data-sources — static Data Sources page, auth-gated, no Supabase reads beyond auth, static methodology content, built May 16 2026, commit b81e8ef

## Acceptance criteria

- [ ] Admin voting-record entry route exists (e.g. `/admin/entry`)
- [ ] Protected — only accessible to users where `profiles.is_admin = true`
- [ ] Form accepts: candidate (select or ID), issue title, issue description, vote date, vote cast (for/against/abstain), dimension, source URL
- [ ] `source_url` is required (enforced in form and schema)
- [ ] Submission writes one row to `voting_records`
- [ ] No public-facing UI changes
- [ ] Mobile-first layout, Tailwind only, no inline styles
- [ ] npm run lint passes (0 errors)
- [ ] npm run build passes
- [ ] SQL/RLS security review approved before any write is built

## Do not do in this sprint

- Do not build database-backed report submission yet — deferred pending SQL/RLS risk check approval
- Do not build full admin dashboard yet
- Do not build Edge Functions yet
- Do not replace dummy data with real PSL data yet
