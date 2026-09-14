-- ============================================================
-- CIVICMARKET SCHEMA ADDENDUM — COMMENTS
-- THIS_IS_THE_APP.md screen 4.
--
-- Run in the Supabase SQL Editor as one block. Idempotent where
-- Postgres allows it; the CREATE POLICY / CREATE TRIGGER statements
-- are guarded so a re-run does not error.
--
-- Beta verification model: the invite code IS the verification.
-- There is no verified-resident tier and none is being built. Anyone
-- who completed onboarding may comment. UI copy says "beta
-- participants", never "verified residents" — we do not claim a check
-- we do not perform.
-- ============================================================

-- ============================================================
-- SECTION 1: TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS comments (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id       uuid NOT NULL REFERENCES civic_feed(id) ON DELETE CASCADE,
  user_id       uuid NOT NULL REFERENCES profiles(id)   ON DELETE CASCADE,

  -- Denormalized on purpose. profiles RLS is USING (auth.uid() = id), so a
  -- join cannot resolve another author's name, and loosening that policy
  -- would expose zip_code, street_address, phone_number_e164 and ban_reason.
  -- Captured at insert time; a later rename does not rewrite old comments.
  author_name   text NOT NULL,

  body          text NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),

  -- Moderation is post-publication. Hiding is reversible and never
  -- destructive: nothing in the app deletes a comment.
  hidden_at     timestamptz,
  hidden_by     uuid REFERENCES profiles(id),
  hidden_reason text,

  CONSTRAINT comments_body_length
    CHECK (char_length(btrim(body)) BETWEEN 2 AND 1000),
  CONSTRAINT comments_author_name_length
    CHECK (char_length(btrim(author_name)) BETWEEN 2 AND 40)
);

CREATE INDEX IF NOT EXISTS comments_item_created_idx
  ON comments (item_id, created_at DESC);

COMMENT ON COLUMN comments.author_name IS
  'Display name captured at insert. Denormalized because profiles RLS forbids reading other users rows.';
COMMENT ON COLUMN comments.hidden_at IS
  'Set by an admin to hide post-publication. Reversible. Hidden comments are invisible to everyone except admins, including their author.';

-- ============================================================
-- SECTION 2: ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Signed-in users read visible comments" ON comments;
DROP POLICY IF EXISTS "Onboarded users insert own comments"   ON comments;
DROP POLICY IF EXISTS "Admins hide comments"                  ON comments;

-- SELECT: signed-in only. Deliberately NOT USING (true) — that would expose
-- every thread to anon. Hidden comments vanish for everyone but an admin.
CREATE POLICY "Signed-in users read visible comments" ON comments
  FOR SELECT TO authenticated
  USING (
    hidden_at IS NULL
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- INSERT: your own row, onboarding finished, not banned. This is the whole
-- gate. The invite code did the verifying.
CREATE POLICY "Onboarded users insert own comments" ON comments
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND onboarding_completed_at IS NOT NULL
        AND banned_at IS NULL
    )
  );

-- UPDATE: admins only. Combined with the column grants in section 3, this can
-- touch nothing but the hide fields. An admin can hide a comment and can never
-- rewrite what someone wrote — enforced by Postgres, not by convention.
CREATE POLICY "Admins hide comments" ON comments
  FOR UPDATE TO authenticated
  USING      (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

-- No DELETE policy exists. Nothing deletes a comment through the app.

-- ============================================================
-- SECTION 3: GRANTS
-- Explicit, because Supabase's default privileges on new public tables are
-- broader than this table should ever allow.
-- ============================================================

REVOKE ALL ON comments FROM anon;
REVOKE ALL ON comments FROM authenticated;

GRANT SELECT, INSERT ON comments TO authenticated;
GRANT UPDATE (hidden_at, hidden_by, hidden_reason) ON comments TO authenticated;

-- ============================================================
-- SECTION 4: RATE LIMIT
-- 1 comment per 30 seconds, 20 per 24 hours, per user.
--
-- A trigger rather than a clause in the INSERT policy: a subquery inside a
-- policy is itself subject to the SELECT policy, so it would not count the
-- user's hidden comments — a blind spot in exactly the abuse case this is
-- meant to catch. SECURITY DEFINER sees every row.
--
-- Safe to omit if you would rather run without it; nothing in the app
-- depends on it existing.
-- ============================================================

CREATE OR REPLACE FUNCTION check_comment_rate_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  recent_count int;
  daily_count  int;
BEGIN
  SELECT count(*) INTO recent_count
    FROM comments
   WHERE user_id = NEW.user_id
     AND created_at > now() - interval '30 seconds';

  IF recent_count > 0 THEN
    RAISE EXCEPTION 'comment_rate_limit' USING ERRCODE = 'P0001';
  END IF;

  SELECT count(*) INTO daily_count
    FROM comments
   WHERE user_id = NEW.user_id
     AND created_at > now() - interval '24 hours';

  IF daily_count >= 20 THEN
    RAISE EXCEPTION 'comment_daily_limit' USING ERRCODE = 'P0001';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION check_comment_rate_limit() FROM PUBLIC;
REVOKE ALL ON FUNCTION check_comment_rate_limit() FROM anon;

DROP TRIGGER IF EXISTS comments_rate_limit ON comments;
CREATE TRIGGER comments_rate_limit
  BEFORE INSERT ON comments
  FOR EACH ROW EXECUTE FUNCTION check_comment_rate_limit();

-- ============================================================
-- DONE
-- Verify with:
--
--   SELECT policyname, cmd FROM pg_policies WHERE tablename = 'comments';
--   SELECT privilege_type, column_name FROM information_schema.column_privileges
--    WHERE table_name = 'comments' AND grantee = 'authenticated';
--
-- Expect 3 policies (SELECT, INSERT, UPDATE) and UPDATE granted on exactly
-- hidden_at, hidden_by, hidden_reason.
-- ============================================================
