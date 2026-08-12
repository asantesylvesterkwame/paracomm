import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import type { Context } from "hono";
import { translateLive, speakLive } from "./live.validation";
import {
	translateLiveController,
	speakLiveController,
} from "./live.controller";
import { generalMessages } from "../../core/messages";
import { StatusCodes } from "../../constants";

const liveRoutes = new Hono<{ Bindings: Env }>();

const validationHook = (
	result: {
		success: boolean;
		error?: { issues: { path: PropertyKey[]; message: string }[] };
	},
	c: Context,
) => {
	if (!result.success && result.error) {
		return c.json(
			{
				success: false,
				message: generalMessages.VALIDATION_FAILED,
				errors: result.error.issues.map((issue) => ({
					field: issue.path.join("."),
					message: issue.message,
				})),
			},
			StatusCodes.UNPROCESSABLE,
		);
	}
};

liveRoutes.post(
	"/translations",
	zValidator("json", translateLive, validationHook),
	translateLiveController,
);

liveRoutes.post(
	"/speech",
	zValidator("json", speakLive, validationHook),
	speakLiveController,
);

export default liveRoutes;
