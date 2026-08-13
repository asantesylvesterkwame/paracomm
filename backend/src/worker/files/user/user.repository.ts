import { drizzle } from "drizzle-orm/d1";
import { and, eq, ne, like, or, lt, desc } from "drizzle-orm";
import { users, type IUser, type IUserInsert } from "./user.model";
import { PAGE_LENGTH } from "../../constants";
import type { ICursor } from "../../utils/pagination";

class UserRepository {
	static db(env: Env) {
		return drizzle(env.DB);
	}

	static async fetchOneByClerkId(
		env: Env,
		clerkId: string,
	): Promise<IUser | null> {
		const rows = await this.db(env)
			.select()
			.from(users)
			.where(and(eq(users.clerkId, clerkId), eq(users.isDeleted, false)))
			.limit(1);
		return rows[0] ?? null;
	}

	static async fetchOneById(env: Env, id: string): Promise<IUser | null> {
		const rows = await this.db(env)
			.select()
			.from(users)
			.where(and(eq(users.id, id), eq(users.isDeleted, false)))
			.limit(1);
		return rows[0] ?? null;
	}

	static async create(env: Env, values: IUserInsert): Promise<IUser> {
		const rows = await this.db(env).insert(users).values(values).returning();
		return rows[0];
	}

	static async update(
		env: Env,
		id: string,
		changes: Partial<IUserInsert>,
	): Promise<IUser | null> {
		const rows = await this.db(env)
			.update(users)
			.set({ ...changes, updatedAt: new Date() })
			.where(eq(users.id, id))
			.returning();
		return rows[0] ?? null;
	}

	static async search(
		env: Env,
		query: string,
		excludeUserId: string,
		cursor?: ICursor | null,
	): Promise<IUser[]> {
		const pattern = `%${query}%`;
		const conditions = [
			eq(users.isDeleted, false),
			ne(users.id, excludeUserId),
			or(like(users.username, pattern), like(users.displayName, pattern)),
		];
		if (cursor) {
			conditions.push(
				or(
					lt(users.createdAt, new Date(cursor.createdAtMs)),
					and(
						eq(users.createdAt, new Date(cursor.createdAtMs)),
						lt(users.id, cursor.id),
					),
				),
			);
		}
		return this.db(env)
			.select()
			.from(users)
			.where(and(...conditions))
			.orderBy(desc(users.createdAt), desc(users.id))
			.limit(PAGE_LENGTH);
	}
}

export default UserRepository;
