'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function SignupPage() {
  const router = useRouter();
  const [inviteCode, setInviteCode] = useState('');
  const [inviteError, setInviteError] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSignup() {
    setError('');
    setInviteError('');
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

    const { error } = await supabase.auth.signUp({ email, password });

    if (error) {
      setError(error.message);
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

  return (
    <div className="flex-1 flex flex-col items-center justify-between px-6 py-12 min-h-screen">

      {/* Header */}
      <div className="flex flex-col items-center pt-8 w-full max-w-sm">
        <button
          onClick={() => router.back()}
          className="self-start text-[#6B7280] hover:text-white transition-colors mb-8"
        >
          ← Back
        </button>
        <h2
          className="text-2xl font-bold text-white text-center"
          style={{ fontFamily: 'var(--font-syne)' }}
        >
          Create your account
        </h2>
        <p className="text-[#6B7280] text-sm text-center mt-2">
          Free forever. Your data is never sold.
        </p>
      </div>

      {/* Form */}
      <div className="flex flex-col gap-4 w-full max-w-sm">
        <div className="flex flex-col gap-1">
          <label
            className="text-[#9CA3AF] text-xs font-medium"
            style={{ fontFamily: 'var(--font-syne)' }}
          >
            Invite Code
          </label>
          <input
            type="text"
            value={inviteCode}
            onChange={(e) => { setInviteCode(e.target.value); setInviteError(''); }}
            placeholder="Enter your invite code"
            autoCapitalize="none"
            autoCorrect="off"
            className="h-12 bg-[#1F2937] border border-[#374151] rounded-xl px-4 text-white placeholder-[#4B5563] focus:outline-none focus:border-[#00C9A7] transition-colors"
          />
          {inviteError && (
            <p className="text-[#FF6B6B] text-xs mt-1">{inviteError}</p>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <label
            className="text-[#9CA3AF] text-xs font-medium"
            style={{ fontFamily: 'var(--font-syne)' }}
          >
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="h-12 bg-[#1F2937] border border-[#374151] rounded-xl px-4 text-white placeholder-[#4B5563] focus:outline-none focus:border-[#00C9A7] transition-colors"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label
            className="text-[#9CA3AF] text-xs font-medium"
            style={{ fontFamily: 'var(--font-syne)' }}
          >
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 6 characters"
            className="h-12 bg-[#1F2937] border border-[#374151] rounded-xl px-4 text-white placeholder-[#4B5563] focus:outline-none focus:border-[#00C9A7] transition-colors"
          />
        </div>

        {error && (
          <p className="text-[#FF6B6B] text-sm text-center">{error}</p>
        )}
      </div>

      {/* Consent notice */}
      <p className="text-[#6B7280] text-xs text-center w-full max-w-sm [font-family:var(--font-instrument-sans)]">
        By creating an account you agree to our{' '}
        <Link href="/terms" className="text-[#00C9A7] underline hover:text-[#00A688]">
          Terms of Service
        </Link>{' '}
        and{' '}
        <Link href="/privacy" className="text-[#00C9A7] underline hover:text-[#00A688]">
          Privacy Policy
        </Link>
        .
      </p>

      {/* CTAs */}
      <div className="flex flex-col items-center gap-3 w-full max-w-sm">
        <button
          onClick={handleSignup}
          disabled={loading}
          className="w-full h-14 bg-[#00C9A7] hover:bg-[#00A688] disabled:opacity-50 text-[#0D1117] font-bold rounded-2xl transition-colors"
          style={{ fontFamily: 'var(--font-syne)' }}
        >
          {loading ? 'Creating account...' : 'Create account'}
        </button>
        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full h-14 bg-transparent border border-[#374151] hover:border-[#00C9A7] disabled:opacity-50 text-white font-medium rounded-2xl transition-colors"
          style={{ fontFamily: 'var(--font-syne)' }}
        >
          I already have an account
        </button>
      </div>

    </div>
  );
}