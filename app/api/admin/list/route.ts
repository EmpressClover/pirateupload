import { NextRequest, NextResponse } from 'next/server';
import { list } from '@vercel/blob';
import { verifyAdminSession } from 'lib/auth';

export async function GET(req: NextRequest) {
  const cookie = req.cookies.get('admin_session')?.value;
  const payload = await verifyAdminSession(cookie);
  if (!payload) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const cursor = searchParams.get('cursor') || undefined;
  const prefix = searchParams.get('prefix') || undefined;
  const limit = Math.min(Number(searchParams.get('limit') || '50'), 200);

  const { blobs, cursor: nextCursor } = await list({ prefix, cursor, limit });
  return NextResponse.json({
    blobs: blobs.map((b) => ({
      pathname: b.pathname,
      url: b.url,
      size: b.size,
      uploadedAt: b.uploadedAt,
    })),
    cursor: nextCursor ?? null,
  });
}
