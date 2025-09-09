import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminSession } from 'lib/auth';

export async function GET(req: NextRequest) {
  const cookie = req.cookies.get('admin_session')?.value;
  const payload = await verifyAdminSession(cookie);
  if (!payload) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const prefix = searchParams.get('prefix') || 'uploads/';

  const host = process.env.BUNNY_STORAGE_HOST || 'storage.bunnycdn.com';
  const zone = process.env.BUNNY_STORAGE_ZONE;
  const key = process.env.BUNNY_ACCESS_KEY;
  const cdnBase = (process.env.BUNNY_CDN_BASE_URL || '').replace(/\/$/, '');

  if (!zone || !key || !cdnBase) {
    return NextResponse.json({ error: 'Storage not configured' }, { status: 500 });
  }

  const listUrl = `https://${host}/${encodeURIComponent(zone)}/${prefix}`;
  const resp = await fetch(listUrl, { headers: { 'AccessKey': key } });
  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    return NextResponse.json({ error: `List failed (${resp.status}) ${text}` }, { status: 502 });
  }
  const data: any = await resp.json().catch(() => ([]));
  const items: any[] = Array.isArray(data) ? data : (data?.Items || data?.objects || []);

  const blobs = items
    .filter((it: any) => !it.IsDirectory)
    .map((it: any) => {
      const name = it.ObjectName || it.Name || it.Path || '';
      const size = it.Length ?? it.Size ?? 0;
      const changed = it.LastChanged || it.Modified || new Date().toISOString();
      const fullPath = it.Path && typeof it.Path === 'string' && it.Path.startsWith(prefix)
        ? it.Path
        : `${prefix}${name}`;
      return {
        pathname: fullPath,
        url: `${cdnBase}/${fullPath}`,
        size,
        uploadedAt: changed,
      };
    });

  return NextResponse.json({ blobs, cursor: null });
}

