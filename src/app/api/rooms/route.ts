import { auth } from '@clerk/nextjs/server';
import { db } from '@/db';
import { rooms, mentors } from '@/db/schema';
import { eq, and, lt } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function GET() {
    const cutoff = new Date(Date.now() - 6 * 60 * 60 * 1000); // 6 hours
    await db.update(rooms).set({ status: 'ended', endedAt: new Date() }).where(and(eq(rooms.status, 'live'), lt(rooms.startedAt, cutoff)));

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
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

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
}

export async function DELETE(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const mentorResult = await db.select().from(mentors).where(eq(mentors.clerkId, userId));
  const mentor = mentorResult[0];
  if (!mentor) return NextResponse.json({ error: 'No mentor profile' }, { status: 403 });

  await db.update(rooms).set({ status: 'ended' }).where(and(eq(rooms.mentorId, mentor.id), eq(rooms.status, 'live')));
  return NextResponse.json({ ok: true });
}