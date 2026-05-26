# CivicMarket ChatGPT Handoff - May 25, 2026 - Match Score Generation Fixed + Real Data Planning

## Start here

Project path:

```powershell
J:\CivicMarket
```

At the start of the next ChatGPT session, run:

```powershell
cd J:\CivicMarket
git status
git log --oneline -10
```

Expected status:

```text
On branch master
nothing to commit, working tree clean
```

Latest confirmed commits:

```text
9e1ee84 Document automatic match score generation acceptance test
f4e5786 Prevent duplicate match score generation from Strict Mode double-mount
4c4479d Add automatic match score generation after Civic DNA completion
f101ed1 Add May 25 match unlock bug handoff
6efedbc Document match score generation gap as hard beta blocker
1cfea09 Add May 25 onboarding fixes handoff
e02853b Document May 25 onboarding gate and ZIP screen fixes
1d0df4f Fix Enter-submit regression: type="button" on Back, named handleSubmit
```

## Session summary

This session reviewed the CivicMarket project documents, confirmed that match scoring is a core function, found that automatic match score generation had been missed, implemented it, tested it, fixed a duplicate-row issue caused by React Strict Mode in local development, and documented the completed acceptance test.

The session then returned to the next hard beta blocker: replacing dummy PSL data with real validated candidate, voting record, and funding data.

## Important boundary

Do not start any of these without explicit approval:

- Civic feed automation
- Schema changes
- RLS changes
- Grant or policy changes
- Broad browser INSERT policy for `match_scores`
- Public launch features
- Real data deletion or replacement without a read-only plan first

## Files and docs reviewed

Uploaded and reviewed during this work:

- `CLAUDE.md`
- `CIVICMARKET_CURRENT_STATE.md`
- `docs/ACTIVE_SPRINT.md`
- `docs/CHANGELOG.md`
- `docs/DECISIONS.md`
- `CIVICMARKET_CHATGPT_HANDOFF_MAY15.md`
- `CIVICMARKET_CHATGPT_HANDOFF_MAY17_PART2.md`
- `CIVICMARKET_CHATGPT_HANDOFF_MAY17_PART3.md`
- `CIVICMARKET_CHATGPT_HANDOFF_MAY25_CIVIC_FEED.md`
- `CIVICMARKET_CHATGPT_HANDOFF_MAY25_ONBOARDING_FIXES.md`
- `CIVICMARKET_CHATGPT_HANDOFF_MAY25_MATCH_UNLOCK_BUG.md`
- `docs/design/CIVIC_FEED_STRATEGY.md`
- `docs/design/README.md`
- current source snippets for:
  - `src/app/onboarding/quiz/page.tsx`
  - `src/app/onboarding/calculating/page.tsx`
  - `src/lib/dna.ts`
  - `src/lib/candidates.ts`
  - `src/components/ui/MatchScoreRing.tsx`
  - `src/app/ballot/page.tsx`

## What was wrong

The Ballot match ring display path had been fixed earlier, but automatic score generation after Civic DNA completion was missing.

Confirmed chain before the fix:

```text
User completes Civic DNA quiz
-> civic_dna row is created
-> /onboarding/calculating only waits 2.5 seconds
-> redirects to /ballot
-> no match_scores rows are created
-> Ballot rings stay locked unless rows are manually inserted
```

The issue was confirmed because a manual insert into `match_scores` unlocked Ballot rings for `civicmarket.test.01@example.com`.

## Manual unlock verification

For test user:

```text
civicmarket.test.01@example.com
user_id: ec59ea92-470f-447f-8873-ab2dbde52aca
```

Manual `match_scores` rows unlocked these five Ballot rings:

| Candidate | Score |
|---|---:|
| Maria Santos | 65 |
| Linda Marsh | 75 |
| Patricia Nguyen | 71 |
| Angela Torres | 79 |
| James Whitfield | 38 |

These candidates remained locked, which was expected because they had no scored records / `candidate_positions` rows:

| Candidate |
|---|
| David Okafor |
| Carlos Reyes |
| Robert Chambers |

Conclusion: the UI read/display path worked. The missing core function was automatic `match_scores` generation.

## Implementation completed

### Commit 4c4479d

```text
4c4479d Add automatic match score generation after Civic DNA completion
```

Files changed:

- `src/lib/supabase-server.ts`
- `src/app/api/compute-match-scores/route.ts`
- `src/app/onboarding/calculating/page.tsx`

Behavior added:

- `POST /api/compute-match-scores`
- Verifies the user's Supabase session JWT.
- Uses a server-only service-role Supabase client.
- Fetches latest `civic_dna` for the authenticated user.
- Fetches the user's `user_districts`.
- Fetches candidates in those districts.
- Fetches `candidate_positions`.
- Computes integer 0-100 candidate match scores.
- Uses only non-null candidate position dimensions because current dummy data is partial.
- Deletes only existing candidate `match_scores` rows for that user where `candidate_id` is in the recomputed candidate IDs.
- Does not delete measure rows.
- Inserts fresh score rows using `computed_at`.
- Does not compute measure scores.
- Does not change schema/RLS/grants/policies.

`/onboarding/calculating` now calls the API route and waits for both the match computation and the 2.5 second animation before redirecting to `/ballot`.

### Environment update

A new local environment variable was added to `.env.local`:

```env
SUPABASE_SERVICE_ROLE_KEY=...
```

Do not paste this key into chat. Do not commit `.env.local`.

### Commit f4e5786

```text
f4e5786 Prevent duplicate match score generation from Strict Mode double-mount
```

Why this was needed:

Initial visual acceptance test passed, but SQL showed 10 `match_scores` rows for the fresh user: two rows per candidate. The timestamps were only about 0.09 seconds apart.

Likely cause:

React Strict Mode in local development mounted/remounted the calculating page effect, causing two concurrent API calls.

Fix:

- Added a sessionStorage key scoped to the user ID:
  - `match-scores-computing-<userId>`
- The calculating page sets the key before fetch.
- The second effect invocation sees the key and returns early.
- The key is removed in `finally`, so future quiz retakes can recompute.

No schema/RLS/grant/policy changes were made.

## Acceptance test passed

Fresh test user:

```text
civicmarket.test.04@example.com
user_id: 479780fe-e447-4c6e-9462-338841bbaa4b
```

Initial test result:

- Ballot visually unlocked scores automatically.
- SQL showed 10 rows because of duplicate generation.
- Duplicate rows were cleaned for this test user only.

Cleanup SQL used:

```sql
delete from match_scores
where user_id = '479780fe-e447-4c6e-9462-338841bbaa4b'
  and candidate_id is not null;
```

Retest:

- User retook Civic DNA.
- `/onboarding/calculating` generated `match_scores` automatically.
- SQL returned exactly 5 rows, not 10.
- No manual insert was used.
- All five rows had the same `computed_at`.

Verified SQL result:

| Candidate | Office | Score | computed_at |
|---|---|---:|---|
| Maria Santos | City Council District 1 | 70 | 2026-05-25 23:12:00.986+00 |
| Patricia Nguyen | County Commission At-Large | 63 | 2026-05-25 23:12:00.986+00 |
| Angela Torres | FL House District 85 | 42 | 2026-05-25 23:12:00.986+00 |
| James Whitfield | FL Senate District 27 | 38 | 2026-05-25 23:12:00.986+00 |
| Linda Marsh | School Board District 1 | 38 | 2026-05-25 23:12:00.986+00 |

Conclusion:

```text
Automatic match score generation after Civic DNA completion is resolved.
```

### Commit 9e1ee84

```text
9e1ee84 Document automatic match score generation acceptance test
```

Documentation updated:

- `CIVICMARKET_CURRENT_STATE.md`
- `docs/ACTIVE_SPRINT.md`
- `docs/CHANGELOG.md`

The hard beta blocker was marked resolved after acceptance testing passed.

## Tests run by Claude Code

After implementation:

```powershell
npm run lint
npm run build
```

Results:

- Lint passed.
- Build passed.
- Build showed 19 routes.
- `/api/compute-match-scores` appeared as a dynamic server-rendered route, expected for a POST route handler.

After duplicate-prevention fix:

```powershell
npm run lint
npm run build
```

Results:

- Lint passed.
- Build passed.
- 19 routes unchanged.

## Current repo state

Last confirmed:

```text
On branch master
nothing to commit, working tree clean
```

Latest log:

```text
9e1ee84 Document automatic match score generation acceptance test
f4e5786 Prevent duplicate match score generation from Strict Mode double-mount
4c4479d Add automatic match score generation after Civic DNA completion
f101ed1 Add May 25 match unlock bug handoff
6efedbc Document match score generation gap as hard beta blocker
1cfea09 Add May 25 onboarding fixes handoff
e02853b Document May 25 onboarding gate and ZIP screen fixes
1d0df4f Fix Enter-submit regression: type="button" on Back, named handleSubmit
```

## Remaining hard beta blockers

From current project state and active sprint, remaining blockers include:

- Real PSL candidate data replaces dummy data.
- Real voting records with official source URLs replace dummy records.
- Real funding data with source URLs replaces dummy funding rows.
- All real data is validated by admin before beta invitations.
- Legal pages exist.
- Invite code gate works.
- Database-backed Report Inaccuracy submission exists or is explicitly deferred for beta.
- Email confirmation re-enabled.
- `/measures/[id]` smoke test once real measure data exists.
- Claude draft scoring of real voting records still needs to be reviewed/validated before beta.
- Civic feed beta content still needs manual or reviewed feed rows. Automation remains deferred.

## Current data inventory

Read-only SQL inventory was run.

### Row counts

| table_name | row_count |
|---|---:|
| candidates | 8 |
| voting_records | 17 |
| candidate_funding | 8 |
| ballot_measures | 0 |
| measure_dimensions | 0 |
| match_scores | 10 |

### Current candidates

All current candidates should be treated as dummy / placeholder until validated or replaced.

| Candidate | Office | Incumbent | District type |
|---|---|---:|---|
| David Okafor | City Council District 1 | false | city_council |
| Maria Santos | City Council District 1 | true | city_council |
| Patricia Nguyen | County Commission At-Large | true | county |
| Robert Chambers | County Commission At-Large | false | county |
| Carlos Reyes | School Board District 1 | false | school_board |
| Linda Marsh | School Board District 1 | true | school_board |
| Angela Torres | FL House District 85 | true | state |
| James Whitfield | FL Senate District 27 | true | state |

### Voting records

Current voting records:

- 17 rows.
- Tied to five incumbent-style candidates.
- Source URLs are official-looking, but the data itself appears seeded/demo and must be treated as non-beta-safe unless independently validated.

Candidates with voting records:

- Maria Santos
- Patricia Nguyen
- Angela Torres
- James Whitfield
- Linda Marsh

Candidates with zero voting records:

- David Okafor
- Robert Chambers
- Carlos Reyes

### Funding rows

Current funding rows:

- 8 rows, one per dummy candidate.
- Source URL is generic for all rows:
  - `https://dos.myflorida.com/campaign-finance/`
- Treat funding amounts as dummy until validated against candidate-specific official sources.

### Ballot measures

Current:

- `ballot_measures`: 0 rows
- `measure_dimensions`: 0 rows

This means `/measures/[id]` cannot be smoke-tested until real or validated measure data exists.

## Next hard beta blocker

The next hard beta blocker is real PSL data replacement.

Do not replace data yet. Start with read-only dependency discovery and a replacement plan.

Recommended next query:

```sql
select
  c.name,
  c.office,
  count(distinct vr.id) as voting_record_count,
  count(distinct cf.id) as funding_row_count,
  count(distinct cp.id) as candidate_position_count,
  count(distinct ms.id) as match_score_count,
  count(distinct f.id) as follow_count
from candidates c
left join voting_records vr on vr.candidate_id = c.id
left join candidate_funding cf on cf.candidate_id = c.id
left join candidate_positions cp on cp.candidate_id = c.id
left join match_scores ms on ms.candidate_id = c.id
left join follows f on f.candidate_id = c.id
group by c.id, c.name, c.office
order by c.office, c.name;
```

Purpose:

- Identify dependencies before planning replacement.
- Decide between archive-and-insert or direct cleanup-and-reseed.
- Avoid deleting anything without exact approval.

## Recommended next session opening prompt

Use this in the next ChatGPT session:

```text
I'm continuing CivicMarket. Please read CIVICMARKET_CHATGPT_HANDOFF_MAY25_MATCH_SCORE_FIXED_AND_REAL_DATA_PLANNING.md first, then CIVICMARKET_CURRENT_STATE.md, then docs/ACTIVE_SPRINT.md.

The automatic match score generation hard beta blocker is resolved and documented. The next hard beta blocker is replacing dummy PSL candidate, voting record, and funding data with real validated data before beta invitations.

Do not start civic feed automation. Do not change schema/RLS/grants/policies. Do not delete or replace data until we complete read-only dependency discovery and approve a replacement plan.
```

## Final caution

Do not mark beta-ready yet. The app still has dummy data. No beta user should see fake candidate, voting record, funding, or ballot data.
