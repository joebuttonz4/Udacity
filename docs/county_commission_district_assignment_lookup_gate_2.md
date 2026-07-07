# County Commission District 1-5 Assignment Lookup — Gate 2

Date: July 7, 2026

## Current baseline

Repo HEAD at the start of this task: commit `ff9d196` ("Document County Commission district assignment lookup Gate 1").

This document continues directly from `docs/county_commission_district_assignment_lookup_gate_1.md`. As of this baseline, nothing about app behavior, schema, seeds, migrations, `districts`, `user_districts`, `officials_for_user`, or the St. Lucie County Commission At-Large row has changed since Gate 1. This document adds manual browser verification only.

## Purpose

Gate 1 identified three candidate official sources for determining a resident's specific St. Lucie County Commission District (1-5), recommended candidate #2 (the county's ArcGIS "Zone Lookup" tool) and candidate #1 (the `stlucieco.gov` "Who's My Commissioner" page) for manual verification, and explicitly ruled out candidate #3 (the Supervisor of Elections voter lookup) because it requires legal name/date-of-birth voter-roll matching, which `CLAUDE.md` defers pre-beta.

This Gate 2 document performs that manual verification, using real browser navigation and interaction (not the automated fetch tool that was blocked or limited during Gate 1), and records the results. It does not authorize, draft, or schedule any implementation. It does not decide between Storage Option A and Storage Option B from Gate 1 — that comparison is explicitly left to a future Gate 3.

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
- Does not guess a user's County Commission District 1-5. No specific real user was assigned a district anywhere in this document — all test addresses below are public/government buildings or general place names, not private user addresses.
- Does not use the Supervisor of Elections voter lookup tool.

## Source verified

**Tool:** "Who's My Commissioner" (also self-labeled in its browser tab title as "Zone Lookup" during initial load)

**URL:** `https://slc.maps.arcgis.com/apps/instant/lookup/index.html?appid=9afb7523a1854366bed2d7c50ed7428b`

**Operator:** St. Lucie County, hosted on the county's own ArcGIS Online organization (`slc.maps.arcgis.com`).

**Confirmation that candidates #1 and #2 from Gate 1 are the same tool:** Direct browser navigation to the `stlucieco.gov` "Who's My Commissioner" page (`https://www.stlucieco.gov/departments-and-services/board-of-county-commissioners/who-s-my-commissioner`) landed on this exact ArcGIS URL and page (confirmed by matching tab title "Who's My Commissioner" and matching URL/appid after navigation). Gate 1's automated fetch tool could not reach the `stlucieco.gov` domain (HTTP 403); a real browser session reached it without issue, and it resolves to the same tool identified independently via the ArcGIS instant-apps URL. Candidates #1 and #2 are confirmed to be the same underlying tool, not two separate sources.

**Distractor ruled out:** A second `slc.maps.arcgis.com` "instant/lookup" URL found in the same search results (`appid=04bc4855b0334590a6f319aad3aae810`) was checked directly and resolved to a page titled "Solid Waste Collection Zones" — an unrelated trash-collection zone tool, not a commissioner lookup. This confirms the correct, and only, commissioner-lookup URL is the one recorded above.

## Test addresses

All four addresses tested are public government buildings, an event venue, or a named place — none are a private residential address, consistent with the Gate 2 instruction to use public or neutral addresses only.

1. `121 SW Port St Lucie Blvd, Port St. Lucie, FL 34984` — Port St. Lucie City Hall
2. `9221 SE Event Center Pl, Port St. Lucie, FL 34952` — MIDFLORIDA Credit Union Event Center
3. `100 N US Highway 1, Fort Pierce, FL 34950` — Fort Pierce City Hall (a St. Lucie County address outside Port St. Lucie's city limits, used to confirm the tool covers the whole county, not just PSL)
4. `10041 SW Village Pkwy, Port St. Lucie, FL 34987` — a Tradition-area address, in western Port St. Lucie

A fifth, non-address test (ZIP code only, `34987`) was also run — see "ZIP-only limitation" below.

## Results table

| # | Address used | Accepted? | Returned district label | Maps cleanly to District 1-5? | Ambiguity / failures / extra fields |
|---|---|---|---|---|---|
| 1 | 121 SW Port St Lucie Blvd, Port St. Lucie, FL 34984 | Yes — resolved via the tool's own "SLC Address Locator" suggestion | "District 3 — The Commissioner for District 3 is Erin Lowry." | Yes, cleanly — matches `current_officials` (Erin Lowry, District 3) exactly | None. Result included name, email (`Erin.Lowry@stlucieco.gov`), and phone. |
| 2 | 9221 SE Event Center Pl, Port St. Lucie, FL 34952 | Yes — resolved via "SLC Address Locator" | "District 3 — The Commissioner for District 3 is Erin Lowry." | Yes, cleanly — matches seeded data | None. Result also included a commissioner photo. |
| 3 | 100 N US Highway 1, Fort Pierce, FL 34950 | Yes — resolved via "SLC Address Locator" | "District 1 — The Commissioner for District 1 is James Clasby." | Yes, cleanly — matches seeded data (James Clasby, District 1) | None. |
| 4 | 10041 SW Village Pkwy, Port St. Lucie, FL 34987 | Yes — resolved via "SLC Address Locator" | "District 5 — The Commissioner for District 5 is Cathy Townsend." | Yes, cleanly — matches seeded data (Cathy Townsend, District 5) | None. |
| 5 (ZIP-only, not a street address) | `34987` (ZIP code alone, no street) | Accepted by the search box, but only as a generic place/ZIP suggestion, not a "SLC Address Locator" street match | "District 5 — The Commissioner for District 5 is Cathy Townsend." | **No — see finding below.** The tool returned exactly one district for the whole ZIP, but the ZIP's own highlighted boundary shape visibly extends into the Lakewood Park / Florida Ridge area, which sits at or across the seam with District 1 on the underlying district map. A resident in that part of ZIP 34987 could actually be in District 1, not District 5, and the tool gives no warning that the ZIP spans more than one district. | The search box also returned five duplicate "34987" entries from the generic "ArcGIS World Geocoding Service" source, on top of the one "SLC Address Locator" entry — itself a sign that ZIP-only queries are handled as a general geocoding place-match, not as the tool's purpose-built address-to-district lookup. |

All four street-address results were reached the same way: type the address into the search box, select the matching suggestion under the **"SLC Address Locator"** heading (the county's own address locator, listed separately from and above the generic "ArcGIS World Geocoding Service" suggestions), and read the single district/commissioner panel that appears below the map.

## Findings

- The tool is address-based, not identity-based: every test above used only a street address (or, for the ZIP-only test, a bare ZIP), never a name, date of birth, or any other personal identifier.
- For all four genuine street addresses, the tool returned exactly one district, with no ambiguity, and every returned commissioner name matched the corresponding `current_officials` row already seeded in Supabase (James Clasby / District 1, Erin Lowry / District 3, Cathy Townsend / District 5). This cross-check is a strong signal the tool's district boundaries are consistent with the data already in the app.
- The tool supports two input methods, per its own on-screen instructions: typing an address/place in the search box, or clicking a location directly on the map. Only the address-search method was tested here, since map-clicking has no equivalent in a headless onboarding flow.
- The search box's own suggestion list distinguishes a "SLC Address Locator" (the county's authoritative, parcel/address-level locator) from a generic "ArcGIS World Geocoding Service" fallback. Any future implementation should prefer results from the SLC Address Locator source specifically, since it is the one built on the county's own address dataset.
- The tool is a client-rendered ArcGIS Experience Builder / Instant Apps page. It has no documented public REST API endpoint that this verification pass could identify; if a future Gate 3+ implementation wants a server-side/programmatic lookup rather than an embedded iframe or manual link-out, the underlying ArcGIS feature layer would need to be separately identified and its terms of use reviewed — that is out of scope here.

## Address-only viability

**Confirmed viable.** All four street-address tests resolved correctly and unambiguously using only a street address (number, street name, city, state, ZIP as typed — no separate identity field of any kind). No name, date of birth, voter ID, or CAPTCHA was requested at any point in this flow. This satisfies the Gate 1 requirement that the chosen source must not reintroduce voter-roll matching.

## ZIP-only limitation

**Confirmed insufficient — with a concrete demonstrated failure mode, not just a theoretical one.** Entering `34987` alone (no street address) returned a single, confident-looking answer ("District 5 — Cathy Townsend") with no ambiguity warning. But the ZIP code's own highlighted boundary, as drawn by the tool, extends into the Lakewood Park / Florida Ridge area, which sits at the boundary seam with District 1 on the underlying commission-district map. Because ZIP code boundaries do not follow county commission district lines, a real resident in that overlapping part of ZIP 34987 could be given the wrong commissioner if a future implementation used ZIP code alone as the lookup key. This confirms Gate 1's existing assumption and gives it a specific, observed example rather than a general assertion.

## Voter-roll matching avoidance

**Confirmed avoided.** Nothing in this tool's interface requests or displays a legal name, date of birth, voter registration number, or any other identity/voter-roll field. The only inputs used across all five tests were a street address string or a bare ZIP string, and the only interaction beyond typing was selecting a suggested match from the tool's own dropdown. This is architecturally distinct from, and has no dependency on, the Supervisor of Elections "Voter Information Lookup" tool ruled out in Gate 1.

## Risks

1. **ZIP-boundary risk (newly confirmed, not just theoretical).** As shown in the results table and "ZIP-only limitation" above, a bare ZIP can return a single district answer that is wrong for residents near a district/ZIP boundary seam. Any future implementation must require a full street address, never a ZIP alone, consistent with Gate 1's existing requirement.
2. **No documented public API.** This tool is a client-rendered map app, not a documented REST endpoint. A future server-side implementation (Storage Option A or B from Gate 1) would need its own separate technical investigation into whether an equivalent ArcGIS feature layer can be queried programmatically and under what terms, or whether the only supportable pattern is linking a user out to this tool manually. That investigation is not part of this Gate 2 document.
3. **Tool availability and stability risk.** The tool is hosted on the county's own ArcGIS Online organization, not on CivicMarket's own infrastructure. Its URL, availability, and behavior are entirely outside CivicMarket's control and could change without notice.
4. **Data-freshness/redistricting risk (carried over from Gate 1, unchanged).** County Commission district boundaries can change after redistricting; this tool presumably reflects boundaries as of whenever the county last updated its GIS layer, which this verification pass has no way to independently date.
5. **New PII risk (carried over from Gate 1, unchanged).** A street address remains more sensitive than a ZIP code; storing one would still need its own RLS/access review before any implementation, not assumed safe by this document.
6. **Scope-creep risk (carried over from Gate 1, unchanged).** Any onboarding change to collect a street address remains a distinct, separately scoped and approved unit of work, per `CLAUDE.md`'s onboarding-stabilization priority.

## Validation checklist

- [x] A person has manually opened candidate source #1 ("Who's My Commissioner" on `stlucieco.gov`) directly in a browser and confirmed what it links to. — Confirmed: it resolves to the same ArcGIS tool as candidate #2.
- [x] A person has manually opened candidate source #2 (the ArcGIS "Zone Lookup" tool) directly in a browser, entered a known test address, and confirmed it returns a St. Lucie County Commission district number matching one of the five districts already in `districts`. — Confirmed for four separate addresses, all matching seeded `current_officials` names.
- [x] The confirmed tool has a stable, citable URL suitable for use as a `source_url`-style reference in any future documentation. — `https://slc.maps.arcgis.com/apps/instant/lookup/index.html?appid=9afb7523a1854366bed2d7c50ed7428b`
- [x] No part of the confirmed lookup path requires a legal name, date of birth, or voter registration number. — Confirmed.
- [ ] Storage option A vs. option B has been explicitly decided and approved. — Not decided here; remains a Gate 3+ task.
- [ ] If option A is chosen, the onboarding or profile UI change needed to collect an address has its own scoping and approval, separate from this document. — Not started.
- [ ] If option B is chosen, the new storage location for the address (if any) and its RLS policy have their own scoping and approval, separate from this document. — Not started.
- [ ] A redistricting/staleness handling plan exists for whichever option is chosen. — Not started.

## Recommended Gate 3 decision

Recommended: Gate 3 should compare Storage Option A vs. Option B from Gate 1 against the current `CLAUDE.md` priority of stabilizing onboarding before building more screens, and should explicitly decide whether any address-collection UI work is worth scoping now or should remain deferred. Gate 3 should also decide whether a future implementation links users out to the verified `slc.maps.arcgis.com` tool directly (no address storage, no server-side lookup) versus building a server-side lookup against the tool's underlying data (which would require its own separate technical/legal investigation per Risk 2 above). Gate 3 should not proceed to any SQL draft, schema change, or code draft until that decision is made and separately approved, consistent with the gated pattern used for the County Commission Current Officials B2 sequence (Gates A-H) referenced in Gate 1.

## No-change confirmation

This document is documentation-only. Confirmed no-changes as part of this Gate 2 task:

- No app code was edited.
- No Supabase write was performed.
- No `user_districts` row was created.
- No schema was changed.
- No seed file was changed.
- No SQL migration was changed.
- No `districts` row was changed.
- No `officials_for_user` view was changed.
- The St. Lucie County Commission At-Large row (id `11111111-0000-0000-0000-000000000003`) was not renamed, deleted, replaced, or repurposed.
- No specific real user was assigned, or guessed to belong to, any County Commission District 1-5. All test addresses used were public government buildings, an event venue, or a general place name — never a private residence.
- The Supervisor of Elections voter lookup tool was not opened or used for this task.
- The only activity performed for this document was read-only browser navigation and interaction with public web pages (the verified ArcGIS tool and the `stlucieco.gov` page it resolves from), plus one read-only web search to locate the exact tool URLs; no data from those interactions was written anywhere except into this documentation file.
