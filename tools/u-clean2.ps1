# ============================================================
# u-clean2.ps1 - FINAL: sidebar footer removal (line-bounded,
# guard-verified) + topbar logout icon + SHIP ENTIRE SCOPE U
# tsc/build run with relaxed EAP (stderr-safe, lesson 45)
# Run: powershell -ExecutionPolicy Bypass -File tools\u-clean2.ps1
# ============================================================

 $ErrorActionPreference = "Stop"
[Console]::OutputEncoding = New-Object System.Text.UTF8Encoding($false)
Write-Host "=== U-CLEAN2 ===" -ForegroundColor Cyan

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

# ============ Shell.tsx ============
 $sf = 'components\Shell.tsx'
 $sb = [System.IO.File]::ReadAllBytes($sf)
 $sbom = ($sb.Length -ge 3 -and $sb[0] -eq 239 -and $sb[1] -eq 187 -and $sb[2] -eq 191)
 $slines = [System.IO.File]::ReadAllLines($sf)

# ---- E1: remove footer = anchor .. line before inner-flex close ----
 $anchor = '          <div className="mt-auto pt-4 border-t border-[color:var(--border)]">'
 $hits = 0; $iF = -1
for ($k = 0; $k -lt $slines.Count; $k++) { if ($slines[$k] -ceq $anchor) { $hits++; $iF = $k } }
if ($hits -eq 1) {
  $iA = -1
  for ($k = $iF + 1; $k -lt $slines.Count; $k++) { if ($slines[$k] -ceq '      </aside>') { $iA = $k; break } }
  if ($iA -lt 0 -or ($iA - $iF) -gt 40) { throw "aside close not found near footer" }
  if ($slines[$iA - 1] -cne '        </div>') { throw ("pre-aside line unexpected: [" + $slines[$iA-1] + "]") }
  Write-Host ("removing footer: lines " + ($iF+1) + ".." + ($iA-1) + " (keeping flex close)")
  $newLines = @()
  if ($iF -gt 0) { $newLines += $slines[0..($iF-1)] }
  $newLines += $slines[($iA-1)..($slines.Count-1)]
  $slines = $newLines
} elseif ($hits -eq 0) {
  Write-Host "footer: already removed (skip)" -ForegroundColor Yellow
} else { throw ("footer anchor hits=" + $hits) }

# ---- E2: topbar logout button after divider ----
 $divA = '            <div className="h-8 w-[1px] bg-[color:var(--border-strong)] mx-1"></div>'
 $h2 = 0; $iD = -1
for ($k = 0; $k -lt $slines.Count; $k++) { if ($slines[$k] -ceq $divA) { $h2++; $iD = $k } }
 $titleAr = From-Codes @(0x062A,0x0633,0x062C,0x064A,0x0644,0x20,0x0627,0x0644,0x062E,0x0631,0x0648,0x062C)
if ($h2 -eq 1) {
  $btn = @(
    '            <button',
    '              onClick={logout}',
    ('              title="' + $titleAr + '"'),
    '              className="p-2 text-[color:var(--muted)] hover:text-[color:var(--danger)] hover:bg-[color:var(--danger-soft)] rounded-full transition-colors"',
    '            >',
    '              <LogOut size={18} />',
    '            </button>'
  )
  $slines = $slines[0..$iD] + $btn + $slines[($iD+1)..($slines.Count-1)]
  Write-Host "topbar logout button: added" -ForegroundColor Green
} elseif ($h2 -eq 0 -and $slines -contains ('              title="' + $titleAr + '"')) {
  Write-Host "topbar logout button: already present (skip)" -ForegroundColor Yellow
} else { throw ("divider hits=" + $h2) }

# ---- save ----
 $seol = [string][char]10
if (($slines -join [string][char]10).Contains([char]13)) { $seol = [string][char]13 + [string][char]10 }
 $sout = ($slines -join $seol)
[System.IO.File]::WriteAllText($sf, $sout, (New-Object System.Text.UTF8Encoding($sbom)))
 $snb = [System.IO.File]::ReadAllBytes($sf)
 $null = $strict.GetString($snb)
 $snbom = ($snb.Length -ge 3 -and $snb[0] -eq 239 -and $snb[1] -eq 187 -and $snb[2] -eq 191)
if ($snbom -ne $sbom) { throw "BOM state changed" }

# ---- verify (measured from disk) ----
 $stx = [System.IO.File]::ReadAllText($sf)
function V1 { param([string]$text, [string]$needle, [int]$want)
  $g = ([regex]::Matches($text, [regex]::Escape($needle))).Count
  if ($g -ne $want) { throw ("needle [" + $needle + "]: got=" + $g + " want=" + $want) }
}
V1 $stx $titleAr 1
V1 $stx 'onClick={logout}' 1
V1 $stx 'mt-auto' 0
V1 $stx 'text-[color:var(--gold)]' 4
V1 $stx 'bg-[color:var(--gold)]' 2
V1 $stx 'bg-[color:var(--gold-soft)]' 2
V1 $stx 'nav-scroll' 1
V1 $stx 'soon:analytics' 1
V1 $stx 'soon:audit' 1
 $sideStart = $stx.IndexOf('<aside'); $sideEnd = $stx.IndexOf('</aside>')
 $sidebar = $stx.Substring($sideStart, $sideEnd - $sideStart)
foreach ($a in @('bg-white','bg-slate-50','bg-slate-100','border-slate-200','text-slate-500','text-slate-400','no-scrollbar','bg-blue-600','py-2.5')) {
  if (([regex]::Matches($sidebar, [regex]::Escape($a))).Count -ne 0) { throw ("SIDEBAR contains [" + $a + "]") }
}
Write-Host "Shell verify: footer gone + topbar logout + gold(4/2/2) + IA intact" -ForegroundColor Green

# ============ dashboard + globals verify ============
 $dt = [System.IO.File]::ReadAllText('app\dashboard\page.tsx')
if (([regex]::Matches($dt, 'card\.accent')).Count -ne 0) { throw "card.accent present" }
if (([regex]::Matches($dt, [regex]::Escape("accent: '"))).Count -ne 4) { throw "accents != 4" }
 $gt = [System.IO.File]::ReadAllText('app\globals.css')
if (([regex]::Matches($gt, [regex]::Escape('#fcd34d'))).Count -lt 1) { throw "amber CTA missing" }
if (([regex]::Matches($gt, [regex]::Escape('.nav-scroll::-webkit-scrollbar'))).Count -lt 1) { throw "nav-scroll css missing" }
Write-Host "dashboard + globals verify OK" -ForegroundColor Green

# ============ tsc + build (relaxed EAP - lesson 45) ============
Write-Host "--- tsc ---"
 $prevEap = $ErrorActionPreference
 $ErrorActionPreference = "Continue"
& npx tsc --noEmit 2>&1 | Select-Object -First 20
 $tscCode = $LASTEXITCODE
 $ErrorActionPreference = $prevEap
if ($tscCode -ne 0) { throw "tsc RED" }
Write-Host "tsc: GREEN" -ForegroundColor Green
Write-Host "--- build ---"
 $bl = Join-Path $env:TEMP "markazak-uc2-build.log"
 $prevEap = $ErrorActionPreference
 $ErrorActionPreference = "Continue"
& npm run build 2>&1 | Out-File -FilePath $bl -Encoding utf8
 $buildCode = $LASTEXITCODE
 $ErrorActionPreference = $prevEap
if ($buildCode -ne 0) { Get-Content $bl | Select-Object -Last 25; throw ("build RED (exit " + $buildCode + ")") }
Write-Host "build: GREEN" -ForegroundColor Green

# ============ DESIGN GATE (exit code) ============
 $yesFile = Join-Path $env:TEMP "imp-yes.txt"
 $d4 = Join-Path $env:TEMP "imp-cl.out"; $e4 = Join-Path $env:TEMP "imp-cl.err"
foreach ($x in @($yesFile, $d4, $e4)) { if (Test-Path $x) { Remove-Item $x -Force } }
[System.IO.File]::WriteAllText($yesFile, "y" + [char]13 + [char]10, (New-Object System.Text.ASCIIEncoding))
 $proc = Start-Process -FilePath "cmd.exe" -ArgumentList "/c npx impeccable detect app components" -RedirectStandardInput $yesFile -RedirectStandardOutput $d4 -RedirectStandardError $e4 -NoNewWindow -Wait -PassThru
foreach ($pair in @(@("STDOUT", $d4), @("STDERR", $e4))) {
  if (Test-Path $pair[1]) { $cc = [System.IO.File]::ReadAllText($pair[1]); if ($cc.Trim().Length -gt 0) { Write-Host ("--- " + $pair[0] + " ---"); $cc -split "`n" | ForEach-Object { $l = $_.TrimEnd(); if ($l -ne '') { Write-Host ("  " + $l) } } } }
}
if ($proc.ExitCode -eq 0) { Write-Host "DESIGN GATE: CLEAN (exit 0)" -ForegroundColor Green }
elseif ($proc.ExitCode -eq 2) { throw "DESIGN GATE findings (exit 2) - see above. Nothing committed." }
else { throw ("DESIGN GATE unexpected exit " + $proc.ExitCode) }

# ============ DESIGN.md (DEC-038 + DEC-039 + addendum) ============
 $dp = Join-Path $PWD "DESIGN.md"
 $dtxt = [System.IO.File]::ReadAllText($dp)
if (-not $dtxt.Contains('DEC-038')) {
  $s38 = @'

## 9. Night Neon evolution (DEC-038)
El-Mofeed visual language adopted (not copied): CTA gradient amber (#fcd34d -> #f59e0b, dark text),
per-module card accents (translucent fill + colored border) on dashboard bento,
sidebar compact density + visible thin scrollbar (.nav-scroll) - all links discoverable.
Shell fully tokenized - remap layer is a safety net.
'@
  [System.IO.File]::AppendAllText($dp, $s38, (New-Object System.Text.UTF8Encoding $true))
}
if (-not $dtxt.Contains('DEC-039')) {
  $s39 = @'

## 10. Sidebar IA rebuild (DEC-039)
Grouped sections adopted: Home [Dashboard] / Operations [Students, Teachers, Courses, Groups,
Attendance, Finance, Certificates] / Quick access [Analytics(soon), Reports, AI] /
Admin [Users, Settings, Subscription, Audit log(soon)]. Subscription pill, live topbar date
(hydration-safe). Shell.tsx REBUILT completely (lesson 35).

### Addendum
Sidebar footer (user card + logout) removed per owner - identity lives in topbar;
logout moved to topbar icon button (function preserved, duplication removed).
'@
  [System.IO.File]::AppendAllText($dp, $s39, (New-Object System.Text.UTF8Encoding $true))
  Write-Host "DESIGN.md: DEC-038/039 appended" -ForegroundColor Green
}

# ============ stage + GATE + commit + push ============
 $allow = @('app/globals.css','components/Shell.tsx','app/dashboard/page.tsx','DESIGN.md',
  'tools/u-clean2.ps1','tools/u-sidebar-clean.ps1','tools/u-ship9.ps1','tools/u-close2.ps1','tools/u-close.ps1',
  'tools/u-mofeed3.ps1','tools/u-mofeed2.ps1','tools/u-mofeed.ps1')
foreach ($p in $allow) { if (Test-Path $p) { git add -- $p } }
 $staged = @(git diff --cached --name-only)
Write-Host ("staged: " + $staged.Count)
 $staged | ForEach-Object { Write-Host ("  + " + $_) }
if ($staged.Count -lt 5) { throw "staged too few" }

& powershell -ExecutionPolicy Bypass -File tools\pre-push.ps1
if ($LASTEXITCODE -ne 0) { Write-Host "GATE RED - nothing committed." -ForegroundColor Red; exit 1 }

git commit -m "feat(u): night neon + grouped sidebar IA + subscription pill + topbar date/logout, footer removed, accent fix (DEC-038/039)"
if ($LASTEXITCODE -ne 0) { throw "commit failed" }
git push -u origin main
if ($LASTEXITCODE -ne 0) { throw "push failed" }
Write-Host "SCOPE U SHIPPED COMPLETE - live in 2-3 min." -ForegroundColor Green
Write-Host "VERIFY: sidebar grouped + footer gone + topbar logout icon + subscription pill + date + module cards + amber CTA"