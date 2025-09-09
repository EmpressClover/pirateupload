"use client";
import React from 'react';

type BlobItem = {
  pathname: string;
  url: string;
  size: number;
  uploadedAt: string;
  contentType?: string | null;
};

export default function AdminPage() {
  const [items, setItems] = React.useState<BlobItem[]>([]);
  const [cursor, setCursor] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const load = async (next?: string | null) => {
    setLoading(true);
    setError(null);
    try {
      const url = new URL('/api/admin/list', window.location.origin);
      if (next) url.searchParams.set('cursor', next);
      url.searchParams.set('limit', '50');
      const res = await fetch(url.toString(), { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load');
      setItems((prev) => (next ? [...prev, ...data.blobs] : data.blobs));
      setCursor(data.cursor);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => { load(null); }, []);

  const onDelete = async (url: string) => {
    if (!confirm('Delete this image?')) return;
    try {
      const res = await fetch('/api/admin/delete', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Delete failed');
      setItems((prev) => prev.filter((i) => i.url !== url));
    } catch (e: any) {
      alert(e.message);
    }
  };

  const logout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    window.location.href = '/admin/login';
  };

  return (
    <div className="container">
      <div className="title">Admin — Images</div>
      <div className="card">
        {error && <div className="muted" style={{ color: '#ff6b6b' }}>{error}</div>}
        <div className="muted" style={{ marginBottom: 8 }}>Total loaded: {items.length}</div>
        <div style={{ display: 'grid', gap: 8 }}>
          {items.map((b) => (
            <div key={b.url} style={{ display: 'grid', gridTemplateColumns: '120px 1fr auto', gap: 12, alignItems: 'center' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={b.url} alt={b.pathname} style={{ width: 120, height: 80, objectFit: 'cover', borderRadius: 6, border: '1px solid #1e2a36' }} />
              <div style={{ minWidth: 0 }}>
                <div className="mono" style={{ wordBreak: 'break-all' }}>{b.url}</div>
                <div className="muted" style={{ fontSize: 12 }}>{b.contentType || 'unknown'} • {(b.size/1024).toFixed(1)} KB • {new Date(b.uploadedAt).toLocaleString()}</div>
              </div>
              <button className="btn" onClick={() => onDelete(b.url)}>Delete</button>
            </div>
          ))}
        </div>
        <div className="inline" style={{ marginTop: 12, justifyContent: 'space-between' }}>
          <button className="btn" onClick={() => load(cursor)} disabled={!cursor || loading}>
            {loading ? 'Loading…' : cursor ? 'Load more' : 'No more'}
          </button>
          <button className="btn" onClick={logout}>Logout</button>
        </div>
      </div>
    </div>
  );
}

