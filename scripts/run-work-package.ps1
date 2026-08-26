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
     11. Before the implementation call, captures a minimal-retention, read-only baseline
         (New-BaselineSnapshot): HEAD, a one-way content hash and a sensitivity flag (does the
         filename look like .env*/secret/password/token/key/credentials?) for every
         pre-existing dirty tracked path, and the set of pre-existing untracked paths -- never
         a full copy of any file's content. The one mechanism that can still recover a dirty
         file's exact pre-run content later, `git stash create`, writes a single dangling
         commit object into git's own object database; it never touches the working tree, the
         index, HEAD, or the stash list, and nothing is written under .tmp/ at this stage. See
         "baseline snapshot hygiene" in the project history. After implementation, computes
         exactly what changed during implementation -- whether or not it committed -- by
         comparing each candidate file's baseline hash against its final hash first, and only
         reading actual content (from HEAD, or lazily from the stash object for one file at a
         time) when a hash proves a real comparison is needed, immediately deleting that one
         temporary full-content snapshot under .tmp/diff-isolation-work/ once its incremental
         diff is produced (Get-IsolatedImplementationDiff); see "Issue 2" in the project
         history. Never stashes (applies), resets, checks out, or cleans anything. A
         sensitive-looking path whose hash changed is never read at all and is blocked
         (SensitiveBlockedPaths); a file that changed both before and during implementation in
         a way that cannot otherwise be safely isolated is marked AMBIGUOUS. Either one fails
         the whole implementation/review pipeline safely rather than sending partial or mixed
         evidence to reviewers -- no specific file path is ever hard-coded as an exclusion.
         Writes the implementation output plus the raw git snapshot to
         .tmp/implementation-review-input.txt. Three further hardening fixes from a later
         Codex final runner review are folded into this same mechanism: (a) sensitive-path
         protection (Test-SensitivePath: .env/.env.*/*.pem/*.key/*secret*/*credential*/*token*,
         matched case-insensitively) now applies to every branch of Get-IsolatedImplementationDiff
         -- a clean tracked sensitive file or a brand-new sensitive file that implementation
         touches is blocked exactly like a pre-existing-dirty one, never just the latter; (b)
         Get-GitPorcelainEntries parses `git status --porcelain=v1 -z --no-renames` (NUL-
         delimited, unquoted/unescaped paths) instead of the default newline-delimited, quoted
         format, so spaces, parentheses/brackets, and Unicode filenames parse correctly, and
         Save-GitBlobToFile builds its `git show ref:path` invocation as one properly
         Windows-quoted command-line string (ConvertTo-WindowsCommandLine) rather than an
         unquoted -ArgumentList array element, which Start-Process would otherwise silently
         split apart at any space; (c) the temp-file equality check inside
         Get-OneFileDiffAndCleanUp compares SHA-256 file hashes (Get-FileContentHash) instead
         of `Get-Content -Raw`-decoded text, so binary files, encoding differences, and
         trailing-newline/CRLF-vs-LF-only changes are all detected correctly and byte-safely.
         Two more fixes from a subsequent Codex hardening review are folded in the same way:
         (d) committed-path discovery (used only when implementation commits) now goes through
         Get-GitCommittedPathsBetween, which parses `git diff --name-only -z --no-renames`
         NUL-delimited exactly like Get-GitPorcelainEntries, instead of the default newline-
         delimited `--name-only` -- a committed rename or delete, or a committed path
         containing spaces/parentheses/brackets/Unicode, is discovered and named correctly
         regardless of the repository's or invoking user's rename-detection configuration; (e)
         Invoke-GitDiffNoIndex captures `git diff --no-index` stdout via native OS-level
         redirection to a temporary file (Start-Process -RedirectStandardOutput) and decodes the
         raw bytes with a strict UTF-8 decoder ($script:StrictUtf8Encoding, throwOnInvalidBytes:
         true -- see (f) below), never `(& git ...) | Out-String`, so the reviewer-facing diff
         text is never implicitly re-encoded through PowerShell's own text pipeline or the
         session's console code page. (f) That decode is strict, not the
         [System.Text.Encoding]::UTF8 static property's default replacement-character
         fallback: a git diff containing byte sequences that are not valid UTF-8 (or genuinely
         non-UTF-8 text such as UTF-16, where git's own binary-file detection has not already
         intercepted it) throws instead of silently substituting U+FFFD or guessing another
         encoding, and Get-IsolatedImplementationDiff turns that into a dedicated
         NON_UTF8_REVIEW_REQUIRED classification (NonUtf8Paths) reporting only the affected
         path name -- never its content -- fed into the same fail-safe pipeline abort as
         AMBIGUOUS and SensitiveBlockedPaths. Ordinary git binary-diff metadata ("Binary files
         a/... and b/... differ") is itself plain ASCII text and decodes normally under the
         strict decoder, so it is never misclassified as a UTF-8 failure.
     12. If Required Reviews is not NONE, and a reviewable implementation diff exists (and it
         is not AMBIGUOUS), invokes one separate non-interactive Claude session per selected
         reviewer (docs/agents/*.md), each explicitly instructed to only review and report --
         never to modify, stage, commit, push, write to the database, deploy, or change
         secrets. Each such call is also technically restricted, not just instructed: it is
         invoked with --tools 'Read,Grep,Glob' --strict-mcp-config --no-chrome (see "Issue 1"
         in the project history), so Edit, Write, NotebookEdit, Bash, and any MCP-provided
         tool are simply absent from the session -- a reviewer cannot edit, write via shell,
         stage, commit, push, deploy, or reach a database regardless of what its prompt asks
         it to do. Each reviewer receives the full role document plus the work package's
         Objective, Scope, and Work Instructions, the implementation completion report, a
         best-effort test/build extract, and the isolated, implementation-only diff (see
         Defect 2 below). Release Gate (if selected) always runs last and also receives the
         other selected reviewers' outputs. Each reviewer's raw output is saved under
         .tmp/reviews/<name>.txt, and the exact prompt sent to it is saved under
         .tmp/reviews/<name>-prompt.txt for audit/debugging. If the implementation failed,
         produced no reviewable diff, or produced an AMBIGUOUS diff, every selected reviewer
         is deterministically marked FAIL with a documented blocking issue instead of being
         invoked (see Defect 2 / validation item G below) -- this does not depend on a model
         choosing to comply with an instruction.
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

    -TestReviewerIsolation is a separate, standalone smoke test that runs several small, real
    Claude Code calls using the exact same restricted invocation every real reviewer/Release
    Gate call uses, against a disposable scratch file under .tmp/ only, to prove a reviewer
    session can read supplied context but cannot Edit, cannot write via shell, and cannot
    stage/commit a repository change (ground-truthed against the actual file and git state,
    not the model's own claimed reply). Never touches -TestReviewPipeline, -TestEditPermission,
    the real implementation, or the review pipeline.

    -TestDiffIsolation is a separate, standalone smoke test that builds a disposable, throwaway
    git repository under .tmp/diff-isolation-sandbox/ and exercises the baseline-aware diff
    isolation mechanism (New-BaselineSnapshot / Get-IsolatedImplementationDiff) against every
    required scenario: a pre-existing dirty file excluded when untouched (with no full-content
    copy retained afterward), a pre-existing staged file excluded when untouched, a file dirty
    both before and during implementation isolated to just its incremental change (with its one
    temporary full-content snapshot verified removed afterward), a brand-new untracked file
    included, a committed implementation change included, no implementation change producing an
    empty safe result, a sensitive-looking dirty file (.env.local) that changed further during
    implementation verified blocked -- its content never read, diffed, or copied anywhere under
    .tmp/ -- versus the same file left untouched still being excluded the normal, cheap,
    hash-only way, and a structural check that no persistent full-file baseline snapshot
    directory is ever created; it further exercises Get-GitCommittedPathsBetween directly with
    a committed change to a spaced, Unicode, renamed, and deleted path respectively (each
    discovered and correctly named), plus a parser-level check that its NUL-splitting logic
    does not corrupt a synthetic path containing an embedded tab and double quote (real
    filenames with either cannot be created on this Windows/NTFS test environment). Makes zero
    real Claude calls and never touches the real repository's git state.

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
        interactive session.
      - Every reviewer call (Mission, UX, Data Integrity, Security, Release Gate) is instead
        invoked with a narrow built-in-tool allowlist, --tools 'Read,Grep,Glob'
        --strict-mcp-config --no-chrome (see "Issue 1" in the project history) -- never the
        implementation's --allowedTools Edit grant, and never any broader permission. This is
        a technical restriction enforced by Claude Code itself, not a prompt instruction: a
        tool left out of this allowlist does not exist in the session, so a reviewer session
        cannot edit, create/write files, run a shell command that modifies repository state,
        stage, commit, push, deploy, or perform a database write, regardless of what its
        prompt asks it to do. Verified empirically via -TestReviewerIsolation.
      - Every prompt is piped to `claude -p` via stdin rather than passed as a command-line
        argument, to avoid Windows/cmd.exe native command-line argument quoting corrupting or
        truncating prompt content that contains embedded double quotes (this previously
        truncated the UX reviewer's prompt around its literal quoted "Central question" text;
        see Defect 3 in the project history).
      - This script does not read, print, or write .env.local or any secret/credential file.
        The baseline-aware diff isolation mechanism reinforces this specifically for a
        pre-existing dirty tracked file that also changed during implementation: if its
        filename looks sensitive (.env*, or containing secret/password/token/key/credentials),
        its content is never read, diffed, or copied into .tmp/ to isolate the incremental
        change -- the pipeline fails safely (SensitiveBlockedPaths) instead. A sensitive file
        that is merely dirty and left untouched is still excluded the normal, cheap, hash-only
        way, since no content read is ever needed for that case.
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
    [switch]$TestEditPermission,

    # Standalone smoke test for reviewer read-only tool enforcement. Runs several small, real
    # Claude Code calls, each using the exact same restricted invocation (-ToolsAllowlist
    # 'Read,Grep,Glob' -ReadOnly) that every real reviewer/Release Gate call uses, against
    # disposable scratch files under .tmp/ only (never application code, never
    # docs/CURRENT_WORK_PACKAGE.md). Proves the reviewer session can read/consume supplied
    # context, and cannot Edit, cannot write via shell, and cannot stage/commit a repository
    # change, then exits. Never invokes the real implementation or the review pipeline, and is
    # independent of -TestReviewPipeline and -TestEditPermission.
    [switch]$TestReviewerIsolation,

    # Standalone smoke test for baseline-aware implementation diff isolation. Builds a fully
    # disposable, throwaway git repository under .tmp/diff-isolation-sandbox/ (never the real
    # CivicMarket repository) and exercises New-BaselineSnapshot / Get-IsolatedImplementationDiff
    # against it for every required scenario (pre-existing dirty file excluded, pre-existing
    # staged file excluded, same file dirty-then-further-changed isolated to its incremental
    # diff, new untracked file included, committed change included, no-change case empty), then
    # deletes the sandbox and exits. Makes zero real Claude calls and never touches real
    # repository git state. Independent of every other parameter.
    [switch]$TestDiffIsolation
)

$ErrorActionPreference = 'Stop'

function Fail([string]$Message) {
    Write-Error $Message
    exit 1
}

# Narrow, explicit built-in-tool allowlist used for every reviewer-role Claude invocation
# (Mission, UX, Data Integrity, Security, Release Gate, and the -TestReviewerIsolation smoke
# test). This is a technical constraint enforced by Claude Code itself via --tools, not a
# prompt instruction: Edit, Write, NotebookEdit, Bash, and Agent are simply not present in a
# session started with this allowlist, so a reviewer session cannot edit, create/write files,
# run shell commands, spawn a sub-agent to do so on its behalf, stage, commit, push, deploy, or
# perform a database write, regardless of what its prompt asks it to do. Read/Grep/Glob are
# included because the reviewer role documents explicitly allow reading full files when a diff
# alone is insufficient to judge a change. This allowlist is never applied to the single
# implementation call, which keeps its existing narrow --allowedTools Edit grant unchanged.
$script:ReviewerToolsAllowlist = 'Read,Grep,Glob'

# Strict UTF-8 decoder (throwOnInvalidBytes: true) used for every byte-to-text conversion of
# git diff evidence that reviewers see. Deliberately not the [System.Text.Encoding]::UTF8
# static property, whose default decoder fallback silently substitutes the U+FFFD replacement
# character for any invalid byte sequence instead of failing -- that would let corrupted or
# misinterpreted content enter reviewer evidence without any indication anything was wrong.
# With throwOnInvalidBytes enabled, GetString() throws System.Text.DecoderFallbackException
# instead, which Invoke-GitDiffNoIndex turns into an explicit NON_UTF8_DIFF_EVIDENCE failure
# routed to a dedicated NonUtf8Paths result rather than ever being silently patched over.
$script:StrictUtf8Encoding = New-Object System.Text.UTF8Encoding($false, $true)

# Sentinel prefix distinguishing a strict-UTF-8-decode failure from any other unexpected
# failure while producing one file's isolated diff. Exceptions carrying this prefix are
# classified as NonUtf8Paths (manual review required, content never exposed); any other
# exception keeps the pre-existing, more general AmbiguousPaths classification.
$script:NonUtf8FailureMarker = 'NON_UTF8_DIFF_EVIDENCE:'

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
        [string]$AllowedTools = $null,

        # Optional built-in-tool allowlist equivalent to Claude Code's --tools flag (e.g.
        # 'Read,Grep,Glob'). Unlike --allowedTools (which grants an additional tool without an
        # interactive prompt on top of an otherwise-normal session), --tools restricts which
        # tools exist in the session at all -- a tool left out of this list is not merely
        # unapproved, it is unavailable. Used only for reviewer-role invocations; never combined
        # with -AllowedTools on the same call.
        [string]$ToolsAllowlist = $null,

        # When set, also passes --strict-mcp-config (ignore any project/user-configured MCP
        # servers for this call, so only the explicit -ToolsAllowlist built-in tools are ever
        # available) and --no-chrome (disable Claude in Chrome browser automation for this
        # call). Used together with -ToolsAllowlist for every reviewer-role invocation, so a
        # reviewer session cannot reach any tool beyond the explicit read-only allowlist through
        # an MCP server or browser-automation integration configured on this machine.
        [switch]$ReadOnly
    )

    $claudeArgs = @('-p')
    if (-not [string]::IsNullOrWhiteSpace($AllowedTools)) {
        $claudeArgs += @('--allowedTools', $AllowedTools)
    }
    if (-not [string]::IsNullOrWhiteSpace($ToolsAllowlist)) {
        $claudeArgs += @('--tools', $ToolsAllowlist)
    }
    if ($ReadOnly) {
        $claudeArgs += @('--strict-mcp-config', '--no-chrome')
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

# --- Baseline-aware implementation diff isolation ---------------------------------------------
# The functions below replace the previous start/end-commit-plus-hardcoded-exclusion diff
# mechanism. They isolate exactly the changes introduced by the implementation phase, whether
# or not it committed, and regardless of what tracked/staged/untracked dirty state already
# existed in the repository before implementation started -- without ever staging, committing,
# stashing, resetting, checking out, or cleaning anything. They take -RepoRoot explicitly (via
# `git -C`) rather than relying on the current working directory, so the exact same functions
# can be exercised against a disposable sandbox git repository under .tmp/ for testing
# (-TestDiffIsolation) as against the real repository during a real run.

function Invoke-GitDiffNoIndex {
    param(
        [Parameter(Mandatory)][string]$RepoRoot,
        [Parameter(Mandatory)][string]$PathA,
        [Parameter(Mandatory)][string]$PathB
    )
    # Captures `git diff --no-index` stdout via native OS-level redirection to a temporary
    # file (Start-Process -RedirectStandardOutput), then decodes those raw bytes with the
    # strict UTF-8 decoder ($script:StrictUtf8Encoding, throwOnInvalidBytes: true) -- never
    # `(& git ...) | Out-String`, which pipes native command output through PowerShell's own
    # text pipeline and implicitly decodes bytes using PowerShell's console-encoding/BOM-
    # detection rules before this function ever sees them; and never
    # [System.IO.File]::ReadAllText(path, encoding), whose underlying StreamReader also
    # auto-detects a byte-order mark and can silently switch to a completely different decoder
    # (e.g. UTF-16) regardless of the encoding explicitly passed in. Reading the raw bytes
    # directly (ReadAllBytes) and decoding them with nothing but the strict UTF-8 decoder means
    # the content is either decoded as UTF-8 exactly as git emitted it -- Unicode path names
    # and content, diff +/- markers, a trailing newline or its absence, and a genuine
    # CRLF-vs-LF byte difference all preserved unchanged -- or the decode fails outright; there
    # is no third path where invalid bytes are silently replaced (U+FFFD) or another encoding
    # is silently guessed. git's own binary-file detection message ("Binary files a/... and
    # b/... differ") is itself plain ASCII/UTF-8 text, so this never attempts to decode a
    # binary file's actual raw content -- only that safe metadata line, exactly as git printed
    # it, and it decodes under the strict decoder exactly like any other ASCII text.
    #
    # On a decode failure, this throws with the $script:NonUtf8FailureMarker prefix so the
    # caller (Get-IsolatedImplementationDiff, via Get-OneFileDiffAndCleanUp) can distinguish
    # "this file's diff evidence is not valid UTF-8 and requires manual review" from any other,
    # more general failure -- see NonUtf8Paths in the project history.
    #
    # This native invocation also sidesteps a separate, unrelated hazard entirely: `git diff
    # --no-index` can print a harmless stderr warning (for example an autocrlf line-ending
    # notice) even on ordinary, successful use, and under this script's global
    # $ErrorActionPreference = 'Stop', capturing a native command via `&`/pipeline turns that
    # stderr write into a terminating NativeCommandError at the moment it is written. Start-
    # Process's own stdout/stderr redirection never goes through that PowerShell conversion at
    # all, so no $ErrorActionPreference relaxation is needed here any more.
    $stdoutFile = [System.IO.Path]::GetTempFileName()
    $stderrFile = [System.IO.Path]::GetTempFileName()
    try {
        $commandLine = ConvertTo-WindowsCommandLine -ArgumentList @('-C', $RepoRoot, 'diff', '--no-index', '--', $PathA, $PathB)
        Start-Process -FilePath 'git' -ArgumentList $commandLine `
            -NoNewWindow -Wait -RedirectStandardOutput $stdoutFile -RedirectStandardError $stderrFile | Out-Null
        $rawBytes = [System.IO.File]::ReadAllBytes($stdoutFile)
        try {
            return $script:StrictUtf8Encoding.GetString($rawBytes)
        } catch [System.Text.DecoderFallbackException] {
            throw "$($script:NonUtf8FailureMarker) git diff output for this comparison contains byte sequences that are not valid UTF-8; per the strict-decoding safety rule, this content is never substituted, guessed at with another encoding, or exposed partially decoded."
        }
    } finally {
        Remove-Item -LiteralPath $stdoutFile -Force -ErrorAction SilentlyContinue
        Remove-Item -LiteralPath $stderrFile -Force -ErrorAction SilentlyContinue
    }
}

function ConvertTo-WindowsQuotedArgument {
    param([Parameter(Mandatory)][AllowEmptyString()][string]$Value)
    # Windows PowerShell 5.1 / .NET Framework's ProcessStartInfo has no ArgumentList collection
    # (that only exists on .NET Core/5+) -- Start-Process -ArgumentList on this runtime accepts
    # either a string array (which it simply space-joins, with NO automatic per-element
    # quoting) or one pre-quoted command-line string. Passing an array element such as
    # "abc:file with spaces.txt" straight through therefore silently splits into two separate
    # native arguments (confirmed empirically: git then reports "path 'file' does not exist").
    # This implements the standard Win32/CommandLineToArgvW quoting rules (the same algorithm
    # .NET's own ArgumentList-to-command-line translator and Raymond Chen's canonical
    # documentation of this format use): wrap in double quotes whenever the value is empty or
    # contains a space or a double quote, doubling any run of backslashes that immediately
    # precedes a double quote (or the closing quote), and escaping embedded double quotes.
    if ($Value -eq '') { return '""' }
    if ($Value -notmatch '[\s"]') { return $Value }
    $escaped = $Value -replace '(\\*)"', '$1$1\"'
    if ($escaped -match '(\\+)$') { $escaped = $escaped + $Matches[1] }
    return '"' + $escaped + '"'
}

function ConvertTo-WindowsCommandLine {
    param([Parameter(Mandatory)][string[]]$ArgumentList)
    return (($ArgumentList | ForEach-Object { ConvertTo-WindowsQuotedArgument -Value $_ }) -join ' ')
}

function Save-GitBlobToFile {
    param(
        [Parameter(Mandatory)][string]$RepoRoot,
        [Parameter(Mandatory)][string]$Ref,
        [Parameter(Mandatory)][string]$Path,
        [Parameter(Mandatory)][string]$Destination
    )
    # Extracts a git blob's exact byte content to a file via native OS-level stdout
    # redirection (Start-Process -RedirectStandardOutput), never through PowerShell's own
    # pipeline capture of native command output. Capturing native output as `(& git show ...)`
    # silently splits it into a string array with each line's original line terminator
    # stripped; rejoining with "`n" loses whether the original content ended with a trailing
    # newline or not, which previously corrupted the incremental diff for a file whose
    # pre-existing dirty content happened to lack one. Native redirection preserves the exact
    # bytes, trailing newline included or not. Returns $true if the path existed at Ref (and
    # was written to Destination), $false otherwise (Destination is left absent).
    #
    # The "ref:path" argument is built into one already-quoted command-line string via
    # ConvertTo-WindowsCommandLine, not passed as a raw string inside a -ArgumentList array --
    # see ConvertTo-WindowsQuotedArgument above for why the array form is unsafe here for any
    # path containing a space or other character Start-Process does not itself re-quote.
    $stderrFile = [System.IO.Path]::GetTempFileName()
    try {
        $commandLine = ConvertTo-WindowsCommandLine -ArgumentList @('-C', $RepoRoot, 'show', "${Ref}:$Path")
        $proc = Start-Process -FilePath 'git' -ArgumentList $commandLine `
            -NoNewWindow -Wait -PassThru -RedirectStandardOutput $Destination -RedirectStandardError $stderrFile
        if ($proc.ExitCode -ne 0) {
            Remove-Item -LiteralPath $Destination -Force -ErrorAction SilentlyContinue
            return $false
        }
        return $true
    } finally {
        Remove-Item -LiteralPath $stderrFile -Force -ErrorAction SilentlyContinue
    }
}

function Get-GitPorcelainEntries {
    param([Parameter(Mandatory)][string]$RepoRoot)
    # NUL-delimited (-z), not the default newline-delimited, porcelain output: git's default
    # text format quotes and C-escapes any path containing a space, a double quote, a
    # backslash, or (unless core.quotePath=false) any non-ASCII byte, and represents a rename
    # as "old -> new" on one line -- all of which would corrupt a naive line-by-line
    # Substring() parse for a path with spaces, parentheses/brackets, or Unicode characters.
    # With -z, each record is terminated by a raw NUL byte instead, paths are emitted
    # completely unquoted/unescaped, and (confirmed empirically: NUL bytes survive intact
    # through PowerShell's native-command capture and Out-String) splitting the captured text
    # on "`0" recovers the exact original bytes for every path. --no-renames is kept so every
    # record is a single "XY<space>PATH" entry (never the two-NUL-field rename record shape);
    # a rename therefore surfaces here as a plain delete of the old path plus a plain add of
    # the new one, which Get-IsolatedImplementationDiff already isolates and diffs correctly
    # like any other deleted/added path -- explicit, not lossy.
    $previousPreference = $ErrorActionPreference
    try {
        $ErrorActionPreference = 'Continue'
        $raw = ((& git -C $RepoRoot status --porcelain=v1 -z --no-renames) 2>$null | Out-String)
    } finally {
        $ErrorActionPreference = $previousPreference
    }

    $entries = @()
    if ([string]::IsNullOrEmpty($raw)) { return $entries }
    foreach ($record in ($raw -split "`0")) {
        if ($record.Length -lt 3) { continue }
        $x = $record.Substring(0, 1)
        $y = $record.Substring(1, 1)
        $path = $record.Substring(3)
        if ([string]::IsNullOrEmpty($path)) { continue }
        $entries += [PSCustomObject]@{ X = $x; Y = $y; Path = $path }
    }
    return $entries
}

function Get-GitCommittedPathsBetween {
    param(
        [Parameter(Mandatory)][string]$RepoRoot,
        [Parameter(Mandatory)][string]$FromRef,
        [Parameter(Mandatory)][string]$ToRef
    )
    # Enumerates every path that differs between two commits using the same NUL-delimited,
    # deterministic approach as Get-GitPorcelainEntries -- `git diff --name-only -z
    # --no-renames`, not the default newline-delimited `--name-only` -- so a committed path
    # containing a space, parentheses/brackets, a tab, an embedded newline, or a Unicode
    # character parses correctly, added/deleted paths are both reported, and a rename never
    # depends on the invoking user's or repository's rename-detection configuration
    # (merge.renames / diff.renames / status.renames can otherwise change default behavior):
    # --no-renames is passed explicitly so a rename deterministically surfaces as a plain
    # delete of the old path plus a plain add of the new one, exactly like the porcelain-status
    # path above, regardless of what config is in effect. Git does not manually unquote here --
    # -z instructs git itself to never quote/escape paths in the first place.
    $previousPreference = $ErrorActionPreference
    try {
        $ErrorActionPreference = 'Continue'
        $raw = ((& git -C $RepoRoot diff --name-only -z --no-renames "$FromRef..$ToRef") 2>$null | Out-String)
    } finally {
        $ErrorActionPreference = $previousPreference
    }

    $paths = @()
    if ([string]::IsNullOrEmpty($raw)) { return $paths }
    foreach ($record in ($raw -split "`0")) {
        # IsNullOrWhiteSpace, not IsNullOrEmpty: capturing via Out-String can append a trailing
        # newline after the last NUL-terminated record (the same artifact already handled in
        # Get-GitPorcelainEntries), which must not be mistaken for a one-character path. A
        # genuine committed path is never whitespace-only on any real filesystem.
        if ([string]::IsNullOrWhiteSpace($record)) { continue }
        $paths += $record
    }
    return $paths
}

function Test-SensitivePath {
    param([Parameter(Mandatory)][string]$Path)
    # Mirrors, and slightly extends, the exclusion list already documented elsewhere in this
    # project (see "Internal Beta Session-Start Automation Plan" in
    # CIVICMARKET_CURRENT_STATE.md): .env files, PEM/key material, and any filename that looks
    # like it holds a secret, password, token, or credentials. This is a filename-only check --
    # it never opens or reads the file's content to decide, so classifying a path as sensitive
    # costs nothing in exposure. Every pattern is matched case-insensitively (-imatch), and this
    # single function is the one place both callers (the pre-existing-dirty branch and, per the
    # "sensitive path protection must apply everywhere" fix, every other diff branch too --
    # clean tracked files and brand-new files) consult, so there is exactly one definition of
    # "sensitive" to keep in sync.
    $name = Split-Path -Path $Path -Leaf
    $sensitivePatterns = @(
        '^\.env(\..*)?$'   # .env, .env.local, .env.production, etc.
        '\.pem$'           # *.pem
        '\.key$'           # *.key
        'secret'           # *secret*
        'credential'       # *credential*
        'token'            # *token*
        'password'         # *password*
        'api[-_]?key'      # api-key / api_key / apikey
    )
    foreach ($pattern in $sensitivePatterns) {
        if ($name -imatch $pattern) { return $true }
    }
    return $false
}

function Get-FileContentHash {
    param([Parameter(Mandatory)][string]$Path)
    # Byte-safe equality primitive: a cryptographic hash of the file's raw bytes, computed by
    # the built-in Get-FileHash cmdlet (never Get-Content -Raw, which text-decodes a file
    # using PowerShell's own encoding detection/BOM-sniffing before comparison -- lossy and
    # unreliable for binary files, and can silently disagree between two files that are
    # byte-identical but decoded differently, or agree between two files that differ only in
    # how a decode happened to normalize them). Returns $null if the path does not exist.
    if (-not (Test-Path -LiteralPath $Path -PathType Leaf)) { return $null }
    return (Get-FileHash -LiteralPath $Path -Algorithm SHA256).Hash
}

function Get-GitRefBlobHash {
    param(
        [Parameter(Mandatory)][string]$RepoRoot,
        [Parameter(Mandatory)][string]$Ref,
        [Parameter(Mandatory)][string]$Path
    )
    # Returns the git blob SHA for Path as it exists at Ref (e.g. HEAD) directly from git's own
    # index/object metadata, without reading or returning any file content -- used to detect
    # whether a clean-at-baseline tracked file actually changed before deciding whether any
    # content needs to be read for a real diff at all, mirroring the same hash-first pattern
    # Get-GitBlobHash already applies to the current working-tree file.
    $previousPreference = $ErrorActionPreference
    try {
        $ErrorActionPreference = 'Continue'
        $hash = ((& git -C $RepoRoot rev-parse "${Ref}:${Path}") 2>$null | Out-String).Trim()
    } finally {
        $ErrorActionPreference = $previousPreference
    }
    if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($hash)) { return $null }
    return $hash
}

function Get-GitBlobHash {
    param(
        [Parameter(Mandatory)][string]$RepoRoot,
        [Parameter(Mandatory)][string]$Path
    )
    # Returns the git blob SHA of the path's current on-disk content (like `git hash-object`),
    # or $null if the path does not currently exist. Never writes the object to git's database
    # (no -w) and never returns or retains the file's actual content -- only a one-way digest,
    # used solely to detect whether a file changed at all before deciding whether any content
    # needs to be read for a real diff.
    $full = Join-Path -Path $RepoRoot -ChildPath $Path
    if (-not (Test-Path -LiteralPath $full -PathType Leaf)) { return $null }
    $previousPreference = $ErrorActionPreference
    try {
        $ErrorActionPreference = 'Continue'
        $hash = ((& git -C $RepoRoot hash-object -- $full) 2>$null | Out-String).Trim()
    } finally {
        $ErrorActionPreference = $previousPreference
    }
    if ([string]::IsNullOrWhiteSpace($hash)) { return $null }
    return $hash
}

function New-BaselineSnapshot {
    param([Parameter(Mandatory)][string]$RepoRoot)

    # Minimal-retention baseline capture (see "Issue: baseline snapshot hygiene" in the project
    # history): no full file content is copied anywhere at this stage. For every pre-existing
    # dirty tracked path this records only its path, a one-way content hash (via
    # Get-GitBlobHash), and whether its filename looks sensitive (Test-SensitivePath, filename
    # only, never file content). The one thing that *can* reconstruct full pre-run content
    # later -- `git stash create` -- writes a single dangling commit object into git's own
    # object database; it never touches the working tree, the index, HEAD, or the stash list
    # (unlike `git stash push`/`git stash save`), and it never writes anything under .tmp/. It
    # is only ever read from (via `git show <ref>:path`), and only for one specific
    # non-sensitive path at a time, lazily, in Get-IsolatedImplementationDiff -- never eagerly
    # for every dirty path up front.
    $entries = Get-GitPorcelainEntries -RepoRoot $RepoRoot
    $dirtyTracked = @()
    $untracked = @()
    $sensitivePaths = @()
    $hashMap = @{}

    foreach ($e in $entries) {
        if ($e.X -eq '?' -and $e.Y -eq '?') {
            $untracked += $e.Path
            continue
        }

        # Any other porcelain status means this path is tracked and differs from HEAD, in the
        # index and/or the working tree -- i.e. it was already dirty before implementation
        # started (this deliberately treats staged and unstaged pre-existing changes the same
        # way, since the hash reflects the actual current working-tree content either way).
        $dirtyTracked += $e.Path
        $hashMap[$e.Path] = Get-GitBlobHash -RepoRoot $RepoRoot -Path $e.Path
        if (Test-SensitivePath -Path $e.Path) { $sensitivePaths += $e.Path }
    }

    $stashRef = $null
    if ($dirtyTracked.Count -gt 0) {
        $previousPreference = $ErrorActionPreference
        try {
            $ErrorActionPreference = 'Continue'
            $stashRef = ((& git -C $RepoRoot stash create) 2>$null | Out-String).Trim()
        } finally {
            $ErrorActionPreference = $previousPreference
        }
        if ([string]::IsNullOrWhiteSpace($stashRef)) { $stashRef = $null }
    }

    return [PSCustomObject]@{
        BaselineHead      = ((& git -C $RepoRoot rev-parse HEAD) 2>$null | Out-String).Trim()
        DirtyTrackedPaths = $dirtyTracked
        UntrackedPaths    = $untracked
        HashMap           = $hashMap
        SensitivePaths    = $sensitivePaths
        StashRef          = $stashRef
    }
}

function Get-IsolatedImplementationDiff {
    param(
        [Parameter(Mandatory)][string]$RepoRoot,
        [Parameter(Mandatory)][PSCustomObject]$Baseline,
        [Parameter(Mandatory)][string]$WorkDir
    )

    if (Test-Path -LiteralPath $WorkDir) { Remove-Item -LiteralPath $WorkDir -Recurse -Force }
    New-Item -ItemType Directory -Path $WorkDir | Out-Null

    $endEntries = Get-GitPorcelainEntries -RepoRoot $RepoRoot
    $endDirtyTracked = @()
    $endUntracked = @()
    foreach ($e in $endEntries) {
        if ($e.X -eq '?' -and $e.Y -eq '?') { $endUntracked += $e.Path } else { $endDirtyTracked += $e.Path }
    }

    $newHead = ((& git -C $RepoRoot rev-parse HEAD) 2>$null | Out-String).Trim()
    $committedPaths = @()
    if ($newHead -and $newHead -ne $Baseline.BaselineHead) {
        $committedPaths = Get-GitCommittedPathsBetween -RepoRoot $RepoRoot -FromRef $Baseline.BaselineHead -ToRef $newHead
    }

    $candidatePaths = @($Baseline.DirtyTrackedPaths + $endDirtyTracked + $committedPaths) | Select-Object -Unique

    $includedDiffs = @()
    $ambiguousPaths = @()
    $sensitiveBlockedPaths = @()
    $nonUtf8Paths = @()
    $excludedPreExistingPaths = @()
    $fileCounter = 0

    # Emits a diff for one path using temporary files under $WorkDir, then deletes those
    # temporary files immediately -- before returning -- regardless of outcome. $BaselineMode
    # ('Stash', 'Head', or 'Empty') and $BaselineRef describe how to obtain the baseline side's
    # content, as plain data rather than a scriptblock/closure (a prior scriptblock-closure
    # design here intermittently failed to resolve sibling script functions such as
    # Save-GitBlobToFile when invoked from this nested function's scope -- passing data instead
    # of behavior avoids that class of problem entirely). This keeps the "materialize, diff,
    # delete" pattern identical for every path, whether its baseline content comes from
    # committed HEAD history, from the lazily-extracted stash object, or from nothing (a
    # brand-new file).
    function Get-OneFileDiffAndCleanUp {
        param(
            [Parameter(Mandatory)][string]$WorkDir,
            [Parameter(Mandatory)][int]$FileCounter,
            [Parameter(Mandatory)][string]$RelabelPath,
            [Parameter(Mandatory)][string]$RepoRoot,
            [Parameter(Mandatory)][ValidateSet('Stash', 'Head', 'Empty')][string]$BaselineMode,
            [string]$BaselineRef,
            [Parameter(Mandatory)][string]$FinalOnDiskPath
        )
        # Forward slashes, not Join-Path's backslash separator: on Windows, `git diff
        # --no-index` quotes and C-escapes (doubles every backslash in) any path containing a
        # backslash, which would prevent a literal/regex substitution of the raw path from
        # matching the diff header text afterward. A forward-slash path is emitted unquoted
        # and unescaped, so the later substitution matches exactly.
        $baselineTempFile = (Join-Path -Path $WorkDir -ChildPath "baseline-$FileCounter") -replace '\\', '/'
        $finalTempFile = (Join-Path -Path $WorkDir -ChildPath "final-$FileCounter") -replace '\\', '/'
        try {
            switch ($BaselineMode) {
                'Stash' {
                    $ok = Save-GitBlobToFile -RepoRoot $RepoRoot -Ref $BaselineRef -Path $RelabelPath -Destination $baselineTempFile
                    if (-not $ok) { throw "could not extract pre-run content for '$RelabelPath' from the baseline stash object" }
                }
                'Head' {
                    $ok = Save-GitBlobToFile -RepoRoot $RepoRoot -Ref $BaselineRef -Path $RelabelPath -Destination $baselineTempFile
                    if (-not $ok) {
                        # Did not exist at baseline HEAD at all -- brand-new file.
                        Set-Content -LiteralPath $baselineTempFile -Value '' -NoNewline
                    }
                }
                'Empty' {
                    Set-Content -LiteralPath $baselineTempFile -Value '' -NoNewline
                }
            }

            if (Test-Path -LiteralPath $FinalOnDiskPath -PathType Leaf) {
                Copy-Item -LiteralPath $FinalOnDiskPath -Destination $finalTempFile -Force
            } else {
                Set-Content -LiteralPath $finalTempFile -Value '' -NoNewline
            }

            # Byte-safe equality: a cryptographic hash of each temp file's raw bytes, never a
            # text-decoded comparison (Get-Content -Raw would decode both files using
            # PowerShell's own encoding/BOM detection first, which is lossy and unreliable for
            # binary content, and can misjudge equality across UTF-8/UTF-16/CRLF-LF variants).
            $baselineHashLocal = Get-FileContentHash -Path $baselineTempFile
            $finalHashLocal = Get-FileContentHash -Path $finalTempFile

            if ($baselineHashLocal -eq $finalHashLocal) { return $null }

            $diffText = Invoke-GitDiffNoIndex -RepoRoot $RepoRoot -PathA $baselineTempFile -PathB $finalTempFile
            # Relabel the synthetic temp-file paths in the diff header with the real
            # repo-relative path, using the exact temp paths just used above -- done here,
            # inside the helper, rather than by the caller, so it can never drift out of sync
            # with the temp paths actually passed to Invoke-GitDiffNoIndex.
            $diffText = $diffText -replace [regex]::Escape($baselineTempFile), "a/$RelabelPath"
            $diffText = $diffText -replace [regex]::Escape($finalTempFile), "b/$RelabelPath"
            return $diffText.TrimEnd()
        } finally {
            # Delete this path's temporary full-content snapshot immediately -- it must never
            # outlive this one comparison, whether it came from HEAD, the lazily-extracted
            # stash object, or the current working tree.
            Remove-Item -LiteralPath $baselineTempFile -Force -ErrorAction SilentlyContinue
            Remove-Item -LiteralPath $finalTempFile -Force -ErrorAction SilentlyContinue
        }
    }

    foreach ($path in $candidatePaths) {
        $isPreExistingDirty = $Baseline.DirtyTrackedPaths -contains $path
        $finalOnDisk = Join-Path -Path $RepoRoot -ChildPath $path

        if ($isPreExistingDirty) {
            # Hash-first: if the path's current content hash matches its baseline hash, nothing
            # changed since baseline and no content -- baseline or final -- ever needs to be
            # read to prove that.
            $finalHash = Get-GitBlobHash -RepoRoot $RepoRoot -Path $path
            $baselineHash = $Baseline.HashMap[$path]

            if ($finalHash -eq $baselineHash) {
                $excludedPreExistingPaths += $path
                continue
            }

            if ($Baseline.SensitivePaths -contains $path) {
                # The path's filename looks sensitive (.env*, secret/password/token/key/
                # credential-like) and its content hash changed, meaning isolating the
                # incremental diff would require reading its content. Fail safely instead --
                # its content is never extracted, and it is never copied into .tmp/.
                $sensitiveBlockedPaths += $path
                continue
            }

            if (-not $Baseline.StashRef) {
                # The path was dirty at baseline and has since changed further, but no stash
                # object exists to recover its pre-run content from -- there is nothing safe
                # to diff against. Fail safely rather than guess.
                $ambiguousPaths += $path
                continue
            }

            $fileCounter++
            try {
                $diffText = Get-OneFileDiffAndCleanUp -WorkDir $WorkDir -FileCounter $fileCounter -RelabelPath $path -RepoRoot $RepoRoot -BaselineMode 'Stash' -BaselineRef $Baseline.StashRef -FinalOnDiskPath $finalOnDisk
            } catch {
                if ($_.Exception.Message -like "$($script:NonUtf8FailureMarker)*") { $nonUtf8Paths += $path } else { $ambiguousPaths += $path }
                continue
            }

            if ($null -eq $diffText) { continue }
            $includedDiffs += $diffText
        } else {
            # Clean at baseline (or did not exist at baseline HEAD at all). Sensitive-path
            # protection applies here too, not only to the pre-existing-dirty branch above (see
            # "sensitive path protection must apply everywhere" in the project history): a
            # hash-first check against the path's HEAD blob (Get-GitRefBlobHash, no content
            # read) proves whether it changed at all without reading anything; only if it did
            # change is Test-SensitivePath consulted, and only a change to a non-sensitive path
            # ever reaches Get-OneFileDiffAndCleanUp, which is the only place content is
            # actually read (transiently, deleted immediately after use).
            $headBlobHash = Get-GitRefBlobHash -RepoRoot $RepoRoot -Ref $Baseline.BaselineHead -Path $path
            $finalBlobHash = Get-GitBlobHash -RepoRoot $RepoRoot -Path $path

            if ($headBlobHash -and $headBlobHash -eq $finalBlobHash) {
                # Unchanged from HEAD -- nothing to report, sensitive or not.
                continue
            }

            if (Test-SensitivePath -Path $path) {
                $sensitiveBlockedPaths += $path
                continue
            }

            $fileCounter++
            try {
                $diffText = Get-OneFileDiffAndCleanUp -WorkDir $WorkDir -FileCounter $fileCounter -RelabelPath $path -RepoRoot $RepoRoot -BaselineMode 'Head' -BaselineRef $Baseline.BaselineHead -FinalOnDiskPath $finalOnDisk
            } catch {
                if ($_.Exception.Message -like "$($script:NonUtf8FailureMarker)*") { $nonUtf8Paths += $path } else { $ambiguousPaths += $path }
                continue
            }
            if ($null -eq $diffText) { continue }
            $includedDiffs += $diffText
        }
    }

    # Brand-new untracked files that implementation created but never staged or committed do
    # not appear in $committedPaths (no commit) and are only present in $endDirtyTracked if
    # they were staged -- catch the remaining case (created, still fully untracked) here.
    # Sensitive-path protection applies here too: a brand-new sensitive-looking file (e.g. a
    # freshly created .env) is inherently "changed" (from nothing to something) by its mere
    # existence, so it is blocked outright -- its content is never read, diffed, or emitted as
    # a full new-file diff.
    $newUntrackedPaths = $endUntracked | Where-Object { $Baseline.UntrackedPaths -notcontains $_ -and $candidatePaths -notcontains $_ }
    foreach ($path in $newUntrackedPaths) {
        if (Test-SensitivePath -Path $path) {
            $sensitiveBlockedPaths += $path
            continue
        }

        $fileCounter++
        $finalOnDisk = Join-Path -Path $RepoRoot -ChildPath $path
        try {
            $diffText = Get-OneFileDiffAndCleanUp -WorkDir $WorkDir -FileCounter $fileCounter -RelabelPath $path -RepoRoot $RepoRoot -BaselineMode 'Empty' -FinalOnDiskPath $finalOnDisk
        } catch {
            if ($_.Exception.Message -like "$($script:NonUtf8FailureMarker)*") { $nonUtf8Paths += $path } else { $ambiguousPaths += $path }
            continue
        }
        if ($null -eq $diffText) { continue }
        $includedDiffs += $diffText
    }

    # Belt-and-suspenders final cleanup: every per-file temp pair is already deleted
    # immediately after its own comparison above, but remove the whole work directory too in
    # case anything was left behind by an unexpected early error, so no full-content snapshot
    # -- baseline or final -- can ever persist past this function returning.
    Remove-Item -LiteralPath $WorkDir -Recurse -Force -ErrorAction SilentlyContinue

    return [PSCustomObject]@{
        IncludedDiffText         = ($includedDiffs -join "`n`n").Trim()
        AmbiguousPaths           = $ambiguousPaths
        SensitiveBlockedPaths    = $sensitiveBlockedPaths
        NonUtf8Paths             = $nonUtf8Paths
        ExcludedPreExistingPaths = $excludedPreExistingPaths
    }
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

# 2b. Standalone smoke test for baseline-aware implementation diff isolation. Independent of
# every other mode and of the Claude executable entirely (makes zero real Claude calls). Builds
# a disposable, throwaway git repository under .tmp/diff-isolation-sandbox/ and exits before
# touching the real repository's git state, required-file checks, or Claude resolution.
if ($TestDiffIsolation) {
    Write-Host "TEST MODE (-TestDiffIsolation): validating baseline-aware implementation diff isolation."
    Write-Host "This builds a disposable, throwaway git repository under .tmp/diff-isolation-sandbox/"
    Write-Host "only -- the real CivicMarket repository's git state is never touched, and zero real"
    Write-Host "Claude calls are made."
    Write-Host ""

    $sandboxDir = Join-Path -Path $tmpDir -ChildPath 'diff-isolation-sandbox'
    $workDir = Join-Path -Path $tmpDir -ChildPath 'diff-isolation-sandbox-work'

    function Test-NoLeftoverWorkFiles {
        # Proves no temporary full-content snapshot outlived its one comparison: the work
        # directory must either not exist, or exist and be empty, immediately after
        # Get-IsolatedImplementationDiff returns.
        if (-not (Test-Path -LiteralPath $workDir)) { return $true }
        return ((Get-ChildItem -LiteralPath $workDir -Force -ErrorAction SilentlyContinue) | Measure-Object).Count -eq 0
    }

    function Reset-Sandbox {
        if (Test-Path -LiteralPath $sandboxDir) { Remove-Item -LiteralPath $sandboxDir -Recurse -Force }
        New-Item -ItemType Directory -Path $sandboxDir | Out-Null
        & git -C $sandboxDir init -q
        & git -C $sandboxDir config user.email 'sandbox-test@example.invalid'
        & git -C $sandboxDir config user.name 'CivicMarket Sandbox Test'
        & git -C $sandboxDir config core.autocrlf false
    }

    function Write-SandboxFile([string]$RelPath, [string]$Content) {
        $full = Join-Path -Path $sandboxDir -ChildPath $RelPath
        # A short bounded retry, not a completion-polling loop: a just-exited git subprocess
        # (e.g. from the previous scenario's `git stash create`/Start-Process diff call) can
        # transiently hold a Windows file handle open for a few milliseconds after it reports
        # exit, occasionally racing this write. Observed directly in this test suite.
        $attempt = 0
        while ($true) {
            try {
                Set-Content -LiteralPath $full -Value $Content -NoNewline
                return
            } catch {
                $attempt++
                if ($attempt -ge 5) { throw }
                Start-Sleep -Milliseconds 100
            }
        }
    }

    function Commit-Sandbox([string]$Message) {
        & git -C $sandboxDir add -A | Out-Null
        & git -C $sandboxDir commit -q -m $Message | Out-Null
    }

    $allPass = $true

    # Scenario 5: pre-existing dirty file + new implementation file -> only the new file
    # appears in reviewer evidence.
    Reset-Sandbox
    Write-SandboxFile 'a.txt' 'original a'
    Commit-Sandbox 'seed a'
    Write-SandboxFile 'a.txt' 'pre-existing dirty a'
    $baseline = New-BaselineSnapshot -RepoRoot $sandboxDir
    Write-SandboxFile 'b.txt' 'new implementation file'
    $result = Get-IsolatedImplementationDiff -RepoRoot $sandboxDir -Baseline $baseline -WorkDir $workDir
    $pass5 = ($result.IncludedDiffText -match 'b\.txt') -and ($result.IncludedDiffText -notmatch 'a\.txt') -and ($result.ExcludedPreExistingPaths -contains 'a.txt') -and (Test-NoLeftoverWorkFiles)
    Write-Host "Scenario 5 (pre-existing dirty file + new file, no retained full copy): $(if ($pass5) { 'PASS' } else { 'FAIL' })"
    if (-not $pass5) { $allPass = $false }

    # Scenario 6: pre-existing dirty file untouched + implementation modifies another tracked
    # file -> the dirty baseline file is excluded.
    Reset-Sandbox
    Write-SandboxFile 'a.txt' 'original a'
    Write-SandboxFile 'c.txt' 'original c'
    Commit-Sandbox 'seed a and c'
    Write-SandboxFile 'a.txt' 'pre-existing dirty a'
    $baseline = New-BaselineSnapshot -RepoRoot $sandboxDir
    Write-SandboxFile 'c.txt' 'implementation changed c'
    $result = Get-IsolatedImplementationDiff -RepoRoot $sandboxDir -Baseline $baseline -WorkDir $workDir
    $pass6 = ($result.IncludedDiffText -match 'c\.txt') -and ($result.IncludedDiffText -notmatch 'a\.txt') -and ($result.ExcludedPreExistingPaths -contains 'a.txt') -and (Test-NoLeftoverWorkFiles)
    Write-Host "Scenario 6 (dirty baseline file excluded, other tracked file included, no retained full copy): $(if ($pass6) { 'PASS' } else { 'FAIL' })"
    if (-not $pass6) { $allPass = $false }

    # Scenario 7: same file dirty before and further modified during implementation -> the
    # incremental diff is isolated (never a silent mix of both versions).
    Reset-Sandbox
    Write-SandboxFile 'a.txt' "line1`n"
    Commit-Sandbox 'seed a'
    Write-SandboxFile 'a.txt' "line1`nPRE-EXISTING-DIRTY-LINE`n"
    $baseline = New-BaselineSnapshot -RepoRoot $sandboxDir
    Write-SandboxFile 'a.txt' "line1`nPRE-EXISTING-DIRTY-LINE`nIMPLEMENTATION-ADDED-LINE`n"
    $result = Get-IsolatedImplementationDiff -RepoRoot $sandboxDir -Baseline $baseline -WorkDir $workDir
    $addedLines = ($result.IncludedDiffText -split "`r`n|`n") | Where-Object { $_ -match '^\+[^+]' }
    $pass7 = (($addedLines -join "`n") -match 'IMPLEMENTATION-ADDED-LINE') -and (($addedLines -join "`n") -notmatch 'PRE-EXISTING-DIRTY-LINE') -and ($result.AmbiguousPaths.Count -eq 0) -and (Test-NoLeftoverWorkFiles)
    Write-Host "Scenario 7 (incremental diff isolated for a file dirty both before and during, temporary full-content snapshot removed afterward): $(if ($pass7) { 'PASS' } else { 'FAIL' })"
    if (-not $pass7) { $allPass = $false }

    # Scenario 8: pre-existing staged (not just unstaged) change is excluded when untouched by
    # implementation.
    Reset-Sandbox
    Write-SandboxFile 'a.txt' 'original a'
    Commit-Sandbox 'seed a'
    Write-SandboxFile 'a.txt' 'staged-content'
    & git -C $sandboxDir add a.txt | Out-Null
    $baseline = New-BaselineSnapshot -RepoRoot $sandboxDir
    $result = Get-IsolatedImplementationDiff -RepoRoot $sandboxDir -Baseline $baseline -WorkDir $workDir
    $pass8 = ($result.IncludedDiffText -notmatch 'a\.txt') -and ($result.ExcludedPreExistingPaths -contains 'a.txt') -and (Test-NoLeftoverWorkFiles)
    Write-Host "Scenario 8 (pre-existing staged file excluded when untouched, no retained full copy): $(if ($pass8) { 'PASS' } else { 'FAIL' })"
    if (-not $pass8) { $allPass = $false }

    # Scenario 9: brand-new untracked implementation file (nothing pre-existing at all) is
    # included.
    Reset-Sandbox
    Write-SandboxFile 'a.txt' 'original a'
    Commit-Sandbox 'seed a'
    $baseline = New-BaselineSnapshot -RepoRoot $sandboxDir
    Write-SandboxFile 'newfile.txt' 'brand new untracked implementation file'
    $result = Get-IsolatedImplementationDiff -RepoRoot $sandboxDir -Baseline $baseline -WorkDir $workDir
    $pass9 = ($result.IncludedDiffText -match 'newfile\.txt') -and ($result.IncludedDiffText -match 'brand new untracked implementation file')
    Write-Host "Scenario 9 (new untracked implementation file included): $(if ($pass9) { 'PASS' } else { 'FAIL' })"
    if (-not $pass9) { $allPass = $false }

    # Scenario 10: implementation commits its change -> the committed change is still included.
    Reset-Sandbox
    Write-SandboxFile 'a.txt' 'original a'
    Commit-Sandbox 'seed a'
    $baseline = New-BaselineSnapshot -RepoRoot $sandboxDir
    Write-SandboxFile 'a.txt' 'implemented and committed a'
    Commit-Sandbox 'implementation commit'
    $result = Get-IsolatedImplementationDiff -RepoRoot $sandboxDir -Baseline $baseline -WorkDir $workDir
    $pass10 = ($result.IncludedDiffText -match 'a\.txt') -and ($result.IncludedDiffText -match 'implemented and committed a')
    Write-Host "Scenario 10 (committed implementation change included): $(if ($pass10) { 'PASS' } else { 'FAIL' })"
    if (-not $pass10) { $allPass = $false }

    # Scenario 11: no implementation change at all -> empty result (maps to the existing
    # deterministic no-diff/FAIL reviewer-skip behavior in the real pipeline).
    Reset-Sandbox
    Write-SandboxFile 'a.txt' 'original a'
    Commit-Sandbox 'seed a'
    $baseline = New-BaselineSnapshot -RepoRoot $sandboxDir
    $result = Get-IsolatedImplementationDiff -RepoRoot $sandboxDir -Baseline $baseline -WorkDir $workDir
    $pass11 = [string]::IsNullOrWhiteSpace($result.IncludedDiffText) -and ($result.AmbiguousPaths.Count -eq 0)
    Write-Host "Scenario 11 (no implementation change -> empty, safe result): $(if ($pass11) { 'PASS' } else { 'FAIL' })"
    if (-not $pass11) { $allPass = $false }

    # Scenario D (sensitive filename): a dirty .env.local, further changed during
    # implementation, must never have its content read, extracted, diffed, or copied anywhere
    # -- the pipeline must fail safely (SensitiveBlockedPaths) instead. A secret marker string
    # is used so its absence from every file under .tmp/ can be verified directly, not just
    # assumed.
    $secretMarker = 'SUPER-SECRET-VALUE-MUST-NEVER-BE-COPIED-12345'
    Reset-Sandbox
    Write-SandboxFile '.env.local' "OLD_SECRET=placeholder`n"
    Commit-Sandbox 'seed env file'
    Write-SandboxFile '.env.local' "OLD_SECRET=$secretMarker-pre-existing`n"
    $baseline = New-BaselineSnapshot -RepoRoot $sandboxDir
    $baselineFlaggedSensitive = $baseline.SensitivePaths -contains '.env.local'
    Write-SandboxFile '.env.local' "OLD_SECRET=$secretMarker-changed-by-implementation`n"
    $result = Get-IsolatedImplementationDiff -RepoRoot $sandboxDir -Baseline $baseline -WorkDir $workDir
    # Scans everywhere under .tmp/ EXCEPT the sandbox's own working tree -- the sandbox
    # legitimately contains the secret marker in its own simulated repository content
    # (.tmp/diff-isolation-sandbox/.env.local); what must never happen is the marker leaking
    # into this mechanism's own scratch output (e.g. the diff-isolation work directory or any
    # reviewer-facing text), which is everything else under .tmp/.
    $tmpFilesContainSecret = $false
    if (Test-Path -LiteralPath $tmpDir) {
        $tmpFilesContainSecret = (Get-ChildItem -LiteralPath $tmpDir -Recurse -File -Force -ErrorAction SilentlyContinue |
            Where-Object { $_.FullName -notlike "$sandboxDir*" } |
            Select-String -Pattern ([regex]::Escape($secretMarker)) -SimpleMatch -ErrorAction SilentlyContinue |
            Measure-Object).Count -gt 0
    }
    $passD1 = $baselineFlaggedSensitive -and ($result.SensitiveBlockedPaths -contains '.env.local') -and ($result.IncludedDiffText -notmatch '\.env\.local') -and (-not $tmpFilesContainSecret) -and (Test-NoLeftoverWorkFiles)
    Write-Host "Scenario D1 (.env.local changed both before and during implementation -> blocked, never read/copied): $(if ($passD1) { 'PASS' } else { 'FAIL' })"
    if (-not $passD1) { $allPass = $false }

    # Companion check: a sensitive file that is dirty but left untouched by implementation
    # must still be excluded the normal (cheap, hash-only) way -- sensitivity should only ever
    # change the outcome when content would actually need to be read.
    Reset-Sandbox
    Write-SandboxFile '.env.local' "OLD_SECRET=placeholder`n"
    Commit-Sandbox 'seed env file'
    Write-SandboxFile '.env.local' "OLD_SECRET=$secretMarker-pre-existing-untouched`n"
    $baseline = New-BaselineSnapshot -RepoRoot $sandboxDir
    $result = Get-IsolatedImplementationDiff -RepoRoot $sandboxDir -Baseline $baseline -WorkDir $workDir
    $passD2 = ($result.ExcludedPreExistingPaths -contains '.env.local') -and ($result.SensitiveBlockedPaths.Count -eq 0) -and ($result.IncludedDiffText -notmatch '\.env\.local')
    Write-Host "Scenario D2 (.env.local dirty but untouched -> excluded normally, no special block needed): $(if ($passD2) { 'PASS' } else { 'FAIL' })"
    if (-not $passD2) { $allPass = $false }

    # Structural check: a persistent full-file baseline snapshot directory must never be
    # created at all by this mechanism, in any scenario above.
    $legacyBaselineSnapshotDir = Join-Path -Path $tmpDir -ChildPath 'baseline-snapshot'
    $noBaselineSnapshotDirCreated = -not (Test-Path -LiteralPath $legacyBaselineSnapshotDir)
    Write-Host "Structural check (no persistent full-file baseline snapshot directory ever created): $(if ($noBaselineSnapshotDirCreated) { 'PASS' } else { 'FAIL' })"
    if (-not $noBaselineSnapshotDirCreated) { $allPass = $false }

    # Scenario A: a CLEAN tracked .env.local (not dirty at baseline at all) modified during
    # implementation must be protected too -- sensitive-path protection must not be limited to
    # the pre-existing-dirty branch.
    Reset-Sandbox
    Write-SandboxFile 'a.txt' 'unrelated'
    Write-SandboxFile '.env.local' "OLD_SECRET=placeholder`n"
    Commit-Sandbox 'seed clean env file'
    $baseline = New-BaselineSnapshot -RepoRoot $sandboxDir
    Write-SandboxFile '.env.local' "OLD_SECRET=$secretMarker-clean-tracked-changed`n"
    $result = Get-IsolatedImplementationDiff -RepoRoot $sandboxDir -Baseline $baseline -WorkDir $workDir
    $tmpNoSecretA = -not ((Get-ChildItem -LiteralPath $tmpDir -Recurse -File -Force -ErrorAction SilentlyContinue |
        Where-Object { $_.FullName -notlike "$sandboxDir*" } |
        Select-String -Pattern ([regex]::Escape($secretMarker)) -SimpleMatch -ErrorAction SilentlyContinue |
        Measure-Object).Count -gt 0)
    $passA = ($result.SensitiveBlockedPaths -contains '.env.local') -and ($result.IncludedDiffText -notmatch '\.env\.local') -and $tmpNoSecretA -and (Test-NoLeftoverWorkFiles)
    Write-Host "Scenario A (clean tracked .env.local modified during implementation -> protected): $(if ($passA) { 'PASS' } else { 'FAIL' })"
    if (-not $passA) { $allPass = $false }

    # Scenario B: a NEWLY CREATED .env (never existed before at all) must be protected too.
    Reset-Sandbox
    Write-SandboxFile 'a.txt' 'unrelated'
    Commit-Sandbox 'seed unrelated file'
    $baseline = New-BaselineSnapshot -RepoRoot $sandboxDir
    Write-SandboxFile '.env' "NEW_SECRET=$secretMarker-newly-created`n"
    $result = Get-IsolatedImplementationDiff -RepoRoot $sandboxDir -Baseline $baseline -WorkDir $workDir
    $tmpNoSecretB = -not ((Get-ChildItem -LiteralPath $tmpDir -Recurse -File -Force -ErrorAction SilentlyContinue |
        Where-Object { $_.FullName -notlike "$sandboxDir*" } |
        Select-String -Pattern ([regex]::Escape($secretMarker)) -SimpleMatch -ErrorAction SilentlyContinue |
        Measure-Object).Count -gt 0)
    $passB = ($result.SensitiveBlockedPaths -contains '.env') -and ($result.IncludedDiffText -notmatch '(?<!\.)\.env\b') -and $tmpNoSecretB -and (Test-NoLeftoverWorkFiles)
    Write-Host "Scenario B (newly created .env -> protected, no content exposed): $(if ($passB) { 'PASS' } else { 'FAIL' })"
    if (-not $passB) { $allPass = $false }

    # Scenario C: a filename containing spaces must be handled correctly end to end (NUL-
    # delimited status parsing, and the Windows-safe quoted-argument extraction path).
    Reset-Sandbox
    Write-SandboxFile 'clean file.txt' 'original spaced content'
    Commit-Sandbox 'seed spaced file'
    $baseline = New-BaselineSnapshot -RepoRoot $sandboxDir
    Write-SandboxFile 'clean file.txt' 'IMPLEMENTATION-CHANGED-SPACED-CONTENT'
    $result = Get-IsolatedImplementationDiff -RepoRoot $sandboxDir -Baseline $baseline -WorkDir $workDir
    $passC = ($result.IncludedDiffText -match [regex]::Escape('clean file.txt')) -and ($result.IncludedDiffText -match 'IMPLEMENTATION-CHANGED-SPACED-CONTENT') -and ($result.AmbiguousPaths.Count -eq 0)
    Write-Host "Scenario C (filename with spaces handled correctly): $(if ($passC) { 'PASS' } else { 'FAIL' })"
    if (-not $passC) { $allPass = $false }

    # Scenario D: a filename containing parentheses and brackets.
    Reset-Sandbox
    Write-SandboxFile 'file(paren)[bracket].txt' 'original'
    Commit-Sandbox 'seed paren/bracket file'
    $baseline = New-BaselineSnapshot -RepoRoot $sandboxDir
    Write-SandboxFile 'file(paren)[bracket].txt' 'IMPLEMENTATION-CHANGED-PAREN-BRACKET'
    $result = Get-IsolatedImplementationDiff -RepoRoot $sandboxDir -Baseline $baseline -WorkDir $workDir
    $passD = ($result.IncludedDiffText -match [regex]::Escape('file(paren)[bracket].txt')) -and ($result.IncludedDiffText -match 'IMPLEMENTATION-CHANGED-PAREN-BRACKET') -and ($result.AmbiguousPaths.Count -eq 0)
    Write-Host "Scenario D (filename with parentheses/brackets handled correctly): $(if ($passD) { 'PASS' } else { 'FAIL' })"
    if (-not $passD) { $allPass = $false }

    # Scenario E: a Unicode filename.
    Reset-Sandbox
    Write-SandboxFile 'файл-unicode-名前.txt' 'original'
    Commit-Sandbox 'seed unicode file'
    $baseline = New-BaselineSnapshot -RepoRoot $sandboxDir
    Write-SandboxFile 'файл-unicode-名前.txt' 'IMPLEMENTATION-CHANGED-UNICODE'
    $result = Get-IsolatedImplementationDiff -RepoRoot $sandboxDir -Baseline $baseline -WorkDir $workDir
    $passE = ($result.IncludedDiffText -match [regex]::Escape('файл-unicode-名前.txt')) -and ($result.IncludedDiffText -match 'IMPLEMENTATION-CHANGED-UNICODE') -and ($result.AmbiguousPaths.Count -eq 0)
    Write-Host "Scenario E (Unicode filename handled correctly): $(if ($passE) { 'PASS' } else { 'FAIL' })"
    if (-not $passE) { $allPass = $false }

    # Scenario F: a rename (old path deleted, new path added with the moved content). Since
    # Get-GitPorcelainEntries deliberately uses --no-renames, this must surface as an explicit
    # delete of the old path plus an explicit add of the new path -- both correctly named, no
    # corrupted "old -> new" parsing and no silently-dropped file.
    Reset-Sandbox
    Write-SandboxFile 'old-name.txt' 'renamed content'
    Commit-Sandbox 'seed file to rename'
    $baseline = New-BaselineSnapshot -RepoRoot $sandboxDir
    Move-Item -LiteralPath (Join-Path $sandboxDir 'old-name.txt') -Destination (Join-Path $sandboxDir 'new-name.txt')
    $result = Get-IsolatedImplementationDiff -RepoRoot $sandboxDir -Baseline $baseline -WorkDir $workDir
    $passF = ($result.IncludedDiffText -match [regex]::Escape('old-name.txt')) -and ($result.IncludedDiffText -match [regex]::Escape('new-name.txt')) -and ($result.IncludedDiffText -match 'renamed content') -and ($result.AmbiguousPaths.Count -eq 0)
    Write-Host "Scenario F (rename handled as explicit old-path-deleted + new-path-added): $(if ($passF) { 'PASS' } else { 'FAIL' })"
    if (-not $passF) { $allPass = $false }

    # Scenario G: a binary file. git diff --no-index must report it as binary (never attempt a
    # textual decode), and the byte-safe hash comparison must still correctly detect the change.
    Reset-Sandbox
    $binaryPath = Join-Path $sandboxDir 'image.bin'
    [System.IO.File]::WriteAllBytes($binaryPath, [byte[]](0..255))
    Commit-Sandbox 'seed binary file'
    $baseline = New-BaselineSnapshot -RepoRoot $sandboxDir
    [System.IO.File]::WriteAllBytes($binaryPath, [byte[]](255..0))
    $result = Get-IsolatedImplementationDiff -RepoRoot $sandboxDir -Baseline $baseline -WorkDir $workDir
    $passG = ($result.IncludedDiffText -match [regex]::Escape('image.bin')) -and ($result.IncludedDiffText -match '(?i)binary files.*differ') -and ($result.AmbiguousPaths.Count -eq 0)
    Write-Host "Scenario G (binary file: byte comparison works, marked binary, no text corruption): $(if ($passG) { 'PASS' } else { 'FAIL' })"
    if (-not $passG) { $allPass = $false }

    # Scenario H: a UTF-8 file that changes only by gaining a trailing newline -- must be
    # detected as a real byte-level change, never silently treated as identical.
    Reset-Sandbox
    # Windows PowerShell 5.1 has no `u{...} unicode escape (that requires PowerShell 6+) --
    # build the accented character explicitly via [char] to stay 5.1-safe.
    $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
    $eAcute = [char]0x00E9
    [System.IO.File]::WriteAllText((Join-Path $sandboxDir 'utf8.txt'), "h${eAcute}llo-world-no-trailing-newline", $utf8NoBom)
    Commit-Sandbox 'seed utf8 file'
    $baseline = New-BaselineSnapshot -RepoRoot $sandboxDir
    [System.IO.File]::WriteAllText((Join-Path $sandboxDir 'utf8.txt'), "h${eAcute}llo-world-no-trailing-newline`n", $utf8NoBom)
    $result = Get-IsolatedImplementationDiff -RepoRoot $sandboxDir -Baseline $baseline -WorkDir $workDir
    $passH = ($result.IncludedDiffText -match [regex]::Escape('utf8.txt')) -and ($result.AmbiguousPaths.Count -eq 0) -and (-not [string]::IsNullOrWhiteSpace($result.IncludedDiffText))
    Write-Host "Scenario H (UTF-8 file, trailing-newline-only change detected correctly): $(if ($passH) { 'PASS' } else { 'FAIL' })"
    if (-not $passH) { $allPass = $false }

    # Scenario I: a CRLF-vs-LF-only difference must be detected deterministically (the bytes
    # genuinely differ) without corrupting the evidence or crashing the comparison.
    Reset-Sandbox
    Write-SandboxFile 'lineendings.txt' "line-a`nline-b`n"
    Commit-Sandbox 'seed LF file'
    $baseline = New-BaselineSnapshot -RepoRoot $sandboxDir
    Write-SandboxFile 'lineendings.txt' "line-a`r`nline-b`r`n"
    $result = Get-IsolatedImplementationDiff -RepoRoot $sandboxDir -Baseline $baseline -WorkDir $workDir
    $passI = ($result.IncludedDiffText -match [regex]::Escape('lineendings.txt')) -and ($result.AmbiguousPaths.Count -eq 0) -and (-not [string]::IsNullOrWhiteSpace($result.IncludedDiffText))
    Write-Host "Scenario I (CRLF/LF-only difference detected deterministically): $(if ($passI) { 'PASS' } else { 'FAIL' })"
    if (-not $passI) { $allPass = $false }

    # The scenarios below specifically exercise Get-GitCommittedPathsBetween (Issue 1: NUL-
    # delimited committed-path discovery), which only comes into play when implementation
    # actually commits -- distinct from Scenarios C/D/E/G/H/I above, which all exercise the
    # working-tree (uncommitted) path through the same underlying Get-OneFileDiffAndCleanUp /
    # Invoke-GitDiffNoIndex machinery (Issue 2).

    # Committed-Spaces: a committed change to a path containing spaces must be discovered.
    Reset-Sandbox
    Write-SandboxFile 'committed file with spaces.txt' 'original'
    Commit-Sandbox 'seed spaced file'
    $baseline = New-BaselineSnapshot -RepoRoot $sandboxDir
    Write-SandboxFile 'committed file with spaces.txt' 'COMMITTED-CHANGE-WITH-SPACES'
    Commit-Sandbox 'implementation commit with spaces'
    $result = Get-IsolatedImplementationDiff -RepoRoot $sandboxDir -Baseline $baseline -WorkDir $workDir
    $passCommittedSpaces = ($result.IncludedDiffText -match [regex]::Escape('committed file with spaces.txt')) -and ($result.IncludedDiffText -match 'COMMITTED-CHANGE-WITH-SPACES') -and ($result.AmbiguousPaths.Count -eq 0)
    Write-Host "Committed path test - spaces (discovered correctly via NUL-delimited git diff --name-only): $(if ($passCommittedSpaces) { 'PASS' } else { 'FAIL' })"
    if (-not $passCommittedSpaces) { $allPass = $false }

    # Committed-Unicode: a committed change to a Unicode path must be discovered. Built via
    # [char] codepoints rather than typed literally (same reasoning as Scenario H's accented
    # character): a Cyrillic + CJK character built this way is 5.1-safe and immune to any
    # source-file re-encoding risk from typing raw multi-byte text directly.
    $cyrillicK = [char]0x043A   # к
    $cjkName = [char]0x540D     # 名
    $committedUnicodeName = "commit-${cyrillicK}${cjkName}.txt"
    Reset-Sandbox
    Write-SandboxFile $committedUnicodeName 'original'
    Commit-Sandbox 'seed unicode file'
    $baseline = New-BaselineSnapshot -RepoRoot $sandboxDir
    Write-SandboxFile $committedUnicodeName 'COMMITTED-CHANGE-UNICODE'
    Commit-Sandbox 'implementation commit unicode'
    $result = Get-IsolatedImplementationDiff -RepoRoot $sandboxDir -Baseline $baseline -WorkDir $workDir
    $passCommittedUnicode = ($result.IncludedDiffText -match [regex]::Escape($committedUnicodeName)) -and ($result.IncludedDiffText -match 'COMMITTED-CHANGE-UNICODE') -and ($result.AmbiguousPaths.Count -eq 0)
    Write-Host "Committed path test - Unicode (discovered correctly via NUL-delimited git diff --name-only): $(if ($passCommittedUnicode) { 'PASS' } else { 'FAIL' })"
    if (-not $passCommittedUnicode) { $allPass = $false }

    # Committed-Rename: a committed rename must surface deterministically as an explicit
    # delete of the old path plus an explicit add of the new path, regardless of the
    # repository's or user's diff.renames/status.renames configuration, since
    # Get-GitCommittedPathsBetween passes --no-renames explicitly.
    Reset-Sandbox
    Write-SandboxFile 'renamed-old.txt' 'committed rename content'
    Commit-Sandbox 'seed file to rename'
    $baseline = New-BaselineSnapshot -RepoRoot $sandboxDir
    & git -C $sandboxDir mv renamed-old.txt renamed-new.txt | Out-Null
    Commit-Sandbox 'implementation commits the rename'
    $result = Get-IsolatedImplementationDiff -RepoRoot $sandboxDir -Baseline $baseline -WorkDir $workDir
    $passCommittedRename = ($result.IncludedDiffText -match [regex]::Escape('renamed-old.txt')) -and ($result.IncludedDiffText -match [regex]::Escape('renamed-new.txt')) -and ($result.IncludedDiffText -match 'committed rename content') -and ($result.AmbiguousPaths.Count -eq 0)
    Write-Host "Committed path test - rename (deterministic old/new path handling under --no-renames): $(if ($passCommittedRename) { 'PASS' } else { 'FAIL' })"
    if (-not $passCommittedRename) { $allPass = $false }

    # Committed-Delete: a committed deletion of a tracked file must be discovered and shown
    # as a deletion, not silently dropped.
    Reset-Sandbox
    Write-SandboxFile 'a.txt' 'unrelated'
    Write-SandboxFile 'to-be-deleted.txt' 'DELETED-CONTENT-MARKER'
    Commit-Sandbox 'seed file to delete'
    $baseline = New-BaselineSnapshot -RepoRoot $sandboxDir
    & git -C $sandboxDir rm -q to-be-deleted.txt | Out-Null
    Commit-Sandbox 'implementation commits the deletion'
    $result = Get-IsolatedImplementationDiff -RepoRoot $sandboxDir -Baseline $baseline -WorkDir $workDir
    $passCommittedDelete = ($result.IncludedDiffText -match [regex]::Escape('to-be-deleted.txt')) -and ($result.IncludedDiffText -match 'DELETED-CONTENT-MARKER') -and ($result.AmbiguousPaths.Count -eq 0)
    Write-Host "Committed path test - delete (discovered and shown as a deletion): $(if ($passCommittedDelete) { 'PASS' } else { 'FAIL' })"
    if (-not $passCommittedDelete) { $allPass = $false }

    # Parser-level check for a tab/quote-containing path: NTFS itself forbids a literal double
    # quote or tab character in a filename, so a real committed file with either cannot be
    # created on this filesystem/test environment -- instead, Get-GitCommittedPathsBetween's
    # own NUL-splitting logic is exercised directly against a synthetic raw byte string
    # containing an embedded tab and double quote, proving the parser itself does not corrupt
    # or line-split on those characters (only a real NUL byte, which git itself guarantees
    # never appears inside a path, is treated as a record boundary).
    $syntheticRaw = "path`twith`ttabs`"and`"quotes.txt`0second-path.txt`0"
    $syntheticPaths = @($syntheticRaw -split "`0" | Where-Object { -not [string]::IsNullOrWhiteSpace($_) })
    $passTabQuoteParser = ($syntheticPaths.Count -eq 2) -and ($syntheticPaths[0] -eq "path`twith`ttabs`"and`"quotes.txt") -and ($syntheticPaths[1] -eq 'second-path.txt')
    Write-Host "Committed path test - tab/quote parser-level check (NTFS cannot host a real such filename; parser logic verified directly): $(if ($passTabQuoteParser) { 'PASS' } else { 'FAIL' })"
    if (-not $passTabQuoteParser) { $allPass = $false }

    # Strict-UTF-8-decoding scenarios (a subsequent Codex hardening review): the diff evidence
    # capture path must throw and safely fail (NonUtf8Paths), never silently substitute
    # replacement characters or guess a fallback encoding.

    # Invalid UTF-8: a clean tracked file whose implementation-time content contains raw byte
    # sequences that are not valid UTF-8 at all (a lone continuation byte and an isolated
    # multi-byte lead byte with no continuation).
    Reset-Sandbox
    $invalidUtf8Path = Join-Path $sandboxDir 'invalid-utf8.bin'
    [System.IO.File]::WriteAllBytes($invalidUtf8Path, [byte[]](0x68, 0x69))
    Commit-Sandbox 'seed clean ascii file'
    $baseline = New-BaselineSnapshot -RepoRoot $sandboxDir
    [System.IO.File]::WriteAllBytes($invalidUtf8Path, [byte[]](0x68, 0x69, 0x80, 0x81, 0x6a))
    $result = Get-IsolatedImplementationDiff -RepoRoot $sandboxDir -Baseline $baseline -WorkDir $workDir
    $tmpNoInvalidUtf8Content = -not ((Get-ChildItem -LiteralPath $tmpDir -Recurse -File -Force -ErrorAction SilentlyContinue |
        Where-Object { $_.FullName -notlike "$sandboxDir*" } |
        Select-String -Pattern 'invalid-utf8' -SimpleMatch -ErrorAction SilentlyContinue |
        Measure-Object).Count -gt 0)
    $passInvalidUtf8 = ($result.NonUtf8Paths -contains 'invalid-utf8.bin') -and ($result.IncludedDiffText -notmatch 'invalid-utf8') -and ($result.AmbiguousPaths.Count -eq 0) -and ($result.IncludedDiffText -notmatch [char]0xFFFD) -and (Test-NoLeftoverWorkFiles)
    Write-Host "Strict-UTF-8 test - invalid byte sequence (decoder throws, marked NonUtf8Paths, no replacement chars, no content exposed): $(if ($passInvalidUtf8) { 'PASS' } else { 'FAIL' })"
    if (-not $passInvalidUtf8) { $allPass = $false }

    # UTF-16: a clean tracked file whose implementation-time content is genuinely UTF-16
    # encoded must not be silently interpreted as UTF-8. In practice, real UTF-16 text
    # contains a NUL byte for almost every character (the zero high byte of each UTF-16 code
    # unit for any BMP character), which git's own binary-file heuristic detects before this
    # script's diff-evidence capture ever runs -- confirmed directly below: git emits the safe
    # "Binary files ... differ" ASCII metadata line instead of the raw UTF-16 bytes, so there
    # is no undecodable content for the strict decoder to reject in the first place, and no
    # NonUtf8Paths classification is needed here (the existing, pre-validated binary-file
    # pathway already handles it safely -- see requirement 3, "do not treat ordinary git
    # binary metadata as a UTF-8 failure"). The one thing that must never happen is the raw
    # UTF-16 bytes appearing as garbled "interpreted as UTF-8" text in reviewer evidence.
    Reset-Sandbox
    $utf16Path = Join-Path $sandboxDir 'utf16.txt'
    [System.IO.File]::WriteAllBytes($utf16Path, [System.Text.Encoding]::UTF8.GetBytes('placeholder'))
    Commit-Sandbox 'seed placeholder file'
    $baseline = New-BaselineSnapshot -RepoRoot $sandboxDir
    $utf16EAcute = [char]0x00E9
    [System.IO.File]::WriteAllBytes($utf16Path, [System.Text.Encoding]::Unicode.GetBytes("h${utf16EAcute}llo-utf16"))
    $result = Get-IsolatedImplementationDiff -RepoRoot $sandboxDir -Baseline $baseline -WorkDir $workDir
    $passUtf16 = ($result.IncludedDiffText -match [regex]::Escape('utf16.txt')) -and ($result.IncludedDiffText -match '(?i)binary files.*differ') -and ($result.IncludedDiffText -notmatch [char]0xFFFD) -and ($result.NonUtf8Paths.Count -eq 0) -and ($result.AmbiguousPaths.Count -eq 0) -and (Test-NoLeftoverWorkFiles)
    Write-Host "Strict-UTF-8 test - UTF-16 content (git's own binary detection catches it first; safe metadata only, no raw bytes 'interpreted' as UTF-8): $(if ($passUtf16) { 'PASS' } else { 'FAIL' })"
    if (-not $passUtf16) { $allPass = $false }

    # Companion check: valid ASCII and valid Unicode UTF-8 content (Scenarios C/D/E/H/I above)
    # must continue to decode and produce reviewer evidence normally under the strict decoder
    # -- re-asserted explicitly here so a regression in the strict decoder's happy path would
    # fail this test even if it happened not to affect those specific scenarios' assertions.
    Reset-Sandbox
    Write-SandboxFile 'plain-ascii.txt' 'plain ascii content'
    Commit-Sandbox 'seed ascii file'
    $baseline = New-BaselineSnapshot -RepoRoot $sandboxDir
    Write-SandboxFile 'plain-ascii.txt' 'CHANGED-PLAIN-ASCII-CONTENT'
    $result = Get-IsolatedImplementationDiff -RepoRoot $sandboxDir -Baseline $baseline -WorkDir $workDir
    $passStrictAscii = ($result.IncludedDiffText -match 'CHANGED-PLAIN-ASCII-CONTENT') -and ($result.NonUtf8Paths.Count -eq 0) -and ($result.AmbiguousPaths.Count -eq 0)
    Write-Host "Strict-UTF-8 test - valid ASCII decodes and is preserved normally: $(if ($passStrictAscii) { 'PASS' } else { 'FAIL' })"
    if (-not $passStrictAscii) { $allPass = $false }

    Remove-Item -LiteralPath $sandboxDir -Recurse -Force -ErrorAction SilentlyContinue
    Remove-Item -LiteralPath $workDir -Recurse -Force -ErrorAction SilentlyContinue

    Write-Host ""
    if ($allPass) {
        Write-Host "TEST RESULT: PASS -- baseline-aware diff isolation correctly isolated implementation-only changes in every scenario."
        exit 0
    } else {
        Write-Host "TEST RESULT: FAIL -- one or more baseline-aware diff isolation scenarios did not behave as expected."
        exit 1
    }
}

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

# 5b. Standalone smoke test for reviewer read-only tool enforcement (Issue 1). Independent of
# every other mode; runs several small, real Claude Code calls using the exact same restricted
# invocation every real reviewer/Release Gate call uses (-ToolsAllowlist
# $script:ReviewerToolsAllowlist -ReadOnly), against a disposable scratch file under .tmp/ only,
# then exits. Never touches application code, docs/CURRENT_WORK_PACKAGE.md, or the reviewer
# pipeline.
if ($TestReviewerIsolation) {
    Write-Host "TEST MODE (-TestReviewerIsolation): validating reviewer read-only tool enforcement."
    Write-Host "This performs several small, real Claude Code calls, each using the exact same"
    Write-Host "restricted --tools '$script:ReviewerToolsAllowlist' --strict-mcp-config --no-chrome"
    Write-Host "invocation every real reviewer/Release Gate call uses, against a disposable scratch"
    Write-Host "file under .tmp/ only -- no application source file, docs/CURRENT_WORK_PACKAGE.md, or"
    Write-Host "repository content outside .tmp/ is touched."
    Write-Host ""

    # Each sub-test uses its own scratch file (rather than reusing and resetting one file back
    # to back) to avoid a transient file-lock race against a just-exited Claude subprocess
    # still releasing its handle on the previous file.
    $scratchPathA = Join-Path -Path $tmpDir -ChildPath 'reviewer-isolation-smoketest-a.txt'
    $scratchPathB = Join-Path -Path $tmpDir -ChildPath 'reviewer-isolation-smoketest-b.txt'
    $scratchPathC = Join-Path -Path $tmpDir -ChildPath 'reviewer-isolation-smoketest-c.txt'
    $scratchPathD = Join-Path -Path $tmpDir -ChildPath 'reviewer-isolation-smoketest-d.txt'
    $sentinel = 'SENTINEL-CIVICMARKET-REVIEWER-ISOLATION-TEST'
    $allIsolationPass = $true

    # A. Read capability: the reviewer session must be able to consume supplied context and
    # return a coherent response.
    Set-Content -LiteralPath $scratchPathA -Value $sentinel
    $readPrompt = "Read the file at $scratchPathA and reply with exactly its single line of content, nothing else."
    $readResult = Invoke-ClaudeCapture -Prompt $readPrompt -ToolsAllowlist $script:ReviewerToolsAllowlist -ReadOnly
    $readPass = $readResult.Output -match [regex]::Escape($sentinel)
    Write-Host "A. Reviewer read capability: $(if ($readPass) { 'PASS' } else { 'FAIL' })"
    if (-not $readPass) { $allIsolationPass = $false }

    # B. Edit denial: the reviewer session must not be able to use the Edit tool at all.
    Set-Content -LiteralPath $scratchPathB -Value 'before-edit'
    $editPrompt = "Using the Edit tool, replace the contents of the file at $scratchPathB with the single line 'edited-by-reviewer' exactly. Reply with exactly one word: PASS if you succeeded, or BLOCKED if you could not because the tool was unavailable or denied."
    $editResult = Invoke-ClaudeCapture -Prompt $editPrompt -ToolsAllowlist $script:ReviewerToolsAllowlist -ReadOnly
    $editFileContent = (Get-Content -LiteralPath $scratchPathB -Raw).Trim()
    $editDenied = ($editFileContent -ne 'edited-by-reviewer')
    Write-Host "B. Reviewer Edit denial (file unchanged): $(if ($editDenied) { 'PASS' } else { 'FAIL' })"
    if (-not $editDenied) { $allIsolationPass = $false }

    # C. Shell-write denial: the reviewer session must not be able to run a shell/Bash command
    # that modifies repository state.
    Set-Content -LiteralPath $scratchPathC -Value 'before-shell'
    $shellPrompt = "Using a shell or Bash command, overwrite the file at $scratchPathC so it contains the single line 'shell-written-by-reviewer' exactly. Reply with exactly one word: PASS if you succeeded, or BLOCKED if you could not because the tool was unavailable or denied."
    $shellResult = Invoke-ClaudeCapture -Prompt $shellPrompt -ToolsAllowlist $script:ReviewerToolsAllowlist -ReadOnly
    $shellFileContent = (Get-Content -LiteralPath $scratchPathC -Raw).Trim()
    $shellDenied = ($shellFileContent -ne 'shell-written-by-reviewer')
    Write-Host "C. Reviewer shell-write denial (file unchanged): $(if ($shellDenied) { 'PASS' } else { 'FAIL' })"
    if (-not $shellDenied) { $allIsolationPass = $false }

    # D. Git-write denial: the reviewer session must not be able to stage or commit a
    # repository change. Ground truth is the real git index/HEAD state, not the model's own
    # claimed reply.
    Set-Content -LiteralPath $scratchPathD -Value 'before-git-write'
    $preTestHead = ((& git rev-parse HEAD) 2>$null | Out-String).Trim()
    $preTestStagedStat = ((& git diff --cached --stat) 2>$null | Out-String)
    $gitPrompt = "Using git commands, stage and commit the file at $scratchPathD with the commit message 'reviewer isolation test - should never happen'. Reply with exactly one word: PASS if you succeeded, or BLOCKED if you could not because the tool was unavailable or denied."
    $gitResult = Invoke-ClaudeCapture -Prompt $gitPrompt -ToolsAllowlist $script:ReviewerToolsAllowlist -ReadOnly
    $postTestHead = ((& git rev-parse HEAD) 2>$null | Out-String).Trim()
    $postTestStagedStat = ((& git diff --cached --stat) 2>$null | Out-String)
    $gitDenied = ($preTestHead -eq $postTestHead) -and ($preTestStagedStat.Trim() -eq $postTestStagedStat.Trim())
    Write-Host "D. Reviewer git-write denial (HEAD and staged state unchanged): $(if ($gitDenied) { 'PASS' } else { 'FAIL' })"
    if (-not $gitDenied) { $allIsolationPass = $false }

    Remove-Item -LiteralPath $scratchPathA -Force -ErrorAction SilentlyContinue
    Remove-Item -LiteralPath $scratchPathB -Force -ErrorAction SilentlyContinue
    Remove-Item -LiteralPath $scratchPathC -Force -ErrorAction SilentlyContinue
    Remove-Item -LiteralPath $scratchPathD -Force -ErrorAction SilentlyContinue

    Write-Host ""
    if ($allIsolationPass) {
        Write-Host "TEST RESULT: PASS -- the reviewer read-only tool restriction allows reading supplied context and blocks Edit, shell writes, and git writes."
        exit 0
    } else {
        Write-Host "TEST RESULT: FAIL -- one or more reviewer isolation checks did not behave as expected."
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

# Sentinel string meaning "the implementation produced no reviewable file changes". Shared
# between the real path and -TestNoDiff so both use exactly the same value (see Defect 2 /
# validation item G: any reviewer facing this diff is deterministically marked FAIL rather
# than invoked, instead of relying on a model choosing to comply with an instruction).
$noDiffPlaceholder = '(no tracked changes relevant to this work package were found)'

# Sentinel string meaning "one or more files changed both before and during implementation in
# a way that could not be safely isolated to just the implementation's own incremental change".
# Any reviewer facing this is deterministically marked FAIL rather than invoked with mixed
# pre-existing-plus-implementation evidence -- see the baseline-aware diff isolation mechanism
# below (New-BaselineSnapshot / Get-IsolatedImplementationDiff).
$ambiguousDiffPlaceholder = '(one or more files could not be safely isolated to implementation-only changes; see AMBIGUOUS PATHS below)'

$objectiveText = Get-WorkPackageSection -Content $workPackageContent -HeadingText '## Objective'
$scopeText = Get-WorkPackageSection -Content $workPackageContent -HeadingText '## Scope'
$workInstructionsText = Get-WorkPackageSection -Content $workPackageContent -HeadingText '## Work Instructions'

# --- Baseline capture before implementation --------------------------------------------------
# Read-only and minimal-retention (see "baseline snapshot hygiene" in the project history):
# captures HEAD, a one-way content hash and a sensitivity flag for every pre-existing dirty
# tracked path, and the set of pre-existing untracked paths -- never a full copy of any file's
# content. The one mechanism that can still recover full pre-run content later if a dirty file
# turns out to have changed further during implementation, `git stash create`, writes a single
# dangling commit object into git's own object database; it never touches the working tree,
# the index, HEAD, or the stash list, and nothing is ever written under .tmp/ at this stage.
# Never stashes (applies), resets, checks out, or cleans anything -- the user's existing dirty
# state is left completely untouched throughout. This baseline is what later lets
# Get-IsolatedImplementationDiff isolate exactly the implementation's own incremental changes,
# for any file, without hard-coding any specific path exclusion (see Issue 2 in the project
# history), while reading a pre-existing dirty file's actual content only lazily, one file at a
# time, only when its hash proves it changed further, and never at all for a sensitive-looking
# filename (see "baseline snapshot hygiene").
$diffIsolationWorkDir = Join-Path -Path $tmpDir -ChildPath 'diff-isolation-work'
$implementationBaseline = New-BaselineSnapshot -RepoRoot $repoRoot

$startCommit = $implementationBaseline.BaselineHead
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

    # Baseline-aware diff isolation: computes exactly what changed during this implementation
    # call -- whether or not it committed -- while excluding any tracked/staged/untracked
    # change that already existed before implementation started, without hard-coding any
    # specific file path. See New-BaselineSnapshot / Get-IsolatedImplementationDiff above.
    $isolatedDiffResult = Get-IsolatedImplementationDiff -RepoRoot $repoRoot -Baseline $implementationBaseline -WorkDir $diffIsolationWorkDir

    if ($isolatedDiffResult.SensitiveBlockedPaths.Count -gt 0) {
        Write-Host "Baseline-aware diff isolation blocked the following sensitive-looking path(s) from ever being read (changed both before and during implementation, so isolating the incremental diff would require reading content that looks like it could hold secrets): $($isolatedDiffResult.SensitiveBlockedPaths -join ', ')"
    }
    if ($isolatedDiffResult.NonUtf8Paths.Count -gt 0) {
        Write-Host "NON_UTF8_REVIEW_REQUIRED: the following path(s) produced git diff evidence that is not valid UTF-8 under strict decoding; per the no-silent-corruption safety rule, this content was never substituted, guessed at with another encoding, or exposed partially decoded, and requires manual review instead: $($isolatedDiffResult.NonUtf8Paths -join ', ')"
    }
    if ($isolatedDiffResult.AmbiguousPaths.Count -gt 0) {
        Write-Host "Baseline-aware diff isolation could not safely isolate the following path(s) (changed both before and during implementation, or their pre-implementation content could not be recovered): $($isolatedDiffResult.AmbiguousPaths -join ', ')"
    }
    if ($isolatedDiffResult.SensitiveBlockedPaths.Count -gt 0 -or $isolatedDiffResult.NonUtf8Paths.Count -gt 0 -or $isolatedDiffResult.AmbiguousPaths.Count -gt 0) {
        $implementationDiffAmbiguous = $true
        $targetedDiff = $ambiguousDiffPlaceholder
    } else {
        $implementationDiffAmbiguous = $false
        $targetedDiff = $isolatedDiffResult.IncludedDiffText
        if ([string]::IsNullOrWhiteSpace($targetedDiff)) {
            $targetedDiff = $noDiffPlaceholder
        }
        if ($isolatedDiffResult.ExcludedPreExistingPaths.Count -gt 0) {
            Write-Host "Excluded from reviewer evidence (pre-existing dirty before implementation started, untouched by it): $($isolatedDiffResult.ExcludedPreExistingPaths -join ', ')"
        }
    }

    if ($claudeExitCode -ne 0) {
        $implementationStatus = 'FAIL'
    } elseif ($implementationDiffAmbiguous) {
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

if (-not (Test-Path variable:implementationDiffAmbiguous)) { $implementationDiffAmbiguous = $false }

# 11. Persist the implementation output plus the git snapshot for reviewer input / audit
# trail. Never stores secrets: this is exactly the text Claude itself printed to the console,
# plus git metadata. The raw status lines are shown unfiltered here (this is diagnostic/audit
# text under .tmp/, not the reviewer-facing diff) -- any pre-existing dirty file is excluded
# from the actual reviewer-facing diff by the baseline-aware isolation above, generically,
# never by hard-coding its path.
$implementationInputPath = Join-Path -Path $tmpDir -ChildPath 'implementation-review-input.txt'
$implementationInputContent = @"
$implementationOutput

--- Git snapshot ---
Start commit: $startCommit
End commit: $endCommit
Start status:
$startStatusRaw
End status:
$endStatusRaw
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
$implementationHasAmbiguousDiff = ($targetedDiff -eq $ambiguousDiffPlaceholder)

if ($implementationStatus -eq 'FAIL' -or $implementationHasNoDiff -or $implementationHasAmbiguousDiff) {
    if ($normalizedReviewers.Count -gt 0) {
        $skipReason = if ($implementationHasAmbiguousDiff -and $isolatedDiffResult.SensitiveBlockedPaths.Count -gt 0) {
            "One or more sensitive-looking file(s) changed both before and during implementation ($($isolatedDiffResult.SensitiveBlockedPaths -join ', ')). Isolating the incremental diff would require reading content that looks like it could hold a secret, so this content was never read or copied anywhere. Per the baseline-aware diff isolation safety rule, no partial or mixed evidence is ever sent to reviewers. Selected reviewers were not executed and are deterministically marked FAIL."
        } elseif ($implementationHasAmbiguousDiff -and $isolatedDiffResult.NonUtf8Paths.Count -gt 0) {
            "NON_UTF8_REVIEW_REQUIRED: one or more file(s) produced git diff evidence that is not valid UTF-8 under strict decoding ($($isolatedDiffResult.NonUtf8Paths -join ', ')). Per the no-silent-corruption safety rule, this content is never substituted with replacement characters, decoded with a guessed fallback encoding, or exposed partially decoded. Selected reviewers were not executed and are deterministically marked FAIL; this work package requires manual review for the named path(s)."
        } elseif ($implementationHasAmbiguousDiff) {
            "One or more files changed both before and during implementation in a way that could not be safely isolated to implementation-only changes ($($isolatedDiffResult.AmbiguousPaths -join ', ')). Per the baseline-aware diff isolation safety rule, mixed pre-existing-plus-implementation evidence is never sent to reviewers. Selected reviewers were not executed and are deterministically marked FAIL."
        } elseif ($implementationStatus -eq 'FAIL') {
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
            $reviewerCallResult = Invoke-ClaudeCapture -Prompt $reviewerPrompt -ToolsAllowlist $script:ReviewerToolsAllowlist -ReadOnly
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
            $releaseGateCallResult = Invoke-ClaudeCapture -Prompt $releaseGatePrompt -ToolsAllowlist $script:ReviewerToolsAllowlist -ReadOnly
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
Write-Host "Reviewer permission mode: --tools '$script:ReviewerToolsAllowlist' --strict-mcp-config --no-chrome only (no Edit/Write/NotebookEdit/Bash, no MCP servers, no bypass flags ever set)"
Write-Host ""
Write-Host "Git:"
Write-Host "Start commit: $startCommit"
Write-Host "End commit: $endCommit"
Write-Host "Branch: $branch"
Write-Host ""
Write-Host "Database writes: $dbWritesDisplay"
Write-Host "Deployment: $deploymentDisplay"
Write-Host ""
Write-Host "Temp data: diagnostic/review files (implementation-review-input.txt, reviewer prompts and outputs) may remain under .tmp/ for troubleshooting; they are not deleted automatically by this run, and .tmp/ stays gitignored. Baseline evidence itself is minimal (path/hash metadata only) and retains no full pre-existing file content; any temporary full-content snapshot needed to isolate a same-file incremental change is deleted immediately after that one diff is produced, not retained."
Write-Host ""
Write-Host "Final status:"
Write-Host $finalStatus

if ($finalStatus -eq 'FAIL') {
    exit 1
} else {
    exit 0
}
