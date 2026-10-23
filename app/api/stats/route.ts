import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
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
    return NextResponse.json(
      {
        students: num(row.students),
        questions: num(row.questions),
        exams: num(row.exams),
        centers: num(row.centers),
      },
      { headers: { "cache-control": "no-store" } }
    );
  } catch {
    return NextResponse.json({ error: "stats_unavailable" }, { status: 503 });
  }
}