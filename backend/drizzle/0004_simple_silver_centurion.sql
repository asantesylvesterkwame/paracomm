CREATE TABLE `voice_note_dubs` (
	`id` text PRIMARY KEY NOT NULL,
	`voice_note_id` text NOT NULL,
	`lang` text NOT NULL,
	`text` text,
	`object_key` text,
	`mime_type` text,
	`duration_ms` integer,
	`byte_size` integer,
	`status` text DEFAULT 'pending' NOT NULL,
	`error` text,
	`requested_by` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`voice_note_id`) REFERENCES `voice_notes`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `voice_note_dubs_note_lang_idx` ON `voice_note_dubs` (`voice_note_id`,`lang`);--> statement-breakpoint
CREATE INDEX `voice_note_dubs_status_updated_idx` ON `voice_note_dubs` (`status`,`updated_at`);--> statement-breakpoint
CREATE TABLE `voice_notes` (
	`id` text PRIMARY KEY NOT NULL,
	`message_id` text NOT NULL,
	`room_id` text NOT NULL,
	`sender_id` text NOT NULL,
	`object_key` text NOT NULL,
	`mime_type` text NOT NULL,
	`duration_ms` integer NOT NULL,
	`byte_size` integer NOT NULL,
	`transcript` text,
	`transcript_lang` text,
	`transcription_status` text DEFAULT 'pending' NOT NULL,
	`transcription_error` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`is_deleted` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`room_id`) REFERENCES `rooms`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `voice_notes_message_idx` ON `voice_notes` (`message_id`);--> statement-breakpoint
CREATE INDEX `voice_notes_room_created_idx` ON `voice_notes` (`room_id`,`created_at`);--> statement-breakpoint
ALTER TABLE `messages` ADD `voice_note_id` text;