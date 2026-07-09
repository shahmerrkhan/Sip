import { pgTable, text, timestamp, boolean, uuid, integer } from 'drizzle-orm/pg-core';

export const referralEvents = pgTable('referral_events', {
  id: uuid('id').defaultRandom().primaryKey(),
  referrerClerkId: text('referrer_clerk_id').notNull(),
  referredClerkId: text('referred_clerk_id').notNull(),
  referredRole: text('referred_role').notNull(),
  milestone: text('milestone').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const mentors = pgTable('mentors', {
  id: uuid('id').defaultRandom().primaryKey(),
  clerkId: text('clerk_id').notNull().unique(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  email: text('email').notNull().unique(),
  role: text('role').notNull(),
  company: text('company').notNull(),
  bio: text('bio').notNull(),
  topics: text('topics').notNull(),
  calendarLink: text('calendar_link').notNull(),
  availability: text('availability').notNull(),
  linkedin: text('linkedin'),
  showLinkedin: boolean('show_linkedin').default(false).notNull(),
  isOpen: boolean('is_open').default(true).notNull(),   
  xp: integer('xp').default(0).notNull(),
  sipCount: integer('sip_count').default(0).notNull(),
  badges: text('badges').default('').notNull(),
  avgResponseMinutes: integer('avg_response_minutes'),
  lastOpenNotifiedAt: timestamp('last_open_notified_at'),
  referralCode: text('referral_code').unique(),
  invitedByClerkId: text('invited_by_clerk_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const seekers = pgTable('seekers', {
  id: uuid('id').defaultRandom().primaryKey(),
  clerkId: text('clerk_id').notNull().unique(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  email: text('email').notNull(),
  age: integer('age'),
  linkedin: text('linkedin'),
  interests: text('interests').default('').notNull(),
  currentStreak: integer('current_streak').default(0).notNull(),
  longestStreak: integer('longest_streak').default(0).notNull(),
  lastNoteAt: timestamp('last_note_at'),
  lastMatchEmailAt: timestamp('last_match_email_at'),
  lastCheckinAt: timestamp('last_checkin_at'),
  referralCode: text('referral_code').unique(),
  invitedByClerkId: text('invited_by_clerk_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const rooms = pgTable('rooms', {
  id: uuid('id').defaultRandom().primaryKey(),
  mentorId: uuid('mentor_id').references(() => mentors.id, { onDelete: 'cascade' }).notNull(),
  title: text('title').notNull(),
  roomName: text('room_name').notNull().unique(),
  roomUrl: text('room_url').notNull(),
  status: text('status').default('live').notNull(),
  startedAt: timestamp('started_at').defaultNow().notNull(),
  endedAt: timestamp('ended_at'),
});

export const requests = pgTable('requests', {
  id: uuid('id').defaultRandom().primaryKey(),
  mentorId: uuid('mentor_id').references(() => mentors.id, { onDelete: 'cascade' }).notNull(),
  seekerClerkId: text('seeker_clerk_id'),
  seekerName: text('seeker_name').notNull(),
  seekerEmail: text('seeker_email').notNull(),
  seekerLinkedin: text('seeker_linkedin'),
  message: text('message').notNull(),
  status: text('status').default('pending').notNull(),
  seekerConsentToShow: boolean('seeker_consent_to_show').default(false).notNull(),
  mentorConsentToShow: boolean('mentor_consent_to_show').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  respondedAt: timestamp('responded_at'),
});

export const sipNotes = pgTable('sip_notes', {
  id: uuid('id').defaultRandom().primaryKey(),
  mentorId: uuid('mentor_id').references(() => mentors.id, { onDelete: 'cascade' }).notNull(),
  seekerName: text('seeker_name').notNull(),
  seekerEmail: text('seeker_email'),
  note: text('note').notNull(),
  status: text('status').default('pending').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const queueEntries = pgTable('queue_entries', {
  id: uuid('id').defaultRandom().primaryKey(),
  roomId: uuid('room_id').references(() => rooms.id, { onDelete: 'cascade' }).notNull(),
  seekerClerkId: text('seeker_clerk_id').notNull(),
  seekerName: text('seeker_name').notNull(),
  status: text('status').default('waiting').notNull(), // waiting | active | done | left
  joinedAt: timestamp('joined_at').defaultNow().notNull(),
  calledAt: timestamp('called_at'),
  doneAt: timestamp('done_at'),
});

export const asks = pgTable('asks', {
  id: uuid('id').defaultRandom().primaryKey(),
  mentorId: uuid('mentor_id').references(() => mentors.id, { onDelete: 'cascade' }).notNull(),
  seekerClerkId: text('seeker_clerk_id').notNull(),
  seekerName: text('seeker_name').notNull(),
  seekerEmail: text('seeker_email').notNull(),
  question: text('question').notNull(),
  answer: text('answer'),
  status: text('status').default('pending').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  answeredAt: timestamp('answered_at'),
});


export const flags = pgTable('flags', {
  id: uuid('id').defaultRandom().primaryKey(),
  roomId: uuid('room_id').references(() => rooms.id, { onDelete: 'cascade' }).notNull(),
  reporterClerkId: text('reporter_clerk_id').notNull(),
  reporterRole: text('reporter_role').notNull(), // mentor | seeker
  reportedClerkId: text('reported_clerk_id').notNull(),
  reportedName: text('reported_name').notNull(),
  reason: text('reason').notNull(),
  details: text('details').notNull(),
  status: text('status').default('open').notNull(), // open | dismissed | actioned
  createdAt: timestamp('created_at').defaultNow().notNull(),
  resolvedAt: timestamp('resolved_at'),
});