# ============================================================
# pre-push.ps1 v5 - MANDATORY GATE (final)
# Order: byte-audit -> tsc -> build -> git hygiene -> schema reminder
# v5: + mojibake byte scan (from QUDURATI pattern, adapted)
#     + stderr-safe tsc/build (lesson 45) + self-location guard
# Modes: STAGED / HEAD (unchanged) | RED = NO PUSH
# ============================================================

 $ErrorActionPreference = "Stop"
[Console]::OutputEncoding = New-Object System.Text.UTF8Encoding($false)

 $expected = "E:\projects\training-center-saas-fixed2\training-center-saas-final\markazak-saas"
if ($PWD.Path -ne $expected) {
    Write-Host ("GATE RED: wrong location - " + $PWD.Path) -ForegroundColor Red
    exit 1
}
if (-not (Test-Path "package.json")) { Write-Host "GATE RED: package.json missing." -ForegroundColor Red; exit 1 }
if (-not (Test-Path ".git")) { Write-Host "GATE RED: not a git repository." -ForegroundColor Red; exit 1 }

 $staged = @(git diff --cached --name-only 2>$null)
 $porcelain = @(git status --porcelain 2>$null)
 $mode = ""
if ($staged.Count -gt 0) { $mode = "STAGED" }
else {
    if ($porcelain.Count -gt 0) {
        Write-Host "GATE RED: nothing staged but working tree dirty." -ForegroundColor Red
        $porcelain | ForEach-Object { Write-Host ("   " + $_) -ForegroundColor Yellow }
        exit 1
    }
    $mode = "HEAD"
}
Write-Host "=============================================="
Write-Host (" PRE-PUSH GATE v5  |  Mode: " + $mode)
Write-Host "=============================================="

if ($mode -eq "STAGED") { $ns = @(git diff --cached --name-status 2>$null) }
else {
    $null = git rev-parse --verify -q origin/main 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Commits to be pushed:"
        @(git log --oneline origin/main..HEAD 2>$null) | ForEach-Object { Write-Host ("   " + $_) -ForegroundColor Gray }
        $ns = @(git diff --name-status origin/main...HEAD 2>$null)
    } else { $ns = @(git show --name-status --format="" HEAD 2>$null) }
}
 $tab = [char]9
 $names = @(); $stats = @()
foreach ($l in $ns) {
    if (-not $l -or $l.Trim() -eq "") { continue }
    $parts = $l.Split($tab)
    if ($parts.Count -lt 2) { continue }
    $names += $parts[$parts.Count - 1]; $stats += $parts[0]
}
Write-Host ("Push set: " + $names.Count + " file(s)")

# ---------- [1/5] BYTE AUDIT (mojibake) ----------
Write-Host "[1/5] Byte audit (mojibake across live sources)..." -ForegroundColor Cyan
 $dirs = @("app", "components", "lib", "tools", "scripts")
 $bad = @(); $scanned = 0
 $needleOk = [int[]]@(0x062F, 0x0648, 0x0645)          # legit Arabic sanity probe
foreach ($d in $dirs) {
    if (-not (Test-Path $d)) { continue }
    $fs = @(Get-ChildItem -Path $d -Recurse -Include *.ts,*.tsx,*.css,*.ps1 -File | Where-Object { $_.FullName -notmatch '\\(node_modules|\.next|backups|encoding-backups)\\' })
    foreach ($f in $fs) {
        $scanned++
        $b = [System.IO.File]::ReadAllBytes($f.FullName)
        $hasArabic = $false; $susp = $false
        for ($i = 0; $i -lt $b.Length; $i++) {
            $x = $b[$i]
            if ($x -eq 0xD8 -or $x -eq 0xD9) { $hasArabic = $true }                       # UTF-8 Arabic lead
            if ($x -eq 0xC2 -or $x -eq 0xC3) {                                             # latin-SS lead
                if (($i + 1) -lt $b.Length) {
                    $n = $b[$i + 1]
                    if ($n -eq 0xA7 -or $n -eq 0xB8 -or $n -eq 0xBB -or $n -eq 0xA9) { $susp = $true }  # آ§/آ¸/آ»/آ© tells
                }
            }
        }
        if ($hasArabic -and $susp) { $bad += $f.FullName.Substring($PWD.Path.Length + 1) }
    }
}
 $okProbe = $false
 $layoutBytes = [System.IO.File]::ReadAllBytes("app\layout.tsx")
for ($i = 0; $i -le $layoutBytes.Length - 3; $i++) { if ($layoutBytes[$i] -eq 0xD9 -and $layoutBytes[$i+1] -eq 0x85) { $okProbe = $true; break } }  # ة lead sanity
if ($scanned -eq 0) { Write-Host "  WARN: no source files found to scan" -ForegroundColor Yellow }
elseif ($bad.Count -gt 0) { $bad | ForEach-Object { Write-Host ("  CORRUPT: " + $_) -ForegroundColor Red }; Write-Host "FAIL 1/5: mojibake found" -ForegroundColor Red; exit 1 }
else { Write-Host ("  OK 1/5: byte audit clean (" + $scanned + " files)") -ForegroundColor Green }

# ---------- [2/5] TSC (stderr-safe) ----------
Write-Host "[2/5] Type check..." -ForegroundColor Cyan
 $prevEap = $ErrorActionPreference
 $ErrorActionPreference = "Continue"
& npx tsc --noEmit 2>&1 | Select-Object -First 20
 $tscCode = $LASTEXITCODE
 $ErrorActionPreference = $prevEap
if ($tscCode -ne 0) { Write-Host "FAIL 2/5: tsc errors above" -ForegroundColor Red; exit 1 }
Write-Host "  OK 2/5: types clean" -ForegroundColor Green

# ---------- [3/5] BUILD (stderr-safe) ----------
Write-Host "[3/5] Production build..." -ForegroundColor Cyan
 $bl = Join-Path $env:TEMP "markazak-gate5-build.log"
 $prevEap = $ErrorActionPreference
 $ErrorActionPreference = "Continue"
& npm run build 2>&1 | Out-File -FilePath $bl -Encoding utf8
 $buildCode = $LASTEXITCODE
 $ErrorActionPreference = $prevEap
if ($buildCode -ne 0) { Get-Content $bl | Select-Object -Last 30 | ForEach-Object { Write-Host ("  " + $_) }; Write-Host "FAIL 3/5: build failed" -ForegroundColor Red; exit 1 }
Write-Host "  OK 3/5: build green" -ForegroundColor Green

# ---------- [4/5] GIT HYGIENE ----------
Write-Host "[4/5] Git hygiene..." -ForegroundColor Cyan
 $red = $false
for ($i = 0; $i -lt $names.Count; $i++) {
    $f = $names[$i]; $st = $stats[$i]
    if ($st -like "D*") { continue }
    $why = ""
    if ($f -eq ".env" -or $f -eq ".env.local" -or $f -eq ".env.production" -or $f -eq ".env.development" -or $f -like ".env*.local") { $why = "env secret" }
    elseif ($f -like ".env.*" -and -not ($f -like ".env.example")) { $why = "env secret" }
    elseif ($f -like "*.pem" -or $f -like "*.key" -or $f -like "*.p12" -or $f -like "*.bak" -or $f -like "*.tmp" -or $f -like "*.dump" -or $f -like "*.log") { $why = "secret/temp" }
    elseif ($f -like "node_modules/*" -or $f -like "audit-out/*" -or $f -like "backups/*" -or $f -like "backup*" -or $f -like "dump*.sql" -or $f -eq "structure.txt") { $why = "junk path" }
    if ($why -ne "") { Write-Host ("GATE RED: forbidden: " + $f + " (" + $why + ")") -ForegroundColor Red; $red = $true }
}
 $srcPrefixes = @("src/", "app/", "lib/", "components/", "scripts/", "hooks/", "types/", "utils/", "server/", "middleware")
if ($mode -eq "STAGED") {
    foreach ($line in $porcelain) {
        if ($line.Length -lt 2) { continue }
        $x = $line.Substring(0,1); $y = $line.Substring(1,1)
        if ($y -ne " " -and $y -ne "?") { Write-Host ("GATE RED: unstaged change: " + $line) -ForegroundColor Red; $red = $true }
        if ($x -eq "?" -and $y -eq "?") {
            $path = $line.Substring(3); $isSrc = $false
            foreach ($p in $srcPrefixes) { if ($path.StartsWith($p)) { $isSrc = $true } }
            if ($isSrc) { Write-Host ("GATE RED: new source uncommitted: " + $path) -ForegroundColor Red; $red = $true }
            else { Write-Host ("  WARN: untracked outside src: " + $path) -ForegroundColor Yellow }
        }
    }
    Write-Host "  Staged (verify with your eyes):"
    $staged | ForEach-Object { Write-Host ("    + " + $_) -ForegroundColor Gray }
} else {
    Write-Host "  Changed in unpushed commits:"
    for ($i = 0; $i -lt $names.Count; $i++) { Write-Host ("    " + $stats[$i] + " " + $names[$i]) -ForegroundColor Gray }
}
if ($red) { Write-Host "FAIL 4/5: hygiene" -ForegroundColor Red; exit 1 }
Write-Host "  OK 4/5: hygiene clean" -ForegroundColor Green

# ---------- [5/5] SCHEMA REMINDER ----------
Write-Host "[5/5] Schema reminder..." -ForegroundColor Cyan
 $schemaTouched = $false
foreach ($f in $names) { if ($f -match "(?i)(migration|migrate|schema)" -or $f -match "(?i)\.sql$") { $schemaTouched = $true } }
if ($schemaTouched) {
    Write-Host "  REMINDER: push set touches schema/migrations." -ForegroundColor Yellow
    Write-Host "  After push: BACKUP target DB then run migration on target only." -ForegroundColor Yellow
} else { Write-Host "  OK 5/5: no schema files in push set" -ForegroundColor Green }

Write-Host "=============================================="
Write-Host " GATE: GREEN - safe to commit & push" -ForegroundColor Green
Write-Host "=============================================="
exit 0
