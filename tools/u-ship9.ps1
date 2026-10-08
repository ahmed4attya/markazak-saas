# ============================================================
# u-ship9.ps1 - FINAL Scope U closer (measured: gold=7, soft>=2)
# Run: powershell -ExecutionPolicy Bypass -File tools\u-ship9.ps1
# ============================================================

 $ErrorActionPreference = "Stop"
[Console]::OutputEncoding = New-Object System.Text.UTF8Encoding($false)
Write-Host "=== U-SHIP9 (final) ===" -ForegroundColor Cyan

if ($PWD.Path -ne "E:\projects\training-center-saas-fixed2\training-center-saas-final\markazak-saas") { throw ("WRONG LOCATION: " + $PWD.Path) }

 $st0 = @(git status --porcelain)
 $expectedM = @('app/globals.css','components/Shell.tsx','app/dashboard/page.tsx')
 $bad = @()
foreach ($line in $st0) {
  $st = $line.Substring(0,2); $p = $line.Substring(3)
  if (($st -eq 'M ') -or ($st -eq ' M')) { if ($expectedM -contains $p) { continue } ; $bad += $line; continue }
  if ($st -eq '??') { if ($p -like 'tools/*' -or $p -like '.impeccable*' -or $p -like '.codex*' -or $p -like '.gemini*') { continue } }
  $bad += $line
}
if ($bad.Count -gt 0) { throw ("unexpected tree state: " + ($bad -join " | ")) }
 $strict = New-Object System.Text.UTF8Encoding($false, $true)
function From-Codes { param([int[]]$Codes) (-join ($Codes | ForEach-Object { [char]$_ })) }

# ---------- 1. dashboard (already fixed - verify only) ----------
 $dt = [System.IO.File]::ReadAllText('app\dashboard\page.tsx')
if (([regex]::Matches($dt, 'card\.accent')).Count -ne 0) { throw "card.accent still present" }
if (([regex]::Matches($dt, [regex]::Escape("accent: '"))).Count -ne 4) { throw "accents != 4" }
if (([regex]::Matches($dt, [regex]::Escape(', accent)}'))).Count -ne 1) { throw "accent binding != 1" }
Write-Host "dashboard verify OK" -ForegroundColor Green

# ---------- 2. Shell verify (idempotent write + measured counts) ----------
 $sf = 'components\Shell.tsx'
 $sb = [System.IO.File]::ReadAllBytes($sf)
 $sbom = ($sb.Length -ge 3 -and $sb[0] -eq 239 -and $sb[1] -eq 187 -and $sb[2] -eq 191)
 $stx = [System.IO.File]::ReadAllText($sf)
if ($stx.Length -lt 9000) { throw ("Shell suspiciously small: " + $stx.Length + " - rebuild via u-close2 first") }

 $needles = @{
  dash  = @(0x0644,0x0648,0x062D,0x0629,0x20,0x0627,0x0644,0x062A,0x062D,0x0643,0x0645)
  soon  = @(0x0642,0x0631,0x064A,0x0628,0x0627,0x064B)
  sub   = @(0x0627,0x0634,0x062A,0x0631,0x0627,0x0643,0x20,0x0646,0x0634,0x0637)
  audit = @(0x0633,0x062C,0x0644,0x20,0x0627,0x0644,0x062A,0x062F,0x0642,0x064A,0x0642)
  quick = @(0x0627,0x0644,0x062A,0x0648,0x0627,0x0635,0x0644,0x20,0x0627,0x0644,0x0633,0x0631,0x064A,0x0639)
  users = @(0x0627,0x0644,0x0645,0x0633,0x062A,0x062E,0x062F,0x0645,0x0648,0x0646,0x20,0x0648,0x0627,0x0644,0x0635,0x0644,0x0627,0x062D,0x064A,0x0627,0x062A)
}
foreach ($k in $needles.Keys) {
  $needle = From-Codes $needles[$k]
  if (([regex]::Matches($stx, [regex]::Escape($needle))).Count -lt 1) { throw ("ARABIC INTEGRITY FAILED [" + $k + "]") }
}
Write-Host "Arabic integrity: 6 needles OK" -ForegroundColor Green

 $cGold = ([regex]::Matches($stx, [regex]::Escape('text-[color:var(--gold)]'))).Count
 $cGoldSoft = ([regex]::Matches($stx, [regex]::Escape('bg-[color:var(--gold-soft)]'))).Count
Write-Host ("gold: text-gold=" + $cGold + "  gold-soft=" + $cGoldSoft)
if ($cGold -ne 5) { throw ("gold text=" + $cGold + " want 5") }
if (([regex]::Matches($stx, [regex]::Escape("bg-[color:var(--gold)]"))).Count -ne 2) { throw "bg-gold != 2" }
if ($cGoldSoft -lt 2) { throw ("gold-soft=" + $cGoldSoft + " want >=2") }
foreach ($p in @('nav-scroll','soon:analytics','soon:audit','groups.map','dateStr')) {
  if (([regex]::Matches($stx, [regex]::Escape($p))).Count -lt 1) { throw ("Shell missing: " + $p) }
}
 $sideStart = $stx.IndexOf('<aside'); $sideEnd = $stx.IndexOf('</aside>')
 $sidebar = $stx.Substring($sideStart, $sideEnd - $sideStart)
foreach ($a in @('bg-white','bg-slate-50','bg-slate-100','border-slate-200','text-slate-800','text-slate-500','text-slate-400','no-scrollbar','bg-blue-600','py-2.5')) {
  if (([regex]::Matches($sidebar, [regex]::Escape($a))).Count -ne 0) { throw ("SIDEBAR contains [" + $a + "]") }
}
Write-Host "Shell verify: measured counts + IA + tokens ALL OK" -ForegroundColor Green

# ---------- 3. globals verify ----------
 $gt = [System.IO.File]::ReadAllText('app\globals.css')
if (([regex]::Matches($gt, [regex]::Escape('#fcd34d'))).Count -lt 1) { throw "amber CTA missing" }
if (([regex]::Matches($gt, [regex]::Escape('.nav-scroll::-webkit-scrollbar'))).Count -lt 1) { throw "nav-scroll css missing" }
Write-Host "globals verify OK" -ForegroundColor Green

# ---------- 4. tsc + build ----------
& npx tsc --noEmit 2>&1 | Select-Object -First 20
if ($LASTEXITCODE -ne 0) { throw "tsc RED - paste output" }
Write-Host "tsc: GREEN" -ForegroundColor Green
 $bl = Join-Path $env:TEMP "markazak-us9-build.log"
& npm run build 2>&1 | Out-File -FilePath $bl -Encoding utf8
if ($LASTEXITCODE -ne 0) { Get-Content $bl | Select-Object -Last 25; throw "build RED" }
Write-Host "build: GREEN" -ForegroundColor Green

# ---------- 5. DESIGN GATE (exit code) ----------
 $yesFile = Join-Path $env:TEMP "imp-yes.txt"
 $d4 = Join-Path $env:TEMP "imp-d9.out"; $e4 = Join-Path $env:TEMP "imp-d9.err"
foreach ($x in @($yesFile, $d4, $e4)) { if (Test-Path $x) { Remove-Item $x -Force } }
[System.IO.File]::WriteAllText($yesFile, "y" + [char]13 + [char]10, (New-Object System.Text.ASCIIEncoding))
 $proc = Start-Process -FilePath "cmd.exe" -ArgumentList "/c npx impeccable detect app components" -RedirectStandardInput $yesFile -RedirectStandardOutput $d4 -RedirectStandardError $e4 -NoNewWindow -Wait -PassThru
foreach ($pair in @(@("STDOUT", $d4), @("STDERR", $e4))) {
  if (Test-Path $pair[1]) { $cc = [System.IO.File]::ReadAllText($pair[1]); if ($cc.Trim().Length -gt 0) { Write-Host ("--- " + $pair[0] + " ---"); $cc -split "`n" | ForEach-Object { $l = $_.TrimEnd(); if ($l -ne '') { Write-Host ("  " + $l) } } } }
}
if ($proc.ExitCode -eq 0) { Write-Host "DESIGN GATE: CLEAN (exit 0)" -ForegroundColor Green }
elseif ($proc.ExitCode -eq 2) { throw "DESIGN GATE findings (exit 2) - see above." }
else { throw ("DESIGN GATE unexpected exit " + $proc.ExitCode) }

# ---------- 6. DESIGN.md (DEC-039) ----------
 $dp = Join-Path $PWD "DESIGN.md"
if (-not ([System.IO.File]::ReadAllText($dp)).Contains('DEC-039')) {
  $sec = @'

## 10. Sidebar IA rebuild (DEC-039)
Owner-provided target IA adopted: grouped sections -
Home [Dashboard] / Operations [Students, Teachers, Courses, Groups, Attendance, Finance, Certificates] /
Quick access [Analytics(soon), Reports, AI] / Admin [Users, Settings, Subscription, Audit log(soon)].
Plus: subscription pill, live topbar date (hydration-safe), nav-scroll visible scrollbar, compact density.
Shell.tsx REBUILT completely (lesson 35). Gold count measured live = 7 (lesson 41/42).
'@
  [System.IO.File]::AppendAllText($dp, $sec, (New-Object System.Text.UTF8Encoding $true))
}

# ---------- 7. stage + GATE + commit + push ----------
 $allow = @('app/globals.css','components/Shell.tsx','app/dashboard/page.tsx','DESIGN.md','tools/u-ship9.ps1','tools/u-close2.ps1','tools/u-close.ps1','tools/u-mofeed3.ps1','tools/u-mofeed2.ps1','tools/u-mofeed.ps1')
foreach ($p in $allow) { if (Test-Path $p) { git add -- $p } }
 $staged = @(git diff --cached --name-only)
Write-Host ("staged: " + $staged.Count)
 $staged | ForEach-Object { Write-Host ("  + " + $_) }
if ($staged.Count -lt 4) { throw "staged too few" }

& powershell -ExecutionPolicy Bypass -File tools\pre-push.ps1
if ($LASTEXITCODE -ne 0) { Write-Host "GATE RED - nothing committed." -ForegroundColor Red; exit 1 }

git commit -m "feat(u): grouped sidebar IA + subscription pill + topbar date, shell rebuilt, dashboard accent fix (DEC-039) - design gate 0"
if ($LASTEXITCODE -ne 0) { throw "commit failed" }
git push -u origin main
if ($LASTEXITCODE -ne 0) { throw "push failed" }
Write-Host "SCOPE U SHIPPED - live in 2-3 min." -ForegroundColor Green
Write-Host "VERIFY: grouped sidebar + ALL links + subscription pill + topbar date + module cards + amber CTA"