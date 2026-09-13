'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import {
  OnboardingHeader,
  ScreenHeading,
  ScreenBody,
  Card,
  Label,
  Input,
  Btn,
  ErrorText,
} from '../_components/OnboardingUI';

// Hardcoded PSL ZIP → districts mapping (beta approach — no Edge Function needed)
const PSL_ZIPS = ['34952', '34953', '34983', '34984', '34986', '34987', '34988'];

// ZIPs known to cross a City Council district boundary, requiring a street name
// to disambiguate. Empty today: no verified boundary-to-ZIP source has been
// located yet (see VISION.md, "ZIP-to-council-district boundary data"). Do not
// add a ZIP here from a guess — only from a confirmed boundary source. Until
// then this mechanism is wired but never triggers.
const AMBIGUOUS_ZIPS: string[] = [];

// Ballot Eligibility vs. Representation (Phase 1): districts ZIP onboarding is allowed
// to manage. City Council District 1/3 remain excluded — ZIP alone cannot safely tell
// them apart (see /profile/city-council-district for the verified-assignment flow).
// School Board District 1, FL House District 85, and FL Senate District 27 are also
// excluded — none is a safe ZIP-based default (see prior onboarding/zip implementation
// notes in git history for the full rationale).
//
// "Port St. Lucie (citywide)" is safe to assign from ZIP alone: every resident of a PSL
// ZIP is in it by definition, so it needs no boundary source. It is what citywide
// City Council agenda items are tagged to, and the Home feed filters strictly to the
// user's own user_districts rows — without this assignment a resident sees no citywide
// items at all.
const ZIP_MANAGED_DISTRICTS = [
  { id: '11111111-0000-0000-0000-000000000003', name: 'St. Lucie County Commission At-Large', scope: 'county' },
  { id: '11111111-0000-0000-0000-000000000006', name: 'Mayor', scope: 'city' },
  { id: '11111111-0000-0000-0000-00000000000b', name: 'Florida Statewide', scope: 'state' },
  { id: '33494621-5d0b-4b13-ae1b-0bbc2dd211b2', name: 'Port St. Lucie (citywide)', scope: 'city' },
];

export default function ZipPage() {
  const router = useRouter();
  const [zip, setZip] = useState('');
  const [street, setStreet] = useState('');
  const [error, setError] = useState('');
  const [showBetaNotice, setShowBetaNotice] = useState(false);
  const [loading, setLoading] = useState(false);

  const ambiguous = AMBIGUOUS_ZIPS.includes(zip);

  function handleZipChange(v: string) {
    setZip(v.replace(/\D/g, ''));
    setError('');
    setShowBetaNotice(false);
  }

  async function handleSubmit() {
    if (loading) return;
    setError('');
    setShowBetaNotice(false);

    if (zip.length !== 5 || !/^\d+$/.test(zip)) {
      setError('Please enter a valid 5-digit ZIP code.');
      return;
    }

    if (!PSL_ZIPS.includes(zip)) {
      setShowBetaNotice(true);
      return;
    }

    if (ambiguous && !street.trim()) {
      setError('We need your street name for this ZIP.');
      return;
    }

    setLoading(true);

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('[ZipPage] auth.getUser failed:', authError);
      router.push('/onboarding/signup');
      return;
    }

    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        zip_code: zip,
        street_name_used: ambiguous ? street.trim() : null,
        zip_district_ambiguous: ambiguous,
      })
      .eq('id', user.id);

    if (profileError) {
      console.error('[ZipPage] profiles update failed:', profileError);
    }

    // user_districts has no UPDATE policy so upsert fails on conflict; DELETE + INSERT works.
    // Scoped to ZIP_MANAGED_DISTRICTS only — City Council District 1/3 are never included,
    // so a separately verified City Council assignment survives ZIP resubmission untouched.
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

    const districtRows = ZIP_MANAGED_DISTRICTS.map((d) => ({
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
    <>
      <OnboardingHeader step={2} />
      <div className="flex-1 px-5 pt-6 pb-8 flex flex-col">
        <ScreenHeading>Where&apos;s your backyard?</ScreenHeading>
        <ScreenBody>
          Your ZIP tells us which council, county, and school board seats you can vote on.
        </ScreenBody>

        <div className="flex flex-col gap-3 mt-6">
          <Label>ZIP code</Label>
          <Input
            value={zip}
            onChange={handleZipChange}
            placeholder="34984"
            type="text"
            inputMode="numeric"
            maxLength={5}
            error={!!error}
          />

          {ambiguous && (
            <Card className="bg-[#F5F7FA]">
              <p className="text-[13px] text-[#5A6B82] leading-5 [font-family:var(--font-instrument-sans)]">
                This ZIP crosses two City Council districts. Enter your street name only, no
                house number, so we can tell which side you&apos;re on.
              </p>
              <div className="mt-3">
                <Input
                  value={street}
                  onChange={setStreet}
                  placeholder="Street name (e.g. Becker Rd)"
                />
              </div>
            </Card>
          )}

          {error && <ErrorText>{error}</ErrorText>}

          {showBetaNotice && (
            <Card>
              <p className="text-[14px] font-semibold text-[#1B2B41] mb-1.5 [font-family:var(--font-instrument-sans)]">
                CivicMarket isn&apos;t available in your area yet
              </p>
              <p className="text-[13px] text-[#5A6B82] leading-5 [font-family:var(--font-instrument-sans)]">
                We&apos;re testing CivicMarket in Port St. Lucie, Florida, starting small so
                local election and civic data stays accurate. Check back as we expand.
              </p>
            </Card>
          )}
        </div>

        <div className="flex-1" />

        <div className="mt-8">
          <Btn onClick={handleSubmit} disabled={loading || zip.length !== 5}>
            {loading ? 'Finding your districts…' : 'Find my districts'}
          </Btn>
        </div>
      </div>
    </>
  );
}
