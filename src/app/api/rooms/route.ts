import { auth } from '@clerk/nextjs/server';
import { db } from '@/db';
import { rooms, mentors } from '@/db/schema';
import { eq, and, lt } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { handleApiError } from '@/lib/api-handler';
import { mutationLimiter } from '@/lib/ratelimit';

let lastCleanup = 0;
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000; // run at most once per 5 min regardless of read volume

export async function GET() {
  try {
    const now = Date.now();
    if (now - lastCleanup > CLEANUP_INTERVAL_MS) {
      lastCleanup = now;
      const cutoff = new Date(now - 6 * 60 * 60 * 1000);
      await db.update(rooms).set({ status: 'ended', endedAt: new Date() }).where(and(eq(rooms.status, 'live'), lt(rooms.startedAt, cutoff)));
    }

    const result = await db
      .select({
        id: rooms.id, title: rooms.title, roomUrl: rooms.roomUrl, startedAt: rooms.startedAt,
        mentorId: mentors.id, firstName: mentors.firstName, lastName: mentors.lastName,
        role: mentors.role, company: mentors.company,
      })
      .from(rooms)
      .innerJoin(mentors, eq(rooms.mentorId, mentors.id))
      .where(eq(rooms.status, 'live'));
    return NextResponse.json(result);
  } catch (err) {
    return handleApiError(err, 'GET /api/rooms');
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { success } = await mutationLimiter.limit(userId);
    if (!success) return NextResponse.json({ error: 'Too many requests. Slow down a bit.' }, { status: 429 });

    const mentorResult = await db.select().from(mentors).where(eq(mentors.clerkId, userId));
    const mentor = mentorResult[0];
    if (!mentor) return NextResponse.json({ error: 'No mentor profile' }, { status: 403 });

    const existing = await db.select().from(rooms).where(and(eq(rooms.mentorId, mentor.id), eq(rooms.status, 'live')));
    if (existing.length > 0) return NextResponse.json(existing[0]);

    const { title } = await req.json();
    if (title && title.length > 100) return NextResponse.json({ error: 'Title is too long' }, { status: 400 });
    const roomName = `sip-${mentor.id.slice(0, 8)}-${Date.now()}`;
    const roomUrl = `https://meet.jit.si/${roomName}`;

    const created = await db.insert(rooms).values({
      mentorId: mentor.id,
      title: title || `${mentor.firstName}'s Sip Room`,
      roomName,
      roomUrl,
    }).returning();

    return NextResponse.json(created[0]);
  } catch (err) {
    return handleApiError(err, 'POST /api/rooms');
  }
}

export async function DELETE() {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const mentorResult = await db.select().from(mentors).where(eq(mentors.clerkId, userId));
    const mentor = mentorResult[0];
    if (!mentor) return NextResponse.json({ error: 'No mentor profile' }, { status: 403 });

    await db.update(rooms).set({ status: 'ended' }).where(and(eq(rooms.mentorId, mentor.id), eq(rooms.status, 'live')));
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err, 'DELETE /api/rooms');
  }
}