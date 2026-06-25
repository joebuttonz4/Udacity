# CIVICMARKET_CHATGPT_HANDOFF_MAY25_REAL_DATA_REPLACEMENT_NEXT.md

## Purpose

Continue CivicMarket from the point where automatic match score generation was resolved and candidate-specific real data replacement planning began.

The current hard beta blocker is:

**Replace dummy PSL candidate, voting record, funding, candidate position, match score, and follow data with real validated data before beta invitations.**

No beta user may see fake candidate, voting record, funding, match score, ballot, or source data.

---

## Current repo state

Project path:

```powershell
J:\CivicMarket
```

Latest confirmed git state:

```text
On branch master
nothing to commit, working tree clean
```

Latest commits:

```text
0842a2a Add real PSL replacement working CSV files
6b70b49 Document real PSL replacement data rules
1accc7b Add real PSL replacement data templates
4b0f737 Add May 25 match score completion handoff
9e1ee84 Document automatic match score generation acceptance test
f4e5786 Prevent duplicate match score generation from Strict Mode double-mount
```

Committed replacement workspace:

```text
data\real-psl-replacement\
  candidates_template.csv
  funding_template.csv
  README.md
  voting_records_template.csv
```

The replacement workspace contains header-only templates plus tracked working CSV files: candidates_real.csv, voting_records_real.csv, and funding_real.csv. No real data has been inserted yet.

---

## What was completed in the prior session

### Match score blocker

Automatic match score generation hard beta blocker was already resolved and documented before this session.

### Read-only dependency discovery completed

Read-only checks confirmed current dummy candidate-specific data:

| Table | Count |
|---|---:|
| candidates | 8 |
| voting_records | 17 |
| candidate_funding | 8 |
| candidate_positions | 5 |
| match_scores | 10 |
| follows | 40 |
| districts | 5 |
| elections | 5 |
| user_districts | 25 |
| ballot_measures | 0 |
| measure_dimensions | 0 |

### Candidate-specific data confirmed beta-unsafe

The current dummy candidate set includes:

```text
Maria Santos
David Okafor
Linda Marsh
Carlos Reyes
Patricia Nguyen
Robert Chambers
Angela Torres
James Whitfield
```

Candidate IDs are seeded placeholder UUIDs:

```text
33333333-0000-0000-0000-000000000001 through 33333333-0000-0000-0000-000000000008
```

District IDs are seeded placeholder UUIDs:

```text
11111111-0000-0000-0000-000000000001 through 11111111-0000-0000-0000-000000000005
```

Election IDs are seeded placeholder UUIDs:

```text
22222222-0000-0000-0000-000000000001 through 22222222-0000-0000-0000-000000000005
```

Funding rows all use a generic source URL:

```text
https://dos.myflorida.com/campaign-finance/
```

This is not beta-safe because funding rows need candidate-specific official source URLs.

Voting record URLs look official-looking and pattern-based, but the data is still treated as seeded/demo unless independently validated against official source pages.

### Active code dependency found

Active onboarding code hardcodes district IDs:

```text
src\app\onboarding\zip\page.tsx
```

It uses:

```ts
const ALL_PSL_DISTRICTS = [
  { id: '11111111-0000-0000-0000-000000000001', name: 'City Council District 1', scope: 'city' },
  { id: '11111111-0000-0000-0000-000000000002', name: 'School Board District 1', scope: 'county' },
  { id: '11111111-0000-0000-0000-000000000003', name: 'St. Lucie County Commission At-Large', scope: 'county' },
  { id: '11111111-0000-0000-0000-000000000004', name: 'FL House District 85', scope: 'state' },
  { id: '11111111-0000-0000-0000-000000000005', name: 'FL Senate District 27', scope: 'state' },
]
```

So district replacement is **not approved**. If districts are ever replaced, onboarding code and user_districts need a coordinated patch.

### Candidate helper behavior inspected

`src\lib\candidates.ts` is mostly dynamic after `user_districts` exists:

- Gets user districts from `user_districts`
- Fetches candidates by `.in('district_id', districtIds)`
- Fetches match scores by `user_id` and candidate IDs
- Fetches candidate profile, funding, and voting records by candidate ID
- No hardcoded candidate IDs found in helper

### Match score route inspected

`src\app\api\compute-match-scores\route.ts`:

- Reads current user's `user_districts`
- Fetches active candidates in those districts
- Fetches `candidate_positions`
- Computes match scores for candidates with positions
- Deletes and reinserts match scores only for the current user and current candidate IDs

Implication:

- Once real candidates and real candidate_positions exist, match scores can be regenerated.
- Dummy match scores should not be preserved.

### Admin entry form inspected

`src\app\admin\entry\page.tsx`:

- Loads all active candidates dynamically
- Inserts rows into `voting_records`
- Does not trigger Claude/Agent 4 scoring
- Does not call `recompute_candidate_positions`
- Only validates URL begins with `http://` or `https://`
- Does not verify official government domains or URL resolution

Important: Do not use the admin form for real production/beta voting records until scoring and validation workflow is approved.

### Scoring implementation inventory

Search found no active Agent 4 / Claude scoring implementation in `src`.

No active references found for:

```text
agent-scoring
ANTHROPIC
Claude
recompute_candidate_positions
```

Only `ai_draft_score` display/fetch references exist in `src\lib\candidates.ts`.

### Database function exists

Supabase function exists:

```sql
public.recompute_candidate_positions(p_candidate_id uuid)
```

It:

- Counts voting records for a candidate
- Averages scores by dimension using `COALESCE(community_score_final, ai_draft_score)`
- Upserts into `candidate_positions`
- Sets `vote_count`, `has_dna_score`, `data_completeness`, `updated_at`

Important limitation:

If real voting records are inserted without `ai_draft_score` or `community_score_final`, recompute creates mostly null candidate positions.

### Voting records schema supports scoring

`voting_records` includes:

```text
ai_draft_score
ai_draft_rationale
ai_draft_generated_at
ai_draft_model
community_score_final
community_score_locked_at
```

No schema change needed for scored real voting records.

### Candidate positions defaults confirmed

`candidate_positions` defaults:

```text
community_score_count = 0
has_dna_score = false
data_completeness = 'pulse_only'
voting_weight = 0.70
sentiment_weight = 0.30
```

So `recompute_candidate_positions()` can create rows safely with default weights.

### FK cascade behavior inspected

Deleting a candidate later would cascade to:

```text
candidate_funding
candidate_positions
follows
match_scores
record_watch
reviews
sentiment_scores
voting_records
```

Deleting districts is riskier because it cascades broadly and onboarding hardcodes district IDs.

### Profiles district check

No rows currently use `profiles.district_id`.

---

## Approved plan

The user explicitly approved:

```text
Approve candidate-specific replacement plan
```

Approved scope:

```text
Candidate-specific replacement planning only
```

Protected and not approved:

```text
No district replacement
No election replacement
No schema changes
No RLS changes
No grant changes
No policy changes
No civic feed automation
No new features
No beta-ready claim
```

---

## Replacement plan approved in principle

### Preserve for now

```text
districts
elections
```

Reason:

- Onboarding hardcodes current district IDs.
- District deletion cascades broadly.
- Election rows can be validated/updated later if needed, but not replaced now.

### Candidate-specific data to replace only after real CSV validation

```text
candidates
voting_records
candidate_funding
candidate_positions
match_scores
follows
```

### Real data requirements before any database replacement

Candidates:

```text
name
office
district_name
election_name
is_incumbent
appeared_on_ballot
bio
website
photo_url
official_candidate_source_url
```

Voting records:

```text
candidate_name
office
issue_title
issue_description
bill_number
vote_date
vote_cast
dimension
source_url
ai_draft_score
ai_draft_rationale
ai_draft_model
```

Funding:

```text
candidate_name
office
total_raised
neighbor_donations
pac_corporate_funds
institutional_pct
source_url
updated_at
```

Validation rules:

- No fake, guessed, placeholder, campaign-marketing-only, or unsourced data.
- Every voting record must have an official source URL.
- Every funding row must have a candidate-specific official campaign finance source URL.
- Every voting record must include either `ai_draft_score` or `community_score_final` before recompute.
- Do not replace districts or elections under this plan.
- Do not invite beta users until fake candidate, voting record, funding, match score, and ballot data are gone or safely hidden.

---

## Backup snapshot

A read-only JSON snapshot was captured in chat for:

```text
candidates
voting_records
candidate_funding
candidate_positions
match_scores
follows
```

It was not saved to a repo file. It is available in the prior chat transcript if needed.

---

## Next safest step in new session

Start one step at a time.

First ask the user to run:

```powershell
cd J:\CivicMarket
git status
git log --oneline -8
Get-ChildItem .\data\real-psl-replacement
```

Expected:

```text
On branch master
nothing to commit, working tree clean
```

Expected latest commit:

```text
0842a2a Add real PSL replacement working CSV files
```

Then inspect the CSV templates:

```powershell
Get-Content .\data\real-psl-replacement\README.md
Get-Content .\data\real-psl-replacement\candidates_template.csv
Get-Content .\data\real-psl-replacement\voting_records_template.csv
Get-Content .\data\real-psl-replacement\funding_template.csv
```

Then continue with validating whether real data has been collected.

If the CSVs are still header-only, do not write replacement SQL yet. Help the user collect or prepare real data.

If real CSVs are present later, next steps should be:

1. Validate CSV headers match templates.
2. Validate every required field is present.
3. Validate source URLs are candidate-specific and official where required.
4. Validate district/election names map exactly to preserved records.
5. Build read-only dry-run SQL or script to show proposed inserts and affected dummy rows.
6. Only after user approval, prepare a transaction-based replacement SQL/script.

---

## Hard guardrails for the next session

Do not:

```text
delete data
archive data
replace data
insert real data
change schema
change RLS
change grants
change policies
start civic feed automation
build new features
mark the app beta-ready
invite beta users
```

until the real replacement data is complete, validated, and the user explicitly approves the exact replacement SQL/script.

No beta user may see fake candidate, voting record, funding, match score, ballot, or source data.

---

## Suggested opening prompt for next session

```text
I'm continuing CivicMarket. Please read CIVICMARKET_CHATGPT_HANDOFF_MAY25_REAL_DATA_REPLACEMENT_NEXT.md first.

Automatic match score generation is resolved. Candidate-specific replacement planning is approved, but no database replacement has happened.

The current committed repo state should be clean with latest commit:
0842a2a Add real PSL replacement working CSV files

The next hard beta blocker is filling and validating real PSL candidate, voting record, and funding CSVs in:
data\real-psl-replacement\

Start one step at a time.

First have me run:
cd J:\CivicMarket
git status
git log --oneline -8
Get-ChildItem .\data\real-psl-replacement

Then continue with read-only validation of the replacement templates and whether real data exists.

Do not delete, archive, replace, insert, or modify database rows.
Do not change schema, RLS, grants, or policies.
Do not start civic feed automation.
Do not build new features.
Do not mark the app beta-ready.
No beta user may see fake candidate, voting record, funding, match score, ballot, or source data.
```
