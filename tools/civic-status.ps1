param()

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "=== CivicMarket Status ==="
Write-Host ""

Write-Host "Repository:"
git status --short
Write-Host ""

Write-Host "Latest commits:"
git log --oneline -5
Write-Host ""

Write-Host "CSV validation:"
node .\scripts\validate-real-psl-csvs.cjs
Write-Host ""

Write-Host "Real data guard:"
.\tools\civic-real-data-guard.ps1
Write-Host ""

Write-Host "Real PSL row counts:"
$candidateRows = @(Import-Csv .\data\real-psl-replacement\candidates_real.csv).Count
$votingRows = @(Import-Csv .\data\real-psl-replacement\voting_records_real.csv).Count
$fundingRows = @(Import-Csv .\data\real-psl-replacement\funding_real.csv).Count

Write-Host "candidates_real.csv rows:      $candidateRows"
Write-Host "voting_records_real.csv rows: $votingRows"
Write-Host "funding_real.csv rows:        $fundingRows"
Write-Host ""

Write-Host "Last review-log lines:"
Get-Content .\data\real-psl-replacement\real_data_review_log.md | Select-Object -Last 24
Write-Host ""

Write-Host "=== Done ==="
