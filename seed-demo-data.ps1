$container = "training-center-saas-db-1"
$db = "training_center"
$user = "postgres"

Write-Host "Starting demo data seed..."

$sql = @"
BEGIN;

DELETE FROM payments;
DELETE FROM invoices;
DELETE FROM certificates;
DELETE FROM attendance;
DELETE FROM enrollments;
DELETE FROM groups;
DELETE FROM classrooms;
DELETE FROM courses;
DELETE FROM teachers;
DELETE FROM students;
DELETE FROM users;
DELETE FROM settings;
DELETE FROM tenants;


INSERT INTO tenants
(
id,
name,
slug,
currency,
timezone,
locale,
status
)
VALUES
(
gen_random_uuid(),
'مركز التدريب التجريبي',
'demo-center',
'SAR',
'Asia/Riyadh',
'ar-SA',
'active'
);


WITH t AS (
SELECT id FROM tenants WHERE slug='demo-center'
)
INSERT INTO users
(
tenant_id,
email,
name,
password_hash,
role,
phone
)
SELECT
id,
'admin@center.sa',
'مدير النظام',
'admin123',
'admin',
'0500000000'
FROM t;


WITH t AS (
SELECT id FROM tenants WHERE slug='demo-center'
)
INSERT INTO teachers
(
tenant_id,
name,
phone,
email,
specialty,
hourly_rate
)
SELECT
t.id,
x.name,
x.phone,
x.email,
x.specialty,
x.rate
FROM t,
(
VALUES
('أحمد محمد','0501111111','ahmed@test.com','برمجة',120),
('خالد علي','0502222222','khaled@test.com','شبكات',100),
('محمد حسن','0503333333','mohamed@test.com','لغة انجليزية',90),
('سارة أحمد','0504444444','sara@test.com','تصميم',110),
('نورة عبدالله','0505555555','nora@test.com','إدارة أعمال',100)
)
AS x(name,phone,email,specialty,rate);



WITH t AS (
SELECT id FROM tenants WHERE slug='demo-center'
)
INSERT INTO courses
(
tenant_id,
name,
code,
category,
duration_hours,
price,
description
)
SELECT
t.id,
x.name,
x.code,
x.category,
x.hours,
x.price,
'دورة تدريبية تجريبية'
FROM t,
(
VALUES
('اللغة الإنجليزية','ENG01','لغات',40,1500),
('الحاسب الآلي','IT01','تقنية',30,1200),
('البرمجة','DEV01','تقنية',60,2500),
('الشبكات','NET01','تقنية',50,2200),
('التصميم','DES01','تصميم',40,1800),
('إدارة الأعمال','BUS01','إدارة',30,1500)
)
AS x(name,code,category,hours,price);



WITH t AS (
SELECT id FROM tenants WHERE slug='demo-center'
)
INSERT INTO classrooms
(
tenant_id,
name,
capacity,
location,
equipment
)
SELECT
t.id,
x.name,
25,
'الدور الأول',
'أجهزة كمبيوتر وشاشة'
FROM t,
(
VALUES
('قاعة 1'),
('قاعة 2'),
('قاعة 3'),
('معمل الحاسب')
)
AS x(name);



WITH t AS (
SELECT id FROM tenants WHERE slug='demo-center'
),
c AS (
SELECT id,ROW_NUMBER() OVER() rn FROM courses
),
th AS (
SELECT id,ROW_NUMBER() OVER() rn FROM teachers
),
cl AS (
SELECT id,ROW_NUMBER() OVER() rn FROM classrooms
)
INSERT INTO groups
(
tenant_id,
course_id,
teacher_id,
classroom_id,
name,
capacity,
room,
start_date,
end_date,
start_time,
end_time,
days,
status
)
SELECT
t.id,
c.id,
th.id,
cl.id,
'مجموعة رقم '||c.rn,
25,
'قاعة '||cl.rn,
CURRENT_DATE,
CURRENT_DATE + 60,
'16:00',
'18:00',
'الأحد - الثلاثاء - الخميس',
'scheduled'
FROM t,c,th,cl
LIMIT 6;



WITH t AS (
SELECT id FROM tenants WHERE slug='demo-center'
)
INSERT INTO students
(
tenant_id,
student_no,
name,
gender,
phone,
guardian_name,
guardian_phone,
status
)
SELECT
t.id,
'STD'||LPAD(i::text,3,'0'),
'طالب تجريبي '||i,
CASE WHEN i%2=0 THEN 'ذكر' ELSE 'أنثى' END,
'055000'||i,
'ولي أمر '||i,
'056000'||i,
'active'
FROM t,
generate_series(1,30)i;



WITH t AS (
SELECT id FROM tenants WHERE slug='demo-center'
),
s AS (
SELECT id,ROW_NUMBER() OVER() rn FROM students
),
g AS (
SELECT id,ROW_NUMBER() OVER() rn FROM groups
)
INSERT INTO enrollments
(
tenant_id,
group_id,
student_id,
price,
discount
)
SELECT
t.id,
g.id,
s.id,
1500,
0
FROM t,s,g
WHERE s.rn % 6 = g.rn - 1;



WITH t AS (
SELECT id FROM tenants WHERE slug='demo-center'
),
e AS (
SELECT group_id,student_id FROM enrollments
)
INSERT INTO attendance
(
tenant_id,
group_id,
student_id,
attendance_date,
status,
notes
)
SELECT
t.id,
e.group_id,
e.student_id,
CURRENT_DATE - d,
CASE
WHEN random() < 0.7 THEN 'present'
WHEN random() < 0.85 THEN 'late'
ELSE 'absent'
END,
'بيانات تجريبية'
FROM t,e,
generate_series(0,6)d
ON CONFLICT DO NOTHING;



WITH t AS (
SELECT id FROM tenants WHERE slug='demo-center'
),
s AS (
SELECT id,ROW_NUMBER() OVER() rn FROM students
)
INSERT INTO invoices
(
tenant_id,
student_id,
number,
amount,
due_date,
status,
notes
)
SELECT
t.id,
s.id,
'INV-'||LPAD(s.rn::text,4,'0'),
1500,
CURRENT_DATE + 30,
'paid',
'فاتورة تجريبية'
FROM t,s;



WITH t AS (
SELECT id FROM tenants WHERE slug='demo-center'
),
i AS (
SELECT id FROM invoices
)
INSERT INTO payments
(
tenant_id,
invoice_id,
amount,
method,
reference
)
SELECT
t.id,
i.id,
1500,
'cash',
'DEMO'
FROM t,i;


COMMIT;
"@


docker exec -i $container psql `
-U $user `
-d $db `
-v ON_ERROR_STOP=1 `
-c $sql


if ($LASTEXITCODE -ne 0) {
    Write-Host "Seed failed"
    exit 1
}


Write-Host "Demo data inserted successfully"