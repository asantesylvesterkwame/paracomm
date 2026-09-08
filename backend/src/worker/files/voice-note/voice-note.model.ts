import {
	sqliteTable,
	text,
	integer,
	index,
	uniqueIndex,
} from "drizzle-orm/sqlite-core";
import { rooms } from "../room/room.model";

export const voiceNotes = sqliteTable(
	"voice_notes",
	{
		id: text("id").primaryKey(),
		messageId: text("message_id").notNull(),
		roomId: text("room_id")
			.notNull()
			.references(() => rooms.id),
		senderId: text("sender_id").notNull(),
		objectKey: text("object_key").notNull(),
		mimeType: text("mime_type").notNull(),
		durationMs: integer("duration_ms").notNull(),
		byteSize: integer("byte_size").notNull(),
		transcript: text("transcript"),
		transcriptLang: text("transcript_lang"),
		transcriptionStatus: text("transcription_status", {
			enum: ["pending", "done", "failed"],
		})
			.notNull()
			.default("pending"),
		transcriptionError: text("transcription_error"),
		createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
		updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
		isDeleted: integer("is_deleted", { mode: "boolean" })
			.notNull()
			.default(false),
	},
	(table) => [
		uniqueIndex("voice_notes_message_idx").on(table.messageId),
		index("voice_notes_room_created_idx").on(table.roomId, table.createdAt),
	],
);

export const voiceNoteDubs = sqliteTable(
	"voice_note_dubs",
	{
		id: text("id").primaryKey(),
		voiceNoteId: text("voice_note_id")
			.notNull()
			.references(() => voiceNotes.id),
		lang: text("lang").notNull(),
		text: text("text"),
		objectKey: text("object_key"),
		mimeType: text("mime_type"),
		durationMs: integer("duration_ms"),
		byteSize: integer("byte_size"),
		status: text("status", { enum: ["pending", "done", "failed"] })
			.notNull()
			.default("pending"),
		error: text("error"),
		requestedBy: text("requested_by").notNull(),
		createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
		updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
	},
	(table) => [
		uniqueIndex("voice_note_dubs_note_lang_idx").on(
			table.voiceNoteId,
			table.lang,
		),
		index("voice_note_dubs_status_updated_idx").on(
			table.status,
			table.updatedAt,
		),
	],
);

export type IVoiceNoteRow = typeof voiceNotes.$inferSelect;
export type IVoiceNoteInsert = typeof voiceNotes.$inferInsert;
export type IVoiceNoteDubRow = typeof voiceNoteDubs.$inferSelect;
export type IVoiceNoteDubInsert = typeof voiceNoteDubs.$inferInsert;
export type VoiceDubStatus = IVoiceNoteDubRow["status"];
export type TranscriptionStatus = IVoiceNoteRow["transcriptionStatus"];

export type IVoiceNoteDubPayload = Omit<IVoiceNoteDubRow, "objectKey">;

export type IVoiceNotePayload = Omit<IVoiceNoteRow, "objectKey"> & {
	dubs: IVoiceNoteDubPayload[];
};
