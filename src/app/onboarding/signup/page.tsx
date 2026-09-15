'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { PASSWORD_MIN } from '@/lib/auth';
import {
  OnboardingHeader,
  ScreenHeading,
  ScreenBody,
  Card,
  Label,
  Input,
  Btn,
  GhostBtn,
  ErrorText,
} from '../_components/OnboardingUI';

export default function SignupPage() {
  const router = useRouter();
  const [inviteCode, setInviteCode] = useState('');
  const [inviteError, setInviteError] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [pendingConfirmation, setPendingConfirmation] = useState(false);

  async function handleSignup() {
    setError('');
    setInviteError('');

    if (!inviteCode.trim()) {
      setInviteError('Enter your invite code.');
      return;
    }
    if (!email.includes('@')) {
      setError('Enter a valid email.');
      return;
    }
    if (password.length < PASSWORD_MIN) {
      setError(`Use at least ${PASSWORD_MIN} characters.`);
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/validate-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: inviteCode }),
      });
      const data = await res.json();
      if (!data.valid) {
        setInviteError('Invalid invite code. Please check your code and try again.');
        setLoading(false);
        return;
      }
    } catch {
      setInviteError('Could not verify invite code. Please try again.');
      setLoading(false);
      return;
    }

    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    if (!data.session) {
      setPendingConfirmation(true);
      setLoading(false);
      return;
    }

    router.push('/onboarding/zip');
  }

  async function handleLogin() {
    setError('');
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push('/');
  }

  if (pendingConfirmation) {
    return (
      <>
        <OnboardingHeader step={1} />
        <div className="flex-1 px-5 pt-6 pb-8 flex flex-col gap-4">
          <Card className="bg-[#F5F7FA]">
            <p className="text-[12px] font-semibold text-[#0E2A47] uppercase tracking-[0.06em] [font-family:var(--font-instrument-sans)]">
              Check your inbox
            </p>
            <p className="text-[16px] font-bold text-[#1B2B41] mt-2 [font-family:var(--font-instrument-sans)]">
              Confirm your email to continue
            </p>
            <p className="text-[14px] text-[#5A6B82] leading-5 mt-2 [font-family:var(--font-instrument-sans)]">
              We sent a confirmation link to <span className="text-[#1B2B41] font-medium">{email}</span>.
              Click it to activate your account, then sign in below.
            </p>
          </Card>
          <Btn onClick={handleLogin} disabled={loading}>
            I&apos;ve confirmed — sign me in
          </Btn>
          <GhostBtn onClick={() => { setPendingConfirmation(false); setError(''); }}>
            Use a different email
          </GhostBtn>
          {error && <ErrorText>{error}</ErrorText>}
        </div>
      </>
    );
  }

  return (
    <>
      <OnboardingHeader step={1} />
      <div className="flex-1 px-5 pt-6 pb-8 flex flex-col">
        <ScreenHeading>Your invite</ScreenHeading>
        <ScreenBody>
          Enter the code from your invitation, then create your account.
        </ScreenBody>

        <div className="flex flex-col gap-4 mt-6">
          <div className="flex flex-col gap-1.5">
            <Label>Invite code</Label>
            <Input
              value={inviteCode}
              onChange={(v) => { setInviteCode(v); setInviteError(''); }}
              placeholder="Enter your invite code"
              error={!!inviteError}
            />
            {inviteError && <ErrorText>{inviteError}</ErrorText>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Email</Label>
            <Input value={email} onChange={setEmail} placeholder="you@example.com" type="email" />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Password</Label>
            <Input
              value={password}
              onChange={setPassword}
              placeholder={`At least ${PASSWORD_MIN} characters`}
              type="password"
            />
          </div>

          {error && <ErrorText>{error}</ErrorText>}
        </div>

        <div className="flex-1" />

        <div className="flex flex-col gap-3 mt-8">
          <Btn onClick={handleSignup} disabled={loading}>
            {loading ? 'Creating account…' : 'Create account'}
          </Btn>
          <GhostBtn onClick={handleLogin} disabled={loading}>
            I already have an account
          </GhostBtn>
          {/* Grouped with the returning-user action, not with signup. */}
          <p className="text-[13px] text-center [font-family:var(--font-instrument-sans)]">
            <Link href="/forgot-password" className="text-[#0E2A47] underline font-semibold">
              Forgot your password?
            </Link>
          </p>
          <p className="text-[12px] text-[#8A99AD] text-center leading-5 [font-family:var(--font-instrument-sans)]">
            By continuing you agree to the{' '}
            <Link href="/terms" className="text-[#0E2A47] underline">Terms</Link> and{' '}
            <Link href="/privacy" className="text-[#0E2A47] underline">Privacy Policy</Link>.
            Your address is used only to find your districts. Never sold, never shared with campaigns.
          </p>
        </div>
      </div>
    </>
  );
}
