# Civic Reputation — levels, badges, penalties, candidate accounts

Decided September 8, 2026. Separate from Civic DNA. Civic DNA is about positions; reputation is about participation.

Principle: **levels are gated by verified civic acts, not by app activity.** Volume advances a user only through Neighbor. After that, only acts move you.

---

## 1. Ladder (8 levels)

| Level | Icon | Points | Gate (required, in addition to points) | Realistic time |
|---|---|---|---|---|
| Newcomer | 👋 | 0 | Sign up | Day 1 |
| Resident | 🏡 | 0 | Verified address | Day 1 |
| Voter | 🗳️ | 50 | Issues picked; weighed in on 3 items | First week |
| Neighbor | 🤝 | 150 | 5 comments with net helpful; 30 days active | Month 1 |
| Watchdog | 🔎 | 300 | 1 accepted correction **or** 1 check-in | Month 1–2 |
| Advocate | 🎤 | 600 | Spoke at public comment once | Month 2–3 |
| Delegate | 🏛️ | 1,500 | 3 speeches, 3 accepted corrections, 6 months on platform | Month 9+ |
| Titan | ⬡ | 5,000 | 10 speeches, 10 accepted corrections, 2 years on platform | Second election cycle |

Rules:
- Time-on-platform gates on Delegate and Titan cannot be bypassed.
- Show progress toward the next gate ("2 of 3 speeches toward Delegate"), not just the badge.
- Beta reality: with 25 users over 8 weeks, nobody passes Advocate. Build UI for Newcomer–Advocate; Delegate and Titan are spec only until post-beta.

## 2. Points

| Event | Points | Cap |
|---|---|---|
| Weigh in (support/oppose/unsure) | +5 | 5/day |
| Rate an item or candidate | +2 | 5/day |
| Post a comment | +5 | 3/day |
| Comment reaches net +10 helpful | +10 | — |
| Check in at City Hall (geofence, meeting window) | +50 | 1/meeting |
| Spoke at public comment (matched to minutes) | +150 | 1/meeting |
| Correction accepted | +100 | — |
| Candidate replies to you | +5 | — |

## 3. Badges shown on comments

| Badge | Earned | Scope | Verification |
|---|---|---|---|
| Level (icon + name) | Ladder above | Global | System |
| Verified | Address verified | Global | System |
| Lives in affected area | User's area = item's area | That item | System |
| 🎤 Spoke on this | Name matched to official minutes/video | That item | Manual for beta; claim-and-confirm post-beta |
| 📍 Checked in | Geofence at City Hall during meeting window (agenda start to adjournment + 30 min); one per meeting; livestream viewers excluded | That meeting | Automatic |
| ✓ Correction accepted | Inaccuracy report upheld | Profile count; shown on comments | Manual (corrections process) |
| Candidate · District N | See section 5 | Own profile + agenda items | Filing email + manual confirmation |

Weighting: comments from the affected area count double in helpful sort and in the AI summary. "Spoke" ranks above "Checked in."

## 4. Penalties

Penalties attach to **adjudicated outcomes only**. Downvotes and raw flags are signals, never fines.

| Event | Cost |
|---|---|
| Comment removed by moderator | −25 points; level progress frozen 30 days |
| Inaccuracy report rejected as false/bad-faith | −15 points |
| Second removal within 90 days | Drop one level; 90-day freeze |
| Third removal | Verified badge suspended pending Mike's review |

Signals (no point cost):
- Downvotes affect thread ranking only.
- 3 flags from verified residents auto-hide a comment pending review. Author loses nothing until a decision.
- Pattern nudge: 5 consecutive comments rated net-unhelpful → private message + 14-day pause on level progress.

## 5. Candidate accounts

- Proof: email at the domain on their FL Division of Elections filing **and** manual confirmation by Mike.
- Can comment on: own profile and agenda items. Never on an opponent's profile.
- Candidate comments are **shown, not counted**: excluded from the AI summary, excluded from support/oppose totals, cannot be buried by downvotes, can be reported.
- On agenda items, candidate comments appear in a separate "Candidates on this item" strip at the top, with their stance, so voters see campaigns side by side.
- A candidate's stance on an item never feeds their Civic DNA position (generalization rule, CIVIC_DNA_V2_SPEC section 5).

## 6. Neutrality firewall (extends the campaign-portal rule)

No official or candidate is ranked, promoted, summarized more favorably, or surfaced more often because they are active on the platform. Reach is not for sale and not earned by activity.

## 7. Content-ops cost during beta (honest accounting)

Manual during beta: matching speakers to minutes, confirming candidates, adjudicating removals and corrections. Budget roughly 1–2 hours per meeting cycle on top of agenda-item entry.
