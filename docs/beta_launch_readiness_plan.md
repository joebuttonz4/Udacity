# CivicMarket Beta Launch Readiness Plan

## 1. Date and timestamp

Date: July 9, 2026
Timestamp: 09:40 am EDT

This document is planning only. It does not change app behavior, run Supabase writes, deploy anything, or modify the County Commission write guard.

## 2. Current repo baseline

- Branch: `master`
- Confirmed clean and up to date with `origin/master` at the time this plan was written.
- Latest pushed commit at the time this plan was requested: `fe298ba` ("Add County Commission Gate 16 write readiness check").
- One additional documentation-only commit has since landed on top of that baseline: `b18c6a1` ("Review County Commission district assignment write path" — Gate 17A non-write code review). This plan is written against the current actual baseline (`b18c6a1`), which is a strict superset of the `fe298ba` baseline named in the request — no app behavior changed between the two.
- Working tree was clean with no uncommitted changes when this plan was created.

## 3. Current County Commission safety baseline

- County Commission District 1-5 assignment lookup is complete through Gate 17A (Gates 1-16 plus a non-write code review).
- Gate 16 result: **NOT READY** for write execution — blocked strictly on user-provided test-account details and explicit write-guard approval.
- Gate 17A (code review) found all reviewed safety properties intact, plus two non-blocking hardening recommendations (delete-scope-length assertion, dry-run response trimming) that are not safety-critical and were not applied.
- `ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE = false` in `src/app/api/set-county-commission-district/route.ts` — unchanged.
- The County Commission write path remains dry-run only.
- No Supabase writes have occurred under this feature. No `user_districts` rows have been created or modified. No deployment has occurred.
- This plan does not change any of that. It only sequences what must happen, and in what order, before the write path can ever be enabled — and does not enable it itself.

## 4. Beta launch goal

Get CivicMarket in front of real users in two deliberate stages — a small internal shakedown, then a small controlled Port St. Lucie beta — while keeping the fastest honest path to each stage: build only what each stage actually requires, defer everything else, and never let a real user see broken, incomplete, or unverified data.

## 5. User-selected beta direction

The following decisions have already been made by the user and are treated as fixed inputs to this plan, not open questions:

- **Beta style:** two-stage plan — Internal Beta first, then Controlled PSL Beta before any larger 25-50 user beta.
- **Optimization target:** fastest honest path to each stage, not maximum feature completeness.
- **UI quality bar:** highly polished — visual/UX polish is a real requirement, not a nice-to-have, before real PSL users arrive.
- **Civic DNA:** core and non-negotiable for both stages.
- **Match scores:** important, but coverage may be limited/partial during Internal Beta — the underlying mechanism must work end-to-end, not necessarily for every candidate.
- **County Commission District 1-5:** required for beta — specifically, required to be safely tested with an approved test account before Controlled PSL Beta (not necessarily before Internal Beta starts).
- **District lookup preference (general, forward-looking):** ZIP plus street name, rather than ZIP-only or a full free-text address, is the user's stated preferred direction for improving district-lookup precision generally. This is noted here as a product-direction preference for future onboarding/district-lookup refinement — it does **not** override the County Commission District 1-5 guardrails already established in Gates 1-16 (ZIP-only remains explicitly unsafe for County Commission specifically, per the Gate 2 boundary-seam finding). Any future change to the County Commission lookup mechanism itself would need its own gate.
- **Data completeness:** incomplete candidate/race data must be hidden until complete — no partial or broken-looking races shown to real users.
- **Legal pages:** Terms, Privacy, and Corrections must be published before real PSL users see the app; full attorney review can happen later (draft/beta-disclaimer language is acceptable for now, as already used on `/privacy` and `/terms`).
- **Invite code:** may start hardcoded (current `INVITE_CODE` env var approach is acceptable); a Supabase-backed invite-code table is a cleaner future improvement, not a beta requirement.
- **Smoke testing:** should be fast and limited to genuinely launch-critical checks — not a full regression suite.
- **Explicitly deferred:** PWA/full service worker, SMS (Twilio), full 5-tab admin dashboard, push notifications, public launch, and advanced automation (Firecrawl, Gemini automation, Agents 1-3) — none of these are in scope for either beta stage.

## 6. Must-have before Internal Beta

- Civic DNA quiz works end-to-end (already confirmed complete and tested per `CIVICMARKET_CURRENT_STATE.md`).
- Automatic match score generation after Civic DNA completion works end-to-end for at least the trusted testers' own districts (already confirmed complete, commit `4c4479d`/`f4e5786`) — full candidate coverage is not required at this stage.
- Onboarding (signup → ZIP → districts → DNA teaser → quiz → calculating) functions without error for a fresh account.
- Ballot, Home, Candidate Profile, Measure Profile (if a real measure exists), Vote screen, and Profile screens all load without error using current real/dummy data.
- Invite code gate (`/api/validate-invite`) works for the 1-3 trusted testers' invite codes.
- A UI polish pass has been done on the core flows a tester will actually touch (onboarding, ballot, candidate profile, profile) — this is the "highly polished" bar the user set, applied first to the smallest surface area that matters for Internal Beta.
- Candidate/race data-completeness filtering is at least planned (does not have to be fully built yet, since Internal Beta testers are trusted and can tolerate seeing in-progress data) — full hiding of incomplete rows is a Controlled PSL Beta requirement (see Section 7).
- Candidate and legislation/measure review submission is **planned** (data model, UI shape, RLS approach) — it does not need to be built yet for Internal Beta.

## 7. Must-have before Controlled PSL Beta

- Everything in Section 6, fully working, not just for trusted testers but for the intended small controlled PSL group.
- Civic DNA and match scores are core, not optional, for this stage — match score coverage should be as complete as real `candidate_positions` data allows for the candidates in scope.
- County Commission District 1-5 assignment must be safely tested end-to-end using one approved test account (Gate 17B/18, see Section 12) **before** this stage begins. This is the one item explicitly gated on user-provided approval (the Gate 15 final approval statement) — it cannot be fast-tracked without that approval.
- County Commission candidates must be included in match scoring/ballot display for any user who belongs to that district, once the district assignment mechanism above is proven safe and (if the user chooses) enabled beyond the single test account.
- User reviews must exist and work — for both candidates and legislation/ballot measures — including submission UI, RLS-guarded writes, and read display. This is a new build item (see Section 11); it does not exist in the app today.
- Invite code gate required (already built and working).
- Terms, Privacy, and Corrections pages published. Terms and Privacy already exist; **Corrections is a new small static page** (no route currently exists for it — confirmed by inspection of `src/app`) and needs to be built, matching the existing `/privacy`/`/terms` pattern (beta-draft disclaimer acceptable, full attorney review deferred per user decision).
- Report Inaccuracy and Data Sources required — both already exist and are database-backed/static respectively.
- Incomplete candidate/race data must be hidden — any candidate or race missing required fields must not render in the ballot or candidate listing until complete. This is stricter than the existing `archived_at IS NULL` filtering and needs its own explicit completeness check.
- A larger manual civic feed is preferred before real PSL users see the app, though it is a "should-have" rather than a hard blocker (see Section 8).

## 8. Should-have before Controlled PSL Beta

- Larger manual civic feed content (more than a minimal placeholder set) — preferred, not strictly blocking, per the user's framing ("larger manual civic feed preferred").
- Additional UI polish beyond the Internal Beta pass, informed by whatever trusted-tester feedback comes out of Stage 1.
- Any hardening from the two non-blocking Gate 17A recommendations (delete-scope-length assertion, dry-run response trimming) — worth doing before County Commission writes are ever broadened beyond the single approved test account, but not required to complete the single test itself.

## 9. Safe to defer until after beta

- PWA / full service worker.
- SMS (Twilio).
- Full 5-tab admin dashboard (current minimal admin entry/records pages are sufficient).
- Push notifications.
- Public launch features generally.
- Firecrawl, Gemini automation, Agents 1, 2, and 3.
- Campaign portal.
- Expo mobile app.
- Federal races.
- Voter roll matching (and, specifically, the SOE voter lookup tool for County Commission — already permanently excluded, not just deferred).
- Migrating the invite code from a hardcoded env var to a Supabase-backed invite-code table.
- Full attorney legal review of Terms/Privacy/Corrections (draft/beta-disclaimer language is sufficient for both beta stages).
- Broadening County Commission District 1-5 assignment beyond the single approved test account, until that test is explicitly approved, executed, and verified.

## 10. Current status of each known build-guide blocker

Restated from `CIVICMARKET_CURRENT_STATE.md`'s "Hard beta blockers" section, condensed to status only:

| Blocker | Status |
|---|---|
| Real PSL candidate and funding data imported | ✓ Done (4 real District 1 candidates, funding rows with SOE source URLs) |
| Voting records with official source URLs | Intentionally not done — all 4 candidates are non-incumbents with no verified Council vote history; remains blocked on an official item-specific source, not an app bug |
| Legal pages exist | ✓ Done for Privacy/Terms; Corrections is a new item (see Section 7) |
| Invite code gate works | ✓ Done (hardcoded env var, acceptable per user decision) |
| Report Inaccuracy database-backed submission exists | ✓ Done |
| Data Sources exists | ✓ Done |
| Admin can enter voting records | ✓ Done |
| Admin review/removal page exists | ✓ Done |
| Security patch applied | ✓ Done |
| Ballot match rings display fixed | ✓ Done |
| Profile sign out visible | ✓ Done |
| Candidate profile Report Inaccuracy link | ✓ Done |
| Automatic match score generation after Civic DNA | ✓ Done |
| `/measures/[id]` smoke test | ✓ Done (route verified; no real measure exists yet — real measures pending official source confirmation) |
| Email confirmation re-enabled | ✓ Done |

All previously known blockers are either complete or intentionally, correctly blocked on missing official source data (not app bugs). The only genuinely new gap identified is reviews (Section 11).

## 11. New blocker: candidate and legislation/measure reviews

This is a newly identified gap, not previously listed in `CIVICMARKET_CURRENT_STATE.md`'s Hard Beta Blockers, surfaced while preparing this plan:

- A `reviews` table already exists in the reference schema (`Reference Files/civicmarket_schema_v4.sql`), with `candidate_id`, `measure_id`, `rating`, `body`, and moderation fields, RLS-enabled with SELECT/INSERT policies. The May 17 2026 security grant patch (recorded in `CIVICMARKET_CURRENT_STATE.md`) separately confirmed the deployed table's grants are "SELECT and INSERT only (no UPDATE)."
- However, a repo-wide search confirms **zero application code** — no `src/lib` helper, no UI component, no page — reads or writes this table today. The table exists at the database level; nothing in the app uses it.
- This means candidates and measures currently have no visible review/rating surface at all, and users have no way to submit one.
- This is a **must-have for Controlled PSL Beta** (Section 7) because the user has explicitly required user reviews for both candidates and legislation/ballot measures at that stage. It only needs to be **planned** (not built) for Internal Beta (Section 6).
- Recommended shape for the planning work: a review submission form on `/candidates/[id]` and `/measures/[id]` (star or numeric rating + optional text body), writing to the existing `reviews` table via the existing authenticated anon-client RLS-guarded pattern (matching `/onboarding/zip`'s established convention, since INSERT is already permitted by RLS for `auth.uid() = user_id`), plus a read-only display of existing active (`moderation_status = 'active'`) reviews. No admin moderation UI is required for beta — moderation can remain a manual/SQL-level action for now, consistent with the "minimal admin" scope already locked in `CLAUDE.md`.

## 12. County Commission District 1-5 gate sequence

Recap of what already exists and what remains:

- **Gates 1-7 (complete):** source verification, storage decision, implementation plan, approval checklists, draft implementation, boundary approval.
- **Gate 8 (complete):** draft code created — `src/app/profile/county-commission/page.tsx` and `src/app/api/set-county-commission-district/route.ts` — write path disabled via `ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE = false`.
- **Gate 9 (complete):** Profile Settings link added, making the draft page reachable.
- **Gate 10 (complete):** live UI review passed.
- **Gate 11 (complete):** negative-path/auth-rejection tests passed.
- **Gate 12-15 (complete):** progressively detailed approval packaging for a single scoped test-account write — culminating in a "final approval statement" template with every field (test account user ID, email, district label, expected district ID, and three explicit write-guard/no-deploy approvals) still marked PENDING USER APPROVAL.
- **Gate 16 (complete):** readiness check — result NOT READY, blocked strictly on those same user-provided fields.
- **Gate 17A (complete):** non-write code review — all checks passed, two non-blocking hardening recommendations noted, no code changed.
- **Gate 17B (not started, blocked on user approval):** would execute the single scoped test-account write, following the exact 8-step sequence already documented in Gate 15/16 (temporarily enable the guard, run one approved request through one approved test account, verify, immediately restore the guard to `false`, verify again). Cannot proceed without the user providing the Gate 15 final approval statement.
- **Gate 18 (not started, depends on 17B):** post-test verification and, if needed, rollback — confirming the At-Large row is unchanged and exactly one County Commission District 1-5 row exists for the test account.
- **Gate 19 (not started, depends on 18, and is a separate future decision):** whether and how to broaden District 1-5 assignment beyond the single test account for Controlled PSL Beta users — still bound by every existing guardrail (no ZIP-only assignment, no At-Large-based assignment, At-Large preserved, no all-five-commissioner display restored).

Per Section 5's user decision, Gate 17B does not have to happen before Internal Beta starts — it must happen before Controlled PSL Beta starts. It can run in parallel with Internal Beta prep work.

## 13. Safe verification order

The order in which things should be confirmed, so that no stage is entered on an unverified foundation:

1. `git status` clean and `origin/master` up to date (already true at this baseline).
2. `npm run build` passes with no new errors (already true through Gate 17A).
3. `npm run lint` shows only the known pre-existing `scripts/*.cjs` require-import errors, nothing new.
4. Internal Beta core-flow verification (Civic DNA, match scores, onboarding, ballot, candidate/measure profiles) — manual, using trusted-tester accounts.
5. Invite code gate verified working for the trusted testers' codes.
6. UI polish pass reviewed against the core flows before inviting testers.
7. County Commission safe test (Gate 17B/18) — only after the user provides the Gate 15 final approval statement — run independently of, and without blocking, items 4-6.
8. Reviews feature planned (Internal Beta) then built and verified (Controlled PSL Beta prep).
9. Data-completeness hiding verified — confirm no incomplete candidate/race renders in the ballot.
10. Legal pages (Terms, Privacy, Corrections) verified published and linked.
11. Fast smoke test (Section 17) run immediately before each stage's actual launch moment.

## 14. Work plan by gate

- **Gate I1 (Internal Beta prep, no Supabase write approval needed):** UI polish pass on onboarding/ballot/candidate profile/profile; confirm Civic DNA and match-score generation end-to-end for trusted-tester accounts; write the reviews feature plan (data model reuse of existing `reviews` table, UI shape, RLS approach) without building it yet.
- **Gate I2 (Internal Beta launch):** invite 1-3 trusted testers using the existing hardcoded invite code; run the fast smoke test (Section 17) immediately before sending invites.
- **Gate CC-17B (County Commission safe test, gated on user approval, can run in parallel with I1/I2):** user provides the Gate 15 final approval statement; execute the single scoped test-account write exactly per the Gate 15/16 8-step sequence; verify; restore the guard to `false` immediately.
- **Gate CC-18 (depends on CC-17B):** post-test verification against the documented expected result; rollback only if verification fails; confirm At-Large row unchanged.
- **Gate PSL1 (Controlled PSL Beta prep):** build and verify the reviews submission/display feature for candidates and measures; build the Corrections page; build and verify candidate/race data-completeness hiding; expand manual civic feed content; re-confirm match score coverage for the PSL beta candidate set.
- **Gate CC-19 (Controlled PSL Beta prep, depends on CC-18 and is its own separate approval):** decide whether/how to broaden County Commission District 1-5 assignment beyond the single test account for the PSL beta group, still bound by every existing guardrail.
- **Gate PSL2 (Controlled PSL Beta launch):** run the fast smoke test again; invite the small controlled PSL group using the invite code gate.

## 15. No-write/no-deploy boundaries

The following apply to this plan and to every gate described in it, until separately and explicitly approved at the time each gate is actually executed:

- Do not enable `ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE` without explicit approval.
- Do not run production Supabase writes.
- Do not create or modify `user_districts` rows.
- Do not use ZIP-only assignment for County Commission District 1-5.
- Do not use At-Large membership to assign District 1-5.
- Do not rename, delete, replace, or repurpose the At-Large row.
- Do not restore the all-five-County-Commission-via-At-Large display.
- Do not change app behavior, run Supabase writes, or deploy anything as part of producing or updating this plan document.
- Do not change schema, seeds, migrations, `districts`, `officials_for_user`, `src/lib/officials.ts`, `CurrentOfficialsSection`, or the At-Large row as part of producing or updating this plan document.

## 16. Testing plan

**Internal Beta testing (manual, trusted testers):**
- Fresh-account onboarding through to a completed Civic DNA quiz.
- Confirm match scores generate automatically and appear on the ballot for at least the tester's own district's candidates.
- Confirm Home, Ballot, Candidate Profile, Measure Profile (if any real measure exists), Vote, and Profile screens all load without error.
- Confirm invite code gate rejects a wrong code and accepts the correct one.
- Confirm Report Inaccuracy and Data Sources are reachable and functional (UI-only for Report Inaccuracy per current scope, or database-backed if already upgraded).

**County Commission safe test (only once approved):**
- Follow the Gate 15/16 8-step sequence exactly, using only the one approved test account and district.
- Confirm the resulting `My Current Officials` shows exactly the one expected commissioner, with no broader all-five display.
- Confirm the At-Large row is unchanged before and after.

**Controlled PSL Beta testing (manual, small controlled group + before-launch check):**
- Everything above, at PSL-beta scale.
- Submit and view a review for at least one candidate and, if a real measure exists, one measure; confirm RLS prevents editing another user's review and prevents inserting a duplicate review for the same user/candidate pair (per the schema's `UNIQUE(user_id, candidate_id, measure_id)` constraint).
- Confirm any candidate/race with incomplete data does not render anywhere in the ballot or listings.
- Confirm Terms, Privacy, and Corrections pages are all reachable and show the beta-draft disclaimer.

## 17. Fast smoke test checklist

Deliberately short — launch-critical only, run immediately before each stage's invite goes out:

- [ ] `npm run build` passes.
- [ ] Invite code gate accepts the correct code and rejects an incorrect one.
- [ ] Signup → email confirmation → ZIP → districts → DNA quiz → calculating completes without error.
- [ ] Ballot loads and shows at least one race with match-score rings unlocked.
- [ ] Candidate Profile loads for at least one candidate.
- [ ] Profile screen loads, shows Civic DNA results, and sign-out works.
- [ ] Report Inaccuracy and Data Sources pages load.
- [ ] Terms and Privacy pages load (Corrections also, once built).
- [ ] My Current Officials shows only the expected officials for a known test account (no unexpected all-five County Commission display).
- [ ] No console errors on any of the above screens in a real browser pass.

## 18. Deferred post-beta items

- PWA / full service worker.
- SMS (Twilio).
- Full 5-tab admin dashboard.
- Push notifications.
- Public launch features generally.
- Firecrawl, Gemini automation, Agents 1, 2, and 3.
- Campaign portal.
- Expo mobile app.
- Federal races.
- Voter roll matching (including the SOE voter lookup tool, permanently excluded for County Commission district assignment specifically).
- Supabase-backed invite-code table (replacing the current hardcoded env var).
- Full attorney legal review of Terms/Privacy/Corrections.
- Broadening County Commission District 1-5 assignment beyond the single approved test account (Gate 19, its own future approval).
- Admin moderation UI for reviews (manual/SQL-level moderation is sufficient for beta).
- The two non-blocking Gate 17A hardening recommendations, unless the user chooses to prioritize them before broadening County Commission writes.

## 19. Recommended next action

Two independent tracks can proceed in parallel, since neither blocks the other:

1. **Internal Beta prep (no approval needed to start):** begin Gate I1 — the UI polish pass and end-to-end Civic DNA/match-score verification — since none of this requires a Supabase write or touches the County Commission write guard.
2. **County Commission safe test (blocked on user approval):** if the user wants to unblock Gate 17B in parallel, the next concrete action is providing the completed Gate 15 final approval statement (test account user ID, email, district label, expected district ID, and the three explicit write-guard/no-deploy approvals).

Neither track requires deploying, writing to Supabase, or changing the write guard as part of this planning document itself — both remain separate, future, explicitly-approved actions.
