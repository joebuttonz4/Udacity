# Civic DNA v2 — categories, questions, and scoring

`methodology_version: 2`
Supersedes the seven-dimension v1 model. v1 rows remain valid under `methodology_version: 1` and are not migrated in place.

---

## 1. What the score is

The Civic DNA match is **a summary of the research a motivated resident would do themselves**, not a certification.

This framing sets the evidence bar. A score does not require an official government record. It requires a credible public source, shown to the user, with a link and a date, that the user can inspect and disagree with.

Every score must be displayed alongside the evidence that produced it. A score without a visible receipt is not shippable.

---

## 2. The eight categories

These are **universal and immutable across cities**. Do not add, remove, or rename per city. City-specific concerns go in the local issues layer (section 7).

| Key | Display name | Negative pole (−2) | Positive pole (+2) |
|---|---|---|---|
| `growth_development` | Growth and development | Slow approvals, preserve existing character | Approve more building, more density |
| `taxes_budget` | Taxes and budget | Keep taxes low, accept fewer services | Fund more services, accept higher taxes |
| `infrastructure_traffic` | Infrastructure and traffic | Defer, pay as you go | Invest now, borrow if needed |
| `housing_affordability` | Housing affordability | Leave housing costs to the market | City should actively intervene |
| `public_safety` | Public safety | Shift toward prevention and alternatives | More policing, staffing, enforcement |
| `economic_development` | Economic development | No public money for private business | Active incentives to attract employers |
| `environment_land` | Environment and land | Put land to productive use | Protect and preserve natural areas |
| `accountability_influence` | Accountability and influence | Existing rules are sufficient | Stronger disclosure, limits, public input |
| `education` | Education | Focus on basics and cost control | More funding and programs |

`education` is **office-scoped** — it applies only to school board races. See section 7.

### Why these eight

- National League of Cities 2026: economic development, infrastructure, and housing are the top mayoral priorities, with budget/management and public safety close behind.
- Survey of local government officials: taxation/finance/budget, economic development, and infrastructure/transportation ranked as the top three priorities; social services and public health ranked lowest.
- Every category maps to an actual municipal or county power. Categories the office does not control are excluded on purpose — a score on a power the office lacks predicts nothing about how the person would govern.
- Eight axes matches the structure validated by smartvote over twenty years of Swiss elections.

### Deliberately excluded

- **Social programs** — lowest-ranked local priority in the officials survey, and largely a state/federal function.
- **Immigration, abortion, national partisan issues** — not municipal powers. Including them would make the app national, which is the opposite of the product thesis.

---

## 3. Question bank

Sixteen questions, two per category. Presented **progressively**: Q1–Q8 produce a first result, Q9–Q16 are offered as "refine your match."

All questions use `{city}` as a token. Default rendering is "our city." Never hardcode a city name — this is what makes a new market a data-entry job instead of a code change.

### Answer scale

Five points, identical for users and for candidates who respond to a questionnaire:

| Label | Value |
|---|---|
| Strongly disagree | −2 |
| Disagree | −1 |
| Neutral / unsure | 0 |
| Agree | +1 |
| Strongly agree | +2 |

`direction` of `-1` means the raw answer is sign-flipped before it contributes to the category score. Raw answers are always stored as given; reversal happens at compute time only.

### Core set — Q1 to Q8

| # | Category | Dir | Statement |
|---|---|---|---|
| 1 | `growth_development` | +1 | {city} should approve more new development, even if it changes the character of existing neighborhoods. |
| 2 | `taxes_budget` | −1 | {city} should keep property taxes as low as possible, even if that means fewer services. |
| 3 | `infrastructure_traffic` | −1 | {city} should live within its means on infrastructure and avoid taking on new debt. |
| 4 | `housing_affordability` | +1 | {city} should require developers to include affordable units in new projects. |
| 5 | `public_safety` | +1 | {city} should increase police staffing and funding. |
| 6 | `economic_development` | +1 | {city} should offer tax breaks or incentives to attract new employers. |
| 7 | `environment_land` | −1 | Undeveloped land is better used for housing and business than left in conservation. |
| 8 | `accountability_influence` | +1 | Officials should be barred from voting on projects backed by their campaign donors. |

### Refine set — Q9 to Q16

| # | Category | Dir | Statement |
|---|---|---|---|
| 9 | `growth_development` | −1 | Growth has moved too fast, and approvals should slow until infrastructure catches up. |
| 10 | `taxes_budget` | +1 | I would accept a higher tax bill for noticeably better city services. |
| 11 | `infrastructure_traffic` | +1 | Fixing traffic congestion should be one of {city}'s top budget priorities. |
| 12 | `housing_affordability` | −1 | Housing costs are best handled by the market, not by city policy. |
| 13 | `public_safety` | −1 | {city} should shift some public safety spending toward mental health and homelessness response. |
| 14 | `economic_development` | −1 | Public money should not be used to attract private businesses. |
| 15 | `environment_land` | +1 | {city} should impose stricter limits on development near waterways and wetlands. |
| 16 | `accountability_influence` | +1 | {city} should hold more public input sessions before major projects, even if it slows decisions. |

### School board supplement

Shown only to users who have a school board race on their ballot.

| # | Category | Dir | Statement |
|---|---|---|---|
| S1 | `education` | +1 | The district should increase spending per student, even if it requires more local funding. |
| S2 | `education` | −1 | The district should focus on core academics and cut spending on everything else. |

### Question-writing rules for future revisions

1. One category per question. If a statement could plausibly load onto two categories, rewrite it. The VAA methodology literature is clear that cross-loading is the main source of unreliable dimension scales.
2. Municipal scope only — the statement must describe something the office can actually decide.
3. No proper nouns, no project names, no local specifics. Those belong in the local issues layer.
4. Both poles must be a position a reasonable neighbor holds. If one side is obviously correct, the question measures nothing.
5. Keep at least 6 of 16 reverse-keyed. Current set has 7 (Q2, Q3, Q7, Q9, Q12, Q13, Q14).

---

## 4. Scoring

### 4.1 User category score

For each category, take the user's answers to that category's questions, apply `direction`, and average.

```
u_i = mean(answer × direction) for questions in category i
```

Range −2.0 to +2.0. With two questions, this yields 9 possible values per category (−2, −1.5, −1, −0.5, 0, +0.5, +1, +1.5, +2).

If only the core 8 have been answered, each category has one question and 5 possible values. The score still computes; resolution improves when the user refines.

### 4.2 Candidate category score

Same −2.0 to +2.0 scale, assigned by the coding rubric in section 5. Categories with no evidence are `null`, never 0. Zero means "explicitly neutral or mixed"; null means "we don't know."

For candidates who answer a questionnaire, use their raw answers on the same scale and skip the coding rubric entirely. Never average a questionnaire respondent's single answer into a half-step — publish exactly what they selected.

### 4.3 Issue weighting

After the quiz, the user selects up to **three** categories that matter most to them.

```
w_i = 2.0 if flagged, else 1.0
```

This is the single largest source of differentiation between candidates and the main reason a score feels personal rather than formulaic. Weights are editable at any time from the profile and recompute all match scores immediately.

### 4.4 Match formula

Weighted Euclidean distance across categories where the candidate has a non-null position.

```
K   = categories where candidate position is not null
d_i = |u_i − c_i|                    range 0 to 4
D   = sqrt( Σ(w_i × d_i²) / Σ(w_i) ) range 0 to 4      for i in K
match = round(100 × (1 − D / 4))     integer 0 to 100
```

Euclidean rather than a simple sum: one severe disagreement should cost more than several minor ones, which both matches how voters actually feel and spreads the score distribution.

Worked example — a candidate the user broadly agrees with but clashes with on one weighted issue:

| Category | User | Candidate | d | w |
|---|---|---|---|---|
| growth_development | +1.5 | +1.0 | 0.5 | 1 |
| taxes_budget | +1.5 | +2.0 | 0.5 | 1 |
| infrastructure_traffic | +1.0 | +1.5 | 0.5 | 2 |
| housing_affordability | +2.0 | null | — | — |
| public_safety | −1.0 | +2.0 | 3.0 | 1 |
| economic_development | +0.5 | +1.0 | 0.5 | 1 |
| environment_land | −1.0 | +2.0 | 3.0 | 2 |
| accountability_influence | −0.5 | 0.0 | 0.5 | 1 |

Σ(w·d²) = 0.25 + 0.25 + 0.5 + 9.0 + 0.25 + 18.0 + 0.25 = 28.5
Σ(w) = 9 → D = sqrt(3.167) = 1.78 → match = **56**

### 4.5 Coverage rules

- Compute over known categories only. Never impute a missing position.
- Display coverage next to every score: "5 of 8 known."
- **Minimum coverage to display a score: 4 of 8.** Below that, show the known positions and the evidence, but no percentage — a match built on two categories is noise.
- Never rank candidates against each other when their coverage differs by more than 2 categories without labelling it. A 73% on 8 known and a 73% on 4 known are not the same claim.

### 4.6 Display

- Show the integer, never the internal decimals.
- Replace numeric category scores in the UI with plain language. `+2` becomes "strongly favor more," `−0.5` becomes "slightly lean toward less." Retain the number behind a "show details" toggle only.
- Every category row on a candidate profile shows: category name, user position, candidate position, agreement indicator, and provenance. Full disclosure rules in section 6.
- Categories with `null` render as "no position found" — not as a locked or failed state. This is factual information about the candidate, and it is the natural prompt for a right-of-reply.

---

## 5. Candidate coding rubric

This is the standard that keeps the score defensible and consistent across researchers and across cities.

### Levels

| Score | Assign when |
|---|---|
| +2 | Explicit, repeated commitment to the positive pole. Named as a priority. |
| +1 | Supportive language toward the positive pole without a firm commitment. |
| 0 | Explicitly balanced, mixed, or states the tradeoff without resolving it. |
| −1 | Supportive language toward the negative pole without a firm commitment. |
| −2 | Explicit, repeated commitment to the negative pole. |
| null | No evidence located. Not the same as 0. |

### Evidence requirements

Every non-null position requires a `candidate_position_evidence` row containing:

- `source_url`
- `source_type` — one of: campaign_site, questionnaire, interview, debate, news_article, public_meeting, official_record, candidate_social
- `published_date`
- `excerpt` — verbatim, 25 words maximum. **Public.**
- `coder_note` — one sentence on why this excerpt supports this score. Internal only, never displayed (section 6.4)

Because the coder note is not shown, the excerpt must stand alone. A voter reading only the excerpt and the score must be able to see the connection without explanation. An excerpt that merely mentions the topic is not sufficient — it must visibly support the direction assigned. If no such excerpt exists in the source, the position is `null`.

### Coding rules

1. Code only what the candidate said. A statement about one parcel, one project, or one vote is not a general position on the category. General positions require general language.
2. A single ambiguous statement caps the score at ±1. Reserve ±2 for repeated or explicit commitments.
3. Silence is `null`, never 0.
4. Endorsements, donor lists, and party affiliation are **not** evidence of a policy position. They may inform `accountability_influence` only when the candidate has spoken about them.
5. A candidate's own questionnaire response **overrides** any researched code for that category, and the display says so.
6. Two coders should reach the same score from the same excerpt. If they wouldn't, the excerpt is too weak — use `null`.

### Right of reply

Every candidate profile carries a visible correction path. When a candidate disputes a code, either produce a stronger source or set it to `null` and invite their questionnaire answer. Log every change with timestamp and reason.

---

## 6. Transparency requirements

All four elements below ship together in v1. The score is a research summary, not a certification, so visible reasoning is what makes it defensible.

### 6.1 Three-level disclosure

**Level 1 — the ring.** One plain-language line beneath it naming what drove the number. "Strong agreement on taxes and growth. You differ on environment and public safety." A user who reads nothing else understands the shape of the result.

**Level 2 — the eight rows.** Category, user position, candidate position, agreement indicator, and a per-row provenance label: *from her campaign site* / *from her questionnaire answer* / *no position found*.

**Level 3 — tap any row.** The verbatim excerpt (25 words max), source link, publication date, and a "dispute this" action. The excerpt must justify the score on its own — nothing else is shown to explain it.

Rules:
- Never hide, collapse, or reorder `null` rows to make a profile look fuller. Missing data is the most important disclosure on the page.
- Level 2 is always visible. Level 3 is tap-to-expand — full expansion by default makes the page unreadable and nothing gets read.

### 6.2 One ring, not two

A candidate has exactly one canonical match score at any time, on every surface — profile, ballot list, Top Matches. Questionnaire answers override researched codes per category (section 5, rule 5); the ring always reflects the best available evidence.

Provenance badge beneath the ring:

| Badge | Condition |
|---|---|
| Confirmed by candidate | All known categories come from their questionnaire |
| Partly confirmed by candidate | At least one, but not all, from their questionnaire |
| From public sources | No questionnaire response |

Coverage always displays alongside: "6 of 8 known."

When a questionnaire response changes a score, show a one-time note — "Updated Sept 14 after the candidate responded; your match moved from 56 to 71" — not a permanent second ring. Two rings force the user to arbitrate between two numbers when the app already knows which one is better evidence, and they break sorting everywhere a single number is required.

### 6.3 Weighting explainer

Users must be able to see that their own weighting drove the result, not an opinion held by the app.

For each flagged category, recompute the match with that category's weight reset to 1.0 and display the delta: "Your top-issue weighting on environment lowered this by 9 points." Include a direct link to edit weights, and recompute all scores immediately on change.

### 6.4 Coder notes are internal

`coder_note` is recorded on every evidence row but is **never displayed to users**.

Rationale: a published sentence characterizing a candidate during a live election cannot be retracted, and the excerpt plus source already carries the public justification. The note exists so that a disputed code can be defended months later with the reasoning written at the time, and so two coders can compare reasoning during the reliability check.

Because the note is not public, the excerpt itself must fully justify the score. If it doesn't, pick a better excerpt or use `null`.

### 6.5 Public change log

Every score change is logged and displayed on the candidate profile, reverse chronological.

`score_changes`: `candidate_id`, `category_key`, `old_value`, `new_value`, `reason`, `source_url`, `changed_at`, `changed_by_role`

Log every transition including `null` to a value and a value back to `null`. Silent score changes are the fastest way to lose credibility, and a public log is the strongest defense against a claim that a number was quietly shifted.

### 6.6 Public methodology page

No login required. Contains the eight categories, all 16 questions, the answer scale, the match formula, the coding rubric, minimum coverage rules, and the corrections policy. Linked from every score display and from every candidate profile.

---

## 7. Office scoping

Categories are scored per office, because scoring an office on a power it lacks produces a meaningless number. This mapping is written once and reused in every city.

| Office type | Categories scored |
|---|---|
| Mayor | All 8 (no education) |
| City Council | All 8 (no education) |
| County Commission | All 8 (no education) |
| School Board | `education`, `taxes_budget`, `accountability_influence` |
| State and federal | Not scored — out of scope for Civic DNA |

The user's Civic DNA is a single profile. Office scoping changes which categories enter the match, not which questions the user answers.

---

## 8. Multi-city scalability

The model separates what is universal from what is local. Launching a new city must never require a code change.

**Layer 1 — universal.** The eight categories, the 16 questions, the scale, the formula, the coding rubric, and the office mapping. Identical everywhere. Versioned by `methodology_version`. A user who moves keeps their Civic DNA intact and it works on day one in the new city.

**Layer 2 — local, per city.** Everything specific lives in data:

- `cities` — name, display token for `{city}`, state, timezone, election dates
- `offices` — which seats exist, mapped to an office type from section 7
- `districts` — boundaries and lookup method
- `local_issues` — named local controversies with a description, a source, and a related category key
- `candidates`, `candidate_position_evidence`, and `score_changes`

Local issues display as context on candidate profiles and may drive an optional secondary "local issues" match. **They never alter the eight categories or the primary score** — that is what keeps scores comparable across cities and keeps the quiz stable.

**New-city checklist** (no engineering):
1. Create the city row and set the `{city}` token.
2. Enter offices and districts.
3. Import candidates.
4. Research and code positions against the rubric in section 5.
5. Enter 3–5 local issues.

---

## 9. Migration from v1

| v1 key | v2 disposition |
|---|---|
| `growth_development` | Unchanged |
| `taxation_spending` | Renamed `taxes_budget` |
| `housing` | Renamed `housing_affordability` |
| `public_safety` | Unchanged |
| `environment` | Renamed `environment_land` |
| `transparency` | Renamed `accountability_influence`, scope widened to donor influence and public input |
| `education` | Retained, now office-scoped to school board |
| — | New: `infrastructure_traffic` |
| — | New: `economic_development` |

Existing v1 candidate positions carry forward for the six retained categories. The two new categories start `null` and are filled by research. Existing user DNA rows are marked `methodology_version: 1` and users are prompted to retake — do not attempt to synthesize answers for questions they never saw.
## 10. Open items

- Copy for the plain-language labels at each of the 9 user score values.
- Copy for the three provenance badges.
- Whether the "refine" prompt appears immediately after the core 8 or on a return visit.
- Whether the secondary local-issues match ships in v1 or later.
- Inter-coder reliability check: two people code the same three candidates independently before the first real scores go live.
