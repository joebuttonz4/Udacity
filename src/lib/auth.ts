// Auth helpers shared by the password-reset flow.
//
// The client runs the IMPLICIT flow: @supabase/auth-js defaults
// `flowType: 'implicit'` and src/lib/supabase.ts passes no options. Recovery
// tokens therefore arrive in the URL fragment, which is never sent to the
// server — every part of this flow is client-side by necessity. No middleware,
// no route handler, no server component can see it.

/** Minimum password length. Must be >= the Supabase project's own minimum. */
export const PASSWORD_MIN = 8;

/**
 * Where the recovery email should land the user.
 *
 * Computed from the live origin rather than an env var so localhost and the
 * Vercel deployment both work from the same build. Both origins must be on the
 * Supabase Redirect URLs allow list — an unlisted value is silently ignored and
 * Supabase falls back to Site URL, which is indistinguishable from a code bug.
 *
 * Note this is captured when the reset is REQUESTED, not when the link is
 * opened. Requesting from localhost and opening the mail on a phone lands on
 * localhost and fails. That only affects testing; real users only see
 * production.
 */
export function resetRedirectUrl(): string {
  return `${window.location.origin}/reset-password`;
}

/**
 * Best-effort read of an error carried back in the URL fragment, e.g.
 * `#error=access_denied&error_code=otp_expired&error_description=...`.
 *
 * Best-effort because `detectSessionInUrl` strips the fragment via
 * history.replaceState once it has processed it, and that can win the race
 * against this read. When it does, the caller falls back to generic copy —
 * which is why nothing important depends on the result.
 */
export function hashErrorMessage(hash: string): string | null {
  if (!hash || !hash.includes('error')) return null;

  const params = new URLSearchParams(hash.replace(/^#/, ''));
  const code = params.get('error_code');
  const description = params.get('error_description');

  if (code === 'otp_expired') {
    return 'This link has expired. Password reset links are only good for a short time.';
  }
  if (description) return description.replace(/\+/g, ' ');
  if (params.get('error')) {
    return 'This link has expired or has already been used.';
  }
  return null;
}

/** Client-side password checks. Supabase enforces its own minimum server-side;
 *  this exists so the user hears about a problem before a round trip. */
export function passwordProblem(password: string, confirm: string): string | null {
  if (password.length < PASSWORD_MIN) {
    return `Use at least ${PASSWORD_MIN} characters.`;
  }
  if (password !== confirm) {
    return 'Those two passwords don’t match.';
  }
  return null;
}
