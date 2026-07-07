# Current Officials — Verified Source Collection Checklist

## 1. Purpose

- This checklist is for collecting official government source data before any `current_officials` seed work.
- It does not authorize SQL, schema changes, seeding, or UI changes.

## 2. Global rules

- Use official government sources only.
- Do not guess official names.
- Do not guess `term_start`.
- Do not guess `term_end`.
- Do not guess `next_election_date`.
- Do not use campaign pages, social media, news articles, Ballotpedia, Wikipedia, or AI summaries as `source_url`.
- Leave unknown fields blank.
- Each seedable `current_officials` row must have a `source_url` because `source_url` is `NOT NULL`.
- `candidate_id` stays null unless the official is verified to match an existing `candidates` row.
- `is_on_next_ballot` stays unknown or false unless verified by an official election source.

---

## 3. Offices to collect

### 3.1 Port St. Lucie Mayor

| Field | Required before seed? | Accepted source type | Collected value | Source URL | Verified by | Notes |
|---|---|---|---|---|---|---|
| name | Yes | Official government source | Shannon Martin | https://www.cityofpsl.com/Government/Your-City-Government/Mayor-City-Council/Mayor-Shannon-Martin | | |
| office | Yes | N/A (fixed value) | Mayor | | | |
| district_id | Yes | N/A (internal) | Not assigned — no districts row exists | | | Prerequisite: see Section 4 |
| jurisdiction_level | Yes | N/A (fixed value) | city | | | |
| photo_url | No | Official government source | | | | |
| website | No | Official government source | | | | |
| bio | No | Official government source | | | | |
| term_start | No, if unverified | Official government source | | | | Leave blank — official Mayor profile says she was elected Mayor following a 2021 Special Election and re-elected in 2022 to a full four-year term, but no exact term_start date is confirmed in this batch |
| term_end | No, if unverified | Official government source | | | | Leave blank — City elections page says the Mayor term is expiring in 2026, but no exact term_end date is confirmed in this batch |
| next_election_date | No, if unverified | Official election source | 2026-08-18 primary; 2026-11-03 general | https://www.cityofpsl.com/Government/Your-City-Government/Departments/City-Clerk/Elections | | City elections page lists "Shannon Martin for Mayor" and identifies Mayor as a 2026 expiring term |
| source_url | Yes | Official government source | https://www.cityofpsl.com/Government/Your-City-Government/Mayor-City-Council/Mayor-Shannon-Martin | https://www.cityofpsl.com/Government/Your-City-Government/Mayor-City-Council/Mayor-Shannon-Martin | | |
| source_label | No | N/A | City of Port St. Lucie Mayor profile | | | |
| candidate_id | No | N/A (internal match only) | Null | | | No `candidates` row exists for Shannon Martin |
| is_on_next_ballot | No, if unverified | Official election source | true | https://www.cityofpsl.com/Government/Your-City-Government/Departments/City-Clerk/Elections | | City elections page lists "Shannon Martin for Mayor" and identifies Mayor as a 2026 expiring term |

### 3.2 Port St. Lucie City Council District 1

| Field | Required before seed? | Accepted source type | Collected value | Source URL | Verified by | Notes |
|---|---|---|---|---|---|---|
| name | Yes | Official government source | Stephanie Morgan | https://www.cityofpsl.com/Government/Your-City-Government/Mayor-City-Council/District-1-Stephanie-Morgan | Mike - manual source review - 2026-07-06 | |
| office | Yes | N/A (fixed value) | City Council Member, District 1 | | Mike - manual source review - 2026-07-06 | |
| district_id | Yes | N/A (internal) | `11111111-0000-0000-0000-000000000001` | | | Matches `districts.name = 'City Council District 1'` per onboarding code |
| jurisdiction_level | Yes | N/A (fixed value) | city | | | |
| photo_url | No | Official government source | | | | |
| website | No | Official government source | | | | |
| bio | No | Official government source | | | | |
| term_start | No, if unverified | Official government source | | | | Leave blank — no exact term_start date confirmed in this batch |
| term_end | No, if unverified | Official government source | | | | Leave blank — City elections page says District 1 term is expiring in 2026, but no exact term_end date is confirmed in this batch |
| next_election_date | No, if unverified | Official election source | 2026-08-18 primary; 2026-11-03 general | https://www.cityofpsl.com/Government/Your-City-Government/Departments/City-Clerk/Elections | | City elections page identifies District 1 as a 2026 expiring term, but does not list Stephanie Morgan as a 2026 District 1 candidate |
| source_url | Yes | Official government source | https://www.cityofpsl.com/Government/Your-City-Government/Mayor-City-Council/District-1-Stephanie-Morgan | https://www.cityofpsl.com/Government/Your-City-Government/Mayor-City-Council/District-1-Stephanie-Morgan | Mike - manual source review - 2026-07-06 | |
| source_label | No | N/A | City of Port St. Lucie District 1 Council profile | | Mike - manual source review - 2026-07-06 | |
| candidate_id | No | N/A (internal match only) | Null | | | No `candidates` row exists for Stephanie Morgan; all 4 known District 1 candidates in `candidates` are logged `is_incumbent = false` and are distinct names |
| is_on_next_ballot | No, if unverified | Official election source | Unknown | https://www.cityofpsl.com/Government/Your-City-Government/Departments/City-Clerk/Elections | | City elections page identifies District 1 as a 2026 expiring term, but does not list Stephanie Morgan as a 2026 District 1 candidate |

### 3.3 St. Lucie School Board District 1

| Field | Required before seed? | Accepted source type | Collected value | Source URL | Verified by | Notes |
|---|---|---|---|---|---|---|
| name | Yes | Official government source | Debbie Hawley | https://www.stlucie.k12.fl.us/our-district/meet-the-board/ | Mike - manual source review - 2026-07-06 | Source shows District #1 |
| office | Yes | N/A (fixed value) | School Board Member, District 1 | | Mike - manual source review - 2026-07-06 | |
| district_id | Yes | N/A (internal) | `11111111-0000-0000-0000-000000000002` | | | Matches `districts.name = 'School Board District 1'` per onboarding code |
| jurisdiction_level | Yes | N/A (fixed value) | school_board | | | |
| photo_url | No | Official government source | | | | |
| website | No | Official government source | | | | |
| bio | No | Official government source | | | | |
| term_start | No, if unverified | Official government source | | | | Leave blank — no exact official date verified in this batch |
| term_end | No, if unverified | Official government source | | | | Leave blank — no exact official date verified in this batch |
| next_election_date | No, if unverified | Official election source | | | | Leave blank — no exact official election date verified in this batch |
| source_url | Yes | Official government source | https://www.stlucie.k12.fl.us/our-district/meet-the-board/ | https://www.stlucie.k12.fl.us/our-district/meet-the-board/ | Mike - manual source review - 2026-07-06 | |
| source_label | No | N/A | St. Lucie Public Schools Meet the Board | | Mike - manual source review - 2026-07-06 | |
| candidate_id | No | N/A (internal match only) | Null | | | No `candidates` row exists for Debbie Hawley |
| is_on_next_ballot | No, if unverified | Official election source | Unknown | | | Stays unknown/false unless verified by an official election source |

### 3.4 St. Lucie County Commission At-Large

| Field | Required before seed? | Accepted source type | Collected value | Source URL | Verified by | Notes |
|---|---|---|---|---|---|---|
| name | Yes | Official government source | | | | Blocked pending district model review — see "County Commission district model gap" below |
| office | Yes | N/A (fixed value) | County Commissioner, At-Large | | | |
| district_id | Yes | N/A (internal) | `11111111-0000-0000-0000-000000000003` | | | Matches `districts.name = 'St. Lucie County Commission At-Large'` per onboarding code |
| jurisdiction_level | Yes | N/A (fixed value) | county | | | |
| photo_url | No | Official government source | | | | |
| website | No | Official government source | | | | |
| bio | No | Official government source | | | | |
| term_start | No, if unverified | Official government source | | | | Leave blank if not verified |
| term_end | No, if unverified | Official government source | | | | Leave blank if not verified |
| next_election_date | No, if unverified | Official election source | | | | Leave blank if not verified |
| source_url | Yes | Official government source | | | | Row cannot be seeded without this — blocked pending district model review, see below. The county BOCC page (https://www.stlucieco.gov/government/county-commissioners/st-lucie-county-board-of-county-commissioners-bocc) is recorded in Notes only, as a review/source reference, not as the seedable row source_url |
| source_label | No | N/A | | | | |
| candidate_id | No | N/A (internal match only) | Null | | | No County Commission candidates currently exist in `candidates` table |
| is_on_next_ballot | No, if unverified | Official election source | Unknown | | | Stays unknown/false unless verified |

#### County Commission district model gap

- Official county source identifies five commissioner districts, not one At-Large office: https://www.stlucieco.gov/government/county-commissioners/st-lucie-county-board-of-county-commissioners-bocc lists commissioners by District 1 through District 5. Individual official pages exist for District 1 James Clasby (https://www.stlucieco.gov/departments-and-services/board-of-county-commissioners/district-1-james-clasby), District 2 Larry Leet, Vice Chair (https://www.stlucieco.gov/departments-and-services/board-of-county-commissioners/district-2-larry-leet), District 3 Erin Lowry (https://www.stlucieco.gov/departments-and-services/board-of-county-commissioners/district-3-erin-lowry), District 4 Jamie Fowler (https://www.stlucieco.gov/departments-and-services/board-of-county-commissioners/district-4-jamie-fowler-chair), and District 5 Cathy Townsend (https://www.stlucieco.gov/departments-and-services/board-of-county-commissioners/district-5-cathy-townsend).
- Official individual pages have now been identified for all five districts (1 through 5), but the app/checklist still has only the single "St. Lucie County Commission At-Large" row — the district model gap is unchanged.
- Additional official facts (per the District 2, District 3, and former-commissioners pages: https://www.stlucieco.gov/departments-and-services/board-of-county-commissioners/former-county-commissioners): St. Lucie County Commissioners serve four-year terms; commissioners must reside in the districts they represent; commissioners are chosen by a countywide vote; Districts 1, 3, and 5 run in one election cycle, and Districts 2 and 4 run in another.
- Existing app district row is "St. Lucie County Commission At-Large".
- Do not map Larry Leet, Erin Lowry, James Clasby, Jamie Fowler, or Cathy Townsend into the At-Large row without a product/data decision.
- Do not create separate County Commission District 1 through District 5 rows yet.
- Future decision needed: keep one countywide At-Large row, or add separate County Commission District 1 through District 5 rows.
- No SQL, schema, seed, or UI change approved by this checklist.

### 3.5 Florida House District 85

| Field | Required before seed? | Accepted source type | Collected value | Source URL | Verified by | Notes |
|---|---|---|---|---|---|---|
| name | Yes | Official government source | Tobin Rogers "Toby" Overdorf | https://housedocs.myfloridahouse.gov/Sections/Representatives/custom/biography.aspx?MemberId=4728 | Mike - manual source review - 2026-07-06 | Official biography page lists District 85, covering parts of Martin and St. Lucie |
| office | Yes | N/A (fixed value) | State Representative, District 85 | | Mike - manual source review - 2026-07-06 | |
| district_id | Yes | N/A (internal) | `11111111-0000-0000-0000-000000000004` | | | Matches `districts.name = 'FL House District 85'` per onboarding code |
| jurisdiction_level | Yes | N/A (fixed value) | state | | | |
| photo_url | No | Official government source | | | | |
| website | No | Official government source | | | | |
| bio | No | Official government source | | | | |
| term_start | No, if unverified | Official government source | | | | Leave blank — official biography says elected in 2018 and reelected subsequently, but no exact term_start date is confirmed in this batch |
| term_end | No, if unverified | Official government source | | | | Leave blank — no exact term_end date is confirmed in this batch |
| next_election_date | No, if unverified | Official election source | | | | Leave blank — no exact official election date is confirmed in this batch |
| source_url | Yes | Official government source | https://housedocs.myfloridahouse.gov/Sections/Representatives/custom/biography.aspx?MemberId=4728 | https://housedocs.myfloridahouse.gov/Sections/Representatives/custom/biography.aspx?MemberId=4728 | Mike - manual source review - 2026-07-06 | |
| source_label | No | N/A | Florida House of Representatives member profile | | Mike - manual source review - 2026-07-06 | |
| candidate_id | No | N/A (internal match only) | Null | | | No state house candidates currently exist in `candidates` table |
| is_on_next_ballot | No, if unverified | Official election source | Unknown | | | Stays unknown/false unless verified by an official election source |

### 3.6 Florida Senate District 27

| Field | Required before seed? | Accepted source type | Collected value | Source URL | Verified by | Notes |
|---|---|---|---|---|---|---|
| name | Yes | Official government source | Ben Albritton | https://www.flsenate.gov/Senators/S27 | | Official Senate page lists District 27, covering Charlotte, DeSoto, Hardee, and parts of Lee and Polk counties. The official district-area description does not list St. Lucie County or Martin County — see "Florida Senate District geography mapping gap" below |
| office | Yes | N/A (fixed value) | State Senator, District 27 | | | |
| district_id | Yes | N/A (internal) | `11111111-0000-0000-0000-000000000005` | | | Matches `districts.name = 'FL Senate District 27'` per onboarding code |
| jurisdiction_level | Yes | N/A (fixed value) | state | | | |
| photo_url | No | Official government source | | | | |
| website | No | Official government source | | | | |
| bio | No | Official government source | | | | |
| term_start | No, if unverified | Official government source | | | | Leave blank — official Senate page shows current 2024-2026 term and Senate service history (2024-2026, 2022-2024, 2020-2022, 2018-2020), but no exact term_start date is confirmed in this batch |
| term_end | No, if unverified | Official government source | | | | Leave blank — official Senate page shows current 2024-2026 term, but no exact term_end date is confirmed in this batch |
| next_election_date | No, if unverified | Official election source | | | | Leave blank — no exact official election date is confirmed in this batch |
| source_url | Yes | Official government source | https://www.flsenate.gov/Senators/S27 | https://www.flsenate.gov/Senators/S27 | | |
| source_label | No | N/A | Florida Senate Senator District 27 profile | | | |
| candidate_id | No | N/A (internal match only) | Null | | | No state senate candidates currently exist in `candidates` table |
| is_on_next_ballot | No, if unverified | Official election source | Unknown | | | Stays unknown/false unless verified by an official election source; no ballot status confirmed in this batch |

#### Florida Senate District geography mapping gap

- Official Senate page for District 27 (https://www.flsenate.gov/Senators/S27) lists Charlotte, DeSoto, Hardee, and parts of Lee and Polk counties as the district area. It does not list St. Lucie County or Martin County.
- Current CivicMarket beta context uses FL Senate District 27 as a PSL beta district.
- Do not seed this row until the district mapping is verified against an official source for the user's address or the app's district model is corrected.
- Future decision needed: verify whether PSL users should map to a different Florida Senate district, or whether the app's current District 27 row is intentionally scoped differently.
- No SQL, schema, seed, or UI change approved by this checklist.

---

## 4. Mayor district prerequisite checklist

- Confirm whether a Port St. Lucie Mayor district row should be added to `districts`.
- Confirm district naming convention (e.g., matching existing `districts.name` style such as "City Council District 1").
- Confirm district type value (i.e., what `jurisdiction_level`/scope value should represent an at-large citywide office like Mayor).
- Confirm how users should be assigned to the Mayor district (e.g., added to the hardcoded `ALL_PSL_DISTRICTS` list in `src/app/onboarding/zip/page.tsx` so every PSL beta user is assigned it, since Mayor is at-large/citywide).
- Confirm whether `officials_for_user` will surface Mayor once `district_id` and `user_districts` assignment exist (it should, since the view inner-joins `current_officials.district_id = user_districts.district_id`, but this must be verified after the district row and assignment exist, not assumed).
- Do not create the district row yet.
- Do not write SQL yet.

---

## 5. Review gates

Gates required before any future implementation proceeds:

- **Gate 1:** Source URLs collected
- **Gate 2:** Official names and offices verified
- **Gate 3:** `district_id` mapping verified
- **Gate 4:** `candidate_id` links reviewed
- **Gate 5:** Seed SQL reviewed before run
- **Gate 6:** Supabase verification queries pass after run
- **Gate 7:** UI verified after data appears

---

## 6. Not approved in this checklist

- No SQL
- No seed data
- No schema changes
- No UI changes
- No voting records
- No ballot measures
- No AI review summaries

---

## 7. Seedability Review

A row is seedable only if it has verified `name`, `office`, `district_id`, `jurisdiction_level`, and `source_url`, and no unresolved district/geography mapping gap. This review does not authorize SQL, schema changes, seeding, or UI changes — it only classifies current status.

| Office | Status | Block reason | Required next decision or source | SQL draftable later? |
|---|---|---|---|---|
| Port St. Lucie Mayor | Blocked | `district_id` missing — no Mayor `districts` row exists yet | Resolve Mayor district prerequisite checklist (Section 4): create the districts row, confirm naming/type convention, confirm user assignment model | Yes, after Section 4 decisions are made and a `district_id` is assigned |
| Port St. Lucie City Council District 1 | Seedable now | None | None required to seed | Yes |
| St. Lucie School Board District 1 | Seedable now | None | None required to seed | Yes |
| St. Lucie County Commission At-Large | Blocked | `name` and `source_url` are blank; district model gap — official county source shows District 1–5 commissioners, app row is one countywide At-Large office | Product/data decision: keep one At-Large row, or add separate County Commission District 1–5 rows (see "County Commission district model gap") | No, not until the district model decision is made |
| Florida House District 85 | Seedable now | None | None required to seed; official biography district area includes St. Lucie, consistent with the app's district | Yes |
| Florida Senate District 27 | Blocked | Geography mapping gap — official Senate page district area (Charlotte, DeSoto, Hardee, parts of Lee and Polk) does not mention St. Lucie or Martin County | Verify whether PSL users should map to a different Florida Senate district, or confirm the app's District 27 row is intentionally scoped differently (see "Florida Senate District geography mapping gap") | No, not until the district mapping is resolved |

**Gate 2 note:** Gate 2 source sign-off completed for City Council District 1, School Board District 1, and Florida House District 85 on 2026-07-06.

**Gate 5 note:** Gate 5 SQL review completed for the three draft seed rows only: City Council District 1, School Board District 1, and Florida House District 85 (Mike - SQL draft review - 2026-07-06). Blocked rows remain excluded: Mayor, County Commission At-Large, Florida Senate District 27. SQL has not been run.

Summary:
- **Seedable now:** Port St. Lucie City Council District 1, St. Lucie School Board District 1, Florida House District 85
- **Blocked:** Port St. Lucie Mayor, St. Lucie County Commission At-Large, Florida Senate District 27
