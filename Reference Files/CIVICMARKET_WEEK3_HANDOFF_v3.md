# CivicMarket — Week 3 Handoff v3
> Paste this entire file at the start of a new chat session.
> Also paste CIVICMARKET_PROJECT_KNOWLEDGE.md and CIVICMARKET_PATCH_MAY12.md alongside this file.
> Updated: May 14, 2026 — reflects all work completed in the May 14 build session.

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
| Frontend | Next.js 16.2.4 (App Router), TypeScript, Tailwind CSS |
| Backend | Supabase (PostgreSQL, Auth, Edge Functions) |
| AI — Scoring | Anthropic Claude API (claude-sonnet-4-5) |
| Email | Resend (free tier) |
| Deployment | Vercel + Supabase |

---

## Strategy Decisions (Locked)

**Building with dummy data first.** Real PSL research is deferred to the end, just before beta invitations go out. This unblocks all development and avoids being stalled on data collection.

**Agents 1-3 are post-beta.** Research is done manually. Automation justified only when expanding beyond PSL.

**Researcher posting date: June 9th.** Upwork job post drafted and ready. 3-week turnaround puts data back ~July 1, leaving 2 weeks for review, entry, and validation before mid-July beta.

---

## What Was Completed in Weeks 1-2

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

### Supabase Auth — Status as of May 14
- ✅ `handle_new_user()` trigger working — auto-creates profiles row on signup
- ✅ Admin account created and verified
- ✅ Auth redirect URLs configured:
  - `http://localhost:3000/auth/callback`
  - `https://*.vercel.app/auth/callback`
- ✅ Email confirmation **OFF** (disabled for dev — re-enable before beta)
- ❌ Google OAuth — deferred, add after core screens work
- ❌ Resend — deferred, add in Week 4

---

## What Was Completed in Week 3 (May 14 Session)

- ✅ `@next/font` package removed (was unused, caused warning)
- ✅ `src/app/layout.tsx` — fully customized (Syne + Instrument Sans fonts, CivicMarket colors, NavBar component)
- ✅ `src/components/NavBar.tsx` — created, hides on all `/onboarding/*` routes
- ✅ `src/app/onboarding/layout.tsx` — dark background, no nav, wraps all onboarding screens
- ✅ Onboarding Step 0 — Welcome screen (`src/app/onboarding/page.tsx`) — renders correctly
- ✅ Onboarding Step 1 — Signup screen (`src/app/onboarding/signup/page.tsx`) — real Supabase auth working, test user created and confirmed
- ✅ Onboarding Step 2 — ZIP entry screen (`src/app/onboarding/zip/page.tsx`) — ZIP validation, district lookup, writes to `profiles` and `user_districts` — confirmed 5 rows written to DB

### Data Integrity Confirmed (May 14)
- ✅ `districts` table — 5 rows with correct hardcoded UUIDs
- ✅ `candidates` table — 8 rows, all `district_id` values match districts table
- ✅ `user_districts` join confirmed working — ZIP → 5 districts written correctly

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
│   │   ├── layout.tsx          ✅ Customized — Syne/Instrument Sans, NavBar
│   │   ├── page.tsx            (default Next.js boilerplate — replace in Week 4)
│   │   └── onboarding/
│   │       ├── layout.tsx      ✅ Dark bg, no nav
│   │       ├── page.tsx        ✅ Welcome screen (Step 0)
│   │       ├── signup/
│   │       │   └── page.tsx    ✅ Account creation (Step 1)
│   │       └── zip/
│   │           └── page.tsx    ✅ ZIP entry (Step 2)
│   ├── components/
│   │   └── NavBar.tsx          ✅ Hides on /onboarding/*
│   └── lib/
│       └── supabase.ts         ✅ Created
├── .env.local                  ✅ Configured
├── AGENTS.md
├── civicmarket_build_guide.md  ✅ 67 KB
├── CLAUDE.md                   ✅ 19 KB
├── next.config.ts
├── package.json
└── tsconfig.json
```

---

## Database — Dummy Data UUIDs (Hardcoded — Use These Everywhere)

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

## ZIP → District Lookup (Beta Approach — Hardcoded)

All PSL ZIPs map to all 5 districts. No Edge Function needed for beta.

```typescript
const PSL_ZIPS = ['34952', '34953', '34983', '34984', '34986', '34987', '34988'];

const ALL_PSL_DISTRICTS = [
  { id: '11111111-0000-0000-0000-000000000001', name: 'City Council District 1', scope: 'city' },
  { id: '11111111-0000-0000-0000-000000000002', name: 'School Board District 1', scope: 'county' },
  { id: '11111111-0000-0000-0000-000000000003', name: 'St. Lucie County Commission At-Large', scope: 'county' },
  { id: '11111111-0000-0000-0000-000000000004', name: 'FL House District 85', scope: 'state' },
  { id: '11111111-0000-0000-0000-000000000005', name: 'FL Senate District 27', scope: 'state' },
];
```

---

## Remaining Week 3 Build Order

```
Step 6  — Onboarding Step 3 — District confirmation + ballot preview
           Route: /onboarding/districts
           Query: candidates table filtered by district_id IN (user's 5 districts)
           Shows: grouped list of candidates by race, incumbent badge
           Auto-follows all candidates on this screen

Step 7  — Onboarding Step 4 — DNA teaser (take now or later)
           Route: /onboarding/dna-teaser
           "Take now" → /onboarding/quiz
           "Skip for now" → / (home)

Step 8  — Onboarding Step 5 — DNA Quiz (14 questions, auto-advance)
           Route: /onboarding/quiz
           Writes to: civic_dna_answers (raw), civic_dna (computed averages with reversal)

Step 9  — Onboarding Step 6 — Match calculation transition screen
           Route: /onboarding/calculating
           Shows: "Calculating your matches..." animation → redirects to /ballot

Step 10 — Wire quiz answers to civic_dna_answers and civic_dna tables
           Reversal: REVERSED_QUESTIONS = [8,9,10,11,12,13,14]
           Reversal at compute time only — raw answers stored as-is
```

---

## Design System (Quick Reference)

**Fonts:** Syne (display/headings) · Instrument Sans (body)
```css
font-family: var(--font-syne)       /* headings, labels, buttons */
font-family: var(--font-instrument-sans)  /* body text */
```

**Key colors:**
```
bg-[#0D1117]     — dark background (onboarding, nav)
bg-[#F6F8FA]     — app background (main screens)
bg-[#1F2937]     — card/input background
text-[#FFFFFF]   — primary text on dark
text-[#6B7280]   — secondary/muted text
text-[#9CA3AF]   — placeholder/label text
bg-[#00C9A7]     — teal CTA / positive
bg-[#FF6B6B]     — coral / error / negative
bg-[#F59E0B]     — amber / mixed
border-[#374151] — default border
border-[#1F2937] — subtle border
```

**Scope tag colors:** City → teal · County → blue · State → indigo

---

## Coding Conventions

- Always TypeScript — no `.js` files in `src/`
- Always Tailwind — no inline styles in components
- Supabase client — always import from `src/lib/supabase.ts`
- Supabase queries — always in `src/lib/` helpers, never in page components
- `source_url` required on every `voting_records` row — no exceptions
- Never expose `SERVICE_ROLE_KEY` to the browser
- All dimension keys must exactly match the 7 keys (snake_case)
- Match scores: always integers 0-100
- Dimension scores: always -2.0 to 2.0
- Reversal always at compute time — never at write time

---

## Week 3 Milestone Checklist

- ✅ Auth redirect URLs configured
- ✅ Email confirmation off for dev
- ✅ layout.tsx customized (fonts, colors, NavBar)
- ✅ Onboarding Step 0 — Welcome screen rendering
- ✅ Onboarding Step 1 — Account creation working (real Supabase signup)
- ✅ Onboarding Step 2 — ZIP entry → districts written to DB
- [ ] Onboarding Step 3 — District confirmation showing real candidates
- [ ] Onboarding Step 4 — DNA teaser with skip option
- [ ] Onboarding Step 5 — DNA Quiz all 14 questions, auto-advance
- [ ] Onboarding Step 6 — Match calculation transition screen
- [ ] Quiz answers writing to `civic_dna_answers` and `civic_dna` with reversal applied
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

## How to Start a New Claude Code Session

Always start every Claude Code session in VS Code with:
```
Read CLAUDE.md and civicmarket_build_guide.md first, then [your task]
```

---

## If You Hit an Error

Paste this at the start of your message:
```
I'm building CivicMarket (Port St. Lucie civic engagement app).
I'm on Week 3 of the build. Here's the error I'm hitting: [describe error]
```

Then paste the exact error message or screenshot.

---

*CivicMarket Week 3 Handoff v3 · Updated May 14, 2026*
*Session changes: Auth redirect URLs configured, email confirmation disabled, layout.tsx customized, NavBar component created, onboarding layout created, Steps 0-2 built and verified, data integrity confirmed (districts ↔ candidates join working, user_districts writing correctly)*
