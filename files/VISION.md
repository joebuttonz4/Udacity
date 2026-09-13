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


## Feed-specific tagging vocabulary

**Trigger:** 10 real items in `civic_feed`, or the start of screen 5 (Alerts),
whichever comes first.

**The problem.** The eight Civic DNA categories were designed to score
candidates — each one maps to a power the office controls, so the score
predicts how a person would govern. Feed items are about what is being
decided, which is a different axis. Some agenda items have no good home.

**Evidence so far** (Sep 14, 2026 City Council agenda, 30 items):
- Parks and recreation — fits weakly
- Water and wastewater operations — only as "infrastructure"
- Code enforcement / neighborhood property standards — no fit
- Litigation and legal matters — no fit

**Why this is deferred, not dismissed.** Feed tags are the alert mechanism,
not labels. They are matched against `profiles.top_issues`, which is set in
the onboarding `/issues` step and consumed by Alerts. Changing the vocabulary
changes onboarding and Alerts too, so it is a three-screen change, not a data
change.

**What to decide at the trigger:** whether feed tags become their own
vocabulary separate from the Civic DNA categories, and if so, what the
onboarding issue picker shows. Until then, tag with the closest of the eight
and keep a list of what did not fit.