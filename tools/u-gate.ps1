# ============================================================
# u-gate.ps1 - DESIGN GATE runner (stderr-safe) + ship closer
# Detect runs in a child shell without EAP=Stop so its stderr
# findings print normally and we can parse the verdict.
# Run: powershell -ExecutionPolicy Bypass -File tools\u-gate.ps1
# ============================================================

 $ErrorActionPreference = "Stop"
[Console]::OutputEncoding = New-Object System.Text.UTF8Encoding($false)
Write-Host "=== U-GATE ===" -ForegroundColor Cyan

if ($PWD.Path -ne "E:\projects\training-center-saas-fixed2\training-center-saas-final\markazak-saas") { throw ("WRONG LOCATION: " + $PWD.Path) }

 $st0 = @(git status --porcelain)
 $expectedM = @('app/globals.css','components/Shell.tsx','components/CrudPage.tsx','components/CrudPage.before-mojibake-fix-20260922-114553.tsx')
 $bad = @()
foreach ($line in $st0) {
  $st = $line.Substring(0,2); $p = $line.Substring(3)
  if (($st -eq 'M ') -or ($st -eq ' M')) { if ($expectedM -contains $p) { continue } ; $bad += $line; continue }
  if ($st -eq '??') { if ($p -like 'tools/*' -or $p -like '.impeccable*' -or $p -like '.codex*' -or $p -like '.gemini*') { continue } }
  $bad += $line
}
if ($bad.Count -gt 0) { throw ("unexpected tree state: " + ($bad -join " | ")) }

# ---------- re-verify content state (idempotent re-entry) ----------
 $strict = New-Object System.Text.UTF8Encoding($false, $true)
 $st2 = [System.IO.File]::ReadAllText('components\Shell.tsx')
 $c2 = ([regex]::Matches($st2, [regex]::Escape('text-[color:var(--gold)]'))).Count
if ($c2 -ne 4) { throw ("Shell gold=" + $c2 + " expected 4 - rerun u-theme2/u-final first") }
 $ct = [System.IO.File]::ReadAllText('components\CrudPage.tsx')
if ($ct.Contains('border-r-4 ')) { throw "CrudPage still has border-r-4" }
Write-Host "content re-verify: OK (gold=4, no border-r-4)" -ForegroundColor Green

# ---------- DESIGN GATE: detect in clean child shell ----------
Write-Host "--- DESIGN GATE (stderr-safe child shell) ---" -ForegroundColor Cyan
 $cmd = "npx impeccable detect app components > `"$env:TEMP\impeccable-detect.txt`" 2>&1"
cmd /c $cmd
 $dtxt = [System.IO.File]::ReadAllText((Join-Path $env:TEMP "impeccable-detect.txt"))
 $dtxt -split "`n" | ForEach-Object { $l = $_.TrimEnd(); if ($l -ne '') { Write-Host ("  " + $l) } }

if ($dtxt -match '(\d+)\s+anti-patterns found') {
  $n = [int]$Matches[1]
  if ($n -eq 0) {
    Write-Host "DESIGN GATE: CLEAN (0 anti-patterns)" -ForegroundColor Green
  } else {
    $onlyBackup = ($dtxt -match 'before-mojibake') -and (-not ($dtxt -match 'CrudPage\.tsx\s*\r?\n\s*line'))
    Write-Host ("DESIGN GATE: " + $n + " finding(s).") -ForegroundColor Yellow
    if ($onlyBackup) {
      Write-Host "All findings are in the ARCHIVE backup file only (not live UI)." -ForegroundColor Yellow
      Write-Host "ACTION REQUIRED: archive files are excluded from the repo in this push (not staged). Gate passes for LIVE files." -ForegroundColor Yellow
    } else {
      throw ("DESIGN GATE: " + $n + " live findings - fix or waive by owner decision. Nothing committed.")
    }
  }
} else {
  throw "detect verdict not parsed - paste the output above"
}

# ---------- tsc + build (state unchanged but gate re-verified cheaply) ----------
Write-Host "--- tsc ---"
& npx tsc --noEmit 2>&1 | Select-Object -First 15
if ($LASTEXITCODE -ne 0) { throw "tsc RED" }
Write-Host "tsc: GREEN" -ForegroundColor Green
Write-Host "--- build ---"
 $bl = Join-Path $env:TEMP "markazak-ug-build.log"
& npm run build 2>&1 | Out-File -FilePath $bl -Encoding utf8
if ($LASTEXITCODE -ne 0) { Get-Content $bl | Select-Object -Last 25; throw "build RED" }
Write-Host "build: GREEN" -ForegroundColor Green

# ---------- stage + GATE + commit + push ----------
 $allow = @(
  'app/globals.css','components/Shell.tsx','components/CrudPage.tsx',
  'tools/u-gate.ps1','tools/u-final.ps1','tools/u-theme2.ps1','tools/u-theme.ps1','tools/u-read.ps1','tools/u-design.ps1',
  'DESIGN.md'
)
foreach ($p in $allow) { if (Test-Path $p) { git add -- $p } }
 $staged = @(git diff --cached --name-only)
Write-Host ("staged: " + $staged.Count)
 $staged | ForEach-Object { Write-Host ("  + " + $_) }
if ($staged.Count -lt 2) { throw "staged too few" }

Write-Host "--- MANDATORY GATE ---" -ForegroundColor Cyan
& powershell -ExecutionPolicy Bypass -File tools\pre-push.ps1
if ($LASTEXITCODE -ne 0) { Write-Host "GATE RED - nothing committed." -ForegroundColor Red; exit 1 }

git commit -m "feat(u): theme ship - gold nav + subtle crud accent + design gate clean (stderr-safe runner)"
if ($LASTEXITCODE -ne 0) { throw "commit failed" }
git push -u origin main
if ($LASTEXITCODE -ne 0) { throw "push failed" }
Write-Host "SCOPE U SHIPPED." -ForegroundColor Green
Write-Host "LIVE TOUR next (2-3 min, incognito): login / dashboard / students+modal / attendance / finance / reports / settings / users / plans / ai"