# CivicMarket ChatGPT Handoff - May 17 Part 3

## Start here

Project path:
J:\CivicMarket

At the start of the next session, run:

cd J:\CivicMarket
git status
git log --oneline -12

Expected status:
On branch master
nothing to commit, working tree clean

Latest confirmed commit:
415e732 Apply coastal mobile UI design system

## Latest confirmed commits

415e732 Apply coastal mobile UI design system
588e687 Polish pass: SVG nav icons, active pip, tappable candidate rows
fe36760 UI design alignment pass - light background, white cards, active nav
a2143c0 Archive older ChatGPT handoff files
5e76bd8 Add May 17 part 2 handoff
2ac29f1 Document smoke test UI fixes resolved
707b700 Add Report an Inaccuracy link to candidate profile
66d2518 Add profile sign out button
153a356 Show ballot match rings
cdbed48 Document post-grant-patch smoke test
51ca84d Document Supabase grant security patch
e5d6691 Document admin voting-record removal

## Work completed after Part 2 handoff

1. Archived older handoff files
- Commit: a2143c0
- Moved older handoff files into docs/handoffs.
- Root handoff remained focused on the newest active handoff.
- No app logic changed.

2. First UI alignment pass
- Commit: fe36760
- Updated the app away from the prior flat/default look.
- Added light app background, white rounded cards, active nav treatment, and improved visual hierarchy.
- This pass was visually better but still did not match the approved mockup closely enough.

3. Nav and row polish
- Commit: 588e687
- Replaced emoji nav icons with SVG icons.
- Added active teal nav pip.
- Improved tappable candidate rows.
- Removed the square-looking click/focus issue on nav items.
- Lint and build passed.

4. Final approved visual direction selected
- User selected a coastal Florida mobile app direction.
- Desired style is a mix of Nextdoor, Yelp, and Amazon:
  - Nextdoor: local/community feel
  - Yelp: profile/review/list card feel
  - Amazon: scannable browse and strong CTA hierarchy
- Teal was locked as the primary action/accent color.
- Palm/coastal imagery was locked as important to brand identity.

5. Generated and added brand image assets
- Commit: 415e732
- Added approved design reference:
  docs/design/approved-mobile-ui-reference.png
- Added brand assets:
  public/brand/home-hero-coastal.png
  public/brand/candidate-hero-palms.png
  public/brand/dna-hero-coastal-light.png
  public/brand/florida-coast-hero.svg
- Claude Code was instructed to use these exact assets instead of trying to generate art in CSS.

6. Coastal mobile UI design system applied
- Commit: 415e732
- Added src/components/CoastalHero.tsx.
- Updated Home, Ballot, Candidate Profile, Measure Profile, Profile, Vote, and Onboarding screens.
- Updated floating nav.
- Updated MatchScoreRing.
- Added scenic coastal hero treatments.
- Added frosted/glass visual treatments.
- Added improved card styling, spacing, and teal primary CTAs.
- Added or improved countdown card, candidate ranks, tabs, and profile/account card styling.
- Renamed visible "Civic Pulse" references to "Civic Feed" where applicable.
- Improved Civic DNA readability with a frosted/white backing over the light coastal image.
- Lint and build passed before commit.

## Current UI design status

Current design is much closer to the approved rendering and has:
- Coastal Florida brand art.
- Teal primary buttons and accents.
- Dark scenic Home and Candidate hero areas.
- Light coastal Civic DNA screen.
- Floating rounded bottom nav.
- White rounded cards.
- Frosted glass election countdown card.
- More polished Candidate and Profile screens.
- Improved MatchScoreRing styling.

Important note:
The user cares strongly about these design elements:
- visible coastal sunrise/palm scene on Home
- candidate profile hero with large avatar and palm background
- light coastal Civic DNA screen
- teal as the primary CTA/accent color
- "Civic Feed" naming, not "Civic Pulse"

## Last known validation

Before commit 415e732:
- npm run lint passed.
- npm run build passed.
- Build output showed all app routes generated successfully:
  /
  /ballot
  /profile
  /vote
  /report
  /data-sources
  /admin/entry
  /admin/records
  /onboarding and onboarding subroutes
  /candidates/[id]
  /measures/[id]

After commit 415e732:
- git status showed clean.

## Recommended next step

Do a quick post-commit smoke test before starting data replacement.

Run:

cd J:\CivicMarket
npm run dev

Check these pages:
- /
- /ballot
- /profile
- /candidates/[one candidate]
- /onboarding/dna-teaser
- /vote
- /admin/entry
- /admin/records

Pass criteria:
- Home hero uses the coastal asset and countdown labels are readable.
- Civic DNA subtitle is readable.
- Bottom nav does not hide important content.
- Candidate profile still shows:
  - Campaign Website
  - Funding
  - Voting Record
  - Source links
  - Report Inaccuracy
- Profile still shows Sign out as a red/coral row.
- Admin entry and admin records still load.
- No hydration warning appears on the Home countdown.
- No blank screens.

## Current main priority after smoke test

Return to the planned beta blocker:
Replace dummy/placeholder PSL data with real validated PSL candidate, voting record, and funding data before beta invitations.

Recommended data workstream:
1. Start with read-only discovery only.
2. Identify current dummy rows.
3. Prepare real PSL candidate data.
4. Validate every official source URL before import.
5. Replace dummy candidates, voting records, and funding rows carefully.
6. Re-run smoke tests.
7. Test /measures/[id] once real measure data exists.

## Remaining beta blockers

- Real PSL candidate data replaces dummy data.
- Voting records have official source URLs.
- Funding rows have official source URLs.
- Legal pages exist.
- Invite code gate works.
- Report Inaccuracy database-backed submission exists or is explicitly deferred for beta.
- Email confirmation re-enabled.
- Real data and AI scores are validated.
- /measures/[id] smoke test pending until measure data exists.

## Important cautions

- Do not invite beta users yet.
- Do not delete real voting_records rows without exact approval.
- voting_records delete is hard delete.
- vote_community_scores cascade risk exists.
- For database/security/data replacement work:
  - Start with read-only checks.
  - State scope, expected result, no-change check, and test plan.
  - Apply the smallest possible change only after approval.
  - Verify afterward.
  - Document the result.
- Do not build Twilio, Firecrawl, Gemini automation, Agents 1/2/3, full admin dashboard, campaign portal, Expo app, federal races, voter roll matching, public launch features, or Edge Functions unless explicitly approved.
- Do not let future design passes remove the approved coastal brand assets unless explicitly approved.

## Suggested first prompt for next ChatGPT session

I am continuing CivicMarket from CIVICMARKET_CHATGPT_HANDOFF_MAY17_PART3.md.

Start one step at a time.

First, have me run:
cd J:\CivicMarket
git status
git log --oneline -12

Then help me do a quick post-commit UI smoke test for:
/
 /ballot
 /profile
 /candidates/[one candidate]
 /onboarding/dna-teaser
 /vote
 /admin/entry
 /admin/records

After that, help me return to the next beta blocker:
Replace dummy/placeholder PSL data with real validated PSL candidate, voting record, and funding data.

Before any SQL or data changes, start with read-only discovery only.
