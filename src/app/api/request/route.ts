import { db } from '@/db';
import { requests, mentors, seekers } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { transporter } from '@/lib/mailer';
import { auth } from '@clerk/nextjs/server';
import { emailLimiter, getIp } from '@/lib/ratelimit';
import { handleApiError } from '@/lib/api-handler';
import { escapeHtml } from '@/lib/utils';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NAME_REGEX = /^[^\d]+$/;

export async function POST(req: Request) {
  try {
    const ip = getIp(req);
    const { success } = await emailLimiter.limit(ip);
    if (!success) return NextResponse.json({ error: 'Too many requests. Try again in a bit.' }, { status: 429 });

    const { mentorId, seekerName, seekerEmail, message } = await req.json();
    if (!mentorId || !seekerName || !seekerEmail || !message) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }
    if (message.length > 1000) return NextResponse.json({ error: 'Message is too long' }, { status: 400 });
    if (!EMAIL_REGEX.test(seekerEmail)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    }
    if (!NAME_REGEX.test(seekerName)) {
      return NextResponse.json({ error: 'Name cannot contain numbers' }, { status: 400 });
    }

    const mentorResult = await db.select().from(mentors).where(eq(mentors.id, mentorId));
    const mentor = mentorResult[0];
    if (!mentor) return NextResponse.json({ error: 'Mentor not found' }, { status: 404 });

    const { userId } = await auth();
    if (userId && mentor.clerkId === userId) {
      return NextResponse.json({ error: "You can't send a sip request to your own mentor profile." }, { status: 403 });
    }
    if (mentor.email && mentor.email.toLowerCase() === seekerEmail.toLowerCase()) {
      return NextResponse.json({ error: "You can't send a sip request to your own mentor profile." }, { status: 403 });
    }

    let seekerLinkedin: string | null = null;
    if (userId) {
      const seekerResult = await db.select().from(seekers).where(eq(seekers.clerkId, userId));
      seekerLinkedin = seekerResult[0]?.linkedin || null;
    }

    const created = await db.insert(requests).values({
      mentorId, seekerClerkId: userId || null, seekerName, seekerEmail, seekerLinkedin, message, status: 'pending',
    }).returning();

    transporter.sendMail({
      from: `Sip <${process.env.GMAIL_USER}>`,
      to: mentor.email,
      subject: `${seekerName} wants to sip with you ☕`,
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;background:#0D1117;color:#E6EDF3;padding:40px;border-radius:16px;">
          <div style="font-size:28px;font-weight:700;color:#70B5F9;margin-bottom:8px;">sip ☕</div>
          <h2 style="font-size:22px;margin-bottom:16px;color:#E6EDF3;">New sip request</h2>
          <p style="color:#C9D1D9;font-size:15px;line-height:1.7;margin-bottom:8px;"><strong>${escapeHtml(seekerName)}</strong> (${escapeHtml(seekerEmail)}) wants to connect:</p>
          <p style="color:#8B949E;font-size:14px;line-height:1.7;margin-bottom:24px;">"${escapeHtml(message)}"</p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard" style="display:inline-block;background:#0A66C2;color:white;padding:14px 28px;border-radius:12px;text-decoration:none;font-weight:600;font-size:15px;">View in Dashboard →</a>
        </div>
      `,
    }).catch(err => console.error('request email failed:', err));

    return NextResponse.json(created[0]);
  } catch (err) {
    return handleApiError(err, 'POST /api/request');
  }
}