# ============================================================
# pre-push.ps1 - MANDATORY GATE before every git push (v2)
# Protocol : PROJECT-PROTOCOL.md Chapter 2
# Order    : tsc -> build -> git hygiene -> schema reminder
# Verdict  : GREEN = you may push. RED = NO PUSH.
# Rules    : ASCII only, English messages, PS 5.1 safe
# ============================================================

 $ErrorActionPreference = "Continue"
 $Root = $PWD.Path

Write-Host "=============================================="
Write-Host " PRE-PUSH GATE - markazak-saas"
Write-Host "=============================================="

if (-not (Test-Path (Join-Path $Root "package.json"))) {
    Write-Host "GATE RED: not in project root (package.json missing)." -ForegroundColor Red
    exit 1
}
if (-not (Test-Path (Join-Path $Root ".git"))) {
    Write-Host "GATE RED: not a git repository." -ForegroundColor Red
    exit 1
}
 $staged = & git diff --cached --name-only 2>$null
if (-not $staged) {
    Write-Host "GATE RED: nothing staged. Whitelist files first: git add <file-by-name>" -ForegroundColor Red
    exit 1
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
 $porcelain = & git status --porcelain 2>$null
 $srcPrefixes = @("src/", "app/", "lib/", "components/", "scripts/", "hooks/", "types/", "utils/", "server/", "middleware")

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

 $forbidden = @(".env", ".env.local", ".env.production", ".env.*", "*.pem", "*.key", "*.p12", "*.bak", "*.log", "*.tmp", "node_modules/*", "audit-out/*", "structure.txt", "*.dump", "dump*.sql", "backup*")
foreach ($f in $staged) {
    foreach ($pat in $forbidden) {
        if ($f -like $pat) {
            Write-Host ("GATE RED: forbidden file staged: " + $f + "  (matched: " + $pat + ")") -ForegroundColor Red
            $red = $true
        }
    }
}

Write-Host "  Staged files (whitelist - verify with your own eyes):"
foreach ($f in $staged) { Write-Host ("    + " + $f) -ForegroundColor Gray }

# ---- [4/4] Schema sync reminder ----
Write-Host "[4/4] Schema sync reminder..." -ForegroundColor Cyan
 $schemaTouched = $false
foreach ($f in $staged) {
    if ($f -match "(?i)(migration|migrate|schema)" -or $f -match "(?i)\.sql$") { $schemaTouched = $true }
}
if ($schemaTouched) {
    Write-Host "  REMINDER: staged changes touch schema/migrations." -ForegroundColor Yellow
    Write-Host "  Before push: BACKUP target DB, then run migration on target only." -ForegroundColor Yellow
} else {
    Write-Host "  No schema-related files staged. OK."
}

if ($red) {
    Write-Host "GATE: RED - PUSH FORBIDDEN." -ForegroundColor Red
    exit 1
}
Write-Host "GATE: GREEN - remaining steps:" -ForegroundColor Green
Write-Host "  1. Local functional test of the changed flow."
Write-Host "  2. Commit (staged list above)."
Write-Host "  3. Push."
exit 0