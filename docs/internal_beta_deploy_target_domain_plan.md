# CivicMarket Deploy Target and Domain Plan

Date: 08-20-2026
Timestamp: 08:41 pm EST

Status: **Planning only. No deployment performed. No Vercel project created. No Supabase Auth URLs changed. No secrets accessed or printed.**

## Scope discipline

This document is deployment planning, read-only repo inspection, and documentation only. No code was changed. Two unrelated concurrent-work items were present in the working tree throughout this task (`package.json`/`package-lock.json` adding `@google/genai`, and an untracked `src/lib/candidateEvidence/` module with its own test suite and `vitest.config.mts`, plus a modified `src/app/api/admin/extract-shannon-martin-evidence/route.ts`) — all inspected read-only where relevant to the env-var inventory below, none touched, none staged, none committed.

## Phase 1 — Deployment readiness inspection

**Standard Next.js App Router project, directly Vercel-compatible.**

- `package.json`: standard `dev` / `build` / `start` / `lint` scripts (`next dev`, `next build`, `next start`, `eslint`). A `test` script (`vitest run`) exists but is unrelated concurrent work and irrelevant to the Vercel build/runtime path.
- `next.config.ts`: empty/default config — no custom `output`, `rewrites`, `headers`, `images`, or runtime overrides.
- No `vercel.json` exists — not needed for a standard App Router project; Vercel auto-detects Next.js.
- No `middleware.ts` exists anywhere in the repo.
- No route declares `export const runtime = 'edge'`, `dynamic`, or `revalidate` — every route uses Next's default behavior, which Vercel's standard Next.js integration handles natively (static generation for static pages, Node.js serverless functions for the dynamic API routes already confirmed by every prior `npm run build` — 5 `ƒ` dynamic routes, the rest `○` static, out of 28 total).
- **No filesystem access exists in the deployed app itself** (`src/`) — confirmed by search: zero `fs` imports anywhere under `src/`. The only filesystem reads (`fs.readFileSync` for `.env.local` and CSVs) live in `scripts/*.cjs`, which are manual, local-only admin tools never invoked by the running app or by any route — irrelevant to Vercel's read-only serverless filesystem.
- **No cron, background job, or server-persistence assumption exists.** The only `setInterval` in the codebase is the client-side election countdown timer in `src/app/page.tsx` (browser-only, resets per page load) — not a server-side concern.
- **No hardcoded `localhost` reference exists anywhere in `src/`.** Confirmed by search across the full source tree.
- **No hardcoded auth redirect URL exists anywhere.** `supabase.auth.signUp({ email, password })` (`src/app/onboarding/signup/page.tsx`) is called with no `options.emailRedirectTo` — redirect behavior is entirely delegated to the Supabase project's dashboard-configured Site URL / Redirect URLs (see Phase 5). This means the app code itself requires **zero changes** to work on any domain — only the Supabase dashboard configuration needs to track the deployed URL.
- No `engines.node` is pinned in `package.json` and no `.nvmrc` exists. Not a blocker — Vercel's default Next.js 16-compatible Node runtime will apply automatically — but worth a future nice-to-have to pin explicitly (e.g. `"engines": { "node": ">=20" }`) for build determinism.

**Conclusion: this repository is directly deployable to Vercel with no code changes required.**

## Phase 2 — Environment variable inventory (names only, no values accessed)

| Variable | Classification | Required for |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | PUBLIC | Basic app load (every page/route uses the Supabase client) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | PUBLIC | Basic app load |
| `SUPABASE_SERVICE_ROLE_KEY` | SERVER-ONLY SECRET | Full intended auth/onboarding experience — used by `src/lib/supabase-server.ts`'s `createServiceClient()`, which powers `POST /api/compute-match-scores` (called automatically right after the Civic DNA quiz). **Not a hard blocker if missing** — `src/app/onboarding/calculating/page.tsx` wraps this call in `.catch(() => {})`, so onboarding still completes without it; match scores would simply never compute (every candidate ring stays locked) |
| `INVITE_CODE` | SERVER-ONLY SECRET | Signup gate — `POST /api/validate-invite` fails closed (`valid:false`, HTTP 500) if this is unset, blocking all new signups |
| `ANTHROPIC_API_KEY` | SERVER-ONLY SECRET, OPTIONAL/FUTURE | Candidate-evidence extraction only (`src/lib/candidateEvidence/providers/anthropic.ts`) — the one admin route that would use it (`extract-shannon-martin-evidence`) is hardcoded `ENABLE_CAMPAIGN_EVIDENCE_EXTRACTION = false` and structurally unreachable. **Not required for initial deploy.** |
| `GEMINI_API_KEY` | SERVER-ONLY SECRET, OPTIONAL/FUTURE | Same extraction path (`src/lib/candidateEvidence/providers/gemini.ts`), same disabled-guard reasoning. **Not required for initial deploy.** |
| `CANDIDATE_EVIDENCE_PROVIDER` | OPTIONAL/DEV-ONLY | Selects extraction provider (`anthropic`/`gemini`) — irrelevant while extraction is disabled |
| `GEMINI_EVIDENCE_MODEL` | OPTIONAL/DEV-ONLY | Model override for the Gemini provider — irrelevant while extraction is disabled |
| No `NEXT_PUBLIC_SITE_URL` / `NEXT_PUBLIC_APP_URL` / similar exists | — | Confirmed via search — the app has no such variable; nothing in-app needs it since Supabase's own dashboard Site URL is what drives redirects, not app code |

**Minimum required for a working first deploy (basic app load + real signup):** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `INVITE_CODE`, `SUPABASE_SERVICE_ROLE_KEY` (for the full intended onboarding experience, not strictly load-blocking). `ANTHROPIC_API_KEY` / `GEMINI_API_KEY` / their two config vars are not needed until the (currently disabled) candidate-evidence extraction feature is separately approved and enabled.

No secret values were read, printed, or accessed to produce this table — only variable names found via source-code search.

## Phase 3 — Hosting recommendation

**Vercel — directly deployable, no code changes needed.**

- Framework preset: **Next.js** (auto-detected).
- Build command: **`next build`** (default — no override needed).
- Install command: **default** (`npm install` — no custom install step, no monorepo/workspace complexity).
- Output directory: **not applicable** — Next.js App Router on Vercel uses Vercel's native build output, not a static `out/` directory (no `output: 'export'` is set, so this is a normal hybrid static+serverless deploy, not a static export).
- Node version: no explicit constraint in the repo; Vercel's current default Next.js-compatible Node runtime applies. No action required unless the user wants to pin it later.
- Branch strategy: **production branch = `master`** (the repo's actual default/main branch, confirmed by every `git push origin master` throughout this project's history — matches the task's preferred baseline exactly).

No code evidence suggests a different host would be preferable — this is an unmodified, vanilla App Router structure with a client-side Supabase SDK and stateless serverless API routes, which is exactly Vercel's primary supported deployment shape.

## Phase 4 — Domain strategy

**Option A — Fastest: generated `*.vercel.app`**
- Setup effort: zero — Vercel assigns this automatically on first deploy, no DNS, no ownership verification.
- Supabase Auth redirect stability: stable once set, but this URL is Vercel-project-name-derived and effectively permanent for a given project (not literally random per deploy), so it's a safe one-time Supabase config entry — just not a branded URL.
- User trust: lower — a `*.vercel.app` URL doesn't read as an official CivicMarket domain, acceptable only for a small, trusted, invite-only Internal/Controlled Beta population (consistent with this project's current beta model).
- Later migration impact: low-to-moderate — moving to a custom domain later requires one Supabase Auth Site URL/redirect update (see Phase 5) and re-testing signup once; no app code changes either way.

**Option B — Preferred beta: a custom subdomain** (e.g. `beta.<owned-domain>` or `civic.<owned-domain>`)
- Setup effort: moderate — requires the user to own a domain (not assumed here — no domain ownership has been confirmed in this project to date; `civicmarket.app` was previously found to be an unowned placeholder, see the "Temporary Monitored Corrections Email" entry in `CIVICMARKET_CURRENT_STATE.md`), plus DNS configuration (a CNAME/A record pointed at Vercel) and Vercel domain verification.
- Supabase Auth redirect stability: equally stable once configured — a custom domain is actually simpler long-term since it never needs to change again as the project matures past beta.
- User trust: higher — reads as an intentional, branded product rather than a default platform subdomain.
- Later migration impact: none, if chosen from the start of Controlled Beta — but migrating *to* it after `*.vercel.app` is already in active use adds one more required Supabase Auth update and one more live-tested signup cycle.

**Recommendation: sequence exactly as the task's preferred baseline states.**
1. Deploy first on the generated `*.vercel.app` domain — this validates the entire pipeline (build, environment variables, Supabase connectivity, invite gate, email confirmation) fastest, without being blocked on domain ownership/DNS.
2. Attach a custom beta domain/subdomain afterward, once the user has decided on and confirmed ownership of a domain — this is a decision this document deliberately does not make on the user's behalf.
3. Only then finalize Supabase Auth URLs to the permanent custom-domain values (see Phase 5) — avoids reconfiguring Supabase twice if the domain decision changes mid-setup.

## Phase 5 — Supabase Auth URL plan (designed, not executed)

**Flows that depend on these redirects, as found in the actual app code:**
- **Signup** (`src/app/onboarding/signup/page.tsx`, `handleSignup`) — calls `supabase.auth.signUp({ email, password })` with no explicit redirect option.
- **Email confirmation** — the same call: when `data.session` is null after `signUp`, the UI shows a "check your inbox" (`pendingConfirmation`) state; the actual confirmation link a user clicks is generated and hosted by Supabase, and where it redirects the user back to is controlled entirely by the Supabase project's Site URL / Redirect URL configuration, not by any app code.
- **Password reset** — confirmed **does not exist** anywhere in this app (no `resetPasswordForEmail` call found) — nothing to plan for here.
- **Invite flow** — `POST /api/validate-invite` is a same-origin API call (not a redirect-based flow) — unaffected by Supabase Auth URL settings.

**Future configuration to apply in the Supabase dashboard (Authentication → URL Configuration) — not executed by this task:**

- **Site URL:** the deployed app's primary/production URL — initially the Vercel-generated `https://<project-name>.vercel.app`, later updated to the final custom domain (e.g. `https://beta.<owned-domain>`) once Phase 4's Option B is executed.
- **Redirect URLs (allow-list):** should include, simultaneously —
  - `http://localhost:3000/**` — keep this. There is no strong reason to remove local development access, and Supabase's redirect allow-list supports multiple simultaneous entries with no security cost to keeping localhost alongside production entries.
  - `https://<project-name>.vercel.app/**` — the Vercel production domain.
  - `https://<project-name>-*.vercel.app/**` (or the project's specific preview-URL pattern, if Vercel preview deployments are ever used for auth testing) — optional, only needed if preview-deployment auth testing is desired; not required for the initial production-only rollout this plan targets.
  - `https://beta.<owned-domain>/**` (or whichever custom domain is chosen) — added once Phase 4's Option B is executed.

No values were entered into Supabase for this task — this is the exact pattern the user will need to enter manually in a later, explicitly approved step.

## Phase 6 — Deployment safety / risk check

| Item | Classification | Basis |
|---|---|---|
| Service-role key never exposed client-side | **PASS** | `SUPABASE_SERVICE_ROLE_KEY` is read only in `src/lib/supabase-server.ts` (`'use client'` is never present in that file) and only imported by server-only API routes (`compute-match-scores`, and the disabled `extract-shannon-martin-evidence`) — confirmed by source inspection, not just naming convention |
| Admin routes remain server-side protected | **PASS** | `/admin/entry`, `/admin/records` gate on `profiles.is_admin` (client-checked redirect, but the real boundary is Supabase RLS on the underlying tables — already verified and documented by the prior security grant patch in `CIVICMARKET_CURRENT_STATE.md`); no new risk introduced by deployment itself |
| Extraction route stays disabled | **PASS** | `ENABLE_CAMPAIGN_EVIDENCE_EXTRACTION = false` is a hardcoded source-code constant, not an environment variable — cannot be flipped by any Vercel env-var misconfiguration |
| `ENABLE_CITY_COUNCIL_DISTRICT_WRITE` remains `false` | **PASS** | Same — hardcoded constant in `src/app/api/set-city-council-district/route.ts`, not env-var-driven |
| `ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE` remains `false` | **PASS** | Same — hardcoded constant in `src/app/api/set-county-commission-district/route.ts` |
| No localhost-only fetch path breaks production | **PASS** | Confirmed zero `localhost` references anywhere in `src/` |
| No dev-server-only assumption | **PASS** | No `next dev`-only API, no filesystem reads, no custom middleware assuming a persistent local process |
| No uncommitted code required | **FOLLOW-UP** | The repo's own tracked source (everything already on `master` through commit `cbb7419`) is fully deployable on its own with no missing pieces. However, two **unrelated, currently uncommitted, concurrent-work** items exist in the working tree right now (`package.json`/`package-lock.json` adding `@google/genai`, and the untracked `src/lib/candidateEvidence/` module + its modified `extract-shannon-martin-evidence` route) — these are not required for this deployment milestone and were correctly left untouched by this task, but the user should be aware a first `master`-branch deploy today would **not** include them until that other work is separately committed and pushed. This is not a blocker for deploying today's `master` as-is. |
| Env vars required before real signup can succeed | **FOLLOW-UP** | `INVITE_CODE` and both Supabase keys must be set in Vercel's project environment-variable settings before a real signup/email-confirmation test can pass — this is expected, standard, and addressed explicitly in Phase 7's sequence, not a code defect |

**No BLOCKER-classified item was found.** The repository is safe to deploy as-is once the required environment variables are set in Vercel.

## Phase 7 — Deployment milestone plan (next interactive sequence)

| # | Step | User action | What Claude can verify afterward | Approval boundary | Secrets involved? |
|---|---|---|---|---|---|
| 1 | Sign into Vercel | User signs in (GitHub SSO recommended, matching the repo's GitHub remote) | Nothing (no Claude access to the user's Vercel account) | User-only step | No |
| 2 | Import the GitHub `CivicMarket`/`Udacity` repo | User selects the repo in Vercel's "Import Project" flow | Claude can confirm the repo/remote URL matches (`https://github.com/joebuttonz4/Udacity.git`, already known from git remote) | User-only step | No |
| 3 | Configure project/framework | Vercel auto-detects Next.js; user confirms production branch = `master` | Claude can re-confirm `master` is the correct branch via `git branch`/`git status` | User-only step | No |
| 4 | Add required environment variables | User enters `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `INVITE_CODE` into Vercel's project settings | Claude cannot and will not read these values; can only confirm afterward, from the user's report, that the variable **names** were entered as specified in Phase 2 | **STOP — user enters actual secret values themselves; Claude does not read `.env.local` or ask for values to be pasted in chat** | **Yes — this is exactly the boundary where Claude stops** |
| 5 | Deploy production from `master` | User clicks Deploy | Claude can review the build log the user shares, or independently re-run `npm run build` locally to confirm the same source builds cleanly (already done repeatedly this project) | User triggers; Claude can advise on any build error | No (build log itself, not secret values) |
| 6 | Capture the generated Vercel URL | User copies the `*.vercel.app` URL | Claude can note it in documentation once the user shares it | User-only step | No |
| 7 | Configure Supabase Auth Site URL + redirect URLs | User enters the Phase 5 URL pattern into the Supabase dashboard | Claude cannot access the Supabase dashboard directly; can review the user's description of what was entered against the Phase 5 plan | **User-only — Supabase dashboard credentials are the user's own** | Indirectly (dashboard access, not a code secret) |
| 8 | Test real signup/email confirmation | User performs one real signup on the deployed URL | Claude can review browser behavior live (via Claude-in-Chrome, no credentials entered by Claude) if the user drives the signup themselves, or review the user's report | User performs the actual signup/confirms the email themselves | Possibly (email inbox access is the user's) |
| 9 | Attach custom domain/subdomain if desired | User adds the domain in Vercel + configures DNS at their registrar | Claude can verify DNS propagation via a read-only lookup once pointed at it, if asked | User decides domain, executes DNS changes | No |
| 10 | Re-test auth on the custom domain | User (or Claude, browser-driven, no credentials entered) repeats step 8 against the new domain | Same as step 8 | Same as step 8 | Possibly |
| 11 | Run mobile/auth-gated smoke test | Claude can perform this live via Claude-in-Chrome once a real signed-in session exists on the deployed URL, mirroring the same method already used repeatedly on localhost throughout this project | Claude verifies directly | Autonomous, once a session exists | No |

**Hard stop rule (Phase 7's explicit instruction, honored here):** once environment-variable **values** are needed (step 4) or Supabase dashboard credentials are needed (step 7), this task stops and asks the user to perform that step themselves rather than reading `.env.local` or requesting secret values in chat.

## Next user action

This document is the complete plan. **No deployment has occurred.** The next action is the user's own decision to begin Phase 7, step 1 — sign into Vercel and import the repository — followed immediately by step 4, where the user will need to have the four required environment-variable values ready (from their own `.env.local` / Supabase project settings) to paste into Vercel's UI themselves.
