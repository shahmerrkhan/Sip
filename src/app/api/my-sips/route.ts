import { auth, clerkClient } from '@clerk/nextjs/server';
import { db } from '@/db';
import { requests, mentors } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { handleApiError } from '@/lib/api-handler';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const email = user.emailAddresses[0]?.emailAddress;
    if (!email) return NextResponse.json([], { status: 400 });

    const rows = await db
      .select({
        id: requests.id, mentorId: requests.mentorId, seekerName: requests.seekerName,
        seekerEmail: requests.seekerEmail, seekerLinkedin: requests.seekerLinkedin, message: requests.message,
        status: requests.status, seekerConsentToShow: requests.seekerConsentToShow,
        mentorConsentToShow: requests.mentorConsentToShow, createdAt: requests.createdAt, respondedAt: requests.respondedAt,
        mentorFirstName: mentors.firstName, mentorLastName: mentors.lastName,
        mentorRole: mentors.role, mentorCompany: mentors.company, mentorCalendarLink: mentors.calendarLink,
      })
      .from(requests)
      .leftJoin(mentors, eq(requests.mentorId, mentors.id))
      .where(eq(requests.seekerEmail, email));

    const enriched = rows.map(r => ({
      id: r.id, mentorId: r.mentorId, seekerName: r.seekerName, seekerEmail: r.seekerEmail,
      seekerLinkedin: r.seekerLinkedin, message: r.message, status: r.status,
      seekerConsentToShow: r.seekerConsentToShow, mentorConsentToShow: r.mentorConsentToShow,
      createdAt: r.createdAt, respondedAt: r.respondedAt,
      mentor: r.mentorFirstName ? {
        firstName: r.mentorFirstName, lastName: r.mentorLastName,
        role: r.mentorRole, company: r.mentorCompany, calendarLink: r.mentorCalendarLink,
      } : null,
    }));

    return NextResponse.json(enriched);
  } catch (err) {
    return handleApiError(err, 'GET /api/my-sips');
  }
}