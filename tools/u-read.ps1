# ============================================================
# u-read.ps1 v2 - Scope U READ-ONLY evidence pack
# v2: tree guard allows untracked tool scripts (lesson 33)
# Output: audit-out/u-read.txt  (paste its content back)
# Run: powershell -ExecutionPolicy Bypass -File tools\u-read.ps1
# ============================================================

 $ErrorActionPreference = "Stop"
[Console]::OutputEncoding = New-Object System.Text.UTF8Encoding($false)
Write-Host "=== U-READ v2 (read-only evidence pack) ===" -ForegroundColor Cyan

if ($PWD.Path -ne "E:\projects\training-center-saas-fixed2\training-center-saas-final\markazak-saas") { throw ("WRONG LOCATION: " + $PWD.Path) }

# ---- tree guard v2: M/A entries forbidden (nothing modified),
#      but untracked scripts under tools/ are allowed ----
 $st = @(git status --porcelain)
 $bad = @()
foreach ($line in $st) {
  $x = $line.Substring(0, 1)
  $y = $line.Substring(1, 1)
  if (($x -eq "?") -and ($y -eq "?")) {
    $p = $line.Substring(3)
    if ($p -like "tools/*") { continue }
    if ($p -like ".impeccable*") { continue }
    if ($p -like ".codex*") { continue }
    if ($p -like ".gemini*") { continue }
    if ($p -like ".claude*") { continue }
    $bad += $line
    continue
  }
  $bad += $line
}
if ($bad.Count -gt 0) { throw ("unexpected tree state: " + ($bad -join " | ")) }

if (-not (Test-Path "audit-out")) { New-Item -ItemType Directory -Path "audit-out" | Out-Null }
 $outPath = Join-Path $PWD "audit-out\u-read.txt"
 $R = New-Object System.Collections.Generic.List[string]
function Sec { param([string]$t) $R.Add(""); $R.Add("######## " + $t + " ########"); $R.Add("") }
function Dump { param([string]$p)
  if (-not (Test-Path $p)) { $R.Add("MISSING: " + $p); return }
  $R.Add("--- FILE: " + $p + "  (lines=" + ([System.IO.File]::ReadAllLines($p)).Count + ") ---")
  foreach ($l in [System.IO.File]::ReadAllLines($p)) { $R.Add($l) }
  $R.Add("--- END: " + $p + " ---")
}

Sec "1. tailwind.config.js (theme tokens)"
Dump 'tailwind.config.js'

Sec "2. app/layout.tsx (fonts + global shell)"
Dump 'app\layout.tsx'

Sec "3. app/globals.css (FULL - the main theme file)"
Dump 'app\globals.css'

Sec "4. components/Shell.tsx (FULL - protected shell)"
Dump 'components\Shell.tsx'

Sec "5. app/dashboard/page.tsx (FULL)"
Dump 'app\dashboard\page.tsx'

Sec "6. COLOR TOKEN INVENTORY (all tsx in app/ + components/)"
 $files = @(Get-ChildItem -Recurse -Include *.tsx -Path app, components | Where-Object { $_.FullName -notmatch 'node_modules' })
 $colorTokens = @{}
 $plainTokens = @{}
foreach ($f in $files) {
  $txt = [System.IO.File]::ReadAllText($f.FullName)
  $ms = [regex]::Matches($txt, 'className="([^"]*)"')
  foreach ($m in $ms) {
    foreach ($tok in ($m.Groups[1].Value -split '\s+')) {
      $t = $tok.Trim()
      if ($t -eq '') { continue }
      if ($t -match '^(bg|border|text|from|to|via|ring|shadow|fill|stroke)-') { if ($colorTokens.ContainsKey($t)) { $colorTokens[$t]++ } else { $colorTokens[$t] = 1 } }
      else { if ($plainTokens.ContainsKey($t)) { $plainTokens[$t]++ } else { $plainTokens[$t] = 1 } }
    }
  }
  $ms2 = [regex]::Matches($txt, '"((?:bg|border|text|from|to|via|ring)-[a-zA-Z0-9\-/]+)"')
  foreach ($m in $ms2) {
    $t = $m.Groups[1].Value
    if ($colorTokens.ContainsKey($t)) { $colorTokens[$t]++ } else { $colorTokens[$t] = 1 }
  }
}
 $R.Add("--- color tokens (count desc) ---")
 $colorTokens.GetEnumerator() | Sort-Object Value -Descending | ForEach-Object { $R.Add($_.Value.ToString().PadLeft(4) + "  " + $_.Key) }
 $R.Add("")
 $R.Add("--- non-color tokens (count desc, top 80) ---")
 $plainTokens.GetEnumerator() | Sort-Object Value -Descending | Select-Object -First 80 | ForEach-Object { $R.Add($_.Value.ToString().PadLeft(4) + "  " + $_.Key) }
 $R.Add("")
 $R.Add("note: template-literal classNames (backtick) are not captured by this scan; PageStatsCards definitions reviewed separately in section 3/4 dumps.")
 $R.Add("tsx files scanned: " + $files.Count)

[System.IO.File]::WriteAllLines($outPath, $R, (New-Object System.Text.UTF8Encoding $true))
Write-Host ("EVIDENCE PACK WRITTEN: " + $outPath + "  (" + $R.Count + " lines)") -ForegroundColor Green
Write-Host "Paste audit-out\u-read.txt content back into the chat." -ForegroundColor Green