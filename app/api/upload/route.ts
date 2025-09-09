import { NextRequest, NextResponse } from 'next/server';

const CORS_HEADERS = new Headers({
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Api-Key',
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
    // Optional anonymous API key check (Imgur-style). If PUBLIC_UPLOAD_KEYS is set,
    // require clients to send one of those keys via `x-api-key` header or `api_key` query.
    const keysEnv = (process.env.PUBLIC_UPLOAD_KEYS || '').trim();
    if (keysEnv) {
      const allowed = keysEnv
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      const url = new URL(req.url);
      const provided = req.headers.get('x-api-key') || url.searchParams.get('api_key');
      if (!provided || !allowed.includes(provided)) {
        return corsJson({ error: 'Invalid or missing API key' }, { status: 401 });
      }
    }

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

    const extFromType = (file.type.split('/')?.[1] || '').split(';')[0];
    const safeName = filename || `image_${Date.now()}.${extFromType || 'bin'}`;
    const path = `uploads/${safeName}`;

    const host = process.env.BUNNY_STORAGE_HOST || 'storage.bunnycdn.com';
    const zone = process.env.BUNNY_STORAGE_ZONE;
    const key = process.env.BUNNY_ACCESS_KEY;
    const cdnBase = (process.env.BUNNY_CDN_BASE_URL || '').replace(/\/$/, '');

    if (!zone || !key || !cdnBase) {
      return corsJson({ error: 'Storage not configured' }, { status: 500 });
    }

    const putUrl = `https://${host}/${encodeURIComponent(zone)}/${path}`;
    const putRes = await fetch(putUrl, {
      method: 'PUT',
      headers: {
        'AccessKey': key,
        'Content-Type': file.type || 'application/octet-stream',
      },
      body: file,
    });

    if (!putRes.ok) {
      const text = await putRes.text().catch(() => '');
      return corsJson({ error: `Upload failed (${putRes.status}) ${text}` }, { status: 502 });
    }

    const publicUrl = `${cdnBase}/${path}`;
    return corsJson({ url: publicUrl, pathname: path });
  } catch (err: any) {
    console.error('Upload error', err);
    return corsJson({ error: 'Upload failed' }, { status: 500 });
  }
}
