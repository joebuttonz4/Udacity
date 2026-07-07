# County Commission District 1-5 Assignment Lookup — Gate 10: Live UI Review

Date: July 7, 2026

## Current baseline

Repo HEAD at the start of this task: commit `38dd670` ("Add County Commission district settings link").

This document continues directly from Gate 9, which added a "Set County Commission District" link to Profile → Settings pointing at the Gate 8 draft page (`src/app/profile/county-commission/page.tsx`) and its dry-run-only API route (`src/app/api/set-county-commission-district/route.ts`). As of this baseline, nothing about app behavior, schema, seeds, migrations, `districts`, `user_districts`, `officials_for_user`, or the St. Lucie County Commission At-Large row has changed since Gate 9.

## Purpose

Record the results of a live, in-app UI review of the Gate 8/9 draft flow — the Profile Settings link and the `/profile/county-commission` page — including explicit confirmation that the write path remains disabled and that My Current Officials has not regressed to the disabled all-five-commissioner display. This is a review-and-documentation gate. It does not change app behavior.

## Gate 10 scope

This document is live UI review documentation only:

- Does not implement app behavior.
- Does not enable writes.
- Does not edit the API route write guard.
- Does not write to Supabase.
- Does not create or modify production `user_districts` rows.
- Does not change schema, seeds, migrations, `districts`, or `officials_for_user`.
- Does not rename, delete, replace, or repurpose the At-Large row.
- Does not deploy anything.

## Profile Settings link verification

**Result: PASS**

- "Set County Commission District" appears as a row in the Profile page's Settings card, alongside the existing "My Districts," "Data Sources," "Report an Issue," and disabled "Notifications"/"About CivicMarket" rows.
- The helper text — "Use the official St. Lucie County lookup tool to verify your district." — renders correctly beneath the label.
- The rest of the Profile page continues to render as before: identity card, Settings card, Account details, Civic DNA section, My Current Officials, and the beta disclaimer all appeared with no visual regression from the new row's addition.
- My Current Officials on Profile remained personal-action-first: it displayed only the officials tied to the reviewing user's own districts, with no reappearance of the disabled B2 all-five-County-Commission-via-At-Large expansion.

## County Commission page verification

**Result: PASS**

- `/profile/county-commission` loads when reached via the new Settings link.
- The ZIP-only unreliability warning is visible in the page header ("A ZIP code alone is not reliable for finding the right one — district boundaries can cross ZIP code lines.").
- The "Open official county lookup tool ↗" button, linking to the Gate 2 verified St. Lucie County ArcGIS "Who's My Commissioner" / Zone Lookup URL, is visible.
- The page states that CivicMarket does not collect or store the address on this page ("CivicMarket does not collect or store your address on this page.").
- The closed District 1-5 selection (five radio options: District 1 through District 5) is visible.
- The attestation checkbox ("I verified this district using the official St. Lucie County lookup tool.") is visible.
- Selecting a district and checking the attestation box correctly enables the "Save my district" submit button; the button remains disabled until both are set, matching the Gate 8 implementation.
- Bottom navigation continued to render normally on this page, consistent with the rest of the app.

## Dry-run/write-disabled confirmation

**Result: PASS**

- Submitting the form with a district selected and the attestation checkbox checked returned the dry-run response from `src/app/api/set-county-commission-district/route.ts`.
- The exact message rendered in the success state was: **"Write path disabled pending explicit approval. No user_districts row was created or modified."**
- This matches the literal string returned by the route while `ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE = false` (see `src/app/api/set-county-commission-district/route.ts`), confirming the live UI reflects the current disabled-write state rather than a stale or mocked message.
- No indication of a successful save (e.g., a "Saved" or district-confirmed state distinct from the dry-run message) appeared during this review.

## Current Officials personalization confirmation

**Result: PASS**

- The reviewing user's My Current Officials section on Profile showed only officials tied to that user's own `user_districts` rows.
- No County Commissioner rows (James Clasby, Larry Leet, Erin Lowry, Jamie Fowler, Cathy Townsend) appeared as a result of visiting or submitting the Gate 8/9 draft flow, consistent with the write path being disabled and no `user_districts` row having been created.
- This confirms the Path 1 personalization fix (disabling the B2 At-Large expansion, documented in `CIVICMARKET_CURRENT_STATE.md` under "County Commission Current Officials personalization fix") remains in effect and was not altered or bypassed by this review.

## No-change confirmation

- No app code was edited or created during this review.
- `ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE` was not changed — it remains `false`.
- The API route's write guard (`src/app/api/set-county-commission-district/route.ts`) was not edited.
- No Supabase write was performed.
- No `user_districts` row was created or modified, for any user, test or production.
- No schema was changed.
- No seed file was changed.
- No SQL migration was changed.
- No `districts` row was changed.
- No `officials_for_user` view was changed.
- The St. Lucie County Commission At-Large row (id `11111111-0000-0000-0000-000000000003`) was not renamed, deleted, replaced, or repurposed.
- `src/lib/officials.ts` was not changed.
- `src/components/CurrentOfficialsSection.tsx` was not changed.
- No deployment occurred.

## Remaining risks

- This review confirmed the dry-run response text and UI states visually; it did not exercise the route's failure paths (invalid district label, missing attestation, ambiguous district match) in this pass — those remain covered only by the static/code-level review from Gate 8, not by a live negative-path UI check.
- The reviewing session did not attempt a request with a missing or invalid Bearer token against the live route; the 401 auth-rejection path remains verified only by code inspection, not live observation.
- No live database read was performed to independently confirm zero `user_districts` rows were created during this review — the absence of a saved-state message and the unchanged My Current Officials display are treated as sufficient evidence for this gate, consistent with this project's no-database-tool-access constraint for UI-only review gates.
- The feature remains unlinked to any onboarding flow and is reachable only via the new Profile Settings row confirmed in this review; no additional entry points were checked because none exist.

## Deferred work

- Enabling `ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE` remains a separate, future, explicit approval — not addressed or implied by this review.
- Live negative-path testing (invalid enum values, missing attestation, missing/invalid auth token, ambiguous or zero district matches) remains deferred to a future gate, consistent with Gate 7's "Required manual tests" section, which requires its own separate authorization before any write-path test runs against a live account.
- A durable audit-table design for lookup attempts, if ever judged necessary, remains deferred per Gate 4/Gate 7.
- Determining and storing a user's specific County Commission District 1-5 automatically (rather than via this manual opt-in flow) remains out of scope; this manual flow is the only approved mechanism to date.

## Recommended next step

If the results recorded in this document are accepted, the recommended next step is a Gate 11 that either:

1. Requests separate, explicit authorization to run the negative-path and auth-rejection tests described in "Remaining risks" against a test account (still without enabling the write guard), or
2. Requests separate, explicit authorization to enable `ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE` for a single, scoped test-account write, with its own rollback plan re-confirmed from Gate 7 before proceeding.

Neither step is authorized by this document; both require their own explicit approval.
