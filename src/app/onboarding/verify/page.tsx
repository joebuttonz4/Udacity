'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import {
  OnboardingHeader,
  ScreenHeading,
  ScreenBody,
  Label,
  Input,
  Btn,
  GhostBtn,
  ErrorText,
} from '../_components/OnboardingUI';

export default function VerifyPage() {
  const router = useRouter();
  const [address, setAddress] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) router.push('/onboarding');
    });
  }, [router]);

  async function handleSave() {
    if (!/\d+\s+\S+/.test(address)) {
      setError('Enter a street address with a house number.');
      return;
    }
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          street_address: address.trim(),
          address_validation_source: 'self_reported',
        })
        .eq('id', user.id);

      if (updateError) console.error('[VerifyPage] profiles update failed:', updateError);
    }

    router.push('/onboarding/issues');
  }

  return (
    <>
      <OnboardingHeader step={4} />
      <div className="flex-1 px-5 pt-6 pb-8 flex flex-col">
        <ScreenHeading>Where in Port St. Lucie do you live?</ScreenHeading>
        <ScreenBody>
          This is self-reported — we don&apos;t check it against USPS or any government
          database. It&apos;s simply how we know you&apos;re a real Port St. Lucie resident.
          It&apos;s never shown, never sold, never shared with a campaign.
        </ScreenBody>

        <div className="flex flex-col gap-1.5 mt-6">
          <Label>Street address</Label>
          <Input
            value={address}
            onChange={(v) => { setAddress(v); setError(''); }}
            placeholder="1234 SW Becker Rd"
            error={!!error}
          />
          {error && <ErrorText>{error}</ErrorText>}
        </div>

        <p className="text-[12px] text-[#8A99AD] mt-3 [font-family:var(--font-instrument-sans)]">
          Telling us your address lets you comment and have your votes on agenda items
          count toward neighbor totals.
        </p>

        <div className="flex-1" />

        <div className="flex flex-col gap-3 mt-8">
          <Btn onClick={handleSave} disabled={loading}>
            {loading ? 'Saving…' : 'Save my address'}
          </Btn>
          <GhostBtn onClick={() => router.push('/onboarding/issues')} disabled={loading}>
            Skip for now
          </GhostBtn>
        </div>
        <p className="text-[12px] text-[#8A99AD] text-center mt-4 [font-family:var(--font-instrument-sans)]">
          You can skip this and still read everything. You&apos;ll be asked again the first
          time you try to comment or vote.
        </p>
      </div>
    </>
  );
}
