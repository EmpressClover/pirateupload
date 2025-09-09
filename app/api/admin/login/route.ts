import { NextRequest, NextResponse } from 'next/server';
import { createAdminSession, isPasswordValid } from 'lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json();
    if (!isPasswordValid(password)) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
    }
    const token = await createAdminSession();
    const res = NextResponse.json({ ok: true });
    res.cookies.set('admin_session', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 8,
    });
    return res;
  } catch (e) {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  }
}
