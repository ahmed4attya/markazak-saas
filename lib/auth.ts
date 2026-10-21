import { SignJWT } from "jose";
import { getSession, Session } from "./session";

const secret = new TextEncoder().encode(process.env.AUTH_SECRET || "dev-only-insecure-secret-change-me-before-prod");

export async function signSession(s: Session) {
  return new SignJWT(s).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("7d").sign(secret);
}

export function isAdmin(role: string) {
  return ["owner", "manager", "admin"].includes(role);
}

export { getSession };
