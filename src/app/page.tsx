'use client';

// Home feed — THIS_IS_THE_APP.md screen 2, built to mockup/civicmarket_mockup.jsx
// (`Home`) in Civic Navy v3 (docs/design/DESIGN_DIRECTION_V3.md).
//
// Deliberately absent, and owned by later screens in the build order:
// item detail navigation (screen 3), comments (4), alerts + bell (5),
// City Hall check-in (10), stars, support/oppose bars, follow-the-money,
// candidates-on-this-item.

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { getUserDistrictIds } from '@/lib/candidates';
import { categoryLabel } from '@/lib/categories';
import {
  getHomeFeed,
  formatMeetingDate,
  upcomingHeading,
  isForYou,
  matchedIssues,
  isSafeUrl,
  type FeedItem,
  type HomeFeed,
} from '@/lib/feed';
import {
  PageHeader,
  Card,
  SectionLabel,
  Pill,
  ScopePill,
  UrgencyBadge,
} from '@/components/navy';

function MetaLine({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[13px] text-[#5A6B82] [font-family:var(--font-instrument-sans)]">
      {children}
    </p>
  );
}

function ItemTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-[16px] font-semibold text-[#1B2B41] leading-snug [font-family:var(--font-instrument-sans)]">
      {children}
    </h3>
  );
}

/** The whole card is the tap target. The Link wraps Card rather than living
 *  inside it, so nothing interactive ends up nested. */
function ItemLink({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <Link href={`/items/${id}`} className="block active:scale-[0.99] transition-transform">
      {children}
    </Link>
  );
}

function UpcomingCard({ item, topIssues }: { item: FeedItem; topIssues: string[] }) {
  const matched = matchedIssues(item, topIssues);
  const others = (item.dimensions ?? []).filter((d) => !matched.includes(d));

  return (
    <Card accent={isForYou(item, topIssues)}>
      <div className="flex items-start justify-between gap-3">
        <MetaLine>
          {formatMeetingDate(item.meeting_date)}
          {item.meeting_time ? ` · ${item.meeting_time}` : ''}
        </MetaLine>
        <UrgencyBadge urgency={item.urgency} />
      </div>

      <div className="mt-2">
        <ItemTitle>{item.title}</ItemTitle>
      </div>

      {item.description && (
        <p className="text-[15px] text-[#5A6B82] leading-6 mt-2 [font-family:var(--font-instrument-sans)]">
          {item.description}
        </p>
      )}

      {item.location && (
        <p className="text-[13px] text-[#8A99AD] mt-2.5 [font-family:var(--font-instrument-sans)]">
          {item.location}
          {item.address ? ` · ${item.address}` : ''}
        </p>
      )}

      <div className="flex flex-wrap gap-1.5 mt-3">
        {item.districts?.name && (
          <ScopePill label={item.districts.name} scope={item.districts.type} />
        )}
        {matched.map((key) => (
          <Pill key={key} active>
            {categoryLabel(key)}
          </Pill>
        ))}
        {others.map((key) => (
          <Pill key={key}>{categoryLabel(key)}</Pill>
        ))}
      </div>

      {matched.length > 0 && (
        <p className="text-[12px] text-[#5A6B82] mt-2.5 [font-family:var(--font-instrument-sans)]">
          You said {matched.map((k) => categoryLabel(k).toLowerCase()).join(' and ')} matter
          most to you.
        </p>
      )}
    </Card>
  );
}

function DecidedCard({ item }: { item: FeedItem }) {
  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <MetaLine>
          Voted {formatMeetingDate(item.meeting_date)}
          {item.location ? ` · ${item.location}` : ''}
        </MetaLine>
        {item.outcome ? (
          <span className="text-[13px] font-semibold text-[#1B2B41] text-right shrink-0 [font-family:var(--font-instrument-sans)]">
            {item.outcome}
          </span>
        ) : (
          <span className="text-[13px] text-[#8A99AD] text-right shrink-0 [font-family:var(--font-instrument-sans)]">
            Outcome not posted yet
          </span>
        )}
      </div>

      <div className="mt-2">
        <ItemTitle>{item.title}</ItemTitle>
      </div>

      {item.outcome_detail && (
        <p className="text-[13px] text-[#5A6B82] leading-5 mt-2 [font-family:var(--font-instrument-sans)]">
          {item.outcome_detail}
        </p>
      )}

      {/* The minutes link moved to item detail when these cards became links:
          an <a> nested inside the card's <Link> is invalid HTML. */}
      {isSafeUrl(item.minutes_url) && (
        <p className="text-[13px] font-semibold text-[#0E2A47] mt-2.5 [font-family:var(--font-instrument-sans)]">
          Minutes available
        </p>
      )}
    </Card>
  );
}

function LiveMeetingBanner({ items }: { items: FeedItem[] }) {
  const first = items[0];
  return (
    <div className="bg-[#0E2A47] rounded-xl p-4">
      <p className="text-[12px] font-semibold text-[#8A99AD] uppercase tracking-[0.06em] [font-family:var(--font-instrument-sans)]">
        Today
      </p>
      <p className="text-[16px] font-semibold text-white leading-snug mt-1 [font-family:var(--font-instrument-sans)]">
        {items.length} item{items.length === 1 ? '' : 's'} on today&apos;s agenda
      </p>
      <p className="text-[13px] text-[#C7D2E0] leading-5 mt-1 [font-family:var(--font-instrument-sans)]">
        {first.meeting_time ? `${first.meeting_time} · ` : ''}
        {first.location ?? 'Location to be announced'}
      </p>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex flex-col gap-3">
      {[0, 1].map((i) => (
        <Card key={i} className="animate-pulse">
          <div className="h-3 w-28 bg-[#E4E9F0] rounded" />
          <div className="h-4 w-52 bg-[#E4E9F0] rounded mt-3" />
          <div className="h-3 w-full bg-[#F5F7FA] rounded mt-3" />
          <div className="h-3 w-3/4 bg-[#F5F7FA] rounded mt-2" />
        </Card>
      ))}
    </div>
  );
}

export default function HomePage() {
  const router = useRouter();
  const [feed, setFeed] = useState<HomeFeed | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Retry bumps this, which re-runs the effect. The loader lives inside the
  // effect rather than in a useCallback so no setState is reachable
  // synchronously from the effect body (react-hooks/set-state-in-effect).
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          router.push('/onboarding');
          return;
        }

        const districtIds = await getUserDistrictIds(session.user.id);

        if (!districtIds.length) {
          router.push('/onboarding/zip');
          return;
        }

        const result = await getHomeFeed(session.user.id, districtIds);
        if (!cancelled) setFeed(result);
      } catch (err: unknown) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : 'Something went wrong loading your feed.',
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [router, reloadKey]);

  const retry = useCallback(() => {
    setLoading(true);
    setError(null);
    setReloadKey((k) => k + 1);
  }, []);

  const hasAnything = !!feed && (feed.upcoming.length > 0 || feed.decided.length > 0);

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F7FA]">
      <PageHeader
        eyebrow="Port St. Lucie"
        title="Your backyard"
        sub="What your city and county are deciding, in plain English."
      />

      <div className="flex-1 px-4 pt-4 pb-28 flex flex-col gap-3">
        {loading && <LoadingState />}

        {!loading && error && (
          <Card className="border-[#E5484D]">
            <p className="text-[14px] font-semibold text-[#1B2B41] [font-family:var(--font-instrument-sans)]">
              We couldn&apos;t load your feed
            </p>
            <p className="text-[13px] text-[#5A6B82] leading-5 mt-1.5 [font-family:var(--font-instrument-sans)]">
              {error}
            </p>
            <button
              type="button"
              onClick={retry}
              className="w-full h-12 rounded-[10px] bg-[#0E2A47] text-white font-semibold text-[15px] mt-4 active:scale-[0.98] transition-transform [font-family:var(--font-instrument-sans)]"
            >
              Try again
            </button>
          </Card>
        )}

        {!loading && !error && feed && (
          <>
            {feed.today.length > 0 && <LiveMeetingBanner items={feed.today} />}

            {!hasAnything && (
              <Card>
                <p className="text-[16px] font-semibold text-[#1B2B41] [font-family:var(--font-instrument-sans)]">
                  No agenda items yet
                </p>
                <p className="text-[15px] text-[#5A6B82] leading-6 mt-2 [font-family:var(--font-instrument-sans)]">
                  Nothing is on the agenda for your districts right now. New items are added
                  after each meeting cycle — check back soon.
                </p>
              </Card>
            )}

            {feed.upcoming.length > 0 && (
              <>
                <div className="pt-1">
                  <SectionLabel>{upcomingHeading(feed.upcoming)}</SectionLabel>
                </div>
                {feed.upcoming.map((item) => (
                  <ItemLink key={item.id} id={item.id}>
                    <UpcomingCard item={item} topIssues={feed.topIssues} />
                  </ItemLink>
                ))}
              </>
            )}

            {feed.decided.length > 0 && (
              <>
                <div className="pt-3">
                  <SectionLabel>What happened</SectionLabel>
                </div>
                {feed.decided.map((item) => (
                  <ItemLink key={item.id} id={item.id}>
                    <DecidedCard item={item} />
                  </ItemLink>
                ))}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
