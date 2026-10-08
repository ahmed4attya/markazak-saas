# ============================================================
# u-gate4.ps1 - FINAL: design gate verdict BY EXIT CODE
# (documented: 0=clean, 2=findings, 1=scan failure)
# + tsc + build + GATE + commit + push
# Run: powershell -ExecutionPolicy Bypass -File tools\u-gate4.ps1
# ============================================================

 $ErrorActionPreference = "Stop"
[Console]::OutputEncoding = New-Object System.Text.UTF8Encoding($false)
Write-Host "=== U-GATE4 (exit-code verdict) ===" -ForegroundColor Cyan

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

# ---------- content re-verify ----------
 $st2 = [System.IO.File]::ReadAllText('components\Shell.tsx')
 $c2 = ([regex]::Matches($st2, [regex]::Escape('text-[color:var(--gold)]'))).Count
if ($c2 -ne 4) { throw ("Shell gold=" + $c2 + " expected 4") }
if ($st2.Contains('text-slate-500 hover:text-red-600')) { throw "logout not tokenized" }
 $ct = [System.IO.File]::ReadAllText('components\CrudPage.tsx')
if ($ct.Contains('border-r-4 ')) { throw "CrudPage border-r-4 present" }
Write-Host "content re-verify: OK" -ForegroundColor Green

# ---------- DESIGN GATE: exit-code verdict ----------
Write-Host "--- DESIGN GATE (Start-Process + exit code) ---" -ForegroundColor Cyan
 $yesFile = Join-Path $env:TEMP "impeccable-yes.txt"
 $dt = Join-Path $env:TEMP "impeccable-detect4.out"
 $de = Join-Path $env:TEMP "impeccable-detect4.err"
foreach ($x in @($yesFile, $dt, $de)) { if (Test-Path $x) { Remove-Item $x -Force } }
[System.IO.File]::WriteAllText($yesFile, "y" + [char]13 + [char]10, (New-Object System.Text.ASCIIEncoding))

 $proc = Start-Process -FilePath "cmd.exe" `
  -ArgumentList "/c npx impeccable detect app components" `
  -RedirectStandardInput $yesFile `
  -RedirectStandardOutput $dt `
  -RedirectStandardError $de `
  -NoNewWindow -Wait -PassThru
 $code = $proc.ExitCode
Write-Host ("detect exit code: " + $code)

foreach ($pair in @(@("STDOUT", $dt), @("STDERR", $de))) {
  if (Test-Path $pair[1]) {
    $content = [System.IO.File]::ReadAllText($pair[1])
    if ($content.Trim().Length -gt 0) {
      Write-Host ("--- " + $pair[0] + " ---")
      $content -split "`n" | ForEach-Object { $l = $_.TrimEnd(); if ($l -ne '') { Write-Host ("  " + $l) } }
    }
  }
}

if ($code -eq 0) {
  Write-Host "DESIGN GATE: CLEAN (exit 0 - no primary findings)" -ForegroundColor Green
} elseif ($code -eq 2) {
  Write-Host "DESIGN GATE: findings exist (exit 2) - see output above." -ForegroundColor Red
  throw "DESIGN GATE not clean - nothing committed. Fix or waive by owner decision."
} elseif ($code -eq 1) {
  throw "DESIGN GATE: scan failure (exit 1) - a target could not be scanned. Paste output."
} else {
  throw ("DESIGN GATE: unexpected exit code " + $code + " - paste output")
}

# ---------- tsc + build ----------
Write-Host "--- tsc ---"
& npx tsc --noEmit 2>&1 | Select-Object -First 15
if ($LASTEXITCODE -ne 0) { throw "tsc RED" }
Write-Host "tsc: GREEN" -ForegroundColor Green
Write-Host "--- build ---"
 $bl = Join-Path $env:TEMP "markazak-ug4-build.log"
& npm run build 2>&1 | Out-File -FilePath $bl -Encoding utf8
if ($LASTEXITCODE -ne 0) { Get-Content $bl | Select-Object -Last 25; throw "build RED" }
Write-Host "build: GREEN" -ForegroundColor Green

# ---------- stage + GATE + commit + push ----------
 $allow = @(
  'app/globals.css','components/Shell.tsx','components/CrudPage.tsx',
  'tools/u-gate4.ps1','tools/u-gate3.ps1','tools/u-gate2.ps1','tools/u-gate.ps1','tools/u-final.ps1','tools/u-theme2.ps1','tools/u-theme.ps1','tools/u-read.ps1','tools/u-design.ps1',
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

git commit -m "feat(u): night luxe complete - design gate clean by exit code 0"
if ($LASTEXITCODE -ne 0) { throw "commit failed" }
git push -u origin main
if ($LASTEXITCODE -ne 0) { throw "push failed" }
Write-Host "SCOPE U SHIPPED - DESIGN GATE EXIT 0." -ForegroundColor Green
Write-Host "LIVE TOUR (2-3 min, incognito): login / dashboard / students+modal / attendance / finance / reports / settings / users / plans / ai"