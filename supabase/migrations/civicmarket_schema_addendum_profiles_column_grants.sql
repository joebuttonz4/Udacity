-- ============================================================
-- CIVICMARKET SCHEMA ADDENDUM — PROFILES COLUMN-LEVEL UPDATE GRANTS
--
-- ALREADY RUN manually in the Supabase SQL Editor on 2026-09-13.
-- This file records a change that was made in the dashboard, so schema
-- history is complete. It is not pending work.
--
-- WHY THIS EXISTS
-- Production had column-level UPDATE grants on `profiles` that appear in
-- no migration file — dashboard drift. Four columns the app writes were
-- missing from those grants, so PostgREST rejected any PATCH naming them
-- with 403 Forbidden:
--
--   display_name              (comments, screen 4 — how this was found)
--   top_issues                (onboarding /issues, screen 1)
--   onboarding_completed_at   (onboarding /issues, screen 1)
--   address_validation_source (onboarding /verify, screen 1)
--
-- Row-level security was never the problem. The self-update policy in
-- civicmarket_schema_v4.sql is correct and unchanged. RLS decides WHICH
-- ROW a user may write; column privileges decide WHICH COLUMNS. Only the
-- second was wrong.
--
-- HOW LONG IT WAS BROKEN
-- Silently, since the top_issues migration. Every existing caller
-- console.errors the failure and navigates on regardless
-- (src/app/onboarding/issues/page.tsx, .../zip/page.tsx,
-- .../verify/page.tsx), so three onboarding writes were failing with no
-- visible symptom. src/lib/comments.ts is the first caller that throws,
-- which is the only reason this surfaced.
--
-- Any account that finished onboarding before 2026-09-13 may therefore
-- have NULL top_issues and NULL onboarding_completed_at. The comments
-- INSERT policy requires onboarding_completed_at IS NOT NULL, so those
-- accounts cannot comment until they redo the /issues step or the column
-- is backfilled.
-- ============================================================

-- ============================================================
-- SECTION 1: THE GRANT THAT WAS RUN
--
-- Additive only. There is deliberately no REVOKE here: the pre-existing
-- grant list is not recorded anywhere in this repo, and revoking to a
-- list reconstructed from guesswork would break writes that currently
-- work. Safe to re-run.
-- ============================================================

GRANT UPDATE (
  display_name,
  top_issues,
  onboarding_completed_at,
  address_validation_source
) ON profiles TO authenticated;

-- ============================================================
-- SECTION 2: SUPERSEDED — SEE THE AUTHORITATIVE FILE
--
-- This file records only the delta applied on 2026-09-13. It is kept
-- for history; it is not the current picture and should not be read as
-- one.
--
-- The full column-level privilege state was dumped from production on
-- 2026-09-14 and committed to:
--
--   civicmarket_column_grants_authoritative.sql
--
-- That file is authoritative for every column grant in the public
-- schema, lists the columns that must never be granted and why, and
-- carries the re-dump query. The gap this section used to warn about —
-- privileges existing only in the database — is closed.
-- ============================================================
