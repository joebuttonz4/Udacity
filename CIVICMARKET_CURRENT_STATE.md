# CivicMarket Current State

Last updated: September 13, 2026

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
`src/components/navy/`; `src/app/page.tsx` only, no other screen migrated. Feed
cards do not navigate yet (item detail is screen 3). No stars, support/oppose,
comments, money, or alerts bell.
`/admin/entry`, `/admin/records`.

Working end to end:
- Invite-code gated signup, email confirmation on
- ZIP → district assignment → auto-follow
- Civic DNA quiz, raw answers stored, dimension scores computed
- Automatic match score generation after quiz completion via POST /api/compute-match-scores
- Current Officials on Profile, personal-action-first (removed from Home in the screen 2 rebuild — not on `THIS_IS_THE_APP.md` screen 2; Profile behavior untouched)
- Admin voting-record entry and removal, RLS verified
- Report Inaccuracy writes to inaccuracy_reports

## What is blocked and why

- **Voting records** — intentionally empty. All 4 PSL District 1 candidates are non-incumbents with no Council vote history. `voting_records_real.csv` stays header-only until an official item-specific source verifies candidate, item, date, description, and vote cast.
- **Ballot measures** — none confirmed. Do not add without an official source for title, type, election date, summary, and URL.
- **County Commission District 1-5 assignment** — `ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE = false`. Route is dry-run only. Full history in the gate log.
- **City Council District write** — `ENABLE_CITY_COUNCIL_DISTRICT_WRITE = false`.
- **Mayor district row** — no `districts` row exists for PSL Mayor.
- **Match coverage** — only Shannon Martin has coded positions. Every other candidate shows no position data.
- **civic_feed dimensions** — all 3 real rows are `'{}'`. Until tagged with the locked 8 keys, the Home feed's "your issues" accent and the "you said X matters most to you" line never fire.
- **civic_feed has no meeting-body column** — screen 3's "when & where" card wants "City Council · public comment allowed". Home works around it by showing the district name; screen 3 needs a decision on adding the column vs. deriving it.
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

## Known non-blocking issues

- `npm run lint` fails on pre-existing `scripts/*.cjs` require-import errors. Unrelated to app code. Ignore unless working in `scripts/`.

## Deferred

Twilio, Firecrawl, Gemini automation, Agents 1-3, full 5-tab admin, campaign portal, Expo app,
federal races, voter roll matching, PWA service worker, public launch.

## Reference

- Gate history: `docs/CIVICMARKET_GATE_LOG.md`
- Civic feed strategy: `docs/design/CIVIC_FEED_STRATEGY.md`
- In-progress task state: `docs/work/current_task_state.md`
