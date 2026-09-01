CREATE TABLE `calls` (
	`id` text PRIMARY KEY NOT NULL,
	`room_id` text NOT NULL,
	`initiator_id` text NOT NULL,
	`message_id` text,
	`provider_name` text NOT NULL,
	`provider_room_name` text NOT NULL,
	`provider_room_url` text NOT NULL,
	`status` text DEFAULT 'ringing' NOT NULL,
	`expires_at` integer NOT NULL,
	`answered_at` integer,
	`ended_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`is_deleted` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`room_id`) REFERENCES `rooms`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`initiator_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `calls_room_created_idx` ON `calls` (`room_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `calls_status_created_idx` ON `calls` (`status`,`created_at`);--> statement-breakpoint
ALTER TABLE `messages` ADD `kind` text DEFAULT 'text' NOT NULL;--> statement-breakpoint
ALTER TABLE `messages` ADD `call_id` text;