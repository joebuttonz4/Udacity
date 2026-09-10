-- ============================================================
-- CIVICMARKET SCHEMA ADDENDUM — ONBOARDING TOP ISSUES
-- Run in Supabase SQL Editor after civicmarket_schema_v4.sql is deployed.
-- Adds 2 nullable columns to profiles.
-- ============================================================

-- ============================================================
-- SECTION 1: PROFILES — TOP ISSUES AND ONBOARDING COMPLETION
-- Per THIS_IS_THE_APP.md screen 1 step 6: user picks up to 3
-- issues from the 8 locked civic_feed category keys. These drive
-- "why you're seeing this" (screen 3) and alert targeting
-- (screen 7), and are separate from the Civic DNA quiz's own
-- 7-key dimension set (see CIVICMARKET_CURRENT_STATE.md).
-- ============================================================

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS top_issues text[],
  ADD COLUMN IF NOT EXISTS onboarding_completed_at timestamptz;
