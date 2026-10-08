# ============================================================
# u-mofeed.ps1 - DEC-038: El-Mofeed visual language + sidebar fix
# 1) Shell.tsx: full tokenization + compact nav + VISIBLE scrollbar
# 2) globals.css: vibrant amber CTA + .nav-scroll styles
# 3) dashboard: per-module accent cards (blue/green/amber/indigo)
# 4) tsc + build + detect(exit code) + GATE + commit + push
# Run: powershell -ExecutionPolicy Bypass -File tools\u-mofeed.ps1
# ============================================================

 $ErrorActionPreference = "Stop"
[Console]::OutputEncoding = New-Object System.Text.UTF8Encoding($false)
Write-Host "=== U-MOFEED (DEC-038) ===" -ForegroundColor Cyan

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

function Edit-Text { param([string]$path, [object[]]$rules)
  $b = [System.IO.File]::ReadAllBytes($path)
  $bom = ($b.Length -ge 3 -and $b[0] -eq 239 -and $b[1] -eq 187 -and $b[2] -eq 191)
  $txt = [System.IO.File]::ReadAllText($path)
  foreach ($r in $rules) {
    $c = ([regex]::Matches($txt, [regex]::Escape($r.o))).Count
    if ($c -ne $r.c) { throw ("[" + $path + "] needle [" + $r.o + "]: got=" + $c + " want=" + $r.c) }
    $txt = $txt.Replace($r.o, $r.n)
  }
  [System.IO.File]::WriteAllText($path, $txt, (New-Object System.Text.UTF8Encoding($bom)))
  $nb = [System.IO.File]::ReadAllBytes($path)
  $null = $strict.GetString($nb)
  $nbom = ($nb.Length -ge 3 -and $nb[0] -eq 239 -and $nb[1] -eq 187 -and $nb[2] -eq 191)
  if ($nbom -ne $bom) { throw ("BOM changed: " + $path) }
  return $txt
}

# ============ 1. Shell.tsx ============
Write-Host "--- Shell.tsx: tokenize + compact + visible scrollbar ---"
 $shellRules = @(
  @{o='bg-[#f8fafc] text-slate-900'; n='bg-[color:var(--bg)] text-[color:var(--text)]'; c=1},
  @{o='w-72 bg-white border-l border-slate-200'; n='w-72 bg-[color:var(--surface)] border-l border-[color:var(--border)]'; c=1},
  @{o='flex flex-col h-full p-6'; n='flex flex-col h-full p-5'; c=1},
  @{o='flex items-center gap-3 mb-8'; n='flex items-center gap-3 mb-5'; c=1},
  @{o='rounded-xl bg-gradient-to-br from-blue-600 to-emerald-500 text-white flex items-center justify-center text-xl font-bold shadow-lg shadow-blue-200'; n='rounded-xl bg-gradient-to-br from-[#f2d38b] to-[#d9a83f] text-[#1a2440] flex items-center justify-center text-xl font-bold shadow-[0_10px_26px_rgba(231,193,104,0.3)]'; c=1},
  @{o='text-lg font-bold text-slate-800 leading-tight'; n='text-lg font-bold text-[color:var(--text)] leading-tight'; c=1},
  @{o='text-[10px] text-slate-400 font-medium uppercase tracking-wider'; n='text-[10px] text-[color:var(--muted)] font-medium uppercase tracking-wider'; c=1},
  @{o='p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 text-xs font-medium mb-6 cursor-pointer hover:bg-slate-100'; n='p-3 rounded-xl bg-[color:var(--surface-2)] border border-[color:var(--border)] text-[color:var(--text-soft)] text-xs font-medium mb-4 cursor-pointer hover:bg-[color:var(--surface-3)]'; c=1},
  @{o='flex-1 space-y-6 overflow-y-auto no-scrollbar'; n='flex-1 space-y-4 overflow-y-auto nav-scroll'; c=1},
  @{o='text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3 px-3'; n='text-[11px] font-bold text-[color:var(--muted-dim)] uppercase tracking-widest mb-3 px-3'; c=2},
  @{o='px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group'; n='px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 group'; c=2},
  @{o=': "text-slate-500 hover:bg-slate-50 hover:text-slate-800"'; n=': "text-[color:var(--muted)] hover:bg-[color:var(--surface-2)] hover:text-[color:var(--text)]"'; c=2},
  @{o='mt-auto pt-6 border-t border-slate-100'; n='mt-auto pt-4 border-t border-[color:var(--border)]'; c=1},
  @{o='rounded-xl bg-slate-50 border border-slate-100 mb-4'; n='rounded-xl bg-[color:var(--surface-2)] border border-[color:var(--border)] mb-3'; c=1},
  @{o='w-9 h-9 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm'; n='w-9 h-9 rounded-lg bg-[color:var(--gold-soft)] text-[color:var(--gold)] flex items-center justify-center font-bold text-sm'; c=1},
  @{o='text-xs font-bold text-slate-700 truncate'; n='text-xs font-bold text-[color:var(--text-soft)] truncate'; c=1},
  @{o='text-[10px] text-slate-400 truncate'; n='text-[10px] text-[color:var(--muted)] truncate'; c=1},
  @{o='h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 sticky'; n='h-16 bg-[rgba(18,27,49,0.85)] backdrop-blur-md border-b border-[color:var(--border)] sticky'; c=1},
  @{o='p-2 text-slate-500 hover:bg-slate-100 rounded-lg'; n='p-2 text-[color:var(--muted)] hover:bg-[color:var(--surface-2)] rounded-lg'; c=1},
  @{o='text-slate-400 group-focus-within:text-blue-500'; n='text-[color:var(--muted-dim)] group-focus-within:text-[color:var(--gold)]'; c=1},
  @{o='bg-slate-100 border-none rounded-full py-2 pr-10 pl-4 text-sm w-64 lg:w-96 focus:ring-2 focus:ring-blue-500/20 focus:bg-white'; n='bg-[color:var(--surface-2)] border border-[color:var(--border)] rounded-full py-2 pr-10 pl-4 text-sm w-64 lg:w-96 focus:ring-2 focus:ring-[rgba(91,155,255,0.25)] focus:bg-[color:var(--surface-3)]'; c=1},
  @{o='p-2 text-slate-500 hover:bg-slate-100 rounded-full relative'; n='p-2 text-[color:var(--muted)] hover:bg-[color:var(--surface-2)] rounded-full relative'; c=1},
  @{o='bg-red-500 rounded-full border-2 border-white'; n='bg-red-500 rounded-full border-2 border-[color:var(--surface)]'; c=1},
  @{o='h-8 w-[1px] bg-slate-200'; n='h-8 w-[1px] bg-[color:var(--border-strong)]'; c=1},
  @{o='text-xs font-bold text-slate-700">'; n='text-xs font-bold text-[color:var(--text-soft)]">'; c=1},
  @{o='text-[10px] text-slate-400">'; n='text-[10px] text-[color:var(--muted)]">'; c=1},
  @{o='w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm'; n='w-9 h-9 rounded-full bg-[color:var(--gold)] text-[#1a2440] flex items-center justify-center font-bold text-sm'; c=1},
  @{o='text-2xl lg:text-3xl font-bold text-slate-800 leading-tight'; n='text-2xl lg:text-3xl font-bold text-[color:var(--text)] leading-tight'; c=1},
  @{o='text-slate-500 text-sm mt-1'; n='text-[color:var(--muted)] text-sm mt-1'; c=1},
  @{o='Building2 size={16} className="text-slate-400"'; n='Building2 size={16} className="text-[color:var(--muted-dim)]"'; c=1},
  @{o='bg-slate-900/20 backdrop-blur-sm'; n='bg-[rgba(2,6,16,0.5)] backdrop-blur-sm'; c=1}
)
 $stx = Edit-Text 'components\Shell.tsx' $shellRules
 $absent = @('bg-white','bg-slate-50','bg-slate-100','bg-slate-200','bg-[#f8fafc]','border-slate-200','border-slate-100','text-slate-800','text-slate-700','text-slate-600','text-slate-500','text-slate-400','text-slate-900','no-scrollbar','from-blue-600','shadow-blue-200','bg-blue-100','bg-blue-600','focus:ring-blue-500/20','group-focus-within:text-blue-500','border-white','hover:bg-slate-50','hover:bg-slate-100','hover:text-slate-800','py-2.5','mb-8','space-y-6','text-white')
foreach ($a in $absent) {
  $c = ([regex]::Matches($stx, [regex]::Escape($a))).Count
  if ($c -ne 0) { throw ("Shell still contains [" + $a + "] x" + $c) }
}
foreach ($p in @('nav-scroll','var(--gold-soft)','var(--muted)','var(--surface-2)','var(--border)')) {
  if (([regex]::Matches($stx, [regex]::Escape($p))).Count -lt 1) { throw ("Shell missing: " + $p) }
}
if (([regex]::Matches($stx, [regex]::Escape('text-[color:var(--gold)]'))).Count -ne 4) { throw "Shell gold != 4" }
Write-Host "Shell: tokenized + compact + nav-scroll  (0 legacy classes remain)" -ForegroundColor Green

# ============ 2. globals.css ============
Write-Host "--- globals.css: vibrant CTA + nav-scroll css ---"
 $gRules = @(
  @{o='--gold-cta: linear-gradient(135deg, #f2d38b, #e7c168);'; n='--gold-cta: linear-gradient(135deg, #fcd34d, #f59e0b);'; c=1}
)
 $null = Edit-Text 'app\globals.css' $gRules
 $nav = @'

/* Sidebar nav: visible thin scrollbar (all links discoverable) */
.nav-scroll::-webkit-scrollbar {
  width: 6px;
}
.nav-scroll::-webkit-scrollbar-thumb {
  background: var(--border-strong);
  border-radius: 6px;
}
.nav-scroll::-webkit-scrollbar-track {
  background: transparent;
}
.nav-scroll {
  scrollbar-width: thin;
  scrollbar-color: var(--border-strong) transparent;
}
'@
 $gp = Join-Path $PWD "app\globals.css"
 $gtxt = [System.IO.File]::ReadAllText($gp)
if ($gtxt.Contains('.nav-scroll::-webkit-scrollbar')) { Write-Host "nav-scroll css already present" -ForegroundColor Yellow }
else {
  $gb = [System.IO.File]::ReadAllBytes($gp)
  $gbom = ($gb.Length -ge 3 -and $gb[0] -eq 239 -and $gb[1] -eq 187 -and $gb[2] -eq 191)
  [System.IO.File]::AppendAllText($gp, $nav, (New-Object System.Text.UTF8Encoding($gbom)))
  Write-Host "nav-scroll css appended" -ForegroundColor Green
}

# ============ 3. dashboard: per-module accent cards ============
Write-Host "--- dashboard: module-colored bento cards ---"
 $dRules = @(
  @{o='className="bento-card group flex items-center justify-between"'; n='className={cn("bento-card group flex items-center justify-between", card.accent)}'; c=1},
  @{o='{cards.map(({ name, value, Icon, href, color }, i) => ('; n='{cards.map(({ name, value, Icon, href, color, accent }, i) => ('; c=1},
  @{o="href: '/students', color: 'bg-blue-500' }"; n="href: '/students', color: 'bg-blue-500', accent: 'border-[color:var(--blue-border)] bg-[color:var(--blue-soft)]' }"; c=1},
  @{o="href: '/teachers', color: 'bg-emerald-500' }"; n="href: '/teachers', color: 'bg-emerald-500', accent: 'border-[color:var(--success-border)] bg-[color:var(--success-soft)]' }"; c=1},
  @{o="href: '/courses', color: 'bg-amber-500' }"; n="href: '/courses', color: 'bg-amber-500', accent: 'border-[color:var(--warning-border)] bg-[color:var(--warning-soft)]' }"; c=1},
  @{o="href: '/groups', color: 'bg-indigo-500' }"; n="href: '/groups', color: 'bg-indigo-500', accent: 'border-[color:var(--indigo-border)] bg-[color:var(--indigo-soft)]' }"; c=1},
  @{o='text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-lg shadow-blue-200'; n='text-[#1a2440] bg-[image:var(--gold-cta)] hover:opacity-90 rounded-xl transition-all shadow-[0_8px_20px_rgba(231,193,104,0.25)]'; c=1}
)
 $null = Edit-Text 'app\dashboard\page.tsx' $dRules
 $dt2 = [System.IO.File]::ReadAllText('app\dashboard\page.tsx')
if (([regex]::Matches($dt2, [regex]::Escape('accent: '''))).Count -ne 4) { throw "dashboard accents != 4" }
if (([regex]::Matches($dt2, [regex]::Escape('card.accent'))).Count -ne 1) { throw "card.accent binding missing" }
Write-Host "dashboard: 4 module accents + gold CTA verified" -ForegroundColor Green

# ============ 4. tsc + build ============
Write-Host "--- tsc ---"
& npx tsc --noEmit 2>&1 | Select-Object -First 20
if ($LASTEXITCODE -ne 0) { throw "tsc RED - paste output" }
Write-Host "tsc: GREEN" -ForegroundColor Green
Write-Host "--- build ---"
 $bl = Join-Path $env:TEMP "markazak-um-build.log"
& npm run build 2>&1 | Out-File -FilePath $bl -Encoding utf8
if ($LASTEXITCODE -ne 0) { Get-Content $bl | Select-Object -Last 25; throw "build RED" }
Write-Host "build: GREEN" -ForegroundColor Green

# ============ 5. DESIGN GATE (exit code) ============
Write-Host "--- DESIGN GATE (exit-code) ---" -ForegroundColor Cyan
 $yesFile = Join-Path $env:TEMP "imp-yes.txt"
 $dt = Join-Path $env:TEMP "imp-detect.out"
 $de = Join-Path $env:TEMP "imp-detect.err"
foreach ($x in @($yesFile, $dt, $de)) { if (Test-Path $x) { Remove-Item $x -Force } }
[System.IO.File]::WriteAllText($yesFile, "y" + [char]13 + [char]10, (New-Object System.Text.ASCIIEncoding))
 $proc = Start-Process -FilePath "cmd.exe" -ArgumentList "/c npx impeccable detect app components" -RedirectStandardInput $yesFile -RedirectStandardOutput $dt -RedirectStandardError $de -NoNewWindow -Wait -PassThru
foreach ($pair in @(@("STDOUT", $dt), @("STDERR", $de))) {
  if (Test-Path $pair[1]) {
    $cc = [System.IO.File]::ReadAllText($pair[1])
    if ($cc.Trim().Length -gt 0) { Write-Host ("--- " + $pair[0] + " ---"); $cc -split "`n" | ForEach-Object { $l = $_.TrimEnd(); if ($l -ne '') { Write-Host ("  " + $l) } } }
  }
}
if ($proc.ExitCode -eq 0) { Write-Host "DESIGN GATE: CLEAN (exit 0)" -ForegroundColor Green }
elseif ($proc.ExitCode -eq 2) { Write-Host "DESIGN GATE: findings (exit 2) - see above." -ForegroundColor Red; throw "DESIGN GATE not clean - nothing committed." }
else { throw ("DESIGN GATE unexpected exit " + $proc.ExitCode + " - paste output") }

# ============ 6. DESIGN.md append (DEC-038) ============
 $dp = Join-Path $PWD "DESIGN.md"
 $dtxt2 = [System.IO.File]::ReadAllText($dp)
if (-not $dtxt2.Contains('DEC-038')) {
  $sec = @'

## 9. Night Neon evolution (DEC-038)
Owner adopted El-Mofeed visual language (adopted, not copied):
- CTA gradient: vibrant amber-orange (#fcd34d -> #f59e0b), dark text #1a2440.
- Per-module card accents on dark: students=blue, teachers=success-green, courses=amber, groups=indigo (translucent fill + colored border), applied to dashboard bento cards via card.accent.
- Sidebar: compact density + visible thin scrollbar (.nav-scroll) - all links discoverable (bug fix: fold cut + hidden scrollbar).
- Shell fully tokenized (zero legacy light classes) - remap layer is now a safety net, not a dependency.
'@
  [System.IO.File]::AppendAllText($dp, $sec, (New-Object System.Text.UTF8Encoding $true))
  Write-Host "DESIGN.md: DEC-038 appended" -ForegroundColor Green
}

# ============ 7. stage + GATE + commit + push ============
 $allow = @('app/globals.css','components/Shell.tsx','app/dashboard/page.tsx','DESIGN.md','tools/u-mofeed.ps1')
foreach ($p in $allow) { if (Test-Path $p) { git add -- $p } }
 $staged = @(git diff --cached --name-only)
Write-Host ("staged: " + $staged.Count)
 $staged | ForEach-Object { Write-Host ("  + " + $_) }
if ($staged.Count -lt 4) { throw "staged too few" }

Write-Host "--- MANDATORY GATE ---" -ForegroundColor Cyan
& powershell -ExecutionPolicy Bypass -File tools\pre-push.ps1
if ($LASTEXITCODE -ne 0) { Write-Host "GATE RED - nothing committed." -ForegroundColor Red; exit 1 }

git commit -m "feat(u): night neon - module accent cards, amber CTA, sidebar compact + visible scrollbar (bug fix), shell fully tokenized (DEC-038)"
if ($LASTEXITCODE -ne 0) { throw "commit failed" }
git push -u origin main
if ($LASTEXITCODE -ne 0) { throw "push failed" }
Write-Host "SHIPPED - night neon live in 2-3 min." -ForegroundColor Green
Write-Host "VERIFY: sidebar shows ALL links (scrollable) + colorful cards + amber CTA"