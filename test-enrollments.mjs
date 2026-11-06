const BASE = 'http://localhost:3000';

let cookie = '';

async function request(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (cookie) {
    headers.Cookie = cookie;
  }

  const res = await fetch(BASE + path, {
    ...options,
    headers
  });

  const text = await res.text();

  let data = text;

  try {
    data = JSON.parse(text);
  } catch {}

  return {
    status: res.status,
    data,
    headers: res.headers
  };
}

function fail(message, result) {
  console.log(message);
  console.log('STATUS:', result.status);
  console.log('RESPONSE:', result.data);
  process.exit(1);
}

console.log('=== ENROLLMENTS CRUD TEST ===');

let r = await request('/api/auth/login', {
  method: 'POST',
  body: JSON.stringify({
    email: 'admin@center.sa',
    password: 'admin123'
  })
});

console.log('LOGIN:', r.status);

if (r.status !== 200) {
  fail('Login failed', r);
}

const setCookie = r.headers.get('set-cookie');

if (!setCookie) {
  console.log('SESSION COOKIE: NOT FOUND');
  process.exit(1);
}

cookie = setCookie.split(';')[0];

console.log('SESSION COOKIE: OK');

r = await request('/api/students');

console.log('GET /api/students:', r.status);

if (r.status !== 200) {
  fail('Students GET failed', r);
}

const students = Array.isArray(r.data)
  ? r.data
  : r.data.students || [];

if (students.length === 0) {
  console.log('NO STUDENTS FOUND');
  console.log('Create a student first.');
  process.exit(1);
}

const student = students[0];

console.log(
  'USING STUDENT:',
  student.id,
  student.name || student.student_name || ''
);

r = await request('/api/groups');

console.log('GET /api/groups:', r.status);

if (r.status !== 200) {
  fail('Groups GET failed', r);
}

const groups = Array.isArray(r.data)
  ? r.data
  : r.data.groups || [];

if (groups.length === 0) {
  console.log('NO GROUPS FOUND');
  console.log('Create a group first.');
  process.exit(1);
}

const group = groups[0];

console.log(
  'USING GROUP:',
  group.id,
  group.name || ''
);

r = await request('/api/enrollments', {
  method: 'POST',
  body: JSON.stringify({
    group_id: group.id,
    student_id: student.id,
    status: 'active',
    price: 500,
    discount: 50
  })
});

console.log('POST /api/enrollments:', r.status);

if (r.status !== 201) {
  fail('Enrollment POST failed', r);
}

const enrollmentId = r.data.id;

console.log('ENROLLMENT ID:', enrollmentId);

r = await request('/api/enrollments');

console.log('GET /api/enrollments:', r.status);

if (r.status !== 200) {
  fail('Enrollment GET failed', r);
}

const enrollments = Array.isArray(r.data)
  ? r.data
  : r.data.enrollments || [];

const found = enrollments.some(
  x => x.id === enrollmentId
);

console.log('CREATED ENROLLMENT FOUND:', found ? 'YES' : 'NO');

if (!found) {
  console.log('Enrollment was not found after creation.');
  process.exit(1);
}

r = await request('/api/enrollments/' + enrollmentId, {
  method: 'PATCH',
  body: JSON.stringify({
    status: 'completed',
    price: 600,
    discount: 75
  })
});

console.log(
  'PATCH /api/enrollments/' + enrollmentId + ':',
  r.status
);

if (r.status !== 200) {
  fail('Enrollment PATCH failed', r);
}

console.log(
  'UPDATED STATUS:',
  r.data.status
);

console.log(
  'UPDATED PRICE:',
  r.data.price
);

console.log(
  'UPDATED DISCOUNT:',
  r.data.discount
);

r = await request('/api/enrollments/' + enrollmentId, {
  method: 'DELETE'
});

console.log(
  'DELETE /api/enrollments/' + enrollmentId + ':',
  r.status
);

if (r.status !== 200) {
  fail('Enrollment DELETE failed', r);
}

r = await request('/api/enrollments');

console.log('GET /api/enrollments after delete:', r.status);

if (r.status !== 200) {
  fail('Final Enrollment GET failed', r);
}

const remaining = Array.isArray(r.data)
  ? r.data
  : r.data.enrollments || [];

const stillExists = remaining.some(
  x => x.id === enrollmentId
);

console.log(
  'ENROLLMENT STILL EXISTS:',
  stillExists ? 'YES' : 'NO'
);

if (stillExists) {
  console.log('Enrollment deletion verification failed.');
  process.exit(1);
}

console.log('');
console.log('RESULT: PASS');