'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { OnboardingHeader, ScreenHeading, ScreenBody, Btn } from '../_components/OnboardingUI';

// The 8 locked civic_feed category keys (CLAUDE.md non-negotiable rules).
// Separate from the Civic DNA quiz's own dimension set — see
// CIVICMARKET_CURRENT_STATE.md, "civic_feed dimension keys" note.
const CATEGORIES: { key: string; label: string }[] = [
  { key: 'growth_development', label: 'Growth' },
  { key: 'taxes_budget', label: 'Taxes' },
  { key: 'infrastructure_traffic', label: 'Traffic' },
  { key: 'housing_affordability', label: 'Housing' },
  { key: 'public_safety', label: 'Safety' },
  { key: 'economic_development', label: 'Jobs' },
  { key: 'environment_land', label: 'Land' },
  { key: 'accountability_influence', label: 'Accountability' },
];

export default function IssuesPage() {
  const router = useRouter();
  const [top, setTop] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) router.push('/onboarding');
    });
  }, [router]);

  function toggle(key: string) {
    if (top.includes(key)) {
      setTop(top.filter((k) => k !== key));
    } else if (top.length < 3) {
      setTop([...top, key]);
    }
  }

  async function handleDone() {
    if (!top.length) return;
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { error } = await supabase
        .from('profiles')
        .update({ top_issues: top, onboarding_completed_at: new Date().toISOString() })
        .eq('id', user.id);

      if (error) console.error('[IssuesPage] profiles update failed:', error);
    }

    router.push('/');
  }

  return (
    <>
      <OnboardingHeader step={5} />
      <div className="flex-1 px-5 pt-6 pb-8 flex flex-col">
        <ScreenHeading>What matters most to you?</ScreenHeading>
        <ScreenBody>
          Pick up to three. These decide what you see first and what we alert you about.
          Change them anytime.
        </ScreenBody>

        <div className="flex flex-wrap gap-2 mt-6">
          {CATEGORIES.map(({ key, label }) => {
            const on = top.includes(key);
            return (
              <button
                key={key}
                type="button"
                onClick={() => toggle(key)}
                className={`h-11 px-4 rounded-full text-[14px] font-semibold border transition-colors [font-family:var(--font-instrument-sans)] ${
                  on
                    ? 'bg-[#0E2A47] border-[#0E2A47] text-white'
                    : 'bg-white border-[#E4E9F0] text-[#1B2B41]'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        <p className="text-[12px] text-[#8A99AD] mt-4 [font-family:var(--font-instrument-sans)]">
          {top.length} of 3 picked
        </p>

        <div className="flex-1" />

        <div className="mt-8">
          <Btn onClick={handleDone} disabled={!top.length || loading}>
            {loading ? 'Setting up your feed…' : top.length ? 'Show me my backyard' : 'Pick at least one'}
          </Btn>
        </div>
        <p className="text-[12px] text-[#8A99AD] text-center mt-4 leading-5 [font-family:var(--font-instrument-sans)]">
          Want candidate match scores too? You can take the Civic DNA quiz anytime from
          your Ballot tab.
        </p>
      </div>
    </>
  );
}
