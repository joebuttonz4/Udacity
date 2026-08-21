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
     10. Captures the implementation output and the starting/ending git commit and status,
         and writes the implementation output to .tmp/implementation-review-input.txt.
     11. If Required Reviews is not NONE, invokes one separate non-interactive Claude session
         per selected reviewer (docs/agents/*.md), each explicitly instructed to only review
         and report -- never to modify, stage, commit, push, write to the database, deploy,
         or change secrets. Release Gate (if selected) always runs last and also receives the
         other selected reviewers' outputs. Each reviewer's raw output is saved under
         .tmp/reviews/<name>.txt.
     12. Prints one compact "CIVICMARKET WORK PACKAGE RESULT" report combining the
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
    [switch]$DryRun,

    # Review-pipeline test mode: skips the real implementation Claude call and (unless
    # -UseRealReviewers is also passed) skips real reviewer Claude calls too, using
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
    [switch]$UseRealReviewers
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

# 9. Prepare .tmp/ output directories (gitignored -- see .gitignore).
$tmpDir = Join-Path -Path $repoRoot -ChildPath '.tmp'
$reviewsDir = Join-Path -Path $tmpDir -ChildPath 'reviews'
if (-not (Test-Path -LiteralPath $tmpDir)) { New-Item -ItemType Directory -Path $tmpDir | Out-Null }
if (-not (Test-Path -LiteralPath $reviewsDir)) { New-Item -ItemType Directory -Path $reviewsDir | Out-Null }

# --- Helper functions used by the implementation-capture and reviewer pipeline -------------

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
    param([Parameter(Mandatory)][string]$Prompt)
    $captured = & claude -p $Prompt 2>&1 | Out-String
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

# Reviewer verdict line patterns, matching each reviewer doc's own "Output format" heading.
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

$objectiveText = Get-WorkPackageSection -Content $workPackageContent -HeadingText '## Objective'
$scopeText = Get-WorkPackageSection -Content $workPackageContent -HeadingText '## Scope'

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
    $implResult = Invoke-ClaudeCapture -Prompt $fullPrompt
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
        $targetedDiff = '(no tracked changes relevant to this work package were found)'
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

$dbWritesParsed = Get-FirstRegexGroup -Text $implementationOutput -Pattern '(?im)database writes:\s*(YES|NO)'
$deploymentParsed = Get-FirstRegexGroup -Text $implementationOutput -Pattern '(?im)deployment:\s*(YES|NO)'
$dbWritesDisplay = if ($dbWritesParsed) { $dbWritesParsed.ToUpperInvariant() } else { 'UNKNOWN' }
$deploymentDisplay = if ($deploymentParsed) { $deploymentParsed.ToUpperInvariant() } else { 'UNKNOWN' }

# 12. Run selected reviewers. Skipped entirely if Required Reviews = NONE, or if the
# implementation itself failed (a failed implementation has no reliable diff/report to
# review, and Release Gate must never run after a failed implementation).
$reviewerResults = [ordered]@{
    'Mission'        = 'NOT REQUIRED'
    'UX'             = 'NOT REQUIRED'
    'Data Integrity' = 'NOT REQUIRED'
    'Security'       = 'NOT REQUIRED'
    'Release Gate'   = 'NOT REQUIRED'
}

$specialistReviewers = $normalizedReviewers | Where-Object { $_ -ne 'Release Gate' }
$releaseGateSelected = $normalizedReviewers -contains 'Release Gate'
$reviewerRawOutputs = @{}

if ($implementationStatus -eq 'FAIL') {
    if ($normalizedReviewers.Count -gt 0) {
        Write-Host "Implementation failed; selected reviewers were not executed."
        foreach ($name in $normalizedReviewers) {
            $reviewerResults[$name] = 'FAIL'
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

Implementation completion report:
$(Get-TruncatedText -Text $implementationOutput)

Relevant diff (unrelated pre-existing modifications excluded):
$(Get-TruncatedText -Text $targetedDiff)

---
INSTRUCTIONS
You are running as the $name reviewer defined above. Follow its Output format exactly.
Do not modify, stage, commit, or push any file. Do not perform database writes, deployment,
schema, RLS, or secret changes. Do not remediate any finding you identify -- only review
and report using the exact output format defined above.
"@

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

Implementation completion report:
$(Get-TruncatedText -Text $implementationOutput)

Relevant diff (unrelated pre-existing modifications excluded):
$(Get-TruncatedText -Text $targetedDiff)

Specialized reviewer outputs:
$otherReviewsSection

---
INSTRUCTIONS
You are running as the Release Gate defined above. Follow its Output format exactly.
Do not modify, stage, commit, or push any file. Do not perform database writes, deployment,
schema, RLS, or secret changes. Do not remediate any finding -- only review and report.
"@

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
