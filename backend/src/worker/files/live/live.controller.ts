import type { Context } from "hono";
import LiveService from "./live.service";
import { AppError } from "../../utils/errors";
import { respond } from "../../core/response";
import { StatusCodes } from "../../constants";
import type { ITranslateLiveBody } from "./live.validation";

type TranslateLiveContext = Context<
	{ Bindings: Env },
	string,
	{ in: { json: ITranslateLiveBody }; out: { json: ITranslateLiveBody } }
>;

export const translateLiveController = async (c: TranslateLiveContext) => {
	const body = c.req.valid("json");
	const clientIp = c.req.header("cf-connecting-ip") ?? "local";
	const result = await LiveService.translate(c.env, body, clientIp);

	if (!result.success) {
		if (result.code === "PROVIDER") {
			throw new AppError(result.message, StatusCodes.BAD_GATEWAY);
		}
		const headers: Record<string, string> = {
			"Retry-After": String(result.retryAfterSeconds),
		};
		if ("remaining" in result && result.remaining !== undefined) {
			headers["X-Quota-Day-Remaining"] = String(result.remaining);
		}
		throw new AppError(result.message, StatusCodes.TOO_MANY_REQUESTS, headers);
	}

	c.header("X-Quota-Day-Remaining", String(result.remaining));
	return respond(c, StatusCodes.SUCCESS, {
		success: true,
		message: result.message,
		data: result.data,
	});
};
