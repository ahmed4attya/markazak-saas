# ============================================================
# audit-project.ps1  -  Session 0 full project audit (v2)
# Protocol : PROJECT-PROTOCOL.md (evidence before decisions)
# Produces : audit-out\PASTE-THIS.md
#            audit-out\tsc-output.txt
#            audit-out\build-output.txt
# Rules    : ASCII only, English messages, PS 5.1 safe
# Exit 0   = script completed (verdict inside report)
# Exit 1   = precondition failed (wrong folder)
# ============================================================

 $ErrorActionPreference = "Continue"

 $Root    = $PWD.Path
 $OutDir  = Join-Path $Root "audit-out"
 $Report  = Join-Path $OutDir "PASTE-THIS.md"
 $Utf8Bom = New-Object System.Text.UTF8Encoding $true

Write-Host "=============================================="
Write-Host " SESSION 0 - PROJECT AUDIT (markazak-saas)"
Write-Host "=============================================="

if (-not (Test-Path (Join-Path $Root "package.json"))) {
    Write-Host "FAIL: package.json not found here. Run from project root." -ForegroundColor Red
    exit 1
}
if (-not (Test-Path $OutDir)) {
    New-Item -ItemType Directory -Path $OutDir | Out-Null
}

 $R    = New-Object System.Collections.Generic.List[string]
 $fail = 0

function Add-Line { param([string]$L) $R.Add($L) }
function Add-Sec  { param([string]$T) Add-Line ""; Add-Line ("## " + $T); Add-Line "" }

function Get-FileList {
    param([string]$Dir)
    $out  = @()
    $skip = @("node_modules", ".next", ".git", "audit-out", ".vercel", "dist", "coverage", ".turbo")
    try { $items = Get-ChildItem -LiteralPath $Dir -ErrorAction Stop } catch { return $out }
    foreach ($i in $items) {
        if ($i.PSIsContainer) {
            if ($skip -contains $i.Name) { continue }
            $out += Get-FileList -Dir $i.FullName
        } else {
            $out += $i.FullName.Substring($Root.Length + 1)
        }
    }
    return $out
}

# ---- 1. Environment ----
Add-Line ("# SESSION 0 AUDIT - " + (Get-Date -Format "yyyy-MM-dd HH:mm:ss"))
Add-Sec "1. Environment"
Add-Line ("Root: " + $Root)
foreach ($tool in @("node", "npm", "git", "npx")) {
    $v = "NOT FOUND"
    try { $v = (& $tool --version 2>$null | Select-Object -First 1) } catch { }
    Add-Line ($tool + ": " + $v)
}

# ---- 2. Git state ----
Add-Sec "2. Git State"
 $branch = ""
try { $branch = (& git rev-parse --abbrev-ref HEAD 2>$null) } catch { }
if ($branch) {
    Add-Line ("Branch: " + $branch)
    $log = & git log --oneline -10 2>$null
    Add-Line "Last commits:"
    foreach ($c in $log) { Add-Line ("  " + $c) }
    $st = & git status --porcelain 2>$null
    if ($st) {
        Add-Line "Working tree status (porcelain):"
        foreach ($s in $st) { Add-Line ("  " + $s) }
    } else {
        Add-Line "Working tree: CLEAN"
    }
} else {
    Add-Line "Git: no repository found here (or git missing)."
}

# ---- 3. Type check ----
Add-Sec "3. Type Check (npx tsc --noEmit)"
Write-Host "[1/4] Running tsc --noEmit (may take a minute)..." -ForegroundColor Cyan
 $tscFile = Join-Path $OutDir "tsc-output.txt"
& npx tsc --noEmit 2>&1 | Out-File -FilePath $tscFile -Encoding utf8
 $tscCode = $LASTEXITCODE
Add-Line ("Exit code: " + $tscCode)
if ($tscCode -eq 0) {
    Add-Line "Result: CLEAN - no type errors."
    Write-Host "      tsc: GREEN" -ForegroundColor Green
} else {
    $fail++
    $tscLines = Get-Content $tscFile
    Add-Line "Result: RED - first 40 lines below:"
    foreach ($l in ($tscLines | Select-Object -First 40)) { Add-Line ("  " + $l) }
    Write-Host "      tsc: RED" -ForegroundColor Red
}

# ---- 4. Production build ----
Add-Sec "4. Production Build (npm run build)"
Write-Host "[2/4] Running npm run build (several minutes)..." -ForegroundColor Cyan
 $buildFile = Join-Path $OutDir "build-output.txt"
& npm run build 2>&1 | Out-File -FilePath $buildFile -Encoding utf8
 $buildCode = $LASTEXITCODE
Add-Line ("Exit code: " + $buildCode)
 $bl = Get-Content $buildFile
if ($buildCode -eq 0) {
    Add-Line "Result: GREEN. Last 20 lines below:"
    foreach ($l in ($bl | Select-Object -Last 20)) { Add-Line ("  " + $l) }
    Write-Host "      build: GREEN" -ForegroundColor Green
} else {
    $fail++
    Add-Line "Result: RED. Last 40 lines below:"
    foreach ($l in ($bl | Select-Object -Last 40)) { Add-Line ("  " + $l) }
    Write-Host "      build: RED" -ForegroundColor Red
}

# ---- 5. package.json ----
Add-Sec "5. package.json (full)"
Add-Line "---- package.json start ----"
foreach ($l in (Get-Content (Join-Path $Root "package.json"))) { Add-Line $l }
Add-Line "---- package.json end ----"

# ---- 6. Env var NAMES only ----
Add-Sec "6. Env Variable NAMES (from .env.example only - values are NEVER read)"
 $envExample = Join-Path $Root ".env.example"
if (Test-Path $envExample) {
    $names = @()
    foreach ($line in (Get-Content $envExample)) {
        $t = $line.Trim()
        if ($t -eq "") { continue }
        if ($t.StartsWith("#")) { continue }
        $eq = $t.IndexOf("=")
        if ($eq -gt 0) { $names += $t.Substring(0, $eq).Trim() }
    }
    Add-Line ("Names: " + ($names -join " | "))
} else {
    Add-Line ".env.example NOT FOUND."
}
Add-Line "NOTE: .env and .env.local values are never read or transmitted (protocol)."

# ---- 7. Key file inventory ----
Add-Sec "7. Key File Inventory (YES = exists, MISSING = not found)"
 $checkList = @(
    "next.config.ts", "next.config.js",
    "middleware.ts", "src\middleware.ts",
    "lib\db.ts", "src\lib\db.ts",
    "lib\auth.ts", "src\lib\auth.ts",
    "app\layout.tsx", "src\app\layout.tsx",
    "scripts\migrate.ts", "scripts\seed.ts",
    "scripts\migrations", "db\migrations", "drizzle.config.ts", "prisma\schema.prisma",
    ".env.example", ".gitignore", "docker-compose.yml"
)
foreach ($f in $checkList) {
    if (Test-Path (Join-Path $Root $f)) { Add-Line ("  YES     " + $f) }
    else { Add-Line ("  MISSING " + $f) }
}

# ---- 8. File list ----
Add-Sec "8. File List (flat, heavy dirs excluded, cap 600)"
 $files = Get-FileList -Dir $Root | Sort-Object
Add-Line ("Total files: " + $files.Count)
if ($files.Count -gt 600) {
    foreach ($f in ($files | Select-Object -First 600)) { Add-Line ("  " + $f) }
    Add-Line ("  ... TRUNCATED (" + ($files.Count - 600) + " more)")
} else {
    foreach ($f in $files) { Add-Line ("  " + $f) }
}

# ---- 9. Verdict ----
Add-Sec "9. Verdict"
Add-Line ("Failures: " + $fail)
if ($fail -eq 0) {
    Add-Line "AUDIT: GREEN baseline confirmed (types + build clean)."
} else {
    Add-Line "AUDIT: RED - fix items above before any scope work (protocol: solid point first)."
}

[System.IO.File]::WriteAllLines($Report, $R, $Utf8Bom)
Write-Host "=============================================="
if ($fail -eq 0) { Write-Host " AUDIT COMPLETE: GREEN" -ForegroundColor Green }
else { Write-Host (" AUDIT COMPLETE: RED - failures: " + $fail) -ForegroundColor Red }
Write-Host (" Paste this file back into the chat: " + $Report)
Write-Host "=============================================="
exit 0