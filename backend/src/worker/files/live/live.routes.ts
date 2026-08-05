import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { translateLive } from "./live.validation";
import { translateLiveController } from "./live.controller";
import { generalMessages } from "../../core/messages";
import { StatusCodes } from "../../constants";

const liveRoutes = new Hono<{ Bindings: Env }>();

liveRoutes.post(
	"/translations",
	zValidator("json", translateLive, (result, c) => {
		if (!result.success) {
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
	}),
	translateLiveController,
);

export default liveRoutes;
