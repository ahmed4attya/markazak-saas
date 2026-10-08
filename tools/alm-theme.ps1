# ============================================================
# alm-theme.ps1 - DEC-040: Almdrasa token swap + Landing page
# 1) globals.css: token values + font + amber sweep
# 2) tailwind.config.js brand + Shell/dashboard hex touches
# 3) app/page.tsx: archive old + rebuild as landing (RTL, dark)
# 4) tsc + build + detect(exit code)  [NO git - lock issue pending]
# Run: powershell -ExecutionPolicy Bypass -File tools\alm-theme.ps1
# ============================================================

 $ErrorActionPreference = "Stop"
[Console]::OutputEncoding = New-Object System.Text.UTF8Encoding($false)
Write-Host "=== ALM-THEME (DEC-040) ===" -ForegroundColor Cyan

if ($PWD.Path -ne "E:\projects\training-center-saas-fixed2\training-center-saas-final\markazak-saas") { throw ("WRONG LOCATION: " + $PWD.Path) }
 $strict = New-Object System.Text.UTF8Encoding($false, $true)
function From-Codes { param([int[]]$Codes) (-join ($Codes | ForEach-Object { [char]$_ })) }

  $st0 = @(git status --porcelain)
 $expectedM = @('app/globals.css','components/Shell.tsx','app/dashboard/page.tsx','app/page.tsx','tailwind.config.js')
 $bad = @()
foreach ($line in $st0) {
  $st = $line.Substring(0,2); $p = $line.Substring(3)
  if (($st -eq 'M ') -or ($st -eq ' M')) {
    if ($expectedM -contains $p) { continue }
    if ($p -like 'tools/*') { continue }
    $bad += $line; continue
  }
  if ($st -eq '??') { if ($p -like 'tools/*' -or $p -like '.impeccable*' -or $p -like '.codex*' -or $p -like '.gemini*' -or $p -eq 'DESIGN.md') { continue } }
  $bad += $line
}
if ($bad.Count -gt 0) { throw ("unexpected tree state: " + ($bad -join " | ")) }

function Apply-Rep { param([string]$path, [object[]]$rules)
  $b = [System.IO.File]::ReadAllBytes($path)
  $bom = ($b.Length -ge 3 -and $b[0] -eq 239 -and $b[1] -eq 187 -and $b[2] -eq 191)
  $txt = [System.IO.File]::ReadAllText($path)
  foreach ($r in $rules) {
    $c = ([regex]::Matches($txt, [regex]::Escape($r.o))).Count
    if ($c -ne $r.c) { Write-Host ("  skip [" + $r.o.Substring(0,[Math]::Min(48,$r.o.Length)) + "] got=" + $c) -ForegroundColor Yellow; continue }
    $txt = $txt.Replace($r.o, $r.n)
  }
  [System.IO.File]::WriteAllText($path, $txt, (New-Object System.Text.UTF8Encoding($bom)))
  $nb = [System.IO.File]::ReadAllBytes($path)
  $null = $strict.GetString($nb)
  $nbom = ($nb.Length -ge 3 -and $nb[0] -eq 239 -and $nb[1] -eq 187 -and $nb[2] -eq 191)
  if ($nbom -ne $bom) { throw ("BOM changed: " + $path) }
}

# ============ 1. globals.css ============
Write-Host "--- globals.css tokens -> Almdrasa ---"
 $g = 'app\globals.css'
 $gRules = @(
  @{o='@import url("https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800&display=swap");'; n='@import url("https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@300;400;500;600;700&family=Cairo:wght@400;700&display=swap");'; c=1},
  @{o='--bg: #0b1222;'; n='--bg: #0b0f17;'; c=1},
  @{o='--surface: #121b31;'; n='--surface: #131b2a;'; c=1},
  @{o='--surface-2: #182341;'; n='--surface-2: #1e293b;'; c=1},
  @{o='--surface-3: #1e2c52;'; n='--surface-3: #243047;'; c=1},
  @{o='--border: #233052;'; n='--border: rgba(255, 255, 255, 0.08);'; c=1},
  @{o='--border-strong: #2e3d66;'; n='--border-strong: rgba(255, 255, 255, 0.15);'; c=1},
  @{o='--text: #eaf0fa;'; n='--text: #f8fafc;'; c=1},
  @{o='--text-soft: #c7d3ea;'; n='--text-soft: #e2e8f0;'; c=1},
  @{o='--muted: #93a5c8;'; n='--muted: #94a3b8;'; c=1},
  @{o='--muted-dim: #6b7da3;'; n='--muted-dim: #64748b;'; c=1},
  @{o='--gold: #e7c168;'; n='--gold: #fbbf24;'; c=1},
  @{o='--gold-strong: #f2d38b;'; n='--gold-strong: #fcd34d;'; c=1},
  @{o='--gold-soft: rgba(231, 193, 104, 0.14);'; n='--gold-soft: rgba(245, 158, 11, 0.12);'; c=1},
  @{o='--gold-border: rgba(231, 193, 104, 0.38);'; n='--gold-border: rgba(245, 158, 11, 0.3);'; c=1},
  @{o='--gold-cta: linear-gradient(135deg, #fcd34d, #f59e0b);'; n='--gold-cta: linear-gradient(135deg, #fbbf24, #f59e0b);'; c=1},
  @{o='font-family: "Cairo", sans-serif;'; n='font-family: "IBM Plex Sans Arabic", "Cairo", sans-serif;'; c=1},
  @{o='radial-gradient(1400px 700px at 80% -10%, rgba(91, 155, 255, 0.07), transparent 60%)'; n='radial-gradient(1400px 700px at 80% -10%, rgba(245, 158, 11, 0.06), transparent 60%)'; c=1},
  @{o='radial-gradient(1000px 500px at 5% 110%, rgba(231, 193, 104, 0.05), transparent 55%)'; n='radial-gradient(1000px 500px at 5% 110%, rgba(91, 155, 255, 0.05), transparent 55%)'; c=1},
  @{o='background: linear-gradient(135deg, #f7dc9c, #edc976);'; n='background: linear-gradient(135deg, #fbbf24, #d97706);'; c=1},
  @{o='radial-gradient(circle, rgba(231, 193, 104, 0.28), transparent 60%)'; n='radial-gradient(circle, rgba(245, 158, 11, 0.3), transparent 60%)'; c=1}
)
Apply-Rep $g $gRules
# sweep leftovers (measured, then replaced all)
 $gt = [System.IO.File]::ReadAllText((Join-Path $PWD $g))
 $sweep = @(@('#1a2440','#0b0f17'), @('231, 193, 104','245, 158, 11'), @('#e7c168','#fbbf24'), @('#f2d38b','#fcd34d'), @('#b99a45','#d97706'))
foreach ($s in $sweep) {
  $c = ([regex]::Matches($gt, [regex]::Escape($s[0]))).Count
  if ($c -gt 0) { $gt = $gt.Replace($s[0], $s[1]); Write-Host ("  sweep [" + $s[0] + "] x" + $c) }
}
[System.IO.File]::WriteAllText((Join-Path $PWD $g), $gt, (New-Object System.Text.UTF8Encoding $true))
 $gt2 = [System.IO.File]::ReadAllText((Join-Path $PWD $g))
foreach ($gone in @('#0b1222','#e7c168','231, 193, 104','#1a2440')) {
  if (([regex]::Matches($gt2, [regex]::Escape($gone))).Count -ne 0) { throw ("globals still has [" + $gone + "]") }
}
foreach ($need in @('--bg: #0b0f17','--gold: #fbbf24','IBM Plex Sans Arabic','--gold-cta')) {
  if (([regex]::Matches($gt2, [regex]::Escape($need))).Count -lt 1) { throw ("globals missing [" + $need + "]") }
}
Write-Host "globals: Almdrasa tokens VERIFIED (0 old hex remain)" -ForegroundColor Green

# ============ 2. tailwind.config.js ============
Write-Host "--- tailwind.config.js ---"
 $tRules = @(
  @{o="DEFAULT: '#1264e8',"; n="DEFAULT: '#f59e0b',"; c=1},
  @{o="dark: '#0d55c7',"; n="dark: '#d97706',"; c=1},
  @{o="light: '#eaf2ff',"; n="light: '#fef3c7',"; c=1}
)
Apply-Rep 'tailwind.config.js' $tRules
Write-Host "tailwind brand tokens updated" -ForegroundColor Green

# ============ 3. Shell.tsx touches ============
Write-Host "--- Shell.tsx font + amber hexes ---"
 $sRules = @(
  @{o="font-['Cairo']"; n="font-['IBM_Plex_Sans_Arabic']"; c=1},
  @{o='from-[#f2d38b] to-[#d9a83f]'; n='from-[#fbbf24] to-[#f59e0b]'; c=1},
  @{o='shadow-[0_10px_26px_rgba(231,193,104,0.3)]'; n='shadow-[0_10px_26px_rgba(245,158,11,0.3)]'; c=1}
)
Apply-Rep 'components\Shell.tsx' $sRules
 $stx = [System.IO.File]::ReadAllText('components\Shell.tsx')
 $c1240 = ([regex]::Matches($stx, [regex]::Escape('#1a2440'))).Count
if ($c1240 -gt 0) { $stx = $stx.Replace('#1a2440','#0b0f17'); [System.IO.File]::WriteAllText('components\Shell.tsx', $stx, (New-Object System.Text.UTF8Encoding $true)); Write-Host ("  Shell #1a2440 x" + $c1240 + " -> #0b0f17") }
 $stx2 = [System.IO.File]::ReadAllText('components\Shell.tsx')
if (([regex]::Matches($stx2, [regex]::Escape('#1a2440'))).Count -ne 0) { throw "Shell still has #1a2440" }
if (([regex]::Matches($stx2, [regex]::Escape('text-[color:var(--gold)]'))).Count -ne 4) { throw "Shell gold != 4" }
Write-Host "Shell verify OK" -ForegroundColor Green

# ============ 4. dashboard touches ============
Write-Host "--- dashboard amber shadow + text ---"
 $dRules = @(
  @{o='shadow-[0_8px_20px_rgba(231,193,104,0.25)]'; n='shadow-[0_8px_20px_rgba(245,158,11,0.3)]'; c=1}
)
Apply-Rep 'app\dashboard\page.tsx' $dRules
 $dtx = [System.IO.File]::ReadAllText('app\dashboard\page.tsx')
 $c2 = ([regex]::Matches($dtx, [regex]::Escape('#1a2440'))).Count
if ($c2 -gt 0) { $dtx = $dtx.Replace('#1a2440','#0b0f17'); [System.IO.File]::WriteAllText('app\dashboard\page.tsx', $dtx, (New-Object System.Text.UTF8Encoding $true)) }
if (([regex]::Matches([System.IO.File]::ReadAllText('app\dashboard\page.tsx'), [regex]::Escape("accent: '"))).Count -ne 4) { throw "accents != 4" }
Write-Host "dashboard verify OK" -ForegroundColor Green

# ============ 5. Landing page (archive + rebuild) ============
Write-Host "--- app/page.tsx: archive old + write landing ---"
if (-not (Test-Path 'audit-out')) { New-Item -ItemType Directory -Path 'audit-out' | Out-Null }
 $ts = Get-Date -Format 'yyyyMMdd-HHmmss'
 $oldPage = 'app\page.tsx'
if (Test-Path $oldPage) {
  $arch = Join-Path $PWD ('audit-out\landing-archive-' + $ts + '.tsx')
  Copy-Item $oldPage $arch -Force
  Write-Host ("  old page archived: " + (Split-Path $arch -Leaf))
}
 $pb = [System.IO.File]::ReadAllBytes($oldPage)
 $pbom = ($pb.Length -ge 3 -and $pb[0] -eq 239 -and $pb[1] -eq 187 -and $pb[2] -eq 191)

 $landing = @'
import Link from "next/link";
import {
  Users, BookOpen, CalendarCheck, Wallet, FileBadge, BarChart3,
  Brain, ShieldCheck, ArrowLeft, Sparkles, Building2, Layers,
} from "lucide-react";

const modules = [
  { Icon: Users, title: "إدارة الطلاب", desc: "ملفات كاملة للطلاب بأنواعهم: سنتر وأونلاين، مع القيد في المجموعات وفترات الاشتراك.", accent: "blue" },
  { Icon: BookOpen, title: "الدورات والمجموعات", desc: "كتالوج الدورات، الفرق والمجموعات بأنماطها (حضوري/أونلاين)، والجدولة.", accent: "success" },
  { Icon: CalendarCheck, title: "الحضور والغياب", desc: "تسجيل يومي سريع، إحصائيات مباشرة، وتقرير ملخص قابل للتصدير.", accent: "warning" },
  { Icon: Wallet, title: "الفواتير والمدفوعات", desc: "إصدار الفواتير، تحصيل جزئي أو كامل، وتكامل دفع عبر Stripe مع Webhooks موثقة.", accent: "indigo" },
  { Icon: FileBadge, title: "الشهادات الموثقة", desc: "إصدار شهادات برقم تحقق فريد يمكن التحقق منه علنياً.", accent: "violet" },
  { Icon: BarChart3, title: "التقارير", desc: "تقارير الحضور والمالية مع تصدير CSV ولوحات مؤشرات حية.", accent: "cyan" },
  { Icon: Brain, title: "المساعد الذكي", desc: "تحليل وتقارير وقرارات مدعومة بمزود AI خارجي.", accent: "rose" },
  { Icon: ShieldCheck, title: "أمان وتعدد مستأجرين", desc: "عزل بيانات كل مركز، صلاحيات RBAC، سجل تدقيق، ومراقبة صحية مستمرة.", accent: "blue" },
];

const accents: Record<string, string> = {
  blue: "text-[color:var(--blue)] bg-[color:var(--blue-soft)]",
  success: "text-[color:var(--success)] bg-[color:var(--success-soft)]",
  warning: "text-[color:var(--warning)] bg-[color:var(--warning-soft)]",
  indigo: "text-[color:var(--indigo)] bg-[color:var(--indigo-soft)]",
  violet: "text-[color:var(--violet)] bg-[color:var(--violet-soft)]",
  cyan: "text-[color:var(--cyan)] bg-[color:var(--cyan-soft)]",
  rose: "text-[color:var(--rose)] bg-[color:var(--rose-soft)]",
};

export default function Landing() {
  return (
    <div className="min-h-screen bg-[color:var(--bg)] text-[color:var(--text)] font-['IBM_Plex_Sans_Arabic']" dir="rtl">
      <header className="sticky top-0 z-40 bg-[rgba(11,15,23,0.85)] backdrop-blur-md border-b border-[color:var(--border)]">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#fbbf24] to-[#f59e0b] text-[#0b0f17] flex items-center justify-center text-lg font-bold shadow-[0_8px_22px_rgba(245,158,11,0.3)]">م</div>
            <div className="flex flex-col">
              <span className="font-bold text-[color:var(--text)] leading-tight">مركزك</span>
              <span className="text-[10px] text-[color:var(--muted)] uppercase tracking-wider">Training Center OS</span>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm text-[color:var(--muted)]">
            <a href="#modules" className="hover:text-[color:var(--text)] transition-colors">الوحدات</a>
            <a href="#why" className="hover:text-[color:var(--text)] transition-colors">لماذا مركزك</a>
            <Link href="/plans" className="hover:text-[color:var(--text)] transition-colors">الأسعار</Link>
          </nav>
          <Link href="/login" className="primary !min-h-0 py-2 px-4">دخول النظام</Link>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(900px 480px at 85% -10%, rgba(245,158,11,0.12), transparent 60%), radial-gradient(700px 400px at 10% 110%, rgba(91,155,255,0.07), transparent 55%)" }} />
        <div className="relative max-w-6xl mx-auto px-4 py-20 lg:py-28 text-center">
          <span className="badge">v2.0 — منصة SaaS عربية بالكامل</span>
          <h1 className="mt-6 text-4xl lg:text-6xl font-extrabold leading-[1.25]">
            مركزك — نظام تشغيل
            <br />
            <span className="text-[color:var(--gold)]">مراكز التدريب</span> من مكان واحد
          </h1>
          <p className="mt-6 text-lg text-[color:var(--muted)] max-w-2xl mx-auto">
            الطلاب، الدورات، الحضور، الفواتير، الشهادات والتقارير — بواجهة عربية داكنة فاخرة،
            تعدد مستأجرين، وأمان على مستوى الإنتاج.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link href="/login" className="primary px-8 py-3">ابدأ الآن <ArrowLeft size={18} /></Link>
            <a href="#modules" className="ghost px-8 py-3">استعرض الوحدات</a>
          </div>
          <div className="mt-14 flex flex-wrap items-center justify-center gap-3 text-xs text-[color:var(--muted)]">
            <span className="px-3 py-1.5 rounded-full border border-[color:var(--border)] bg-[color:var(--surface-2)]">8 وحدات تشغيلية</span>
            <span className="px-3 py-1.5 rounded-full border border-[color:var(--border)] bg-[color:var(--surface-2)]">تعدد مستأجرين (Multi-tenant)</span>
            <span className="px-3 py-1.5 rounded-full border border-[color:var(--border)] bg-[color:var(--surface-2)]">عربي RTL أصيل</span>
            <span className="px-3 py-1.5 rounded-full border border-[color:var(--border)] bg-[color:var(--surface-2)]">مدفوعات Stripe</span>
          </div>
        </div>
      </section>

      <section id="modules" className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <span className="badge">الوحدات</span>
          <h2 className="mt-4 text-3xl font-extrabold">كل ما يحتاجه مركزك… في نظام واحد</h2>
          <p className="mt-3 text-[color:var(--muted)]">وحدات متكاملة تعمل معاً — من تسجيل الطالب حتى إصدار الشهادة.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {modules.map((m) => (
            <div key={m.title} className="bento-card p-6 hover:-translate-y-1 transition-transform duration-200">
              <div className={"w-11 h-11 rounded-xl flex items-center justify-center mb-4 " + accents[m.accent]}>
                <m.Icon size={22} />
              </div>
              <h3 className="font-bold text-[color:var(--text)]">{m.title}</h3>
              <p className="mt-2 text-sm text-[color:var(--muted)] leading-relaxed">{m.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="why" className="max-w-6xl mx-auto px-4 py-16">
        <div className="bento-card p-8 lg:p-12">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div>
              <span className="badge">لماذا مركزك</span>
              <h2 className="mt-4 text-3xl font-extrabold leading-snug">مبني لمراكز التدريب السعودية والخليج</h2>
              <p className="mt-4 text-[color:var(--muted)] leading-relaxed">
                بدل الأنظمة الموروثة والمنصات الأجنبية غير العربية — واجهة RTL أصيلة،
                عملة ريال، تقارير جاهزة، ونشر سحابي سريع على Vercel مع قاعدة Neon المُدارة.
              </p>
              <ul className="mt-6 space-y-3 text-sm text-[color:var(--text-soft)]">
                <li className="flex items-center gap-2"><Layers size={16} className="text-[color:var(--gold)]" /> بنية Multi-tenant بعزل كامل للبيانات</li>
                <li className="flex items-center gap-2"><Building2 size={16} className="text-[color:var(--gold)]" /> لوحة تحكم عربية داكنة مريحة للعمل الطويل</li>
                <li className="flex items-center gap-2"><Sparkles size={16} className="text-[color:var(--gold)]" /> خارطة طريق نشطة: مكتبة ملفات، فيديو آمن، امتحانات إلكترونية</li>
              </ul>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link href="/login" className="primary px-8 py-3">ابدأ الآن <ArrowLeft size={18} /></Link>
                <Link href="/plans" className="ghost px-8 py-3">الباقات والأسعار</Link>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-2)] p-6 text-center">
                <div className="text-3xl font-black text-[color:var(--gold)]">8</div>
                <div className="mt-1 text-xs text-[color:var(--muted)]">وحدات تشغيلية</div>
              </div>
              <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-2)] p-6 text-center">
                <div className="text-3xl font-black text-[color:var(--gold)]">100%</div>
                <div className="mt-1 text-xs text-[color:var(--muted)]">واجهة عربية RTL</div>
              </div>
              <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-2)] p-6 text-center">
                <div className="text-3xl font-black text-[color:var(--gold)]">RBAC</div>
                <div className="mt-1 text-xs text-[color:var(--muted)]">صلاحيات وسجل تدقيق</div>
              </div>
              <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-2)] p-6 text-center">
                <div className="text-3xl font-black text-[color:var(--gold)]">24/7</div>
                <div className="mt-1 text-xs text-[color:var(--muted)]">مراقبة /api/health</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-[color:var(--border)] mt-8">
        <div className="max-w-6xl mx-auto px-4 py-10 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-[color:var(--muted)]">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#fbbf24] to-[#f59e0b] text-[#0b0f17] flex items-center justify-center font-bold">م</span>
            <span>مركزك — Training Center OS © 2026</span>
          </div>
          <div className="flex items-center gap-5">
            <Link href="/login" className="hover:text-[color:var(--text)] transition-colors">تسجيل الدخول</Link>
            <Link href="/plans" className="hover:text-[color:var(--text)] transition-colors">الأسعار</Link>
            <Link href="/verify" className="hover:text-[color:var(--text)] transition-colors">تحقق شهادة</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
'@
[System.IO.File]::WriteAllText($oldPage, $landing, (New-Object System.Text.UTF8Encoding($pbom)))
 $lnb = [System.IO.File]::ReadAllBytes($oldPage)
 $null = $strict.GetString($lnb)
 $ltxt = [System.IO.File]::ReadAllText($oldPage)
 $needles = @{
  brand = @(0x0645,0x0631,0x0643,0x0632,0x0643)
  cta   = @(0x0627,0x0628,0x062F,0x0623,0x20,0x0622,0x0644,0x0622,0x0646)
  mods  = @(0x0627,0x0644,0x0648,0x062D,0x062F,0x0627,0x062A)
}
foreach ($k in $needles.Keys) {
  $needle = From-Codes $needles[$k]
  if (([regex]::Matches($ltxt, [regex]::Escape($needle))).Count -lt 1) { throw ("LANDING ARABIC FAILED [" + $k + "] - resave alm-theme.ps1 as UTF-8") }
}
if (([regex]::Matches($ltxt, [regex]::Escape('var(--gold-soft)]'))).Count -lt 7) { throw "landing accents < 7" }
Write-Host ("Landing written: bytes=" + $lnb.Length + " lines=" + ([System.IO.File]::ReadAllLines($oldPage)).Count + "  Arabic OK, 7 accent cards") -ForegroundColor Green

# ============ 6. tsc + build + detect ============
Write-Host "--- tsc ---" -ForegroundColor Cyan
 $prev = $ErrorActionPreference; $ErrorActionPreference = "Continue"
& npx tsc --noEmit 2>&1 | Select-Object -First 20
 $t = $LASTEXITCODE; $ErrorActionPreference = $prev
if ($t -ne 0) { throw "tsc RED - paste output" }
Write-Host "tsc: GREEN" -ForegroundColor Green
Write-Host "--- build ---" -ForegroundColor Cyan
 $bl = Join-Path $env:TEMP "markazak-alm-build.log"
 $prev = $ErrorActionPreference; $ErrorActionPreference = "Continue"
& npm run build 2>&1 | Out-File -FilePath $bl -Encoding utf8
 $b2 = $LASTEXITCODE; $ErrorActionPreference = $prev
if ($b2 -ne 0) { Get-Content $bl | Select-Object -Last 25; throw ("build RED (" + $b2 + ")") }
Write-Host "build: GREEN" -ForegroundColor Green
Write-Host "--- DESIGN GATE (exit code) ---" -ForegroundColor Cyan
 $yesFile = Join-Path $env:TEMP "imp-yes.txt"
 $d4 = Join-Path $env:TEMP "imp-alm.out"; $e4 = Join-Path $env:TEMP "imp-alm.err"
foreach ($x in @($yesFile, $d4, $e4)) { if (Test-Path $x) { Remove-Item $x -Force } }
[System.IO.File]::WriteAllText($yesFile, "y" + [char]13 + [char]10, (New-Object System.Text.ASCIIEncoding))
 $proc = Start-Process -FilePath "cmd.exe" -ArgumentList "/c npx impeccable detect app components" -RedirectStandardInput $yesFile -RedirectStandardOutput $d4 -RedirectStandardError $e4 -NoNewWindow -Wait -PassThru
foreach ($pair in @(@("STDOUT", $d4), @("STDERR", $e4))) {
  if (Test-Path $pair[1]) { $cc = [System.IO.File]::ReadAllText($pair[1]); if ($cc.Trim().Length -gt 0) { Write-Host ("--- " + $pair[0] + " ---"); $cc -split "`n" | ForEach-Object { $l = $_.TrimEnd(); if ($l -ne '') { Write-Host ("  " + $l) } } } }
}
if ($proc.ExitCode -eq 0) { Write-Host "DESIGN GATE: CLEAN (exit 0)" -ForegroundColor Green }
elseif ($proc.ExitCode -eq 2) { throw "DESIGN GATE findings (exit 2) - see above." }
else { throw ("DESIGN GATE unexpected exit " + $proc.ExitCode) }

# ============ 7. DESIGN.md (DEC-040) ============
 $dp = Join-Path $PWD "DESIGN.md"
 $dtxt = [System.IO.File]::ReadAllText($dp)
if (-not $dtxt.Contains('DEC-040')) {
  [System.IO.File]::AppendAllText($dp, @'

## 11. Almdrasa token swap + Landing (DEC-040)
Owner-provided Almdrasa spec adopted (Modern Dark EdTech): bg #0B0F17, surfaces #131B2A/#1E293B/#243047,
borders rgba-white .08/.15, text #F8FAFC/#94A3B8/#64748B, primary amber #F59E0B/#FBBF24 (hover #D97706,
glow), CTA text #0b0f17, font IBM Plex Sans Arabic (Cairo fallback). Token VALUES swapped in globals.css
:root + amber sweep (all rgba 231->245, #e7c168->#fbbf24, #1a2440->#0b0f17) + tailwind brand block.
Structure unchanged - same components, zero layout edits. New root landing page (app/page.tsx):
navbar, hero with amber glow, 8 module cards with per-module accent tints, why-section with stats,
CTA band, footer. Old page archived to audit-out/. Gate: tsc+build+detect exit 0.
'@, (New-Object System.Text.UTF8Encoding $true))
  Write-Host "DESIGN.md: DEC-040 documented" -ForegroundColor Green
}

Write-Host "==============================================" -ForegroundColor Cyan
Write-Host "ALM-THEME COMPLETE (files + verification)." -ForegroundColor Green
Write-Host "GIT NOTE: index.lock issue still pending - after REBOOT run manually:" -ForegroundColor Yellow
Write-Host "  git add tools app components" -ForegroundColor Yellow
Write-Host "  git commit -m ""feat: almdrasa theme swap + landing page (DEC-040)""" -ForegroundColor Yellow
Write-Host "  git push -u origin main" -ForegroundColor Yellow