import { cookies } from "next/headers";
import { jwtVerify } from "jose";

function resolveAuthSecret(){const s=process.env.AUTH_SECRET;if(s&&s.length>=32)return s;if(process.env.NODE_ENV==='production')throw new Error('AUTH_SECRET missing or under 32 chars');return s||'dev-only-insecure-secret-change-me-before-prod'}
const secret=new TextEncoder().encode(resolveAuthSecret())

export type Session = { userId: string; tenantId: string; role: string; name: string; email: string; ver?: number };

export async function getSession(): Promise<Session | null> {
  const c = await cookies();
  const token = c.get("session")?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as Session;
  } catch {
    return null;
  }
}
