import { auth } from '@clerk/nextjs/server';
import { db } from '@/db';
import { requests, mentors } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const mentorResult = await db.select().from(mentors).where(eq(mentors.clerkId, userId));
  if (mentorResult.length === 0) return NextResponse.json([]);

  const mentor = mentorResult[0];
  const result = await db.select().from(requests).where(eq(requests.mentorId, mentor.id)).orderBy(requests.createdAt);

  return NextResponse.json(result.reverse());
}