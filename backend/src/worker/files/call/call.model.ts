import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";
import { rooms } from "../room/room.model";
import { users } from "../user/user.model";

export const calls = sqliteTable(
	"calls",
	{
		id: text("id").primaryKey(),
		roomId: text("room_id")
			.notNull()
			.references(() => rooms.id),
		initiatorId: text("initiator_id")
			.notNull()
			.references(() => users.id),
		messageId: text("message_id"),
		providerName: text("provider_name").notNull(),
		providerRoomName: text("provider_room_name").notNull(),
		providerRoomUrl: text("provider_room_url").notNull(),
		status: text("status", {
			enum: ["ringing", "active", "ended", "missed", "declined"],
		})
			.notNull()
			.default("ringing"),
		expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
		answeredAt: integer("answered_at", { mode: "timestamp_ms" }),
		endedAt: integer("ended_at", { mode: "timestamp_ms" }),
		createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
		updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
		isDeleted: integer("is_deleted", { mode: "boolean" })
			.notNull()
			.default(false),
	},
	(table) => [
		index("calls_room_created_idx").on(table.roomId, table.createdAt),
		index("calls_status_created_idx").on(table.status, table.createdAt),
	],
);

export type ICallRow = typeof calls.$inferSelect;
export type ICallInsert = typeof calls.$inferInsert;
export type CallStatus = ICallRow["status"];

export const ACTIVE_CALL_STATUSES: CallStatus[] = ["ringing", "active"];
