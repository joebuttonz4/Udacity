# CivicMarket Claude Instructions

## Read first

Always read these files before planning or editing:

1. @CIVICMARKET_CURRENT_STATE.md
2. @CIVIC_DNA_V2_SPEC.md
3. @docs/design/DESIGN_DIRECTION_V3.md

These three files plus this one are the entire active document set.

Everything in docs/archive/ is historical. Do not read it unless I name a specific file.
That includes all CIVICMARKET_CHATGPT_HANDOFF_*.md files, CIVICMARKET_GATE_LOG.md,
civicmarket_build_guide.md, and CIVICMARKET_PROJECT_KNOWLEDGE.md. They describe superseded
methodology, a superseded design system, and a superseded process.

If an archived doc conflicts with an active one, the active one wins. Do not raise the conflict.

If any doc conflicts with CIVIC_DNA_V2_SPEC.md on categories, questions, scoring, evidence standards, or transparency, follow CIVIC_DNA_V2_SPEC.md. It supersedes all prior methodology.

## Current project

CivicMarket is a non-partisan, mobile-first local election app for the Port St. Lucie beta.

Current strategy:
- Build with dummy data first
- Replace dummy data with real PSL data before beta users
- Keep beta invite-only
- Do not build public-launch features yet

## What the match score is

The Civic DNA match is a summary of the research a motivated resident would do themselves. It is not a certification.

This sets the evidence bar. A position does not require an official government record. It requires a credible public source, shown to the user, with a link and a date, that the user can inspect and dispute.

Never display a score without its supporting evidence visible.

## Current active priority

Migrate Civic DNA from v1 to v2 per CIVIC_DNA_V2_SPEC.md.

Sequence, one per session:
1. Update this file and CIVICMARKET_CURRENT_STATE.md to remove v1 methodology rules
2. Schema migration — eight category keys, evidence table, score_changes table
3. Quiz rewrite — 16 questions, progressive, issue weighting
4. Scoring engine — weighted Euclidean, coverage rules, tested against the worked example in the spec
5. Candidate profile UI — three-level disclosure

Do not start a later step before the one before it is committed.

Current routes already exist:
- /onboarding
- /onboarding/signup
- /onboarding/zip
- /onboarding/districts
- /onboarding/dna-teaser
- /onboarding/quiz
- /onboarding/calculating

## Do not build before beta

Do not build:
- Twilio
- Firecrawl
- Gemini automation
- Agents 1, 2, or 3
- Full 5-tab admin
- Campaign portal
- Expo app
- Federal races
- Voter roll matching
- Public launch features

## Non-negotiable coding rules

- TypeScript only
- Tailwind only
- No inline styles in app components
- Use Supabase client from src/lib/supabase.ts
- Never expose service role keys in browser code
- Never put server secrets in NEXT_PUBLIC variables
- Category keys must match the eight locked snake_case keys in the spec: growth_development, taxes_budget, infrastructure_traffic, housing_affordability, public_safety, economic_development, environment_land, accountability_influence — plus education, which is scoped to school board races only
- Reversed questions are Q2, Q3, Q7, Q9, Q12, Q13, Q14. Reversal is applied at compute time only
- Raw quiz answers are stored as given, never pre-flipped
- Match scores are integers 0-100
- Category scores are -2.0 to 2.0
- A missing candidate position is null, never 0. Zero means explicitly neutral or mixed
- Never impute a missing position
- Every candidate position requires a candidate_position_evidence row with source_url, source_type, published_date, and an excerpt of 25 words or fewer
- coder_note is recorded on every evidence row and is never displayed to users
- Every score change is written to score_changes, including transitions to and from null
- Never hardcode a city name in question text or UI copy — use the {city} token
- source_url is required for every voting record
- Follow docs/design/DESIGN_DIRECTION_V3.md for all visual work. The coastal/teal system is retired
- Do not reintroduce coastal photography, palm imagery, teal accents, Syne, or CoastalHero
- Do not restore anything from docs/archive/brand-v2/
- Match values render as badges in lists and as one ring on the candidate profile only
- A candidate with no position renders as "No position found" — never a padlock or locked state

## Current data limits

- voting_records_real.csv is intentionally header-only.
- Current 4 PSL District 1 candidates are non-incumbents.
- Do not add voting records without an official item-specific source verifying candidate, item, date, description, and vote cast. This rule applies to voting records only, not to candidate positions.
- No real PSL ballot measures are currently confirmed in the database.
- Do not add ballot measures without an official source confirming title, type, election/date, summary, and source URL.
- Candidate positions are coded from credible public sources per the rubric in CIVIC_DNA_V2_SPEC.md section 5.
- Minimum coverage to display a match score is 4 of 8 categories. Below that, show known positions and evidence with no percentage.
- Categories with no evidence render as "no position found," never as a locked or failed state.

## Required workflow

One approval boundary per task, not one per step.

Before editing:
1. Run git status and git log --oneline -10.
2. Read only the files you will edit.
3. State the plan in a few lines. Use plan mode for anything touching more than three files.

Then build the whole task without stopping.

After editing:
1. Run npm run lint and npm run build.
2. Update CIVICMARKET_CURRENT_STATE.md only if project state actually changed.
3. Commit, staging files explicitly by path.

Do not write a handoff document. git log and docs/work/current_task_state.md are the record.
Do not create numbered gate documents. Do not split a single change into draft, approval,
execution, and verification documents.

## Preferred task size

One route, one feature, or one fix per session.

Do not combine onboarding, ballot, profile, admin, and scoring work in one session.

## Session workflow

Context discipline:
- Read CIVICMARKET_CURRENT_STATE.md and CIVIC_DNA_V2_SPEC.md. Do not read docs/archive/CIVICMARKET_GATE_LOG.md unless I name it.
- Read only the files needed for the current task.
- If information is already in a project file, reference the path instead of reproducing it in chat.
- Use Explore/Plan subagents for search and research so large results stay out of the main context. Do not spawn subagents for writes.

Autonomy:
- Work sequentially through the approved task. Do not stop after every step.
- Use one consolidated milestone, not many small gates.
- Permissions are enforced in .claude/settings.json. Trust the allow list rather than asking about routine safe commands.

Long tasks:
- Maintain docs/work/current_task_state.md with only: completed, current findings, blockers, next action.
- Update it at each milestone so a fresh session can resume without conversation history.

Response format — default maximum 15 lines:
- PASS / FAIL
- work completed
- files changed
- lint / build result
- blocker, if any
- commit / push
- next approval boundary

Put SQL, research findings, test matrices, and long explanations in project docs, not in chat.
Do not narrate routine tool calls or announce commands before running them.

## Git safety

Other sessions may be working in this repository.

Start every session with `git status` and `git log --oneline -10`.
Stage files explicitly by path. Never stage broadly when unrelated work is present.
Do not touch, revert, or commit files owned by another active session.
Do not force-push or rewrite history.

## Standing safety rules

- Do not guess user district assignments.
- Do not perform unapproved Supabase writes.
- Do not deploy without explicit approval.
- Preserve personal-action-first behavior in Current Officials.
- Keep ENABLE_CITY_COUNCIL_DISTRICT_WRITE = false unless separately approved.
- Keep ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE = false unless separately approved.
- Prefer missing data over knowingly incorrect civic data.
- Use official government and election sources as primary sources. Wikipedia is a lead to a primary source, never final authority.
