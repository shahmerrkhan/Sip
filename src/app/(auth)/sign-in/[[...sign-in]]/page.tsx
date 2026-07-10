import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <div style={{ background: '#0D1117', minHeight: '100vh', display: 'flex', flexDirection: 'row', flexWrap: 'wrap', color: '#E6EDF3', fontFamily: 'Space Grotesk, sans-serif' }}>

      {/* LEFT PANEL */}
      <div style={{ flex: 1, minWidth: 340, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '48px 24px', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ fontFamily: 'Space Mono', fontSize: 26, fontWeight: 700, color: '#70B5F9', marginBottom: 48 }}>sip</div>
        <h1 style={{ fontSize: 40, fontWeight: 700, letterSpacing: -2, lineHeight: 1.1, marginBottom: 16 }}>
          Welcome back.<br />
          <span style={{ background: 'linear-gradient(135deg, #70B5F9, #0A66C2)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>People are waiting.</span>
        </h1>
        <p style={{ color: '#8B949E', fontSize: 16, lineHeight: 1.7, maxWidth: 380, marginBottom: 48 }}>
          Sign in to manage your requests, update your availability, and keep showing up.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {[
            'See who requested a sip with you',
            'Accept or decline in one click',
            'Earn XP and climb the leaderboard',
          ].map(text => (
            <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#70B5F9', display: 'inline-block', flexShrink: 0 }} />
              <span style={{ color: '#C9D1D9', fontSize: 15 }}>{text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div style={{ flex: 1, minWidth: 340, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <SignIn forceRedirectUrl="/" appearance={{
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