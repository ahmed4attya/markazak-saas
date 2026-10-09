# ============================================================
# dedup.ps1 - remove duplicate topbar logout button (final)
# MUSST BE .ps1 FILE (lesson 55: scriptblock guards are broken in PS5.1)
# Run: powershell -ExecutionPolicy Bypass -File tools\dedup.ps1
# ============================================================

 $ErrorActionPreference = "Stop"
[Console]::OutputEncoding = New-Object System.Text.UTF8Encoding($false)

if ($PWD.Path -ne "E:\projects\training-center-saas-fixed2\training-center-saas-final\markazak-saas") { throw ("WRONG LOCATION: " + $PWD.Path) }
Write-Host "=== DEDUP (file-based, location-guarded) ===" -ForegroundColor Cyan

 $strict = New-Object System.Text.UTF8Encoding($false, $true)
 $f = 'components\Shell.tsx'
 $b = [System.IO.File]::ReadAllBytes($f)
 $bom = ($b.Length -ge 3 -and $b[0] -eq 239 -and $b[1] -eq 187 -and $b[2] -eq 191)
 $lines = [System.IO.File]::ReadAllLines($f)

# find button-blocks: <button followed by onClick={logout}
 $starts = @()
for ($k = 0; $k -lt $lines.Count; $k++) {
  if ($lines[$k].Trim() -eq '            <button' -and ($k + 1) -lt $lines.Count -and $lines[$k+1].Contains('onClick={logout}')) { $starts += $k }
}
Write-Host ("logout button blocks: " + $starts.Count)
if ($starts.Count -eq 0) { Write-Host "already deduplicated" -ForegroundColor Yellow; exit 0 }
if ($starts.Count -ne 2) { throw ("expected 2, got " + $starts.Count) }

foreach ($s in $starts) {
  if ($lines[$s+1] -notmatch 'onClick=\{logout\}') { throw "structure unexpected L" + ($s+1) }
  if ($lines[$s+5] -notmatch 'LogOut') { throw "LogOut unexpected L" + ($s+6) }
  if ($lines[$s+6] -cne '            </button>') { throw ("close unexpected L" + ($s+7)) }
}

 $i2 = $starts[1]
 $newLines = @()
if ($i2 -gt 0) { $newLines += $lines[0..($i2-1)] }
if (($i2 + 7) -le ($lines.Count - 1)) { $newLines += $lines[($i2+7)..($lines.Count-1)] }

 $seol = [string][char]10
foreach ($l in $newLines) { if ($l.Contains([char]13)) { $seol = [string][char]13 + [string][char]10; break } }
[System.IO.File]::WriteAllText($f, ($newLines -join $seol), (New-Object System.Text.UTF8Encoding($bom)))
 $nb = [System.IO.File]::ReadAllBytes($f)
 $null = $strict.GetString($nb)
 $nbom = ($nb.Length -ge 3 -and $nb[0] -eq 239 -and $nb[1] -eq 187 -and $nb[2] -eq 191)
if ($nbom -ne $bom) { throw "BOM changed" }

 $t = [System.IO.File]::ReadAllText($f)
 $c = ([regex]::Matches($t, [regex]::Escape('onClick={logout}'))).Count
Write-Host ("logout buttons after: " + $c)
if ($c -ne 1) { throw ("dedup failed: " + $c) }
Write-Host "DEDUP OK - single logout button" -ForegroundColor Green