import type { Context } from "hono";
import VoiceNoteService from "./voice-note.service";
import { AppError } from "../../utils/errors";
import { respond } from "../../core/response";
import { StatusCodes } from "../../constants";
import { MEDIA_CACHE_CONTROL } from "./voice-note.constants";
import type { AppEnv } from "../../core/types";
import type {
	ISendVoiceNoteBody,
	IRequestDubBody,
	IGetVoiceNoteMediaQuery,
} from "./voice-note.validation";

type SendVoiceNoteContext = Context<
	AppEnv,
	"/:roomId/voice-notes",
	{ in: { form: ISendVoiceNoteBody }; out: { form: ISendVoiceNoteBody } }
>;

type VoiceNoteMediaContext = Context<
	AppEnv,
	"/:roomId/voice-notes/:voiceNoteId/media",
	{
		in: { query: IGetVoiceNoteMediaQuery };
		out: { query: IGetVoiceNoteMediaQuery };
	}
>;

type RequestDubContext = Context<
	AppEnv,
	"/:roomId/messages/:messageId/dubs",
	{ in: { json: IRequestDubBody }; out: { json: IRequestDubBody } }
>;

interface IFailure {
	message: string;
	code?: string;
	retryAfterSeconds?: number;
	remaining?: number;
}

const throwFailure = (result: IFailure): never => {
	if (result.code === "RATE_MINUTE" || result.code === "RATE_DAY") {
		throw new AppError(result.message, StatusCodes.TOO_MANY_REQUESTS, {
			"Retry-After": String(result.retryAfterSeconds ?? 60),
			...(result.code === "RATE_DAY"
				? { "X-Quota-Day-Remaining": String(result.remaining ?? 0) }
				: {}),
		});
	}
	if (result.code === "NOT_CONFIGURED") {
		throw new AppError(result.message, StatusCodes.BAD_GATEWAY);
	}
	if (result.code === "SAME_LANGUAGE" || result.code === "UNSUPPORTED") {
		throw new AppError(result.message, StatusCodes.BAD_REQUEST);
	}
	throw new AppError(result.message, StatusCodes.NOT_FOUND);
};

export const sendVoiceNoteController = async (c: SendVoiceNoteContext) => {
	const actor = c.get("actor");
	const body = c.req.valid("form");
	const result = await VoiceNoteService.sendVoiceNote(
		c.env,
		c.executionCtx,
		c.req.param("roomId"),
		body,
		actor,
	);
	if (!result.success) return throwFailure(result);
	if ("remainingSeconds" in result) {
		c.header("X-Quota-Day-Remaining", String(result.remainingSeconds));
	}
	return respond(c, StatusCodes.CREATED, {
		success: true,
		message: result.message,
		data: result.data,
	});
};

export const requestDubController = async (c: RequestDubContext) => {
	const actor = c.get("actor");
	const body = c.req.valid("json");
	const result = await VoiceNoteService.requestDub(
		c.env,
		c.executionCtx,
		c.req.param("roomId"),
		c.req.param("messageId"),
		body,
		actor,
	);
	if (!result.success) return throwFailure(result);
	return respond(c, StatusCodes.SUCCESS, {
		success: true,
		message: result.message,
		data: result.data,
	});
};

export const streamVoiceNoteMediaController = async (
	c: VoiceNoteMediaContext,
) => {
	const actor = c.get("actor");
	const query = c.req.valid("query");
	const result = await VoiceNoteService.streamMedia(
		c.env,
		c.req.param("roomId"),
		c.req.param("voiceNoteId"),
		query,
		actor,
	);
	if (!result.success) return throwFailure(result);
	const { object, mimeType } = result.data;
	return new Response(object.body, {
		status: StatusCodes.SUCCESS,
		headers: {
			"Content-Type": mimeType,
			"Content-Length": String(object.size),
			"Cache-Control": MEDIA_CACHE_CONTROL,
			ETag: object.httpEtag,
		},
	});
};
