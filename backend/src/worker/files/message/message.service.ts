import MessageRepository from "./message.repository";
import RoomRepository from "../room/room.repository";
import { UserUtils } from "../user/user.utils";
import { normalizeLang } from "./message.utils";
import { messageMessages } from "./message.messages";
import { roomMessages } from "../room/room.messages";
import { userMessages } from "../user/user.messages";
import { getTranslationProviders } from "../../providers/translation/translation.registry";
import { RoomEvents } from "../../utils/roomEvents";
import {
	checkMinuteLimit,
	checkAndConsumeUserDailyChars,
} from "../../utils/quota";
import { decodeCursor, encodeCursor } from "../../utils/pagination";
import type { IActor } from "../../utils/auth";
import type { IMessageRow } from "./message.model";
import type {
	ISendMessageBody,
	IListMessagesQuery,
	IMarkSeenBody,
} from "./message.validation";

class MessageService {
	static async sendMessage(
		env: Env,
		ctx: ExecutionContext,
		roomId: string,
		body: ISendMessageBody,
		actor: IActor,
	) {
		const me = await UserUtils.requireCurrentUser(env, actor);
		if (!me) {
			return { success: false as const, message: userMessages.PROFILE_MISSING };
		}
		const withinRate = await checkMinuteLimit(env, `user:${me.id}`);
		if (!withinRate) {
			return {
				success: false as const,
				message: messageMessages.RATE_LIMITED,
				code: "RATE_MINUTE" as const,
				retryAfterSeconds: 60,
			};
		}
		const membership = await RoomRepository.fetchMembership(env, roomId, me.id);
		if (!membership) {
			return { success: false as const, message: roomMessages.NOT_A_MEMBER };
		}
		const recipient = membership.otherUser;
		const skipTranslation =
			normalizeLang(me.preferredLang) === normalizeLang(recipient.preferredLang);
		const now = new Date();
		const message = await MessageRepository.create(env, {
			id: crypto.randomUUID(),
			roomId,
			senderId: me.id,
			originalText: body.text,
			originalLang: me.preferredLang,
			translationStatus: skipTranslation ? "none" : "pending",
			createdAt: now,
			updatedAt: now,
		});
		await RoomRepository.touchLastMessageAt(env, roomId, now);
		await RoomEvents.emit(env, roomId, "message:new", message);
		if (!skipTranslation) {
			ctx.waitUntil(
				MessageService.translateMessage(env, message, recipient.preferredLang),
			);
		}
		return {
			success: true as const,
			message: messageMessages.MESSAGE_SENT,
			data: message,
		};
	}

	static async translateMessage(
		env: Env,
		message: IMessageRow,
		targetLang: string,
	) {
		try {
			const quota = await checkAndConsumeUserDailyChars(
				env,
				message.senderId,
				message.originalText.length,
			);
			if (!quota.allowed) {
				await MessageService.finishTranslation(env, message, {
					translationStatus: "failed",
					translationError: "quota",
				});
				return;
			}
			for (const provider of getTranslationProviders(env)) {
				const outcome = await provider.translate(
					env,
					message.originalText,
					message.originalLang,
					targetLang,
				);
				if (outcome.ok) {
					await MessageService.finishTranslation(env, message, {
						translatedText: outcome.text,
						translatedLang: targetLang,
						translationStatus: "done",
						translationError: null,
					});
					return;
				}
				console.error(
					`chat translation provider ${provider.name} failed`,
					outcome.error,
				);
			}
			await MessageService.finishTranslation(env, message, {
				translationStatus: "failed",
				translationError: "provider",
			});
		} catch (error) {
			console.error("chat translation crashed", error);
			await MessageService.finishTranslation(env, message, {
				translationStatus: "failed",
				translationError: "provider",
			});
		}
	}

	static async finishTranslation(
		env: Env,
		message: IMessageRow,
		changes: {
			translatedText?: string;
			translatedLang?: string;
			translationStatus: "done" | "failed";
			translationError?: string | null;
		},
	) {
		const updated = await MessageRepository.update(env, message.id, changes);
		if (updated) {
			await RoomEvents.emit(env, message.roomId, "message:updated", updated);
		}
	}

	static async listMessages(
		env: Env,
		roomId: string,
		query: IListMessagesQuery,
		actor: IActor,
	) {
		const me = await UserUtils.requireCurrentUser(env, actor);
		if (!me) {
			return { success: false as const, message: userMessages.PROFILE_MISSING };
		}
		const membership = await RoomRepository.fetchMembership(env, roomId, me.id);
		if (!membership) {
			return { success: false as const, message: roomMessages.NOT_A_MEMBER };
		}
		const cursor = query.cursor ? decodeCursor(query.cursor) : null;
		const items = await MessageRepository.fetchPage(env, roomId, cursor);
		const last = items[items.length - 1];
		return {
			success: true as const,
			message: messageMessages.MESSAGES_FETCHED,
			data: {
				items,
				nextCursor: last
					? encodeCursor(last.createdAt.getTime(), last.id)
					: null,
			},
			count: items.length,
		};
	}

	static async markSeen(
		env: Env,
		roomId: string,
		body: IMarkSeenBody,
		actor: IActor,
	) {
		const me = await UserUtils.requireCurrentUser(env, actor);
		if (!me) {
			return { success: false as const, message: userMessages.PROFILE_MISSING };
		}
		const membership = await RoomRepository.fetchMembership(env, roomId, me.id);
		if (!membership) {
			return { success: false as const, message: roomMessages.NOT_A_MEMBER };
		}
		const target = await MessageRepository.fetchOne(
			env,
			roomId,
			body.lastSeenMessageId,
		);
		if (!target) {
			return {
				success: false as const,
				message: messageMessages.MESSAGE_NOT_FOUND,
			};
		}
		await RoomRepository.updateMemberSeen(
			env,
			roomId,
			me.id,
			target.id,
			target.createdAt,
		);
		await RoomEvents.emit(env, roomId, "message:seen", {
			roomId,
			userId: me.id,
			lastSeenMessageId: target.id,
		});
		return {
			success: true as const,
			message: messageMessages.SEEN_UPDATED,
			data: { roomId, lastSeenMessageId: target.id },
		};
	}

	static async retryTranslation(
		env: Env,
		ctx: ExecutionContext,
		roomId: string,
		messageId: string,
		actor: IActor,
	) {
		const me = await UserUtils.requireCurrentUser(env, actor);
		if (!me) {
			return { success: false as const, message: userMessages.PROFILE_MISSING };
		}
		const membership = await RoomRepository.fetchMembership(env, roomId, me.id);
		if (!membership) {
			return { success: false as const, message: roomMessages.NOT_A_MEMBER };
		}
		const target = await MessageRepository.fetchOne(env, roomId, messageId);
		if (!target) {
			return {
				success: false as const,
				message: messageMessages.MESSAGE_NOT_FOUND,
			};
		}
		if (target.translationStatus !== "failed") {
			return {
				success: false as const,
				message: messageMessages.TRANSLATION_NOT_FAILED,
			};
		}
		const targetLang =
			target.senderId === me.id
				? membership.otherUser.preferredLang
				: me.preferredLang;
		const pending = await MessageRepository.update(env, target.id, {
			translationStatus: "pending",
			translationError: null,
		});
		if (pending) {
			await RoomEvents.emit(env, roomId, "message:updated", pending);
			ctx.waitUntil(MessageService.translateMessage(env, pending, targetLang));
		}
		return {
			success: true as const,
			message: messageMessages.TRANSLATION_RETRYING,
			data: pending,
		};
	}
}

export default MessageService;
