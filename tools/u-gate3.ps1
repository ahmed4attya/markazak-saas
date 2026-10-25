# ============================================================
# u-gate3.ps1 - FINAL closer: detect via PS pipe (no cmd),
# EAP temporarily relaxed to capture stderr verbatim,
# singular/plural-safe verdict, then tsc/build/GATE/ship.
# Run: powershell -ExecutionPolicy Bypass -File tools\u-gate3.ps1
# ============================================================

 $ErrorActionPreference = "Stop"
[Console]::OutputEncoding = New-Object System.Text.UTF8Encoding($false)
Write-Host "=== U-GATE3 ===" -ForegroundColor Cyan

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

# ---------- re-verify content ----------
 $st2 = [System.IO.File]::ReadAllText('components\Shell.tsx')
 $c2 = ([regex]::Matches($st2, [regex]::Escape('text-[color:var(--gold)]'))).Count
if ($c2 -ne 4) { throw ("Shell gold=" + $c2 + " expected 4") }
if ($st2.Contains('text-slate-500 hover:text-red-600')) { throw "logout line not tokenized - rerun u-gate2 first" }
 $ct = [System.IO.File]::ReadAllText('components\CrudPage.tsx')
if ($ct.Contains('border-r-4 ')) { throw "CrudPage border-r-4 still present" }
Write-Host "content re-verify: OK" -ForegroundColor Green

# ---------- DESIGN GATE: detect via PS pipe ----------
Write-Host "--- DESIGN GATE (PS pipe, EAP relaxed) ---" -ForegroundColor Cyan
 $dt = Join-Path $env:TEMP "impeccable-detect3.txt"
if (Test-Path $dt) { Remove-Item $dt -Force }

 $prevEap = $ErrorActionPreference
 $ErrorActionPreference = "Continue"
"y" | & npx impeccable detect app components 2>&1 | Out-File -FilePath $dt -Encoding utf8
 $ErrorActionPreference = $prevEap

if (-not (Test-Path $dt)) { throw "detect output file missing" }
 $dtxt = [System.IO.File]::ReadAllText($dt)
if ($dtxt.Trim().Length -eq 0) { throw "detect output EMPTY - npx may have failed; run manually: npx impeccable detect app components" }
 $dtxt -split "`n" | ForEach-Object { $l = $_.TrimEnd(); if ($l -ne '') { Write-Host ("  " + $l) } }

 $verdict = $null
 $m = [regex]::Match($dtxt, '(\d+)\s+anti-patterns?\s+found')
if ($m.Success) { $verdict = [int]$m.Groups[1].Value }
if ($null -eq $verdict) { throw "detect verdict not parsed - paste output above" }
if ($verdict -ne 0) {
  Write-Host ("DESIGN GATE: " + $verdict + " finding(s) remain.") -ForegroundColor Red
  throw "DESIGN GATE not clean - nothing committed. Paste output to assistant."
}
Write-Host "DESIGN GATE: CLEAN (0 anti-patterns)" -ForegroundColor Green

# ---------- tsc + build ----------
Write-Host "--- tsc ---"
& npx tsc --noEmit 2>&1 | Select-Object -First 15
if ($LASTEXITCODE -ne 0) { throw "tsc RED" }
Write-Host "tsc: GREEN" -ForegroundColor Green
Write-Host "--- build ---"
 $bl = Join-Path $env:TEMP "markazak-ug3-build.log"
& npm run build 2>&1 | Out-File -FilePath $bl -Encoding utf8
if ($LASTEXITCODE -ne 0) { Get-Content $bl | Select-Object -Last 25; throw "build RED" }
Write-Host "build: GREEN" -ForegroundColor Green

# ---------- stage + GATE + commit + push ----------
 $allow = @(
  'app/globals.css','components/Shell.tsx','components/CrudPage.tsx',
  'tools/u-gate3.ps1','tools/u-gate2.ps1','tools/u-gate.ps1','tools/u-final.ps1','tools/u-theme2.ps1','tools/u-theme.ps1','tools/u-read.ps1','tools/u-design.ps1',
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

git commit -m "feat(u): night luxe complete - design gate 0 findings via robust runner"
if ($LASTEXITCODE -ne 0) { throw "commit failed" }
git push -u origin main
if ($LASTEXITCODE -ne 0) { throw "push failed" }
Write-Host "SCOPE U SHIPPED - DESIGN GATE CLEAN." -ForegroundColor Green
Write-Host "LIVE TOUR (2-3 min, incognito): login / dashboard / students+modal / attendance / finance / reports / settings / users / plans / ai"