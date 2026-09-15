# CivicMarket Current State

Last updated: September 15, 2026

This file describes what is true now. It is not a changelog.
Historical gate records live in `docs/CIVICMARKET_GATE_LOG.md` and are not read by default.

## Authoritative order

1. CIVIC_DNA_V2_SPEC.md — methodology, categories, questions, scoring, evidence, transparency
2. docs/design/DESIGN_DIRECTION_V3.md — visual system
3. CIVICMARKET_CURRENT_STATE.md — this file
4. CLAUDE.md — coding and workflow rules

Everything in docs/archive/ is historical. Not read by default.

## Strategy

Build with dummy data first. Replace with real PSL data before beta invitations.
No beta user may see fake candidate, voting record, funding, or ballot data.
Beta is invite-only. Do not build public-launch features.

## What is live

Deployed at civicmarket.vercel.app. No custom domain yet.

Routes complete and manually tested:
`/`, `/ballot`, `/candidates/[id]`, `/measures/[id]`, `/vote`, `/profile`,
`/report`, `/data-sources`, `/privacy`, `/terms`,
`/onboarding` — rebuilt 2026-09-10 to match `mockup/civicmarket_mockup.jsx` and
`THIS_IS_THE_APP.md` screen 1: welcome → signup (invite + account) → zip
(street-name disambiguation wired, inert — no verified ambiguous PSL ZIPs yet)
→ districts ("Your backyard": upcoming civic_feed items first, then confirmed
districts, City Council shown "not yet confirmed" only when no city_council row
exists) → verify (self-reported address only, no USPS claim, no verified
badge/tier) → issues (pick up to 3, the 8 locked civic_feed keys, written to
new `profiles.top_issues`). Built in Civic Navy tokens, scoped to
`src/app/onboarding/` only — no other screen was migrated off v2 teal this
session. `dna-teaser`, `quiz`, `calculating` still exist as routes but are no
longer linked from onboarding (per `THIS_IS_THE_APP.md`: DNA quiz is a
footnote reachable from Ballot, not part of onboarding) — untouched, not
deleted.
`/` — rebuilt 2026-09-13 to match `mockup/civicmarket_mockup.jsx` (`Home`) and
`THIS_IS_THE_APP.md` screen 2: live-meeting banner (renders only when a real
item's `meeting_date` is today; non-interactive, check-in is screen 10) → "This
week"/"Coming up" upcoming items → "What happened" decided items. Three outcome
states, not two: upcoming, past-with-outcome, and past-with-`outcome IS NULL`
rendering "Outcome not posted yet". Feed is filtered strictly to the user's
`user_districts` rows — `district_id IS NULL` items are invisible by design;
citywide items reach residents via the "Port St. Lucie (citywide)" district,
which `/onboarding/zip` now assigns. Built in Civic Navy via new
`src/components/navy/`; `src/app/page.tsx` only, no other screen migrated. No
stars, support/oppose, comments, money, or alerts bell. Feed cards link to
`/items/[id]`. The decided card shows a non-interactive "Minutes available"
line rather than a minutes link: the card is itself a `<Link>`, and a nested
`<a>` is invalid HTML — the real minutes link lives on item detail.
`/items/[id]` — built 2026-09-13 to match `mockup/civicmarket_mockup.jsx`
(`ItemDetail`) and `THIS_IS_THE_APP.md` screen 3. Urgency + district pills →
when-and-where card (label rows, no emoji; navy while upcoming, white once the
meeting date passes; carries the same three outcome states as the feed) → "In
plain English" rendering `civic_feed.detail` split on blank lines into real
`<p>` elements → promoted source row → "Why you're seeing this" + issue pills.
`getFeedItem` re-applies the user's district filter because `civic_feed`'s RLS
policy is `USING (true)` — without it, `/items/<uuid>` reads around the
hyperlocal rule. "No such row" and "outside your districts" share one neutral
not-found state so probing ids cannot confirm an item exists. Back is a
deterministic `Link` to `/`, not `router.back()`. Report links to the existing
`/report`. Built in Civic Navy; `src/components/navy/` gained a `back` slot on
`PageHeader` and `LabelValueRow`.
Comments (screen 4) render above the report footer via
`src/components/comments/ItemComments.tsx`, which loads independently so item
detail never blocks on the thread. The invite code is the verification: anyone
with `onboarding_completed_at` set may comment, enforced by the INSERT policy.
Copy says "beta participants", never "verified residents". `author_name` is
denormalized onto the comment row because `profiles` RLS forbids reading other
users' rows. Moderation is post-publication: an admin sees an inline Hide
control on each comment, hidden comments are invisible to everyone including
their author, and `GRANT UPDATE (hidden_at, hidden_by, hidden_reason)` means an
admin can hide a comment but never edit its body. No DELETE policy exists.
Writes are not optimistic; a failed post keeps the draft. Rate limit is a
`SECURITY DEFINER` trigger, 1 per 30s and 20 per day; body length is a CHECK
constraint, 2–1000 chars.
`/forgot-password` and `/reset-password` — built 2026-09-14. Closes the lockout
gap: the app previously had no password-reset code at all, so the only reset
link was one triggered from the Supabase dashboard, which with no `redirectTo`
fell back to Site URL and dropped the user on Home with a recovery session and
nowhere to set a password. `/forgot-password` requests the link;
`/reset-password` receives it. The client runs the **implicit** flow
(`@supabase/auth-js` defaults `flowType: 'implicit'` and `src/lib/supabase.ts`
passes no options), so tokens arrive in the URL fragment and never reach the
server — no middleware, no route handler, no server component can see this
flow. `PASSWORD_RECOVERY` fires during client init and can beat a component's
subscription, so `getSession()` is the primary check and `onAuthStateChange` is
the fallback. A recovery session is **not** distinguished from a normal one —
`redirectTo` pointing at `/reset-password` is the signal, and Supabase is the
authority on token validity. `redirectTo` is computed from
`window.location.origin`, so localhost and Vercel both work from one build. On
success the flow calls `signOut({ scope: 'others' })`. A dead link never
dead-ends: it offers a new link and a route back to sign in. `NavBar` hides on
both routes.
`/admin/entry`, `/admin/records`.

Working end to end:
- Invite-code gated signup, email confirmation on
- ZIP → district assignment → auto-follow
- Civic DNA quiz, raw answers stored, dimension scores computed
- Automatic match score generation after quiz completion via POST /api/compute-match-scores
- Current Officials on Profile, personal-action-first (removed from Home in the screen 2 rebuild — not on `THIS_IS_THE_APP.md` screen 2; Profile behavior untouched)
- Admin voting-record entry and removal, RLS verified
- Report Inaccuracy writes to inaccuracy_reports
- Home feed → item detail navigation, district-scoped at both ends
- Comments on agenda items, with inline admin hide/unhide
- Password reset, end to end: request → email → set new password → signed in, old password dead, other sessions revoked

## What is blocked and why

- **Voting records** — intentionally empty. All 4 PSL District 1 candidates are non-incumbents with no Council vote history. `voting_records_real.csv` stays header-only until an official item-specific source verifies candidate, item, date, description, and vote cast.
- **Ballot measures** — none confirmed. Do not add without an official source for title, type, election date, summary, and URL.
- **County Commission District 1-5 assignment** — `ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE = false`. Route is dry-run only. Full history in the gate log.
- **City Council District write** — `ENABLE_CITY_COUNCIL_DISTRICT_WRITE = false`.
- **Mayor district row** — no `districts` row exists for PSL Mayor.
- **Match coverage** — only Shannon Martin has coded positions. Every other candidate shows no position data.
- **Feed topics migration not yet run** — `supabase/migrations/civicmarket_schema_addendum_feed_topics.sql` is written but not executed. Until it runs, `civic_feed.topics` and `profiles.alert_topics` do not exist and the vocabulary switchover session cannot start. Statement 5, `GRANT UPDATE (alert_topics)`, is mandatory: `profiles` UPDATE is revoked table-wide and re-granted per column, so skipping it reproduces the 2026-09-14 silent-403 failure exactly.
- **civic_feed items are untagged** — all 3 real rows have empty topics. Until tagged from the 9 keys, the Home feed's "your issues" accent and the "you said X matters most to you" line never fire.
- **Content lead: half-cent infrastructure surtax extension** — Resolution 26-R17 asked the County to place a half-cent infrastructure surtax extension on the Nov 3, 2026 ballot. **Unverified whether the County actually did.** Per the standing rule, no ballot measure is added without an official source confirming title, type, election date, summary and source URL.
- **Week 7 checkpoint rule — two-candidate runoff** — if the race becomes a two-candidate runoff, match rings go live for **both candidates or neither**. A ring on one candidate and "not enough positions yet" on the other reads as an endorsement, whatever the coverage math says.
- **civic_feed money columns** — the mockup's item detail has a "Follow the money" card (`label`, `value`, `note`). No columns exist for it and none were added. Screen 3 ships without it. Needs a schema decision before it can be built.
- **`/report` subject_type** — constrained to `candidate_info | voting_record | funding`, and its DDL is not in `supabase/migrations/` at all. Item detail links to the generic `/report`. An `agenda_item` subject type needs a DDL change at screen 10.
- **`profiles.district_id` is user-writable** — it appears in the `profiles` UPDATE grant, so a user can assign themselves a district they don't live in. The Home feed filters on `user_districts`, not on this column, so it does not currently widen what anyone sees — but it is a self-asserted claim about where someone lives sitting in a column no verification step guards. Pre-existing, not introduced by the grant reconciliation. **Open question, deliberately not fixed:** decide what still reads `profiles.district_id` before revoking it.
- **`src/app/api/admin/extract-shannon-martin-evidence/route.ts`** — has uncommitted local modifications, left as-is. This is v1-key candidate-evidence code tied to screen 8 (candidate profile), which is last in the `THIS_IS_THE_APP.md` build order. Deliberately parked, not forgotten — do not tidy up, refactor, or commit changes to this file until screen 8 comes up.

## Design direction

v3 Civic Navy, approved August 25 2026. Supersedes the v2 coastal/teal system.

The May 17 instruction to preserve the coastal brand assets is **reversed and no longer applies.**
Deep navy, white cards, Instrument Sans only, 12px radius, no photographic heroes.
Brand v2 PNGs are archived in docs/archive/brand-v2/ and must not be restored.

Full spec and migration checklist: docs/design/DESIGN_DIRECTION_V3.md

## Process

One approval boundary per task. No handoff documents. No numbered gate documents.
In-progress state lives in docs/work/current_task_state.md. History lives in git log.

## Active priority

Migrate Civic DNA v1 → v2 per CIVIC_DNA_V2_SPEC.md. One step per session, in order:

1. Retire v1 methodology from CLAUDE.md and this file — **done**
2. Schema migration — eight category keys, `candidate_position_evidence`, `score_changes`
3. Quiz rewrite — 16 questions, progressive (8 core then 8 refine), issue weighting
4. Scoring engine — weighted Euclidean, coverage rules, tested against the spec's worked example (expected result: 56)
5. Candidate profile UI — three-level disclosure

Do not start a step before the previous one is committed.

The v3 visual migration is a separate single-session pass. Do not combine it with the above.

### civic_feed dimension keys — decided separately from the v1→v2 migration (2026-09-10)

`civic_feed.dimensions` uses the 8 locked spec keys from `CLAUDE.md`
(`growth_development, taxes_budget, infrastructure_traffic, housing_affordability,
public_safety, economic_development, environment_land, accountability_influence`,
plus `education` for school board races). This is **separate** from the 7-key set
in `src/lib/dna.ts` / `candidate_positions` / `measure_dimensions`
(`growth_development, taxation_spending, environment, public_safety, education,
housing, transparency`), which is untouched — that key-set reconciliation is
scoring-engine work (steps 3–4 above, screens 7–8), not now. Feed tags do not
feed Civic DNA match scores, so the two key sets can move on independent
schedules without blocking each other.

### Feed topics — vocabulary split from Civic DNA (2026-09-15)

The `files/VISION.md` feed-tagging trigger fired. Feed topics are now their own
nine-key vocabulary, separate from the eight Civic DNA categories. Source of
truth is `src/lib/topics.ts`; the same nine keys are enforced by CHECK
constraints in `supabase/migrations/civicmarket_schema_addendum_feed_topics.sql`,
and `src/lib/__tests__/topics.test.ts` fails the build if the two disagree in
either direction.

Schema (migration written 2026-09-15, **not yet run** — see blocked list):
- `civic_feed.topics text[] NOT NULL DEFAULT '{}'` — 0 to 2 topics, never more.
  0 topics means the item appears in the feed and never triggers an alert.
- `profiles.alert_topics text[]`, **nullable, no DEFAULT** — NULL means never
  asked, `{}` means asked and chose none. Alerts shows a pick-topics empty
  state for NULL and respects a deliberate empty choice for `{}`. Adding a
  DEFAULT would erase that distinction.
- `profiles.top_issues` keeps the Civic DNA keys and is set only after the
  quiz. It gets no CHECK constraint yet, because the DNA v2 quiz rewrite may
  change that key set.
- `civic_feed.dimensions` is left in place, unused, pending the DNA v2 key-set
  reconciliation. It is not repurposed: its name is bound to the DNA
  vocabulary throughout the docs and in `candidates.ts` / `measures.ts`.

No backfill. The 9 existing accounts keep `alert_topics = NULL`. The topic →
DNA mapping is many-to-one and does not invert — `infrastructure_traffic` is
reachable from both `roads_traffic` and `water_sewer_drainage` — so a
backfill would have to guess, and it will not.

**Next session is the named exception to one-screen-per-session: "vocabulary
switchover."** It contains only four things: onboarding issues page writes
`alert_topics`; the swallowed error in `issues/page.tsx` is fixed so failure
surfaces instead of navigating; `feed.ts` reads `alert_topics` and
`civic_feed.topics`; Home and item-detail pills switch to topic labels.
Nothing else. Items 1 and 3 must ship together — the moment onboarding stops
writing `top_issues`, `getTopIssues()` returns empty for every new user and the
"Why you're seeing this" card and all issue pills silently stop rendering.
`zip/page.tsx` and `verify/page.tsx` swallowed errors are a separate session
before invites.

## Known non-blocking issues

- `npm run lint` fails on pre-existing `scripts/*.cjs` require-import errors. Unrelated to app code. Ignore unless working in `scripts/`.
- **`onboarding_completed_at` backfill — done 2026-09-13.** The `profiles` grant gap meant the `/onboarding/issues` write failed silently, leaving the column NULL for accounts that onboarded before the fix. All 9 existing accounts were backfilled, and the grant fix means new users write it correctly going forward. Caveat: the column is now the gate for commenting, so if it is ever NULL again the symptom is a user who can read everything and post nothing.
- Three onboarding writes swallow their errors (`console.error` then navigate): `/onboarding/zip`, `/onboarding/verify`, `/onboarding/issues`. This is what hid the grant gap for weeks. Worth making them surface failure when those screens are next touched.
- **Signup had no client-side password length check at all** until 2026-09-14 — not a weak one, none. The placeholder read "At least 6 characters" and nothing enforced it, leaving Supabase's own project minimum as the only guard. Both signup and reset now enforce 8 via `PASSWORD_MIN` in `src/lib/auth.ts`. **Action item (Mike, dashboard):** raise the Supabase project minimum password length to 8 to match. Until then the app is stricter than the server, so a password set outside the app — or by any future code path that skips `PASSWORD_MIN` — can still be 6 characters.
- **Navy form primitives are duplicated three ways** — `Input`, `Btn`, `GhostBtn`, `Label`, `ErrorText` exist in `src/app/onboarding/_components/OnboardingUI.tsx`, in `src/components/navy/index.tsx`, and as inline button markup on the feed, item-detail and comments screens. The two component APIs are deliberately identical so the v3 consolidation pass is a delete rather than a rewrite. This is now the most overdue item for that pass.

## Deferred

Twilio, Firecrawl, Gemini automation, Agents 1-3, full 5-tab admin, campaign portal, Expo app,
federal races, voter roll matching, PWA service worker, public launch.

PKCE auth flow — would make password reset more robust but changes auth for every flow in the
app; own session, own testing.

## Reference

- Gate history: `docs/CIVICMARKET_GATE_LOG.md`
- Civic feed strategy: `docs/design/CIVIC_FEED_STRATEGY.md`
- In-progress task state: `docs/work/current_task_state.md`
