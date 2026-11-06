# ============================================================
# u-lockfix2.ps1 - FINAL (fslock root-cause edition)
# Root cause: transient filesystem lock on index.lock rename
# (AV/indexer), NOT a competing git client.
# Mitigations: GIT_OPTIONAL_LOCKS=0, long retry loop (10x/6s),
# cmd-level invocation, fsyncMethod=batch. Full ship included.
# Run: powershell -ExecutionPolicy Bypass -File tools\u-lockfix2.ps1
# ============================================================

 $ErrorActionPreference = "Stop"
[Console]::OutputEncoding = New-Object System.Text.UTF8Encoding($false)
Write-Host "=== U-LOCKFIX2 (filesystem-lock edition) ===" -ForegroundColor Cyan

if ($PWD.Path -ne "E:\projects\training-center-saas-fixed2\training-center-saas-final\markazak-saas") { throw ("WRONG LOCATION: " + $PWD.Path) }
 $strict = New-Object System.Text.UTF8Encoding($false, $true)
function From-Codes { param([int[]]$Codes) (-join ($Codes | ForEach-Object { [char]$_ })) }

 $env:GIT_OPTIONAL_LOCKS = "0"

function Invoke-GitRobust { param([string[]]$GitArgs)
  for ($i = 1; $i -le 10; $i++) {
    if (Test-Path ".git\index.lock") {
      Write-Host ("  lock present (attempt " + $i + "/10) - waiting 6s...") -ForegroundColor Yellow
      Start-Sleep -Seconds 6
    }
    & git -c core.fsyncMethod=batch @GitArgs 2>&1 | ForEach-Object { Write-Host ("  " + $_) -ForegroundColor DarkGray }
    if ($LASTEXITCODE -eq 0) { Write-Host ("  git OK [" + ($GitArgs -join ' ') + "] (attempt " + $i + ")") -ForegroundColor Green; return }
    Write-Host ("  git exit=" + $LASTEXITCODE + " (attempt " + $i + "/10)") -ForegroundColor Yellow
    Start-Sleep -Seconds 6
  }
  throw ("git failed after 10 attempts [" + ($GitArgs -join ' ') + "]")
}

# ---------- tree guard ----------
 $st0 = @(git status --porcelain)
 $bad = @()
foreach ($line in $st0) {
  $st = $line.Substring(0,2); $p = $line.Substring(3)
  if (($st -eq 'M ') -or ($st -eq ' M')) { if ($p -like 'app/*' -or $p -like 'components/*' -or $p -like 'tools/*' -or $p -eq 'DESIGN.md') { continue } }
  if ($st -eq '??') { if ($p -like 'tools/*' -or $p -like '.impeccable*' -or $p -like '.codex*' -or $p -like '.gemini*') { continue } }
  $bad += $line
}
if ($bad.Count -gt 0) { throw ("unexpected tree state: " + ($bad -join " | ")) }
Write-Host "tree guard: OK" -ForegroundColor Green

# ---------- commit tools + gate ----------
Invoke-GitRobust @("add", "--", "tools")
 $ts = @(git diff --cached --name-only)
if ($ts.Count -gt 0) {
  Invoke-GitRobust @("commit", "-m", "tools: gate v5 (byte audit + stderr-safe) + session scripts")
  Write-Host ("tools committed: " + $ts.Count + " files") -ForegroundColor Green
} else { Write-Host "tools: nothing staged (skip)" -ForegroundColor Yellow }

# ---------- Shell edits ----------
 $sf = 'components\Shell.tsx'
 $sb = [System.IO.File]::ReadAllBytes($sf)
 $sbom = ($sb.Length -ge 3 -and $sb[0] -eq 239 -and $sb[1] -eq 187 -and $sb[2] -eq 191)
 $slines = [System.IO.File]::ReadAllLines($sf)
 $titleAr = From-Codes @(0x062A,0x0633,0x062C,0x064A,0x0644,0x20,0x0627,0x0644,0x062E,0x0631,0x0648,0x062C)
 $ownerAr = From-Codes @(0x0645,0x0627,0x0644,0x0643,0x20,0x0627,0x0644,0x0645,0x0631,0x0643,0x0632)

 $iM = -1
for ($k = 0; $k -lt $slines.Count; $k++) { if ($slines[$k].Contains('mt-auto')) { $iM = $k; break } }
if ($iM -lt 0) {
  for ($k = 0; $k -lt $slines.Count; $k++) { if ($slines[$k].Contains($ownerAr)) { $iM = $k; break } }
  if ($iM -ge 0) { for ($k = $iM; $k -ge 0; $k--) { if ($slines[$k].Contains('<div')) { $iM = $k; break } } }
}
if ($iM -ge 0) {
  $iA = -1
  for ($k = $iM + 1; $k -lt $slines.Count; $k++) { if ($slines[$k].Contains('</aside>')) { $iA = $k; break } }
  if ($iA -lt 0) { throw "aside close not found" }
  if (($iA - $iM) -gt 40) { throw ("footer span too big: " + ($iA - $iM)) }
  if (-not $slines[$iA - 1].Contains('</div>')) { throw ("pre-aside unexpected: [" + $slines[$iA-1] + "]") }
  Write-Host ("footer out: lines " + ($iM+1) + ".." + ($iA-1))
  $nl = @(); if ($iM -gt 0) { $nl += $slines[0..($iM-1)] }; $nl += $slines[($iA-1)..($slines.Count-1)]; $slines = $nl
} else { Write-Host "footer: absent (verified)" -ForegroundColor Yellow }

 $hasBtn = $false
foreach ($l in $slines) { if ($l.Contains('title="' + $titleAr + '"')) { $hasBtn = $true } }
if ($hasBtn) { Write-Host "topbar logout: already present (skip)" -ForegroundColor Yellow }
else {
  $iD = -1
  for ($k = 0; $k -lt $slines.Count; $k++) { if ($slines[$k].Contains('h-8 w-[1px]')) { $iD = $k; break } }
  if ($iD -lt 0) { throw "divider not found" }
  $btn = @('            <button','              onClick={logout}',('              title="' + $titleAr + '"'),'              className="p-2 text-[color:var(--muted)] hover:text-[color:var(--danger)] hover:bg-[color:var(--danger-soft)] rounded-full transition-colors"','            >','              <LogOut size={18} />','            </button>')
  $slines = $slines[0..$iD] + $btn + $slines[($iD+1)..($slines.Count-1)]
  Write-Host "topbar logout: added" -ForegroundColor Green
}

 $seol = [string][char]10
foreach ($l in $slines) { if ($l.Contains([char]13)) { $seol = [string][char]13 + [string][char]10; break } }
[System.IO.File]::WriteAllText($sf, ($slines -join $seol), (New-Object System.Text.UTF8Encoding($sbom)))
 $snb = [System.IO.File]::ReadAllBytes($sf); $null = $strict.GetString($snb)
 $snbom = ($snb.Length -ge 3 -and $snb[0] -eq 239 -and $snb[1] -eq 187 -and $snb[2] -eq 191)
if ($snbom -ne $sbom) { throw "BOM changed" }

 $stx = [System.IO.File]::ReadAllText($sf)
function V1 { param([string]$text, [string]$needle, [int]$want)
  $g = ([regex]::Matches($text, [regex]::Escape($needle))).Count
  if ($g -ne $want) { throw ("needle [" + $needle + "]: got=" + $g + " want=" + $want) }
}
V1 $stx $ownerAr 0
V1 $stx $titleAr 1
V1 $stx 'تسجيل الخروج' 1
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
Write-Host "Shell verify: ALL OK" -ForegroundColor Green

# ---------- dashboard + globals ----------
 $dt = [System.IO.File]::ReadAllText('app\dashboard\page.tsx')
if (([regex]::Matches($dt, 'card\.accent')).Count -ne 0) { throw "card.accent present" }
if (([regex]::Matches($dt, [regex]::Escape("accent: '"))).Count -ne 4) { throw "accents != 4" }
 $gt = [System.IO.File]::ReadAllText('app\globals.css')
if (([regex]::Matches($gt, [regex]::Escape('#fcd34d'))).Count -lt 1) { throw "amber CTA missing" }
if (([regex]::Matches($gt, [regex]::Escape('.nav-scroll::-webkit-scrollbar'))).Count -lt 1) { throw "nav-scroll missing" }
Write-Host "dashboard + globals verify OK" -ForegroundColor Green

# ---------- tsc + build (stderr-safe) ----------
Write-Host "--- tsc ---" -ForegroundColor Cyan
 $prev = $ErrorActionPreference; $ErrorActionPreference = "Continue"
& npx tsc --noEmit 2>&1 | Select-Object -First 20
 $t = $LASTEXITCODE; $ErrorActionPreference = $prev
if ($t -ne 0) { throw "tsc RED" }
Write-Host "tsc: GREEN" -ForegroundColor Green
Write-Host "--- build ---" -ForegroundColor Cyan
 $bl = Join-Path $env:TEMP "markazak-ulf2-build.log"
 $prev = $ErrorActionPreference; $ErrorActionPreference = "Continue"
& npm run build 2>&1 | Out-File -FilePath $bl -Encoding utf8
 $b2 = $LASTEXITCODE; $ErrorActionPreference = $prev
if ($b2 -ne 0) { Get-Content $bl | Select-Object -Last 25; throw ("build RED (" + $b2 + ")") }
Write-Host "build: GREEN" -ForegroundColor Green

# ---------- DESIGN GATE ----------
 $yesFile = Join-Path $env:TEMP "imp-yes.txt"
 $d4 = Join-Path $env:TEMP "imp-lf2.out"; $e4 = Join-Path $env:TEMP "imp-lf2.err"
foreach ($x in @($yesFile, $d4, $e4)) { if (Test-Path $x) { Remove-Item $x -Force } }
[System.IO.File]::WriteAllText($yesFile, "y" + [char]13 + [char]10, (New-Object System.Text.ASCIIEncoding))
 $proc = Start-Process -FilePath "cmd.exe" -ArgumentList "/c npx impeccable detect app components" -RedirectStandardInput $yesFile -RedirectStandardOutput $d4 -RedirectStandardError $e4 -NoNewWindow -Wait -PassThru
foreach ($pair in @(@("STDOUT", $d4), @("STDERR", $e4))) {
  if (Test-Path $pair[1]) { $cc = [System.IO.File]::ReadAllText($pair[1]); if ($cc.Trim().Length -gt 0) { Write-Host ("--- " + $pair[0] + " ---"); $cc -split "`n" | ForEach-Object { $l = $_.TrimEnd(); if ($l -ne '') { Write-Host ("  " + $l) } } } }
}
if ($proc.ExitCode -eq 0) { Write-Host "DESIGN GATE: CLEAN (exit 0)" -ForegroundColor Green }
elseif ($proc.ExitCode -eq 2) { throw "DESIGN GATE findings (exit 2). Nothing committed." }
else { throw ("DESIGN GATE unexpected exit " + $proc.ExitCode) }

# ---------- DESIGN.md ----------
 $dp = Join-Path $PWD "DESIGN.md"
 $dtxt = [System.IO.File]::ReadAllText($dp)
if (-not $dtxt.Contains('DEC-038')) {
  [System.IO.File]::AppendAllText($dp, @'

## 9. Night Neon (DEC-038)
Amber CTA gradient (#fcd34d -> #f59e0b, dark text); per-module card accents; sidebar compact
+ visible thin scrollbar (.nav-scroll); Shell fully tokenized (remap = safety net).
'@, (New-Object System.Text.UTF8Encoding $true))
}
if (-not $dtxt.Contains('DEC-039')) {
  [System.IO.File]::AppendAllText($dp, @'

## 10. Sidebar IA rebuild (DEC-039)
Grouped sections: Home / Operations / Quick access / Admin (with Analytics + Audit log as "soon").
Subscription pill + live topbar date. Shell REBUILT (lesson 35).

### Addendum
Sidebar footer removed per owner; logout moved to topbar icon.
'@, (New-Object System.Text.UTF8Encoding $true))
  Write-Host "DESIGN.md: DEC-038/039 documented" -ForegroundColor Green
}

# ---------- stage + GATE v5 + commit + push (robust) ----------
 $allow = @('app/globals.css','components/Shell.tsx','app/dashboard/page.tsx','DESIGN.md','tools/u-lockfix2.ps1','tools/u-lockfix.ps1','tools/u-finalship.ps1','tools/u-clean2.ps1','tools/u-quickcheck.ps1','tools/u-sidebar-clean.ps1','tools/u-ship9.ps1','tools/u-close2.ps1','tools/u-close.ps1','tools/u-mofeed3.ps1','tools/u-mofeed2.ps1','tools/u-mofeed.ps1')
foreach ($p in $allow) { if (Test-Path $p) { Invoke-GitRobust @("add", "--", $p) } }
 $staged = @(git diff --cached --name-only)
Write-Host ("staged: " + $staged.Count)
 $staged | ForEach-Object { Write-Host ("  + " + $_) }
if ($staged.Count -lt 5) { throw "staged too few" }

Write-Host "--- MANDATORY GATE v5 ---" -ForegroundColor Cyan
& powershell -ExecutionPolicy Bypass -File tools\pre-push.ps1
if ($LASTEXITCODE -ne 0) { Write-Host "GATE RED - nothing committed." -ForegroundColor Red; exit 1 }

Invoke-GitRobust @("commit", "-m", "feat(u): night neon + grouped sidebar IA + subscription pill + topbar date/logout (DEC-038/039)")
Invoke-GitRobust @("push", "-u", "origin", "main")
Write-Host "SCOPE U SHIPPED COMPLETE - live in 2-3 min." -ForegroundColor Green
Write-Host "VERIFY: footer gone + topbar logout + subscription pill + date + module cards + amber CTA"