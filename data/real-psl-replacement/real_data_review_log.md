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

