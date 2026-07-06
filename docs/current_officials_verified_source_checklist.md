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
| name | Yes | Official government source | | | | Blocked — Mayor district row does not exist yet (see Section 4) |
| office | Yes | N/A (fixed value) | Mayor | | | |
| district_id | Yes | N/A (internal) | Not assigned — no districts row exists | | | Prerequisite: see Section 4 |
| jurisdiction_level | Yes | N/A (fixed value) | city | | | |
| photo_url | No | Official government source | | | | |
| website | No | Official government source | | | | |
| bio | No | Official government source | | | | |
| term_start | No, if unverified | Official government source | | | | Leave blank if not verified |
| term_end | No, if unverified | Official government source | | | | Leave blank if not verified |
| next_election_date | No, if unverified | Official election source | | | | Leave blank if not verified |
| source_url | Yes | Official government source | | | | Row cannot be seeded without this |
| source_label | No | N/A | | | | |
| candidate_id | No | N/A (internal match only) | Null | | | Stays null unless verified match to a `candidates` row |
| is_on_next_ballot | No, if unverified | Official election source | Unknown | | | Stays unknown/false unless verified |

### 3.2 Port St. Lucie City Council District 1

| Field | Required before seed? | Accepted source type | Collected value | Source URL | Verified by | Notes |
|---|---|---|---|---|---|---|
| name | Yes | Official government source | | | | |
| office | Yes | N/A (fixed value) | City Council Member, District 1 | | | |
| district_id | Yes | N/A (internal) | `11111111-0000-0000-0000-000000000001` | | | Matches `districts.name = 'City Council District 1'` per onboarding code |
| jurisdiction_level | Yes | N/A (fixed value) | city | | | |
| photo_url | No | Official government source | | | | |
| website | No | Official government source | | | | |
| bio | No | Official government source | | | | |
| term_start | No, if unverified | Official government source | | | | Leave blank if not verified |
| term_end | No, if unverified | Official government source | | | | Leave blank if not verified |
| next_election_date | No, if unverified | Official election source | | | | Leave blank if not verified |
| source_url | Yes | Official government source | | | | Row cannot be seeded without this |
| source_label | No | N/A | | | | |
| candidate_id | No | N/A (internal match only) | Null | | | All 4 known District 1 candidates are logged `is_incumbent = false`; none can be linked as current officeholder without new verification |
| is_on_next_ballot | No, if unverified | Official election source | Unknown | | | Stays unknown/false unless verified |

### 3.3 St. Lucie School Board District 1

| Field | Required before seed? | Accepted source type | Collected value | Source URL | Verified by | Notes |
|---|---|---|---|---|---|---|
| name | Yes | Official government source | | | | |
| office | Yes | N/A (fixed value) | School Board Member, District 1 | | | |
| district_id | Yes | N/A (internal) | `11111111-0000-0000-0000-000000000002` | | | Matches `districts.name = 'School Board District 1'` per onboarding code |
| jurisdiction_level | Yes | N/A (fixed value) | school_board | | | |
| photo_url | No | Official government source | | | | |
| website | No | Official government source | | | | |
| bio | No | Official government source | | | | |
| term_start | No, if unverified | Official government source | | | | Leave blank if not verified |
| term_end | No, if unverified | Official government source | | | | Leave blank if not verified |
| next_election_date | No, if unverified | Official election source | | | | Leave blank if not verified |
| source_url | Yes | Official government source | | | | Row cannot be seeded without this |
| source_label | No | N/A | | | | |
| candidate_id | No | N/A (internal match only) | Null | | | No School Board candidates currently exist in `candidates` table |
| is_on_next_ballot | No, if unverified | Official election source | Unknown | | | Stays unknown/false unless verified |

### 3.4 St. Lucie County Commission At-Large

| Field | Required before seed? | Accepted source type | Collected value | Source URL | Verified by | Notes |
|---|---|---|---|---|---|---|
| name | Yes | Official government source | | | | |
| office | Yes | N/A (fixed value) | County Commissioner, At-Large | | | |
| district_id | Yes | N/A (internal) | `11111111-0000-0000-0000-000000000003` | | | Matches `districts.name = 'St. Lucie County Commission At-Large'` per onboarding code |
| jurisdiction_level | Yes | N/A (fixed value) | county | | | |
| photo_url | No | Official government source | | | | |
| website | No | Official government source | | | | |
| bio | No | Official government source | | | | |
| term_start | No, if unverified | Official government source | | | | Leave blank if not verified |
| term_end | No, if unverified | Official government source | | | | Leave blank if not verified |
| next_election_date | No, if unverified | Official election source | | | | Leave blank if not verified |
| source_url | Yes | Official government source | | | | Row cannot be seeded without this |
| source_label | No | N/A | | | | |
| candidate_id | No | N/A (internal match only) | Null | | | No County Commission candidates currently exist in `candidates` table |
| is_on_next_ballot | No, if unverified | Official election source | Unknown | | | Stays unknown/false unless verified |

### 3.5 Florida House District 85

| Field | Required before seed? | Accepted source type | Collected value | Source URL | Verified by | Notes |
|---|---|---|---|---|---|---|
| name | Yes | Official government source | | | | |
| office | Yes | N/A (fixed value) | State Representative, District 85 | | | |
| district_id | Yes | N/A (internal) | `11111111-0000-0000-0000-000000000004` | | | Matches `districts.name = 'FL House District 85'` per onboarding code |
| jurisdiction_level | Yes | N/A (fixed value) | state | | | |
| photo_url | No | Official government source | | | | |
| website | No | Official government source | | | | |
| bio | No | Official government source | | | | |
| term_start | No, if unverified | Official government source | | | | Leave blank if not verified |
| term_end | No, if unverified | Official government source | | | | Leave blank if not verified |
| next_election_date | No, if unverified | Official election source | | | | Leave blank if not verified |
| source_url | Yes | Official government source | | | | Row cannot be seeded without this |
| source_label | No | N/A | | | | |
| candidate_id | No | N/A (internal match only) | Null | | | No state house candidates currently exist in `candidates` table |
| is_on_next_ballot | No, if unverified | Official election source | Unknown | | | Stays unknown/false unless verified |

### 3.6 Florida Senate District 27

| Field | Required before seed? | Accepted source type | Collected value | Source URL | Verified by | Notes |
|---|---|---|---|---|---|---|
| name | Yes | Official government source | | | | |
| office | Yes | N/A (fixed value) | State Senator, District 27 | | | |
| district_id | Yes | N/A (internal) | `11111111-0000-0000-0000-000000000005` | | | Matches `districts.name = 'FL Senate District 27'` per onboarding code |
| jurisdiction_level | Yes | N/A (fixed value) | state | | | |
| photo_url | No | Official government source | | | | |
| website | No | Official government source | | | | |
| bio | No | Official government source | | | | |
| term_start | No, if unverified | Official government source | | | | Leave blank if not verified |
| term_end | No, if unverified | Official government source | | | | Leave blank if not verified |
| next_election_date | No, if unverified | Official election source | | | | Leave blank if not verified |
| source_url | Yes | Official government source | | | | Row cannot be seeded without this |
| source_label | No | N/A | | | | |
| candidate_id | No | N/A (internal match only) | Null | | | No state senate candidates currently exist in `candidates` table |
| is_on_next_ballot | No, if unverified | Official election source | Unknown | | | Stays unknown/false unless verified |

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
