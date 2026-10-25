const BASE = 'http://localhost:3000';

async function main() {
  console.log('=== LOGIN ===');

  const loginRes = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email: 'admin@center.sa',
      password: 'admin123'
    })
  });

  console.log('LOGIN:', loginRes.status);

  if (loginRes.status !== 200) {
    console.log(await loginRes.text());
    process.exit(1);
  }

  const cookie = loginRes.headers.get('set-cookie');

  if (!cookie) {
    console.log('ERROR: session cookie not returned');
    process.exit(1);
  }

  async function request(url, options = {}) {
    const res = await fetch(`${BASE}${url}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookie,
        ...(options.headers || {})
      }
    });

    const text = await res.text();

    let data;

    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }

    return {
      status: res.status,
      data
    };
  }

  const unique = Date.now();

  const course = {
    name: `اختبار الدورة ${unique}`,
    category: 'اختبار',
    duration_hours: 20,
    price: 500,
    description: 'دورة اختبار CRUD',
    status: 'active'
  };

  console.log('\n=== CREATE COURSE ===');

  const created = await request('/api/courses', {
    method: 'POST',
    body: JSON.stringify(course)
  });

  console.log('POST /api/courses:', created.status);
  console.log(JSON.stringify(created.data));

  if (created.status !== 201 || !created.data.id) {
    console.log('RESULT: FAIL - CREATE');
    process.exit(1);
  }

  const id = created.data.id;

  console.log('\nCOURSE ID:', id);

  console.log('\n=== READ COURSES ===');

  const list = await request('/api/courses');

  console.log('GET /api/courses:', list.status);

  const found =
    Array.isArray(list.data) &&
    list.data.some(c => c.id === id);

  console.log('CREATED COURSE FOUND:', found ? 'YES' : 'NO');

  if (list.status !== 200 || !found) {
    console.log('RESULT: FAIL - READ');
    process.exit(1);
  }

  console.log('\n=== UPDATE COURSE ===');

  const updated = await request(`/api/courses/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({
      name: `${course.name} UPDATED`,
      price: 750,
      duration_hours: 25
    })
  });

  console.log(`PATCH /api/courses/${id}:`, updated.status);
  console.log(JSON.stringify(updated.data));

  if (
    updated.status !== 200 ||
    updated.data.name !== `${course.name} UPDATED` ||
    Number(updated.data.price) !== 750 ||
    Number(updated.data.duration_hours) !== 25
  ) {
    console.log('RESULT: FAIL - UPDATE');
    process.exit(1);
  }

  console.log('\n=== DELETE COURSE ===');

  const deleted = await request(`/api/courses/${id}`, {
    method: 'DELETE'
  });

  console.log(`DELETE /api/courses/${id}:`, deleted.status);
  console.log(JSON.stringify(deleted.data));

  if (deleted.status !== 200) {
    console.log('RESULT: FAIL - DELETE');
    process.exit(1);
  }

  console.log('\n=== VERIFY DELETE ===');

  const afterDelete = await request('/api/courses');

  console.log('GET /api/courses:', afterDelete.status);

  const stillExists =
    Array.isArray(afterDelete.data) &&
    afterDelete.data.some(c => c.id === id);

  console.log(
    'COURSE STILL EXISTS:',
    stillExists ? 'YES' : 'NO'
  );

  if (afterDelete.status !== 200 || stillExists) {
    console.log('RESULT: FAIL - VERIFY DELETE');
    process.exit(1);
  }

  console.log('\nRESULT: PASS');
}

main().catch(error => {
  console.error('\nTEST ERROR:', error);
  process.exit(1);
});