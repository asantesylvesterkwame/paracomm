import { drizzle } from "drizzle-orm/d1";
import { and, eq, lt, or, desc, inArray, type SQL } from "drizzle-orm";
import {
	calls,
	ACTIVE_CALL_STATUSES,
	type ICallRow,
	type ICallInsert,
	type CallStatus,
} from "./call.model";
import { PAGE_LENGTH } from "../../constants";
import type { ICursor } from "../../utils/pagination";

class CallRepository {
	static db(env: Env) {
		return drizzle(env.DB);
	}

	static async create(env: Env, values: ICallInsert): Promise<ICallRow> {
		const rows = await this.db(env).insert(calls).values(values).returning();
		return rows[0];
	}

	static async fetchOne(env: Env, callId: string): Promise<ICallRow | null> {
		const rows = await this.db(env)
			.select()
			.from(calls)
			.where(and(eq(calls.id, callId), eq(calls.isDeleted, false)))
			.limit(1);
		return rows[0] ?? null;
	}

	static async fetchActiveForRoom(
		env: Env,
		roomId: string,
	): Promise<ICallRow | null> {
		const rows = await this.db(env)
			.select()
			.from(calls)
			.where(
				and(
					eq(calls.roomId, roomId),
					eq(calls.isDeleted, false),
					inArray(calls.status, ACTIVE_CALL_STATUSES),
				),
			)
			.orderBy(desc(calls.createdAt))
			.limit(1);
		return rows[0] ?? null;
	}

	static async fetchStale(env: Env, ringingBefore: Date, activeBefore: Date) {
		return this.db(env)
			.select()
			.from(calls)
			.where(
				and(
					eq(calls.isDeleted, false),
					or(
						and(eq(calls.status, "ringing"), lt(calls.createdAt, ringingBefore)),
						and(eq(calls.status, "active"), lt(calls.expiresAt, activeBefore)),
					),
				),
			)
			.limit(PAGE_LENGTH);
	}

	static async fetch(
		env: Env,
		roomId: string,
		cursor?: ICursor | null,
	): Promise<ICallRow[]> {
		const conditions = [eq(calls.roomId, roomId), eq(calls.isDeleted, false)];
		if (cursor) {
			conditions.push(
				or(
					lt(calls.createdAt, new Date(cursor.createdAtMs)),
					and(
						eq(calls.createdAt, new Date(cursor.createdAtMs)),
						lt(calls.id, cursor.id),
					),
				) as SQL,
			);
		}
		return this.db(env)
			.select()
			.from(calls)
			.where(and(...conditions))
			.orderBy(desc(calls.createdAt), desc(calls.id))
			.limit(PAGE_LENGTH);
	}

	static async update(
		env: Env,
		callId: string,
		changes: Partial<ICallInsert>,
	): Promise<ICallRow | null> {
		const rows = await this.db(env)
			.update(calls)
			.set({ ...changes, updatedAt: new Date() })
			.where(eq(calls.id, callId))
			.returning();
		return rows[0] ?? null;
	}

	static async updateIfStatus(
		env: Env,
		callId: string,
		expected: CallStatus[],
		changes: Partial<ICallInsert>,
	): Promise<ICallRow | null> {
		const rows = await this.db(env)
			.update(calls)
			.set({ ...changes, updatedAt: new Date() })
			.where(and(eq(calls.id, callId), inArray(calls.status, expected)))
			.returning();
		return rows[0] ?? null;
	}

	static async softDelete(env: Env, callId: string) {
		await this.db(env)
			.update(calls)
			.set({ isDeleted: true, updatedAt: new Date() })
			.where(eq(calls.id, callId));
	}
}

export default CallRepository;
