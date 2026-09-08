import VoiceNoteRepository from "./voice-note.repository";
import MessageRepository from "../message/message.repository";
import MessageService from "../message/message.service";
import RoomRepository from "../room/room.repository";
import { UserUtils } from "../user/user.utils";
import { voiceNoteMessages, voiceNoteCopy } from "./voice-note.messages";
import { roomMessages } from "../room/room.messages";
import { userMessages } from "../user/user.messages";
import { getTranscriptionProviders } from "../../providers/transcription/transcription.registry";
import { getTranslationProviders } from "../../providers/translation/translation.registry";
import { getTtsProviders } from "../../providers/tts/tts.registry";
import { RoomEvents } from "../../utils/roomEvents";
import {
	checkMinuteLimit,
	checkAndConsumeUserDailyChars,
	checkAndConsumeUserDailySeconds,
} from "../../utils/quota";
import { isSameLang } from "../../utils/language";
import { createLogger } from "../../utils/logger";
import {
	DUB_MIME_TYPE,
	STALE_DUB_MS,
	TTS_UNSUPPORTED_LANGS,
} from "./voice-note.constants";
import {
	base64ToBytes,
	bytesToBase64,
	dubObjectKey,
	normalizeMime,
	originalObjectKey,
	secondsOf,
	toVoiceNotePayload,
	wavDurationMs,
} from "./voice-note.utils";
import type { IActor } from "../../utils/auth";
import type { IMessageRow, IMessagePayload } from "../message/message.model";
import type { IVoiceNoteRow } from "./voice-note.model";
import type {
	ISendVoiceNoteBody,
	IRequestDubBody,
	IGetVoiceNoteMediaQuery,
} from "./voice-note.validation";

const logger = createLogger("voice-note");

class VoiceNoteService {
	static async sendVoiceNote(
		env: Env,
		ctx: ExecutionContext,
		roomId: string,
		body: ISendVoiceNoteBody,
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
					message: voiceNoteMessages.VOICE_NOTE_SENT,
					data: await MessageRepository.withVoiceNote(env, existing),
				};
			}
		}
		if (
			getTranscriptionProviders(env).length === 0 ||
			getTtsProviders(env).length === 0
		) {
			logger.error("voice notes not configured");
			return {
				success: false as const,
				message: voiceNoteMessages.NOT_CONFIGURED,
				code: "NOT_CONFIGURED" as const,
			};
		}
		const withinRate = await checkMinuteLimit(env, `user:${me.id}`);
		if (!withinRate) {
			return {
				success: false as const,
				message: voiceNoteMessages.RATE_LIMITED,
				code: "RATE_MINUTE" as const,
				retryAfterSeconds: 60,
			};
		}
		const membership = await RoomRepository.fetchMembership(env, roomId, me.id);
		if (!membership) {
			return { success: false as const, message: roomMessages.NOT_A_MEMBER };
		}
		const quota = await checkAndConsumeUserDailySeconds(
			env,
			me.id,
			secondsOf(body.durationMs),
			"voice",
		);
		if (!quota.allowed) {
			return {
				success: false as const,
				message: voiceNoteMessages.DAILY_LIMIT_REACHED,
				code: "RATE_DAY" as const,
				retryAfterSeconds: quota.retryAfterSeconds,
				remaining: quota.remaining,
			};
		}

		const now = new Date();
		const messageId = crypto.randomUUID();
		const voiceNoteId = crypto.randomUUID();
		const mimeType = normalizeMime(body.audio.type);
		const objectKey = originalObjectKey(roomId, voiceNoteId, mimeType);
		const audioBytes = await (body.audio as unknown as Blob).arrayBuffer();

		logger.log("storing original", {
			roomId,
			voiceNoteId,
			mimeType,
			bytes: audioBytes.byteLength,
			durationMs: body.durationMs,
		});
		await env.MEDIA.put(objectKey, audioBytes, {
			httpMetadata: { contentType: mimeType },
		});

		let created: { message: IMessageRow; voiceNote: IVoiceNoteRow };
		try {
			created = await VoiceNoteRepository.createWithMessage(
				env,
				{
					id: messageId,
					roomId,
					clientId: body.clientId ?? null,
					senderId: me.id,
					kind: "voice",
					voiceNoteId,
					originalText: voiceNoteCopy.PLACEHOLDER,
					originalLang: me.preferredLang,
					translationStatus: "pending",
					createdAt: now,
					updatedAt: now,
				},
				{
					id: voiceNoteId,
					messageId,
					roomId,
					senderId: me.id,
					objectKey,
					mimeType,
					durationMs: body.durationMs,
					byteSize: audioBytes.byteLength,
					transcriptionStatus: "pending",
					createdAt: now,
					updatedAt: now,
				},
			);
		} catch (error) {
			await env.MEDIA.delete(objectKey);
			const raced = body.clientId
				? await MessageRepository.fetchByClientId(env, roomId, body.clientId)
				: null;
			if (!raced) throw error;
			return {
				success: true as const,
				message: voiceNoteMessages.VOICE_NOTE_SENT,
				data: await MessageRepository.withVoiceNote(env, raced),
			};
		}

		await RoomRepository.touchLastMessageAt(env, roomId, now);
		const hydrated: IMessagePayload = {
			...created.message,
			voiceNote: toVoiceNotePayload(created.voiceNote, []),
		};
		await RoomEvents.emit(env, roomId, "message:new", hydrated);
		ctx.waitUntil(
			VoiceNoteService.processVoiceNote(
				env,
				created.message,
				created.voiceNote,
				membership.otherUser.preferredLang,
				audioBytes,
			),
		);
		return {
			success: true as const,
			message: voiceNoteMessages.VOICE_NOTE_SENT,
			data: hydrated,
			remainingSeconds: quota.remaining,
		};
	}

	static async processVoiceNote(
		env: Env,
		message: IMessageRow,
		voiceNote: IVoiceNoteRow,
		readerLang: string,
		audioBytes?: ArrayBuffer,
		extraDubLang?: string,
	) {
		const startedAt = Date.now();
		logger.log("pipeline start", {
			messageId: message.id,
			voiceNoteId: voiceNote.id,
			readerLang,
			extraDubLang,
		});
		try {
			const bytes =
				audioBytes ??
				(await (await env.MEDIA.get(voiceNote.objectKey))?.arrayBuffer());
			if (!bytes) {
				await VoiceNoteService.failTranscription(env, message, voiceNote, "missing");
				return;
			}
			const audioBase64 = bytesToBase64(bytes);
			let transcript: string | null = null;
			let lastError = "provider";
			for (const provider of getTranscriptionProviders(env)) {
				const outcome = await provider.transcribe(env, {
					audioBase64,
					mimeType: voiceNote.mimeType,
				});
				if (outcome.ok) {
					transcript = outcome.text;
					break;
				}
				lastError = outcome.error === "empty transcript" ? "empty" : "provider";
				logger.error(`transcription provider ${provider.name} failed`, {
					error: outcome.error,
				});
			}
			if (!transcript) {
				await VoiceNoteService.failTranscription(env, message, voiceNote, lastError);
				return;
			}

			const transcribedNote = await VoiceNoteRepository.update(env, voiceNote.id, {
				transcript,
				transcriptionStatus: "done",
				transcriptionError: null,
			});
			const transcribedMessage = await MessageRepository.update(env, message.id, {
				originalText: transcript,
			});
			if (!transcribedNote || !transcribedMessage) return;
			await VoiceNoteService.emitUpdated(env, message.id);
			logger.log("transcribed", {
				messageId: message.id,
				chars: transcript.length,
				elapsedMs: Date.now() - startedAt,
			});

			const translated = await MessageService.translateMessage(
				env,
				transcribedMessage,
				readerLang,
			);
			const detectedLang = translated?.originalLang ?? transcribedMessage.originalLang;
			const noteWithLang = await VoiceNoteRepository.update(env, voiceNote.id, {
				transcriptLang: detectedLang,
			});
			if (!translated || !noteWithLang) return;
			logger.log("translated", {
				messageId: message.id,
				detectedLang,
				translationStatus: translated.translationStatus,
				elapsedMs: Date.now() - startedAt,
			});

			const dubLangs = new Set<string>();
			if (translated.translationStatus === "done") dubLangs.add(readerLang);
			if (extraDubLang && !isSameLang(extraDubLang, detectedLang)) {
				dubLangs.add(extraDubLang);
			}
			if (dubLangs.size === 0) {
				await VoiceNoteService.emitUpdated(env, message.id);
				return;
			}
			for (const lang of dubLangs) {
				await VoiceNoteService.produceDub(
					env,
					translated,
					noteWithLang,
					lang,
					message.senderId,
				);
			}
			logger.log("pipeline done", {
				messageId: message.id,
				dubs: [...dubLangs],
				elapsedMs: Date.now() - startedAt,
			});
		} catch (error) {
			logger.error("pipeline crashed", { messageId: message.id, error: String(error) });
			await VoiceNoteService.failTranscription(env, message, voiceNote, "provider");
		}
	}

	static async failTranscription(
		env: Env,
		message: IMessageRow,
		voiceNote: IVoiceNoteRow,
		reason: string,
	) {
		logger.warn("transcription failed", { messageId: message.id, reason });
		await VoiceNoteRepository.update(env, voiceNote.id, {
			transcriptionStatus: "failed",
			transcriptionError: reason,
		});
		await MessageRepository.update(env, message.id, {
			translationStatus: "failed",
			translationError: "transcription",
		});
		await VoiceNoteService.emitUpdated(env, message.id);
	}

	static async produceDub(
		env: Env,
		message: IMessageRow,
		voiceNote: IVoiceNoteRow,
		lang: string,
		requestedBy: string,
	) {
		const startedAt = Date.now();
		const now = new Date();
		if (TTS_UNSUPPORTED_LANGS.includes(lang)) {
			await VoiceNoteRepository.upsertDub(env, {
				id: crypto.randomUUID(),
				voiceNoteId: voiceNote.id,
				lang,
				requestedBy,
				status: "pending",
				createdAt: now,
				updatedAt: now,
			});
			await VoiceNoteService.failDub(env, message.id, voiceNote.id, lang, "unsupported");
			return;
		}
		await VoiceNoteRepository.upsertDub(env, {
			id: crypto.randomUUID(),
			voiceNoteId: voiceNote.id,
			lang,
			requestedBy,
			status: "pending",
			createdAt: now,
			updatedAt: now,
		});
		await VoiceNoteService.emitUpdated(env, message.id);
		logger.log("dub start", { messageId: message.id, lang });

		try {
			let text: string | null =
				isSameLang(message.translatedLang, lang) && message.translatedText
					? message.translatedText
					: null;
			if (!text) {
				const transcript = voiceNote.transcript;
				if (!transcript) {
					await VoiceNoteService.failDub(env, message.id, voiceNote.id, lang, "provider");
					return;
				}
				const quota = await checkAndConsumeUserDailyChars(
					env,
					requestedBy,
					transcript.length,
				);
				if (!quota.allowed) {
					await VoiceNoteService.failDub(env, message.id, voiceNote.id, lang, "quota");
					return;
				}
				for (const provider of getTranslationProviders(env)) {
					const outcome = await provider.translate(
						env,
						transcript,
						voiceNote.transcriptLang,
						lang,
						{ mode: "chat" },
					);
					if (outcome.ok) {
						text = outcome.text;
						break;
					}
					logger.error(`dub translation provider ${provider.name} failed`, {
						error: outcome.error,
					});
				}
				if (!text) {
					await VoiceNoteService.failDub(env, message.id, voiceNote.id, lang, "provider");
					return;
				}
			}

			let audioBase64: string | null = null;
			for (const provider of getTtsProviders(env)) {
				const outcome = await provider.speak(env, text, lang);
				if (outcome.ok) {
					audioBase64 = outcome.audioBase64;
					break;
				}
				logger.error(`dub tts provider ${provider.name} failed`, {
					error: outcome.error,
				});
			}
			if (!audioBase64) {
				await VoiceNoteService.failDub(env, message.id, voiceNote.id, lang, "provider");
				return;
			}

			const bytes = base64ToBytes(audioBase64);
			const objectKey = dubObjectKey(message.roomId, voiceNote.id, lang);
			await env.MEDIA.put(objectKey, bytes, {
				httpMetadata: { contentType: DUB_MIME_TYPE },
			});
			const dub = await VoiceNoteRepository.fetchDub(env, voiceNote.id, lang);
			if (dub) {
				await VoiceNoteRepository.updateDub(env, dub.id, {
					status: "done",
					text,
					objectKey,
					mimeType: DUB_MIME_TYPE,
					byteSize: bytes.byteLength,
					durationMs: wavDurationMs(bytes),
					error: null,
				});
			}
			await VoiceNoteService.emitUpdated(env, message.id);
			logger.log("dub done", {
				messageId: message.id,
				lang,
				bytes: bytes.byteLength,
				elapsedMs: Date.now() - startedAt,
			});
		} catch (error) {
			logger.error("dub crashed", { messageId: message.id, lang, error: String(error) });
			await VoiceNoteService.failDub(env, message.id, voiceNote.id, lang, "provider");
		}
	}

	static async failDub(
		env: Env,
		messageId: string,
		voiceNoteId: string,
		lang: string,
		reason: string,
	) {
		logger.warn("dub failed", { messageId, lang, reason });
		const dub = await VoiceNoteRepository.fetchDub(env, voiceNoteId, lang);
		if (dub) {
			await VoiceNoteRepository.updateDub(env, dub.id, {
				status: "failed",
				error: reason,
			});
		}
		await VoiceNoteService.emitUpdated(env, messageId);
	}

	static async requestDub(
		env: Env,
		ctx: ExecutionContext,
		roomId: string,
		messageId: string,
		body: IRequestDubBody,
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
		const message = await MessageRepository.fetchOne(env, roomId, messageId);
		if (!message || message.kind !== "voice" || !message.voiceNoteId) {
			return {
				success: false as const,
				message: voiceNoteMessages.VOICE_NOTE_NOT_FOUND,
			};
		}
		const voiceNote = await VoiceNoteRepository.fetchByMessageId(env, message.id);
		if (!voiceNote) {
			return {
				success: false as const,
				message: voiceNoteMessages.VOICE_NOTE_NOT_FOUND,
			};
		}
		const lang = body.lang;
		logger.log("dub requested", { messageId, lang, userId: me.id });

		const existing = await VoiceNoteRepository.fetchDub(env, voiceNote.id, lang);
		if (existing?.status === "done") {
			return {
				success: true as const,
				message: voiceNoteMessages.DUB_ALREADY_READY,
				data: await MessageRepository.withVoiceNote(env, message),
			};
		}
		const isFresh =
			existing?.status === "pending" &&
			Date.now() - existing.updatedAt.getTime() < STALE_DUB_MS;
		if (isFresh) {
			return {
				success: true as const,
				message: voiceNoteMessages.DUB_REQUESTED,
				data: await MessageRepository.withVoiceNote(env, message),
			};
		}

		const withinRate = await checkMinuteLimit(env, `user:${me.id}`);
		if (!withinRate) {
			return {
				success: false as const,
				message: voiceNoteMessages.RATE_LIMITED,
				code: "RATE_MINUTE" as const,
				retryAfterSeconds: 60,
			};
		}

		if (voiceNote.transcriptionStatus !== "done") {
			const readerLang =
				message.senderId === me.id
					? membership.otherUser.preferredLang
					: me.preferredLang;
			const pendingNote = await VoiceNoteRepository.update(env, voiceNote.id, {
				transcriptionStatus: "pending",
				transcriptionError: null,
			});
			const pendingMessage = await MessageRepository.update(env, message.id, {
				translationStatus: "pending",
				translationError: null,
			});
			if (!pendingNote || !pendingMessage) {
				return {
					success: false as const,
					message: voiceNoteMessages.VOICE_NOTE_NOT_FOUND,
				};
			}
			const hydrated = await MessageRepository.withVoiceNote(env, pendingMessage);
			await RoomEvents.emit(env, roomId, "message:updated", hydrated);
			ctx.waitUntil(
				VoiceNoteService.processVoiceNote(
					env,
					pendingMessage,
					pendingNote,
					readerLang,
					undefined,
					lang,
				),
			);
			return {
				success: true as const,
				message: voiceNoteMessages.DUB_REQUESTED,
				data: hydrated,
			};
		}

		if (isSameLang(voiceNote.transcriptLang, lang)) {
			return {
				success: false as const,
				message: voiceNoteMessages.DUB_SAME_LANGUAGE,
				code: "SAME_LANGUAGE" as const,
			};
		}
		if (TTS_UNSUPPORTED_LANGS.includes(lang)) {
			return {
				success: false as const,
				message: voiceNoteMessages.DUB_UNSUPPORTED,
				code: "UNSUPPORTED" as const,
			};
		}
		const quota = await checkAndConsumeUserDailySeconds(
			env,
			me.id,
			secondsOf(voiceNote.durationMs),
			"voice",
		);
		if (!quota.allowed) {
			return {
				success: false as const,
				message: voiceNoteMessages.DAILY_LIMIT_REACHED,
				code: "RATE_DAY" as const,
				retryAfterSeconds: quota.retryAfterSeconds,
				remaining: quota.remaining,
			};
		}

		const now = new Date();
		await VoiceNoteRepository.upsertDub(env, {
			id: crypto.randomUUID(),
			voiceNoteId: voiceNote.id,
			lang,
			requestedBy: me.id,
			status: "pending",
			createdAt: now,
			updatedAt: now,
		});
		ctx.waitUntil(
			VoiceNoteService.produceDub(env, message, voiceNote, lang, me.id),
		);
		return {
			success: true as const,
			message: voiceNoteMessages.DUB_REQUESTED,
			data: await MessageRepository.withVoiceNote(env, message),
		};
	}

	static async streamMedia(
		env: Env,
		roomId: string,
		voiceNoteId: string,
		query: IGetVoiceNoteMediaQuery,
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
		const voiceNote = await VoiceNoteRepository.fetchOne(env, roomId, voiceNoteId);
		if (!voiceNote) {
			return { success: false as const, message: voiceNoteMessages.MEDIA_NOT_FOUND };
		}
		let objectKey = voiceNote.objectKey;
		let mimeType = voiceNote.mimeType;
		if (query.dub) {
			const dub = await VoiceNoteRepository.fetchDub(env, voiceNote.id, query.dub);
			if (!dub || dub.status !== "done" || !dub.objectKey) {
				return { success: false as const, message: voiceNoteMessages.MEDIA_NOT_FOUND };
			}
			objectKey = dub.objectKey;
			mimeType = dub.mimeType ?? DUB_MIME_TYPE;
		}
		const object = await env.MEDIA.get(objectKey);
		if (!object) {
			logger.warn("media object missing", { objectKey });
			return { success: false as const, message: voiceNoteMessages.MEDIA_NOT_FOUND };
		}
		return {
			success: true as const,
			message: voiceNoteMessages.MEDIA_READY,
			data: { object, mimeType },
		};
	}

	static async emitUpdated(env: Env, messageId: string) {
		const message = await MessageRepository.fetchById(env, messageId);
		if (!message) return;
		const hydrated = await MessageRepository.withVoiceNote(env, message);
		await RoomEvents.emit(env, message.roomId, "message:updated", hydrated);
	}

	static async sweepStaleDubs(env: Env) {
		const before = new Date(Date.now() - STALE_DUB_MS);
		const staleDubs = await VoiceNoteRepository.fetchStalePendingDubs(env, before);
		const staleNotes = await VoiceNoteRepository.fetchStalePendingNotes(env, before);
		if (staleDubs.length === 0 && staleNotes.length === 0) {
			return { success: true as const, message: voiceNoteMessages.MEDIA_READY };
		}
		logger.warn("sweeping stale voice work", {
			dubs: staleDubs.length,
			notes: staleNotes.length,
		});
		const noteIds = [...new Set(staleDubs.map((dub) => dub.voiceNoteId))];
		const notes = await VoiceNoteRepository.fetchByIds(env, noteIds);
		const messageIdOf = new Map(notes.map((note) => [note.id, note.messageId]));
		for (const dub of staleDubs) {
			await VoiceNoteRepository.updateDub(env, dub.id, {
				status: "failed",
				error: "timeout",
			});
			const messageId = messageIdOf.get(dub.voiceNoteId);
			if (messageId) await VoiceNoteService.emitUpdated(env, messageId);
		}
		for (const note of staleNotes) {
			const message = await MessageRepository.fetchById(env, note.messageId);
			if (!message) continue;
			await VoiceNoteService.failTranscription(env, message, note, "timeout");
		}
		return { success: true as const, message: voiceNoteMessages.MEDIA_READY };
	}
}

export default VoiceNoteService;
