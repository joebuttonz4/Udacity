-- ============================================================
-- CIVICMARKET — AUTHORITATIVE COLUMN-LEVEL GRANTS
--
-- Dumped from production 2026-09-14, plus alert_topics added 2026-09-15
-- (see civicmarket_schema_addendum_feed_topics.sql statement 5). This is
-- the reconciliation file:
-- before it existed, column-level privileges lived only in the database
-- and a fresh environment built from supabase/migrations/ did not match
-- production. That is what caused the silent 403s traced during the
-- screen 4 build (see
-- civicmarket_schema_addendum_profiles_column_grants.sql).
--
-- SCOPE: column-level grants to `authenticated`, for every table in the
-- public schema that has any. Per the dump, exactly three tables do:
-- comments, profiles, reviews. Every other public table relies on
-- table-level privileges alone.
--
-- Each block REVOKEs the table-wide privilege first, then re-grants it
-- per column. Both halves are required: a column grant is meaningless
-- while the table-wide privilege is still held, and the REVOKE is what
-- makes the narrow list actually bind. Running this against production
-- is a no-op because production is already in this state.
--
-- WHEN YOU ADD A COLUMN that users must be able to write, add it here
-- AND run the grant. A column the app writes but this file does not
-- list fails with 403 Forbidden and no other symptom — PostgREST does
-- not say which column was refused, and RLS will look like the culprit.
-- ============================================================

-- ============================================================
-- comments — UPDATE on the hide fields only
--
-- This is the moderation guarantee from screen 4: an admin can hide a
-- comment and can never rewrite its body. Enforced by privilege, not by
-- policy, so no future policy edit can widen it by accident.
--
-- Duplicated from civicmarket_schema_addendum_comments.sql section 3 so
-- that this file alone is a complete picture. Idempotent.
-- ============================================================

REVOKE UPDATE ON comments FROM authenticated;

GRANT UPDATE (
  hidden_at,
  hidden_by,
  hidden_reason
) ON comments TO authenticated;

-- ============================================================
-- profiles — UPDATE on user-owned fields only
--
-- The columns absent from this list are the point of it. Not writable,
-- deliberately:
--
--   is_admin                     privilege escalation — grants the
--                                comment-hide power
--   banned_at, ban_reason,
--   warned_at                    moderation state; a banned user could
--                                unban themselves
--   verification_tier,
--   address_verified,
--   address_validated_at,
--   voter_roll_verified_at,
--   phone_verified_at,
--   phone_number_e164            attestations that a check was
--                                performed. Self-writable, they become
--                                claims the product does not perform
--   civic_points, civic_level    reputation. CIVIC_REPUTATION_SPEC.md
--                                sections 2 and 4 tie both to
--                                adjudicated events, never self-report
--   id, created_at               identity and audit
--
-- OPEN QUESTION — district_id is writable (see the list below).
-- A user can therefore assign themselves a district they do not live
-- in. The Home feed filters on user_districts rather than on
-- profiles.district_id, so this does not currently widen what anyone
-- sees, but it is a self-asserted claim about where someone lives
-- sitting in a column no verification step guards. Pre-existing, not
-- introduced by the grant reconciliation, and deliberately left as-is
-- pending a decision. Do not remove it without checking what reads it.
-- ============================================================

REVOKE UPDATE ON profiles FROM authenticated;

GRANT UPDATE (
  address_validation_source,
  alert_topics,
  display_name,
  district_id,
  dna_nudge_dismissed_at,
  dna_quiz_completed_at,
  dna_quiz_started_at,
  dna_quiz_status,
  last_nudge_shown_at,
  onboarding_completed_at,
  street_address,
  street_name_used,
  top_issues,
  tos_agreed_at,
  tos_version,
  verification_nudge_dismissed_at,
  zip_code,
  zip_district_ambiguous
) ON profiles TO authenticated;

-- ============================================================
-- reviews — INSERT on author-supplied fields only
--
-- A user supplies the review; the system owns everything about how it
-- is weighted, counted, flagged and moderated. Not insertable:
-- helpful_count, verification_tier_at_submission, review_weight,
-- flagged_at, flag_count, flag_reasons, moderation_status,
-- moderated_at. Without this split a user could submit a review
-- pre-loaded with its own helpful count and review weight.
-- ============================================================

REVOKE INSERT ON reviews FROM authenticated;

GRANT INSERT (
  body,
  candidate_id,
  measure_id,
  rating,
  user_id
) ON reviews TO authenticated;

-- ============================================================
-- VERIFY
--
--   SELECT table_name, privilege_type, column_name
--     FROM information_schema.column_privileges
--    WHERE table_schema = 'public'
--      AND grantee = 'authenticated'
--    ORDER BY table_name, privilege_type, column_name;
--
-- Re-dump and update this file whenever a grant changes in the
-- dashboard. A change made there and not recorded here recreates
-- exactly the drift this file exists to end.
-- ============================================================
