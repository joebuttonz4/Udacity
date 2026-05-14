# CivicMarket — Week 2 Handoff
> Paste this entire file at the start of a new chat session.
> It contains everything Claude needs to continue the build without re-explaining the project.

---

## Project Summary

CivicMarket is a non-partisan, mobile-first civic engagement platform matching voters to local candidates based on personal values. Piloting in Port St. Lucie, FL. Solo developer, no prior React experience, Windows machine.

**Beta target:** Mid-July 2026 · 25-50 PSL residents · Invite code gated
**Project location:** `J:\CivicMarket`
**Dev server:** `npm run dev` → `http://localhost:3000`

---

## AI Stack (Locked)

- **Scoring + match rationale:** Claude API (`claude-sonnet-4-5`)
- **Civic feed extraction:** Gemini Flash (post-beta only — not needed now)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| Backend | Supabase (PostgreSQL, Auth, Edge Functions) |
| AI — Scoring | Anthropic Claude API (claude-sonnet-4-5) |
| Email | Resend (free tier) |
| Deployment | Vercel + Supabase |

---

## What Was Completed in Week 1

Every item below is done and verified:

- ✅ Next.js project created at `J:\CivicMarket`
- ✅ Supabase project created: **CivicMarket-MVP** (fresh, us-east-2)
- ✅ `.env.local` configured with real Supabase URL and publishable key
- ✅ `src/lib/supabase.ts` created — Supabase client working
- ✅ `@supabase/supabase-js` installed
- ✅ All 25 tables deployed with RLS enabled
- ✅ `app_settings` table seeded with default values
- ✅ Admin account created — UUID: `f1fde6f9-07c3-4c76-ae81-ebb2f461a5c3`
- ✅ `is_admin = true` confirmed in profiles table
- ✅ Supabase Edge Function secrets added: `SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`
- ✅ `ANTHROPIC_API_KEY` added to `.env.local`
- ✅ `CLAUDE.md` (19 KB) in project root
- ✅ `civicmarket_build_guide.md` (67 KB) in project root
- ✅ `civicmarket_schema_v4.sql` saved to outputs folder

### Schema Fix Applied
The `handle_new_user()` trigger required a permissions fix. This SQL was run and is working:
```sql
ALTER FUNCTION handle_new_user() SECURITY DEFINER SET search_path = public;
ALTER TABLE profiles FORCE ROW LEVEL SECURITY;
```

---

## Current Project File Structure

```
J:\CivicMarket\
├── .next/
├── node_modules/
├── public/
├── src/
│   ├── app/
│   │   ├── favicon.ico
│   │   ├── globals.css
│   │   ├── layout.tsx        (default Next.js boilerplate — not yet customized)
│   │   └── page.tsx          (default Next.js boilerplate — not yet customized)
│   └── lib/
│       └── supabase.ts       ✅ Created
├── .env.local                ✅ Configured
├── .gitignore
├── AGENTS.md
├── civicmarket_build_guide.md  ✅ 67 KB
├── CLAUDE.md                   ✅ 19 KB
├── eslint.config.mjs
├── next-env.d.ts
├── next.config.ts
├── package.json
├── package-lock.json
├── postcss.config.mjs
├── README.md
└── tsconfig.json
```

---

## Database — 25 Tables Deployed

All tables confirmed in Supabase. Key tables for Week 2:

- `districts` — where PSL districts get seeded
- `elections` — where 2026 elections get seeded
- `candidates` — where researcher data goes
- `voting_records` — requires `source_url` on every row (non-negotiable)
- `candidate_funding` — campaign finance data
- `app_settings` — system config (already seeded)

---

## The 7 Civic DNA Dimensions

These keys must be used exactly as written everywhere in code:

| Key | Label |
|---|---|
| `growth_development` | Growth & Development |
| `taxation_spending` | Taxes & Services |
| `education` | Education |
| `environment` | Environment |
| `public_safety` | Public Safety |
| `housing` | Housing |
| `transparency` | Transparency |

**Scale:** -2.0 = strongly opposed · 0 = neutral · +2.0 = strongly supports

---

## Coding Conventions

- Always TypeScript — no `.js` files in `src/`
- Always Tailwind — no inline styles in components
- Supabase client — always import from `src/lib/supabase.ts`
- Supabase queries — always in `src/lib/` helpers, never in page components
- `source_url` required on every `voting_records` row — no exceptions
- Never expose `SERVICE_ROLE_KEY` to the browser

---

## Week 2 Goals

**Goal:** Real PSL candidate data in the database. Claude scoring prompt written and validated against 5 real votes.

### Step 1 — Post researcher job on Upwork

Budget: $400. Timeline: 1 week.

**Job title:** Civic Data Researcher — Local Government Records (Port St. Lucie, FL)

**Job description:**
```
I need a detail-oriented researcher to collect public government data for 6 local
races in Port St. Lucie, FL. All data must come from official government sources only.

RACES:
1. City Council District 1 — Port St. Lucie
2. School Board District 1 — St. Lucie County
3. County Commission At-Large — St. Lucie County
4. FL House District 85
5. FL Senate District 27
6. Any current ballot measure (bond, ordinance, or zoning on the 2026 ballot)

FOR EACH RACE, COLLECT:
A. Candidates — name, office, incumbent status, campaign website
B. Voting records for incumbents — from official public meeting minutes:
   - Bill/item number, plain English description, date, vote cast (for/against/abstain)
   - Source URL required for EVERY row — official government domains only
C. Campaign finance totals — from FL Division of Elections:
   - Total raised, individual donations, PAC/corporate donations
   - Source URL required

DELIVERABLE: Google Sheets with 3 tabs:
- Sheet 1: Candidates
- Sheet 2: Voting Records (source URL every row)
- Sheet 3: Funding

SOURCES:
- PSL City Council minutes: cityofpsl.com/government/city-council
- FL Division of Elections: dos.myflorida.com/elections/candidates
- FL campaign finance: dos.myflorida.com/campaign-finance
- FL Legislature: flsenate.gov and myfloridahouse.gov
- St. Lucie County: stlucieco.gov

Budget: $400. Timeline: 1 week.
```

### Step 2 — Review researcher deliverable

When the Google Sheet arrives, before entering a single row:

1. Open every source URL — verify it resolves to a real government page
2. Spot-check vote descriptions against actual meeting minutes
3. Verify funding totals against FL Division of Elections site
4. Reject any row where source URL doesn't resolve

### Step 3 — Seed districts and elections

Run in Supabase SQL Editor after researcher data is verified:

```sql
INSERT INTO districts (name, type, city, state) VALUES
  ('City Council District 1', 'city_council', 'Port St. Lucie', 'FL'),
  ('School Board District 1', 'school_board', 'Port St. Lucie', 'FL'),
  ('St. Lucie County Commission At-Large', 'county', 'Port St. Lucie', 'FL'),
  ('FL House District 85', 'state', 'Port St. Lucie', 'FL'),
  ('FL Senate District 27', 'state', 'Port St. Lucie', 'FL');
```

Then get the IDs:
```sql
SELECT id, name FROM districts ORDER BY name;
```

Then seed elections (replace UUIDs with real ones from above):
```sql
INSERT INTO elections (name, election_date, district_id) VALUES
  ('PSL City Council D1 2026', '2026-11-03', '[city_council_id]'),
  ('St. Lucie School Board D1 2026', '2026-11-03', '[school_board_id]'),
  ('St. Lucie County Commission 2026', '2026-11-03', '[county_id]'),
  ('FL House District 85 2026', '2026-11-03', '[fl_house_id]'),
  ('FL Senate District 27 2026', '2026-11-03', '[fl_senate_id]');
```

### Step 4 — Build CSV import script with Claude Code

Instead of entering rows manually, use Claude Code to write a script that imports from the researcher's CSV files.

Open terminal in VS Code (`Ctrl + backtick`), navigate to `J:\CivicMarket`, run `claude`, then paste:

```
Read CLAUDE.md and civicmarket_build_guide.md first.

Write a Node.js script at scripts/seed-data.ts that:
1. Reads three CSV files: candidates.csv, voting_records.csv, funding.csv
   from the scripts/ folder
2. Inserts each row into the corresponding Supabase table using the service role key
3. Logs each inserted row and any errors
4. Skips rows where source_url is empty (voting_records and funding require source_url)

Use the Supabase client from src/lib/supabase.ts.
The district and election IDs need to be mapped by name — I will hardcode
the mapping after you write the script.
```

### Step 5 — Export CSVs from Google Sheets

In the researcher's Google Sheet:
- Sheet 1 (Candidates) → File → Download → CSV → save as `candidates.csv`
- Sheet 2 (Voting Records) → same → `voting_records.csv`
- Sheet 3 (Funding) → same → `funding.csv`

Place all three in `J:\CivicMarket\scripts\`

### Step 6 — Run the seed script

```
npx ts-node scripts/seed-data.ts
```

Verify in Supabase SQL Editor:
```sql
-- Must return 0 — no voting records without a source URL
SELECT COUNT(*) - COUNT(source_url) AS missing_source FROM voting_records;
```

### Step 7 — Write and validate the Claude scoring prompt

This is the most important non-code task. The prompt drives every AI draft score shown to beta users.

**Test it manually in claude.ai before wiring to Agent 4.**

Pick 5 real voting records from your researcher data. For each, use this prompt:

**SYSTEM:**
```
You are a non-partisan civic data analyst scoring local government votes for a civic engagement platform. Your job is to assess the real-world policy impact of a vote on a specific civic dimension — not the candidate's stated intent, party affiliation, or public framing.

Scoring rules:
- Score the policy impact, not the rhetoric
- A YES vote on a bill that weakens environmental protections scores NEGATIVE on environment, even if the candidate called it "pro-business efficiency"
- A NO vote on a bill that raises taxes scores POSITIVE on taxation_spending (lower taxes), even if framed as fiscal irresponsibility
- If the vote has no meaningful impact on the dimension, score 0
- Abstentions score 0 unless the abstention itself had a decisive policy consequence

The 7 dimensions and their definitions:
- growth_development: Pro-growth and new development (+) vs. community preservation and slow growth (-)
- taxation_spending: Lower taxes and smaller government (+) vs. higher taxes for more services (-)
- education: Increased public school funding and teacher pay (+) vs. reduced funding or school choice diversion (-)
- environment: Environmental protection and regulation (+) vs. development priority over environment (-)
- public_safety: Increased police/fire funding (+) vs. alternative public safety approaches (-)
- housing: Government mandates for affordable housing (+) vs. market-led development (-)
- transparency: Open government and disclosure requirements (+) vs. reduced disclosure (-)

Always reason step by step before giving your final score.
```

**USER (repeat for each vote):**
```
Score this vote on the [dimension] dimension.

Issue: [issue_title]
Description: [issue_description]
Vote cast: [for/against/abstain]
Bill number: [bill_number or N/A]

Step 1 — What did this vote actually do in policy terms?
Step 2 — Does the policy impact support or oppose [dimension] values?
Step 3 — How strong is the impact? (Minor procedural = closer to 0. Major policy = closer to ±2)

Return JSON only, no other text:
{"score": -2|-1|0|1|2, "rationale": "One plain-English sentence explaining the score from a voter's perspective"}
```

**Validation rule:** If 2 or more of the 5 test votes feel wrong, iterate the prompt before saving it.

### Step 8 — Save the validated prompt

Once validated, save it at `src/lib/agents/scoring-prompt.ts`:

```typescript
// Claude scoring prompt — validated against real PSL votes
// Do not modify without re-validating against at least 5 real votes

export const SCORING_SYSTEM_PROMPT = `[paste your validated system prompt here]`

export const buildScoringUserPrompt = (params: {
  dimension: string
  issueTitle: string
  issueDescription: string
  voteCast: string
  billNumber?: string
}) => `Score this vote on the ${params.dimension} dimension.

Issue: ${params.issueTitle}
Description: ${params.issueDescription}
Vote cast: ${params.voteCast}
Bill number: ${params.billNumber ?? 'N/A'}

Step 1 — What did this vote actually do in policy terms?
Step 2 — Does the policy impact support or oppose ${params.dimension} values?
Step 3 — How strong is the impact? (Minor procedural = closer to 0. Major policy = closer to ±2)

Return JSON only, no other text:
{"score": -2|-1|0|1|2, "rationale": "One plain-English sentence explaining the score from a voter's perspective"}`
```

---

## Week 2 Milestone Checklist

Do not start Week 3 until all are checked:

- [ ] Researcher hired and briefed
- [ ] Researcher data reviewed and spot-checked
- [ ] Districts seeded (5 rows)
- [ ] Elections seeded (5 rows)
- [ ] Candidates seeded from researcher CSV
- [ ] Voting records seeded — zero rows with missing source_url
- [ ] Funding data seeded
- [ ] Claude scoring prompt validated against 5 real PSL votes
- [ ] `src/lib/agents/scoring-prompt.ts` saved with validated prompt

---

## What's Coming in Week 3

Onboarding flow (Steps 0-6) wired to real Supabase data. Built entirely with Claude Code.

---

## How to Use Claude Code

Open terminal in VS Code (`Ctrl + backtick`).

**Directory:** `J:\CivicMarket`

```
claude
```

Always start every Claude Code session with:
```
Read CLAUDE.md and civicmarket_build_guide.md first, then [your task]
```

---

## Reference Files in Project Root

| File | Purpose |
|---|---|
| `CLAUDE.md` | Full project context — Claude Code reads this every session |
| `civicmarket_build_guide.md` | Step-by-step build guide — all 10 weeks |

---

## If You Hit an Error

Paste this at the start of your message:
```
I'm building CivicMarket (Port St. Lucie civic engagement app).
I'm on Week 2 of the build. Here's the error I'm hitting: [describe error]
```

Then paste the exact error message or screenshot.

---

*CivicMarket Week 2 Handoff · Generated May 12, 2026*
*Next session covers: Researcher data → Districts/Elections seeded → CSV import → Claude scoring prompt validated*
