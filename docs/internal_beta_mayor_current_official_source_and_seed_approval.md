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
| `candidate_id` | `d44ff05a-14af-45c2-9f2f-6d530a8a051e` | **Revised from an earlier NULL draft after re-verification — see corrected note below** |
| `is_on_next_ballot` | `true` | **Deviation from the "false" convention, deliberate and source-backed** — see note below |

**Corrected note on `candidate_id` (re-verified, not assumed from convention):** re-checked read-only whether the "NULL convention" on the three existing rows was a *deliberate choice to leave a real match unlinked*, or simply an *absence of any match to link*. Result: **the convention was never actually tested** — a fresh, explicit cross-check of `candidates` by name found **zero** matching rows for Stephanie Morgan, Debbie Hawley, or Tobin Rogers. None of the three existing officials has ever had a linkable `candidates` row at all, so their `NULL` values reflect "nothing existed to link," not "a match existed and was deliberately excluded." Shannon Martin is the **first** case where a real, exact, unambiguous match exists: `candidates.id = d44ff05a-14af-45c2-9f2f-6d530a8a051e` — same name, `office: 'Mayor'`, `district_id` identical to the Mayor district above, `is_incumbent: true` — confirmed live, re-verified in this response. **Recommendation: link it.** `candidate_id` and the `OfficialCard` component's own existing conditional (`if (official.candidate_id) return <Link href="/candidates/${id}">...`) were clearly built for exactly this case — routing a current officeholder's card to their fuller, evidence-backed candidate profile (funding, voting record, computed match score) rather than only an external city-government link. This is not inventing data: it is applying an already-verified, already-approved foreign-key relationship between two rows that both independently passed their own separate verification gates. The (already-NULL) `website` field is unaffected either way, since `OfficialCard` only shows it when `candidate_id` is absent.

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
  'd44ff05a-14af-45c2-9f2f-6d530a8a051e',
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

SELECT id, name, office FROM candidates WHERE id = 'd44ff05a-14af-45c2-9f2f-6d530a8a051e';
-- confirms the linked candidate_id still resolves to Shannon Martin / Mayor
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
- **With `candidate_id` linked**, Shannon Martin's `OfficialCard` becomes tappable — it would route to `/candidates/d44ff05a-14af-45c2-9f2f-6d530a8a051e` (her existing candidate profile: bio, funding, voting record, and her already-computed match score), the same behavior the component already implements for any official whose `candidate_id` is set. No code change is required for this — the existing `OfficialCard` logic already handles it.
- The empty-state copy from the immediately prior task ("Your current officials will appear as your representation districts are verified.") would correctly stop rendering for these 3 users specifically (since `officials.length` would become 1, not 0), while remaining correct and unchanged for any user who does not hold the Mayor district.

## Approval boundary (Stage A)

**STAGE B (the INSERT) is not executed by this task and will not be executed unless the user gives explicit, row-level approval of the exact proposed values above** — matching this project's established write-approval pattern (as used for every prior `current_officials` seed in this project). Approval must cover: the exact `id` UUID, all 15 proposed column values (including the two deliberate non-convention choices — `is_on_next_ballot = true` and `candidate_id = 'd44ff05a-14af-45c2-9f2f-6d530a8a051e'`, both re-verified and explained above), the exact INSERT statement, and acknowledgment of the verification/rollback plan above.

## Stage B — Execution Result

Date: 08-21-2026

Status: **EXECUTED. VERIFICATION PASSED. Rollback not required, not used.**

The user gave explicit, row-level approval of the exact proposed row, with one instruction: store `source_url` as the exact uninterrupted string `https://www.cityofpsl.com/Government/Your-City-Government/Mayor-City-Council` with no embedded whitespace/newline.

**Pre-write checks (re-run immediately before the insert, all passed):**

| Check | Result |
|---|---|
| Proposed UUID `9b10d3fb-88b5-42f0-82cb-aad1720efa34` does not already exist | PASS — 0 rows |
| Mayor district still has zero `current_officials` rows | PASS — 0 rows |
| Shannon Martin still has zero `current_officials` rows anywhere | PASS — 0 rows |
| `candidate_id` still resolves exactly to Shannon Martin / Mayor | PASS |
| `district_id` still resolves exactly to the Port St. Lucie Mayor district | PASS (`type: city_council`, city: Port St. Lucie, state: FL) |
| Exactly 3 users currently hold the Mayor district | PASS — count = 3 |

**Execution:** a temporary, one-time script (inspected for exactly one `.insert()` call and zero `.update()`/`.upsert()`/`.delete()` calls, deleted immediately after its single run) performed a defensive re-check, then the single insert, then immediate verification — all in one script invocation, no separate write step.

**Post-write verification, all passed:**

- `SELECT * FROM current_officials WHERE id = '9b10d3fb-...'` → exactly 1 row, every field matched the approved values exactly, including `source_url` (programmatically confirmed via exact string equality — `sourceUrlExactMatch: true`, length 76 characters, no whitespace/newline corruption).
- `SELECT count(*) FROM current_officials WHERE district_id = '...0006'` → **1**.
- `officials_for_user` for the Mayor district → **exactly 3 rows**, all `name: "Shannon Martin"`, all correctly carrying `candidate_id: 'd44ff05a-...'` — for users `3b223f8c-...`, `ec59ea92-...`, and `faa39dd7-...` (the fresh production account).
- `candidates` join on the linked `candidate_id` → resolves to `Shannon Martin / Mayor`, confirmed.

**Live product verification** (already-authenticated local session for `civicmarket.test.01@example.com` / `ec59ea92-...`, one of the 3 Mayor-holding users — the fresh production account itself was not signed into, consistent with every prior task in this workstream):

- Home "My Current Officials" now shows **Shannon Martin — Mayor · Mayor — CITY — "On your next ballot" — Current official — Source: official government record**, alongside Debbie Hawley, Stephanie Morgan, and Tobin Rogers "Toby" Overdorf (this specific account holds all four corresponding districts from its accumulated test history — not a leak, and not evidence of over-expansion for any other account).
- Profile "My Current Officials" shows the identical result — confirmed live, same four officials, same wording.
- **Clicking Shannon Martin's card navigated correctly to `/candidates/d44ff05a-14af-45c2-9f2f-6d530a8a051e`** — her real candidate profile, showing "YOUR MATCH SCORE 66," confirming the `candidate_id` link works exactly as designed, with zero code changes required.
- No `user_districts` row was created, modified, or deleted by this task — the only write executed was the single `current_officials` insert (confirmed by direct inspection of the execution script's contents before running, and structurally guaranteed since `officials_for_user`'s Mayor-district row count matched the pre-write holder count exactly: 3 before, 3 after).

**Rollback:** prepared and available (`DELETE FROM current_officials WHERE id = '9b10d3fb-88b5-42f0-82cb-aad1720efa34';`) but **not executed** — no verification failure occurred.

No schema, RLS, function, `user_districts`, ballot-eligibility, or write-guard change occurred. No deployment occurred — production reads live Supabase data directly, so this data-only change is already live for `https://civicmarket.vercel.app` without any redeploy. No unrelated Gemini-migration work was touched.

No schema, RLS, function, `user_districts`, ballot-eligibility, or write-guard change was made or is proposed. No deployment occurred. No unrelated Gemini-migration work was touched.
