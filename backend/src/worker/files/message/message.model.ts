import {
	sqliteTable,
	text,
	integer,
	index,
	uniqueIndex,
} from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { rooms } from "../room/room.model";
import type { IVoiceNotePayload } from "../voice-note/voice-note.model";

export const messages = sqliteTable(
	"messages",
	{
		id: text("id").primaryKey(),
		roomId: text("room_id")
			.notNull()
			.references(() => rooms.id),
		clientId: text("client_id"),
		senderId: text("sender_id").notNull(),
		kind: text("kind", { enum: ["text", "call", "voice"] })
			.notNull()
			.default("text"),
		callId: text("call_id"),
		voiceNoteId: text("voice_note_id"),
		originalText: text("original_text").notNull(),
		originalLang: text("original_lang").notNull(),
		translatedText: text("translated_text"),
		translatedLang: text("translated_lang"),
		translationStatus: text("translation_status", {
			enum: ["none", "pending", "done", "failed"],
		})
			.notNull()
			.default("pending"),
		translationError: text("translation_error"),
		createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
		updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
		isDeleted: integer("is_deleted", { mode: "boolean" })
			.notNull()
			.default(false),
	},
	(table) => [
		index("messages_room_created_idx").on(table.roomId, table.createdAt),
		uniqueIndex("messages_room_client_idx")
			.on(table.roomId, table.clientId)
			.where(sql`${table.clientId} is not null`),
	],
);

export type IMessageRow = typeof messages.$inferSelect;
export type IMessageInsert = typeof messages.$inferInsert;
export type IMessagePayload = IMessageRow & {
	voiceNote?: IVoiceNotePayload | null;
};
