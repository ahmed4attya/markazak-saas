import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { isAdminRole } from '@/lib/roles';
import { parseQuestionCsv } from '@/lib/question-import';

export async function POST(req: Request) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!isAdminRole(s.role) && s.role !== 'teacher') return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  try {
    const body = await req.json();
    const csv = typeof body.csv === 'string' ? body.csv : '';
    if (!csv.trim()) return NextResponse.json({ error: 'ملف CSV مطلوب' }, { status: 400 });
    const rows = parseQuestionCsv(csv);
    return NextResponse.json({ mode: 'DRY_RUN', total: rows.length, ready: rows.filter((row) => row.status === 'READY').length, disabled: rows.filter((row) => row.status === 'DISABLED').length, rows });
  } catch { return NextResponse.json({ error: 'تعذر فحص ملف الأسئلة' }, { status: 400 }); }
}
