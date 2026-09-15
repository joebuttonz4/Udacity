# CivicMarket — Vision (parked, dated)

Written September 8, 2026. Nothing in this file is in scope for the November 2026 beta. It exists so these ideas stop competing with the beta for hours.

## The thesis

Low local participation is friction, not apathy. People act on what's in their backyard when they know about it. CivicMarket is a community engagement platform, not an election app. Elections are one feature.

## Where this goes

1. **Feed** — agenda items, plain English, tagged to what you care about, with "what happened" after the vote. *(Beta.)*
2. **Reputation** — a visible, portable record of showing up, speaking, and getting things right. *(Ladder in beta; top rungs post-beta.)*
3. **Townhall** — verified candidates and officials with followings on the platform. Virtual townhall sessions, polls and surveys, idea solicitation, volunteer recruiting.
4. **Pipeline** — the people who climb the ladder become the next candidates. A Titan is, by construction, someone who could run.

## What has to be true first

The platform is two-sided. Officials come only if residents are there. Residents come only if the feed is good. So the feed is the wedge, and the November beta only has to prove one thing: residents will open, weigh in on, and show up for agenda items.

## Rules to carry forward

- Free for voters. No ads.
- Non-partisan by structure, not by promise: no official gains reach, rank, or favorable summaries by being active here.
- Every score shows its receipt.
- Never build a feature for city #2 before city #1 has users.

## Post-beta triggers (do not start before the trigger fires)

| Feature | Trigger |
|---|---|
| Delegate/Titan UI | Any user reaches Advocate |
| Official/candidate followings | 100+ weekly active residents |
| Polls and surveys by officials | 2+ verified officials active |
| Virtual townhall | A verified official asks for one |
| Volunteer recruiting | Campaign portal revenue live |
| Feed automation (Firecrawl/Gemini) | Manual feed proves retention |
| City #2 | 20% DNA + 80% coverage + 30 days stable (existing rule) |
| USPS address validation | Post-beta |
| ZIP-to-council-district boundary data | Real boundary source located |
| Google OAuth | Post-beta |
| Topics `housing_costs` and `government_transparency` | A real PSL agenda item that fits, found during the summer-meeting check |
| Location-based neighborhood alerts (e.g. single-lot easements) | Address verification moves beyond self-reported |


## Feed-specific tagging vocabulary — RESOLVED 2026-09-15

**Trigger fired.** It was set at 10 real items in `civic_feed` or the start of
screen 5 (Alerts), whichever came first.

**The decision: feed topics are their own vocabulary, separate from the eight
Civic DNA categories.**

**The problem it solved.** The eight Civic DNA categories were designed to
score candidates — each one maps to a power the office controls, so the score
predicts how a person would govern. Feed items are about what is being decided,
which is a different axis. Some agenda items had no good home.

**The evidence that produced the decision** (Sep 14, 2026 City Council agenda,
30 items):
- Parks and recreation — fits weakly
- Water and wastewater operations — only as "infrastructure"
- Code enforcement / neighborhood property standards — no fit
- Litigation and legal matters — no fit

Three of those four now have an honest home: `parks_recreation`,
`water_sewer_drainage`, and `neighborhood_rules`. Litigation still has none,
and deliberately gets zero topics — it appears in the feed and never alerts.

**The nine topics** (key → label → Civic DNA key):

| Key | Label | DNA key |
|---|---|---|
| `development_zoning` | Development & zoning | `growth_development` |
| `roads_traffic` | Roads & traffic | `infrastructure_traffic` |
| `water_sewer_drainage` | Water, sewer & drainage | `infrastructure_traffic` |
| `police_emergency` | Police & emergency services | `public_safety` |
| `taxes_fees_budget` | Taxes, fees & budget | `taxes_budget` |
| `environment_open_space` | Environment & open space | `environment_land` |
| `business_jobs` | Business & jobs | `economic_development` |
| `parks_recreation` | Parks & recreation | — |
| `neighborhood_rules` | Neighborhood rules | — |

**Rules.** An item carries 0, 1, or 2 topics, never more. An item with 0 topics
appears in the feed but never triggers an alert. The profile field splits in
two: `profiles.alert_topics` holds feed topic keys picked in onboarding and
drives Alerts; `profiles.top_issues` holds Civic DNA keys, is set only after
the quiz, and is used only for match weighting. The topic → DNA mapping
pre-fills the post-quiz weighting picker and nothing else — it is many-to-one
and does not invert, so it is not a migration path.

Source of truth: `src/lib/topics.ts`, enforced by CHECK constraints in
`supabase/migrations/civicmarket_schema_addendum_feed_topics.sql` and kept in
sync by `src/lib/__tests__/topics.test.ts`.