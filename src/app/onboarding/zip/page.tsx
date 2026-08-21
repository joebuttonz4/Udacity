'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

// Hardcoded PSL ZIP → districts mapping (beta approach — no Edge Function needed)
const PSL_ZIPS = ['34952', '34953', '34983', '34984', '34986', '34987', '34988'];

// Ballot Eligibility vs. Representation (Phase 1): districts ZIP onboarding is allowed
// to manage. City Council District 1/3 remain excluded — ZIP alone cannot safely tell
// them apart (see /profile/city-council-district for the verified-assignment flow).
//
// School Board District 1, FL House District 85, and FL Senate District 27 were
// removed from this list. None of the three is a safe ZIP-based representation
// default:
//   - School Board District 1: every PSL user was being assigned this district as if
//     it were their verified representation seat, with no address confirmation —
//     the same shape of defect Gate I36 already fixed for City Council. School Board
//     ballot eligibility is countywide (handled by src/lib/ballotEligibility.ts via
//     the County Commission At-Large row below) and does not require this row.
//   - FL House District 85: Port St. Lucie is confirmed split across FL House
//     District 84 and District 85 — assigning 85 to every user is factually wrong
//     for residents actually in District 84. No verified-lookup flow exists yet, so
//     no automatic assignment is made at all.
//   - FL Senate District 27: confirmed incorrect for St. Lucie County entirely (the
//     real coverage is District 29/31, and ZIP alone cannot tell them apart). No
//     verified-lookup flow exists yet, so no automatic assignment is made at all.
//
// This list is also used to scope the delete below, so any legacy School Board
// District 1 / FL House District 85 / FL Senate District 27 row already held by an
// existing user is left untouched by a future ZIP resubmission — those require a
// separate, controlled cleanup once correct verified-assignment flows exist.
//
// Florida Statewide anchor (Package C1, Option A): ballot eligibility only, for
// Florida's four statewide constitutional offices (Governor/Lt. Governor, Attorney
// General, CFO, Commissioner of Agriculture). Never referenced by any
// current_officials row, so it creates no representation claim — same isolation
// already proven for the Mayor and County Commission At-Large anchors below. Added
// only after the anchor district row was confirmed live (see
// docs/candidate_import_package_c1_statewide_certification_independent.md and
// docs/candidate_import_package_c1_6a_execution_result.md). Applies to fresh
// onboarding only — existing users are covered by a separate, not-yet-approved
// backfill (Package C1 §6b), intentionally not part of this change.
const ZIP_MANAGED_DISTRICTS = [
  { id: '11111111-0000-0000-0000-000000000003', name: 'St. Lucie County Commission At-Large', scope: 'county' },
  { id: '11111111-0000-0000-0000-000000000006', name: 'Mayor', scope: 'city' },
  { id: '11111111-0000-0000-0000-00000000000b', name: 'Florida Statewide', scope: 'state' },
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

    // Clear only the districts this ZIP step manages, then insert fresh ones.
    // user_districts has no UPDATE policy so upsert fails on conflict; DELETE + INSERT works.
    // Scoped to ZIP_MANAGED_DISTRICTS only — City Council District 1/3 are never included
    // in this delete, so a separately verified City Council assignment survives ZIP
    // resubmission (e.g. a later ZIP change) untouched.
    const { error: deleteError } = await supabase
      .from('user_districts')
      .delete()
      .eq('user_id', user.id)
      .in('district_id', ZIP_MANAGED_DISTRICTS.map((d) => d.id));

    if (deleteError) {
      console.error('[ZipPage] user_districts delete failed:', deleteError);
      setError('Something went wrong. Please try again.');
      setLoading(false);
      return;
    }

    const districtRows = ZIP_MANAGED_DISTRICTS.map(d => ({
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
