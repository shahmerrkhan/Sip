import { auth } from '@clerk/nextjs/server';
import { db } from '@/db';
import { rooms, mentors } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await db
    .select({
      id: rooms.id, title: rooms.title, roomUrl: rooms.roomUrl, status: rooms.status,
      firstName: mentors.firstName, lastName: mentors.lastName, role: mentors.role, company: mentors.company,
    })
    .from(rooms)
    .innerJoin(mentors, eq(rooms.mentorId, mentors.id))
    .where(eq(rooms.id, id));
  if (!result[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(result[0]);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const mentorResult = await db.select().from(mentors).where(eq(mentors.clerkId, userId));
  const mentor = mentorResult[0];
  if (!mentor) return NextResponse.json({ error: 'No mentor profile' }, { status: 403 });

  const updated = await db.update(rooms)
    .set({ status: 'ended', endedAt: new Date() })
    .where(and(eq(rooms.id, id), eq(rooms.mentorId, mentor.id)))
    .returning();

  if (!updated[0]) return NextResponse.json({ error: 'Not found or not yours' }, { status: 404 });

  return NextResponse.json(updated[0]);
}