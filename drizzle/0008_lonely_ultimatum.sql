CREATE TABLE "follows" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"seeker_clerk_id" text NOT NULL,
	"mentor_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "mentors" ALTER COLUMN "calendar_link" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "asks" ADD COLUMN "seeker_consent_to_show" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "asks" ADD COLUMN "mentor_consent_to_show" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "mentors" ADD COLUMN "contact_email" text;--> statement-breakpoint
ALTER TABLE "requests" ADD COLUMN "origin_ask_id" uuid;--> statement-breakpoint
ALTER TABLE "requests" ADD COLUMN "origin_room_id" uuid;--> statement-breakpoint
ALTER TABLE "rooms" ADD COLUMN "mode" text DEFAULT 'individual' NOT NULL;--> statement-breakpoint
ALTER TABLE "follows" ADD CONSTRAINT "follows_mentor_id_mentors_id_fk" FOREIGN KEY ("mentor_id") REFERENCES "public"."mentors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "follows_mentor_id_idx" ON "follows" USING btree ("mentor_id");--> statement-breakpoint
CREATE INDEX "follows_seeker_clerk_id_idx" ON "follows" USING btree ("seeker_clerk_id");--> statement-breakpoint
CREATE UNIQUE INDEX "follows_unique_idx" ON "follows" USING btree ("seeker_clerk_id","mentor_id");--> statement-breakpoint
ALTER TABLE "requests" ADD CONSTRAINT "requests_origin_ask_id_asks_id_fk" FOREIGN KEY ("origin_ask_id") REFERENCES "public"."asks"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "requests" ADD CONSTRAINT "requests_origin_room_id_rooms_id_fk" FOREIGN KEY ("origin_room_id") REFERENCES "public"."rooms"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "requests_origin_ask_id_idx" ON "requests" USING btree ("origin_ask_id");