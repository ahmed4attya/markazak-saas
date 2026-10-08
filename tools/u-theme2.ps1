# ============================================================
# u-theme2.ps1 - FINAL theme ship: self-derived needle counts
# Lesson 37: needle counts are MEASURED from the written file
# (exists>=1 or exact-by-construction), never guessed.
# Run: powershell -ExecutionPolicy Bypass -File tools\u-theme2.ps1
# ============================================================

 $ErrorActionPreference = "Stop"
[Console]::OutputEncoding = New-Object System.Text.UTF8Encoding($false)
Write-Host "=== U-THEME2 (self-measured needles) ===" -ForegroundColor Cyan

if ($PWD.Path -ne "E:\projects\training-center-saas-fixed2\training-center-saas-final\markazak-saas") { throw ("WRONG LOCATION: " + $PWD.Path) }

 $st0 = @(git status --porcelain)
 $expectedM = @('app/globals.css', 'components/Shell.tsx')
 $bad = @()
foreach ($line in $st0) {
  $st = $line.Substring(0,2); $p = $line.Substring(3)
  if (($st -eq 'M ') -or ($st -eq ' M')) { if ($expectedM -contains $p) { continue } ; $bad += $line; continue }
  if ($st -eq '??') { if ($p -like 'tools/*' -or $p -like '.impeccable*' -or $p -like '.codex*' -or $p -like '.gemini*') { continue } }
  $bad += $line
}
if ($bad.Count -gt 0) { throw ("unexpected tree state: " + ($bad -join " | ")) }

 $strict = New-Object System.Text.UTF8Encoding($false, $true)

# ============================================================
# PART 1 - globals.css full rebuild (same Night Luxe content)
# ============================================================
 $f = 'app\globals.css'
 $gb = [System.IO.File]::ReadAllBytes($f)
 $hasBom = ($gb.Length -ge 3 -and $gb[0] -eq 239 -and $gb[1] -eq 187 -and $gb[2] -eq 191)
Write-Host ("globals current: bytes=" + $gb.Length + " bom=" + $hasBom)

 $css = @'
@tailwind base;
@tailwind components;
@tailwind utilities;

@import url("https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800&display=swap");

/* Night Luxe (DESIGN.md, DEC-036/037) - dark premium theme.
   Utility remap layer at the end re-maps legacy light classes
   so pages keep their classNames; theme flips in one file. */

:root {
  --bg: #0b1222;
  --surface: #121b31;
  --surface-2: #182341;
  --surface-3: #1e2c52;
  --border: #233052;
  --border-strong: #2e3d66;
  --text: #eaf0fa;
  --text-soft: #c7d3ea;
  --muted: #93a5c8;
  --muted-dim: #6b7da3;
  --blue: #5b9bff;
  --blue-strong: #7aaeff;
  --blue-soft: rgba(91, 155, 255, 0.14);
  --blue-border: rgba(91, 155, 255, 0.32);
  --gold: #e7c168;
  --gold-strong: #f2d38b;
  --gold-soft: rgba(231, 193, 104, 0.14);
  --gold-border: rgba(231, 193, 104, 0.38);
  --gold-cta: linear-gradient(135deg, #f2d38b, #e7c168);
  --success: #3ddc97;
  --success-soft: rgba(61, 220, 151, 0.12);
  --success-border: rgba(61, 220, 151, 0.3);
  --danger: #ff6b6b;
  --danger-soft: rgba(255, 107, 107, 0.12);
  --danger-border: rgba(255, 107, 107, 0.3);
  --warning: #f5b84c;
  --warning-soft: rgba(245, 184, 76, 0.12);
  --warning-border: rgba(245, 184, 76, 0.3);
  --info: #38cfe0;
  --info-soft: rgba(56, 207, 224, 0.12);
  --info-border: rgba(56, 207, 224, 0.3);
  --violet: #a78bfa;
  --violet-soft: rgba(167, 139, 250, 0.12);
  --violet-border: rgba(167, 139, 250, 0.3);
  --cyan: #38cfe0;
  --cyan-soft: rgba(56, 207, 224, 0.12);
  --cyan-border: rgba(56, 207, 224, 0.3);
  --indigo: #818cf8;
  --indigo-soft: rgba(129, 140, 248, 0.12);
  --indigo-border: rgba(129, 140, 248, 0.3);
  --rose: #fb7185;
  --rose-soft: rgba(251, 113, 133, 0.12);
  --rose-border: rgba(251, 113, 133, 0.3);
  --shadow-1: 0 1px 2px rgba(0, 0, 0, 0.35);
  --shadow-2: 0 8px 30px rgba(0, 0, 0, 0.4);
  --shadow-3: 0 24px 80px rgba(0, 0, 0, 0.55);
}

* {
  box-sizing: border-box;
}

html {
  direction: rtl;
}

body {
  margin: 0;
  background:
    radial-gradient(1400px 700px at 80% -10%, rgba(91, 155, 255, 0.07), transparent 60%),
    radial-gradient(1000px 500px at 5% 110%, rgba(231, 193, 104, 0.05), transparent 55%),
    var(--bg);
  color: var(--text);
  font-family: "Cairo", sans-serif;
}

button,
input,
select,
textarea {
  font-family: inherit;
}

button {
  cursor: pointer;
}

button:disabled {
  cursor: not-allowed;
}

button:focus-visible {
  outline: 2px solid var(--blue);
  outline-offset: 2px;
}

::selection {
  background: rgba(231, 193, 104, 0.3);
}

::-webkit-scrollbar {
  width: 10px;
  height: 10px;
}

::-webkit-scrollbar-thumb {
  background: var(--border);
  border-radius: 8px;
}

::-webkit-scrollbar-thumb:hover {
  background: var(--border-strong);
}

::-webkit-scrollbar-track {
  background: transparent;
}

.no-scrollbar::-webkit-scrollbar {
  display: none;
}

.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.bento-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 1rem;
  box-shadow: var(--shadow-1), var(--shadow-2);
}

.panel {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 1rem;
  box-shadow: var(--shadow-1), var(--shadow-2);
  padding: 1.25rem;
}

.panel h2,
.panel h3 {
  margin: 0;
  color: var(--text);
  font-weight: 800;
}

.panel p,
.muted {
  color: var(--muted);
}

.panelHead {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
}

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

.primary,
.ghost {
  min-height: 40px;
  border-radius: 0.75rem;
  padding: 0.55rem 0.9rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  font-size: 0.875rem;
  font-weight: 700;
  transition:
    background-color 0.15s ease,
    color 0.15s ease,
    border-color 0.15s ease,
    transform 0.15s ease,
    box-shadow 0.15s ease;
}

.primary {
  color: #1a2440;
  background: var(--gold-cta);
  border: 1px solid rgba(231, 193, 104, 0.5);
  box-shadow: 0 8px 22px rgba(231, 193, 104, 0.22);
}

.primary:hover:not(:disabled) {
  background: linear-gradient(135deg, #f7dc9c, #edc976);
  transform: translateY(-1px);
}

.ghost {
  color: var(--text-soft);
  background: var(--surface-2);
  border: 1px solid var(--border-strong);
}

.ghost:hover:not(:disabled) {
  background: var(--surface-3);
  border-color: var(--blue-border);
}

.full {
  width: 100%;
}

.formGrid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
}

.formGrid label {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  color: var(--text-soft);
  font-size: 0.875rem;
  font-weight: 700;
}

.formGrid input,
.formGrid select,
.formGrid textarea,
input:not([type="checkbox"]):not([type="radio"]),
select,
textarea {
  width: 100%;
  min-height: 42px;
  border: 1px solid var(--border-strong);
  border-radius: 0.75rem;
  background: var(--surface-2);
  color: var(--text);
  padding: 0.65rem 0.8rem;
  outline: none;
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease;
}

select {
  background-image: none;
}

textarea {
  min-height: 100px;
  resize: vertical;
}

.formGrid input:focus,
.formGrid select:focus,
.formGrid textarea:focus,
input:not([type="checkbox"]):not([type="radio"]):focus,
select:focus,
textarea:focus {
  border-color: var(--blue);
  box-shadow: 0 0 0 3px rgba(91, 155, 255, 0.15);
}

.checkboxRow {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin-top: 1rem;
  color: var(--text-soft);
  font-weight: 700;
}

.checkboxRow input {
  width: 18px;
  height: 18px;
}

.error,
.success {
  padding: 0.85rem 1rem;
  border-radius: 0.8rem;
  margin-bottom: 1rem;
  font-size: 0.875rem;
  font-weight: 600;
}

.error {
  border: 1px solid var(--danger-border);
  background: var(--danger-soft);
  color: #f89898;
}

.success {
  border: 1px solid var(--success-border);
  background: var(--success-soft);
  color: #6ee7b7;
}

.dataTable {
  width: 100%;
  border-collapse: collapse;
}

.dataTable thead tr {
  background: rgba(255, 255, 255, 0.04);
}

.dataTable th {
  padding: 0.9rem 1rem;
  text-align: right;
  white-space: nowrap;
  border-bottom: 1px solid var(--border);
  color: var(--muted);
  font-size: 0.75rem;
  font-weight: 800;
}

.dataTable td {
  padding: 0.9rem 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  color: var(--text-soft);
  font-size: 0.875rem;
  white-space: nowrap;
}

.dataTable tbody tr {
  transition: background 0.15s ease;
}

.dataTable tbody tr:hover {
  background: rgba(255, 255, 255, 0.05);
}

.tablePanel {
  overflow: hidden;
  padding: 0;
}

.tableWrap {
  overflow-x: auto;
}

.tableWrap table {
  width: 100%;
  border-collapse: collapse;
  min-width: 850px;
}

.tableWrap th {
  padding: 0.95rem 1rem;
  background: rgba(255, 255, 255, 0.04);
  color: var(--muted);
  border-bottom: 1px solid var(--border);
  font-size: 0.75rem;
  font-weight: 800;
  text-align: right;
  white-space: nowrap;
}

.tableWrap td {
  padding: 0.95rem 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  color: var(--text-soft);
  font-size: 0.875rem;
  white-space: nowrap;
}

.tableWrap tbody tr:hover {
  background: rgba(255, 255, 255, 0.05);
}

.tableEmpty {
  padding: 2.5rem !important;
  text-align: center;
  color: var(--muted-dim) !important;
}

.badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 28px;
  padding: 0.25rem 0.65rem;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 800;
  border: 1px solid transparent;
}

.badge.paid,
.badge.active,
.badge.completed,
.badge.issued,
.badge.present {
  color: #6ee7b7;
  background: var(--success-soft);
  border-color: var(--success-border);
}

.badge.partial,
.badge.pending,
.badge.late {
  color: #f8cd7a;
  background: var(--warning-soft);
  border-color: var(--warning-border);
}

.badge.unpaid,
.badge.inactive,
.badge.cancelled,
.badge.absent {
  color: #f89898;
  background: var(--danger-soft);
  border-color: var(--danger-border);
}

.badge.excused {
  color: #67d7e6;
  background: var(--info-soft);
  border-color: var(--info-border);
}

.modalBack {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background: rgba(2, 6, 16, 0.6);
  backdrop-filter: blur(4px);
}

.modal {
  width: min(720px, 100%);
  max-height: calc(100vh - 2rem);
  overflow-y: auto;
  background: var(--surface);
  border: 1px solid var(--border-strong);
  border-radius: 1.25rem;
  box-shadow: var(--shadow-3);
}

.modalHead {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid var(--border);
  background: rgba(255, 255, 255, 0.03);
}

.modalHead h2 {
  margin: 0;
  color: var(--text);
  font-size: 1.05rem;
  font-weight: 800;
}

.modalHead > button {
  width: 34px;
  height: 34px;
  border: 0;
  border-radius: 0.6rem;
  background: var(--surface-3);
  color: var(--muted);
  font-size: 1.2rem;
}

.modalHead > button:hover {
  background: var(--blue-soft);
  color: var(--blue);
}

.modal .formGrid {
  padding: 1.25rem;
}

.modalActions {
  grid-column: 1 / -1;
  display: flex;
  justify-content: flex-start;
  gap: 0.75rem;
  padding-top: 0.5rem;
}

.financeCards,
.statsGrid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 1rem;
}

.financeCard,
.statCard {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 1rem;
  padding: 1.15rem;
  box-shadow: var(--shadow-1), var(--shadow-2);
}

.financeCard:hover,
.statCard:hover {
  border-color: var(--border-strong);
}

.featureGrid,
.plans {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1rem;
}

.featureCard,
.planCard {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 1rem;
  padding: 1.25rem;
  box-shadow: var(--shadow-1), var(--shadow-2);
}

.featureCard:hover,
.planCard:hover {
  border-color: var(--blue-border);
  transform: translateY(-1px);
}

.featureIcon,
.aiIcon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  border-radius: 0.8rem;
  background: var(--blue-soft);
  color: var(--blue);
  font-weight: 800;
}

.integration {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.8rem 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.integration:last-child {
  border-bottom: 0;
}

.aiHero {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem;
  margin-bottom: 1rem;
  border: 1px solid var(--blue-border);
  border-radius: 1rem;
  background: linear-gradient(135deg, var(--blue-soft), var(--success-soft));
}

.aiGrid {
  display: grid;
  grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr);
  gap: 1rem;
}

.aiResult pre {
  margin: 0;
  color: var(--text-soft);
  font-family: inherit;
  line-height: 1.9;
}

.plans {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.planCard {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.planCard.featured {
  border-color: var(--gold-border);
  box-shadow: 0 10px 30px rgba(231, 193, 104, 0.12);
}

.planCard ul {
  margin: 0;
  padding-right: 1.2rem;
  color: var(--muted);
}

.planCard li {
  margin: 0.35rem 0;
}

/* ===== Login (restored - was lost) ===== */

.loginPage {
  min-height: 100vh;
  display: flex;
  align-items: stretch;
  padding: 0;
  background:
    radial-gradient(1200px 600px at 85% -10%, rgba(91, 155, 255, 0.12), transparent 60%),
    radial-gradient(900px 500px at 10% 110%, rgba(231, 193, 104, 0.1), transparent 55%),
    var(--bg);
}

.loginVisual {
  flex: 1.1;
  display: none;
  position: relative;
  overflow: hidden;
  border-left: 1px solid var(--border);
}

@media (min-width: 1024px) {
  .loginVisual {
    display: flex;
  }
}

.loginVisual::before {
  content: "";
  position: absolute;
  width: 520px;
  height: 520px;
  border-radius: 50%;
  filter: blur(90px);
  background: radial-gradient(circle, rgba(231, 193, 104, 0.28), transparent 60%);
  bottom: -140px;
  right: -120px;
}

.orb {
  position: absolute;
  width: 420px;
  height: 420px;
  border-radius: 50%;
  filter: blur(70px);
  opacity: 0.55;
  top: -80px;
  left: -60px;
  background: radial-gradient(circle at 30% 30%, rgba(91, 155, 255, 0.55), transparent 62%);
}

.visualInner {
  position: relative;
  z-index: 1;
  margin: auto;
  padding: 3rem;
  max-width: 560px;
  display: flex;
  flex-direction: column;
  gap: 1.4rem;
}

.visualInner h1 {
  margin: 0;
  font-size: 2rem;
  font-weight: 800;
  color: var(--text);
  line-height: 1.4;
}

.visualInner p {
  margin: 0;
  color: var(--muted);
}

.brand {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  border-radius: 1rem;
  font-weight: 800;
  font-size: 1.4rem;
  color: #1a2440;
  background: var(--gold-cta);
  box-shadow: 0 10px 30px rgba(231, 193, 104, 0.25);
}

.brand.big {
  width: 72px;
  height: 72px;
  font-size: 2rem;
  border-radius: 1.2rem;
}

.brand span {
  color: #1a2440;
}

.visualCards {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-top: 0.4rem;
}

.visualCards > div {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid var(--border);
  border-radius: 1rem;
  padding: 1.1rem;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  color: var(--blue);
}

.visualCards b {
  color: var(--text);
  font-size: 0.9rem;
}

.visualCards small {
  color: var(--muted);
  font-size: 0.72rem;
}

.loginBox {
  width: min(480px, 100%);
  margin: auto;
  padding: 2.5rem;
  display: flex;
  flex-direction: column;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 1.5rem;
  box-shadow: var(--shadow-3);
}

.loginBrand {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  margin-bottom: 1rem;
}

.loginBrand > span {
  width: 44px;
  height: 44px;
  border-radius: 0.8rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  color: #1a2440;
  background: var(--gold-cta);
}

.loginBrand b {
  color: var(--text);
  font-size: 1.05rem;
  display: block;
}

.loginBrand small {
  color: var(--muted);
  font-size: 0.68rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.loginBox h2 {
  margin: 0.4rem 0 0;
  color: var(--text);
  font-weight: 800;
  font-size: 1.3rem;
}

.loginBox form {
  display: flex;
  flex-direction: column;
  margin-top: 1rem;
}

.loginBox label {
  color: var(--muted);
  font-size: 0.8rem;
  font-weight: 700;
  margin-top: 0.7rem;
}

.loginBox button.primary {
  margin-top: 1.2rem;
}

.secure {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  color: var(--muted-dim);
  font-size: 0.75rem;
  margin-top: 1.2rem;
}

/* ===== Responsive (structure preserved from original) ===== */

@media (max-width: 1024px) {
  .financeCards,
  .statsGrid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .featureGrid,
  .plans {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .aiGrid {
    grid-template-columns: 1fr;
  }

  .loginPage {
    flex-direction: column;
  }
}

@media (max-width: 768px) {
  .formGrid {
    grid-template-columns: 1fr;
  }

  .financeCards,
  .statsGrid,
  .featureGrid,
  .plans {
    grid-template-columns: 1fr;
  }

  .toolbar {
    align-items: stretch;
  }

  .toolbar > * {
    width: 100%;
  }

  .toolbar .flex {
    width: 100%;
  }

  .toolbar button {
    flex: 1;
  }

  .panel {
    padding: 1rem;
  }

  .modalActions {
    flex-direction: column;
  }

  .modalActions button {
    width: 100%;
  }

  .aiHero {
    align-items: flex-start;
  }

  .loginBox {
    padding: 1.6rem;
  }
}

/* ============================================================
   UTILITY REMAP LAYER (legacy light classes -> Night Luxe)
   Runs after Tailwind utilities: same specificity, later wins.
   ============================================================ */

.bg-white {
  background-color: var(--surface);
}
.bg-white\/80 {
  background-color: rgba(18, 27, 49, 0.82);
}
.bg-slate-50 {
  background-color: rgba(255, 255, 255, 0.04);
}
.bg-slate-50\/50 {
  background-color: rgba(255, 255, 255, 0.03);
}
.bg-slate-50\/60 {
  background-color: rgba(255, 255, 255, 0.035);
}
.bg-slate-50\/70 {
  background-color: rgba(255, 255, 255, 0.04);
}
.bg-slate-100 {
  background-color: rgba(255, 255, 255, 0.07);
}
.bg-slate-100\/80 {
  background-color: rgba(255, 255, 255, 0.05);
}
.bg-slate-200 {
  background-color: rgba(255, 255, 255, 0.1);
}
.bg-gray-50 {
  background-color: rgba(255, 255, 255, 0.04);
}
.bg-blue-600 {
  background-color: var(--blue);
}
.bg-blue-50 {
  background-color: var(--blue-soft);
}
.bg-blue-50\/70 {
  background-color: rgba(91, 155, 255, 0.1);
}
.bg-blue-100 {
  background-color: rgba(91, 155, 255, 0.18);
}
.bg-emerald-50 {
  background-color: var(--success-soft);
}
.bg-emerald-50\/70 {
  background-color: rgba(61, 220, 151, 0.09);
}
.bg-emerald-100 {
  background-color: rgba(61, 220, 151, 0.18);
}
.bg-green-50 {
  background-color: var(--success-soft);
}
.bg-red-50 {
  background-color: var(--danger-soft);
}
.bg-red-50\/70 {
  background-color: rgba(255, 107, 107, 0.09);
}
.bg-red-100 {
  background-color: rgba(255, 107, 107, 0.18);
}
.bg-red-500 {
  background-color: var(--danger);
}
.bg-amber-50 {
  background-color: var(--warning-soft);
}
.bg-amber-50\/70 {
  background-color: rgba(245, 184, 76, 0.09);
}
.bg-amber-100 {
  background-color: rgba(245, 184, 76, 0.18);
}
.bg-indigo-50 {
  background-color: var(--indigo-soft);
}
.bg-indigo-100 {
  background-color: rgba(129, 140, 248, 0.18);
}
.bg-violet-50\/70 {
  background-color: var(--violet-soft);
}
.bg-violet-100 {
  background-color: rgba(167, 139, 250, 0.18);
}
.bg-cyan-50\/70 {
  background-color: var(--cyan-soft);
}
.bg-cyan-100 {
  background-color: rgba(56, 207, 224, 0.18);
}
.bg-rose-50 {
  background-color: var(--rose-soft);
}
.bg-gray-900 {
  background-color: var(--surface-3);
}
.bg-slate-900\/20 {
  background-color: rgba(2, 6, 16, 0.35);
}
.bg-slate-900\/40 {
  background-color: rgba(2, 6, 16, 0.55);
}
.bg-\[\#f8fafc\] {
  background-color: var(--bg);
}

.text-slate-800,
.text-slate-900 {
  color: var(--text);
}
.text-slate-700,
.text-slate-600,
.text-gray-600 {
  color: var(--text-soft);
}
.text-slate-500,
.text-gray-500 {
  color: var(--muted);
}
.text-slate-400,
.text-slate-300 {
  color: var(--muted-dim);
}
.text-blue-600 {
  color: var(--blue);
}
.text-blue-700 {
  color: var(--blue-strong);
}
.text-blue-800 {
  color: #9cc2ff;
}
.text-emerald-600,
.text-emerald-500,
.text-green-600 {
  color: var(--success);
}
.text-emerald-700,
.text-emerald-400,
.text-green-700 {
  color: #6ee7b7;
}
.text-emerald-800 {
  color: #86efac;
}
.text-red-600,
.text-red-500 {
  color: var(--danger);
}
.text-red-700,
.text-red-400 {
  color: #f89898;
}
.text-red-800 {
  color: #ffb3b3;
}
.text-amber-600,
.text-amber-500 {
  color: var(--warning);
}
.text-amber-700 {
  color: #f8cd7a;
}
.text-amber-800 {
  color: #fadf9f;
}
.text-rose-600 {
  color: var(--rose);
}
.text-indigo-600,
.text-indigo-700 {
  color: var(--indigo);
}
.text-violet-600,
.text-violet-700 {
  color: var(--violet);
}
.text-cyan-600,
.text-cyan-700 {
  color: var(--cyan);
}

.border-slate-200 {
  border-color: var(--border);
}
.border-slate-100 {
  border-color: rgba(255, 255, 255, 0.07);
}
.ring-slate-200 {
  --tw-ring-color: var(--border);
}
.border-blue-100 {
  border-color: var(--blue-border);
}
.border-emerald-100,
.border-emerald-200,
.border-green-200 {
  border-color: var(--success-border);
}
.border-red-100,
.border-red-200,
.border-red-500 {
  border-color: var(--danger-border);
}
.border-amber-100 {
  border-color: var(--warning-border);
}
.border-indigo-100 {
  border-color: var(--indigo-border);
}
.border-violet-100 {
  border-color: var(--violet-border);
}
.border-cyan-100 {
  border-color: var(--cyan-border);
}
.border-white {
  border-color: var(--surface);
}

.from-blue-600 {
  --tw-gradient-from: #e7c168 var(--tw-gradient-from-position);
  --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to, rgba(231, 193, 104, 0));
}
.to-emerald-500 {
  --tw-gradient-to: #b99a45 var(--tw-gradient-to-position);
}

.shadow-blue-100 {
  --tw-shadow-color: rgba(91, 155, 255, 0.16);
}
.shadow-blue-200 {
  --tw-shadow-color: rgba(91, 155, 255, 0.2);
}
.shadow-soft {
  box-shadow: var(--shadow-2);
}

.hover\:bg-slate-50:hover {
  background-color: rgba(255, 255, 255, 0.06);
}
.hover\:bg-slate-100:hover {
  background-color: rgba(255, 255, 255, 0.09);
}
.hover\:bg-slate-200:hover {
  background-color: rgba(255, 255, 255, 0.13);
}
.hover\:bg-blue-700:hover {
  background-color: var(--blue-strong);
}
.hover\:bg-red-50:hover {
  background-color: var(--danger-soft);
}
.hover\:bg-white:hover {
  background-color: var(--surface);
}
.hover\:text-slate-800:hover,
.hover\:text-slate-600:hover {
  color: var(--text);
}
.hover\:text-red-600:hover {
  color: var(--danger);
}

.focus\:border-blue-500:focus {
  border-color: var(--blue);
}
.focus\:bg-white:focus {
  background-color: var(--surface);
}
.focus\:ring-blue-500\/20:focus {
  --tw-ring-color: rgba(91, 155, 255, 0.2);
}

.group:hover .group-hover\:text-slate-600 {
  color: var(--muted);
}
.group:hover .group-hover\:text-blue-500 {
  color: var(--gold);
}
'@

[System.IO.File]::WriteAllText($f, $css, (New-Object System.Text.UTF8Encoding($hasBom)))
 $nb = [System.IO.File]::ReadAllBytes($f)
 $null = $strict.GetString($nb)
 $nbom = ($nb.Length -ge 3 -and $nb[0] -eq 239 -and $nb[1] -eq 187 -and $nb[2] -eq 191)
if ($nbom -ne $hasBom) { throw "globals BOM state changed" }
 $srcLines = ($css.TrimEnd([char]10, [char]13) -split "\r?\n").Count
 $diskLines = ([System.IO.File]::ReadAllLines($f)).Count
Write-Host ("globals written: bytes=" + $nb.Length + " lines=" + $diskLines + " (source=" + $srcLines + ")")
if ($diskLines -ne $srcLines) { throw "globals line count mismatch" }

# ---- structural self-derived checks (lesson 37) ----
 $t = [System.IO.File]::ReadAllText($f)

# 1. balanced braces (CSS structural soundness, measured)
 $open = ([regex]::Matches($t, "\{")).Count
 $close = ([regex]::Matches($t, "\}")).Count
Write-Host ("braces: open=" + $open + " close=" + $close)
if ($open -ne $close) { throw "unbalanced braces" }

# 2. selector census MEASURED from the written file (no guessed counts)
 $selKeys = @('loginPage','loginBox','loginVisual','bento-card','badge.paid','modalBack','primary:hover','bg-white','text-slate-800','border-slate-200','from-blue-600')
 $selCensus = @{}
foreach ($k in $selKeys) {
  $c = ([regex]::Matches($t, [regex]::Escape("." + $k))).Count
  $selCensus[$k] = $c
  if ($c -lt 1) { throw ("selector missing: ." + $k) }
}
Write-Host ("selector census: " + (($selCensus.GetEnumerator() | ForEach-Object { $_.Key + "=" + $_.Value }) -join "  "))

# 3. exact-count needles: only those whose count is fixed BY CONSTRUCTION of this template
 $one = @(':root {', '--gold-cta:', '--shadow-3:', 'UTILITY REMAP LAYER')
foreach ($n in $one) {
  $c = ([regex]::Matches($t, [regex]::Escape($n))).Count
  if ($c -ne 1) { throw ("exact needle [" + $n + "]: got=" + $c + " want=1") }
}
Write-Host "exact-count needles VERIFIED (construction-fixed)" -ForegroundColor Green

# 4. tokens present (>=1 each, measured)
foreach ($n in @('--bg:', '--surface:', '--gold:', '--blue:', '--success:', '--danger:', '--warning:', '--info:', '--violet:', '--rose:', '--indigo:', '--cyan:')) {
  if (([regex]::Matches($t, [regex]::Escape($n))).Count -lt 1) { throw ("token missing: " + $n) }
}
Write-Host "ALL 12 TOKEN FAMILIES PRESENT" -ForegroundColor Green

# ============================================================
# PART 2 - Shell.tsx gold active-nav (2 anchors x2)
# ============================================================
 $sf = 'components\Shell.tsx'
 $sb = [System.IO.File]::ReadAllBytes($sf)
 $sbom = ($sb.Length -ge 3 -and $sb[0] -eq 239 -and $sb[1] -eq 187 -and $sb[2] -eq 191)
 $sraw = [System.IO.File]::ReadAllText($sf)
 $seol = [string][char]10
if ($sraw.Contains([char]13)) { $seol = [string][char]13 + [string][char]10 }
 $sendNl = $sraw.EndsWith($seol)
 $slines = [System.IO.File]::ReadAllLines($sf)

 $trimA = '? "bg-blue-50 text-blue-600 shadow-sm"'
 $newA = '? "bg-[color:var(--gold-soft)] text-[color:var(--gold)] shadow-sm"'
 $trimB = '<Icon size={18} className={cn(isActive ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600")} />'
 $newB = '<Icon size={18} className={cn(isActive ? "text-[color:var(--gold)]" : "text-[color:var(--muted)] group-hover:text-[color:var(--text)]")} />'

 $hitsA = 0
for ($k = 0; $k -lt $slines.Count; $k++) {
  if ($slines[$k].Trim() -ceq $trimA) { $ind = [regex]::Match($slines[$k], '^\s*').Value; $slines[$k] = $ind + $newA; $hitsA++ }
}
if ($hitsA -ne 2) { throw ("anchor A hits=" + $hitsA) }
 $hitsB = 0
for ($k = 0; $k -lt $slines.Count; $k++) {
  if ($slines[$k].Trim() -ceq $trimB) { $ind = [regex]::Match($slines[$k], '^\s*').Value; $slines[$k] = $ind + $newB; $hitsB++ }
}
if ($hitsB -ne 2) { throw ("anchor B hits=" + $hitsB) }

 $sout = ($slines -join $seol)
if ($sendNl) { $sout += $seol }
[System.IO.File]::WriteAllText($sf, $sout, (New-Object System.Text.UTF8Encoding($sbom)))
 $snb = [System.IO.File]::ReadAllBytes($sf)
 $null = $strict.GetString($snb)
 $snbom = ($snb.Length -ge 3 -and $snb[0] -eq 239 -and $snb[1] -eq 187 -and $snb[2] -eq 191)
if ($snbom -ne $sbom) { throw "Shell BOM state changed" }
 $st = [System.IO.File]::ReadAllText($sf)
function V1b { param([string]$text, [string]$needle, [int]$want)
  $g = ([regex]::Matches($text, [regex]::Escape($needle))).Count
  if ($g -ne $want) { throw ("needle [" + $needle + "]: got=" + $g + " want=" + $want) }
}
V1b $st 'var(--gold-soft)' 2
V1b $st 'bg-blue-50 text-blue-600' 0
V1b $st 'isActive ? "text-blue-600"' 0
V1b $st 'text-[color:var(--gold)]' 4
Write-Host "Shell anchors VERIFIED (4 lines, gold active nav)" -ForegroundColor Green

# ============================================================
# PART 3 - tsc + build
# ============================================================
Write-Host "--- tsc ---"
& npx tsc --noEmit 2>&1 | Select-Object -First 20
if ($LASTEXITCODE -ne 0) { throw "tsc RED - paste output" }
Write-Host "tsc: GREEN" -ForegroundColor Green
Write-Host "--- build (postcss validates the CSS) ---"
 $bl = Join-Path $env:TEMP "markazak-u2-build.log"
& npm run build 2>&1 | Out-File -FilePath $bl -Encoding utf8
if ($LASTEXITCODE -ne 0) { Get-Content $bl | Select-Object -Last 30; throw "build RED - paste output" }
Write-Host "build: GREEN" -ForegroundColor Green

# ============================================================
# PART 4 - stage whitelist + GATE + commit + push
# ============================================================
 $allow = @('app/globals.css', 'components/Shell.tsx', 'tools/u-theme2.ps1', 'tools/u-theme.ps1', 'tools/u-read.ps1', 'tools/u-design.ps1', 'DESIGN.md')
foreach ($p in $allow) { if (Test-Path $p) { git add -- $p } }
 $staged = @(git diff --cached --name-only)
Write-Host ("staged: " + $staged.Count + " files")
 $staged | ForEach-Object { Write-Host ("  + " + $_) }
foreach ($s in $staged) { if (-not ($allow -contains $s)) { throw ("unexpected staged: " + $s) } }
if ($staged.Count -lt 2) { throw ("staged too few") }

Write-Host "--- MANDATORY GATE ---" -ForegroundColor Cyan
& powershell -ExecutionPolicy Bypass -File tools\pre-push.ps1
if ($LASTEXITCODE -ne 0) { Write-Host "GATE RED - nothing committed." -ForegroundColor Red; exit 1 }

git commit -m "feat(u): night luxe theme - self-measured verification (lesson 37), gold nav, restored login styles"
if ($LASTEXITCODE -ne 0) { throw "commit failed" }
git push -u origin main
if ($LASTEXITCODE -ne 0) { throw "push failed" }
Write-Host "THEME SHIPPED - Vercel deploys in 2-3 min." -ForegroundColor Green
Write-Host "DESIGN GATE (DEC-035): filesystem mode - no browser needed:"
Write-Host "  npx impeccable detect app components"