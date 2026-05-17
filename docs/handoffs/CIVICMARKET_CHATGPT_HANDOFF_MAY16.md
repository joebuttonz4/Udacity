# CivicMarket ChatGPT Handoff

Last updated: May 16, 2026

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

Expected likely status right now:

```text
On branch master
Untracked files:
  src/app/admin/entry/page.tsx
```

Reason: the admin voting-record entry page was built and browser-tested, but it was intentionally not committed yet because we paused to verify the inserted test row.

## Latest confirmed commits

Latest confirmed clean commit before the admin entry work:

```text
5a7a774 Document Data Sources page
b81e8ef Add static Data Sources page
4cbe8a3 Document Report Inaccuracy shell
6c63b51 Add UI-only Report Inaccuracy shell at /report
302b3bc Update docs: mark Profile screen complete, pivot sprint to Report Inaccuracy
bfe11ac Add read-only Profile screen at /profile
a8443e6 Update docs: mark Vote screen complete, pivot sprint to Profile screen
bebed21 Add read-only Vote screen with official links and upcoming elections
0234ef1 Update docs: mark ballot integration complete, pivot sprint to Vote screen
183b070 Wire /ballot to link to /measures/[id] via getMeasuresForDistricts
```

## Current app state

Routes completed and committed:

- `/`
  - Read-only Home screen.
  - Commit: `48b81f3`
- `/ballot`
  - Read-only ballot screen.
  - Candidate cards link to `/candidates/[id]`.
  - Measure cards now link to `/measures/[id]` when `ballot_measures` rows exist.
  - Ballot integration commit: `183b070`
- `/candidates/[id]`
  - Read-only Candidate Profile.
  - Candidate source URLs guarded with safe URL logic.
- `/measures/[id]`
  - Read-only Measure Profile.
  - Commit: `c84c331`
  - Uses `src/lib/measures.ts`.
- `/vote`
  - Read-only safe Vote screen.
  - Uses official government links only.
  - No Edge Functions or external API lookups.
  - Commit: `bebed21`
- `/profile`
  - Read-only Profile screen.
  - Reads `profiles` and latest `civic_dna`.
  - Commit: `bfe11ac`
- `/report`
  - UI-only Report Inaccuracy shell.
  - No writes, no SQL, no tables, no policies.
  - Submission shows beta message that nothing was recorded.
  - Commit: `6c63b51`
- `/data-sources`
  - Static methodology page.
  - Auth-gated.
  - No Supabase reads beyond auth.
  - Commit: `b81e8ef`

## In-progress work: minimal admin voting-record entry

This is the active unfinished step.

### What was inspected

Claude inspected:

- `docs/ACTIVE_SPRINT.md`
- `CIVICMARKET_CURRENT_STATE.md`
- `docs/DECISIONS.md`
- `Files/civicmarket_schema_v4.sql`
- `Files/CIVICMARKET_WEEK3_HANDOFF_v3.md`
- `src/lib/candidates.ts`
- `src/app/candidates/[id]/page.tsx`
- `src/lib/supabase.ts`
- `src/app/admin/**/*` glob

### Key finding

`voting_records` had RLS enabled and only a public SELECT policy. There was no INSERT policy, so browser inserts would fail even for admin users.

### Manual Supabase no-change checks already run

Check 1:

```sql
SELECT policyname, cmd
FROM pg_policies
WHERE tablename = 'voting_records';
```

Result before policy:

```text
Voting records are publicly readable | SELECT
```

Check 2:

```sql
SELECT id, is_admin
FROM profiles
WHERE is_admin = true;
```

Result:

```text
f1fde6f9-07c3-4c76-ae81-ebb2f461a5c3 | true
```

Check 3:

```sql
SELECT id, name, office
FROM candidates
WHERE archived_at IS NULL
ORDER BY name;
```

Result included 8 active dummy candidates:

```text
Angela Torres   | FL House District 85
Carlos Reyes    | School Board District 1
David Okafor    | City Council District 1
James Whitfield | FL Senate District 27
Linda Marsh     | School Board District 1
Maria Santos    | City Council District 1
Patricia Nguyen | County Commission At-Large
Robert Chambers | County Commission At-Large
```

### Manual Supabase policy change already made

The user manually ran this SQL in Supabase SQL Editor:

```sql
CREATE POLICY "Admins can insert voting records" ON voting_records
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM profiles
      WHERE id = auth.uid()
        AND is_admin = true
    )
  );
```

Verification query:

```sql
SELECT policyname, cmd
FROM pg_policies
WHERE tablename = 'voting_records'
ORDER BY cmd, policyname;
```

Verified result:

```text
Admins can insert voting records     | INSERT
Voting records are publicly readable | SELECT
```

### Admin entry page built but not committed yet

Claude created:

```text
src/app/admin/entry/page.tsx
```

Summary from Claude:

- New file only.
- No existing files touched.
- `npm run lint`: 0 errors.
- `npm run build`: clean, 17 routes.
- Auth gate:
  - `supabase.auth.getSession()`
  - redirects non-session users to `/`
- Admin gate:
  - reads `profiles.is_admin`
  - redirects non-admin users to `/`
- Loads active candidates:
  - `candidates`
  - `archived_at IS NULL`
  - ordered by name
- Form fields:
  - candidate select
  - issue title
  - issue description
  - optional bill number
  - vote date
  - vote cast: for / against / abstain
  - dimension: seven Civic DNA locked keys
  - source URL
- Validates source URL starts with `http://` or `https://`.
- Inserts into `voting_records`.
- Shows success and error states.
- Includes admin-only dummy-data disclaimer.
- Tailwind only, no `style=` attributes.

### Browser test already performed

The user reset/logged into the admin account:

```text
joebuttonz4@gmail.com
```

The admin route loaded:

```text
http://localhost:3000/admin/entry
```

A test record was submitted successfully.

Browser showed:

```text
Record saved
TEST ONLY - Admin voting record entry
```

### Immediate next step in next ChatGPT session

Do not commit yet until this database verification is completed.

Run this in Supabase SQL Editor:

```sql
SELECT
  vr.id,
  c.name AS candidate_name,
  vr.issue_title,
  vr.bill_number,
  vr.vote_date,
  vr.vote_cast,
  vr.dimension,
  vr.source_url
FROM voting_records vr
JOIN candidates c ON c.id = vr.candidate_id
WHERE vr.issue_title ILIKE 'TEST ONLY%'
ORDER BY vr.created_at DESC;
```

Expected: one row for:

```text
TEST ONLY - Admin voting record entry
```

After verification, decide whether to keep the test row temporarily and document it, or delete it only with exact user approval.

## Important caution about the test row

Do not delete the test row without exact approval.

If the user approves deletion, first show the exact row ID from the verification query, then run a scoped delete like:

```sql
DELETE FROM voting_records
WHERE id = '<exact-row-id-from-verification>'
  AND issue_title ILIKE 'TEST ONLY%';
```

Then verify:

```sql
SELECT id, issue_title
FROM voting_records
WHERE issue_title ILIKE 'TEST ONLY%';
```

## If verification passes and user wants to commit

After verification, run in PowerShell:

```powershell
cd J:\CivicMarket
git status
git diff -- src\app\admin\entry\page.tsx
git add src\app\admin\entry\page.tsx
git commit -m "Add admin voting-record entry"
git status
git log --oneline -8
```

Then document the admin entry page and the manual RLS policy:

```text
Update only docs/CHANGELOG.md, docs/ACTIVE_SPRINT.md, and CIVICMARKET_CURRENT_STATE.md to record that the minimal admin voting-record entry page was built and committed. Note that the INSERT-only admin RLS policy was manually added in Supabase SQL Editor and verified. Note that the route is admin-gated, inserts voting_records only, requires official source URL, passed lint and build, and was browser-tested with a TEST ONLY record. Make the next priority minimal admin review removal. Do not edit code, Supabase policies, auth behavior, database schema, seed data, or any other docs. After editing, show the diff and ask before committing.
```

## Current beta blockers still active

Do not invite beta users until all are complete:

- Real PSL candidate data replaces dummy data.
- Voting records have official source URLs.
- Funding rows have official source URLs.
- Legal pages exist.
- Invite code gate works.
- Report Inaccuracy database-backed submission exists or is explicitly deferred for beta.
- Data Sources exists. Done as static methodology page, but needs final data validation before beta.
- Admin can enter voting records. In progress, pending verification and commit.
- Admin can review/remove incorrect data. Not built.
- Email confirmation re-enabled.
- Real data and AI scores are validated.

## Do not build before beta

Do not build:

- Twilio
- Firecrawl
- Gemini automation
- Agents 1, 2, or 3
- Full 5-tab admin
- Campaign portal
- Expo app
- Federal races
- Voter roll matching
- Public launch features
- Edge Functions unless explicitly approved after separate risk check

## Known limits to track

- `getCandidateVotingRecords` is missing `archived_at` filtering.
- `photo_url` is fetched but not rendered.
- Report Inaccuracy is UI-only. No database-backed reporting yet.
- Data Sources is static methodology content. Dynamic source URL aggregation is deferred.
- Measure Profile may not be reachable unless `ballot_measures` rows exist for user districts.
- Test voting record exists unless removed after verification.
- Admin entry route is not linked from the nav, which is intentional for now.
- Admin entry should not be used for real voting records until dummy data is replaced with validated PSL data.

## Working style

Continue one step at a time.

Use explicit PowerShell commands.

Stop after each checkpoint.

Ask for output before continuing.

Do not delete anything without exact approval.

For database/security changes:
- Start with read-only no-change checks.
- State scope, expected result, no-change check, and test plan.
- Apply the smallest possible SQL only after explicit approval.
- Verify policies afterward.
- Document the change.
- Test one path before committing code.
