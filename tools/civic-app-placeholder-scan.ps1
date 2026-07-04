param()

Write-Host ""
Write-Host "=== CivicMarket App-Facing Placeholder Scan ==="
Write-Host ""

$paths = @(
  ".\src\app\*.tsx",
  ".\src\app\*\*.tsx",
  ".\src\components\**\*.tsx",
  ".\src\lib\*.ts"
)

$patterns = @(
  "dummy",
  "fake",
  "placeholder PSL data",
  "Read-only beta using placeholder",
  "DUMMY_FEED",
  "mock",
  "TODO",
  "lorem"
)

$matches = Select-String -Path $paths -Pattern $patterns -CaseSensitive:$false -ErrorAction SilentlyContinue

if ($matches) {
  Write-Host "FAIL: App-facing placeholder terms found." -ForegroundColor Red
  Write-Host ""
  $matches | ForEach-Object {
    Write-Host "$($_.Path):$($_.LineNumber): $($_.Line.Trim())"
  }
  Write-Host ""
  exit 1
}

Write-Host "PASS: No app-facing dummy/fake/placeholder PSL data terms found." -ForegroundColor Green
Write-Host ""
exit 0
