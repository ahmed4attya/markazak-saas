const BASE = 'http://localhost:3000';

async function request(url, options = {}) {
  const res = await fetch(BASE + url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
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

  return { status: res.status, data };
}

async function main() {
  console.log('=== LOGIN ===');

  const login = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: 'admin@center.sa',
      password: 'admin123'
    })
  });

  console.log('LOGIN:', login.status);

  if (login.status !== 200) {
    console.log(login.data);
    process.exit(1);
  }

  const cookie = login.data;

  const loginRes = await fetch(BASE + '/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email: 'admin@center.sa',
      password: 'admin123'
    })
  });

  const setCookie = loginRes.headers.get('set-cookie');

  if (!setCookie) {
    console.log('ERROR: session cookie not returned');
    process.exit(1);
  }

  async function authRequest(url, options = {}) {
    const res = await fetch(BASE + url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Cookie': setCookie,
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

  const teacher = {
    name: `اختبار المدرب ${unique}`,
    phone: `050${String(unique).slice(-7)}`,
    email: `teacher${unique}@test.local`,
    specialty: 'اختبار',
    status: 'active'
  };

  console.log('\n=== CREATE TEACHER ===');

  const created = await authRequest('/api/teachers', {
    method: 'POST',
    body: JSON.stringify(teacher)
  });

  console.log('POST /api/teachers:', created.status);
  console.log(JSON.stringify(created.data));

  if (created.status !== 201 || !created.data.id) {
    console.log('RESULT: FAIL - CREATE');
    process.exit(1);
  }

  const id = created.data.id;

  console.log('\nTEACHER ID:', id);

  console.log('\n=== READ TEACHERS ===');

  const list = await authRequest('/api/teachers');

  console.log('GET /api/teachers:', list.status);

  const found = Array.isArray(list.data)
    && list.data.some(t => t.id === id);

  console.log('CREATED TEACHER FOUND:', found ? 'YES' : 'NO');

  if (list.status !== 200 || !found) {
    console.log('RESULT: FAIL - READ');
    process.exit(1);
  }

  console.log('\n=== UPDATE TEACHER ===');

  const updated = await authRequest(`/api/teachers/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({
      name: `${teacher.name} UPDATED`,
      specialty: 'تخصص محدث'
    })
  });

  console.log(`PATCH /api/teachers/${id}:`, updated.status);
  console.log(JSON.stringify(updated.data));

  if (
    updated.status !== 200 ||
    updated.data.name !== `${teacher.name} UPDATED` ||
    updated.data.specialty !== 'تخصص محدث'
  ) {
    console.log('RESULT: FAIL - UPDATE');
    process.exit(1);
  }

  console.log('\n=== DELETE TEACHER ===');

  const deleted = await authRequest(`/api/teachers/${id}`, {
    method: 'DELETE'
  });

  console.log(`DELETE /api/teachers/${id}:`, deleted.status);
  console.log(JSON.stringify(deleted.data));

  if (deleted.status !== 200) {
    console.log('RESULT: FAIL - DELETE');
    process.exit(1);
  }

  console.log('\n=== VERIFY DELETE ===');

  const afterDelete = await authRequest('/api/teachers');

  console.log('GET /api/teachers:', afterDelete.status);

  const stillExists =
    Array.isArray(afterDelete.data)
    && afterDelete.data.some(t => t.id === id);

  console.log(
    'TEACHER STILL EXISTS:',
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