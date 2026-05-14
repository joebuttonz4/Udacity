# CivicMarket Decisions

## 2026-05-14 — Dummy data first

Decision: Continue development with dummy PSL data first.

Reason: This unblocks app, auth, onboarding, and UI development.

Constraint: Dummy data must be replaced before beta users are invited.

## 2026-05-14 — Current-state doc is authoritative

Decision: CIVICMARKET_CURRENT_STATE.md is the current operational source of truth.

Reason: Older build guides and handoffs conflict with newer decisions.

## 2026-05-14 — Short CLAUDE.md

Decision: Keep active CLAUDE.md short and focused.

Reason: The old project memory file was too large and made it easier for Claude to mix stale instructions into new work.

## 2026-05-14 — One task per Claude session

Decision: Each Claude session should handle one route, one feature, or one fix.

Reason: Large multi-feature sessions increase drift and forgotten changes.