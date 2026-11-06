const base = 'http://localhost:3000';

async function login() {
  const r = await fetch(`${base}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email: 'admin@center.sa',
      password: 'admin123'
    })
  });

  const cookie = r.headers.get('set-cookie');

  console.log('LOGIN:', r.status);

  if (!cookie) {
    console.log(await r.text());
    process.exit(1);
  }

  return cookie.split(';')[0];
}

async function request(cookie, method, path, body) {
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

  console.log(`\n${method} ${path}: ${r.status}`);
  console.log(text);

  let data = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {}

  return {
    status: r.status,
    data
  };
}

const cookie = await login();

const unique = Date.now();

const student = {
  student_no: `TEST-${unique}`,
  name: `اختبار الطالب ${unique}`,
  email: `student${unique}@test.local`,
  phone: `050${String(unique).slice(-7)}`,
  status: 'active'
};

console.log('\n=== CREATE STUDENT ===');

const created = await request(
  cookie,
  'POST',
  '/api/students',
  student
);

if (created.status < 200 || created.status >= 300) {
  console.log('\nCREATE FAILED');
  process.exit(1);
}

const studentId =
  created.data?.id ||
  created.data?.student?.id;

if (!studentId) {
  console.log('\nSTUDENT ID NOT FOUND');
  process.exit(1);
}

console.log('\nSTUDENT ID:', studentId);

console.log('\n=== READ STUDENTS ===');

const list = await request(
  cookie,
  'GET',
  '/api/students'
);

if (list.status !== 200) {
  console.log('\nREAD FAILED');
  process.exit(1);
}

const students =
  list.data?.students ||
  list.data?.data ||
  list.data;

const found = Array.isArray(students)
  ? students.find(x => x.id === studentId)
  : null;

console.log(
  '\nCREATED STUDENT FOUND:',
  found ? 'YES' : 'NO'
);

if (!found) {
  process.exit(1);
}

console.log('\n=== UPDATE STUDENT ===');

const updated = await request(
  cookie,
  'PATCH',
  `/api/students/${studentId}`,
  {
    name: `${student.name} UPDATED`,
    phone: student.phone
  }
);

if (updated.status < 200 || updated.status >= 300) {
  console.log('\nUPDATE FAILED');
  process.exit(1);
}

console.log('\n=== DELETE STUDENT ===');

const deleted = await request(
  cookie,
  'DELETE',
  `/api/students/${studentId}`
);

if (deleted.status < 200 || deleted.status >= 300) {
  console.log('\nDELETE FAILED');
  process.exit(1);
}

console.log('\n=== VERIFY DELETE ===');

const afterDelete = await request(
  cookie,
  'GET',
  '/api/students'
);

const afterStudents =
  afterDelete.data?.students ||
  afterDelete.data?.data ||
  afterDelete.data;

const stillExists = Array.isArray(afterStudents)
  ? afterStudents.some(x => x.id === studentId)
  : false;

console.log(
  'STUDENT STILL EXISTS:',
  stillExists ? 'YES' : 'NO'
);

if (stillExists) {
  console.log('\nDELETE VERIFICATION FAILED');
  process.exit(1);
}

console.log('\nRESULT: PASS');