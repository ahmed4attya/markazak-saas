import { query } from './db';
import { assertSubscriptionActive } from './subscription';

export type QuotaResource = 'students' | 'teachers' | 'courses' | 'storage_mb';

export class QuotaExceededError extends Error {
  code: string;
  resource: QuotaResource;
  limit: number;
  current: number;

  constructor(resource: QuotaResource, limit: number, current: number, message: string) {
    super(message);
    this.name = 'QuotaExceededError';
    this.code = 'QUOTA_EXCEEDED';
    this.resource = resource;
    this.limit = limit;
    this.current = current;
  }
}

export async function assertPlanQuota(
  tenantId: string,
  resource: QuotaResource,
  increment: number = 1
): Promise<{ allowed: boolean; limit: number; current: number }> {
  await assertSubscriptionActive(tenantId);
  const r = await query<{
    plan: string;
    max_students: number;
    max_teachers: number;
    max_courses: number;
    max_storage_mb: number;
  }>(
    `select t.plan,
            coalesce(pl.max_students, 150) as max_students,
            coalesce(pl.max_teachers, 15) as max_teachers,
            coalesce(pl.max_courses, 30) as max_courses,
            coalesce(pl.max_storage_mb, 2048) as max_storage_mb
     from tenants t
     left join plan_limits pl on pl.plan_code = t.plan
     where t.id = $1`,
    [tenantId]
  );

  const row = r.rows[0];
  const maxStudents = row?.max_students ?? 150;
  const maxTeachers = row?.max_teachers ?? 15;
  const maxCourses = row?.max_courses ?? 30;
  const maxStorageMb = row?.max_storage_mb ?? 2048;

  let currentCount = 0;
  let limit = 0;
  let labelAr = '';

  if (resource === 'students') {
    limit = maxStudents;
    labelAr = 'الطلاب';
    const c = await query<{ count: string }>('select count(*)::text as count from students where tenant_id = $1', [
      tenantId,
    ]);
    currentCount = parseInt(c.rows[0]?.count || '0', 10);
  } else if (resource === 'teachers') {
    limit = maxTeachers;
    labelAr = 'المعلمين';
    const c = await query<{ count: string }>('select count(*)::text as count from teachers where tenant_id = $1', [
      tenantId,
    ]);
    currentCount = parseInt(c.rows[0]?.count || '0', 10);
  } else if (resource === 'courses') {
    limit = maxCourses;
    labelAr = 'الدورات';
    const c = await query<{ count: string }>('select count(*)::text as count from courses where tenant_id = $1', [
      tenantId,
    ]);
    currentCount = parseInt(c.rows[0]?.count || '0', 10);
  } else if (resource === 'storage_mb') {
    limit = maxStorageMb;
    labelAr = 'سعة التخزين (ميجابايت)';
    const c = await query<{ bytes: string }>(
      `select (coalesce((select sum(size_bytes) from files where tenant_id = $1), 0) +
               coalesce((select sum(size_bytes) from videos where tenant_id = $1), 0))::text as bytes`,
      [tenantId]
    );
    const bytes = parseInt(c.rows[0]?.bytes || '0', 10);
    currentCount = Math.ceil(bytes / (1024 * 1024));
  }

  if (currentCount + increment > limit) {
    throw new QuotaExceededError(
      resource,
      limit,
      currentCount,
      `لقد وصلت للحد الأقصى لعدد ${labelAr} المسموح به في باقتك الحالية (${limit}). يرجى ترقية الباقة لإضافة المزيد.`
    );
  }

  return { allowed: true, limit, current: currentCount };
}
