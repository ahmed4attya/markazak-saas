-- m6_performance_indexes.sql
-- High performance index additions for multi-tenant queries and real-time dashboard aggregation

create index if not exists idx_enrollments_tenant_group on enrollments(tenant_id, group_id);
create index if not exists idx_enrollments_student on enrollments(student_id);
create index if not exists idx_attendance_tenant_group on attendance(tenant_id, group_id);
create index if not exists idx_attendance_student on attendance(student_id);
create index if not exists idx_courses_tenant_status on courses(tenant_id, status);
create index if not exists idx_groups_tenant_status on groups(tenant_id, status);
create index if not exists idx_groups_teacher on groups(teacher_id);
create index if not exists idx_students_tenant_status on students(tenant_id, status);
create index if not exists idx_teachers_tenant_status on teachers(tenant_id, status);
create index if not exists idx_invoices_student on invoices(student_id);
create index if not exists idx_payments_tenant_invoice on payments(tenant_id, invoice_id);
