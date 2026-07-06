import { auth, clerkClient } from '@clerk/nextjs/server';
import { db } from '@/db';
import { asks, mentors } from '@/db/schema';
import { eq, and, gte } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { transporter } from '@/lib/mailer';
import { mutationLimiter } from '@/lib/ratelimit';

const WEEKLY_CAP = 2;

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { success } = await mutationLimiter.limit(userId);
  if (!success) return NextResponse.json({ error: 'Too many requests. Slow down a bit.' }, { status: 429 });

  const { mentorId, question } = await req.json();
  if (!mentorId || !question) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  if (question.length > 500) return NextResponse.json({ error: 'Question is too long' }, { status: 400 });

  const mentorResult = await db.select().from(mentors).where(eq(mentors.id, mentorId));
  const mentor = mentorResult[0];
  if (!mentor) return NextResponse.json({ error: 'Mentor not found' }, { status: 404 });

  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const seekerEmail = user.emailAddresses[0]?.emailAddress || '';
  const seekerName = user.firstName || 'Someone';

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const recentAsks = await db.select().from(asks).where(and(eq(asks.seekerClerkId, userId), eq(asks.mentorId, mentorId), gte(asks.createdAt, weekAgo)));
  if (recentAsks.length >= WEEKLY_CAP) {
    return NextResponse.json({ error: `You can only ask ${WEEKLY_CAP} questions per mentor per week.` }, { status: 429 });
  }

  const created = await db.insert(asks).values({ mentorId, seekerClerkId: userId, seekerName, seekerEmail, question }).returning();

  await transporter.sendMail({
    from: `Sip <${process.env.GMAIL_USER}>`,
    to: mentor.email,
    subject: `${seekerName} asked you a quick question on Sip`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;background:#0D1117;color:#E6EDF3;padding:40px;border-radius:16px;">
        <div style="font-size:28px;font-weight:700;color:#70B5F9;margin-bottom:8px;">sip</div>
        <h2 style="font-size:22px;margin-bottom:16px;color:#E6EDF3;">Quick question from ${seekerName}</h2>
        <p style="color:#8B949E;font-size:14px;line-height:1.7;margin-bottom:24px;">"${question}"</p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard" style="display:inline-block;background:#0A66C2;color:white;padding:14px 28px;border-radius:12px;text-decoration:none;font-weight:600;font-size:15px;">Answer in Dashboard →</a>
      </div>
    `,
  });

  return NextResponse.json(created[0]);
}

export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const url = new URL(req.url);
  const mine = url.searchParams.get('mine');

  if (mine === 'true') {
    const result = await db.select().from(asks).where(eq(asks.seekerClerkId, userId));
    return NextResponse.json(result.reverse());
  }

  const mentorResult = await db.select().from(mentors).where(eq(mentors.clerkId, userId));
  if (!mentorResult[0]) return NextResponse.json([]);
  const result = await db.select().from(asks).where(eq(asks.mentorId, mentorResult[0].id));
  return NextResponse.json(result.reverse());
}