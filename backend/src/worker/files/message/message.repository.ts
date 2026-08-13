import { drizzle } from "drizzle-orm/d1";
import { and, eq, lt, or, desc } from "drizzle-orm";
import {
	messages,
	type IMessageRow,
	type IMessageInsert,
} from "./message.model";
import { PAGE_LENGTH } from "../../constants";
import type { ICursor } from "../../utils/pagination";

class MessageRepository {
	static db(env: Env) {
		return drizzle(env.DB);
	}

	static async create(env: Env, values: IMessageInsert): Promise<IMessageRow> {
		const rows = await this.db(env).insert(messages).values(values).returning();
		return rows[0];
	}

	static async fetchOne(
		env: Env,
		roomId: string,
		messageId: string,
	): Promise<IMessageRow | null> {
		const rows = await this.db(env)
			.select()
			.from(messages)
			.where(
				and(
					eq(messages.id, messageId),
					eq(messages.roomId, roomId),
					eq(messages.isDeleted, false),
				),
			)
			.limit(1);
		return rows[0] ?? null;
	}

	static async update(
		env: Env,
		messageId: string,
		changes: Partial<IMessageInsert>,
	): Promise<IMessageRow | null> {
		const rows = await this.db(env)
			.update(messages)
			.set({ ...changes, updatedAt: new Date() })
			.where(eq(messages.id, messageId))
			.returning();
		return rows[0] ?? null;
	}

	static async fetchPage(
		env: Env,
		roomId: string,
		cursor?: ICursor | null,
	): Promise<IMessageRow[]> {
		const conditions = [
			eq(messages.roomId, roomId),
			eq(messages.isDeleted, false),
		];
		if (cursor) {
			conditions.push(
				or(
					lt(messages.createdAt, new Date(cursor.createdAtMs)),
					and(
						eq(messages.createdAt, new Date(cursor.createdAtMs)),
						lt(messages.id, cursor.id),
					),
				),
			);
		}
		return this.db(env)
			.select()
			.from(messages)
			.where(and(...conditions))
			.orderBy(desc(messages.createdAt), desc(messages.id))
			.limit(PAGE_LENGTH);
	}
}

export default MessageRepository;
