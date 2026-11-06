# ============================================================
# dedup2.ps1 - DIAGNOSE + remove by LINE NUMBERS from live scan
# Run: powershell -ExecutionPolicy Bypass -File tools\dedup2.ps1
# ============================================================

 $ErrorActionPreference = "Stop"
[Console]::OutputEncoding = New-Object System.Text.UTF8Encoding($false)

if ($PWD.Path -ne "E:\projects\training-center-saas-fixed2\training-center-saas-final\markazak-saas") { throw ("WRONG LOCATION: " + $PWD.Path) }
Write-Host "=== DEDUP2 (live line-scan) ===" -ForegroundColor Cyan

 $strict = New-Object System.Text.UTF8Encoding($false, $true)
 $f = 'components\Shell.tsx'
 $b = [System.IO.File]::ReadAllBytes($f)
 $bom = ($b.Length -ge 3 -and $b[0] -eq 239 -and $b[1] -eq 187 -and $b[2] -eq 191)
 $lines = [System.IO.File]::ReadAllLines($f)

Write-Host "--- ALL lines containing logout references ---"
 $hits = @()
for ($k = 0; $k -lt $lines.Count; $k++) {
  if ($lines[$k] -match 'logout|LogOut') {
    Write-Host ("  L" + ($k+1) + ": [" + $lines[$k] + "]")
    $hits += $k
  }
}
Write-Host ("total logout-reference lines: " + $hits.Count)

# Count actual button opens
 $btns = @()
for ($k = 0; $k -lt $lines.Count; $k++) {
  if ($lines[$k].Contains('<button') -and $lines[$k + 1] -and $lines[$k + 1].Contains('onClick={logout}')) { $btns += $k }
}
Write-Host ("button blocks found (any indent): " + $btns.Count)
if ($btns.Count -eq 0) {
  # try: maybe the button is single-line or different structure. show context of the SECOND onClick occurrence
  $onClicks = @()
  for ($k = 0; $k -lt $lines.Count; $k++) { if ($lines[$k].Contains('onClick={logout}')) { $onClicks += $k } }
  Write-Host ("onClick={logout} occurrences: " + $onClicks.Count)
  foreach ($o in $onClicks) {
    Write-Host ("  context L" + ($o+1) + ":")
    for ($k = [Math]::Max(0, $o-2); $k -le [Math]::Min($lines.Count-1, $o+6); $k++) {
      Write-Host ("    L" + ($k+1) + ": [" + $lines[$k] + "]")
    }
  }
  Write-Host "=== MANUAL DECISION NEEDED - paste the above context ===" -ForegroundColor Yellow
  exit 0
}

# Two buttons: remove the second block (from its <button line through </button line)
if ($btns.Count -eq 2) {
  $i2 = $btns[1]
  $j2 = -1
  for ($k = $i2; $k -lt $lines.Count; $k++) { if ($lines[$k].Contains('</button>')) { $j2 = $k; break } }
  if ($j2 -lt 0) { throw "close tag not found" }
  Write-Host ("removing second button: lines " + ($i2+1) + ".." + ($j2+1))
  $newLines = @()
  if ($i2 -gt 0) { $newLines += $lines[0..($i2-1)] }
  if (($j2 + 1) -le ($lines.Count - 1)) { $newLines += $lines[($j2+1)..($lines.Count-1)] }
  $seol = [string][char]10
  foreach ($l in $newLines) { if ($l.Contains([char]13)) { $seol = [string][char]13 + [string][char]10; break } }
  [System.IO.File]::WriteAllText($f, ($newLines -join $seol), (New-Object System.Text.UTF8Encoding($bom)))
  $nb = [System.IO.File]::ReadAllBytes($f)
  $null = $strict.GetString($nb)
  $t = [System.IO.File]::ReadAllText($f)
  $c = ([regex]::Matches($t, [regex]::Escape('onClick={logout}'))).Count
  Write-Host ("logout buttons after: " + $c)
  if ($c -ne 1) { throw ("dedup failed: " + $c) }
  Write-Host "DEDUP OK - single logout button" -ForegroundColor Green
}