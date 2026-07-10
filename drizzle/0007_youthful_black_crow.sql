CREATE INDEX "asks_mentor_id_idx" ON "asks" USING btree ("mentor_id");--> statement-breakpoint
CREATE INDEX "asks_seeker_clerk_id_idx" ON "asks" USING btree ("seeker_clerk_id");--> statement-breakpoint
CREATE INDEX "flags_reported_clerk_id_idx" ON "flags" USING btree ("reported_clerk_id");--> statement-breakpoint
CREATE INDEX "flags_room_id_idx" ON "flags" USING btree ("room_id");--> statement-breakpoint
CREATE INDEX "queue_entries_room_id_idx" ON "queue_entries" USING btree ("room_id");--> statement-breakpoint
CREATE INDEX "queue_entries_seeker_clerk_id_idx" ON "queue_entries" USING btree ("seeker_clerk_id");--> statement-breakpoint
CREATE INDEX "queue_entries_room_status_idx" ON "queue_entries" USING btree ("room_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "queue_entries_active_unique_idx" ON "queue_entries" USING btree ("room_id","seeker_clerk_id") WHERE status in ('waiting', 'active');--> statement-breakpoint
CREATE INDEX "requests_mentor_id_idx" ON "requests" USING btree ("mentor_id");--> statement-breakpoint
CREATE INDEX "requests_seeker_clerk_id_idx" ON "requests" USING btree ("seeker_clerk_id");--> statement-breakpoint
CREATE INDEX "rooms_mentor_id_idx" ON "rooms" USING btree ("mentor_id");--> statement-breakpoint
CREATE INDEX "rooms_status_idx" ON "rooms" USING btree ("status");--> statement-breakpoint
CREATE INDEX "sip_notes_mentor_id_idx" ON "sip_notes" USING btree ("mentor_id");