'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

type Room = { id: string; title: string; roomUrl: string; status: string; firstName: string; lastName: string; role: string; company: string; };

export default function RoomPage() {
  const { id } = useParams<{ id: string }>();
  const [room, setRoom] = useState<Room | null>(null);

  useEffect(() => {
    fetch(`/api/rooms/${id}`).then(r => r.ok ? r.json() : null).then(data => {
      if (data) {
        setRoom(data);
        window.location.href = data.roomUrl;
      }
    });
  }, [id]);

  if (!room) return (
    <div style={{ background: '#0D1117', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8B949E' }}>loading room...</div>
  );

  return (
    <div style={{ background: '#0D1117', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8B949E' }}>redirecting to your sip room...</div>
  );
}