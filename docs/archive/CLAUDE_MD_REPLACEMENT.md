# CLAUDE.md — replacement sections (September 9, 2026)

Replace the "Read first" and "Current active priority" sections of `CLAUDE.md` with the text below. Leave "Non-negotiable coding rules", "Current data limits", "Required workflow", and "Preferred task size" as they are, except where noted at the bottom.

---

## Read first

Always read these files before planning or editing, in this order:

1. @THIS_IS_THE_APP.md — the one-page definition of "complete" for the November beta. Wins every conflict.
2. @civicmarket_mockup.jsx — the clickable mockup. It is the visual spec. Build screens to match it, not to match older HTML demos.
3. @CIVIC_REPUTATION_SPEC.md — levels, badges, penalties, candidate accounts.
4. @CIVICMARKET_CURRENT_STATE.md — where the code actually is.

Read `CIVIC_DNA_V2_SPEC.md` only when working on Ballot or Candidate profile. Read `VISION.md` only to confirm something is out of scope. Do not read `CIVICMARKET_BETA_SCOPE_PLAN`, `BETA_LAUNCH_PLAN`, or `CIVICMARKET_PROJECT_KNOWLEDGE` unless explicitly asked; they describe a previous product direction.

If any doc conflicts with `THIS_IS_THE_APP.md`, follow `THIS_IS_THE_APP.md`. If any doc conflicts with the mockup on layout, copy, or flow, follow the mockup.

## What CivicMarket is

A community engagement app for Port St. Lucie. The feed of agenda items is the product. Elections are one feature. The beta learning goal is a single question: will residents open, weigh in on, and show up for agenda items?

## Current active priority

Build the app in `THIS_IS_THE_APP.md`, one screen per session, in this order:

1. Onboarding (6 steps, matches mockup: welcome → invite + account → ZIP → backyard → verify (skippable) → issues)
2. Home feed (live-meeting banner, This week, What happened, alerts bell)
3. Item detail (when & where card with past/outcome state, stars, plain English, why you're seeing this, money, support/oppose/unsure, candidates strip, report link)
4. Comments (AI summary, verified-only posting, helpful votes, level + act badges, affected-area priority)
5. Alerts
6. Profile (reputation card, civic record, issue picker, alert toggles, verification)
7. Ballot
8. Candidate profile (three-level disclosure, dispute per row)
9. Vote
10. Sheets: verify address, report inaccuracy, City Hall check-in

Do not start a screen before the previous one is committed and matches the mockup at 390px.

**The Civic DNA v1→v2 migration is no longer the active priority.** Steps already committed (schema, if done) stay. Do not continue the quiz rewrite or scoring engine until screens 1–6 are done. When Ballot and Candidate profile come up, use the 8-question core set only; the refine set and issue weighting UI are parked.

**If a session surfaces a feature, screen, or rule not on `THIS_IS_THE_APP.md`, do not build it.** Append it to `VISION.md` with a trigger, or to `POST_BETA.md`, and say so in the session summary. `THIS_IS_THE_APP.md` does not grow.

**Content, not code, is the blocker.** Real agenda items entered by Mike are hard blocker #1. A session that ends with a working screen and no real items in the database has not moved the beta forward. Remind Mike of this at the end of every session in which the item count is still zero.

## Scope guard

Not in the beta, do not build, do not scaffold, do not "just stub":
Agents 1–3 · Firecrawl · Gemini · Twilio · full 5-tab admin · PWA · push notifications · Delegate/Titan UI · followings · polls · townhalls · volunteer tools · campaign portal · Expo · voter-roll matching · federal races · city #2 · navy v3 redesign · 16-question quiz · issue weighting UI.

---

## Edits to keep-as-is sections

**Non-negotiable coding rules** — add:
- Stars (item importance, candidate neighbor rating) are stored and displayed separately from Civic DNA. Never combine them into a match score.
- Candidate comments on items are flagged `is_candidate = true` and excluded from AI summaries and support/oppose totals.
- Level advancement checks the act gate, not just the point threshold (see `CIVIC_REPUTATION_SPEC.md` §1).
- Penalties are written only by moderator/correction decisions, never by vote or flag counts.
- Check-in data is stored as a per-meeting count. Never store or expose a list of who checked in.

**Current data limits** — add:
- `civic_feed` currently has 0 real items. Per-item required fields: title, plain-English body, meeting body, date, time, location, address, tags[], area, urgency, source_url. For decided items add outcome, roll call, minutes_url.

**Preferred task size** — unchanged. One screen per session. Never combine a screen build with data entry or with a methodology change.
