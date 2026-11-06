# ============================================================
# u-gate2.ps1 - FINAL Scope U closer
# 1) Shell logout line -> theme tokens (removes gray-on-color)
# 2) detect re-run: pipe "y", parse singular/plural verdict
# 3) tsc + build + GATE + commit + push
# Run: powershell -ExecutionPolicy Bypass -File tools\u-gate2.ps1
# ============================================================

 $ErrorActionPreference = "Stop"
[Console]::OutputEncoding = New-Object System.Text.UTF8Encoding($false)
Write-Host "=== U-GATE2 ===" -ForegroundColor Cyan

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

 $strict = New-Object System.Text.UTF8Encoding($false, $true)

# ---------- 1. Shell logout line -> tokens ----------
 $sf = 'components\Shell.tsx'
 $sb = [System.IO.File]::ReadAllBytes($sf)
 $sbom = ($sb.Length -ge 3 -and $sb[0] -eq 239 -and $sb[1] -eq 187 -and $sb[2] -eq 191)
 $sraw = [System.IO.File]::ReadAllText($sf)
 $old = 'text-slate-500 hover:text-red-600 hover:bg-red-50'
 $neu = 'text-[color:var(--muted)] hover:text-[color:var(--danger)] hover:bg-[color:var(--danger-soft)]'
if ($sraw.Contains($neu)) {
  Write-Host "Shell logout: already tokenized (skip)" -ForegroundColor Yellow
} else {
  $c = ([regex]::Matches($sraw, [regex]::Escape($old))).Count
  if ($c -ne 1) { throw ("logout pattern hits=" + $c + " expected 1") }
  $sraw = $sraw.Replace($old, $neu)
  $sout = $sraw
  [System.IO.File]::WriteAllText($sf, $sout, (New-Object System.Text.UTF8Encoding($sbom)))
  $snb = [System.IO.File]::ReadAllBytes($sf)
  $null = $strict.GetString($snb)
  if (([regex]::Matches([System.IO.File]::ReadAllText($sf), [regex]::Escape($old))).Count -ne 0) { throw "old pattern still present" }
  Write-Host "Shell logout: tokenized (gray-on-color removed at source)" -ForegroundColor Green
}

# ---------- 2. DESIGN GATE re-run ----------
Write-Host "--- DESIGN GATE (pipe-y + singular-safe parse) ---" -ForegroundColor Cyan
 $dt = Join-Path $env:TEMP "impeccable-detect2.txt"
if (Test-Path $dt) { Remove-Item $dt -Force }
 $cmd = "echo y| npx impeccable detect app components > `"$dt`" 2>&1"
cmd /c $cmd
 $dtxt = [System.IO.File]::ReadAllText($dt)
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

# ---------- 3. tsc + build ----------
Write-Host "--- tsc ---"
& npx tsc --noEmit 2>&1 | Select-Object -First 15
if ($LASTEXITCODE -ne 0) { throw "tsc RED" }
Write-Host "tsc: GREEN" -ForegroundColor Green
Write-Host "--- build ---"
 $bl = Join-Path $env:TEMP "markazak-ug2-build.log"
& npm run build 2>&1 | Out-File -FilePath $bl -Encoding utf8
if ($LASTEXITCODE -ne 0) { Get-Content $bl | Select-Object -Last 25; throw "build RED" }
Write-Host "build: GREEN" -ForegroundColor Green

# ---------- 4. stage + GATE + commit + push ----------
 $allow = @(
  'app/globals.css','components/Shell.tsx','components/CrudPage.tsx',
  'tools/u-gate2.ps1','tools/u-gate.ps1','tools/u-final.ps1','tools/u-theme2.ps1','tools/u-theme.ps1','tools/u-read.ps1','tools/u-design.ps1',
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

git commit -m "feat(u): logout link tokenized, design gate clean 0/0 - night luxe complete"
if ($LASTEXITCODE -ne 0) { throw "commit failed" }
git push -u origin main
if ($LASTEXITCODE -ne 0) { throw "push failed" }
Write-Host "SCOPE U SHIPPED - DESIGN GATE 0 anti-patterns." -ForegroundColor Green
Write-Host "LIVE TOUR (2-3 min, incognito): login / dashboard / students+modal / attendance / finance / reports / settings / users / plans / ai"