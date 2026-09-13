// Home feed data layer — THIS_IS_THE_APP.md screen 2.
//
// Reads civic_feed only. No ratings, no support/oppose, no comments: those
// tables do not exist yet and screen 2 does not need them.

import { supabase } from '@/lib/supabase';

export type FeedDistrict = { name: string; type: string } | null;

export type FeedItem = {
  id: string;
  title: string;
  /** Short summary, 165-240 chars. Feed card only. */
  description: string | null;
  /** Long-form plain English, item detail only. Blank lines are paragraph breaks. */
  detail: string | null;
  source_url: string | null;
  meeting_body: string | null;
  meeting_date: string | null;
  meeting_time: string | null;
  location: string | null;
  address: string | null;
  /** Three-state: true allowed, false not allowed, NULL unknown — render nothing on NULL. */
  public_comment: boolean | null;
  dimensions: string[] | null;
  urgency: string | null;
  district_id: string | null;
  expires_at: string | null;
  outcome: string | null;
  outcome_detail: string | null;
  minutes_url: string | null;
  districts: FeedDistrict;
};

export type FeedBuckets = {
  /** meeting_date is today or later, or absent. */
  upcoming: FeedItem[];
  /** meeting_date is in the past — with or without an outcome recorded. */
  decided: FeedItem[];
  /** meeting_date is exactly today. Drives the live-meeting banner. */
  today: FeedItem[];
};

export type HomeFeed = FeedBuckets & {
  topIssues: string[];
};

const FEED_COLUMNS = `
  id,
  title,
  description,
  detail,
  source_url,
  meeting_body,
  meeting_date,
  meeting_time,
  location,
  address,
  public_comment,
  dimensions,
  urgency,
  district_id,
  expires_at,
  outcome,
  outcome_detail,
  minutes_url,
  districts ( name, type )
`;

const URGENCY_RANK: Record<string, number> = {
  major: 0,
  significant: 1,
  routine: 2,
};

function urgencyRank(u: string | null): number {
  return URGENCY_RANK[u ?? ''] ?? 3;
}

/** Local calendar date as YYYY-MM-DD. Never use toISOString here — it shifts
 *  the date across the UTC boundary, which would move a 6 PM meeting a day. */
export function localToday(): string {
  const d = new Date();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${month}-${day}`;
}

function isExpired(item: FeedItem, now: number): boolean {
  if (!item.expires_at) return false;
  const t = new Date(item.expires_at).getTime();
  return Number.isFinite(t) && t <= now;
}

export function bucketFeed(items: FeedItem[], today = localToday()): FeedBuckets {
  const now = Date.now();
  const live = items.filter((i) => !isExpired(i, now));

  // An item with no meeting_date is treated as upcoming and sorted last,
  // rather than disappearing. meeting_date is a required entry field, so this
  // is a safety net, not an expected state.
  const upcoming = live
    .filter((i) => !i.meeting_date || i.meeting_date >= today)
    .sort((a, b) => {
      if (a.meeting_date !== b.meeting_date) {
        if (!a.meeting_date) return 1;
        if (!b.meeting_date) return -1;
        return a.meeting_date < b.meeting_date ? -1 : 1;
      }
      return urgencyRank(a.urgency) - urgencyRank(b.urgency);
    });

  const decided = live
    .filter((i) => !!i.meeting_date && i.meeting_date < today)
    .sort((a, b) => (a.meeting_date! < b.meeting_date! ? 1 : -1));

  const todayItems = upcoming.filter((i) => i.meeting_date === today);

  return { upcoming, decided, today: todayItems };
}

/** True when the item carries at least one of the user's picked issues.
 *
 *  The mockup's "for you" rule was `issue match OR area match`. Under the
 *  district filter in getFeedItems, every item returned is already in one of
 *  the user's districts, so an area test would light up every card and mean
 *  nothing. Issue match is the only signal that still discriminates. */
export function isForYou(item: FeedItem, topIssues: string[]): boolean {
  if (!topIssues.length || !item.dimensions?.length) return false;
  return item.dimensions.some((d) => topIssues.includes(d));
}

/** Matched issue keys, for the "why you're seeing this" pills. */
export function matchedIssues(item: FeedItem, topIssues: string[]): string[] {
  if (!item.dimensions?.length) return [];
  return item.dimensions.filter((d) => topIssues.includes(d));
}

/**
 * Items for the given districts only.
 *
 * district_id IS NULL is deliberately excluded. Untagged items are invisible
 * rather than shown to everyone — this is a hyperlocal app, and a citywide item
 * is expected to carry the "Port St. Lucie (citywide)" districts row, not NULL.
 */
export async function getFeedItems(districtIds: string[]): Promise<FeedItem[]> {
  if (!districtIds.length) return [];

  const { data, error } = await supabase
    .from('civic_feed')
    .select(FEED_COLUMNS)
    .in('district_id', districtIds)
    .order('meeting_date', { ascending: false });

  if (error) throw error;
  return (data ?? []) as unknown as FeedItem[];
}

/**
 * One item by id, scoped to the same districts as the feed.
 *
 * The district filter is not redundant with RLS. civic_feed's policy is
 * `USING (true)` — the database will serve any row by id to any signed-in
 * user. The hyperlocal rule from screen 2 only holds if it is enforced here
 * too, otherwise /items/<uuid> reads straight around it.
 *
 * Returns null both for "no such row" and "row outside your districts". The
 * caller renders one neutral not-found state for both, so probing ids cannot
 * confirm that an item exists.
 */
export async function getFeedItem(
  id: string,
  districtIds: string[],
): Promise<FeedItem | null> {
  if (!districtIds.length) return null;

  const { data, error } = await supabase
    .from('civic_feed')
    .select(FEED_COLUMNS)
    .eq('id', id)
    .in('district_id', districtIds)
    .maybeSingle();

  if (error) throw error;
  return (data as unknown as FeedItem) ?? null;
}

export async function getTopIssues(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('top_issues')
    .eq('id', userId)
    .maybeSingle();

  if (error) throw error;
  return (data?.top_issues as string[] | null) ?? [];
}

export async function getHomeFeed(userId: string, districtIds: string[]): Promise<HomeFeed> {
  const [items, topIssues] = await Promise.all([
    getFeedItems(districtIds),
    getTopIssues(userId),
  ]);

  return { ...bucketFeed(items), topIssues };
}

// ---------- display helpers ----------

/** '2026-09-14' → 'Mon, Sep 14'. Parsed at local midnight so the weekday is
 *  the meeting's weekday, not yesterday's in a negative-offset timezone. */
export function formatMeetingDate(date: string | null): string {
  if (!date) return 'Date to be announced';
  const d = new Date(`${date}T00:00:00`);
  if (Number.isNaN(d.getTime())) return date;
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** The mockup heading is "This week". Keep it only while it is true. */
export function upcomingHeading(items: FeedItem[], today = localToday()): string {
  const cutoff = new Date(`${today}T00:00:00`).getTime() + 7 * DAY_MS;
  const allWithinAWeek = items.every((i) => {
    if (!i.meeting_date) return false;
    return new Date(`${i.meeting_date}T00:00:00`).getTime() < cutoff;
  });
  return allWithinAWeek ? 'This week' : 'Coming up';
}

export function isSafeUrl(url: string | null | undefined): boolean {
  return !!url && (url.startsWith('https://') || url.startsWith('http://'));
}

/** Hostname for display, without the scheme or a leading www. */
export function sourceHost(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

/** Blank-line-separated prose into paragraphs. Never render `detail` as HTML —
 *  it is operator-entered text, and the app has no sanitizer. */
export function paragraphs(text: string): string[] {
  return text
    .split(/\r?\n\s*\r?\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

/** True once the meeting date has passed. Drives the when-and-where card's
 *  live/history inversion and the outcome block. */
export function isPast(item: FeedItem, today = localToday()): boolean {
  return !!item.meeting_date && item.meeting_date < today;
}
