import { query } from './db';

export async function logAudit(params: {
  tenantId: string;
  userId: string;
  action: string;
  entity?: string;
  entityId?: string | null;
  metadata?: Record<string, any>;
}) {
  try {
    await query(
      `insert into audit_logs (tenant_id, user_id, action, entity, entity_id, metadata)
       values ($1, $2, $3, $4, $5, $6)`,
      [
        params.tenantId,
        params.userId,
        params.action,
        params.entity || null,
        params.entityId || null,
        params.metadata ? JSON.stringify(params.metadata) : null,
      ]
    );
  } catch (e) {
    // Audit logging is best-effort — it must never break the action it's logging.
    console.error('audit log write failed', e);
  }
}
