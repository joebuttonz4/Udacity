# Controlled PSL Beta Readiness — Milestone 2B

Date: 08-18-2026

Status: **READY AFTER SPECIFIC ITEMS.** Documentation and verification only. No deployment, no database writes, no write-guard changes, no schema/RLS/grant/policy/function/migration/seed/district-definition changes occurred as part of this task.

## Repository baseline at start of this task

- Branch: `master`
- Working tree: up to date with `origin/master`
- Latest pushed commit at start: `79779ca` Validate ZIP resubmission preserves City Council district
- One untracked, unrelated concurrent-work item present and left untouched: `src/app/api/admin/extract-shannon-martin-evidence/route.ts` (not part of this task's scope; not committed, not inspected further, not modified)

## Correction to prior readiness material

Per explicit instruction, the item "every onboarded user defaults to City Council District 1 regardless of address" is **CLOSED**, not an open limitation:
- Gate I36 removed City Council District 1 from the ZIP auto-assignment array (`ZIP_MANAGED_DISTRICTS`).
- Milestone 1 proved live that a fresh account received exactly five safe district rows and zero City Council District 1/3 rows.
- Milestone 2A proved live that an existing verified City Council District 1 assignment survives ZIP resubmission unmodified, and that District 3 never appears for that account.

---

## Item 1 — City Council District 1 election date

**Official-source conclusion: the live database value is not simply wrong — Port St. Lucie uses a majority/runoff system, and the single-value `election_date` field cannot represent it.**

Findings, cross-checked across independent sources:

- **St. Lucie County Supervisor of Elections** (`stlucievotes.gov`, official county elections authority) confirms two real 2026 election dates exist: **Primary Election Day — August 18, 2026** and **General Election Day — November 3, 2026**.
- A third-party voter guide (theballotbrief.com) states the applicable rule for Port St. Lucie city races and explicitly attributes it to "the city clerk's elections page": *a majority winner is elected outright in the August 18 election; otherwise the top two candidates meet in a November 3 runoff.*
- Independent historical corroboration: a WPTV news report on the 2022 Port St. Lucie Mayor race states the winner (Shannon Martin) won with "more than 63% of the vote" and explicitly "avoided a runoff" — confirming this majority/runoff mechanic is a real, previously-exercised feature of Port St. Lucie citywide elections, not a hypothetical.
- Direct attempts to fetch the City of Port St. Lucie City Clerk elections page and the Municode-hosted City Charter (the two most authoritative primary sources) both returned HTTP 403 to automated fetch and could not be read directly. The conclusion above rests on the county SOE's own dates page (official, directly fetched) plus a third-party source that explicitly cites the city clerk's page, not a direct quote of the charter text itself.

**Conclusion:** August 18, 2026 is the Primary/first election, where District 1 is decided outright if one candidate wins a majority. If no candidate reaches a majority, November 3, 2026 is the runoff/General that actually decides the seat. **Today (2026-08-18) is Primary Election Day** — the outcome is not yet known from any source consulted. With multiple candidates on the District 1 ballot, a runoff is plausible but not confirmed; no outcome was guessed or assumed.

**Implication for the schema:** the live `election_date = 2026-11-03` value is only correct in the scenario where a runoff occurs; the earlier-documented `2026-08-18` is only correct in the scenario where a majority winner is decided outright. A single-value `election_date` column cannot correctly represent this conditional structure for any race with more than two candidates. This is a data-model limitation, not a simple "wrong value" to overwrite.

**No database change was made.** Per instruction, this is flagged as requiring separate explicit write approval — and, more specifically, a separate explicit **decision** on how to model the primary/runoff distinction (e.g., separate `primary_election_date` / `general_election_date` columns, or waiting for the actual outcome to be certified before setting a single date) before any write is even drafted.

---

## Item 2 — City Council write-guard decision preparation

Reviewed `src/app/api/set-city-council-district/route.ts` and `src/app/profile/city-council-district/page.tsx` directly (current committed code, unchanged since Gate I34).

**Can a beta user correctly verify and SAVE District 1/3 while the guard is false?**
No. The route's early-return dry-run boundary (`ENABLE_CITY_COUNCIL_DISTRICT_WRITE = false`, line 10 of the route file) makes every `.rpc()` call in the file unreachable. A user can complete the full flow (official lookup link → select District 1 or 3 → attest → submit) and will receive HTTP 200 with `dryRun: true` and the message *"Write path disabled pending explicit approval. No user_districts row was created or modified."* — nothing is persisted.

**What misleading or incomplete UX results while false?**
None found. The UI is explicit and honest about the disabled state in three places: a header line ("Preview only — saving is currently disabled"), the submit button never claims otherwise, and a dedicated amber disclaimer card ("Beta preview. Saving is intentionally disabled..."). The success message shown on a dry-run response reads the API's own dry-run message rather than a hardcoded "saved" string, so there is no code path that can show a false success. This was verified by direct code read, matching Gate I30's prior live-UI finding.

**Is there any remaining technical defect that argues against enabling it?**
No known defect. Gate I31 found and Gate I32/I33 fixed a real Postgres ambiguous-column bug (`42702`) in the `set_psl_city_council_district` RPC. Gate I34 is the load-bearing evidence: it performed a real, non-dry-run District 1 → District 3 → District 1 round trip against the live RPC through the actual API route and UI, and independently verified both the temporary and final states live (Current Officials and Ballot content changed and reverted correctly each time). That is the first and only real (non-dry-run) invocation of this RPC to date, and it passed in both directions.

**What exact code/config/deployment change would be required to enable it?**
One line: `const ENABLE_CITY_COUNCIL_DISTRICT_WRITE = false` → `true` in `src/app/api/set-city-council-district/route.ts`. This is a source-controlled boolean constant, not an environment variable or per-user/per-account flag — there is no mechanism in the current code to scope it to selected test users. Flipping it requires a code change, a commit, and a deploy of the built app; every prior "test-account-only" write (Gate I31, Gate I34) was achieved by flipping the flag locally, never committing it, testing against a local dev server, and reverting before any commit — not through a supported production-safe partial rollout.

**Would that change affect all users or only selected test users?**
All users. Once deployed with the flag `true`, every authenticated user's real submission through `/profile/city-council-district` would perform a real, atomic write via the RPC — there is no accompanying user allowlist or feature-flag scoping in the code today.

**Recommendation, framed strictly as requested:** **Technically ready to enable**, based on Gate I34's real end-to-end round-trip pass and the absence of any known outstanding defect. This is a technical readiness statement only — the product decision of whether/when to enable it, and how to scope a production rollout (all-users-at-once is the only option the current code supports), is left to the user. **The guard was not changed. No write approval is requested or implied by this finding.**

---

## Item 3 — Corrections email

`mailto:inaccuracy@civicmarket.app` appears in exactly two application source files:
- `src/app/corrections/page.tsx` (static Corrections Policy page, plain link)
- `src/app/measures/[id]/page.tsx` (Measure Profile, pre-filled subject/body mailto link labeled "Report an Inaccuracy")

**A related inconsistency was found (not fixed, per this task's read-only scope):** the Candidate Profile page's "Report an Inaccuracy" link (`src/app/candidates/[id]/page.tsx`) points to `/report` — the database-backed submission flow (`inaccuracy_reports` table, RLS-protected, "Report received" success state) — not to the mailto link. So there are currently **two different, inconsistent "Report an Inaccuracy" mechanisms** live in the app: a tracked database submission for candidates, and an untracked raw email link for ballot measures and the static Corrections Policy page.

**Does the app assume the mailbox is monitored?** Yes, implicitly. The Corrections Policy page tells users they can "report it to us at any time... by emailing us directly," and the measure-profile mailto link is the *only* reporting mechanism for measure inaccuracies (there is no database-backed measure-report path). If nobody monitors `inaccuracy@civicmarket.app`, measure-inaccuracy reports have no fallback.

**What I cannot verify:** whether `inaccuracy@civicmarket.app` is a real, deliverable, monitored mailbox. No email/DNS/credential access was attempted, per instruction.

**One simple manual check for you to perform:** send a test email to `inaccuracy@civicmarket.app` from any personal address and confirm (a) it does not bounce, and (b) it lands in an inbox someone on the team actually checks before the first beta invite goes out.

---

## Item 4 — Mobile / narrow-viewport smoke test

**Tooling result — improved from prior gates, but incomplete.** Prior gates (I17, I21, I30) found `resize_window` completely ineffective (viewport stuck at 1920px). Re-tested this session: `resize_window` now visibly narrows the actual rendered viewport, but appears to floor at approximately **500px width** in this environment regardless of a smaller requested width (390px and 375px requests both resulted in an actual 500px `window.innerWidth`). This is closer to a true narrow-viewport test than before, but does not reach the requested ~390px target.

**Pages actually tested live at ~500px width:** `/onboarding` (public) and `/corrections` (public). Both rendered with no horizontal overflow (`document.documentElement.scrollWidth` did not exceed `window.innerWidth` on either page), no clipped text, and legible layout; `/corrections` showed the bottom navigation bar rendering correctly at this width.

**Pages NOT tested live:** onboarding completion/calculating, ballot, profile, and the City Council district verification page. All four require an authenticated session, and no signed-in browser session was available in this task — per the standing rule that the assistant never enters or requests credentials, none was created. This is a genuine coverage gap for this specific smoke test, not a fabricated pass.

**One manual real-device/browser test for you to perform:** with an already-signed-in test account, open the app on an actual phone (or your browser's real device-emulation/DevTools responsive mode, which correctly enforces an exact width unlike this session's tool) at ~390px width and check: onboarding-complete/calculating screen, Ballot, Profile, and `/profile/city-council-district` — confirming no horizontal scroll, primary buttons visible without scrolling sideways, bottom nav usable, and the District 1/3 radio choices plus attestation checkbox are each tappable without overlap.

---

## Item 5 — Supabase Auth redirect readiness

Code-only inspection; no secret files were opened.

- No hardcoded `localhost` redirect, no `redirectTo`/`emailRedirectTo` call, and no `NEXT_PUBLIC_SITE_URL`-style variable exist anywhere in `src/` — signup/signin (`src/app/onboarding/signup/page.tsx`) call plain `supabase.auth.signUp()` / sign-in with no explicit redirect URL argument, and `src/lib/supabase.ts` constructs the client from `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` only.
- No Google OAuth (or any OAuth provider) code exists anywhere in `src/`. The only "google" match in the codebase is `next/font/google` (a font import, unrelated to auth). **Google OAuth redirect configuration is not required by the current app** — confirmed by absence of any `signInWithOAuth` call.
- Because there is no hardcoded redirect URL in code, the redirect behavior is entirely controlled by the Supabase project's dashboard **Auth → URL Configuration** settings (Site URL + Additional Redirect URLs), which this task did not and could not inspect (dashboard access, not a code artifact).

**Concise deployment-time checklist (manual, outside Claude):**
1. Once the production/beta domain is known, set it as the Supabase **Site URL**.
2. Add the exact production URL (and any preview/staging URL actually used) to Supabase **Additional Redirect URLs** — the email-confirmation link (`src/app/onboarding/signup/page.tsx`'s pending-confirmation flow) will not correctly return users to the app otherwise.
3. Confirm the Supabase **email confirmation toggle** (documented as ON as of July 2, 2026) is still ON in the production project before the first invite.
4. No Google/OAuth provider configuration is needed — skip it.
5. No code change is required for this step; it is a Supabase-dashboard-only checklist item.

---

## Item 6 — Fresh end-to-end signup readiness

**Already proven locally (Milestone 1, `civicmarket.test.05@example.com`), not re-tested here to avoid duplication:** fresh signup account → ZIP onboarding → exactly five safe `user_districts` rows, zero City Council rows → onboarding-completion screen showing both the primary "View my ballot" CTA and the secondary "Verify your City Council district →" link → Current Officials, Ballot, Profile, and Home all rendering correctly with no City Council content → the verification page confirmed dry-run-only.

**Still to be verified against the actual first-beta configuration (not yet tested, because they depend on the real deployed environment, not local dev):**
- **Invite-code behavior** in production: `/api/validate-invite` reads `INVITE_CODE` from the server environment and fails closed if missing (confirmed by code, not re-read here since it was already verified working May 2026) — this needs a real signup attempt against the deployed production environment with the actual production `INVITE_CODE` value set, which cannot be done from local dev.
- **Email confirmation behavior** in production: the pending-confirmation UI code path is proven locally, but whether the actual confirmation email is deliverable and correctly links back to the production domain depends on Item 5's Supabase redirect configuration, which is not yet set (no production domain exists yet per this task's scope).
- **Deployed-domain redirect behavior**: cannot be verified until a real deploy target exists — this is inherently a post-deploy check, not something local dev or code review can substitute for.

None of these three can be meaningfully tested before a deploy target and its Supabase Auth URL configuration exist — they are deploy-time verification items, not code defects.

---

## Beta readiness reconciliation

### MUST FIX BEFORE DEPLOY
*(none identified — no evidence-based defect found that blocks deploy)*

### MUST MANUALLY CONFIRM BEFORE DEPLOY
1. **District 1 election-date data-model decision** (Item 1) — decide how to represent the Primary/runoff conditional structure before treating either `2026-08-18` or `2026-11-03` as "the" correct single value; no database write until this decision is made and separately approved.
2. **Corrections-mailbox deliverability** (Item 3) — confirm `inaccuracy@civicmarket.app` is real, deliverable, and monitored by sending a test email; also decide (separately) whether to reconcile the candidate-profile-vs-measure-profile inconsistency in how "Report an Inaccuracy" is handled.
3. **Mobile smoke test on the four auth-gated screens** (Item 4) — onboarding-complete/calculating, Ballot, Profile, and `/profile/city-council-district` were not live-tested at true mobile width in this task; perform the one manual real-device check described in Item 4.
4. **Supabase Auth URL configuration** (Item 5) — Site URL and Additional Redirect URLs must be set to the real production domain once known; confirm email-confirmation toggle is still ON in production.
5. **Invite-code and email-confirmation behavior against the actual deployed environment** (Item 6) — these are inherently deploy-time checks; verify with a real signup attempt once a deploy target exists.

### ACCEPTABLE FOR FIRST INVITE WAVE
- City Council write guard remaining `false` (Item 2): technically ready to enable, but leaving it `false` means brand-new beta invitees (who no longer get a default City Council District 1 assignment per the now-closed Gate I36 fix) will have **no City Council district and no City Council ballot content or Current Official at all** unless/until the guard is enabled — this was confirmed to render safely (no crash, no misleading UI) in Milestone 1. Acceptable for a small, trusted first invite wave; **flagged here as a real product consequence to be aware of, not silently absorbed.**
- District 1 election-date ambiguity (Item 1) does not block deploy — it affects a display field's precision, not app safety or data integrity, and District 1 candidate visibility/voting-record/locked-ring behavior are all unaffected regardless of which date is shown.
- Candidate-profile vs. measure-profile inaccuracy-reporting inconsistency (Item 3) — cosmetic/process inconsistency, not a defect that blocks a small trusted first wave.

### POST-BETA
- Resolving the District 1 election-date schema limitation properly (e.g., adding separate primary/general date fields) once the actual 2026 outcome is known.
- Deciding whether to unify Report-an-Inaccuracy on the database-backed `/report` flow for measures too, retiring the mailto link.
- District 3 user-assignment and Current Officials remain scoped to Internal-Beta-proven-but-disabled status (Gate I34) — enabling `ENABLE_CITY_COUNCIL_DISTRICT_WRITE` for real users is a separate future product approval, not resolved by this task.
- Mayor/District 3 candidate and election data completeness beyond what Gates I26/I27 already established.

---

## Confirmations

- Both write guards confirmed unchanged throughout this task: `ENABLE_CITY_COUNCIL_DISTRICT_WRITE = false`, `ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE = false` (verified by direct file read, not modified).
- No Supabase write, schema, RLS, grant, policy, function, migration, seed, or district-definition change occurred.
- No `.env.local`, password, API key, token, service-role key, or other secret was inspected.
- No credentials were entered by the assistant at any point (no browser session was signed in during this task).
- A local `npm run dev` instance was started solely for the read-only narrow-viewport smoke test (Item 4) and was fully stopped before this task concluded; no stray process remains.
- No deployment occurred.
- The unrelated concurrent-work file `src/app/api/admin/extract-shannon-martin-evidence/route.ts` was left untouched and is not included in this task's commit.
