import type { Context } from "hono";
import CallService from "./call.service";
import { AppError } from "../../utils/errors";
import { respond } from "../../core/response";
import { StatusCodes } from "../../constants";
import { callMessages } from "./call.messages";
import type { AppEnv } from "../../core/types";
import type { IEndCallBody, ITranslateCaptionBody } from "./call.validation";

type StartCallContext = Context<AppEnv, "/:roomId/calls">;

type CallIdContext = Context<AppEnv, "/:callId">;

type EndCallContext = Context<
	AppEnv,
	"/:callId/end",
	{ in: { json: IEndCallBody }; out: { json: IEndCallBody } }
>;

type TranslateCaptionContext = Context<
	AppEnv,
	"/:callId/captions",
	{ in: { json: ITranslateCaptionBody }; out: { json: ITranslateCaptionBody } }
>;

const failureStatus = (message: string) => {
	if (message === callMessages.CALL_NOT_FOUND) return StatusCodes.NOT_FOUND;
	if (message === callMessages.NOT_A_PARTICIPANT) return StatusCodes.FORBIDDEN;
	if (message === callMessages.CALL_ALREADY_RUNNING)
		return StatusCodes.BAD_REQUEST;
	if (message === callMessages.VIDEO_NOT_CONFIGURED)
		return StatusCodes.BAD_GATEWAY;
	if (message === callMessages.VIDEO_PROVIDER_FAILED)
		return StatusCodes.BAD_GATEWAY;
	return StatusCodes.BAD_REQUEST;
};

export const startCallController = async (c: StartCallContext) => {
	const actor = c.get("actor");
	const roomId = c.req.param("roomId");
	const result = await CallService.startCall(c.env, roomId, actor);
	if (!result.success) {
		throw new AppError(result.message, failureStatus(result.message));
	}
	return respond(c, StatusCodes.CREATED, {
		success: true,
		message: result.message,
		data: result.data,
	});
};

export const joinCallController = async (c: CallIdContext) => {
	const actor = c.get("actor");
	const callId = c.req.param("callId");
	const result = await CallService.joinCall(c.env, callId, actor);
	if (!result.success) {
		throw new AppError(result.message, failureStatus(result.message));
	}
	return respond(c, StatusCodes.SUCCESS, {
		success: true,
		message: result.message,
		data: result.data,
	});
};

export const declineCallController = async (c: CallIdContext) => {
	const actor = c.get("actor");
	const callId = c.req.param("callId");
	const result = await CallService.declineCall(c.env, callId, actor);
	if (!result.success) {
		throw new AppError(result.message, failureStatus(result.message));
	}
	return respond(c, StatusCodes.SUCCESS, {
		success: true,
		message: result.message,
		data: result.data,
	});
};

export const endCallController = async (c: EndCallContext) => {
	const actor = c.get("actor");
	const callId = c.req.param("callId");
	const body = c.req.valid("json");
	const result = await CallService.endCall(c.env, callId, body, actor);
	if (!result.success) {
		throw new AppError(result.message, failureStatus(result.message));
	}
	return respond(c, StatusCodes.SUCCESS, {
		success: true,
		message: result.message,
		data: result.data,
	});
};

export const translateCaptionController = async (
	c: TranslateCaptionContext,
) => {
	const actor = c.get("actor");
	const callId = c.req.param("callId");
	const body = c.req.valid("json");
	const result = await CallService.translateCaption(
		c.env,
		callId,
		body,
		actor,
	);
	if (!result.success) {
		if ("retryAfterSeconds" in result && result.retryAfterSeconds) {
			throw new AppError(result.message, StatusCodes.TOO_MANY_REQUESTS, {
				"Retry-After": String(result.retryAfterSeconds),
			});
		}
		throw new AppError(result.message, failureStatus(result.message));
	}
	c.header("X-Quota-Day-Remaining", String(result.data.remainingChars));
	return respond(c, StatusCodes.SUCCESS, {
		success: true,
		message: result.message,
		data: result.data,
	});
};
