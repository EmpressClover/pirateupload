import { NextRequest, NextResponse } from 'next/server';
import { del } from '@vercel/blob';
import { verifyAdminSession } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const cookie = req.cookies.get('admin_session')?.value;
  const payload = await verifyAdminSession(cookie);
  if (!payload) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { url } = await req.json();
    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'Missing url' }, { status: 400 });
    }
    await del(url);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  }
}

