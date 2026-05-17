# Active Sprint

## Sprint: Minimal Admin Review/Removal

## Goal

Build the minimal admin interface so an admin can list existing `voting_records` rows and delete incorrect or test entries. Required before beta — the test row entered during admin entry testing must be removable without direct Supabase access.

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
- /admin/entry — minimal admin voting-record entry form, admin-gated, inserts into voting_records, browser-tested, RLS policy verified, built May 17 2026, commit e24fe14
- /admin/records — read-only admin voting-record review list, admin-gated, no delete, no delete RLS, built May 17 2026, commit 93342f3
- /admin/records (removal) — voting-record removal controls added, two-step confirmation, scored-record guard, DELETE RLS policy verified, TEST ONLY row deleted and confirmed gone, built May 17 2026, commit 31adca9

## Acceptance criteria

- [x] Admin review/removal route exists — `/admin/records`
- [x] Protected — only accessible to users where `profiles.is_admin = true`
- [x] Lists existing `voting_records` rows (candidate name, issue title, vote date, dimension)
- [x] Admin can delete a `voting_records` row — by exact id, DELETE RLS policy in place
- [x] Deletion requires explicit confirmation before executing — two-step: Remove → Confirm delete
- [x] No public-facing UI changes
- [x] Mobile-first layout, Tailwind only, no inline styles
- [x] npm run lint passes (0 errors)
- [x] npm run build passes
- [x] SQL/RLS security review approved before any delete was built — policy verified before code shipped

## Sprint complete

All acceptance criteria met. Next sprint: patch remaining Supabase security risks.

## Do not do in this sprint

- Do not build database-backed report submission yet — deferred pending SQL/RLS risk check approval
- Do not build full admin dashboard yet
- Do not build Edge Functions yet
- Do not replace dummy data with real PSL data yet

