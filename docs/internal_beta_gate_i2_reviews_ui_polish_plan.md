# Internal Beta — Gate I2: Reviews and UI Polish Planning

## 1. Date and timestamp

Date: 07-09-2026
Timestamp: 09:55 am EDT

This document is planning only. It does not change app behavior, run Supabase writes, deploy anything, or touch the County Commission write guard.

## 2. Current repo baseline

- Branch: `master`, working tree clean, up to date with `origin/master`.
- Latest pushed commit: `af59640` ("Add internal beta Gate I1 prep review").
- `npm run build` passed with 24 routes at that baseline.
- `ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE = false`, County Commission District 1-5 remains dry-run only — unchanged, not touched by this document.

## 3. Gate I1 findings summary

Restated from `docs/internal_beta_gate_i1_prep_review.md`:

- Civic DNA (`src/lib/dna.ts`) and match score display/generation are implemented and working.
- Candidate and measure review submission/display are **missing entirely** from `src/` — no code touches the `reviews` table anywhere, despite the table existing (RLS-enabled, SELECT+INSERT confirmed granted) in the deployed schema.
- Corrections page is **missing** — no route exists.
- Report Inaccuracy exists and is linked from `/candidates/[id]`, but **not** from `/measures/[id]`.
- Data Sources, Terms, and Privacy all exist and are confirmed complete.
- No stricter-than-`archived_at IS NULL` data-completeness filter exists for candidates or measures.
- County Commission District 1-5 remains dry-run only, confirmed unchanged.

## 4. Internal Beta goal

Per `docs/beta_launch_readiness_plan.md`: prove the core app flow with 1-3 trusted testers before any real PSL user sees the app. Civic DNA is core; match score coverage may be limited; County Commission District 1-5 must be safely tested with one approved test account before Controlled PSL Beta (not necessarily before Internal Beta starts); candidate and legislation/measure review submission must be **planned** as a beta requirement during this stage. This document is that planning artifact.

## 5. Reviews feature goal

Give users a way to leave a personal rating/opinion on a candidate or ballot measure, distinct from the existing fact-correction flow (`/report`), using the `reviews` table that already exists in the deployed schema (confirmed via `Reference Files/civicmarket_schema_v4.sql` and the May 17 2026 security grant patch notes) but is currently unused by any app code. The goal for beta is the smallest safe version of this: submit once, display publicly, no editing, no admin UI, manual moderation only if needed.

Reference schema shape (`reviews` table, from `civicmarket_schema_v4.sql`):
- `id`, `user_id`, `candidate_id`, `measure_id`, `rating` (smallint, required), `body` (text, optional), `helpful_count`, `verification_tier_at_submission`, `review_weight`, `flagged_at`, `flag_count`, `flag_reasons`, `moderation_status` (default `'active'`), `moderated_at`, `moderated_by`, `created_at`.
- `UNIQUE(user_id, candidate_id, measure_id)` — at most one review per user per candidate, and at most one per user per measure.
- RLS: `SELECT` where `moderation_status = 'active'` (public read of active reviews only), `INSERT` where `auth.uid() = user_id` (self-only writes).
- **Important constraint confirmed in Gate I1:** the deployed table's grants are "SELECT and INSERT only (no UPDATE)" per the grant patch — even though the reference SQL defines an UPDATE policy, UPDATE is not currently usable in production. This means **editing a submitted review is not available today** without a separate, explicit grant change, which is out of scope for this planning document (see Section 15).

## 6. Candidate review requirements

- Auth-gated — reuse the existing `supabase.auth.getSession()` pattern already used on `/candidates/[id]`.
- One rating field (recommend a 1-5 star scale, since the schema only specifies `smallint NOT NULL` without a documented range — this choice should be confirmed at implementation time, not assumed fixed by this planning document) plus an optional free-text `body`.
- Insert via the existing authenticated anon-client RLS-guarded pattern (`supabase.from('reviews').insert(...)`), matching the established convention (e.g. `/onboarding/zip`'s writes), not a service-role route — no new API route is needed for this, since the existing INSERT policy already scopes writes to `auth.uid() = user_id`.
- **Duplicate handling:** before showing the submission form, check whether the current user already has a review for this `candidate_id`. If one exists, show it read-only with a "You already reviewed this candidate" message instead of a form — do not attempt an `upsert` or `update`, since UPDATE is not currently granted (Section 5) and would fail.
- No street address or other PII beyond what the account already has (display name only, see Section 8).
- `source_url` is not applicable to reviews — reviews are personal opinion, not a sourced factual claim like a voting record.

## 7. Measure/legislation review requirements

Same shape as Section 6, keyed to `measure_id` instead of `candidate_id`:

- Auth-gated, same session pattern as `/measures/[id]` already uses.
- Same 1-5 rating + optional body shape.
- Same duplicate-check-before-insert behavior, scoped to `(user_id, measure_id)`.
- Requires new UI on `/measures/[id]`, since that page currently has **zero** review-related code (confirmed in Gate I1) — this is a larger addition to that page than to the candidate page, which is at least already the more feature-complete of the two.

## 8. Review display requirements

- Read-only list of reviews where `moderation_status = 'active'` for the given `candidate_id` or `measure_id`, ordered newest-first (`created_at desc`) for beta simplicity — sorting by `helpful_count` is explicitly deferred (Section 15), since no "mark helpful" UI is part of this plan.
- Each review shows: rating, optional body, reviewer's `profiles.display_name` (never raw email — matches the existing privacy posture already used elsewhere in the app, e.g. Profile page shows display name, not email, to other contexts), and a relative or short date.
- No edit or delete controls shown for any review, including the viewing user's own — consistent with Section 6's "no editing available" constraint.
- No "helpful" voting control — `helpful_count` exists in the schema but incrementing it safely would need its own RLS-guarded write path, which is explicitly deferred (Section 15).

## 9. Review moderation requirements for beta

- No admin moderation UI is required for beta, consistent with `CLAUDE.md`'s locked "minimal admin" scope (do not build a full 5-tab admin).
- Manual/SQL-level moderation only: if a review needs to be hidden, an admin can set `moderation_status` to a non-`'active'` value directly in the Supabase SQL Editor, exactly mirroring how the project has already handled other moderation-adjacent needs (e.g. the manual `voting_records` removal flow before `/admin/records` existed).
- No user-facing "flag/report a review" button is required for beta MVP. If abuse handling becomes necessary, it can reuse the existing `/report` pattern in a future gate rather than building new flagging UI now.
- No automated or AI-assisted moderation for beta.

## 10. UI polish pass requirements

Scope: the surfaces a trusted Internal Beta tester will actually touch — onboarding (`signup`, `zip`, `districts`, `dna-teaser`, `quiz`, `calculating`), `/ballot`, `/candidates/[id]`, `/measures/[id]`, `/profile`. Admin screens are explicitly out of scope (Gate I1, Item 2).

- Consistency check against the already-locked coastal design system (`docs/design/README.md`): color usage (teal/blue/indigo scope tags), Syne for headings vs. Instrument Sans for body copy, card shadow/radius conventions — this pass is about catching drift from the established system, not introducing new patterns.
- Loading, error, and empty states reviewed on each of the screens above — confirm every screen has a real loading skeleton and a real error state (most already do, per Gate I1's file reads; this is a verification pass, not a rebuild).
- Mobile-first verification at real device widths (roughly 360-430px), consistent with `CLAUDE.md`'s "mobile-first" instruction.
- Copy audit: no screen should reference a feature that doesn't exist yet (e.g., do not show a "reviews" section anywhere until the reviews feature from Sections 6-9 actually ships) — this matters because this plan intentionally splits "plan the reviews feature" (this gate) from "build it" (a future gate).

## 11. Corrections page requirement

- New static route, e.g. `src/app/corrections/page.tsx`, matching the existing `/privacy` and `/terms` pattern (static content, beta-draft disclaimer, no Supabase reads beyond auth if any).
- Content should explain how CivicMarket handles factual corrections — how `/report` submissions are reviewed, how `voting_records`/`candidate_positions`/`ballot_measures` data gets corrected once verified, and how this differs from the (planned) reviews feature, which is personal opinion rather than a factual correction.
- Same beta-draft/attorney-review-later posture already used on `/privacy` and `/terms`, per the user's existing decision (`docs/beta_launch_readiness_plan.md` Section 5).
- Should be linked from `/data-sources` and from Profile Settings, alongside the existing "Data Sources" and "Report an Issue" rows.

## 12. Measure Report Inaccuracy requirement

- Add a "Report an Inaccuracy" link to `/measures/[id]`, mirroring the existing pattern already on `/candidates/[id]` (a `Link` to `/report`, placed near the bottom of the page, after the beta disclaimer).
- No changes needed to `/report` itself — it is already generic and not candidate-specific in its current UI-shell form.
- Small, low-risk, independent of the reviews feature — can be done first (Section 14).

## 13. Data-completeness hiding requirement

- Goal: a candidate or race must not render anywhere in the ballot or listings unless it meets a defined minimum-completeness bar, per the user's decision in `docs/beta_launch_readiness_plan.md` Section 5.
- **Design decision needed, not made by this document:** whether completeness is (a) an application-layer computed check (e.g., `getCandidatesForDistricts` additionally filters out rows missing required fields like `bio`/`photo_url`/`office`/valid `district_id`/valid `election_id`) with **no schema change**, or (b) an explicit admin-controlled `is_published` boolean column added to `candidates`/`ballot_measures`, which **would** require a schema change.
- This planning document recommends option (a) — a pure application-layer computed filter — as the faster path consistent with the user's "optimize for fastest path" decision and because this Gate I2 document is explicitly barred from proposing schema changes. Option (b) remains available as a future alternative if computed filtering proves insufficient once real PSL data volume grows.
- The exact required-field list (what counts as "complete" for a candidate vs. a measure) is not fixed by this document and should be decided at implementation time, informed by what fields the real PSL data currently has (per `CIVICMARKET_CURRENT_STATE.md`, the 4 real District 1 candidates already have bios/photos from the July 2 2026 import — this filter would mostly matter for future candidates added with partial data).
- This item is listed as its own step in Section 14 because it depends on that field-list decision, which is better made once reviews and Corrections are underway and the team has a clearer sense of what "complete" needs to mean in practice.

## 14. Suggested implementation order

Fastest-path sequencing, smallest/most independent items first:

1. **Corrections page** (Section 11) — new static page, no dependencies, matches an existing pattern exactly.
2. **Measure Report Inaccuracy link** (Section 12) — one-line addition to an existing page, no dependencies.
3. **UI polish pass** (Section 10) — can run in parallel with 1-2, touches many files but each change is independent and low-risk.
4. **Reviews feature — candidates** (Section 6, 8, 9) — build submission + display for `/candidates/[id]` first, since that page is already the more feature-complete of the two and has an existing tab structure to extend.
5. **Reviews feature — measures** (Section 7, 8, 9) — extend the same pattern to `/measures/[id]` once the candidate-side implementation is proven.
6. **Data-completeness hiding** (Section 13) — last, since it depends on a required-field-list decision that benefits from being made after items 1-5 give more visibility into real data shape.

Items 1-3 have no Supabase-write implications beyond what already exists. Items 4-5 introduce new INSERT writes (self-scoped, RLS-guarded, no schema change). Item 6 is read-side filtering only, no write implications.

## 15. No-write/no-deploy boundaries

The following apply to this plan and to every future implementation gate it leads to, until separately and explicitly approved at the time each gate is actually executed:

- Do not change app behavior as part of producing or updating this plan document.
- Do not run Supabase writes as part of producing or updating this plan document.
- Do not deploy as part of producing or updating this plan document.
- Do not enable `ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE`.
- Do not modify `user_districts`.
- Do not change schema, seeds, migrations, `districts`, `officials_for_user`, `src/lib/officials.ts`, `CurrentOfficialsSection`, or the At-Large row.
- Explicitly deferred, requiring their own future approval gate before any implementation: granting UPDATE on `reviews` (to allow editing a submitted review), building "mark helpful" write capability, building a review-flagging UI, and Option (b) from Section 13 (an `is_published` schema column) if Option (a) ever proves insufficient.

## 16. Testing plan

For the future implementation gates this plan leads to (not performed now):

- **Reviews — submission:** confirm a signed-in user can submit exactly one review per candidate and one per measure; confirm a second submission attempt for the same candidate/measure is blocked client-side (duplicate check) and, if bypassed, fails at the database level via the `UNIQUE(user_id, candidate_id, measure_id)` constraint rather than silently overwriting.
- **Reviews — display:** confirm only `moderation_status = 'active'` reviews render; confirm a review with a different `moderation_status` (set manually via SQL) does not appear.
- **Reviews — RLS:** confirm a user cannot insert a review with a `user_id` other than their own (should already be blocked by the existing `auth.uid() = user_id` INSERT policy — this is a re-verification, not new RLS work).
- **Corrections page:** loads without error, auth behavior (if any) matches `/privacy`/`/terms`.
- **Measure Report Inaccuracy link:** navigates to `/report` correctly from `/measures/[id]`.
- **Data-completeness hiding:** confirm a deliberately incomplete test candidate/measure does not appear in `/ballot` or in direct navigation to its profile route, while a complete one does.
- **UI polish pass:** manual visual review pass across the in-scope screens at mobile widths, no automated test needed.

## 17. Fast smoke test checklist

Short, launch-critical-only, to run once the above is implemented and before any Internal Beta invite goes out (extends the existing checklist in `docs/beta_launch_readiness_plan.md` Section 17):

- [ ] `npm run build` passes.
- [ ] `/corrections` loads without error.
- [ ] `/measures/[id]` shows a "Report an Inaccuracy" link.
- [ ] A test account can submit exactly one review for a candidate and see it displayed.
- [ ] A second review attempt by the same account for the same candidate is blocked (UI-level, not a raw DB error shown to the user).
- [ ] A deliberately incomplete test candidate does not appear on `/ballot`.
- [ ] No console errors on any of the above screens in a real browser pass.

## 18. Recommended next gate

Two independent, low-risk tracks that don't require any Supabase-write approval beyond what's already granted (self-scoped INSERT on `reviews`, already permitted by existing RLS):

1. **Gate I3 (small, fast):** implement the Corrections page (Section 11) and the Measure Report Inaccuracy link (Section 12) — both are small, independent, and match existing patterns exactly.
2. **Gate I4 (larger):** implement the reviews feature for candidates first, then measures (Sections 6-9), following the order in Section 14.

Data-completeness hiding (Section 13) and the UI polish pass (Section 10) can be scheduled as their own gates once items 1-2 give more concrete shape to what "complete" needs to mean and what the polished surfaces should look like with reviews present.

The County Commission safe test (Gate 17B) remains a fully separate, parallel track, still blocked strictly on the user providing the Gate 15 final approval statement — unaffected by anything in this document.
