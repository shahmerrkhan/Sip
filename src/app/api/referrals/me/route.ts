import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { referralEvents, seekers, mentors } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const signups = await db.select().from(referralEvents).where(and(
    eq(referralEvents.referrerClerkId, userId),
    eq(referralEvents.milestone, "signed_up")
  ));

  const bookings = await db.select().from(referralEvents).where(and(
    eq(referralEvents.referrerClerkId, userId),
    eq(referralEvents.milestone, "first_sip_booked")
  ));
  const bookedIds = new Set(bookings.map(b => b.referredClerkId));

  const chain = [];
  for (const s of signups) {
    const seekerMatch = await db.select().from(seekers).where(eq(seekers.clerkId, s.referredClerkId));
    const mentorMatch = seekerMatch.length === 0 ? await db.select().from(mentors).where(eq(mentors.clerkId, s.referredClerkId)) : [];
    const person = seekerMatch[0] || mentorMatch[0];
    chain.push({
      clerkId: s.referredClerkId,
      firstName: person?.firstName || "Unknown",
      lastName: person?.lastName || "",
      role: s.referredRole,
      convertedToSip: bookedIds.has(s.referredClerkId),
    });
  }

  const mySeeker = await db.select().from(seekers).where(eq(seekers.clerkId, userId));
  const myMentor = mySeeker.length === 0 ? await db.select().from(mentors).where(eq(mentors.clerkId, userId)) : [];
  const referralCode = mySeeker[0]?.referralCode || myMentor[0]?.referralCode || null;

  return NextResponse.json({
    referralCode,
    totalInvites: chain.length,
    totalConverted: chain.filter(c => c.convertedToSip).length,
    chain,
  });
}
