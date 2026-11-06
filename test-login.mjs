fetch('http://localhost:3000/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: 'admin@center.sa',
    password: 'admin123'
  })
}).then(async r => {
  console.log('HTTP:', r.status);
  console.log('SET-COOKIE:', r.headers.get('set-cookie'));
  console.log('BODY:', await r.text());
});