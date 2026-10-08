# MEMORY.md - markazak-saas project memory (canonical)
# Read first every session. Update at end of every scope.
# v2 written 2026-10-08 closing Session 0.

## 1. Current State (evidence-based)
- Project: markazak-saas v2.0.0. B2B training-center SaaS. Scope: docs/PRODUCT.md.
- Baseline GREEN: tsc --noEmit 0 + npm run build 0 (Node v26.4.0, npm 11.17.0).
- Git: origin github.com/ahmed4attya/markazak-saas. main pushed at 3957ca4 (fast-forward, no force).
- Tags on remote: baseline-green-2026-10-08, baseline-merge-2026-10-08.
- Merge 7d0f1ca integrated remote work 7629365 (author Markazak Coder, 2026-09-26). Both parents preserved - nothing lost.
- Local safety: branch backup/pre-merge-20261008. Archives (local-only, git-ignored): audit-out/removed-tool-20261008-015206, audit-out/remote-routes-7629365.
- Deployment: NOT deployed. Target Vercel + Neon per DEC-020/023/024 + docs/DEPLOYMENT.md. vercel.json restored, review before first deploy.
- Truth note: old merged memory said v1.0-beta + 17 MD files; disk proved v2.0.0 with only AGENTS/README/docs pair (Lesson 18).

## 2. Protected Files (no touch without explicit owner approval, full read first)
lib/db.ts, lib/auth.ts, lib/rateLimit.ts, lib/validation.ts, lib/audit.ts,
middleware.ts, next.config.ts,
db/schema.sql, scripts/migrate.ts, scripts/seed.ts, scripts/env.ts,
components/Shell.tsx, components/CrudPage.tsx, components/DataTable.tsx,
app/layout.tsx, app/globals.css,
package.json, package-lock.json, tsconfig.json

## 3. Working Rules (PROJECT-PROTOCOL.md - binding)
- Never break working code. Additions, not replacements.
- Gate before every push: tools/pre-push.ps1 v4 (tsc -> build -> git hygiene -> schema reminder). RED = no push. Modes: STAGED and HEAD.
- git whitelist only. Never "git add ." blindly - enumerate; gate lists staged set for owner eyes.
- Secrets never cross the screen. Env NAMES only from .env.example.
- Env data differs local/prod; schema changes only via scripts/migrate.ts with DB backup first.
- New files enter the repo only via guarded console blocks (parse+ASCII+size checks before and after write).

## 4. Lessons (numbered, cumulative)
1-12: RESERVED for imported markazak original lessons (owner paste pending).
13. Backticks banned in generated .ps1; parse errors surface far from their cause. (audit v1 broke at 138/140, cause at 125.)
14. In interactive console an if-line completes at line end; following else is orphaned. Use single scriptblocks. (BLOCK E v2.)
15. Final verdict from disk (bytes+lines+parse+BOM), never from session flags. (Green "ALL TOOLS INSTALLED" while nothing written.)
16. Write verification needs minimum content size; 3-byte BOM-only file passes parse+BOM. (Two empty tool files "VERIFIED".)
17. A console throw stops only its own line; the rest of a paste keeps running. (Null write after guard threw.)
18. Documentation can lie; disk does not. (Memory said v1.0-beta; disk showed v2.0.0.)
19. Duplicates removed only by byte-identity or archive-then-move; unknown-origin content diagnosed first. (tool/ differed from tools/ - archived, not deleted.)
20. Push gate must support STAGED and HEAD modes. (Clean tagged tree + gate crying "nothing staged".)
21. When branch push is rejected, tag push is a legitimate emergency backup channel. (283 objects reached remote via tag while main rejected.)
22. Forbidden-path gate check exempts deletions: removing junk (or leaked secrets) is desired. (v3 false-positive on 11 backups/* deletions; fixed in v4.)

## 5. Decisions
- DEC-001..025 imported binding from pasted memory dated 2026-09-21.
- DEC-026 (PROPOSED, owner approval pending): recognize v2.0.0 reality per docs/PRODUCT.md; extended Production Track; scopes 1-6 roadmap.
- DEC-027 (Session 0 defaults applied): app/error.tsx + app/global-error.tsx + vercel.json restored from HEAD; MASTER-PROMPT.txt git-ignored; BUGS.md/CHANGELOG.md deletions confirmed (consolidated here).
- DEC-028 (merge resolution, evidence-based): six [id] routes = OURS (hardened: session+RBAC+tenant+audit; remote-only GET unused by UI; UI calls PATCH only); test infra deletions kept; lib/rateLimit.ts restored (live import in login). Remote work preserved in 7629365 + audit-out archive.

## 6. Known Gaps (Session 0)
F1 [CLOSED] tree fully committed + pushed + tagged.
F2 [CLOSED] .env.local never tracked - no leak.
F3 [CLOSED] tailwind/postcss configs committed.
F4 [DOC] legacy vitest removed; root test-*.mjs are practical test scripts (run them manually; runner decision deferred).
F5 [CLOSED] error boundaries restored.
F6 [CLOSED] vercel.json restored; review before first deploy.
F7 [CLOSED] tool/ archived+removed (byte-differ, preserved).
F8 [LOW] disk leftovers ignored by git; optional physical cleanup later.
F9 [MED] stale references (db:migrate:prod in old docs) - docs cleanup pending.
F10 [CLOSED] tsbuildinfo ignored.
F11 [CLOSED] suspected Arabic mojibake in [id] routes: byte-probe proved files CLEAN (ARABIC-OK, box=0) - terminal display artifact only (Protocol ch.4 applied).

## 7. Roadmap (owner approves each scope start; each scope runs the 7-step ritual)
Scope 0: DONE (this session). Scope 1: student types center/online + enrollment/subscription.
Scope 2: file library. Scope 3: secure video + watermark. Scope 4: exam engine + question bank.
Scope 5: assignments + gradebook. Scope 6: online activation codes + subscriptions + advanced reports.

## 8. Session Log
- 2026-10-08 Session 0 COMPLETE: protocol+memory read; tools v4 installed via hardened blocks; audit GREEN; solid point committed/tagged/pushed; parallel-work merge resolved (DEC-028) and pushed; MEMORY.md created then finalized. Owner confirmations pending: GitHub visual check, lessons 1-12 paste, memory source, live-deploy question, DEC-026, tool/ origin, 7629365 author origin.- Lesson 23 (2026-10-08): verification thresholds are derived from the drafted reference content (measured), never guessed. A guessed line gate (80) failed a valid file (69 lines) - false VERIFY FAILED. Same root as Lessons 15/16: the needle must be measured, not remembered. (Incident: BLOCK MEM2.)
- Owner visual confirmation 4/4 YES on GitHub (commit order, two tags, backups/ gone, MEMORY.md final) 2026-10-08. SESSION 0 OFFICIALLY CLOSED with live proof.

---

# MEMORY v3 UPDATE - 2026-10-08 (Scope 1 CLOSED)

## Scope 1: CLOSED with live proof
- Schema: students.type + enrollments.sub_start/sub_end + index students_tenant_type - migrated on LOCAL and PROD (Neon 18.6), 12 students preserved both times.
- Code: students API accept/filter type; enrollments mix warning (DEC-029) + subscription period (DEC-030); stats counters center/online (DEC-031); students page type column+field.
- Deploy: auto-deploy from GitHub confirmed by evidence (CSS tailwind markers served post-sync); commits through 299f95d live on Vercel.
- Owner live proof: type column+field visible; online student CREATED and PERSISTED on prod; both counters visible. DEC-033: owner logged into prod with LOCAL credentials after migration; real numbers shown (4/4 YES).

## Security
- CRITICAL CLOSED: demo credentials removed from login page (prefill + hint block) - commit de8e62b. Owner rotated prod admin password via UI (secret never disclosed).
- Post-migration prod login = LOCAL credentials (DEC-032 option A applied: full restore).

## Decisions added
- DEC-029: enrollment type-mix ALLOWED with warning (not blocked).
- DEC-030: subscription period fields on enrollments (sub_start/sub_end).
- DEC-031: center/online counters in stats + PageStatsCards.
- DEC-032: prod restore = full local mirror (owner approved users replacement).
- DEC-033: migration accepted - owner logged with local creds, real numbers live (4/4).
- DEC-034: prod deploy is AUTOMATIC from GitHub (evidence-based; supersedes old DEC-024 manual note).
- DEC-035: design gate = npx impeccable detect as acceptance condition for Scope U and later UI work.

## Lessons added (24-35)
24. Backup gate is a state probe: success with anomalous size reveals wrong assumption (672B dump exposed un-migrated assumption).
25. One connection string != one server identity: verify server fingerprint (startEpoch+tableCount) from each vantage (localhost resolved differently inside container vs host).
26. Critical scripts are written once, calmly, with a full self-review pass; iterative patching under fatigue breeds typos (3 in one draft).
27. Windows docker swallows double quotes in sh -c; spaced SQL breaks. Post-dump content verification (tables+COPY sections) beats pre-probes.
28. A guard may crash mid-line and the next line still prints CONFIRMED - verdict only from measured gates, never from printed claims.
29. Post-restore checks must be schema-qualified (public.students); pg_dump seeds empty search_path for its session.
30. Every execution block/starts with an explicit location guard printing the expected root (system32 incident).
31. Sensitive procedure chains ship as single guarded .ps1 files - not as separate manual steps (add-before-edit incident).
32. Verify needles derive from the same string form used to write; backtick inside single quotes is literal (v1 wrote fine, needle lied).
33. A whitelist must include the script itself and its sibling tools (self-forgotten-guard incident).
34. Skip-if-contains without full verify = skipping a potentially corrupted write. Verify ALL needles first, then decide skip/rewrite; on verify failure in skip mode -> rebuild.
35. When a small file is suspect, rebuild it COMPLETELY from known content and verify by line count + needle set (surgical line fixes caused a duplicate const).

## Production state (evidence)
- Prod DB (Neon, PG 18.6): schema S1 applied; data mirrors local (students=12, enrollments=24, groups=4, tenants=1 = Al Riyadh Training Academy).
- Prod app: S1 code + security fix live; login clean; admin password rotated by owner.
- Backups on disk (audit-out/backups, git-ignored): local-full, prod-full, prod-prerestore, local-dataonly (all verified).
- Prod users: 1 (owner, rotated password). Local remains the content canon for now.

## Scope U (NEXT - owner priority before Scope 2)
- Theme + card consistency pass BEFORE Scope 2, per owner request.
- Method: read globals.css + Shell.tsx (both PROTECTED - full read first), dashboard + students pages; produce DESIGN.md from evidence; 3 visual directions offered (refine-current / dark-premium / new-brand); owner picks.
- Acceptance gate: npx impeccable detect (install: npx impeccable install --providers=gemini; Gemini CLI: /settings -> Skills on -> /skills list). Detect must be clean (or waived explicitly) before any UI push.
- Execution: guarded .ps1 files only (established pattern).
- Impeccable anti-patterns adopted: no Inter/overused fonts, no gray-on-color text, no pure black, no cards-in-cards, no bounce easing.

## Pending from owner (carried)
- markazak original lessons 1-12 (reserved numbers, paste anytime).
- Source of the old merged memory file; origin of archived tool/ folder; author origin of commit 7629365 (likely adjacent worktree).
- Scope U visual direction choice (A/B/C) + priority (dashboard first or all screens).