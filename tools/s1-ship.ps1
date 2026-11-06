# ============================================================
# s1-ship.ps1 - commit tool update (if any) + commit 4 API files
#               + MANDATORY GATE (in-script, aborts on RED) + push
# Run: powershell -ExecutionPolicy Bypass -File tools\s1-ship.ps1
# ============================================================

 $ErrorActionPreference = "Stop"
[Console]::OutputEncoding = New-Object System.Text.UTF8Encoding($false)
Write-Host "=== S1-SHIP ===" -ForegroundColor Cyan

if ($PWD.Path -ne "E:\projects\training-center-saas-fixed2\training-center-saas-final\markazak-saas") { throw ("WRONG LOCATION: " + $PWD.Path) }
  $apiFiles = @('app/api/students/route.ts','app/api/students/[id]/route.ts','app/api/enrollments/route.ts','app/api/enrollments/[id]/route.ts')
 $toolFiles = @('tools/s1-api.ps1','tools/s1-ui.ps1','tools/s1-ship.ps1')
 $st0 = @(git status --porcelain)
 $apiDirty = 0; $toolDirty = @(); $other = @()
foreach ($line in $st0) {
  $st = $line.Substring(0,2); $p = $line.Substring(3)
  if (($st -eq 'M ') -or ($st -eq ' M')) {
    if ($apiFiles -contains $p) { $apiDirty++ }
    elseif ($toolFiles -contains $p) { $toolDirty += $p }
    else { $other += $line }
  } elseif ($st -eq '??') {
    if ($toolFiles -contains $p) { $toolDirty += $p }
    else { $other += $line }
  } else { $other += $line }
}
if ($other.Count -gt 0) { throw ("unexpected tree state: " + ($other -join " | ")) }
if ($apiDirty -ne 4) { throw ("expected 4 modified API files (run s1-api.ps1 first), got " + $apiDirty) }
if ($toolDirty) {
  git add -- tools/s1-api.ps1
  git commit -m "tools: s1-api v2 - idempotent re-run + fixed verify needle (lesson 32)"
  if ($LASTEXITCODE -ne 0) { throw "tool commit failed" }
  Write-Host "tool update committed" -ForegroundColor Green
}

git add -- app/api/students app/api/enrollments
 $stg = @(git diff --cached --name-only)
Write-Host ("staged: " + $stg.Count + " files (expect 4)")
 $stg | ForEach-Object { Write-Host ("  + " + $_) }
if ($stg.Count -ne 4) { throw ("staged count=" + $stg.Count + " expected 4") }

Write-Host "--- MANDATORY GATE (aborts ship on RED) ---" -ForegroundColor Cyan
& powershell -ExecutionPolicy Bypass -File tools\pre-push.ps1
if ($LASTEXITCODE -ne 0) { Write-Host "GATE RED - SHIP ABORTED. Nothing committed." -ForegroundColor Red; exit 1 }

git commit -m "feat(s1-api): accept/filter type on students, mix warning + subscription period on enrollments"
if ($LASTEXITCODE -ne 0) { throw "commit failed" }
git push -u origin main
if ($LASTEXITCODE -ne 0) { throw "push failed" }
 $left = @(git status --porcelain)
if ($left.Count -gt 0) { throw ("tree not clean after ship: " + ($left -join " | ")) }
Write-Host "SHIPPED CLEAN. Vercel deploys in 2-3 minutes." -ForegroundColor Green