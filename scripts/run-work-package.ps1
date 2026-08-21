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
      7. Invokes `claude -p` (non-interactive print mode) with a prompt built from the
         contents of docs/CURRENT_WORK_PACKAGE.md plus a fixed instruction block that tells
         Claude to follow docs/AGENT_WORKFLOW.md as the governing safety/process contract.

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
param()

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

# 8. Build the prompt: contents of docs/CURRENT_WORK_PACKAGE.md plus the fixed instruction block.
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
