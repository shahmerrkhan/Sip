import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  return (
    <div style={{ background: '#0D1117', minHeight: '100vh', display: 'flex', flexDirection: 'column', color: '#E6EDF3', fontFamily: 'Space Grotesk, sans-serif' }}>

      {/* LEFT PANEL */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '48px 24px', borderRight: 'none' }}>
        <div style={{ fontFamily: 'Space Mono', fontSize: 26, fontWeight: 700, color: '#70B5F9', marginBottom: 48 }}>sip ☕</div>
        <h1 style={{ fontSize: 40, fontWeight: 700, letterSpacing: -2, lineHeight: 1.1, marginBottom: 16 }}>
          Open your door.<br />
          <span style={{ background: 'linear-gradient(135deg, #70B5F9, #0A66C2)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Change someone&apos;s path.</span>
        </h1>
        <p style={{ color: '#8B949E', fontSize: 16, lineHeight: 1.7, maxWidth: 380, marginBottom: 48 }}>
          Join Sip as a mentor. List yourself, stay in control, and show up when you want to. No cold messages, ever.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {[
            { emoji: '🟢', text: 'Toggle open/closed anytime' },
            { emoji: '📬', text: 'Requests come straight to your email' },
            { emoji: '☕', text: 'You decide who gets a sip' },
          ].map(item => (
            <div key={item.text} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <span style={{ fontSize: 20 }}>{item.emoji}</span>
              <span style={{ color: '#C9D1D9', fontSize: 15 }}>{item.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <SignUp forceRedirectUrl="/onboarding" appearance={{
          variables: {
            colorBackground: '#161B22',
            colorForeground: '#E6EDF3',
            colorPrimary: '#0A66C2',
            colorInput: '#E6EDF3',
            borderRadius: '12px',
          },
          elements: {
            card: { border: '1px solid rgba(255,255,255,0.08)', boxShadow: 'none' },
            headerTitle: { color: '#E6EDF3' },
            headerSubtitle: { color: '#8B949E' },
            formFieldLabel: { color: '#8B949E' },
            footerActionLink: { color: '#70B5F9' },
          }
        }} />
      </div>
    </div>
  );
}