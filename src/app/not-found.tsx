import Link from 'next/link';

export default function NotFound() {
  return (
    <div style={{ background: '#0D1117', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16, color: '#E6EDF3', fontFamily: 'Space Grotesk, sans-serif' }}>
      <div style={{ fontFamily: 'Space Mono', fontSize: 28, fontWeight: 700, color: '#70B5F9' }}>sip</div>
      <h1 style={{ fontSize: 48, fontWeight: 700, letterSpacing: -2, margin: 0 }}>404</h1>
      <p style={{ color: '#8B949E', fontSize: 16 }}>This page doesn't exist. Maybe the mentor moved on.</p>
      <Link href="/" style={{ marginTop: 8, background: '#0A66C2', color: 'white', padding: '12px 28px', borderRadius: 20, fontSize: 15, fontWeight: 600, textDecoration: 'none' }}>back to directory →</Link>
    </div>
  );
}