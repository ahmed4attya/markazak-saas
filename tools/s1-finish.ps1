# ============================================================
# s1-finish.ps1 - LOOP ENDER
# 1) Rebuilds app/api/students/route.ts COMPLETELY (whole file,
#    correct content, no duplicate declarations)
# 2) Verifies: line count + needles + tsc
# 3) Commits tools, stages 4 API files, runs MANDATORY GATE,
#    commits feature, pushes - push happens ONLY after GREEN
# Run: powershell -ExecutionPolicy Bypass -File tools\s1-finish.ps1
# ============================================================

 $ErrorActionPreference = "Stop"
[Console]::OutputEncoding = New-Object System.Text.UTF8Encoding($false)
Write-Host "=== S1-FINISH ===" -ForegroundColor Cyan

if ($PWD.Path -ne "E:\projects\training-center-saas-fixed2\training-center-saas-final\markazak-saas") { throw ("WRONG LOCATION: " + $PWD.Path) }
if (-not (Test-Path "package.json")) { throw "package.json missing" }

 $BT = [string][char]96
 $D  = "$"

# ---------- expected dirt whitelist ----------
 $apiOk  = @('app/api/students/route.ts','app/api/students/[id]/route.ts','app/api/enrollments/route.ts','app/api/enrollments/[id]/route.ts')
 $toolOk = @('tools/s1-api.ps1','tools/s1-ui.ps1','tools/s1-ship.ps1','tools/s1-f1fix.ps1','tools/s1-finish.ps1')
 $st0 = @(git status --porcelain)
 $bad = @()
foreach ($line in $st0) {
  $p = $line.Substring(3)
  if (-not (($apiOk -contains $p) -or ($toolOk -contains $p))) { $bad += $line }
}
if ($bad.Count -gt 0) { throw ("unexpected entries: " + ($bad -join " | ")) }
Write-Host "tree entries all expected" -ForegroundColor Green

# ---------- 1. rebuild the whole file ----------
 $f = 'app\api\students\route.ts'
 $fb = [System.IO.File]::ReadAllBytes($f)
 $hasBom = ($fb.Length -ge 3 -and $fb[0] -eq 239 -and $fb[1] -eq 187 -and $fb[2] -eq 191)
 $fr = [System.IO.File]::ReadAllText($f)
 $eol = [string][char]10
if ($fr.Contains([char]13)) { $eol = [string][char]13 + [string][char]10 }
Write-Host ("rebuilding whole file (was " + $fb.Length + " bytes, bom=" + $hasBom + ")")

 $L = @()
 $L += "import {NextResponse} from 'next/server';"
 $L += "import {query,safeError} from '@/lib/db';"
 $L += "import {getSession} from '@/lib/auth';"
 $L += "import {studentSchema} from '@/lib/validation';"
 $L += ""
 $L += "export async function GET(req:Request){"
 $L += "  const s=await getSession();"
 $L += "  if(!s)return NextResponse.json({error:'unauthorized'},{status:401});"
 $L += ""
 $L += "  const u=new URL(req.url);"
 $L += "  const q=u.searchParams.get('q')||'';"
 $L += "  const type=(u.searchParams.get('type')||'').toLowerCase();"
 $L += ""
 $L += "  const r=await query("
 $L += "    'select id,student_no,name,phone,email,identity_no,status,type,created_at from students where tenant_id=" + $D + "1 and (name ilike " + $D + "2 or student_no ilike " + $D + "2 or phone ilike " + $D + "2)'+(type==='center'||type==='online'?' and type=" + $D + "3':'')+' order by created_at desc limit 500',"
 $L += ("    (type==='center'||type==='online')?[s.tenantId," + $BT + "%" + $D + "{q}%" + $BT + ",type]:[s.tenantId," + $BT + "%" + $D + "{q}%" + $BT + "]")
 $L += "  );"
 $L += ""
 $L += "  return NextResponse.json(r.rows);"
 $L += "}"
 $L += ""
 $L += "export async function POST(req:Request){"
 $L += "  const s=await getSession();"
 $L += "  if(!s)return NextResponse.json({error:'unauthorized'},{status:401});"
 $L += ""
 $L += "  try{"
 $L += "    const body=await req.json();"
 $L += "    const x=studentSchema.parse(body);"
 $L += "    const rawType=(typeof body.type==='string')?body.type.trim().toLowerCase():'center';"
 $L += "    const stype=(rawType==='center'||rawType==='online')?rawType:'center';"
 $L += ""
 $L += "    const r=await query("
 $L += "      'insert into students(tenant_id,student_no,name,phone,email,identity_no,status,type) values(" + $D + "1," + $D + "2," + $D + "3," + $D + "4," + $D + "5," + $D + "6," + $D + "7," + $D + "8) returning *',"
 $L += "      [s.tenantId,x.student_no,x.name,x.phone,x.email,x.identity_no,x.status,stype]"
 $L += "    );"
 $L += ""
 $L += "    return NextResponse.json(r.rows[0],{status:201});"
 $L += "  }catch(e:any){"
 $L += "    return NextResponse.json({ error: safeError(e) },{status:400});"
 $L += "  }"
 $L += "}"

 $out = ($L -join $eol) + $eol
[System.IO.File]::WriteAllText($f, $out, (New-Object System.Text.UTF8Encoding($hasBom)))

# ---------- 2. verify (measured against this exact content) ----------
 $strict = New-Object System.Text.UTF8Encoding($false, $true)
 $nb = [System.IO.File]::ReadAllBytes($f)
 $null = $strict.GetString($nb)
 $nbom = ($nb.Length -ge 3 -and $nb[0] -eq 239 -and $nb[1] -eq 187 -and $nb[2] -eq 191)
if ($nbom -ne $hasBom) { throw "BOM state changed" }
 $lcount = ([System.IO.File]::ReadAllLines($f)).Count
Write-Host ("written: bytes=" + $nb.Length + " lines=" + $lcount + " (expect 41) bom=" + $nbom)
if ($lcount -ne 41) { throw ("line count=" + $lcount + " expected 41") }
 $t = [System.IO.File]::ReadAllText($f)
 $box = 0
foreach ($ch in $tt = $t.ToCharArray()) { $c = [int]$ch; if ($c -ge 0x2500 -and $c -le 0x257F) { $box++ } }
if ($box -gt 0) { throw "mojibake detected" }
function V1 { param([string]$text, [string]$needle, [int]$want)
  $g = ([regex]::Matches($text, [regex]::Escape($needle))).Count
  if ($g -ne $want) { throw ("needle [" + $needle + "]: got=" + $g + " want=" + $want) }
}
V1 $t "const x=" 1
V1 $t "studentSchema.parse" 1
V1 $t "studentSchema" 2
V1 $t "const body=" 1
V1 $t "const stype=" 1
V1 $t ",stype]" 1
V1 $t ",type) values" 1
V1 $t (" and type=" + $D + "3") 1
V1 $t ($BT + "%" + $D + "{q}%" + $BT) 2
V1 $t "export async function GET" 1
V1 $t "export async function POST" 1
V1 $t ("tenant_id=" + $D + "1 and (name ilike") 1
Write-Host "ALL NEEDLES VERIFIED (no duplicates)" -ForegroundColor Green

# ---------- 3. tsc ----------
Write-Host "--- tsc ---"
& npx tsc --noEmit 2>&1 | Select-Object -First 20
if ($LASTEXITCODE -ne 0) { throw "tsc RED - nothing committed - paste output" }
Write-Host "tsc: GREEN" -ForegroundColor Green

# ---------- 4. commit tools (path-limited) ----------
git add -- tools
 $toolStaged = @(git diff --cached --name-only | Where-Object { $_ -like "tools/*" })
if ($toolStaged.Count -gt 0) {
  git commit -m "tools: s1 finish script + guard fixes (lessons 31-34)" -- tools
  if ($LASTEXITCODE -ne 0) { throw "tools commit failed" }
  Write-Host ("tools committed: " + ($toolStaged -join ", ")) -ForegroundColor Green
}

# ---------- 5. stage the 4 API files ----------
git add -- app/api/students app/api/enrollments
 $staged = @(git diff --cached --name-only)
Write-Host ("staged: " + $staged.Count + " files (expect 4)")
 $staged | ForEach-Object { Write-Host ("  + " + $_) }
if ($staged.Count -ne 4) { throw ("staged=" + $staged.Count + " expected 4") }
foreach ($s in $staged) { if (-not ($apiOk -contains $s)) { throw ("unexpected staged: " + $s) } }

# ---------- 6. MANDATORY GATE (aborts on RED) ----------
Write-Host "--- MANDATORY GATE ---" -ForegroundColor Cyan
& powershell -ExecutionPolicy Bypass -File tools\pre-push.ps1
if ($LASTEXITCODE -ne 0) { Write-Host "GATE RED - feature NOT committed. Paste output." -ForegroundColor Red; exit 1 }

# ---------- 7. commit + push ----------
git commit -m "feat(s1-api): student type accept/filter, enrollment mix warning + subscription period (rebuilt students route)"
if ($LASTEXITCODE -ne 0) { throw "feature commit failed" }
git push -u origin main
if ($LASTEXITCODE -ne 0) { throw "push failed" }
 $left = @(git status --porcelain)
if ($left.Count -gt 0) { throw ("tree not clean after ship: " + ($left -join " | ")) }
Write-Host "SHIPPED CLEAN - S1 CODE COMPLETE ON ORIGIN." -ForegroundColor Green
Write-Host "NEXT: wait 2-3 min for Vercel, then live-proof in an incognito window." -ForegroundColor Green