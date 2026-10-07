# ============================================================
# pre-push.ps1 - MANDATORY GATE before every git push (v4)
# Protocol : PROJECT-PROTOCOL.md Chapter 2
# Order    : tsc -> build -> git hygiene -> schema reminder
# Modes    : STAGED (pre-commit flow) / HEAD (post-commit flow)
# v4       : name-status aware - deletions (D) exempt from
#            forbidden-path checks (removing junk is desired).
# Verdict  : GREEN = you may push. RED = NO PUSH.
# Rules    : ASCII only, English messages, PS 5.1 safe
# ============================================================

 $ErrorActionPreference = "Continue"
 $Root = $PWD.Path

Write-Host "=============================================="
Write-Host " PRE-PUSH GATE v4 - markazak-saas"
Write-Host "=============================================="

if (-not (Test-Path (Join-Path $Root "package.json"))) {
    Write-Host "GATE RED: not in project root (package.json missing)." -ForegroundColor Red
    exit 1
}
if (-not (Test-Path (Join-Path $Root ".git"))) {
    Write-Host "GATE RED: not a git repository." -ForegroundColor Red
    exit 1
}

 $staged = @(git diff --cached --name-only 2>$null)
 $porcelain = @(git status --porcelain 2>$null)

 $mode = ""
if ($staged.Count -gt 0) {
    $mode = "STAGED"
} else {
    if ($porcelain.Count -gt 0) {
        Write-Host "GATE RED: nothing staged but working tree is dirty." -ForegroundColor Red
        Write-Host "Incomplete commit. Whitelist files and commit first:" -ForegroundColor Red
        foreach ($l in $porcelain) { Write-Host ("   " + $l) -ForegroundColor Yellow }
        exit 1
    }
    $mode = "HEAD"
}
Write-Host ("Mode: " + $mode)

 $nameArr = @()
 $statusArr = @()
if ($mode -eq "STAGED") {
    $ns = @(git diff --cached --name-status 2>$null)
} else {
    $hasOrigin = $false
    $null = git rev-parse --verify -q origin/main 2>$null
    if ($LASTEXITCODE -eq 0) { $hasOrigin = $true }
    if ($hasOrigin) {
        Write-Host "Commits to be pushed:"
        $lg = @(git log --oneline origin/main..HEAD 2>$null)
        foreach ($c in $lg) { Write-Host ("   " + $c) -ForegroundColor Gray }
        $ns = @(git diff --name-status origin/main...HEAD 2>$null)
    } else {
        $ns = @(git show --name-status --format="" HEAD 2>$null)
    }
}
 $tab = [char]9
foreach ($l in $ns) {
    if (-not $l) { continue }
    if ($l.Trim() -eq "") { continue }
    $parts = $l.Split($tab)
    if ($parts.Count -lt 2) { continue }
    $nameArr += ($parts[$parts.Count - 1])
    $statusArr += ($parts[0])
}
 $filesUnderReview = @($nameArr | Where-Object { $_ -and $_.Trim() -ne "" })
Write-Host ("Push set: " + $filesUnderReview.Count + " file(s) under review.")
 $delCount = 0
foreach ($s in $statusArr) { if ($s -like "D*") { $delCount++ } }
Write-Host ("Deletions in push set (allowed cleanup): " + $delCount)
if ($mode -eq "HEAD" -and $filesUnderReview.Count -eq 0) {
    Write-Host "NOTE: no diff vs origin/main - branch appears already pushed."
}

# ---- [1/4] Type check ----
Write-Host "[1/4] Type check (npx tsc --noEmit)..." -ForegroundColor Cyan
& npx tsc --noEmit 2>&1 | ForEach-Object { Write-Host ("  " + $_) }
 $tscCode = $LASTEXITCODE
if ($tscCode -ne 0) {
    Write-Host "GATE RED: type check failed." -ForegroundColor Red
    exit 1
}
Write-Host "      tsc: GREEN" -ForegroundColor Green

# ---- [2/4] Production build ----
Write-Host "[2/4] Production build (npm run build)..." -ForegroundColor Cyan
 $buildLog = Join-Path $env:TEMP "markazak-build.log"
& npm run build 2>&1 | Out-File -FilePath $buildLog -Encoding utf8
 $buildCode = $LASTEXITCODE
if ($buildCode -ne 0) {
    Write-Host "GATE RED: build failed. Last 40 lines:" -ForegroundColor Red
    Get-Content $buildLog | Select-Object -Last 40 | ForEach-Object { Write-Host ("  " + $_) }
    exit 1
}
Write-Host "      build: GREEN" -ForegroundColor Green

# ---- [3/4] Git hygiene ----
Write-Host "[3/4] Git hygiene..." -ForegroundColor Cyan
 $red = $false

for ($i = 0; $i -lt $nameArr.Count; $i++) {
    $f = $nameArr[$i]
    $st = $statusArr[$i]
    if ($st -like "D*") { continue }
    $bad = $false
    $why = ""
    if ($f -eq ".env" -or $f -eq ".env.local" -or $f -eq ".env.production" -or $f -eq ".env.development" -or $f -like ".env*.local") {
        $bad = $true; $why = "env secret file"
    } elseif ($f -like ".env.*" -and -not ($f -like ".env.example")) {
        $bad = $true; $why = "env secret file"
    } elseif ($f -like "*.pem" -or $f -like "*.key" -or $f -like "*.p12" -or $f -like "*.bak" -or $f -like "*.tmp" -or $f -like "*.dump" -or $f -like "*.log") {
        $bad = $true; $why = "secret/temp artifact"
    } elseif ($f -like "node_modules/*" -or $f -like "audit-out/*" -or $f -like "backups/*" -or $f -like "backup*" -or $f -like "dump*.sql" -or $f -eq "structure.txt") {
        $bad = $true; $why = "junk/backup path (as addition/modification)"
    }
    if ($bad) {
        Write-Host ("GATE RED: forbidden file in push set: " + $f + "  (" + $why + ")") -ForegroundColor Red
        $red = $true
    }
}

 $srcPrefixes = @("src/", "app/", "lib/", "components/", "scripts/", "hooks/", "types/", "utils/", "server/", "middleware")

if ($mode -eq "STAGED") {
    foreach ($line in $porcelain) {
        if ($line.Length -lt 2) { continue }
        $x = $line.Substring(0, 1)
        $y = $line.Substring(1, 1)
        if ($y -ne " " -and $y -ne "?") {
            Write-Host ("GATE RED: unstaged change - restage or stash: " + $line) -ForegroundColor Red
            $red = $true
        }
        if ($x -eq "?" -and $y -eq "?") {
            $path = $line.Substring(3)
            $isSrc = $false
            foreach ($p in $srcPrefixes) {
                if ($path.StartsWith($p)) { $isSrc = $true }
            }
            if ($isSrc) {
                Write-Host ("GATE RED: new source file not committed: " + $path) -ForegroundColor Red
                $red = $true
            } else {
                Write-Host ("  WARN: untracked outside src (add to .gitignore or remove): " + $path) -ForegroundColor Yellow
            }
        }
    }
    Write-Host "  Staged files (whitelist - verify with your own eyes):"
    foreach ($f in $staged) { Write-Host ("    + " + $f) -ForegroundColor Gray }
} else {
    Write-Host "  Files changed in unpushed commits (status + path):"
    for ($i = 0; $i -lt $nameArr.Count; $i++) {
        Write-Host ("    " + $statusArr[$i] + " " + $nameArr[$i]) -ForegroundColor Gray
    }
}

# ---- [4/4] Schema sync reminder ----
Write-Host "[4/4] Schema sync reminder..." -ForegroundColor Cyan
 $schemaTouched = $false
foreach ($f in $filesUnderReview) {
    if ($f -match "(?i)(migration|migrate|schema)") { $schemaTouched = $true }
    if ($f -match "(?i)\.sql$") { $schemaTouched = $true }
}
if ($schemaTouched) {
    Write-Host "  REMINDER: push set touches schema/migrations." -ForegroundColor Yellow
    Write-Host "  Before push: BACKUP target DB, then run migration on target only." -ForegroundColor Yellow
} else {
    Write-Host "  No schema-related files in push set. OK."
}

# ---- Verdict ----
if ($red) {
    Write-Host "GATE: RED - PUSH FORBIDDEN." -ForegroundColor Red
    exit 1
}
Write-Host "GATE: GREEN - you may push." -ForegroundColor Green
Write-Host "  git push -u origin main"
Write-Host "  git push origin <tag>   (tags need explicit push)"
exit 0