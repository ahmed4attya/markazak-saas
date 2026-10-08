# ============================================================
# u-sidebar-clean.ps1 - remove sidebar footer (user card + logout),
# add logout icon to topbar (function preserved), then full ship:
# tsc + build + detect(exit code) + GATE + commit + push
# Run: powershell -ExecutionPolicy Bypass -File tools\u-sidebar-clean.ps1
# ============================================================

 $ErrorActionPreference = "Stop"
[Console]::OutputEncoding = New-Object System.Text.UTF8Encoding($false)
Write-Host "=== U-SIDEBAR-CLEAN ===" -ForegroundColor Cyan

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

# ============ Shell.tsx surgical edits ============
 $sf = 'components\Shell.tsx'
 $sb = [System.IO.File]::ReadAllBytes($sf)
 $sbom = ($sb.Length -ge 3 -and $sb[0] -eq 239 -and $sb[1] -eq 187 -and $sb[2] -eq 191)
 $sraw = [System.IO.File]::ReadAllText($sf)
 $seol = [string][char]10
if ($sraw.Contains([char]13)) { $seol = [string][char]13 + [string][char]10 }
 $sendNl = $sraw.EndsWith($seol)
 $slines = [System.IO.File]::ReadAllLines($sf)
 $before = $slines.Count

# ---- E1: remove sidebar footer block (12 lines from anchor) ----
 $anchor = '          <div className="mt-auto pt-4 border-t border-[color:var(--border)]">'
 $hits = 0; $iF = -1
for ($k = 0; $k -lt $slines.Count; $k++) { if ($slines[$k] -ceq $anchor) { $hits++; $iF = $k } }
if ($hits -eq 1) {
  if (($iF + 11) -ge $slines.Count) { throw "footer extends past file" }
  if ($slines[$iF + 11] -cne '          </div>') { throw ("footer close line unexpected: [" + $slines[$iF + 11] + "]") }
  Write-Host ("removing sidebar footer: lines " + ($iF+1) + ".." + ($iF+12))
  $newLines = @()
  if ($iF -gt 0) { $newLines += $slines[0..($iF-1)] }
  if (($iF + 12) -le ($slines.Count - 1)) { $newLines += $slines[($iF+12)..($slines.Count-1)] }
  $slines = $newLines
} elseif ($hits -eq 0) {
  Write-Host "footer already removed (skip)" -ForegroundColor Yellow
} else { throw ("footer anchor hits=" + $hits) }

# ---- E2: add logout icon button in topbar (after divider) ----
 $divA = '            <div className="h-8 w-[1px] bg-[color:var(--border-strong)] mx-1"></div>'
 $h2 = 0; $iD = -1
for ($k = 0; $k -lt $slines.Count; $k++) { if ($slines[$k] -ceq $divA) { $h2++; $iD = $k } }
if ($h2 -eq 1) {
  $btn = @(
    '            <button',
    '              onClick={logout}',
    '              title="تسجيل الخروج"',
    '              className="p-2 text-[color:var(--muted)] hover:text-[color:var(--danger)] hover:bg-[color:var(--danger-soft)] rounded-full transition-colors"',
    '            >',
    '              <LogOut size={18} />',
    '            </button>'
  )
  $slines = $slines[0..$iD] + $btn + $slines[($iD+1)..($slines.Count-1)]
  Write-Host "topbar logout button: added" -ForegroundColor Green
} elseif ($h2 -eq 0 -and $sraw.Contains('title="تسجيل الخروج"')) {
  Write-Host "topbar logout button: already present (skip)" -ForegroundColor Yellow
} else { throw ("divider anchor hits=" + $h2) }

# ---- save ----
 $sout = ($slines -join $seol)
if ($sendNl) { $sout += $seol }
[System.IO.File]::WriteAllText($sf, $sout, (New-Object System.Text.UTF8Encoding($sbom)))
 $snb = [System.IO.File]::ReadAllBytes($sf)
 $null = $strict.GetString($snb)
 $snbom = ($snb.Length -ge 3 -and $snb[0] -eq 239 -and $snb[1] -eq 187 -and $snb[2] -eq 191)
if ($snbom -ne $sbom) { throw "BOM state changed" }

# ---- verify from disk (measured) ----
 $stx = [System.IO.File]::ReadAllText($sf)
function V1 { param([string]$text, [string]$needle, [int]$want)
  $g = ([regex]::Matches($text, [regex]::Escape($needle))).Count
  if ($g -ne $want) { throw ("needle [" + $needle + "]: got=" + $g + " want=" + $want) }
}
V1 $stx 'مالك المركز' 0
V1 $stx 'تسجيل الخروج' 1
V1 $stx 'mt-auto pt-4' 0
V1 $stx 'onClick={logout}' 1
V1 $stx 'text-[color:var(--gold)]' 4
V1 $stx 'bg-[color:var(--gold)]' 2
V1 $stx 'bg-[color:var(--gold-soft)]' 2
V1 $stx 'nav-scroll' 1
V1 $stx 'soon:analytics' 1
V1 $stx 'soon:audit' 1
 $after = ([System.IO.File]::ReadAllLines($sf)).Count
Write-Host ("lines: " + $before + " -> " + $after)
Write-Host "Shell verify: footer gone, topbar logout in, gold counts measured (4/2/2)" -ForegroundColor Green

# ============ dashboard verify (already fixed) ============
 $dt = [System.IO.File]::ReadAllText('app\dashboard\page.tsx')
if (([regex]::Matches($dt, 'card\.accent')).Count -ne 0) { throw "card.accent present" }
if (([regex]::Matches($dt, [regex]::Escape("accent: '"))).Count -ne 4) { throw "accents != 4" }
Write-Host "dashboard verify OK" -ForegroundColor Green

# ============ globals verify ============
 $gt = [System.IO.File]::ReadAllText('app\globals.css')
if (([regex]::Matches($gt, [regex]::Escape('#fcd34d'))).Count -lt 1) { throw "amber CTA missing" }
if (([regex]::Matches($gt, [regex]::Escape('.nav-scroll::-webkit-scrollbar'))).Count -lt 1) { throw "nav-scroll css missing" }
Write-Host "globals verify OK" -ForegroundColor Green

# ============ tsc + build ============
& npx tsc --noEmit 2>&1 | Select-Object -First 20
if ($LASTEXITCODE -ne 0) { throw "tsc RED - paste output" }
Write-Host "tsc: GREEN" -ForegroundColor Green
 $bl = Join-Path $env:TEMP "markazak-usc-build.log"
& npm run build 2>&1 | Out-File -FilePath $bl -Encoding utf8
if ($LASTEXITCODE -ne 0) { Get-Content $bl | Select-Object -Last 25; throw "build RED" }
Write-Host "build: GREEN" -ForegroundColor Green

# ============ DESIGN GATE (exit code) ============
 $yesFile = Join-Path $env:TEMP "imp-yes.txt"
 $d4 = Join-Path $env:TEMP "imp-sc.out"; $e4 = Join-Path $env:TEMP "imp-sc.err"
foreach ($x in @($yesFile, $d4, $e4)) { if (Test-Path $x) { Remove-Item $x -Force } }
[System.IO.File]::WriteAllText($yesFile, "y" + [char]13 + [char]10, (New-Object System.Text.ASCIIEncoding))
 $proc = Start-Process -FilePath "cmd.exe" -ArgumentList "/c npx impeccable detect app components" -RedirectStandardInput $yesFile -RedirectStandardOutput $d4 -RedirectStandardError $e4 -NoNewWindow -Wait -PassThru
foreach ($pair in @(@("STDOUT", $d4), @("STDERR", $e4))) {
  if (Test-Path $pair[1]) { $cc = [System.IO.File]::ReadAllText($pair[1]); if ($cc.Trim().Length -gt 0) { Write-Host ("--- " + $pair[0] + " ---"); $cc -split "`n" | ForEach-Object { $l = $_.TrimEnd(); if ($l -ne '') { Write-Host ("  " + $l) } } } }
}
if ($proc.ExitCode -eq 0) { Write-Host "DESIGN GATE: CLEAN (exit 0)" -ForegroundColor Green }
elseif ($proc.ExitCode -eq 2) { throw "DESIGN GATE findings (exit 2) - see above. Nothing committed." }
else { throw ("DESIGN GATE unexpected exit " + $proc.ExitCode) }

# ============ DESIGN.md note (DEC-039 addendum) ============
 $dp = Join-Path $PWD "DESIGN.md"
 $dtxt = [System.IO.File]::ReadAllText($dp)
if (-not $dtxt.Contains('logout moved to topbar')) {
  $sec = @'

### DEC-039 addendum
Sidebar footer (user card + logout) removed per owner - user identity lives in topbar;
logout moved to a topbar icon button (function preserved, duplication removed).
'@
  [System.IO.File]::AppendAllText($dp, $sec, (New-Object System.Text.UTF8Encoding $true))
  Write-Host "DESIGN.md: addendum appended" -ForegroundColor Green
}

# ============ stage + GATE + commit + push ============
 $allow = @('app/globals.css','components/Shell.tsx','app/dashboard/page.tsx','DESIGN.md','tools/u-sidebar-clean.ps1','tools/u-ship9.ps1','tools/u-close2.ps1','tools/u-close.ps1','tools/u-mofeed3.ps1','tools/u-mofeed2.ps1','tools/u-mofeed.ps1')
foreach ($p in $allow) { if (Test-Path $p) { git add -- $p } }
 $staged = @(git diff --cached --name-only)
Write-Host ("staged: " + $staged.Count)
 $staged | ForEach-Object { Write-Host ("  + " + $_) }
if ($staged.Count -lt 3) { throw "staged too few" }

& powershell -ExecutionPolicy Bypass -File tools\pre-push.ps1
if ($LASTEXITCODE -ne 0) { Write-Host "GATE RED - nothing committed." -ForegroundColor Red; exit 1 }

git commit -m "feat(u): sidebar footer removed (dup), logout moved to topbar icon, ship theme scope (DEC-039 addendum)"
if ($LASTEXITCODE -ne 0) { throw "commit failed" }
git push -u origin main
if ($LASTEXITCODE -ne 0) { throw "push failed" }
Write-Host "SHIPPED - live in 2-3 min." -ForegroundColor Green
Write-Host "VERIFY: sidebar ends with nav (no footer card) - logout icon in topbar next to avatar"