'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import Logo from '@/components/Logo';

const TOPIC_OPTIONS = ['tech', 'startups', 'design', 'VC', 'AI/ML', 'product', 'finance', 'research', 'co-op', 'grad school'];

export default function MentorSignup() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', role: '', company: '',
    bio: '', topics: [] as string[], calendarLink: '', availability: 'flexible',
    linkedin: '', showLinkedin: false,
  });

  const set = (k: string, v: string | string[]) => setForm(f => ({ ...f, [k]: v }));
  const toggleTopic = (t: string) => setForm(f => ({ ...f, topics: f.topics.includes(t) ? f.topics.filter(x => x !== t) : [...f.topics, t] }));

  useEffect(() => {
    if (!user) return;
    fetch('/api/mentor').then(r => r.ok ? r.json() : null).then(data => {
      if (data) {
        setForm(f => ({
          ...f,
          firstName: data.firstName, lastName: data.lastName, email: data.email,
          role: data.role, company: data.company, bio: data.bio,
          topics: data.topics ? data.topics.split(',').filter(Boolean) : [],
          calendarLink: data.calendarLink, availability: data.availability,
          linkedin: data.linkedin || '', showLinkedin: data.showLinkedin,
        }));
      } else {
        setForm(f => ({
          ...f,
          firstName: f.firstName || user.firstName || '',
          lastName: f.lastName || user.lastName || '',
          email: f.email || user.emailAddresses?.[0]?.emailAddress || '',
        }));
      }
    });
  }, [user]);
  
  async function handleSubmit() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/mentor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, topics: form.topics.join(',') }),
      });
      if (!res.ok) { const data = await res.json(); setError(data.error || 'Something went wrong'); setLoading(false); return; }
      router.push('/dashboard');
    } catch { setError('Something went wrong. Try again.'); setLoading(false); }
  }

  const input: React.CSSProperties = { width: '100%', background: '#0D1117', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '12px 16px', color: '#E6EDF3', fontSize: 15, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' };
  const label: React.CSSProperties = { fontSize: 13, color: '#8B949E', display: 'block', marginBottom: 8, fontWeight: 500 };

  const stepVariants = {
    enter: { opacity: 0, x: 40 },
    center: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -40 },
  };

  return (
    <div style={{ background: '#0D1117', minHeight: '100vh', color: '#E6EDF3' }}>

      {/* NAV */}
      <motion.nav
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
        style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, padding: '0 40px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(13,17,23,0.9)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <Logo />
        <Link href="/dashboard" style={{ color: '#8B949E', textDecoration: 'none', fontSize: 14 }}>← back to dashboard</Link>
      </motion.nav>

      <div style={{ maxWidth: 560, margin: '0 auto', padding: '120px 40px 80px' }}>

        {/* HEADER */}
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }} style={{ marginBottom: 48 }}>
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(112,181,249,0.08)', border: '1px solid rgba(112,181,249,0.2)', padding: '6px 16px', borderRadius: 20, fontSize: 12, color: '#70B5F9', marginBottom: 20, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase' }}>
            Mentor Signup
          </motion.div>
          <h1 style={{ fontSize: 40, fontWeight: 700, letterSpacing: -2, lineHeight: 1.1, marginBottom: 12 }}>
            Open Your Door.<br />
            <span style={{ background: 'linear-gradient(135deg, #70B5F9, #0A66C2)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Change Someone&apos;s Path.</span>
          </h1>
          <p style={{ color: '#8B949E', fontSize: 15, lineHeight: 1.7 }}>
            You know something someone needs to hear. List yourself, stay in control, show up when you want to.
          </p>
        </motion.div>

        {/* STEP PROGRESS */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          {[1, 2, 3].map(s => (
            <motion.div key={s} animate={{ background: step >= s ? '#0A66C2' : 'rgba(255,255,255,0.1)' }} transition={{ duration: 0.3 }}
              style={{ flex: 1, height: 3, borderRadius: 4 }} />
          ))}
        </motion.div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }} style={{ color: '#8B949E', fontSize: 12, marginBottom: 36 }}>
          step {step} of 3
        </motion.div>

        {!isLoaded ? null : !user ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: 'center', padding: '60px 0' }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>🔐</div>
            <p style={{ color: '#8B949E', marginBottom: 24 }}>Sign in first to create your mentor profile</p>
            <Link href="/sign-in">
              <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} style={{ background: '#0A66C2', color: 'white', border: 'none', padding: '12px 32px', borderRadius: 24, fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>sign in to continue</motion.button>
            </Link>
          </motion.div>
        ) : (
          <AnimatePresence mode="wait">

            {/* STEP 1 */}
            {step === 1 && (
              <motion.div key="step1" variants={stepVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3, ease: 'easeInOut' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                  <div>
                    <label style={label}>First name</label>
                    <input value={form.firstName} onChange={e => set('firstName', e.target.value)} placeholder="your first name" style={input} />
                  </div>
                  <div>
                    <label style={label}>Last name</label>
                    <input value={form.lastName} onChange={e => set('lastName', e.target.value)} placeholder="your last name" style={input} />
                  </div>
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={label}>Email</label>
                  <input value={form.email} onChange={e => set('email', e.target.value)} type="email" placeholder="where seekers can reach you" style={input} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
                  <div>
                    <label style={label}>Your role</label>
                    <input value={form.role} onChange={e => set('role', e.target.value)} placeholder="e.g. SWE, Founder, PM" style={input} />
                  </div>
                  <div>
                    <label style={label}>Company</label>
                    <input value={form.company} onChange={e => set('company', e.target.value)} placeholder="where you work" style={input} />
                  </div>
                </div>
                {error && <div style={{ color: '#F87171', fontSize: 13, marginBottom: 12 }}>{error}</div>}
                <motion.button
                  whileHover={{ scale: 1.02, background: '#0856A8' }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => { if (!form.firstName || !form.lastName || !form.email || !form.role || !form.company) { setError('Please fill in all fields.'); return; } setError(''); setStep(2); }}
                  style={{ width: '100%', background: '#0A66C2', color: 'white', border: 'none', padding: '14px', borderRadius: 12, fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'background 0.2s' }}>
                  next →
                </motion.button>
              </motion.div>
            )}

            {/* STEP 2 */}
            {step === 2 && (
              <motion.div key="step2" variants={stepVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3, ease: 'easeInOut' }}>
                <div style={{ marginBottom: 20 }}>
                  <label style={label}>Your one-liner bio</label>
                  <textarea value={form.bio} onChange={e => set('bio', e.target.value)} placeholder="what do you actually want to talk about? be real, not corporate." rows={3} style={{ ...input, resize: 'none' }} />
                  <div style={{ color: '#8B949E', fontSize: 12, marginTop: 6 }}>{form.bio.length}/200 chars</div>
                </div>
                <div style={{ marginBottom: 28 }}>
                <label style={label}>Topics you&apos;re open to discuss</label>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {TOPIC_OPTIONS.map(t => (
                      <motion.button key={t} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.96 }} onClick={() => toggleTopic(t)}
                        style={{ padding: '7px 16px', borderRadius: 20, border: '1px solid', borderColor: form.topics.includes(t) ? '#0A66C2' : 'rgba(255,255,255,0.1)', background: form.topics.includes(t) ? 'rgba(10,102,194,0.2)' : 'transparent', color: form.topics.includes(t) ? '#70B5F9' : '#8B949E', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s' }}>
                        {t}
                      </motion.button>
                    ))}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={() => setStep(1)} style={{ flex: 1, background: 'transparent', color: '#8B949E', border: '1px solid rgba(255,255,255,0.1)', padding: '14px', borderRadius: 12, fontSize: 15, cursor: 'pointer', fontFamily: 'inherit' }}>← back</motion.button>
                  <motion.button whileHover={{ scale: 1.02, background: '#0856A8' }} whileTap={{ scale: 0.97 }} onClick={() => { if (!form.bio || form.topics.length === 0) { setError('Add a bio and at least one topic.'); return; } setError(''); setStep(3); }} style={{ flex: 2, background: '#0A66C2', color: 'white', border: 'none', padding: '14px', borderRadius: 12, fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'background 0.2s' }}>next →</motion.button>
                </div>
                {error && <div style={{ color: '#F87171', fontSize: 13, marginTop: 12 }}>{error}</div>}
              </motion.div>
            )}

            {/* STEP 3 */}
            {step === 3 && (
              <motion.div key="step3" variants={stepVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3, ease: 'easeInOut' }}>
                <div style={{ marginBottom: 16 }}>
                  <label style={label}>Calendar link</label>
                  <input value={form.calendarLink} onChange={e => set('calendarLink', e.target.value)} placeholder="calendly.com/yourname" style={input} />
                  <div style={{ color: '#8B949E', fontSize: 12, marginTop: 6 }}>This is what seekers get when you accept a request</div>
                  {form.calendarLink && !/^(https?:\/\/)?(www\.)?calendly\.com\/.+/i.test(form.calendarLink.trim()) && (
                    <div style={{ color: '#F87171', fontSize: 12, marginTop: 6 }}>Must be a calendly.com link.</div>
                  )}
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={label}>LinkedIn profile (optional)</label>
                  <input value={form.linkedin} onChange={e => set('linkedin', e.target.value)} placeholder="linkedin.com/in/yourname" style={input} />
                  {form.linkedin && !/^(https?:\/\/)?(www\.)?linkedin\.com\/.+/i.test(form.linkedin.trim()) && (
                    <div style={{ color: '#F87171', fontSize: 12, marginTop: 6 }}>Please enter a valid LinkedIn profile URL.</div>
                  )}
                </div>
                <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <input type="checkbox" id="showLinkedin" checked={form.showLinkedin} onChange={e => setForm(f => ({ ...f, showLinkedin: e.target.checked }))}
                    style={{ width: 16, height: 16, accentColor: '#0A66C2', cursor: 'pointer' }} />
                  <label htmlFor="showLinkedin" style={{ fontSize: 13, color: '#8B949E', cursor: 'pointer' }}>Show my LinkedIn on my public profile</label>
                </div>
                <div style={{ marginBottom: 32 }}>
                  <label style={label}>Availability vibe</label>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {['flexible', 'weekends only', 'evenings only', 'by request'].map(a => (
                      <motion.button key={a} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} onClick={() => set('availability', a)}
                        style={{ padding: '7px 14px', borderRadius: 20, border: '1px solid', borderColor: form.availability === a ? '#0A66C2' : 'rgba(255,255,255,0.1)', background: form.availability === a ? 'rgba(10,102,194,0.2)' : 'transparent', color: form.availability === a ? '#70B5F9' : '#8B949E', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s' }}>
                        {a}
                      </motion.button>
                    ))}
                  </div>
                </div>
                <AnimatePresence>
                  {error && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      style={{ background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.3)', borderRadius: 10, padding: '12px 16px', color: '#F87171', fontSize: 14, marginBottom: 16 }}>
                      {error}
                    </motion.div>
                  )}
                </AnimatePresence>
                <div style={{ display: 'flex', gap: 12 }}>
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={() => setStep(2)} style={{ flex: 1, background: 'transparent', color: '#8B949E', border: '1px solid rgba(255,255,255,0.1)', padding: '14px', borderRadius: 12, fontSize: 15, cursor: 'pointer', fontFamily: 'inherit' }}>← back</motion.button>
                  <motion.button
                    whileHover={{ scale: loading ? 1 : 1.02, background: loading ? '#1E3A5F' : '#0856A8' }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleSubmit}
                    disabled={loading || !form.calendarLink || !/^(https?:\/\/)?(www\.)?calendly\.com\/.+/i.test(form.calendarLink.trim()) || (!!form.linkedin && !/^(https?:\/\/)?(www\.)?linkedin\.com\/.+/i.test(form.linkedin.trim()))}
                    style={{ flex: 2, background: loading ? '#1E3A5F' : '#0A66C2', color: 'white', border: 'none', padding: '14px', borderRadius: 12, fontSize: 15, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', transition: 'background 0.2s' }}>
                    {loading ? (
                      <motion.span animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 1, repeat: Infinity }}>saving...</motion.span>
                    ) : 'go live ✦'}
                  </motion.button>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        )}
      </div>
    </div>
  );
}