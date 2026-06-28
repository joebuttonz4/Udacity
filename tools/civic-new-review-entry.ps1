param(
  [Parameter(Mandatory = $true)]
  [string]$Title,

  [Parameter(Mandatory = $true)]
  [string]$Status,

  [string]$OutputPath = ".\data\real-psl-replacement\review_log_entry_draft.md"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$date = Get-Date -Format "yyyy-MM-dd"

$template = @"

## ${date}: $Title

Status decision: $Status
Reviewed by: Mike + ChatGPT

Source inventory titles reviewed:
- TODO

Accepted for:
- TODO

Not accepted for:
- TODO

Reasoning:
TODO

Impact:
- TODO

Deferred:
- TODO

"@

$template | Set-Content $OutputPath

Write-Host ""
Write-Host "Draft review-log entry created:"
Write-Host $OutputPath
Write-Host ""
Write-Host "Open and edit this file, then append it to real_data_review_log.md only after review."
Write-Host ""
Get-Content $OutputPath
