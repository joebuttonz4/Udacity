# Internal Beta — Gate I30B: City Council District 3 Pre-Write Blocker Resolution

## 1. Date and timestamp

Date: 08-08-2026
Timestamp: 07:50 am EST

This document is verification, research, and design only. No `current_officials` row was inserted. No schema or RPC was created. No production `user_districts` write occurred. No write guard was enabled.

## 2. Repository baseline

- Path: `J:\CivicMarket`
- Branch: `master`
- Working tree: clean
- Up to date with `origin/master`
- Latest pushed commit: `c07b7d5` Verify City Council district assignment flow

## 3. Purpose

Resolve or prepare resolution for the two technical blockers preventing Gate I31: (1) the missing verified City Council District 3 `current_officials` row, and (2) the non-atomic District 1 ↔ District 3 `user_districts` replacement.

---

# PART A — City Council District 3 current official, freshly verified

**Full name: Anthony Bonna, Sr.**
**Office/title: District 3 Councilman**
**District: City Council District 3**
**Currently serving: Yes**

Verified via two independent, first-party City of Port St. Lucie sources, not relied on from Gate I28's prior map-tool-only identification:

1. `https://www.cityofpsl.com/Government/Your-City-Government/Mayor-City-Council` (the official "Mayor & City Council" listing page) — lists current City Officials: Shannon Martin (Mayor), Jolien Caraballo (Vice Mayor, District 4 Councilwoman), Stephanie Morgan (District 1 Councilwoman), David Pickett (District 2 Councilman), **Anthony Bonna, Sr. (District 3 Councilman)**. Also confirms: "Port St. Lucie City Council members must live in the district they represent... The Mayor and City Council members serve 4-year staggered terms."
2. **His dedicated official bio page**, linked directly from the page above: `https://www.cityofpsl.com/Government/Your-City-Government/Mayor-City-Council/District-3-Anthony-Bonna` — page title "Anthony Bonna, Sr. | City of Port St. Lucie, FL", subtitle "District 3 Councilman", with a biography and contact details.

This is consistent with, and now independently re-confirms without relying on, the ArcGIS "Council District Finder" tool result from Gate I28 (`COUNCIL PERSON: Anthony Bonna, DISTRICT: 3, CNCL ID: CD3`).

**Vice Mayor title:** Not applicable to Anthony Bonna — the current Vice Mayor is Jolien Caraballo (District 4), confirmed on the same page. No incorrect title is proposed.

**Term information:** No specific term-start/term-end date is published on either official page. This is not treated as a missing/blocking fact — see Part B, which shows the existing Stephanie Morgan precedent row already leaves `term_start`/`term_end`/`next_election_date` as `null` for exactly the same reason (not published by the City in a citable, item-specific form).

**Cross-check against candidate data (not guessed, derived from already-verified repository facts):** District 3 is confirmed up for election in 2026 (per the City Clerk's own FAQ, already documented in this repository). The three declared 2026 District 3 candidates (Fritz Alexandre, Jim Norton, Peter Overhuls) do **not** include Anthony Bonna — meaning he is not seeking re-election. This exactly mirrors Stephanie Morgan's own situation (District 1 is also up in 2026; she is not among the four declared District 1 candidates either). This is why `is_on_next_ballot: false` is the correct, precedent-consistent value for both — not a gap, an accurate reflection of a sitting official who isn't a 2026 candidate.

No political affiliation, policy position, endorsement, or ranking was inferred, recorded, or considered anywhere in this verification.

---

# PART B — `current_officials` precedent and exact field structure

Live schema (confirmed directly from the existing Stephanie Morgan row, `select=*`):

`id, name, office, district_id, jurisdiction_level, photo_url, website, bio, term_start, term_end, next_election_date, source_url, source_label, candidate_id, is_on_next_ballot, created_at, updated_at`

**Existing District 1 precedent row (Stephanie Morgan), read live in full:**

```json
{
  "name": "Stephanie Morgan",
  "office": "City Council Member, District 1",
  "district_id": "11111111-0000-0000-0000-000000000001",
  "jurisdiction_level": "city",
  "photo_url": null,
  "website": null,
  "bio": null,
  "term_start": null,
  "term_end": null,
  "next_election_date": null,
  "source_url": "https://www.cityofpsl.com/Government/Your-City-Government/Mayor-City-Council/District-1-Stephanie-Morgan",
  "source_label": "City of Port St. Lucie District 1 Council profile",
  "candidate_id": null,
  "is_on_next_ballot": false
}
```

This is the exact template Part C's proposed District 3 row mirrors field-for-field, including the same source-URL pattern on the same official domain (`.../Mayor-City-Council/District-{N}-{Name}`), confirming Anthony Bonna's bio page is the correct, consistent, item-specific source to cite — not a generic listing page.

No Mayor (`Shannon Martin`) `current_officials` row exists yet — a separate, already-documented gap in this repository, unaffected by and out of scope for this gate.

---

# PART C — Proposed District 3 row (NOT inserted — draft only)

```json
{
  "name": "Anthony Bonna, Sr.",
  "office": "City Council Member, District 3",
  "district_id": "11111111-0000-0000-0000-000000000007",
  "jurisdiction_level": "city",
  "photo_url": null,
  "website": null,
  "bio": null,
  "term_start": null,
  "term_end": null,
  "next_election_date": null,
  "source_url": "https://www.cityofpsl.com/Government/Your-City-Government/Mayor-City-Council/District-3-Anthony-Bonna",
  "source_label": "City of Port St. Lucie District 3 Council profile",
  "candidate_id": null,
  "is_on_next_ballot": false
}
```

**Two judgment calls made explicit for approval, not silently decided:**
1. **Name format:** the official page's page title and body text both read "Anthony Bonna, Sr." (with suffix). This is proposed as-is (matching the source verbatim), rather than shortened to "Anthony Bonna" (which is how the Gate I28 map tool's attribute data displayed it, likely truncated). If a shorter form is preferred to match the map tool or for display consistency, that is a one-field change to this draft, not a re-verification.
2. **Office phrasing:** the official page's own label is "District 3 Councilman." This draft instead uses **"City Council Member, District 3"** to exactly mirror the phrasing convention already established by the live Stephanie Morgan row ("City Council Member, District 1") rather than copying the page's own wording verbatim — consistent with how her row was evidently normalized at seed time. If the team prefers the page's literal wording instead, that is also a one-field change.

## Readiness for a scoped write

**This row is fully ready for explicit write approval.** No required field was guessed: every populated field is either directly sourced from an official, item-specific City of Port St. Lucie page, or correctly left `null` following the exact precedent already established by the only comparable existing row (Stephanie Morgan) for the identical, non-guessable reason (no published term-date data). **This gate does not execute the insert** — no existing approval record explicitly authorizes this specific data write, so per instruction it is treated as not yet authorized.

### Draft SQL — NOT EXECUTED

```sql
-- DRAFT ONLY — NOT EXECUTED BY GATE I30B — requires separate explicit approval.
INSERT INTO current_officials
  (name, office, district_id, jurisdiction_level, photo_url, website, bio,
   term_start, term_end, next_election_date, source_url, source_label,
   candidate_id, is_on_next_ballot)
VALUES
  ('Anthony Bonna, Sr.', 'City Council Member, District 3',
   '11111111-0000-0000-0000-000000000007', 'city', NULL, NULL, NULL,
   NULL, NULL, NULL,
   'https://www.cityofpsl.com/Government/Your-City-Government/Mayor-City-Council/District-3-Anthony-Bonna',
   'City of Port St. Lucie District 3 Council profile',
   NULL, false);
```

### Pre-write verification (for a future approved execution, not run now)

- Confirm no existing `current_officials` row already exists for `district_id = '11111111-0000-0000-0000-000000000007'` (re-confirmed this gate: zero such rows exist).
- Confirm no existing row already exists for `name ILIKE '%Bonna%'` (re-confirmed this gate: zero such rows exist).
- Confirm `district_id` value resolves live to `City Council District 3` (re-confirmed this gate).
- Confirm Stephanie Morgan's row remains unchanged immediately before and after (baseline captured in Part B).

### Post-write verification (for a future approved execution, not run now)

- Exactly one new `current_officials` row, matching the draft above field-for-field.
- Stephanie Morgan's row unchanged (same `id`, same all fields).
- Total `current_officials` count increases by exactly 1 (from 8 to 9).
- No other row (Mayor, School Board, County Commission, FL House/Senate) altered.

### Rollback (for a future approved execution, not run now)

```sql
-- ROLLBACK — only if post-write verification fails. Uses the exact inserted id.
DELETE FROM current_officials WHERE id = '<the exact id returned by the insert above>';
```

Never a name- or district-based delete condition, to avoid any risk of matching an unrelated row.

**No `current_officials` write occurred in this gate.** Stephanie Morgan's row and every other row were not modified.

---

# PART D — Atomic District 1 ↔ District 3 replacement

**Current state, reconfirmed by direct inspection of `src/app/api/set-city-council-district/route.ts` (lines 159-178, unreachable while the guard is false):** the future write path performs a `.delete()` call followed by a separate `.insert()` call — two independent, non-transactional Supabase REST requests. Unchanged since Gate I29/I30's own findings.

## Option A — Supabase/Postgres RPC (RECOMMENDED)

A narrowly scoped `SECURITY INVOKER` Postgres function, e.g. `set_city_council_district(p_district_id uuid)`:

- **Derives the user from `auth.uid()`** inside the function body — never accepts a client-supplied user ID as a parameter. This matches the same trust model already used by every `user_districts` RLS policy in this schema (`auth.uid() = user_id`).
- **Validates `p_district_id`** is exactly one of the two approved fixed City Council IDs (`...000001` / `...000007`) inside the function body — a second, redundant, server-side check, mirroring the route's own existing `APPROVED_DISTRICT_IDS` defense-in-depth pattern — and raises an exception (aborting the whole function, touching nothing) on any other value.
- Body: `DELETE FROM user_districts WHERE user_id = auth.uid() AND district_id IN ('...000001','...000007');` then `INSERT INTO user_districts (user_id, district_id, scope) VALUES (auth.uid(), p_district_id, 'city');` — both statements execute inside the function's own implicit transaction. **A Postgres function's body is atomic by default: if any statement raises, every effect of the function is rolled back automatically.** No explicit `BEGIN`/`COMMIT` is needed inside the function itself.
- **`SECURITY INVOKER` (not `DEFINER`) is the recommended choice.** The function only needs the calling user's own privileges — it operates entirely within the existing, already-correct `user_districts` RLS policies (`auth.uid() = user_id` for SELECT/INSERT/DELETE). `SECURITY DEFINER` would run with the function owner's likely-elevated privileges, bypassing RLS unnecessarily — a larger, avoidable privilege expansion for no benefit here, since RLS already permits exactly this operation for the authenticated user.
- **`search_path` safety:** the function definition must include `SET search_path = public, pg_temp` (or equivalent) to prevent search-path-hijacking, standard practice for any `SECURITY DEFINER` function and good hygiene regardless of invoker mode.
- **Grants:** `GRANT EXECUTE ON FUNCTION set_city_council_district(uuid) TO authenticated;` only — explicitly not to `anon` or `public`.
- **Architectural implication worth flagging:** with `SECURITY INVOKER` and correct grants, the *client* (using the anon key plus the user's own session JWT) could call this RPC directly — RLS becomes the actual enforcement boundary, the same way `user_districts` INSERT/DELETE already work today from client code (e.g. the onboarding ZIP page already does `supabase.from('user_districts').delete()`/`.insert()` directly from the browser, relying on RLS). This would mean the Next.js API route's role shrinks to: authenticate the request, validate the label, resolve the district live, and call the RPC — it would no longer need the service-role client (`createServiceClient()`) for the mutation step at all, only (optionally) for the pre-flight district-name lookup, which could equally be done with the public anon key since `districts` is already publicly readable. This is a meaningful simplification, not just a detail, and should be decided explicitly in the implementation gate rather than assumed.

## Option B — server-route transaction without an RPC

**Not achievable with the current architecture, stated explicitly rather than glossed over.** `@supabase/supabase-js` has no generic multi-statement client-side transaction API — each `.from(...).delete()`/`.from(...).insert()` call is its own independent HTTP request to PostgREST. PostgREST executes each individual request atomically on its own, but provides no mechanism to bundle two separate REST calls into one client-visible transaction without either a database function (Option A) or a raw SQL/direct-Postgres-connection capability, which this project does not have exposed anywhere in the app layer (no `pg` driver, no direct connection string usage found). Option B is not available.

## Option C — insert-first, delete-old

**Rejected**, per the instruction's own explicit steer. Inserting the new district before deleting the old one would create a window — transient at best, permanent if the subsequent delete then failed — where the user holds **both** City Council District 1 and District 3 simultaneously. For this product specifically, that is a more serious correctness violation than the current delete-first approach's failure mode (temporarily/permanently holding *neither* district): a resident cannot correctly "be" both a District 1 and a District 3 constituent, and showing both districts' candidates simultaneously on a ballot would be actively wrong, not merely incomplete.

## Recommendation

**Option A (RPC)**, specified precisely above, is the recommended architecture — the smallest, narrowly scoped, atomic database operation with explicit authorization boundaries, matching the instruction's own stated preference. **No RPC or schema change was created in this gate** — this is a complete, ready-to-implement specification for a future, separately-approved implementation gate (Gate I30C) to build directly from, not an implementation.

---

# PART E — District 1 onboarding default reconsideration

Reconfirmed unchanged: `src/app/onboarding/zip/page.tsx`'s `ALL_PSL_DISTRICTS` still unconditionally assigns City Council District 1 to every onboarded Port St. Lucie user, regardless of actual address, even though ZIP cannot distinguish District 1 from District 3.

**Recommendation: Option A now, converting to Option B as a hard precondition before Controlled PSL Beta — not an open-ended choice between them.**

- **For continuing Internal Beta** (the current small, trusted, known test-account population): keep the current default (Option A). The population is small and known, the correction flow (Gates I29/I30) already exists for any tester who wants to self-correct, and no real harm has occurred to date.
- **Before any Controlled PSL Beta invitation goes out to a real, geographically diverse population:** this default **must** be resolved — either by removing City Council District 1 from `ALL_PSL_DISTRICTS` and requiring every user to complete a verified District 1/3 step (Option B), or by another explicit, documented, equally rigorous decision. Silently carrying the current default into a broader beta would misrepresent the majority of non-District-1 residents' ballots and Current Officials, exactly as already found in Gate I28/I30.
- This is **not implemented in this gate** — no change was made to `ALL_PSL_DISTRICTS`. It remains a required decision for whichever future gate scopes Controlled PSL Beta readiness, not Gate I30B, I30C, or I31.

---

# PART F — Minimum remaining path to Gate I31

Both blockers now have concrete, fully-specified, ready-to-approve solutions (Parts A-D). No further research or design gate is needed before implementation. Recommended minimum sequence, matching the structure already proposed:

**Gate I30C — Scoped blocker implementation** (after explicit approval of both the Part C row and the Part D RPC design):
- Insert the verified District 3 `current_officials` row (Part C's exact draft, or an explicitly approved variant).
- Implement the approved RPC (Part D, Option A) and update the route to call it.
- Keep `ENABLE_CITY_COUNCIL_DISTRICT_WRITE` false throughout implementation.
- Build, static/negative-path verification, commit, push.

**Gate I31 — Scoped test-account write** (only after: a named test account is supplied, a verified target district is supplied, pre-state is captured, explicit live-write approval is given, and a rollback plan is defined) — proceeds only once Gate I30C is complete and separately, explicitly approved for a live write.

No additional gate is recommended beyond this two-gate sequence.

---

## No-write boundaries (confirmed for this gate)

- No `current_officials` row was inserted, updated, or deleted.
- No schema, function, RPC, RLS, or grant was created or changed.
- No production `user_districts` write occurred.
- `ENABLE_CITY_COUNCIL_DISTRICT_WRITE` remains `false` — not touched.
- `ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE` remains `false` — not touched.
- `src/app/onboarding/zip/page.tsx` was not modified.
- No deployment occurred.

## Outcome

**PASS — both blockers have concrete, ready-to-approve solutions.**

- Blocker 1 (District 3 Current Official): fully verified via two independent official sources; an exact, precedent-matching draft row is ready for explicit write approval.
- Blocker 2 (atomicity): a complete, specific, security-reviewed RPC design (Option A) is ready for implementation approval; Options B and C were evaluated and correctly ruled out with explicit reasoning.

Neither solution is implemented in this gate — both require separate, explicit approval before Gate I30C proceeds.
