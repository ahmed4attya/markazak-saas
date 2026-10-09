import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

export async function GET() {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  return NextResponse.json({ name: s.name, email: s.email, userId: s.userId });
}