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

console.log('LOGIN:', login.status);

const setCookie = login.headers.get('set-cookie');

if (!setCookie) {
  console.log('COOKIE: MISSING');
  process.exit(1);
}

const cookie = setCookie.split(';')[0];

const tests = [
  ['GET', '/api/payments'],
  ['POST', '/api/payments', {}]
];

for (const [method, path, body] of tests) {
  const options = {
    method,
    headers: {
      Cookie: cookie
    }
  };

  if (method === 'POST') {
    options.headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${base}${path}`, options);

  console.log(`\n${method} ${path}: ${response.status}`);
  console.log(await response.text());
}