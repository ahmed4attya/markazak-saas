// seed-demo.mjs v2 - schema-adaptive rich demo data (LOCAL ONLY, idempotent, prefix dea50000-)
import { readFileSync } from "fs";
import pg from "pg";
function envParse(t) { const o = {}; for (const l of t.split(/\r?\n/)) { const s = l.trim(); if (!s || s.startsWith("#")) continue; const i = s.indexOf("="); if (i < 1) continue; let v = s.slice(i + 1).trim(); const qq = String.fromCharCode(34); if (v.length > 1 && v.startsWith(qq) && v.endsWith(qq)) v = v.slice(1, -1); o[s.slice(0, i).trim()] = v; } return o; }
const env = envParse(readFileSync(".env.local", "utf8"));
if (!env.DATABASE_URL) { console.log("FATAL: no DATABASE_URL"); process.exit(2); }
const dbHost = new URL(env.DATABASE_URL).hostname;
if (dbHost !== "localhost" && dbHost !== "127.0.0.1") { console.log("FATAL_NOT_LOCAL"); process.exit(2); }
const pool = new pg.Pool({ connectionString: env.DATABASE_URL });
const q = async (sql, p) => (await pool.query(sql, p || [])).rows;
const P = "dea50000-0000-4000-8000-";
const ID = (s) => P + s;
let errors = 0;
const cache = {};
async function cols(t) { if (!cache[t]) cache[t] = await q("select column_name, data_type, udt_name, is_nullable, column_default from information_schema.columns where table_name=$1", [t]); return cache[t]; }
function fill(c) { const dt = String(c.data_type); if (dt === "text" || dt.startsWith("character")) return "DEMO"; if (["integer","smallint","bigint","numeric","decimal","real","double precision"].includes(dt)) return 0; if (dt === "boolean") return false; if (dt === "jsonb" || dt === "json") return "{}"; if (dt === "ARRAY") return []; if (dt.indexOf("time") === 0) return "09:00:00"; if (dt.includes("timestamp") || dt === "date") return new Date().toISOString().slice(0, 10); return null; }
async function ins(table, id, base) {
  const cs = await cols(table);
  const have = new Set(cs.map((c) => c.column_name));
  const row = Object.assign({ id }, base);
  for (const k of Object.keys(row)) { if (k !== "id" && !have.has(k)) { console.log("DROP " + table + "." + k); delete row[k]; } }
  for (const c of cs) { if (c.column_name in row) continue; if (c.is_nullable === "NO" && c.column_default === null) { const v = fill(c); if (v === null) { errors++; console.log("GAP " + table + "." + c.column_name); return false; } row[c.column_name] = v; } }
  const names = Object.keys(row);
  try { await q("insert into " + table + " (" + names.join(",") + ") values (" + names.map((x, i) => "$" + (i + 1)).join(",") + ") on conflict (id) do nothing", names.map((n) => row[n])); console.log("OK " + table + ":" + id.slice(-6)); return true; }
  catch (e) { errors++; console.log("ERR " + table + ":" + id.slice(-6) + " :: " + e.message); return false; }
}
const iso = (d) => d.toISOString().slice(0, 10);
const dayShift = (n) => { const x = new Date(); x.setDate(x.getDate() + n); return iso(x); };
const ts = (n) => { const x = new Date(); x.setDate(x.getDate() + n); return x.toISOString(); };
const cons = await q("select conrelid::regclass::text as tbl, conname, pg_get_constraintdef(oid) as def from pg_constraint where contype in ('u','p') and conrelid in ('students'::regclass,'groups'::regclass) order by 1,2");
for (const c of cons) console.log("CONS " + c.tbl + " " + c.conname + " :: " + c.def);
const users = await q("select id, tenant_id, role from users order by role");
const admin = users.find((u) => u.role === "admin");
const tUser = users.find((u) => u.role === "teacher");
if (!admin || !tUser) { console.log("FATAL_USERS"); process.exit(2); }
const T1 = String(tUser.tenant_id);
console.log("TENANT_OK USERS=" + users.length);
const exSt = await q("select * from students order by created_at asc");
const stc = await cols("students");
console.log("STUDENT_COLS=" + stc.map((c) => c.column_name + ":" + c.data_type).join(","));
const snCol = stc.find((c) => c.column_name === "student_no");
const snType = snCol ? String(snCol.data_type) : "text";
const snNumeric = /int|numeric|decimal|real|double/i.test(snType);
console.log("SN_COL=" + snType);
const exNo = new Set(exSt.map((r) => String(r.student_no)));
if (snNumeric) { await q("update students set student_no=91000 where id=$1 and student_no=0", [ID("a00000000001")]); }
else { await q("update students set student_no=$1 where id=$2 and student_no='DEMO'", ["STD-2026-900", ID("a00000000001")]); }
try { await q("update students set email=$1 where id=$2 and email='DEMO'", ["st900@demo.center.sa", ID("a00000000001")]); } catch (e) { console.log("DEMO_EMAIL_SKIP"); }
function genSn(i) { let v = snNumeric ? 91001 + i : "STD-2026-" + String(101 + i); let g = 0; while (exNo.has(String(v)) && g < 50) { v = snNumeric ? v + 1 : v + "x"; g++; } exNo.add(String(v)); return v; }
let studentIds = exSt.map((r) => String(r.id));
const stNames = [["محمد الشهري","0551002001"],["فهد الدوسري","0551002002"],["ريم الحربي","0551002003"],["لمى الزهراني","0551002004"],["عبدالله الغامدي","0551002005"],["سلمان البقمي","0551002006"],["جواهر السبيعي","0551002007"],["تركي العنزي","0551002008"]];
const hasPhone = stc.some((c) => c.column_name === "phone");
const hasEmail = stc.some((c) => c.column_name === "email");
let added = 0;
for (let i = 0; i < stNames.length; i++) {
  const sid = ID("a0" + String(i + 1).padStart(10, "0"));
  const baseS = { tenant_id: T1, name: stNames[i][0], student_no: genSn(i) };
  if (hasPhone) baseS.phone = stNames[i][1];
  if (hasEmail) baseS.email = "st" + String(i + 1) + "@demo.center.sa";
  const okS = await ins("students", sid, baseS);
  if (okS && studentIds.indexOf(sid) === -1) { studentIds.push(sid); added++; }
}
console.log("STUDENTS_TOTAL=" + studentIds.length + " ADDED=" + added);
const tch = [["d10100000001","أحمد الخطيب","0552001001","ahmed@center.sa","الرياضيات"],["d10100000002","سارة العتيبي","0552001002","sara@center.sa","الفيزياء"],["d10100000003","خالد المطيري","0552001003","khaled@center.sa","الكيمياء"],["d10100000004","نورة القحطاني","0552001004","noura@center.sa","اللغة الإنجليزية"]];
for (const t of tch) await ins("teachers", ID(t[0]), { tenant_id: T1, name: t[1], phone: t[2], email: t[3], specialty: t[4], status: "active" });
const cls = [["c10100000001","قاعة الأمل",20,"الدور الأول"],["c10100000002","قاعة المستقبل",25,"الدور الثاني"],["c10100000003","معمل الحاسب",18,"الدور الأول"]];
for (const c of cls) await ins("classrooms", ID(c[0]), { tenant_id: T1, name: c[1], capacity: c[2], location: c[3], status: "active" });
const cA = "5eed0000-0000-4000-8000-00000000c0a1";
const cB = "5eed0000-0000-4000-8000-00000000c0b2";
const cPhys = ID("b10100000001");
const cChem = ID("b10100000002");
await ins("courses", cPhys, { tenant_id: T1, name: "الفيزياء - تمهيدي نهائي" });
await ins("courses", cChem, { tenant_id: T1, name: "الكيمياء - تأسيس متقدم" });
await q("update courses set name=$1 where id=$2", ["الرياضيات - مسار النخبة", cA]);
await q("update courses set name=$1 where id=$2", ["الإنجليزية - IELTS تحضيري", cB]);
console.log("COURSES_RENAMED");
const t1p = ID("d10100000001"), t2p = ID("d10100000002"), t4p = ID("d10100000004");
const cr1 = ID("c10100000001"), cr2 = ID("c10100000002"), cr3 = ID("c10100000003");
const gcols = await cols("groups");
console.log("GROUP_COLS=" + gcols.map((c) => c.column_name + ":" + c.data_type + ":" + c.udt_name + ":" + c.is_nullable).join(","));
const dayCol = gcols.find((c) => c.column_name === "days");
function daysValue(arr) {
  if (!dayCol) return undefined;
  const dt = String(dayCol.data_type), ud = String(dayCol.udt_name || "");
  if (dt === "text" || dt.startsWith("character")) return arr.join(", ");
  if (dt === "jsonb" || dt === "json") return JSON.stringify(arr);
  if (dt === "ARRAY") { if (ud === "_text" || ud.indexOf("_varchar") === 0 || ud === "_bpchar") return arr; return undefined; }
  if (/int|smallint|bigint|numeric|decimal|real|double/i.test(dt)) return arr.length;
  if (dt.indexOf("time") === 0) { if (dayCol.is_nullable === "YES") return undefined; console.log("DAYS_PLACEHOLDER_USED"); return "00:00:00"; }
  return undefined;
}
const grps = [["e10100000001","رياضيات أ", cA, t1p, cr1, "16:00:00","18:00:00",["السبت","الاثنين","الأربعاء"]],["e10100000002","رياضيات ب", cA, t1p, cr2, "18:00:00","20:00:00",["الأحد","الثلاثاء"]],["e10100000003","فيزياء أ", cPhys, t2p, cr3, "16:30:00","19:00:00",["الاثنين","الخميس"]],["e10100000004","إنجليزي أ", cB, t4p, cr1, "20:00:00","22:00:00",["السبت","الثلاثاء"]]];
const groupIds = [];
for (const g of grps) {
  const gid = ID(g[0]);
  const gb = { tenant_id: T1, name: g[1], course_id: g[2], teacher_id: g[3], classroom_id: g[4], capacity: 20, mode: "onsite", start_date: dayShift(0), end_date: dayShift(120), start_time: g[5], end_time: g[6], status: "scheduled" };
  const dv = daysValue(g[7]);
  if (dv !== undefined) gb.days = dv;
  let okG = await ins("groups", gid, gb);
  if (!okG) { gb.teacher_id = tUser.id; okG = await ins("groups", gid, gb); }
  if (okG) groupIds.push(gid);
}
console.log("GROUPS_OK=" + groupIds.length);
let en = 0;
const eN = Math.min(10, studentIds.length * Math.max(1, groupIds.length));
for (let i = 0; i < eN; i++) {
  const gid = groupIds.length ? groupIds[i % groupIds.length] : null;
  if (!gid) break;
  const okE = await ins("enrollments", ID("a1010000" + String(i + 1).padStart(4, "0")), { tenant_id: T1, group_id: gid, student_id: studentIds[i % studentIds.length], status: "active", price: 1800, discount: i < 3 ? 200 : 0, sub_start: dayShift(0), sub_end: dayShift(90) });
  if (okE) en++;
}
console.log("ENROLLMENTS_OK=" + en);
const stCycle = ["present","present","late","present","absent","present"];
let at = 0;
let atIdx = 0;
if (groupIds.length) {
  for (const dt of [dayShift(-1), dayShift(-2), dayShift(-3)]) {
    for (let i = 0; i < Math.min(6, studentIds.length); i++) {
      atIdx++;
      const okA = await ins("attendance", ID("b2010000" + String(atIdx).padStart(4, "0")), { tenant_id: T1, group_id: groupIds[0], student_id: studentIds[i], attendance_date: dt, status: stCycle[i % stCycle.length] });
      if (okA) at++;
    }
  }
}
console.log("ATTENDANCE_OK=" + at);
const invStatus = ["paid","paid","paid","paid","paid","unpaid","unpaid","overdue"];
const invIds = [];
for (let i = 0; i < 8; i++) {
  const iid = ID("a2010000" + String(i + 1).padStart(4, "0"));
  const due = invStatus[i] === "overdue" ? dayShift(-5) : dayShift(7 + i * 3);
  const okI = await ins("invoices", iid, { tenant_id: T1, student_id: studentIds[i % studentIds.length], number: "INV-2026-" + String(i + 1).padStart(4, "0"), amount: 1800, due_date: due, status: invStatus[i], notes: "قسط الاشتراك الشهري" });
  if (okI) invIds.push({ id: iid, st: invStatus[i] });
}
console.log("INVOICES_OK=" + invIds.length);
const methods = ["mada","cash","bank"];
let pay = 0;
let pi = 0;
for (const iv of invIds) {
  if (iv.st !== "paid") continue;
  pi++;
  const okP = await ins("payments", ID("b2020000" + String(pi).padStart(4, "0")), { tenant_id: T1, invoice_id: iv.id, amount: 1800, method: methods[(pi - 1) % methods.length], reference: "PAY-2026-" + String(pi).padStart(4, "0"), paid_at: ts(-2) });
  if (okP) pay++;
}
console.log("PAYMENTS_OK=" + pay);
const codes = [["c20100000001","MKZ-MATH30",30,1,cA],["c20100000002","MKZ-PHY90",90,5,cPhys],["c20100000003","MKZ-ENG365",365,10,cB],["c20100000004","MKZ-TRIAL7",7,100,null],["c20100000005","MKZ-VIP180",180,3,cChem]];
for (const c of codes) await ins("activation_codes", ID(c[0]), { tenant_id: T1, code: c[1], duration_days: c[2], max_uses: c[3], course_id: c[4], used_count: 0, active: true, created_by: admin.id });
const plans = [["basic","الأساسية",499,4990,{ students: 50, storage: "5GB" },["لوحة تحكم","إدارة الطلاب","الحضور والغياب"]],["pro","الاحترافية",899,8990,{ students: 200, storage: "50GB", ai: true },["كل مزايا الأساسية","مساعد AI","تقارير متقدمة","الشهادات"]],["elite","المتميزة",1499,14990,{ students: 1000, storage: "200GB", ai: true, branding: true },["كل مزايا الاحترافية","هوية مخصصة","دعم أولوية","تكامل API"]]];
let pli = 0;
for (const p of plans) {
  pli++;
  const okP2 = await ins("plans", ID("f4010000" + String(pli).padStart(4, "0")), { code: p[0], name: p[1], monthly_price: p[2], yearly_price: p[3], limits: JSON.stringify(p[4]), features: JSON.stringify(p[5]), active: true });
  if (!okP2) console.log("PLAN_DETAIL " + p[0]);
}
const certStu = studentIds.slice(0, 3);
const certCourses = [cA, cPhys, cB];
const certGrades = ["ممتاز","جيد جدًا","ممتاز"];
for (let i = 0; i < certStu.length; i++) await ins("certificates", ID("d2010000" + String(i + 1).padStart(4, "0")), { tenant_id: T1, student_id: certStu[i], course_id: certCourses[i], number: "CERT-2026-" + String(i + 1).padStart(4, "0"), issued_at: dayShift(-10), grade: certGrades[i], status: "issued" });
const qDefs = [
  [cA,"math","الرياضيات","الجبر","معادلات خطية",2,"إذا كان 2س + 5 = 17 فما قيمة س؟",["5","6","7","8"],1,"نطرح 5 من الطرفين ثم نقسم على 2."],
  [cA,"math","الرياضيات","الهندسة التحليلية","الميل",2,"ما ميل المستقيم المار بالنقطتين (1,2) و (3,6)؟",["1","2","3","4"],1,"الفرق الرأسي على الأفقي = 4/2 = 2."],
  [cA,"math","الرياضيات","الجبر","المتطابقات",3,"ما ناتج (س+3)²؟",["س²+9","س²+6س+9","س²+3س+9","س²+6س+6"],1,"نطبق المتطابقة (أ+ب)² = أ²+2أب+ب²."],
  [cA,"math","الرياضيات","المعادلات التربيعية","الجذور",3,"ما جذرا المعادلة س² - 9 = 0؟",["3 فقط","-3 فقط","±3","±9"],2,"س² = 9 إذن س = ±3."],
  [cA,"math","الرياضيات","حساب المثلثات","نسب مثلثية",4,"قيمة جا 30° تساوي:",["0.5","0.866","0.707","1"],0,"جا 30° = 0.5."],
  [cA,"math","الرياضيات","الهندسة","المساحة",2,"مساحة دائرة نصف قطرها 3 تساوي:",["6π","9π","3π","12π"],1,"المساحة = π نق² = 9π."],
  [cPhys,"physics","الفيزياء","الوحدات","النظام الدولي",2,"وحدة القوة في النظام الدولي:",["الجول","النيوتن","الواط","الباسكال"],1,"القوة تقاس بالنيوتن."],
  [cPhys,"physics","الفيزياء","الضوء","السرعة",3,"سرعة الضوء في الفراغ تقارب:",["300 كم/ث","3,000 كم/ث","300,000 كم/ث","30,000 كم/ث"],2,"تقارب 300,000 كم/ث."],
  [cPhys,"physics","الفيزياء","الميكانيكا","قوانين نيوتن",3,"قانون نيوتن الثاني ينص على:",["ق = ك × ع","ع = ك × ق","ق = ع ÷ ك","ك = ق × ع"],0,"القوة = الكتلة × العجلة."],
  [cB,"english","الإنجليزية","Grammar","Present Simple",2,"Choose the correct: He ___ to school every day.",["go","goes","going","gone"],1,"الفاعل مفرد غائب نضيف s."],
  [cB,"english","الإنجليزية","Vocabulary","Synonyms",3,"What is the synonym of rapid?",["slow","quick","late","weak"],1,"rapid تعني سريع."],
  [cB,"english","الإنجليزية","Grammar","Irregular Verbs",2,"The past tense of buy is:",["buyed","bought","buys","buying"],1,"فعل شاذ: buy - bought."]
];
let qi = 0;
for (const d of qDefs) {
  qi++;
  await ins("questions", ID("e2010000" + String(qi).padStart(4, "0")), { tenant_id: T1, course_id: d[0], domain: d[1], subject: d[2], topic: d[3], skill: d[4], difficulty: d[5], kind: "mcq", text: d[6], options: JSON.stringify(d[7]), correct_index: d[8], explanation: d[9], created_by: admin.id, status: "active" });
}
console.log("QUESTIONS_DONE=" + qi);
const notifs = [[admin.id,"فاتورة جديدة مسددة","تم استلام دفعة بقيمة 1800 ريال عبر مدى.","info"],[admin.id,"نسبة غياب مرتفعة","مجموعة رياضيات أ سجلت 3 حالات غياب هذا الأسبوع.","warning"],[admin.id,"طلب تفعيل كود","الكود MKZ-TRIAL7 يقترب من حد الاستخدام.","warning"],[tUser.id,"اختبار بانتظار التصحيح","اختبار الرياضيات التجميعي الأول جاهز للمراجعة.","info"],[tUser.id,"تقرير الأداء الأسبوعي","تحليل نقاط الضعف للمجموعات متاح الآن.","info"]];
for (let i = 0; i < notifs.length; i++) await ins("notifications", ID("f2010000" + String(i + 1).padStart(4, "0")), { tenant_id: T1, user_id: notifs[i][0], title: notifs[i][1], body: notifs[i][2], type: notifs[i][3] });
const hasSettings = await q("select 1 from settings where tenant_id=$1", [T1]);
if (!hasSettings.length) await ins("settings", ID("f30100000001"), { tenant_id: T1, data: JSON.stringify({ centerName: "مركز التجارب التعليمية", currency: "SAR", phone: "0112223344", timezone: "Asia/Riyadh", workingHours: "08:00-22:00" }) });
else console.log("SETTINGS_EXISTS");
const leads = [["تلال عبدالرحمن","talal@example.com","أبحث عن نظام لإدارة مركزين في جدة، هل يدعم الفروع؟"],["أم فهد","umfahad@example.com","أرغب بتجربة النسخة التجريبية لمركز تحفيظ."],["سعود القحطاني","saud@example.com","ما الفرق بين الباقة الاحترافية والمتميزة؟"],["هند مظهري","hind@example.com","هل يوجد تطبيق جوال لولي الأمر؟"]];
for (let i = 0; i < leads.length; i++) await ins("leads", ID("a3010000" + String(i + 1).padStart(4, "0")), { name: leads[i][0], email: leads[i][1], message: leads[i][2] });
const vt = ["students","teachers","courses","groups","classrooms","enrollments","attendance","invoices","payments","activation_codes","plans","certificates","questions","notifications","settings","leads"];
for (const t of vt) { const r = await q("select count(*)::int as n from " + t); console.log("COUNT " + t + "=" + r[0].n); }
let coreOk = true;
const chk = async (t, min) => { const r = await q("select count(*)::int as n from " + t); if (Number(r[0].n) < min) coreOk = false; };
await chk("students", 10); await chk("teachers", 4); await chk("groups", 4); await chk("classrooms", 3); await chk("enrollments", 8); await chk("attendance", 3); await chk("invoices", 8); await chk("payments", 5); await chk("activation_codes", 5); await chk("plans", 3); await chk("certificates", 3); await chk("questions", 12); await chk("notifications", 5); await chk("settings", 1); await chk("leads", 4);
await pool.end();
if (coreOk) { console.log("SEED_DEMO_DONE"); process.exit(0); }
console.log("SEED_DEMO_PARTIAL errors=" + errors);
process.exit(1);