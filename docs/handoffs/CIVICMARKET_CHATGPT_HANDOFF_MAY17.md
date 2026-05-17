# CivicMarket ChatGPT Handoff

Last updated: May 17, 2026

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

Latest confirmed commit at handoff:

```text
e5d6691 Document admin voting-record removal
```

## Latest confirmed commits

```text
e5d6691 Document admin voting-record removal
31adca9 Add admin voting-record removal
4426b9c Document admin voting-record review
93342f3 Add read-only admin voting-record review
e94af2a Document admin voting-record entry
e24fe14 Add admin voting-record entry
5a7a774 Document Data Sources page
b81e8ef Add static Data Sources page
4cbe8a3 Document Report Inaccuracy shell
6c63b51 Add UI-only Report Inaccuracy shell at /report
```

## Current completed app routes

- `/`
  - Read-only Home screen.
  - Commit: `48b81f3`
- `/ballot`
  - Read-only ballot screen.
  - Candidate cards link to `/candidates/[id]`.
  - Measure cards link to `/measures/[id]` when `ballot_measures` rows exist.
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
- `/admin/entry`
  - Minimal admin voting-record entry form.
  - Admin-gated with `profiles.is_admin = true`.
  - Inserts into `voting_records`.
  - Commit: `e24fe14`
  - Documented in commit `e94af2a`.
- `/admin/records`
  - Admin-gated voting-record review/removal page.
  - Lists `voting_records` joined to `candidates`.
  - Delete is exact row-id only.
  - Two-step UI: Remove -> inline confirmation -> Confirm delete.
  - Cancel path tested.
  - Scored-record guard: if `community_score_count > 0` or `community_score_final` is not null, Remove is disabled and manual review message is shown.
  - Code commit: `31adca9`
  - Docs commit: `e5d6691`

## Admin voting-record entry work completed

Manual Supabase RLS policy added and verified:

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

Verified policies after entry work included:

```text
Admins can insert voting records     | INSERT
Voting records are publicly readable | SELECT
```

Browser test performed with admin account:

```text
joebuttonz4@gmail.com
```

Test row inserted by `/admin/entry`:

```text
id: 5a0e22b2-ed14-430d-995d-a333bb5d2838
issue_title: TEST ONLY - Admin voting record entry
candidate: Angela Torres
```

The test row has since been deleted during removal testing. It should no longer exist.

## Admin voting-record removal work completed

Manual Supabase DELETE RLS policy added and verified:

```sql
CREATE POLICY "Admins can delete voting records"
ON voting_records
FOR DELETE
USING (
  EXISTS (
    SELECT 1
    FROM profiles
    WHERE id = auth.uid()
      AND is_admin = true
  )
);
```

Verified `voting_records` policies after removal work:

```text
Admins can delete voting records | DELETE
Admins can insert voting records | INSERT
Voting records are publicly readable | SELECT
```

Before delete testing, read-only checks confirmed:

```text
TEST ONLY row existed.
ai_draft_score was null.
community_score_final was null.
community_score_count was 0.
linked vote_community_scores count was 0.
Angela Torres candidate_positions returned no rows.
```

Browser test:

```text
/admin/records
Remove -> Cancel: row stayed visible.
Remove -> Confirm delete: row disappeared.
```

Post-delete Supabase verification:

```sql
SELECT id, issue_title
FROM voting_records
WHERE id = '5a0e22b2-ed14-430d-995d-a333bb5d2838';
```

Result:

```text
Success. No rows returned
```

Linked community score verification:

```sql
SELECT COUNT(*) AS linked_community_scores
FROM vote_community_scores
WHERE voting_record_id = '5a0e22b2-ed14-430d-995d-a333bb5d2838';
```

Result:

```text
0
```

Important deletion caveat:

`voting_records` has no soft-delete field. Deletion is permanent hard delete. `vote_community_scores` has cascade risk. For future real rows, if a deleted record has a non-null `ai_draft_score`, `community_score_final`, or related community scores, review whether `candidate_positions` needs recomputation.

## Supabase security patch completed after admin work

This was done manually in Supabase SQL Editor after commit `e5d6691`. It has not yet been documented in project docs.

### Read-only security inspection findings

RLS policies were inspected. Important findings:

- RLS is enabled on all public tables.
- `profiles.is_admin` is not browser-writable.
- `profiles.verification_tier`, `banned_at`, `ban_reason`, and `voter_roll_verified_at` are not browser-writable.
- `profiles` UPDATE is limited by column privileges to onboarding/profile fields.
- `match_scores` has SELECT only.
- `reviews` has SELECT and INSERT only, no UPDATE.
- `voting_records` has SELECT, INSERT admin-only, and DELETE admin-only.
- `civic_dna_answers` has duplicate INSERT and SELECT policies:
  - `Users can insert own answers`
  - `Users can insert own dna answers`
  - `Users can read own answers`
  - `Users can read own dna answers`
  This looks redundant, but not urgent unless future cleanup is approved.

### Security patch 1 applied: revoke structural privileges

Read-only check showed `anon` and `authenticated` had `REFERENCES`, `TRIGGER`, and `TRUNCATE` on all 25 public tables.

This SQL was run:

```sql
REVOKE TRUNCATE, TRIGGER, REFERENCES
ON ALL TABLES IN SCHEMA public
FROM anon, authenticated;
```

Verification query returned:

```text
Success. No rows returned
```

Meaning no remaining `TRUNCATE`, `TRIGGER`, or `REFERENCES` grants for `anon` or `authenticated`.

### Security patch 2 applied: revoke unmatched DML grants

A read-only query showed many `anon` and `authenticated` `INSERT`, `UPDATE`, and `DELETE` grants where no matching RLS policy existed.

This SQL was run:

```sql
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    WITH grants AS (
      SELECT
        table_name,
        grantee,
        privilege_type
      FROM information_schema.role_table_grants
      WHERE table_schema = 'public'
        AND grantee IN ('anon', 'authenticated')
        AND privilege_type IN ('INSERT', 'UPDATE', 'DELETE')
    ),
    policies AS (
      SELECT
        tablename AS table_name,
        cmd AS privilege_type,
        COUNT(*) AS policy_count
      FROM pg_policies
      WHERE schemaname = 'public'
        AND cmd IN ('INSERT', 'UPDATE', 'DELETE')
      GROUP BY tablename, cmd
    )
    SELECT
      g.grantee,
      g.table_name,
      g.privilege_type
    FROM grants g
    LEFT JOIN policies p
      ON p.table_name = g.table_name
     AND p.privilege_type = g.privilege_type
    WHERE COALESCE(p.policy_count, 0) = 0
  LOOP
    EXECUTE format(
      'REVOKE %s ON TABLE public.%I FROM %I',
      r.privilege_type,
      r.table_name,
      r.grantee
    );
  END LOOP;
END $$;
```

Verification query returned:

```text
Success. No rows returned
```

Meaning no remaining `anon` or `authenticated` `INSERT`, `UPDATE`, or `DELETE` grants without matching RLS policies.

## Immediate next step in next ChatGPT session

Document the Supabase security patch.

Start with:

```powershell
cd J:\CivicMarket
git status
git log --oneline -10
```

Expected:

```text
On branch master
nothing to commit, working tree clean
```

Then ask Claude Code:

```text
Read CLAUDE.md first.

Update only these files:
- docs/CHANGELOG.md
- docs/ACTIVE_SPRINT.md
- CIVICMARKET_CURRENT_STATE.md

Document the Supabase security grant patch that was manually applied and verified in Supabase SQL Editor.

Facts to record:
- Manual SQL change 1:
  REVOKE TRUNCATE, TRIGGER, REFERENCES
  ON ALL TABLES IN SCHEMA public
  FROM anon, authenticated;
- Verification after change 1 returned no rows for remaining TRUNCATE/TRIGGER/REFERENCES grants to anon/authenticated.
- Manual SQL change 2:
  A DO block revoked INSERT/UPDATE/DELETE grants from anon/authenticated only where no matching RLS policy existed.
- Verification after change 2 returned no rows for anon/authenticated INSERT/UPDATE/DELETE grants with matching_policy_count = 0.
- No data was deleted.
- No RLS policies were changed during this patch.
- No schema columns or tables were changed.
- RLS remains enabled on all public tables.
- profiles.is_admin was verified not browser-writable.
- match_scores has SELECT only.
- reviews has SELECT and INSERT only, no UPDATE.
- Next priority: run app smoke tests after the grant patch, then continue toward real PSL data replacement.

Do not edit code.
Do not edit Supabase policies.
Do not change auth behavior.
Do not change database schema.
Do not add new files.
Do not commit.

After editing, run:
git diff -- docs/CHANGELOG.md docs/ACTIVE_SPRINT.md CIVICMARKET_CURRENT_STATE.md

Then summarize:
1. Files changed
2. Exact documentation changes
3. Any uncertainty or deferred item
```

After Claude edits, check for encoding artifacts before committing:

```powershell
cd J:\CivicMarket

$files = @(
  "docs\CHANGELOG.md",
  "docs\ACTIVE_SPRINT.md",
  "CIVICMARKET_CURRENT_STATE.md"
)

Select-String -Path $files -Pattern 'ΓÇö|Γ£ô|â€”|â€¦'
git status --short
```

Then review and commit:

```powershell
git diff -- docs\CHANGELOG.md docs\ACTIVE_SPRINT.md CIVICMARKET_CURRENT_STATE.md
git add docs\CHANGELOG.md docs\ACTIVE_SPRINT.md CIVICMARKET_CURRENT_STATE.md
git commit -m "Document Supabase grant security patch"
git status
git log --oneline -8
```

## Smoke tests still needed after security patch

After documenting the security patch, run app smoke tests because grants were changed manually.

Start dev server:

```powershell
cd J:\CivicMarket
npm run dev
```

Test while logged in as admin:

- `/admin/records` loads.
- `/admin/entry` loads.
- `/ballot` loads.
- `/profile` loads.
- `/data-sources` loads.
- `/report` loads.
- Sign out still works if visible in profile.
- Non-admin direct access to `/admin/records` redirects to `/`.

Optional SQL smoke checks:

```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

Expected: all `rowsecurity = true`.

## Current beta blockers still active

Do not invite beta users until all are complete:

- Real PSL candidate data replaces dummy data.
- Voting records have official source URLs.
- Funding rows have official source URLs.
- Legal pages exist.
- Invite code gate works.
- Report Inaccuracy database-backed submission exists or is explicitly deferred for beta.
- Data Sources exists. Done as static methodology page, but needs final data validation before beta.
- Admin can enter voting records. Done.
- Admin can review/remove incorrect voting records. Done.
- Email confirmation re-enabled.
- Real data and AI scores are validated.
- Security grant patch documented and smoke-tested.

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
- Admin entry route is not linked from the nav, intentional for now.
- Admin records route is not linked from the nav, intentional for now.
- Admin voting-record deletion is permanent hard delete. Use only after exact confirmation.
- `civic_dna_answers` has duplicate INSERT/SELECT policies. Not urgent, but worth cleaning later.
- Candidate position recomputation after deleting scored real voting records is not automated.
- Need app smoke testing after manual Supabase grant patch.

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
- Verify policies/grants afterward.
- Document the change.
- Test one app path before committing docs.
