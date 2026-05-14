# CivicMarket — Week 3 Handoff v2
> Paste this entire file at the start of a new chat session.
> Updated: May 12, 2026 — reflects all decisions made in the May 12 design session.

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

## Strategy Decisions (Locked)

**Building with dummy data first.** Real PSL research is deferred to the end, just before beta invitations go out. This unblocks all development and avoids being stalled on data collection.

**Agents 1-3 (candidate intake, voting records, funding automation) are post-beta.** Research is done manually. Automation is only justified when expanding beyond PSL.

**Researcher posting date: June 9th.** Upwork job post is drafted and ready to go live on that date. 3-week turnaround puts data back by ~July 1, leaving 2 weeks for review, entry, and validation before mid-July beta.

---

## What Was Completed in Weeks 1-2

Every item below is done and verified:

- ✅ Next.js project created at `J:\CivicMarket`
- ✅ Supabase project created: **CivicMarket-MVP** (us-east-2)
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
- ✅ Dummy PSL data seeded — 8 candidates, 5 districts, 5 elections, 19 voting records, 8 funding rows
- ✅ All voting records confirmed to have source_url (0 missing)

### Supabase Auth — Partial (Week 1)
- ✅ `handle_new_user()` trigger working — auto-creates profiles row on signup
- ✅ Admin account created and verified
- ❌ Google OAuth provider NOT yet enabled in Supabase dashboard
- ❌ Resend NOT yet connected for email verification / password reset
- ❌ Auth redirect URLs NOT yet configured for Next.js app

### Schema Fix Applied (Week 1)
```sql
ALTER FUNCTION handle_new_user() SECURITY DEFINER SET search_path = public;
ALTER TABLE profiles FORCE ROW LEVEL SECURITY;
```

---

## Dummy Data UUIDs (Hardcoded — Use These Everywhere)

### Districts
| Name | UUID |
|---|---|
| City Council District 1 | `11111111-0000-0000-0000-000000000001` |
| School Board District 1 | `11111111-0000-0000-0000-000000000002` |
| St. Lucie County Commission At-Large | `11111111-0000-0000-0000-000000000003` |
| FL House District 85 | `11111111-0000-0000-0000-000000000004` |
| FL Senate District 27 | `11111111-0000-0000-0000-000000000005` |

### Elections
| Name | UUID |
|---|---|
| PSL City Council D1 2026 | `22222222-0000-0000-0000-000000000001` |
| St. Lucie School Board D1 2026 | `22222222-0000-0000-0000-000000000002` |
| St. Lucie County Commission 2026 | `22222222-0000-0000-0000-000000000003` |
| FL House District 85 2026 | `22222222-0000-0000-0000-000000000004` |
| FL Senate District 27 2026 | `22222222-0000-0000-0000-000000000005` |

### Candidates
| Name | UUID | Incumbent |
|---|---|---|
| Maria Santos | `33333333-0000-0000-0000-000000000001` | Yes |
| David Okafor | `33333333-0000-0000-0000-000000000002` | No |
| Linda Marsh | `33333333-0000-0000-0000-000000000003` | Yes |
| Carlos Reyes | `33333333-0000-0000-0000-000000000004` | No |
| Patricia Nguyen | `33333333-0000-0000-0000-000000000005` | Yes |
| Robert Chambers | `33333333-0000-0000-0000-000000000006` | No |
| Angela Torres | `33333333-0000-0000-0000-000000000007` | Yes |
| James Whitfield | `33333333-0000-0000-0000-000000000008` | Yes |

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

All tables confirmed in Supabase with RLS enabled.

---

## The 7 Civic DNA Dimensions (Locked — May 12)

These keys must be used exactly as written everywhere in code.
Definitions are intentionally black and white — no ideology baked in, just direction of government action.

| Key | Label | + means | - means |
|---|---|---|---|
| `growth_development` | Growth & Development | More new development approved | Less new development approved |
| `taxation_spending` | Taxes & Services | Lower taxes, less spending | Higher taxes, more spending |
| `education` | Education | More public school funding | Less public school funding |
| `environment` | Environment | Stronger environmental regulation | Weaker environmental regulation |
| `public_safety` | Public Safety | More public safety budget | Less public safety budget |
| `housing` | Housing | More government housing intervention | Less government housing intervention |
| `transparency` | Transparency | More disclosure required | Less disclosure required |

**Scale:** -2.0 = strongly opposed · 0 = neutral · +2.0 = strongly supports

---

## Civic DNA Quiz — 14 Questions (Rewritten May 12)

Written at 6th grade reading level. "Our city" framing throughout.
Two questions per dimension. All second-pass questions (Q8-Q14) are reverse-scored.

**Answer scale:** Strongly agree = +2 · Agree = +1 · Neutral = 0 · Disagree = -1 · Strongly disagree = -2

---

**Q1 — Growth & Development**
"Our city should build more homes and businesses, even if it means our neighborhoods look and feel different."

**Q2 — Taxes & Services**
"Our city should keep taxes low, even if it means fewer public services."

**Q3 — Environment**
"Our city should have strict rules to protect the environment, even if it slows down building and raises costs."

**Q4 — Public Safety**
"Our city should spend more on public safety, even if it means cutting other services."

**Q5 — Education**
"Our city should spend more on public schools, even if it means higher taxes."

**Q6 — Housing**
"Our city should step in to make housing more affordable, through rules, subsidies, or building directly."

**Q7 — Transparency**
"Elected officials should have to share where their campaign money comes from and any conflicts of interest."

**Q8 — Growth & Development (second pass)**
"Our city should keep neighborhoods the way they are, even if it means less growth and fewer jobs."
*(reversed)*

**Q9 — Taxes & Services (second pass)**
"Our city should spend more on public services, even if it means higher taxes."
*(reversed)*

**Q10 — Environment (second pass)**
"Our city should ease environmental rules when they get in the way of jobs and growth."
*(reversed)*

**Q11 — Public Safety (second pass)**
"Our city should spend less on public safety and use that money for other community needs."
*(reversed)*

**Q12 — Education (second pass)**
"Our city should send more education money to charter schools and vouchers, even if public schools get less."
*(reversed)*

**Q13 — Housing (second pass)**
"Our city should stay out of housing and let builders decide what gets built and at what price."
*(reversed)*

**Q14 — Transparency (second pass)**
"Requiring elected officials to disclose all their funding and finances creates too much paperwork and invades their privacy."
*(reversed)*

---

## Dimension Mapping & Reversal Logic (Locked — May 12)

| Dimension | First Pass | Second Pass | Reversed? |
|---|---|---|---|
| `growth_development` | Q1 | Q8 | ✅ Yes |
| `taxation_spending` | Q2 | Q9 | ✅ Yes |
| `environment` | Q3 | Q10 | ✅ Yes |
| `public_safety` | Q4 | Q11 | ✅ Yes |
| `education` | Q5 | Q12 | ✅ Yes |
| `housing` | Q6 | Q13 | ✅ Yes |
| `transparency` | Q7 | Q14 | ✅ Yes |

**All 7 second-pass questions are reversed. No exceptions.**

### Reversal happens at compute time — not write time.

Raw answers stored as-is in `civic_dna_answers`. Reversal applied when computing averages into `civic_dna`. This preserves raw answers for future display to users.

```typescript
// One constant. One function. One place to audit.
const REVERSED_QUESTIONS = [8, 9, 10, 11, 12, 13, 14];

function applyReversal(questionNumber: number, rawAnswer: number): number {
  return REVERSED_QUESTIONS.includes(questionNumber) ? rawAnswer * -1 : rawAnswer;
}

// Each dimension score = average of both answers after reversal applied
function computeDimensionScore(q1Answer: number, q2Answer: number, q2Number: number): number {
  const q2Adjusted = applyReversal(q2Number, q2Answer);
  return (q1Answer + q2Adjusted) / 2;
}
```

---

## Design System (Locked — v2)

**Fonts:** Syne (display/headings) · Instrument Sans (body)

### Color Tokens
```css
--white:          #FFFFFF
--black:          #0D1117
--bg-app:         #F6F8FA
--bg-card:        #FFFFFF
--teal-bright:    #00C9A7    /* primary CTA, positive, match rings */
--teal-deep:      #00A688    /* hover states */
--teal-soft:      #E6FAF6    /* chip backgrounds */
--teal-mid:       #00B896    /* ring fills, active tabs */
--slate-900:      #0D1117
--slate-700:      #374151
--slate-500:      #6B7280
--slate-400:      #9CA3AF
--slate-200:      #E5E7EB
--slate-100:      #F3F4F6
--coral-bright:   #FF6B6B    /* opposed, low match */
--coral-soft:     #FEF2F2
--amber-bright:   #F59E0B    /* mixed match */
--amber-soft:     #FFFBEB
--indigo:         #4338CA    /* state scope tags */
--indigo-soft:    #EEF2FF
--level-titan:    linear-gradient(135deg, #7C3AED, #A855F7)
```

### Match Score Ring Colors
- `>= 70%` → `#00C9A7` (teal)
- `45-69%` → `#F59E0B` (amber)
- `< 45%` → `#FF6B6B` (coral)
- No DNA → dashed gray + 🔒

### Key Principles
- Rounded everywhere: 20px cards, full-radius chips
- Dark top nav on all screens (--black with teal glow)
- Consumer app feel — not a government tool
- Mobile-first — design for 390px width first

---

## Coding Conventions

- Always TypeScript — no `.js` files in `src/`
- Always Tailwind — no inline styles in components
- Supabase client — always import from `src/lib/supabase.ts`
- Supabase queries — always in `src/lib/` helpers, never in page components
- `source_url` required on every `voting_records` row — no exceptions
- Never expose `SERVICE_ROLE_KEY` to the browser
- All dimension keys must exactly match the 7 keys above (snake_case)
- Match scores: always integers 0-100
- Dimension scores: always -2.0 to 2.0
- Reversal always at compute time — never at write time

---

## Week 3 Goals

**Goal:** Onboarding flow (Steps 0-6) wired to real Supabase auth and district lookup. A new user can sign up, enter their ZIP, see their PSL ballot, and optionally take the DNA quiz.

### Build Order for Week 3

```
Step 1 — Finish Supabase Auth setup (Google OAuth + Resend + redirect URLs)
          NOTE: handle_new_user() trigger already working. Just the 3 remaining items.
          NOTE: Build email/password first. Layer Google OAuth after core screens work.
Step 2 — Customize layout.tsx (fonts, colors, bottom nav shell)
Step 3 — Onboarding Step 0 — Welcome screen (static)
Step 4 — Onboarding Step 1 — Account creation (wired to Supabase Auth)
Step 5 — Onboarding Step 2 — ZIP entry (hardcoded PSL ZIP mapping — no Edge Function yet)
Step 6 — Onboarding Step 3 — District confirmation + ballot preview
Step 7 — Onboarding Step 4 — DNA teaser (take now or later)
Step 8 — Onboarding Step 5 — DNA Quiz (14 questions, auto-advance)
Step 9 — Onboarding Step 6 — Match calculation transition screen
Step 10 — Wire quiz answers to civic_dna_answers and civic_dna tables
```

### Onboarding Flow Reference

| Step | Content | Required |
|---|---|---|
| 0 | Value proposition — animated single screen | First time only |
| 1 | Account creation — email/password or Google | Required |
| 2 | ZIP code + district lookup | Required |
| 3 | District confirmation — ballot preview | Required |
| 4 | Civic DNA teaser — take now or later | Required |
| 5 | DNA Quiz — 14 questions, auto-advance | Optional (deferred) |
| 6 | Match calculation → Ballot | Only if quiz taken |

### ZIP → District Lookup (Beta Approach)
The `civic-lookup` Edge Function is not built yet. For beta, use a hardcoded ZIP mapping:
- All PSL ZIPs (34952, 34953, 34983, 34984, 34986, 34987, 34988) → all 5 PSL districts
- If ZIP spans multiple districts → prompt for street name only (no house number) → resolve districts
- This is sufficient for the PSL-only pilot

### Key Auth Notes
- Use Supabase Auth email/password first — add Google OAuth after core screens work
- On signup → `handle_new_user()` trigger auto-creates profiles row
- After district lookup → write to `user_districts` table
- After quiz → write answers to `civic_dna_answers`, compute averages with reversal applied, write to `civic_dna`
- DNA quiz is optional — user can skip at Step 4 and go straight to Ballot

---

## Navigation Architecture

**4 bottom nav tabs:** 🏠 Home · 🗳️ Ballot · 📍 Vote · 👤 Profile

Archive lives inside Ballot as "Upcoming | Past" toggle.
Onboarding bypasses bottom nav entirely.

---

## How to Use Claude Code (VS Code Extension)

The Claude extension is open in VS Code on the right side panel ("Build with Agent").

Always start every Claude Code session with:
```
Read CLAUDE.md and civicmarket_build_guide.md first, then [your task]
```

---

## Week 3 Milestone Checklist

Do not start Week 4 until all are checked:

- [ ] Google OAuth enabled in Supabase dashboard
- [ ] Resend connected for email verification and password reset
- [ ] Auth redirect URLs configured for localhost:3000 and production
- [ ] layout.tsx customized (fonts, colors, bottom nav shell)
- [ ] Onboarding Step 0 — Welcome screen rendering
- [ ] Onboarding Step 1 — Account creation working (real Supabase signup)
- [ ] Onboarding Step 2 — ZIP entry → districts resolved
- [ ] Onboarding Step 3 — District confirmation showing real candidates
- [ ] Onboarding Step 4 — DNA teaser with skip option
- [ ] Onboarding Step 5 — DNA Quiz all 14 questions, auto-advance
- [ ] Onboarding Step 6 — Match calculation transition screen
- [ ] Quiz answers writing to `civic_dna_answers` and `civic_dna` tables with reversal applied correctly
- [ ] New user can sign up and reach the Ballot screen end-to-end

---

## Key Dates

| Date | Action |
|---|---|
| June 9, 2026 | Post researcher job on Upwork |
| ~July 1, 2026 | Researcher data expected back |
| ~July 1-7, 2026 | Review data, enter into Supabase, validate Claude scoring prompt |
| Mid-July 2026 | Beta invitations go out |

---

## Upwork Job Post (Ready to Go — Post June 9th)

**Title:** Civic Research Assistant — Local Government Records (Port St. Lucie, FL)

**Description:**

I need someone to research and compile publicly available information on local candidates and elections in Port St. Lucie, FL from official government sources only.

This is detail-oriented data research. Every row needs a source URL. No source URL, no row.

**What you'll research:**

5 races:
1. City Council District 1 — Port St. Lucie
2. School Board District 1 — St. Lucie County
3. County Commission At-Large — St. Lucie County
4. FL House District 85
5. FL Senate District 27

**What you'll deliver:**

A completed Google Sheets spreadsheet with 3 tabs:

Tab 1 — Candidates
- Full name, office seeking, incumbent (yes/no), campaign website, source URL

Tab 2 — Voting Records (incumbent candidates only)
- Candidate name, bill or agenda item number, plain English description (2-3 sentences, no jargon), date of vote, vote cast (for/against/abstain), source URL (official government domain only)

Tab 3 — Campaign Finance
- Candidate name, total raised, total from individual donors, total from PACs or corporations, source URL (FL Division of Elections only)

**Official sources to use — no others:**
- PSL City Council minutes: cityofpsl.com/government/city-council
- FL Division of Elections candidates: dos.myflorida.com/elections/candidates
- FL Division of Elections campaign finance: dos.myflorida.com/campaign-finance
- FL Legislature Senate: flsenate.gov
- FL Legislature House: myfloridahouse.gov
- St. Lucie County Commission: stlucieco.gov

**Rules:**
- Every row in Tab 2 and Tab 3 must have a source URL
- Official government domains only — no Wikipedia, news articles, or campaign websites for records or finance
- Plain English descriptions only — no legal language or jargon
- If you can't find a source URL, leave the row out and flag it

**Budget:** $400 fixed price
**Timeline:** 3 weeks from start date

**To apply:**
1. Have you researched local government records before? If so, what kind?
2. Have you used the FL Division of Elections website?
3. Can you complete this within 3 weeks?

---

## What's Coming in Week 4

Home screen + Ballot screen wired to real Supabase data. Match scores visible.

---

## If You Hit an Error

Paste this at the start of your message:
```
I'm building CivicMarket (Port St. Lucie civic engagement app).
I'm on Week 3 of the build. Here's the error I'm hitting: [describe error]
```

Then paste the exact error message or screenshot.

---

*CivicMarket Week 3 Handoff v2 · Updated May 12, 2026*
*Key changes from v1: Quiz questions rewritten (6th grade level, "our city" framing), dimension definitions clarified (black and white policy levers), all 7 second-pass questions now reversed, REVERSED_QUESTIONS = [8,9,10,11,12,13,14], reversal at compute time confirmed, researcher posting date June 9th, Upwork job post drafted.*
