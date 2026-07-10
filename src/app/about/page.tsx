import Logo from '@/components/Logo';
import Link from 'next/link';

export default function About() {
  return (
    <div style={{ background: '#0D1117', minHeight: '100vh', color: '#E6EDF3', fontFamily: "'Space Grotesk', sans-serif", padding: '60px 20px' }}>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        <div style={{ marginBottom: 32 }}><Logo /></div>
        <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 20 }}>About Sip</h1>
        <p style={{ color: '#8B949E', fontSize: 15, lineHeight: 1.8, marginBottom: 16 }}>
          Sip exists because cold outreach doesn&apos;t work. Most people trying to learn something new send messages that never get answered, or wait days for a scheduled call that could&apos;ve been a five-minute conversation.
        </p>
        <p style={{ color: '#8B949E', fontSize: 15, lineHeight: 1.8, marginBottom: 16 }}>
          We built a place where mentors show up when they&apos;re actually free, and seekers can join a live queue instead of sending a message into the void. No scheduling links. No waiting on replies. Just people who said yes to being here right now.
        </p>
        <Link href="/" style={{ color: '#70B5F9', textDecoration: 'none', fontSize: 14 }}>← back home</Link>
      </div>
    </div>
  );
}