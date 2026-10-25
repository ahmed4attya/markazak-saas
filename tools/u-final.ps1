# ============================================================
# u-final.ps1 - Scope U closer
# 1) Shell gold transform: verify-or-apply (idempotent)
# 2) detect fix: CrudPage border-r-4 (both files) -> subtle accent
# 3) tsc + build + detect(app components) + GATE + commit + push
# Run: powershell -ExecutionPolicy Bypass -File tools\u-final.ps1
# ============================================================

 $ErrorActionPreference = "Stop"
[Console]::OutputEncoding = New-Object System.Text.UTF8Encoding($false)
Write-Host "=== U-FINAL ===" -ForegroundColor Cyan

if ($PWD.Path -ne "E:\projects\training-center-saas-fixed2\training-center-saas-final\markazak-saas") { throw ("WRONG LOCATION: " + $PWD.Path) }

 $st0 = @(git status --porcelain)
 $expectedM = @('app/globals.css','components/Shell.tsx','components/CrudPage.tsx')
 $bad = @()
foreach ($line in $st0) {
  $st = $line.Substring(0,2); $p = $line.Substring(3)
  if (($st -eq 'M ') -or ($st -eq ' M')) { if ($expectedM -contains $p) { continue } ; $bad += $line; continue }
  if ($st -eq '??') { if ($p -like 'tools/*' -or $p -like '.impeccable*' -or $p -like '.codex*' -or $p -like '.gemini*') { continue } }
  $bad += $line
}
if ($bad.Count -gt 0) { throw ("unexpected tree state: " + ($bad -join " | ")) }

 $strict = New-Object System.Text.UTF8Encoding($false, $true)
 $BT = [string][char]96

# ---------- 1. Shell transform: verify-or-apply ----------
 $sf = 'components\Shell.tsx'
 $sraw = [System.IO.File]::ReadAllText($sf)
 $goldCount = ([regex]::Matches($sraw, [regex]::Escape('text-[color:var(--gold)]'))).Count
if ($goldCount -eq 4) {
  Write-Host "Shell: gold transform ALREADY APPLIED (verified)" -ForegroundColor Yellow
} else {
  $sb = [System.IO.File]::ReadAllBytes($sf)
  $sbom = ($sb.Length -ge 3 -and $sb[0] -eq 239 -and $sb[1] -eq 187 -and $sb[2] -eq 191)
  $seol = [string][char]10; if ($sraw.Contains([char]13)) { $seol = [string][char]13 + [string][char]10 }
  $sendNl = $sraw.EndsWith($seol)
  $slines = [System.IO.File]::ReadAllLines($sf)
  $trimA = '? "bg-blue-50 text-blue-600 shadow-sm"'
  $newA  = '? "bg-[color:var(--gold-soft)] text-[color:var(--gold)] shadow-sm"'
  $trimB = '<Icon size={18} className={cn(isActive ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600")} />'
  $newB  = '<Icon size={18} className={cn(isActive ? "text-[color:var(--gold)]" : "text-[color:var(--muted)] group-hover:text-[color:var(--text)]")} />'
  $hitsA = 0
  for ($k = 0; $k -lt $slines.Count; $k++) { if ($slines[$k].Trim() -ceq $trimA) { $ind = [regex]::Match($slines[$k], '^\s*').Value; $slines[$k] = $ind + $newA; $hitsA++ } }
  if ($hitsA -ne 2) { throw ("anchor A hits=" + $hitsA) }
  $hitsB = 0
  for ($k = 0; $k -lt $slines.Count; $k++) { if ($slines[$k].Trim() -ceq $trimB) { $ind = [regex]::Match($slines[$k], '^\s*').Value; $slines[$k] = $ind + $newB; $hitsB++ } }
  if ($hitsB -ne 2) { throw ("anchor B hits=" + $hitsB) }
  $sout = ($slines -join $seol); if ($sendNl) { $sout += $seol }
  [System.IO.File]::WriteAllText($sf, $sout, (New-Object System.Text.UTF8Encoding($sbom)))
  $snb = [System.IO.File]::ReadAllBytes($sf)
  $null = $strict.GetString($snb)
  Write-Host "Shell: gold transform APPLIED" -ForegroundColor Green
}
 $st2 = [System.IO.File]::ReadAllText($sf)
 $c2 = ([regex]::Matches($st2, [regex]::Escape('text-[color:var(--gold)]'))).Count
if ($c2 -ne 4) { throw ("gold count=" + $c2 + " expected 4") }
Write-Host "Shell final verify: gold=4 OK" -ForegroundColor Green

# ---------- 2. CrudPage border-r-4 fix (detect finding 1+2) ----------
foreach ($cf in @('components\CrudPage.tsx','components\CrudPage.before-mojibake-fix-20260922-114553.tsx')) {
  if (-not (Test-Path $cf)) { continue }
  $cb = [System.IO.File]::ReadAllBytes($cf)
  $cbom = ($cb.Length -ge 3 -and $cb[0] -eq 239 -and $cb[1] -eq 187 -and $cb[2] -eq 191)
  $craw = [System.IO.File]::ReadAllText($cf)
  if (-not $craw.Contains('border-r-4')) { Write-Host ($cf + ": no border-r-4 (skip)") ; continue }
  $ceol = [string][char]10; if ($craw.Contains([char]13)) { $ceol = [string][char]13 + [string][char]10 }
  $cendNl = $craw.EndsWith($ceol)
  $clines = [System.IO.File]::ReadAllLines($cf)
  $hits = 0
  for ($k = 0; $k -lt $clines.Count; $k++) {
    if ($clines[$k].Contains('border-r-4')) {
      $clines[$k] = $clines[$k] -replace 'border-r-4', 'border-r-[3px] border-r-[color:var(--gold)]/60'
      $hits++
    }
  }
  Write-Host ($cf + ": border-r-4 x" + $hits + " -> subtle gold accent")
  $cout = ($clines -join $ceol); if ($cendNl) { $cout += $ceol }
  [System.IO.File]::WriteAllText($cf, $cout, (New-Object System.Text.UTF8Encoding($cbom)))
  $cnb = [System.IO.File]::ReadAllBytes($cf)
  $null = $strict.GetString($cnb)
}
 $cT = [System.IO.File]::ReadAllText('components\CrudPage.tsx')
if ($cT.Contains('border-r-4 ')) { throw "CrudPage still has border-r-4 with space" }
if (([regex]::Matches($cT, [regex]::Escape('border-r-[3px]'))).Count -lt 1) { throw "CrudPage accent missing" }
Write-Host "CrudPage fix verified" -ForegroundColor Green

# ---------- 3. tsc + build ----------
Write-Host "--- tsc ---"
& npx tsc --noEmit 2>&1 | Select-Object -First 20
if ($LASTEXITCODE -ne 0) { throw "tsc RED - paste output" }
Write-Host "tsc: GREEN" -ForegroundColor Green
Write-Host "--- build ---"
 $bl = Join-Path $env:TEMP "markazak-uf-build.log"
& npm run build 2>&1 | Out-File -FilePath $bl -Encoding utf8
if ($LASTEXITCODE -ne 0) { Get-Content $bl | Select-Object -Last 30; throw "build RED" }
Write-Host "build: GREEN" -ForegroundColor Green

# ---------- 4. DESIGN GATE: detect on sources (must run; findings=0 expected for live files) ----------
Write-Host "--- DESIGN GATE: impeccable detect (sources) ---"
 $dg = & npx impeccable detect app components 2>&1
 $dg | ForEach-Object { Write-Host ("  " + $_) }
 $dgTxt = ($dg | Out-String)
if ($dgTxt -match 'anti-patterns found: [1-9]' -or ($dgTxt -match '\b[1-9]\d* anti-patterns found\b')) {
  Write-Host "DESIGN GATE: findings remain - review above." -ForegroundColor Red
  Write-Host "NOTE: only CrudPage.before-mojibake backup file is acceptable to waive (archive file, not live UI)." -ForegroundColor Yellow
  throw "DESIGN GATE not clean - owner decision required (fix or waive). Nothing committed."
}
if ($dgTxt -notmatch '0 anti-patterns found') { Write-Host "detect output unparsed - paste above to assistant" -ForegroundColor Yellow }
Write-Host "DESIGN GATE: CLEAN (0 anti-patterns)" -ForegroundColor Green

# ---------- 5. stage + GATE + commit + push ----------
 $allow = @('app/globals.css','components/Shell.tsx','components/CrudPage.tsx','tools/u-final.ps1','tools/u-theme2.ps1','tools/u-theme.ps1','tools/u-read.ps1','tools/u-design.ps1','DESIGN.md')
foreach ($p in $allow) { if (Test-Path $p) { git add -- $p } }
 $staged = @(git diff --cached --name-only)
Write-Host ("staged: " + $staged.Count)
 $staged | ForEach-Object { Write-Host ("  + " + $_) }
if ($staged.Count -lt 2) { throw "staged too few" }

Write-Host "--- MANDATORY GATE ---" -ForegroundColor Cyan
& powershell -ExecutionPolicy Bypass -File tools\pre-push.ps1
if ($LASTEXITCODE -ne 0) { Write-Host "GATE RED - nothing committed." -ForegroundColor Red; exit 1 }

git commit -m "feat(u): shell gold nav verified, crud side-tab subtle gold accent, detect gate clean (lesson 37)"
if ($LASTEXITCODE -ne 0) { throw "commit failed" }
git push -u origin main
if ($LASTEXITCODE -ne 0) { throw "push failed" }
Write-Host "SCOPE U SHIPPED - detect gate clean." -ForegroundColor Green
Write-Host "LIVE TOUR next (2-3 min): login / dashboard / students+modal / attendance / finance / reports / settings / users / plans / ai"