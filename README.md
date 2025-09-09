Pirate Upload — Minimal Image Uploader (Bunny.net Storage)

Overview
- Minimal UI to upload an image file
- Safe backend writes to Bunny.net Storage; no secrets in the client
- Files are served via your Bunny Pull Zone and return a direct CDN URL

Local Development
1) Install deps: `npm install`
2) Create `.env.local` and set admin + Bunny vars (see below)
3) Start dev: `npm run dev`
4) Open http://localhost:3000

API
- POST `/api/upload` — multipart/form-data with `file` (optional `filename`); stores the image to Bunny Storage under `uploads/` and returns the CDN URL.

Public Unsigned Usage (CORS-enabled)
- Endpoint: `POST https://<your-domain>/api/upload`
- Method: `multipart/form-data` with field `file` (and optional `filename`).
- CORS: `Access-Control-Allow-Origin: *` (no credentials).
 - Optional anonymous API key: if you set `PUBLIC_UPLOAD_KEYS`, include one via header `x-api-key: <key>` or query `?api_key=<key>`.

JavaScript example
```
async function uploadImage(file) {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch('https://<your-domain>/api/upload?api_key=<public-key>', { method: 'POST', body: form });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Upload failed');
  return data.url; // direct CDN URL from Bunny
}
```

curl
```
curl -X POST \
  -F "file=@./image.png" \
  "https://<your-domain>/api/upload?api_key=<public-key>"
```

Notes
- Max image size: 5MB (adjust in `app/api/upload/route.ts`)
- Public endpoint; consider adding rate limiting or origin checks if abused

Bunny Setup
- Create a Storage Zone and a Pull Zone (origin = Storage Zone)
- Set environment variables (Vercel → Settings → Environment Variables):
  - `BUNNY_STORAGE_ZONE` (e.g., `piratearena`)
  - `BUNNY_STORAGE_HOST` (e.g., `la.storage.bunnycdn.com`)
  - `BUNNY_ACCESS_KEY` (Storage Zone “FTP & API Password” — keep secret)
  - `BUNNY_CDN_BASE_URL` (e.g., `https://piratepull.b-cdn.net`)
- Redeploy with a new build after adding env vars.

About “Public API keys”
- You do NOT expose any Bunny keys in the browser. The public upload flow calls your server endpoint `/api/upload`, which is CORS‑enabled and uses your Bunny credentials server‑side.
- Bunny’s Storage API does not support client‑side presigned uploads; keep uploads going through your server.
- Optional: You can configure `PUBLIC_UPLOAD_KEYS` (comma-separated) in env to require an anonymous “API key” like Imgur’s Client-ID. This is safe to embed in client code and helps you identify callers and gate usage. Consider adding rate limiting.
- For downloading, you can expose CDN URLs (optionally with Bunny’s token authentication), but never the Storage Access Key.

Admin
- Set environment variables in Vercel or `.env.local`:
  - `ADMIN_PASSWORD` — the password to access the admin area
  - `ADMIN_JWT_SECRET` — a long random string used to sign the admin session cookie
- Login: open `/admin/login`, enter the password, you’ll be redirected to `/admin`.
- Admin features: list images from Bunny Storage (under `uploads/`) and delete.
- Security: The admin cookie is HttpOnly and signed (JWT). Admin APIs verify the cookie; the password never reaches the client bundle.
