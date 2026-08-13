import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { translateLive, speakLive } from "./live.validation";
import {
	translateLiveController,
	speakLiveController,
} from "./live.controller";
import { validationHook } from "../../utils/validation";
import type { AppEnv } from "../../core/types";

const liveRoutes = new Hono<AppEnv>();

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
