// Comments data layer — THIS_IS_THE_APP.md screen 4.
//
// Beta verification model: the invite code IS the verification. There is no
// verified-resident tier. Anyone who finished onboarding may comment, which is
// enforced by the INSERT policy, not by the client. Copy says "beta
// participants", never "verified residents".

import { supabase } from '@/lib/supabase';

export const BODY_MAX = 1000;
export const BODY_MIN = 2;
export const NAME_MAX = 40;
export const NAME_MIN = 2;
/** Show the character counter only once it starts to matter. */
export const BODY_COUNTER_FROM = 800;

export type Comment = {
  id: string;
  item_id: string;
  user_id: string;
  author_name: string;
  body: string;
  created_at: string;
  hidden_at: string | null;
};

export type CommenterProfile = {
  displayName: string | null;
  isAdmin: boolean;
  onboarded: boolean;
};

const COMMENT_COLUMNS = 'id, item_id, user_id, author_name, body, created_at, hidden_at';

export async function getComments(itemId: string): Promise<Comment[]> {
  const { data, error } = await supabase
    .from('comments')
    .select(COMMENT_COLUMNS)
    .eq('item_id', itemId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as Comment[];
}

/** Own profile row only — which is all profiles RLS permits, and all we need. */
export async function getCommenterProfile(userId: string): Promise<CommenterProfile> {
  const { data, error } = await supabase
    .from('profiles')
    .select('display_name, is_admin, onboarding_completed_at')
    .eq('id', userId)
    .maybeSingle();

  if (error) throw error;

  return {
    displayName: data?.display_name ?? null,
    isAdmin: data?.is_admin === true,
    onboarded: !!data?.onboarding_completed_at,
  };
}

export async function saveDisplayName(userId: string, name: string): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ display_name: name.trim() })
    .eq('id', userId);

  if (error) throw error;
}

/**
 * Insert and return the server row.
 *
 * Not optimistic: the client cannot know `id` or `created_at`, the rate-limit
 * trigger can legitimately reject, and a comment that appears and then vanishes
 * reads as data loss. The cost is one short spinner.
 */
export async function postComment(input: {
  itemId: string;
  userId: string;
  authorName: string;
  body: string;
}): Promise<Comment> {
  const { data, error } = await supabase
    .from('comments')
    .insert({
      item_id: input.itemId,
      user_id: input.userId,
      author_name: input.authorName.trim(),
      body: input.body.trim(),
    })
    .select(COMMENT_COLUMNS)
    .single();

  if (error) throw error;
  return data as Comment;
}

/** Admin-only. The column grant means this can set nothing but the hide
 *  fields — an admin can hide a comment and can never edit its body. */
export async function setCommentHidden(
  commentId: string,
  adminUserId: string,
  hidden: boolean,
): Promise<void> {
  const { error } = await supabase
    .from('comments')
    .update(
      hidden
        ? { hidden_at: new Date().toISOString(), hidden_by: adminUserId }
        : { hidden_at: null, hidden_by: null, hidden_reason: null },
    )
    .eq('id', commentId);

  if (error) throw error;
}

// ---------- error mapping ----------

function errorText(err: unknown): string {
  if (err && typeof err === 'object' && 'message' in err) {
    return String((err as { message: unknown }).message ?? '');
  }
  return err instanceof Error ? err.message : '';
}

/** Postgres errors are not user-facing copy. Map the ones we raise on purpose. */
export function postErrorMessage(err: unknown): string {
  const text = errorText(err);

  if (text.includes('comment_rate_limit')) {
    return "You're posting quickly. Give it a few seconds and try again.";
  }
  if (text.includes('comment_daily_limit')) {
    return "You've hit the daily comment limit. Try again tomorrow.";
  }
  if (text.includes('comments_body_length')) {
    return `Comments run from ${BODY_MIN} to ${BODY_MAX} characters.`;
  }
  if (text.includes('comments_author_name_length')) {
    return `Your name needs to be ${NAME_MIN} to ${NAME_MAX} characters.`;
  }
  // The INSERT policy rejects anyone who has not finished onboarding or who is
  // banned. PostgREST reports that as a row-level security violation.
  if (text.includes('row-level security') || text.includes('violates row-level')) {
    return 'Your account can’t post comments right now.';
  }
  return 'Something went wrong posting your comment. Try again.';
}

// ---------- display ----------

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** Relative under a week, absolute after — a date is more useful than
 *  "23 days ago" once the meeting it refers to has come and gone. */
export function formatCommentDate(iso: string, now = Date.now()): string {
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return '';

  const diff = now - t;
  if (diff < MINUTE) return 'Just now';
  if (diff < HOUR) {
    const m = Math.floor(diff / MINUTE);
    return `${m} minute${m === 1 ? '' : 's'} ago`;
  }
  if (diff < DAY) {
    const h = Math.floor(diff / HOUR);
    return `${h} hour${h === 1 ? '' : 's'} ago`;
  }
  if (diff < 7 * DAY) {
    const d = Math.floor(diff / DAY);
    return `${d} day${d === 1 ? '' : 's'} ago`;
  }
  return new Date(t).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
