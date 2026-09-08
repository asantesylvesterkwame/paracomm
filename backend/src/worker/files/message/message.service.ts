import MessageRepository from "./message.repository";
import RoomRepository from "../room/room.repository";
import { UserUtils } from "../user/user.utils";
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
import {
	isSameLang,
	isSupportedReadingLang,
	normalizeLang,
} from "../../utils/language";
import type { IActor } from "../../utils/auth";
import type { IMessageRow } from "./message.model";
import type {
	ISendMessageBody,
	IListMessagesQuery,
	IMarkSeenBody,
} from "./message.validation";

interface ITranslationChanges {
	originalLang?: string;
	translatedText?: string | null;
	translatedLang?: string | null;
	translationStatus: "none" | "done" | "failed";
	translationError?: string | null;
}

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
		if (body.clientId) {
			const existing = await MessageRepository.fetchByClientId(
				env,
				roomId,
				body.clientId,
			);
			if (existing) {
				return {
					success: true as const,
					message: messageMessages.MESSAGE_SENT,
					data: existing,
				};
			}
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
		const now = new Date();
		let message: IMessageRow;
		try {
			message = await MessageRepository.create(env, {
				id: crypto.randomUUID(),
				roomId,
				clientId: body.clientId ?? null,
				senderId: me.id,
				originalText: body.text,
				originalLang: me.preferredLang,
				translationStatus: "pending",
				createdAt: now,
				updatedAt: now,
			});
		} catch (error) {
			const raced = body.clientId
				? await MessageRepository.fetchByClientId(env, roomId, body.clientId)
				: null;
			if (!raced) throw error;
			return {
				success: true as const,
				message: messageMessages.MESSAGE_SENT,
				data: raced,
			};
		}
		await RoomRepository.touchLastMessageAt(env, roomId, now);
		await RoomEvents.emit(env, roomId, "message:new", message);
		ctx.waitUntil(
			MessageService.translateMessage(env, message, recipient.preferredLang),
		);
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
	): Promise<IMessageRow | null> {
		try {
			const quota = await checkAndConsumeUserDailyChars(
				env,
				message.senderId,
				message.originalText.length,
			);
			if (!quota.allowed) {
				return MessageService.finishTranslation(env, message, {
					translationStatus: "failed",
					translationError: "quota",
				});
			}
			for (const provider of getTranslationProviders(env)) {
				const outcome = await provider.translate(
					env,
					message.originalText,
					null,
					targetLang,
					{ mode: "auto" },
				);
				if (outcome.ok) {
					return MessageService.finishTranslation(
						env,
						message,
						MessageService.translationChangesOf(
							message,
							outcome.text,
							outcome.detectedLang,
							targetLang,
						),
					);
				}
				console.error(
					`chat translation provider ${provider.name} failed`,
					outcome.error,
				);
			}
			return MessageService.finishTranslation(env, message, {
				translationStatus: "failed",
				translationError: "provider",
			});
		} catch (error) {
			console.error("chat translation crashed", error);
			return MessageService.finishTranslation(env, message, {
				translationStatus: "failed",
				translationError: "provider",
			});
		}
	}

	static translationChangesOf(
		message: IMessageRow,
		translatedText: string,
		detectedLang: string | undefined,
		targetLang: string,
	): ITranslationChanges {
		const originalLang = isSupportedReadingLang(detectedLang)
			? normalizeLang(detectedLang as string)
			: message.originalLang;
		if (isSameLang(originalLang, targetLang)) {
			return {
				originalLang,
				translatedText: null,
				translatedLang: null,
				translationStatus: "none",
				translationError: null,
			};
		}
		return {
			originalLang,
			translatedText,
			translatedLang: targetLang,
			translationStatus: "done",
			translationError: null,
		};
	}

	static async finishTranslation(
		env: Env,
		message: IMessageRow,
		changes: ITranslationChanges,
	) {
		const updated = await MessageRepository.update(env, message.id, changes);
		if (updated) {
			await RoomEvents.emit(
				env,
				message.roomId,
				"message:updated",
				await MessageService.toPayload(env, updated),
			);
		}
		return updated;
	}

	static toPayload(env: Env, message: IMessageRow) {
		return message.kind === "voice"
			? MessageRepository.withVoiceNote(env, message)
			: Promise.resolve(message);
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
		const rows = await MessageRepository.fetchPage(env, roomId, cursor);
		const items = await MessageRepository.withVoiceNotes(env, rows);
		const last = rows[rows.length - 1];
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
		if (
			target.translationStatus !== "failed" ||
			(target.kind === "voice" && target.translationError === "transcription")
		) {
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
			await RoomEvents.emit(
				env,
				roomId,
				"message:updated",
				await MessageService.toPayload(env, pending),
			);
			ctx.waitUntil(MessageService.translateMessage(env, pending, targetLang));
		}
		return {
			success: true as const,
			message: messageMessages.TRANSLATION_RETRYING,
			data: pending ? await MessageService.toPayload(env, pending) : pending,
		};
	}
}

export default MessageService;
