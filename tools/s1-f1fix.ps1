# ============================================================
# s1-f1fix.ps1 - FINAL - F1 surgical repair + 6-needle verify
# Lesson 32/33/34 applied: no backticks in single-quote
# literals; needles built by concatenation; verify-before-skip.
# Run: powershell -ExecutionPolicy Bypass -File tools\s1-f1fix.ps1
# ============================================================

 $ErrorActionPreference = "Stop"
[Console]::OutputEncoding = New-Object System.Text.UTF8Encoding($false)
Write-Host "=== S1-F1FIX (FINAL) ===" -ForegroundColor Cyan

if ($PWD.Path -ne "E:\projects\training-center-saas-fixed2\training-center-saas-final\markazak-saas") { throw ("WRONG LOCATION: " + $PWD.Path) }
if (-not (Test-Path "package.json")) { throw "package.json missing" }

 $strict = New-Object System.Text.UTF8Encoding($false, $true)
 $BT = [string][char]96
 $D  = "$"

 $f = 'app\api\students\route.ts'
 $b = [System.IO.File]::ReadAllBytes($f)
 $hasBom = ($b.Length -ge 3 -and $b[0] -eq 239 -and $b[1] -eq 187 -and $b[2] -eq 191)
 $raw = [System.IO.File]::ReadAllText($f)
 $eol = [string][char]10
if ($raw.Contains([char]13)) { $eol = [string][char]13 + [string][char]10 }
 $endNl = $raw.EndsWith($eol)
 $lines = [System.IO.File]::ReadAllLines($f)

 $nSelect = "    'select id,student_no,name,phone,email,identity_no,status,type,created_at from students where tenant_id=" + $BT + $D + "1 and (name ilike " + $BT + $D + "2 or student_no ilike " + $BT + $D + "2 or phone ilike " + $BT + $D + "2)'+(type==='center'||type==='online'?' and type=" + $BT + $D + "3':'')+' order by created_at desc limit 500',"

 $nParams = "    (type==='center'||type==='online')?[s.tenantId," + $BT + "%" + $D + "{q}%" + $BT + ",type]:[s.tenantId," + $BT + "%" + $D + "{q}%" + $BT + "]"

Write-Host "--- corrupted line (current, for the record) ---"
 $hSel = 0; $iSel = -1
for ($k = 0; $k -lt $lines.Count; $k++) {
  if ($lines[$k].StartsWith("    'select id,student_no,name,phone,email,identity_no,status,type,created_at from students")) { $hSel++; $iSel = $k }
}
if ($hSel -ne 1) { throw ("select line hits=" + $hSel) }
if ($iSel -lt $lines.Count) { Write-Host ("  L" + ($iSel+1) + ": " + $lines[$iSel]) }

 $hPar = 0; $iPar = -1
for ($k = 0; $k -lt $lines.Count; $k++) {
  if ($lines[$k].StartsWith("    (type==='center'||type==='online')?[s.tenantId,")) { $hPar++; $iPar = $k }
}
if ($hPar -ne 1) { throw ("params line hits=" + $hPar) }

 $lines[$iSel] = $nSelect
 $lines[$iPar] = $nParams

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
V1 $t ("const stype=") 1
V1 $t (",type) values") 1
V1 $t (" and type=" + $BT + $D + "3") 1
V1 $t (",stype]") 1
V1 $t ("tenant_id=" + $BT + $D + "1 and (name ilike") 1
V1 $t ("||type==='online'?'") 1
Write-Host "6 needles VERIFIED" -ForegroundColor Green

if ($lines[$iSel].TrimStart().StartsWith("//")) { throw "structural: comment line" }
Write-Host "structure OK" -ForegroundColor Green

Write-Host "--- tsc ---"
& npx tsc --noEmit 2>&1 | Select-Object -First 20
if ($LASTEXITCODE -ne 0) { throw "tsc RED - paste output" }
Write-Host "tsc: GREEN" -ForegroundColor Green
Write-Host "F1 REPAIRED AND VERIFIED." -ForegroundColor Green
Write-Host "NEXT: powershell -ExecutionPolicy Bypass -File tools\s1-ship.ps1" -ForegroundColor Green