const { guard } = require('./lib/guard');
const { PAGE_ACCESS, API_ACCESS } = require('./config/access');

async function runTests() {
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

    console.log("--- BEHAVIORAL UNIT TESTS (lib/guard.ts) ---");
    for (const t of tests) {
        const result = await guard(t.path, t.role, "local-tenant");
        const status = result.status.toString();
        const passed = status === t.expected;
        console.log(`${t.path} [${t.role}] -> ${status} (Expected: ${t.expected}) ${passed ? '✅' : '❌'}`);
    }
}

// Mocking the configs since we are running in a simple node env
global.PAGE_ACCESS = require('./config/access').PAGE_ACCESS;
global.API_ACCESS = require('./config/access').API_ACCESS;

runTests().catch(console.error);
