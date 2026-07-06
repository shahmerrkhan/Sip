import { auth } from '@clerk/nextjs/server';
import { db } from '@/db';
import { requests, mentors } from '@/db/schema';
import { eq, and, isNotNull } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { transporter } from '@/lib/mailer';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const mentorResult = await db.select().from(mentors).where(eq(mentors.clerkId, userId));
  if (!mentorResult[0]) return NextResponse.json({ error: 'No mentor profile' }, { status: 403 });
  const mentor = mentorResult[0];

  const { status } = await req.json();
  if (!['accepted', 'declined'].includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  }

  const existingRequest = await db.select().from(requests).where(eq(requests.id, id));
  if (!existingRequest[0]) return NextResponse.json({ error: 'Request not found' }, { status: 404 });
  if (existingRequest[0].mentorId !== mentor.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const respondedAt = new Date();
  const updated = await db.update(requests)
    .set({ status, respondedAt })
    .where(eq(requests.id, id))
    .returning();

  const r = updated[0];
  if (!r) return NextResponse.json({ error: 'Request not found' }, { status: 404 });

  const respondedRequests = await db.select().from(requests).where(and(eq(requests.mentorId, mentor.id), isNotNull(requests.respondedAt)));
  if (respondedRequests.length > 0) {
    const totalMinutes = respondedRequests.reduce((sum, req) => {
      if (!req.respondedAt) return sum;
      return sum + (new Date(req.respondedAt).getTime() - new Date(req.createdAt).getTime()) / 60000;
    }, 0);
    const avgResponseMinutes = Math.round(totalMinutes / respondedRequests.length);
    await db.update(mentors).set({ avgResponseMinutes }).where(eq(mentors.id, mentor.id));
  }

  if (status === 'accepted') {
    const newSipCount = mentor.sipCount + 1;
    const newXp = mentor.xp + 25;
    const milestones: [number, string][] = [[1, 'first-sip'], [5, 'regular'], [10, 'veteran'], [25, 'legend'], [50, 'goat']];
    const existingBadges = mentor.badges ? mentor.badges.split(',').filter(Boolean) : [];
    const newBadges = [...existingBadges];
    for (const [threshold, badge] of milestones) {
      if (newSipCount >= threshold && !newBadges.includes(badge)) newBadges.push(badge);
    }
    await db.update(mentors)
      .set({ sipCount: newSipCount, xp: newXp, badges: newBadges.join(',') })
      .where(eq(mentors.id, mentor.id));

    transporter.sendMail({
      from: `Sip <${process.env.GMAIL_USER}>`,
      to: r.seekerEmail,
      subject: `${mentor.firstName} accepted your sip request ☕`,
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;background:#0D1117;color:#E6EDF3;padding:40px;border-radius:16px;">
          <div style="font-size:28px;font-weight:700;color:#70B5F9;margin-bottom:8px;">sip ☕</div>
          <h2 style="font-size:22px;margin-bottom:16px;color:#E6EDF3;">Your request was accepted 🎉</h2>
          <p style="color:#C9D1D9;font-size:15px;line-height:1.7;margin-bottom:24px;">
            <strong style="color:#E6EDF3;">${mentor.firstName} ${mentor.lastName}</strong> (${mentor.role} @ ${mentor.company}) accepted your sip request. Book a time using their calendar link below.
          </p>
          <a href="${mentor.calendarLink}" style="display:inline-block;background:#0A66C2;color:white;padding:14px 28px;border-radius:12px;text-decoration:none;font-weight:600;font-size:15px;">Book Your Sip →</a>
          <p style="color:#8B949E;font-size:13px;margin-top:24px;">Show up curious. That's all they ask.</p>
        </div>
      `,
    });
  }

  if (status === 'declined') {
    transporter.sendMail({
      from: `Sip <${process.env.GMAIL_USER}>`,
      to: r.seekerEmail,
      subject: `Update on your sip request`,
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;background:#0D1117;color:#E6EDF3;padding:40px;border-radius:16px;">
          <div style="font-size:28px;font-weight:700;color:#70B5F9;margin-bottom:8px;">sip ☕</div>
          <h2 style="font-size:22px;margin-bottom:16px;color:#E6EDF3;">Not this time</h2>
          <p style="color:#C9D1D9;font-size:15px;line-height:1.7;margin-bottom:24px;">
            ${mentor.firstName} wasn't able to connect right now. Don't sweat it — there are plenty of other people open on Sip.
          </p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}" style="display:inline-block;background:#161B22;color:#70B5F9;padding:14px 28px;border-radius:12px;text-decoration:none;font-weight:600;font-size:15px;border:1px solid rgba(112,181,249,0.3);">Browse More Mentors →</a>
        </div>
      `,
    });
  }

  return NextResponse.json(updated[0]);
}