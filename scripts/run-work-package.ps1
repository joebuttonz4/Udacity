<#
.SYNOPSIS
    Starts Claude Code non-interactively on the current approved CivicMarket work package.

.DESCRIPTION
    This runner reduces manual copy/paste between ChatGPT and Claude Code. It:

      1. Determines the CivicMarket repository root from this script's own location.
      2. Changes directory to the repository root.
      3. Verifies CLAUDE.md, docs/AGENT_WORKFLOW.md, and docs/CURRENT_WORK_PACKAGE.md exist.
      4. Verifies the `claude` CLI is available on PATH.
      5. Prints the repository path, current git branch, and a concise `git status --short`.
      6. Runs a safety preflight on docs/CURRENT_WORK_PACKAGE.md: refuses to launch Claude if
         the file still contains blank-template placeholder text, or is missing any of its
         required sections (## Status, ## Objective, ## Scope, ## Required Reviews,
         ## Commit / Push Authorization, ## Work Instructions).
      7. Parses, validates, and normalizes the ## Required Reviews value (NONE, or a
         comma-separated list drawn only from: Mission, UX, Data Integrity, Security,
         Release Gate). Rejects a blank value, unknown names, duplicates, and NONE combined
         with another name. Verifies every requested reviewer's file under docs/agents/
         exists. This step only validates and maps reviewers — it does not yet invoke any
         reviewer agent (that is added in a future work package).
      8. Displays a concise preflight summary (repository, branch, normalized Required
         Reviews) before Claude launches.
      9. Invokes `claude -p` (non-interactive print mode) with a prompt built from the
         contents of docs/CURRENT_WORK_PACKAGE.md plus a fixed instruction block that tells
         Claude to follow docs/AGENT_WORKFLOW.md as the governing safety/process contract.
         Skipped when -DryRun is passed (used for safely testing preflight validation).

    Safety:
      - This script never sets --dangerously-skip-permissions,
        --allow-dangerously-skip-permissions, or --permission-mode bypassPermissions.
      - Claude's normal permission system (interactive prompts / project permission
        settings) applies exactly as it would in an interactive session.
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
    [switch]$DryRun
)

$ErrorActionPreference = 'Stop'

function Fail([string]$Message) {
    Write-Error $Message
    exit 1
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

# 5. Verify the claude command is available.
$claudeCmd = Get-Command claude -ErrorAction SilentlyContinue
if (-not $claudeCmd) {
    Fail "The 'claude' command was not found on PATH. Install/configure the Claude Code CLI before running this script."
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

# 9. Build the prompt: contents of docs/CURRENT_WORK_PACKAGE.md plus the fixed instruction block.
$instruction = @'
Read CLAUDE.md, CIVICMARKET_CURRENT_STATE.md, docs/AGENT_WORKFLOW.md,
docs/agent_handoff.json, and docs/CURRENT_WORK_PACKAGE.md.

Execute docs/CURRENT_WORK_PACKAGE.md as the authoritative approved work package.

Follow all safety, git, approval, testing, documentation, and completion rules
defined in docs/AGENT_WORKFLOW.md.

Do not stop after routine safe steps. Continue autonomously through the approved
scope unless an explicit-approval boundary is reached.

At completion, return only the concise standardized completion report.
'@

$fullPrompt = $workPackageContent.TrimEnd() + "`n`n" + $instruction

Write-Host "Starting Claude Code non-interactively (claude -p) with the current work package."
Write-Host "No elevated or bypassed permissions are set by this script; normal Claude Code"
Write-Host "permission checks apply exactly as in an interactive session."
Write-Host ""

# Invoke Claude Code in non-interactive print mode. Deliberately does NOT pass:
#   --dangerously-skip-permissions
#   --allow-dangerously-skip-permissions
#   --permission-mode bypassPermissions
& claude -p $fullPrompt

exit $LASTEXITCODE
