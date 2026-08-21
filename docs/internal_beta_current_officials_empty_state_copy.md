# Current Officials Empty-State Copy Clarification

Date: 08-20-2026
Timestamp: 09:47 pm EST

Status: **Implemented and verified. UI copy only. No data/query behavior changed. No Supabase write. No deployment.**

## Why the old copy was misleading

The prior empty-state message —

> "Current officials will appear here after verified official source data is added."

— implied the *only* cause of an empty section is missing source data (i.e., a data-entry backlog CivicMarket will eventually clear). The fresh-production-account audit (`docs/internal_beta_fresh_account_district_initialization_audit.md`, commit `4b45238`) established this is not the full story: a fresh account's three auto-assigned districts (County Commission At-Large, Mayor, Florida Statewide) are two ballot-eligibility anchors that are **structurally never** going to have a directly-tied `current_officials` row (by design, not by data gap) plus one genuinely source-blocked seat (Mayor). The real reason most fresh users see this empty state is that their *representation* districts (as opposed to their *ballot-eligible* districts) haven't been verified yet — City Council District 1/3 and other verifiable seats require a separate confirmation step that ZIP code alone cannot safely perform, and that step hasn't been taken for a brand-new account. The old copy didn't communicate any of this and read as an open-ended "we haven't finished loading data" promise.

## New copy

Implemented in the single shared component both Home and Profile already used — `src/components/CurrentOfficialsSection.tsx` — inside the existing `officials.length === 0` branch:

**Primary:**
> "Your current officials will appear as your representation districts are verified."

**Secondary helper (new second line):**
> "Some districts require an additional verification step because ZIP codes can cross district boundaries."

Both lines use the task's exact preferred wording. The primary line keeps the same visual weight/position as the old single-line message (`text-[#9CA3AF] text-sm`); the secondary line is new, added directly below at a visually subordinate weight (`text-[#B8C4D0] text-xs`, `mt-2`) — consistent with the existing secondary-text pattern already used elsewhere on Home (e.g. the Top Matches dimension-count disclosure line).

The existing section-level helper, "Officials who currently represent you." (rendered above the loading/error/empty/populated states, unconditionally), was left unchanged — it remains accurate for both the populated and empty states and did not need adjustment.

No new buttons, links, or settings shortcuts were added, per the task's explicit instruction — even though a verified-assignment flow already exists at `/profile/city-council-district`, this task's scope was copy-only.

## No data behavior changes

- `getOfficialsForUser` / `officials_for_user` — not touched.
- `user_districts`, ZIP assignment (`ZIP_MANAGED_DISTRICTS`), ballot eligibility (`src/lib/ballotEligibility.ts`) — not touched.
- No write guard was enabled or modified.
- No Mayor `current_officials` row was created.
- The only source file changed is `src/components/CurrentOfficialsSection.tsx`, and the only change within it is the two lines of empty-state JSX text.

## Production audit basis

Directly built on the read-only findings in `docs/internal_beta_fresh_account_district_initialization_audit.md` (commit `4b45238`): a real fresh production account (ZIP 34953, `https://civicmarket.vercel.app`) was confirmed to have exactly 3 `user_districts` rows (County Commission At-Large, Mayor, Florida Statewide) and zero `current_officials` rows tied to any of them — confirmed by direct read-only query, not inferred. That audit is the sole factual basis for this copy change; nothing new was queried in this task.

## Deferred Mayor data work

Unchanged and unaffected: the Mayor `current_officials` row remains source-blocked (no official government source URL has been supplied for the current Mayor). Sourcing and seeding it — separately approved, its own future gate — would let the "Mayor" auto-assigned district actually resolve to a real officeholder for every PSL user, which is the single highest-leverage fix for this empty state, but is not this task's scope.

## Deferred City Council write-enablement decision

Unchanged and unaffected: `ENABLE_CITY_COUNCIL_DISTRICT_WRITE` remains `false`. The verified-assignment flow at `/profile/city-council-district` (already built and live-tested end-to-end in Gate I34) remains dry-run-only for all users, including the fresh production account. Enabling it for real users — which would let users self-verify City Council District 1/3 and see Stephanie Morgan or Anthony Bonna, Sr. — requires its own separate, explicit write-guard-enablement approval, not part of this copy-only task.

## Verification

`npm run build`: **passed**, 28 routes, no errors. `npm run lint`: **5 pre-existing errors only** (`scripts/*.cjs`), nothing new.

Live-verified against the already-authenticated local `civicmarket.test.01@example.com` session (real Supabase-backed dev server, no credentials entered):

| Check | Result |
|---|---|
| Populated Current Officials (Home) renders unchanged | **PASS** — Debbie Hawley, Stephanie Morgan, Tobin Rogers "Toby" Overdorf all render exactly as before, with "Officials who currently represent you." helper intact |
| Populated Current Officials (Profile) renders unchanged | **PASS** — identical content, confirming the shared component keeps Home and Profile consistent |
| Empty-state new copy renders correctly, no clipping | **PASS** — verified via a reversible, client-side-only DOM substitution of the officials-list container with the exact new empty-state markup (a pure visual-QA technique: no state, network call, or Supabase data was touched; the page was fully reloaded immediately afterward, restoring the real populated render with no lasting change). Screenshot confirmed both lines render with correct spacing, hierarchy, and no overlap with the fixed section helper above or "Your Ballot Races" below |
| Home/Profile consistency | **PASS** — same shared `CurrentOfficialsSection` component, confirmed used by both `src/app/page.tsx` and `src/app/profile/page.tsx` |
| No data/query behavior changed | **PASS** — confirmed by diff: only two JSX text lines in one file changed |

**Note on the empty-state check:** the fresh production account itself was not signed into for this verification (per the audit task's own instruction to leave it untouched, and per this session's constraint against entering credentials for any account). The reversible DOM-substitution technique above was used instead — it renders the exact same markup the real empty-state branch produces (verified by direct comparison against the JSX source), on the same live page, in the same styling context, without touching any account's real data.
