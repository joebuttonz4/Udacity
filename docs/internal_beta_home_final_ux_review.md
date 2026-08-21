# Home Final UX Review — Controlled Beta Readiness

Date: 08-20-2026
Timestamp: 08:34 pm EST

Status: **Live review complete. No code changes made — none were needed.** Read-only + live UI review only. No Supabase write. No representation/ballot-eligibility/match-score logic touched. No deployment.

## Live review method

Reviewed the running local dev server (`http://localhost:3000`, PID 24744, unchanged from prior sessions) using the already-authenticated `civicmarket.test.01@example.com` session — no credentials entered. Hard-refreshed (Ctrl+Shift+R) before review to rule out stale content. Reviewed at native desktop width (~958px), and at a 200% CSS-zoom mobile approximation (the same fallback method used throughout this project, since `resize_window` does not reliably change rendered viewport in this environment). Also performed one live interaction test: clicked the bottom-nav Profile icon (navigated correctly to `/profile`), then returned to Home.

## Section-by-section findings

**Hierarchy (top to bottom, confirmed exactly as expected):** Hero/countdown → Top Matches → My Current Officials → Your Ballot Races → CivicMarket Status → pilot disclaimer → bottom nav. Matches the expected hierarchy exactly, carried over correctly from commits `56ea311`, `c51e296`, `11555fa`.

**Top Matches:** Shannon Martin renders first with a filled orange ring, "66% match," and "Based on 4 Civic DNA dimensions" — this communicates value immediately, at both widths and at 200% zoom, with no clipping. Locked candidates (Amr Metwally, Anthony Bonna) follow, each with a dashed ring, lock icon, and "Match score not available yet." The distinction between scored and locked is immediately legible without reading fine print.

**My Current Officials:** Shows exactly Debbie Hawley, Stephanie Morgan, Tobin Rogers "Toby" Overdorf, each with a jurisdiction badge (School Board / City / State), a ballot-status pill, and a source link. Feels complete and understandable — nothing reads as broken or missing, and the helper text ("Officials who currently represent you.") sets the right expectation.

**Your Ballot Races:** A distinct chip-cloud layout (pill tags, no cards) — visually and structurally very different from the Current Officials card list directly above it, so the two sections are not confusable at a glance. Helper text ("Races you're eligible to vote in — not the same as your current officials.") explicitly disambiguates the two. Chips wrap cleanly at mobile width with no overflow.

**CivicMarket Status:** Text-only cards (title + one-line subtitle, no avatars/rings/badges), the lowest information density of any Home section — reads as secondary/meta content relative to the richer Top Matches and Current Officials cards above it, even though the card container style is shared. The renamed label itself (vs. the old "Civic feed") already prevents it from being mistaken for live local civic news.

**Pilot disclaimer:** A single-line amber notice, positioned last, low visual weight — not disproportionately prominent.

**Bottom navigation:** Fixed-position, remained visible and usable through scrolling at both widths tested; live-clicked (Profile icon) and confirmed it navigates correctly.

**Overall page length/density:** Moderate — proportionate to the amount of genuine content (3 preview candidates, 3 officials, ~9 ballot-race chips, 3 status items). Not excessively bloated; no single section felt disproportionately tall relative to its content.

## Must-fix findings

**None.** No clipping, no overlap, no truncation defects, no broken hierarchy, no confusing section adjacency, no touch-target problems were found at either width tested.

## Nice-to-have findings (not implemented — cosmetic preference level, not obvious usability problems)

1. CivicMarket Status cards could be visually de-emphasized slightly further (e.g., lower elevation/opacity, smaller title weight) to read as even more clearly secondary than Top Matches/Current Officials — already acceptable today via its lower content density, but could be sharpened.
2. A small "View all" list scroll affordance is only relevant to Ballot Races if the chip count grows much larger than the current ~9 — not needed today.

Per the task's explicit instruction ("If only cosmetic preferences remain: do not change code"), neither item was implemented. Both remain candidates for a future, separately-scoped polish task if desired.

## Polish implemented this session

**None.** No must-fix or obvious high-value issue was found that warranted a code change.

## Mayor gap

Confirmed unchanged and remains a **data** issue, not a UI issue: "Mayor" appears as a Your Ballot Races chip (the user holds the Mayor district for voting-eligibility purposes) but does not appear in My Current Officials, because no `current_officials` row for Mayor exists system-wide yet (source-blocked — no official government source URL has been supplied for the current Mayor, per the long-standing documented gap in `CIVICMARKET_CURRENT_STATE.md`). Live-reviewed and judged **not genuinely confusing** on the page as rendered: the Your Ballot Races helper text ("...not the same as your current officials.") explicitly sets the expectation that the two lists need not match, so a Mayor chip with no corresponding official card is consistent with the section's own stated meaning rather than reading as a defect. Per Phase 3's default, left alone; no placeholder was created. This remains deferred, verified-source-blocked data work — unaffected by this review.

## Recommendation

**READY** for controlled beta Home UX. All Phase 4 acceptance criteria were verified live and passed: Shannon appears first in Top Matches with score and dimension disclosure visible; locked candidates are clearly locked; Current Officials renders above ballot races with unchanged/correct content; ballot races are clearly labeled as voting eligibility, distinct from representation; CivicMarket Status cannot be mistaken for live civic news; no mobile clipping was found at either width tested; the page does not feel unnecessarily bloated; and navigation was live-tested and works.

No code changes were made. `npm run build` was not re-run (no code changed; the last confirmed build, from the immediately prior sorting-fix task, already passed cleanly on this exact source).
