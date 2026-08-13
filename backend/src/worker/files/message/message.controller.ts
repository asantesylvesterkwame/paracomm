import type { Context } from "hono";
import MessageService from "./message.service";
import { AppError } from "../../utils/errors";
import { respond } from "../../core/response";
import { StatusCodes } from "../../constants";
import type { AppEnv } from "../../core/types";
import type {
	ISendMessageBody,
	IListMessagesQuery,
	IMarkSeenBody,
} from "./message.validation";

type SendMessageContext = Context<
	AppEnv,
	string,
	{ in: { json: ISendMessageBody }; out: { json: ISendMessageBody } }
>;

type ListMessagesContext = Context<
	AppEnv,
	string,
	{ in: { query: IListMessagesQuery }; out: { query: IListMessagesQuery } }
>;

type MarkSeenContext = Context<
	AppEnv,
	string,
	{ in: { json: IMarkSeenBody }; out: { json: IMarkSeenBody } }
>;

export const sendMessageController = async (c: SendMessageContext) => {
	const actor = c.get("actor");
	const body = c.req.valid("json");
	const result = await MessageService.sendMessage(
		c.env,
		c.executionCtx,
		c.req.param("roomId"),
		body,
		actor,
	);
	if (!result.success) {
		if ("code" in result && result.code === "RATE_MINUTE") {
			throw new AppError(result.message, StatusCodes.TOO_MANY_REQUESTS, {
				"Retry-After": String(result.retryAfterSeconds),
			});
		}
		throw new AppError(result.message, StatusCodes.NOT_FOUND);
	}
	return respond(c, StatusCodes.CREATED, {
		success: true,
		message: result.message,
		data: result.data,
	});
};

export const listMessagesController = async (c: ListMessagesContext) => {
	const actor = c.get("actor");
	const query = c.req.valid("query");
	const result = await MessageService.listMessages(
		c.env,
		c.req.param("roomId"),
		query,
		actor,
	);
	if (!result.success) {
		throw new AppError(result.message, StatusCodes.NOT_FOUND);
	}
	return respond(c, StatusCodes.SUCCESS, {
		success: true,
		message: result.message,
		data: result.data,
		count: result.count,
	});
};

export const markSeenController = async (c: MarkSeenContext) => {
	const actor = c.get("actor");
	const body = c.req.valid("json");
	const result = await MessageService.markSeen(
		c.env,
		c.req.param("roomId"),
		body,
		actor,
	);
	if (!result.success) {
		throw new AppError(result.message, StatusCodes.NOT_FOUND);
	}
	return respond(c, StatusCodes.SUCCESS, {
		success: true,
		message: result.message,
		data: result.data,
	});
};

export const retryTranslationController = async (c: Context<AppEnv>) => {
	const actor = c.get("actor");
	const result = await MessageService.retryTranslation(
		c.env,
		c.executionCtx,
		c.req.param("roomId"),
		c.req.param("messageId"),
		actor,
	);
	if (!result.success) {
		throw new AppError(result.message, StatusCodes.NOT_FOUND);
	}
	return respond(c, StatusCodes.SUCCESS, {
		success: true,
		message: result.message,
		data: result.data,
	});
};
