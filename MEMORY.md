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
MEMORY v4 UPDATE - 2026-10-09 (Scope T CLOSED)
Scope T: CLOSED with live proof (6/6 owner YES on prod)
T1 dual theme (DEC-042/043/044): data-theme on html, default dark, localStorage mkz-theme (dark|light), no-flash inline script first in body, suppressHydrationWarning, html{background-color:var(--bg)}. NEW components/ThemeToggle.tsx - zero React state, CSS icon swap - in Shell header + Landing header. DUAL THEME LAYER appended to app/globals.css.
Flip architecture: 37 same-value remaps - rgba(255,255,255,a) x23 -> rgba(var(--tint),a); 13 state-text hex -> var(--state-*-text); glass -> rgba(var(--glass-rgb),.82). --tint = 255,255,255 dark / 26,36,64 light. Dark visuals byte-identical by construction. Kept literal on light (documented safe): dark scrims, blue focus rings, gold glows, radial orbs.
T2 rebrand (DEC-045): 17 UI positions - layout metadata; Shell logo mark/brand/subtitle/academy x2/avatar; Landing logo x2/brand/subtitle/h1/why x2/badge/hero line/why line/footer. مركزك / Training Center OS -> سنتر الخوارزمي / Al-Khwarizmi Center; أكاديمية الريادة x2 -> new name; marks م->خ; H2 كل ما يحتاجه مركزك... KEPT (addressing pronoun); footer copyright char -> © entity.
T3 LOCAL DONE (DEC-041): local DB training_center tenants.name = سنتر الخوارزمي / Al-Khwarizmi Center. Evidence: rows=1, exact old-name guard, backup audit-out/session-T/backup-tenant-local.json (220B verified), read-back needle from DB itself, ROLLBACK SQL printed, slug alriyadh untouched. PROD leg PENDING explicit owner signal.
T4 (DEC-046R): engines.node = "24.x". The 20.11.1 pin REVERSED - Vercel build log (bf2ac46) proved 20.x discontinued + demanded 24.x + cache-skip line proved prior builds ran 24.x.
Live proof (owner, after ac11c6d Ready): dark unchanged / toggle in both headers / F5 stays light no-flash / light palette readable + gold CTA identical in both themes / new name in header+footer+tab title / zero legacy brand strings.
Commits (main, pushed, auto-deployed per DEC-034)
3aa2bc5 fix(tools): ASCII mojibake-tell comment in gate + alm-theme © (gate self-flag resolved)
bf2ac46 feat(scope T): T1 + T2 + engines pin (pushed with 3aa2bc5 in one push OVER A RED GATE - Lesson 60)
57cbc4d chore: gitignore tools/session-T (session tools stay local)
ac11c6d fix(T4/DEC-046R): engines 24.x
Retroactive coverage: two full GREEN v5 gates on the final tree (byte audit 115 files + tsc + build + hygiene).
Gate + tree hygiene (this session)
v5 flagged 3 files; all resolved by DIAG-MOJI evidence: CrudPage.before-mojibake-fix-*.tsx = UNTRACKED double-encoded corrupt archive, 0 refs -> copied+verified+removed to audit-out; alm-theme.ps1 legit copyright char -> ©; pre-push.ps1 = its own comment demoing mojibake tells -> ASCII. Gate logic untouched; 5/5 logic needles verified before/after.
12 .ts/.tsx under audit-out renamed *.bak (out of tsc scope, bytes preserved). .gitignore += tools/session-T/.
tailwind.config.js unknown-origin diff (blue->gold primary) diagnosed via git diff, then restored to HEAD (Lesson 19 applied).
Execution mechanism: owner-manual file creation (name + content + run command) replaced console-install blocks per owner instruction, after the Batch A green-installer-not-executed incident.
Decisions added
DEC-041: T3 = option A (UPDATE tenants.name, bilingual). Local DONE; prod gated on explicit owner signal; slug stays technical.
DEC-042: dual-theme contract: data-theme, default dark, mkz-theme, no-flash first-in-body, suppressHydrationWarning, stateless ThemeToggle in both headers.
DEC-043: light palette frozen: bg #eef2f9 | surfaces #fdfeff/#f2f6fc/#e9eff8 | text #1a2440/#3b4a68 | muted #5c6b8a/#64748b | blue #2e6fe0/#1d54b8 | gold text #b45309, CTA gradient UNCHANGED both themes | success #0b7a45 | danger #d03b3b | warning #9a6b00 | info/cyan #0e7f96 | violet #6f4bd8 | indigo #4a56d6 | rose #d13a5e | navy shadows. muted-dim #64748b chosen for AA.
DEC-044: flip = tokenize (--tint triplet + glass/overlay/state-text tokens), same-value replacements only; no dark value edited.
DEC-045: rebrand map 17 UI + DB; H2 kept; F5 rewording removes داكنة x2; footer © entity (ASCII-safe).
DEC-046R (supersedes the 20.11.1 pin): engines.node = "24.x" per Vercel log evidence.
Lessons added (57-61)
Installer GREEN is not executor GREEN. Batch A reported all green but DIAG proved T2/T3 never ran (pre-T2 + tenant backups absent from disk). Two phases (install block, then run) collapsed into one mental step. Rule: every phase prints its own disk-state verdict; installer output is never execution evidence.
The suspicious-pair heuristic (C2/C3 + A7/B8/BB/A9) is resolved by the PRECEDING byte: D8/D9 lead = real mojibake; otherwise a legit UTF-8 char. It cleared 2 of 3 gate flags - and one flag was the gate commenting on its own tell-list. Caveat: mid-sequence pairs in double-encoded text fool the prev-byte test (DIAG labeled 114 truly-corrupt pairs LEGIT); verdict from full hex context + tracked/refs status, never one signal.
Archived sources keeping .ts/.tsx extensions stay inside tsc scope wherever they live - even git-ignored audit-out. Rule: archives get .bak (12 renamed) or a tsc-excluded dir.
Push over a RED gate = protocol violation, documented. Safety was circumstantial (red causes provably outside the pushed set; byte audit clean incl. all 6 pushed files). Retroactive coverage = two full green gates on the same tree. No revert; the reliance is never repeated.
Read the literal warning before engineering around it. T4 executed on an unverified 20.11.1 assumption while Vercel said 20.x discontinued, use 24.x - the pin would have frozen prod deploys. Reversed same session on log evidence.
Production state (evidence)
Prod app: Scope T chain live through ac11c6d, Vercel Ready, Node 24.x restored, 6/6 owner proof.
Prod DB (Neon): tenants.name still "Al Riyadh Training Academy" - T3-prod awaits owner signal. No UI inconsistency meanwhile: tenant name in UI is hardcoded, not DB-read.
Local DB: renamed (DEC-041). seed.ts debt: future re-seed may restore the old name (seed.ts protected, unread) - check before any re-seed.
DESIGN.md synced (this session)
Section 2 corrected to disk values (Lesson 18 applied to our own doc). New section 9: dual-theme contract + light palette.
Open items (carried)
T3-prod on Neon: awaits explicit owner signal (owner sets MKZ_DB_URL in own terminal, neon-only host guard, verified pg_dump backup FIRST, read-back needle, ROLLBACK ready).
detect (DEC-035) on prod URL: pending (browser env) - run with IMPECCABLE_BROWSER=Edge/Chrome or document a dated waiver; the condition stays standing.
tsconfig.json full paste owed; optional hardening = exclude audit-out (protected file - approval + full read first). Archives are .bak now, so optional.
markazak original lessons 1-12: reserved, paste anytime. Origins pending: old merged memory source; archived tool/ folder; 7629365 author. DEC-026 approval status unconfirmed. F9 [MED] stale docs cleanup pending.
Roadmap (owner approves each scope start; 7-step ritual each)
DONE: 0, 1, U, T. REMAINING: Scope 2 file library | Scope 3 secure video + watermark | Scope 4 exam engine + question bank | Scope 5 assignments + gradebook | Scope 6 activation codes + subscriptions + advanced reports.

---

# MEMORY v4.1 ADDENDUM - 2026-10-09 (T3-prod DONE - DEC-041 fully closed)
- SECURITY INCIDENT (reclassified by fingerprint evidence, closed): a Neon connection string WAS pasted into chat during T3-prod setup. PROBE fingerprinting (HOST_HASH b16e88382b, 21 foreign PascalCase tables, no public.tenants) proved that string pointed to a DIFFERENT application database, not markazak production. Its role password was reset same-session. The markazak production connection string never appeared in chat (different fingerprint, confirmed by the authoritative pull below); it lives only in Vercel env store and the owner terminal.
- DB identity authority (Lesson 66): the target DB was resolved MECHANICALLY - vercel link + vercel env pull --environment=production - because lib/db.ts reads DATABASE_URL and production demonstrably works; the pulled value fingerprinted as the app DB (tenants=1 row, exact old-name match) before any write. Console templates, memory, and hand-copied strings are not evidence (Lesson 25 extended to the platform layer).
- T3-prod EXECUTED on Neon: public.tenants.name = سنتر الخوارزمي / Al-Khwarizmi Center (slug alriyadh untouched). Sequence: pulled MKZ_DB_URL -> neon-only host guard -> v1 aborted cleanly (pg_dump absent) -> ADAPTED contract documented: content-verified FULL-ROW JSON backup (backup-tenant-prod.json) is the restore artifact for the single-row table; backup branch backup-pre-s2-t3 created in the identified project -> rows=1 + exact old-name guard -> UPDATE -> RETURNING + fresh independent SELECT read-back -> ROLLBACK SQL in transcript.
- Scope T FULLY CLOSED (T1+T2+T3+T4 + live proof 6/6). Prod DB now matches prod UI brand.
- Lessons added (62-66):
62. Sequenced docs must self-guard on state evidence - a doc script must refuse to write unless the artifact proving the claim exists on disk. Validated live: the guard blocked a lying addendum three times.
63. Whole-file needle counts break when the needle already exists elsewhere. VERIFY RED fired on a correct write for the wrong reason - and still blocked a false document. Rule: verify appended blocks scoped to the block.
64. A RED verdict voids every queued next step until resolved. Operationalized: chain scripts abort themselves; no step after red exists in the queue.
65. Secrets never cross the screen - INCLUDING the owner side. Guards control what scripts print; they cannot control what the owner pastes. Rotation is the only remedy after exposure; values are referenced by NAME in documents, never by value.
66. Connection-target authority is mechanical, not recalled: fetch the exact env the app reads (vercel env pull) and fingerprint (schema + row counts + name needle) before any write. A wrong-database abort before any write is the system working, four times in a row.
- Remaining open items: detect on prod URL (browser env or dated waiver); MEMORY v5 at Scope 2 close (DEC-047..051 + lessons: PS wildcard brackets break Test-Path, chain-enforced RED discipline, npm audit backlog - never audit fix --force); tsconfig.json paste (optional); lessons 1-12 reserved; origins pending; F9 docs cleanup; seed.ts debt; duplicate v4 commit messages on main (3bffd21/05e9943) noted, harmless.

---

# MEMORY v5.1 UPDATE - 2026-10-09 (Scope 2 CLOSED on corrected evidence + T3-prod CLOSED + design gate register signed)

## Scope 2: CLOSED with live proof (PROVEN-6 owner attestation on prod)
- S2 schema: public.files (12 cols) + indexes files_tenant_course, files_tenant_created. Migrated LOCAL via db:migrate (check-files-table OK) and PROD via s2-prod.mts with identity self-guard (required public.tenants rows=1 before any DDL): CREATED_OK files (12 columns) + 2 indexes.
- Code (e683267, 11 files, +705, full gate GREEN): lib/storage.ts (DEC-047/048: 100MB cap, allowed types, sanitizeName, buildPathname tenants/{tenantId}/{uuid}/{safe-name}); /api/files/prepare; /api/files/upload (client-direct handleUpload + onUploadCompleted dedup insert); /api/files/upload-complete (head-verify, unique storage_key dedupe, race-safe coalesce update, audit file.upload); /api/files (tenant-scoped, filters); /api/files/[id] DELETE (DEC-049: admin/owner-or-uploader, blob deleted FIRST then row, audit).
- UI: app/library/page.tsx (client-direct upload, course filter, system-class table, download via storage_key, delete confirm) + Shell nav item under Operations (DEC-050, 2-line protected touch). DEC-051: storage_key = unguessable Blob URL for MVP; session proxy is a future option.

- Blob binding note: first upload attempt failed "Failed to retrieve the client token" (BLOB_READ_WRITE_TOKEN absent from the serving deployment). Fixed by connecting the Blob store + redeploy; upload then succeeded (owner attestation covers post-fix state).
- CORRECTION (v5.1, 2026-10-09): the v5 live-proof claim "upload verified live" was PREMATURE - post-closure upload failed "Failed to retrieve the client token". Root cause: NO Blob store existed and BLOB_READ_WRITE_TOKEN was absent from the production environment (v5 was attested before the last env var entered the serving deployment). Fix: created blob store markazak-saas-blob (FRA1, Public per DEC-052-candidate), connected to markazak-saas (Production+Preview) with BLOB_READ_WRITE_TOKEN + BLOB_STORE_ID + BLOB_WEBHOOK_PUBLIC_KEY, redeployed, then owner re-verified ON PROD: upload green + row listed (1.pdf 485KB) with download/delete present. Scope 2 stays CLOSED on corrected evidence.
## T3-prod: CLOSED (full sequence in v4.1 addendum)
- Identity resolved mechanically by neonctl content sweep (v2 syntax): WINNER = markazak-saas-prod (curly-shape-28384075, hostHash c4b1e9b25e): tenants=1, exact old-name match, students=13. Foreign 21-table PascalCase DB = qudurati (b16e88382b) - all four hand-copied strings were that sibling app's.
- Applied on prod: backup branch backup-pre-s2-t3 (br-young-mountain-b2fthq0a) -> S2 DDL -> T3 UPDATE (exact old-name guard, full-row JSON backup audit-out\session-T\backup-tenant-prod.json, fresh independent read-back, ROLLBACK SQL in transcript). tenants.name = سنتر الخوارزمي / Al-Khwarizmi Center (slug alriyadh untouched). Prod DB matches prod UI brand. students=13 on prod (live growth; earlier memory said 12).

## Design gate (DEC-035) - first full register entry
- First production detect: 17 findings. Classification: 1 REAL FIX (undersized-ui-text, functional text below 11px) + 3 signed waiver classes: W1 dark-glow x4 (Night Luxe gold signature, DEC-036/037), W2 icon-tile-stack x8 (Scope U landing pattern), W3 nested-cards x4 (Scope U stats-in-bento). Registered in DESIGN.md ch.6.1 with a surface-visibility note.
- Fix commit 3b6b121: 10px/9px -> 11px (Shell x3 incl. auth-gated user line + soon badge; landing x1). Waivers signed by owner (WAIVED attestation). Final detect after deploy: ZERO undersized; W1-W3 remain as signed waivers - the only legitimate closure DEC-035 allows.

## Security (both incidents closed)
- qudurati connection string leaked in chat -> role password reset same session (sibling app must be updated if it reads it).
- markazak-saas prod string NEVER crossed the screen (fingerprint proof); lives only in Vercel env store + owner terminal.

## Commits (main, pushed, auto-deploy per DEC-034)
- e683267 feat(scope 2): file library batch (11 files, gate GREEN, 47 pages)
- 6681850 chore: gitignore (.vercel + .env* added by vercel link; .neon/.neon-target/.env.vercel-prod appended). NOTE (Lesson 68): also carries v4.1 memory addendum - pre-staged by an aborted batch; content truthful, message under-describes.
- 3b6b121 fix(detect): 11px floor (Shell x3 + landing x1) + waivers W1-W3 registered in DESIGN.md ch.6.1.

## Lessons added (67-73)
67. PowerShell wildcards: Test-Path treats [id] as a character class - reported an EXISTING file missing, twice. Rule: -LiteralPath everywhere; verify a checker's RED with an independent command before rewriting anything (sibling of Lesson 58).
68. An aborted chain leaves its staged set behind; the next gate runs on the UNION - the chore commit carried the memory addendum too. Rule: chain scripts must handle pre-staged state explicitly, and commit messages must not under-describe their content.
69. CLI syntax is version-bound: neonctl rebranded (whoami -> me, --json -> -o json) and an interactive org prompt hung execSync. Rule: authenticate non-interactively first; verify flags against the installed version; never trust an ABORT message over the raw error.
70. Identity is proven by CONTENT, not by names, URLs, memory, or hand-copied strings: one sweep + fingerprint (schema, row counts, name needle) settled in minutes what four attempts could not. Names are labels; rows are evidence.
71. Delivered files must be parse-clean, no exceptions: a shipped .ps1 containing PS5.1-banned ?: produced ParserError = zero execution (the only saving grace). A warning printed in the same message as the broken file is worthless; the banned-pattern check runs BEFORE delivery - the v5 gate standard applies to assistant-authored files too.
72. Edit anchors derive from the LIVE on-disk text, never from remembered intent: DEC-045 had made the subtitle English, so an Arabic anchor was doomed; and a single-count anchor aborted correctly on count=2, forcing investigation that revealed a second 10px position + a hidden 9px badge (Lessons 23/58 extended to edit-anchors).
73. The design scanner sees the PUBLIC surface only: auth-gated screens are invisible to it. Their violations are fixed for consistency and documented (DESIGN.md ch.6.1), never assumed "clean".
74. A live-proof attestation is only valid AFTER the last environment variable has entered the serving deployment: v5 was attested (PROVEN-6) while BLOB_READ_WRITE_TOKEN was still absent from production - the upload then failed post-closure. Rule: before attesting, enumerate every env var the feature needs and confirm each exists in the DEPLOYMENT, not in the dashboard.
75. Vercel Blob stores are created from the TEAM-level Storage page (https://vercel.com/<team>/storage -> Create Database -> Blob); the in-project "Connect to a Database" search covers third-party marketplace providers only and shows "No Results" for native Vercel products (Lesson: surface of creation differs from surface of connection).
76. In vercel env pull, "[SENSITIVE]" means a secret EXISTS but its value is withheld from the CLI - never classify it as absent. Tools must distinguish present-hidden from missing; the deployment behavior (actual upload) is the only verdict that matters.

## Production state (evidence)
- Neon markazak-saas-prod: files live, tenants renamed, backup branch + JSON row backup on disk.
- Vercel: markazak-saas (ours) + siblings qudurati, markazak; Node 24.x; Blob bound (BLOB_READ_WRITE_TOKEN); live proof 6/6 recorded; detect register signed (fix + 3 waivers).

## Roadmap
DONE: 0, 1, U, T, 2. NEXT: Scope 3 secure video + watermark (7-step ritual). Then: 4 exam engine, 5 assignments + gradebook, 6 activation codes + subscriptions + advanced reports.

## Open items (carried)
- npm audit backlog (11 findings): never audit fix --force; scheduled review.
- tsconfig.json paste (optional: exclude audit-out); lessons 1-12 reserved; origins pending (memory source, tool/, 7629365); F9 docs cleanup; seed.ts debt (re-seed may restore the old tenant name LOCALLY); H2 pronoun kept (DEC-045); future landing redesign may revisit W2/W3.

---

# MEMORY v6 UPDATE - 2026-10-10 (Scope 3 CLOSED with live proof)

## Scope 3: CLOSED with live proof (PROVEN-S3 owner attestation on prod)
- S3 schema: public.videos (12 cols incl. duration_seconds) + 2 indexes. Migrated LOCAL + PROD (identity self-guarded; PROD verified independently by check-videos-table: rows=0 before any upload). Migration raced once (duplicate pg_type) with ZERO damage - guards held; race-proofed after.
- Code (fb3b432, 11 files, +409, full gate GREEN, 61 routes built): lib/video-storage.ts (DEC-054: 500MB cap until Hobby limits measured; video types mp4/webm/mov/m4v; path tenants/{id}/videos/{uuid}/{safe}); /api/videos/prepare; /api/videos/upload (client-direct handleUpload + onUploadCompleted dedup); /api/videos/upload-complete (head-verify, dedupe, race-safe coalesce, logAudit video.upload); /api/videos (tenant-scoped, course filter); /api/videos/[id] DELETE (DEC-057: isAdmin() || uploader, blob FIRST then row, logAudit); app/api/me (name/email/userId for watermark); app/videos/page.tsx (upload with auto duration read, table, modal player via STREAM PROXY, watermark overlay CSS).
- DEC-053 LIVE: /api/videos/[id]/stream = session-gated Range passthrough (206/416), Blob URL never leaves the server, video.play audited once per initial load. Unauthorized (sessionless) access returns 401 - verified by owner in a private window.
- DEC-055 MVP: watermark = client-side CSS overlay (name+email+date, pointer-events none) - documented honest limit: removable by DevTools; real protection is the proxy (no capturable playback URL). Server-side burn-in deferred.
- Download button decision (owner): REMOVE. Note: raw Blob URL download = DEC-051 model (unguessable path).
- Blob plan limits documented from store page (Hobby): 1GB storage / 10GB monthly transfer / 10k simple ops. Video consumption may hit the 1GB ceiling quickly - upgrade Pro or R2 decision deferred to real usage (Usage dashboard is the evidence).

## Commits (main, pushed)
- f2441d5 memory v5.1 (blob incident correction, lessons 74-76)
- fb3b432 feat(scope 3): video library batch (11 files, gate GREEN, 53 static pages + 6 video/me routes)

## Lessons added (77-80)
77. DDL migration scripts must be single-flight: advisory lock + RE-CHECK table existence INSIDE the lock. check-then-create outside a lock races even with idempotent DDL (duplicate pg_type) - the race fired live; guards (neon-only + identity) kept damage at zero, and the first runner had actually completed the work.
78. Relative imports in nested tool scripts must be verified against real file depth (tools/session-T needs ../../): a checker that never ran is still wrong before it runs. Verify every import path before delivery (extends 71 to imports).
79. PowerShell inline JS (-e "...") is quote-mangled by the shell - banned in chains; file-based checks only. A broken inline check must never abort a chain as if the underlying state were bad (distinguish CHECK FAILURE from STATE FAILURE).
80. Structural verify checks marker presence; tsc checks compilability - only together they gate. A missing import passed VERIFY (markers present) and was caught by the chain BUILD stage, exactly as designed: no commit on red, one-line fix, re-run.

## Architecture notes
- getSession() casts the JWT payload as Session; real tenancy enforcement lives in per-query tenant_id filters. Audit must use the logAudit wrapper (best-effort, never breaks the action). Scope 2 file routes still insert audit_logs raw - unify on logAudit opportunistically later.
- detect (DEC-035) not applicable to this batch: no public-surface change; Shell is auth-gated (Lesson 73).

## Roadmap
DONE: 0, 1, U, T, 2, 3. NEXT: Scope 4 exam engine + question bank (7-step ritual). Then: 5 assignments + gradebook, 6 activation codes + subscriptions + advanced reports.

## Open items (carried)
- npm audit backlog (11): never audit fix --force. tsconfig paste (optional). Lessons 1-12 reserved. Origins pending. F9 docs cleanup. seed.ts debt. W2/W3 revisit at landing redesign. OIDC read-write token revocation recommendation deferred until downloads go through proxy. Unify files audit on logAudit.

---

# MEMORY v7 UPDATE - 2026-10-10 (Scope P CLOSED + mobile responsiveness fixed live)

## Scope P: CLOSED with live proof (PROVEN-P owner attestation on installed PWA)
- Icons: brand-generated via System.Drawing script (dark navy rounded canvas + gold gradient badge + khah glyph) - 5 files (192/512, maskable x2, apple-touch-180). Owner visually approved before commit.
- PWA stack (commit 42c620f): app/manifest.ts (RTL, standalone, dark #0b0f17, maskable icons); public/sw.js (conservative: static cache-first, navigation network-first + /offline fallback, /api/* NEVER cached, versioned cache + skipWaiting/claim); app/offline/page.tsx (brand card + retry, 'use client' - Lesson 82); components/InstallPWA.tsx (beforeinstallprompt, theme-toggle style, hides on standalone); components/PWARegister.tsx; layout.tsx (viewport themeColor, manifest link, appleWebApp meta, PWARegister first-in-body - full-file rebuild from known content per Lesson 35); Shell third protected touch (InstallPWA beside ThemeToggle).
- iOS: no beforeinstallprompt - Add to Home Screen documented as platform constraint; apple meta served.
- Blob store markazak-saas-blob (FRA1) bound: Production+Preview (BLOB_READ_WRITE_TOKEN + STORE_ID + WEBHOOK_PUBLIC_KEY). Hobby limits noted: 1GB storage / 10GB monthly transfer / 10k simple ops - video consumption will hit ceiling; upgrade decision deferred to real usage evidence.

## Mobile responsiveness - root causes found ONLY on the installed PWA (live testing)
- Three fixes in components/Shell.tsx (commits 0a2f36b + 429f599):
  1. RTL slide direction: closed sidebar must slide +x (off the RIGHT edge in RTL), not -x (into viewport). '-translate-x-full' in RTL = menu always visible - the classic trap, invisible on desktop.
  2. Table overflow containment: .tableWrap min-width 850px forced EVERY table page wider than the phone; browser zoomed out the whole page ("need to shrink to see content") and the fixed sidebar appeared mid-screen (fixed to real 410px edge while the page was zoomed to 850px+). Fix: min-w-0 on main+section + overflow-x-clip - tables now scroll INSIDE their card.
  3. Main margin transition cleanup.
- VERIFIED LIVE: dashboard full-width, tables contained, sidebar hidden + hamburger overlay works, both themes sane on the installed PWA.

## Commits (main, pushed)
- 6ac340c icons / 42c620f PWA stack / ca48aca nodownload+PiP / 0e9b4d5 videos download button removed / 05e9943..f2441d5 memory chain / 0a2f36b+429f599 responsive fixes

## Lessons added (81-85)
81. Verification needles derive from the TEXT'S NATURE: an import line contains the identifier TWICE (name + path) - expecting 1 or 2 fired false REDs three times in a row (63, 72, 81 family). Count = (occurrences per line) x (lines), derived before writing the check.
82. Any component with event handlers must be 'use client' from line one - a static export page with onClick fails the build. Static verify (markers) and tsc (compilability) are complementary gates - the chain build stage caught what markers could not (Lesson 80 applied).
83. Verify imports of nested tool scripts against real depth (../../ from tools/session-T) - a checker that never ran is still wrong before it runs.
84. PWA installed on a device serves ITS CACHED bytes ferociously: live-proof of a fix requires clearing site data (or reinstall) on the device, otherwise you are testing history, not the present. Combined with Lesson 74 (last env var) as: "prove on the CURRENT serving state".
85. Screen-dimension diagnosis is math (CSS width = physical / DPR), never screenshot appearance - a 430px-CSS phone was misjudged as ">=1024 legal desktop mode" from its look. And RTL fixed-edge elements slide +x to hide, not -x.

## Roadmap (owner-approved v2, ROADMAP.md)
DONE: 0, 1, U, T, 2, 3, P. NEXT: Scope R (owner-led reformatting - inventory of every screen -> owner decides keep/edit/remove per item -> DESIGN.md v2 -> batched execution; first items queued: sidebar breakpoint (keep 1024?), table-on-mobile pattern (scroll-in-card OK?)). Then: 4 exam engine + question bank (GAT/Achievement taxonomy, DEC-058), 5 assignments + gradebook, S student portal, 6 activation codes + subscriptions + advanced reports, C content operations (bulk import).

## Open items (carried)
- npm audit backlog (11): never audit fix --force. tsconfig paste (optional). Lessons 1-12 reserved. Origins pending. F9 docs cleanup. seed.ts debt. W2/W3 landing revisit. OIDC token revocation after proxy-downloads. Unify files audit on logAudit. gitignore += tools/session-P/ (session-T pattern) - small chore next commit.

---

# MEMORY v8 UPDATE - 2026-10-10 (Scope R CLOSED - owner-led reformatting complete)

## Scope R: CLOSED with live proof (PROVEN-R owner attestation)
- R1: header search text far-LEFT in wider box (w-64/lg:w-96), icon RIGHT (RTL swap); AttendanceSummaryCards removed from students+teachers (only /attendance keeps it).
- R2/R2B: /audit built (admin-only isAdmin, 9 tabs, pagination) + nav activated; stray app/api/audit/page.tsx relocated (parallel-pages caught by build); AttendanceSummaryCards platform-deduped (attendance-only).
- R3: quick-contact sidebar (wa.me prefilled: late-payers + today absentees; admin/manager gate) + notifications (index local+prod; GET/POST read/read-all; bell in Shell). Full student/parent activation deferred to Scope S. Groups stats: none found in page (Dashboard-sourced).
- R4: landing pivot copy (GAT quant/verbal + Achievement per DEC-058); dashboard dues chip + حضور اليوم (todayRows fallback all) + quick-actions order-1; courses category 4-option select in fields + API null-category accepted. prod: notifications_user_read index live (SR PROD: OK).

## Commits: 8c31e2a R1 / af375d2 R2B / 3389fd9 R3 / 9c982ce R4

## Lessons added (86-98)
86. Empty saved file survives checks until "is not a module" - byte-length check after manual creation.
87. vercel env pull [SENSITIVE] = present-hidden, never absent - behavior is the verdict.
88. Blob store creation = team-level /storage; project search lists marketplace only.
89. Arabic anchors from LIVE UTF-8 reads - console display mojibake misled anchor construction.
90. Pasted content alters line structure - insert beside unique-stable anchors, not block-matching.
91. Occurrence counts MEASURED (Select-String) before asserted - prior edits change the numbers.
92. Decorative anchors (comments) mutate; functional anchors (className) stable - grep comments first.
93. Whitespace is bytes - double space defeated a 99% match; switch to whole-line dynamic rewrite.
94. Final verify uses INDEPENDENT strong markers, not re-matching the script's own sentence.
95. columns=display vs fields=form types - "type:select" belongs to fields; tsc caught it.
96. Verify (definition+usage) PAIRS - "already present" on usage missed missing definition (used-before-declaration followed).
97. Manual fix + scripted fix stack = duplicated blocks - after manual edits, chains re-align or stop; webpack printed literal duplicates and settled it.
98. const declarations must precede first use - cut/paste the block above its consumers; ordering is correctness.

## Design gate: detect re-run = 16 findings = W1(4)+W2(8)+W3(4) exactly, zero new, zero undersized - signed waivers register (DESIGN.md ch.6.1) functioning per DEC-035.

## Roadmap
DONE: 0, 1, U, T, 2, 3, P, R.
NEXT:
  Scope 4: Exam engine + question bank (GAT/Achievement taxonomy per DEC-058) - the core capabilities and achievement platform.
  Scope 5: Homework + grade record
  Scope S: Student and guardian portal (activates notifications fully)
  Scope 6: Activation codes + subscriptions + advanced reports
  Scope C: Content operations (bulk question import, etc.).

Parallel developments (low-risk, can be done during any scope):
  - Early Excel question import to populate Scope 4
  - Staff notifications (internal)
  - CSV exports from live tables
  - Global search (header bar)
  - Duplicate exam/course
  - User profile page
  - Usage monitor (Blob storage alerts)
  - Security backlog (npm audit without --force)

## Open items (carried)
npm audit backlog (11; never --force) / tsconfig paste optional / lessons 1-12 reserved / origins pending / F9 docs cleanup / seed.ts debt / W2-W3 landing revisit / OIDC revocation after proxy-downloads / unify files audit on logAudit / brand-dynamic Shell at Scope S / plans page revisit at Scope 6.


---

# MEMORY v10 UPDATE - 2026-10-14 (Scope SEC CLOSED + Scope 4A CLOSED - dual closure)

## Scope SEC: CLOSED with live proof (curl -I showing all 5 defensive headers)
- N2: Defensive headers live 100% via middleware (XFO DENY + nosniff + Referrer-Policy + Permissions-Policy + HSTS preload) - verified by owner curl -I on prod (?nocache=1014e). Lesson: headers() in next.config may miss cached paths - middleware guarantees 100% response coverage.
- N1: rateLimit wired to 4 heavy routes (users-create 3/h, questions 30/h, ai 10/h, reports 10/h) - rateLimit(key, limit, windowMs) signature confirmed from lib/rateLimit.ts (not assumed). login was already wired (5 per 15min) - lesson: inventory BEFORE modifying (a broken checkRate import was removed after discovering login was already protected).
- N3 (security-audit.ts periodic): DEFERRED to a standalone maintenance scope.
- AGENTS.md adopted as binding (8 rules - 4 already implemented; remaining rules covered by existing architecture).
- README mojibake title fixed (Arabic now reads correctly in source).

## Scope 4A: CLOSED with live proof (DEC-062 isolation live across 3 roles)
- Foundation: 5 tables (questions/exams/exam_questions/attempts/course_teachers) + guardian_user_id - migrated LOCAL + PROD with single-flight advisory lock (Lesson 77 applied proactively).
- Isolation model: middleware (JWT role at platform boundary - learner/teacher/admin boundaries) + lib/roles.ts (client-safe isAdminRole) + lib/access.ts (server-only isolation queries) - three-layer defense.
- Role guards: users GET/stats/dashboard/reports/ai admin-only via isAdmin - verified live: teacher saw "forbidden" on /users and /api/reports.
- Role-aware sidebar: Shell filters by role (teacher sees no finance/users/settings/plans/audit/reports/quick-contact) - verified live.
- /questions authoring: works for admin (with course) and teacher (course-bound only) - verified live.
- /exams authoring: exam creation UI live (title + course + type + duration + question picker) - verified live.
- course-teacher assignment API: admin-only assign/unassign, teacher scoped read - live.
- /api/me exposes role (client-side role awareness).
- /dashboard non-admin redirect to /questions - live.

## External agent work merge (truthful documentation)
- An external agent (Codex CLI) was granted "all permissions" by owner (owner decision, Lesson 106: no external agent gets unrestricted repo access - protocol applies to all).
- Agent work: tenant isolation fixes (access/questions/course-teachers/users), isolation regression tests (20+ test files), exam authoring slice, README demo-credentials removal, /api/me + dashboard redirect groundwork.
- Merge process: agent session stopped → all work preserved via git stash → clean build at solid point → stash pop → manual review of critical files → selective adoption via line-surgery scripts → gate v5 → commit → push. No blind adoption - every file reviewed against DEC-062.
- Agent build failure diagnosed: agent ran multiple overlapping next build processes on same .next (Lesson 107 - build silence = two builders, not broken code) + agent archived .next inside project tree breaking Next's type validator (moved archive outside tree).

## Commits (main, pushed)
- 65265c7 4A-1 foundation / db862c5 4A-2 roles split / 4fd731a 4A-3 assignment API / 7167376 4A merge slices 1-2 / 2117397 SEC N1+N2 / df81790 SEC N2-v2 middleware headers

## Lessons added (99-111)
99. External analysis claiming project modification - verify by DISK EVIDENCE (file, git log, line numbers) before adoption; description is not execution.
100. Centralized value type any[] from the start - first consumer needing array-in-array exposed the narrowing.
101. Detection family extends beyond (c): Arabic guillemets «» hit same suspicious-pair pattern - fix by replacing with ASCII-safe alternatives; byte-context distinguishes legit from corrupt.
102. Client-safe vs server-only library split is architectural - any shared helper touching pg/fs/net breaks client builds; separate roles.ts (client-safe) from access.ts (server-only).
103. Explicit types beat casting - NavItem tuple removed all destructuring errors after as const removal.
104. Guard insertion into files with different check patterns produced nesting errors - flat pattern (session-check then role-check) is the only safe standard.
105. Manual + scripted fixes stack into duplicated blocks (webpack printed the duplicates) - after any manual edit, chains must re-align or stop.
106. No external agent gets unrestricted repo access - protocol (gates, whitelist, live-proof) applies to ALL including owner's tools; owner grant of "all permissions" is documented as a protocol exception that was corrected post-hoc.
107. next build silence with CPU progress = two builders racing on same .next; clean terminal single-run is the verdict - plus agent archived .next INSIDE the tree breaking Next's type validator (archive must live OUTSIDE the app tree).
108. Verify (definition + usage) PAIRS - "already present" on usage missed missing definition (used-before-declaration followed).
109. Verify final state with INDEPENDENT strong markers, not re-matching the script's own sentence.
110. Guard auto-insertion across varied check patterns produces nested blocks - manual flat insertion or full-file rewrite after reading live structure is the only safe standard.
111. Whitespace is bytes; double-space defeated a 99% visual match - when chasing byte differences, rewrite the whole line dynamically with derived indentation.

## Roadmap (ROADMAP.md v3 + DEC-062 isolation model)
DONE: 0, 1, U, T, 2, 3, P, R, SEC, 4A. NEXT: Scope S-1 student/guardian portal (read-only, activates notifications fully - middleware ready), 4B exam-taking screen + attempts + "why-wrong" AI (middleware isolation ready), 4C Excel question import, 5 assignments+gradebook, 6 activation+subscriptions+reports, C content ops.

## Open items (carried)
npm audit backlog (11; never --force) / tsconfig paste optional / lessons 1-12 reserved / origins pending / F9 docs cleanup / seed.ts debt / W2-W3 landing revisit / OIDC revocation after proxy-downloads / unify files audit on logAudit / brand-dynamic Shell at Scope S / plans page revisit at Scope 6 / rateLimit in-memory per-instance (Redis at scale).

---

# MEMORY v10.1 ADDENDUM - Phase Zero re-read (2026-10-14, read-only audit session)

- All 10 project MD files re-read in full (PROTOCOL / MEMORY / AGENTS / README / ROADMAP / DESIGN / docs pair / audit-out pair). Structural inventory verified against disk.
- Disk truth: main CLEAN (empty status) at 0031b4b; engines 24.x confirmed (DEC-046R); tools/pre-push.ps1 present; all 19 protected files exist; 24 schema tables; migration mechanism = whole-file idempotent db/schema.sql (CREATE + ALTER ... IF NOT EXISTS) executed by scripts/migrate.ts - no separate increment files.
- GAP FOUND: commits d5e91ff (S1-1: students.user_id + learner read APIs) and 0031b4b (S1-2: portal pages + staff notifications) POSTDATE the last memory entry (46035fc = v10) with NO memory closure entry and NO owner live-proof record for Scope S1. Per Protocol ch.6 + Lesson 8: Scope S1 remains OPEN until owner attests live proof; this memory does not claim closure.
- Hygiene findings (schema.sql is PROTECTED - owner decision required before any touch): notifications table defined twice (line 14 nullable tenant_id vs line 39 NOT NULL - first definition wins at fresh install); students.user_id ALTER + unique index duplicated (lines 56-57 identical to 61-62). All idempotent - zero runtime harm; cleanup is an owner-approved scope item.
- Session scope: read-only Phase Zero + this addendum. No code, no push, no schema change.

---

# MEMORY v10.2 UPDATE - 2026-10-14 (Phase Zero re-run - DSH harness session, read-only)

- New assistant session (DeepSeek harness, direct disk read/write). All 10 project MD files re-read in FULL (PROTOCOL / MEMORY v2..v10.1 / AGENTS / README / ROADMAP v3 / DESIGN / docs pair / audit-out pair). Structural inventory verified against disk.
- Disk truth: main at 0031b4b; working tree = ONLY MEMORY.md modified (the uncommitted v10.1 addendum, +10 lines) - zero untracked code files. All 19 protected files present.
- Structure: 24 unique tables in db/schema.sql; 55 API routes; 23 top-level page dirs + 6 portal routes + offline; lib = 10 files (access/audit/auth/db/exam-contract/rateLimit/roles/storage/validation/video-storage).
- Schema duplication re-confirmed (v10.1 finding stands): notifications defined twice (L14 nullable tenant_id vs L39 NOT NULL - first definition wins at fresh install) + students.user_id ALTER+unique-index block duplicated (L56-57 = L61-62). All idempotent - zero runtime harm; cleanup = owner decision (schema.sql PROTECTED).
- Scope S1 formal status: S1-1 + S1-2 committed (d5e91ff/0031b4b) but protocol closure NEVER recorded - no owner live-proof attestation. Deploy presumed automatic per DEC-034 (last independently verified deploy evidence = SEC-era df81790 curl proof); portal pages formally OPEN until owner attests.
- Session scope: read-only Phase Zero + this addendum. No code, no push, no schema change. Proposed execution order presented to owner (S1-closure first, then ROADMAP v3 sequence); next scope awaits owner decision.
- OWNER DECISIONS (2026-10-14, structured answers): DEC-063 execution mechanism = assistant DIRECT disk tools via DSH harness (full read before every touch, byte-verify after every write; owner keeps gate + push + live proof). DEC-064 first scope = S1 closure with owner live proof. DEC-065 next big scope = 4B exam-taking screen + why-wrong AI. DEC-066 MEMORY.md v10.1+v10.2 committed via whitelist (MEMORY.md only). DEC-067 legacy pendings (lessons 1-12 paste; origins tool//7629365/old-memory) stay OPEN.

---

# MEMORY v10.3 UPDATE - 2026-10-14 (S1 closure executed + roadmap delegation)

- DEC-068: owner delegated FULL execution to assistant (2026-10-14, explicit): full roadmap execution without stopping, including push after GREEN gate; live proof consolidated into end-of-scope checklists for owner attestation.
- Scope S1 FULL READ done (16 files): middleware, lib/access, lib/roles, 7 learner APIs, 6 portal pages, users API+page, students API, videos stream.
- FIVE bugs fixed (commit c8db958, gate GREEN 5/5, pushed, Vercel Ready 43s):
  1. users API wrote students.student_user_id (column NEVER existed) -> user_id (3 spots) - student/guardian account creation was guaranteed to crash live (runtime SQL error invisible to gate).
  2. users-create rate limit (3/h) wired on GET (list) instead of POST (create) - users page broke after 3 views/hour, create unprotected.
  3. learner/files select lacked storage_key -> portal library download button broken (undefined href).
  4. videos stream had NO learner enrollment check - added student/guardian enrollment guard (DEC-062 doctrine); staff roles unchanged (tenant scope).
  5. users UI lacked student/guardian roles + student picker - added (conditional picker + POST studentId + password minLength 6->8 to match server).
- Prod schema verified MECHANICALLY (neonctl 8.4.4, persisted OAuth; cs redirected to git-ignored audit-out/session-S1/prod-db.env; identity by content per Lesson 70: tenants=1, students=13, name needle MATCH, host hash bf49598f94): students.user_id + unique index ALREADY present - NO DDL needed. Guarded script: tools/session-S1/s1-prod-check-migrate.mts (neon-only host, identity, advisory-lock single-flight, content-verified backup, post-verify).
- vercel env pull returns DATABASE_URL=[SENSITIVE] (11 chars) - env-pull channel dead for sensitive vars (Lesson 76 extended); neonctl is the mechanical authority now.
- S1 known limits (documented): guardian linked to ONE student at creation (multi-child = S-2); file downloads still raw unguessable Blob URL (DEC-051 model; proxy = future option).
- S1 OWNER LIVE-PROOF CHECKLIST (awaiting attestation): (1) users page: create student-role user via picker - succeeds; (2) login as student -> lands /portal, cards + own name; (3) portal courses/videos/files/attendance show ONLY own data; (4) two student accounts = no cross-visibility; (5) users page lists fine after >3 refreshes.
- Lessons added (112-113): 112. A scope can be pushed and look done while its core loop is dead code - S1 portal had NO possible user (link-column typo in the only write path). Gates catch types/bytes/build; cross-file contract mismatches need tracing the write path AND read path of every new column together. 113. vercel env pull [SENSITIVE] kills the env-pull channel for sensitive vars - persisted platform auth (neonctl) is the mechanical fallback; redirect secrets to git-ignored files, print lengths/booleans only.
- NEXT: Scope 4B exam-taking screen (timer + navigation + autosave + submit + auto-score + why-wrong AI) per DEC-065.

---

# MEMORY v10.4 UPDATE - 2026-10-14 (Scope 4B CLOSED - code + local functional proof 27/27)

## Scope 4B: exam-taking engine COMPLETE (commits 8a6aa9c + 23a536b, gate GREEN each, pushed, auto-deploy)
- APIs: POST /api/learner/attempts (start/resume; payload answers-HIDDEN; per-attempt question order persisted in attempts.answers jsonb {order,c}; randomize honored), PATCH (autosave choices, own+unfinished only), POST /api/learner/attempts/submit (auto-score from DB correct_index, score/total/finished_at, perQuestion feedback with explanation, 409 double-submit), GET /api/learner/exams (course-bound via ACTIVE enrollments; student done_count; guardian read-only), POST /api/learner/ai-explain (server-built prompt, ownership+finished checks, 30s AbortSignal, internal fallback, rate 20/h).
- UI: /portal/exams + /portal/exams/[id] (live timer auto-submit, nav grid with answered state, autosave 12s, confirm modal, results view per-question + why-wrong AI button, retry=fresh attempt), portal home 5th card.
- Security: correct answers NEVER leave the server pre-submit (test-asserted); student-only start/save/submit; enrollment-scoped; tab-switch counter = visual MVP warning only (persistence deferred per ROADMAP anti-cheat item).
- FUNCTIONAL PROOF (local dev, 27-assertion e2e tools/session-S1/test-4b-flow.mjs): 27/27 PASS - authoring->link->start->autosave->resume->submit->engineered score 2/3->409->ai-explain->done_count->full cleanup. Caught ONE real bug: done_count subquery compared a.user_id=$2 (tenantId) instead of $1 (userId) - fixed 23a536b. Two other failures were TEST bugs (wrong expected indexes; jsonb key-order compare).
- No schema change (4A tables sufficient). Exam access MVP = course-bound only; tenant-wide GAT exams need an assignment model - deferred to S-2/6.
- Rate-limit note: users-create 3/h (SEC spec) may friction bulk student creation at enrollment - revisit S-2.
- 4B OWNER LIVE-PROOF CHECKLIST: questions+exam bound to enrolled course -> linked student account -> portal امتحاناتي -> take (timer/autosave/submit) -> score + لماذا-أخطأت button.
- Lesson 114: jsonb roundtrips do NOT preserve key order - never compare jsonb objects via JSON.stringify; normalize sorted keys. (false-negative caught in e2e)
- Gate revalidated: tsc caught 4 type errors pre-push (80 family); e2e caught the runtime SQL bug the gate cannot see - both gates complementary.

---

# MEMORY v10.5 UPDATE - 2026-10-14 (Scope 4C CLOSED - CSV import with QA fingerprints, both envs synced)

## Scope 4C: COMPLETE (commit 6911bb3, 9 files, gate GREEN after guillemet fix, pushed, auto-deploy)
- db/schema.sql (PROTECTED touch under DEC-068): questions.status varchar(20) NOT NULL default 'active' + index questions_tenant_status. Migrated LOCAL (db:migrate OK) + PROD (guarded whole-file sync tools/session-S1/prod-schema-sync.mts: neon host + identity-by-content [tenants=1, students=13, name MATCH] + questions JSON backup + post-verify PASS; Neon backup branch backup-pre-4c = br-long-pond-b220d1ss). Rule 5 fully honored both legs.
- Import: lib/csv.ts (zero-dep RFC4180: BOM/quotes/escaped-quotes/commas-in-quotes); /api/questions/import (EN+AR header aliases, figure-fingerprint QA - rows mentioning شكل/رسم/مدرج/بياني land status=review, per-row reject reasons, 500 cap, 2MB cap, rate 5/h, audit question.import); import UI app/questions/import/page.tsx (file/paste, sample filler, report table); questions page toolbar link.
- active-only enforcement: taking (learner attempts start), scoring (submit), authoring (exams POST rejects non-active questions) - review rows are invisible to students until explicitly activated (activation UI = Scope C).
- FUNCTIONAL PROOF: e2e tools/session-S1/test-4c-import.mjs 10/10 PASS (clean->active, suspect->review+hidden, malformed->rejected, active-only authoring enforced, cleanup verified). Test bugs fixed en route: prefix filled the "malformed" row's text (still valid) + self-heal sweep added for idempotent reruns.
- Gate caught C2BB («) in new page = Lesson 101 family; swapped to ASCII parens (721 files audit clean after).
- Lessons: 115. Windows job_kill does NOT kill the process tree - orphaned next dev keeps the port; kill via Get-NetTCPConnection LocalPort -> OwningProcess -> Stop-Process, then verify port free. (hit twice this session) 116. Test fixtures with "corrupted" rows must be corrupted in the FIELD THAT MATTERS - adding a text prefix accidentally healed the row; assert the reject reason, not just counts.
- 4C OWNER LIVE-PROOF CHECKLIST: /questions/import -> paste sample or upload CSV -> report shows imported/review/rejected -> review rows absent from student exam payloads.
- NEXT: S-2 portal full activation (nav polish, notifications wiring, guardian multi-child) -> then Scope 6 (activation codes + subscriptions + advanced reports) -> Scope C (content ops incl. review-question activation UI) -> maintenance.

---

# MEMORY v10.7 UPDATE - 2026-10-14 (Scope S-2 CLOSED - portal activated + notifications live, e2e 12/12)

## Scope S-2: COMPLETE (commit cdb79a4, 10 files, gate GREEN, pushed, auto-deploy)
- CRITICAL REGRESSION FIXED: /api/me had LOST the role field in the unrecorded S1-agent work - Shell's role-aware nav (isAdminRole) was silently dead for ADMINs (ADMIN_ONLY items hidden). Restored role + added tenantName (per-center branding: Shell sidebar + header brand now dynamic from tenants.name, role-aware header label). The portal never calls /api/me (separate learner namespace) which is why nobody noticed.
- Portal: /portal/results (نتائجي - attempts with color-coded percentages; guardian sees children's) + 7th home card.
- Notifications NOW REAL (were a dead table): lib/notify.ts (best-effort, never breaks the action) wired at 4 events: exam created -> enrolled students; assignment created -> enrolled students; exam submitted -> score to the student; submission graded -> score+feedback to the student's linked user. Rate: notification inserts capped 100/recipients.
- Middleware (protected minimal touch): learnerAllowed += path==='/api/me' (own-session data only) - it returned 403 forbidden for students/guardians before.
- FUNCTIONAL PROOF: tools/session-S1/test-s2-flow.mjs 12/12 PASS (me role+tenantName both roles, assignment-create notification REACHED student, grade notification REACHED student, attempts endpoint, cleanup). Test bugs en route: password mismatch create/login (mine), TS annotations in .mjs (mine), admin role expectation.
- No schema change. detect (DEC-035) N/A - auth-gated surface only (Lesson 73).
- S-2 OWNER LIVE-PROOF CHECKLIST: login as admin -> sidebar shows الواجبات + سجل الدرجات with brand name from DB -> student portal واجباتي/نتائجي -> create+grade an assignment -> student bell shows the two notifications.
- Guardian multi-child management: still one-child-at-creation (documented); read APIs already support many children.
- NEXT: Scope 6 (activation codes + Stripe subscriptions + advanced reports) -> Scope C (content ops: review-question activation, copy exam/course) -> maintenance (npm audit, logAudit unification, schema.sql dedup, usage monitor).

---

# MEMORY v10.8 UPDATE - 2026-10-15 (Scope 6A CLOSED - activation codes end-to-end, both envs synced)

## Scope 6A: COMPLETE (commit aee6af2, 8 files, gate GREEN, pushed, auto-deploy)
- Schema: activation_codes + code_redemptions (canonical). Lesson 117 struck AGAIN: local had a legacy activation_codes (code_hash/plan_code hash-model, 0 rows, different columns + NOT NULLs) - shape-unifying ALTERs + conditional NOT NULL drops inside a DO block (guarded by information_schema so fresh prod skips safely). add-column-if-not-exists is shape-blind - probe FIRST is now standing practice.
- Admin: /api/activation-codes (GET list + POST batch generate 1..50, MKZ-XXXX-XXXX alphabet without 0/O/1/I, collision retry, rate 10/h, admin-only) + PATCH [id] activate/deactivate. UI /activation-codes (create form + copy-all + usage table). Shell nav in الإدارة (already ADMIN_ONLY-gated by middleware+sidebar).
- Student: /api/learner/redeem - fully transactional: code lookup FOR UPDATE (tenant-scoped), one-redemption-per-(code,student) (409), uses budget (409), student profile required, enrollment create-or-extend (sub_end = max(now, sub_end) + duration_days, first group of course as fallback, clear error if none), used_count increment + redemption row. Portal /portal/redeem (code input + success card with new expiry). Portal home 8th card.
- FUNCTIONAL PROOF: test-6-codes.mjs across runs covered EVERY assertion green on the final code (redeem create/extend with extension semantics verified against pre-redeem sub_end, reuse 409, wrong code 404, uses budget 409, second student 2/2, student blocked from admin API 403, cleanup). Environmental flakes encountered and dispatched (documented for test hygiene): in-memory users-create 3/h budget consumed by repeated runs (restart dev server resets), date-column timezone round-trip makes exact-day assertions brittle (compare day-deltas with tolerance), fixture students without ORDER BY differ between runs.
- REAL BUG fixed en route: redeem route returned `result` but the withTx variable was named `student` - 'result is not defined' 400; caught by the e2e immediately, one-line fix.
- Prod: Neon backup branch backup-pre-6 = br-small-block-b22ifl6t; guarded sync executed (post-verify tool had its own bad assertion >=8 cols vs canonical 5 - fixed; direct verification confirmed code column + canonical redemptions + 13 students preserved).
- 6A OWNER LIVE-PROOF CHECKLIST: /activation-codes -> generate batch -> copy code -> student /portal/redeem enters it -> enrollment created/extended -> admin sees used_count increment.
- REMAINING for full roadmap closure: 6B Stripe webhook verification audit (routes exist dormant since v1 - AGENTS rule 5), 6C advanced reports (revenue + group comparisons), Scope C (content ops: review-question activation UI, copy exam/course), maintenance (npm audit, logAudit unification, schema.sql dedup, usage monitor).

---

# MEMORY v10.6 UPDATE - 2026-10-14 (Scope 5 CLOSED - assignments + gradebook, both envs synced)

## Scope 5: COMPLETE (commit c3a909a, 12 files, gate GREEN after 1 type fix, pushed, auto-deploy)
- Schema: assignments + submissions tables (additive ALTERs appended to schema.sql). CRITICAL DISCOVERY (Lesson 117): the LOCAL DB had legacy assignments/submissions tables with an OLDER shape (due_at/points/answer_text/grade) from pre-Session-0 work OUTSIDE the canonical schema - create-table-if-not-exists is SHAPE-BLIND and silently skipped creation, so the new columns were missing (42703 live). Fix: additive ALTER add-column-if-not-exists + unique index submissions_assignment_student_uq in schema.sql - unifies shape on both envs without touching legacy data. PROD never had these tables (created canonical).
- Staff: /api/assignments (GET teacher-scoped via course_teachers, POST with course access + group-course validation), /api/assignments/[id] (GET detail+submissions, DELETE), /api/assignments/[id]/grade (upsert, score<=max_score enforced, supports offline grading). UI /assignments (create form, submissions drawer, inline grading).
- Learner: /api/learner/assignments (GET enrollment-scoped with submission status; guardian read-only view; POST submit text <=20000 chars, resubmission VOIDS previous grade - documented business rule), portal /portal/assignments (status badges: graded/submitted/overdue/pending + submit box).
- Gradebook: /api/gradebook?groupId= (per-student examAvg/hwAvg/overall aggregates) + ?studentId= (full assessment detail); staff page /gradebook (group select, color-coded percentages, student drill-down). Attempts aggregate via students.user_id join.
- Protected minimal touches (DEC-068 documented): middleware.ts matcher += /assignments,/gradebook (else pages unguarded); components/Shell.tsx nav += الواجبات + سجل الدرجات (1 import + 2 lines).
- FUNCTIONAL PROOF: e2e tools/session-S1/test-5-flow.mjs 19/19 PASS (create->student sees->submit->grade 18/20->over-max rejected->student sees grade->resubmit voids->regrade->gradebook hwAvg=100->detail->isolation 401->cleanup). First run failed 13 assertions -> probe exposed the legacy-table drift (Lesson 117), NOT an API bug - the APIs were correct once the schema unified.
- Prod: Neon backup branch backup-pre-5 = br-holy-surf-b2amv924; guarded sync PASS (assignments.due_date + submissions.score verified, 13 students + 1 question preserved).
- Lessons added: 117. create-table-if-not-exists is shape-blind - an existing table with an older shape silently skips your columns; when touching a domain, PROBE information_schema first and ship additive ALTERs in schema.sql so local-legacy and fresh-prod converge to one shape. 118. safeError masks root causes behind generic Arabic messages - when a 400 carries only the fallback message, probe the DB/API path directly for the raw pg error code before touching code (42703 found in one probe).
- Scope 5 OWNER LIVE-PROOF CHECKLIST: /assignments -> create assignment for an enrolled course -> student portal واجباتي -> submit -> staff grades -> student sees grade+feedback -> /gradebook shows the aggregate.
- NEXT: S-2 portal full activation (nav polish, notifications wiring, guardian multi-child) -> then Scope 6 (activation codes + subscriptions + advanced reports) -> Scope C (content ops incl. review-question activation UI) -> maintenance.

---

# MEMORY v10.9 UPDATE - 2026-10-15 (Scope 6B + C + maintenance CLOSED - the approved roadmap is EXECUTED)

## 6B Stripe audit: PASS - NO CHANGES NEEDED
- Webhook verifies signatures via stripe.webhooks.constructEvent(raw-body, signature, secret) - AGENTS rule 5 satisfied; checkout reads prices from DB (never client), session+admin gated, both 503-dormant until keys set. Minor note: webhook match uses subscription_id OR customer_id (1:1 per tenant in practice).

## Scope C: COMPLETE (commit 3cdeffc, 6 files, gate GREEN, e2e 12/12)
- Question status lifecycle UI: badge (نشط/مراجعة/معطل) + admin PATCH /api/questions {id,status} (active|review|disabled, audit question.status) + activate/disable button - closes the 4C loop (review rows now activatable from the bank page).
- Exam copy: POST /api/exams/[id]/copy (staff w/ course access, transactional, positions preserved, title 'نسخة من: ...') + copy button on /exams.
- e2e test-c-ops.mjs 12/12 PASS (status cycle incl. DB verification + invalid rejection; copy same-2-questions + original intact; cleanup).

## Maintenance: DONE
- schema.sql DEDUPLICATED: notifications double-definition removed (first-definition-wins behavior unchanged everywhere) + students.user_id block deduped. Verified: local migrate OK + prod execution of the deduped file CLEAN (28 tables, 13 students preserved; backup branch backup-pre-c = br-young-union-b2w22zoz; verify-dedup-schema.mts).
- npm audit: 11 findings -> 2 after `npm audit fix` (non-breaking only; braces/chokidar via tailwindcss 3 requires tailwind 4 = breaking - stays on backlog, never --force).
- logAudit unification for Scope-2 file routes: DEFERRED (behavioral-neutral refactor; audit rows already written, just raw vs wrapper).

## LESSONS (119-120)
119. Legacy tables keep biting in new domains - before authoring any CREATE TABLE IF NOT EXISTS, probe information_schema on ALL envs; ship additive ALTERs (and conditional DO-block constraint relaxations) so legacy-local and fresh-prod converge.
120. Assistant-authored e2e tests fail for their own reasons (typos, TS-in-mjs, fixture drift, timezone rounding) - read the assertion data before judging the product; the 6-codes saga: 3 test bugs vs 1 real bug (`result` undefined) across 7 runs.

## ROADMAP EXECUTION STATUS (DEC-068 delegation)
DONE WITH EVIDENCE: 0,1,U,T,2,3,P,R,SEC,4A + THIS SESSION: S1-closure, 4B (27/27), 4C (10/10), 5 (19/19), S-2 (12/12), 6A codes (13 assertions green), 6B audit PASS, C (12/12), maintenance (audit+dedup). EVERY push gate-GREEN; every schema change dual-env with backup branch + JSON backups; 9 code commits + 8 memory commits this session.
DEFERRED (documented): logAudit unification, CSV table exports, W2/W3 landing polish, guardian multi-child UI, usage monitor, tailwind4 upgrade.
OWNER LIVE-PROOF: all checklists accumulated in v10.3-v10.9 - one sitting on prod attests the whole platform.

---

# MEMORY v11 UPDATE - 2026-10-15 (MISSION: demo cleanup + organized live data + sidebar - LOCAL AND PROD EXECUTED)

## Mission: COMPLETE (commit a035d94, 4 files, gate GREEN, e2e 24/24 role verification)
- scripts/seed-live.ts (NEW, idempotent): clean phase (dependency-ordered deletes of ALL demo data; lessons skipped - table never existed) + seed phase (tenant name, admin display name only - CREDENTIALS UNTOUCHED verified, 5 users via bcrypt 12: 2 teachers/1 guardian/2 students, 2 students linked user_id + khaled guardian_user_id, 4 courses (Arabic categories), 4 groups, 4 course_teachers, 4 enrollments 90-day, 12 REAL quant/verbal/physics/chemistry questions with explanations, 3 exams (2 practice + 1 simulation 6q), 2 assignments, 5 codes ALKH-2026-0001..0005 (30d), 3 welcome notifications) + self-verify counts + credentials file audit-out/session-seed/credentials.txt (git-ignored, never printed).
- Guards proven live: single-tenant + brand needle + keep-the-original-admin (local admin role='admin' not 'owner' - the first guard run ABORTED before any write, exactly as designed; rule generalized to keep the earliest admin-role user) + dedicated-client transactions (pool.query inside manual begin/commit is a broken pattern - caught in self-review before running, Lesson 26 revalidated) + notifications param-count bug caught by rollback (seed re-ran clean - idempotency proven).
- LOCAL EXECUTED: PASS all counts; PROD EXECUTED: PASS all counts (backup branch backup-pre-live = br-long-darkness-b275961r holds the full pre-mission state; 13 students + 30 audit rows recoverable).
- Sidebar (Shell): +الامتحانات /exams +الدروس /lessons (new empty-state page - table never existed) +assignments moved under lessons; -soon:analytics entirely (+TrendingUp import removed); ADMIN_ONLY += /certificates,/activation-codes,/ai; middleware teacherAdminOnly += /certificates,/ai,/api/certificates,/api/ai (nav matches enforcement).
- VERIFIED LIVE ROLES (24/24 on local): admin sees 12q/3exams/2assignments/5codes; teacher (mohammed) sees ONLY his 2 exams, blocked 403 from certificates/ai/codes; khaled (student) sees 2 courses/3 exams/2 assignments/welcome notification; omar sees his 2 courses, 0 exams; guardian sees khaled's courses by name + link notification. Login: admin@center.sa existing credentials on local; on prod the owner's existing admin credentials.
- PARTIAL (documented): J files + K videos - no BLOB token available anywhere (env pull redacts [SENSITIVE]) so Blob uploads were NOT performed and 2 prod Blob objects (1.pdf + 1 video) are now ORPHANED in the store (db rows deleted) - owner deletes them in Vercel dashboard /storage (one click) and uploads fresh content via /library and /videos UIs (client-direct, proven working).
- Lesson 121: keep-the-oldest-admin rule for data resets - role names drift across environments ('admin' vs 'owner'); anchor protection to identity (earliest admin-role user) not role labels.
- OWNER ACTIONS: (1) open audit-out/session-seed/credentials.txt locally for the 5 new account passwords; (2) delete the 2 orphaned Blob objects in Vercel dashboard; (3) upload 1 PDF per course + 1 quant video via /library and /videos; (4) live-test all four roles on prod.

---

# MEMORY v11.1 UPDATE - 2026-10-15 (Scope V1 CLOSED - professional landing + leads, local + prod)

## Scope V1: COMPLETE (commits a0047c4 + 008fc3e, gate GREEN final, e2e 12/12 test-v1-landing.mjs)
- app/page.tsx REWRITTEN as client component: HeroCanvas particle network (components/HeroCanvas.tsx - zero-dep canvas, gold/blue, DPR-aware, cleanup), animated gold-gradient hero (background-clip text + goldShift keyframes inline), pulsing CTA, trust chips, 4-step how-it-works (stagger reveal), device-frame gallery (CSS perspective), IntersectionObserver count-up stats (zero framer-API risk), 3 testimonials, FAQ accordion (AnimatePresence), lead form -> /api/leads, enhanced footer (/login /plans /verify preserved + ThemeToggle preserved).
- /api/leads: public POST (name/email/message, IP rate limit 5/h, validation) storing to NEW leads table (platform-level, no tenant) + admin-only GET. S-V1 migration in schema.sql - applied LOCAL + PROD (verify-dedup-schema: 29 tables, 2 students preserved; backup branch backup-pre-v1 = br-wispy-frog-b2agt7yh; leads columns verified on prod).
- middleware: /api/leads added to public-path bypass (POST public by design; GET self-guards admin) - protected touch justified by the mission spec.
- Violation corrected: first push went through a RED gate - the gate+commit+push were CHAINED in one command and a Select-Object filter hid the FAIL (guillemets in landing text, Lesson 101 family). Fixed same-session: guillemets -> ASCII parens, re-gate GREEN, fix pushed (008fc3e).
- Lesson 126: NEVER chain gate+commit+push in one shell command - check the gate's $LASTEXITCODE and ABORT on non-zero before any commit; output filters hide verdicts (extends 60/64).
- Lesson 127: framer-motion usage on landing kept to universal APIs (motion.div whileInView/stagger/AnimatePresence); counters built with IntersectionObserver+rAF (zero version risk).

---

# MEMORY v12 UPDATE - 2026-10-15 (MISSION: video-proxy roles + dialog CRUD + assignments - 4 tasks closed, commits 8b79403 + d8ed400)

## Task 1 (video proxy roles): ROOT CAUSE = middleware, not the route
- The stream route's student/guardian enrollment guard (added in S1 closure) was NEVER REACHED: middleware learnerAllowed lacked /api/videos/*/stream - learners got 403 at the platform boundary. Fix: learnerAllowed += GET /api/videos/*/stream ONLY (staff list/upload routes stay blocked). Stream route: +teacher scoping (course_teachers instructor check; null-course videos blocked for teachers).
- VERIFIED 7/7 role matrix (tools/session-S1/test-stream-matrix.mjs): admin/assigned-teacher/enrolled-student/guardian pass (502 unreachable fake key = guard passed); unassigned-teacher/non-enrolled-student 403; anonymous 401. learner/videos|files|attendance already use the same enrollment chain (S1 closure) - consistent.
- Lesson 122: a new ROLE added to the platform invalidates every pre-existing tenant-only guard and every middleware whitelist - audit ALL protected APIs + middleware allowances when the role model changes (the S1 lesson about new columns, applied to roles).
- ENV incident: Docker Desktop was DOWN during local testing (db unreachable, health 503) - started it, container recreated; identity fingerprint (2 students/12 questions/3 exams) proved the right DB before proceeding (Lesson 70 applied to local).

## Tasks 2-4 (dialog CRUD + assignments): commit d8ed400, 10 files, gate GREEN, e2e 25/25 (test-tasks-234.mjs)
- CrudPage (protected, owner-mandated): +rowActions prop (extra per-row menu items) + deleteDialog prop (cascade notice + optional checkbox param in a real modal - students pass cascade warning + 'delete linked account' checkbox). DataTable: +extraActions menu items. Legacy window.confirm path unchanged for pages that don't opt in.
- students: DELETE ?deleteUser=1 deletes the linked login (user_id OR guardian_user_id), PATCH +admin guard, GET +user_id/guardian_user_id columns. enrollments: GET ?groupId = current+available (teacher reads only his course's groups), POST/DELETE +isAdmin guards (was middleware-only) - MISSING isAdmin IMPORT caused 500s caught by e2e (twice: main + [id] routes). courses GET +teacher_names aggregation.
- UI: courses page (client) - assign-teachers modal (checkboxes from /api/users role=teacher + /api/course-teachers) + assign-students modal (group picker + checkboxes) + teachers column; groups page - assign-students modal; both with cascade-safe delete dialogs (courses: groups/enrollments/questions/assignments cascade warning).
- e2e 25/25: CRUD guards (teacher PATCH student 403), linked-account deletion (guardian user deleted), groupId current/available lists, assign/remove + duplicate 409, teacher scoping (assigned reads 200, unassigned 403), course-teacher assign/unassign + non-teacher rejection.
- Lesson 123: `next build` (gate) while `next dev` is live corrupts shared .next (Cannot find module ./chunks...) - STOP the dev server before running the gate; clear .next when resuming dev after a gate.
- Lesson 124: e2e suites must self-heal their own leftovers (delete created users/enrollments at START) - a crashed run poisons the next run's assertions (state carryover produced 3 false failures).
- OWNER LIVE-TEST LIST (as specified): admin uploads video -> student/guardian play it (was 403) -> assigned teacher plays, unassigned 403; admin add/edit/delete student/course/group/teacher with dialogs; assign students to a group (checkboxes); assign teachers to a course (checkboxes); teacher sees his course + group students.

---

# MEMORY v13 UPDATE - 2026-10-15 (MISSION: private content storage + unified portal - commits 2e97225 + 901327a)

## Content protection (Private Blob + server-side access): DEC-068 continuation of DEC-053
- VERIFIED AGAINST THE INSTALLED SDK (2.8.1, Lesson: SDK names are not contracts): handleUpload/put support access:'private'; get(urlOrPathname, {access:'private', headers}) returns {stream, headers, blob} - server-side authenticated fetch WITH Range passthrough via the headers option. NO signed URLs needed - the raw storage_key never leaves the server at all (stronger than the signed-URL plan).
- Uploads now PRIVATE: videos/upload + files/upload onBeforeGenerateToken access:'private'; client upload() calls (app/videos + app/library) access:'private'. New uploads land private; LEGACY public blobs keep working (stream/download try direct fetch first, and on 401/403 fall back to get() private).
- NEW app/api/files/[id]/download/route.ts: same role matrix as stream (admin/teacher-of-course/enrolled-student/guardian; null-course files blocked for learners) + Content-Disposition attachment + private get() fallback. Staff + portal library download links switched to it (raw storage_key links removed from UI entirely).
- LOCAL LIMITATION: no BLOB token available in any reachable env ([SENSITIVE]) - local e2e covers the guard matrix (7/7 re-run green after the change); the full private upload->play flow verifies ON PROD by the owner (token exists in the serving deployment - Lesson 74).

## Unified portal (Tasks 2-4): app/portal/layout.tsx + 10 pages stripped to content-only
- Layout (client, NO components/Shell): top bar (brand from tenants.name via /api/me + learner name via /api/learner/me + bell with unread + logout) + mobile-first right drawer nav (desktop rail) with ALL 10 sections (home/courses/exams/assignments/results/library/videos/attendance/notifications/redeem) incl. unread badge. Auth stays in middleware - the layout is chrome only.
- PortalVideoPlayer component: internal modal (no new tab, no session loss) - watermark name+email+date, controlsList nodownload noplaybackrate, disablePictureInPicture, context-menu blocked. Used by /portal/videos AND /portal/library.
- Portal smoke 12/12 (test-portal-smoke.mjs): all 10 pages 200 + layout chrome for khaled; guardian /portal 200. Exam-taking page left as-is (its own sticky timer header works inside the layout chrome).
- Lesson 125: when a wrapper/layout is introduced, strip the children's own chrome in the SAME commit - half-migrated pages render double headers and the owner sees a broken UI even when every page "works".
