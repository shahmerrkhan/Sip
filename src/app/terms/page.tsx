import Logo from '@/components/Logo';
import Link from 'next/link';

export default function Terms() {
  return (
    <div style={{ background: '#0D1117', minHeight: '100vh', color: '#E6EDF3', fontFamily: "'Space Grotesk', sans-serif", padding: '80px 40px' }}>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        <div style={{ marginBottom: 32 }}><Logo /></div>
        <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 20 }}>Terms of Service</h1>
        <p style={{ color: '#8B949E', fontSize: 14, marginBottom: 24 }}>Last updated: {new Date().toLocaleDateString()}</p>
        <div style={{ color: '#8B949E', fontSize: 15, lineHeight: 1.8, display: 'flex', flexDirection: 'column', gap: 20 }}>
          <p><strong style={{ color: '#E6EDF3' }}>Using Sip:</strong> by creating an account, you agree to use the platform respectfully and follow our Code of Conduct during every session.</p>
          <p><strong style={{ color: '#E6EDF3' }}>Accounts:</strong> you&apos;re responsible for activity under your account. Don&apos;t impersonate others or share your login.</p>
          <p><strong style={{ color: '#E6EDF3' }}>Conduct:</strong> harassment, recording without consent, or inappropriate behavior during a session can result in suspension or a permanent ban, with no refund of any paid features.</p>
          <p><strong style={{ color: '#E6EDF3' }}>Availability:</strong> Sip is provided as-is. We don&apos;t guarantee mentor availability or uninterrupted service.</p>
          <p><strong style={{ color: '#E6EDF3' }}>Changes:</strong> we may update these terms as the product evolves. Continued use means you accept the current version.</p>
        </div>
        <Link href="/" style={{ color: '#70B5F9', textDecoration: 'none', fontSize: 14, display: 'block', marginTop: 32 }}>← back home</Link>
      </div>
    </div>
  );
}