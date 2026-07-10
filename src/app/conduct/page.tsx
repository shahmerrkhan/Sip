import Logo from '@/components/Logo';
import Link from 'next/link';

export default function Conduct() {
  return (
    <div style={{ background: '#0D1117', minHeight: '100vh', color: '#E6EDF3', fontFamily: "'Space Grotesk', sans-serif", padding: '60px 20px' }}>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        <div style={{ marginBottom: 32 }}><Logo /></div>
        <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 20 }}>Code of Conduct</h1>
        <div style={{ color: '#8B949E', fontSize: 15, lineHeight: 1.8, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <p>Every session on Sip is between real people. Treat it that way.</p>
          <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <li>No recording, screenshotting, or sharing any part of a call without explicit consent from everyone involved.</li>
            <li>No harassment, discrimination, or inappropriate language or behavior.</li>
            <li>Show up when you say you will. Repeated no-shows can affect your standing.</li>
            <li>Use the flag button if something feels wrong — reports are reviewed, not ignored.</li>
            <li>Violations can result in a warning, suspension, or permanent ban depending on severity.</li>
          </ul>
        </div>
        <Link href="/" style={{ color: '#70B5F9', textDecoration: 'none', fontSize: 14, display: 'block', marginTop: 32 }}>← back home</Link>
      </div>
    </div>
  );
}