# CivicMarket — Project Knowledge Base
> This document is the authoritative reference for the CivicMarket project. Always use this as the source of truth for architecture, data structures, design decisions, and conventions. Updated after the May 2026 architecture and design session.

---

## What CivicMarket Is

CivicMarket is a non-partisan, mobile-first civic engagement platform that matches voters to city, county, and state elections based on their personal values — scoped exclusively to races and measures the user can actually vote on. The product applies Amazon's discovery experience to local democracy: personalized match scores, proactive alerts, radical funding transparency, and zero-friction voting logistics.

**Core thesis:** Low voter participation isn't apathy — it's friction. CivicMarket removes the friction.

**Pilot market:** Port St. Lucie, FL (City Council D1, School Board D1, St. Lucie County At-Large, FL House D85, FL Senate D27)

**Scope rule:** City, county, and state elections only. Federal races are explicitly excluded. If a user cannot vote on it from their registered address, it does not appear in the app.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js (App Router), TypeScript, Tailwind CSS |
| Backend | Supabase (PostgreSQL, Auth, Edge Functions, Storage) |
| AI — Scoring & Matching | Anthropic Claude API (claude-sonnet-4-5) |
| AI — Civic Feed Extraction | Google Gemini API (gemini-2.0-flash) |
| Web scraping | Firecrawl (~$16/month Hobby plan) |
| SMS verification | Twilio Verify ($0.05/verification) |
| Email | Resend (free tier — 3k/month) |
| Notifications | Web Push (PWA) + Resend (email digest) |
| Deployment | Vercel (frontend) + Supabase (backend) |
| Mobile | PWA first, Expo (React Native) post-beta |

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
│   │   ├── admin/                      # Admin UI — password protected
│   │   │   ├── page.tsx
│   │   │   ├── staging/                # Agent staging queue
│   │   │   ├── reviews/                # Moderation queue
│   │   │   ├── agents/                 # Agent health dashboard
│   │   │   ├── entry/                  # Manual data entry
│   │   │   └── settings/               # app_settings editor
│   │   ├── onboarding/
│   │   │   └── page.tsx                # 6-step onboarding flow
│   │   ├── ballot/
│   │   │   └── page.tsx                # My Ballot + Archive toggle
│   │   ├── vote/
│   │   │   └── page.tsx                # Vote logistics (3 tabs)
│   │   ├── profile/
│   │   │   └── page.tsx                # User profile
│   │   ├── candidates/
│   │   │   └── [id]/page.tsx           # Candidate profile
│   │   └── measures/
│   │       └── [id]/page.tsx           # Measure profile
│   ├── components/
│   │   └── ui/
│   │       ├── CivicLevelBadge.tsx
│   │       ├── MatchScoreRing.tsx
│   │       ├── DimensionBar.tsx
│   │       ├── VerificationBadge.tsx
│   │       └── EmptyState.tsx
│   ├── lib/
│   │   ├── supabase.ts
│   │   ├── scoring.ts
│   │   ├── trust.ts                    # Trust score update logic
│   │   ├── civic-points.ts             # Civic points logic
│   │   └── agents/
│   │       ├── scoring.ts              # Agent 4 helpers
│   │       └── civic-feed.ts           # Agent 5 helpers
│   └── types/
│       └── index.ts
├── supabase/
│   └── functions/
│       ├── compute-matches/
│       ├── civic-lookup/               # Updated: ZIP disambiguation
│       ├── analyze-sentiment/
│       ├── agent-scoring/              # Agent 4 — NEW
│       ├── agent-civic-feed/           # Agent 5 — NEW
│       └── verify-phone/               # Twilio Verify — NEW
├── public/
│   ├── manifest.json                   # PWA manifest
│   ├── sw.js                           # Service worker
│   └── icons/
│       ├── icon-192.png
│       └── icon-512.png
├── .env.local
└── CIVICMARKET_PROJECT_KNOWLEDGE.md
```

---

## Environment Variables

```bash
# .env.local — never commit this file
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_xxxx

# Server-side only (set via Supabase dashboard secrets)
SUPABASE_SERVICE_ROLE_KEY=sb_secret_xxxx
ANTHROPIC_API_KEY=your-anthropic-key
GEMINI_API_KEY=your-gemini-key          # civic feed extraction only
GOOGLE_CIVIC_API_KEY=your-google-civic-key
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
TWILIO_VERIFY_SERVICE_SID=your-verify-sid
RESEND_API_KEY=your-resend-key
FIRECRAWL_API_KEY=your-firecrawl-key
```

---

## Database Schema (v4 — 25 Tables)

All tables have Row Level Security (RLS) enabled.

**Schema files:**
- `civicmarket_schema.sql` — v1 core tables
- `civicmarket_schema_v2.sql` — v2 voting records, sentiment, measure dimensions
- `civic-lookup/schema_v3.sql` — v3 user_districts, ballot_for_user view
- `civicmarket_schema_v4.sql` — v4 full architecture (AUTHORITATIVE — use this)

---

### Core Tables

**`profiles`** — extends auth.users, one row per user
```sql
id uuid PK (references auth.users)
display_name text
zip_code text
street_address text
street_name_used text              -- ZIP disambiguation, no house number
zip_district_ambiguous boolean DEFAULT false
district_id uuid FK → districts
verification_tier smallint DEFAULT 0
  -- 0 = email only
  -- 1 = SMS verified (real human)
  -- 2 = USPS address validated (resident) — voter roll post-beta
phone_verified_at timestamptz
phone_number_e164 text             -- E.164 format, never shown publicly
address_validated_at timestamptz
address_validation_source text     -- 'usps'|'voter_roll'
voter_roll_verified_at timestamptz
address_verified boolean DEFAULT false
civic_level text DEFAULT 'voter'   -- voter|pioneer|delegate|titan
civic_points int DEFAULT 0
dna_quiz_status text DEFAULT 'not_started'
dna_quiz_started_at timestamptz
dna_quiz_completed_at timestamptz
dna_nudge_dismissed_at timestamptz
verification_nudge_dismissed_at timestamptz
last_nudge_shown_at timestamptz
tos_agreed_at timestamptz
tos_version text
is_admin boolean DEFAULT false
banned_at timestamptz
ban_reason text
warned_at timestamptz
created_at timestamptz DEFAULT now()
```

**`user_districts`** — all districts a user belongs to
```sql
id uuid PK
user_id uuid FK → profiles
district_id uuid FK → districts
scope text                         -- city|county|state
ocd_id text
created_at timestamptz DEFAULT now()
UNIQUE(user_id, district_id)
```

**`civic_dna`** — computed dimension averages from quiz answers
```sql
id uuid PK
user_id uuid FK → profiles
growth_development numeric(4,2)    -- average of Q1 + Q8, range -2.0 to 2.0
taxation_spending numeric(4,2)
education numeric(4,2)
environment numeric(4,2)
public_safety numeric(4,2)
housing numeric(4,2)
transparency numeric(4,2)
created_at timestamptz DEFAULT now()
```
Note: Multiple rows allowed. Latest row = active DNA.

**`civic_dna_answers`** — raw individual quiz answers (14 questions)
```sql
id uuid PK
user_id uuid FK → profiles
question_number smallint           -- 1-14
dimension text
answer smallint                    -- -2 to 2
created_at timestamptz DEFAULT now()
```

**`districts`** — geographic voting areas
```sql
id uuid PK
name text
type text                          -- city_council|school_board|county|state
city text
state text
```

**`elections`** — specific election events
```sql
id uuid PK
name text
election_date date
district_id uuid FK → districts
```

**`candidates`** — one row per candidate per election
```sql
id uuid PK
name text
office text
district_id uuid FK → districts
election_id uuid FK → elections
photo_url text
bio text
website text
is_incumbent boolean DEFAULT false
appeared_on_ballot boolean DEFAULT true
archived_at timestamptz
```

**`ballot_measures`** — bills, bonds, referendums, zoning changes
```sql
id uuid PK
title text
plain_english_summary text
full_text_url text
district_id uuid FK → districts
election_id uuid FK → elections
type text                          -- bond|ordinance|zoning|referendum
archived_at timestamptz
```

**`candidate_funding`** — campaign finance data
```sql
id uuid PK
candidate_id uuid FK → candidates
total_raised numeric(12,2)
neighbor_donations numeric(12,2)
pac_corporate_funds numeric(12,2)
institutional_pct numeric(5,2) GENERATED -- auto-computed
source_url text
updated_at timestamptz DEFAULT now()
```

---

### Scoring Tables

**`voting_records`** — votes cast by candidates (objective facts only — no manual scores)
```sql
id uuid PK
candidate_id uuid FK → candidates
issue_title text
issue_description text             -- plain English, fed to Claude for scoring
bill_number text
vote_date date
source_url text NOT NULL           -- required — no vote without public record
vote_cast text                     -- for|against|abstain
dimension text                     -- one of the 7 dimension keys
ai_draft_score smallint            -- Claude-generated, -2 to 2
ai_draft_rationale text
ai_draft_generated_at timestamptz
ai_draft_model text                -- e.g. "claude-sonnet-4-5"
community_score_count int DEFAULT 0
community_score_final numeric(4,2) -- null until threshold met
community_score_locked_at timestamptz
created_at timestamptz DEFAULT now()
```

**`vote_community_scores`** — one row per verified voter per voting record
```sql
id uuid PK
voting_record_id uuid FK → voting_records
user_id uuid FK → profiles
score smallint                     -- -2 to 2
created_at timestamptz DEFAULT now()
UNIQUE(voting_record_id, user_id)
```

**`candidate_positions`** — computed weighted position per candidate
```sql
id uuid PK
candidate_id uuid FK → candidates
growth_development numeric(4,2)
taxation_spending numeric(4,2)
education numeric(4,2)
environment numeric(4,2)
public_safety numeric(4,2)
housing numeric(4,2)
transparency numeric(4,2)
vote_count int DEFAULT 0
community_score_count int DEFAULT 0
has_dna_score boolean DEFAULT false
data_completeness text             -- 'full'|'partial'|'pulse_only'
voting_weight numeric(3,2) DEFAULT 0.70
sentiment_weight numeric(3,2) DEFAULT 0.30
updated_at timestamptz DEFAULT now()
UNIQUE(candidate_id)
```

**`sentiment_scores`** — Claude-analyzed community sentiment per dimension
```sql
id uuid PK
candidate_id uuid FK → candidates
dimension text
score numeric(4,2)
review_count int DEFAULT 0
verified_review_count int DEFAULT 0
avg_rating numeric(3,2)
updated_at timestamptz DEFAULT now()
UNIQUE(candidate_id, dimension)
```

**`measure_dimensions`** — AI draft scores for ballot measures
```sql
id uuid PK
measure_id uuid FK → ballot_measures
growth_development smallint
taxation_spending smallint
education smallint
environment smallint
public_safety smallint
housing smallint
transparency smallint
scored_by text DEFAULT 'ai_draft'
ai_draft_generated_at timestamptz
community_score_count int DEFAULT 0
impact_summary text
UNIQUE(measure_id)
```

**`measure_community_scores`** — community scores for ballot measures
```sql
id uuid PK
measure_id uuid FK → ballot_measures
user_id uuid FK → profiles
dimension text
score smallint
created_at timestamptz DEFAULT now()
UNIQUE(measure_id, user_id, dimension)
```

**`match_scores`** — cached match % + Claude rationale
```sql
id uuid PK
user_id uuid FK → profiles
candidate_id uuid FK → candidates (nullable)
measure_id uuid FK → ballot_measures (nullable)
score smallint                     -- 0-100 integer
rationale text
computed_at timestamptz DEFAULT now()
UNIQUE(user_id, candidate_id, measure_id)
```

---

### Community Tables

**`reviews`** — star ratings and written reviews
```sql
id uuid PK
user_id uuid FK → profiles
candidate_id uuid FK → candidates (nullable)
measure_id uuid FK → ballot_measures (nullable)
rating smallint                    -- 1-5
body text
helpful_count int DEFAULT 0
verification_tier_at_submission smallint DEFAULT 0
review_weight numeric(3,2) DEFAULT 0.00
flagged_at timestamptz
flag_count int DEFAULT 0
flag_reasons text[]
moderation_status text DEFAULT 'active'
moderated_at timestamptz
moderated_by uuid FK → profiles
created_at timestamptz DEFAULT now()
UNIQUE(user_id, candidate_id, measure_id)
```

**`trust_scores`** — reputation score per user
```sql
id uuid PK
user_id uuid FK → profiles UNIQUE
score numeric(5,2) DEFAULT 50.00
updated_at timestamptz DEFAULT now()
```

**`trust_score_events`** — audit log of trust score changes
```sql
id uuid PK
user_id uuid FK → profiles
event_type text
delta numeric(5,2)
resulting_score numeric(5,2)
reference_id uuid
created_at timestamptz DEFAULT now()
```

**`civic_points_events`** — audit log of civic points changes
```sql
id uuid PK
user_id uuid FK → profiles
event_type text
points_delta int
resulting_points int
reference_id uuid
created_at timestamptz DEFAULT now()
```

---

### Social Tables

**`follows`** — candidate follows
```sql
id uuid PK
user_id uuid FK → profiles
candidate_id uuid FK → candidates
followed_at timestamptz DEFAULT now()
is_auto_followed boolean DEFAULT false
UNIQUE(user_id, candidate_id)
```

**`record_watch`** — notify when candidate records added
```sql
id uuid PK
user_id uuid FK → profiles
candidate_id uuid FK → candidates
created_at timestamptz DEFAULT now()
notified_at timestamptz
UNIQUE(user_id, candidate_id)
```

---

### Agent & Feed Tables

**`agent_staging`** — all agent output before going live
```sql
id uuid PK
agent_name text
target_table text
payload jsonb
source_url text NOT NULL
confidence numeric(3,2)
confidence_reasons text[]
status text DEFAULT 'pending'      -- pending|approved|rejected|auto_committed
reviewed_by uuid FK → profiles
reviewed_at timestamptz
auto_committed_at timestamptz
created_at timestamptz DEFAULT now()
```

**`agent_runs`** — agent health history
```sql
id uuid PK
agent_name text
started_at timestamptz DEFAULT now()
completed_at timestamptz
status text DEFAULT 'running'      -- running|completed|failed
records_processed int DEFAULT 0
records_staged int DEFAULT 0
records_auto_committed int DEFAULT 0
error_message text
error_detail jsonb
```

**`civic_feed`** — Agent 5 output
```sql
id uuid PK
title text
description text
source_url text
meeting_date date
dimensions text[]
urgency text DEFAULT 'routine'     -- routine|significant|major
district_id uuid FK → districts
generated_at timestamptz DEFAULT now()
expires_at timestamptz
```

**`monitored_sources`** — Agent 5 city-agnostic source config
```sql
id uuid PK
district_id uuid FK → districts
source_type text                   -- city_agenda|county_agenda|state_legislature|campaign_finance
source_url text
scrape_schedule text               -- cron expression
last_scraped_at timestamptz
is_active boolean DEFAULT true
agent_name text
notes text
```

**`app_settings`** — configurable operational parameters
```sql
key text PK
value text
description text
updated_at timestamptz DEFAULT now()
```

Seed values:
```sql
INSERT INTO app_settings VALUES
  ('community_score_threshold', '5', 'Verified scores to retire AI draft'),
  ('community_score_min_tier', '1', 'Min verification tier for threshold'),
  ('dna_nudge_delay_hours', '48', 'Hours after signup before DNA nudge'),
  ('election_alert_days_before', '30', 'Days before election for alert'),
  ('election_mode_days_threshold', '60', 'Days before election for home mode switch'),
  ('max_community_scores_per_day', 'unlimited', 'Rate limiting — revisit post-beta');
```

---

### Key View

**`ballot_for_user`** — every race a user can vote on
```sql
SELECT user_id, item_type, item_id, item_name, item_sub,
       scope, election_date, election_name,
       is_incumbent, has_dna_score, data_completeness
-- Joins: profiles → user_districts → candidates/ballot_measures → elections
-- Filters: election_date >= current_date, archived_at IS NULL
```

### Key Functions

**`recompute_candidate_positions(p_candidate_id uuid)`**
Uses `community_score_final` where available, falls back to `ai_draft_score`.
Sets `has_dna_score = false`, `data_completeness = 'pulse_only'` for no-record candidates.

**`check_community_score_threshold()`** — trigger on `vote_community_scores`
Reads threshold from `app_settings`. Counts only `verification_tier >= 1`.
Auto-locks score and fires `recompute_candidate_positions()` when threshold met.

---

## The 7 Civic DNA Dimensions

Keys must be used exactly as written (snake_case).

| Key | Label | What it measures |
|---|---|---|
| `growth_development` | Growth & Development | Pro-growth vs. preservation |
| `taxation_spending` | Taxes & Services | Lower taxes vs. higher services |
| `education` | Education | School funding, teacher pay |
| `environment` | Environment | Environmental protection vs. development |
| `public_safety` | Public Safety | Police/fire funding and approach |
| `housing` | Housing | Mandates vs. market-led development |
| `transparency` | Transparency | Open government, campaign finance disclosure |

**Scale:** -2 = strongly opposed · 0 = neutral · +2 = strongly supports

---

## Civic DNA Quiz — 14 Questions

Two questions per dimension. Interleaved order. City-agnostic — works for all races at all levels.
Quiz is deferred — not required during onboarding. Nudge system drives completion.
Each dimension score = average of both answers → stored as `numeric(4,2)` in `civic_dna`.

**Q1 — Growth & Development**
"Economic growth and new development are worth pursuing even when they come with tradeoffs like increased traffic, density, or reduced green space."

**Q2 — Taxes & Services**
"Government should prioritize keeping taxes low, even if it means scaling back public services and infrastructure investment."

**Q3 — Environment**
"Environmental regulations that protect air, water, and green space are worth enforcing even when they slow down development or raise costs for businesses."

**Q4 — Public Safety**
"Funding for police and fire services should be increased even when it requires cutting other parts of the public budget."

**Q5 — Education**
"Public schools should receive increased government funding for teacher pay, facilities, and programs even if it requires raising taxes."

**Q6 — Housing**
"Local government should require developers to include affordable housing units in new residential projects as a condition of approval."

**Q7 — Transparency**
"Elected officials should be required to publicly disclose all significant sources of campaign funding and potential conflicts of interest, regardless of the administrative burden."

**Q8 — Growth & Development (second pass)**
"Preserving the existing character of a community is more important than maximizing economic growth, even if it means slower job creation."

**Q9 — Taxes & Services (second pass)**
"Investing in high-quality public services and infrastructure is worth paying higher taxes, even when budgets are already stretched."

**Q10 — Environment (second pass)**
"When economic development and environmental protection conflict, the economic benefits to the community should take precedence."

**Q11 — Public Safety (second pass)**
"Investing in social services, mental health programs, and community outreach is as effective at improving public safety as increasing law enforcement funding."

**Q12 — Education (second pass)**
"Families should have more choice in how education funding is used, including options like charter schools and vouchers, even if it redirects money from traditional public schools."

**Q13 — Housing (second pass)**
"Housing affordability is best addressed by reducing regulations and zoning restrictions to allow the market to build more supply, rather than through government mandates."

**Q14 — Transparency (second pass)**
"The influence of large donors and outside money on local elections is a serious problem that requires stronger disclosure laws and contribution limits."

**Answer scale:** Strongly agree = +2 · Agree = +1 · Neutral = 0 · Disagree = -1 · Strongly disagree = -2

---

## Data Integrity Architecture

### The Core Model
Humans enter objective facts only. Claude scores provisionally. Community replaces Claude permanently.

### Flow
1. Researcher enters voting record with required source URL
2. Agent 4 fires on approval → Claude generates `ai_draft_score` labeled "Pending Community Review"
3. Verified users (Tier 1+) submit community scores
4. Trigger checks count against `app_settings.community_score_threshold`
5. When threshold met → `community_score_final` locked, AI draft retired, positions recomputed

### Challenger Candidates
No voting record → `has_dna_score = false`, `data_completeness = 'pulse_only'`.
Match score based on community sentiment only. Clearly labeled in UI — not a data error.

### Score Integrity
CivicMarket does not score votes. CivicMarket records facts. The community scores them.
No human at CivicMarket assigns a dimension score to a vote. This is the bias protection.

---

## Tiered Verification System

| Tier | Name | Method | Unlocks |
|---|---|---|---|
| 0 | Unverified | Email only | Read, write reviews (visible, zero weight on scores) |
| 1 | Real Human | SMS via Twilio Verify | Reviews in feed, count toward sentiment — DEFERRED post-beta (invite code gate used for beta) |
| 2 | PSL Resident | Address + USPS validation | Community scores count toward threshold |
| 3 (post-beta) | Verified Voter | Voter roll matching | Full weight scores |

**Important:** Area codes do NOT indicate location. Do not use for verification.
**ZIP disambiguation:** If ZIP spans multiple districts, prompt for street name only (no house number).

### Nudge System
1. Profile badge — verification tier dots always visible, tappable
2. Community score wall — unverified can submit, labeled "does not affect score"
3. Home screen banner — fires 48hrs after signup, dismissable
4. Election proximity alert — 30 days before election, once per cycle

---

## Trust Score System

Default: 50.0. Range: 0–100.

| Event | Delta |
|---|---|
| Complete DNA quiz | +5 |
| SMS verify | +10 |
| Address verify | +15 |
| Review gets 3+ helpful votes | +2 |
| Community score matches consensus ±0.5 | +3 |
| Engage 5 separate days | +1 |
| Review removed | -10 |
| Account warned | -20 |
| Account banned | -50 |
| Scores consistently diverge >1.5 from consensus | -5 |

Trust weighting: `trust_weight = 0.5 + (trust_score / 100) * 1.5`
All changes logged to `trust_score_events`.

---

## Civic Points & Level System

| Event | Points |
|---|---|
| Complete DNA quiz | +10 |
| SMS verify | +25 |
| Address verify | +50 |
| Submit review | +5 |
| Submit community score | +10 |
| Mark review helpful | +2 |
| Login on election day | +5 |
| First review on candidate with no reviews | +100 |

| Level | Range | Icon |
|---|---|---|
| Voter | 0–99 | 🗳️ |
| Pioneer | 100–499 | 🌱 |
| Delegate | 500–1,999 | 🏛️ |
| Titan | 2,000+ | ⬡ |

Civic level badge shown on profile AND next to every review. Titan badge has violet gradient.
All changes logged to `civic_points_events`.

---

## Match Scoring Algorithm

```typescript
// Per dimension — average two quiz answers first
const dimensionScore = (answer1 + answer2) / 2

// Per-dimension match
const diff = Math.abs(user_score - target_score) // 0 to 4
const dim_match_pct = (1 - diff / 4) * 100

// Final score
const score = Math.round(
  DIMENSIONS.reduce((sum, dim) => sum + dimMatch(dim), 0) / DIMENSIONS.length
) // 0-100 integer
```

Score colors: `>= 70%` → teal · `45-69%` → amber · `< 45%` → coral

Candidate DNA: Uses `community_score_final` if locked, else `ai_draft_score`.

Trust weighting for sentiment: `trust_weight = 0.5 + (trust_score / 100) * 1.5`

---

## Agent Architecture (Phased)

### Beta — Build Now

**Agent 4 — Scoring Agent** (`agent-scoring`)
Trigger: Database webhook on approved staging record.
Input: Approved voting record or ballot measure.
Calls Claude API with private scoring prompt → writes `ai_draft_score`.
Auto-commits always — source already human-approved.

**Agent 5 — Civic Feed Agent** (`agent-civic-feed`)
Schedule: Daily 6 AM EST.
Sources: `monitored_sources` table — city-agnostic.
Firecrawl fetches agenda PDFs → Gemini Flash extracts relevant items → `civic_feed` rows.
**Beta note:** Agent 5 automation is deferred post-beta. For beta, `civic_feed` rows are entered manually via Supabase Studio. The civic feed UI is built and wired — only the automation is deferred. Minimum 5 manual entries required at launch.

### Post-Beta — Build After Launch

- Agent 1 — Candidate Intake (FL DoE → candidates) · confidence threshold: 0.80
- Agent 2 — Voting Record (meeting minutes → voting_records) · threshold: 0.85
- Agent 3 — Funding (FL DoE finance → candidate_funding) · threshold: 0.90 · highest liability, build last

### Staging Pattern
All agent output → `agent_staging` first. Never directly to production.
High confidence → auto-commit. Low confidence → admin review queue.

---

## Edge Functions

**`compute-matches`** — reads civic_dna (averaging 2 answers per dimension), scores all candidates and measures, calls Claude API for rationale, upserts match_scores.

**`civic-lookup`** — four actions:
- `lookup_address` → districts + `is_ambiguous` flag
- `disambiguate_zip` → street_name + ZIP → resolved districts (NEW)
- `polling_locations` → election-day + early voting sites
- `registration_check` → FL Division of Elections status

**`analyze-sentiment`** — nightly cron 2 AM EST. Classifies reviews by dimension → sentiment_scores → recompute_candidate_positions().

**`agent-scoring`** (NEW) — triggered by approved staging records. Writes AI draft scores directly.

**`agent-civic-feed`** (NEW) — daily. Reads monitored_sources. Writes civic_feed rows.

**`verify-phone`** (NEW) — Twilio Verify:
- `POST /verify-phone/send` → sends SMS code
- `POST /verify-phone/check` → validates code, updates verification_tier

---

## Navigation Architecture

**4 bottom nav tabs:** 🏠 Home · 🗳️ Ballot · 📍 Vote · 👤 Profile

Archive lives inside Ballot as "Upcoming | Past" toggle — not a separate tab.
Election drill-down merged into Ballot — removed as separate route.

### Navigation Flow Decisions
- **Candidate profile → back:** Contextual (`router.back()`) — returns to wherever user came from
- **Feed item → detail:** Vote detail bottom sheet first, full profile one tap away
- **DNA quiz complete:** Transition screen "Calculating your matches..." → Ballot with rings animating in

### Context-Aware Home Screen
- **Within 60 days:** Election countdown + match scores hero. Feed below.
- **60+ days out:** Civic feed hero. Small election date pill persistent at top.
- Threshold configurable via `app_settings.election_mode_days_threshold`

---

## Onboarding Flow (6 Steps)

| Step | Content | Required |
|---|---|---|
| 0 | Value proposition — animated single screen | First time only |
| 1 | Account creation — email/password or Google | Required |
| 2 | ZIP code + district lookup | Required |
| 3 | District confirmation — ballot preview | Required |
| 4 | Civic DNA teaser — take now or later | Required |
| 5 | DNA Quiz — 14 questions, auto-advance | Optional (deferred) |
| 6 | Match calculation → Ballot | Only if quiz taken |

DNA quiz deferred. Match scores locked (🔒) until complete. Nudge system drives completion.

---

## Design System v2

**Direction:** Modern Civic Consumer (Direction B — locked)
**Fonts:** Syne (display/headings/labels) · Instrument Sans (body/descriptions)

### Color Tokens
```css
--white:          #FFFFFF;
--black:          #0D1117;
--bg-app:         #F6F8FA;
--bg-card:        #FFFFFF;
--bg-subtle:      #F3F4F6;
--teal-bright:    #00C9A7;    /* primary CTA, positive, match rings */
--teal-deep:      #00A688;    /* hover states */
--teal-soft:      #E6FAF6;    /* chip backgrounds */
--teal-mid:       #00B896;    /* ring fills, active tabs */
--slate-900:      #0D1117;
--slate-700:      #374151;
--slate-500:      #6B7280;
--slate-400:      #9CA3AF;
--slate-200:      #E5E7EB;
--slate-100:      #F3F4F6;
--coral-bright:   #FF6B6B;    /* opposed, PAC funding, low match */
--coral-soft:     #FEF2F2;
--amber-bright:   #F59E0B;    /* mixed match, bond measures */
--amber-soft:     #FFFBEB;
--indigo:         #4338CA;    /* state scope tags */
--indigo-soft:    #EEF2FF;
--level-titan:    linear-gradient(135deg, #7C3AED, #A855F7);
```

### Match Score Ring Colors
- `>= 70%` → `#00C9A7` (teal)
- `45-69%` → `#F59E0B` (amber)
- `< 45%` → `#FF6B6B` (coral)
- No DNA → dashed gray + 🔒

### Scope Tags
City → teal · County → blue · State → indigo

### Key Principles
- Rounded everywhere: `--radius-xl: 20px` cards, `--radius-full` chips
- Dark top nav sections on all screens (--black with teal glow)
- Consumer app feel — not a government tool
- Never block, always invite
- Civic level badge on profile AND next to every review

---

## Screens

All screens have interactive HTML demos in `/mnt/user-data/outputs/`.

| Screen | Route | File |
|---|---|---|
| Welcome | onboarding step 0 | civicmarket_onboarding_step0.html |
| Account Creation | onboarding step 1 | civicmarket_onboarding_step1.html |
| ZIP Entry | onboarding step 2 | civicmarket_onboarding_step2.html |
| District Confirmation | onboarding step 3 | civicmarket_onboarding_step3.html |
| DNA Teaser | onboarding step 4 | civicmarket_onboarding_step4.html |
| DNA Quiz | onboarding step 5 | civicmarket_onboarding_step5.html |
| Home | `/` | civicmarket_home.html |
| Ballot | `/ballot` | civicmarket_ballot.html |
| Candidate Profile | `/candidates/[id]` | civicmarket_candidate_profile.html |
| Measure Profile | `/measures/[id]` | civicmarket_measure_profile.html |
| Vote | `/vote` | civicmarket_vote.html |
| Profile | `/profile` | civicmarket_profile.html |
| Archive | `/ballot` (Past toggle) | civicmarket_archive.html |
| Design System | — | civicmarket_design_system_v2.html |

### Measure Profile Layouts
- **Bond/Ordinance/Referendum** → Financial breakdown: total, donut chart by category, tax impact per household
- **Zoning/Environmental** → Map visualization: affected parcel, conservation zones, river distance, opposition organizations

---

## Archive Rules

**Candidates:** Only archived if `appeared_on_ballot = true`. `archived_at` set post-election for losers. Winners remain active as officials. Never in main Ballot — archive only.

**Measures:** Archived 90 days after election date. Set by scheduled Edge Function (post-beta). Never in main Ballot — archive only.

---

## Admin UI

Password-protected at `/admin`. `is_admin = true` required on profiles row.

**Beta (2 forms only):**
1. **Voting Record Entry** — add voting records with required source URL. Triggers Claude scoring on save.
2. **Review Removal** — view flagged reviews, remove or keep. Basic moderation only.

All other admin capability handled directly via Supabase Studio during beta.

**Post-beta (full 5-tab UI):**
1. Staging Queue — approve/reject/edit agent output. Batch approve high-confidence.
2. Manual Data Entry — candidates, voting records, measures, funding forms.
3. Review Moderation — flagged reviews with reviewer history. Remove, keep, ban, warn.
4. Agent Health — last run, error logs, manual trigger. Email alert if agent down 48+ hours.
5. Settings — direct interface to `app_settings`. Beta mode toggle.

---

## Legal Requirements (Pre-Beta)

**Invite code gate** — required before any beta user. Simple code checked at signup. Controls who gets in during beta. Replaces SMS verification for beta.

Three legal documents required before any beta user:

**Terms of Service** — what service is/isn't, data accuracy disclaimer, community content rules, right to remove, no defamation, limitation of liability.

**Privacy Policy** — must cover: what's collected, what's NOT (SSN/financial), location used only for district lookup (never sold, never shared with campaigns), third-party services disclosed (Supabase, Google Civic API, Twilio, Anthropic Claude API, Google Gemini API, Firecrawl), 30-day post-deletion data retention.

**Corrections Policy** — 5-step public process: Submit → Acknowledge (48hrs) → Review (7 days) → Decision → Appeal. Candidates can dispute factual records. Cannot demand changes to community scores or match scores.

**Voter roll legal review:** Required before Tier 3 implementation. Florida Statute 97.0585. ~$200-300 attorney consult. Not needed for beta.

`tos_agreed_at` and `tos_version` stored on profiles at signup.

---

## Business Model

**Free for voters always. No advertising ever.**

Post-beta revenue:
1. Campaign portal — $50-200/month. Paying NEVER affects scores. Firewall explicit and public.
2. Civic organization subscriptions — $50-150/month for branded alerts + anonymous data.
3. Grants — Apply to Knight Foundation, Democracy Fund, Rita Allen Foundation immediately after beta.
4. Premium user tier — $3-5/month, advanced analytics. Post-beta.

---

## Geographic Expansion

**All three criteria must be met before expanding:**
1. 20% of registered users completed DNA AND submitted at least one community score
2. 80% of candidates have voting records with AI draft scores
3. 30 consecutive days of stability — no critical bugs, green agent health

**Adding city #2 is a data operation:** Insert rows into districts, elections, monitored_sources. No schema or algorithm changes.

---

## PWA Configuration

```json
{
  "name": "CivicMarket",
  "short_name": "CivicMarket",
  "description": "Your local elections, personalized.",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#F6F8FA",
  "theme_color": "#0D1117",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

Use `next-pwa` package. Beta service worker caches app shell only.

---

## Open Questions — All Resolved

| Question | Resolution |
|---|---|
| Review moderation | Rapid-response removal. Human in the loop. No pre-publication gating. |
| Civic feed data source | Agent 5 + Firecrawl parsing government agenda PDFs |
| Business model activation | Campaign portal post-beta. Grants immediately after launch. |
| Geographic expansion criteria | 3-criteria system (20% DNA, 80% coverage, 30-day stability) |
| State-level quiz dimensions | One general quiz for all races. City-agnostic. Local context added post-beta. |

---

## Coding Conventions

- Always TypeScript — no `.js` files in `src/`
- Always Tailwind — no inline styles in components (demos use inline for portability only)
- Always use supabase client from `src/lib/supabase.ts`
- All Supabase queries in `src/lib/` helpers — not in page components
- Edge Functions: TypeScript (Deno runtime)
- Never expose `SUPABASE_SERVICE_ROLE_KEY` to browser
- All dimension keys must exactly match the 7 keys (snake_case)
- Match scores: always integers 0-100
- Dimension scores: always -2.0 to 2.0
- `source_url` required on all voting_records — no exceptions
- Community score threshold always read from `app_settings` — never hardcoded

---

## Supabase Client Setup

```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

---

*Last updated: May 5, 2026 · CivicMarket v2.2 Pre-Beta · Port St. Lucie, FL Pilot*
*This session: AI stack → Claude API for scoring; beta scope cuts → Agent 5 deferred (manual feed), SMS deferred (invite code), Admin UI reduced to 2 forms, PWA deferred; timeline → 10 weeks to mid-July 2026*
