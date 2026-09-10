# CivicMarket — This Is The App

September 8, 2026. This page defines "complete" for the November 2026 Port St. Lucie beta. It was derived from the clickable mockup (`civicmarket_mockup.jsx`), not the other way around. Where it conflicts with older documents, this page wins. Anything not on this page is not in the beta; it goes in `VISION.md` with a trigger.

**Thesis:** people act on what's in their backyard when they know about it. CivicMarket is a community engagement app. Elections are one feature.

**Beta learning goal (one sentence):** will PSL residents open, weigh in on, and show up for agenda items?

---

## Screens (10) — every one exists in the mockup

| # | Screen | What it does | Data it needs |
|---|---|---|---|
| 1 | Onboarding (6 steps) | Welcome → invite code + account → ZIP (street name if ambiguous) → "Your backyard" district confirmation → verify address (skippable) → pick up to 3 issues | Invite codes, district lookup, USPS check |
| 2 | Home feed | Live-meeting banner · "This week" items (teal edge = your issues/area) · "What happened" decided items · bell with unread count | Agenda items |
| 3 | Item detail | Title, urgency, area · **When & where** (date, time, location, address; if past: outcome + roll call + minutes) · how much it matters (stars) · plain English · why you're seeing this · follow the money · support/oppose/unsure with neighbor bars · candidates on this item (shown, not counted) · comments · report inaccuracy | Per item: ~12 fields, all copy-paste from agenda/minutes |
| 4 | Ballot | One race. Ring only at ≥4 of 8 known; otherwise "not enough positions yet" with reason · neighbor star rating | Candidate positions + evidence |
| 5 | Candidate profile | One-line summary · neighbor rating (separate from ring) · 8 rows with user vs candidate, agreement dot, provenance · tap row → excerpt, source, date, dispute · weighting explainer · comments · report | Same as above |
| 6 | Comments (on items and candidates) | AI summary of comments · add your take (verified only) · helpful/not helpful · sort · level + act badges · affected-area priority | Comments, moderation |
| 7 | Alerts | Six kinds: your issue, your area, candidate weighed in, meeting reminder, what happened, you · mark read | Derived from items + user prefs |
| 8 | Vote | Polling place, early voting, registration check, how to speak at a meeting | Google Civic / FL DoE |
| 9 | Profile | Reputation card (level, points, next gate, all 8 rungs) · civic record · issue picker · alert toggles · verification state | User data |
| 10 | Sheets | Verify address (onboarding + just-in-time) · Report inaccuracy (item, profile, any position row) · City Hall check-in (ask → locate → far / done) | — |

## Rules the mockup makes visible

- Feed first. DNA quiz is a footnote, reachable from Ballot, never required.
- Read everything unverified. The wall appears only when input would count toward a neighbor total.
- Every score shows its receipt. Null renders as "no position found."
- Candidates on items: shown, not counted; never feeds Civic DNA; alert only when both stances are present.
- Stars ≠ ring. Stars are about the person / how much an item matters. Ring is about positions.
- Levels are gated by verified acts (see `CIVIC_REPUTATION_SPEC.md`). Penalties attach to adjudicated outcomes only.
- Check-in is aggregate only ("23 neighbors here"), never a list.
- Corrections: 48h acknowledge, 7 days review, decision with public change log, one appeal.

## What is NOT in the beta (dated, parked in VISION.md)

Agents 1–3, Firecrawl/Gemini feed automation, Twilio SMS, full 5-tab admin, PWA, push notifications (email only), Delegate/Titan UI, official followings, polls, townhalls, volunteer tools, campaign portal, Expo app, voter-roll matching, federal races, city #2, navy v3 redesign, 16-question quiz.

## Content ops (the part that isn't code)

Per meeting cycle, done by Mike: enter every relevant agenda item (~12 fields), tag it, enter the outcome and roll call after the vote, match speakers to minutes, adjudicate reports and flags. Budget **2–3 hours per meeting**, ~5 meetings a month. **This is the beta.** The code is the delivery mechanism.

## Hard blockers before the first invite

1. Real agenda items from the next 3 meetings entered and tagged
2. Real positions with evidence for whichever candidates survived the August primary
3. Verify, Report, Check-in flows working
4. ToS, Privacy Policy, Corrections Policy published (attorney-reviewed; hand them the Report screen)
5. Invite-code gate working
6. Production smoke test on the deployed URL

## Build order (one screen per session, mockup as the spec)

Onboarding → Home feed → Item detail → Comments → Alerts → Profile → Ballot → Candidate profile → Vote → Sheets.

Rule: if a session surfaces something not on this page, it goes to `VISION.md` or `POST_BETA.md`. This page does not grow.
