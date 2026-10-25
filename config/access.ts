// config/access.ts - access matrix (M1-p3 v3 rewrite, documentary layer).
// API_ACCESS completed against the live route inventory (74 route.ts files,
// harvest C2-M1-p3-h @ 92caf38). PAGE_ACCESS is preserved VERBATIM from the
// v1 file (dump C2-M1-p3-c3, SHA256 6162918A...EF8AF) because Shell.tsx
// renders the sidebar straight from it - any PAGE_ACCESS edit is a live UI
// change, not documentation. Middleware remains the only runtime gate;
// MATRIX_GAPS is the register of enforcement/intent findings for p4.

import type { AccessRole } from "@/lib/roles";

export type PageAccess = {
  path: string;
  roles: AccessRole[];
  public?: boolean;
};

export type ApiAccess = {
  path: string;
  method?: string;
  roles: AccessRole[];
  public?: boolean;
};

export type { AccessRole };

const ADMIN: AccessRole[] = ['owner', 'manager', 'admin'];
const STAFF: AccessRole[] = ['owner', 'manager', 'admin', 'teacher'];
const LEARNERS: AccessRole[] = ['student', 'guardian'];
const ALL_AUTHED: AccessRole[] = ['owner', 'manager', 'admin', 'teacher', 'student', 'guardian'];

export const PAGE_ACCESS: PageAccess[] = [
  { path: '/dashboard', roles: ['owner', 'manager', 'admin', 'teacher'] },
  { path: '/students', roles: ['owner', 'manager', 'admin'] },
  { path: '/teachers', roles: ['owner', 'manager', 'admin'] },
  { path: '/courses', roles: ['owner', 'manager', 'admin', 'teacher'] },
  { path: '/groups', roles: ['owner', 'manager', 'admin'] },
  { path: '/attendance', roles: ['owner', 'manager', 'admin', 'teacher'] },
  { path: '/library', roles: ['owner', 'manager', 'admin', 'teacher'] },
  { path: '/videos', roles: ['owner', 'manager', 'admin', 'teacher'] },
  { path: '/questions', roles: ['owner', 'manager', 'admin', 'teacher'] },
  { path: '/exams', roles: ['owner', 'manager', 'admin', 'teacher'] },
  { path: '/lessons', roles: ['owner', 'manager', 'admin', 'teacher'] },
  { path: '/assignments', roles: ['owner', 'manager', 'admin', 'teacher'] },
  { path: '/gradebook', roles: ['owner', 'manager', 'admin', 'teacher'] },
  { path: '/finance', roles: ['owner', 'manager', 'admin'] },
  { path: '/certificates', roles: ['owner', 'manager', 'admin'] },
  { path: '/reports', roles: ['owner', 'manager', 'admin'] },
  { path: '/ai', roles: ['owner', 'manager', 'admin'] },
  { path: '/tenants', roles: ['owner', 'admin'] },
  { path: '/users', roles: ['owner', 'manager', 'admin'] },
  { path: '/notifications', roles: ['owner', 'manager', 'admin', 'teacher'] },
  { path: '/settings', roles: ['owner', 'manager', 'admin'] },
  { path: '/plans', roles: ['owner', 'manager', 'admin'] },
  { path: '/activation-codes', roles: ['owner', 'manager', 'admin'] },
  { path: '/audit', roles: ['owner', 'manager', 'admin'] },
];

export const API_ACCESS: ApiAccess[] = [
  // == public API surface (middleware line-7 exemptions; RL limits per middleware v2) ==
  { path: '/api/auth/login', method: 'POST', roles: [], public: true },
  { path: '/api/auth/logout', method: 'POST', roles: [], public: true },
  { path: '/api/auth/forgot-password', method: 'POST', roles: [], public: true },
  { path: '/api/auth/reset-password', method: 'POST', roles: [], public: true },
  { path: '/api/health', method: 'GET', roles: [], public: true },
  { path: '/api/leads', method: 'POST', roles: [], public: true },
  { path: '/api/certificates/verify', method: 'GET', roles: [], public: true },
  { path: '/api/plans', method: 'GET', roles: [], public: true },
  // == admin tier (owner/manager/admin) ==
  { path: '/api/tenants', roles: ADMIN },
  { path: '/api/users', roles: ADMIN },
  { path: '/api/invoices', roles: ADMIN },
  { path: '/api/payments', roles: ADMIN },
  { path: '/api/settings', roles: ADMIN },
  { path: '/api/activation-codes', roles: ADMIN },
  { path: '/api/activation-codes/[id]', method: 'PATCH', roles: ADMIN },
  { path: '/api/audit', roles: ADMIN },
  { path: '/api/certificates', roles: ADMIN },
  { path: '/api/ai', roles: ADMIN },
  { path: '/api/stripe/checkout', method: 'POST', roles: ADMIN },
  { path: '/api/stripe/webhook', method: 'POST', roles: [] },
  // == staff tier (admin + teacher), method omitted = all exported methods ==
  { path: '/api/students', method: 'GET', roles: STAFF },
  { path: '/api/students', method: 'POST', roles: ADMIN },
  { path: '/api/students/[id]', method: 'PATCH', roles: ADMIN },
  { path: '/api/students/[id]', method: 'DELETE', roles: ADMIN },
  { path: '/api/teachers', method: 'GET', roles: STAFF },
  { path: '/api/teachers', method: 'POST', roles: ADMIN },
  { path: '/api/teachers/[id]', method: 'PATCH', roles: ADMIN },
  { path: '/api/teachers/[id]', method: 'DELETE', roles: ADMIN },
  { path: '/api/courses', method: 'GET', roles: STAFF },
  { path: '/api/courses', method: 'POST', roles: ADMIN },
  { path: '/api/courses/[id]', method: 'PATCH', roles: ADMIN },
  { path: '/api/courses/[id]', method: 'DELETE', roles: ADMIN },
  { path: '/api/groups', method: 'GET', roles: STAFF },
  { path: '/api/groups', method: 'POST', roles: ADMIN },
  { path: '/api/groups/[id]', method: 'PATCH', roles: ADMIN },
  { path: '/api/groups/[id]', method: 'DELETE', roles: ADMIN },
  { path: '/api/classrooms', method: 'GET', roles: STAFF },
  { path: '/api/classrooms', method: 'POST', roles: ADMIN },
  { path: '/api/enrollments', method: 'GET', roles: STAFF },
  { path: '/api/enrollments', method: 'POST', roles: ADMIN },
  { path: '/api/enrollments/[id]', method: 'PATCH', roles: ADMIN },
  { path: '/api/enrollments/[id]', method: 'DELETE', roles: ADMIN },
  { path: '/api/attendance', roles: STAFF },
  { path: '/api/attendance/[id]', roles: STAFF },
  { path: '/api/course-teachers', roles: STAFF },
  { path: '/api/assignments', method: 'GET', roles: [...STAFF, 'student'] },
  { path: '/api/assignments', method: 'POST', roles: STAFF },
  { path: '/api/assignments/[id]', method: 'GET', roles: [...STAFF, 'student'] },
  { path: '/api/assignments/[id]', method: 'DELETE', roles: STAFF },
  { path: '/api/assignments/[id]/grade', method: 'POST', roles: STAFF },
  { path: '/api/exams', roles: STAFF },
  { path: '/api/exams/[id]', roles: STAFF },
  { path: '/api/exams/[id]/copy', method: 'POST', roles: STAFF },
  { path: '/api/questions', roles: STAFF },
  { path: '/api/questions/import', method: 'POST', roles: STAFF },
  { path: '/api/modules', roles: STAFF },
  { path: '/api/lessons', roles: STAFF },
  { path: '/api/courses/[id]/curriculum', method: 'GET', roles: STAFF },
  { path: '/api/courses/[id]/curriculum/pdf', method: 'GET', roles: STAFF },
  { path: '/api/dashboard', method: 'GET', roles: STAFF },
  { path: '/api/stats', method: 'GET', roles: STAFF },
  { path: '/api/reports', method: 'GET', roles: ADMIN },
  { path: '/api/gradebook', method: 'GET', roles: STAFF },
  { path: '/api/notifications', roles: STAFF },
  { path: '/api/quick-contact', roles: STAFF },
  { path: '/api/files', method: 'GET', roles: STAFF },
  { path: '/api/files/[id]', method: 'DELETE', roles: STAFF },
  { path: '/api/files/prepare', method: 'POST', roles: STAFF },
  { path: '/api/files/upload', method: 'POST', roles: STAFF },
  { path: '/api/files/upload-complete', method: 'POST', roles: STAFF },
  { path: '/api/files/[id]/download', method: 'GET', roles: [...STAFF, ...LEARNERS] },
  { path: '/api/videos', method: 'GET', roles: STAFF },
  { path: '/api/videos/[id]', method: 'DELETE', roles: STAFF },
  { path: '/api/videos/prepare', method: 'POST', roles: STAFF },
  { path: '/api/videos/upload', method: 'POST', roles: STAFF },
  { path: '/api/videos/upload-complete', method: 'POST', roles: STAFF },
  { path: '/api/videos/[id]/stream', method: 'GET', roles: [...STAFF, ...LEARNERS] },
  { path: '/api/me', method: 'GET', roles: ALL_AUTHED },
  // == learner-only surface (student + guardian) ==
  { path: '/api/learner/ai-explain', method: 'POST', roles: LEARNERS },
  { path: '/api/learner/assignments', roles: LEARNERS },
  { path: '/api/learner/attempts', roles: LEARNERS },
  { path: '/api/learner/attempts/submit', method: 'POST', roles: LEARNERS },
  { path: '/api/learner/attendance', method: 'GET', roles: LEARNERS },
  { path: '/api/learner/courses', method: 'GET', roles: LEARNERS },
  { path: '/api/learner/exams', method: 'GET', roles: LEARNERS },
  { path: '/api/learner/files', method: 'GET', roles: LEARNERS },
  { path: '/api/learner/me', method: 'GET', roles: LEARNERS },
  { path: '/api/learner/mistakes', roles: LEARNERS },
  { path: '/api/learner/notifications', roles: LEARNERS },
  { path: '/api/learner/progress', method: 'GET', roles: LEARNERS },
  { path: '/api/learner/redeem', method: 'POST', roles: LEARNERS },
  { path: '/api/learner/streak', method: 'GET', roles: LEARNERS },
  { path: '/api/learner/training', roles: LEARNERS },
  { path: '/api/learner/videos', method: 'GET', roles: LEARNERS },
];

export const MATRIX_GAPS: string[] = [
  "GAP-1 /api/leads GET: the middleware exemption is path-based, so GET /api/leads is publicly reachable; verify the handler self-guards reads or scope the exemption to POST in p4. RESOLVED @655a634: leads exemption scoped to POST; GET handler self-guards via isAdmin (p4-w1).",
  "GAP-2 /api/stripe/webhook POST: Stripe server-to-server calls carry no session cookie and are 401-jailed by middleware; exempt it and verify the Stripe signature in-route before Stripe activation (p4). RESOLVED @655a634: webhook exempted in matcher+body for cookieless POST; in-route signature-first verified live (401 -> 503 unconfigured) (p4-w1).",
  "GAP-3 /api/quick-contact: a marketing-form endpoint (like /api/leads) that is not exempted; public callers get 401. Confirm intent: exempt+RL like leads, or keep staff-only. DOCUMENTED @dcf667f: staff-only confirmed intended (in-route isAdmin on GET+POST); see docs/gap-3-access-divergences.md (p4-w3).",
  "GAP-4 /api/attendance/[id] and /api/course-teachers mutations sit outside teacherMutationBlocked, so teachers can PATCH/DELETE attendance and POST/DELETE course-teachers at middleware level; confirm intent or extend the block list in p4. RESOLVED @dcf667f: route-level teacher ownership enforced on attendance create+update via course_teachers join; course-teachers verified already self-guarded (p4-w2).",
  "GAP-5 middleware learnerAllowed keeps a dead clause path.startsWith('/api/attempts'); no such route exists outside /api/learner/attempts. Harmless; cleanup candidate.",
  "GAP-6 /api/auth/register does not exist in the live inventory (login/logout only). If public registration ships later it must get its own RL limit and matcher entry (M2 checklist).",
  "GAP-7 PAGE_ACCESS v1 grants student+guardian on /dashboard /library /videos; unreachable for learners. RESOLVED in M2: student/guardian removed from /dashboard /library /videos; learner surface cleanly isolated under /portal and /api/learner/*.",
  "GAP-8 /api/stripe/checkout is intent-admin but middleware does not block teachers on /api/stripe/*; an in-route admin guard is recommended in p4. RESOLVED @655a634: in-route getSession+isAdmin verified present; path appended to teacherAdminOnly exact-match (p4-w1).",
  "GAP-9 /plans page divergence: middleware exempts /plans and /api/plans as public pricing surfaces. RESOLVED in M2: Shell.tsx taught to honor public:true and /plans marked public:true in PAGE_ACCESS.",
];
