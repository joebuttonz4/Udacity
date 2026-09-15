'use client';

// Request a password reset link.
//
// Paired with /reset-password, which is where the emailed link lands. The
// dedicated redirect target IS the signal that someone arrived from the email —
// see src/lib/auth.ts for why detecting a "recovery session" client-side is a
// race we deliberately do not depend on.

import { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { resetRedirectUrl } from '@/lib/auth';
import { PageHeader, Card, Input, Label, Btn, ErrorText } from '@/components/navy';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSend() {
    setError('');

    if (!email.includes('@')) {
      setError('Enter the email address you signed up with.');
      return;
    }

    setSending(true);

    const { error: sendError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: resetRedirectUrl(),
    });

    setSending(false);

    if (sendError) {
      setError(sendError.message);
      return;
    }

    setSent(true);
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F7FA]">
      <PageHeader
        eyebrow="CivicMarket"
        title="Reset your password"
        sub="We'll email you a link to set a new one."
      />

      <div className="flex-1 px-5 pt-6 pb-10 flex flex-col">
        {sent ? (
          <Card>
            <p className="text-[12px] font-semibold text-[#0E2A47] uppercase tracking-[0.06em] [font-family:var(--font-instrument-sans)]">
              Check your inbox
            </p>
            <p className="text-[16px] font-bold text-[#1B2B41] mt-2 [font-family:var(--font-instrument-sans)]">
              If that address has an account, a link is on its way
            </p>
            <p className="text-[14px] text-[#5A6B82] leading-5 mt-2 [font-family:var(--font-instrument-sans)]">
              We sent it to{' '}
              <span className="text-[#1B2B41] font-medium">{email.trim()}</span>. Open it on
              this device if you can — the link signs you in to set a new password. It
              expires after a short time.
            </p>
            <p className="text-[13px] text-[#5A6B82] leading-5 mt-3 [font-family:var(--font-instrument-sans)]">
              Nothing after a few minutes? Check spam, then{' '}
              <button
                type="button"
                onClick={() => setSent(false)}
                className="font-semibold text-[#0E2A47] underline [font-family:var(--font-instrument-sans)]"
              >
                try again
              </button>
              .
            </p>
          </Card>
        ) : (
          <>
            {/* Deliberately not confirming whether an address has an account:
                that would turn this form into an account-existence oracle. */}
            <div className="flex flex-col gap-1.5">
              <Label>Email</Label>
              <Input
                value={email}
                onChange={(v) => {
                  setEmail(v);
                  setError('');
                }}
                placeholder="you@example.com"
                type="email"
                inputMode="email"
                autoComplete="email"
                error={!!error}
                onEnter={handleSend}
              />
              {error && <ErrorText>{error}</ErrorText>}
            </div>

            <div className="mt-6">
              <Btn onClick={handleSend} disabled={sending}>
                {sending ? 'Sending…' : 'Email me a reset link'}
              </Btn>
            </div>
          </>
        )}

        <div className="flex-1" />

        <p className="text-[13px] text-[#5A6B82] text-center leading-5 mt-8 [font-family:var(--font-instrument-sans)]">
          Remembered it?{' '}
          <Link href="/onboarding/signup" className="font-semibold text-[#0E2A47] underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
