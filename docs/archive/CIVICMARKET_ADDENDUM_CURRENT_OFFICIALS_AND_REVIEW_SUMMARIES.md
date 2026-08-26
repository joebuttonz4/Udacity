# CivicMarket Build Plan Addendum
## Current Elected Officials + AI Review Summaries

**Purpose:** Restore two intended product features before additional UI build work continues:

1. Users can see their current elected officials for the districts they belong to.
2. Users can leave reviews for politicians and legislation, with an AI-generated summary of review themes shown above the review list, similar to Amazon review summaries.

**Status:** Add this before continuing Week 4 through Week 8 implementation.

---

## 1. Product Requirement: My Current Officials

### User story

As a signed-in user, I want to see the officials who currently represent me so I understand who is already in office, whether I can vote on that office, and where to review or research that official.

### Where it appears

Add a section called **My Current Officials** in these places:

1. Home screen, below the hero and above the civic feed.
2. Profile screen, below the Civic DNA card.
3. Optional later enhancement: a dedicated `/officials` page linked from Home and Profile.

### What each official card shows

Each current official card must show:

- Official name
- Office title
- District name
- Jurisdiction level: city, county, school board, state, federal
- Term start date, if known
- Term end date, if known
- Next election date, if known
- Whether this office is on the user's upcoming ballot
- Incumbent badge
- Link to candidate or official profile
- Source URL

### User-facing labels

Use these labels:

- **On your next ballot**
- **Not on your next ballot**
- **Current official**
- **Source: official government record**

Do not imply the user can vote on every current official in the next election. Some officials represent the user now but may not be up for election this cycle.

---

## 2. Database Additions

Add this migration after the existing v4 schema is deployed.

```sql
-- ============================================================
-- ADDENDUM: CURRENT ELECTED OFFICIALS + REVIEW SUMMARIES
-- ============================================================

CREATE TABLE IF NOT EXISTS current_officials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  office text NOT NULL,
  district_id uuid REFERENCES districts(id) ON DELETE CASCADE,
  jurisdiction_level text NOT NULL, -- city|county|school_board|state|federal
  photo_url text,
  website text,
  bio text,
  term_start date,
  term_end date,
  next_election_date date,
  source_url text NOT NULL,
  source_label text,
  candidate_id uuid REFERENCES candidates(id) ON DELETE SET NULL,
  is_on_next_ballot boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE current_officials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Current officials are publicly readable"
ON current_officials FOR SELECT
USING (true);

CREATE TABLE IF NOT EXISTS review_summaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid REFERENCES candidates(id) ON DELETE CASCADE,
  measure_id uuid REFERENCES ballot_measures(id) ON DELETE CASCADE,
  review_count int NOT NULL DEFAULT 0,
  average_rating numeric(3,2),
  summary_text text,
  positive_themes text[],
  critical_themes text[],
  neutral_themes text[],
  generated_by_model text,
  generated_at timestamptz DEFAULT now(),
  stale_after timestamptz,
  CHECK (
    (candidate_id IS NOT NULL AND measure_id IS NULL)
    OR
    (candidate_id IS NULL AND measure_id IS NOT NULL)
  )
);

ALTER TABLE review_summaries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Review summaries are publicly readable"
ON review_summaries FOR SELECT
USING (true);

CREATE UNIQUE INDEX IF NOT EXISTS review_summaries_candidate_unique
ON review_summaries(candidate_id)
WHERE candidate_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS review_summaries_measure_unique
ON review_summaries(measure_id)
WHERE measure_id IS NOT NULL;

CREATE OR REPLACE VIEW officials_for_user AS
SELECT
  ud.user_id,
  co.id,
  co.name,
  co.office,
  co.district_id,
  d.name AS district_name,
  co.jurisdiction_level,
  co.photo_url,
  co.website,
  co.bio,
  co.term_start,
  co.term_end,
  co.next_election_date,
  co.source_url,
  co.source_label,
  co.candidate_id,
  co.is_on_next_ballot
FROM user_districts ud
JOIN current_officials co ON co.district_id = ud.district_id
JOIN districts d ON d.id = co.district_id;
```

### Data rule

Do not seed any current official without a source URL from an official government source or official election source. No guessed officials. No unsourced term dates.

---

## 3. Review System Requirement

The existing `reviews` table stays in the build. Reviews are user opinions and must remain separate from factual voting records, funding data, and AI draft scoring.

### Reviews must support

- Candidate reviews
- Ballot measure reviews
- Star rating
- Review text
- Helpful count
- Verification tier badge
- Civic level badge
- Moderation status
- Flagging and admin removal

### Review list order

Default review sort:

1. Helpful reviews first
2. Higher verification tier next
3. Newer reviews next

### Review submission rules

- A user may leave one review per candidate or measure.
- A review must be clearly labeled as a community opinion.
- Reviews must not be treated as factual source data.
- Removed reviews must not appear publicly.

---

## 4. AI Review Summary Requirement

### User story

As a user, I want a short summary of what other users are saying so I can quickly understand the common themes before reading individual reviews.

### Placement

On candidate profile and measure profile pages, show an **AI Review Summary** card directly above the individual review list.

### Card content

The card should show:

- Average star rating
- Total active review count
- AI-generated theme summary
- Positive themes
- Critical themes
- Neutral or mixed themes, if present
- Last generated timestamp
- Label: **Summarized from community reviews. Not an official fact source.**

### Empty state

If fewer than 3 active reviews exist, do not generate a summary. Show:

> Not enough community reviews yet to summarize. Be one of the first to leave a review.

### Safety and accuracy rules

The AI summary must:

- Summarize only the submitted review text.
- Avoid stating allegations as facts.
- Use phrases like "reviewers say," "some reviewers mention," and "common themes include."
- Not introduce facts from outside the reviews.
- Not mention party affiliation unless reviewers explicitly mention it and it is summarized neutrally.
- Not recommend voting for or against anyone.
- Not summarize removed or flagged reviews.

---

## 5. Claude Code Task: Schema Addendum

Run this before UI work continues.

```text
Read CLAUDE.md first.

Add a new Supabase migration for Current Officials and AI Review Summaries.

Create:
1. current_officials table
2. review_summaries table
3. officials_for_user view
4. Public read RLS policies for current_officials and review_summaries
5. Unique partial indexes for one review summary per candidate or measure

Use the SQL from CIVICMARKET_ADDENDUM_CURRENT_OFFICIALS_AND_REVIEW_SUMMARIES.md.

Do not change existing table names.
Do not remove the existing reviews table.
Do not seed any fake officials.
After the migration, run the local project checks and report exactly what passed or failed.
```

---

## 6. Claude Code Task: Current Officials UI

```text
Read CLAUDE.md first.

Build the Current Officials feature.

Requirements:
- Create src/components/CurrentOfficialsSection.tsx
- Fetch from officials_for_user for the signed-in user
- Display one card per current official
- Show name, office, district_name, jurisdiction_level, term_end, next_election_date, and source link
- Show badge: "On your next ballot" when is_on_next_ballot = true
- Show badge: "Not on your next ballot" when is_on_next_ballot = false
- If candidate_id exists, clicking the card opens /candidates/[candidate_id]
- If candidate_id is null but website exists, show an external "Official website" link
- Add this section to src/app/page.tsx below the Home hero and above the civic feed
- Add this section to src/app/profile/page.tsx below the Civic DNA card
- Include loading, error, and empty states
- Mobile-first at 390px

Empty state copy:
"We could not find current officials for your districts yet. This section will appear after your district data is verified."

Do not display unsourced officials.
```

---

## 7. Claude Code Task: Review Summary Edge Function

```text
Read CLAUDE.md first.

Build a Supabase Edge Function at supabase/functions/summarize-reviews/index.ts.

Purpose:
Generate or refresh the AI Review Summary for a candidate or ballot measure.

Input POST body:
{
  "candidate_id": "uuid optional",
  "measure_id": "uuid optional"
}

Rules:
- Exactly one of candidate_id or measure_id is required
- Fetch only reviews where moderation_status = 'active'
- Exclude reviews where flag_count > 0 unless moderation_status = 'active' and flagged_at is null
- If fewer than 3 active reviews exist, upsert a review_summaries row with review_count and average_rating but summary_text = null
- Call Claude only when there are 3 or more active reviews
- The prompt must summarize user opinions only
- The prompt must not introduce external facts
- The output must be valid JSON

Return JSON shape from Claude:
{
  "summary_text": "2 to 4 plain-English sentences",
  "positive_themes": ["short theme", "short theme"],
  "critical_themes": ["short theme", "short theme"],
  "neutral_themes": ["short theme"]
}

Write to review_summaries:
- candidate_id or measure_id
- review_count
- average_rating
- summary_text
- positive_themes
- critical_themes
- neutral_themes
- generated_by_model = 'claude-sonnet-4-5'
- generated_at = now()
- stale_after = now() + interval '7 days'

Use ANTHROPIC_API_KEY from Edge Function secrets.
Add proper error handling.
Retry once if Claude returns invalid JSON.
```

---

## 8. Claude Code Task: Review UI + Summary Card

```text
Read CLAUDE.md first.

Update candidate and measure profile review sections.

Files:
- src/app/candidates/[id]/page.tsx
- src/app/measures/[id]/page.tsx

Add an AI Review Summary card above individual reviews.

Fetch:
- reviews table joined with profiles
- review_summaries row for this candidate or measure

Card requirements:
- Title: "AI Review Summary"
- Show average rating and review count
- If summary_text exists, show it
- Show positive themes, critical themes, and neutral themes if present
- Label clearly: "Summarized from community reviews. Not an official fact source."
- Show generated_at in friendly format
- If fewer than 3 active reviews, show empty state copy:
  "Not enough community reviews yet to summarize. Be one of the first to leave a review."

Review form requirements:
- Allow signed-in users to submit one review per candidate or measure
- Rating 1 to 5 required
- Body optional but encouraged
- On submit, insert or update the user's review
- After submit, call summarize-reviews for that candidate or measure
- Show loading and error states
- Do not show removed reviews
- Do not call the summary official or factual

Mobile-first at 390px.
```

---

## 9. Build Guide Placement

Add this addendum into the build guide in three places:

### Hard Blockers

Add:

- [ ] Current officials section shows sourced officials for the user's districts, or shows a clear verified-empty state
- [ ] Reviews can be submitted for candidates and measures
- [ ] AI Review Summary appears above reviews when 3 or more active reviews exist

### Week 2

Add after candidate data seeding:

- Seed current elected officials for each PSL beta district using official source URLs only.
- Do not seed guessed officials.
- Verify every current official has district_id and source_url.

### Week 5

Add to candidate and measure profile requirements:

- Review submission form
- AI Review Summary card above reviews
- Opinion-only disclaimer

### Week 6 or Week 7

Add:

- Deploy summarize-reviews Edge Function
- Test one candidate with 3 reviews
- Test one measure with fewer than 3 reviews

---

## 10. Testing Checklist

### Current officials

- [ ] New user completes ZIP lookup
- [ ] user_districts rows exist
- [ ] officials_for_user returns officials for those districts
- [ ] Home shows My Current Officials
- [ ] Profile shows My Current Officials
- [ ] Officials with candidate_id link to candidate profile
- [ ] Officials without candidate_id show official website or source link only
- [ ] No unsourced official appears

### Reviews

- [ ] User can submit candidate review
- [ ] User can update their own candidate review
- [ ] User can submit measure review
- [ ] Removed reviews do not display
- [ ] Review badges display civic level and verification tier

### AI Review Summary

- [ ] Candidate with fewer than 3 active reviews shows not-enough-reviews state
- [ ] Candidate with 3 active reviews generates summary
- [ ] Measure with 3 active reviews generates summary
- [ ] Summary does not include removed reviews
- [ ] Summary uses opinion language, not factual claims
- [ ] Summary refreshes after a new review submission

---

## 11. Risk Check

Scope: Adds current elected officials, review submission support, review summaries, one Edge Function, one view, and two new tables.

Result: Restores the original user-facing civic context and Amazon-style review summary experience.

No-change risk: Users may only see upcoming candidates, not current representatives. Reviews may feel incomplete and less useful without summary themes.

Testing: Pilot with one PSL user district, one candidate with 3 test reviews, and one measure with fewer than 3 reviews before wider rollout.

Security and accuracy assumptions: Current officials must be sourced from official records. AI summaries must summarize community opinions only and must not create factual claims.

Deferred enhancement: Dedicated `/officials` page, automatic official refresh from Google Civic API, review helpful voting, and scheduled weekly review-summary refresh can wait until after beta.
