# CivicMarket Design System

## Approved direction

CivicMarket uses a **coastal Florida mobile consumer** design language. The look is warm, modern, and community-facing — not government-bureaucratic. It reads like a polished consumer app that happens to be about local civic life.

Approved reference: `docs/design/approved-mobile-ui-reference.png`

---

## Brand assets

All brand assets live in `public/brand/`. Do not use external image URLs.

| File | Used on | Description |
|------|---------|-------------|
| `home-hero-coastal.png` | Home (`/`) hero | Warm sunrise/palm scene — vibrant teal ocean, golden sky |
| `candidate-hero-palms.png` | Candidate profile, compact dark headers | Dark moody teal/palm scene for compact headers |
| `dna-hero-coastal-light.png` | Civic DNA teaser (`/onboarding/dna-teaser`) | Light pastel beach scene — daytime, airy |
| `florida-coast-hero.svg` | (superseded) | Hand-drawn SVG illustration — no longer used in UI |
| `approved-mobile-ui-reference.png` | Reference only | Approved mockup — source of truth for visual direction |

---

## Hero system

### Dark hero (CoastalHero default)

Used on: Home, Ballot, Candidate profile, Measure profile, Vote.

```tsx
<CoastalHero eyebrow="..." title="..." subtitle="..." />           // candidate-hero-palms.png
<CoastalHero warm eyebrow="..." title="..." subtitle="..." />      // home-hero-coastal.png
```

- Background: PNG via `<img aria-hidden>` with `object-cover object-center`
- Overlay: `bg-gradient-to-b from-[#061814]/82 via-[#061814]/52 to-[#061814]/10` (warm) or `/80 /50 /20` (default)
- Teal accent glow: `bg-[#00C9A7]/[0.10] blur-3xl` upper right
- Horizon shimmer: 1px gradient line at bottom
- Text: eyebrow `text-[#00C9A7]`, title `text-white text-[32px]`, subtitle `text-[#94A3B8]`

### Light hero (CoastalHero variant="light")

Used on: Onboarding screens.

```tsx
<CoastalHero variant="light" eyebrow="..." title="..." />
```

- Background: gradient `from-[#F0FDF9] via-[#F8FFFE] to-white`
- Text: eyebrow `text-[#0D9488]`, title `text-[#0D1117]`

### DNA teaser hero (custom, not CoastalHero)

Used on: `/onboarding/dna-teaser` only.

- Background: `dna-hero-coastal-light.png` via `<img aria-hidden>` with `object-cover`
- Overlay: **left-to-right** white gradient `from-white/92 via-white/78 to-white/20` — protects left-aligned text while image shows on right
- Title: `text-slate-950`
- Subtitle: `text-slate-700`
- Page background: `bg-[#F0FDF9]`

---

## Design tokens

### Colors

| Token | Value | Usage |
|-------|-------|-------|
| Teal primary | `#00C9A7` | CTA buttons, active states, accent |
| Teal dark | `#0D9488` | Eyebrow labels, secondary teal |
| Teal ring | `#99F6E4` | District pills border |
| Teal muted bg | `#F0FDF9` | Page backgrounds, chip backgrounds |
| Teal chip bg | `#CCFBF1` | Benefit icon backgrounds |
| Dark base | `#0D1117` | Dark hero base, body text |
| Dark hero bg | `#061814` | Hero container background |
| Light page bg | `#F6F8FA` | Main content area background |
| White card | `#FFFFFF` | Cards, content sections |
| Slate body | `#374151` | Body text |
| Slate muted | `#6B7280` | Secondary text, section labels |
| Slate placeholder | `#9CA3AF` | Empty states, placeholder text |
| Slate border | `#94A3B8` | Candidate meta text |
| Amber warning | `#FFFBEB` / `#FDE68A` / `#92400E` | Beta disclaimer banners |

### Scope tag colors

| Scope | Background | Text |
|-------|-----------|------|
| City | `bg-[#CCFBF1]` | `text-[#0F766E]` |
| County | `bg-[#DBEAFE]` | `text-[#1D4ED8]` |
| State | `bg-[#EDE9FE]` | `text-[#6D28D9]` |

### Typography

All font families use Tailwind arbitrary classes — never inline `style=` attributes.

| Class | Font | Usage |
|-------|------|-------|
| `[font-family:var(--font-syne)]` | Syne | Headers, labels, buttons, eyebrows |
| `[font-family:var(--font-instrument-sans)]` | Instrument Sans | Body text, metadata, descriptions |

### MatchScoreRing

Sizes: `sm` = 48px, `md` = 72px, `lg` = 96px.

- Locked/unscored ring: `stroke="#DDE5EF"`, `strokeDasharray="4 7"`, lock icon `stroke="#B8C4D0"`
- Scored ring: teal arc with glow bloom at `opacity-[0.14]`
- Score text: `[font-family:var(--font-syne)]`

---

## Layout system

### Bottom nav (FloatingNav / NavBar)

- Position: `fixed bottom-5 left-4 right-4 h-[62px]`
- Style: `bg-white/90 backdrop-blur-xl border border-[#E8EDF2]/70 rounded-[28px]`
- Hidden on: all `/onboarding/**` and `/admin/**` routes
- Active indicator: `h-0.5 w-7 bg-[#00C9A7]` pip below icon
- 4 tabs: Home, Ballot, Vote, Profile

### Content area bottom padding

All main page content areas must use `pb-28` (112px) to clear the floating nav. This is non-negotiable — do not reduce it.

### Card system

- Standard card: `bg-white rounded-[24px] shadow-[0_4px_24px_rgba(0,0,0,0.09)] p-4`
- Small card / chip: `bg-white rounded-[20px] shadow-sm p-4`
- Hero overlap card: add `-mt-6 relative z-10` to pull card up over the hero bottom edge

---

## Preservation requirements

These elements are locked. Do not redesign or remove without explicit approval:

- Home coastal sunrise/palm hero with frosted glass countdown card
- Candidate profile dark palm/coastal hero with large circular avatar (w-20 h-20)
- Civic DNA teaser light coastal illustration with left-to-right white gradient
- Floating rounded bottom nav (4 tabs, white/blur, teal pip)
- White rounded shadow cards on `#F6F8FA` background
- MatchScoreRing styling (locked dashes when unscored, teal arc when scored)
- "Civic Feed" as the visible section label (not "Civic Pulse")
- `[font-family:var(--font-syne)]` and `[font-family:var(--font-instrument-sans)]` Tailwind classes — never `style={{ fontFamily: ... }}`

---

## What not to do

- No inline `style=` attributes in app components
- No external image URLs (brand assets only from `public/brand/`)
- No full dark screens for non-onboarding content — use dark hero + light body split
- No redesigning the nav or card system without explicit approval
- No adding emojis to UI copy unless explicitly requested
