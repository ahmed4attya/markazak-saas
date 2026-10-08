# ============================================================
# u-close.ps1 - SCOPE U CLOSER: dashboard fix + FULL Shell rebuild
# (lesson 35: rebuild, don't patch) with grouped nav (DEC-039)
# Arabic integrity verified via codepoint needles (encoding guard)
# Run: powershell -ExecutionPolicy Bypass -File tools\u-close.ps1
# ============================================================

 $ErrorActionPreference = "Stop"
[Console]::OutputEncoding = New-Object System.Text.UTF8Encoding($false)
Write-Host "=== U-CLOSE ===" -ForegroundColor Cyan

if ($PWD.Path -ne "E:\projects\training-center-saas-fixed2\training-center-saas-final\markazak-saas") { throw ("WRONG LOCATION: " + $PWD.Path) }

 $st0 = @(git status --porcelain)
 $expectedM = @('app/globals.css','components/Shell.tsx','app/dashboard/page.tsx')
 $bad = @()
foreach ($line in $st0) {
  $st = $line.Substring(0,2); $p = $line.Substring(3)
  if (($st -eq 'M ') -or ($st -eq ' M')) { if ($expectedM -contains $p) { continue } ; $bad += $line; continue }
  if ($st -eq '??') { if ($p -like 'tools/*' -or $p -like '.impeccable*' -or $p -like '.codex*' -or $p -like '.gemini*') { continue } }
  $bad += $line
}
if ($bad.Count -gt 0) { throw ("unexpected tree state: " + ($bad -join " | ")) }
 $strict = New-Object System.Text.UTF8Encoding($false, $true)
function From-Codes { param([int[]]$Codes) (-join ($Codes | ForEach-Object { [char]$_ })) }

# ============ 1. dashboard: card.accent -> accent ============
Write-Host "--- dashboard fix ---"
 $df = 'app\dashboard\page.tsx'
 $dt = [System.IO.File]::ReadAllText($df)
 $old = '", card.accent)}"'
 $neu = '", accent)}"'
 $c = ([regex]::Matches($dt, [regex]::Escape($old))).Count
if ($c -eq 1) {
  $db = [System.IO.File]::ReadAllBytes($df)
  $dbom = ($db.Length -ge 3 -and $db[0] -eq 239 -and $db[1] -eq 187 -and $db[2] -eq 191)
  $dt = $dt.Replace($old, $neu)
  [System.IO.File]::WriteAllText($df, $dt, (New-Object System.Text.UTF8Encoding($dbom)))
  $nb = [System.IO.File]::ReadAllBytes($df); $null = $strict.GetString($nb)
  Write-Host "dashboard: card.accent -> accent FIXED" -ForegroundColor Green
} elseif (([regex]::Matches($dt, [regex]::Escape($neu))).Count -ge 1 -and $c -eq 0) {
  Write-Host "dashboard: already fixed (skip)" -ForegroundColor Yellow
} else { throw ("dashboard pattern hits=" + $c + " - paste git diff app/dashboard/page.tsx") }
 $dt2 = [System.IO.File]::ReadAllText($df)
if ($dt2.Contains('card.accent')) { throw "card.accent still present" }
if (([regex]::Matches($dt2, [regex]::Escape("accent: '"))).Count -ne 4) { throw "accents != 4" }
Write-Host "dashboard verify OK" -ForegroundColor Green

# ============ 2. Shell.tsx FULL REBUILD ============
Write-Host "--- Shell.tsx FULL REBUILD (grouped nav, DEC-039) ---"
 $sf = 'components\Shell.tsx'
 $sb = [System.IO.File]::ReadAllBytes($sf)
 $sbom = ($sb.Length -ge 3 -and $sb[0] -eq 239 -and $sb[1] -eq 187 -and $sb[2] -eq 191)
 $tsx = @'
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, Users, GraduationCap, BookOpen, Layers, CalendarCheck,
  Wallet, FileBadge, BarChart3, Brain, UserCog, Settings, LogOut, Search,
  Bell, Building2, ChevronDown, Menu, TrendingUp, ClipboardList, CreditCard,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const groups = [
  { title: 'الرئيسية', items: [['/dashboard', 'لوحة التحكم', LayoutDashboard]] },
  {
    title: 'العمليات',
    items: [
      ['/students', 'الطلاب', Users],
      ['/teachers', 'المعلمون', GraduationCap],
      ['/courses', 'الدورات', BookOpen],
      ['/groups', 'المجموعات', Layers],
      ['/attendance', 'الحضور والغياب', CalendarCheck],
      ['/finance', 'الفواتير والمدفوعات', Wallet],
      ['/certificates', 'الشهادات', FileBadge],
    ],
  },
  {
    title: 'التواصل السريع',
    items: [
      ['soon:analytics', 'التحليلات', TrendingUp],
      ['/reports', 'التقارير', BarChart3],
      ['/ai', 'المساعد الذكي', Brain],
    ],
  },
  {
    title: 'الإدارة',
    items: [
      ['/users', 'المستخدمون والصلاحيات', UserCog],
      ['/settings', 'إعدادات المركز', Settings],
      ['/plans', 'الاشتراك', CreditCard],
      ['soon:audit', 'سجل التدقيق', ClipboardList],
    ],
  },
] as const;

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}

export default function Shell({
  children,
  title,
  subtitle,
}: {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [dateStr, setDateStr] = useState('');

  useEffect(() => {
    setDateStr(new Date().toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'long' }));
  }, []);

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  }

  return (
    <div className="flex min-h-screen bg-[color:var(--bg)] text-[color:var(--text)] font-['Cairo']" dir="rtl">
      <aside
        className={cn(
          'fixed inset-y-0 right-0 z-50 w-72 bg-[color:var(--surface)] border-l border-[color:var(--border)] transition-transform duration-300 ease-in-out',
          open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="flex flex-col h-full p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#f2d38b] to-[#d9a83f] text-[#1a2440] flex items-center justify-center text-xl font-bold shadow-[0_10px_26px_rgba(231,193,104,0.3)]">
              م
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold text-[color:var(--text)] leading-tight">مركزك</span>
              <span className="text-[10px] text-[color:var(--muted)] font-medium uppercase tracking-wider">Training Center OS</span>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-[color:var(--surface-2)] border border-[color:var(--border)] text-[color:var(--text-soft)] text-xs font-medium mb-2 cursor-pointer hover:bg-[color:var(--surface-3)] transition-colors">
            <div className="flex items-center gap-2">
              <Building2 size={16} className="text-[color:var(--muted-dim)]" />
              <span>أكاديمية الريادة</span>
            </div>
            <ChevronDown size={14} />
          </div>

          <div className="flex items-center gap-2 p-2 rounded-xl bg-[color:var(--gold-soft)] border border-[color:var(--gold-border)] text-[color:var(--gold)] text-[11px] font-bold mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-[color:var(--gold)]" />
            <span>اشتراك نشط — خطة الاحترافية</span>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto nav-scroll">
            {groups.map((g) => (
              <div key={g.title}>
                <p className="text-[11px] font-bold text-[color:var(--muted-dim)] uppercase tracking-widest mb-2 px-3">{g.title}</p>
                <nav className="space-y-1">
                  {g.items.map(([href, label, Icon]) => {
                    if (href.startsWith('soon:')) {
                      return (
                        <div key={href} className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-[color:var(--muted-dim)] cursor-default">
                          <Icon size={18} />
                          <span>{label}</span>
                          <span className="mr-auto text-[9px] px-1.5 py-0.5 rounded-md bg-[color:var(--surface-3)] text-[color:var(--muted)]">قريباً</span>
                        </div>
                      );
                    }
                    const isActive = pathname === href;
                    return (
                      <Link
                        key={href}
                        href={href}
                        onClick={() => setOpen(false)}
                        className={cn(
                          'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 group',
                          isActive
                            ? 'bg-[color:var(--gold-soft)] text-[color:var(--gold)] shadow-sm'
                            : 'text-[color:var(--muted)] hover:bg-[color:var(--surface-2)] hover:text-[color:var(--text)]'
                        )}
                      >
                        <Icon size={18} className={cn(isActive ? 'text-[color:var(--gold)]' : 'text-[color:var(--muted)] group-hover:text-[color:var(--text)]')} />
                        <span>{label}</span>
                      </Link>
                    );
                  })}
                </nav>
              </div>
            ))}
          </div>

          <div className="mt-auto pt-4 border-t border-[color:var(--border)]">
            <div className="flex items-center gap-3 p-2.5 rounded-xl bg-[color:var(--surface-2)] border border-[color:var(--border)] mb-3">
              <div className="w-9 h-9 rounded-lg bg-[color:var(--gold-soft)] text-[color:var(--gold)] flex items-center justify-center font-bold text-sm">م</div>
              <div className="flex flex-col overflow-hidden">
                <span className="text-xs font-bold text-[color:var(--text-soft)] truncate">مدير النظام</span>
                <span className="text-[10px] text-[color:var(--muted)] truncate">مالك المركز</span>
              </div>
            </div>
            <button
              onClick={logout}
              className="flex items-center gap-3 w-full px-3 py-2 text-sm font-medium text-[color:var(--muted)] hover:text-[color:var(--danger)] hover:bg-[color:var(--danger-soft)] rounded-lg transition-all duration-200"
            >
              <LogOut size={18} />
              <span>تسجيل الخروج</span>
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 lg:mr-72 min-h-screen flex flex-col transition-all duration-300">
        <header className="h-16 bg-[rgba(18,27,49,0.85)] backdrop-blur-md border-b border-[color:var(--border)] sticky top-0 z-40 px-4 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => setOpen(true)} className="lg:hidden p-2 text-[color:var(--muted)] hover:bg-[color:var(--surface-2)] rounded-lg transition-colors">
              <Menu size={20} />
            </button>
            <div className="relative group">
              <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-[color:var(--muted-dim)] group-focus-within:text-[color:var(--gold)] transition-colors" />
              <input
                className="bg-[color:var(--surface-2)] border border-[color:var(--border)] rounded-full py-2 pr-10 pl-4 text-sm w-56 lg:w-80 focus:ring-2 focus:ring-[rgba(91,155,255,0.25)] focus:bg-[color:var(--surface-3)] transition-all outline-none text-[color:var(--text)] placeholder:text-[color:var(--muted-dim)]"
                placeholder="ابحث عن طالب، دورة، فاتورة..."
              />
            </div>
            <span className="hidden md:block text-xs text-[color:var(--muted)] font-medium">{dateStr}</span>
          </div>
          <div className="flex items-center gap-3">
            <button className="p-2 text-[color:var(--muted)] hover:bg-[color:var(--surface-2)] rounded-full relative transition-colors">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-[color:var(--surface)]"></span>
            </button>
            <div className="h-8 w-[1px] bg-[color:var(--border-strong)] mx-1"></div>
            <div className="flex items-center gap-3 pl-2">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-xs font-bold text-[color:var(--text-soft)]">مدير النظام</span>
                <span className="text-[10px] text-[color:var(--muted)]">أكاديمية الريادة</span>
              </div>
              <div className="w-9 h-9 rounded-full bg-[color:var(--gold)] text-[#1a2440] flex items-center justify-center font-bold text-sm shadow-sm">م</div>
            </div>
          </div>
        </header>

        <section className="p-4 lg:p-8 flex-1">
          <div className="mb-8">
            <h1 className="text-2xl lg:text-3xl font-bold text-[color:var(--text)] leading-tight">{title}</h1>
            {subtitle && <p className="text-[color:var(--muted)] text-sm mt-1">{subtitle}</p>}
          </div>
          <AnimatePresence>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
              {children}
            </motion.div>
          </AnimatePresence>
        </section>
      </main>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 bg-[rgba(2,6,16,0.5)] backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>
    </div>
  );
}
'@
[System.IO.File]::WriteAllText($sf, $tsx, (New-Object System.Text.UTF8Encoding($sbom)))
 $snb = [System.IO.File]::ReadAllBytes($sf)
 $null = $strict.GetString($snb)
 $snbom = ($snb.Length -ge 3 -and $snb[0] -eq 239 -and $snb[1] -eq 187 -and $snb[2] -eq 191)
if ($snbom -ne $sbom) { throw "Shell BOM state changed" }
 $slines = ($tsx.TrimEnd([char]10, [char]13) -split "\r?\n").Count
 $slinesDisk = ([System.IO.File]::ReadAllLines($sf)).Count
Write-Host ("Shell written: bytes=" + $snb.Length + " lines=" + $slinesDisk + " (source=" + $slines + ")")
if ($slinesDisk -ne $slines) { throw "Shell line count mismatch" }
 $stx = [System.IO.File]::ReadAllText($sf)

# ---- Arabic integrity (codepoint needles - catches editor encoding corruption) ----
 $needles = @{
  dashboardLbl = @(0x0644,0x0648,0x062D,0x0629,0x20,0x0627,0x0644,0x062A,0x062D,0x0643,0x0645)
  soonLbl      = @(0x0642,0x0631,0x064A,0x0628,0x0627,0x064B)
  subLbl       = @(0x0627,0x0634,0x062A,0x0631,0x0627,0x0643,0x20,0x0646,0x0634,0x0637)
  auditLbl     = @(0x0633,0x062C,0x0644,0x20,0x0627,0x0644,0x062A,0x062F,0x0642,0x064A,0x0642)
  quickLbl     = @(0x0627,0x0644,0x062A,0x0648,0x0627,0x0635,0x0644,0x20,0x0627,0x0644,0x0633,0x0631,0x064A,0x0639)
  usersLbl     = @(0x0627,0x0644,0x0645,0x0633,0x062A,0x062E,0x062F,0x0645,0x0648,0x0646,0x20,0x0648,0x0627,0x0644,0x0635,0x0644,0x0627,0x062D,0x064A,0x0627,0x062A)
}
foreach ($k in $needles.Keys) {
  $needle = From-Codes $needles[$k]
  if (([regex]::Matches($stx, [regex]::Escape($needle))).Count -lt 1) {
    throw ("ARABIC INTEGRITY FAILED for [" + $k + "] - tools\u-close.ps1 was NOT saved as UTF-8. Re-save the file with UTF-8 encoding and rerun.")
  }
}
Write-Host "Arabic integrity: 6 codepoint needles OK" -ForegroundColor Green

# ---- structure: gold by parts + nav-scroll + soon items + zero legacy in aside ----
 $cB = ([regex]::Matches($stx, [regex]::Escape('isActive ? ''text-[color:var(--gold)]'''))).Count
 $cA = ([regex]::Matches($stx, [regex]::Escape('bg-[color:var(--gold-soft)] text-[color:var(--gold)]'))).Count
 $cS = ([regex]::Matches($stx, [regex]::Escape('group-focus-within:text-[color:var(--gold)]'))).Count
Write-Host ("gold parts: navIcons=" + $cB + "/2  goldSoft+text=" + $cA + "/3  searchIcon=" + $cS + "/1")
if ($cB -ne 2 -or $cA -ne 3 -or $cS -ne 1) { throw "gold parts mismatch" }
foreach ($p in @('nav-scroll','soon:analytics','soon:audit','groups.map')) {
  if (([regex]::Matches($stx, [regex]::Escape($p))).Count -lt 1) { throw ("Shell missing: " + $p) }
}
 $sideStart = $stx.IndexOf('<aside'); $sideEnd = $stx.IndexOf('</aside>')
 $sidebar = $stx.Substring($sideStart, $sideEnd - $sideStart)
foreach ($a in @('bg-white','bg-slate-50','bg-slate-100','border-slate-200','text-slate-800','text-slate-500','text-slate-400','no-scrollbar','bg-blue-600','py-2.5')) {
  if (([regex]::Matches($sidebar, [regex]::Escape($a))).Count -ne 0) { throw ("SIDEBAR contains [" + $a + "]") }
}
Write-Host "Shell verify: grouped nav + gold + tokens ALL OK" -ForegroundColor Green

# ============ 3. globals verify-only (done by v3) ============
 $gt = [System.IO.File]::ReadAllText('app\globals.css')
if (([regex]::Matches($gt, [regex]::Escape('#fcd34d'))).Count -lt 1) { throw "amber CTA missing in globals" }
if (([regex]::Matches($gt, [regex]::Escape('.nav-scroll::-webkit-scrollbar'))).Count -lt 1) { throw "nav-scroll css missing" }
Write-Host "globals verify: amber CTA + nav-scroll OK" -ForegroundColor Green

# ============ 4. tsc + build ============
& npx tsc --noEmit 2>&1 | Select-Object -First 20
if ($LASTEXITCODE -ne 0) { throw "tsc RED - paste output" }
Write-Host "tsc: GREEN" -ForegroundColor Green
 $bl = Join-Path $env:TEMP "markazak-uc-build.log"
& npm run build 2>&1 | Out-File -FilePath $bl -Encoding utf8
if ($LASTEXITCODE -ne 0) { Get-Content $bl | Select-Object -Last 25; throw "build RED" }
Write-Host "build: GREEN" -ForegroundColor Green

# ============ 5. DESIGN GATE (exit code) ============
 $yesFile = Join-Path $env:TEMP "imp-yes.txt"
 $dt3 = Join-Path $env:TEMP "imp-dc.out"; $de3 = Join-Path $env:TEMP "imp-dc.err"
foreach ($x in @($yesFile, $dt3, $de3)) { if (Test-Path $x) { Remove-Item $x -Force } }
[System.IO.File]::WriteAllText($yesFile, "y" + [char]13 + [char]10, (New-Object System.Text.ASCIIEncoding))
 $proc = Start-Process -FilePath "cmd.exe" -ArgumentList "/c npx impeccable detect app components" -RedirectStandardInput $yesFile -RedirectStandardOutput $dt3 -RedirectStandardError $de3 -NoNewWindow -Wait -PassThru
foreach ($pair in @(@("STDOUT", $dt3), @("STDERR", $de3))) {
  if (Test-Path $pair[1]) { $cc = [System.IO.File]::ReadAllText($pair[1]); if ($cc.Trim().Length -gt 0) { Write-Host ("--- " + $pair[0] + " ---"); $cc -split "`n" | ForEach-Object { $l = $_.TrimEnd(); if ($l -ne '') { Write-Host ("  " + $l) } } } }
}
if ($proc.ExitCode -eq 0) { Write-Host "DESIGN GATE: CLEAN (exit 0)" -ForegroundColor Green }
elseif ($proc.ExitCode -eq 2) { throw "DESIGN GATE findings (exit 2) - see above. Nothing committed." }
else { throw ("DESIGN GATE unexpected exit " + $proc.ExitCode) }

# ============ 6. DESIGN.md (DEC-039) ============
 $dp = Join-Path $PWD "DESIGN.md"
if (-not ([System.IO.File]::ReadAllText($dp)).Contains('DEC-039')) {
  $sec = @'

## 10. Sidebar IA rebuild (DEC-039)
Owner provided target IA (Future-Center style, adopted): grouped sections -
Home [Dashboard] / Operations [Students, Teachers, Courses, Groups, Attendance, Finance, Certificates] /
Quick access [Analytics(soon), Reports, AI] / Admin [Users, Settings, Subscription, Audit log(soon)].
Plus: subscription badge pill (static text until Scope 6 wires real plan), live date in topbar (mount-only, no hydration risk),
nav-scroll visible thin scrollbar, compact density. Shell.tsx REBUILT completely (lesson 35) - single source of truth.
Analytics + Audit-log pages are future scopes; placeholders render disabled with badge.
'@
  [System.IO.File]::AppendAllText($dp, $sec, (New-Object System.Text.UTF8Encoding $true))
  Write-Host "DESIGN.md: DEC-039 appended" -ForegroundColor Green
}

# ============ 7. stage + GATE + commit + push ============
 $allow = @('app/globals.css','components/Shell.tsx','app/dashboard/page.tsx','DESIGN.md','tools/u-close.ps1','tools/u-mofeed3.ps1','tools/u-mofeed2.ps1','tools/u-mofeed.ps1')
foreach ($p in $allow) { if (Test-Path $p) { git add -- $p } }
 $staged = @(git diff --cached --name-only)
Write-Host ("staged: " + $staged.Count)
 $staged | ForEach-Object { Write-Host ("  + " + $_) }
if ($staged.Count -lt 4) { throw "staged too few" }

& powershell -ExecutionPolicy Bypass -File tools\pre-push.ps1
if ($LASTEXITCODE -ne 0) { Write-Host "GATE RED - nothing committed." -ForegroundColor Red; exit 1 }

git commit -m "feat(u): grouped sidebar IA + subscription pill + topbar date, shell rebuilt, dashboard accent fix (DEC-039)"
if ($LASTEXITCODE -ne 0) { throw "commit failed" }
git push -u origin main
if ($LASTEXITCODE -ne 0) { throw "push failed" }
Write-Host "SHIPPED - live in 2-3 min." -ForegroundColor Green
Write-Host "VERIFY: sidebar grouped sections, ALL links reachable, subscription pill, topbar date, module-colored cards, amber CTA"