<#
.SYNOPSIS
    Starts Claude Code non-interactively on the current approved CivicMarket work package.

.DESCRIPTION
    This runner reduces manual copy/paste between ChatGPT and Claude Code. It:

      1. Determines the CivicMarket repository root from this script's own location.
      2. Changes directory to the repository root, and creates the gitignored .tmp/ and
         .tmp/reviews/ output directories (see .gitignore).
      3. Verifies CLAUDE.md, docs/AGENT_WORKFLOW.md, and docs/CURRENT_WORK_PACKAGE.md exist.
      4. Verifies the `claude` CLI is available on PATH.
      5. If -TestEditPermission is passed, runs a standalone smoke test of the narrow Edit-tool
         allowlist mechanism (see Defect 1 below) against a disposable scratch file, then exits.
         Skipped otherwise.
      6. Prints the repository path, current git branch, and a concise `git status --short`.
      7. Runs a safety preflight on docs/CURRENT_WORK_PACKAGE.md: refuses to launch Claude if
         the file still contains blank-template placeholder text, or is missing any of its
         required sections (## Status, ## Objective, ## Scope, ## Required Reviews,
         ## Commit / Push Authorization, ## Work Instructions).
      8. Parses, validates, and normalizes the ## Required Reviews value (NONE, or a
         comma-separated list drawn only from: Mission, UX, Data Integrity, Security,
         Release Gate). Rejects a blank value, unknown names, duplicates, and NONE combined
         with another name. Verifies every requested reviewer's file under docs/agents/
         exists.
      9. Displays a concise preflight summary (repository, branch, normalized Required
         Reviews) before Claude launches.
     10. Invokes `claude -p` (non-interactive print mode) with a prompt built from the
         contents of docs/CURRENT_WORK_PACKAGE.md plus a fixed instruction block that tells
         Claude to follow docs/AGENT_WORKFLOW.md as the governing safety/process contract.
         This single implementation call is granted a narrow, explicit `--allowedTools Edit`
         allowlist (see Defect 1 below); no other call this script makes ever receives it.
         Skipped when -DryRun is passed (used for safely testing preflight validation).
     11. Captures the implementation output and the starting/ending git commit and status,
         and writes the implementation output to .tmp/implementation-review-input.txt.
     12. If Required Reviews is not NONE, and a reviewable implementation diff exists,
         invokes one separate non-interactive Claude session per selected reviewer
         (docs/agents/*.md), each explicitly instructed to only review and report -- never to
         modify, stage, commit, push, write to the database, deploy, or change secrets. Each
         reviewer receives the full role document plus the work package's Objective, Scope,
         and Work Instructions, the implementation completion report, a best-effort
         test/build extract, and the relevant diff (see Defect 2 below). Release Gate (if
         selected) always runs last and also receives the other selected reviewers' outputs.
         Each reviewer's raw output is saved under .tmp/reviews/<name>.txt, and the exact
         prompt sent to it is saved under .tmp/reviews/<name>-prompt.txt for audit/debugging.
         If the implementation failed, or produced no reviewable diff, every selected
         reviewer is deterministically marked FAIL with a documented blocking issue instead of
         being invoked (see Defect 2 / validation item G below) -- this does not depend on a
         model choosing to comply with an instruction.
     13. Prints one compact "CIVICMARKET WORK PACKAGE RESULT" report combining the
         implementation verdict, each reviewer's verdict, git start/end commit, and a
         final status (PASS / PASS WITH CONDITIONS / FAIL) derived only from parsed verdicts
         -- never guessed.

    Testing the reviewer pipeline:
      -TestReviewPipeline skips the real implementation call entirely (synthetic
      implementation output/diff are used instead) and, unless -UseRealReviewers is also
      passed, uses synthetic/mocked reviewer output instead of real Claude reviewer calls,
      via -TestImplementationStatus and -TestReviewerVerdicts. This lets the parsing,
      normalization, ordering, and final-status logic be exercised with zero real Claude
      implementation or reviewer invocations.

      -TestNoDiff (only honored with -TestReviewPipeline) additionally forces the synthetic
      implementation down a "no reviewable diff" path, to validate that every selected
      reviewer is deterministically marked FAIL (missing implementation) without being
      invoked at all -- zero real or synthetic reviewer tokens spent.

      -TestReviewersOverride (only honored with -TestReviewPipeline) overrides which
      reviewers are exercised, independent of docs/CURRENT_WORK_PACKAGE.md's own
      '## Required Reviews' value, so every reviewer role document (including Data Integrity
      and Security, which the current real work package does not select) can have its prompt
      assembly validated without ever modifying docs/CURRENT_WORK_PACKAGE.md. Each selected
      reviewer's fully-assembled prompt is always written to .tmp/reviews/<name>-prompt.txt
      regardless of -UseRealReviewers, so prompt content can be statically verified (full
      role-doc inclusion, no truncation, presence of Objective/Scope/Work Instructions/diff)
      with zero real Claude calls.

    -TestEditPermission is a separate, standalone smoke test (see step 5 above) that never
    touches -TestReviewPipeline, the real implementation, or any reviewer.

    Safety:
      - This script never sets --dangerously-skip-permissions,
        --allow-dangerously-skip-permissions, or --permission-mode bypassPermissions, for any
        invocation, under any parameter combination.
      - The only additional permission this script ever grants beyond a normal interactive
        session is a narrow, explicit --allowedTools Edit allowlist, applied solely to the
        single non-interactive implementation call (see Defect 1 in the project history).
        This lets routine file edits explicitly authorized by the work package's own
        "Allowed Autonomous Actions" section proceed without an unanswerable interactive
        approval prompt. It does not enable Bash, Write, NotebookEdit, database, or
        deployment actions -- those remain governed by whatever permission settings already
        apply (project/user settings, or normal per-call approval), exactly as in an
        interactive session. No reviewer call (Mission, UX, Data Integrity, Security, or
        Release Gate) ever receives this or any other allowlist -- reviewer sessions remain
        review-only.
      - Every prompt is piped to `claude -p` via stdin rather than passed as a command-line
        argument, to avoid Windows/cmd.exe native command-line argument quoting corrupting or
        truncating prompt content that contains embedded double quotes (this previously
        truncated the UX reviewer's prompt around its literal quoted "Central question" text;
        see Defect 3 in the project history).
      - This script does not read, print, or write .env.local or any secret/credential file.
      - This script does not modify application source files, perform database writes, or
        deploy anything. All of that is left to Claude Code's own approval-gated behavior,
        governed by docs/AGENT_WORKFLOW.md and the work package's own approval rules.

.USAGE
    powershell -ExecutionPolicy Bypass -File .\scripts\run-work-package.ps1

    Optional shorter alias (not set up by this script, since that would modify machine/user
    state outside the repository): add a function to your own PowerShell profile, e.g.

        function civicmarket-run { powershell -ExecutionPolicy Bypass -File "J:\CivicMarket\scripts\run-work-package.ps1" }

    then just run `civicmarket-run`. See docs/AGENT_WORKFLOW.md for the workflow this script
    executes.
#>

[CmdletBinding()]
param(
    # Runs every preflight check (including Required Reviews validation) and prints the
    # preflight summary, then exits before invoking Claude. Used for safely testing this
    # script's validation logic without launching a real implementation session.
    [switch]$DryRun,

    # Review-pipeline test mode: skips the real implementation Claude call and (unless
    # -UseRealReviewers is also set) skips real reviewer Claude calls too, using
    # synthetic/mocked text instead. Lets the parsing/normalization/ordering/final-status
    # logic be exercised with zero real Claude implementation or reviewer invocations, and
    # without touching the repository. Never used for a real CivicMarket implementation
    # package.
    [switch]$TestReviewPipeline,

    # Synthetic Implementation verdict used only when -TestReviewPipeline is set.
    [ValidateSet('PASS', 'PARTIAL', 'FAIL')]
    [string]$TestImplementationStatus = 'PASS',

    # Synthetic per-reviewer verdicts used only when -TestReviewPipeline is set and
    # -UseRealReviewers is not passed. Keys are canonical reviewer names (Mission, UX,
    # Data Integrity, Security, Release Gate); values are PASS, "PASS WITH CONDITIONS",
    # FAIL, or UNPARSEABLE (simulates a reviewer response with no recognizable verdict
    # line, to test missing/unusable-result handling). A selected reviewer not present in
    # this hashtable defaults to PASS.
    [hashtable]$TestReviewerVerdicts = @{},

    # Only meaningful with -TestReviewPipeline. When set, reviewers are invoked for real
    # (the implementation call is still skipped). Off by default so pipeline testing never
    # spends real reviewer tokens unless explicitly requested.
    [switch]$UseRealReviewers,

    # Only honored with -TestReviewPipeline. Forces the synthetic implementation down a "no
    # reviewable diff" path, so every selected reviewer is deterministically marked FAIL
    # (missing implementation) without being invoked at all -- validates that this behavior
    # does not depend on a model choosing to comply with an instruction. Zero real or
    # synthetic reviewer tokens are spent either way.
    [switch]$TestNoDiff,

    # Only honored with -TestReviewPipeline. Overrides which reviewers are exercised,
    # independent of docs/CURRENT_WORK_PACKAGE.md's own '## Required Reviews' value, so
    # every reviewer role document (including ones the current real work package does not
    # select) can have its prompt assembly validated without ever modifying
    # docs/CURRENT_WORK_PACKAGE.md. Comma-separated canonical names: Mission, UX,
    # Data Integrity, Security, Release Gate.
    [string[]]$TestReviewersOverride = @(),

    # Standalone smoke test for the Defect 1 fix. Runs two small, real Claude Code calls
    # against a disposable scratch file under .tmp/ only (never application code, never
    # docs/CURRENT_WORK_PACKAGE.md) to prove that a narrow --allowedTools Edit grant allows
    # an unattended edit while the default (no allowlist) does not, then exits. Never
    # invokes the real implementation or any reviewer, and is independent of
    # -TestReviewPipeline and all of its parameters.
    [switch]$TestEditPermission
)

$ErrorActionPreference = 'Stop'

function Fail([string]$Message) {
    Write-Error $Message
    exit 1
}

# --- Helper functions (defined early so they are available to every mode, including the ------
# --- standalone -TestEditPermission smoke test, which exits before the main pipeline runs) ---

function Get-WorkPackageSection {
    param([string]$Content, [string]$HeadingText)
    $lines = $Content -split "`r`n|`n"
    $idx = -1
    for ($i = 0; $i -lt $lines.Count; $i++) {
        if ($lines[$i].Trim() -eq $HeadingText) { $idx = $i; break }
    }
    if ($idx -lt 0) { return '' }
    $collected = @()
    for ($i = $idx + 1; $i -lt $lines.Count; $i++) {
        if ($lines[$i].Trim().StartsWith('## ')) { break }
        $collected += $lines[$i]
    }
    return ($collected -join "`n").Trim()
}

function Invoke-ClaudeCapture {
    param(
        [Parameter(Mandatory)][string]$Prompt,

        # Optional narrow tool allowlist for this single invocation only (e.g. 'Edit'),
        # equivalent to Claude Code's --allowedTools flag. Never used to pass
        # --dangerously-skip-permissions, --allow-dangerously-skip-permissions, or
        # --permission-mode bypassPermissions -- this script never sets any of those, for
        # any invocation, under any parameter combination. Leave unset (the default) for
        # every review-only invocation, so reviewer sessions never receive edit permission.
        [string]$AllowedTools = $null
    )

    $claudeArgs = @('-p')
    if (-not [string]::IsNullOrWhiteSpace($AllowedTools)) {
        $claudeArgs += @('--allowedTools', $AllowedTools)
    }

    # The prompt is piped to Claude via stdin rather than passed as a positional CLI
    # argument. `claude` is invoked through a Node .cmd shim on Windows, which is itself
    # re-parsed by cmd.exe; a prompt containing embedded double quotes (for example, the
    # literal quoted sentence in docs/agents/UX_REVIEWER.md's "Central question" section)
    # can be truncated or corrupted by that re-parsing when passed as a command-line
    # argument. Piping via stdin bypasses native command-line argument quoting entirely.
    # Verified empirically: `claude -p` reads the full prompt from stdin, unmodified, when
    # no positional prompt argument is supplied.
    #
    # Every Claude invocation in this script (implementation, reviewers, Release Gate, and
    # all test modes, including -TestEditPermission) goes through this one function, which
    # always calls the single resolved executable path in $script:ClaudeExePath -- set once,
    # early, by the robust discovery block below. This script never calls the bare `claude`
    # command name directly anywhere else.
    $captured = $Prompt | & $script:ClaudeExePath @claudeArgs 2>&1 | Out-String
    return [PSCustomObject]@{ Output = $captured; ExitCode = $LASTEXITCODE }
}

function Get-FirstRegexGroup {
    param([string]$Text, [string]$Pattern)
    if ([string]::IsNullOrWhiteSpace($Text)) { return $null }
    $m = [regex]::Match($Text, $Pattern)
    if ($m.Success) { return $m.Groups[1].Value.Trim() }
    return $null
}

function Get-TruncatedText {
    param([string]$Text, [int]$MaxLength = 6000)
    if ([string]::IsNullOrEmpty($Text)) { return $Text }
    if ($Text.Length -le $MaxLength) { return $Text }
    return $Text.Substring(0, $MaxLength) + "`n...[truncated for token efficiency]..."
}

function Remove-UnrelatedStatusLines {
    param([string]$StatusText, [string]$UnrelatedPath)
    if ([string]::IsNullOrWhiteSpace($StatusText)) { return $StatusText }
    ($StatusText -split "`r`n|`n" | Where-Object { $_ -notmatch [regex]::Escape($UnrelatedPath) }) -join "`n"
}

function Get-TestBuildResultsText {
    param([string]$ImplementationOutput)
    if ([string]::IsNullOrWhiteSpace($ImplementationOutput)) {
        return '(not separately available; implementation produced no output)'
    }
    $lines = $ImplementationOutput -split "`r`n|`n"
    $testBuildLines = $lines | Where-Object { $_ -match '(?i)\b(test|tests|lint|build)\b' }
    if (-not $testBuildLines -or @($testBuildLines).Count -eq 0) {
        return '(not separately reported by the implementation; see the completion report above for full context)'
    }
    return (@($testBuildLines) -join "`n")
}

# 1. Determine repository root from this script's own location.
$scriptDir = $PSScriptRoot
if ([string]::IsNullOrWhiteSpace($scriptDir)) {
    $scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
}
if ([string]::IsNullOrWhiteSpace($scriptDir)) {
    Fail "Could not determine this script's location. Run it via 'powershell -File .\scripts\run-work-package.ps1' from the repository."
}
$repoRoot = Split-Path -Parent $scriptDir

# 2. Change to the repository root.
if (-not (Test-Path -LiteralPath $repoRoot -PathType Container)) {
    Fail "Resolved repository root does not exist: $repoRoot"
}
Set-Location -LiteralPath $repoRoot

Write-Host "Repository path: $repoRoot"

# 2a. Prepare .tmp/ output directories (gitignored -- see .gitignore). Created early and
# unconditionally so both the standalone -TestEditPermission smoke test and the main
# pipeline can rely on them.
$tmpDir = Join-Path -Path $repoRoot -ChildPath '.tmp'
$reviewsDir = Join-Path -Path $tmpDir -ChildPath 'reviews'
if (-not (Test-Path -LiteralPath $tmpDir)) { New-Item -ItemType Directory -Path $tmpDir | Out-Null }
if (-not (Test-Path -LiteralPath $reviewsDir)) { New-Item -ItemType Directory -Path $reviewsDir | Out-Null }

# 3. Verify required files exist.
$requiredFiles = @(
    'CLAUDE.md',
    'docs/AGENT_WORKFLOW.md',
    'docs/CURRENT_WORK_PACKAGE.md'
)

$missing = @()
foreach ($relPath in $requiredFiles) {
    $fullPath = Join-Path -Path $repoRoot -ChildPath $relPath
    if (-not (Test-Path -LiteralPath $fullPath -PathType Leaf)) {
        $missing += $relPath
    }
}

# 4. Stop with a clear error if any are missing.
if ($missing.Count -gt 0) {
    Fail "Missing required file(s): $($missing -join ', '). Cannot start the work package runner."
}

# 5. Resolve the Claude Code executable. Normal PATH discovery (Get-Command) is tried
# first, unchanged from before. If that fails, this falls back to the known Windows
# npm-global install locations under $env:APPDATA (never a hardcoded username), preferring
# claude.cmd over claude.ps1 if both exist. The resolved path is stored once, in
# $script:ClaudeExePath, and every Claude invocation in this script (implementation,
# reviewer sessions, Release Gate, and all test modes) goes through Invoke-ClaudeCapture,
# which always uses this one variable -- see Invoke-ClaudeCapture above. If no executable
# can be resolved by either method, this fails before any implementation starts and prints
# every location that was checked; it does not guess any further location.
$script:ClaudeExePath = $null
$claudePathsChecked = @()

$claudeCmd = Get-Command claude -ErrorAction SilentlyContinue
if ($claudeCmd) {
    $script:ClaudeExePath = if (-not [string]::IsNullOrWhiteSpace($claudeCmd.Source)) { $claudeCmd.Source } else { 'claude' }
    $claudePathsChecked += "Get-Command claude -> $($script:ClaudeExePath) (found)"
} else {
    $claudePathsChecked += 'Get-Command claude (not found on PATH)'

    $appDataCmdPath = Join-Path -Path $env:APPDATA -ChildPath 'npm\claude.cmd'
    $appDataPs1Path = Join-Path -Path $env:APPDATA -ChildPath 'npm\claude.ps1'

    if (Test-Path -LiteralPath $appDataCmdPath -PathType Leaf) {
        $script:ClaudeExePath = $appDataCmdPath
        $claudePathsChecked += "$appDataCmdPath (found, preferred over claude.ps1)"
    } else {
        $claudePathsChecked += "$appDataCmdPath (not found)"

        if (Test-Path -LiteralPath $appDataPs1Path -PathType Leaf) {
            $script:ClaudeExePath = $appDataPs1Path
            $claudePathsChecked += "$appDataPs1Path (found)"
        } else {
            $claudePathsChecked += "$appDataPs1Path (not found)"
        }
    }
}

if (-not $script:ClaudeExePath) {
    Write-Host "Could not resolve the Claude Code executable. Paths checked:"
    foreach ($checkedPath in $claudePathsChecked) { Write-Host "  - $checkedPath" }
    Fail "Install/configure the Claude Code CLI (or ensure it is discoverable via PATH or `$env:APPDATA\npm\) before running this script."
}

Write-Host "Resolved Claude Code executable: $($script:ClaudeExePath)"

# 5a. Standalone smoke test for Defect 1 (implementation edit permission). Independent of
# every other mode; runs two small, real Claude Code calls against a disposable scratch file
# under .tmp/ only, then exits. Never touches application code, docs/CURRENT_WORK_PACKAGE.md,
# git, or the reviewer pipeline.
if ($TestEditPermission) {
    Write-Host "TEST MODE (-TestEditPermission): validating the narrow Edit-tool allowlist mechanism."
    Write-Host "This performs two small, real Claude Code calls against a disposable scratch file"
    Write-Host "under .tmp/ only -- no application source file, docs/CURRENT_WORK_PACKAGE.md, or"
    Write-Host "repository content outside .tmp/ is touched. No --dangerously-skip-permissions,"
    Write-Host "--allow-dangerously-skip-permissions, or --permission-mode bypassPermissions is"
    Write-Host "ever used, in this mode or any other."
    Write-Host ""

    $scratchPath = Join-Path -Path $tmpDir -ChildPath 'edit-permission-smoketest.txt'
    $editPrompt = "The file at $scratchPath currently contains the single line 'before-edit'. " +
        "Using the Edit tool only, replace its contents with the single line 'edited-ok' " +
        "exactly, with no other file touched. Reply with exactly one word: PASS if you " +
        "successfully edited it, or BLOCKED if you were not able to because of a permission " +
        "check."

    Set-Content -LiteralPath $scratchPath -Value 'before-edit'
    Write-Host "Call 1 (baseline, no --allowedTools): expected to be blocked / not edit the file."
    $baselineResult = Invoke-ClaudeCapture -Prompt $editPrompt
    $baselineContent = (Get-Content -LiteralPath $scratchPath -Raw).Trim()
    $baselineEdited = ($baselineContent -eq 'edited-ok')

    Set-Content -LiteralPath $scratchPath -Value 'before-edit'
    Write-Host "Call 2 (-AllowedTools 'Edit'): expected to succeed unattended."
    $allowedResult = Invoke-ClaudeCapture -Prompt $editPrompt -AllowedTools 'Edit'
    $allowedContent = (Get-Content -LiteralPath $scratchPath -Raw).Trim()
    $allowedEdited = ($allowedContent -eq 'edited-ok')

    Remove-Item -LiteralPath $scratchPath -Force -ErrorAction SilentlyContinue

    Write-Host ""
    Write-Host "Baseline (no allowlist) edited the scratch file: $baselineEdited"
    Write-Host "Baseline output:"
    Write-Host $baselineResult.Output
    Write-Host ""
    Write-Host "With -AllowedTools 'Edit' edited the scratch file: $allowedEdited"
    Write-Host "Allowed output:"
    Write-Host $allowedResult.Output
    Write-Host ""

    if ($allowedEdited -and -not $baselineEdited) {
        Write-Host "TEST RESULT: PASS -- the narrow --allowedTools Edit grant enables unattended editing; the default (no allowlist) call does not."
        exit 0
    } elseif ($allowedEdited -and $baselineEdited) {
        Write-Host "TEST RESULT: INCONCLUSIVE -- the baseline call also edited the file (this indicates a permissive project/user setting outside this script's control, not a defect in this mechanism); the -AllowedTools call succeeded as expected."
        exit 0
    } else {
        Write-Host "TEST RESULT: FAIL -- the -AllowedTools 'Edit' call did not result in the expected edit."
        exit 1
    }
}

# 6. Display repository path, current git branch, and concise git status.
$gitCmd = Get-Command git -ErrorAction SilentlyContinue
if (-not $gitCmd) {
    Fail "The 'git' command was not found on PATH."
}

$branch = (& git branch --show-current) 2>$null
if ([string]::IsNullOrWhiteSpace($branch)) {
    $branch = '(detached HEAD or unknown)'
}
Write-Host "Current branch: $branch"

Write-Host ""
Write-Host "Git status (short):"
& git status --short
Write-Host ""

# 7. Read the current work package.
$workPackagePath = Join-Path -Path $repoRoot -ChildPath 'docs/CURRENT_WORK_PACKAGE.md'
$workPackageContent = Get-Content -LiteralPath $workPackagePath -Raw

# 7a. Safety preflight: refuse to launch Claude if the work package is still the blank
# READY template. Checked before Claude is invoked in any way.
$placeholderStrings = @(
    'Replace this section with the approved work objective.',
    'Replace with approved work items.',
    'Replace this section with the actual approved instructions.'
)

foreach ($placeholder in $placeholderStrings) {
    if ($workPackageContent.Contains($placeholder)) {
        Write-Host "CivicMarket work package is not configured."
        Write-Host "Fill in docs/CURRENT_WORK_PACKAGE.md before running this command."
        exit 1
    }
}

# 7b. Safety preflight: verify the work package has all required sections.
$requiredSections = @(
    '## Status',
    '## Objective',
    '## Scope',
    '## Required Reviews',
    '## Commit / Push Authorization',
    '## Work Instructions'
)

$missingSections = @()
foreach ($section in $requiredSections) {
    if (-not $workPackageContent.Contains($section)) {
        $missingSections += $section
    }
}

if ($missingSections.Count -gt 0) {
    Fail "docs/CURRENT_WORK_PACKAGE.md is missing required section(s): $($missingSections -join ', '). Cannot start the work package runner."
}

# 7c. Extract the ## Required Reviews section value (the line(s) between that heading and
# the next ## heading, or end of file).
$workPackageLines = $workPackageContent -split "`r`n|`n"

$requiredReviewsHeading = '## Required Reviews'
$headingIndex = -1
for ($i = 0; $i -lt $workPackageLines.Count; $i++) {
    if ($workPackageLines[$i].Trim() -eq $requiredReviewsHeading) {
        $headingIndex = $i
        break
    }
}

if ($headingIndex -lt 0) {
    Fail "docs/CURRENT_WORK_PACKAGE.md does not contain a '## Required Reviews' heading on its own line. Cannot start the work package runner."
}

$valueLines = @()
for ($i = $headingIndex + 1; $i -lt $workPackageLines.Count; $i++) {
    if ($workPackageLines[$i].Trim().StartsWith('## ')) {
        break
    }
    $valueLines += $workPackageLines[$i]
}

$requiredReviewsRaw = ($valueLines -join "`n").Trim()

if ([string]::IsNullOrWhiteSpace($requiredReviewsRaw)) {
    Fail "## Required Reviews is blank in docs/CURRENT_WORK_PACKAGE.md. Specify NONE, or a comma-separated list of reviewer names (Mission, UX, Data Integrity, Security, Release Gate)."
}

# 7d. Canonical reviewer names and their review-file mapping (docs/agents/*).
$reviewerFileMap = [ordered]@{
    'Mission'        = 'docs/agents/MISSION_REVIEWER.md'
    'UX'             = 'docs/agents/UX_REVIEWER.md'
    'Data Integrity' = 'docs/agents/DATA_INTEGRITY_REVIEWER.md'
    'Security'       = 'docs/agents/SECURITY_REVIEWER.md'
    'Release Gate'   = 'docs/agents/RELEASE_GATE.md'
}

$canonicalLookup = @{}
foreach ($canonicalName in $reviewerFileMap.Keys) {
    $canonicalLookup[$canonicalName.ToLowerInvariant()] = $canonicalName
}

# 7e. Parse, validate, and normalize the Required Reviews tokens.
$reviewTokens = $requiredReviewsRaw -split ',' | ForEach-Object { $_.Trim() } | Where-Object { $_ -ne '' }

if ($reviewTokens.Count -eq 0) {
    Fail "## Required Reviews is blank in docs/CURRENT_WORK_PACKAGE.md. Specify NONE, or a comma-separated list of reviewer names (Mission, UX, Data Integrity, Security, Release Gate)."
}

$hasNoneToken = $false
foreach ($reviewToken in $reviewTokens) {
    if ($reviewToken.ToLowerInvariant() -eq 'none') {
        $hasNoneToken = $true
    }
}

if ($hasNoneToken -and $reviewTokens.Count -gt 1) {
    Fail "## Required Reviews cannot combine NONE with other reviewer names in docs/CURRENT_WORK_PACKAGE.md (found: $($reviewTokens -join ', ')). Use 'NONE' alone, or list only reviewer names."
}

$normalizedReviewers = @()

if (-not $hasNoneToken) {
    $unknownTokens = @()
    foreach ($reviewToken in $reviewTokens) {
        $lookupKey = $reviewToken.ToLowerInvariant()
        if ($canonicalLookup.ContainsKey($lookupKey)) {
            $normalizedReviewers += $canonicalLookup[$lookupKey]
        } else {
            $unknownTokens += $reviewToken
        }
    }

    if ($unknownTokens.Count -gt 0) {
        Fail "## Required Reviews contains unknown reviewer name(s) in docs/CURRENT_WORK_PACKAGE.md: $($unknownTokens -join ', '). Valid names are: Mission, UX, Data Integrity, Security, Release Gate (or NONE)."
    }

    $duplicateGroups = $normalizedReviewers | Group-Object | Where-Object { $_.Count -gt 1 }
    if ($duplicateGroups.Count -gt 0) {
        $duplicateNames = ($duplicateGroups | ForEach-Object { $_.Name }) -join ', '
        Fail "## Required Reviews contains duplicate reviewer name(s) in docs/CURRENT_WORK_PACKAGE.md: $duplicateNames. Each reviewer may be listed once."
    }
}

# 7f. Verify every requested reviewer's file exists under docs/agents/.
$missingReviewerFiles = @()
foreach ($normalizedReviewer in $normalizedReviewers) {
    $reviewerRelPath = $reviewerFileMap[$normalizedReviewer]
    $reviewerFullPath = Join-Path -Path $repoRoot -ChildPath $reviewerRelPath
    if (-not (Test-Path -LiteralPath $reviewerFullPath -PathType Leaf)) {
        $missingReviewerFiles += $reviewerRelPath
    }
}

if ($missingReviewerFiles.Count -gt 0) {
    Fail "Required reviewer file(s) not found: $($missingReviewerFiles -join ', '). Cannot start the work package runner."
}

$requiredReviewsDisplay = if ($normalizedReviewers.Count -eq 0) { 'NONE' } else { $normalizedReviewers -join ', ' }

# 8. Preflight summary, shown before Claude launches. Does not expose secrets or
# environment-variable values.
Write-Host "CivicMarket Work Package"
Write-Host "Repository: $repoRoot"
Write-Host "Branch: $branch"
Write-Host "Required Reviews: $requiredReviewsDisplay"
Write-Host ""

if ($DryRun) {
    Write-Host "Dry run: preflight validation complete. Claude was not launched."
    exit 0
}

# --- Reviewer verdict patterns, matching each reviewer doc's own "Output format" heading. -----
$reviewerVerdictPatterns = @{
    'Mission'        = '(?im)^MISSION REVIEW:\s*(PASS WITH CONDITIONS|PASS|FAIL)'
    'UX'             = '(?im)^UX REVIEW:\s*(PASS WITH CONDITIONS|PASS|FAIL)'
    'Data Integrity' = '(?im)^DATA INTEGRITY REVIEW:\s*(PASS WITH CONDITIONS|PASS|FAIL)'
    'Security'       = '(?im)^SECURITY REVIEW:\s*(PASS WITH CONDITIONS|PASS|FAIL)'
    'Release Gate'   = '(?im)^RELEASE DECISION:\s*(PASS WITH CONDITIONS|PASS|FAIL)'
}

# Output filenames under .tmp/reviews/ for each canonical reviewer name.
$reviewerOutputFileNameMap = @{
    'Mission'        = 'mission.txt'
    'UX'             = 'ux.txt'
    'Data Integrity' = 'data-integrity.txt'
    'Security'       = 'security.txt'
    'Release Gate'   = 'release-gate.txt'
}

$unrelatedFileRelPath = 'src/app/api/admin/extract-shannon-martin-evidence/route.ts'

# Sentinel string meaning "the implementation produced no reviewable file changes". Shared
# between the real path and -TestNoDiff so both use exactly the same value (see Defect 2 /
# validation item G: any reviewer facing this diff is deterministically marked FAIL rather
# than invoked, instead of relying on a model choosing to comply with an instruction).
$noDiffPlaceholder = '(no tracked changes relevant to this work package were found)'

$objectiveText = Get-WorkPackageSection -Content $workPackageContent -HeadingText '## Objective'
$scopeText = Get-WorkPackageSection -Content $workPackageContent -HeadingText '## Scope'
$workInstructionsText = Get-WorkPackageSection -Content $workPackageContent -HeadingText '## Work Instructions'

# --- Git snapshot before implementation -----------------------------------------------------

$startCommit = ((& git rev-parse HEAD) 2>$null | Out-String).Trim()
$startStatusRaw = ((& git status --short) 2>$null | Out-String)

# --- Implementation phase: real Claude call, or synthetic output in -TestReviewPipeline ----

if ($TestReviewPipeline) {
    Write-Host "TEST MODE (-TestReviewPipeline): using synthetic implementation output and diff."
    Write-Host "No real implementation package will be executed."
    Write-Host ""

    $claudeExitCode = 0
    $implementationStatus = $TestImplementationStatus

    if ($TestNoDiff) {
        Write-Host "TEST MODE (-TestNoDiff): simulating a completed implementation call that made no"
        Write-Host "reviewable file changes, to validate the missing-diff review behavior without"
        Write-Host "spending any real implementation or reviewer tokens."
        Write-Host ""
        $implementationOutput = @"
## Report

- $TestImplementationStatus
- branch: $branch
- files changed: (none -- synthetic -TestNoDiff scenario)
- database writes: NO
- deployment: NO

(Synthetic implementation output generated by -TestReviewPipeline -TestNoDiff for safe pipeline
testing. No real CivicMarket implementation package was executed.)
"@
        $targetedDiff = $noDiffPlaceholder
    } else {
        $implementationOutput = @"
## Report

- $TestImplementationStatus
- branch: $branch
- files changed: docs/example-test-file.md (synthetic)
- database writes: NO
- deployment: NO

(Synthetic implementation output generated by -TestReviewPipeline for safe pipeline testing.
No real CivicMarket implementation package was executed.)
"@
        $targetedDiff = "diff --git a/docs/example-test-file.md b/docs/example-test-file.md`n(synthetic diff generated by -TestReviewPipeline)"
    }

    $endCommit = $startCommit
    $endStatusRaw = $startStatusRaw
} else {
    # 10. Build the implementation prompt and invoke Claude for real.
    $instruction = @'
Read CLAUDE.md, CIVICMARKET_CURRENT_STATE.md, docs/AGENT_WORKFLOW.md,
docs/agent_handoff.json, and docs/CURRENT_WORK_PACKAGE.md.

Execute docs/CURRENT_WORK_PACKAGE.md as the authoritative approved work package.

Follow all safety, git, approval, testing, documentation, and completion rules
defined in docs/AGENT_WORKFLOW.md.

This session has been granted a narrow, explicit permission to use the Edit tool,
scoped only to files within this approved work package. You may make approved edits
without needing to ask for permission. This does not extend to any other tool or to
any explicit-approval boundary defined in docs/AGENT_WORKFLOW.md or this work
package -- still stop and request explicit approval before any of those.

Do not stop after routine safe steps. Continue autonomously through the approved
scope unless an explicit-approval boundary is reached.

At completion, return only the concise standardized completion report.
'@

    $fullPrompt = $workPackageContent.TrimEnd() + "`n`n" + $instruction

    Write-Host "Starting Claude Code non-interactively (claude -p) with the current work package."
    Write-Host "This call is granted a narrow --allowedTools Edit allowlist only (see Defect 1)."
    Write-Host "No --dangerously-skip-permissions, --allow-dangerously-skip-permissions, or"
    Write-Host "--permission-mode bypassPermissions is set; every other tool remains subject to"
    Write-Host "normal Claude Code permission checks exactly as in an interactive session."
    Write-Host ""

    # Invoke Claude Code in non-interactive print mode, with a narrow Edit-only allowlist so
    # routine, approved file edits do not stall waiting for an unanswerable interactive
    # approval prompt. Deliberately does NOT pass:
    #   --dangerously-skip-permissions
    #   --allow-dangerously-skip-permissions
    #   --permission-mode bypassPermissions
    $implResult = Invoke-ClaudeCapture -Prompt $fullPrompt -AllowedTools 'Edit'
    $implementationOutput = $implResult.Output
    $claudeExitCode = $implResult.ExitCode

    Write-Host $implementationOutput

    $endCommit = ((& git rev-parse HEAD) 2>$null | Out-String).Trim()
    $endStatusRaw = ((& git status --short) 2>$null | Out-String)

    if ($startCommit -ne $endCommit) {
        $rawDiff = ((& git diff "$startCommit..$endCommit" -- . ":(exclude)$unrelatedFileRelPath") 2>$null | Out-String)
    } else {
        $rawDiff = ((& git diff HEAD -- . ":(exclude)$unrelatedFileRelPath") 2>$null | Out-String)
    }
    $targetedDiff = $rawDiff.Trim()
    if ([string]::IsNullOrWhiteSpace($targetedDiff)) {
        $targetedDiff = $noDiffPlaceholder
    }

    if ($claudeExitCode -ne 0) {
        $implementationStatus = 'FAIL'
    } else {
        $parsedImpl = Get-FirstRegexGroup -Text $implementationOutput -Pattern '(?im)^\s*[-*]?\s*\**\s*(PASS|PARTIAL|FAIL)\s*\**\s*$'
        if ($null -eq $parsedImpl) {
            $implementationStatus = 'PARTIAL'
        } else {
            $implementationStatus = $parsedImpl.ToUpperInvariant()
        }
    }
}

# 11. Persist the implementation output plus the git snapshot for reviewer input / audit
# trail. Never stores secrets: this is exactly the text Claude itself printed to the
# console, plus git metadata. The unrelated known file is excluded from the status lines.
$startStatusFiltered = Remove-UnrelatedStatusLines -StatusText $startStatusRaw -UnrelatedPath $unrelatedFileRelPath
$endStatusFiltered = Remove-UnrelatedStatusLines -StatusText $endStatusRaw -UnrelatedPath $unrelatedFileRelPath

$implementationInputPath = Join-Path -Path $tmpDir -ChildPath 'implementation-review-input.txt'
$implementationInputContent = @"
$implementationOutput

--- Git snapshot (unrelated known file excluded from status) ---
Start commit: $startCommit
End commit: $endCommit
Start status:
$startStatusFiltered
End status:
$endStatusFiltered
"@
Set-Content -LiteralPath $implementationInputPath -Value $implementationInputContent

# Note on Database writes / Deployment status: these are parsed only from an explicit
# "database writes: YES/NO" / "deployment: YES/NO" self-report in the implementation's own
# completion report (per docs/AGENT_WORKFLOW.md's required report format). If that text is
# absent -- for example because the implementation stopped early, before reaching its own
# completion checklist -- this deliberately reports UNKNOWN rather than guessing NO from the
# mere absence of a keyword, or from the absence of a file diff (a database write would not
# show up in `git diff` at all, so file-diff emptiness is not evidence of "no database
# write"). This script has no mechanism to independently observe network/Supabase calls made
# during the implementation call, so UNKNOWN is the honest result whenever the
# implementation did not explicitly self-report either way.
$dbWritesParsed = Get-FirstRegexGroup -Text $implementationOutput -Pattern '(?im)database writes:\s*(YES|NO)'
$deploymentParsed = Get-FirstRegexGroup -Text $implementationOutput -Pattern '(?im)deployment:\s*(YES|NO)'
$dbWritesDisplay = if ($dbWritesParsed) { $dbWritesParsed.ToUpperInvariant() } else { 'UNKNOWN' }
$deploymentDisplay = if ($deploymentParsed) { $deploymentParsed.ToUpperInvariant() } else { 'UNKNOWN' }

# 12. Run selected reviewers. Skipped entirely if Required Reviews = NONE, if the
# implementation itself failed, or if the implementation produced no reviewable diff (a
# failed or empty implementation has no reliable diff/report to review, and Release Gate
# must never run after either).
$reviewerResults = [ordered]@{
    'Mission'        = 'NOT REQUIRED'
    'UX'             = 'NOT REQUIRED'
    'Data Integrity' = 'NOT REQUIRED'
    'Security'       = 'NOT REQUIRED'
    'Release Gate'   = 'NOT REQUIRED'
}

# Test-only override of which reviewers are exercised (see -TestReviewersOverride above).
# Only honored with -TestReviewPipeline; never affects a real run, and never touches
# docs/CURRENT_WORK_PACKAGE.md.
if ($TestReviewPipeline -and $TestReviewersOverride.Count -gt 0) {
    $overrideUnknown = @()
    $overrideNormalized = @()
    foreach ($tok in $TestReviewersOverride) {
        $key = $tok.Trim().ToLowerInvariant()
        if ($canonicalLookup.ContainsKey($key)) {
            $overrideNormalized += $canonicalLookup[$key]
        } else {
            $overrideUnknown += $tok
        }
    }
    if ($overrideUnknown.Count -gt 0) {
        Fail "TestReviewersOverride contains unknown reviewer name(s): $($overrideUnknown -join ', '). Valid names are: Mission, UX, Data Integrity, Security, Release Gate."
    }
    Write-Host "TEST MODE: overriding Required Reviews with -TestReviewersOverride: $($overrideNormalized -join ', ')"
    Write-Host ""
    $normalizedReviewers = $overrideNormalized
}

$specialistReviewers = $normalizedReviewers | Where-Object { $_ -ne 'Release Gate' }
$releaseGateSelected = $normalizedReviewers -contains 'Release Gate'
$reviewerRawOutputs = @{}

$implementationHasNoDiff = ($targetedDiff -eq $noDiffPlaceholder)

if ($implementationStatus -eq 'FAIL' -or $implementationHasNoDiff) {
    if ($normalizedReviewers.Count -gt 0) {
        $skipReason = if ($implementationStatus -eq 'FAIL') {
            'Implementation failed; selected reviewers were not executed.'
        } else {
            'No reviewable implementation diff was found; the implementation is missing. Selected reviewers were not executed and are deterministically marked FAIL rather than being invoked with nothing to review.'
        }
        Write-Host $skipReason

        foreach ($name in $normalizedReviewers) {
            $reviewerResults[$name] = 'FAIL'

            $skipOutputText = if ($name -eq 'Release Gate') {
                "RELEASE DECISION: FAIL`n`nImplementation: $implementationStatus`n`nBlocking issues:`n- $skipReason`n`nRecommended next step:`n- Re-run the implementation phase so it produces a reviewable diff, then re-run the review pipeline."
            } else {
                $headingWord = switch ($name) {
                    'Mission'        { 'MISSION REVIEW' }
                    'UX'             { 'UX REVIEW' }
                    'Data Integrity' { 'DATA INTEGRITY REVIEW' }
                    'Security'       { 'SECURITY REVIEW' }
                }
                "$headingWord`: FAIL`n`nBlocking issues:`n- $skipReason`n`nEvidence reviewed:`n- Implementation completion report and git diff (none found)"
            }

            $reviewerOutputPath = Join-Path -Path $reviewsDir -ChildPath $reviewerOutputFileNameMap[$name]
            Set-Content -LiteralPath $reviewerOutputPath -Value $skipOutputText
            $reviewerRawOutputs[$name] = $skipOutputText
        }
    }
} elseif ($normalizedReviewers.Count -gt 0) {
    foreach ($name in $specialistReviewers) {
        Write-Host "Running $name reviewer..."

        $roleDocFullPath = Join-Path -Path $repoRoot -ChildPath $reviewerFileMap[$name]
        $roleDocContent = Get-Content -LiteralPath $roleDocFullPath -Raw

        $reviewerPrompt = @"
$roleDocContent

---
WORK PACKAGE CONTEXT (review-only; do not modify any file)

Objective:
$objectiveText

Scope:
$scopeText

Work Instructions:
$workInstructionsText

Implementation completion report:
$(Get-TruncatedText -Text $implementationOutput)

Test/build results (best-effort extract from the completion report above; may be incomplete):
$(Get-TruncatedText -Text (Get-TestBuildResultsText -ImplementationOutput $implementationOutput) -MaxLength 2000)

Relevant diff (unrelated pre-existing modifications excluded):
$(Get-TruncatedText -Text $targetedDiff)

---
INSTRUCTIONS
You are running as the $name reviewer defined above. Follow its Output format exactly.
Review the implementation described above. Do not ask for clarification. If there is no
reviewable implementation diff, return FAIL with a blocking issue stating that the
implementation is missing.
Do not modify, stage, commit, or push any file. Do not perform database writes, deployment,
schema, RLS, or secret changes. Do not remediate any finding you identify -- only review
and report using the exact output format defined above.
"@

        # Persist the exact prompt sent to this reviewer, regardless of whether the call
        # below is real or synthetic, so prompt assembly (full role-doc inclusion, no
        # truncation, presence of Objective/Scope/Work Instructions/diff) can always be
        # statically verified without spending any Claude tokens.
        $reviewerPromptOutputPath = Join-Path -Path $reviewsDir -ChildPath ($reviewerOutputFileNameMap[$name] -replace '\.txt$', '-prompt.txt')
        Set-Content -LiteralPath $reviewerPromptOutputPath -Value $reviewerPrompt

        if ($TestReviewPipeline -and -not $UseRealReviewers) {
            $requestedVerdict = if ($TestReviewerVerdicts.ContainsKey($name)) { $TestReviewerVerdicts[$name] } else { 'PASS' }
            $headingWord = switch ($name) {
                'Mission'        { 'MISSION REVIEW' }
                'UX'             { 'UX REVIEW' }
                'Data Integrity' { 'DATA INTEGRITY REVIEW' }
                'Security'       { 'SECURITY REVIEW' }
            }
            if ($requestedVerdict -eq 'UNPARSEABLE') {
                $reviewerOutput = "This synthetic reviewer response has no recognizable verdict line (generated by -TestReviewPipeline)."
                $reviewerExit = 0
            } else {
                $reviewerOutput = "$headingWord`: $requestedVerdict`n`nFindings:`n- synthetic test finding`n`nBlocking issues:`n- none`n`nEvidence reviewed:`n- synthetic test data (generated by -TestReviewPipeline)"
                $reviewerExit = 0
            }
        } else {
            $reviewerCallResult = Invoke-ClaudeCapture -Prompt $reviewerPrompt
            $reviewerOutput = $reviewerCallResult.Output
            $reviewerExit = $reviewerCallResult.ExitCode
        }

        $reviewerOutputPath = Join-Path -Path $reviewsDir -ChildPath $reviewerOutputFileNameMap[$name]
        Set-Content -LiteralPath $reviewerOutputPath -Value $reviewerOutput
        $reviewerRawOutputs[$name] = $reviewerOutput

        if ($reviewerExit -ne 0) {
            $reviewerResults[$name] = 'FAIL'
            Write-Host "$name reviewer invocation failed (exit $reviewerExit); treated as FAIL/unavailable."
            continue
        }

        $verdict = Get-FirstRegexGroup -Text $reviewerOutput -Pattern $reviewerVerdictPatterns[$name]
        if ($null -eq $verdict) {
            $reviewerResults[$name] = 'FAIL'
            Write-Host "$name reviewer returned no usable/parseable verdict; treated as FAIL/unavailable."
        } elseif ($verdict -match '(?i)^pass with conditions$') {
            $reviewerResults[$name] = 'PASS WITH CONDITIONS'
        } elseif ($verdict -match '(?i)^pass$') {
            $reviewerResults[$name] = 'PASS'
        } else {
            $reviewerResults[$name] = 'FAIL'
        }
    }

    if ($releaseGateSelected) {
        Write-Host "Running Release Gate reviewer (last)..."

        $roleDocFullPath = Join-Path -Path $repoRoot -ChildPath $reviewerFileMap['Release Gate']
        $roleDocContent = Get-Content -LiteralPath $roleDocFullPath -Raw

        $otherReviewsSection = ($specialistReviewers | ForEach-Object {
            "## $_`n$($reviewerRawOutputs[$_])"
        }) -join "`n`n"
        if ([string]::IsNullOrWhiteSpace($otherReviewsSection)) {
            $otherReviewsSection = '(no specialized reviewers were selected for this work package)'
        }

        $releaseGatePrompt = @"
$roleDocContent

---
WORK PACKAGE CONTEXT (review-only; do not modify any file)

Objective:
$objectiveText

Scope:
$scopeText

Work Instructions:
$workInstructionsText

Implementation completion report:
$(Get-TruncatedText -Text $implementationOutput)

Test/build results (best-effort extract from the completion report above; may be incomplete):
$(Get-TruncatedText -Text (Get-TestBuildResultsText -ImplementationOutput $implementationOutput) -MaxLength 2000)

Relevant diff (unrelated pre-existing modifications excluded):
$(Get-TruncatedText -Text $targetedDiff)

Specialized reviewer outputs:
$otherReviewsSection

---
INSTRUCTIONS
You are running as the Release Gate defined above. Follow its Output format exactly.
Review the implementation and reviewer results described above. Do not ask for clarification.
If there is no reviewable implementation diff, or the implementation is otherwise missing,
report Implementation: FAIL and RELEASE DECISION: FAIL with a blocking issue stating that the
implementation is missing -- do not ask what to review.
Do not modify, stage, commit, or push any file. Do not perform database writes, deployment,
schema, RLS, or secret changes. Do not remediate any finding -- only review and report.
"@

        $releaseGatePromptOutputPath = Join-Path -Path $reviewsDir -ChildPath 'release-gate-prompt.txt'
        Set-Content -LiteralPath $releaseGatePromptOutputPath -Value $releaseGatePrompt

        if ($TestReviewPipeline -and -not $UseRealReviewers) {
            $requestedVerdict = if ($TestReviewerVerdicts.ContainsKey('Release Gate')) { $TestReviewerVerdicts['Release Gate'] } else { 'PASS' }
            if ($requestedVerdict -eq 'UNPARSEABLE') {
                $releaseGateOutput = "Synthetic Release Gate response with no recognizable decision line (generated by -TestReviewPipeline)."
                $releaseGateExit = 0
            } else {
                $releaseGateOutput = "RELEASE DECISION: $requestedVerdict`n`nImplementation: $implementationStatus`nTests: NOT RUN`nBuild: NOT RUN`n`nBlocking issues:`n- none`n`n(Synthetic Release Gate output generated by -TestReviewPipeline.)"
                $releaseGateExit = 0
            }
        } else {
            $releaseGateCallResult = Invoke-ClaudeCapture -Prompt $releaseGatePrompt
            $releaseGateOutput = $releaseGateCallResult.Output
            $releaseGateExit = $releaseGateCallResult.ExitCode
        }

        $releaseGateOutputPath = Join-Path -Path $reviewsDir -ChildPath $reviewerOutputFileNameMap['Release Gate']
        Set-Content -LiteralPath $releaseGateOutputPath -Value $releaseGateOutput

        if ($releaseGateExit -ne 0) {
            $reviewerResults['Release Gate'] = 'FAIL'
            Write-Host "Release Gate invocation failed (exit $releaseGateExit); treated as FAIL/unavailable."
        } else {
            $rgVerdict = Get-FirstRegexGroup -Text $releaseGateOutput -Pattern $reviewerVerdictPatterns['Release Gate']
            if ($null -eq $rgVerdict) {
                $reviewerResults['Release Gate'] = 'FAIL'
                Write-Host "Release Gate returned no usable/parseable decision; treated as FAIL/unavailable."
            } elseif ($rgVerdict -match '(?i)^pass with conditions$') {
                $reviewerResults['Release Gate'] = 'PASS WITH CONDITIONS'
            } elseif ($rgVerdict -match '(?i)^pass$') {
                $reviewerResults['Release Gate'] = 'PASS'
            } else {
                $reviewerResults['Release Gate'] = 'FAIL'
            }
        }
    }
}

# 13. Determine the final status. PASS requires implementation PASS and every selected
# review PASS with no conditions; any FAIL anywhere is a hard FAIL; anything else
# (implementation PARTIAL, or any selected review PASS WITH CONDITIONS) is
# PASS WITH CONDITIONS.
$anyFail = ($implementationStatus -eq 'FAIL')
foreach ($name in $normalizedReviewers) {
    if ($reviewerResults[$name] -eq 'FAIL') { $anyFail = $true }
}

$anyCondition = ($implementationStatus -ne 'PASS')
foreach ($name in $normalizedReviewers) {
    if ($reviewerResults[$name] -eq 'PASS WITH CONDITIONS') { $anyCondition = $true }
}

if ($anyFail) {
    $finalStatus = 'FAIL'
} elseif ($anyCondition) {
    $finalStatus = 'PASS WITH CONDITIONS'
} else {
    $finalStatus = 'PASS'
}

# 14. Final compact console report.
Write-Host ""
Write-Host "CIVICMARKET WORK PACKAGE RESULT"
Write-Host ""
Write-Host "Implementation: $implementationStatus"
Write-Host "Implementation permission mode: --allowedTools Edit only (no bypass flags ever set)"
Write-Host ""
Write-Host "Reviews:"
Write-Host "Mission: $($reviewerResults['Mission'])"
Write-Host "UX: $($reviewerResults['UX'])"
Write-Host "Data Integrity: $($reviewerResults['Data Integrity'])"
Write-Host "Security: $($reviewerResults['Security'])"
Write-Host "Release Gate: $($reviewerResults['Release Gate'])"
Write-Host ""
Write-Host "Git:"
Write-Host "Start commit: $startCommit"
Write-Host "End commit: $endCommit"
Write-Host "Branch: $branch"
Write-Host ""
Write-Host "Database writes: $dbWritesDisplay"
Write-Host "Deployment: $deploymentDisplay"
Write-Host ""
Write-Host "Final status:"
Write-Host $finalStatus

if ($finalStatus -eq 'FAIL') {
    exit 1
} else {
    exit 0
}
