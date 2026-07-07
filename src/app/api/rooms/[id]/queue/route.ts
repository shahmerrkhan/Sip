import { auth } from '@clerk/nextjs/server';
import { db } from '@/db';
import { queueEntries, rooms } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { handleApiError } from '@/lib/api-handler';
import { mutationLimiter } from '@/lib/ratelimit';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const result = await db.select().from(queueEntries)
      .where(and(eq(queueEntries.roomId, id), eq(queueEntries.status, 'waiting')))
      .orderBy(queueEntries.joinedAt);
    const active = await db.select().from(queueEntries)
      .where(and(eq(queueEntries.roomId, id), eq(queueEntries.status, 'active')));
    return NextResponse.json({ waiting: result, active: active[0] || null });
  } catch (err) {
    return handleApiError(err, 'GET /api/rooms/[id]/queue');
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { success } = await mutationLimiter.limit(userId);
    if (!success) return NextResponse.json({ error: 'Too many requests. Slow down a bit.' }, { status: 429 });

    const room = await db.select().from(rooms).where(and(eq(rooms.id, id), eq(rooms.status, 'live')));
    if (!room[0]) return NextResponse.json({ error: 'Room not found or ended' }, { status: 404 });

    const existing = await db.select().from(queueEntries).where(and(
      eq(queueEntries.roomId, id),
      eq(queueEntries.seekerClerkId, userId),
    ));
    const alreadyIn = existing.find(e => e.status === 'waiting' || e.status === 'active');
    if (alreadyIn) return NextResponse.json(alreadyIn);

    const { seekerName } = await req.json();
    if (!seekerName) return NextResponse.json({ error: 'Name is required' }, { status: 400 });

    const created = await db.insert(queueEntries).values({
      roomId: id, seekerClerkId: userId, seekerName, status: 'waiting',
    }).returning();

    return NextResponse.json(created[0]);
  } catch (err) {
    return handleApiError(err, 'POST /api/rooms/[id]/queue');
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await db.update(queueEntries)
      .set({ status: 'left' })
      .where(and(eq(queueEntries.roomId, id), eq(queueEntries.seekerClerkId, userId), eq(queueEntries.status, 'waiting')));

    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err, 'DELETE /api/rooms/[id]/queue');
  }
}