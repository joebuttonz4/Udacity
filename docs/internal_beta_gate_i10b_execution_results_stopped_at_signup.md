# Internal Beta — Gate I10B: Execution Results (Stopped at Signup)

## 1. Date and timestamp

Date: 07-09-2026
Timestamp: 04:35 pm EDT

## 2. Current repo baseline

- Branch: `master`, working tree clean, up to date with `origin/master`.
- Latest pushed commit at the start of this gate: `20e01e1` ("Document Gate I10B fresh account decision").
- No application code was changed as part of this gate.
- `ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE = false`, unchanged. No deployment occurred. No County Commission action, review submission, or `user_districts` write outside the (never-reached) approved ZIP-entry step was attempted.

## 3. Approval and scope

Gate I10B was explicitly approved with:

- Test account: `civicmarket.test.05@example.com` / `CivicMarketTest123!` (fresh account, per the Gate I10B decision note).
- Invite code: provided directly by the user.
- Approved write scope: signup → ZIP/district step → Civic DNA quiz → calculating/match-score path.
- Explicit clarification obtained before execution: the "ZIP/district step" was confirmed to include its normal `user_districts` write (the standard 5-row PSL set via delete-then-insert) — the user resolved an apparent conflict between "approve the ZIP step" and "do not modify user_districts" by confirming the former, standard onboarding write is expected and approved, and only a County-Commission-related or out-of-band write to that table remained prohibited.
- Explicitly excluded from this gate: review submission, County Commission write execution, deployment.
- Explicit instruction: stop at the "check your inbox" email-confirmation state if the signup flow produces one.

## 4. Methodology

Consistent with Gate I9B's approach: no browser automation was available, so every action was performed by calling the exact same HTTP endpoints the app's own client code calls, using a locally running production server (`npm run start`) for the one server-side route involved (`/api/validate-invite`), and Supabase's own REST/Auth endpoints directly (the same requests `supabase.auth.signUp()` and the rest of the onboarding flow make) for everything else.

## 5. What was executed

1. **Local server started.** `npm run start`; `/` returned `200`.
2. **Invite code validated.** `POST /api/validate-invite` with the provided code returned `{"valid":true}` — the real, currently-configured `INVITE_CODE` env var was confirmed working, matching this route's documented behavior.
3. **Signup attempted.** `POST {SUPABASE_URL}/auth/v1/signup` with `email: "civicmarket.test.05@example.com"`, `password: "CivicMarketTest123!"` — the identical request `supabase.auth.signUp()` issues from `src/app/onboarding/signup/page.tsx`.

## 6. Stop condition triggered

**The signup request was rejected by Supabase's Auth API itself, before any account, session, or data row of any kind was created.**

Live response:

```json
{
  "code": 400,
  "error_code": "email_address_invalid",
  "msg": "Email address \"civicmarket.test.05@example.com\" is invalid"
}
```

This is not an application bug — `src/app/onboarding/signup/page.tsx` correctly surfaces whatever error `supabase.auth.signUp()` returns (`setError(error.message); setLoading(false); return;`), and a real user hitting this in the actual UI would see the same rejection before any onboarding step proceeds. The rejection happened at the Supabase Auth service level, prior to and independent of any app code.

**Likely cause (not independently confirmed in this gate):** Supabase Auth commonly enables an email-validation setting that rejects addresses on known non-deliverable or example/reserved domains (`example.com`, `example.org`, `example.net`, RFC 2606 reserved domains) at signup time. This would explain why this specific address was rejected while the two pre-existing test accounts (`civicmarket.test.01@example.com`, `civicmarket.test.04@example.com`) already exist and work fine today — that validation, if it is the cause, would only run at signup time, not retroactively against already-created accounts. This gate did not attempt to verify the Supabase Auth dashboard's exact email-validation configuration, since doing so was outside this gate's read-only-plus-approved-writes scope and is better confirmed directly by the user, who has dashboard access this environment does not.

Per the explicit instruction to "stop at inbox confirmation if required," and by direct extension, to stop at any signup-blocking condition rather than work around it unapproved (e.g., silently trying a different email domain not explicitly approved), execution stopped here.

## 7. What was NOT executed

Because signup itself did not succeed, none of the following was reached or attempted:

- No `auth.users` row was created.
- No `profiles` row was created (the `handle_new_user()` trigger never fired, since no `auth.users` row exists to trigger on).
- ZIP entry (`profiles.zip_code` update, `user_districts` delete-then-insert) — not attempted.
- Districts confirmation (`follows` upsert) — not attempted.
- Civic DNA quiz (`civic_dna_answers` upserts, `civic_dna` insert) — not attempted.
- Match-score computation (`match_scores` delete-then-insert via `/api/compute-match-scores`) — not attempted.
- No review submission, no County Commission action — both were out of scope for this gate regardless, and remain untouched.

## 8. Verification that nothing was written

Since the signup call itself failed with a `400` before Supabase created anything, there is no new row in any table to verify against — the failure response itself (`error_code: "email_address_invalid"`, no `access_token`, no `session`, no `user` object) is the confirmation that no account or session was created. No read-back query was needed or run.

## 9. Cleanup performed

- The local server process was stopped immediately after the stop condition was reached.
- All scratch files created during this gate — including the one containing the invite code — were deleted from the local scratchpad directory.
- No account, session, or data row exists to clean up, since none was created.

## 10. Recommendation

This is a live, real blocker that needs a decision from the user before Gate I10B can proceed further — it is not something to resolve unilaterally:

1. **Most likely fix:** use a different test email domain that Supabase's Auth API will accept (a real, deliverable-looking domain the user controls, or a domain not on the reserved/example list) — but this requires the user to specify or approve the replacement address, since `civicmarket.test.05@example.com` was the explicitly approved value and substituting a different one is a scope change, not a technical detail.
2. **Alternative:** the user could check the Supabase project's Auth settings (Authentication → Settings → email validation / allowed domains, or similar) to see whether `example.com` specifically is blocked, and adjust that setting if appropriate for a controlled beta test environment — this is a dashboard action outside this environment's access.
3. **Alternative:** reconsider Option B (reuse `civicmarket.test.04@example.com`) from `docs/internal_beta_gate_i10a_onboarding_civic_dna_readiness_plan.md` Section 8, accepting the documented stale-`civic_dna`-row side effect, since that account is already known to work.

No further action was taken in this gate beyond what is documented above. Gate I10B remains incomplete and requires a new decision on the email/account approach before it can resume.
