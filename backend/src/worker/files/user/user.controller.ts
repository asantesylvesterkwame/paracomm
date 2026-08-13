import type { Context } from "hono";
import { getAuth } from "@hono/clerk-auth";
import UserService from "./user.service";
import { AppError } from "../../utils/errors";
import { respond } from "../../core/response";
import { StatusCodes } from "../../constants";
import type { AppEnv } from "../../core/types";
import type { IUpdateMeBody, ISearchUsersQuery } from "./user.validation";

type UpdateMeContext = Context<
	AppEnv,
	string,
	{ in: { json: IUpdateMeBody }; out: { json: IUpdateMeBody } }
>;

type SearchUsersContext = Context<
	AppEnv,
	string,
	{ in: { query: ISearchUsersQuery }; out: { query: ISearchUsersQuery } }
>;

export const getMeController = async (c: Context<AppEnv>) => {
	const actor = c.get("actor");
	const clerk = c.get("clerk");
	const result = await UserService.getMe(c.env, actor, clerk);
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
