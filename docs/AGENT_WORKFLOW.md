# CivicMarket Agent Workflow

This document defines how ChatGPT and Claude Code coordinate on CivicMarket through GitHub, and how work packages are planned, executed, verified, and handed off.

`docs/agent_handoff.json` is the compact machine-readable checkpoint that accompanies this document. Claude Code updates it at the end of each approved work package. ChatGPT reads it (via GitHub) to see current repository state without relying on conversational summaries.

## Roles

### ChatGPT

- Plans work packages.
- Reviews GitHub commits and repository state.
- Identifies risks and dependencies.
- Decides the next work package.
- Does not assume Claude completed something without repository evidence (a commit, a diff, or `docs/agent_handoff.json`).

### Claude Code

- Performs approved implementation work in the repository.
- Inspects existing code before changing it.
- Runs applicable tests.
- Runs `npm run build` when appropriate.
- Reviews its own diff.
- Updates `CIVICMARKET_CURRENT_STATE.md` when project state materially changes.
- Updates `docs/agent_handoff.json` at the end of each work package.
- Commits and pushes only approved work.

### GitHub

- Is the shared source of truth between ChatGPT and Claude Code.

## Default autonomous permissions

Claude may do these without stopping:

- Inspect files.
- Search code.
- Edit application code within the approved work package.
- Create tests.
- Run tests.
- Run lint.
- Run `npm run build`.
- Perform read-only database inspection when credentials/tools are already available.
- Update documentation.
- Inspect git status and diffs.

## Explicit approval required

Claude must stop before:

- Supabase INSERT, UPDATE, DELETE, UPSERT, RPCs that write data, or other database writes.
- Schema or migration execution.
- RLS/policy changes.
- Production deployment.
- Vercel environment variable changes.
- Supabase secret changes.
- API key or secret changes.
- Destructive file/database cleanup.
- Force push.
- Deleting branches.
- Modifying public candidate/election facts unless specifically authorized.
- Broad changes to candidate scoring methodology.

## Git safety

- Never overwrite unrelated concurrent work.
- Inspect `git status` before editing and before committing.
- Do not stage unrelated files.
- Do not use `git add .`, `git add -A`, or `git add --all`.
- If unrelated changes are present, leave them untouched and document them.
- Do not reset, clean, stash, or discard unrelated work without explicit approval.

## Work package completion

At the end of an approved package:

1. Run applicable tests.
2. Run `npm run build` when appropriate.
3. Inspect final git diff.
4. Confirm whether any database write occurred.
5. Confirm whether any deployment occurred.
6. Confirm whether secrets, RLS, or schema changed.
7. Update `CIVICMARKET_CURRENT_STATE.md` if needed.
8. Update `docs/agent_handoff.json`.
9. Commit only the files belonging to the work package.
10. Push the approved branch if authorized by the work package.
11. Return a concise report containing:

- PASS / PARTIAL / FAIL
- commit hash if committed
- branch
- files changed
- tests/build results
- database writes: YES/NO
- deployment: YES/NO
- blockers
- recommended next step

## Token efficiency

Claude should:

- Avoid repeatedly re-reading large files when targeted inspection is enough.
- Avoid narrating every tool call.
- Group related implementation work into one work package.
- Use concise completion reports.
- Prefer repository documentation over large conversational handoffs.
- Continue autonomously through safe steps rather than stopping after each tool call.
