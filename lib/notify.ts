// lib/notify.ts - best-effort in-app notifications (never breaks the action).
import { query } from './db';

export async function notifyUsers(tenantId: string, userIds: string[], title: string, body: string, type = 'info'): Promise<void> {
  const ids = [...new Set(userIds)].filter(Boolean).slice(0, 100);
  if (!ids.length) return;
  try {
    for (const uid of ids) {
      await query(
        'insert into notifications(tenant_id,user_id,title,body,type) values($1,$2,$3,$4,$5)',
        [tenantId, uid, title.slice(0, 200), body, type]
      );
    }
  } catch {
    // notifications are best-effort - the triggering action must never fail
  }
}

export async function notifyCourseStudents(tenantId: string, courseId: string, title: string, body: string, type = 'info'): Promise<void> {
  try {
    const r = await query(
      `select distinct st.user_id from students st
       join enrollments e on e.student_id = st.id and e.status = 'active'
       join groups g on g.id = e.group_id
       where g.course_id = $1 and e.tenant_id = $2 and st.user_id is not null limit 100`,
      [courseId, tenantId]
    );
    await notifyUsers(tenantId, r.rows.map((x: any) => String(x.user_id)), title, body, type);
  } catch {
    // best-effort
  }
}
