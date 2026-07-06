'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '@clerk/nextjs';

type Mentor = {
  id: string; firstName: string; lastName: string; role: string; company: string;
  bio: string; topics: string; availability: string; isOpen: boolean; xp: number; sipCount: number; badges: string;
  linkedin?: string; showLinkedin?: boolean; avgResponseMinutes?: number | null;
};

function formatResponseTime(minutes: number): string {
  if (minutes < 60) return `~${Math.round(minutes)} min`;
  if (minutes < 1440) return `~${Math.round(minutes / 60)} hr`;
  return `~${Math.round(minutes / 1440)} day${minutes >= 2880 ? 's' : ''}`;
}
type SipNote = { id: string; seekerName: string; note: string; createdAt: string; };

const BADGE_META: Record<string, { label: string; emoji: string }> = {
  'first-sip': { label: 'First Sip', emoji: '☕' },
  'regular':   { label: 'Regular',   emoji: '🔥' },
  'veteran':   { label: 'Veteran',   emoji: '⚡' },
  'legend':    { label: 'Legend',    emoji: '💎' },
  'goat':      { label: 'GOAT',      emoji: '🐐' },
};

export default function MentorProfile() {
  const { id } = useParams();
  const { user } = useUser();
  const [mentor, setMentor] = useState<Mentor | null>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [notes, setNotes] = useState<SipNote[]>([]);
  const [noteForm, setNoteForm] = useState({ name: '' });
  const [noteText, setNoteText] = useState('');
  const [noteSent, setNoteSent] = useState(false);
  const [noteError, setNoteError] = useState('');
  const [submittingNote, setSubmittingNote] = useState(false);
  const [askText, setAskText] = useState('');
  const [askSent, setAskSent] = useState(false);
  const [askError, setAskError] = useState('');
  const [submittingAsk, setSubmittingAsk] = useState(false);

  useEffect(() => {
    fetch(`/api/mentor/${id}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { setMentor(data); setLoading(false); });
    fetch(`/api/sip-notes?mentorId=${id}`)
      .then(r => r.ok ? r.json() : [])
      .then(data => setNotes(data));
  }, [id]);

  async function handleAskSubmit() {
    if (!mentor || !askText) return;
    if (!user) { setAskError('Sign in to ask a question.'); return; }
    setSubmittingAsk(true);
    setAskError('');
    const res = await fetch('/api/asks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mentorId: mentor.id, question: askText }),
    });
    if (res.ok) {
      setAskSent(true);
      setAskText('');
    } else {
      const data = await res.json();
      setAskError(data.error || 'Something went wrong');
    }
    setSubmittingAsk(false);
  }

  async function handleNoteSubmit() {
    if (!mentor || !noteForm.name || !noteText) return;
    if (!user) { setNoteError('Sign in to leave a note.'); return; }
    setSubmittingNote(true);
    const res = await fetch('/api/sip-notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mentorId: mentor.id, seekerName: noteForm.name, note: noteText }),
    });
    if (res.ok) {
      const created = await res.json();
      setNotes(n => [created, ...n]);
      setNoteSent(true);
      setNoteForm({ name: '' });
      setNoteText('');
      setNoteError('');
    } else {
      const data = await res.json();
      setNoteError(data.error || 'Something went wrong');
    }
    setSubmittingNote(false);
  }

  async function handleSubmit() {
    if (!mentor || !form.name || !form.email || !form.message) return;
    setSubmitting(true);
    const res = await fetch('/api/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mentorId: mentor.id, seekerName: form.name, seekerEmail: form.email, message: form.message }),
    });
    if (res.ok) { setSent(true); }
    else { const data = await res.json(); alert(data.error || 'Something went wrong'); }
    setSubmitting(false);
  }

  const inputStyle: React.CSSProperties = { width: '100%', background: '#0D1117', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '12px 16px', color: '#E6EDF3', fontSize: 15, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' };

  if (loading) return (
    <div style={{ background: '#0D1117', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.5, repeat: Infinity }} style={{ color: '#8B949E' }}>loading...</motion.div>
    </div>
  );

  if (!mentor) return (
    <div style={{ background: '#0D1117', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
      <div style={{ fontSize: 48 }}>☕</div>
      <p style={{ color: '#8B949E' }}>Mentor not found.</p>
      <Link href="/" style={{ color: '#70B5F9', textDecoration: 'none' }}>← back to directory</Link>
    </div>
  );

  return (
    <div style={{ background: '#0D1117', minHeight: '100vh', color: '#E6EDF3' }}>

      <motion.nav initial={{ y: -60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.4 }}
        style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, padding: '0 40px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(13,17,23,0.9)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <Link href="/" style={{ fontFamily: 'Space Mono', fontSize: 22, fontWeight: 700, color: '#70B5F9', letterSpacing: -1, textDecoration: 'none' }}>sip ☕</Link>
        <button onClick={() => window.history.length > 1 ? window.history.back() : window.location.href = '/'} style={{ background: 'none', border: 'none', color: '#8B949E', fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>← back</button>
      </motion.nav>

      <div style={{ maxWidth: 680, margin: '0 auto', padding: '100px 40px 80px' }}>

        {/* PROFILE CARD */}
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          style={{ background: '#161B22', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 24, padding: 40, marginBottom: 24 }}>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20, marginBottom: 28 }}>
            <motion.div whileHover={{ scale: 1.06 }} style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg, #0A66C2, #7C3AED)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 24, flexShrink: 0 }}>
              {mentor.firstName[0]}{mentor.lastName[0]}
            </motion.div>
            <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: -1, margin: 0 }}>{mentor.firstName} {mentor.lastName}</h1>
                <span style={{ fontSize: 12, padding: '3px 10px', borderRadius: 10, background: 'rgba(112,181,249,0.1)', border: '1px solid rgba(112,181,249,0.2)', color: '#70B5F9', fontWeight: 600 }}>{mentor.xp} XP</span>
              </div>
              <div style={{ color: '#8B949E', fontSize: 15, marginBottom: 12 }}>
                {mentor.role} @ {mentor.company}
                {mentor.showLinkedin && mentor.linkedin && (
                  <> · <a href={mentor.linkedin.startsWith('http') ? mentor.linkedin : `https://${mentor.linkedin}`} target="_blank" rel="noopener noreferrer" style={{ color: '#70B5F9', textDecoration: 'none' }}>LinkedIn ↗</a></>
                )}
              </div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <motion.span animate={{ opacity: mentor.isOpen ? [1, 0.4, 1] : 1 }} transition={{ duration: 2, repeat: Infinity }}
                  style={{ fontSize: 12, padding: '4px 12px', borderRadius: 12, background: mentor.isOpen ? 'rgba(91,219,138,0.1)' : 'rgba(139,148,158,0.1)', color: mentor.isOpen ? '#5BDB8A' : '#8B949E', border: `1px solid ${mentor.isOpen ? 'rgba(91,219,138,0.3)' : 'rgba(139,148,158,0.2)'}`, fontWeight: 600 }}>
                  {mentor.isOpen ? '● open' : '○ closed'}
                </motion.span>
                <span style={{ fontSize: 12, padding: '4px 12px', borderRadius: 12, background: 'rgba(112,181,249,0.08)', color: '#70B5F9', border: '1px solid rgba(112,181,249,0.15)' }}>
                  {mentor.availability}
                </span>
                {mentor.avgResponseMinutes != null && (
                  <span style={{ fontSize: 12, padding: '4px 12px', borderRadius: 12, background: 'rgba(91,219,138,0.08)', color: '#5BDB8A', border: '1px solid rgba(91,219,138,0.15)' }}>
                    ⚡ responds in {formatResponseTime(mentor.avgResponseMinutes)}
                  </span>
                )}
              </div>
            </div>
          </div>

          <p style={{ color: '#C9D1D9', fontSize: 15, lineHeight: 1.75, marginBottom: 24 }}>"{mentor.bio}"</p>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 28 }}>
            {mentor.topics.split(',').map(t => (
              <span key={t} style={{ background: 'rgba(112,181,249,0.07)', border: '1px solid rgba(112,181,249,0.15)', color: '#70B5F9', padding: '5px 14px', borderRadius: 14, fontSize: 13 }}>{t.trim()}</span>
            ))}
          </div>

          {/* STATS */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
            {[
              { label: 'XP Earned', value: mentor.xp.toLocaleString(), color: '#70B5F9' },
              { label: 'Sips Given', value: mentor.sipCount, color: '#5BDB8A' },
              { label: 'Badges', value: mentor.badges.split(',').filter(Boolean).length, color: '#F59E0B' },
            ].map(s => (
              <div key={s.label} style={{ background: '#0D1117', borderRadius: 12, padding: '16px', textAlign: 'center' }}>
                <div style={{ fontSize: 24, fontWeight: 700, color: s.color, fontFamily: 'Space Mono' }}>{s.value}</div>
                <div style={{ color: '#8B949E', fontSize: 12, marginTop: 4 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* BADGES */}
          {mentor.badges && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 20 }}>
              {mentor.badges.split(',').filter(Boolean).map(b => (
                <span key={b} style={{ fontSize: 12, padding: '5px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#C9D1D9' }}>
                  {BADGE_META[b]?.emoji} {BADGE_META[b]?.label}
                </span>
              ))}
            </div>
          )}
        </motion.div>

        {/* SIP NOTES */}
        {notes.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.5 }}
            style={{ background: '#161B22', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 24, padding: 40, marginBottom: 24 }}>
            <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 20 }}>What people took away</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {notes.map(n => (
                <div key={n.id} style={{ background: '#0D1117', borderRadius: 14, padding: '16px 20px' }}>
                  <p style={{ color: '#C9D1D9', fontSize: 14, lineHeight: 1.6, marginBottom: 8 }}>"{n.note}"</p>
                  <div style={{ color: '#8B949E', fontSize: 12 }}>{n.seekerName}</div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* LEAVE A NOTE */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.5 }}
          style={{ background: '#161B22', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 24, padding: 40, marginBottom: 24 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>Had a sip with {mentor.firstName}?</h2>
          <p style={{ color: '#8B949E', fontSize: 14, marginBottom: 28 }}>Leave a quick note on what you took away.</p>
          <AnimatePresence mode="wait">
            {noteSent ? (
              <motion.div key="noteSent" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ color: '#5BDB8A', fontSize: 16, fontWeight: 600 }}>Thanks, that's now on their profile.</div>
              </motion.div>
            ) : (
              <motion.div key="noteForm" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 13, color: '#8B949E', display: 'block', marginBottom: 6 }}>Your name</label>
                  <input value={noteForm.name} onChange={e => setNoteForm(f => ({ ...f, name: e.target.value }))} placeholder="What do people call you?" style={inputStyle} />
                </div>
                <div style={{ marginBottom: 28 }}>
                  <label style={{ fontSize: 13, color: '#8B949E', display: 'block', marginBottom: 6 }}>What'd you take away?</label>
                  <textarea value={noteText} onChange={e => setNoteText(e.target.value)} placeholder="One or two sentences on what stuck with you" rows={3} maxLength={1000} style={{ ...inputStyle, resize: 'none' }} />
                </div>
                {noteError && (
                  <div style={{ background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.3)', borderRadius: 10, padding: '12px 16px', color: '#F87171', fontSize: 14, marginBottom: 20 }}>
                    {noteError}
                  </div>
                )}
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={handleNoteSubmit} disabled={submittingNote}
                  style={{ width: '100%', background: 'rgba(91,219,138,0.12)', border: '1px solid rgba(91,219,138,0.3)', color: '#5BDB8A', padding: '14px', borderRadius: 12, fontSize: 15, fontWeight: 600, cursor: submittingNote ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
                  {submittingNote ? 'Posting...' : 'Post it'}
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* ASK A QUICK QUESTION */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18, duration: 0.5 }}
          style={{ background: '#161B22', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 24, padding: 40, marginBottom: 24 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>Ask {mentor.firstName} something quick</h2>
          <p style={{ color: '#8B949E', fontSize: 14, marginBottom: 28 }}>Not ready for a full sip? Ask a quick question instead. Limited to 2 per mentor per week.</p>
          {askSent ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ color: '#5BDB8A', fontSize: 16, fontWeight: 600 }}>Sent. They&apos;ll get back to you soon.</div>
            </div>
          ) : (
            <div>
              <textarea value={askText} onChange={e => setAskText(e.target.value)} placeholder="What do you want to know?" rows={3} maxLength={500}
                style={{ ...inputStyle, resize: 'none', marginBottom: 20 }} />
              {askError && (
                <div style={{ background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.3)', borderRadius: 10, padding: '12px 16px', color: '#F87171', fontSize: 14, marginBottom: 20 }}>
                  {askError}
                </div>
              )}
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={handleAskSubmit} disabled={submittingAsk}
                style={{ width: '100%', background: 'rgba(112,181,249,0.12)', border: '1px solid rgba(112,181,249,0.3)', color: '#70B5F9', padding: '14px', borderRadius: 12, fontSize: 15, fontWeight: 600, cursor: submittingAsk ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
                {submittingAsk ? 'Sending...' : 'Ask'}
              </motion.button>
            </div>
          )}
        </motion.div>

        {/* REQUEST FORM */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.5 }}
          style={{ background: '#161B22', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 24, padding: 40 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>Request a Sip</h2>
          <p style={{ color: '#8B949E', fontSize: 14, marginBottom: 28 }}>No cold messages. Just show up.</p>

          <AnimatePresence mode="wait">
            {sent ? (
              <motion.div key="sent" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} style={{ textAlign: 'center', padding: '40px 0' }}>
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }} style={{ fontSize: 48, marginBottom: 16 }}>✓</motion.div>
                <div style={{ color: '#5BDB8A', fontSize: 18, fontWeight: 600 }}>Sent. They'll reach out soon.</div>
              </motion.div>
            ) : (
              <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                {!mentor.isOpen && (
                  <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 10, padding: '12px 16px', color: '#F59E0B', fontSize: 14, marginBottom: 20 }}>
                    This mentor is currently closed to requests, but you can still send one — they'll see it when they reopen.
                  </div>
                )}
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 13, color: '#8B949E', display: 'block', marginBottom: 6 }}>Your name</label>
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="What do people call you?" style={inputStyle} />
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 13, color: '#8B949E', display: 'block', marginBottom: 6 }}>Your email</label>
                  <input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} type="email" placeholder="So they can reach back" style={inputStyle} />
                </div>
                <div style={{ marginBottom: 28 }}>
                  <label style={{ fontSize: 13, color: '#8B949E', display: 'block', marginBottom: 6 }}>What's on your mind?</label>
                  <textarea value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} placeholder="One or two sentences — what are you trying to figure out?" rows={3} style={{ ...inputStyle, resize: 'none' }} />
                </div>
                <motion.button whileHover={{ scale: 1.02, background: '#0856A8' }} whileTap={{ scale: 0.97 }} onClick={handleSubmit} disabled={submitting}
                  style={{ width: '100%', background: '#0A66C2', color: 'white', border: 'none', padding: '14px', borderRadius: 12, fontSize: 15, fontWeight: 600, cursor: submitting ? 'not-allowed' : 'pointer', fontFamily: 'inherit', transition: 'background 0.2s' }}>
                  {submitting ? 'Sending...' : 'Send it ✦'}
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}