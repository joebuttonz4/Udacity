'use client';

// Item detail — THIS_IS_THE_APP.md screen 3, built to
// mockup/civicmarket_mockup.jsx (`ItemDetail`) in Civic Navy v3.
//
// Deliberately absent, and owned by later screens or by schema that does not
// exist yet: follow-the-money (no money columns), stars (no ratings table),
// support/oppose/unsure + neighbor bars (no votes table), candidates-on-this-
// item (no takes table), comments (screen 4), "remind me" (screen 5),
// the item-scoped report sheet and the verify wall (screen 10).

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { getUserDistrictIds } from '@/lib/candidates';
import { categoryLabel } from '@/lib/categories';
import {
  getFeedItem,
  getTopIssues,
  formatMeetingDate,
  matchedIssues,
  paragraphs,
  isPast,
  isSafeUrl,
  sourceHost,
  type FeedItem,
} from '@/lib/feed';
import {
  PageHeader,
  Card,
  SectionLabel,
  Pill,
  ScopePill,
  UrgencyBadge,
  LabelValueRow,
} from '@/components/navy';

function BackLink() {
  return (
    <Link
      href="/"
      className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#C7D2E0] active:opacity-70 [font-family:var(--font-instrument-sans)]"
    >
      <span aria-hidden="true">&larr;</span> Your backyard
    </Link>
  );
}

function CardHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-2">
      <SectionLabel>{children}</SectionLabel>
    </div>
  );
}

function WhenAndWhere({ item }: { item: FeedItem }) {
  const past = isPast(item);
  const dark = !past;

  return (
    <div
      className={`rounded-xl p-4 ${
        dark
          ? 'bg-[#0E2A47]'
          : 'bg-white border border-[#E4E9F0] shadow-[0_1px_2px_rgba(14,42,71,0.06),0_1px_3px_rgba(14,42,71,0.04)]'
      }`}
    >
      <p
        className={`text-[12px] font-semibold uppercase tracking-[0.06em] mb-1 [font-family:var(--font-instrument-sans)] ${
          dark ? 'text-[#8A99AD]' : 'text-[#8A99AD]'
        }`}
      >
        {past ? 'Discussed and voted' : 'When and where'}
      </p>

      <LabelValueRow label="When" dark={dark}>
        {formatMeetingDate(item.meeting_date)}
        {item.meeting_time ? ` at ${item.meeting_time}` : ''}
      </LabelValueRow>

      <LabelValueRow label="Where" dark={dark}>
        {item.location ?? 'Location to be announced'}
        {item.address && (
          <span
            className={`block text-[13px] mt-0.5 ${dark ? 'text-[#8A99AD]' : 'text-[#5A6B82]'}`}
          >
            {item.address}
          </span>
        )}
      </LabelValueRow>

      {/* public_comment is three-state. NULL means nobody checked, which is not
          the same as "no public comment" — so the row is omitted entirely. */}
      <LabelValueRow label="Meeting" dark={dark} last={item.public_comment === null}>
        {item.meeting_body ?? item.districts?.name ?? 'Meeting body not recorded'}
      </LabelValueRow>

      {item.public_comment !== null && (
        <LabelValueRow label="Public comment" dark={dark} last>
          {item.public_comment ? 'Allowed on this item' : 'Not allowed on this item'}
        </LabelValueRow>
      )}

      {past && (
        <div className={`mt-3 pt-3 border-t ${dark ? 'border-[#163B62]' : 'border-[#E4E9F0]'}`}>
          {item.outcome ? (
            <>
              <p className="text-[18px] font-bold text-[#1B2B41] [font-family:var(--font-instrument-sans)]">
                {item.outcome}
              </p>
              {item.outcome_detail && (
                <p className="text-[13px] text-[#5A6B82] leading-5 mt-1.5 [font-family:var(--font-instrument-sans)]">
                  {item.outcome_detail}
                </p>
              )}
            </>
          ) : (
            <p className="text-[15px] text-[#8A99AD] [font-family:var(--font-instrument-sans)]">
              Outcome not posted yet
            </p>
          )}

          {isSafeUrl(item.minutes_url) && (
            <a
              href={item.minutes_url as string}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block text-[13px] font-semibold text-[#0E2A47] underline mt-2.5 [font-family:var(--font-instrument-sans)]"
            >
              Read the minutes
            </a>
          )}
        </div>
      )}
    </div>
  );
}

function SourceRow({ item }: { item: FeedItem }) {
  // The trust anchor, placed directly under the plain-English block because
  // that block is our rewrite and this is its receipt. A missing source renders
  // as a visible gap, never as a hidden row — an absent link and an untapped
  // one look identical otherwise.
  if (!isSafeUrl(item.source_url)) {
    return (
      <div className="rounded-xl border border-[#E4E9F0] bg-white px-4 py-3.5">
        <p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-[#8A99AD] [font-family:var(--font-instrument-sans)]">
          Source
        </p>
        <p className="text-[15px] text-[#8A99AD] mt-1 [font-family:var(--font-instrument-sans)]">
          No source link on file
        </p>
      </div>
    );
  }

  const url = item.source_url as string;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 rounded-xl border border-[#E4E9F0] bg-white px-4 py-3.5 min-h-12 active:scale-[0.99] transition-transform"
    >
      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-[#8A99AD] [font-family:var(--font-instrument-sans)]">
          Source
        </p>
        <p className="text-[15px] font-semibold text-[#0E2A47] mt-0.5 [font-family:var(--font-instrument-sans)]">
          Read the official agenda item
        </p>
        <p className="text-[13px] text-[#5A6B82] mt-0.5 truncate [font-family:var(--font-instrument-sans)]">
          {sourceHost(url)}
        </p>
      </div>
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#0E2A47"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="shrink-0"
        aria-hidden="true"
      >
        <path d="M14 4h6v6" />
        <path d="M20 4l-8 8" />
        <path d="M18 14v5a1 1 0 01-1 1H5a1 1 0 01-1-1V7a1 1 0 011-1h5" />
      </svg>
    </a>
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

export default function ItemDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [item, setItem] = useState<FeedItem | null>(null);
  const [topIssues, setTopIssues] = useState<string[]>([]);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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

        const [found, issues] = await Promise.all([
          getFeedItem(id, districtIds),
          getTopIssues(session.user.id),
        ]);

        if (cancelled) return;

        if (!found) {
          setNotFound(true);
        } else {
          setItem(found);
          setTopIssues(issues);
        }
      } catch (err: unknown) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : 'Something went wrong loading this item.',
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    if (id) run();
    return () => {
      cancelled = true;
    };
  }, [router, id, reloadKey]);

  function retry() {
    setLoading(true);
    setError(null);
    setNotFound(false);
    setReloadKey((k) => k + 1);
  }

  const matched = item ? matchedIssues(item, topIssues) : [];
  const others = item ? (item.dimensions ?? []).filter((d) => !matched.includes(d)) : [];
  const bodyText = item?.detail ?? item?.description ?? null;

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F7FA]">
      <PageHeader
        eyebrow={item?.meeting_body ?? 'Agenda item'}
        title={item?.title ?? (loading ? 'Loading…' : 'Item')}
        sub={
          item
            ? isPast(item)
              ? `Decided ${formatMeetingDate(item.meeting_date)}`
              : `${formatMeetingDate(item.meeting_date)}${item.meeting_time ? ` · ${item.meeting_time}` : ''}`
            : undefined
        }
        back={<BackLink />}
      />

      <div className="flex-1 px-4 pt-4 pb-28 flex flex-col gap-3">
        {loading && <LoadingState />}

        {!loading && error && (
          <Card className="border-[#E5484D]">
            <p className="text-[14px] font-semibold text-[#1B2B41] [font-family:var(--font-instrument-sans)]">
              We couldn&apos;t load this item
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

        {/* One neutral state covers both "no such row" and "outside your
            districts" — a distinct message would confirm an item exists to
            someone probing ids. */}
        {!loading && !error && notFound && (
          <Card>
            <p className="text-[16px] font-semibold text-[#1B2B41] [font-family:var(--font-instrument-sans)]">
              We couldn&apos;t find that item
            </p>
            <p className="text-[15px] text-[#5A6B82] leading-6 mt-2 [font-family:var(--font-instrument-sans)]">
              It may have been removed, or it isn&apos;t on the agenda for your districts.
            </p>
            <Link
              href="/"
              className="flex items-center justify-center w-full h-12 rounded-[10px] bg-[#0E2A47] text-white font-semibold text-[15px] mt-4 active:scale-[0.98] transition-transform [font-family:var(--font-instrument-sans)]"
            >
              Back to your feed
            </Link>
          </Card>
        )}

        {!loading && !error && item && (
          <>
            <div className="flex flex-wrap items-center gap-1.5">
              <UrgencyBadge urgency={item.urgency} />
              {item.districts?.name && (
                <ScopePill label={item.districts.name} scope={item.districts.type} />
              )}
            </div>

            <WhenAndWhere item={item} />

            {bodyText && (
              <Card>
                <CardHeading>In plain English</CardHeading>
                {paragraphs(bodyText).map((p, i) => (
                  <p
                    key={i}
                    className={`text-[15px] text-[#5A6B82] leading-[1.6] whitespace-pre-line [font-family:var(--font-instrument-sans)] ${
                      i === 0 ? '' : 'mt-3'
                    }`}
                  >
                    {p}
                  </p>
                ))}
              </Card>
            )}

            <SourceRow item={item} />

            {matched.length > 0 && (
              <Card accent>
                <CardHeading>Why you&apos;re seeing this</CardHeading>
                <p className="text-[15px] text-[#5A6B82] leading-6 [font-family:var(--font-instrument-sans)]">
                  You said{' '}
                  <span className="font-semibold text-[#1B2B41]">
                    {matched.map((k) => categoryLabel(k).toLowerCase()).join(' and ')}
                  </span>{' '}
                  matter most to you.
                </p>
              </Card>
            )}

            {(matched.length > 0 || others.length > 0) && (
              <div className="flex flex-wrap gap-1.5">
                {matched.map((key) => (
                  <Pill key={key} active>
                    {categoryLabel(key)}
                  </Pill>
                ))}
                {others.map((key) => (
                  <Pill key={key}>{categoryLabel(key)}</Pill>
                ))}
              </div>
            )}

            <p className="text-[13px] text-[#5A6B82] text-center leading-5 mt-2 [font-family:var(--font-instrument-sans)]">
              Something wrong with this item?{' '}
              <Link href="/report" className="font-semibold text-[#0E2A47] underline">
                Report an inaccuracy
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
