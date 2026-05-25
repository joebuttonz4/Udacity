'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

// Hardcoded PSL ZIP → districts mapping (beta approach — no Edge Function needed)
const PSL_ZIPS = ['34952', '34953', '34983', '34984', '34986', '34987', '34988'];

const ALL_PSL_DISTRICTS = [
  { id: '11111111-0000-0000-0000-000000000001', name: 'City Council District 1', scope: 'city' },
  { id: '11111111-0000-0000-0000-000000000002', name: 'School Board District 1', scope: 'county' },
  { id: '11111111-0000-0000-0000-000000000003', name: 'St. Lucie County Commission At-Large', scope: 'county' },
  { id: '11111111-0000-0000-0000-000000000004', name: 'FL House District 85', scope: 'state' },
  { id: '11111111-0000-0000-0000-000000000005', name: 'FL Senate District 27', scope: 'state' },
];

export default function ZipPage() {
  const router = useRouter();
  const [zip, setZip] = useState('');
  const [error, setError] = useState('');
  const [showBetaNotice, setShowBetaNotice] = useState(false);
  const [loading, setLoading] = useState(false);

  function handleZipChange(e: React.ChangeEvent<HTMLInputElement>) {
    setZip(e.target.value.replace(/\D/g, ''));
    setError('');
    setShowBetaNotice(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setError('');
    setShowBetaNotice(false);

    if (zip.length !== 5 || !/^\d+$/.test(zip)) {
      setError('Please enter a valid 5-digit ZIP code.');
      return;
    }

    if (!PSL_ZIPS.includes(zip)) {
      setShowBetaNotice(true);
      setLoading(false);
      return;
    }

    setLoading(true);

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('[ZipPage] auth.getUser failed:', authError);
      router.push('/onboarding/signup');
      return;
    }

    // Write ZIP to profile
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ zip_code: zip })
      .eq('id', user.id);

    if (profileError) {
      console.error('[ZipPage] profiles update failed:', profileError);
    }

    // Clear any existing districts for this user before inserting fresh ones.
    // user_districts has no UPDATE policy so upsert fails on conflict; DELETE + INSERT works.
    const { error: deleteError } = await supabase
      .from('user_districts')
      .delete()
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('[ZipPage] user_districts delete failed:', deleteError);
      setError('Something went wrong. Please try again.');
      setLoading(false);
      return;
    }

    const districtRows = ALL_PSL_DISTRICTS.map(d => ({
      user_id: user.id,
      district_id: d.id,
      scope: d.scope,
    }));

    const { error: districtError } = await supabase
      .from('user_districts')
      .insert(districtRows);

    if (districtError) {
      console.error('[ZipPage] user_districts insert failed:', districtError);
      setError('Something went wrong. Please try again.');
      setLoading(false);
      return;
    }

    router.push('/onboarding/districts');
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex-1 flex flex-col items-center justify-between px-6 py-12 min-h-screen"
    >

      {/* Header */}
      <div className="flex flex-col items-center pt-8 w-full max-w-sm">
        <button
          type="button"
          onClick={() => router.back()}
          className="self-start text-[#6B7280] hover:text-white transition-colors mb-8"
        >
          ← Back
        </button>
        <div className="w-12 h-12 rounded-full bg-[#00C9A7]/10 flex items-center justify-center mb-4">
          <span className="text-2xl">📍</span>
        </div>
        <h2 className="[font-family:var(--font-syne)] text-2xl font-bold text-white text-center">
          What&apos;s your ZIP code?
        </h2>
        <p className="text-[#6B7280] text-sm text-center mt-2">
          We use this to find the races you can actually vote on. Nothing else.
        </p>
      </div>

      {/* Input */}
      <div className="flex flex-col gap-3 w-full max-w-sm">
        <input
          type="text"
          inputMode="numeric"
          maxLength={5}
          value={zip}
          onChange={handleZipChange}
          placeholder="34984"
          className="h-16 bg-[#1F2937] border border-[#374151] rounded-2xl px-6 text-white text-2xl text-center placeholder-[#4B5563] focus:outline-none focus:border-[#00C9A7] tracking-widest transition-colors"
        />
        {error && (
          <p className="text-[#FF6B6B] text-sm text-center">{error}</p>
        )}
        {showBetaNotice && (
          <div className="rounded-2xl bg-[#1F2937] border border-[#374151] p-4 text-center">
            <p className="[font-family:var(--font-syne)] text-white font-semibold text-sm mb-2">
              CivicMarket is not available in your area yet
            </p>
            <p className="text-[#6B7280] text-xs leading-relaxed mb-3">
              We are currently testing CivicMarket in Port St. Lucie, Florida. We are starting small so we can keep local election and civic data accurate. Please check back later as CivicMarket expands to more communities.
            </p>
            <p className="text-[#00C9A7] text-xs font-medium">Try a Port St. Lucie beta ZIP</p>
          </div>
        )}
      </div>

      {/* CTA */}
      <div className="w-full max-w-sm">
        <button
          type="submit"
          disabled={loading || zip.length !== 5}
          className="[font-family:var(--font-syne)] w-full h-14 bg-[#00C9A7] hover:bg-[#00A688] disabled:opacity-40 text-[#0D1117] font-bold rounded-2xl transition-colors"
        >
          {loading ? 'Finding your races...' : 'Continue'}
        </button>
      </div>

    </form>
  );
}
