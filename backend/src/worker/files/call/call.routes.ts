import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { endCall, translateCaption } from "./call.validation";
import {
	joinCallController,
	declineCallController,
	endCallController,
	translateCaptionController,
} from "./call.controller";
import { isAuthenticated } from "../../utils/auth";
import { validationHook } from "../../utils/validation";
import type { AppEnv } from "../../core/types";

const callRoutes = new Hono<AppEnv>();

callRoutes.use("*", isAuthenticated);

callRoutes.post("/:callId/join", joinCallController);

callRoutes.post("/:callId/decline", declineCallController);

callRoutes.post(
	"/:callId/end",
	zValidator("json", endCall, validationHook),
	endCallController,
);

callRoutes.post(
	"/:callId/captions",
	zValidator("json", translateCaption, validationHook),
	translateCaptionController,
);

export default callRoutes;
