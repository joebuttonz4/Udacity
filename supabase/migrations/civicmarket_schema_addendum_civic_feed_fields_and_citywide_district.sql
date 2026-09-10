-- ============================================================
-- CIVICMARKET SCHEMA ADDENDUM — CIVIC_FEED MEETING/OUTCOME FIELDS
-- AND CITYWIDE DISTRICT ROW
-- Run in Supabase SQL Editor after civicmarket_schema_v4.sql is deployed.
-- Adds 6 nullable columns to civic_feed and 1 districts row.
-- civic_feed is currently empty, so no backfill is needed.
-- ============================================================

-- ============================================================
-- SECTION 1: CIVIC_FEED — MEETING TIME, LOCATION, OUTCOME FIELDS
-- Per THIS_IS_THE_APP.md screen 3 (item detail): when & where card,
-- and past/outcome state (outcome + roll call + minutes).
-- ============================================================

ALTER TABLE civic_feed
  ADD COLUMN IF NOT EXISTS meeting_time text,
  ADD COLUMN IF NOT EXISTS location text,
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS outcome text,
  ADD COLUMN IF NOT EXISTS outcome_detail text,
  ADD COLUMN IF NOT EXISTS minutes_url text;

-- ============================================================
-- SECTION 2: CITYWIDE DISTRICT ROW
-- For civic_feed items that apply to all of Port St. Lucie
-- (e.g. utility rate changes) rather than one council district.
-- district_id = NULL keeps meaning "unknown." This row is the
-- explicit value for "known to be citywide."
-- ============================================================

INSERT INTO districts (name, type, city, state)
VALUES ('Port St. Lucie (citywide)', 'city', 'Port St. Lucie', 'FL');
