'use client';

import { useRouter } from 'next/navigation';
import { OnboardingHeader, ScreenHeading, ScreenBody, Btn } from './_components/OnboardingUI';

const VALUE_PROPS = [
  'Agenda items in plain English, tagged to what you care about',
  'Weigh in, and see what your neighbors think',
  'Get told what happened after the vote',
];

export default function WelcomePage() {
  const router = useRouter();

  return (
    <>
      <OnboardingHeader step={0} />
      <div className="flex-1 px-5 pt-6 pb-8 flex flex-col">
        <ScreenHeading>
          Know what&apos;s happening in your backyard before it&apos;s decided.
        </ScreenHeading>
        <ScreenBody>
          Every week, City Hall and the County vote on things that change your street:
          rezonings, rate hikes, roads, police. Most people find out after. You won&apos;t.
        </ScreenBody>

        <div className="flex flex-col gap-3 mt-6">
          {VALUE_PROPS.map((t) => (
            <div key={t} className="flex items-start gap-3">
              <span className="text-[#0E2A47] font-bold mt-0.5">✓</span>
              <span className="text-[14px] text-[#1B2B41] leading-5 [font-family:var(--font-instrument-sans)]">
                {t}
              </span>
            </div>
          ))}
        </div>

        <div className="flex-1" />

        <div className="flex flex-col gap-3 mt-8">
          <Btn onClick={() => router.push('/onboarding/signup')}>I have an invite code</Btn>
          <p className="text-[12px] text-[#8A99AD] text-center [font-family:var(--font-instrument-sans)]">
            Invite-only during beta. Free for residents, always. No ads.
          </p>
        </div>
      </div>
    </>
  );
}
