# Review Selection

## Purpose

Compact decision matrix for selecting which specialized reviewer(s) — Mission, UX, Data
Integrity, Security, Release Gate — apply to a given change, defined in:

- `docs/agents/MISSION_REVIEWER.md`
- `docs/agents/UX_REVIEWER.md`
- `docs/agents/DATA_INTEGRITY_REVIEWER.md`
- `docs/agents/SECURITY_REVIEWER.md`
- `docs/agents/RELEASE_GATE.md`

This document is **selection guidance only**. It does not authorize implementation or
remediation work by itself.

## Default matrix

| Change type                      | Mission | UX    | Data Integrity | Security | Release Gate |
| --------------------------------- | ------- | ----- | --------------- | -------- | ------------- |
| Styling/layout only               | No      | Yes   | No               | No       | Optional      |
| Navigation/user flow               | Maybe   | Yes   | No               | Maybe    | Yes           |
| Onboarding/profile                 | Yes     | Yes   | Maybe            | Yes      | Yes           |
| Candidate content/evidence         | Yes     | Maybe | Yes              | Maybe    | Yes           |
| Match/scoring logic                | Yes     | Yes   | Yes              | Maybe    | Yes           |
| Election/district/official logic   | Maybe   | Yes   | Yes              | Maybe    | Yes           |
| Supabase query/read logic          | No      | Maybe | Maybe            | Yes      | Yes           |
| Database write logic               | Maybe   | Maybe | Yes              | Yes      | Yes           |
| Auth/admin/API route               | No      | Maybe | Maybe            | Yes      | Yes           |
| RLS/schema/security policy         | No      | No    | Maybe            | Yes      | Yes           |
| Legal/transparency wording         | Yes     | Yes   | Maybe            | Maybe    | Yes           |
| Documentation only                 | Maybe   | Maybe | Maybe            | Maybe    | Optional      |

"Maybe" means: apply the reviewer if the "Mandatory reviewer triggers" section below is
met for this specific change; otherwise it may be skipped. When a "Mandatory reviewer
trigger" applies, it overrides a "No" or "Maybe" in the table above for that reviewer.

## Mandatory reviewer triggers

**Mission is mandatory when:**

- Candidate-facing wording changes
- Scoring rationale changes
- Political/civic interpretation changes
- Recommendation-like language changes
- Transparency labels change

**UX is mandatory when:**

- Visible UI changes
- Navigation changes
- Onboarding changes
- User workflow changes
- Mobile behavior changes

**Data Integrity is mandatory when:**

- Candidate facts change
- Election facts change
- District logic changes
- Official assignment changes
- Voting records/evidence change
- Scoring inputs or candidate positions change

**Security is mandatory when:**

- Auth changes
- API routes change
- Admin functionality changes
- Database access changes
- Environment/secrets handling changes
- Privileged operations change
- User data handling changes

**Release Gate is mandatory for:**

- Any substantial implementation package
- Any package requiring two or more specialized reviewers
- Anything intended for beta or production
- Database write behavior
- Auth/security work
- Scoring changes

## Token-efficiency rules

- Review the diff first.
- Read full files only when needed to understand the diff.
- Do not reread large project documents unless necessary.
- Do not duplicate another reviewer's work.
- Report only actionable findings.
- Separate blockers from enhancements.
- Cite file paths and relevant code locations when possible.
- If no issue exists, say PASS concisely rather than manufacturing recommendations.
