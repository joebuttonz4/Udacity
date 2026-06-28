param()

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$DataPath = ".\data\real-psl-replacement"

$filesToScan = @(
  "candidates_real.csv",
  "voting_records_real.csv",
  "funding_real.csv",
  "sources_inventory.csv"
)

$riskyPatterns = @(
  "mock",
  "dummy",
  "sample",
  "fake",
  "placeholder",
  "TODO",
  "lorem",
  "test candidate"
)

Write-Host ""
Write-Host "=== CivicMarket Real Data Guard ==="
Write-Host ""

Write-Host "Scanning import/display real PSL data files only:"
foreach ($fileName in $filesToScan) {
  Write-Host "- $fileName"
}
Write-Host ""

if (-not (Test-Path $DataPath)) {
  Write-Error "Data path not found: $DataPath"
  exit 1
}

$files = @()

foreach ($fileName in $filesToScan) {
  $path = Join-Path $DataPath $fileName

  if (-not (Test-Path $path)) {
    Write-Error "Expected file not found: $path"
    exit 1
  }

  $files += Get-Item $path
}

$findings = @()

foreach ($pattern in $riskyPatterns) {
  $matches = Select-String -Path $files.FullName -Pattern $pattern -SimpleMatch -CaseSensitive:$false -ErrorAction SilentlyContinue

  foreach ($match in $matches) {
    $findings += [PSCustomObject]@{
      File = $match.Path
      Line = $match.LineNumber
      Pattern = $pattern
      Text = $match.Line.Trim()
    }
  }
}

if ($findings.Count -eq 0) {
  Write-Host "PASS: No risky placeholder terms found in import/display real PSL data files."
  Write-Host ""
  exit 0
}

Write-Host "REVIEW NEEDED: Risky placeholder terms were found in import/display real PSL data files."
Write-Host ""

$findings | Format-Table -AutoSize

Write-Host ""
Write-Host "Review each finding before import, demo, or beta use."
Write-Host ""

exit 1
