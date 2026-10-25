create extension if not exists pgcrypto;
create table if not exists tenants(id uuid primary key default gen_random_uuid(),name varchar(160) not null,slug varchar(120) unique not null,logo_url text,timezone varchar(80) default 'Asia/Riyadh',currency varchar(3) default 'SAR',locale varchar(10) default 'ar-SA',plan varchar(30) default 'starter',status varchar(20) default 'active',created_at timestamptz default now(),updated_at timestamptz default now());
create table if not exists users(id uuid primary key default gen_random_uuid(),tenant_id uuid references tenants(id) on delete cascade,email varchar(255) unique not null,name varchar(160) not null,password_hash text not null,role varchar(30) default 'staff',phone varchar(40),active boolean default true,last_login_at timestamptz,created_at timestamptz default now(),updated_at timestamptz default now());
create table if not exists students(id uuid primary key default gen_random_uuid(),tenant_id uuid references tenants(id) on delete cascade,student_no varchar(60) not null,name varchar(160) not null,gender varchar(20),birth_date date,nationality varchar(80),identity_no varchar(80),phone varchar(40),email varchar(255),guardian_name varchar(160),guardian_phone varchar(40),address text,emergency_contact varchar(160),notes text,status varchar(30) default 'active',created_at timestamptz default now(),updated_at timestamptz default now(),unique(tenant_id,student_no));
create table if not exists teachers(id uuid primary key default gen_random_uuid(),tenant_id uuid references tenants(id) on delete cascade,name varchar(160) not null,phone varchar(40),email varchar(255),specialty varchar(160),bio text,hourly_rate numeric(12,2) default 0,status varchar(30) default 'active',created_at timestamptz default now(),updated_at timestamptz default now());
create table if not exists courses(id uuid primary key default gen_random_uuid(),tenant_id uuid references tenants(id) on delete cascade,name varchar(180) not null,code varchar(60),category varchar(120),duration_hours int default 0,capacity int default 25,price numeric(12,2) default 0,description text,objectives text,requirements text,status varchar(30) default 'active',created_at timestamptz default now(),updated_at timestamptz default now(),unique(tenant_id,code));
create table if not exists classrooms(id uuid primary key default gen_random_uuid(),tenant_id uuid references tenants(id) on delete cascade,name varchar(120) not null,capacity int default 25,location varchar(180),equipment text,status varchar(20) default 'active');
create table if not exists groups(id uuid primary key default gen_random_uuid(),tenant_id uuid references tenants(id) on delete cascade,course_id uuid references courses(id) on delete set null,teacher_id uuid references teachers(id) on delete set null,classroom_id uuid references classrooms(id) on delete set null,name varchar(160) not null,capacity int default 25,room varchar(120),mode varchar(30) default 'onsite',start_date date,end_date date,start_time time,end_time time,days varchar(100),status varchar(30) default 'scheduled',created_at timestamptz default now());
create table if not exists enrollments(id uuid primary key default gen_random_uuid(),tenant_id uuid references tenants(id) on delete cascade,group_id uuid references groups(id) on delete cascade,student_id uuid references students(id) on delete cascade,enrolled_at timestamptz default now(),status varchar(30) default 'active',price numeric(12,2) default 0,discount numeric(12,2) default 0,unique(group_id,student_id));
create table if not exists attendance(id uuid primary key default gen_random_uuid(),tenant_id uuid references tenants(id) on delete cascade,group_id uuid references groups(id) on delete cascade,student_id uuid references students(id) on delete cascade,attendance_date date not null,status varchar(20) not null,check_in timestamptz,notes text,unique(group_id,student_id,attendance_date));
create table if not exists invoices(id uuid primary key default gen_random_uuid(),tenant_id uuid references tenants(id) on delete cascade,student_id uuid references students(id) on delete set null,number varchar(80) not null,amount numeric(12,2) not null,due_date date,status varchar(20) default 'unpaid',notes text,created_at timestamptz default now(),unique(tenant_id,number));
create table if not exists payments(id uuid primary key default gen_random_uuid(),tenant_id uuid references tenants(id) on delete cascade,invoice_id uuid references invoices(id) on delete cascade,amount numeric(12,2) not null,method varchar(30),reference varchar(120),paid_at timestamptz default now());
create table if not exists certificates(id uuid primary key default gen_random_uuid(),tenant_id uuid references tenants(id) on delete cascade,student_id uuid references students(id),course_id uuid references courses(id),number varchar(100) not null,issued_at date default current_date,grade varchar(30),status varchar(20) default 'issued',verify_token varchar(80) unique default encode(gen_random_bytes(16),'hex'),unique(tenant_id,number));
create table if not exists notifications(id uuid primary key default gen_random_uuid(),tenant_id uuid references tenants(id) on delete cascade,user_id uuid references users(id) on delete cascade,title varchar(200),body text,type varchar(30),read_at timestamptz,created_at timestamptz default now());
create table if not exists audit_logs(id bigserial primary key,tenant_id uuid references tenants(id) on delete cascade,user_id uuid,action varchar(100) not null,entity varchar(80),entity_id uuid,metadata jsonb,created_at timestamptz default now());
create table if not exists subscriptions(id uuid primary key default gen_random_uuid(),tenant_id uuid unique references tenants(id) on delete cascade,stripe_customer_id text,stripe_subscription_id text,plan varchar(40) default 'starter',status varchar(30) default 'trialing',current_period_end timestamptz,created_at timestamptz default now());
create table if not exists plans(id uuid primary key default gen_random_uuid(),code varchar(40) unique not null,name varchar(100) not null,monthly_price numeric(12,2) default 0,yearly_price numeric(12,2) default 0,limits jsonb default '{}',features jsonb default '[]',active boolean default true);
create table if not exists settings(id uuid primary key default gen_random_uuid(),tenant_id uuid unique references tenants(id) on delete cascade,data jsonb default '{}',updated_at timestamptz default now());
create index if not exists students_tenant_name on students(tenant_id,name); create index if not exists attendance_tenant_date on attendance(tenant_id,attendance_date); create index if not exists invoices_tenant_status on invoices(tenant_id,status); create index if not exists groups_tenant_date on groups(tenant_id,start_date);

-- S1: student types (center/online) + enrollment subscription period (DEC-029/030)
alter table students add column if not exists type varchar(20) not null default 'center';
alter table enrollments add column if not exists sub_start date;
alter table enrollments add column if not exists sub_end date;
create index if not exists students_tenant_type on students(tenant_id,type);

-- S2: file library (Scope 2, DEC-047..051)
create table if not exists files(id uuid primary key default gen_random_uuid(),tenant_id uuid not null references tenants(id) on delete cascade,course_id uuid references courses(id) on delete set null,group_id uuid references groups(id) on delete set null,name varchar(255) not null,mime varchar(120),size_bytes bigint default 0,storage_key text not null unique,uploaded_by uuid references users(id) on delete set null,note text,created_at timestamptz default now(),updated_at timestamptz default now());
create index if not exists files_tenant_course on files(tenant_id,course_id);
create index if not exists files_tenant_created on files(tenant_id,created_at desc);


-- S3: secure video library (Scope 3, DEC-053..057)
create table if not exists videos(id uuid primary key default gen_random_uuid(),tenant_id uuid not null references tenants(id) on delete cascade,course_id uuid references courses(id) on delete set null,group_id uuid references groups(id) on delete set null,title varchar(255) not null,mime varchar(120),size_bytes bigint default 0,duration_seconds int,storage_key text not null unique,uploaded_by uuid references users(id) on delete set null,created_at timestamptz default now(),updated_at timestamptz default now());
create index if not exists videos_tenant_course on videos(tenant_id,course_id);
create index if not exists videos_tenant_created on videos(tenant_id,created_at desc);

-- S-R: internal notifications index (Scope R, DEC-060) - table defined once above (first definition wins)
create index if not exists notifications_user_read on notifications(user_id,read_at);


-- S4a: exam engine foundation + access model (Scope 4A, DEC-062)
create table if not exists course_teachers(course_id uuid references courses(id) on delete cascade,teacher_user_id uuid references users(id) on delete cascade,assigned_at timestamptz default now(),primary key(course_id,teacher_user_id));
alter table students add column if not exists guardian_user_id uuid references users(id) on delete set null;
create table if not exists questions(id uuid primary key default gen_random_uuid(),tenant_id uuid not null references tenants(id) on delete cascade,course_id uuid references courses(id) on delete cascade,domain varchar(40) not null,subject varchar(120),topic varchar(160),skill varchar(160),difficulty int default 3,kind varchar(20) default 'mcq',text text not null,options jsonb not null default '[]',correct_index int not null default 0,explanation text,created_by uuid references users(id) on delete set null,created_at timestamptz default now());
create index if not exists questions_tenant_domain on questions(tenant_id,domain);
create index if not exists questions_course on questions(course_id);
create table if not exists exams(id uuid primary key default gen_random_uuid(),tenant_id uuid not null references tenants(id) on delete cascade,course_id uuid references courses(id) on delete set null,title varchar(255) not null,kind varchar(20) default 'practice',duration_minutes int,sections jsonb,randomize boolean default true,created_by uuid references users(id) on delete set null,created_at timestamptz default now());
create table if not exists exam_questions(exam_id uuid references exams(id) on delete cascade,question_id uuid references questions(id) on delete cascade,position int,primary key(exam_id,question_id));
create table if not exists attempts(id uuid primary key default gen_random_uuid(),tenant_id uuid not null references tenants(id) on delete cascade,exam_id uuid references exams(id) on delete cascade,user_id uuid references users(id) on delete set null,answers jsonb,score numeric,total int,started_at timestamptz default now(),finished_at timestamptz);
create index if not exists attempts_exam on attempts(exam_id);


-- S1: student identity link (Scope S-1, DEC-062)
alter table students add column if not exists user_id uuid references users(id) on delete set null;
create unique index if not exists students_user_id_unique on students(user_id) where user_id is not null;

-- 4C: question import QA status (active | review | disabled) - figure-suspect imports land as review
alter table questions add column if not exists status varchar(20) not null default 'active';
create index if not exists questions_tenant_status on questions(tenant_id,status);

-- 5: assignments + submissions (Scope 5)
-- NOTE: legacy local-DB tables with an older shape (due_at/points/answer_text/grade) exist -
-- create-table-if-not-exists is SHAPE-BLIND, so these ALTERs unify the canonical shape (Lesson 117).
create table if not exists assignments(id uuid primary key default gen_random_uuid(),tenant_id uuid not null references tenants(id) on delete cascade,course_id uuid references courses(id) on delete cascade,group_id uuid references groups(id) on delete set null,title varchar(255) not null,description text,due_date date,max_score numeric(6,2) default 100,created_by uuid references users(id) on delete set null,created_at timestamptz default now());
create index if not exists assignments_tenant_course on assignments(tenant_id,course_id);
create table if not exists submissions(id uuid primary key default gen_random_uuid(),tenant_id uuid not null references tenants(id) on delete cascade,assignment_id uuid references assignments(id) on delete cascade,student_id uuid references students(id) on delete cascade,content text,submitted_at timestamptz default now(),score numeric(6,2),feedback text,graded_at timestamptz,graded_by uuid references users(id) on delete set null,unique(assignment_id,student_id));
create index if not exists submissions_assignment on submissions(assignment_id);
create index if not exists submissions_tenant_student on submissions(tenant_id,student_id);
alter table assignments add column if not exists description text;
alter table assignments add column if not exists due_date date;
alter table assignments add column if not exists max_score numeric(6,2) default 100;
alter table submissions add column if not exists content text;
alter table submissions add column if not exists score numeric(6,2);
create unique index if not exists submissions_assignment_student_uq on submissions(assignment_id,student_id);

-- 6: activation codes (Scope 6) - the centers' sales model: codes grant/extend course subscription
create table if not exists activation_codes(id uuid primary key default gen_random_uuid(),tenant_id uuid not null references tenants(id) on delete cascade,course_id uuid references courses(id) on delete cascade,code varchar(40) unique not null,duration_days int not null default 30,max_uses int not null default 1,used_count int not null default 0,active boolean default true,created_by uuid references users(id) on delete set null,created_at timestamptz default now());
create index if not exists activation_codes_tenant on activation_codes(tenant_id,active);
create table if not exists code_redemptions(id uuid primary key default gen_random_uuid(),tenant_id uuid not null references tenants(id) on delete cascade,code_id uuid references activation_codes(id) on delete cascade,student_id uuid references students(id) on delete cascade,redeemed_at timestamptz default now(),unique(code_id,student_id));
-- Lesson 117: legacy local activation_codes (code_hash/plan_code model, 0 rows) - shape-unifying ALTERs
alter table activation_codes add column if not exists course_id uuid references courses(id) on delete cascade;
alter table activation_codes add column if not exists code varchar(40);
alter table activation_codes add column if not exists duration_days int not null default 30;
create unique index if not exists activation_codes_code_uq on activation_codes(code);
do $$ begin
  if exists (select 1 from information_schema.columns where table_name='activation_codes' and column_name='code_prefix') then
    alter table activation_codes alter column code_prefix drop not null;
    alter table activation_codes alter column code_hash drop not null;
    alter table activation_codes alter column plan_code drop not null;
  end if;
end $$;

-- V1: platform-level sales leads from the public landing (marketing layer, no tenant scope)
create table if not exists leads(id uuid primary key default gen_random_uuid(),name varchar(160) not null,email varchar(255) not null,message text,created_at timestamptz default now());

-- V3: gamification points for students (attendance +5, exam pass +20, course completion +50 later)
alter table students add column if not exists points int not null default 0;


-- M2: Auth Hardening (daftr-re enterprise pattern: lockout, token_version, password_resets)
alter table users add column if not exists token_version int not null default 1;
alter table users add column if not exists failed_attempts int not null default 0;
alter table users add column if not exists locked_until timestamptz default null;

create table if not exists password_resets(
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  token_hash text not null,
  expires_at timestamptz not null,
  used_at timestamptz default null,
  created_at timestamptz default now()
);
create index if not exists idx_password_resets_user on password_resets(user_id);
create index if not exists idx_password_resets_hash on password_resets(token_hash);

-- M2: Curriculum hierarchy (modules & lessons)
create table if not exists modules(
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  course_id uuid not null references courses(id) on delete cascade,
  title varchar(200) not null,
  description text,
  sort_order int not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists idx_modules_course on modules(course_id);
create index if not exists idx_modules_tenant on modules(tenant_id);

create table if not exists lessons(
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  module_id uuid not null references modules(id) on delete cascade,
  course_id uuid not null references courses(id) on delete cascade,
  title varchar(200) not null,
  content text,
  video_url text,
  duration_minutes int default 0,
  sort_order int not null default 0,
  is_free_preview boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists idx_lessons_module on lessons(module_id);
create index if not exists idx_lessons_course on lessons(course_id);
create index if not exists idx_lessons_tenant on lessons(tenant_id);

-- M3: Reading passages (استيعاب المقروء) & Images/Figures (الأشكال الهندسية)
alter table questions add column if not exists passage text default null;
alter table questions add column if not exists image_url text default null;
create index if not exists idx_questions_passage on questions(tenant_id) where passage is not null;
create index if not exists idx_questions_image on questions(tenant_id) where image_url is not null;
