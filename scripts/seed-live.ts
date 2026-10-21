// scripts/seed-live.ts — clean demo data + seed organized live data (single-tenant).
// Usage:
//   npx tsx scripts/seed-live.ts                      (local, uses .env.local)
//   npx tsx scripts/seed-live.ts <env-file>           (e.g. audit-out/session-S1/prod-db.env)
// Guards: exactly ONE tenant whose name matches the brand needle; otherwise aborts
// before any write. Keeps: tenants row + the owner user (role='owner', credentials untouched).
// Credentials for new accounts are written to audit-out/session-seed/credentials.txt
// (git-ignored) - NEVER printed to stdout.
import fs from 'node:fs';
import path from 'node:path';
import bcrypt from 'bcryptjs';
import { loadLocalEnv } from './env';

const envFile = process.argv[2] || '.env.local';
if (envFile !== '.env.local') {
  if (!fs.existsSync(envFile)) { console.error('ABORT: env file not found: ' + envFile); process.exit(1); }
  for (const line of fs.readFileSync(envFile, 'utf8').split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const m = t.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!m) continue;
    if (process.env[m[1]] === undefined) process.env[m[1]] = m[2].trim().replace(/^(['"])(.*)\1$/, '$2');
  }
}
loadLocalEnv();

const BRAND = 'سنتر الخوارزمي / Al-Khwarizmi Center';
const NEEDLE = 'الخوارزمي';
const TENANT_NAME = 'سنتر الخوارزمي / Al-Khwarizmi Center';
const OWNER_NAME = 'مدير المركز';

const TEACHER1 = { name: 'أ. محمد أحمد', email: 'mohammed@alkhwarizmi.sa', password: process.env.SEED_PWD_T1, specialty: 'رياضيات — قدرات كمي' };
const TEACHER2 = { name: 'أ. سارة عبدالله', email: 'sara@alkhwarizmi.sa', password: process.env.SEED_PWD_T2, specialty: 'لغة عربية — قدرات لفظي' };
const GUARDIAN = { name: 'أبو خالد', email: 'abukhalid@alkhwarizmi.sa', password: process.env.SEED_PWD_G1 };
const STUDENT1 = { name: 'خالد فهد', email: 'khaled@alkhwarizmi.sa', password: process.env.SEED_PWD_S1, type: 'center', no: 'ALKH-1001', note: 'الصف: ثانوي' };
const STUDENT2 = { name: 'عمر سعيد', email: 'omar@alkhwarizmi.sa', password: process.env.SEED_PWD_S2, type: 'online', no: 'ALKH-1002', note: 'الصف: ثانوي' };

const COURSES = [
  { name: 'قدرات كمي — دورة شاملة', code: 'QNT-101', category: 'قدرات كمي', group: 'مجموعة كمي أ' },
  { name: 'قدرات لفظي — دورة شاملة', code: 'VRB-101', category: 'قدرات لفظي', group: 'مجموعة لفظي أ' },
  { name: 'تحصيلي فيزياء', code: 'PHY-101', category: 'تحصيلي', group: 'مجموعة فيزياء أ' },
  { name: 'تحصيلي كيمياء', code: 'CHM-101', category: 'تحصيلي', group: 'مجموعة كيمياء أ' },
];

type QDef = { course: number; domain: string; subject: string; topic: string; skill: string; difficulty: number; text: string; options: string[]; correct: number; explanation: string };
const QUESTIONS: QDef[] = [
  { course: 0, domain: 'quant', subject: 'رياضيات', topic: 'النسب المئوية', skill: 'الحساب الذهني', difficulty: 2, text: 'كم يساوي 15% من 200؟', options: ['20', '30', '35', '40'], correct: 1, explanation: '15% من 200 = (15 × 200) ÷ 100 = 30.' },
  { course: 0, domain: 'quant', subject: 'رياضيات', topic: 'المتوسطات', skill: 'الحساب الأساسي', difficulty: 3, text: 'متوسط الأعداد 4 و 8 و 10 و 14 يساوي:', options: ['8', '9', '10', '12'], correct: 1, explanation: 'المجموع 36 ÷ عددها 4 = 9.' },
  { course: 0, domain: 'quant', subject: 'رياضيات', topic: 'حساب ذهني', skill: 'التحليل الذهني', difficulty: 4, text: 'ما ناتج 25 × 16 بأيسر طريقة ذهنية؟', options: ['350', '400', '425', '450'], correct: 1, explanation: '25 × 16 = 25 × (4 × 4) = (25 × 4) × 4 = 100 × 4 = 400.' },
  { course: 1, domain: 'verbal', subject: 'لغة عربية', topic: 'إكمال الجمل', skill: 'الأدوات', difficulty: 2, text: '........ اجتهد الطالب نال المرتبة الأولى', options: ['لمّا', 'لأن', 'إذا', 'كلما'], correct: 2, explanation: 'إذا أداة شرط تربط الشرط بجوابه: إذا اجتهد نال.' },
  { course: 1, domain: 'verbal', subject: 'لغة عربية', topic: 'التناظر اللفظي', skill: 'العلاقات الدلالية', difficulty: 3, text: 'قلم : كتابة :: سكين : ........', options: ['قطع', 'حد', 'خشب', 'مطبخ'], correct: 0, explanation: 'علاقة الأداة بوظيفتها: القلم للكتابة والسكين للقطع.' },
  { course: 1, domain: 'verbal', subject: 'لغة عربية', topic: 'الخطأ الشائع', skill: 'الإملاء', difficulty: 4, text: 'أي الكلمات التالية مكتوبة خطأً إملائياً؟', options: ['إمرأة', 'مؤسسة', 'إنسان', 'أصول'], correct: 0, explanation: 'الصواب: امرأة — تكتب بغير همزة فوق الألف.' },
  { course: 2, domain: 'achievement', subject: 'فيزياء', topic: 'السرعة', skill: 'تحويل الوحدات', difficulty: 2, text: 'سيارة تقطع 90 كم في ساعة واحدة، فسرعتها بوحدة م/ث تساوي تقريباً:', options: ['25', '90', '32', '9'], correct: 0, explanation: 'للتحويل: 90 ÷ 3.6 = 25 م/ث.' },
  { course: 2, domain: 'achievement', subject: 'فيزياء', topic: 'قوانين نيوتن', skill: 'قانون نيوتن الثاني', difficulty: 3, text: 'قوة مقدارها 10 نيوتن تؤثر على كتلة كمية 2 كجم، فتسارع الجسم:', options: ['5 م/ث²', '20 م/ث²', '12 م/ث²', '0.2 م/ث²'], correct: 0, explanation: 'قانون نيوتن الثاني: a = F ÷ m = 10 ÷ 2 = 5 م/ث².' },
  { course: 2, domain: 'achievement', subject: 'فيزياء', topic: 'الكهرباء', skill: 'قانون أوم', difficulty: 4, text: 'موصيل يمر به تيار شدته 2 أمبير تحت جهد 12 فولت، فمقاومته:', options: ['6 أوم', '24 أوم', '14 أوم', '0.17 أوم'], correct: 0, explanation: 'قانون أوم: R = V ÷ I = 12 ÷ 2 = 6 أوم.' },
  { course: 3, domain: 'achievement', subject: 'كيمياء', topic: 'التركيب الذري', skill: 'أعداد الجسيمات', difficulty: 2, text: 'عدد البروتونات في ذرة الصوديوم Na (عدده الذري 11) هو:', options: ['11', '23', '12', '22'], correct: 0, explanation: 'العدد الذري = عدد البروتونات = 11.' },
  { course: 3, domain: 'achievement', subject: 'كيمياء', topic: 'أنواع التفاعلات', skill: 'تصنيف التفاعلات', difficulty: 3, text: 'التفاعل: 2H2 + O2 ← 2H2O يُصنف تفاعل:', options: ['اتحاد', 'تفكك', 'استبدال', 'تعادل'], correct: 0, explanation: 'اتحاد: اندماج متفاعلين أو أكثر لناتج واحد.' },
  { course: 3, domain: 'achievement', subject: 'كيمياء', topic: 'الجدول الدوري', skill: 'مجموعات العناصر', difficulty: 4, text: 'العنصر الذي رمزه Na ينتمي إلى مجموعة:', options: ['الفلزات القلوية', 'الهالوجينات', 'الغازات النبيلة', 'العناصر الانتقالية'], correct: 0, explanation: 'الصوديوم فلز قلوي في المجموعة الأولى.' },
];

const EXAMS = [
  { title: 'اختبار تدريبي — قدرات كمي', kind: 'practice', minutes: 10, course: 0, questions: [0, 1, 2] },
  { title: 'اختبار تدريبي — قدرات لفظي', kind: 'practice', minutes: 10, course: 1, questions: [3, 4, 5] },
  { title: 'محاكاة قدرات — كاملة', kind: 'simulation', minutes: 20, course: 0, questions: [0, 1, 2, 3, 4, 5] },
];

function dateOnly(d: Date): string { return d.toISOString().slice(0, 10); }

async function main() {
  const url = process.env.DATABASE_URL || '';
  if (!url) { console.error('ABORT: no DATABASE_URL'); process.exit(1); }
  let host = '';
  try { host = new URL(url).hostname; } catch { console.error('ABORT: unparseable DATABASE_URL'); process.exit(1); }
  if (!(host.endsWith('neon.tech') || host === 'localhost' || host === '127.0.0.1')) {
    console.error('ABORT: unexpected host: ' + host.length + ' chars (value hidden)');
    process.exit(1);
  }
  console.log('[guard] host class: OK (' + (host.endsWith('neon.tech') ? 'neon-prod' : 'local') + ')');

  const { Pool } = await import('pg');
  const pool = new Pool({ connectionString: url, max: 5, ...(host.endsWith('neon.tech') ? { ssl: { rejectUnauthorized: false } } : {}) });
  const pre = await pool.query('select id, name from tenants order by created_at');
  if (pre.rows.length !== 1) { console.error('ABORT: expected exactly 1 tenant, found ' + pre.rows.length); await pool.end(); process.exit(1); }
  const tenantId = String(pre.rows[0].id);
  if (!String(pre.rows[0].name || '').includes(NEEDLE)) { console.error('ABORT: tenant name needle mismatch - wrong database?'); await pool.end(); process.exit(1); }
  const ownerPre = (await pool.query("select id, email, role, length(password_hash) as hl from users where tenant_id=$1 and role in ('owner','admin') order by created_at limit 1", [tenantId])).rows[0] as any;
  if (!ownerPre) { console.error('ABORT: no admin-role user found to keep'); await pool.end(); process.exit(1); }
  const keepUserId = String(ownerPre.id);
  console.log('[identity] tenant OK | keep-user present (role=' + ownerPre.role + ', email hidden, hash len=' + ownerPre.hl + ')');

  // ---------- PHASE 1: CLEAN (single transaction on a DEDICATED client) ----------
  const before = (await pool.query(
    `select
      (select count(*)::int from students) students,
      (select count(*)::int from courses) courses,
      (select count(*)::int from questions) questions,
      (select count(*)::int from audit_logs) audit_logs`
  )).rows[0];
  console.log('[clean] before: students=' + before.students + ' courses=' + before.courses + ' questions=' + before.questions + ' audit=' + before.audit_logs);

  const lessonsExists = (await pool.query("select 1 from information_schema.tables where table_schema='public' and table_name='lessons'")).rows.length > 0;

  const client = await pool.connect();
  try {
    await client.query('begin');
    const del = async (sql: string, params: any[] = [], label: string) => {
      const r = await client.query(sql, params);
      console.log('[clean] ' + label + ': ' + r.rowCount);
    };
    await del('delete from attempts where tenant_id=$1', [tenantId], 'attempts');
    await del('delete from submissions where tenant_id=$1', [tenantId], 'submissions');
    await del('delete from exam_questions where exam_id in (select id from exams where tenant_id=$1)', [tenantId], 'exam_questions');
    await del('delete from exams where tenant_id=$1', [tenantId], 'exams');
    await del('delete from questions where tenant_id=$1', [tenantId], 'questions');
    await del('delete from assignments where tenant_id=$1', [tenantId], 'assignments');
    if (lessonsExists) await del('delete from lessons where tenant_id=$1', [tenantId], 'lessons');
    await del('delete from notifications where tenant_id=$1', [tenantId], 'notifications');
    await del('delete from activation_codes where tenant_id=$1', [tenantId], 'activation_codes');
    await del('delete from code_redemptions where tenant_id=$1', [tenantId], 'code_redemptions');
    await del('delete from payments where tenant_id=$1', [tenantId], 'payments');
    await del('delete from invoices where tenant_id=$1', [tenantId], 'invoices');
    await del('delete from attendance where tenant_id=$1', [tenantId], 'attendance');
    await del('delete from enrollments where tenant_id=$1', [tenantId], 'enrollments');
    await del('delete from files where tenant_id=$1', [tenantId], 'files (db rows)');
    await del('delete from videos where tenant_id=$1', [tenantId], 'videos (db rows)');
    await del('delete from certificates where tenant_id=$1', [tenantId], 'certificates');
    await del("delete from users where tenant_id=$1 and role <> 'owner' and id <> $2", [tenantId, keepUserId], 'users (non-owner, keeping the original admin)');
    await del('delete from students where tenant_id=$1', [tenantId], 'students');
    await del('delete from teachers where tenant_id=$1', [tenantId], 'teachers');
    await del('delete from groups where tenant_id=$1', [tenantId], 'groups');
    await del('delete from courses where tenant_id=$1', [tenantId], 'courses');
    await del('delete from settings where tenant_id=$1', [tenantId], 'settings');
    await del('delete from audit_logs where tenant_id=$1', [tenantId], 'audit_logs');
    const residue = await client.query('select count(*)::int as c from course_teachers');
    if (residue.rows[0].c > 0) { await del('delete from course_teachers', [], 'course_teachers (residue)'); }
    await client.query('commit');
    console.log('[clean] COMMIT OK');
  } catch (e) {
    await client.query('rollback');
    console.error('ABORT: clean phase rolled back:', e instanceof Error ? e.message : e);
    client.release();
    await pool.end();
    process.exit(1);
  }
  client.release();

  // ---------- PHASE 2: SEED (single transaction on a DEDICATED client) ----------
  const credsPath = path.join('audit-out', 'session-seed', 'credentials.txt');
  fs.mkdirSync(path.dirname(credsPath), { recursive: true });
  const creds: string[] = [
    'سنتر الخوارزمي — بيانات الدخول للحسابات الجديدة',
    'ملاحظة: حساب المالك (owner) لم يُلمس — دخوله ببياناتك الحالية.',
    '',
  ];

  const sc = await pool.connect();
  try {
    await sc.query('begin');
    const seed = async (sql: string, params: any[], label: string) => {
      await sc.query(sql, params);
      console.log('[seed] ' + label + ': OK');
    };
    await seed('update tenants set name=$2, updated_at=now() where id=$1', [tenantId, TENANT_NAME], 'tenant name');
    await seed('update users set name=$2, updated_at=now() where id=$1', [ownerPre.id, OWNER_NAME], 'admin display name (credentials untouched)');

    const mkUser = async (name: string, email: string, password: string, role: string) => {
      const hash = await bcrypt.hash(password, 12);
      const r = await sc.query(
        'insert into users(tenant_id,email,name,password_hash,role,active) values($1,$2,$3,$4,$5,true) returning id',
        [tenantId, email, name, hash, role]
      );
      creds.push(role + ' | ' + name + ' | ' + email + ' | ' + password);
      return String(r.rows[0].id);
    };
    const t1 = await mkUser(TEACHER1.name, TEACHER1.email, TEACHER1.password, 'teacher');
    const t2 = await mkUser(TEACHER2.name, TEACHER2.email, TEACHER2.password, 'teacher');
    const g1 = await mkUser(GUARDIAN.name, GUARDIAN.email, GUARDIAN.password, 'guardian');
    const s1u = await mkUser(STUDENT1.name, STUDENT1.email, STUDENT1.password, 'student');
    const s2u = await mkUser(STUDENT2.name, STUDENT2.email, STUDENT2.password, 'student');
    console.log('[seed] users: 5 OK (2 teacher, 1 guardian, 2 student)');

    await seed(
      "insert into teachers(tenant_id,name,email,specialty,status) values ($1,$2,$3,'رياضيات — قدرات كمي','active'),($1,$4,$5,'لغة عربية — قدرات لفظي','active')",
      [tenantId, 'محمد أحمد', TEACHER1.email, 'سارة عبدالله', TEACHER2.email], 'teachers: 2'
    );
    const st1 = String((await sc.query(
      "insert into students(tenant_id,student_no,name,type,status,notes,user_id,guardian_user_id) values($1,$2,$3,$4,'active',$5,$6,$7) returning id",
      [tenantId, STUDENT1.no, STUDENT1.name, STUDENT1.type, STUDENT1.note, s1u, g1]
    )).rows[0].id);
    await seed(
      "insert into students(tenant_id,student_no,name,type,status,notes,user_id) values($1,$2,$3,$4,'active',$5,$6)",
      [tenantId, STUDENT2.no, STUDENT2.name, STUDENT2.type, STUDENT2.note, s2u], 'students: 2 (khaled linked to user+guardian, omar to user)'
    );

    const courseIds: string[] = [];
    const groupIds: string[] = [];
    for (let i = 0; i < COURSES.length; i++) {
      const c = COURSES[i];
      const cid = String((await sc.query(
        'insert into courses(tenant_id,name,code,category,status) values($1,$2,$3,$4,\'active\') returning id',
        [tenantId, c.name, c.code, c.category]
      )).rows[0].id);
      courseIds.push(cid);
      const gid = String((await sc.query(
        "insert into groups(tenant_id,course_id,name,mode,status) values($1,$2,$3,'onsite','scheduled') returning id",
        [tenantId, cid, c.group]
      )).rows[0].id);
      groupIds.push(gid);
    }
    console.log('[seed] courses: 4 + groups: 4 OK');

    await seed(
      'insert into course_teachers(course_id,teacher_user_id) values ($1,$2),($3,$4),($5,$6),($7,$8)',
      [courseIds[0], t1, courseIds[2], t1, courseIds[1], t2, courseIds[3], t2], 'course_teachers: 4'
    );
    const today = dateOnly(new Date());
    const end90 = dateOnly(new Date(Date.now() + 90 * 86400000));
    const st2id = String((await sc.query('select id from students where user_id=$1', [s2u])).rows[0].id);
    await seed(
      "insert into enrollments(tenant_id,group_id,student_id,status,sub_start,sub_end) values($1,$2,$3,'active',$5,$6),($1,$4,$3,'active',$5,$6),($1,$7,$8,'active',$5,$6),($1,$9,$8,'active',$5,$6)",
      [tenantId, groupIds[0], st1, groupIds[1], today, end90, groupIds[2], st2id, groupIds[3]], 'enrollments: 4 (90-day periods)'
    );

    const qIds: string[] = [];
    for (const qd of QUESTIONS) {
      const r = await sc.query(
        'insert into questions(tenant_id,course_id,domain,subject,topic,skill,difficulty,kind,text,options,correct_index,explanation,status) values($1,$2,$3,$4,$5,$6,$7,\'mcq\',$8,$9::jsonb,$10,$11,\'active\') returning id',
        [tenantId, courseIds[qd.course], qd.domain, qd.subject, qd.topic, qd.skill, qd.difficulty, qd.text, JSON.stringify(qd.options), qd.correct, qd.explanation]
      );
      qIds.push(String(r.rows[0].id));
    }
    console.log('[seed] questions: ' + qIds.length + ' OK');

    for (const ex of EXAMS) {
      const e = (await sc.query(
        'insert into exams(tenant_id,course_id,title,kind,duration_minutes,randomize) values($1,$2,$3,$4,$5,true) returning id',
        [tenantId, courseIds[ex.course], ex.title, ex.kind, ex.minutes]
      )).rows[0] as any;
      for (let i = 0; i < ex.questions.length; i++) {
        await sc.query('insert into exam_questions(exam_id,question_id,position) values($1,$2,$3)', [e.id, qIds[ex.questions[i]], i]);
      }
    }
    console.log('[seed] exams: 3 (+ question links) OK');

    const due1 = dateOnly(new Date(Date.now() + 14 * 86400000));
    const due2 = dateOnly(new Date(Date.now() + 10 * 86400000));
    await seed(
      'insert into assignments(tenant_id,course_id,title,description,due_date,max_score,created_by) values($1,$2,$3,$4,$5,100,$6),($1,$7,$8,$9,$10,100,$6)',
      [tenantId, courseIds[0], 'حل تمارين النسب المئوية', 'حل تمارين الكتاب صفحة 12-14 مع كتابة الخطوات.', due1, ownerPre.id, courseIds[1], 'تحليل نص قرائي', 'اقرأ النص المرفق وجاوب عن الأسئلة التحليلية.', due2], 'assignments: 2'
    );
    for (let i = 1; i <= 5; i++) {
      await sc.query(
        "insert into activation_codes(tenant_id,course_id,code,duration_days,max_uses,active,created_by) values($1,$2,$3,30,1,true,$4)",
        [tenantId, courseIds[0], 'ALKH-2026-000' + i, ownerPre.id]
      );
    }
    console.log('[seed] activation_codes: 5 OK (ALKH-2026-0001..0005, 30 days, course: كمي)');

    await seed(
      "insert into notifications(tenant_id,user_id,title,body,type) values($1,$2,$3,$4,'welcome'),($1,$5,$6,$7,'welcome'),($1,$8,$9,$10,'assignment')",
      [
        tenantId, s1u, 'أهلاً بك في سنتر الخوارزمي', 'دوراتك جاهزة — ابدأ من دوراتي وامتحاناتك.',
        g1, 'تم ربط حسابكم بخالد فهد', 'تابعوا تقدمه من بوابة أولياء الأمور.',
        t1, 'دورتان مُسندتان إليك', 'قدرات كمي + تحصيلي فيزياء — بانتظار إضافتك للمحتوى.',
      ], 'notifications: 3'
    );
    await sc.query('commit');
    console.log('[seed] COMMIT OK');
  } catch (e) {
    await sc.query('rollback');
    console.error('ABORT: seed phase rolled back:', e instanceof Error ? e.message : e);
    sc.release();
    await pool.end();
    process.exit(1);
  }
  sc.release();

  // ---------- PHASE 3: VERIFY ----------
  const post = (await pool.query(
    `select
      (select count(*)::int from users where role in ('owner','admin')) owners,
      (select count(*)::int from users where role='teacher') teachers_u,
      (select count(*)::int from users where role='guardian') guardians_u,
      (select count(*)::int from users where role='student') students_u,
      (select count(*)::int from students) students,
      (select count(*)::int from teachers) teachers,
      (select count(*)::int from courses) courses,
      (select count(*)::int from groups) groups,
      (select count(*)::int from enrollments) enrollments,
      (select count(*)::int from course_teachers) ct,
      (select count(*)::int from questions) questions,
      (select count(*)::int from exams) exams,
      (select count(*)::int from exam_questions) eq,
      (select count(*)::int from assignments) assignments,
      (select count(*)::int from activation_codes) codes,
      (select count(*)::int from notifications) notifications,
      (select count(*)::int from audit_logs) audit_logs`
  )).rows[0];
  console.log('[verify] owners=' + post.owners + ' teachers_users=' + post.teachers_u + ' guardians=' + post.guardians_u + ' students_users=' + post.students_u);
  console.log('[verify] students=' + post.students + ' teachers=' + post.teachers + ' courses=' + post.courses + ' groups=' + post.groups + ' enrollments=' + post.enrollments + ' course_teachers=' + post.ct);
  console.log('[verify] questions=' + post.questions + ' exams=' + post.exams + ' exam_questions=' + post.eq + ' assignments=' + post.assignments + ' codes=' + post.codes + ' notifications=' + post.notifications + ' audit=' + post.audit_logs);
  const ownerPost = (await pool.query('select email, length(password_hash) as hl from users where id=$1', [ownerPre.id])).rows[0] as any;
  console.log('[verify] admin credentials untouched:', ownerPost.email === ownerPre.email && ownerPost.hl === ownerPre.hl ? 'YES' : 'NO');

  const expected =
    post.owners === 1 && post.teachers_u === 2 && post.guardians_u === 1 && post.students_u === 2 &&
    post.students === 2 && post.teachers === 2 && post.courses === 4 && post.groups === 4 &&
    post.enrollments === 4 && post.ct === 4 && post.questions === 12 && post.exams === 3 && post.eq === 12 &&
    post.assignments === 2 && post.codes === 5 && post.notifications === 3 && post.audit_logs === 0;
  console.log(expected ? 'PASS: seed-live verified against expected counts' : 'FAIL: counts differ from expectation');

  creds.push('', 'أكواد التفعيل (30 يوماً، دورة قدرات كمي):', 'ALKH-2026-0001', 'ALKH-2026-0002', 'ALKH-2026-0003', 'ALKH-2026-0004', 'ALKH-2026-0005');
  fs.writeFileSync(credsPath, creds.join('\n'), 'utf8');
  console.log('[creds] written: ' + credsPath + ' (open locally - never shared in chat)');
  await pool.end();
  process.exit(expected ? 0 : 1);
}

main().catch((e) => { console.error('ABORT:', e instanceof Error ? e.message : e); process.exit(1); });


