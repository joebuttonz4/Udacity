# CivicMarket Current State

Last updated: August 25, 2026

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
`/onboarding` (welcome, signup, zip, districts, dna-teaser, quiz, calculating),
`/admin/entry`, `/admin/records`.

Working end to end:
- Invite-code gated signup, email confirmation on
- ZIP → district assignment → auto-follow
- Civic DNA quiz, raw answers stored, dimension scores computed
- Automatic match score generation after quiz completion via POST /api/compute-match-scores
- Current Officials on Home and Profile, personal-action-first
- Admin voting-record entry and removal, RLS verified
- Report Inaccuracy writes to inaccuracy_reports

## What is blocked and why

- **Voting records** — intentionally empty. All 4 PSL District 1 candidates are non-incumbents with no Council vote history. `voting_records_real.csv` stays header-only until an official item-specific source verifies candidate, item, date, description, and vote cast.
- **Ballot measures** — none confirmed. Do not add without an official source for title, type, election date, summary, and URL.
- **County Commission District 1-5 assignment** — `ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE = false`. Route is dry-run only. Full history in the gate log.
- **City Council District write** — `ENABLE_CITY_COUNCIL_DISTRICT_WRITE = false`.
- **Mayor district row** — no `districts` row exists for PSL Mayor.
- **Match coverage** — only Shannon Martin has coded positions. Every other candidate shows no position data.

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

## Known non-blocking issues

- `npm run lint` fails on pre-existing `scripts/*.cjs` require-import errors. Unrelated to app code. Ignore unless working in `scripts/`.

## Deferred

Twilio, Firecrawl, Gemini automation, Agents 1-3, full 5-tab admin, campaign portal, Expo app,
federal races, voter roll matching, PWA service worker, public launch.

## Reference

- Gate history: `docs/CIVICMARKET_GATE_LOG.md`
- Civic feed strategy: `docs/design/CIVIC_FEED_STRATEGY.md`
- In-progress task state: `docs/work/current_task_state.md`
