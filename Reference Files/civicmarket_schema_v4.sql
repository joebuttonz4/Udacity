-- ============================================================
-- CivicMarket Schema v4 — Authoritative
-- Deploy this entire file in Supabase SQL Editor
-- All tables have RLS enabled
-- ============================================================

-- ============================================================
-- SECTION 1: CORE TABLES
-- ============================================================

-- Districts — geographic voting areas
CREATE TABLE IF NOT EXISTS districts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL, -- city_council|school_board|county|state
  city text NOT NULL,
  state text NOT NULL
);

ALTER TABLE districts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Districts are publicly readable" ON districts FOR SELECT USING (true);

-- Elections — specific election events
CREATE TABLE IF NOT EXISTS elections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  election_date date NOT NULL,
  district_id uuid REFERENCES districts(id) ON DELETE CASCADE
);

ALTER TABLE elections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Elections are publicly readable" ON elections FOR SELECT USING (true);

-- Profiles — extends auth.users, one row per user
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  zip_code text,
  street_address text,
  street_name_used text,
  zip_district_ambiguous boolean DEFAULT false,
  district_id uuid REFERENCES districts(id),
  verification_tier smallint DEFAULT 0,
  phone_verified_at timestamptz,
  phone_number_e164 text,
  address_validated_at timestamptz,
  address_validation_source text,
  voter_roll_verified_at timestamptz,
  address_verified boolean DEFAULT false,
  civic_level text DEFAULT 'voter',
  civic_points int DEFAULT 0,
  dna_quiz_status text DEFAULT 'not_started',
  dna_quiz_started_at timestamptz,
  dna_quiz_completed_at timestamptz,
  dna_nudge_dismissed_at timestamptz,
  verification_nudge_dismissed_at timestamptz,
  last_nudge_shown_at timestamptz,
  tos_agreed_at timestamptz,
  tos_version text,
  is_admin boolean DEFAULT false,
  banned_at timestamptz,
  ban_reason text,
  warned_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO profiles (id, display_name)
  VALUES (new.id, new.raw_user_meta_data->>'full_name');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- User Districts — all districts a user belongs to
CREATE TABLE IF NOT EXISTS user_districts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  district_id uuid REFERENCES districts(id) ON DELETE CASCADE,
  scope text NOT NULL, -- city|county|state
  ocd_id text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, district_id)
);

ALTER TABLE user_districts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own districts" ON user_districts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own districts" ON user_districts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own districts" ON user_districts FOR DELETE USING (auth.uid() = user_id);

-- Civic DNA — computed dimension averages
CREATE TABLE IF NOT EXISTS civic_dna (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  growth_development numeric(4,2),
  taxation_spending numeric(4,2),
  education numeric(4,2),
  environment numeric(4,2),
  public_safety numeric(4,2),
  housing numeric(4,2),
  transparency numeric(4,2),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE civic_dna ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own DNA" ON civic_dna FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own DNA" ON civic_dna FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Civic DNA Answers — raw quiz answers
CREATE TABLE IF NOT EXISTS civic_dna_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  question_number smallint NOT NULL,
  dimension text NOT NULL,
  answer smallint NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE civic_dna_answers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own answers" ON civic_dna_answers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own answers" ON civic_dna_answers FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- SECTION 2: CANDIDATE & MEASURE TABLES
-- ============================================================

-- Candidates
CREATE TABLE IF NOT EXISTS candidates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  office text NOT NULL,
  district_id uuid REFERENCES districts(id) ON DELETE CASCADE,
  election_id uuid REFERENCES elections(id) ON DELETE CASCADE,
  photo_url text,
  bio text,
  website text,
  is_incumbent boolean DEFAULT false,
  appeared_on_ballot boolean DEFAULT true,
  archived_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Candidates are publicly readable" ON candidates FOR SELECT USING (true);

-- Ballot Measures
CREATE TABLE IF NOT EXISTS ballot_measures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  plain_english_summary text,
  full_text_url text,
  district_id uuid REFERENCES districts(id) ON DELETE CASCADE,
  election_id uuid REFERENCES elections(id) ON DELETE CASCADE,
  type text NOT NULL, -- bond|ordinance|zoning|referendum
  archived_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE ballot_measures ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Measures are publicly readable" ON ballot_measures FOR SELECT USING (true);

-- Candidate Funding
CREATE TABLE IF NOT EXISTS candidate_funding (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid REFERENCES candidates(id) ON DELETE CASCADE,
  total_raised numeric(12,2),
  neighbor_donations numeric(12,2),
  pac_corporate_funds numeric(12,2),
  institutional_pct numeric(5,2) GENERATED ALWAYS AS (
    CASE WHEN total_raised > 0
    THEN ROUND((pac_corporate_funds / total_raised) * 100, 2)
    ELSE 0 END
  ) STORED,
  source_url text,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE candidate_funding ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Funding is publicly readable" ON candidate_funding FOR SELECT USING (true);

-- ============================================================
-- SECTION 3: SCORING TABLES
-- ============================================================

-- Voting Records
CREATE TABLE IF NOT EXISTS voting_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid REFERENCES candidates(id) ON DELETE CASCADE,
  issue_title text NOT NULL,
  issue_description text NOT NULL,
  bill_number text,
  vote_date date NOT NULL,
  source_url text NOT NULL,
  vote_cast text NOT NULL, -- for|against|abstain
  dimension text NOT NULL,
  ai_draft_score smallint,
  ai_draft_rationale text,
  ai_draft_generated_at timestamptz,
  ai_draft_model text,
  community_score_count int DEFAULT 0,
  community_score_final numeric(4,2),
  community_score_locked_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE voting_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Voting records are publicly readable" ON voting_records FOR SELECT USING (true);

-- Vote Community Scores
CREATE TABLE IF NOT EXISTS vote_community_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  voting_record_id uuid REFERENCES voting_records(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  score smallint NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(voting_record_id, user_id)
);

ALTER TABLE vote_community_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read community scores" ON vote_community_scores FOR SELECT USING (true);
CREATE POLICY "Users can insert own scores" ON vote_community_scores FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Candidate Positions — computed weighted positions
CREATE TABLE IF NOT EXISTS candidate_positions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid REFERENCES candidates(id) ON DELETE CASCADE,
  growth_development numeric(4,2),
  taxation_spending numeric(4,2),
  education numeric(4,2),
  environment numeric(4,2),
  public_safety numeric(4,2),
  housing numeric(4,2),
  transparency numeric(4,2),
  vote_count int DEFAULT 0,
  community_score_count int DEFAULT 0,
  has_dna_score boolean DEFAULT false,
  data_completeness text DEFAULT 'pulse_only', -- full|partial|pulse_only
  voting_weight numeric(3,2) DEFAULT 0.70,
  sentiment_weight numeric(3,2) DEFAULT 0.30,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(candidate_id)
);

ALTER TABLE candidate_positions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Positions are publicly readable" ON candidate_positions FOR SELECT USING (true);

-- Sentiment Scores
CREATE TABLE IF NOT EXISTS sentiment_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid REFERENCES candidates(id) ON DELETE CASCADE,
  dimension text NOT NULL,
  score numeric(4,2),
  review_count int DEFAULT 0,
  verified_review_count int DEFAULT 0,
  avg_rating numeric(3,2),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(candidate_id, dimension)
);

ALTER TABLE sentiment_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Sentiment scores are publicly readable" ON sentiment_scores FOR SELECT USING (true);

-- Measure Dimensions
CREATE TABLE IF NOT EXISTS measure_dimensions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  measure_id uuid REFERENCES ballot_measures(id) ON DELETE CASCADE,
  growth_development smallint,
  taxation_spending smallint,
  education smallint,
  environment smallint,
  public_safety smallint,
  housing smallint,
  transparency smallint,
  scored_by text DEFAULT 'ai_draft',
  ai_draft_generated_at timestamptz,
  community_score_count int DEFAULT 0,
  impact_summary text,
  UNIQUE(measure_id)
);

ALTER TABLE measure_dimensions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Measure dimensions are publicly readable" ON measure_dimensions FOR SELECT USING (true);

-- Measure Community Scores
CREATE TABLE IF NOT EXISTS measure_community_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  measure_id uuid REFERENCES ballot_measures(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  dimension text NOT NULL,
  score smallint NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(measure_id, user_id, dimension)
);

ALTER TABLE measure_community_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read measure scores" ON measure_community_scores FOR SELECT USING (true);
CREATE POLICY "Users can insert own measure scores" ON measure_community_scores FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Match Scores
CREATE TABLE IF NOT EXISTS match_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  candidate_id uuid REFERENCES candidates(id) ON DELETE CASCADE,
  measure_id uuid REFERENCES ballot_measures(id) ON DELETE CASCADE,
  score smallint NOT NULL,
  rationale text,
  computed_at timestamptz DEFAULT now(),
  UNIQUE(user_id, candidate_id, measure_id)
);

ALTER TABLE match_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own match scores" ON match_scores FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own match scores" ON match_scores FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own match scores" ON match_scores FOR UPDATE USING (auth.uid() = user_id);

-- ============================================================
-- SECTION 4: COMMUNITY TABLES
-- ============================================================

-- Reviews
CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  candidate_id uuid REFERENCES candidates(id) ON DELETE CASCADE,
  measure_id uuid REFERENCES ballot_measures(id) ON DELETE CASCADE,
  rating smallint NOT NULL,
  body text,
  helpful_count int DEFAULT 0,
  verification_tier_at_submission smallint DEFAULT 0,
  review_weight numeric(3,2) DEFAULT 0.00,
  flagged_at timestamptz,
  flag_count int DEFAULT 0,
  flag_reasons text[],
  moderation_status text DEFAULT 'active',
  moderated_at timestamptz,
  moderated_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, candidate_id, measure_id)
);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Active reviews are publicly readable" ON reviews FOR SELECT USING (moderation_status = 'active');
CREATE POLICY "Users can insert own reviews" ON reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own reviews" ON reviews FOR UPDATE USING (auth.uid() = user_id);

-- Trust Scores
CREATE TABLE IF NOT EXISTS trust_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  score numeric(5,2) DEFAULT 50.00,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE trust_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own trust score" ON trust_scores FOR SELECT USING (auth.uid() = user_id);

-- Trust Score Events
CREATE TABLE IF NOT EXISTS trust_score_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  delta numeric(5,2) NOT NULL,
  resulting_score numeric(5,2) NOT NULL,
  reference_id uuid,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE trust_score_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own trust events" ON trust_score_events FOR SELECT USING (auth.uid() = user_id);

-- Civic Points Events
CREATE TABLE IF NOT EXISTS civic_points_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  points_delta int NOT NULL,
  resulting_points int NOT NULL,
  reference_id uuid,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE civic_points_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own points events" ON civic_points_events FOR SELECT USING (auth.uid() = user_id);

-- ============================================================
-- SECTION 5: SOCIAL TABLES
-- ============================================================

-- Follows
CREATE TABLE IF NOT EXISTS follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  candidate_id uuid REFERENCES candidates(id) ON DELETE CASCADE,
  followed_at timestamptz DEFAULT now(),
  is_auto_followed boolean DEFAULT false,
  UNIQUE(user_id, candidate_id)
);

ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own follows" ON follows FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own follows" ON follows FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own follows" ON follows FOR DELETE USING (auth.uid() = user_id);

-- Record Watch
CREATE TABLE IF NOT EXISTS record_watch (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  candidate_id uuid REFERENCES candidates(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  notified_at timestamptz,
  UNIQUE(user_id, candidate_id)
);

ALTER TABLE record_watch ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own watches" ON record_watch FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own watches" ON record_watch FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own watches" ON record_watch FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- SECTION 6: AGENT & FEED TABLES
-- ============================================================

-- Agent Staging
CREATE TABLE IF NOT EXISTS agent_staging (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_name text NOT NULL,
  target_table text NOT NULL,
  payload jsonb NOT NULL,
  source_url text NOT NULL,
  confidence numeric(3,2),
  confidence_reasons text[],
  status text DEFAULT 'pending', -- pending|approved|rejected|auto_committed
  reviewed_by uuid REFERENCES profiles(id),
  reviewed_at timestamptz,
  auto_committed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE agent_staging ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can read staging" ON agent_staging FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);

-- Agent Runs
CREATE TABLE IF NOT EXISTS agent_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_name text NOT NULL,
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  status text DEFAULT 'running', -- running|completed|failed
  records_processed int DEFAULT 0,
  records_staged int DEFAULT 0,
  records_auto_committed int DEFAULT 0,
  error_message text,
  error_detail jsonb
);

ALTER TABLE agent_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can read agent runs" ON agent_runs FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);

-- Civic Feed
CREATE TABLE IF NOT EXISTS civic_feed (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  source_url text,
  meeting_date date,
  dimensions text[],
  urgency text DEFAULT 'routine', -- routine|significant|major
  district_id uuid REFERENCES districts(id) ON DELETE CASCADE,
  generated_at timestamptz DEFAULT now(),
  expires_at timestamptz
);

ALTER TABLE civic_feed ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Civic feed is publicly readable" ON civic_feed FOR SELECT USING (true);

-- Monitored Sources
CREATE TABLE IF NOT EXISTS monitored_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  district_id uuid REFERENCES districts(id) ON DELETE CASCADE,
  source_type text NOT NULL, -- city_agenda|county_agenda|state_legislature|campaign_finance
  source_url text NOT NULL,
  scrape_schedule text,
  last_scraped_at timestamptz,
  is_active boolean DEFAULT true,
  agent_name text,
  notes text
);

ALTER TABLE monitored_sources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can read monitored sources" ON monitored_sources FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);

-- App Settings
CREATE TABLE IF NOT EXISTS app_settings (
  key text PRIMARY KEY,
  value text NOT NULL,
  description text,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "App settings are publicly readable" ON app_settings FOR SELECT USING (true);
CREATE POLICY "Admins can update settings" ON app_settings FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);

-- ============================================================
-- SECTION 7: KEY VIEW
-- ============================================================

CREATE OR REPLACE VIEW ballot_for_user AS
SELECT
  ud.user_id,
  'candidate' AS item_type,
  c.id AS item_id,
  c.name AS item_name,
  c.office AS item_sub,
  ud.scope,
  e.election_date,
  e.name AS election_name,
  c.is_incumbent,
  COALESCE(cp.has_dna_score, false) AS has_dna_score,
  COALESCE(cp.data_completeness, 'pulse_only') AS data_completeness
FROM user_districts ud
JOIN candidates c ON c.district_id = ud.district_id
JOIN elections e ON e.id = c.election_id
LEFT JOIN candidate_positions cp ON cp.candidate_id = c.id
WHERE e.election_date >= CURRENT_DATE
  AND c.archived_at IS NULL

UNION ALL

SELECT
  ud.user_id,
  'measure' AS item_type,
  bm.id AS item_id,
  bm.title AS item_name,
  bm.type AS item_sub,
  ud.scope,
  e.election_date,
  e.name AS election_name,
  false AS is_incumbent,
  false AS has_dna_score,
  'pulse_only' AS data_completeness
FROM user_districts ud
JOIN ballot_measures bm ON bm.district_id = ud.district_id
JOIN elections e ON e.id = bm.election_id
WHERE e.election_date >= CURRENT_DATE
  AND bm.archived_at IS NULL;

-- ============================================================
-- SECTION 8: KEY FUNCTIONS
-- ============================================================

-- Recompute candidate positions after scoring changes
CREATE OR REPLACE FUNCTION recompute_candidate_positions(p_candidate_id uuid)
RETURNS void AS $$
DECLARE
  v_vote_count int;
  v_growth numeric(4,2) := 0;
  v_taxation numeric(4,2) := 0;
  v_education numeric(4,2) := 0;
  v_environment numeric(4,2) := 0;
  v_public_safety numeric(4,2) := 0;
  v_housing numeric(4,2) := 0;
  v_transparency numeric(4,2) := 0;
BEGIN
  -- Count votes
  SELECT COUNT(*) INTO v_vote_count
  FROM voting_records WHERE candidate_id = p_candidate_id;

  -- Compute average score per dimension using community_score_final if available
  SELECT
    AVG(CASE WHEN dimension = 'growth_development' THEN COALESCE(community_score_final, ai_draft_score) END),
    AVG(CASE WHEN dimension = 'taxation_spending' THEN COALESCE(community_score_final, ai_draft_score) END),
    AVG(CASE WHEN dimension = 'education' THEN COALESCE(community_score_final, ai_draft_score) END),
    AVG(CASE WHEN dimension = 'environment' THEN COALESCE(community_score_final, ai_draft_score) END),
    AVG(CASE WHEN dimension = 'public_safety' THEN COALESCE(community_score_final, ai_draft_score) END),
    AVG(CASE WHEN dimension = 'housing' THEN COALESCE(community_score_final, ai_draft_score) END),
    AVG(CASE WHEN dimension = 'transparency' THEN COALESCE(community_score_final, ai_draft_score) END)
  INTO v_growth, v_taxation, v_education, v_environment, v_public_safety, v_housing, v_transparency
  FROM voting_records
  WHERE candidate_id = p_candidate_id
    AND (ai_draft_score IS NOT NULL OR community_score_final IS NOT NULL);

  -- Upsert candidate_positions
  INSERT INTO candidate_positions (
    candidate_id, growth_development, taxation_spending, education,
    environment, public_safety, housing, transparency,
    vote_count, has_dna_score, data_completeness, updated_at
  ) VALUES (
    p_candidate_id, v_growth, v_taxation, v_education,
    v_environment, v_public_safety, v_housing, v_transparency,
    v_vote_count,
    v_vote_count > 0,
    CASE WHEN v_vote_count >= 5 THEN 'full'
         WHEN v_vote_count > 0 THEN 'partial'
         ELSE 'pulse_only' END,
    now()
  )
  ON CONFLICT (candidate_id) DO UPDATE SET
    growth_development = EXCLUDED.growth_development,
    taxation_spending = EXCLUDED.taxation_spending,
    education = EXCLUDED.education,
    environment = EXCLUDED.environment,
    public_safety = EXCLUDED.public_safety,
    housing = EXCLUDED.housing,
    transparency = EXCLUDED.transparency,
    vote_count = EXCLUDED.vote_count,
    has_dna_score = EXCLUDED.has_dna_score,
    data_completeness = EXCLUDED.data_completeness,
    updated_at = EXCLUDED.updated_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check community score threshold and lock if met
CREATE OR REPLACE FUNCTION check_community_score_threshold()
RETURNS trigger AS $$
DECLARE
  v_threshold int;
  v_min_tier int;
  v_count int;
  v_avg numeric(4,2);
BEGIN
  -- Read threshold from app_settings
  SELECT value::int INTO v_threshold FROM app_settings WHERE key = 'community_score_threshold';
  SELECT value::int INTO v_min_tier FROM app_settings WHERE key = 'community_score_min_tier';

  -- Count qualifying scores
  SELECT COUNT(*), AVG(vcs.score)
  INTO v_count, v_avg
  FROM vote_community_scores vcs
  JOIN profiles p ON p.id = vcs.user_id
  WHERE vcs.voting_record_id = NEW.voting_record_id
    AND p.verification_tier >= v_min_tier;

  -- Lock if threshold met
  IF v_count >= v_threshold THEN
    UPDATE voting_records SET
      community_score_final = v_avg,
      community_score_locked_at = now(),
      community_score_count = v_count
    WHERE id = NEW.voting_record_id;

    -- Recompute positions
    PERFORM recompute_candidate_positions(
      (SELECT candidate_id FROM voting_records WHERE id = NEW.voting_record_id)
    );
  ELSE
    UPDATE voting_records SET
      community_score_count = v_count
    WHERE id = NEW.voting_record_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_community_score_inserted ON vote_community_scores;
CREATE TRIGGER on_community_score_inserted
  AFTER INSERT ON vote_community_scores
  FOR EACH ROW EXECUTE FUNCTION check_community_score_threshold();

-- ============================================================
-- SECTION 9: SEED APP SETTINGS
-- ============================================================

INSERT INTO app_settings (key, value, description) VALUES
  ('community_score_threshold', '5', 'Verified scores needed to retire AI draft'),
  ('community_score_min_tier', '1', 'Minimum verification tier for threshold'),
  ('dna_nudge_delay_hours', '48', 'Hours after signup before DNA nudge shows'),
  ('election_alert_days_before', '30', 'Days before election for proximity alert'),
  ('election_mode_days_threshold', '60', 'Days before election to switch home screen mode'),
  ('max_community_scores_per_day', 'unlimited', 'Rate limiting — revisit post-beta')
ON CONFLICT (key) DO NOTHING;

-- ============================================================
-- DONE
-- Run this verification query after deploying:
-- SELECT table_name FROM information_schema.tables
-- WHERE table_schema = 'public' ORDER BY table_name;
-- You should see 25 tables.
-- ============================================================
