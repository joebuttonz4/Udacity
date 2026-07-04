# Real PSL Replacement Data

Use these templates to collect validated real Port St. Lucie beta data before replacing dummy candidate-specific data.

## Files

- candidates_template.csv
- voting_records_template.csv
- funding_template.csv

## Rules before database replacement

- Do not use fake, guessed, placeholder, campaign-marketing-only, or unsourced data.
- Every candidate must have a validated official source or clearly documented public source.
- Every voting record must have an official source URL.
- Every funding row must have a candidate-specific official campaign finance source URL.
- Voting records must include either ai_draft_score or community_score_final before candidate positions can be recomputed.
- Do not replace districts or elections as part of this candidate-specific replacement plan.
- Do not invite beta users until fake candidate, voting record, funding, match score, and ballot data are gone or safely hidden.

## Source-ready checklist

Before adding a voting record row, confirm:
- candidate name
- office
- issue title
- issue description
- vote date
- vote cast
- civic dimension
- official source URL
- the official source verifies candidate, item, date, description, and vote cast

Before adding a ballot measure row, confirm:
- measure title
- measure type
- election or date
- plain-English summary
- official full text or source URL
- confirmation that the measure is actually on the relevant PSL ballot

## Preserved records for now

- districts
- elections

## Candidate-specific data planned for replacement after validation

- candidates
- voting_records
- candidate_funding
- candidate_positions
- match_scores
- follows
