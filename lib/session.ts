import { cookies } from "next/headers";
import { jwtVerify } from "jose";

const secret = new TextEncoder().encode(process.env.AUTH_SECRET || "dev-only-insecure-secret-change-me-before-prod");

export type Session = { userId: string; tenantId: string; role: string; name: string; email: string };

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
