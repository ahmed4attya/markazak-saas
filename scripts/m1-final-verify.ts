import { guard } from "../lib/guard";
import { PAGE_ACCESS, API_ACCESS } from "../config/access";

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

    console.log("--- M1 BEHAVIORAL UNIT TESTS (RAW OUTPUT) ---");
    for (const t of tests) {
        const result = await guard(t.path, t.role === "guest" ? undefined : t.role, "local-tenant");
        const status = result.status.toString();
        const passed = status === t.expected;
        console.log(`${t.path} [${t.role}] -> ${status} (Expected: ${t.expected}) ${passed ? '✅' : '❌'}`);
    }
}

run().catch(console.error);
