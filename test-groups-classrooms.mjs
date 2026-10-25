const BASE = 'http://localhost:3000';

async function readResponse(res) {
  const text = await res.text();
  let data = text;

  try {
    data = JSON.parse(text);
  } catch {}

  return {
    status: res.status,
    data
  };
}

async function request(path, options = {}) {
  const res = await fetch(BASE + path, options);
  return readResponse(res);
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function main() {
  console.log('=== CLASSROOM + GROUP CRUD TEST ===');

  // 1. Login
  const login = await request('/api/auth/login', {
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
  assert(login.status === 200, 'Login failed');

  const setCookie =
    login.headers?.['set-cookie'] || '';

  // request() لا يحتفظ بالـ headers حالياً،
  // لذلك نعيد تسجيل الدخول هنا بطريقة مباشرة.
  const loginRaw = await fetch(BASE + '/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email: 'admin@center.sa',
      password: 'admin123'
    })
  });

  const cookieHeader = loginRaw.headers.get('set-cookie');

  assert(cookieHeader, 'Session cookie not returned');

  const cookie = cookieHeader.split(';')[0];

  console.log('SESSION COOKIE: OK');

  // 2. Classrooms GET
  const classrooms = await request('/api/classrooms', {
    headers: {
      Cookie: cookie
    }
  });

  console.log('GET /api/classrooms:', classrooms.status);
  assert(classrooms.status === 200, 'Classrooms GET failed');

  let classroomId;

  if (Array.isArray(classrooms.data) && classrooms.data.length > 0) {
    classroomId = classrooms.data[0].id;
    console.log('USING EXISTING CLASSROOM:', classroomId);
  } else {
    // 3. Create classroom
    const created = await request('/api/classrooms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookie
      },
      body: JSON.stringify({
        name: 'TEST Classroom',
        capacity: 25,
        location: 'Test Floor',
        equipment: 'Projector',
        status: 'active'
      })
    });

    console.log('POST /api/classrooms:', created.status);
    assert(created.status === 201, 'Classroom creation failed');

    classroomId = created.data.id;

    console.log('CLASSROOM ID:', classroomId);
  }

  // 4. Get courses
  const courses = await request('/api/courses', {
    headers: {
      Cookie: cookie
    }
  });

  console.log('GET /api/courses:', courses.status);
  assert(courses.status === 200, 'Courses GET failed');
  assert(Array.isArray(courses.data), 'Courses response is not an array');
  assert(courses.data.length > 0, 'No courses available');

  const courseId = courses.data[0].id;

  // 5. Get teachers
  const teachers = await request('/api/teachers', {
    headers: {
      Cookie: cookie
    }
  });

  console.log('GET /api/teachers:', teachers.status);
  assert(teachers.status === 200, 'Teachers GET failed');
  assert(Array.isArray(teachers.data), 'Teachers response is not an array');
  assert(teachers.data.length > 0, 'No teachers available');

  const teacherId = teachers.data[0].id;

  // 6. Create group
  const groupName =
    'TEST Group ' + Date.now();

  const createdGroup = await request('/api/groups', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookie
    },
    body: JSON.stringify({
      name: groupName,
      course_id: courseId,
      teacher_id: teacherId,
      classroom_id: classroomId,
      capacity: 20,
      mode: 'onsite',
      status: 'scheduled',
      days: 'Sun,Mon,Wed'
    })
  });

  console.log('POST /api/groups:', createdGroup.status);
  assert(createdGroup.status === 201, 'Group creation failed');

  const groupId = createdGroup.data.id;

  console.log('GROUP ID:', groupId);

  // 7. GET groups
  const groups = await request('/api/groups', {
    headers: {
      Cookie: cookie
    }
  });

  console.log('GET /api/groups:', groups.status);
  assert(groups.status === 200, 'Groups GET failed');

  const found = Array.isArray(groups.data)
    ? groups.data.find(x => x.id === groupId)
    : null;

  assert(found, 'Created group not found');

  console.log('CREATED GROUP FOUND: YES');

  // 8. PATCH group
  const patched = await request(
    '/api/groups/' + groupId,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookie
      },
      body: JSON.stringify({
        name: groupName + ' Updated',
        capacity: 30
      })
    }
  );

  console.log(
    'PATCH /api/groups/' + groupId + ':',
    patched.status
  );

  assert(patched.status === 200, 'Group PATCH failed');

  assert(
    patched.data.capacity == 30,
    'Group capacity was not updated'
  );

  // 9. DELETE group
  const deleted = await request(
    '/api/groups/' + groupId,
    {
      method: 'DELETE',
      headers: {
        Cookie: cookie
      }
    }
  );

  console.log(
    'DELETE /api/groups/' + groupId + ':',
    deleted.status
  );

  assert(deleted.status === 200, 'Group DELETE failed');

  // 10. Verify deletion
  const groupsAfter = await request('/api/groups', {
    headers: {
      Cookie: cookie
    }
  });

  console.log(
    'GET /api/groups after delete:',
    groupsAfter.status
  );

  const stillExists =
    Array.isArray(groupsAfter.data) &&
    groupsAfter.data.some(x => x.id === groupId);

  console.log(
    'GROUP STILL EXISTS:',
    stillExists ? 'YES' : 'NO'
  );

  assert(!stillExists, 'Group was not deleted');

  console.log('');
  console.log('RESULT: PASS');
}

main().catch(error => {
  console.error('');
  console.error('=== RESULT: FAIL ===');
  console.error(error.message);
  process.exit(1);
});