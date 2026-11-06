const BASE = 'http://localhost:3000';

const cookieJar = new Map();

async function request(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json'
  };

  if (options.headers) {
    Object.assign(headers, options.headers);
  }

  const cookies = [];

  for (const entry of cookieJar.entries()) {
    cookies.push(entry[0] + '=' + entry[1]);
  }

  if (cookies.length > 0) {
    headers.Cookie = cookies.join('; ');
  }

  const response = await fetch(BASE + path, {
    method: options.method || 'GET',
    headers: headers,
    body: options.body
  });

  const setCookie = response.headers.get('set-cookie');

  if (setCookie) {
    const match = setCookie.match(/^([^=]+)=([^;]+)/);

    if (match) {
      cookieJar.set(match[1], match[2]);
    }
  }

  let data;

  try {
    data = await response.json();
  } catch {
    data = await response.text();
  }

  return {
    status: response.status,
    data: data
  };
}

function assert(condition, message) {
  if (!condition) {
    throw new Error('FAIL: ' + message);
  }

  console.log('PASS: ' + message);
}

async function main() {
  console.log('=== GROUP CRUD TEST ===');

  const login = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: 'admin@center.sa',
      password: 'admin123'
    })
  });

  console.log('LOGIN:', login.status);

  assert(login.status === 200, 'Login');

  const classrooms = await request('/api/classrooms');

  console.log('GET /api/classrooms:', classrooms.status);

  assert(
    classrooms.status === 200,
    'Classrooms GET'
  );

  let classroom = classrooms.data[0];

  if (!classroom) {
    const classroomResult = await request('/api/classrooms', {
      method: 'POST',
      body: JSON.stringify({
        name: 'TEST Classroom ' + Date.now(),
        capacity: 30,
        location: 'TEST',
        equipment: 'TEST',
        status: 'active'
      })
    });

    console.log(
      'POST /api/classrooms:',
      classroomResult.status
    );

    assert(
      classroomResult.status === 201,
      'Classroom creation'
    );

    classroom = classroomResult.data;
  }

  console.log('CLASSROOM ID:', classroom.id);

  const courses = await request('/api/courses');

  console.log('GET /api/courses:', courses.status);

  assert(
    courses.status === 200,
    'Courses GET'
  );

  let course = courses.data[0];

  if (!course) {
    const courseResult = await request('/api/courses', {
      method: 'POST',
      body: JSON.stringify({
        name: 'TEST Course ' + Date.now(),
        category: 'TEST',
        duration_hours: 20,
        price: 500,
        description: 'CRUD TEST',
        status: 'active'
      })
    });

    console.log(
      'POST /api/courses:',
      courseResult.status
    );

    assert(
      courseResult.status === 201,
      'Course creation'
    );

    course = courseResult.data;
  }

  console.log('COURSE ID:', course.id);

  const teachers = await request('/api/teachers');

  console.log('GET /api/teachers:', teachers.status);

  assert(
    teachers.status === 200,
    'Teachers GET'
  );

  let teacher = teachers.data[0];

  if (!teacher) {
    const teacherResult = await request('/api/teachers', {
      method: 'POST',
      body: JSON.stringify({
        name: 'TEST Teacher ' + Date.now(),
        phone: '0500000000',
        email: '',
        specialty: 'TEST',
        status: 'active'
      })
    });

    console.log(
      'POST /api/teachers:',
      teacherResult.status
    );

    assert(
      teacherResult.status === 201,
      'Teacher creation'
    );

    teacher = teacherResult.data;
  }

  console.log('TEACHER ID:', teacher.id);

  const groupName = 'TEST Group ' + Date.now();

  const created = await request('/api/groups', {
    method: 'POST',
    body: JSON.stringify({
      course_id: course.id,
      teacher_id: teacher.id,
      classroom_id: classroom.id,
      name: groupName,
      capacity: 20,
      room: 'TEST ROOM',
      mode: 'onsite',
      start_date: '2026-10-01',
      end_date: '2026-12-31',
      start_time: '18:00',
      end_time: '20:00',
      days: 'Sun, Tue, Thu',
      status: 'scheduled'
    })
  });

  console.log(
    'POST /api/groups:',
    created.status
  );

  assert(
    created.status === 201,
    'Group creation'
  );

  const group = created.data;

  console.log('GROUP ID:', group.id);

  assert(
    group.classroom_id === classroom.id,
    'classroom_id saved'
  );

  assert(
    group.course_id === course.id,
    'course_id saved'
  );

  assert(
    group.teacher_id === teacher.id,
    'teacher_id saved'
  );

  assert(
    group.mode === 'onsite',
    'mode saved'
  );

  const list = await request('/api/groups');

  console.log(
    'GET /api/groups:',
    list.status
  );

  assert(
    list.status === 200,
    'Groups GET'
  );

  const found = list.data.find(function(item) {
    return item.id === group.id;
  });

  assert(
    !!found,
    'Created group found'
  );

  assert(
    found.classroom_name === classroom.name,
    'Classroom name joined'
  );

  const patched = await request(
    '/api/groups/' + group.id,
    {
      method: 'PATCH',
      body: JSON.stringify({
        name: groupName + ' UPDATED',
        capacity: 25,
        mode: 'online',
        room: 'UPDATED ROOM'
      })
    }
  );

  console.log(
    'PATCH /api/groups/' + group.id + ':',
    patched.status
  );

  assert(
    patched.status === 200,
    'Group PATCH'
  );

  assert(
    patched.data.name === groupName + ' UPDATED',
    'Group name updated'
  );

  assert(
    Number(patched.data.capacity) === 25,
    'Group capacity updated'
  );

  assert(
    patched.data.mode === 'online',
    'Group mode updated'
  );

  const deleted = await request(
    '/api/groups/' + group.id,
    {
      method: 'DELETE'
    }
  );

  console.log(
    'DELETE /api/groups/' + group.id + ':',
    deleted.status
  );

  assert(
    deleted.status === 200,
    'Group DELETE'
  );

  const verify = await request('/api/groups');

  console.log(
    'GET /api/groups after delete:',
    verify.status
  );

  assert(
    verify.status === 200,
    'Groups GET after delete'
  );

  const stillExists = verify.data.some(function(item) {
    return item.id === group.id;
  });

  assert(
    !stillExists,
    'Deleted group no longer exists'
  );

  console.log('');
  console.log('=== RESULT: PASS ===');
}

main().catch(function(error) {
  console.error('');
  console.error('=== RESULT: FAIL ===');
  console.error(error.message);
  process.exit(1);
});
