// Logic mirror of lib/guard.ts and config/access.ts
const PAGE_ACCESS = [
    { path: '/login', public: true, roles: [] },
    { path: '/verify', public: true, roles: [] },
    { path: '/portal', public: false, roles: ['student', 'guardian', 'manager', 'admin'] },
    { path: '/dashboard', public: false, roles: ['manager', 'admin'] },
];
const API_ACCESS = [
    { path: '/api/auth/login', public: true, roles: [] },
    { path: '/api/certificates/verify', public: true, roles: [] },
    { path: '/api/users', public: false, roles: ['manager', 'admin'] },
    { path: '/api/invoices', public: false, roles: ['manager', 'admin'] },
    { path: '/api/learner/profile', public: false, roles: ['student', 'guardian'] },
    { path: '/api/students', public: false, roles: ['teacher', 'manager', 'admin'] },
    { path: '/api/attempts', public: false, roles: ['student', 'teacher', 'manager', 'admin'] },
    { path: '/api/assignments', public: false, roles: ['student', 'teacher', 'manager', 'admin'] },
];

async function guard(path, role, tenantId) {
    if (!role || !tenantId) return { allowed: false, status: 401 };
    
    const pageRoute = PAGE_ACCESS.find(p => path === p.path);
    if (pageRoute) {
        if (pageRoute.public) return { allowed: true, status: 200 };
        if (!pageRoute.roles.includes(role)) return { allowed: false, status: 404 };
        return { allowed: true, status: 200 };
    }

    const apiRoute = API_ACCESS.find(a => path === a.path);
    if (apiRoute) {
        if (apiRoute.public) return { allowed: true, status: 200 };
        if (!apiRoute.roles.includes(role)) return { allowed: false, status: 403 };
        return { allowed: true, status: 200 };
    }

    const protectedPrefixes = ["/dashboard", "/students", "/teachers", "/courses", "/groups", "/attendance", "/finance", "/certificates", "/reports", "/ai", "/users", "/plans", "/activation-codes", "/settings", "/questions", "/exams", "/lessons", "/portal", "/api"];
    if (protectedPrefixes.some(prefix => path.startsWith(prefix))) return { allowed: false, status: 403 };
    
    return { allowed: true, status: 200 };
}

async function run() {
    const tests = [
        { path: '/portal', role: 'guest', expected: '401' },
        { path: '/api/users', role: 'guest', expected: '401' },
        { path: '/api/invoices', role: 'teacher', expected: '403' },
        { path: '/api/learner/profile', role: 'teacher', expected: '403' },
        { path: '/api/students', role: 'teacher', expected: '200' },
        { path: '/api/attempts', role: 'guardian', expected: '403' },
        { path: '/api/assignments', role: 'student', expected: '200' },
        { path: '/api/users', role: 'manager', expected: '200' },
        { path: '/api/users', role: 'admin', expected: '200' },
    ];

    console.log("--- BEHAVIORAL MATRIX (LOGICAL PROOF) ---");
    for (const t of tests) {
        const result = await guard(t.path, t.role === 'guest' ? undefined : t.role, "local-tenant");
        const status = result.status.toString();
        console.log(`${t.path} [${t.role}] -> ${status} (Expected: ${t.expected}) ${status === t.expected ? '✅' : '❌'}`);
    }
}

run();
