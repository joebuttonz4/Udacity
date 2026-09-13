-- ============================================================
-- CIVICMARKET SCHEMA ADDENDUM — CIVIC_FEED MEETING BODY,
-- PUBLIC COMMENT FLAG, AND LONG-FORM DETAIL
-- Per THIS_IS_THE_APP.md screen 3 (item detail).
--
-- ALREADY RUN manually in the Supabase SQL Editor on 2026-09-13,
-- before the screen 3 build. This file exists so schema history is
-- complete, not as pending work. Every statement is idempotent, so
-- re-running it is a safe no-op.
-- ============================================================

ALTER TABLE civic_feed
  ADD COLUMN IF NOT EXISTS meeting_body text,
  ADD COLUMN IF NOT EXISTS public_comment boolean,
  ADD COLUMN IF NOT EXISTS detail text;

-- ============================================================
-- COLUMN SEMANTICS
--
-- meeting_body   Which body decides the item — 'City Council',
--                'County Commission', 'School Board'. civic_feed
--                previously had no way to say this; the Home feed
--                had to stand in with the district name.
--
-- public_comment THREE-STATE, and it must stay that way.
--                true  = public comment is allowed on this item
--                false = it is not
--                NULL  = WE DO NOT KNOW. Not the same as false.
--
--                Screen 3 renders no public-comment row at all when
--                this is NULL, because telling a resident there is
--                no public comment when nobody checked is exactly
--                the kind of confidently-wrong civic claim this
--                project refuses to make (CLAUDE.md: "Prefer missing
--                data over knowingly incorrect civic data").
--
--                DO NOT add a DEFAULT false to this column. A default
--                would silently convert every unknown into a factual
--                assertion that the resident cannot speak.
--
-- detail         Long-form plain-English explanation of the item,
--                shown on screen 3 only. Blank lines separate
--                paragraphs; the app splits on them and renders real
--                <p> elements. Distinct from `description`, which is
--                the short (165-240 char) summary on the feed card.
-- ============================================================

COMMENT ON COLUMN civic_feed.meeting_body IS
  'Deciding body, e.g. City Council. Displayed on the item detail when-and-where card.';

COMMENT ON COLUMN civic_feed.public_comment IS
  'Three-state: true = allowed, false = not allowed, NULL = unknown. NULL renders nothing. Never add a DEFAULT.';

COMMENT ON COLUMN civic_feed.detail IS
  'Long-form plain-English explanation for item detail. Blank lines separate paragraphs. Not the feed-card summary (see description).';
