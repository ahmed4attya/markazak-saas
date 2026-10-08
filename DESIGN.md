# DESIGN.md - markazak-saas visual system (Night Luxe)

Adopted: DEC-036 (dark premium, gold/blue), DEC-037 (palette + protected-file touch + gold CTA).
This document is binding for every future UI change.

## 1. Identity
Dark premium Arabic-first SaaS. Tinted navy surfaces (never pure black), light text with AA contrast,
gold = brand signature (logo, CTA, active nav, featured plan, hero numbers), blue = interaction
(links, focus, icons, avatars). Font: Cairo (400-800). RTL native.

## 2. Tokens (globals.css :root)
- bg #0b1222 | surface #121b31 | surface-2 #182341 | surface-3 #1e2c52
- border #233052 | border-strong #2e3d66
- text #eaf0fa | text-soft #c7d3ea | muted #93a5c8 | muted-dim #6b7da3
- blue #5b9bff (+strong #7aaeff, soft rgba .14, border rgba .32)
- gold #e7c168 (+strong #f2d38b, soft rgba .14, border rgba .38, cta gradient f2d38b->e7c168)
- success #3ddc97 | danger #ff6b6b | warning #f5b84c | info #38cfe0
- violet #a78bfa | cyan #38cfe0 | indigo #818cf8 | rose #fb7185 (each soft .12 / border .3)
- shadows: 1 subtle, 2 card, 3 modal (black-based, dark-appropriate)

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