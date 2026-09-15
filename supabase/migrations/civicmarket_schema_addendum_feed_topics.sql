-- ============================================================
-- CIVICMARKET SCHEMA ADDENDUM — FEED TOPICS VOCABULARY
--
-- Decided 2026-09-15. The files/VISION.md feed-tagging trigger fired:
-- feed topics are now their own vocabulary, separate from the eight
-- Civic DNA categories.
--
-- WHY THE SPLIT
-- The Civic DNA categories were designed to score candidates — each maps
-- to a power the office controls, so the score predicts how a person
-- would govern. Feed items are about what is being decided, which is a
-- different axis. Parks and recreation, code enforcement, and litigation
-- had no honest home among the eight.
--
-- THE TWO PROFILE FIELDS ARE NOT INTERCHANGEABLE
--   profiles.alert_topics  feed topic keys, picked in onboarding, used
--                          by Alerts
--   profiles.top_issues    Civic DNA keys, used only for match
--                          weighting, set after the quiz
-- The topic -> DNA mapping in src/lib/topics.ts is used only to pre-fill
-- the post-quiz weighting picker. It is not a data migration path: the
-- mapping is many-to-one, so it does not invert cleanly
-- (infrastructure_traffic is reachable from both roads_traffic and
-- water_sewer_drainage).
--
-- NO BACKFILL. Accounts that onboarded before this keep
-- alert_topics = NULL, which Alerts reads as "never asked" and answers
-- with a pick-topics empty state.
--
-- Run in the Supabase SQL Editor, one statement at a time, in order.
-- The VERIFY section at the bottom is run afterwards.
-- ============================================================

-- ============================================================
-- SECTION 1: DDL — seven statements, each runnable on its own
-- ============================================================

-- 1
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS alert_topics text[];

-- 2
-- NOT NULL DEFAULT '{}': an item with no topics is a real, expected
-- state, not an unknown. It appears in the feed and never triggers an
-- alert. That is different from profiles.alert_topics, where empty and
-- unknown genuinely differ — see statement 6.
ALTER TABLE civic_feed
  ADD COLUMN IF NOT EXISTS topics text[] NOT NULL DEFAULT '{}'::text[];

-- 3
-- alert_topics stays nullable, so the NULL branch is required here.
-- No cardinality cap: how many topics a user may follow is a UI
-- decision, not a storage one.
ALTER TABLE profiles ADD CONSTRAINT profiles_alert_topics_valid CHECK (
  alert_topics IS NULL OR alert_topics <@ ARRAY[
    'development_zoning','roads_traffic','water_sewer_drainage',
    'police_emergency','taxes_fees_budget','environment_open_space',
    'business_jobs','parks_recreation','neighborhood_rules'
  ]::text[]
);

-- 4
-- No NULL branch: topics is NOT NULL. '{}' satisfies this — the empty
-- array is contained by every array, and cardinality 0 <= 2.
--
-- The topics[1] <> topics[2] clause blocks ARRAY['roads_traffic',
-- 'roads_traffic'], which would otherwise pass a bare cardinality check
-- as "two topics" while being one. A DISTINCT subquery is not permitted
-- inside a CHECK, so the pairwise form is how this is expressed at a
-- maximum of two.
ALTER TABLE civic_feed ADD CONSTRAINT civic_feed_topics_valid CHECK (
  cardinality(topics) <= 2
  AND (cardinality(topics) < 2 OR topics[1] <> topics[2])
  AND topics <@ ARRAY[
    'development_zoning','roads_traffic','water_sewer_drainage',
    'police_emergency','taxes_fees_budget','environment_open_space',
    'business_jobs','parks_recreation','neighborhood_rules'
  ]::text[]
);

-- 5
-- MANDATORY, and the reason this file exists in the order it does.
-- UPDATE on profiles is revoked table-wide and re-granted per column
-- (civicmarket_column_grants_authoritative.sql), so a new column is NOT
-- writable until it is named here. On 2026-09-14 exactly this omission
-- made onboarding writes fail silently for weeks: PostgREST answers 403
-- without naming the column, and RLS looks like the culprit.
--
-- SELECT needs no equivalent statement. SELECT is granted table-wide on
-- both tables, and a table-level grant automatically covers columns
-- added later. Verification (b) and (c) confirm this rather than
-- assuming it.
GRANT UPDATE (alert_topics) ON profiles TO authenticated;

-- 6
COMMENT ON COLUMN profiles.alert_topics IS
  'Feed topic keys for alerts. NULL = never asked. {} = asked, chose none. These are different states — never add a DEFAULT, which would convert every never-asked user into a deliberate empty choice and erase the Alerts empty state.';

-- 7
COMMENT ON COLUMN civic_feed.topics IS
  'Feed topics, 0 to 2, from the 9 keys in src/lib/topics.ts. A separate vocabulary from the Civic DNA keys in civic_feed.dimensions. 0 topics = appears in the feed, never triggers an alert.';

-- ============================================================
-- SECTION 2: VERIFY
--
-- Run after the DDL, one statement at a time.
-- (a) through (e) are read-only.
-- (f) IS THE ONLY STATEMENT IN THIS SECTION THAT ATTEMPTS A WRITE.
-- ============================================================

-- (a) Both CHECK constraints exist.
--     Correct: exactly 2 rows, one per table, each definition listing
--     all nine keys. Fewer than 2 means a statement did not run.
SELECT conrelid::regclass AS table_name, conname, pg_get_constraintdef(oid)
  FROM pg_constraint
 WHERE contype = 'c'
   AND conname IN ('profiles_alert_topics_valid','civic_feed_topics_valid');

-- (b) alert_topics is writable and readable.
--     Correct: can_update = true, can_select = true.
--     can_update = false is the 2026-09-14 failure exactly — onboarding
--     will appear to succeed and write nothing.
SELECT has_column_privilege('authenticated', 'public.profiles', 'alert_topics', 'UPDATE') AS can_update,
       has_column_privilege('authenticated', 'public.profiles', 'alert_topics', 'SELECT') AS can_select;

-- (c) topics is readable.
--     Correct: can_select = true, inherited from the table-level grant.
--     If false, SELECT is per-column after all and these two statements
--     are required, each run on its own:
--       GRANT SELECT (alert_topics) ON profiles TO authenticated;
--       GRANT SELECT (topics) ON civic_feed TO authenticated;
SELECT has_column_privilege('authenticated', 'public.civic_feed', 'topics', 'SELECT') AS can_select;

-- (d) Column shape is right.
--     Correct: civic_feed.topics  is_nullable = NO,
--                                 column_default = '{}'::text[]
--              profiles.alert_topics  is_nullable = YES,
--                                     column_default = NULL
--     A non-null default on alert_topics means the never-asked state is
--     gone and the Alerts empty state is broken.
SELECT table_name, column_name, is_nullable, column_default
  FROM information_schema.columns
 WHERE table_schema = 'public'
   AND (table_name, column_name) IN (('profiles','alert_topics'),('civic_feed','topics'));

-- (e) Existing rows satisfy the new constraint.
--     Correct: 3 rows, every topics value {}. This is also the worklist
--     — tagging these is the next content task.
SELECT id, title, topics FROM civic_feed ORDER BY generated_at;

-- (f) *** THE ONLY WRITE IN THIS SECTION. ***
--     Negative test: the constraint must reject an invalid key.
--     Correct: ERROR, new row violates check constraint
--              "civic_feed_topics_valid". Nothing changes.
--     If it SUCCEEDS instead, the constraint is missing — statement 4
--     did not run. Recover by running the line under RECOVERY below on
--     its own, then re-run statement 4.
UPDATE civic_feed SET topics = ARRAY['not_a_topic']::text[] WHERE id = '821fff51-9ed4-46a5-811e-cb4be114eb54';

-- RECOVERY — run alone, and only if (f) unexpectedly succeeded.
-- UPDATE civic_feed SET topics = '{}'::text[] WHERE id = '821fff51-9ed4-46a5-811e-cb4be114eb54';

-- ============================================================
-- KEEPING THIS FILE AND THE CODE IN SYNC
--
-- The nine keys live in src/lib/topics.ts as the single source of truth
-- for code. src/lib/__tests__/topics.test.ts reads THIS FILE as text and
-- fails if the two key lists disagree in either direction, so adding a
-- tenth topic in TypeScript without updating this migration breaks the
-- build rather than failing silently in production.
-- ============================================================
