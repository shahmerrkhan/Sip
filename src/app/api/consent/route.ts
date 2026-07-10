import { auth } from '@clerk/nextjs/server';
import { db } from '@/db';
import { consents } from '@/db/schema';
import { NextResponse } from 'next/server';
import { handleApiError } from '@/lib/api-handler';
import { mutationLimiter } from '@/lib/ratelimit';

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { success } = await mutationLimiter.limit(userId);
    if (!success) return NextResponse.json({ error: 'Too many requests. Slow down a bit.' }, { status: 429 });

    const { roomId, context } = await req.json();
    if (!context || (context !== 'call' && context !== 'message')) {
      return NextResponse.json({ error: 'Invalid context' }, { status: 400 });
    }

    const [consent] = await db.insert(consents).values({
      clerkId: userId,
      roomId: roomId || null,
      context,
    }).returning();

    return NextResponse.json(consent);
  } catch (err) {
    return handleApiError(err, 'POST /api/consent');
  }
}
