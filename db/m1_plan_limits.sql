-- M1: plan_limits - enforceable per-plan quotas (PURE ADDITIVE; values tuned via UPDATE later).
-- plans(code) is unique+not-null, so it is a valid FK target.
begin;
create table if not exists plan_limits(
  plan_code varchar(40) primary key references plans(code) on delete cascade,
  max_students int not null default 150,
  max_teachers int not null default 15,
  max_courses int not null default 30,
  max_storage_mb bigint not null default 2048,
  api_rate_per_min int not null default 120,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
insert into plan_limits(plan_code) select code from plans on conflict (plan_code) do nothing;
commit;
