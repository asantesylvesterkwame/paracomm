import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";

export const users = sqliteTable(
	"users",
	{
		id: text("id").primaryKey(),
		clerkId: text("clerk_id").notNull().unique(),
		username: text("username"),
		displayName: text("display_name"),
		avatarUrl: text("avatar_url"),
		preferredLang: text("preferred_lang").notNull().default("en"),
		createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
		updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
		isDeleted: integer("is_deleted", { mode: "boolean" })
			.notNull()
			.default(false),
	},
	(table) => [index("users_username_idx").on(table.username)],
);

export type IUser = typeof users.$inferSelect;
export type IUserInsert = typeof users.$inferInsert;
