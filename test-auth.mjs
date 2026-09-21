const base = 'http://localhost:3000';

const login = await fetch(`${base}/api/auth/login`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: 'admin@center.sa',
    password: 'admin123'
  })
});

const setCookie = login.headers.get('set-cookie');

console.log('LOGIN:', login.status);
console.log('COOKIE:', setCookie ? 'PRESENT' : 'MISSING');

if (!setCookie) {
  console.log('LOGIN BODY:', await login.text());
  process.exit(1);
}

const cookie = setCookie.split(';')[0];

const paths = [
  '/api/dashboard',
  '/api/settings',
  '/api/users',
  '/api/plans',
  '/api/ai'
];

for (const path of paths) {
  const options = {
    headers: {
      Cookie: cookie
    }
  };

  if (path === '/api/ai') {
    options.method = 'POST';
    options.headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify({
      prompt: 'اعطني ملخصًا سريعًا عن حالة المركز'
    });
  }

  const response = await fetch(`${base}${path}`, options);

  console.log(`${path}: ${response.status}`);

  if (response.status >= 400) {
    console.log(await response.text());
  }
}