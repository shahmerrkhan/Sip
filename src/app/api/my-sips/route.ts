import { auth, clerkClient } from '@clerk/nextjs/server';
import { db } from '@/db';
import { requests, mentors } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const email = user.emailAddresses[0]?.emailAddress;
  if (!email) return NextResponse.json([], { status: 400 });

  const result = await db.select().from(requests).where(eq(requests.seekerEmail, email));

  const enriched = await Promise.all(result.map(async r => {
    const mentorResult = await db.select().from(mentors).where(eq(mentors.id, r.mentorId));
    const mentor = mentorResult[0];
    return {
      ...r,
      mentor: mentor ? {
        firstName: mentor.firstName,
        lastName: mentor.lastName,
        role: mentor.role,
        company: mentor.company,
        calendarLink: mentor.calendarLink,
      } : null,
    };
  }));

  return NextResponse.json(enriched);
}