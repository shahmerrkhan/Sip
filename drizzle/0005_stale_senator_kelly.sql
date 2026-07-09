CREATE TABLE "flags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"room_id" uuid NOT NULL,
	"reporter_clerk_id" text NOT NULL,
	"reporter_role" text NOT NULL,
	"reported_clerk_id" text NOT NULL,
	"reported_name" text NOT NULL,
	"reason" text NOT NULL,
	"details" text NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"resolved_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "queue_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"room_id" uuid NOT NULL,
	"seeker_clerk_id" text NOT NULL,
	"seeker_name" text NOT NULL,
	"status" text DEFAULT 'waiting' NOT NULL,
	"joined_at" timestamp DEFAULT now() NOT NULL,
	"called_at" timestamp,
	"done_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "referral_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"referrer_clerk_id" text NOT NULL,
	"referred_clerk_id" text NOT NULL,
	"referred_role" text NOT NULL,
	"milestone" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "asks" DROP CONSTRAINT "asks_mentor_id_mentors_id_fk";
--> statement-breakpoint
ALTER TABLE "requests" DROP CONSTRAINT "requests_mentor_id_mentors_id_fk";
--> statement-breakpoint
ALTER TABLE "rooms" DROP CONSTRAINT "rooms_mentor_id_mentors_id_fk";
--> statement-breakpoint
ALTER TABLE "sip_notes" DROP CONSTRAINT "sip_notes_mentor_id_mentors_id_fk";
--> statement-breakpoint
ALTER TABLE "mentors" ADD COLUMN "last_open_notified_at" timestamp;--> statement-breakpoint
ALTER TABLE "mentors" ADD COLUMN "referral_code" text;--> statement-breakpoint
ALTER TABLE "mentors" ADD COLUMN "invited_by_clerk_id" text;--> statement-breakpoint
ALTER TABLE "requests" ADD COLUMN "seeker_clerk_id" text;--> statement-breakpoint
ALTER TABLE "requests" ADD COLUMN "seeker_consent_to_show" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "requests" ADD COLUMN "mentor_consent_to_show" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "seekers" ADD COLUMN "referral_code" text;--> statement-breakpoint
ALTER TABLE "seekers" ADD COLUMN "invited_by_clerk_id" text;--> statement-breakpoint
ALTER TABLE "sip_notes" ADD COLUMN "status" text DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "flags" ADD CONSTRAINT "flags_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "queue_entries" ADD CONSTRAINT "queue_entries_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asks" ADD CONSTRAINT "asks_mentor_id_mentors_id_fk" FOREIGN KEY ("mentor_id") REFERENCES "public"."mentors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "requests" ADD CONSTRAINT "requests_mentor_id_mentors_id_fk" FOREIGN KEY ("mentor_id") REFERENCES "public"."mentors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_mentor_id_mentors_id_fk" FOREIGN KEY ("mentor_id") REFERENCES "public"."mentors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sip_notes" ADD CONSTRAINT "sip_notes_mentor_id_mentors_id_fk" FOREIGN KEY ("mentor_id") REFERENCES "public"."mentors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentors" ADD CONSTRAINT "mentors_referral_code_unique" UNIQUE("referral_code");--> statement-breakpoint
ALTER TABLE "seekers" ADD CONSTRAINT "seekers_referral_code_unique" UNIQUE("referral_code");