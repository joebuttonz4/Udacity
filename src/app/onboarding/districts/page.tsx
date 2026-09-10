'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import {
  OnboardingHeader,
  ScreenHeading,
  ScreenBody,
  Card,
  Btn,
  GhostBtn,
} from '../_components/OnboardingUI';

const SCOPE_LABEL: Record<string, string> = {
  city: 'City',
  county: 'County',
  state: 'State',
};

type FeedItem = {
  id: string;
  title: string;
  meeting_date: string | null;
  urgency: string | null;
};

type DistrictRow = {
  scope: string;
  districts: { name: string; type: string } | null;
};

export default function BackyardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<FeedItem[]>([]);
  const [districts, setDistricts] = useState<DistrictRow[]>([]);
  const [zip, setZip] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/onboarding'); return; }

      const today = new Date().toISOString().slice(0, 10);

      const [feedRes, districtsRes, profileRes] = await Promise.all([
        supabase
          .from('civic_feed')
          .select('id, title, meeting_date, urgency')
          .gte('meeting_date', today)
          .order('meeting_date', { ascending: true })
          .limit(5),
        supabase
          .from('user_districts')
          .select('scope, districts ( name, type )')
          .eq('user_id', session.user.id),
        supabase
          .from('profiles')
          .select('zip_code')
          .eq('id', session.user.id)
          .single(),
      ]);

      if (feedRes.error) {
        console.error('[BackyardPage] civic_feed query failed:', feedRes.error);
      } else {
        setItems((feedRes.data ?? []) as FeedItem[]);
      }

      if (districtsRes.error) {
        console.error('[BackyardPage] user_districts query failed:', districtsRes.error);
        setError('No districts found. Please go back and re-enter your ZIP.');
      } else {
        setDistricts((districtsRes.data ?? []) as unknown as DistrictRow[]);
      }

      setZip(profileRes.data?.zip_code ?? null);
      setLoading(false);
    }
    load();
  }, [router]);

  return (
    <>
      <OnboardingHeader step={3} />
      <div className="flex-1 px-5 pt-6 pb-8 flex flex-col">
        <ScreenHeading>This is your backyard.</ScreenHeading>
        <ScreenBody>
          Here&apos;s what&apos;s happening near you, and who decides it.
        </ScreenBody>

        {loading ? (
          <Card className="mt-6 animate-pulse">
            <div className="h-3 w-32 bg-[#E4E9F0] rounded mb-3" />
            <div className="h-3 w-48 bg-[#E4E9F0] rounded" />
          </Card>
        ) : (
          <Card className="mt-6 bg-[#0E2A47] border-0">
            <p className="text-[12px] font-semibold text-white uppercase tracking-[0.06em] [font-family:var(--font-instrument-sans)]">
              Coming up
            </p>
            {items.length === 0 ? (
              <p className="text-[14px] text-[#C7D2E0] leading-5 mt-2 [font-family:var(--font-instrument-sans)]">
                No agenda items are entered yet. Mike adds new ones after every meeting
                cycle — check back soon.
              </p>
            ) : (
              <>
                <p className="text-[14px] text-white leading-5 mt-2 [font-family:var(--font-instrument-sans)]">
                  <strong>{items.length}</strong> agenda item{items.length === 1 ? '' : 's'} coming
                  up, including <strong>{items[0].title}</strong>
                  {items[0].meeting_date ? ` on ${new Date(items[0].meeting_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : ''}.
                </p>
              </>
            )}
          </Card>
        )}

        {error && (
          <Card className="mt-4 border-[#E5484D]">
            <p className="text-[13px] text-[#E5484D] [font-family:var(--font-instrument-sans)]">{error}</p>
          </Card>
        )}

        {!loading && !error && (
          <Card className="mt-4 p-0 overflow-hidden">
            {zip && (
              <div className="flex items-center justify-between px-4 py-3 border-b border-[#E4E9F0]">
                <span className="text-[13px] text-[#5A6B82] [font-family:var(--font-instrument-sans)]">ZIP code</span>
                <span className="text-[13px] font-semibold text-[#1B2B41] [font-family:var(--font-instrument-sans)]">{zip}</span>
              </div>
            )}
            {districts.map((d, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-3 border-b border-[#E4E9F0] last:border-b-0">
                <span className="text-[13px] text-[#5A6B82] [font-family:var(--font-instrument-sans)]">
                  {SCOPE_LABEL[d.scope] ?? d.scope}
                </span>
                <span className="text-[13px] font-semibold text-[#1B2B41] text-right [font-family:var(--font-instrument-sans)]">
                  {d.districts?.name ?? 'Unknown'}
                </span>
              </div>
            ))}
            {!districts.some((d) => d.districts?.type === 'city_council') && (
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-[13px] text-[#5A6B82] [font-family:var(--font-instrument-sans)]">City Council district</span>
                <span className="text-[13px] font-semibold text-[#8A99AD] text-right [font-family:var(--font-instrument-sans)]">
                  Not yet confirmed
                </span>
              </div>
            )}
          </Card>
        )}

        {!districts.some((d) => d.districts?.type === 'city_council') && (
          <p className="text-[12px] text-[#8A99AD] mt-3 [font-family:var(--font-instrument-sans)]">
            You can confirm your City Council district anytime from your profile.
          </p>
        )}

        <div className="flex-1" />

        <div className="flex flex-col gap-3 mt-8">
          <Btn onClick={() => router.push('/onboarding/verify')} disabled={loading || !!error}>
            That&apos;s me
          </Btn>
          <GhostBtn onClick={() => router.push('/onboarding/zip')}>Wrong ZIP, go back</GhostBtn>
        </div>
      </div>
    </>
  );
}
