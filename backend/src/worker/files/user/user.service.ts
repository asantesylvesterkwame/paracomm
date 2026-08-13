import type { ClerkClient } from "@clerk/backend";
import UserRepository from "./user.repository";
import { userMessages } from "./user.messages";
import { decodeCursor, encodeCursor } from "../../utils/pagination";
import type { IActor } from "../../utils/auth";
import type { IUpdateMeBody, ISearchUsersQuery } from "./user.validation";

class UserService {
	static async getMe(env: Env, actor: IActor, clerk: ClerkClient) {
		const existing = await UserRepository.fetchOneByClerkId(
			env,
			actor.clerkId,
		);
		if (existing) {
			return {
				success: true as const,
				message: userMessages.PROFILE_FETCHED,
				data: { user: existing, isNew: false },
			};
		}
		const clerkUser = await clerk.users.getUser(actor.clerkId);
		const now = new Date();
		try {
			const created = await UserRepository.create(env, {
				id: crypto.randomUUID(),
				clerkId: actor.clerkId,
				username: clerkUser.username,
				displayName:
					[clerkUser.firstName, clerkUser.lastName]
						.filter(Boolean)
						.join(" ") ||
					clerkUser.username ||
					"New user",
				avatarUrl: clerkUser.imageUrl,
				createdAt: now,
				updatedAt: now,
			});
			return {
				success: true as const,
				message: userMessages.PROFILE_CREATED,
				data: { user: created, isNew: true },
			};
		} catch {
			const raced = await UserRepository.fetchOneByClerkId(
				env,
				actor.clerkId,
			);
			if (raced) {
				return {
					success: true as const,
					message: userMessages.PROFILE_FETCHED,
					data: { user: raced, isNew: false },
				};
			}
			return {
				success: false as const,
				message: userMessages.PROFILE_MISSING,
			};
		}
	}

	static async updateMe(env: Env, body: IUpdateMeBody, actor: IActor) {
		const me = await UserRepository.fetchOneByClerkId(env, actor.clerkId);
		if (!me) {
			return {
				success: false as const,
				message: userMessages.PROFILE_MISSING,
			};
		}
		const updated = await UserRepository.update(env, me.id, body);
		if (!updated) {
			return {
				success: false as const,
				message: userMessages.PROFILE_MISSING,
			};
		}
		return {
			success: true as const,
			message: userMessages.PROFILE_UPDATED,
			data: { user: updated },
		};
	}

	static async search(env: Env, query: ISearchUsersQuery, actor: IActor) {
		const me = await UserRepository.fetchOneByClerkId(env, actor.clerkId);
		if (!me) {
			return {
				success: false as const,
				message: userMessages.PROFILE_MISSING,
			};
		}
		const cursor = query.cursor ? decodeCursor(query.cursor) : null;
		const items = await UserRepository.search(env, query.query, me.id, cursor);
		const last = items[items.length - 1];
		return {
			success: true as const,
			message: userMessages.USERS_FETCHED,
			data: {
				items,
				nextCursor: last ? encodeCursor(last.createdAt.getTime(), last.id) : null,
			},
			count: items.length,
		};
	}
}

export default UserService;
