# CIVICMARKET_CHATGPT_HANDOFF_JUN26_PSL_REAL_DATA_REPLACEMENT_NEXT.md

Date: 2026-06-26
Project path: `J:\CivicMarket`
Branch: `master`
Latest confirmed commit: `88d6dcb Add PSL District 1 candidate detail source inventory`
Working tree after latest user output: clean

## Purpose

Continue CivicMarket from the point where Port St. Lucie District 1 real candidate rows were added and candidate detail/funding source inventory was expanded.

The current hard beta blocker remains:

**Replace dummy PSL candidate, voting record, funding, candidate position, match score, and follow data with real validated data before beta invitations.**

No beta user may see fake candidate, voting record, funding, match score, ballot, or source data.

---

## Current Goal

Replace dummy Port St. Lucie beta candidate data with validated, source-linked real data before any beta user sees fake civic records.

Current pilot scope: Port St. Lucie City Council District 1, 2026.

## Completed So Far

### Real data workspace exists

Folder:

```text
J:\CivicMarket\data\real-psl-replacement
```

Important files:

```text
README.md
candidates_template.csv
voting_records_template.csv
funding_template.csv
candidates_real.csv
voting_records_real.csv
funding_real.csv
sources_inventory.csv
real_data_review_log.md
```

### Validator exists and passes with warnings

Script:

```text
J:\CivicMarket\scripts\validate-real-psl-csvs.cjs
```

Latest validator result from user:

```text
=== CivicMarket Real PSL CSV Validation ===
Data folder: J:\CivicMarket\data\real-psl-replacement

--- candidates ---
Rows: 4
Errors: 0
Warnings: 0

--- voting_records ---
Rows: 0
Errors: 0
Warnings: 1
  WARN: voting_records: header-only file, no real data rows yet

--- funding ---
Rows: 0
Errors: 0
Warnings: 1
  WARN: funding: header-only file, no real data rows yet

=== Summary ===
Total errors: 0
Total warnings: 2
Status: PASS WITH WARNINGS
```

This is expected because only candidate rows have been added so far.

### Candidate rows committed

Commit:

```text
d565584 Add PSL District 1 real candidate rows
```

`candidates_real.csv` contains four real Port St. Lucie City Council District 1 candidate rows:

```text
Eric Reikenis
Indony Baptiste
Kevin Zimmerman
Fredric Meltzer
```

Each candidate currently uses the City of Port St. Lucie Elections page as the official candidate source URL.

### Accepted candidate existence source committed

Commit:

```text
2763fcc Accept PSL District 1 city candidate source
```

Accepted source:

```text
City of Port St. Lucie Elections
```

Accepted for:

```text
candidate existence
race placement
2026 District 1 candidate list
```

Not accepted for:

```text
funding totals
voting records
bios
websites for all candidates
```

### Source inventory expanded

Commit:

```text
88d6dcb Add PSL District 1 candidate detail source inventory
```

The source inventory now includes:

```text
City of Port St. Lucie Elections, accepted
St. Lucie Supervisor of Elections Candidate Profiles, needs_review
Kevin Zimmerman Florida Money Watch Profile, needs_review
St. Lucie Supervisor of Elections Candidate Profiles as funding source, needs_review
Eric Reikenis VoterFocus Candidate Reports, needs_review
Fredric Meltzer VoterFocus Candidate Reports, needs_review
Eric Reikenis Campaign Website, needs_review
Fredric Meltzer Campaign Website, needs_review
```

Important note: the user attempted a typo-only commit after `88d6dcb`, but Git reported `nothing to commit, working tree clean`. So the latest confirmed commit remains `88d6dcb`.

## Current Known Issue To Check First

In recent terminal output, `sources_inventory.csv` still displayed this typo in the Fredric Meltzer row:

```text
Candidate-specific VoterFocusprofile/report page for Fredric Meltzer
```

However, the user later showed a `Select-String` output where the typo appeared fixed:

```text
Candidate-specific VoterFocus profile/report page for Fredric Meltzer
```

Then Git said there was nothing to commit. This means one of two things is true:

1. The typo was already fixed in the committed version, or
2. The terminal output was inconsistent due to command/history paste confusion.

First step in the next chat should be a read-only check:

```powershell
cd J:\CivicMarket

Get-Content .\data\real-psl-replacement\sources_inventory.csv

git status
git log --oneline -5
```

If the typo is present, fix only that typo and commit it. If the typo is not present, continue source review.

## Most Recent Confirmed Git Log

```text
88d6dcb (HEAD -> master) Add PSL District 1 candidate detail source inventory
d565584 Add PSL District 1 real candidate rows
2763fcc Accept PSL District 1 city candidate source
755bdfa Add pilot PSL District 1 source inventory entries
82e7b4d Add real PSL source inventory and review log
```

## Web Research Already Done

Current source facts should be rechecked with web browsing before relying on them in a new chat, because this is current election/campaign finance information.

Previously found:

### City of Port St. Lucie Elections

Supports that 2026 terms expiring include Mayor, District 1, and District 3, and lists District 1 candidates:

```text
Eric Reikenis
Indony Baptiste
Kevin Zimmerman
Fredric Meltzer
```

### St. Lucie Supervisor of Elections Candidate Profiles

Previously found to list District 1 candidates and funding summary amounts:

```text
Indony Jean Baptiste
Status: Active-Qualified
Monetary contributions: $7,899.62
In-kind: $0.00
Expenditures: $0.00

Fredric Meltzer
Status: Active-Qualified
Monetary contributions: $7,921.45
In-kind: $1,900.00
Expenditures: $7,681.46

Eric Vytautas Reikenis
Status: Active-Qualified
Monetary contributions: $10,580.00
In-kind: $0.00
Expenditures: $9,359.92

Kevin Zimmerman
Status: Active-Qualified
Monetary contributions: $6,034.70
In-kind: $0.00
Expenditures: $5,581.72
```

Do not write these to `funding_real.csv` until the source review log says exactly what is accepted and what is limited.

### VoterFocus and Florida Money Watch

Previously found candidate-specific leads:

```text
Eric Reikenis VoterFocus Candidate Reports
Fredric Meltzer VoterFocus Candidate Reports
Kevin Zimmerman Florida Money Watch Profile
```

Use these for source review before funding rows.

## Important Data Rules

Do not use generic campaign finance homepages as final funding proof.

For funding:

```text
Use only Florida Division of Elections or official local campaign finance records.
Candidate-specific source is preferred.
Broad source hub is allowed only as discovery or navigation unless it directly lists candidate totals.
```

For voting records:

```text
Use only official meeting minutes, agenda records, vote records, or legislative records.
Do not use campaign websites, news, social posts, or unofficial summaries for voting records.
```

For bios/websites:

```text
Campaign websites may support optional bio or website fields.
Campaign websites must not support voting records or funding totals.
```

For candidates without records:

```text
Include the candidate.
Leave voting records blank if there is no official voting record.
Leave funding blank if candidate-specific official funding support is not available or not reviewed.
```

## Recommended Next Step

After checking the typo/status, review and accept one source at a time.

Best next source to review:

```text
Fredric Meltzer VoterFocus Candidate Reports
```

Likely decision:

```text
accepted with limits
```

Accepted for:

```text
candidate-specific funding/report discovery
office confirmation
report period totals visible on the official/local campaign finance page
```

Not accepted for:

```text
neighbor donations
PAC/corporate split
institutional percent
```

Reason:

```text
Those fields require transaction-level contribution review, not just profile/report summary totals.
```

## Suggested Review Log Entry Pattern

Append to:

```text
J:\CivicMarket\data\real-psl-replacement\real_data_review_log.md
```

Suggested format:

```markdown
## 2026-06-26: Fredric Meltzer VoterFocus Candidate Reports

Source inventory title: Fredric Meltzer VoterFocus Candidate Reports
Status decision: accepted with limits
Reviewed by: Mike + ChatGPT

Accepted for:
- Candidate-specific campaign finance/report discovery for Fredric Meltzer
- Office confirmation for City of Port St. Lucie City Council District 1
- Visible report-period contribution and expenditure summary values, if transcribed exactly from the official/local campaign finance page

Not accepted for:
- Neighbor donation totals
- PAC/corporate funding split
- Institutional percentage
- Any voting record or issue-position claim

Reasoning:
This is a candidate-specific official/local campaign finance reporting page. It is suitable for confirming that candidate's finance-report source and report availability. It is not by itself sufficient for CivicMarket's richer funding-breakdown fields unless individual contribution transactions are reviewed and categorized.
```

Then update `sources_inventory.csv` only if the source has been reviewed:

```text
status: accepted
notes: Candidate-specific official/local campaign finance page accepted with limits for report discovery, office confirmation, and exact visible summary totals only; transaction-level review still needed for breakdown fields
last_checked: 2026-06-26
```

## Do Not Do Yet

Do not import anything into Supabase.

Do not generate replacement SQL yet.

Do not modify app code.

Do not change schema, RLS, grants, auth, policies, onboarding, district rows, or election rows.

Do not claim beta-ready.

Do not invite beta users.

Do not fill `voting_records_real.csv` from non-official sources.

Do not fill `funding_real.csv` unless source acceptance and limits are recorded first.

## Safe Command Style For Next Chat

User prefers exact, click-by-click or command-by-command instructions.

Use one safe step at a time.

Before risky actions, include a risk check.

For this workflow, prefer:

```powershell
cd J:\CivicMarket

# read-only checks first
Get-Content ...
git status

# then one small edit
# then inspect
# then commit only after inspection
```

## Current Safe Status Summary

```text
Real candidate CSV rows: committed
Source inventory: committed
Validator: PASS WITH WARNINGS
Voting records: empty, expected warning
Funding rows: empty, expected warning
Database: untouched
Working tree: clean
Next action: source review, not data import
```
