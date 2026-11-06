import { getSession } from "@/lib/session";
import { PAGE_ACCESS, API_ACCESS } from "@/config/access";

export type GuardResult = {
  allowed: boolean;
  status: number;
  redirect?: string;
  error?: string;
};

export async function guard(path: string, role: string | undefined, tenantId: string | undefined): Promise<GuardResult> {
  if (!role || !tenantId) {
    return { allowed: false, status: 401, redirect: "/login", error: "unauthorized" };
  }

  // 1. Pages Check (Redirect 307 to /login or 404)
  const pageRoute = PAGE_ACCESS.find(p => path === p.path || (p.path.includes("[id]") && path.startsWith(p.path.split("[id]")[0])));
  if (pageRoute) {
    if (pageRoute.public) return { allowed: true, status: 200 };
    if (!pageRoute.roles.includes(role as any)) return { allowed: false, status: 404 }; // Hide existence
    return { allowed: true, status: 200 };
  }

  // 2. API Check (401 -> 403)
  const apiRoute = API_ACCESS.find(a => path === a.path || (a.path.includes("[id]") && path.startsWith(a.path.split("[id]")[0])));
  if (apiRoute) {
    if (apiRoute.public) return { allowed: true, status: 200 };
    if (!apiRoute.roles.includes(role as any)) return { allowed: false, status: 403, error: "forbidden" };
    return { allowed: true, status: 200 };
  }

  // Default Deny for protected prefixes
  const protectedPrefixes = ["/dashboard", "/students", "/teachers", "/courses", "/groups", "/attendance", "/finance", "/certificates", "/reports", "/ai", "/users", "/plans", "/activation-codes", "/settings", "/questions", "/exams", "/lessons", "/portal", "/api"];
  if (protectedPrefixes.some(prefix => path.startsWith(prefix))) {
    return { allowed: false, status: 403, error: "forbidden" };
  }

  return { allowed: true, status: 200 };
}


