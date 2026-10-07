# MEMORY.md - markazak-saas project memory (canonical)
# Read first every session. Update at end of every scope. Written: 2026-10-08 (Session 0).

## 1. Current State (evidence-based)
- Project: markazak-saas v2.0.0 (package.json). B2B training-center SaaS. Scope: docs/PRODUCT.md.
- Baseline GREEN 2026-10-08: tsc --noEmit exit 0 + npm run build exit 0 (Node v26.4.0, npm 11.17.0).
- Git: origin github.com/ahmed4attya/markazak-saas (private). Session 0 sync committed the full v2 state + tag baseline-green-2026-10-08.
- Deployment: NOT deployed yet (no public URL). Target: Vercel + Neon per DEC-020/023/024 and docs/DEPLOYMENT.md.
- Truth note: older memory said v1.0-beta; disk + package.json prove v2.0.0 (Lesson 18).

## 2. Protected Files (no touch without explicit owner approval, full read first)
lib/db.ts, lib/auth.ts, lib/rateLimit.ts, lib/validation.ts, lib/audit.ts,
middleware.ts, next.config.ts,
db/schema.sql, scripts/migrate.ts, scripts/seed.ts, scripts/env.ts,
components/Shell.tsx, components/CrudPage.tsx, components/DataTable.tsx,
app/layout.tsx, app/globals.css,
package.json, package-lock.json, tsconfig.json

## 3. Working Rules (PROJECT-PROTOCOL.md - binding)
- Never break working code. Additions, not replacements.
- Gate before every push: tools/pre-push.ps1 (tsc -> build -> git hygiene -> schema reminder). RED = no push.
- git whitelist only. Never "git add ." - every file by name (directory paths allowed when enumerated + gate lists staged files).
- Secrets never cross the screen. Env NAMES only from .env.example.
- Env data differs local/prod; schema changes only via scripts/migrate.ts with DB backup first.

## 4. Lessons (numbered, cumulative)
1-12: RESERVED for imported "markazak" original lessons (owner paste pending).
13. Backticks are banned in any generated .ps1; parse errors surface far from their cause. (Incident: audit v1 broke at lines 138/140, real cause at line 125.)
14. In interactive console paste an if-line completes and executes at line end; a following else is orphaned. Console units must be single scriptblocks. (Incident: BLOCK E v2.)
15. Final verdict comes from disk (bytes + lines + parse + BOM), never from session flags whose branches never ran. (Incident: green "ALL TOOLS INSTALLED" while nothing was written.)
16. Write verification needs a minimum content size; a 3-byte BOM-only file passes parse+BOM. (Incident: two empty tool files "VERIFIED".)
17. A console throw stops only its own line; the rest of a paste keeps running. (Incident: null write after a guard threw.)
18. Documentation can lie; disk does not. (Incident: memory said v1.0-beta + 17 MD files; disk shows v2.0.0, only AGENTS/README/docs pair existed, BUGS+CHANGELOG deleted.)

## 5. Decisions
- DEC-001..DEC-025 imported as binding from pasted memory dated 2026-09-21 (incl. DEC-012, DEC-014, DEC-018, DEC-020, DEC-024).
- DEC-026 (PROPOSED - owner approval pending): recognize v2.0.0 as documented reality per docs/PRODUCT.md; run extended Production Track: Scope 0 solid point, then scopes 1-6.
- DEC-027 (Session 0, recommended defaults): error boundaries + vercel.json restored from HEAD; MASTER-PROMPT.txt ignored; BUGS/CHANGELOG deletions confirmed (consolidated here).

## 6. Known Gaps (Session 0 audit; owner prioritizes)
F1 [Critical] whole working tree was uncommitted -> fixed by Session 0 sync + tag.
F2 [RESOLVED] .env.local NOT tracked (git ls-files empty) - no secret leak.
F3 [High] tailwind.config.js + postcss.config.js untracked -> fixed in sync commit.
F4 [High] legacy tests/ + vitest removed; 11 root test-*.mjs are the practical test scripts.
F5 [Fixed] app/error.tsx + app/global-error.tsx restored.
F6 [Fixed] vercel.json restored (review before first deploy).
F7 [Fixed] duplicate tool/ removed after hash-compare.
F8 [Low] disk leftovers (backups/, *.before-*, zip) - ignored, optional cleanup later.
F9 [Medium] old DEPLOYMENT_GUIDE references db:migrate:prod which does not exist in package.json (confirmed) - docs cleanup pending.
F10 [Low] tsconfig.tsbuildinfo ignored (verified).

## 7. Roadmap (owner approves each scope start)
Scope 0: solid point (sync + gate + tag) - this session.
Scope 1: student types (center/online) + enrollment/subscription.
Scope 2: file library (notes/PDF). Scope 3: secure video + watermark.
Scope 4: exam engine + question bank. Scope 5: assignments + gradebook.
Scope 6: online activation codes + subscriptions + advanced reports.

## 8. Session Log
- 2026-10-08 Session 0: protocol + merged memory read; tools installed via hardened console blocks (Lessons 13-17); audit GREEN; git solid-point sync + tag; MEMORY.md created (Lesson 18). Pending from owner: lessons 1-12 paste, live-deploy question, DEC-026 confirmation, memory-source confirmation.