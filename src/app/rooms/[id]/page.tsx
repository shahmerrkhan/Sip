'use client';
import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { useRoles } from '@/hooks/useRoles';

type Room = { id: string; title: string; roomUrl: string; status: string; firstName: string; lastName: string; role: string; company: string };
type QueueEntry = { id: string; seekerClerkId: string; seekerName: string; status: string };

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
    if (myEntry?.status === 'active' && room?.roomUrl) window.location.href = room.roomUrl;
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

  const myPosition = myEntry?.status === 'waiting' ? waiting.findIndex(w => w.id === myEntry.id) + 1 : 0;

  if (!room || !rolesLoaded) return (
    <div style={{ background: '#0D1117', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8B949E' }}>loading room...</div>
  );

  return (
    <div style={{ background: '#0D1117', minHeight: '100vh', color: '#E6EDF3', fontFamily: "'Space Grotesk', sans-serif", padding: '80px 20px' }}>
      <div style={{ maxWidth: 560, margin: '0 auto' }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 4 }}>{room.title}</h1>
        <p style={{ color: '#8B949E', fontSize: 14, marginBottom: 32 }}>{room.firstName} {room.lastName} Â· {room.role} @ {room.company}</p>

        {isMentor ? (
          <>
            <a href={room.roomUrl} style={{ display: 'inline-block', background: '#0A66C2', color: 'white', padding: '12px 24px', borderRadius: 12, textDecoration: 'none', fontWeight: 600, fontSize: 14, marginBottom: 28 }}>join room â†’</a>

            {active && (
              <div style={{ background: 'rgba(91,219,138,0.08)', border: '1px solid rgba(91,219,138,0.25)', borderRadius: 14, padding: '16px 20px', marginBottom: 20 }}>
                <div style={{ fontSize: 12, color: '#5BDB8A', fontWeight: 600, marginBottom: 4 }}>currently active</div>
                <div style={{ fontWeight: 600 }}>{active.seekerName}</div>
                <button onClick={() => markDone(active.id)} style={{ marginTop: 10, background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.2)', color: '#F87171', padding: '7px 14px', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>mark done</button>
              </div>
            )}

            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Queue ({waiting.length})</h2>
            {waiting.length === 0 ? (
              <p style={{ color: '#8B949E', fontSize: 14 }}>no one waiting yet</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {waiting.map((w, i) => (
                  <div key={w.id} style={{ background: '#161B22', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ color: '#8B949E', fontSize: 12, marginRight: 8 }}>#{i + 1}</span>
                      <span style={{ fontWeight: 600 }}>{w.seekerName}</span>
                    </div>
                    {i === 0 && !active && (
                      <button onClick={() => callNext(w.id)} disabled={calling === w.id} style={{ background: 'rgba(112,181,249,0.12)', border: '1px solid rgba(112,181,249,0.3)', color: '#70B5F9', padding: '7px 14px', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: calling === w.id ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
                        {calling === w.id ? 'calling...' : 'call next â†’'}
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
              <p style={{ color: '#5BDB8A', fontWeight: 600 }}>you&apos;re up â€” redirecting to the room...</p>
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
    </div>
  );
}