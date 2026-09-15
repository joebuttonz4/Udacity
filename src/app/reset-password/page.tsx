'use client';

// Set a new password. This is where the emailed recovery link lands.
//
// HOW ARRIVAL IS DETECTED
// The client runs the implicit flow, so the recovery token comes back in the
// URL fragment and `detectSessionInUrl` turns it into a session during client
// init. Two things follow:
//
//   1. PASSWORD_RECOVERY is emitted during that init, which can happen BEFORE
//      this component mounts and subscribes. Relying on the event alone is a
//      race, so getSession() is the primary check and the subscription is
//      belt-and-braces for the case where the event lands late.
//
//   2. There is no reliable client-side way to tell a recovery session from a
//      normal one, and no need to. `redirectTo` pointing here is the signal
//      that someone came from the email, and Supabase is the authority on
//      whether the token was valid — an invalid or expired one yields no
//      session at all. A already-signed-in user who reaches this route simply
//      changes their password, which is a legitimate thing to do.

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { PASSWORD_MIN, hashErrorMessage, passwordProblem } from '@/lib/auth';
import { PageHeader, Card, Input, Label, Btn, GhostBtn, ErrorText } from '@/components/navy';

export default function ResetPasswordPage() {
  const router = useRouter();

  const [checking, setChecking] = useState(true);
  const [ready, setReady] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let cancelled = false;

    // Late-arriving PASSWORD_RECOVERY, for the case where init had not
    // finished when this component mounted.
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (cancelled || !session) return;
      setReady(true);
      setChecking(false);
    });

    async function check() {
      // Read before awaiting: detectSessionInUrl clears the fragment once it
      // has processed it, and this read can lose that race. Best-effort by
      // design — the generic copy covers us when it comes back empty.
      const hash = typeof window === 'undefined' ? '' : window.location.hash;

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (cancelled) return;

      if (session) {
        setReady(true);
      } else {
        setLinkError(hashErrorMessage(hash));
      }
      setChecking(false);
    }

    check();

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  async function handleSave() {
    setError('');

    const problem = passwordProblem(password, confirm);
    if (problem) {
      setError(problem);
      return;
    }

    setSaving(true);

    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setError(updateError.message);
      setSaving(false);
      return;
    }

    // A reset exists partly for the case where someone else knew the old
    // password. Leaving their sessions alive would defeat the exercise. A
    // failure here must not block the success state — the password did change.
    const { error: signOutError } = await supabase.auth.signOut({ scope: 'others' });
    if (signOutError) {
      console.error('[ResetPassword] signOut(others) failed:', signOutError);
    }

    setSaving(false);
    setDone(true);
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F7FA]">
      {/* The header must not promise a form that isn't there. Only the ready
          state gets the "choose a password" framing; a dead link and the
          initial check both stay neutral. */}
      <PageHeader
        eyebrow="CivicMarket"
        title={done ? 'Password updated' : ready ? 'Set a new password' : 'Reset your password'}
        sub={!done && ready ? 'Choose something you haven’t used here before.' : undefined}
      />

      <div className="flex-1 px-5 pt-6 pb-10 flex flex-col">
        {checking && (
          <Card className="animate-pulse">
            <div className="h-3 w-32 bg-[#E4E9F0] rounded" />
            <div className="h-3 w-48 bg-[#F5F7FA] rounded mt-3" />
          </Card>
        )}

        {!checking && done && (
          <>
            <Card>
              <p className="text-[16px] font-bold text-[#1B2B41] [font-family:var(--font-instrument-sans)]">
                You&apos;re signed in with your new password
              </p>
              <p className="text-[14px] text-[#5A6B82] leading-5 mt-2 [font-family:var(--font-instrument-sans)]">
                Anyone else signed in to your account has been signed out. Your old password
                no longer works.
              </p>
            </Card>
            <div className="mt-6">
              {/* `/` sends a half-onboarded account to /onboarding/zip on its
                  own, so there is no resume logic to duplicate here. */}
              <Btn onClick={() => router.push('/')}>Go to your feed</Btn>
            </div>
          </>
        )}

        {/* Never a dead end: everyone who sees this is already locked out. */}
        {!checking && !done && !ready && (
          <>
            <Card>
              <p className="text-[16px] font-bold text-[#1B2B41] [font-family:var(--font-instrument-sans)]">
                This link didn&apos;t work
              </p>
              <p className="text-[14px] text-[#5A6B82] leading-5 mt-2 [font-family:var(--font-instrument-sans)]">
                {linkError ?? 'This link has expired or has already been used.'}
              </p>
            </Card>
            <div className="flex flex-col gap-3 mt-6">
              <Btn onClick={() => router.push('/forgot-password')}>Send me a new link</Btn>
              <GhostBtn onClick={() => router.push('/onboarding/signup')}>Sign in</GhostBtn>
            </div>
          </>
        )}

        {!checking && !done && ready && (
          <>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label>New password</Label>
                <Input
                  value={password}
                  onChange={(v) => {
                    setPassword(v);
                    setError('');
                  }}
                  placeholder={`At least ${PASSWORD_MIN} characters`}
                  type="password"
                  autoComplete="new-password"
                  error={!!error}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label>Confirm new password</Label>
                {/* The confirm field is the point of this screen: a typo here
                    locks the user out a second time, from the page that exists
                    to unlock them. */}
                <Input
                  value={confirm}
                  onChange={(v) => {
                    setConfirm(v);
                    setError('');
                  }}
                  placeholder="Type it again"
                  type="password"
                  autoComplete="new-password"
                  error={!!error}
                  onEnter={handleSave}
                />
              </div>

              {error && <ErrorText>{error}</ErrorText>}
            </div>

            <div className="mt-6">
              <Btn onClick={handleSave} disabled={saving}>
                {saving ? 'Saving…' : 'Save new password'}
              </Btn>
            </div>
          </>
        )}

        <div className="flex-1" />

        {!done && (
          <p className="text-[13px] text-[#5A6B82] text-center leading-5 mt-8 [font-family:var(--font-instrument-sans)]">
            Need help?{' '}
            <Link href="/onboarding/signup" className="font-semibold text-[#0E2A47] underline">
              Back to sign in
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
