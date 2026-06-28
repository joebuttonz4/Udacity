param(
  [Parameter(Mandatory = $true)]
  [string]$Message
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "=== CivicMarket Guided Commit ==="
Write-Host ""

Write-Host "Commit message:"
Write-Host $Message
Write-Host ""

Write-Host "Current changed files:"
git status --short
Write-Host ""

$statusShort = git status --short
if (-not $statusShort) {
  Write-Host "No changes to commit."
  exit 0
}

Write-Host "Running CSV validation:"
node .\scripts\validate-real-psl-csvs.cjs
Write-Host ""

Write-Host "Diff summary:"
git diff --stat
Write-Host ""

Write-Host "Full status:"
git status
Write-Host ""

$answer = Read-Host "Commit these changes? Type YES to continue"

if ($answer -ne "YES") {
  Write-Host "Commit cancelled. No changes were committed."
  exit 1
}

git add .

git commit -m $Message

Write-Host ""
Write-Host "Final status:"
git status

Write-Host ""
Write-Host "Latest commits:"
git log --oneline -5

Write-Host ""
Write-Host "=== Done ==="
