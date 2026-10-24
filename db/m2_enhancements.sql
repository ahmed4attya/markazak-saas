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
