import { Pool, PoolClient, QueryResultRow } from 'pg'
const globalForPg = globalThis as unknown as { pool?: Pool }
const isProd = process.env.NODE_ENV === 'production'

function getEffectiveDatabaseUrl(): string | undefined {
  let url = process.env.DATABASE_URL
  if (!url) return undefined
  // Auto-switch to Neon connection pooler if direct endpoint is provided
  if (url.includes('.neon.tech') && !url.includes('-pooler')) {
    url = url.replace(/([^@]+@ep-[a-z0-9-]+)(\.[\w-]+\.aws\.neon\.tech)/, '$1-pooler$2')
    if (!url.includes('pgbouncer=true')) {
      url += (url.includes('?') ? '&' : '?') + 'pgbouncer=true'
    }
  }
  return url
}

export const pool = globalForPg.pool ?? new Pool({
  connectionString: getEffectiveDatabaseUrl(),
  max: isProd ? 5 : 10,
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 10000,
  ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : undefined
})

// Always cache pool in globalThis to preserve connections across warm serverless lambdas
globalForPg.pool = pool

export async function query<T extends QueryResultRow = QueryResultRow>(text:string, values:any[]=[]){ return pool.query<T>(text, values) }
export async function withTx<T>(fn:(c:PoolClient)=>Promise<T>){ const c=await pool.connect(); try{await c.query('BEGIN');const r=await fn(c);await c.query('COMMIT');return r}catch(e){await c.query('ROLLBACK');throw e}finally{c.release()} }
export function safeError(e:any, fallback='حدث خطأ غير متوقع، حاول مرة أخرى'){console.error(e);if(e?.issues&&Array.isArray(e.issues)&&e.issues[0]){const first=e.issues[0];const field=Array.isArray(first.path)&&first.path.length?first.path.join('.'):'';return field?`${field}: ${first.message}`:first.message}const code=e?.code;if(code==='23505')return 'هذه البيانات مسجلة من قبل';if(code==='23503')return 'عملية غير صالحة: العنصر المرتبط غير موجود';if(code==='23514'||code==='22P02')return 'قيمة غير صالحة';return fallback}
