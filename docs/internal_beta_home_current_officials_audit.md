# Home "My Current Officials" Completeness Audit and UX Recommendation

Date: 08-20-2026
Timestamp: 07:30 pm EST

Status: **Audit complete. Read-only. No database write. No code change. No deployment.**

## Scope discipline

This task was READ-ONLY DATABASE VERIFICATION + CODE INSPECTION + CURRENT-STATE COMPARISON + UX RECOMMENDATION + DOCUMENTATION only. No `user_districts`, `current_officials`, `districts`, or `officials_for_user` row was created, modified, or deleted. No schema/RLS/function change. No deployment. No district assignment was guessed or inferred from ZIP.

A temporary, read-only-only Node script (`scripts/temp-audit-current-officials.cjs`), mirroring the established project pattern (Gates I22/I26/I42/I44), was created, inspected for zero mutation calls (`.select()` only, no `.insert()`/`.update()`/`.upsert()`/`.delete()`), run once, and deleted immediately after. `git status --short` confirmed a clean tree afterward.

## Phase 1 — Test user identification

Confirmed live: `civicmarket.test.01@example.com`, UUID `ec59ea92-470f-447f-8873-ab2dbde52aca`.

- `profiles` row exists: `dna_quiz_status: 'completed'`, `is_admin: false`.
- This is the same account used throughout Gates I26–I47 and Milestone 2A.

## Phase 2 — `user_districts` audit

Live query returned **exactly 6 rows**, matching the documented Milestone 2A baseline exactly — no drift, no duplicates, no stale rows found.

| district_id | Name | Type | Expected to contribute to Current Officials? | Stale/duplicate/suspicious? |
|---|---|---|---|---|
| `...0001` | City Council District 1 | city_council | Yes — exact match | No |
| `...0002` | School Board District 1 | school_board | Yes — exact match | No |
| `...0003` | St. Lucie County Commission At-Large | county | Yes — exact match, but see below | No |
| `...0004` | FL House District 85 | state | Yes — exact match | No |
| `...0005` | FL Senate District 27 | state | Yes — exact match, but see below | No |
| `...0006` | Mayor | city_council | Yes — exact match, but see below | No |

**Specific items requested:**

- **City Council District 1**: present, exactly one row, not stale.
- **City Council District 3**: **absent**. The user does not hold this district. Confirmed by exact row enumeration above (only 6 rows, D3's id `...0007` is not among them).
- **Mayor**: present, exactly one row (added by the approved Gate I27 onboarding change; this account predates that change and picked it up via a later ZIP resubmission during Milestone 2A).
- **St. Lucie County Commission District 2 / District 4**: **both absent**. The user holds only County Commission **At-Large** (`...0003`). Neither `...0032` (District 2) nor `...0034` (District 4) appears in `user_districts` for this user.
- **FL House District 85**: present, exactly one row.

**Finding: `user_districts` is not inconsistent, stale, duplicate, or conflicting.** The user does **not** hold City Council District 3 or County Commission District 2/4 as representation districts — those three only appear as Home-screen **ballot** chips (see Phase 6), not as held districts. This is a UX/labeling question, not a data-integrity problem. No write is needed here, and none is proposed.

## Phase 3 — `current_officials` audit

**Rows tied to the user's exact held district_ids** (the officials `officials_for_user` can possibly return for this user):

| Official | Office | district_id | Jurisdiction | On next ballot | Active | Should appear (personal-action-first)? |
|---|---|---|---|---|---|---|
| Stephanie Morgan | City Council Member, District 1 | `...0001` | city | false | yes | Yes |
| Debbie Hawley | School Board Member, District 1 | `...0002` | school_board | false | yes | Yes |
| Tobin Rogers "Toby" Overdorf | State Representative, District 85 | `...0004` | state | false | yes | Yes |

**No `current_officials` row exists for `...0003` (County Commission At-Large), `...0005` (FL Senate District 27), or `...0006` (Mayor).** This is expected and previously documented:
- At-Large intentionally has zero `current_officials` rows (Path 1 personalization fix, Gate D) — it exists only as a ballot/representation anchor, not a seatholder record.
- FL Senate District 27 was confirmed incorrect for St. Lucie County (Milestone 2B, Item 1) and was never seeded with an official.
- Mayor has no `current_officials` row anywhere in the system — the pre-existing, still-open "Current Officials — Mayor district gap" (no official source URL supplied yet for the current Mayor).

**System-wide `current_officials` (9 rows total)**, for context on what exists but isn't tied to this user's districts:

| Official | Office | district_id | Tied to a district this user holds? |
|---|---|---|---|
| Stephanie Morgan | City Council D1 | `...0001` | Yes |
| Anthony Bonna, Sr. | City Council D3 | `...0007` | **No** — user doesn't hold D3 |
| James Clasby | County Commission D1 | `...0031` | No |
| Larry Leet | County Commission D2 | `...0032` | **No** — user doesn't hold D2 |
| Erin Lowry | County Commission D3 | `...0033` | No |
| Jamie Fowler | County Commission D4 | `...0034` | **No** — user doesn't hold D4 |
| Cathy Townsend | County Commission D5 | `...0035` | No |
| Debbie Hawley | School Board D1 | `...0002` | Yes |
| Tobin Rogers "Toby" Overdorf | FL House D85 | `...0004` | Yes |

No record was found to be inactive, archived, or otherwise excludable — every row above is a genuine currently-serving official under the personal-action-first rule; the ones not returned for this user are correctly excluded because the user does not hold that specific district.

## Phase 4 — `getOfficialsForUser` trace

`src/lib/officials.ts` → `getOfficialsForUser(userId)`:
```
supabase.from('officials_for_user').select(...).eq('user_id', userId).order('name')
```

`officials_for_user` (`Reference Files/civicmarket_schema_addendum_officials_reviews.sql`, lines 112-133) is a plain SQL view:
```sql
SELECT ... FROM user_districts ud
JOIN current_officials co ON co.district_id = ud.district_id
JOIN districts d ON d.id = co.district_id;
```

This is a strict `district_id` equality join, unchanged since creation and confirmed still unmodified by every subsequent gate (County Commission B2 was disabled in the Path 1 fix; the type-family ballot-eligibility expansion added today only touches `resolveBallotDistrictIds` in `src/lib/candidates.ts`, never this view or this file).

`CurrentOfficialsSection.tsx` renders exactly what `getOfficialsForUser` returns — no client-side filtering, dedup, or truncation logic exists in the component. It shows a generic "will appear here" message only when the array is empty, and shows the loading/error state otherwise unmodified. No bug found in the component.

**Conclusion: the 3-official result is exactly correct for the current `officials_for_user` join, current `user_districts` rows, and current `current_officials` rows.** There is no query bug and no rendering bug.

## Phase 5 — Expected vs. actual

### Official-level

| Official | Expected for user? | Actual returned? | Reason if missing |
|---|---|---|---|
| Stephanie Morgan (City Council D1) | Yes | Yes | — |
| Debbie Hawley (School Board D1) | Yes | Yes | — |
| Tobin Rogers "Toby" Overdorf (FL House D85) | Yes | Yes | — |
| A Mayor official | Yes (user holds Mayor district) | **No** | **A — missing `current_officials` data** (documented, pre-existing gap; no official source URL yet) |
| Anthony Bonna, Sr. (City Council D3) | **No** — user does not hold D3 | No | **D — intentionally excluded**; correctly not shown, since D3 is not a verified representation district for this user (only a ballot-eligible race, see Phase 6) |
| Larry Leet / Jamie Fowler (County Commission D2/D4) | **No** — user holds only At-Large | No | **D — intentionally excluded**; same reasoning as D3, and consistent with the deliberate Path 1 personalization fix that disabled the old At-Large → all-five-commissioners expansion |

No case of **B** (user_districts mismatch), **C** (lookup/query bug), **E** (UI rendering/filter bug), or **F** (ambiguous/conflicting stored state) was found anywhere in this audit.

### District-level

| District | Stored for user? | Current official exists (system-wide)? | Returned by `getOfficialsForUser`? | Potential issue |
|---|---|---|---|---|
| City Council District 1 | Yes | Yes (Stephanie Morgan) | Yes | None |
| School Board District 1 | Yes | Yes (Debbie Hawley) | Yes | None |
| County Commission At-Large | Yes | No (by design) | No | None — anchor-only district |
| FL House District 85 | Yes | Yes (Toby Overdorf) | Yes | None |
| FL Senate District 27 | Yes | No | No | Pre-existing known-incorrect district (Milestone 2B) — separate open item, not caused or worsened by this audit |
| Mayor | Yes | **No** | No | **Open data gap** — Mayor `current_officials` row does not exist yet system-wide |
| City Council District 3 | **No** (not held) | Yes (Anthony Bonna, Sr.) | No | Correctly excluded — appears only as a ballot chip, not a representation district, for this user |
| County Commission District 2 | No (not held) | Yes (Larry Leet) | No | Correctly excluded — same reasoning |
| County Commission District 4 | No (not held) | Yes (Jamie Fowler) | No | Correctly excluded — same reasoning |

## Root cause

**There is no data-integrity bug and no query/lookup bug.** `user_districts`, `current_officials`, and `officials_for_user` are all behaving exactly as designed, and the design itself (strict representation, no board-wide expansion) is the correct, previously and repeatedly re-affirmed product rule (Path 1 personalization fix; Gate I28-I36 verified-district-assignment work).

The perceived inconsistency has two separate, distinct causes:

1. **UX framing defect (not a code defect):** the Home screen's "Your districts" section (`src/app/page.tsx` lines 226-242) is populated from `candidates.map(c => c.district_name)` — the **post-ballot-eligibility-expansion** candidate list returned by `getCandidatesForDistricts` / `resolveBallotDistrictIds` (`src/lib/candidates.ts`, `src/lib/ballotEligibility.ts` — the citywide/countywide expansion completed earlier today). That expansion is correct and intentional **for ballot purposes**: it is why City Council District 3 and County Commission District 2/District 4 candidates/races appear as chips (the user can vote in every citywide City Council seat and every countywide County Commission seat). But the section is labeled "Your districts," which reads to a user as "districts I am represented in" — the same concept "My Current Officials" uses. It is not. This is the entire source of the apparent contradiction: two sections, one page, two different underlying concepts ("districts you can vote in" vs. "districts you are represented in"), sharing similar-sounding, undifferentiated labels.

2. **Genuine, pre-existing, already-documented data gap (Mayor):** the user does hold the Mayor district as representation, but no `current_officials` row for Mayor exists anywhere in the system yet (no official source URL has been supplied — see "Current Officials — Mayor district gap" in `CIVICMARKET_CURRENT_STATE.md`). This is a real, if small, completeness gap for this specific user, separate from the labeling issue above, and was not caused, worsened, or newly discovered by anything else in this audit.

## Phase 6 — UX review of the Home section

Findings against the requested review points:

1. **My Current Officials completeness** — correct given the data; the perceived incompleteness is a labeling/framing problem elsewhere on the page (see Root cause), plus the one genuine Mayor data gap.
2. **Section ordering** — current order is Top Matches → Your districts → My Current Officials → Civic feed → beta note. Recommended order (per task's suggested direction) makes sense: Local Elections header/countdown → Top Matches/Ballot → My Current Officials → Upcoming civic actions → Local Civic Updates → Your Representation/Districts (demoted) → beta/source note → bottom nav. This resolves the framing problem structurally: moving "districts" below Current Officials, retitled, removes the side-by-side comparison that currently invites the reader to expect a 1:1 match.
3. **Card density** — `OfficialCard` is already reasonably compact (name, office/district, jurisdiction badge, ballot-status pill, term/election dates only if present, one or two links). No bloat found. Fine as-is.
4. **"Your Districts" prominence** — currently a full first-class section with equal visual weight to Current Officials, directly above it. Recommend demoting to a secondary "Your Representation" section (see below) with less prominence, since it currently reads as more authoritative than it is (it's ballot eligibility, not representation).
5. **Top Matches locked-state clarity** — not deeply re-audited in this task (out of the requested Current-Officials scope), but the existing `MatchScoreRing` locked-state accessible label ("Match score unavailable. Not enough verified position data.") was already hardened in Gates I14-I17 and is unaffected by anything found here. The task's suggested "Based on N Civic DNA dimensions" partial-coverage disclosure is a reasonable future enhancement (Shannon Martin's live score is currently based on 4 of 7 dimensions with no such disclosure), but is a separate, not-yet-scoped UX item.
6. **Civic Feed content** — confirmed by direct code read: `CIVIC_FEED` in `src/app/page.tsx` (lines 16-20) is **hardcoded internal beta-status/methodology copy** ("Candidate profiles loaded from verified source records," "Voting records locked until official candidate vote history is verified," etc.), not user-facing local civic content. It does not yet reflect the "year-round civic awareness platform" strategic direction documented in `CIVICMARKET_CURRENT_STATE.md`. This is a known gap, not something this audit is scoped to fix.
7. **Mobile scroll length** — not independently re-measured live in this task (no live UI session was used, per the read-only/no-touch scope); the existing section count/density does not appear to have grown since the last mobile checks in Gates I17/I21/I30, which found no clipping/overflow issues on the pages they covered. Adding "Your Representation" as collapsible per the recommendation below would shorten scroll length rather than lengthen it.

### Recommended Current Officials treatment (confirmed compatible with live data)

- Show every verified current representative exactly once — already true.
- Compact rows/cards — already true.
- "Show first 4, View all X officials" — not yet needed at 3 officials for this user, but the component has no cap logic today; worth adding preemptively since a user with more held districts (e.g. one who later verifies City Council District 3 or a future School Board District 3/5 row) could exceed 4.
- Never silently omit officials — already true; nothing is silently omitted today, the only "missing" one is the documented Mayor data gap.
- Do not broaden a board to all members without representation basis — already true and structurally enforced (the `officials_for_user` view has no such logic, and the Path 1 fix removed the one place that ever did this).

### Recommended "Your Representation" (renamed from "Your districts") treatment

- Demote below My Current Officials.
- Rename from "Your districts" to something that does not overload the word "districts" the same way Current Officials implicitly does — e.g. "Your Representation" for a held-district list, keeping the existing ballot-eligibility chip list (if kept at all) separately labeled as "Races on your ballot" rather than "districts," so it cannot be read as a representation claim.
- Consider collapsible/secondary treatment for mobile scroll length.

## Phase 7 — Recommended fix order

1. **No data correction is needed or proposed.** `user_districts` is not stale, duplicate, or conflicting. The Mayor `current_officials` gap is a pre-existing, separately-tracked, source-blocked item (no official source URL yet) — out of this task's scope to resolve, and not newly caused by anything found here.
2. **No lookup/query logic correction is needed.** `getOfficialsForUser`, the `officials_for_user` view, and `CurrentOfficialsSection.tsx` are all working exactly as designed; the design itself is correct per the standing product rule.
3. **UI/layout correction is the only recommended change**, and it is presentation-only:
   - Reorder Home sections per the direction in Phase 6.
   - Rename/reframe "Your districts" so it is not read as a representation claim (e.g. "Your Representation" / relabel the chip source, or split ballot-eligible races from held districts into two distinctly labeled things).
   - Optionally add a "View all X officials" cap to `CurrentOfficialsSection` for future-proofing.
   - This is a small, presentation-only, `src/app/page.tsx` + possibly `CurrentOfficialsSection.tsx` change — no `officials.ts`, `candidates.ts`, `ballotEligibility.ts`, or database change is implicated.
4. **Live regression verification**, once any UI change is implemented: confirm the three officials still render correctly for this test user, confirm the renamed/reordered sections read unambiguously, confirm no regression to the ballot chip list's own correctness (it should still show all ballot-eligible races), and confirm mobile layout is not worsened.

**No stale/conflicting `user_districts` data was found, so the "STOP before proposing any write" branch of this task does not apply.** This is purely a code/UI framing issue plus one already-tracked, already-source-blocked data gap (Mayor). Per this task's explicit default, no implementation was performed — audit and recommendation only.

## Approval boundary

Any future implementation of the Phase 6/7 UI recommendations (Home section reorder, "Your districts" relabel, `CurrentOfficialsSection` cap) requires its own separate task/approval, consistent with the "one route, one feature, one fix per session" rule in `CLAUDE.md`. This audit does not itself authorize that implementation.

The Mayor `current_officials` gap remains blocked on an official government source URL, per the existing standing rule in `CIVICMARKET_CURRENT_STATE.md` ("Current Officials — Mayor district gap") — not something this task is authorized to resolve by inference or placeholder.
