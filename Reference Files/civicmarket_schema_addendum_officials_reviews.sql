-- ============================================================
-- CIVICMARKET SCHEMA ADDENDUM — CURRENT OFFICIALS & REVIEW SUMMARIES
-- Run in Supabase SQL Editor after civicmarket_schema_v4.sql is deployed.
-- Adds 2 tables, 1 view, 2 partial indexes, and RLS policies.
-- ============================================================

-- ============================================================
-- SECTION 1: CURRENT OFFICIALS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS current_officials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  office text NOT NULL,
  district_id uuid REFERENCES districts(id) ON DELETE CASCADE,
  jurisdiction_level text NOT NULL, -- city|county|school_board|state|federal
  photo_url text,
  website text,
  bio text,
  term_start date,
  term_end date,
  next_election_date date,
  source_url text NOT NULL,
  source_label text,
  candidate_id uuid REFERENCES candidates(id) ON DELETE SET NULL,
  is_on_next_ballot boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE current_officials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Current officials are publicly readable"
  ON current_officials FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert current officials"
  ON current_officials FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Admins can update current officials"
  ON current_officials FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Admins can delete current officials"
  ON current_officials FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Index to speed up the officials_for_user view join on district_id
CREATE INDEX IF NOT EXISTS current_officials_district_id_idx
  ON current_officials(district_id);

-- ============================================================
-- SECTION 2: REVIEW SUMMARIES TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS review_summaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid REFERENCES candidates(id) ON DELETE CASCADE,
  measure_id uuid REFERENCES ballot_measures(id) ON DELETE CASCADE,
  review_count int NOT NULL DEFAULT 0,
  average_rating numeric(3,2),
  summary_text text,
  positive_themes text[],
  critical_themes text[],
  neutral_themes text[],
  generated_by_model text,
  generated_at timestamptz DEFAULT now(),
  stale_after timestamptz,
  CHECK (
    (candidate_id IS NOT NULL AND measure_id IS NULL)
    OR
    (candidate_id IS NULL AND measure_id IS NOT NULL)
  )
);

ALTER TABLE review_summaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Review summaries are publicly readable"
  ON review_summaries FOR SELECT
  USING (true);

-- review_summaries rows are written only by the summarize-reviews Edge Function
-- using the service role key (bypasses RLS). No browser-side write policy is needed.

-- ============================================================
-- SECTION 3: UNIQUE PARTIAL INDEXES
-- One summary row per candidate; one summary row per measure.
-- ============================================================

CREATE UNIQUE INDEX IF NOT EXISTS review_summaries_candidate_unique
  ON review_summaries(candidate_id)
  WHERE candidate_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS review_summaries_measure_unique
  ON review_summaries(measure_id)
  WHERE measure_id IS NOT NULL;

-- ============================================================
-- SECTION 4: OFFICIALS_FOR_USER VIEW
-- Returns all current officials for every district the signed-in
-- user belongs to. Inherits user_districts RLS (PostgreSQL 15
-- SECURITY INVOKER default), so each caller sees only their own rows.
-- ============================================================

CREATE OR REPLACE VIEW officials_for_user AS
SELECT
  ud.user_id,
  co.id,
  co.name,
  co.office,
  co.district_id,
  d.name AS district_name,
  co.jurisdiction_level,
  co.photo_url,
  co.website,
  co.bio,
  co.term_start,
  co.term_end,
  co.next_election_date,
  co.source_url,
  co.source_label,
  co.candidate_id,
  co.is_on_next_ballot
FROM user_districts ud
JOIN current_officials co ON co.district_id = ud.district_id
JOIN districts d ON d.id = co.district_id;

-- ============================================================
-- DONE
-- Verify with:
--
-- SELECT table_name
-- FROM information_schema.tables
-- WHERE table_schema = 'public'
--   AND table_name IN ('current_officials', 'review_summaries')
-- ORDER BY table_name;
-- -- Expect: 2 rows
--
-- SELECT viewname
-- FROM pg_views
-- WHERE schemaname = 'public'
--   AND viewname = 'officials_for_user';
-- -- Expect: 1 row
--
-- SELECT schemaname, tablename, policyname, cmd
-- FROM pg_policies
-- WHERE tablename IN ('current_officials', 'review_summaries')
-- ORDER BY tablename, policyname;
-- -- Expect: 4 policies on current_officials (SELECT/INSERT/UPDATE/DELETE)
-- -- Expect: 1 policy on review_summaries (SELECT)
-- ============================================================
