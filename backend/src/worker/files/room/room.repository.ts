import { drizzle } from "drizzle-orm/d1";
import { alias } from "drizzle-orm/sqlite-core";
import { and, eq, ne, desc, gt, sql } from "drizzle-orm";
import { rooms, roomMembers, type IRoomRow } from "./room.model";
import { users, type IUser } from "../user/user.model";
import { messages, type IMessageRow } from "../message/message.model";
import { PAGE_LENGTH } from "../../constants";
import type { ICursor } from "../../utils/pagination";

export interface IRoomListRow {
	room: IRoomRow;
	otherUser: IUser;
	lastMessage: IMessageRow | null;
	unreadCount: number;
}

class RoomRepository {
	static db(env: Env) {
		return drizzle(env.DB);
	}

	static async fetchDmByKey(env: Env, dmKey: string): Promise<IRoomRow | null> {
		const rows = await this.db(env)
			.select()
			.from(rooms)
			.where(and(eq(rooms.dmKey, dmKey), eq(rooms.isDeleted, false)))
			.limit(1);
		return rows[0] ?? null;
	}

	static async createDm(
		env: Env,
		roomId: string,
		dmKey: string,
		userIdA: string,
		userIdB: string,
	): Promise<IRoomRow> {
		const now = new Date();
		const db = this.db(env);
		const [inserted] = await db.batch([
			db
				.insert(rooms)
				.values({
					id: roomId,
					dmKey,
					createdAt: now,
					updatedAt: now,
				})
				.returning(),
			db.insert(roomMembers).values({
				id: crypto.randomUUID(),
				roomId,
				userId: userIdA,
				createdAt: now,
			}),
			db.insert(roomMembers).values({
				id: crypto.randomUUID(),
				roomId,
				userId: userIdB,
				createdAt: now,
			}),
		]);
		return inserted[0];
	}

	static async fetchMembership(env: Env, roomId: string, userId: string) {
		const other = alias(roomMembers, "other_member");
		const rows = await this.db(env)
			.select({
				room: rooms,
				member: roomMembers,
				otherUser: users,
			})
			.from(rooms)
			.innerJoin(
				roomMembers,
				and(eq(roomMembers.roomId, rooms.id), eq(roomMembers.userId, userId)),
			)
			.innerJoin(
				other,
				and(eq(other.roomId, rooms.id), ne(other.userId, userId)),
			)
			.innerJoin(users, eq(users.id, other.userId))
			.where(and(eq(rooms.id, roomId), eq(rooms.isDeleted, false)))
			.limit(1);
		return rows[0] ?? null;
	}

	static async fetchOtherUser(env: Env, roomId: string, userId: string) {
		const membership = await this.fetchMembership(env, roomId, userId);
		return membership?.otherUser ?? null;
	}

	static async listForUser(
		env: Env,
		userId: string,
		cursor?: ICursor | null,
	): Promise<IRoomListRow[]> {
		const db = this.db(env);
		const other = alias(roomMembers, "other_member");
		const activityAt = sql<number>`coalesce(${rooms.lastMessageAt}, ${rooms.createdAt})`;
		const conditions = [eq(rooms.isDeleted, false)];
		if (cursor) {
			conditions.push(
				sql`${activityAt} < ${cursor.createdAtMs} or (${activityAt} = ${cursor.createdAtMs} and ${rooms.id} < ${cursor.id})`,
			);
		}
		const base = await db
			.select({
				room: rooms,
				member: roomMembers,
				otherUser: users,
			})
			.from(rooms)
			.innerJoin(
				roomMembers,
				and(eq(roomMembers.roomId, rooms.id), eq(roomMembers.userId, userId)),
			)
			.innerJoin(
				other,
				and(eq(other.roomId, rooms.id), ne(other.userId, userId)),
			)
			.innerJoin(users, eq(users.id, other.userId))
			.where(and(...conditions))
			.orderBy(desc(activityAt), desc(rooms.id))
			.limit(PAGE_LENGTH);

		if (base.length === 0) return [];

		const statements = base.flatMap((row) => [
			db
				.select()
				.from(messages)
				.where(
					and(
						eq(messages.roomId, row.room.id),
						eq(messages.isDeleted, false),
					),
				)
				.orderBy(desc(messages.createdAt), desc(messages.id))
				.limit(1),
			db
				.select({ total: sql<number>`count(*)` })
				.from(messages)
				.where(
					and(
						eq(messages.roomId, row.room.id),
						eq(messages.isDeleted, false),
						ne(messages.senderId, userId),
						gt(
							messages.createdAt,
							row.member.lastSeenAt ?? new Date(0),
						),
					),
				),
		]);
		const results = await db.batch(
			statements as [(typeof statements)[number], ...typeof statements],
		);
		return base.map((row, index) => {
			const lastMessageRows = results[index * 2] as IMessageRow[];
			const unreadRows = results[index * 2 + 1] as { total: number }[];
			return {
				room: row.room,
				otherUser: row.otherUser,
				lastMessage: lastMessageRows[0] ?? null,
				unreadCount: unreadRows[0]?.total ?? 0,
			};
		});
	}

	static async touchLastMessageAt(env: Env, roomId: string, at: Date) {
		await this.db(env)
			.update(rooms)
			.set({ lastMessageAt: at, updatedAt: at })
			.where(eq(rooms.id, roomId));
	}

	static async updateMemberSeen(
		env: Env,
		roomId: string,
		userId: string,
		lastSeenMessageId: string,
		lastSeenAt: Date,
	) {
		await this.db(env)
			.update(roomMembers)
			.set({ lastSeenAt, lastSeenMessageId })
			.where(
				and(eq(roomMembers.roomId, roomId), eq(roomMembers.userId, userId)),
			);
	}
}

export default RoomRepository;
