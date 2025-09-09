import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminSession } from 'lib/auth';

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

    const host = process.env.BUNNY_STORAGE_HOST || 'storage.bunnycdn.com';
    const zone = process.env.BUNNY_STORAGE_ZONE;
    const key = process.env.BUNNY_ACCESS_KEY;
    const cdnBase = (process.env.BUNNY_CDN_BASE_URL || '').replace(/\/$/, '');

    if (!zone || !key || !cdnBase) {
      return NextResponse.json({ error: 'Storage not configured' }, { status: 500 });
    }

    let path = '';
    try {
      const u = new URL(url);
      const base = new URL(cdnBase);
      if (u.host === base.host) {
        path = u.pathname.replace(/^\//, '');
      }
    } catch {
      // If it's already a path
      path = url.replace(/^\//, '');
    }
    if (!path) {
      return NextResponse.json({ error: 'Could not derive storage path from URL' }, { status: 400 });
    }

    const delUrl = `https://${host}/${encodeURIComponent(zone)}/${path}`;
    const resp = await fetch(delUrl, { method: 'DELETE', headers: { 'AccessKey': key } });
    if (!resp.ok) {
      const text = await resp.text().catch(() => '');
      return NextResponse.json({ error: `Delete failed (${resp.status}) ${text}` }, { status: 502 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  }
}
