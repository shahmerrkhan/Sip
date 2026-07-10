'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { useRoles } from '@/hooks/useRoles';
import Logo from '@/components/Logo';

export default function ChooseRole() {
  const { user, isLoaded } = useUser();
  const { isMentor, isSeeker, loaded } = useRoles();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded || !loaded) return;
    if (!user) { router.push('/'); return; }
    if (isMentor && !isSeeker) { router.push('/dashboard'); return; }
    if (isSeeker && !isMentor) { router.push('/seekers'); return; }
    if (!isMentor && !isSeeker) { router.push('/'); return; }
  }, [isLoaded, loaded, user, isMentor, isSeeker, router]);

  if (!isMentor || !isSeeker) return (
    <div style={{ background: '#0D1117', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8B949E' }}>loading...</div>
  );

  return (
    <div style={{ background: '#0D1117', minHeight: '100vh', color: '#E6EDF3', fontFamily: "'Space Grotesk', sans-serif", display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ marginBottom: 40 }}><Logo /></div>
      <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: 8 }}>Continue as...</h1>
      <p style={{ color: '#8B949E', fontSize: 14, marginBottom: 36 }}>You have both a mentor and seeker account.</p>
      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', justifyContent: 'center' }}>
        <button onClick={() => { localStorage.setItem('sip_last_role', 'mentor'); router.push('/dashboard'); }}
          style={{ width: 220, background: '#161B22', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 18, padding: '32px 24px', color: '#E6EDF3', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🎓</div>
          <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 6 }}>Mentor</div>
          <div style={{ color: '#8B949E', fontSize: 13 }}>Manage requests, go live, answer asks</div>
        </button>
        <button onClick={() => { localStorage.setItem('sip_last_role', 'seeker'); router.push('/seekers'); }}
          style={{ width: 220, background: '#161B22', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 18, padding: '32px 24px', color: '#E6EDF3', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🔍</div>
          <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 6 }}>Seeker</div>
          <div style={{ color: '#8B949E', fontSize: 13 }}>Find mentors, join queues, ask questions</div>
        </button>
      </div>
    </div>
  );
}