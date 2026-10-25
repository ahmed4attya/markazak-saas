-- m5_teacher_user_link_and_question_notes.sql
-- 1. Add user_id to teachers table if not exists
alter table teachers add column if not exists user_id uuid references users(id) on delete set null;
create index if not exists idx_teachers_user_id on teachers(user_id);

-- 2. Create question_notes table for teacher flags/revision requests to admin
create table if not exists question_notes (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  question_id uuid not null references questions(id) on delete cascade,
  teacher_user_id uuid not null references users(id) on delete cascade,
  teacher_name varchar(255) not null default '',
  note text not null,
  status varchar(32) not null default 'pending', -- pending, resolved, dismissed
  admin_reply text,
  resolved_by uuid references users(id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz default now()
);

create index if not exists idx_question_notes_tenant on question_notes(tenant_id);
create index if not exists idx_question_notes_question on question_notes(question_id);
create index if not exists idx_question_notes_status on question_notes(status);
