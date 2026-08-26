# CivicMarket Current Work Package

## Status
DONE

## Objective
Fix the City Council district profile copy so it does not falsely state that saving is always disabled once ENABLE_CITY_COUNCIL_DISTRICT_WRITE is eventually enabled.

## Scope
- Update only the misleading static disclaimer copy in:
  - src/app/profile/city-council-district/page.tsx
- Address the current text around:
  - line 127: "Preview only â€” saving is currently disabled"
  - lines 235â€“237: the beta-preview text stating saving is intentionally disabled and nothing is saved
- Make the wording accurate in both states:
  - ENABLE_CITY_COUNCIL_DISTRICT_WRITE = false
  - ENABLE_CITY_COUNCIL_DISTRICT_WRITE = true
- Preserve the existing write guard and all current behavior.
- Prefer deriving displayed copy from the same guard/state if the page can safely access it without duplicating business logic.
- If that would require broader architecture changes, use the smallest safe implementation and document the limitation.

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
- enabling ENABLE_CITY_COUNCIL_DISTRICT_WRITE
- schema or migration execution
- RLS/policy changes
- production deployment
- Vercel environment changes
- secret/API key changes
- destructive cleanup
- force push
- branch deletion
- unrelated file changes
- candidate/election fact changes
- scoring methodology changes

## Completion Requirements
When work is complete:

1. Verify the write guard remains false.
2. Verify no API/write behavior changed.
3. Verify the UI copy is accurate for the current disabled state and will not become misleading when the guard is later enabled.
4. Run applicable tests.
5. Run `npm run build`.
6. Review `git status` and final diff.
7. Do not stage unrelated concurrent work.
8. Update `CIVICMARKET_CURRENT_STATE.md` if project state materially changed.
9. Update `docs/agent_handoff.json`.
10. Commit and push only the files belonging to this work package.
11. Return a concise completion report.

## Required Reviews
UX, Mission, Release Gate

## Commit / Push Authorization
YES

## Work Instructions
Implement the smallest safe fix for the two static City Council district disclaimer blocks.

Do not enable the write feature.

Do not change:
- src/app/api/set-city-council-district/route.ts write behavior
- database behavior
- Supabase
- RLS
- schema
- secrets
- deployment configuration

The goal is copy correctness only.

The final implementation must make it clear to the user whether saving is currently available without hardcoding wording that becomes false when the existing feature guard changes.

Keep the wording concise and user-friendly.

Do not touch unrelated files.
