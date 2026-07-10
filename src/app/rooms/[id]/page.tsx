'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { useRoles } from '@/hooks/useRoles';
import { ConsentGate } from '@/components/ConsentGate';

type Room = { id: string; title: string; roomUrl: string; status: string; firstName: string; lastName: string; role: string; company: string; mentorClerkId: string };
type QueueEntry = { id: string; seekerClerkId: string; seekerName: string; status: string; visitCount?: number; flagCount?: number };

export default function RoomPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useUser();
  const { isMentor, loaded: rolesLoaded } = useRoles();
  const [room, setRoom] = useState<Room | null>(null);
  const [waiting, setWaiting] = useState<QueueEntry[]>([]);
  const [active, setActive] = useState<QueueEntry | null>(null);
  const [myEntry, setMyEntry] = useState<QueueEntry | null>(null);
  const [joining, setJoining] = useState(false);
  const [calling, setCalling] = useState<string | null>(null);
  const [flagOpen, setFlagOpen] = useState(false);
  const [flagTarget, setFlagTarget] = useState<{ id: string; name: string } | null>(null);
  const [flagReason, setFlagReason] = useState('');
  const [flagDetails, setFlagDetails] = useState('');
  const [flagSubmitting, setFlagSubmitting] = useState(false);
  const [consented, setConsented] = useState(false);
  const popupRef = useRef<Window | null>(null);

  const fetchRoom = useCallback(async () => {
    const r = await fetch(`/api/rooms/${id}`);
    if (r.ok) setRoom(await r.json());
  }, [id]);

  const fetchQueue = useCallback(async () => {
    const r = await fetch(`/api/rooms/${id}/queue`);
    if (!r.ok) return;
    const data = await r.json();
    setWaiting(data.waiting);
    setActive(data.active);
    if (user) {
      const mine = [...data.waiting, ...(data.active ? [data.active] : [])].find((e: QueueEntry) => e.seekerClerkId === user.id);
      setMyEntry(mine || null);
    }
  }, [id, user]);

  useEffect(() => { fetchRoom(); }, [fetchRoom]);

  useEffect(() => {
    fetchQueue();
    const t = setInterval(fetchQueue, 4000);
    return () => clearInterval(t);
  }, [fetchQueue]);

  useEffect(() => {
  if (myEntry?.status === 'active' && room?.roomUrl && !popupRef.current) {
    popupRef.current = window.open(room.roomUrl, '_blank', 'noopener,noreferrer');
  }
  if (myEntry?.status === 'done' && popupRef.current) {
    popupRef.current.close();
    popupRef.current = null;
  }
}, [myEntry, room]);

  async function joinQueue() {
    if (!user) return;
    setJoining(true);
    const seekerName = user.firstName || user.fullName || 'Someone';
    const res = await fetch(`/api/rooms/${id}/queue`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ seekerName }),
    });
    if (res.ok) setMyEntry(await res.json());
    setJoining(false);
  }

  async function leaveQueue() {
    await fetch(`/api/rooms/${id}/queue`, { method: 'DELETE' });
    setMyEntry(null);
  }

  async function callNext(entryId: string) {
    setCalling(entryId);
    const res = await fetch(`/api/rooms/${id}/queue/${entryId}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'call' }),
    });
    if (res.ok) fetchQueue();
    setCalling(null);
  }

  async function markDone(entryId: string) {
    await fetch(`/api/rooms/${id}/queue/${entryId}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'done' }),
    });
    fetchQueue();
  }

  async function submitFlag() {
  if (!flagTarget || !flagReason || !flagDetails) return;
  setFlagSubmitting(true);
  await fetch(`/api/rooms/${id}/flag`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reportedClerkId: flagTarget.id, reportedName: flagTarget.name, reason: flagReason, details: flagDetails }),
  });
  setFlagSubmitting(false);
  setFlagOpen(false);
  setFlagReason('');
  setFlagDetails('');
  fetchQueue();
}

  const myPosition = myEntry?.status === 'waiting' ? waiting.findIndex(w => w.id === myEntry.id) + 1 : 0;

  if (!room || !rolesLoaded) return (
    <div style={{ background: '#0D1117', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8B949E' }}>loading room...</div>
  );

  if (!consented) {
    return (
      <ConsentGate
        onAccept={() => { setConsented(true); fetch('/api/consent', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ roomId: id, context: 'call' }) }); }}
        onDecline={() => { if (myEntry) leaveQueue(); window.location.href = isMentor ? '/dashboard' : '/seekers'; }}
      />
    );
  }

  return (
    <div style={{ background: '#0D1117', minHeight: '100vh', color: '#E6EDF3', fontFamily: "'Space Grotesk', sans-serif", padding: '80px 20px' }}>
      <div style={{ maxWidth: 560, margin: '0 auto' }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 4 }}>{room.title}</h1>
        <p style={{ color: '#8B949E', fontSize: 14, marginBottom: 32 }}>{room.firstName} {room.lastName} · {room.role} @ {room.company}</p>

        {isMentor ? (
          <>
          <a href={room.roomUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', background: '#0A66C2', color: 'white', padding: '12px 24px', borderRadius: 12, textDecoration: 'none', fontWeight: 600, fontSize: 14, marginBottom: 28 }}>start call →</a>

            {active && (
              <div style={{ background: 'rgba(91,219,138,0.08)', border: '1px solid rgba(91,219,138,0.25)', borderRadius: 14, padding: '16px 20px', marginBottom: 20 }}>
                <div style={{ fontSize: 12, color: '#5BDB8A', fontWeight: 600, marginBottom: 4 }}>currently active</div>
                <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                  {active.seekerName}
                  {!!active.visitCount && active.visitCount > 1 && (
                    <span style={{ fontSize: 11, color: '#70B5F9', background: 'rgba(112,181,249,0.1)', padding: '2px 8px', borderRadius: 8 }}>visit #{active.visitCount}</span>
                  )}
                  {!!active.flagCount && (
                    <span style={{ fontSize: 11, color: '#FBBF24', background: 'rgba(251,191,36,0.1)', padding: '2px 8px', borderRadius: 8 }}>flagged before - {active.flagCount}</span>
                  )}
                </div>
                <button onClick={() => markDone(active.id)} style={{ marginTop: 10, marginRight: 8, background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.2)', color: '#F87171', padding: '7px 14px', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>mark done</button>
                <button onClick={() => { setFlagTarget({ id: active.seekerClerkId, name: active.seekerName }); setFlagOpen(true); }} style={{ marginTop: 10, background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.3)', color: '#FBBF24', padding: '7px 14px', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>flag & remove</button>
              </div>
            )}

            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Queue ({waiting.length})</h2>
            {waiting.length === 0 ? (
              <p style={{ color: '#8B949E', fontSize: 14 }}>no one waiting yet</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {waiting.map((w, i) => (
                  <div key={w.id} style={{ background: '#161B22', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ color: '#8B949E', fontSize: 12, marginRight: 4 }}>#{i + 1}</span>
                      <span style={{ fontWeight: 600 }}>{w.seekerName}</span>
                      {!!w.visitCount && w.visitCount > 1 && (
                        <span style={{ fontSize: 11, color: '#70B5F9', background: 'rgba(112,181,249,0.1)', padding: '2px 8px', borderRadius: 8 }}>visit #{w.visitCount}</span>
                      )}
                      {!!w.flagCount && (
                        <span style={{ fontSize: 11, color: '#FBBF24', background: 'rgba(251,191,36,0.1)', padding: '2px 8px', borderRadius: 8 }}>flagged - {w.flagCount}</span>
                      )}
                    </div>
                    {i === 0 && !active && (
                      <button onClick={() => callNext(w.id)} disabled={calling === w.id} style={{ background: 'rgba(112,181,249,0.12)', border: '1px solid rgba(112,181,249,0.3)', color: '#70B5F9', padding: '7px 14px', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: calling === w.id ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
                        {calling === w.id ? 'calling...' : 'call next →'}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            {!myEntry ? (
              <button onClick={joinQueue} disabled={joining} style={{ background: '#0A66C2', color: 'white', border: 'none', padding: '13px 28px', borderRadius: 14, fontSize: 15, fontWeight: 600, cursor: joining ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
                {joining ? 'joining...' : 'join queue'}
              </button>
            ) : myEntry.status === 'active' ? (
              <div>
                <p style={{ color: '#5BDB8A', fontWeight: 600, marginBottom: 10 }}>you&apos;re up -- check the new tab that opened.</p>
                {room.roomUrl && (
                  <a href={room.roomUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#70B5F9', fontSize: 13, textDecoration: 'underline' }}>tab didn&apos;t open? click here to join</a>
                )}
              </div>
            ) : myEntry.status === 'done' ? (
              <p style={{ color: '#8B949E', fontWeight: 600 }}>session ended. thanks for joining.</p>
            ) : (
              <div style={{ background: '#161B22', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '24px 28px' }}>
                <div style={{ fontSize: 13, color: '#8B949E', marginBottom: 6 }}>your position</div>
                <div style={{ fontSize: 32, fontWeight: 700, color: '#70B5F9', marginBottom: 16 }}>#{myPosition}</div>
                <button onClick={leaveQueue} style={{ background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.2)', color: '#F87171', padding: '9px 18px', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>leave queue</button>
              </div>
            )}
          </>
        )}
      </div>

      {flagOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: '#161B22', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, padding: 28, width: '90%', maxWidth: 420 }}>
            <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 16 }}>Report {flagTarget?.name}</h3>
            <select value={flagReason} onChange={e => setFlagReason(e.target.value)} style={{ width: '100%', background: '#0D1117', border: '1px solid rgba(255,255,255,0.1)', color: '#E6EDF3', borderRadius: 10, padding: 10, marginBottom: 10, fontFamily: 'inherit' }}>
              <option value="">select reason</option>
              <option value="harassment">Harassment / abuse</option>
              <option value="inappropriate">Inappropriate content</option>
              <option value="noshow">No-show / wasted time</option>
              <option value="other">Other</option>
            </select>
            <textarea value={flagDetails} onChange={e => setFlagDetails(e.target.value)} placeholder="what happened?" rows={4} style={{ width: '100%', background: '#0D1117', border: '1px solid rgba(255,255,255,0.1)', color: '#E6EDF3', borderRadius: 10, padding: 10, marginBottom: 14, fontFamily: 'inherit', resize: 'none' }} />
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setFlagOpen(false)} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#8B949E', padding: '9px 16px', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>cancel</button>
              <button onClick={submitFlag} disabled={flagSubmitting || !flagReason || !flagDetails} style={{ background: '#DC2626', border: 'none', color: 'white', padding: '9px 16px', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', opacity: flagSubmitting ? 0.6 : 1 }}>submit report</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}