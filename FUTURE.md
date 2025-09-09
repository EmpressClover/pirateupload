Pirate Upload — Minimal Image Uploader (Vercel Blob)

Overview
- Minimal UI to upload an image file
- Safe backend using `@vercel/blob`; no secrets in the client
- Files are stored publicly in Vercel Blob and return a direct URL

Local Development
1) Install deps: `npm install`
2) Run dev server: `npm run dev`
3) Open http://localhost:3000

Vercel Deployment
1) Push this repo to Git
2) Import into Vercel
3) Ensure Blob is enabled (Vercel automatically provisions Blob for your project)
4) If needed, set `BLOB_READ_WRITE_TOKEN` (Vercel will inject for production). It is used only by server routes.

API
- POST `/api/upload` — multipart/form-data with `file`; stores uploaded image to Blob

Public Unsigned Usage (CORS-enabled)
- Endpoint: `POST https://<your-deployment>.vercel.app/api/upload`
- Method: `multipart/form-data` with field `file` (and optional `filename`).
- CORS: `Access-Control-Allow-Origin: *` (no credentials).

Examples
JavaScript (in any site):

```
async function uploadImage(file) {
  const form = new FormData();
  form.append('file', file);
  // optional filename if you want to override
  // form.append('filename', 'my-image.png');
  const res = await fetch('https://<your-deployment>.vercel.app/api/upload', {
    method: 'POST',
    body: form,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Upload failed');
  return data.url; // direct image URL in Vercel Blob
}
```

curl:

```
curl -X POST \
  -F "file=@./image.png" \
  https://<your-deployment>.vercel.app/api/upload
```

Notes
- Max image size: 5MB (adjust in route file if needed)
- Public endpoint; consider adding rate limiting or origin checks if abused

Admin
- Set environment variables in Vercel or `.env.local`:
  - `ADMIN_PASSWORD` — the password to access the admin area
  - `ADMIN_JWT_SECRET` — a long random string used to sign the admin session cookie
- Login: open `/admin/login`, enter the password, you’ll be redirected to `/admin`.
- Admin features: list blobs, paginate, and delete images.
- Security: The admin cookie is HttpOnly and signed (JWT). Admin APIs verify the cookie; the password never reaches the client bundle.
