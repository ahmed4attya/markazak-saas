# ============================================================
# s1-ui.ps1 - Session 1: S1 UI layer (3 files, line-based)
# Guards:  location + parse + ASCII + BOM + tsc + build
# Run:     powershell -ExecutionPolicy Bypass -File tools\s1-ui.ps1
# ============================================================

 $ErrorActionPreference = "Stop"
[Console]::OutputEncoding = New-Object System.Text.UTF8Encoding($false)
Write-Host "=== S1-UI (3 files) ===" -ForegroundColor Cyan

 $expectedRoot = "E:\projects\training-center-saas-fixed2\training-center-saas-final\markazak-saas"
if ($PWD.Path -ne $expectedRoot) { throw ("WRONG LOCATION: " + $PWD.Path) }
if (-not (Test-Path "package.json")) { throw "package.json missing" }

function From-Codes { param([int[]]$Codes) (-join ($Codes | ForEach-Object { [char]$_ })) }
 $strict = New-Object System.Text.UTF8Encoding($false, $true)

function Save-File { param([string]$Path, [string[]]$Arr, [bool]$Bom, [string]$Eol, [bool]$EndNl)
  $out = ($Arr -join $Eol); if ($EndNl) { $out += $Eol }
  [System.IO.File]::WriteAllText($Path, $out, (New-Object System.Text.UTF8Encoding($Bom)))
  $nb = [System.IO.File]::ReadAllBytes($Path)
  $null = $strict.GetString($nb)
  $nbom = ($nb.Length -ge 3 -and $nb[0] -eq 239 -and $nb[1] -eq 187 -and $nb[2] -eq 191)
  if ($nbom -ne $Bom) { throw ("BOM state changed: " + $Path) }
}
function Get-Lines { param([string]$f, [ref]$bomRef, [ref]$eolRef, [ref]$endRef)
  $b = [System.IO.File]::ReadAllBytes($f); $bomRef.Value = ($b.Length -ge 3 -and $b[0] -eq 239 -and $b[1] -eq 187 -and $b[2] -eq 191)
  $raw = [System.IO.File]::ReadAllText($f)
  $e = [string][char]10; if ($raw.Contains([char]13)) { $e = [string][char]13 + [string][char]10 }
  $eolRef.Value = $e; $endRef.Value = $raw.EndsWith($e)
  return [System.IO.File]::ReadAllLines($f)
}
function Hit1 { param([string[]]$Arr, [string]$Exact, [ref]$idx)
  $c = 0; for ($k = 0; $k -lt $Arr.Count; $k++) { if ($Arr[$k] -ceq $Exact) { $c++; $idx.Value = $k } }
  return $c
}
function Verify-One { param([string]$t, [string]$n, [int]$want) $got = ([regex]::Matches($t, [regex]::Escape($n))).Count; if ($got -ne $want) { throw ("verify " + $n + ": got=" + $got + " want=" + $want) } }

 $AR_TYPE = From-Codes @(0x0627,0x0644,0x0646,0x0648,0x0639)
 $AR_CENTER = From-Codes @(0x0633,0x0646,0x062A,0x0631)
 $AR_ONLINE = From-Codes @(0x0623,0x0648,0x0646,0x0644,0x0627,0x064A,0x0646)
 $AR_SC = From-Codes @(0x0637,0x0644,0x0627,0x0628,0x20,0x0627,0x0644,0x0633,0x0646,0x062A,0x0631)
 $AR_SCD = From-Codes @(0x0637,0x0644,0x0627,0x0628,0x20,0x0627,0x0644,0x062D,0x0636,0x0648,0x0631,0x20,0x0627,0x0644,0x0645,0x0628,0x0627,0x0634,0x0631)
 $AR_SO = From-Codes @(0x0627,0x0644,0x0637,0x0644,0x0627,0x0628,0x20,0x0627,0x0644,0x0623,0x0648,0x0646,0x0644,0x0627,0x064A,0x0646)
 $AR_SOD = From-Codes @(0x0637,0x0644,0x0627,0x0628,0x20,0x0627,0x0644,0x062A,0x0639,0x0644,0x0645,0x20,0x0639,0x0646,0x20,0x0628,0x0639,0x062F)

# ================= F5 =================
Write-Host "--- F5: stats/route.ts ---"
 $f = 'app\api\stats\route.ts'
 $bom=$false; $eol=''; $end=$false
 $lines = Get-Lines $f ([ref]$bom) ([ref]$eol) ([ref]$end)
 $idx = -1
if ((Hit1 $lines "            count(*) filter (where status = 'suspended')::int as suspended" ([ref]$idx)) -ne 1) { throw "F5 anchor" }
 $lines[$idx] = "            count(*) filter (where status = 'suspended')::int as suspended,"
 $lines = $lines[0..$idx] + @("            count(*) filter (where type = 'center')::int as center,","            count(*) filter (where type = 'online')::int as online") + $lines[($idx+1)..($lines.Count-1)]
Save-File $f $lines $bom $eol $end
 $t = [System.IO.File]::ReadAllText($f)
Verify-One $t 'as center,' 1; Verify-One $t 'as online' 1
Write-Host "F5 OK" -ForegroundColor Green

# ================= F6 =================
Write-Host "--- F6: PageStatsCards.tsx ---"
 $f = 'components\PageStatsCards.tsx'
 $bom=$false; $eol=''; $end=$false
 $lines = Get-Lines $f ([ref]$bom) ([ref]$eol) ([ref]$end)
 $idx = -1
if ((Hit1 $lines '  Users,' ([ref]$idx)) -ne 1) { throw "F6 import" }
 $lines = $lines[0..$idx] + @('  Building2,','  Globe2,') + $lines[($idx+1)..($lines.Count-1)]
 $idx = -1
if ((Hit1 $lines '    suspended: number;' ([ref]$idx)) -ne 1) { throw "F6 type" }
 $lines[$idx] = '    suspended: number;'
 $lines = $lines[0..$idx] + @('    center: number;','    online: number;') + $lines[($idx+1)..($lines.Count-1)]
 $idx = -1
if ((Hit1 $lines '    suspended: 0,' ([ref]$idx)) -ne 1) { throw "F6 empty" }
 $lines[$idx] = '    suspended: 0,'
 $lines = $lines[0..$idx] + @('    center: 0,','    online: 0,') + $lines[($idx+1)..($lines.Count-1)]
 $idx = -1
if ((Hit1 $lines '          value: stats.students.suspended,' ([ref]$idx)) -ne 1) { throw "F6 card value" }
 $cid = -1
for ($k = $idx+1; $k -lt $lines.Count; $k++) { if ($lines[$k] -ceq '        },') { $cid = $k; break } }
if ($cid -lt 0) { throw "F6 card close" }
 $cards = @('        {',('          label: "' + $AR_SC + '",'),'          value: stats.students.center,',('          description: "' + $AR_SCD + '",'),'          icon: Building2,','          className: "border-cyan-100 bg-cyan-50/70 text-cyan-700",','          iconClass: "bg-cyan-100 text-cyan-600",','        },','        {',('          label: "' + $AR_SO + '",'),'          value: stats.students.online,',('          description: "' + $AR_SOD + '",'),'          icon: Globe2,','          className: "border-indigo-100 bg-indigo-50/70 text-indigo-700",','          iconClass: "bg-indigo-100 text-indigo-600",','        },')
 $lines = $lines[0..$cid] + $cards + $lines[($cid+1)..($lines.Count-1)]
Save-File $f $lines $bom $eol $end
 $t = [System.IO.File]::ReadAllText($f)
Verify-One $t 'center: number;' 1; Verify-One $t 'online: number;' 1; Verify-One $t 'stats.students.center' 1; Verify-One $t 'stats.students.online' 1
Write-Host "F6 OK" -ForegroundColor Green

# ================= F7 =================
Write-Host "--- F7: students/page.tsx ---"
 $f = 'app\students\page.tsx'
 $bom=$false; $eol=''; $end=$false
 $lines = Get-Lines $f ([ref]$bom) ([ref]$eol) ([ref]$end)
 $h = 0; $idx = -1
for ($k = 0; $k -lt $lines.Count; $k++) { if ($lines[$k] -like '*{ key: "name", label:*') { $h++; $idx = $k } }
if ($h -ne 1) { throw ("F7 col hits=" + $h) }
 $col = '              { key: "type", label: "' + $AR_TYPE + '" },'
 $lines = $lines[0..$idx] + $col + $lines[($idx+1)..($lines.Count-1)]
 $idx = -1
if ((Hit1 $lines '                key: "status",' ([ref]$idx)) -ne 1) { throw "F7 status" }
 $br = -1
for ($k = $idx-1; $k -ge 0; $k--) { if ($lines[$k] -ceq '              {') { $br = $k; break } }
if ($br -lt 0) { throw "F7 brace" }
 $fld = @('              {','                key: "type",',('                label: "' + $AR_TYPE + '",'),'                type: "select",','                options: [',('                  { value: "center", label: "' + $AR_CENTER + '" },'),('                  { value: "online", label: "' + $AR_ONLINE + '" },'),'                ],','              },')
 $lines = $lines[0..($br-1)] + $fld + $lines[$br..($lines.Count-1)]
Save-File $f $lines $bom $eol $end
 $t = [System.IO.File]::ReadAllText($f)
Verify-One $t 'key: "type"' 2
Write-Host "F7 OK" -ForegroundColor Green

# ================= byte check + tsc + build =================
Write-Host "--- byte check (3 files) ---"
foreach ($p in @('app\api\stats\route.ts','components\PageStatsCards.tsx','app\students\page.tsx')) {
  $bb = [System.IO.File]::ReadAllBytes($p)
  $tt = $strict.GetString($bb)
  $box = 0
  foreach ($ch in $tt.ToCharArray()) { $c = [int]$ch; if ($c -ge 0x2500 -and $c -le 0x257F) { $box++ } }
  Write-Host ("  " + $p + " -> bytes=" + $bb.Length + " box=" + $box)
  if ($box -gt 0) { throw ("MOJIBAKE in " + $p) }
}
Write-Host "--- tsc ---"
& npx tsc --noEmit 2>&1 | Select-Object -First 25
if ($LASTEXITCODE -ne 0) { throw "tsc RED - paste output" }
Write-Host "tsc: GREEN" -ForegroundColor Green
Write-Host "--- build ---"
 $bl = Join-Path $env:TEMP "markazak-s1-build.log"
& npm run build 2>&1 | Out-File -FilePath $bl -Encoding utf8
if ($LASTEXITCODE -ne 0) { Get-Content $bl | Select-Object -Last 30; throw "build RED - paste output" }
Write-Host "build: GREEN" -ForegroundColor Green
Write-Host "S1-UI COMPLETE. Run tools\s1-ship.ps1 next." -ForegroundColor Green