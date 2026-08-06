# Internal Beta — Session-Start Automation Plan

## 1. Date and timestamp

Date: 08-05-2026
Timestamp: 11:13 pm EST

This document is documentation and planning only. It does not create or modify any PowerShell script. It does not modify `CLAUDE.md`, `CIVICMARKET_CURRENT_STATE.md`, or any application code. It does not inspect or display `.env.local`. It does not run any database write. It does not deploy.

## 2. Current repository baseline

- Local path: `J:\CivicMarket`
- Branch: `master`
- Latest confirmed pushed commit: `275c66d` ("Document Gate I10B final result: onboarding and Civic DNA verified live")
- Working tree confirmed clean at the start of this task, and up to date with `origin/master` at the last confirmed baseline
- Gate I10B is complete
- Gate I11 (candidate-positions / match-score readiness plan) exists locally as `docs/internal_beta_gate_i11_candidate_positions_match_score_readiness_plan.md`
- `tools/civic-status.ps1` exists and is the current pre-session data/build integrity script
- `CIVICMARKET_CURRENT_STATE.md` remains the single authoritative project-state file
- County Commission write path remains disabled: `ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE = false` in `src/app/api/set-county-commission-district/route.ts`
- No deployment is approved for any part of this task

## 3. Purpose

Every new working session currently starts by re-reading `CLAUDE.md`, then `CIVICMARKET_CURRENT_STATE.md` in full (now several hundred lines of gate history), then manually re-establishing git state, file presence, and the currently open gate before any real work can begin. This plan defines a read-only automation layer — a session-start script plus a generated, short-form context file — that performs the repeatable parts of that re-orientation safely and consistently, so each new session (and each new agent handoff, including to a different tool such as ChatGPT) starts from a verified, current, and secret-free snapshot instead of a fresh manual re-derivation.

This plan also exists to directly address a security incident (Section 9) and to make sure the proposed design cannot reproduce it.

## 4. Current repeated-session problem

Observed pattern across recent gates (I1 through I17A, plus the County Commission Gate 1-17A sequence):

- Every session re-reads `CLAUDE.md` and all of `CIVICMARKET_CURRENT_STATE.md`, which has grown into a long, append-only changelog. Re-reading it in full is correct for authoritative accuracy, but it is slow and easy to skim past a critical constraint (e.g., a disabled write guard) buried mid-document.
- Every session manually re-runs the same handful of git commands (`git status`, `git log`) to re-establish branch, cleanliness, and commit baseline before doing anything else.
- Every session manually re-derives "what gate are we on" and "what is the next approved step" by reading the tail of `CIVICMARKET_CURRENT_STATE.md` and cross-referencing the most recent `docs/internal_beta_gate_*` or `docs/county_commission_*` file.
- There is no single place that states, at a glance, the current safety-critical flags (e.g., `ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE`) without opening and reading source code.
- There is no reusable, tool-agnostic snapshot that can be handed to a different session, a different agent, or a different tool (e.g., ChatGPT) without re-deriving all of the above from scratch.
- `tools/civic-status.ps1` already exists but is scoped to CSV/data-integrity validation (real-data guard, placeholder scan, CSV row counts, review-log tail) — it does not check git baseline, gate status, required-file presence, or the County Commission write guard. It answers "is the data safe and consistent" not "where are we and is it safe to start working."

## 5. Existing authoritative files

These remain authoritative and are unchanged by this plan:

1. `CLAUDE.md` — non-negotiable coding rules, do-not-build list, required workflow, task-size discipline.
2. `CIVICMARKET_CURRENT_STATE.md` — authoritative project state, completed work, hard beta blockers, current gate history. Explicitly stated to take precedence over all other files when they conflict.
3. `Reference Files/CIVICMARKET_PATCH_MAY12.md` — Civic DNA source of truth (locked dimension keys, Q8-Q14 reversal rule).
4. `docs/ACTIVE_SPRINT.md`, `docs/DECISIONS.md`, `docs/CHANGELOG.md` — referenced by the `civic-step` skill's source-of-truth order.
5. `Reference Files/CIVICMARKET_WEEK3_HANDOFF_v3.md`, `Reference Files/CIVICMARKET_PROJECT_KNOWLEDGE.md` — historical/reference unless a current file says otherwise.

Nothing in this plan proposes changing the authority order. The proposed automation only reads these files; it never edits them.

## 6. Existing `tools/civic-status.ps1` role

Current confirmed behavior (read directly from the script):

- Prints `git status --short`.
- Warns if any `Reference Files` docs are untracked.
- Prints the latest 5 commits.
- Runs `node .\scripts\validate-real-psl-csvs.cjs` and fails (`exit 1`) on CSV validation failure.
- Runs `.\tools\civic-real-data-guard.ps1` and fails on guard failure.
- Runs `.\tools\civic-app-placeholder-scan.ps1` and fails on placeholder-scan failure.
- Imports and prints row counts for `candidates_real.csv`, `voting_records_real.csv`, and `funding_real.csv`.
- Prints the last 24 lines of `data\real-psl-replacement\real_data_review_log.md`.

`civic-status.ps1` answers: **"Is the real PSL data set currently valid, guarded, and free of placeholder leakage into the app?"** It is a data-integrity gate, not a session-orientation tool. It should remain unchanged and continue to be run whenever real-data or CSV-adjacent work is in scope. This plan does not modify it and does not merge its responsibilities into the new script — the two concerns (data integrity vs. session/gate orientation) are kept separate so a future change to one cannot silently change the pass/fail behavior of the other.

## 7. Proposed `tools/civic-session-start.ps1` role (not created yet)

A new, separate, strictly read-only PowerShell script whose only job is session orientation and safety-flag verification — never data-content validation and never any write. Proposed responsibilities:

- Confirm git baseline (branch, cleanliness, upstream, ahead/behind, recent commits).
- Confirm presence of the required authoritative and tooling files.
- Detect the current gate from `CIVICMARKET_CURRENT_STATE.md` and cross-check it against the most recent `docs/internal_beta_gate_*` / `docs/county_commission_*` file on disk.
- Confirm the County Commission write guard is still `false`.
- Confirm `.env.local` is ignored and untracked, without reading its contents.
- Confirm no forbidden secret-named files are tracked in git.
- Report whether `build`, `lint`, and `typecheck` scripts exist in `package.json` (detection only — it does not run them).
- Report known pre-existing lint exceptions so they are not mistaken for new failures.
- Print a plain-text PASS/WARN/FAIL summary and return a matching process exit code.
- Optionally (only in a separate, explicitly-invoked generation mode — see Section 8 and Section 27) write the generated context file. In default mode it writes nothing to disk.

It is intentionally narrow: it never opens `.env.local`, never runs `npm run build`/`lint` by default, never touches Supabase, never touches git history (no commit, no push, no reset), and never flips the County Commission write guard.

## 8. Proposed generated session context file (not created yet)

Proposed path: `docs/generated/CIVICMARKET_SESSION_CONTEXT.md`

Purpose: a short, machine-generated, human-and-agent-readable snapshot that can be read in seconds instead of re-deriving the same facts from a long changelog every session. It is a **derived artifact**, not a new source of truth — `CIVICMARKET_CURRENT_STATE.md` remains authoritative, and this file must say so at the top of its own content (see Section 19).

Proposed generation model:

- Written only when `tools/civic-session-start.ps1` is run in an explicit, separate `-GenerateContext` (or equivalently named) mode — never as a side effect of the default read-only check run.
- Fully overwritten on each generation (not appended), so it cannot silently accumulate stale or contradictory entries.
- Lives under `docs/generated/`, a proposed new folder reserved for machine-generated, disposable summaries, so it is visually and structurally distinct from hand-authored gate documents.
- Committing the generated file is a separate, explicit decision each time (see Section 21 and Section 29) — generation and commit are not the same step.

## 9. Secret-file exclusion requirements — the incident this plan must prevent

**What happened:** a prior broad, recursive `Select-String` search across the repository included `.env.local` in its scan and displayed an Anthropic API key in tool output. That key was revoked and replaced.

**Root cause:** the search was recursive and content-based (it read file *contents*) with no filename or directory exclusion list, so it had no way to distinguish `.env.local` from any other text file in the tree.

**Design rule this plan imposes on the future script, without exception:**

1. The script must never run a recursive, repo-wide content search (`Select-String -Recurse`, `Get-ChildItem -Recurse | Select-String`, or equivalent) across arbitrary file contents. Every content-inspecting check must target one explicitly named, non-secret file (e.g., the single `route.ts` file for the write-guard check), never a wildcard sweep.
2. The script must never call `Get-Content`, `Select-String`, `cat`, or any content-reading cmdlet against `.env`, `.env.local`, `.env.*`, or any file matching the forbidden-name patterns below.
3. Any check that needs to know whether a secret-named file *exists* must use presence-only cmdlets (`Test-Path`, `git ls-files`, `git status --porcelain`, `git check-ignore`) — never content-reading cmdlets.
4. Any check that needs to know whether an environment variable is *configured* must read it from the process environment (`$env:NAME`) and report only a boolean PASS/WARN, never the value (Section 10).
5. The forbidden secret-filename pattern list (case-insensitive) is: `secret`, `password`, `token`, `key`, `credentials`, `api` — applied to filenames only, checked against the **tracked file list** (`git ls-files`), never against a filesystem content crawl. `git ls-files` inherently excludes `.gitignore`d paths, so this check naturally also excludes `node_modules`, `.next`, `.git`, and build output without needing separate directory-exclusion logic — but the script must still explicitly exclude these directories from any other Test-Path-based existence check it performs, as defense in depth.
6. Binary files are never opened for content inspection by this script under any check.
7. The generated context file (Section 8) must never contain a secret value, a `.env.local` line, or raw matched text from a secret-named file — only PASS/WARN/FAIL booleans and non-secret metadata (branch name, commit hash, gate name, file-existence booleans).

## 10. Safe environment-variable presence checks

The script may report configuration *presence*, never a *value*:

```
PASS: ANTHROPIC_API_KEY appears configured
WARN: ANTHROPIC_API_KEY not found in current environment
```

Implementation rule: check via `if ($env:ANTHROPIC_API_KEY) { PASS } else { WARN }` (or the equivalent presence check against a single named line in `.env.local` using an anchored regex `^ANTHROPIC_API_KEY=` whose **match boolean**, not match text, is the only thing consumed) — the value itself, and the full matched line, must never be assigned to an output variable, written to the console, or written to the generated context file. If a `.env.local`-anchored check is used, it must open only that one named file (never a directory sweep) and must discard the matched line content immediately after computing the boolean.

## 11. Git baseline checks

Read-only, no state change:

- Current branch: `git rev-parse --abbrev-ref HEAD`
- Working-tree cleanliness: `git status --porcelain` (empty output = clean)
- Upstream tracking status: whether `@{u}` resolves (an untracked/local-only branch is reported as WARN, not FAIL)
- Ahead/behind counts vs. origin: `git rev-list --left-right --count HEAD...@{u}` (when upstream exists)
- Latest 10 commits: `git log --oneline -10`

None of these mutate repository state. No `git add`, `git commit`, `git push`, `git reset`, or `git checkout` is ever run by this script.

## 12. Required-file checks

Presence-only (`Test-Path`), no content read beyond what Section 13-14 explicitly allow:

- `CLAUDE.md`
- `CIVICMARKET_CURRENT_STATE.md`
- `Reference Files/CIVICMARKET_PATCH_MAY12.md`
- `package.json`
- `tools/civic-status.ps1`
- The current gate document (path resolved by Section 13)

Each missing required file is reported as FAIL, since session start should not proceed silently without the authoritative files present.

## 13. Current-gate detection approach

Two independent, cross-checked signals, both read-only and both operating on non-secret, hand-authored documentation:

1. **Primary signal:** the most recent `## County Commission District 1-5 assignment lookup - Gate N` or `## Internal Beta — Gate IN` section heading found by scanning `CIVICMARKET_CURRENT_STATE.md` top-to-bottom for the last matching heading pattern (the file is authoritative and append-ordered, so the last match is the current gate).
2. **Cross-check signal:** the most recently modified file (by filesystem `LastWriteTime`, with a `git log -1 --format=%cI -- <file>` cross-check to prefer commit time over filesystem time) matching `docs/internal_beta_gate_i*.md` or `docs/county_commission_district_assignment_lookup_gate_*.md`.

If the two signals disagree, the script reports a WARN (not a FAIL — this is expected immediately after a new gate document is drafted but before `CIVICMARKET_CURRENT_STATE.md` is updated to reference it) and prints both candidate gate names so the operator can resolve it manually. The script never guesses or auto-selects between them.

## 14. County Commission safety checks

- Read the single line matching `^const ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE = ` from `src/app/api/set-county-commission-district/route.ts` only (one named application source file, not a secret file, not a sweep).
- PASS only if the value is exactly `false`.
- FAIL (loudly, non-swallowable) if the value is `true` or if the line cannot be found (a missing line is treated as an inability to verify safety, not as an implicit pass).
- This check never modifies the file. It never modifies any other write-guard-adjacent file (`src/lib/officials.ts`, `src/components/CurrentOfficialsSection.tsx`).

## 15. Build, lint, and typecheck detection

Detection only — the script parses `package.json`'s `scripts` object (`Get-Content package.json | ConvertFrom-Json`, a single named non-secret file) and reports:

- `PASS: "build" script present` / `WARN: "build" script missing`
- `PASS: "lint" script present` / `WARN: "lint" script missing`
- `WARN: "typecheck" script not present in package.json (no dedicated tsc script currently configured)` — confirmed absent as of this plan; `next build` performs type checking as part of `build`, so this is expected and should not be reported as a failure, only as an informational WARN.

The script does not execute `npm run build`, `npm run lint`, or any `tsc` invocation by default. Running them is a separate, explicit step the operator (or Claude, per the source-of-truth workflow in `CLAUDE.md`) takes after reviewing the session-start summary, exactly as today.

## 16. Known lint-exception handling

`CIVICMARKET_CURRENT_STATE.md` already documents that `npm run lint` fails only on pre-existing `require`-import rule errors in `scripts/import-real-psl-data.cjs` and `scripts/validate-real-psl-csvs.cjs`. The generated context file should carry this forward verbatim as a "known pre-existing lint exceptions" line so a future session (or a fresh agent) does not mistake these known errors for a new regression. This is copied from existing documentation, not independently re-derived or re-validated by the script.

## 17. Output format

Plain-text console output, one line per check, using a consistent `PASS:` / `WARN:` / `FAIL:` prefix so results are greppable and unambiguous:

```
=== CivicMarket Session Start ===

Git baseline:
PASS: branch = master
PASS: working tree clean
PASS: upstream tracking origin/master
WARN: local branch is ahead of origin by 1 commit

Required files:
PASS: CLAUDE.md found
PASS: CIVICMARKET_CURRENT_STATE.md found
PASS: Reference Files/CIVICMARKET_PATCH_MAY12.md found
PASS: package.json found
PASS: tools/civic-status.ps1 found

Current gate:
PASS: detected gate = Gate I11 (candidate-positions / match-score readiness plan)

County Commission safety:
PASS: ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE = false

Secret-file safety:
PASS: .env.local is git-ignored
PASS: .env.local is untracked
PASS: no forbidden secret-named files are tracked

Build/lint/typecheck:
PASS: "build" script present
PASS: "lint" script present
WARN: "typecheck" script not present (next build performs type checking)

=== Result: READY (0 FAIL, 2 WARN) ===
```

## 18. Exit-code behavior

- Exit code `0`: no FAIL-level checks. WARN-level checks do not affect the exit code (they are informational, e.g., "ahead of origin," "no dedicated typecheck script").
- Exit code `1`: at least one FAIL-level check (missing required file, County Commission write guard not `false` or unreadable, a forbidden secret-named file found tracked in git, or an unresolvable git-baseline error).
- The script must never suppress a FAIL into a WARN to "keep the run green." A FAIL is only ever downgraded by a documented, explicit design decision recorded in a future gate — never silently at runtime.

## 19. Generated context format

Proposed content of `docs/generated/CIVICMARKET_SESSION_CONTEXT.md` (illustrative, not created by this plan):

```
# CivicMarket Session Context (generated — not authoritative)

This file is generated by tools/civic-session-start.ps1. It summarizes
CIVICMARKET_CURRENT_STATE.md and current repository state for fast
session orientation. CIVICMARKET_CURRENT_STATE.md remains authoritative
whenever this file and it disagree.

Generated: <date> <timestamp>
Branch: master
Current commit: <hash> <subject>
Working tree: clean | dirty
Upstream state: up to date | ahead by N | behind by N | no upstream

Current gate: <gate name>
Last completed gate: <gate name>

Known blockers:
- <copied verbatim from CIVICMARKET_CURRENT_STATE.md Hard beta blockers, unresolved items only>

Known limitations:
- <copied verbatim from CIVICMARKET_CURRENT_STATE.md Data availability limits>

County Commission safety state: ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE = false

Approved scope: documentation / read-only checks only, unless a specific
gate document says otherwise.

Prohibited actions: no County Commission writes, no deployment, no
Supabase writes, no secret-file inspection, no destructive git operations.

Relevant files for next gate:
- <paths, no content>

Recommended next step: <copied from the current gate document's own
recommended-next-step section>

Validation status: PASS | WARN | FAIL (from the check run that generated
this file)

Failed checks: <list, or "none">
```

No secret values, no `.env.local` lines, and no raw file contents appear anywhere in this format — only booleans, hashes, dates, and text copied from already-public, already-authoritative documentation.

## 20. New-session usage instructions

Proposed standard command to start a new working session:

```
cd J:\CivicMarket
.\tools\civic-session-start.ps1
```

Default mode is check-only: prints the Section 17 summary, writes nothing to disk, and returns the Section 18 exit code.

## 21. Claude Code usage instructions

Proposed standard prompt to open a new Claude Code session against this repository:

```
Read CLAUDE.md and docs/generated/CIVICMARKET_SESSION_CONTEXT.md first.

Run the read-only session-start check:

.\tools\civic-session-start.ps1

Stop if any required safety check fails.
```

This does not replace the existing `CLAUDE.md` "Required workflow" (`git status`, read files to be edited, summarize planned changes) — it precedes it, giving a faster, verified starting point before that existing workflow begins.

## 22. ChatGPT handoff usage instructions

When the current session's work needs to be handed to a different tool (e.g., ChatGPT) for review or continuation without full repository access:

1. Run `tools/civic-session-start.ps1` in generation mode to (re)produce `docs/generated/CIVICMARKET_SESSION_CONTEXT.md`.
2. Paste the contents of that single generated file (not `CIVICMARKET_CURRENT_STATE.md` in full, and never `.env.local`) into the handoff.
3. State explicitly in the handoff that the pasted file is a generated summary and that `CIVICMARKET_CURRENT_STATE.md` in the repository remains authoritative if there is any conflict.
4. Do not paste raw `git log`, `git diff`, or any file content beyond the generated context file unless a specific additional file is explicitly needed and has already been confirmed non-secret.

## 23. Failure handling

- Any FAIL-level check is presented first in the console summary (not buried after WARN/PASS lines), with the exit code set to `1`.
- The script does not attempt to auto-fix any FAIL condition (it does not toggle the write guard, does not stage files, does not modify `.gitignore`). It only reports.
- If `CIVICMARKET_CURRENT_STATE.md` or `CLAUDE.md` is missing entirely, this is treated as the most severe FAIL and reported first, since no further check in this script is meaningful without them.
- If the current-gate detection signals disagree (Section 13), this is a WARN, not a FAIL, and does not block session start — it only flags that gate bookkeeping may be one step behind.

## 24. Maintenance and update rules

- The forbidden secret-filename pattern list (Section 9, item 5) and the required-file list (Section 12) live as named variables at the top of the future script, not scattered through check logic, so they are easy to review and extend in one place.
- Any change to which files are "required" or "forbidden" must be made in a future, separate gate — this plan does not pre-approve future list changes.
- If a new authoritative file is added to the project (e.g., a new `Reference Files/*` doc becomes authoritative), the required-file list must be updated in the same gate that establishes that file's authority, not silently later.
- The known-lint-exceptions list (Section 16) must be updated whenever `CIVICMARKET_CURRENT_STATE.md` records a change to which lint errors are pre-existing/expected.

## 25. Testing plan

1. **Test 1 — clean repo:** run against a clean, up-to-date working tree; confirm overall `PASS`/`READY` result and exit code `0`.
2. **Test 2 — harmless dirty state:** create one harmless untracked scratch file; confirm the script reports the dirty state (WARN or FAIL per Section 18 design) without deleting or modifying the file.
3. **Test 3 — env file safety:** confirm the script reports `.env.local` as ignored and untracked without displaying any of its contents, and confirm console/transcript output contains no `.env.local` line text.
4. **Test 4 — write guard true state:** confirm the script detects `ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE = false` as PASS in the current codebase.
5. **Test 5 — write guard drift detection:** temporarily point the check at a throwaway **copy** of the route file (never the real route file) containing `= true`, and confirm the script reports FAIL against that copy, then confirm the real route file was never opened for writing and remains `false`.
6. **Test 6 — secret-filename exclusion:** create a harmless dummy file with a forbidden name pattern (e.g., a scratch file containing "token" in its name) in an untracked scratch location, confirm the script's tracked-file check does not flag it (since it is untracked, not tracked) and does not read its contents, then remove the scratch file.
7. **Test 7 — generated context secret-free:** after a generation-mode run, inspect `docs/generated/CIVICMARKET_SESSION_CONTEXT.md` and confirm it contains no secret values, no `.env.local` lines, and no raw matched search text.
8. **Test 8 — nonzero exit on failure:** force one required-file check to fail (e.g., run from a directory copy missing `CLAUDE.md`) and confirm the process exit code is nonzero.

All eight tests are read-only or operate only on throwaway scratch copies; none of them touch production data, `.env.local` contents, or the real County Commission write guard value.

## 26. Rollback plan

Because this plan creates no script and no generated file, there is nothing to roll back yet. For the future implementation gate, the rollback plan is:

- `tools/civic-session-start.ps1` and `docs/generated/CIVICMARKET_SESSION_CONTEXT.md` are both net-new, additive files. Rollback is deleting them (or reverting the commit that added them) with no impact on any other file, table, or route.
- Because the script is read-only by default, no rollback of *state* is ever required — only rollback of the *files themselves*, if desired.
- Generation mode only ever overwrites `docs/generated/CIVICMARKET_SESSION_CONTEXT.md` itself; it never touches any other tracked file, so rollback of a bad generation is a single-file revert.

## 27. Risks and mitigations

| Risk | Mitigation |
|---|---|
| A future edit reintroduces a recursive content search over `.env.local` | Section 9's design rule is explicit and itemized; any future script review must check for `-Recurse` combined with `Select-String`/`Get-Content` against non-single-named-file targets and reject it |
| Generated context file drifts from `CIVICMARKET_CURRENT_STATE.md` and is trusted as authoritative by mistake | The generated file states its own non-authoritative status in its first lines (Section 19); usage instructions (Section 21-22) always name `CIVICMARKET_CURRENT_STATE.md` as the fallback authority |
| Gate-detection heuristic (Section 13) picks the wrong "current" gate | Two independent signals with WARN-on-disagreement rather than silent auto-resolution |
| Script is later modified to auto-run `npm run build`/writes as a "convenience" | This plan explicitly scopes the script to detection-only for build/lint/typecheck (Section 15) and read-only for everything else; any future write-capable mode requires its own separately approved gate, per this project's existing gated-approval pattern |
| Environment-variable presence check accidentally logs a value during future maintenance | Section 10 mandates boolean-only capture at the point of the check, discarding matched text immediately, so there is no variable in scope later in the script that could hold a secret value |

## 28. No-write/no-deploy boundaries

This plan, and the future script it describes, must never:

- Write to Supabase in any form (no `candidate_positions`, `match_scores`, `voting_records`, or `user_districts` writes).
- Change County Commission data, code, or the write guard.
- Modify `.env.local` or any environment file.
- Run `git add`, `git commit`, `git push`, `git reset`, or any other repository-mutating git command.
- Deploy any part of the application.
- Print or log a secret value under any check.

The default (check-only) invocation of the future script additionally never writes any file at all, including the generated context file — writing is opt-in via a separate, explicit mode only.

## 29. Recommended implementation gate

A future, separately approved gate (proposed name: Gate I12 or "Session-Start Automation — Gate 1") should:

1. Create `tools/civic-session-start.ps1` implementing exactly the checks in Sections 11-16, with the output/exit-code contract in Sections 17-18.
2. Run the Section 25 test plan against the new script before any commit.
3. Add a generation mode that writes `docs/generated/CIVICMARKET_SESSION_CONTEXT.md` using the Section 19 format, invoked separately from the default check-only run.
4. Update `CIVICMARKET_CURRENT_STATE.md` to record the new script's existence and role (mirroring how `tools/civic-status.ps1` is already referenced).
5. Leave `ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE` at `false` throughout, with no change to any County Commission file.
6. Require explicit user approval of the implementation gate's exact script contents before that future gate is executed, consistent with this project's existing gated-approval pattern for County Commission work.

## 30. Risk check

Scope: one new documentation file only (`docs/internal_beta_session_start_automation_plan.md`).

Expected result: a reviewed implementation plan for automating session-start verification and generating reusable, secret-free session context, with an explicit design response to the prior `.env.local` exposure incident.

## 31. No-change confirmation

- No PowerShell script created or modified.
- No application code changed.
- No database writes.
- No `candidate_positions` writes.
- No `match_scores` writes.
- No `voting_records` writes.
- No `user_districts` changes.
- No County Commission changes.
- No write-guard changes (`ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE` remains `false`).
- No environment-file changes.
- No secret inspection — `.env.local` was not opened, read, or displayed at any point while producing this plan.
- No deployment.
- No git commit or push performed by this task.
