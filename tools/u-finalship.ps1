# ============================================================
# u-finalship.ps1 - FINAL CLOSER for Scope U (all-in-one)
# 1) commit gate v5 + all session tools (staged-only commit)
# 2) Shell footer removal + topbar logout icon (guarded)
# 3) tsc + build (stderr-safe) + DESIGN GATE (exit code)
# 4) stage whitelist -> GATE v5 -> commit -> push
# Run: powershell -ExecutionPolicy Bypass -File tools\u-finalship.ps1
# ============================================================

 $ErrorActionPreference = "Stop"
[Console]::OutputEncoding = New-Object System.Text.UTF8Encoding($false)
Write-Host "=== U-FINALSHIP ===" -ForegroundColor Cyan

if ($PWD.Path -ne "E:\projects\training-center-saas-fixed2\training-center-saas-final\markazak-saas") { throw ("WRONG LOCATION: " + $PWD.Path) }
 $strict = New-Object System.Text.UTF8Encoding($false, $true)
function From-Codes { param([int[]]$Codes) (-join ($Codes | ForEach-Object { [char]$_ })) }

 $st0 = @(git status --porcelain)
 $bad = @()
foreach ($line in $st0) {
  $st = $line.Substring(0,2); $p = $line.Substring(3)
  if (($st -eq 'M ') -or ($st -eq ' M')) { if ($p -like 'app/*' -or $p -like 'components/*' -or $p -like 'tools/*' -or $p -eq 'DESIGN.md') { continue } }
  if ($st -eq '??') { if ($p -like 'tools/*' -or $p -like '.impeccable*' -or $p -like '.codex*' -or $p -like '.gemini*') { continue } }
  $bad += $line
}
if ($bad.Count -gt 0) { throw ("unexpected tree state: " + ($bad -join " | ")) }
Write-Host "tree guard: OK (all changes are scope files/tools)" -ForegroundColor Green

# ---------- 1. commit tools + gate v5 ----------
git add -- tools
 $ts = @(git diff --cached --name-only)
if ($ts.Count -gt 0) {
  git commit -m "tools: pre-push gate v5 (byte audit + stderr-safe tsc/build + self-location) + session scripts"
  if ($LASTEXITCODE -ne 0) { throw "tools commit failed" }
  Write-Host ("tools committed: " + $ts.Count + " files") -ForegroundColor Green
}

# ---------- 2. Shell edits (footer out, topbar logout in) ----------
 $sf = 'components\Shell.tsx'
 $sb = [System.IO.File]::ReadAllBytes($sf)
 $sbom = ($sb.Length -ge 3 -and $sb[0] -eq 239 -and $sb[1] -eq 187 -and $sb[2] -eq 191)
 $slines = [System.IO.File]::ReadAllLines($sf)

 $anchor = '          <div className="mt-auto pt-4 border-t border-[color:var(--border)]">'
 $hits = 0; $iF = -1
for ($k = 0; $k -lt $slines.Count; $k++) { if ($slines[$k] -ceq $anchor) { $hits++; $iF = $k } }
if ($hits -eq 1) {
  $iA = -1
  for ($k = $iF + 1; $k -lt $slines.Count; $k++) { if ($slines[$k] -ceq '      </aside>') { $iA = $k; break } }
  if ($iA -lt 0 -or (($iA - $iF) -gt 40)) { throw "aside close not found near footer" }
  if ($slines[$iA - 1] -cne '        </div>') { throw ("pre-aside unexpected: [" + $slines[$iA-1] + "]") }
  Write-Host ("footer out: lines " + ($iF+1) + ".." + ($iA-1))
  $newLines = @()
  if ($iF -gt 0) { $newLines += $slines[0..($iF-1)] }
  $newLines += $slines[($iA-1)..($slines.Count-1)]
  $slines = $newLines
} elseif ($hits -eq 0) { Write-Host "footer: already removed (skip)" -ForegroundColor Yellow }
else { throw ("footer hits=" + $hits) }

 $divA = '            <div className="h-8 w-[1px] bg-[color:var(--border-strong)] mx-1"></div>'
 $h2 = 0; $iD = -1
for ($k = 0; $k -lt $slines.Count; $k++) { if ($slines[$k] -ceq $divA) { $h2++; $iD = $k } }
 $titleAr = From-Codes @(0x062A,0x0633,0x062C,0x064A,0x0644,0x20,0x0627,0x0644,0x062E,0x0631,0x0648,0x062C)
 $hasBtn = $false
foreach ($l in $slines) { if ($l.Contains('title="' + $titleAr + '"')) { $hasBtn = $true } }
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
  Write-Host "topbar logout: added" -ForegroundColor Green
} elseif ($hasBtn) { Write-Host "topbar logout: already present (skip)" -ForegroundColor Yellow }
else { throw ("divider hits=" + $h2 + " and no logout button") }

 $sout = ($slines -join [string][char]10)
[System.IO.File]::WriteAllText($sf, $sout, (New-Object System.Text.UTF8Encoding($sbom)))
 $snb = [System.IO.File]::ReadAllBytes($sf)
 $null = $strict.GetString($snb)
 $snbom = ($snb.Length -ge 3 -and $snb[0] -eq 239 -and $snb[1] -eq 187 -and $snb[2] -eq 191)
if ($snbom -ne $sbom) { throw "Shell BOM changed" }

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

# ---------- 3. dashboard + globals verify ----------
 $dt = [System.IO.File]::ReadAllText('app\dashboard\page.tsx')
if (([regex]::Matches($dt, 'card\.accent')).Count -ne 0) { throw "card.accent present" }
if (([regex]::Matches($dt, [regex]::Escape("accent: '"))).Count -ne 4) { throw "accents != 4" }
 $gt = [System.IO.File]::ReadAllText('app\globals.css')
if (([regex]::Matches($gt, [regex]::Escape('#fcd34d'))).Count -lt 1) { throw "amber CTA missing" }
if (([regex]::Matches($gt, [regex]::Escape('.nav-scroll::-webkit-scrollbar'))).Count -lt 1) { throw "nav-scroll missing" }
Write-Host "dashboard + globals verify OK" -ForegroundColor Green

# ---------- 4. tsc + build (stderr-safe) ----------
Write-Host "--- tsc ---" -ForegroundColor Cyan
 $prevEap = $ErrorActionPreference
 $ErrorActionPreference = "Continue"
& npx tsc --noEmit 2>&1 | Select-Object -First 20
 $tscCode = $LASTEXITCODE
 $ErrorActionPreference = $prevEap
if ($tscCode -ne 0) { throw "tsc RED" }
Write-Host "tsc: GREEN" -ForegroundColor Green
Write-Host "--- build ---" -ForegroundColor Cyan
 $bl = Join-Path $env:TEMP "markazak-ufs-build.log"
 $prevEap = $ErrorActionPreference
 $ErrorActionPreference = "Continue"
& npm run build 2>&1 | Out-File -FilePath $bl -Encoding utf8
 $buildCode = $LASTEXITCODE
 $ErrorActionPreference = $prevEap
if ($buildCode -ne 0) { Get-Content $bl | Select-Object -Last 25; throw ("build RED (" + $buildCode + ")") }
Write-Host "build: GREEN" -ForegroundColor Green

# ---------- 5. DESIGN GATE (exit code) ----------
 $yesFile = Join-Path $env:TEMP "imp-yes.txt"
 $d4 = Join-Path $env:TEMP "imp-fs.out"; $e4 = Join-Path $env:TEMP "imp-fs.err"
foreach ($x in @($yesFile, $d4, $e4)) { if (Test-Path $x) { Remove-Item $x -Force } }
[System.IO.File]::WriteAllText($yesFile, "y" + [char]13 + [char]10, (New-Object System.Text.ASCIIEncoding))
 $proc = Start-Process -FilePath "cmd.exe" -ArgumentList "/c npx impeccable detect app components" -RedirectStandardInput $yesFile -RedirectStandardOutput $d4 -RedirectStandardError $e4 -NoNewWindow -Wait -PassThru
foreach ($pair in @(@("STDOUT", $d4), @("STDERR", $e4))) {
  if (Test-Path $pair[1]) { $cc = [System.IO.File]::ReadAllText($pair[1]); if ($cc.Trim().Length -gt 0) { Write-Host ("--- " + $pair[0] + " ---"); $cc -split "`n" | ForEach-Object { $l = $_.TrimEnd(); if ($l -ne '') { Write-Host ("  " + $l) } } } }
}
if ($proc.ExitCode -eq 0) { Write-Host "DESIGN GATE: CLEAN (exit 0)" -ForegroundColor Green }
elseif ($proc.ExitCode -eq 2) { throw "DESIGN GATE findings (exit 2) - see above. Nothing committed." }
else { throw ("DESIGN GATE unexpected exit " + $proc.ExitCode) }

# ---------- 6. DESIGN.md ----------
 $dp = Join-Path $PWD "DESIGN.md"
 $dtxt = [System.IO.File]::ReadAllText($dp)
if (-not $dtxt.Contains('DEC-038')) {
  $s38 = @'

## 9. Night Neon (DEC-038)
El-Mofeed language adopted (not copied): amber CTA gradient (#fcd34d -> #f59e0b, dark text),
per-module card accents (translucent fill + colored border) on dashboard bento,
sidebar compact + visible thin scrollbar (.nav-scroll) - all links discoverable.
Shell fully tokenized; remap layer is a safety net.
'@
  [System.IO.File]::AppendAllText($dp, $s38, (New-Object System.Text.UTF8Encoding $true))
}
if (-not $dtxt.Contains('DEC-039')) {
  $s39 = @'

## 10. Sidebar IA rebuild (DEC-039)
Grouped sections: Home [Dashboard] / Operations [Students, Teachers, Courses, Groups,
Attendance, Finance, Certificates] / Quick access [Analytics(soon), Reports, AI] /
Admin [Users, Settings, Subscription, Audit log(soon)]. Subscription pill + live topbar date.
Shell.tsx REBUILT (lesson 35).

### Addendum
Sidebar footer removed per owner; logout moved to topbar icon (function preserved).
'@
  [System.IO.File]::AppendAllText($dp, $s39, (New-Object System.Text.UTF8Encoding $true))
  Write-Host "DESIGN.md: DEC-038/039 documented" -ForegroundColor Green
}

# ---------- 7. stage + GATE v5 + commit + push ----------
 $allow = @('app/globals.css','components/Shell.tsx','app/dashboard/page.tsx','DESIGN.md','tools/u-finalship.ps1')
foreach ($p in $allow) { if (Test-Path $p) { git add -- $p } }
 $staged = @(git diff --cached --name-only)
Write-Host ("staged: " + $staged.Count)
 $staged | ForEach-Object { Write-Host ("  + " + $_) }
if ($staged.Count -lt 2) { throw "staged too few" }

Write-Host "--- MANDATORY GATE v5 ---" -ForegroundColor Cyan
& powershell -ExecutionPolicy Bypass -File tools\pre-push.ps1
if ($LASTEXITCODE -ne 0) { Write-Host "GATE RED - nothing committed." -ForegroundColor Red; exit 1 }

git commit -m "feat(u): night neon + grouped sidebar IA + subscription pill + topbar date/logout, footer removed (DEC-038/039)"
if ($LASTEXITCODE -ne 0) { throw "commit failed" }
git push -u origin main
if ($LASTEXITCODE -ne 0) { throw "push failed" }
Write-Host "SCOPE U SHIPPED COMPLETE - live in 2-3 min." -ForegroundColor Green
Write-Host "VERIFY: sidebar grouped + footer gone + topbar logout icon + subscription pill + date + module cards + amber CTA"