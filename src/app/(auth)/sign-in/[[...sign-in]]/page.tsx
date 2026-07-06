import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <div style={{ background: '#0D1117', minHeight: '100vh', display: 'flex', color: '#E6EDF3', fontFamily: 'Space Grotesk, sans-serif' }}>

      {/* LEFT PANEL */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '60px 80px', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ fontFamily: 'Space Mono', fontSize: 26, fontWeight: 700, color: '#70B5F9', marginBottom: 48 }}>sip ☕</div>
        <h1 style={{ fontSize: 40, fontWeight: 700, letterSpacing: -2, lineHeight: 1.1, marginBottom: 16 }}>
          Welcome back.<br />
          <span style={{ background: 'linear-gradient(135deg, #70B5F9, #0A66C2)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>People are waiting.</span>
        </h1>
        <p style={{ color: '#8B949E', fontSize: 16, lineHeight: 1.7, maxWidth: 380, marginBottom: 48 }}>
          Sign in to manage your requests, update your availability, and keep showing up.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {[
            { emoji: '☕', text: 'See who requested a sip with you' },
            { emoji: '⚡', text: 'Accept or decline in one click' },
            { emoji: '🏆', text: 'Earn XP and climb the leaderboard' },
          ].map(item => (
            <div key={item.text} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <span style={{ fontSize: 20 }}>{item.emoji}</span>
              <span style={{ color: '#C9D1D9', fontSize: 15 }}>{item.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
          <SignIn forceRedirectUrl="/" appearance={{
          variables: {
            colorBackground: '#161B22',
            colorText: '#E6EDF3',
            colorPrimary: '#0A66C2',
            colorInputBackground: '#0D1117',
            colorInputText: '#E6EDF3',
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