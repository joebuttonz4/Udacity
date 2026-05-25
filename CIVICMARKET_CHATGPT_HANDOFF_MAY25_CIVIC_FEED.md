# CivicMarket ChatGPT Handoff - May 25, 2026

## Session purpose

This session revisited the CivicMarket civic feed and repositioned it from a secondary election-cycle feature into a core year-round civic intelligence pillar.

The goal is for CivicMarket to become useful outside election season by giving residents a personalized feed of local government activity, public notices, development/zoning items, meetings, infrastructure updates, civic opportunities, and election-related information.

## Major product decision

The civic feed is now treated as a platform system, not just a feature.

New framing:

CivicMarket should become a year-round civic awareness platform powered by beta-safe civic intelligence.

Beta-safe civic intelligence means:

AI-powered personalized local government awareness.

This does not mean autonomous AI publishing, unrestricted public posting, or fully automated scraping in beta.

## Civic feed vision

The civic feed should help residents answer:

What is happening around me that could affect my life, neighborhood, money, safety, commute, schools, taxes, or community?

The feed should prioritize:
- local impact
- plain-language government information
- personalized relevance
- source links
- meeting dates
- follow actions
- admin-reviewed AI summaries

## Feed content categories discussed

Recommended civic feed categories:
- Government decisions
- Development and zoning
- Infrastructure and public works
- Public safety and emergency information
- Elections and representation
- Civic opportunities

Examples:
- city council agenda items
- zoning cases
- new development proposals
- road projects
- school board decisions
- public comment opportunities
- town halls
- candidate forums
- ballot issue updates
- local emergency notices

## Personalization direction

The feed should eventually personalize using:
- city district
- neighborhood
- ZIP code
- followed topics
- Civic DNA dimensions
- user engagement
- proximity to local projects/issues

Important boundary:
Personalization should prioritize civic interests and local relevance, not hidden partisan targeting.

## Beta architecture direction

Recommended beta-safe pipeline:

Government sources
to scraping/RSS/API planning
to structured civic event/feed records
to AI-assisted draft summaries
to admin review queue
to published civic feed

Human admin review is required before publishing AI-generated or AI-assisted feed content.

## Deferred systems

Do not build these without separate approval:
- open public posting
- unrestricted comments
- autonomous publishing
- advanced AI agents
- full scraping automation
- Edge Functions for feed automation
- multi-city crawling
- predictive civic analysis
- automated political judgment or persuasion

## Files created or updated

Created:
- docs/design/CIVIC_FEED_STRATEGY.md

Updated:
- CIVICMARKET_CURRENT_STATE.md
- docs/ACTIVE_SPRINT.md
- docs/CHANGELOG.md
- .gitignore

## Git commits completed this session

- 6144602 Add civic feed strategy document
- a6f8683 Ignore local backup folders
- 95c7401 Document civic feed strategic direction
- 6d1f29e Add civic feed planning to active sprint
- 45bfa2e Record civic feed planning update

## Current repo status at last checkpoint

Working tree was clean after commit:

git status:
nothing to commit, working tree clean

## Important cleanup done

Temporary backup folders were created by the user:
- OLD/
- docs/OLD-docs/

These were intentionally ignored in .gitignore because they are local backup copies, not official project source files.

Several accidental stray root files were created while PowerShell was stuck inside the git diff less pager. They were deleted using extended Windows path handling.

## Current documentation state

CIVICMARKET_CURRENT_STATE.md now includes a Civic feed strategic direction section.

docs/ACTIVE_SPRINT.md now includes a Civic feed planning update section.

docs/CHANGELOG.md now includes a 2026-05-25 civic feed strategic planning entry.

docs/design/CIVIC_FEED_STRATEGY.md is the source of truth for the civic feed direction.

## Next recommended step

Update the main build guide later so the old build roadmap does not continue treating the civic feed as only a secondary manual beta feature.

Recommended next doc to review/update:
- civicmarket_build_guide.md

Potential next implementation planning docs:
- civic feed schema plan
- feed card UX spec
- admin review queue design
- government source inventory
- beta ingestion risk checklist

## Safety and scope notes

No code changes were made for civic intelligence in this documentation session.

No Supabase schema changes were made.

No RLS or policy changes were made.

No data changes were made.

This was a planning/documentation update only.
