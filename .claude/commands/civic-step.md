---
description: Run one controlled CivicMarket build step
argument-hint: [task to complete]
---

You are working in the CivicMarket repo.

Task requested by user:
$ARGUMENTS

Follow this workflow exactly.

## Project rules

- Work one controlled step at a time.
- Do not start over.
- Do not build public launch features.
- Do not build Twilio, Firecrawl, Gemini automation, Agents 1, 2, or 3, full admin, campaign portal, Expo app, federal races, voter roll matching, or public launch features.
- Keep the beta invite-only.
- Dummy PSL data is allowed for build scaffolding only.
- Real candidate, voting record, funding, and ballot data must be validated before beta users.
- Do not delete files, records, tables, routes, policies, or docs unless the user explicitly approves the exact deletion.
- Do not make Supabase/database/security changes unless the user explicitly approves the exact SQL first.

## Source of truth order

Read these first when relevant:

1. CLAUDE.md
2. CIVICMARKET_CURRENT_STATE.md
3. docs/ACTIVE_SPRINT.md
4. docs/DECISIONS.md
5. docs/CHANGELOG.md
6. Reference Files/CIVICMARKET_PATCH_MAY12.md
7. Reference Files/CIVICMARKET_WEEK3_HANDOFF_v3.md
8. Reference Files/CIVICMARKET_PROJECT_KNOWLEDGE.md

Older handoffs and archived files are historical unless a current file says otherwise.

## Required start

1. Run `git status`.
2. Stop if the working tree is not clean, unless the only changes are clearly part of the current requested task.
3. Inspect existing files before editing.
4. Explain the intended file changes before editing.

## Safe build workflow

For normal app work:

1. Make the smallest useful change.
2. Run `npm run build`.
3. If the build fails, fix only what is needed for the requested task.
4. Update `docs/CHANGELOG.md` with:
   - date
   - files changed
   - what was done
   - tests run
   - known limits or deferred work
5. Run `git status`.
6. Ask before committing unless the user explicitly asked you to commit.
7. If committing, use a clear commit message.

## Security and database workflow

For Supabase, RLS, auth, profiles, roles, moderation, reviews, match_scores, lookups, deletes, cleanup, or broad-impact changes:

1. Audit first.
2. Do not edit immediately.
3. Provide:
   - scope
   - expected result
   - no-change check
   - test plan
   - exact SQL or file changes proposed
4. Wait for explicit approval before applying.
5. Verify with read-only queries after applying.
6. Document the result.

## Response format

At the end, report:

- Done
- Changed files
- Tests run
- Result
- Known limits
- Deferred work
- Next recommended step
