const base = 'http://localhost:3000';

async function login() {
  const r = await fetch(`${base}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@center.sa',
      password: 'admin123'
    })
  });

  const cookie = r.headers.get('set-cookie');

  console.log('LOGIN:', r.status);

  if (!cookie) {
    console.log('Login failed:', await r.text());
    process.exit(1);
  }

  return cookie.split(';')[0];
}

async function test(cookie, method, path, body) {
  const options = {
    method,
    headers: {
      Cookie: cookie
    }
  };

  if (body !== undefined) {
    options.headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(body);
  }

  const r = await fetch(`${base}${path}`, options);
  const text = await r.text();

  console.log(`${method} ${path}: ${r.status}`);

  if (r.status >= 400) {
    console.log(text);
  }

  return { status: r.status, text };
}

const cookie = await login();

const endpoints = [
  '/api/dashboard',
  '/api/students',
  '/api/teachers',
  '/api/courses',
  '/api/groups',
  '/api/attendance',
  '/api/invoices',
  '/api/payments',
  '/api/certificates',
  '/api/settings',
  '/api/users',
  '/api/plans'
];

for (const path of endpoints) {
  await test(cookie, 'GET', path);
}

await test(cookie, 'POST', '/api/ai', {
  prompt: 'اعطني ملخصًا سريعًا عن حالة المركز'
});

console.log('\nAUDIT COMPLETE');