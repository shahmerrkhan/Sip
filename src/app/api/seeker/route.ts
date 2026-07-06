import { auth, clerkClient } from '@clerk/nextjs/server';
import { db } from '@/db';
import { seekers } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const result = await db.select().from(seekers).where(eq(seekers.clerkId, userId));
  if (result.length === 0) return NextResponse.json(null, { status: 404 });
  return NextResponse.json(result[0]);
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { age, linkedin, interests } = await req.json();
  if (age !== undefined && age !== null && (age < 13 || age > 100)) {
    return NextResponse.json({ error: 'Please enter a real age between 13 and 100.' }, { status: 400 });
  }
  if (linkedin && linkedin.length > 200) return NextResponse.json({ error: 'LinkedIn URL is too long' }, { status: 400 });
  if (interests && interests.length > 300) return NextResponse.json({ error: 'Interests field is too long' }, { status: 400 });

  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const email = user.emailAddresses[0]?.emailAddress || '';

  const existing = await db.select().from(seekers).where(eq(seekers.clerkId, userId));
  if (existing.length > 0) {
    const updated = await db.update(seekers)
      .set({ age, linkedin, interests })
      .where(eq(seekers.clerkId, userId))
      .returning();
    return NextResponse.json(updated[0]);
  }

  const created = await db.insert(seekers).values({
    clerkId: userId,
    firstName: user.firstName || '',
    lastName: user.lastName || '',
    email,
    age,
    linkedin,
    interests,
  }).returning();

  return NextResponse.json(created[0]);
}