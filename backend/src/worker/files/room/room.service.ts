import RoomRepository from "./room.repository";
import UserRepository from "../user/user.repository";
import { UserUtils } from "../user/user.utils";
import { roomMessages } from "./room.messages";
import { userMessages } from "../user/user.messages";
import { decodeCursor, encodeCursor } from "../../utils/pagination";
import type { IActor } from "../../utils/auth";
import type { ICreateDmBody, IListRoomsQuery } from "./room.validation";
import type { IRoomListRow } from "./room.repository";

const toRoomPayload = (row: IRoomListRow) => ({
	id: row.room.id,
	type: row.room.type,
	otherUser: row.otherUser,
	lastMessage: row.lastMessage,
	unreadCount: row.unreadCount,
	lastMessageAt: row.room.lastMessageAt,
	createdAt: row.room.createdAt,
});

class RoomService {
	static async findOrCreateDm(env: Env, body: ICreateDmBody, actor: IActor) {
		const me = await UserUtils.requireCurrentUser(env, actor);
		if (!me) {
			return { success: false as const, message: userMessages.PROFILE_MISSING };
		}
		if (body.otherUserId === me.id) {
			return {
				success: false as const,
				message: roomMessages.SELF_DM_FORBIDDEN,
			};
		}
		const other = await UserRepository.fetchOneById(env, body.otherUserId);
		if (!other) {
			return {
				success: false as const,
				message: roomMessages.OTHER_USER_NOT_FOUND,
			};
		}
		const dmKey = [me.id, other.id].sort().join("_");
		const existing = await RoomRepository.fetchDmByKey(env, dmKey);
		if (existing) {
			return {
				success: true as const,
				message: roomMessages.ROOM_READY,
				data: {
					room: {
						id: existing.id,
						type: existing.type,
						otherUser: other,
						lastMessage: null,
						unreadCount: 0,
						lastMessageAt: existing.lastMessageAt,
						createdAt: existing.createdAt,
					},
					isNew: false,
				},
			};
		}
		try {
			const created = await RoomRepository.createDm(
				env,
				crypto.randomUUID(),
				dmKey,
				me.id,
				other.id,
			);
			return {
				success: true as const,
				message: roomMessages.ROOM_READY,
				data: {
					room: {
						id: created.id,
						type: created.type,
						otherUser: other,
						lastMessage: null,
						unreadCount: 0,
						lastMessageAt: created.lastMessageAt,
						createdAt: created.createdAt,
					},
					isNew: true,
				},
			};
		} catch {
			const raced = await RoomRepository.fetchDmByKey(env, dmKey);
			if (!raced) {
				return {
					success: false as const,
					message: roomMessages.ROOM_NOT_FOUND,
				};
			}
			return {
				success: true as const,
				message: roomMessages.ROOM_READY,
				data: {
					room: {
						id: raced.id,
						type: raced.type,
						otherUser: other,
						lastMessage: null,
						unreadCount: 0,
						lastMessageAt: raced.lastMessageAt,
						createdAt: raced.createdAt,
					},
					isNew: false,
				},
			};
		}
	}

	static async listRooms(env: Env, query: IListRoomsQuery, actor: IActor) {
		const me = await UserUtils.requireCurrentUser(env, actor);
		if (!me) {
			return { success: false as const, message: userMessages.PROFILE_MISSING };
		}
		const cursor = query.cursor ? decodeCursor(query.cursor) : null;
		const rows = await RoomRepository.listForUser(env, me.id, cursor);
		const last = rows[rows.length - 1];
		const lastActivity = last
			? (last.room.lastMessageAt ?? last.room.createdAt).getTime()
			: null;
		return {
			success: true as const,
			message: roomMessages.ROOMS_FETCHED,
			data: {
				items: rows.map(toRoomPayload),
				nextCursor:
					last && lastActivity !== null
						? encodeCursor(lastActivity, last.room.id)
						: null,
			},
			count: rows.length,
		};
	}

	static async authorizeSocket(env: Env, roomId: string, clerkId: string) {
		const me = await UserRepository.fetchOneByClerkId(env, clerkId);
		if (!me) {
			return { success: false as const, message: userMessages.PROFILE_MISSING };
		}
		const membership = await RoomRepository.fetchMembership(env, roomId, me.id);
		if (!membership) {
			return { success: false as const, message: roomMessages.NOT_A_MEMBER };
		}
		return {
			success: true as const,
			message: roomMessages.ROOM_READY,
			data: { userId: me.id },
		};
	}
}

export default RoomService;
