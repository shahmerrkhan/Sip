'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useRoles } from '@/hooks/useRoles';
import Logo from '@/components/Logo';

type Mentor = {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
  company: string;
  topics: string;
  bio: string;
  isOpen: boolean;
  availability: string;
};  

const AVATARS = ['#0A66C2', '#7C3AED', '#059669', '#DC2626', '#D97706', '#0891B2'];
const INITIALS = (m: Mentor) => `${m.firstName[0]}${m.lastName[0]}`;

const WORDS = ['Real Convos.', 'No Cold DMs.', 'Actual Answers.', 'Zero Gatekeeping.'];
type AIMatch = { id: string; firstName: string; lastName: string; role: string; company: string; reason: string };

export default function Home() {
  const { user } = useUser();
  const router = useRouter();
  const { isMentor, isSeeker, loaded: rolesLoaded } = useRoles();
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<Mentor | null>(null);
  const [filter, setFilter] = useState('all');
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [sent, setSent] = useState(false);
  const [count, setCount] = useState(0);
  const [wordIndex, setWordIndex] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const [search, setSearch] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [aiQuery, setAiQuery] = useState('');
  const [aiMatches, setAiMatches] = useState<AIMatch[] | null>(null);
  const [matching, setMatching] = useState(false);
  const TEASER_LIMIT = 6;
  
  useEffect(() => {
    if (user?.firstName) setForm(f => ({ ...f, name: user.firstName! }));
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (user?.emailAddresses?.[0]) setForm(f => ({ ...f, email: user.emailAddresses[0].emailAddress }));
  }, [user]);

  useEffect(() => {
    if (mentors.length === 0) return;
    let n = 0;
    const target = mentors.length;
    const t = setInterval(() => { n += 1; setCount(Math.min(n, target)); if (n >= target) clearInterval(t); }, 40);
    return () => clearInterval(t);
  }, [mentors.length]);

  useEffect(() => {
    const t = setInterval(() => setWordIndex(i => (i + 1) % WORDS.length), 2200);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const [liveRooms, setLiveRooms] = useState<{ id: string; title: string; firstName: string; lastName: string; role: string; company: string; }[]>([]);
  const [noMatchInterest, setNoMatchInterest] = useState<string | null>(null);

  const fetchMentors = useCallback(async () => {
    const res = await fetch('/api/mentor?leaderboard=true');
    if (res.ok) {
      const data: Mentor[] = await res.json();
      setMentors(data.filter(m => m.isOpen));
    }
    setLoading(false);
  }, []);

  const fetchLiveRooms = useCallback(async () => {
    const res = await fetch('/api/rooms');
    if (res.ok) setLiveRooms(await res.json());
  }, []);

  useEffect(() => {
    fetchLiveRooms();
    const t = setInterval(fetchLiveRooms, 15000);
    return () => clearInterval(t);
  }, [fetchLiveRooms]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchMentors(); }, [fetchMentors]);
  
  const ALL_FILTERS = ['all', 'tech', 'startups', 'design', 'VC', 'AI/ML', 'product', 'finance', 'research'];
  const filtered = mentors.filter(m => {
    const matchFilter = filter === 'all' || m.topics.toLowerCase().includes(filter.toLowerCase());
    const q = search.toLowerCase();
    const matchSearch = !q || m.firstName.toLowerCase().includes(q) || m.lastName.toLowerCase().includes(q) || m.role.toLowerCase().includes(q) || m.company.toLowerCase().includes(q) || m.topics.toLowerCase().includes(q);
    return matchFilter && matchSearch;
  });
  const teaserMentors = filtered.slice(0, TEASER_LIMIT);
  
  async function handleAIMatch() {
    if (!aiQuery.trim()) return;
    setMatching(true);
    setAiMatches(null);
    const res = await fetch('/api/match', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query: aiQuery }),
    });
    if (res.ok) { const data = await res.json(); setAiMatches(data.matches); }
    setMatching(false);
  }

  async function handleInstantSip() {
    if (!user) { router.push('/sign-in'); return; }
    if (rolesLoaded && !isSeeker) { router.push('/seekers/onboarding'); return; }

    const openMentors = mentors.filter(m => m.isOpen);
    if (openMentors.length === 0) { alert("no one's open right now, check back in a bit"); return; }

    const seekerRes = await fetch('/api/seeker');
    const seeker = seekerRes.ok ? await seekerRes.json() : null;
    const interests = seeker?.interests ? seeker.interests.split(',').map((i: string) => i.trim().toLowerCase()).filter(Boolean) : [];

    if (interests.length === 0) {
      const pick = openMentors[Math.floor(Math.random() * openMentors.length)];
      setModal(pick);
      return;
    }

    const matches = openMentors.filter(m =>
      interests.some((i: string) => m.topics.toLowerCase().includes(i))
    );

    if (matches.length > 0) {
      const pick = matches[Math.floor(Math.random() * matches.length)];
      setModal(pick);
    } else {
      setNoMatchInterest(interests[0]);
    }
  }

  function handleInstantSipFallback() {
    const openMentors = mentors.filter(m => m.isOpen);
    const pick = openMentors[Math.floor(Math.random() * openMentors.length)];
    setModal(pick);
    setNoMatchInterest(null);
  }

  async function handleSubmit() {
    if (!form.name || !form.email || !form.message || !modal) return;
    setSubmitting(true);
    const res = await fetch('/api/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mentorId: modal.id, seekerName: form.name, seekerEmail: form.email, message: form.message }),
    });
    if (res.ok) { setSent(true); }
    else { const data = await res.json(); alert(data.error || 'Something went wrong'); }
    setSubmitting(false);
    setTimeout(() => { setModal(null); setSent(false); setForm(f => ({ ...f, message: '' })); }, 2200);
  }

  return (
      <div style={{ fontFamily: "'Space Grotesk', sans-serif", background: '#0D1117', minHeight: '100vh', color: '#E6EDF3', overflowX: 'hidden', WebkitFontSmoothing: 'antialiased' }}>


      {/* NAV */}
      <motion.nav
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, padding: '0 20px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: scrolled ? 'rgba(13,17,23,0.95)' : 'rgba(13,17,23,0.6)', backdropFilter: 'blur(20px)', borderBottom: scrolled ? '1px solid rgba(255,255,255,0.08)' : '1px solid transparent', transition: 'background 0.3s, border-color 0.3s' }}>
          <Logo />
        {!user && (
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <Link href="/leaderboard" style={{ color: '#8B949E', textDecoration: 'none', fontSize: 14, display: 'none' }} className="desktop-only">🏆 leaderboard</Link>
          <Link href="/mentors/signup" style={{ color: '#8B949E', textDecoration: 'none', fontSize: 14, display: 'none' }} className="desktop-only">are you a mentor?</Link>
          <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
            <Link href="/sign-in" style={{ background: '#0A66C2', color: 'white', padding: '8px 20px', borderRadius: 20, fontSize: 14, fontWeight: 600, textDecoration: 
'none', display: 'block' }}>sign in</Link>
          </motion.div>
        </div>
        )}
      </motion.nav>

      {/* HERO */}
      <section style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 40px 60px', textAlign: 'center' }}>

        {/* live badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(112,181,249,0.08)', border: '1px solid rgba(112,181,249,0.2)', padding: '6px 16px', borderRadius: 20, fontSize: 13, color: '#70B5F9', marginBottom: 36 }}>
          <motion.span animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.5, repeat: Infinity }} style={{ width: 6, height: 6, background: '#5BDB8A', borderRadius: '50%', display: 'inline-block' }} />
          {count}+ mentors open right now
        </motion.div>

        {/* headline */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.6 }}
          style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 'clamp(52px, 7vw, 96px)', fontWeight: 700, lineHeight: 1.02, letterSpacing: -4, margin: 0 }}>
          <span style={{ display: 'block', color: '#E6EDF3' }}>Skip the Awkward.</span>
            <span style={{ display: 'block', height: 'clamp(60px, 8vw, 108px)', overflow: 'hidden', position: 'relative' }}>
              <AnimatePresence mode="wait">
                <motion.span
                  key={wordIndex}
                  initial={{ y: 60, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -60, opacity: 0 }}
                  transition={{ duration: 0.4, ease: 'easeInOut' }}
                  style={{ display: 'block', background: 'linear-gradient(135deg, #70B5F9, #0A66C2)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  {WORDS[wordIndex]}
                </motion.span>
              </AnimatePresence>
            </span>
          </h1>
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          style={{ fontSize: 18, color: '#8B949E', maxWidth: 500, lineHeight: 1.75, marginBottom: 44 }}>
          people who actually know their stuff, already open to talking. no cold message, no getting left on read. just click, connect, learn.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.62, duration: 0.5 }}
          style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
          {user ? (
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }} style={{ display: 'flex', gap: 12 }}>
              {rolesLoaded && isMentor && isSeeker && <Link href="/choose-role" style={{ display: 'block', background: '#0A66C2', color: 'white', border: 'none', padding: '14px 30px', borderRadius: 28, fontSize: 15, fontWeight: 600, textDecoration: 'none', fontFamily: 'inherit' }}>go to my dashboard →</Link>}
              {rolesLoaded && isMentor && !isSeeker && <Link href="/dashboard" style={{ display: 'block', background: '#0A66C2', color: 'white', border: 'none', padding: '14px 30px', borderRadius: 28, fontSize: 15, fontWeight: 600, textDecoration: 'none', fontFamily: 'inherit' }}>go to my dashboard →</Link>}
              {rolesLoaded && isSeeker && !isMentor && (
                <>
                  <Link href="/seekers" style={{ display: 'block', background: 'transparent', color: '#70B5F9', border: '1px solid rgba(112,181,249,0.3)', padding: '14px 30px', borderRadius: 28, fontSize: 15, fontWeight: 500, textDecoration: 'none' }}>find your sip →</Link>
                  <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }} onClick={handleInstantSip} style={{ background: 'transparent', color: '#5BDB8A', border: '1px solid rgba(91,219,138,0.3)', padding: '14px 30px', borderRadius: 28, fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>âš¡ instant sip</motion.button>
                </>
              )}
              {rolesLoaded && !isMentor && !isSeeker && <Link href="/seekers" style={{ display: 'block', background: '#0A66C2', color: 'white', border: 'none', padding: '14px 30px', borderRadius: 28, fontSize: 15, fontWeight: 600, textDecoration: 'none', fontFamily: 'inherit' }}>find your sip →</Link>}
            </motion.div>
          ) : (
            <>
          <motion.button
            whileHover={{ scale: 1.05, background: '#0856A8' }}
            whileTap={{ scale: 0.97 }}
            onClick={() => document.getElementById('mentors')?.scrollIntoView({ behavior: 'smooth' })}
            style={{ background: '#0A66C2', color: 'white', border: 'none', padding: '14px 30px', borderRadius: 28, fontSize: 15, fontWeight: 600, cursor: 'pointer', 
fontFamily: 'inherit', transition: 'background 0.2s' }}>
            find your sip ☕
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleInstantSip}
            style={{ background: 'transparent', color: '#5BDB8A', border: '1px solid rgba(91,219,138,0.3)', padding: '14px 30px', borderRadius: 28, fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
            ⚡ instant sip
          </motion.button>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
            <Link href="/mentors/signup" style={{ display: 'block', background: 'transparent', color: '#70B5F9', border: '1px solid rgba(112,181,249,0.3)', padding: '14px 30px', borderRadius: 28, fontSize: 15, fontWeight: 500, textDecoration: 'none' }}>join as mentor →</Link>
          </motion.div>
            </>
          )}
        </motion.div>

        {/* scroll cue */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          style={{ position: 'absolute', bottom: 36, left: '50%', transform: 'translateX(-50%)' }}>
          <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 1.6, repeat: Infinity }} style={{ width: 20, height: 32, border: '2px solid rgba(255,255,255,0.15)', borderRadius: 10, display: 'flex', justifyContent: 'center', paddingTop: 6 }}>
            <motion.div animate={{ opacity: [1, 0, 1], y: [0, 8, 0] }} transition={{ duration: 1.6, repeat: Infinity }} style={{ width: 3, height: 6, background: '#70B5F9', borderRadius: 2 }} />
          </motion.div>
        </motion.div>
      </section>

      {/* HOW IT WORKS */}
      <section style={{ padding: '80px 40px', maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5 }}>
            <h2 style={{ fontSize: 36, fontWeight: 700, letterSpacing: -1.5, marginBottom: 12 }}>How It Works</h2>
          <p style={{ color: '#8B949E', marginBottom: 60, fontSize: 16 }}>Three steps. Zero cringe.</p>
        </motion.div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
          {[
            { n: '01', title: 'Pick Someone Real', body: 'Browse people who actually said yes to being here. Every card is a green light.' },
            { n: '02', title: 'Send Your Ask', body: 'One short form. Your name, your email, what\'s on your mind. That\'s it.' },
            { n: '03', title: 'Show Up', body: 'They get an email. You get a reply. You both get on a call. Easy.' },
          ].map((step, i) => (
            <motion.div
              key={step.n}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.5, delay: i * 0.12 }}
              style={{ background: '#161B22', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, padding: '32px 28px', textAlign: 'left' }}>
              <div style={{ fontFamily: 'Space Mono', fontSize: 13, color: '#0A66C2', marginBottom: 16, fontWeight: 700 }}>{step.n}</div>
              <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 10 }}>{step.title}</div>
              <div style={{ color: '#8B949E', fontSize: 14, lineHeight: 1.7 }}>{step.body}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* DIRECTORY */}
        {liveRooms.length > 0 && (
          <section style={{ padding: '40px 20px 0', maxWidth: 1200, margin: '0 auto' }}>
            <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <motion.span animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.2, repeat: Infinity }} style={{ width: 10, height: 10, borderRadius: '50%', background: '#DC2626', display: 'inline-block' }} />
              Live Now
            </h2>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
              {liveRooms.map(r => (
                <Link key={r.id} href={user ? `/rooms/${r.id}` : '/sign-in'} onClick={e => { if (!user) { e.preventDefault(); router.push('/sign-in'); } }} style={{ textDecoration: 'none', background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.25)', borderRadius: 14, padding: '14px 20px', color: '#E6EDF3', minWidth: 220 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{r.title}</div>
                  <div style={{ color: '#8B949E', fontSize: 12, marginTop: 4 }}>{r.firstName} {r.lastName} · {r.role} @ {r.company}</div>
                  <div style={{ color: '#F87171', fontSize: 12, marginTop: 6, fontWeight: 600 }}>join now →</div>
                </Link>
              ))}
            </div>
          </section>
        )}

        <section id="mentors" style={{ padding: '60px 20px 20px', maxWidth: 1200, margin: '0 auto' }}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5 }}>
            <h2 style={{ fontSize: 36, fontWeight: 700, letterSpacing: -1.5, marginBottom: 8 }}>Who&apos;s Open Right Now</h2>
          <p style={{ color: '#8B949E', marginBottom: 32, fontSize: 15 }}>Every person here said yes to showing up. No chasing required.</p>
        </motion.div>

        {/* SEARCH */}
        <div style={{ position: 'relative', marginBottom: 16, maxWidth: 480 }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="search by name, role, company, topic..."
            style={{ width: '100%', background: '#161B22', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, padding: '13px 20px 13px 44px', color: '#E6EDF3', fontSize: 15, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
          />
          <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#8B949E' }}>🔍</span>
        </div>

        {/* AI MATCH */}
        <div style={{ marginBottom: 24, maxWidth: 480 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              value={aiQuery}
              onChange={e => setAiQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAIMatch()}
              placeholder="or describe what you need, e.g. 'advice switching into product'"
              style={{ flex: 1, background: '#161B22', border: '1px solid rgba(112,181,249,0.2)', borderRadius: 14, padding: '13px 18px', color: '#E6EDF3', fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
            />
            <button onClick={handleAIMatch} disabled={matching} style={{ background: '#0A66C2', color: 'white', border: 'none', borderRadius: 14, padding: '0 22px', fontSize: 14, fontWeight: 600, cursor: matching ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
              {matching ? '...' : 'match me'}
            </button>
          </div>
          {aiMatches && (
            <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {aiMatches.length === 0 ? (
                <p style={{ color: '#8B949E', fontSize: 14 }}>no strong matches right now — try the directory below.</p>
            ) : (
                aiMatches.map(m => (
                  <div key={m.id} onClick={() => window.location.href = `/mentors/${m.id}`} style={{ background: '#161B22', border: '1px solid rgba(112,181,249,0.2)', borderRadius: 14, padding: '16px 20px', cursor: 'pointer' }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{m.firstName} {m.lastName} · {m.role} @ {m.company}</div>
                    <div style={{ color: '#70B5F9', fontSize: 13, marginTop: 4 }}>{m.reason}</div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* FILTERS */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.1 }}
          style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 40 }}>
          {ALL_FILTERS.map(f => (
            <motion.button
              key={f}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setFilter(f)}
              style={{ padding: '8px 20px', borderRadius: 20, border: '1px solid', borderColor: filter === f ? '#0A66C2' : 'rgba(255,255,255,0.1)', background: filter === f ? 'rgba(10,102,194,0.15)' : 'transparent', color: filter === f ? '#70B5F9' : '#8B949E', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s' }}>
              {f}
            </motion.button>
          ))}
        </motion.div>

        {/* CARDS */}
        {loading ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16, marginBottom: 80 }}>
            {[1,2,3].map(n => (
              <div key={n} style={{ background: '#161B22', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 18, padding: 24, height: 220 }}>
                <motion.div animate={{ opacity: [0.4, 0.8, 0.4] }} transition={{ duration: 1.4, repeat: Infinity }} style={{ width: '60%', height: 16, background: 'rgba(255,255,255,0.07)', borderRadius: 8, marginBottom: 12 }} />
                <motion.div animate={{ opacity: [0.4, 0.8, 0.4] }} transition={{ duration: 1.4, repeat: Infinity, delay: 0.2 }} style={{ width: '40%', height: 12, background: 'rgba(255,255,255,0.05)', borderRadius: 8, marginBottom: 20 }} />
                <motion.div animate={{ opacity: [0.4, 0.8, 0.4] }} transition={{ duration: 1.4, repeat: Infinity, delay: 0.4 }} style={{ width: '100%', height: 60, background: 'rgba(255,255,255,0.04)', borderRadius: 10 }} />
              </div>
            ))}
          </motion.div>
        ) : filtered.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: 'center', padding: '80px 0', color: '#8B949E', marginBottom: 80 }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>☕</div>
            <p>no mentors in this category yet. check back soon.</p>
          </motion.div>
        ) : (
          <motion.div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 24 }}>
          <AnimatePresence mode="popLayout">
            {teaserMentors.map((mentor, i) => (
              <motion.div
                key={mentor.id}
                layout
                initial={{ opacity: 0, y: 30, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.35, delay: i * 0.06 }}
               whileHover={{ y: -6 }}
                onClick={() => window.location.href = `/mentors/${mentor.id}`}
                style={{ background: '#161B22', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 18, padding: 24, cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                  <div style={{ width: 46, height: 46, borderRadius: '50%', background: AVATARS[i % AVATARS.length], display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 15, flexShrink: 0 }}>{INITIALS(mentor)}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 15 }}>{mentor.firstName} {mentor.lastName}</div>
                    <div style={{ color: '#8B949E', fontSize: 13 }}>{mentor.role} @ {mentor.company}</div>
                  </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                    <motion.span animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 2, repeat: Infinity }} style={{ fontSize: 11, color: '#5BDB8A', fontWeight: 600 }}>● open</motion.span>
                    <span style={{ fontSize: 10, color: '#8B949E', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: 8 }}>{mentor.availability}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
                  {mentor.topics.split(',').map(t => (
                    <span key={t} style={{ background: 'rgba(112,181,249,0.07)', border: '1px solid rgba(112,181,249,0.15)', color: '#70B5F9', padding: '3px 10px', borderRadius: 12, fontSize: 12 }}>{t.trim()}</span>
                  ))}
                </div>
                  <p style={{ color: '#8B949E', fontSize: 13, lineHeight: 1.65, marginBottom: 20 }}>&quot;{mentor.bio}&quot;</p>
                <div style={{ display: 'flex', gap: 8 }}>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={e => { e.stopPropagation(); if (!user) { router.push('/sign-in'); } else if (rolesLoaded && !isSeeker) { router.push('/seekers/onboarding'); } else { setModal(mentor); } }}
                    style={{ flex: 1, background: 'rgba(10,102,194,0.12)', border: '1px solid rgba(10,102,194,0.3)', color: '#70B5F9', padding: '11px 0', borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                    request a sip →
                  </motion.button>
                  <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
                    <Link href={`/mentors/${mentor.id}`} onClick={e => e.stopPropagation()} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 44, height: 44, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, color: '#8B949E', textDecoration: 'none', fontSize: 16 }}>↗</Link>
                  </motion.div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
        )}

        {!loading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={{ background: 'linear-gradient(135deg, rgba(10,102,194,0.12), rgba(112,181,249,0.04))', border: '1px solid rgba(112,181,249,0.25)', borderRadius: 20, padding: '32px 36px', marginBottom: 80, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 6 }}>These are just the top mentors right now</div>
              <div style={{ color: '#8B949E', fontSize: 14 }}>Sign up free to see everyone open, filter by topic, and request a sip.</div>
            </div>
            <Link href="/sign-up" style={{ background: '#0A66C2', color: 'white', padding: '13px 28px', borderRadius: 12, fontWeight: 600, fontSize: 14, textDecoration: 'none', whiteSpace: 'nowrap' }}>
              see all mentors {String.fromCharCode(0x2192)}
            </Link>
          </motion.div>
        )}
          </section>

      {/* NO MATCH PROMPT */}
      <AnimatePresence>
        {noMatchInterest && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={e => { if (e.target === e.currentTarget) setNoMatchInterest(null); }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, backdropFilter: 'blur(4px)' }}>
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              style={{ background: '#161B22', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 22, padding: 36, width: '100%', maxWidth: 400, textAlign: 'center' }}>
              <div style={{ fontSize: 40, marginBottom: 16 }}>☕</div>
              <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>no one in {noMatchInterest} is open right now</div>
              <p style={{ color: '#8B949E', fontSize: 14, marginBottom: 28 }}>want to talk to someone from a different area instead?</p>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setNoMatchInterest(null)} style={{ flex: 1, background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#8B949E', padding: '12px 0', borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>no thanks</button>
                <button onClick={handleInstantSipFallback} style={{ flex: 1, background: '#0A66C2', border: 'none', color: 'white', padding: '12px 0', borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>sure, find someone</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* MODAL */}
      <AnimatePresence>
        {modal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={e => { if (e.target === e.currentTarget) setModal(null); }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, backdropFilter: 'blur(4px)' }}>
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              style={{ background: '#161B22', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 22, padding: 36, width: '100%', maxWidth: 440 }}>
              <div style={{ fontWeight: 700, fontSize: 22, marginBottom: 4 }}>request a sip ☕</div>
              <div style={{ color: '#8B949E', fontSize: 14, marginBottom: 28 }}>sending to {modal.firstName} {modal.lastName} · {modal.role} @ {modal.company}</div>
              <AnimatePresence mode="wait">
                {sent ? (
                  <motion.div
                    key="sent"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    style={{ textAlign: 'center', padding: '40px 0' }}>
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                      style={{ fontSize: 48, marginBottom: 16 }}>✓</motion.div>
                      <div style={{ color: '#5BDB8A', fontSize: 18, fontWeight: 600 }}>sent. they&apos;ll reach out soon.</div>
                  </motion.div>
                ) : (
                  <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <div style={{ marginBottom: 16 }}>
                      <label style={{ fontSize: 13, color: '#8B949E', display: 'block', marginBottom: 6 }}>your name</label>
                      <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="what do people call you?" style={{ width: '100%', background: '#0D1117', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '11px 14px', color: '#E6EDF3', fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }} />
                    </div>
                    <div style={{ marginBottom: 16 }}>
                      <label style={{ fontSize: 13, color: '#8B949E', display: 'block', marginBottom: 6 }}>your email</label>
                      <input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="so they can reach back" type="email" style={{ width: '100%', background: '#0D1117', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '11px 14px', color: '#E6EDF3', fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }} />
                    </div>
                    <div style={{ marginBottom: 28 }}>
                      <label style={{ fontSize: 13, color: '#8B949E', display: 'block', marginBottom: 6 }}>what&apos;s on your mind?</label>
                      <textarea value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} placeholder="one or two sentences — what are you trying to figure out?" rows={3} style={{ width: '100%', background: '#0D1117', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '11px 14px', color: '#E6EDF3', fontSize: 14, outline: 'none', resize: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }} />
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.02, background: '#0856A8' }}
                      whileTap={{ scale: 0.97 }}
                      onClick={handleSubmit}
                      style={{ width: '100%', background: submitting ? '#1E3A5F' : '#0A66C2', color: 'white', border: 'none', padding: '13px 0', borderRadius: 12, fontSize: 15, fontWeight: 600, cursor: submitting ? 'not-allowed' : 'pointer', fontFamily: 'inherit', transition: 'background 0.2s' }}>
                      {submitting ? 'sending...' : 'send it ✦'}
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FOOTER */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.08)', padding: '56px 40px 40px', color: '#8B949E' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 40, marginBottom: 40 }}>
          <div style={{ maxWidth: 280 }}>
            <div style={{ marginBottom: 12 }}><Logo /></div>
            <p style={{ fontSize: 13, lineHeight: 1.7 }}>Live mentorship, no scheduling, no cold DMs. Just people who showed up and said yes.</p>
          </div>
          <div style={{ display: 'flex', gap: 60, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#E6EDF3', marginBottom: 14, letterSpacing: 0.5, textTransform: 'uppercase' }}>Product</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13 }}>
                <Link href="/#mentors" style={{ color: '#8B949E', textDecoration: 'none' }}>Find a mentor</Link>
                <Link href="/mentors/signup" style={{ color: '#8B949E', textDecoration: 'none' }}>Become a mentor</Link>
                <Link href="/leaderboard" style={{ color: '#8B949E', textDecoration: 'none' }}>Leaderboard</Link>
              </div>
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#E6EDF3', marginBottom: 14, letterSpacing: 0.5, textTransform: 'uppercase' }}>Company</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13 }}>
                <Link href="/about" style={{ color: '#8B949E', textDecoration: 'none' }}>About</Link>
              </div>
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#E6EDF3', marginBottom: 14, letterSpacing: 0.5, textTransform: 'uppercase' }}>Legal</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13 }}>
                <Link href="/privacy" style={{ color: '#8B949E', textDecoration: 'none' }}>Privacy Policy</Link>
                <Link href="/terms" style={{ color: '#8B949E', textDecoration: 'none' }}>Terms of Service</Link>
                <Link href="/conduct" style={{ color: '#8B949E', textDecoration: 'none' }}>Code of Conduct</Link>
              </div>
            </div>
          </div>
        </div>
        <div style={{ maxWidth: 1200, margin: '0 auto', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 24, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, fontSize: 12 }}>
          <span>© {new Date().getFullYear()} Sip. All rights reserved.</span>
          <span>Made for the curious ones.</span>
        </div>
      </footer>
    </div>
  );
}