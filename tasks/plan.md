# Al-Khwarizmi Platform Completion Plan

Date: 2026-10-13
Status: active

## Product decision

Build a serious Arabic-first preparation platform for Qudrat quantitative, Qudrat verbal, and Tahsili. The product must support the complete learning loop: structured courses and protected media, tagged question bank, practice and simulated exams, assignments and gradebook, progress intelligence, motivation, student/guardian experiences, and center administration.

The competitive reference is the public positioning of منصة المفيد: organized courses, large question banks, simulated exams, assignments, points/leaderboards, progress reports, teacher profiles, search, notifications, multi-device support and technical/educational support. We will use these capability signals as market requirements, while creating our own information architecture, design system, content model and implementation.

## Non-negotiable security contract

- Every tenant-owned query includes a tenant predicate derived from the authenticated session; no client-supplied tenant id is trusted.
- Every role has an allow-list: student, guardian, teacher, manager, admin, platform_admin. Default deny applies to unknown or absent roles.
- Students can read only their own enrollments, assigned content, attempts, assignments, grades and notifications.
- Guardians can read only explicitly linked children and only the permitted progress, attendance, grade and billing summaries.
- Teachers can read only courses/groups/content/questions/attempts assigned to them; mutation rights are explicit per resource.
- Managers/admins can operate only inside their own tenant. Platform administration is a separate surface and is never exposed through tenant routes.
- Every mutation validates input, checks authorization, checks ownership/tenant scope, and writes an audit event for sensitive actions.
- Stripe state is accepted only from verified webhooks. Server secrets never enter client components.
- Media access is session-gated and tenant-scoped; raw storage URLs are never returned for protected video.

## Capability map and build order

| Module | Responsibility | Depends on |
|---|---|---|
| identity-access | sessions, roles, tenant scope, guardian links, policy tests | — |
| content-catalog | courses, lessons, files, videos, taxonomy | identity-access |
| assessment-engine | questions, exams, attempts, scoring, explanations | identity-access, content-catalog |
| learning-operations | assignments, submissions, gradebook, reminders | identity-access, assessment-engine |
| learner-experience | student and guardian portals, progress, motivation, notifications | identity-access, content-catalog, assessment-engine, learning-operations |
| monetization | activation codes, subscriptions, entitlements, verified billing | identity-access, learner-experience |
| intelligence-operations | reports, search, imports, quality checks, usage monitoring | all relevant providers |

Build order: identity-access → content-catalog → assessment-engine → learning-operations → learner-experience → monetization → intelligence-operations.

## Delivery phases

### Phase 1 — 4A closeout: trust boundary

Harden the existing questions and course-teacher foundation. Add policy tests for tenant isolation, teacher scope, student self-scope and guardian child-scope. Remove public/demo credentials from documentation. Add a single reusable authorization boundary without rewriting protected infrastructure unnecessarily.

Acceptance: unauthorized and cross-tenant reads/mutations are rejected; teacher access is assignment-scoped; every sensitive mutation is auditable; typecheck/build/gate are green.

### Phase 2 — 4B: assessment MVP

Complete question authoring, exam composition, practice mode, full simulation mode, timed attempts, autosave, submission, scoring, review and “why was this wrong?” explanations. Support Qudrat quantitative, Qudrat verbal and Tahsili domains with subject/topic/skill/difficulty taxonomy.

Acceptance: a scoped teacher can create a question and exam; a scoped student can start, resume, submit and review an attempt; scores and explanations are deterministic and tenant-safe; mobile RTL flow is usable.

### Phase 3 — content and imports

Add course lessons and content sequencing, controlled Excel/CSV import, structural validation, duplicate detection, media-reference checks, and safe disablement rather than deletion for invalid content.

Acceptance: import is dry-run first, produces a report, never silently guesses answers, and invalid rows are disabled/reviewable.

### Phase 4 — assignments and gradebook

Assignments attached to lessons/topics, submissions, teacher grading, late states, gradebook aggregation, and reporting feeds.

Acceptance: student/teacher/manager views are separated and every grade mutation is audited.

### Phase 5 — student and guardian portal

Student dashboard, course progress, protected video, practice queue, exams, assignments, results, notifications and motivation. Guardian dashboard exposes only explicitly linked children.

Acceptance: isolation tests cover self, sibling, teacher and manager boundaries; PWA/mobile flows are verified on the target device.

### Phase 6 — monetization and operations

Activation codes, course entitlements, subscription state from verified Stripe webhooks, advanced reports, CSV exports, search and usage monitoring.

Acceptance: entitlements cannot be self-granted; webhook signatures are verified; billing state is replay-safe; reports are tenant-scoped.

## Quality gates for every slice

- Read every file before editing it; protected files require explicit approval recorded in the task.
- Tests first for business-critical behavior.
- `npx tsc --noEmit`, `npm run build`, and `tools/pre-push.ps1` must be green before commit/push.
- Schema changes require local migration, production backup and production migration through the documented mechanism.
- No `git add .`; whitelist filenames only.
- UI changes require RTL/accessibility/mobile verification and the existing design gate where applicable.
- No “done” claim without owner-visible live proof.
