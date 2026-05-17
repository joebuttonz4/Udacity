# Active Sprint

## Sprint: App Smoke Tests + Real PSL Data Preparation

## Goal

Verify the app is stable after the security grant patch, then replace all dummy PSL data with real, validated candidate, voting record, and funding data before beta invitations go out.

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
- Supabase security grant patch — REVOKE TRUNCATE/TRIGGER/REFERENCES from anon/authenticated on all public tables; revoked INSERT/UPDATE/DELETE where no matching RLS policy existed; verified match_scores SELECT-only, reviews SELECT+INSERT only, profiles.is_admin not browser-writable, RLS enabled on all tables, applied May 17 2026 (manual SQL, no code commit)

## Acceptance criteria

- [ ] Smoke test: onboarding flow (signup through calculating) still works after security patch
- [ ] Smoke test: /ballot, /candidates/[id], /measures/[id], /vote load correctly
- [ ] Smoke test: /admin/entry can still insert a voting record
- [ ] Smoke test: /admin/records lists records and Remove/Confirm delete works
- [ ] Smoke test: /profile, /report, /data-sources load correctly
- [ ] Real PSL candidate data replaces dummy data
- [ ] Real voting records with official source URLs replace dummy records
- [ ] Real funding data with source URLs replaces dummy funding rows
- [ ] All real data validated by admin before beta invitations

## Do not do in this sprint

- Do not build database-backed report submission yet — deferred pending SQL/RLS risk check approval
- Do not build full admin dashboard yet
- Do not build Edge Functions yet
- Do not send beta invitations until all real data is in place and validated

