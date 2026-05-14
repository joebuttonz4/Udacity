# CivicMarket — Beta Scope Plan
> Build plan for Port St. Lucie pilot beta. Target: mid-July 2026.
> Solo developer. 10 weeks. $1,000 budget.
> Updated: May 5, 2026

---

## The Honest Constraints

**Time:** 10 weeks (May 5 – mid-July 2026)
**Budget:** $1,000 total
**Team:** Solo developer, no prior React experience
**Pilot:** 6 races, ~12-15 PSL candidates, real data required before any beta user

These constraints demand ruthless prioritization. Every item in this plan is either a hard blocker or a deliberate cut.

---

## Budget Allocation

| Item | Monthly | 10 Weeks | Notes |
|---|---|---|---|
| Claude API | ~$5 | ~$13 | Scoring + match rationale (~200 records at beta scale) |
| Gemini API | $0 | $0 | Deferred — Agent 5 post-beta only |
| Firecrawl Hobby | $0 | $0 | Deferred — Agent 5 post-beta only |
| Twilio Verify | $0 | $0 | Deferred — invite code gate for beta |
| Resend | $0 | $0 | Free tier covers beta |
| Vercel | $0 | $0 | Free tier covers beta |
| Supabase | $0 | $0 | Free tier covers beta |
| Data researcher | One-time | $400 | 20-30 hrs @ $15-20/hr |
| Domain + misc | One-time | $25 | civicmarket.app or similar |
| Attorney review | One-time | $250 | Legal documents before launch |
| **Total** | | **~$688** | **$312 reserve** |

---

## What Is NOT In Beta Scope

Cut deliberately. Do not build these before beta.

- Agent 1 (Candidate Intake) — researcher covers this manually
- Agent 2 (Voting Records) — researcher covers this manually
- Agent 3 (Funding) — researcher covers this manually
- Agent 5 automation (Civic Feed) — feed UI built, populated manually via Supabase Studio for beta
- Firecrawl integration — not needed until Agent 5 post-beta
- SMS verification (Twilio/Tier 1) — invite code gate used for beta instead
- Full Admin UI (5 tabs) — replaced with 2 forms: voting record entry + review removal
- PWA manifest + service worker — deferred post-beta (2 hours of work, not a blocker)
- Voter roll matching (Tier 2 verification) — requires legal review first
- Push notifications — post-beta
- Email digest — Resend for transactional only
- Search bar — not needed for 15 candidates
- Candidate self-verification portal
- Premium user tier
- Geographic expansion beyond PSL
- Expo (React Native) mobile app

---

## Phase Overview

| Phase | Weeks | What | Goal |
|---|---|---|---|
| 1 — Data First | 1-2 | Schema, auth, environment, real PSL data seeded | Database working, real candidates visible |
| 2 — Core Screens | 3-5 | DNA quiz, ballot, candidate + measure profiles | App functional for primary user flow |
| 3 — Scoring Pipeline | 6-7 | Claude API scoring, match scores computing, civic feed UI | Data pipeline end-to-end |
| 4 — Polish + Legal | 8-9 | Error states, Report Inaccuracy, Data Sources, legal docs | Beta-safe and trustworthy |
| 5 — Beta | 10 | Deploy, invite code gate, 25-50 users | Real users giving real feedback |

---

## Phase 1 — Foundation (Weeks 1-3)

**Goal:** Database deployed with real PSL data. Auth working. You can log in and see real candidates.

### Week 1 — Schema & Environment

**Day 1-2: Deploy v4 schema**
- Copy `civicmarket_schema_v4.sql` from outputs folder into Supabase SQL Editor
- Run in order — check for errors after each section
- Verify all 25 tables created: `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`
- Confirm RLS enabled on all tables

**Day 3: Environment configuration**
- Add all environment variables to `.env.local`
- Add server-side secrets to Supabase dashboard (Settings → Edge Functions → Secrets)
- Verify Supabase client connects: test query from `src/lib/supabase.ts`

**Day 4-5: Auth flow**
- Configure Supabase Auth for email/password + Google OAuth
- Configure Resend for transactional emails (verification, password reset)
- Test signup, login, logout, password reset flows
- Create your own admin account — set `is_admin = true` directly in Supabase dashboard

**Milestone check:** Can you log in and query the database? ✓

---

### Week 2 — Data Seeding (Researcher)

**Hire a researcher this week.** Post on Upwork or Fiverr. Budget $400. Brief them with this task list:

**Researcher task list:**
```
For each of these 6 PSL races:
1. City Council District 1 — PSL
2. School Board District 1 — St. Lucie County
3. County Commission At-Large — St. Lucie County
4. FL House District 85
5. FL Senate District 27
6. (Any current ballot measure — bond, ordinance, or zoning)

For each race, find and record:
A. Candidate names, office, incumbent status, website
B. All voting records for incumbent candidates from public minutes
   - Bill number, description, date, vote cast, source URL
   - Source URLs must be official government domains only
C. Campaign finance totals from FL Division of Elections
   - Total raised, individual donations, PAC/corporate donations
   - Source URL required

Deliverable: Completed Google Sheets spreadsheet
Sheet 1: Candidates
Sheet 2: Voting Records (source URL for every row)
Sheet 3: Funding
```

**Sources to give researcher:**
- PSL City Council minutes: cityofpsl.com/government/city-council
- FL Division of Elections: dos.myflorida.com/elections/candidates
- FL Division of Elections campaign finance: dos.myflorida.com/campaign-finance
- FL Legislature: flsenate.gov and myfloridahouse.gov
- St. Lucie County Commission: stlucieco.gov

**You do:** Review every row before approving. Check source URLs resolve. Spot-check vote descriptions against actual minutes.

---

### Week 3 — Data Entry & Claude Scoring Prompt

**Day 1-2: Seed districts and elections**
```sql
-- Run manually in Supabase SQL Editor
INSERT INTO districts (name, type, city, state) VALUES
  ('City Council District 1', 'city_council', 'Port St. Lucie', 'FL'),
  ('School Board District 1', 'school_board', 'Port St. Lucie', 'FL'),
  ('St. Lucie County Commission At-Large', 'county', 'Port St. Lucie', 'FL'),
  ('FL House District 85', 'state', 'Port St. Lucie', 'FL'),
  ('FL Senate District 27', 'state', 'Port St. Lucie', 'FL');

INSERT INTO elections (name, election_date, district_id) VALUES
  ('PSL General Election 2026', '2026-11-04', [district_id]);
```

**Day 3-4: Enter researcher data into Supabase**
- Candidates table — one row per candidate
- Voting records — every row requires source_url
- Candidate funding — one row per candidate

**Day 5: Write and test Claude scoring prompt**
This is your most important non-code task. The prompt drives all AI draft scores for the entire beta.

The prompt uses Claude's system/user message structure and asks for explicit reasoning before the final score — this reduces errors on votes where stated intent conflicts with policy impact.

**SYSTEM prompt:**
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

**USER prompt template:**
```
Score this vote on the {dimension} dimension.

Issue: {issue_title}
Description: {issue_description}
Vote cast: {vote_cast}
Bill number (if applicable): {bill_number}

Step 1 — What did this vote actually do in policy terms?
Step 2 — Does the policy impact support or oppose {dimension} values?
Step 3 — How strong is the impact? (Minor procedural = closer to 0. Major policy = closer to ±2)

Return JSON only, no other text:
{
  "score": -2 | -1 | 0 | 1 | 2,
  "rationale": "One plain-English sentence explaining the score from a voter's perspective"
}
```

**Validation step — run this before wiring Agent 4:**
Pick 5 real voting records from your researcher data. Run each through the prompt manually via the Claude API playground or claude.ai. Check: does the score match what a reasonable, non-partisan observer would expect? If 2 or more feel wrong, iterate on the prompt before going live.

**Milestone check:** Real candidates in database. Voting records entered. Funding data entered. Claude scoring prompt written and validated against real PSL votes. ✓

---

## ⚠️ Note on Phases 2-4 Below
The detailed week-by-week content in Phases 2-4 reflects the original 13-week plan and has not been fully rewritten. Use the **Build Order Summary** above as the authoritative 10-week schedule. The code snippets and technical guidance in the sections below remain valid — only the week numbering and scope assumptions are stale.

---

## Phase 2 — Core Backend (Weeks 4-6)

**Goal:** Edge Functions working. Agent 4 scoring votes. Admin UI operational. Data pipeline end-to-end.

### Week 4 — Edge Functions (Part 1)

**`civic-lookup` — update for ZIP disambiguation**

Add new action `disambiguate_zip`:
```typescript
// supabase/functions/civic-lookup/index.ts
case 'lookup_address': {
  const response = await fetch(
    `https://www.googleapis.com/civicinfo/v2/representatives?address=${encodeURIComponent(address)}&key=${GOOGLE_CIVIC_API_KEY}`
  )
  const data = await response.json()
  const districts = mapToDistricts(data)
  const isAmbiguous = checkAmbiguity(districts, zip)
  return { districts, is_ambiguous: isAmbiguous }
}

case 'disambiguate_zip': {
  const { zip, street_name } = body
  const response = await fetch(
    `https://www.googleapis.com/civicinfo/v2/representatives?address=${encodeURIComponent(street_name + ', ' + zip)}&key=${GOOGLE_CIVIC_API_KEY}`
  )
  // resolve and return districts
}
```

**`verify-phone` — Twilio Verify integration**
```typescript
// supabase/functions/verify-phone/index.ts
// POST /send
const verification = await twilioClient.verify.v2
  .services(TWILIO_VERIFY_SERVICE_SID)
  .verifications.create({ to: phoneNumber, channel: 'sms' })

// POST /check
const check = await twilioClient.verify.v2
  .services(TWILIO_VERIFY_SERVICE_SID)
  .verificationChecks.create({ to: phoneNumber, code: otp })

if (check.status === 'approved') {
  await supabase
    .from('profiles')
    .update({ verification_tier: 1, phone_verified_at: new Date() })
    .eq('id', userId)
}
```

---

### Week 5 — Edge Functions (Part 2)

**`agent-scoring` — Agent 4**
```typescript
// supabase/functions/agent-scoring/index.ts
// Triggered by database webhook on agent_staging status → 'approved'

const record = await getApprovedRecord(stagingId)

const prompt = buildScoringPrompt(
  record.payload.issue_description,
  record.payload.vote_cast,
  record.payload.dimension
)

const result = await callClaude(prompt)

await supabase
  .from('voting_records')
  .update({
    ai_draft_score: result.score,
    ai_draft_rationale: result.rationale,
    ai_draft_generated_at: new Date(),
    ai_draft_model: 'claude-sonnet-4-5'
  })
  .eq('id', record.payload.voting_record_id)

await recomputeCandidatePositions(record.payload.candidate_id)
```

**`compute-matches` — update for 14-question quiz**
```typescript
// Average two answers per dimension before scoring
const getDimensionScore = (dna: CivicDna, dim: string) => {
  // civic_dna already stores averages — use directly
  return dna[dim] // numeric(4,2), already averaged
}
```

**`analyze-sentiment` — nightly cron**
Already architected. Wire to real data from `reviews` table.

---

### Week 6 — Admin UI

Build the 5-tab admin at `/admin`. This is the internal tool that makes everything else work.

**Tab 1: Staging Queue**
```typescript
// src/app/admin/staging/page.tsx
// Fetch all pending agent_staging records
// Show confidence score, source URL, payload preview
// Approve → update status, trigger agent-scoring webhook
// Reject → update status with reason
// Batch approve → all records above confidence threshold
```

**Tab 2: Manual Data Entry**
Four forms: Candidate, Voting Record, Ballot Measure, Funding.
Voting Record form triggers Agent 4 on save.
Source URL field validates URL resolves before accepting.

**Tab 3: Review Moderation**
Show flagged reviews with reviewer history.
Actions: Remove, Keep, Warn account, Ban account.

**Tab 4: Agent Health**
Show last run time and status per agent.
Manual trigger button per agent.
Simple status table — not complex dashboarding.

**Tab 5: Settings**
Read/write interface for `app_settings` table.
Display current value, input to update, description shown as help text.

**Auth middleware:**
```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/admin')) {
    // Check admin session cookie
    // Redirect to /admin/login if not authenticated
  }
}
```

**Milestone check:** Can you approve a staged voting record, watch Agent 4 score it, and see the result in the database? ✓

---

## Phase 3 — Frontend (Weeks 7-10)

**Goal:** All 13 screens wired to real Supabase data. App works end-to-end for a real user.

**Build order matters.** Each screen depends on data from the previous screens being available.

### Week 7 — Onboarding

Wire Steps 0-3 to real auth and district lookup. This is the user's first experience — must work flawlessly.

**Step 0:** Static. No data needed. Just navigation to Step 1.

**Step 1 — Account creation:**
```typescript
// src/app/onboarding/page.tsx
const { data, error } = await supabase.auth.signUp({
  email,
  password
})
// OR Google OAuth:
await supabase.auth.signInWithOAuth({ provider: 'google' })
// On success → navigate to Step 2
```

**Step 2 — ZIP entry:**
```typescript
const { data } = await supabase.functions.invoke('civic-lookup', {
  body: { action: 'lookup_address', zip }
})
if (data.is_ambiguous) {
  // Show street name prompt
} else {
  // Write to user_districts
  await supabase.from('user_districts').insert(data.districts.map(d => ({
    user_id: userId,
    district_id: d.id,
    scope: d.scope
  })))
  // Navigate to Step 3
}
```

**Step 3 — District confirmation:**
```typescript
// Use ballot_for_user view
const { data: ballot } = await supabase
  .from('ballot_for_user')
  .select('*')
  .eq('user_id', userId)
// Display grouped by scope
// Auto-follow all candidates in user's districts
await supabase.from('follows').insert(
  ballot
    .filter(item => item.item_type === 'candidate')
    .map(item => ({
      user_id: userId,
      candidate_id: item.item_id,
      is_auto_followed: true
    }))
)
```

**Steps 4-6 (DNA Teaser, Quiz, Calculation):**
```typescript
// On quiz answer submit
await supabase.from('civic_dna_answers').insert({
  user_id: userId,
  question_number: questionNumber,
  dimension: dimension,
  answer: answerValue
})

// On quiz complete — compute averages and store in civic_dna
const answers = await supabase.from('civic_dna_answers')
  .select('*').eq('user_id', userId)

const dnaRow = computeDnaAverages(answers)
await supabase.from('civic_dna').insert({ user_id: userId, ...dnaRow })

// Trigger match computation
await supabase.functions.invoke('compute-matches', { body: { userId } })
```

---

### Week 8 — Core Screens (Home + Ballot)

**Home screen:**
```typescript
// src/app/page.tsx
// Check days until next election → determine home mode
const { data: elections } = await supabase
  .from('elections')
  .select('*')
  .gte('election_date', new Date().toISOString())
  .order('election_date', { ascending: true })
  .limit(1)

const daysUntil = differenceInDays(new Date(elections[0].election_date), new Date())
const isElectionMode = daysUntil <= 60

// Fetch match scores
const { data: matches } = await supabase
  .from('match_scores')
  .select('*, candidates(*)')
  .eq('user_id', userId)
  .order('score', { ascending: false })
  .limit(4)

// Fetch civic feed
const { data: feed } = await supabase
  .from('civic_feed')
  .select('*')
  .eq('district_id', userDistrictId)
  .order('generated_at', { ascending: false })
  .limit(10)
```

**Ballot screen:**
```typescript
// src/app/ballot/page.tsx
// Use ballot_for_user view + match_scores join
const { data: ballot } = await supabase
  .from('ballot_for_user')
  .select(`
    *,
    match_scores!inner(score, rationale)
  `)
  .eq('user_id', userId)

// Group by election
const grouped = groupBy(ballot, 'election_name')
```

---

### Week 9 — Profile Screens (Candidate + Measure)

**Candidate profile:**
```typescript
// src/app/candidates/[id]/page.tsx
const [candidate, positions, records, funding, reviews, matchScore] =
  await Promise.all([
    supabase.from('candidates').select('*').eq('id', id).single(),
    supabase.from('candidate_positions').select('*').eq('candidate_id', id).single(),
    supabase.from('voting_records').select('*').eq('candidate_id', id).order('vote_date', { ascending: false }),
    supabase.from('candidate_funding').select('*').eq('candidate_id', id).single(),
    supabase.from('reviews').select('*, profiles(display_name, civic_level, verification_tier)').eq('candidate_id', id).order('helpful_count', { ascending: false }).limit(5),
    supabase.from('match_scores').select('*').eq('candidate_id', id).eq('user_id', userId).single()
  ])
```

**Measure profile:**
```typescript
// src/app/measures/[id]/page.tsx
const [measure, dimensions, reviews, matchScore] =
  await Promise.all([
    supabase.from('ballot_measures').select('*').eq('id', id).single(),
    supabase.from('measure_dimensions').select('*').eq('measure_id', id).single(),
    supabase.from('reviews').select('*, profiles(display_name, civic_level)').eq('measure_id', id).limit(5),
    supabase.from('match_scores').select('*').eq('measure_id', id).eq('user_id', userId).single()
  ])
```

---

### Week 10 — Remaining Screens

**Vote screen:**
```typescript
// src/app/vote/page.tsx
// Tab 1: Polling location
const { data: polling } = await supabase.functions.invoke('civic-lookup', {
  body: { action: 'polling_locations', address: userAddress }
})

// Tab 3: Registration check
const { data: registration } = await supabase.functions.invoke('civic-lookup', {
  body: { action: 'registration_check', name: userName, address: userAddress }
})
```

**Profile screen:**
```typescript
// src/app/profile/page.tsx
const [profile, dna, follows, events] = await Promise.all([
  supabase.from('profiles').select('*').eq('id', userId).single(),
  supabase.from('civic_dna').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(1),
  supabase.from('follows').select('*, candidates(name, office, district_id)').eq('user_id', userId),
  supabase.from('civic_points_events').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(20)
])
```

**Archive (Ballot Past toggle):**
```typescript
// Past elections via archived_at IS NOT NULL
const { data: archived } = await supabase
  .from('candidates')
  .select('*, elections(*), match_scores!inner(score)')
  .not('archived_at', 'is', null)
  .eq('appeared_on_ballot', true)
  .eq('elections.district_id', userDistrictIds)
```

**Agent 5 — Civic Feed:**
```typescript
// supabase/functions/agent-civic-feed/index.ts
// Runs daily at 6 AM EST

const sources = await supabase
  .from('monitored_sources')
  .select('*')
  .eq('is_active', true)

for (const source of sources) {
  // Firecrawl fetch
  const content = await firecrawl.scrapeUrl(source.source_url)

  // Gemini Flash — used for civic feed extraction only (not scoring)
  const items = await gemini.generate({
    prompt: `Extract civic agenda items relevant to these dimensions: 
    ${DIMENSIONS.join(', ')}.
    For each item return: title, description, affected_dimensions[], urgency.
    Content: ${content.markdown}`
  })

  // Write to civic_feed
  await supabase.from('civic_feed').insert(
    items.map(item => ({
      ...item,
      district_id: source.district_id,
      source_url: source.source_url
    }))
  )
}
```

**Milestone check:** Can a new user sign up, see their real PSL ballot, view a candidate profile with real voting records and funding, submit a community score, and see their profile? ✓

---

## Phase 4 — Launch Prep (Weeks 11-13)

**Goal:** App ready for real beta users. Legal done. PWA installable. First users invited.

### Week 11 — Reusable Components + Polish

Build the 5 shared components that appear across every screen. Do these now so you can drop them into any screen cleanly.

**`MatchScoreRing.tsx`**
```typescript
interface MatchScoreRingProps {
  score: number | null  // null = no DNA
  size?: 'sm' | 'md' | 'lg'
}
// SVG ring with correct color thresholds
// >= 70 → teal · 45-69 → amber · < 45 → coral · null → dashed gray + 🔒
```

**`CivicLevelBadge.tsx`**
```typescript
interface CivicLevelBadgeProps {
  level: 'voter' | 'pioneer' | 'delegate' | 'titan'
  points?: number
}
// Titan gets violet gradient. Pioneer gets emerald. etc.
```

**`DimensionBar.tsx`**
```typescript
interface DimensionBarProps {
  dimension: string
  score: number            // -2.0 to 2.0
  userScore?: number       // for comparison overlay
  showScore?: boolean
}
```

**`VerificationBadge.tsx`**
```typescript
interface VerificationBadgeProps {
  tier: 0 | 1 | 2
  size?: 'sm' | 'md'
}
```

**`EmptyState.tsx`**
```typescript
interface EmptyStateProps {
  icon: string
  title: string
  body: string
  ctaLabel?: string
  ctaHref?: string
  onCta?: () => void
}
```

**Error handling pass:** Go through every screen. Every Supabase query needs a loading state and an error state. No blank screens.

---

### Week 12 — Legal + PWA + Testing

**Legal (Days 1-3):**
1. Use Termly or iubenda to generate base ToS and Privacy Policy
2. Customize with CivicMarket-specific language from knowledge base
3. Write Corrections Policy manually — 5-step process documented
4. Send all three to Florida attorney for review ($200-300)
5. Add all three to site footer. Add ToS agreement to signup flow.

**PWA (Days 3-4):**
1. Install `next-pwa`: `npm install next-pwa`
2. Configure in `next.config.js`
3. Create `public/manifest.json` with correct tokens
4. Create `public/sw.js` for app shell caching
5. Design icons (192px and 512px) — use Figma or Canva
6. Test: Can you install CivicMarket on your phone's home screen?

**Testing pass (Days 4-5):**
Test these specific flows on a real mobile device — not just browser desktop:

- [ ] Sign up → district lookup → ballot confirmed
- [ ] DNA quiz all 14 questions → match scores appear on Ballot
- [ ] View candidate profile → voting record → community score submission
- [ ] SMS verification flow (Tier 1)
- [ ] Vote screen → polling location → registration check
- [ ] Admin UI → approve a staged record → Agent 4 fires → score appears
- [ ] Home screen in election mode (< 60 days) and feed mode (> 60 days)

---

### Week 13 — Beta Launch

**Days 1-2: Soft launch prep**
- Deploy to Vercel production (not just local)
- Configure Supabase production vs staging environments
- Set all production environment variables
- Run full smoke test on production URL

**Day 3: Beta user list**
Target 25-50 real PSL residents for first wave. Find them via:
- Local NextDoor groups
- PSL community Facebook groups
- Personal network in St. Lucie County
- Local civic organizations

Do NOT do a public launch. Invite only. You need to be able to respond to issues personally.

**Days 4-5: Beta invitations**
Send personalized invitations. Include:
- What CivicMarket is
- Why you built it
- Direct link to install as PWA
- How to report issues
- Your direct contact info

**Day 5: Monitoring setup**
- Vercel analytics (free) — page views, errors
- Supabase dashboard — query performance, function errors
- Set up a simple feedback channel — email or a Notion form

**Milestone check:** 25 real PSL residents using the app, reporting issues, and submitting community scores. ✓

---

## Build Order Summary

```
WEEK 1:  Schema deploy → Auth → Environment → Hire researcher
WEEK 2:  Seed real PSL data → Claude scoring prompt written + validated
WEEK 3:  Onboarding (Steps 0-6) wired to Supabase
WEEK 4:  Ballot screen + Home screen
WEEK 5:  Candidate profile + Measure profile
WEEK 6:  Claude API scoring (agent-scoring) → compute-matches → match scores live
WEEK 7:  Civic feed UI (manual population) → Vote screen → Profile screen → Archive
WEEK 8:  Shared components → error handling pass → Report Inaccuracy + Data Sources
WEEK 9:  Legal docs → invite code gate → mobile testing
WEEK 10: Deploy to Vercel → smoke test → beta invitations → monitoring
```

---

## Hard Blockers

These must be complete before inviting a single beta user:

1. ✅ v4 schema deployed — no users without a working database
2. ✅ Real PSL data seeded — no users with fake/empty candidate profiles
3. ✅ Auth working — no users without account creation
4. ✅ Invite code gate — controls who gets in during beta
5. ✅ Terms of Service published — legal exposure without this
6. ✅ Privacy Policy published — required by law when collecting location data
7. ✅ Corrections Policy published — reputational protection
8. ✅ Report Inaccuracy button on all profile pages — non-negotiable before public
9. ✅ Data Sources section on all profile pages — transparency requirement
10. ✅ Voting record entry form + review removal form — minimum admin capability needed
11. ✅ Claude scoring prompt validated against real PSL votes — AI draft scores are live scores for all of beta
12. ✅ Civic feed has at least 5 manual entries — app must not launch with empty feed

---

## Deferred to Post-Beta

Items cut from beta that activate after stability is proven:

| Item | Trigger |
|---|---|
| Agent 5 automation (Firecrawl + civic feed) | Beta confirms feed drives retention |
| SMS verification (Twilio/Tier 1) | Agent 5 live — community scores need weight |
| Full Admin UI (5 tabs) | Second researcher or staff hired |
| PWA manifest + install | First week post-beta (2 hours) |
| Push notifications | 100+ active users |
| Agent 2 (voting records automation) | Researcher cost justified |
| Agent 1 (candidate intake automation) | Second election cycle |
| Agent 3 (funding automation) | Legal review complete |
| Voter roll matching (Tier 2) | Florida attorney sign-off |
| Campaign portal revenue | 500+ active users |
| Grant applications | Beta launch + data |
| Expo mobile app | Beta proven stable |
| City #2 expansion | All 3 expansion criteria met |

---

## Weekly Check-In Questions

Ask yourself these every Friday:

1. Is the database in a state where a user could sign up and see real data?
2. Is there anything blocking me from moving to next week's tasks?
3. What shortcuts am I taking that will create tech debt before launch?
4. Am I still on track for August 4?

If you miss a week, the first thing to cut is the error handling polish pass. The core flow — sign up, see ballot, view candidates, vote — ships even if some edge cases show blank screens. The feed must not be empty at launch — 5 manual entries minimum.

---

*Last updated: May 5, 2026 · CivicMarket Beta Scope Plan · 10 weeks to mid-July 2026*
*AI stack: Claude API (claude-sonnet-4-5) for scoring and match rationale · Gemini Flash for civic feed extraction (post-beta)*
*Beta scope: Agent 5 deferred (manual feed), SMS verification deferred (invite code), Admin UI reduced to 2 forms, PWA deferred*
