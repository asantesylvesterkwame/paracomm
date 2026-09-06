import CallRepository from "./call.repository";
import RoomRepository from "../room/room.repository";
import MessageRepository from "../message/message.repository";
import { UserUtils } from "../user/user.utils";
import { callMessages, callEntryCopy } from "./call.messages";
import { roomMessages } from "../room/room.messages";
import { userMessages } from "../user/user.messages";
import { getVideoProviders } from "../../providers/video/video.registry";
import { getTranslationProviders } from "../../providers/translation/translation.registry";
import { getDubbingProviders } from "../../providers/dubbing/dubbing.registry";
import { RoomEvents } from "../../utils/roomEvents";
import { UserEvents } from "../../utils/userEvents";
import {
	checkCaptionMinuteLimit,
	checkDubbingMinuteLimit,
	checkAndConsumeUserDailyChars,
	checkAndConsumeUserDailySeconds,
} from "../../utils/quota";
import {
	CALL_ROOM_TTL_SECONDS,
	CALL_TOKEN_TTL_SECONDS,
	RING_TIMEOUT_SECONDS,
	MAX_CALL_PARTICIPANTS,
} from "./call.constants";
import { buildCallSummary, callDisplayName } from "./call.utils";
import type { IActor } from "../../utils/auth";
import type { ICallRow, CallStatus } from "./call.model";
import type { IUser } from "../user/user.model";
import type {
	ITranslateCaptionBody,
	IEndCallBody,
	IStartDubbingBody,
} from "./call.validation";

class CallService {
	static async startCall(env: Env, roomId: string, actor: IActor) {
		const me = await UserUtils.requireCurrentUser(env, actor);
		if (!me) {
			return { success: false as const, message: userMessages.PROFILE_MISSING };
		}
		const membership = await RoomRepository.fetchMembership(env, roomId, me.id);
		if (!membership) {
			return { success: false as const, message: roomMessages.NOT_A_MEMBER };
		}
		const running = await CallRepository.fetchActiveForRoom(env, roomId);
		if (running) {
			return {
				success: false as const,
				message: callMessages.CALL_ALREADY_RUNNING,
				data: { call: buildCallSummary(running) },
			};
		}
		const providers = getVideoProviders(env);
		if (providers.length === 0) {
			return {
				success: false as const,
				message: callMessages.VIDEO_NOT_CONFIGURED,
			};
		}

		const callId = crypto.randomUUID();
		const now = new Date();
		const expiresAtSeconds =
			Math.floor(now.getTime() / 1000) + CALL_ROOM_TTL_SECONDS;

		for (const provider of providers) {
			const room = await provider.createRoom(env, {
				name: `paracomm-${callId}`,
				expiresAt: expiresAtSeconds,
				maxParticipants: MAX_CALL_PARTICIPANTS,
			});
			if (!room.ok) {
				console.error(`video provider ${provider.name} createRoom failed`, room.error);
				continue;
			}
			const token = await provider.createToken(env, {
				roomName: room.name,
				userId: me.id,
				userName: callDisplayName(me),
				expiresAt: Math.floor(now.getTime() / 1000) + CALL_TOKEN_TTL_SECONDS,
				isOwner: true,
			});
			if (!token.ok) {
				console.error(`video provider ${provider.name} createToken failed`, token.error);
				await provider.deleteRoom(env, room.name);
				continue;
			}

			const entry = await MessageRepository.create(env, {
				id: crypto.randomUUID(),
				roomId,
				clientId: null,
				senderId: me.id,
				kind: "call",
				callId,
				originalText: callEntryCopy.ringing,
				originalLang: me.preferredLang,
				translationStatus: "none",
				createdAt: now,
				updatedAt: now,
			});

			const call = await CallRepository.create(env, {
				id: callId,
				roomId,
				initiatorId: me.id,
				messageId: entry.id,
				providerName: provider.name,
				providerRoomName: room.name,
				providerRoomUrl: room.url,
				status: "ringing",
				expiresAt: new Date(expiresAtSeconds * 1000),
				createdAt: now,
				updatedAt: now,
			});

			await RoomRepository.touchLastMessageAt(env, roomId, now);
			await RoomEvents.emit(env, roomId, "message:new", entry);
			await UserEvents.emitToMany(
				env,
				[me.id, membership.otherUser.id],
				"call:ringing",
				{
					call: buildCallSummary(call),
					roomId,
					caller: me,
					callee: membership.otherUser,
				},
			);

			return {
				success: true as const,
				message: callMessages.CALL_STARTED,
				data: {
					call: buildCallSummary(call),
					roomUrl: room.url,
					token: token.token,
					otherUser: membership.otherUser,
					ringTimeoutSeconds: RING_TIMEOUT_SECONDS,
				},
			};
		}

		return {
			success: false as const,
			message: callMessages.VIDEO_PROVIDER_FAILED,
		};
	}

	static async joinCall(env: Env, callId: string, actor: IActor) {
		const context = await CallService.resolveParticipant(env, callId, actor);
		if (!context.success) return context;
		const { call, me, otherUser } = context.data;

		if (call.status !== "ringing" && call.status !== "active") {
			return {
				success: false as const,
				message: callMessages.CALL_NOT_JOINABLE,
			};
		}

		const provider = getVideoProviders(env).find(
			(candidate) => candidate.name === call.providerName,
		);
		if (!provider) {
			return {
				success: false as const,
				message: callMessages.VIDEO_NOT_CONFIGURED,
			};
		}

		const token = await provider.createToken(env, {
			roomName: call.providerRoomName,
			userId: me.id,
			userName: callDisplayName(me),
			expiresAt:
				Math.floor(Date.now() / 1000) + CALL_TOKEN_TTL_SECONDS,
			isOwner: call.initiatorId === me.id,
		});
		if (!token.ok) {
			console.error(`video provider ${provider.name} createToken failed`, token.error);
			return {
				success: false as const,
				message: callMessages.VIDEO_PROVIDER_FAILED,
			};
		}

		let current = call;
		if (call.status === "ringing" && call.initiatorId !== me.id) {
			const answered = await CallRepository.updateIfStatus(
				env,
				call.id,
				["ringing"],
				{ status: "active", answeredAt: new Date() },
			);
			if (answered) {
				current = answered;
				await UserEvents.emitToMany(
					env,
					[call.initiatorId, me.id],
					"call:accepted",
					{ call: buildCallSummary(current), roomId: call.roomId },
				);
			}
		}

		return {
			success: true as const,
			message: callMessages.CALL_JOINED,
			data: {
				call: buildCallSummary(current),
				roomUrl: current.providerRoomUrl,
				token: token.token,
				otherUser,
			},
		};
	}

	static async declineCall(env: Env, callId: string, actor: IActor) {
		return CallService.terminate(env, callId, actor, "declined");
	}

	static async endCall(
		env: Env,
		callId: string,
		body: IEndCallBody,
		actor: IActor,
	) {
		const status: CallStatus =
			body.reason === "declined"
				? "declined"
				: body.reason === "missed"
					? "missed"
					: "ended";
		return CallService.terminate(env, callId, actor, status);
	}

	static async terminate(
		env: Env,
		callId: string,
		actor: IActor,
		status: CallStatus,
	) {
		const context = await CallService.resolveParticipant(env, callId, actor);
		if (!context.success) return context;
		const { call, me, otherUser } = context.data;

		if (call.status !== "ringing" && call.status !== "active") {
			return {
				success: true as const,
				message: callMessages.CALL_ENDED,
				data: { call: buildCallSummary(call) },
			};
		}

		const resolved: CallStatus =
			status === "declined" && call.status === "active" ? "ended" : status;
		const closed = await CallService.close(env, call, resolved);
		await UserEvents.emitToMany(
			env,
			[me.id, otherUser.id],
			resolved === "declined" ? "call:declined" : "call:ended",
			{ call: buildCallSummary(closed), roomId: call.roomId },
		);

		return {
			success: true as const,
			message:
				resolved === "declined"
					? callMessages.CALL_DECLINED
					: callMessages.CALL_ENDED,
			data: { call: buildCallSummary(closed) },
		};
	}

	static async close(env: Env, call: ICallRow, status: CallStatus) {
		const endedAt = new Date();
		const updated =
			(await CallRepository.updateIfStatus(
				env,
				call.id,
				["ringing", "active"],
				{ status, endedAt },
			)) ?? call;

		if (call.messageId) {
			const entry = await MessageRepository.update(env, call.messageId, {
				originalText: callEntryCopy[status] ?? callEntryCopy.ended,
			});
			if (entry) {
				await RoomEvents.emit(env, call.roomId, "message:updated", entry);
			}
		}

		const provider = getVideoProviders(env).find(
			(candidate) => candidate.name === call.providerName,
		);
		if (provider) {
			await provider.deleteRoom(env, call.providerRoomName);
		}

		return updated;
	}

	static async translateCaption(
		env: Env,
		callId: string,
		body: ITranslateCaptionBody,
		actor: IActor,
	) {
		const context = await CallService.resolveParticipant(env, callId, actor);
		if (!context.success) return context;
		const { me } = context.data;

		const withinRate = await checkCaptionMinuteLimit(env, `caption:${me.id}`);
		if (!withinRate) {
			return {
				success: false as const,
				message: callMessages.CAPTION_LIMIT_REACHED,
				code: "RATE_MINUTE" as const,
				retryAfterSeconds: 60,
			};
		}

		const quota = await checkAndConsumeUserDailyChars(
			env,
			me.id,
			body.text.length,
		);
		if (!quota.allowed) {
			return {
				success: false as const,
				message: callMessages.CAPTION_DAILY_LIMIT_REACHED,
				code: "RATE_DAY" as const,
				retryAfterSeconds: quota.retryAfterSeconds,
				remaining: quota.remaining,
			};
		}

		for (const provider of getTranslationProviders(env)) {
			const outcome = await provider.translate(
				env,
				body.text,
				body.sourceLang,
				body.targetLang,
				{ mode: "caption" },
			);
			if (outcome.ok) {
				return {
					success: true as const,
					message: callMessages.CAPTION_TRANSLATED,
					data: {
						translation: outcome.text,
						provider: provider.name,
						sourceLang: body.sourceLang,
						targetLang: body.targetLang,
						remainingChars: quota.remaining,
					},
				};
			}
			console.error(
				`caption translation provider ${provider.name} failed`,
				outcome.error,
			);
		}

		return {
			success: false as const,
			message: callMessages.CAPTION_PROVIDER_FAILED,
			code: "PROVIDER" as const,
		};
	}

	static async startDubbing(
		env: Env,
		callId: string,
		body: IStartDubbingBody,
		actor: IActor,
	) {
		const context = await CallService.resolveParticipant(env, callId, actor);
		if (!context.success) return context;
		const { me } = context.data;

		const providers = getDubbingProviders(env);
		if (providers.length === 0) {
			return {
				success: false as const,
				message: callMessages.DUBBING_NOT_CONFIGURED,
			};
		}

		const withinRate = await checkDubbingMinuteLimit(env, `dubbing:${me.id}`);
		if (!withinRate) {
			return {
				success: false as const,
				message: callMessages.DUBBING_LIMIT_REACHED,
				code: "RATE_MINUTE" as const,
				retryAfterSeconds: 60,
			};
		}

		const sessionSeconds = Number(env.DUBBING_SESSION_SECONDS);
		const quota = await checkAndConsumeUserDailySeconds(
			env,
			me.id,
			sessionSeconds,
		);
		if (!quota.allowed) {
			return {
				success: false as const,
				message: callMessages.DUBBING_DAILY_LIMIT_REACHED,
				code: "RATE_DAY" as const,
				retryAfterSeconds: quota.retryAfterSeconds,
				remaining: quota.remaining,
			};
		}

		for (const provider of providers) {
			const outcome = await provider.createSession(env, {
				targetLang: body.targetLang,
				ttlSeconds: sessionSeconds,
			});
			if (outcome.ok) {
				return {
					success: true as const,
					message: callMessages.DUBBING_STARTED,
					data: {
						token: outcome.token,
						expiresAt: outcome.expiresAt,
						model: outcome.model,
						provider: provider.name,
						targetLang: body.targetLang,
						sessionSeconds,
						remainingSeconds: quota.remaining,
					},
				};
			}
			console.error(
				`dubbing provider ${provider.name} failed`,
				outcome.error,
			);
		}

		return {
			success: false as const,
			message: callMessages.DUBBING_PROVIDER_FAILED,
			code: "PROVIDER" as const,
		};
	}

	static async resolveParticipant(env: Env, callId: string, actor: IActor) {
		const me = await UserUtils.requireCurrentUser(env, actor);
		if (!me) {
			return { success: false as const, message: userMessages.PROFILE_MISSING };
		}
		const call = await CallRepository.fetchOne(env, callId);
		if (!call) {
			return { success: false as const, message: callMessages.CALL_NOT_FOUND };
		}
		const membership = await RoomRepository.fetchMembership(
			env,
			call.roomId,
			me.id,
		);
		if (!membership) {
			return {
				success: false as const,
				message: callMessages.NOT_A_PARTICIPANT,
			};
		}
		return {
			success: true as const,
			message: callMessages.CALL_JOINED,
			data: {
				call,
				me: me as IUser,
				otherUser: membership.otherUser,
			},
		};
	}

	static async sweepStaleCalls(env: Env) {
		const now = Date.now();
		const stale = await CallRepository.fetchStale(
			env,
			new Date(now - RING_TIMEOUT_SECONDS * 1000),
			new Date(now),
		);
		for (const call of stale) {
			const status: CallStatus = call.status === "ringing" ? "missed" : "ended";
			const closed = await CallService.close(env, call, status);
			const membership = await RoomRepository.fetchMembership(
				env,
				call.roomId,
				call.initiatorId,
			);
			const audience = membership
				? [call.initiatorId, membership.otherUser.id]
				: [call.initiatorId];
			await UserEvents.emitToMany(env, audience, "call:ended", {
				call: buildCallSummary(closed),
				roomId: call.roomId,
			});
		}
		return { success: true as const, message: callMessages.CALL_ENDED };
	}
}

export default CallService;
