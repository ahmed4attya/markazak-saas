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

export const PAGE_ACCESS: PageAccess[] = [
  { path: '/dashboard', roles: ['owner', 'manager', 'admin', 'teacher', 'student', 'guardian'] },
  { path: '/students', roles: ['owner', 'manager', 'admin'] },
  { path: '/teachers', roles: ['owner', 'manager', 'admin'] },
  { path: '/courses', roles: ['owner', 'manager', 'admin', 'teacher'] },
  { path: '/groups', roles: ['owner', 'manager', 'admin'] },
  { path: '/attendance', roles: ['owner', 'manager', 'admin', 'teacher'] },
  { path: '/library', roles: ['owner', 'manager', 'admin', 'teacher', 'student', 'guardian'] },
  { path: '/videos', roles: ['owner', 'manager', 'admin', 'teacher', 'student', 'guardian'] },
  { path: '/questions', roles: ['owner', 'manager', 'admin', 'teacher'] },
  { path: '/exams', roles: ['owner', 'manager', 'admin', 'teacher'] },
  { path: '/lessons', roles: ['owner', 'manager', 'admin', 'teacher'] },
  { path: '/assignments', roles: ['owner', 'manager', 'admin', 'teacher'] },
  { path: '/gradebook', roles: ['owner', 'manager', 'admin', 'teacher'] },
  { path: '/finance', roles: ['owner', 'manager', 'admin'] },
  { path: '/certificates', roles: ['owner', 'manager', 'admin'] },
  { path: '/reports', roles: ['owner', 'manager', 'admin', 'teacher'] },
  { path: '/ai', roles: ['owner', 'manager', 'admin'] },
  { path: '/users', roles: ['owner', 'manager', 'admin'] },
  { path: '/settings', roles: ['owner', 'manager', 'admin'] },
  { path: '/plans', roles: ['owner', 'manager', 'admin'] },
  { path: '/activation-codes', roles: ['owner', 'manager', 'admin'] },
  { path: '/audit', roles: ['owner', 'manager', 'admin'] },
];

export const API_ACCESS: ApiAccess[] = [
  { path: '/api/auth/login', method: 'POST', roles: [], public: true },
  { path: '/api/health', method: 'GET', roles: [], public: true },
  { path: '/api/leads', method: 'POST', roles: [], public: true },
  { path: '/api/users', roles: ['owner', 'manager', 'admin'] },
  { path: '/api/invoices', roles: ['owner', 'manager', 'admin'] },
  { path: '/api/payments', roles: ['owner', 'manager', 'admin'] },
  { path: '/api/settings', roles: ['owner', 'manager', 'admin'] },
  { path: '/api/plans', roles: ['owner', 'manager', 'admin'] },
  { path: '/api/activation-codes', roles: ['owner', 'manager', 'admin'] },
  { path: '/api/audit', roles: ['owner', 'manager', 'admin'] },
  { path: '/api/certificates', roles: ['owner', 'manager', 'admin'] },
  { path: '/api/ai', roles: ['owner', 'manager', 'admin'] },
];
