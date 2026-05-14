# CivicMarket — Claude Code Project Context
> This file is read automatically by Claude Code at the start of every session.
> It is the authoritative source of truth for all architecture, conventions, and decisions.
> Last updated: May 5, 2026 · v2.2

---

## What This Project Is

CivicMarket is a non-partisan, mobile-first civic engagement platform that matches voters to city, county, and state elections based on their personal values. Think Amazon's discovery experience applied to local democracy — personalized match scores, proactive civic alerts, radical funding transparency, zero-friction voting logistics.

**Pilot market:** Port St. Lucie, FL
**Scope rule:** City, county, and state races only. Federal races are explicitly excluded. Period.
**Beta target:** Mid-July 2026. 25-50 real PSL residents. Invite code gated.
**Developer:** Solo. No prior React experience. Windows machine.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| Backend | Supabase (PostgreSQL, Auth, Edge Functions) |
| AI — Scoring & Matching | Anthropic Claude API (`claude-sonnet-4-5`) |
| AI — Civic Feed (post-beta) | Google Gemini API (`gemini-2.0-flash`) |
| Email | Resend (free tier) |
| Deployment | Vercel (frontend) + Supabase (backend) |

**Not in beta scope — do not build or reference:**
- Firecrawl (Agent 5 automation — deferred post-beta)
- Twilio Verify (SMS — deferred post-beta, invite code used instead)
- PWA manifest / service worker (deferred post-beta)
- Full Admin UI (beta uses 2 forms only — see Admin section)

**Project location:** `J:\civicmarket`
**Dev server:** `npm run dev` → `http://localhost:3000`
**Supabase project:** CivicMarket-MVP

---

## Repository Structure

```
civicmarket/
├── src/
│   ├── app/
│   │   ├── page.tsx                    # Home screen
│   │   ├── admin/
│   │   │   ├── entry/page.tsx          # Voting record entry form (beta)
│   │   │   └── reviews/page.tsx        # Review removal form (beta)
│   │   ├── onboarding/page.tsx         # 6-step onboarding flow
│   │   ├── ballot/page.tsx             # My Ballot + Archive toggle
│   │   ├── vote/page.tsx               # Vote logistics (3 tabs)
│   │   ├── profile/page.tsx            # User profile
│   │   ├── candidates/[id]/page.tsx    # Candidate profile
│   │   └── measures/[id]/page.tsx      # Measure profile
│   ├── components/
│   │   └── ui/
│   │       ├── CivicLevelBadge.tsx
│   │       ├── MatchScoreRing.tsx
│   │       ├── DimensionBar.tsx
│   │       ├── VerificationBadge.tsx
│   │       └── EmptyState.tsx
│   ├── lib/
│   │   ├── supabase.ts                 # Always import supabase from here
│   │   ├── scoring.ts
│   │   ├── trust.ts
│   │   ├── civic-points.ts
│   │   └── agents/
│   │       └── scoring.ts              # Agent 4 helpers
│   └── types/index.ts
├── supabase/
│   └── functions/
│       ├── compute-matches/            # Match scoring + Claude rationale
│       ├── civic-lookup/               # Address → districts + ZIP disambiguation
│       ├── analyze-sentiment/          # Nightly sentiment cron
│       └── agent-scoring/             # Agent 4 — Claude scoring on approved records
├── .env.local                          # Never commit
└── CLAUDE.md                           # This file
```

---

## Environment Variables

```bash
# .env.local — browser-safe
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_xxxx

# Supabase dashboard secrets only — never expose to browser
SUPABASE_SERVICE_ROLE_KEY=sb_secret_xxxx
ANTHROPIC_API_KEY=your-anthropic-key
GOOGLE_CIVIC_API_KEY=your-google-civic-key
RESEND_API_KEY=your-resend-key
```

---

## Coding Conventions — Follow These Without Exception

- **Always TypeScript** — no `.js` files anywhere in `src/`
- **Always Tailwind** — no inline styles in components
- **Supabase client** — always import from `src/lib/supabase.ts`, never instantiate inline
- **Supabase queries** — always in `src/lib/` helpers, never directly in page components
- **Edge Functions** — TypeScript, Deno runtime
- **Never expose** `SUPABASE_SERVICE_ROLE_KEY` to the browser under any circumstances
- **Dimension keys** — must exactly match these 7 snake_case keys, no exceptions:
  `growth_development` · `taxation_spending` · `education` · `environment` · `public_safety` · `housing` · `transparency`
- **Match scores** — always integers 0–100
- **Dimension scores** — always numeric -2.0 to 2.0
- **`source_url`** — required on every `voting_records` row, no exceptions
- **Community score threshold** — always read from `app_settings` table, never hardcode it

---

## Supabase Client

```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

---

## Database — 25 Tables, All RLS Enabled

Schema file: `civicmarket_schema_v4.sql` (authoritative)

### Tables You'll Touch Most

**`profiles`** — extends auth.users
Key fields: `id`, `display_name`, `zip_code`, `street_address`, `district_id`, `verification_tier` (0/1/2), `civic_level`, `civic_points`, `dna_quiz_status`, `is_admin`

**`civic_dna`** — computed dimension averages from quiz
Fields: `user_id` + one `numeric(4,2)` per dimension (-2.0 to 2.0). Multiple rows allowed; latest = active.

**`civic_dna_answers`** — raw quiz answers
Fields: `user_id`, `question_number` (1-14), `dimension`, `answer` (-2 to 2)

**`candidates`** — one row per candidate per election
Key fields: `id`, `name`, `office`, `district_id`, `election_id`, `is_incumbent`, `appeared_on_ballot`, `archived_at`

**`ballot_measures`** — bonds, ordinances, zoning, referendums
Key fields: `id`, `title`, `plain_english_summary`, `type`, `district_id`, `election_id`, `archived_at`

**`voting_records`** — objective facts only, never manual scores
Key fields: `candidate_id`, `issue_title`, `issue_description`, `vote_date`, `source_url` (REQUIRED), `vote_cast` (for/against/abstain), `dimension`, `ai_draft_score`, `ai_draft_rationale`, `ai_draft_model`, `community_score_final`

**`candidate_positions`** — computed weighted position per candidate
One row per candidate. `has_dna_score`, `data_completeness` (full/partial/pulse_only)

**`match_scores`** — cached match % + Claude rationale
Fields: `user_id`, `candidate_id` or `measure_id`, `score` (0-100 integer), `rationale`

**`civic_feed`** — civic agenda items (manual entry during beta)
Fields: `title`, `description`, `source_url`, `meeting_date`, `dimensions[]`, `urgency` (routine/significant/major), `district_id`

**`reviews`** — star ratings + written reviews
Fields: `user_id`, `candidate_id` or `measure_id`, `rating` (1-5), `body`, `moderation_status`

**`follows`** — candidate follows
Fields: `user_id`, `candidate_id`, `is_auto_followed`

### Key View

**`ballot_for_user`** — every race a user can vote on
Joins profiles → user_districts → candidates/ballot_measures → elections
Filters: `election_date >= current_date`, `archived_at IS NULL`

### Key DB Functions

**`recompute_candidate_positions(candidate_id)`** — recalculates weighted positions
**`check_community_score_threshold()`** — trigger on vote_community_scores, auto-locks when threshold met

---

## The 7 Civic DNA Dimensions

| Key | Label | + means | - means |
|---|---|---|---|
| `growth_development` | Growth & Development | Pro-growth | Preservation |
| `taxation_spending` | Taxes & Services | Lower taxes | Higher services |
| `education` | Education | More school funding | Less/vouchers |
| `environment` | Environment | Environmental protection | Development priority |
| `public_safety` | Public Safety | More police/fire | Alternative approaches |
| `housing` | Housing | Govt mandates | Market-led |
| `transparency` | Transparency | Open government | Reduced disclosure |

**Scale:** -2.0 = strongly opposed · 0 = neutral · +2.0 = strongly supports

---

## Match Scoring Algorithm

```typescript
// civic_dna already stores per-dimension averages — use directly
const diff = Math.abs(userScore - candidateScore) // 0 to 4
const dimMatchPct = (1 - diff / 4) * 100

const finalScore = Math.round(
  DIMENSIONS.reduce((sum, dim) => sum + dimMatchPct(dim), 0) / DIMENSIONS.length
) // always an integer 0-100
```

Score colors: `>= 70` → teal `#00C9A7` · `45-69` → amber `#F59E0B` · `< 45` → coral `#FF6B6B`
No DNA → dashed gray ring + 🔒

Candidate DNA source: `community_score_final` if locked, else `ai_draft_score`

---

## Claude API — Scoring (Agent 4)

Model: `claude-sonnet-4-5`
Used for: voting record dimension scoring, match score rationale
Never used for: civic feed extraction (that's Gemini, post-beta)

**System prompt (scoring):**
```
You are a non-partisan civic data analyst scoring local government votes for a civic engagement platform. Your job is to assess the real-world policy impact of a vote on a specific civic dimension — not the candidate's stated intent, party affiliation, or public framing.

Scoring rules:
- Score the policy impact, not the rhetoric
- A YES vote on a bill that weakens environmental protections scores NEGATIVE on environment
- A NO vote on a bill that raises taxes scores POSITIVE on taxation_spending
- If the vote has no meaningful impact on the dimension, score 0
- Abstentions score 0 unless the abstention itself had a decisive policy consequence

The 7 dimensions:
- growth_development: Pro-growth (+) vs. preservation (-)
- taxation_spending: Lower taxes (+) vs. higher services (-)
- education: More school funding (+) vs. less/vouchers (-)
- environment: Environmental protection (+) vs. development priority (-)
- public_safety: More police/fire (+) vs. alternative approaches (-)
- housing: Govt mandates for affordable housing (+) vs. market-led (-)
- transparency: Open government (+) vs. reduced disclosure (-)

Always reason step by step before giving your final score.
```

**User prompt template:**
```
Score this vote on the {dimension} dimension.

Issue: {issue_title}
Description: {issue_description}
Vote cast: {vote_cast}
Bill number: {bill_number}

Step 1 — What did this vote actually do in policy terms?
Step 2 — Does the policy impact support or oppose {dimension} values?
Step 3 — How strong is the impact?

Return JSON only:
{"score": -2|-1|0|1|2, "rationale": "One plain-English sentence from a voter's perspective"}
```

---

## Data Integrity Rules — Never Violate These

1. **Humans enter facts. Claude scores them. Community replaces Claude permanently.**
2. No human at CivicMarket ever assigns a dimension score to a vote manually. This is the bias protection.
3. `source_url` is required on every voting record. No source = no record.
4. `ai_draft_score` is labeled "Pending Community Review" in the UI until `community_score_final` is locked.
5. Challenger candidates with no voting records get `data_completeness = 'pulse_only'` and `has_dna_score = false`. This is not an error — label it clearly in the UI.

---

## Design System v2

**Fonts:** Syne (headings/labels) · Instrument Sans (body)
**Direction:** Modern Civic Consumer — not a government tool

### Color Tokens
```
--bg-app:         #F6F8FA
--bg-card:        #FFFFFF
--teal-bright:    #00C9A7   /* primary CTA, match rings ≥70% */
--teal-deep:      #00A688   /* hover */
--teal-soft:      #E6FAF6   /* chip backgrounds */
--slate-900:      #0D1117   /* headings, nav bg */
--slate-700:      #374151   /* body text */
--slate-500:      #6B7280   /* secondary text */
--slate-200:      #E5E7EB   /* borders */
--coral-bright:   #FF6B6B   /* match <45%, opposed */
--coral-soft:     #FEF2F2
--amber-bright:   #F59E0B   /* match 45-69%, mixed */
--amber-soft:     #FFFBEB
--indigo:         #4338CA   /* state scope tags */
--level-titan:    linear-gradient(135deg, #7C3AED, #A855F7)
```

### Key Design Rules
- Cards: `border-radius: 20px`
- Top nav sections: dark `#0D1117` with teal glow on all screens
- Scope tags: City → teal · County → blue · State → indigo
- Civic level badge appears on profile AND next to every review
- Never block the user — always invite
- Every screen needs a loading state and an error state — no blank screens

---

## Screens (13 total — all have HTML demos)

| Screen | Route |
|---|---|
| Welcome | onboarding step 0 |
| Account Creation | onboarding step 1 |
| ZIP Entry | onboarding step 2 |
| District Confirmation | onboarding step 3 |
| DNA Teaser | onboarding step 4 |
| DNA Quiz | onboarding step 5 |
| Home | `/` |
| Ballot | `/ballot` |
| Candidate Profile | `/candidates/[id]` |
| Measure Profile | `/measures/[id]` |
| Vote | `/vote` |
| Profile | `/profile` |
| Archive | `/ballot` (Past toggle) |

HTML demos for all screens are in the project outputs folder. Use them as the visual reference when building each screen.

---

## Navigation

**4 bottom tabs:** 🏠 Home · 🗳️ Ballot · 📍 Vote · 👤 Profile
**Back navigation:** Always `router.back()` — contextual, not hardcoded
**Archive:** Inside Ballot as "Upcoming | Past" toggle — not a separate tab

### Context-Aware Home Screen
- `< 60 days` to election → election countdown hero + match scores + feed below
- `>= 60 days` → civic feed hero + small election date pill at top
- Threshold stored in `app_settings.election_mode_days_threshold`

---

## Onboarding Flow

| Step | Content | Required |
|---|---|---|
| 0 | Value prop — animated | First time only |
| 1 | Account creation — email or Google OAuth | Yes |
| 2 | ZIP entry + district lookup | Yes |
| 3 | District confirmation + ballot preview | Yes |
| 4 | DNA teaser — take now or later | Yes |
| 5 | DNA Quiz — 14 questions, auto-advance | Optional |
| 6 | Match calculation screen → Ballot | Only if quiz taken |

DNA quiz is deferred. Match scores show 🔒 until complete. Nudge system drives completion.

On Step 3, auto-follow all candidates in the user's districts:
```typescript
await supabase.from('follows').insert(
  candidates.map(c => ({ user_id: userId, candidate_id: c.id, is_auto_followed: true }))
)
```

---

## Verification Tiers

| Tier | Beta status | Unlocks |
|---|---|---|
| 0 | Active | Read + write reviews (zero weight) |
| 1 (SMS) | DEFERRED post-beta | Reviews count toward sentiment |
| 2 (Address) | DEFERRED post-beta | Community scores count toward threshold |

**Beta gate:** Invite code checked at signup instead of SMS. Simple string match is fine.

---

## Admin UI — Beta Scope (2 Forms Only)

`/admin` — password protected via `is_admin = true` on profiles row.

**Form 1: Voting Record Entry**
Fields: candidate_id, issue_title, issue_description, bill_number, vote_date, vote_cast, dimension, source_url (required)
On save → triggers Agent 4 (Claude scoring)

**Form 2: Review Removal**
Shows flagged reviews. Actions: Remove or Keep.

Everything else managed directly via Supabase Studio during beta.

---

## Civic Feed — Beta Approach

The civic feed UI is fully built and wired to the `civic_feed` table. During beta, rows are entered manually via Supabase Studio — no Agent 5 automation, no Firecrawl.

**Minimum 5 feed entries required at launch.**

Feed fields to populate manually:
- `title` — short headline
- `description` — 2-3 sentence plain English summary
- `source_url` — link to original agenda/document
- `meeting_date` — date of meeting or publication
- `dimensions[]` — array of affected dimension keys
- `urgency` — routine | significant | major
- `district_id` — which district this affects
- `expires_at` — optional, set 30 days out for routine items

---

## Edge Functions

**`compute-matches`** — reads civic_dna, scores all candidates/measures, calls Claude API for rationale, upserts match_scores. Triggered after quiz completion.

**`civic-lookup`** — 4 actions:
- `lookup_address` → districts + `is_ambiguous` flag
- `disambiguate_zip` → street_name + ZIP → resolved districts
- `polling_locations` → election-day + early voting sites
- `registration_check` → FL Division of Elections status

**`analyze-sentiment`** — nightly cron 2 AM EST. Classifies reviews by dimension → updates sentiment_scores → triggers recompute_candidate_positions()

**`agent-scoring`** — triggered by approved voting record entry. Calls Claude API with scoring prompt. Writes ai_draft_score back to voting_records. Auto-commits — no staging queue for beta.

---

## Beta Hard Blockers

Do not invite a single user until all of these are true:

1. v4 schema deployed and verified (25 tables)
2. Real PSL candidate data seeded (researcher data)
3. Auth working (email + Google OAuth)
4. Invite code gate implemented at signup
5. Terms of Service published
6. Privacy Policy published
7. Corrections Policy published
8. Report Inaccuracy button on all profile pages
9. Data Sources section on all profile pages
10. Voting record entry form working + Agent 4 firing
11. Claude scoring prompt validated against 5 real PSL votes
12. Civic feed has minimum 5 manual entries

---

## 10-Week Build Order

```
WEEK 1:  Schema deploy → Auth → Environment → Hire researcher
WEEK 2:  Seed real PSL data → Claude scoring prompt validated
WEEK 3:  Onboarding Steps 0-6 wired to Supabase
WEEK 4:  Ballot screen + Home screen
WEEK 5:  Candidate profile + Measure profile
WEEK 6:  agent-scoring Edge Function → compute-matches → match scores live
WEEK 7:  Civic feed UI (manual) → Vote screen → Profile screen → Archive
WEEK 8:  Shared components → error handling pass → Report Inaccuracy + Data Sources
WEEK 9:  Legal docs → invite code gate → mobile testing
WEEK 10: Deploy to Vercel → smoke test → beta invitations
```

---

## What NOT to Build During Beta

If asked to build any of the following, stop and confirm with the developer first:

- Agent 5 / Firecrawl integration
- Twilio SMS verification
- PWA manifest or service worker
- Full 5-tab Admin UI
- Agent 1, 2, or 3
- Voter roll matching
- Push notifications
- Expo / React Native anything
- Search functionality
- Premium user tier
- Campaign portal

---

*CivicMarket v2.2 · Port St. Lucie, FL Pilot · Beta target: mid-July 2026*
