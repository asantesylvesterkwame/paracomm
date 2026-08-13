import {
	sqliteTable,
	text,
	integer,
	index,
	uniqueIndex,
} from "drizzle-orm/sqlite-core";
import { users } from "../user/user.model";

export const rooms = sqliteTable("rooms", {
	id: text("id").primaryKey(),
	type: text("type", { enum: ["dm"] }).notNull().default("dm"),
	dmKey: text("dm_key").notNull().unique(),
	lastMessageAt: integer("last_message_at", { mode: "timestamp_ms" }),
	createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
	updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
	isDeleted: integer("is_deleted", { mode: "boolean" })
		.notNull()
		.default(false),
});

export const roomMembers = sqliteTable(
	"room_members",
	{
		id: text("id").primaryKey(),
		roomId: text("room_id")
			.notNull()
			.references(() => rooms.id),
		userId: text("user_id")
			.notNull()
			.references(() => users.id),
		lastSeenAt: integer("last_seen_at", { mode: "timestamp_ms" }),
		lastSeenMessageId: text("last_seen_message_id"),
		createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
	},
	(table) => [
		uniqueIndex("room_members_room_user_idx").on(table.roomId, table.userId),
		index("room_members_user_idx").on(table.userId),
	],
);

export type IRoomRow = typeof rooms.$inferSelect;
export type IRoomMemberRow = typeof roomMembers.$inferSelect;
