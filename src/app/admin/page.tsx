'use client';
import { useEffect, useState, useCallback } from 'react';

type Flag = {
  id: string; roomId: string; reporterClerkId: string; reporterRole: string;
  reportedClerkId: string; reportedName: string; reason: string; details: string;
  status: string; createdAt: string; resolvedAt: string | null;
};

export default function AdminPage() {
  const [flags, setFlags] = useState<Flag[]>([]);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);

  const fetchFlags = useCallback(async () => {
    const r = await fetch('/api/admin/flags');
    if (r.status === 403) { setForbidden(true); setLoading(false); return; }
    if (r.ok) setFlags(await r.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchFlags();
    const t = setInterval(fetchFlags, 8000);
    return () => clearInterval(t);
  }, [fetchFlags]);

  async function resolve(id: string, action: 'dismiss' | 'action') {
    await fetch(`/api/admin/flags/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action }),
    });
    fetchFlags();
  }

  if (loading) return <div style={{ background: '#0D1117', minHeight: '100vh', color: '#8B949E', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>loading...</div>;
  if (forbidden) return <div style={{ background: '#0D1117', minHeight: '100vh', color: '#F87171', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>forbidden</div>;

  const open = flags.filter(f => f.status === 'open');
  const resolved = flags.filter(f => f.status !== 'open');

  return (
    <div style={{ background: '#0D1117', minHeight: '100vh', color: '#E6EDF3', fontFamily: "'Space Grotesk', sans-serif", padding: '60px 20px' }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: 30 }}>Admin — Flags</h1>

        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12, color: '#FBBF24' }}>Open ({open.length})</h2>
        {open.length === 0 ? <p style={{ color: '#8B949E', fontSize: 14, marginBottom: 30 }}>no open flags</p> : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 30 }}>
            {open.map(f => (
              <div key={f.id} style={{ background: '#161B22', border: '1px solid rgba(251,191,36,0.3)', borderRadius: 12, padding: 18 }}>
                <div style={{ fontSize: 12, color: '#8B949E', marginBottom: 6 }}>{new Date(f.createdAt).toLocaleString()} · room {f.roomId.slice(0, 8)}</div>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>{f.reportedName} <span style={{ color: '#8B949E', fontWeight: 400 }}>reported by {f.reporterRole}</span></div>
                <div style={{ fontSize: 13, color: '#FBBF24', marginBottom: 6 }}>{f.reason}</div>
                <div style={{ fontSize: 14, marginBottom: 12 }}>{f.details}</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => resolve(f.id, 'action')} style={{ background: 'rgba(220,38,38,0.15)', border: '1px solid rgba(220,38,38,0.3)', color: '#F87171', padding: '7px 14px', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>take action</button>
                  <button onClick={() => resolve(f.id, 'dismiss')} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#8B949E', padding: '7px 14px', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>dismiss</button>
                </div>
              </div>
            ))}
          </div>
        )}

        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12, color: '#8B949E' }}>Resolved ({resolved.length})</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {resolved.map(f => (
            <div key={f.id} style={{ background: '#161B22', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: 14, opacity: 0.6 }}>
              <div style={{ fontSize: 12, color: '#8B949E' }}>{f.reportedName} · {f.reason} · {f.status}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}