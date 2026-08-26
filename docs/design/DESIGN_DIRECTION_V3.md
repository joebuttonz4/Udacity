# CivicMarket Design Direction v3 - Civic Navy

Supersedes the coastal/teal system (v2, May 17 2026). Approved August 25 2026.

Reference image: docs/design/mockup-visual-reference-v3.png
Visual reference only - palette, typography, card treatment, spacing, and component styling.
Screen content, copy, and navigation structure in that image are not approved.

---

## 1. What changed and why

v2 was coastal Florida: photographic palm heroes, electric teal, 20px radius, Syne display type.
v3 is civic institutional: deep navy, white cards, restrained type, tighter radius.

The reason is credibility. The product's core claim is that a score is a research summary you can
inspect and dispute. A vacation-brochure hero undercuts that claim before a user reads a word.
Navy and white is the visual language of records, filings, and public documents - which is what
this app actually is.

Do not reintroduce coastal photography, palm imagery, or teal as the primary accent.

---

## 2. Color tokens

--navy-900: #0E2A47   hero backgrounds, primary buttons, active nav
--navy-700: #163B62   button hover, secondary surfaces on dark
--ink:      #1B2B41   headings, primary text
--slate-600:#5A6B82   body text, descriptions
--slate-400:#8A99AD   captions, metadata, inactive nav
--line:     #E4E9F0   card borders, dividers, input borders
--bg:       #F5F7FA   app background
--surface:  #FFFFFF   cards, sheets, nav bar

Agreement scale - used for match values and per-category agreement only. Never decorative.

--match-high: #12A150   70-100
--match-mid:  #E8A317   45-69
--match-low:  #E5484D   0-44
--match-none: #8A99AD   no position found

--tint-high:  #ECFDF3   fill behind a high-match banner
--tint-mid:   #FEF8EC
--tint-low:   #FEF0F0

Scope tags keep semantic separation but move off teal:

--scope-city:   #16A34A
--scope-county: #2563EB
--scope-state:  #6D28D9

Rules:
- Navy is structure. Color is meaning. If a color is not carrying information, it should not be there.
- Never use a match color for a non-match element.

---

## 3. Typography

Drop Syne. It is a geometric display face with strong personality that reads editorial, not
institutional, and it does not appear in the reference.

Set everything in Instrument Sans, already in the project, and carry hierarchy through weight
and spacing rather than a second family.

| Role | Size / weight | Notes |
|---|---|---|
| Hero headline | 30px / 700 | -0.02em tracking |
| Screen title | 22px / 700 | |
| Card title | 16px / 600 | |
| Body | 15px / 400 | slate-600, 1.5 line height |
| Label / eyebrow | 12px / 600 | +0.06em tracking, uppercase, slate-400 |
| Data / percentage | tabular numerals | font-variant-numeric: tabular-nums on all scores |

Tabular numerals are not a detail - match percentages sit in vertical lists and must align.

---

## 4. Shape and spacing

--radius-card:  12px   was 20px
--radius-input: 10px
--radius-pill:  999px  filter chips, badges, scope tags
--shadow-card:  0 1px 2px rgba(14,42,71,0.06), 0 1px 3px rgba(14,42,71,0.04)

Spacing scale: 4 / 8 / 12 / 16 / 24 / 32. Card padding 16px. Gap between cards 12px.
Mobile-first at 390px. Nothing horizontally scrolls.

Softer radius and a much lighter shadow than v2.

---

## 5. Components

Hero. Solid navy-900, no photograph. Eyebrow label, headline, one line of supporting text.
Height is content-driven, not fixed. CoastalHero is retired - replace with PageHeader.

Match value. A rounded-pill badge, not a ring, in list contexts - badges align in a vertical
list and stay legible at small sizes where a ring does not.

On a candidate profile, the match is a full-width banner in the matching tint with the percentage,
the plain-language line, and coverage. The circular ring is retained here only, at 96px, as the
single ornamental moment in the app.

No-position state. Row renders in match-none with the label "No position found." Never a
padlock, never a dashed placeholder, never hidden.

Cards. White, 12px radius, 1px line border, shadow-card. No gradient fills.

Buttons. Primary: navy fill, white text, 10px radius, 48px tall. Secondary: white fill, navy
text, 1px line border. One primary action per screen.

Tabs. Text row with a 2px navy underline on the active item. No pill backgrounds.

Chips. Pill, line border, white fill. Active chip fills navy with white text.

Avatars. Circular, 40px in lists, 80px on profile. Real photographs where a sourced image
exists; initials on navy-700 as fallback. Never a stock silhouette.

Bottom nav. Four tabs - Home, Ballot, Vote, Profile. The reference shows five; that is a
navigation change, not a visual one, and is out of scope for this pass.

---

## 6. Migration checklist

- Add tokens to globals.css, remove v2 teal and coastal tokens
- Remove Syne from next/font loading; set Instrument Sans as the single family
- Replace CoastalHero with PageHeader across all screens
- Move public/brand/*.png to docs/archive/brand-v2/
- Convert MatchScoreRing list usages to MatchBadge; keep the ring for the profile banner
- Replace locked-padlock states with "No position found" rows
- Reduce card radius 20px to 12px and lighten shadows globally
- Apply tabular numerals to every score display

Do this as one visual pass in a single session, then a manual smoke test at 390px on every route.
Do not combine it with the Civic DNA v2 migration.
