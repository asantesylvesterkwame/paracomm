import type { Context } from "hono";
import UserService from "./user.service";
import { AppError } from "../../utils/errors";
import { respond } from "../../core/response";
import { StatusCodes } from "../../constants";
import { verifyWsToken } from "../../utils/auth";
import { UserEvents } from "../../utils/userEvents";
import { generalMessages } from "../../core/messages";
import type { AppEnv } from "../../core/types";
import type {
	IUpdateMeBody,
	ISearchUsersQuery,
	IGetMeQuery,
} from "./user.validation";

type UpdateMeContext = Context<
	AppEnv,
	string,
	{ in: { json: IUpdateMeBody }; out: { json: IUpdateMeBody } }
>;

type GetMeContext = Context<
	AppEnv,
	string,
	{ in: { query: IGetMeQuery }; out: { query: IGetMeQuery } }
>;

type SearchUsersContext = Context<
	AppEnv,
	string,
	{ in: { query: ISearchUsersQuery }; out: { query: ISearchUsersQuery } }
>;

export const getMeController = async (c: GetMeContext) => {
	const actor = c.get("actor");
	const clerk = c.get("clerk");
	const locale =
		c.req.valid("query").locale ?? c.req.header("accept-language") ?? null;
	const result = await UserService.getMe(c.env, actor, clerk, locale);
	if (!result.success) {
		throw new AppError(result.message, StatusCodes.NOT_FOUND);
	}
	return respond(
		c,
		result.data.isNew ? StatusCodes.CREATED : StatusCodes.SUCCESS,
		{ success: true, message: result.message, data: result.data },
	);
};

export const updateMeController = async (c: UpdateMeContext) => {
	const actor = c.get("actor");
	const body = c.req.valid("json");
	const result = await UserService.updateMe(c.env, body, actor);
	if (!result.success) {
		throw new AppError(result.message, StatusCodes.NOT_FOUND);
	}
	return respond(c, StatusCodes.SUCCESS, {
		success: true,
		message: result.message,
		data: result.data,
	});
};

export const searchUsersController = async (c: SearchUsersContext) => {
	const actor = c.get("actor");
	const query = c.req.valid("query");
	const result = await UserService.search(c.env, query, actor);
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

export const userSocketController = async (c: Context<AppEnv>) => {
	if (c.req.header("Upgrade") !== "websocket") {
		throw new AppError("Expected a websocket upgrade", StatusCodes.BAD_REQUEST);
	}
	const token = c.req.query("token") ?? "";
	const clerkId = await verifyWsToken(c.env, token);
	if (!clerkId) {
		throw new AppError(
			generalMessages.UNAUTHENTICATED,
			StatusCodes.UNAUTHORIZED,
		);
	}
	const result = await UserService.authorizeSocket(c.env, clerkId);
	if (!result.success) {
		throw new AppError(result.message, StatusCodes.FORBIDDEN);
	}
	return UserEvents.connect(c.env, result.data.userId, c.req.raw);
};
