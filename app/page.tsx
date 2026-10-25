import { query } from "@/lib/db";
import LandingClient from "@/components/LandingClient";

export const dynamic = "force-dynamic";

async function getStats(): Promise<Record<string, number> | null> {
  try {
    const r = await query(
      `select
         (select count(*) from students) as students,
         (select count(*) from questions) as questions,
         (select count(*) from exams) as exams,
         (select count(distinct tenant_id) from users) as centers`
    );
    const rows: any[] = (r as any).rows || [];
    const row = rows[0] || {};
    const num = (v: unknown) => (typeof v === "string" ? parseInt(v, 10) || 0 : Number(v) || 0);
    return { students: num(row.students), questions: num(row.questions), exams: num(row.exams), centers: num(row.centers) };
  } catch {
    return null;
  }
}

export default async function Page() {
  const stats = await getStats();
  return <LandingClient stats={stats} />;
}