# CivicMarket ChatGPT Handoff - May 25, 2026 - Match Unlock Bug

## Session purpose

This session investigated why completing the Civic DNA quiz for `civicmarket.test.01@example.com` did not unlock candidate match rings on the Ballot screen.

The user explicitly did not want civic feed automation or schema/RLS changes started without approval. This boundary was respected.

## Files and project context used

The session continued from these files:

1. `CIVICMARKET_CHATGPT_HANDOFF_MAY25_ONBOARDING_FIXES.md`
2. `CIVICMARKET_CURRENT_STATE.md`
3. `docs/ACTIVE_SPRINT.md`

Important prior context:

- Onboarding ZIP fixes were already completed and documented.
- The app is currently using dummy PSL data.
- Real PSL candidate, voting record, funding, and ballot data must replace dummy data before beta invitations.
- No beta user may see fake candidate, voting record, funding, or ballot data.
- Civic feed automation remains deferred unless explicitly approved.
- Schema/RLS changes require explicit approval.

## Bug reported

After taking the Civic DNA quiz as:

`civicmarket.test.01@example.com`

The user saw candidate match rings still locked on Ballot.

Screenshots showed:

- Civic DNA appeared complete in Profile.
- Ballot candidate rings remained locked.

## User ID confirmed

The auth user ID for `civicmarket.test.01@example.com` is:

`ec59ea92-470f-447f-8873-ab2dbde52aca`

## SQL checks performed

### 1. Civic DNA exists

Query confirmed two `civic_dna` rows for this user.

Newest row:

- `id`: `d191c4d4-054d-4cf8-84a5-2bd7fb13ad4a`
- `user_id`: `ec59ea92-470f-447f-8873-ab2dbde52aca`
- `growth_development`: `0.00`
- `taxation_spending`: `0.50`
- `education`: `1.50`
- `environment`: `2.00`
- `public_safety`: `1.00`
- `housing`: `0.50`
- `transparency`: `1.00`
- `created_at`: `2026-05-25 20:38:58.6297+00`

Older row:

- `id`: `f65374fa-9f39-45be-a2e5-4ee820eebdeb`
- `created_at`: `2026-05-14 23:29:50.500749+00`

### 2. `match_scores` initially had no rows for the user

Initial query:

```sql
select *
from match_scores
where user_id = 'ec59ea92-470f-447f-8873-ab2dbde52aca';
```

Result:

`Success. No rows returned`

Note: an earlier query failed because `match_scores` has no `created_at` column. It has `computed_at` instead.

### 3. `user_districts` exists

`user_districts` rows exist for the user:

- city district `11111111-0000-0000-0000-000000000001`
- county district `11111111-0000-0000-0000-000000000002`
- county district `11111111-0000-0000-0000-000000000003`
- state district `11111111-0000-0000-0000-000000000004`
- state district `11111111-0000-0000-0000-000000000005`

Conclusion: the issue was not missing DNA or missing districts.

## Code inspected

### `src/app/onboarding/calculating/page.tsx`

The calculating page only plays an animation and redirects after 2.5 seconds:

```tsx
useEffect(() => {
  const timer = setTimeout(() => {
    router.push('/ballot')
  }, 2500)
  return () => clearTimeout(timer)
}, [router])
```

It does not calculate or insert match scores.

### Search across `src`

Search command used:

```powershell
Get-ChildItem -Recurse -File src |
  Select-String -Pattern "match_scores|compute|civic_dna|candidate_positions|measure_dimensions" |
  ForEach-Object {
    "$($_.Path):$($_.LineNumber): $($_.Line.Trim())"
  }
```

Relevant findings:

- `src/app/candidates/[id]/page.tsx` reads from `match_scores`
- `src/lib/candidates.ts` reads from `match_scores`
- `src/app/onboarding/quiz/page.tsx` imports `saveQuizAnswer` and `computeAndSaveDna`
- `src/app/onboarding/quiz/page.tsx` calls `computeAndSaveDna(userId)` on the last quiz answer
- `src/lib/dna.ts` inserts into `civic_dna`
- No code was found that creates `match_scores`

### `src/lib/dna.ts`

`computeAndSaveDna(userId)`:

1. Fetches all 14 `civic_dna_answers`
2. Reverses questions 8-14 at compute time only
3. Averages answers by dimension
4. Inserts into `civic_dna`
5. Updates `profiles.dna_quiz_status = 'completed'`
6. Updates `profiles.dna_quiz_completed_at`

It does not compute candidate positions or match scores.

## Database structure and policy checks

### `match_scores` columns

Columns:

- `id uuid not null`
- `user_id uuid nullable`
- `candidate_id uuid nullable`
- `measure_id uuid nullable`
- `score smallint not null`
- `rationale text nullable`
- `computed_at timestamptz nullable`

### `match_scores` RLS policies

Only one policy exists:

- `Users can read own match scores`
- command: `SELECT`
- roles: `{public}`
- qual: `(auth.uid() = user_id)`

There is no INSERT policy for browser/client code. Therefore, even if browser code tried to insert match scores, RLS would block it unless another server-side or security-definer path is used.

## Candidate position investigation

Initial `candidate_positions` check showed all candidates had null `candidate_positions` values.

A follow-up check showed some candidates had scored voting records, but `candidate_positions` had not been populated yet.

### Voting record coverage before recompute

Accurate voting record counts:

| Candidate | Voting records | Scored records | Scored dimension count |
|---|---:|---:|---:|
| Angela Torres | 3 | 3 | 3 |
| Carlos Reyes | 0 | 0 | 0 |
| David Okafor | 0 | 0 | 0 |
| James Whitfield | 3 | 3 | 3 |
| Linda Marsh | 3 | 3 | 2 |
| Maria Santos | 5 | 5 | 5 |
| Patricia Nguyen | 3 | 3 | 3 |
| Robert Chambers | 0 | 0 | 0 |

### Existing function found

The database has:

`public.recompute_candidate_positions(p_candidate_id uuid)`

Function behavior:

- Counts voting records for the candidate.
- Averages each dimension using `community_score_final` if available, otherwise `ai_draft_score`.
- Upserts into `candidate_positions`.
- Updates:
  - dimension scores
  - `vote_count`
  - `has_dna_score`
  - `data_completeness`
  - `updated_at`

The function is `SECURITY DEFINER`.

## Database write performed

A narrow, approved-by-context database write was performed to populate `candidate_positions` for candidates that already had scored dummy voting records.

SQL run:

```sql
select public.recompute_candidate_positions('33333333-0000-0000-0000-000000000007');
select public.recompute_candidate_positions('33333333-0000-0000-0000-000000000008');
select public.recompute_candidate_positions('33333333-0000-0000-0000-000000000003');
select public.recompute_candidate_positions('33333333-0000-0000-0000-000000000001');
select public.recompute_candidate_positions('33333333-0000-0000-0000-000000000005');
```

No schema changes. No RLS changes. No grant changes. No deletes. No civic feed work.

### `candidate_positions` after recompute

| candidate_id | growth_development | taxation_spending | education | environment | public_safety | housing | transparency | vote_count | has_dna_score | data_completeness |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---|---|
| `33333333-0000-0000-0000-000000000001` | 2.00 | -1.00 | null | 2.00 | null | 1.00 | -2.00 | 5 | true | full |
| `33333333-0000-0000-0000-000000000003` | null | null | 0.50 | null | 2.00 | null | null | 3 | true | partial |
| `33333333-0000-0000-0000-000000000005` | -2.00 | -1.00 | null | 2.00 | null | null | null | 3 | true | partial |
| `33333333-0000-0000-0000-000000000007` | null | null | null | null | 1.00 | 2.00 | 2.00 | 3 | true | partial |
| `33333333-0000-0000-0000-000000000008` | 2.00 | 2.00 | null | -2.00 | null | null | null | 3 | true | partial |

## Match score preview

A read-only preview query calculated candidate match scores for `civicmarket.test.01@example.com` using the newest Civic DNA and populated `candidate_positions`.

The preview averaged only dimensions where the candidate had a non-null position, because dummy candidate data is partial.

Preview results:

| Candidate | Office | Vote count | Data completeness | Preview match score |
|---|---|---:|---|---:|
| Angela Torres | FL House District 85 | 3 | partial | 79 |
| James Whitfield | FL Senate District 27 | 3 | partial | 38 |
| Linda Marsh | School Board District 1 | 3 | partial | 75 |
| Maria Santos | City Council District 1 | 5 | full | 65 |
| Patricia Nguyen | County Commission At-Large | 3 | partial | 71 |

## Limited test `match_scores` insert performed

A narrow test insert was performed for only this one test user:

`ec59ea92-470f-447f-8873-ab2dbde52aca`

This was done to confirm that the Ballot UI can unlock if rows exist.

Inserted rows:

| Candidate | Candidate ID | Score |
|---|---|---:|
| Angela Torres | `33333333-0000-0000-0000-000000000007` | 79 |
| James Whitfield | `33333333-0000-0000-0000-000000000008` | 38 |
| Linda Marsh | `33333333-0000-0000-0000-000000000003` | 75 |
| Maria Santos | `33333333-0000-0000-0000-000000000001` | 65 |
| Patricia Nguyen | `33333333-0000-0000-0000-000000000005` | 71 |

Rationale used:

`Test match score generated from the latest Civic DNA and current dummy candidate position data.`

Verification query confirmed these rows exist in `match_scores`:

| User ID | Candidate | Office | Score | Computed at |
|---|---|---|---:|---|
| `ec59ea92-470f-447f-8873-ab2dbde52aca` | Angela Torres | FL House District 85 | 79 | `2026-05-25 21:02:43.609565+00` |
| `ec59ea92-470f-447f-8873-ab2dbde52aca` | James Whitfield | FL Senate District 27 | 38 | `2026-05-25 21:02:43.609565+00` |
| `ec59ea92-470f-447f-8873-ab2dbde52aca` | Linda Marsh | School Board District 1 | 75 | `2026-05-25 21:02:43.609565+00` |
| `ec59ea92-470f-447f-8873-ab2dbde52aca` | Maria Santos | City Council District 1 | 65 | `2026-05-25 21:02:43.609565+00` |
| `ec59ea92-470f-447f-8873-ab2dbde52aca` | Patricia Nguyen | County Commission At-Large | 71 | `2026-05-25 21:02:43.609565+00` |

## Current status at handoff

The user had not yet confirmed whether refreshing Ballot showed unlocked rings.

Expected Ballot result when logged in as `civicmarket.test.01@example.com`:

- Angela Torres: 79
- James Whitfield: 38
- Linda Marsh: 75
- Maria Santos: 65
- Patricia Nguyen: 71

Expected remaining locked or empty candidates because they have no scored voting records and no `candidate_positions` rows:

- Carlos Reyes
- David Okafor
- Robert Chambers

## Root cause diagnosis

The Civic DNA quiz is working, but the match pipeline is incomplete.

Confirmed chain:

```text
DNA quiz completed
↓
civic_dna row created
↓
/onboarding/calculating only redirects to /ballot
↓
No automatic match score generation runs
↓
match_scores rows are missing unless manually inserted
↓
Ballot rings stay locked
```

Additional blocker:

`match_scores` only has a SELECT RLS policy. Browser/client insert is not currently allowed, and broad INSERT policy should not be added casually.

## Recommended next safest step

First, confirm the manual test worked in the UI:

1. Log in as `civicmarket.test.01@example.com`.
2. Open `/ballot`.
3. Confirm the five expected candidate match rings show:
   - 79
   - 38
   - 75
   - 65
   - 71
4. Confirm candidates without scored records remain locked/empty.

If the five rings show, then the UI display path works and the remaining fix is match generation automation.

## Recommended proper implementation direction

Do not solve this by adding a broad browser-side INSERT policy to `match_scores`.

Safer implementation direction:

1. Create or use a trusted server-side path to compute match scores for the authenticated user after DNA completion.
2. It should:
   - Fetch the latest `civic_dna` row for the user.
   - Fetch candidates in the user’s districts.
   - Fetch `candidate_positions`.
   - Compute score as average of non-null dimension matches.
   - Insert or update `match_scores`.
   - Use `computed_at` instead of `created_at`.
3. It should only write rows for the authenticated user.
4. It should not change schema or RLS unless explicitly approved after a risk check.
5. It should include a smoke test with a fresh test user completing the quiz.

Possible approaches to consider next session:

- Supabase RPC function with `SECURITY DEFINER`, carefully scoped to `auth.uid()`.
- Supabase Edge Function using service role and verifying the caller user.
- A narrow RLS INSERT policy may be considered, but only after explicit approval and risk check. This is less preferred because match score generation should not be broad browser-writeable.

## Risk notes

Database writes already done in this session:

1. Populated `candidate_positions` for five dummy candidates with scored voting records using existing `recompute_candidate_positions`.
2. Inserted five `match_scores` rows for one test user only.

No schema changes were made.

No RLS policies were changed.

No grants were changed.

No rows were deleted.

No civic feed automation was started.

No real PSL data replacement was started.

## Remaining hard beta blockers still apply

From current project docs, still blocked before beta:

- Replace dummy data with real validated PSL candidate data.
- Replace dummy voting records with real voting records and official source URLs.
- Replace dummy funding rows with real funding data and source URLs.
- Legal pages.
- Invite code gate.
- Database-backed Report Inaccuracy submission.
- Email confirmation re-enabled.
- `/measures/[id]` smoke test once measure data exists.
- Proper automatic match score generation after DNA completion.

## Suggested next chat opening prompt

I'm continuing CivicMarket. Please read `CIVICMARKET_CHATGPT_HANDOFF_MAY25_MATCH_UNLOCK_BUG.md` first, then `CIVICMARKET_CURRENT_STATE.md`, then `docs/ACTIVE_SPRINT.md`. The immediate question is whether the manual match-score insert unlocked Ballot rings for `civicmarket.test.01@example.com`. Do not start civic feed automation or schema/RLS changes unless I explicitly approve them.
