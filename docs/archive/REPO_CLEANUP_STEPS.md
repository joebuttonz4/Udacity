# CivicMarket Repo Cleanup — August 25 2026

Archives superseded documentation and brand assets. Nothing is deleted; everything moves to
`docs/archive/` and stops being read by Claude Code.

Run from `J:\CivicMarket`. Four phases. Check the output of each before moving on.

---

## Phase 0 — Confirm a clean starting point

```powershell
cd J:\CivicMarket
git status
git log --oneline -5
```

**Expected:** `nothing to commit, working tree clean`.

If it is not clean, stop. Commit or stash your own work first — do not let this cleanup sweep up
an in-progress change.

---

## Phase 1 — Create the archive structure

```powershell
New-Item -ItemType Directory -Force -Path docs\archive
New-Item -ItemType Directory -Force -Path docs\archive\handoffs
New-Item -ItemType Directory -Force -Path docs\archive\brand-v2
New-Item -ItemType Directory -Force -Path docs\work
```

---

## Phase 2 — See what will move, before moving it

Read-only. Nothing changes here.

```powershell
Get-ChildItem -Recurse -File -Filter "CIVICMARKET_CHATGPT_HANDOFF*.md" | Select-Object FullName
Get-ChildItem -File -Filter "civicmarket_build_guide.md" | Select-Object FullName
Get-ChildItem -File -Filter "CIVICMARKET_PROJECT_KNOWLEDGE*.md" | Select-Object FullName
Get-ChildItem -File -Filter "CIVICMARKET_ADDENDUM*.md" | Select-Object FullName
Get-ChildItem -Path public\brand -File | Select-Object Name
```

Confirm the handoff list matches what you expect — around ten files, some already in
`docs\handoffs\` from the May 17 archive pass.

---

## Phase 3 — Move the documents

```powershell
# Handoffs, wherever they live
Get-ChildItem -Recurse -File -Filter "CIVICMARKET_CHATGPT_HANDOFF*.md" |
  Where-Object { $_.FullName -notlike "*\docs\archive\*" } |
  ForEach-Object { git mv --force $_.FullName "docs/archive/handoffs/$($_.Name)" }

# Superseded planning and knowledge docs
git mv civicmarket_build_guide.md docs/archive/civicmarket_build_guide.md
git mv CIVICMARKET_ADDENDUM_CURRENT_OFFICIALS_AND_REVIEW_SUMMARIES.md docs/archive/CIVICMARKET_ADDENDUM_CURRENT_OFFICIALS_AND_REVIEW_SUMMARIES.md
```

If `CIVICMARKET_PROJECT_KNOWLEDGE.md` exists in the repo root or in `Reference Files\`, move it too:

```powershell
git mv "Reference Files/CIVICMARKET_PROJECT_KNOWLEDGE.md" docs/archive/CIVICMARKET_PROJECT_KNOWLEDGE.md
```

**The state file split** — this is the one that matters most for token cost:

```powershell
git mv CIVICMARKET_CURRENT_STATE.md docs/archive/CIVICMARKET_GATE_LOG.md
```

Now copy the new short `CIVICMARKET_CURRENT_STATE.md` into the repo root, along with the updated
`CLAUDE.md` and `docs/design/DESIGN_DIRECTION_V3.md`.

```powershell
New-Item -ItemType Directory -Force -Path docs\design
# copy the three new files in, then:
git add CIVICMARKET_CURRENT_STATE.md CLAUDE.md CIVIC_DNA_V2_SPEC.md docs/design/DESIGN_DIRECTION_V3.md
```

---

## Phase 4 — Archive the v2 brand assets

```powershell
git mv public/brand/home-hero-coastal.png docs/archive/brand-v2/home-hero-coastal.png
git mv public/brand/candidate-hero-palms.png docs/archive/brand-v2/candidate-hero-palms.png
git mv public/brand/dna-hero-coastal-light.png docs/archive/brand-v2/dna-hero-coastal-light.png
git mv public/brand/florida-coast-hero.svg docs/archive/brand-v2/florida-coast-hero.svg
git mv docs/design/approved-mobile-ui-reference.png docs/archive/brand-v2/approved-mobile-ui-reference.png
```

**This breaks the build until the v3 visual pass runs.** `CoastalHero` references these paths.
Two options:

- Do the v3 visual migration in the same session as this cleanup, or
- Skip Phase 4 now and fold it into the v3 migration session

Skipping is the safer choice if you are not building UI today.

Add the new visual reference:

```powershell
# save the navy mockup as docs/design/mockup-visual-reference-v3.png first
git add docs/design/mockup-visual-reference-v3.png
```

---

## Phase 5 — Seed the working-state file

```powershell
@"
# Current task state

## Completed
- Repo cleanup: handoffs, gate log, and build guide archived
- Civic DNA v2 spec committed
- Design direction v3 committed

## Current findings
- Active document set is now CLAUDE.md, CIVICMARKET_CURRENT_STATE.md, CIVIC_DNA_V2_SPEC.md, docs/design/DESIGN_DIRECTION_V3.md

## Blockers
- None

## Next action
- Civic DNA v2 step 2: schema migration (eight category keys, candidate_position_evidence, score_changes)
"@ | Set-Content -Encoding UTF8 docs\work\current_task_state.md

git add docs/work/current_task_state.md
```

---

## Phase 6 — Verify, then commit

```powershell
git status
Get-ChildItem -File *.md | Select-Object Name
```

**Expected in the repo root:** `CLAUDE.md`, `CIVICMARKET_CURRENT_STATE.md`,
`CIVIC_DNA_V2_SPEC.md`, `AGENTS.md`, `README.md`. Nothing else.

```powershell
npm run build
```

Passes if you skipped Phase 4. Fails on missing brand assets if you did not — expected, and fixed
by the v3 migration.

```powershell
git commit -m "Archive superseded docs and gate log; adopt v2 methodology and v3 design direction"
```

---

## What this does not touch

No application code. No database, schema, RLS, policies, or grants. No deployment.
No files under `src/`, `supabase/`, or `data/`. Nothing is deleted — every archived file stays in
git history and on disk under `docs/archive/`.

## Rollback

```powershell
git reset --hard HEAD~1
```

Safe only if the cleanup commit is the most recent one and you have no other uncommitted work.
