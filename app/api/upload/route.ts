import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';

const CORS_HEADERS = new Headers({
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400',
});

function corsJson(body: any, init?: ResponseInit) {
  const res = NextResponse.json(body, init);
  CORS_HEADERS.forEach((v, k) => res.headers.set(k, v));
  return res;
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';
    if (!contentType.includes('multipart/form-data')) {
      return corsJson({ error: 'Expected multipart/form-data' }, { status: 400 });
    }

    const form = await req.formData();
    const file = form.get('file');
    const filename = (form.get('filename') as string) || undefined;

    if (!(file instanceof File)) {
      return corsJson({ error: 'Missing file field' }, { status: 400 });
    }

    if (file.size > 5 * 1024 * 1024) {
      return corsJson({ error: 'File too large (max 5MB)' }, { status: 413 });
    }

    if (file.type && !file.type.startsWith('image/')) {
      return corsJson({ error: 'Only image uploads are allowed' }, { status: 415 });
    }

    const safeName = filename || `avatar_${Date.now()}.${(file.type.split('/')?.[1] || 'bin').slice(0, 8)}`;

    const blob = await put(safeName, file, {
      access: 'public',
      contentType: file.type || 'application/octet-stream',
    });

    return corsJson({ url: blob.url, pathname: blob.pathname });
  } catch (err: any) {
    console.error('Upload error', err);
    return corsJson({ error: 'Upload failed' }, { status: 500 });
  }
}
