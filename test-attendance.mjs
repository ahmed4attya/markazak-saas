const BASE = 'http://localhost:3000';

let cookie = '';

async function request(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (cookie) headers.Cookie = cookie;

  const res = await fetch(BASE + path, {
    ...options,
    headers
  });

  const text = await res.text();

  let data = text;
  try { data = JSON.parse(text); } catch {}

  return { status: res.status, data, headers: res.headers };
}

function fail(message, r) {
  console.log(message);
  console.log('STATUS:', r.status);
  console.log('RESPONSE:', r.data);
  process.exit(1);
}

console.log('=== ATTENDANCE CRUD TEST ===');

let r = await request('/api/auth/login', {
  method: 'POST',
  body: JSON.stringify({
    email: 'admin@center.sa',
    password: 'admin123'
  })
});

console.log('LOGIN:', r.status);

if (r.status !== 200) fail('Login failed', r);

const setCookie = r.headers.get('set-cookie');

if (!setCookie) {
  console.log('SESSION COOKIE: NOT FOUND');
  process.exit(1);
}

cookie = setCookie.split(';')[0];

console.log('SESSION COOKIE: OK');

r = await request('/api/students');

console.log('GET /api/students:', r.status);

if (r.status !== 200) fail('Students GET failed', r);

const students = Array.isArray(r.data)
  ? r.data
  : r.data.students || [];

if (!students.length) {
  console.log('NO STUDENTS FOUND');
  process.exit(1);
}

const student = students[0];

r = await request('/api/groups');

console.log('GET /api/groups:', r.status);

if (r.status !== 200) fail('Groups GET failed', r);

const groups = Array.isArray(r.data)
  ? r.data
  : r.data.groups || [];

if (!groups.length) {
  console.log('NO GROUPS FOUND');
  process.exit(1);
}

const group = groups[0];

r = await request('/api/enrollments');

console.log('GET /api/enrollments:', r.status);

if (r.status !== 200) fail('Enrollments GET failed', r);

const enrollments = Array.isArray(r.data)
  ? r.data
  : r.data.enrollments || [];

let enrollment = enrollments.find(
  x => x.student_id === student.id && x.group_id === group.id
);

let createdEnrollment = false;

if (!enrollment) {
  r = await request('/api/enrollments', {
    method: 'POST',
    body: JSON.stringify({
      student_id: student.id,
      group_id: group.id,
      status: 'active',
      price: 500,
      discount: 0
    })
  });

  console.log('CREATE ENROLLMENT:', r.status);

  if (r.status !== 201) fail('Enrollment creation failed', r);

  enrollment = r.data;
  createdEnrollment = true;
}

console.log('ENROLLMENT:', enrollment.id);

const date =
  new Date().toISOString().slice(0, 10);

r = await request('/api/attendance', {
  method: 'POST',
  body: JSON.stringify({
    group_id: group.id,
    student_id: student.id,
    attendance_date: date,
    status: 'present',
    notes: 'Automated attendance test'
  })
});

console.log('POST /api/attendance:', r.status);

if (r.status !== 201) {
  fail('Attendance POST failed', r);
}

const attendanceId = r.data.id;

console.log('ATTENDANCE ID:', attendanceId);

r = await request('/api/attendance');

console.log('GET /api/attendance:', r.status);

if (r.status !== 200) fail('Attendance GET failed', r);

const attendance = Array.isArray(r.data)
  ? r.data
  : r.data.attendance || [];

console.log(
  'CREATED ATTENDANCE FOUND:',
  attendance.some(x => x.id === attendanceId) ? 'YES' : 'NO'
);

r = await request('/api/attendance/' + attendanceId, {
  method: 'PATCH',
  body: JSON.stringify({
    status: 'late',
    notes: 'Updated attendance test'
  })
});

console.log(
  'PATCH /api/attendance/' + attendanceId + ':',
  r.status
);

if (r.status !== 200) fail('Attendance PATCH failed', r);

console.log('UPDATED STATUS:', r.data.status);

r = await request('/api/attendance/' + attendanceId, {
  method: 'DELETE'
});

console.log(
  'DELETE /api/attendance/' + attendanceId + ':',
  r.status
);

if (r.status !== 200) fail('Attendance DELETE failed', r);

r = await request('/api/attendance');

console.log('GET /api/attendance after delete:', r.status);

if (r.status !== 200) fail('Final attendance GET failed', r);

const finalAttendance = Array.isArray(r.data)
  ? r.data
  : r.data.attendance || [];

console.log(
  'ATTENDANCE STILL EXISTS:',
  finalAttendance.some(x => x.id === attendanceId)
    ? 'YES'
    : 'NO'
);

if (createdEnrollment) {
  await request('/api/enrollments/' + enrollment.id, {
    method: 'DELETE'
  });
}

console.log('');
console.log('RESULT: PASS');