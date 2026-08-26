# CivicMarket — Full Build Guide
## Port St. Lucie Beta Launch · 10 Weeks · Solo Developer

> **How to use this guide**
> Every step includes the exact command or action, which directory to run it in, and what a successful result looks like. Code blocks are ready to copy and paste. When you hit an error, paste the relevant section into a new Claude chat or your active chat for help.
>
> **AI stack:** Claude API (`claude-sonnet-4-5`) for scoring + matching · Gemini Flash for civic feed (post-beta only)
> **Beta target:** Mid-July 2026 · 25-50 PSL residents · Invite code gated
> **Last updated:** May 5, 2026

---

## Before You Start — What You Need

Have these accounts created and ready before Week 1:

| Service | What It's For | Cost | URL |
|---|---|---|---|
| Supabase | Database, auth, edge functions | Free | supabase.com |
| Anthropic | Claude API for scoring | ~$5/mo | console.anthropic.com |
| Vercel | Frontend hosting | Free | vercel.com |
| Resend | Transactional email | Free | resend.com |
| Google Cloud | Civic Info API for district lookup | Free quota | console.cloud.google.com |
| GitHub | Code repository | Free | github.com |

**Do NOT sign up yet for:** Twilio, Firecrawl, Gemini — all deferred post-beta.

---

## Hard Blockers — Do Not Invite Users Until All Are Done

Before a single beta user gets an invite, every item below must be complete:

- [ ] v4 schema deployed (25 tables)
- [ ] Real PSL candidate data seeded
- [ ] Auth working (email + Google OAuth)
- [ ] Invite code gate at signup
- [ ] Terms of Service published
- [ ] Privacy Policy published
- [ ] Corrections Policy published
- [ ] Report Inaccuracy button on all profile pages
- [ ] Data Sources section on all profile pages
- [ ] Voting record entry form working + Agent 4 (Claude scoring) firing
- [ ] Claude scoring prompt validated against 5 real PSL votes
- [ ] Civic feed has minimum 5 manual entries

---

## 10-Week Build Order at a Glance

```
WEEK 1:  Schema deploy → Auth → Environment → Hire researcher
WEEK 2:  Seed real PSL data → Claude scoring prompt validated
WEEK 3:  Onboarding (Steps 0-6) wired to Supabase
WEEK 4:  Ballot screen + Home screen
WEEK 5:  Candidate profile + Measure profile
WEEK 6:  Claude API scoring (agent-scoring) → compute-matches → match scores live
WEEK 7:  Civic feed UI (manual) → Vote screen → Profile screen → Archive
WEEK 8:  Shared components → error handling → Report Inaccuracy + Data Sources
WEEK 9:  Legal docs → invite code gate → mobile testing
WEEK 10: Deploy to Vercel → smoke test → beta invitations
```

---

---

# WEEK 1 — Schema, Auth, Environment

**Goal:** Database deployed with all 25 tables. Auth working. You can log in and query real data.

---

## Day 1 — Install Claude Code

Claude Code is a command-line tool that reads your entire codebase and implements multi-file tasks automatically. It will write the majority of your code going forward.

### Step 1 — Open terminal as administrator

Click **Start** → type `cmd` → right-click **Command Prompt** → click **Run as administrator**

### Step 2 — Install Claude Code

**Directory:** Anywhere (this is a global install)

```
npm install -g @anthropic/claude-code
```

**Successful output looks like:**
```
added 1 package, and audited 1 package in 3s
found 0 vulnerabilities
```

### Step 3 — Verify installation

**Directory:** Anywhere

```
claude --version
```

**Successful output looks like:**
```
claude-code/1.x.x
```

### Step 4 — Authenticate Claude Code

**Directory:** Anywhere

```
claude
```

This opens a browser window. Log in with your Anthropic account (same account as claude.ai). Come back to the terminal once authenticated.

**Successful output looks like:**
```
✓ Logged in as your@email.com
```

---

## Day 1 — Initialize Your Next.js Project

### Step 5 — Navigate to your drive

**Directory:** Start in C:\\ or wherever you want the project

```
J:
```

Then:

```
cd \
```

### Step 6 — Create the Next.js project

**Directory:** `J:\`

```
npx create-next-app@latest civicmarket --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
```

When prompted, press **Enter** to accept all defaults.

**Successful output looks like:**
```
✓ Would you like to use TypeScript? Yes
✓ Would you like to use ESLint? Yes
✓ Would you like to use Tailwind CSS? Yes
✓ Would you like to use `src/` directory? Yes
✓ Would you like to use App Router? Yes
✓ Would you like to customize the import alias? No
Creating a new Next.js app in J:\civicmarket.
...
Success! Created civicmarket at J:\civicmarket
```

### Step 7 — Move into the project folder

**Directory:** `J:\`

```
cd civicmarket
```

### Step 8 — Install Supabase client

**Directory:** `J:\civicmarket`

```
npm install @supabase/supabase-js
```

**Successful output looks like:**
```
added 12 packages, and audited 425 packages in 4s
found 0 vulnerabilities
```

### Step 9 — Verify dev server works

**Directory:** `J:\civicmarket`

```
npm run dev
```

Open your browser and go to `http://localhost:3000`. You should see the default Next.js welcome page.

Press `Ctrl + C` in the terminal to stop the server when done.

---

## Day 1 — Copy CLAUDE.md Into the Project

### Step 10 — Place CLAUDE.md at project root

Copy the `CLAUDE.md` file you downloaded into `J:\civicmarket\`. This file is read automatically by Claude Code every session.

To verify it's in the right place, open File Explorer and confirm this path exists:
```
J:\civicmarket\CLAUDE.md
```

---

## Day 2 — Set Up Supabase

### Step 11 — Create a new Supabase project

1. Go to **supabase.com** and sign in
2. Click **New project**
3. Fill in:
   - **Name:** `CivicMarket-MVP`
   - **Database Password:** Create a strong password — save it somewhere safe
   - **Region:** US East (closest to Port St. Lucie)
4. Click **Create new project**
5. Wait 2-3 minutes for provisioning

**Successful result:** You see the Supabase project dashboard.

### Step 12 — Get your Supabase credentials

In the Supabase dashboard:

1. Click **Settings** (gear icon, bottom left sidebar)
2. Click **API**
3. Find and copy these two values — you'll need them in the next step:
   - **Project URL** — looks like `https://xxxxxxxxxxxx.supabase.co`
   - **Publishable key (anon)** — starts with `eyJ...` (this is your anon key)

> **Note:** Supabase recently renamed "anon key" to "Publishable key." They are the same thing.

---

## Day 2 — Create Environment File

### Step 13 — Create .env.local

Open VS Code. Open the folder `J:\civicmarket`.

Create a new file at `J:\civicmarket\.env.local` and paste this content, replacing the placeholder values with your real credentials from Step 12:

```bash
# Supabase — browser-safe (these CAN be in frontend code)
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-publishable-key-here

# These are added later when you have the keys
# ANTHROPIC_API_KEY=
# GOOGLE_CIVIC_API_KEY=
# RESEND_API_KEY=
```

### Step 14 — Verify .env.local is gitignored

Open `J:\civicmarket\.gitignore` and confirm `.env.local` appears in the list. If it doesn't, add it on its own line.

---

## Day 2 — Create Supabase Client

### Step 15 — Create the lib folder and supabase.ts

In VS Code, create this file at `J:\civicmarket\src\lib\supabase.ts`:

```typescript
// Supabase client — always import from here, never instantiate inline
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

### Step 16 — Test the connection

Open your terminal.

**Directory:** `J:\civicmarket`

```
npm run dev
```

In VS Code, open `J:\civicmarket\src\app\page.tsx` and temporarily replace its contents with:

```typescript
// Temporary connection test — delete this after confirming connection
import { supabase } from '@/lib/supabase'

export default async function Home() {
  const { data, error } = await supabase.from('profiles').select('count')
  return (
    <div>
      {error ? (
        <p>Connection error: {error.message}</p>
      ) : (
        <p>Supabase connected successfully</p>
      )}
    </div>
  )
}
```

Refresh `http://localhost:3000`.

**Successful output:** You'll see "Supabase connected successfully" — even though the profiles table doesn't exist yet, the connection itself worked. If you see a connection error, double-check your `.env.local` values from Step 12.

After confirming, press `Ctrl + C` to stop the dev server. We'll restore `page.tsx` properly later.

---

## Day 3 — Deploy the Database Schema

### Step 17 — Open Supabase SQL Editor

1. In your Supabase dashboard, click **SQL Editor** in the left sidebar
2. Click **New query**

### Step 18 — Deploy the v4 schema

Copy the entire contents of your `civicmarket_schema_v4.sql` file (from your outputs folder). Paste it into the SQL Editor. Click **Run**.

**Successful output:** You see green checkmarks and no red error messages in the results panel.

### Step 19 — Verify all 25 tables were created

In the SQL Editor, click **New query** and run this:

```sql
-- Verify all tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

**Successful output:** You see 25 table names listed, including:
`agent_runs`, `agent_staging`, `app_settings`, `ballot_measures`, `candidates`, `candidate_funding`, `candidate_positions`, `civic_dna`, `civic_dna_answers`, `civic_feed`, `civic_points_events`, `districts`, `elections`, `follows`, `match_scores`, `measure_community_scores`, `measure_dimensions`, `monitored_sources`, `profiles`, `record_watch`, `reviews`, `sentiment_scores`, `trust_scores`, `trust_score_events`, `user_districts`, `vote_community_scores`, `voting_records`

### Step 20 — Verify Row Level Security is enabled

```sql
-- Verify RLS is enabled on all tables
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

**Successful output:** Every row shows `rowsecurity = true`.

### Step 21 — Seed app_settings defaults

```sql
-- These control system behavior — never hardcode these values in code
INSERT INTO app_settings (key, value, description) VALUES
  ('community_score_threshold', '5', 'Verified scores needed to retire AI draft'),
  ('community_score_min_tier', '1', 'Minimum verification tier for threshold'),
  ('dna_nudge_delay_hours', '48', 'Hours after signup before DNA nudge shows'),
  ('election_alert_days_before', '30', 'Days before election for proximity alert'),
  ('election_mode_days_threshold', '60', 'Days before election to switch home screen mode'),
  ('max_community_scores_per_day', 'unlimited', 'Rate limiting — revisit post-beta');
```

---

## Day 4 — Configure Auth

### Step 22 — Enable Email Auth in Supabase

1. In Supabase dashboard, click **Authentication** in the left sidebar
2. Click **Providers**
3. Confirm **Email** is enabled (it is by default)
4. Under Email settings, enable **Confirm email** — this sends a verification email on signup

### Step 23 — Enable Google OAuth

1. Still in **Authentication → Providers**
2. Click **Google**
3. Toggle it **Enabled**
4. You'll need a Google OAuth Client ID and Secret — follow these steps:
   - Go to **console.cloud.google.com**
   - Create a new project named `CivicMarket`
   - Go to **APIs & Services → Credentials**
   - Click **Create Credentials → OAuth Client ID**
   - Application type: **Web application**
   - Name: `CivicMarket`
   - Authorized redirect URIs — add: `https://your-project-ref.supabase.co/auth/v1/callback`
   - Click **Create**
   - Copy the **Client ID** and **Client Secret**
5. Paste them into the Supabase Google provider fields
6. Click **Save**

### Step 24 — Set up Resend for email

1. Go to **resend.com** and create an account
2. Click **API Keys → Create API Key**
3. Name it `CivicMarket`
4. Copy the key (starts with `re_`)
5. Add it to your `.env.local`:

```bash
RESEND_API_KEY=re_your_key_here
```

6. In Supabase dashboard: **Authentication → Email Templates** — you can customize the verification email subject and body here. For now, defaults are fine.

### Step 25 — Create your admin account

1. In Supabase dashboard, click **Authentication → Users**
2. Click **Add user → Create new user**
3. Enter your email and a password
4. Click **Create user**
5. Copy the UUID shown next to your new user

Now in the SQL Editor, set yourself as admin:

```sql
-- Replace the UUID with your actual user UUID from step 5
UPDATE profiles
SET is_admin = true
WHERE id = 'your-user-uuid-here';
```

**Successful output:** `1 row affected`

### Step 26 — Test auth in the app

**Directory:** `J:\civicmarket`

```
npm run dev
```

We'll wire the full auth UI in Week 3. For now, confirm Supabase Auth is reachable by opening the browser console on `http://localhost:3000` — there should be no CORS or auth errors.

---

## Day 5 — Get Anthropic API Key

### Step 27 — Create Anthropic API key

1. Go to **console.anthropic.com**
2. Click **API Keys** in the left sidebar
3. Click **Create Key**
4. Name it `CivicMarket`
5. Copy the key (starts with `sk-ant-`)
6. Add it to your `.env.local`:

```bash
ANTHROPIC_API_KEY=sk-ant-your-key-here
```

> **Important:** This key is server-side only. It goes in Supabase Edge Function secrets, not the browser. Never put it in any `NEXT_PUBLIC_` variable.

### Step 28 — Add server-side secrets to Supabase

These secrets are used by Edge Functions — they never touch the browser.

1. In Supabase dashboard: **Settings → Edge Functions → Secrets**
2. Add each of these one at a time by clicking **Add secret**:

| Secret Name | Value |
|---|---|
| `ANTHROPIC_API_KEY` | Your key from Step 27 |
| `SUPABASE_SERVICE_ROLE_KEY` | From Settings → API → Service role key |

> To find your Service Role key: **Settings → API → Secret (service_role)** — click the eye icon to reveal it.

### Step 29 — Hire your data researcher

Post this job on Upwork this week. Do not wait until Week 2 — you want the data back by end of Week 2.

**Job title:** Civic Data Researcher — Local Government Records (Port St. Lucie, FL)

**Job description to post:**
```
I need a detail-oriented researcher to collect public government data for 6 local races
in Port St. Lucie, FL. All data must come from official government sources only.

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

**Milestone check — Week 1 complete when:**
- [ ] All 25 tables deployed and verified
- [ ] RLS enabled on all tables
- [ ] app_settings seeded
- [ ] Auth working (email + Google OAuth)
- [ ] Your admin account created and `is_admin = true`
- [ ] Anthropic API key in Supabase secrets
- [ ] Researcher hired and briefed

---

---

# WEEK 2 — Seed Real Data + Validate Scoring Prompt

**Goal:** Real PSL candidates in the database. Claude scoring prompt written and tested against real votes.

---

## Day 1-2 — Review Researcher Deliverable

When the researcher delivers their Google Sheet, do this before entering a single row:

### Step 30 — Spot-check voting records

For each voting record row, verify:
1. Open the source URL — does it resolve to a real government page?
2. Does the vote description match what's in the actual minutes?
3. Is the vote cast (for/against/abstain) correct?

Reject any row where the source URL doesn't resolve or the description doesn't match the source. Send it back for correction.

### Step 31 — Spot-check funding data

1. Open the source URL for each candidate's funding row
2. Verify the totals match what's shown on the FL Division of Elections site
3. Confirm the PAC/corporate vs. individual breakdown is correct

---

## Day 2 — Seed Districts and Elections

### Step 32 — Seed districts

In Supabase SQL Editor, run this after confirming the district names match your researcher data:

```sql
-- Seed the 5 PSL districts
INSERT INTO districts (name, type, city, state) VALUES
  ('City Council District 1', 'city_council', 'Port St. Lucie', 'FL'),
  ('School Board District 1', 'school_board', 'Port St. Lucie', 'FL'),
  ('St. Lucie County Commission At-Large', 'county', 'Port St. Lucie', 'FL'),
  ('FL House District 85', 'state', 'Port St. Lucie', 'FL'),
  ('FL Senate District 27', 'state', 'Port St. Lucie', 'FL');
```

### Step 33 — Get the district IDs

```sql
-- Copy these IDs — you need them for the next step
SELECT id, name FROM districts ORDER BY name;
```

Save the output somewhere — you'll paste the district IDs into the elections insert.

### Step 34 — Seed elections

Replace `[district_id_here]` with the actual UUID from Step 33 for each district:

```sql
-- Seed elections — replace district_id values with real UUIDs from Step 33
INSERT INTO elections (name, election_date, district_id) VALUES
  ('PSL City Council D1 2026', '2026-11-03', '[city_council_district_id]'),
  ('St. Lucie School Board D1 2026', '2026-11-03', '[school_board_district_id]'),
  ('St. Lucie County Commission 2026', '2026-11-03', '[county_district_id]'),
  ('FL House District 85 2026', '2026-11-03', '[fl_house_district_id]'),
  ('FL Senate District 27 2026', '2026-11-03', '[fl_senate_district_id]');
```

> **Note:** Confirm the actual 2026 election date for St. Lucie County. Florida general elections are typically the first Tuesday of November. Adjust if different.

---

## Day 3-4 — Seed Candidates, Voting Records, Funding

### Step 35 — Write a CSV import script using Claude Code

Instead of entering rows manually, have Claude Code write a script that reads the researcher's CSV export and bulk-inserts into Supabase.

**In your terminal:**

**Directory:** `J:\civicmarket`

```
claude
```

Then type this prompt to Claude Code:

```
Write a Node.js script at scripts/seed-data.ts that:
1. Reads three CSV files: candidates.csv, voting_records.csv, funding.csv
   (I'll export these from the researcher's Google Sheet)
2. Inserts each row into the corresponding Supabase table using the service role key
3. Logs each inserted row and any errors
4. Skips rows where source_url is empty (voting_records and funding require source_url)

Use the Supabase client from src/lib/supabase.ts.
The district and election IDs need to be mapped by name — hardcode the mapping
using the IDs I'll provide.
```

Claude Code will write the script. Before running it, open the script and add the district/election ID mappings from Steps 33-34.

### Step 36 — Export CSVs from Google Sheets

In the researcher's Google Sheet:
1. Click **Sheet 1 (Candidates)** → **File → Download → CSV** → save as `candidates.csv`
2. Click **Sheet 2 (Voting Records)** → same → save as `voting_records.csv`
3. Click **Sheet 3 (Funding)** → same → save as `funding.csv`

Place all three files in `J:\civicmarket\scripts\`

### Step 37 — Run the seed script

**Directory:** `J:\civicmarket`

```
npx ts-node scripts/seed-data.ts
```

**Successful output looks like:**
```
Inserted candidate: Jane Smith (City Council District 1)
Inserted candidate: John Doe (City Council District 1)
...
Inserted 12 candidates
Inserted 47 voting records
Inserted 12 funding records
Done.
```

### Step 38 — Verify data in Supabase

In the SQL Editor, run each of these to confirm data landed correctly:

```sql
-- Verify candidates
SELECT name, office, is_incumbent FROM candidates ORDER BY office;

-- Verify voting records (every row must have source_url)
SELECT COUNT(*) as total,
       COUNT(source_url) as with_source,
       COUNT(*) - COUNT(source_url) as missing_source
FROM voting_records;
```

**Successful output for second query:** `missing_source` must be 0. If it's not, find and fix those rows before proceeding.

---

## Day 5 — Write and Validate Claude Scoring Prompt

This is the most important non-code task in the entire project. The prompt you write today drives every AI draft score displayed to beta users.

### Step 39 — Test the scoring prompt manually

Open **claude.ai** in your browser. Start a new conversation.

Pick 5 voting records from your researcher data — ideally a mix of:
- A clear YES vote on a pro-environment bill
- A clear NO vote on a tax increase
- A vote where stated intent conflicts with policy impact
- An abstention
- A procedural vote that likely doesn't move any dimension

For each, paste this exact message (replacing the placeholders):

**System context to include at the top of your first message:**
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

**Then for each vote:**
```
Score this vote on the [dimension] dimension.

Issue: [issue_title from your data]
Description: [issue_description from your data]
Vote cast: [for/against/abstain]
Bill number: [bill_number if applicable]

Step 1 — What did this vote actually do in policy terms?
Step 2 — Does the policy impact support or oppose [dimension] values?
Step 3 — How strong is the impact? (Minor procedural = closer to 0. Major policy = closer to ±2)

Return JSON only, no other text:
{"score": -2|-1|0|1|2, "rationale": "One plain-English sentence explaining the score from a voter's perspective"}
```

### Step 40 — Evaluate the results

For each of the 5 votes, ask yourself: **Would a reasonable, non-partisan observer agree with this score?**

If 2 or more feel wrong — the score is too high, too low, or the rationale misses the point — iterate on the prompt before proceeding. Common fixes:
- Add a specific example of the error you're seeing to the scoring rules section
- Clarify the dimension definition that's causing the problem
- Add a rule for the specific edge case

**Do not move to Week 3 until the prompt scores all 5 votes correctly.**

### Step 41 — Save the validated prompt

Once you're satisfied, save the final system prompt and user prompt template in a new file at `J:\civicmarket\src\lib\agents\scoring-prompt.ts`:

```typescript
// Claude scoring prompt — validated against real PSL votes on [today's date]
// Do not modify without re-validating against at least 5 real votes

export const SCORING_SYSTEM_PROMPT = `You are a non-partisan civic data analyst scoring local government votes for a civic engagement platform. Your job is to assess the real-world policy impact of a vote on a specific civic dimension — not the candidate's stated intent, party affiliation, or public framing.

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

Always reason step by step before giving your final score.`

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

**Milestone check — Week 2 complete when:**
- [ ] Researcher data reviewed and spot-checked
- [ ] Districts and elections seeded
- [ ] All candidates, voting records, and funding seeded
- [ ] Zero voting records with missing source_url
- [ ] Claude scoring prompt validated against 5 real PSL votes
- [ ] `scoring-prompt.ts` saved with validated prompt

---

---

# WEEK 3 — Onboarding Flow

**Goal:** A new user can sign up, enter their ZIP, see their district confirmed, and optionally take the DNA quiz — all wired to real Supabase data.

---

## Using Claude Code for Screen Development

From Week 3 onwards, Claude Code writes the screen code. Your job is to review it, test it on mobile, and catch anything broken.

**Standard workflow for every screen:**

**Directory:** `J:\civicmarket`

```
claude
```

Then give Claude Code the task. Always start with:

```
Read CLAUDE.md first, then [your task here]
```

This ensures Claude Code has full project context before writing any code.

---

## Step 42 — Build the Onboarding Flow with Claude Code

**Directory:** `J:\civicmarket`

```
claude
```

Paste this prompt:

```
Read CLAUDE.md first.

Build the full 6-step onboarding flow at src/app/onboarding/page.tsx.

Steps:
0 - Value proposition (static, animated, no data needed)
1 - Account creation (email/password OR Google OAuth via Supabase auth)
2 - ZIP code entry with district lookup via civic-lookup Edge Function
3 - District confirmation showing ballot preview, auto-follow all candidates
4 - DNA teaser with "Take Quiz Now" and "Skip for Now" options
5 - DNA Quiz with all 14 questions from CLAUDE.md, auto-advance on answer
6 - Match calculation loading screen -> redirects to /ballot

Requirements:
- Each step is a separate component within the page
- Progress indicator at top (dots or steps)
- Use Supabase from src/lib/supabase.ts
- All Supabase queries in src/lib/ helpers
- TypeScript, Tailwind only — no inline styles
- Mobile-first — test at 390px width
- Every step needs a loading state and error state
- On Step 3, auto-follow all candidates in user's districts with is_auto_followed: true
- On Step 5 quiz completion, write answers to civic_dna_answers and averages to civic_dna
- Match scores are locked (show lock icon) until quiz complete
- After "Skip for Now" on Step 4, redirect directly to /ballot
```

Claude Code will build this across multiple files. Review each file it creates.

**Test after building — open `http://localhost:3000/onboarding` and verify:**
- [ ] Can complete signup with email
- [ ] ZIP entry calls district lookup
- [ ] Districts show correctly
- [ ] Quiz advances automatically on answer
- [ ] "Skip for Now" lands on /ballot
- [ ] Quiz completion triggers match calculation

---

## Step 43 — Build the civic-lookup Edge Function

The onboarding ZIP lookup calls this Edge Function. Build it with Claude Code.

**Directory:** `J:\civicmarket`

```
claude
```

Paste this prompt:

```
Read CLAUDE.md first.

Build a Supabase Edge Function at supabase/functions/civic-lookup/index.ts

It handles 4 actions via POST request body:

1. lookup_address: takes {action, zip} → calls Google Civic Info API → returns {districts, is_ambiguous}
   If the ZIP spans multiple city council districts, set is_ambiguous: true

2. disambiguate_zip: takes {action, zip, street_name} → resolves districts → returns {districts}

3. polling_locations: takes {action, address} → returns polling location data from Google Civic API

4. registration_check: takes {action, name, address} → returns voter registration status

Use GOOGLE_CIVIC_API_KEY from environment secrets.
Map Google Civic API division OCD-IDs to our districts table by name.
Return proper CORS headers.
TypeScript, Deno runtime.
```

### Step 44 — Deploy the Edge Function

**Directory:** `J:\civicmarket`

```
npx supabase functions deploy civic-lookup
```

**Successful output looks like:**
```
Deploying function civic-lookup...
✓ Function civic-lookup deployed
```

**Milestone check — Week 3 complete when:**
- [ ] All 6 onboarding steps render correctly
- [ ] ZIP lookup works and returns real districts
- [ ] Auto-follow inserts to follows table
- [ ] DNA quiz writes to civic_dna_answers and civic_dna
- [ ] civic-lookup Edge Function deployed

---

---

# WEEK 4 — Ballot Screen + Home Screen

**Goal:** The two most important screens in the app are wired to real data and showing real match scores (or locked rings if quiz not taken).

---

## Step 45 — Build the Ballot Screen

**Directory:** `J:\civicmarket`

```
claude
```

```
Read CLAUDE.md first.

Build the Ballot screen at src/app/ballot/page.tsx

Requirements:
- Fetch from ballot_for_user view joined with match_scores
- Group races by scope: City, County, State (in that order)
- Each candidate card shows:
  - Name, office, incumbent badge if applicable
  - Match score ring (MatchScoreRing component) — locked with 🔒 if no DNA
  - Scope tag (city=teal, county=blue, state=indigo)
  - Tap to go to /candidates/[id]
- Each measure card shows:
  - Title, type badge (bond/ordinance/zoning)
  - Match score ring
  - Tap to go to /measures/[id]
- "Upcoming | Past" toggle — Past shows archived items
- Loading skeleton while data fetches
- Empty state if no ballot found (prompt to complete onboarding)
- Mobile-first at 390px

Match score ring colors:
- >= 70: teal #00C9A7
- 45-69: amber #F59E0B
- < 45: coral #FF6B6B
- No DNA: dashed gray + lock icon
```

## Step 46 — Build the Home Screen

**Directory:** `J:\civicmarket`

```
claude
```

```
Read CLAUDE.md first.

Build the Home screen at src/app/page.tsx

Two modes based on days until next election:
- Read election_mode_days_threshold from app_settings table (default 60)
- ELECTION MODE (< threshold days): Show election countdown hero + top 4 match scores + civic feed below
- FEED MODE (>= threshold days): Show civic feed hero + small election date pill at top + feed items

For both modes:
- Fetch next upcoming election from elections table
- Fetch top 4 match_scores for current user ordered by score desc
- Fetch civic_feed items for user's districts, ordered by generated_at desc, limit 10
- Each feed item shows: title, description, urgency badge, meeting_date, affected dimensions
- Each match score card links to /candidates/[id]
- Bottom navigation: Home, Ballot, Vote, Profile (active tab highlighted)
- Dark top nav section (#0D1117) with teal accent
- Loading states for all data fetches
- If user has no DNA quiz, show nudge banner (dismissable, stores dismissal in profiles.dna_nudge_dismissed_at)
```

**Milestone check — Week 4 complete when:**
- [ ] Ballot screen shows real candidates grouped by scope
- [ ] Match rings show correct colors (or locked if no quiz)
- [ ] Home screen switches correctly between election mode and feed mode
- [ ] Civic feed items display (even if manually entered)
- [ ] Bottom navigation works between all 4 tabs

---

---

# WEEK 5 — Candidate Profile + Measure Profile

**Goal:** The two profile screens show real voting records, funding data, and community scores.

---

## Step 47 — Build the Candidate Profile Screen

**Directory:** `J:\civicmarket`

```
claude
```

```
Read CLAUDE.md first.

Build the Candidate Profile screen at src/app/candidates/[id]/page.tsx

Fetch all data in parallel with Promise.all:
- candidates table (the candidate)
- candidate_positions table (their dimension scores)
- voting_records table (ordered by vote_date desc)
- candidate_funding table
- reviews table (joined with profiles for display_name, civic_level, verification_tier, ordered by helpful_count desc, limit 5)
- match_scores table (for current user + this candidate)

Sections to display:
1. Header — photo, name, office, district, incumbent badge, match score ring
2. Match breakdown — DimensionBar for each of the 7 dimensions showing candidate vs. user
3. Voting record — list of votes with dimension badge, vote cast, ai_draft_score (labeled "AI Draft — Pending Community Review"), rationale
4. Funding transparency — total raised, neighbor donations, PAC/corporate %, source link
5. Community reviews — star rating, body, civic level badge, verification tier badge
6. "Submit Community Score" button — opens bottom sheet with -2 to +2 slider per dimension
7. "Report Inaccuracy" button — opens email link to inaccuracy@civicmarket.app
8. "Data Sources" section — lists all source URLs used for this candidate's data

Requirements:
- Back navigation: router.back() — not hardcoded
- Loading states for all sections
- Error states — no blank screens
- Mobile-first at 390px
- Scope tag in header (city/county/state → teal/blue/indigo)
```

## Step 48 — Build the Measure Profile Screen

**Directory:** `J:\civicmarket`

```
claude
```

```
Read CLAUDE.md first.

Build the Measure Profile screen at src/app/measures/[id]/page.tsx

Two layouts depending on measure type (from ballot_measures.type):

LAYOUT A — bond, ordinance, referendum:
- Header with title, type badge, match score ring
- Plain English summary
- Financial breakdown: total cost, donut chart by category (use recharts), tax impact per household
- Dimension scores (DimensionBar for all 7)
- Community reviews
- "Report Inaccuracy" button
- "Data Sources" section with full_text_url

LAYOUT B — zoning, environmental:
- Header with title, type badge, match score ring
- Plain English summary
- Affected area description (no map needed for beta — just text)
- Dimension scores (DimensionBar for all 7)
- Community reviews
- "Report Inaccuracy" button
- "Data Sources" section with full_text_url

Both layouts:
- Fetch measure, measure_dimensions, reviews, match_scores in parallel
- Loading and error states
- Mobile-first at 390px
```

**Milestone check — Week 5 complete when:**
- [ ] Candidate profile shows real voting records with AI draft scores
- [ ] Funding section shows real data with source link
- [ ] Community reviews display
- [ ] Submit community score button opens correctly
- [ ] Report Inaccuracy button works (opens email)
- [ ] Data Sources section present
- [ ] Measure profile shows correct layout based on type

---

---

# WEEK 6 — Claude API Scoring Pipeline

**Goal:** Enter a voting record in the Admin form → Agent 4 fires → Claude scores it → score appears in the candidate profile.

---

## Step 49 — Build the agent-scoring Edge Function

**Directory:** `J:\civicmarket`

```
claude
```

```
Read CLAUDE.md first.

Build a Supabase Edge Function at supabase/functions/agent-scoring/index.ts

This function is called when a new voting record is saved via the admin entry form.
It calls the Claude API to score the vote and writes the result back to voting_records.

Flow:
1. Receive POST with {voting_record_id}
2. Fetch the voting record from Supabase
3. Build the scoring prompt using SCORING_SYSTEM_PROMPT and buildScoringUserPrompt from src/lib/agents/scoring-prompt.ts
4. Call Anthropic Claude API (claude-sonnet-4-5) with the system + user prompt
5. Parse the JSON response — extract score and rationale
6. Update voting_records row:
   - ai_draft_score = score
   - ai_draft_rationale = rationale
   - ai_draft_generated_at = now()
   - ai_draft_model = 'claude-sonnet-4-5'
7. Call recompute_candidate_positions(candidate_id) database function
8. Return {success: true, score, rationale}

Error handling:
- If Claude returns invalid JSON, retry once
- If score is outside -2 to 2 range, reject and log error
- Log all errors to console (Supabase logs them automatically)

Use ANTHROPIC_API_KEY from Edge Function secrets.
TypeScript, Deno runtime.
```

### Step 50 — Deploy agent-scoring

**Directory:** `J:\civicmarket`

```
npx supabase functions deploy agent-scoring
```

**Successful output looks like:**
```
Deploying function agent-scoring...
✓ Function agent-scoring deployed
```

---

## Step 51 — Build the compute-matches Edge Function

**Directory:** `J:\civicmarket`

```
claude
```

```
Read CLAUDE.md first.

Build a Supabase Edge Function at supabase/functions/compute-matches/index.ts

Called after a user completes the DNA quiz. Computes match scores for all candidates and measures.

Flow:
1. Receive POST with {userId}
2. Fetch user's civic_dna (most recent row)
3. Fetch all candidates for user's districts (via ballot_for_user view)
4. For each candidate:
   a. Fetch their candidate_positions row
   b. For each of the 7 dimensions, compute:
      diff = abs(user_dna[dim] - candidate_positions[dim])
      dim_match = (1 - diff/4) * 100
   c. Final score = round(average of all 7 dim_match values) — integer 0-100
   d. Call Claude API to generate a 2-sentence match rationale
   e. Upsert to match_scores table
5. Do the same for ballot measures (using measure_dimensions)
6. Return {success: true, scoresComputed: count}

Match rationale Claude prompt:
System: "You are a non-partisan civic engagement assistant. Write a concise 2-sentence explanation of why a voter matches or doesn't match with a candidate, based on their values alignment across 7 civic dimensions. Be specific about which dimensions align or diverge. Never mention party affiliation."
User: "User DNA: [json]. Candidate positions: [json]. Match score: [score]%. Write the rationale."

TypeScript, Deno runtime. Use ANTHROPIC_API_KEY from secrets.
```

### Step 52 — Deploy compute-matches

**Directory:** `J:\civicmarket`

```
npx supabase functions deploy compute-matches
```

---

## Step 53 — Build the Admin Voting Record Entry Form

**Directory:** `J:\civicmarket`

```
claude
```

```
Read CLAUDE.md first.

Build the Admin voting record entry form at src/app/admin/entry/page.tsx

This is beta admin only — password protected via is_admin check on profiles.

Form fields:
- Candidate (dropdown — fetch all candidates from DB)
- Issue title (text input)
- Issue description (textarea — this is fed to Claude for scoring)
- Bill number (text input, optional)
- Vote date (date picker)
- Vote cast (select: for / against / abstain)
- Dimension (select — all 7 dimension keys from CLAUDE.md)
- Source URL (text input, required — validate it resolves before accepting)

On submit:
1. Insert row into voting_records
2. Call agent-scoring Edge Function with the new voting_record_id
3. Show loading state while Claude scores
4. Show success with the returned score and rationale
5. Option to enter another record

Auth check: if profiles.is_admin !== true, redirect to /

TypeScript, Tailwind, mobile-friendly.
```

## Step 54 — Build the Admin Review Removal Form

**Directory:** `J:\civicmarket`

```
claude
```

```
Read CLAUDE.md first.

Build the Admin review removal form at src/app/admin/reviews/page.tsx

Shows all flagged reviews (where flag_count > 0 or moderation_status = 'flagged').

For each review:
- Show: reviewer display_name, civic_level, rating, body, flag_count, flag_reasons
- Show which candidate or measure it's for
- Two action buttons: "Remove Review" and "Keep Review"
- Remove: sets moderation_status = 'removed', moderated_at = now(), moderated_by = admin user id
- Keep: sets moderation_status = 'active', resets flag_count to 0

Auth check: is_admin required.
```

### Step 55 — Test the full scoring pipeline end-to-end

1. Go to `http://localhost:3000/admin/entry`
2. Enter a real voting record from your researcher data (pick one you haven't entered yet)
3. Click Submit
4. Wait for Claude to score it (typically 3-8 seconds)
5. Verify the score and rationale appear in the success message
6. Go to the candidate's profile page and verify the new vote appears with the score

**Successful result:** Score is between -2 and 2. Rationale is a clear, plain-English sentence. Vote appears in the candidate profile.

**Milestone check — Week 6 complete when:**
- [ ] agent-scoring deployed and returns valid scores
- [ ] compute-matches deployed
- [ ] Admin entry form saves records and triggers Claude scoring
- [ ] Scores appear on candidate profile pages
- [ ] Admin review removal form works

---

---

# WEEK 7 — Civic Feed UI + Remaining Screens

**Goal:** All remaining screens built. Civic feed shows real manually-entered content.

---

## Step 56 — Manually Enter Civic Feed Content

Before building the feed UI, you need content in the database. Enter at least 5 items directly in Supabase Studio.

### In Supabase Studio:

1. Click **Table Editor** in the left sidebar
2. Click the **civic_feed** table
3. Click **Insert row** for each item
4. Fill in these fields:

```
title: [Headline of the agenda item]
description: [2-3 sentence plain English summary]
source_url: [Link to the agenda document]
meeting_date: [Date of the meeting]
dimensions: {growth_development, environment}  [array of affected dimension keys]
urgency: routine  [or significant or major]
district_id: [UUID of the relevant district]
expires_at: [30 days from today]
```

**Suggested first 5 items to enter:** PSL City Council agenda items from the most recent public meeting. Find them at cityofpsl.com/government/city-council.

---

## Step 57 — Build the Vote Screen

**Directory:** `J:\civicmarket`

```
claude
```

```
Read CLAUDE.md first.

Build the Vote screen at src/app/vote/page.tsx

Three tabs:

TAB 1 — Polling Location:
- Call civic-lookup Edge Function with action: polling_locations
- Show polling place name, address, hours
- Show early voting locations if available
- "Get Directions" button opens Google Maps

TAB 2 — Important Dates:
- Static content for beta — hardcode key FL 2026 election dates:
  - Voter registration deadline
  - Early voting period
  - Election day (November 3, 2026)
- Reminder to check myflorida.com/vote for official updates

TAB 3 — Registration Check:
- Form: first name, last name, date of birth, ZIP code
- Call civic-lookup Edge Function with action: registration_check
- Show registration status result
- Link to FL Division of Elections for official verification

All tabs: loading states, error states, mobile-first.
```

## Step 58 — Build the Profile Screen

**Directory:** `J:\civicmarket`

```
claude
```

```
Read CLAUDE.md first.

Build the Profile screen at src/app/profile/page.tsx

Sections:
1. Header — display_name, civic_level badge (with icon), civic_points, verification_tier dots
2. Civic DNA card — radar or bar chart showing user's 7 dimension scores (use recharts)
   - If no DNA: "Take the DNA Quiz" CTA
3. Following — list of candidates they follow (from follows table joined with candidates)
   - Tap to go to candidate profile
4. My Reviews — list of their submitted reviews
5. Activity — recent civic_points_events (last 10)
6. Settings section:
   - Edit display name
   - Verification tier status and upgrade prompt
   - Sign out button

Civic level display:
- voter (0-99): 🗳️ gray
- pioneer (100-499): 🌱 emerald
- delegate (500-1999): 🏛️ blue
- titan (2000+): ⬡ violet gradient (#7C3AED to #A855F7)

Fetch in parallel: profiles, civic_dna, follows, reviews, civic_points_events.
```

## Step 59 — Build the Archive View

The archive is a toggle inside the Ballot screen (already built in Step 45). Update it now:

**Directory:** `J:\civicmarket`

```
claude
```

```
Read CLAUDE.md first.

Update src/app/ballot/page.tsx to implement the Past toggle.

When "Past" tab is selected:
- Fetch candidates where archived_at IS NOT NULL AND appeared_on_ballot = true
- Join with elections to get election name and date
- Join with match_scores for score display
- Group by election_name
- Show election date in section header
- Same card design as current ballot but with election name shown

When "Upcoming" tab is selected (existing behavior):
- Fetch from ballot_for_user view (current, non-archived races)
```

**Milestone check — Week 7 complete when:**
- [ ] At least 5 civic feed items entered manually in Supabase Studio
- [ ] Vote screen all 3 tabs working
- [ ] Profile screen showing DNA chart, follows, activity
- [ ] Archive toggle shows past elections (empty for now — expected)
- [ ] All 13 screens exist and render without errors

---

---

# WEEK 8 — Shared Components + Error Handling + Transparency Features

**Goal:** Every screen has loading and error states. Report Inaccuracy and Data Sources on all profile pages.

---

## Step 60 — Build Shared Components with Claude Code

**Directory:** `J:\civicmarket`

```
claude
```

```
Read CLAUDE.md first.

Build these 5 shared components in src/components/ui/:

1. MatchScoreRing.tsx
interface MatchScoreRingProps {
  score: number | null  // null = no DNA, show locked state
  size?: 'sm' | 'md' | 'lg'  // sm=48px, md=72px, lg=96px
}
SVG ring. Colors: >=70 → #00C9A7, 45-69 → #F59E0B, <45 → #FF6B6B, null → dashed gray + lock emoji

2. DimensionBar.tsx
interface DimensionBarProps {
  dimension: string       // one of the 7 keys
  candidateScore: number  // -2.0 to 2.0
  userScore?: number      // optional overlay for comparison
  showLabel?: boolean
}
Horizontal bar from -2 to +2. Show user position if provided.

3. CivicLevelBadge.tsx
interface CivicLevelBadgeProps {
  level: 'voter' | 'pioneer' | 'delegate' | 'titan'
  points?: number
  size?: 'sm' | 'md'
}
voter=🗳️ gray, pioneer=🌱 emerald, delegate=🏛️ blue, titan=⬡ violet gradient

4. VerificationBadge.tsx
interface VerificationBadgeProps {
  tier: 0 | 1 | 2
  size?: 'sm' | 'md'
}
tier 0 = outline dot, tier 1 = filled dot, tier 2 = filled dot + checkmark

5. EmptyState.tsx
interface EmptyStateProps {
  icon: string
  title: string
  body: string
  ctaLabel?: string
  ctaHref?: string
  onCta?: () => void
}
Centered, card-style empty state with optional CTA button.

All components: TypeScript, Tailwind only, no inline styles.
```

## Step 61 — Error Handling Pass

**Directory:** `J:\civicmarket`

```
claude
```

```
Read CLAUDE.md first.

Go through every screen file in src/app/ and add proper loading and error states to every Supabase query.

Pattern to follow for every query:
- Loading: show skeleton placeholder (gray animated pulse div matching the shape of the content)
- Error: show a friendly error message with a "Try again" button that retries the fetch
- Empty: use the EmptyState component from src/components/ui/EmptyState.tsx

Screens to update:
- src/app/page.tsx (Home)
- src/app/ballot/page.tsx
- src/app/candidates/[id]/page.tsx
- src/app/measures/[id]/page.tsx
- src/app/vote/page.tsx
- src/app/profile/page.tsx
- src/app/onboarding/page.tsx

No screen should ever show a blank white page under any condition.
```

## Step 62 — Add Report Inaccuracy to All Profile Pages

**Directory:** `J:\civicmarket`

```
claude
```

```
Read CLAUDE.md first.

Add a "Report Inaccuracy" button to:
- src/app/candidates/[id]/page.tsx
- src/app/measures/[id]/page.tsx

The button should:
- Appear near the bottom of the page, above the footer
- Label: "Report an Inaccuracy"
- On tap: open the user's email client with:
  To: inaccuracy@civicmarket.app
  Subject: Inaccuracy Report — [Candidate/Measure Name]
  Body: "I'm reporting a potential inaccuracy on the profile for [name]. [Blank for user to fill in]"
  
Use mailto: link for beta. This is intentionally simple.
```

## Step 63 — Add Data Sources Section to All Profile Pages

**Directory:** `J:\civicmarket`

```
claude
```

```
Read CLAUDE.md first.

Add a "Data Sources" section to:
- src/app/candidates/[id]/page.tsx
- src/app/measures/[id]/page.tsx

For candidates, collect and display:
- All unique source_url values from their voting_records rows
- The source_url from candidate_funding
- Label each link with the domain name (extract from URL)
- Section title: "Data Sources"
- Section subtitle: "All voting records and funding data sourced from official government records."
- Each source is a tappable link (opens in new tab)

For measures:
- The full_text_url from ballot_measures
- Same labeling and subtitle pattern
```

**Milestone check — Week 8 complete when:**
- [ ] All 5 shared components built and rendering correctly
- [ ] Every screen has loading skeleton and error state
- [ ] No screen shows a blank white page under any network condition
- [ ] Report Inaccuracy button on candidate and measure profiles
- [ ] Data Sources section on candidate and measure profiles

---

---

# WEEK 9 — Legal Docs + Invite Code Gate + Mobile Testing

**Goal:** App is legally safe and ready for real users. Invite code blocks unauthorized access.

---

## Step 64 — Generate Legal Documents

### Terms of Service

1. Go to **termly.io** and create a free account
2. Click **Create Policy → Terms of Service**
3. Fill in:
   - Business name: CivicMarket
   - Website: your Vercel URL (get this in Week 10)
   - Email: your contact email
4. Generate the base ToS
5. Download as HTML

Then add these CivicMarket-specific clauses manually (add them to the "Disclaimer" or "Limitation of Liability" section):

```
Data Accuracy: CivicMarket displays publicly available government records. 
We do not guarantee the accuracy, completeness, or timeliness of voting 
records, campaign finance data, or other civic information. All data is 
sourced from official government records and linked to original sources.
Community scores represent user opinions and do not constitute factual claims.
Match scores are algorithmically generated estimates of value alignment and 
should not be interpreted as endorsements.
```

### Privacy Policy

1. Still in Termly: **Create Policy → Privacy Policy**
2. Fill in your information
3. Under "Third Party Services," add each of these:
   - Supabase (database and authentication)
   - Google Civic Information API (district lookup)
   - Anthropic Claude API (AI scoring)
   - Resend (email delivery)
4. Add this data use statement:

```
Location Data: We collect your ZIP code and street address for the sole 
purpose of identifying your voting districts. This information is never 
sold, shared with campaigns or candidates, or used for advertising. 
We do not track your precise location beyond what you provide during signup.
```

### Corrections Policy

Write this one manually — no generator covers it. Create a page at `src/app/corrections/page.tsx`:

```
Our Corrections Policy

CivicMarket is committed to factual accuracy. If you believe any information 
on this platform is incorrect, here is our process:

Step 1 — Submit: Email inaccuracy@civicmarket.app with the specific record 
in question and the correct information with a source.

Step 2 — Acknowledge: We will acknowledge receipt within 48 hours.

Step 3 — Review: We will review the claim against official sources within 7 days.

Step 4 — Decision: We will either correct the record (and note the correction) 
or explain why we believe the existing record is accurate.

Step 5 — Appeal: If you disagree with our decision, you may request a 
secondary review by emailing appeals@civicmarket.app.

What candidates can dispute: Factual voting records, campaign finance totals, 
biographical information.

What candidates cannot dispute: Community scores (these are user opinions), 
match scores (these are algorithmic outputs), or the platform's existence.
```

### Step 65 — Get attorney review

Email a Florida attorney with your three documents. Budget $250.

Search: "Florida internet attorney" or "Florida startup attorney." Many offer flat-fee document reviews. Alternatively, use LegalZoom's document review service.

Ask them to review for:
- Florida law compliance
- CCPA/privacy law requirements
- Data accuracy disclaimer adequacy
- Liability exposure from displaying candidate data

---

## Step 66 — Implement Invite Code Gate

**Directory:** `J:\civicmarket`

```
claude
```

```
Read CLAUDE.md first.

Add an invite code gate to the signup flow in src/app/onboarding/page.tsx

At Step 1 (account creation), before showing the email/password form:
- Show an "Invite Code" text input
- On submit, check the code against a hardcoded list of valid codes
- If invalid: show error "Invalid invite code. Contact [your email] to request access."
- If valid: proceed to email/password form

Hardcode these invite codes for beta (I'll give you the real list):
- PSLBETA01
- PSLBETA02
- PSLBETA03
[add 47 more so you have 50 total]

Once code is validated, store it in sessionStorage so they don't need to re-enter if they 
go back. Clear it after successful account creation.

This is intentionally simple — no database needed for beta invite codes.
```

> **Generate your 50 invite codes:** Use any random string generator. Make them 8-10 characters, easy to type (no 0/O or 1/l confusion). You'll include one per beta invitation email.

---

## Step 67 — Mobile Testing

Test these exact flows on a real phone — not the browser desktop view. Use Chrome on Android or Safari on iPhone.

Open `http://[your-local-ip]:3000` on your phone (make sure your phone is on the same WiFi network). Find your local IP by running:

**Directory:** Anywhere

```
ipconfig
```

Look for "IPv4 Address" under your active network adapter (e.g., `192.168.1.105`).

### Testing checklist — run through each flow on mobile:

**Onboarding:**
- [ ] Enter invite code → signup with email → confirm email → return to app
- [ ] ZIP entry → district confirmed
- [ ] Skip DNA quiz → land on Ballot
- [ ] Take full DNA quiz → match scores appear on Ballot

**Ballot + Home:**
- [ ] Match rings show correct colors
- [ ] Election mode vs. feed mode switching
- [ ] Tapping a candidate goes to their profile

**Candidate Profile:**
- [ ] Voting records load
- [ ] Funding section shows
- [ ] Report Inaccuracy opens email client
- [ ] Data Sources shows real links

**Vote Screen:**
- [ ] Polling location loads
- [ ] Registration check works

**Profile:**
- [ ] DNA radar chart renders on mobile
- [ ] Follows list shows

**Admin:**
- [ ] Enter a voting record
- [ ] Claude scores it within 10 seconds
- [ ] Score appears on candidate profile

**Milestone check — Week 9 complete when:**
- [ ] All three legal documents finalized (attorney reviewed)
- [ ] Invite code gate working
- [ ] All flows tested on real mobile device
- [ ] All bugs found in mobile testing fixed

---

---

# WEEK 10 — Deploy to Vercel + Beta Launch

**Goal:** App live on production URL. 25-50 real PSL residents invited.

---

## Step 68 — Push Code to GitHub

### Create a GitHub repository

1. Go to **github.com** and sign in
2. Click **New repository**
3. Name: `civicmarket`
4. Set to **Private**
5. Do NOT initialize with README (your project already has files)
6. Click **Create repository**

### Connect your local project to GitHub

**Directory:** `J:\civicmarket`

```
git init
git add .
git commit -m "Initial commit — CivicMarket beta"
git branch -M main
git remote add origin https://github.com/yourusername/civicmarket.git
git push -u origin main
```

**Successful output looks like:**
```
Enumerating objects: 142, done.
...
Branch 'main' set up to track remote branch 'main' from 'origin'.
```

> **Before pushing:** Double-check that `.env.local` is in `.gitignore` and NOT being committed. Run `git status` and verify `.env.local` is not in the list of files being committed.

---

## Step 69 — Deploy to Vercel

### Connect Vercel to GitHub

1. Go to **vercel.com** and sign in
2. Click **Add New → Project**
3. Click **Import Git Repository**
4. Find and select your `civicmarket` repository
5. Click **Import**

### Configure the project

On the configuration screen:
- **Framework Preset:** Next.js (auto-detected)
- **Root Directory:** `./` (leave as default)
- **Build Command:** `npm run build` (auto-detected)
- **Output Directory:** `.next` (auto-detected)

### Add environment variables

Before clicking Deploy, click **Environment Variables** and add each of these:

| Name | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase publishable key |

Click **Deploy**.

**Successful output:** Vercel shows a green checkmark and gives you a URL like `civicmarket.vercel.app`.

---

## Step 70 — Add Production URL to Supabase Auth

Supabase needs to know your production URL to allow OAuth redirects.

1. In Supabase dashboard: **Authentication → URL Configuration**
2. Add your Vercel URL to **Redirect URLs:**
   ```
   https://civicmarket.vercel.app/auth/callback
   ```
3. Also update your Google OAuth authorized redirect URIs (in Google Cloud Console) to include the same URL

---

## Step 71 — Run Full Production Smoke Test

Open your Vercel URL on your phone and run through every hard blocker check:

- [ ] Invite code gate works on production
- [ ] Signup creates a real account
- [ ] Email verification arrives and works
- [ ] ZIP lookup returns real districts
- [ ] Ballot shows real PSL candidates
- [ ] Candidate profile shows real voting records with AI scores
- [ ] Funding data shows with source links
- [ ] Civic feed shows at least 5 items
- [ ] Report Inaccuracy button opens email
- [ ] Data Sources section shows real links
- [ ] Admin entry form scores a new record successfully
- [ ] Terms of Service link in footer works
- [ ] Privacy Policy link in footer works
- [ ] Corrections Policy link in footer works

Do not send invitations until every item above is checked off.

---

## Step 72 — Set Up Domain (Optional but Recommended)

If you purchased `civicmarket.app` or similar:

1. In Vercel dashboard: **Settings → Domains**
2. Click **Add Domain**
3. Enter your domain name
4. Follow Vercel's DNS configuration instructions (add CNAME or A record at your registrar)

This usually propagates within 1-24 hours.

---

## Step 73 — Beta User Recruitment

Find 25-50 real PSL residents through:

- **NextDoor:** Search for Port St. Lucie groups. Post an introduction (not a pitch — introduce the app and invite feedback)
- **Facebook:** "Port St. Lucie Community" and "Port St. Lucie Residents" groups
- **Personal network:** Anyone you know in St. Lucie County
- **Local civic organizations:** PSL Chamber of Commerce, neighborhood associations, HOAs

**Do NOT do a public launch.** Invite only. You need to be reachable when things break.

---

## Step 74 — Send Beta Invitations

Send personalized emails to each beta user. Use this template:

```
Subject: You're invited to try CivicMarket — Port St. Lucie's local election guide

Hi [Name],

I'm building CivicMarket, a new app that helps Port St. Lucie residents 
understand how local candidates actually vote — and shows you which candidates 
align with your values.

I'd love for you to be one of the first 50 people to try it.

Your invite code: PSLBETA##

Get started: https://civicmarket.vercel.app (or your custom domain)

What you can do right now:
• See real candidates on your 2026 ballot
• Read their actual voting records with source links
• Take a quick quiz to see which candidates match your values

This is a beta — you'll find rough edges. Please report anything broken 
directly to me at [your email]. Your feedback shapes what gets built next.

Thank you,
[Your name]
[Your phone — so they can reach you directly]
```

---

## Step 75 — Set Up Monitoring

### Vercel Analytics

1. In Vercel dashboard: **Analytics → Enable**
2. This is free and tracks page views, errors, and performance automatically

### Supabase Monitoring

1. In Supabase dashboard: **Reports** — shows query performance and API usage
2. **Logs → Edge Functions** — check this daily for scoring errors

### Feedback Channel

Create a simple feedback form using Google Forms and send the link to all beta users alongside their invite. Ask:
1. What did you find most useful?
2. What was confusing?
3. Did you find any incorrect information?
4. Would you use this before the November election?

---

## Step 76 — Week 10 Final Checks

**Every Friday throughout beta, ask yourself:**

1. Is there anything in the database that's factually wrong and publicly visible?
2. Did Agent 4 (Claude scoring) fire successfully on all new voting records this week?
3. Are there any reviews that need moderation attention?
4. Is the civic feed updated with at least 1-2 new items this week?
5. Has any beta user reported a bug I haven't fixed yet?

**Milestone check — Beta launched when:**
- [ ] App live on production URL
- [ ] All hard blockers checked off
- [ ] 25-50 invitations sent with unique invite codes
- [ ] Monitoring active (Vercel analytics + Supabase logs)
- [ ] Feedback channel live
- [ ] You can be reached directly by every beta user

---

---

# POST-BETA — What Comes Next

Once you've confirmed the app is stable and users are engaging (target: 2-4 weeks of beta):

| Item | Trigger | Estimated effort |
|---|---|---|
| PWA manifest + install | Week 1 post-beta | 2 hours |
| Agent 5 + Firecrawl (civic feed automation) | Beta confirms feed drives retention | 1 week |
| SMS verification (Twilio Tier 1) | Agent 5 live | 3 days |
| Full Admin UI (5 tabs) | Second researcher or staff | 1 week |
| Push notifications | 100+ active users | 3 days |
| Grant applications | Beta launched | Ongoing |
| Agent 2 (voting record automation) | Researcher cost justified | 2 weeks |
| Expo mobile app | Beta stable | Post-grant |
| City #2 expansion | All 3 criteria met | 1 week data work |

**Geographic expansion criteria (all 3 required):**
1. 20% of registered users completed DNA AND submitted at least one community score
2. 80% of candidates have voting records with AI draft scores
3. 30 consecutive days of stability — no critical bugs, green agent health

---

# TROUBLESHOOTING REFERENCE

## Common Errors and Fixes

### "Cannot find module '@/lib/supabase'"
The path alias isn't configured. Open `tsconfig.json` and verify:
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### Supabase query returns null but table has data
RLS is blocking the query. Check:
1. Is the user authenticated?
2. Does the RLS policy allow the current user to read this table?
3. In Supabase SQL Editor: `SELECT * FROM [table] LIMIT 5` — if this works, it's an RLS issue

### Edge Function returns 500 error
1. In Supabase dashboard: **Logs → Edge Functions**
2. Find the failed invocation and read the error
3. Most common cause: missing environment secret. Check **Settings → Edge Functions → Secrets**

### Claude API returns invalid JSON
The scoring prompt response got cut off. Check:
1. `max_tokens` is set to at least 500 in the API call
2. The response is being parsed after stripping any markdown code fences

### Google Civic API returns no districts for a ZIP
The ZIP may be in a district not covered by the Civic API. For PSL ZIPs (34952, 34953, 34984, 34986, 34987, 34988), this shouldn't happen. If it does:
1. Test the ZIP directly at: `https://www.googleapis.com/civicinfo/v2/representatives?address=[ZIP]&key=[YOUR_KEY]`
2. If empty, the address needs more detail — prompt for street name

### Auth redirect loop after signup
The callback URL isn't configured. Verify:
1. Supabase: **Authentication → URL Configuration → Redirect URLs** includes your domain
2. Google OAuth: authorized redirect URIs includes `https://[your-supabase-project].supabase.co/auth/v1/callback`

---

## How to Use This Guide With Claude

**When starting a new session:**
Paste the relevant week's section into a new chat with:
```
I'm building CivicMarket. Here's my current build guide section: [paste]. 
I'm on Step [X] and hit this error: [describe error or paste error message]
```

**When asking Claude Code to build something:**
Always start with:
```
Read CLAUDE.md first, then [your task]
```

**When a Claude Code output doesn't look right:**
```
This doesn't match the design system. The card background should be #FFFFFF 
with border-radius 20px, and the top nav should be #0D1117. Please fix.
```

**When you need to troubleshoot a Supabase query:**
Paste the query and the error message. Include your table schema if it's a new table.

---

*CivicMarket Full Build Guide · v1.0 · May 5, 2026*
*Beta target: mid-July 2026 · Port St. Lucie, FL · 10 weeks · Solo developer*
*AI: Claude API (claude-sonnet-4-5) for scoring · Gemini Flash for civic feed (post-beta)*
