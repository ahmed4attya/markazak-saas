const { SignJWT } = require('jose');
const axios = require('axios');

async function test(path, role, expected) {
    const secret = new TextEncoder().encode("dev-secret-32-chars-long-for-testing-123");
    const token = await new SignJWT({ role, tenant_id: "local-tenant" })
        .setProtectedHeader({ alg: "HS256" })
        .setExpirationTime("2h")
        .sign(secret);

    try {
        const res = await axios.get(`http://localhost:3000${path}`, {
            headers: { Cookie: `session=${token}` },
            validateStatus: () => true
        });
        console.log(`${path} [${role}] -> ${res.status} (Expected: ${expected})`);
    } catch (e) {
        console.log(`${path} [${role}] -> ERROR: ${e.message}`);
    }
}

async function run() {
    console.log("Starting Behavioral Matrix...");
    
    // Guest tests
    try {
        const res = await axios.get(`http://localhost:3000/portal`, { validateStatus: () => true });
        console.log(`/portal [guest] -> ${res.status} (Expected: 307)`);
    } catch(e) { console.log(`/portal [guest] -> ERROR`); }

    try {
        const res = await axios.get(`http://localhost:3000/api/users`, { validateStatus: () => true });
        console.log(`/api/users [guest] -> ${res.status} (Expected: 401)`);
    } catch(e) { console.log(`/api/users [guest] -> ERROR`); }

    // Role based tests
    await test('/api/invoices', 'teacher', '403');
    await test('/api/learner/profile', 'teacher', '403'); 
    await test('/api/students', 'teacher', '200');
    
    try {
        const secret = new TextEncoder().encode("dev-secret-32-chars-long-for-testing-123");
        const token = await new SignJWT({ role: 'teacher', tenant_id: "local-tenant" })
            .setProtectedHeader({ alg: "HS256" })
            .setExpirationTime("2h")
            .sign(secret);
        const res = await axios.post(`http://localhost:3000/api/students`, {}, {
            headers: { Cookie: `session=${token}` },
            validateStatus: () => true
        });
        console.log(`/api/students [teacher-POST] -> ${res.status} (Expected: 403)`);
    } catch(e) { console.log(`/api/students [teacher-POST] -> ERROR`); }

    await test('/api/attempts', 'guardian', '403');
    await test('/api/assignments', 'student', '200');
    await test('/api/users', 'manager', '200');
    await test('/api/users', 'admin', '200');
}

run();
