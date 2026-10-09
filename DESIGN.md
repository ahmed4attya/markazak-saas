# DESIGN.md - markazak-saas visual system (Night Luxe)

Adopted: DEC-036 (dark premium, gold/blue), DEC-037 (palette + protected-file touch + gold CTA).
This document is binding for every future UI change.

## 1. Identity
Dark premium Arabic-first SaaS. Tinted navy surfaces (never pure black), light text with AA contrast,
gold = brand signature (logo, CTA, active nav, featured plan, hero numbers), blue = interaction
(links, focus, icons, avatars). Font: IBM Plex Sans Arabic (300-700) primary + Cairo secondary. RTL native.

## 2. Tokens (globals.css :root) - corrected 2026-10-09 to disk values (Lesson 18)
- bg #0b0f17 | surface #131b2a | surface-2 #1e293b | surface-3 #243047
- border rgba(255,255,255,.08) | border-strong rgba(255,255,255,.15)
- text #f8fafc | text-soft #e2e8f0 | muted #94a3b8 | muted-dim #64748b
- blue #5b9bff (+strong #7aaeff, soft rgba .14, border rgba .32)
- gold #fbbf24 (+strong #fcd34d, soft rgba(245,158,11,.12), border rgba .3, cta gradient fbbf24->f59e0b, cta text #0b0f17)
- success #3ddc97 | danger #ff6b6b | warning #f5b84c | info/cyan #38cfe0
- violet #a78bfa | indigo #818cf8 | rose #fb7185 (each soft .12 / border .3)
- shadows: 1 subtle, 2 card, 3 modal (black-based, dark-appropriate)
- font: "IBM Plex Sans Arabic" primary (300-700) + Cairo (400,700)
- scrims/glass: modal rgba(2,6,16,.6) | mobile sidebar rgba(2,6,16,.5) | header glass rgba(18,27,49,.85) shell / rgba(11,15,23,.85) landing

## 3. Component rules
- Card (bento-card/panel/statCard/financeCard): single surface, 1px border, radius 1rem, shadow-2.
  NO cards inside cards - inner blocks become tinted fills (rgba white .04-.1) without borders.
- CTA (.primary): gold gradient, dark text #1a2440, gold glow. Secondary (.ghost): surface-2 + border-strong.
- Badges: translucent fill (state .12) + state border (.3) + light state text.
- Tables: header rgba white .04, rows border white .06, hover white .05.
- Inputs: surface-2 bg, border-strong, blue focus ring.
- Modals: surface bg, shadow-3, header tinted.

## 4. Anti-patterns (binding, from impeccable.style)
No overused fonts (Inter/Arial/system). No gray text on colored backgrounds (use tinted muted #93a5c8 on navy).
No pure black/gray - everything tinted. No cards nested in cards. No bounce/elastic easing.

## 5. Utility remap layer
Legacy light utility classes (bg-white, slate family, soft palettes, focus/hover/group-hover variants)
are re-mapped to dark tokens at the END of globals.css - pages keep their classes, the theme flips in
one file. New code should prefer :root vars or the mapped classes.

## 6. Gate policy (DEC-035)
- npx impeccable detect must be run on the deployed URL after each UI push (first run downloads the engine).
- Findings are fixed or explicitly waived by the owner (documented here) before the scope closes.
- Standard pre-push gate (tools/pre-push.ps1) stays mandatory for every push.

## 7. Scope U touched files (evidence)
- app/globals.css (PROTECTED - full rebuild, owner-approved): tokens + components + login set (restored, was lost) + remap layer.
- components/Shell.tsx (PROTECTED - owner-approved): active nav state -> gold (2 anchors, 4 lines).
- All other 25 tsx files: untouched.

## 8. Revert
git revert of the theme commit restores the previous visuals atomically; backups exist in git history.

## 9. Dual theme (Scope T - DEC-042/043/044, added 2026-10-09)
- Contract: data-theme on html, default dark, localStorage mkz-theme (dark|light), no-flash script first in body, suppressHydrationWarning on html.
- Toggle: components/ThemeToggle.tsx - zero React state, CSS icon swap - in Shell + Landing headers.
- Flip = tokenize: --tint triplet (255,255,255 dark / 26,36,64 light) + glass/overlay/state-text tokens; 37 same-value replacements; dark byte-identical by construction.
- Light (DEC-043): bg #eef2f9 | surfaces #fdfeff/#f2f6fc/#e9eff8 | text #1a2440/#3b4a68 | muted #5c6b8a/#64748b | blue #2e6fe0/#1d54b8 | gold text #b45309, CTA gradient UNCHANGED both themes | success #0b7a45 | danger #d03b3b | warning #9a6b00 | info/cyan #0e7f96 | violet #6f4bd8 | indigo #4a56d6 | rose #d13a5e | shadows rgba(26,36,64,.08/.10/.16).
- Kept literal on light (documented safe): dark scrims, blue focus rings, gold glows, body/login radial orbs. Layer lives at end of app/globals.css.
