import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";
import { rooms } from "../room/room.model";

export const messages = sqliteTable(
	"messages",
	{
		id: text("id").primaryKey(),
		roomId: text("room_id")
			.notNull()
			.references(() => rooms.id),
		senderId: text("sender_id").notNull(),
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
	(table) => [index("messages_room_created_idx").on(table.roomId, table.createdAt)],
);

export type IMessageRow = typeof messages.$inferSelect;
export type IMessageInsert = typeof messages.$inferInsert;
