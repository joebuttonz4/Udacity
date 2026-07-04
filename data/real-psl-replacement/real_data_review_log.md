# Real PSL Data Review Log

## Purpose

Track source review decisions before any real candidate, voting record, funding, candidate position, match score, or follow data is imported into Supabase.

## Rules

- No fake, guessed, placeholder, campaign-marketing-only, or unsourced data.
- Every candidate row must have a validated official source or clearly documented public source.
- Every voting record row must have an official source URL.
- Every funding row must have a candidate-specific official campaign finance source URL.
- No database replacement happens until CSVs pass validation and the exact replacement script is approved.
- Districts and elections are preserved for now.

## Review Status Values

- needs_review
- accepted
- rejected
- blocked
- needs_followup

## Pilot Race

Port St. Lucie City Council District 1

## Source Review Entries

### 2026-06-25 - Initial setup

Status: accepted

Created source inventory and review log.

No real data rows have been approved yet.

## Blocked / Open Questions

- Need official candidate source for Port St. Lucie City Council District 1.
- Need candidate-specific funding source.
- Need official voting record sources for incumbents, if applicable.

### 2026-06-25 - Port St. Lucie City Council District 1 candidate source review

Status: accepted

Source reviewed:
https://www.cityofpsl.com/Government/Your-City-Government/Departments/City-Clerk/Elections

Decision:
Accepted for candidate existence and race placement.

What this source supports:
- 2026 Port St. Lucie District 1 race exists.
- District 1 candidates listed by the City:
  - Eric Reikenis
  - Indony Baptiste
  - Kevin Zimmerman
  - Fredric Meltzer

Limits:
- Does not prove campaign finance totals.
- Does not prove voting records.
- Does not provide full candidate bios.
- Does not provide candidate website URLs for all candidates.

## 2026-06-26: Fredric Meltzer VoterFocus Candidate Reports

Source inventory title: Fredric Meltzer VoterFocus Candidate Reports
Status decision: accepted with limits
Reviewed by: Mike + ChatGPT

Accepted for:
- Candidate-specific campaign finance/report discovery for Fredric Meltzer
- Office confirmation for City of Port St. Lucie City Council District 1
- Visible report-period contribution, in-kind, and expenditure summary values, if transcribed exactly from the official/local campaign finance page

Not accepted for:
- Neighbor donation totals
- PAC/corporate funding split
- Institutional percentage
- Any voting record or issue-position claim

Reasoning:
This is a candidate-specific official/local campaign finance reporting page. It is suitable for confirming that candidate's finance-report source and report availability. It is not by itself sufficient for CivicMarket's richer funding-breakdown fields unless individual contribution transactions are reviewed and categorized.


## 2026-06-26: Eric Reikenis VoterFocus Candidate Reports

Source inventory title: Eric Reikenis VoterFocus Candidate Reports
Status decision: accepted with limits
Reviewed by: Mike + ChatGPT

Accepted for:
- Candidate-specific campaign finance/report discovery for Eric Reikenis
- Office confirmation for City of Port St. Lucie City Council District 1
- Visible report-period contribution, in-kind, and expenditure summary values, if transcribed exactly from the official/local campaign finance page

Not accepted for:
- Neighbor donation totals
- PAC/corporate funding split
- Institutional percentage
- Any voting record or issue-position claim

Reasoning:
This is a candidate-specific official/local campaign finance reporting page. It is suitable for confirming that candidate's finance-report source and report availability. It is not by itself sufficient for CivicMarket's richer funding-breakdown fields unless individual contribution transactions are reviewed and categorized.


## 2026-06-26: St. Lucie Supervisor of Elections Candidate Profiles

Source inventory title: St. Lucie Supervisor of Elections Candidate Profiles
Status decision: accepted with limits
Reviewed by: Mike + ChatGPT

Accepted for:
- Official/local candidate profile discovery for Port St. Lucie City Council District 1 candidates
- Candidate status where visible on the official/local profile page
- Candidate-specific report navigation
- Visible monetary contribution, in-kind, and expenditure summary values, if transcribed exactly from the official/local campaign finance page

Not accepted for:
- Neighbor donation totals
- PAC/corporate funding split
- Institutional percentage
- Any voting record or issue-position claim
- Candidate biography fields beyond what is actually shown on the official/local page

Reasoning:
This is an official/local Supervisor of Elections candidate profile and campaign finance navigation source. It is suitable for confirming candidate status, finding candidate-specific reports, and transcribing exact visible summary values. It is not by itself sufficient for CivicMarket's richer funding-breakdown fields unless individual contribution transactions are reviewed and categorized.


## 2026-06-28: Official Port St. Lucie Voting Record Source Set

Source inventory titles:
- City of Port St. Lucie Agendas and Meetings
- PSL Legistar City Council
- PSL-TV20 Granicus Public Meetings Archive
- City Clerk Public Records Requests

Status decision: accepted with limits
Reviewed by: Mike + ChatGPT

Accepted for:
- Official City Council agenda and meeting-record discovery
- Official agenda packet and action agenda review
- Official minutes review where minutes are available
- Official meeting video confirmation where needed
- Public records request path for missing official vote records

Not accepted for:
- Candidate issue-position claims
- Campaign claims
- Third-party or AI-generated meeting summaries
- Voting-record rows without item-specific official source support
- Any row where the vote cast cannot be verified from an official agenda minutes action agenda video or records response

Reasoning:
These are official City of Port St. Lucie records and meeting-access sources. They are suitable for discovering and verifying City Council voting records when an item-specific official source supports the vote description date item and vote cast. Meeting videos may be used to confirm vote details where written minutes or action agendas are incomplete. Public records requests are accepted as an official path to obtain missing records but should not replace item-specific source URLs when online records are available.


## 2026-06-28: PSL District 1 Voting Records No-Data Decision

Source inventory titles reviewed:
- City of Port St. Lucie Elections
- City of Port St. Lucie Agendas and Meetings
- PSL Legistar City Council
- PSL-TV20 Granicus Public Meetings Archive
- City Clerk Public Records Requests

Status decision: no voting rows added yet
Reviewed by: Mike + ChatGPT

Decision:
- Leave voting_records_real.csv header-only for now.

Reasoning:
The current PSL District 1 candidate rows all mark is_incumbent as false. The accepted official voting-record sources are suitable for discovering and verifying City Council votes, but no candidate-specific official vote history has been verified for Eric Reikenis, Indony Baptiste, Kevin Zimmerman, or Fredric Meltzer. CivicMarket should not create voting-record rows unless an official item-specific source confirms the candidate, item, date, description, and vote cast.

Impact:
- No voting records are added for non-incumbent candidates at this stage.
- Candidate position scores and match scores must remain uncomputed or locked until supported voting records or another accepted scoring basis exists.
- This does not block keeping the candidates in candidates_real.csv.
- This does not change summary funding rows.

Deferred:
- If an official source later proves prior Council service or an item-specific vote by one of these candidates, add voting_records_real.csv rows one at a time with exact official source URLs.
- If no such source exists, keep voting records blank and document candidate profiles as having no verified official voting record in the pilot dataset.

## 2026-07-04: Source Scope Expansion — Mayor and City Council District 3

Source inventory titles:
- City of Port St. Lucie Elections
- St. Lucie Supervisor of Elections Candidate Profiles

Status decision: accepted (source-scope expansion only)
Reviewed by: Mike + ChatGPT

Decision:
- The same official City of Port St. Lucie Elections page and St. Lucie Supervisor of Elections candidate profiles page already accepted for the City Council District 1 race are now also accepted as source categories for the Mayor race and the City Council District 3 race.

Reasoning:
CivicMarket is expanding from a single validated race (City Council District 1) to the full confirmed 2026 City of Port St. Lucie municipal race inventory: Mayor, City Council District 1, and City Council District 3. Mayor and City Council seats are citywide voting contexts in Port St. Lucie, even though City Council candidates must reside in their district. The two source categories already reviewed and accepted for District 1 are official, citywide sources and are suitable for the Mayor and District 3 races on the same basis.

Scope:
- This is source-scope expansion only.
- No candidate rows have been added for Mayor or City Council District 3.
- No funding rows have been added for Mayor or City Council District 3.
- No voting records have been added.
- No ballot measures have been added.

Deferred:
- Candidate rows for Mayor and City Council District 3 will be added in a separate, later step, after per-candidate details (incumbency, ballot appearance, official candidate source URL) are confirmed against these accepted sources.

