# County Commission District Model Review

Date: July 6, 2026

## Scope

County Commission district model review only.

No schema changes, seed changes, app code changes, SQL migration changes, Supabase data changes, current_officials inserts, district renames, or district deletes were made.

## Finding

CivicMarket currently has an app-facing county row:

- id: 11111111-0000-0000-0000-000000000003
- name: St. Lucie County Commission At-Large
- scope/type: county

This row is actively referenced in src/app/onboarding/zip/page.tsx for onboarding district assignment. Therefore, the At-Large row should not be renamed, deleted, or replaced without a separate approved migration plan.

Official St. Lucie County Commissioner sources identify commissioners by District 1 through District 5, not as one At-Large office. The existing Current Officials review correctly blocks County Commission seeding because the app-facing At-Large row does not match the official commissioner district model.

## Recommended model: Option C

Keep both models, with separate purposes:

1. Keep St. Lucie County Commission At-Large
   - Purpose: countywide onboarding, ballot grouping, and county election context.
   - This preserves existing app behavior and avoids breaking onboarding assumptions.

2. Add St. Lucie County Commission District 1 through District 5 later
   - Purpose: Current Officials mapping to official county commissioner districts.
   - These rows should be used for individual county commissioner Current Officials only after explicit approval.

## Proposed future district rows

Do not add these yet. They are proposed only:

- St. Lucie County Commission District 1
- St. Lucie County Commission District 2
- St. Lucie County Commission District 3
- St. Lucie County Commission District 4
- St. Lucie County Commission District 5

## Current Officials impact

County Commission current_officials rows should remain blocked until:

1. The Option C model is explicitly approved.
2. District 1 through District 5 row names and IDs are approved.
3. Official source URLs for all five commissioner districts are verified.
4. SQL insert plan is reviewed before execution.
5. UI behavior is checked to confirm At-Large and district-specific rows do not confuse users.

## App dependency found

src/app/onboarding/zip/page.tsx currently hardcodes:

- 11111111-0000-0000-0000-000000000003
- St. Lucie County Commission At-Large
- scope: county

This confirms the At-Large row is app-facing and should be retained.

## Documentation references reviewed

- CIVICMARKET_CURRENT_STATE.md
- docs/current_officials_sql_plan.md
- docs/current_officials_verified_source_checklist.md
- docs/civicmarket_build_guide_UPDATED_WITH_CURRENT_OFFICIALS_AND_REVIEW_SUMMARIES.md
- src/app/onboarding/zip/page.tsx
- src/app/ballot/page.tsx
- src/app/onboarding/districts/page.tsx
- src/components/CurrentOfficialsSection.tsx

## Risk Check

Scope:
County Commission district modeling only.

Result if implemented later:
CivicMarket can preserve countywide ballot/user assignment while also mapping Current Officials to the official District 1 through District 5 commissioner structure.

No-change risk:
County Commission current officials remain blocked because the current app row does not match official county commissioner source structure.

Test status:
Static repository search only. No runtime test performed.

Hard stops:
- Stop before schema changes.
- Stop before data changes.
- Stop before app code changes.
- Stop before deleting or renaming At-Large.
- Stop before seeding County Commission officials.
- Stop if District 1 through District 5 source references are incomplete.
