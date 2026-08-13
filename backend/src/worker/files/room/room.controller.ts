import type { Context } from "hono";
import RoomService from "./room.service";
import { AppError } from "../../utils/errors";
import { respond } from "../../core/response";
import { StatusCodes } from "../../constants";
import { verifyWsToken } from "../../utils/auth";
import { RoomEvents } from "../../utils/roomEvents";
import { generalMessages } from "../../core/messages";
import type { AppEnv } from "../../core/types";
import type { ICreateDmBody, IListRoomsQuery } from "./room.validation";

type CreateDmContext = Context<
	AppEnv,
	string,
	{ in: { json: ICreateDmBody }; out: { json: ICreateDmBody } }
>;

type ListRoomsContext = Context<
	AppEnv,
	string,
	{ in: { query: IListRoomsQuery }; out: { query: IListRoomsQuery } }
>;

export const createDmController = async (c: CreateDmContext) => {
	const actor = c.get("actor");
	const body = c.req.valid("json");
	const result = await RoomService.findOrCreateDm(c.env, body, actor);
	if (!result.success) {
		throw new AppError(result.message, StatusCodes.NOT_FOUND);
	}
	return respond(
		c,
		result.data.isNew ? StatusCodes.CREATED : StatusCodes.SUCCESS,
		{ success: true, message: result.message, data: result.data },
	);
};

export const listRoomsController = async (c: ListRoomsContext) => {
	const actor = c.get("actor");
	const query = c.req.valid("query");
	const result = await RoomService.listRooms(c.env, query, actor);
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

export const roomSocketController = async (c: Context<AppEnv>) => {
	if (c.req.header("Upgrade") !== "websocket") {
		throw new AppError("Expected a websocket upgrade", StatusCodes.BAD_REQUEST);
	}
	const roomId = c.req.param("roomId");
	const token = c.req.query("token") ?? "";
	const clerkId = await verifyWsToken(c.env, token);
	if (!clerkId) {
		throw new AppError(
			generalMessages.UNAUTHENTICATED,
			StatusCodes.UNAUTHORIZED,
		);
	}
	const result = await RoomService.authorizeSocket(c.env, roomId, clerkId);
	if (!result.success) {
		throw new AppError(result.message, StatusCodes.FORBIDDEN);
	}
	return RoomEvents.connect(c.env, roomId, c.req.raw, result.data.userId);
};
