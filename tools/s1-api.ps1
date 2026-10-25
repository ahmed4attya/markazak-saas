# ============================================================
# s1-api.ps1 v2 - S1 API layer (4 files) - idempotent re-run
# v2 fixes: verify needle (lesson 32) + 'type' count + skip-if-applied
# Run: powershell -ExecutionPolicy Bypass -File tools\s1-api.ps1
# ============================================================

 $ErrorActionPreference = "Stop"
[Console]::OutputEncoding = New-Object System.Text.UTF8Encoding($false)
Write-Host "=== S1-API v2 (4 files, idempotent) ===" -ForegroundColor Cyan

if ($PWD.Path -ne "E:\projects\training-center-saas-fixed2\training-center-saas-final\markazak-saas") { throw ("WRONG LOCATION: " + $PWD.Path) }
if (-not (Test-Path "package.json")) { throw "package.json missing" }

# ---- tree guard v4: 4 API files (M) + this tool (M or ??) + sibling tools (??) ----
 $allowedM  = @('app/api/students/route.ts','app/api/students/[id]/route.ts','app/api/enrollments/route.ts','app/api/enrollments/[id]/route.ts','tools/s1-api.ps1')
 $allowedUU = @('tools/s1-api.ps1','tools/s1-ui.ps1','tools/s1-ship.ps1','tools/pre-push.ps1','tools/audit-project.ps1')
 $st0 = @(git status --porcelain)
 $real = @()
foreach ($line in $st0) {
  $st = $line.Substring(0,2); $p = $line.Substring(3)
  $ok = $false
  if (($st -eq 'M ') -or ($st -eq ' M')) { foreach ($a in $allowedM) { if ($p -ceq $a) { $ok = $true } } }
  if ($st -eq '??') { foreach ($a in $allowedUU) { if ($p -ceq $a) { $ok = $true } } }
  if (-not $ok) { $real += $line }
}
if ($real.Count -gt 0) { throw ("unexpected tree state: " + ($real -join " | ")) }
if ($real.Count -gt 0) { throw ("unexpected tree state: " + ($real -join " | ")) }

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
function Verify-One { param([string]$t, [string]$n, [int]$want) $got = ([regex]::Matches($t, [regex]::Escape($n))).Count; if ($got -ne $want) { throw ("verify [" + $n + "]: got=" + $got + " want=" + $want) } }

 $AR_TYPE_INVALID = From-Codes @(0x0646,0x0648,0x0639,0x20,0x0627,0x0644,0x0637,0x0627,0x0644,0x0628,0x20,0x063A,0x064A,0x0631,0x20,0x0635,0x0627,0x0644,0x062D)
 $AR_MIX = From-Codes @(0x062A,0x0646,0x0628,0x064A,0x0647,0x3A,0x20,0x0646,0x0648,0x0639,0x20,0x0627,0x0644,0x0637,0x0627,0x0644,0x0628,0x20,0x0644,0x0627,0x20,0x064A,0x0637,0x0627,0x0628,0x0642,0x20,0x0646,0x0645,0x0637,0x20,0x0627,0x0644,0x0645,0x062C,0x0645,0x0648,0x0639,0x0629)
 $AR_PERIOD = From-Codes @(0x0641,0x062A,0x0631,0x0629,0x20,0x0627,0x0644,0x0627,0x0634,0x062A,0x0631,0x0627,0x0643,0x20,0x063A,0x064A,0x0631,0x20,0x0635,0x0627,0x0644,0x062D,0x0629)

# ================= F1 =================
Write-Host "--- F1: students/route.ts ---"
 $f = 'app\api\students\route.ts'
 $t0 = [System.IO.File]::ReadAllText($f)
if ($t0.Contains('const stype=')) {
  Verify-One $t0 'const stype=' 1; Verify-One $t0 ',type) values' 1; Verify-One $t0 ' and type=$3' 1; Verify-One $t0 ',stype]' 1
  Write-Host "F1 SKIPPED (already applied, verified)" -ForegroundColor Yellow
} else {
  $bom=$false; $eol=''; $end=$false
  $lines = Get-Lines $f ([ref]$bom) ([ref]$eol) ([ref]$end)
  $idx = -1
  if ((Hit1 $lines "  const q=u.searchParams.get('q')||'';" ([ref]$idx)) -ne 1) { throw "F1 E1a" }
  $lines = $lines[0..$idx] + "  const type=(u.searchParams.get('type')||'').toLowerCase();" + $lines[($idx+1)..($lines.Count-1)]
  $idx = -1
  if ((Hit1 $lines "    'select id,student_no,name,phone,email,identity_no,status,created_at from students where tenant_id=`$1 and (name ilike `$2 or student_no ilike `$2 or phone ilike `$2) order by created_at desc limit 500'," ([ref]$idx)) -ne 1) { throw "F1 E1b" }
  $lines[$idx] = "    'select id,student_no,name,phone,email,identity_no,status,type,created_at from students where tenant_id=`$1 and (name ilike `$2 or student_no ilike `$2 or phone ilike `$2)'+(type==='center'||type==='online'?' and type=`$3':'')+' order by created_at desc limit 500',"
  $idx = -1
  if ((Hit1 $lines '    [s.tenantId,`%${q}%`]' ([ref]$idx)) -ne 1) { throw "F1 E1c" }
  $lines[$idx] = "    (type==='center'||type==='online')?[s.tenantId,`%${q}%`,type]:[s.tenantId,`%${q}%`]"
  $idx = -1
  if ((Hit1 $lines '    const x=studentSchema.parse(await req.json());' ([ref]$idx)) -ne 1) { throw "F1 E1d" }
  $ins = @('    const body=await req.json();','    const x=studentSchema.parse(body);',"    const rawType=(typeof body.type==='string')?body.type.trim().toLowerCase():'center';","    const stype=(rawType==='center'||rawType==='online')?rawType:'center';")
  $lines = $lines[0..($idx-1)] + $ins + $lines[$idx..($lines.Count-1)]
  $idx = -1
  if ((Hit1 $lines "      'insert into students(tenant_id,student_no,name,phone,email,identity_no,status) values(`$1,`$2,`$3,`$4,`$5,`$6,`$7) returning *'," ([ref]$idx)) -ne 1) { throw "F1 E1e" }
  $lines[$idx] = "      'insert into students(tenant_id,student_no,name,phone,email,identity_no,status,type) values(`$1,`$2,`$3,`$4,`$5,`$6,`$7,`$8) returning *',"
  $idx = -1
  if ((Hit1 $lines '      [s.tenantId,x.student_no,x.name,x.phone,x.email,x.identity_no,x.status]' ([ref]$idx)) -ne 1) { throw "F1 E1f" }
  $lines[$idx] = '      [s.tenantId,x.student_no,x.name,x.phone,x.email,x.identity_no,x.status,stype]'
  Save-File $f $lines $bom $eol $end
  $t = [System.IO.File]::ReadAllText($f)
  Verify-One $t 'const stype=' 1; Verify-One $t ',type) values' 1; Verify-One $t ' and type=$3' 1; Verify-One $t ',stype]' 1
  Write-Host "F1 OK" -ForegroundColor Green
}

# ================= F2 =================
Write-Host "--- F2: students/[id]/route.ts ---"
 $f = 'app\api\students\[id]\route.ts'
 $t0 = [System.IO.File]::ReadAllText($f)
if ($t0.Contains('AR_S1_TYPE_INVALID')) {
  Verify-One $t0 'AR_S1_TYPE_INVALID' 2; Verify-One $t "'type'" 1
  Write-Host "F2 SKIPPED (already applied, verified)" -ForegroundColor Yellow
} else {
  $bom=$false; $eol=''; $end=$false
  $lines = Get-Lines $f ([ref]$bom) ([ref]$eol) ([ref]$end)
  $idx = -1
  if ((Hit1 $lines "import { logAudit } from '@/lib/audit';" ([ref]$idx)) -ne 1) { throw "F2 E2a" }
  $lines = $lines[0..$idx] + @('', ('const AR_S1_TYPE_INVALID = ' + "'" + $AR_TYPE_INVALID + "';")) + $lines[($idx+1)..($lines.Count-1)]
  $idx = -1
  if ((Hit1 $lines '    const body = await req.json();' ([ref]$idx)) -ne 1) { throw "F2 E2b" }
  $blk = @('', "    const rawType = (typeof body.type === 'string') ? body.type.trim().toLowerCase() : undefined;", '', "    if (rawType !== undefined && rawType !== '' && rawType !== 'center' && rawType !== 'online') {", '      return NextResponse.json(', '        { error: AR_S1_TYPE_INVALID },', '        { status: 400 }', '      );', '    }', '', "    if (rawType === '') {", '      delete body.type;', '    } else if (rawType !== undefined) {', '      body.type = rawType;', '    }')
  $lines = $lines[0..$idx] + $blk + $lines[($idx+1)..($lines.Count-1)]
  $idx = -1
  if ((Hit1 $lines "      'status'" ([ref]$idx)) -ne 1) { throw "F2 E2c" }
  $lines[$idx] = "      'status',"
  $lines = $lines[0..$idx] + "      'type'" + $lines[($idx+1)..($lines.Count-1)]
  Save-File $f $lines $bom $eol $end
  $t = [System.IO.File]::ReadAllText($f)
  Verify-One $t 'AR_S1_TYPE_INVALID' 2; Verify-One $t "'type'" 1
  Write-Host "F2 OK" -ForegroundColor Green
}

# ================= F3 =================
Write-Host "--- F3: enrollments/route.ts ---"
 $f = 'app\api\enrollments\route.ts'
 $t0 = [System.IO.File]::ReadAllText($f)
if ($t0.Contains('AR_S1_MIX_WARNING')) {
  Verify-One $t0 'AR_S1_MIX_WARNING' 2; Verify-One $t0 'AR_S1_PERIOD_INVALID' 2; Verify-One $t0 'warning: mixWarning' 1
  Write-Host "F3 SKIPPED (already applied, verified)" -ForegroundColor Yellow
} else {
  $bom=$false; $eol=''; $end=$false
  $lines = Get-Lines $f ([ref]$bom) ([ref]$eol) ([ref]$end)
  $idx = -1
  if ((Hit1 $lines '  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;' ([ref]$idx)) -ne 1) { throw "F3 E3a" }
  $lines = $lines[0..$idx] + @('', ('const AR_S1_MIX_WARNING = ' + "'" + $AR_MIX + "';"), ('const AR_S1_PERIOD_INVALID = ' + "'" + $AR_PERIOD + "';")) + $lines[($idx+1)..($lines.Count-1)]
  $idx = -1
  if ((Hit1 $lines "      'select id from groups where id=`$1 and tenant_id=`$2'," ([ref]$idx)) -ne 1) { throw "F3 E3b" }
  $lines[$idx] = "      'select id, mode from groups where id=`$1 and tenant_id=`$2',"
  $idx = -1
  if ((Hit1 $lines "      'select id from students where id=`$1 and tenant_id=`$2'," ([ref]$idx)) -ne 1) { throw "F3 E3c" }
  $lines[$idx] = "      'select id, type from students where id=`$1 and tenant_id=`$2',"
  $idx = -1
  if ((Hit1 $lines '    const duplicate = await query(' ([ref]$idx)) -ne 1) { throw "F3 E3d" }
  $blk = @("    const gMode = group.rows[0].mode || 'onsite';", "    const sType = student.rows[0].type || 'center';", "    const expectedType = gMode === 'online' ? 'online' : 'center';", '    let mixWarning: string | null = null;', '', '    if (sType !== expectedType) {', '      mixWarning = AR_S1_MIX_WARNING;', '    }', '', "    const subStart = (typeof body.sub_start === 'string' && body.sub_start.trim() !== '' && !isNaN(Date.parse(body.sub_start))) ? body.sub_start.trim() : null;", "    const subEnd = (typeof body.sub_end === 'string' && body.sub_end.trim() !== '' && !isNaN(Date.parse(body.sub_end))) ? body.sub_end.trim() : null;", '', '    if (subStart && subEnd && Date.parse(subEnd) < Date.parse(subStart)) {', '      return NextResponse.json(', '        { error: AR_S1_PERIOD_INVALID },', '        { status: 400 }', '      );', '    }', '')
  $lines = $lines[0..($idx-1)] + $blk + $lines[$idx..($lines.Count-1)]
  $idx = -1
  if ((Hit1 $lines "      'insert into enrollments (tenant_id, group_id, student_id, status, price, discount) values (`$1,`$2,`$3,`$4,`$5,`$6) returning *'," ([ref]$idx)) -ne 1) { throw "F3 E3e" }
  $lines[$idx] = "      'insert into enrollments (tenant_id, group_id, student_id, status, price, discount, sub_start, sub_end) values (`$1,`$2,`$3,`$4,`$5,`$6,`$7,`$8) returning *',"
  $idx = -1
  if ((Hit1 $lines '        Number(body.discount) || 0' ([ref]$idx)) -ne 1) { throw "F3 E3f" }
  $lines[$idx] = '        Number(body.discount) || 0,'
  $lines = $lines[0..$idx] + @('        subStart,','        subEnd') + $lines[($idx+1)..($lines.Count-1)]
  $idx = -1
  if ((Hit1 $lines '      result.rows[0],' ([ref]$idx)) -ne 1) { throw "F3 E3g" }
  if ($lines[$idx-1] -cne '    return NextResponse.json(') { throw "F3 E3g struct" }
  $blk = @('    if (mixWarning) {','      return NextResponse.json(','        { ...result.rows[0], warning: mixWarning },','        { status: 201 }','      );','    }','')
  $lines = $lines[0..($idx-2)] + $blk + $lines[($idx-1)..($lines.Count-1)]
  Save-File $f $lines $bom $eol $end
  $t = [System.IO.File]::ReadAllText($f)
  Verify-One $t 'AR_S1_MIX_WARNING' 2; Verify-One $t 'AR_S1_PERIOD_INVALID' 2; Verify-One $t 'warning: mixWarning' 1
  Write-Host "F3 OK" -ForegroundColor Green
}

# ================= F4 =================
Write-Host "--- F4: enrollments/[id]/route.ts ---"
 $f = 'app\api\enrollments\[id]\route.ts'
 $t0 = [System.IO.File]::ReadAllText($f)
if ($t0.Contains('AR_S1_PERIOD_INVALID')) {
  Verify-One $t0 'AR_S1_PERIOD_INVALID' 2; Verify-One $t0 "'sub_start'," 1; Verify-One $t0 "'sub_end'" 1
  Write-Host "F4 SKIPPED (already applied, verified)" -ForegroundColor Yellow
} else {
  $bom=$false; $eol=''; $end=$false
  $lines = Get-Lines $f ([ref]$bom) ([ref]$eol) ([ref]$end)
  $idx = -1
  if ((Hit1 $lines '  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;' ([ref]$idx)) -ne 1) { throw "F4 E4a" }
  $lines = $lines[0..$idx] + @('', ('const AR_S1_PERIOD_INVALID = ' + "'" + $AR_PERIOD + "';")) + $lines[($idx+1)..($lines.Count-1)]
  $idx = -1
  if ((Hit1 $lines '    const body = await req.json();' ([ref]$idx)) -ne 1) { throw "F4 E4b" }
  $blk = @('', "    if (body.sub_start === '' || body.sub_start === null) {", '      delete body.sub_start;', '    }', '', "    if (body.sub_end === '' || body.sub_end === null) {", '      delete body.sub_end;', '    }', '', '    if (', '      (body.sub_start !== undefined && isNaN(Date.parse(body.sub_start))) ||', '      (body.sub_end !== undefined && isNaN(Date.parse(body.sub_end)))', '    ) {', '      return NextResponse.json(', '        { error: AR_S1_PERIOD_INVALID },', '        { status: 400 }', '      );', '    }')
  $lines = $lines[0..$idx] + $blk + $lines[($idx+1)..($lines.Count-1)]
  $idx = -1
  if ((Hit1 $lines "      'discount'" ([ref]$idx)) -ne 1) { throw "F4 E4c" }
  $lines[$idx] = "      'discount',"
  $lines = $lines[0..$idx] + @("      'sub_start',","      'sub_end'") + $lines[($idx+1)..($lines.Count-1)]
  Save-File $f $lines $bom $eol $end
  $t = [System.IO.File]::ReadAllText($f)
  Verify-One $t 'AR_S1_PERIOD_INVALID' 2; Verify-One $t "'sub_start'," 1; Verify-One $t "'sub_end'" 1
  Write-Host "F4 OK" -ForegroundColor Green
}

# ================= byte check + tsc =================
Write-Host "--- byte check (4 files) ---"
foreach ($p in @('app\api\students\route.ts','app\api\students\[id]\route.ts','app\api\enrollments\route.ts','app\api\enrollments\[id]\route.ts')) {
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
Write-Host "S1-API v2 COMPLETE. Run tools\s1-ship.ps1 next." -ForegroundColor Green