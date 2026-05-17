# CivicMarket ChatGPT Handoff

Use this file at the start of a new ChatGPT session.

Last updated: May 14, 2026

## Project

CivicMarket is a non-partisan, mobile-first local election app for the Port St. Lucie beta.

Project path on user's machine:

```text
J:\CivicMarket
```

Dev server:

```powershell
npm run dev
```

Local URL:

```text
http://localhost:3000
```

## Current build strategy

The project is not starting over.

Current strategy:
- Build with dummy PSL data first.
- Replace dummy candidate, voting record, funding, and ballot data before beta users.
- Keep beta invite-only.
- Defer public launch features.
- Use small, controlled Claude Code sessions.
- Commit after every stable step.

## Current source-of-truth order

When files conflict, follow this order:

1. `CIVICMARKET_CURRENT_STATE.md`
2. `Reference Files/CIVICMARKET_PATCH_MAY12.md`
3. `Reference Files/CIVICMARKET_WEEK3_HANDOFF_v3.md`
4. `Reference Files/CIVICMARKET_PROJECT_KNOWLEDGE.md`
5. Older build guides and older handoffs are historical/reference only

## Files created or changed during this ChatGPT session

Created:

```text
CIVICMARKET_CURRENT_STATE.md
docs/ACTIVE_SPRINT.md
docs/CHANGELOG.md
docs/DECISIONS.md
Reference Files/Archive/CLAUDE_OLD_FULL_CONTEXT.md
```

Modified:

```text
CLAUDE.md
src/app/onboarding/quiz/page.tsx
src/lib/dna.ts
docs/CHANGELOG.md
```

## Git status at handoff

User reported final status as done after committing the onboarding manual test.

Expected status:

```text
On branch master
nothing to commit, working tree clean
```

If starting a new session, first ask user to run:

```powershell
cd J:\CivicMarket
git status
```

Do not proceed unless the working tree is clean or the user explains the changes.

## Completed stabilization work

The following are complete:

- Git initialized.
- Initial checkpoint commit created.
- `CIVICMARKET_CURRENT_STATE.md` created and committed.
- Old large `CLAUDE.md` backed up to:
  ```text
  Reference Files\Archive\CLAUDE_OLD_FULL_CONTEXT.md
  ```
- Active `CLAUDE.md` replaced with shorter project instructions.
- Sprint, decisions, and changelog docs created.
- `npm run build` passed before code fixes.
- Claude Code installed and working:
  ```text
  claude --version
  2.1.142 (Claude Code)
  ```
- Claude Code audit completed.
- Audit found:
  - Q13 wording mismatch.
  - Q14 was incorrectly not included in reversal logic.
- Fixed Q13 text.
- Fixed Q14 reversal.
- `npm run build` passed after the fix.
- Onboarding manually tested and passed.

## Known successful build output

`npm run build` passed with Next.js 16.2.4.

Routes generated:

```text
/
/_not-found
/onboarding
/onboarding/calculating
/onboarding/districts
/onboarding/dna-teaser
/onboarding/quiz
/onboarding/signup
/onboarding/zip
```

## Onboarding manual test result

User manually tested onboarding and reported:

```text
onboarding passed
```

Tested flow:

```text
/onboarding
→ signup
→ zip
→ districts
→ dna-teaser
→ quiz
→ calculating
```

Confirmed during test:
- Welcome screen loads.
- Signup screen works.
- ZIP screen accepts PSL ZIP, example `34953`.
- Districts screen shows candidates.
- DNA teaser shows quiz/skip options.
- Quiz has 14 questions.
- Q13 now says:
  ```text
  Our city should stay out of housing and let builders decide what gets built and at what price.
  ```
- Quiz completion reaches calculating screen.

## Civic DNA fix completed

Files changed:

```text
src/app/onboarding/quiz/page.tsx
src/lib/dna.ts
```

Required correct Q13 text:

```text
Our city should stay out of housing and let builders decide what gets built and at what price.
```

Correct reversal logic:

```typescript
export const REVERSED_QUESTIONS = [8, 9, 10, 11, 12, 13, 14]
```

Important rule:
- Q8-Q14 are reversed at compute time only.
- Raw answers are stored as-is.

## Current active priority

The project is now stabilized enough to continue.

Next controlled step should be one of these:

1. Apply Supabase security patch.
2. Add Civic DNA tests.
3. Build `/ballot`.
4. Build read-only candidate profile.
5. Build read-only measure profile.
6. Build safe beta `/vote` screen.

Recommended next step:

```text
Apply Supabase security patch first.
```

Reason:
- It prevents users from updating admin/moderation fields directly.
- It protects `profiles`, `reviews`, and `match_scores`.
- It sets safer rules before more public-facing screens are built.

## Important beta blockers

Do not invite beta users until all are complete:

- Real PSL candidate data replaces dummy data.
- Voting records have official source URLs.
- Funding rows have official source URLs.
- Legal pages exist.
- Invite code gate works.
- Report Inaccuracy exists on profiles.
- Data Sources exists on profiles.
- Admin can enter voting records.
- Security patch applied.
- Email confirmation re-enabled.
- Real data and AI scores are validated.

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

## How to guide user in next ChatGPT session

The user wants explicit, step-by-step instructions.

Use this style:
- One step at a time.
- Say exactly where to click or paste.
- Stop after each checkpoint.
- Ask for command output before continuing.
- Do not assume the user knows why a backup, commit, or patch is needed.
- Explain risky steps before asking them to run anything.
- Avoid bundling multiple commands on one line unless they are clearly separate.
- Prefer PowerShell commands because the user is on Windows.
- Avoid em dashes.

## Recommended next prompt for Claude Code

Use this if continuing with a no-edit security audit first:

```text
Read @CLAUDE.md, @CIVICMARKET_CURRENT_STATE.md, @docs/ACTIVE_SPRINT.md, and @Reference Files/CIVICMARKET_PATCH_MAY12.md.

Audit only. Do not edit files.

Task: inspect the Supabase-related client usage and identify security risks before we apply database patches.

First run:
git status

Then inspect:
- src/lib/supabase.ts
- src/app/onboarding/signup/page.tsx
- src/app/onboarding/zip/page.tsx
- src/app/onboarding/districts/page.tsx
- src/app/onboarding/quiz/page.tsx
- src/lib/dna.ts
- src/lib/candidates.ts
- Reference Files/civicmarket_schema_v4.sql

Report only:
1. Whether git status is clean
2. Whether any service role key or server secret is exposed
3. Which tables are written directly from the browser
4. Which writes are acceptable for beta
5. Which writes should be moved server-side later
6. Whether profiles update appears too broad
7. Whether reviews or match_scores can be written from browser code
8. Recommended next database patch only

Do not edit files.
Do not run npm install.
Do not build new screens.
```

## Recommended next ChatGPT action

Ask user to run:

```powershell
git status
```

Then, if clean, guide them through Supabase security patch preflight queries.

Preflight queries to run in Supabase SQL Editor:

```sql
SELECT COUNT(*) AS funding_missing_source_url
FROM candidate_funding
WHERE source_url IS NULL OR source_url = '';

SELECT COUNT(*) AS bad_match_scores
FROM match_scores
WHERE (candidate_id IS NULL AND measure_id IS NULL)
   OR (candidate_id IS NOT NULL AND measure_id IS NOT NULL);

SELECT COUNT(*) AS bad_reviews
FROM reviews
WHERE (candidate_id IS NULL AND measure_id IS NULL)
   OR (candidate_id IS NOT NULL AND measure_id IS NOT NULL);
```

Only run the full patch if all three counts are zero, or after explaining what each nonzero count means.

## Notes

The project currently has a `Reference Files` folder containing older docs. Do not delete these. The current active files already tell Claude how to treat them.

The image the user uploaded during this session was explicitly disregarded.
