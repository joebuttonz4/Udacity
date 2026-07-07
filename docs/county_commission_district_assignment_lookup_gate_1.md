# County Commission District 1-5 Assignment Lookup — Gate 1

Date: July 7, 2026

## Current baseline

Repo HEAD at the start of this task: commit `7b44736` ("Record Gate F live UI verification for County Commission fix").

This document starts after the Path 1 personalization fix (Gate D, commit `af6d76e`) disabled the B2 At-Large expansion in `src/lib/officials.ts`. As of this baseline:

- `getOfficialsForUser(userId)` returns only the primary `officials_for_user` result. It no longer supplements County Commission District 1-5 officials for At-Large-holding users.
- Five St. Lucie County Commission District 1-5 rows exist in `districts` (ids `...031` through `...035`), inserted per the Gate 6 execution documented in `docs/county_commission_district_1_5_future_implementation_plan.md`.
- Five `current_officials` rows exist for District 1-5 (James Clasby, Larry Leet, Erin Lowry, Jamie Fowler, Cathy Townsend), per the Gate D execution documented in `docs/county_commission_current_officials_b2_implementation_plan.md`.
- No `user_districts` row has ever pointed at any of the five District 1-5 ids.
- The St. Lucie County Commission At-Large row (id `11111111-0000-0000-0000-000000000003`) is unchanged and continues to serve onboarding, ballot grouping, and county election context.

## Purpose

Document, for future reference only, how CivicMarket could determine a specific user's St. Lucie County Commission District (1-5) — as opposed to their countywide At-Large assignment — so that a future, separately approved implementation could show that user exactly one County Commissioner in My Current Officials, consistent with the personal-action-first product rule below.

This is a Gate 1 documentation task. It verifies the official lookup source and documents the safest implementation options. It does not authorize, draft, or schedule any implementation.

**Product rule this work exists to satisfy:** CivicMarket is personal-action-first. My Current Officials should show only officials tied to the user's own voting or representation districts, not all members of a broader board unless separately labeled as board context. Showing all five County Commissioners to every At-Large-holding user (the disabled B2 behavior) violated this rule; showing zero County Commissioners (the current state) satisfies the rule but leaves a real gap for County Commission specifically, since it is the one PSL office where the district a user is assigned to (At-Large) is broader than the seat that actually represents them (District 1-5).

## Hard stops

This document does not do any of the following, and no future work should treat it as having done so:

- Does not implement app behavior.
- Does not write to Supabase.
- Does not create `user_districts` rows.
- Does not change schema.
- Does not change seed files.
- Does not change SQL migrations.
- Does not change `districts`.
- Does not change `officials_for_user`.
- Does not rename, delete, replace, or repurpose the St. Lucie County Commission At-Large row (id `11111111-0000-0000-0000-000000000003`).
- Does not guess a user's County Commission District 1-5. No specific user is assigned a district anywhere in this document.

## Official source candidates to verify

Three candidate official sources were identified this session. Per the project's sourcing standard (established in `docs/county_commission_current_officials_gate_a_source_reverification.md`, Section 3: official government-domain pages only, opened and read directly — not search snippets, not third-party summaries), none of these is yet fully verified, because this session's automated fetch tooling is blocked or limited on two of the three. This mirrors the same tooling blocker recorded in the Gate A document above; the resolution there was manual browser verification by Mike, and the same resolution path is recommended here (see "Recommended Gate 2 decision").

| # | Candidate source | Domain | What it appears to offer | This session's fetch result | Fit for CivicMarket |
|---|---|---|---|---|---|
| 1 | "Who's My Commissioner" page | `stlucieco.gov` (official St. Lucie County government domain) | County-published page for identifying your commissioner; likely links to a district-lookup tool | Blocked — HTTP 403 Forbidden, consistent with the site-wide block on this session's fetch tool recorded in the Gate A document | Best-fit if it links an address-based tool; needs manual browser confirmation |
| 2 | "Zone Lookup" GIS tool | `slc.maps.arcgis.com` (county-operated ArcGIS instance) | An interactive map/address lookup titled "Zone Lookup," reachable from county GIS resources | Partial — page loaded (HTTP 200), title confirmed as "Zone Lookup," but it is a client-rendered JS app and this session's fetch tool could not read its actual field list or output | Strong candidate: address input only, no identity/voter-roll data implied by the tool name |
| 3 | Supervisor of Elections "Voter Information Lookup" | `voterfocus.com` (linked from the official SOE site `stlucievotes.gov`, which is the current live domain for the county elections office previously reached via `slcelections.com`) | Looks up a registered voter's own record, including (per standard Florida SOE VoterFocus tools) precinct and district assignments | Partial — page loaded, confirmed required inputs are first name, last name, and date of birth (plus a numeric street-address digit if multiple matches, plus CAPTCHA); confirmed output fields not visible to this session's fetch tool | **Not recommended** — see finding below |

**Finding — do not use candidate #3 as the implementation source.** The SOE Voter Information Lookup tool works by matching a person's legal name and date of birth against the county voter registration roll, then returning that voter's registration-linked precinct/district data. Using it as CivicMarket's district-assignment mechanism would mean matching a user's identity against the official voter roll to derive their answer. `CLAUDE.md` explicitly places "Voter roll matching" on the pre-beta do-not-build list. Building District 1-5 assignment on top of a voter-roll-matching tool would functionally reintroduce that deferred feature through a side door, even if no voter roll data were stored. Candidates #1 and #2 (address-based, not identity-based) do not have this problem and are the ones worth pursuing at Gate 2.

## Required user input

Given the finding above, the only sourcing path considered further is an address-based geographic lookup, not an identity/voter-roll lookup. That means:

- **Minimum required input:** a residential street address (street number + street name; city/state/ZIP can likely be inferred as Port St. Lucie, FL, since that is the entire current beta scope).
- **Not required:** legal name, date of birth, voter registration number, or any other identity-matching field.
- CivicMarket's existing onboarding already collects a ZIP code (`/onboarding/zip`) but not a full street address. County Commission District 1-5 boundaries are finer-grained than ZIP codes — a ZIP alone is not sufficient to determine which of District 1-5 a resident falls in. A new address field (or address-lookup step) would need to be added to onboarding, or offered as an optional later refinement, before this gap can be closed. Adding that field is implementation work and is explicitly out of scope for this Gate 1 document.

## Recommended source of truth

Recommended, pending Gate 2 manual verification: the county-operated GIS "Zone Lookup" tool (candidate #2 above), or whatever address-based district-lookup tool the official "Who's My Commissioner" page (candidate #1) itself links to — the two may turn out to be the same tool. Both are address-only, both are hosted on official county infrastructure (a `stlucieco.gov`-domain page and a `slc.maps.arcgis.com` subdomain operated by the county), and neither requires identity or voter-roll matching.

This is a recommendation for what to verify next, not a confirmed source. Gate 2 (see below) must independently confirm, by direct manual browser access, that the tool: resolves at a stable URL, accepts a street address, and returns a St. Lucie County Commission district number consistent with the five districts already inserted into `districts`.

## Storage option A: store District 1-5 in `user_districts` only after verified lookup

**Mechanism:** After a user provides their address and the lookup (once manually verified at Gate 2) resolves it to a specific District 1-5 id, insert a `user_districts` row for that user pointing at the resolved District 1-5 district id — in addition to, not instead of, their existing At-Large row.

**Pros:**
- Reuses the existing `officials_for_user` view unchanged — the view already joins `user_districts.district_id = current_officials.district_id`, so a District 1-5 `user_districts` row would surface the correct single commissioner automatically, no `getOfficialsForUser` special-casing needed (unlike the disabled B2 approach).
- Result is computed once and persisted; no repeated external lookup calls on every page load.
- Matches the existing precedent of `user_districts` being the single source of truth for "which districts does this user belong to" across onboarding, ballot, and officials.

**Cons:**
- Requires a real write path: either a new onboarding step, a profile-settings step, or a background job, none of which exist yet.
- Requires deciding how to keep the assignment current if a user moves or if county district boundaries are redrawn (redistricting) — a `user_districts` row does not know it has gone stale.
- Requires deciding what happens to the At-Large row alongside a new District-specific row for the same user (both should likely coexist, since At-Large still matters for ballot grouping — this needs its own explicit design decision, not assumed here).

## Storage option B: derive District 1-5 at runtime without writing `user_districts`

**Mechanism:** Do not persist a District 1-5 assignment at all. Instead, at read time (e.g., inside `getOfficialsForUser` or a new function it calls), take a stored user address field (stored somewhere other than `user_districts` — e.g., a new column on `profiles`) or a cached lookup result, resolve it to a district, and fetch that one `current_officials` row directly by district id, merging it into the returned list.

**Pros:**
- Never touches `user_districts`, so it cannot affect ballot grouping, candidate filtering, or `ballot_for_user` — the same isolation property the disabled B2 approach was designed around.
- Easier to revise later (e.g., if the lookup source changes) since nothing is written to a shared table that other features depend on.

**Cons:**
- Still needs the address stored somewhere, and a new column added to `profiles` (or elsewhere) is itself a schema change, deferred by this Gate 1 document.
- Either re-runs the district resolution on every read (slow, and dependent on a third-party/county tool being available at request time) or requires its own cache/staleness strategy — effectively re-deriving most of what `user_districts` already solves, without getting `officials_for_user`'s existing join for free.
- Concentrates more special-case logic in app code (`src/lib/officials.ts`), which is the same tradeoff already accepted once for the now-disabled B2 approach and flagged there as a real cost (two hardcoded id lists to keep in sync).

Neither option is being chosen by this document. Both are recorded for Gate 2 comparison.

## Risks

1. **Voter-roll-matching risk (see finding above).** Any implementation path must not derive district assignment via name/DOB matching against the county voter roll. This rules out candidate source #3 outright.
2. **Tooling verification risk.** This session's automated fetch tooling cannot fully confirm the field list or output of either recommended candidate source, for the same reason `stlucieco.gov` could not be fetched during the Gate A source re-verification. Any Gate 2 decision must be based on a person directly opening the tool in a browser, not on this document's partial, tool-limited findings.
3. **Data-freshness risk.** County Commission district boundaries can change after redistricting, and a resident's own address does not change automatically in CivicMarket if they move. Whichever storage option is eventually chosen needs its own staleness/re-verification plan — not designed here.
4. **New PII risk.** A street address is more sensitive than a ZIP code. Storing it (Option A, or Option B's address-storage variant) means a new field holding more precise location data than anything CivicMarket currently stores, and would need its own RLS/access review before implementation, not assumed safe by precedent.
5. **Scope-creep risk.** Adding an address field to onboarding touches the same onboarding flow this project's `CLAUDE.md` currently wants stabilized, not expanded, before more screens are built ("Audit and stabilize the existing Week 3 onboarding work before building more screens"). Any future Gate 2+ implementation plan should treat the onboarding-flow change itself as a distinct, separately scoped and approved unit of work.

## Validation checklist

For a future Gate 2 to be considered ready to proceed, all of the following should be true. None of these are satisfied yet by this Gate 1 document:

- [ ] A person has manually opened candidate source #1 ("Who's My Commissioner" on `stlucieco.gov`) directly in a browser and confirmed what it links to.
- [ ] A person has manually opened candidate source #2 (the ArcGIS "Zone Lookup" tool) directly in a browser, entered a known test address, and confirmed it returns a St. Lucie County Commission district number matching one of the five districts already in `districts`.
- [ ] The confirmed tool has a stable, citable URL suitable for use as a `source_url`-style reference in any future documentation.
- [ ] No part of the confirmed lookup path requires a legal name, date of birth, or voter registration number.
- [ ] Storage option A vs. option B has been explicitly decided and approved (this document recommends neither).
- [ ] If option A is chosen, the onboarding or profile UI change needed to collect an address has its own scoping and approval, separate from this document.
- [ ] If option B is chosen, the new storage location for the address (if any) and its RLS policy have their own scoping and approval, separate from this document.
- [ ] A redistricting/staleness handling plan exists for whichever option is chosen.

## Deferred work

The following are explicitly not part of this Gate 1 document and remain unstarted:

- Manual browser verification of candidate sources #1 and #2 (recommended next step — see Gate 2 below).
- Any onboarding or profile UI change to collect a user's address.
- Any schema change (new column, new table) to store an address or a resolved District 1-5 assignment.
- Any change to `src/lib/officials.ts`, `officials_for_user`, or `user_districts`.
- Any SQL draft, Supabase write, or `current_officials` change.
- A redistricting/staleness handling design.
- A decision between storage Option A and Option B.

## Recommended Gate 2 decision

Recommended: Gate 2 should be a manual, person-performed browser verification pass — the same resolution pattern already used successfully in `docs/county_commission_current_officials_gate_a_source_reverification.md` for the `stlucieco.gov` domain block. Specifically, Gate 2 should have Mike directly open candidate sources #1 and #2 in a real browser, confirm the actual lookup mechanism and its exact inputs/outputs, and record a stable source URL. Gate 2 should explicitly avoid opening or using candidate source #3 (the SOE Voter Information Lookup) for this purpose, per the voter-roll-matching finding above. Only after Gate 2 confirms a working, address-only, official lookup tool should a future Gate 3 evaluate storage Option A vs. Option B against the current onboarding-stabilization priority in `CLAUDE.md`.

## No-change confirmation

This document is documentation-only. Confirmed no-changes as part of this Gate 1 task:

- No app code was edited (`src/lib/officials.ts` and all other application files are unchanged).
- No Supabase write was performed.
- No `user_districts` row was created.
- No schema was changed.
- No seed file was changed.
- No SQL migration was changed.
- No `districts` row was changed.
- No `officials_for_user` view was changed.
- The St. Lucie County Commission At-Large row (id `11111111-0000-0000-0000-000000000003`) was not renamed, deleted, replaced, or repurposed.
- No specific user was assigned, or guessed to belong to, any County Commission District 1-5.
- The only external activity performed for this document was read-only web search and web fetch against public pages, to identify and partially assess candidate official lookup sources; no data from those fetches was written anywhere.
