# CivicMarket Current Work Package

## Status
READY

## Objective
Replace this section with the approved work objective.

## Scope
- Replace with approved work items.

## Allowed Autonomous Actions
- Inspect repository files
- Edit files within this approved work package
- Run tests
- Run lint
- Run `npm run build`
- Perform read-only verification
- Update documentation
- Update `docs/agent_handoff.json`

## Explicit Approval Required
Stop before:
- Supabase/database writes
- schema or migration execution
- RLS/policy changes
- production deployment
- Vercel environment changes
- secret/API key changes
- destructive cleanup
- force push
- branch deletion
- unrelated file changes
- public candidate/election fact changes not explicitly authorized
- scoring methodology changes not explicitly authorized

## Completion Requirements
When work is complete:

1. Run applicable tests.
2. Run `npm run build` when appropriate.
3. Review `git status` and final diff.
4. Do not stage unrelated concurrent work.
5. Update `CIVICMARKET_CURRENT_STATE.md` if project state materially changed.
6. Update `docs/agent_handoff.json`.
7. Commit and push only if this work package explicitly authorizes commit/push.
8. Return a concise completion report.

## Required Reviews
NONE

## Commit / Push Authorization
NO

## Work Instructions
Replace this section with the actual approved instructions.
