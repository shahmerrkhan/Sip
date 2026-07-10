import { auth, clerkClient } from '@clerk/nextjs/server';
import { db } from '@/db';
import { flags, mentors, queueEntries } from '@/db/schema';
import { eq, and, ne } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { handleApiError } from '@/lib/api-handler';
import { transporter } from '@/lib/mailer';
import { mutationLimiter } from '@/lib/ratelimit';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { success } = await mutationLimiter.limit(userId);
    if (!success) return NextResponse.json({ error: 'Too many requests. Slow down a bit.' }, { status: 429 });

    const { reportedClerkId, reportedName, reason, details } = await req.json();
    if (!reason || !details) return NextResponse.json({ error: 'Reason and details required' }, { status: 400 });

    const mentorResult = await db.select().from(mentors).where(eq(mentors.clerkId, userId));
    const reporterIsMentor = mentorResult.length > 0;

    const [flag] = await db.insert(flags).values({
      roomId: id,
      reporterClerkId: userId,
      reporterRole: reporterIsMentor ? 'mentor' : 'seeker',
      reportedClerkId,
      reportedName,
      reason,
      details,
    }).returning();

    if (reporterIsMentor) {
      await db.update(queueEntries).set({ status: 'left' })
        .where(and(eq(queueEntries.roomId, id), eq(queueEntries.seekerClerkId, reportedClerkId), ne(queueEntries.status, 'left')));
    }

    const priorFlags = await db.select().from(flags).where(and(eq(flags.reportedClerkId, reportedClerkId), ne(flags.status, 'dismissed')));
    const flagCount = priorFlags.length;

    const client = await clerkClient();
    let reportedEmail: string | null = null;
    try {
      const reportedUser = await client.users.getUser(reportedClerkId);
      reportedEmail = reportedUser.emailAddresses[0]?.emailAddress || null;
    } catch (e) {
      console.error('Could not fetch reported user email', e);
    }

    if (reportedEmail) {
      await transporter.sendMail({
        from: process.env.GMAIL_USER,
        to: reportedEmail,
        subject: 'Sip -- a report was filed about your session',
        text: `Hi ${reportedName},

A report was filed regarding your recent Sip session. Reason: ${reason}.

This is flag #${flagCount} on your account. Repeated flags can lead to a permanent ban.

Our team is reviewing it. If you believe this is a mistake, reply to this email.

-- Sip Team`,
      });
    }

    if (process.env.ADMIN_EMAIL) {
      await transporter.sendMail({
        from: process.env.GMAIL_USER,
        to: process.env.ADMIN_EMAIL,
        subject: `Sip -- new flag (${reason}) -- flag #${flagCount} for this user`,
        text: `Reporter: ${userId} (${reporterIsMentor ? 'mentor' : 'seeker'})
Reported: ${reportedName} (${reportedClerkId})
Total flags on this user: ${flagCount}
Room: ${id}
Reason: ${reason}
Details: ${details}

Review at /admin`,
      });
    }

    return NextResponse.json(flag);
  } catch (err) {
    return handleApiError(err, 'POST /api/rooms/[id]/flag');
  }
}
