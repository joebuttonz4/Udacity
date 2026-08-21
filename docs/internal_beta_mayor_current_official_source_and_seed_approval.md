# Port St. Lucie Mayor Current Official — Source Verification and Seed Approval Package

Date: 08-20-2026
Timestamp: 09:56 pm EST

Status: **STAGE A complete — read-only verification + exact write package prepared. STAGE B (the INSERT) has NOT been executed and will not be executed in this run.** No Supabase write. No schema/RLS/function change. No `user_districts` change. No write guard change. No deployment.

## Prior source blocker

Documented repeatedly throughout this project (most recently in the fresh-account audit, commit `4b45238`, and originally under "Current Officials — Mayor district gap" in this file): no `current_officials` row has ever existed for the Mayor district because no official government source URL had been supplied. This blocker is the direct, confirmed cause of the empty "My Current Officials" section for essentially every fresh onboarded account (see `docs/internal_beta_fresh_account_district_initialization_audit.md`).

## Official source resolution

Per this task's explicit source policy, only the City of Port St. Lucie's own government pages were used — no campaign pages, Wikipedia, news media, or third-party sources.

- **Primary source:** City of Port St. Lucie, "Mayor & City Council" — `https://www.cityofpsl.com/Government/Your-City-Government/Mayor-City-Council` — states Shannon Martin as Mayor under City Officials; states Port St. Lucie is led by a five-member elected Council; states the Mayor is elected at-large in a citywide election; states Mayor and Council members serve four-year staggered terms.
- **Secondary source:** City of Port St. Lucie, "Elections" — `https://www.cityofpsl.com/Government/Your-City-Government/Departments/City-Clerk/Elections` — states the Mayor seat expires in 2026; lists Shannon Martin as a candidate for Mayor.
- **Additional corroboration:** a City of Port St. Lucie document updated January 2026 identifies "Shannon M. Martin, Mayor."

**Live-fetch limitation, disclosed transparently:** both `cityofpsl.com` URLs above returned HTTP 403 to this session's direct `WebFetch` attempts — the same behavior previously documented for this domain in `docs/controlled_psl_beta_readiness.md` (Milestone 2B: "The City Clerk page and the Municode charter itself returned HTTP 403 to direct fetch and could not be quoted directly"). This session could not independently re-fetch and re-quote the pages. The source content above is exactly as supplied in this task's own instructions (task-author-verified), consistent with this project's established practice when this specific domain blocks automated fetching. No campaign site, Wikipedia, or news source was substituted or consulted as a workaround.

No dedicated per-person Shannon Martin profile subpage URL (analogous to the existing `.../District-1-Stephanie-Morgan` pattern) or a stable official photo URL was supplied or independently confirmed to exist. Per the task's own instruction ("If not: photo_url = NULL"), no URL was guessed or invented for either field.

## Phase 1 — Live district/office structure (read-only, verified)

Queried directly via a temporary, zero-mutation-call service-role script (deleted immediately after each of two runs; `git status --short` confirmed clean afterward):

| Field | Value |
|---|---|
| District id | `11111111-0000-0000-0000-000000000006` |
| District name | Mayor |
| District type | `city_council` |
| City / State | Port St. Lucie / FL |
| Fresh production account (`faa39dd7-...`) holds this district? | **Yes** — confirmed directly, one matching `user_districts` row |

This is the exact, same Mayor anchor district automatically assigned during ZIP onboarding today (`ZIP_MANAGED_DISTRICTS` in `src/app/onboarding/zip/page.tsx` — unchanged, not touched by this task). No district id was guessed.

## Phase 2 — `current_officials` schema and established conventions

Full column set confirmed by reading three existing rows (Stephanie Morgan, Debbie Hawley, Tobin Rogers "Toby" Overdorf) in full: `id, name, office, district_id, jurisdiction_level, photo_url, website, bio, term_start, term_end, next_election_date, source_url, source_label, candidate_id, is_on_next_ballot, created_at, updated_at`.

Established conventions across all three existing rows: `photo_url`, `website`, `bio`, `term_start`, `term_end`, `next_election_date`, and `candidate_id` are **all NULL** on every existing row — even though at least one of the three officials plausibly has knowable data for some of these fields. `office` follows a `"<Role>, District N"` pattern for district-numbered seats. `jurisdiction_level` is `city` for the one existing Port St. Lucie city-government official (Stephanie Morgan). `source_label` follows a `"City of Port St. Lucie <page description>"` pattern. `is_on_next_ballot` is `false` on all three existing rows. `created_at`/`updated_at` are set at insert time (equal to each other on every existing row — i.e., left to database defaults, not explicitly supplied).

## Phase 3 — Shannon Martin identity verification

- Name: **Shannon Martin** (also corroborated as "Shannon M. Martin" in the January-2026 City document).
- Official title: **Mayor**.
- Jurisdiction: City of Port St. Lucie.
- Representation: at-large / citywide (per the primary source's own stated structure).
- Primary source URL: `https://www.cityofpsl.com/Government/Your-City-Government/Mayor-City-Council` — per the task's explicit source policy, this is the URL used; independent live-fetch confirmation was blocked by the domain's HTTP 403 response to automated tools (see above), consistent with prior, already-documented findings for this exact domain.
- No dedicated official per-person profile URL was found/supplied to prefer over the general Mayor & City Council page.
- The campaign website was not used anywhere in this row.

## Phase 4 — Term dates

- **Verified:** only that the Mayor seat "expires in 2026" (a year, not an exact date) — from the secondary Elections source.
- **Not verified:** any exact `term_start` or `term_end` date.
- Per the task's own explicit rule ("If only the year is verified and the schema permits NULL: prefer NULL rather than fabricating a date"), and consistent with the established convention (all three existing rows have `term_end = NULL` regardless of known circumstances): **`term_start = NULL`, `term_end = NULL`, `next_election_date = NULL`** are all proposed. No date was fabricated. (Note: the separate `elections` table already stores `2026-08-18` for "PSL Mayor 2026" per an earlier, unrelated data-model convention decision — that value was deliberately **not** copied into `term_end`/`next_election_date` here, since it represents the Primary date under a different table's own convention, not a directly-verified term-end date for this specific field.)

## Phase 5 — Photo / bio

- `photo_url`: no stable official photo URL was supplied or found → **NULL**, matching the task's explicit fallback instruction and the established convention.
- `bio`: no official-source-derived factual bio was supplied, and the established convention leaves `bio` NULL on every existing row → **NULL**. No campaign biography text was used.

## Phase 6 — Duplicate / safety check (all read-only, verified)

1. **Zero existing `current_officials` rows for the Mayor district** — confirmed by direct query (`district_id = '...0006'` → 0 rows).
2. **Zero existing "Shannon Martin" rows anywhere in `current_officials`** — confirmed by a case-insensitive name search across the whole table → 0 rows.
3. District id confirmed correct (Phase 1) — not guessed.
4. The fresh account's existing Mayor `user_districts` row would join to this new row through the existing, unmodified `officials_for_user` view (`ud.district_id = co.district_id`) — confirmed structurally; no view/query change is proposed.
5. **Blast radius quantified, read-only:** exactly **3 users system-wide** currently hold the Mayor `user_districts` row (confirmed by an exact count query) — the fresh production account plus two previously-known test accounts from earlier gates in this project. Adding this one row would surface Shannon Martin for exactly those 3 users and no others, with zero `user_districts` changes required or proposed.

## Phase 7 — Exact proposed row and SQL (NOT EXECUTED)

**Proposed UUID (generated now for determinism, not yet written anywhere):** `9b10d3fb-88b5-42f0-82cb-aad1720efa34`

| Column | Proposed value | Basis |
|---|---|---|
| `id` | `9b10d3fb-88b5-42f0-82cb-aad1720efa34` | Generated now for a deterministic write |
| `name` | `Shannon Martin` | Primary + corroborating sources |
| `office` | `Mayor` | Primary source; no district-number qualifier needed (at-large office) |
| `district_id` | `11111111-0000-0000-0000-000000000006` | Verified live (Phase 1) |
| `jurisdiction_level` | `city` | Matches established convention for a Port St. Lucie city-government seat |
| `photo_url` | `NULL` | No verified stable URL (Phase 5) |
| `website` | `NULL` | Matches established convention; no dedicated official profile URL found |
| `bio` | `NULL` | Matches established convention; no official-source bio available |
| `term_start` | `NULL` | Not verified (Phase 4) |
| `term_end` | `NULL` | Only the year is verified, not an exact date (Phase 4) |
| `next_election_date` | `NULL` | Only the year is verified, not an exact date (Phase 4) |
| `source_url` | `https://www.cityofpsl.com/Government/Your-City-Government/Mayor-City-Council` | Primary official source, per source policy |
| `source_label` | `City of Port St. Lucie Mayor & City Council page` | Matches established `"City of Port St. Lucie <page>"` label pattern |
| `candidate_id` | `NULL` | Matches established convention (all 3 existing rows are NULL); see discretionary note below |
| `is_on_next_ballot` | `true` | **Deviation from the "false" convention, deliberate and source-backed** — see note below |

**Discretionary note on `candidate_id`:** Shannon Martin already has an existing `candidates` table row (`d44ff05a-14af-45c2-9f2f-6d530a8a051e`, Mayor race, `is_incumbent: true`) — unlike the other three seeded officials, who have no matching `candidates` row at all. Linking `candidate_id` to that row would make her `current_officials` card clickable through to her candidate profile (per `OfficialCard`'s existing logic in `src/components/CurrentOfficialsSection.tsx`) and would suppress the (already-NULL) website link in favor of that internal link. This task proposes `NULL` to match the established convention exactly and avoid making an unrequested product-behavior decision; linking it is a reasonable, separately-approvable future enhancement, not part of this proposed row.

**Note on `is_on_next_ballot = true`:** every existing seeded official has `false`, but none of them is a declared candidate for their own seat in this app's current tracked election cycle. Shannon Martin is directly verified — by both the official Elections source quoted in this task and the app's own already-approved `candidates` table — to be a declared candidate for Mayor in the current cycle. Setting `true` is a correct, source-backed use of the field's own stated meaning, not an invented value.

**Exact INSERT (NOT EXECUTED):**
```sql
INSERT INTO current_officials (
  id, name, office, district_id, jurisdiction_level,
  photo_url, website, bio, term_start, term_end, next_election_date,
  source_url, source_label, candidate_id, is_on_next_ballot
) VALUES (
  '9b10d3fb-88b5-42f0-82cb-aad1720efa34',
  'Shannon Martin',
  'Mayor',
  '11111111-0000-0000-0000-000000000006',
  'city',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  'https://www.cityofpsl.com/Government/Your-City-Government/Mayor-City-Council',
  'City of Port St. Lucie Mayor & City Council page',
  NULL,
  true
);
```

**Exact verification SELECT (NOT EXECUTED):**
```sql
SELECT * FROM current_officials WHERE id = '9b10d3fb-88b5-42f0-82cb-aad1720efa34';

SELECT count(*) FROM current_officials WHERE district_id = '11111111-0000-0000-0000-000000000006';
-- expect exactly 1

SELECT * FROM officials_for_user WHERE district_id = '11111111-0000-0000-0000-000000000006';
-- expect exactly 3 rows (one per user currently holding the Mayor district), all "Shannon Martin"
```

**Exact rollback DELETE, scoped to exactly one known row (NOT EXECUTED):**
```sql
DELETE FROM current_officials WHERE id = '9b10d3fb-88b5-42f0-82cb-aad1720efa34';
```

## Phase 8 — Expected product effect (traced against current code, not executed)

`getOfficialsForUser` (`src/lib/officials.ts`) queries `officials_for_user` filtered by `user_id` — unmodified. After this insert, for the fresh production account (which holds exactly Mayor, County Commission At-Large, and Florida Statewide):

- **Mayor → Shannon Martin would now resolve** (the new row joins on `district_id = '...0006'`).
- **County Commission At-Large and Florida Statewide remain unresolved** (zero `current_officials` rows tied to either, unaffected by this insert) — so no other officials are pulled in.
- **Stephanie Morgan, Debbie Hawley, and Tobin Rogers "Toby" Overdorf would NOT appear** for the fresh account, because their respective districts (City Council District 1, School Board District 1, FL House District 85) are not in the fresh account's `user_districts` — confirmed by the fresh-account audit (commit `4b45238`) and unaffected by this task.
- **Home and Profile share the identical result** — both render the same shared `CurrentOfficialsSection` component (confirmed in the prior empty-state-copy task, commit `9205ec7`), which calls the same `getOfficialsForUser(userId)` — no divergence possible.
- The empty-state copy from the immediately prior task ("Your current officials will appear as your representation districts are verified.") would correctly stop rendering for these 3 users specifically (since `officials.length` would become 1, not 0), while remaining correct and unchanged for any user who does not hold the Mayor district.

## Approval boundary

**STAGE B (the INSERT) is not executed by this task and will not be executed unless the user gives explicit, row-level approval of the exact proposed values above** — matching this project's established write-approval pattern (as used for every prior `current_officials` seed in this project). Approval must cover: the exact `id` UUID, all 15 proposed column values (including the two deliberate non-convention choices — `is_on_next_ballot = true` and the `candidate_id = NULL` discretionary note), the exact INSERT statement, and acknowledgment of the verification/rollback plan above.

No schema, RLS, function, `user_districts`, ballot-eligibility, or write-guard change was made or is proposed. No deployment occurred. No unrelated Gemini-migration work was touched.
