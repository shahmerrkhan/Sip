import { auth } from '@clerk/nextjs/server';
import { db } from '@/db';
import { mentors, seekers } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { transporter } from '@/lib/mailer';

async function notifyMatchingSeekers(mentor: typeof mentors.$inferSelect) {
  const mentorTopics = mentor.topics.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
  if (mentorTopics.length === 0) return;

  const allSeekers = await db.select().from(seekers);
  const now = Date.now();
  const matches = allSeekers.filter(s => {
    const interests = (s.interests || '').split(',').map(i => i.trim().toLowerCase()).filter(Boolean);
    const isMatch = interests.some(i => mentorTopics.includes(i));
    if (!isMatch) return false;
    if (s.lastMatchEmailAt && now - new Date(s.lastMatchEmailAt).getTime() < 7 * 24 * 60 * 60 * 1000) return false;
    return true;
  });

  for (const seeker of matches) {
    if (!seeker.email) continue;
    await db.update(seekers).set({ lastMatchEmailAt: new Date() }).where(eq(seekers.id, seeker.id));
    await transporter.sendMail({
      from: `Sip <${process.env.GMAIL_USER}>`,
      to: seeker.email,
      subject: `A mentor matching your interests just joined Sip ☕`,
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;background:#0D1117;color:#E6EDF3;padding:40px;border-radius:16px;">
          <div style="font-size:28px;font-weight:700;color:#70B5F9;margin-bottom:8px;">sip ☕</div>
          <h2 style="font-size:22px;margin-bottom:16px;color:#E6EDF3;">New mentor for you</h2>
          <p style="color:#C9D1D9;font-size:15px;line-height:1.7;margin-bottom:8px;"><strong>${mentor.firstName} ${mentor.lastName}</strong>, ${mentor.role} @ ${mentor.company}, just opened up on Sip.</p>
          <p style="color:#8B949E;font-size:14px;line-height:1.7;margin-bottom:24px;">Topics: ${mentor.topics}</p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/seekers" style="display:inline-block;background:#0A66C2;color:white;padding:14px 28px;border-radius:12px;text-decoration:none;font-weight:600;font-size:15px;">View Mentor →</a>
        </div>
      `,
    });
  }
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { firstName, lastName, email, role, company, bio, topics, calendarLink, availability, linkedin, showLinkedin } = body;

  if (!firstName || !lastName || !email || !role || !company || !bio || !topics || !calendarLink) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }
  if (bio.length > 500) return NextResponse.json({ error: 'Bio is too long' }, { status: 400 });
  if (topics.length > 300) return NextResponse.json({ error: 'Topics field is too long' }, { status: 400 });
  if (firstName.length > 50 || lastName.length > 50 || role.length > 100 || company.length > 100) {
    return NextResponse.json({ error: 'One of the fields is too long' }, { status: 400 });
  }

  const existing = await db.select().from(mentors).where(eq(mentors.clerkId, userId));

  if (existing.length > 0) {
    const updated = await db.update(mentors)
      .set({ firstName, lastName, email, role, company, bio, topics, calendarLink, availability, linkedin, showLinkedin: !!showLinkedin })
      .where(eq(mentors.clerkId, userId))
      .returning();
    return NextResponse.json(updated[0]);
  }

  const mentor = await db.insert(mentors).values({
    clerkId: userId, firstName, lastName, email, role, company, bio, topics,
    calendarLink, availability: availability || 'flexible', linkedin, showLinkedin: !!showLinkedin,
  }).returning();

  notifyMatchingSeekers(mentor[0]).catch(err => console.error('notifyMatchingSeekers failed:', err));

  return NextResponse.json(mentor[0]);
}

function sanitizeMentor(m: typeof mentors.$inferSelect) {
  const { linkedin, showLinkedin, clerkId, email, ...rest } = m;
  return { ...rest, linkedin: showLinkedin ? linkedin : null, showLinkedin };
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const all = url.searchParams.get('all');
  const leaderboard = url.searchParams.get('leaderboard');

  if (leaderboard === 'true') {
    const result = await db.select().from(mentors).orderBy(desc(mentors.xp)).limit(20);
    return NextResponse.json(result.map(sanitizeMentor));
  }

  if (all === 'true') {
    const result = await db.select().from(mentors).where(eq(mentors.isOpen, true)).orderBy(desc(mentors.createdAt));
    return NextResponse.json(result.map(sanitizeMentor));
  }

  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const result = await db.select().from(mentors).where(eq(mentors.clerkId, userId));
  if (result.length === 0) return NextResponse.json(null, { status: 404 });
  return NextResponse.json(result[0]);
}

export async function PATCH(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const existing = await db.select().from(mentors).where(eq(mentors.clerkId, userId));
  const wasOpen = existing[0]?.isOpen;

  const { isOpen } = await req.json();
  if (typeof isOpen !== 'boolean') return NextResponse.json({ error: 'isOpen must be true or false' }, { status: 400 });

  const updated = await db.update(mentors).set({ isOpen }).where(eq(mentors.clerkId, userId)).returning();

  if (isOpen && !wasOpen) {
    notifyMatchingSeekers(updated[0]).catch(err => console.error('notifyMatchingSeekers failed:', err));
  }

  return NextResponse.json(updated[0]);
}