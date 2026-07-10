import { db } from '@/db';
import { asks, mentors } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { handleApiError } from '@/lib/api-handler';

export async function GET() {
  try {
    const result = await db
      .select({
        id: asks.id,
        question: asks.question,
        answer: asks.answer,
        seekerFirstName: asks.seekerName,
        answeredAt: asks.answeredAt,
        mentorId: mentors.id,
        mentorFirstName: mentors.firstName,
        mentorLastName: mentors.lastName,
        mentorRole: mentors.role,
        mentorCompany: mentors.company,
      })
      .from(asks)
      .innerJoin(mentors, eq(asks.mentorId, mentors.id))
      .where(and(eq(asks.status, 'answered'), eq(asks.seekerConsentToShow, true), eq(asks.mentorConsentToShow, true)))
      .orderBy(desc(asks.answeredAt))
      .limit(50);

    return NextResponse.json(result);
  } catch (err) {
    return handleApiError(err, 'GET /api/asks/public');
  }
}
