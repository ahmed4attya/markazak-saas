import { SignJWT } from "jose";
import { getSession, Session } from "./session";

function resolveAuthSecret(){const s=process.env.AUTH_SECRET;if(s&&s.length>=32)return s;if(process.env.NODE_ENV==='production')throw new Error('AUTH_SECRET missing or under 32 chars');return s||'dev-only-insecure-secret-change-me-before-prod'}
const secret=new TextEncoder().encode(resolveAuthSecret())

export async function signSession(s: Session) {
  return new SignJWT(s).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("7d").sign(secret);
}

export function isAdmin(role: string) {
  return ["owner", "manager", "admin"].includes(role);
}

export { getSession };
