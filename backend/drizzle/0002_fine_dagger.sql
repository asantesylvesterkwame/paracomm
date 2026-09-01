ALTER TABLE `messages` ADD `client_id` text;--> statement-breakpoint
CREATE UNIQUE INDEX `messages_room_client_idx` ON `messages` (`room_id`,`client_id`) WHERE "messages"."client_id" is not null;