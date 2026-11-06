# ============================================================
# sec-login.ps1 v2 - SECURITY: remove demo credentials
# v2: tolerates agent-tool folders (.codex/.gemini/...) and
#     gitignores them; E1/E2/E3 edits; verify; tsc; GATE; push
# Run: powershell -ExecutionPolicy Bypass -File tools\sec-login.ps1
# ============================================================

 $ErrorActionPreference = "Stop"
[Console]::OutputEncoding = New-Object System.Text.UTF8Encoding($false)
Write-Host "=== SEC-LOGIN v2 ===" -ForegroundColor Cyan

if ($PWD.Path -ne "E:\projects\training-center-saas-fixed2\training-center-saas-final\markazak-saas") { throw ("WRONG LOCATION: " + $PWD.Path) }
if (-not (Test-Path "package.json")) { throw "package.json missing" }

# ---- whitelist ----
 $mainOk = 'app/login/page.tsx'
 $toolOk = @(
  'tools/sec-login.ps1','tools/prod-css-check.ps1',
  'tools/s1-api.ps1','tools/s1-ui.ps1','tools/s1-ship.ps1',
  'tools/s1-f1fix.ps1','tools/s1-finish.ps1',
  'tools/pre-push.ps1','tools/audit-project.ps1'
)
 $agentDirs = @('.codex/', '.gemini/', '.claude/', '.cursor/', '.agents/', '.impeccable/', '.github/', '.grok/', '.hermes/')

# ---- tree guard ----
 $st0 = @(git status --porcelain)
 $bad = @()
 $mainDirty = $false
foreach ($line in $st0) {
  $st = $line.Substring(0,2)
  $p = $line.Substring(3)
  if (($st -eq 'M ') -or ($st -eq ' M')) {
    if ($p -ceq $mainOk) { $mainDirty = $true; continue }
    if ($p -ceq '.gitignore') { continue }
    $bad += $line
    continue
  }
  if ($st -eq '??') {
    if ($toolOk -contains $p) { continue }
    if ($agentDirs -contains $p) { continue }
    if ($p.StartsWith('.impeccable')) { continue }
    if ($p.StartsWith('.codex')) { continue }
    if ($p.StartsWith('.gemini')) { continue }
    if ($p.StartsWith('.claude')) { continue }
    $bad += $line
    continue
  }
  $bad += $line
}
if ($bad.Count -gt 0) { throw ("unexpected tree state: " + ($bad -join " | ")) }
if ($mainDirty) { throw "app/login/page.tsx already modified unexpectedly - paste git status" }
Write-Host "tree guard: OK" -ForegroundColor Green

# ---- ensure agent folders ignored (idempotent) ----
 $gi = '.gitignore'
 $gtx = [System.IO.File]::ReadAllText($gi)
 $needed = @()
foreach ($d in @('.codex/', '.gemini/', '.claude/', '.cursor/', '.agents/', '.impeccable/', '.grok/', '.hermes/')) {
  if ($gtx.IndexOf($d, [System.StringComparison]::Ordinal) -lt 0) { $needed += $d }
}
if ($needed.Count -gt 0) {
  $giLines = [System.IO.File]::ReadAllLines($gi)
  $giLines += ''
  $giLines += '# local AI-agent tool folders (impeccable installer)'
  foreach ($d in $needed) { $giLines += $d }
  $giOut = ($giLines -join [string][char]10) + [string][char]10
  [System.IO.File]::WriteAllText($gi, $giOut, (New-Object System.Text.UTF8Encoding $false))
  Write-Host (".gitignore: added " + ($needed -join ' ')) -ForegroundColor Green
}

# ---- login page edits ----
 $strict = New-Object System.Text.UTF8Encoding($false, $true)
 $f = 'app\login\page.tsx'
 $b = [System.IO.File]::ReadAllBytes($f)
 $hasBom = ($b.Length -ge 3 -and $b[0] -eq 239 -and $b[1] -eq 187 -and $b[2] -eq 191)
 $raw = [System.IO.File]::ReadAllText($f)
 $eol = [string][char]10
if ($raw.Contains([char]13)) { $eol = [string][char]13 + [string][char]10 }
 $endNl = $raw.EndsWith($eol)
 $lines = [System.IO.File]::ReadAllLines($f)
 $before = $lines.Count

 $a1 = '  const [email, setEmail] = useState("admin@center.sa");'
 $c = 0; $i1 = -1
for ($k = 0; $k -lt $lines.Count; $k++) { if ($lines[$k] -ceq $a1) { $c++; $i1 = $k } }
if ($c -ne 1) { throw ("E1 hits=" + $c) }
 $lines[$i1] = '  const [email, setEmail] = useState("");'

 $a2 = '  const [password, setPassword] = useState("admin123");'
 $c = 0; $i2 = -1
for ($k = 0; $k -lt $lines.Count; $k++) { if ($lines[$k] -ceq $a2) { $c++; $i2 = $k } }
if ($c -ne 1) { throw ("E2 hits=" + $c) }
 $lines[$i2] = '  const [password, setPassword] = useState("");'

 $a3 = '        <div className="demo">'
 $c = 0; $i3 = -1
for ($k = 0; $k -lt $lines.Count; $k++) { if ($lines[$k] -ceq $a3) { $c++; $i3 = $k } }
if ($c -ne 1) { throw ("E3 hits=" + $c) }
 $iEnd = -1
for ($k = $i3 + 1; $k -lt $lines.Count; $k++) { if ($lines[$k] -ceq '        </div>') { $iEnd = $k; break } }
if ($iEnd -lt 0) { throw "E3 close not found" }
 $removed = $iEnd - $i3 + 1
Write-Host ("removing demo block: lines " + ($i3+1) + ".." + ($iEnd+1) + " (" + $removed + " lines)")

 $newLines = @()
if ($i3 -gt 0) { $newLines += $lines[0..($i3-1)] }
if (($iEnd + 1) -le ($lines.Count - 1)) { $newLines += $lines[($iEnd+1)..($lines.Count-1)] }
 $lines = $newLines

 $out = ($lines -join $eol)
if ($endNl) { $out += $eol }
[System.IO.File]::WriteAllText($f, $out, (New-Object System.Text.UTF8Encoding($hasBom)))
 $nb = [System.IO.File]::ReadAllBytes($f)
 $null = $strict.GetString($nb)
 $nbom = ($nb.Length -ge 3 -and $nb[0] -eq 239 -and $nb[1] -eq 187 -and $nb[2] -eq 191)
if ($nbom -ne $hasBom) { throw "BOM state changed" }

 $t = [System.IO.File]::ReadAllText($f)
function V1 { param([string]$text, [string]$needle, [int]$want)
  $g = ([regex]::Matches($text, [regex]::Escape($needle))).Count
  if ($g -ne $want) { throw ("needle [" + $needle + "]: got=" + $g + " want=" + $want) }
}
V1 $t 'admin@center.sa' 0
V1 $t 'admin123' 0
V1 $t 'className="demo"' 0
V1 $t 'setEmail] = useState("")' 1
V1 $t 'setPassword] = useState("")' 1
 $after = ([System.IO.File]::ReadAllLines($f)).Count
Write-Host ("lines: " + $before + " -> " + $after + " (removed " + ($before - $after) + ", expect " + $removed + ")")
if (($before - $after) -ne $removed) { throw "line delta mismatch" }
Write-Host "ALL NEEDLES VERIFIED - credentials fully removed" -ForegroundColor Green

# ---- tsc ----
Write-Host "--- tsc ---"
& npx tsc --noEmit 2>&1 | Select-Object -First 20
if ($LASTEXITCODE -ne 0) { throw "tsc RED - paste output" }
Write-Host "tsc: GREEN" -ForegroundColor Green

# ---- commit tools + gitignore (staged-only commit) ----
git add -- tools/sec-login.ps1
git add -- .gitignore
 $ts = @(git diff --cached --name-only)
Write-Host ("tools commit includes: " + ($ts -join ', '))
if ($ts.Count -gt 0) {
  git commit -m "tools: security login fix script + gitignore agent tool folders"
  if ($LASTEXITCODE -ne 0) { throw "tools commit failed" }
  Write-Host "tools committed" -ForegroundColor Green
}

# ---- stage login page ----
git add -- app/login/page.tsx
 $staged = @(git diff --cached --name-only)
Write-Host ("staged: " + $staged.Count + " (expect 1)")
 $staged | ForEach-Object { Write-Host ("  + " + $_) }
if ($staged.Count -ne 1) { throw ("staged=" + $staged.Count + " expected 1") }

# ---- MANDATORY GATE ----
Write-Host "--- MANDATORY GATE ---" -ForegroundColor Cyan
& powershell -ExecutionPolicy Bypass -File tools\pre-push.ps1
if ($LASTEXITCODE -ne 0) { Write-Host "GATE RED - nothing committed. Paste output." -ForegroundColor Red; exit 1 }

# ---- commit + push ----
git commit -m "security: remove demo credentials from login page (prefill + hint block)"
if ($LASTEXITCODE -ne 0) { throw "commit failed" }
git push -u origin main
if ($LASTEXITCODE -ne 0) { throw "push failed" }
 $left = @(git status --porcelain)
if ($left.Count -gt 0) { throw ("tree not clean after ship: " + ($left -join " | ")) }
Write-Host "SECURITY FIX SHIPPED - Vercel deploys in 2-3 min." -ForegroundColor Green